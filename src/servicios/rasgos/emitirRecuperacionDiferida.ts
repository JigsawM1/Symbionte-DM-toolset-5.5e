import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { solicitarResultadoTirada } from "@/utiles/lanzadorDados";
import { logger } from "@/utiles/logger";

const pendientes = new Set<string>();

/** Reintentar solo completa la espera guardada; nunca repite el conjuro ni su gasto. */
export async function resolverRecuperacionDiferida(idPersonaje: string, idRasgo: string): Promise<void> {
  if (pendientes.has(idPersonaje)) return;
  const r = usarAlmacenDM.getState().personajes.find(p => p.id === idPersonaje)?.rasgos.find(r => r.id === idRasgo);
  if (r?.recuperacionDiferida?.estado !== "pendiente") return;
  pendientes.add(idPersonaje);
  try {
    const tirada = await solicitarResultadoTirada({ etiqueta: `Recuperación de ${r.nombre}`,
      grupos: [{ nombre: "Descansos largos necesarios", formula: r.recuperacionDiferida.formula }] });
    const resultado = tirada.totales[0];
    if (!usarAlmacenDM.getState().operarRecursoRasgoPersonaje(idPersonaje, { tipo: "establecerRecuperacionDiferida", idRasgo, resultado }))
      throw new Error("No se obtuvo una espera válida. La recuperación sigue pendiente.");
    usarAlmacenDM.getState().agregarNotificacion(`${r.nombre}: faltan ${resultado} descansos largos para recuperar el uso.`, "info");
  } catch (error) {
    logger.error("[resolverRecuperacionDiferida] No se pudo determinar la espera:", error);
    usarAlmacenDM.getState().agregarNotificacion("El lanzamiento ya se completó. Falta determinar su espera; puedes reintentar desde el rasgo.", "advertencia");
  } finally { pendientes.delete(idPersonaje); }
}
