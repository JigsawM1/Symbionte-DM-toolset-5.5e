import { autorizarMensaje, autorizarPersonaje, puedeEmitirPJ, invalidarAutoridadSync } from "./sincronizacion/autoridadSync";
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
  type EstadoIniciativaDM,
  type WireEstadoIniciativaDM,
  EsquemaWireMensajeSync,
  VERSION_PROTOCOLO_SYNC,
  serializarEstadoCombatePJ,
  deserializarEstadoCombatePJ,
  serializarIniciativaDM,
  deserializarIniciativaDM,
  type WireMensajeSync,
} from "@/tipos/sync";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { coincidenNombresTaleSpire } from "@/servicios/resolutorCriaturas";
import { logger } from "@/utiles/logger";
import { BufferChunksIniciativa } from "./sincronizacion/bufferChunksIniciativa";
import { GestorReintentosSync } from "./sincronizacion/gestorReintentosSync";
import { proyectarEstadoCombatePJ, proyectarBorradorCombatePJ } from "./sincronizacion/proyeccionEstadoCombate";
import { BufferFragmentosSync, claveEstadoSync, empaquetarEstadoSync, type EstadoSync } from "./sincronizacion/transporteSync";
import { gestionarNotificacionVersionIncompatible, reiniciarNotificadorVersion } from "./sincronizacion/notificadorVersionSync";

export { proyectarEstadoCombatePJ };

const RETARDO_DEBOUNCE_GM_MS = 350;
const RETARDO_DEBOUNCE_PJ_MS = 150;

let timerDebounceGM: ReturnType<typeof setTimeout> | null = null;
const timersPJ = new Map<string, ReturnType<typeof setTimeout>>();
const pendientesPJ = new Map<string, PersonajeJugador>();
const emitidasPJ = new Map<string, { personaje: PersonajeJugador; revision: number }>();
const revisionesDM = new Map<string, number>();
let sesionLocal = crypto.randomUUID();
let generacionSync = 0;
let sesionDM: string | undefined;
const sesionesDMRetiradas = new Set<string>();

// Gestores modulares para fragmentos y reintentos resilientes
const bufferChunks = new BufferChunksIniciativa();
const gestorReintentos = new GestorReintentosSync(id => {
  const pendiente = pendientesPJ.get(id);
  const estado = usarAlmacenDM.getState();
  if (pendiente) estado.guardarBorradorSync(id, proyectarBorradorCombatePJ(pendiente));
  pendientesPJ.delete(id); emitidasPJ.delete(id);
  estado.confirmarACKPJ(id, Number.MAX_SAFE_INTEGER);
  estado.agregarNotificacion('No se confirmó tu cambio. Puedes recuperarlo desde los cambios pendientes.', 'advertencia');
});
const revisionesAplicadas = new Map<string, number>();
let ultimaRevisionEmitida = 0;
const buffersPorOrigen = new Map<string, BufferFragmentosSync>();
function obtenerBuffer(origen: string): BufferFragmentosSync {
  let buffer = buffersPorOrigen.get(origen);
  if (!buffer) {
    if (buffersPorOrigen.size >= 32) {
      const primero = buffersPorOrigen.keys().next().value as string;
      buffersPorOrigen.get(primero)?.limpiar();
      buffersPorOrigen.delete(primero);
    }
    buffer = new BufferFragmentosSync(tipo => {
      if (tipo === 'DM' && !usarAlmacenDM.getState().esGM) gestorReintentos.continuarReintentosREQ();
    });
    buffersPorOrigen.set(origen, buffer);
  }
  return buffer;
}

function nuevaRevision(): number {
  ultimaRevisionEmitida = ultimaRevisionEmitida + 1;
  return ultimaRevisionEmitida;
}

function enviarSolicitud(): void {
  void ts.sync.send(JSON.stringify({ v: VERSION_PROTOCOLO_SYNC, s: sesionLocal, t: 'REQ' }), 'board');
}

function purgarEstado(tipo: 'DM' | 'PJ', id = 'DM'): void {
  ts.sync.purgarColaSync(texto => {
    try {
      const m = JSON.parse(texto) as WireMensajeSync;
      return (m.t === 'FRAG' && m.k === tipo && m.id === id)
        || (m.t === tipo && (m.t === 'DM' || m.d.id === id))
        || (tipo === 'DM' && m.t === 'DM_CHUNK');
    } catch (err) {
      logger.debug("[Sync] Paquete inválido descartado al purgar cola:", err);
      return false;
    }
  });
}

