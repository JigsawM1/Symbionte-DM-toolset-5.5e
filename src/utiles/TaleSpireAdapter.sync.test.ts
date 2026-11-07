import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Contrato nativo de TS.sync.send', () => {
  beforeEach(() => { vi.resetModules(); vi.stubGlobal('BroadcastChannel', undefined); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('espacia envíos consecutivos aunque cada productor espere y deje vacía la cola', async () => {
    vi.useFakeTimers();
    const instantes: number[] = [];
    vi.stubGlobal('TS', { sync: { send: async () => { instantes.push(Date.now()); } } });
    const { ts } = await import('./TaleSpireAdapter');
    await ts.sync.send('uno');
    const segundo = ts.sync.send('dos');
    await vi.advanceTimersByTimeAsync(179);
    expect(instantes).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await segundo).toBe(true);
    expect(instantes[1] - instantes[0]).toBe(180);
  });

  it('acepta exactamente 500 unidades UTF-16 y rechaza 501 antes de llamar a TaleSpire', async () => {
    const enviarNativo = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('TS', { sync: { send: enviarNativo } });
    const { ts } = await import('./TaleSpireAdapter');
    const texto = String.fromCodePoint(0x1d11e).repeat(250);
    expect(texto.length).toBe(500);
    expect(await ts.sync.send(texto, 'board')).toBe(true);
    expect(await ts.sync.send(texto + 'x', 'board')).toBe(false);
    expect(enviarNativo).toHaveBeenCalledTimes(1);
    expect(enviarNativo).toHaveBeenCalledWith(texto, 'board');
  });

  it('un BroadcastChannel exitoso no oculta notConnected del canal nativo', async () => {
    const replicar = vi.fn();
    vi.stubGlobal('BroadcastChannel', class { postMessage = replicar; });
    vi.stubGlobal('TS', { sync: { send: vi.fn().mockRejectedValue(new Error('notConnected')) } });
    const { ts } = await import('./TaleSpireAdapter');
    expect(await ts.sync.send('prueba', 'board')).toBe(false);
    expect(replicar).toHaveBeenCalledTimes(1);
  });

  it('mantiene BroadcastChannel como transporte para desarrollo sin API nativa', async () => {
    const replicar = vi.fn();
    vi.stubGlobal('TS', undefined);
    vi.stubGlobal('BroadcastChannel', class { postMessage = replicar; });
    const { ts } = await import('./TaleSpireAdapter');
    expect(await ts.sync.send('prueba', 'board')).toBe(true);
    expect(replicar).toHaveBeenCalledTimes(1);
  });
});
