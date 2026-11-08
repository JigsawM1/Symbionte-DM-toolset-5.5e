import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FragmentoCliente, InfoCliente, EventoClienteTS } from '@/tipos/talespire';
import { usarAlmacenDM as almacen } from '@/almacen/usarAlmacenDM';
import * as conexion from './conexionSyncV4';

describe('Ciclo nativo v4 con API simulada', () => {
  const yo = { id: 'director', player: { id: 'master', name: 'Máster' } };
  const otro = { id: 'otro-gm', player: { id: 'otro-master', name: 'Otro GM' } };
  let tablero: string;
  let enTablero: FragmentoCliente[];
  let modoPropio: 'gm' | 'player';
  let eventoNativo: ((evento: EventoClienteTS) => void) | undefined;
  const enviar = vi.fn(async () => undefined);
  const quienSoy = vi.fn(async () => yo);
  const dondeEstoy = vi.fn(async () => ({ id: tablero }));
  beforeEach(() => {
    vi.useFakeTimers(); vi.stubGlobal('BroadcastChannel', undefined);
    enviar.mockClear(); quienSoy.mockClear(); dondeEstoy.mockReset();
    tablero = 'tablero-a'; enTablero = [yo]; dondeEstoy.mockImplementation(async () => ({ id: tablero }));
    modoPropio = 'gm'; eventoNativo = undefined;
    vi.stubGlobal('TS', { clients: { whoAmI: quienSoy,
      getClientsInThisBoard: async () => enTablero,
      getMoreInfo: async (ids: string[]): Promise<InfoCliente[]> => [{ ...yo, clientMode: modoPropio }, { ...otro, clientMode: 'gm' as const }].filter(c => ids.includes(c.id)),
      onClientEvent: { subscribe: (callback: (evento: EventoClienteTS) => void) => { eventoNativo = callback; return { unsubscribe: () => { eventoNativo = undefined; } }; } } },
      campaigns: { whereAmI: async () => ({ id: 'campania' }) }, boards: { whereAmI: dondeEstoy },
      sync: { send: enviar, getClientsConnected: async () => [yo, otro] } });
    almacen.setState({ datosInicialesCargados: true, esGM: true, personajes: [], colaIniciativa: [], memoriaSyncV4: {} });
  });
  afterEach(() => {
    if (conexion.conexionSyncV4Suspendida()) conexion.eventoClienteSyncV4({ kind: 'clientJoinedBoard', client: yo });
    conexion.reiniciarConexionSyncV4(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  });
  it('un GM conectado desde otro tablero no participa en la elección de esta mesa', async () => {
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    expect(almacen.getState().conexionSyncV4.soyDirector).toBe(true);
    expect(almacen.getState().conexionSyncV4.candidatos.map(c => c.id)).toEqual(['director']);
  });
  it('la salida propia suspende envíos y la entrada delimita una nueva memoria de tablero', async () => {
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    conexion.eventoClienteSyncV4({ kind: 'clientLeftBoard', client: yo });
    const numero = enviar.mock.calls.length;
    expect(conexion.conexionSyncV4Suspendida()).toBe(true);
    await vi.advanceTimersByTimeAsync(10000);
    expect(enviar).toHaveBeenCalledTimes(numero);
    tablero = 'tablero-b'; conexion.eventoClienteSyncV4({ kind: 'clientJoinedBoard', client: yo });
    await vi.advanceTimersByTimeAsync(1000);
    expect(conexion.conexionSyncV4Suspendida()).toBe(false);
    expect(almacen.getState().conexionSyncV4.soyDirector).toBe(true);
    expect(Object.keys(almacen.getState().memoriaSyncV4)).toEqual([
      JSON.stringify(['campania', 'tablero-a']), JSON.stringify(['campania', 'tablero-b']),
    ]);
  });
  it('la llegada o cambio de rol de otro GM no reinicia ni desplaza al director vigente', async () => {
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    enTablero = [yo, otro];
    conexion.eventoClienteSyncV4({ kind: 'clientModeChanged', client: otro, clientMode: 'gm' });
    await vi.advanceTimersByTimeAsync(1000);
    expect(quienSoy).toHaveBeenCalledTimes(1);
    expect(almacen.getState().conexionSyncV4.soyDirector).toBe(true);
    expect(almacen.getState().conexionSyncV4.candidatos).toHaveLength(2);
  });
  it('ambas entradas conservan la identidad: eventos ajenos no consultan el rol propio ni solicitan snapshots', async () => {
    modoPropio = 'player'; enTablero = [yo, otro]; almacen.getState().establecerEsGM(false);
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    const contexto = { campania: 'campania', tablero, director: otro.id, sesion: 'sesion-gm' };
    const sobre = { v: 4, contexto, emisor: otro.id, sesionEmisor: 'apertura-gm' };
    await conexion.recibirSyncV4({ ...sobre, t: 'DIRECCION', fase: 'anuncio', candidato: otro.id }, otro);
    await conexion.recibirSyncV4({ ...sobre, t: 'LOTE', snapshot: 'inicial', revision: 0, parte: 1, total: 1,
      entidades: [], meta: { orden: [], activo: null, ronda: 1, porcentaje: false } }, otro);
    await vi.advanceTimersByTimeAsync(1000);
    expect(almacen.getState().conexionSyncV4.estado).toBe('conectado');
    const { ts } = await import('@/utiles/TaleSpireAdapter');
    const rol = vi.spyOn(ts.clients, 'esGM'); const aperturas = quienSoy.mock.calls.length;
    const sub = ts.clients.suscribirACambioModoCliente(conexion.eventoClienteSyncV4);
    try {
      enviar.mockClear();
      conexion.eventoClienteSyncV4({ kind: 'clientJoinedBoard', client: otro });
      eventoNativo?.({ kind: 'clientModeChanged', client: otro, clientMode: 'gm' });
      eventoNativo?.({ kind: 'clientModeChanged', clientMode: 'gm' });
      await vi.advanceTimersByTimeAsync(5000);
      expect(rol).not.toHaveBeenCalled(); expect(quienSoy).toHaveBeenCalledTimes(aperturas);
      expect(enviar).not.toHaveBeenCalled(); expect(almacen.getState().conexionSyncV4.estado).toBe('conectado');
      expect(await ts.clients.esGM()).toBe(false);
      modoPropio = 'gm'; eventoNativo?.({ kind: 'clientModeChanged', client: yo, clientMode: 'gm' });
      await vi.advanceTimersByTimeAsync(1000);
      expect(rol).toHaveBeenCalledWith(true); expect(almacen.getState().esGM).toBe(true);
      expect(quienSoy.mock.calls.length).toBeGreaterThan(aperturas);
    } finally { sub.desuscribir(); }
  });
  it('una lectura asíncrona del tablero anterior no puede iniciar una conexión después de salir', async () => {
    let terminar!: (valor: { id: string }) => void;
    dondeEstoy.mockImplementationOnce(() => new Promise(resolve => { terminar = resolve; }));
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(100);
    conexion.eventoClienteSyncV4({ kind: 'clientLeftBoard', client: yo });
    terminar({ id: 'tablero-a' }); await vi.advanceTimersByTimeAsync(1000);
    expect(enviar).not.toHaveBeenCalled();
    expect(almacen.getState().conexionSyncV4.estado).toBe('desconectado');
  });
});