function enviarPaquetes(paquetes: string[]): Promise<boolean> {
  return Promise.all(paquetes.map(p => ts.sync.send(p, 'board'))).then(resultados => resultados.every(Boolean));
}

function confirmarRecepcionPJ(id: string, revision: number, ok = true): void {
  void ts.sync.send(JSON.stringify({ v: VERSION_PROTOCOLO_SYNC, s: sesionLocal, t: 'ACK', id, ts: revision, ok, rd: revisionesDM.get(id) ?? 0 }), 'board');
}

function aplicarEstadoRecibido(mensaje: EstadoSync, origen = ""): void {
  const bufferFragmentos = obtenerBuffer(origen);
  const estado = usarAlmacenDM.getState();
  if ((mensaje.t === 'DM') === estado.esGM) return;
  const id = mensaje.t === 'PJ' ? mensaje.d.id : 'DM';
  const clave = `${origen}:${claveEstadoSync(mensaje.t, id)}`;
  const revision = mensaje.d.ts;
  const ultima = revisionesAplicadas.get(clave);
  const enCurso = bufferFragmentos.obtenerRevisionEnCurso(mensaje.t, id);
  // Un mensaje retrasado no puede borrar fragmentos nuevos ni saltarse el orden sin revisión.
  if (revision === undefined && (ultima !== undefined || enCurso !== undefined)) return;
  if (revision !== undefined && enCurso !== undefined && revision < enCurso) return;
  if (revision !== undefined && ultima !== undefined && revision <= ultima) {
    if (mensaje.t === 'PJ' && revision === ultima) confirmarRecepcionPJ(id, revision);
    return;
  }
  if (mensaje.t === 'DM') {
    if (mensaje.s && sesionesDMRetiradas.has(mensaje.s)) return;
    if (sesionDM !== mensaje.s) {
      if (sesionDM) sesionesDMRetiradas.add(sesionDM);
      sesionDM = mensaje.s; revisionesDM.clear();
    }
    for (const [entidad, valor] of Object.entries(mensaje.d.rv ?? {})) revisionesDM.set(entidad, valor);
    estado.aplicarIniciativaDesdeSync(deserializarIniciativaDM(mensaje.d));
    gestorReintentos.cancelarReintentosREQ();
  } else {
    const existente = estado.personajes.find(p => p.id === id);
    if (existente && existente.idMiniaturaTS && existente.idMiniaturaTS !== mensaje.d.m) return;
    const revisionActual = revisionesDM.get(id) ?? 0;
    if (mensaje.d.b !== undefined && mensaje.d.b !== revisionActual) {
      confirmarRecepcionPJ(id, revision ?? 0, false);
      emitirEstadoComoGM();
      return;
    }
    revisionesDM.set(id, revisionActual + 1);
    estado.actualizarPersonajeDesdeSync(deserializarEstadoCombatePJ(mensaje.d));
    confirmarRecepcionPJ(id, revision ?? Date.now());
    emitirEstadoComoGM();
  }
  if (revision !== undefined) revisionesAplicadas.set(clave, revision);
  bufferFragmentos.descartar(mensaje.t, id);
}

/** Cancela el ciclo anterior, incluida cualquier emisión pendiente durante un cambio de rol. */
export function reiniciarSincronizacion(): void {
  if (timerDebounceGM) clearTimeout(timerDebounceGM);
  for (const timer of timersPJ.values()) clearTimeout(timer);
  timersPJ.clear(); pendientesPJ.clear(); emitidasPJ.clear(); revisionesDM.clear();
  generacionSync++; sesionLocal = crypto.randomUUID(); sesionDM = undefined;
  sesionesDMRetiradas.clear();
  usarAlmacenDM.getState().establecerIdClienteDM(null);
  invalidarAutoridadSync();
  timerDebounceGM = null;
  gestorReintentos.destruir();
  for (const buffer of buffersPorOrigen.values()) buffer.limpiar();
  buffersPorOrigen.clear();
  bufferChunks.limpiar();
  revisionesAplicadas.clear();
  mensajesProcesadosRecientes.clear();
  reiniciarNotificadorVersion();
  ts.sync.purgarColaSync();
}

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

/**
 * Emite el estado consolidado de la iniciativa desde el DM hacia todos los clientes.
 * Implementa debounce de 350ms, purgado de fragmentos obsoletos y particionado automático si excede el tamaño seguro.
 */
