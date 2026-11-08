import { z } from "zod";
import { EsquemaEfectoActivo } from "@/tipos";
import type { CriaturaIniciativa, ElementoPendiente, EncuentroGuardado } from "@/almacen/usarAlmacenDM";
import { generarId } from "@/utiles/generarId";
import { logger } from "@/utiles/logger";

export const EsquemaCriaturaIniciativa = z.object({
  id: z.string().min(1).default(() => generarId('cr')),
  nombre: z.string().default("Criatura"),
  iniciativa: z.coerce.number().default(0),
  vidaMaxima: z.coerce.number().default(10),
  vidaActual: z.coerce.number().default(10),
  ca: z.coerce.number().default(10),
  condiciones: z.array(z.string()).default([]),
  efectos: z.array(EsquemaEfectoActivo).optional(),
  bonificadorIniciativa: z.coerce.number().default(0),
  esMonstruo: z.coerce.boolean().default(true),
  velocidad: z.string().default("30 pies"),
  vidaTemporal: z.coerce.number().optional(),
  idPlantillaAsociada: z.string().optional(),
  avatarUrl: z.string().optional(), idPersonajeDuenio: z.string().optional(), idAcompanante: z.string().optional(),
  esAcompanante: z.boolean().optional(), movimientoGastado: z.number().optional(),
  movimientoMaximoTemporal: z.number().nullable().optional(),
  pasivas: z.object({ percepcion: z.number(), investigacion: z.number(), perspicacia: z.number() }).optional()
});

export const EsquemaElementoPendiente = z.object({
  id: z.string().default(() => generarId('p_local')),
  texto: z.string().default(""),
  completado: z.coerce.boolean().default(false)
});

export const EsquemaEncuentroGuardado = z.object({
  nombre: z.string().default("Encuentro"),
  ronda: z.coerce.number().default(1),
  cola: z.array(EsquemaCriaturaIniciativa).default([]),
  fecha: z.string().default(() => new Date().toISOString())
});

export function sanearCriaturaIniciativa(raw: unknown): CriaturaIniciativa | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = EsquemaCriaturaIniciativa.safeParse(raw);
  if (parsed.success) return parsed.data as CriaturaIniciativa;
  logger.warn("[sanearCriaturaIniciativa] Datos de criatura de iniciativa inválidos descartados:", parsed.error.issues);
  return null;
}

export function sanearElementoPendiente(raw: unknown): ElementoPendiente | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = EsquemaElementoPendiente.safeParse(raw);
  if (parsed.success) return parsed.data;
  logger.warn("[sanearElementoPendiente] Elemento pendiente inválido descartado:", parsed.error.issues);
  return null;
}

export function sanearEncuentroGuardado(raw: unknown): EncuentroGuardado | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const colaFiltrada = Array.isArray(obj.cola)
    ? obj.cola
        .map((c) => sanearCriaturaIniciativa(c))
        .filter((c): c is CriaturaIniciativa => c !== null)
    : [];

  const rawNormalizado = {
    ...obj,
    cola: colaFiltrada
  };

  const parsed = EsquemaEncuentroGuardado.safeParse(rawNormalizado);
  if (parsed.success) return parsed.data as EncuentroGuardado;
  logger.warn("[sanearEncuentroGuardado] Encuentro guardado inválido descartado:", parsed.error.issues);
  return null;
}
