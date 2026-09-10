/**
 * procesadorCondiciones.ts
 * -----------------------
 * Servicio puro para el procesamiento, manipulación y evaluación mecánica
 * de condiciones y efectos tácticos D&D 5.5e (2024).
 * 
 * Aplica Strategy Pattern para condiciones apilables e idempotentes,
 * y centraliza la resolución de ventajas, desventajas y modificadores en tiradas d20.
 */

import type { Caracteristica, Habilidad, PersonajeJugador } from "@/tipos";
import { evaluarVentajasDeRasgosEnTirada, estaAtaqueTemerarioActivo } from "@/servicios/evaluadorEfectosRasgos";

export const NIVEL_MAXIMO_CANSANCIO = 6;

/**
 * Contrato que debe implementar cualquier estrategia de condición.
 */
export interface EstrategiaCondicion {
  /** Determina si esta estrategia es aplicable para el nombre de condición dado */
  aplicaPara(condicion: string): boolean;
  /** Aplica la condición sobre la lista actual de condiciones de forma inmutable */
  aplicar(condicionesActuales: readonly string[], nuevaCondicion: string): string[];
}

/**
 * Estrategia para la condición apilable "Cansado" (Exhaustion en D&D 5.5e).
 * Incrementa progresivamente el nivel desde 1 hasta el máximo de 6.
 */
export class EstrategiaCansancio implements EstrategiaCondicion {
  aplicaPara(condicion: string): boolean {
    const normalizada = condicion.trim().toLowerCase();
    return normalizada.includes("cansado") || normalizada.includes("exhausted") || normalizada.includes("agotamiento");
  }

  aplicar(condicionesActuales: readonly string[], _nuevaCondicion: string): string[] {
    const condicionCansadoExistente = condicionesActuales.find((c) => {
      const min = c.toLowerCase();
      return min.startsWith("cansado") || min.startsWith("exhausted") || min.startsWith("agotamiento");
    });

    if (condicionCansadoExistente) {
      const matches = condicionCansadoExistente.match(/\d+/);
      const nivelActual = matches ? parseInt(matches[0], 10) : 1;
      const nuevoNivel = Math.min(NIVEL_MAXIMO_CANSANCIO, nivelActual + 1);

      const condicionesFiltradas = condicionesActuales.filter((c) => {
        const min = c.toLowerCase();
        return !min.startsWith("cansado") && !min.startsWith("exhausted") && !min.startsWith("agotamiento");
      });
      return [...condicionesFiltradas, `Cansado (Niv. ${nuevoNivel})`];
    }

    return [...condicionesActuales, "Cansado (Niv. 1)"];
  }
}

/**
 * Estrategia por defecto para condiciones estándar (Cegado, Paralizado, Envenenado, etc.).
 * Garantiza que la condición no se duplique si ya existe en la lista.
 */
export class EstrategiaCondicionSimple implements EstrategiaCondicion {
  aplicaPara(_condicion: string): boolean {
    return true; // Fallback para cualquier condición estándar
  }

  aplicar(condicionesActuales: readonly string[], nuevaCondicion: string): string[] {
    const limpia = nuevaCondicion.trim();
    if (!limpia) {
      return [...condicionesActuales];
    }

    if (condicionesActuales.includes(limpia)) {
      return [...condicionesActuales];
    }

    return [...condicionesActuales, limpia];
  }
}

// Lista ordenada de estrategias registradas (de más específica a más genérica)
const ESTRATEGIAS: readonly EstrategiaCondicion[] = [
  new EstrategiaCansancio(),
  new EstrategiaCondicionSimple(),
];

/**
 * Obtiene la estrategia adecuada para una condición específica.
 */
function seleccionarEstrategia(condicion: string): EstrategiaCondicion {
  const estrategiaEncontrada = ESTRATEGIAS.find((e) => e.aplicaPara(condicion));
  return estrategiaEncontrada ?? new EstrategiaCondicionSimple();
}

/**
 * Aplica una condición a la lista de condiciones de una criatura,
 * delegando en la estrategia correspondiente (p.ej. apilando "Cansado").
 * Retorna un nuevo arreglo inmutable.
 */
