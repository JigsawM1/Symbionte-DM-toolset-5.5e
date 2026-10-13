import { EsquemaObjetoInventario, type ObjetoInventario } from '@/tipos';

function iguales(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((valor, i) => iguales(valor, b[i]));
  const primero = a as Record<string, unknown>;
  const segundo = b as Record<string, unknown>;
  const claves = Object.keys(primero).filter(k => primero[k] !== undefined);
  return claves.length === Object.keys(segundo).filter(k => segundo[k] !== undefined).length && claves.every(k => iguales(primero[k], segundo[k]));
}

export function sonObjetosApilables(a: ObjetoInventario, b: ObjetoInventario): boolean {
  if (a.equipado || b.equipado || a.sintonizado || b.sintonizado || a.idObjeto !== b.idObjeto) return false;
  const normalizar = (objeto: ObjetoInventario) => ({ ...EsquemaObjetoInventario.parse(objeto), idInstancia: '', cantidad: 1, contenedor: objeto.contenedor ?? 'mochila' });
  return iguales(normalizar(a), normalizar(b));
}
