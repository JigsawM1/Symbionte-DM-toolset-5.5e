import { MonstruoBase, HechizoBase, ObjetoHomebrew } from '../../tipos';
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from '../../utiles/datosIniciales';
import { persistirEstadoCompleto } from '../persistencia';

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

export const crearSliceHomebrew = (set: any, _get: any) => ({
  baseDatosMonstruos: MONSTRUOS_INICIALES,
  baseDatosHechizos: HECHIZOS_INICIALES,
  objetosHomebrew: [],

  agregarMonstruoHomebrew: (monstruo: any) => set((state: any) => {
    const nuevoMonstruo: MonstruoBase = {
      ...monstruo,
      id: `m_homebrew_${Date.now()}`
    };
    const nuevosMonstruos = [...state.baseDatosMonstruos, nuevoMonstruo];
    persistirEstadoCompleto({ ...state, baseDatosMonstruos: nuevosMonstruos });
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  agregarHechizoHomebrew: (hechizo: any) => set((state: any) => {
    const nuevoHechizo: HechizoBase = {
      ...hechizo,
      id: `h_homebrew_${Date.now()}`
    };
    const nuevosHechizos = [...state.baseDatosHechizos, nuevoHechizo];
    persistirEstadoCompleto({ ...state, baseDatosHechizos: nuevosHechizos });
    return { baseDatosHechizos: nuevosHechizos };
  }),

  agregarObjetoHomebrew: (objeto: any) => set((state: any) => {
    const nuevoObjeto: ObjetoHomebrew = {
      ...objeto,
      id: `o_homebrew_${Date.now()}`
    };
    const nuevosObjetos = [...state.objetosHomebrew, nuevoObjeto];
    persistirEstadoCompleto({ ...state, objetosHomebrew: nuevosObjetos });
    return { objetosHomebrew: nuevosObjetos };
  }),

  actualizarMonstruoHomebrew: (id: string, monstruo: any) => set((state: any) => {
    const nuevosMonstruos = state.baseDatosMonstruos.map((m: any) =>
      m.id === id ? { ...m, ...monstruo, id } : m
    );
    persistirEstadoCompleto({ ...state, baseDatosMonstruos: nuevosMonstruos });
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  actualizarHechizoHomebrew: (id: string, hechizo: any) => set((state: any) => {
    const nuevosHechizos = state.baseDatosHechizos.map((h: any) =>
      h.id === id ? { ...h, ...hechizo, id } : h
    );
    persistirEstadoCompleto({ ...state, baseDatosHechizos: nuevosHechizos });
    return { baseDatosHechizos: nuevosHechizos };
  }),

  actualizarObjetoHomebrew: (id: string, objeto: any) => set((state: any) => {
    const nuevosObjetos = state.objetosHomebrew.map((o: any) =>
      o.id === id ? { ...o, ...objeto, id } : o
    );
    persistirEstadoCompleto({ ...state, objetosHomebrew: nuevosObjetos });
    return { objetosHomebrew: nuevosObjetos };
  }),

  eliminarMonstruoHomebrew: (id: string) => set((state: any) => {
    const nuevosMonstruos = state.baseDatosMonstruos.filter((m: any) => m.id !== id);
    persistirEstadoCompleto({ ...state, baseDatosMonstruos: nuevosMonstruos });
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  eliminarHechizoHomebrew: (id: string) => set((state: any) => {
    const nuevosHechizos = state.baseDatosHechizos.filter((h: any) => h.id !== id);
    persistirEstadoCompleto({ ...state, baseDatosHechizos: nuevosHechizos });
    return { baseDatosHechizos: nuevosHechizos };
  }),

  eliminarObjetoHomebrew: (id: string) => set((state: any) => {
    const nuevosObjetos = state.objetosHomebrew.filter((o: any) => o.id !== id);
    persistirEstadoCompleto({ ...state, objetosHomebrew: nuevosObjetos });
    return { objetosHomebrew: nuevosObjetos };
  })
});
