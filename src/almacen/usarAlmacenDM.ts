import { create } from "zustand";
import {
  MONSTRUOS_INICIALES,
  HECHIZOS_INICIALES,
  MonstruoBase,
  HechizoBase
} from "../utiles/datosIniciales";
import {
  guardarDatoFragmentado,
  obtenerDatoFragmentado,
  eliminarDatoFragmentado
} from "../utiles/almacenamientoFragmentos";

// Función auxiliar robusta para aplanar de forma segura cualquier estructura a string (previene error #31 de React)
export function aplanarValor(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map(aplanarValor).filter(Boolean).join("\n");
    }
    if (val.nombre !== undefined) return aplanarValor(val.nombre);
    if (val.name !== undefined) return aplanarValor(val.name);
    if (val.index !== undefined) return aplanarValor(val.index);
    const keys = Object.keys(val);
    if (keys.length > 0) {
      for (const k of keys) {
        if (typeof val[k] === "string") return val[k].trim();
      }
      return aplanarValor(val[keys[0]]);
    }
  }
  return "";
}

// Tipos fuertemente tipados en español
export interface CriaturaIniciativa {
  id: string; // ID único (de TaleSpire o local)
  nombre: string;
  iniciativa: number;
  vidaMaxima: number;
  vidaActual: number;
  ca: number;
  condiciones: string[];
  bonificadorIniciativa: number;
  esMonstruo: boolean;
  velocidad: string;
  vidaTemporal?: number;
  idPlantillaAsociada?: string;
}

export interface ObjetoHomebrew {
  id: string;
  nombre: string;
  rareza: string;
  propiedades: string;
  descripcion: string;
  
  // Nuevos campos estructurados
  categoria?: string;
  costoValor?: number;
  costoUnidad?: string; // PC, PP, PE, PO, PPT
  peso?: string;
  tipoArma?: string;
  estiloAtaque?: string;
  alcance?: string;
  propiedadesArma?: string[]; // Sutil, Versátil, etc.
  dadosDaño?: string;
  tipoDaño?: string;
  bonoAtaque?: string;
  bonoDaño?: string;
  bonosMagicos?: { categoria: string; bono: string; valor: number }[];
}

export function sanearObjetoHomebrew(o: any): ObjetoHomebrew {
  if (!o) {
    return { id: "", nombre: "Objeto Desconocido", rareza: "Común", propiedades: "Ninguna", descripcion: "Sin descripción." };
  }
  
  // Saneamiento de propiedades complejas opcionales para evitar React error #31
  let bonosMagicosSaneados: any[] | undefined = undefined;
  if (Array.isArray(o.bonosMagicos)) {
    bonosMagicosSaneados = o.bonosMagicos.map((b: any) => ({
      categoria: aplanarValor(b.categoria || b.category || "OTRO"),
      bono: aplanarValor(b.bono || b.bonus || ""),
      valor: Number(b.valor || b.value) || 0
    }));
  }

  let propiedadesArmaSaneadas: string[] | undefined = undefined;
  if (Array.isArray(o.propiedadesArma)) {
    propiedadesArmaSaneadas = o.propiedadesArma.map(aplanarValor);
  }

  return {
    id: aplanarValor(o.id || o.index || `o_${Date.now()}_${Math.random()}`).trim(),
    nombre: aplanarValor(o.nombre || o.name || "Objeto Desconocido"),
    rareza: aplanarValor(o.rareza || o.rarity || "Común"),
    propiedades: aplanarValor(o.propiedades || "Ninguna"),
    descripcion: aplanarValor(o.descripcion || o.desc || o.description || "Sin descripción disponible."),
    
    categoria: o.categoria ? aplanarValor(o.categoria) : undefined,
    costoValor: o.costoValor !== undefined ? (Number(o.costoValor) || 0) : undefined,
    costoUnidad: o.costoUnidad ? aplanarValor(o.costoUnidad) : undefined,
    peso: o.peso ? aplanarValor(o.peso) : undefined,
    tipoArma: o.tipoArma ? aplanarValor(o.tipoArma) : undefined,
    estiloAtaque: o.estiloAtaque ? aplanarValor(o.estiloAtaque) : undefined,
    alcance: o.alcance ? aplanarValor(o.alcance) : undefined,
    propiedadesArma: propiedadesArmaSaneadas,
    dadosDaño: o.dadosDaño ? aplanarValor(o.dadosDaño) : undefined,
    tipoDaño: o.tipoDaño ? aplanarValor(o.tipoDaño) : undefined,
    bonoAtaque: o.bonoAtaque ? aplanarValor(o.bonoAtaque) : undefined,
    bonoDaño: o.bonoDaño ? aplanarValor(o.bonoDaño) : undefined,
    bonosMagicos: bonosMagicosSaneados
  };
}

export function calcularVidaPorDados(
  formula: string,
  promedioEstandar: number,
  metodo: "estandar" | "maximo" | "azar"
): number {
  if (metodo === "estandar" || !formula) {
    return promedioEstandar;
  }

  // Sanitizar fórmula (quitar espacios y minúsculas)
  const saneada = formula.replace(/\s+/g, "").toLowerCase();

  // Expresión regular para parsear: opcionalmente número de dados 'x', 'd', número de caras 'y', y modificador opcional '+z' o '-z'
  // Por ejemplo: 2d8+6, 2d6, 17d10+85, 1d12-1
  const match = saneada.match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) {
    return promedioEstandar;
  }

  const cantidadDados = parseInt(match[1], 10);
  const carasDado = parseInt(match[2], 10);
  const modificador = match[3] ? parseInt(match[3], 10) : 0;

  if (isNaN(cantidadDados) || isNaN(carasDado)) {
    return promedioEstandar;
  }

  if (metodo === "maximo") {
    return (cantidadDados * carasDado) + modificador;
  }

  if (metodo === "azar") {
    let total = 0;
    for (let i = 0; i < cantidadDados; i++) {
      total += Math.floor(Math.random() * carasDado) + 1;
    }
    total += modificador;
    // La vida mínima debería ser al menos 1
    return Math.max(1, total);
  }

  return promedioEstandar;
}

export interface ElementoPendiente {
  id: string;
  texto: string;
  completado: boolean;
}

export interface EncuentroGuardado {
  nombre: string;
  ronda: number;
  cola: CriaturaIniciativa[];
  fecha: string;
}

export interface EstadoDM {
  pestañaActiva: string;
  modoHomebrew: "crear" | "lista";
  rondaActual: number;
  colaIniciativa: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  criaturasSeleccionadas: any[];
  tipoTirada: "desventaja" | "plano" | "ventaja";
  metodoVidaMonstruo: "estandar" | "maximo" | "azar";
  cargando: boolean;
  campañaNombre: string;
  esGM: boolean;

  // Bases de datos y Homebrew
  baseDatosMonstruos: MonstruoBase[];
  baseDatosHechizos: HechizoBase[];
  objetosHomebrew: ObjetoHomebrew[];
  listaPendientes: ElementoPendiente[];
  notasDM: string;
  encuentrosGuardados: EncuentroGuardado[];

  // Acciones (Acciones en español)
  establecerPestaña: (pestaña: string) => void;
  establecerModoHomebrew: (modo: "crear" | "lista") => void;
  avanzarRonda: () => void;
  retrocederRonda: () => void;
  avanzarTurno: () => void;
  retrocederTurno: () => void;
  establecerTipoTirada: (tipo: "desventaja" | "plano" | "ventaja") => void;
  establecerMetodoVidaMonstruo: (metodo: "estandar" | "maximo" | "azar") => void;

