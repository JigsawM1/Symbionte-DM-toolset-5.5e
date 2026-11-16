import { EsquemaMensajeSyncV4, GRUPOS_SYNC_V4, type EntidadSyncV4, type GrupoSyncV4, type MetaSyncV4 } from '@/tipos/protocoloSync';
import type { FragmentoCliente, InfoCliente } from '@/tipos/talespire';
import type { EstadoConexionSyncV4, MemoriaSyncV4 } from '@/tipos/estadoSyncV4';
import { ArbitroPropuestasSyncV4 } from './arbitroPropuestasSyncV4';
import { BufferTransporteSyncV4 } from './bufferTransporteSyncV4';
import { ColaOptimistaSyncV4 } from './colaOptimistaSyncV4';
import { guardarMemoriaMotor, conservarLocalesIniciales, recuperarEntidadArchivada, estadoVistaSyncV4 } from './contextosSyncV4';
import { EleccionDirectorSyncV4 } from './eleccionDirectorSyncV4';
import {
  clasificarErrorSyncV4, despacharMensajeSyncV4, enviarMensajeFragmentadoSyncV4,
  generarIdSyncV4, registrarErrorParseoSyncV4, registrarErrorSyncV4,
  type MapaManejadoresSyncV4, type MensajeNoFragSyncV4,
} from './erroresTransporteSyncV4';
import { GestorReintentosSync } from './gestorReintentosSync';
import { igualesGrupoSyncV4, edicionLocalSyncV4, metaDisponibleSyncV4 } from './reconciliacionSyncV4';
import { ReplicaSyncV4 } from './replicaSyncV4';
import { SnapshotsSyncV4 } from './snapshotsSyncV4';

export interface DatosLocalesSyncV4 { entidades: EntidadSyncV4[]; meta: MetaSyncV4 }
export interface DependenciasMotorSyncV4 {
  cliente: FragmentoCliente;
  campania: string;
  tablero: string;
  miembros: InfoCliente[];
  consultar: (id: string) => Promise<InfoCliente | undefined>;
  propiedades: (jugador: string) => Promise<Set<string>>;
  enviar: (texto: string, destino: string) => Promise<boolean>;
  leer: () => DatosLocalesSyncV4;
  aplicar: (datos: DatosLocalesSyncV4) => void;
  guardar: (memoria: MemoriaSyncV4[string]) => void;
  mostrar: (estado: EstadoConexionSyncV4) => void;
  notificar: (texto: string) => void;
  memoria?: MemoriaSyncV4[string];
}

const REVISIONES_VACIAS = { vitalidad: 0, estados: 0, datos: 0, acompanantes: 0 };

/** Un motor por apertura y tablero. Las esperas nunca otorgan vigencia a una sesión retirada. */
export class MotorSyncV4 {
  readonly replica: ReplicaSyncV4;
  private vivo = true;
  private revision = 0;
  private recuperando = true;
  private meta: MetaSyncV4;
  private lectura: Map<string, EntidadSyncV4> | undefined;
  private cadena: Promise<void> = Promise.resolve();
  private ultimoAvisoVersion = -Infinity;
  private readonly reintentos: GestorReintentosSync;
  private readonly fragmentos: BufferTransporteSyncV4;
  private readonly snapshots: SnapshotsSyncV4;
  private readonly eleccion: EleccionDirectorSyncV4;
  private readonly arbitro: ArbitroPropuestasSyncV4;
  private readonly cola: ColaOptimistaSyncV4;
  private readonly manejadores: MapaManejadoresSyncV4;

