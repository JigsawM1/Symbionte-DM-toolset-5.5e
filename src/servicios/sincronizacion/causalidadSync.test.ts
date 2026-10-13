import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { ts } from '@/utiles/TaleSpireAdapter';
import { emitirMiPersonaje, inicializarObservadoresStoreSync, procesarMensajeSyncEntrante, reiniciarSincronizacion, reaplicarCambioPendienteSync } from '../sincronizacionSimbiote';
import type { FragmentoCliente } from '@/tipos/talespire';
import { proyectarEstadoCombatePJ } from './proyeccionEstadoCombate';
import { EsquemaRasgoPersonaje } from '@/tipos';
import { BufferFragmentosSync } from './transporteSync';
import { EsquemaWireMensajeSync } from '@/tipos/sync';

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
  it('emite cambios de un rasgo personalizado y la retirada del último, sin depender del nombre', async () => {
    const propio = EsquemaRasgoPersonaje.parse({ id: 'propio', nombre: 'Reserva propia', origen: 'personalizado', personalizado: true,
      tieneUsosLimitados: true, usosMaximos: 4, usosRestantes: 3, autoDesactivarAlTirarSalvacion: true });
    usarAlmacenDM.setState(s => ({ personajes: s.personajes.map(p => p.id === 'a' ? { ...p, rasgos: [propio] } : p) }));
    await vi.advanceTimersByTimeAsync(200);
    const buffer = new BufferFragmentosSync(vi.fn());
    const completas = emisiones().flatMap(m => {
      const parte = EsquemaWireMensajeSync.parse(m);
      if (parte.t !== 'FRAG') return [];
      const resultado = buffer.registrar(parte);
      return resultado.tipo === 'completo' && resultado.mensaje.t === 'PJ' ? [resultado.mensaje] : [];
    });
    expect(completas).toHaveLength(1);
    expect(completas[0].d.cp?.rasgos).toMatchObject([{ id: 'propio', usosRestantes: 3, autoDesactivarAlTirarSalvacion: true }]);
    await recibir({ v: 2, s: 'sesion-dm', t: 'ACK', id: 'a', ts: completas[0].d.ts, ok: true, rd: 1 });
    vi.mocked(ts.sync.send).mockClear();
    usarAlmacenDM.setState(s => ({ personajes: s.personajes.map(p => p.id === 'a' ? { ...p, rasgos: [] } : p) }));
    await vi.advanceTimersByTimeAsync(200);
    const retiradas = emisiones().flatMap(m => {
      const parte = EsquemaWireMensajeSync.parse(m);
      if (parte.t !== 'FRAG') return [];
      const resultado = buffer.registrar(parte);
      return resultado.tipo === 'completo' && resultado.mensaje.t === 'PJ' ? [resultado.mensaje] : [];
    });
    buffer.limpiar();
    expect(retiradas).toHaveLength(1);
    expect(retiradas[0].d.cp?.rasgos).toEqual([]);
  });
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
  it('reaplicar valores que ya están en la ficha genera un nuevo envío', async () => {
    const estado = usarAlmacenDM.getState();
    estado.guardarBorradorSync('a', proyectarEstadoCombatePJ(estado.personajes[0]));
    await reaplicarCambioPendienteSync('a');
    await vi.advanceTimersByTimeAsync(200);
    expect(emisiones().filter(m => m.t === 'PJ')).toHaveLength(1);
  });
  it('reaplicar desde el DM actualiza también la tarjeta vinculada por miniatura', async () => {
    detener();
    usarAlmacenDM.setState({ esGM: true, colaIniciativa: [{ id: 'mini-a', nombre: 'a', iniciativa: 0, vidaActual: 40, vidaMaxima: 40, ca: 10, condiciones: [], efectos: [], bonificadorIniciativa: 0, esMonstruo: false, velocidad: '30 pies' }] });
    detener = inicializarObservadoresStoreSync();
    const estado = usarAlmacenDM.getState();
    estado.guardarBorradorSync('a', { ...proyectarEstadoCombatePJ(estado.personajes[0]), hpActual: 12 });
    await reaplicarCambioPendienteSync('a');
    expect(usarAlmacenDM.getState().colaIniciativa[0].vidaActual).toBe(12);
    await vi.advanceTimersByTimeAsync(400);
    expect(emisiones().find(m => m.t === 'DM')?.d.c[0].va).toBe(12);
  });
  it('reenvía un borrador rechazado con revisión nueva y la base confirmada por el DM', async () => {
    usarAlmacenDM.getState().establecerHPActualPersonaje('a', 30);
    await vi.advanceTimersByTimeAsync(200);
    const primera = emisiones().find(m => m.t === 'PJ');
    await recibir({ v: 2, s: 'sesion-dm', t: 'ACK', id: 'a', ts: primera.d.ts, ok: false, rd: 4 });
    await reaplicarCambioPendienteSync('a');
    await vi.advanceTimersByTimeAsync(200);
    const nueva = emisiones().filter(m => m.t === 'PJ').at(-1);
    expect(nueva.d).toMatchObject({ va: 30, b: 4 });
    expect(nueva.d.ts).toBeGreaterThan(primera.d.ts);
    expect(usarAlmacenDM.getState().timestampsModificacionLocal.a).toBeDefined();
    await recibir({ v: 2, s: 'sesion-dm', t: 'ACK', id: 'a', ts: nueva.d.ts, ok: true, rd: 5 });
    expect(usarAlmacenDM.getState().timestampsModificacionLocal.a).toBeUndefined();
    expect(usarAlmacenDM.getState().borradoresSync.a).toBeUndefined();
  });
  it('conserva el borrador si la ficha ya no existe', async () => {
    const estado = usarAlmacenDM.getState();
    const borrador = proyectarEstadoCombatePJ(estado.personajes[0]);
    estado.guardarBorradorSync('a', borrador);
    usarAlmacenDM.setState({ esGM: true, personajes: [] });
    expect(await reaplicarCambioPendienteSync('a')).toBe(false);
    expect(usarAlmacenDM.getState().borradoresSync.a).toEqual(borrador);
  });
  it('conserva el borrador y la ficha si el jugador no es dueño de la miniatura', async () => {
    vi.mocked(ts.creatures.getCreaturesOwnedByPlayer).mockResolvedValue([]);
    const estado = usarAlmacenDM.getState();
    const borrador = { ...proyectarEstadoCombatePJ(estado.personajes[0]), hpActual: 12 };
    estado.guardarBorradorSync('a', borrador);
    expect(await reaplicarCambioPendienteSync('a')).toBe(false);
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(40);
    expect(usarAlmacenDM.getState().borradoresSync.a).toEqual(borrador);
    expect(emisiones().filter(m => m.t === 'PJ')).toHaveLength(0);
  });
  it('restaura concentración y recursos aunque haya una edición local más reciente', async () => {
    detener(); usarAlmacenDM.setState({ esGM: true }); detener = inicializarObservadoresStoreSync();
    const estado = usarAlmacenDM.getState();
    estado.registrarModificacionLocalPJ('a');
    estado.guardarBorradorSync('a', { ...proyectarEstadoCombatePJ(estado.personajes[0]), ts: 1, hpActual: 12,
      concentracion: { hechizoId: 'hechizo', nombreHechizo: 'Concentración' },
      conjuros: { espaciosMaximos: {}, espaciosGastados: { '1': 2 }, puntosGastados: 3, pacto: { maximos: 2, gastados: 1, nivel: 1 } } });
    await reaplicarCambioPendienteSync('a');
    expect(usarAlmacenDM.getState().personajes[0]).toMatchObject({ hpActual: 12,
      concentracionActiva: { hechizoId: 'hechizo', nombreHechizo: 'Concentración' },
      espaciosConjuroGastados: { '1': 2 }, puntosConjuroGastados: 3, espaciosPactoGastados: 1 });
  });
});