export function aplicarCondicion(
  condicionesActuales: readonly string[],
  nuevaCondicion: string
): string[] {
  const normalizada = nuevaCondicion.trim();
  if (!normalizada) {
    return [...condicionesActuales];
  }

  const estrategia = seleccionarEstrategia(normalizada);
  return estrategia.aplicar(condicionesActuales, normalizada);
}

/**
 * Elimina una condición específica de la lista de condiciones de forma inmutable.
 */
export function quitarCondicion(
  condicionesActuales: readonly string[],
  condicionAQuitar: string
): string[] {
  const normalizada = condicionAQuitar.trim().toLowerCase();
  const baseAQuitar = normalizada.split(" (")[0].trim();
  return condicionesActuales.filter((c) => {
    const cNorm = c.trim().toLowerCase();
    const cBase = cNorm.split(" (")[0].trim();
    return cNorm !== normalizada && cBase !== baseAQuitar;
  });
}

/**
 * Reduce en 1 el nivel de "Cansado" o lo elimina por completo si está en nivel 1.
 */
export function reducirNivelCansancio(condicionesActuales: readonly string[]): string[] {
  const condicionCansadoExistente = condicionesActuales.find((c) => {
    const min = c.toLowerCase();
    return min.startsWith("cansado") || min.startsWith("exhausted") || min.startsWith("agotamiento");
  });

  if (!condicionCansadoExistente) {
    return [...condicionesActuales];
  }

  const matches = condicionCansadoExistente.match(/\d+/);
  const nivelActual = matches ? parseInt(matches[0], 10) : 1;

  const condicionesFiltradas = condicionesActuales.filter((c) => {
    const min = c.toLowerCase();
    return !min.startsWith("cansado") && !min.startsWith("exhausted") && !min.startsWith("agotamiento");
  });

  if (nivelActual <= 1) {
    return condicionesFiltradas;
  }

  return [...condicionesFiltradas, `Cansado (Niv. ${nivelActual - 1})`];
}

// =========================================================================
// MOTOR DE EVALUACIÓN MECÁNICA DE CONDICIONES EN TIRADAS D&D 5.5e (2024)
// =========================================================================

export type TipoTiradaMecanica = "ataque" | "caracteristica" | "salvacion" | "iniciativa";

export interface ContextoTiradaCondiciones {
  tipo: TipoTiradaMecanica;
  caracteristica?: Caracteristica;
  habilidad?: Habilidad;
  esAtaqueMagico?: boolean;
  penalizacionArmadura?: boolean;
  desventajaSigiloArmadura?: boolean;
  condicionesActivas?: readonly string[];
  personaje?: PersonajeJugador;
}

export interface ResultadoEvaluacionCondiciones {
  tieneDesventaja: boolean;
  tieneVentaja: boolean;
  modoEfectivo: "ventaja" | "desventaja" | "plano";
  penalizadorD20: number;
  motivosDesventaja: string[];
  motivosVentaja: string[];
  motivosModificadores: string[];
}

/**
 * Evalúa el impacto mecánico de todas las condiciones activas, penalizaciones de equipo
 * y rasgos mecánicos sobre una tirada d20 bajo las reglas oficiales de D&D 5.5e (2024).
 */
