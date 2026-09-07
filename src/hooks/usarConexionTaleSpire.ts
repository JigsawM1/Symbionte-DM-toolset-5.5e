/**
 * usarConexionTaleSpire.ts
 * -------------------------
 * Hook de React para gestionar la conexión del Simbiote con TaleSpire.
 *
 * Utiliza el TaleSpireAdapter centralizado para suscribirse de forma segura
 * a los eventos físicos del tablero (selección de minis, cola de iniciativa)
 * y cargar datos de campaña y rol de DM de forma síncrona/segura.
 *

 */

import { useEffect } from "react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ts, establecerCacheEsGM } from "@/utiles/TaleSpireAdapter";
import { puenteTaleSpire } from "@/servicios/puenteTaleSpire";
import type { EventoClienteTS } from "@/tipos/talespire";
import { logger } from "@/utiles/logger";

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
    let desuscribirCliente: (() => void) | null = null;
    let timerInicializacion: ReturnType<typeof setTimeout> | null = null;
    let activo = true;

    const suscribirAPIs = () => {
      if (!ts.estaDisponible) return false;

      logger.info("[TaleSpire Simbionte] Conectando escuchas y suscripciones del EventBus...");
      
      try {
        const procesarSeleccionRaw = async (seleccion: unknown) => {
          if (!activo) return;
          let data: unknown = seleccion;
          if (typeof seleccion === "string") {
            try {
              data = JSON.parse(seleccion);
            } catch {
              data = seleccion;
            }
          }

          let fragments: Array<string | { id?: string } | null | undefined> = [];
          const dataObj = data as { creatures?: Array<string | { id?: string }>; payload?: { creatures?: Array<string | { id?: string }> }; items?: Array<string | { id?: string }> } | null;
          if (Array.isArray(data)) {
            fragments = data;
          } else if (Array.isArray(dataObj?.creatures)) {
            fragments = dataObj.creatures;
          } else if (Array.isArray(dataObj?.payload?.creatures)) {
            fragments = dataObj.payload.creatures;
          } else if (Array.isArray(dataObj?.items)) {
            fragments = dataObj.items;
          }

          const ids: string[] = fragments
            .map((f) => (typeof f === "string" ? f : f?.id))
            .filter((id): id is string => typeof id === "string" && id.length > 0);

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
            actualizarSeleccionCriaturas(seleccionadas.length > 0 ? seleccionadas : ids.map((id) => ({ id, name: "Criatura Seleccionada" })));
          } catch (e) {
            logger.warn("[TaleSpire Simbionte] Error al enriquecer selección de criaturas:", e);
            actualizarSeleccionCriaturas(ids.map((id) => ({ id, name: "Criatura Seleccionada" })));
          }
        };

        // Suscribirse a la selección a través del EventBus global CEF
        const subPuente = puenteTaleSpire.on("seleccionCriaturas", (seleccion) => {
          procesarSeleccionRaw(seleccion);
        });

        // Suscribirse también mediante la API directa JS del Adaptador
        const subNativa = ts.creatures.suscribirASeleccion((datos) => {
          procesarSeleccionRaw(datos);
        });

        desuscribirSeleccion = () => {
          subPuente();
          subNativa.desuscribir();
        };

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
                  logger.warn("[TaleSpire Simbionte] Error al leer la cola física tras evento:", e);
                });
            }
          }
        });

        // Suscribirse a eventos de cambios de rol del cliente en tiempo real
        const procesarEventoCliente = (payload: EventoClienteTS) => {
          if (!activo) return;
          logger.debug("[TaleSpire Simbionte] Evento de cliente inyectado por CEF:", payload);
          // Narrowing por kind: solo clientModeChanged contiene clientMode
          const modo = payload.kind === "clientModeChanged" ? payload.clientMode : undefined;
          logger.debug("[TaleSpire Simbionte] Modo detectado en evento de cliente:", modo);
          
          if (modo === "gm") {
            establecerCacheEsGM(true);
            usarAlmacenDM.setState({ esGM: true });
          } else if (modo === "player" || modo === "spectator") {
            establecerCacheEsGM(false);
            usarAlmacenDM.setState({ esGM: false });
          } else {
            ts.clients.esGM(true).then((soyGm) => {
              if (activo) usarAlmacenDM.setState({ esGM: soyGm });
            });
          }
        };

        const subPuenteCliente = puenteTaleSpire.on("eventoCliente", procesarEventoCliente);
        const subNativaCliente = ts.clients.suscribirACambioModoCliente((modo) => {
          if (activo) {
            logger.debug("[TaleSpire Simbionte] Cambio de modo nativo detectado:", modo);
            const esGm = modo === "gm";
            establecerCacheEsGM(esGm);
            usarAlmacenDM.setState({ esGM: esGm });
          }
        });

        desuscribirCliente = () => {
          subPuenteCliente();
          subNativaCliente.desuscribir();
        };

        //  IMPORTANTE: Las llamadas "get" iniciales y la carga del blob nativo se retardan 500ms para que el canal
        // de mensajería del Simbionte quede completamente registrado antes de enviar mensajes.
        // Enviarlos de forma inmediata causa el error "outOfOrderMessage" de TaleSpire.
        timerInicializacion = setTimeout(() => {
          if (!activo) return;

          // Cargar datos persistidos ahora que la API window.TS (real o simulador) está activa y el canal es estable
          logger.info("[TaleSpire Simbionte] Canal de comunicación establecido. Iniciando carga de datos persistidos...");
          cargarDatosPersistidos();

          // Detección automática del rol nativo inicial
          ts.clients.esGM()
            .then((soyGm) => {
              if (activo) {
                logger.info(`[TaleSpire Simbionte] Rol cliente detectado al iniciar: ${soyGm ? "Dungeon Master (GM)" : "Jugador"}`);
                usarAlmacenDM.setState({ esGM: soyGm });
              }
            })
            .catch((e: unknown) => {
              logger.warn("[TaleSpire Simbionte] Error al consultar rol inicial esGM:", e);
            });

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
                } catch {
                  actualizarSeleccionCriaturas(ids.map((id) => ({ id, name: "Criatura Seleccionada" })));
                }
              }
            })
            .catch((e: unknown) => {
              logger.warn("[TaleSpire Simbionte] Error al obtener selección inicial:", e);
            });

          // Obtener la cola inicial física del tablero (Deduplicada por el Adaptador)
          ts.initiative.getQueue()
            .then((colaInicial) => {
              if (activo) {
                actualizarColaIniciativaDesdeTaleSpire(colaInicial);
              }
            })
            .catch((e: unknown) => {
              logger.warn("[TaleSpire Simbionte] Error al obtener cola de iniciativa inicial:", e);
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
                  logger.warn("[TaleSpire Simbionte] Error al obtener info del cliente (DM):", e);
                  if (activo) establecerDatosCampaña(nombreCampaña, false);
                });
            })
            .catch((e: unknown) => {
              logger.warn("[TaleSpire Simbionte] Error al obtener datos de campaña:", e);
            });
        }, 500);

        return true;
      } catch (err) {
        logger.error("[TaleSpire Simbionte] Error al suscribirse al puente de eventos de TaleSpire:", err);
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
        if (desuscribirCliente) desuscribirCliente();
      };
    }

    // Si no está listo, sondeamos periódicamente de forma inteligente.
    let intentos = 0;
    const maxIntentos = 300; 
    
    const intervalo = setInterval(() => {
      intentos++;
      if (suscribirAPIs()) {
        clearInterval(intervalo);
      } else if (intentos >= maxIntentos) {
        clearInterval(intervalo);
        logger.error("[TaleSpire Simbionte] CRÍTICO: La API nativa de TaleSpire no apareció tras 15 segundos. Verifica tu instalación del juego.");
      }
    }, 50);

    return () => {
      activo = false;
      clearInterval(intervalo);
      if (timerInicializacion) clearTimeout(timerInicializacion);
      if (desuscribirSeleccion) desuscribirSeleccion();
      if (desuscribirIniciativa) desuscribirIniciativa();
      if (desuscribirCliente) desuscribirCliente();
    };
  }, []);
}
