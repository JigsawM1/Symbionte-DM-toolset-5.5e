import type {
  EntradaTiradaActiva,
  SolicitudPendiente
} from "./tiposDados";

/** TTL máximo de vida para tiradas no resueltas en memoria (10 minutos). */
export const TTL_TIRADAS_EN_MEMORIA_MS = 10 * 60 * 1000;

/** Registro encapsulado de tiradas 3D activas indexadas por `rollId`. */
const tiradasActivas = new Map<string, EntradaTiradaActiva>();

/** Registro encapsulado de solicitudes asíncronas con promesa indexadas por `rollId`. */
const solicitudesPendientes = new Map<string, SolicitudPendiente>();

function desvincularAbort(solicitud: SolicitudPendiente): void {
  if (solicitud.signal && solicitud.onAbort) {
    solicitud.signal.removeEventListener("abort", solicitud.onAbort);
  }
}

/**
 * Registra una tirada 3D pendiente en memoria combinando de forma unificada
 * la metadata especial (ventaja/desventaja) y el efecto de dominio asociado.
 */
export function registrarTiradaActiva(
  rollId: string,
  entrada: Omit<EntradaTiradaActiva, "creadoEn">,
  ahora: number = Date.now()
): void {
  const especial = entrada.especial ? { ...entrada.especial, creadoEn: ahora } : undefined;
  const efecto = entrada.efecto ? { ...entrada.efecto, creadoEn: ahora } : undefined;

  tiradasActivas.set(rollId, {
    creadoEn: ahora,
    especial,
    efecto
  });
}

/**
 * Reclama y elimina de forma síncrona y atómica una tirada activa por `rollId`
 * antes de ejecutar operaciones asíncronas, impidiendo doble procesamiento concurrente.
 */
export function reclamarTiradaActiva(rollId: string): EntradaTiradaActiva | undefined {
  const entrada = tiradasActivas.get(rollId);
  if (entrada) {
    tiradasActivas.delete(rollId);
  }
  return entrada;
}

/**
 * Registra una solicitud asíncrona con promesa vinculada a un `rollId` de TaleSpire.
 */
export function registrarSolicitudPendiente(rollId: string, solicitud: SolicitudPendiente): void {
  solicitudesPendientes.set(rollId, solicitud);
}

/**
 * Reclama, elimina del registro y desvincula el listener `AbortSignal` de una solicitud pendiente.
 */
export function reclamarSolicitudPendiente(rollId: string): SolicitudPendiente | undefined {
  const solicitud = solicitudesPendientes.get(rollId);
  if (solicitud) {
    solicitudesPendientes.delete(rollId);
    desvincularAbort(solicitud);
  }
  return solicitud;
}

/**
 * Cancela y rechaza con `AbortError` una solicitud pendiente si aún sigue registrada.
 */
export function abortarSolicitudPendiente(rollId: string): void {
  const solicitud = reclamarSolicitudPendiente(rollId);
  if (solicitud) {
    solicitud.reject(new DOMException("Operación de tirada cancelada por el usuario.", "AbortError"));
  }
}

/**
 * Cuenta cuántas tiradas de Dado de Golpe permanecen en vuelo para un personaje concreto.
 */
export function contarDadosGolpeEnVuelo(personajeId: string): number {
  let conteo = 0;
  for (const entrada of tiradasActivas.values()) {
    if (entrada.efecto?.tipo === "dadoGolpe" && entrada.efecto.personajeId === personajeId) {
      conteo++;
    }
  }
  return conteo;
}

/**
 * Purga de memoria tiradas pendientes cuyos callbacks nunca llegaron de TaleSpire.
 * Previene fugas de memoria por acumulación de promesas o descriptores huérfanos.
 */
export function limpiarTiradasExpiradas(
  ahora: number = Date.now(),
  ttlMs: number = TTL_TIRADAS_EN_MEMORIA_MS
): void {
  for (const [id, entrada] of tiradasActivas.entries()) {
    if (ahora - entrada.creadoEn > ttlMs) {
      tiradasActivas.delete(id);
    }
  }

  for (const [id, solicitud] of solicitudesPendientes.entries()) {
    if (ahora - solicitud.creadoEn > ttlMs) {
      solicitudesPendientes.delete(id);
      desvincularAbort(solicitud);
      solicitud.reject(new Error("Tiempo de espera para la tirada de TaleSpire agotado (10 min)."));
    }
  }
}

/**
 * Reinicia por completo los registros en memoria y rechaza solicitudes pendientes activas.
 */
export function limpiarRegistrosTiradas(): void {
  tiradasActivas.clear();

  for (const [id, solicitud] of solicitudesPendientes.entries()) {
    solicitudesPendientes.delete(id);
    desvincularAbort(solicitud);
    solicitud.reject(new Error("Registro de tiradas reiniciado."));
  }
}
