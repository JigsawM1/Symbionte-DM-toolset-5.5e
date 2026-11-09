import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { estadoDelContexto, conservarFichasAjenas } from '@/almacen/campaniasPersonajes';

// Sub-slices especializados por responsabilidad
import { crearSubSlicePersonajesBase } from "./personajes/slicePersonajesBase";
import { crearSubSliceVitalidad } from "./personajes/sliceVitalidad";
import { crearSubSliceCaracteristicasHabilidades } from "./personajes/sliceCaracteristicasHabilidades";
import { crearSubSliceCondiciones } from "./personajes/sliceCondiciones";
import { crearSubSliceMagia } from "./personajes/sliceMagia";
import { crearSubSliceInventario } from "./personajes/sliceInventario";
import { crearSubSliceRasgos } from "./personajes/sliceRasgos";
import { crearSubSliceAcompanantes } from "./personajes/sliceAcompanantes";

// Tipos segregados y unificados
import type {
  SlicePersonajes,
  SubSlicePersonajesBase,
  SubSliceVitalidad,
  SubSliceCaracteristicasHabilidades,
  SubSliceCondiciones,
  SubSliceMagia,
  SubSliceInventario,
  SubSliceRasgos,
  SubSliceAcompanantes
} from "./personajes/slicePersonajesTipos";

// Re-exportaciones de tipos
export type {
  SlicePersonajes,
  SubSlicePersonajesBase,
  SubSliceVitalidad,
  SubSliceCaracteristicasHabilidades,
  SubSliceCondiciones,
  SubSliceMagia,
  SubSliceInventario,
  SubSliceRasgos,
  SubSliceAcompanantes
};

// Re-exportaciones de compatibilidad retroactiva
export { coincideHechizoId, deduplicarListaIds } from "@/servicios/comparadorHechizos";
export { sincronizarConjurosSubclaseHelper } from "@/servicios/sincronizadorConjurosSubclase";
export {
  resolverCondicionAsociadaRasgo,
  coincideCondicionConRasgo,
  resolverIdRasgoObjetivoGasto,
  normalizarTextoSeguro
} from "./personajes/condicionesRasgosHelpers";

/**
 * Creador del slice de personajes que ensambla de forma modular los 8 sub-slices de dominio.
 */
export const crearSlicePersonajes: StateCreator<
  EstadoDM,
  [],
  [],
  SlicePersonajes
> = (set, get, api) => {
  const leer = () => estadoDelContexto(get());
  const escribir: typeof set = (cambios, replace) => set(s => conservarFichasAjenas(s,
    typeof cambios === 'function' ? cambios(estadoDelContexto(s)) : cambios), replace);
  return ({
  ...crearSubSlicePersonajesBase(set, get, api),
  ...crearSubSliceVitalidad(escribir, leer, api),
  ...crearSubSliceCaracteristicasHabilidades(escribir, leer, api),
  ...crearSubSliceCondiciones(escribir, leer, api),
  ...crearSubSliceMagia(escribir, leer, api),
  ...crearSubSliceInventario(escribir, leer, api),
  ...crearSubSliceRasgos(escribir, leer, api),
  ...crearSubSliceAcompanantes(escribir, leer, api)
});
};
