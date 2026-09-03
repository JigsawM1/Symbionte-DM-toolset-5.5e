import type { PersonajeJugador, RasgoPersonaje, DotePersonaje } from "@/tipos";
import {
  RASGOS_POR_ESPECIE,
  DOTES_CANONICAS_DND55
} from "@/constantes/rasgosDND55";
import { obtenerRasgosClaseYSubclase } from "@/servicios/gestorClases";

/**
 * Normaliza nombres para comparación tolerante e insensible a mayúsculas/acentos
 */
function normalizarTexto(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Obtiene la lista de rasgos sugeridos para una especie/raza de D&D 5.5e
 */
export function obtenerRasgosSugeridosPorEspecie(
  especie: string,
  subespecie?: string
): RasgoPersonaje[] {
  const normEspecie = normalizarTexto(especie);
  
  // Buscar en el diccionario
  const clave = Object.keys(RASGOS_POR_ESPECIE).find(
    (k) => normalizarTexto(k) === normEspecie || normEspecie.includes(normalizarTexto(k))
  );

  if (!clave || !RASGOS_POR_ESPECIE[clave]) {
    return [];
  }

  const plantillas = RASGOS_POR_ESPECIE[clave];
  const nombreLimpio = clave;

  return plantillas.map((p) => {
    const id = `rasgo_esp_${normalizarTexto(nombreLimpio)}_${normalizarTexto(p.nombre).replace(/\s+/g, "_")}`;
    const usos = p.tieneUsosLimitados ? p.usosMaximos || 1 : undefined;

    return {
      id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      origen: "especie",
      fuente: `Especie: ${nombreLimpio}${subespecie ? ` (${subespecie})` : ""}`,
      tipoAccion: p.tipoAccion,
      tieneUsosLimitados: !!p.tieneUsosLimitados,
      usosMaximos: usos,
      usosRestantes: usos,
      recuperacion: p.recuperacion || "ninguno",
      formulaDados: p.formulaDados,
      personalizado: false,
      activo: (p as { esActivable?: boolean }).esActivable ? false : true,
      notas: ""
    };
  });
}

/**
 * Obtiene los rasgos sugeridos para las clases y subclases configuradas en el personaje
 */
export function obtenerRasgosSugeridosPorClases(
  clases: { nombre: string; subclase?: string; nivel: number }[]
): RasgoPersonaje[] {
  const rasgosTotales: RasgoPersonaje[] = [];
  const idsVistos = new Set<string>();

  for (const itemClase of clases) {
    const nivel = Math.max(1, Math.min(20, itemClase.nivel || 1));
    const rasgosClase = obtenerRasgosClaseYSubclase(itemClase.nombre, nivel, itemClase.subclase);
    for (const r of rasgosClase) {
      if (!idsVistos.has(r.id)) {
        idsVistos.add(r.id);
        rasgosTotales.push(r);
      }
    }
  }

  return rasgosTotales;
}

/**
 * Obtiene todas las dotes canónicas predefinidas de D&D 5.5e
 */
export function obtenerTodasDotesCanonicas(): DotePersonaje[] {
  return DOTES_CANONICAS_DND55;
}

/**
 * Sincroniza y fusiona los rasgos automáticos (Especie y Clases) con los rasgos existentes del personaje,
 * preservando intactos los rasgos personalizados, dotes y los contadores de usos modificados.
 */
export function sincronizarRasgosAutomaticos(personaje: PersonajeJugador): RasgoPersonaje[] {
  const rasgosExistentes = Array.isArray(personaje.rasgos) ? personaje.rasgos : [];

  // 1. Conservar rasgos personalizados, dotes y de trasfondo creados por el jugador (purgando marcadores obsoletos)
  const rasgosPersonalizados = rasgosExistentes.filter(
    (r) =>
      (r.personalizado || r.origen === "personalizado" || r.origen === "dote" || r.origen === "trasfondo") &&
      !r.nombre.toLowerCase().includes("rasgo de subclase")
  );

  // 2. Resolver rasgos canónicos según Especie y Clases
  const clasesCalculo =
    personaje.clases && personaje.clases.length > 0
      ? personaje.clases.map((c, idx) => ({
          ...c,
          nombre: c.nombre || (idx === 0 ? personaje.clase || "Guerrero" : "Guerrero"),
          subclase: c.subclase !== undefined ? c.subclase : (idx === 0 ? personaje.subclase || "" : ""),
          nivel:
            personaje.clases.length === 1 && typeof personaje.nivel === "number" && personaje.nivel > 0
              ? personaje.nivel
              : c.nivel || 1
        }))
      : [{ nombre: personaje.clase || "Guerrero", subclase: personaje.subclase || "", nivel: personaje.nivel || 1 }];

  const rasgosEspecie = obtenerRasgosSugeridosPorEspecie(personaje.especie, personaje.subespecie);
  const rasgosClase = obtenerRasgosSugeridosPorClases(clasesCalculo);

  const canonicosNuevos = [...rasgosEspecie, ...rasgosClase];

  // Filtrar placeholders de tabla y deduplicar canonicosNuevos por ID
  const idsVistosNuevos = new Set<string>();
  const canonicosNuevosUnicos: RasgoPersonaje[] = [];
  for (const r of canonicosNuevos) {
    if (!r.nombre.toLowerCase().includes("rasgo de subclase") && !idsVistosNuevos.has(r.id)) {
      idsVistosNuevos.add(r.id);
      canonicosNuevosUnicos.push(r);
    }
  }

  // 3. Fusionar respetando el estado de usos restantes previo si ya existía el rasgo
  const mapaExistentes = new Map(rasgosExistentes.map((r) => [r.id, r]));

  const canonicosFusionados = canonicosNuevosUnicos.map((nuevo) => {
    const existente = mapaExistentes.get(nuevo.id);
    if (existente) {
      return {
        ...nuevo,
        usosRestantes:
          typeof existente.usosRestantes === "number" && nuevo.usosMaximos
            ? Math.min(existente.usosRestantes, nuevo.usosMaximos)
            : nuevo.usosRestantes,
        activo: existente.activo !== undefined ? existente.activo : (nuevo.esActivable ? false : true),
        notas: existente.notas || nuevo.notas
      };
    }
    return {
      ...nuevo,
      activo: nuevo.esActivable ? false : (nuevo.activo ?? true)
    };
  });

  // 4. Garantizar deduplicación estricta por ID único en el array consolidado final
  const mapaFinal = new Map<string, RasgoPersonaje>();
  for (const r of [...canonicosFusionados, ...rasgosPersonalizados]) {
    if (!mapaFinal.has(r.id)) {
      mapaFinal.set(r.id, r);
    }
  }

  return Array.from(mapaFinal.values());
}
