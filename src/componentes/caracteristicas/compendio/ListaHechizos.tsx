import React, { useState, useMemo } from "react";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import { usarEstadoHomebrew } from "@/almacen/selectores";
import { Search, Info } from "lucide-react";
import { FichaHechizo } from "./FichaHechizo";
import { SelectorDesplegable } from "@/componentes/comunes";
import estilosClases from "./ListaHechizos.module.css";

const OPCIONES_NIVEL_FILTRO = [
  { valor: "todos", etiqueta: "Todos los Niveles" },
  { valor: "0", etiqueta: "Nivel 0 (Truco)" },
  { valor: "1", etiqueta: "Nivel 1" },
  { valor: "2", etiqueta: "Nivel 2" },
  { valor: "3", etiqueta: "Nivel 3" },
  { valor: "4", etiqueta: "Nivel 4" },
  { valor: "5", etiqueta: "Nivel 5" },
  { valor: "6", etiqueta: "Nivel 6" },
  { valor: "7", etiqueta: "Nivel 7" },
  { valor: "8", etiqueta: "Nivel 8" },
  { valor: "9", etiqueta: "Nivel 9" }
];

export const ListaHechizos: React.FC = () => {
  const { baseDatosHechizos } = usarEstadoHomebrew();

  const [busqueda, setBusqueda] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState<number | "todos">("todos");
  const [escuelaFiltro, setEscuelaFiltro] = useState<string | "todas">("todas");
  const [idHechizoDetalle, setIdHechizoDetalle] = useState<string | null>(null);

  // Obtener escuelas de magia únicas para el filtro
  const escuelasDisponibles = useMemo(() => {
    const escuelas = new Set<string>();
    baseDatosHechizos.forEach((h) => {
      if (h.escuela) escuelas.add(h.escuela);
    });
    return Array.from(escuelas).sort();
  }, [baseDatosHechizos]);

  const opcionesEscuelaFiltro = useMemo(() => {
    return [
      { valor: "todas", etiqueta: "Todas las Escuelas" },
      ...escuelasDisponibles.map((e) => ({ valor: e, etiqueta: e }))
    ];
  }, [escuelasDisponibles]);

  // Filtrar hechizos
  const hechizosFiltrados = useMemo(() => {
    return baseDatosHechizos.filter((hechizo) => {
      const coincideTexto = coincideBusquedaTolerante(
        [hechizo.nombre, hechizo.descripcion, hechizo.escuela],
        busqueda
      );

      const coincideNivel =
        nivelFiltro === "todos" ? true : hechizo.nivel === nivelFiltro;

      const coincideEscuela =
        escuelaFiltro === "todas" ? true : hechizo.escuela === escuelaFiltro;

      return coincideTexto && coincideNivel && coincideEscuela;
    });
  }, [baseDatosHechizos, busqueda, nivelFiltro, escuelaFiltro]);

  const hechizoSeleccionado = useMemo(() => {
    return baseDatosHechizos.find((h) => h.id === idHechizoDetalle) || null;
  }, [baseDatosHechizos, idHechizoDetalle]);

  return (
    <div className={estilosClases.contenedor}>
      <h3 className={estilosClases.titulo}>
        <span>Compendio de Conjuros</span>
        <span className={estilosClases.contador}>
          Encontrados: {hechizosFiltrados.length}
        </span>
      </h3>

      {/* Barra de Filtros */}
      <div className={estilosClases.barraFiltros}>
        <div className={estilosClases.buscadorContenedor}>
          <Search size={12} className={estilosClases.iconoBuscador} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar conjuro por nombre, efecto..."
            className={estilosClases.buscadorInput}
          />
        </div>

        <div style={{ minWidth: "140px", flex: 1 }}>
          <SelectorDesplegable
            valor={String(nivelFiltro)}
            alCambiar={(val) => setNivelFiltro(val === "todos" ? "todos" : Number(val))}
            opciones={OPCIONES_NIVEL_FILTRO}
            tamano="compacto"
          />
        </div>

        <div style={{ minWidth: "150px", flex: 1 }}>
          <SelectorDesplegable
            valor={escuelaFiltro}
            alCambiar={(val) => setEscuelaFiltro(val)}
            opciones={opcionesEscuelaFiltro}
            tamano="compacto"
          />
        </div>
      </div>

      {/* Contenido Principal con lista densa */}
      <div className={estilosClases.listaContenedor}>
        {hechizosFiltrados.length === 0 ? (
          <div className={estilosClases.vacioTexto}>
            No se encontraron conjuros con los filtros aplicados.
          </div>
        ) : (
          hechizosFiltrados.map((hechizo) => {
            const esSeleccionado = idHechizoDetalle === hechizo.id;
            return (
              <div
                key={hechizo.id}
                className={`${estilosClases.tarjetaConjuro} ${
                  esSeleccionado ? estilosClases.tarjetaExpandida : ""
                }`}
              >
                {/* Cabecera del conjuro clickeable */}
                <div
                  onClick={() => {
                    setIdHechizoDetalle(hechizo.id);
                  }}
                  className={estilosClases.cabeceraConjuro}
                >
                  <span className={estilosClases.hechizoNivel}>
                    Niv {hechizo.nivel === 0 ? "0" : hechizo.nivel}
                  </span>
                  <span className={estilosClases.hechizoNombre}>{hechizo.nombre}</span>
                  <span className={estilosClases.hechizoEscuela}>{hechizo.escuela}</span>
                  <span className={estilosClases.indicadorExpansion}>
                    <Info size={11} style={{ marginRight: "3px", display: "inline", verticalAlign: "middle" }} />
                    Detalles
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Detalle Absoluto (Overlay) de Gran Formato */}
      {hechizoSeleccionado && (
        <div className={estilosClases.panelDetalleOverlay}>
          <FichaHechizo
            hechizo={hechizoSeleccionado}
            ocultarLanzamiento={true}
            onClose={() => setIdHechizoDetalle(null)}
          />
        </div>
      )}
    </div>
  );
};
