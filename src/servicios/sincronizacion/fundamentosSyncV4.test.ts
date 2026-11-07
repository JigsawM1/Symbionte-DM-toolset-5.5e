import { afterEach, describe, expect, it, vi } from 'vitest';
import { EsquemaMensajeSyncV4, type EntidadSyncV4, type GruposSyncV4, type MensajeSyncV4 } from '@/tipos/protocoloSync';
import { evaluarPropuestaSyncV4, reconciliarSyncV4 } from './reconciliacionSyncV4';
import { BufferTransporteSyncV4, fragmentarMensajeSyncV4 } from './bufferTransporteSyncV4';

const contexto = { campania: 'campania', tablero: 'tablero', sesion: 'sesion', director: 'dm' };
const grupos = (): GruposSyncV4 => ({ vitalidad: { actual: 25, maxima: 30, temporal: 5 },
  estados: { condiciones: [], efectos: [], concentracion: null }, acompanantes: [],
  datos: { nombre: 'Heroína', iniciativa: 12, ca: 15, pasivas: [10, 11, 12] } });
const entidad = (): EntidadSyncV4 => ({ id: 'pj', duenio: 'jugador', miniatura: 'mini', padre: null,
  revision: 4, revisiones: { vitalidad: 4, estados: 1, datos: 1, acompanantes: 1 },
  grupos: grupos(), eliminada: false });
const propuesta = (): Extract<MensajeSyncV4, { t: 'PROPUESTA' }> => ({ v: 4, t: 'PROPUESTA',
  contexto, emisor: 'cliente', operacion: 'op', entidad: 'pj', bases: entidad().revisiones,
  cambios: { vitalidad: { actual: 20, maxima: 30, temporal: 5 } }, resolver: [] });

describe('Fundamentos v4: reconciliación y transporte', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('combina grupos independientes sin perder versiones', () => {
    const base = grupos();
    const local = { ...base, vitalidad: { ...base.vitalidad, actual: 20 } };
    const remoto = { ...base, estados: { ...base.estados, condiciones: ['Envenenado'] } };
    expect(reconciliarSyncV4(base, local, remoto)).toEqual({ proponer: ['vitalidad'], aceptar: ['estados'], conflictos: [] });
    expect(base.vitalidad.actual).toBe(25);
  });

  it('conserva diferencias para decisión del dueño cuando falta base o ambos editaron', () => {
    const base = grupos();
    const local = { ...base, vitalidad: { ...base.vitalidad, actual: 20 } };
    const remoto = { ...base, vitalidad: { ...base.vitalidad, actual: 10 } };
    expect(reconciliarSyncV4(base, local, remoto).conflictos).toEqual(['vitalidad']);
    expect(reconciliarSyncV4(undefined, local, remoto).conflictos).toEqual(['vitalidad']);
    expect(local.vitalidad.actual).toBe(20);
  });

  it('una propuesta actualiza sólo su grupo y no interpreta asignaciones como daño', () => {
    const decision = evaluarPropuestaSyncV4(entidad(), propuesta(), 'jugador', 5);
    expect(decision.estado).toBe('aplicado');
    expect(decision.entidad.grupos.vitalidad).toEqual({ actual: 20, maxima: 30, temporal: 5 });
    expect(decision.entidad.revisiones).toEqual({ vitalidad: 5, estados: 1, datos: 1, acompanantes: 1 });
  });

  it('una resolución obsoleta no puede forzar una revisión ni modificar una entidad eliminada', () => {
    const op = propuesta();
    op.bases.vitalidad = 3;
    op.resolver = ['vitalidad'];
    expect(evaluarPropuestaSyncV4(entidad(), op, 'jugador', 5).estado).toBe('conflicto');
    expect(evaluarPropuestaSyncV4(entidad(), propuesta(), 'otro', 5).estado).toBe('rechazado');
    expect(evaluarPropuestaSyncV4({ ...entidad(), eliminada: true }, propuesta(), 'jugador', 5).estado).toBe('rechazado');
  });

  it('valida contratos sin admitir versiones anteriores ni números imposibles', () => {
    expect(EsquemaMensajeSyncV4.safeParse({ ...propuesta(), v: 3 }).success).toBe(false);
    expect(EsquemaMensajeSyncV4.safeParse({ ...propuesta(), cambios: { vitalidad: { actual: 31, maxima: 30, temporal: 0 } } }).success).toBe(false);
  });

  it('ensambla fuera de orden, respetando UTF-16 y escapes incluso con progreso de más de diez segundos', async () => {
    vi.useFakeTimers();
    const mensaje: Extract<MensajeSyncV4, { t: 'CONFIRMADO' }> = { v: 4, t: 'CONFIRMADO', contexto,
      emisor: 'dm', operacion: 'op', revision: 5, entidad: entidad() };
    mensaje.entidad.grupos.datos.nombre = '𝄞"\\'.repeat(30);
    const paquetes = fragmentarMensajeSyncV4(mensaje, 'fragmento');
    expect(paquetes.length).toBeGreaterThan(2);
    const expirar = vi.fn();
    const buffer = new BufferTransporteSyncV4(expirar);
    let completados = 0;
    try {
      for (const paquete of paquetes.reverse()) {
        expect(paquete.length).toBeLessThanOrEqual(400);
        const frag = EsquemaMensajeSyncV4.parse(JSON.parse(paquete));
        if (frag.t !== 'FRAG') throw new Error('Se esperaba fragmentación');
        const resultado = buffer.registrar('dm', frag);
        if (resultado.estado === 'completo') {
          completados++;
          expect(resultado.mensaje).toEqual(mensaje);
        }
        else expect(resultado.estado).toBe('progreso');
        await vi.advanceTimersByTimeAsync(9000);
      }
      expect(expirar).not.toHaveBeenCalled();
      expect(completados).toBe(1);
    } finally { buffer.limpiar(); }
  });

  it('los duplicados no renuevan expiración y no acepta remitente diferente', async () => {
    vi.useFakeTimers();
    const expirar = vi.fn();
    const buffer = new BufferTransporteSyncV4(expirar);
    const frag: Extract<MensajeSyncV4, { t: 'FRAG' }> = { v: 4, contexto, emisor: 'dm',
      t: 'FRAG', id: 'f', parte: 1, total: 2, texto: '{' };
    expect(buffer.registrar('ajeno', frag).estado).toBe('rechazado');
    expect(buffer.registrar('dm', frag).estado).toBe('progreso');
    await vi.advanceTimersByTimeAsync(9000);
    expect(buffer.registrar('dm', frag).estado).toBe('duplicado');
    await vi.advanceTimersByTimeAsync(1000);
    expect(expirar).toHaveBeenCalledOnce();
    buffer.limpiar();
  });
});
