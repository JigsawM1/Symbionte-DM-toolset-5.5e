import { StateCreator } from 'zustand';
import { CriaturaIniciativa, EfectoActivo } from '../usarAlmacenDM';
import { formatearVelocidad } from '../sanitizacion';
import type { EstadoDM } from '../usarAlmacenDM';
import { ts } from '../../utiles/TaleSpireAdapter';
import type { ColaIniciativaTS } from '../../tipos/talespire';
import {
  normalizarNombreTaleSpire,
  resolverPlantillaPorCriatura,
  calcularVidaInicial
} from '../../servicios/resolutorCriaturas';
import { crearIndiceMonstruos } from '../../servicios/indiceMonstruos';
import {
  sincronizarConEstadoLocal,
  filtrarEfectosExpirados
} from '../../servicios/sincronizacionIniciativa';

export interface CriaturaSeleccionadaTS {
  id: string;
  name: string;
  maxHp?: number;
  hp?: number;
}

export interface CriaturaNativaTS {
  id: string;
  name: string;
  initiative?: number;
  maxHp?: number;
  hp?: number;
}

export interface SliceIniciativa {
  colaIniciativa: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  rondaActual: number;
  tipoTirada: "desventaja" | "plano" | "ventaja";
  criaturasSeleccionadas: CriaturaSeleccionadaTS[];
  asociacionesFichas: Record<string, string>;

  avanzarRonda: () => void;
  retrocederRonda: () => void;
  avanzarTurno: () => void;
  retrocederTurno: () => void;
  establecerTipoTirada: (tipo: "desventaja" | "plano" | "ventaja") => void;

  actualizarColaIniciativaDesdeTaleSpire: (colaTS: ColaIniciativaTS | null) => void;
  importarIniciativaTaleSpire: () => Promise<void>;
  agregarCriaturaAIniciativa: (
    nombre: string,
    iniciativa: number,
    vidaMax: number,
    ca: number,
    esMonstruo: boolean,
    velocidad: string,
    bonifInic: number,
    idPlantillaAsociada?: string
  ) => void;
  quitarCriaturaDeIniciativa: (id: string) => void;
  modificarVidaCriaturaIniciativa: (id: string, nuevaVida: number) => void;
  agregarCondicionACriatura: (id: string, condicion: string) => void;
  quitarCondicionDeCriatura: (id: string, condicion: string) => void;
  agregarEfectoACriatura: (idCriatura: string, nombreEfecto: string, duracion: number, opciones?: { concentracion?: boolean }) => void;
  quitarEfectoDeCriatura: (idCriatura: string, idEfecto: string) => void;
  asociarPlantillaACriatura: (idCriatura: string, idPlantilla: string) => void;
  actualizarVidaTemporal: (idCriatura: string, vidaTemp: number) => void;
  limpiarIniciativa: () => void;
  ordenarIniciativa: () => void;
  autoLanzarIniciativaMonstruos: () => void;

  actualizarSeleccionCriaturas: (seleccionadas: CriaturaSeleccionadaTS[]) => void;
  agregarCriaturasSeleccionadasAIniciativa: () => void;
}

export const crearSliceIniciativa: StateCreator<
  EstadoDM,
  [],
  [],
  SliceIniciativa
