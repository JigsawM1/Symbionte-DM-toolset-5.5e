import type {
  DefinicionClase,
  DefinicionSubclase,
  BuildClaseCalculada,
  OpcionesAplicarBuild,
  PersonajeJugador,
  RasgoPersonaje,
  ClasePersonaje,
  ClaseLanzadora,
  CompetenciasSalvacion
} from "@/tipos";
import {
  CATALOGO_CLASES_DND55,
  DICCIONARIO_CLASES_POR_NOMBRE,
  DICCIONARIO_CLASES_POR_ID,
  TODAS_SUBCLASES_DND55
} from "@/constantes/clasesDND55";
import { calcularTodosRecursosMagicos } from "@/servicios/calculadorMagia";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { sincronizarConjurosSubclaseHelper } from "@/servicios/sincronizadorConjurosSubclase";
import { resolverGruposYSustitutosCompetencias } from "@/constantes/competenciasConstantes";
import { logger } from "@/utiles/logger";
import {
  tieneMedioBonoHabilidades,
  aplicarAprendizDeMuchoAGradosHabilidades,
  obtenerCompetenciasExtraRasgos
} from "@/servicios/evaluadorEfectosRasgos";


/**
 * Normaliza cadenas de texto para comparaciones tolerantes (insensible a tildes, mayúsculas y espacios).
 */
