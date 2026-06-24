import { StateCreator } from 'zustand';
import { ElementoPendiente, EncuentroGuardado, CriaturaIniciativa, NotificacionUI } from '../usarAlmacenDM';
import { MonstruoBase, HechizoBase, ObjetoHomebrew } from '../../tipos';
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES } from '../../utiles/datosIniciales';
import { leerBlobGlobal, limpiarBlobGlobal } from '../../utiles/almacenamientoTaleSpire';
import { sanearObjetoHomebrew, sanearHechizoCD, sanearMonstruoSentidosYPasiva } from '../sanitizacion';
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
  notificaciones: NotificacionUI[];
  cargandoDatos: boolean;

  agregarNotificacion: (mensaje: string, tipo?: "exito" | "error" | "info" | "advertencia") => void;
  eliminarNotificacion: (id: string) => void;

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
  notificaciones: [],
  cargandoDatos: false,

  establecerPestaña: (pestaña: string) => set({ pestañaActiva: pestaña }),
  establecerModoHomebrew: (modo: "crear" | "lista") => set({ modoHomebrew: modo }),
  establecerMetodoVidaMonstruo: (metodo: "estandar" | "maximo" | "azar") => {
    set({ metodoVidaMonstruo: metodo });
  },
  establecerDatosCampaña: (nombre: string, esGM: boolean) => set({ campañaNombre: nombre, esGM }),

  agregarNotificacion: (mensaje, tipo = "info") => set((state) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const nueva: NotificacionUI = { id, mensaje, tipo };
    
    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
      get().eliminarNotificacion(id);
    }, 4000);
    
    return { notificaciones: [...state.notificaciones, nueva] };
  }),

  eliminarNotificacion: (id) => set((state) => ({
    notificaciones: state.notificaciones.filter((n) => n.id !== id)
  })),

  agregarPendiente: (texto: string) => set((state) => {
    const nuevo: ElementoPendiente = { id: `p_local_${Date.now()}`, texto, completado: false };
    const nuevaLista = [...state.listaPendientes, nuevo];
    return { listaPendientes: nuevaLista };
  }),

  alternarPendiente: (id: string) => set((state) => {
    const nuevaLista = state.listaPendientes.map((p) => p.id === id ? { ...p, completado: !p.completado } : p);
    return { listaPendientes: nuevaLista };
  }),

  eliminarPendiente: (id: string) => set((state) => {
    const nuevaLista = state.listaPendientes.filter((p) => p.id !== id);
    return { listaPendientes: nuevaLista };
  }),

  guardarNotasDM: (notas: string) => set({ notasDM: notas }),


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
    return { encuentrosGuardados: nuevosEncuentros };
  }),


  cargarDatosPersistidos: () => {
    const ejecutarCarga = async () => {
      console.log("[TS Storage] Iniciando carga de datos persistidos...");
      const blob = await leerBlobGlobal();

      // Indicamos que estamos cargando datos para que el middleware ignore estos set() intermedios
      set({ cargandoDatos: true });

      if (blob && Object.keys(blob).length > 0) {
        console.log("[TS Storage] ✅ Blob encontrado. Cargando datos desde TS.localStorage.global...");

        const monstruosHomebrew = blob.monstruos_homebrew as MonstruoBase[] | undefined;
        const hechizosHomebrew  = blob.hechizos_homebrew  as HechizoBase[]  | undefined;
        const objetosHomebrew   = blob.objetos_homebrew   as ObjetoHomebrew[] | undefined;
        const pendientes        = blob.pendientes         as ElementoPendiente[] | undefined;
        const notas             = blob.notas              as string          | undefined;
        const notes             = blob.notes              as string          | undefined;
        const encuentros        = blob.encuentros         as EncuentroGuardado[] | undefined;
        const cola              = blob.cola_iniciativa    as CriaturaIniciativa[] | undefined;
        const ronda             = blob.ronda_actual       as number          | undefined;
        const turno             = blob.indice_turno_activo as number         | undefined;
        const metodo            = blob.metodo_vida        as "estandar" | "maximo" | "azar" | undefined;
        const asociaciones      = blob.asociaciones_fichas as Record<string, string> | undefined;

        if (monstruosHomebrew && monstruosHomebrew.length > 0) {
          set(() => ({ baseDatosMonstruos: [...MONSTRUOS_INICIALES, ...monstruosHomebrew.map(sanearMonstruoSentidosYPasiva)] }));
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
        if (notes !== undefined && notes !== null) {
          set({ notasDM: notes });
        } else if (notas !== undefined && notas !== null) {
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
        if (asociaciones) {
          set({ asociacionesFichas: asociaciones });
        }

        console.log("[TS Storage] Carga completa desde blob oficial de TaleSpire.");
        set({ cargandoDatos: false });
        return;
      }

      console.log("[TS Storage] Primera sesión limpia. Comenzando desde cero.");
      set({ cargandoDatos: false });
    };

    ejecutarCarga().catch((error) => {
      console.error("[TS Storage] Error crítico al cargar datos:", error);
      set({ cargandoDatos: false });
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
    }

    return result.modificado;
  },

  restablecerDatosDeFabrica: () => {
    limpiarBlobGlobal().then(() => {
      console.log("[TS Storage] Blob oficial limpiado durante restablecimiento de fábrica.");
    }).catch((e) => {
      console.error("[TS Storage] Error al limpiar el blob oficial:", e);
    });

    set({ cargandoDatos: true });

    set({
      colaIniciativa: [],
      rondaActual: 1,
      indiceTurnoActivo: 0,
      asociacionesFichas: {},
      baseDatosMonstruos: MONSTRUOS_INICIALES,
      baseDatosHechizos: HECHIZOS_INICIALES,
      objetosHomebrew: [],
      listaPendientes: [
        { id: "p_1", texto: "Revisar hojas de personaje de los jugadores", completado: false },
        { id: "p_2", texto: "Preparar encuentro en el puente levadizo", completado: false },
        { id: "p_3", texto: "Hacer tiradas de rumores en la taberna", completado: false }
      ],
      notasDM: "Escribe aquí las notas de tu sesión de D&D 5.5e...",
      encuentrosGuardados: [],
      cargandoDatos: false
    });
  }
});

