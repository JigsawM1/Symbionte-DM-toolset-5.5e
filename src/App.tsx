import React from "react";
import { usarAlmacenDM } from "./almacen/usarAlmacenDM";
import { usarConexionTaleSpire } from "./hooks/usarConexionTaleSpire";
import { LimiteError } from "./componentes/LimiteError";
import { BarraSuperior } from "./componentes/BarraSuperior";
import { BarraControl } from "./componentes/BarraControl";
import { GestorIniciativa } from "./componentes/GestorIniciativa";
import { TablasDM } from "./componentes/TablasDM";
import { Pendientes } from "./componentes/Pendientes";
import { ListaHechizos } from "./componentes/ListaHechizos";
import { NotasDM } from "./componentes/NotasDM";
import { CreadorHomebrew } from "./componentes/CreadorHomebrew";
import { ConfiguracionDM } from "./componentes/ConfiguracionDM";
import { PanelDados } from "./componentes/PanelDados";

const AppContenido: React.FC = () => {
  const { pestañaActiva } = usarAlmacenDM();

  // Inicialización y suscripción a eventos en tiempo real mediante hook modular
  usarConexionTaleSpire();

  // Renderizado condicional basado en la pestaña activa
  const renderContenidoPestaña = () => {
    switch (pestañaActiva) {
      case "iniciativa":
        return <GestorIniciativa />;
      case "tablas":
        return <TablasDM />;
      case "pendientes":
        return <Pendientes />;
      case "hechizos":
        return <ListaHechizos />;
      case "notas":
        return <NotasDM />;
      case "homebrew":
        return <CreadorHomebrew />;
      case "configuracion":
        return <ConfiguracionDM />;
      default:
        return <GestorIniciativa />;
    }
  };

  return (
    <div style={estilos.contenedorGeneral}>
      {/* Barra de título y navegación por pestañas superior */}
      <BarraSuperior />

      {/* Controles del DM (Guardado de encuentros, ventaja, inyección condiciones, búsqueda rápida) */}
      {pestañaActiva === "iniciativa" && <BarraControl />}

      {/* Panel de Contenido Principal Reactivo de Alta Densidad */}
      <main style={estilos.areaContenido}>
        {renderContenidoPestaña()}
      </main>

      {/* Panel flotante premium de dados restaurado */}
      <PanelDados />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LimiteError>
      <AppContenido />
    </LimiteError>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  contenedorGeneral: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100vh",
    maxHeight: "100vh",
    backgroundColor: "var(--color-fondo-profundo)",
    overflow: "hidden",
    boxSizing: "border-box",
    padding: "0"
  },
  areaContenido: {
    flex: 1,
    width: "100%",
    minHeight: "0", // Importante para flexbox y desbordamiento de scrollbars en Chromium
    padding: "4px",
    boxSizing: "border-box",
    backgroundColor: "var(--color-fondo-profundo)",
    overflow: "hidden" // Previene scrollbars en el propio contenedor principal
  }
};

export default App;
