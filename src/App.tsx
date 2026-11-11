import { CambiosSyncPendientes } from "@/componentes/comunes/CambiosSyncPendientes";
import { AvisoCargaDatos } from "@/componentes/comunes/AvisoCargaDatos";
import { EstadoSincronizacionV4 } from "@/componentes/caracteristicas/sincronizacion/EstadoSincronizacionV4";
import React, { Suspense, useState } from "react";
import { usarEstadoConfiguracion } from "@/almacen/selectores";
import { usarConexionTaleSpire } from "./hooks/usarConexionTaleSpire";
import { LimiteError, NotificacionesContenedor } from "@/componentes/comunes";
import {
  BarraSuperior,
  BarraControl,
  PanelDados,
  BarraNavegacionInferior,
  MenuMasMovil,
} from "@/componentes/layout";
const GestorIniciativa = React.lazy(() => import("@/componentes/caracteristicas/iniciativa").then((m) => ({ default: m.GestorIniciativa })));
import estilos from "./App.module.css";

// Carga diferida de pestañas pesadas o inactivas al inicio con soporte para named exports
const TablasDM = React.lazy(() => import("@/componentes/caracteristicas/tablas").then((m) => ({ default: m.TablasDM })));
const Pendientes = React.lazy(() => import("@/componentes/caracteristicas/pendientes").then((m) => ({ default: m.Pendientes })));
const Compendio = React.lazy(() => import("@/componentes/caracteristicas/compendio").then((m) => ({ default: m.Compendio })));
const NotasDM = React.lazy(() => import("@/componentes/caracteristicas/notas").then((m) => ({ default: m.NotasDM })));
const CreadorHomebrew = React.lazy(() => import("@/componentes/caracteristicas/homebrew").then((m) => ({ default: m.CreadorHomebrew })));
const ConfiguracionDM = React.lazy(() => import("@/componentes/caracteristicas/configuracion").then((m) => ({ default: m.ConfiguracionDM })));
const VistaJugadores = React.lazy(() => import("@/componentes/caracteristicas/personajes").then((m) => ({ default: m.VistaJugadores })));
const VistaAtaquesJugador = React.lazy(() => import("@/componentes/caracteristicas/ataques").then((m) => ({ default: m.VistaAtaquesJugador })));
const VistaInventarioJugador = React.lazy(() => import("@/componentes/caracteristicas/inventario").then((m) => ({ default: m.VistaInventarioJugador })));
const VistaRasgosJugador = React.lazy(() => import("@/componentes/caracteristicas/rasgos").then((m) => ({ default: m.VistaRasgosJugador })));
const IniciativaJugador = React.lazy(() => import("@/componentes/caracteristicas/iniciativa").then((m) => ({ default: m.IniciativaJugador })));
const VistaMagiaSalvaje = React.lazy(() => import("@/componentes/caracteristicas/magiaSalvaje").then((m) => ({ default: m.VistaMagiaSalvaje })));

const AppContenido: React.FC = () => {
  const { pestañaActiva, esGM } = usarEstadoConfiguracion();
  const [menuMasAbierto, setMenuMasAbierto] = useState(false);

  // Sincronización híbrida mediante hook modular
  usarConexionTaleSpire();

  // Renderizado condicional basado en el rol nativo detectado
  const renderContenidoPestaña = () => {
    if (!esGM) {
      switch (pestañaActiva) {
        case "iniciativa":
          return <IniciativaJugador />;
        case "acciones":
        case "ataques":
          return <VistaAtaquesJugador />;
        case "compendio":
        case "hechizos":
        case "conjuros":
          return <Compendio />;
        case "rasgos":
          return <VistaRasgosJugador />;
        case "magia_salvaje":
        case "magiasalvaje":
          return <VistaMagiaSalvaje />;
        case "inventario":
          return <VistaInventarioJugador />;
        case "tablas":
          return <TablasDM />;
        case "notas":
          return <NotasDM />;
        case "homebrew":
          return <CreadorHomebrew />;
        case "configuracion":
          return <ConfiguracionDM />;
        case "jugadores":
        case "caracteristicas":
        default:
          return <VistaJugadores />;
      }
    }

    switch (pestañaActiva) {
      case "iniciativa":
      case "fichas":
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
      case "jugadores":
      default:
        return <GestorIniciativa />;
    }
  };

  return (
    <div className={estilos.contenedorGeneral} data-tema={esGM ? "dm" : "jugador"}>
      {/* 1. Barra de estado y cabecera superior móvil */}
      <BarraSuperior />

      {/* 2. Subheader de Controles de Combate del DM (Solo visible si esGM en iniciativa) */}
      {esGM && pestañaActiva === "iniciativa" && <BarraControl />}

      {/* 3. Panel de Contenido Principal Móvil */}
      <main className={estilos.areaContenido}>
        <AvisoCargaDatos />
        <CambiosSyncPendientes />
        <div className={estilos.panelContenido}>
          <Suspense
            fallback={
              <div className={estilos.cargadorPestana}>
                Cargando módulo...
                <div className={estilos.cargadorBarra} />
              </div>
            }
          >
            <LimiteError modoModular key={pestañaActiva}>
              {renderContenidoPestaña()}
            </LimiteError>
          </Suspense>
        </div>
        <PanelDados />
      </main>

      {/* 4. Pie de sincronización ambiental */}
      <EstadoSincronizacionV4 />

      {/* 5. Barra de Navegación Inferior Móvil (Bottom Navigation Bar) */}
      <BarraNavegacionInferior
        alAlternarMenuMas={() => setMenuMasAbierto((prev) => !prev)}
        menuMasAbierto={menuMasAbierto}
      />

      {/* 6. Hoja Inferior Táctica Móvil (Bottom Sheet de Herramientas Adicionales) */}
      <MenuMasMovil
        abierto={menuMasAbierto}
        alCerrar={() => setMenuMasAbierto(false)}
      />

      {/* 7. Contenedor global de notificaciones/toasts */}
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
