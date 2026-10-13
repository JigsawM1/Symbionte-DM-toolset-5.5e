import { z } from "zod";

export const EsquemaCaracteristica = z.enum([
  "fuerza", "destreza", "constitucion", "inteligencia", "sabiduria", "carisma"
]);
export type Caracteristica = z.infer<typeof EsquemaCaracteristica>;

export const EsquemaTipoLanzador = z.enum([
  "completo",
  "medio",
  "tercio",
  "pacto",
  "ninguno"
]);
export type TipoLanzador = z.infer<typeof EsquemaTipoLanzador>;

export const EsquemaModeloConjuros = z.enum([
  "conocidos",
  "preparados",
  "grimorio",
  "ninguno"
]);
export type ModeloConjuros = z.infer<typeof EsquemaModeloConjuros>;
