import type { PersonajeJugador, ClasePersonaje, ClaseLanzadora } from "@/tipos";
import {
  obtenerRangoExperienciaPorNivel,
  obtenerNivelPorExperiencia,
  resolverGruposYSustitutosCompetencias
} from "@/constantes";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import {
  detectarTipoLanzador,
  calcularTodosRecursosMagicos,
  obtenerConjurosSubclasePersonaje
} from "@/servicios/calculadorMagia";
import { construirBuildClase } from "@/servicios/gestorClases";
import { coincideHechizoId } from "@/almacen/slices/slicePersonajes";

/**
 * Servicio puro de dominio para el cálculo, sincronización y mutación inmutable
 * de clases, multiclase, nivel global, experiencia y magia.
 */

export function generarNombreClaseResumen(clases: ClasePersonaje[]): string {
  if (clases.length === 0) return "Guerrero";
  if (clases.length === 1) return clases[0].nombre;
  return clases.map((c) => `${c.nombre} ${c.nivel}`).join(" / ");
}

export function generarSubclaseResumen(clases: ClasePersonaje[]): string {
  return clases.map((c) => c.subclase).filter(Boolean).join(" / ");
}

export function sincronizarMagiaMulticlase(
  clases: ClasePersonaje[],
  overrideEspacios?: Record<string, number> | null,
  overridePuntos?: number | null,
  prepPrevios: string[] = [],
  conocPrevios: string[] = [],
  trucosPrevios: string[] = [],
  siemprePrepPrevios: string[] = []
): Partial<PersonajeJugador> {
  const clasesLanzadoras = clases
    .map((c) => {
      const info = detectarTipoLanzador(c.nombre, c.subclase);
      if (!info) return null;
      return {
        clase: c.nombre || "Lanzador",
        nivel: c.nivel,
        tipoLanzador: info.tipo,
        habilidadConjuro: info.habilidad,
        modeloConjuros: info.modelo
      };
    })
    .filter(Boolean) as ClaseLanzadora[];

  const resSubclase = obtenerConjurosSubclasePersonaje(clases);
  const siemprePrep = Array.from(new Set(resSubclase.conjuros || []));
  const viejosSiemprePrep = siemprePrepPrevios || [];

  const eliminadosSubclase = viejosSiemprePrep.filter(
    (viejo) => !siemprePrep.some((nuevo) => coincideHechizoId(viejo, nuevo))
  );

  const prepFinales = prepPrevios.filter(
    (p) => !eliminadosSubclase.some((elim) => coincideHechizoId(p, elim))
  );
  siemprePrep.forEach((nuevo) => {
    if (!prepFinales.some((p) => coincideHechizoId(p, nuevo))) {
      prepFinales.push(nuevo);
    }
  });

  const conocFinales = conocPrevios.filter(
    (c) => !eliminadosSubclase.some((elim) => coincideHechizoId(c, elim))
  );
  siemprePrep.forEach((nuevo) => {
    if (!conocFinales.some((c) => coincideHechizoId(c, nuevo))) {
      conocFinales.push(nuevo);
    }
  });

  const trucosFinales = [...trucosPrevios];
  (resSubclase.trucos || []).forEach((t) => {
    if (!trucosFinales.some((tr) => coincideHechizoId(tr, t))) {
      trucosFinales.push(t);
    }
  });

  if (clasesLanzadoras.length > 0) {
    const recursos = calcularTodosRecursosMagicos(clasesLanzadoras, overrideEspacios, overridePuntos);
    return {
      esLanzador: true,
      clasesLanzadoras,
      espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
      puntosConjuroMaximos: recursos.puntosConjuroMaximos,
      nivelConjuroMaximo: recursos.nivelConjuroMaximo,
      espaciosPactoMaximos: recursos.espaciosPactoMaximos,
      nivelEspacioPacto: recursos.nivelEspacioPacto,
      conjurosSiemprePreparadosIds: siemprePrep,
      conjurosPreparadosIds: prepFinales,
      conjurosConocidosIds: conocFinales,
      trucosConocidosIds: trucosFinales
    };
  }

  return {
    esLanzador: false,
    clasesLanzadoras: [],
    espaciosConjuroMaximos: {},
    puntosConjuroMaximos: 0,
    nivelConjuroMaximo: 0,
    espaciosPactoMaximos: 0,
    nivelEspacioPacto: 0,
    conjurosSiemprePreparadosIds: siemprePrep,
    conjurosPreparadosIds: prepFinales,
    conjurosConocidosIds: conocFinales,
    trucosConocidosIds: trucosFinales
  };
}

