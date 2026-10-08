import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { SubSliceRasgos } from "./slicePersonajesTipos";
import { crearSliceEdicionRasgos } from "./sliceEdicionRasgos";
import { crearSliceRecursosRasgos } from "./sliceRecursosRasgos";
import { crearSliceActivacionRasgos } from "./sliceActivacionRasgos";
import { crearSliceSelectoresRasgos } from "./sliceSelectoresRasgos";

export const crearSubSliceRasgos: StateCreator<EstadoDM, [], [], SubSliceRasgos> = (...argumentos) => ({
  ...crearSliceEdicionRasgos(...argumentos),
  ...crearSliceRecursosRasgos(...argumentos),
  ...crearSliceActivacionRasgos(...argumentos),
  ...crearSliceSelectoresRasgos(...argumentos),
});
