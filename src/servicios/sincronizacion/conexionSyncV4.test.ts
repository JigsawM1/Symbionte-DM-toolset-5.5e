import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FragmentoCliente, InfoCliente, EventoClienteTS } from '@/tipos/talespire';
import { EsquemaObjetoInventario } from '@/tipos/personaje';
import { usarAlmacenDM as almacen } from '@/almacen/usarAlmacenDM';
import * as conexion from './conexionSyncV4';
import { pjSyncV4, filaSyncV4 } from './fixturesSyncV4.pruebas';
import { recuperarMonstruoArchivado } from './recuperarMonstruoArchivado';

describe('Ciclo nativo v4 con API simulada', () => {
  const yo = { id: 'director', player: { id: 'master', name: 'Máster' } };
  const otro = { id: 'otro-gm', player: { id: 'otro-master', name: 'Otro GM' } };
  let tablero: string;
  let campania: string;
  let enTablero: FragmentoCliente[];
  let modoPropio: 'gm' | 'player';
  let eventoNativo: ((evento: EventoClienteTS) => void) | undefined;
  const enviar = vi.fn(async () => undefined);
  const quienSoy = vi.fn(async () => yo);
  const dondeEstoy = vi.fn(async () => ({ id: tablero }));
  beforeEach(() => {
    vi.useFakeTimers(); vi.stubGlobal('BroadcastChannel', undefined);
    enviar.mockClear(); quienSoy.mockClear(); dondeEstoy.mockReset();
    tablero = 'tablero-a'; campania = 'campania'; enTablero = [yo]; dondeEstoy.mockImplementation(async () => ({ id: tablero }));
    modoPropio = 'gm'; eventoNativo = undefined;
    vi.stubGlobal('TS', { clients: { whoAmI: quienSoy,
      getClientsInThisBoard: async () => enTablero,
      getMoreInfo: async (ids: string[]): Promise<InfoCliente[]> => [{ ...yo, clientMode: modoPropio }, { ...otro, clientMode: 'gm' as const }].filter(c => ids.includes(c.id)),
      onClientEvent: { subscribe: (callback: (evento: EventoClienteTS) => void) => { eventoNativo = callback; return { unsubscribe: () => { eventoNativo = undefined; } }; } } },
      campaigns: { whereAmI: async () => ({ id: campania, name: 'Mismo nombre' }) }, boards: { whereAmI: dondeEstoy },
      creatures: { getCreaturesOwnedByPlayer: async () => [{ id: 'mini' }] },
      sync: { send: enviar, getClientsConnected: async () => [yo, otro] } });
    almacen.setState({ datosInicialesCargados: true, esGM: true, personajes: [], colaIniciativa: [], memoriaSyncV4: {},
      contextoTaleSpire: null, versionContextosSync: 0, recuperacionContextosSync: null });
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
  it('recupera valores de monstruos sólo por decisión del director y confirma también copias locales', async () => {
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    const monstruo = { ...filaSyncV4(), id: 'c_local_monstruo', esMonstruo: true, idPersonajeDuenio: undefined };
    almacen.setState({ colaIniciativa: [monstruo] });
    expect(recuperarMonstruoArchivado({ ...monstruo, vidaActual: 7 }, 'otra', false)).toBe(false);
    expect(recuperarMonstruoArchivado({ ...monstruo, vidaActual: 7 }, campania, false)).toBe(true);
    expect(almacen.getState().memoriaSyncV4[JSON.stringify([campania, tablero])].base.c_local_monstruo.grupos.vitalidad.actual).toBe(7);
    expect(recuperarMonstruoArchivado(monstruo, campania, true)).toBe(true);
    expect(almacen.getState().colaIniciativa[1].id).not.toBe(monstruo.id);
    modoPropio = 'player'; conexion.eventoClienteSyncV4({ kind: 'clientModeChanged', client: yo }); await vi.advanceTimersByTimeAsync(1000);
    expect(recuperarMonstruoArchivado(monstruo, campania, true)).toBe(false);
  });
  it('cinco fichas y sólo 9D-2 afiliada: GM → jugador → GM no fabrica pendientes', async () => {
    const propias = { ...pjSyncV4(), nombre: '9D-2' };
    const ajenas = Array.from({ length: 4 }, (_, i) => ({ ...pjSyncV4(), id: `otra-${i}`, idMiniaturaTS: `otra-mini-${i}`,
      campaniaTaleSpire: i < 2 ? null : { id: 'otra-campania', nombre: 'Otra' } }));
    almacen.setState({ personajes: [propias, ...ajenas] });
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    expect(almacen.getState().conexionSyncV4).toMatchObject({ soyDirector: true, pendientes: 0 });
    expect(Object.keys(almacen.getState().memoriaSyncV4[JSON.stringify(['campania', tablero])].base)).toEqual(['mini']);
    modoPropio = 'player'; conexion.eventoClienteSyncV4({ kind: 'clientModeChanged', client: yo });
    await vi.advanceTimersByTimeAsync(1000);
    expect(almacen.getState().conexionSyncV4).toMatchObject({ estado: 'sin-director', pendientes: 0 });
    modoPropio = 'gm'; conexion.eventoClienteSyncV4({ kind: 'clientModeChanged', client: yo });
    await vi.advanceTimersByTimeAsync(2000);
    expect(almacen.getState().conexionSyncV4).toMatchObject({ soyDirector: true, pendientes: 0 });
    expect(almacen.getState().personajes.slice(1)).toEqual(ajenas);
  });
  it('dos campañas con el mismo nombre mantienen fichas y memorias separadas por ID', async () => {
    const otra = { ...pjSyncV4(), id: 'otro-pj', idMiniaturaTS: 'otra-mini', campaniaTaleSpire: { id: 'otra', nombre: 'Mismo nombre' } };
    almacen.setState({ personajes: [pjSyncV4(), otra] });
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    almacen.getState().establecerHPActualPersonaje('pj', 19); await vi.advanceTimersByTimeAsync(1000);
    conexion.eventoClienteSyncV4({ kind: 'clientLeftBoard', client: yo }); campania = 'otra';
    conexion.eventoClienteSyncV4({ kind: 'clientJoinedBoard', client: yo }); await vi.advanceTimersByTimeAsync(1000);
    almacen.getState().establecerHPActualPersonaje('pj', 2);
    expect(almacen.getState().personajes[0].hpActual).toBe(19);
    expect(Object.keys(almacen.getState().memoriaSyncV4[JSON.stringify(['otra', tablero])].base)).toEqual(['otra-mini']);
    expect(almacen.getState().memoriaSyncV4[JSON.stringify(['campania', tablero])].base.mini.grupos.vitalidad.actual).toBe(19);
  });
  it('una edición real en solitario durante el modo jugador sobrevive al regreso a GM', async () => {
    almacen.setState({ personajes: [pjSyncV4()] });
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    modoPropio = 'player'; conexion.eventoClienteSyncV4({ kind: 'clientModeChanged', client: yo });
    await vi.advanceTimersByTimeAsync(1000);
    almacen.getState().establecerHPActualPersonaje('pj', 19);
    expect(almacen.getState().conexionSyncV4.pendientes).toBe(1);
    modoPropio = 'gm'; conexion.eventoClienteSyncV4({ kind: 'clientModeChanged', client: yo });
    await vi.advanceTimersByTimeAsync(2000);
    expect(almacen.getState().personajes[0].hpActual).toBe(19);
    expect(almacen.getState().conexionSyncV4.pendientes).toBe(0);
  });
  it('modificaciones de inventario, recursos o conjuros sin GM no levantan ediciones pendientes', async () => {
    almacen.setState({ personajes: [pjSyncV4()] });
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    modoPropio = 'player'; conexion.eventoClienteSyncV4({ kind: 'clientModeChanged', client: yo });
    await vi.advanceTimersByTimeAsync(1000);
    expect(almacen.getState().conexionSyncV4.pendientes).toBe(0);
    const pj = almacen.getState().personajes[0];
    almacen.setState({
      personajes: [{
        ...pj,
        experiencia: (pj.experiencia ?? 0) + 100,
        conjurosPreparadosIds: ['proyectil-magico'],
        bolsaMonedas: { ...pj.bolsaMonedas, po: pj.bolsaMonedas.po + 50 },
      }],
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(almacen.getState().conexionSyncV4.pendientes).toBe(0);
    const pjActualizado = almacen.getState().personajes[0];
    almacen.setState({
      personajes: [{
        ...pjActualizado,
        inventario: [...pjActualizado.inventario, EsquemaObjetoInventario.parse({
          idInstancia: 'item-1',
          idObjeto: 'pocion-curacion',
          nombre: 'Poción de curación',
          cantidad: 1,
          pesoLb: 0.5,
          equipado: false,
        })],
      }],
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(almacen.getState().conexionSyncV4.pendientes).toBe(0);
  });
  it('restaura metadatos de su tablero y no hereda cola ni ronda de otro', async () => {
    almacen.setState({ personajes: [pjSyncV4()] });
    conexion.inicializarConexionSyncV4(); await vi.advanceTimersByTimeAsync(1000);
    almacen.setState({ colaIniciativa: [filaSyncV4()], rondaActual: 7, indiceTurnoActivo: 0 });
    conexion.eventoClienteSyncV4({ kind: 'clientLeftBoard', client: yo }); tablero = 'tablero-b';
    conexion.eventoClienteSyncV4({ kind: 'clientJoinedBoard', client: yo }); await vi.advanceTimersByTimeAsync(1000);
    expect(almacen.getState().colaIniciativa).toEqual([]); expect(almacen.getState().rondaActual).toBe(1);
    conexion.eventoClienteSyncV4({ kind: 'clientLeftBoard', client: yo }); tablero = 'tablero-a';
    conexion.eventoClienteSyncV4({ kind: 'clientJoinedBoard', client: yo }); await vi.advanceTimersByTimeAsync(1000);
    expect(almacen.getState().colaIniciativa.map(c => c.id)).toEqual(['mini']);
    expect(almacen.getState().rondaActual).toBe(7);
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
