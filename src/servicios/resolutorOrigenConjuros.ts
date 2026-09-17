import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { generarIdSlug } from "@/utiles/generarId";
import { coincideHechizoId } from "./comparadorHechizos";
import { obtenerConjurosSubclasePersonaje } from "./calculadorMagia";
import { obtenerEspeciePorNombre, obtenerSubespeciePorNombre } from "./gestorEspecies";

export type OrigenConjuroBadge = "clase" | "subclase" | "especie" | "legado" | "rasgos";

export interface ConfigBadgeOrigen {
  etiqueta: string;
  colorTexto: string;
  colorFondo: string;
  colorBorde: string;
  tooltip: string;
}

export const CONFIG_BADGES_ORIGEN_CONJURO: Record<OrigenConjuroBadge, ConfigBadgeOrigen> = {
  clase: {
    etiqueta: "Clase",
    colorTexto: "#93c5fd",
    colorFondo: "rgba(59, 130, 246, 0.18)",
    colorBorde: "rgba(59, 130, 246, 0.35)",
    tooltip: "Conjuro otorgado automáticamente por tu clase"
  },
  subclase: {
    etiqueta: "Subclase",
    colorTexto: "#c084fc",
    colorFondo: "rgba(168, 85, 247, 0.18)",
    colorBorde: "rgba(168, 85, 247, 0.35)",
    tooltip: "Conjuro otorgado automáticamente por tu subclase"
  },
  especie: {
    etiqueta: "Especie",
    colorTexto: "#fde047",
    colorFondo: "rgba(234, 179, 8, 0.18)",
    colorBorde: "rgba(234, 179, 8, 0.35)",
    tooltip: "Conjuro innato u otorgado por tu especie"
  },
  legado: {
    etiqueta: "Legado",
    colorTexto: "#67e8f9",
    colorFondo: "rgba(6, 182, 212, 0.18)",
    colorBorde: "rgba(6, 182, 212, 0.35)",
    tooltip: "Conjuro otorgado por tu linaje o legado"
  },
  rasgos: {
    etiqueta: "Rasgos",
    colorTexto: "#fb923c",
    colorFondo: "rgba(249, 115, 22, 0.18)",
    colorBorde: "rgba(249, 115, 22, 0.35)",
    tooltip: "Conjuro otorgado por un rasgo de personaje"
  }
};

/**
 * Función pura que determina si un conjuro fue otorgado por alguna aptitud especial
 * y clasifica su origen exacto entre: "clase", "subclase", "especie", "legado" o "rasgos" (default).
 */
