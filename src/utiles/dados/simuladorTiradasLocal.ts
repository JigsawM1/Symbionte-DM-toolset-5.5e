import { evaluarFormulaDados } from "@/servicios/procesadorConsumibles";
import { logger } from "@/utiles/logger";
import type {
  GrupoTiradaSolicitud,
  MetadataDadoGolpe,
  MetadataEspecialRasgo,
  MetadataIniciativa,
  MetadataSalvacionMuerte,
  ModoTiradaD20,
  PuertoEfectosTiradaEstado,
  ResultadoSolicitudTirada
} from "./tiposDados";

const REGEX_GRUPO_SOLICITUD = /^(\d+)d(\d+)$/i;
const REGEX_ETIQUETA_GRUPO = /^!?(.+):([^:]+)$/;
const REGEX_DADOS_KEEP = /^(\d+)d(\d+)k([hl])(\d+)(?:([+-])(\d+))?$/i;
const REGEX_DADOS_SIMPLES = /^(\d+)d(\d+)(?:([+-])(\d+))?$/;
const REGEX_TERMINO_INICIATIVA = /[+-]?(?:\d+d\d+|\d+)/gi;
const REGEX_SUFIJO_D20 = /d20$/i;
const REGEX_PRIMER_DADO = /(\d+)d(\d+)/i;
const REGEX_BONO_CONSTANTE = /([+-]\s*\d+)/;
const REGEX_PRIMER_ENTERO = /\b\d+\b/;

export interface ParametrosFallbackEfectos {
  formula: string;
  formulaLimpia: string;
  tipoTirada: ModoTiradaD20;
  metaIniciativa?: MetadataIniciativa;
  metaSalvacionMuerte?: MetadataSalvacionMuerte;
  metaEspecialRasgo?: MetadataEspecialRasgo;
  metaDadoGolpe?: MetadataDadoGolpe;
}

/**
 * Resuelve localmente una solicitud estructurada con generador de azar configurable
 * cuando TaleSpire no está conectado.
 */
export function resolverSolicitudLocal(
  etiqueta: string,
  grupos: GrupoTiradaSolicitud[],
  azarLocal?: () => number
): ResultadoSolicitudTirada {
  logger.debug(`[Lanzador Dados] TaleSpire no disponible. Resolviendo tirada local para "${etiqueta}".`);
  const rng = azarLocal ?? Math.random;
  const totales: number[] = [];

  for (const grupo of grupos) {
    const match = grupo.formula.trim().match(REGEX_GRUPO_SOLICITUD);
    if (match) {
      const cantidad = parseInt(match[1], 10);
      const caras = parseInt(match[2], 10);
      let subtotal = 0;
      for (let i = 0; i < cantidad; i++) {
        subtotal += 1 + Math.floor(rng() * caras);
      }
      totales.push(subtotal);
    } else {
      totales.push(evaluarFormulaDados(grupo.formula));
    }
  }

  return {
    rollId: `local_${Date.now()}_${Math.floor(rng() * 10000)}`,
    origen: "local",
    totales
  };
}

/**
 * Simula e imprime por logger el desglose matemático de una tirada en modo desarrollo local.
 */
export function ejecutarTiradaFallbackLocal(formula: string, etiquetaGlobal: string): void {
  try {
    const grupos = formula.split("/");
    const etiquetaGlobalLower = etiquetaGlobal.toLowerCase();
    logger.debug(`[TIRADA LOCAL MOCK] ${etiquetaGlobal.toUpperCase()}`);

    grupos.forEach((grupo, idx) => {
      let formulaDados = grupo;
      let etiquetaGrupo = `Grupo ${idx + 1}`;

      const matchEtiqueta = grupo.match(REGEX_ETIQUETA_GRUPO);
      if (matchEtiqueta) {
        etiquetaGrupo = matchEtiqueta[1];
        formulaDados = matchEtiqueta[2];
      }

      const matchKhKl = formulaDados.match(REGEX_DADOS_KEEP);
      const match = matchKhKl || formulaDados.match(REGEX_DADOS_SIMPLES);
      if (!match) {
        logger.debug(`  ↳ ${etiquetaGrupo}: Tirada simulada (Fórmula: ${formulaDados})`);
        return;
      }

      const cantidad = parseInt(match[1], 10);
      const caras = parseInt(match[2], 10);
      const esKhKl = Boolean(matchKhKl);
      const tipoKeep = esKhKl ? match[3].toLowerCase() : null;
      const signo = esKhKl ? match[5] || "+" : match[3] || "+";
      const modStr = esKhKl ? match[6] : match[4];
      const modificador = modStr ? parseInt(modStr, 10) : 0;

      const tiradas: number[] = [];
      let valorDadosFinal = 0;

      if (caras === 20 && cantidad === 2) {
        const d1 = Math.floor(Math.random() * 20) + 1;
        const d2 = Math.floor(Math.random() * 20) + 1;
        tiradas.push(d1, d2);
        const etiquetaGrupoLower = etiquetaGrupo.toLowerCase();
        if (esKhKl) {
          valorDadosFinal = tipoKeep === "h" ? Math.max(d1, d2) : Math.min(d1, d2);
        } else if (etiquetaGrupoLower.includes("ventaja") || etiquetaGlobalLower.includes("ventaja")) {
          valorDadosFinal = Math.max(d1, d2);
        } else if (
          etiquetaGrupoLower.includes("desventaja") ||
          etiquetaGlobalLower.includes("desventaja")
        ) {
          valorDadosFinal = Math.min(d1, d2);
        } else {
          valorDadosFinal = d1;
        }
      } else {
        for (let i = 0; i < cantidad; i++) {
          const resultadoDado = Math.floor(Math.random() * caras) + 1;
          tiradas.push(resultadoDado);
          valorDadosFinal += resultadoDado;
        }
      }

      const total = valorDadosFinal + (signo === "-" ? -modificador : modificador);
      const desglose =
        caras === 20 && cantidad === 2
          ? `Elegido ${valorDadosFinal} (Descartado ${tiradas[0] === valorDadosFinal ? tiradas[1] : tiradas[0]})${modificador !== 0 ? ` ${signo} ${modificador}` : ""}`
          : `[${tiradas.join(" + ")}]${modificador !== 0 ? ` ${signo} ${modificador}` : ""}`;
      logger.debug(`  ↳ ${etiquetaGrupo}: ${total} (${desglose})`);
    });
  } catch (err) {
    logger.error("[Lanzador Dados] Fallo al calcular tirada local:", err);
  }
}

