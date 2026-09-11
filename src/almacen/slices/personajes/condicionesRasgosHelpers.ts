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
    return "Furia de los Dioses";
  }
  if ((nom === "furia" || id === "rasgo_cls_barbaro_furia") && !nom.includes("persistente")) {
    return "Furia";
  }
  if (nom.includes("temerario") || id.includes("temerario") || nom.includes("reckless") || id.includes("reckless")) {
    return "Ataque Temerario";
  }
  if (nom.includes("manto de majestad") || nom.includes("manto de la majestad") || id.includes("manto_de_majestad")) {
    return "Manto de Majestad";
  }
  if (nom.includes("majestad inquebrantable") || id.includes("majestad_inquebrantable")) {
    return "Majestad Inquebrantable";
  }
  if (nom.includes("revelacion celestial") || id.includes("revelacion_celestial")) {
    const sel = r.selectores?.find(
      (s) => s.id === "opcion_revelacion_celestial" || s.etiqueta.toLowerCase().includes("revelacion")
    );
    const val = (sel?.valorActual?.[0] || "").toLowerCase();
    if (val.includes("fulgor")) {
      return "Fulgor Interior";
    }
    if (val.includes("mortaja")) {
      return "Mortaja Necrótica";
    }
    return "Alas Celestiales";
  }
  if (nom.includes("vuelo draconico") || id.includes("vuelo_draconico")) {
    return "Vuelo dracónico";
  }
  return undefined;
}

/**
 * Determina si una condición táctica coincide con un rasgo para activación/desactivación reactiva.
 */
export function coincideCondicionConRasgo(condicionTexto: string, r: RasgoPersonaje): boolean {
  const cNorm = normalizarTextoSeguro(condicionTexto);
  if (!cNorm) return false;

  const cBase = cNorm.split(" (")[0].trim();

  const condAsociada = resolverCondicionAsociadaRasgo(r);
  if (condAsociada) {
    const asocNorm = normalizarTextoSeguro(condAsociada);
    if (cNorm === asocNorm) return true;
    const asocBase = asocNorm.split(" (")[0].trim();
    if (asocBase === cBase) return true;
  }

  const rCond = r.condicionAlActivar ? normalizarTextoSeguro(r.condicionAlActivar) : "";
  if (rCond) {
    if (cNorm === rCond) return true;
    const rCondBase = rCond.split(" (")[0].trim();
    if (rCondBase === cBase) return true;
  }

  const rNom = normalizarTextoSeguro(r.nombre);
  const rId = normalizarTextoSeguro(r.id);

  if (cBase.includes("furia de los dioses") || cBase.includes("rage of the gods")) {
    return rNom.includes("furia de los dioses") || rId.includes("furia_de_los_dioses");
  }
  if (cBase === "furia" || cBase === "rage") {
    return (rNom === "furia" || rId === "rasgo_cls_barbaro_furia") && !rNom.includes("dioses") && !rId.includes("dioses");
  }
  if (cBase.includes("temerario") || cBase.includes("reckless")) {
    return (
      rNom.includes("temerario") ||
      rId.includes("temerario") ||
      rNom.includes("reckless") ||
      rId.includes("reckless")
    );
  }
  if (cNorm.includes("manto de majestad") || cNorm.includes("manto de la majestad") || cNorm.includes("mantle of majesty")) {
    return rNom.includes("manto de majestad") || rNom.includes("manto de la majestad") || rId.includes("manto_de_majestad");
  }
  if (cNorm.includes("majestad inquebrantable") || cNorm.includes("unbreakable majesty")) {
    return rNom.includes("majestad inquebrantable") || rId.includes("majestad_inquebrantable");
  }
  if (
    cNorm.includes("alas celestiales") ||
    cNorm.includes("fulgor interior") ||
    cNorm.includes("mortaja necrotica") ||
    cNorm.includes("revelacion celestial")
  ) {
    return rNom.includes("revelacion celestial") || rId.includes("revelacion_celestial");
  }
  if (cNorm.includes("vuelo draconico") || cNorm.includes("draconic flight")) {
    return rNom.includes("vuelo draconico") || rId.includes("vuelo_draconico");
  }

  return false;
}

/**
 * Resuelve el ID del rasgo que debe consumir o recuperar el uso.
 * Función GENÉRICA PURA: usa los metadatos declarativos gastarDePadre y ligadoA.
 * No contiene listas hardcoded de nombres de rasgos.
 */
