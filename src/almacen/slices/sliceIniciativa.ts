import { StateCreator } from 'zustand';
import { CriaturaIniciativa, EfectoActivo } from '@/almacen/usarAlmacenDM';
import { formatearVelocidad } from '@/almacen/sanitizacion';
import type { EstadoDM } from '@/almacen/usarAlmacenDM';
import type { Caracteristica } from '@/tipos';
import { ts } from '@/utiles/TaleSpireAdapter';
import type { ColaIniciativaTS } from '@/tipos/talespire';
import {
  normalizarNombreTaleSpire,
  resolverPlantillaPorCriatura,
  calcularVidaInicial,
  esNombreVacioODot
} from '@/servicios/resolutorCriaturas';
import { crearIndiceMonstruos } from '@/servicios/indiceMonstruos';
import {
  sincronizarConEstadoLocal,
  filtrarEfectosExpirados
} from '@/servicios/sincronizacionIniciativa';
import { aplicarCondicion, quitarCondicion } from '@/servicios/procesadorCondiciones';
import { generarId } from '@/utiles/generarId';
import { logger } from '@/utiles/logger';

export interface ResultadoSalvacionCriatura {
  id: string;
  nombre: string;
  bono: number;
  d20: number;
  total: number;
  exito: boolean;
  dañoSufrido?: number;
  condicionAplicada?: boolean;
}

