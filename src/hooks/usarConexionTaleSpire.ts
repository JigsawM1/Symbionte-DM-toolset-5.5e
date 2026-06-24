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
import { ts } from "../utiles/TaleSpireAdapter";
import { puenteTaleSpire } from "../servicios/puenteTaleSpire";

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
    let desuscribirSeleccion: (() => void) | null = null;
    let desuscribirIniciativa: (() => void) | null = null;
    let timerInicializacion: ReturnType<typeof setTimeout> | null = null;
    let activo = true;

    const suscribirAPIs = () => {
      if (!ts.estaDisponible) return false;

      console.log("[TaleSpire Simbionte] Conectando escuchas y suscripciones del EventBus...");
      
      try {
        // Suscribirse a la selección de criaturas a través del puente EventBus
        desuscribirSeleccion = puenteTaleSpire.on("seleccionCriaturas", async (seleccion) => {
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

        // Suscribirse a los cambios en la cola de iniciativa a través del puente EventBus
        desuscribirIniciativa = puenteTaleSpire.on("iniciativaActualizada", (payload) => {
          if (activo) {
            if (payload && payload.queue) {
              actualizarColaIniciativaDesdeTaleSpire(payload.queue);
            } else {
              ts.initiative.getQueue()
                .then((colaTS) => {
                  actualizarColaIniciativaDesdeTaleSpire(colaTS);
                })
                .catch((e: unknown) => {
                  console.warn("[TaleSpire Simbionte] Error al leer la cola física tras evento:", e);
                });
            }
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
        console.error("[TaleSpire Simbionte] Error al suscribirse al puente de eventos de TaleSpire:", err);
        return false;
      }
    };

    // Intentar suscripción inmediata (si estamos dentro de TaleSpire y ya inyectó)
    if (suscribirAPIs()) {
      return () => {
        activo = false;
        if (timerInicializacion) clearTimeout(timerInicializacion);
        if (desuscribirSeleccion) desuscribirSeleccion();
        if (desuscribirIniciativa) desuscribirIniciativa();
      };
    }

    // Si no está listo, sondeamos periódicamente de forma inteligente.
    let intentos = 0;
    // Aumentamos los intentos a 300 (15 segundos) tanto para local como para producción.
    const maxIntentos = 300; 
    
    const intervalo = setInterval(() => {
      intentos++;
      if (suscribirAPIs()) {
        clearInterval(intervalo);
      } else if (intentos >= maxIntentos) {
        clearInterval(intervalo);
        console.error("[TaleSpire Simbionte] CRÍTICO: La API nativa de TaleSpire no apareció tras 15 segundos. Verifica tu instalación del juego.");
      }
    }, 50);

    return () => {
      activo = false;
      clearInterval(intervalo);
      if (timerInicializacion) clearTimeout(timerInicializacion);
      if (desuscribirSeleccion) desuscribirSeleccion();
      if (desuscribirIniciativa) desuscribirIniciativa();
    };
  }, []);
}
