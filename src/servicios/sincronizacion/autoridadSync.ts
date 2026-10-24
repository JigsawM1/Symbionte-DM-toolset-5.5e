import { ts } from '@/utiles/TaleSpireAdapter';
import { logger } from '@/utiles/logger';
import type { FragmentoCliente, InfoCliente } from '@/tipos/talespire';
import type { WireMensajeSync, WireEstadoCombatePJ } from '@/tipos/sync';

const clientes = new Map<string, { hasta: number; valor: Promise<InfoCliente | undefined> }>();
const propiedades = new Map<string, { hasta: number; valor: Promise<Set<string>> }>();
let generacion = 0;
export function invalidarAutoridadSync(): void { generacion++; clientes.clear(); propiedades.clear(); }

async function obtenerCliente(id: string): Promise<InfoCliente | undefined> {
  const ahora = Date.now();
  const actual = clientes.get(id);
  if (actual && actual.hasta > ahora) return actual.valor;
  if (clientes.size >= 64) {
    for (const [k, v] of clientes) if (v.hasta <= ahora) clientes.delete(k);
  }
  const valor = ts.clients
    .getMoreInfo([id])
    .then(infos => infos.find(c => c.id === id))
    .catch(err => {
      clientes.delete(id);
      throw err;
    });
  clientes.set(id, { hasta: ahora + 1000, valor });
  return valor;
}
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
    if (!player) return false;
    const miniBuscada = mini.toLowerCase();
    const propias = await minisPropias(player);
    if (propias.has(miniBuscada)) return inicio === generacion;

    // Respaldo para clientes Jugadores en TaleSpire:
    const seleccion = await ts.creatures.getSelectedCreatures();
    if (seleccion.some(s => (typeof s === "string" ? s : s?.id)?.toLowerCase() === miniBuscada)) {
      return inicio === generacion;
    }

    const infos = await ts.creatures.getMoreInfo([mini]);
    if (infos && infos[0]) {
      const info = infos[0];
      const pId = player.toLowerCase();
      if (!info.ownerIds || info.ownerIds.length === 0 || info.ownerIds.some(o => o.toLowerCase() === pId)) {
        return inicio === generacion;
      }
    }
    return false;
  } catch (err) {
    logger.debug('[Sync] Error verificando propiedad de miniatura para emitir PJ:', err);
    return false;
  }
}
export async function autorizarPersonaje(wire: WireEstadoCombatePJ, remitente: FragmentoCliente): Promise<boolean> {
  const inicio = generacion;
  try {
    const cliente = await obtenerCliente(remitente.id);
    if (!cliente || cliente.player.id !== remitente.player.id || cliente.clientMode === 'spectator' || !wire.m) return false;
    const propias = await minisPropias(cliente.player.id);
    if (propias.has(wire.m.toLowerCase()) && (wire.ac ?? []).every(a => !!a.m && propias.has(a.m.toLowerCase()))) {
      return inicio === generacion;
    }

    // Respaldo de autorización cuando el DM no asignó propietarios nativos en TaleSpire:
    const todasMinis = [wire.m, ...(wire.ac ?? []).map(a => a.m).filter(Boolean) as string[]];
    const infos = await ts.creatures.getMoreInfo(todasMinis);
    const remitentePlayerId = cliente.player.id.toLowerCase();
    const esValida = infos.length === todasMinis.length && infos.every(info => {
      if (!info) return false;
      return !info.ownerIds || info.ownerIds.length === 0 || info.ownerIds.some(o => o.toLowerCase() === remitentePlayerId);
    });

    return esValida && inicio === generacion;
  } catch (err) {
    logger.debug('[Sync] Error autorizando personaje remoto:', err);
    return false;
  }
}
/** Solo metadatos nativos y consultas a TaleSpire otorgan autoridad; nunca el JSON del emisor. */
export async function autorizarMensaje(mensaje: WireMensajeSync, remitente?: FragmentoCliente): Promise<boolean> {
  if (!remitente?.id || !remitente.player?.id) return false;
  const inicio = generacion;
  try {
    const cliente = await obtenerCliente(remitente.id);
    if (!cliente || cliente.player.id !== remitente.player.id || inicio !== generacion) return false;
    if (mensaje.t === 'DM' || mensaje.t === 'DM_CHUNK' || mensaje.t === 'ACK' || (mensaje.t === 'FRAG' && mensaje.k === 'DM')) return cliente.clientMode === 'gm';
    if (mensaje.t === 'PJ') return autorizarPersonaje(mensaje.d, remitente);
    return cliente.clientMode !== 'spectator';
  } catch (err) {
    logger.debug('[Sync] Error autorizando mensaje entrante:', err);
    return false;
  }
}
