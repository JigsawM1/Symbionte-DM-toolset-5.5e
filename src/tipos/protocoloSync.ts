/**
 * @module tipos/protocoloSync
 * Contratos de dominio, constantes y esquemas Zod para el protocolo de
 * sincronización v4. Los codecs anteriores permanecen para lectura de datos locales.
 */

import { z } from "zod";
import type { CriaturaIniciativa, EfectoActivo } from "@/almacen/usarAlmacenDM";

/** Contrato activo v4. Los formatos anteriores sólo se conservan para datos locales y migración. */
export const VERSION_PROTOCOLO_SYNC_V4 = 4;
const idSyncV4 = z.string().min(1).max(128);
const revisionSyncV4 = z.number().int().nonnegative().safe();
export const EsquemaContextoSyncV4 = z.object({
  campania: idSyncV4, tablero: idSyncV4, sesion: idSyncV4, director: idSyncV4,
});
export type ContextoSyncV4 = z.infer<typeof EsquemaContextoSyncV4>;
export const EsquemaGruposSyncV4 = z.object({
  vitalidad: z.object({ actual: z.number().int().nonnegative(), maxima: z.number().int().positive(),
    temporal: z.number().int().nonnegative() }).refine(v => v.actual <= v.maxima),
  estados: z.object({ condiciones: z.array(z.string().max(256)).max(256),
    efectos: z.array(z.object({ id: idSyncV4, nombre: z.string().max(256),
      expiraRonda: revisionSyncV4.optional(), concentracion: z.boolean().optional(),
      duracion: z.number().nonnegative().optional() })).max(1024),
    concentracion: z.object({ origen: z.enum(['conjuro', 'rasgo']), id: idSyncV4,
      nombre: z.string().max(256) }).nullable() }),
  datos: z.object({ nombre: z.string().max(256), avatar: z.string().max(8192).optional(),
    iniciativa: z.number().finite(), ca: z.number().finite(),
    pasivas: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]),
    horda: z.tuple([z.number().int().nonnegative(), z.number().int().positive()]).optional() }),
  acompanantes: z.array(z.object({ id: idSyncV4, miniatura: idSyncV4.nullable() })).max(256),
});
export type GruposSyncV4 = z.infer<typeof EsquemaGruposSyncV4>;
export type GrupoSyncV4 = keyof GruposSyncV4;
export const GRUPOS_SYNC_V4: readonly GrupoSyncV4[] = ['vitalidad', 'estados', 'datos', 'acompanantes'];
export const EsquemaRevisionesSyncV4 = z.object({ vitalidad: revisionSyncV4,
  estados: revisionSyncV4, datos: revisionSyncV4, acompanantes: revisionSyncV4 });
export const EsquemaEntidadSyncV4 = z.object({ id: idSyncV4, duenio: idSyncV4,
  miniatura: idSyncV4.nullable(), padre: idSyncV4.nullable(),
  ficha: idSyncV4.optional(), fila: idSyncV4.optional(), monstruo: z.boolean().optional(), plantilla: idSyncV4.optional(),
  revision: revisionSyncV4, revisiones: EsquemaRevisionesSyncV4,
  grupos: EsquemaGruposSyncV4, eliminada: z.boolean() });
export type EntidadSyncV4 = z.infer<typeof EsquemaEntidadSyncV4>;
export const EsquemaMetaSyncV4 = z.object({ orden: z.array(idSyncV4).max(4096), activo: idSyncV4.nullable(),
  ronda: z.number().int().positive().safe(), porcentaje: z.boolean() });
export type MetaSyncV4 = z.infer<typeof EsquemaMetaSyncV4>;
const sobreSyncV4 = z.object({ v: z.literal(4), contexto: EsquemaContextoSyncV4, emisor: idSyncV4,
  sesionEmisor: idSyncV4.optional() });
