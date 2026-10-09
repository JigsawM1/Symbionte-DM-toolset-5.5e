import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestorReintentosSync } from './gestorReintentosSync';

describe('Presupuesto de recuperación y emisiones ACK', () => {
  let gestor: GestorReintentosSync;
  beforeEach(() => { vi.useFakeTimers(); gestor = new GestorReintentosSync(); });
  afterEach(() => { gestor.destruir(); vi.useRealTimers(); });

  it('un envío inicial más dos reintentos aun sin ACK durante veinte segundos', async () => {
    const enviar = vi.fn().mockResolvedValue(true);
    gestor.registrarEmisionPJ('pj', 1000, enviar);
    await vi.advanceTimersByTimeAsync(20000);
    expect(enviar).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('empieza a esperar el ACK cuando termina de enviar la última parte', async () => {
    let terminar!: (valor: boolean) => void;
    const enviar = vi.fn(() => new Promise<boolean>(resolve => { terminar = resolve; }));
    gestor.registrarEmisionPJ('pj', 1000, enviar);
    await vi.advanceTimersByTimeAsync(8000);
    expect(enviar).toHaveBeenCalledTimes(1);
    terminar(true);
    await vi.advanceTimersByTimeAsync(1999);
    expect(enviar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(enviar).toHaveBeenCalledTimes(2);
    gestor.confirmarACK('pj', 1000);
    terminar(true);
    await vi.advanceTimersByTimeAsync(10000);
    expect(enviar).toHaveBeenCalledTimes(2);
  });

  it('un ACK recibido durante el envío cancela la espera que aún no ha comenzado', async () => {
    const enviar = vi.fn(async () => { gestor.confirmarACK('pj', 1000); return true; });
    gestor.registrarEmisionPJ('pj', 1000, enviar);
    await vi.advanceTimersByTimeAsync(20000);
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('una edición nueva cancela la anterior y rechaza ACK antiguos o futuros', async () => {
    const viejo = vi.fn().mockResolvedValue(true);
    const nuevo = vi.fn().mockResolvedValue(true);
    gestor.registrarEmisionPJ('pj', 1000, viejo);
    await vi.advanceTimersByTimeAsync(1000);
    gestor.registrarEmisionPJ('pj', 1001, nuevo);
    expect(gestor.confirmarACK('pj', 1000)).toBe(false);
    expect(gestor.confirmarACK('pj', 1002)).toBe(false);
    await vi.advanceTimersByTimeAsync(2000);
    expect(viejo).toHaveBeenCalledTimes(1);
    expect(nuevo).toHaveBeenCalledTimes(2);
    expect(gestor.confirmarACK('pj', 1001)).toBe(true);
  });

  it('también limita los intentos si el adaptador devuelve false o rechaza', async () => {
    const enviar = vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('sin red')).mockResolvedValue(false);
    gestor.registrarEmisionPJ('pj', 1000, enviar);
    await vi.advanceTimersByTimeAsync(20000);
    expect(enviar).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pausa REQ durante progreso sin reiniciar el presupuesto al expirar fragmentos', async () => {
    const enviar = vi.fn();
    gestor.iniciarReintentosREQ(enviar);
    await vi.advanceTimersByTimeAsync(1000);
    gestor.pausarReintentosREQ(enviar);
    await vi.advanceTimersByTimeAsync(10000);
    expect(enviar).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 5; i++) {
      gestor.continuarReintentosREQ();
      await vi.advanceTimersByTimeAsync(5000);
      gestor.pausarReintentosREQ(enviar);
    }
    expect(enviar).toHaveBeenCalledTimes(4);
    expect(vi.getTimerCount()).toBe(0);
    gestor.iniciarReintentosREQ(enviar);
    expect(enviar).toHaveBeenCalledTimes(5);
  });
});
