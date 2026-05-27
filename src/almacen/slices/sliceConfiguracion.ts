import { StateCreator } from 'zustand';
import { ElementoPendiente, EncuentroGuardado, CriaturaIniciativa } from '../usarAlmacenDM';
import { MonstruoBase, HechizoBase, ObjetoHomebrew } from '../../tipos';
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from '../../utiles/datosIniciales';
import { obtenerDatoFragmentado } from '../../utiles/almacenamientoFragmentos';
import { leerBlobGlobal, guardarBlobGlobal, limpiarBlobGlobal } from '../../utiles/almacenamientoTaleSpire';
import { sanearObjetoHomebrew, sanearHechizoCD } from '../sanitizacion';
import { persistirEstadoCompleto } from '../persistencia';
import { importarDesdeJSON } from '../importadorJSON';
import type { EstadoDM } from '../usarAlmacenDM';

export interface SliceConfiguracion {
  pestañaActiva: string;
  modoHomebrew: "crear" | "lista";
  metodoVidaMonstruo: "estandar" | "maximo" | "azar";
  campañaNombre: string;
  esGM: boolean;
  listaPendientes: ElementoPendiente[];
  notasDM: string;
  encuentrosGuardados: EncuentroGuardado[];

  establecerPestaña: (pestaña: string) => void;
  establecerModoHomebrew: (modo: "crear" | "lista") => void;
  establecerMetodoVidaMonstruo: (metodo: "estandar" | "maximo" | "azar") => void;
  establecerDatosCampaña: (nombre: string, esGM: boolean) => void;

  agregarPendiente: (texto: string) => void;
  alternarPendiente: (id: string) => void;
  eliminarPendiente: (id: string) => void;

  guardarNotasDM: (notas: string) => void;

  guardarEncuentroActual: (nombre: string) => boolean;
  cargarEncuentro: (nombre: string) => boolean;
  eliminarEncuentroGuardado: (nombre: string) => void;

  cargarDatosPersistidos: () => void;
  importarBaseDatosJSONCompleta: (datosJSON: unknown) => boolean;
  restablecerDatosDeFabrica: () => void;
}

export const crearSliceConfiguracion: StateCreator<
  EstadoDM,
  [],
  [],
  SliceConfiguracion
