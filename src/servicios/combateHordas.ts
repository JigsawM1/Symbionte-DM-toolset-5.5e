/**
 * combateHordas.ts - Motor puro de reglas de Combate por Hordas (Mob Combat D&D 5.5e)
 * y gestión de múltiples barras de vida individuales dentro de una misma ficha de iniciativa.
 */

import type { BarraVidaHorda, CriaturaIniciativa, ModoDanoHorda, ResumenHorda } from "@/almacen/usarAlmacenDM";
import { generarId } from "@/utiles/generarId";

/** Expresión regular hoisted para descomponer términos de fórmulas de dados (ej: "+2d6", "-1d4", "+3"). */
const REGEX_TERMINO_DANO = /([+-]?\d+)d(\d+)|([+-]?\d+)/gi;

export interface ResultadoAtaqueHorda {
  d20Necesario: number;
  criaturasPorImpacto: number;
  miembrosVivos: number;
  ataquesPorMiembro: number;
  totalAtaques: number;
  impactosTotales: number;
  formulaDanoEscalada: string;
  danoPromedioPorImpacto: number;
  danoPromedioTotal: number;
  imposibleImpactar: boolean;
}

export interface DetalleSalvacionHorda {
  afectados: number;
  exitos: number;
  fallos: number;
  criaturasPorExito: number;
  d20Necesario: number;
  danoPorFallo: number;
  danoPorExito: number;
  danoTotalAplicado: number;
}

/** Determina si una criatura en iniciativa opera activamente como una Horda (2 o más barras). */
export function esCriaturaHorda(criatura?: Pick<CriaturaIniciativa, "barrasVida" | "resumenHorda"> | null): boolean {
  if (!criatura) return false;
  return Boolean((criatura.barrasVida && criatura.barrasVida.length > 1) || (criatura.resumenHorda && criatura.resumenHorda.totales > 1));
}

/** Obtiene el resumen de miembros vivos y totales de una horda. */
export function obtenerResumenHorda(criatura?: Pick<CriaturaIniciativa, "barrasVida" | "resumenHorda"> | null): ResumenHorda | null {
  if (!criatura) return null;
  if (criatura.barrasVida && criatura.barrasVida.length > 1) {
    return { vivos: criatura.barrasVida.filter((b) => b.vidaActual > 0).length, totales: criatura.barrasVida.length };
  }
  return criatura.resumenHorda && criatura.resumenHorda.totales > 1 ? criatura.resumenHorda : null;
}

/** Tabla canónica de Combate por Hordas (DMG D&D 5e / 5.5e). */
export function obtenerCriaturasNecesariasPorExito(d20Necesario: number): number {
  if (d20Necesario <= 5) return 1;
  if (d20Necesario <= 12) return 2;
  if (d20Necesario <= 14) return 3;
  if (d20Necesario <= 16) return 4;
  if (d20Necesario <= 18) return 5;
  if (d20Necesario === 19) return 10;
  if (d20Necesario === 20) return 20;
  return Number.POSITIVE_INFINITY;
}

