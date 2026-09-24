import {
  type PersonajeJugador,
  type TamanoPersonaje,
  type VelocidadEstructurada
} from "@/tipos";
import { normalizar } from "./utilidadesRasgos";
import {
  evaluarEfectosRasgosActivos,
  resolverFormulaDinamica,
  evaluarExpresionNumericaSegura
} from "./evaluadorExpresionesRasgos";

/**
 * Calcula bonos a la velocidad de movimiento otorgados por rasgos activos.
 * (ej. Movimiento rápido: +10 pies si no lleva armadura pesada).
 */
export function calcularBonoVelocidadRasgos(personaje: PersonajeJugador): number {
  let bonoTotal = 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);

  for (const ef of efectos) {
    if (ef.tipo === "modificador_velocidad") {
      const valNum = Number(ef.valor) || 0;
      bonoTotal += valNum;
    }
  }

  return bonoTotal;
}

/**
 * Calcula el bono numérico total a la iniciativa otorgado por rasgos activos
 * (ej. Dote Alerta: +PB a la tirada de iniciativa).
 * Función GENÉRICA PURA: no depende de nombres literales de rasgos ni razas.
 */
export function calcularBonoIniciativaRasgos(personaje: PersonajeJugador): number {
  if (!personaje) return 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let bonoTotal = 0;

  for (const ef of efectos) {
    if (ef.tipo === "modificador_stat" && ef.objetivo === "iniciativa") {
      const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
      const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
      bonoTotal += valorNumerico;
    }
  }

  return bonoTotal;
}

/**
 * Determina el tamaño efectivo del personaje considerando modificaciones activas (ej. Forma grande).
 * Función GENÉRICA PURA: no hardcodea nombres de rasgos ni razas.
 */
export function obtenerTamanoEfectivo(personaje: PersonajeJugador): TamanoPersonaje {
  if (!personaje) return "Mediano";
  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "modificador_tamano" && ef.valor) {
      const valNorm = normalizar(String(ef.valor));
      if (valNorm.startsWith("grand")) return "Grande";
      if (valNorm.startsWith("median")) return "Mediano";
      if (valNorm.startsWith("pequen")) return "Pequeño";
      if (valNorm.startsWith("diminut")) return "Diminuto";
      return ef.valor as TamanoPersonaje;
    }
  }
  return personaje.tamano || "Mediano";
}

/**
 * Calcula el multiplicador acumulado de capacidad de carga otorgado por rasgos activos
 * (ej. Constitución poderosa: cuenta como una categoría de tamaño superior, x2).
 * Función GENÉRICA PURA: no hardcodea nombres de rasgos ni razas.
 */
export function calcularMultiplicadorCapacidadCarga(personaje: PersonajeJugador): number {
  if (!personaje) return 1;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let mult = 1;
  for (const ef of efectos) {
    if (ef.tipo === "modificador_capacidad_carga") {
      const valNum = Number(ef.valor);
      if (!Number.isNaN(valNum) && valNum > 0) {
        mult *= valNum;
      }
    }
  }
  return mult;
}

/**
 * Calcula todas las velocidades de movimiento efectivas del personaje (caminar, nadar, volar, escalar, excavar)
 * considerando velocidad base, bonos de rasgos y efectos de movimiento especial (ej. Don de las profundidades).
 */
export function obtenerVelocidadesEfectivas(personaje: PersonajeJugador): VelocidadEstructurada {
  const baseCaminar =
    typeof personaje.velocidad === "string"
      ? parseInt(personaje.velocidad, 10) || 30
      : (typeof personaje.velocidad === "number"
        ? personaje.velocidad
        : (personaje.velocidad?.caminar || 30));

  const bonoCaminar = calcularBonoVelocidadRasgos(personaje);
  const caminar = Math.max(0, baseCaminar + bonoCaminar);

  const resultado: VelocidadEstructurada = {
    caminar,
    nadar: typeof personaje.velocidad === "object" ? personaje.velocidad?.nadar : undefined,
    volar: typeof personaje.velocidad === "object" ? personaje.velocidad?.volar : undefined,
    escalar: typeof personaje.velocidad === "object" ? personaje.velocidad?.escalar : undefined,
    excavar: typeof personaje.velocidad === "object" ? personaje.velocidad?.excavar : undefined,
    planea: typeof personaje.velocidad === "object" ? Boolean(personaje.velocidad?.planea) : false
  };

  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "movimiento_especial") {
      const objetivo = String(ef.objetivo || "").toLowerCase();
      if (objetivo.includes("nadar")) {
        const velNadar =
          ef.valor === "nadar" || ef.valor === "caminar" || ef.valor === "velocidad_caminar"
            ? caminar
            : (Number(ef.valor) || caminar);
        resultado.nadar = Math.max(resultado.nadar || 0, velNadar);
      } else if (objetivo.includes("volar")) {
        const velVolar =
          ef.valor === "volar" || ef.valor === "caminar"
            ? caminar
            : (Number(ef.valor) || caminar);
        resultado.volar = Math.max(resultado.volar || 0, velVolar);
      } else if (objetivo.includes("escalar") || objetivo.includes("trepar")) {
        const velEscalar =
          ef.valor === "escalar" || ef.valor === "trepar" || ef.valor === "caminar" || ef.valor === "velocidad_caminar"
            ? caminar
            : (Number(ef.valor) || caminar);
        resultado.escalar = Math.max(resultado.escalar || 0, velEscalar);
      }
    }
  }

  return resultado;
}

export const calcularVelocidadPersonaje = obtenerVelocidadesEfectivas;
