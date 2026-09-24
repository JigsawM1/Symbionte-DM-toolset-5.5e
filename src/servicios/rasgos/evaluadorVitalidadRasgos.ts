import {
  type PersonajeJugador,
  type RasgoPersonaje,
  type EfectoMecanicoRasgo,
  type Caracteristica
} from "@/tipos";
import {
  normalizar,
  tieneArmaduraEquipada,
  tieneEscudoEquipado
} from "./utilidadesRasgos";
import {
  evaluarEfectosRasgosActivos,
  resolverFormulaDinamica,
  evaluarExpresionNumericaSegura
} from "./evaluadorExpresionesRasgos";

// Reexportar utilidades de armadura para compatibilidad directa
export { tieneArmaduraEquipada, tieneEscudoEquipado };

/**
 * Calcula modificadores a puntuaciones de características provenientes de rasgos
 * (ej. Campeón Primigenio: +4 Fuerza y +4 Constitución, hasta un máximo de 25).
 */
export function calcularModificadoresStatsRasgos(
  personaje: PersonajeJugador
): { bonos: Record<Caracteristica, number>; limitesMaximos: Partial<Record<Caracteristica, number>> } {
  const bonos: Record<Caracteristica, number> = {
    fuerza: 0,
    destreza: 0,
    constitucion: 0,
    inteligencia: 0,
    sabiduria: 0,
    carisma: 0
  };
  const limitesMaximos: Partial<Record<Caracteristica, number>> = {};

  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "modificador_stat") {
      const statNorm = normalizar(ef.objetivo) as Caracteristica;
      if (statNorm in bonos) {
        const valNum = Number(ef.valor) || 0;
        bonos[statNorm] += valNum;
        if (valNum > 0) {
          limitesMaximos[statNorm] = ef.limiteMaximo || 25;
        }
      }
    }
  }

  return { bonos, limitesMaximos };
}

/**
 * Calcula si aplica Defensa sin armadura u otras mecánicas de CA no blindadas por rasgos.
 */
export function calcularDefensaSinArmaduraRasgos(
  personaje: PersonajeJugador,
  modificadores: Record<Caracteristica, number>
): {
  aplica: boolean;
  caracteristicaExtra?: Caracteristica;
  bonoExtra: number;
  nombreRasgo: string;
} | null {
  const armadura = tieneArmaduraEquipada(personaje);
  if (armadura.tieneArmadura) return null; // No aplica si lleva armadura corporal

  const tieneEscudo = tieneEscudoEquipado(personaje);
  const efectos = evaluarEfectosRasgosActivos(personaje);

  for (const ef of efectos) {
    if (ef.tipo === "modificador_ca" && normalizar(ef.objetivo).includes("defensa_sin_armadura")) {
      const statNorm = normalizar(String(ef.valor)) as Caracteristica;
      // Regla de escudo: si permiteEscudo es explícito se respeta; si no, Bárbaro (con) permite escudo y Monje (sab) no permite escudo
      const permiteEscudo = ef.permiteEscudo !== undefined ? ef.permiteEscudo : (statNorm !== "sabiduria");
      if (!permiteEscudo && tieneEscudo) {
        continue;
      }

      if (statNorm in modificadores) {
        return {
          aplica: true,
          caracteristicaExtra: statNorm,
          bonoExtra: modificadores[statNorm] || 0,
          nombreRasgo: ef.descripcion || "Defensa sin armadura"
        };
      }
    }
  }

  return null;
}

/**
 * Calcula el bono numérico total a los puntos de golpe máximos otorgado por rasgos activos
 * (ej. Aguante enano: +1 HP por nivel, Dureza: +2 HP por nivel, Auxilio: +5 HP).
 * Función GENÉRICA PURA: no depende de nombres literales de rasgos ni razas.
 */
export function calcularBonoHPMaximoRasgos(personaje: PersonajeJugador): number {
  if (!personaje) return 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let bonoTotal = 0;

  for (const ef of efectos) {
    if (ef.tipo === "modificador_hp_maximo") {
      const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
      const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
      bonoTotal += valorNumerico;
    }
  }

  return bonoTotal;
}

/**
 * Calcula los puntos de golpe máximos efectivos de un personaje sumando la base y los bonos de rasgos.
 */
export function calcularHPMaximoEfectivo(personaje: PersonajeJugador): number {
  return personaje?.hpMaximo || personaje?.hpMaximoBase || 10;
}

/**
 * Evalúa el valor numérico de puntos de golpe temporales otorgados por un efecto mecánico de rasgo,
 * resolviendo dinámicamente identificadores como "bono_competencia", "nivel", "constitucion" o expresiones numéricas.
 * Función GENÉRICA PURA: agnóstica de clases y especies.
 */
export function calcularHpTemporalDeEfecto(
  efecto: EfectoMecanicoRasgo | undefined,
  personaje: PersonajeJugador
): number {
  if (!efecto || efecto.tipo !== "hp_temporal") return 0;
  const valorStr = String(efecto.valor ?? "").trim();
  if (!valorStr) return 0;

  const numDirecto = Number(valorStr);
  if (!isNaN(numDirecto) && numDirecto > 0) {
    return Math.floor(numDirecto);
  }

  const resuelto = resolverFormulaDinamica(valorStr, personaje);
  const numFinal = evaluarExpresionNumericaSegura(resuelto, { nivel: personaje.nivel });
  return Math.max(0, Math.floor(numFinal));
}

/**
 * Obtiene el efecto de puntos de golpe temporales de un rasgo si lo posee.
 * Función GENÉRICA PURA.
 */
export function obtenerEfectoHpTemporalRasgo(
  rasgo: RasgoPersonaje | undefined
): EfectoMecanicoRasgo | undefined {
  if (!rasgo || !Array.isArray(rasgo.efectos)) return undefined;
  return rasgo.efectos.find((ef) => ef.tipo === "hp_temporal");
}

/**
 * Obtiene el límite máximo de Destreza aplicable a la CA con armaduras medias.
 * Por defecto según reglas D&D 5.5e es 2, pero rasgos/dotes como "Maestro en armaduras medias"
 * pueden elevarlo (ej. a 3).
 */
export function obtenerLimiteDesArmaduraMedia(personaje: PersonajeJugador): number {
  if (!personaje) return 2;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let limite = 2;
  for (const ef of efectos) {
    if (
      ef.tipo === "limite_des_armadura_media" ||
      (ef.tipo === "modificador_ca" && ef.objetivo === "limite_des_armadura_media")
    ) {
      const val = Number(ef.valor);
      if (!isNaN(val) && val > limite) {
        limite = val;
      }
    }
  }
  return limite;
}
