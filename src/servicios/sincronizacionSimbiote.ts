/**
 * @module sincronizacionSimbiote
 * Motor de sincronización bidireccional en tiempo real entre instancias del Simbiote (DM y Jugadores).
 * Garantiza autoridad del estado en el DM, proyecciones ligeras de los PJs,
 * debounce de ráfagas de red y particionado seguro de paquetes.
 */

import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ts } from "@/utiles/TaleSpireAdapter";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { FragmentoCliente } from "@/tipos/talespire";
import {
  type EstadoCombatePJ,
  type EstadoIniciativaDM,
  type WireChunkIniciativa,
  type WireEstadoIniciativaDM,
  EsquemaWireMensajeSync,
  serializarEstadoCombatePJ,
  deserializarEstadoCombatePJ,
  serializarIniciativaDM,
  deserializarIniciativaDM,
  dividirEnChunksIniciativa,
} from "@/tipos/sync";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";
import { logger } from "@/utiles/logger";

const RETARDO_DEBOUNCE_GM_MS = 250;
const RETARDO_DEBOUNCE_PJ_MS = 150;
const LIMITE_TAMANO_SEGURO_BYTES = 380;

let timerDebounceGM: ReturnType<typeof setTimeout> | null = null;
let timerDebouncePJ: ReturnType<typeof setTimeout> | null = null;

// Búfer para deduplicar mensajes recibidos concurrentemente por el EventBus y suscripciones nativas
// Emplea una ventana temporal de 250ms para no bloquear estados idénticos a lo largo de rondas sucesivas
const mensajesProcesadosRecientes = new Map<string, number>();
const VENTANA_DEDUPLICACION_MS = 250;

function esMensajeDuplicado(strCrudo: string): boolean {
  if (!strCrudo) return false;
  const ahora = Date.now();
  const timestampPrevio = mensajesProcesadosRecientes.get(strCrudo);
  if (timestampPrevio !== undefined && ahora - timestampPrevio < VENTANA_DEDUPLICACION_MS) {
    return true;
  }
  if (mensajesProcesadosRecientes.size > 100) {
    for (const [k, v] of mensajesProcesadosRecientes.entries()) {
      if (ahora - v > VENTANA_DEDUPLICACION_MS * 2) {
        mensajesProcesadosRecientes.delete(k);
      }
    }
  }
  mensajesProcesadosRecientes.set(strCrudo, ahora);
  return false;
}

// Búfer para reensamblar chunks de iniciativa
const bufferChunksIniciativa = new Map<number, WireChunkIniciativa>();
let timerLimpiezaBuffer: ReturnType<typeof setTimeout> | null = null;

/**
 * Construye una proyección delgada de combate de un PersonajeJugador.
 * Resuelve CA y pasivas mediante calcularEstadisticasPersonaje.
 */
