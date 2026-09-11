import {
  type PersonajeJugador,
  type EfectoMecanicoRasgo,
  type Caracteristica,
  type Habilidad,
  type GradoCompetencia,
  GRADOS_HABILIDADES_DEFECTO
} from "@/tipos";
import { ARMADURAS_OFICIALES } from "@/constantes/equipoConstantes";
import { CATALOGO_CLASES_DND55 } from "@/constantes/clasesDND55";


/**
 * Normaliza cadenas para comparaciones robustas e insensibles a mayúsculas/diacríticos.
 */
function normalizar(texto: string = ""): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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
    (o) =>
      o.equipado &&
      (o.tipoPrincipal === "Armadura" || ("tipo" in o && (o as { tipo?: unknown }).tipo === "armadura")) &&
      !normalizar(o.nombre).includes("escudo")
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
    (o) => o.equipado && (normalizar(o.nombre).includes("escudo") || (o.tipoPrincipal === "Armadura" && normalizar(o.nombre).startsWith("escudo")))
  );
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
 * Evalúa las condiciones contextuales de un efecto mecánico de rasgo.
 */
function cumpleCondicionEfecto(
  condicion: string | null | undefined,
  personaje: PersonajeJugador
): boolean {
  if (!condicion || condicion === "siempre") return true;

  const condNorm = normalizar(condicion);
  const estadoArmadura = tieneArmaduraEquipada(personaje);
  const tieneEscudo = tieneEscudoEquipado(personaje);

  if (condNorm === "furia_activa") {
    return estaFuriaActiva(personaje);
  }
  if (
    condNorm === "ataque_temerario_activo" ||
    condNorm === "ataque_temerario" ||
    condNorm === "ataque temerario" ||
    condNorm === "reckless" ||
    condNorm === "reckless_attack"
  ) {
    return estaAtaqueTemerarioActivo(personaje);
  }
  if (
    condNorm === "furia_y_temerario_activos" ||
    condNorm === "furia_y_ataque_temerario_activos"
  ) {
    return estaFuriaActiva(personaje) && estaAtaqueTemerarioActivo(personaje);
  }
  if (condNorm === "sin_armadura") {
    return !estadoArmadura.tieneArmadura;
  }
  if (condNorm === "sin_armadura_ni_escudo") {
    return !estadoArmadura.tieneArmadura && !tieneEscudo;
  }
  if (condNorm === "sin_armadura_pesada") {
    return !estadoArmadura.esPesada;
  }

  // Si coincide con alguna condición activa del personaje
  if ((personaje.condicionesActivas || []).some((c) => normalizar(c) === condNorm || normalizar(c).includes(condNorm))) {
    return true;
  }

  // Si coincide con algún rasgo activo del personaje
  if (estaRasgoActivo(personaje, condicion)) {
    return true;
  }

  return true;
}

/**
 * Evalúa y extrae todos los efectos mecánicos activos de los rasgos del personaje.
 * Valida estado activo, dependencias ligadas (`ligadoA`) y condiciones de activación.
 */