export function normalizarTextoClase(texto: unknown): string {
  if (typeof texto !== "string") return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Retorna la lista completa de las 12 clases oficiales de D&D 5.5e (2024).
 */
export function obtenerCatalogoClases(): DefinicionClase[] {
  return CATALOGO_CLASES_DND55;
}

/**
 * Retorna todas las 48 subclases canónicas del sistema.
 */
export function obtenerTodasSubclases(): DefinicionSubclase[] {
  return TODAS_SUBCLASES_DND55;
}

/**
 * Busca una clase por su ID o clave interna.
 */
export function obtenerClasePorId(id: string): DefinicionClase | undefined {
  if (!id) return undefined;
  const idNorm = normalizarTextoClase(id);
  return DICCIONARIO_CLASES_POR_ID[idNorm] || CATALOGO_CLASES_DND55.find((c) => normalizarTextoClase(c.id) === idNorm);
}

/**
 * Busca una clase de forma tolerante e insensible a acentos/mayúsculas por su nombre.
 */
export function obtenerClasePorNombre(nombre: string): DefinicionClase | undefined {
  if (!nombre) return undefined;
  if (DICCIONARIO_CLASES_POR_NOMBRE[nombre]) {
    return DICCIONARIO_CLASES_POR_NOMBRE[nombre];
  }
  const norm = normalizarTextoClase(nombre);
  return CATALOGO_CLASES_DND55.find((c) => {
    const cNorm = normalizarTextoClase(c.nombre);
    const idNorm = normalizarTextoClase(c.id);
    return cNorm === norm || idNorm === norm || cNorm.includes(norm) || norm.includes(cNorm);
  });
}

/**
 * Retorna las subclases pertenecientes a una clase específica.
 */
export function obtenerSubclasesDeClase(claseNombreOId: string): DefinicionSubclase[] {
  const clase = obtenerClasePorNombre(claseNombreOId) || obtenerClasePorId(claseNombreOId);
  if (!clase) return [];
  return clase.subclases;
}

/**
 * Busca una subclase por nombre tolerante dentro de una clase (o en el catálogo global si no se especifica clase).
 */
export function obtenerSubclasePorNombre(
  claseNombreOId?: string,
  subclaseNombre?: string
): DefinicionSubclase | undefined {
  if (!subclaseNombre) return undefined;
  const subNorm = normalizarTextoClase(subclaseNombre);

  if (claseNombreOId) {
    const subclases = obtenerSubclasesDeClase(claseNombreOId);
    const encontrada = subclases.find((s) => {
      const sNorm = normalizarTextoClase(s.nombre);
      const sId = normalizarTextoClase(s.id);
      return sNorm === subNorm || sId === subNorm || sNorm.includes(subNorm) || subNorm.includes(sNorm);
    });
    if (encontrada) return encontrada;
  }

  // Búsqueda global de contingencia
  return TODAS_SUBCLASES_DND55.find((s) => {
    const sNorm = normalizarTextoClase(s.nombre);
    const sId = normalizarTextoClase(s.id);
    return sNorm === subNorm || sId === subNorm || sNorm.includes(subNorm) || subNorm.includes(sNorm);
  });
}

/**
 * Evalúa de forma segura fórmulas numéricas o expresiones ternarias de usos máximos
 * procedentes de definiciones TypeScript o catálogos JSON.
 * Ej: "(niv) => (niv >= 17 ? 6 : niv >= 12 ? 5 : niv >= 6 ? 4 : niv >= 3 ? 3 : 2)"
 * Ej: "1", "2", "niv"
 */
export function evaluarFormulaUsos(formula: string | null | undefined, nivel: number): number | undefined {
  if (!formula) return undefined;
  const numDirecto = Number(formula);
  if (!isNaN(numDirecto) && numDirecto > 0) return numDirecto;

  const niv = Math.max(1, Math.min(20, Math.floor(nivel) || 1));

  try {
    const cuerpo = formula.includes("=>") ? formula.split("=>")[1].trim() : formula;
    const cuerpoNormalizado = cuerpo.replace(/\b(nivel|level)\b/g, "niv");
    const regexTernario = /niv\s*(>=|>|<=|<|===|==)\s*(\d+)\s*\?\s*(\d+)/g;
    let match;
    while ((match = regexTernario.exec(cuerpoNormalizado)) !== null) {
      const op = match[1];
      const limite = parseInt(match[2], 10);
      const valor = parseInt(match[3], 10);

      let cumple = false;
      if (op === ">=" && niv >= limite) cumple = true;
      else if (op === ">" && niv > limite) cumple = true;
      else if (op === "<=" && niv <= limite) cumple = true;
      else if (op === "<" && niv < limite) cumple = true;
      else if ((op === "===" || op === "==") && niv === limite) cumple = true;

      if (cumple) return valor;
    }

    const partesDosPuntos = cuerpo.split(":");
    if (partesDosPuntos.length > 1) {
      const ultimo = partesDosPuntos[partesDosPuntos.length - 1].replace(/[()]/g, "").trim();
      const valDefecto = parseInt(ultimo, 10);
      if (!isNaN(valDefecto)) return valDefecto;
    }
  } catch (error) {
    logger.warn(`[gestorClases] Error al evaluar formulaUsos: "${formula}"`, error);
  }

  return undefined;
}

/**
 * Resuelve todos los escalados declarativos de un rasgo según el nivel actual.
 * Esta función es GENÉRICA PURA: no conoce nombres de rasgos ni clases.
 * Reemplaza todos los bloques `if (r.nombre === "...")` que existían en el builder.
 */
function resolverEscaladosRasgo(
  r: {
    formulaDados?: string;
    recuperacion?: string;
    sincronizarEfectosConFormula?: boolean;
    escaladoFormulaDados?: Array<{ nivelMinimo: number; valor: string }>;
    escaladoUsos?: {
      tipo: "por_nivel" | "por_modificador";
      tabla?: Array<{ nivelMinimo: number; valor: number }>;
      modificador?: string;
      minimo?: number;
    };
    escaladoRecuperacion?: Array<{ nivelMinimo: number; valor: string }>;
  },
  nivel: number,
  efectosBase: Array<Record<string, unknown>>,
  selectoresBase: Array<Record<string, unknown>>
): {
  formulaDados: string | undefined;
  usosEscalados: number | undefined;
  recuperacion: string | undefined;
  efectos: Array<Record<string, unknown>>;
  selectores: Array<Record<string, unknown>>;
} {
  let formulaDados = r.formulaDados;
  let usosEscalados: number | undefined;
  let recuperacion = r.recuperacion;
  const efectos: Array<Record<string, unknown>> = JSON.parse(JSON.stringify(efectosBase));
  const selectores: Array<Record<string, unknown>> = JSON.parse(JSON.stringify(selectoresBase));

  // 1. Escalado de fórmula de dados
  if (r.escaladoFormulaDados?.length) {
    const entrada = [...r.escaladoFormulaDados]
      .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
      .find((e) => nivel >= e.nivelMinimo);
    if (entrada) formulaDados = entrada.valor;
  }

  // 2. Escalado de usos por tabla de nivel
  if (r.escaladoUsos?.tipo === "por_nivel" && r.escaladoUsos.tabla?.length) {
    const minimo = r.escaladoUsos.minimo ?? 1;
    const entrada = [...r.escaladoUsos.tabla]
      .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
      .find((e) => nivel >= e.nivelMinimo);
    if (entrada) usosEscalados = Math.max(minimo, entrada.valor);
  }

  // 3. Escalado de recuperación
  if (r.escaladoRecuperacion?.length) {
    const entrada = [...r.escaladoRecuperacion]
      .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
      .find((e) => nivel >= e.nivelMinimo);
    if (entrada) recuperacion = entrada.valor;
  }

  // 4. Sincronizar efectos con la fórmula de dados resuelta
  if (r.sincronizarEfectosConFormula && formulaDados) {
    const tiposASincronizar = new Set(["dado_extra_dano", "ataque_desarmado", "bono_dano_fuerza", "dano_secundario"]);
    for (const ef of efectos) {
      if (typeof ef.tipo === "string" && tiposASincronizar.has(ef.tipo)) {
        ef.valor = formulaDados;
      }
    }
  }

  // 5. Selectores: opciones dinámicas y escalado de maxSelecciones
  for (const sel of selectores) {
    const opcionesDinamicas = sel.opcionesDinamicas as Array<{ nivelMinimo: number; opciones: Array<Record<string, unknown>> }> | undefined;
    if (opcionesDinamicas?.length) {
      const opcionesActuales = sel.opciones as Array<{ id: string }>;
      for (const grupo of opcionesDinamicas) {
        if (nivel >= grupo.nivelMinimo) {
          for (const op of grupo.opciones) {
            if (!opcionesActuales.some((o) => o.id === op.id)) {
              opcionesActuales.push(op as { id: string });
            }
          }
        }
      }
    }
    const escaladoMax = sel.escaladoMaxSelecciones as Array<{ nivelMinimo: number; valor: number }> | undefined;
    if (escaladoMax?.length) {
      const entrada = [...escaladoMax]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => nivel >= e.nivelMinimo);
      if (entrada) {
        sel.maxSelecciones = entrada.valor;
        if (entrada.valor > 1) {
          sel.tipo = "multiple";
        }
      }
    }
  }

  return { formulaDados, usosEscalados, recuperacion, efectos, selectores };
}

