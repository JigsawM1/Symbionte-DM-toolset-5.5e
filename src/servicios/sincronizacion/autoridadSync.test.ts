import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ts } from '@/utiles/TaleSpireAdapter';
import { invalidarAutoridadSync, puedeEmitirPJ } from './autoridadSync';

describe('Propiedad nativa al recuperar borradores', () => {
  beforeEach(() => {
    invalidarAutoridadSync();
    vi.spyOn(ts.clients, 'obtenerPlayerId').mockResolvedValue('duenio');
    vi.spyOn(ts.creatures, 'getCreaturesOwnedByPlayer').mockResolvedValue([{ id: 'MINI-PROPIA' }]);
  });
  afterEach(() => { vi.restoreAllMocks(); });
  it('autoriza sólo miniaturas propias y compara sus identificadores sin mayúsculas', async () => {
    expect(await puedeEmitirPJ('mini-propia')).toBe(true);
    expect(await puedeEmitirPJ('mini-ajena')).toBe(false);
  });
  it('una ficha sin miniatura no hace una consulta ni se autoriza por su nombre', async () => {
    expect(await puedeEmitirPJ(null)).toBe(false);
    expect(ts.creatures.getCreaturesOwnedByPlayer).not.toHaveBeenCalled();
  });
  it('invalidar el contexto rechaza una comprobación anterior todavía pendiente', async () => {
    let terminar!: (minis: { id: string }[]) => void;
    let iniciar!: () => void;
    const iniciada = new Promise<void>(resolve => { iniciar = resolve; });
    vi.mocked(ts.creatures.getCreaturesOwnedByPlayer).mockImplementationOnce(() => new Promise(resolve => { terminar = resolve; iniciar(); }));
    const permiso = puedeEmitirPJ('mini-propia');
    await iniciada;
    invalidarAutoridadSync(); terminar([{ id: 'mini-propia' }]);
    expect(await permiso).toBe(false);
  });
});
