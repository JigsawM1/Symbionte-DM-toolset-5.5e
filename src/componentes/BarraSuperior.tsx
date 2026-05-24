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

export const BarraSuperior: React.FC = () => {
  const { pestañaActiva, establecerPestaña, campañaNombre, modoHomebrew, establecerModoHomebrew } = usarAlmacenDM();
  const [mostrarMenuHomebrew, setMostrarMenuHomebrew] = useState(false);

  return (
    <header style={estilos.cabecera}>
      {/* Fila Superior: Título y Configuración / Campaña */}
      <div style={estilos.filaSuperior}>
        <div style={estilos.tituloSeccion}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMostrarMenuHomebrew(!mostrarMenuHomebrew)}
              style={{
                ...estilos.botonHamburguesa,
                ...(pestañaActiva === "homebrew" ? estilos.botonActivo : {})
              }}
              title="Opciones de Homebrew"
            >
              <Menu size={14} />
            </button>

            {mostrarMenuHomebrew && (
              <div style={estilos.menuHomebrewDesplegable}>
                <div style={estilos.cabeceraDesplegable}>Homebrew</div>
                <button
                  onClick={() => {
                    establecerPestaña("homebrew");
                    establecerModoHomebrew("crear");
                    setMostrarMenuHomebrew(false);
                  }}
                  style={{
                    ...estilos.itemMenuDesplegable,
                    ...(pestañaActiva === "homebrew" && modoHomebrew === "crear" ? estilos.itemMenuActivo : {})
                  }}
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
                  style={{
                    ...estilos.itemMenuDesplegable,
                    ...(pestañaActiva === "homebrew" && modoHomebrew === "lista" ? estilos.itemMenuActivo : {})
                  }}
                >
                  <Edit2 size={12} />
                  <span>Listado / Editar</span>
                </button>
              </div>
            )}
          </div>
          <span style={estilos.tituloTexto}>DM SCREEN</span>
        </div>

        <div style={estilos.zonaDerecha}>
          <span style={estilos.campañaTexto} title={campañaNombre}>
            {campañaNombre.length > 22 ? `${campañaNombre.substring(0, 19)}...` : campañaNombre}
          </span>
          <button
            onClick={() => establecerPestaña("configuracion")}
            style={{
              ...estilos.botonConfiguracion,
              ...(pestañaActiva === "configuracion" ? estilos.botonActivo : {})
            }}
            title="Configuración e Importación JSON"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Fila Inferior: Pestañas Brutalistas en un solo renglón autoajustable */}
      <nav style={estilos.navPestañas}>
        <button
          onClick={() => establecerPestaña("iniciativa")}
          style={{
            ...estilos.pestanaBoton,
            ...(pestañaActiva === "iniciativa" ? estilos.pestanaActiva : {})
          }}
          title="Gestor de Iniciativa"
        >
          <Play size={13} fill={pestañaActiva === "iniciativa" ? "currentColor" : "none"} />
          <span style={estilos.pestanaTexto}>Iniciativa</span>
        </button>

        <button
          onClick={() => establecerPestaña("tablas")}
          style={{
            ...estilos.pestanaBoton,
            ...(pestañaActiva === "tablas" ? estilos.pestanaActiva : {})
          }}
          title="Tablas del DM"
        >
          <Table size={13} />
          <span style={estilos.pestanaTexto}>Tablas DM</span>
        </button>

        <button
          onClick={() => establecerPestaña("pendientes")}
          style={{
            ...estilos.pestanaBoton,
            ...(pestañaActiva === "pendientes" ? estilos.pestanaActiva : {})
          }}
          title="Lista de Tareas Pendientes"
        >
          <ListTodo size={13} />
          <span style={estilos.pestanaTexto}>Pendientes</span>
        </button>

        <button
          onClick={() => establecerPestaña("hechizos")}
          style={{
            ...estilos.pestanaBoton,
            ...(pestañaActiva === "hechizos" ? estilos.pestanaActiva : {})
          }}
          title="Lista de Hechizos en Español"
        >
          <BookOpen size={13} />
          <span style={estilos.pestanaTexto}>Hechizos</span>
        </button>

        <button
          onClick={() => establecerPestaña("notas")}
          style={{
            ...estilos.pestanaBoton,
            ...(pestañaActiva === "notas" ? estilos.pestanaActiva : {})
          }}
          title="Notas del DM"
        >
          <FileText size={13} />
          <span style={estilos.pestanaTexto}>Notas</span>
        </button>
      </nav>
    </header>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  cabecera: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--color-fondo-panel)",
    borderBottom: "2px solid var(--color-borde-brutal)",
    width: "100%",
    flexShrink: 0
  },
  filaSuperior: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 8px",
    height: "32px",
    width: "100%"
  },
  tituloSeccion: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px"
  },
  botonHamburguesa: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-principal)",
    padding: "2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "24px",
    width: "28px"
  },
  tituloTexto: {
    fontSize: "13px",
    fontWeight: "bold",
    letterSpacing: "0.08em",
    color: "var(--color-borde-cian)",
    textTransform: "uppercase",
    fontFamily: "var(--fuente-codigo)"
  },
  zonaDerecha: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px"
  },
  campañaTexto: {
    fontSize: "12px",
    fontFamily: "var(--fuente-codigo)",
    color: "var(--color-texto-secundario)",
    maxWidth: "180px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  botonConfiguracion: {
    backgroundColor: "var(--color-fondo-tarjeta)",
    border: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    padding: "2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "24px",
    width: "28px"
  },
  botonActivo: {
    backgroundColor: "var(--color-primario)",
    borderColor: "var(--color-borde-cian)",
    color: "#ffffff"
  },
  navPestañas: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    borderTop: "1px solid var(--color-borde-brutal)"
  },
  pestanaBoton: {
    flex: 1,
    backgroundColor: "var(--color-fondo-panel)",
    border: "none",
    borderRight: "1px solid var(--color-borde-brutal)",
    color: "var(--color-texto-secundario)",
    padding: "4px 2px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    cursor: "pointer",
    height: "30px"
  },
  pestanaActiva: {
    backgroundColor: "var(--color-primario-brillante)",
    color: "#ffffff",
    borderBottom: "1px solid var(--color-borde-cian)"
  },
  pestanaTexto: {
    fontSize: "11px",
    letterSpacing: "-0.01em"
  },
  menuHomebrewDesplegable: {
    position: "absolute",
    top: "28px",
    left: "0px",
    backgroundColor: "var(--color-fondo-panel)",
    border: "2px solid var(--color-borde-brutal)",
    zIndex: 1000,
    width: "160px",
    boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.9)",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  cabeceraDesplegable: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "var(--color-texto-secundario)",
    borderBottom: "1px solid var(--color-borde-brutal)",
    paddingBottom: "3px",
    marginBottom: "3px",
    textTransform: "uppercase",
    fontFamily: "var(--fuente-codigo)",
    letterSpacing: "0.05em"
  },
  itemMenuDesplegable: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--color-texto-principal)",
    fontSize: "12px",
    padding: "6px 8px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px",
    width: "100%",
    fontFamily: "var(--fuente-inter)",
    fontWeight: "500"
  },
  itemMenuActivo: {
    backgroundColor: "var(--color-primario-brillante)",
    color: "#ffffff",
    border: "1px solid var(--color-borde-cian)",
    borderRadius: "2px"
  }
};

export default BarraSuperior;
