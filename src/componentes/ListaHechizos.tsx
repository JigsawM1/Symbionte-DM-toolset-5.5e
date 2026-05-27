import React, { useState, useMemo } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { Search, Info } from "lucide-react";
import { FichaHechizo } from "./hechizos/FichaHechizo";
import estilosClases from "./ListaHechizos.module.css";

export const ListaHechizos: React.FC = () => {
  const { baseDatosHechizos } = usarAlmacenDM();

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

  // Filtrar hechizos
  const hechizosFiltrados = useMemo(() => {
    return baseDatosHechizos.filter((hechizo) => {
      const coincideTexto =
        hechizo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        hechizo.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        hechizo.escuela.toLowerCase().includes(busqueda.toLowerCase());

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
        <span>Compendio de Conjuros (D&D 5.5e)</span>
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

        <select
          value={nivelFiltro}
          onChange={(e) => {
            const val = e.target.value;
            setNivelFiltro(val === "todos" ? "todos" : Number(val));
          }}
          className={estilosClases.selectorFiltro}
        >
          <option value="todos">Todos los Niveles</option>
          <option value="0">Nivel 0 (Truco)</option>
          <option value="1">Nivel 1</option>
          <option value="2">Nivel 2</option>
          <option value="3">Nivel 3</option>
          <option value="4">Nivel 4</option>
          <option value="5">Nivel 5</option>
          <option value="6">Nivel 6</option>
          <option value="7">Nivel 7</option>
          <option value="8">Nivel 8</option>
          <option value="9">Nivel 9</option>
        </select>

        <select
          value={escuelaFiltro}
          onChange={(e) => setEscuelaFiltro(e.target.value)}
          className={estilosClases.selectorFiltro}
        >
          <option value="todas">Todas las Escuelas</option>
          {escuelasDisponibles.map((escuela) => (
            <option key={escuela} value={escuela}>
              {escuela}
            </option>
          ))}
        </select>
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
            onClose={() => setIdHechizoDetalle(null)}
          />
        </div>
      )}
    </div>
  );
};
