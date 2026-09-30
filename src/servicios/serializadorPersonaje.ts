import type { PersonajeJugador, RasgoPersonaje, SelectorRasgo } from "@/tipos";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";

/**
 * Determina si un rasgo proviene formalmente del compendio canónico (clase, especie, subclase).
 */
export function esRasgoCanonico(rasgo: RasgoPersonaje): boolean {
  if (rasgo.personalizado || rasgo.origen === "personalizado") {
    return false;
  }
  return (
    rasgo.origen === "especie" ||
    rasgo.origen === "subespecie" ||
    rasgo.origen === "clase" ||
    rasgo.origen === "subclase"
  );
}

/**
 * Poda las opciones estáticas masivas de los selectores, conservando las selecciones del jugador.
 */
export function deshidratarSelector(selector: SelectorRasgo): SelectorRasgo {
  return {
    ...selector,
    // Eliminamos el compendio estático incrustado (ej. 40 dotes o 20 trucos)
    opciones: []
  };
}

/**
 * Deshidrata un rasgo individual para persistencia o exportación ligera.
 * Los rasgos canónicos se aligeran a su estado mutable, mientras que los Homebrew se conservan enteros.
 */
export function deshidratarRasgo(rasgo: RasgoPersonaje): RasgoPersonaje {
  const selectoresDeshidratados = Array.isArray(rasgo.selectores)
    ? rasgo.selectores.map(deshidratarSelector)
    : [];

  // Si es un rasgo personalizado o creado a mano por el usuario, se preserva íntegro
  if (!esRasgoCanonico(rasgo)) {
    return {
      ...rasgo,
      selectores: selectoresDeshidratados
    };
  }

  // Rasgo canónico: persistir únicamente su estado mutable e identificadores clave
  return {
    id: rasgo.id,
    nombre: rasgo.nombre,
    descripcion: "", // Se omite el texto estático; se rehidrata desde el compendio
    origen: rasgo.origen,
    fuente: rasgo.fuente,
    tipoAccion: rasgo.tipoAccion,
    nivelRequerido: rasgo.nivelRequerido,
    tieneUsosLimitados: Boolean(rasgo.tieneUsosLimitados),
    usosMaximos: rasgo.usosMaximos,
    usosRestantes: rasgo.usosRestantes,
    recuperacion: rasgo.recuperacion,
    formulaDados: rasgo.formulaDados,
    personalizado: false,
    activo: rasgo.activo,
    esActivable: rasgo.esActivable,
    autoDesactivar: rasgo.autoDesactivar,
    autoDesactivarAlTirarDano: rasgo.autoDesactivarAlTirarDano,
    dispararAlTirarIniciativa: rasgo.dispararAlTirarIniciativa,
    ligadoA: rasgo.ligadoA,
    gastarDePadre: rasgo.gastarDePadre,
    heredarDadosPadre: rasgo.heredarDadosPadre,
    condicionAlActivar: rasgo.condicionAlActivar,
    conjurosOtorgados: rasgo.conjurosOtorgados,
    categoriaMecanica: rasgo.categoriaMecanica,
    selectores: selectoresDeshidratados,
    efectos: [], // Se reconstituyen al sincronizar con el catálogo
    notas: rasgo.notas || ""
  };
}

/**
 * Deshidrata la ficha de personaje antes de guardarla en disco, TaleSpire o exportarla.
 * Reduce el volumen de datos en un ~80-87% eliminando duplicaciones enciclopédicas.
 */
export function deshidratarPersonaje(personaje: PersonajeJugador): PersonajeJugador {
  if (!personaje) return personaje;

  return {
    ...personaje,
    rasgos: Array.isArray(personaje.rasgos)
      ? personaje.rasgos.map(deshidratarRasgo)
      : []
  };
}

/**
 * Hidrata un personaje en memoria restaurando las descripciones oficiales,
 * tablas de progresión y opciones dinámicas directamente desde el compendio.
 */
export function hidratarPersonaje(personaje: PersonajeJugador): PersonajeJugador {
  if (!personaje) return personaje;

  return {
    ...personaje,
    rasgos: sincronizarRasgosAutomaticos(personaje)
  };
}
