import React, { useState } from "react";
import {
  usarEstadoConfiguracion,
  usarAccionesConfiguracion,
  usarEstadoHomebrew,
  usarAccionesHomebrew,
} from "@/almacen/selectores";
import {
  Menu,
  Play,
  Table,
  ListTodo,
  BookOpen,
  FileText,
  Settings,
  Plus,
  Edit2,
  Gamepad2
} from "lucide-react";
import estilosClases from "./BarraSuperior.module.css";

export const BarraSuperior: React.FC = () => {
  const { pestañaActiva, campañaNombre, esGM } = usarEstadoConfiguracion();
  const { establecerPestaña } = usarAccionesConfiguracion();
  const { modoHomebrew } = usarEstadoHomebrew();
  const { establecerModoHomebrew } = usarAccionesHomebrew();
  const [mostrarMenuHomebrew, setMostrarMenuHomebrew] = useState(false);

  return (
    <header className={estilosClases.cabecera}>
      {/* Fila Superior: Título y Configuración / Campaña */}
      <div className={estilosClases.filaSuperior}>
        <div className={estilosClases.tituloSeccion}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMostrarMenuHomebrew(!mostrarMenuHomebrew)}
              className={`${estilosClases.botonHamburguesa} ${
                pestañaActiva === "homebrew" ? estilosClases.botonActivo : ""
              }`}
              title="Opciones de Homebrew"
              type="button"
            >
              <Menu size={14} />
            </button>

            {mostrarMenuHomebrew && (
              <div className={estilosClases.menuHomebrewDesplegable}>
                <div className={estilosClases.cabeceraDesplegable}>Homebrew</div>
                <button
                  onClick={() => {
                    establecerPestaña("homebrew");
                    establecerModoHomebrew("crear");
                    setMostrarMenuHomebrew(false);
                  }}
                  className={`${estilosClases.itemMenuDesplegable} ${
                    pestañaActiva === "homebrew" && modoHomebrew === "crear" ? estilosClases.itemMenuActivo : ""
                  }`}
                  type="button"
                >
                  <Plus size={12} />
                  <span>Crear Nuevo</span>
                </button>
                <button
                  onClick={() => {
                    establecerPestaña("homebrew");
                    establecerModoHomebrew("lista");
                    setMostrarMenuHomebrew(false);
                  }}
                  className={`${estilosClases.itemMenuDesplegable} ${
                    pestañaActiva === "homebrew" && modoHomebrew === "lista" ? estilosClases.itemMenuActivo : ""
                  }`}
                  type="button"
                >
                  <Edit2 size={12} />
                  <span>Listado / Editar</span>
                </button>
              </div>
            )}
          </div>
          <span className={estilosClases.tituloTexto}>
            {!esGM ? "PLAYER SHEET" : "DM SCREEN"}
          </span>
        </div>

        <div className={estilosClases.zonaDerecha}>
          <span className={estilosClases.campañaTexto} title={campañaNombre}>
            {campañaNombre.length > 22 ? `${campañaNombre.substring(0, 19)}...` : campañaNombre}
          </span>
          <button
            onClick={() => establecerPestaña("configuracion")}
            className={`${estilosClases.botonConfiguracion} ${
              pestañaActiva === "configuracion" ? estilosClases.botonActivo : ""
            }`}
            title="Configuración e Importación JSON"
            type="button"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Fila Inferior: Pestañas adaptadas automáticamente al rol detectado */}
      <nav className={estilosClases.navPestañas}>
        {!esGM ? (
          <>
            <button
              onClick={() => establecerPestaña("jugadores")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "jugadores" || (pestañaActiva !== "compendio" && pestañaActiva !== "tablas" && pestañaActiva !== "notas" && pestañaActiva !== "iniciativa" && pestañaActiva !== "configuracion" && pestañaActiva !== "homebrew") ? estilosClases.pestanaActiva : ""
              }`}
              title="Panel Principal del Jugador"
              type="button"
            >
              <Gamepad2 size={13} />
              <span className={estilosClases.pestanaTexto}>Vista Jugador</span>
            </button>

            <button
              onClick={() => establecerPestaña("compendio")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "compendio" || pestañaActiva === "hechizos" ? estilosClases.pestanaActiva : ""
              }`}
              title="Compendio de Hechizos, Objetos y Equipo"
              type="button"
            >
              <BookOpen size={13} />
              <span className={estilosClases.pestanaTexto}>Compendio</span>
            </button>

            <button
              onClick={() => establecerPestaña("tablas")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "tablas" ? estilosClases.pestanaActiva : ""
              }`}
              title="Tablas de Referencia (Condiciones, Críticos, Reglas)"
              type="button"
            >
              <Table size={13} />
              <span className={estilosClases.pestanaTexto}>Tablas</span>
            </button>

            <button
              onClick={() => establecerPestaña("notas")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "notas" ? estilosClases.pestanaActiva : ""
              }`}
              title="Notas Personales del Jugador"
              type="button"
            >
              <FileText size={13} />
              <span className={estilosClases.pestanaTexto}>Notas</span>
            </button>

            <button
              onClick={() => establecerPestaña("iniciativa")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "iniciativa" ? estilosClases.pestanaActiva : ""
              }`}
              title="Tracker de Iniciativa y Combate"
              type="button"
            >
              <Play size={13} fill={pestañaActiva === "iniciativa" ? "currentColor" : "none"} />
              <span className={estilosClases.pestanaTexto}>Iniciativa</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => establecerPestaña("iniciativa")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "iniciativa" ? estilosClases.pestanaActiva : ""
              }`}
              title="Gestor de Iniciativa"
              type="button"
            >
              <Play size={13} fill={pestañaActiva === "iniciativa" ? "currentColor" : "none"} />
              <span className={estilosClases.pestanaTexto}>Iniciativa</span>
            </button>

            <button
              onClick={() => establecerPestaña("tablas")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "tablas" ? estilosClases.pestanaActiva : ""
              }`}
              title="Tablas del DM"
              type="button"
            >
              <Table size={13} />
              <span className={estilosClases.pestanaTexto}>Tablas DM</span>
            </button>

            <button
              onClick={() => establecerPestaña("pendientes")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "pendientes" ? estilosClases.pestanaActiva : ""
              }`}
              title="Lista de Tareas Pendientes"
              type="button"
            >
              <ListTodo size={13} />
              <span className={estilosClases.pestanaTexto}>Pendientes</span>
            </button>

            <button
              onClick={() => establecerPestaña("compendio")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "compendio" || pestañaActiva === "hechizos" ? estilosClases.pestanaActiva : ""
              }`}
              title="Compendio de Reglas"
              type="button"
            >
              <BookOpen size={13} />
              <span className={estilosClases.pestanaTexto}>Compendio</span>
            </button>

            <button
              onClick={() => establecerPestaña("notas")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "notas" ? estilosClases.pestanaActiva : ""
              }`}
              title="Notas del DM"
              type="button"
            >
              <FileText size={13} />
              <span className={estilosClases.pestanaTexto}>Notas</span>
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default BarraSuperior;
