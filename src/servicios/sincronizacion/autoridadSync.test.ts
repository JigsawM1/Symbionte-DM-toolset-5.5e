import { EsquemaWireMensajeSync, type WireChunkIniciativa } from "@/tipos/sync";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ts } from '@/utiles/TaleSpireAdapter';
import { autorizarMensaje as autorizarVerificado, invalidarAutoridadSync } from './autoridadSync';
import { procesarMensajeSyncEntrante, reiniciarSincronizacion } from '../sincronizacionSimbiote';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import type { FragmentoCliente } from '@/tipos/talespire';

function autorizarMensaje(datos: unknown, remitente?: FragmentoCliente) {
  return autorizarVerificado(EsquemaWireMensajeSync.parse(datos), remitente);
}
const jugador: FragmentoCliente = { id: 'cliente-pj', player: { id: 'jugador', name: 'Jugador' } };
const dm: FragmentoCliente = { id: 'cliente-dm', player: { id: 'master', name: 'Master' } };
beforeEach(() => {
  invalidarAutoridadSync(); reiniciarSincronizacion();
  vi.spyOn(ts.clients, 'getMoreInfo').mockImplementation(async ids => ids.map(id => ({ id, clientMode: id === dm.id ? 'gm' : 'player', player: id === dm.id ? dm.player : jugador.player })));
  vi.spyOn(ts.creatures, 'getCreaturesOwnedByPlayer').mockResolvedValue([{ id: 'mini-propia' }]);
  usarAlmacenDM.setState({ esGM: false, rondaActual: 1, aplicandoSync: false });
});
afterEach(() => { reiniciarSincronizacion(); vi.restoreAllMocks(); });

