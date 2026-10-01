import {
  type PersonajeJugador,
  type TamanoPersonaje,
  type VelocidadEstructurada,
  type SentidosEstructurados
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
 * considerando velocidad base, bonos/penalizaciones de rasgos, cansancio, efectos de movimiento especial
 * y condiciones tácticas (ej. Apresado -> 0 ft, Lentitud/Mitad -> x0.5, Puntería Estable -> 0 ft).
 */
export function obtenerVelocidadesEfectivas(personaje: PersonajeJugador): VelocidadEstructurada {
  if (!personaje) {
    return { caminar: 30, planea: false };
  }

  // 1. Velocidad base al caminar y bonos/penalizaciones numéricas
  const baseCaminar =
    typeof personaje.velocidad === "string"
      ? parseInt(personaje.velocidad, 10) || 30
      : (typeof personaje.velocidad === "number"
        ? personaje.velocidad
        : (personaje.velocidad?.caminar || 30));

  const bonoCaminar = calcularBonoVelocidadRasgos(personaje);
  let caminar = Math.max(0, baseCaminar + bonoCaminar);

  let nadar = typeof personaje.velocidad === "object" ? personaje.velocidad?.nadar : undefined;
  let volar = typeof personaje.velocidad === "object" ? personaje.velocidad?.volar : undefined;
  let escalar = typeof personaje.velocidad === "object" ? personaje.velocidad?.escalar : undefined;
  let excavar = typeof personaje.velocidad === "object" ? personaje.velocidad?.excavar : undefined;
  const planea = typeof personaje.velocidad === "object" ? Boolean(personaje.velocidad?.planea) : false;

  // 2. Efectos de movimiento especial (ej. otorgar velocidad de escalar/nadar/volar igual a caminar)
  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "movimiento_especial") {
      const objetivo = String(ef.objetivo || "").toLowerCase();
      if (objetivo.includes("nadar")) {
        const velNadar =
          ef.valor === "nadar" || ef.valor === "caminar" || ef.valor === "velocidad_caminar"
            ? caminar
            : (Number(ef.valor) || caminar);
        nadar = Math.max(nadar || 0, velNadar);
      } else if (objetivo.includes("volar")) {
        const velVolar =
          ef.valor === "volar" || ef.valor === "caminar"
            ? caminar
            : (Number(ef.valor) || caminar);
        volar = Math.max(volar || 0, velVolar);
      } else if (objetivo.includes("escalar") || objetivo.includes("trepar")) {
        const velEscalar =
          ef.valor === "escalar" || ef.valor === "trepar" || ef.valor === "caminar" || ef.valor === "velocidad_caminar"
            ? caminar
            : (Number(ef.valor) || caminar);
        escalar = Math.max(escalar || 0, velEscalar);
      } else if (objetivo.includes("excavar")) {
        const velExcavar =
          ef.valor === "excavar" || ef.valor === "caminar" || ef.valor === "velocidad_caminar"
            ? caminar
            : (Number(ef.valor) || caminar);
        excavar = Math.max(excavar || 0, velExcavar);
      }
    }
  }

  // 3. Cansancio / Agotamiento D&D 5.5e (2024): -5 pies por nivel de cansancio en todas las velocidades
  const nivelCansancio = (() => {
    if (typeof personaje.cansancio === "number" && personaje.cansancio > 0) {
      return personaje.cansancio;
    }
    const condCansado = (personaje.condicionesActivas || []).find((c) => {
      const min = c.toLowerCase();
      return min.startsWith("cansado") || min.startsWith("exhausted") || min.startsWith("agotamiento");
    });
    if (condCansado) {
      const m = condCansado.match(/\d+/);
      return m ? parseInt(m[0], 10) : 1;
    }
    return 0;
  })();

  if (nivelCansancio > 0) {
    const reduccionCansancio = nivelCansancio * 5;
    caminar = Math.max(0, caminar - reduccionCansancio);
    if (nadar !== undefined && nadar > 0) nadar = Math.max(0, nadar - reduccionCansancio);
    if (volar !== undefined && volar > 0) volar = Math.max(0, volar - reduccionCansancio);
    if (escalar !== undefined && escalar > 0) escalar = Math.max(0, escalar - reduccionCansancio);
    if (excavar !== undefined && excavar > 0) excavar = Math.max(0, excavar - reduccionCansancio);
  }

  // 4. Multiplicadores de velocidad (ej. 0.5 para mitad de velocidad por efectos/hechizos)
  let multiplicadorVelocidad = 1;
  for (const ef of efectos) {
    if (ef.tipo === "multiplicador_velocidad") {
      const valNum = Number(ef.valor);
      if (!Number.isNaN(valNum) && valNum >= 0) {
        multiplicadorVelocidad *= valNum;
      }
    }
  }

  // Comprobar condiciones o efectos textuales de reducción a la mitad (ej. Lentitud / Mitad de velocidad)
  const condicionesEfectosTexto = [
    ...(personaje.condicionesActivas || []),
    ...(personaje.efectosActivos || []).map((e) => e.nombre)
  ].map((t) => normalizar(t));

  const tieneEfectoMitadVelocidad = condicionesEfectosTexto.some((t) =>
    t.includes("mitad de velocidad") ||
    t.includes("velocidad a la mitad") ||
    t.includes("half speed") ||
    t === "lentitud" ||
    t.startsWith("lentitud (") ||
    t.includes("ralentizado")
  );

  if (tieneEfectoMitadVelocidad) {
    multiplicadorVelocidad *= 0.5;
  }

  if (multiplicadorVelocidad !== 1) {
    caminar = Math.floor(caminar * multiplicadorVelocidad);
    if (nadar !== undefined) nadar = Math.floor(nadar * multiplicadorVelocidad);
    if (volar !== undefined) volar = Math.floor(volar * multiplicadorVelocidad);
    if (escalar !== undefined) escalar = Math.floor(escalar * multiplicadorVelocidad);
    if (excavar !== undefined) excavar = Math.floor(excavar * multiplicadorVelocidad);
  }

  // 5. Overrides y fijación de velocidad (Fijar a 0 o valor absoluto)
  // a) Condiciones estándar D&D 5.5e que anulan la velocidad a 0
  const tieneCondicionVelocidadCero = condicionesEfectosTexto.some((t) =>
    t.startsWith("apresado") ||
    t.startsWith("grappled") ||
    t.startsWith("agarrado") ||
    t.startsWith("inmovilizado") ||
    t.startsWith("restrained") ||
    t.startsWith("restringido") ||
    t.startsWith("paralizado") ||
    t.startsWith("paralyzed") ||
    t.startsWith("aturdido") ||
    t.startsWith("stunned") ||
    t.startsWith("petrificado") ||
    t.startsWith("petrified") ||
    t.startsWith("inconsciente") ||
    t.startsWith("unconscious") ||
    t.includes("velocidad 0") ||
    t.includes("velocidad a 0") ||
    t.includes("speed 0")
  );

  // b) Efectos de rasgos activos que fijan velocidad a 0 o valor numérico
  let forzarVelocidadCero = tieneCondicionVelocidadCero;
  let fijarValorCaminar: number | null = null;

  for (const ef of efectos) {
    if (ef.tipo === "velocidad_cero") {
      forzarVelocidadCero = true;
    } else if (ef.tipo === "fijar_velocidad") {
      const valNum = Number(ef.valor);
      if (valNum === 0 || ef.valor === "0") {
        forzarVelocidadCero = true;
      } else if (!Number.isNaN(valNum)) {
        fijarValorCaminar = valNum;
      }
    }
  }

  if (forzarVelocidadCero) {
    return {
      caminar: 0,
      nadar: nadar !== undefined ? 0 : undefined,
      volar: volar !== undefined ? 0 : undefined,
      escalar: escalar !== undefined ? 0 : undefined,
      excavar: excavar !== undefined ? 0 : undefined,
      planea
    };
  }

  if (fijarValorCaminar !== null) {
    caminar = fijarValorCaminar;
  }

  return {
    caminar,
    nadar,
    volar,
    escalar,
    excavar,
    planea
  };
}