export function proyectarEstadoCombatePJ(pj: PersonajeJugador): EstadoCombatePJ {
  const stats = calcularEstadisticasPersonaje(pj);
  const estado = usarAlmacenDM.getState();

  // Buscar si el combatiente ya tiene un valor de iniciativa registrado en la cola
  const criaturaCola = estado.colaIniciativa.find(
    (c) =>
      c.id === pj.id ||
      (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
      coincidenNombresTaleSpire(c.nombre, pj.nombre)
  );

  const iniciativaFinal =
    criaturaCola?.iniciativa !== undefined
      ? criaturaCola.iniciativa
      : (stats.modificadores?.destreza || 0) + (pj.iniciativaBono || 0);

  return {
    id: pj.id,
    idMiniaturaTS: pj.idMiniaturaTS,
    nombre: pj.nombre,
    iniciativa: iniciativaFinal,
    hpActual: pj.hpActual,
    hpMaximo: pj.hpMaximo,
    hpTemporal: pj.hpTemporal,
    ca: stats.claseArmadura?.total ?? pj.ca ?? 10,
    condiciones: pj.condicionesActivas || [],
    efectos: (pj.efectosActivos || []).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      expiraRonda: e.expiraRonda,
      concentracion: e.concentracion,
      duracion: e.duracion,
    })),
    pasivas: {
      percepcion: stats.pasivas?.percepcion ?? 10,
      investigacion: stats.pasivas?.investigacion ?? 10,
      perspicacia: stats.pasivas?.perspicacia ?? 10,
    },
    conjuros: {
      espaciosMaximos: pj.espaciosConjuroMaximos || {},
      espaciosGastados: pj.espaciosConjuroGastados || {},
      puntosMaximos: pj.puntosConjuroMaximos,
      puntosGastados: pj.puntosConjuroGastados,
      pacto: pj.espaciosPactoMaximos
        ? {
            maximos: pj.espaciosPactoMaximos,
            gastados: pj.espaciosPactoGastados,
            nivel: pj.nivelEspacioPacto,
          }
        : undefined,
    },
    concentracion: pj.concentracionActiva
      ? {
          hechizoId: pj.concentracionActiva.hechizoId,
          nombreHechizo: pj.concentracionActiva.nombreHechizo,
        }
      : null,
    movimientoGastado: pj.movimientoGastado,
    movimientoMaximoTemporal: pj.movimientoMaximoTemporal,
    acompanantes: (pj.acompanantes || []).map((a) => {
      const criaturaColaAcomp = (estado.colaIniciativa || []).find(
        (c) =>
          c.id === a.id ||
          c.idAcompanante === a.id ||
          (a.idMiniaturaTS && c.id === a.idMiniaturaTS) ||
          coincidenNombresTaleSpire(c.nombre, a.nombre)
      );
      const iniciativaFinalAcomp =
        criaturaColaAcomp?.iniciativa !== undefined
          ? criaturaColaAcomp.iniciativa
          : typeof a.iniciativa === "number"
          ? a.iniciativa
          : 0;

      return {
        id: a.id,
        nombre: a.nombre,
        idPlantilla: a.idPlantilla,
        vidaActual: a.vidaActual,
        vidaMaxima: a.vidaMaxima,
        vidaTemporal: a.vidaTemporal,
        ca: a.ca,
        condiciones: a.condiciones || [],
        efectos: (a.efectos || []).map((ef) => ({
          id: ef.id,
          nombre: ef.nombre,
          expiraRonda: ef.expiraRonda,
          concentracion: ef.concentracion,
          duracion: ef.duracion,
        })),
        iniciativa: iniciativaFinalAcomp,
        idMiniaturaTS: a.idMiniaturaTS,
        velocidad: typeof a.velocidad === "string" ? a.velocidad : `${a.velocidad?.caminar || 0} pies`,
        movimientoGastado: a.movimientoGastado,
        movimientoMaximoTemporal: a.movimientoMaximoTemporal,
        esInvocacion: a.esInvocacion,
        nivelConjuroInvocacion: a.nivelConjuroInvocacion,
        subtipoInvocacion: a.subtipoInvocacion,
      };
    }),
  };
}

/**
 * Emite el estado consolidado de la iniciativa desde el DM hacia todos los clientes.
 * Implementa debounce de 400ms y particionado automático si excede el tamaño seguro.
 */
export function emitirEstadoComoGM(): void {
  if (timerDebounceGM) {
    clearTimeout(timerDebounceGM);
  }

  timerDebounceGM = setTimeout(() => {
    const estado = usarAlmacenDM.getState();
    if (!estado.esGM || estado.aplicandoSync) return;

    const datosDM: EstadoIniciativaDM = {
      cola: estado.colaIniciativa,
      indiceTurnoActivo: estado.indiceTurnoActivo,
      rondaActual: estado.rondaActual,
      mostrarPorcentajeVidaAJugadores: estado.mostrarPorcentajeVidaAJugadores,
      metodoVidaMonstruo: estado.metodoVidaMonstruo,
    };

    const wire = serializarIniciativaDM(datosDM);
    const mensajeJSON = JSON.stringify({ v: 1, t: "DM", d: wire });

    if (mensajeJSON.length <= LIMITE_TAMANO_SEGURO_BYTES) {
      logger.debug(`[Sync] Emitiendo ESTADO_INICIATIVA_DM (${mensajeJSON.length} bytes)`);
      void ts.sync.send(mensajeJSON, "board");
    } else {
      logger.warn(`[Sync] Cola excede tamaño seguro (${mensajeJSON.length}b). Particionando en chunks...`);
      const chunks = dividirEnChunksIniciativa(wire, LIMITE_TAMANO_SEGURO_BYTES);
      chunks.forEach((chunk) => {
        const chunkJSON = JSON.stringify({ v: 1, t: "DM_CHUNK", d: chunk });
        void ts.sync.send(chunkJSON, "board");
      });
    }
  }, RETARDO_DEBOUNCE_GM_MS);
}

