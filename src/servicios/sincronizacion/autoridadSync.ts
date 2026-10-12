import { ts } from '@/utiles/TaleSpireAdapter';
import type { FragmentoCliente, InfoCliente } from '@/tipos/talespire';
import type { WireMensajeSync, WireEstadoCombatePJ } from '@/tipos/sync';

const clientes = new Map<string, { hasta: number; valor: Promise<InfoCliente | undefined> }>();
const propiedades = new Map<string, { hasta: number; valor: Promise<Set<string>> }>();
let generacion = 0;
export function invalidarAutoridadSync(): void { generacion++; clientes.clear(); propiedades.clear(); }

async function obtenerCliente(id: string): Promise<InfoCliente | undefined> {
  const actual = clientes.get(id);
  if (actual && actual.hasta > Date.now()) return actual.valor;
  const valor = ts.clients.getMoreInfo([id]).then(infos => infos.find(c => c.id === id));
  clientes.set(id, { hasta: Date.now() + 1000, valor });
  return valor;
}
async function minisPropias(playerId: string): Promise<Set<string>> {
  const actual = propiedades.get(playerId);
  if (actual && actual.hasta > Date.now()) return actual.valor;
  const valor = ts.creatures.getCreaturesOwnedByPlayer(playerId).then(minis => new Set(minis.map(m => m.id)));
  propiedades.set(playerId, { hasta: Date.now() + 1000, valor });
  return valor;
}
export async function puedeEmitirPJ(mini: string | null | undefined): Promise<boolean> {
  if (!mini) return false;
  const inicio = generacion;
  try {
    const player = await ts.clients.obtenerPlayerId();
    return !!player && (await minisPropias(player)).has(mini) && inicio === generacion;
  } catch { return false; }
}
export async function autorizarPersonaje(wire: WireEstadoCombatePJ, remitente: FragmentoCliente): Promise<boolean> {
  const inicio = generacion;
  try {
    const cliente = await obtenerCliente(remitente.id);
    if (!cliente || cliente.player.id !== remitente.player.id || cliente.clientMode === 'spectator' || !wire.m) return false;
    const propias = await minisPropias(cliente.player.id);
    return inicio === generacion && propias.has(wire.m) && (wire.ac ?? []).every(a => !!a.m && propias.has(a.m));
  } catch { return false; }
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
  } catch { return false; }
}
