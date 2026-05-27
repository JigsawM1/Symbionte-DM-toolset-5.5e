import { CriaturaIniciativa } from '../usarAlmacenDM'; // Importar tipos e interfaces desde el orquestador
import { calcularVidaPorDados } from '../sanitizacion';
import { persistirEstadoCompleto } from '../persistencia';

export interface SliceIniciativa {
  colaIniciativa: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  rondaActual: number;
  tipoTirada: "desventaja" | "plano" | "ventaja";
  criaturasSeleccionadas: any[];

  avanzarRonda: () => void;
  retrocederRonda: () => void;
  avanzarTurno: () => void;
  retrocederTurno: () => void;
  establecerTipoTirada: (tipo: "desventaja" | "plano" | "ventaja") => void;

  actualizarColaIniciativaDesdeTaleSpire: (colaTS: any) => void;
  importarIniciativaTaleSpire: () => Promise<void>;
  agregarCriaturaAIniciativa: (
    nombre: string,
    iniciativa: number,
    vidaMax: number,
    ca: number,
    esMonstruo: boolean,
    velocidad: string,
    bonifInic: number
  ) => void;
  quitarCriaturaDeIniciativa: (id: string) => void;
  modificarVidaCriaturaIniciativa: (id: string, nuevaVida: number) => void;
  agregarCondicionACriatura: (id: string, condicion: string) => void;
  quitarCondicionDeCriatura: (id: string, condicion: string) => void;
  agregarEfectoACriatura: (idCriatura: string, nombreEfecto: string, duracion: number) => void;
  quitarEfectoDeCriatura: (idCriatura: string, idEfecto: string) => void;
  asociarPlantillaACriatura: (idCriatura: string, idPlantilla: string) => void;
  actualizarVidaTemporal: (idCriatura: string, vidaTemp: number) => void;
  limpiarIniciativa: () => void;
  ordenarIniciativa: () => void;

  actualizarSeleccionCriaturas: (seleccionadas: any[]) => void;
  agregarCriaturasSeleccionadasAIniciativa: () => void;
}

