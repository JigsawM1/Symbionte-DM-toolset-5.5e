import { IDS_INICIALES_MONSTRUOS, IDS_INICIALES_HECHIZOS, IDS_INICIALES_OBJETOS } from '@/utiles/datosIniciales';
import { guardarBlobGlobal } from '@/utiles/almacenamientoTaleSpire';
import { deshidratarPersonaje } from '@/servicios/serializadorPersonaje';
import type { EstadoDM } from '@/almacen/usarAlmacenDM';
import { logger } from '@/utiles/logger';

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
    personajes:          (estado.personajes || []).map(deshidratarPersonaje),
    id_personaje_activo: estado.idPersonajeActivo || null,
    mostrar_porcentaje_vida: estado.mostrarPorcentajeVidaAJugadores !== undefined ? estado.mostrarPorcentajeVidaAJugadores : true,
  };
}

/**
 * Fuerza la escritura inmediata y síncrona en disco/blob, cancelando cualquier
 * temporizador de debounce pendiente. Crucial ante el apagado del CEF (willShutdown).
 */
export const forzarFlushPersistencia = async (estado?: Partial<EstadoDM>): Promise<boolean> => {
  if (timeoutPersistencia) {
    clearTimeout(timeoutPersistencia);
    timeoutPersistencia = null;
  }
  if (!estado) return false;
  try {
    const blob = construirBlobPersistencia(estado);
    return await guardarBlobGlobal(blob);
  } catch (e) {
    logger.error("[TS Storage] Error durante forzarFlushPersistencia:", e);
    return false;
  }
};

export const persistirEstadoCompleto = (estado: Partial<EstadoDM>) => {
  if (!estado) return;

  if (timeoutPersistencia) {
    clearTimeout(timeoutPersistencia);
  }

  timeoutPersistencia = setTimeout(() => {
    const blob = construirBlobPersistencia(estado);
    guardarBlobGlobal(blob).catch((e: unknown) => {
      logger.error("[TS Storage] Error al persistir estado completo:", e);
    });
  }, 250);
};

