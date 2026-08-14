import React, { Suspense } from "react";
import { usarEstadoConfiguracion } from "@/almacen/selectores";
import { usarConexionTaleSpire } from "./hooks/usarConexionTaleSpire";
import { LimiteError } from "./componentes/LimiteError";
import { BarraSuperior } from "./componentes/BarraSuperior";
import { BarraControl } from "./componentes/BarraControl";
import { GestorIniciativa } from "./componentes/GestorIniciativa";
import { PanelDados } from "./componentes/PanelDados";
import { NotificacionesContenedor } from "./componentes/NotificacionesContenedor";
import estilos from "./App.module.css";

// Carga diferida de pestañas pesadas o inactivas al inicio con soporte para named exports
const TablasDM = React.lazy(() => import("./componentes/TablasDM").then((m) => ({ default: m.TablasDM })));
const Pendientes = React.lazy(() => import("./componentes/Pendientes").then((m) => ({ default: m.Pendientes })));
const Compendio = React.lazy(() => import("./componentes/Compendio").then((m) => ({ default: m.Compendio })));
const NotasDM = React.lazy(() => import("./componentes/NotasDM").then((m) => ({ default: m.NotasDM })));
const CreadorHomebrew = React.lazy(() => import("./componentes/CreadorHomebrew").then((m) => ({ default: m.CreadorHomebrew })));
const ConfiguracionDM = React.lazy(() => import("./componentes/ConfiguracionDM").then((m) => ({ default: m.ConfiguracionDM })));
const VistaJugadores = React.lazy(() => import("./componentes/VistaJugadores").then((m) => ({ default: m.VistaJugadores })));
const IniciativaJugador = React.lazy(() => import("./componentes/IniciativaJugador").then((m) => ({ default: m.IniciativaJugador })));

const AppContenido: React.FC = () => {
  const { pestañaActiva, esGM } = usarEstadoConfiguracion();

  // Sincronización híbrida mediante hook modular
  usarConexionTaleSpire();

  // Renderizado condicional basado en el rol nativo detectado
  const renderContenidoPestaña = () => {
    if (!esGM) {
      switch (pestañaActiva) {
        case "iniciativa":
          return <IniciativaJugador />;
        case "compendio":
        case "hechizos":
          return <Compendio />;
        case "tablas":
          return <TablasDM />;
        case "notas":
          return <NotasDM />;
        case "homebrew":
          return <CreadorHomebrew />;
        case "configuracion":
          return <ConfiguracionDM />;
        default:
          return <VistaJugadores />;
      }
    }

    switch (pestañaActiva) {
      case "iniciativa":
        return <GestorIniciativa />;
      case "tablas":
        return <TablasDM />;
      case "pendientes":
        return <Pendientes />;
      case "compendio":
      case "hechizos":
        return <Compendio />;
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
    <div className={estilos.contenedorGeneral}>
      {/* Barra de título y navegación superior */}
      <BarraSuperior />

      {/* Controles del DM (Solo visibles si esGM es true) */}
      {esGM && pestañaActiva === "iniciativa" && <BarraControl />}

      {/* Panel de Contenido Principal Reactivo de Alta Densidad */}
      <main className={estilos.areaContenido}>
        <Suspense
          fallback={
            <div className={estilos.cargadorPestana}>
              Cargando módulo...
              <div className={estilos.cargadorBarra} />
            </div>
          }
        >
          {renderContenidoPestaña()}
        </Suspense>
      </main>

      {/* Panel flotante premium de dados */}
      <PanelDados />

      {/* Contenedor global de notificaciones/toasts */}
      <NotificacionesContenedor />
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

export default App;