export const crearSliceIniciativa = (set: any, get: any) => ({
  colaIniciativa: [],
  indiceTurnoActivo: 0,
  rondaActual: 1,
  tipoTirada: "plano" as const,
  criaturasSeleccionadas: [],

  establecerTipoTirada: (tipo: "desventaja" | "plano" | "ventaja") => set({ tipoTirada: tipo }),

  avanzarRonda: () => set((state: any) => {
    const nuevaRonda = state.rondaActual + 1;
    const nuevoEstado = { ...state, rondaActual: nuevaRonda };
    persistirEstadoCompleto(nuevoEstado);
    return { rondaActual: nuevaRonda };
  }),
  
  retrocederRonda: () => set((state: any) => {
    const nuevaRonda = Math.max(1, state.rondaActual - 1);
    const nuevoEstado = { ...state, rondaActual: nuevaRonda };
    persistirEstadoCompleto(nuevoEstado);
    return { rondaActual: nuevaRonda };
  }),

  avanzarTurno: () => set((state: any) => {
    if (state.colaIniciativa.length === 0) return {};
    let nuevoIndice = state.indiceTurnoActivo + 1;
    let nuevaRonda = state.rondaActual;
    if (nuevoIndice >= state.colaIniciativa.length) {
      nuevoIndice = 0;
      nuevaRonda = state.rondaActual + 1;
    }

    // Decrementar duración de los efectos activos para la criatura que recibe el turno activo
    const nuevaCola = state.colaIniciativa.map((c: any, idx: number) => {
      if (idx === nuevoIndice && c.efectos && c.efectos.length > 0) {
        const efectosActualizados = c.efectos
          .map((ef: any) => ({ ...ef, duracion: ef.duracion - 1 }))
          .filter((ef: any) => ef.duracion > 0);
        return { ...c, efectos: efectosActualizados };
      }
      return c;
    });

    // Invocar asíncronamente a la API nativa de TaleSpire para avanzar el turno físico
    const ts = (window as any).TS;
    if (ts && ts.initiative && typeof ts.initiative.nextTurn === "function") {
      ts.initiative.nextTurn().catch((e: any) => {
        console.error("[Combat Tracker] Error al avanzar turno nativo en TaleSpire:", e);
      });
    }

    const nuevoEstado = { ...state, colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
    persistirEstadoCompleto(nuevoEstado);
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
  }),

  retrocederTurno: () => set((state: any) => {
    if (state.colaIniciativa.length === 0) return {};
    let nuevoIndice = state.indiceTurnoActivo - 1;
    let nuevaRonda = state.rondaActual;
    if (nuevoIndice < 0) {
      nuevoIndice = state.colaIniciativa.length - 1;
      nuevaRonda = Math.max(1, state.rondaActual - 1);
    }

    // Invocar asíncronamente a la API nativa de TaleSpire para retroceder el turno físico
    const ts = (window as any).TS;
    if (ts && ts.initiative && typeof ts.initiative.prevTurn === "function") {
      ts.initiative.prevTurn().catch((e: any) => {
        console.error("[Combat Tracker] Error al retroceder turno nativo en TaleSpire:", e);
      });
    }

    const nuevoEstado = { ...state, indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
    persistirEstadoCompleto(nuevoEstado);
    return { indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
  }),

  actualizarColaIniciativaDesdeTaleSpire: (colaTS: any) => set((state: any) => {
    const normalizarColaTaleSpire = (datosCola: any): any[] => {
      if (!datosCola) return [];
      if (Array.isArray(datosCola)) return datosCola;
      
      console.log("[TaleSpire Simbionte] Normalizando cola recibida:", typeof datosCola, datosCola);
      
      const llavesCandidatas = ["queue", "entries", "items", "data", "list"];
      for (const llave of llavesCandidatas) {
        if (Array.isArray(datosCola[llave])) {
          return datosCola[llave];
        }
      }
      
      if (typeof datosCola[Symbol.iterator] === "function") {
        try {
          return Array.from(datosCola);
        } catch (e) {
          console.error("[TaleSpire Simbionte] Error al iterar cola:", e);
        }
      }
      
      for (const llave in datosCola) {
        if (Object.prototype.hasOwnProperty.call(datosCola, llave) && Array.isArray(datosCola[llave])) {
          return datosCola[llave];
        }
      }
      
      return [];
    };

    const colaFiltradaTS = normalizarColaTaleSpire(colaTS);
    const criaturasLocales = state.colaIniciativa.filter((c: any) => c.id.startsWith("c_local_"));

    const nuevasCriaturasNativas = colaFiltradaTS.map((cTS) => {
      const existente = state.colaIniciativa.find((c: any) => c.id === cTS.id);
      const nombreTS = cTS.name.toLowerCase().trim();
      const nombreTSBase = nombreTS
        .replace(/\s+\d+$/g, "")
        .replace(/\s+#[a-zA-Z0-9]+$/g, "")
        .replace(/\s+[a-zA-Z]$/g, "")
        .trim();

      const plantillaMonstruo = state.baseDatosMonstruos.find((m: any) => {
        const nombrePlantilla = m.nombre.toLowerCase().trim();
        return (
          nombreTS === nombrePlantilla ||
          nombreTSBase === nombrePlantilla ||
          nombreTS.startsWith(nombrePlantilla) ||
          nombreTSBase.startsWith(nombrePlantilla)
        );
      });

      if (existente) {
        const iniciativaFisica = cTS.initiative !== undefined ? cTS.initiative : existente.iniciativa;
        return {
          ...existente,
          iniciativa: iniciativaFisica,
          idPlantillaAsociada: existente.idPlantillaAsociada || (plantillaMonstruo ? plantillaMonstruo.id : undefined)
        };
      }

      let vidaMaxCalculada = 10;
      let vidaActCalculada = 10;

      if (plantillaMonstruo && state.metodoVidaMonstruo !== "estandar") {
        vidaMaxCalculada = calcularVidaPorDados(
          plantillaMonstruo.vidaNotas || "",
          plantillaMonstruo.vidaMaxima,
          state.metodoVidaMonstruo
        );
        vidaActCalculada = vidaMaxCalculada;
      } else if (cTS.maxHp !== undefined && cTS.maxHp > 0) {
        vidaMaxCalculada = cTS.maxHp;
        vidaActCalculada = cTS.hp !== undefined ? cTS.hp : cTS.maxHp;
      } else if (plantillaMonstruo) {
        vidaMaxCalculada = plantillaMonstruo.vidaMaxima;
        vidaActCalculada = vidaMaxCalculada;
      }

      return {
        id: cTS.id,
        nombre: cTS.name,
        iniciativa: cTS.initiative !== undefined ? cTS.initiative : 1,
        vidaMaxima: vidaMaxCalculada,
        vidaActual: vidaActCalculada,
        ca: plantillaMonstruo ? plantillaMonstruo.ca : 10,
        condiciones: [],
        bonificadorIniciativa: plantillaMonstruo ? plantillaMonstruo.iniciativaBonificador : 0,
        esMonstruo: !cTS.id.startsWith("c_jugador"),
        velocidad: plantillaMonstruo ? plantillaMonstruo.velocidad : "30 pies",
        vidaTemporal: 0,
        idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
      };
    });

    const colaCombinada = [...criaturasLocales, ...nuevasCriaturasNativas];
    colaCombinada.sort((a, b) => b.iniciativa - a.iniciativa);

    let nuevoIndice = state.indiceTurnoActivo;
    let nuevaRonda = state.rondaActual;

    if (colaTS && typeof colaTS === "object" && !Array.isArray(colaTS)) {
      let activeTurnId: string | null = null;
      const indiceActivoNativo = colaTS.activeItemIndex !== undefined ? colaTS.activeItemIndex : colaTS.activeTurn;

      console.log("[TaleSpire Sincronismo] Leyendo turno activo nativo:", indiceActivoNativo, "de la cola:", colaFiltradaTS);

      if (typeof indiceActivoNativo === "number") {
        const criaturaActivaTS = colaFiltradaTS[indiceActivoNativo];
        if (criaturaActivaTS) {
          activeTurnId = criaturaActivaTS.id;
        }
      } else if (typeof indiceActivoNativo === "string") {
        const esIndiceNumerico = /^\d+$/.test(indiceActivoNativo);
        if (esIndiceNumerico) {
          const idx = parseInt(indiceActivoNativo, 10);
          const criaturaActivaTS = colaFiltradaTS[idx];
          if (criaturaActivaTS) {
            activeTurnId = criaturaActivaTS.id;
          }
        } else {
          activeTurnId = indiceActivoNativo;
        }
      }

      if (activeTurnId) {
        let indiceEncontrado = colaCombinada.findIndex((c) => c.id === activeTurnId);
        if (indiceEncontrado === -1) {
          const criaturaActivaTS = colaFiltradaTS.find((c) => c.id === activeTurnId);
          if (criaturaActivaTS) {
            indiceEncontrado = colaCombinada.findIndex(
              (c) => c.nombre.toLowerCase().trim() === criaturaActivaTS.name.toLowerCase().trim()
            );
          }
        }

        if (indiceEncontrado !== -1) {
          console.log("[TaleSpire Sincronismo] Encontrado índice de turno activo en la cola combinada local:", indiceEncontrado);
          nuevoIndice = indiceEncontrado;
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

      if (colaTS.round !== undefined && typeof colaTS.round === "number" && colaTS.round > 0) {
        nuevaRonda = colaTS.round;
      }
    }

    const nuevoEstado = {
      ...state,
      colaIniciativa: colaCombinada,
      indiceTurnoActivo: nuevoIndice,
      rondaActual: nuevaRonda
    };
    persistirEstadoCompleto(nuevoEstado);

    return {
      colaIniciativa: colaCombinada,
      indiceTurnoActivo: nuevoIndice,
      rondaActual: nuevaRonda
    };
  }),

  importarIniciativaTaleSpire: async () => {
    const ts = (window as any).TS;
    if (ts && ts.initiative && typeof ts.initiative.getQueue === "function") {
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

  agregarCriaturaAIniciativa: (nombre: string, iniciativa: number, vidaMax: number, ca: number, esMonstruo: boolean, velocidad: string, bonifInic: number) => set((state: any) => {
    const nuevaCriatura: CriaturaIniciativa = {
      id: `c_local_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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
      vidaTemporal: 0
    };
    const nuevaCola = [...state.colaIniciativa, nuevaCriatura];
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola });
    return { colaIniciativa: nuevaCola };
  }),

  quitarCriaturaDeIniciativa: (id: string) => set((state: any) => {
    const nuevaCola = state.colaIniciativa.filter((c: any) => c.id !== id);
    let nuevoIndice = state.indiceTurnoActivo;
    if (nuevoIndice >= nuevaCola.length && nuevaCola.length > 0) {
      nuevoIndice = nuevaCola.length - 1;
    }
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice });
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice };
  }),

  modificarVidaCriaturaIniciativa: (id: string, nuevaVida: number) => set((state: any) => {
    const nuevaCola = state.colaIniciativa.map((c: any) => {
      if (c.id === id) {
        return { ...c, vidaActual: Math.max(0, Math.min(c.vidaMaxima, nuevaVida)) };
      }
      return c;
    });
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola });
    return { colaIniciativa: nuevaCola };
  }),

  agregarCondicionACriatura: (id: string, condicion: string) => set((state: any) => {
    const nuevaCola = state.colaIniciativa.map((c: any) => {
      if (c.id === id) {
        if (condicion.toLowerCase().includes("cansado") || condicion.toLowerCase().includes("exhausted")) {
          const condicionCansadoExistente = c.condiciones.find(
            (cond: string) => cond.toLowerCase().startsWith("cansado")
          );

          if (condicionCansadoExistente) {
            const matches = condicionCansadoExistente.match(/\d+/);
            const nivelActual = matches ? parseInt(matches[0], 10) : 1;
            const nuevoNivel = Math.min(6, nivelActual + 1);
            
            const condicionesFiltradas = c.condiciones.filter(
              (cond: string) => !cond.toLowerCase().startsWith("cansado")
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
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola });
    return { colaIniciativa: nuevaCola };
  }),

  quitarCondicionDeCriatura: (id: string, condicion: string) => set((state: any) => {
    const nuevaCola = state.colaIniciativa.map((c: any) => {
      if (c.id === id) {
        return { ...c, condiciones: c.condiciones.filter((cond: string) => cond !== condicion) };
      }
      return c;
    });
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola });
    return { colaIniciativa: nuevaCola };
  }),

  agregarEfectoACriatura: (idCriatura: string, nombreEfecto: string, duracion: number) => set((state: any) => {
    const nuevaCola = state.colaIniciativa.map((c: any) => {
      if (c.id === idCriatura) {
        const nuevosEfectos = c.efectos ? [...c.efectos] : [];
        const nuevoEfecto = {
          id: `${nombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          nombre: nombreEfecto,
          duracion: duracion
        };
        return { ...c, efectos: [...nuevosEfectos, nuevoEfecto] };
      }
      return c;
    });
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola });
    return { colaIniciativa: nuevaCola };
  }),

  quitarEfectoDeCriatura: (idCriatura: string, idEfecto: string) => set((state: any) => {
    const nuevaCola = state.colaIniciativa.map((c: any) => {
      if (c.id === idCriatura) {
        const nuevosEfectos = c.efectos ? c.efectos.filter((e: any) => e.id !== idEfecto) : [];
        return { ...c, efectos: nuevosEfectos };
      }
      return c;
    });
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola });
    return { colaIniciativa: nuevaCola };
  }),

  asociarPlantillaACriatura: (idCriatura: string, idPlantilla: string) => set((state: any) => {
    const plantilla = state.baseDatosMonstruos.find((m: any) => m.id === idPlantilla);
    const nuevaCola = state.colaIniciativa.map((c: any) => {
      if (c.id === idCriatura) {
        let vidaMaxCalculada = c.vidaMaxima;
        let vidaActualCalculada = c.vidaActual;

        if (plantilla) {
          vidaMaxCalculada = calcularVidaPorDados(
            plantilla.vidaNotas || "",
            plantilla.vidaMaxima,
            state.metodoVidaMonstruo
          );
          vidaActualCalculada = vidaMaxCalculada;
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
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola });
    return { colaIniciativa: nuevaCola };
  }),

  actualizarVidaTemporal: (idCriatura: string, vidaTemp: number) => set((state: any) => {
    const nuevaCola = state.colaIniciativa.map((c: any) => {
      if (c.id === idCriatura) {
        return { ...c, vidaTemporal: Math.max(0, vidaTemp) };
      }
      return c;
    });
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola });
    return { colaIniciativa: nuevaCola };
  }),

  limpiarIniciativa: () => {
    const s = get();
    persistirEstadoCompleto({ ...s, colaIniciativa: [], indiceTurnoActivo: 0, rondaActual: 1 });
    set({ colaIniciativa: [], indiceTurnoActivo: 0, rondaActual: 1 });
  },

  ordenarIniciativa: () => set((state: any) => {
    const nuevaCola = [...state.colaIniciativa];
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    persistirEstadoCompleto({ ...state, colaIniciativa: nuevaCola, indiceTurnoActivo: 0 });
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: 0 };
  }),

  actualizarSeleccionCriaturas: (seleccionadas: any[]) => set({ criaturasSeleccionadas: seleccionadas }),

  agregarCriaturasSeleccionadasAIniciativa: () => set((state: any) => {
    if (!state.criaturasSeleccionadas || state.criaturasSeleccionadas.length === 0) return {};

    const nuevasCriaturas: CriaturaIniciativa[] = [];

    state.criaturasSeleccionadas.forEach((cTS: any) => {
      if (state.colaIniciativa.some((c: any) => c.id === cTS.id)) return;

      const nombreTS = cTS.name.toLowerCase().trim();
      const nombreTSBase = nombreTS
        .replace(/\s+\d+$/g, "")
        .replace(/\s+#[a-zA-Z0-9]+$/g, "")
        .replace(/\s+[a-zA-Z]$/g, "")
        .trim();

      const plantillaMonstruo = state.baseDatosMonstruos.find((m: any) => {
        const nombrePlantilla = m.nombre.toLowerCase().trim();
        return (
          nombreTS === nombrePlantilla ||
          nombreTSBase === nombrePlantilla ||
          nombreTS.startsWith(nombrePlantilla) ||
          nombreTSBase.startsWith(nombrePlantilla)
        );
      });

      let vidaMaxCalculada = 10;
      let vidaActCalculada = 10;

      if (cTS.maxHp !== undefined && cTS.maxHp > 0) {
        vidaMaxCalculada = cTS.maxHp;
        vidaActCalculada = cTS.hp !== undefined ? cTS.hp : cTS.maxHp;
      } else if (plantillaMonstruo) {
        vidaMaxCalculada = calcularVidaPorDados(plantillaMonstruo.vidaNotas || "", plantillaMonstruo.vidaMaxima, state.metodoVidaMonstruo);
        vidaActCalculada = vidaMaxCalculada;
      }

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
        velocidad: plantillaMonstruo ? plantillaMonstruo.velocidad : "30 pies",
        vidaTemporal: 0,
        idPlantillaAsociada: plantillaMonstruo ? plantillaMonstruo.id : undefined
      });
    });

    if (nuevasCriaturas.length === 0) return {};

    const colaCombinada = [...state.colaIniciativa, ...nuevasCriaturas];
    colaCombinada.sort((a, b) => b.iniciativa - a.iniciativa);
    persistirEstadoCompleto({ ...state, colaIniciativa: colaCombinada });
    return { colaIniciativa: colaCombinada };
  })
});
