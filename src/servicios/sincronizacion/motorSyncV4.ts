import {
  EsquemaMensajeSyncV4, GRUPOS_SYNC_V4,
  type ContextoSyncV4, type EntidadSyncV4, type GrupoSyncV4, type MensajeSyncV4, type MetaSyncV4,
} from '@/tipos/protocoloSync';
import type { FragmentoCliente, InfoCliente } from '@/tipos/talespire';
import type { EstadoConexionSyncV4, MemoriaSyncV4 } from '@/tipos/estadoSyncV4';
import { logger } from '@/utiles/logger';
import { BufferTransporteSyncV4, fragmentarMensajeSyncV4 } from './bufferTransporteSyncV4';
import { GestorReintentosSync } from './gestorReintentosSync';
import { igualesGrupoSyncV4, evaluarPropuestaSyncV4, edicionLocalSyncV4, metaDisponibleSyncV4 } from './reconciliacionSyncV4';
import { ReplicaSyncV4 } from './replicaSyncV4';
import { SnapshotsSyncV4 } from './snapshotsSyncV4';
import { guardarMemoriaMotor, conservarLocalesIniciales, recuperarEntidadArchivada, crearPropuestaPendiente, estadoVistaSyncV4 } from './contextosSyncV4';
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
type Mensaje = Exclude<MensajeSyncV4, { t: 'FRAG' }>;
type Propuesta = Extract<Mensaje, { t: 'PROPUESTA' }>;
type Cambio = Extract<Mensaje, { t: 'CONFIRMADO' | 'COMBATE' }>;
type Resultado = Extract<Mensaje, { t: 'RESULTADO' }>;
const vacias = { vitalidad: 0, estados: 0, datos: 0, acompanantes: 0 };

/** Un motor por apertura y tablero. Las esperas nunca otorgan vigencia a una sesión retirada. */
export class MotorSyncV4 {
  readonly replica: ReplicaSyncV4;
  private contexto: ContextoSyncV4;
  private apertura = crypto.randomUUID().replaceAll('-', '').slice(0, 16);
  private vivo = true;
  private revision = 0;
  private recuperando = true;
  private miembros: InfoCliente[];
  private aperturas = new Map<string, string>();
  private aperturasRetiradas = new Set<string>();
  private votos = new Map<string, string>();
  private relevoPendiente = false;
  private eleccionExplicita = false;
  private operaciones = new Map<string, { texto: string; resultado: Extract<Mensaje, { t: 'RESULTADO' }> }>();
  private emisiones = new Map<string, { propuesta: Propuesta; local: EntidadSyncV4 }>();
  private resultados = new Map<string, Resultado>();
  private diferidos = new Map<number, Cambio>();
  private retiradas = new Set<string>();
  private meta: MetaSyncV4;
  private lectura: Map<string, EntidadSyncV4> | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private debounce: ReturnType<typeof setTimeout> | undefined;
  private esperaOrden: ReturnType<typeof setTimeout> | undefined;
  private revisionAnunciada = 0;
  private cadena: Promise<void> = Promise.resolve();
  private ultimoAvisoVersion = -Infinity;
  private bloqueadas = new Set<string>();
  private enviandoSnapshots = new Set<string>();
  private reintentos: GestorReintentosSync;
  private fragmentos: BufferTransporteSyncV4;
  private snapshots: SnapshotsSyncV4;

