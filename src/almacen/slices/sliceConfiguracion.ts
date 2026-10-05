import { StateCreator } from 'zustand';
import { ElementoPendiente, EncuentroGuardado, CriaturaIniciativa, NotificacionUI } from '@/almacen/usarAlmacenDM';
import { MonstruoBase, HechizoBase, ObjetoHomebrew, PersonajeJugador } from '@/tipos';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES, OBJETOS_INICIALES } from '@/utiles/datosIniciales';
import { leerBlobGlobal, limpiarBlobGlobal } from '@/utiles/almacenamientoTaleSpire';
import {
  sanearObjetoHomebrew,
  sanearHechizoCD,
  sanearMonstruoSentidosYPasiva,
  sanearPersonaje,
  sanearCriaturaIniciativa,
  sanearElementoPendiente,
  sanearEncuentroGuardado
} from '@/almacen/sanitizacion';
import { importarDesdeJSON, importarPersonajesDesdeJSON } from '@/almacen/importadorJSON';
import { hidratarPersonaje } from '@/servicios/serializadorPersonaje';
import { desduplicarEntidades } from '@/utiles/busquedaTolerante';
import type { EstadoDM } from '@/almacen/usarAlmacenDM';
import { generarId } from '@/utiles/generarId';
import { logger } from '@/utiles/logger';
import { establecerCacheEsGM } from '@/utiles/TaleSpireAdapter';

export interface SliceConfiguracion {
  pestañaActiva: string;
  modoHomebrew: "crear" | "lista";
  tipoHomebrewActivo: "criatura" | "hechizo" | "objeto";
  metodoVidaMonstruo: "estandar" | "maximo" | "azar";
  sistemaMagia: "espacios" | "puntos";
  campañaNombre: string;
  esGM: boolean;
  mostrarPorcentajeVidaAJugadores: boolean;
  listaPendientes: ElementoPendiente[];
  notasDM: string;
  encuentrosGuardados: EncuentroGuardado[];
  notificaciones: NotificacionUI[];
  cargandoDatos: boolean;
  datosInicialesCargados: boolean;

  agregarNotificacion: (mensaje: string, tipo?: "exito" | "error" | "info" | "advertencia") => void;
  eliminarNotificacion: (id: string) => void;

  establecerPestaña: (pestaña: string) => void;
  establecerModoHomebrew: (modo: "crear" | "lista") => void;
  establecerTipoHomebrew: (tipo: "criatura" | "hechizo" | "objeto") => void;
  establecerMetodoVidaMonstruo: (metodo: "estandar" | "maximo" | "azar") => void;
  establecerSistemaMagia: (sistema: "espacios" | "puntos") => void;
  establecerEsGM: (esGM: boolean) => void;
  establecerDatosCampaña: (nombre: string, esGM: boolean) => void;
  establecerMostrarPorcentajeVidaAJugadores: (permitir: boolean) => void;

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
  pestañaActiva: "jugadores",
  modoHomebrew: "crear" as const,
  tipoHomebrewActivo: "criatura" as const,
  metodoVidaMonstruo: "azar" as const,
  sistemaMagia: "espacios" as const,
  campañaNombre: "Cargando campaña de TaleSpire...",
  esGM: false,
  mostrarPorcentajeVidaAJugadores: typeof localStorage !== "undefined" ? localStorage.getItem("ts_mostrar_porcentaje_vida") !== "false" : true,
  listaPendientes: [
    { id: "p_1", texto: "Revisar hojas de personaje de los jugadores", completado: false },
    { id: "p_2", texto: "Preparar encuentro en el puente levadizo", completado: false },
    { id: "p_3", texto: "Hacer tiradas de rumores en la taberna", completado: false }
  ],
  notasDM: "Escribe aquí las notas de tu sesión...",
  encuentrosGuardados: [],
  notificaciones: [],
  cargandoDatos: true,
  datosInicialesCargados: false,

