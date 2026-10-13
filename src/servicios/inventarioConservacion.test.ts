import { describe, expect, it } from 'vitest';
import { procesarAlternarEquipado } from './procesadorEquipamiento';
import type { ObjetoInventario } from '@/tipos';

function objeto(cambios: Partial<ObjetoInventario>): ObjetoInventario {
  return {
    idInstancia: 'equipado', idObjeto: 'espada', nombre: 'Espada',
    categoria: 'armas', esConsumible: false, subcategoria: '', pesoLb: 3,
    cantidad: 1, equipable: true, equipado: true, sintonizado: false,
    esMagico: false, rareza: 'Común', sintonizacionRequerida: false,
    notas: '', contenedor: 'mochila', ...cambios,
  };
}

describe('Auditoría: conservar instancias al desequipar', () => {
  it('no debe transportar la espada al almacén al desequiparla', () => {
    const resultado = procesarAlternarEquipado([
      objeto({}),
      objeto({ idInstancia: 'guardada', equipado: false, contenedor: 'almacen' }),
    ], 'equipado');
    expect(resultado.find(o => o.contenedor === 'mochila')?.cantidad).toBe(1);
    expect(resultado.find(o => o.contenedor === 'almacen')?.cantidad).toBe(1);
  });

  it('no debe borrar cargas ni notas de una instancia distinta', () => {
    const resultado = procesarAlternarEquipado([
      objeto({ cargasActuales: 1, cargasMaximas: 5, notas: 'Instancia agotada' }),
      objeto({ idInstancia: 'reserva', equipado: false, cargasActuales: 5, cargasMaximas: 5 }),
    ], 'equipado');
    expect(resultado).toHaveLength(2);
    expect(resultado.find(o => o.idInstancia === 'equipado')?.cargasActuales).toBe(1);
  });
});