/**
 * Obtiene los rasgos de clase y subclase correspondientes a un nivel específico.
 * El builder es GENÉRICO PURO: consume metadatos declarativos del catálogo.
 * No contiene bifurcaciones por nombre de rasgo ni de clase.
 */
export function obtenerRasgosClaseYSubclase(
  claseNombre: string,
  nivel: number,
  subclaseNombre?: string
): RasgoPersonaje[] {
  const clase = obtenerClasePorNombre(claseNombre);
  if (!clase) return [];

  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  const rasgosResultado: RasgoPersonaje[] = [];

  // ── Función auxiliar para construir un RasgoPersonaje desde una plantilla ──
  function construirRasgo(
    r: import("@/constantes/rasgosDND55").PlantillaRasgoClase,
    id: string,
    fuente: string,
    origen: "clase" | "subclase"
  ): RasgoPersonaje {
    let usos: number | undefined;
    if (r.tieneUsosLimitados) {
      if (typeof r.obtenerUsosMaximos === "function") {
        usos = r.obtenerUsosMaximos(nivelSeguro);
      } else if (r.formulaUsos) {
        usos = evaluarFormulaUsos(r.formulaUsos, nivelSeguro);
      }
    }

    const efectosBase = r.efectos ? (r.efectos as unknown as Array<Record<string, unknown>>) : [];
    const selectoresBase = r.selectores ? (r.selectores as unknown as Array<Record<string, unknown>>) : [];

    const escalados = resolverEscaladosRasgo(r, nivelSeguro, efectosBase, selectoresBase);

    // Los usos escalados por tabla tienen precedencia sobre obtenerUsosMaximos
    const usosFinales = escalados.usosEscalados ?? usos;

    return {
      id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      origen,
      fuente,
      tipoAccion: r.tipoAccion,
      nivelRequerido: r.nivel,
      tieneUsosLimitados: !!r.tieneUsosLimitados,
      usosMaximos: usosFinales,
      usosRestantes: usosFinales,
      recuperacion: (escalados.recuperacion ?? r.recuperacion ?? "ninguno") as import("@/tipos/rasgos").RecuperacionRasgo,
      formulaDados: escalados.formulaDados,
      escaladoFormulaDados: r.escaladoFormulaDados,
      escaladoUsos: r.escaladoUsos as import("@/tipos/rasgos").EscaladoUsos | undefined,
      escaladoRecuperacion: r.escaladoRecuperacion,
      sincronizarEfectosConFormula: !!r.sincronizarEfectosConFormula,
      personalizado: false,
      activo: r.esActivable ? false : true,
      esActivable: !!r.esActivable,
      condicionAlActivar: r.condicionAlActivar,
      restaurarUsosAlActivar: r.restaurarUsosAlActivar ? { ...r.restaurarUsosAlActivar } : undefined,
      autoDesactivar: !!r.autoDesactivar,
      ligadoA: r.ligadoA,
      gastarDePadre: !!r.gastarDePadre,
      heredarDadosPadre: !!r.heredarDadosPadre,
      conjurosOtorgados: r.conjurosOtorgados ? [...r.conjurosOtorgados] : [],
      categoriaMecanica: r.categoriaMecanica,
      formulaEscalado: r.formulaEscalado,
      efectos: escalados.efectos as import("@/tipos/rasgos").EfectoMecanicoRasgo[],
      selectores: escalados.selectores as import("@/tipos/rasgos").SelectorRasgo[],
      tablaProgresion: r.tablaProgresion ? JSON.parse(JSON.stringify(r.tablaProgresion)) : undefined,
      notas: ""
    };
  }

  // 1. Rasgos de Clase Base
  for (const r of clase.rasgos) {
    if (r.nivel <= nivelSeguro) {
      // Consolidación orgánica de "Mejora de característica" (múltiples niveles → un rasgo)
      if (r.nombre === "Mejora de característica") {
        const existenteMejora = rasgosResultado.find((x) => x.nombre === "Mejora de característica");
        if (existenteMejora) {
          const nivelesPrevios = existenteMejora.notas ? existenteMejora.notas.split(",") : [String(existenteMejora.nivelRequerido)];
          if (!nivelesPrevios.includes(String(r.nivel))) nivelesPrevios.push(String(r.nivel));
          existenteMejora.notas = nivelesPrevios.join(",");
          existenteMejora.fuente = `${clase.nombre} (Niveles ${nivelesPrevios.join(", ")})`;
          existenteMejora.descripcion = `Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones.\n\n***Niveles alcanzados:*** ${nivelesPrevios.join(", ")}.`;
          continue;
        }
      }

      // Consolidación orgánica de rasgos de extensión ligados a otro rasgo (Decorator pattern genérico)
      if (r.categoriaMecanica === "extension" && r.ligadoA) {
        const ligNorm = normalizarTextoClase(r.ligadoA);
        const padre = rasgosResultado.find(
          (x) => normalizarTextoClase(x.id) === ligNorm || normalizarTextoClase(x.nombre) === ligNorm
        );
        if (padre) {
          const nivelesPrevios = padre.notas ? padre.notas.split(",") : [String(padre.nivelRequerido)];
          if (!nivelesPrevios.includes(String(r.nivel))) {
            nivelesPrevios.push(String(r.nivel));
          }
          padre.notas = nivelesPrevios.join(",");
          padre.fuente = `${clase.nombre} (Niveles ${nivelesPrevios.join(", ")})`;
          padre.descripcion += `\n\n***${r.nombre} (Nv. ${r.nivel}).*** ${r.descripcion}`;
          if (r.formulaDados) padre.formulaDados = r.formulaDados;
        }
        continue;
      }
      const nombreNorm = r.nombre.toLowerCase().trim();
      if (nombreNorm === "rasgo de subclase" || nombreNorm.includes("rasgo de subclase")) continue;

      const id = `rasgo_cls_${normalizarTextoClase(clase.id)}_${normalizarTextoClase(r.nombre).replace(/\s+/g, "_")}`;
      const fuente = `${clase.nombre} (Nivel ${r.nivel})`;

      rasgosResultado.push(construirRasgo(r, id, fuente, "clase"));
    }
  }

  // 2. Rasgos de Subclase
  if (subclaseNombre) {
    const subclase = obtenerSubclasePorNombre(clase.nombre, subclaseNombre);
    if (subclase) {
      for (const r of subclase.rasgos) {
        if (r.nivel <= nivelSeguro) {
          const id = `rasgo_sub_${normalizarTextoClase(subclase.id)}_${normalizarTextoClase(r.nombre).replace(/\s+/g, "_")}`;
          const fuente = `${clase.nombre} (${subclase.nombre} - Nivel ${r.nivel})`;

          rasgosResultado.push(construirRasgo(r, id, fuente, "subclase"));
        }
      }
    }
  }

  return rasgosResultado;
}