export function resolverOrigenConjuro(
  personaje: PersonajeJugador | null | undefined,
  hechizo: HechizoBase | null | undefined
): OrigenConjuroBadge | null {
  if (!personaje || !hechizo) return null;

  const idHechizo = (hechizo.id || "").toLowerCase().trim();
  const nomHechizo = (hechizo.nombre || "").toLowerCase().trim();
  const sinTildes = nomHechizo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slug = generarIdSlug("h", hechizo.nombre || "");

  const coincide = (cadena: string): boolean => {
    if (!cadena) return false;
    if (coincideHechizoId(cadena, hechizo.id) || coincideHechizoId(cadena, hechizo.nombre)) {
      return true;
    }
    const cNorm = cadena.toLowerCase().trim();
    const cSinTildes = cNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cSlug = generarIdSlug("h", cadena);
    return (
      cNorm === nomHechizo ||
      cSinTildes === sinTildes ||
      cSlug === slug ||
      cadena === idHechizo ||
      cadena === slug ||
      cNorm === idHechizo
    );
  };

  const pjNivel = personaje.nivel || 1;

  // 1. Rasgos del personaje (inspección profunda de orígenes de rasgos)
  for (const r of personaje.rasgos || []) {
    if (r.activo === false) continue;
    if (r.nivelRequerido && pjNivel < r.nivelRequerido) continue;
    let otorga = false;

    if (Array.isArray(r.conjurosOtorgados) && r.conjurosOtorgados.some(coincide)) {
      otorga = true;
    }

    if (!otorga && Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        const idLower = sel.id.toLowerCase();
        if (
          idLower.includes("truco") ||
          idLower.includes("conjuro") ||
          idLower.includes("hechizo") ||
          idLower.includes("spell") ||
          idLower.includes("cantrip")
        ) {
          if (Array.isArray(sel.valorActual) && sel.valorActual.some(coincide)) {
            otorga = true;
            break;
          }
        }

        // Inspección de opciones seleccionadas en selectores (ej. Invocaciones Sobrenaturales)
        if (Array.isArray(sel.valorActual) && Array.isArray(sel.opciones)) {
          for (const opVal of sel.valorActual) {
            const baseId = typeof opVal === "string"
              ? (opVal.includes(":") ? opVal.split(":")[0] : opVal.includes("__") ? opVal.split("__")[0] : opVal)
              : "";
            const op = sel.opciones.find((o) => o.id === opVal || o.id === baseId);
            if (op) {
              if (op.conjuroGratuito && coincide(op.conjuroGratuito)) {
                otorga = true;
                break;
              }
              if (Array.isArray(op.efectos)) {
                for (const ef of op.efectos) {
                  if (ef.tipo === "conjuro_gratuito" || ef.tipo === "conjuro_otorgado") {
                    const cNom = String(ef.objetivo || ef.valor || "");
                    if (coincide(cNom)) {
                      otorga = true;
                      break;
                    }
                  }
                }
              }
            }
            if (otorga) break;
          }
        }
        if (otorga) break;
      }
    }

    if (!otorga && r.conjuroGratuito && coincide(r.conjuroGratuito)) {
      otorga = true;
    }

    if (!otorga && Array.isArray(r.efectos)) {
      for (const ef of r.efectos) {
        if (ef.tipo === "conjuro_otorgado" || ef.tipo === "conjuro_gratuito") {
          const val = String(ef.objetivo || ef.valor || "");
          if (coincide(val)) {
            otorga = true;
            break;
          }
        }
      }
    }

    // Regla D&D 5.5e: Palabras de creación (Bardo Nv 20)
    if (!otorga && sinTildes.includes("palabra de poder") && (r.id.includes("palabras_creacion") || r.id.includes("palabras_de_creacion") || r.id.includes("creacion"))) {
      otorga = true;
    }

    if (otorga) {
      const fNorm = (r.fuente || "").toLowerCase();
      if (fNorm.includes("legado") || fNorm.includes("subespecie") || fNorm.includes("linaje") || fNorm.includes("subraza")) {
        return "legado";
      }
      if (r.origen === "clase" || fNorm.includes("clase")) return "clase";
      if (r.origen === "subclase" || fNorm.includes("subclase")) return "subclase";
      if (r.origen === "especie" || fNorm.includes("especie") || fNorm.includes("raza")) return "especie";

      return "rasgos";
    }
  }

  // 2. Subclase dinámica
  const resSubclase = obtenerConjurosSubclasePersonaje(
    personaje.clases,
    personaje.clase,
    personaje.subclase,
    personaje.nivel
  );
  if (resSubclase.conjuros.some(coincide) || resSubclase.trucos.some(coincide)) {
    return "subclase";
  }

  // 3. Especie o Subespecie / Legado directamente por catálogo
  if (personaje.especie) {
    const espDef = obtenerEspeciePorNombre(personaje.especie);
    if (espDef) {
      if (
        espDef.conjurosInnatos?.some(
          (ci) => (!ci.nivelRequerido || pjNivel >= ci.nivelRequerido) && (coincide(ci.hechizoId) || coincide(ci.nombreHechizo))
        )
      ) {
        return "especie";
      }
      if (personaje.subespecie) {
        const subDef = obtenerSubespeciePorNombre(espDef.id, personaje.subespecie);
        if (
          subDef?.conjurosInnatos?.some(
            (ci) => (!ci.nivelRequerido || pjNivel >= ci.nivelRequerido) && (coincide(ci.hechizoId) || coincide(ci.nombreHechizo))
          )
        ) {
          return "legado";
        }
      }
    }
  }

  // 4. Conjuros siempre preparados configurados en ficha (fallback default: rasgos)
  if (personaje.conjurosSiemprePreparadosIds?.some(coincide)) {
    return "rasgos";
  }

  return null;
}
