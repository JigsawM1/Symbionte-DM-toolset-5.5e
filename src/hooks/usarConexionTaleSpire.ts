/**
 * usarConexionTaleSpire.ts
 * -------------------------
 * Hook de React para gestionar la conexión del Simbiote con TaleSpire.
 *
 * Utiliza el TaleSpireAdapter centralizado para suscribirse de forma segura
 * a los eventos físicos del tablero (selección de minis, cola de iniciativa)
 * y cargar datos de campaña y rol de DM de forma síncrona/segura.
 *
 * Programado 100% en español.
 */

import { useEffect } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { inicializarSimulador } from "../utiles/SimuladorTaleSpire";
import { ts } from "../utiles/TaleSpireAdapter";

export function usarConexionTaleSpire() {
  // Extraemos las acciones del store Zustand mediante .getState() ya que son funciones
  // inmutables. Esto evita que este hook se vuelva a evaluar y suscriba al render-tree
  // ante cambios ajenos del estado (como la ronda de combate, notas o tareas pendientes).
  const {
    cargarDatosPersistidos,
    actualizarSeleccionCriaturas,
    actualizarColaIniciativaDesdeTaleSpire,
    establecerDatosCampaña
  } = usarAlmacenDM.getState();

  useEffect(() => {
    let suscripcionSeleccion: { desuscribir: () => void } | null = null;
    let suscripcionIniciativa: { desuscribir: () => void } | null = null;
    let timerInicializacion: ReturnType<typeof setTimeout> | null = null;
    let activo = true;

    const suscribirAPIs = () => {
      if (!ts.estaDisponible) return false;

      console.log("[TaleSpire Simbionte] Conectando escuchas y suscripciones de eventos de mesa...");
      
      try {
        // Suscribirse a la selección de criaturas
        suscripcionSeleccion = ts.creatures.suscribirASeleccion(async (seleccion) => {
          if (activo) {
            const fragments = seleccion?.creatures || [];
            const ids = fragments.map((f) => f.id);
            if (ids.length === 0) {
              actualizarSeleccionCriaturas([]);
              return;
            }
            try {
              const info = await ts.creatures.getMoreInfo(ids);
              const seleccionadas: import("../almacen/slices/sliceIniciativa").CriaturaSeleccionadaTS[] = info.map((c) => ({
                id: c.id,
                name: c.name,
                hp: c.hp?.value,
                maxHp: c.hp?.max
              }));
              actualizarSeleccionCriaturas(seleccionadas);
            } catch (e) {
              console.warn("[TaleSpire Simbionte] Error al enriquecer selección de criaturas:", e);
              actualizarSeleccionCriaturas(ids.map((id) => ({ id, name: "Criatura Seleccionada" })));
            }
          }
        });

        // Suscribirse al evento de iniciativa nativo
        suscripcionIniciativa = ts.initiative.suscribirAEvento(() => {
          if (activo && typeof window.manejarEventoIniciativa === "function") {
            window.manejarEventoIniciativa();
          }
        });

        //  IMPORTANTE: Las llamadas "get" iniciales y la carga del blob nativo se retardan 500ms para que el canal
        // de mensajería del Simbionte quede completamente registrado antes de enviar mensajes.
        // Enviarlos de forma inmediata causa el error "outOfOrderMessage" de TaleSpire.
        timerInicializacion = setTimeout(() => {
          if (!activo) return;

          // Cargar datos persistidos ahora que la API window.TS (real o simulador) está activa y el canal es estable
          console.log("[TaleSpire Simbionte] Canal de comunicación establecido. Iniciando carga de datos persistidos...");
          cargarDatosPersistidos();

          // Obtener la selección inicial física del tablero
          ts.creatures.getSelectedCreatures()
            .then(async (seleccionInicial) => {
              if (activo) {
                const ids = (seleccionInicial || []).map((f) => f.id);
                if (ids.length === 0) {
                  actualizarSeleccionCriaturas([]);
                  return;
                }
                try {
                  const info = await ts.creatures.getMoreInfo(ids);
                  const seleccionadas: import("../almacen/slices/sliceIniciativa").CriaturaSeleccionadaTS[] = info.map((c) => ({
                    id: c.id,
                    name: c.name,
                    hp: c.hp?.value,
                    maxHp: c.hp?.max
                  }));
                  actualizarSeleccionCriaturas(seleccionadas);
                } catch (e) {
                  actualizarSeleccionCriaturas(ids.map((id) => ({ id, name: "Criatura Seleccionada" })));
                }
              }
            })
            .catch((e: unknown) => {
              console.warn("[TaleSpire Simbionte] Error al obtener selección inicial:", e);
            });

          // Obtener la cola inicial física del tablero (Deduplicada por el Adaptador)
          ts.initiative.getQueue()
            .then((colaInicial) => {
              if (activo) {
                actualizarColaIniciativaDesdeTaleSpire(colaInicial);
              }
            })
            .catch((e: unknown) => {
              console.warn("[TaleSpire Simbionte] Error al obtener cola de iniciativa inicial:", e);
            });

          // Obtener la campaña y si es DM
          ts.campaigns.getMoreInfoAboutCurrentCampaign()
            .then((campaignInfo) => {
              const nombreCampaña = campaignInfo?.name || "Campaña Desconocida";
              
              // Revisar el rol del cliente (si es DM o no)
              ts.clients.esGM()
                .then((soyGm) => {
                  if (activo) {
                    establecerDatosCampaña(nombreCampaña, soyGm);
                  }
                })
                .catch((e: unknown) => {
                  console.warn("[TaleSpire Simbionte] Error al obtener info del cliente (DM):", e);
                  if (activo) establecerDatosCampaña(nombreCampaña, false);
                });
            })
            .catch((e: unknown) => {
              console.warn("[TaleSpire Simbionte] Error al obtener datos de campaña:", e);
            });
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
        if (timerInicializacion) clearTimeout(timerInicializacion);
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
      if (timerInicializacion) clearTimeout(timerInicializacion);
      if (suscripcionSeleccion) suscripcionSeleccion.desuscribir();
      if (suscripcionIniciativa) suscripcionIniciativa.desuscribir();
    };
  }, []);
}
