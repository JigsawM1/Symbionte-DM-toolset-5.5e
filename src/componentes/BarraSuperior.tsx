import React, { useState } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import {
  Menu,
  Play,
  Table,
  ListTodo,
  BookOpen,
  FileText,
  Settings,
  Plus,
  Edit2
} from "lucide-react";
import estilosClases from "./BarraSuperior.module.css";

export const BarraSuperior: React.FC = () => {
  const { pestañaActiva, establecerPestaña, campañaNombre, modoHomebrew, establecerModoHomebrew } = usarAlmacenDM();
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
          <span className={estilosClases.tituloTexto}>DM SCREEN</span>
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

      {/* Fila Inferior: Pestañas Brutalistas en un solo renglón autoajustable */}
      <nav className={estilosClases.navPestañas}>
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
          onClick={() => establecerPestaña("hechizos")}
          className={`${estilosClases.pestanaBoton} ${
            pestañaActiva === "hechizos" ? estilosClases.pestanaActiva : ""
          }`}
          title="Lista de Hechizos en Español"
          type="button"
        >
          <BookOpen size={13} />
          <span className={estilosClases.pestanaTexto}>Hechizos</span>
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
      </nav>
    </header>
  );
};

export default BarraSuperior;
