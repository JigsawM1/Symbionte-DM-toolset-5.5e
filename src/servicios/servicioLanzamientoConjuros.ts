/**
 * Servicio Centralizado de Lanzamiento de Conjuros (D&D 5.5e 2024)
 * Patrón Facade + Strategy
 * 
 * Centraliza la validación, construcción de fórmulas TaleSpire,
 * deducción de recursos mágicos y gestión de concentración.
 */

import type { HechizoBase } from "@/tipos";
import type { PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  sanitizarEtiqueta
} from "@/utiles/lanzadorDados";
import {
  calcularFormulaEscalada,
  construirFormulaTaleSpireTruco
} from "@/utiles/utilesConjuros";
import {
  gastarRecursoLanzamientoConjuro
} from "@/servicios/calculadorMagia";

export type ModoLanzamiento =
  | "truco"
  | "espacio"
  | "ritual"
  | "objetoMagico"
  | "arcanoMistico"
  | "gratuitoInnato"
  | "ataqueMagico";

export interface SolicitudLanzamiento {
  modo: ModoLanzamiento;
  hechizo: HechizoBase;
  nivelLanzamiento?: number;
  nivelPersonaje?: number;
  nombrePersonaje?: string;
  bonoAtaqueMagico?: number;
  objetoNombre?: string;
  objetoInstanciaId?: string;
  bonoAtaqueObjeto?: number;
  cdObjeto?: number;
  costeCargasObjeto?: number;
}

export interface ContextoMagicoPersonaje {
  penalizacionArmadura?: PenalizacionArmadura | null;
  espaciosConjuroMaximos?: Record<string, number> | Record<number, number>;
  nivelConjuroMaximo?: number;
  sistemaMagia?: "espacios" | "puntos";
  costePuntosPorNivel?: Record<number, number>;
  esLanzadorPacto?: boolean;
  nivelEspacioPacto?: number;
  espaciosPactoMaximos?: number;
  espaciosPactoGastados?: number;
  arcanoMisticoGastados?: string[];
  cargasObjetoActuales?: number;
  conjurosGratuitosActivos?: string[];
  esLanzamientoGratuito?: boolean;
}

export interface ResultadoValidacion {
  permitido: boolean;
  motivo?: string;
}

export interface FormulaConstruida {
  formulaTaleSpire: string;
  etiquetaLog: string;
}

export type InstruccionGasto =
  | { tipo: "ninguno" }
  | { tipo: "espacio"; nivel: number }
  | { tipo: "puntos"; cantidad: number; nivel: number }
  | { tipo: "pacto"; nivel: number }
  | { tipo: "cargasObjeto"; cantidad: number; objetoInstanciaId: string }
  | { tipo: "arcanoMistico"; nivel: number }
  | { tipo: "gratuitoInnato"; hechizoId: string };

export interface LanzamientoPreparado {
  formula: FormulaConstruida;
  gasto: InstruccionGasto;
  activarConcentracion: boolean;
}

/**
 * Valida si una solicitud de lanzamiento de conjuro puede ser ejecutada
 * bajo las reglas oficiales de D&D 5.5e y la disponibilidad de recursos.
 */
export function validarLanzamiento(
  solicitud: SolicitudLanzamiento,
  contexto: ContextoMagicoPersonaje
): ResultadoValidacion {
  // 1. Regla D&D 5.5e: Bloqueo total por vestir armadura o escudo sin competencia
  if (contexto.penalizacionArmadura?.sinCompetencia) {
    const motivos: string[] = [];
    if (contexto.penalizacionArmadura.armaduraNoCompetente) {
      motivos.push(contexto.penalizacionArmadura.armaduraNoCompetente);
    }
    if (contexto.penalizacionArmadura.escudoNoCompetente) {
      motivos.push(contexto.penalizacionArmadura.escudoNoCompetente);
    }
    const motivoTexto = motivos.length > 0 ? motivos.join(" y ") : "equipo sin entrenamiento";
    return {
      permitido: false,
      motivo: `No puedes lanzar conjuros ni rituales mientras vistas ${motivoTexto} sin competencia (Reglas D&D 5.5e).`
    };
  }

  // 2. Validación por modo de lanzamiento
  switch (solicitud.modo) {
    case "objetoMagico": {
      const coste = solicitud.costeCargasObjeto ?? 0;
      const disponibles = contexto.cargasObjetoActuales ?? 0;
      if (coste > 0 && disponibles < coste) {
        return {
          permitido: false,
          motivo: `Cargas insuficientes en ${solicitud.objetoNombre || "el objeto"} (requiere ${coste}, tienes ${disponibles}).`
        };
      }
      break;
    }

    case "arcanoMistico": {
      const nivel = solicitud.nivelLanzamiento ?? solicitud.hechizo.nivel;
      const gastados = contexto.arcanoMisticoGastados ?? [];
      if (gastados.includes(String(nivel))) {
        return {
          permitido: false,
          motivo: `El Arcano Místico de nivel ${nivel} ya ha sido utilizado hoy (recuperable tras descanso largo).`
        };
      }
      break;
    }

    case "espacio":
    case "truco":
    case "ritual":
    case "ataqueMagico":
    default:
      break;
  }

  return { permitido: true };
}