export function aplicarCambioClaseNombre(
  prev: PersonajeJugador,
  index: number,
  nuevoNombre: string
): PersonajeJugador {
  const clases = [...(prev.clases || [])];
  if (!clases[index]) return prev;
  clases[index] = { ...clases[index], nombre: nuevoNombre, subclase: "" };

  let buildExtras: Partial<PersonajeJugador> = {};
  if (index === 0) {
    const build = construirBuildClase(nuevoNombre, clases[index].nivel || 1);
    if (build) {
      const salvacionesActualizadas = {
        ...prev.competenciasSalvacion,
        fuerza: build.salvacionesCompetentes.includes("fuerza"),
        destreza: build.salvacionesCompetentes.includes("destreza"),
        constitucion: build.salvacionesCompetentes.includes("constitucion"),
        inteligencia: build.salvacionesCompetentes.includes("inteligencia"),
        sabiduria: build.salvacionesCompetentes.includes("sabiduria"),
        carisma: build.salvacionesCompetentes.includes("carisma")
      };
      const resComp = resolverGruposYSustitutosCompetencias(
        build.competenciasArmas,
        build.competenciasArmaduras
      );
      buildExtras = {
        tipoDadoGolpe: build.dadoGolpe,
        competenciasSalvacion: salvacionesActualizadas,
        competenciasArmas: resComp.competenciasArmas,
        competenciasArmasGrupos: resComp.competenciasArmasGrupos,
        competenciasArmasLista: resComp.competenciasArmasLista,
        competenciasArmaduras: resComp.competenciasArmaduras,
        competenciasArmadurasGrupos: resComp.competenciasArmadurasGrupos,
        competenciasArmadurasLista: resComp.competenciasArmadurasLista
      };
    }
  }

  const sincMagia = sincronizarMagiaMulticlase(
    clases,
    prev.overrideEspaciosConjuro,
    prev.overridePuntosConjuro,
    prev.conjurosPreparadosIds,
    prev.conjurosConocidosIds,
    prev.trucosConocidosIds,
    prev.conjurosSiemprePreparadosIds
  );

  const intermedio: PersonajeJugador = {
    ...prev,
    clases,
    clase: generarNombreClaseResumen(clases),
    subclase: generarSubclaseResumen(clases),
    ...buildExtras,
    ...sincMagia
  };

  return {
    ...intermedio,
    rasgos: sincronizarRasgosAutomaticos(intermedio)
  };
}

export function aplicarCambioClaseSubclase(
  prev: PersonajeJugador,
  index: number,
  nuevaSubclase: string
): PersonajeJugador {
  const clases = [...(prev.clases || [])];
  if (!clases[index]) return prev;
  clases[index] = { ...clases[index], subclase: nuevaSubclase };

  const sincMagia = sincronizarMagiaMulticlase(
    clases,
    prev.overrideEspaciosConjuro,
    prev.overridePuntosConjuro,
    prev.conjurosPreparadosIds,
    prev.conjurosConocidosIds,
    prev.trucosConocidosIds,
    prev.conjurosSiemprePreparadosIds
  );

  const intermedio: PersonajeJugador = {
    ...prev,
    clases,
    subclase: generarSubclaseResumen(clases),
    ...sincMagia
  };

  return {
    ...intermedio,
    rasgos: sincronizarRasgosAutomaticos(intermedio)
  };
}

