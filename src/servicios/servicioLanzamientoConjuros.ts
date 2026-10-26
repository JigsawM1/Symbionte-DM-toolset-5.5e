import { aplicarModificadoresInvocacionesAHechizo } from "./rasgos/evaluadorCombateRasgos";
import { formulaCuracionConjuro, nivelEspacioGastado } from "./rasgos/curacionDeclarativa";
import { obtenerAtaquePosterior } from "./rasgos/conjurosTemporalesRasgos";
import { obtenerConcesionConRecurso, obtenerVarianteConjuro } from "./rasgos/lanzamientoRecursoRasgos";
import { normalizar } from "./rasgos/utilidadesRasgos";
import { obtenerMaximosEspaciosEfectivos } from "./rasgos/conversionRecursosRasgos";
import { resolverClaseLanzamiento, obtenerModificadoresConjuroRasgos } from "./rasgos/modificadoresConjuroRasgos";
import { clasesPropietariasConjuro } from "./rasgos/listasConjurosRasgos";
import { obtenerLanzamientoEstado } from "./rasgos/lanzamientoEstadoRasgo";
import { evaluarEfectosCondicionesEnTirada } from "./procesadorCondiciones";
/**
 * Servicio Centralizado de Lanzamiento de Conjuros (D&D 5.5e 2024)
 * Patrón Facade + Strategy
 * 
 * Centraliza la validación, construcción de fórmulas TaleSpire,
 * deducción de recursos mágicos y gestión de concentración.
 */