/**
 * Construye la fórmula de dados para un truco según el nivel del personaje.
 */
function construirFormulaTruco(
  hechizo: HechizoBase,
  nivelPersonaje: number,
  bonoAtaqueMagico: number,
  nombrePersonaje: string
): FormulaConstruida {
  return construirFormulaTaleSpireTruco(
    hechizo,
    nivelPersonaje,
    bonoAtaqueMagico,
    nombrePersonaje
  );
}

/**
 * Construye la fórmula de dados para un conjuro lanzado con ranura / upcast.
 */
function construirFormulaEspacio(
  hechizo: HechizoBase,
  nivelLanzamiento: number,
  bonoAtaqueMagico: number,
  nombrePersonaje: string
): FormulaConstruida {
  const nombrePj = nombrePersonaje.trim() || "Personaje";
  const nivelBase = hechizo.nivel;
  const dadosBaseValidos = hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" ? hechizo.dadosDaño.trim() : "";
  const formulaAdicional = hechizo.dadosDañoNivelSuperior?.trim() || "";

  const esEscalable = nivelBase > 0 && !!formulaAdicional && formulaAdicional !== "N/A";
  const formulaFinalDano =
    dadosBaseValidos && nivelLanzamiento > nivelBase && esEscalable
      ? calcularFormulaEscalada(dadosBaseValidos, formulaAdicional, nivelBase, nivelLanzamiento).formula
      : dadosBaseValidos;

  const tipoDanoText = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : "";
  const etiquetaLog = `${nombrePj} - ${hechizo.nombre}${
    nivelLanzamiento > nivelBase ? ` (Nv.${nivelLanzamiento})` : ""
  }${tipoDanoText}`;

  const tieneAtaque =
    hechizo.requiereAtaque === true || hechizo.ataqueCd === "ATAQUE";

  let formulaTaleSpire = "";
  if (tieneAtaque) {
    const bonoSigno = bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : `${bonoAtaqueMagico}`;
    const formulaAtaque = `!Ataque ${sanitizarEtiqueta(hechizo.nombre)}:1d20${bonoSigno}`;
    if (formulaFinalDano) {
      formulaTaleSpire = `${formulaAtaque}/Daño${sanitizarEtiqueta(tipoDanoText)}:${formulaFinalDano}`;
    } else {
      formulaTaleSpire = formulaAtaque;
    }
  } else if (formulaFinalDano) {
    formulaTaleSpire = `!Daño ${sanitizarEtiqueta(hechizo.nombre)}${sanitizarEtiqueta(tipoDanoText)}:${formulaFinalDano}`;
  } else {
    formulaTaleSpire = `!Lanzar Conjuro:${sanitizarEtiqueta(hechizo.nombre)}`;
  }

  return { formulaTaleSpire, etiquetaLog };
}

/**
 * Construye la fórmula de dados para un conjuro lanzado como ritual (+10 min).
 */
function construirFormulaRitual(
  hechizo: HechizoBase,
  bonoAtaqueMagico: number,
  nombrePersonaje: string
): FormulaConstruida {
  const nombrePj = nombrePersonaje.trim() || "Personaje";
  const formulaBase = hechizo.dadosDaño && hechizo.dadosDaño !== "N/A" ? hechizo.dadosDaño.trim() : "";
  const tipoDanoText = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : "";

  const tieneAtaque =
    hechizo.requiereAtaque === true ||
    (!!hechizo.ataqueCd &&
      (hechizo.ataqueCd.toUpperCase().includes("ATAQUE") || hechizo.ataqueCd.toUpperCase().includes("ATTACK")));

  let formulaTaleSpire = "";
  if (tieneAtaque) {
    const bonoSigno = bonoAtaqueMagico >= 0 ? `+${bonoAtaqueMagico}` : `${bonoAtaqueMagico}`;
    const formulaAtaque = `!Ataque ${sanitizarEtiqueta(hechizo.nombre)}:1d20${bonoSigno}`;
    if (formulaBase) {
      formulaTaleSpire = `${formulaAtaque}/Daño${sanitizarEtiqueta(tipoDanoText)}:${formulaBase}`;
    } else {
      formulaTaleSpire = formulaAtaque;
    }
  } else if (formulaBase) {
    formulaTaleSpire = `!Daño Ritual ${sanitizarEtiqueta(hechizo.nombre)}${sanitizarEtiqueta(tipoDanoText)}:${formulaBase}`;
  } else {
    formulaTaleSpire = `!Lanzar Ritual:${sanitizarEtiqueta(hechizo.nombre)} (+10 min)`;
  }

  const etiquetaLog = `${nombrePj} - ${hechizo.nombre} (RITUAL - 10 min)${tipoDanoText}`;
  return { formulaTaleSpire, etiquetaLog };
}

