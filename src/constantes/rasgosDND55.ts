import type {
  PlantillaRasgoClase,
  PlantillaRasgoEspecie
} from "@/tipos/rasgos";
import { CATALOGO_CLASES_DND55 } from "./clasesDND55";
import rasgosEspecieJson from "@/datos/rasgos-especie.json";

export type { PlantillaRasgoClase, PlantillaRasgoEspecie };

// =======================================================
// 1. RASGOS DE CLASES Y SUBCLASES OFICIALES (D&D 5.5e / 2024)
// Derivados dinámicamente de CATALOGO_CLASES_DND55
// =======================================================

export const RASGOS_POR_CLASE: Record<string, PlantillaRasgoClase[]> = Object.fromEntries(
  CATALOGO_CLASES_DND55.map((c) => [
    c.nombre,
    [
      ...c.rasgos,
      ...c.subclases.flatMap((sub) => sub.rasgos)
    ]
  ])
);

// =======================================================
// 2. RASGOS DE ESPECIES OFICIALES (D&D 5.5e / 2024)
// Cargados desde catálogo JSON
// =======================================================

export const RASGOS_POR_ESPECIE: Record<string, PlantillaRasgoEspecie[]> =
  rasgosEspecieJson as Record<string, PlantillaRasgoEspecie[]>;

// =======================================================
// 3. DOTES CANÓNICAS DE D&D 5.5e (PHB 2024)
// =======================================================

export {
  DOTES_ORIGEN_DND55,
  DOTES_GENERALES_Y_EPICAS_DND55,
  TODAS_LAS_DOTES_CANONICAS_DND55,
  TODAS_LAS_DOTES_CANONICAS_DND55 as DOTES_CANONICAS_DND55
} from "./dotesConstantes";
