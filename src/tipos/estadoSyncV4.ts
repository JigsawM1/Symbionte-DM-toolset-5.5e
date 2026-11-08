import { z } from 'zod';
import { EsquemaEntidadSyncV4, type EntidadSyncV4, type GrupoSyncV4 } from './protocoloSync';

export const EsquemaMemoriaSyncV4 = z.record(z.string(), z.object({
  base: z.record(z.string(), EsquemaEntidadSyncV4),
  pendientes: z.record(z.string(), EsquemaEntidadSyncV4),
  resoluciones: z.record(z.string(), z.array(z.enum(['vitalidad', 'estados', 'datos', 'acompanantes']))).optional(),
  conflictos: z.record(z.string(), z.array(z.enum(['vitalidad', 'estados', 'datos', 'acompanantes']))).optional(),
}));
export type MemoriaSyncV4 = z.infer<typeof EsquemaMemoriaSyncV4>;
export interface ConflictoSyncV4 {
  id: string;
  local: EntidadSyncV4;
  remoto: EntidadSyncV4;
  grupos: GrupoSyncV4[];
}
export interface EstadoConexionSyncV4 {
  estado: 'desconectado' | 'eligiendo' | 'recuperando' | 'conectado';
  director: string | null;
  soyDirector: boolean;
  candidatos: { id: string; nombre: string }[];
  conflictos: ConflictoSyncV4[];
  pendientes: number;
}
export const CONEXION_SYNC_V4_INICIAL: EstadoConexionSyncV4 = {
  estado: 'desconectado', director: null, soyDirector: false, candidatos: [], conflictos: [], pendientes: 0,
};
