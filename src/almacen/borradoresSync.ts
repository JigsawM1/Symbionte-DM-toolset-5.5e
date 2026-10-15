import { z } from 'zod';
import type { BorradorCombatePJ } from '@/tipos/borradoresSync';
import { EsquemaWireEstadoCombatePJ, serializarEstadoCombatePJ, deserializarEstadoCombatePJ } from '@/tipos/sync';

// Compatibilidad del almacenamiento local. Estos campos nunca se aceptan desde la red.
const numeroOpcional = z.number().nullable().optional().transform(v => v ?? undefined);
const textoOpcional = z.string().nullable().optional().transform(v => v ?? undefined);
const esquemaAcompanante = EsquemaWireEstadoCombatePJ.shape.ac.unwrap().element.extend({
  plant: textoOpcional, vel: textoOpcional, gast: numeroOpcional,
  maxT: z.number().nullable().optional(), inv: z.boolean().optional(),
  lvl: numeroOpcional, sub: textoOpcional,
});
const esquemaBorrador = EsquemaWireEstadoCombatePJ.extend({
  cj: z.object({
    em: z.record(z.string(), z.number()).default({}),
    eg: z.record(z.string(), z.number()).default({}),
    pm: z.number().optional(), pg: z.number().optional(),
    pc: z.tuple([z.number(), z.number(), z.number()]).optional(),
  }).optional(),
  gast: numeroOpcional,
  maxT: z.number().nullable().optional(),
  ac: z.array(esquemaAcompanante).optional(),
});

/** Mantiene el formato compacto existente y conserva la recuperación local completa. */
export function serializarBorradorSync(dto: BorradorCombatePJ) {
  const combate = serializarEstadoCombatePJ(dto);
  return {
    ...combate,
    cj: dto.conjuros ? {
      em: dto.conjuros.espaciosMaximos, eg: dto.conjuros.espaciosGastados,
      pm: dto.conjuros.puntosMaximos, pg: dto.conjuros.puntosGastados,
      pc: dto.conjuros.pacto ? [dto.conjuros.pacto.maximos, dto.conjuros.pacto.gastados, dto.conjuros.pacto.nivel] : undefined,
    } : undefined,
    gast: dto.movimientoGastado, maxT: dto.movimientoMaximoTemporal,
    ac: dto.acompanantes?.map((a, indice) => ({
      ...combate.ac?.[indice], plant: a.idPlantilla, vel: a.velocidad,
      gast: a.movimientoGastado, maxT: a.movimientoMaximoTemporal,
      inv: a.esInvocacion, lvl: a.nivelConjuroInvocacion, sub: a.subtipoInvocacion,
    })),
  };
}

export function deserializarBorradorSync(raw: unknown): BorradorCombatePJ {
  const local = esquemaBorrador.parse(raw);
  const combate = deserializarEstadoCombatePJ(local);
  return {
    ...combate,
    conjuros: local.cj ? {
      espaciosMaximos: local.cj.em, espaciosGastados: local.cj.eg,
      puntosMaximos: local.cj.pm, puntosGastados: local.cj.pg,
      pacto: local.cj.pc ? { maximos: local.cj.pc[0], gastados: local.cj.pc[1], nivel: local.cj.pc[2] } : undefined,
    } : undefined,
    movimientoGastado: local.gast, movimientoMaximoTemporal: local.maxT,
    acompanantes: combate.acompanantes?.map((a, indice) => {
      const datos = local.ac![indice];
      return {
        ...a, idPlantilla: datos.plant, velocidad: datos.vel,
        movimientoGastado: datos.gast, movimientoMaximoTemporal: datos.maxT,
        esInvocacion: datos.inv, nivelConjuroInvocacion: datos.lvl, subtipoInvocacion: datos.sub,
      };
    }),
  };
}
