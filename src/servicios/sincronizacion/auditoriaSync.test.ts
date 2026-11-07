import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usarAlmacenDM, type CriaturaIniciativa } from '@/almacen/usarAlmacenDM';
import { PERSONAJE_POR_DEFECTO } from '@/constantes';
import { EsquemaAcompanantePersonaje } from '@/tipos/personaje';
import type { FragmentoCliente, InfoCliente } from '@/tipos/talespire';
import { EsquemaMensajeSyncV2, empaquetarResumenCriaturaDM, type ResumenCombatePJWire } from '@/tipos/protocoloSync';
import { ts } from '@/utiles/TaleSpireAdapter';
import { invalidarAutoridadSync } from './autoridadSync';
import {
  emitirEstadoPJSync, fragmentarTextoSyncV2, procesarEventoSyncV2, reiniciarSesionMotorSyncV2,
  programarEmisionEstadoPJSync,
} from './motorEventosSync';
import {
  inicializarObservadoresStoreSync, procesarMensajeSyncEntrante, reiniciarSincronizacion,
  solicitarEstadoInicial,
} from '../sincronizacionSimbiote';

// Invariantes deseadas que FALLAN en el código auditado. Vitest it.fails exige
// que fallen; al corregir cada defecto deberá convertirse en un it normal.
const dm: FragmentoCliente = { id: 'cliente-dm', player: { id: 'jugador-dm', name: 'DM' } };
const jugador: FragmentoCliente = { id: 'cliente-pj', player: { id: 'jugador-pj', name: 'Jugador' } };
const pj = () => ({ ...structuredClone(PERSONAJE_POR_DEFECTO), id: 'pj-1', nombre: 'Heroína',
  idMiniaturaTS: 'mini-pj', hpActual: 25, hpMaximo: 30, hpTemporal: 5 });
const criatura = (parcial: Partial<CriaturaIniciativa> = {}): CriaturaIniciativa => ({
  id: 'mini-pj', idPersonajeDuenio: 'pj-1', nombre: 'Heroína', iniciativa: 10,
  vidaActual: 25, vidaMaxima: 30, vidaTemporal: 5, ca: 10, esMonstruo: false,
  condiciones: [], efectos: [], velocidad: '30 pies', bonificadorIniciativa: 0, ...parcial,
});
const wirePJ = (parcial: Partial<ResumenCombatePJWire> = {}): ResumenCombatePJWire => ({
  id: 'pj-1', m: 'mini-pj', n: 'Heroína', i: 10, va: 25, vm: 30, vt: 5,
  ca: 10, p: [10, 10, 10], ts: Date.now(), ...parcial,
});
const estadoCriatura = (parcial: Partial<CriaturaIniciativa> = {}) => ({
  v: 3, s: 'sesion-dm', t: 'CRIATURA_ESTADO', d: empaquetarResumenCriaturaDM(criatura(parcial)),
});

