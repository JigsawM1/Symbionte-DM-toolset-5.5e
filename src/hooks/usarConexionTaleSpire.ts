import { useEffect } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { inicializarSimulador } from "../utiles/SimuladorTaleSpire";

export function usarConexionTaleSpire() {
  const {
    cargarDatosPersistidos,
    actualizarSeleccionCriaturas,
    actualizarColaIniciativaDesdeTaleSpire,
    establecerDatosCampaña
  } = usarAlmacenDM();

  useEffect(() => {
    let suscripcionSeleccion: { desuscribir: () => void } | null = null;
    let suscripcionIniciativa: { desuscribir: () => void } | null = null;
    let activo = true;

    const suscribirAPIs = () => {
      if (!window.TS) return false;

      console.log("[TaleSpire Simbionte] Conectando escuchas y suscripciones de eventos de mesa...");
      
      try {
        const apiCreatures = window.TS.creatures;
        const apiInitiative = window.TS.initiative;

        // Conservar las suscripciones inline activas tanto para compatibilidad del simulador local como para redundancia
        if (apiCreatures?.onCreatureSelectionChange) {
          suscripcionSeleccion = apiCreatures.onCreatureSelectionChange.subscribe((seleccion) => {
            if (activo) actualizarSeleccionCriaturas(seleccion || []);
          });
        }

        if (apiInitiative?.onInitiativeEvent) {
          suscripcionIniciativa = apiInitiative.onInitiativeEvent.subscribe(() => {
            if (activo && typeof window.manejarEventoIniciativa === "function") {
              window.manejarEventoIniciativa();
            }
          });
        }

        // ⚠️ IMPORTANTE: Las llamadas "get" iniciales y la carga del blob nativo se retardan 500ms para que el canal
        // de mensajería del Simbionte quede completamente registrado antes de enviar mensajes.
        // Enviarlos de forma inmediata causa el error "outOfOrderMessage" de TaleSpire.
        setTimeout(() => {
          if (!activo) return;

          // Cargar datos persistidos ahora que la API window.TS (real o simulador) está activa y el canal es estable
          console.log("[TaleSpire Simbionte] Canal de comunicación establecido. Iniciando carga de datos persistidos...");
          cargarDatosPersistidos();

          // Obtener la selección inicial física del tablero
          if (apiCreatures?.getSelectedCreatures) {
            apiCreatures.getSelectedCreatures()
              .then((seleccionInicial) => {
                if (activo) actualizarSeleccionCriaturas(seleccionInicial || []);
              })
              .catch((e: unknown) => {
                console.warn("[TaleSpire Simbionte] Error al obtener selección inicial:", e);
              });
          }

          // Obtener la cola inicial física del tablero
          if (apiInitiative?.getQueue) {
            apiInitiative.getQueue()
              .then((colaInicial) => {
                if (activo) actualizarColaIniciativaDesdeTaleSpire(colaInicial || []);
              })
              .catch((e: unknown) => {
                console.warn("[TaleSpire Simbionte] Error al obtener cola de iniciativa inicial:", e);
              });
          }

          // Obtener el nombre de la campaña y rol de GM en caliente
          if (window.TS?.campaigns?.whereAmI) {
            window.TS.campaigns.whereAmI()
              .then((campaña) => {
                if (activo && campaña && campaña.name) {
                  establecerDatosCampaña(
                    campaña.name,
                    campaña.playerRole === "GM" || !!campaña.isGm
                  );
                }
              })
              .catch((e: unknown) => {
                console.warn("[TaleSpire Simbionte] Error al obtener datos de campaña:", e);
              });
          }
        }, 500);

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
  }, [cargarDatosPersistidos, actualizarSeleccionCriaturas, actualizarColaIniciativaDesdeTaleSpire, establecerDatosCampaña]);
}