/**
 * Emite la proyección de un personaje del jugador hacia el DM.
 * Implementa debounce de 150ms.
 */
export function emitirMiPersonaje(personajeId?: string): void {
  if (timerDebouncePJ) {
    clearTimeout(timerDebouncePJ);
  }

  timerDebouncePJ = setTimeout(() => {
    const estado = usarAlmacenDM.getState();
    if (estado.esGM || estado.aplicandoSync) return;

    const pjAEmitir = personajeId
      ? estado.personajes.find((p) => p.id === personajeId)
      : (estado.personajes.find((p) => p.id === estado.idPersonajeActivo) || estado.personajes[0]);

    if (!pjAEmitir) {
      logger.debug("[Sync] No hay personaje para emitir.");
      return;
    }

    const dto = proyectarEstadoCombatePJ(pjAEmitir);
    const wire = serializarEstadoCombatePJ(dto);
    const mensajeJSON = JSON.stringify({ v: 1, t: "PJ", d: wire });

    logger.debug(`[Sync] Emitiendo ESTADO_PJ (${pjAEmitir.nombre}, ${mensajeJSON.length} bytes)`);
    void ts.sync.send(mensajeJSON, "board");
  }, RETARDO_DEBOUNCE_PJ_MS);
}

/**
 * Envía una solicitud al DM para recibir el snapshot actual de combate.
 */
export function solicitarEstadoInicial(): void {
  const estado = usarAlmacenDM.getState();
  if (estado.esGM) return;

  logger.info("[Sync] Enviando SOLICITUD_ESTADO al DM...");
  void ts.sync.send(JSON.stringify({ v: 1, t: "REQ" }), "board");
}

/**
 * Procesa mensajes de sincronización entrantes recibidos a través del EventBus.
 */
export function procesarMensajeSyncEntrante(evento: {
  datos: unknown;
  strCrudo: string;
  fromClient?: FragmentoCliente;
}): void {
  if (esMensajeDuplicado(evento.strCrudo)) {
    logger.debug("[Sync] Mensaje duplicado omitido por deduplicador de bus");
    return;
  }

  const parseo = EsquemaWireMensajeSync.safeParse(evento.datos);

  if (!parseo.success) {
    logger.warn("[Sync] Mensaje descartado por validación de esquema:", parseo.error.format(), evento.datos);
    return;
  }

  const mensaje = parseo.data;
  const estado = usarAlmacenDM.getState();

  switch (mensaje.t) {
    case "REQ": {
      // Si somos el DM, respondemos de inmediato con el snapshot de combate
      if (estado.esGM) {
        logger.info("[Sync] Solicitud de estado recibida. Respondiendo snapshot...");
        emitirEstadoComoGM();
      }
      break;
    }

    case "DM": {
      // Solo los jugadores aplican el estado del DM
      if (!estado.esGM) {
        logger.info("[Sync] Aplicando ESTADO_INICIATIVA_DM recibido del DM...");
        const datosIniciativa = deserializarIniciativaDM(mensaje.d);
        estado.aplicarIniciativaDesdeSync(datosIniciativa);
      }
      break;
    }

    case "DM_CHUNK": {
      // Reensamblado de ráfagas para jugadores
      if (!estado.esGM) {
        const chunk = mensaje.d;
        if (chunk.chunk === 1) {
          bufferChunksIniciativa.clear();
        }
        bufferChunksIniciativa.set(chunk.chunk, chunk);

        if (timerLimpiezaBuffer) clearTimeout(timerLimpiezaBuffer);
        timerLimpiezaBuffer = setTimeout(() => {
          bufferChunksIniciativa.clear();
        }, 4000);

        if (bufferChunksIniciativa.size >= chunk.total) {
          const listaOrdenada = Array.from(bufferChunksIniciativa.values()).sort(
            (a, b) => a.chunk - b.chunk
          );
          const wireCompleto: WireEstadoIniciativaDM = {
            t: chunk.t,
            r: chunk.r,
            v: chunk.v,
            mv: chunk.mv,
            c: listaOrdenada.flatMap((ch) => ch.c),
          };
          bufferChunksIniciativa.clear();
          const datosIniciativa = deserializarIniciativaDM(wireCompleto);
          estado.aplicarIniciativaDesdeSync(datosIniciativa);
        }
      }
      break;
    }

    case "PJ": {
      // Solo el DM recibe y aplica actualizaciones de personajes de jugadores
      if (estado.esGM) {
        const dto = deserializarEstadoCombatePJ(mensaje.d);
        estado.actualizarPersonajeDesdeSync(dto);
        // Redistribuir consolidado a toda la mesa
        emitirEstadoComoGM();
      }
      break;
    }
  }
}

