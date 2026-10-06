/**
 * @module tipos/sync
 * Definiciones de dominio, esquemas Zod y transformadores del wire format
 * para el canal de sincronización bidireccional entre Simbiotes vía TS.sync.
 */

import { z } from "zod";
import type { CriaturaIniciativa, EfectoActivo } from "@/almacen/usarAlmacenDM";

// ==========================================
// 1. MODELOS DE DOMINIO (Semántica en Español)
// ==========================================

export interface ConcentracionCombate {
  hechizoId: string;
  nombreHechizo: string;
}

export interface ConjurosCombatePJ {
  espaciosMaximos: Record<string, number>;
  espaciosGastados: Record<string, number>;
  puntosMaximos?: number;
  puntosGastados?: number;
  pacto?: {
    maximos: number;
    gastados: number;
    nivel: number;
  };
}

export interface PasivasCombatePJ {
  percepcion: number;
  investigacion: number;
  perspicacia: number;
}

export interface EstadoCombateAcompanante {
  id: string;
  nombre: string;
  idPlantilla?: string;
  vidaActual: number;
  vidaMaxima: number;
  vidaTemporal?: number;
  ca?: number;
  condiciones: string[];
  efectos: EfectoActivo[];
  iniciativa?: number;
  idMiniaturaTS?: string | null;
  velocidad?: string;
  movimientoGastado?: number;
  movimientoMaximoTemporal?: number | null;
  esInvocacion?: boolean;
  nivelConjuroInvocacion?: number;
  subtipoInvocacion?: string;
}

/**
 * DTO delgado proyectado del PersonajeJugador para el combate.
 * Excluye inventario, rasgos descriptivos y catálogos estáticos.
 */
export interface EstadoCombatePJ {
  id: string;
  idMiniaturaTS?: string | null;
  nombre: string;
  iniciativa: number;
  hpActual: number;
  hpMaximo: number;
  hpTemporal: number;
  ca: number;
  condiciones: string[];
  efectos: EfectoActivo[];
  pasivas: PasivasCombatePJ;
  conjuros?: ConjurosCombatePJ;
  concentracion?: ConcentracionCombate | null;
  movimientoGastado?: number;
  movimientoMaximoTemporal?: number | null;
  acompanantes?: EstadoCombateAcompanante[];
  ts?: number;
}

export interface EstadoIniciativaDM {
  cola: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  rondaActual: number;
  mostrarPorcentajeVidaAJugadores: boolean;
  metodoVidaMonstruo: string;
  ts?: number;
}

// ==========================================
// 2. WIRE FORMAT COMPACTO (Para transmisión < 1KB)
// ==========================================

export interface WireEfecto {
  id: string;
  n: string; // nombre
  r?: number; // expiraRonda
  c?: boolean; // concentracion
  d?: number; // duracion
}

export interface WireAcompanante {
  id: string;
  n: string; // nombre
  va: number; // vidaActual
  vm: number; // vidaMaxima
  vt?: number; // vidaTemporal (se omite si es 0)
  ca?: number; // ca (se omite si es 10)
  c?: string[]; // condiciones (se omite si está vacío)
  e?: WireEfecto[]; // efectos (se omite si está vacío)
  i?: number; // iniciativa (se omite si es 0)
  m?: string | null; // idMiniaturaTS
  plant?: string; // idPlantilla
  vel?: string; // velocidad
  gast?: number; // movimientoGastado
  maxT?: number; // movimientoMaximoTemporal
  inv?: boolean; // esInvocacion
  lvl?: number; // nivelConjuroInvocacion
  sub?: string; // subtipoInvocacion
}

export interface WireEstadoCombatePJ {
  id: string;
  m?: string | null; // idMiniaturaTS
  n: string; // nombre
  i: number; // iniciativa
  va: number; // vidaActual
  vm: number; // vidaMaxima
  vt?: number; // vidaTemporal (se omite si es 0)
  ca?: number; // clase de armadura (se omite si es 10)
  c?: string[]; // condiciones (se omite si está vacío)
  e?: WireEfecto[]; // efectos (se omite si está vacío)
  p?: [number, number, number]; // [percepcion, investigacion, perspicacia]
  cj?: {
    em: Record<string, number>; // espaciosMaximos
    eg: Record<string, number>; // espaciosGastados
    pm?: number; // puntosMaximos
    pg?: number; // puntosGastados
    pc?: [number, number, number]; // pacto: [maximos, gastados, nivel]
  };
  co?: { id: string; n: string } | null; // concentracion
  gast?: number; // movimientoGastado
  maxT?: number; // movimientoMaximoTemporal
  ac?: WireAcompanante[]; // acompanantes
  ts?: number; // timestamp ms de la emisión
}

