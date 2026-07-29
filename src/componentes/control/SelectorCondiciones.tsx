import React, { useState } from "react";
import { usarAlmacenDM, normalizarTexto } from "../../almacen/usarAlmacenDM";
import { CONDICIONES_2024, EFECTOS_PREDEFINIDOS } from "../../utiles/datosIniciales";
import estilosClases from "./SelectorCondiciones.module.css";

interface ElementoEstadoCombate {
  nombre: string;
  tipo: "condicion" | "efecto";
  duracion?: number;
  esConcentracion?: boolean;
}

export const SelectorCondiciones: React.FC = () => {
  const colaIniciativa = usarAlmacenDM((s) => s.colaIniciativa);
  const indiceTurnoActivo = usarAlmacenDM((s) => s.indiceTurnoActivo);
  const criaturasSeleccionadas = usarAlmacenDM((s) => s.criaturasSeleccionadas);

  const aplicarDañoEnArea = usarAlmacenDM((s) => s.aplicarDañoEnArea);
  const aplicarCondicionEnArea = usarAlmacenDM((s) => s.aplicarCondicionEnArea);
  const aplicarEfectoEnArea = usarAlmacenDM((s) => s.aplicarEfectoEnArea);

  const [cantidadDaño, setCantidadDaño] = useState("");
  const [busquedaEstado, setBusquedaEstado] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [targetModo, setTargetModo] = useState<string>("AUTO");
  const [dropdownTargetAbierto, setDropdownTargetAbierto] = useState(false);

  // Criaturas de TaleSpire seleccionadas que coinciden en la cola de iniciativa
  const seleccionadasEnCola = (criaturasSeleccionadas || []).filter((s) =>
    colaIniciativa.some((c) => c.id === s.id)
  );
  const numSeleccionadas = seleccionadasEnCola.length;

  // Determinar los IDs de las criaturas objetivo
  const resolverIdsObjetivo = (): string[] | undefined => {
    if (targetModo === "AUTO") {
      if (numSeleccionadas > 0) {
        return seleccionadasEnCola.map((s) => s.id);
      }
      const act = colaIniciativa[indiceTurnoActivo];
      return act ? [act.id] : undefined;
    }
    if (targetModo === "SELECCION") {
      return seleccionadasEnCola.map((s) => s.id);
    }
    if (targetModo === "ACTIVO") {
      const act = colaIniciativa[indiceTurnoActivo];
      return act ? [act.id] : undefined;
    }
    return [targetModo];
  };

  // Etiqueta para el botón de objetivo
  const obtenerEtiquetaTarget = (): string => {
    if (targetModo === "AUTO") {
      return numSeleccionadas > 0 ? `SELECCIÓN (${numSeleccionadas})` : "[ACTIVO]";
    }
    if (targetModo === "SELECCION") {
      return `SELECCIÓN (${numSeleccionadas})`;
    }
    if (targetModo === "ACTIVO") {
      return "[ACTIVO]";
    }
    const cri = colaIniciativa.find((c) => c.id === targetModo);
    return cri ? (cri.nombre.length > 13 ? cri.nombre.substring(0, 13) + "..." : cri.nombre) : "[ACTIVO]";
  };

  // Daño y Curación en Área
  const manejarAplicarDaño = (esCuracion: boolean) => {
    const val = parseInt(cantidadDaño, 10);
    if (isNaN(val) || val <= 0) return;
    const finalCantidad = esCuracion ? -val : val;
    aplicarDañoEnArea(finalCantidad, resolverIdsObjetivo());
    setCantidadDaño("");
  };

  // Lista combinada de Condiciones y Efectos
  const listaCombinadaEstados: ElementoEstadoCombate[] = [
    ...CONDICIONES_2024.map((c) => ({
      nombre: c.nombre.split(" (")[0],
      tipo: "condicion" as const
    })),
    ...EFECTOS_PREDEFINIDOS.map((e) => ({
      nombre: e.nombre,
      tipo: "efecto" as const,
      duracion: e.duracionEstandar,
      esConcentracion: e.esConcentracion
    }))
  ];

  const queryNorm = normalizarTexto(busquedaEstado);
  const sugerenciasFiltradas = listaCombinadaEstados.filter((item) =>
    normalizarTexto(item.nombre).includes(queryNorm)
  );

  const manejarAplicarEstado = (item: ElementoEstadoCombate) => {
    const targets = resolverIdsObjetivo();
    if (item.tipo === "condicion") {
      aplicarCondicionEnArea(item.nombre, targets);
    } else {
      aplicarEfectoEnArea(
        item.nombre,
        item.duracion || 10,
        { concentracion: item.esConcentracion },
        targets
      );
    }
    setBusquedaEstado("");
    setMostrarSugerencias(false);
  };

  return (
    <div className={estilosClases.bloqueCondiciones}>
      {/* 1. Selector de Target (Selección TaleSpire / Activo / Específica) */}
      <div className={estilosClases.contenedorTarget}>
        <button
          onClick={() => setDropdownTargetAbierto(!dropdownTargetAbierto)}
          className={`${estilosClases.botonDestinatario} ${
            numSeleccionadas > 0 && targetModo !== "ACTIVO" ? estilosClases.botonDestinatarioSeleccion : ""
          }`}
          title="Objetivo del daño / condición / efecto"
        >
          <span>{obtenerEtiquetaTarget()}</span>
          <span style={{ fontSize: "8px", marginLeft: "3px" }}>▼</span>
        </button>

        {dropdownTargetAbierto && (
          <div className={estilosClases.dropdownDestinatarios}>
            <div
              onClick={() => {
                setTargetModo("AUTO");
                setDropdownTargetAbierto(false);
              }}
              className={estilosClases.dropdownItemActivo}
            >
              AUTO ({numSeleccionadas > 0 ? `SELECCIÓN ${numSeleccionadas}` : "ACTIVO"})
            </div>
            {numSeleccionadas > 0 && (
              <div
                onClick={() => {
                  setTargetModo("SELECCION");
                  setDropdownTargetAbierto(false);
                }}
                className={estilosClases.dropdownItemSeleccion}
              >
                SELECCIÓN TALESPIRE ({numSeleccionadas})
              </div>
            )}
            <div
              onClick={() => {
                setTargetModo("ACTIVO");
                setDropdownTargetAbierto(false);
              }}
              className={estilosClases.dropdownItemActivo}
            >
              TURNO ACTIVO
            </div>
            {colaIniciativa.map((cri) => (
              <div
                key={cri.id}
                onClick={() => {
                  setTargetModo(cri.id);
                  setDropdownTargetAbierto(false);
                }}
                className={`${estilosClases.dropdownItemCriatura} ${
                  cri.esMonstruo ? estilosClases.dropdownItemCriaturaMonstruo : estilosClases.dropdownItemCriaturaPJ
                }`}
              >
                <span>{cri.nombre.length > 12 ? cri.nombre.substring(0, 12) + "..." : cri.nombre}</span>
                <span style={{ fontSize: "8px", opacity: 0.6 }}>
                  {cri.esMonstruo ? "MON" : "PJ"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Sección de Daño / Curación Rápida */}
      <div className={estilosClases.seccionDaño}>
        <input
          type="number"
          min="1"
          value={cantidadDaño}
          onChange={(e) => setCantidadDaño(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && manejarAplicarDaño(false)}
          placeholder="CANT..."
          className={estilosClases.inputDaño}
        />
        <button
          onClick={() => manejarAplicarDaño(false)}
          className={estilosClases.botonDaño}
          title="Aplicar daño al objetivo"
        >
          - DAÑO
        </button>
        <button
          onClick={() => manejarAplicarDaño(true)}
          className={estilosClases.botonCurar}
          title="Aplicar curación al objetivo"
        >
          + CURAR
        </button>
      </div>

      {/* 3. Búsqueda y Aplicación de Condiciones / Efectos */}
      <div className={estilosClases.seccionEstado}>
        <input
          type="text"
          value={busquedaEstado}
          onChange={(e) => {
            setBusquedaEstado(e.target.value);
            setMostrarSugerencias(true);
          }}
          onFocus={() => setMostrarSugerencias(true)}
          onBlur={() => setTimeout(() => setMostrarSugerencias(false), 250)}
          placeholder="CONDICIÓN / EFECTO..."
          className={estilosClases.inputBrutal}
        />

        {mostrarSugerencias && busquedaEstado.trim() !== "" && (
          <div className={estilosClases.sugerenciasContenedor}>
            {sugerenciasFiltradas.length > 0 ? (
              sugerenciasFiltradas.map((item) => (
                <div
                  key={`${item.tipo}-${item.nombre}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => manejarAplicarEstado(item)}
                  className={estilosClases.sugerenciaItem}
                >
                  <span className={estilosClases.sugerenciaNombre}>{item.nombre}</span>
                  <span
                    className={`${estilosClases.badgeTipo} ${
                      item.tipo === "condicion" ? estilosClases.badgeCondicion : estilosClases.badgeEfecto
                    }`}
                  >
                    {item.tipo === "condicion" ? "CONDICIÓN" : "EFECTO"}
                  </span>
                </div>
              ))
            ) : (
              <div className={estilosClases.sugerenciaVacio}>Sin coincidencias</div>
            )}
          </div>
        )}

        <button
          onClick={() => {
            if (busquedaEstado.trim() !== "") {
              const primera = sugerenciasFiltradas[0];
              if (primera) {
                manejarAplicarEstado(primera);
              } else {
                aplicarCondicionEnArea(busquedaEstado.trim(), resolverIdsObjetivo());
                setBusquedaEstado("");
              }
            }
          }}
          className={estilosClases.botonAñadirEstado}
          title="Añadir condición o efecto"
        >
          +
        </button>
      </div>
    </div>
  );
};
