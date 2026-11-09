import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pjSyncV4 as personajeV4, filaSyncV4 as filaV4 } from './fixturesSyncV4.pruebas';
import { MesaSyncV4 } from './mesaSyncV4.pruebas';
import { EsquemaMensajeSyncV4 } from '@/tipos/protocoloSync';

describe('Motor v4 de extremo a extremo', () => {
  let mesa: MesaSyncV4;
  beforeEach(() => {
    vi.useFakeTimers(); vi.stubGlobal('BroadcastChannel', undefined);
    mesa = new MesaSyncV4([{ id: 'dm', clientMode: 'gm', player: { id: 'master', name: 'Máster' } },
      { id: 'jugador', clientMode: 'player', player: { id: 'duenio', name: 'Dueño' } }], new Map([['duenio', new Set(['mini'])]]));
  });
  afterEach(() => { mesa.destruir(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  function preparar(transporte = false) {
    const dm = mesa.agregar('dm', { esGM: true, personajes: [personajeV4()], colaIniciativa: [filaV4()] }, transporte);
    const pj = mesa.agregar('jugador', { esGM: false, personajes: [personajeV4()], colaIniciativa: [filaV4()] }, transporte);
    mesa.iniciar(); return { dm, pj };
  }
  it('incorpora, confirma una edición normal y converge sin reenviar en bucle', async () => {
    const { dm, pj } = preparar(); await vi.advanceTimersByTimeAsync(5000);
    const inicio = mesa.mensajes.length;
    const revisionAnterior = pj.motor.replica.base.mini.revision;
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    await vi.advanceTimersByTimeAsync(5000);
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(19);
    expect(pj.store.getState().personajes[0].hpActual).toBe(19);
    expect(pj.store.getState().conexionSyncV4.conflictos).toEqual([]);
    const nuevos = mesa.mensajes.slice(inicio).map(m => m.mensaje);
    expect(nuevos.some(m => m.t === 'COMBATE')).toBe(false);
    expect(nuevos.find(m => m.t === 'CONFIRMADO')).toMatchObject({ revision: revisionAnterior + 1 });
    const cambios = mesa.paquetes.filter(p => JSON.parse(p.texto).t === 'PROPUESTA').length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(mesa.paquetes.filter(p => JSON.parse(p.texto).t === 'PROPUESTA')).toHaveLength(cambios);
  });
  it('los anuncios repetidos y las notas locales no clonan la memoria; una edición sí se guarda', async () => {
    const { pj } = preparar(); await vi.advanceTimersByTimeAsync(5000);
    const memoria = vi.spyOn(pj.motor.replica, 'memoria');
    await vi.advanceTimersByTimeAsync(15000);
    pj.store.setState(s => ({ personajes: s.personajes.map(p => ({ ...p, notas: 'Nota local' })) }));
    expect(memoria).not.toHaveBeenCalled();
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    expect(memoria).toHaveBeenCalled();
    expect(pj.store.getState().memoriaSyncV4.mesa.pendientes.mini.grupos.vitalidad.actual).toBe(19);
    await vi.advanceTimersByTimeAsync(5000);
    expect(pj.store.getState().memoriaSyncV4.mesa.base.mini.grupos.vitalidad.actual).toBe(19);
    expect(pj.store.getState().memoriaSyncV4.mesa.pendientes.mini).toBeUndefined();
  });
  it('transmite asignación absoluta y daño con temporales una sola vez', async () => {
    const { dm, pj } = preparar(); await vi.advanceTimersByTimeAsync(5000);
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 20);
    await vi.advanceTimersByTimeAsync(3000);
    expect(pj.store.getState().personajes[0].hpActual).toBe(20);
    expect(pj.store.getState().personajes[0].hpTemporal).toBe(5);
    dm.store.getState().dañarCriaturaIniciativa('mini', 8);
    await vi.advanceTimersByTimeAsync(3000);
    expect(pj.store.getState().personajes[0].hpActual).toBe(17);
    expect(pj.store.getState().personajes[0].hpTemporal).toBe(0);
  });
  it('el dueño resuelve un conflicto real y el resultado se confirma', async () => {
    const { dm, pj } = preparar(); await vi.advanceTimersByTimeAsync(5000);
    mesa.demora = () => 300;
    pj.store.getState().establecerHPActualPersonaje('pj', 20);
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 10);
    await vi.advanceTimersByTimeAsync(3000);
    const conflicto = pj.store.getState().conexionSyncV4.conflictos[0];
    expect(conflicto?.grupos).toContain('vitalidad');
    expect(pj.store.getState().personajes[0].hpActual).toBe(20);
    expect(pj.motor.resolver('mini', 'vitalidad', 'local', conflicto.remoto.revisiones.vitalidad)).toBe(true);
    await vi.advanceTimersByTimeAsync(3000);
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(20);
  });
  it('recupera un cambio perdido mediante latido y snapshot, con transporte real del adaptador', async () => {
    const { dm, pj } = preparar(true); await vi.advanceTimersByTimeAsync(60000);
    let perdido = false;
    mesa.descartar = p => {
      const m = JSON.parse(p.texto);
      if (!perdido && p.origen === 'dm' && ['CONFIRMADO', 'FRAG', 'F'].includes(m.t)) { perdido = true; return true; }
      return false;
    };
    dm.store.getState().dañarCriaturaIniciativa('mini', 8);
    await vi.advanceTimersByTimeAsync(60000);
    expect(perdido).toBe(true);
    expect(pj.store.getState().personajes[0].hpActual).toBe(22);
    expect(mesa.paquetes.every(p => p.texto.length <= 400)).toBe(true);
    expect(mesa.errores).toEqual([]);
  });
  it('rechaza v3 sin modificar el combate', async () => {
    const { pj } = preparar(); await vi.advanceTimersByTimeAsync(5000);
    await pj.motor.recibir({ v: 3, t: 'META_COMBATE', r: 99 }, mesa.miembros[0]);
    expect(pj.store.getState().rondaActual).toBe(1);
    expect(pj.store.getState().notificaciones.some(n => n.mensaje.includes('v4'))).toBe(true);
    expect(EsquemaMensajeSyncV4.safeParse({ v: 3 }).success).toBe(false);
  });
});