import type { HechizoBase } from "@/tipos";
import type { PersonajeJugador } from '@/tipos';
import { consumirRecursoConjuro } from './consumidorRecursosConjuros';
import { obtenerSelectoresArcanos } from "./rasgos/arcanosMisticosRasgos";
import { coincideHechizoId } from "./comparadorHechizos";
import { tieneRestriccionRasgos } from "./rasgos/restriccionesRasgos";
import { puedeLanzarConjuroEnFormaSalvaje } from "./reglasFormaSalvaje";
import { obtenerConcesionRitual } from "./rasgos/conjurosRitualesRasgos";
import type { PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  sanitizarEtiqueta
} from "@/utiles/lanzadorDados";
import {
  construirFormulaTaleSpireTruco,
  construirFormulaTaleSpireEspacio
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
  | "ataqueMagico"
  | "recursoRasgo"
  | "estadoRasgo"
  | "continuarConjuro";

export interface SolicitudLanzamiento {
  curacionEnTurno?: boolean;
  sinConcentracion?: boolean;
  claseLanzamiento?: string;
  idRasgoOrigen?: string;
  modo: ModoLanzamiento;
  hechizo: HechizoBase;
  nivelLanzamiento?: number;
  nivelPersonaje?: number;
  nombrePersonaje?: string;
  bonoAtaqueMagico?: number;
  bonoDanoMagico?: number;
  modificadorHabilidad?: number;
  objetoNombre?: string;
  objetoInstanciaId?: string;
  bonoAtaqueObjeto?: number;
  cdObjeto?: number;
  cdSalvacionPersonaje?: number;
  costeCargasObjeto?: number;
}

export interface ContextoMagicoPersonaje {
  personajeActual?: PersonajeJugador;
  espaciosConjuroGastados?: Record<string, number>;
  puntosConjuroDisponibles?: number;
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

export type InstruccionGasto = (
  | { tipo: "estadoRasgo"; idRasgo: string; hechizo: HechizoBase; nivel: number; ronda?: number }
  | { tipo: "recursoRasgo"; idRasgo: string; hechizo: HechizoBase; nivel: number }
  | { tipo: "ninguno" }
  | { tipo: "espacio"; nivel: number }
  | { tipo: "puntos"; cantidad: number; nivel: number }
  | { tipo: "pacto"; nivel: number }
  | { tipo: "cargasObjeto"; cantidad: number; objetoInstanciaId: string }
  | { tipo: "arcanoMistico"; nivel: number }
  | { tipo: "gratuitoInnato"; hechizoId: string }) & { conjuroCuracion?: HechizoBase; aptitudCuracion?: number; conjuroId?: string; ronda?: number };

export interface LanzamientoPreparado {
  cdSalvacion?: number;
  claseLanzamiento?: string;
  tipoTirada?: "ventaja" | "desventaja" | "plano";
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
  contexto: ContextoMagicoPersonaje,
  preparadoPrecalculado?: LanzamientoPreparado
): ResultadoValidacion {
  if (solicitud.modo === "continuarConjuro") {
    const origen = contexto.personajeActual && obtenerAtaquePosterior(contexto.personajeActual, solicitud.idRasgoOrigen, solicitud.hechizo);
    if (!origen || (solicitud.nivelLanzamiento !== undefined && solicitud.nivelLanzamiento !== solicitud.hechizo.nivel)
      || (solicitud.claseLanzamiento && normalizar(solicitud.claseLanzamiento) !== normalizar(origen.claseConjurosOtorgados)))
      return { permitido: false, motivo: "El conjuro no está activo con esta procedencia y nivel." };
  }
  if (solicitud.modo === "estadoRasgo") {
    const r = contexto.personajeActual && obtenerLanzamientoEstado(contexto.personajeActual, solicitud.idRasgoOrigen ?? "", solicitud.hechizo, solicitud.nivelLanzamiento);
    if (!r || (solicitud.claseLanzamiento && normalizar(r.claseConjurosOtorgados) !== normalizar(solicitud.claseLanzamiento))) return { permitido: false, motivo: "Esta alternativa no está disponible o no conserva su concentración." };
  }
  if (contexto.personajeActual && solicitud.claseLanzamiento && ["espacio", "truco", "ataqueMagico", "ritual"].includes(solicitud.modo)
    && clasesPropietariasConjuro(contexto.personajeActual, solicitud.hechizo.id).length
    && !resolverClaseLanzamiento(contexto.personajeActual, solicitud.hechizo, solicitud.claseLanzamiento))
    return { permitido: false, motivo: "Este conjuro no está disponible para la clase de lanzamiento elegida." };
  if (contexto.personajeActual && solicitud.claseLanzamiento && solicitud.modo !== "objetoMagico" && solicitud.modo !== "gratuitoInnato"
    && !contexto.personajeActual.clasesLanzadoras.some(c => normalizar(c.clase) === normalizar(solicitud.claseLanzamiento)))
    return { permitido: false, motivo: "La clase de lanzamiento seleccionada no está disponible." };
  if (contexto.personajeActual && tieneRestriccionRasgos(contexto.personajeActual, "conjuros")) {
    return { permitido: false, motivo: "Un rasgo activo impide lanzar conjuros." };
  }
  if (contexto.personajeActual && !puedeLanzarConjuroEnFormaSalvaje(contexto.personajeActual, solicitud.hechizo.nombre)) {
    return { permitido: false, motivo: "No puedes lanzar este conjuro mientras estás en Forma salvaje (PHB 2024)." };
  }
  if (solicitud.sinConcentracion && (!contexto.personajeActual || !obtenerVarianteConjuro(contexto.personajeActual, solicitud.hechizo)))
    return { permitido: false, motivo: "Esta variante de lanzamiento no está disponible." };
  if (solicitud.modo === "recursoRasgo" && (!contexto.personajeActual || !obtenerConcesionConRecurso(contexto.personajeActual, solicitud.idRasgoOrigen, solicitud.hechizo, solicitud.nivelLanzamiento)))
    return { permitido: false, motivo: "El conjuro no pertenece a esta concesión o el nivel no es válido." };
  if (solicitud.modo === "recursoRasgo" && contexto.personajeActual && solicitud.claseLanzamiento) {
    const origen = obtenerConcesionConRecurso(contexto.personajeActual, solicitud.idRasgoOrigen, solicitud.hechizo, solicitud.nivelLanzamiento);
    if (origen?.clase && normalizar(origen.clase) !== normalizar(solicitud.claseLanzamiento))
      return { permitido: false, motivo: "La procedencia del conjuro la determina su concesión." };
  }
  if (solicitud.idRasgoOrigen && solicitud.modo !== "recursoRasgo" && solicitud.modo !== "estadoRasgo" && solicitud.modo !== "continuarConjuro" && (!contexto.personajeActual || solicitud.modo !== "ritual" || !solicitud.hechizo.ritual
    || !obtenerConcesionRitual(contexto.personajeActual, solicitud.idRasgoOrigen, solicitud.hechizo.id)))
    return { permitido: false, motivo: "Esta concesión solo permite sus rituales adquiridos." };
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
      let disponibles = contexto.cargasObjetoActuales;
      if (disponibles === undefined && contexto.personajeActual && solicitud.objetoInstanciaId) {
        const obj = (contexto.personajeActual.inventario || []).find(o => o.idInstancia === solicitud.objetoInstanciaId);
        if (obj) {
          disponibles = obj.cargasActuales ?? obj.cargasMaximas ?? 0;
        }
      }
      const disponiblesNum = disponibles ?? 0;
      if (coste > 0 && disponiblesNum < coste) {
        return {
          permitido: false,
          motivo: `Cargas insuficientes en ${solicitud.objetoNombre || "el objeto"} (requiere ${coste}, tienes ${disponiblesNum}).`
        };
      }
      break;
    }

    case "arcanoMistico": {
      const nivel = solicitud.nivelLanzamiento ?? solicitud.hechizo.nivel;
      const pj = contexto.personajeActual;
      if (pj && obtenerSelectoresArcanos(pj).length && !obtenerSelectoresArcanos(pj,true).some(s =>
        s.nivelConjuro === nivel && s.valorActual.some(id => coincideHechizoId(id,solicitud.hechizo.id)))) {
        return { permitido:false, motivo:"Este conjuro no corresponde a un arcano adquirido y elegido." };
      }
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

  if (contexto.personajeActual) {
    const gasto = preparadoPrecalculado?.gasto ?? prepararLanzamiento(solicitud, contexto).gasto;
    const resultado = consumirRecursoConjuro(contexto.personajeActual, gasto);
    if (!resultado.permitido) return resultado;
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
  nombrePersonaje: string,
  bonoDanoMagico: number = 0,
  modificadorHabilidad: number = 0
): FormulaConstruida {
  return construirFormulaTaleSpireTruco(
    hechizo,
    nivelPersonaje,
    bonoAtaqueMagico,
    nombrePersonaje,
    bonoDanoMagico,
    modificadorHabilidad
  );
}

/**
 * Construye la fórmula de dados para un conjuro lanzado con ranura / upcast.
 */
function construirFormulaEspacio(
  hechizo: HechizoBase,
  nivelLanzamiento: number,
  bonoAtaqueMagico: number,
  nombrePersonaje: string,
  bonoDanoMagico: number = 0,
  modificadorHabilidad: number = 0
): FormulaConstruida {
  return construirFormulaTaleSpireEspacio(
    hechizo,
    nivelLanzamiento,
    bonoAtaqueMagico,
    nombrePersonaje,
    bonoDanoMagico,
    modificadorHabilidad
  );
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
 * Si el objeto no especifica CD o bono de ataque, se adoptan los del jugador.
 * Si el conjuro cuenta con dados de daño o requiere tirada de ataque, se construye
 * la fórmula completa de TaleSpire.
 */
function construirFormulaObjetoMagico(
  hechizo: HechizoBase,
  objetoNombre?: string,
  bonoAtaqueObjeto?: number,
  cdObjeto?: number,
  bonoAtaqueJugador: number = 0,
  cdSalvacionJugador?: number,
  nombrePersonaje: string = "Personaje",
  nivelLanzamiento: number = 1
): FormulaConstruida {
  const nombreFuente = objetoNombre ? ` (${objetoNombre})` : "";
  const etiqueta = sanitizarEtiqueta(`Hechizo ${hechizo.nombre}${nombreFuente}`);

  const bonoAtaqueFinal =
    bonoAtaqueObjeto !== undefined && !isNaN(Number(bonoAtaqueObjeto))
      ? bonoAtaqueObjeto
      : bonoAtaqueJugador;

  const cdFinal =
    cdObjeto !== undefined && !isNaN(Number(cdObjeto))
      ? cdObjeto
      : cdSalvacionJugador;

  const tieneDadosDano = Boolean(hechizo.dadosDaño && hechizo.dadosDaño !== "N/A");
  const tieneAtaque =
    hechizo.requiereAtaque === true ||
    (!!hechizo.ataqueCd &&
      (hechizo.ataqueCd.toUpperCase().includes("ATAQUE") || hechizo.ataqueCd.toUpperCase().includes("ATTACK")));

  if (tieneDadosDano || tieneAtaque) {
    const resBase = construirFormulaTaleSpireEspacio(
      hechizo,
      nivelLanzamiento,
      bonoAtaqueFinal,
      nombrePersonaje
    );
    const etiquetaCd = cdFinal !== undefined ? ` [CD ${cdFinal}]` : "";
    return {
      formulaTaleSpire: resBase.formulaTaleSpire,
      etiquetaLog: `${resBase.etiquetaLog}${nombreFuente}${etiquetaCd}`
    };
  }

  let formulaTaleSpire = "1d20";
  let etiquetaLog = etiqueta;

  if (bonoAtaqueFinal !== undefined && !isNaN(Number(bonoAtaqueFinal))) {
    const signo = bonoAtaqueFinal >= 0 ? "+" : "";
    formulaTaleSpire = `1d20${signo}${bonoAtaqueFinal}`;
    etiquetaLog = `Ataque Mágico: ${etiqueta}`;
  } else if (cdFinal !== undefined && !isNaN(Number(cdFinal))) {
    formulaTaleSpire = "1d20";
    etiquetaLog = `Salvación vs CD ${cdFinal} (${etiqueta})`;
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
  const pj = contexto.personajeActual;
  if (pj) contexto = { ...contexto, espaciosConjuroMaximos: obtenerMaximosEspaciosEfectivos(pj) };
  const claseConcedida = pj && solicitud.modo === "recursoRasgo"
    ? obtenerConcesionConRecurso(pj, solicitud.idRasgoOrigen, solicitud.hechizo, solicitud.nivelLanzamiento)?.clase : undefined;
  const clase = pj && (!solicitud.idRasgoOrigen || solicitud.modo === "recursoRasgo") && solicitud.modo !== "objetoMagico" && solicitud.modo !== "gratuitoInnato"
    ? claseConcedida ?? resolverClaseLanzamiento(pj, solicitud.hechizo, solicitud.claseLanzamiento) : undefined;
  if (pj) solicitud = { ...solicitud, hechizo: aplicarModificadoresInvocacionesAHechizo(solicitud.hechizo, pj, clase) };
  const modificadoresRasgo = pj ? obtenerModificadoresConjuroRasgos(pj, clase) : { bonoCD: 0, ventaja: false };
  const nombrePersonaje = solicitud.nombrePersonaje || "Personaje";
  const nivelPersonaje = solicitud.nivelPersonaje || 1;
  const bonoAtaqueMagico = solicitud.bonoAtaqueMagico || 0;
  const bonoDanoMagico = solicitud.bonoDanoMagico || 0;
  const modificadorHabilidad = solicitud.modificadorHabilidad || 0;
  const nivelLanzamiento = solicitud.nivelLanzamiento ?? solicitud.hechizo.nivel;

  let formula: FormulaConstruida;
  let gasto: InstruccionGasto = { tipo: "ninguno" };

  switch (solicitud.modo) {
    case "truco": {
      formula = construirFormulaTruco(
        solicitud.hechizo,
        nivelPersonaje,
        bonoAtaqueMagico,
        nombrePersonaje,
        bonoDanoMagico,
        modificadorHabilidad
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
        solicitud.cdObjeto,
        bonoAtaqueMagico,
        solicitud.cdSalvacionPersonaje,
        nombrePersonaje,
        nivelLanzamiento
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

    case "continuarConjuro": {
      formula = construirFormulaEspacio(solicitud.hechizo, solicitud.hechizo.nivel, bonoAtaqueMagico, nombrePersonaje, bonoDanoMagico, modificadorHabilidad);
      gasto = { tipo: "ninguno" };
      break;
    }
    case "estadoRasgo": {
      formula = construirFormulaEspacio(solicitud.hechizo, nivelLanzamiento, bonoAtaqueMagico, nombrePersonaje, bonoDanoMagico, modificadorHabilidad);
      formula = { ...formula, etiquetaLog: `${formula.etiquetaLog} · Acción adicional` };
      gasto = { tipo: "estadoRasgo", idRasgo: solicitud.idRasgoOrigen ?? "", hechizo: solicitud.hechizo, nivel: nivelLanzamiento };
      break;
    }
    case "recursoRasgo": {
      formula = nivelLanzamiento === 0 ? construirFormulaTruco(solicitud.hechizo, nivelPersonaje, bonoAtaqueMagico, nombrePersonaje, bonoDanoMagico, modificadorHabilidad)
        : construirFormulaEspacio(solicitud.hechizo, nivelLanzamiento, bonoAtaqueMagico, nombrePersonaje, bonoDanoMagico, modificadorHabilidad);
      gasto = { tipo: "recursoRasgo", idRasgo: solicitud.idRasgoOrigen ?? "", hechizo: solicitud.hechizo, nivel: nivelLanzamiento };
      break;
    }
    case "gratuitoInnato": {
      formula = construirFormulaEspacio(
        solicitud.hechizo,
        nivelLanzamiento,
        bonoAtaqueMagico,
        nombrePersonaje,
        bonoDanoMagico,
        modificadorHabilidad
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
          nombrePersonaje,
          bonoDanoMagico,
          modificadorHabilidad
        );
        gasto = { tipo: "ninguno" };
      } else {
        formula = construirFormulaEspacio(
          solicitud.hechizo,
          nivelLanzamiento,
          bonoAtaqueMagico,
          nombrePersonaje,
          bonoDanoMagico,
          modificadorHabilidad
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

  const cdSalvacion = solicitud.cdSalvacionPersonaje === undefined ? undefined : solicitud.cdSalvacionPersonaje + modificadoresRasgo.bonoCD;
  if (modificadoresRasgo.bonoCD && cdSalvacion !== undefined && solicitud.hechizo.ataqueCd === "CD") {
    formula = { ...formula, etiquetaLog: `${formula.etiquetaLog} · CD ${cdSalvacion}`,
      formulaTaleSpire: formula.formulaTaleSpire.replace(/^!([^:]+):/, `!$1 (CD ${cdSalvacion}):`) };
  }

  // Activar concentración si el hechizo lo requiere (aplica a todos los modos con concentración)
  const concesionRecurso = pj && solicitud.modo === "recursoRasgo"
    ? obtenerConcesionConRecurso(pj, solicitud.idRasgoOrigen, solicitud.hechizo, nivelLanzamiento) : undefined;
  const activarConcentracion = Boolean(solicitud.hechizo.concentracion) && !solicitud.sinConcentracion
    && !concesionRecurso?.rasgo.lanzamientoConRecurso?.sinConcentracion && solicitud.modo !== "continuarConjuro";
  if (solicitud.sinConcentracion) formula = { ...formula, etiquetaLog: `${formula.etiquetaLog} · Sin concentración · 1 minuto` };
  const nivelEspacio = nivelEspacioGastado(gasto);
  if (solicitud.hechizo.curacion && solicitud.modo !== "ataqueMagico") {
    gasto = { ...gasto, conjuroCuracion: solicitud.hechizo, aptitudCuracion: modificadorHabilidad };
    const curacion = formulaCuracionConjuro(pj, solicitud.hechizo, nivelEspacio ?? nivelLanzamiento, modificadorHabilidad, nivelEspacio, solicitud.curacionEnTurno);
    if (curacion && solicitud.hechizo.curacion.tipo === "directa") formula = {
      formulaTaleSpire: `!Curación ${sanitizarEtiqueta(solicitud.hechizo.nombre)}:${curacion}`,
      etiquetaLog: `${nombrePersonaje} - ${solicitud.hechizo.nombre} · Curación`
    };
  }

  if (solicitud.modo !== "continuarConjuro" && solicitud.modo !== "ataqueMagico"
    && (concesionRecurso?.rasgo.lanzamientoConRecurso?.duracionRondas || pj?.rasgos.some(r => r.conjurosTemporales?.some(e => e.conjuroId === solicitud.hechizo.id))))
    gasto = { ...gasto, conjuroId: solicitud.hechizo.id };
  return {
    formula,
    gasto,
    claseLanzamiento: clase,
    cdSalvacion,
    tipoTirada: pj && /(?:^|[:/])(?:[^:/]*:)?1d20/.test(formula.formulaTaleSpire)
      ? (() => {
          const evaluacion = evaluarEfectosCondicionesEnTirada({ tipo: "ataque", personaje: pj,
            condicionesActivas: pj.condicionesActivas, esAtaqueMagico: true, claseConjuro: clase });
          return evaluacion.tieneVentaja || evaluacion.tieneDesventaja ? evaluacion.modoEfectivo : undefined;
        })() : undefined,
    activarConcentracion
  };
}
