import { useState, useMemo, useDeferredValue } from "react";
import type { HechizoBase, PersonajeJugador } from "@/tipos";
import { usarEstadoPersistido } from "@/hooks";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
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
  const busquedaDiferida = useDeferredValue(busqueda);
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
      nv_9: true
    }
  );

  const conjurosEnAccionesIds = personaje.conjurosEnAcciones || [];

  const alternarEnAcciones = (hechizoId: string) => {
    const alternarAccion = usarAlmacenDM.getState().alternarConjuroEnAcciones;
    if (alternarAccion && personaje.id) {
      alternarAccion(personaje.id, hechizoId);
    }
  };

  const conjurosEnAccionesSet = useMemo(() => new Set(conjurosEnAccionesIds), [conjurosEnAccionesIds]);

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
      nv_9: abrir
    });
  };

  const conteoFiltrosActivos = useMemo(() => {
    let conteo = 0;
    if (busquedaDiferida.trim()) conteo++;
    if (filtroConcentracion !== "todos") conteo++;
    if (filtroResolucion !== "todos") conteo++;
    if (filtroComponentes.sinV) conteo++;
    if (filtroComponentes.sinS) conteo++;
    if (filtroComponentes.sinM) conteo++;
    if (filtroComponentes.soloM) conteo++;
    return conteo;
  }, [busquedaDiferida, filtroConcentracion, filtroResolucion, filtroComponentes]);

  const hayFiltrosActivos = conteoFiltrosActivos > 0;

  const limpiarTodosLosFiltros = () => {
    setBusqueda("");
    setFiltroConcentracion("todos");
    setFiltroResolucion("todos");
    setFiltroComponentes({ sinV: false, sinS: false, sinM: false, soloM: false });
  };

  // Trucos y conjuros de nivel 1 a 9 siempre visibles en su nivel
  const trucosFiltrados = useMemo(() => {
    return trucosConocidos.filter((truco) =>
      evaluarFiltrosHechizo(truco, busquedaDiferida, filtroConcentracion, filtroResolucion, filtroComponentes)
    );
  }, [trucosConocidos, busquedaDiferida, filtroConcentracion, filtroResolucion, filtroComponentes]);

  const conjurosFiltradosPorNivel = useMemo(() => {
    const res: Record<number, HechizoBase[]> = {};
    for (let nivel = 1; nivel <= 9; nivel++) {
      const lista = conjurosPorNivel[nivel] || [];
      res[nivel] = lista.filter((h) =>
        evaluarFiltrosHechizo(h, busquedaDiferida, filtroConcentracion, filtroResolucion, filtroComponentes)
      );
    }
    return res;
  }, [conjurosPorNivel, busquedaDiferida, filtroConcentracion, filtroResolucion, filtroComponentes]);

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
    conjurosEnAccionesSet,
    alternarEnAcciones,
    trucosVisibles: trucosConocidos,
    trucosFiltrados,
    conjurosVisiblesPorNivel: conjurosPorNivel,
    conjurosFiltradosPorNivel
  };
};