export function aplicarCambioClaseNivel(
  prev: PersonajeJugador,
  index: number,
  nuevoNivelStr: string
): PersonajeJugador {
  const clases = [...(prev.clases || [])];
  if (!clases[index]) return prev;

  const sumaOtros = clases.reduce((acc, c, i) => (i === index ? acc : acc + (c.nivel || 1)), 0);
  const maxNivelParaEstaClase = Math.max(1, 20 - sumaOtros);
  const nivParsed = parseInt(nuevoNivelStr, 10);
  const nivSeguro = isNaN(nivParsed) ? 1 : Math.max(1, Math.min(maxNivelParaEstaClase, nivParsed));

  clases[index] = { ...clases[index], nivel: nivSeguro };

  const nivelTotal = Math.min(20, Math.max(1, sumaOtros + nivSeguro));
  const rangoXP = obtenerRangoExperienciaPorNivel(nivelTotal);
  let experienciaAjustada = prev.experiencia;

  if (experienciaAjustada < rangoXP.min || experienciaAjustada > rangoXP.max) {
    experienciaAjustada = rangoXP.min;
  }

  const sincMagia = sincronizarMagiaMulticlase(
    clases,
    prev.overrideEspaciosConjuro,
    prev.overridePuntosConjuro,
    prev.conjurosPreparadosIds,
    prev.conjurosConocidosIds,
    prev.trucosConocidosIds,
    prev.conjurosSiemprePreparadosIds
  );

  const intermedio: PersonajeJugador = {
    ...prev,
    clases,
    nivel: nivelTotal,
    experiencia: experienciaAjustada,
    clase: generarNombreClaseResumen(clases),
    dadosGolpeTotal: nivelTotal,
    dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nivelTotal),
    ...sincMagia
  };

  return {
    ...intermedio,
    rasgos: sincronizarRasgosAutomaticos(intermedio)
  };
}

export function aplicarAgregarClase(prev: PersonajeJugador): PersonajeJugador {
  const clases = [...(prev.clases || [])];
  const nivelTotalActual = clases.reduce((acc, c) => acc + (c.nivel || 1), 0);
  if (nivelTotalActual >= 20) return prev;

  const nuevaClase: ClasePersonaje = {
    nombre: "Guerrero",
    subclase: "",
    nivel: 1
  };
  const nuevasClases = [...clases, nuevaClase];
  const nuevoNivelTotal = Math.min(20, nivelTotalActual + 1);
  const rangoXP = obtenerRangoExperienciaPorNivel(nuevoNivelTotal);
  let experienciaAjustada = prev.experiencia;
  if (experienciaAjustada < rangoXP.min || experienciaAjustada > rangoXP.max) {
    experienciaAjustada = rangoXP.min;
  }

  const sincMagia = sincronizarMagiaMulticlase(
    nuevasClases,
    prev.overrideEspaciosConjuro,
    prev.overridePuntosConjuro,
    prev.conjurosPreparadosIds,
    prev.conjurosConocidosIds,
    prev.trucosConocidosIds,
    prev.conjurosSiemprePreparadosIds
  );

  const intermedio: PersonajeJugador = {
    ...prev,
    clases: nuevasClases,
    nivel: nuevoNivelTotal,
    experiencia: experienciaAjustada,
    clase: generarNombreClaseResumen(nuevasClases),
    subclase: generarSubclaseResumen(nuevasClases),
    dadosGolpeTotal: nuevoNivelTotal,
    dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nuevoNivelTotal),
    ...sincMagia
  };

  return {
    ...intermedio,
    rasgos: sincronizarRasgosAutomaticos(intermedio)
  };
}

export function aplicarEliminarClase(prev: PersonajeJugador, index: number): PersonajeJugador {
  const clases = [...(prev.clases || [])];
  if (clases.length <= 1) return prev;
  const nuevasClases = clases.filter((_, i) => i !== index);
  const nuevoNivelTotal = Math.max(1, nuevasClases.reduce((acc, c) => acc + (c.nivel || 1), 0));
  const rangoXP = obtenerRangoExperienciaPorNivel(nuevoNivelTotal);
  let experienciaAjustada = prev.experiencia;
  if (experienciaAjustada < rangoXP.min || experienciaAjustada > rangoXP.max) {
    experienciaAjustada = rangoXP.min;
  }

  const sincMagia = sincronizarMagiaMulticlase(
    nuevasClases,
    prev.overrideEspaciosConjuro,
    prev.overridePuntosConjuro,
    prev.conjurosPreparadosIds,
    prev.conjurosConocidosIds,
    prev.trucosConocidosIds,
    prev.conjurosSiemprePreparadosIds
  );

  const intermedio: PersonajeJugador = {
    ...prev,
    clases: nuevasClases,
    nivel: nuevoNivelTotal,
    experiencia: experienciaAjustada,
    clase: generarNombreClaseResumen(nuevasClases),
    subclase: generarSubclaseResumen(nuevasClases),
    dadosGolpeTotal: nuevoNivelTotal,
    dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nuevoNivelTotal),
    ...sincMagia
  };

  return {
    ...intermedio,
    rasgos: sincronizarRasgosAutomaticos(intermedio)
  };
}