export interface WireCriaturaIniciativa {
  id: string;
  n: string;
  i: number;
  va: number;
  vm: number;
  vt?: number; // vidaTemporal (se omite si es 0)
  ca?: number; // clase de armadura (se omite si es 10)
  m?: boolean; // esMonstruo (se omite si es false)
  c?: string[]; // condiciones (se omite si está vacío)
  e?: WireEfecto[]; // efectos (se omite si está vacío)
  plant?: string; // idPlantillaAsociada
  vel?: string; // velocidad (se omite si es "30 pies")
  bon?: number; // bonificadorIniciativa (se omite si es 0)
  gast?: number; // movimientoGastado
  maxT?: number; // movimientoMaximoTemporal
  ac?: boolean; // esAcompanante
  du?: string; // idPersonajeDuenio
  acId?: string; // idAcompanante
}

export interface WireEstadoIniciativaDM {
  c: WireCriaturaIniciativa[]; // cola
  t: number; // indiceTurnoActivo
  r: number; // rondaActual
  v: boolean; // mostrarPorcentajeVidaAJugadores
  mv: string; // metodoVidaMonstruo
  ts?: number; // timestamp ms del snapshot
}

export interface WireChunkIniciativa {
  sid: number; // ID de sesión/ráfaga para agrupar chunks sin entrelazado
  chunk: number;
  total: number;
  t: number;
  r: number;
  v: boolean;
  mv: string;
  c: WireCriaturaIniciativa[];
  ts?: number;
}

// ==========================================
// 3. ESQUEMAS ZOD PARA VALIDACIÓN DEFENSIVA
// ==========================================

const EsquemaWireEfecto = z.object({
  id: z.string(),
  n: z.string(),
  r: z.number().int().optional(),
  c: z.boolean().optional(),
  d: z.number().optional(),
});

const EsquemaWireAcompanante = z.object({
  id: z.string(),
  n: z.string().default("Acompañante"),
  va: z.number().nullable().optional().transform((v) => v ?? 0),
  vm: z.number().nullable().optional().transform((v) => v ?? 0),
  vt: z.number().nullable().optional().transform((v) => v ?? 0),
  ca: z.number().nullable().optional().transform((v) => v ?? 10),
  c: z.array(z.string()).default([]),
  e: z.array(EsquemaWireEfecto).default([]),
  i: z.number().nullable().optional().transform((v) => v ?? 0),
  m: z.string().nullable().optional(),
  plant: z.string().nullable().optional().transform((v) => v ?? undefined),
  vel: z.string().nullable().optional().transform((v) => v ?? undefined),
  gast: z.number().nullable().optional().transform((v) => v ?? undefined),
  maxT: z.number().nullable().optional().transform((v) => v ?? undefined),
  inv: z.boolean().optional(),
  lvl: z.number().nullable().optional().transform((v) => v ?? undefined),
  sub: z.string().nullable().optional().transform((v) => v ?? undefined),
});

const EsquemaWireEstadoCombatePJ = z.object({
  id: z.string(),
  m: z.string().nullable().optional(),
  n: z.string().default("Personaje"),
  i: z.number().default(0),
  va: z.number().nullable().optional().transform((v) => v ?? 0),
  vm: z.number().nullable().optional().transform((v) => v ?? 0),
  vt: z.number().nullable().optional().transform((v) => v ?? 0),
  ca: z.number().nullable().optional().transform((v) => v ?? 10),
  c: z.array(z.string()).default([]),
  e: z.array(EsquemaWireEfecto).default([]),
  p: z.tuple([z.number(), z.number(), z.number()]).default([10, 10, 10]),
  cj: z
    .object({
      em: z.record(z.string(), z.number()).default({}),
      eg: z.record(z.string(), z.number()).default({}),
      pm: z.number().optional(),
      pg: z.number().optional(),
      pc: z.tuple([z.number(), z.number(), z.number()]).optional(),
    })
    .optional(),
  co: z
    .object({
      id: z.string(),
      n: z.string(),
    })
    .nullable()
    .optional(),
  gast: z.number().nullable().optional().transform((v) => v ?? undefined),
  maxT: z.number().nullable().optional().transform((v) => v ?? undefined),
  ac: z.array(EsquemaWireAcompanante).optional(),
  ts: z.number().optional(),
});

