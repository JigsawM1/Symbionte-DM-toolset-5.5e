import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { SelectorRasgo, OpcionSelector } from "@/tipos/rasgos";
import {
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { ControlPaginacion, TextoEnriquecidoDND } from "@/componentes/comunes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { evaluarRequisitoDote } from "@/servicios/evaluadorRequisitosDotes";
import estilos from "./SelectorDotesAcordeon.module.css";

export const ELEMENTOS_POR_PAGINA_DOTES = 5;

interface SelectorDotesAcordeonProps {
  selector: SelectorRasgo;
  nivelPersonaje?: number;
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
  elementosPorPagina?: number;
}

function normalizar(texto: string = ""): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function resolverClaseCategoria(id: string, requisito: string = ""): {
  etiqueta: string;
  claseCss: string;
} {
  const normId = normalizar(id);
  const normReq = normalizar(requisito);
  if (normId.startsWith("dote_don_") || normReq.includes("nivel 19")) {
    return { etiqueta: "Don épico", claseCss: estilos.badgeCategoriaEpica };
  }
  if (normId.includes("estilo_combate") || normReq.includes("estilo de combate")) {
    return { etiqueta: "Estilo", claseCss: estilos.badgeCategoriaEstilo };
  }
  if (
    normId.includes("origen") ||
    normId === "dote_alerta" ||
    normId === "dote_iniciado_magia" ||
    normId === "dote_afortunado" ||
    normId === "dote_musico"
  ) {
    return { etiqueta: "Origen", claseCss: estilos.badgeCategoriaOrigen };
  }
  return { etiqueta: "General", claseCss: estilos.badgeCategoriaGeneral };
}

export const SelectorDotesAcordeon: React.FC<SelectorDotesAcordeonProps> = ({
  selector,
  nivelPersonaje,
  alActualizarSeleccion,
  elementosPorPagina = ELEMENTOS_POR_PAGINA_DOTES
}) => {
  const seleccionados = useMemo(() => selector.valorActual || [], [selector.valorActual]);

  const personajeActivo = usarAlmacenDM(
    useCallback((s) => s.personajes.find((p) => p.id === s.idPersonajeActivo) || s.personajes[0] || null, [])
  );

  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<"disponibles" | "elegida" | "todas">("disponibles");
  const [paginaActual, setPaginaActual] = useState<number>(1);

  const alternarExpandido = (id: string) => {
    setExpandidos((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const opcionesEvaluadas = useMemo(() => {
    return selector.opciones.map((op) => {
      const res = evaluarRequisitoDote(op.requisito, personajeActivo, nivelPersonaje);
      const estaActiva = seleccionados.includes(op.id);
      return {
        ...op,
        cumpleRequisitos: res.cumple,
        motivoBloqueo: res.motivo,
        estaActiva
      };
    });
  }, [selector.opciones, personajeActivo, nivelPersonaje, seleccionados]);

  const totalDisponibles = useMemo(() => {
    return opcionesEvaluadas.filter((o) => o.cumpleRequisitos).length;
  }, [opcionesEvaluadas]);

  const totalElegidas = useMemo(() => {
    return opcionesEvaluadas.filter((o) => o.estaActiva).length;
  }, [opcionesEvaluadas]);

  const opcionesFiltradas = useMemo(() => {
    const texto = normalizar(busqueda);
    return opcionesEvaluadas.filter((op) => {
      // Filtro de búsqueda
      if (texto) {
        const coincide =
          normalizar(op.nombre).includes(texto) ||
          normalizar(op.descripcion).includes(texto) ||
          normalizar(op.requisito || "").includes(texto);
        if (!coincide) return false;
      }

      // Filtro de estado
      if (filtroEstado === "disponibles") {
        return op.cumpleRequisitos || op.estaActiva;
      }
      if (filtroEstado === "elegida") {
        return op.estaActiva;
      }
      return true;
    });
  }, [opcionesEvaluadas, busqueda, filtroEstado]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(opcionesFiltradas.length / elementosPorPagina));

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const opcionesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return opcionesFiltradas.slice(inicio, inicio + elementosPorPagina);
  }, [opcionesFiltradas, paginaActual, elementosPorPagina]);

  const manejarSeleccionarDote = (opcion: OpcionSelector, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!alActualizarSeleccion) return;
    alActualizarSeleccion(selector.id, [opcion.id]);
  };

  return (
    <div className={estilos.contenedorAcordeonDotes}>
      {/* Barra de herramientas: Buscador y Filtros */}
      <div className={estilos.barraHerramientasDotes}>
        <div className={estilos.contenedorBuscador}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            className={estilos.inputBuscadorDotes}
            placeholder="Buscar por nombre, requisito o efecto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className={estilos.filtrosEstadoDotes}>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "disponibles" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("disponibles")}
            title="Mostrar únicamente dotes cuyos requisitos cumples"
          >
            Disponibles ({totalDisponibles})
          </button>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "elegida" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("elegida")}
            title="Mostrar la dote actualmente elegida"
          >
            Elegida ({totalElegidas})
          </button>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "todas" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("todas")}
            title="Ver catálogo completo de dotes oficiales"
          >
            Todas ({selector.opciones.length})
          </button>
        </div>
      </div>

      {/* Lista de cajas colapsables */}
      <div className={estilos.listaCajasDotes}>
        {opcionesFiltradas.length === 0 ? (
          <div className={estilos.mensajeVacio}>
            No se encontraron dotes que cumplan con los filtros de búsqueda actuales.
          </div>
        ) : (
          opcionesPaginadas.map((op) => {
            const estaExpandida = Boolean(expandidos[op.id]);
            const bloqueada = !op.cumpleRequisitos && !op.estaActiva;
            const catInfo = resolverClaseCategoria(op.id, op.requisito);

            return (
              <div
                key={op.id}
                className={`${estilos.tarjetaDoteCaja} ${op.estaActiva ? estilos.tarjetaDoteCajaActiva : ""} ${bloqueada ? estilos.tarjetaDoteCajaBloqueada : ""}`}
              >
                {/* Cabecera Colapsable */}
                <div
                  className={estilos.cabeceraDoteCaja}
                  onClick={() => alternarExpandido(op.id)}
                >
                  <div className={estilos.infoIzquierdaCabecera}>
                    <div className={estilos.iconoChevron}>
                      {estaExpandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    <span className={estilos.tituloDote}>{op.nombre}</span>

                    <div className={estilos.badgesCabecera}>
                      <span className={`${estilos.badgeCategoria} ${catInfo.claseCss}`}>
                        {catInfo.etiqueta}
                      </span>
                      {op.requisito && (
                        <span className={estilos.badgeRequisito} title={op.requisito}>
                          {op.requisito}
                        </span>
                      )}
                      {op.estaActiva && (
                        <span className={estilos.badgeElegida}>
                          <Check size={11} />
                          Elegida
                        </span>
                      )}
                      {bloqueada && (
                        <span className={estilos.badgeBloqueada} title={op.motivoBloqueo}>
                          <Lock size={10} />
                          Bloqueada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de selección rápida */}
                  <div className={estilos.zonaDerechaCabecera}>
                    <button
                      type="button"
                      disabled={bloqueada || op.estaActiva}
                      className={`${estilos.botonSeleccionarDote} ${op.estaActiva ? estilos.botonSeleccionarDoteActivo : ""} ${bloqueada ? estilos.botonSeleccionarDoteBloqueado : ""}`}
                      onClick={(e) => manejarSeleccionarDote(op, e)}
                    >
                      {op.estaActiva ? (
                        <>
                          <Check size={12} />
                          Seleccionada
                        </>
                      ) : bloqueada ? (
                        <>
                          <Lock size={12} />
                          No elegible
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Elegir dote
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cuerpo Expandido */}
                {estaExpandida && (
                  <div className={estilos.cuerpoDoteExpandido}>
                    {bloqueada && op.motivoBloqueo && (
                      <div className={estilos.alertaRequisitosBloqueados}>
                        <AlertCircle size={14} flex-shrink={0} />
                        <span><strong>Requisito no cumplido:</strong> {op.motivoBloqueo}</span>
                      </div>
                    )}

                    <div className={estilos.descripcionDote}>
                      <TextoEnriquecidoDND texto={op.descripcion} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {opcionesFiltradas.length > elementosPorPagina && (
        <ControlPaginacion
          paginaActual={paginaActual}
          totalElementos={opcionesFiltradas.length}
          elementosPorPagina={elementosPorPagina}
          alCambiarPagina={setPaginaActual}
          tamano="compacto"
          etiquetaElementos="dotes"
        />
      )}
    </div>
  );
};