describe('Auditoría de sincronización: defectos reproducibles pendientes', () => {
  let desuscribir: (() => void) | undefined;
  beforeEach(() => {
    vi.useFakeTimers();
    reiniciarSincronizacion();
    reiniciarSesionMotorSyncV2();
    invalidarAutoridadSync();
    vi.spyOn(ts.sync, 'send').mockResolvedValue(true);
    vi.spyOn(ts.clients, 'obtenerPlayerId').mockResolvedValue(jugador.player.id);
    vi.spyOn(ts.clients, 'getMoreInfo').mockImplementation(async ids =>
      [dm, jugador].filter(c => ids.includes(c.id)).map((c): InfoCliente => ({
        ...c, clientMode: c.id === dm.id ? 'gm' : 'player',
      })));
    vi.spyOn(ts.creatures, 'getCreaturesOwnedByPlayer').mockResolvedValue([{ id: 'mini-pj' }]);
    usarAlmacenDM.setState({ esGM: false, aplicandoSync: false, personajes: [pj()],
      colaIniciativa: [criatura()], rondaActual: 1, indiceTurnoActivo: 0,
      timestampsModificacionLocal: {}, borradoresSync: {}, discrepanciaVitalidadPendiente: null,
      notificaciones: [], idClienteDM: null });
  });
  afterEach(() => {
    desuscribir?.();
    desuscribir = undefined;
    reiniciarSincronizacion();
    reiniciarSesionMotorSyncV2();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.fails('A01: poseer otra miniatura no autoriza sobrescribir un id de PJ ajeno', async () => {
    usarAlmacenDM.setState({ esGM: true, personajes: [{ ...pj(), idMiniaturaTS: 'mini-ajena' }],
      colaIniciativa: [criatura({ id: 'mini-ajena' })] });
    await procesarEventoSyncV2({ v: 3, t: 'PJ_ESTADO', d: wirePJ({ va: 1 }) }, jugador);
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(25);
  });

  it.fails('A02: un PJ atrasado no debe revertir una actualización más nueva', async () => {
    usarAlmacenDM.setState({ esGM: true });
    await procesarEventoSyncV2({ v: 3, s: 'pj', t: 'PJ_ESTADO', d: wirePJ({ ts: 200, va: 20 }) }, jugador);
    await procesarEventoSyncV2({ v: 3, s: 'pj', t: 'PJ_ESTADO', d: wirePJ({ ts: 100, va: 25 }) }, jugador);
    expect(usarAlmacenDM.getState().colaIniciativa[0].vidaActual).toBe(20);
  });

  it.fails('A03: una alta de condición atrasada no debe deshacer su retirada', async () => {
    await procesarEventoSyncV2(estadoCriatura({ condiciones: [] }), dm);
    await procesarEventoSyncV2(estadoCriatura({ condiciones: ['Envenenado'] }), dm);
    expect(usarAlmacenDM.getState().personajes[0].condicionesActivas).toEqual([]);
  });

  it.fails('A04: HOLA no debe borrar los estados que el DM aplicó mientras el PJ estaba desconectado', async () => {
    usarAlmacenDM.setState({ esGM: true, colaIniciativa: [criatura({ condiciones: ['Envenenado'] })] });
    await procesarEventoSyncV2({ v: 3, t: 'HOLA', pj: wirePJ() }, jugador);
    expect(usarAlmacenDM.getState().colaIniciativa[0].condiciones).toEqual(['Envenenado']);
  });

  it.fails('A05: el lote de respuesta a HOLA debe contener el estado ya incorporado', async () => {
    usarAlmacenDM.setState({ esGM: true });
    await procesarEventoSyncV2({ v: 3, t: 'HOLA', pj: wirePJ({ va: 12 }) }, jugador);
    const mensajes = vi.mocked(ts.sync.send).mock.calls.map(([str]) => EsquemaMensajeSyncV2.parse(JSON.parse(str)));
    const lote = mensajes.find(m => m.t === 'LOTE_INICIAL');
    if (!lote || lote.t !== 'LOTE_INICIAL') throw new Error('No se emitió el lote esperado');
    expect(lote.criaturas[0].va).toBe(12);
  });

  it.fails('A06: recibir estados del DM debe conservar una edición local pendiente recuperable', async () => {
    usarAlmacenDM.setState({ personajes: [{ ...pj(), condicionesActivas: ['Cegado'] }] });
    usarAlmacenDM.getState().registrarModificacionLocalPJ('pj-1');
    await procesarEventoSyncV2(estadoCriatura({ condiciones: ['Envenenado'] }), dm);
    const estado = usarAlmacenDM.getState();
    expect(estado.personajes[0].condicionesActivas.includes('Cegado') || Boolean(estado.borradoresSync['pj-1'])).toBe(true);
  });

  it.fails('A07: retirar concentración por red debe limpiar concentracionActiva', async () => {
    usarAlmacenDM.setState({ personajes: [{ ...pj(), concentracionActiva: {
      hechizoId: 'bendicion', nombreHechizo: 'Bendición',
    }, efectosActivos: [{ id: 'ef_concentracion', nombre: 'Concentración: Bendición', concentracion: true }] }] });
    await procesarEventoSyncV2(estadoCriatura(), dm);
    expect(usarAlmacenDM.getState().personajes[0].concentracionActiva).toBeNull();
  });

  it.fails('A08: fijar PV actuales desde iniciativa debe dar el mismo resultado con PV temporales', async () => {
    usarAlmacenDM.setState({ esGM: true });
    usarAlmacenDM.getState().modificarVidaCriaturaIniciativa('mini-pj', 20);
    const vidaDM = usarAlmacenDM.getState().colaIniciativa[0].vidaActual;
    const mensaje = EsquemaMensajeSyncV2.parse(JSON.parse(vi.mocked(ts.sync.send).mock.calls[0][0]));
    usarAlmacenDM.setState({ esGM: false, personajes: [pj()], colaIniciativa: [criatura()] });
    await procesarEventoSyncV2(mensaje, dm);
    expect(usarAlmacenDM.getState().personajes[0].hpActual).toBe(vidaDM);
  });

  it.fails('A09: cambiar PV máximos de PJ desde iniciativa debe emitir el cambio', () => {
    usarAlmacenDM.setState({ esGM: true });
    desuscribir = inicializarObservadoresStoreSync();
    usarAlmacenDM.getState().modificarVidaMaximaCriaturaIniciativa('mini-pj', 40);
    expect(vi.mocked(ts.sync.send).mock.calls.length).toBeGreaterThan(0);
  });

  it.fails('A10: ordenar la iniciativa local del DM debe comunicar su nuevo orden', () => {
    usarAlmacenDM.setState({ esGM: true, colaIniciativa: [criatura(), criatura({ id: 'mon',
      nombre: 'Monstruo', esMonstruo: true, iniciativa: 20 })] });
    desuscribir = inicializarObservadoresStoreSync();
    usarAlmacenDM.getState().ordenarIniciativa();
    expect(vi.mocked(ts.sync.send).mock.calls.length).toBeGreaterThan(0);
  });

  it.fails('A11: fragmentos válidos a 180 ms deben completar aunque el paquete tarde más de cuatro segundos', async () => {
    const d = wirePJ({ e: Array.from({ length: 200 }, (_, i) => ({ id: `ef-${i}`, n: 'Efecto de larga duración' })) });
    const paquetes = fragmentarTextoSyncV2(JSON.stringify({ v: 3, t: 'PJ_ESTADO', d }), 'pj');
    expect(paquetes.length).toBeGreaterThan(24);
    const aplicar = vi.spyOn(usarAlmacenDM.getState(), 'aplicarEstadoPJDesdeSyncV2');
    for (const paquete of paquetes) {
      await procesarEventoSyncV2(JSON.parse(paquete), jugador);
      await vi.advanceTimersByTimeAsync(180);
    }
    expect(aplicar).toHaveBeenCalledOnce();
  });

  it.fails('A12: recibir solo la primera página no debe cancelar la recuperación inicial', async () => {
    solicitarEstadoInicial();
    await vi.advanceTimersByTimeAsync(0);
    vi.mocked(ts.sync.send).mockClear();
    const datos = { v: 3, s: 'dm', t: 'LOTE_INICIAL', parte: 1, total: 2,
      r: 1, idx: 0, vPorcentaje: false, criaturas: [empaquetarResumenCriaturaDM(criatura())] };
    await procesarMensajeSyncEntrante({ datos, strCrudo: JSON.stringify(datos), fromClient: dm });
    await vi.advanceTimersByTimeAsync(10000);
    expect(vi.mocked(ts.sync.send).mock.calls.length).toBeGreaterThan(0);
  });

  it.fails('A13: reiniciar la sincronización debe cancelar el debounce v3 anterior', async () => {
    programarEmisionEstadoPJSync('pj-1');
    reiniciarSincronizacion();
    await vi.advanceTimersByTimeAsync(200);
    expect(ts.sync.send).not.toHaveBeenCalled();
  });

  it.fails('A14: un envío PJ fallido debe recuperarse o conservar un borrador con aviso', async () => {
    vi.mocked(ts.sync.send).mockResolvedValue(false);
    await emitirEstadoPJSync(pj());
    await vi.advanceTimersByTimeAsync(10000);
    const estado = usarAlmacenDM.getState();
    expect(vi.mocked(ts.sync.send).mock.calls.length > 1 || Boolean(estado.borradoresSync['pj-1'])).toBe(true);
  });

  it.fails('A15: dos snapshots de la misma sesión no deben mezclar sus páginas', () => {
    const base = { v: 3 as const, s: 'dm', t: 'LOTE_INICIAL' as const, total: 2,
      r: 1, idx: 0, vPorcentaje: false };
    const aplicar = usarAlmacenDM.getState().aplicarLoteInicialDesdeSync;
    aplicar({ ...base, parte: 1, criaturas: [empaquetarResumenCriaturaDM(criatura({ id: 'viejo-1' }))] });
    aplicar({ ...base, parte: 2, criaturas: [empaquetarResumenCriaturaDM(criatura({ id: 'nuevo-2' }))] });
    expect(usarAlmacenDM.getState().colaIniciativa.map(c => c.id)).toEqual(['mini-pj']);
  });

  it.fails('A16: retirar el último acompañante debe retirarlo también de la copia remota', async () => {
    const acomp = EsquemaAcompanantePersonaje.parse({ id: 'ac', idPlantilla: 'familiar',
      nombre: 'Familiar', vidaActual: 5, vidaMaxima: 5 });
    usarAlmacenDM.setState({ esGM: true, personajes: [{ ...pj(), acompanantes: [acomp] }] });
    await procesarEventoSyncV2({ v: 3, t: 'PJ_ESTADO', d: wirePJ({ ac: [] }) }, jugador);
    expect(usarAlmacenDM.getState().personajes[0].acompanantes).toEqual([]);
  });

  it.fails('A17: un acompañante homónimo de otro dueño no debe recibir el estado', async () => {
    const acomp = EsquemaAcompanantePersonaje.parse({ id: 'ac-local', idMiniaturaTS: 'mini-local',
      idPlantilla: 'familiar', nombre: 'Familiar', vidaActual: 5, vidaMaxima: 5 });
    usarAlmacenDM.setState({ personajes: [{ ...pj(), acompanantes: [acomp] }] });
    await procesarEventoSyncV2(estadoCriatura({ id: 'mini-ajena', nombre: 'Familiar',
      esAcompanante: true, idAcompanante: 'ac-ajeno', idPersonajeDuenio: 'pj-ajeno',
      condiciones: ['Envenenado'] }), dm);
    expect(usarAlmacenDM.getState().personajes[0].acompanantes[0].condiciones).toEqual([]);
  });
});
