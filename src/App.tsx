import React, { useEffect } from "react";
import { usarAlmacenDM } from "./almacen/usarAlmacenDM";
import { inicializarSimulador } from "./utiles/SimuladorTaleSpire";
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
  const {
    pestañaActiva,
    cargarDatosPersistidos,
    actualizarSeleccionCriaturas,
    actualizarColaIniciativaDesdeTaleSpire
  } = usarAlmacenDM();

  // Inicialización y suscripción a eventos en tiempo real
  useEffect(() => {
    // 1. Carga los datos locales (Homebrew, notas, pendientes) desde almacenamiento persistido
    cargarDatosPersistidos();

    let suscripcionSeleccion: { desuscribir: () => void } | null = null;
    let suscripcionIniciativa: { desuscribir: () => void } | null = null;
    let activo = true;

    const suscribirAPIs = () => {
      const windowAlias = window as any;
      if (!windowAlias.TS) return false;

      console.log("[TaleSpire Simbionte] Conectando escuchas y suscripciones de eventos de mesa...");
      
      try {
        // Suscribirse a cambios en la selección activa de tokens
        const apiCreatures = windowAlias.TS.creatures;
        if (apiCreatures?.onCreatureSelectionChange) {
          suscripcionSeleccion = apiCreatures.onCreatureSelectionChange.subscribe((seleccion: any) => {
            if (activo) actualizarSeleccionCriaturas(seleccion || []);
          });
        }

        // Obtener la selección inicial física del tablero
        if (apiCreatures?.getSelectedCreatures) {
          apiCreatures.getSelectedCreatures().then((seleccionInicial: any) => {
            if (activo) actualizarSeleccionCriaturas(seleccionInicial || []);
          });
        }

        // Suscribirse a cambios en la cola de iniciativa física del juego
        const apiInitiative = windowAlias.TS.initiative;
        if (apiInitiative?.onInitiativeEvent) {
          suscripcionIniciativa = apiInitiative.onInitiativeEvent.subscribe(() => {
            apiInitiative.getQueue().then((colaTS: any) => {
              if (activo) actualizarColaIniciativaDesdeTaleSpire(colaTS || []);
            });
          });
        }

        // Obtener la cola inicial física del tablero
        if (apiInitiative?.getQueue) {
          apiInitiative.getQueue().then((colaInicial: any) => {
            if (activo) actualizarColaIniciativaDesdeTaleSpire(colaInicial || []);
          });
        }

        // Obtener el nombre de la campaña y rol de GM en caliente
        if (windowAlias.TS.campaigns?.whereAmI) {
          windowAlias.TS.campaigns.whereAmI().then((campaña: any) => {
            if (activo && campaña && campaña.name) {
              usarAlmacenDM.setState({
                campañaNombre: campaña.name,
                esGM: campaña.playerRole === "GM" || campaña.isGm
              });
            }
          });
        }

        return true;
      } catch (err) {
        console.error("[TaleSpire Simbionte] Error al suscribirse a las APIs nativas de TaleSpire:", err);
        return false;
      }
    };

    // Intentar suscripción inmediata (si estamos dentro de TaleSpire y ya inyectó)
    if (suscribirAPIs()) {
      return () => {
        activo = false;
        if (suscripcionSeleccion) suscripcionSeleccion.desuscribir();
        if (suscripcionIniciativa) suscripcionIniciativa.desuscribir();
      };
    }

    // Si no está listo, sondeamos periódicamente de forma inteligente.
    let intentos = 0;
    const esDesarrolloLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    // Aumentamos los intentos a 300 (15 segundos) tanto para local como para producción.
    // Esto previene que si el usuario desarrolla cargando localhost:5173 dentro de TaleSpire,
    // el simulador se inyecte prematuramente (a los 2 segundos) y pise la API real del juego.
    const maxIntentos = 300; 
    
    const intervalo = setInterval(() => {
      intentos++;
      if (suscribirAPIs()) {
        clearInterval(intervalo);
      } else if (intentos >= maxIntentos) {
        clearInterval(intervalo);
        if (esDesarrolloLocal) {
          console.warn("[TaleSpire Simbionte] API window.TS no detectada en desarrollo local. Inicializando simulador...");
          inicializarSimulador();
          suscribirAPIs();
        } else {
          console.error("[TaleSpire Simbionte] CRÍTICO: La API nativa de TaleSpire no apareció tras 15 segundos. Verifica tu instalación del juego.");
        }
      }
    }, 50);

    return () => {
      activo = false;
      clearInterval(intervalo);
      if (suscripcionSeleccion) suscripcionSeleccion.desuscribir();
      if (suscripcionIniciativa) suscripcionIniciativa.desuscribir();
    };
  }, [cargarDatosPersistidos, actualizarSeleccionCriaturas, actualizarColaIniciativaDesdeTaleSpire]);

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
