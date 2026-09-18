import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { generarIdSlug } from "@/utiles/generarId";
import { coincideHechizoId } from "./comparadorHechizos";
import { obtenerConjurosSubclasePersonaje } from "./calculadorMagia";
import { obtenerEspeciePorNombre, obtenerSubespeciePorNombre } from "./gestorEspecies";
import { MAPA_ALIAS_HECHIZOS } from "@/constantes/subclasesConjurosConstantes";

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
      if (r.origen === "subclase" || fNorm.includes("subclase")) return "subclase";
      if (r.origen === "clase" || fNorm.includes("clase")) return "clase";
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

/**
 * Crea un resolutor pre-indexado O(1) para el personaje dado.
 *
 * Escanea una única vez todas las fuentes de conjuros del personaje
 * (rasgos, subclases dinámicas, especie, linaje/legado, conjuros siempre preparados)
 * e indexa todas las claves (IDs, nombres, slugs, sin tildes, sinónimos) en un Map.
 *
 * Cada consulta posterior sobre un hechizo se resuelve en O(1) sin coste
 * de normalización de strings repetitivo.
 */
export function crearResolutorOrigenConjuros(
  personaje: PersonajeJugador | null | undefined
): (hechizo: HechizoBase | null | undefined) => OrigenConjuroBadge | null {
  if (!personaje) return () => null;

  const mapa = new Map<string, OrigenConjuroBadge>();
  const pjNivel = personaje.nivel || 1;

  const registrarClave = (k: string, b: OrigenConjuroBadge) => {
    if (!k || mapa.has(k)) return;
    mapa.set(k, b);
  };

  const registrarCadena = (cadena: string, badge: OrigenConjuroBadge) => {
    if (!cadena) return;
    registrarClave(cadena, badge);
    const norm = cadena.toLowerCase().trim();
    registrarClave(norm, badge);
    const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    registrarClave(sinTildes, badge);

    // Despojar prefijo de id (h_ o h-) para indexar tanto la raíz pura como los dos formatos de slug
    const cuerpo = sinTildes.startsWith("h_") || sinTildes.startsWith("h-")
      ? sinTildes.substring(2)
      : sinTildes;

    registrarClave(cuerpo, badge);

    const slugBajo = generarIdSlug("h", cuerpo);
    registrarClave(slugBajo, badge);

    const slugGuion = `h-${cuerpo.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
    registrarClave(slugGuion, badge);

    const alias = MAPA_ALIAS_HECHIZOS[cuerpo] || MAPA_ALIAS_HECHIZOS[sinTildes] || MAPA_ALIAS_HECHIZOS[norm] || [];
    for (const al of alias) {
      registrarClave(al, badge);
      const alNorm = al.toLowerCase().trim();
      registrarClave(alNorm, badge);
      const alSinTildes = alNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      registrarClave(alSinTildes, badge);
      const alCuerpo = alSinTildes.startsWith("h_") || alSinTildes.startsWith("h-") ? alSinTildes.substring(2) : alSinTildes;
      registrarClave(alCuerpo, badge);
      registrarClave(generarIdSlug("h", alCuerpo), badge);
      registrarClave(`h-${alCuerpo.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`, badge);
    }
  };

  let tienePalabrasCreacion = false;

  // 1. Rasgos del personaje
  for (const r of personaje.rasgos || []) {
    if (r.activo === false) continue;
    if (r.nivelRequerido && pjNivel < r.nivelRequerido) continue;

    const fNorm = (r.fuente || "").toLowerCase();
    let badge: OrigenConjuroBadge = "rasgos";
    if (fNorm.includes("legado") || fNorm.includes("subespecie") || fNorm.includes("linaje") || fNorm.includes("subraza")) {
      badge = "legado";
    } else if (r.origen === "subclase" || fNorm.includes("subclase")) {
      badge = "subclase";
    } else if (r.origen === "clase" || fNorm.includes("clase")) {
      badge = "clase";
    } else if (r.origen === "especie" || fNorm.includes("especie") || fNorm.includes("raza")) {
      badge = "especie";
    }

    if (Array.isArray(r.conjurosOtorgados)) {
      for (const c of r.conjurosOtorgados) registrarCadena(c, badge);
    }

    if (Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        const idLower = sel.id.toLowerCase();
        const esMagico =
          idLower.includes("truco") ||
          idLower.includes("conjuro") ||
          idLower.includes("hechizo") ||
          idLower.includes("spell") ||
          idLower.includes("cantrip");

        if (esMagico && Array.isArray(sel.valorActual)) {
          for (const v of sel.valorActual) registrarCadena(v, badge);
        }

        if (Array.isArray(sel.valorActual) && Array.isArray(sel.opciones)) {
          for (const opVal of sel.valorActual) {
            const baseId = typeof opVal === "string"
              ? (opVal.includes(":") ? opVal.split(":")[0] : opVal.includes("__") ? opVal.split("__")[0] : opVal)
              : "";
            const op = sel.opciones.find((o) => o.id === opVal || o.id === baseId);
            if (op) {
              if (op.conjuroGratuito) registrarCadena(op.conjuroGratuito, badge);
              if (Array.isArray(op.efectos)) {
                for (const ef of op.efectos) {
                  if (ef.tipo === "conjuro_gratuito" || ef.tipo === "conjuro_otorgado") {
                    const cNom = String(ef.objetivo || ef.valor || "");
                    if (cNom) registrarCadena(cNom, badge);
                  }
                }
              }
            }
          }
        }
      }
    }

    if (r.conjuroGratuito) registrarCadena(r.conjuroGratuito, badge);

    if (Array.isArray(r.efectos)) {
      for (const ef of r.efectos) {
        if (ef.tipo === "conjuro_otorgado" || ef.tipo === "conjuro_gratuito") {
          const val = String(ef.objetivo || ef.valor || "");
          if (val) registrarCadena(val, badge);
        }
      }
    }

    if (r.id.includes("palabras_creacion") || r.id.includes("palabras_de_creacion") || r.id.includes("creacion")) {
      tienePalabrasCreacion = true;
    }
  }

  // 2. Subclase dinámica
  const resSubclase = obtenerConjurosSubclasePersonaje(
    personaje.clases,
    personaje.clase,
    personaje.subclase,
    personaje.nivel
  );
  for (const c of resSubclase.conjuros) registrarCadena(c, "subclase");
  for (const t of resSubclase.trucos) registrarCadena(t, "subclase");

  // 3. Especie o Subespecie / Legado
  if (personaje.especie) {
    const espDef = obtenerEspeciePorNombre(personaje.especie);
    if (espDef) {
      for (const ci of espDef.conjurosInnatos || []) {
        if (!ci.nivelRequerido || pjNivel >= ci.nivelRequerido) {
          if (ci.hechizoId) registrarCadena(ci.hechizoId, "especie");
          if (ci.nombreHechizo) registrarCadena(ci.nombreHechizo, "especie");
        }
      }
      if (personaje.subespecie) {
        const subDef = obtenerSubespeciePorNombre(espDef.id, personaje.subespecie);
        for (const ci of subDef?.conjurosInnatos || []) {
          if (!ci.nivelRequerido || pjNivel >= ci.nivelRequerido) {
            if (ci.hechizoId) registrarCadena(ci.hechizoId, "legado");
            if (ci.nombreHechizo) registrarCadena(ci.nombreHechizo, "legado");
          }
        }
      }
    }
  }

  // 4. Conjuros siempre preparados configurados en ficha
  for (const c of personaje.conjurosSiemprePreparadosIds || []) {
    registrarCadena(c, "rasgos");
  }

  const cacheConsultas = new Map<string, OrigenConjuroBadge | null>();

  return (hechizo: HechizoBase | null | undefined): OrigenConjuroBadge | null => {
    if (!hechizo) return null;
    const id = hechizo.id;
    if (cacheConsultas.has(id)) {
      return cacheConsultas.get(id) ?? null;
    }

    let res: OrigenConjuroBadge | null = null;
    if (mapa.has(id)) {
      res = mapa.get(id) ?? null;
    } else {
      const nom = hechizo.nombre;
      if (nom && mapa.has(nom)) {
        res = mapa.get(nom) ?? null;
      } else {
        const idNorm = id ? id.toLowerCase().trim() : "";
        const idSinTildes = idNorm ? idNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
        const idCuerpo = idSinTildes.startsWith("h_") || idSinTildes.startsWith("h-") ? idSinTildes.substring(2) : idSinTildes;
        if (idCuerpo && mapa.has(idCuerpo)) {
          res = mapa.get(idCuerpo) ?? null;
        } else {
          const slug = generarIdSlug("h", nom || "");
          if (slug && mapa.has(slug)) {
            res = mapa.get(slug) ?? null;
          } else {
            const norm = (nom || "").toLowerCase().trim();
            if (norm && mapa.has(norm)) {
              res = mapa.get(norm) ?? null;
            } else {
              const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              if (sinTildes && mapa.has(sinTildes)) {
                res = mapa.get(sinTildes) ?? null;
              } else if (tienePalabrasCreacion && sinTildes.includes("palabra de poder")) {
                res = "rasgos";
              } else {
                // Fallback de seguridad al resolutor canónico
                res = resolverOrigenConjuro(personaje, hechizo);
              }
            }
          }
        }
      }
    }

    cacheConsultas.set(id, res);
    return res;
  };
}

