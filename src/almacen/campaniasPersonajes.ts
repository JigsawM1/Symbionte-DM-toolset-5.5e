import type { EstadoDM } from './usarAlmacenDM';
import type { PersonajeJugador } from '@/tipos/personaje';
import { generarId } from '@/utiles/generarId';

export interface ContextoTaleSpireActual {
  campania: { id: string; nombre: string };
  tableroId: string | null;
}
export const perteneceACampania = (p: PersonajeJugador, id: string): boolean => p.campaniaTaleSpire?.id === id;
const seleccionPorBiblioteca = new WeakMap<PersonajeJugador[], Map<string, PersonajeJugador[]>>();
export function personajesDelContexto(s: Pick<EstadoDM, 'personajes' | 'contextoTaleSpire'>): PersonajeJugador[] {
  const id = s.contextoTaleSpire?.campania.id;
  let cache = seleccionPorBiblioteca.get(s.personajes);
  if (!cache) { cache = new Map(); seleccionPorBiblioteca.set(s.personajes, cache); }
  const clave = id ?? '';
  let seleccion = cache.get(clave);
  if (!seleccion) { seleccion = s.personajes.filter(p => id ? perteneceACampania(p, id) : !p.campaniaTaleSpire); cache.set(clave, seleccion); }
  return seleccion;
}
export function estadoDelContexto(s: EstadoDM): EstadoDM {
  return { ...s, personajes: personajesDelContexto(s) };
}
export function miniaturaEnUso(s: EstadoDM, mini: string, pjId: string, acId?: string): boolean {
  return personajesDelContexto(s).some(p => ((p.id !== pjId || !!acId) && p.idMiniaturaTS?.toLowerCase() === mini.toLowerCase())
    || p.acompanantes.some(a => (p.id !== pjId || a.id !== acId) && a.idMiniaturaTS?.toLowerCase() === mini.toLowerCase()));
}
export function conservarFichasAjenas(s: EstadoDM, cambios: Partial<EstadoDM>): Partial<EstadoDM> {
  if (!cambios.personajes) return cambios;
  const ids = new Set(personajesDelContexto(s).map(p => p.id));
  const nuevas = new Map(cambios.personajes.map(p => [p.id, p]));
  return { ...cambios, personajes: s.personajes.map(p => ids.has(p.id) ? nuevas.get(p.id) ?? p : p) };
}
export function copiarFichaParaCampania(p: PersonajeJugador, campania: PersonajeJugador['campaniaTaleSpire']): PersonajeJugador {
  const limpiarMovimiento = { idMiniaturaTS: null, ultimaPosicionTS: null, ultimoBoardIdTS: null,
    movimientoGastado: 0, movimientoMaximoTemporal: null, historialMovimiento: [] };
  return { ...structuredClone(p), ...limpiarMovimiento, id: generarId('pj'), campaniaTaleSpire: campania,
    acompanantes: p.acompanantes.map(a => ({ ...structuredClone(a), ...limpiarMovimiento, id: generarId('ac') })) };
}
