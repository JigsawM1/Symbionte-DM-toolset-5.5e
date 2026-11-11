import React from "react";
import {
  usarEstadoConfiguracion,
  usarAccionesConfiguracion,
} from "@/almacen/selectores";
import {
  Gamepad2,
  Swords,
  Sparkles,
  Backpack,
  LayoutGrid,
  Play,
  Table,
  ListTodo,
  BookOpen,
  FileText,
} from "lucide-react";
import estilos from "./BarraNavegacionInferior.module.css";

export interface PropsBarraNavegacionInferior {
  alAlternarMenuMas: () => void;
  menuMasAbierto: boolean;
}

const PESTANAS_SECUNDARIAS_JUGADOR = new Set([
  "rasgos",
  "notas",
  "iniciativa",
]);

export const BarraNavegacionInferior: React.FC<PropsBarraNavegacionInferior> = ({
  alAlternarMenuMas,
  menuMasAbierto,
}) => {
  const { pestañaActiva, esGM } = usarEstadoConfiguracion();
  const { establecerPestaña } = usarAccionesConfiguracion();

  if (!esGM) {
    const esSecundariaActiva = PESTANAS_SECUNDARIAS_JUGADOR.has(pestañaActiva);
    const esCaracteristicas =
      !["acciones", "ataques", "conjuros", "compendio", "hechizos", "inventario"].includes(
        pestañaActiva
      ) && !esSecundariaActiva;
    const esAcciones = pestañaActiva === "acciones" || pestañaActiva === "ataques";
    const esConjuros =
      pestañaActiva === "conjuros" ||
      pestañaActiva === "compendio" ||
      pestañaActiva === "hechizos";
    const esInventario = pestañaActiva === "inventario";

    return (
      <nav className={estilos.barraInferior} role="tablist" aria-label="Navegación principal de jugador">
        <button
          type="button"
          role="tab"
          aria-selected={esCaracteristicas}
          className={`${estilos.botonPestana} ${esCaracteristicas ? estilos.botonPestanaActiva : ""}`}
          onClick={() => establecerPestaña("jugadores")}
          title="Ficha y Características"
        >
          <div className={estilos.iconoContenedor}>
            <Gamepad2 size={18} />
          </div>
          <span className={estilos.etiquetaTexto}>Ficha</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={esAcciones}
          className={`${estilos.botonPestana} ${esAcciones ? estilos.botonPestanaActiva : ""}`}
          onClick={() => establecerPestaña("acciones")}
          title="Acciones de Combate y Armas"
        >
          <div className={estilos.iconoContenedor}>
            <Swords size={18} />
          </div>
          <span className={estilos.etiquetaTexto}>Acciones</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={esConjuros}
          className={`${estilos.botonPestana} ${esConjuros ? estilos.botonPestanaActiva : ""}`}
          onClick={() => establecerPestaña("conjuros")}
          title="Gestor de Conjuros y Magia"
        >
          <div className={estilos.iconoContenedor}>
            <Sparkles size={18} />
          </div>
          <span className={estilos.etiquetaTexto}>Conjuros</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={esInventario}
          className={`${estilos.botonPestana} ${esInventario ? estilos.botonPestanaActiva : ""}`}
          onClick={() => establecerPestaña("inventario")}
          title="Inventario y Equipo"
        >
          <div className={estilos.iconoContenedor}>
            <Backpack size={18} />
          </div>
          <span className={estilos.etiquetaTexto}>Inventario</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={esSecundariaActiva || menuMasAbierto}
          className={`${estilos.botonPestana} ${
            esSecundariaActiva || menuMasAbierto ? estilos.botonPestanaActiva : ""
          }`}
          onClick={alAlternarMenuMas}
          title="Más opciones: Rasgos, Notas e Iniciativa"
        >
          <div className={estilos.iconoContenedor}>
            <LayoutGrid size={18} />
            {esSecundariaActiva && <span className={estilos.dotSecundarioActivo} aria-hidden="true" />}
          </div>
          <span className={estilos.etiquetaTexto}>Más</span>
        </button>
      </nav>
    );
  }

  // Vista de Dungeon Master (DM): Las 5 pestañas canónicas directas
  const esIniciativa = pestañaActiva === "iniciativa" || pestañaActiva === "fichas";
  const esTablas = pestañaActiva === "tablas";
  const esPendientes = pestañaActiva === "pendientes";
  const esCompendio = pestañaActiva === "compendio" || pestañaActiva === "hechizos";
  const esNotas = pestañaActiva === "notas";

  return (
    <nav className={estilos.barraInferior} role="tablist" aria-label="Navegación principal de DM">
      <button
        type="button"
        role="tab"
        aria-selected={esIniciativa}
        className={`${estilos.botonPestana} ${esIniciativa ? estilos.botonPestanaActiva : ""}`}
        onClick={() => establecerPestaña("iniciativa")}
        title="Gestor de Iniciativa y Tracker"
      >
        <div className={estilos.iconoContenedor}>
          <Play size={18} fill={esIniciativa ? "currentColor" : "none"} />
        </div>
        <span className={estilos.etiquetaTexto}>Iniciativa</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={esTablas}
        className={`${estilos.botonPestana} ${esTablas ? estilos.botonPestanaActiva : ""}`}
        onClick={() => establecerPestaña("tablas")}
        title="Tablas del DM y Reglas"
      >
        <div className={estilos.iconoContenedor}>
          <Table size={18} />
        </div>
        <span className={estilos.etiquetaTexto}>Tablas DM</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={esPendientes}
        className={`${estilos.botonPestana} ${esPendientes ? estilos.botonPestanaActiva : ""}`}
        onClick={() => establecerPestaña("pendientes")}
        title="Lista de Tareas Pendientes"
      >
        <div className={estilos.iconoContenedor}>
          <ListTodo size={18} />
        </div>
        <span className={estilos.etiquetaTexto}>Pendientes</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={esCompendio}
        className={`${estilos.botonPestana} ${esCompendio ? estilos.botonPestanaActiva : ""}`}
        onClick={() => establecerPestaña("compendio")}
        title="Compendio de Reglas y Monstruos"
      >
        <div className={estilos.iconoContenedor}>
          <BookOpen size={18} />
        </div>
        <span className={estilos.etiquetaTexto}>Compendio</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={esNotas}
        className={`${estilos.botonPestana} ${esNotas ? estilos.botonPestanaActiva : ""}`}
        onClick={() => establecerPestaña("notas")}
        title="Notas del DM"
      >
        <div className={estilos.iconoContenedor}>
          <FileText size={18} />
        </div>
        <span className={estilos.etiquetaTexto}>Notas</span>
      </button>
    </nav>
  );
};

export default BarraNavegacionInferior;
