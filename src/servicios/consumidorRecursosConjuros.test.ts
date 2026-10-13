import { describe, it, expect } from 'vitest';
import { consumirRecursoConjuro } from './consumidorRecursosConjuros';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { usarAlmacenDM } from '@/almacen/usarAlmacenDM';

describe('Consumo atómico de conjuros', () => {
  it('solo una de dos reservas inmediatas consume el último espacio', () => {
    const pj = { ...structuredClone(PERSONAJE_POR_DEFECTO), id: 'mago', espaciosConjuroMaximos: { '1': 1 }, espaciosConjuroGastados: {} };
    usarAlmacenDM.setState({ personajes: [pj] });
    const gastar = usarAlmacenDM.getState().consumirRecursoConjuro;
    expect(gastar(pj.id, { tipo: 'espacio', nivel: 1 }).permitido).toBe(true);
    expect(gastar(pj.id, { tipo: 'espacio', nivel: 1 }).permitido).toBe(false);
    expect(usarAlmacenDM.getState().personajes[0].espaciosConjuroGastados['1']).toBe(1);
  });
  it('rechaza puntos insuficientes y espacios de pacto agotados', () => {
    const pj = { ...structuredClone(PERSONAJE_POR_DEFECTO), puntosConjuroMaximos: 3, puntosConjuroGastados: 2, espaciosPactoMaximos: 1, espaciosPactoGastados: 1 };
    expect(consumirRecursoConjuro(pj, { tipo: 'puntos', cantidad: 2, nivel: 1 }).permitido).toBe(false);
    expect(consumirRecursoConjuro(pj, { tipo: 'pacto', nivel: 1 }).permitido).toBe(false);
    expect(consumirRecursoConjuro(pj, { tipo: 'ninguno' }).permitido).toBe(true);
  });
});
