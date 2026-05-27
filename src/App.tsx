import React, { Suspense } from "react";
import { usarAlmacenDM } from "./almacen/usarAlmacenDM";
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
const ListaHechizos = React.lazy(() => import("./componentes/ListaHechizos").then((m) => ({ default: m.ListaHechizos })));
const NotasDM = React.lazy(() => import("./componentes/NotasDM").then((m) => ({ default: m.NotasDM })));
const CreadorHomebrew = React.lazy(() => import("./componentes/CreadorHomebrew").then((m) => ({ default: m.CreadorHomebrew })));
const ConfiguracionDM = React.lazy(() => import("./componentes/ConfiguracionDM").then((m) => ({ default: m.ConfiguracionDM })));

const AppContenido: React.FC = () => {
  const pestañaActiva = usarAlmacenDM((s) => s.pestañaActiva);

  // Sincronización híbrida mediante hook modular
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
    <div className={estilos.contenedorGeneral}>
      {/* Barra de título y navegación superior */}
      <BarraSuperior />

      {/* Controles del DM */}
      {pestañaActiva === "iniciativa" && <BarraControl />}

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