export interface ResultadoSalvacionArea {
  caracteristica: Caracteristica;
  cd: number;
  resultados: ResultadoSalvacionCriatura[];
}

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
  desvincularPlantillaDeCriatura: (idCriatura: string) => void;
  actualizarVidaTemporal: (idCriatura: string, vidaTemp: number) => void;
  establecerIniciativaCriatura: (idCriatura: string, nuevaIniciativa: number) => void;
  limpiarIniciativa: () => void;
  ordenarIniciativa: () => void;
  autoLanzarIniciativaMonstruos: () => void;

  actualizarSeleccionCriaturas: (seleccionadas: CriaturaSeleccionadaTS[]) => void;
  agregarCriaturasSeleccionadasAIniciativa: () => void;
  aplicarDañoEnArea: (cantidad: number, idsObjetivo?: string[]) => void;
  aplicarCondicionEnArea: (condicion: string, idsObjetivo?: string[]) => void;
  aplicarEfectoEnArea: (nombreEfecto: string, duracion: number, opciones?: { concentracion?: boolean }, idsObjetivo?: string[]) => void;
  ejecutarSalvacionEnArea: (
    caracteristica: Caracteristica,
    cd: number,
    dañoBruto?: number,
    condicionOEfecto?: { nombre: string; tipo: "condicion" | "efecto"; duracion?: number; esConcentracion?: boolean },
    mitigacion?: "mitad" | "nada",
    idsObjetivo?: string[]
  ) => ResultadoSalvacionArea | null;
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
        logger.info("[Combat Tracker] Importando cola de iniciativa nativa desde TaleSpire...");
        const queue = await ts.initiative.getQueue();
        get().actualizarColaIniciativaDesdeTaleSpire(queue);
      } catch (error) {
        logger.error("[Combat Tracker] Error al importar iniciativa nativa:", error);
      }
    } else {
      logger.warn("[Combat Tracker] API de iniciativa nativa de TaleSpire no disponible.");
    }
  },

  agregarCriaturaAIniciativa: (nombre, iniciativa, vidaMax, ca, esMonstruo, velocidad, bonifInic, idPlantillaAsociada) => set((state) => {
    const idCriatura = generarId('c_local');
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
      nuevasAsociaciones = {
        ...state.asociacionesFichas,
        [idCriatura]: idPlantillaAsociada
      };
      if (!esNombreVacioODot(nombre)) {
        const { completo: nombreRef, base: nombreRefBase } = normalizarNombreTaleSpire(nombre);
        nuevasAsociaciones[`nombre_base:${nombreRef}`] = idPlantillaAsociada;
        nuevasAsociaciones[`nombre_base:${nombreRefBase}`] = idPlantillaAsociada;
      }
    }

    const nuevaCola = [...state.colaIniciativa, nuevaCriatura];
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    return { 
      colaIniciativa: nuevaCola,
      asociacionesFichas: nuevasAsociaciones
    };
  }),

  establecerIniciativaCriatura: (idCriatura, nuevaIniciativa) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === idCriatura) {
        return { ...c, iniciativa: nuevaIniciativa };
      }
      return c;
    });
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    // Recalcular el índice del turno activo para que apunte a la misma criatura
    const criaturaActivaId = state.colaIniciativa[state.indiceTurnoActivo]?.id;
    const nuevoIndice = criaturaActivaId
      ? nuevaCola.findIndex((c) => c.id === criaturaActivaId)
      : state.indiceTurnoActivo;
    return {
      colaIniciativa: nuevaCola,
      indiceTurnoActivo: nuevoIndice >= 0 ? nuevoIndice : 0
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
        return { ...c, condiciones: aplicarCondicion(c.condiciones, condicion) };
      }
      return c;
    });
    return { colaIniciativa: nuevaCola };
  }),

  quitarCondicionDeCriatura: (id, condicion) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === id) {
        return { ...c, condiciones: quitarCondicion(c.condiciones, condicion) };
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
          id: generarId(nombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)),
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
    const esNombreInvalido = esNombreVacioODot(criaturaReferencia.nombre);

    // 2. Asociar en caliente a cualquier criatura de la cola activa que comparta nombre o nombre base
    const nuevaCola = state.colaIniciativa.map((c) => {
      const { completo: nombreC, base: nombreCBase } = normalizarNombreTaleSpire(c.nombre);

      const coincideNombre = c.id === idCriatura || 
                            (!esNombreInvalido && (nombreC === nombreRef || nombreCBase === nombreRefBase));

      if (coincideNombre) {
        let vidaMaxCalculada = c.vidaMaxima;
        let vidaActualCalculada = c.vidaActual;
        let caCalculada = c.ca;
        let velocidadCalculada = c.velocidad;
        let bonificadorIniciativaCalculado = c.bonificadorIniciativa;

        if (plantilla) {
          const { vidaMaxima, vidaActual } = calcularVidaInicial(plantilla, state.metodoVidaMonstruo);
          vidaMaxCalculada = vidaMaxima;
          vidaActualCalculada = vidaActual;
          caCalculada = plantilla.ca;
          velocidadCalculada = formatearVelocidad(plantilla.velocidad);
          bonificadorIniciativaCalculado = plantilla.iniciativaBonificador;
        }

        return { 
          ...c, 
          idPlantillaAsociada: idPlantilla,
          vidaMaxima: vidaMaxCalculada,
          vidaActual: vidaActualCalculada,
          ca: caCalculada,
          velocidad: velocidadCalculada,
          bonificadorIniciativa: bonificadorIniciativaCalculado
        };
      }
      return c;
    });

    // 3. Registrar en la caché persistente la asociación por UUID y por nombres normalizados
    const nuevasAsociaciones = {
      ...state.asociacionesFichas,
      [idCriatura]: idPlantilla
    };

    if (!esNombreInvalido) {
      nuevasAsociaciones[`nombre_base:${nombreRef}`] = idPlantilla;
      nuevasAsociaciones[`nombre_base:${nombreRefBase}`] = idPlantilla;
    }

    return { 
      colaIniciativa: nuevaCola,
      asociacionesFichas: nuevasAsociaciones
    };
  }),

  desvincularPlantillaDeCriatura: (idCriatura) => set((state) => {
    const criaturaReferencia = state.colaIniciativa.find((c) => c.id === idCriatura);
    if (!criaturaReferencia) return {};

    const { completo: nombreRef, base: nombreRefBase } = normalizarNombreTaleSpire(criaturaReferencia.nombre);

    const nuevasAsociaciones = { ...state.asociacionesFichas };
    delete nuevasAsociaciones[idCriatura];
    
    if (!esNombreVacioODot(criaturaReferencia.nombre)) {
      delete nuevasAsociaciones[`nombre_base:${nombreRef}`];
      delete nuevasAsociaciones[`nombre_base:${nombreRefBase}`];
    }

    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === idCriatura) {
        return { 
          ...c, 
          idPlantillaAsociada: undefined,
          ca: 10,
          velocidad: "30 pies",
          bonificadorIniciativa: 0
        };
      }
      return c;
    });

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
    const indiceMonstruos = crearIndiceMonstruos(state.baseDatosMonstruos);
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.esMonstruo) {
        let bonoInic = c.bonificadorIniciativa || 0;
        if (bonoInic === 0) {
          const plantilla = resolverPlantillaPorCriatura(c.id, c.nombre, state.asociacionesFichas, indiceMonstruos);
          if (plantilla && plantilla.iniciativaBonificador !== undefined) {
            bonoInic = plantilla.iniciativaBonificador;
          }
        }
        const tirada = Math.floor(Math.random() * 20) + 1;
        const total = tirada + bonoInic;
        return { ...c, iniciativa: total, bonificadorIniciativa: bonoInic };
      }
      return c;
    });
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: 0 };
  }),

  ejecutarSalvacionEnArea: (caracteristica, cd, dañoBruto, condicionOEfecto, mitigacion = "mitad", idsObjetivo) => {
    const state = get();
    if (state.colaIniciativa.length === 0 || cd <= 0) return null;

    const targets = obtenerIdsObjetivoMasivo(
      state.colaIniciativa,
      state.indiceTurnoActivo,
      state.criaturasSeleccionadas,
      idsObjetivo
    );
    if (targets.size === 0) return null;

    const indiceMonstruos = crearIndiceMonstruos(state.baseDatosMonstruos);
    const resultadosLog: ResultadoSalvacionCriatura[] = [];
    const colaModificada = state.colaIniciativa.map((c) => {
      if (!targets.has(c.id)) return c;

      const plantilla = resolverPlantillaPorCriatura(c.id, c.nombre, state.asociacionesFichas, indiceMonstruos);
      
      let bonoSalvacion = 0;
      if (plantilla) {
        const salvacionEspecifica = plantilla.salvaciones?.[caracteristica];
        if (salvacionEspecifica !== undefined && !isNaN(salvacionEspecifica)) {
          bonoSalvacion = salvacionEspecifica;
        } else if (plantilla.caracteristicas?.[caracteristica] !== undefined) {
          bonoSalvacion = Math.floor((plantilla.caracteristicas[caracteristica] - 10) / 2);
        }
      }

      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + bonoSalvacion;
      const exito = total >= cd;

      let criaturaActualizada = { ...c };
      let dañoAplicado: number | undefined = undefined;
      let condicionAplicada: boolean | undefined = undefined;

      if (dañoBruto !== undefined && dañoBruto > 0) {
        dañoAplicado = exito ? (mitigacion === "nada" ? 0 : Math.floor(dañoBruto / 2)) : dañoBruto;
        
        let dañoRestante = dañoAplicado;
        let vidaTemp = criaturaActualizada.vidaTemporal || 0;
        let vidaAct = criaturaActualizada.vidaActual;

        if (vidaTemp > 0) {
          if (vidaTemp >= dañoRestante) {
            vidaTemp -= dañoRestante;
            dañoRestante = 0;
          } else {
            dañoRestante -= vidaTemp;
            vidaTemp = 0;
          }
        }

        if (dañoRestante > 0) {
          vidaAct = Math.max(0, vidaAct - dañoRestante);
        }

        criaturaActualizada = { ...criaturaActualizada, vidaTemporal: vidaTemp, vidaActual: vidaAct };
      }

      if (condicionOEfecto && !exito) {
        condicionAplicada = true;
        if (condicionOEfecto.tipo === "condicion") {
          criaturaActualizada.condiciones = aplicarCondicion(
            criaturaActualizada.condiciones,
            condicionOEfecto.nombre
          );
        } else {
          const nuevosEfectos = criaturaActualizada.efectos ? [...criaturaActualizada.efectos] : [];
          const esConcentracion = condicionOEfecto.esConcentracion || 
                                 condicionOEfecto.nombre.toLowerCase().trim() === "concentración" || 
                                 condicionOEfecto.nombre.toLowerCase().trim() === "concentracion";
          const nuevoEfecto: EfectoActivo = {
            id: generarId(condicionOEfecto.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)),
            nombre: condicionOEfecto.nombre,
            expiraRonda: esConcentracion ? undefined : state.rondaActual + (condicionOEfecto.duracion || 10),
            concentracion: esConcentracion || undefined
          };
          criaturaActualizada.efectos = [...nuevosEfectos, nuevoEfecto];
        }
      }

      resultadosLog.push({
        id: c.id,
        nombre: c.nombre,
        bono: bonoSalvacion,
        d20,
        total,
        exito,
        dañoSufrido: dañoAplicado,
        condicionAplicada
      });

      return criaturaActualizada;
    });

    set({ colaIniciativa: colaModificada });

    return {
      caracteristica,
      cd,
      resultados: resultadosLog
    };
  },

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
  }),

  // --- Funciones EnArea (daño, condición, efecto) ---
  // Todas comparten el mismo boilerplate de resolución de objetivos.
  // aplicarTransformacionEnArea encapsula ese boilerplate (Strategy Pattern):
  // cada función sólo define su "estrategia" de transformación por criatura.

  aplicarDañoEnArea: (cantidad, idsObjetivo) => set((state) => {
    if (state.colaIniciativa.length === 0 || cantidad === 0) return {};
    return aplicarTransformacionEnArea(state, idsObjetivo, (c) => {
      if (cantidad > 0) {
        // Daño: Absorbe vida temporal primero
        let dañoRestante = cantidad;
        let vidaTemp = c.vidaTemporal || 0;
        let vidaAct = c.vidaActual;
        if (vidaTemp >= dañoRestante) {
          vidaTemp -= dañoRestante;
          dañoRestante = 0;
        } else {
          dañoRestante -= vidaTemp;
          vidaTemp = 0;
        }
        if (dañoRestante > 0) {
          vidaAct = Math.max(0, vidaAct - dañoRestante);
        }
        return { ...c, vidaTemporal: vidaTemp, vidaActual: vidaAct };
      } else {
        // Curación (cantidad negativa)
        const curacion = Math.abs(cantidad);
        return { ...c, vidaActual: Math.min(c.vidaMaxima, c.vidaActual + curacion) };
      }
    });
  }),

  aplicarCondicionEnArea: (condicion, idsObjetivo) => set((state) => {
    if (state.colaIniciativa.length === 0 || !condicion.trim()) return {};
    const condTrimmed = condicion.trim();
    return aplicarTransformacionEnArea(state, idsObjetivo, (c) => ({
      ...c,
      condiciones: aplicarCondicion(c.condiciones, condTrimmed)
    }));
  }),

  aplicarEfectoEnArea: (nombreEfecto, duracion, opciones, idsObjetivo) => set((state) => {
    if (state.colaIniciativa.length === 0 || !nombreEfecto.trim()) return {};
    const esConcentracion = opciones?.concentracion ||
      nombreEfecto.toLowerCase().trim() === "concentración" ||
      nombreEfecto.toLowerCase().trim() === "concentracion";
    return aplicarTransformacionEnArea(state, idsObjetivo, (c) => {
      const nuevoEfecto: EfectoActivo = {
        id: generarId(nombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)),
        nombre: nombreEfecto,
        expiraRonda: esConcentracion ? undefined : state.rondaActual + duracion,
        concentracion: esConcentracion || undefined
      };
      return { ...c, efectos: [...(c.efectos ?? []), nuevoEfecto] };
    });
  })
});

