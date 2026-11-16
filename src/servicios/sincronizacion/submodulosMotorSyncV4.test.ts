import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntidadSyncV4, MensajeSyncV4 } from '@/tipos/protocoloSync';
import type { InfoCliente } from '@/tipos/talespire';
import { logger } from '@/utiles/logger';
import {
  ArbitroPropuestasSyncV4,
  tieneBajaObsoletaAcompanantesSyncV4,
  verificarAutorizacionPropuestaSyncV4,
} from './arbitroPropuestasSyncV4';
import { ReplicaSyncV4 } from './replicaSyncV4';
import { BufferTransporteSyncV4 } from './bufferTransporteSyncV4';
import { EleccionDirectorSyncV4 } from './eleccionDirectorSyncV4';
import {
  clasificarErrorSyncV4,
  enviarMensajeFragmentadoSyncV4,
  registrarErrorSyncV4,
} from './erroresTransporteSyncV4';
import { prepararMesaSyncV4 } from './fixturesSyncV4.pruebas';
import type { MesaSyncV4 } from './mesaSyncV4.pruebas';

const contexto = { campania: 'campania', tablero: 'tablero', sesion: 'sesion-1', director: 'dm' };
const crearEntidad = (extra: Partial<EntidadSyncV4> = {}): EntidadSyncV4 => ({
  id: 'mini', duenio: 'duenio', miniatura: 'mini', padre: null,
  revision: 2, revisiones: { vitalidad: 2, estados: 1, datos: 1, acompanantes: 1 },
  grupos: {
    vitalidad: { actual: 20, maxima: 30, temporal: 0 },
    estados: { condiciones: [], efectos: [], concentracion: null },
    datos: { nombre: 'Heroína', iniciativa: 12, ca: 15, pasivas: [10, 11, 12] },
    acompanantes: [],
  },
  eliminada: false, ...extra,
});
const crearPropuesta = (extra: Partial<Extract<MensajeSyncV4, { t: 'PROPUESTA' }>> = {}): Extract<MensajeSyncV4, { t: 'PROPUESTA' }> => ({
  v: 4, t: 'PROPUESTA', contexto, emisor: 'jugador', sesionEmisor: 'ap-1',
  operacion: 'op-1', entidad: 'mini', bases: { vitalidad: 2, estados: 1, datos: 1, acompanantes: 1 },
  cambios: { vitalidad: { actual: 18, maxima: 30, temporal: 0 } }, resolver: [], ...extra,
});

