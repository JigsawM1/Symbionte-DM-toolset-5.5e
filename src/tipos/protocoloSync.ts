/**
 * @module tipos/protocoloSync
 * Contratos de dominio, constantes y esquemas Zod para el protocolo de
 * sincronización minimalista de eventos atómicos (Sync v2 - Protocolo v3).
 *
 * Principios arquitectónicos:
 * 1. El Simbionte es la única fuente de la verdad de vida y estadísticas (se ignora el HP 10/10 de TaleSpire).
 * 2. Por TS.sync solo viajan micro-eventos (< 400 caracteres seguros sobre los 500 nativos de TaleSpire).
 * 3. Soberanía del jugador: el DM envía daños/curaciones a PJs mediante `DELTA_VIDA` relativo.
 */

import { z } from "zod";
import type { CriaturaIniciativa, EfectoActivo } from "@/almacen/usarAlmacenDM";

// ==========================================
// 1. CONSTANTES DEL PROTOCOLO V2
// ==========================================

/** Versión canónica del protocolo de micro-eventos Sync v2. */
export const VERSION_PROTOCOLO_SYNC_V2 = 3;

/**
 * Margen seguro en caracteres UTF-16 por mensaje enviado a `TS.sync.send`.
 * El límite duro nativo de TaleSpire es 500 caracteres; 400 deja holgura para escapes JSON.
 */
export const LIMITE_SEGURO_PAQUETE_SYNC = 400;

/** Cantidad máxima de criaturas por paquete en la sincronización inicial paginada. */
export const MAX_CRIATURAS_POR_LOTE = 3;

// ==========================================
// 2. TIPOS DE DOMINIO (DISCREPANCIAS Y DELTAS)
// ==========================================

export const EsquemaTipoDeltaVida = z.enum(["dano", "curacion", "temp"]);
export type TipoDeltaVida = z.infer<typeof EsquemaTipoDeltaVida>;

/**
 * Representa una discrepancia detectada al reconectar entre la vida que el DM
 * tenía registrada en la mesa activa y la vida guardada en la ficha local del jugador.
 */
export interface DiscrepanciaVitalidadSync {
  idPJ: string;
  nombrePJ: string;
  hpLocal: number;
  hpTempLocal: number;
  hpRemotoDM: number;
  hpTempRemotoDM: number;
  timestampDeteccion: number;
}

export type DecisionDiscrepanciaVitalidad = "aceptar_dm" | "conservar_local";

// ==========================================
// 3. ESQUEMAS COMPACTOS DE ENTIDADES (WIRE)
// ==========================================

export const EsquemaResumenEfectoWire = z.object({
  id: z.string(),
  n: z.string(),
  r: z.number().optional(),
  c: z.boolean().optional(),
  d: z.number().optional(),
});
export type ResumenEfectoWire = z.infer<typeof EsquemaResumenEfectoWire>;

export const EsquemaResumenAcompananteWire = z.object({
  id: z.string(),
  n: z.string(),
  va: z.number(),
  vm: z.number(),
  vt: z.number().optional(),
  ca: z.number().optional(),
  c: z.array(z.string()).optional(),
  e: z.array(EsquemaResumenEfectoWire).optional(),
  i: z.number().optional(),
  m: z.string().nullable().optional(),
});
export type ResumenAcompananteWire = z.infer<typeof EsquemaResumenAcompananteWire>;

export const EsquemaResumenCombatePJWire = z.object({
  id: z.string(),
  m: z.string().nullable().optional(),
  n: z.string(),
  av: z.string().optional(),
  i: z.number(),
  va: z.number(),
  vm: z.number(),
  vt: z.number().optional(),
  ca: z.number(),
  c: z.array(z.string()).optional(),
  e: z.array(EsquemaResumenEfectoWire).optional(),
  p: z.tuple([z.number(), z.number(), z.number()]),
  conc: z.tuple([z.string(), z.string()]).nullable().optional(),
  ac: z.array(EsquemaResumenAcompananteWire).optional(),
  ts: z.number().optional(),
});
export type ResumenCombatePJWire = z.infer<typeof EsquemaResumenCombatePJWire>;

export const EsquemaResumenCriaturaDMWire = z.object({
  id: z.string(),
  n: z.string(),
  i: z.number(),
  va: z.number(),
  vm: z.number(),
  vt: z.number().optional(),
  ca: z.number(),
  mon: z.boolean(),
  c: z.array(z.string()).optional(),
  e: z.array(EsquemaResumenEfectoWire).optional(),
  pl: z.string().optional(),
  acomp: z.boolean().optional(),
  duenio: z.string().optional(),
  idAc: z.string().optional(),
  av: z.string().optional(),
  p: z.tuple([z.number(), z.number(), z.number()]).optional(),
});
export type ResumenCriaturaDMWire = z.infer<typeof EsquemaResumenCriaturaDMWire>;

