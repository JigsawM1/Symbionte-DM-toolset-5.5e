import type { PersonajeJugador } from "@/tipos";

// ==========================================
// 1. INTERFACES Y CONTRATOS EXTENSIBLES
// ==========================================

export type TipoAccionDescanso =
  | "hp"
  | "dadosGolpe"
  | "cansancio"
  | "salvacionesMuerte"
  | "temporal"
  | "ranura"
  | "recurso";

export interface AccionDescanso {
  tipo: TipoAccionDescanso;
  descripcion: string;
  cambio?: number;
}

export interface ResultadoDescanso {
  personajeActualizado: PersonajeJugador;
  acciones: AccionDescanso[];
}

// ==========================================
// 2. HELPERS MATEMÁTICOS PUROS
// ==========================================

export function calcularModificadorCaracteristica(puntuacion: number): number {
  return Math.floor(((puntuacion || 10) - 10) / 2);
}

export function obtenerValorDadoCaras(tipoDado: string): number {
  switch (tipoDado) {
    case "d6": return 6;
    case "d8": return 8;
    case "d10": return 10;
    case "d12": return 12;
    default: return 8;
  }
}

// ==========================================
// 3. DESCANSO CORTO (D&D 5.5e)
// ==========================================

/**
 * Ejecuta un descanso corto permitiendo gastar dados de golpe para curar HP.
 * Cada dado cura (resultadoTirada + modCON), mínimo 1 punto de golpe por dado.
 */
export function ejecutarDescansoCorto(
  personaje: PersonajeJugador,
  dadosAGastar: number,
  tiradasDados: number[] = []
): ResultadoDescanso {
  const acciones: AccionDescanso[] = [];
  const dadosValidos = Math.max(0, Math.min(dadosAGastar, personaje.dadosGolpeRestantes));

  if (dadosValidos === 0) {
    return {
      personajeActualizado: { ...personaje },
      acciones: [{ tipo: "hp", descripcion: "Descanso corto completado sin gastar dados de golpe." }]
    };
  }

  const scoreCon = personaje.overridesFijos.constitucion ?? personaje.caracteristicas.constitucion;
  const modCon = calcularModificadorCaracteristica(scoreCon);
  const carasDado = obtenerValorDadoCaras(personaje.tipoDadoGolpe);

  let curacionTotal = 0;
  for (let i = 0; i < dadosValidos; i++) {
    const tiradaBase = tiradasDados[i] ?? Math.floor(carasDado / 2) + 1; // Tirada provista o promedio
    const curacionDado = Math.max(1, tiradaBase + modCon);
    curacionTotal += curacionDado;
  }

  const hpPrevio = personaje.hpActual;
  const hpNuevo = Math.min(personaje.hpMaximo, hpPrevio + curacionTotal);
  const curacionEfectiva = hpNuevo - hpPrevio;
  const dadosRestantesNuevos = personaje.dadosGolpeRestantes - dadosValidos;

  acciones.push({
    tipo: "dadosGolpe",
    descripcion: `Gastados ${dadosValidos} ${personaje.tipoDadoGolpe} (${dadosRestantesNuevos}/${personaje.dadosGolpeTotal} restantes).`,
    cambio: -dadosValidos
  });

  acciones.push({
    tipo: "hp",
    descripcion: `Curados +${curacionEfectiva} HP (${hpNuevo}/${personaje.hpMaximo}).`,
    cambio: curacionEfectiva
  });

  // Reiniciar salvaciones de muerte si estaba estabilizándose
  const reinicioMuerte = personaje.salvacionesMuerte.exitos > 0 || personaje.salvacionesMuerte.fallos > 0;
  if (reinicioMuerte) {
    acciones.push({
      tipo: "salvacionesMuerte",
      descripcion: "Salvaciones contra la muerte reiniciadas a 0."
    });
  }

  const personajeActualizado: PersonajeJugador = {
    ...personaje,
    hpActual: hpNuevo,
    dadosGolpeRestantes: dadosRestantesNuevos,
    salvacionesMuerte: { exitos: 0, fallos: 0 }
  };

  return { personajeActualizado, acciones };
}

// ==========================================
// 4. DESCANSO LARGO (D&D 5.5e)
// ==========================================

/**
 * Ejecuta un descanso largo conforme a las reglas oficiales D&D 5.5e:
 * 1. Restaura todos los puntos de golpe al máximo.
 * 2. Restablece los puntos de golpe temporales a 0.
 * 3. Recupera hasta la mitad de los dados de golpe totales (mínimo 1).
 * 4. Reduce en 1 nivel el Cansancio (si es mayor a 0).
 * 5. Reinicia las salvaciones contra la muerte.
 */
export function ejecutarDescansoLargo(personaje: PersonajeJugador): ResultadoDescanso {
  const acciones: AccionDescanso[] = [];

  // 1. Restaurar HP
  const hpPrevio = personaje.hpActual;
  const hpCurado = personaje.hpMaximo - hpPrevio;
  if (hpCurado > 0) {
    acciones.push({
      tipo: "hp",
      descripcion: `HP restaurado al máximo (+${hpCurado} HP: ${personaje.hpMaximo}/${personaje.hpMaximo}).`,
      cambio: hpCurado
    });
  } else {
    acciones.push({
      tipo: "hp",
      descripcion: `HP ya se encontraba al máximo (${personaje.hpMaximo}/${personaje.hpMaximo}).`
    });
  }

  // 2. Limpiar HP temporal
  if (personaje.hpTemporal > 0) {
    acciones.push({
      tipo: "temporal",
      descripcion: `HP Temporal reiniciado (${personaje.hpTemporal} -> 0).`,
      cambio: -personaje.hpTemporal
    });
  }

  // 3. Recuperar Dados de Golpe (la mitad de los totales, mínimo 1)
  const dadosARecuperar = Math.max(1, Math.floor(personaje.dadosGolpeTotal / 2));
  const dadosPrevios = personaje.dadosGolpeRestantes;
  const dadosNuevos = Math.min(personaje.dadosGolpeTotal, dadosPrevios + dadosARecuperar);
  const dadosRecuperadosEfectivos = dadosNuevos - dadosPrevios;

  acciones.push({
    tipo: "dadosGolpe",
    descripcion: `Recuperados +${dadosRecuperadosEfectivos} dados de golpe (${dadosNuevos}/${personaje.dadosGolpeTotal}).`,
    cambio: dadosRecuperadosEfectivos
  });

  // 4. Reducir 1 nivel de Cansancio
  let cansancioNuevo = personaje.cansancio;
  if (personaje.cansancio > 0) {
    cansancioNuevo = Math.max(0, personaje.cansancio - 1);
    acciones.push({
      tipo: "cansancio",
      descripcion: `Cansancio reducido en 1 nivel (${personaje.cansancio} -> ${cansancioNuevo}).`,
      cambio: -1
    });
  }

  // 5. Reiniciar salvaciones contra la muerte
  if (personaje.salvacionesMuerte.exitos > 0 || personaje.salvacionesMuerte.fallos > 0) {
    acciones.push({
      tipo: "salvacionesMuerte",
      descripcion: "Salvaciones contra la muerte reiniciadas a 0."
    });
  }

  const personajeActualizado: PersonajeJugador = {
    ...personaje,
    hpActual: personaje.hpMaximo,
    hpTemporal: 0,
    dadosGolpeRestantes: dadosNuevos,
    cansancio: cansancioNuevo,
    salvacionesMuerte: { exitos: 0, fallos: 0 }
  };

  return { personajeActualizado, acciones };
}
