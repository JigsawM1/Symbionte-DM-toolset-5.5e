import type { PersonajeJugador } from "@/tipos";
import { ARMADURAS_OFICIALES } from "@/constantes/equipoConstantes";

/**
 * Normaliza cadenas para comparaciones robustas e insensibles a mayúsculas/diacríticos.
 */
export function normalizar(texto: string = ""): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Comprueba si un rasgo específico está activo en el personaje.
 */
export function estaRasgoActivo(personaje: PersonajeJugador, rasgoIdONombre: string): boolean {
  const busqueda = normalizar(rasgoIdONombre);
  if (!busqueda) return false;
  const rasgo = (personaje.rasgos || []).find((r) => {
    const idNorm = normalizar(r.id);
    const nomNorm = normalizar(r.nombre);
    return (
      idNorm === busqueda ||
      idNorm.includes(busqueda) ||
      nomNorm === busqueda ||
      nomNorm.includes(busqueda)
    );
  });
  if (!rasgo) return false;
  return rasgo.activo !== false;
}

/**
 * Comprueba si la Furia del bárbaro está activa actualmente.
 */
export function estaFuriaActiva(personaje: PersonajeJugador): boolean {
  const enCondiciones = (personaje.condicionesActivas || []).some((c) => {
    const norm = normalizar(c);
    return (norm === "furia" || norm.includes("furia")) && !norm.includes("furia de los dioses");
  });
  if (enCondiciones) return true;

  const enEfectos = (personaje.efectosActivos || []).some((e) => {
    const norm = normalizar(e.nombre);
    return (norm === "furia" || norm.includes("furia")) && !norm.includes("furia de los dioses");
  });
  if (enEfectos) return true;

  return estaRasgoActivo(personaje, "furia");
}

/**
 * Comprueba si el Ataque Temerario está activo actualmente (vía condiciones, efectos o rasgo).
 */
export function estaAtaqueTemerarioActivo(personaje: PersonajeJugador): boolean {
  // 1. Comprobar en condiciones activas
  const enCondiciones = (personaje.condicionesActivas || []).some((c) => {
    const norm = normalizar(c);
    return norm.includes("temerario") || norm.includes("reckless");
  });
  if (enCondiciones) return true;

  // 2. Comprobar en efectos temporales activos (Combat Tracker / Ficha)
  const enEfectos = (personaje.efectosActivos || []).some((e) => {
    const norm = normalizar(e.nombre);
    return norm.includes("temerario") || norm.includes("reckless");
  });
  if (enEfectos) return true;

  // 3. Comprobar en rasgos conmutados activos del personaje
  const rasgoActivo = (personaje.rasgos || []).some((r) => {
    if (r.activo === false) return false;
    const idNorm = normalizar(r.id);
    const nomNorm = normalizar(r.nombre);
    return (
      idNorm.includes("temerario") ||
      idNorm.includes("reckless") ||
      nomNorm.includes("temerario") ||
      nomNorm.includes("reckless")
    );
  });
  if (rasgoActivo) return true;

  return estaRasgoActivo(personaje, "ataque temerario");
}

/**
 * Comprueba si la Revelación Celestial (Asimar) está activa actualmente
 * (vía condiciones activas, efectos temporales en Combat Tracker o conmutador de rasgo).
 */
export function estaRevelacionCelestialActiva(personaje: PersonajeJugador): boolean {
  // 1. Comprobar en condiciones activas
  const enCondiciones = (personaje.condicionesActivas || []).some((c) => {
    const norm = normalizar(c);
    return (
      norm.includes("alas celestiales") ||
      norm.includes("fulgor interior") ||
      norm.includes("mortaja necrotica") ||
      norm.includes("revelacion celestial")
    );
  });
  if (enCondiciones) return true;

  // 2. Comprobar en efectos temporales activos (Combat Tracker / Ficha)
  const enEfectos = (personaje.efectosActivos || []).some((e) => {
    const norm = normalizar(e.nombre);
    return (
      norm.includes("alas celestiales") ||
      norm.includes("fulgor interior") ||
      norm.includes("mortaja necrotica") ||
      norm.includes("revelacion celestial")
    );
  });
  if (enEfectos) return true;

  // 3. Comprobar en rasgos del personaje
  const rasgoActivo = (personaje.rasgos || []).some((r) => {
    if (r.activo === false) return false;
    const idNorm = normalizar(r.id);
    const nomNorm = normalizar(r.nombre);
    return (
      idNorm.includes("revelacion celestial") ||
      idNorm.includes("revelacion_celestial") ||
      nomNorm.includes("revelacion celestial") ||
      nomNorm.includes("revelacion_celestial")
    );
  });
  if (rasgoActivo) return true;

  return estaRasgoActivo(personaje, "revelacion celestial");
}

/**
 * Calcula el Bono de Competencia estándar de un personaje según su nivel global.
 */
export function obtenerBonoCompetenciaPersonaje(personaje: PersonajeJugador): number {
  const nivelGlobal = personaje.nivel || 1;
  return Math.floor((nivelGlobal - 1) / 4) + 2;
}

/**
 * Obtiene el nivel de una clase específica para el personaje (soporte multiclase).
 */
export function obtenerNivelClasePersonaje(personaje: PersonajeJugador, nombreClase: string): number {
  const nomNorm = normalizar(nombreClase);
  const enClases = (personaje.clases || []).find((c) => normalizar(c.nombre).includes(nomNorm));
  if (enClases) return enClases.nivel;
  if (normalizar(personaje.clase || "").includes(nomNorm)) {
    return personaje.nivel || 1;
  }
  return 0;
}

/**
 * Calcula el bonificador numérico de daño de Furia oficial D&D 5.5e según el nivel de Bárbaro:
 * - Niveles 1-8: +2
 * - Niveles 9-15: +3
 * - Niveles 16-20: +4
 */
export function obtenerBonoDanoFuria(nivelBarbaro: number): number {
  if (nivelBarbaro >= 16) return 4;
  if (nivelBarbaro >= 9) return 3;
  return 2;
}

/**
 * Determina si el personaje tiene equipada una armadura corporal (excluyendo escudos).
 */
export function tieneArmaduraEquipada(personaje: PersonajeJugador): {
  tieneArmadura: boolean;
  esPesada: boolean;
  tipo: "Sin Armadura" | "Ligera" | "Mediana" | "Pesada";
  nombre: string | null;
} {
  const inventario = personaje.inventario || [];
  const armaduraObj = inventario.find(
    (o) => o.equipado && o.categoria === "armaduras"
  );

  if (!armaduraObj) {
    return { tieneArmadura: false, esPesada: false, tipo: "Sin Armadura", nombre: null };
  }

  const nombreNorm = normalizar(armaduraObj.nombre);
  const ref = ARMADURAS_OFICIALES[nombreNorm];
  const esPesada = ref ? ref.tipo === "Pesada" : nombreNorm.includes("placas") || nombreNorm.includes("pesada");
  const tipo = ref ? ref.tipo : (esPesada ? "Pesada" : "Mediana");

  return { tieneArmadura: true, esPesada, tipo, nombre: armaduraObj.nombre };
}

/**
 * Determina si el personaje tiene un escudo equipado.
 */
export function tieneEscudoEquipado(personaje: PersonajeJugador): boolean {
  const inventario = personaje.inventario || [];
  return inventario.some(
    (o) => o.equipado && o.categoria === "escudos"
  );
}
