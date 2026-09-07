import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";

// Sub-slices especializados por responsabilidad
import { crearSubSlicePersonajesBase } from "./personajes/slicePersonajesBase";
import { crearSubSliceVitalidad } from "./personajes/sliceVitalidad";
import { crearSubSliceCaracteristicasHabilidades } from "./personajes/sliceCaracteristicasHabilidades";
import { crearSubSliceCondiciones } from "./personajes/sliceCondiciones";
import { crearSubSliceMagia } from "./personajes/sliceMagia";
import { crearSubSliceInventario } from "./personajes/sliceInventario";
import { crearSubSliceRasgos } from "./personajes/sliceRasgos";

// Tipos segregados y unificados
import type {
  SlicePersonajes,
  SubSlicePersonajesBase,
  SubSliceVitalidad,
  SubSliceCaracteristicasHabilidades,
  SubSliceCondiciones,
  SubSliceMagia,
  SubSliceInventario,
  SubSliceRasgos
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
  SubSliceRasgos
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
 * Creador del slice de personajes que ensambla de forma modular los 7 sub-slices de dominio.
 */
export const crearSlicePersonajes: StateCreator<
  EstadoDM,
  [],
  [],
  SlicePersonajes
> = (set, get, api) => ({
  ...crearSubSlicePersonajesBase(set, get, api),
  ...crearSubSliceVitalidad(set, get, api),
  ...crearSubSliceCaracteristicasHabilidades(set, get, api),
  ...crearSubSliceCondiciones(set, get, api),
  ...crearSubSliceMagia(set, get, api),
  ...crearSubSliceInventario(set, get, api),
  ...crearSubSliceRasgos(set, get, api)
});
