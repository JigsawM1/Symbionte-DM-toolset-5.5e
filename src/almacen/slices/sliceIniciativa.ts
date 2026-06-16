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
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (!c.efectos || c.efectos.length === 0) return c;
      const efectosActualizados = c.efectos.filter((ef) => {
        if (ef.duracion !== undefined && ef.expiraRonda === undefined) return false;
        if (ef.expiraRonda !== undefined && nuevaRonda >= ef.expiraRonda) return false;
        return true;
      });
      return { ...c, efectos: efectosActualizados };
    });
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
      nuevaCola = state.colaIniciativa.map((c) => {
        if (!c.efectos || c.efectos.length === 0) return c;
        const efectosActualizados = c.efectos.filter((ef) => {
          if (ef.duracion !== undefined && ef.expiraRonda === undefined) return false;
          if (ef.expiraRonda !== undefined && nuevaRonda >= ef.expiraRonda) return false;
          return true;
        });
        return { ...c, efectos: efectosActualizados };
      });
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

    const colaTSItems = colaTS.items || [];
    const criaturasLocales = state.colaIniciativa.filter((c) => c.id.startsWith("c_local_"));
    const indiceMonstruos = crearIndiceMonstruos(state.baseDatosMonstruos);

    const nuevasCriaturasNativas = colaTSItems.map((cTS, index) => {
      const existente = state.colaIniciativa.find((c) => c.id === cTS.id);
      const cTSAny = cTS as any;
      const iniciativaFisica = cTSAny.initiative !== undefined
        ? cTSAny.initiative
        : (existente ? existente.iniciativa : (colaTSItems.length - index));

      const plantillaMonstruo = resolverPlantillaPorCriatura(
        cTS.id,
        cTS.name,
        state.asociacionesFichas,
        indiceMonstruos
      );

      if (existente) {
        return {
          ...existente,
          iniciativa: iniciativaFisica,
          idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
        };
      }

      // Criatura nueva que viene de TaleSpire
      const { vidaMaxima: vidaMaxCalculada, vidaActual: vidaActCalculada } = calcularVidaInicial(
        plantillaMonstruo,
        state.metodoVidaMonstruo,
        cTSAny.maxHp,
        cTSAny.hp
      );

      return {
        id: cTS.id,
        nombre: cTS.name,
        iniciativa: iniciativaFisica,
        vidaMaxima: vidaMaxCalculada,
        vidaActual: vidaActCalculada,
        ca: plantillaMonstruo ? plantillaMonstruo.ca : 10,
        condiciones: [],
        bonificadorIniciativa: plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0,
        esMonstruo: !cTS.id.startsWith("c_jugador"),
        velocidad: plantillaMonstruo ? formatearVelocidad(plantillaMonstruo.velocidad) : "30 pies",
        vidaTemporal: 0,
        idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
      } as CriaturaIniciativa;
    });

    let colaCombinada = [...criaturasLocales, ...nuevasCriaturasNativas];
    colaCombinada.sort((a, b) => b.iniciativa - a.iniciativa);

    let nuevoIndice = state.indiceTurnoActivo;
    let nuevaRonda = state.rondaActual;

    const nativeActiveIndex = colaTS.activeItemIndex;
    console.log("[TaleSpire Sincronismo] Leyendo turno activo nativo:", nativeActiveIndex, "de la cola:", colaTSItems);

    if (typeof nativeActiveIndex === "number") {
      const criaturaActivaTS = colaTSItems[nativeActiveIndex];
      if (criaturaActivaTS) {
        const activeTurnId = criaturaActivaTS.id;
        let indiceEncontrado = colaCombinada.findIndex((c) => c.id === activeTurnId);
        if (indiceEncontrado === -1) {
          indiceEncontrado = colaCombinada.findIndex(
            (c) => c.nombre.toLowerCase().trim() === criaturaActivaTS.name.toLowerCase().trim()
          );
        }

        if (indiceEncontrado !== -1) {
          console.log("[TaleSpire Sincronismo] Encontrado índice de turno activo en la cola combinada local:", indiceEncontrado);
          nuevoIndice = indiceEncontrado;
        }
      }
    }

    if (state.colaIniciativa.length > 1) {
      const ultimoIndice = state.colaIniciativa.length - 1;
      if (state.indiceTurnoActivo === ultimoIndice && nuevoIndice === 0) {
        nuevaRonda = state.rondaActual + 1;
      } else if (state.indiceTurnoActivo === 0 && nuevoIndice === ultimoIndice) {
        nuevaRonda = Math.max(1, state.rondaActual - 1);
      }
    }

    const colaTSAny = colaTS as any;
    if (colaTSAny && colaTSAny.round !== undefined && typeof colaTSAny.round === "number" && colaTSAny.round > 0) {
      nuevaRonda = colaTSAny.round;
    }

    if (nuevaRonda > state.rondaActual) {
      colaCombinada = colaCombinada.map((c) => {
        if (!c.efectos || c.efectos.length === 0) return c;
        const efectosActualizados = c.efectos.filter((ef) => {
          if (ef.duracion !== undefined && ef.expiraRonda === undefined) return false;
          if (ef.expiraRonda !== undefined && nuevaRonda >= ef.expiraRonda) return false;
          return true;
        });
        return { ...c, efectos: efectosActualizados };
      });
    }

    return {
      colaIniciativa: colaCombinada,
      indiceTurnoActivo: nuevoIndice,
      rondaActual: nuevaRonda
    };
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

