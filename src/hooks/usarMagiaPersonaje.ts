import { useMemo, useCallback } from "react";
import type { PersonajeJugador, HechizoBase, Caracteristica, ModeloConjuros } from "@/tipos";
import {
  calcularCDConjuros,
  calcularBonoAtaqueConjuro,
  calcularMaximosConjurosYTrucos,
  obtenerNivelesArcanoMisticoDisponibles
} from "@/servicios/calculadorMagia";
import { esClasePacto } from "@/constantes";
import { crearResolutorOrigenConjuros, OrigenConjuroBadge } from "@/servicios/resolutorOrigenConjuros";
import { aplicarModificadoresInvocacionesAHechizo } from "@/servicios/evaluadorEfectosRasgos";

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

import {
  crearClavesLookupHechizos,
  crearSetsPertenencia,
  crearPredicadosPertenencia
} from "@/servicios/logicaPertenenciaConjuros";

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
      (c) => c.tipoLanzador === "pacto" || esClasePacto(c.clase)
    );
  }, [personaje?.espaciosPactoMaximos, personaje?.clasesLanzadoras]);

  const nivelEspacioPacto = personaje?.nivelEspacioPacto || 1;

  // 3. Nivel de Brujo y Arcanos Místicos
  const nivelBrujo = useMemo(() => {
    if (!personaje) return 0;
    const claseBrujo = (personaje.clases || []).find(
      (c) => esClasePacto(c.nombre)
    );
    if (claseBrujo) return claseBrujo.nivel;
    if (esClasePacto(personaje.clase)) {
      return personaje.nivel || 1;
    }
    return 0;
  }, [personaje?.clases, personaje?.clase, personaje?.nivel]);

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

  // Pre-computar variantes normalizadas de cada hechizo una sola vez para O(1) permanente
  const clavesLookupPorHechizo = useMemo(() => {
    return crearClavesLookupHechizos(baseDatosHechizos);
  }, [baseDatosHechizos]);

  // 4. Mapa de hechizos por ID, slug, nombres normalizados y sinónimos de traducción
  const mapaHechizos = useMemo(() => {
    const m = new Map<string, HechizoBase>();
    for (const h of baseDatosHechizos) {
      m.set(h.id, h);
      const claves = clavesLookupPorHechizo.get(h.id);
      if (claves) {
        for (const clave of claves) {
          m.set(clave, h);
        }
      }
    }
    return m;
  }, [baseDatosHechizos, clavesLookupPorHechizo]);

  // 5. Conjuntos de pertenencia pre-expandidos para O(1)
  const setsPertenencia = useMemo(() => {
    return crearSetsPertenencia(personaje);
  }, [
    personaje?.conjurosPreparadosIds,
    personaje?.conjurosConocidosIds,
    personaje?.trucosConocidosIds,
    personaje?.conjurosSiemprePreparadosIds,
    personaje?.clases,
    personaje?.clase,
    personaje?.subclase,
    personaje?.nivel
  ]);

  const { setPreparadosIds, setConocidosIds, setTrucosIds, setSiemprePreparados } = setsPertenencia;

  // 5.1. Detección profunda de origen de conjuros otorgados pre-indexada O(1)
  const resolutorOrigen = useMemo(
    () => crearResolutorOrigenConjuros(personaje),
    [
      personaje?.rasgos,
      personaje?.clases,
      personaje?.clase,
      personaje?.subclase,
      personaje?.nivel,
      personaje?.especie,
      personaje?.subespecie,
      personaje?.conjurosSiemprePreparadosIds
    ]
  );

  const obtenerOrigenConjuro = useCallback(
    (hechizo: HechizoBase): OrigenConjuroBadge | null => {
      return resolutorOrigen(hechizo);
    },
    [resolutorOrigen]
  );

  // 6. Límites máximos
  const maximos = useMemo(() => {
    return calcularMaximosConjurosYTrucos(
      personaje?.clasesLanzadoras || [],
      personaje?.nivel || 1,
      modHabilidad
    );
  }, [personaje?.clasesLanzadoras, personaje?.nivel, modHabilidad]);

  // Predicados puros unificados de pertenencia y preparación
  const predicados = useMemo(() => {
    return crearPredicadosPertenencia({
      sets: setsPertenencia,
      clavesLookup: clavesLookupPorHechizo,
      modelo: maximos.modelo,
      resolutorOrigen
    });
  }, [setsPertenencia, clavesLookupPorHechizo, maximos.modelo, resolutorOrigen]);

  const esHechizoDeSubclase = useCallback(
    (hechizo: HechizoBase): boolean => predicados.esHechizoDeSubclase(hechizo),
    [predicados]
  );

  const esHechizoOtorgado = useCallback(
    (hechizo: HechizoBase): boolean => predicados.esHechizoOtorgado(hechizo),
    [predicados]
  );

  const estaPreparado = useCallback(
    (hechizo: HechizoBase): boolean => predicados.estaPreparado(hechizo),
    [predicados]
  );

  const estaEnLista = useCallback(
    (hechizo: HechizoBase): boolean => predicados.estaEnLista(hechizo),
    [predicados]
  );

  // 7 y 8. Recorrido unificado O(N) que agrupa conjuros por nivel, trucos conocidos y calcula el conteo efectivo
  const { conjurosPorNivel, trucosConocidos, conteoEfectivo } = useMemo(() => {
    const grupos: Record<number, HechizoBase[]> = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []
    };
    const trucos: HechizoBase[] = [];
    const idsTrucosVistos = new Set<string>();

    let cLibres = 0;
    let cSubclase = 0;
    let tLibres = 0;
    let tSubclase = 0;

    const esModeloPreparados = maximos.modelo === "preparados";

    for (const h of baseDatosHechizos) {
      const hId = h.id;
      const claves = clavesLookupPorHechizo.get(hId);

      const chequeoEnSet = (setIds: Set<string>): boolean => {
        if (!claves) return setIds.has(hId);
        for (let i = 0; i < claves.length; i++) {
          if (setIds.has(claves[i])) return true;
        }
        return false;
      };

      const esSubclase = chequeoEnSet(setSiemprePreparados);
      const origen = resolutorOrigen(h);
      const otorgado = origen !== null || esSubclase;

      if (h.nivel === 0) {
        const enLista = chequeoEnSet(setTrucosIds) || otorgado;
        if (otorgado) {
          tSubclase++;
        } else if (enLista) {
          tLibres++;
        }

        if (enLista && !idsTrucosVistos.has(hId)) {
          idsTrucosVistos.add(hId);
          trucos.push(aplicarModificadoresInvocacionesAHechizo(h, personaje));
        }
      } else if (h.nivel >= 1 && h.nivel <= 9) {
        const preparado = otorgado || chequeoEnSet(setPreparadosIds);
        const enLista = esModeloPreparados ? preparado : (chequeoEnSet(setConocidosIds) || preparado);

        if (esModeloPreparados) {
          if (otorgado) {
            cSubclase++;
          } else if (preparado) {
            cLibres++;
          }
        } else {
          if (otorgado) {
            cSubclase++;
          } else if (enLista) {
            cLibres++;
          }
        }

        if (enLista) {
          grupos[h.nivel].push(h);
        }
      }
    }

    trucos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    for (let niv = 1; niv <= 9; niv++) {
      if (grupos[niv].length > 1) {
        grupos[niv].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      }
    }

    return {
      conjurosPorNivel: grupos,
      trucosConocidos: trucos,
      conteoEfectivo: {
        libres: cLibres,
        subclase: cSubclase,
        total: cLibres + cSubclase,
        trucosLibres: tLibres,
        trucosSubclase: tSubclase
      }
    };
  }, [
    baseDatosHechizos,
    clavesLookupPorHechizo,
    setSiemprePreparados,
    resolutorOrigen,
    setTrucosIds,
    setPreparadosIds,
    setConocidosIds,
    maximos.modelo,
    personaje
  ]);

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
