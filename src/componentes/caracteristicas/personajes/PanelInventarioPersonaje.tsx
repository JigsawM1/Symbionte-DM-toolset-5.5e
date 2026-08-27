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
  FileText,
  Sparkles,
  Plus,
  Search,
  X,
  FlaskConical,
  Shield,
  Wrench,
  Package,
  Box
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
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import { esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { SelectorDesplegable, OpcionDesplegable } from "@/componentes/comunes/SelectorDesplegable";
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
  alModificarCargas: (idInstancia: string, delta: number) => void;
  alCambiarContenedor?: (idInstancia: string, contenedor: TipoContenedor) => void;
  alEstablecerMonedas: (monedas: Partial<BolsaMonedas>) => void;
  alModificarMoneda: (tipo: TipoMonedaClave, delta: number) => void;
  alUsarObjeto?: (objeto: ObjetoInventario) => void;
}

type CriterioOrdenMochila = "tipo" | "reciente" | "peso-desc" | "peso-asc" | "nombre-asc" | "valor-desc";

const OPCIONES_ORDEN_MOCHILA: OpcionDesplegable<CriterioOrdenMochila>[] = [
  { valor: "tipo", etiqueta: "Por Tipo (Secciones)" },
  { valor: "reciente", etiqueta: "Último Agregado (Pila LIFO)" },
  { valor: "peso-desc", etiqueta: "Mayor Peso" },
  { valor: "peso-asc", etiqueta: "Menor Peso" },
  { valor: "nombre-asc", etiqueta: "Nombre (A - Z)" },
  { valor: "valor-desc", etiqueta: "Mayor Valor" }
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
  alModificarCargas,
  alCambiarContenedor,
  alEstablecerMonedas,
  alModificarMoneda: _alModificarMoneda,
  alUsarObjeto
}) => {
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [tabModalAgregar, setTabModalAgregar] = useState<"compendio" | "otrasPosesiones">("compendio");
  const [objetoInspeccionadoId, setObjetoInspeccionadoId] = useState<string | null>(null);

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

  // 4. División de listas base
  const objetosEquipados = inventario.filter((o) => o.equipado);
  const objetosMochilaBase = inventario.filter((o) => !o.equipado);

  // 5. Filtrado tolerante de la mochila
  const objetosMochilaFiltrados = useMemo(() => {
    if (!busquedaMochila || !busquedaMochila.trim()) {
      return objetosMochilaBase;
    }
    return objetosMochilaBase.filter((obj) => {
      const nombreContenedor = obj.contenedor ? (CONFIG_CONTENEDORES[obj.contenedor]?.nombre || "") : "";
      return coincideBusquedaTolerante(
        [obj.nombre, obj.tipoPrincipal, obj.notas, obj.rareza, nombreContenedor],
        busquedaMochila
      );
    });
  }, [objetosMochilaBase, busquedaMochila]);

  // Función auxiliar para obtener el valor monetario en PO
  const obtenerValorPO = (obj: ObjetoInventario): number => {
    const comp = baseDatosObjetos.find(
      (b) => b.id === obj.idObjeto || b.nombre.toLowerCase().trim() === obj.nombre.toLowerCase().trim()
    );
    return Number(comp?.valorPO) || 0;
  };

  // 6. Clasificación en Subsecciones (para modo "Por Tipo")
  const subseccionesPorTipo = useMemo(() => {
    const consumibles: ObjetoInventario[] = [];
    const armas: ObjetoInventario[] = [];
    const armaduras: ObjetoInventario[] = [];
    const herramientas: ObjetoInventario[] = [];
    const magicos: ObjetoInventario[] = [];
    const equipo: ObjetoInventario[] = [];
    const bolsaContencion: ObjetoInventario[] = [];
    const montura: ObjetoInventario[] = [];
    const almacen: ObjetoInventario[] = [];

    for (const obj of objetosMochilaFiltrados) {
      const contenedor = obj.contenedor || "mochila";

      // Si está en un contenedor especial no-mochila:
      if (contenedor === "bolsa_contencion") {
        bolsaContencion.push(obj);
        continue;
      }
      if (contenedor === "montura") {
        montura.push(obj);
        continue;
      }
      if (contenedor === "almacen") {
        almacen.push(obj);
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

      const comp = baseDatosObjetos.find(
        (b) => b.id === obj.idObjeto || b.nombre.toLowerCase().trim() === obj.nombre.toLowerCase().trim()
      );
      const sub = (comp?.subcategoria || "").toLowerCase();

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
      },
      {
        id: "bolsa_contencion",
        titulo: "Bolsa de Contención (Bag of Holding)",
        icono: <Sparkles size={13} color="#c084fc" />,
        color: "#c084fc",
        items: bolsaContencion,
        pesoTotal: calcPeso(bolsaContencion),
        esContenedorEspecial: true
      },
      {
        id: "montura",
        titulo: "Montura / Carreta / Alforjas",
        icono: <Box size={13} color="#38bdf8" />,
        color: "#38bdf8",
        items: montura,
        pesoTotal: calcPeso(montura),
        esContenedorEspecial: true
      },
      {
        id: "almacen",
        titulo: "Almacén / Base / Campamento",
        icono: <Box size={13} color="#94a3b8" />,
        color: "#94a3b8",
        items: almacen,
        pesoTotal: calcPeso(almacen),
        esContenedorEspecial: true
      }
    ];
  }, [objetosMochilaFiltrados, baseDatosObjetos]);

  // 7. Lista plana ordenada (para modos distintos de "Por Tipo")
  const objetosMochilaOrdenadosPlano = useMemo(() => {
    const lista = [...objetosMochilaFiltrados];

    switch (criterioOrden) {
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
  }, [objetosMochilaFiltrados, criterioOrden, baseDatosObjetos]);

  const multiplicadorTexto =
    tamano === "Mediano" ? "" : ` × ${MULTIPLICADORES_TAMANO[tamano]} (${tamano})`;

  return (
    <div className={estilos.seccionInventario}>
      {/* SECCIÓN 1: BOLSA DE MONEDAS */}
      <div className={`${estilos.neoRaised} ${estilos.contenedorMonedas}`}>
        <div className={estilos.cabeceraMonedas}>
          <div className={estilos.tituloMonedas}>
            <Coins size={14} color="#f59e0b" />
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

      {/* SECCIÓN 2: CAPACIDAD DE CARGA */}
      <div className={`${estilos.neoRaised} ${estilos.contenedorCarga}`}>
        <div className={estilos.cabeceraCarga}>
          <div className={estilos.tituloCarga}>
            <Weight size={14} color={sobrecargado ? "#ef4444" : "#10b981"} />
            <span>Capacidad de Carga</span>
          </div>
          <div className={estilos.detalleCalculoCarga}>
            FUE {fuerzaEfectiva} × 15 lb{multiplicadorTexto} = {capacidadCarga} lb
            {pesoContenedoresSinCarga > 0 && (
              <span style={{ color: "#c084fc", marginLeft: 6, fontSize: 9.5 }}>
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
            <span style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.7)", fontWeight: 500 }}>
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

      {/* SECCIÓN 3: SINTONIZACIÓN (MÁXIMO 3) */}
      <div className={`${estilos.neoRaised} ${estilos.contenedorSintonizacion}`}>
        <div className={estilos.cabeceraSintonizacion}>
          <div className={estilos.tituloSintonizacion}>
            <Link2 size={14} color="#c084fc" />
            <span>Sintonización Mágica</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#c084fc" }}>
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

      {/* SECCIÓN 4: OBJETOS EQUIPADOS */}
      <div className={`${estilos.neoRaised} ${estilos.grupoListaInventario}`}>
        <div className={estilos.cabeceraGrupoInventario}>
          <div className={estilos.tituloGrupoInventario}>
            <Swords size={14} color="#60a5fa" />
            <span>Equipados Activos</span>
          </div>
          <span className={estilos.contadorGrupoInventario}>
            {objetosEquipados.length}
          </span>
        </div>

        <div className={estilos.listaItemsInventario}>
          {objetosEquipados.length === 0 ? (
            <div className={estilos.mensajeVacioInventario}>
              No hay armas o armaduras equipadas actualmente.
            </div>
          ) : (
            objetosEquipados.map((obj) => (
              <TarjetaObjetoInventario
                key={obj.idInstancia}
                objeto={obj}
                totalSintonizados={totalSintonizados}
                alInspeccionar={() => setObjetoInspeccionadoId(obj.idInstancia)}
                alAlternarEquipado={() => alAlternarEquipado(obj.idInstancia)}
                alAlternarSintonizado={() => alAlternarSintonizado(obj.idInstancia)}
                alModificarCantidad={(delta) => alModificarCantidad(obj.idInstancia, delta)}
                alModificarCargas={(delta) => alModificarCargas(obj.idInstancia, delta)}
                alEliminar={() => alQuitarObjeto(obj.idInstancia)}
                alUsar={alUsarObjeto}
                alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(obj.idInstancia, c)}
              />
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 5: MOCHILA, CONTENEDORES Y EQUIPO */}
      <div className={`${estilos.neoRaised} ${estilos.grupoListaInventario}`}>
        <div className={estilos.cabeceraGrupoInventario}>
          <div className={estilos.tituloGrupoInventario}>
            <Backpack size={14} color="#f59e0b" />
            <span>Mochila y Contenedores</span>
          </div>
          <span className={estilos.contadorGrupoInventario}>
            {objetosMochilaFiltrados.length} / {objetosMochilaBase.length}
          </span>
        </div>

        {/* Barra de Búsqueda Rápida y Selector de Orden */}
        <div className={estilos.barraControlesMochila}>
          <div className={estilos.cajaBuscadorMochila}>
            <Search size={12} className={estilos.iconoBuscadorMochila} />
            <input
              type="text"
              className={estilos.inputBuscadorMochila}
              placeholder="Buscar en la mochila o contenedores..."
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
        </div>

        {/* Contenido de la Mochila */}
        {objetosMochilaBase.length === 0 ? (
          <div className={estilos.mensajeVacioInventario}>
            La mochila está vacía. Añade equipo o consumibles abajo.
          </div>
        ) : objetosMochilaFiltrados.length === 0 ? (
          <div className={estilos.mensajeVacioInventario}>
            No se encontraron objetos que coincidan con "{busquedaMochila}".
          </div>
        ) : criterioOrden === "tipo" ? (
          /* MODO 1: ORGANIZACIÓN POR SUBSECCIONES TEMÁTICAS Y CONTENEDORES */
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {subseccionesPorTipo
              .filter((sub) => sub.items.length > 0)
              .map((sub) => (
                <div key={sub.id} className={estilos.subseccionMochila}>
                  <div className={estilos.cabeceraSubseccionMochila}>
                    <div className={estilos.tituloSubseccionMochila} style={{ color: sub.color }}>
                      {sub.icono}
                      <span>{sub.titulo}</span>
                    </div>
                    <div className={estilos.metaSubseccionMochila}>
                      {sub.pesoTotal > 0 && (
                        <span className={estilos.pesoSubseccionMochila}>
                          {sub.esContenedorEspecial ? `${sub.pesoTotal} lb (0 lb carga)` : `${sub.pesoTotal} lb`}
                        </span>
                      )}
                      <span className={estilos.contadorGrupoInventario}>
                        {sub.items.length}
                      </span>
                    </div>
                  </div>

                  <div className={estilos.listaItemsInventario}>
                    {sub.items.map((obj) => (
                      <TarjetaObjetoInventario
                        key={obj.idInstancia}
                        objeto={obj}
                        totalSintonizados={totalSintonizados}
                        alInspeccionar={() => setObjetoInspeccionadoId(obj.idInstancia)}
                        alAlternarEquipado={() => alAlternarEquipado(obj.idInstancia)}
                        alAlternarSintonizado={() => alAlternarSintonizado(obj.idInstancia)}
                        alModificarCantidad={(delta) => alModificarCantidad(obj.idInstancia, delta)}
                        alModificarCargas={(delta) => alModificarCargas(obj.idInstancia, delta)}
                        alEliminar={() => alQuitarObjeto(obj.idInstancia)}
                        alUsar={alUsarObjeto}
                        alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(obj.idInstancia, c)}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          /* MODO 2: LISTA PLANA ORDENADA (LIFO Reciente, Peso, Nombre, Valor) */
          <div className={estilos.listaItemsInventario}>
            {objetosMochilaOrdenadosPlano.map((obj) => (
              <TarjetaObjetoInventario
                key={obj.idInstancia}
                objeto={obj}
                totalSintonizados={totalSintonizados}
                alInspeccionar={() => setObjetoInspeccionadoId(obj.idInstancia)}
                alAlternarEquipado={() => alAlternarEquipado(obj.idInstancia)}
                alAlternarSintonizado={() => alAlternarSintonizado(obj.idInstancia)}
                alModificarCantidad={(delta) => alModificarCantidad(obj.idInstancia, delta)}
                alModificarCargas={(delta) => alModificarCargas(obj.idInstancia, delta)}
                alEliminar={() => alQuitarObjeto(obj.idInstancia)}
                alUsar={alUsarObjeto}
                alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(obj.idInstancia, c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 6: BOTONES DE AGREGAR */}
      <div className={estilos.filaBotonesAgregar}>
        <button
          type="button"
          className={estilos.botonAgregarPrincipal}
          onClick={() => {
            setTabModalAgregar("compendio");
            setModalAgregarAbierto(true);
          }}
        >
          <Plus size={15} color="#f59e0b" />
          <span>Agregar Objeto</span>
        </button>

        <button
          type="button"
          className={estilos.botonAgregarPrincipal}
          onClick={() => {
            setTabModalAgregar("otrasPosesiones");
            setModalAgregarAbierto(true);
          }}
        >
          <FileText size={14} color="#f59e0b" />
          <span>Otras Posesiones</span>
        </button>
      </div>

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
          totalSintonizados={totalSintonizados}
          alCerrar={() => setObjetoInspeccionadoId(null)}
          alAlternarEquipado={() => alAlternarEquipado(objetoInspeccionado.idInstancia)}
          alAlternarSintonizado={() => alAlternarSintonizado(objetoInspeccionado.idInstancia)}
          alActualizarNotas={(notas) => alActualizarNotas(objetoInspeccionado.idInstancia, notas)}
          alCambiarContenedor={(c) => alCambiarContenedor && alCambiarContenedor(objetoInspeccionado.idInstancia, c)}
        />
      )}
    </div>
  );
};