/**
 * Construye la fórmula de dados para un conjuro lanzado desde un objeto mágico.
 */
function construirFormulaObjetoMagico(
  hechizo: HechizoBase,
  objetoNombre?: string,
  bonoAtaqueObjeto?: number,
  cdObjeto?: number
): FormulaConstruida {
  const nombreFuente = objetoNombre ? ` (${objetoNombre})` : "";
  const etiqueta = sanitizarEtiqueta(`Hechizo ${hechizo.nombre}${nombreFuente}`);

  let formulaTaleSpire = "1d20";
  let etiquetaLog = etiqueta;

  if (bonoAtaqueObjeto !== undefined && !isNaN(Number(bonoAtaqueObjeto))) {
    const signo = bonoAtaqueObjeto >= 0 ? "+" : "";
    formulaTaleSpire = `1d20${signo}${bonoAtaqueObjeto}`;
    etiquetaLog = `Ataque Mágico: ${etiqueta}`;
  } else if (cdObjeto !== undefined && !isNaN(Number(cdObjeto))) {
    formulaTaleSpire = "1d20";
    etiquetaLog = `Salvación vs CD ${cdObjeto} (${etiqueta})`;
  }

  return { formulaTaleSpire, etiquetaLog };
}

/**
 * Construye la fórmula de dados para un Arcano Místico de Brujo.
 */
function construirFormulaArcanoMistico(
  hechizo: HechizoBase,
  nivel: number,
  bonoAtaqueMagico: number,
  nombrePersonaje: string
): FormulaConstruida {
  const nombrePj = nombrePersonaje.trim() || "Brujo";
  const tipoDanoText = hechizo.tipoDaño && hechizo.tipoDaño !== "N/A" ? ` (${hechizo.tipoDaño})` : "";
  const etiquetaLog = `${nombrePj} - Arcano Místico Nv.${nivel} (${hechizo.nombre})${tipoDanoText}`;

  let formulaTaleSpire = "";
  if (hechizo.dadosDaño && hechizo.dadosDaño !== "N/A") {
    formulaTaleSpire = `!Daño ${sanitizarEtiqueta(hechizo.nombre)}${sanitizarEtiqueta(tipoDanoText)}:${hechizo.dadosDaño}`;
  } else if (hechizo.requiereAtaque || hechizo.ataqueCd?.toLowerCase().includes("ataque")) {
    const signo = bonoAtaqueMagico >= 0 ? "+" : "";
    formulaTaleSpire = `!Ataque ${sanitizarEtiqueta(hechizo.nombre)}:1d20${signo}${bonoAtaqueMagico}`;
  } else {
    formulaTaleSpire = `!Lanzar Arcano:${sanitizarEtiqueta(hechizo.nombre)}`;
  }

  return { formulaTaleSpire, etiquetaLog };
}

/**
 * Prepara el lanzamiento completo de un conjuro seleccionando la estrategia adecuada,
 * construyendo la fórmula para TaleSpire y calculando las instrucciones de gasto.
 */