  constructor(private readonly deps: DependenciasMotorSyncV4) {
    this.miembros = deps.miembros;
    this.replica = new ReplicaSyncV4(deps.memoria);
    this.meta = deps.memoria?.metaConfirmada ?? deps.leer().meta;
    this.contexto = { campania: deps.campania, tablero: deps.tablero, director: 'pendiente', sesion: 'pendiente' };
    this.reintentos = new GestorReintentosSync(() => {
      if (this.vivo) deps.notificar('No se confirmó el cambio. Tu edición sigue disponible en sincronización.');
    });
    this.fragmentos = new BufferTransporteSyncV4(() => this.reintentos.continuarReintentosREQ());
    this.snapshots = new SnapshotsSyncV4(() => this.reintentos.continuarReintentosREQ());
  }
  get soyDirector(): boolean { return this.vivo && this.contexto.director === this.deps.cliente.id; }
  private get gms(): InfoCliente[] { return this.miembros.filter(c => c.clientMode === 'gm'); }
  private sobre() { return { v: 4 as const, contexto: { ...this.contexto }, emisor: this.deps.cliente.id, sesionEmisor: this.apertura }; }
  private ejecutar(accion: () => Promise<unknown>): void {
    void accion().catch(error => { logger.error('[Sync v4] Operación fallida:', error);
      if (this.vivo) this.deps.notificar('No se pudo completar la sincronización; se conservan los cambios pendientes.'); });
  }
  iniciar(): void {
    if (this.gms.length === 1 && this.gms[0].id === this.deps.cliente.id) this.activar(this.apertura);
    this.solicitar();
    this.timer = setInterval(() => {
      if (this.soyDirector) this.ejecutar(async () => {
        await this.anunciar(); return this.enviar({ ...this.sobre(), t: 'LATIDO', revision: this.revision });
      });
    }, 5000);
    this.mostrar();
  }
  private activar(sesion: string): void {
    this.cancelarEmisiones();
    this.contexto = { ...this.contexto, director: this.deps.cliente.id, sesion };
    this.recuperando = false;
    this.revision = 0;
    const locales = this.deps.leer().entidades;
    // Un relevo parte del último estado confirmado; una edición pendiente no adquiere autoridad al elegir director.
    if (!Object.keys(this.replica.base).length) for (const entidad of locales) this.replica.base[entidad.id] = structuredClone(entidad);
    this.revision = Math.max(this.deps.memoria?.revisionConfirmada ?? 0, ...Object.values(this.replica.base).map(e => e.revision));
    guardarMemoriaMotor(this.deps, this.replica, this.meta, this.revision);
    this.ejecutar(() => this.anunciar());
  }
  async votar(candidato: string): Promise<void> {
    if (!this.gms.some(c => c.id === this.deps.cliente.id) || !this.gms.some(c => c.id === candidato)) return;
    this.votos.set(this.deps.cliente.id, candidato);
    this.eleccionExplicita = true;
    await this.enviar({ ...this.sobre(), t: 'DIRECCION', fase: 'voto', candidato });
    this.comprobarVotos();
  }
  private comprobarVotos(): void {
    const candidato = this.votos.get(this.deps.cliente.id);
    if (!candidato || !this.gms.every(gm => this.votos.get(gm.id) === candidato)) { this.mostrar(); return; }
    if (candidato === this.deps.cliente.id && !this.soyDirector) this.activar(crypto.randomUUID().replaceAll('-', '').slice(0, 16));
  }
  actualizarMiembros(miembros: InfoCliente[]): void {
    this.miembros = miembros;
    if (this.contexto.director !== 'pendiente' && !this.gms.some(c => c.id === this.contexto.director)) {
      this.retiradas.add(this.contexto.sesion);
      this.contexto = { ...this.contexto, director: 'pendiente', sesion: 'pendiente' };
      this.recuperando = true;
      this.revisionAnunciada = 0;
      this.cancelarEmisiones(); this.fragmentos.limpiar(); this.snapshots.limpiar(); this.diferidos.clear();
      this.votos.clear();
      this.relevoPendiente = true;
      this.deps.notificar('El director ya no está disponible. Elige quién asumirá el combate.');
    }
    this.mostrar();
  }
  private async anunciar(): Promise<boolean> {
    return this.enviar({ ...this.sobre(), t: 'DIRECCION', fase: 'anuncio', candidato: this.deps.cliente.id });
  }
  solicitar(): void {
    if (!this.vivo || this.soyDirector) return;
    this.reintentos.iniciarReintentosREQ(() => this.emitirSolicitud());
  }
  private emitirSolicitud(): void {
    this.ejecutar(() => this.enviar({ ...this.sobre(), t: 'HOLA', solicitud: crypto.randomUUID().replaceAll('-', '').slice(0, 16) }));
  }
  private async enviar(mensaje: Mensaje, destino = 'board'): Promise<boolean> {
    const sesion = this.contexto.sesion;
    for (const texto of fragmentarMensajeSyncV4(mensaje, crypto.randomUUID().replaceAll('-', '').slice(0, 16))) {
      if (!this.vivo || sesion !== this.contexto.sesion) return false;
      if (!await this.deps.enviar(texto, destino)) return false;
    }
    return this.vivo && sesion === this.contexto.sesion;
  }
  recibir(datos: unknown, desde?: FragmentoCliente): Promise<void> {
    this.cadena = this.cadena.then(() => this.procesar(datos, desde)).catch(error => {
      logger.error('[Sync v4] Mensaje entrante rechazado por error:', error);
    });
    return this.cadena;
  }
  private async procesar(datos: unknown, desde?: FragmentoCliente): Promise<void> {
    if (!this.vivo || !desde?.id || !desde.player?.id || desde.id === this.deps.cliente.id) return;
    if (!this.miembros.some(c => c.id === desde.id)) return;
    const cliente = await this.deps.consultar(desde.id);
    if (!this.vivo || !cliente || cliente.player.id !== desde.player.id || cliente.clientMode === 'spectator') return;
    const parseo = EsquemaMensajeSyncV4.safeParse(datos);
    if (!parseo.success) {
      if (typeof datos === 'object' && datos !== null && 'v' in datos && datos.v !== 4 && Date.now() - this.ultimoAvisoVersion > 60000) {
        this.ultimoAvisoVersion = Date.now(); this.deps.notificar('Toda la mesa debe actualizar ToolSet: la sincronización requiere el protocolo v4.');
      }
      return;
    }
    const m = parseo.data;
    if (m.emisor !== desde.id || m.contexto.campania !== this.contexto.campania || m.contexto.tablero !== this.contexto.tablero) return;
    if (m.t === 'FRAG') {
      const resultado = this.fragmentos.registrar(desde.id, m);
      if (resultado.estado === 'completo') await this.procesar(resultado.mensaje, desde);
      else if (resultado.estado === 'progreso' && m.tipoMensaje === 'LOTE'
        && m.contexto.sesion === this.contexto.sesion && desde.id === this.contexto.director) {
        const separador = m.id.lastIndexOf('.');
        if (this.snapshots.progresar(m.id.slice(0, separador), Number(m.id.slice(separador + 1)))) {
          this.reintentos.pausarReintentosREQ(() => this.emitirSolicitud());
        }
      }
      return;
    }
    if (!m.sesionEmisor || this.aperturasRetiradas.has(`${desde.id}:${m.sesionEmisor}`)) return;
    const anteriorSesion = this.aperturas.get(desde.id);
    if (m.t === 'HOLA' || m.t === 'DIRECCION') {
      if (anteriorSesion && anteriorSesion !== m.sesionEmisor) this.aperturasRetiradas.add(`${desde.id}:${anteriorSesion}`);
      this.aperturas.set(desde.id, m.sesionEmisor);
    } else if (anteriorSesion !== m.sesionEmisor) return;
    if (m.t === 'DIRECCION') {
      if (m.fase === 'requiere-voto') {
        if (m.candidato === this.deps.cliente.id && this.soyDirector && !this.eleccionExplicita) {
          this.contexto = { ...this.contexto, director: 'pendiente', sesion: 'pendiente' };
          this.recuperando = true; this.cancelarEmisiones();
          this.deps.notificar('La mesa perdió a su director anterior. Confirma el relevo antes de publicar.'); this.mostrar();
        }
        return;
      }
      if (cliente.clientMode !== 'gm') return;
      if (m.fase === 'voto') { this.votos.set(cliente.id, m.candidato); this.comprobarVotos(); return; }
      if (m.candidato !== desde.id || m.contexto.director !== desde.id || this.retiradas.has(m.contexto.sesion)) return;
      if (this.relevoPendiente && !this.gms.every(c => this.votos.get(c.id) === desde.id)) {
        this.ejecutar(() => this.enviar({ ...this.sobre(), t: 'DIRECCION', fase: 'requiere-voto', candidato: desde.id }, desde.id)); return;
      }
      if (this.contexto.director === 'pendiente' && this.gms.length > 1
        && !this.gms.every(c => this.votos.get(c.id) === desde.id)) return;
      if (this.contexto.director !== 'pendiente' && this.contexto.director !== desde.id) return;
      if (this.contexto.sesion !== m.contexto.sesion) {
        if (this.contexto.sesion !== 'pendiente') this.retiradas.add(this.contexto.sesion);
        this.contexto = { ...m.contexto }; this.revision = 0; this.recuperando = true;
        this.revisionAnunciada = 0;
        this.cancelarEmisiones();
        this.relevoPendiente = false;
        this.fragmentos.limpiar(); this.snapshots.limpiar(); this.diferidos.clear();
        this.reintentos.cancelarReintentosREQ(); this.solicitar();
      }
      this.mostrar(); return;
    }
    if (m.t === 'HOLA') {
      if (this.contexto.director !== 'pendiente' && this.gms.length > 1 && this.gms.some(c => c.id === this.deps.cliente.id)) {
        this.ejecutar(() => this.enviar({ ...this.sobre(), t: 'DIRECCION', fase: 'voto', candidato: this.contexto.director }, desde.id));
      }
      if (this.soyDirector) { this.ejecutar(async () => { await this.anunciar(); await this.enviarSnapshot(desde.id); }); }
      return;
    }
    if (m.contexto.sesion !== this.contexto.sesion || m.contexto.director !== this.contexto.director) return;
    if (m.t === 'PROPUESTA') { if (this.soyDirector) await this.propuesta(m, cliente); return; }
    if (desde.id !== this.contexto.director || cliente.clientMode !== 'gm' || this.soyDirector) return;
    if (m.t === 'RESULTADO') {
      if (!this.emisiones.has(m.operacion)) return;
      this.reintentos.confirmarACK(m.operacion, 1);
      this.resultados.set(m.operacion, m);
      this.aplicarResultados();
      this.aplicar(); this.programar(); return;
    }
    if (m.t === 'LOTE') {
      if (m.revision < this.revision) return;
      const snapshot = this.snapshots.registrar(m);
      if (!snapshot) {
        if (this.snapshots.huboProgreso) this.reintentos.pausarReintentosREQ(() => this.emitirSolicitud());
        return;
      }
      conservarLocalesIniciales(this.replica, this.deps.leer().entidades, snapshot, this.deps.cliente.player.id);
      for (const entidad of snapshot.entidades) {
        const propia = [...this.resultados.values()].find(r => r.estado === 'aplicado' && r.entidad?.id === entidad.id);
        this.replica.recibir(entidad, propia ? this.emisiones.get(propia.operacion)?.local : undefined);
      }
      const ids = new Set(snapshot.entidades.map(e => e.id));
      for (const id of Object.keys(this.replica.base)) if (!ids.has(id)) delete this.replica.base[id];
      this.meta = snapshot.meta; this.revision = snapshot.revision; this.recuperando = false;
      this.reintentos.cancelarReintentosREQ(); this.vaciarDiferidos(); this.aplicarResultados(); this.aplicar(); this.programar(); return;
    }
    if (m.t === 'LATIDO') { this.revisionAnunciada = Math.max(this.revisionAnunciada, m.revision); this.esperarOrden(); return; }
    if (m.revision <= this.revision) return;
    this.revisionAnunciada = Math.max(this.revisionAnunciada, m.revision);
    if (this.recuperando || this.snapshots.enCurso() || m.revision !== this.revision + 1) {
      if (this.diferidos.size < 256) this.diferidos.set(m.revision, m);
      else this.diferidos.clear();
      this.esperarOrden(); return;
    }
    this.cambio(m); this.vaciarDiferidos(); this.aplicarResultados(); this.aplicar(); this.programar();
  }
  private aplicarResultados(): void {
    for (const [op, m] of this.resultados) {
      if (m.entidad && (this.recuperando || m.entidad.revision > this.revision)) { this.solicitar(); continue; }
      const emitida = this.emisiones.get(op); this.resultados.delete(op);
      if (!emitida) continue;
      this.emisiones.delete(op);
      if (m.entidad) this.replica.recibir(m.entidad, m.estado === 'aplicado' ? emitida.local : undefined);
      const pendiente = m.entidad && this.replica.pendientes[m.entidad.id];
      if (m.estado === 'conflicto' && m.entidad && pendiente) this.replica.conflictos.set(m.entidad.id,
        { id: m.entidad.id, remoto: this.replica.base[m.entidad.id], local: pendiente, grupos: m.conflictos });
      if (m.estado === 'rechazado') {
        this.bloqueadas.add(emitida.local.id); for (const e of Object.values(this.replica.pendientes)) if (e.padre === emitida.local.id) this.bloqueadas.add(e.id);
        this.deps.notificar('El cambio no fue autorizado. Revisa la vinculación; tu edición sigue conservada.');
      }
    }
  }
  private cambio(m: Cambio): void {
    this.revision = m.revision;
    if (m.t === 'COMBATE') this.meta = m.meta;
    else {
      this.replica.recibir(m.entidad, this.emisiones.get(m.operacion)?.local);
      // El estado confirmado también acredita la aplicación si se pierde RESULTADO.
      this.reintentos.confirmarACK(m.operacion, 1); this.emisiones.delete(m.operacion); this.resultados.delete(m.operacion);
    }
  }
  private vaciarDiferidos(): void {
    for (const r of this.diferidos.keys()) if (r <= this.revision) this.diferidos.delete(r);
    while (this.diferidos.has(this.revision + 1)) {
      const m = this.diferidos.get(this.revision + 1)!; this.diferidos.delete(m.revision); this.cambio(m);
    }
    this.esperarOrden();
  }
  /** Permite terminar un mensaje grande adelantado por otro pequeño, sin pedir seis snapshots innecesarios. */
  private esperarOrden(): void {
    if (this.revision >= this.revisionAnunciada && !this.diferidos.size) {
      if (this.esperaOrden) clearTimeout(this.esperaOrden);
      this.esperaOrden = undefined; return;
    }
    if (this.esperaOrden) return;
    this.esperaOrden = setTimeout(() => {
      this.esperaOrden = undefined;
      if (this.vivo && this.revision < this.revisionAnunciada) this.solicitar();
    }, 3000);
  }
  private async enviarSnapshot(destino: string): Promise<void> {
    if (this.enviandoSnapshots.has(destino)) return;
    this.enviandoSnapshots.add(destino);
    try {
    const entidades = structuredClone(Object.values(this.replica.base));
    const meta = structuredClone(this.meta); const revision = this.revision;
    const snapshot = crypto.randomUUID(); const total = Math.max(1, Math.ceil(entidades.length / 3));
    for (let i = 0; i < total; i++) if (!await this.enviar({ ...this.sobre(), t: 'LOTE', snapshot, revision,
      parte: i + 1, total, entidades: entidades.slice(i * 3, i * 3 + 3), ...(i === 0 ? { meta } : {}) }, destino)) break;
    } finally { this.enviandoSnapshots.delete(destino); }
  }
  private async propuesta(m: Propuesta, cliente: InfoCliente): Promise<void> {
    const clave = `${cliente.id}:${m.sesionEmisor}:${m.operacion}`;
    const anterior = this.operaciones.get(clave);
    if (anterior) { if (anterior.texto === JSON.stringify(m)) await this.enviar(anterior.resultado, cliente.id); return; }
    let actual = this.replica.base[m.entidad];
    const registro = m.registro;
    const propias = await this.deps.propiedades(cliente.player.id);
    const vigente = this.miembros.find(c => c.id === cliente.id);
    if (!this.vivo || !this.soyDirector || m.contexto.sesion !== this.contexto.sesion
      || !vigente || vigente.clientMode === 'spectator' || vigente.player.id !== cliente.player.id) return;
    const identidad = actual ? { ...actual, padre: actual.ficha ? actual.padre : registro?.padre ?? actual.padre } : registro;
    const padre = identidad?.padre ? this.replica.base[identidad.padre] : undefined;
    const vinculada = !!identidad && (identidad.padre
      ? padre?.duenio === cliente.player.id && (padre.grupos.acompanantes.some(a => a.id === identidad.id)
        || (!!actual?.eliminada && m.resolver.includes('acompanantes')))
      : !!identidad.miniatura && propias.has(identidad.miniatura.toLowerCase()));
    const valida = vinculada && !!identidad && (identidad.miniatura
      ? identidad.id === identidad.miniatura.toLowerCase() : identidad.id === `${identidad.padre}/${identidad.ficha}`) && (!identidad?.miniatura || propias.has(identidad.miniatura.toLowerCase()))
      && (!actual || actual.duenio === 'sin-vincular' || actual.duenio === cliente.player.id)
      && (!actual?.ficha || !registro?.ficha || actual.ficha === registro.ficha)
      && (!actual?.padre || !registro || actual.padre === registro.padre);
    let estado: 'aplicado' | 'conflicto' | 'rechazado' = 'rechazado'; let conflictos: GrupoSyncV4[] = [];
    if (valida && identidad) {
      actual = { ...identidad, duenio: cliente.player.id, monstruo: false,
        ficha: actual?.ficha ?? registro?.ficha, fila: actual?.fila ?? identidad.miniatura ?? identidad.ficha };
      const bajas = actual.grupos.acompanantes.filter(a => m.cambios.acompanantes && !m.cambios.acompanantes.some(b => b.id === a.id));
      const bajaObsoleta = bajas.some(a => this.replica.base[a.id] && m.revisionesHijos?.[a.id] !== this.replica.base[a.id].revision);
      const decision = bajaObsoleta ? { estado: 'conflicto' as const, conflictos: ['acompanantes' as const], entidad: actual }
        : evaluarPropuestaSyncV4(actual, m, cliente.player.id, this.revision + 1);
      estado = decision.estado; conflictos = decision.conflictos;
      if (estado === 'aplicado') {
        const metaAnterior = JSON.stringify(this.meta);
        actual = decision.entidad; this.confirmar(actual, m.operacion);
        if (m.restaurar && padre && !padre.grupos.acompanantes.some(a => a.id === actual!.id)) {
          this.confirmar({ ...padre, revisiones: { ...padre.revisiones, acompanantes: this.revision + 1 },
            grupos: { ...padre.grupos, acompanantes: [...padre.grupos.acompanantes, { id: actual.id, miniatura: actual.miniatura }] } });
        }
        this.retirarHijos(actual);
        if (JSON.stringify(this.meta) !== metaAnterior) {
          const revision = ++this.revision;
          this.ejecutar(() => this.enviar({ ...this.sobre(), t: 'COMBATE', revision, meta: this.meta }));
        }
        this.aplicar();
      }
    }
    const resultado: Extract<Mensaje, { t: 'RESULTADO' }> = { ...this.sobre(), t: 'RESULTADO', operacion: m.operacion,
      estado, revision: this.revision, conflictos, ...(actual ? { entidad: actual } : {}) };
    this.operaciones.set(clave, { texto: JSON.stringify(m), resultado });
    if (cliente.id === this.deps.cliente.id) {
      this.resultados.set(m.operacion, resultado); this.aplicarResultados(); this.aplicar();
    } else await this.enviar(resultado, cliente.id);
  }
  private confirmar(entidad: EntidadSyncV4, operacion: string = crypto.randomUUID()): void {
    entidad = { ...entidad, revision: ++this.revision };
    if (entidad.eliminada) entidad.revisiones = { ...entidad.revisiones, acompanantes: this.revision };
    this.replica.recibir(entidad, this.emisiones.get(operacion)?.local);
    this.ejecutar(() => this.enviar({ ...this.sobre(), t: 'CONFIRMADO', entidad, operacion, revision: this.revision }));
    this.aplicar();
  }
  private retirarHijos(padre: EntidadSyncV4): void {
    const hijos = new Set(padre.grupos.acompanantes.map(a => a.id));
    for (const hijo of Object.values(this.replica.base)) if (hijo.padre === padre.id && !hijo.eliminada && !hijos.has(hijo.id)) {
      this.confirmar({ ...hijo, eliminada: true });
      this.meta = metaDisponibleSyncV4(this.meta, Object.values(this.replica.base));
    }
  }
  observar(): void {
    if (!this.vivo) return;
    const local = this.deps.leer();
    const anterior = this.lectura;
    const revisionAnterior = this.revision;
    if (!anterior && !this.soyDirector) { this.lectura = new Map(local.entidades.map(e => [e.id, e])); this.mostrar(); return; }
    let edicion = false;
    local.entidades = local.entidades.map(e => edicionLocalSyncV4(e, anterior?.get(e.id), this.replica.pendientes[e.id] ?? this.replica.base[e.id]));
    if (this.soyDirector) {
      for (const entidad of local.entidades) {
        const base = this.replica.base[entidad.id];
        if (base?.eliminada || this.replica.pendientes[entidad.id]) continue;
        const cambios = GRUPOS_SYNC_V4.filter(g => !base || !igualesGrupoSyncV4(g, base.grupos, entidad.grupos));
        if (cambios.length) {
          const revisiones = { ...(base?.revisiones ?? vacias) };
          for (const g of cambios) revisiones[g] = this.revision + 1;
          this.confirmar({ ...entidad, duenio: base?.duenio ?? entidad.duenio, revisiones });
          this.retirarHijos(entidad);
        }
      }
      const meta = metaDisponibleSyncV4(local.meta, Object.values(this.replica.base));
      if (JSON.stringify(this.meta) !== JSON.stringify(meta)) {
        this.meta = meta; const revision = ++this.revision;
        this.ejecutar(() => this.enviar({ ...this.sobre(), t: 'COMBATE', revision, meta: this.meta }));
      }
    } else for (const entidad of local.entidades) if (entidad.duenio === this.deps.cliente.player.id
      || this.replica.base[entidad.id]?.duenio === this.deps.cliente.player.id) {
      edicion = this.replica.editar({ ...entidad, duenio: this.deps.cliente.player.id }) || edicion;
    }
    this.lectura = new Map(this.deps.leer().entidades.map(e => [e.id, e]));
    if (this.soyDirector && revisionAnterior !== this.revision) this.aplicar(); else if (edicion) guardarMemoriaMotor(this.deps, this.replica, this.meta, this.revision);
    this.mostrar(); this.programar();
  }
  private programar(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.ejecutar(() => this.proponer()), 120);
  }
  private async proponer(): Promise<void> {
    if (!this.vivo || this.recuperando) return;
    for (const [id, local] of Object.entries(this.replica.pendientes)) {
      if (local.duenio !== this.deps.cliente.player.id) continue;
      if (this.bloqueadas.has(id)) continue;
      const padre = local.padre ? this.replica.base[local.padre] : undefined;
      if (padre && padre.duenio !== this.deps.cliente.player.id) {
        if (padre.duenio === 'sin-vincular' && !this.bloqueadas.has(padre.id) && ![...this.emisiones.values()].some(e => e.local.id === padre.id))
          await this.emitirPendiente({ ...padre, duenio: this.deps.cliente.player.id }, ['datos']);
        continue;
      }
      if ([...this.emisiones.values()].some(e => e.local.id === id)) continue;
      const grupos = this.replica.gruposPropuestos(id); if (!grupos.length) continue;
      await this.emitirPendiente(local, grupos);
    }
    this.mostrar();
  }
  private async emitirPendiente(local: EntidadSyncV4, grupos: GrupoSyncV4[]): Promise<void> {
    const propuesta = crearPropuestaPendiente(this.replica, local, grupos, this.sobre());
    this.emisiones.set(propuesta.operacion, { propuesta, local: structuredClone(local) });
    const yo = this.miembros.find(c => c.id === this.deps.cliente.id);
    if (this.soyDirector && yo) await this.propuesta(propuesta, yo);
    else this.reintentos.registrarEmisionPJ(propuesta.operacion, 1, () => this.enviar(propuesta, this.contexto.director));
  }
  reintentar(): void {
    this.bloqueadas.clear();
    for (const [id, e] of this.emisiones) this.reintentos.registrarEmisionPJ(id, 1, () => this.enviar(e.propuesta, this.contexto.director));
    this.programar();
  }
  exportarPendientes(): Record<string, EntidadSyncV4> { return structuredClone(this.replica.pendientes); }
  async recuperar(entidad: EntidadSyncV4): Promise<boolean> {
    if (!this.vivo || this.recuperando) return false;
    const ok = await recuperarEntidadArchivada(this.replica, entidad, this.deps.leer().entidades,
      this.deps.cliente.player.id, () => this.deps.propiedades(this.deps.cliente.player.id), () => this.vivo && this.deps.leer().entidades.some(e => (e.id === entidad.id && e.ficha === entidad.ficha) || (!!entidad.padre && e.id === entidad.padre)));
    if (ok && this.vivo) this.aplicar(); return ok;
  }
  private cancelarEmisiones(): void {
    if (this.esperaOrden) clearTimeout(this.esperaOrden); this.esperaOrden = undefined;
    for (const id of this.emisiones.keys()) this.reintentos.cancelarEmisionPJ(id);
    this.emisiones.clear(); this.resultados.clear(); this.bloqueadas.clear();
  }
  descartar(id: string): void {
    for (const [op, e] of this.emisiones) if (e.local.id === id) {
      this.reintentos.cancelarEmisionPJ(op); this.emisiones.delete(op);
    }
    delete this.replica.pendientes[id]; this.replica.conflictos.delete(id); this.bloqueadas.delete(id);
    delete this.replica.resoluciones[id];
    this.aplicar();
  }
  resolver(id: string, grupo: GrupoSyncV4, eleccion: 'local' | 'compartido', revision: number): boolean {
    if (this.replica.pendientes[id]?.duenio !== this.deps.cliente.player.id) return false;
    if (!this.replica.resolver(id, grupo, eleccion, revision)) return false;
    this.bloqueadas.delete(id);
    this.aplicar(); this.programar(); return true;
  }
  private aplicar(): void {
    this.deps.aplicar({ entidades: this.replica.visibles(), meta: this.meta });
    guardarMemoriaMotor(this.deps, this.replica, this.meta, this.revision);
    this.lectura = new Map(this.deps.leer().entidades.map(e => [e.id, e])); this.mostrar();
  }
  private mostrar(): void {
    this.deps.mostrar(estadoVistaSyncV4(this.contexto.director, this.recuperando, this.soyDirector,
      this.gms, this.replica, this.deps.cliente.player.id, this.bloqueadas));
  }
  destruir(): void {
    this.vivo = false;
    if (this.timer) clearInterval(this.timer);
    if (this.debounce) clearTimeout(this.debounce);
    if (this.esperaOrden) clearTimeout(this.esperaOrden);
    this.reintentos.destruir(); this.fragmentos.limpiar(); this.snapshots.limpiar();
    guardarMemoriaMotor(this.deps, this.replica, this.meta, this.revision);
  }
}
