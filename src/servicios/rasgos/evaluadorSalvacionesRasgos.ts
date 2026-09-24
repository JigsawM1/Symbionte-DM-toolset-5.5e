import {
  type PersonajeJugador,
  type Caracteristica,
  type Habilidad,
  type GradoCompetencia,
  GRADOS_HABILIDADES_DEFECTO
} from "@/tipos";
import {
  normalizar,
  obtenerNivelClasePersonaje,
  obtenerBonoDanoFuria
} from "./utilidadesRasgos";
import { evaluarEfectosRasgosActivos } from "./evaluadorExpresionesRasgos";

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
    if (tipoTirada === "salvacion" || tipoTirada === "salvacion_muerte") {
      const esMuerte = subtipoNorm === "muerte" || tipoTirada === "salvacion_muerte" || subtipoNorm === "salvacion.muerte";
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
          (esMuerte && (obj === "salvacion.muerte" || obj === "salvacion_muerte" || obj === "muerte" || obj === "salvaciones_muerte")) ||
          (esMental && (obj === "salvaciones_mentales" || obj === "salvacion.mental" || obj === "salvacion.mentales" || obj === "mentales")) ||
          (esFisica && (obj === "salvaciones_fisicas" || obj === "salvacion.fisica" || obj === "salvacion.fisicas" || obj === "fisicas"))
        );
      });

      if (coincideSalvacion) {
        if (esVentaja) {
          tieneVentaja = true;
          razones.push(ef.descripcion || (esMuerte ? "Ventaja en salvación contra la muerte" : `Ventaja en salvación de ${subtipoNorm}`));
        } else if (ef.tipo === "desventaja") {
          tieneDesventaja = true;
          razones.push(ef.descripcion || (esMuerte ? "Desventaja en salvación contra la muerte" : `Desventaja en salvación de ${subtipoNorm}`));
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
 * Obtiene los bonos numéricos directos a las tiradas de salvación otorgados por rasgos activos
 * (ej. Bendición oscura: +mod Carisma a todas las salvaciones).
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

/**
 * Obtiene competencias adicionales (armas marciales/sencillas, armaduras, herramientas)
 * otorgadas por rasgos activos o dotes seleccionadas (ej. Lecciones de los Primeros -> Fabricante).
 * Evaluación 100% genérica a través de efectos mecánicos de tipo 'competencia'.
 */
export function obtenerCompetenciasExtraRasgos(personaje: PersonajeJugador): {
  armasGrupos: ("sencillas" | "marciales" | "fuego")[];
  armadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
  armasImprovisadas?: boolean;
  herramientas: string[];
} {
  const armas = new Set<"sencillas" | "marciales" | "fuego">();
  const armaduras = new Set<"ligeras" | "medias" | "pesadas" | "escudos">();
  const herramientas = new Set<string>();
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

      if (
        texto.includes("herramienta") ||
        texto.includes("utiles") ||
        texto.includes("veneno") ||
        texto.includes("cocin") ||
        texto.includes("kit") ||
        ef.objetivo === "herramientas"
      ) {
        if (ef.valor && ef.valor !== "herramientas") {
          herramientas.add(String(ef.valor).trim());
        }
      }
    }
  }

  return {
    armasGrupos: Array.from(armas),
    armadurasGrupos: Array.from(armaduras),
    armasImprovisadas,
    herramientas: Array.from(herramientas)
  };
}

/**
 * Diccionario de sinónimos canónicos para herramientas y útiles (D&D 5.5e y 5e).
 */