  constructor(private readonly deps: DependenciasMotorSyncV4) {
    this.replica = new ReplicaSyncV4(deps.memoria);
    this.meta = deps.memoria?.metaConfirmada ?? deps.leer().meta;
    this.reintentos = new GestorReintentosSync(() => {
      if (this.vivo) deps.notificar('No se confirmó el cambio. Tu edición sigue disponible en sincronización.');
    });
    this.fragmentos = new BufferTransporteSyncV4(() => this.reintentos.continuarReintentosREQ());
    this.snapshots = new SnapshotsSyncV4(() => this.reintentos.continuarReintentosREQ());
    const base = {
      clienteId: deps.cliente.id, replica: this.replica, estaVivo: () => this.vivo, soyDirector: () => this.soyDirector,
      obtenerMiembro: (id: string) => this.eleccion.obtenerMiembro(id), obtenerRevision: () => this.revision,
      establecerMeta: (m: MetaSyncV4) => { this.meta = m; }, sobre: () => this.eleccion.sobre(),
      enviar: (m: MensajeNoFragSyncV4, d?: string) => this.enviar(m, d),
      ejecutar: (op: string, acc: () => Promise<unknown>) => this.ejecutar(op, acc),
      aplicar: () => this.aplicar(), mostrar: () => this.mostrar(), notificar: (t: string) => deps.notificar(t),
    };
    this.eleccion = new EleccionDirectorSyncV4({
      ...base, campania: deps.campania, tablero: deps.tablero, miembrosIniciales: deps.miembros,
      alActivarDirector: sesion => this.activar(sesion),
      alPerderDirector: () => this.reiniciarEstadoRecepcion(false),
      alInvalidarPorRelevo: () => { this.recuperando = true; this.cola.cancelarEmisiones(); },
      alAdoptarContextoRemoto: () => { this.reiniciarEstadoRecepcion(true); },
      alRecibirHolaComoDirector: desdeId => this.arbitro.enviarSnapshot(desdeId),
    });
    this.cola = new ColaOptimistaSyncV4({
      ...base, jugadorId: deps.cliente.player.id, reintentos: this.reintentos,
      estaRecuperando: () => this.recuperando, obtenerDirector: () => this.eleccion.contexto.director,
      establecerRevision: r => { this.revision = r; }, solicitar: () => this.solicitar(),
      procesarPropuestaLocal: (p, yo) => this.arbitro.procesarPropuesta(p, yo),
    });
    this.arbitro = new ArbitroPropuestasSyncV4({
      ...base, sesionActual: () => this.eleccion.contexto.sesion,
      propiedades: j => deps.propiedades(j), avanzarRevision: () => ++this.revision,
      obtenerMeta: () => this.meta, obtenerLocalEmitida: op => this.cola.obtenerLocalEmitida(op),
      alResultadoPropio: (op, res) => { this.cola.resultados.set(op, res); this.cola.aplicarResultados(); this.aplicar(); },
    });
    this.manejadores = this.crearManejadores();
  }

  get soyDirector(): boolean { return this.eleccion.soyDirector; }
  iniciar(): void { this.eleccion.iniciarLatido(() => this.solicitar()); }
  votar(candidato: string): Promise<void> { return this.eleccion.votar(candidato); }
  actualizarMiembros(miembros: InfoCliente[]): void { this.eleccion.actualizarMiembros(miembros); }
  solicitar(): void { if (this.vivo && !this.soyDirector) this.reintentos.iniciarReintentosREQ(() => this.emitirSolicitud()); }
  recibir(datos: unknown, desde?: FragmentoCliente): Promise<void> {
    this.cadena = this.cadena.then(() => this.procesar(datos, desde)).catch(error => {
      registrarErrorSyncV4({ codigo: 'PROCESAMIENTO_INTERNO', operacion: 'recibir', causa: error });
    });
    return this.cadena;
  }
  reintentar(): void { this.cola.reintentar(); }
  exportarPendientes(): Record<string, EntidadSyncV4> { return structuredClone(this.replica.pendientes); }
  descartar(id: string): void { this.cola.descartar(id); }
  resolver(id: string, grupo: GrupoSyncV4, eleccion: 'local' | 'compartido', revision: number): boolean {
    return this.cola.resolver(id, grupo, eleccion, revision);
  }