/** Escala una fórmula de daño (ej. "2d6+3") por el número de impactos y calcula su promedio. */
export function escalarFormulaDano(
  formulaBase: string,
  impactos: number
): { formulaEscalada: string; promedioPorImpacto: number; promedioTotal: number } {
  const limpia = (formulaBase || "1d4").trim().replace(/\s+/g, "");
  const partesEscaladas: string[] = [];
  let promedioUnitarioExacto = 0;

  for (const match of limpia.matchAll(REGEX_TERMINO_DANO)) {
    if (match[1] !== undefined && match[2] !== undefined) {
      const cantidadDados = parseInt(match[1], 10);
      const carasDado = parseInt(match[2], 10);
      const signo = cantidadDados < 0 ? "-" : partesEscaladas.length > 0 ? "+" : "";
      const absDados = Math.abs(cantidadDados) * Math.max(0, impactos);
      if (absDados > 0) partesEscaladas.push(`${signo}${absDados}d${carasDado}`);
      promedioUnitarioExacto += (cantidadDados < 0 ? -1 : 1) * Math.abs(cantidadDados) * ((carasDado + 1) / 2);
    } else if (match[3] !== undefined) {
      const bonoPlano = parseInt(match[3], 10);
      const bonoEscalado = bonoPlano * Math.max(0, impactos);
      if (bonoEscalado !== 0) {
        const signo = bonoEscalado < 0 ? "-" : partesEscaladas.length > 0 ? "+" : "";
        partesEscaladas.push(`${signo}${Math.abs(bonoEscalado)}`);
      }
      promedioUnitarioExacto += bonoPlano;
    }
  }

  const promedioPorImpacto = Math.max(1, Math.floor(promedioUnitarioExacto));
  const promedioTotal = impactos <= 0 ? 0 : Math.max(1, Math.floor(promedioUnitarioExacto * impactos));
  const formulaEscalada = impactos <= 0 ? "0" : partesEscaladas.join("") || `${promedioTotal}`;
  return { formulaEscalada, promedioPorImpacto, promedioTotal };
}

/** Calcula el resultado de un ataque de Horda usando la Tabla de Hordas de D&D 5.5e. */
export function calcularAtaqueHorda(params: {
  miembrosVivos: number;
  ataquesPorMiembro?: number;
  bonificadorAtaque: number;
  caObjetivo: number;
  formulaDano: string;
  tipoTirada?: "plano" | "ventaja" | "desventaja";
}): ResultadoAtaqueHorda {
  const miembrosVivos = Math.max(0, Math.trunc(params.miembrosVivos));
  const ataquesPorMiembro = Math.max(1, Math.trunc(params.ataquesPorMiembro ?? 1));
  const totalAtaques = miembrosVivos * ataquesPorMiembro;
  const ajusteTipo = params.tipoTirada === "ventaja" ? -5 : params.tipoTirada === "desventaja" ? 5 : 0;

  const d20Necesario = Math.max(1, params.caObjetivo - params.bonificadorAtaque + ajusteTipo);
  const criaturasPorImpacto = obtenerCriaturasNecesariasPorExito(d20Necesario);
  const imposibleImpactar = !Number.isFinite(criaturasPorImpacto);
  const impactosTotales = imposibleImpactar || totalAtaques <= 0 ? 0 : Math.floor(totalAtaques / criaturasPorImpacto);
  const { formulaEscalada, promedioPorImpacto, promedioTotal } = escalarFormulaDano(params.formulaDano, impactosTotales);

  return {
    d20Necesario,
    criaturasPorImpacto,
    miembrosVivos,
    ataquesPorMiembro,
    totalAtaques,
    impactosTotales,
    formulaDanoEscalada: formulaEscalada,
    danoPromedioPorImpacto: promedioPorImpacto,
    danoPromedioTotal: promedioTotal,
    imposibleImpactar
  };
}

/** Sincroniza los totales de vida de una criatura a partir de su arreglo de barras de vida. */
export function sincronizarAgregadosHorda(
  barras: BarraVidaHorda[],
  indiceBarraActivaPrevio = 0,
  autoAvanzarSiMuerta = false
): Pick<CriaturaIniciativa, "barrasVida" | "vidaActual" | "vidaMaxima" | "vidaTemporal" | "indiceBarraActiva" | "resumenHorda"> {
  let vidaMaxima = 0;
  let vidaActual = 0;
  let vidaTemporal = 0;
  let vivos = 0;

  const barrasNormalizadas: BarraVidaHorda[] = new Array(barras.length);
  for (let idx = 0; idx < barras.length; idx++) {
    const b = barras[idx];
    const max = Math.max(1, Math.trunc(b.vidaMaxima));
    const act = Math.max(0, Math.min(max, Math.trunc(b.vidaActual)));
    const temp = Math.max(0, Math.trunc(b.vidaTemporal ?? 0));

    barrasNormalizadas[idx] = { ...b, etiqueta: `#${idx + 1}`, vidaMaxima: max, vidaActual: act, vidaTemporal: temp };
    vidaMaxima += max;
    vidaActual += act;
    vidaTemporal += temp;
    if (act > 0) vivos++;
  }

  let indiceBarraActiva = Math.max(0, Math.min(barrasNormalizadas.length - 1, indiceBarraActivaPrevio));
  if (autoAvanzarSiMuerta && barrasNormalizadas[indiceBarraActiva]?.vidaActual === 0 && vivos > 0) {
    const primerVivo = barrasNormalizadas.findIndex((b) => b.vidaActual > 0);
    if (primerVivo >= 0) indiceBarraActiva = primerVivo;
  }

  return {
    barrasVida: barrasNormalizadas,
    vidaMaxima: Math.max(1, vidaMaxima),
    vidaActual,
    vidaTemporal,
    indiceBarraActiva,
    resumenHorda: { vivos, totales: barrasNormalizadas.length }
  };
}