export function resolverIdRasgoObjetivoGasto(targetTrait: RasgoPersonaje | undefined, rasgos: RasgoPersonaje[]): string {
  if (!targetTrait) return "";

  if (!targetTrait.gastarDePadre) return targetTrait.id;

  // 1. Buscar el rasgo padre por ID o nombre usando ligadoA
  if (targetTrait.ligadoA) {
    const lig = normalizarTextoSeguro(targetTrait.ligadoA);
    const padre = rasgos.find(
      (r) => normalizarTextoSeguro(r.id) === lig || normalizarTextoSeguro(r.nombre) === lig
    );
    if (padre) return padre.id;
  }

  // 2. Fallback de resiliencia si falta ligadoA explícito: buscar rasgo contenedor con usos limitados
  const padreConUsos = rasgos.find(
    (r) => r.id !== targetTrait.id && r.tieneUsosLimitados && (
      normalizarTextoSeguro(r.nombre).includes("inspiracion") ||
      normalizarTextoSeguro(r.id).includes("inspiracion") ||
      normalizarTextoSeguro(r.nombre).includes("furia") ||
      normalizarTextoSeguro(r.id).includes("furia")
    )
  );
  if (padreConUsos) return padreConUsos.id;

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

  const eNorm = normalizarTextoSeguro(nombreEstado);

  return rasgos.map((r) => {
    if (coincideCondicionConRasgo(nombreEstado, r) && (r.esActivable ?? true)) {
      let selectoresActualizados = r.selectores;
      const esRevelacion =
        normalizarTextoSeguro(r.nombre).includes("revelacion celestial") ||
        normalizarTextoSeguro(r.id).includes("revelacion_celestial");

      if (esRevelacion && r.selectores && r.selectores.length > 0) {
        let formaId = "alas_celestiales";
        if (eNorm.includes("fulgor")) formaId = "fulgor_interior";
        else if (eNorm.includes("mortaja")) formaId = "mortaja_necrotica";

        selectoresActualizados = r.selectores.map((s) =>
          s.id === "opcion_revelacion_celestial" || s.etiqueta.toLowerCase().includes("revelacion")
            ? { ...s, valorActual: [formaId] }
            : s
        );
      }

      if (!r.activo) {
        const usosRest =
          typeof r.usosRestantes === "number" ? Math.max(0, r.usosRestantes - 1) : r.usosRestantes;
        return { ...r, activo: true, usosRestantes: usosRest, selectores: selectoresActualizados };
      } else if (selectoresActualizados !== r.selectores) {
        return { ...r, selectores: selectoresActualizados };
      }
    }
    return r;
  });
}

/**
 * Desactiva de forma reactiva los rasgos coincidentes con un nombre de condición o efecto,
 * ejecutando la desactivación en cascada para rasgos dependientes (ej. Furia Divina al desactivar Furia, o Golpe Brutal al desactivar Ataque Temerario).
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
    const esAtaqueTemerarioApagado =
      clavesPadresApagados.has("ataque temerario") ||
      clavesPadresApagados.has("rasgo_cls_barbaro_ataque_temerario") ||
      clavesPadresApagados.has("reckless attack") ||
      clavesPadresApagados.has("reckless");

    rasgosActualizados = rasgosActualizados.map((r) => {
      if (!r.activo) return r;
      if (r.ligadoA) {
        const lig = r.ligadoA.toLowerCase().trim();
        if (
          clavesPadresApagados.has(lig) ||
          (esFuriaApagada && lig.includes("furia") && !lig.includes("dioses")) ||
          (esAtaqueTemerarioApagado && (lig.includes("temerario") || lig.includes("reckless")))
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
          rNom.includes("frenesi") ||
          rId.includes("frenesi") ||
          rNom.includes("furia de los dioses") ||
          rId.includes("furia_de_los_dioses")
        ) {
          return { ...r, activo: false };
        }
      }
      if (esAtaqueTemerarioApagado) {
        const rNom = r.nombre.toLowerCase().trim();
        const rId = r.id.toLowerCase().trim();
        if (rNom.includes("golpe brutal") || rId.includes("golpe_brutal")) {
          return { ...r, activo: false };
        }
      }
      return r;
    });
  }

  return rasgosActualizados;
}