/**
 * Obtiene los conjuros siempre preparados y trucos otorgados por una subclase hasta un nivel dado.
 */
export function obtenerConjurosSubclaseBuild(
  claseNombre: string,
  subclaseNombre: string,
  nivel: number,
  varianteSubclase?: string
): { conjuros: string[]; trucos: string[] } {
  const subclase = obtenerSubclasePorNombre(claseNombre, subclaseNombre);
  if (!subclase) {
    return { conjuros: [], trucos: [] };
  }

  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  const conjurosSet = new Set<string>();
  const trucosSet = new Set<string>();

  let progresion = subclase.progresionConjuros || [];
  if (subclase.variantesConjuros && varianteSubclase) {
    const varNorm = normalizarTextoClase(varianteSubclase);
    for (const [claveVar, progVar] of Object.entries(subclase.variantesConjuros)) {
      if (normalizarTextoClase(claveVar).includes(varNorm) || varNorm.includes(normalizarTextoClase(claveVar))) {
        progresion = progVar;
        break;
      }
    }
  }

  for (const entrada of progresion) {
    if (nivelSeguro >= entrada.nivelClase) {
      (entrada.conjuros || []).forEach((c) => conjurosSet.add(c));
      (entrada.trucos || []).forEach((t) => trucosSet.add(t));
    }
  }

  return {
    conjuros: Array.from(conjurosSet),
    trucos: Array.from(trucosSet)
  };
}