/** Genera o redimensiona la colección de barras de vida de una horda preservando las existentes. */
export function construirBarrasHorda(
  cantidad: number,
  vidaPorMiembro: number,
  barrasExistentes?: BarraVidaHorda[],
  vidaActualInicialPrimera?: number,
  vidaTempInicialPrimera?: number
): BarraVidaHorda[] {
  const n = Math.max(1, Math.min(50, Math.trunc(cantidad)));
  const vidaBase = Math.max(1, Math.trunc(vidaPorMiembro));
  const resultado: BarraVidaHorda[] = [];

  for (let i = 0; i < n; i++) {
    const previa = barrasExistentes?.[i];
    if (previa) {
      resultado.push({ ...previa, etiqueta: `#${i + 1}` });
    } else if (i === 0 && (!barrasExistentes || barrasExistentes.length === 0)) {
      const act = vidaActualInicialPrimera !== undefined ? Math.min(vidaBase, Math.max(0, vidaActualInicialPrimera)) : vidaBase;
      resultado.push({ id: generarId("bh"), etiqueta: "#1", vidaMaxima: vidaBase, vidaActual: act, vidaTemporal: vidaTempInicialPrimera ?? 0 });
    } else {
      resultado.push({ id: generarId("bh"), etiqueta: `#${i + 1}`, vidaMaxima: vidaBase, vidaActual: vidaBase, vidaTemporal: 0 });
    }
  }
  return resultado;
}

function descontarDeBarra(b: BarraVidaHorda, cant: number): number {
  let restante = cant;
  let temp = b.vidaTemporal ?? 0;
  if (temp > 0) {
    const absorbido = Math.min(temp, restante);
    temp -= absorbido;
    restante -= absorbido;
  }
  if (restante > 0) {
    const absorbidoVida = Math.min(b.vidaActual, restante);
    b.vidaActual -= absorbidoVida;
    restante -= absorbidoVida;
  }
  b.vidaTemporal = temp;
  return restante;
}

/** Aplica daño a las barras de vida de una horda según el modo ("individual" o "cascada"). */
export function aplicarDanoBarrasHorda(
  criatura: CriaturaIniciativa,
  cantidad: number,
  modoOverride?: ModoDanoHorda,
  indiceBarraOverride?: number
): CriaturaIniciativa {
  const dano = Math.max(0, Math.trunc(cantidad));
  if (dano === 0 || !criatura.barrasVida || criatura.barrasVida.length === 0) return criatura;

  const modo: ModoDanoHorda = modoOverride ?? criatura.modoDanoHorda ?? "individual";
  const barras = criatura.barrasVida.map((b) => ({ ...b }));
  const indiceInicial = Math.max(0, Math.min(barras.length - 1, indiceBarraOverride ?? criatura.indiceBarraActiva ?? 0));

  if (modo === "individual") {
    const objetivo = barras[indiceInicial]?.vidaActual > 0 ? barras[indiceInicial] : barras.find((b) => b.vidaActual > 0) ?? barras[indiceInicial];
    if (objetivo) descontarDeBarra(objetivo, dano);
  } else {
    let restante = dano;
    if (barras[indiceInicial].vidaActual > 0 || (barras[indiceInicial].vidaTemporal ?? 0) > 0) {
      restante = descontarDeBarra(barras[indiceInicial], restante);
    }
    for (let idx = 0; idx < barras.length && restante > 0; idx++) {
      if (idx === indiceInicial) continue;
      if (barras[idx].vidaActual > 0 || (barras[idx].vidaTemporal ?? 0) > 0) {
        restante = descontarDeBarra(barras[idx], restante);
      }
    }
  }

  return { ...criatura, ...sincronizarAgregadosHorda(barras, indiceInicial, true) };
}

