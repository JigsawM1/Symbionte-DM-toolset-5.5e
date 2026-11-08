import { afterEach, expect, it, vi } from 'vitest';
import { TaleSpireInitiativeAdapter } from './talespireIniciativa';
import type { ColaIniciativaTS } from '@/tipos/talespire';
afterEach(() => { vi.unstubAllGlobals(); });
it('una lectura del tablero anterior no bloquea ni limpia la lectura nueva al invalidar el contexto', async () => {
  let terminarAnterior!: (cola: ColaIniciativaTS) => void;
  let terminarNueva!: (cola: ColaIniciativaTS) => void;
  const obtener = vi.fn().mockImplementationOnce(() => new Promise<ColaIniciativaTS>(resolve => { terminarAnterior = resolve; }))
    .mockImplementationOnce(() => new Promise<ColaIniciativaTS>(resolve => { terminarNueva = resolve; }));
  vi.stubGlobal('TS', { initiative: { getQueue: obtener } });
  const adaptador = new TaleSpireInitiativeAdapter(); const anterior = adaptador.getQueue();
  adaptador.invalidarLectura(); const nueva = adaptador.getQueue();
  terminarAnterior({ items: [], activeItemIndex: -1 }); await anterior;
  const concurrente = adaptador.getQueue(); expect(obtener).toHaveBeenCalledTimes(2);
  const cola: ColaIniciativaTS = { items: [{ id: 'actual', name: 'Actual', kind: 'creature' }], activeItemIndex: 0 };
  terminarNueva(cola); expect(await nueva).toEqual(cola); expect(await concurrente).toEqual(cola);
});
