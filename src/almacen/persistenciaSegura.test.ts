import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { usarAlmacenDM } from './usarAlmacenDM';
import { forzarFlushPersistencia, construirBlobPersistencia } from './persistencia';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { sanearPersonaje } from './sanitizacion';
import { prepararCargaPersistida } from './cargaPersistida';
import { proyectarEstadoCombatePJ } from '@/servicios/sincronizacion/proyeccionEstadoCombate';

const inicial = usarAlmacenDM.getState();
let blob = '';
const guardar = vi.fn(async (valor: string) => { blob = valor; });
const leer = vi.fn(async () => blob);
beforeEach(() => {
  vi.useFakeTimers(); blob = ''; guardar.mockClear(); leer.mockReset().mockImplementation(async () => blob);
  vi.stubGlobal('window', { TS: { localStorage: { global: { getBlob: leer, setBlob: guardar } } } });
  usarAlmacenDM.setState(inicial, true);
});
afterEach(async () => { await forzarFlushPersistencia(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('Carga y persistencia seguras', () => {
  it('un fallo de lectura bloquea todas las escrituras y permite reintentar', async () => {
    blob = JSON.stringify({ notas: 'Original', personajes: [{ ...PERSONAJE_POR_DEFECTO, id: 'real' }] });
    leer.mockRejectedValueOnce(new Error('Fallo transitorio'));
    usarAlmacenDM.getState().cargarDatosPersistidos(); await vi.advanceTimersByTimeAsync(1);
    usarAlmacenDM.getState().guardarNotasDM('Borrador'); await vi.advanceTimersByTimeAsync(300);
    expect(await forzarFlushPersistencia(usarAlmacenDM.getState())).toBe(false);
    expect(guardar).not.toHaveBeenCalled();
    usarAlmacenDM.getState().cargarDatosPersistidos(); await vi.advanceTimersByTimeAsync(1);
    expect(usarAlmacenDM.getState().personajes[0].id).toBe('real');
    expect(usarAlmacenDM.getState().notasDM).toBe('Original');
  });
  it('un JSON o personaje inválido conserva el original y no aplica cambios parciales', async () => {
    for (const original of ['{incorrecto', JSON.stringify({ notas: 'No aplicar', personajes: [{ id: 'mal', competenciasArmas: 123 }] })]) {
      blob = original; usarAlmacenDM.getState().cargarDatosPersistidos(); await vi.advanceTimersByTimeAsync(1);
      expect(usarAlmacenDM.getState().datosInicialesCargados).toBe(false);
      expect(usarAlmacenDM.getState().blobRecuperacion).toBe(original);
      expect(usarAlmacenDM.getState().notasDM).toBe(inicial.notasDM);
    }
    expect(() => sanearPersonaje({ competenciasArmas: 123 })).toThrow(/competenciasArmas/);
  });
  it('restaura colecciones vacías y persiste cambios aislados de magia', async () => {
    blob = JSON.stringify({ pendientes: [], personajes: [], cola_iniciativa: [], encuentros: [] });
    usarAlmacenDM.getState().cargarDatosPersistidos(); await vi.advanceTimersByTimeAsync(1);
    expect(usarAlmacenDM.getState().listaPendientes).toEqual([]);
    expect(usarAlmacenDM.getState().personajes).toEqual([]);
    usarAlmacenDM.getState().establecerSistemaMagia('puntos'); await vi.advanceTimersByTimeAsync(300);
    expect(JSON.parse(blob).sistema_magia).toBe('puntos');
  });
  it('reutiliza las fichas deshidratadas cuando solo cambia el turno', () => {
    const estado = usarAlmacenDM.getState();
    expect(construirBlobPersistencia(estado).personajes).toBe(construirBlobPersistencia({ ...estado, rondaActual: 2 }).personajes);
  });
  it('serializa escrituras para que la primera no termine después de la última', async () => {
    let completar!: () => void;
    guardar.mockImplementationOnce(valor => new Promise<void>(resolve => {
      completar = () => { blob = valor; resolve(); };
    }));
    usarAlmacenDM.setState({ datosInicialesCargados: true, cargandoDatos: false, errorCargaDatos: null });
    usarAlmacenDM.getState().guardarNotasDM('Primera'); await vi.advanceTimersByTimeAsync(300);
    usarAlmacenDM.getState().guardarNotasDM('Última'); await vi.advanceTimersByTimeAsync(300);
    expect(guardar).toHaveBeenCalledTimes(1);
    completar(); await vi.advanceTimersByTimeAsync(1);
    expect(guardar).toHaveBeenCalledTimes(2);
    expect(JSON.parse(blob).notas).toBe('Última');
  });
  it('una respuesta de carga antigua no sustituye la carga más reciente', async () => {
    let completar!: (valor: string) => void;
    leer.mockImplementationOnce(() => new Promise<string>(resolve => { completar = resolve; }));
    usarAlmacenDM.getState().cargarDatosPersistidos();
    blob = JSON.stringify({ notas: 'Más reciente' });
    usarAlmacenDM.getState().cargarDatosPersistidos(); await vi.advanceTimersByTimeAsync(1);
    completar(JSON.stringify({ notas: 'Antigua' })); await vi.advanceTimersByTimeAsync(1);
    expect(usarAlmacenDM.getState().notasDM).toBe('Más reciente');
  });
  it('conserva los borradores rechazados al guardar y volver a cargar', () => {
    const dto = proyectarEstadoCombatePJ({ ...PERSONAJE_POR_DEFECTO, hpActual: 7 });
    const blob = construirBlobPersistencia({ ...usarAlmacenDM.getState(), borradoresSync: { [dto.id]: dto } });
    expect(prepararCargaPersistida(blob).borradoresSync?.[dto.id].hpActual).toBe(7);
  });
});
