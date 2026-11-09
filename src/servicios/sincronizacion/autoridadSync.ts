import { ts } from '@/utiles/TaleSpireAdapter';
import { logger } from '@/utiles/logger';

const propiedades = new Map<string, { hasta: number; valor: Promise<Set<string>> }>();
let generacion = 0;
export function invalidarAutoridadSync(): void { generacion++; propiedades.clear(); }

async function minisPropias(playerId: string): Promise<Set<string>> {
  const ahora = Date.now();
  const actual = propiedades.get(playerId);
  if (actual && actual.hasta > ahora) return actual.valor;
  if (propiedades.size >= 64) {
    for (const [k, v] of propiedades) if (v.hasta <= ahora) propiedades.delete(k);
  }
  const valor = ts.creatures
    .getCreaturesOwnedByPlayer(playerId)
    .then(minis => new Set(minis.map(m => m.id.toLowerCase())))
    .catch(err => {
      propiedades.delete(playerId);
      throw err;
    });
  propiedades.set(playerId, { hasta: ahora + 1000, valor });
  return valor;
}
export async function puedeEmitirPJ(mini: string | null | undefined): Promise<boolean> {
  if (!mini) return false;
  const inicio = generacion;
  try {
    const player = await ts.clients.obtenerPlayerId();
    return !!player && (await minisPropias(player)).has(mini.toLowerCase()) && inicio === generacion;
  } catch (err) {
    logger.debug('[Sync] Error verificando propiedad de miniatura para emitir PJ:', err);
    return false;
  }
}