function obtenerFirmaAcompanantes(
  acompanantes?: PersonajeJugador["acompanantes"],
  cola: CriaturaIniciativa[] = []
): string {
  if (!acompanantes || acompanantes.length === 0) return "";
  return acompanantes
    .map((a) => {
      const criaturaColaAcomp = cola.find(
        (c) =>
          c.id === a.id ||
          c.idAcompanante === a.id ||
          (a.idMiniaturaTS && c.id === a.idMiniaturaTS) ||
          coincidenNombresTaleSpire(c.nombre, a.nombre)
      );
      const inic =
        criaturaColaAcomp?.iniciativa !== undefined
          ? criaturaColaAcomp.iniciativa
          : typeof a.iniciativa === "number"
          ? a.iniciativa
          : 0;

      return `${a.id}:${a.nombre}:${inic}:${a.vidaActual}:${a.vidaMaxima}:${a.vidaTemporal}:${a.ca}:${(a.condiciones || []).slice().sort().join(",")}:${(a.efectos || []).map((e) => `${e.id}:${e.nombre}:${e.expiraRonda}:${e.concentracion}`).join(",")}:${a.movimientoGastado}:${a.movimientoMaximoTemporal}:${a.idMiniaturaTS}:${a.nivelConjuroInvocacion}:${a.subtipoInvocacion}`;
    })
    .join("|");
}

function calcularFirmaPJ(pj: PersonajeJugador, cola: CriaturaIniciativa[]): string {
  const criaturaCola = cola.find(
    (c) =>
      !c.esAcompanante &&
      (c.id === pj.id ||
        c.idPersonajeDuenio === pj.id ||
        (pj.idMiniaturaTS && c.id === pj.idMiniaturaTS) ||
        coincidenNombresTaleSpire(c.nombre, pj.nombre))
  );
  const stats = calcularEstadisticasPersonaje(pj);
  const inic =
    criaturaCola?.iniciativa !== undefined
      ? criaturaCola.iniciativa
      : (stats.modificadores?.destreza || 0) + (pj.iniciativaBono || 0);

  const condStr = (pj.condicionesActivas || []).slice().sort().join(",");
  const efStr = (pj.efectosActivos || []).map((e) => `${e.id}:${e.nombre}:${e.expiraRonda}:${e.concentracion}`).join(",");
  const concStr = pj.concentracionActiva
    ? `${pj.concentracionActiva.hechizoId}:${pj.concentracionActiva.nombreHechizo}`
    : "";
  const movGastado = pj.movimientoGastado ?? 0;
  const movMaxT = pj.movimientoMaximoTemporal ?? null;
  const acompsStr = obtenerFirmaAcompanantes(pj.acompanantes, cola);

  return `${pj.id}:${pj.nombre}:${pj.hpActual}:${pj.hpMaximo}:${pj.hpTemporal}:${pj.ca}:${inic}:${condStr}:${efStr}:${concStr}:${movGastado}:${movMaxT}:${pj.idMiniaturaTS}:${acompsStr}`;
}

