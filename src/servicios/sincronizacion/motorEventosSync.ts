/**
 * @module motorEventosSync
 * Motor de emisión y recepción de micro-eventos atómicos para Sync v2.
 *
 * Responsabilidades:
 * 1. Emitir paquetes ultraligeros (< 400 caracteres) a través de `ts.sync.send`.
 * 2. Evitar reenviar la cola entera de iniciativa; emitir solo lo que cambia en el Simbionte.
 * 3. Paginar el estado inicial en lotes de máximo `MAX_CRIATURAS_POR_LOTE` (3 criaturas)
 *    únicamente cuando un jugador se incorpora a mitad de un combate en curso.
 */

import { ts } from "@/utiles/TaleSpireAdapter";
import { usarAlmacenDM, type CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos/personaje";
import type { FragmentoCliente } from "@/tipos/talespire";
import {
  VERSION_PROTOCOLO_SYNC_V2,
  LIMITE_SEGURO_PAQUETE_SYNC,
  MAX_CRIATURAS_POR_LOTE,
  EsquemaMensajeSyncV2,
  empaquetarResumenCriaturaDM,
  serializarEfectoSyncV2,
  type TipoDeltaVida,
  type ResumenCombatePJWire,
  type MensajeSyncV2,
} from "@/tipos/protocoloSync";
import { proyectarEstadoCombatePJ } from "./proyeccionEstadoCombate";
import { puedeEmitirPJ, autorizarMensajeSyncV2 } from "./autoridadSync";
import { reiniciarBufferLotesInicialesSyncV2 } from "@/almacen/slices/accionesSyncV2";
import { logger } from "@/utiles/logger";

const RETARDO_DEBOUNCE_PJ_V2_MS = 120;
const timersEmisionPJV2 = new Map<string, ReturnType<typeof setTimeout>>();
const cmdIdsProcesadosV2 = new Set<string>();

interface SesionFragmentosV2 {
  total: number;
  partes: Map<number, string>;
  timer: ReturnType<typeof setTimeout>;
}
const fragmentosV2EnProgreso = new Map<string, SesionFragmentosV2>();
const TTL_FRAGMENTOS_V2_MS = 4000;

let idSesionSyncV2 = crypto.randomUUID().slice(0, 8);

/**
 * Reinicia el identificador de sesión local de Sync v2 y limpia temporizadores de debounce.
 */
export function reiniciarSesionMotorSyncV2(): void {
  for (const timer of timersEmisionPJV2.values()) {
    clearTimeout(timer);
  }
  timersEmisionPJV2.clear();
  cmdIdsProcesadosV2.clear();
  for (const sesion of fragmentosV2EnProgreso.values()) {
    clearTimeout(sesion.timer);
  }
  fragmentosV2EnProgreso.clear();
  reiniciarBufferLotesInicialesSyncV2();
  idSesionSyncV2 = crypto.randomUUID().slice(0, 8);
}

/**
 * Proyecta un `PersonajeJugador` a su representación compacta `ResumenCombatePJWire`.
 */
export function construirResumenCombatePJWire(
  pj: PersonajeJugador,
  _cola: CriaturaIniciativa[] = []
): ResumenCombatePJWire {
  const dto = proyectarEstadoCombatePJ(pj);
  const wire: ResumenCombatePJWire = {
    id: dto.id,
    n: dto.nombre,
    i: dto.iniciativa,
    va: dto.hpActual,
    vm: dto.hpMaximo,
    ca: dto.ca,
    p: [dto.pasivas.percepcion, dto.pasivas.investigacion, dto.pasivas.perspicacia],
    ts: Date.now(),
  };

  if (dto.idMiniaturaTS !== undefined) wire.m = dto.idMiniaturaTS;
  if (dto.avatarUrl) wire.av = dto.avatarUrl;
  if (dto.hpTemporal > 0) wire.vt = dto.hpTemporal;
  if (dto.condiciones.length > 0) wire.c = dto.condiciones;
  if (dto.efectos.length > 0) wire.e = dto.efectos.map(serializarEfectoSyncV2);
  if (dto.concentracion) {
    wire.conc = [dto.concentracion.hechizoId, dto.concentracion.nombreHechizo];
  }
  if (dto.acompanantes && dto.acompanantes.length > 0) {
    wire.ac = dto.acompanantes.map((ac) => ({
      id: ac.id,
      n: ac.nombre,
      va: ac.vidaActual,
      vm: ac.vidaMaxima,
      ...(ac.vidaTemporal && ac.vidaTemporal > 0 ? { vt: ac.vidaTemporal } : {}),
      ...(ac.ca && ac.ca !== 10 ? { ca: ac.ca } : {}),
      ...(ac.condiciones.length > 0 ? { c: ac.condiciones } : {}),
      ...(ac.efectos.length > 0 ? { e: ac.efectos.map(serializarEfectoSyncV2) } : {}),
      ...(ac.iniciativa ? { i: ac.iniciativa } : {}),
      ...(ac.idMiniaturaTS !== undefined ? { m: ac.idMiniaturaTS } : {}),
    }));
  }

  return wire;
}

/**
 * Fragmenta un texto serializado en sobres seguros que respeten LIMITE_SEGURO_PAQUETE_SYNC.
 */
export function fragmentarTextoSyncV2(texto: string, sesionId: string): string[] {
  if (texto.length <= LIMITE_SEGURO_PAQUETE_SYNC) return [texto];

  const idFrag = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const baseSobre = {
    v: VERSION_PROTOCOLO_SYNC_V2,
    s: sesionId,
    t: "FRAG" as const,
    id: idFrag,
  };

  const partes: string[] = [];
  let posicion = 0;
  while (posicion < texto.length) {
    let minimo = 1;
    let maximo = Math.min(LIMITE_SEGURO_PAQUETE_SYNC, texto.length - posicion);
    let cantidad = 0;
    while (minimo <= maximo) {
      const medio = Math.floor((minimo + maximo) / 2);
      const candidato = JSON.stringify({
        ...baseSobre,
        chunk: 4096,
        total: 4096,
        d: texto.slice(posicion, posicion + medio),
      });
      if (candidato.length <= LIMITE_SEGURO_PAQUETE_SYNC) {
        cantidad = medio;
        minimo = medio + 1;
      } else {
        maximo = medio - 1;
      }
    }
    if (!cantidad || partes.length >= 4096) {
      throw new Error("[Sync v2] Error: no se pudo fragmentar el paquete respetando el límite seguro.");
    }
    partes.push(texto.slice(posicion, posicion + cantidad));
    posicion += cantidad;
  }

  return partes.map((d, i) =>
    JSON.stringify({
      ...baseSobre,
      chunk: i + 1,
      total: partes.length,
      d,
    })
  );
}

/**
 * Envía un mensaje tipado `MensajeSyncV2` garantizando que respete `LIMITE_SEGURO_PAQUETE_SYNC`.
 * Si el mensaje supera el margen seguro, lo fragmenta de manera transparente y gestiona fallos.
 */
async function enviarMensajeSeguroV2(mensaje: MensajeSyncV2, target = "board"): Promise<boolean> {
  const json = JSON.stringify(mensaje);
  if (json.length <= LIMITE_SEGURO_PAQUETE_SYNC) {
    try {
      const enviado = await ts.sync.send(json, target);
      if (!enviado) {
        logger.warn(`[Sync v2] Envío fallido para mensaje ${mensaje.t} en ts.sync.send.`);
        return false;
      }
      return true;
    } catch (err) {
      logger.warn(`[Sync v2] Error capturado en ts.sync.send para ${mensaje.t}:`, err);
      return false;
    }
  }

  try {
    const paquetes = fragmentarTextoSyncV2(json, idSesionSyncV2);
    for (const paquete of paquetes) {
      const ok = await ts.sync.send(paquete, target);
      if (!ok) {
        logger.warn(`[Sync v2] Envío fallido para fragmento de mensaje ${mensaje.t}.`);
        return false;
      }
    }
    return true;
  } catch (err) {
    logger.error(`[Sync v2] Error al fragmentar/enviar mensaje grande ${mensaje.t}:`, err);
    return false;
  }
}

/**
 * 1. Emite el saludo `HOLA` cuando un jugador se conecta o recarga el Simbionte.
 * Verifica la propiedad de la miniatura vinculada antes de adjuntar el resumen del PJ.
 */
export async function emitirHolaSync(
  pj?: PersonajeJugador,
  cola: CriaturaIniciativa[] = []
): Promise<boolean> {
  let resumenPJ: ResumenCombatePJWire | undefined = undefined;
  if (pj) {
    const autorizado = await puedeEmitirPJ(pj.idMiniaturaTS);
    if (autorizado) {
      resumenPJ = construirResumenCombatePJWire(pj, cola);
    }
  }
  return enviarMensajeSeguroV2({
    v: VERSION_PROTOCOLO_SYNC_V2,
    s: idSesionSyncV2,
    t: "HOLA",
    ...(resumenPJ ? { pj: resumenPJ } : {}),
  });
}

/**
 * 2. Emite el estado actualizado de un único PJ desde el cliente propietario hacia la mesa.
 */
export async function emitirEstadoPJSync(
  pj: PersonajeJugador,
  cola: CriaturaIniciativa[] = [],
  cmdId?: string
): Promise<boolean> {
  const autorizado = await puedeEmitirPJ(pj.idMiniaturaTS);
  if (!autorizado) return false;

  const wire = construirResumenCombatePJWire(pj, cola);
  return enviarMensajeSeguroV2({
    v: VERSION_PROTOCOLO_SYNC_V2,
    s: idSesionSyncV2,
    t: "PJ_ESTADO",
    d: wire,
    ...(cmdId ? { cmdId } : {}),
  });
}

/**
 * Programa la emisión con debounce ligero (`120ms`) del estado de un PJ para agrupar ráfagas de edición.
 */
export function programarEmisionEstadoPJSync(pjId: string): void {
  const previo = timersEmisionPJV2.get(pjId);
  if (previo) clearTimeout(previo);

  const sesionCapturada = idSesionSyncV2;
  timersEmisionPJV2.set(
    pjId,
    setTimeout(() => {
      timersEmisionPJV2.delete(pjId);
      if (sesionCapturada !== idSesionSyncV2) return;
      const estado = usarAlmacenDM.getState();
      if (estado.esGM || estado.aplicandoSync) return;
      const pj = estado.personajes.find((p) => p.id === pjId);
      if (pj) {
        void emitirEstadoPJSync(pj, estado.colaIniciativa);
      }
    }, RETARDO_DEBOUNCE_PJ_V2_MS)
  );
}

/**
 * 3. Emite un delta relativo de vitalidad (`dano`, `curacion`, `temp`) desde el DM hacia un PJ o acompañante.
 *
 * @returns El `cmdId` generado para trazabilidad.
 * @todo [Flash Fase 3]: Invocar desde las acciones del DM cuando el objetivo en la cola sea un PJ o acompañante.
 */
export async function emitirDeltaVidaSync(
  idObjetivo: string,
  delta: number,
  tipo: TipoDeltaVida
): Promise<string> {
  const cmdId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await enviarMensajeSeguroV2({
    v: VERSION_PROTOCOLO_SYNC_V2,
    s: idSesionSyncV2,
    t: "DELTA_VIDA",
    idObjetivo,
    delta,
    tipo,
    cmdId,
  });
  return cmdId;
}

/**
 * 4. Emite el cambio puntual de una única criatura/monstruo desde el DM hacia los jugadores.
 */
export async function emitirCriaturaSync(
  criatura: CriaturaIniciativa,
  eliminada = false
): Promise<boolean> {
  return enviarMensajeSeguroV2({
    v: VERSION_PROTOCOLO_SYNC_V2,
    s: idSesionSyncV2,
    t: "CRIATURA_ESTADO",
    d: empaquetarResumenCriaturaDM(criatura),
    ...(eliminada ? { eliminada: true } : {}),
  });
}

/**
 * 5. Emite metadatos globales del combate (cambio de ronda, turno activo o visibilidad de vida).
 */
export async function emitirMetaCombateSync(
  ronda: number,
  indiceTurno: number,
  mostrarPorcentaje: boolean,
  limpiar = false
): Promise<boolean> {
  return enviarMensajeSeguroV2({
    v: VERSION_PROTOCOLO_SYNC_V2,
    s: idSesionSyncV2,
    t: "META_COMBATE",
    r: Math.max(1, ronda),
    idx: Math.max(0, indiceTurno),
    vPorcentaje: mostrarPorcentaje,
    ...(limpiar ? { limpiar: true } : {}),
  });
}

/**
 * 6. Emite la cola inicial paginada en lotes de `MAX_CRIATURAS_POR_LOTE` (3 criaturas)
 * en respuesta a un saludo `HOLA` de un jugador recién conectado.
 */
export async function emitirLotesInicialesSync(
  cola: CriaturaIniciativa[],
  ronda: number,
  indiceTurno: number,
  mostrarPorcentaje: boolean,
  target = "board"
): Promise<boolean> {
  if (cola.length === 0) {
    return emitirMetaCombateSync(ronda, indiceTurno, mostrarPorcentaje, true);
  }

  const criaturasEmpaquetadas = cola.map(empaquetarResumenCriaturaDM);
  const segmentos: (typeof criaturasEmpaquetadas)[] = [];
  let loteActual: typeof criaturasEmpaquetadas = [];

  for (const criatura of criaturasEmpaquetadas) {
    const candidato = [...loteActual, criatura];
    const borradorMensaje: MensajeSyncV2 = {
      v: VERSION_PROTOCOLO_SYNC_V2,
      s: idSesionSyncV2,
      t: "LOTE_INICIAL",
      parte: segmentos.length + 1,
      total: 99,
      r: Math.max(1, ronda),
      idx: Math.max(0, indiceTurno),
      vPorcentaje: mostrarPorcentaje,
      criaturas: candidato,
    };

    const superaTamano = JSON.stringify(borradorMensaje).length > LIMITE_SEGURO_PAQUETE_SYNC;
    const superaCantidad = candidato.length > MAX_CRIATURAS_POR_LOTE;

    if (loteActual.length > 0 && (superaTamano || superaCantidad)) {
      segmentos.push(loteActual);
      loteActual = [criatura];
    } else {
      loteActual = candidato;
    }
  }

  if (loteActual.length > 0) {
    segmentos.push(loteActual);
  }

  const totalLotes = segmentos.length;
  const promesas = segmentos.map((segmento, i) =>
    enviarMensajeSeguroV2(
      {
        v: VERSION_PROTOCOLO_SYNC_V2,
        s: idSesionSyncV2,
        t: "LOTE_INICIAL",
        parte: i + 1,
        total: totalLotes,
        r: Math.max(1, ronda),
        idx: Math.max(0, indiceTurno),
        vPorcentaje: mostrarPorcentaje,
        criaturas: segmento,
      },
      target
    )
  );

  const resultados = await Promise.all(promesas);
  return resultados.every(Boolean);
}

/**
 * Aplica un mensaje ya validado de `MensajeSyncV2` sobre el store `usarAlmacenDM`.
 */
function despacharMensajeValidadoSyncV2(mensaje: MensajeSyncV2): void {
  const estado = usarAlmacenDM.getState();

  switch (mensaje.t) {
    case "HOLA": {
      if (estado.esGM) {
        if (mensaje.pj) {
          estado.aplicarEstadoPJDesdeSyncV2(mensaje.pj);
        }
        void emitirLotesInicialesSync(
          estado.colaIniciativa,
          estado.rondaActual,
          estado.indiceTurnoActivo,
          estado.mostrarPorcentajeVidaAJugadores
        );
      }
      break;
    }

    case "PJ_ESTADO": {
      estado.aplicarEstadoPJDesdeSyncV2(mensaje.d);
      break;
    }

    case "DELTA_VIDA": {
      if (!estado.esGM) {
        if (cmdIdsProcesadosV2.has(mensaje.cmdId)) break;
        cmdIdsProcesadosV2.add(mensaje.cmdId);
        estado.aplicarDeltaVidaDesdeSync(
          mensaje.idObjetivo,
          mensaje.delta,
          mensaje.tipo,
          mensaje.cmdId
        );
      }
      break;
    }

    case "CRIATURA_ESTADO": {
      if (!estado.esGM) {
        estado.aplicarCriaturaDesdeSync(mensaje.d, mensaje.eliminada);
      }
      break;
    }

    case "META_COMBATE": {
      if (!estado.esGM) {
        estado.aplicarMetaCombateDesdeSync({
          r: mensaje.r,
          idx: mensaje.idx,
          vPorcentaje: mensaje.vPorcentaje,
          limpiar: mensaje.limpiar,
        });
      }
      break;
    }

    case "LOTE_INICIAL": {
      if (!estado.esGM) {
        estado.aplicarLoteInicialDesdeSync(mensaje);
      }
      break;
    }
  }
}

/**
 * Procesa cualquier paquete entrante del protocolo v3 (`MensajeSyncV2`) y despacha
 * la acción correspondiente en `usarAlmacenDM`.
 */
export async function procesarEventoSyncV2(
  datosCrudos: unknown,
  fromClient?: FragmentoCliente
): Promise<boolean> {
  if (!fromClient?.id || !fromClient.player?.id) {
    logger.warn("[Sync v2] Mensaje rechazado: remitente sin identidad válida (fromClient o player.id ausente).");
    return false;
  }

  const resultado = EsquemaMensajeSyncV2.safeParse(datosCrudos);
  if (!resultado.success) {
    return false;
  }

  const mensaje = resultado.data;

  // Manejo de fragmentos de red transparentes
  if (mensaje.t === "FRAG") {
    const clave = `${fromClient.id}:${mensaje.id}`;
    let sesion = fragmentosV2EnProgreso.get(clave);
    if (!sesion || sesion.total !== mensaje.total) {
      if (sesion?.timer) clearTimeout(sesion.timer);
      sesion = {
        total: mensaje.total,
        partes: new Map(),
        timer: setTimeout(() => {
          fragmentosV2EnProgreso.delete(clave);
        }, TTL_FRAGMENTOS_V2_MS),
      };
      fragmentosV2EnProgreso.set(clave, sesion);
    }
    sesion.partes.set(mensaje.chunk, mensaje.d);
    if (sesion.partes.size === mensaje.total) {
      clearTimeout(sesion.timer);
      fragmentosV2EnProgreso.delete(clave);
      const jsonCompleto = Array.from({ length: mensaje.total }, (_, i) => sesion!.partes.get(i + 1)).join("");
      try {
        const datosReensamblados = JSON.parse(jsonCompleto);
        return await procesarEventoSyncV2(datosReensamblados, fromClient);
      } catch (err) {
        logger.warn("[Sync v2] Error parseando JSON reensamblado desde fragmentos:", err);
        return false;
      }
    }
    return true;
  }

  const autorizado = await autorizarMensajeSyncV2(mensaje, fromClient);
  if (!autorizado) {
    logger.warn("[Sync v2] Mensaje descartado: falta de autorización o permisos insuficientes.", mensaje);
    return false;
  }

  despacharMensajeValidadoSyncV2(mensaje);
  return true;
}
