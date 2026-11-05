import type { MonstruoBase, VelocidadEstructurada, SentidosEstructurados } from "@/tipos";
import { aplanarValor, normalizarTexto } from "./comun";

export function calcularVidaPorDados(
  formula: string,
  promedioEstandar: number,
  metodo: "estandar" | "maximo" | "azar"
): number {
  if (metodo === "estandar" || !formula) {
    return promedioEstandar;
  }

  // Sanitizar fórmula (quitar espacios, paréntesis y pasar a minúsculas)
  const saneada = formula
    .replace(/[\s()]+/g, "")
    .replace(/[–—−]+/g, "-") // Reemplaza en-dash, em-dash y minus sign unicode por el '-' regular
    .toLowerCase();

  // Expresión regular para parsear: opcionalmente número de dados 'x', 'd', número de caras 'y', y modificador opcional '+z' o '-z'
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
    return Math.max(1, total);
  }

  return promedioEstandar;
}

export function parsearVelocidad(velStr: string): VelocidadEstructurada {
  const result: VelocidadEstructurada = { caminar: 0, planea: false };
  if (!velStr) return result;

  const partes = velStr.toLowerCase().split(",");
  for (const parte of partes) {
    const numMatch = parte.match(/(\d+)\s*pies?/);
    const valor = numMatch ? parseInt(numMatch[1], 10) : 30;

    if (parte.includes("nadar") || parte.includes("swim")) {
      result.nadar = valor;
    } else if (parte.includes("volar") || parte.includes("fly")) {
      result.volar = valor;
      if (parte.includes("suspenderse") || parte.includes("hover")) {
        result.planea = true;
      }
    } else if (parte.includes("trepar") || parte.includes("climb")) {
      result.escalar = valor;
    } else if (parte.includes("excavar") || parte.includes("burrow")) {
      result.excavar = valor;
    } else {
      result.caminar = valor;
    }
  }
  return result;
}

export function parsearSentidos(sentidosStr: string): SentidosEstructurados {
  const result: SentidosEstructurados = { percepcionPasiva: 10 };
  if (!sentidosStr) return result;

  const partes = sentidosStr.toLowerCase().split(",");
  for (const parte of partes) {
    const numMatch = parte.match(/(\d+)\s*pies?/);
    const valor = numMatch ? parseInt(numMatch[1], 10) : 60;

    if (parte.includes("oscuridad") || parte.includes("darkvision")) {
      result.visionOscuridad = valor;
    } else if (parte.includes("ciega") || parte.includes("blindsight")) {
      result.visionCiega = valor;
    } else if (parte.includes("verdadera") || parte.includes("truesight")) {
      result.visionVerdadera = valor;
    } else if (parte.includes("sísmico") || parte.includes("sismico") || parte.includes("tremorsense")) {
      result.sentidoSismico = valor;
    } else if (parte.includes("pasiva") || parte.includes("passive")) {
      const pasivaMatch = parte.match(/(\d+)/);
      if (pasivaMatch) {
        result.percepcionPasiva = parseInt(pasivaMatch[1], 10);
      }
    }
  }
  return result;
}

export function formatearVelocidad(vel: VelocidadEstructurada | string | undefined): string {
  if (!vel) return "0 pies";
  if (typeof vel === "string") return vel;

  const partes: string[] = [];
  if (vel.caminar) partes.push(`${vel.caminar} pies`);
  if (vel.nadar) partes.push(`Nadar ${vel.nadar} pies`);
  if (vel.volar) {
    partes.push(`Volar ${vel.volar} pies${vel.planea ? " (suspenderse)" : ""}`);
  }
  if (vel.escalar) partes.push(`Trepar ${vel.escalar} pies`);
  if (vel.excavar) partes.push(`Excavar ${vel.excavar} pies`);

  return partes.length > 0 ? partes.join(", ") : "0 pies";
}

export function formatearSentidos(sentidos: SentidosEstructurados | string | undefined): string {
  if (!sentidos) return "";
  if (typeof sentidos === "string") return sentidos;

  const partes: string[] = [];
  if (sentidos.visionOscuridad) partes.push(`Visión en la oscuridad ${sentidos.visionOscuridad} pies`);
  if (sentidos.visionCiega) partes.push(`Visión ciega ${sentidos.visionCiega} pies`);
  if (sentidos.visionVerdadera) partes.push(`Visión verdadera ${sentidos.visionVerdadera} pies`);
  if (sentidos.sentidoSismico) partes.push(`Sentido sísmico ${sentidos.sentidoSismico} pies`);
  partes.push(`Percepción pasiva ${sentidos.percepcionPasiva}`);

  return partes.join(", ");
}

/**
 * Formatea el subtítulo estándar de una criatura (ej. "Humanoide Mediano, neutral malvado" o "Dragón Gargantuesco, Caótico malvado").
 */
export function formatearSubtituloCriatura(tipo?: string, tamaño?: string, alineacion?: string): string {
  const tipoLimpio = (tipo || "").trim();
  const tamañoLimpio = (tamaño || "").trim();
  const alineacionLimpia = (alineacion || "").trim();

  let primeraParte = "";
  if (tipoLimpio && tamañoLimpio) {
    primeraParte = `${tipoLimpio} ${tamañoLimpio}`;
  } else if (tipoLimpio) {
    primeraParte = tipoLimpio;
  } else if (tamañoLimpio) {
    primeraParte = tamañoLimpio;
  }

  if (primeraParte && alineacionLimpia && alineacionLimpia !== "-") {
    return `${primeraParte}, ${alineacionLimpia}`;
  }
  if (primeraParte) {
    return primeraParte;
  }
  if (alineacionLimpia && alineacionLimpia !== "-") {
    return alineacionLimpia;
  }
  return "Criatura";
}

