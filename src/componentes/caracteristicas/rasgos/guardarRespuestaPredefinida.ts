import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { aplicarValorPredefinido, type FlujoRespuesta } from "@/servicios/rasgos/respuestasPredefinidasRasgos";
import type { RespuestaPredefinidaRasgo } from "@/tipos";
import { logger } from "@/utiles/logger";

function actualizarPreferenciaRasgo(
  idPj: string,
  idRasgo: string,
  calcular: (actual: RespuestaPredefinidaRasgo | undefined) => RespuestaPredefinidaRasgo | undefined,
  origen: string
): void {
  try {
    const estado = usarAlmacenDM.getState();
    const rasgo = estado.personajes.find(p => p.id === idPj)?.rasgos.find(r => r.id === idRasgo);
    if (!rasgo) return;
    estado.actualizarRasgoPersonaje(idPj, idRasgo, { respuestaPredefinida: calcular(rasgo.respuestaPredefinida) });
  } catch (error) {
    logger.error(`[${origen}] Error al guardar preferencia de rasgo:`, error);
    usarAlmacenDM.getState().agregarNotificacion("No se pudo guardar la respuesta predefinida del rasgo.", "error");
  }
}

/** Actualiza de forma segura la respuesta predefinida de un flujo en el rasgo vigente del personaje. */
export function guardarRespuestaPredefinida(
  idPj: string,
  idRasgo: string,
  flujo: FlujoRespuesta,
  valor: string | string[]
): void {
  actualizarPreferenciaRasgo(idPj, idRasgo, actual => aplicarValorPredefinido(actual, flujo, valor), "guardarRespuestaPredefinida");
}

/** Guarda la configuración completa del modal de resolución asistida en el rasgo del personaje. */
export function guardarResolucionPredefinida(
  idPj: string,
  idRasgo: string,
  resolucion: NonNullable<RespuestaPredefinidaRasgo["resolucion"]>
): void {
  actualizarPreferenciaRasgo(idPj, idRasgo, actual => ({ ...(actual ?? {}), resolucion }), "guardarResolucionPredefinida");
}