export function evaluarEfectosCondicionesEnTirada(
  contexto: ContextoTiradaCondiciones
): ResultadoEvaluacionCondiciones {
  const motivosDesventaja: string[] = [];
  const motivosVentaja: string[] = [];
  const motivosModificadores: string[] = [];
  let penalizadorD20 = 0;

  const efectosPersonaje = (contexto.personaje?.efectosActivos || []).map((e) => e.nombre.toLowerCase().trim());
  const condiciones = [
    ...(contexto.condicionesActivas || []).map((c) => c.toLowerCase().trim()),
    ...efectosPersonaje
  ];

  // 1. Penalización por Armadura o Escudo sin Competencia (D&D 5.5e)
  if (contexto.penalizacionArmadura) {
    if (contexto.tipo === "ataque") {
      // Desventaja en tiradas de ataque si se utiliza Fuerza o Destreza (o si no se especifica característica en armas)
      if (!contexto.caracteristica || contexto.caracteristica === "fuerza" || contexto.caracteristica === "destreza") {
        motivosDesventaja.push("Armadura sin Competencia (FUE/DES)");
      }
    } else if (contexto.tipo === "caracteristica" || contexto.tipo === "salvacion") {
      if (contexto.caracteristica === "fuerza" || contexto.caracteristica === "destreza") {
        motivosDesventaja.push(`Armadura sin Competencia (${contexto.caracteristica.toUpperCase()})`);
      }
    }
  }

  // 2. Desventaja en Sigilo por Armadura Ruidosa (D&D 5.5e)
  if (contexto.desventajaSigiloArmadura && contexto.habilidad === "sigilo") {
    motivosDesventaja.push("Sigilo Ruidoso (Armadura)");
  }

  // 3. Evaluar ventajas otorgadas por rasgos mecánicos activos del personaje
  if (contexto.personaje) {
    const subtipo =
      contexto.tipo === "salvacion" || contexto.tipo === "caracteristica" || contexto.tipo === "ataque"
        ? contexto.caracteristica
        : contexto.habilidad;

    const resRasgos = evaluarVentajasDeRasgosEnTirada(contexto.personaje, {
      tipoTirada: contexto.tipo,
      subtipo
    });

    if (resRasgos.tieneVentaja) {
      motivosVentaja.push(...resRasgos.razones);
    }
    if (resRasgos.tieneDesventaja) {
      motivosDesventaja.push(...resRasgos.razones);
    }
  }

  // 4. Evaluar condiciones y estados activos del combatiente
  for (const cond of condiciones) {
    // Envenenado (Poisoned): Desventaja en tiradas de ataque y pruebas de característica
    if (cond.startsWith("envenenado") || cond.startsWith("poisoned")) {
      if (contexto.tipo === "ataque") {
        motivosDesventaja.push("Envenenado (Ataque)");
      } else if (contexto.tipo === "caracteristica") {
        motivosDesventaja.push("Envenenado (Prueba)");
      }
    }

    // Asustado (Frightened): Desventaja en pruebas de característica y tiradas de ataque
    if (cond.startsWith("asustado") || cond.startsWith("frightened")) {
      if (contexto.tipo === "ataque") {
        motivosDesventaja.push("Asustado (Ataque)");
      } else if (contexto.tipo === "caracteristica") {
        motivosDesventaja.push("Asustado (Prueba)");
      }
    }

    // Derribado (Prone): Desventaja en tiradas de ataque
    if (cond.startsWith("derribado") || cond.startsWith("prone")) {
      if (contexto.tipo === "ataque") {
        motivosDesventaja.push("Derribado (Ataque)");
      }
    }

    // Cegado (Blinded): Desventaja en tiradas de ataque
    if (cond.startsWith("cegado") || cond.startsWith("blinded")) {
      if (contexto.tipo === "ataque") {
        motivosDesventaja.push("Cegado (Ataque)");
      }
    }

    // Apresado / Restrained: Desventaja en ataques y salvaciones de Destreza
    if (cond.startsWith("apresado") || cond.startsWith("restrained")) {
      if (contexto.tipo === "ataque") {
        motivosDesventaja.push("Apresado (Ataque)");
      } else if (contexto.tipo === "salvacion" && contexto.caracteristica === "destreza") {
        motivosDesventaja.push("Apresado (Salvación DES)");
      }
    }

    // Invisible (Invisible): Ventaja en tiradas de ataque
    if (cond.startsWith("invisible")) {
      if (contexto.tipo === "ataque") {
        motivosVentaja.push("Invisible (Ataque)");
      }
    }

    // Furia de los Dioses (Rage of the Gods): Forma de guerrero divino
    const esFuriaDioses = cond.includes("furia de los dioses") || cond.includes("rage of the gods");
    if (esFuriaDioses && !motivosModificadores.some((m) => m.toLowerCase().includes("furia de los dioses"))) {
      motivosModificadores.push("Furia de los Dioses (Vuelo + Resistencias)");
    }

    // Furia (Rage): Ventaja en pruebas y salvaciones de Fuerza (solo para Furia base, no Furia de los Dioses)
    const esFuriaBase = (cond.startsWith("furia") || cond.startsWith("rage")) && !esFuriaDioses;
    if (esFuriaBase && !motivosVentaja.some((m) => m.toLowerCase().includes("fuerza"))) {
      if (contexto.tipo === "caracteristica" && contexto.caracteristica === "fuerza") {
        motivosVentaja.push("Furia (Fuerza)");
      } else if (contexto.tipo === "salvacion" && contexto.caracteristica === "fuerza") {
        motivosVentaja.push("Furia (Salvación FUE)");
      }
    }

    // Ataque Temerario (Reckless Attack): Ventaja en ataques que usen Fuerza
    if (
      (cond.includes("temerario") || cond.includes("reckless")) &&
      !motivosVentaja.some((m) => m.toLowerCase().includes("temerario"))
    ) {
      if (contexto.tipo === "ataque" && (!contexto.caracteristica || contexto.caracteristica === "fuerza")) {
        motivosVentaja.push("Ataque Temerario (Fuerza)");
      }
    }

    // Hechicería Innata (Innate Sorcery): Ventaja en tiradas de ataque de conjuro
    if (cond.startsWith("hechicería innata") || cond.startsWith("hechiceria innata") || cond.startsWith("innate sorcery")) {
      if (contexto.tipo === "ataque" && contexto.esAtaqueMagico) {
        motivosVentaja.push("Hechicería Innata (Ataque Mágico)");
      }
    }

    // Cansado / Agotamiento (Exhaustion D&D 2024): -2 * nivel a todas las tiradas de d20
    if (cond.startsWith("cansado") || cond.startsWith("exhausted") || cond.startsWith("agotamiento")) {
      const match = cond.match(/\d+/);
      const nivel = match ? parseInt(matchesNumero(cond), 10) : 1;
      const penalizacion = -2 * Math.max(1, Math.min(NIVEL_MAXIMO_CANSANCIO, nivel));
      penalizadorD20 += penalizacion;
      motivosModificadores.push(`Cansancio Niv. ${nivel} (${penalizacion})`);
    }
  }

  // Comprobación de respaldo: Ventaja directa por Ataque Temerario si está activo en el personaje
  if (
    contexto.personaje &&
    contexto.tipo === "ataque" &&
    (!contexto.caracteristica || contexto.caracteristica === "fuerza") &&
    !motivosVentaja.some((m) => m.toLowerCase().includes("temerario")) &&
    estaAtaqueTemerarioActivo(contexto.personaje)
  ) {
    motivosVentaja.push("Ataque Temerario (Fuerza)");
  }

  // Enfoque fanático (Senda del Fanático): Bonificador de Daño de Furia a salvaciones
  if (contexto.tipo === "salvacion" && contexto.personaje) {
    const pj = contexto.personaje;
    const rasgoEnfoque = (pj.rasgos || []).find(
      (r) => (r.id.includes("enfoque_fanatico") || r.nombre.toLowerCase().includes("enfoque fanático") || r.nombre.toLowerCase().includes("enfoque fanatico")) && r.activo
    );
    if (rasgoEnfoque) {
      const claseBarbaro = (pj.clases || []).find((c) => c.nombre.toLowerCase().includes("barbaro") || c.nombre.toLowerCase().includes("bárbaro"));
      const nivelBarbaro = claseBarbaro?.nivel || (pj.clase?.toLowerCase().includes("barbaro") ? pj.nivel || 1 : 1);
      const bonoFuria = nivelBarbaro >= 16 ? 4 : nivelBarbaro >= 9 ? 3 : 2;
      motivosModificadores.push(`Enfoque Fanático (+${bonoFuria})`);
    }
  }

  const tieneDesventaja = motivosDesventaja.length > 0;
  const tieneVentaja = motivosVentaja.length > 0;

  // En D&D 5.5e, si hay al menos una fuente de ventaja y una de desventaja, se anulan mutuamente
  let modoEfectivo: "ventaja" | "desventaja" | "plano" = "plano";
  if (tieneVentaja && !tieneDesventaja) {
    modoEfectivo = "ventaja";
  } else if (tieneDesventaja && !tieneVentaja) {
    modoEfectivo = "desventaja";
  }

  return {
    tieneDesventaja,
    tieneVentaja,
    modoEfectivo,
    penalizadorD20,
    motivosDesventaja,
    motivosVentaja,
    motivosModificadores
  };
}

function matchesNumero(cadena: string): string {
  const m = cadena.match(/\d+/);
  return m ? m[0] : "1";
}
