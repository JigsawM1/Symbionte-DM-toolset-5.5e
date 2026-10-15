import { IDS_INICIALES_MONSTRUOS, IDS_INICIALES_HECHIZOS, IDS_INICIALES_OBJETOS } from '@/utiles/datosIniciales';
import { guardarBlobGlobal } from '@/utiles/almacenamientoTaleSpire';
import { deshidratarPersonaje } from '@/servicios/serializadorPersonaje';
import type { EstadoDM } from '@/almacen/usarAlmacenDM';
import { logger } from '@/utiles/logger';
import { serializarBorradorSync } from './borradoresSync';

let colaEscrituras: Promise<boolean> = Promise.resolve(true);
let generacionEscritura = 0;
let cachePersonajesRef: EstadoDM["personajes"] | undefined;
let cachePersonajes: EstadoDM["personajes"] = [];

let timeoutPersistencia: ReturnType<typeof setTimeout> | null = null;

let cacheMonstruosRef: unknown = null;
let cacheMonstruosHomebrew: unknown[] = [];

let cacheHechizosRef: unknown = null;
let cacheHechizosHomebrew: unknown[] = [];

let cacheObjetosRef: unknown = null;
let cacheObjetosHomebrew: unknown[] = [];

export function construirBlobPersistencia(estado: Partial<EstadoDM>): Record<string, unknown> {
  const baseMonstruos = estado.baseDatosMonstruos || [];
  const baseHechizos = estado.baseDatosHechizos || [];
  const baseObjetos = estado.objetosHomebrew || [];

  // Reutilizar caché de filtrado si las referencias de los catálogos no han mutado
  if (cacheMonstruosRef !== baseMonstruos) {
    cacheMonstruosRef = baseMonstruos;
    cacheMonstruosHomebrew = baseMonstruos.filter((m) => m && m.id && !IDS_INICIALES_MONSTRUOS.has(m.id));
  }

  if (cacheHechizosRef !== baseHechizos) {
    cacheHechizosRef = baseHechizos;
    cacheHechizosHomebrew = baseHechizos.filter((h) => h && h.id && !IDS_INICIALES_HECHIZOS.has(h.id));
  }

  if (cacheObjetosRef !== baseObjetos) {
    cacheObjetosRef = baseObjetos;
    cacheObjetosHomebrew = baseObjetos.filter((o) => o && o.id && !IDS_INICIALES_OBJETOS.has(o.id));
  }

  if (cachePersonajesRef !== estado.personajes) {
    cachePersonajesRef = estado.personajes;
    cachePersonajes = (estado.personajes ?? []).map(deshidratarPersonaje);
  }

  return {
    monstruos_homebrew:  cacheMonstruosHomebrew,
    hechizos_homebrew:   cacheHechizosHomebrew,
    objetos_homebrew:    cacheObjetosHomebrew,
    pendientes:          estado.listaPendientes || [],
    notas:               estado.notasDM || "",
    encuentros:          estado.encuentrosGuardados || [],
    cola_iniciativa:     estado.colaIniciativa || [],
    ronda_actual:        estado.rondaActual !== undefined ? estado.rondaActual : 1,
    indice_turno_activo: estado.indiceTurnoActivo !== undefined ? estado.indiceTurnoActivo : 0,
    metodo_vida:         estado.metodoVidaMonstruo || "azar",
    sistema_magia:       estado.sistemaMagia || "espacios",
    asociaciones_fichas: estado.asociacionesFichas || {},
    personajes:          cachePersonajes,
    borradores_sync: Object.fromEntries(Object.entries(estado.borradoresSync ?? {}).map(([id, dto]) => [id, serializarBorradorSync(dto)])),
    id_personaje_activo: estado.idPersonajeActivo || null,
    mostrar_porcentaje_vida: estado.mostrarPorcentajeVidaAJugadores !== undefined ? estado.mostrarPorcentajeVidaAJugadores : true,
  };
}

type EstadoGuardado = EstadoDM['estadoGuardado'];
type NotificarGuardado = (estado: EstadoGuardado) => void;
export function suspenderPersistencia(): void {
  generacionEscritura++;
  if (timeoutPersistencia) clearTimeout(timeoutPersistencia);
  timeoutPersistencia = null;
}
export const esperarEscriturasPersistencia = (): Promise<boolean> => colaEscrituras;
function cargaValida(estado: Partial<EstadoDM>): boolean {
  return estado.datosInicialesCargados === true && !estado.cargandoDatos && !estado.errorCargaDatos;
}

function guardarEnCola(estado: Partial<EstadoDM>, notificar?: NotificarGuardado, vigente?: () => boolean): Promise<boolean> {
  const generacion = generacionEscritura;
  colaEscrituras = colaEscrituras.catch(() => false).then(async () => {
    if (generacion !== generacionEscritura || !cargaValida(estado) || (vigente && !vigente())) return false;
    notificar?.('guardando');
    try {
      const exito = await guardarBlobGlobal(construirBlobPersistencia(estado));
      notificar?.(exito ? 'guardado' : 'error');
      return exito;
    } catch (error) {
      logger.error('[TS Storage] Falló la escritura; se conserva el estado en memoria:', error);
      notificar?.('error');
      return false;
    }
  });
  return colaEscrituras;
}

/** Vacía el debounce y espera las escrituras anteriores antes del snapshot final. */
export const forzarFlushPersistencia = (estado?: Partial<EstadoDM>): Promise<boolean> => {
  if (timeoutPersistencia) clearTimeout(timeoutPersistencia);
  timeoutPersistencia = null;
  return estado && cargaValida(estado) ? guardarEnCola(estado) : Promise.resolve(false);
};

export const persistirEstadoCompleto = (estado: Partial<EstadoDM>, notificar?: NotificarGuardado, vigente?: () => boolean): void => {
  if (timeoutPersistencia) clearTimeout(timeoutPersistencia);
  timeoutPersistencia = null;
  if (!cargaValida(estado)) return;
  notificar?.('pendiente');
  timeoutPersistencia = setTimeout(() => {
    timeoutPersistencia = null;
    void guardarEnCola(estado, notificar, vigente);
  }, 250);
};