> = (set, get) => ({
  pestañaActiva: "iniciativa",
  modoHomebrew: "crear" as const,
  metodoVidaMonstruo: "azar" as const,
  campañaNombre: "Cargando campaña de TaleSpire...",
  esGM: true,
  listaPendientes: [
    { id: "p_1", texto: "Revisar hojas de personaje de los jugadores", completado: false },
    { id: "p_2", texto: "Preparar encuentro en el puente levadizo", completado: false },
    { id: "p_3", texto: "Hacer tiradas de rumores en la taberna", completado: false }
  ],
  notasDM: "Escribe aquí las notas de tu sesión de D&D 5.5e...",
  encuentrosGuardados: [],

  establecerPestaña: (pestaña: string) => set({ pestañaActiva: pestaña }),
  establecerModoHomebrew: (modo: "crear" | "lista") => set({ modoHomebrew: modo }),
  establecerMetodoVidaMonstruo: (metodo: "estandar" | "maximo" | "azar") => {
    set({ metodoVidaMonstruo: metodo });
    persistirEstadoCompleto(get());
  },
  establecerDatosCampaña: (nombre: string, esGM: boolean) => set({ campañaNombre: nombre, esGM }),

  agregarPendiente: (texto: string) => set((state) => {
    const nuevo: ElementoPendiente = { id: `p_local_${Date.now()}`, texto, completado: false };
    const nuevaLista = [...state.listaPendientes, nuevo];
    persistirEstadoCompleto({ ...state, listaPendientes: nuevaLista });
    return { listaPendientes: nuevaLista };
  }),

  alternarPendiente: (id: string) => set((state) => {
    const nuevaLista = state.listaPendientes.map((p) => p.id === id ? { ...p, completado: !p.completado } : p);
    persistirEstadoCompleto({ ...state, listaPendientes: nuevaLista });
    return { listaPendientes: nuevaLista };
  }),

  eliminarPendiente: (id: string) => set((state) => {
    const nuevaLista = state.listaPendientes.filter((p) => p.id !== id);
    persistirEstadoCompleto({ ...state, listaPendientes: nuevaLista });
    return { listaPendientes: nuevaLista };
  }),

  guardarNotasDM: (notas: string) => set((state) => {
    persistirEstadoCompleto({ ...state, notasDM: notas });
    return { notasDM: notas };
  }),

  guardarEncuentroActual: (nombre: string) => {
    const state = get();
    if (!nombre.trim() || state.colaIniciativa.length === 0) return false;
    const nuevoEncuentro: EncuentroGuardado = {
      nombre: nombre.trim(),
      ronda: state.rondaActual,
      cola: state.colaIniciativa,
      fecha: new Date().toLocaleString("es-ES")
    };
    const encuentrosLimpios = state.encuentrosGuardados.filter(
      (e) => e.nombre.toLowerCase() !== nombre.trim().toLowerCase()
    );
    const nuevosEncuentros = [...encuentrosLimpios, nuevoEncuentro];
    set({ encuentrosGuardados: nuevosEncuentros });
    persistirEstadoCompleto({ ...state, encuentrosGuardados: nuevosEncuentros });
    return true;
  },

  cargarEncuentro: (nombre: string) => {
    const state = get();
    const encuentro = state.encuentrosGuardados.find((e) => e.nombre.toLowerCase() === nombre.toLowerCase());
    if (!encuentro) return false;
    set({ colaIniciativa: encuentro.cola, rondaActual: encuentro.ronda, indiceTurnoActivo: 0 });
    return true;
  },

  eliminarEncuentroGuardado: (nombre: string) => set((state) => {
    const nuevosEncuentros = state.encuentrosGuardados.filter((e) => e.nombre !== nombre);
    persistirEstadoCompleto({ ...state, encuentrosGuardados: nuevosEncuentros });
    return { encuentrosGuardados: nuevosEncuentros };
  }),

  cargarDatosPersistidos: () => {
    const ejecutarCarga = async () => {
      console.log("[TS Storage] Iniciando carga de datos persistidos...");
      const blob = await leerBlobGlobal();

      if (blob && Object.keys(blob).length > 0) {
        console.log("[TS Storage] ✅ Blob encontrado. Cargando datos desde TS.localStorage.global...");

        const monstruosHomebrew = blob.monstruos_homebrew as MonstruoBase[] | undefined;
        const hechizosHomebrew  = blob.hechizos_homebrew  as HechizoBase[]  | undefined;
        const objetosHomebrew   = blob.objetos_homebrew   as ObjetoHomebrew[] | undefined;
        const pendientes        = blob.pendientes         as ElementoPendiente[] | undefined;
        const notas             = blob.notas              as string          | undefined;
        const encuentros        = blob.encuentros         as EncuentroGuardado[] | undefined;
        const cola              = blob.cola_iniciativa    as CriaturaIniciativa[] | undefined;
        const ronda             = blob.ronda_actual       as number          | undefined;
        const turno             = blob.indice_turno_activo as number         | undefined;
        const metodo            = blob.metodo_vida        as "estandar" | "maximo" | "azar" | undefined;

        if (monstruosHomebrew && monstruosHomebrew.length > 0) {
          set(() => ({ baseDatosMonstruos: [...MONSTRUOS_INICIALES, ...monstruosHomebrew] }));
        }
        if (hechizosHomebrew && hechizosHomebrew.length > 0) {
          set(() => ({ baseDatosHechizos: [...HECHIZOS_INICIALES, ...hechizosHomebrew.map(sanearHechizoCD)] }));
        }
        if (objetosHomebrew && objetosHomebrew.length > 0) {
          set({ objetosHomebrew: objetosHomebrew.map(sanearObjetoHomebrew) });
        }
        if (pendientes && pendientes.length > 0) {
          set({ listaPendientes: pendientes });
        }
        if (notas !== undefined && notas !== null) {
          set({ notasDM: notas });
        }
        if (encuentros && encuentros.length > 0) {
          set({ encuentrosGuardados: encuentros });
        }
        if (cola && cola.length > 0) {
          set({ colaIniciativa: cola });
        }
        if (ronda !== undefined && ronda !== null) {
          set({ rondaActual: ronda });
        }
        if (turno !== undefined && turno !== null) {
          set({ indiceTurnoActivo: turno });
        }
        if (metodo) {
          set({ metodoVidaMonstruo: metodo });
        }

        console.log("[TS Storage] Carga completa desde blob oficial de TaleSpire.");
        return;
      }

      console.log("[TS Storage] Blob vacío. Buscando datos en LocalStorage para migrar...");
      let migradoAlgo = false;
      const estadoNuevo: Partial<EstadoDM> = {};

      const monstruosLS = obtenerDatoFragmentado<MonstruoBase[]>("dm_monstruos_homebrew");
      if (monstruosLS && monstruosLS.length > 0) {
        estadoNuevo.baseDatosMonstruos = [...MONSTRUOS_INICIALES, ...monstruosLS];
        migradoAlgo = true;
      }

      const hechizosLS = obtenerDatoFragmentado<HechizoBase[]>("dm_hechizos_homebrew");
      if (hechizosLS && hechizosLS.length > 0) {
        estadoNuevo.baseDatosHechizos = [...HECHIZOS_INICIALES, ...hechizosLS.map(sanearHechizoCD)];
        migradoAlgo = true;
      }

      const objetosLS = obtenerDatoFragmentado<ObjetoHomebrew[]>("dm_objetos_homebrew");
      if (objetosLS && objetosLS.length > 0) {
        estadoNuevo.objetosHomebrew = objetosLS.map(sanearObjetoHomebrew);
        migradoAlgo = true;
      }

      const pendientesLS = obtenerDatoFragmentado<ElementoPendiente[]>("dm_pendientes");
      if (pendientesLS && pendientesLS.length > 0) {
        estadoNuevo.listaPendientes = pendientesLS;
        migradoAlgo = true;
      }

      const notasLS = localStorage.getItem("dm_notes") || localStorage.getItem("dm_notas");
      if (notasLS !== null) {
        estadoNuevo.notasDM = notasLS;
        migradoAlgo = true;
      }

      const encuentrosLS = obtenerDatoFragmentado<EncuentroGuardado[]>("dm_encuentros_guardados");
      if (encuentrosLS && encuentrosLS.length > 0) {
        estadoNuevo.encuentrosGuardados = encuentrosLS;
        migradoAlgo = true;
      }

      const colaLS = obtenerDatoFragmentado<CriaturaIniciativa[]>("dm_cola_iniciativa");
      if (colaLS && colaLS.length > 0) {
        estadoNuevo.colaIniciativa = colaLS;
        migradoAlgo = true;
      }

      const metodoLS = localStorage.getItem("dm_metodo_vida_monstruo") as "estandar" | "maximo" | "azar" | null;
      if (metodoLS) estadoNuevo.metodoVidaMonstruo = metodoLS;

      const rondaLS = localStorage.getItem("dm_ronda_actual");
      if (rondaLS) estadoNuevo.rondaActual = Number(rondaLS) || 1;

      const turnoLS = localStorage.getItem("dm_indice_turno_activo");
      if (turnoLS) estadoNuevo.indiceTurnoActivo = Number(turnoLS) || 0;

      if (Object.keys(estadoNuevo).length > 0) {
        set(estadoNuevo);
      }

      const estadoFinal = { ...get(), ...estadoNuevo } as EstadoDM;
      await guardarBlobGlobal({
        monstruos_homebrew:  (estadoFinal.baseDatosMonstruos || []).filter(m => !MONSTRUOS_INICIALES.some(i => i.id === m.id)),
        hechizos_homebrew:   (estadoFinal.baseDatosHechizos || []).filter(h => !HECHIZOS_INICIALES.some(i => i.id === h.id)),
        objetos_homebrew:    estadoFinal.objetosHomebrew    || [],
        pendientes:          estadoFinal.listaPendientes    || [],
        notes:               estadoFinal.notasDM            || "",
        notas:               estadoFinal.notasDM            || "",
        encuentros:          estadoFinal.encuentrosGuardados || [],
        cola_iniciativa:     estadoFinal.colaIniciativa     || [],
        ronda_actual:        estadoFinal.rondaActual        || 1,
        indice_turno_activo: estadoFinal.indiceTurnoActivo  || 0,
        metodo_vida:         estadoFinal.metodoVidaMonstruo || "estandar",
      });

      if (migradoAlgo) {
        console.log("[TS Storage] ✅ Migración desde LocalStorage completada y guardada en blob TS.");
      } else {
        console.log("[TS Storage] Primera sesión limpia. Comenzando desde cero.");
      }
    };

    ejecutarCarga().catch((error) => {
      console.error("[TS Storage] Error crítico al cargar datos:", error);
      const monstruosLS = obtenerDatoFragmentado<MonstruoBase[]>("dm_monstruos_homebrew");
      if (monstruosLS && monstruosLS.length > 0) {
        set(() => ({ baseDatosMonstruos: [...MONSTRUOS_INICIALES, ...monstruosLS] }));
      }
      const pendientesLS = obtenerDatoFragmentado<ElementoPendiente[]>("dm_pendientes");
      if (pendientesLS) set({ listaPendientes: pendientesLS });
      const notasLS = localStorage.getItem("dm_notes") || localStorage.getItem("dm_notas");
      if (notasLS !== null) set({ notasDM: notasLS });
    });
  },

  importarBaseDatosJSONCompleta: (datosJSON) => {
    const estado = get();
    const result = importarDesdeJSON(datosJSON, {
      baseDatosMonstruos: estado.baseDatosMonstruos,
      baseDatosHechizos: estado.baseDatosHechizos,
      objetosHomebrew: estado.objetosHomebrew
    });

    if (result.modificado) {
      set({
        baseDatosMonstruos: result.baseDatosMonstruos,
        baseDatosHechizos: result.baseDatosHechizos,
        objetosHomebrew: result.objetosHomebrew
      });
      persistirEstadoCompleto({
        ...estado,
        baseDatosMonstruos: result.baseDatosMonstruos,
        baseDatosHechizos: result.baseDatosHechizos,
        objetosHomebrew: result.objetosHomebrew
      });
    }

    return result.modificado;
  },

  restablecerDatosDeFabrica: () => {
    limpiarBlobGlobal().then(() => {
      console.log("[TS Storage] Blob oficial limpiado durante restablecimiento de fábrica.");
    }).catch((e) => {
      console.error("[TS Storage] Error al limpiar el blob oficial:", e);
    });

    try {
      localStorage.removeItem("dm_notas");
      localStorage.removeItem("dm_notes");
      localStorage.removeItem("dm_ronda_actual");
      localStorage.removeItem("dm_indice_turno_activo");
      localStorage.removeItem("dm_metodo_vida_monstruo");
    } catch (_) { /* ignorar errores de LS */ }

    set({
      colaIniciativa: [],
      rondaActual: 1,
      indiceTurnoActivo: 0,
      baseDatosMonstruos: MONSTRUOS_INICIALES,
      baseDatosHechizos: HECHIZOS_INICIALES,
      objetosHomebrew: [],
      listaPendientes: [
        { id: "p_1", texto: "Revisar hojas de personaje de los jugadores", completado: false },
        { id: "p_2", texto: "Preparar encuentro en el puente levadizo", completado: false },
        { id: "p_3", texto: "Hacer tiradas de rumores en la taberna", completado: false }
      ],
      notasDM: "Escribe aquí las notas de tu sesión de D&D 5.5e...",
      encuentrosGuardados: []
    });

    persistirEstadoCompleto({
      colaIniciativa: [],
      rondaActual: 1,
      indiceTurnoActivo: 0,
      baseDatosMonstruos: MONSTRUOS_INICIALES,
      baseDatosHechizos: HECHIZOS_INICIALES,
      objetosHomebrew: [],
      listaPendientes: [
        { id: "p_1", texto: "Revisar hojas de personaje de los jugadores", completado: false },
        { id: "p_2", texto: "Preparar encuentro en el puente levadizo", completado: false },
        { id: "p_3", texto: "Hacer tiradas de rumores en la taberna", completado: false }
      ],
      notasDM: "Escribe aquí las notas de tu sesión de D&D 5.5e...",
      encuentrosGuardados: []
    });
  }
});