export function prepararLanzamiento(
  solicitud: SolicitudLanzamiento,
  contexto: ContextoMagicoPersonaje
): LanzamientoPreparado {
  const nombrePersonaje = solicitud.nombrePersonaje || "Personaje";
  const nivelPersonaje = solicitud.nivelPersonaje || 1;
  const bonoAtaqueMagico = solicitud.bonoAtaqueMagico || 0;
  const nivelLanzamiento = solicitud.nivelLanzamiento ?? solicitud.hechizo.nivel;

  let formula: FormulaConstruida;
  let gasto: InstruccionGasto = { tipo: "ninguno" };

  switch (solicitud.modo) {
    case "truco": {
      formula = construirFormulaTruco(
        solicitud.hechizo,
        nivelPersonaje,
        bonoAtaqueMagico,
        nombrePersonaje
      );
      gasto = { tipo: "ninguno" };
      break;
    }

    case "ritual": {
      formula = construirFormulaRitual(
        solicitud.hechizo,
        bonoAtaqueMagico,
        nombrePersonaje
      );
      gasto = { tipo: "ninguno" };
      break;
    }

    case "objetoMagico": {
      formula = construirFormulaObjetoMagico(
        solicitud.hechizo,
        solicitud.objetoNombre,
        solicitud.bonoAtaqueObjeto,
        solicitud.cdObjeto
      );
      const coste = solicitud.costeCargasObjeto ?? 0;
      if (coste > 0 && solicitud.objetoInstanciaId) {
        gasto = {
          tipo: "cargasObjeto",
          cantidad: coste,
          objetoInstanciaId: solicitud.objetoInstanciaId
        };
      }
      break;
    }

    case "arcanoMistico": {
      formula = construirFormulaArcanoMistico(
        solicitud.hechizo,
        nivelLanzamiento,
        bonoAtaqueMagico,
        nombrePersonaje
      );
      gasto = {
        tipo: "arcanoMistico",
        nivel: nivelLanzamiento
      };
      break;
    }

    case "gratuitoInnato": {
      formula = construirFormulaEspacio(
        solicitud.hechizo,
        nivelLanzamiento,
        bonoAtaqueMagico,
        nombrePersonaje
      );
      gasto = {
        tipo: "gratuitoInnato",
        hechizoId: solicitud.hechizo.id
      };
      break;
    }

    case "ataqueMagico": {
      const signo = bonoAtaqueMagico >= 0 ? "+" : "";
      formula = {
        formulaTaleSpire: `!Ataque de Conjuro:1d20${signo}${bonoAtaqueMagico}`,
        etiquetaLog: `${nombrePersonaje} - Ataque Mágico`
      };
      gasto = { tipo: "ninguno" };
      break;
    }

    case "espacio":
    default: {
      if (solicitud.hechizo.nivel === 0) {
        formula = construirFormulaTruco(
          solicitud.hechizo,
          nivelPersonaje,
          bonoAtaqueMagico,
          nombrePersonaje
        );
        gasto = { tipo: "ninguno" };
      } else {
        formula = construirFormulaEspacio(
          solicitud.hechizo,
          nivelLanzamiento,
          bonoAtaqueMagico,
          nombrePersonaje
        );

        // Si el conjuro es gratuito por un rasgo activo (ej. Manto de Majestad / Orden imperiosa)
        const esGratis =
          contexto.esLanzamientoGratuito ||
          (contexto.conjurosGratuitosActivos || []).some(
            (c) => c.toLowerCase().trim() === solicitud.hechizo.nombre.toLowerCase().trim()
          );

        if (esGratis) {
          gasto = { tipo: "ninguno" };
        } else {
          // Determinar qué recurso se gasta delegando a la lógica multiclase / pacto
          let tipoGastoDetectado: InstruccionGasto = { tipo: "ninguno" };
          gastarRecursoLanzamientoConjuro({
            nivelLanzamiento,
            esLanzadorPacto: contexto.esLanzadorPacto,
            nivelEspacioPacto: contexto.nivelEspacioPacto,
            espaciosPactoMaximos: contexto.espaciosPactoMaximos,
            espaciosPactoGastados: contexto.espaciosPactoGastados,
            espaciosConjuroMaximos: contexto.espaciosConjuroMaximos,
            sistemaMagia: contexto.sistemaMagia,
            costePuntosPorNivel: contexto.costePuntosPorNivel,
            alGastarEspacio: (niv) => {
              tipoGastoDetectado = { tipo: "espacio", nivel: niv };
            },
            alGastarPuntos: (cant) => {
              tipoGastoDetectado = { tipo: "puntos", cantidad: cant, nivel: nivelLanzamiento };
            },
            alGastarEspacioPacto: () => {
              tipoGastoDetectado = { tipo: "pacto", nivel: contexto.nivelEspacioPacto || nivelLanzamiento };
            }
          });
          gasto = tipoGastoDetectado;
        }
      }
      break;
    }
  }

  // Activar concentración si el hechizo lo requiere (aplica a todos los modos con concentración)
  const activarConcentracion = Boolean(solicitud.hechizo.concentracion);

  return {
    formula,
    gasto,
    activarConcentracion
  };
}
