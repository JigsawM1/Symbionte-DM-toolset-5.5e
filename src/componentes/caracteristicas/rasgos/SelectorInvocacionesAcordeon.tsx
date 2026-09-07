import React, { useState, useMemo } from "react";
import type { SelectorRasgo } from "@/tipos/rasgos";
import {
  Lock,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Search
} from "lucide-react";
import { TextoEnriquecidoDND } from "@/componentes/comunes";
import estilos from "./SelectorInvocacionesAcordeon.module.css";

interface SelectorInvocacionesAcordeonProps {
  selector: SelectorRasgo;
  nivelPersonaje?: number;
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
}

export const SelectorInvocacionesAcordeon: React.FC<SelectorInvocacionesAcordeonProps> = ({
  selector,
  nivelPersonaje = 1,
  alActualizarSeleccion
}) => {
  const seleccionados = selector.valorActual || [];
  const max = selector.maxSelecciones || 1;

  // Estado local para elementos expandidos
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<"todas" | "disponibles" | "aprendidas">("todas");

  const alternarExpandido = (id: string) => {
    setExpandidos((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const manejarAlternarInvocacion = (id: string, estaActiva: boolean, bloqueada: boolean) => {
    if (!alActualizarSeleccion || (bloqueada && !estaActiva)) return;

    if (estaActiva) {
      // Quitar invocación
      const nuevas = seleccionados.filter((opId) => opId !== id);
      alActualizarSeleccion(selector.id, nuevas);
    } else {
      // Agregar invocación
      if (seleccionados.length < max) {
        alActualizarSeleccion(selector.id, [...seleccionados, id]);
      } else {
        // Si supera el máximo en selección múltiple, reemplaza la primera
        const nuevas = [...seleccionados.slice(1), id];
        alActualizarSeleccion(selector.id, nuevas);
      }
    }
  };

  // Filtrado y ordenación
  const opcionesProcesadas = useMemo(() => {
    return selector.opciones.filter((op) => {
      const coincideBusqueda =
        busqueda.trim() === "" ||
        op.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (op.descripcion || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (op.requisito || "").toLowerCase().includes(busqueda.toLowerCase());

      if (!coincideBusqueda) return false;

      const estaActiva = seleccionados.includes(op.id);
      const cumpleNivel = op.nivelMinimo === undefined || nivelPersonaje >= op.nivelMinimo;
      const cumpleInvocacionPrevia = !op.requisitoInvocacion || seleccionados.includes(op.requisitoInvocacion);
      const bloqueada = !estaActiva && (!cumpleNivel || !cumpleInvocacionPrevia);

      if (filtroEstado === "aprendidas") return estaActiva;
      if (filtroEstado === "disponibles") return !bloqueada && !estaActiva;
      return true;
    });
  }, [selector.opciones, busqueda, filtroEstado, seleccionados, nivelPersonaje]);

  return (
    <div className={estilos.contenedorAcordeonInvocaciones}>
      {/* Barra de herramientas con buscador y filtros */}
      <div className={estilos.barraHerramientasInvocaciones}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            className={estilos.inputBuscadorInvocaciones}
            placeholder="Buscar invocación o requisito..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className={estilos.filtrosEstadoInvocaciones}>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "todas" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("todas")}
          >
            Todas ({selector.opciones.length})
          </button>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "disponibles" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("disponibles")}
          >
            Disponibles
          </button>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "aprendidas" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("aprendidas")}
          >
            Aprendidas ({seleccionados.length}/{max})
          </button>
        </div>
      </div>

      {/* Lista de cajas colapsables */}
      <div className={estilos.listaCajasInvocaciones}>
        {opcionesProcesadas.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            No se encontraron invocaciones con los criterios de búsqueda actuales.
          </div>
        ) : (
          opcionesProcesadas.map((op) => {
            const estaActiva = seleccionados.includes(op.id);
            const estaExpandida = !!expandidos[op.id];

            const cumpleNivel = op.nivelMinimo === undefined || nivelPersonaje >= op.nivelMinimo;
            const cumpleInvocacionPrevia = !op.requisitoInvocacion || seleccionados.includes(op.requisitoInvocacion);
            const bloqueada = !estaActiva && (!cumpleNivel || !cumpleInvocacionPrevia);

            let textoMotivoBloqueo = "";
            if (!cumpleNivel) {
              textoMotivoBloqueo = `Requiere Brujo de nivel ${op.nivelMinimo} (actual: nivel ${nivelPersonaje})`;
            } else if (!cumpleInvocacionPrevia) {
              const reqNombre = selector.opciones.find((o) => o.id === op.requisitoInvocacion)?.nombre || op.requisitoInvocacion;
              textoMotivoBloqueo = `Requiere haber aprendido la invocación previa: "${reqNombre}"`;
            }

            return (
              <div
                key={op.id}
                className={`${estilos.tarjetaInvocacionCaja} ${estaActiva ? estilos.tarjetaInvocacionCajaActiva : ""} ${bloqueada ? estilos.tarjetaInvocacionCajaBloqueada : ""}`}
              >
                {/* Cabecera Colapsable */}
                <div
                  className={estilos.cabeceraInvocacionCaja}
                  onClick={() => alternarExpandido(op.id)}
                >
                  <div className={estilos.infoIzquierdaCabecera}>
                    <span className={estilos.iconoChevron}>
                      {estaExpandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>

                    <span className={estilos.tituloInvocacion}>{op.nombre}</span>

                    <div className={estilos.badgesCabecera}>
                      {op.nivelMinimo && op.nivelMinimo > 1 && (
                        <span className={estilos.badgeNivel}>Nivel {op.nivelMinimo}+</span>
                      )}

                      {estaActiva ? (
                        <span className={estilos.badgeAprendida}>
                          <Check size={11} /> Aprendida
                        </span>
                      ) : bloqueada ? (
                        <span className={estilos.badgeBloqueada}>
                          <Lock size={11} /> Bloqueada
                        </span>
                      ) : null}

                      {op.repetible && (
                        <span className={estilos.badgeRepetible}>Repetible</span>
                      )}
                    </div>
                  </div>

                  {/* Acciones Rápidas en la Cabecera */}
                  <div
                    className={estilos.accionesDerechaCabecera}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {estaActiva ? (
                      <button
                        type="button"
                        className={estilos.botonAccionQuitar}
                        onClick={() => manejarAlternarInvocacion(op.id, true, false)}
                        title="Quitar esta invocación"
                      >
                        <Trash2 size={12} />
                        <span>Quitar</span>
                      </button>
                    ) : bloqueada ? (
                      <button
                        type="button"
                        className={estilos.botonAccionBloqueado}
                        disabled
                        title={textoMotivoBloqueo}
                      >
                        <Lock size={12} />
                        <span>Bloqueada</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={estilos.botonAccionAgregar}
                        onClick={() => manejarAlternarInvocacion(op.id, false, false)}
                        title="Agregar esta invocación"
                      >
                        <Plus size={12} />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cuerpo Expandido */}
                {estaExpandida && (
                  <div className={estilos.cuerpoInvocacionCaja}>
                    {/* Indicador de Requisitos */}
                    {op.requisito && (
                      <div className={bloqueada ? estilos.alertaRequisito : estilos.alertaRequisitoCumplido}>
                        {bloqueada ? (
                          <>
                            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <strong>Requisitos pendientes:</strong> {textoMotivoBloqueo}
                            </div>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <strong>Requisitos cumplidos:</strong> {op.requisito}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Descripción Completa Enriquecida */}
                    <div className={estilos.textoDescripcionInvocacion}>
                      <TextoEnriquecidoDND texto={op.descripcion || op.nombre} />
                    </div>

                    {/* Efectos Mecánicos Estructurados */}
                    {Array.isArray(op.efectos) && op.efectos.length > 0 && (
                      <div className={estilos.seccionEfectosInvocacion}>
                        <span className={estilos.tituloEfectosInvocacion}>
                          <Sparkles size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                          Efectos y Mecánicas Activas:
                        </span>
                        {op.efectos.map((ef, efIdx) => (
                          <span key={efIdx} className={estilos.itemEfectoInvocacion}>
                            • {ef.descripcion || `${ef.tipo}: ${ef.objetivo} (${ef.valor})`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pie de Acción Expandida */}
                    <div className={estilos.pieAccionExpandida}>
                      {estaActiva ? (
                        <button
                          type="button"
                          className={estilos.botonAccionQuitar}
                          onClick={() => manejarAlternarInvocacion(op.id, true, false)}
                        >
                          <Trash2 size={13} />
                          <span>Quitar de Invocaciones Aprendidas</span>
                        </button>
                      ) : bloqueada ? (
                        <button
                          type="button"
                          className={estilos.botonAccionBloqueado}
                          disabled
                        >
                          <Lock size={13} />
                          <span>{textoMotivoBloqueo}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={estilos.botonAccionAgregar}
                          onClick={() => manejarAlternarInvocacion(op.id, false, false)}
                        >
                          <Plus size={13} />
                          <span>Agregar Invocación ({seleccionados.length + 1}/{max})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
