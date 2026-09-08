import { useState, useMemo } from "react";
import type { PersonajeJugador, ObjetoJuego, ObjetoInventario, TipoContenedor } from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  calcularCapacidadCarga,
  calcularPesoTotal,
  calcularEquivalentePO,
  estaSobrecargado,
  contarSintonizaciones,
  calcularDesglosePesosPorContenedor,
  MULTIPLICADORES_TAMANO
} from "@/servicios/calculadorInventario";
import { usarEstadoPersistido } from "@/hooks";
import { esObjetoEquipable } from "@/servicios/procesadorEquipamiento";
import {
  CriterioOrdenMochila,
  OPCIONES_ORDEN_MOCHILA,
  CajaMovilizacionRapida,
  CAJAS_MOVILIZACION_RAPIDA,
  ContenedorEspecialConfig,
  CONTENEDORES_ESPECIALES_CONFIG,
  SubseccionMochilaTipo
} from "./inventarioConstantes";
import {
  filtrarListaInventarioTolerante,
  clasificarMochilaPorTipo,
  ordenarInventarioPlano
} from "@/servicios/clasificadorInventario";
import { usarDragAndDropInventario } from "./usarDragAndDropInventario";

export type { CriterioOrdenMochila, CajaMovilizacionRapida, ContenedorEspecialConfig, SubseccionMochilaTipo };
export { OPCIONES_ORDEN_MOCHILA, CAJAS_MOVILIZACION_RAPIDA, CONTENEDORES_ESPECIALES_CONFIG };

interface ParametrosInventarioOrdenado {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  baseDatosObjetos: ObjetoJuego[];
  alCambiarContenedor?: (idInstancia: string, contenedor: TipoContenedor) => void;
  alAlternarEquipado: (idInstancia: string) => void;
  alReordenarInventario?: (idInstanciaOrigen: string, idInstanciaDestino: string) => void;
  agregarNotificacion: (mensaje: string, tipo?: "info" | "exito" | "advertencia" | "error") => void;
}