/**
 * Resuelve el conjunto de IDs objetivo para las operaciones masivas.
 * Prioridad: IDs manuales > criaturas seleccionadas en la cola > criatura con el turno activo.
 */
function obtenerIdsObjetivoMasivo(
  colaIniciativa: CriaturaIniciativa[],
  indiceTurnoActivo: number,
  criaturasSeleccionadas: CriaturaSeleccionadaTS[],
  idsManuales?: string[]
): Set<string> {
  if (idsManuales && idsManuales.length > 0) {
    return new Set(idsManuales);
  }
  const idsSeleccionadosEnCola = (criaturasSeleccionadas || [])
    .map((s) => s.id)
    .filter((id) => colaIniciativa.some((c) => c.id === id));

  if (idsSeleccionadosEnCola.length > 0) {
    return new Set(idsSeleccionadosEnCola);
  }

  const idActiva = colaIniciativa[indiceTurnoActivo]?.id;
  return idActiva ? new Set([idActiva]) : new Set();
}

/**
 * Encapsula el boilerplate compartido por las 3 acciones "EnArea" (Strategy Pattern).
 * Resuelve targets, aplica la transformación pura `transformar` solo a las criaturas objetivo
 * y devuelve el patch de estado para Zustand.
 */
function aplicarTransformacionEnArea(
  state: { colaIniciativa: CriaturaIniciativa[]; indiceTurnoActivo: number; criaturasSeleccionadas: CriaturaSeleccionadaTS[] },
  idsManuales: string[] | undefined,
  transformar: (c: CriaturaIniciativa) => CriaturaIniciativa
): { colaIniciativa: CriaturaIniciativa[] } | Record<string, never> {
  const targets = obtenerIdsObjetivoMasivo(
    state.colaIniciativa,
    state.indiceTurnoActivo,
    state.criaturasSeleccionadas,
    idsManuales
  );
  if (targets.size === 0) return {};
  return {
    colaIniciativa: state.colaIniciativa.map((c) => targets.has(c.id) ? transformar(c) : c)
  };
}
