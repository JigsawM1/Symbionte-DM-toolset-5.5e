/**
 * @module sincronizacionSimbiote
 * Motor de sincronización bidireccional en tiempo real entre instancias del Simbiote (DM y Jugadores).
 * Garantiza autoridad del estado en el DM, proyecciones ligeras de los PJs,
 * debounce de ráfagas de red y particionado seguro de paquetes.
 */

import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ts } from "@/utiles/TaleSpireAdapter";
import type { PersonajeJugador } from "@/tipos/personaje";
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

const RETARDO_DEBOUNCE_MS = 400;
const LIMITE_TAMANO_SEGURO_BYTES = 420;

let timerDebounceGM: ReturnType<typeof setTimeout> | null = null;
let timerDebouncePJ: ReturnType<typeof setTimeout> | null = null;

// Búfer para deduplicar mensajes recibidos concurrentemente por el EventBus y suscripciones nativas
const mensajesProcesadosRecientes = new Set<string>();
const LIMITE_MENSAJES_DEDUPLICACION = 50;

function esMensajeDuplicado(strCrudo: string): boolean {
  if (!strCrudo) return false;
  if (mensajesProcesadosRecientes.has(strCrudo)) {
    return true;
  }
  if (mensajesProcesadosRecientes.size >= LIMITE_MENSAJES_DEDUPLICACION) {
    mensajesProcesadosRecientes.clear();
  }
  mensajesProcesadosRecientes.add(strCrudo);
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
      chunks.forEach((chunk, index) => {
        const chunkJSON = JSON.stringify({ v: 1, t: "DM_CHUNK", d: chunk });
        setTimeout(() => {
          void ts.sync.send(chunkJSON, "board");
        }, index * 25);
      });
    }
  }, RETARDO_DEBOUNCE_MS);
}

/**
 * Emite la proyección del personaje activo del jugador hacia el DM.
 * Implementa debounce de 400ms.
 */
