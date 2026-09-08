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

/**
 * Activa de forma reactiva los rasgos coincidentes con un nombre de condición o efecto,
 * descontando el uso correspondiente si el rasgo dispone de usos limitados.
 */
export function activarRasgosPorCondicionOEfecto(
  nombreEstado: string,
  rasgos: RasgoPersonaje[]
): RasgoPersonaje[] {
  if (!nombreEstado || !rasgos || rasgos.length === 0) return rasgos;

  return rasgos.map((r) => {
    if (coincideCondicionConRasgo(nombreEstado, r) && (r.esActivable ?? true) && !r.activo) {
      const usosRest =
        typeof r.usosRestantes === "number" ? Math.max(0, r.usosRestantes - 1) : r.usosRestantes;
      return { ...r, activo: true, usosRestantes: usosRest };
    }
    return r;
  });
}

/**
 * Desactiva de forma reactiva los rasgos coincidentes con un nombre de condición o efecto,
 * ejecutando la desactivación en cascada para rasgos dependientes (ej. Furia Divina o Golpe Brutal al desactivar Furia).
 */
export function desactivarRasgosPorCondicionOEfecto(
  nombreEstado: string,
  rasgos: RasgoPersonaje[]
): RasgoPersonaje[] {
  if (!nombreEstado || !rasgos || rasgos.length === 0) return rasgos;

  const clavesPadresApagados = new Set<string>();

  let rasgosActualizados = rasgos.map((r) => {
    if (coincideCondicionConRasgo(nombreEstado, r) && (r.esActivable ?? true) && r.activo) {
      clavesPadresApagados.add(r.id.toLowerCase());
      clavesPadresApagados.add(r.nombre.toLowerCase().trim());
      return { ...r, activo: false };
    }
    return r;
  });

  if (clavesPadresApagados.size > 0) {
    const esFuriaApagada =
      clavesPadresApagados.has("furia") || clavesPadresApagados.has("rasgo_cls_barbaro_furia");

    rasgosActualizados = rasgosActualizados.map((r) => {
      if (!r.activo) return r;
      if (r.ligadoA) {
        const lig = r.ligadoA.toLowerCase().trim();
        if (
          clavesPadresApagados.has(lig) ||
          (esFuriaApagada && lig.includes("furia") && !lig.includes("dioses"))
        ) {
          return { ...r, activo: false };
        }
      }
      if (esFuriaApagada) {
        const rNom = r.nombre.toLowerCase().trim();
        const rId = r.id.toLowerCase().trim();
        if (
          rNom.includes("furia divina") ||
          rId.includes("furia_divina") ||
          rNom.includes("golpe brutal") ||
          rId.includes("golpe_brutal") ||
          rNom.includes("furia de los dioses") ||
          rId.includes("furia_de_los_dioses")
        ) {
          return { ...r, activo: false };
        }
      }
      return r;
    });
  }

  return rasgosActualizados;
}