describe('Autoridad nativa de sincronización', () => {
  it('rechaza DM y ACK procedentes de un jugador', async () => {
    const mensaje = { v: 2 as const, s: 'sesion', t: 'DM' as const, d: { c: [], t: 0, r: 99, v: true, mv: 'maximo', ts: 1 } };
    expect(await autorizarMensaje(mensaje, jugador)).toBe(false);
    await procesarMensajeSyncEntrante({ datos: mensaje, strCrudo: JSON.stringify(mensaje), fromClient: jugador });
    expect(usarAlmacenDM.getState().rondaActual).toBe(1);
    expect(await autorizarMensaje({ v: 2, s: 'sesion', t: 'ACK', id: 'pj', ts: 1 }, jugador)).toBe(false);
  });
  it('acepta el DM confirmado por getMoreInfo', async () => {
    expect(await autorizarMensaje({ v: 2, s: 'sesion', t: 'DM', d: { c: [], t: 0, r: 2, v: true, mv: 'maximo' } }, dm)).toBe(true);
  });
  it.each([{ remitente: dm, aceptado: true }, { remitente: jugador, aceptado: false }])(
    'conserva la recepción de DM_CHUNK fuera de orden según la autoridad nativa (aceptado=$aceptado)',
    async ({ remitente, aceptado }) => {
      usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], indiceTurnoActivo: 0 });
      const fragmentos = [1, 2].map((chunk): WireChunkIniciativa => ({
        sid: 150, chunk, total: 2, t: 1, r: 3, v: true, mv: 'maximo', ts: 10,
        c: [{ id: `monstruo-${chunk}`, n: `Enemigo ${chunk}`, i: chunk, va: 7, vm: 7, vt: 0, m: true, c: [] }],
      }));
      const recibir = (fragmento: WireChunkIniciativa): void | Promise<void> => {
        const datos = { v: 2, s: 'compatibilidad', t: 'DM_CHUNK', d: fragmento };
        return procesarMensajeSyncEntrante({ datos, strCrudo: JSON.stringify(datos), fromClient: remitente });
      };

      await recibir({ ...fragmentos[0], chunk: 0 });
      await recibir(fragmentos[1]);
      expect(usarAlmacenDM.getState().colaIniciativa).toEqual([]);
      expect(usarAlmacenDM.getState().rondaActual).toBe(1);
      await recibir(fragmentos[0]);

      const estado = usarAlmacenDM.getState();
      expect(estado.colaIniciativa.map(c => c.id)).toEqual(aceptado ? ['monstruo-1', 'monstruo-2'] : []);
      expect(estado.rondaActual).toBe(aceptado ? 3 : 1);
      expect(estado.indiceTurnoActivo).toBe(aceptado ? 1 : 0);
      expect(estado.aplicandoSync).toBe(false);
    }
  );
  it('rechaza una ficha con mini ajena y un acompañante ajeno', async () => {
    const mensaje = { v: 2 as const, s: 'sesion', t: 'PJ' as const, d: { id: 'pj', m: 'ajena', n: 'Pj', i: 0, va: 10, vm: 10 } };
    expect(await autorizarMensaje(mensaje, jugador)).toBe(false);
    expect(await autorizarMensaje({ ...mensaje, d: { ...mensaje.d, m: 'mini-propia', ac: [{ id: 'ac', m: 'ajena', n: 'Ac', va: 1, vm: 1 }] } }, jugador)).toBe(false);
  });
  it('rechaza identidad ausente y playerId discordante', async () => {
    const mensaje = { v: 2 as const, s: 'sesion', t: 'REQ' as const };
    expect(await autorizarMensaje(mensaje)).toBe(false);
    expect(await autorizarMensaje(mensaje, { ...jugador, player: { id: 'otro', name: 'Otro' } })).toBe(false);
  });
  it.each([1, 10, 50])('comparte las consultas simultáneas para %i entidades de un jugador', async cantidad => {
    const mensaje = { v: 2 as const, s: 'sesion', t: 'PJ' as const, d: { id: 'pj', m: 'mini-propia', n: 'Pj', i: 0, va: 10, vm: 10 } };
    const resultados = await Promise.all(Array.from({ length: cantidad }, () => autorizarMensaje(mensaje, jugador)));
    expect(resultados.every(Boolean)).toBe(true);
    expect(ts.clients.getMoreInfo).toHaveBeenCalledTimes(1);
    expect(ts.creatures.getCreaturesOwnedByPlayer).toHaveBeenCalledTimes(1);
    invalidarAutoridadSync();
    vi.mocked(ts.creatures.getCreaturesOwnedByPlayer).mockResolvedValue([]);
    expect(await autorizarMensaje(mensaje, jugador)).toBe(false);
  });
  it('no acepta respuestas que llegaron después de invalidar los permisos', async () => {
    let resolver!: (infos: Awaited<ReturnType<typeof ts.clients.getMoreInfo>>) => void;
    vi.mocked(ts.clients.getMoreInfo).mockReturnValue(new Promise(r => { resolver = r; }));
    const resultado = autorizarMensaje({ v: 2, s: 'sesion', t: 'REQ' }, jugador);
    invalidarAutoridadSync();
    resolver([{ id: jugador.id, clientMode: 'player', player: jugador.player }]);
    expect(await resultado).toBe(false);
  });
  it('acepta miniaturas propias con diferencias de mayúsculas/minúsculas en el UUID', async () => {
    const mensaje = { v: 2 as const, s: 'sesion', t: 'PJ' as const, d: { id: 'pj', m: 'MINI-PROPIA', n: 'Pj', i: 0, va: 10, vm: 10 } };
    expect(await autorizarMensaje(mensaje, jugador)).toBe(true);
  });
  it('desaloja del caché las promesas rechazadas permitiendo reintentar', async () => {
    vi.mocked(ts.creatures.getCreaturesOwnedByPlayer).mockRejectedValueOnce(new Error('Fallo IPC'));
    const mensaje = { v: 2 as const, s: 'sesion', t: 'PJ' as const, d: { id: 'pj', m: 'mini-propia', n: 'Pj', i: 0, va: 10, vm: 10 } };
    expect(await autorizarMensaje(mensaje, jugador)).toBe(false);
    // Tras el fallo, la siguiente llamada debe consultar nuevamente y resolverse exitosamente
    vi.mocked(ts.creatures.getCreaturesOwnedByPlayer).mockResolvedValue([{ id: 'mini-propia' }]);
    expect(await autorizarMensaje(mensaje, jugador)).toBe(true);
  });
});
