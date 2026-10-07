import type { RasgoPersonaje } from "@/tipos";
import { EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";

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
  return undefined;
}

/**
 * Determina si una condición táctica coincide con un rasgo para activación/desactivación reactiva.
 */
function claveCondicion(texto: string): string {
  const base = normalizarTextoSeguro(texto).split(" (")[0].trim();
  const efecto = EFECTOS_PREDEFINIDOS.find((e) =>
    [e.nombre, ...(e.aliases || [])].some((alias) => normalizarTextoSeguro(alias).split(" (")[0].trim() === base)
  );
  return efecto ? normalizarTextoSeguro(efecto.nombre).split(" (")[0].trim() : base;
}

export function coincideCondicionConRasgo(condicionTexto: string, r: RasgoPersonaje): boolean {
  const condicion = claveCondicion(condicionTexto);
  if (!condicion) return false;
  const asociada = resolverCondicionAsociadaRasgo(r);
  if (asociada && condicion === claveCondicion(asociada)) return true;

  // Revelación celestial cambia de condición según la forma seleccionada.
  if (["alas celestiales", "fulgor interior", "mortaja necrotica", "revelacion celestial"].includes(condicion)) {
    return normalizarTextoSeguro(r.nombre).includes("revelacion celestial") || r.id.includes("revelacion_celestial");
  }
  return false;
}

export { resolverIdRasgoObjetivoGasto } from "@/servicios/evaluadorEfectosRasgos";


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

      let efectosActualizados = r.efectos;
      if (esRevelacion && (!Array.isArray(efectosActualizados) || efectosActualizados.length === 0)) {
        efectosActualizados = [
          {
            tipo: "bono_dano_ataque",
            objetivo: "todos_ataques",
            valor: "bono_competencia",
            aplicaA: "todos_ataques",
            descripcion: "Revelación celestial (+PB daño en ataques)"
          },
          {
            tipo: "bono_dano_conjuro",
            objetivo: "todos_conjuros",
            valor: "bono_competencia",
            aplicaA: "todos_conjuros",
            descripcion: "Revelación celestial (+PB daño en conjuros)"
          }
        ];
      }

      if (!r.activo) {
        const usosRest =
          typeof r.usosRestantes === "number" ? Math.max(0, r.usosRestantes - 1) : r.usosRestantes;
        return {
          ...r,
          activo: true,
          usosRestantes: usosRest,
          selectores: selectoresActualizados,
          efectos: efectosActualizados
        };
      } else if (selectoresActualizados !== r.selectores || efectosActualizados !== r.efectos) {
        return { ...r, selectores: selectoresActualizados, efectos: efectosActualizados };
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
      clavesPadresApagados.add(normalizarTextoSeguro(r.id));
      clavesPadresApagados.add(normalizarTextoSeguro(r.nombre));
      return { ...r, activo: false };
    }
    return r;
  });

  if (clavesPadresApagados.size > 0) {
    rasgosActualizados = rasgosActualizados.map((r) => {
      if (!r.activo) return r;
      if (r.ligadoA) {
        const lig = normalizarTextoSeguro(r.ligadoA);
        if (clavesPadresApagados.has(lig)) {
          return { ...r, activo: false };
        }
      }
      return r;
    });
  }

  return rasgosActualizados;
}
