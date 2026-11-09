import { describe, expect, it } from 'vitest';
import { seguirIniciativaFisica, type ReferenciaIniciativaFisica } from './seguimientoIniciativaFisica';
import type { ColaIniciativaTS } from '@/tipos/talespire';

const cola = (activo: number, orden = ['a', 'b', 'c']): ColaIniciativaTS => ({
  items: orden.map(id => ({ id, name: id, kind: 'creature' })), activeItemIndex: activo });
const referencia = (activo = 'c', orden = ['a', 'b', 'c']): ReferenciaIniciativaFisica => ({ orden, activo, inferirRonda: true });
const ids = new Set(['a', 'b', 'c', 'local']);
describe('Seguimiento físico con referencias independientes del turno local', () => {
  it('la primera lectura alinea el activo sin contar una vuelta', () => {
    expect(seguirIniciativaFisica(cola(0), null, 'c', 7, ids)).toMatchObject({ activo: 'a', ronda: 7 });
  });
  it('cuenta avance y retroceso de frontera una vez', () => {
    const avance = seguirIniciativaFisica(cola(0), referencia(), 'c', 7, ids);
    expect(avance).toMatchObject({ activo: 'a', ronda: 8 });
    const repetido = seguirIniciativaFisica(cola(0), avance.referencia, 'a', 8, ids);
    expect(repetido.ronda).toBe(8);
    expect(seguirIniciativaFisica(cola(2), repetido.referencia, 'a', 8, ids)).toMatchObject({ activo: 'c', ronda: 7 });
  });
  it('con dos participantes asume avance, sin decrementar al pasar al segundo', () => {
    const dos = ['a', 'b']; const r = referencia('a', dos);
    const segundo = seguirIniciativaFisica(cola(1, dos), r, 'a', 3, ids);
    expect(segundo.ronda).toBe(3);
    expect(seguirIniciativaFisica(cola(0, dos), segundo.referencia, 'b', 3, ids).ronda).toBe(4);
  });
  it('una edición manual no se revierte con duplicados ni cuenta la siguiente transición', () => {
    const r = { ...referencia('a'), inferirRonda: false };
    const repetido = seguirIniciativaFisica(cola(0), r, 'local', 9, ids);
    expect(repetido).toMatchObject({ activo: 'local', ronda: 9, referencia: { inferirRonda: false } });
    expect(seguirIniciativaFisica(cola(2), repetido.referencia, 'local', 9, ids)).toMatchObject({ activo: 'c', ronda: 9 });
  });
  it('reordenar o retirar participantes conserva el activo superviviente y reinicia la inferencia', () => {
    expect(seguirIniciativaFisica(cola(0, ['c', 'a', 'b']), referencia(), 'c', 5, ids)).toMatchObject({ activo: 'c', ronda: 5 });
    expect(seguirIniciativaFisica(cola(0, ['a', 'b']), referencia(), 'c', 5, new Set(['a', 'b']))).toMatchObject({ activo: 'a', ronda: 5 });
  });
  it('no inventa vueltas con una entidad, índices inválidos ni saltos no adyacentes', () => {
    expect(seguirIniciativaFisica(cola(0, ['a']), referencia('a', ['a']), 'a', 2, ids).ronda).toBe(2);
    expect(seguirIniciativaFisica(cola(-1), referencia(), 'b', 2, ids)).toMatchObject({ activo: 'b', ronda: 2 });
    expect(seguirIniciativaFisica(cola(2, ['a', 'b', 'c', 'd']), referencia('a', ['a', 'b', 'c', 'd']), 'a', 2, ids).ronda).toBe(2);
  });
});
