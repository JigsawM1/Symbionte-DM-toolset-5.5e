/**
 * utilidadesCombateIniciativa.ts
 * ------------------------------
 * Funciones puras compartidas por el dominio de iniciativa, DM y Jugador:
 * - Absorción de daño con vida temporal.
 * - Filtrado de condiciones visibles sin duplicar efectos ni concentración.
 * - Construcción de efectos activos y detección de concentración.
 * - Resolución de plantillas de monstruo o invocación escalable.
 */

import type { CriaturaIniciativa, EfectoActivo, MonstruoBase } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador, PlantillaInvocacion } from "@/tipos";
import type { IndiceMonstruos } from "@/servicios/indiceMonstruos";
import { esCondicionConcentracion } from "@/servicios/procesadorCondiciones";
import { resolverPlantillaPorCriatura } from "@/servicios/resolutorCriaturas";
import {
  obtenerPlantillaInvocacionPorId,
  proyectarInvocacionAMonstruo,
  extraerContextoLanzador
} from "@/servicios/factoriaInvocaciones";
import { generarId } from "@/utiles/generarId";

export interface EstadoVitalBasico {
  vidaActual: number;
  vidaMaxima: number;
  vidaTemporal?: number;
}

/**
 * Aplica daño a una criatura absorbiendo primero los puntos de vida temporales
 * y descontando el excedente de la vida actual sin bajar de 0.
 */
export function aplicarDanoACriaturaIndividual(
  criatura: EstadoVitalBasico,
  dano: number
): { vidaActual: number; vidaTemporal: number } {
  const danoSeguro = Math.max(0, dano);
  let danoRestante = danoSeguro;
  let vidaTemporal = criatura.vidaTemporal || 0;
  let vidaActual = criatura.vidaActual;

  if (vidaTemporal > 0) {
    const absorbido = Math.min(vidaTemporal, danoRestante);
    vidaTemporal -= absorbido;
    danoRestante -= absorbido;
  }

  if (danoRestante > 0) {
    vidaActual = Math.max(0, vidaActual - danoRestante);
  }

  return { vidaActual, vidaTemporal };
}

/**
 * Filtra las condiciones de una criatura ocultando aquellas ya representadas
 * por un efecto activo o por concentración activa para evitar duplicados en UI.
 */
export function obtenerCondicionesVisibles(
  condiciones: readonly string[] = [],
  efectos: readonly { id?: string; nombre: string; concentracion?: boolean }[] = []
): string[] {
  const tieneConcentracion = efectos.some((ef) =>
    esCondicionConcentracion(ef.nombre, ef.id, ef.concentracion)
  );

  const nombresEfectosSet = new Set<string>();
  for (const ef of efectos) {
    const nombreMin = ef.nombre.toLowerCase().trim();
    const nombreBase = ef.nombre.split(" (")[0].toLowerCase().trim();
    nombresEfectosSet.add(nombreMin);
    nombresEfectosSet.add(nombreBase);
  }

  return condiciones.filter((cond) => {
    const condMin = cond.toLowerCase().trim();
    const condBase = cond.split(" (")[0].toLowerCase().trim();
    if (tieneConcentracion && esCondicionConcentracion(condMin)) {
      return false;
    }
    return !nombresEfectosSet.has(condMin) && !nombresEfectosSet.has(condBase);
  });
}

/**
 * Determina si un nombre u opción de efecto corresponde a Concentración.
 */
export function esEfectoConcentracion(
  nombreEfecto: string,
  opciones?: { concentracion?: boolean }
): boolean {
  const normalizado = nombreEfecto.toLowerCase().trim();
  return Boolean(
    opciones?.concentracion ||
    normalizado === "concentración" ||
    normalizado === "concentracion"
  );
}

/**
 * Construye una instancia tipada de EfectoActivo calculando su ronda de expiración.
 */