export function emitirEstadoComoGM(): void {
  if (timerDebounceGM) {
    clearTimeout(timerDebounceGM);
  }

  timerDebounceGM = setTimeout(() => {
    const estado = usarAlmacenDM.getState();
    if (!estado.esGM || estado.aplicandoSync) return;

    // Descartar ráfagas obsoletas de la iniciativa anterior en la cola de salida para evitar saturar el canal nativo
    purgarEstado('DM');

    const datosDM: EstadoIniciativaDM = {
      cola: estado.colaIniciativa,
      indiceTurnoActivo: estado.indiceTurnoActivo,
      rondaActual: estado.rondaActual,
      mostrarPorcentajeVidaAJugadores: estado.mostrarPorcentajeVidaAJugadores,
      metodoVidaMonstruo: estado.metodoVidaMonstruo,
      ts: nuevaRevision(),
    };

    const wire = serializarIniciativaDM(datosDM);
    wire.rv = Object.fromEntries(revisionesDM);
    const mensaje: EstadoSync = { v: VERSION_PROTOCOLO_SYNC, s: sesionLocal, t: 'DM', d: wire };
    void enviarPaquetes(empaquetarEstadoSync(mensaje));
  }, RETARDO_DEBOUNCE_GM_MS);
}

/**
 * Emite la proyección de un personaje del jugador hacia el DM.
 * Implementa debounce de 150ms.
 */
export function emitirMiPersonaje(personajeId?: string): void {
  const estado = usarAlmacenDM.getState();
  const id = personajeId ?? estado.idPersonajeActivo;
  const pj = estado.personajes.find(p => p.id === id);
  if (!pj || estado.esGM || estado.aplicandoSync) return;
  pendientesPJ.set(pj.id, pj);
  estado.registrarModificacionLocalPJ(pj.id);
  if (emitidasPJ.has(pj.id)) return;
  clearTimeout(timersPJ.get(pj.id));
  const generacion = generacionSync;
  timersPJ.set(pj.id, setTimeout(() => {
    timersPJ.delete(pj.id);
    const pendiente = pendientesPJ.get(pj.id);
    if (!pendiente) return;
    void Promise.resolve(puedeEmitirPJ(pendiente.idMiniaturaTS)).then(autorizado => {
      if (!autorizado || generacion !== generacionSync || usarAlmacenDM.getState().esGM || emitidasPJ.has(pj.id)) return;
      const dto = proyectarEstadoCombatePJ(pendiente);
      dto.ts = nuevaRevision();
      const wire = serializarEstadoCombatePJ(dto, true);
      wire.b = revisionesDM.get(pj.id) ?? 0;
      const paquetes = empaquetarEstadoSync({ v: VERSION_PROTOCOLO_SYNC, s: sesionLocal, t: 'PJ', d: wire });
      emitidasPJ.set(pj.id, { personaje: pendiente, revision: dto.ts });
      gestorReintentos.registrarEmisionPJ(pj.id, dto.ts, () => enviarPaquetes(paquetes));
    });
  }, RETARDO_DEBOUNCE_PJ_MS));
}

/** Reaplica la edición conservada y solicita una emisión incluso si sus valores no cambiaron. */
export async function reaplicarCambioPendienteSync(id: string): Promise<boolean> {
  const estado = usarAlmacenDM.getState();
  const borrador = estado.borradoresSync[id];
  if (!borrador) return false;
  const generacion = generacionSync;
  const pj = estado.personajes.find(p => p.id === borrador.id ||
    (borrador.idMiniaturaTS && p.idMiniaturaTS === borrador.idMiniaturaTS));
  if (!estado.esGM && (!pj || !await puedeEmitirPJ(pj.idMiniaturaTS))) {
    usarAlmacenDM.getState().agregarNotificacion('No se pudo reenviar el cambio. Vincula la ficha a una miniatura que te pertenezca. El borrador sigue disponible.', 'advertencia');
    return false;
  }
  const actual = usarAlmacenDM.getState();
  if (generacion !== generacionSync || actual.esGM !== estado.esGM || actual.borradoresSync[id] !== borrador) return false;
  const idPJ = pj?.id ?? borrador.id;
  clearTimeout(timersPJ.get(idPJ));
  timersPJ.delete(idPJ);
  gestorReintentos.cancelarEmisionPJ(idPJ);
  emitidasPJ.delete(idPJ);
  pendientesPJ.delete(idPJ);
  if (!actual.reaplicarBorradorSync(id)) return false;
  if (actual.esGM) emitirEstadoComoGM();
  else emitirMiPersonaje(idPJ);
  usarAlmacenDM.getState().agregarNotificacion(actual.esGM
    ? 'Cambio reaplicado a la ficha y a la iniciativa.'
    : 'Cambio reaplicado. Esperando confirmación del DM.', actual.esGM ? 'exito' : 'info');
  return true;
}

