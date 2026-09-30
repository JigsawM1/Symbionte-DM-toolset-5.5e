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
}

export interface EstadoIniciativaDM {
  cola: CriaturaIniciativa[];
  indiceTurnoActivo: number;
  rondaActual: number;
  mostrarPorcentajeVidaAJugadores: boolean;
  metodoVidaMonstruo: string;
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

export interface WireEstadoCombatePJ {
  id: string;
  m?: string | null; // idMiniaturaTS
  n: string; // nombre
  i: number; // iniciativa
  va: number; // vidaActual
  vm: number; // vidaMaxima
  vt: number; // vidaTemporal
  ca: number; // clase de armadura
  c: string[]; // condiciones
  e: WireEfecto[]; // efectos
  p: [number, number, number]; // [percepcion, investigacion, perspicacia]
  cj?: {
    em: Record<string, number>; // espaciosMaximos
    eg: Record<string, number>; // espaciosGastados
    pm?: number; // puntosMaximos
    pg?: number; // puntosGastados
    pc?: [number, number, number]; // pacto: [maximos, gastados, nivel]
  };
  co?: { id: string; n: string } | null; // concentracion
}

export interface WireCriaturaIniciativa {
  id: string;
  n: string;
  i: number;
  va: number;
  vm: number;
  vt: number;
  ca: number;
  m: boolean; // esMonstruo
  c: string[]; // condiciones
  e?: WireEfecto[]; // efectos
  plant?: string; // idPlantillaAsociada
  vel?: string; // velocidad
  bon?: number; // bonificadorIniciativa
}

export interface WireEstadoIniciativaDM {
  c: WireCriaturaIniciativa[]; // cola
  t: number; // indiceTurnoActivo
  r: number; // rondaActual
  v: boolean; // mostrarPorcentajeVidaAJugadores
  mv: string; // metodoVidaMonstruo
}

export interface WireChunkIniciativa {
  chunk: number;
  total: number;
  t: number;
  r: number;
  v: boolean;
  mv: string;
  c: WireCriaturaIniciativa[];
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

const EsquemaWireEstadoCombatePJ = z.object({
  id: z.string(),
  m: z.string().nullable().optional(),
  n: z.string(),
  i: z.number(),
  va: z.number(),
  vm: z.number(),
  vt: z.number(),
  ca: z.number(),
  c: z.array(z.string()).default([]),
  e: z.array(EsquemaWireEfecto).default([]),
  p: z.tuple([z.number(), z.number(), z.number()]),
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
});

const EsquemaWireCriaturaIniciativa = z.object({
  id: z.string(),
  n: z.string(),
  i: z.number(),
  va: z.number(),
  vm: z.number(),
  vt: z.number().default(0),
  ca: z.number().default(10),
  m: z.boolean().default(false),
  c: z.array(z.string()).default([]),
  e: z.array(EsquemaWireEfecto).optional(),
  plant: z.string().optional(),
  vel: z.string().optional(),
  bon: z.number().optional(),
});

const EsquemaWireEstadoIniciativaDM = z.object({
  c: z.array(EsquemaWireCriaturaIniciativa),
  t: z.number().int(),
  r: z.number().int(),
  v: z.boolean(),
  mv: z.string(),
});

const EsquemaWireChunkIniciativa = z.object({
  chunk: z.number().int().min(1),
  total: z.number().int().min(2),
  t: z.number().int(),
  r: z.number().int(),
  v: z.boolean(),
  mv: z.string(),
  c: z.array(EsquemaWireCriaturaIniciativa),
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
]);

export type WireMensajeSync = z.infer<typeof EsquemaWireMensajeSync>;

// ==========================================
// 4. TRANSFORMADORES PURAS (DOMINIO <-> RED)
// ==========================================

export function serializarEstadoCombatePJ(pj: EstadoCombatePJ): WireEstadoCombatePJ {
  const wire: WireEstadoCombatePJ = {
    id: pj.id,
    m: pj.idMiniaturaTS ?? undefined,
    n: pj.nombre,
    i: pj.iniciativa,
    va: pj.hpActual,
    vm: pj.hpMaximo,
    vt: pj.hpTemporal,
    ca: pj.ca,
    c: pj.condiciones,
    e: pj.efectos.map((ef) => ({
      id: ef.id,
      n: ef.nombre,
      r: ef.expiraRonda,
      c: ef.concentracion,
      d: ef.duracion,
    })),
    p: [pj.pasivas.percepcion, pj.pasivas.investigacion, pj.pasivas.perspicacia],
  };

  if (pj.conjuros) {
    wire.cj = {
      em: pj.conjuros.espaciosMaximos,
      eg: pj.conjuros.espaciosGastados,
      pm: pj.conjuros.puntosMaximos,
      pg: pj.conjuros.puntosGastados,
      pc: pj.conjuros.pacto
        ? [pj.conjuros.pacto.maximos, pj.conjuros.pacto.gastados, pj.conjuros.pacto.nivel]
        : undefined,
    };
  }

  if (pj.concentracion) {
    wire.co = {
      id: pj.concentracion.hechizoId,
      n: pj.concentracion.nombreHechizo,
    };
  } else if (pj.concentracion === null) {
    wire.co = null;
  }

  return wire;
}

export function deserializarEstadoCombatePJ(wire: WireEstadoCombatePJ): EstadoCombatePJ {
  return {
    id: wire.id,
    idMiniaturaTS: wire.m ?? null,
    nombre: wire.n,
    iniciativa: wire.i,
    hpActual: wire.va,
    hpMaximo: wire.vm,
    hpTemporal: wire.vt,
    ca: wire.ca,
    condiciones: wire.c,
    efectos: wire.e.map((ef) => ({
      id: ef.id,
      nombre: ef.n,
      expiraRonda: ef.r,
      concentracion: ef.c,
      duracion: ef.d,
    })),
    pasivas: {
      percepcion: wire.p[0],
      investigacion: wire.p[1],
      perspicacia: wire.p[2],
    },
    conjuros: wire.cj
      ? {
          espaciosMaximos: wire.cj.em,
          espaciosGastados: wire.cj.eg,
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
  };
}

export function serializarIniciativaDM(dm: EstadoIniciativaDM): WireEstadoIniciativaDM {
  return {
    c: dm.cola.map((criatura) => ({
      id: criatura.id,
      n: criatura.nombre,
      i: criatura.iniciativa,
      va: criatura.vidaActual,
      vm: criatura.vidaMaxima,
      vt: criatura.vidaTemporal ?? 0,
      ca: criatura.ca,
      m: criatura.esMonstruo,
      c: criatura.condiciones || [],
      e: (criatura.efectos || []).map((ef) => ({
        id: ef.id,
        n: ef.nombre,
        r: ef.expiraRonda,
        c: ef.concentracion,
        d: ef.duracion,
      })),
      plant: criatura.idPlantillaAsociada,
      vel: criatura.velocidad,
      bon: criatura.bonificadorIniciativa,
    })),
    t: dm.indiceTurnoActivo,
    r: dm.rondaActual,
    v: dm.mostrarPorcentajeVidaAJugadores,
    mv: dm.metodoVidaMonstruo,
  };
}

export function deserializarIniciativaDM(wire: WireEstadoIniciativaDM): EstadoIniciativaDM {
  return {
    cola: wire.c.map((w) => ({
      id: w.id,
      nombre: w.n,
      iniciativa: w.i,
      vidaActual: w.va,
      vidaMaxima: w.vm,
      vidaTemporal: w.vt,
      ca: w.ca,
      esMonstruo: w.m,
      condiciones: w.c,
      efectos: (w.e || []).map((ef) => ({
        id: ef.id,
        nombre: ef.n,
        expiraRonda: ef.r,
        concentracion: ef.c,
        duracion: ef.d,
      })),
      idPlantillaAsociada: w.plant,
      velocidad: w.vel || "30 pies",
      bonificadorIniciativa: w.bon ?? 0,
    })),
    indiceTurnoActivo: wire.t,
    rondaActual: wire.r,
    mostrarPorcentajeVidaAJugadores: wire.v,
    metodoVidaMonstruo: wire.mv,
  };
}

/**
 * Divide el WireEstadoIniciativaDM en dos chunks si la cola excede el límite seguro.
 */
export function dividirEnChunksIniciativa(
  wire: WireEstadoIniciativaDM
): WireChunkIniciativa[] {
  const mitad = Math.ceil(wire.c.length / 2);
  const chunk1: WireChunkIniciativa = {
    chunk: 1,
    total: 2,
    t: wire.t,
    r: wire.r,
    v: wire.v,
    mv: wire.mv,
    c: wire.c.slice(0, mitad),
  };
  const chunk2: WireChunkIniciativa = {
    chunk: 2,
    total: 2,
    t: wire.t,
    r: wire.r,
    v: wire.v,
    mv: wire.mv,
    c: wire.c.slice(mitad),
  };
  return [chunk1, chunk2];
}
