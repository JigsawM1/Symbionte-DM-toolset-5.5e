import type {
  PersonajeJugador,
  EfectoMecanicoRasgo,
  Caracteristica
} from "@/tipos";
import { ARMADURAS_OFICIALES } from "@/constantes/equipoConstantes";

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
      (o.tipoPrincipal === "Armadura" || (o as any).tipo === "armadura") &&
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
  const rasgo = (personaje.rasgos || []).find(
    (r) => normalizar(r.id) === busqueda || normalizar(r.nombre) === busqueda || normalizar(r.nombre).includes(busqueda)
  );
  if (!rasgo) return false;
  return rasgo.activo !== false;
}

/**
 * Comprueba si la Furia del bárbaro está activa actualmente.
 */
export function estaFuriaActiva(personaje: PersonajeJugador): boolean {
  const enCondiciones = (personaje.condicionesActivas || []).some((c) => normalizar(c) === "furia");
  if (enCondiciones) return true;
  return estaRasgoActivo(personaje, "furia");
}

/**
 * Comprueba si el Ataque Temerario está activo actualmente.
 */
export function estaAtaqueTemerarioActivo(personaje: PersonajeJugador): boolean {
  const enCondiciones = (personaje.condicionesActivas || []).some(
    (c) => normalizar(c).includes("temerario") || normalizar(c).includes("reckless")
  );
  if (enCondiciones) return true;
  return estaRasgoActivo(personaje, "ataque temerario");
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
  if (condNorm === "ataque_temerario_activo") {
    return estaAtaqueTemerarioActivo(personaje);
  }
  if (condNorm === "furia_y_temerario_activos") {
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
    // Si el rasgo está desactivado explícitamente, omitirlo
    if (rasgo.activo === false) continue;

    // Si está ligado a otro rasgo, verificar que el padre esté activo
    if (rasgo.ligadoA) {
      const padreActivo = estaRasgoActivo(personaje, rasgo.ligadoA);
      if (!padreActivo) continue;
    }

    // 1. Efectos base del rasgo
    if (Array.isArray(rasgo.efectos)) {
      for (const efecto of rasgo.efectos) {
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
  const bonoFuria = obtenerBonoDanoFuria(nivelClase);

  const reemplazado = formula
    .replace(/dano_furia/gi, String(bonoFuria))
    .replace(/mitad_nivel/gi, String(mitadNivel))
    .replace(/\bnivel\b/gi, String(nivelClase))
    .trim();

  // Evaluar expresiones matemáticas simples si quedaron como "+2", "1+2", etc.
  return reemplazado;
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
 * con efecto `bono_dano_fuerza` o similar.
 */
export function obtenerBonoDanoFuerzaExtra(
  personaje: PersonajeJugador,
  contexto: ContextoAtaquePersonaje
): number {
  let bonoTotal = 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);

  for (const ef of efectos) {
    if (ef.tipo === "bono_dano_fuerza") {
      if (aplicaEfectoAAtaque(ef.aplicaA, ef.objetivo, contexto)) {
        const valStr = String(ef.valor).toLowerCase().trim();
        if (valStr === "dano_furia") {
          const nivelB = obtenerNivelClasePersonaje(personaje, "bárbaro") || personaje.nivel || 1;
          bonoTotal += obtenerBonoDanoFuria(nivelB);
        } else if (valStr === "mitad_nivel") {
          bonoTotal += Math.max(1, Math.floor((personaje.nivel || 1) / 2));
        } else {
          bonoTotal += Number(ef.valor) || 0;
        }
      }
    }
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

