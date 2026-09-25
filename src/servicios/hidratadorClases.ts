import type { DefinicionClase, DefinicionSubclase } from "@/tipos/clases";
import type { PlantillaRasgoClase, SelectorRasgo } from "@/tipos/rasgos";
import { EsquemaDefinicionClaseJSON } from "@/tipos/esquemasCatalogos";
import { validarColeccionJSON } from "./cargadorCatalogos";
import { generarOpcionesSelectorInvocaciones } from "@/constantes/invocacionesSobrenaturales";

import barbaroJson from "@/datos/clases/barbaro.json";
import bardoJson from "@/datos/clases/bardo.json";
import brujoJson from "@/datos/clases/brujo.json";
import clerigoJson from "@/datos/clases/clerigo.json";
import druidaJson from "@/datos/clases/druida.json";
import exploradorJson from "@/datos/clases/explorador.json";
import guerreroJson from "@/datos/clases/guerrero.json";
import hechiceroJson from "@/datos/clases/hechicero.json";
import magoJson from "@/datos/clases/mago.json";
import monjeJson from "@/datos/clases/monje.json";
import paladinJson from "@/datos/clases/paladin.json";
import picaroJson from "@/datos/clases/picaro.json";

// =======================================================
// CATÁLOGO MAESTRO DE CLASES Y SUBCLASES D&D 5.5e (2024)
// Hidratado y validado desde datos JSON modulares
// =======================================================

const CLASES_RAW: unknown[] = [
  barbaroJson,
  bardoJson,
  brujoJson,
  clerigoJson,
  druidaJson,
  exploradorJson,
  guerreroJson,
  hechiceroJson,
  magoJson,
  monjeJson,
  paladinJson,
  picaroJson
];

/**
 * Hidrata selectores dinámicos en los rasgos de clase (ej. invocaciones sobrenaturales del Brujo).
 */
function hidratarSelectoresRasgo(rasgo: PlantillaRasgoClase): PlantillaRasgoClase {
  if (!rasgo.selectores || rasgo.selectores.length === 0) return rasgo;
  return {
    ...rasgo,
    selectores: rasgo.selectores.map((sel: SelectorRasgo) => {
      if (sel.claveOpcionesDinamicas === "invocaciones_brujo") {
        return {
          ...sel,
          opciones: generarOpcionesSelectorInvocaciones()
        };
      }
      return sel;
    })
  };
}

function hidratarClase(clase: DefinicionClase): DefinicionClase {
  return {
    ...clase,
    rasgos: clase.rasgos.map(hidratarSelectoresRasgo),
    subclases: clase.subclases.map((sub) => ({
      ...sub,
      rasgos: sub.rasgos.map(hidratarSelectoresRasgo)
    }))
  };
}

const CLASES_VALIDADAS = validarColeccionJSON<DefinicionClase>(
  CLASES_RAW,
  EsquemaDefinicionClaseJSON,
  "CatalogoClasesDND55"
);

export const CATALOGO_CLASES_DND55: DefinicionClase[] = CLASES_VALIDADAS.map(hidratarClase);

export const DICCIONARIO_CLASES_POR_NOMBRE: Record<string, DefinicionClase> = Object.fromEntries(
  CATALOGO_CLASES_DND55.map((c) => [c.nombre, c])
);

export const DICCIONARIO_CLASES_POR_ID: Record<string, DefinicionClase> = Object.fromEntries(
  CATALOGO_CLASES_DND55.map((c) => [c.id, c])
);

export const TODAS_SUBCLASES_DND55: DefinicionSubclase[] = CATALOGO_CLASES_DND55.flatMap((c) => c.subclases);