  establecerPestaña: (pestaña: string) => set({ pestañaActiva: pestaña }),
  establecerModoHomebrew: (modo: "crear" | "lista") => set({ modoHomebrew: modo }),
  establecerTipoHomebrew: (tipo: "criatura" | "hechizo" | "objeto") => set({ tipoHomebrewActivo: tipo }),
  establecerMetodoVidaMonstruo: (metodo: "estandar" | "maximo" | "azar") => {
    set({ metodoVidaMonstruo: metodo });
  },
  establecerSistemaMagia: (sistema: "espacios" | "puntos") => {
    set({ sistemaMagia: sistema });
  },
  establecerEsGM: (esGM: boolean) => {
    establecerCacheEsGM(esGM);
    set((state) => ({
      esGM,
      pestañaActiva: esGM && state.pestañaActiva === "jugadores"
        ? "iniciativa"
        : !esGM && (state.pestañaActiva === "tablas" || state.pestañaActiva === "pendientes")
        ? "jugadores"
        : state.pestañaActiva
    }));
  },
  establecerDatosCampaña: (nombre: string, esGM: boolean) => {
    establecerCacheEsGM(esGM);
    set((state) => ({
      campañaNombre: nombre,
      esGM,
      pestañaActiva: esGM && state.pestañaActiva === "jugadores"
        ? "iniciativa"
        : !esGM && (state.pestañaActiva === "tablas" || state.pestañaActiva === "pendientes")
        ? "jugadores"
        : state.pestañaActiva
    }));
  },
  establecerMostrarPorcentajeVidaAJugadores: (permitir: boolean) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("ts_mostrar_porcentaje_vida", String(permitir));
    }
    set({ mostrarPorcentajeVidaAJugadores: permitir });
  },

  agregarNotificacion: (mensaje, tipo = "info") => set((state) => {
    const id = generarId('notif');
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
    const nuevo: ElementoPendiente = { id: generarId('p_local'), texto, completado: false };
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
    set({ cargandoDatos: true });
    const ejecutarCarga = async () => {
      logger.info("[TS Storage] Iniciando carga de datos persistidos...");
      const blob = await leerBlobGlobal();

      // Indicamos que estamos cargando datos para que el middleware ignore estos set() intermedios
      set({ cargandoDatos: true });

      if (blob && Object.keys(blob).length > 0) {
        logger.info("[TS Storage] [OK] Blob encontrado. Cargando datos desde TS.localStorage.global...");

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
        const sistemaMagiaBlob  = blob.sistema_magia      as "espacios" | "puntos" | undefined;
        const asociaciones      = blob.asociaciones_fichas as Record<string, string> | undefined;

        if (monstruosHomebrew && monstruosHomebrew.length > 0) {
          set(() => ({
            baseDatosMonstruos: desduplicarEntidades(
              MONSTRUOS_INICIALES,
              monstruosHomebrew.map(sanearMonstruoSentidosYPasiva)
            )
          }));
        }
        if (hechizosHomebrew && hechizosHomebrew.length > 0) {
          set(() => ({
            baseDatosHechizos: desduplicarEntidades(
              HECHIZOS_INICIALES,
              hechizosHomebrew.map(sanearHechizoCD)
            )
          }));
        }
        if (objetosHomebrew && objetosHomebrew.length > 0) {
          set(() => ({
            objetosHomebrew: desduplicarEntidades(
              OBJETOS_INICIALES.map(sanearObjetoHomebrew),
              objetosHomebrew.map(sanearObjetoHomebrew)
            )
          }));
        }
        if (Array.isArray(pendientes) && pendientes.length > 0) {
          const pendientesSaneados = pendientes
            .map(sanearElementoPendiente)
            .filter((p): p is ElementoPendiente => p !== null);
          if (pendientesSaneados.length > 0) {
            set({ listaPendientes: pendientesSaneados });
          }
        }
        if (notes !== undefined && notes !== null) {
          set({ notasDM: notes });
        } else if (notas !== undefined && notas !== null) {
          set({ notasDM: notas });
        }
        if (Array.isArray(encuentros) && encuentros.length > 0) {
          const encuentrosSaneados = encuentros
            .map(sanearEncuentroGuardado)
            .filter((e): e is EncuentroGuardado => e !== null);
          if (encuentrosSaneados.length > 0) {
            set({ encuentrosGuardados: encuentrosSaneados });
          }
        }
        if (Array.isArray(cola) && cola.length > 0) {
          const colaSaneada = cola
            .map(sanearCriaturaIniciativa)
            .filter((c): c is CriaturaIniciativa => c !== null);
          if (colaSaneada.length > 0) {
            set({ colaIniciativa: colaSaneada });
          }
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
        if (sistemaMagiaBlob) {
          set({ sistemaMagia: sistemaMagiaBlob });
        }
        if (asociaciones) {
          set({ asociacionesFichas: asociaciones });
        }

        const personajesRaw = (blob.personajes || []) as unknown[];
        const idPersonajeActivo = blob.id_personaje_activo as string | undefined;
        if (Array.isArray(personajesRaw) && personajesRaw.length > 0) {
          const personajesSaneados = personajesRaw.map(sanearPersonaje).map(hidratarPersonaje);
          set({
            personajes: personajesSaneados,
            idPersonajeActivo: idPersonajeActivo || personajesSaneados[0].id
          });
        }

        const mostrarVida = blob.mostrar_porcentaje_vida as boolean | undefined;
        if (mostrarVida !== undefined && mostrarVida !== null) {
          if (typeof localStorage !== "undefined") {
            try {
              localStorage.setItem("ts_mostrar_porcentaje_vida", String(mostrarVida));
            } catch (e) {
              logger.warn("[TS Storage] No se pudo sincronizar ts_mostrar_porcentaje_vida en localStorage:", e);
            }
          }
          set({ mostrarPorcentajeVidaAJugadores: Boolean(mostrarVida) });
        }

        logger.info("[TS Storage] Carga completa desde blob oficial de TaleSpire.");
        set({ cargandoDatos: false, datosInicialesCargados: true });
        return;
      }

      logger.info("[TS Storage] Primera sesión limpia. Comenzando desde cero.");
      set({ cargandoDatos: false, datosInicialesCargados: true });
    };

    ejecutarCarga().catch((error) => {
      logger.error("[TS Storage] Error crítico al cargar datos:", error);
      set({ cargandoDatos: false, datosInicialesCargados: true });
    });
  },

  importarBaseDatosJSONCompleta: (datosJSON) => {
    const estado = get();
    const result = importarDesdeJSON(datosJSON, {
      baseDatosMonstruos: estado.baseDatosMonstruos,
      baseDatosHechizos: estado.baseDatosHechizos,
      objetosHomebrew: estado.objetosHomebrew
    });

    let modificado = result.modificado;
    const cambiosParciales: Partial<EstadoDM> = {};

    if (result.modificado) {
      cambiosParciales.baseDatosMonstruos = result.baseDatosMonstruos;
      cambiosParciales.baseDatosHechizos = result.baseDatosHechizos;
      cambiosParciales.objetosHomebrew = result.objetosHomebrew;
    }

    if (datosJSON && typeof datosJSON === "object") {
      const datosObj = datosJSON as Record<string, unknown>;

      // 1. Personajes (Ficha individual o Party Backup)
      if (Array.isArray(datosObj.personajes) || datosObj.personaje) {
        const pjsImportados = importarPersonajesDesdeJSON(datosJSON).map(hidratarPersonaje);
        if (pjsImportados.length > 0) {
          const mapaPjs = new Map<string, PersonajeJugador>();
          estado.personajes.forEach((pj) => mapaPjs.set(pj.id, pj));
          if (
            estado.personajes.length === 1 &&
            estado.personajes[0].id === PERSONAJE_POR_DEFECTO.id &&
            estado.personajes[0].nombre === PERSONAJE_POR_DEFECTO.nombre
          ) {
            mapaPjs.clear();
          }
          pjsImportados.forEach((pj) => mapaPjs.set(pj.id, pj));
          const nuevaListaPjs = Array.from(mapaPjs.values());
          cambiosParciales.personajes = nuevaListaPjs;
          cambiosParciales.idPersonajeActivo = nuevaListaPjs[0]?.id || null;
          modificado = true;
        }
      }

      // 2. Notas del DM
      const notas = datosObj.notas ?? datosObj.notasDM ?? datosObj.notes;
      if (typeof notas === "string" && notas.trim()) {
        cambiosParciales.notasDM = notas;
        modificado = true;
      }

      // 3. Tareas Pendientes
      const pendientes = datosObj.pendientes ?? datosObj.listaPendientes;
      if (Array.isArray(pendientes) && pendientes.length > 0) {
        const pendientesSaneados = pendientes
          .map(sanearElementoPendiente)
          .filter((p): p is ElementoPendiente => p !== null);
        if (pendientesSaneados.length > 0) {
          cambiosParciales.listaPendientes = pendientesSaneados;
          modificado = true;
        }
      }

      // 4. Encuentros guardados
      const encuentros = datosObj.encuentros ?? datosObj.encuentrosGuardados;
      if (Array.isArray(encuentros) && encuentros.length > 0) {
        const encuentrosSaneados = encuentros
          .map(sanearEncuentroGuardado)
          .filter((e): e is EncuentroGuardado => e !== null);
        if (encuentrosSaneados.length > 0) {
          cambiosParciales.encuentrosGuardados = encuentrosSaneados;
          modificado = true;
        }
      }

      // 5. Cola de iniciativa
      const cola = datosObj.cola_iniciativa ?? datosObj.colaIniciativa;
      if (Array.isArray(cola) && cola.length > 0) {
        const colaSaneada = cola
          .map(sanearCriaturaIniciativa)
          .filter((c): c is CriaturaIniciativa => c !== null);
        if (colaSaneada.length > 0) {
          cambiosParciales.colaIniciativa = colaSaneada;
          modificado = true;
        }
      }
    }

    if (modificado) {
      set(cambiosParciales);
    }

    return modificado;
  },

  restablecerDatosDeFabrica: () => {
    limpiarBlobGlobal().then(() => {
      logger.info("[TS Storage] Blob oficial limpiado durante restablecimiento de fábrica.");
    }).catch((e) => {
      logger.error("[TS Storage] Error al limpiar el blob oficial:", e);
    });

    set({ cargandoDatos: true });

    set({
      colaIniciativa: [],
      rondaActual: 1,
      indiceTurnoActivo: 0,
      asociacionesFichas: {},
      baseDatosMonstruos: MONSTRUOS_INICIALES,
      baseDatosHechizos: HECHIZOS_INICIALES,
      objetosHomebrew: OBJETOS_INICIALES.map(sanearObjetoHomebrew),
      listaPendientes: [
        { id: "p_1", texto: "Revisar hojas de personaje de los jugadores", completado: false },
        { id: "p_2", texto: "Preparar encuentro en el puente levadizo", completado: false },
        { id: "p_3", texto: "Hacer tiradas de rumores en la taberna", completado: false }
      ],
      notasDM: "Escribe aquí las notas de tu sesión...",
      encuentrosGuardados: [],
      personajes: [PERSONAJE_POR_DEFECTO],
      idPersonajeActivo: PERSONAJE_POR_DEFECTO.id,
      mostrarPorcentajeVidaAJugadores: true,
      cargandoDatos: false
    });

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("ts_mostrar_porcentaje_vida", "true");
      } catch (e) {
        logger.warn("[TS Storage] Error al restablecer ts_mostrar_porcentaje_vida en localStorage:", e);
      }
    }
  }
});

