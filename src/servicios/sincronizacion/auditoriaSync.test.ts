import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepararMesaSyncV4, pjSyncV4 } from './fixturesSyncV4.pruebas';
import type { MensajeSyncV4, EntidadSyncV4 } from '@/tipos/protocoloSync';
import { SnapshotsSyncV4 } from './snapshotsSyncV4';

describe('Auditoría: regresiones resueltas mediante recorridos v4 válidos', () => {
  let escenario: ReturnType<typeof prepararMesaSyncV4>;
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('BroadcastChannel', undefined); });
  afterEach(() => { escenario?.mesa.destruir(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  async function iniciar(transporte = false, acompanante = false) {
    escenario = prepararMesaSyncV4(transporte, acompanante);
    await vi.advanceTimersByTimeAsync(transporte ? 60000 : 5000);
    return escenario;
  }
  function sobre() {
    const { mesa } = escenario;
    const mensaje = mesa.mensajes.find(m => m.origen === 'dm' && m.mensaje.t === 'DIRECCION')!.mensaje;
    return { v: 4 as const, contexto: mensaje.contexto, emisor: 'jugador', sesionEmisor: mesa.mensajes.find(m => m.origen === 'jugador' && m.mensaje.t === 'HOLA')!.mensaje.sesionEmisor };
  }
  function propuesta(operacion: string, actual: number): Extract<MensajeSyncV4, { t: 'PROPUESTA' }> {
    const e = escenario.pj.motor.replica.base.mini;
    return { ...sobre(), t: 'PROPUESTA', operacion, entidad: 'mini', registro: structuredClone(e),
      bases: { ...e.revisiones }, cambios: { vitalidad: { ...e.grupos.vitalidad, actual } }, resolver: [] };
  }
  it('A01: la identidad de ficha no puede sustituirse por la de otra ficha', async () => {
    const { dm, mesa } = await iniciar();
    const m = propuesta('suplantacion', 1); m.registro!.ficha = 'otra-ficha';
    await dm.motor.recibir(m, mesa.miembros[1]);
    expect(dm.store.getState().personajes[0].hpActual).toBe(25);
  });
  it('A02: una propuesta atrasada queda en conflicto y no restaura PV anteriores', async () => {
    const { dm, mesa } = await iniciar();
    const vieja = propuesta('vieja', 25); const nueva = propuesta('nueva', 20);
    await dm.motor.recibir(nueva, mesa.miembros[1]);
    await dm.motor.recibir(vieja, mesa.miembros[1]);
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(20);
  });
  it('A03: un confirmado atrasado no restaura una condición retirada', async () => {
    const { dm, pj, mesa } = await iniciar();
    dm.store.getState().agregarCondicionACriatura('mini', 'Envenenado');
    await vi.advanceTimersByTimeAsync(500);
    const viejo = [...mesa.mensajes].reverse().find(m => m.mensaje.t === 'CONFIRMADO')!.mensaje;
    dm.store.getState().quitarCondicionDeCriatura('mini', 'Envenenado');
    await vi.advanceTimersByTimeAsync(500);
    await pj.motor.recibir(viejo, mesa.miembros[0]);
    expect(pj.store.getState().personajes[0].condicionesActivas).toEqual([]);
  });
  it('A04: el saludo de reconexión no borra los estados aplicados durante la ausencia', async () => {
    const { dm, mesa, pj } = await iniciar();
    pj.parar(); pj.motor.destruir();
    dm.store.getState().agregarCondicionACriatura('mini', 'Envenenado');
    await vi.advanceTimersByTimeAsync(500);
    const nuevo = mesa.agregar('jugador', { ...pj.store.getState(), personajes: [pjSyncV4()] });
    nuevo.motor.iniciar(); nuevo.motor.observar();
    await vi.advanceTimersByTimeAsync(5000);
    expect(dm.store.getState().colaIniciativa[0].condiciones).toContain('Envenenado');
    expect(nuevo.store.getState().personajes[0].condicionesActivas).toContain('Envenenado');
  });
  it('A05: HOLA devuelve el estado confirmado, sin incorporar una edición por anticipado', async () => {
    const { dm, pj } = await iniciar();
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 12);
    await vi.advanceTimersByTimeAsync(500);
    pj.motor.solicitar(); await vi.advanceTimersByTimeAsync(2000);
    expect(pj.store.getState().colaIniciativa[0].vidaActual).toBe(12);
  });
  it('A06: se conserva la edición local en un conflicto de condiciones', async () => {
    const { dm, pj, mesa } = await iniciar(); mesa.demora = () => 300;
    pj.store.getState().aplicarCondicionPersonaje('pj', 'Cegado');
    dm.store.getState().agregarCondicionACriatura('mini', 'Envenenado');
    await vi.advanceTimersByTimeAsync(3000);
    expect(pj.store.getState().personajes[0].condicionesActivas).toContain('Cegado');
    expect(pj.store.getState().conexionSyncV4.conflictos[0].grupos).toContain('estados');
  });
  it('A07: retirar concentración elimina el campo de dominio y el efecto', async () => {
    const { dm, pj } = await iniciar();
    dm.store.getState().agregarEfectoACriatura('mini', 'Concentración: Bendición', 5, { concentracion: true });
    await vi.advanceTimersByTimeAsync(1000);
    expect(pj.store.getState().personajes[0].concentracionActiva).not.toBeNull();
    const efecto = dm.store.getState().colaIniciativa[0].efectos![0];
    dm.store.getState().quitarEfectoDeCriatura('mini', efecto.id);
    await vi.advanceTimersByTimeAsync(1000);
    expect(pj.store.getState().personajes[0].concentracionActiva).toBeNull();
  });
  it('A08: fijar PV actuales conserva los temporales', async () => {
    const { dm, pj } = await iniciar(); dm.store.getState().modificarVidaCriaturaIniciativa('mini', 20);
    await vi.advanceTimersByTimeAsync(1000);
    expect(pj.store.getState().personajes[0]).toMatchObject({ hpActual: 20, hpTemporal: 5 });
  });
  it('A09: el máximo editado en iniciativa llega a la ficha', async () => {
    const { dm, pj } = await iniciar(); dm.store.getState().modificarVidaMaximaCriaturaIniciativa('mini', 40);
    await vi.advanceTimersByTimeAsync(1000); expect(pj.store.getState().personajes[0].hpMaximo).toBe(40);
  });
  it('A10: ordenar comunica los IDs y conserva el turno sobre la misma entidad al importar', async () => {
    const { dm, pj } = await iniciar();
    dm.store.getState().agregarCriaturaAIniciativa('Monstruo', 20, 10, 12, true, '30 pies', 0);
    dm.store.getState().ordenarIniciativa(); await vi.advanceTimersByTimeAsync(1000);
    expect(pj.store.getState().colaIniciativa.map(c => c.id)).toEqual(dm.store.getState().colaIniciativa.map(c => c.id));
  });
  it('A11: un estado fragmentado durante más de cuatro segundos llega íntegro', async () => {
    const { dm, pj } = await iniciar(true);
    const avatarUrl = 'https://ejemplo.test/' + 'a'.repeat(5000);
    pj.store.setState({ personajes: [{ ...pj.store.getState().personajes[0], avatarUrl }] });
    await vi.advanceTimersByTimeAsync(120000);
    expect(dm.store.getState().colaIniciativa[0].avatarUrl).toBe(avatarUrl);
  });
  it('A12: perder una página inicial provoca recuperación y no una aplicación parcial', async () => {
    escenario = prepararMesaSyncV4(true);
    let perdido = false;
    escenario.mesa.descartar = p => { if (!perdido && p.origen === 'dm' && ['FRAG', 'F'].includes(JSON.parse(p.texto).t)) { perdido = true; return true; } return false; };
    await vi.advanceTimersByTimeAsync(120000);
    expect(perdido).toBe(true);
    expect(escenario.pj.store.getState().conexionSyncV4.estado).toBe('conectado');
    expect(escenario.pj.store.getState().colaIniciativa).toHaveLength(1);
  });
  it('A13: destruir la sesión cancela un debounce pendiente', async () => {
    const { pj, mesa } = await iniciar();
    pj.store.getState().establecerHPActualPersonaje('pj', 19); pj.motor.destruir();
    const numero = mesa.paquetes.filter(p => p.origen === 'jugador').length;
    await vi.advanceTimersByTimeAsync(1000);
    expect(mesa.paquetes.filter(p => p.origen === 'jugador')).toHaveLength(numero);
  });
  it('A14: la pérdida de una propuesta reintenta la misma operación', async () => {
    const { dm, pj, mesa } = await iniciar(); let perdido = false;
    const inicio = mesa.mensajes.length;
    mesa.descartar = p => { if (!perdido && p.origen === 'jugador') { perdido = true; return true; } return false; };
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    await vi.advanceTimersByTimeAsync(15000);
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(19);
    const mensajes = mesa.mensajes.slice(inicio).filter(m => m.origen === 'jugador' && m.mensaje.t === 'PROPUESTA');
    expect(mensajes.length).toBeGreaterThan(1);
    expect(new Set(mensajes.map(m => m.mensaje.t === 'PROPUESTA' ? m.mensaje.operacion : '')).size).toBe(1);
  });
  it('A15: las páginas de dos snapshots no se mezclan', async () => {
    await iniciar(); const acumulador = new SnapshotsSyncV4(() => {});
    const entidad = escenario.pj.motor.replica.base.mini;
    const meta = { orden: ['mini'], activo: 'mini', ronda: 1, porcentaje: true };
    const lote = (snapshot: string, parte: number, id: string): Extract<MensajeSyncV4, { t: 'LOTE' }> => ({
      ...sobre(), emisor: 'dm', t: 'LOTE', snapshot, revision: 10, parte, total: 2,
      entidades: [{ ...entidad, id }], meta });
    expect(acumulador.registrar(lote('a', 1, 'viejo'))).toBeUndefined();
    expect(acumulador.registrar(lote('b', 2, 'nuevo2'))).toBeUndefined();
    expect(acumulador.registrar(lote('a', 2, 'viejo2'))).toBeUndefined();
    expect(acumulador.registrar(lote('b', 1, 'nuevo1'))?.entidades.map(e => e.id)).toEqual(['nuevo1', 'nuevo2']);
    acumulador.limpiar();
  });
  it('A16: retirar el último acompañante replica la baja de ficha y combate', async () => {
    const { dm, pj, mesa } = await iniciar(false, true);
    pj.store.getState().eliminarAcompanantePersonaje('pj', 'ac');
    await vi.advanceTimersByTimeAsync(3000);
    expect(dm.store.getState().personajes[0].acompanantes).toEqual([]);
    expect(dm.store.getState().colaIniciativa.some(c => c.id === 'mini-ac')).toBe(false);
    pj.parar(); pj.motor.destruir();
    const nuevo = mesa.agregar('jugador', pj.store.getState()); nuevo.motor.iniciar(); nuevo.motor.observar();
    await vi.advanceTimersByTimeAsync(5000);
    expect(nuevo.store.getState().conexionSyncV4.estado).toBe('conectado');
    expect(nuevo.store.getState().personajes[0].acompanantes).toEqual([]);
  });
  it('A17: un acompañante homónimo con otra identidad no recibe condiciones ajenas', async () => {
    const { pj, mesa } = await iniciar(false, true);
    const original = pj.motor.replica.base['mini-ac'];
    const ajeno: EntidadSyncV4 = { ...original, id: 'mini-ajena', fila: 'mini-ajena', ficha: 'ac-ajeno', padre: 'otro-pj',
      grupos: { ...original.grupos, estados: { ...original.grupos.estados, condiciones: ['Envenenado'] } } };
    const ultima = Math.max(...mesa.mensajes.map(m => 'revision' in m.mensaje ? m.mensaje.revision : 0));
    await pj.motor.recibir({ ...sobre(), emisor: 'dm', sesionEmisor: mesa.mensajes.find(m => m.origen === 'dm')!.mensaje.sesionEmisor, t: 'CONFIRMADO', operacion: 'ajeno', revision: ultima + 1, entidad: ajeno }, mesa.miembros[0]);
    expect(pj.store.getState().personajes[0].acompanantes[0].condiciones).toEqual([]);
  });
});