export const calcularVelocidadPersonaje = obtenerVelocidadesEfectivas;

/**
 * Calcula los sentidos efectivos del personaje (visión en la oscuridad, percepción pasiva, etc.)
 * considerando valores base de especie/ficha y modificaciones otorgadas por rasgos activos
 * (ej. Aspecto de las tierras salvajes: Búho).
 * En D&D 5.5e: Si ya posee visión en la oscuridad, suma el bono; si no poseía, obtiene el valor mínimo indicado.
 */
export function obtenerSentidosEfectivos(personaje: PersonajeJugador): SentidosEstructurados {
  let visionBase = 0;
  let percepcionPasiva = 10;

  if (typeof personaje.sentidos === "string") {
    const match = personaje.sentidos.match(/visi[oó]n en la oscuridad\s*(\d+)/i);
    if (match) {
      visionBase = parseInt(match[1], 10) || 0;
    }
    const matchPP = personaje.sentidos.match(/percepci[oó]n pasiva\s*(\d+)/i);
    if (matchPP) {
      percepcionPasiva = parseInt(matchPP[1], 10) || 10;
    }
  } else if (personaje.sentidos && typeof personaje.sentidos === "object") {
    visionBase = personaje.sentidos.visionOscuridad || 0;
    percepcionPasiva = personaje.sentidos.percepcionPasiva ?? 10;
  }

  const efectos = evaluarEfectosRasgosActivos(personaje);
  let bonoVision = 0;
  let visionMinima = 0;

  for (const ef of efectos) {
    if (
      (ef.tipo === "modificador_stat" || ef.tipo === "personalizado") &&
      (ef.objetivo === "vision_oscuridad" || ef.objetivo === "sentidos.vision_oscuridad")
    ) {
      const valNum = Number(ef.valor) || 0;
      if (valNum > 0) {
        if (visionBase > 0) {
          bonoVision += valNum;
        } else {
          visionMinima = Math.max(visionMinima, valNum);
        }
      }
    }
  }

  const visionFinal = visionBase > 0 ? (visionBase + bonoVision) : visionMinima;

  const resultado: SentidosEstructurados = {
    percepcionPasiva,
    visionOscuridad: visionFinal > 0 ? visionFinal : undefined,
    visionCiega: typeof personaje.sentidos === "object" ? personaje.sentidos?.visionCiega : undefined,
    visionVerdadera: typeof personaje.sentidos === "object" ? personaje.sentidos?.visionVerdadera : undefined,
    sentidoSismico: typeof personaje.sentidos === "object" ? personaje.sentidos?.sentidoSismico : undefined
  };

  return resultado;
}

export const calcularSentidosPersonaje = obtenerSentidosEfectivos;

