import React, { useState, useMemo } from "react";
import type { MonstruoBase, RasgoPersonaje } from "@/tipos";
import { convertirVDANumero } from "@/servicios/reglasFormaSalvaje";
import {
  X,
  Search,
  Check,
  PawPrint,
  AlertCircle,
  Shield,
  ArrowDownAZ,
  ArrowUpZA,
  ArrowUpDown,
  Filter
} from "lucide-react";
import estilos from "../PanelFormaSalvaje.module.css";

interface ModalGestionFormasSalvajesProps {
  abierto: boolean;
  alCerrar: () => void;
  alGuardar: (seleccion: string[]) => void;
  bestiasDisponibles: MonstruoBase[];
  formasConocidasActualesIds?: string[];
  maxFormasConocidas: number;
  sustitucionDisponible?: boolean;
  formas?: RasgoPersonaje["formasBestia"];
}

type CriterioOrden = "nombre" | "vd";
type DireccionOrden = "asc" | "desc";

const comparadorEspanol = new Intl.Collator("es", { sensitivity: "base" }).compare;

/**
 * Modal táctico de gestión y selección de formas de bestia conocidas en la reserva.
 * Soporta filtrado por texto, por VD, por estado de selección y ordenación por letra o VD.
 */
export const ModalGestionFormasSalvajes: React.FC<ModalGestionFormasSalvajesProps> = ({
  abierto,
  alCerrar,
  alGuardar,
  bestiasDisponibles,
  formasConocidasActualesIds = [],
  maxFormasConocidas,
  sustitucionDisponible = false,
  formas
}) => {
  const [seleccionBorrador, setSeleccionBorrador] = useState<string[]>(() =>
    formasConocidasActualesIds.filter((id) =>
      bestiasDisponibles.some((b) => b.id === id)
    )
  );
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroVd, setFiltroVd] = useState<string>("todos");
  const [soloSeleccionadas, setSoloSeleccionadas] = useState(false);
  const [campoOrden, setCampoOrden] = useState<CriterioOrden>("nombre");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("asc");

  // VDs únicos disponibles ordenados numéricamente
  const vdsDisponibles = useMemo(() => {
    const conjunto = new Set<string>();
    for (const b of bestiasDisponibles) {
      conjunto.add(b.desafio?.trim() || "0");
    }
    return Array.from(conjunto).sort(
      (a, b) => convertirVDANumero(a) - convertirVDANumero(b)
    );
  }, [bestiasDisponibles]);

  // Mapa de VD numérico para comparaciones instantáneas O(1) en ordenación
  const vdsNumericos = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const b of bestiasDisponibles) {
      if (!mapa.has(b.id)) {
        mapa.set(b.id, convertirVDANumero(b.desafio));
      }
    }
    return mapa;
  }, [bestiasDisponibles]);

  const alternarOrdenNombre = () => {
    if (campoOrden === "nombre") {
      setDireccionOrden((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setCampoOrden("nombre");
      setDireccionOrden("asc");
    }
  };

  const alternarOrdenVd = () => {
    if (campoOrden === "vd") {
      setDireccionOrden((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setCampoOrden("vd");
      setDireccionOrden("asc");
    }
  };

  const bestiasFiltradas = useMemo(() => {
    let resultado = bestiasDisponibles;

    // 1. Filtrar por texto
    if (filtroTexto.trim()) {
      const q = filtroTexto.toLowerCase().trim();
      resultado = resultado.filter((b) => b.nombre.toLowerCase().includes(q));
    }

    // 2. Filtrar por seleccionadas
    if (soloSeleccionadas) {
      const seleccionSet = new Set(seleccionBorrador);
      resultado = resultado.filter((b) => seleccionSet.has(b.id));
    }

    // 3. Filtrar por VD
    if (filtroVd !== "todos") {
      resultado = resultado.filter((b) => (b.desafio?.trim() || "0") === filtroVd);
    }

    // 4. Ordenación optimizada
    return [...resultado].sort((a, b) => {
      if (campoOrden === "nombre") {
        const cmp = comparadorEspanol(a.nombre, b.nombre);
        return direccionOrden === "asc" ? cmp : -cmp;
      }
      const vdA = vdsNumericos.get(a.id) ?? 0;
      const vdB = vdsNumericos.get(b.id) ?? 0;
      if (vdA !== vdB) {
        return direccionOrden === "asc" ? vdA - vdB : vdB - vdA;
      }
      const cmp = comparadorEspanol(a.nombre, b.nombre);
      return direccionOrden === "asc" ? cmp : -cmp;
    });
  }, [
    bestiasDisponibles,
    filtroTexto,
    soloSeleccionadas,
    filtroVd,
    campoOrden,
    direccionOrden,
    seleccionBorrador,
    vdsNumericos
  ]);

  if (!abierto) return null;

  const alternarSeleccion = (id: string) => {
    if (seleccionBorrador.includes(id)) {
      setSeleccionBorrador(seleccionBorrador.filter((x) => x !== id));
    } else {
      if (seleccionBorrador.length < maxFormasConocidas) {
        setSeleccionBorrador([...seleccionBorrador, id]);
      }
    }
  };

  const handleGuardar = () => {
    alGuardar(seleccionBorrador);
    alCerrar();
  };

  const hayFiltrosActivos = Boolean(
    filtroTexto.trim() || filtroVd !== "todos" || soloSeleccionadas
  );

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroVd("todos");
    setSoloSeleccionadas(false);
  };

  return (
    <div
      className={estilos.modalSelectorOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-gestion-formas"
      onClick={alCerrar}
    >
      <div
        className={estilos.modalSelectorContenido}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <header className={estilos.modalSelectorHeader}>
          <div className={estilos.modalHeaderTituloBloque}>
            <div className={estilos.modalHeaderIcono}>
              <PawPrint size={15} />
            </div>
            <div>
              <h3 id="titulo-modal-gestion-formas" className={estilos.modalTituloTexto}>
                Seleccionar Bestias Conocidas ({seleccionBorrador.length}/{maxFormasConocidas})
              </h3>
              <div className={estilos.modalSubtituloCapacidad}>
                Límite reglamentario: {maxFormasConocidas} formas simultáneas en reserva
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={alCerrar}
            className={estilos.botonCerrarModal}
            title="Cerrar ventana"
          >
            <X size={15} />
          </button>
        </header>

        {/* Separador de cabecera */}
        <div className={estilos.barraProgresoCapacidadContenedor} />

        {/* Cuerpo del Modal */}
        <div className={estilos.modalSelectorBody}>
          {/* Fila 1: Buscador y Ordenación */}
          <div className={estilos.filaBuscadorYOrden}>
            <div className={estilos.buscadorContenedor}>
              <Search size={13} className={estilos.iconoBuscador} />
              <input
                type="text"
                placeholder="Buscar por nombre de bestia..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className={estilos.inputBusqueda}
                autoFocus
              />
              {filtroTexto && (
                <button
                  type="button"
                  className={estilos.botonLimpiarBusqueda}
                  onClick={() => setFiltroTexto("")}
                  title="Limpiar búsqueda"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className={estilos.grupoOrdenacionModal} role="group" aria-label="Ordenar criaturas">
              <button
                type="button"
                className={`${estilos.botonOrdenModal} ${campoOrden === "nombre" ? estilos.botonOrdenModalActivo : ""}`}
                onClick={alternarOrdenNombre}
                title={`Ordenar por nombre (${campoOrden === "nombre" && direccionOrden === "asc" ? "A-Z" : "Z-A"})`}
              >
                {campoOrden === "nombre" && direccionOrden === "desc" ? (
                  <ArrowUpZA size={12} />
                ) : (
                  <ArrowDownAZ size={12} />
                )}
                <span>Nombre {campoOrden === "nombre" ? (direccionOrden === "asc" ? "(A-Z)" : "(Z-A)") : ""}</span>
              </button>

              <button
                type="button"
                className={`${estilos.botonOrdenModal} ${campoOrden === "vd" ? estilos.botonOrdenModalActivo : ""}`}
                onClick={alternarOrdenVd}
                title={`Ordenar por desafío VD (${campoOrden === "vd" && direccionOrden === "asc" ? "Menor a Mayor" : "Mayor a Menor"})`}
              >
                <ArrowUpDown size={12} />
                <span>VD {campoOrden === "vd" ? (direccionOrden === "asc" ? "(Menor)" : "(Mayor)") : ""}</span>
              </button>
            </div>
          </div>

          {/* Fila 2: Chips de Filtro (Estado y VD) */}
          <div className={estilos.filaChipsFiltro} role="region" aria-label="Filtros rápidos">
            <div className={estilos.grupoChipsEstado}>
              <button
                type="button"
                className={`${estilos.chipFiltro} ${!soloSeleccionadas ? estilos.chipFiltroActivo : ""}`}
                onClick={() => setSoloSeleccionadas(false)}
              >
                Todas ({bestiasDisponibles.length})
              </button>
              <button
                type="button"
                className={`${estilos.chipFiltro} ${soloSeleccionadas ? estilos.chipFiltroActivo : ""}`}
                onClick={() => setSoloSeleccionadas(true)}
              >
                En reserva ({seleccionBorrador.length})
              </button>
            </div>

            <div className={estilos.separadorChips} />

            <div className={estilos.grupoChipsVd}>
              <span className={estilos.labelFiltroVd}>
                <Filter size={10} /> VD:
              </span>
              <button
                type="button"
                className={`${estilos.chipFiltro} ${filtroVd === "todos" ? estilos.chipFiltroActivo : ""}`}
                onClick={() => setFiltroVd("todos")}
              >
                Todos
              </button>
              {vdsDisponibles.map((vd) => (
                <button
                  key={vd}
                  type="button"
                  className={`${estilos.chipFiltro} ${filtroVd === vd ? estilos.chipFiltroActivo : ""}`}
                  onClick={() => setFiltroVd(vd)}
                >
                  VD {vd}
                </button>
              ))}
            </div>
          </div>

          {/* Subbarra de Conteo de Resultados */}
          <div className={estilos.subbarraResultadosModal}>
            <span className={estilos.textoConteoResultados}>
              Mostrando {bestiasFiltradas.length} de {bestiasDisponibles.length} bestias
            </span>
            {hayFiltrosActivos && (
              <button
                type="button"
                className={estilos.botonRestablecerFiltros}
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Lista de criaturas elegibles */}
          <div className={estilos.listaOpcionesPool} role="listbox">
            {bestiasFiltradas.length === 0 ? (
              <div className={estilos.estadoVacioBuscador}>
                <AlertCircle size={18} />
                <span>No se encontraron bestias con los filtros seleccionados</span>
                {hayFiltrosActivos && (
                  <button
                    type="button"
                    className={estilos.botonGestionarPool}
                    onClick={limpiarFiltros}
                  >
                    Ver todas las bestias
                  </button>
                )}
              </div>
            ) : (
              bestiasFiltradas.map((bestia) => {
                const seleccionada = seleccionBorrador.includes(bestia.id);
                const deshabilitada = !seleccionada
                  ? seleccionBorrador.length >= maxFormasConocidas
                  : Boolean(
                      formas &&
                        formasConocidasActualesIds.includes(bestia.id) &&
                        (!sustitucionDisponible ||
                          formasConocidasActualesIds.some(
                            (id) =>
                              id !== bestia.id &&
                              !seleccionBorrador.includes(id) &&
                              bestiasDisponibles.some((b) => b.id === id)
                          ))
                    );

                return (
                  <div
                    key={bestia.id}
                    role="option"
                    aria-selected={seleccionada}
                    className={`${estilos.itemOpcionPool} ${seleccionada ? estilos.seleccionado : ""} ${deshabilitada ? estilos.deshabilitada : ""}`}
                    onClick={() => !deshabilitada && alternarSeleccion(bestia.id)}
                  >
                    <div className={estilos.itemPoolCheckContenedor}>
                      <span className={`${estilos.checkVisual} ${seleccionada ? estilos.checkVisualActivo : ""}`}>
                        {seleccionada && <Check size={11} />}
                      </span>
                    </div>

                    <div className={estilos.itemPoolInfo}>
                      <div className={estilos.itemPoolTituloFila}>
                        <strong className={estilos.itemPoolNombre}>{bestia.nombre}</strong>
                        <span className={estilos.itemPoolVdBadge}>VD {bestia.desafio}</span>
                      </div>
                      <div className={estilos.itemPoolStatsFila}>
                        <span><Shield size={10} /> CA {bestia.ca ?? 10}</span>
                        <span>• FUE {bestia.caracteristicas?.fuerza ?? 10}</span>
                        <span>• DES {bestia.caracteristicas?.destreza ?? 10}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <footer className={estilos.modalSelectorFooter}>
          <button
            type="button"
            className={estilos.botonGestionarPool}
            onClick={alCerrar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={estilos.botonAdoptar}
            onClick={handleGuardar}
          >
            Guardar Reserva
          </button>
        </footer>
      </div>
    </div>
  );
};