/**
 * Aplica los efectos automáticos sobre estado en entorno local sin TaleSpire.
 */
export function ejecutarEfectosFallbackLocal(
  params: ParametrosFallbackEfectos,
  puertoEfectos: PuertoEfectosTiradaEstado
): void {
  const { formula, formulaLimpia, tipoTirada, metaIniciativa, metaSalvacionMuerte, metaEspecialRasgo, metaDadoGolpe } =
    params;

  if (metaSalvacionMuerte) {
    let d20 = Math.floor(Math.random() * 20) + 1;
    if (tipoTirada !== "plano") {
      const d20Extra = Math.floor(Math.random() * 20) + 1;
      d20 = tipoTirada === "ventaja" ? Math.max(d20, d20Extra) : Math.min(d20, d20Extra);
    }
    puertoEfectos.aplicarResultadoSalvacionMuerte(metaSalvacionMuerte.personajeId, d20);
  }

  if (metaIniciativa) {
    const formulaIniciativa = formula.split("/")[0].split(":").at(-1) ?? "1d20";
    const terminos = formulaIniciativa.replace(/\s/g, "").match(REGEX_TERMINO_INICIATIVA) ?? [];
    const totalInic = terminos.reduce((total, termino) => {
      const signo = termino.startsWith("-") ? -1 : 1;
      if (!termino.includes("d")) return total + Number(termino);
      let valor = evaluarFormulaDados(termino.replace(/^[+-]/, ""));
      if (REGEX_SUFIJO_D20.test(termino) && tipoTirada !== "plano") {
        const segundo = evaluarFormulaDados("1d20");
        valor = tipoTirada === "ventaja" ? Math.max(valor, segundo) : Math.min(valor, segundo);
      }
      return total + signo * valor;
    }, 0);
    puertoEfectos.aplicarResultadoIniciativa(metaIniciativa, totalInic);
  }

  if (metaEspecialRasgo) {
    const matchDados = formulaLimpia.match(REGEX_PRIMER_DADO);
    let totalDado = 0;
    if (matchDados) {
      const numDados = parseInt(matchDados[1], 10);
      const caraDado = parseInt(matchDados[2], 10);
      for (let i = 0; i < numDados; i++) {
        totalDado += Math.floor(Math.random() * caraDado) + 1;
      }
      const matchBono = formulaLimpia.replace(REGEX_PRIMER_DADO, "").trim().match(REGEX_BONO_CONSTANTE);
      if (matchBono) {
        const bonoConstante = parseInt(matchBono[1].replace(/\s+/g, ""), 10) || 0;
        totalDado = Math.max(1, totalDado + bonoConstante);
      }
    } else {
      const matchNum = formulaLimpia.match(REGEX_PRIMER_ENTERO);
      totalDado = matchNum ? parseInt(matchNum[0], 10) : 0;
    }

    if (metaEspecialRasgo.tipo === "curacionRasgo") {
      puertoEfectos.aplicarCuracionDirectaRasgo(metaEspecialRasgo.personajeId, totalDado);
      logger.info(`[Lanzador Dados Fallback] Curación de rasgo aplicada: +${totalDado} PV.`);
    } else {
      const mult = metaEspecialRasgo.multiplicador ?? 1;
      const hpTemp = totalDado * mult;
      puertoEfectos.aplicarResultadoHpTemporal(metaEspecialRasgo.personajeId, hpTemp);
      logger.info(
        `[Lanzador Dados Fallback] HP temporal de rasgo aplicado: +${hpTemp} PV temp (${totalDado} x ${mult}).`
      );
    }
  }

  if (metaDadoGolpe) {
    const matchDados = formulaLimpia.match(REGEX_PRIMER_DADO);
    const caras = matchDados ? parseInt(matchDados[2], 10) : 8;
    const totalDado = Math.floor(Math.random() * caras) + 1;
    puertoEfectos.gastarDadoGolpeYNotificar(metaDadoGolpe.personajeId, totalDado);
    logger.info(`[Lanzador Dados Fallback] Dado de Golpe gastado. Resultado: ${totalDado}.`);
  }
}