// ==========================================
// 4. MICRO-EVENTOS DEL PROTOCOLO SYNC V2
// ==========================================

/** 4.1. Saludo inicial del jugador al conectarse o recargar. */
export const EsquemaMensajeHolaSync = z.object({
  v: z.literal(VERSION_PROTOCOLO_SYNC_V2),
  s: z.string().optional(),
  t: z.literal("HOLA"),
  pj: EsquemaResumenCombatePJWire.optional(),
});
export type MensajeHolaSync = z.infer<typeof EsquemaMensajeHolaSync>;

/** 4.2. Actualización autoritativa del estado de combate de un PJ emitida por su dueño. */
export const EsquemaMensajeEstadoPJSync = z.object({
  v: z.literal(VERSION_PROTOCOLO_SYNC_V2),
  s: z.string().optional(),
  t: z.literal("PJ_ESTADO"),
  d: EsquemaResumenCombatePJWire,
  cmdId: z.string().optional(),
});
export type MensajeEstadoPJSync = z.infer<typeof EsquemaMensajeEstadoPJSync>;

/** 4.3. Delta matemático relativo de vida (daño, curación o PV temporales) emitido por el DM hacia un PJ o acompañante. */
export const EsquemaMensajeDeltaVidaSync = z.object({
  v: z.literal(VERSION_PROTOCOLO_SYNC_V2),
  s: z.string().optional(),
  t: z.literal("DELTA_VIDA"),
  idObjetivo: z.string(),
  delta: z.number(),
  tipo: EsquemaTipoDeltaVida,
  cmdId: z.string(),
});
export type MensajeDeltaVidaSync = z.infer<typeof EsquemaMensajeDeltaVidaSync>;

/** 4.4. Actualización puntual de una única criatura/monstruo controlada por el DM. */
export const EsquemaMensajeCriaturaSync = z.object({
  v: z.literal(VERSION_PROTOCOLO_SYNC_V2),
  s: z.string().optional(),
  t: z.literal("CRIATURA_ESTADO"),
  d: EsquemaResumenCriaturaDMWire,
  eliminada: z.boolean().optional(),
});
export type MensajeCriaturaSync = z.infer<typeof EsquemaMensajeCriaturaSync>;

/** 4.5. Cambio ligero de metadatos globales del combate (ronda, turno activo, visibilidad de porcentaje). */
export const EsquemaMensajeMetaCombateSync = z.object({
  v: z.literal(VERSION_PROTOCOLO_SYNC_V2),
  s: z.string().optional(),
  t: z.literal("META_COMBATE"),
  r: z.number().int().min(1),
  idx: z.number().int().min(0),
  vPorcentaje: z.boolean(),
  limpiar: z.boolean().optional(),
});
export type MensajeMetaCombateSync = z.infer<typeof EsquemaMensajeMetaCombateSync>;

/** 4.6. Lote paginado (máx. 3 criaturas) para sincronización inicial cuando un jugador entra a mitad de combate. */
export const EsquemaMensajeLoteInicialSync = z.object({
  v: z.literal(VERSION_PROTOCOLO_SYNC_V2),
  s: z.string().optional(),
  t: z.literal("LOTE_INICIAL"),
  parte: z.number().int().min(1),
  total: z.number().int().min(1),
  r: z.number().int().min(1),
  idx: z.number().int().min(0),
  vPorcentaje: z.boolean(),
  criaturas: z.array(EsquemaResumenCriaturaDMWire).max(MAX_CRIATURAS_POR_LOTE),
});
export type MensajeLoteInicialSync = z.infer<typeof EsquemaMensajeLoteInicialSync>;

/** 4.7. Fragmento de transporte para mensajes atómicos que superan el presupuesto seguro. */
export const EsquemaMensajeFragmentoSyncV2 = z.object({
  v: z.literal(VERSION_PROTOCOLO_SYNC_V2),
  s: z.string().optional(),
  t: z.literal("FRAG"),
  id: z.string(),
  chunk: z.number().int().min(1),
  total: z.number().int().min(2),
  d: z.string(),
});
export type MensajeFragmentoSyncV2 = z.infer<typeof EsquemaMensajeFragmentoSyncV2>;