  async recuperar(entidad: EntidadSyncV4): Promise<boolean> {
    if (!this.vivo || this.recuperando) return false;
    const ok = await recuperarEntidadArchivada(
      this.replica, entidad, this.deps.leer().entidades, this.deps.cliente.player.id,
      () => this.deps.propiedades(this.deps.cliente.player.id),
      () => this.vivo && this.deps.leer().entidades.some(e =>
        (e.id === entidad.id && e.ficha === entidad.ficha) || (!!entidad.padre && e.id === entidad.padre)),
    );
    if (ok && this.vivo) this.aplicar();
    return ok;
  }

  observar(): void {
    if (!this.vivo) return;
    const local = this.deps.leer();
    const anterior = this.lectura;
    const revisionAnterior = this.revision;
    if (!anterior && !this.soyDirector) { this.lectura = new Map(local.entidades.map(e => [e.id, e])); this.mostrar(); return; }
    local.entidades = local.entidades.map(e =>
      edicionLocalSyncV4(e, anterior?.get(e.id), this.replica.pendientes[e.id] ?? this.replica.base[e.id]));
    const edicion = this.soyDirector ? this.observarComoDirector(local) : this.observarComoJugador(local.entidades, anterior);
    this.lectura = new Map(this.deps.leer().entidades.map(e => [e.id, e]));
    if (this.soyDirector && revisionAnterior !== this.revision) this.aplicar();
    else if (edicion) guardarMemoriaMotor(this.deps, this.replica, this.meta, this.revision);
    this.mostrar(); this.cola.programarPropuesta();
  }

  destruir(): void {
    this.vivo = false;
    this.eleccion.destruir(); this.cola.destruir(); this.reintentos.destruir();
    this.fragmentos.limpiar(); this.snapshots.limpiar();
    guardarMemoriaMotor(this.deps, this.replica, this.meta, this.revision);
  }

