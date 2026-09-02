import React, { useState, useEffect, useMemo } from "react";
import type {
  PersonajeJugador,
  ObjetoJuego,
  ObjetoInventario,
  BolsaMonedas,
  TipoMonedaClave,
  TipoContenedor
} from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  Coins,
  Weight,
  Link2,
  Swords,
  Backpack,
  Sparkles,
  Plus,
  Search,
  X,
  FlaskConical,
  Shield,
  Wrench,
  Package,
  Box,
  Target,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  calcularCapacidadCarga,
  calcularPesoTotal,
  calcularEquivalentePO,
  estaSobrecargado,
  contarSintonizaciones,
  evaluarOperacionMoneda,
  MULTIPLICADORES_TAMANO,
  calcularDesglosePesosPorContenedor,
  CONFIG_CONTENEDORES
} from "@/servicios/calculadorInventario";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import { esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { esContenedorFisicoMunicion } from "@/servicios/gestorMunicion";
import { SelectorDesplegable, OpcionDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { usarEstadoPersistido, usarLanzadorConjuros } from "@/hooks";
import { usarAccionesConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { TarjetaObjetoInventario } from "./TarjetaObjetoInventario";
import { ModalAgregarObjeto } from "./ModalAgregarObjeto";
import { ModalDetalleObjetoInventario } from "./ModalDetalleObjetoInventario";
import estilos from "./HojaPersonaje.module.css";

interface PanelInventarioPersonajeProps {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  baseDatosObjetos: ObjetoJuego[];
  alAgregarObjeto: (objeto: ObjetoInventario | ObjetoInventario[]) => void;
  alQuitarObjeto: (idInstancia: string) => void;
  alModificarCantidad: (idInstancia: string, delta: number) => void;
  alAlternarEquipado: (idInstancia: string) => void;
  alAlternarSintonizado: (idInstancia: string) => void;
  alActualizarNotas: (idInstancia: string, notas: string) => void;
  alActualizarObjeto?: (idInstancia: string, cambios: Partial<ObjetoInventario>) => void;
  alModificarCargas: (idInstancia: string, delta: number) => void;
  alCambiarContenedor?: (idInstancia: string, contenedor: TipoContenedor) => void;
  alReordenarInventario?: (idInstanciaOrigen: string, idInstanciaDestino: string) => void;
  alDesempaquetarPaquete?: (idInstancia: string) => void;
  alEstablecerMonedas: (monedas: Partial<BolsaMonedas>) => void;
  alModificarMoneda: (tipo: TipoMonedaClave, delta: number) => void;
  alUsarObjeto?: (objeto: ObjetoInventario) => void;
}

type CriterioOrdenMochila = "tipo" | "personalizado" | "reciente" | "peso-desc" | "peso-asc" | "nombre-asc" | "valor-desc";

const OPCIONES_ORDEN_MOCHILA: OpcionDesplegable<CriterioOrdenMochila>[] = [
  { valor: "tipo", etiqueta: "Por Tipo (Secciones)" },
  { valor: "personalizado", etiqueta: "Personalizado (Libre)" },
  { valor: "reciente", etiqueta: "Último Agregado" },
  { valor: "peso-desc", etiqueta: "Mayor Peso" },
  { valor: "peso-asc", etiqueta: "Menor Peso" },
  { valor: "nombre-asc", etiqueta: "Nombre (A - Z)" },
  { valor: "valor-desc", etiqueta: "Mayor Valor" }
];

const CAJAS_MOVILIZACION_RAPIDA: {
  id: string;
  titulo: string;
  subtitulo: string;
  color: string;
  icono: React.ReactNode;
}[] = [
  {
    id: "mochila",
    titulo: "Mochila",
    subtitulo: "Carga directa",
    color: "#f59e0b",
    icono: <Backpack size={13} color="#f59e0b" />
  },
  {
    id: "bolsa_contencion",
    titulo: "Bolsa Contención",
    subtitulo: "0 lb carga",
    color: "#c084fc",
    icono: <Sparkles size={13} color="#c084fc" />
  },
  {
    id: "montura",
    titulo: "Montura / Carreta",
    subtitulo: "0 lb carga",
    color: "#38bdf8",
    icono: <Box size={13} color="#38bdf8" />
  },
  {
    id: "almacen",
    titulo: "Almacén / Base",
    subtitulo: "0 lb carga",
    color: "#94a3b8",
    icono: <Package size={13} color="#94a3b8" />
  },
  {
    id: "equipados",
    titulo: "Equipar",
    subtitulo: "Armas / Armadura",
    color: "#60a5fa",
    icono: <Swords size={13} color="#60a5fa" />
  }
];

const CONTENEDORES_ESPECIALES_CONFIG: {
  id: "bolsa_contencion" | "montura" | "almacen";
  titulo: string;
  icono: React.ReactNode;
  color: string;
}[] = [
  {
    id: "bolsa_contencion",
    titulo: "Bolsa de Contención (Bag of Holding)",
    icono: <Sparkles size={14} color="#c084fc" />,
    color: "#c084fc"
  },
  {
    id: "montura",
    titulo: "Montura / Carreta / Alforjas",
    icono: <Box size={14} color="#38bdf8" />,
    color: "#38bdf8"
  },
  {
    id: "almacen",
    titulo: "Almacén / Base / Campamento",
    icono: <Package size={14} color="#94a3b8" />,
    color: "#94a3b8"
  }
];

const MONEDAS_CONFIG: { clave: TipoMonedaClave; etiqueta: string; claseColor: string }[] = [
  { clave: "ppt", etiqueta: "PPT", claseColor: estilos.monedaPPT },
  { clave: "po",  etiqueta: "PO",  claseColor: estilos.monedaPO },
  { clave: "pe",  etiqueta: "PE",  claseColor: estilos.monedaPE },
  { clave: "pp",  etiqueta: "PP",  claseColor: estilos.monedaPP },
  { clave: "pc",  etiqueta: "PC",  claseColor: estilos.monedaPC }
];

interface CasillaMonedaProps {
  clave: TipoMonedaClave;
  etiqueta: string;
  claseColor: string;
  valorActual: number;
  alGuardar: (clave: TipoMonedaClave, nuevoValor: number) => void;
}

const CasillaMoneda: React.FC<CasillaMonedaProps> = ({
  clave,
  etiqueta,
  claseColor,
  valorActual,
  alGuardar
}) => {
  const [texto, setTexto] = useState(String(valorActual));

  useEffect(() => {
    setTexto(String(valorActual));
  }, [valorActual]);

  const aplicarOperacion = () => {
    const evaluado = evaluarOperacionMoneda(valorActual, texto);
    setTexto(String(evaluado));
    if (evaluado !== valorActual) {
      alGuardar(clave, evaluado);
    }
  };

  const manejarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={estilos.tarjetaMoneda}>
      <span className={`${estilos.etiquetaMoneda} ${claseColor}`}>
        {etiqueta}
      </span>
      <input
        type="text"
        inputMode="numeric"
        className={estilos.inputMoneda}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={aplicarOperacion}
        onKeyDown={manejarKeyDown}
        placeholder="0"
        title="Ingresa un número directo o una operación (+10, -5, 50+20)"
      />
    </div>
  );
};

export const PanelInventarioPersonaje: React.FC<PanelInventarioPersonajeProps> = ({
  personaje,
  statsCalculadas,
  baseDatosObjetos,
  alAgregarObjeto,
  alQuitarObjeto,
  alModificarCantidad,
  alAlternarEquipado,
  alAlternarSintonizado,
  alActualizarNotas,
  alActualizarObjeto,
  alModificarCargas,
  alCambiarContenedor,
  alReordenarInventario,
  alDesempaquetarPaquete,
  alEstablecerMonedas,
  alModificarMoneda: _alModificarMoneda,
  alUsarObjeto
}) => {
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [tabModalAgregar, setTabModalAgregar] = useState<"compendio" | "otrasPosesiones">("compendio");
  const [objetoInspeccionadoId, setObjetoInspeccionadoId] = useState<string | null>(null);

  // Hook centralizado de lanzamiento de magia (Facade + Strategy)
  const { puedeLanzar, motivoBloqueo, lanzar } = usarLanzadorConjuros({
    personaje,
    penalizacionArmadura: statsCalculadas?.penalizacionArmadura
  });

  // Estado persistente de secciones colapsables del inventario
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

  // Estado visual de la zona de soltado activa y estado global de arrastre
  const [zonaDropActiva, setZonaDropActiva] = useState<string | null>(null);
  const [arrastrandoItem, setArrastrandoItem] = useState(false);

  // Limpieza global de seguridad para Drag & Drop (evita que el dock flotante quede atascado si el DOM desmonta el elemento arrastrado)
  useEffect(() => {
    if (!arrastrandoItem) return;

    const finalizarArrastreGlobal = () => {
      setArrastrandoItem(false);
      setZonaDropActiva(null);
    };

    window.addEventListener("dragend", finalizarArrastreGlobal);
    window.addEventListener("mouseup", finalizarArrastreGlobal);
    window.addEventListener("drop", finalizarArrastreGlobal);

    return () => {
      window.removeEventListener("dragend", finalizarArrastreGlobal);
      window.removeEventListener("mouseup", finalizarArrastreGlobal);
      window.removeEventListener("drop", finalizarArrastreGlobal);
    };
  }, [arrastrandoItem]);

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

  // Manejadores de Drag and Drop Nativo
  const manejarDragOver = (e: React.DragEvent, idSeccion: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (zonaDropActiva !== idSeccion) {
      setZonaDropActiva(idSeccion);
    }
  };

  const manejarDragLeave = (e: React.DragEvent, idSeccion: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (zonaDropActiva === idSeccion) {
      setZonaDropActiva(null);
    }
  };

  const manejarDrop = (e: React.DragEvent, destino: string) => {
    e.preventDefault();
    setZonaDropActiva(null);
    setArrastrandoItem(false);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const payload = JSON.parse(raw) as {
        idInstancia: string;
        nombre: string;
        equipable: boolean;
        equipado: boolean;
        contenedor: TipoContenedor;
      };

      const idInstancia = payload.idInstancia;
      const objActual = inventario.find((o) => o.idInstancia === idInstancia);
      if (!objActual) return;

      if (destino === "equipados") {
        // REGLA: Solo lo equipable es equipable
        if (!objActual.equipable) {
          agregarNotificacion(
            `"${objActual.nombre}" no es un objeto equipable (solo armas, armaduras o equipo vestible).`,
            "advertencia"
          );
          return;
        }

        if (objActual.contenedor && objActual.contenedor !== "mochila") {
          alCambiarContenedor?.(idInstancia, "mochila");
        }
        if (!objActual.equipado) {
          alAlternarEquipado(idInstancia);
          agregarNotificacion(`"${objActual.nombre}" equipado.`, "exito");
        }
        return;
      }

      if (destino === "bolsa_contencion" || destino === "montura" || destino === "almacen") {
        if (objActual.equipado) {
          alAlternarEquipado(idInstancia);
          agregarNotificacion(`"${objActual.nombre}" desequipado.`, "info");
        }
        if (objActual.contenedor !== destino) {
          alCambiarContenedor?.(idInstancia, destino as TipoContenedor);
          const nombreCont = CONFIG_CONTENEDORES[destino as TipoContenedor]?.nombreCorto || destino;
          agregarNotificacion(`"${objActual.nombre}" movido a ${nombreCont}.`, "info");
        }
        return;
      }

      // Cualquier otra subsección de la mochila o la mochila en sí -> mover a la mochila / desequipar
      if (objActual.equipado) {
        alAlternarEquipado(idInstancia);
        agregarNotificacion(`"${objActual.nombre}" desequipado.`, "info");
      }
      const contActual = objActual.contenedor || "mochila";
      if (contActual !== "mochila") {
        alCambiarContenedor?.(idInstancia, "mochila");
        agregarNotificacion(`"${objActual.nombre}" movido a la mochila.`, "info");
      }
    } catch (err) {
      console.error("[PanelInventarioPersonaje] Error al procesar drop:", err);
    }
  };

  // Reordenación libre de items y transferencia entre compartimentos por Drag & Drop
  const manejarReordenarItems = (idOrigen: string, idDestino: string) => {
    setArrastrandoItem(false);
    setZonaDropActiva(null);

    const objOrigen = inventario.find((o) => o.idInstancia === idOrigen);
    const objDestino = inventario.find((o) => o.idInstancia === idDestino);

    if (!objOrigen || !objDestino) return;

    const contOrigen = objOrigen.contenedor || "mochila";
    const contDestino = objDestino.contenedor || "mochila";

    // CASO 1: Soltar un objeto sobre otro en "Equipados Activos"
    if (objDestino.equipado && !objOrigen.equipado) {
      if (!objOrigen.equipable) {
        agregarNotificacion(
          `"${objOrigen.nombre}" no es un objeto equipable (solo armas, armaduras o equipo vestible).`,
          "advertencia"
        );
        return;
      }
      if (contOrigen !== "mochila") {
        alCambiarContenedor?.(idOrigen, "mochila");
      }
      alAlternarEquipado(idOrigen);
      agregarNotificacion(`"${objOrigen.nombre}" equipado.`, "exito");
      alReordenarInventario?.(idOrigen, idDestino);
      return;
    }

    // CASO 2: Soltar un objeto equipado sobre un objeto NO equipado (en la mochila o contenedor)
    if (objOrigen.equipado && !objDestino.equipado) {
      alAlternarEquipado(idOrigen);
      if (contDestino !== "mochila") {
        alCambiarContenedor?.(idOrigen, contDestino);
        const nombreDestino = CONFIG_CONTENEDORES[contDestino]?.nombreCorto || contDestino;
        agregarNotificacion(`"${objOrigen.nombre}" desequipado y movido a ${nombreDestino}.`, "info");
      } else {
        agregarNotificacion(`"${objOrigen.nombre}" desequipado.`, "info");
      }
      if (criterioOrden !== "personalizado") {
        setCriterioOrden("personalizado");
        agregarNotificacion("Orden de inventario cambiado a Personalizado.", "info");
      }
      alReordenarInventario?.(idOrigen, idDestino);
      return;
    }

    // CASO 3: Traslado entre compartimentos distintos (ej. de Bolsa de Contención a Mochila o viceversa)
    if (contOrigen !== contDestino) {
      if (objOrigen.equipado) {
        alAlternarEquipado(idOrigen);
      }
      alCambiarContenedor?.(idOrigen, contDestino);
      const nombreDestino = CONFIG_CONTENEDORES[contDestino]?.nombreCorto || contDestino;
      agregarNotificacion(`"${objOrigen.nombre}" movido a ${nombreDestino}.`, "info");
    }

    if (criterioOrden !== "personalizado") {
      setCriterioOrden("personalizado");
      agregarNotificacion("Orden de inventario cambiado a Personalizado.", "info");
    }
    alReordenarInventario?.(idOrigen, idDestino);
  };

  // Helper para verificar si un objeto de inventario tiene contents
  const comprobarTieneContents = (obj: ObjetoInventario): boolean => {
    const normalizar = (s: string) => s.toLowerCase().trim();
    const objetoCompendio = baseDatosObjetos.find(
      (b) => b.id === obj.idObjeto || normalizar(b.nombre) === normalizar(obj.nombre)
    );
    const contents = objetoCompendio?.contents || (obj as any).contents;
    return Array.isArray(contents) && contents.length > 0;
  };

  // Estados de Búsqueda y Orden en Mochila
  const [busquedaMochila, setBusquedaMochila] = useState("");
  const [criterioOrden, setCriterioOrden] = useState<CriterioOrdenMochila>("tipo");

  const inventario = personaje.inventario || [];
  const bolsaMonedas = personaje.bolsaMonedas || { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 };
  const tamano = personaje.tamano || "Mediano";

  // Objeto seleccionado actualmente para inspección detallada
  const objetoInspeccionado = inventario.find((o) => o.idInstancia === objetoInspeccionadoId) || null;

  // 1. Cálculos de Carga y Peso (respetando contenedores especiales)
  const fuerzaEfectiva = statsCalculadas.puntuacionesEfectivas.fuerza || 10;
  const capacidadCarga = calcularCapacidadCarga(fuerzaEfectiva, null, tamano);
  const pesoTotal = calcularPesoTotal(inventario, bolsaMonedas);
  const desglosePesos = useMemo(() => calcularDesglosePesosPorContenedor(inventario), [inventario]);
  const sobrecargado = estaSobrecargado(pesoTotal, capacidadCarga);
  const porcentajeCarga = Math.min(100, Math.max(0, Math.round((pesoTotal / capacidadCarga) * 100)));

  // Peso en contenedores que no suma al personaje
  const pesoContenedoresSinCarga = Math.round(
    (desglosePesos.bolsaContencion + desglosePesos.montura + desglosePesos.almacen) * 100
  ) / 100;

  // 2. Equivalente en Oro
  const totalPOEquivalente = calcularEquivalentePO(bolsaMonedas);

  // 3. Sintonizaciones
  const totalSintonizados = contarSintonizaciones(inventario);
  const objetosSintonizados = inventario.filter((o) => o.sintonizado);

  // 4. División de listas base por compartimento
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

  // 5. Filtrado tolerante según búsqueda priorizando título/nombre
  const filtrarLista = (lista: ObjetoInventario[]) => {
    if (!busquedaMochila || !busquedaMochila.trim()) {
      return lista;
    }
    const filtrada = lista.filter((obj) => {
      const nombreContenedor = obj.contenedor ? (CONFIG_CONTENEDORES[obj.contenedor]?.nombre || "") : "";
      return coincideBusquedaTolerante(
        [obj.nombre, obj.tipoPrincipal, obj.notas, obj.rareza, nombreContenedor],
        busquedaMochila
      );
    });

    return filtrada.sort(
      compararPorRelevanciaTitulo(
        (o) => o.nombre,
        busquedaMochila,
        (a, b) => a.nombre.localeCompare(b.nombre, "es"),
        (o) => [o.tipoPrincipal, o.notas, o.rareza]
      )
    );
  };

  const objetosMochilaFiltrados = useMemo(() => filtrarLista(objetosMochilaBase), [objetosMochilaBase, busquedaMochila]);
  const objetosBolsaContencionFiltrados = useMemo(() => filtrarLista(objetosBolsaContencionBase), [objetosBolsaContencionBase, busquedaMochila]);
  const objetosMonturaFiltrados = useMemo(() => filtrarLista(objetosMonturaBase), [objetosMonturaBase, busquedaMochila]);
  const objetosAlmacenFiltrados = useMemo(() => filtrarLista(objetosAlmacenBase), [objetosAlmacenBase, busquedaMochila]);

  const mapaContenedoresEspeciales = useMemo<Record<"bolsa_contencion" | "montura" | "almacen", ObjetoInventario[]>>(() => ({
    bolsa_contencion: objetosBolsaContencionFiltrados,
    montura: objetosMonturaFiltrados,
    almacen: objetosAlmacenFiltrados
  }), [objetosBolsaContencionFiltrados, objetosMonturaFiltrados, objetosAlmacenFiltrados]);

  // Función auxiliar para obtener el valor monetario en PO
  const obtenerValorPO = (obj: ObjetoInventario): number => {
    const comp = baseDatosObjetos.find(
      (b) => b.id === obj.idObjeto || b.nombre.toLowerCase().trim() === obj.nombre.toLowerCase().trim()
    );
    return Number(comp?.valorPO) || 0;
  };

  // 6. Clasificación en Subsecciones de Mochila (para modo "Por Tipo")
  const subseccionesPorTipo = useMemo(() => {
    const consumibles: ObjetoInventario[] = [];
    const municion: ObjetoInventario[] = [];
    const armas: ObjetoInventario[] = [];
    const armaduras: ObjetoInventario[] = [];
    const herramientas: ObjetoInventario[] = [];
    const magicos: ObjetoInventario[] = [];
    const equipo: ObjetoInventario[] = [];

    for (const obj of objetosMochilaFiltrados) {
      // Detectar si es munición o contenedor de munición (Carcaj, Caja de Virotes, Bolsa de Balas)
      const comp = baseDatosObjetos.find(
        (b) => b.id === obj.idObjeto || b.nombre.toLowerCase().trim() === obj.nombre.toLowerCase().trim()
      );
      const sub = (comp?.subcategoria || "").toLowerCase();
      const nom = obj.nombre.toLowerCase().trim();

      const esMunicionOContenedor =
        sub.includes("municion") ||
        comp?.storage !== undefined ||
        esContenedorFisicoMunicion(nom) ||
        (obj.idObjeto && esContenedorFisicoMunicion(obj.idObjeto)) ||
        nom.includes("flecha") ||
        nom.includes("virote") ||
        nom.includes("carcaj") ||
        nom.includes("caja de virotes") ||
        nom.includes("bolsa de balas") ||
        nom.includes("cartuchera") ||
        nom.includes("bolsita") ||
        nom.includes("estuche de agujas") ||
        nom.includes("aguja") ||
        nom.includes("quiver");

      if (esMunicionOContenedor && obj.tipoPrincipal !== "Arma") {
        municion.push(obj);
        continue;
      }

      // Objetos en Mochila / Encima:
      if (esObjetoConsumible(obj.nombre, obj.notas)) {
        consumibles.push(obj);
        continue;
      }

      if (obj.tipoPrincipal === "Arma") {
        armas.push(obj);
        continue;
      }

      if (obj.tipoPrincipal === "Armadura") {
        armaduras.push(obj);
        continue;
      }

      if (sub.includes("consumible") || sub.includes("pocion")) {
        consumibles.push(obj);
      } else if (
        sub.includes("herramienta") ||
        sub.includes("instrumento") ||
        sub.includes("juego") ||
        obj.nombre.toLowerCase().includes("herramientas") ||
        obj.nombre.toLowerCase().includes("kit")
      ) {
        herramientas.push(obj);
      } else if (obj.esMagico || obj.rareza !== "Común" || sub.includes("maravilloso")) {
        magicos.push(obj);
      } else {
        equipo.push(obj);
      }
    }

    const calcPeso = (lista: ObjetoInventario[]) =>
      Math.round(lista.reduce((acc, o) => acc + (o.pesoLb || 0) * (o.cantidad || 1), 0) * 100) / 100;

    return [
      {
        id: "consumibles",
        titulo: "Consumibles y Pociones",
        icono: <FlaskConical size={13} color="#10b981" />,
        color: "#10b981",
        items: consumibles,
        pesoTotal: calcPeso(consumibles),
        esContenedorEspecial: false
      },
      {
        id: "municion",
        titulo: "Munición y Contenedores (Carcaj)",
        icono: <Target size={13} color="#38bdf8" />,
        color: "#38bdf8",
        items: municion,
        pesoTotal: calcPeso(municion),
        esContenedorEspecial: false
      },
      {
        id: "armas",
        titulo: "Armas en Reserva",
        icono: <Swords size={13} color="#f87171" />,
        color: "#f87171",
        items: armas,
        pesoTotal: calcPeso(armas),
        esContenedorEspecial: false
      },
      {
        id: "armaduras",
        titulo: "Armaduras y Escudos",
        icono: <Shield size={13} color="#60a5fa" />,
        color: "#60a5fa",
        items: armaduras,
        pesoTotal: calcPeso(armaduras),
        esContenedorEspecial: false
      },
      {
        id: "herramientas",
        titulo: "Herramientas e Instrumentos",
        icono: <Wrench size={13} color="#f59e0b" />,
        color: "#f59e0b",
        items: herramientas,
        pesoTotal: calcPeso(herramientas),
        esContenedorEspecial: false
      },
      {
        id: "magicos",
        titulo: "Objetos Mágicos y Maravillosos",
        icono: <Sparkles size={13} color="#c084fc" />,
        color: "#c084fc",
        items: magicos,
        pesoTotal: calcPeso(magicos),
        esContenedorEspecial: false
      },
      {
        id: "equipo",
        titulo: "Equipo de Aventuras y Varios",
        icono: <Package size={13} color="#94a3b8" />,
        color: "#94a3b8",
        items: equipo,
        pesoTotal: calcPeso(equipo),
        esContenedorEspecial: false
      }
    ];
  }, [objetosMochilaFiltrados, baseDatosObjetos]);

  // 7. Lista plana ordenada (para modos distintos de "Por Tipo")
  const objetosMochilaOrdenadosPlano = useMemo(() => {
    const lista = [...objetosMochilaFiltrados];

    const comparadorDesempate = (a: ObjetoInventario, b: ObjetoInventario): number => {
      switch (criterioOrden) {
        case "reciente":
          return 0; // Se mantiene orden LIFO
        case "peso-desc":
          return (b.pesoLb || 0) * (b.cantidad || 1) - (a.pesoLb || 0) * (a.cantidad || 1);
        case "peso-asc":
          return (a.pesoLb || 0) * (a.cantidad || 1) - (b.pesoLb || 0) * (b.cantidad || 1);
        case "valor-desc":
          return obtenerValorPO(b) - obtenerValorPO(a);
        case "nombre-asc":
        default:
          return a.nombre.localeCompare(b.nombre, "es");
      }
    };

    if (busquedaMochila && busquedaMochila.trim()) {
      return lista.sort(
        compararPorRelevanciaTitulo(
          (o) => o.nombre,
          busquedaMochila,
          comparadorDesempate,
          (o) => [o.tipoPrincipal, o.notas, o.rareza]
        )
      );
    }

    switch (criterioOrden) {
      case "personalizado":
        // Orden personalizado: preserva el orden exacto del inventario
        return lista;

      case "reciente":
        // Pila LIFO: el último añadido en el array de inventario sale primero
        return lista.reverse();

      case "peso-desc":
        return lista.sort(
          (a, b) => (b.pesoLb || 0) * (b.cantidad || 1) - (a.pesoLb || 0) * (a.cantidad || 1)
        );

      case "peso-asc":
        return lista.sort(
          (a, b) => (a.pesoLb || 0) * (a.cantidad || 1) - (b.pesoLb || 0) * (b.cantidad || 1)
        );

      case "nombre-asc":
        return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      case "valor-desc":
        return lista.sort((a, b) => obtenerValorPO(b) - obtenerValorPO(a));

      default:
        return lista;
    }
  }, [objetosMochilaFiltrados, criterioOrden, busquedaMochila, baseDatosObjetos]);

  const multiplicadorTexto =
    tamano === "Mediano" ? "" : ` × ${MULTIPLICADORES_TAMANO[tamano]} (${tamano})`;

  return (
    <div className={estilos.seccionInventario}>
      {/* SECCIÓN 1: RECURSOS, CARGA Y FINANZAS (UNIFICADA Y COLAPSABLE) */}
      <div className={`${estilos.neoRaised} ${estilos.grupoListaInventario}`}>
        <div
          className={`${estilos.cabeceraGrupoInventario} ${estilos.cabeceraColapsableInventario}`}
          onClick={() => alternarSeccion("recursos")}
          title="Haz clic para colapsar o expandir finanzas, carga y sintonización"
        >
          <div className={estilos.tituloGrupoInventario}>
            <span className={estilos.iconoChevronColapso}>
              {seccionesAbiertas.recursos !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <Coins size={14} color="#f59e0b" />
            <span>Recursos, Carga y Finanzas</span>
          </div>
          <div className={estilos.resumenCabeceraRecursos}>
            <span className={estilos.badgeResumenRecursoPO} title="Total en oro">
              <Coins size={10} color="#fbbf24" style={{ marginRight: 3, verticalAlign: "middle" }} />
              {totalPOEquivalente.toLocaleString("es-ES")} PO
            </span>
            <span
              className={`${estilos.badgeResumenRecursoCarga} ${sobrecargado ? estilos.badgeResumenCargaSobrecargado : ""}`}
              title="Peso total vs capacidad de carga"
            >
              <Weight size={10} color={sobrecargado ? "#ef4444" : "#10b981"} style={{ marginRight: 3, verticalAlign: "middle" }} />
              {pesoTotal} / {capacidadCarga} lb
            </span>
            <span className={estilos.badgeResumenRecursoSintonizacion} title="Ranuras sintonizadas ocupadas">
              <Link2 size={10} color="#c084fc" style={{ marginRight: 3, verticalAlign: "middle" }} />
              {totalSintonizados}/3
            </span>
          </div>
        </div>

        {seccionesAbiertas.recursos !== false && (
          <div className={estilos.cuerpoSeccionRecursos}>
            {/* SUB-BLOQUE 1: BOLSA DE MONEDAS */}
            <div className={estilos.contenedorMonedasInterior}>
              <div className={estilos.cabeceraMonedas}>
                <div className={estilos.tituloMonedas}>
                  <Coins size={12} color="#f59e0b" />
                  <span>Bolsa de Monedas</span>
                </div>
                <div className={estilos.resumenEquivalentePO}>
                  Total: {totalPOEquivalente.toLocaleString("es-ES")} PO
                </div>
              </div>

              <div className={estilos.cuadriculaMonedas}>
                {MONEDAS_CONFIG.map(({ clave, etiqueta, claseColor }) => (
                  <CasillaMoneda
                    key={clave}
                    clave={clave}
                    etiqueta={etiqueta}
                    claseColor={claseColor}
                    valorActual={bolsaMonedas[clave] || 0}
                    alGuardar={(c, val) => alEstablecerMonedas({ [c]: val })}
                  />
                ))}
              </div>
            </div>

            {/* SUB-BLOQUE 2: CAPACIDAD DE CARGA */}
            <div className={estilos.contenedorCargaInterior}>
              <div className={estilos.cabeceraCarga}>
                <div className={estilos.tituloCarga}>
                  <Weight size={12} color={sobrecargado ? "#ef4444" : "#10b981"} />
                  <span>Capacidad de Carga</span>
                </div>
                <div className={estilos.detalleCalculoCarga}>
                  FUE {fuerzaEfectiva} × 15 lb{multiplicadorTexto} = {capacidadCarga} lb
                  {pesoContenedoresSinCarga > 0 && (
                    <span className={estilos.detalleCalculoCargaContenedores}>
                      (En Contenedores: {pesoContenedoresSinCarga} lb)
                    </span>
                  )}
                </div>
              </div>

              <div className={estilos.barraCargaFondo}>
                <div
                  className={`${estilos.barraCargaProgreso} ${
                    sobrecargado ? estilos.cargaSobrecargado : estilos.cargaNormal
                  }`}
                  style={{ width: `${porcentajeCarga}%` }}
                />
                <div className={estilos.barraCargaTexto}>
                  <span>{pesoTotal}</span>
                  <span className={estilos.barraCargaTextoTotal}>
                    / {capacidadCarga} lb
                  </span>
                </div>
                <div
                  className={`${estilos.badgeEstadoCarga} ${
                    sobrecargado ? estilos.badgeCargaSobrecargado : estilos.badgeCargaNormal
                  }`}
                >
                  {sobrecargado ? "Sobrecargado" : "Normal"}
                </div>
              </div>
            </div>

            {/* SUB-BLOQUE 3: SINTONIZACIÓN */}
            <div className={estilos.contenedorSintonizacionInterior}>
              <div className={estilos.cabeceraSintonizacion}>
                <div className={estilos.tituloSintonizacion}>
                  <Link2 size={12} color="#c084fc" />
                  <span>Sintonización Mágica</span>
                </div>
                <span className={estilos.sintonizacionRanurasTexto}>
                  {totalSintonizados} / 3 Ranuras
                </span>
              </div>

              <div className={estilos.filaSlotsSintonizacion}>
                {[0, 1, 2].map((indice) => {
                  const obj = objetosSintonizados[indice];
                  if (obj) {
                    return (
                      <div
                        key={obj.idInstancia}
                        className={`${estilos.slotSintonizacion} ${estilos.slotSintonizacionActivo}`}
                        title={`${obj.nombre} (Sintonizado)`}
                      >
                        <Sparkles size={12} className={estilos.iconoSlotSintonizacion} />
                        <span className={estilos.textoSlotSintonizacion}>{obj.nombre}</span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`vacio-${indice}`}
                      className={`${estilos.slotSintonizacion} ${estilos.slotSintonizacionVacio}`}
                    >
                      <span>Ranura {indice + 1} Libre</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 4: OBJETOS EQUIPADOS */}
      <div
        className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
          zonaDropActiva === "equipados" ? estilos.zonaDropActiva : ""
        }`}
        onDragOver={(e) => manejarDragOver(e, "equipados")}
        onDragLeave={(e) => manejarDragLeave(e, "equipados")}
        onDrop={(e) => manejarDrop(e, "equipados")}
      >
        <div
          className={`${estilos.cabeceraGrupoInventario} ${estilos.cabeceraColapsableInventario}`}
          onClick={() => alternarSeccion("equipados")}
          title="Haz clic para colapsar o expandir (o arrastra aquí para equipar)"
        >
          <div className={estilos.tituloGrupoInventario}>
            <span className={estilos.iconoChevronColapso}>
              {seccionesAbiertas.equipados !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <Swords size={14} color="#60a5fa" />
            <span>Equipados Activos</span>
          </div>
          <span className={estilos.contadorGrupoInventario}>
            {objetosEquipados.length}
          </span>
        </div>

        {seccionesAbiertas.equipados !== false && (
          <div className={estilos.listaItemsInventario}>
            {objetosEquipados.length === 0 ? (
              <div className={estilos.mensajeVacioInventario}>
                No hay armas o armaduras equipadas actualmente. Arrastra objetos aquí para equiparlos.
              </div>
            ) : (
              objetosEquipados.map((obj) => (
                <TarjetaObjetoInventario
                  key={obj.idInstancia}
                  objeto={obj}
                  baseDatosObjetos={baseDatosObjetos}
                  inventarioCompleto={personaje.inventario || []}
                  totalSintonizados={totalSintonizados}
                  alInspeccionar={() => setObjetoInspeccionadoId(obj.idInstancia)}
                  alAlternarEquipado={() => alAlternarEquipado(obj.idInstancia)}
                  alAlternarSintonizado={() => alAlternarSintonizado(obj.idInstancia)}
                  alModificarCantidad={(delta) => alModificarCantidad(obj.idInstancia, delta)}
                  alModificarCargas={(delta) => alModificarCargas(obj.idInstancia, delta)}
                  alEliminar={() => alQuitarObjeto(obj.idInstancia)}
                  alUsar={alUsarObjeto}
                  alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(obj.idInstancia, c)}
                  alSoltarReordenar={manejarReordenarItems}
                  alIniciarArrastre={() => setArrastrandoItem(true)}
                  alFinalizarArrastre={() => {
                    setArrastrandoItem(false);
                    setZonaDropActiva(null);
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 5: MOCHILA */}
      <div
        className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
          zonaDropActiva === "mochila" ? estilos.zonaDropActiva : ""
        }`}
        onDragOver={(e) => manejarDragOver(e, "mochila")}
        onDragLeave={(e) => manejarDragLeave(e, "mochila")}
        onDrop={(e) => manejarDrop(e, "mochila")}
      >
        <div className={estilos.cabeceraGrupoInventario}>
          <div className={estilos.tituloGrupoInventario}>
            <Backpack size={14} color="#f59e0b" />
            <span>Mochila</span>
          </div>
          <span className={estilos.contadorGrupoInventario}>
            {objetosMochilaFiltrados.length} / {objetosMochilaBase.length}
          </span>
        </div>

        {/* Barra de Búsqueda Rápida, Selector de Orden y Controles de Colapso */}
        <div className={estilos.barraControlesMochila}>
          <div className={estilos.cajaBuscadorMochila}>
            <Search size={12} className={estilos.iconoBuscadorMochila} />
            <input
              type="text"
              className={estilos.inputBuscadorMochila}
              placeholder="Buscar en el inventario..."
              value={busquedaMochila}
              onChange={(e) => setBusquedaMochila(e.target.value)}
            />
            {busquedaMochila && (
              <button
                type="button"
                className={estilos.botonLimpiarBusquedaMochila}
                onClick={() => setBusquedaMochila("")}
                title="Limpiar búsqueda"
              >
                <X size={11} />
              </button>
            )}
          </div>

          <div className={estilos.selectorOrdenMochila}>
            <SelectorDesplegable<CriterioOrdenMochila>
              valor={criterioOrden}
              alCambiar={(nuevo) => setCriterioOrden(nuevo)}
              opciones={OPCIONES_ORDEN_MOCHILA}
              tamano="mini"
            />
          </div>

          {criterioOrden === "tipo" && (
            <div className={estilos.filaControlesColapso}>
              <button
                type="button"
                className={estilos.botonControlColapso}
                onClick={expandirTodasSecciones}
                title="Expandir todas las categorías"
              >
                <Maximize2 size={10} />
                <span>Expandir</span>
              </button>
              <button
                type="button"
                className={estilos.botonControlColapso}
                onClick={colapsarTodasSecciones}
                title="Colapsar todas las categorías"
              >
                <Minimize2 size={10} />
                <span>Colapsar</span>
              </button>
            </div>
          )}
        </div>

        {/* Botón Superior de Agregar Objeto */}
        <button
          type="button"
          className={estilos.botonAgregarMochilaSuperior}
          onClick={() => {
            setTabModalAgregar("compendio");
            setModalAgregarAbierto(true);
          }}
        >
          <Plus size={14} color="#f59e0b" />
          <span>Agregar Objeto</span>
        </button>

        {/* Contenido de la Mochila */}
        {objetosMochilaBase.length === 0 ? (
          <div className={estilos.mensajeVacioInventario}>
            La mochila está vacía. Añade equipo o consumibles arriba.
          </div>
        ) : objetosMochilaFiltrados.length === 0 ? (
          <div className={estilos.mensajeVacioInventario}>
            No se encontraron objetos que coincidan con "{busquedaMochila}".
          </div>
        ) : criterioOrden === "tipo" ? (
          /* MODO 1: ORGANIZACIÓN POR SUBSECCIONES TEMÁTICAS DE LA MOCHILA */
          <div className={estilos.listaSubseccionesMochila}>
            {subseccionesPorTipo
              .filter((sub) => sub.items.length > 0)
              .map((sub) => {
                const abierta = seccionesAbiertas[sub.id] !== false;
                const estaSobrevolada = zonaDropActiva === sub.id;
                return (
                  <div
                    key={sub.id}
                    className={`${estilos.subseccionMochila} ${estaSobrevolada ? estilos.zonaDropActiva : ""}`}
                    onDragOver={(e) => manejarDragOver(e, sub.id)}
                    onDragLeave={(e) => manejarDragLeave(e, sub.id)}
                    onDrop={(e) => manejarDrop(e, sub.id)}
                  >
                    <div
                      className={estilos.cabeceraSubseccionMochila}
                      onClick={() => alternarSeccion(sub.id)}
                      title="Haz clic para colapsar o expandir (o arrastra aquí para mover)"
                    >
                      <div className={estilos.tituloSubseccionMochila} style={{ color: sub.color }}>
                        <span className={estilos.iconoChevronColapso}>
                          {abierta ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        {sub.icono}
                        <span>{sub.titulo}</span>
                      </div>
                      <div className={estilos.metaSubseccionMochila}>
                        {sub.pesoTotal > 0 && (
                          <span className={estilos.pesoSubseccionMochila}>
                            {sub.pesoTotal} lb
                          </span>
                        )}
                        <span className={estilos.contadorGrupoInventario}>
                          {sub.items.length}
                        </span>
                      </div>
                    </div>

                    {abierta && (
                      <div className={estilos.listaItemsInventario}>
                        {sub.items.map((obj) => (
                          <TarjetaObjetoInventario
                            key={obj.idInstancia}
                            objeto={obj}
                            baseDatosObjetos={baseDatosObjetos}
                            inventarioCompleto={personaje.inventario || []}
                            totalSintonizados={totalSintonizados}
                            tieneContents={comprobarTieneContents(obj)}
                            alInspeccionar={() => setObjetoInspeccionadoId(obj.idInstancia)}
                            alAlternarEquipado={() => alAlternarEquipado(obj.idInstancia)}
                            alAlternarSintonizado={() => alAlternarSintonizado(obj.idInstancia)}
                            alModificarCantidad={(delta) => alModificarCantidad(obj.idInstancia, delta)}
                            alModificarCargas={(delta) => alModificarCargas(obj.idInstancia, delta)}
                            alEliminar={() => alQuitarObjeto(obj.idInstancia)}
                            alUsar={alUsarObjeto}
                            alDesempaquetar={() => alDesempaquetarPaquete && alDesempaquetarPaquete(obj.idInstancia)}
                            alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(obj.idInstancia, c)}
                            alSoltarReordenar={manejarReordenarItems}
                            alIniciarArrastre={() => setArrastrandoItem(true)}
                            alFinalizarArrastre={() => {
                              setArrastrandoItem(false);
                              setZonaDropActiva(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          /* MODO 2: LISTA PLANA ORDENADA DE LA MOCHILA */
          <div
            className={`${estilos.listaItemsInventario} ${zonaDropActiva === "mochila" ? estilos.zonaDropActiva : ""}`}
            onDragOver={(e) => manejarDragOver(e, "mochila")}
            onDragLeave={(e) => manejarDragLeave(e, "mochila")}
            onDrop={(e) => manejarDrop(e, "mochila")}
          >
            {objetosMochilaOrdenadosPlano.map((obj) => (
              <TarjetaObjetoInventario
                key={obj.idInstancia}
                objeto={obj}
                baseDatosObjetos={baseDatosObjetos}
                inventarioCompleto={personaje.inventario || []}
                totalSintonizados={totalSintonizados}
                tieneContents={comprobarTieneContents(obj)}
                alInspeccionar={() => setObjetoInspeccionadoId(obj.idInstancia)}
                alAlternarEquipado={() => alAlternarEquipado(obj.idInstancia)}
                alAlternarSintonizado={() => alAlternarSintonizado(obj.idInstancia)}
                alModificarCantidad={(delta) => alModificarCantidad(obj.idInstancia, delta)}
                alModificarCargas={(delta) => alModificarCargas(obj.idInstancia, delta)}
                alEliminar={() => alQuitarObjeto(obj.idInstancia)}
                alUsar={alUsarObjeto}
                alDesempaquetar={() => alDesempaquetarPaquete && alDesempaquetarPaquete(obj.idInstancia)}
                alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(obj.idInstancia, c)}
                alSoltarReordenar={manejarReordenarItems}
                alIniciarArrastre={() => setArrastrandoItem(true)}
                alFinalizarArrastre={() => {
                  setArrastrandoItem(false);
                  setZonaDropActiva(null);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 6: CONTENEDORES EXTERNOS DEDICADOS (OCULTOS SI ESTÁN VACÍOS) */}
      {CONTENEDORES_ESPECIALES_CONFIG
        .filter((cont) => (mapaContenedoresEspeciales[cont.id] || []).length > 0)
        .map((cont) => {
          const itemsContenedor = mapaContenedoresEspeciales[cont.id];
          const pesoContenedor = Math.round(
            itemsContenedor.reduce((acc, o) => acc + (o.pesoLb || 0) * (o.cantidad || 1), 0) * 100
          ) / 100;
          const abierta = seccionesAbiertas[cont.id] !== false;
          const estaSobrevolada = zonaDropActiva === cont.id;

        return (
          <div
            key={cont.id}
            className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
              estaSobrevolada ? estilos.zonaDropActiva : ""
            }`}
            onDragOver={(e) => manejarDragOver(e, cont.id)}
            onDragLeave={(e) => manejarDragLeave(e, cont.id)}
            onDrop={(e) => manejarDrop(e, cont.id)}
          >
            <div
              className={`${estilos.cabeceraGrupoInventario} ${estilos.cabeceraColapsableInventario}`}
              onClick={() => alternarSeccion(cont.id)}
              title={`Haz clic para colapsar o expandir (o arrastra aquí para mover a ${cont.titulo})`}
            >
              <div className={estilos.tituloGrupoInventario} style={{ color: cont.color }}>
                <span className={estilos.iconoChevronColapso}>
                  {abierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                {cont.icono}
                <span>{cont.titulo}</span>
              </div>
              <div className={estilos.metaSubseccionMochila}>
                {pesoContenedor > 0 && (
                  <span className={estilos.pesoSubseccionMochila}>
                    {pesoContenedor} lb (0 lb carga)
                  </span>
                )}
                <span className={estilos.contadorGrupoInventario}>
                  {itemsContenedor.length}
                </span>
              </div>
            </div>

            {abierta && (
              <div className={estilos.listaItemsInventario}>
                {itemsContenedor.length === 0 ? (
                  <div className={estilos.mensajeVacioInventario}>
                    No hay objetos en este compartimento. Arrastra objetos aquí para transferirlos.
                  </div>
                ) : (
                  itemsContenedor.map((obj) => (
                    <TarjetaObjetoInventario
                      key={obj.idInstancia}
                      objeto={obj}
                      baseDatosObjetos={baseDatosObjetos}
                      inventarioCompleto={personaje.inventario || []}
                      totalSintonizados={totalSintonizados}
                      tieneContents={comprobarTieneContents(obj)}
                      alInspeccionar={() => setObjetoInspeccionadoId(obj.idInstancia)}
                      alAlternarEquipado={() => alAlternarEquipado(obj.idInstancia)}
                      alAlternarSintonizado={() => alAlternarSintonizado(obj.idInstancia)}
                      alModificarCantidad={(delta) => alModificarCantidad(obj.idInstancia, delta)}
                      alModificarCargas={(delta) => alModificarCargas(obj.idInstancia, delta)}
                      alEliminar={() => alQuitarObjeto(obj.idInstancia)}
                      alUsar={alUsarObjeto}
                      alDesempaquetar={() => alDesempaquetarPaquete && alDesempaquetarPaquete(obj.idInstancia)}
                      alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(obj.idInstancia, c)}
                      alSoltarReordenar={manejarReordenarItems}
                      alIniciarArrastre={() => setArrastrandoItem(true)}
                      alFinalizarArrastre={() => {
                        setArrastrandoItem(false);
                        setZonaDropActiva(null);
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Dock Flotante/Sticky de Movilización Rápida (Solo visible durante Drag & Drop) */}
      {arrastrandoItem && (
        <div className={estilos.dockMovilizacionFlotanteInferior}>
          <div className={estilos.tituloDockMovilizacion}>
            <Package size={11} color="#38bdf8" />
            <span>Movilización Rápida (Suelta para transferir)</span>
          </div>
          <div className={estilos.gridCajasMovilizacion}>
            {CAJAS_MOVILIZACION_RAPIDA.map((caja) => {
              const estaSobrevolada = zonaDropActiva === caja.id;
              return (
                <div
                  key={caja.id}
                  className={`${estilos.cajaMovilizacionRapida} ${estaSobrevolada ? estilos.cajaMovilizacionSobrevolada : ""}`}
                  style={{
                    borderColor: estaSobrevolada ? caja.color : `${caja.color}60`,
                    backgroundColor: estaSobrevolada ? `${caja.color}35` : `${caja.color}15`
                  }}
                  onDragOver={(e) => manejarDragOver(e, caja.id)}
                  onDragLeave={(e) => manejarDragLeave(e, caja.id)}
                  onDrop={(e) => manejarDrop(e, caja.id)}
                  title={`Arrastra y suelta aquí para transferir a ${caja.titulo}`}
                >
                  <div className={estilos.iconoCajaMovilizacion}>{caja.icono}</div>
                  <div className={estilos.infoCajaMovilizacion}>
                    <span className={estilos.nombreCajaMovilizacion} style={{ color: caja.color }}>
                      {caja.titulo}
                    </span>
                    <span className={estilos.subtituloCajaMovilizacion}>
                      {caja.subtitulo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE ADICIÓN DE OBJETOS */}
      {modalAgregarAbierto && (
        <ModalAgregarObjeto
          tabInicial={tabModalAgregar}
          baseDatosObjetos={baseDatosObjetos}
          alAgregarObjeto={alAgregarObjeto}
          alCerrar={() => setModalAgregarAbierto(false)}
        />
      )}

      {/* MODAL DE INSPECCIÓN Y DESCRIPCIÓN DETALLADA */}
      {objetoInspeccionado && (
        <ModalDetalleObjetoInventario
          objeto={objetoInspeccionado}
          baseDatosObjetos={baseDatosObjetos}
          inventarioCompleto={personaje.inventario || []}
          totalSintonizados={totalSintonizados}
          alCerrar={() => setObjetoInspeccionadoId(null)}
          alAlternarEquipado={() => alAlternarEquipado(objetoInspeccionado.idInstancia)}
          alAlternarSintonizado={() => alAlternarSintonizado(objetoInspeccionado.idInstancia)}
          alActualizarNotas={(notas) => alActualizarNotas(objetoInspeccionado.idInstancia, notas)}
          alActualizarObjeto={(cambios) => alActualizarObjeto && alActualizarObjeto(objetoInspeccionado.idInstancia, cambios)}
          alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(objetoInspeccionado.idInstancia, c)}
          alDesempaquetar={() => alDesempaquetarPaquete && alDesempaquetarPaquete(objetoInspeccionado.idInstancia)}
          alModificarCargas={(delta) => alModificarCargas(objetoInspeccionado.idInstancia, delta)}
          alLanzarHechizo={async (hechizo, objetoNombre, coste) => {
            await lanzar({
              modo: "objetoMagico",
              hechizo: {
                id: hechizo.nombre.toLowerCase().replace(/\s+/g, "-"),
                nombre: hechizo.nombre,
                nivel: 1,
                escuela: "Universal",
                tiempoLanzamiento: "1 Accion",
                alcance: "60 pies",
                componentes: "V, S",
                duracion: "Instantaneo",
                concentracion: false,
                ritual: false,
                descripcion: ""
              },
              objetoNombre,
              objetoInstanciaId: objetoInspeccionado.idInstancia,
              bonoAtaqueObjeto: hechizo.bonoAtaque,
              cdObjeto: hechizo.cd,
              costeCargasObjeto: coste
            });
          }}
          bloqueadoPorArmadura={!puedeLanzar}
          motivoBloqueoArmadura={motivoBloqueo}
        />
      )}
    </div>
  );
};