/** Unión discriminada de todos los mensajes válidos en Sync v2. */
export const EsquemaMensajeSyncV2 = z.discriminatedUnion("t", [
  EsquemaMensajeHolaSync,
  EsquemaMensajeEstadoPJSync,
  EsquemaMensajeDeltaVidaSync,
  EsquemaMensajeCriaturaSync,
  EsquemaMensajeMetaCombateSync,
  EsquemaMensajeLoteInicialSync,
  EsquemaMensajeFragmentoSyncV2,
]);
export type MensajeSyncV2 = z.infer<typeof EsquemaMensajeSyncV2>;

// ==========================================
// 5. TRANSFORMADORES DE WIRE FORMAT
// ==========================================

/**
 * Convierte un `EfectoActivo` de dominio a su representación compacta de red.
 */
export function serializarEfectoSyncV2(efecto: EfectoActivo): ResumenEfectoWire {
  const wire: ResumenEfectoWire = {
    id: efecto.id,
    n: efecto.nombre.slice(0, 30),
  };
  if (efecto.expiraRonda !== undefined) wire.r = efecto.expiraRonda;
  if (efecto.concentracion) wire.c = true;
  if (efecto.duracion !== undefined) wire.d = efecto.duracion;
  return wire;
}

/**
 * Reconstruye un `EfectoActivo` de dominio desde su representación compacta de red.
 */
export function deserializarEfectoSyncV2(wire: ResumenEfectoWire): EfectoActivo {
  const efecto: EfectoActivo = {
    id: wire.id,
    nombre: wire.n,
  };
  if (wire.r !== undefined) efecto.expiraRonda = wire.r;
  if (wire.c !== undefined) efecto.concentracion = wire.c;
  if (wire.d !== undefined) efecto.duracion = wire.d;
  return efecto;
}

/**
 * Empaqueta una `CriaturaIniciativa` en un `ResumenCriaturaDMWire` omitiendo valores por defecto
 * y acotando cadenas largas para garantizar paquetes < `LIMITE_SEGURO_PAQUETE_SYNC`.
 */
export function empaquetarResumenCriaturaDM(criatura: CriaturaIniciativa): ResumenCriaturaDMWire {
  const wire: ResumenCriaturaDMWire = {
    id: criatura.id,
    n: criatura.nombre.slice(0, 40),
    i: criatura.iniciativa,
    va: criatura.vidaActual,
    vm: criatura.vidaMaxima,
    ca: criatura.ca ?? 10,
    mon: Boolean(criatura.esMonstruo),
  };
  if (criatura.vidaTemporal && criatura.vidaTemporal > 0) wire.vt = criatura.vidaTemporal;
  if (criatura.condiciones && criatura.condiciones.length > 0) wire.c = criatura.condiciones;
  if (criatura.efectos && criatura.efectos.length > 0) {
    wire.e = criatura.efectos.map(serializarEfectoSyncV2);
  }
  if (criatura.idPlantillaAsociada) wire.pl = criatura.idPlantillaAsociada;
  if (criatura.esAcompanante) wire.acomp = true;
  if (criatura.idPersonajeDuenio) wire.duenio = criatura.idPersonajeDuenio;
  if (criatura.idAcompanante) wire.idAc = criatura.idAcompanante;
  if (!criatura.esMonstruo && criatura.avatarUrl) wire.av = criatura.avatarUrl;
  if (criatura.pasivas) {
    wire.p = [
      criatura.pasivas.percepcion,
      criatura.pasivas.investigacion,
      criatura.pasivas.perspicacia,
    ];
  }
  return wire;
}

/**
 * Desempaqueta un `ResumenCriaturaDMWire` a una `CriaturaIniciativa` de dominio.
 */
export function desempaquetarResumenCriaturaDM(wire: ResumenCriaturaDMWire): CriaturaIniciativa {
  return {
    id: wire.id,
    nombre: wire.n,
    avatarUrl: wire.av,
    iniciativa: wire.i,
    vidaActual: wire.va,
    vidaMaxima: wire.vm,
    vidaTemporal: wire.vt ?? 0,
    ca: wire.ca,
    esMonstruo: wire.mon,
    condiciones: wire.c ?? [],
    efectos: (wire.e ?? []).map(deserializarEfectoSyncV2),
    idPlantillaAsociada: wire.pl,
    velocidad: "30 pies",
    bonificadorIniciativa: 0,
    esAcompanante: wire.acomp ?? false,
    idPersonajeDuenio: wire.duenio,
    idAcompanante: wire.idAc,
    pasivas: wire.p
      ? {
          percepcion: wire.p[0],
          investigacion: wire.p[1],
          perspicacia: wire.p[2],
        }
      : undefined,
  };
}
