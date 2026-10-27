import { limpiarTiradasExpiradas, limpiarRegistrosTiradas } from "@/utiles/lanzadorDados";
import { invalidarAutoridadSync } from "@/servicios/sincronizacion/autoridadSync";
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
import { ts } from "@/utiles/TaleSpireAdapter";
import { puenteTaleSpire } from "@/servicios/puenteTaleSpire";
import { forzarFlushPersistencia } from "@/almacen/persistencia";
import type { EventoClienteTS } from "@/tipos/talespire";
import { logger } from "@/utiles/logger";
import {
  procesarMensajeSyncEntrante,
  solicitarEstadoInicial,
  inicializarObservadoresStoreSync
} from "@/servicios/sincronizacionSimbiote";

export function usarConexionTaleSpire() {
  // Extraemos las acciones del store Zustand mediante .getState() ya que son funciones
  // inmutables. Esto evita que este hook se vuelva a evaluar y suscriba al render-tree
  // ante cambios ajenos del estado (como la ronda de combate, notas o tareas pendientes).
  const {
    cargarDatosPersistidos,
    actualizarSeleccionCriaturas,
    actualizarColaIniciativaDesdeTaleSpire,
    establecerDatosCampaña,
    establecerEsGM,
    establecerIdClienteDM
  } = usarAlmacenDM.getState();

  useEffect(() => {
    let desuscribirSeleccion: (() => void) | null = null;
    let desuscribirIniciativa: (() => void) | null = null;
    let desuscribirCliente: (() => void) | null = null;
    let desuscribirSync: (() => void) | null = null;
    let desuscribirEstadoCriatura: (() => void) | null = null;
    let desuscribirEstadoSimbionte: (() => void) | null = null;
    let desuscribirObservadoresSync: (() => void) | null = null;
    let timerInicializacion: ReturnType<typeof setTimeout> | null = null;
    let activo = true;
    const timerTiradas = setInterval(() => limpiarTiradasExpiradas(), 60000);

    // Manejador defensivo de flush síncrono al descargar la ventana CEF
    const ejecutarFlushEmergencia = () => {
      logger.info("[TaleSpire Simbionte] Ejecutando flush defensivo de emergencia por descarga de ventana...");
      void forzarFlushPersistencia(usarAlmacenDM.getState());
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", ejecutarFlushEmergencia);
      window.addEventListener("pagehide", ejecutarFlushEmergencia);
    }

    const suscribirAPIs = () => {
      if (!ts.estaDisponible) return false;
      puenteTaleSpire.activar();

      logger.info("[TaleSpire Simbionte] Conectando escuchas y suscripciones del EventBus...");
      
      try {
        const procesarSeleccionRaw = async (seleccion: unknown) => {
          if (!activo) return;
          let data: unknown = seleccion;
          if (typeof seleccion === "string") {
            try {
              data = JSON.parse(seleccion);
            } catch (err) {
              logger.debug("[usarConexionTaleSpire] Selección no es JSON string válido, usando selección cruda:", err);
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
              maxHp: c.hp?.max,
              esDeJugador: Array.isArray(c.ownerIds) && c.ownerIds.length > 0
            }));
            actualizarSeleccionCriaturas(seleccionadas.length > 0 ? seleccionadas : ids.map((id) => ({ id, name: "Criatura Seleccionada" })));

            // Sincronizar posición física de miniatura para personajes que aún no tengan posicion base
            const estadoActual = usarAlmacenDM.getState();
            info.forEach((c) => {
              if (c.position) {
                const pj = estadoActual.personajes.find(
                  (p) =>
                    (p.idMiniaturaTS &&
                      (p.idMiniaturaTS === c.id || p.idMiniaturaTS.toLowerCase() === c.id.toLowerCase())) ||
                    p.id === c.id
                );
                if (pj && !pj.ultimaPosicionTS) {
                  estadoActual.establecerPosicionInicialTSPersonaje(pj.id, c.position, c.boardId);
                } else if (!pj) {
                  // Buscar si la criatura seleccionada corresponde a un acompañante de algún personaje
                  for (const p of estadoActual.personajes) {
                    const acomp = (p.acompanantes || []).find(
                      (a) =>
                        a.idMiniaturaTS &&
                        (a.idMiniaturaTS === c.id || a.idMiniaturaTS.toLowerCase() === c.id.toLowerCase())
                    );
                    if (acomp && !acomp.ultimaPosicionTS) {
                      estadoActual.establecerPosicionInicialTSAcompanante(p.id, acomp.id, c.position, c.boardId);
                      break;
                    }
                  }
                }
              }
            });
          } catch (e) {
            logger.warn("[TaleSpire Simbionte] Error al enriquecer selección de criaturas:", e);
            actualizarSeleccionCriaturas(ids.map((id) => ({ id, name: "Criatura Seleccionada" })));
          }
        };

        // Suscribirse a la selección exclusivamente a través del EventBus global CEF para evitar doble ejecución
        const subPuente = puenteTaleSpire.on("seleccionCriaturas", (seleccion) => {
          procesarSeleccionRaw(seleccion);
        });

        desuscribirSeleccion = () => {
          subPuente();
        };

        // Función auxiliar para procesar cola de iniciativa con detección nativa de propietarios (ownerIds)
        const procesarColaConDeteccion = async (cola: import("@/tipos/talespire").ColaIniciativaTS | null) => {
          if (!cola) {
            actualizarColaIniciativaDesdeTaleSpire(null);
            return;
          }
          const ids = (cola.items || []).map((i) => i.id);
          let minisJugadores: Set<string> | undefined = undefined;
          if (ids.length > 0) {
            try {
              minisJugadores = await ts.creatures.detectarMiniaturasJugadores(ids);
            } catch (e) {
              logger.warn("[usarConexionTaleSpire] Error detectando miniaturas de jugadores:", e);
            }
          }
          actualizarColaIniciativaDesdeTaleSpire(cola, minisJugadores);
        };

        // Suscribirse a los cambios en la cola de iniciativa a través del puente EventBus
        desuscribirIniciativa = puenteTaleSpire.on("iniciativaActualizada", (payload) => {
          if (activo) {
            if (payload && payload.queue) {
              void procesarColaConDeteccion(payload.queue);
            } else {
              ts.initiative.getQueue()
                .then((colaTS) => {
                  void procesarColaConDeteccion(colaTS);
                })
                .catch((e: unknown) => {
                  logger.warn("[TaleSpire Simbionte] Error al leer la cola física tras evento:", e);
                });
            }
          }
        });

        // Suscribirse a eventos de cambios de rol del cliente en tiempo real
        const procesarEventoCliente = (payload: EventoClienteTS) => {
          invalidarAutoridadSync();
          if (!activo) return;
          logger.debug("[TaleSpire Simbionte] Evento de cliente inyectado por CEF:", payload);
          void ts.clients.esGM(true).then(soyGm => {
            if (!activo) return;
            establecerEsGM(soyGm);
            if (!soyGm) solicitarEstadoInicial();
          }).catch(error => logger.warn('[Sync] No se pudo verificar el cambio de rol:', error));
        };

        const subPuenteCliente = puenteTaleSpire.on("eventoCliente", procesarEventoCliente);
        const subNativaCliente = ts.clients.suscribirACambioModoCliente(() => {
          invalidarAutoridadSync();
          void ts.clients.esGM(true).then(soyGm => {
            if (!activo) return;
            establecerEsGM(soyGm);
            if (!soyGm) solicitarEstadoInicial();
          });
        });

        desuscribirCliente = () => {
          subPuenteCliente();
          subNativaCliente.desuscribir();
        };

        // Suscribirse a mensajes del canal de sincronización bidireccional a través del EventBus centralizado
        const subPuenteSync = puenteTaleSpire.on("mensajeSync", (payload) => {
          if (activo) {
            procesarMensajeSyncEntrante(payload);
          }
        });

        // Suscribirse también al listener nativo de TS.sync.onSyncMessage (API oficial v0.1)
        const subNativaSync = ts.sync.suscribirAMensajesSync((payload) => {
          if (activo && payload?.str) {
            let datos: unknown = null;
            try {
              datos = JSON.parse(payload.str);
            } catch (err) {
              logger.debug("[usarConexionTaleSpire] Error parseando JSON en subNativaSync:", err);
              datos = null;
            }
            if (datos) {
              procesarMensajeSyncEntrante({
                datos,
                strCrudo: payload.str,
                fromClient: payload.fromClient,
              });
            }
          }
        });

        desuscribirSync = () => {
          subPuenteSync();
          subNativaSync.desuscribir();
        };

        // Escuchar eventos de ciclo de vida del Simbionte (H-06: persistencia inmediata en willShutdown)
        const subPuenteEstadoSimbionte = puenteTaleSpire.on("estadoSimbionte", (evento) => {
          if (!activo) return;
          logger.debug("[TaleSpire Simbionte] Evento de estado de simbionte recibido:", evento);
          if (evento?.kind === "willShutdown") {
            logger.info("[TaleSpire Simbionte] Apagado inminente (willShutdown) detectado. Forzando persistencia síncrona...");
            void forzarFlushPersistencia(usarAlmacenDM.getState());
          }
        });

        desuscribirEstadoSimbionte = () => {
          subPuenteEstadoSimbionte();
        };

        const movimientosRecientes = new Map<string, number>();
        const VENTANA_DEDUP_MOVIMIENTO_MS = 100;

        // Suscribirse a cambios de estado de criatura (movimiento físico de miniaturas en TaleSpire)
        const procesarEventoMovimiento = async (evento: import("@/tipos/talespire").EventoCriaturaTS) => {
          if (!activo || !evento) return;

          if (evento.kind === "creatureLocationChanged") {
            const idStr = typeof evento.id === "string" ? evento.id : (evento.id as { id?: string })?.id || "";
            if (!idStr || !evento.position) return;

            // Deduplicación de eventos concurrentes generados simultáneamente por el puente CEF y la API nativa
            const claveMovimiento = `${idStr.toLowerCase()}:${evento.position.x.toFixed(3)}:${evento.position.y.toFixed(3)}:${evento.position.z.toFixed(3)}`;
            const ahora = Date.now();
            const prevMov = movimientosRecientes.get(claveMovimiento);
            if (prevMov !== undefined && ahora - prevMov < VENTANA_DEDUP_MOVIMIENTO_MS) {
              return;
            }
            movimientosRecientes.set(claveMovimiento, ahora);
            if (movimientosRecientes.size > 50) {
              for (const [k, tsVal] of movimientosRecientes) {
                if (ahora - tsVal > VENTANA_DEDUP_MOVIMIENTO_MS * 2) {
                  movimientosRecientes.delete(k);
                }
              }
            }

            logger.info("[TaleSpire Simbionte] Movimiento de criatura detectado:", evento.id, evento.position);

            const estado = usarAlmacenDM.getState();
            const personajes = estado.personajes;

            // 1. Coincidencia por idMiniaturaTS (case-insensitive)
            let personajeVinculado = personajes.find(
              (p) =>
                p.idMiniaturaTS &&
                (p.idMiniaturaTS === idStr || p.idMiniaturaTS.toLowerCase() === idStr.toLowerCase())
            );

            // 2. Coincidencia por id del personaje
            if (!personajeVinculado) {
              personajeVinculado = personajes.find((p) => p.id === idStr);
            }

            // 3. Búsqueda en acompañantes de personajes
            let acompananteVinculado: { personajeId: string; acompId: string; multiplicadorTerreno: number } | null = null;
            if (!personajeVinculado) {
              for (const p of personajes) {
                const acomp = (p.acompanantes || []).find(
                  (a) =>
                    a.idMiniaturaTS &&
                    (a.idMiniaturaTS === idStr || a.idMiniaturaTS.toLowerCase() === idStr.toLowerCase())
                );
                if (acomp) {
                  acompananteVinculado = {
                    personajeId: p.id,
                    acompId: acomp.id,
                    multiplicadorTerreno: acomp.multiplicadorTerreno || 1
                  };
                  break;
                }
              }
            }

            if (!personajeVinculado && !acompananteVinculado) {
              logger.debug("[TaleSpire Simbionte] Movimiento ignorado: la criatura no coincide con ningún PJ ni acompañante:", idStr);
              return;
            }

            let numberPerTile = 5;
            try {
              const unidades = await ts.units.getDistanceUnitsForThisCampaign();
              if (unidades && typeof unidades.numberPerTile === "number") {
                numberPerTile = unidades.numberPerTile;
              }
            } catch (errUnidades) {
              logger.debug("[usarConexionTaleSpire] Fallback a 5 ft en units:", errUnidades);
              numberPerTile = 5;
            }

            if (personajeVinculado) {
              estado.registrarMovimientoTSPersonaje(
                personajeVinculado.id,
                evento.position,
                evento.boardId,
                {
                  numberPerTile,
                  incluirAltura: true,
                  multiplicadorTerreno: personajeVinculado.multiplicadorTerreno || 1,
                  redondearA5Pies: false,
                  umbralRuidoPies: 0.05
                }
              );
            } else if (acompananteVinculado) {
              estado.registrarMovimientoTSAcompanante(
                acompananteVinculado.personajeId,
                acompananteVinculado.acompId,
                evento.position,
                evento.boardId,
                {
                  numberPerTile,
                  incluirAltura: true,
                  multiplicadorTerreno: acompananteVinculado.multiplicadorTerreno || 1,
                  redondearA5Pies: false,
                  umbralRuidoPies: 0.05
                }
              );
            }
          }
        };

        const subPuenteCriatura = puenteTaleSpire.on("estadoCriatura", evento => {
          if (evento.kind === "creatureOwnersChanged") invalidarAutoridadSync();
          procesarEventoMovimiento(evento);
        });
        const subNativaCriatura = ts.creatures.suscribirACambioEstadoCriatura(procesarEventoMovimiento);

        desuscribirEstadoCriatura = () => {
          subPuenteCriatura();
          subNativaCriatura.desuscribir();
        };

        //  IMPORTANTE: Las llamadas "get" iniciales y la carga del blob nativo se retardan 500ms para que el canal
        // de mensajería del Simbionte quede completamente registrado antes de enviar mensajes.
        // Enviarlos de forma inmediata causa el error "outOfOrderMessage" de TaleSpire.
        timerInicializacion = setTimeout(() => {
          if (!activo) return;

          // Cargar datos persistidos ahora que la API window.TS (real o simulador) está activa y el canal es estable
          logger.info("[TaleSpire Simbionte] Canal de comunicación establecido. Iniciando carga de datos persistidos...");
          cargarDatosPersistidos();

          // Precargar posiciones físicas iniciales para personajes y acompañantes con miniatura vinculada
          setTimeout(() => {
            if (!activo) return;
            const estadoActual = usarAlmacenDM.getState();
            const minisPJ = estadoActual.personajes
              .filter((p) => p.idMiniaturaTS && !p.ultimaPosicionTS)
              .map((p) => ({ tipo: "pj" as const, pjId: p.id, acompId: "", miniId: p.idMiniaturaTS! }));

            const minisAcomp: { tipo: "acomp"; pjId: string; acompId: string; miniId: string }[] = [];
            estadoActual.personajes.forEach((p) => {
              (p.acompanantes || []).forEach((a) => {
                if (a.idMiniaturaTS && !a.ultimaPosicionTS) {
                  minisAcomp.push({ tipo: "acomp", pjId: p.id, acompId: a.id, miniId: a.idMiniaturaTS });
                }
              });
            });

            const minisAPrecargar = [...minisPJ, ...minisAcomp];

            if (minisAPrecargar.length > 0) {
              const idsMinis = minisAPrecargar.map((m) => m.miniId);
              ts.creatures
                .getMoreInfo(idsMinis)
                .then((infos) => {
                  if (infos && Array.isArray(infos)) {
                    infos.forEach((info) => {
                      const item = minisAPrecargar.find(
                        (m) =>
                          m.miniId === info.id ||
                          m.miniId.toLowerCase() === info.id?.toLowerCase()
                      );
                      if (item && info.position) {
                        if (item.tipo === "pj") {
                          logger.info(
                            `[TaleSpire Simbionte] Posición física inicial precargada para PJ '${item.pjId}':`,
                            info.position
                          );
                          usarAlmacenDM
                            .getState()
                            .establecerPosicionInicialTSPersonaje(
                              item.pjId,
                              info.position,
                              info.boardId
                            );
                        } else {
                          logger.info(
                            `[TaleSpire Simbionte] Posición física inicial precargada para Acompañante '${item.acompId}' (PJ '${item.pjId}'):`,
                            info.position
                          );
                          usarAlmacenDM
                            .getState()
                            .establecerPosicionInicialTSAcompanante(
                              item.pjId,
                              item.acompId,
                              info.position,
                              info.boardId
                            );
                        }
                      }
                    });
                  }
                })
                .catch((e) => {
                  logger.debug("[TaleSpire Simbionte] Error al precargar posiciones iniciales:", e);
                });
            }
          }, 600);

          // Detección automática del rol nativo inicial
          ts.clients.esGM()
            .then(async (soyGm) => {
              if (activo) {
                logger.info(`[TaleSpire Simbionte] Rol cliente detectado al iniciar: ${soyGm ? "Dungeon Master (GM)" : "Jugador"}`);
                establecerEsGM(soyGm);
                if (soyGm) {
                  const miId = await ts.clients.obtenerClientId();
                  establecerIdClienteDM(miId);
                } else {
                  solicitarEstadoInicial();
                }
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
                } catch (error) {
                  logger.warn("[usarConexionTaleSpire] Error al solicitar información enriquecida de miniaturas a TaleSpire:", error);
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
                void procesarColaConDeteccion(colaInicial);
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

          // Inicializar observadores reactivos de sincronización de combate
          if (desuscribirObservadoresSync) {
            desuscribirObservadoresSync();
          }
          desuscribirObservadoresSync = inicializarObservadoresStoreSync();

          // Si el cliente es jugador, solicita snapshot inicial de combate al DM
          ts.clients.esGM()
            .then((soyGm) => {
              if (activo && !soyGm) {
                solicitarEstadoInicial();
              }
            })
            .catch((e: unknown) => {
              logger.debug("[TaleSpire Simbionte] Error verificando rol para solicitud inicial:", e);
            });
        }, 500);

        return true;
      } catch (err) {
        logger.error("[TaleSpire Simbionte] Error al suscribirse al puente de eventos de TaleSpire:", err);
        return false;
      }
    };

    // ponytail: una sola limpieza para la suscripción inmediata y el sondeo.
    let intervalo: ReturnType<typeof setInterval> | null = null;
    if (!suscribirAPIs()) {
      // 16 intentos x 250ms = 4 segundos de espera máxima para inyección CEF.
      let intentos = 0;
      const maxIntentos = 16;
      intervalo = setInterval(() => {
        intentos++;
        if (suscribirAPIs()) {
          if (intervalo !== null) clearInterval(intervalo);
        } else if (intentos >= maxIntentos) {
          if (intervalo !== null) clearInterval(intervalo);
          logger.warn("[TaleSpire Simbionte] La API nativa de TaleSpire no apareció. Operando en modo desconectado o navegador estándar. Cargando datos desde almacenamiento local...");
          if (activo) {
            cargarDatosPersistidos();
          }
        }
      }, 250);
    }

    return () => {
      activo = false;
      clearInterval(timerTiradas); limpiarRegistrosTiradas();
      if (intervalo !== null) clearInterval(intervalo);
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", ejecutarFlushEmergencia);
        window.removeEventListener("pagehide", ejecutarFlushEmergencia);
      }
      if (timerInicializacion) clearTimeout(timerInicializacion);
      if (desuscribirSeleccion) desuscribirSeleccion();
      if (desuscribirIniciativa) desuscribirIniciativa();
      if (desuscribirCliente) desuscribirCliente();
      if (desuscribirSync) desuscribirSync();
      if (desuscribirEstadoCriatura) desuscribirEstadoCriatura();
      if (desuscribirEstadoSimbionte) desuscribirEstadoSimbionte();
      if (desuscribirObservadoresSync) desuscribirObservadoresSync();
      puenteTaleSpire.destruir();
    };
  }, []);
}
