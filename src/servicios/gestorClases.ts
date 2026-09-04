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
import {
  obtenerDadoInspiracionBardica,
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
    console.warn(`[gestorClases] Error al evaluar formulaUsos: "${formula}"`, error);
  }

  return undefined;
}

/**
 * Obtiene los rasgos de clase y subclase correspondientes a un nivel específico.
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

  // 1. Rasgos de Clase Base
  for (const r of clase.rasgos) {
    if (r.nivel <= nivelSeguro) {
      // Consolidación orgánica de "Mejora de característica"
      if (r.nombre === "Mejora de característica") {
        const existenteMejora = rasgosResultado.find((x) => x.nombre === "Mejora de característica");
        if (existenteMejora) {
          const nivelesPrevios = existenteMejora.notas ? existenteMejora.notas.split(",") : [String(existenteMejora.nivelRequerido)];
          if (!nivelesPrevios.includes(String(r.nivel))) {
            nivelesPrevios.push(String(r.nivel));
          }
          existenteMejora.notas = nivelesPrevios.join(",");
          existenteMejora.fuente = `${clase.nombre} (Niveles ${nivelesPrevios.join(", ")})`;
          existenteMejora.descripcion = `Obtienes la dote Mejora de característica u otra dote de tu elección para la que cumplas las condiciones.\n\n***Niveles alcanzados:*** ${nivelesPrevios.join(", ")}.`;
          continue;
        }
      }

      // Si es una extensión de otro rasgo ya incorporada orgánicamente (ej. Golpe brutal mejorado I y II)
      if (r.categoriaMecanica === "extension" && r.ligadoA) {
        continue;
      }

      // Ignorar marcadores de posición de tabla de progresión ("Rasgo de subclase")
      const nombreNorm = r.nombre.toLowerCase().trim();
      if (nombreNorm === "rasgo de subclase" || nombreNorm.includes("rasgo de subclase")) {
        continue;
      }

      const id = `rasgo_cls_${normalizarTextoClase(clase.id)}_${normalizarTextoClase(r.nombre).replace(/\s+/g, "_")}`;
      let usos: number | undefined = undefined;
      if (r.tieneUsosLimitados) {
        if (typeof r.obtenerUsosMaximos === "function") {
          usos = r.obtenerUsosMaximos(nivelSeguro);
        } else if (r.formulaUsos) {
          usos = evaluarFormulaUsos(r.formulaUsos, nivelSeguro);
        }
      }

      // Ajustar selectores con escalado dinámico por nivel
      const selectoresClonados = r.selectores ? JSON.parse(JSON.stringify(r.selectores)) : [];
      if (r.nombre === "Maestría con armas" && selectoresClonados.length > 0) {
        const esGuerrero = clase.nombre.toLowerCase().includes("guerrero");
        const maxArmas = esGuerrero
          ? (nivelSeguro >= 16 ? 6 : nivelSeguro >= 10 ? 5 : nivelSeguro >= 4 ? 4 : 3)
          : (nivelSeguro >= 10 ? 4 : nivelSeguro >= 4 ? 3 : 2);
        selectoresClonados[0].maxSelecciones = maxArmas;
      }

      // Ajustar Golpe Brutal si nivel >= 13 o >= 17
      let formulaDadosRasgo = r.formulaDados;
      let descripcionRasgo = r.descripcion;
      let fuenteRasgo = `${clase.nombre} (Nivel ${r.nivel})`;
      if (r.nombre === "Golpe brutal" && selectoresClonados.length > 0) {
        const selectorGb = selectoresClonados[0];
        if (nivelSeguro >= 13) {
          if (!selectorGb.opciones.some((op: { id: string }) => op.id === "golpe_desestabilizador")) {
            selectorGb.opciones.push({
              id: "golpe_desestabilizador",
              nombre: "Golpe desestabilizador (Nv. 13)",
              descripcion: "El objetivo tiene desventaja en la siguiente tirada de salvación y no puede hacer ataques de oportunidad hasta tu siguiente turno."
            });
          }
          if (!selectorGb.opciones.some((op: { id: string }) => op.id === "golpe_desgarrador")) {
            selectorGb.opciones.push({
              id: "golpe_desgarrador",
              nombre: "Golpe desgarrador (Nv. 13)",
              descripcion: "La siguiente tirada de ataque realizada por otra criatura contra el objetivo obtiene un bonificador de +5."
            });
          }
          descripcionRasgo += "\n\n***Golpe desestabilizador (Nv. 13).*** El objetivo tiene desventaja en la siguiente tirada de salvación que haga, y no puede hacer ataques de oportunidad hasta el principio de tu siguiente turno.\n\n***Golpe desgarrador (Nv. 13).*** Antes del principio de tu siguiente turno, la siguiente tirada de ataque realizada por otra criatura contra el objetivo obtiene un bonificador de +5 a la tirada. Una tirada de ataque solo puede obtener un bonificador de Golpe desgarrador.";
          fuenteRasgo = `${clase.nombre} (Niveles 9, 13)`;
        }
        if (nivelSeguro >= 17) {
          selectorGb.maxSelecciones = 2;
          selectorGb.tipo = "multiple";
          formulaDadosRasgo = "2d10";
          descripcionRasgo += "\n\n***Golpe brutal mejorado (II) (Nv. 17).*** El daño adicional que infliges con él aumenta a 2d10. Además, puedes aplicar hasta dos efectos diferentes de Golpe brutal a la vez en lugar de uno.";
          fuenteRasgo = `${clase.nombre} (Niveles 9, 13, 17)`;
        }
      }

      // Inspiración bárdica: dado escalado dinámicamente y recarga en descanso corto a nivel >= 5
      let recuperacionRasgo = r.recuperacion || "ninguno";
      if (normalizarTextoClase(r.nombre).includes("inspiracion bardica")) {
        formulaDadosRasgo = obtenerDadoInspiracionBardica(nivelSeguro);
        if (nivelSeguro >= 5) {
          recuperacionRasgo = "descanso_corto";
        }
      }

      rasgosResultado.push({
        id,
        nombre: r.nombre,
        descripcion: descripcionRasgo,
        origen: "clase",
        fuente: fuenteRasgo,
        tipoAccion: r.tipoAccion,
        nivelRequerido: r.nivel,
        tieneUsosLimitados: !!r.tieneUsosLimitados,
        usosMaximos: usos,
        usosRestantes: usos,
        recuperacion: recuperacionRasgo,
        formulaDados: formulaDadosRasgo,
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
        efectos: r.efectos ? JSON.parse(JSON.stringify(r.efectos)) : [],
        selectores: selectoresClonados,
        tablaProgresion: r.tablaProgresion ? JSON.parse(JSON.stringify(r.tablaProgresion)) : undefined,
        notas: ""
      });
    }
  }

  // 2. Rasgos de Subclase
  if (subclaseNombre) {
    const subclase = obtenerSubclasePorNombre(clase.nombre, subclaseNombre);
    if (subclase) {
      for (const r of subclase.rasgos) {
        if (r.nivel <= nivelSeguro) {
          const id = `rasgo_sub_${normalizarTextoClase(subclase.id)}_${normalizarTextoClase(r.nombre).replace(/\s+/g, "_")}`;
          let usos: number | undefined = undefined;
          if (r.tieneUsosLimitados) {
            if (typeof r.obtenerUsosMaximos === "function") {
              usos = r.obtenerUsosMaximos(nivelSeguro);
            } else if (r.formulaUsos) {
              usos = evaluarFormulaUsos(r.formulaUsos, nivelSeguro);
            }
          }

          let formulaDadosRasgo = r.formulaDados;
          let categoriaMecanica = r.categoriaMecanica;

          // Frenesí: reaccionar al nivel con dados d6 iguales al daño de Furia (+2d6, +3d6, +4d6)
          if (r.nombre === "Frenesí") {
            const bonoDanoFuria = nivelSeguro >= 16 ? 4 : nivelSeguro >= 9 ? 3 : 2;
            formulaDadosRasgo = `${bonoDanoFuria}d6`;
          }

          // Guerrero de los dioses: reserva curativa de d12
          if (r.nombre === "Guerrero de los dioses") {
            const dadosReserva = nivelSeguro >= 17 ? 7 : nivelSeguro >= 12 ? 6 : nivelSeguro >= 6 ? 5 : 4;
            usos = dadosReserva;
            categoriaMecanica = "curacion";
            formulaDadosRasgo = "1d12";
          }

          // Furia divina: 1d6 + la mitad del nivel de bárbaro (redondeando hacia abajo)
          if (r.nombre.toLowerCase().includes("furia divina")) {
            const mitadNivel = Math.floor(nivelSeguro / 2);
            formulaDadosRasgo = mitadNivel > 0 ? `1d6+${mitadNivel}` : "1d6";
          }

          // Rasgos de bardo que usan o heredan el dado de Inspiración bárdica
          const esRasgoDadoBardo = r.heredarDadosPadre || [
            "palabras cortantes",
            "manto de inspiracion",
            "habilidad inigualable",
            "juego de pies en tandem"
          ].some((nom) => r.nombre.toLowerCase().includes(nom));

          if (esRasgoDadoBardo) {
            formulaDadosRasgo = obtenerDadoInspiracionBardica(nivelSeguro);
          }

          const selectoresClonados = r.selectores ? JSON.parse(JSON.stringify(r.selectores)) : [];

          rasgosResultado.push({
            id,
            nombre: r.nombre,
            descripcion: r.descripcion,
            origen: "subclase",
            fuente: `${clase.nombre} (${subclase.nombre} - Nivel ${r.nivel})`,
            tipoAccion: r.tipoAccion,
            nivelRequerido: r.nivel,
            tieneUsosLimitados: !!r.tieneUsosLimitados,
            usosMaximos: usos,
            usosRestantes: usos,
            recuperacion: r.recuperacion || "ninguno",
            formulaDados: formulaDadosRasgo,
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
            categoriaMecanica,
            formulaEscalado: r.formulaEscalado,
            efectos: r.efectos ? JSON.parse(JSON.stringify(r.efectos)) : [],
            selectores: selectoresClonados,
            tablaProgresion: r.tablaProgresion ? JSON.parse(JSON.stringify(r.tablaProgresion)) : undefined,
            notas: ""
          });
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