export function aplicarCambioNivelTotal(
  prev: PersonajeJugador,
  nuevoNivelStr: string
): PersonajeJugador {
  const niv = Math.max(1, Math.min(20, parseInt(nuevoNivelStr, 10) || 1));
  const rangoXP = obtenerRangoExperienciaPorNivel(niv);

  const clases = [...(prev.clases || [])];
  let nuevasClases: ClasePersonaje[] = [];

  if (clases.length <= 1) {
    nuevasClases = [{ ...(clases[0] || { nombre: "Guerrero", subclase: "" }), nivel: niv }];
  } else {
    const sumaOtros = clases.slice(1).reduce((acc, c) => acc + (c.nivel || 1), 0);
    if (niv > sumaOtros) {
      nuevasClases = [{ ...clases[0], nivel: niv - sumaOtros }, ...clases.slice(1)];
    } else {
      nuevasClases = [{ ...clases[0], nivel: 1 }];
      let restante = niv - 1;
      for (let i = 1; i < clases.length; i++) {
        if (restante <= 0) break;
        const asignado = Math.min(clases[i].nivel, restante);
        nuevasClases.push({ ...clases[i], nivel: Math.max(1, asignado) });
        restante -= asignado;
      }
    }
  }

  let experienciaAjustada = prev.experiencia;
  if (experienciaAjustada < rangoXP.min || experienciaAjustada > rangoXP.max) {
    experienciaAjustada = rangoXP.min;
  }

  const sincMagia = sincronizarMagiaMulticlase(
    nuevasClases,
    prev.overrideEspaciosConjuro,
    prev.overridePuntosConjuro,
    prev.conjurosPreparadosIds,
    prev.conjurosConocidosIds,
    prev.trucosConocidosIds,
    prev.conjurosSiemprePreparadosIds
  );

  const intermedio: PersonajeJugador = {
    ...prev,
    nivel: niv,
    clases: nuevasClases,
    clase: generarNombreClaseResumen(nuevasClases),
    experiencia: experienciaAjustada,
    dadosGolpeTotal: niv,
    dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, niv),
    ...sincMagia
  };

  return {
    ...intermedio,
    rasgos: sincronizarRasgosAutomaticos(intermedio)
  };
}

export function aplicarCambioExperiencia(
  prev: PersonajeJugador,
  nuevaXpStr: string
): PersonajeJugador {
  const xpVal = Math.max(0, parseInt(nuevaXpStr, 10) || 0);
  const nivelSugerido = obtenerNivelPorExperiencia(xpVal);

  let nuevasClases = [...(prev.clases || [])];

  if (nivelSugerido !== prev.nivel) {
    if (nuevasClases.length <= 1) {
      nuevasClases = [{ ...(nuevasClases[0] || { nombre: "Guerrero", subclase: "" }), nivel: nivelSugerido }];
    } else {
      const sumaOtros = nuevasClases.slice(1).reduce((acc, c) => acc + (c.nivel || 1), 0);
      if (nivelSugerido > sumaOtros) {
        nuevasClases = [{ ...nuevasClases[0], nivel: nivelSugerido - sumaOtros }, ...nuevasClases.slice(1)];
      } else {
        nuevasClases = [{ ...nuevasClases[0], nivel: 1 }, ...nuevasClases.slice(1).map((c) => ({ ...c, nivel: 1 }))];
      }
    }
  }

  const sincMagia = sincronizarMagiaMulticlase(
    nuevasClases,
    prev.overrideEspaciosConjuro,
    prev.overridePuntosConjuro,
    prev.conjurosPreparadosIds,
    prev.conjurosConocidosIds,
    prev.trucosConocidosIds,
    prev.conjurosSiemprePreparadosIds
  );

  const intermedio: PersonajeJugador = {
    ...prev,
    experiencia: xpVal,
    nivel: nivelSugerido,
    clases: nuevasClases,
    clase: generarNombreClaseResumen(nuevasClases),
    dadosGolpeTotal: nivelSugerido,
    dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nivelSugerido),
    ...sincMagia
  };

  return {
    ...intermedio,
    rasgos: sincronizarRasgosAutomaticos(intermedio)
  };
}
