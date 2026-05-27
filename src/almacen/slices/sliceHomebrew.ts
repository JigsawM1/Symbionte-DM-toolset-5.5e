import { StateCreator } from 'zustand';
import { MonstruoBase, HechizoBase, ObjetoHomebrew } from '../../tipos';
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from '../../utiles/datosIniciales';
import { persistirEstadoCompleto } from '../persistencia';
import type { EstadoDM } from '../usarAlmacenDM';

export interface SliceHomebrew {
  baseDatosMonstruos: MonstruoBase[];
  baseDatosHechizos: HechizoBase[];
  objetosHomebrew: ObjetoHomebrew[];

  agregarMonstruoHomebrew: (monstruo: Omit<MonstruoBase, "id">) => void;
  agregarHechizoHomebrew: (hechizo: Omit<HechizoBase, "id">) => void;
  agregarObjetoHomebrew: (objeto: Omit<ObjetoHomebrew, "id">) => void;
  actualizarMonstruoHomebrew: (id: string, monstruo: Omit<MonstruoBase, "id" | "vidaActual">) => void;
  actualizarHechizoHomebrew: (id: string, hechizo: Omit<HechizoBase, "id">) => void;
  actualizarObjetoHomebrew: (id: string, objeto: Omit<ObjetoHomebrew, "id">) => void;
  eliminarMonstruoHomebrew: (id: string) => void;
  eliminarHechizoHomebrew: (id: string) => void;
  eliminarObjetoHomebrew: (id: string) => void;
}

export const crearSliceHomebrew: StateCreator<
  EstadoDM,
  [],
  [],
  SliceHomebrew
> = (set, _get) => ({
  baseDatosMonstruos: MONSTRUOS_INICIALES,
  baseDatosHechizos: HECHIZOS_INICIALES,
  objetosHomebrew: [],

  agregarMonstruoHomebrew: (monstruo) => set((state) => {
    const nuevoMonstruo: MonstruoBase = {
      ...monstruo,
      id: `m_homebrew_${Date.now()}`
    };
    const nuevosMonstruos = [...state.baseDatosMonstruos, nuevoMonstruo];
    persistirEstadoCompleto({ ...state, baseDatosMonstruos: nuevosMonstruos });
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  agregarHechizoHomebrew: (hechizo) => set((state) => {
    const nuevoHechizo: HechizoBase = {
      ...hechizo,
      id: `h_homebrew_${Date.now()}`
    };
    const nuevosHechizos = [...state.baseDatosHechizos, nuevoHechizo];
    persistirEstadoCompleto({ ...state, baseDatosHechizos: nuevosHechizos });
    return { baseDatosHechizos: nuevosHechizos };
  }),

  agregarObjetoHomebrew: (objeto) => set((state) => {
    const nuevoObjeto: ObjetoHomebrew = {
      ...objeto,
      id: `o_homebrew_${Date.now()}`
    };
    const nuevosObjetos = [...state.objetosHomebrew, nuevoObjeto];
    persistirEstadoCompleto({ ...state, objetosHomebrew: nuevosObjetos });
    return { objetosHomebrew: nuevosObjetos };
  }),

  actualizarMonstruoHomebrew: (id, monstruo) => set((state) => {
    const nuevosMonstruos = state.baseDatosMonstruos.map((m) =>
      m.id === id ? { ...m, ...monstruo, id } as MonstruoBase : m
    );
    persistirEstadoCompleto({ ...state, baseDatosMonstruos: nuevosMonstruos });
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  actualizarHechizoHomebrew: (id, hechizo) => set((state) => {
    const nuevosHechizos = state.baseDatosHechizos.map((h) =>
      h.id === id ? { ...h, ...hechizo, id } as HechizoBase : h
    );
    persistirEstadoCompleto({ ...state, baseDatosHechizos: nuevosHechizos });
    return { baseDatosHechizos: nuevosHechizos };
  }),

  actualizarObjetoHomebrew: (id, objeto) => set((state) => {
    const nuevosObjetos = state.objetosHomebrew.map((o) =>
      o.id === id ? { ...o, ...objeto, id } as ObjetoHomebrew : o
    );
    persistirEstadoCompleto({ ...state, objetosHomebrew: nuevosObjetos });
    return { objetosHomebrew: nuevosObjetos };
  }),

  eliminarMonstruoHomebrew: (id) => set((state) => {
    const nuevosMonstruos = state.baseDatosMonstruos.filter((m) => m.id !== id);
    persistirEstadoCompleto({ ...state, baseDatosMonstruos: nuevosMonstruos });
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  eliminarHechizoHomebrew: (id) => set((state) => {
    const nuevosHechizos = state.baseDatosHechizos.filter((h) => h.id !== id);
    persistirEstadoCompleto({ ...state, baseDatosHechizos: nuevosHechizos });
    return { baseDatosHechizos: nuevosHechizos };
  }),

  eliminarObjetoHomebrew: (id) => set((state) => {
    const nuevosObjetos = state.objetosHomebrew.filter((o) => o.id !== id);
    persistirEstadoCompleto({ ...state, objetosHomebrew: nuevosObjetos });
    return { objetosHomebrew: nuevosObjetos };
  })
});