export function usarInventarioOrdenado({
  personaje,
  statsCalculadas,
  baseDatosObjetos,
  alCambiarContenedor,
  alAlternarEquipado,
  alReordenarInventario,
  agregarNotificacion
}: ParametrosInventarioOrdenado) {
  // Estado persistente de secciones colapsables
  const [seccionesAbiertas, setSeccionesAbiertas] = usarEstadoPersistido<Record<string, boolean>>(
    "ts_inventario_secciones_abiertas",
    {
      recursos: true,
      equipados: true,
      consumibles: true,
      municion: true,
      armas: true,
      armaduras: true,
      herramientas: true,
      magicos: true,
      equipo: true,
      bolsa_contencion: true,
      montura: true,
      almacen: true
    }
  );

  // Estados de Búsqueda y Orden en Mochila
  const [busquedaMochila, setBusquedaMochila] = useState("");
  const [criterioOrden, setCriterioOrden] = useState<CriterioOrdenMochila>("tipo");

  const alternarSeccion = (idSeccion: string) => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [idSeccion]: prev[idSeccion] === false ? true : false
    }));
  };

  const colapsarTodasSecciones = () => {
    setSeccionesAbiertas({
      recursos: false,
      equipados: false,
      consumibles: false,
      municion: false,
      armas: false,
      armaduras: false,
      herramientas: false,
      magicos: false,
      equipo: false,
      bolsa_contencion: false,
      montura: false,
      almacen: false
    });
  };

  const expandirTodasSecciones = () => {
    setSeccionesAbiertas({
      recursos: true,
      equipados: true,
      consumibles: true,
      municion: true,
      armas: true,
      armaduras: true,
      herramientas: true,
      magicos: true,
      equipo: true,
      bolsa_contencion: true,
      montura: true,
      almacen: true
    });
  };

  const inventario = personaje.inventario || [];
  const bolsaMonedas = personaje.bolsaMonedas || { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 };
  const tamano = personaje.tamano || "Mediano";

  // 1. Cálculos de Carga y Peso
  const fuerzaEfectiva = statsCalculadas.puntuacionesEfectivas.fuerza || 10;
  const capacidadCarga = calcularCapacidadCarga(fuerzaEfectiva, null, tamano);
  const pesoTotal = calcularPesoTotal(inventario, bolsaMonedas);
  const desglosePesos = useMemo(() => calcularDesglosePesosPorContenedor(inventario), [inventario]);
  const sobrecargado = estaSobrecargado(pesoTotal, capacidadCarga);
  const porcentajeCarga = Math.min(100, Math.max(0, Math.round((pesoTotal / capacidadCarga) * 100)));

  const pesoContenedoresSinCarga =
    Math.round((desglosePesos.bolsaContencion + desglosePesos.montura + desglosePesos.almacen) * 100) / 100;

  // 2. Equivalente en Oro y Sintonizaciones
  const totalPOEquivalente = calcularEquivalentePO(bolsaMonedas);
  const totalSintonizados = contarSintonizaciones(inventario);
  const objetosSintonizados = inventario.filter((o) => o.sintonizado);

  // 3. Listas por compartimento
  const objetosEquipados = inventario.filter((o) => o.equipado);
  const objetosNoEquipados = inventario.filter((o) => !o.equipado);

  const objetosMochilaBase = objetosNoEquipados.filter(
    (o) => !o.contenedor || o.contenedor === "mochila"
  );
  const objetosBolsaContencionBase = objetosNoEquipados.filter(
    (o) => o.contenedor === "bolsa_contencion"
  );
  const objetosMonturaBase = objetosNoEquipados.filter(
    (o) => o.contenedor === "montura"
  );
  const objetosAlmacenBase = objetosNoEquipados.filter(
    (o) => o.contenedor === "almacen"
  );

  // 4. Filtrado tolerante memoizado
  const objetosMochilaFiltrados = useMemo(
    () => filtrarListaInventarioTolerante(objetosMochilaBase, busquedaMochila),
    [objetosMochilaBase, busquedaMochila]
  );
  const objetosBolsaContencionFiltrados = useMemo(
    () => filtrarListaInventarioTolerante(objetosBolsaContencionBase, busquedaMochila),
    [objetosBolsaContencionBase, busquedaMochila]
  );
  const objetosMonturaFiltrados = useMemo(
    () => filtrarListaInventarioTolerante(objetosMonturaBase, busquedaMochila),
    [objetosMonturaBase, busquedaMochila]
  );
  const objetosAlmacenFiltrados = useMemo(
    () => filtrarListaInventarioTolerante(objetosAlmacenBase, busquedaMochila),
    [objetosAlmacenBase, busquedaMochila]
  );

  const mapaContenedoresEspeciales = useMemo<Record<"bolsa_contencion" | "montura" | "almacen", ObjetoInventario[]>>(() => ({
    bolsa_contencion: objetosBolsaContencionFiltrados,
    montura: objetosMonturaFiltrados,
    almacen: objetosAlmacenFiltrados
  }), [objetosBolsaContencionFiltrados, objetosMonturaFiltrados, objetosAlmacenFiltrados]);

  // Helper para verificar contents
  const comprobarTieneContents = (obj: ObjetoInventario): boolean => {
    const normalizar = (s: string) => s.toLowerCase().trim();
    const objetoCompendio = baseDatosObjetos.find(
      (b) => b.id === obj.idObjeto || normalizar(b.nombre) === normalizar(obj.nombre)
    );
    const contents = objetoCompendio?.contents || (obj as unknown as { contents?: unknown[] }).contents;
    return Array.isArray(contents) && contents.length > 0;
  };

  // 5. Clasificación en Subsecciones y Ordenamiento Plano
  const subseccionesPorTipo = useMemo<SubseccionMochilaTipo[]>(() => {
    return clasificarMochilaPorTipo(objetosMochilaFiltrados, baseDatosObjetos);
  }, [objetosMochilaFiltrados, baseDatosObjetos]);

  const objetosMochilaOrdenadosPlano = useMemo(() => {
    return ordenarInventarioPlano(objetosMochilaFiltrados, criterioOrden, busquedaMochila, baseDatosObjetos);
  }, [objetosMochilaFiltrados, criterioOrden, busquedaMochila, baseDatosObjetos]);

  const multiplicadorTamano = MULTIPLICADORES_TAMANO[tamano] ?? 1;
  const multiplicadorTexto = multiplicadorTamano !== 1 ? ` × ${multiplicadorTamano} (${tamano})` : "";

  // 6. Hook de Drag and Drop
  const {
    zonaDropActiva,
    setZonaDropActiva,
    arrastrandoItem,
    setArrastrandoItem,
    manejarDragOver,
    manejarDragLeave,
    manejarDrop
  } = usarDragAndDropInventario({
    inventario,
    alCambiarContenedor,
    alAlternarEquipado,
    alReordenarInventario,
    alCambiarOrden: setCriterioOrden,
    agregarNotificacion
  });

  return {
    seccionesAbiertas,
    alternarSeccion,
    colapsarTodasSecciones,
    expandirTodasSecciones,
    busquedaMochila,
    setBusquedaMochila,
    criterioOrden,
    setCriterioOrden,
    fuerzaEfectiva,
    capacidadCarga,
    pesoTotal,
    desglosePesos,
    sobrecargado,
    porcentajeCarga,
    pesoContenedoresSinCarga,
    bolsaMonedas,
    totalPOEquivalente,
    totalSintonizados,
    objetosSintonizados,
    objetosEquipados,
    objetosNoEquipados,
    objetosMochilaBase,
    objetosMochilaFiltrados,
    mapaContenedoresEspeciales,
    subseccionesPorTipo,
    objetosMochilaOrdenadosPlano,
    inventario,
    arrastrandoItem,
    setArrastrandoItem,
    zonaDropActiva,
    setZonaDropActiva,
    manejarDragOver,
    manejarDragLeave,
    manejarDrop,
    manejarReordenarItems: (origen: string, destino: string) => {
      const objOrigen = inventario.find((o) => o.idInstancia === origen);
      const objDestino = inventario.find((o) => o.idInstancia === destino);

      // Si se suelta sobre un objeto equipado y el de origen no está equipado: EQUIPAR
      if (objDestino?.equipado && !objOrigen?.equipado) {
        if (!objOrigen || !esObjetoEquipable(objOrigen)) {
          agregarNotificacion(
            `"${objOrigen?.nombre || "El objeto"}" no es un objeto equipable (solo armas, armaduras o equipo vestible).`,
            "advertencia"
          );
          return;
        }
        if (objOrigen.contenedor && objOrigen.contenedor !== "mochila") {
          alCambiarContenedor?.(origen, "mochila");
        }
        alAlternarEquipado(origen);
        agregarNotificacion(`"${objOrigen.nombre}" equipado.`, "exito");
        return;
      }

      if (objOrigen?.equipado) {
        alAlternarEquipado(origen);
        agregarNotificacion(`"${objOrigen.nombre}" desequipado.`, "info");
      }
      if (objOrigen?.contenedor && objOrigen.contenedor !== "mochila") {
        alCambiarContenedor?.(origen, "mochila");
      }
      setCriterioOrden("personalizado");
      alReordenarInventario?.(origen, destino);
    },
    multiplicadorTexto,
    comprobarTieneContents
  };
}
