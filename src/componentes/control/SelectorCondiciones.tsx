import React, { useState } from "react";
import { usarAlmacenDM } from "../../almacen/usarAlmacenDM";
import { CONDICIONES_2024 } from "../../utiles/datosIniciales";
import estilosClases from "./SelectorCondiciones.module.css";

export const SelectorCondiciones: React.FC = () => {
  const colaIniciativa = usarAlmacenDM((s) => s.colaIniciativa);
  const indiceTurnoActivo = usarAlmacenDM((s) => s.indiceTurnoActivo);
  const agregarCondicionACriatura = usarAlmacenDM((s) => s.agregarCondicionACriatura);

  const [busquedaCondicion, setBusquedaCondicion] = useState("");
  const [mostrarSugerenciasCond, setMostrarSugerenciasCond] = useState(false);
  const [destinatarioId, setDestinatarioId] = useState("");
  const [dropdownDestinatarioAbierto, setDropdownDestinatarioAbierto] = useState(false);

  const condicionesFiltradas = CONDICIONES_2024.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busquedaCondicion.toLowerCase()) ||
      c.nombre.split(" (")[0].toLowerCase().includes(busquedaCondicion.toLowerCase())
  );

  const manejarAñadirCondicionASeleccionada = (nombreCond: string) => {
    if (colaIniciativa.length === 0 || !nombreCond) return;
    const idDestino = destinatarioId || (colaIniciativa[indiceTurnoActivo] && colaIniciativa[indiceTurnoActivo].id);
    if (!idDestino) return;
    agregarCondicionACriatura(idDestino, nombreCond);
    setBusquedaCondicion("");
    setMostrarSugerenciasCond(false);
  };

  return (
    <div className={estilosClases.bloqueCondiciones} style={{ position: "relative", width: "370px", overflow: "visible" }}>
      {/* Selector de Destinatario */}
      <div style={{ position: "relative", display: "inline-block", alignSelf: "center" }}>
        <button
          onClick={() => setDropdownDestinatarioAbierto(!dropdownDestinatarioAbierto)}
          className={estilosClases.botonDestinatario}
          title="Destinatario de la condición"
        >
          <span>
            {destinatarioId
              ? ` ${
                  colaIniciativa.find((c) => c.id === destinatarioId)?.nombre.substring(0, 18) || "Alguien"
                }...`
              : " [ACTIVO]"}
          </span>
          <span style={{ fontSize: "8px", marginLeft: "2px" }}>▼</span>
        </button>

        {dropdownDestinatarioAbierto && (
          <div className={estilosClases.dropdownDestinatarios}>
            <div
              onClick={() => {
                setDestinatarioId("");
                setDropdownDestinatarioAbierto(false);
              }}
              className={estilosClases.dropdownItemActivo}
            >
              👤 [ACTIVO] (TURNO CORRIENTE)
            </div>
            {colaIniciativa.map((cri) => (
              <div
                key={cri.id}
                onClick={() => {
                  setDestinatarioId(cri.id);
                  setDropdownDestinatarioAbierto(false);
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

      {/* Input de Búsqueda de Condición */}
      <div style={{ position: "relative", flexGrow: 1, display: "flex", flexDirection: "column", alignSelf: "center" }}>
        <input
          type="text"
          value={busquedaCondicion}
          onChange={(e) => {
            setBusquedaCondicion(e.target.value);
            setMostrarSugerenciasCond(true);
          }}
          onFocus={() => setMostrarSugerenciasCond(true)}
          onBlur={() => setTimeout(() => setMostrarSugerenciasCond(false), 250)}
          placeholder="🔍 CONDICIÓN..."
          className={estilosClases.inputBrutal}
        />

        {/* Lista de Sugerencias Flotantes */}
        {mostrarSugerenciasCond && busquedaCondicion.trim() !== "" && (
          <div className={estilosClases.sugerenciasContenedor}>
            {condicionesFiltradas.length > 0 ? (
              condicionesFiltradas.map((cond) => {
                const nombreLimpio = cond.nombre.split(" (")[0];
                return (
                  <div
                    key={cond.nombre}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Evita que pierda el focus antes del click
                    }}
                    onClick={() => {
                      manejarAñadirCondicionASeleccionada(nombreLimpio);
                    }}
                    className={estilosClases.sugerenciaItem}
                  >
                    {nombreLimpio}
                  </div>
                );
              })
            ) : (
              <div className={estilosClases.sugerenciaVacio}>
                Sin coincidencias.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón Añadir */}
      <button
        onClick={() => {
          if (busquedaCondicion.trim() !== "") {
            const primeraCoincidencia = condicionesFiltradas[0];
            const condElegida = primeraCoincidencia ? primeraCoincidencia.nombre.split(" (")[0] : busquedaCondicion;
            manejarAñadirCondicionASeleccionada(condElegida);
          }
        }}
        className={estilosClases.botonAñadirCondicion}
        title="Añadir condición"
      >
        +
      </button>
    </div>
  );
};