  // Iniciativa Híbrida
  actualizarColaIniciativaDesdeTaleSpire: (colaTS: any[]) => void;
  agregarCriaturaAIniciativa: (nombre: string, iniciativa: number, vidaMax: number, ca: number, esMonstruo: boolean, velocidad: string, bonifInic: number) => void;
  quitarCriaturaDeIniciativa: (id: string) => void;
  modificarVidaCriaturaIniciativa: (id: string, nuevaVida: number) => void;
  agregarCondicionACriatura: (id: string, condicion: string) => void;
  quitarCondicionDeCriatura: (id: string, condicion: string) => void;
  asociarPlantillaACriatura: (idCriatura: string, idPlantilla: string) => void;
  actualizarVidaTemporal: (idCriatura: string, vidaTemp: number) => void;
  limpiarIniciativa: () => void;
  ordenarIniciativa: () => void;

  // Selección de TaleSpire
  actualizarSeleccionCriaturas: (seleccionadas: any[]) => void;
  agregarCriaturasSeleccionadasAIniciativa: () => void;

  // CRUD Homebrew
  agregarMonstruoHomebrew: (monstruo: Omit<MonstruoBase, "id">) => void;
  agregarHechizoHomebrew: (hechizo: Omit<HechizoBase, "id">) => void;
  agregarObjetoHomebrew: (objeto: Omit<ObjetoHomebrew, "id">) => void;
  actualizarMonstruoHomebrew: (id: string, monstruo: Omit<MonstruoBase, "id" | "vidaActual">) => void;
  actualizarHechizoHomebrew: (id: string, hechizo: Omit<HechizoBase, "id">) => void;
  actualizarObjetoHomebrew: (id: string, objeto: Omit<ObjetoHomebrew, "id">) => void;
  eliminarMonstruoHomebrew: (id: string) => void;
  eliminarHechizoHomebrew: (id: string) => void;
  eliminarObjetoHomebrew: (id: string) => void;

  // Pendientes
  agregarPendiente: (texto: string) => void;
  alternarPendiente: (id: string) => void;
  eliminarPendiente: (id: string) => void;

  // Notas
  guardarNotasDM: (notas: string) => void;

  // Encuentros
  guardarEncuentroActual: (nombre: string) => boolean;
  cargarEncuentro: (nombre: string) => boolean;
  eliminarEncuentroGuardado: (nombre: string) => void;

  // Carga e Importación
  cargarDatosPersistidos: () => void;
  importarBaseDatosJSONCompleta: (datosJSON: any) => boolean;
  restablecerDatosDeFabrica: () => void;
}

const guardarEstadoCombateLocal = (cola: CriaturaIniciativa[], ronda: number, turno: number) => {
  guardarDatoFragmentado("dm_cola_iniciativa", cola);
  localStorage.setItem("dm_ronda_actual", String(ronda));
  localStorage.setItem("dm_indice_turno_activo", String(turno));
};

