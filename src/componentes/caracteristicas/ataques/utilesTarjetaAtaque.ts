import { normalizarClave } from "@/servicios/resolutorPropiedades";

export type IconoMaestria = "shield" | "hourglass" | "swords" | "sparkles";

export interface ResumenMaestriaVisual {
  etiqueta: string;
  icono: IconoMaestria;
  notaFallo?: string;
}

const REGEX_ALCANCE_DUPLICADO = /^(\d+)\s*\/\s*\1(\s*(?:ft|pies))?$/i;
const REGEX_DADOS_INDIVIDUAL = /(\d+)d(\d+)/gi;
const REGEX_BONO_MAGICO_NOMBRE = /\+(\d+)/;

/**
 * Normaliza alcances redundantes como "5/5 ft" -> "5 ft".
 */
export function formatearAlcanceLimpio(alcance?: string): string {
  const limpio = (alcance || "").trim();
  if (!limpio) return "";
  const match = limpio.match(REGEX_ALCANCE_DUPLICADO);
  if (match) {
    return `${match[1]}${match[2] || " ft"}`;
  }
  return limpio;
}

/**
 * Construye una única línea de subtítulo sin repetir "Cuerpo a cuerpo" ni "Arrojadiza".
 */
export function construirSubtituloAtaque(subtipo?: string, alcance?: string): string {
  const alcanceLimpio = formatearAlcanceLimpio(alcance);
  const subtipoLimpio = (subtipo || "").trim();

  if (!subtipoLimpio && !alcanceLimpio) return "";
  if (!alcanceLimpio) return subtipoLimpio;
  if (!subtipoLimpio) return `Alcance ${alcanceLimpio}`;

  const subNorm = normalizarClave(subtipoLimpio);
  const alcNorm = normalizarClave(alcanceLimpio);

  // Evita "Cuerpo a Cuerpo / Arrojadiza · 5 ft (20/60 ft arrojadiza)"
  const etiquetaCategoria =
    subNorm === "a distancia"
      ? "A distancia"
      : subNorm === "cuerpo a cuerpo" || (subNorm.includes("cuerpo a cuerpo") && subNorm.includes("arrojadiza") && alcNorm.includes("arrojadiza"))
      ? "Cuerpo a cuerpo"
      : subtipoLimpio;

  const prefijoAlcance = subNorm.includes("distancia") ? "Rango" : "Alcance";
  const yaTieneContexto = alcNorm.includes("(") || alcNorm.includes("alcance") || alcNorm.includes("rango");

  return yaTieneContexto
    ? `${etiquetaCategoria} · ${alcanceLimpio}`
    : `${etiquetaCategoria} · ${prefijoAlcance} ${alcanceLimpio}`;
}

/**
 * Deduplica rangos ya presentes en el subtítulo (ej. "Arrojadiza (20/60 ft)" -> "Arrojadiza").
 */
export function obtenerEtiquetaPropiedadCompacta(propiedad: string, alcance?: string): string {
  const limpia = propiedad.trim();
  if (!limpia || !alcance) return limpia;

  const matchRango = limpia.match(/^([^(]+)\(([^)]+)\)$/);
  if (!matchRango) return limpia;

  const base = matchRango[1].trim();
  const detalle = matchRango[2].trim();
  if (normalizarClave(alcance).includes(normalizarClave(detalle))) {
    return base;
  }
  return limpia;
}

/**
 * Calcula la etiqueta compacta de arma mágica ("Magia +1", "Magia +2" o "Mágico").
 */
export function obtenerEtiquetaMagica(nombre: string, esMagico?: boolean): string | null {
  if (!esMagico) return null;
  const match = nombre.match(REGEX_BONO_MAGICO_NOMBRE);
  return match ? `Magia +${match[1]}` : "Mágico";
}

/**
 * Duplica los dados de daño para previsualización en vivo del modo CRÍTICO (×2),
 * siguiendo las mismas reglas exactas de `ejecutarTiradaCritico`.
 */
export function calcularFormulaCriticoVisual(
  dadoBaseRaw: string,
  modDano: number,
  dadosExtraCritico: number = 0
): string {
  const origen = (dadoBaseRaw || "").trim();
  if (!origen) return "";

  const subgrupos = origen.split("/");
  const resultados: string[] = [];

  for (let i = 0; i < subgrupos.length; i++) {
    const sub = subgrupos[i].trim();
    const tieneDados = /\d+d\d+/i.test(sub);

    if (tieneDados) {
      let extraRestante = i === 0 ? Math.max(0, dadosExtraCritico) : 0;
      const duplicado = sub.replace(REGEX_DADOS_INDIVIDUAL, (_match, cantStr: string, caras: string) => {
        let cantidad = parseInt(cantStr, 10) * 2;
        if (extraRestante > 0) {
          cantidad += extraRestante;
          extraRestante = 0;
        }
        return `${cantidad}d${caras}`;
      });

      if (i === 0 && modDano !== 0) {
        const signo = modDano >= 0 ? `+${modDano}` : `${modDano}`;
        resultados.push(`${duplicado}${signo}`);
      } else {
        resultados.push(duplicado);
      }
    } else {
      const fijo = parseInt(sub, 10);
      if (!Number.isNaN(fijo) && i === 0 && modDano !== 0) {
        resultados.push(String(fijo + modDano));
      } else {
        resultados.push(sub);
      }
    }
  }

  return resultados.join(" / ");
}

/**
 * Determina el icono semántico y nota táctica de una Maestría de Arma D&D 5.5e.
 */
export function obtenerResumenMaestriaVisual(
  maestria: string,
  modAtributo: number
): ResumenMaestriaVisual {
  const norm = normalizarClave(maestria);

  if (norm.includes("sap") || norm.includes("debilitar") || norm.includes("aturdir")) {
    return { etiqueta: maestria, icono: "shield" };
  }
  if (norm.includes("slow") || norm.includes("ralentizar")) {
    return { etiqueta: maestria, icono: "hourglass" };
  }
  if (norm.includes("graze") || norm.includes("rozar") || norm.includes("rasguno")) {
    return {
      etiqueta: maestria,
      icono: "swords",
      notaFallo: modAtributo > 0 ? `Fallo: ${modAtributo} dmg` : undefined
    };
  }
  return { etiqueta: maestria, icono: "sparkles" };
}
