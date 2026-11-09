import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepararMesaSyncV4, filaSyncV4 } from './fixturesSyncV4.pruebas';
import type { MesaSyncV4 } from './mesaSyncV4.pruebas';
let mesa: MesaSyncV4 | undefined;
afterEach(() => { mesa?.destruir(); vi.clearAllTimers(); vi.useRealTimers(); });
describe('Recuperación explícita y propagación de la cola física', () => {
  it('restaurar un acompañante archivado exige decisión del dueño y confirmación', async () => {
    vi.useFakeTimers(); const e = prepararMesaSyncV4(false, true); mesa = e.mesa; await vi.advanceTimersByTimeAsync(5000);
    const archivada = structuredClone(e.pj.motor.replica.base['mini-ac']);
    e.dm.store.getState().eliminarAcompanantePersonaje('pj', 'ac'); await vi.advanceTimersByTimeAsync(5000);
    expect(e.pj.motor.replica.base['mini-ac'].eliminada).toBe(true);
    expect(await e.pj.motor.recuperar(archivada)).toBe(true);
    const conflicto = e.pj.store.getState().conexionSyncV4.conflictos.find(c => c.id === 'mini-ac')!;
    expect(e.pj.motor.resolver('mini-ac', 'acompanantes', 'local', conflicto.remoto.revisiones.acompanantes)).toBe(true);
    await vi.advanceTimersByTimeAsync(5000);
    expect(e.dm.motor.replica.base['mini-ac'].eliminada).toBe(false);
    expect(e.pj.store.getState().personajes[0].acompanantes[0].vidaActual).toBe(8);
  });
  it('el rechazo de vincular al padre bloquea el reenvío del acompañante sin bucle', async () => {
    vi.useFakeTimers(); const e = prepararMesaSyncV4(false, true); mesa = e.mesa; await vi.advanceTimersByTimeAsync(5000);
    mesa.minis.set('duenio', new Set());
    e.pj.store.getState().actualizarAcompanante('pj', 'ac', { vidaActual: 5 });
    await vi.advanceTimersByTimeAsync(5000);
    const propuestas = mesa.mensajes.filter(m => m.mensaje.t === 'PROPUESTA').length;
    await vi.advanceTimersByTimeAsync(10000);
    expect(mesa.mensajes.filter(m => m.mensaje.t === 'PROPUESTA')).toHaveLength(propuestas);
    expect(e.pj.store.getState().conexionSyncV4.bloqueos?.some(b => b.id === 'mini-ac')).toBe(true);
  });
  it('el dueño revisa una versión archivada y la decisión se confirma por el director', async () => {
    vi.useFakeTimers(); const e = prepararMesaSyncV4(); mesa = e.mesa; await vi.advanceTimersByTimeAsync(5000);
    const archivada = structuredClone(e.pj.motor.replica.base.mini); archivada.grupos.vitalidad.actual = 17;
    expect(await e.pj.motor.recuperar(archivada)).toBe(true);
    expect(e.dm.motor.replica.base.mini.grupos.vitalidad.actual).toBe(25);
    const conflicto = e.pj.store.getState().conexionSyncV4.conflictos[0];
    expect(conflicto.grupos).toContain('vitalidad');
    expect(e.pj.motor.resolver('mini', 'vitalidad', 'local', conflicto.remoto.revisiones.vitalidad)).toBe(true);
    await vi.advanceTimersByTimeAsync(5000);
    expect(e.dm.motor.replica.base.mini.grupos.vitalidad.actual).toBe(17);
    expect(e.pj.store.getState().conexionSyncV4.pendientes).toBe(0);
    expect(await e.pj.motor.recuperar({ ...archivada, ficha: 'otra-ficha' })).toBe(false);
  });
  it('sigue una vuelta física, expira un efecto una vez y publica turno y ronda a los jugadores', async () => {
    vi.useFakeTimers(); const e = prepararMesaSyncV4(); mesa = e.mesa; await vi.advanceTimersByTimeAsync(5000);
    e.dm.store.setState({ rondaActual: 4, colaIniciativa: [
      { ...filaSyncV4(), efectos: [{ id: 'temporal', nombre: 'Protección', expiraRonda: 5 }] },
      { ...filaSyncV4(), id: 'nativo-b', esMonstruo: true, idPersonajeDuenio: undefined },
      { ...filaSyncV4(), id: 'nativo-c', esMonstruo: true, idPersonajeDuenio: undefined },
    ] });
    const items = ['mini', 'nativo-b', 'nativo-c'].map(id => ({ id, name: id, kind: 'creature' as const }));
    for (const activeItemIndex of [0, 1, 2, 0, 0]) e.dm.store.getState().actualizarColaIniciativaDesdeTaleSpire({ items, activeItemIndex });
    await vi.advanceTimersByTimeAsync(5000);
    expect(e.dm.store.getState().rondaActual).toBe(5);
    expect(e.pj.store.getState().rondaActual).toBe(5);
    expect(e.pj.store.getState().colaIniciativa[e.pj.store.getState().indiceTurnoActivo].id).toBe('mini');
    expect(e.pj.store.getState().personajes[0].hpActual).toBe(25);
    expect(e.dm.store.getState().colaIniciativa[0].efectos).toEqual([]);
    expect(e.pj.store.getState().personajes[0].efectosActivos).toEqual([]);
    expect(e.dm.store.getState().memoriaSyncV4.mesa.metaConfirmada?.ronda).toBe(5);
  });
});
