import { StateCreator } from 'zustand';
import { MonstruoBase, HechizoBase, ObjetoHomebrew } from '../../tipos';
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from '../../utiles/datosIniciales';
import { sanearMonstruoSentidosYPasiva, sanearHechizoCD, sanearObjetoHomebrew } from '../sanitizacion';
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
> = (set) => ({
  baseDatosMonstruos: MONSTRUOS_INICIALES.map(sanearMonstruoSentidosYPasiva),
  baseDatosHechizos: HECHIZOS_INICIALES.map(sanearHechizoCD),
  objetosHomebrew: [],

  agregarMonstruoHomebrew: (monstruo) => set((state) => {
    const nuevoMonstruo: MonstruoBase = sanearMonstruoSentidosYPasiva({
      ...monstruo,
      id: `m_homebrew_${Date.now()}`
    });
    const nuevosMonstruos = [...state.baseDatosMonstruos, nuevoMonstruo];
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  agregarHechizoHomebrew: (hechizo) => set((state) => {
    const nuevoHechizo: HechizoBase = sanearHechizoCD({
      ...hechizo,
      id: `h_homebrew_${Date.now()}`
    } as HechizoBase);
    const nuevosHechizos = [...state.baseDatosHechizos, nuevoHechizo];
    return { baseDatosHechizos: nuevosHechizos };
  }),

  agregarObjetoHomebrew: (objeto) => set((state) => {
    const nuevoObjeto = sanearObjetoHomebrew({
      ...objeto,
      id: `o_homebrew_${Date.now()}`
    });
    const nuevosObjetos = [...state.objetosHomebrew, nuevoObjeto];
    return { objetosHomebrew: nuevosObjetos };
  }),

  actualizarMonstruoHomebrew: (id, monstruo) => set((state) => {
    const nuevosMonstruos = state.baseDatosMonstruos.map((m) =>
      m.id === id ? sanearMonstruoSentidosYPasiva({ ...m, ...monstruo, id } as MonstruoBase) : m
    );
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  actualizarHechizoHomebrew: (id, hechizo) => set((state) => {
    const nuevosHechizos = state.baseDatosHechizos.map((h) =>
      h.id === id ? sanearHechizoCD({ ...h, ...hechizo, id } as HechizoBase) : h
    );
    return { baseDatosHechizos: nuevosHechizos };
  }),

  actualizarObjetoHomebrew: (id, objeto) => set((state) => {
    const nuevosObjetos = state.objetosHomebrew.map((o) =>
      o.id === id ? sanearObjetoHomebrew({ ...o, ...objeto, id }) : o
    );
    return { objetosHomebrew: nuevosObjetos };
  }),

  eliminarMonstruoHomebrew: (id) => set((state) => {
    const nuevosMonstruos = state.baseDatosMonstruos.filter((m) => m.id !== id);
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  eliminarHechizoHomebrew: (id) => set((state) => {
    const nuevosHechizos = state.baseDatosHechizos.filter((h) => h.id !== id);
    return { baseDatosHechizos: nuevosHechizos };
  }),

  eliminarObjetoHomebrew: (id) => set((state) => {
    const nuevosObjetos = state.objetosHomebrew.filter((o) => o.id !== id);
    return { objetosHomebrew: nuevosObjetos };
  })
});

