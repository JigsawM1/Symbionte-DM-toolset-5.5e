import {
  type PersonajeJugador,
  type RasgoPersonaje,
  type EfectoMecanicoRasgo,
  type HechizoBase,
  type Caracteristica,
  type Habilidad,
  type GradoCompetencia,
  type TamanoPersonaje,
  type VelocidadEstructurada,
  GRADOS_HABILIDADES_DEFECTO
} from "@/tipos";
import { ARMADURAS_OFICIALES } from "@/constantes/equipoConstantes";
import { CATALOGO_CLASES_DND55 } from "@/constantes/clasesDND55";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { obtenerNivelEspacioPacto } from "@/constantes/invocacionesSobrenaturales";
import { DOTES_ORIGEN_DND55 } from "@/constantes/dotesConstantes";
import { logger } from "@/utiles/logger";


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
  const nivelPj = personaje.nivel || 1;

  for (const rasgo of rasgos) {
    // Si el rasgo exige un nivel mínimo superior al nivel actual del personaje, omitirlo
    if (rasgo.nivelRequerido && nivelPj < rasgo.nivelRequerido) continue;

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
          const baseSinArg = opId.includes(":") ? opId.split(":")[0] : opId;
          const baseId = baseSinArg.includes("__") ? baseSinArg.split("__")[0] : baseSinArg;
          const opcion = selector.opciones.find((o) => o.id === opId || o.id === baseId);
          if (opcion && Array.isArray(opcion.efectos)) {
            for (const efOp of opcion.efectos) {
              if (efOp.activo !== false && cumpleCondicionEfecto(efOp.condicion, personaje)) {
                let efectoFinal = efOp;
                if (opId.includes(":") && efOp.tipo === "dano_secundario") {
                  const subtipo = opId.split(":")[1].toLowerCase();
                  const mapaTipos: Record<string, string> = {
                    necrotico: "Necrótico",
                    psiquico: "Psíquico",
                    radiante: "Radiante"
                  };
                  const tipoDanoFormateado =
                    mapaTipos[subtipo] || (subtipo.charAt(0).toUpperCase() + subtipo.slice(1));
                  efectoFinal = { ...efOp, tipoDano: tipoDanoFormateado };
                }
                efectosResultado.push({
                  ...efectoFinal,
                  descripcion: efectoFinal.descripcion || `${rasgo.nombre} (${opcion.nombre})`
                });
              }
            }
          }

          // Soporte de efectos mecánicos para Lecciones de los Primeros (Dotes de origen canónicas)
          if (baseId === "lecciones_de_los_primeros" && opId.includes(":")) {
            const doteId = opId.split(":")[1];
            const doteNorm = normalizar(doteId);
            const dote = DOTES_ORIGEN_DND55.find(
              (d) =>
                d.id === doteId ||
                normalizar(d.id) === doteNorm ||
                normalizar(d.id).replace(/^dote_/, "") === doteNorm.replace(/^dote_/, "") ||
                normalizar(d.nombre) === doteNorm ||
                (doteNorm === "alert" && d.id === "dote_alerta") ||
                (doteNorm === "crafter" && d.id === "dote_fabricante") ||
                (doteNorm === "healer" && d.id === "dote_sanador") ||
                (doteNorm === "musician" && d.id === "dote_musico") ||
                (doteNorm === "lucky" && d.id === "dote_afortunado") ||
                (doteNorm === "savage-attacker" && d.id === "dote_atacante_salvaje") ||
                (doteNorm === "skilled" && d.id === "dote_habilidoso") ||
                (doteNorm === "tough" && d.id === "dote_duro") ||
                (doteNorm === "tavern-brawler" && d.id === "dote_maton_taberna")
            );

            if (dote && Array.isArray(dote.efectos)) {
              const yaExisteEnRasgos = (personaje.rasgos || []).some(
                (r) =>
                  r.id === dote.id ||
                  r.id === `dote_invocacion_${dote.id}` ||
                  (r.origen === "dote" && normalizar(r.nombre) === normalizar(dote.nombre))
              );
              if (yaExisteEnRasgos) continue;

              for (const efDote of dote.efectos) {
                if (efDote.activo !== false && cumpleCondicionEfecto(efDote.condicion, personaje)) {
                  efectosResultado.push({
                    ...efDote,
                    descripcion: efDote.descripcion || `Lecciones de los Primeros (${dote.nombre})`
                  });
                }
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
 * Evalúa si los rasgos o efectos activos del personaje otorgan o restauran
 * inspiración heroica durante un descanso (por ejemplo, descanso largo con rasgo Ingenioso).
 * Función GENÉRICA PURA: no hardcodea nombres de rasgos ni razas.
 */
export function evaluarRecuperacionInspiracionEnDescanso(
  personaje: PersonajeJugador,
  tipoDescanso: "corto" | "largo"
): boolean {
  if (!personaje) return false;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "restaurar_recurso") {
      const objNorm = normalizar(ef.objetivo);
      const esInspiracion =
        objNorm === "inspiracion" ||
        objNorm === "inspiracion_heroica" ||
        objNorm.includes("inspiracion heroica") ||
        (objNorm.includes("inspiracion") && !objNorm.includes("bardica"));

      if (esInspiracion) {
        const condNorm = normalizar(ef.condicion || ef.aplicaA || String(ef.valor) || "");
        if (tipoDescanso === "largo") {
          if (!condNorm || condNorm.includes("largo") || condNorm === "siempre") {
            return true;
          }
        } else if (tipoDescanso === "corto") {
          if (condNorm.includes("corto")) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * Ventajas y desventajas directas otorgadas por rasgos activos del personaje
 * para consultar en tiradas d20 (salvaciones, iniciativa, ataques).
 */
export interface ConsultaVentajaRasgo {
  tipoTirada?: "salvacion" | "iniciativa" | "ataque" | "caracteristica";
  tipo?: "salvacion" | "iniciativa" | "ataque" | "caracteristica" | string;
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
  const tipoTirada = normalizar(consulta.tipoTirada || consulta.tipo || "");

  for (const ef of efectos) {
    const objNorm = normalizar(ef.objetivo);
    const esVentaja = ef.tipo === "ventaja" || (ef.tipo as string) === "ventaja_tirada";

    // 1. Tiradas de Salvación
    if (tipoTirada === "salvacion") {
      const esMental = subtipoNorm === "inteligencia" || subtipoNorm === "sabiduria" || subtipoNorm === "carisma";
      const esFisica = subtipoNorm === "fuerza" || subtipoNorm === "destreza" || subtipoNorm === "constitucion";
      const listaObjetivos = objNorm.split(",").map((o) => o.trim());
      const coincideSalvacion = listaObjetivos.some((obj) => {
        return (
          obj === `salvacion.${subtipoNorm}` ||
          obj === `salvacion_${subtipoNorm}` ||
          obj === subtipoNorm ||
          obj === "salvacion.todas" ||
          obj === "todas" ||
          (esMental && (obj === "salvaciones_mentales" || obj === "salvacion.mental" || obj === "salvacion.mentales" || obj === "mentales")) ||
          (esFisica && (obj === "salvaciones_fisicas" || obj === "salvacion.fisica" || obj === "salvacion.fisicas" || obj === "fisicas"))
        );
      });

      if (coincideSalvacion) {
        if (esVentaja) {
          tieneVentaja = true;
          razones.push(ef.descripcion || `Ventaja en salvación de ${subtipoNorm}`);
        } else if (ef.tipo === "desventaja") {
          tieneDesventaja = true;
          razones.push(ef.descripcion || `Desventaja en salvación de ${subtipoNorm}`);
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

    // 4. Pruebas de Característica
    if (tipoTirada === "caracteristica") {
      if (esVentaja) {
        if (
          objNorm === `prueba.${subtipoNorm}` ||
          objNorm === `prueba_${subtipoNorm}` ||
          objNorm === `caracteristica.${subtipoNorm}` ||
          objNorm === subtipoNorm ||
          (objNorm === "prueba.fuerza" && subtipoNorm === "fuerza")
        ) {
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

  const nivelBrujo =
    personaje.clases?.find((c) => normalizar(c.nombre) === "brujo")?.nivel ||
    (normalizar(personaje.clase) === "brujo" ? personaje.nivel : 0) ||
    1;
  const nivelEspacioPacto =
    personaje.nivelEspacioPacto && personaje.nivelEspacioPacto > 0
      ? personaje.nivelEspacioPacto
      : obtenerNivelEspacioPacto(nivelBrujo);

  // Modificadores de características para tiradas dinámicas (ej. 1d12+constitucion)
  const stats = personaje.caracteristicas;
  const modCon = stats?.constitucion !== undefined ? Math.floor((stats.constitucion - 10) / 2) : 0;
  const modFue = stats?.fuerza !== undefined ? Math.floor((stats.fuerza - 10) / 2) : 0;
  const modDes = stats?.destreza !== undefined ? Math.floor((stats.destreza - 10) / 2) : 0;
  const modInt = stats?.inteligencia !== undefined ? Math.floor((stats.inteligencia - 10) / 2) : 0;
  const modSab = stats?.sabiduria !== undefined ? Math.floor((stats.sabiduria - 10) / 2) : 0;
  const modCar = stats?.carisma !== undefined ? Math.floor((stats.carisma - 10) / 2) : 0;

  // Normalizar prefijos de modificadores (ej. "modificador_carisma", "modificador por carisma", "mod_carisma")
  const formulaNormalizada = formula
    .replace(/modificador[_\s]*(de[_\s]+|por[_\s]+)?/gi, "")
    .replace(/mod[_\s]+/gi, "");

  const reemplazado = formulaNormalizada
    .replace(/nivel_espacio_pacto/gi, String(nivelEspacioPacto))
    .replace(/espacio_pacto/gi, String(nivelEspacioPacto))
    .replace(/dano_furia/gi, String(bonoFuria))
    .replace(/mitad_nivel/gi, String(mitadNivel))
    .replace(/bono_competencia/gi, String(bonoCompetencia))
    .replace(/\b(pb|bc)\b/gi, String(bonoCompetencia))
    .replace(/\bnivel\b/gi, String(nivelClase))
    .replace(/\b(constitucion|con)\b/gi, String(modCon))
    .replace(/\b(fuerza|fue|str)\b/gi, String(modFue))
    .replace(/\b(destreza|des|dex)\b/gi, String(modDes))
    .replace(/\b(inteligencia|int)\b/gi, String(modInt))
    .replace(/\b(sabiduria|sab|wis)\b/gi, String(modSab))
    .replace(/\b(carisma|car|cha)\b/gi, String(modCar))
    .replace(/(\d+)\s+d/gi, "$1d")
    .replace(/\+\s*\+/g, "+")
    .replace(/\+\s*-/g, "-")
    .trim();

  return reemplazado;
}

/**
 * Evalúa expresiones numéricas sencillas y seguras (ej. "3", "+2", "-1", "2+3", "1*5", "2*nivel", "max(1, carisma)")
 * sin recurrir a eval(), garantizando rendimiento y seguridad.
 */
export function evaluarExpresionNumericaSegura(
  expresion: string | number,
  variables?: { nivel?: number }
): number {
  if (typeof expresion === "number") return isNaN(expresion) ? 0 : expresion;
  if (!expresion || typeof expresion !== "string") return 0;

  let textoProcesado = expresion;
  if (variables && typeof variables.nivel === "number") {
    textoProcesado = textoProcesado.replace(/\bnivel\b/gi, String(variables.nivel));
  }

  // Soporte para max(a, b) y min(a, b)
  const regexMax = /max\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/i;
  let matchMax: RegExpExecArray | null;
  while ((matchMax = regexMax.exec(textoProcesado)) !== null) {
    const valA = evaluarExpresionNumericaSegura(matchMax[1], variables);
    const valB = evaluarExpresionNumericaSegura(matchMax[2], variables);
    textoProcesado = textoProcesado.replace(matchMax[0], String(Math.max(valA, valB)));
  }

  const regexMin = /min\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/i;
  let matchMin: RegExpExecArray | null;
  while ((matchMin = regexMin.exec(textoProcesado)) !== null) {
    const valA = evaluarExpresionNumericaSegura(matchMin[1], variables);
    const valB = evaluarExpresionNumericaSegura(matchMin[2], variables);
    textoProcesado = textoProcesado.replace(matchMin[0], String(Math.min(valA, valB)));
  }

  // Resolver paréntesis de expresiones aritméticas internas (ej. "12 + 5 * (2 - 1)")
  const regexParentesis = /\(([^()]+)\)/;
  let matchPar: RegExpExecArray | null;
  while ((matchPar = regexParentesis.exec(textoProcesado)) !== null) {
    const valInterno = evaluarExpresionNumericaSegura(matchPar[1], variables);
    textoProcesado = textoProcesado.replace(matchPar[0], String(valInterno));
  }

  // Reemplazar 'x' o 'X' utilizada como operador de multiplicación y remover espacios
  const limpia = textoProcesado.replace(/(\d)\s*[xX]\s*(\d)/g, "$1*$2").replace(/\s+/g, "").trim();
  if (!limpia) return 0;

  // Si es un número entero simple o con signo (ej. "4", "+2", "-3")
  if (/^[+-]?\d+$/.test(limpia)) {
    return parseInt(limpia, 10);
  }

  // Si contiene dígitos y operadores válidos (+, -, *)
  if (/^[+-]?\d+([*+-]\d+)*$/.test(limpia)) {
    try {
      const normalizadoParaSuma = limpia
        .replace(/(.)\+/g, "$1\n+")
        .replace(/(.)-/g, "$1\n-");

      const lineas = normalizadoParaSuma.split("\n");
      let total = 0;

      for (const linea of lineas) {
        if (!linea) continue;
        const signo = linea.startsWith("-") ? -1 : 1;
        const sinSigno = linea.replace(/^[+-]/, "");

        if (sinSigno.includes("*")) {
          const factores = sinSigno.split("*").map((f) => parseInt(f, 10));
          if (factores.some(isNaN)) return 0;
          const producto = factores.reduce((acc, val) => acc * val, 1);
          total += signo * producto;
        } else {
          const val = parseInt(sinSigno, 10);
          if (isNaN(val)) return 0;
          total += signo * val;
        }
      }
      return total;
    } catch (error) {
      logger.warn(`[evaluadorEfectosRasgos] Error al evaluar expresión matemática "${limpia}":`, error);
      return 0;
    }
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
function obtenerPesoDadoDesarmado(valorDado: string, nivelBardo: number): number {
  if (valorDado === "dado_inspiracion" || valorDado === "dado_padre") {
    if (nivelBardo >= 15) return 12;
    if (nivelBardo >= 10) return 10;
    if (nivelBardo >= 5) return 8;
    return 6;
  }
  const match = valorDado.match(/(\d*)d(\d+)/i);
  if (match) {
    const cant = parseInt(match[1] || "1", 10);
    const caras = parseInt(match[2], 10);
    return cant * caras;
  }
  const num = Number(valorDado);
  return isNaN(num) ? 0 : num;
}

/**
 * Evalúa si el personaje posee un rasgo activo que modifique el ataque sin armas
 * (ej. Daño bárdico del Colegio de la Danza, Matón de Taberna, o rasgos Homebrew de combate desarmado).
 * Aplica precedencia por peso de modificación para que ataques marciales superiores prevalezcan sobre 1d4.
 */
export function evaluarAtaqueDesarmadoEspecial(personaje: PersonajeJugador): InfoAtaqueDesarmadoEspecial {
  const armadura = tieneArmaduraEquipada(personaje);
  const tieneEscudo = tieneEscudoEquipado(personaje);
  const sinArmaduraNiEscudo = !armadura.tieneArmadura && !tieneEscudo;

  const efectos = evaluarEfectosRasgosActivos(personaje);
  const efectosDesarmadosValidos = efectos.filter((ef) => {
    if (ef.tipo !== "ataque_desarmado") return false;
    const exigeSinArmadura = ef.condicion === "sin_armadura" || ef.condicion === "sin_armadura_ni_escudo";
    if (exigeSinArmadura && !sinArmaduraNiEscudo) return false;
    return true;
  });

  if (efectosDesarmadosValidos.length === 0) {
    return { aplica: false };
  }

  const nivelBardo = obtenerNivelClasePersonaje(personaje, "bardo") || personaje.nivel || 1;

  // Ordenar por peso de modificación descendente para que ataques mayores (Daño Bárdico 1d6-1d12)
  // prevalezcan sobre opciones con menor peso de modificación (como Matón de Taberna 1d4)
  const efectosOrdenados = [...efectosDesarmadosValidos].sort((a, b) => {
    const pesoA = obtenerPesoDadoDesarmado(String(a.valor || "1d4"), nivelBardo);
    const pesoB = obtenerPesoDadoDesarmado(String(b.valor || "1d4"), nivelBardo);
    return pesoB - pesoA;
  });

  const ef = efectosOrdenados[0];
  let dadoDano = String(ef.valor || "1d4");
  if (dadoDano === "dado_inspiracion" || dadoDano === "dado_padre") {
    dadoDano = obtenerDadoInspiracionBardica(nivelBardo);
  }

  const nombreAtaque = ef.descripcion || "Golpe sin Armas Especial";
  const caracSugerida = (ef.objetivo as Caracteristica) || (dadoDano === "1d4" ? "fuerza" : "destreza");
  const propiedades = caracSugerida === "fuerza" ? [nombreAtaque] : [nombreAtaque, "Sutil"];

  return {
    aplica: true,
    caracteristicaSugerida: caracSugerida,
    dadoDanoBase: dadoDano,
    nombreAtaque,
    propiedades
  };
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
 * Obtiene las competencias en grupos de armas y armaduras otorgadas por rasgos activos.
 * Evaluación 100% genérica a través de efectos mecánicos de tipo 'competencia'.
 */
export function obtenerCompetenciasExtraRasgos(personaje: PersonajeJugador): {
  armasGrupos: ("sencillas" | "marciales" | "fuego")[];
  armadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
  armasImprovisadas?: boolean;
} {
  const armas = new Set<"sencillas" | "marciales" | "fuego">();
  const armaduras = new Set<"ligeras" | "medias" | "pesadas" | "escudos">();
  let armasImprovisadas = false;

  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "competencia") {
      const texto = normalizar(`${ef.objetivo} ${ef.valor}`);
      if (texto.includes("marcial")) armas.add("marciales");
      if (texto.includes("sencill")) armas.add("sencillas");
      if (texto.includes("fuego")) armas.add("fuego");
      if (texto.includes("improvisad")) armasImprovisadas = true;

      if (texto.includes("media") || texto.includes("mediana")) armaduras.add("medias");
      if (texto.includes("escudo")) armaduras.add("escudos");
      if (texto.includes("pesada")) armaduras.add("pesadas");
      if (texto.includes("ligera")) armaduras.add("ligeras");
    }
  }

  return {
    armasGrupos: Array.from(armas),
    armadurasGrupos: Array.from(armaduras),
    armasImprovisadas
  };
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
 * Calcula dinámicamente los usos máximos de un rasgo considerando su fórmula de escalado
 * (ej. "bono_competencia", "nivel", modificadores de característica).
 * Si no posee escalado dinámico, retorna rasgo.usosMaximos ?? 1.
 */
export function calcularUsosMaximosRasgo(
  rasgo: RasgoPersonaje,
  personaje: PersonajeJugador
): number {
  if (!rasgo.tieneUsosLimitados) return 1;

  const formula = (rasgo.formulaEscalado || "").toLowerCase().trim();
  const nivelPj = Math.max(1, personaje.nivel || 1);

  if (formula === "bono_competencia") {
    return Math.floor((nivelPj - 1) / 4) + 2;
  }
  if (formula === "nivel") {
    return nivelPj;
  }
  if (formula.startsWith("modificador_")) {
    const stat = formula.replace("modificador_", "") as Caracteristica;
    const score = personaje.overridesFijos?.[stat] ?? personaje.caracteristicas?.[stat] ?? 10;
    const mod = Math.floor((score - 10) / 2);
    return Math.max(1, mod);
  }

  return rasgo.usosMaximos ?? 1;
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
      } else if (objetivo.includes("escalar")) {
        const velEscalar =
          ef.valor === "escalar" || ef.valor === "caminar"
            ? caminar
            : (Number(ef.valor) || caminar);
        resultado.escalar = Math.max(resultado.escalar || 0, velEscalar);
      }
    }
  }

  return resultado;
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
 * Aplica enriquecimientos mecánicos dinámicos provenientes de Invocaciones Sobrenaturales
 * al hechizo (especialmente trucos modificados como Descarga Agónica o Lanza Sobrenatural).
 * Función pura: no muta el objeto hechizo original.
 */
export function aplicarModificadoresInvocacionesAHechizo(
  hechizo: HechizoBase,
  personaje: PersonajeJugador | null | undefined
): HechizoBase {
  if (!personaje || hechizo.nivel !== 0) {
    return hechizo;
  }

  // 1. Recolectar selecciones activas de invocaciones del personaje
  const invocacionesActivas: string[] = [];
  for (const r of personaje.rasgos || []) {
    if (r.activo === false) continue;
    if (Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        if (Array.isArray(sel.valorActual)) {
          for (const val of sel.valorActual) {
            if (typeof val === "string" && val.trim()) {
              invocacionesActivas.push(val.trim());
            }
          }
        }
      }
    }
  }

  let modificado = false;
  let nuevoAgregarModificadorHabilidad = hechizo.agregarModificadorHabilidad;
  let nuevoAlcance = hechizo.alcance;

  // 2. Evaluar Descarga Agónica: activa agregarModificadorHabilidad = true
  const tieneDescargaAgonica = invocacionesActivas.some((inv) => {
    if (!inv.startsWith("descarga_agonica")) return false;
    // Formato 'descarga_agonica:trucoId' o 'descarga_agonica__timestamp:trucoId' o fallback 'descarga_agonica'
    if (inv.includes(":")) {
      const trucoId = inv.split(":")[1];
      return coincideHechizoId(trucoId, hechizo.id) || coincideHechizoId(trucoId, hechizo.nombre);
    }
    // Si no tiene sufijo de truco específico, aplica a Descarga sobrenatural por defecto canónico
    return coincideHechizoId("descarga_sobrenatural", hechizo.id) || coincideHechizoId("descarga_sobrenatural", hechizo.nombre);
  });

  if (tieneDescargaAgonica && !nuevoAgregarModificadorHabilidad) {
    nuevoAgregarModificadorHabilidad = true;
    modificado = true;
  }

  // 3. Evaluar Lanza Sobrenatural: añade (nivelBrujo * 10) pies al alcance si es >= 10 pies
  const tieneLanzaSobrenatural = invocacionesActivas.some((inv) => {
    if (!inv.startsWith("lanza_sobrenatural")) return false;
    if (inv.includes(":")) {
      const trucoId = inv.split(":")[1];
      return coincideHechizoId(trucoId, hechizo.id) || coincideHechizoId(trucoId, hechizo.nombre);
    }
    return coincideHechizoId("descarga_sobrenatural", hechizo.id) || coincideHechizoId("descarga_sobrenatural", hechizo.nombre);
  });

  if (tieneLanzaSobrenatural && nuevoAlcance) {
    // Parsear alcance numérico (ej. "120 pies", "120 ft", "60 pies", "30")
    const matchAlcance = nuevoAlcance.match(/^(\d+)\s*(pies|ft|m|metros)?$/i);
    if (matchAlcance) {
      const valorBase = parseInt(matchAlcance[1], 10);
      const unidad = matchAlcance[2] || "pies";
      if (valorBase >= 10) {
        const nivelBrujo =
          personaje.clases?.find(
            (c) => normalizar(c.nombre) === "brujo"
          )?.nivel ||
          (normalizar(personaje.clase) === "brujo" ? personaje.nivel : 0) ||
          1;

        const bonoPies = nivelBrujo * 10;
        nuevoAlcance = `${valorBase + bonoPies} ${unidad}`;
        modificado = true;
      }
    }
  }

  if (!modificado) return hechizo;

  return {
    ...hechizo,
    agregarModificadorHabilidad: nuevoAgregarModificadorHabilidad,
    alcance: nuevoAlcance
  };
}

export interface ConfiguracionPactoDelFilo {
  activo: boolean;
  tipoDano: "propio" | "necrotico" | "psiquico" | "radiante";
}

/**
 * Obtiene el estado y configuración de la invocación Pacto del filo para el personaje.
 * Determina si está activo y el tipo de daño seleccionado ('propio', 'necrotico', 'psiquico', 'radiante').
 */
export function obtenerConfiguracionPactoDelFilo(personaje: PersonajeJugador): ConfiguracionPactoDelFilo {
  if (!personaje) return { activo: false, tipoDano: "propio" };

  for (const r of personaje.rasgos || []) {
    if (r.activo === false) continue;
    if (Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        for (const val of sel.valorActual || []) {
          if (
            typeof val === "string" &&
            (val === "pacto_del_filo" || val.startsWith("pacto_del_filo:") || val.startsWith("pacto_del_filo__"))
          ) {
            const subtipo = val.includes(":") ? val.split(":")[1].toLowerCase() : "propio";
            const tipoValido =
              subtipo === "necrotico" || subtipo === "psiquico" || subtipo === "radiante"
                ? subtipo
                : "propio";
            return { activo: true, tipoDano: tipoValido };
          }
        }
      }
    }
    if (r.id === "pacto_del_filo" || normalizar(r.nombre) === "pacto del filo") {
      return { activo: true, tipoDano: "propio" };
    }
  }
  return { activo: false, tipoDano: "propio" };
}