/**
 * Envía una solicitud al DM para recibir el snapshot actual de combate.
 * Aplica reintentos automáticos con retroceso progresivo y cancelación reactiva.
 */
export function solicitarEstadoInicial(): void {
  const estado = usarAlmacenDM.getState();
  if (estado.esGM) return;

  logger.info("[Sync] Iniciando solicitud de estado inicial con backoff...");
  gestorReintentos.iniciarReintentosREQ(enviarSolicitud);
}

/**
 * Procesa mensajes de sincronización entrantes recibidos a través del EventBus.
 */
export function procesarMensajeSyncEntrante(evento: {
  datos: unknown; strCrudo: string; fromClient?: FragmentoCliente;
}): void | Promise<void> {
  const parseo = EsquemaWireMensajeSync.safeParse(evento.datos);
  if (!parseo.success) {
    gestionarNotificacionVersionIncompatible(evento.datos, evento.fromClient);
    return;
  }
  const generacion = generacionSync;
  const autorizado: boolean | Promise<boolean> = autorizarMensaje(parseo.data, evento.fromClient);
  const aplicar = (valido: boolean): void | Promise<void> => {
    if (!valido || generacion !== generacionSync) return;
    if (parseo.data.t === "DM" || parseo.data.t === "ACK" || (parseo.data.t === "FRAG" && parseo.data.k === "DM")) {
      const id = evento.fromClient?.id;
      const conocido = usarAlmacenDM.getState().idClienteDM;
      if (id && conocido && id !== conocido) return;
      if (id && !conocido) usarAlmacenDM.getState().establecerIdClienteDM(id);
    }
    return procesarAutorizado(parseo.data, evento);
  };
  return typeof autorizado === 'boolean' ? aplicar(autorizado) : autorizado.then(aplicar);
}