export function evaluarEfectosRasgosActivos(personaje: PersonajeJugador): EfectoMecanicoRasgo[] {
  const efectosResultado: EfectoMecanicoRasgo[] = [];
  const rasgos = personaje.rasgos || [];

  for (const rasgo of rasgos) {
    const nomNorm = normalizar(rasgo.nombre);
    const idNorm = normalizar(rasgo.id);
    const esRevelacion =
      nomNorm.includes("revelacion celestial") ||
      idNorm.includes("revelacion_celestial");

    // Si es Revelación celestial y está activa globalmente (condición o efecto en barra táctica), considerarla activa
    const estaActivo = rasgo.activo !== false || (esRevelacion && estaRevelacionCelestialActiva(personaje));

    // Si el rasgo está desactivado explícitamente, omitirlo
    if (!estaActivo) continue;

    // Si está ligado a otro rasgo, verificar que el padre esté activo
    if (rasgo.ligadoA) {
      const padreActivo = estaRasgoActivo(personaje, rasgo.ligadoA);
      if (!padreActivo) continue;
    }

    // Efectos base del rasgo (con hidratación de respaldo si proviene de un snapshot antiguo de localStorage)
    let efectosBase = rasgo.efectos;
    if (esRevelacion && (!Array.isArray(efectosBase) || efectosBase.length === 0)) {
      efectosBase = [
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

    // 1. Efectos base del rasgo
    if (Array.isArray(efectosBase)) {
      for (const efecto of efectosBase) {
        if (efecto.activo !== false && cumpleCondicionEfecto(efecto.condicion, personaje)) {
          efectosResultado.push({
            ...efecto,
            descripcion: efecto.descripcion || `${rasgo.nombre}`
          });
        }
      }
    }

    // 2. Efectos procedentes de opciones seleccionadas en selectores
    if (Array.isArray(rasgo.selectores)) {
      for (const selector of rasgo.selectores) {
        const selecciones = selector.valorActual || [];
        for (const opId of selecciones) {
          const opcion = selector.opciones.find((o) => o.id === opId);
          if (opcion && Array.isArray(opcion.efectos)) {
            for (const efOp of opcion.efectos) {
              if (efOp.activo !== false && cumpleCondicionEfecto(efOp.condicion, personaje)) {
                efectosResultado.push({
                  ...efOp,
                  descripcion: efOp.descripcion || `${rasgo.nombre} (${opcion.nombre})`
                });
              }
            }
          }
        }
      }
    }
  }

  return efectosResultado;
}

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
 * Ventajas y desventajas directas otorgadas por rasgos activos del personaje
 * para consultar en tiradas d20 (salvaciones, iniciativa, ataques).
 */
export interface ConsultaVentajaRasgo {
  tipoTirada: "salvacion" | "iniciativa" | "ataque" | "caracteristica";
  subtipo?: string; // ej. "destreza", "fuerza", "atletismo"
}

export function evaluarVentajasDeRasgosEnTirada(
  personaje: PersonajeJugador,
  consulta: ConsultaVentajaRasgo
): { tieneVentaja: boolean; tieneDesventaja: boolean; razones: string[] } {
  const efectos = evaluarEfectosRasgosActivos(personaje);
  const razones: string[] = [];
  let tieneVentaja = false;
  let tieneDesventaja = false;

  const subtipoNorm = normalizar(consulta.subtipo || "");
  const tipoTirada = normalizar(consulta.tipoTirada || (consulta as unknown as { tipo?: string }).tipo || "");

  for (const ef of efectos) {
    const objNorm = normalizar(ef.objetivo);
    const esVentaja = ef.tipo === "ventaja" || (ef.tipo as string) === "ventaja_tirada";

    // 1. Tiradas de Salvación
    if (tipoTirada === "salvacion") {
      if (esVentaja) {
        if (
          objNorm === `salvacion.${subtipoNorm}` ||
          objNorm === `salvacion_${subtipoNorm}` ||
          (objNorm === "salvacion.fuerza" && subtipoNorm === "fuerza") ||
          (objNorm === "salvacion.destreza" && subtipoNorm === "destreza")
        ) {
          tieneVentaja = true;
          razones.push(ef.descripcion || `Ventaja en salvación de ${subtipoNorm}`);
        }
      }
    }

    // 2. Tiradas de Iniciativa
    if (tipoTirada === "iniciativa") {
      if (esVentaja && (objNorm === "iniciativa" || objNorm === "tirada_iniciativa")) {
        tieneVentaja = true;
        razones.push(ef.descripcion || "Ventaja en iniciativa");
      }
    }

    // 3. Tiradas de Ataque
    if (tipoTirada === "ataque") {
      if (esVentaja) {
        if (objNorm === "ataque_fuerza" && (subtipoNorm === "fuerza" || subtipoNorm === "")) {
          tieneVentaja = true;
          razones.push(ef.descripcion || "Ventaja en ataques con Fuerza");
        }
      }
    }

    // 4. Pruebas de Característica / Habilidad
    if (tipoTirada === "caracteristica" || tipoTirada === "habilidad") {
      if (esVentaja) {
        if (objNorm === `prueba.${subtipoNorm}` || (objNorm === "prueba.fuerza" && subtipoNorm === "fuerza")) {
          tieneVentaja = true;
          razones.push(ef.descripcion || `Ventaja en pruebas de ${subtipoNorm}`);
        }
      }
    }
  }

  return { tieneVentaja, tieneDesventaja, razones };
}

/**
 * Contexto de un ataque físico o mágico para evaluar si aplican efectos de rasgos.
 */
export interface ContextoAtaquePersonaje {
  tipo: "arma" | "desarmado" | "improvisada" | "conjuro";
  caracteristica: Caracteristica;
  esCuerpoACuerpo: boolean;
  esDistancia: boolean;
}

/**
 * Resuelve fórmulas escaladas dinámicas basadas en el nivel del personaje o clase.
 * Soporta:
 * - "1d6 + mitad_nivel" -> ej. "1d6+2"
 * - "1d8 + nivel" -> ej. "1d8+5"
 * - "mitad_nivel" -> "2"
 * - "dano_furia" -> "2", "3" o "4"
 */
export function resolverFormulaDinamica(
  formula: string | number,
  personaje: PersonajeJugador,
  nombreClaseContexto?: string
): string {
  if (typeof formula === "number") return String(formula);
  if (!formula || typeof formula !== "string") return "";

  const nivelGlobal = personaje.nivel || 1;
  const nivelClase = nombreClaseContexto
    ? obtenerNivelClasePersonaje(personaje, nombreClaseContexto) || nivelGlobal
    : nivelGlobal;
  const mitadNivel = Math.max(1, Math.floor(nivelClase / 2));
  const nivelBarbaro = obtenerNivelClasePersonaje(personaje, "barbaro") || nivelGlobal;
  const bonoFuria = obtenerBonoDanoFuria(nivelBarbaro);
  const bonoCompetencia = Math.floor((nivelGlobal - 1) / 4) + 2;

  const reemplazado = formula
    .replace(/dano_furia/gi, String(bonoFuria))
    .replace(/mitad_nivel/gi, String(mitadNivel))
    .replace(/bono_competencia/gi, String(bonoCompetencia))
    .replace(/\b(pb|bc)\b/gi, String(bonoCompetencia))
    .replace(/\bnivel\b/gi, String(nivelClase))
    .replace(/(\d+)\s+d/gi, "$1d")
    .trim();

  return reemplazado;
}

/**
 * Evalúa expresiones numéricas sencillas y seguras (ej. "3", "+2", "-1", "2+3")
 * sin recurrir a eval(), garantizando rendimiento y seguridad.
 */
export function evaluarExpresionNumericaSegura(expresion: string | number): number {
  if (typeof expresion === "number") return isNaN(expresion) ? 0 : expresion;
  if (!expresion || typeof expresion !== "string") return 0;

  const limpia = expresion.replace(/\s+/g, "").trim();
  if (!limpia) return 0;

  // Si es un número entero simple o con signo (ej. "4", "+2", "-3")
  if (/^[+-]?\d+$/.test(limpia)) {
    return parseInt(limpia, 10);
  }

  // Si es una suma/resta de términos numéricos simples (ej. "2+3", "4-1")
  const matchTerminos = limpia.match(/[+-]?\d+/g);
  if (matchTerminos && matchTerminos.join("") === limpia) {
    return matchTerminos.reduce((acc, t) => acc + parseInt(t, 10), 0);
  }

  const num = parseInt(limpia, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Comprueba si un efecto mecánico de daño aplica al contexto del ataque actual.
 */
function aplicaEfectoAAtaque(
  aplicaA: string | undefined,
  objetivo: string,
  contexto: ContextoAtaquePersonaje
): boolean {
  const criterio = normalizar(aplicaA || objetivo || "");

  if (criterio === "todos_ataques" || criterio === "todos" || criterio === "ataque") {
    return true;
  }
  if (criterio === "arma_fuerza" || criterio === "ataque_fuerza") {
    return contexto.caracteristica === "fuerza";
  }
  if (criterio === "arma_cac" || criterio === "cuerpo_a_cuerpo") {
    return contexto.esCuerpoACuerpo;
  }
  if (criterio === "arma_distancia" || criterio === "distancia") {
    return contexto.esDistancia;
  }
  if (criterio === "desarmado") {
    return contexto.tipo === "desarmado";
  }

  // Por defecto, si el objetivo incluye "fuerza", requiere ataque de fuerza
  if (criterio.includes("fuerza")) {
    return contexto.caracteristica === "fuerza";
  }

  return true;
}

/**
 * Obtiene dados adicionales para sumar al daño principal del arma / ataque
 * procedentes de rasgos activos con efecto `dado_extra_dano`.
 */
export function obtenerDadosExtraAtaque(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): { dados: string; origen: string }[] {
  const efectos = evaluarEfectosRasgosActivos(personaje);
  const resultado: { dados: string; origen: string }[] = [];

  for (const ef of efectos) {
    if (ef.tipo === "dado_extra_dano") {
      if (aplicaEfectoAAtaque(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        if (formulaResuelta) {
          resultado.push({
            dados: formulaResuelta,
            origen: ef.descripcion || "Rasgo activo"
          });
        }
      }
    }
  }

  return resultado;
}

/**
 * Obtiene grupos de daño secundario independiente (que se suman con `/` en TaleSpire)
 * procedentes de rasgos activos con efecto `dano_secundario`.
 */
export function obtenerDanosSecundariosAtaque(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): { formula: string; tipoDano: string; origen: string }[] {
  const efectos = evaluarEfectosRasgosActivos(personaje);
  const resultado: { formula: string; tipoDano: string; origen: string }[] = [];

  for (const ef of efectos) {
    if (ef.tipo === "dano_secundario") {
      if (aplicaEfectoAAtaque(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        if (formulaResuelta) {
          resultado.push({
            formula: formulaResuelta,
            tipoDano: ef.tipoDano || "Adicional",
            origen: ef.descripcion || "Rasgo activo"
          });
        }
      }
    }
  }

  return resultado;
}

/**
 * Obtiene bonificadores numéricos extra al daño procedentes de rasgos activos
 * con efecto `bono_dano_ataque` o `bono_dano_fuerza` de forma 100% genérica.
 */
export function obtenerBonoDanoAtaqueExtra(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): number {
  let bonoTotal = 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let yaAplicoRevelacion = false;

  for (const ef of efectos) {
    if (ef.tipo === "bono_dano_ataque" || ef.tipo === "bono_dano_fuerza") {
      if (aplicaEfectoAAtaque(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
        bonoTotal += valorNumerico;
        const descNorm = normalizar(ef.descripcion || "");
        if (descNorm.includes("revelacion celestial") || descNorm.includes("revelacion_celestial")) {
          yaAplicoRevelacion = true;
        }
      }
    }
  }

  // Respaldo reactivo garantizado: si Revelación celestial está activa (condiciones, efectos temporales o rasgo conmutado)
  // y ningún efecto de rasgo previo aportó el bono, sumar directamente el Bono de Competencia (+PB)
  if (!yaAplicoRevelacion && estaRevelacionCelestialActiva(personaje)) {
    bonoTotal += obtenerBonoCompetenciaPersonaje(personaje);
  }

  return bonoTotal;
}

/**
 * Obtiene bonificadores numéricos extra al daño procedentes de rasgos activos
 * con efecto `bono_dano_fuerza` o similar (delegador retrocompatible).
 */
export function obtenerBonoDanoFuerzaExtra(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): number {
  return obtenerBonoDanoAtaqueExtra(personaje, contexto);
}

export interface ContextoDanoConjuro {
  esTruco?: boolean;
  nivelLanzamiento?: number;
  escuela?: string;
  tipoDano?: string;
  nombreConjuro?: string;
}

/**
 * Comprueba si un efecto mecánico de daño a conjuros aplica al contexto del conjuro actual.
 */
function aplicaEfectoAConjuro(
  aplicaA: string | undefined,
  objetivo: string,
  contexto?: ContextoDanoConjuro
): boolean {
  if (!contexto) return true;
  const criterio = normalizar(aplicaA || objetivo || "");
  if (!criterio || criterio === "todos_conjuros" || criterio === "todos" || criterio === "conjuros") {
    return true;
  }
  if (criterio === "trucos") {
    return Boolean(contexto.esTruco);
  }
  if (criterio === "espacios" || criterio === "ranuras") {
    return !contexto.esTruco;
  }
  if (contexto.tipoDano && normalizar(contexto.tipoDano) === criterio) {
    return true;
  }
  if (contexto.escuela && normalizar(contexto.escuela) === criterio) {
    return true;
  }
  return true;
}

/**
 * Obtiene bonificadores numéricos extra al daño de conjuros procedentes de rasgos activos
 * con efecto `bono_dano_conjuro` de forma 100% genérica.
 */
export function obtenerBonoDanoConjuroExtra(
  personaje: PersonajeJugador,
  contexto?: ContextoDanoConjuro
): number {
  let bonoTotal = 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let yaAplicoRevelacion = false;

  for (const ef of efectos) {
    if (ef.tipo === "bono_dano_conjuro") {
      if (aplicaEfectoAConjuro(ef.aplicaA, ef.objetivo, contexto)) {
        const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
        const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
        bonoTotal += valorNumerico;
        const descNorm = normalizar(ef.descripcion || "");
        if (descNorm.includes("revelacion celestial") || descNorm.includes("revelacion_celestial")) {
          yaAplicoRevelacion = true;
        }
      }
    }
  }

  // Respaldo reactivo garantizado: si Revelación celestial está activa (condiciones, efectos temporales o conmutador)
  // y ningún efecto de rasgo previo aportó el bono, sumar directamente el Bono de Competencia (+PB)
  if (!yaAplicoRevelacion && estaRevelacionCelestialActiva(personaje)) {
    bonoTotal += obtenerBonoCompetenciaPersonaje(personaje);
  }

  return bonoTotal;
}

/**
 * Obtiene bonos acumulados a las tiradas de salvación procedentes de rasgos activos.
 */
export function obtenerBonosSalvacionesRasgos(
  personaje: PersonajeJugador
): Record<Caracteristica, number> {
  const bonos: Record<Caracteristica, number> = {
    fuerza: 0,
    destreza: 0,
    constitucion: 0,
    inteligencia: 0,
    sabiduria: 0,
    carisma: 0
  };

  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "bono_salvacion") {
      const objNorm = normalizar(ef.objetivo);
      let valorNum = 0;

      const valStr = String(ef.valor).toLowerCase().trim();
      if (valStr === "dano_furia") {
        const nivelB = obtenerNivelClasePersonaje(personaje, "bárbaro") || personaje.nivel || 1;
        valorNum = obtenerBonoDanoFuria(nivelB);
      } else if (valStr === "mitad_nivel") {
        valorNum = Math.max(1, Math.floor((personaje.nivel || 1) / 2));
      } else {
        valorNum = Number(ef.valor) || 0;
      }

      if (objNorm === "todas" || objNorm === "universal" || objNorm === "") {
        for (const k of Object.keys(bonos) as Caracteristica[]) {
          bonos[k] += valorNum;
        }
      } else {
        const statNorm = objNorm.replace(/^salvacion[._]/, "") as Caracteristica;
        if (statNorm in bonos) {
          bonos[statNorm] += valorNum;
        }
      }
    }
  }

  return bonos;
}

/**
 * Obtiene el conjunto de nombres de habilidades que pueden usar Fuerza como atributo base
 * procedentes de rasgos activos con efecto `habilidad_con_fuerza`.
 */
export function obtenerHabilidadesConFuerzaRasgos(personaje: PersonajeJugador): Set<string> {
  const habilidades = new Set<string>();
  const efectos = evaluarEfectosRasgosActivos(personaje);

  for (const ef of efectos) {
    if (ef.tipo === "habilidad_con_fuerza") {
      const lista = String(ef.valor || ef.objetivo)
        .split(/[,;\s]+/)
        .map((h) => normalizar(h))
        .filter(Boolean);
      for (const hab of lista) {
        habilidades.add(hab);
      }
    }
  }

  return habilidades;
}

/**
 * Retorna el dado de Inspiración Bárdica según el nivel de Bardo conforme a D&D 5.5e:
 * Nv 1-4: 1d6, Nv 5-9: 1d8, Nv 10-14: 1d10, Nv 15-20: 1d12.
 */
export function obtenerDadoInspiracionBardica(nivelBardo: number): string {
  const niv = Math.max(1, Math.min(20, Math.floor(nivelBardo) || 1));
  if (niv >= 15) return "1d12";
  if (niv >= 10) return "1d10";
  if (niv >= 5) return "1d8";
  return "1d6";
}

/**
 * Determina si el personaje tiene activo el beneficio de medio bono a habilidades
 * en las que no posee competencia ni pericia (Aprendiz de mucho o rasgo equivalente).
 * Evaluación 100% genérica vía efectos declarativos y nombre de rasgo.
 */
export function tieneMedioBonoHabilidades(personaje: PersonajeJugador): boolean {
  if (!personaje) return false;

  // 1. Evaluar efectos activos con tipo "medio_bono_habilidades" (camino genérico principal)
  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "medio_bono_habilidades") return true;
  }

  // 2. Fallback: rasgo activo con nombre canónico "Aprendiz de mucho" (compatibilidad)
  return (personaje.rasgos || []).some(
    (r) =>
      r.activo !== false &&
      (normalizar(r.nombre).includes("aprendiz de mucho") || normalizar(r.nombre).includes("jack of all trades"))
  );
}


/**
 * Aplica o revierte el grado "medio" (medio bono) en las competencias de habilidades del personaje
 * respetando estrictamente las habilidades que ya cuenten con competencia o pericia.
 */
export function aplicarAprendizDeMuchoAGradosHabilidades(
  gradosHabilidades: Record<Habilidad, GradoCompetencia> | undefined,
  tieneAprendiz: boolean
): Record<Habilidad, GradoCompetencia> {
  const resultado: Record<Habilidad, GradoCompetencia> = {
    ...GRADOS_HABILIDADES_DEFECTO,
    ...(gradosHabilidades || {})
  };

  const listaHabilidades = Object.keys(resultado) as Habilidad[];
  for (const hab of listaHabilidades) {
    const gradoActual = resultado[hab] || "ninguna";
    if (tieneAprendiz) {
      if (gradoActual === "ninguna") {
        resultado[hab] = "medio";
      }
    } else {
      if (gradoActual === "medio") {
        resultado[hab] = "ninguna";
      }
    }
  }

  return resultado;
}

export interface InfoAtaqueDesarmadoEspecial {
  aplica: boolean;
  caracteristicaSugerida?: Caracteristica;
  dadoDanoBase?: string;
  nombreAtaque?: string;
  propiedades?: string[];
}

/**
 * Evalúa si el personaje posee un rasgo activo que modifique el ataque sin armas
 * (ej. Daño bárdico del Colegio de la Danza, o rasgos Homebrew de combate desarmado).
 */
export function evaluarAtaqueDesarmadoEspecial(personaje: PersonajeJugador): InfoAtaqueDesarmadoEspecial {
  const armadura = tieneArmaduraEquipada(personaje);
  const tieneEscudo = tieneEscudoEquipado(personaje);
  const sinArmaduraNiEscudo = !armadura.tieneArmadura && !tieneEscudo;

  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "ataque_desarmado") {
      const exigeSinArmadura = ef.condicion === "sin_armadura" || ef.condicion === "sin_armadura_ni_escudo";
      if (exigeSinArmadura && !sinArmaduraNiEscudo) continue;

      let dadoDano = String(ef.valor || "1d6");
      if (dadoDano === "dado_inspiracion" || dadoDano === "dado_padre") {
        const nivelBardo = obtenerNivelClasePersonaje(personaje, "bardo") || personaje.nivel || 1;
        dadoDano = obtenerDadoInspiracionBardica(nivelBardo);
      }

      const nombreAtaque = ef.descripcion || "Golpe sin Armas Especial";
      return {
        aplica: true,
        caracteristicaSugerida: (ef.objetivo as Caracteristica) || "destreza",
        dadoDanoBase: dadoDano,
        nombreAtaque,
        propiedades: [nombreAtaque, "Sutil"]
      };
    }
  }

  return { aplica: false };
}

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
          idLower.includes("cantrip")
        ) {
          if (Array.isArray(sel.valorActual)) {
            for (const val of sel.valorActual) {
              if (val && val.trim()) conjuros.add(val.trim());
            }
          }
        }
      }
    }

    if (Array.isArray(r.efectos)) {
      for (const ef of r.efectos) {
        if (ef.tipo === "conjuro_otorgado") {
          const cNom = String(ef.valor || ef.objetivo).trim();
          if (cNom) conjuros.add(cNom);
        }
      }
    }
  }

  return Array.from(conjuros);
}

