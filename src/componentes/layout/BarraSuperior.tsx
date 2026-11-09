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
  Gamepad2,
  Backpack,
  Sparkles,
  Swords,
  BookMarked
} from "lucide-react";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import estilosClases from "./BarraSuperior.module.css";

const pestanasAdicionalesJugador = [
  { valor: "rasgos", etiqueta: "Rasgos", icono: <BookMarked size={13} /> },
  { valor: "notas", etiqueta: "Notas", icono: <FileText size={13} /> },
  { valor: "iniciativa", etiqueta: "Iniciativa", icono: <Play size={13} /> },
];

export const BarraSuperior: React.FC = () => {
  const { pestañaActiva, campañaNombre, esGM } = usarEstadoConfiguracion();
  const { establecerPestaña, establecerEsGM } = usarAccionesConfiguracion();
  const { modoHomebrew } = usarEstadoHomebrew();
  const { establecerModoHomebrew } = usarAccionesHomebrew();
  const [mostrarMenuHomebrew, setMostrarMenuHomebrew] = useState(false);
  const esPestanaAdicional = pestanasAdicionalesJugador.some(({ valor }) => valor === pestañaActiva);

  return (
    <header className={estilosClases.cabecera}>
      {/* Fila Superior: Título y Configuración / Campaña */}
      <div className={estilosClases.filaSuperior}>
        <div className={estilosClases.tituloSeccion}>
          <div className="u-pos-relativo">
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
          <span
            className={`${estilosClases.tituloTexto} ${typeof window !== "undefined" && !window.TS ? estilosClases.tituloTextoClickable : ""}`}
            onClick={() => {
              if (typeof window !== "undefined" && !window.TS) {
                establecerEsGM(!esGM);
              }
            }}
            title={typeof window !== "undefined" && !window.TS ? "Haz clic para alternar rol (DM / Jugador) en modo desarrollo local" : undefined}
          >
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
                !["acciones", "ataques", "conjuros", "compendio", "hechizos", "rasgos", "inventario", "tablas", "notas", "iniciativa", "configuracion", "homebrew"].includes(pestañaActiva) ? estilosClases.pestanaActiva : ""
              }`}
              title="Ficha y Características del Personaje"
              type="button"
            >
              <Gamepad2 size={13} />
              <span className={estilosClases.pestanaTexto}>Características</span>
            </button>

            <button
              onClick={() => establecerPestaña("acciones")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "acciones" || pestañaActiva === "ataques" ? estilosClases.pestanaActiva : ""
              }`}
              title="Acciones de Combate, Armas y Conjuros"
              type="button"
            >
              <Swords size={13} />
              <span className={estilosClases.pestanaTexto}>Acciones</span>
            </button>

            <button
              onClick={() => establecerPestaña("conjuros")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "conjuros" || pestañaActiva === "compendio" || pestañaActiva === "hechizos" ? estilosClases.pestanaActiva : ""
              }`}
              title="Gestor y Compendio de Conjuros"
              type="button"
            >
              <Sparkles size={13} />
              <span className={estilosClases.pestanaTexto}>Conjuros</span>
            </button>

            <button
              onClick={() => establecerPestaña("inventario")}
              className={`${estilosClases.pestanaBoton} ${
                pestañaActiva === "inventario" ? estilosClases.pestanaActiva : ""
              }`}
              title="Inventario, Equipamiento y Monedas"
              type="button"
            >
              <Backpack size={13} />
              <span className={estilosClases.pestanaTexto}>Inventario</span>
            </button>

            <SelectorDesplegable
              valor={esPestanaAdicional ? pestañaActiva : ""}
              alCambiar={establecerPestaña}
              opciones={pestanasAdicionalesJugador}
              placeholder="Más"
              titulo="Más pestañas: Rasgos, Notas e Iniciativa"
              className={`${estilosClases.selectorPestanas} ${esPestanaAdicional ? estilosClases.selectorPestanasActivo : ""}`}
            />
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