const EsquemaWireCriaturaIniciativa = z.object({
  id: z.string(),
  n: z.string().default("Criatura"),
  i: z.number().default(0),
  va: z.number().nullable().optional().transform((v) => v ?? 0),
  vm: z.number().nullable().optional().transform((v) => v ?? 0),
  vt: z.number().nullable().optional().transform((v) => v ?? 0),
  ca: z.number().nullable().optional().transform((v) => v ?? 10),
  m: z.boolean().default(false),
  c: z.array(z.string()).default([]),
  e: z.array(EsquemaWireEfecto).optional().default([]),
  plant: z.string().nullable().optional().transform((v) => v ?? undefined),
  vel: z.string().nullable().optional().transform((v) => v ?? undefined),
  bon: z.number().nullable().optional().transform((v) => v ?? undefined),
  gast: z.number().nullable().optional().transform((v) => v ?? undefined),
  maxT: z.number().nullable().optional().transform((v) => v ?? undefined),
  ac: z.boolean().optional(),
  du: z.string().nullable().optional().transform((v) => v ?? undefined),
  acId: z.string().nullable().optional().transform((v) => v ?? undefined),
});

const EsquemaWireEstadoIniciativaDM = z.object({
  c: z.array(EsquemaWireCriaturaIniciativa),
  t: z.number().int(),
  r: z.number().int(),
  v: z.boolean(),
  mv: z.string(),
  ts: z.number().optional(),
});

const EsquemaWireChunkIniciativa = z.object({
  sid: z.number(),
  chunk: z.number().int().min(1),
  total: z.number().int().min(2),
  t: z.number().int(),
  r: z.number().int(),
  v: z.boolean(),
  mv: z.string(),
  c: z.array(EsquemaWireCriaturaIniciativa),
  ts: z.number().optional(),
});

export const EsquemaWireMensajeSync = z.discriminatedUnion("t", [
  z.object({
    v: z.literal(1),
    t: z.literal("PJ"),
    d: EsquemaWireEstadoCombatePJ,
  }),
  z.object({
    v: z.literal(1),
    t: z.literal("DM"),
    d: EsquemaWireEstadoIniciativaDM,
  }),
  z.object({
    v: z.literal(1),
    t: z.literal("DM_CHUNK"),
    d: EsquemaWireChunkIniciativa,
  }),
  z.object({
    v: z.literal(1),
    t: z.literal("REQ"),
  }),
  z.object({
    v: z.literal(1),
    t: z.literal("ACK"),
    id: z.string(),
    ts: z.number(),
  }),
]);

export type WireMensajeSync = z.infer<typeof EsquemaWireMensajeSync>;

// ==========================================
// 4. TRANSFORMADORES PURAS (DOMINIO <-> RED)
// ==========================================

export function serializarEstadoCombatePJ(
  pj: EstadoCombatePJ,
  incluirPasivas = true
): WireEstadoCombatePJ {
  const wire: WireEstadoCombatePJ = {
    id: pj.id,
    n: (pj.nombre || "Personaje").slice(0, 24),
    i: pj.iniciativa ?? 0,
    va: pj.hpActual ?? 0,
    vm: pj.hpMaximo ?? 0,
  };

  if (pj.ts) wire.ts = pj.ts;
  if (pj.idMiniaturaTS) wire.m = pj.idMiniaturaTS;
  if (pj.hpTemporal && pj.hpTemporal > 0) wire.vt = pj.hpTemporal;
  if (pj.ca !== undefined && pj.ca !== 10) wire.ca = pj.ca;
  if (pj.condiciones && pj.condiciones.length > 0) wire.c = pj.condiciones;
  if (pj.efectos && pj.efectos.length > 0) {
    wire.e = pj.efectos.map((ef) => ({
      id: ef.id,
      n: ef.nombre.slice(0, 24),
      r: ef.expiraRonda,
      c: ef.concentracion,
      d: ef.duracion,
    }));
  }

  // Optimización de payload: omitir pasivas por defecto o cuando incluirPasivas = false para ahorrar ~18 bytes por tick
  if (
    incluirPasivas &&
    pj.pasivas &&
    (pj.pasivas.percepcion !== 10 ||
      pj.pasivas.investigacion !== 10 ||
      pj.pasivas.perspicacia !== 10)
  ) {
    wire.p = [
      pj.pasivas.percepcion ?? 10,
      pj.pasivas.investigacion ?? 10,
      pj.pasivas.perspicacia ?? 10,
    ];
  }

  if (pj.concentracion) {
    wire.co = {
      id: pj.concentracion.hechizoId,
      n: pj.concentracion.nombreHechizo,
    };
  } else if (pj.concentracion === null) {
    wire.co = null;
  }

  if (pj.acompanantes && pj.acompanantes.length > 0) {
    wire.ac = pj.acompanantes.map((a) => {
      const wa: WireAcompanante = {
        id: a.id,
        n: (a.nombre || "Acomp").slice(0, 20),
        va: a.vidaActual ?? 0,
        vm: a.vidaMaxima ?? 0,
      };
      if (a.vidaTemporal && a.vidaTemporal > 0) wa.vt = a.vidaTemporal;
      if (a.ca !== undefined && a.ca !== 10) wa.ca = a.ca;
      if (a.condiciones && a.condiciones.length > 0) wa.c = a.condiciones;
      if (a.efectos && a.efectos.length > 0) {
        wa.e = a.efectos.map((ef) => ({
          id: ef.id,
          n: ef.nombre.slice(0, 20),
          r: ef.expiraRonda,
          c: ef.concentracion,
          d: ef.duracion,
        }));
      }
      if (typeof a.iniciativa === "number") wa.i = a.iniciativa;
      if (a.idMiniaturaTS) wa.m = a.idMiniaturaTS;
      return wa;
    });
  }

  return wire;
}

