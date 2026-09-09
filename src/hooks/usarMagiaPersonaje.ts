import { useMemo, useCallback } from "react";
import type { PersonajeJugador, HechizoBase, Caracteristica, ModeloConjuros } from "@/tipos";
import {
  calcularCDConjuros,
  calcularBonoAtaqueConjuro,
  calcularMaximosConjurosYTrucos,
  obtenerConjurosSubclasePersonaje,
  obtenerNivelesArcanoMisticoDisponibles
} from "@/servicios/calculadorMagia";
import { MAPA_ALIAS_HECHIZOS } from "@/constantes/subclasesConjurosConstantes";
import { generarIdSlug } from "@/utiles/generarId";
import { resolverOrigenConjuro, OrigenConjuroBadge } from "@/servicios/resolutorOrigenConjuros";

export interface EstadoMagiaPersonaje {
  habilidadMagica: Caracteristica;
  etiquetaHabilidad: string;
  modHabilidad: number;
  cdConjuros: number;
  bonoAtaqueMagico: number;
  requierePreparacion: boolean;
  esLanzadorPacto: boolean;
  nivelEspacioPacto: number;
  nivelBrujo: number;
  nivelesArcanoDisponibles: number[];
  mapaHechizos: Map<string, HechizoBase>;
  setSiemprePreparados: Set<string>;
  esHechizoDeSubclase: (hechizo: HechizoBase) => boolean;
  obtenerOrigenConjuro: (hechizo: HechizoBase) => OrigenConjuroBadge | null;
  esHechizoOtorgado: (hechizo: HechizoBase) => boolean;
  estaPreparado: (hechizo: HechizoBase) => boolean;
  estaEnLista: (hechizo: HechizoBase) => boolean;
  maximos: {
    maxTrucos: number;
    maxConjuros: number;
    modelo: ModeloConjuros;
  };
  conteoEfectivo: {
    libres: number;
    subclase: number;
    total: number;
    trucosLibres: number;
    trucosSubclase: number;
  };
  conjurosPorNivel: Record<number, HechizoBase[]>;
  trucosConocidos: HechizoBase[];
}

/**
 * Hook universal y reutilizable (DRY) que unifica el cálculo de recursos mágicos,
 * indexación de catálogo, detección de subclase y métricas tanto para la Hoja de Personaje
 * como para el Compendio de Conjuros.
 */
