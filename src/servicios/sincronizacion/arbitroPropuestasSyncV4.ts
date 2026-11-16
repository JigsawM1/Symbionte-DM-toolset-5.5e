import type { EntidadSyncV4, GrupoSyncV4, MetaSyncV4 } from '@/tipos/protocoloSync';
import type { InfoCliente } from '@/tipos/talespire';
import type { MensajeNoFragSyncV4, SobreMensajeSyncV4 } from './erroresTransporteSyncV4';
import { evaluarPropuestaSyncV4, metaDisponibleSyncV4 } from './reconciliacionSyncV4';
import type { ReplicaSyncV4 } from './replicaSyncV4';

type PropuestaSyncV4 = Extract<MensajeNoFragSyncV4, { t: 'PROPUESTA' }>;
type ResultadoSyncV4 = Extract<MensajeNoFragSyncV4, { t: 'RESULTADO' }>;

export interface ParametrosAutorizacionPropuestaSyncV4 {
  actual: EntidadSyncV4 | undefined;
  propuesta: PropuestaSyncV4;
  jugadorId: string;
  propias: ReadonlySet<string>;
  base: Record<string, EntidadSyncV4>;
}

export interface ResultadoAutorizacionPropuestaSyncV4 {
  valida: boolean;
  identidad: EntidadSyncV4 | undefined;
  padre: EntidadSyncV4 | undefined;
}

/** Verifica identidad nativa, propiedad de miniaturas y paternidad antes de arbitrar una propuesta. */
export function verificarAutorizacionPropuestaSyncV4(
  params: ParametrosAutorizacionPropuestaSyncV4,
): ResultadoAutorizacionPropuestaSyncV4 {
  const { actual, propuesta, jugadorId, propias, base } = params;
  const registro = propuesta.registro;
  const identidad = actual
    ? { ...actual, padre: actual.ficha ? actual.padre : registro?.padre ?? actual.padre }
    : registro;
  const padre = identidad?.padre ? base[identidad.padre] : undefined;
  if (!identidad) return { valida: false, identidad: undefined, padre: undefined };
  const vinculada = identidad.padre
    ? padre?.duenio === jugadorId && (padre.grupos.acompanantes.some(a => a.id === identidad.id)
      || (!!actual?.eliminada && propuesta.resolver.includes('acompanantes')))
    : !!identidad.miniatura && propias.has(identidad.miniatura.toLowerCase());
  const idValido = identidad.miniatura
    ? identidad.id === identidad.miniatura.toLowerCase()
    : identidad.id === `${identidad.padre}/${identidad.ficha}`;
  const valida = vinculada
    && idValido
    && (!identidad.miniatura || propias.has(identidad.miniatura.toLowerCase()))
    && (!actual || actual.duenio === 'sin-vincular' || actual.duenio === jugadorId)
    && (!actual?.ficha || !registro?.ficha || actual.ficha === registro.ficha)
    && (!actual?.padre || !registro || actual.padre === registro.padre);
  return { valida, identidad, padre };
}

/** Detecta si una baja de acompañante intenta retirar un hijo con revisión posterior ya confirmada. */
export function tieneBajaObsoletaAcompanantesSyncV4(
  actual: EntidadSyncV4,
  propuesta: PropuestaSyncV4,
  base: Record<string, EntidadSyncV4>,
): boolean {
  const bajas = actual.grupos.acompanantes.filter(
    a => propuesta.cambios.acompanantes && !propuesta.cambios.acompanantes.some(b => b.id === a.id),
  );
  return bajas.some(a => base[a.id] && propuesta.revisionesHijos?.[a.id] !== base[a.id].revision);
}

export interface CallbacksArbitroPropuestasSyncV4 {
  clienteId: string;
  replica: ReplicaSyncV4;
  estaVivo: () => boolean;
  soyDirector: () => boolean;
  sesionActual: () => string;
  obtenerMiembro: (id: string) => InfoCliente | undefined;
  propiedades: (jugador: string) => Promise<Set<string>>;
  sobre: () => SobreMensajeSyncV4;
  obtenerRevision: () => number;
  avanzarRevision: () => number;
  obtenerMeta: () => MetaSyncV4;
  establecerMeta: (meta: MetaSyncV4) => void;
  obtenerLocalEmitida: (operacion: string) => EntidadSyncV4 | undefined;
  enviar: (mensaje: MensajeNoFragSyncV4, destino?: string) => Promise<boolean>;
  ejecutar: (operacion: string, accion: () => Promise<unknown>) => void;
  aplicar: () => void;
  alResultadoPropio: (operacion: string, resultado: ResultadoSyncV4) => void;
}

/**
 * Árbitro autoritativo del Director: valida propuestas entrantes con idempotencia,
 * resuelve bajas en cascada y transmite snapshots paginados por lote.
 */
export class ArbitroPropuestasSyncV4 {
  private operaciones = new Map<string, { texto: string; resultado: ResultadoSyncV4 }>();
  private enviandoSnapshots = new Set<string>();

  constructor(private readonly cb: CallbacksArbitroPropuestasSyncV4) {}

