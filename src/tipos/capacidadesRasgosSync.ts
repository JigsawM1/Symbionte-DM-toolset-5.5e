import { z } from "zod";
import { EsquemaPersonajeJugador } from "./personaje";

/** Identidad y reglas necesarias para reconstruir rasgos; excluye inventario y notas de la ficha. */
export const EsquemaCapacidadesRasgosSync = EsquemaPersonajeJugador.pick({
  nivel: true, clase: true, subclase: true, clases: true, especie: true, subespecie: true, caracteristicas: true,
  overridesFijos: true, clasesLanzadoras: true, rasgos: true
});
export type CapacidadesRasgosSync = z.infer<typeof EsquemaCapacidadesRasgosSync>;