  private ejecutar(operacion: string, accion: () => Promise<unknown>, destino?: string): void {
    void accion().catch(error => {
      registrarErrorSyncV4(clasificarErrorSyncV4(error, operacion, destino));
      if (this.vivo) this.deps.notificar('No se pudo completar la sincronización; se conservan los cambios pendientes.');
    });
  }
  private emitirSolicitud(): void {
    this.ejecutar('hola', () => this.enviar({ ...this.eleccion.sobre(), t: 'HOLA', solicitud: generarIdSyncV4() }));
  }
  private enviar(mensaje: MensajeNoFragSyncV4, destino = 'board'): Promise<boolean> {
    return enviarMensajeFragmentadoSyncV4({
      mensaje, destino, sesionActual: () => this.eleccion.contexto.sesion,
      estaVivo: () => this.vivo, enviarTexto: (texto, dst) => this.deps.enviar(texto, dst),
    });
  }
  private reiniciarEstadoRecepcion(reconectar: boolean): void {
    if (reconectar) this.revision = 0;
    this.recuperando = true;
    this.cola.revisionAnunciada = 0;
    this.cola.cancelarEmisiones();
    this.fragmentos.limpiar();
    this.snapshots.limpiar();
    this.cola.diferidos.clear();
    if (reconectar) { this.reintentos.cancelarReintentosREQ(); this.solicitar(); }
  }
  private activar(sesion: string): void {
    this.cola.cancelarEmisiones(); this.eleccion.establecerDirectorLocal(sesion);
    this.recuperando = false; this.revision = 0;
    const locales = this.deps.leer().entidades;
    // Un relevo parte del último estado confirmado; una edición pendiente no adquiere autoridad al elegir director.
    if (!Object.keys(this.replica.base).length) for (const entidad of locales) this.replica.base[entidad.id] = structuredClone(entidad);
    this.revision = Math.max(this.deps.memoria?.revisionConfirmada ?? 0, ...Object.values(this.replica.base).map(e => e.revision));
    guardarMemoriaMotor(this.deps, this.replica, this.meta, this.revision);
    this.ejecutar('anuncio', () => this.eleccion.anunciar());
  }
  private crearManejadores(): MapaManejadoresSyncV4 {
    return {
      DIRECCION: (m, c) => this.eleccion.procesarDireccion(m, c),
      HOLA: (_m, c) => this.eleccion.procesarHola(c.id),
      PROPUESTA: async (m, c) => { if (this.esContextoActivo(m) && this.soyDirector) await this.arbitro.procesarPropuesta(m, c); },
      RESULTADO: (m, c) => { if (this.esDeDirectorActivo(m, c) && this.cola.registrarResultado(m)) { this.aplicar(); this.cola.programarPropuesta(); } },
      LOTE: (m, c) => { if (this.esDeDirectorActivo(m, c)) this.procesarLote(m); },
      LATIDO: (m, c) => { if (this.esDeDirectorActivo(m, c)) { this.cola.revisionAnunciada = Math.max(this.cola.revisionAnunciada, m.revision); this.cola.esperarOrden(); } },
      CONFIRMADO: (m, c) => { if (this.esDeDirectorActivo(m, c)) this.procesarCambio(m); },
      COMBATE: (m, c) => { if (this.esDeDirectorActivo(m, c)) this.procesarCambio(m); },
    };
  }
  private async procesar(datos: unknown, desde?: FragmentoCliente): Promise<void> {
    if (!this.vivo || !desde?.id || !desde.player?.id || desde.id === this.deps.cliente.id) return;
    if (!this.eleccion.contieneMiembro(desde.id)) return;
    const cliente = await this.deps.consultar(desde.id);
    if (!this.vivo || !cliente || cliente.player.id !== desde.player.id || cliente.clientMode === 'spectator') return;
    const parseo = EsquemaMensajeSyncV4.safeParse(datos);
    if (!parseo.success) {
      this.ultimoAvisoVersion = registrarErrorParseoSyncV4(datos, desde.id, parseo.error.message, this.ultimoAvisoVersion, t => this.deps.notificar(t));
      return;
    }
    const m = parseo.data;
    if (m.emisor !== desde.id || m.contexto.campania !== this.eleccion.contexto.campania
      || m.contexto.tablero !== this.eleccion.contexto.tablero) return;
    if (m.t === 'FRAG') { await this.procesarFragmento(m, desde); return; }
    if (!this.eleccion.validarSesionEmisor(desde.id, m)) return;
    await despacharMensajeSyncV4(this.manejadores, m, cliente);
  }
  private async procesarFragmento(m: Extract<ReturnType<typeof EsquemaMensajeSyncV4.parse>, { t: 'FRAG' }>, desde: FragmentoCliente): Promise<void> {
    const resultado = this.fragmentos.registrar(desde.id, m);
    if (resultado.estado === 'completo') { await this.procesar(resultado.mensaje, desde); return; }
    if (resultado.estado === 'progreso' && m.tipoMensaje === 'LOTE'
      && m.contexto.sesion === this.eleccion.contexto.sesion && desde.id === this.eleccion.contexto.director) {
      const sep = m.id.lastIndexOf('.');
      if (this.snapshots.progresar(m.id.slice(0, sep), Number(m.id.slice(sep + 1)))) this.reintentos.pausarReintentosREQ(() => this.emitirSolicitud());
    }
  }
  private esContextoActivo(m: MensajeNoFragSyncV4): boolean {
    return m.contexto.sesion === this.eleccion.contexto.sesion && m.contexto.director === this.eleccion.contexto.director;
  }
  private esDeDirectorActivo(m: MensajeNoFragSyncV4, cliente: InfoCliente): boolean {
    return this.esContextoActivo(m) && cliente.id === this.eleccion.contexto.director && cliente.clientMode === 'gm' && !this.soyDirector;
  }
  private procesarLote(m: Extract<MensajeNoFragSyncV4, { t: 'LOTE' }>): void {
    if (m.revision < this.revision) return;
    const snapshot = this.snapshots.registrar(m);
    if (!snapshot) { if (this.snapshots.huboProgreso) this.reintentos.pausarReintentosREQ(() => this.emitirSolicitud()); return; }
    conservarLocalesIniciales(this.replica, this.deps.leer().entidades, snapshot, this.deps.cliente.player.id);
    for (const entidad of snapshot.entidades) {
      const propia = [...this.cola.resultados.values()].find(r => r.estado === 'aplicado' && r.entidad?.id === entidad.id);
      this.replica.recibir(entidad, propia ? this.cola.obtenerLocalEmitida(propia.operacion) : undefined);
    }
    const ids = new Set(snapshot.entidades.map(e => e.id));
    for (const id of Object.keys(this.replica.base)) if (!ids.has(id)) delete this.replica.base[id];
    this.meta = snapshot.meta; this.revision = snapshot.revision; this.recuperando = false;
    this.reintentos.cancelarReintentosREQ(); this.finalizarCicloEstado();
  }
  private procesarCambio(m: Extract<MensajeNoFragSyncV4, { t: 'CONFIRMADO' | 'COMBATE' }>): void {
    if (m.revision <= this.revision) return;
    this.cola.revisionAnunciada = Math.max(this.cola.revisionAnunciada, m.revision);
    if (this.recuperando || this.snapshots.enCurso() || m.revision !== this.revision + 1) { this.cola.encolarDiferido(m); return; }
    this.cola.aplicarCambio(m); this.finalizarCicloEstado();
  }
  private finalizarCicloEstado(): void {
    this.cola.vaciarDiferidos(); this.cola.aplicarResultados(); this.aplicar(); this.cola.programarPropuesta();
  }
  private observarComoDirector(local: DatosLocalesSyncV4): boolean {
    for (const entidad of local.entidades) {
      const base = this.replica.base[entidad.id];
      if (base?.eliminada || this.replica.pendientes[entidad.id]) continue;
      const cambios = GRUPOS_SYNC_V4.filter(g => !base || !igualesGrupoSyncV4(g, base.grupos, entidad.grupos));
      if (!cambios.length) continue;
      const revisiones = { ...(base?.revisiones ?? REVISIONES_VACIAS) };
      for (const g of cambios) revisiones[g] = this.revision + 1;
      this.arbitro.confirmar({ ...entidad, duenio: base?.duenio ?? entidad.duenio, revisiones });
      this.arbitro.retirarHijos(entidad);
    }
    const meta = metaDisponibleSyncV4(local.meta, Object.values(this.replica.base));
    if (JSON.stringify(this.meta) !== JSON.stringify(meta)) {
      this.meta = meta; const revision = ++this.revision;
      this.ejecutar('combate', () => this.enviar({ ...this.eleccion.sobre(), t: 'COMBATE', revision, meta: this.meta }));
    }
    return false;
  }
  private observarComoJugador(entidades: EntidadSyncV4[], anterior?: Map<string, EntidadSyncV4>): boolean {
    let edicion = false;
    for (const entidad of entidades) {
      if (entidad.duenio !== this.deps.cliente.player.id && this.replica.base[entidad.id]?.duenio !== this.deps.cliente.player.id) continue;
      const ant = anterior?.get(entidad.id);
      if (this.replica.base[entidad.id] || this.replica.pendientes[entidad.id]
        || !ant || entidad.eliminada !== ant.eliminada || GRUPOS_SYNC_V4.some(g => !igualesGrupoSyncV4(g, entidad.grupos, ant.grupos))) {
        edicion = this.replica.editar({ ...entidad, duenio: this.deps.cliente.player.id }) || edicion;
      }
    }
    return edicion;
  }
  private aplicar(): void {
    this.deps.aplicar({ entidades: this.replica.visibles(), meta: this.meta });
    guardarMemoriaMotor(this.deps, this.replica, this.meta, this.revision);
    this.lectura = new Map(this.deps.leer().entidades.map(e => [e.id, e]));
    this.mostrar();
  }
  private mostrar(): void {
    this.deps.mostrar(estadoVistaSyncV4(
      this.eleccion.contexto.director, this.recuperando, this.soyDirector,
      this.eleccion.gms, this.replica, this.deps.cliente.player.id, this.cola.bloqueadas,
    ));
  }
}