describe('Submódulos de MotorSyncV4: errores, árbitro y elección', () => {
  let mesa: MesaSyncV4 | undefined;
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('BroadcastChannel', undefined); });
  afterEach(() => { mesa?.destruir(); mesa = undefined; vi.restoreAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('clasifica errores de límite de payload frente a errores de transporte SDK (incluidos cross-realm)', () => {
    const limite = clasificarErrorSyncV4(new Error('Mensaje v4 demasiado grande para el transporte'), 'propuesta', 'dm');
    expect(limite).toMatchObject({ codigo: 'LIMITE_PAYLOAD', tipoMensaje: 'propuesta' });

    const sdk = clasificarErrorSyncV4({ message: 'rateLimited' }, 'confirmado', 'board');
    expect(sdk).toMatchObject({ codigo: 'TRANSPORTE_SDK', operacion: 'confirmado', destino: 'board' });
  });

  it('registra errores con el nivel de severidad adecuado en logger', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    registrarErrorSyncV4({ codigo: 'TRANSPORTE_SDK', operacion: 'hola', destino: 'board', causa: 'timeout' });
    registrarErrorSyncV4({ codigo: 'PROCESAMIENTO_INTERNO', operacion: 'recibir', causa: 'fallo' });
    registrarErrorSyncV4({ codigo: 'ESQUEMA_INVALIDO', remitente: 'jugador', detalle: 'campo inválido' });
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('aborta envío fragmentado inmediatamente si cambia la sesión o muere el motor', async () => {
    let sesion = 's1';
    let vivo = true;
    const enviados: string[] = [];
    const mensaje: Extract<MensajeSyncV4, { t: 'CONFIRMADO' }> = {
      v: 4, t: 'CONFIRMADO', contexto, emisor: 'dm', sesionEmisor: 'ap-dm',
      operacion: 'op-grande', revision: 3,
      entidad: crearEntidad({ grupos: { ...crearEntidad().grupos, datos: { nombre: 'X'.repeat(900), iniciativa: 10, ca: 14, pasivas: [10, 10, 10] } } }),
    };

    const okCambioSesion = await enviarMensajeFragmentadoSyncV4({
      mensaje, sesionActual: () => sesion, estaVivo: () => vivo,
      enviarTexto: async texto => { enviados.push(texto); sesion = 's2'; return true; },
    });
    expect(okCambioSesion).toBe(false);
    expect(enviados).toHaveLength(1);

    enviados.length = 0;
    const okFalloEnvio = await enviarMensajeFragmentadoSyncV4({
      mensaje, sesionActual: () => 's2', estaVivo: () => true,
      enviarTexto: async () => false,
    });
    expect(okFalloEnvio).toBe(false);

    vivo = false;
    const okMuerto = await enviarMensajeFragmentadoSyncV4({
      mensaje, sesionActual: () => 's2', estaVivo: () => vivo,
      enviarTexto: async texto => { enviados.push(texto); return true; },
    });
    expect(okMuerto).toBe(false);
    expect(enviados).toHaveLength(0);
  });

  it('detecta REENSAMBLAJE_CORRUPTO, ESQUEMA_INVALIDO y aplica throttle en VERSION_INCOMPATIBLE', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const buffer = new BufferTransporteSyncV4(() => {});
    const frag1: Extract<MensajeSyncV4, { t: 'FRAG' }> = { v: 4, t: 'FRAG', contexto, emisor: 'dm', sesionEmisor: 'ap-1', id: 'bad', parte: 1, total: 2, texto: '{"v":4,' };
    const frag2: Extract<MensajeSyncV4, { t: 'FRAG' }> = { v: 4, t: 'FRAG', contexto, emisor: 'dm', sesionEmisor: 'ap-1', id: 'bad', parte: 2, total: 2, texto: 'corrupto}' };
    expect(buffer.registrar('dm', frag1).estado).toBe('progreso');
    expect(buffer.registrar('dm', frag2).estado).toBe('rechazado');
    expect(warnSpy).toHaveBeenCalledWith('[Sync v4] [REENSAMBLAJE_CORRUPTO]', expect.objectContaining({ codigo: 'REENSAMBLAJE_CORRUPTO', fragmentoId: 'bad' }));
    buffer.limpiar();

    const e = prepararMesaSyncV4(); mesa = e.mesa;
    await vi.advanceTimersByTimeAsync(5000);
    warnSpy.mockClear();
    await e.pj.motor.recibir({ v: 4, t: 'LATIDO', contexto, emisor: 'dm', revision: -5 }, mesa.miembros[0]);
    expect(warnSpy).toHaveBeenCalledWith('[Sync v4] [ESQUEMA_INVALIDO]', expect.objectContaining({ codigo: 'ESQUEMA_INVALIDO', remitente: 'dm' }));

    await e.pj.motor.recibir({ v: 3, t: 'META_COMBATE' }, mesa.miembros[0]);
    await e.pj.motor.recibir({ v: 3, t: 'META_COMBATE' }, mesa.miembros[0]);
    const avisosV4 = e.pj.store.getState().notificaciones.filter(n => n.mensaje.includes('protocolo v4'));
    expect(avisosV4).toHaveLength(1);
  });

  it('verifica autorización de entidad raíz, acompañante sin miniatura y bajas obsoletas', () => {
    const pj = crearEntidad({ id: 'mini', miniatura: 'mini', ficha: 'pj-ficha', grupos: { ...crearEntidad().grupos, acompanantes: [{ id: 'mini/ac', miniatura: null }] } });
    const ac = crearEntidad({ id: 'mini/ac', miniatura: null, padre: 'mini', ficha: 'ac' });
    const base: Record<string, EntidadSyncV4> = { mini: pj, 'mini/ac': ac };

    const authOk = verificarAutorizacionPropuestaSyncV4({
      actual: ac, propuesta: crearPropuesta({ entidad: 'mini/ac' }), jugadorId: 'duenio', propias: new Set(), base,
    });
    expect(authOk.valida).toBe(true);

    const authSuplantada = verificarAutorizacionPropuestaSyncV4({
      actual: pj, propuesta: crearPropuesta({ registro: crearEntidad({ ficha: 'otra' }) }), jugadorId: 'duenio', propias: new Set(['mini']), base,
    });
    expect(authSuplantada.valida).toBe(false);

    const propBajaObsoleta = crearPropuesta({
      cambios: { acompanantes: [] },
      revisionesHijos: { 'mini/ac': ac.revision - 1 },
    });
    expect(tieneBajaObsoletaAcompanantesSyncV4(pj, propBajaObsoleta, base)).toBe(true);
    expect(tieneBajaObsoletaAcompanantesSyncV4(pj, crearPropuesta({ cambios: { acompanantes: [] }, revisionesHijos: { 'mini/ac': ac.revision } }), base)).toBe(false);
  });

  it('EleccionDirectorSyncV4 controla quórum multi-GM, retiradas de apertura y requiere-voto', async () => {
    const gm1: InfoCliente = { id: 'gm1', clientMode: 'gm', player: { id: 'p1', name: 'GM1' } };
    const gm2: InfoCliente = { id: 'gm2', clientMode: 'gm', player: { id: 'p2', name: 'GM2' } };
    const enviados: { m: MensajeSyncV4; d?: string }[] = [];
    let vivo = true;
    const activado = vi.fn();
    const perdido = vi.fn();
    const eleccion = new EleccionDirectorSyncV4({
      clienteId: 'gm1', campania: 'c', tablero: 't', miembrosIniciales: [gm1, gm2],
      estaVivo: () => vivo, obtenerRevision: () => 0,
      enviar: async (m, d) => { enviados.push({ m, d }); return true; },
      ejecutar: (_op, acc) => { void acc(); }, notificar: vi.fn(), mostrar: vi.fn(),
      alActivarDirector: activado, alPerderDirector: perdido, alInvalidarPorRelevo: vi.fn(),
      alAdoptarContextoRemoto: vi.fn(), alRecibirHolaComoDirector: async () => {},
    });

    eleccion.iniciarLatido();
    expect(activado).not.toHaveBeenCalled();

    const hola1: Extract<MensajeSyncV4, { t: 'HOLA' }> = { v: 4, t: 'HOLA', contexto, emisor: 'gm2', sesionEmisor: 'ap-vieja', solicitud: 's1' };
    const hola2: Extract<MensajeSyncV4, { t: 'HOLA' }> = { v: 4, t: 'HOLA', contexto, emisor: 'gm2', sesionEmisor: 'ap-nueva', solicitud: 's2' };
    expect(eleccion.validarSesionEmisor('gm2', hola1)).toBe(true);
    expect(eleccion.validarSesionEmisor('gm2', hola2)).toBe(true);
    expect(eleccion.validarSesionEmisor('gm2', hola1)).toBe(false);

    eleccion.establecerDirectorLocal('ses-gm1');
    eleccion.actualizarMiembros([gm1, gm2]);
    // Simula caída de un director previo distinto (gm2)
    eleccion.contexto = { campania: 'c', tablero: 't', director: 'gm2', sesion: 'ses-gm2' };
    eleccion.actualizarMiembros([gm1]);
    expect(perdido).toHaveBeenCalledTimes(1);

    eleccion.miembros = [gm1, gm2];
    eleccion.procesarDireccion({ v: 4, t: 'DIRECCION', contexto: { campania: 'c', tablero: 't', director: 'gm2', sesion: 'ses-nueva' }, emisor: 'gm2', sesionEmisor: 'ap-2', fase: 'anuncio', candidato: 'gm2' }, gm2);
    expect(enviados.some(e => e.m.t === 'DIRECCION' && e.m.fase === 'requiere-voto' && e.d === 'gm2')).toBe(true);

    vivo = false;
    eleccion.destruir();
  });

  it('ArbitroPropuestasSyncV4 descarta propuesta si el cliente cambia a spectator durante propiedades()', async () => {
    const cliente: InfoCliente = { id: 'jugador', clientMode: 'player', player: { id: 'duenio', name: 'Dueño' } };
    let modoActual: InfoCliente['clientMode'] = 'player';
    let rev = 2;
    const replica = new ReplicaSyncV4({ base: { mini: crearEntidad() }, pendientes: {} });
    const enviar = vi.fn().mockResolvedValue(true);
    const arbitro = new ArbitroPropuestasSyncV4({
      clienteId: 'dm', replica,
      estaVivo: () => true, soyDirector: () => true, sesionActual: () => contexto.sesion,
      obtenerMiembro: () => ({ ...cliente, clientMode: modoActual }),
      propiedades: async () => { modoActual = 'spectator'; return new Set(['mini']); },
      sobre: () => ({ v: 4, contexto, emisor: 'dm', sesionEmisor: 'ap-dm' }),
      obtenerRevision: () => rev, avanzarRevision: () => ++rev,
      obtenerMeta: () => ({ orden: ['mini'], activo: 'mini', ronda: 1, porcentaje: true }),
      establecerMeta: () => {}, obtenerLocalEmitida: () => undefined,
      enviar, ejecutar: (_op, acc) => { void acc(); }, aplicar: () => {}, alResultadoPropio: () => {},
    });

    await arbitro.procesarPropuesta(crearPropuesta(), cliente);
    expect(enviar).not.toHaveBeenCalled();
    expect(replica.base.mini.grupos.vitalidad.actual).toBe(20);
  });
});
