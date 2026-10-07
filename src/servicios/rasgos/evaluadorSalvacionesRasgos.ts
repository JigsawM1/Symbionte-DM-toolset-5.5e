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
import {
  evaluarEfectosRasgosActivos,
  resolverFormulaDinamica,
  evaluarExpresionNumericaSegura
} from "./evaluadorExpresionesRasgos";
import { MAPA_HABILIDAD_A_CARACTERISTICA } from "@/constantes/personajeConstantes";

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
 * Evalúa si los rasgos o efectos activos del personaje reducen niveles de cansancio / agotamiento
 * durante un descanso corto (ej. Incansable de Explorador Nv 10: -1 nivel de agotamiento en descanso corto).
 * Función GENÉRICA PURA: no hardcodea nombres de rasgos ni clases.
 */
export function evaluarReduccionCansancioDescansoCorto(personaje: PersonajeJugador): number {
  if (!personaje) return 0;
  const efectos = evaluarEfectosRasgosActivos(personaje);
  let reduccionTotal = 0;

  for (const ef of efectos) {
    const objNorm = normalizar(ef.objetivo || "");
    const esReduccionCansancio =
      (ef.tipo === "personalizado" || ef.tipo === "restaurar_recurso") &&
      (objNorm === "reducir_cansancio_descanso_corto" ||
        objNorm === "reducir_agotamiento_descanso_corto" ||
        (objNorm.includes("cansancio") && objNorm.includes("corto")) ||
        (objNorm.includes("agotamiento") && objNorm.includes("corto")));

    if (esReduccionCansancio) {
      const cant = Number(ef.valor) || 1;
      reduccionTotal += cant;
    }
  }

  return reduccionTotal;
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
      const coincideAtaque =
        objNorm === "ataque" ||
        objNorm === "ataques" ||
        objNorm === "todos_ataques" ||
        objNorm === "proximo_ataque" ||
        objNorm === "siguiente_ataque" ||
        (objNorm === "ataque_fuerza" && (subtipoNorm === "fuerza" || subtipoNorm === "")) ||
        (objNorm === "ataque_destreza" && (subtipoNorm === "destreza" || subtipoNorm === "")) ||
        (objNorm === "ataque_distancia" && (subtipoNorm === "distancia" || subtipoNorm === "")) ||
        (objNorm === "ataque_cac" && (subtipoNorm === "cac" || subtipoNorm === "cuerpo_a_cuerpo" || subtipoNorm === ""));

      if (coincideAtaque) {
        if (esVentaja) {
          tieneVentaja = true;
          razones.push(ef.descripcion || "Ventaja en tirada de ataque");
        } else if (ef.tipo === "desventaja") {
          tieneDesventaja = true;
          razones.push(ef.descripcion || "Desventaja en tirada de ataque");
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
        const formulaResuelta = resolverFormulaDinamica(valStr, personaje);
        const valorEval = evaluarExpresionNumericaSegura(formulaResuelta);
        valorNum = !isNaN(valorEval) ? valorEval : (Number(ef.valor) || 0);
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
 * Evaluación genérica mediante efectos declarativos.
 */
export function tieneMedioBonoHabilidades(personaje: PersonajeJugador): boolean {
  if (!personaje) return false;

  return evaluarEfectosRasgosActivos(personaje).some((ef) => ef.tipo === "medio_bono_habilidades");
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
  salvaciones: Caracteristica[];
  idiomas: string[];
  habilidades: Habilidad[];
} {
  const armas = new Set<"sencillas" | "marciales" | "fuego">();
  const armaduras = new Set<"ligeras" | "medias" | "pesadas" | "escudos">();
  const herramientas = new Set<string>();
  const salvaciones = new Set<Caracteristica>();
  const idiomas = new Set<string>();
  const habilidades = new Set<Habilidad>();
  let armasImprovisadas = false;

  const posiblesStats: Caracteristica[] = ["fuerza", "destreza", "constitucion", "inteligencia", "sabiduria", "carisma"];

  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "competencia") {
      const objNorm = normalizar(ef.objetivo);
      const valNorm = normalizar(String(ef.valor));
      const texto = `${objNorm} ${valNorm}`;
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
        texto.includes("utensilio") ||
        texto.includes("veneno") ||
        texto.includes("cocin") ||
        texto.includes("kit") ||
        texto.includes("disfraz") ||
        texto.includes("herboris") ||
        ef.objetivo === "herramientas"
      ) {
        if (ef.valor && ef.valor !== "herramientas" && ef.valor !== "competente") {
          herramientas.add(String(ef.valor).trim());
        }
      }

      // Habilidades adicionales otorgadas por rasgos (ej. Implementos de misericordia: Medicina, Perspicacia)
      if (
        objNorm.startsWith("habilidad.") ||
        objNorm.startsWith("habilidad_") ||
        objNorm === "habilidad" ||
        objNorm === "habilidades"
      ) {
        const habLimpia = objNorm.replace(/^habilidad[._]/, "");
        const habCanonica = MAPA_OBJETIVO_A_HABILIDAD[habLimpia] || (habLimpia as Habilidad);
        if (habCanonica && habCanonica in MAPA_HABILIDAD_A_CARACTERISTICA) {
          habilidades.add(habCanonica);
        }
      }
      if (valNorm in MAPA_OBJETIVO_A_HABILIDAD && (objNorm.includes("habilidad") || texto.includes("habilidad"))) {
        const habCanonica = MAPA_OBJETIVO_A_HABILIDAD[valNorm];
        if (habCanonica && habCanonica in MAPA_HABILIDAD_A_CARACTERISTICA) {
          habilidades.add(habCanonica);
        }
      }

      // Salvaciones adicionales otorgadas por rasgos (ej. Mente escurridiza)
      if (objNorm.startsWith("salvacion.") || objNorm.startsWith("salvacion_") || objNorm === "salvacion" || objNorm === "salvaciones") {
        const statLimpia = (objNorm.replace(/^salvacion[._]/, "") || valNorm) as Caracteristica;
        if (posiblesStats.includes(statLimpia)) {
          salvaciones.add(statLimpia);
        }
      }
      if (posiblesStats.includes(valNorm as Caracteristica) && (objNorm.includes("salvacion") || texto.includes("salvacion"))) {
        salvaciones.add(valNorm as Caracteristica);
      }

      // Idiomas adicionales otorgados por rasgos (ej. Jerga de ladrones)
      if (objNorm === "idioma" || objNorm === "idiomas" || objNorm.startsWith("idioma.") || texto.includes("idioma")) {
        if (ef.valor && ef.valor !== "idioma" && ef.valor !== "idiomas" && ef.valor !== "competente") {
          idiomas.add(String(ef.valor).trim());
        }
      }
    }
  }

  return {
    armasGrupos: Array.from(armas),
    armadurasGrupos: Array.from(armaduras),
    armasImprovisadas,
    herramientas: Array.from(herramientas),
    salvaciones: Array.from(salvaciones),
    idiomas: Array.from(idiomas),
    habilidades: Array.from(habilidades)
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
  "utiles de herborista": ["utensilios de herborista", "kit de herboristeria", "kit de herboristería", "estuche de herbalismo", "utiles de herborista", "herramientas de herborista"],
  "utensilios de herborista": ["utiles de herborista", "kit de herboristeria", "kit de herboristería", "estuche de herbalismo", "herramientas de herborista"],
  "kit de herboristeria": ["utiles de herborista", "utensilios de herborista", "estuche de herbalismo", "kit de herboristería"],
  "kit de herboristería": ["utiles de herborista", "utensilios de herborista", "estuche de herbalismo", "kit de herboristeria"],
  "herramientas de ladron": ["utiles de ladron", "herramientas de ladron", "útiles de ladrón", "kit de ladron", "kit de ladrón"],
  "utiles de ladron": ["herramientas de ladron", "utiles de ladron", "herramientas de ladrón", "kit de ladron", "kit de ladrón"],
  "kit de ladron": ["herramientas de ladron", "utiles de ladron", "útiles de ladrón"],
  "kit de ladrón": ["herramientas de ladron", "utiles de ladron", "útiles de ladrón"],
  "utiles para disfrazarse": ["kit de disfraz", "estuche de disfraces", "utiles para disfrazarse", "utiles de disfraz", "útiles de disfraz"],
  "utiles de disfraz": ["utiles para disfrazarse", "kit de disfraz", "estuche de disfraces", "utiles de disfraz", "útiles de disfraz"],
  "kit de disfraz": ["utiles para disfrazarse", "estuche de disfraces", "kit de disfraz", "utiles de disfraz", "útiles de disfraz"],
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
  idiomasTexto?: string;
  idiomasLista?: string[];
  salvacionesCompetentes?: Caracteristica[];
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

  // Procesar idiomas integrando base y dotes/rasgos declarativos
  const listaIdiomasBase: string[] = [
    ...(personaje.idiomasLista || []),
    ...(personaje.idiomas && personaje.idiomas !== "Ninguna" && personaje.idiomas !== "Ninguno"
      ? personaje.idiomas.split(",").map((p) => p.trim()).filter(Boolean)
      : [])
  ];

  const idiomasConsolidados: string[] = [];
  const agregarIdiomaSiNoExiste = (nombre: string) => {
    if (!nombre || nombre === "Ninguna" || nombre === "Ninguno") return;
    const yaExiste = idiomasConsolidados.some((existente) =>
      normalizar(existente) === normalizar(nombre)
    );
    if (!yaExiste) {
      idiomasConsolidados.push(nombre);
    }
  };

  listaIdiomasBase.forEach(agregarIdiomaSiNoExiste);
  compExtra.idiomas.forEach(agregarIdiomaSiNoExiste);

  return {
    armasTexto: partesArmas.size > 0 ? Array.from(partesArmas).join(", ") : "Ninguna",
    armadurasTexto: partesArmaduras.size > 0 ? Array.from(partesArmaduras).join(", ") : "Ninguna",
    herramientasTexto: herramientasConsolidadas.length > 0 ? herramientasConsolidadas.join(", ") : "Ninguna",
    herramientasLista: herramientasConsolidadas,
    idiomasTexto: idiomasConsolidados.length > 0 ? idiomasConsolidados.join(", ") : "Ninguno",
    idiomasLista: idiomasConsolidados,
    salvacionesCompetentes: compExtra.salvaciones
  };
}

/**
  * Diccionario de normalización para mapear objetivos de habilidades a identificadores canónicos Habilidad.
  */
const MAPA_OBJETIVO_A_HABILIDAD: Record<string, Habilidad> = {
  acrobacias: "acrobacias",
  atletismo: "atletismo",
  conocimiento_arcano: "arcanos",
  "conocimiento arcano": "arcanos",
  arcano: "arcanos",
  arcanos: "arcanos",
  arcana: "arcanos",
  engano: "engaño",
  engaño: "engaño",
  historia: "historia",
  interpretacion: "interpretacion",
  interpretación: "interpretacion",
  intimidacion: "intimidacion",
  intimidación: "intimidacion",
  investigacion: "investigacion",
  investigación: "investigacion",
  juego_de_manos: "juegoManos",
  "juego de manos": "juegoManos",
  juegomanos: "juegoManos",
  medicina: "medicina",
  naturaleza: "naturaleza",
  percepcion: "percepcion",
  percepción: "percepcion",
  perspicacia: "perspicacia",
  persuasion: "persuasion",
  persuasión: "persuasion",
  religion: "religion",
  religión: "religion",
  sigilo: "sigilo",
  supervivencia: "supervivencia",
  trato_con_animales: "manejoAnimales",
  "trato con animales": "manejoAnimales",
  manejoanimales: "manejoAnimales",
  animales: "manejoAnimales"
};

/**
 * Obtiene los bonificadores numéricos extra a habilidades procedentes de rasgos activos
 * con efecto `bono_habilidad` de forma 100% genérica y declarativa (ej. Taumaturgo: +MOD SAB a Religión y Arcano).
 */
export function obtenerBonosHabilidadesRasgos(
  personaje: PersonajeJugador
): Partial<Record<Habilidad, number>> {
  const bonos: Partial<Record<Habilidad, number>> = {};
  if (!personaje) return bonos;

  const efectos = evaluarEfectosRasgosActivos(personaje);
  for (const ef of efectos) {
    if (ef.tipo === "bono_habilidad") {
      const objLimpio = normalizar(ef.objetivo || "").replace(/^habilidad[._]/, "");
      const formulaResuelta = resolverFormulaDinamica(ef.valor, personaje);
      const valorNumerico = evaluarExpresionNumericaSegura(formulaResuelta);
      if (valorNumerico <= 0) continue;

      if (objLimpio === "todas" || objLimpio === "universal" || objLimpio === "") {
        const todasHabs: Habilidad[] = [
          "acrobacias", "atletismo", "arcanos", "engaño", "historia",
          "interpretacion", "intimidacion", "investigacion", "juegoManos",
          "medicina", "naturaleza", "percepcion", "perspicacia", "persuasion",
          "religion", "sigilo", "supervivencia", "manejoAnimales"
        ];
        for (const h of todasHabs) {
          bonos[h] = (bonos[h] || 0) + valorNumerico;
        }
      } else {
        const caracNorm =
          objLimpio === "car" ? "carisma" :
          objLimpio === "sab" ? "sabiduria" :
          objLimpio === "int" ? "inteligencia" :
          objLimpio === "des" ? "destreza" :
          objLimpio === "fue" ? "fuerza" :
          objLimpio === "con" ? "constitucion" : objLimpio;

        const esCaracteristica = ["fuerza", "destreza", "constitucion", "inteligencia", "sabiduria", "carisma"].includes(caracNorm);

        if (esCaracteristica) {
          for (const [hab, carac] of Object.entries(MAPA_HABILIDAD_A_CARACTERISTICA)) {
            if (carac === caracNorm) {
              bonos[hab as Habilidad] = (bonos[hab as Habilidad] || 0) + valorNumerico;
            }
          }
        } else {
          const habCanonica = MAPA_OBJETIVO_A_HABILIDAD[objLimpio] || (objLimpio as Habilidad);
          bonos[habCanonica] = (bonos[habCanonica] || 0) + valorNumerico;
        }
      }
    }
  }

  return bonos;
}