export function deserializarEstadoCombatePJ(wire: WireEstadoCombatePJ): EstadoCombatePJ {
  return {
    id: wire.id,
    idMiniaturaTS: wire.m ?? null,
    nombre: wire.n || "Personaje",
    iniciativa: wire.i ?? 0,
    hpActual: wire.va ?? 0,
    hpMaximo: wire.vm ?? 0,
    hpTemporal: wire.vt ?? 0,
    ca: wire.ca ?? 10,
    condiciones: wire.c || [],
    ts: wire.ts,
    efectos: (wire.e || []).map((ef) => ({
      id: ef.id,
      nombre: ef.n,
      expiraRonda: ef.r,
      concentracion: ef.c,
      duracion: ef.d,
    })),
    pasivas: {
      percepcion: wire.p ? wire.p[0] : 10,
      investigacion: wire.p ? wire.p[1] : 10,
      perspicacia: wire.p ? wire.p[2] : 10,
    },
    conjuros: wire.cj
      ? {
          espaciosMaximos: wire.cj.em || {},
          espaciosGastados: wire.cj.eg || {},
          puntosMaximos: wire.cj.pm,
          puntosGastados: wire.cj.pg,
          pacto: wire.cj.pc
            ? {
                maximos: wire.cj.pc[0],
                gastados: wire.cj.pc[1],
                nivel: wire.cj.pc[2],
              }
            : undefined,
        }
      : undefined,
    concentracion: wire.co
      ? {
          hechizoId: wire.co.id,
          nombreHechizo: wire.co.n,
        }
      : wire.co === null
      ? null
      : undefined,
    movimientoGastado: wire.gast,
    movimientoMaximoTemporal: wire.maxT,
    acompanantes: (wire.ac || []).map((wa) => ({
      id: wa.id,
      nombre: wa.n || "Acompañante",
      idPlantilla: wa.plant,
      vidaActual: wa.va ?? 0,
      vidaMaxima: wa.vm ?? 0,
      vidaTemporal: wa.vt ?? 0,
      ca: wa.ca ?? 10,
      condiciones: wa.c || [],
      efectos: (wa.e || []).map((ef) => ({
        id: ef.id,
        nombre: ef.n,
        expiraRonda: ef.r,
        concentracion: ef.c,
        duracion: ef.d,
      })),
      iniciativa: wa.i ?? 0,
      idMiniaturaTS: wa.m ?? null,
      velocidad: wa.vel || "30 pies",
      movimientoGastado: wa.gast ?? 0,
      movimientoMaximoTemporal: wa.maxT ?? null,
      esInvocacion: wa.inv,
      nivelConjuroInvocacion: wa.lvl,
      subtipoInvocacion: wa.sub,
    })),
  };
}