/** Aplica curación a la barra activa (o indicada) de una horda. */
export function aplicarCuracionBarrasHorda(
  criatura: CriaturaIniciativa,
  cantidad: number,
  indiceBarraOverride?: number
): CriaturaIniciativa {
  const curacion = Math.max(0, Math.trunc(cantidad));
  if (curacion === 0 || !criatura.barrasVida || criatura.barrasVida.length === 0) return criatura;

  const barras = criatura.barrasVida.map((b) => ({ ...b }));
  const idx = Math.max(0, Math.min(barras.length - 1, indiceBarraOverride ?? criatura.indiceBarraActiva ?? 0));
  barras[idx].vidaActual = Math.min(barras[idx].vidaMaxima, barras[idx].vidaActual + curacion);
  return { ...criatura, ...sincronizarAgregadosHorda(barras, idx) };
}

/** Resuelve una Salvación en Área sobre una ficha de Horda aplicando la Tabla de Hordas DMG. */
export function resolverSalvacionHordaEnArea(
  criatura: CriaturaIniciativa,
  params: { cd: number; bonoSalvacion: number; danoBruto?: number; mitigacion: "mitad" | "nada"; limiteMiembros?: number }
): { criaturaActualizada: CriaturaIniciativa; detalle: DetalleSalvacionHorda } {
  const barras = (criatura.barrasVida || []).map((b) => ({ ...b }));
  const indicesVivos: number[] = [];
  for (let idx = 0; idx < barras.length; idx++) {
    if (barras[idx].vidaActual > 0) indicesVivos.push(idx);
  }
  const maxAfectables = params.limiteMiembros && params.limiteMiembros > 0 ? Math.min(indicesVivos.length, Math.trunc(params.limiteMiembros)) : indicesVivos.length;

  const d20Necesario = Math.max(1, params.cd - params.bonoSalvacion);
  const criaturasPorExito = obtenerCriaturasNecesariasPorExito(d20Necesario);
  const exitos = !Number.isFinite(criaturasPorExito) ? 0 : Math.min(maxAfectables, Math.floor(maxAfectables / criaturasPorExito));
  const fallos = Math.max(0, maxAfectables - exitos);

  const danoBruto = params.danoBruto && params.danoBruto > 0 ? Math.trunc(params.danoBruto) : 0;
  const danoPorFallo = danoBruto;
  const danoPorExito = danoBruto > 0 ? (params.mitigacion === "nada" ? 0 : Math.floor(danoBruto / 2)) : 0;
  let danoTotalAplicado = 0;

  if (danoBruto > 0) {
    for (let i = 0; i < maxAfectables; i++) {
      const idxBarra = indicesVivos[i];
      const danoBarra = i < fallos ? danoPorFallo : danoPorExito;
      danoTotalAplicado += danoBarra;
      descontarDeBarra(barras[idxBarra], danoBarra);
    }
  }

  return {
    criaturaActualizada: { ...criatura, ...sincronizarAgregadosHorda(barras, criatura.indiceBarraActiva ?? 0) },
    detalle: { afectados: maxAfectables, exitos, fallos, criaturasPorExito, d20Necesario, danoPorFallo, danoPorExito, danoTotalAplicado }
  };
}
