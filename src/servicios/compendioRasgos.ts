import type { PersonajeJugador, RasgoPersonaje, DotePersonaje } from "@/tipos";
import {
  RASGOS_POR_CLASE,
  RASGOS_POR_ESPECIE,
  DOTES_CANONICAS_DND55
} from "@/constantes/rasgosDND55";

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
      activo: true,
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

  for (const itemClase of clases) {
    const normClase = normalizarTexto(itemClase.nombre);
    const nivel = Math.max(1, Math.min(20, itemClase.nivel || 1));
    const subclase = itemClase.subclase ? normalizarTexto(itemClase.subclase) : "";

    const claveClase = Object.keys(RASGOS_POR_CLASE).find(
      (k) => normalizarTexto(k) === normClase || normClase.includes(normalizarTexto(k))
    );

    if (!claveClase || !RASGOS_POR_CLASE[claveClase]) {
      continue;
    }

    const plantillas = RASGOS_POR_CLASE[claveClase];

    for (const p of plantillas) {
      // Filtrar por nivel
      if (p.nivel > nivel) continue;

      // Filtrar por subclase si el rasgo pertenece a una subclase específica
      if (p.subclase) {
        if (!subclase) continue;
        const normSubclaseRasgo = normalizarTexto(p.subclase);
        if (!subclase.includes(normSubclaseRasgo) && !normSubclaseRasgo.includes(subclase)) {
          continue;
        }
      }

      const id = `rasgo_cls_${normalizarTexto(claveClase)}_${normalizarTexto(p.nombre).replace(/\s+/g, "_")}`;
      const usos = p.tieneUsosLimitados && p.obtenerUsosMaximos ? p.obtenerUsosMaximos(nivel) : undefined;

      rasgosTotales.push({
        id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        origen: p.subclase ? "subclase" : "clase",
        fuente: `${claveClase} (Nivel ${p.nivel})${p.subclase ? ` - ${p.subclase}` : ""}`,
        tipoAccion: p.tipoAccion,
        nivelRequerido: p.nivel,
        tieneUsosLimitados: !!p.tieneUsosLimitados,
        usosMaximos: usos,
        usosRestantes: usos,
        recuperacion: p.recuperacion || "ninguno",
        formulaDados: p.formulaDados,
        personalizado: false,
        activo: true,
        notas: ""
      });
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

  // 1. Conservar rasgos personalizados, dotes y de trasfondo creados por el jugador
  const rasgosPersonalizados = rasgosExistentes.filter(
    (r) => r.personalizado || r.origen === "personalizado" || r.origen === "dote" || r.origen === "trasfondo"
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

  // 3. Fusionar respetando el estado de usos restantes previo si ya existía el rasgo
  const mapaExistentes = new Map(rasgosExistentes.map((r) => [r.id, r]));

  const canonicosFusionados = canonicosNuevos.map((nuevo) => {
    const existente = mapaExistentes.get(nuevo.id);
    if (existente) {
      return {
        ...nuevo,
        usosRestantes:
          typeof existente.usosRestantes === "number" && nuevo.usosMaximos
            ? Math.min(existente.usosRestantes, nuevo.usosMaximos)
            : nuevo.usosRestantes,
        activo: existente.activo !== undefined ? existente.activo : nuevo.activo,
        notas: existente.notas || nuevo.notas
      };
    }
    return nuevo;
  });

  return [...canonicosFusionados, ...rasgosPersonalizados];
}