const esquemaMensajeExtendidoSyncV4 = z.discriminatedUnion('t', [
  sobreSyncV4.extend({ t: z.literal('HOLA'), solicitud: idSyncV4 }),
  sobreSyncV4.extend({ t: z.literal('DIRECCION'), fase: z.enum(['voto', 'anuncio', 'requiere-voto']), candidato: idSyncV4 }),
  sobreSyncV4.extend({ t: z.literal('COMBATE'), revision: revisionSyncV4, meta: EsquemaMetaSyncV4 }),
  sobreSyncV4.extend({ t: z.literal('PROPUESTA'), operacion: idSyncV4, entidad: idSyncV4,
    registro: EsquemaEntidadSyncV4.optional(), revisionesHijos: z.record(z.string(), revisionSyncV4).optional(),
    restaurar: z.boolean().optional(),
    bases: EsquemaRevisionesSyncV4, cambios: EsquemaGruposSyncV4.partial(),
    resolver: z.array(z.enum(['vitalidad', 'estados', 'datos', 'acompanantes'])).max(4).default([]) }),
  sobreSyncV4.extend({ t: z.literal('CONFIRMADO'), operacion: idSyncV4,
    revision: revisionSyncV4, entidad: EsquemaEntidadSyncV4 }),
  sobreSyncV4.extend({ t: z.literal('RESULTADO'), operacion: idSyncV4,
    estado: z.enum(['aplicado', 'conflicto', 'rechazado']), revision: revisionSyncV4,
    conflictos: z.array(z.enum(['vitalidad', 'estados', 'datos', 'acompanantes'])).max(4),
    entidad: EsquemaEntidadSyncV4.optional() }),
  sobreSyncV4.extend({ t: z.literal('LOTE'), snapshot: idSyncV4, revision: revisionSyncV4,
    parte: z.number().int().min(1).max(4096), total: z.number().int().min(1).max(4096),
    entidades: z.array(EsquemaEntidadSyncV4).max(3), meta: EsquemaMetaSyncV4.optional() }),
  sobreSyncV4.extend({ t: z.literal('LATIDO'), revision: revisionSyncV4 }),
  sobreSyncV4.extend({ t: z.literal('FRAG'), id: idSyncV4,
    tipoMensaje: z.string().max(32).optional(),
    parte: z.number().int().min(1).max(4096), total: z.number().int().min(2).max(4096),
    texto: z.string().min(1).max(400) }),
]);
/** Sólo abrevia claves; la autoridad y el contexto conservan sus valores completos. */
const esquemaFragmentoCompactoV4 = z.object({ v: z.literal(4), t: z.literal('F'),
  c: z.tuple([idSyncV4, idSyncV4, idSyncV4, idSyncV4]), e: idSyncV4, s: idSyncV4.optional(), i: idSyncV4,
  k: z.string().max(32).optional(),
  p: z.number().int().min(1).max(4096), n: z.number().int().min(2).max(4096), x: z.string().min(1).max(400),
}).transform(f => ({ v: 4 as const, t: 'FRAG' as const,
  contexto: { campania: f.c[0], tablero: f.c[1], sesion: f.c[2], director: f.c[3] },
  emisor: f.e, sesionEmisor: f.s, id: f.i, tipoMensaje: f.k, parte: f.p, total: f.n, texto: f.x }));
export const EsquemaMensajeSyncV4 = esquemaMensajeExtendidoSyncV4.or(esquemaFragmentoCompactoV4);
export type MensajeSyncV4 = z.infer<typeof EsquemaMensajeSyncV4>;

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
  hr: z.tuple([z.number().int().nonnegative(), z.number().int().positive()]).optional(),
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
  if (criatura.barrasVida && criatura.barrasVida.length > 1) {
    wire.hr = [criatura.barrasVida.filter((b) => b.vidaActual > 0).length, criatura.barrasVida.length];
  } else if (criatura.resumenHorda && criatura.resumenHorda.totales > 1) {
    wire.hr = [criatura.resumenHorda.vivos, criatura.resumenHorda.totales];
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
    resumenHorda: wire.hr ? { vivos: wire.hr[0], totales: wire.hr[1] } : undefined,
    pasivas: wire.p
      ? {
          percepcion: wire.p[0],
          investigacion: wire.p[1],
          perspicacia: wire.p[2],
        }
      : undefined,
  };
}
