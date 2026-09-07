import type { RasgoPersonaje } from "@/tipos";

/**
 * Normaliza cadenas para comparaciones de condiciones y rasgos sin distinción de mayúsculas ni diacríticos.
 */
export function normalizarTextoSeguro(s: string = ""): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/**
 * Resuelve la condición táctica asociada a un rasgo activable (personalizada o canónica).
 */
export function resolverCondicionAsociadaRasgo(r: RasgoPersonaje): string | undefined {
  if (r.condicionAlActivar && r.condicionAlActivar.trim()) {
    return r.condicionAlActivar.trim();
  }
  const nom = normalizarTextoSeguro(r.nombre);
  const id = normalizarTextoSeguro(r.id);

  if (nom.includes("furia de los dioses") || id.includes("furia_de_los_dioses")) {
    return "Furia de los Dioses (Rage of the Gods)";
  }
  if ((nom === "furia" || id === "rasgo_cls_barbaro_furia") && !nom.includes("persistente")) {
    return "Furia (Rage)";
  }
  if (nom.includes("temerario") || id.includes("temerario")) {
    return "Ataque Temerario (Reckless Attack)";
  }
  if (nom.includes("manto de majestad") || nom.includes("manto de la majestad") || id.includes("manto_de_majestad")) {
    return "Manto de Majestad (Mantle of Majesty)";
  }
  if (nom.includes("majestad inquebrantable") || id.includes("majestad_inquebrantable")) {
    return "Majestad Inquebrantable (Unbreakable Majesty)";
  }
  return undefined;
}

/**
 * Determina si una condición táctica coincide con un rasgo para activación/desactivación reactiva.
 */
export function coincideCondicionConRasgo(condicionTexto: string, r: RasgoPersonaje): boolean {
  const cNorm = normalizarTextoSeguro(condicionTexto);
  if (!cNorm) return false;

  const rCond = r.condicionAlActivar ? normalizarTextoSeguro(r.condicionAlActivar) : "";
  if (rCond && (cNorm === rCond || cNorm.includes(rCond) || rCond.includes(cNorm))) {
    return true;
  }

  const condAsociada = resolverCondicionAsociadaRasgo(r);
  if (condAsociada) {
    const asocNorm = normalizarTextoSeguro(condAsociada);
    if (cNorm === asocNorm || cNorm.includes(asocNorm) || asocNorm.includes(cNorm)) {
      return true;
    }
  }

  const rNom = normalizarTextoSeguro(r.nombre);
  const rId = normalizarTextoSeguro(r.id);

  if (cNorm.includes("furia de los dioses") || cNorm.includes("rage of the gods")) {
    return rNom.includes("furia de los dioses") || rId.includes("furia_de_los_dioses");
  }
  if (cNorm.includes("furia") || cNorm.includes("rage")) {
    return rNom === "furia" || rId === "rasgo_cls_barbaro_furia";
  }
  if (cNorm.includes("temerario") || cNorm.includes("reckless")) {
    return rNom.includes("temerario") || rId.includes("temerario");
  }
  if (cNorm.includes("manto de majestad") || cNorm.includes("manto de la majestad") || cNorm.includes("mantle of majesty")) {
    return rNom.includes("manto de majestad") || rNom.includes("manto de la majestad") || rId.includes("manto_de_majestad");
  }
  if (cNorm.includes("majestad inquebrantable") || cNorm.includes("unbreakable majesty")) {
    return rNom.includes("majestad inquebrantable") || rId.includes("majestad_inquebrantable");
  }

  return false;
}

/**
 * Resuelve el ID del rasgo que debe consumir o recuperar el uso (manejando delegaciones hacia rasgos padre).
 */
export function resolverIdRasgoObjetivoGasto(targetTrait: RasgoPersonaje | undefined, rasgos: RasgoPersonaje[]): string {
  if (!targetTrait) return "";

  const debeGastarDePadre = Boolean(
    targetTrait.gastarDePadre ||
    (targetTrait.ligadoA && (
      normalizarTextoSeguro(targetTrait.ligadoA).includes("inspiracion") ||
      normalizarTextoSeguro(targetTrait.nombre).includes("palabras cortantes") ||
      normalizarTextoSeguro(targetTrait.nombre).includes("habilidad inigualable") ||
      normalizarTextoSeguro(targetTrait.nombre).includes("manto de inspiracion")
    ))
  );

  if (!debeGastarDePadre) {
    return targetTrait.id;
  }

  if (targetTrait.ligadoA) {
    const lig = normalizarTextoSeguro(targetTrait.ligadoA);
    const padre = rasgos.find(
      (r) => normalizarTextoSeguro(r.id) === lig || normalizarTextoSeguro(r.nombre) === lig || (normalizarTextoSeguro(r.nombre).includes("inspiracion") && lig.includes("inspiracion"))
    );
    if (padre) return padre.id;
  }

  const padreInspiracion = rasgos.find((r) => normalizarTextoSeguro(r.nombre).includes("inspiracion bardica"));
  if (padreInspiracion) return padreInspiracion.id;

  return targetTrait.id;
}