export function emitirMiPersonaje(): void {
  if (timerDebouncePJ) {
    clearTimeout(timerDebouncePJ);
  }

  timerDebouncePJ = setTimeout(() => {
    const estado = usarAlmacenDM.getState();
    if (estado.esGM || estado.aplicandoSync) return;

    const pjActivo =
      estado.personajes.find((p) => p.id === estado.idPersonajeActivo) ||
      estado.personajes[0];

    if (!pjActivo) {
      logger.debug("[Sync] No hay personaje activo para emitir.");
      return;
    }

    const dto = proyectarEstadoCombatePJ(pjActivo);
    const wire = serializarEstadoCombatePJ(dto);
    const mensajeJSON = JSON.stringify({ v: 1, t: "PJ", d: wire });

    logger.debug(`[Sync] Emitiendo ESTADO_PJ (${pjActivo.nombre}, ${mensajeJSON.length} bytes)`);
    void ts.sync.send(mensajeJSON, "board");
  }, RETARDO_DEBOUNCE_MS);
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
        if (estado.idClienteDM && evento.fromClient?.id && evento.fromClient.id !== estado.idClienteDM) {
          logger.warn("[Sync] Mensaje DM rechazado: remitente no autorizado como DM:", evento.fromClient.id, "Esperado:", estado.idClienteDM);
          return;
        }
        logger.info("[Sync] Aplicando ESTADO_INICIATIVA_DM recibido del DM...");
        const datosIniciativa = deserializarIniciativaDM(mensaje.d);
        estado.aplicarIniciativaDesdeSync(datosIniciativa);
      }
      break;
    }

    case "DM_CHUNK": {
      // Reensamblado de ráfagas para jugadores
      if (!estado.esGM) {
        if (estado.idClienteDM && evento.fromClient?.id && evento.fromClient.id !== estado.idClienteDM) {
          logger.warn("[Sync] Chunk DM rechazado: remitente no autorizado como DM:", evento.fromClient.id, "Esperado:", estado.idClienteDM);
          return;
        }
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

/**
 * Inicializa los observadores reactivos del store Zustand.
 * Monitorea cambios locales para emitir sincronizaciones según el rol activo.
 */
export function inicializarObservadoresStoreSync(): () => void {
  logger.info("[Sync] Inicializando observadores reactivos del store de combate...");

  const estadoInicial = usarAlmacenDM.getState();
  let prevCola = estadoInicial.colaIniciativa;
  let prevTurno = estadoInicial.indiceTurnoActivo;
  let prevRonda = estadoInicial.rondaActual;
  let prevMostrarVida = estadoInicial.mostrarPorcentajeVidaAJugadores;
  let prevMetodoVida = estadoInicial.metodoVidaMonstruo;

  const pjInicial =
    estadoInicial.personajes.find((p) => p.id === estadoInicial.idPersonajeActivo) ||
    estadoInicial.personajes[0];

  const criaturaInicial = estadoInicial.colaIniciativa.find(
    (c) =>
      (pjInicial && c.id === pjInicial.id) ||
      (pjInicial?.idMiniaturaTS && c.id === pjInicial.idMiniaturaTS) ||
      (pjInicial && coincidenNombresTaleSpire(c.nombre, pjInicial.nombre))
  );

  let prevIdPj = pjInicial?.id ?? "";
  let prevIniciativa =
    criaturaInicial?.iniciativa ??
    (pjInicial
      ? (calcularEstadisticasPersonaje(pjInicial).modificadores?.destreza || 0) +
        (pjInicial.iniciativaBono || 0)
      : 0);
  let prevHpActual = pjInicial?.hpActual ?? 0;
  let prevHpTemporal = pjInicial?.hpTemporal ?? 0;
  let prevCondicionesStr = (pjInicial?.condicionesActivas || []).join(",");
  let prevEfectosStr = (pjInicial?.efectosActivos || []).map((e) => `${e.id}:${e.expiraRonda}`).join(",");
  let prevConcentracionStr = pjInicial?.concentracionActiva ? pjInicial.concentracionActiva.hechizoId : "";

  const unsub = usarAlmacenDM.subscribe((estadoActual) => {
    if (estadoActual.aplicandoSync) {
      // Sincronizar referencias previas para evitar falsos positivos de cambio local al liberarse el flag
      const pjActivo =
        estadoActual.personajes.find((p) => p.id === estadoActual.idPersonajeActivo) ||
        estadoActual.personajes[0];

      if (pjActivo) {
        const criaturaActiva = estadoActual.colaIniciativa.find(
          (c) =>
            c.id === pjActivo.id ||
            (pjActivo.idMiniaturaTS && c.id === pjActivo.idMiniaturaTS) ||
            coincidenNombresTaleSpire(c.nombre, pjActivo.nombre)
        );
        const stats = calcularEstadisticasPersonaje(pjActivo);
        prevIdPj = pjActivo.id;
        prevIniciativa =
          criaturaActiva?.iniciativa !== undefined
            ? criaturaActiva.iniciativa
            : (stats.modificadores?.destreza || 0) + (pjActivo.iniciativaBono || 0);
        prevHpActual = pjActivo.hpActual;
        prevHpTemporal = pjActivo.hpTemporal;
        prevCondicionesStr = (pjActivo.condicionesActivas || []).join(",");
        prevEfectosStr = (pjActivo.efectosActivos || []).map((e) => `${e.id}:${e.expiraRonda}`).join(",");
        prevConcentracionStr = pjActivo.concentracionActiva ? pjActivo.concentracionActiva.hechizoId : "";
      }

      if (estadoActual.esGM) {
        prevCola = estadoActual.colaIniciativa;
        prevTurno = estadoActual.indiceTurnoActivo;
        prevRonda = estadoActual.rondaActual;
        prevMostrarVida = estadoActual.mostrarPorcentajeVidaAJugadores;
        prevMetodoVida = estadoActual.metodoVidaMonstruo;
      }
      return;
    }

    if (estadoActual.esGM) {
      // ── Observación del DM ──
      const haCambiadoIniciativa =
        estadoActual.colaIniciativa !== prevCola ||
        estadoActual.indiceTurnoActivo !== prevTurno ||
        estadoActual.rondaActual !== prevRonda ||
        estadoActual.mostrarPorcentajeVidaAJugadores !== prevMostrarVida ||
        estadoActual.metodoVidaMonstruo !== prevMetodoVida;

      if (haCambiadoIniciativa) {
        prevCola = estadoActual.colaIniciativa;
        prevTurno = estadoActual.indiceTurnoActivo;
        prevRonda = estadoActual.rondaActual;
        prevMostrarVida = estadoActual.mostrarPorcentajeVidaAJugadores;
        prevMetodoVida = estadoActual.metodoVidaMonstruo;
        emitirEstadoComoGM();
      }
    } else {
      // ── Observación del Jugador ──
      const pjActivo =
        estadoActual.personajes.find((p) => p.id === estadoActual.idPersonajeActivo) ||
        estadoActual.personajes[0];

      if (pjActivo) {
        const criaturaActiva = estadoActual.colaIniciativa.find(
          (c) =>
            c.id === pjActivo.id ||
            (pjActivo.idMiniaturaTS && c.id === pjActivo.idMiniaturaTS) ||
            coincidenNombresTaleSpire(c.nombre, pjActivo.nombre)
        );
        const stats = calcularEstadisticasPersonaje(pjActivo);
        const inicActual =
          criaturaActiva?.iniciativa !== undefined
            ? criaturaActiva.iniciativa
            : (stats.modificadores?.destreza || 0) + (pjActivo.iniciativaBono || 0);

        const condStr = (pjActivo.condicionesActivas || []).join(",");
        const efStr = (pjActivo.efectosActivos || []).map((e) => `${e.id}:${e.expiraRonda}`).join(",");
        const concStr = pjActivo.concentracionActiva ? pjActivo.concentracionActiva.hechizoId : "";

        const haCambiadoPJ =
          pjActivo.id !== prevIdPj ||
          inicActual !== prevIniciativa ||
          pjActivo.hpActual !== prevHpActual ||
          pjActivo.hpTemporal !== prevHpTemporal ||
          condStr !== prevCondicionesStr ||
          efStr !== prevEfectosStr ||
          concStr !== prevConcentracionStr;

        if (haCambiadoPJ) {
          prevIdPj = pjActivo.id;
          prevIniciativa = inicActual;
          prevHpActual = pjActivo.hpActual;
          prevHpTemporal = pjActivo.hpTemporal;
          prevCondicionesStr = condStr;
          prevEfectosStr = efStr;
          prevConcentracionStr = concStr;
          emitirMiPersonaje();
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