function procesarAutorizado(mensaje: WireMensajeSync, evento: { strCrudo: string; fromClient?: FragmentoCliente }): void | Promise<void> {
  if ((mensaje.t === 'DM' || mensaje.t === 'ACK' || (mensaje.t === 'FRAG' && mensaje.k === 'DM')) && sesionesDMRetiradas.has(mensaje.s)) return;
  if (esMensajeDuplicado(`${evento.fromClient?.id ?? ''}:${mensaje.s ?? ''}:${evento.strCrudo}`)) return;
  const estado = usarAlmacenDM.getState();
  const origen = `${evento.fromClient?.id ?? ""}:${mensaje.s ?? ""}`;
  const bufferFragmentos = obtenerBuffer(origen);

  switch (mensaje.t) {
    case "REQ": {
      // Si somos el DM, respondemos de inmediato con el snapshot de combate
      if (estado.esGM) {
        logger.info("[Sync] Solicitud de estado recibida. Respondiendo snapshot...");
        emitirEstadoComoGM();
      }
      break;
    }

    case 'FRAG': {
      if ((mensaje.k === 'DM') === estado.esGM) break;
      const ultima = revisionesAplicadas.get(`${origen}:${claveEstadoSync(mensaje.k, mensaje.id)}`);
      if (ultima !== undefined && mensaje.ts <= ultima) {
        if (mensaje.k === 'PJ' && mensaje.ts === ultima && mensaje.chunk === 1) confirmarRecepcionPJ(mensaje.id, mensaje.ts);
        break;
      }
      const resultado = bufferFragmentos.registrar(mensaje);
      if (resultado.tipo === 'completo') {
        if (resultado.mensaje.t === 'PJ' && evento.fromClient) {
          const generacion = generacionSync;
          return autorizarPersonaje(resultado.mensaje.d, evento.fromClient).then(valido => { if (valido && generacion === generacionSync) aplicarEstadoRecibido(resultado.mensaje, origen); });
        }
        aplicarEstadoRecibido(resultado.mensaje, origen);
      }
      else if (mensaje.k === 'DM' && resultado.tipo === 'progreso') gestorReintentos.pausarReintentosREQ(enviarSolicitud);
      break;
    }

    case 'DM':
    case 'PJ':
      aplicarEstadoRecibido(mensaje, origen);
      break;

    case "DM_CHUNK": {
      // Reensamblado ordenado de ráfagas para jugadores
      if (!estado.esGM) {
        const chunksCompletos = bufferChunks.registrarChunk(mensaje.d);

        if (chunksCompletos) {
          const primerChunk = chunksCompletos[0];
          const wireCompleto: WireEstadoIniciativaDM = {
            t: primerChunk.t,
            r: primerChunk.r,
            v: primerChunk.v,
            mv: primerChunk.mv,
            c: chunksCompletos.flatMap((ch) => ch.c),
            ts: primerChunk.ts,
          };
          const completo = EsquemaWireMensajeSync.safeParse({ v: VERSION_PROTOCOLO_SYNC, s: mensaje.s, t: 'DM', d: wireCompleto });
          if (completo.success && completo.data.t === 'DM') aplicarEstadoRecibido(completo.data, origen);
        }
      }
      break;
    }

    case "ACK": {
      // Solo los jugadores procesan confirmaciones de sus personajes
      if (!estado.esGM) {
        if (!gestorReintentos.confirmarACK(mensaje.id, mensaje.ts)) break;
        const emitida = emitidasPJ.get(mensaje.id);
        emitidasPJ.delete(mensaje.id);
        revisionesDM.set(mensaje.id, mensaje.rd ?? revisionesDM.get(mensaje.id) ?? 0);
        const pendiente = pendientesPJ.get(mensaje.id);
        if (mensaje.ok === false) {
          if (pendiente) estado.guardarBorradorSync(mensaje.id, proyectarBorradorCombatePJ(pendiente));
          pendientesPJ.delete(mensaje.id);
          estado.confirmarACKPJ(mensaje.id, Number.MAX_SAFE_INTEGER);
          estado.agregarNotificacion('El DM cambió esta ficha. Tu edición se conserva en los cambios pendientes de sincronización.', 'advertencia');
          solicitarEstadoInicial();
        } else if (pendiente === emitida?.personaje) {
          pendientesPJ.delete(mensaje.id);
          estado.confirmarACKPJ(mensaje.id, Number.MAX_SAFE_INTEGER);
        } else emitirMiPersonaje(mensaje.id);
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

      return `${a.id}:${a.nombre}:${inic}:${a.vidaActual}:${a.vidaMaxima}:${a.vidaTemporal || 0}:${a.ca || 10}:${(a.condiciones || []).slice().sort().join(",")}:${(a.efectos || []).map((e) => `${e.id}:${e.nombre}:${e.expiraRonda}:${e.concentracion}`).join(",")}:${a.idMiniaturaTS || ""}`;
    })
    .join("|");
}

export function calcularFirmaPJ(
  pj: PersonajeJugador,
  cola: CriaturaIniciativa[] = []
): string {
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
  const acompsStr = obtenerFirmaAcompanantes(pj.acompanantes, cola);

  return `${pj.id}:${pj.nombre}:${pj.hpActual}:${pj.hpMaximo}:${pj.hpTemporal}:${pj.ca || 10}:${inic}:${condStr}:${efStr}:${concStr}:${pj.idMiniaturaTS || ""}:${acompsStr}`;
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
  reiniciarSincronizacion();
  logger.info("[Sync] Inicializando observadores reactivos del store de combate...");

  const estadoInicial = usarAlmacenDM.getState();
  let eraGM = estadoInicial.esGM;
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
    if (estadoActual.esGM !== eraGM) {
      eraGM = estadoActual.esGM;
      reiniciarSincronizacion();
    }
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
      let cambioEntidad = false;
      for (const pj of estadoActual.personajes) {
        const firma = calcularFirmaPJ(pj, estadoActual.colaIniciativa);
        if (prevFirmasPJs.get(pj.id) !== firma) {
          revisionesDM.set(pj.id, (revisionesDM.get(pj.id) ?? 0) + 1);
          cambioEntidad = true;
        }
        prevFirmasPJs.set(pj.id, firma);
      }
      // ── Observación del DM ──
      const firmaActualDM = calcularFirmaIniciativaDM(
        estadoActual.colaIniciativa,
        estadoActual.indiceTurnoActivo,
        estadoActual.rondaActual,
        estadoActual.mostrarPorcentajeVidaAJugadores,
        estadoActual.metodoVidaMonstruo
      );

      if (firmaActualDM !== prevFirmaDM || cambioEntidad) {
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
    reiniciarSincronizacion();
  };
}