export function calcularFirmaIniciativaDM(
  cola: CriaturaIniciativa[],
  turno: number,
  ronda: number,
  mostrarVida: boolean,
  metodoVida: string
): string {
  const colaStr = cola
    .map(
      (c) =>
        `${c.id}:${c.iniciativa}:${c.vidaActual}:${c.vidaMaxima}:${c.vidaTemporal || 0}:${c.ca || 10}:${Boolean(c.esMonstruo)}:${Boolean(c.esAcompanante)}:${(c.condiciones || []).slice().sort().join(",")}:${(c.efectos || []).map((e) => `${e.id}:${e.nombre}:${e.expiraRonda}:${e.concentracion}`).join(",")}`
    )
    .join("|");
  return `${turno}:${ronda}:${mostrarVida ? 1 : 0}:${metodoVida}:${colaStr}`;
}

/**
 * Inicializa los observadores reactivos del store Zustand.
 * Monitorea cambios locales para emitir sincronizaciones según el rol activo.
 */
export function inicializarObservadoresStoreSync(): () => void {
  logger.info("[Sync] Inicializando observadores reactivos del store de combate...");

  const estadoInicial = usarAlmacenDM.getState();
  let prevFirmaDM = calcularFirmaIniciativaDM(
    estadoInicial.colaIniciativa,
    estadoInicial.indiceTurnoActivo,
    estadoInicial.rondaActual,
    estadoInicial.mostrarPorcentajeVidaAJugadores,
    estadoInicial.metodoVidaMonstruo
  );

  const prevFirmasPJs = new Map<string, string>();
  estadoInicial.personajes.forEach((pj) => {
    prevFirmasPJs.set(pj.id, calcularFirmaPJ(pj, estadoInicial.colaIniciativa));
  });

  const unsub = usarAlmacenDM.subscribe((estadoActual) => {
    if (estadoActual.aplicandoSync) {
      estadoActual.personajes.forEach((pj) => {
        prevFirmasPJs.set(pj.id, calcularFirmaPJ(pj, estadoActual.colaIniciativa));
      });

      if (estadoActual.esGM) {
        prevFirmaDM = calcularFirmaIniciativaDM(
          estadoActual.colaIniciativa,
          estadoActual.indiceTurnoActivo,
          estadoActual.rondaActual,
          estadoActual.mostrarPorcentajeVidaAJugadores,
          estadoActual.metodoVidaMonstruo
        );
      }
      return;
    }

    if (estadoActual.esGM) {
      // ── Observación del DM ──
      const firmaActualDM = calcularFirmaIniciativaDM(
        estadoActual.colaIniciativa,
        estadoActual.indiceTurnoActivo,
        estadoActual.rondaActual,
        estadoActual.mostrarPorcentajeVidaAJugadores,
        estadoActual.metodoVidaMonstruo
      );

      if (firmaActualDM !== prevFirmaDM) {
        prevFirmaDM = firmaActualDM;
        emitirEstadoComoGM();
      }
    } else {
      // ── Observación del Jugador ──
      for (const pj of estadoActual.personajes) {
        const firmaActual = calcularFirmaPJ(pj, estadoActual.colaIniciativa);
        const firmaPrevia = prevFirmasPJs.get(pj.id);

        if (firmaActual !== firmaPrevia) {
          prevFirmasPJs.set(pj.id, firmaActual);
          emitirMiPersonaje(pj.id);
        }
      }
    }
  });

  return () => {
    unsub();
    if (timerDebounceGM) clearTimeout(timerDebounceGM);
    if (timerDebouncePJ) clearTimeout(timerDebouncePJ);
    if (timerLimpiezaBuffer) clearTimeout(timerLimpiezaBuffer);
  };
}