/**
 * Formatea el texto de recarga o uso de una habilidad/ataque (ej. "5-6" -> "Recarga 5-6", "6" -> "Recarga 6", "1/Día" -> "1/Día").
 */
export function formatearRecargaTexto(recarga?: string, uso?: string): string {
  const texto = (recarga || uso || "").trim();
  if (!texto) return "";

  // Si es un patrón de rango tipo "5-6", "5—6", "4-6"
  const matchRango = texto.match(/^(\d)\s*[-—–]\s*(\d)$/);
  if (matchRango) {
    return `Recarga ${matchRango[1]}-${matchRango[2]}`;
  }

  // Si es solo un dígito único de recarga ("5" o "6")
  const matchUnico = texto.match(/^(\d)$/);
  if (matchUnico) {
    const num = parseInt(matchUnico[1], 10);
    if (num >= 4 && num <= 6) {
      return `Recarga ${num}`;
    }
    return texto;
  }

  // Si ya empieza con recarga o recharge
  if (/^recarga\s+/i.test(texto)) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
  if (/^recharge\s+/i.test(texto)) {
    return texto.replace(/^recharge\s+/i, "Recarga ");
  }

  return texto;
}

export function sanearMonstruoSentidosYPasiva<T extends Partial<MonstruoBase>>(m: T): T {
  let sentidosObj: SentidosEstructurados;
  if (m.sentidos && typeof m.sentidos === "object" && !Array.isArray(m.sentidos)) {
    sentidosObj = { ...(m.sentidos as SentidosEstructurados) };
  } else {
    sentidosObj = parsearSentidos(typeof m.sentidos === "string" ? m.sentidos : "");
  }

  if (sentidosObj.percepcionPasiva === 10) {
    const sab = m.caracteristicas?.sabiduria ?? 10;
    const modSab = Math.floor((sab - 10) / 2);
    const percBono = m.habilidades?.percepcion;
    const valorCalculado = 10 + (percBono !== undefined ? percBono : modSab);
    if (valorCalculado !== 10) {
      sentidosObj.percepcionPasiva = valorCalculado;
    }
  }

  return {
    ...m,
    tamaño: typeof m.tamaño === "string" ? m.tamaño.trim() : "",
    alineacion: typeof m.alineacion === "string" ? m.alineacion.trim() : "",
    acciones: Array.isArray(m.acciones) ? m.acciones.map((a) => ({
      ...a,
      recarga: typeof a.recarga === "string" ? a.recarga.trim() : (typeof a.uso === "string" ? a.uso.trim() : ""),
      uso: typeof a.uso === "string" ? a.uso.trim() : ""
    })) : [],
    accionesAdicionales: Array.isArray(m.accionesAdicionales) ? m.accionesAdicionales.map((a) => ({
      ...a,
      recarga: typeof a.recarga === "string" ? a.recarga.trim() : (typeof a.uso === "string" ? a.uso.trim() : ""),
      uso: typeof a.uso === "string" ? a.uso.trim() : ""
    })) : [],
    reacciones: Array.isArray(m.reacciones) ? m.reacciones.map((r) => ({
      ...r,
      recarga: typeof r.recarga === "string" ? r.recarga.trim() : (typeof r.uso === "string" ? r.uso.trim() : ""),
      uso: typeof r.uso === "string" ? r.uso.trim() : ""
    })) : [],
    rasgos: Array.isArray(m.rasgos) ? m.rasgos.map((r) => ({
      ...r,
      recarga: typeof r.recarga === "string" ? r.recarga.trim() : (typeof r.uso === "string" ? r.uso.trim() : ""),
      uso: typeof r.uso === "string" ? r.uso.trim() : ""
    })) : [],
    accionesLegendarias: Array.isArray(m.accionesLegendarias) ? m.accionesLegendarias.map((l) => ({
      ...l,
      recarga: typeof l.recarga === "string" ? l.recarga.trim() : (typeof l.uso === "string" ? l.uso.trim() : ""),
      uso: typeof l.uso === "string" ? l.uso.trim() : ""
    })) : [],
    accionesRapidas: Array.isArray(m.accionesRapidas) ? m.accionesRapidas.map((q) => ({
      ...q,
      recarga: typeof q.recarga === "string" ? q.recarga.trim() : (typeof q.uso === "string" ? q.uso.trim() : ""),
      uso: typeof q.uso === "string" ? q.uso.trim() : ""
    })) : [],
    accionesLegendariasTotal: m.accionesLegendariasTotal !== undefined && m.accionesLegendariasTotal !== null
      ? String(m.accionesLegendariasTotal).trim()
      : "3",
    equipo: typeof m.equipo === "string" ? m.equipo.trim() : (m.equipo ? aplanarValor(m.equipo) : ""),
    tesoros: typeof m.tesoros === "string" ? m.tesoros.trim() : (m.tesoros ? aplanarValor(m.tesoros) : ""),
    nombreNormalizado: normalizarTexto(m.nombre || ""),
    sentidos: sentidosObj
  };
}