export function serializarIniciativaDM(dm: EstadoIniciativaDM): WireEstadoIniciativaDM {
  return {
    c: (dm.cola || []).map((criatura) => {
      const item: WireCriaturaIniciativa = {
        id: criatura.id,
        n: (criatura.nombre || "Criatura").slice(0, 24),
        i: criatura.iniciativa ?? 0,
        va: criatura.vidaActual ?? 0,
        vm: criatura.vidaMaxima ?? 0,
      };
      if (criatura.vidaTemporal && criatura.vidaTemporal > 0) item.vt = criatura.vidaTemporal;
      if (criatura.esAcompanante) item.ac = true;
      if (criatura.idPersonajeDuenio) item.du = criatura.idPersonajeDuenio;
      if (criatura.idAcompanante) item.acId = criatura.idAcompanante;

      if (criatura.esMonstruo) {
        item.m = true;
      } else {
        if (criatura.ca !== undefined && criatura.ca !== 10) item.ca = criatura.ca;
        if (criatura.bonificadorIniciativa) item.bon = criatura.bonificadorIniciativa;
      }

      if (criatura.condiciones && criatura.condiciones.length > 0) item.c = criatura.condiciones;
      if (criatura.efectos && criatura.efectos.length > 0) {
        item.e = criatura.efectos.map((ef) => ({
          id: ef.id,
          n: ef.nombre.slice(0, 20),
          r: ef.expiraRonda,
          c: ef.concentracion,
          d: ef.duracion,
        }));
      }
      return item;
    }),
    t: dm.indiceTurnoActivo ?? 0,
    r: dm.rondaActual ?? 1,
    v: Boolean(dm.mostrarPorcentajeVidaAJugadores),
    mv: dm.metodoVidaMonstruo || "estandar",
    ts: dm.ts ?? Date.now(),
  };
}

export function deserializarIniciativaDM(wire: WireEstadoIniciativaDM): EstadoIniciativaDM {
  return {
    cola: (wire.c || []).map((w) => ({
      id: w.id,
      nombre: w.n || "Criatura",
      iniciativa: w.i ?? 0,
      vidaActual: w.va ?? 0,
      vidaMaxima: w.vm ?? 0,
      vidaTemporal: w.vt ?? 0,
      ca: w.ca ?? 10,
      esMonstruo: Boolean(w.m),
      condiciones: w.c || [],
      efectos: (w.e || []).map((ef) => ({
        id: ef.id,
        nombre: ef.n,
        expiraRonda: ef.r,
        concentracion: ef.c,
        duracion: ef.d,
      })),
      idPlantillaAsociada: w.plant ?? undefined,
      velocidad: w.vel || "30 pies",
      bonificadorIniciativa: w.bon ?? 0,
      movimientoGastado: w.gast ?? 0,
      movimientoMaximoTemporal: w.maxT ?? null,
      esAcompanante: Boolean(w.ac),
      idPersonajeDuenio: w.du ?? undefined,
      idAcompanante: w.acId ?? undefined,
    })),
    indiceTurnoActivo: wire.t ?? 0,
    rondaActual: wire.r ?? 1,
    mostrarPorcentajeVidaAJugadores: Boolean(wire.v),
    metodoVidaMonstruo: wire.mv || "estandar",
    ts: wire.ts,
  };
}

/**
 * Divide el WireEstadoIniciativaDM dinámicamente en N chunks si la cola excede el límite seguro.
 * Garantiza que cada chunk serializado quede estrictamente por debajo de maxBytesPorChunk (por defecto 380).
 */
export function dividirEnChunksIniciativa(
  wire: WireEstadoIniciativaDM,
  maxBytesPorChunk = 380,
  sidPropio?: number
): WireChunkIniciativa[] {
  const todasCriaturas = wire.c || [];
  if (todasCriaturas.length === 0) {
    return [];
  }

  const sid = sidPropio ?? (Date.now() % 10000000);

  // Agrupar criaturas de modo que ningún chunk serializado exceda maxBytesPorChunk
  const MAX_CRIATURAS_POR_CHUNK = 4;
  const grupos: WireCriaturaIniciativa[][] = [];
  let grupoActual: WireCriaturaIniciativa[] = [];

  for (const criatura of todasCriaturas) {
    const pruebaGrupo = [...grupoActual, criatura];
    const pruebaWire: WireChunkIniciativa = {
      sid,
      chunk: 1,
      total: 99,
      t: wire.t,
      r: wire.r,
      v: wire.v,
      mv: wire.mv,
      c: pruebaGrupo,
      ts: wire.ts,
    };
    const longitudSerializada = JSON.stringify({ v: 1, t: "DM_CHUNK", d: pruebaWire }).length;

    if (
      (longitudSerializada > maxBytesPorChunk || grupoActual.length >= MAX_CRIATURAS_POR_CHUNK) &&
      grupoActual.length > 0
    ) {
      grupos.push(grupoActual);
      grupoActual = [criatura];
    } else {
      grupoActual.push(criatura);
    }
  }

  if (grupoActual.length > 0) {
    grupos.push(grupoActual);
  }

  const total = grupos.length;

  return grupos.map((g, idx) => ({
    sid,
    chunk: idx + 1,
    total,
    t: wire.t,
    r: wire.r,
    v: wire.v,
    mv: wire.mv,
    c: g,
    ts: wire.ts,
  }));
}