export const MAPA_ALIAS_HERRAMIENTAS: Record<string, string[]> = {
  "utiles de envenenador": ["kit de venenos", "kit de envenenador", "utiles de envenenador", "herramientas de envenenador"],
  "kit de venenos": ["utiles de envenenador", "kit de envenenador", "kit de venenos"],
  "utiles de cocinero": ["utensilios de cocinero", "utiles de cocinero", "herramientas de cocinero", "kit de cocinero"],
  "utensilios de cocinero": ["utiles de cocinero", "utensilios de cocinero", "kit de cocinero"],
  "kit de cocinero": ["utiles de cocinero", "utensilios de cocinero", "herramientas de cocinero"],
  "utiles de herborista": ["kit de herboristeria", "kit de herboristería", "estuche de herbalismo", "utiles de herborista"],
  "kit de herboristeria": ["utiles de herborista", "estuche de herbalismo", "kit de herboristería"],
  "kit de herboristería": ["utiles de herborista", "estuche de herbalismo", "kit de herboristeria"],
  "herramientas de ladron": ["utiles de ladron", "herramientas de ladron", "útiles de ladrón", "kit de ladron", "kit de ladrón"],
  "utiles de ladron": ["herramientas de ladron", "utiles de ladron", "herramientas de ladrón", "kit de ladron", "kit de ladrón"],
  "kit de ladron": ["herramientas de ladron", "utiles de ladron", "útiles de ladrón"],
  "kit de ladrón": ["herramientas de ladron", "utiles de ladron", "útiles de ladrón"],
  "utiles para disfrazarse": ["kit de disfraz", "estuche de disfraces", "utiles para disfrazarse"],
  "kit de disfraz": ["utiles para disfrazarse", "estuche de disfraces", "kit de disfraz"],
  "utiles para falsificar": ["kit de falsificacion", "kit de falsificación", "utiles para falsificar"],
  "kit de falsificacion": ["utiles para falsificar", "kit de falsificación"],
  "kit de falsificación": ["utiles para falsificar", "kit de falsificacion"],
  "herramientas de navegante": ["kit de navegacion", "kit de navegación", "herramientas de navegante"],
  "kit de navegacion": ["herramientas de navegante", "kit de navegación"],
  "kit de navegación": ["herramientas de navegante", "kit de navegacion"]
};

/**
 * Comprueba si dos nombres de herramientas son idénticos o equivalentes semánticos.
 */
export function sonHerramientasEquivalentes(a: string, b: string): boolean {
  if (!a || !b) return false;
  const normA = normalizar(a);
  const normB = normalizar(b);
  if (normA === normB) return true;

  const aliasA = MAPA_ALIAS_HERRAMIENTAS[normA] || [];
  if (aliasA.some((al) => normalizar(al) === normB)) return true;

  const aliasB = MAPA_ALIAS_HERRAMIENTAS[normB] || [];
  if (aliasB.some((al) => normalizar(al) === normA)) return true;

  return false;
}

/**
 * Retorna las cadenas legibles de competencias en armas, armaduras y herramientas integrando
 * las competencias base del personaje y las otorgadas por rasgos de clase/subclase y dotes.
 */
export function obtenerCompetenciasEfectivasTexto(personaje: PersonajeJugador): {
  armasTexto: string;
  armadurasTexto: string;
  herramientasTexto: string;
  herramientasLista: string[];
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

  // Procesar herramientas integrando base y dotes/rasgos declarativos
  const listaHerramientasBase: string[] = [
    ...(personaje.herramientasLista || []),
    ...(personaje.herramientas && personaje.herramientas !== "Ninguna"
      ? personaje.herramientas.split(",").map((p) => p.trim()).filter(Boolean)
      : [])
  ];

  const herramientasConsolidadas: string[] = [];
  const agregarSiNoExiste = (nombre: string) => {
    if (!nombre || nombre === "Ninguna") return;
    const yaExiste = herramientasConsolidadas.some((existente) =>
      sonHerramientasEquivalentes(existente, nombre)
    );
    if (!yaExiste) {
      herramientasConsolidadas.push(nombre);
    }
  };

  listaHerramientasBase.forEach(agregarSiNoExiste);
  compExtra.herramientas.forEach(agregarSiNoExiste);

  return {
    armasTexto: partesArmas.size > 0 ? Array.from(partesArmas).join(", ") : "Ninguna",
    armadurasTexto: partesArmaduras.size > 0 ? Array.from(partesArmaduras).join(", ") : "Ninguna",
    herramientasTexto: herramientasConsolidadas.length > 0 ? herramientasConsolidadas.join(", ") : "Ninguna",
    herramientasLista: herramientasConsolidadas
  };
}
