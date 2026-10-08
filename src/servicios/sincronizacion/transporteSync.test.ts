import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EsquemaWireMensajeSync } from '@/tipos/sync';
import { BufferFragmentosSync, empaquetarEstadoSync, type EstadoSync, type FragmentoSync } from './transporteSync';

function estadoGrande(): EstadoSync {
  return { v: 1, t: 'DM', d: { t: 0, r: 9, v: true, mv: 'maximo', ts: 1000,
    c: [{ id: 'criatura', n: 'Dragón', i: 12, va: 30, vm: 50,
      e: Array.from({ length: 50 }, (_, i) => ({ id: `efecto-${i}`, n: `Protección "mágica" \\ ${String.fromCodePoint(0x1d11e)}`, r: 10 })) }] } };
}
function fragmentos(mensaje = estadoGrande()): FragmentoSync[] {
  return empaquetarEstadoSync(mensaje).map(texto => {
    const m = EsquemaWireMensajeSync.parse(JSON.parse(texto));
    if (m.t !== 'FRAG') throw new Error('La muestra debe fragmentarse');
    return m;
  });
}
describe('Transporte de estados completos por fragmentos', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

  it('una criatura grande conserva efectos, escapes y Unicode con paquetes de hasta 380 unidades UTF-16', () => {
    const original = estadoGrande();
    const paquetes = empaquetarEstadoSync(original);
    expect(paquetes.length).toBeGreaterThan(9);
    expect(paquetes.every(p => p.length <= 380)).toBe(true);
    const buffer = new BufferFragmentosSync(vi.fn());
    const partes = fragmentos(original).reverse();
    for (const parte of partes.slice(0, -1)) {
      expect(buffer.registrar(parte).tipo).toBe('progreso');
      expect(buffer.registrar(parte).tipo).toBe('ignorado');
    }
    const resultado = buffer.registrar(partes.at(-1)!);
    expect(resultado).toEqual({ tipo: 'completo', mensaje: EsquemaWireMensajeSync.parse(original) });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('el paquete pequeño conserva el formato directo', () => {
    const mensaje: EstadoSync = { v: 1, t: 'DM', d: { c: [], t: -1, r: 1, v: false, mv: 'maximo', ts: 5 } };
    expect(empaquetarEstadoSync(mensaje)).toEqual([JSON.stringify(mensaje)]);
  });

  it('los duplicados no posponen la expiración de una transmisión incompleta', () => {
    const expirar = vi.fn();
    const buffer = new BufferFragmentosSync(expirar);
    const parte = fragmentos()[0];
    buffer.registrar(parte);
    vi.advanceTimersByTime(3000);
    expect(buffer.registrar(parte).tipo).toBe('ignorado');
    vi.advanceTimersByTime(500);
    expect(expirar).toHaveBeenCalledWith('DM', 'DM');
    expect(expirar).toHaveBeenCalledTimes(1);
  });

  it.each(['indice', 'total', 'contenido'] as const)('descarta una transmisión con %s contradictorio', tipo => {
    const expirar = vi.fn();
    const buffer = new BufferFragmentosSync(expirar);
    const partes = fragmentos();
    buffer.registrar(partes[0]);
    const corrupto = { ...partes[0] };
    if (tipo === 'indice') corrupto.chunk = corrupto.total + 1;
    if (tipo === 'total') corrupto.total++;
    if (tipo === 'contenido') corrupto.d += 'x';
    expect(buffer.registrar(corrupto).tipo).toBe('invalido');
    for (const parte of partes.slice(1)) expect(buffer.registrar(parte).tipo).toBe('ignorado');
    vi.advanceTimersByTime(3500);
    expect(expirar).toHaveBeenCalledTimes(1);
  });

  it('valida la identidad y revisión del mensaje reconstruido', () => {
    const expirar = vi.fn();
    const buffer = new BufferFragmentosSync(expirar);
    const partes = fragmentos().map(p => ({ ...p, ts: 2000 }));
    for (const parte of partes.slice(0, -1)) buffer.registrar(parte);
    expect(buffer.registrar(partes.at(-1)!).tipo).toBe('invalido');
    expect(expirar).toHaveBeenCalledTimes(1);
  });

  it('aísla emisiones de dos jugadores y limpia sus temporizadores', () => {
    const buffer = new BufferFragmentosSync(vi.fn());
    const parte = fragmentos()[0];
    expect(buffer.registrar({ ...parte, k: 'PJ', id: 'uno' }).tipo).toBe('progreso');
    expect(buffer.registrar({ ...parte, k: 'PJ', id: 'dos' }).tipo).toBe('progreso');
    expect(vi.getTimerCount()).toBe(2);
    buffer.limpiar();
    expect(vi.getTimerCount()).toBe(0);
  });
});
