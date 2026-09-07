import { useState, useMemo } from "react";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import { usarEstadoPersistido } from "@/hooks";
import {
  evaluarFiltrosHechizo,
  type FiltroComponentesConjuro
} from "@/utiles/filtrosConjuros";

interface PropiedadesHookFiltrosYSeccionesConjuros {
  personaje: PersonajeJugador;
  conjurosPorNivel: Record<number, HechizoBase[]>;
  trucosConocidos: HechizoBase[];
}

export const usarFiltrosYSeccionesConjuros = ({
  personaje,
  conjurosPorNivel,
  trucosConocidos
}: PropiedadesHookFiltrosYSeccionesConjuros) => {
  const [busqueda, setBusqueda] = useState<string>("");
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
  const [filtroConcentracion, setFiltroConcentracion] = useState<"todos" | "sin" | "con">("todos");
  const [filtroResolucion, setFiltroResolucion] = useState<"todos" | "ataque" | "salvacion" | "utilidad">("todos");
  const [filtroComponentes, setFiltroComponentes] = useState<FiltroComponentesConjuro>({
    sinV: false,
    sinS: false,
    sinM: false,
    soloM: false
  });

  // Estado persistente para secciones colapsables por nivel de magia
  const claveSeccionesPj = `ts_conjuros_secciones_${personaje.id || "default"}`;
  const [seccionesAbiertas, setSeccionesAbiertas] = usarEstadoPersistido<Record<string, boolean>>(
    claveSeccionesPj,
    {
      trucos: true,
      nv_1: true,
      nv_2: true,
      nv_3: true,
      nv_4: true,
      nv_5: true,
      nv_6: true,
      nv_7: true,
      nv_8: true,
      nv_9: true,
      ocultos: true
    }
  );

  // Estado persistente para IDs de conjuros ocultados por el jugador
  const claveOcultosPj = `ts_conjuros_ocultos_${personaje.id || "default"}`;
  const [conjurosOcultosIds, setConjurosOcultosIds] = usarEstadoPersistido<string[]>(
    claveOcultosPj,
    []
  );

  const alternarOculto = (hechizoId: string) => {
    setConjurosOcultosIds((prev) =>
      prev.includes(hechizoId) ? prev.filter((id) => id !== hechizoId) : [...prev, hechizoId]
    );
  };

  const desocultarTodos = () => {
    setConjurosOcultosIds([]);
  };

  const conjurosOcultosSet = useMemo(() => new Set(conjurosOcultosIds), [conjurosOcultosIds]);

  const alternarSeccion = (clave: string) => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [clave]: !prev[clave]
    }));
  };

  const alternarTodasLasSecciones = (abrir: boolean) => {
    setSeccionesAbiertas({
      trucos: abrir,
      nv_1: abrir,
      nv_2: abrir,
      nv_3: abrir,
      nv_4: abrir,
      nv_5: abrir,
      nv_6: abrir,
      nv_7: abrir,
      nv_8: abrir,
      nv_9: abrir,
      ocultos: abrir
    });
  };

  const conteoFiltrosActivos = useMemo(() => {
    let conteo = 0;
    if (busqueda.trim()) conteo++;
    if (filtroConcentracion !== "todos") conteo++;
    if (filtroResolucion !== "todos") conteo++;
    if (filtroComponentes.sinV) conteo++;
    if (filtroComponentes.sinS) conteo++;
    if (filtroComponentes.sinM) conteo++;
    if (filtroComponentes.soloM) conteo++;
    return conteo;
  }, [busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  const hayFiltrosActivos = conteoFiltrosActivos > 0;

  const limpiarTodosLosFiltros = () => {
    setBusqueda("");
    setFiltroConcentracion("todos");
    setFiltroResolucion("todos");
    setFiltroComponentes({ sinV: false, sinS: false, sinM: false, soloM: false });
  };

  // Trucos visibles y ocultos
  const trucosVisibles = useMemo(() => {
    return trucosConocidos.filter((t) => !conjurosOcultosSet.has(t.id));
  }, [trucosConocidos, conjurosOcultosSet]);

  const trucosOcultos = useMemo(() => {
    return trucosConocidos.filter((t) => conjurosOcultosSet.has(t.id));
  }, [trucosConocidos, conjurosOcultosSet]);

  const trucosFiltrados = useMemo(() => {
    return trucosVisibles.filter((truco) =>
      evaluarFiltrosHechizo(truco, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes)
    );
  }, [trucosVisibles, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  // Conjuros de nivel 1 a 9 visibles vs ocultos
  const { conjurosVisiblesPorNivel, todosConjurosOcultos } = useMemo(() => {
    const visibles: Record<number, HechizoBase[]> = {};
    const ocultos: HechizoBase[] = [...trucosOcultos];

    for (let nivel = 1; nivel <= 9; nivel++) {
      const lista = conjurosPorNivel[nivel] || [];
      const vis: HechizoBase[] = [];
      for (const h of lista) {
        if (conjurosOcultosSet.has(h.id)) {
          ocultos.push(h);
        } else {
          vis.push(h);
        }
      }
      visibles[nivel] = vis;
    }

    ocultos.sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel - b.nivel;
      return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
    });

    return { conjurosVisiblesPorNivel: visibles, todosConjurosOcultos: ocultos };
  }, [conjurosPorNivel, trucosOcultos, conjurosOcultosSet]);

  // Filtrar conjuros visibles por nivel
  const conjurosFiltradosPorNivel = useMemo(() => {
    const res: Record<number, HechizoBase[]> = {};
    for (let nivel = 1; nivel <= 9; nivel++) {
      const lista = conjurosVisiblesPorNivel[nivel] || [];
      res[nivel] = lista.filter((h) =>
        evaluarFiltrosHechizo(h, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes)
      );
    }
    return res;
  }, [conjurosVisiblesPorNivel, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  // Filtrar conjuros ocultos
  const conjurosOcultosFiltrados = useMemo(() => {
    return todosConjurosOcultos.filter((h) =>
      evaluarFiltrosHechizo(h, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes)
    );
  }, [todosConjurosOcultos, busqueda, filtroConcentracion, filtroResolucion, filtroComponentes]);

  return {
    busqueda,
    setBusqueda,
    mostrarFiltros,
    setMostrarFiltros,
    filtroConcentracion,
    setFiltroConcentracion,
    filtroResolucion,
    setFiltroResolucion,
    filtroComponentes,
    setFiltroComponentes,
    seccionesAbiertas,
    alternarSeccion,
    alternarTodasLasSecciones,
    conteoFiltrosActivos,
    hayFiltrosActivos,
    limpiarTodosLosFiltros,
    alternarOculto,
    desocultarTodos,
    trucosVisibles,
    trucosFiltrados,
    conjurosVisiblesPorNivel,
    conjurosFiltradosPorNivel,
    todosConjurosOcultos,
    conjurosOcultosFiltrados
  };
};
