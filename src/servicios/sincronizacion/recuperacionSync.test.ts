import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { ts } from '@/utiles/TaleSpireAdapter';
import { emitirMiPersonaje, inicializarObservadoresStoreSync, procesarMensajeSyncEntrante,
  reiniciarSincronizacion, solicitarEstadoInicial } from '../sincronizacionSimbiote';
import { empaquetarEstadoSync, type EstadoSync } from './transporteSync';

function snapshot(revision: number, ronda = 1): EstadoSync {
  return { v: 1, t: 'DM', d: { ts: revision, t: ronda - 1, r: ronda, v: true, mv: 'maximo',
    c: Array.from({ length: 26 }, (_, i) => ({ id: `criatura-${i}`, n: `Combatiente ${i}`,
      i: 26 - i, va: 30, vm: 40, m: i >= 6 })) } };
}
function recibir(texto: string): void {
  procesarMensajeSyncEntrante({ datos: JSON.parse(texto), strCrudo: texto });
}
describe('Regresiones del motor de sincronización', () => {
  let detener = () => {};
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(1000000);
    reiniciarSincronizacion();
    vi.spyOn(ts.sync, 'send').mockResolvedValue(true);
    usarAlmacenDM.setState({ esGM: false, personajes: [{ ...structuredClone(PERSONAJE_POR_DEFECTO),
      id: 'pj', nombre: 'Clériga', hpActual: 40, hpMaximo: 40 }], idPersonajeActivo: 'pj',
      colaIniciativa: [], aplicandoSync: false, timestampsModificacionLocal: {}, rondaActual: 1 });
    detener = inicializarObservadoresStoreSync();
  });
  afterEach(() => { detener(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('recupera un fragmento inicial perdido, sin interrumpir el progreso ni aceptar estados parciales', async () => {
    solicitarEstadoInicial();
    const paquetes = empaquetarEstadoSync(snapshot(1000));
    for (const [indice, paquete] of paquetes.entries()) {
      if (indice !== 1) recibir(paquete);
      await vi.advanceTimersByTimeAsync(180);
    }
    expect(usarAlmacenDM.getState().colaIniciativa).toHaveLength(0);
    expect(ts.sync.send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(ts.sync.send).toHaveBeenCalledTimes(2);
    for (const paquete of empaquetarEstadoSync(snapshot(2000))) recibir(paquete);
    expect(usarAlmacenDM.getState().colaIniciativa).toHaveLength(26);
    await vi.advanceTimersByTimeAsync(20000);
    expect(ts.sync.send).toHaveBeenCalledTimes(2);
  });

  it('una pérdida durante combate conserva el último estado completo y solicita recuperación', async () => {
    empaquetarEstadoSync(snapshot(1000)).forEach(recibir);
    await vi.advanceTimersByTimeAsync(300);
    const incompleto = empaquetarEstadoSync(snapshot(2000, 2));
    incompleto.slice(1).forEach(recibir);
    expect(usarAlmacenDM.getState().rondaActual).toBe(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(ts.sync.send).toHaveBeenCalledWith(JSON.stringify({ v: 1, t: 'REQ' }), 'board');
    empaquetarEstadoSync(snapshot(3000, 3)).forEach(recibir);
    expect(usarAlmacenDM.getState().rondaActual).toBe(3);
  });

  it('rechaza transmisiones antiguas completas, fragmentadas y repetidas después de aplicar la nueva', async () => {
    const antiguo = snapshot(1000, 1);
    empaquetarEstadoSync(snapshot(2000, 9)).forEach(recibir);
    await vi.advanceTimersByTimeAsync(1000);
    empaquetarEstadoSync(antiguo).forEach(recibir);
    recibir(JSON.stringify(antiguo));
    expect(usarAlmacenDM.getState().rondaActual).toBe(9);
    expect(usarAlmacenDM.getState().indiceTurnoActivo).toBe(8);
  });

  it('un estado directo retrasado no destruye una transmisión más nueva en curso', () => {
    const nuevos = empaquetarEstadoSync(snapshot(3000, 9));
    recibir(nuevos[0]);
    const antiguo: EstadoSync = { v: 1, t: 'DM', d: { ts: 2000, t: -1, r: 2, v: true, mv: 'maximo', c: [] } };
    recibir(JSON.stringify(antiguo));
    nuevos.slice(1).forEach(recibir);
    expect(usarAlmacenDM.getState().colaIniciativa).toHaveLength(26);
    expect(usarAlmacenDM.getState().rondaActual).toBe(9);
  });

  it('un mensaje heredado sin revisión no revierte una revisión ya aplicada', () => {
    empaquetarEstadoSync(snapshot(3000, 9)).forEach(recibir);
    recibir(JSON.stringify({ v: 1, t: 'DM', d: { t: -1, r: 2, v: true, mv: 'maximo', c: [] } }));
    expect(usarAlmacenDM.getState().rondaActual).toBe(9);
    expect(usarAlmacenDM.getState().colaIniciativa).toHaveLength(26);
  });

  it('conserva la recuperación de fragmentos aunque llegue un estado directo retrasado', async () => {
    solicitarEstadoInicial();
    recibir(empaquetarEstadoSync(snapshot(3000, 9))[0]);
    recibir(JSON.stringify({ v: 1, t: 'DM', d: { ts: 2000, t: -1, r: 2, v: true, mv: 'maximo', c: [] } }));
    await vi.advanceTimersByTimeAsync(5000);
    expect(ts.sync.send).toHaveBeenCalledTimes(2);
    empaquetarEstadoSync(snapshot(4000, 10)).forEach(recibir);
    expect(usarAlmacenDM.getState().rondaActual).toBe(10);
  });

  it('el DM conserva los fragmentos nuevos de un PJ ante mensajes directos retrasados', () => {
    usarAlmacenDM.setState({ esGM: true });
    const nuevo: EstadoSync = { v: 1, t: 'PJ', d: { id: 'pj', n: 'Clériga', i: 0, va: 27, vm: 40, ts: 3000,
      e: Array.from({ length: 8 }, (_, i) => ({ id: `efecto-${i}`, n: 'Protección mágica', r: 9 })) } };
    const paquetes = empaquetarEstadoSync(nuevo);
    expect(paquetes.length).toBeGreaterThan(1);
    recibir(paquetes[0]);
    recibir(JSON.stringify({ v: 1, t: 'PJ', d: { id: 'pj', va: 5, vm: 40, ts: 2000 } }));
    paquetes.slice(1).forEach(recibir);
    recibir(JSON.stringify({ v: 1, t: 'PJ', d: { id: 'pj', va: 5, vm: 40 } }));
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(27);
    expect(usarAlmacenDM.getState().personajes[0].efectosActivos).toHaveLength(8);
    const ack = vi.mocked(ts.sync.send).mock.calls.map(([texto]) => JSON.parse(texto)).filter(m => m.t === 'ACK');
    expect(ack).toHaveLength(1);
    expect(ack[0]).toMatchObject({ id: 'pj', ts: 3000 });
  });

  it('envía íntegros ocho efectos y concentración en paquetes que admite la API', async () => {
    const efectos = Array.from({ length: 8 }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, nombre: 'Bendición', expiraRonda: 5 }));
    usarAlmacenDM.setState({ personajes: usarAlmacenDM.getState().personajes.map(p => ({ ...p,
      hpActual: 27, efectosActivos: efectos, concentracionActiva: { hechizoId: 'escudo', nombreHechizo: 'Escudo de fe' } })) });
    await vi.advanceTimersByTimeAsync(200);
    const paquetes = vi.mocked(ts.sync.send).mock.calls.map(([texto]) => texto);
    expect(paquetes.length).toBeGreaterThan(1);
    expect(paquetes.every(p => p.length <= 380)).toBe(true);
    usarAlmacenDM.setState({ esGM: true });
    paquetes.forEach(recibir);
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(27);
    expect(usarAlmacenDM.getState().personajes[0].efectosActivos).toEqual(efectos);
    expect(usarAlmacenDM.getState().personajes[0].concentracionActiva?.hechizoId).toBe('escudo');
    const ack = vi.mocked(ts.sync.send).mock.calls.map(([texto]) => JSON.parse(texto)).find(m => m.t === 'ACK');
    expect(ack).toMatchObject({ id: 'pj', ts: 1000150 });
  });

  it('la pérdida persistente de ACK genera exactamente tres emisiones con la misma revisión', async () => {
    emitirMiPersonaje('pj');
    await vi.advanceTimersByTimeAsync(20000);
    const emisiones = vi.mocked(ts.sync.send).mock.calls.map(([texto]) => JSON.parse(texto)).filter(m => m.t === 'PJ');
    expect(emisiones).toHaveLength(3);
    expect(new Set(emisiones.map(m => m.d.ts)).size).toBe(1);
  });

  it('una edición nueva sustituye fragmentos pendientes y deja de reenviar la revisión anterior', async () => {
    emitirMiPersonaje('pj');
    await vi.advanceTimersByTimeAsync(200);
    const primera = JSON.parse(vi.mocked(ts.sync.send).mock.calls[0][0]);
    usarAlmacenDM.getState().establecerHPActualPersonaje('pj', 23);
    await vi.advanceTimersByTimeAsync(200);
    recibir(JSON.stringify({ v: 1, t: 'ACK', id: 'pj', ts: primera.d.ts }));
    await vi.advanceTimersByTimeAsync(6000);
    const emisiones = vi.mocked(ts.sync.send).mock.calls.map(([texto]) => JSON.parse(texto)).filter(m => m.t === 'PJ');
    expect(emisiones.filter(m => m.d.ts === primera.d.ts)).toHaveLength(1);
    expect(emisiones.filter(m => m.d.va === 23)).toHaveLength(3);
  });

  it('cambiar de rol cancela reintentos y reinicia las revisiones de recepción', async () => {
    empaquetarEstadoSync(snapshot(2000, 9)).forEach(recibir);
    await vi.advanceTimersByTimeAsync(300);
    emitirMiPersonaje('pj');
    await vi.advanceTimersByTimeAsync(200);
    usarAlmacenDM.setState({ esGM: true });
    vi.mocked(ts.sync.send).mockClear();
    await vi.advanceTimersByTimeAsync(20000);
    const mensajes = vi.mocked(ts.sync.send).mock.calls.map(([texto]) => JSON.parse(texto));
    expect(mensajes.some(m => m.t === 'PJ' || (m.t === 'FRAG' && m.k === 'PJ'))).toBe(false);
    usarAlmacenDM.setState({ esGM: false });
    empaquetarEstadoSync(snapshot(1000, 2)).forEach(recibir);
    expect(usarAlmacenDM.getState().rondaActual).toBe(2);
  });
});
