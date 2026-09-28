import type { DefinicionEspecie } from "@/tipos/especies";
import type { SelectorRasgo } from "@/tipos/rasgos";
import { EsquemaDefinicionEspecieJSON } from "@/tipos/esquemasCatalogos";
import { validarColeccionJSON } from "@/servicios/cargadorCatalogos";
import { obtenerOpcionesDinamicas } from "@/servicios/hidratadorDotes";

import aasimarJson from "@/datos/especies/aasimar.json";
import draconidoJson from "@/datos/especies/draconido.json";
import elfoJson from "@/datos/especies/elfo.json";
import enanoJson from "@/datos/especies/enano.json";
import gnomoJson from "@/datos/especies/gnomo.json";
import goliatJson from "@/datos/especies/goliat.json";
import humanoJson from "@/datos/especies/humano.json";
import medianoJson from "@/datos/especies/mediano.json";
import orcoJson from "@/datos/especies/orco.json";
import tieflingJson from "@/datos/especies/tiefling.json";

// =======================================================
// CATÁLOGO CANÓNICO DE ESPECIES / RAZAS D&D 5.5e (2024)
// Hidratado y validado desde datos JSON modulares
// =======================================================

const ESPECIES_RAW: unknown[] = [
  aasimarJson,
  elfoJson,
  enanoJson,
  gnomoJson,
  goliatJson,
  humanoJson,
  medianoJson,
  orcoJson,
  tieflingJson,
  draconidoJson
];

function hidratarSelectores<T extends { selectores?: SelectorRasgo[] }>(objeto: T): T {
  if (!objeto.selectores || objeto.selectores.length === 0) return objeto;
  return {
    ...objeto,
    selectores: objeto.selectores.map((sel) => {
      if (sel.claveOpcionesDinamicas && (!sel.opciones || sel.opciones.length === 0)) {
        return {
          ...sel,
          opciones: obtenerOpcionesDinamicas(sel.claveOpcionesDinamicas)
        };
      }
      return sel;
    })
  };
}

function hidratarEspecie(esp: DefinicionEspecie): DefinicionEspecie {
  return {
    ...esp,
    rasgos: esp.rasgos.map(hidratarSelectores),
    subespecies: esp.subespecies?.map((sub) => ({
      ...sub,
      rasgos: sub.rasgos.map(hidratarSelectores)
    }))
  };
}

const ESPECIES_VALIDADAS: DefinicionEspecie[] = validarColeccionJSON(
  ESPECIES_RAW,
  EsquemaDefinicionEspecieJSON,
  "CatalogoEspeciesDND55"
);

export const CATALOGO_ESPECIES_DND55: DefinicionEspecie[] = ESPECIES_VALIDADAS.map(hidratarEspecie);

export const DICCIONARIO_ESPECIES_POR_ID: Record<string, DefinicionEspecie> = Object.fromEntries(
  CATALOGO_ESPECIES_DND55.map((esp) => [esp.id.toLowerCase(), esp])
);

export const DICCIONARIO_ESPECIES_POR_NOMBRE: Record<string, DefinicionEspecie> = Object.fromEntries(
  CATALOGO_ESPECIES_DND55.map((esp) => [esp.nombre.toLowerCase(), esp])
);
