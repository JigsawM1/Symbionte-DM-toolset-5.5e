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
          // El Campeón primigenio eleva el límite natural de 20 a 25
          limitesMaximos[statNorm] = 25;
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
      // Bárbaro permite escudo; Monje no permite escudo
      if (statNorm === "sabiduria" && tieneEscudo) {
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