> = (set, get) => ({
  colaIniciativa: [],
  indiceTurnoActivo: 0,
  rondaActual: 1,
  tipoTirada: "plano" as const,
  criaturasSeleccionadas: [],
  asociacionesFichas: {},

  establecerTipoTirada: (tipo) => set({ tipoTirada: tipo }),

  avanzarRonda: () => set((state) => {
    const nuevaRonda = state.rondaActual + 1;
    const nuevaCola = filtrarEfectosExpirados(state.colaIniciativa, nuevaRonda);
    return { rondaActual: nuevaRonda, colaIniciativa: nuevaCola };
  }),
  
  retrocederRonda: () => set((state) => {
    const nuevaRonda = Math.max(1, state.rondaActual - 1);
    return { rondaActual: nuevaRonda };
  }),

  avanzarTurno: () => set((state) => {
    if (state.colaIniciativa.length === 0) return {};
    let nuevoIndice = state.indiceTurnoActivo + 1;
    let nuevaRonda = state.rondaActual;
    if (nuevoIndice >= state.colaIniciativa.length) {
      nuevoIndice = 0;
      nuevaRonda = state.rondaActual + 1;
    }

    let nuevaCola = state.colaIniciativa;
    if (nuevaRonda > state.rondaActual) {
      nuevaCola = filtrarEfectosExpirados(state.colaIniciativa, nuevaRonda);
    }

    return { colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
  }),

  retrocederTurno: () => set((state) => {
    if (state.colaIniciativa.length === 0) return {};
    let nuevoIndice = state.indiceTurnoActivo - 1;
    let nuevaRonda = state.rondaActual;
    if (nuevoIndice < 0) {
      nuevoIndice = state.colaIniciativa.length - 1;
      nuevaRonda = Math.max(1, state.rondaActual - 1);
    }

    return { indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
  }),

  actualizarColaIniciativaDesdeTaleSpire: (colaTS: ColaIniciativaTS | null) => set((state) => {
    if (!colaTS) return {};

    const indiceMonstruos = crearIndiceMonstruos(state.baseDatosMonstruos);
    const resultado = sincronizarConEstadoLocal({
      colaTS,
      colaLocal: state.colaIniciativa,
      asociacionesFichas: state.asociacionesFichas,
      indiceMonstruos,
      metodoVidaMonstruo: state.metodoVidaMonstruo,
      indiceTurnoActivo: state.indiceTurnoActivo,
      rondaActual: state.rondaActual
    });

    return resultado;
  }),

  importarIniciativaTaleSpire: async () => {
    if (ts.estaDisponible) {
      try {
        console.log("[Combat Tracker] Importando cola de iniciativa nativa desde TaleSpire...");
        const queue = await ts.initiative.getQueue();
        get().actualizarColaIniciativaDesdeTaleSpire(queue);
      } catch (error) {
        console.error("[Combat Tracker] Error al importar iniciativa nativa:", error);
      }
    } else {
      console.warn("[Combat Tracker] API de iniciativa nativa de TaleSpire no disponible.");
    }
  },

  agregarCriaturaAIniciativa: (nombre, iniciativa, vidaMax, ca, esMonstruo, velocidad, bonifInic, idPlantillaAsociada) => set((state) => {
    const idCriatura = `c_local_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const nuevaCriatura: CriaturaIniciativa = {
      id: idCriatura,
      nombre,
      iniciativa,
      vidaMaxima: vidaMax,
      vidaActual: vidaMax,
      ca,
      condiciones: [],
      efectos: [],
      bonificadorIniciativa: bonifInic,
      esMonstruo,
      velocidad,
      vidaTemporal: 0,
      idPlantillaAsociada
    };

    let nuevasAsociaciones = state.asociacionesFichas;
    if (idPlantillaAsociada) {
      const { completo: nombreRef, base: nombreRefBase } = normalizarNombreTaleSpire(nombre);
      nuevasAsociaciones = {
        ...state.asociacionesFichas,
        [idCriatura]: idPlantillaAsociada,
        [`nombre_base:${nombreRef}`]: idPlantillaAsociada,
        [`nombre_base:${nombreRefBase}`]: idPlantillaAsociada
      };
    }

    const nuevaCola = [...state.colaIniciativa, nuevaCriatura];
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    return { 
      colaIniciativa: nuevaCola,
      asociacionesFichas: nuevasAsociaciones
    };
  }),

  quitarCriaturaDeIniciativa: (id) => set((state) => {
    const nuevaCola = state.colaIniciativa.filter((c) => c.id !== id);
    let nuevoIndice = state.indiceTurnoActivo;
    if (nuevoIndice >= nuevaCola.length && nuevaCola.length > 0) {
      nuevoIndice = nuevaCola.length - 1;
    }
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice };
  }),

  modificarVidaCriaturaIniciativa: (id, nuevaVida) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === id) {
        return { ...c, vidaActual: Math.max(0, Math.min(c.vidaMaxima, nuevaVida)) };
      }
      return c;
    });
    return { colaIniciativa: nuevaCola };
  }),

  agregarCondicionACriatura: (id, condicion) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === id) {
        if (condicion.toLowerCase().includes("cansado") || condicion.toLowerCase().includes("exhausted")) {
          const condicionCansadoExistente = c.condiciones.find(
            (cond) => cond.toLowerCase().startsWith("cansado")
          );

          if (condicionCansadoExistente) {
            const matches = condicionCansadoExistente.match(/\d+/);
            const nivelActual = matches ? parseInt(matches[0], 10) : 1;
            const nuevoNivel = Math.min(6, nivelActual + 1);
            
            const condicionesFiltradas = c.condiciones.filter(
              (cond) => !cond.toLowerCase().startsWith("cansado")
            );
            return { ...c, condiciones: [...condicionesFiltradas, `Cansado (Niv. ${nuevoNivel})`] };
          } else {
            return { ...c, condiciones: [...c.condiciones, "Cansado (Niv. 1)"] };
          }
        }

        if (!c.condiciones.includes(condicion)) {
          return { ...c, condiciones: [...c.condiciones, condicion] };
        }
      }
      return c;
    });
    return { colaIniciativa: nuevaCola };
  }),

  quitarCondicionDeCriatura: (id, condicion) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === id) {
        return { ...c, condiciones: c.condiciones.filter((cond) => cond !== condicion) };
      }
      return c;
    });
    return { colaIniciativa: nuevaCola };
  }),

  agregarEfectoACriatura: (idCriatura, nombreEfecto, duracion, opciones) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === idCriatura) {
        const nuevosEfectos = c.efectos ? [...c.efectos] : [];
        const esConcentracion = opciones?.concentracion || 
                               nombreEfecto.toLowerCase().trim() === "concentración" || 
                               nombreEfecto.toLowerCase().trim() === "concentracion";
        const nuevoEfecto: EfectoActivo = {
          id: `${nombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          nombre: nombreEfecto,
          expiraRonda: esConcentracion ? undefined : state.rondaActual + duracion,
          concentracion: esConcentracion || undefined
        };
        return { ...c, efectos: [...nuevosEfectos, nuevoEfecto] };
      }
      return c;
    });
    return { colaIniciativa: nuevaCola };
  }),

  quitarEfectoDeCriatura: (idCriatura, idEfecto) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === idCriatura) {
        const nuevosEfectos = c.efectos ? c.efectos.filter((e) => e.id !== idEfecto) : [];
        return { ...c, efectos: nuevosEfectos };
      }
      return c;
    });
    return { colaIniciativa: nuevaCola };
  }),

  asociarPlantillaACriatura: (idCriatura, idPlantilla) => set((state) => {
    const plantilla = state.baseDatosMonstruos.find((m) => m.id === idPlantilla);
    
    // 1. Encontrar la criatura de referencia para obtener su nombre
    const criaturaReferencia = state.colaIniciativa.find((c) => c.id === idCriatura);
    if (!criaturaReferencia) return {};

    const { completo: nombreRef, base: nombreRefBase } = normalizarNombreTaleSpire(criaturaReferencia.nombre);

    // 2. Asociar en caliente a cualquier criatura de la cola activa que comparta nombre o nombre base
    const nuevaCola = state.colaIniciativa.map((c) => {
      const { completo: nombreC, base: nombreCBase } = normalizarNombreTaleSpire(c.nombre);

      const coincideNombre = c.id === idCriatura || 
                            nombreC === nombreRef || 
                            nombreCBase === nombreRefBase;

      if (coincideNombre) {
        let vidaMaxCalculada = c.vidaMaxima;
        let vidaActualCalculada = c.vidaActual;

        if (plantilla) {
          const { vidaMaxima, vidaActual } = calcularVidaInicial(plantilla, state.metodoVidaMonstruo);
          vidaMaxCalculada = vidaMaxima;
          vidaActualCalculada = vidaActual;
        }

        return { 
          ...c, 
          idPlantillaAsociada: idPlantilla,
          vidaMaxima: vidaMaxCalculada,
          vidaActual: vidaActualCalculada
        };
      }
      return c;
    });

    // 3. Registrar en la caché persistente la asociación por UUID y por nombres normalizados
    const nuevasAsociaciones = {
      ...state.asociacionesFichas,
      [idCriatura]: idPlantilla,
      [`nombre_base:${nombreRef}`]: idPlantilla,
      [`nombre_base:${nombreRefBase}`]: idPlantilla
    };

    return { 
      colaIniciativa: nuevaCola,
      asociacionesFichas: nuevasAsociaciones
    };
  }),

  actualizarVidaTemporal: (idCriatura, vidaTemp) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === idCriatura) {
        return { ...c, vidaTemporal: Math.max(0, vidaTemp) };
      }
      return c;
    });
    return { colaIniciativa: nuevaCola };
  }),

  limpiarIniciativa: () => {
    set({ colaIniciativa: [], indiceTurnoActivo: 0, rondaActual: 1 });
  },

  ordenarIniciativa: () => set((state) => {
    const nuevaCola = [...state.colaIniciativa];
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: 0 };
  }),

  autoLanzarIniciativaMonstruos: () => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.esMonstruo) {
        const tirada = Math.floor(Math.random() * 20) + 1;
        const total = tirada + c.bonificadorIniciativa;
        return { ...c, iniciativa: total };
      }
      return c;
    });
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: 0 };
  }),

  actualizarSeleccionCriaturas: (seleccionadas) => set({ criaturasSeleccionadas: seleccionadas }),

  agregarCriaturasSeleccionadasAIniciativa: () => set((state) => {
    if (!state.criaturasSeleccionadas || state.criaturasSeleccionadas.length === 0) return {};

    const nuevasCriaturas: CriaturaIniciativa[] = [];
    const indiceMonstruos = crearIndiceMonstruos(state.baseDatosMonstruos);

    state.criaturasSeleccionadas.forEach((cTS) => {
      if (state.colaIniciativa.some((c) => c.id === cTS.id)) return;

      const plantillaMonstruo = resolverPlantillaPorCriatura(
        cTS.id,
        cTS.name,
        state.asociacionesFichas,
        indiceMonstruos
      );

      const { vidaMaxima: vidaMaxCalculada, vidaActual: vidaActCalculada } = calcularVidaInicial(
        plantillaMonstruo,
        state.metodoVidaMonstruo,
        cTS.maxHp,
        cTS.hp
      );

      const tiradaInic = Math.floor(Math.random() * 20) + 1;
      const totalInic = tiradaInic + (plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0);

      nuevasCriaturas.push({
        id: cTS.id,
        nombre: cTS.name,
        iniciativa: totalInic,
        vidaMaxima: vidaMaxCalculada,
        vidaActual: vidaActCalculada,
        ca: plantillaMonstruo ? plantillaMonstruo.ca : 10,
        condiciones: [],
        bonificadorIniciativa: plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0,
        esMonstruo: !cTS.id.startsWith("c_jugador"),
        velocidad: plantillaMonstruo ? formatearVelocidad(plantillaMonstruo.velocidad) : "30 pies",
        vidaTemporal: 0,
        idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
      });
    });

    if (nuevasCriaturas.length === 0) return {};

    const colaCombinada = [...state.colaIniciativa, ...nuevasCriaturas];
    colaCombinada.sort((a, b) => b.iniciativa - a.iniciativa);
    return { colaIniciativa: colaCombinada };
  })
});

