import {
  type PersonajeJugador,
  type RasgoPersonaje
} from "@/tipos";
import { CATALOGO_CLASES_DND55 } from "@/constantes/clasesDND55";
import { normalizar } from "./utilidadesRasgos";
import { evaluarEfectosRasgosActivos } from "./evaluadorExpresionesRasgos";

/**
 * Obtiene la lista consolidada de nombres de conjuros siempre preparados otorgados directamente por rasgos
 * (ej. Palabras de creación de Bardo Nv 20 u opciones Homebrew con conjurosOtorgados o ef.tipo === "conjuro_otorgado").
 */
export function obtenerConjurosOtorgadosPorRasgos(personaje: PersonajeJugador): string[] {
  const conjuros = new Set<string>();
  const pjNivel = personaje.nivel || 1;

  for (const r of personaje.rasgos || []) {
    if (r.activo === false) continue;
    if (r.nivelRequerido && pjNivel < r.nivelRequerido) continue;

    if (Array.isArray(r.conjurosOtorgados)) {
      for (const c of r.conjurosOtorgados) {
        if (c && c.trim()) conjuros.add(c.trim());
      }
    }

    if (Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        const idLower = sel.id.toLowerCase();
        if (
          idLower.includes("truco") ||
          idLower.includes("conjuro") ||
          idLower.includes("hechizo") ||
          idLower.includes("spell") ||
          idLower.includes("cantrip") ||
          idLower.includes("ritual")
        ) {
          if (Array.isArray(sel.valorActual)) {
            for (const val of sel.valorActual) {
              if (val && val.trim()) conjuros.add(val.trim());
            }
          }
        }

        // Extraer conjuros otorgados o gratuitos desde opciones seleccionadas en selectores (ej. Invocaciones)
        if (Array.isArray(sel.valorActual)) {
          for (const opId of sel.valorActual) {
            const baseId = opId.includes(":")
              ? opId.split(":")[0]
              : opId.includes("__")
              ? opId.split("__")[0]
              : opId;
            const opcion = sel.opciones?.find((o) => o.id === opId || o.id === baseId);
            if (opcion) {
              if (opcion.conjuroGratuito && opcion.conjuroGratuito.trim()) {
                conjuros.add(opcion.conjuroGratuito.trim());
              }
              if (Array.isArray(opcion.efectos)) {
                for (const efOp of opcion.efectos) {
                  if (efOp.tipo === "conjuro_otorgado" || efOp.tipo === "conjuro_gratuito") {
                    const cNom = String(efOp.objetivo || efOp.valor).trim();
                    if (cNom) conjuros.add(cNom);
                  }
                }
              }
            }
          }
        }
      }
    }

    if (Array.isArray(r.efectos)) {
      for (const ef of r.efectos) {
        if (ef.tipo === "conjuro_otorgado" || ef.tipo === "conjuro_gratuito") {
          const cNom = String(ef.valor || ef.objetivo).trim();
          if (cNom) conjuros.add(cNom);
        }
      }
    }
  }

  return Array.from(conjuros);
}

/**
 * Retorna la lista de nombres de conjuros que el personaje puede lanzar de forma gratuita
 * (sin gastar espacio de conjuro) a partir de sus rasgos activos o condiciones.
 */
