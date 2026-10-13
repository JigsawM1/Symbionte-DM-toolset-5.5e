import { EsquemaMonstruoBase, EsquemaHechizoBase, EsquemaObjetoJuego } from "@/tipos";
import { z } from 'zod';
import type { EstadoDM } from './usarAlmacenDM';
import { sanearPersonaje, sanearCriaturaIniciativa, sanearElementoPendiente, sanearEncuentroGuardado, sanearObjetoHomebrew, sanearHechizoCD, sanearMonstruoSentidosYPasiva } from './sanitizacion';
import { hidratarPersonaje } from '@/servicios/serializadorPersonaje';
import { MONSTRUOS_INICIALES, HECHIZOS_INICIALES, OBJETOS_INICIALES } from '@/utiles/datosIniciales';
import { desduplicarEntidades } from '@/utiles/busquedaTolerante';
import { deserializarBorradorSync } from './borradoresSync';

const coleccion = z.array(z.record(z.string(), z.unknown())).optional();
const esquema = z.object({
  monstruos_homebrew: coleccion, hechizos_homebrew: coleccion, objetos_homebrew: coleccion,
  personajes: coleccion, pendientes: coleccion, encuentros: coleccion, cola_iniciativa: coleccion,
  borradores_sync: z.record(z.string(), z.unknown()).optional(),
  notas: z.string().optional(), notes: z.string().optional(),
  ronda_actual: z.number().int().min(1).optional(), indice_turno_activo: z.number().int().min(0).optional(),
  metodo_vida: z.enum(['estandar', 'maximo', 'azar']).optional(), sistema_magia: z.enum(['espacios', 'puntos']).optional(),
  asociaciones_fichas: z.record(z.string(), z.string()).optional(),
  id_personaje_activo: z.string().nullable().optional(), mostrar_porcentaje_vida: z.boolean().optional(),
}).passthrough();

function validarColeccion<T>(datos: unknown[], sanear: (dato: unknown) => T | null, nombre: string): T[] {
  return datos.map((dato, indice) => {
    const resultado = sanear(dato);
    if (resultado === null) throw new Error(`${nombre}.${indice}: registro inválido`);
    return resultado;
  });
}

/** Construye el snapshot completo sin modificar el almacén; un fallo impide aplicar cualquier parte. */
export function prepararCargaPersistida(raw: Record<string, unknown>): Partial<EstadoDM> {
  const datos = esquema.parse(raw);
  const cambios: Partial<EstadoDM> = {};
  if (datos.borradores_sync) cambios.borradoresSync = Object.fromEntries(Object.entries(datos.borradores_sync).map(([id, dto]) => [id, deserializarBorradorSync(dto)]));
  if (datos.monstruos_homebrew) cambios.baseDatosMonstruos = desduplicarEntidades(MONSTRUOS_INICIALES, datos.monstruos_homebrew.map(d => sanearMonstruoSentidosYPasiva(EsquemaMonstruoBase.parse(d))));
  if (datos.hechizos_homebrew) cambios.baseDatosHechizos = desduplicarEntidades(HECHIZOS_INICIALES, datos.hechizos_homebrew.map(d => sanearHechizoCD(EsquemaHechizoBase.parse(d))));
  if (datos.objetos_homebrew) cambios.objetosHomebrew = desduplicarEntidades(OBJETOS_INICIALES.map(sanearObjetoHomebrew), datos.objetos_homebrew.map(d => EsquemaObjetoJuego.parse(sanearObjetoHomebrew(d))));
  if (datos.personajes) {
    cambios.personajes = datos.personajes.map(sanearPersonaje).map(hidratarPersonaje);
    cambios.idPersonajeActivo = cambios.personajes.some(p => p.id === datos.id_personaje_activo)
      ? datos.id_personaje_activo : cambios.personajes[0]?.id ?? null;
  }
  if (datos.pendientes) cambios.listaPendientes = validarColeccion(datos.pendientes, sanearElementoPendiente, 'pendientes');
  if (datos.encuentros) cambios.encuentrosGuardados = validarColeccion(datos.encuentros, sanearEncuentroGuardado, 'encuentros');
  if (datos.cola_iniciativa) {
    cambios.colaIniciativa = validarColeccion(datos.cola_iniciativa, sanearCriaturaIniciativa, 'cola_iniciativa');
    cambios.indiceTurnoActivo = cambios.colaIniciativa.length ? Math.min(datos.indice_turno_activo ?? 0, cambios.colaIniciativa.length - 1) : 0;
  }
  const notas = datos.notes ?? datos.notas;
  if (notas !== undefined) cambios.notasDM = notas;
  if (datos.ronda_actual !== undefined) cambios.rondaActual = datos.ronda_actual;
  if (datos.metodo_vida !== undefined) cambios.metodoVidaMonstruo = datos.metodo_vida;
  if (datos.sistema_magia !== undefined) cambios.sistemaMagia = datos.sistema_magia;
  if (datos.asociaciones_fichas !== undefined) cambios.asociacionesFichas = datos.asociaciones_fichas;
  if (datos.mostrar_porcentaje_vida !== undefined) cambios.mostrarPorcentajeVidaAJugadores = datos.mostrar_porcentaje_vida;
  return cambios;
}
