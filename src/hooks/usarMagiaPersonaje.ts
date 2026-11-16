import { obtenerModificadoresConjuroRasgos } from "@/servicios/rasgos/modificadoresConjuroRasgos";
import { useMemo } from "react";
import { obtenerSelectoresArcanos } from "@/servicios/rasgos/arcanosMisticosRasgos";
import type { PersonajeJugador, HechizoBase, Caracteristica, ModeloConjuros } from "@/tipos";
import { calcularCDConjuros, calcularBonoAtaqueConjuro } from "@/servicios/magia/estadisticasCombateMagico";
import { calcularMaximosConjurosYTrucos } from "@/servicios/magia/catalogoProgresionMagica";
import { obtenerNivelesArcanoMisticoDisponibles } from "@/servicios/magia/magiaPactoBrujo";
import { esClasePacto } from "@/constantes";
import { crearResolutorOrigenConjuros, OrigenConjuroBadge } from "@/servicios/resolutorOrigenConjuros";
import { aplicarModificadoresInvocacionesAHechizo } from "@/servicios/evaluadorEfectosRasgos";
import { esConjuroIndependiente, clasesPropietariasConjuro } from "@/servicios/rasgos/listasConjurosRasgos";

const ETIQUETAS_HABILIDAD: Partial<Record<Caracteristica, string>> = {
  inteligencia: "INT",
  sabiduria: "SAB",
  carisma: "CAR"
};

const compararEspanol = new Intl.Collator("es", { sensitivity: "base" }).compare;

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
  crearPredicadosPertenencia,
  verificarEnSet
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
  bonoCompetencia: number = 2,
  claseLanzamiento?: string
): EstadoMagiaPersonaje {
  // 1. Habilidad mágica principal
  const clasesLanzadoras = personaje?.clasesLanzadoras;
  const habilidadMagica: Caracteristica = clasesLanzadoras?.length
    ? ((clasesLanzadoras.find((c) => c.clase === claseLanzamiento) ?? clasesLanzadoras[0]).habilidadConjuro as Caracteristica)
    : "inteligencia";

  const modHabilidad = modificadores ? (modificadores[habilidadMagica] ?? 0) : 0;
  const cdConjuros =
    calcularCDConjuros(bonoCompetencia, modHabilidad) +
    (personaje ? obtenerModificadoresConjuroRasgos(personaje, claseLanzamiento || clasesLanzadoras?.[0]?.clase).bonoCD : 0);
  const bonoAtaqueMagico = calcularBonoAtaqueConjuro(bonoCompetencia, modHabilidad);
  const etiquetaHabilidad = ETIQUETAS_HABILIDAD[habilidadMagica] ?? "INT";

  // 2. Modelo de lanzamiento
  const requierePreparacion =
    !clasesLanzadoras?.length ||
    clasesLanzadoras.some((c) => c.modeloConjuros === "preparados" || c.modeloConjuros === "grimorio");

  const esLanzadorPacto =
    (personaje?.espaciosPactoMaximos || 0) > 0 ||
    (clasesLanzadoras || []).some((c) => c.tipoLanzador === "pacto" || esClasePacto(c.clase));

  const nivelEspacioPacto = personaje?.nivelEspacioPacto || 1;

  // 3. Nivel de Brujo y Arcanos Místicos
  const claseBrujo = (personaje?.clases || []).find((c) => esClasePacto(c.nombre));
  const nivelBrujo = claseBrujo
    ? claseBrujo.nivel
    : personaje && esClasePacto(personaje.clase)
      ? personaje.nivel || 1
      : 0;

  const nivelesArcanoDisponibles = useMemo(() => {
    if (personaje && obtenerSelectoresArcanos(personaje).length) return obtenerSelectoresArcanos(personaje,true)
      .map(s => s.nivelConjuro!).sort((a,b) => a-b);
    const disponibles = obtenerNivelesArcanoMisticoDisponibles(nivelBrujo);
    for (const item of personaje?.arcanoMisticoIds || []) {
      const lvl = Number(item.split(":")[0]);
      if (!isNaN(lvl) && lvl >= 6 && !disponibles.includes(lvl)) {
        disponibles.push(lvl);
      }
    }
    return disponibles.sort((a, b) => a - b);
  }, [nivelBrujo, personaje]);

  // 4. Pre-computar variantes normalizadas y mapa de hechizos para consultas O(1)
  const { clavesLookupPorHechizo, mapaHechizos } = useMemo(() => {
    const lookup = crearClavesLookupHechizos(baseDatosHechizos);
    const m = new Map<string, HechizoBase>();
    for (const h of baseDatosHechizos) {
      m.set(h.id, h);
      for (const clave of lookup.get(h.id) ?? []) {
        m.set(clave, h);
      }
    }
    return { clavesLookupPorHechizo: lookup, mapaHechizos: m };
  }, [baseDatosHechizos]);

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

  const obtenerOrigenConjuro: EstadoMagiaPersonaje["obtenerOrigenConjuro"] = resolutorOrigen;

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

  const { esHechizoDeSubclase, esHechizoOtorgado, estaPreparado, estaEnLista } = predicados;

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
    let independientesPreparados = 0;

    const esModeloPreparacion = maximos.modelo === "preparados" || maximos.modelo === "grimorio";

    for (const h of baseDatosHechizos) {
      const hId = h.id;
      const esSubclase = verificarEnSet(setSiemprePreparados, hId, clavesLookupPorHechizo);
      const origen = resolutorOrigen(h);
      const otorgado = origen !== null || esSubclase;
      const independiente = personaje && esConjuroIndependiente(personaje, h)
        && !clasesPropietariasConjuro(personaje, h.id).length;

      if (h.nivel === 0) {
        const enLista = verificarEnSet(setTrucosIds, hId, clavesLookupPorHechizo) || otorgado;
        if (otorgado) {
          tSubclase++;
        } else if (enLista && !independiente) {
          tLibres++;
        }

        if (enLista && !idsTrucosVistos.has(hId)) {
          idsTrucosVistos.add(hId);
          trucos.push(aplicarModificadoresInvocacionesAHechizo(h, personaje, claseLanzamiento));
        }
      } else if (h.nivel >= 1 && h.nivel <= 9) {
        const preparado = otorgado || verificarEnSet(setPreparadosIds, hId, clavesLookupPorHechizo);
        const enLista = esModeloPreparacion
          ? preparado
          : (verificarEnSet(setConocidosIds, hId, clavesLookupPorHechizo) || preparado);

        if (otorgado) {
          cSubclase++;
        } else if (enLista) {
          if (independiente) independientesPreparados++;
          else cLibres++;
        }

        if (enLista) {
          grupos[h.nivel].push(h);
        }
      }
    }

    trucos.sort((a, b) => compararEspanol(a.nombre, b.nombre));
    for (let niv = 1; niv <= 9; niv++) {
      if (grupos[niv].length > 1) {
        grupos[niv].sort((a, b) => compararEspanol(a.nombre, b.nombre));
      }
    }

    return {
      conjurosPorNivel: grupos,
      trucosConocidos: trucos,
      conteoEfectivo: {
        libres: cLibres,
        subclase: cSubclase,
        total: cLibres + cSubclase + independientesPreparados,
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
    claseLanzamiento,
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