/**
 * Construye la estructura completa de build para una clase y subclase a un nivel dado.
 */
export function construirBuildClase(
  claseNombre: string,
  nivel: number = 1,
  subclaseNombre?: string,
  varianteSubclase?: string
): BuildClaseCalculada | null {
  const clase = obtenerClasePorNombre(claseNombre);
  if (!clase) return null;

  const nivelSeguro = Math.max(1, Math.min(20, Math.floor(nivel) || 1));
  const subclase = subclaseNombre ? obtenerSubclasePorNombre(clase.nombre, subclaseNombre) : undefined;
  const rasgos = obtenerRasgosClaseYSubclase(clase.nombre, nivelSeguro, subclase?.nombre);
  const magiaSubclase = subclase
    ? obtenerConjurosSubclaseBuild(clase.nombre, subclase.nombre, nivelSeguro, varianteSubclase)
    : { conjuros: [], trucos: [] };

  const configMagica = subclase?.configuracionMagica || clase.configuracionMagica;

  return {
    clase,
    subclase,
    nivel: nivelSeguro,
    dadoGolpe: clase.dadoGolpe,
    salvacionesCompetentes: clase.salvacionesCompetentes,
    competenciasArmaduras: clase.competenciasArmaduras,
    competenciasArmas: clase.competenciasArmas,
    competenciasHerramientas: clase.competenciasHerramientas || [],
    rasgos,
    configuracionMagica: configMagica,
    conjurosSiemprePreparados: magiaSubclase.conjuros,
    trucosOtorgados: magiaSubclase.trucos,
    efectosActivosResueltos: rasgos.flatMap((r) => (r.activo !== false ? r.efectos || [] : []))
  };
}

/**
 * Aplica una build de clase y subclase completa a un personaje de forma inmutable y pura.
 */