export function obtenerNombresConjurosGratuitosActivos(personaje: PersonajeJugador): string[] {
  if (!personaje) return [];
  const nombres = new Set<string>();

  // 1. Evaluar efectos de rasgos instanciados (incluyendo selectores con efectos)
  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "conjuro_gratuito" && ef.objetivo) {
      nombres.add(String(ef.objetivo).trim());
    }
  }

  // 2. Respaldo para personajes cuyos rasgos aún no están instanciados en ficha pero tienen clase/subclase
  if (nombres.size === 0 && (!personaje.rasgos || personaje.rasgos.length === 0) && personaje.clase) {
    const claseNorm = normalizar(personaje.clase);
    const defClase = CATALOGO_CLASES_DND55.find(
      (c) => normalizar(c.nombre) === claseNorm || normalizar(c.id) === claseNorm
    );
    if (defClase) {
      const nivelSeguro = personaje.nivel || 1;
      const rasgosClase = defClase.rasgos.filter((r) => r.nivel <= nivelSeguro);
      const subNorm = personaje.subclase ? normalizar(personaje.subclase) : "";
      const defSub = subNorm
        ? defClase.subclases.find((s) => normalizar(s.nombre) === subNorm || normalizar(s.id) === subNorm)
        : undefined;
      const rasgosSub = defSub ? defSub.rasgos.filter((r) => r.nivel <= nivelSeguro) : [];
      const condiciones = (personaje.condicionesActivas || []).map(normalizar);

      for (const r of [...rasgosClase, ...rasgosSub]) {
        const condActivarNorm = r.condicionAlActivar ? normalizar(r.condicionAlActivar) : null;
        const estaActivoPorCondicion = Boolean(
          condActivarNorm &&
          condiciones.some((c) => c === condActivarNorm || c.includes(condActivarNorm) || condActivarNorm.includes(c))
        );
        const estaActivo = !condActivarNorm || estaActivoPorCondicion;
        if (!estaActivo) continue;

        for (const ef of r.efectos || []) {
          if (ef.tipo === "conjuro_gratuito" && ef.objetivo) {
            nombres.add(String(ef.objetivo).trim());
          }
        }
      }
    }
  }

  return Array.from(nombres);
}

/**
 * Determina si el personaje tiene una bonificación o rasgo activo que le permita lanzar un conjuro
 * de forma gratuita (sin gastar espacio de conjuro).
 * 
 * Evaluación 100% genérica: interpreta efectos 'conjuro_gratuito' de rasgos activos o de rasgos
 * cuya 'condicionAlActivar' esté presente en condicionesActivas.
 */
export function tieneConjuroGratuitoActivo(personaje: PersonajeJugador, nombreConjuro: string): boolean {
  if (!personaje || !nombreConjuro) return false;
  const nomNorm = normalizar(nombreConjuro);
  const conjurosGratuitos = obtenerNombresConjurosGratuitosActivos(personaje);
  return conjurosGratuitos.some((cg) => {
    const cgNorm = normalizar(cg);
    return cgNorm === nomNorm || nomNorm.includes(cgNorm) || cgNorm.includes(nomNorm);
  });
}

/**
 * Resuelve el ID del rasgo que debe consumir o recuperar el uso cuando se utiliza delegación.
 * Función GENÉRICA PURA: usa los metadatos declarativos gastarDePadre y ligadoA.
 */
export function resolverIdRasgoObjetivoGasto(
  targetTrait: RasgoPersonaje | undefined,
  rasgos: RasgoPersonaje[]
): string {
  if (!targetTrait) return "";
  if (!targetTrait.gastarDePadre) return targetTrait.id;

  // 1. Buscar el rasgo padre por ID o nombre usando ligadoA
  if (targetTrait.ligadoA) {
    const lig = normalizar(targetTrait.ligadoA);
    const padre = rasgos.find(
      (r) => normalizar(r.id) === lig || normalizar(r.nombre) === lig
    );
    if (padre) return padre.id;
  }

  // 2. Heurística estructural agnóstica: si falta ligadoA explícito, buscar un candidato
  // con usos limitados que comparta exactamente el mismo origen y fuente.
  // Solo se resuelve si el candidato es inequívoco (exactamente 1 coincidencia).
  if (targetTrait.fuente) {
    const candidatos = rasgos.filter(
      (r) =>
        r.id !== targetTrait.id &&
        r.tieneUsosLimitados &&
        r.origen === targetTrait.origen &&
        r.fuente === targetTrait.fuente
    );
    if (candidatos.length === 1) return candidatos[0].id;
  }

  return targetTrait.id;
}