  async procesarPropuesta(mensaje: PropuestaSyncV4, cliente: InfoCliente): Promise<void> {
    const clave = `${cliente.id}:${mensaje.sesionEmisor}:${mensaje.operacion}`;
    const anterior = this.operaciones.get(clave);
    if (anterior) {
      if (anterior.texto === JSON.stringify(mensaje)) await this.cb.enviar(anterior.resultado, cliente.id);
      return;
    }
    let actual = this.cb.replica.base[mensaje.entidad];
    const registro = mensaje.registro;
    const propias = await this.cb.propiedades(cliente.player.id);
    const vigente = this.cb.obtenerMiembro(cliente.id);
    if (!this.cb.estaVivo() || !this.cb.soyDirector() || mensaje.contexto.sesion !== this.cb.sesionActual()
      || !vigente || vigente.clientMode === 'spectator' || vigente.player.id !== cliente.player.id) {
      return;
    }
    const { valida, identidad, padre } = verificarAutorizacionPropuestaSyncV4({
      actual,
      propuesta: mensaje,
      jugadorId: cliente.player.id,
      propias,
      base: this.cb.replica.base,
    });
    let estado: 'aplicado' | 'conflicto' | 'rechazado' = 'rechazado';
    let conflictos: GrupoSyncV4[] = [];
    if (valida && identidad) {
      actual = {
        ...identidad,
        duenio: cliente.player.id,
        monstruo: false,
        ficha: actual?.ficha ?? registro?.ficha,
        fila: actual?.fila ?? identidad.miniatura ?? identidad.ficha,
      };
      const bajaObsoleta = tieneBajaObsoletaAcompanantesSyncV4(actual, mensaje, this.cb.replica.base);
      const decision = bajaObsoleta
        ? { estado: 'conflicto' as const, conflictos: ['acompanantes' as const], entidad: actual }
        : evaluarPropuestaSyncV4(actual, mensaje, cliente.player.id, this.cb.obtenerRevision() + 1);
      estado = decision.estado;
      conflictos = decision.conflictos;
      if (estado === 'aplicado') {
        const metaAnterior = JSON.stringify(this.cb.obtenerMeta());
        actual = decision.entidad;
        this.confirmar(actual, mensaje.operacion);
        if (mensaje.restaurar && padre && !padre.grupos.acompanantes.some(a => a.id === actual!.id)) {
          this.confirmar({
            ...padre,
            revisiones: { ...padre.revisiones, acompanantes: this.cb.obtenerRevision() + 1 },
            grupos: {
              ...padre.grupos,
              acompanantes: [...padre.grupos.acompanantes, { id: actual.id, miniatura: actual.miniatura }],
            },
          });
        }
        this.retirarHijos(actual);
        if (JSON.stringify(this.cb.obtenerMeta()) !== metaAnterior) {
          const revision = this.cb.avanzarRevision();
          const meta = this.cb.obtenerMeta();
          this.cb.ejecutar('combate', () => this.cb.enviar({ ...this.cb.sobre(), t: 'COMBATE', revision, meta }));
        }
        this.cb.aplicar();
      }
    }
    const resultado: ResultadoSyncV4 = {
      ...this.cb.sobre(),
      t: 'RESULTADO',
      operacion: mensaje.operacion,
      estado,
      revision: this.cb.obtenerRevision(),
      conflictos,
      ...(actual ? { entidad: actual } : {}),
    };
    this.operaciones.set(clave, { texto: JSON.stringify(mensaje), resultado });
    if (cliente.id === this.cb.clienteId) {
      this.cb.alResultadoPropio(mensaje.operacion, resultado);
    } else {
      await this.cb.enviar(resultado, cliente.id);
    }
  }

  confirmar(entidad: EntidadSyncV4, operacion: string = crypto.randomUUID()): void {
    const revision = this.cb.avanzarRevision();
    let confirmada: EntidadSyncV4 = { ...entidad, revision };
    if (confirmada.eliminada) {
      confirmada = { ...confirmada, revisiones: { ...confirmada.revisiones, acompanantes: revision } };
    }
    this.cb.replica.recibir(confirmada, this.cb.obtenerLocalEmitida(operacion));
    this.cb.ejecutar('confirmado', () =>
      this.cb.enviar({ ...this.cb.sobre(), t: 'CONFIRMADO', entidad: confirmada, operacion, revision }),
    );
    this.cb.aplicar();
  }

  retirarHijos(padre: EntidadSyncV4): void {
    const hijos = new Set(padre.grupos.acompanantes.map(a => a.id));
    for (const hijo of Object.values(this.cb.replica.base)) {
      if (hijo.padre === padre.id && !hijo.eliminada && !hijos.has(hijo.id)) {
        this.confirmar({ ...hijo, eliminada: true });
        this.cb.establecerMeta(metaDisponibleSyncV4(this.cb.obtenerMeta(), Object.values(this.cb.replica.base)));
      }
    }
  }

  async enviarSnapshot(destino: string): Promise<void> {
    if (this.enviandoSnapshots.has(destino)) return;
    this.enviandoSnapshots.add(destino);
    try {
      const entidades = structuredClone(Object.values(this.cb.replica.base));
      const meta = structuredClone(this.cb.obtenerMeta());
      const revision = this.cb.obtenerRevision();
      const snapshot = crypto.randomUUID();
      const total = Math.max(1, Math.ceil(entidades.length / 3));
      for (let i = 0; i < total; i++) {
        const lote: Extract<MensajeNoFragSyncV4, { t: 'LOTE' }> = {
          ...this.cb.sobre(),
          t: 'LOTE',
          snapshot,
          revision,
          parte: i + 1,
          total,
          entidades: entidades.slice(i * 3, i * 3 + 3),
          ...(i === 0 ? { meta } : {}),
        };
        if (!(await this.cb.enviar(lote, destino))) break;
      }
    } finally {
      this.enviandoSnapshots.delete(destino);
    }
  }
}