export function usarMagiaPersonaje(
  personaje: PersonajeJugador | null | undefined,
  baseDatosHechizos: HechizoBase[],
  modificadores?: Record<Caracteristica, number>,
  bonoCompetencia: number = 2
): EstadoMagiaPersonaje {
  // 1. Habilidad mágica principal
  const habilidadMagica: Caracteristica = useMemo(() => {
    if (personaje?.clasesLanzadoras && personaje.clasesLanzadoras.length > 0) {
      return personaje.clasesLanzadoras[0].habilidadConjuro as Caracteristica;
    }
    return "inteligencia";
  }, [personaje?.clasesLanzadoras]);

  const modHabilidad = modificadores ? (modificadores[habilidadMagica] ?? 0) : 0;
  const cdConjuros = calcularCDConjuros(bonoCompetencia, modHabilidad);
  const bonoAtaqueMagico = calcularBonoAtaqueConjuro(bonoCompetencia, modHabilidad);

  const etiquetaHabilidad = useMemo(() => {
    switch (habilidadMagica) {
      case "inteligencia": return "INT";
      case "sabiduria": return "SAB";
      case "carisma": return "CAR";
      default: return "INT";
    }
  }, [habilidadMagica]);

  // 2. Modelo de lanzamiento
  const requierePreparacion = useMemo(() => {
    if (!personaje?.clasesLanzadoras || personaje.clasesLanzadoras.length === 0) return true;
    return personaje.clasesLanzadoras.some((c) => c.modeloConjuros === "preparados");
  }, [personaje?.clasesLanzadoras]);

  const esLanzadorPacto = useMemo(() => {
    if ((personaje?.espaciosPactoMaximos || 0) > 0) return true;
    return (personaje?.clasesLanzadoras || []).some(
      (c) => c.tipoLanzador === "pacto" || c.clase.toLowerCase().includes("brujo") || c.clase.toLowerCase().includes("warlock")
    );
  }, [personaje?.espaciosPactoMaximos, personaje?.clasesLanzadoras]);

  const nivelEspacioPacto = personaje?.nivelEspacioPacto || 1;

  // 3. Nivel de Brujo y Arcanos Místicos
  const nivelBrujo = useMemo(() => {
    if (!personaje) return 0;
    const claseBrujo = (personaje.clases || []).find(
      (c) => c.nombre.toLowerCase().includes("brujo") || c.nombre.toLowerCase().includes("warlock")
    );
    if (claseBrujo) return claseBrujo.nivel;
    if (
      personaje.clase?.toLowerCase().includes("brujo") ||
      personaje.clase?.toLowerCase().includes("warlock")
    ) {
      return personaje.nivel || 1;
    }
    return 0;
  }, [personaje]);

  const nivelesArcanoDisponibles = useMemo(() => {
    const disponibles = obtenerNivelesArcanoMisticoDisponibles(nivelBrujo);
    for (const item of personaje?.arcanoMisticoIds || []) {
      const lvl = Number(item.split(":")[0]);
      if (!isNaN(lvl) && lvl >= 6 && !disponibles.includes(lvl)) {
        disponibles.push(lvl);
      }
    }
    return disponibles.sort((a, b) => a - b);
  }, [nivelBrujo, personaje?.arcanoMisticoIds]);

  // 4. Mapa de hechizos por ID, slug, nombres normalizados y sinónimos de traducción
  const mapaHechizos = useMemo(() => {
    const m = new Map<string, HechizoBase>();
    for (const h of baseDatosHechizos) {
      m.set(h.id, h);
      const slug = generarIdSlug("h", h.nombre);
      m.set(slug, h);
      const nombreNorm = h.nombre.toLowerCase().trim();
      m.set(nombreNorm, h);
      const sinTildes = nombreNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      m.set(sinTildes, h);

      // Registrar alias sinónimos (ej. Susurros disonantes <-> Susurros discordantes)
      const alias = MAPA_ALIAS_HECHIZOS[sinTildes] || [];
      for (const al of alias) {
        m.set(al, h);
        m.set(generarIdSlug("h", al), h);
      }
    }
    return m;
  }, [baseDatosHechizos]);

  // 5. Conjuros y Trucos de Subclase canónicos calculados dinámicamente
  const conjurosSubclaseDinamicos = useMemo(() => {
    if (!personaje) return { conjuros: [], trucos: [] };
    return obtenerConjurosSubclasePersonaje(
      personaje.clases,
      personaje.clase,
      personaje.subclase,
      personaje.nivel
    );
  }, [personaje]);

  // Set exhaustivo de identificadores de subclase
  const setSiemprePreparados = useMemo(() => {
    const s = new Set<string>();

    const registrarEntrada = (texto: string) => {
      const norm = texto.toLowerCase().trim();
      const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      s.add(norm);
      s.add(sinTildes);
      s.add(generarIdSlug("h", texto));
      s.add(texto);

      const alias = MAPA_ALIAS_HECHIZOS[sinTildes] || [];
      for (const al of alias) {
        s.add(al);
        s.add(generarIdSlug("h", al));
      }
    };

    for (const c of personaje?.conjurosSiemprePreparadosIds || []) {
      registrarEntrada(c);
    }
    for (const c of conjurosSubclaseDinamicos.conjuros) {
      registrarEntrada(c);
    }
    for (const t of conjurosSubclaseDinamicos.trucos) {
      registrarEntrada(t);
    }

    return s;
  }, [personaje?.conjurosSiemprePreparadosIds, conjurosSubclaseDinamicos]);

  // Función unificada para determinar si un hechizo es de subclase
  const esHechizoDeSubclase = useCallback((hechizo: HechizoBase): boolean => {
    const nombreNorm = hechizo.nombre.toLowerCase().trim();
    const sinTildes = nombreNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const slug = generarIdSlug("h", hechizo.nombre);

    if (
      setSiemprePreparados.has(hechizo.id) ||
      setSiemprePreparados.has(nombreNorm) ||
      setSiemprePreparados.has(sinTildes) ||
      setSiemprePreparados.has(slug)
    ) {
      return true;
    }

    const alias = MAPA_ALIAS_HECHIZOS[sinTildes] || [];
    return alias.some((al) => setSiemprePreparados.has(al) || setSiemprePreparados.has(generarIdSlug("h", al)));
  }, [setSiemprePreparados]);

  // Función unificada para verificar si un hechizo está en un Set genérico
  const estaEnSet = useCallback((setIds: Set<string>, hechizo: HechizoBase): boolean => {
    if (setIds.has(hechizo.id)) return true;
    const slug = generarIdSlug("h", hechizo.nombre);
    if (setIds.has(slug)) return true;
    const norm = hechizo.nombre.toLowerCase().trim();
    if (setIds.has(norm)) return true;
    const sinTildes = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (setIds.has(sinTildes)) return true;

    const aliasHechizo = MAPA_ALIAS_HECHIZOS[sinTildes] || [];
    for (const al of aliasHechizo) {
      if (setIds.has(al) || setIds.has(generarIdSlug("h", al))) return true;
    }

    for (const elem of setIds) {
      const elemNorm = elem.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (elemNorm === sinTildes || elem === hechizo.id || elem === slug) {
        return true;
      }
      const aliasElem = MAPA_ALIAS_HECHIZOS[elemNorm] || [];
      if (aliasElem.includes(sinTildes) || aliasElem.some((ae) => generarIdSlug("h", ae) === slug)) {
        return true;
      }
    }
    return false;
  }, []);

  const setPreparadosIds = useMemo(() => new Set(personaje?.conjurosPreparadosIds || []), [personaje?.conjurosPreparadosIds]);
  const setConocidosIds = useMemo(() => new Set(personaje?.conjurosConocidosIds || []), [personaje?.conjurosConocidosIds]);
  const setTrucosIds = useMemo(() => new Set(personaje?.trucosConocidosIds || []), [personaje?.trucosConocidosIds]);

  // 5.1. Detección profunda de origen de conjuros otorgados (clase, subclase, especie, legado, rasgos)
  const obtenerOrigenConjuro = useCallback(
    (hechizo: HechizoBase): OrigenConjuroBadge | null => {
      return resolverOrigenConjuro(personaje, hechizo);
    },
    [personaje]
  );

  const esHechizoOtorgado = useCallback(
    (hechizo: HechizoBase): boolean => {
      return obtenerOrigenConjuro(hechizo) !== null || esHechizoDeSubclase(hechizo);
    },
    [obtenerOrigenConjuro, esHechizoDeSubclase]
  );

  const estaPreparado = useCallback(
    (hechizo: HechizoBase): boolean => {
      if (hechizo.nivel === 0) return estaEnSet(setTrucosIds, hechizo) || esHechizoOtorgado(hechizo);
      if (esHechizoOtorgado(hechizo)) return true;
      return estaEnSet(setPreparadosIds, hechizo);
    },
    [estaEnSet, setTrucosIds, esHechizoOtorgado, setPreparadosIds]
  );

  // 6. Límites máximos
  const maximos = useMemo(() => {
    return calcularMaximosConjurosYTrucos(
      personaje?.clasesLanzadoras || [],
      personaje?.nivel || 1,
      modHabilidad
    );
  }, [personaje?.clasesLanzadoras, personaje?.nivel, modHabilidad]);

  const estaEnLista = useCallback(
    (hechizo: HechizoBase): boolean => {
      if (hechizo.nivel === 0) return estaEnSet(setTrucosIds, hechizo) || esHechizoOtorgado(hechizo);
      if (esHechizoOtorgado(hechizo)) return true;
      if (maximos.modelo === "preparados") {
        return estaEnSet(setPreparadosIds, hechizo);
      }
      return estaEnSet(setConocidosIds, hechizo) || estaEnSet(setPreparadosIds, hechizo);
    },
    [estaEnSet, setTrucosIds, esHechizoOtorgado, maximos.modelo, setConocidosIds, setPreparadosIds]
  );

  // 7. Lista agrupada de conjuros por nivel y trucos
  const conjurosPorNivel = useMemo(() => {
    const grupos: Record<number, HechizoBase[]> = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []
    };

    const agregadosPorNivel = new Set<string>();

    for (const h of baseDatosHechizos) {
      if (h.nivel >= 1 && h.nivel <= 9) {
        const enLista = estaEnLista(h);
        if (enLista && !agregadosPorNivel.has(h.id)) {
          agregadosPorNivel.add(h.id);
          grupos[h.nivel].push(h);
        }
      }
    }

    for (let niv = 1; niv <= 9; niv++) {
      grupos[niv].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    return grupos;
  }, [baseDatosHechizos, estaEnLista]);

  const trucosConocidos = useMemo(() => {
    const encontrados: HechizoBase[] = [];
    const idsVistos = new Set<string>();

    for (const h of baseDatosHechizos) {
      if (h.nivel === 0 && estaEnLista(h) && !idsVistos.has(h.id)) {
        idsVistos.add(h.id);
        encontrados.push(h);
      }
    }

    return encontrados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [baseDatosHechizos, estaEnLista]);

  // 8. Conteo efectivo unificado
  const conteoEfectivo = useMemo(() => {
    let cLibres = 0;
    let cSubclase = 0;
    let tLibres = 0;
    let tSubclase = 0;

    for (const h of baseDatosHechizos) {
      const esOtorgado = esHechizoOtorgado(h);

      if (h.nivel === 0) {
        const enLista = estaEnLista(h);
        if (esOtorgado) {
          tSubclase++;
        } else if (enLista) {
          tLibres++;
        }
      } else {
        if (maximos.modelo === "preparados") {
          const preparado = estaPreparado(h);
          if (esOtorgado) {
            cSubclase++;
          } else if (preparado) {
            cLibres++;
          }
        } else {
          // Modelo "conocidos"
          const enLista = estaEnLista(h);
          if (esOtorgado) {
            cSubclase++;
          } else if (enLista) {
            cLibres++;
          }
        }
      }
    }

    return {
      libres: cLibres,
      subclase: cSubclase,
      total: cLibres + cSubclase,
      trucosLibres: tLibres,
      trucosSubclase: tSubclase
    };
  }, [baseDatosHechizos, esHechizoOtorgado, estaEnLista, estaPreparado, maximos.modelo]);

  return {
    habilidadMagica,
    etiquetaHabilidad,
    modHabilidad,
    cdConjuros,
    bonoAtaqueMagico,
    requierePreparacion,
    esLanzadorPacto,
    nivelEspacioPacto,
    nivelBrujo,
    nivelesArcanoDisponibles,
    mapaHechizos,
    setSiemprePreparados,
    esHechizoDeSubclase,
    obtenerOrigenConjuro,
    esHechizoOtorgado,
    estaPreparado,
    estaEnLista,
    maximos,
    conteoEfectivo,
    conjurosPorNivel,
    trucosConocidos
  };
}
