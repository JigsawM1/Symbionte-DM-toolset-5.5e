import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { normalizar } from "./utilidadesRasgos";
import { resolverFormulaDinamica } from "./evaluadorExpresionesRasgos";

/**
 * Determina si un rasgo pertenece a la mecánica de Canalizar Divinidad (recurso o efecto que lo consume).
 */
export function esRasgoCanalizarDivinidad(rasgo: RasgoPersonaje): boolean {
  const nomNorm = normalizar(rasgo.nombre);
  const idNorm = normalizar(rasgo.id);
  const ligadoNorm = rasgo.ligadoA ? normalizar(rasgo.ligadoA) : "";

  return (
    nomNorm === "canalizar divinidad" ||
    nomNorm.includes("canalizar divinidad") ||
    idNorm.includes("canalizar_divinidad") ||
    ligadoNorm.includes("canalizar divinidad")
  );
}

/**
 * Resuelve los recursos padre en rasgos dependientes (usos compartidos o dados de daño/inspiración heredados).
 */
export function resolverRecursosPadre(
  personaje: PersonajeJugador | null,
  rasgo: RasgoPersonaje
): {
  usosPadre?: { restantes: number; maximos: number; nombre: string };
  formulaDadosEfectiva?: string;
} {
  if (!personaje) {
    return { usosPadre: undefined, formulaDadosEfectiva: undefined };
  }

  let padre: RasgoPersonaje | undefined;
  if (rasgo.ligadoA) {
    const lig = normalizar(rasgo.ligadoA);
    padre = (personaje.rasgos || []).find(
      (r) => normalizar(r.id) === lig || normalizar(r.nombre) === lig
    );
  }
  // Heurística estructural agnóstica si no se especificó ligadoA
  if (!padre && (rasgo.gastarDePadre || rasgo.heredarDadosPadre) && rasgo.fuente) {
    const candidatos = (personaje.rasgos || []).filter(
      (r) =>
        r.id !== rasgo.id &&
        r.tieneUsosLimitados &&
        r.origen === rasgo.origen &&
        r.fuente === rasgo.fuente
    );
    if (candidatos.length === 1) padre = candidatos[0];
  }

  const usosPadre =
    rasgo.gastarDePadre && padre
      ? {
          restantes: padre.usosRestantes ?? (padre.usosMaximos || 1),
          maximos: padre.usosMaximos || 1,
          nombre: padre.nombre
        }
      : undefined;

  const formulaBase = rasgo.heredarDadosPadre
    ? padre?.formulaDados || rasgo.formulaDados
    : rasgo.formulaDados;

  const claseContexto = rasgo.fuente;

  const formulaDadosEfectiva = formulaBase
    ? resolverFormulaDinamica(formulaBase, personaje, claseContexto)
    : undefined;

  return { usosPadre, formulaDadosEfectiva };
}
