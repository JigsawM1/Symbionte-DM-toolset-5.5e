import React, { useState } from "react";
import { usarAlmacenDM } from "../../almacen/usarAlmacenDM";
import { Save, FolderOpen } from "lucide-react";
import estilosClases from "./MenuEncuentros.module.css";

export const MenuEncuentros: React.FC = () => {
  const colaIniciativa = usarAlmacenDM((s) => s.colaIniciativa);
  const encuentrosGuardados = usarAlmacenDM((s) => s.encuentrosGuardados);
  const guardarEncuentroActual = usarAlmacenDM((s) => s.guardarEncuentroActual);
  const cargarEncuentro = usarAlmacenDM((s) => s.cargarEncuentro);
  const eliminarEncuentroGuardado = usarAlmacenDM((s) => s.eliminarEncuentroGuardado);

  const [nombreEncuentroNuevo, setNombreEncuentroNuevo] = useState("");
  const [mostrarMenuGuardar, setMostrarMenuGuardar] = useState(false);
  const [mostrarMenuCargar, setMostrarMenuCargar] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [exitoGuardar, setExitoGuardar] = useState("");

  const ejecutarGuardarEncuentro = () => {
    if (!nombreEncuentroNuevo.trim()) {
      setErrorGuardar("El nombre es requerido.");
      return;
    }
    const exito = guardarEncuentroActual(nombreEncuentroNuevo);
    if (exito) {
      setExitoGuardar("Encuentro guardado!");
      setErrorGuardar("");
      setTimeout(() => {
        setMostrarMenuGuardar(false);
        setNombreEncuentroNuevo("");
        setExitoGuardar("");
      }, 1000);
    } else {
      setErrorGuardar("No se pudo guardar el encuentro.");
    }
  };

  const manejarSeleccionarEncuentroACargar = (nombre: string) => {
    const exito = cargarEncuentro(nombre);
    if (exito) {
      setMostrarMenuCargar(false);
    }
  };

  return (
    <div className={estilosClases.grupoGuardar}>
      {/* Botón Guardar */}
      <div style={{ position: "relative" }}>
        <button 
          onClick={() => {
            setMostrarMenuGuardar(!mostrarMenuGuardar);
            setMostrarMenuCargar(false);
            setErrorGuardar("");
            setExitoGuardar("");
            const fecha = new Date();
            const fechaStr = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
            const horaStr = `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
            setNombreEncuentroNuevo(`Encuentro ${fechaStr} - ${horaStr}`);
          }} 
          className={`${estilosClases.botonIcono} ${
            mostrarMenuGuardar ? estilosClases.botonActivo : ""
          }`}
          title="Guardar Encuentro"
        >
          <Save size={14} />
          <span>Guardar</span>
        </button>

        {mostrarMenuGuardar && (
          <div className={estilosClases.menuDesplegable} style={{ width: "230px", left: 0 }}>
            <div className={estilosClases.cabeceraDesplegable}>GUARDAR ENCUENTRO ACTUAL</div>
            {colaIniciativa.length === 0 ? (
              <div className={estilosClases.itemVacioAlerta}>
                La iniciativa está vacía. Añade criaturas antes de guardar.
              </div>
            ) : (
              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <input
                  type="text"
                  value={nombreEncuentroNuevo}
                  onChange={(e) => {
                    setNombreEncuentroNuevo(e.target.value);
                    setErrorGuardar("");
                    setExitoGuardar("");
                  }}
                  placeholder="Nombre del encuentro..."
                  className={estilosClases.inputMenuGuardar}
                  onKeyDown={(e) => e.key === "Enter" && ejecutarGuardarEncuentro()}
                />
                {errorGuardar && (
                  <div className={estilosClases.textoError}>{errorGuardar}</div>
                )}
                {exitoGuardar && (
                  <div className={estilosClases.textoExito}>{exitoGuardar}</div>
                )}
                <button
                  onClick={ejecutarGuardarEncuentro}
                  className={estilosClases.botonConfirmarGuardar}
                >
                  Confirmar Guardar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón Cargar */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            setMostrarMenuCargar(!mostrarMenuCargar);
            setMostrarMenuGuardar(false);
          }}
          className={`${estilosClases.botonIcono} ${
            mostrarMenuCargar ? estilosClases.botonActivo : ""
          }`}
          title="Cargar Encuentro"
        >
          <FolderOpen size={14} />
          <span>Cargar</span>
        </button>

        {mostrarMenuCargar && (
          <div className={estilosClases.menuDesplegable}>
            <div className={estilosClases.cabeceraDesplegable}>ENCUENTROS GUARDADOS</div>
            {encuentrosGuardados.length === 0 ? (
              <div className={estilosClases.itemVacio}>No hay encuentros.</div>
            ) : (
              encuentrosGuardados.map((e) => (
                <div key={e.nombre} className={estilosClases.itemDesplegable}>
                  <span
                    onClick={() => manejarSeleccionarEncuentroACargar(e.nombre)}
                    className={estilosClases.textoItemDesplegable}
                  >
                    {e.nombre} ({e.cola.length} criat.)
                  </span>
                  <button
                    onClick={() => eliminarEncuentroGuardado(e.nombre)}
                    className={estilosClases.botonEliminarItem}
                  >
                    X
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