export function construirEfectoCombate(
  nombreEfecto: string,
  duracion: number,
  rondaActual: number,
  opciones?: { concentracion?: boolean }
): { efecto: EfectoActivo; esConcentracion: boolean } {
  const esConcentracion = esEfectoConcentracion(nombreEfecto, opciones);
  const prefijo = nombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20);
  const efecto: EfectoActivo = {
    id: generarId(prefijo),
    nombre: nombreEfecto,
    expiraRonda: esConcentracion ? undefined : rondaActual + duracion,
    concentracion: esConcentracion || undefined
  };

  return { efecto, esConcentracion };
}

/**
 * Elimina condiciones textuales solapadas al aplicar un efecto equivalente.
 */
export function filtrarCondicionesSolapadasPorEfecto(
  condiciones: readonly string[] | undefined,
  nombreEfecto: string,
  esConcentracion: boolean
): string[] {
  const nombreMin = nombreEfecto.toLowerCase().trim();
  const nombreBase = nombreEfecto.split(" (")[0].toLowerCase().trim();

  return (condiciones || []).filter((cond) => {
    const condMin = cond.toLowerCase().trim();
    if (esConcentracion && condMin.includes("concentra")) {
      return false;
    }
    const condBase = cond.split(" (")[0].toLowerCase().trim();
    return condBase !== nombreBase && condMin !== nombreMin;
  });
}

export interface OpcionesResolverPlantillaCombate {
  asociacionesFichas: Record<string, string>;
  indiceMonstruos: IndiceMonstruos;
  personajes: PersonajeJugador[];
  baseDatosInvocaciones: PlantillaInvocacion[];
}

/**
 * Resuelve la plantilla de estadísticas de una criatura en iniciativa,
 * proyectando invocaciones escalables si pertenece a un acompañante/invocación.
 */
export function resolverPlantillaCombateCriatura(
  criatura: CriaturaIniciativa,
  opciones: OpcionesResolverPlantillaCombate
): MonstruoBase | null {
  const { asociacionesFichas, indiceMonstruos, personajes, baseDatosInvocaciones } = opciones;

  if (criatura.idPlantillaAsociada) {
    const plantillaInv = obtenerPlantillaInvocacionPorId(
      criatura.idPlantillaAsociada,
      baseDatosInvocaciones
    );
    if (plantillaInv) {
      const pjDuenio =
        personajes.find(
          (p) =>
            p.id === criatura.idPersonajeDuenio ||
            (p.acompanantes || []).some(
              (a) =>
                a.id === criatura.idAcompanante ||
                (Boolean(a.idMiniaturaTS) && a.idMiniaturaTS === criatura.id)
            )
        ) || personajes[0];

      const acomp = pjDuenio?.acompanantes?.find(
        (a) =>
          a.id === criatura.idAcompanante ||
          (Boolean(a.idMiniaturaTS) && a.idMiniaturaTS === criatura.id) ||
          a.idPlantilla === criatura.idPlantillaAsociada
      );

      if (pjDuenio) {
        const contexto = extraerContextoLanzador(pjDuenio);
        return proyectarInvocacionAMonstruo(
          plantillaInv,
          acomp?.nivelConjuroInvocacion || 2,
          contexto,
          acomp?.subtipoInvocacion
        );
      }
    }
  }

  if (!criatura.esMonstruo && !criatura.idPlantillaAsociada) {
    return null;
  }

  return (
    resolverPlantillaPorCriatura(
      criatura.id,
      criatura.nombre,
      asociacionesFichas,
      indiceMonstruos
    ) || null
  );
}

/**
 * Obtiene la Percepción Pasiva desde una plantilla de monstruo con fallback seguro a 10.
 */
export function obtenerPercepcionPasivaPlantilla(plantilla: MonstruoBase | null): number {
  if (!plantilla?.sentidos || typeof plantilla.sentidos !== "object") return 10;
  return plantilla.sentidos.percepcionPasiva ?? 10;
}
