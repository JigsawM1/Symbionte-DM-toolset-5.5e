import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { ts } from '@/utiles/TaleSpireAdapter';
import { emitirMiPersonaje, inicializarObservadoresStoreSync, procesarMensajeSyncEntrante, reiniciarSincronizacion } from '../sincronizacionSimbiote';
import type { FragmentoCliente } from '@/tipos/talespire';

const dm: FragmentoCliente = { id: 'dm', player: { id: 'master', name: 'Master' } };
const jugador: FragmentoCliente = { id: 'cliente-pj', player: { id: 'jugador', name: 'Jugador' } };
let detener = () => {};
beforeEach(() => {
  vi.useFakeTimers(); reiniciarSincronizacion();
  vi.spyOn(ts.sync, 'send').mockResolvedValue(true);
  vi.spyOn(ts.clients, 'getMoreInfo').mockImplementation(async ids => ids.map(id => ({ id, clientMode: id === dm.id ? 'gm' : 'player', player: id === dm.id ? dm.player : jugador.player })));
  vi.spyOn(ts.clients, 'obtenerPlayerId').mockResolvedValue(jugador.player.id);
  vi.spyOn(ts.creatures, 'getCreaturesOwnedByPlayer').mockResolvedValue([{ id: 'mini-a' }, { id: 'mini-b' }]);
  usarAlmacenDM.setState({ esGM: false, aplicandoSync: false, timestampsModificacionLocal: {}, borradoresSync: {}, personajes: ['a', 'b'].map(id => ({ ...structuredClone(PERSONAJE_POR_DEFECTO), id, nombre: id, idMiniaturaTS: `mini-${id}`, hpActual: 40, hpMaximo: 40 })), idPersonajeActivo: 'a', colaIniciativa: [], rondaActual: 1 });
  detener = inicializarObservadoresStoreSync();
});
afterEach(() => { detener(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });
async function recibir(datos: unknown, fromClient = dm) { await procesarMensajeSyncEntrante({ datos, fromClient, strCrudo: JSON.stringify(datos) }); }
const emisiones = () => vi.mocked(ts.sync.send).mock.calls.map(([texto]) => JSON.parse(texto));

describe('Revisiones causales por entidad', () => {
  it('envía dos personajes editados dentro del mismo debounce', async () => {
    usarAlmacenDM.getState().establecerHPActualPersonaje('a', 30);
    usarAlmacenDM.getState().establecerHPActualPersonaje('b', 20);
    await vi.advanceTimersByTimeAsync(200);
    expect(emisiones().filter(m => m.t === 'PJ').map(m => m.d.id).sort()).toEqual(['a', 'b']);
  });
  it('un snapshot posterior no revierte HP pendientes y un ACK viejo no confirma una edición nueva', async () => {
    usarAlmacenDM.getState().establecerHPActualPersonaje('a', 30);
    await recibir({ v: 2, s: 'sesion-dm', t: 'DM', d: { ts: 100, t: 0, r: 2, v: true, mv: 'maximo', rv: { a: 0 }, c: [{ id: 'mini-a', du: 'a', n: 'a', i: 0, va: 40, vm: 40 }] } });
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(30);
    await vi.advanceTimersByTimeAsync(200);
    const primera = emisiones().find(m => m.t === 'PJ');
    usarAlmacenDM.getState().establecerHPActualPersonaje('a', 25);
    await recibir({ v: 2, s: 'sesion-dm', t: 'ACK', id: 'a', ts: primera.d.ts, ok: true, rd: 1 });
    await vi.advanceTimersByTimeAsync(200);
    const nueva = emisiones().filter(m => m.t === 'PJ').at(-1);
    expect(nueva.d.va).toBe(25); expect(nueva.d.b).toBe(1);
    await recibir({ v: 2, s: 'sesion-dm', t: 'ACK', id: 'a', ts: primera.d.ts, ok: true, rd: 1 });
    expect(usarAlmacenDM.getState().timestampsModificacionLocal.a).toBeDefined();
  });
  it('el DM rechaza una revisión obsoleta aunque los relojes coincidan', async () => {
    detener(); usarAlmacenDM.setState({ esGM: true }); detener = inicializarObservadoresStoreSync();
    usarAlmacenDM.getState().establecerHPActualPersonaje('a', 15);
    await recibir({ v: 2, s: 'sesion-pj', t: 'PJ', d: { id: 'a', m: 'mini-a', n: 'a', i: 0, va: 30, vm: 40, ts: 1, b: 0 } }, jugador);
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(15);
    expect(emisiones().find(m => m.t === 'ACK')).toMatchObject({ ok: false, rd: 1 });
  });
  it('conserva el borrador rechazado para recuperación explícita', async () => {
    usarAlmacenDM.getState().establecerHPActualPersonaje('a', 30);
    emitirMiPersonaje('a'); await vi.advanceTimersByTimeAsync(200);
    const primera = emisiones().find(m => m.t === 'PJ');
    await recibir({ v: 2, s: 'sesion-dm', t: 'ACK', id: 'a', ts: primera.d.ts, ok: false, rd: 1 });
    expect(usarAlmacenDM.getState().borradoresSync.a.hpActual).toBe(30);
    expect(usarAlmacenDM.getState().timestampsModificacionLocal.a).toBeUndefined();
  });
});
