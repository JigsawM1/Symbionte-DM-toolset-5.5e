import type { ObjetoInventario } from '@/tipos';

function iguales(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((valor, i) => iguales(valor, b[i]));
  const primero = a as Record<string, unknown>;
  const segundo = b as Record<string, unknown>;
  const claves = Object.keys(primero).filter(k => primero[k] !== undefined);
  return claves.length === Object.keys(segundo).filter(k => segundo[k] !== undefined).length && claves.every(k => iguales(primero[k], segundo[k]));
}

const cacheNormalizacion = new WeakMap<ObjetoInventario, Record<string, unknown>>();

function normalizarParaComparacion(objeto: ObjetoInventario): Record<string, unknown> {
  const enCache = cacheNormalizacion.get(objeto);
  if (enCache) return enCache;

  const normalizado: Record<string, unknown> = {
    ...objeto,
    idInstancia: '',
    cantidad: 1,
    contenedor: objeto.contenedor ?? 'mochila'
  };
  cacheNormalizacion.set(objeto, normalizado);
  return normalizado;
}

export function sonObjetosApilables(a: ObjetoInventario, b: ObjetoInventario): boolean {
  if (a.equipado || b.equipado || a.sintonizado || b.sintonizado || a.idObjeto !== b.idObjeto) return false;
  return iguales(normalizarParaComparacion(a), normalizarParaComparacion(b));
}