export const usarAlmacenDM = create<EstadoDM>((set, get) => ({
  pestañaActiva: "iniciativa",
  modoHomebrew: "crear",
  rondaActual: 1,
  colaIniciativa: [],
  indiceTurnoActivo: 0,
  criaturasSeleccionadas: [],
  tipoTirada: "plano",
  metodoVidaMonstruo: "estandar",
  cargando: false,
  campañaNombre: "Cargando campaña de TaleSpire...",
  esGM: true,

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

  establecerPestaña: (pestaña) => set({ pestañaActiva: pestaña }),
  establecerModoHomebrew: (modo) => set({ modoHomebrew: modo }),
  establecerMetodoVidaMonstruo: (metodo) => {
    localStorage.setItem("dm_metodo_vida_monstruo", metodo);
    set({ metodoVidaMonstruo: metodo });
  },

  avanzarRonda: () => set((state) => {
    const nuevaRonda = state.rondaActual + 1;
    guardarEstadoCombateLocal(state.colaIniciativa, nuevaRonda, state.indiceTurnoActivo);
    return { rondaActual: nuevaRonda };
  }),
  retrocederRonda: () => set((state) => {
    const nuevaRonda = Math.max(1, state.rondaActual - 1);
    guardarEstadoCombateLocal(state.colaIniciativa, nuevaRonda, state.indiceTurnoActivo);
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
    guardarEstadoCombateLocal(state.colaIniciativa, nuevaRonda, nuevoIndice);
    return { indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
  }),

  retrocederTurno: () => set((state) => {
    if (state.colaIniciativa.length === 0) return {};
    let nuevoIndice = state.indiceTurnoActivo - 1;
    let nuevaRonda = state.rondaActual;

    if (nuevoIndice < 0) {
      nuevoIndice = state.colaIniciativa.length - 1;
      nuevaRonda = Math.max(1, state.rondaActual - 1);
    }
    guardarEstadoCombateLocal(state.colaIniciativa, nuevaRonda, nuevoIndice);
    return { indiceTurnoActivo: nuevoIndice, rondaActual: nuevaRonda };
  }),

  establecerTipoTirada: (tipo) => set({ tipoTirada: tipo }),

  // Sincronización híbrida de la iniciativa con TaleSpire
  actualizarColaIniciativaDesdeTaleSpire: (colaTS) => set((state) => {
    // 1. Extraemos las criaturas locales creadas virtualmente por el DM en el Simbionte
    const criaturasLocales = state.colaIniciativa.filter((c) => c.id.startsWith("c_local_"));

    // 2. Procesamos y actualizamos las criaturas físicas leídas desde TaleSpire
    const nuevasCriaturasNativas = colaTS.map((cTS) => {
      const existente = state.colaIniciativa.find((c) => c.id === cTS.id);
      
      if (existente) {
        return existente; // Preservamos vida y condiciones
      }

      // Si no existe, buscamos por nombre en la base de datos de monstruos del DM usando emparejamiento inteligente
      const nombreTS = cTS.name.toLowerCase().trim();
      const nombreTSBase = nombreTS
        .replace(/\s+\d+$/g, "") // "Orco 1" -> "orco"
        .replace(/\s+#[a-zA-Z0-9]+$/g, "") // "Orco #2" -> "orco"
        .replace(/\s+[a-zA-Z]$/g, "") // "Orco A" -> "orco"
        .trim();

      const plantillaMonstruo = state.baseDatosMonstruos.find((m) => {
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

      return {
        id: cTS.id,
        nombre: cTS.name,
        iniciativa: 10, // Iniciativa neutra inicial
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

    // 3. Fusionamos ambas listas (virtuales locales y nativas físicas de TaleSpire)
    const colaCombinada = [...criaturasLocales, ...nuevasCriaturasNativas];

    // 4. Ordenamos por iniciativa de mayor a menor
    colaCombinada.sort((a, b) => b.iniciativa - a.iniciativa);

    guardarEstadoCombateLocal(colaCombinada, state.rondaActual, state.indiceTurnoActivo);

    return {
      colaIniciativa: colaCombinada
    };
  }),

  agregarCriaturaAIniciativa: (nombre, iniciativa, vidaMax, ca, esMonstruo, velocidad, bonifInic) => set((state) => {
    const nuevaCriatura: CriaturaIniciativa = {
      id: `c_local_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      nombre,
      iniciativa,
      vidaMaxima: vidaMax,
      vidaActual: vidaMax,
      ca,
      condiciones: [],
      bonificadorIniciativa: bonifInic,
      esMonstruo,
      velocidad,
      vidaTemporal: 0
    };
    const nuevaCola = [...state.colaIniciativa, nuevaCriatura];
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    guardarEstadoCombateLocal(nuevaCola, state.rondaActual, state.indiceTurnoActivo);
    return { colaIniciativa: nuevaCola };
  }),

  quitarCriaturaDeIniciativa: (id) => set((state) => {
    const nuevaCola = state.colaIniciativa.filter((c) => c.id !== id);
    // Ajustamos el índice si quitamos al activo o el tamaño se encoge
    let nuevoIndice = state.indiceTurnoActivo;
    if (nuevoIndice >= nuevaCola.length && nuevaCola.length > 0) {
      nuevoIndice = nuevaCola.length - 1;
    }
    guardarEstadoCombateLocal(nuevaCola, state.rondaActual, nuevoIndice);
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: nuevoIndice };
  }),

  modificarVidaCriaturaIniciativa: (id, nuevaVida) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === id) {
        return { ...c, vidaActual: Math.max(0, Math.min(c.vidaMaxima, nuevaVida)) };
      }
      return c;
    });
    guardarEstadoCombateLocal(nuevaCola, state.rondaActual, state.indiceTurnoActivo);
    return { colaIniciativa: nuevaCola };
  }),

  agregarCondicionACriatura: (id, condicion) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === id && !c.condiciones.includes(condicion)) {
        return { ...c, condiciones: [...c.condiciones, condicion] };
      }
      return c;
    });
    guardarEstadoCombateLocal(nuevaCola, state.rondaActual, state.indiceTurnoActivo);
    return { colaIniciativa: nuevaCola };
  }),

  quitarCondicionDeCriatura: (id, condicion) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === id) {
        return { ...c, condiciones: c.condiciones.filter((cond) => cond !== condicion) };
      }
      return c;
    });
    guardarEstadoCombateLocal(nuevaCola, state.rondaActual, state.indiceTurnoActivo);
    return { colaIniciativa: nuevaCola };
  }),

  asociarPlantillaACriatura: (idCriatura, idPlantilla) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === idCriatura) {
        return { ...c, idPlantillaAsociada: idPlantilla };
      }
      return c;
    });
    guardarEstadoCombateLocal(nuevaCola, state.rondaActual, state.indiceTurnoActivo);
    return { colaIniciativa: nuevaCola };
  }),

  actualizarVidaTemporal: (idCriatura, vidaTemp) => set((state) => {
    const nuevaCola = state.colaIniciativa.map((c) => {
      if (c.id === idCriatura) {
        return { ...c, vidaTemporal: Math.max(0, vidaTemp) };
      }
      return c;
    });
    guardarEstadoCombateLocal(nuevaCola, state.rondaActual, state.indiceTurnoActivo);
    return { colaIniciativa: nuevaCola };
  }),

  limpiarIniciativa: () => {
    guardarEstadoCombateLocal([], 1, 0);
    set({ colaIniciativa: [], indiceTurnoActivo: 0, rondaActual: 1 });
  },

  ordenarIniciativa: () => set((state) => {
    const nuevaCola = [...state.colaIniciativa];
    nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
    guardarEstadoCombateLocal(nuevaCola, state.rondaActual, 0);
    return { colaIniciativa: nuevaCola, indiceTurnoActivo: 0 };
  }),

  actualizarSeleccionCriaturas: (seleccionadas) => set({ criaturasSeleccionadas: seleccionadas }),

  agregarCriaturasSeleccionadasAIniciativa: () => set((state) => {
    if (!state.criaturasSeleccionadas || state.criaturasSeleccionadas.length === 0) return {};

    const nuevasCriaturas: CriaturaIniciativa[] = [];

    state.criaturasSeleccionadas.forEach((cTS) => {
      // Evitar duplicar criaturas que ya están en la cola de iniciativa
      if (state.colaIniciativa.some((c) => c.id === cTS.id)) return;

      const nombreTS = cTS.name.toLowerCase().trim();
      const nombreTSBase = nombreTS
        .replace(/\s+\d+$/g, "")
        .replace(/\s+#[a-zA-Z0-9]+$/g, "")
        .replace(/\s+[a-zA-Z]$/g, "")
        .trim();

      const plantillaMonstruo = state.baseDatosMonstruos.find((m) => {
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

      // Tirar iniciativa: d20 + bonificador
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

    guardarEstadoCombateLocal(colaCombinada, state.rondaActual, state.indiceTurnoActivo);

    return {
      colaIniciativa: colaCombinada
    };
  }),

  // ================= HOMEBREW CRUD PERSISTIDO =================

  agregarMonstruoHomebrew: (monstruo) => set((state) => {
    const nuevoMonstruo: MonstruoBase = {
      ...monstruo,
      id: `m_homebrew_${Date.now()}`
    };
    const nuevosMonstruos = [...state.baseDatosMonstruos, nuevoMonstruo];
    
    // Filtramos los de por vida e iniciales y guardamos el Homebrew neto
    const idsIniciales = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
    const homebrewNeto = nuevosMonstruos.filter((m) => !idsIniciales.has(m.id));
    guardarDatoFragmentado("dm_monstruos_homebrew", homebrewNeto);

    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  agregarHechizoHomebrew: (hechizo) => set((state) => {
    const nuevoHechizo: HechizoBase = {
      ...hechizo,
      id: `h_homebrew_${Date.now()}`
    };
    const nuevosHechizos = [...state.baseDatosHechizos, nuevoHechizo];

    const idsIniciales = new Set(HECHIZOS_INICIALES.map((h) => h.id));
    const homebrewNeto = nuevosHechizos.filter((h) => !idsIniciales.has(h.id));
    guardarDatoFragmentado("dm_hechizos_homebrew", homebrewNeto);

    return { baseDatosHechizos: nuevosHechizos };
  }),

  agregarObjetoHomebrew: (objeto) => set((state) => {
    const nuevoObjeto: ObjetoHomebrew = {
      ...objeto,
      id: `o_homebrew_${Date.now()}`
    };
    const nuevosObjetos = [...state.objetosHomebrew, nuevoObjeto];
    guardarDatoFragmentado("dm_objetos_homebrew", nuevosObjetos);

    return { objetosHomebrew: nuevosObjetos };
  }),

  actualizarMonstruoHomebrew: (id, monstruo) => set((state) => {
    const nuevosMonstruos = state.baseDatosMonstruos.map((m) =>
      m.id === id ? { ...m, ...monstruo, id } : m
    );
    const idsIniciales = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
    const homebrewNeto = nuevosMonstruos.filter((m) => !idsIniciales.has(m.id));
    guardarDatoFragmentado("dm_monstruos_homebrew", homebrewNeto);
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  actualizarHechizoHomebrew: (id, hechizo) => set((state) => {
    const nuevosHechizos = state.baseDatosHechizos.map((h) =>
      h.id === id ? { ...h, ...hechizo, id } : h
    );
    const idsIniciales = new Set(HECHIZOS_INICIALES.map((h) => h.id));
    const homebrewNeto = nuevosHechizos.filter((h) => !idsIniciales.has(h.id));
    guardarDatoFragmentado("dm_hechizos_homebrew", homebrewNeto);
    return { baseDatosHechizos: nuevosHechizos };
  }),

  actualizarObjetoHomebrew: (id, objeto) => set((state) => {
    const nuevosObjetos = state.objetosHomebrew.map((o) =>
      o.id === id ? { ...o, ...objeto, id } : o
    );
    guardarDatoFragmentado("dm_objetos_homebrew", nuevosObjetos);
    return { objetosHomebrew: nuevosObjetos };
  }),

  eliminarMonstruoHomebrew: (id) => set((state) => {
    const nuevosMonstruos = state.baseDatosMonstruos.filter((m) => m.id !== id);
    const idsIniciales = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
    const homebrewNeto = nuevosMonstruos.filter((m) => !idsIniciales.has(m.id));
    guardarDatoFragmentado("dm_monstruos_homebrew", homebrewNeto);
    return { baseDatosMonstruos: nuevosMonstruos };
  }),

  eliminarHechizoHomebrew: (id) => set((state) => {
    const nuevosHechizos = state.baseDatosHechizos.filter((h) => h.id !== id);
    const idsIniciales = new Set(HECHIZOS_INICIALES.map((h) => h.id));
    const homebrewNeto = nuevosHechizos.filter((h) => !idsIniciales.has(h.id));
    guardarDatoFragmentado("dm_hechizos_homebrew", homebrewNeto);
    return { baseDatosHechizos: nuevosHechizos };
  }),

  eliminarObjetoHomebrew: (id) => set((state) => {
    const nuevosObjetos = state.objetosHomebrew.filter((o) => o.id !== id);
    guardarDatoFragmentado("dm_objetos_homebrew", nuevosObjetos);
    return { objetosHomebrew: nuevosObjetos };
  }),

  // ================= PENDIENTES PERSISTIDOS =================

  agregarPendiente: (texto) => set((state) => {
    const nuevo: ElementoPendiente = {
      id: `p_local_${Date.now()}`,
      texto,
      completado: false
    };
    const nuevaLista = [...state.listaPendientes, nuevo];
    guardarDatoFragmentado("dm_pendientes", nuevaLista);
    return { listaPendientes: nuevaLista };
  }),

  alternarPendiente: (id) => set((state) => {
    const nuevaLista = state.listaPendientes.map((p) =>
      p.id === id ? { ...p, completado: !p.completado } : p
    );
    guardarDatoFragmentado("dm_pendientes", nuevaLista);
    return { listaPendientes: nuevaLista };
  }),

  eliminarPendiente: (id) => set((state) => {
    const nuevaLista = state.listaPendientes.filter((p) => p.id !== id);
    guardarDatoFragmentado("dm_pendientes", nuevaLista);
    return { listaPendientes: nuevaLista };
  }),

  // ================= NOTAS DM =================

  guardarNotasDM: (notas) => set(() => {
    localStorage.setItem("dm_notas", notas);
    return { notasDM: notas };
  }),

  // ================= GESTIÓN DE ENCUENTROS PERSISTIDOS =================

  guardarEncuentroActual: (nombre) => {
    const state = get();
    if (!nombre.trim() || state.colaIniciativa.length === 0) return false;

    const nuevoEncuentro: EncuentroGuardado = {
      nombre: nombre.trim(),
      ronda: state.rondaActual,
      cola: state.colaIniciativa,
      fecha: new Date().toLocaleString("es-ES")
    };

    // Quitamos previos con el mismo nombre si existen
    const encuentrosLimpios = state.encuentrosGuardados.filter(
      (e) => e.nombre.toLowerCase() !== nombre.trim().toLowerCase()
    );

    const nuevosEncuentros = [...encuentrosLimpios, nuevoEncuentro];
    set({ encuentrosGuardados: nuevosEncuentros });
    guardarDatoFragmentado("dm_encuentros_guardados", nuevosEncuentros);
    return true;
  },

  cargarEncuentro: (nombre) => {
    const state = get();
    const encuentro = state.encuentrosGuardados.find(
      (e) => e.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (!encuentro) return false;

    set({
      colaIniciativa: encuentro.cola,
      rondaActual: encuentro.ronda,
      indiceTurnoActivo: 0
    });
    return true;
  },

  eliminarEncuentroGuardado: (nombre) => set((state) => {
    const nuevosEncuentros = state.encuentrosGuardados.filter((e) => e.nombre !== nombre);
    guardarDatoFragmentado("dm_encuentros_guardados", nuevosEncuentros);
    return { encuentrosGuardados: nuevosEncuentros };
  }),

  // ================= CARGAR DATOS GENERALES AL INICIAR =================

  cargarDatosPersistidos: () => {
    // 1. Cargar Monstruos Homebrew
    const monstruosHomebrew = obtenerDatoFragmentado<MonstruoBase[]>("dm_monstruos_homebrew");
    if (monstruosHomebrew && monstruosHomebrew.length > 0) {
      set(() => ({
        baseDatosMonstruos: [...MONSTRUOS_INICIALES, ...monstruosHomebrew]
      }));
    }

    // 2. Cargar Hechizos Homebrew
    const hechizosHomebrew = obtenerDatoFragmentado<HechizoBase[]>("dm_hechizos_homebrew");
    if (hechizosHomebrew && hechizosHomebrew.length > 0) {
      set(() => ({
        baseDatosHechizos: [...HECHIZOS_INICIALES, ...hechizosHomebrew]
      }));
    }

    // 3. Cargar Objetos Homebrew
    const objetosHomebrew = obtenerDatoFragmentado<any[]>("dm_objetos_homebrew");
    if (objetosHomebrew) {
      const objetosSaneados = objetosHomebrew.map(sanearObjetoHomebrew);
      set({ objetosHomebrew: objetosSaneados });
      guardarDatoFragmentado("dm_objetos_homebrew", objetosSaneados);
    }

    // 4. Cargar Pendientes
    const pendientes = obtenerDatoFragmentado<ElementoPendiente[]>("dm_pendientes");
    if (pendientes) {
      set({ listaPendientes: pendientes });
    }

    // 5. Cargar Notas
    const notas = localStorage.getItem("dm_notas");
    if (notas !== null) {
      set({ notasDM: notas });
    }

    // 6. Cargar Encuentros
    const encuentros = obtenerDatoFragmentado<EncuentroGuardado[]>("dm_encuentros_guardados");
    if (encuentros) {
      set({ encuentrosGuardados: encuentros });
    }

    // 7. Cargar Combate Activo
    const combateCola = obtenerDatoFragmentado<CriaturaIniciativa[]>("dm_cola_iniciativa");
    if (combateCola) {
      set({ colaIniciativa: combateCola });
    }
    const rondaGuardada = localStorage.getItem("dm_ronda_actual");
    if (rondaGuardada) {
      set({ rondaActual: Number(rondaGuardada) || 1 });
    }
    const turnoGuardado = localStorage.getItem("dm_indice_turno_activo");
    if (turnoGuardado) {
      set({ indiceTurnoActivo: Number(turnoGuardado) || 0 });
    }
    const metodoGuardado = localStorage.getItem("dm_metodo_vida_monstruo") as "estandar" | "maximo" | "azar" | null;
    if (metodoGuardado) {
      set({ metodoVidaMonstruo: metodoGuardado });
    }
  },

  // ================= IMPORTADOR DINÁMICO DE JSON =================

  importarBaseDatosJSONCompleta: (datosJSON) => {
    try {
      let modificado = false;
      const state = get();

      let monstruosCandidatos: any[] = [];
      let hechizosCandidatos: any[] = [];
      let objetosCandidatos: any[] = [];

      // 1. Si viene con el formato de backup o estructura agrupada o global.json
      if (datosJSON.monstruos) {
        monstruosCandidatos = Array.isArray(datosJSON.monstruos) ? datosJSON.monstruos : Object.values(datosJSON.monstruos);
      }
      if (datosJSON["Custom Monsters"]) {
        monstruosCandidatos = Array.isArray(datosJSON["Custom Monsters"]) ? datosJSON["Custom Monsters"] : Object.values(datosJSON["Custom Monsters"]);
      }

      if (datosJSON.hechizos) {
        hechizosCandidatos = Array.isArray(datosJSON.hechizos) ? datosJSON.hechizos : Object.values(datosJSON.hechizos);
      }
      if (datosJSON["Custom Spells"]) {
        hechizosCandidatos = Array.isArray(datosJSON["Custom Spells"]) ? datosJSON["Custom Spells"] : Object.values(datosJSON["Custom Spells"]);
      }

      if (datosJSON.objetos) {
        objetosCandidatos = Array.isArray(datosJSON.objetos) ? datosJSON.objetos : Object.values(datosJSON.objetos);
      }
      if (datosJSON["Custom Equipment"]) {
        objetosCandidatos = Array.isArray(datosJSON["Custom Equipment"]) ? datosJSON["Custom Equipment"] : Object.values(datosJSON["Custom Equipment"]);
      }

      // 2. Si el archivo JSON es en sí mismo una lista o diccionario plano
      if (monstruosCandidatos.length === 0 && hechizosCandidatos.length === 0 && objetosCandidatos.length === 0) {
        const listaElementos = Array.isArray(datosJSON) ? datosJSON : Object.values(datosJSON);
        
        if (listaElementos.length > 0) {
          const primerElem = listaElementos[0] as any;
          if (primerElem && (primerElem.equipment_category !== undefined || primerElem.weapon_category !== undefined || primerElem.armor_category !== undefined || primerElem.tool_category !== undefined || primerElem.cost !== undefined)) {
            objetosCandidatos = listaElementos;
          } else if (primerElem && (primerElem.HP !== undefined || primerElem.AC !== undefined || primerElem.vidaMaxima !== undefined || primerElem.vidaActual !== undefined)) {
            monstruosCandidatos = listaElementos;
          } else if (primerElem && (primerElem.school !== undefined || primerElem.level !== undefined || primerElem.escuela !== undefined || primerElem.casting_time !== undefined)) {
            hechizosCandidatos = listaElementos;
          } else if (primerElem && (primerElem.rareza !== undefined || primerElem.rare !== undefined || primerElem.propiedades !== undefined)) {
            objetosCandidatos = listaElementos;
          }
        }
      }

      // Procesar Monstruos importados
      if (monstruosCandidatos.length > 0) {
        const nuevosMonstruosFormateados: MonstruoBase[] = monstruosCandidatos.map((m, idx) => {
          // Extraer HP
          let vidaMax = 10;
          let vidaNotas = "";
          if (m.vidaMaxima !== undefined) {
            vidaMax = Number(m.vidaMaxima);
          } else if (m.HP !== undefined) {
            if (typeof m.HP === "object") {
              vidaMax = Number(m.HP.Value) || 10;
              vidaNotas = m.HP.Notes || "";
            } else {
              vidaMax = Number(m.HP) || 10;
            }
          }

          // Extraer AC
          let caVal = 10;
          let caNotas = "";
          if (m.ca !== undefined) {
            caVal = Number(m.ca);
          } else if (m.AC !== undefined) {
            if (typeof m.AC === "object") {
              caVal = Number(m.AC.Value) || 10;
              caNotas = m.AC.Notes || "";
            } else {
              caVal = Number(m.AC) || 10;
            }
          }

          // Extraer Habilidades (Características)
          const caracteristicasFormateadas = {
            fuerza: 10,
            destreza: 10,
            constitucion: 10,
            inteligencia: 10,
            sabiduria: 10,
            carisma: 10
          };
          if (m.caracteristicas) {
            caracteristicasFormateadas.fuerza = Number(m.caracteristicas.fuerza) || 10;
            caracteristicasFormateadas.destreza = Number(m.caracteristicas.destreza) || 10;
            caracteristicasFormateadas.constitucion = Number(m.caracteristicas.constitucion) || 10;
            caracteristicasFormateadas.inteligencia = Number(m.caracteristicas.inteligencia) || 10;
            caracteristicasFormateadas.sabiduria = Number(m.caracteristicas.sabiduria) || 10;
            caracteristicasFormateadas.carisma = Number(m.caracteristicas.carisma) || 10;
          } else if (m.Abilities) {
            caracteristicasFormateadas.fuerza = Number(m.Abilities.Fue || m.Abilities.STR || m.Abilities.Str) || 10;
            caracteristicasFormateadas.destreza = Number(m.Abilities.Des || m.Abilities.DEX || m.Abilities.Dex) || 10;
            caracteristicasFormateadas.constitucion = Number(m.Abilities.Con || m.Abilities.CON || m.Abilities.Con) || 10;
            caracteristicasFormateadas.inteligencia = Number(m.Abilities.Int || m.Abilities.INT || m.Abilities.Int) || 10;
            caracteristicasFormateadas.sabiduria = Number(m.Abilities.Sab || m.Abilities.WIS || m.Abilities.Wis) || 10;
            caracteristicasFormateadas.carisma = Number(m.Abilities.Car || m.Abilities.CHA || m.Abilities.Cha) || 10;
          }

          // Extraer Velocidad
          let velocidadStr = "30 pies";
          if (typeof m.velocidad === "string") {
            velocidadStr = m.velocidad;
          } else if (Array.isArray(m.Speed)) {
            velocidadStr = m.Speed.join(", ");
          } else if (m.Speed) {
            velocidadStr = String(m.Speed);
          }

          // Extraer iniciativa bonificador
          let inicBonif = 0;
          if (m.iniciativaBonificador !== undefined) {
            inicBonif = Number(m.iniciativaBonificador);
          } else if (m.InitiativeModifier !== undefined) {
            inicBonif = Number(m.InitiativeModifier);
          }

          // Mapear rasgos y acciones
          const rasgosFormateados = Array.isArray(m.rasgos) 
            ? m.rasgos.map((r: any) => ({ nombre: r.nombre || r.Name || "", descripcion: r.descripcion || r.Content || "", uso: r.uso || r.Usage || "" }))
            : (Array.isArray(m.Traits) ? m.Traits.map((r: any) => ({ nombre: r.Name || "", descripcion: r.Content || "", uso: r.Usage || "" })) : []);

          const accionesFormateadas = Array.isArray(m.acciones)
            ? m.acciones.map((a: any) => ({ nombre: a.nombre || a.Name || "", descripcion: a.descripcion || a.Content || "", uso: a.uso || a.Usage || "" }))
            : (Array.isArray(m.Actions) ? m.Actions.map((a: any) => ({ nombre: a.Name || "", descripcion: a.Content || "", uso: a.Usage || "" })) : []);

          const reaccionesFormateadas = Array.isArray(m.reacciones)
            ? m.reacciones.map((r: any) => ({ nombre: r.nombre || r.Name || "", descripcion: r.descripcion || r.Content || "", uso: r.uso || r.Usage || "" }))
            : (Array.isArray(m.Reactions) ? m.Reactions.map((r: any) => ({ nombre: r.Name || "", descripcion: r.Content || "", uso: r.Usage || "" })) : []);

          const legendariasFormateadas = Array.isArray(m.accionesLegendarias)
            ? m.accionesLegendarias.map((l: any) => ({ nombre: l.nombre || l.Name || "", descripcion: l.descripcion || l.Content || "", uso: l.uso || l.Usage || "" }))
            : (Array.isArray(m.LegendaryActions) ? m.LegendaryActions.map((l: any) => ({ nombre: l.Name || "", descripcion: l.Content || "", uso: l.Usage || "" })) : []);

          // Mapear salvaciones
          const salvacionesMap: any = {};
          if (Array.isArray(m.Saves)) {
            m.Saves.forEach((s: any) => {
              const nameLower = String(s.Name).toLowerCase();
              if (nameLower.includes("fue") || nameLower.includes("str")) salvacionesMap.fuerza = Number(s.Modifier);
              if (nameLower.includes("des") || nameLower.includes("dex")) salvacionesMap.destreza = Number(s.Modifier);
              if (nameLower.includes("con")) salvacionesMap.constitucion = Number(s.Modifier);
              if (nameLower.includes("int")) salvacionesMap.inteligencia = Number(s.Modifier);
              if (nameLower.includes("sab") || nameLower.includes("wis")) salvacionesMap.sabiduria = Number(s.Modifier);
              if (nameLower.includes("car") || nameLower.includes("cha")) salvacionesMap.carisma = Number(s.Modifier);
            });
          }

          // Mapear habilidades (skills)
          const habilidadesMap: any = {};
          if (Array.isArray(m.Skills)) {
            m.Skills.forEach((s: any) => {
              const nameLower = String(s.Name).toLowerCase();
              if (nameLower.includes("acrobacias") || nameLower.includes("acrobatics")) habilidadesMap.acrobacias = Number(s.Modifier);
              if (nameLower.includes("manejo") || nameLower.includes("animal")) habilidadesMap.manejoAnimales = Number(s.Modifier);
              if (nameLower.includes("arcana") || nameLower.includes("arcanos")) habilidadesMap.arcanos = Number(s.Modifier);
              if (nameLower.includes("atletismo") || nameLower.includes("athletics")) habilidadesMap.atletismo = Number(s.Modifier);
              if (nameLower.includes("engaño") || nameLower.includes("deception")) habilidadesMap.engaño = Number(s.Modifier);
              if (nameLower.includes("historia") || nameLower.includes("history")) habilidadesMap.historia = Number(s.Modifier);
              if (nameLower.includes("perspicacia") || nameLower.includes("insight")) habilidadesMap.perspicacia = Number(s.Modifier);
              if (nameLower.includes("intimidación") || nameLower.includes("intimidation")) habilidadesMap.intimidacion = Number(s.Modifier);
              if (nameLower.includes("investigación") || nameLower.includes("investigation")) habilidadesMap.investigacion = Number(s.Modifier);
              if (nameLower.includes("medicina") || nameLower.includes("medicine")) habilidadesMap.medicina = Number(s.Modifier);
              if (nameLower.includes("naturaleza") || nameLower.includes("nature")) habilidadesMap.naturaleza = Number(s.Modifier);
              if (nameLower.includes("percepción") || nameLower.includes("perception")) habilidadesMap.percepcion = Number(s.Modifier);
              if (nameLower.includes("interpretación") || nameLower.includes("performance")) habilidadesMap.interpretacion = Number(s.Modifier);
              if (nameLower.includes("persuasión") || nameLower.includes("persuasion")) habilidadesMap.persuasion = Number(s.Modifier);
              if (nameLower.includes("religión") || nameLower.includes("religion")) habilidadesMap.religion = Number(s.Modifier);
              if (nameLower.includes("juego") || nameLower.includes("sleight")) habilidadesMap.juegoManos = Number(s.Modifier);
              if (nameLower.includes("sigilo") || nameLower.includes("stealth")) habilidadesMap.sigilo = Number(s.Modifier);
              if (nameLower.includes("supervivencia") || nameLower.includes("survival")) habilidadesMap.supervivencia = Number(s.Modifier);
            });
          }

          // Acciones rápidas (Quick actions)
          let accionesRapidasFormateadas: any[] = [];
          if (Array.isArray(m.QuickAction)) {
            accionesRapidasFormateadas = m.QuickAction.map((qa: any) => ({
              nombre: qa.Name || "Ataque",
              bonificadorAtaque: qa.ToHit || "+0",
              dadosDaño: qa.Damage || "1d6",
              tipoDaño: qa.DamageType || "físico"
            }));
          }

          return {
            id: m.Id || m.id || `m_importado_${Date.now()}_${idx}`,
            nombre: aplanarValor(m.Name || m.nombre || "Monstruo Desconocido"),
            tipo: aplanarValor(m.Type || m.tipo || "Desconocido"),
            ca: caVal,
            caNotas: aplanarValor(caNotas),
            vidaMaxima: vidaMax,
            vidaActual: vidaMax,
            vidaNotas: aplanarValor(vidaNotas),
            iniciativaBonificador: inicBonif,
            velocidad: aplanarValor(velocidadStr),
            sentidos: aplanarValor(m.Senses),
            idiomas: aplanarValor(m.Languages),
            desafio: aplanarValor(m.Challenge || m.desafio || m.CR || "0"),
            fuente: aplanarValor(m.Source || m.fuente || "Manual de Monstruos"),
            caracteristicas: caracteristicasFormateadas,
            salvaciones: salvacionesMap,
            habilidades: habilidadesMap,
            vulnerabilidades: Array.isArray(m.DamageVulnerabilities) ? m.DamageVulnerabilities.map(aplanarValor) : [],
            resistencias: Array.isArray(m.DamageResistances) ? m.DamageResistances.map(aplanarValor) : [],
            inmunidadesDaño: Array.isArray(m.DamageImmunities) ? m.DamageImmunities.map(aplanarValor) : [],
            inmunidadesCondicion: Array.isArray(m.ConditionImmunities) ? m.ConditionImmunities.map(aplanarValor) : [],
            accionesRapidas: accionesRapidasFormateadas.map((qa: any) => ({
              nombre: aplanarValor(qa.nombre),
              bonificadorAtaque: aplanarValor(qa.bonificadorAtaque),
              dadosDaño: aplanarValor(qa.dadosDaño),
              tipoDaño: aplanarValor(qa.tipoDaño)
            })),
            rasgos: rasgosFormateados.map((r: any) => ({
              nombre: aplanarValor(r.nombre),
              descripcion: aplanarValor(r.descripcion),
              uso: aplanarValor(r.uso)
            })),
            acciones: accionesFormateadas.map((a: any) => ({
              nombre: aplanarValor(a.nombre),
              descripcion: aplanarValor(a.descripcion),
              bonificadorAtaque: a.bonificadorAtaque,
              daño: aplanarValor(a.daño),
              uso: aplanarValor(a.uso)
            })),
            reacciones: reaccionesFormateadas.map((r: any) => ({
              nombre: aplanarValor(r.nombre),
              descripcion: aplanarValor(r.descripcion),
              uso: aplanarValor(r.uso)
            })),
            accionesLegendarias: legendariasFormateadas.map((l: any) => ({
              nombre: aplanarValor(l.nombre),
              descripcion: aplanarValor(l.descripcion),
              uso: aplanarValor(l.uso)
            }))
          };
        });

        // Combinar, evitando duplicidad por nombre
        const monstruosFiltrados = state.baseDatosMonstruos.filter(
          (mExistente) => !nuevosMonstruosFormateados.some((mNuevo) => mNuevo.nombre.toLowerCase() === mExistente.nombre.toLowerCase())
        );

        const combinados = [...monstruosFiltrados, ...nuevosMonstruosFormateados];
        set({ baseDatosMonstruos: combinados });

        const idsIniciales = new Set(MONSTRUOS_INICIALES.map((m) => m.id));
        const homebrewNeto = combinados.filter((m) => !idsIniciales.has(m.id));
        guardarDatoFragmentado("dm_monstruos_homebrew", homebrewNeto);
        modificado = true;
      }

      // Procesar Hechizos importados
      if (hechizosCandidatos.length > 0) {
        const nuevosHechizosFormateados: HechizoBase[] = hechizosCandidatos.map((h, idx) => {
          let nivelNum = 0;
          if (h.nivel !== undefined) {
            nivelNum = Number(h.nivel);
          } else if (h.level !== undefined) {
            const lvlStr = String(h.level).toLowerCase();
            if (lvlStr.includes("cantrip") || lvlStr.includes("truco")) {
              nivelNum = 0;
            } else {
              const matches = lvlStr.match(/\d+/);
              nivelNum = matches ? Number(matches[0]) : 1;
            }
          }

          let concentracionVal = false;
          if (h.concentration !== undefined) {
            const cStr = String(h.concentration).toLowerCase();
            concentracionVal = cStr === "yes" || cStr === "true" || cStr === "sí" || cStr === "si";
          } else if (h.concentracion !== undefined) {
            concentracionVal = !!h.concentracion;
          }

          let ritualVal = false;
          if (h.ritual !== undefined) {
            const rStr = String(h.ritual).toLowerCase().trim();
            ritualVal = rStr.length > 0 && rStr !== "no" && rStr !== "false";
          }

          // Deducir componentes seleccionados en base a componentes string (ej: "V, S, M")
          const compStr = aplanarValor(h.componentes || h.components || "V, S").toUpperCase();
          const componentesSeleccionados = {
            verbal: compStr.includes("V") || compStr.includes("VERBAL"),
            somatico: compStr.includes("S") || compStr.includes("SOMÁTICO") || compStr.includes("SOMATICO"),
            material: compStr.includes("M") || compStr.includes("MATERIAL")
          };

          // Extraer lista de clases de hechizos
          let clasesArray: string[] = [];
          const claseRaw = h.class || h.clases || h.clase;
          if (Array.isArray(claseRaw)) {
            clasesArray = claseRaw.map(aplanarValor);
          } else if (typeof claseRaw === "string" && claseRaw.trim()) {
            clasesArray = claseRaw.split(",").map((c: string) => c.trim()).filter(Boolean);
          }

          let desc = h.descripcion || h.desc || "";
          
          // Preservar compatibilidad rústica concatenando en la descripción si se requiere
          let extras: string[] = [];
          if (h.duration || h.duracion) {
            extras.push(`**Duración:** ${aplanarValor(h.duration || h.duracion)}`);
          }
          if (h.material) {
            extras.push(`**Materiales:** ${aplanarValor(h.material)}`);
          }
          if (clasesArray.length > 0) {
            extras.push(`**Clases:** ${clasesArray.join(", ")}`);
          }
          if (h.damage_dice) {
            let mech = `**Daño:** ${aplanarValor(h.damage_dice)}`;
            if (h.damage_type_01) mech += ` (${aplanarValor(h.damage_type_01)})`;
            if (h.spell_save_dc_type) mech += ` | CD Salvación: ${String(h.spell_save_dc_type).toUpperCase()}`;
            extras.push(mech);
          }

          if (extras.length > 0) {
            desc += "\n\n" + extras.join("\n");
          }

          if (h.higher_level) {
            desc += `\n\n**A niveles superiores:** ${aplanarValor(h.higher_level)}`;
          }

          // CD de salvación mapeado
          let cdSalv = "";
          if (h.spell_save_dc_type) {
            const dcType = String(h.spell_save_dc_type).toUpperCase().trim();
            if (dcType.includes("STR") || dcType.includes("FUE")) cdSalv = "FUE";
            else if (dcType.includes("DEX") || dcType.includes("DES")) cdSalv = "DES";
            else if (dcType.includes("CON")) cdSalv = "CON";
            else if (dcType.includes("INT")) cdSalv = "INT";
            else if (dcType.includes("WIS") || dcType.includes("SAB")) cdSalv = "SAB";
            else if (dcType.includes("CHA") || dcType.includes("CAR")) cdSalv = "CAR";
          }

          return {
            id: h.id || `h_importado_${Date.now()}_${idx}`,
            nombre: aplanarValor(h.nombre || h.name || "Hechizo Desconocido"),
            nivel: nivelNum,
            escuela: aplanarValor(h.escuela || h.school || "Universal"),
            tiempoLanzamiento: aplanarValor(h.tiempoLanzamiento || h.casting_time || "1 acción"),
            alcance: aplanarValor(h.alcance || h.range || "Personal"),
            componentes: aplanarValor(h.componentes || h.components || "V, S"),
            descripcion: aplanarValor(desc),
            concentracion: concentracionVal,
            ritual: ritualVal,
            
            // Campos enriquecidos estructurados
            descNivelSuperior: h.higher_level ? aplanarValor(h.higher_level) : undefined,
            materiales: h.material ? aplanarValor(h.material) : undefined,
            componentesSeleccionados,
            duracion: h.duration || h.duracion ? aplanarValor(h.duration || h.duracion) : undefined,
            clases: clasesArray.length > 0 ? clasesArray : undefined,
            ataqueCd: h.spell_save_dc_type ? "CD DE SALVACIÓN" : (h.damage_dice ? "TIRADA DE ATAQUE" : "N/A"),
            dadosDaño: h.damage_dice ? aplanarValor(h.damage_dice) : undefined,
            dadosDañoNivelSuperior: h.higher_level_damage ? aplanarValor(h.higher_level_damage) : undefined,
            cdSalvacion: cdSalv || undefined,
            agregarModificadorHabilidad: h.add_ability_modifier === "yes" || h.add_ability_modifier === true || undefined,
            tipoDaño: h.damage_type_01 ? aplanarValor(h.damage_type_01).toLowerCase() : undefined
          };
        });

        const hechizosFiltrados = state.baseDatosHechizos.filter(
          (hExistente) => !nuevosHechizosFormateados.some((hNuevo) => hNuevo.nombre.toLowerCase().trim() === hExistente.nombre.toLowerCase().trim())
        );

        const combinados = [...hechizosFiltrados, ...nuevosHechizosFormateados];
        set({ baseDatosHechizos: combinados });

        const idsIniciales = new Set(HECHIZOS_INICIALES.map((h) => h.id));
        const homebrewNeto = combinados.filter((h) => !idsIniciales.has(h.id));
        guardarDatoFragmentado("dm_hechizos_homebrew", homebrewNeto);
        modificado = true;
      }

      // Procesar Objetos importados (incluyendo equipamiento de equipment-es.json)
      if (objetosCandidatos.length > 0) {
        const nuevosObjetosFormateados: ObjetoHomebrew[] = objetosCandidatos.map((o, idx) => {
          let nombre = aplanarValor(o.nombre || o.name || "Objeto Desconocido");
          let rareza = aplanarValor(o.rareza || o.rarity || (o.magic_item ? "Mágico" : "Común"));
          
          let propiedadesArr: string[] = [];
          
          // Categoría de equipamiento
          let categoriaStr = "OTRO";
          if (o.equipment_category) {
            categoriaStr = aplanarValor(typeof o.equipment_category === 'object' ? o.equipment_category.name : o.equipment_category);
          } else if (o.magic_item) {
            categoriaStr = "OBJETO MÁGICO";
          } else if (o.weapon_category) {
            categoriaStr = "ARMA";
          } else if (o.armor_category) {
            categoriaStr = "ARMADURA";
          }
          if (categoriaStr) propiedadesArr.push(categoriaStr);

          if (o.weapon_category) propiedadesArr.push(`Arma ${aplanarValor(o.weapon_category)}`);
          if (o.armor_category) propiedadesArr.push(`Armadura ${aplanarValor(o.armor_category)}`);
          
          // Costo y unidad traducida en español
          let cVal = 0;
          let cUni = "PO";
          if (o.cost) {
            if (typeof o.cost === 'object') {
              cVal = Number(o.cost.quantity) || 0;
              const unitRaw = String(o.cost.unit || "gp").toLowerCase().trim();
              if (unitRaw === "cp") cUni = "PC";
              else if (unitRaw === "sp") cUni = "PP";
              else if (unitRaw === "ep") cUni = "PE";
              else if (unitRaw === "gp") cUni = "PO";
              else if (unitRaw === "pp") cUni = "PPT";
              propiedadesArr.push(`Coste: ${cVal} ${cUni}`);
            } else {
              const costStr = String(o.cost).trim();
              const matches = costStr.match(/(\d+)\s*([a-zA-Z]+)/);
              if (matches) {
                cVal = Number(matches[1]) || 0;
                const unitRaw = matches[2].toLowerCase();
                if (unitRaw === "cp") cUni = "PC";
                else if (unitRaw === "sp") cUni = "PP";
                else if (unitRaw === "ep") cUni = "PE";
                else if (unitRaw === "gp") cUni = "PO";
                else if (unitRaw === "pp") cUni = "PPT";
              } else {
                cVal = Number(costStr) || 0;
              }
              propiedadesArr.push(`Coste: ${cVal} ${cUni}`);
            }
          }
          
          // Peso
          let pesoStr = "";
          if (o.weight !== undefined && o.weight !== null) {
            pesoStr = `${aplanarValor(o.weight)} lb`;
            propiedadesArr.push(`Peso: ${pesoStr}`);
          }
          
          // Daño (para armas)
          let dmgDice = "";
          let dmgType = "";
          if (o.damage) {
            if (typeof o.damage === 'object') {
              dmgDice = aplanarValor(o.damage.damage_dice || "");
              const dmgTypeName = o.damage.damage_type ? (typeof o.damage.damage_type === 'object' ? o.damage.damage_type.name : o.damage.damage_type) : "";
              dmgType = aplanarValor(dmgTypeName).toLowerCase();
              if (dmgDice) {
                propiedadesArr.push(`Daño: ${dmgDice}${dmgType ? ` (${dmgType})` : ""}`);
              }
            } else {
              dmgDice = String(o.damage);
              propiedadesArr.push(`Daño: ${dmgDice}`);
            }
          }

          // Bonificación mágica (de toHitBonus y damageBonus en las capturas del usuario)
          let bonoAtkStr = "";
          let bonoDmgStr = "";
          if (o.toHitBonus) {
            bonoAtkStr = String(o.toHitBonus);
            propiedadesArr.push(`Bono Ataque: +${bonoAtkStr}`);
          }
          if (o.damageBonus) {
            bonoDmgStr = String(o.damageBonus);
            propiedadesArr.push(`Bono Daño: +${bonoDmgStr}`);
          }
          
          // Cargas / Sintonización
          let propArmaArr: string[] = [];
          if (o.hasCharges || o.tieneCargas) {
            propArmaArr.push("Tiene cargas");
            let cargasStr = "Tiene Cargas";
            if (o.chargesOptions && typeof o.chargesOptions === 'object') {
              const maxC = o.chargesOptions.max || o.chargesOptions.cantidadMax;
              if (maxC) cargasStr = `Cargas: ${aplanarValor(maxC)} máx`;
            }
            propiedadesArr.push(cargasStr);
          }

          // Deducir propiedades de armas desde el array original 'properties'
          if (Array.isArray(o.properties)) {
            o.properties.forEach((p: any) => {
              const propName = aplanarValor(typeof p === 'object' ? p.name : p).toLowerCase().trim();
              if (propName.includes("finesse") || propName.includes("sutil")) propArmaArr.push("Sutil");
              else if (propName.includes("versatile") || propName.includes("versátil")) propArmaArr.push("Versátil");
              else if (propName.includes("heavy") || propName.includes("pesado")) propArmaArr.push("Pesado");
              else if (propName.includes("light") || propName.includes("ligero")) propArmaArr.push("Ligero");
              else if (propName.includes("loading") || propName.includes("carga")) propArmaArr.push("Carga");
              else if (propName.includes("reach") || propName.includes("alcance")) propArmaArr.push("Alcance");
              else if (propName.includes("thrown") || propName.includes("arrojadiza")) propArmaArr.push("Arrojadiza");
              else if (propName.includes("two-handed") || propName.includes("a dos manos")) propArmaArr.push("A dos manos");
              else if (propName.includes("silvered") || propName.includes("plateado")) propArmaArr.push("Plateado");
              else if (propName.includes("special") || propName.includes("especial")) propArmaArr.push("Especial");
              else if (propName.includes("ammunition") || propName.includes("munición")) propArmaArr.push("Munición");
              else if (propName.includes("sintonización") || propName.includes("attunement") || propName.includes("sintonizacion")) propArmaArr.push("Sintonización");
            });
          }

          // Bonos adicionales (como resistencia, CA, etc. de las capturas)
          let bonosMagicosLista: any[] = [];
          if (Array.isArray(o.bonus) && o.bonus.length > 0) {
            bonosMagicosLista = o.bonus.map((b: any) => {
              if (typeof b === 'object') {
                return {
                  categoria: aplanarValor(b.category || b.categoria || "OTRO"),
                  bono: aplanarValor(b.bonus || b.bono || ""),
                  valor: Number(b.value || b.valor) || 0
                };
              }
              return { categoria: "OTRO", bono: aplanarValor(b), valor: 0 };
            });

            const bonosStr = bonosMagicosLista.map(b => `${b.categoria} ${b.bono}: +${b.valor}`).join(', ');
            if (bonosStr) propiedadesArr.push(`Bonos: ${bonosStr}`);
          }
          
          if (Array.isArray(o.properties)) {
            const props = o.properties.map((p: any) => aplanarValor(typeof p === 'object' ? p.name : p)).filter(Boolean).join(', ');
            if (props) propiedadesArr.push(`Propiedades: ${props}`);
          } else if (typeof o.properties === 'string' && o.properties.trim()) {
            propiedadesArr.push(aplanarValor(o.properties));
          }
          
          let propiedadesFinal = propiedadesArr.join(" | ");
          if (!propiedadesFinal) propiedadesFinal = aplanarValor(o.propiedades || "Ninguna");
          
          // Descripción
          let descRaw = o.desc || o.descripcion || o.description || "";
          let descripcion = aplanarValor(descRaw);
          
          // Si no tiene descripción pero tiene otras claves (como armor_class, speed, etc.)
          if (!descripcion && o.armor_class) {
            descripcion = `Clase de Armadura (CA): ${o.armor_class.base}` + (o.armor_class.dex_bonus ? ` + Des (Máx ${o.armor_class.max_bonus || "ilimitado"})` : "") + (o.str_minimum ? ` | Requisito Fuerza: ${o.str_minimum}` : "") + (o.stealth_disadvantage ? " | Desventaja en Sigilo" : "");
          }
          
          return sanearObjetoHomebrew({
            id: o.index || o.id || `o_importado_${Date.now()}_${idx}`,
            nombre,
            rareza,
            propiedades: propiedadesFinal,
            descripcion: descripcion || "Sin descripción disponible.",
            
            // Metadatos enriquecidos
            categoria: categoriaStr,
            costoValor: cVal,
            costoUnidad: cUni,
            peso: pesoStr,
            tipoArma: o.weapon_category ? String(o.weapon_category).toUpperCase() : "N/A",
            estiloAtaque: o.weapon_range ? String(o.weapon_range).toUpperCase() : "N/A",
            alcance: o.range ? aplanarValor(typeof o.range === "object" ? o.range.normal : o.range) : undefined,
            propiedadesArma: propArmaArr,
            dadosDaño: dmgDice || undefined,
            tipoDaño: dmgType || undefined,
            bonoAtaque: bonoAtkStr || undefined,
            bonoDaño: bonoDmgStr || undefined,
            bonosMagicos: bonosMagicosLista.length > 0 ? bonosMagicosLista : undefined
          });
        });

        const objetosFiltrados = state.objetosHomebrew
          .map(sanearObjetoHomebrew)
          .filter(
            (oExistente) => !nuevosObjetosFormateados.some((oNuevo) => oNuevo.nombre.toLowerCase().trim() === oExistente.nombre.toLowerCase().trim())
          );

        const combinados = [...objetosFiltrados, ...nuevosObjetosFormateados];

        set({ objetosHomebrew: combinados });
        guardarDatoFragmentado("dm_objetos_homebrew", combinados);
        modificado = true;
      }

      return modificado;
    } catch (e) {
      console.error("[Importador] Falló la importación del JSON:", e);
      return false;
    }
  },

  restablecerDatosDeFabrica: () => {
    eliminarDatoFragmentado("dm_monstruos_homebrew");
    eliminarDatoFragmentado("dm_hechizos_homebrew");
    eliminarDatoFragmentado("dm_objetos_homebrew");
    eliminarDatoFragmentado("dm_pendientes");
    eliminarDatoFragmentado("dm_encuentros_guardados");
    eliminarDatoFragmentado("dm_cola_iniciativa");
    localStorage.removeItem("dm_notas");
    localStorage.removeItem("dm_ronda_actual");
    localStorage.removeItem("dm_indice_turno_activo");
    
    set({
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
      colaIniciativa: [],
      rondaActual: 1,
      indiceTurnoActivo: 0
    });
  }
}));