/**
 * Obtiene las competencias en grupos de armas y armaduras otorgadas por rasgos activos.
 * Evaluación 100% genérica a través de efectos mecánicos de tipo 'competencia'.
 */
export function obtenerCompetenciasExtraRasgos(personaje: PersonajeJugador): {
  armasGrupos: ("sencillas" | "marciales" | "fuego")[];
  armadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
} {
  const armas = new Set<"sencillas" | "marciales" | "fuego">();
  const armaduras = new Set<"ligeras" | "medias" | "pesadas" | "escudos">();

  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "competencia") {
      const texto = normalizar(`${ef.objetivo} ${ef.valor}`);
      if (texto.includes("marcial")) armas.add("marciales");
      if (texto.includes("sencill")) armas.add("sencillas");
      if (texto.includes("fuego")) armas.add("fuego");

      if (texto.includes("media") || texto.includes("mediana")) armaduras.add("medias");
      if (texto.includes("escudo")) armaduras.add("escudos");
      if (texto.includes("pesada")) armaduras.add("pesadas");
      if (texto.includes("ligera")) armaduras.add("ligeras");
    }
  }

  return {
    armasGrupos: Array.from(armas),
    armadurasGrupos: Array.from(armaduras)
  };
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

  // Obtener rasgos del personaje, o resolver del catálogo si la ficha no los tiene instanciados
  let rasgos: Array<{
    activo?: boolean;
    condicionAlActivar?: string;
    efectos?: EfectoMecanicoRasgo[];
  }> = personaje.rasgos || [];

  if (rasgos.length === 0 && personaje.clase) {
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
      rasgos = [...rasgosClase, ...rasgosSub];
    }
  }

  const condiciones = (personaje.condicionesActivas || []).map(normalizar);

  for (const r of rasgos) {
    const condActivarNorm = r.condicionAlActivar ? normalizar(r.condicionAlActivar) : null;
    const estaActivoPorCondicion = Boolean(
      condActivarNorm &&
      condiciones.some((c) => c === condActivarNorm || c.includes(condActivarNorm) || condActivarNorm.includes(c))
    );
    const estaActivo = r.activo !== false || estaActivoPorCondicion;

    if (!estaActivo) continue;

    for (const ef of r.efectos || []) {
      if (ef.tipo === "conjuro_gratuito") {
        const objNorm = normalizar(String(ef.objetivo || ""));
        if (objNorm === nomNorm || nomNorm.includes(objNorm) || objNorm.includes(nomNorm)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Retorna las cadenas legibles de competencias en armas y armaduras integrando
 * las competencias base del personaje y las otorgadas por rasgos de clase/subclase (ej. Colegio del Valor).
 */
export function obtenerCompetenciasEfectivasTexto(personaje: PersonajeJugador): {
  armasTexto: string;
  armadurasTexto: string;
} {
  const compExtra = obtenerCompetenciasExtraRasgos(personaje);
  
  // Procesar armas
  const partesArmas = new Set<string>();
  if (personaje.competenciasArmas && personaje.competenciasArmas !== "Ninguna") {
    personaje.competenciasArmas.split(",").forEach((p) => {
      const t = p.trim();
      if (t) partesArmas.add(t);
    });
  }
  if (compExtra.armasGrupos.includes("marciales")) {
    partesArmas.add("Armas Marciales");
  }
  if (compExtra.armasGrupos.includes("sencillas")) {
    partesArmas.add("Armas Sencillas");
  }

  // Procesar armaduras
  const partesArmaduras = new Set<string>();
  if (personaje.competenciasArmaduras && personaje.competenciasArmaduras !== "Ninguna") {
    personaje.competenciasArmaduras.split(",").forEach((p) => {
      const t = p.trim();
      if (t) partesArmaduras.add(t);
    });
  }
  if (compExtra.armadurasGrupos.includes("ligeras")) {
    partesArmaduras.add("Armaduras Ligeras");
  }
  if (compExtra.armadurasGrupos.includes("medias")) {
    partesArmaduras.add("Armaduras Medias");
  }
  if (compExtra.armadurasGrupos.includes("pesadas")) {
    partesArmaduras.add("Armaduras Pesadas");
  }
  if (compExtra.armadurasGrupos.includes("escudos")) {
    partesArmaduras.add("Escudos");
  }

  return {
    armasTexto: partesArmas.size > 0 ? Array.from(partesArmas).join(", ") : "Ninguna",
    armadurasTexto: partesArmaduras.size > 0 ? Array.from(partesArmaduras).join(", ") : "Ninguna"
  };
}

/**
 * Obtiene el conjunto de claves normalizadas de las maestrías de armas que el personaje
 * tiene actualmente aprendidas o seleccionadas en sus rasgos de maestría.
 */
export function obtenerMaestriasArmasAprendidas(personaje: PersonajeJugador): Set<string> {
  const maestrias = new Set<string>();
  if (!personaje || !Array.isArray(personaje.rasgos)) {
    return maestrias;
  }

  for (const rasgo of personaje.rasgos) {
    if (!Array.isArray(rasgo.selectores) || rasgo.selectores.length === 0) continue;

    const nombreRasgo = normalizar(rasgo.nombre);
    const esRasgoMaestria =
      nombreRasgo.includes("maestria con armas") ||
      nombreRasgo.includes("weapon mastery") ||
      rasgo.id.toLowerCase().includes("maestria");

    for (const sel of rasgo.selectores) {
      const idSel = normalizar(sel.id);
      const etiquetaSel = normalizar(sel.etiqueta);
      const esSelectorMaestria =
        esRasgoMaestria ||
        idSel.includes("maestria") ||
        etiquetaSel.includes("maestria");

      if (!esSelectorMaestria) continue;

      const valores: string[] = Array.isArray(sel.valorActual)
        ? sel.valorActual
        : typeof sel.valorActual === "string"
        ? [sel.valorActual]
        : [];

      for (const val of valores) {
        if (!val) continue;
        const claveVal = normalizar(val);
        maestrias.add(claveVal);

        // Buscar en las opciones del selector para enriquecer con sinónimos (id, nombre, etc.)
        const opc = sel.opciones.find(
          (o) => normalizar(o.id) === claveVal || normalizar(o.nombre) === claveVal
        );
        if (opc) {
          maestrias.add(normalizar(opc.id));
          maestrias.add(normalizar(opc.nombre));
          // Extraer posibles partes de patrones como "Cleave (Hender)"
          const matchParen = opc.nombre.match(/^([^(]+)\s*\(([^)]+)\)/);
          if (matchParen) {
            maestrias.add(normalizar(matchParen[1]));
            maestrias.add(normalizar(matchParen[2]));
          }
        }
      }
    }
  }

  return maestrias;
}

/**
 * Comprueba si el personaje tiene desbloqueada o aprendida una maestría de arma específica.
 */
export function personajeTieneMaestriaArma(
  personaje: PersonajeJugador,
  maestriaArma?: string | null
): boolean {
  if (!maestriaArma || !maestriaArma.trim() || normalizar(maestriaArma) === "ninguna") {
    return false;
  }

  const maestriasAprendidas = obtenerMaestriasArmasAprendidas(personaje);
  if (maestriasAprendidas.size === 0) {
    return false;
  }

  const claveArma = normalizar(maestriaArma);
  if (maestriasAprendidas.has(claveArma)) {
    return true;
  }

  // Extraer tokens de expresiones como "Cleave (Hender)" o "Topple (Derribar)"
  const matchParen = maestriaArma.match(/^([^(]+)\s*\(([^)]+)\)/);
  if (matchParen) {
    const p1 = normalizar(matchParen[1]);
    const p2 = normalizar(matchParen[2]);
    if (maestriasAprendidas.has(p1) || maestriasAprendidas.has(p2)) {
      return true;
    }
  }

  // Comprobar coincidencia por contención si la clave es suficientemente descriptiva
  for (const aprendida of maestriasAprendidas) {
    if (aprendida.length >= 3 && (claveArma.includes(aprendida) || aprendida.includes(claveArma))) {
      return true;
    }
  }

  return false;
}


