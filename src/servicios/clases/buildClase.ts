import type { BuildClaseCalculada, OpcionesAplicarBuild, PersonajeJugador, ClasePersonaje, ClaseLanzadora, CompetenciasSalvacion } from "@/tipos";
import { calcularTodosRecursosMagicos } from "@/servicios/calculadorMagia";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { sincronizarConjurosSubclaseHelper } from "@/servicios/sincronizadorConjurosSubclase";
import { resolverGruposYSustitutosCompetencias } from "@/constantes/competenciasConstantes";
import { tieneMedioBonoHabilidades, aplicarAprendizDeMuchoAGradosHabilidades, obtenerCompetenciasExtraRasgos, sonHerramientasEquivalentes } from "@/servicios/evaluadorEfectosRasgos";
import { normalizarTextoClase, obtenerClasePorNombre, obtenerSubclasePorNombre } from "./catalogoClases";
import { obtenerRasgosClaseYSubclase, obtenerConjurosSubclaseBuild } from "./constructorRasgosClase";

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
          modeloConjuros: build.configuracionMagica.modeloConjuros,
          listaConjuros: build.configuracionMagica.listaConjuros
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

  // Fusión de salvaciones procedentes de rasgos de clase o subclase (ej. Mente escurridiza)
  const salvacionesPersistentes: CompetenciasSalvacion = {
    fuerza: competenciasSalvacion.fuerza || compSubclase.salvaciones.includes("fuerza"),
    destreza: competenciasSalvacion.destreza || compSubclase.salvaciones.includes("destreza"),
    constitucion: competenciasSalvacion.constitucion || compSubclase.salvaciones.includes("constitucion"),
    inteligencia: competenciasSalvacion.inteligencia || compSubclase.salvaciones.includes("inteligencia"),
    sabiduria: competenciasSalvacion.sabiduria || compSubclase.salvaciones.includes("sabiduria"),
    carisma: competenciasSalvacion.carisma || compSubclase.salvaciones.includes("carisma")
  };

  // Fusión de herramientas procedentes de rasgos
  const listaHerramientasActual: string[] = [
    ...(personaje.herramientasLista || []),
    ...(personaje.herramientas && personaje.herramientas !== "Ninguna"
      ? personaje.herramientas.split(",").map((h) => h.trim()).filter(Boolean)
      : [])
  ];
  for (const h of compSubclase.herramientas) {
    if (!listaHerramientasActual.some((existente) => sonHerramientasEquivalentes(existente, h))) {
      listaHerramientasActual.push(h);
    }
  }

  // Fusión de idiomas procedentes de rasgos (ej. Jerga de ladrones)
  const listaIdiomasActual: string[] = [
    ...(personaje.idiomasLista || []),
    ...(Array.isArray(personaje.idiomas)
      ? personaje.idiomas
      : typeof personaje.idiomas === "string" && personaje.idiomas !== "Ninguno" && personaje.idiomas !== "Ninguna"
      ? personaje.idiomas.split(",").map((i) => i.trim()).filter(Boolean)
      : [])
  ];
  for (const idm of compSubclase.idiomas) {
    if (!listaIdiomasActual.some((existente) => normalizarTextoClase(existente) === normalizarTextoClase(idm))) {
      listaIdiomasActual.push(idm);
    }
  }

  const personajeConRasgos: PersonajeJugador = {
    ...personajeIntermedio,
    competenciasSalvacion: salvacionesPersistentes,
    competenciasArmas: armasTextoPersistente,
    competenciasArmaduras: armadurasTextoPersistente,
    competenciasArmadurasGrupos: gruposArmadurasPersistentes,
    competenciasArmasGrupos: gruposArmasPersistentes,
    herramientas: listaHerramientasActual.length > 0 ? listaHerramientasActual.join(", ") : (personaje.herramientas || "Ninguna"),
    herramientasLista: listaHerramientasActual,
    idiomas: listaIdiomasActual.length > 0 ? listaIdiomasActual.join(", ") : (personaje.idiomas || "Común"),
    idiomasLista: listaIdiomasActual.length > 0 ? listaIdiomasActual : (personaje.idiomasLista || ["Común"]),
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