export function aplicarBuildClaseAPersonaje(
  personaje: PersonajeJugador,
  claseNombreOBuild: string | BuildClaseCalculada,
  nivelOOpciones?: number | OpcionesAplicarBuild,
  subclaseNombre?: string,
  opcionesParam?: OpcionesAplicarBuild
): PersonajeJugador {
  let build: BuildClaseCalculada | null = null;
  let opciones: OpcionesAplicarBuild = {
    sobrescribirDadoGolpe: true,
    sobrescribirSalvaciones: true,
    sobrescribirCompetenciasEquipo: true,
    sobrescribirConfiguracionMagia: true,
    sincronizarRasgos: true,
    sincronizarConjurosSubclase: true
  };

  if (typeof claseNombreOBuild === "object" && claseNombreOBuild !== null) {
    build = claseNombreOBuild;
    if (typeof nivelOOpciones === "object" && nivelOOpciones !== null) {
      opciones = { ...opciones, ...nivelOOpciones };
    }
  } else {
    const nivel = typeof nivelOOpciones === "number" ? nivelOOpciones : 1;
    if (opcionesParam) {
      opciones = { ...opciones, ...opcionesParam };
    }
    build = construirBuildClase(claseNombreOBuild, nivel, subclaseNombre);
  }

  if (!build) return personaje;

  const nuevoNivel = build.nivel;
  const nuevoNombreClase = build.clase.nombre;
  const nuevoNombreSubclase = build.subclase?.nombre || "";

  // 1. Actualizar lista estructurada de clases
  const clasesActualizadas: ClasePersonaje[] = [
    {
      nombre: nuevoNombreClase,
      subclase: nuevoNombreSubclase,
      nivel: nuevoNivel
    }
  ];

  // 2. Salvaciones
  const competenciasSalvacion: CompetenciasSalvacion = opciones.sobrescribirSalvaciones
    ? {
        fuerza: build.salvacionesCompetentes.includes("fuerza"),
        destreza: build.salvacionesCompetentes.includes("destreza"),
        constitucion: build.salvacionesCompetentes.includes("constitucion"),
        inteligencia: build.salvacionesCompetentes.includes("inteligencia"),
        sabiduria: build.salvacionesCompetentes.includes("sabiduria"),
        carisma: build.salvacionesCompetentes.includes("carisma")
      }
    : personaje.competenciasSalvacion;

  // 3. Competencias de equipo
  let competenciasArmas = personaje.competenciasArmas;
  let competenciasArmasGrupos = personaje.competenciasArmasGrupos;
  let competenciasArmasLista = personaje.competenciasArmasLista;
  let competenciasArmaduras = personaje.competenciasArmaduras;
  let competenciasArmadurasGrupos = personaje.competenciasArmadurasGrupos;
  let competenciasArmadurasLista = personaje.competenciasArmadurasLista;

  if (opciones.sobrescribirCompetenciasEquipo) {
    const res = resolverGruposYSustitutosCompetencias(build.competenciasArmas, build.competenciasArmaduras);
    competenciasArmas = res.competenciasArmas;
    competenciasArmasGrupos = res.competenciasArmasGrupos;
    competenciasArmasLista = res.competenciasArmasLista;
    competenciasArmaduras = res.competenciasArmaduras;
    competenciasArmadurasGrupos = res.competenciasArmadurasGrupos;
    competenciasArmadurasLista = res.competenciasArmadurasLista;
  }

  // 4. Magia y lanzador
  let esLanzador = personaje.esLanzador;
  let clasesLanzadoras: ClaseLanzadora[] = personaje.clasesLanzadoras || [];
  let espaciosConjuroMaximos = personaje.espaciosConjuroMaximos || {};
  let puntosConjuroMaximos = personaje.puntosConjuroMaximos || 0;
  let nivelConjuroMaximo = personaje.nivelConjuroMaximo || 0;
  let espaciosPactoMaximos = personaje.espaciosPactoMaximos || 0;
  let nivelEspacioPacto = personaje.nivelEspacioPacto || 0;

  if (opciones.sobrescribirConfiguracionMagia) {
    if (build.configuracionMagica) {
      esLanzador = true;
      clasesLanzadoras = [
        {
          clase: nuevoNombreClase,
          nivel: nuevoNivel,
          tipoLanzador: build.configuracionMagica.tipoLanzador,
          habilidadConjuro: build.configuracionMagica.habilidadConjuro,
          modeloConjuros: build.configuracionMagica.modeloConjuros
        }
      ];
      const recursos = calcularTodosRecursosMagicos(
        clasesLanzadoras,
        personaje.overrideEspaciosConjuro,
        personaje.overridePuntosConjuro
      );
      espaciosConjuroMaximos = recursos.espaciosConjuroMaximos;
      puntosConjuroMaximos = recursos.puntosConjuroMaximos;
      nivelConjuroMaximo = recursos.nivelConjuroMaximo;
      espaciosPactoMaximos = recursos.espaciosPactoMaximos;
      nivelEspacioPacto = recursos.nivelEspacioPacto;
    } else {
      esLanzador = false;
      clasesLanzadoras = [];
      espaciosConjuroMaximos = {};
      puntosConjuroMaximos = 0;
      nivelConjuroMaximo = 0;
      espaciosPactoMaximos = 0;
      nivelEspacioPacto = 0;
    }
  }

  // 5. Instanciar personaje base intermedio
  const personajeIntermedio: PersonajeJugador = {
    ...personaje,
    clase: nuevoNombreClase,
    subclase: nuevoNombreSubclase,
    nivel: nuevoNivel,
    clases: clasesActualizadas,
    tipoDadoGolpe: opciones.sobrescribirDadoGolpe ? build.dadoGolpe : personaje.tipoDadoGolpe,
    dadosGolpeTotal: opciones.sobrescribirDadoGolpe ? nuevoNivel : personaje.dadosGolpeTotal,
    dadosGolpeRestantes: opciones.sobrescribirDadoGolpe ? nuevoNivel : personaje.dadosGolpeRestantes,
    competenciasSalvacion,
    competenciasArmas,
    competenciasArmasGrupos,
    competenciasArmasLista,
    competenciasArmaduras,
    competenciasArmadurasGrupos,
    competenciasArmadurasLista,
    esLanzador,
    clasesLanzadoras,
    espaciosConjuroMaximos,
    puntosConjuroMaximos,
    nivelConjuroMaximo,
    espaciosPactoMaximos,
    nivelEspacioPacto
  };

  // 6. Sincronizar rasgos automáticos de clase y subclase
  let rasgosFinales = personaje.rasgos;
  if (opciones.sincronizarRasgos) {
    rasgosFinales = sincronizarRasgosAutomaticos(personajeIntermedio);
  }

  // Fusión persistente de competencias otorgadas por subclases (ej. Colegio del Valor: armas marciales, armaduras medias, escudos)
  let armasTextoPersistente = competenciasArmas;
  let armadurasTextoPersistente = competenciasArmaduras;
  const compSubclase = obtenerCompetenciasExtraRasgos({ ...personajeIntermedio, rasgos: rasgosFinales });

  if (compSubclase.armasGrupos.includes("marciales")) {
    if (!armasTextoPersistente || armasTextoPersistente === "Ninguna") {
      armasTextoPersistente = "Armas Marciales";
    } else if (!armasTextoPersistente.toLowerCase().includes("marcial")) {
      armasTextoPersistente = `${armasTextoPersistente}, Armas Marciales`;
    }
  }

  const armadurasExtras: string[] = [];
  if (compSubclase.armadurasGrupos.includes("medias") && !armadurasTextoPersistente?.toLowerCase().includes("media")) {
    armadurasExtras.push("Armaduras Medias");
  }
  if (compSubclase.armadurasGrupos.includes("escudos") && !armadurasTextoPersistente?.toLowerCase().includes("escudo")) {
    armadurasExtras.push("Escudos");
  }
  if (armadurasExtras.length > 0) {
    if (!armadurasTextoPersistente || armadurasTextoPersistente === "Ninguna") {
      armadurasTextoPersistente = armadurasExtras.join(", ");
    } else {
      armadurasTextoPersistente = `${armadurasTextoPersistente}, ${armadurasExtras.join(", ")}`;
    }
  }

  const gruposArmadurasPersistentes = Array.from(
    new Set([...(competenciasArmadurasGrupos || []), ...compSubclase.armadurasGrupos])
  );
  const gruposArmasPersistentes = Array.from(
    new Set([...(competenciasArmasGrupos || []), ...compSubclase.armasGrupos])
  );

  const personajeConRasgos: PersonajeJugador = {
    ...personajeIntermedio,
    competenciasArmas: armasTextoPersistente,
    competenciasArmaduras: armadurasTextoPersistente,
    competenciasArmadurasGrupos: gruposArmadurasPersistentes,
    competenciasArmasGrupos: gruposArmasPersistentes,
    rasgos: rasgosFinales
  };

  const tieneAprendiz = tieneMedioBonoHabilidades(personajeConRasgos);
  const gradosActualizados = aplicarAprendizDeMuchoAGradosHabilidades(
    personaje.gradosHabilidades,
    tieneAprendiz
  );

  const personajeFinal: PersonajeJugador = {
    ...personajeConRasgos,
    gradosHabilidades: gradosActualizados
  };

  // 7. Sincronizar conjuros de subclase
  if (opciones.sincronizarConjurosSubclase) {
    const syncMagia = sincronizarConjurosSubclaseHelper(personajeFinal);
    return {
      ...syncMagia,
      rasgos: rasgosFinales,
      gradosHabilidades: gradosActualizados
    };
  }

  return personajeFinal;
}
