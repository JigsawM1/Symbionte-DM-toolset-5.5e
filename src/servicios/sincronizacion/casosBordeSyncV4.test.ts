import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntidadSyncV4, MensajeSyncV4 } from '@/tipos/protocoloSync';
import { EsquemaMensajeSyncV4 } from '@/tipos/protocoloSync';
import { prepararMesaSyncV4, pjSyncV4, filaSyncV4 } from './fixturesSyncV4.pruebas';
import { MesaSyncV4 } from './mesaSyncV4.pruebas';
import { MotorSyncV4 } from './motorSyncV4';

describe('Casos de borde v4: reconexión, reordenación, concurrencia y timeouts', () => {
  let mesa: MesaSyncV4 | undefined;
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('BroadcastChannel', undefined); });
  afterEach(() => { mesa?.destruir(); mesa = undefined; vi.restoreAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  const sobreDM = (m: MesaSyncV4) => {
    const dir = m.mensajes.find(x => x.origen === 'dm' && x.mensaje.t === 'DIRECCION')!.mensaje;
    return { v: 4 as const, contexto: dir.contexto, emisor: 'dm', sesionEmisor: dir.sesionEmisor };
  };

  it('reordena confirmados r+2 y r+3 al llegar r+1 sin pedir snapshot antes de los 3000 ms', async () => {
    const e = prepararMesaSyncV4(); mesa = e.mesa;
    await vi.advanceTimersByTimeAsync(5000);
    const revBase = e.pj.motor.replica.base.mini.revision;
    const base = structuredClone(e.pj.motor.replica.base.mini);
    const holasAntes = mesa.mensajes.filter(m => m.origen === 'jugador' && m.mensaje.t === 'HOLA').length;

    const c2: EntidadSyncV4 = { ...structuredClone(base), revision: revBase + 2, grupos: { ...base.grupos, vitalidad: { ...base.grupos.vitalidad, actual: 18 } } };
    const c3: EntidadSyncV4 = { ...structuredClone(base), revision: revBase + 3, grupos: { ...base.grupos, vitalidad: { ...base.grupos.vitalidad, actual: 14 } } };
    const c1: EntidadSyncV4 = { ...structuredClone(base), revision: revBase + 1, grupos: { ...base.grupos, vitalidad: { ...base.grupos.vitalidad, actual: 22 } } };

    await e.pj.motor.recibir({ ...sobreDM(mesa), t: 'CONFIRMADO', operacion: 'op-2', revision: revBase + 2, entidad: c2 }, mesa.miembros[0]);
    await e.pj.motor.recibir({ ...sobreDM(mesa), t: 'CONFIRMADO', operacion: 'op-3', revision: revBase + 3, entidad: c3 }, mesa.miembros[0]);
    expect(e.pj.store.getState().personajes[0].hpActual).toBe(25);

    await vi.advanceTimersByTimeAsync(1500);
    expect(mesa.mensajes.filter(m => m.origen === 'jugador' && m.mensaje.t === 'HOLA')).toHaveLength(holasAntes);

    await e.pj.motor.recibir({ ...sobreDM(mesa), t: 'CONFIRMADO', operacion: 'op-1', revision: revBase + 1, entidad: c1 }, mesa.miembros[0]);
    expect(e.pj.store.getState().personajes[0].hpActual).toBe(14);
    await vi.advanceTimersByTimeAsync(3500);
    expect(mesa.mensajes.filter(m => m.origen === 'jugador' && m.mensaje.t === 'HOLA')).toHaveLength(holasAntes);
  });

  it('expira esperaOrden a los 3000 ms si falta un confirmado y recupera por snapshot', async () => {
    const e = prepararMesaSyncV4(); mesa = e.mesa;
    await vi.advanceTimersByTimeAsync(5000);

    let omitirConfirmado = true;
    mesa.descartar = p => {
      const msg = EsquemaMensajeSyncV4.parse(JSON.parse(p.texto));
      const esConfirmado = msg.t === 'CONFIRMADO' || (msg.t === 'FRAG' && msg.tipoMensaje === 'CONFIRMADO');
      return omitirConfirmado && p.origen === 'dm' && esConfirmado;
    };
    e.dm.store.getState().modificarVidaCriaturaIniciativa('mini', 16);
    await vi.advanceTimersByTimeAsync(200);
    omitirConfirmado = false;
    e.dm.store.getState().modificarVidaCriaturaIniciativa('mini', 11);
    await vi.advanceTimersByTimeAsync(2900);
    expect(e.pj.store.getState().personajes[0].hpActual).toBe(25);

    await vi.advanceTimersByTimeAsync(500);
    expect(e.pj.store.getState().personajes[0].hpActual).toBe(11);
  });

  it('limpia el búfer si se desbordan 256 diferidos fuera de orden y converge mediante snapshot', async () => {
    const e = prepararMesaSyncV4(); mesa = e.mesa;
    await vi.advanceTimersByTimeAsync(5000);
    e.dm.store.getState().modificarVidaCriaturaIniciativa('mini', 9);
    await vi.advanceTimersByTimeAsync(200);
    const revReal = e.dm.motor.replica.base.mini.revision;

    for (let i = 2; i <= 259; i++) {
      await e.pj.motor.recibir({
        ...sobreDM(mesa), t: 'COMBATE', revision: revReal + i,
        meta: { orden: ['mini'], activo: 'mini', ronda: i, porcentaje: true },
      }, mesa.miembros[0]);
    }
    await vi.advanceTimersByTimeAsync(3500);
    expect(e.pj.store.getState().personajes[0].hpActual).toBe(9);
  });

  it('mantiene idempotencia cuando una propuesta llega duplicada tras perderse RESULTADO', async () => {
    const e = prepararMesaSyncV4(); mesa = e.mesa;
    await vi.advanceTimersByTimeAsync(5000);
    const base = e.pj.motor.replica.base.mini;
    const hola = mesa.mensajes.find(m => m.origen === 'jugador' && m.mensaje.t === 'HOLA')!.mensaje;
    const prop: Extract<MensajeSyncV4, { t: 'PROPUESTA' }> = {
      ...sobreDM(mesa), emisor: 'jugador', sesionEmisor: hola.sesionEmisor,
      t: 'PROPUESTA', operacion: 'op-idempotente', entidad: 'mini',
      bases: { ...base.revisiones }, cambios: { vitalidad: { actual: 13, maxima: 30, temporal: 0 } }, resolver: [],
    };
    const revAntes = e.dm.motor.replica.base.mini.revision;
    await e.dm.motor.recibir(prop, mesa.miembros[1]);
    await e.dm.motor.recibir(prop, mesa.miembros[1]);
    expect(e.dm.motor.replica.base.mini.revision).toBe(revAntes + 1);
    const resultados = mesa.mensajes.filter(m => m.origen === 'dm' && m.destino === 'jugador' && m.mensaje.t === 'RESULTADO');
    expect(resultados).toHaveLength(2);
  });

  it('resuelve conflicto simultáneo en vitalidad conservando cambio paralelo en estados tras pérdida inicial', async () => {
    const e = prepararMesaSyncV4(); mesa = e.mesa;
    await vi.advanceTimersByTimeAsync(5000);
    mesa.demora = () => 300;
    let perderUnaPropuesta = true;
    mesa.descartar = p => {
      if (perderUnaPropuesta && p.origen === 'jugador' && JSON.parse(p.texto).t === 'PROPUESTA') {
        perderUnaPropuesta = false; return true;
      }
      return false;
    };

    e.pj.store.getState().establecerHPActualPersonaje('pj', 17);
    e.dm.store.getState().modificarVidaCriaturaIniciativa('mini', 11);
    e.dm.store.getState().agregarCondicionACriatura('mini', 'Aturdido');
    await vi.advanceTimersByTimeAsync(5000);

    expect(e.pj.store.getState().personajes[0].condicionesActivas).toContain('Aturdido');
    const conflicto = e.pj.store.getState().conexionSyncV4.conflictos[0];
    expect(conflicto.grupos).toEqual(['vitalidad']);
    expect(e.pj.motor.resolver('mini', 'vitalidad', 'local', conflicto.remoto.revisiones.vitalidad)).toBe(true);
    await vi.advanceTimersByTimeAsync(3000);
    expect(e.dm.store.getState().colaIniciativa[0].vidaActual).toBe(17);
    expect(e.dm.store.getState().colaIniciativa[0].condiciones).toContain('Aturdido');
  });

  it('conserva ediciones pendientes ante error de red SDK y aborta snapshots al destruir', async () => {
    const miembros = [
      { id: 'dm', clientMode: 'gm' as const, player: { id: 'master', name: 'Máster' } },
      { id: 'jugador', clientMode: 'player' as const, player: { id: 'duenio', name: 'Dueño' } },
    ];
    let soltarLote: ((ok: boolean) => void) | undefined;
    let bloquearLote = false;
    const envios: string[] = [];

    const esPaqueteLote = (texto: string): boolean => {
      const p = JSON.parse(texto) as { t?: string; k?: string };
      return p.t === 'LOTE' || (p.t === 'F' && p.k === 'LOTE');
    };
    const motorDM = new MotorSyncV4({
      cliente: miembros[0], campania: 'c', tablero: 't', miembros,
      consultar: async id => miembros.find(m => m.id === id),
      propiedades: async () => new Set(['mini']),
      enviar: texto => {
        envios.push(texto);
        if (bloquearLote && esPaqueteLote(texto)) {
          return new Promise<boolean>(res => { soltarLote = res; });
        }
        return Promise.resolve(true);
      },
      leer: () => ({
        entidades: Array.from({ length: 5 }, (_, i) => ({
          id: i === 0 ? 'mini' : `m-${i}`, duenio: i === 0 ? 'duenio' : 'sin-vincular',
          miniatura: i === 0 ? 'mini' : `m-${i}`, padre: null, revision: 1,
          revisiones: { vitalidad: 1, estados: 1, datos: 1, acompanantes: 1 },
          grupos: {
            vitalidad: { actual: 25, maxima: 30, temporal: 0 },
            estados: { condiciones: [], efectos: [], concentracion: null },
            datos: { nombre: `Criatura ${i}`, iniciativa: 10, ca: 12, pasivas: [10, 10, 10] },
            acompanantes: [],
          },
          eliminada: false,
        })),
        meta: { orden: ['mini', 'm-1', 'm-2', 'm-3', 'm-4'], activo: 'mini', ronda: 1, porcentaje: true },
      }),
      aplicar: () => {}, guardar: () => {}, mostrar: () => {}, notificar: () => {},
    });

    motorDM.iniciar();
    for (let i = 0; i < 6; i++) await Promise.resolve();
    const sesion = JSON.parse(envios[0]).contexto.sesion as string;
    bloquearLote = true;
    envios.length = 0;

    await motorDM.recibir({
      v: 4, t: 'HOLA', contexto: { campania: 'c', tablero: 't', director: 'dm', sesion },
      emisor: 'jugador', sesionEmisor: 'ap-j', solicitud: 's1',
    }, miembros[1]);
    for (let i = 0; i < 10 && !soltarLote; i++) await Promise.resolve();
    expect(envios.filter(esPaqueteLote)).toHaveLength(1);

    motorDM.destruir();
    soltarLote?.(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(envios.filter(esPaqueteLote)).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);

    const basePJ = pjSyncV4();
    const mesaReal = new MesaSyncV4(miembros, new Map([['duenio', new Set(['mini'])]]));
    mesa = mesaReal;
    const dm = mesaReal.agregar('dm', { esGM: true, personajes: [basePJ], colaIniciativa: [filaSyncV4()] });
    const pj = mesaReal.agregar('jugador', { esGM: false, personajes: [basePJ], colaIniciativa: [filaSyncV4()] });
    mesaReal.iniciar();
    await vi.advanceTimersByTimeAsync(5000);

    mesaReal.rechazar = () => 'fallo-red';
    pj.store.getState().establecerHPActualPersonaje('pj', 15);
    await vi.advanceTimersByTimeAsync(6500);
    expect(pj.motor.exportarPendientes().mini.grupos.vitalidad.actual).toBe(15);
    expect(pj.store.getState().notificaciones.some(n => n.mensaje.includes('Tu edición sigue disponible en sincronización'))).toBe(true);
    expect(dm.store.getState().notificaciones.some(n => n.mensaje.includes('se conservan los cambios pendientes'))).toBe(true);

    mesaReal.rechazar = () => undefined;
    pj.motor.reintentar();
    await vi.advanceTimersByTimeAsync(5000);
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(15);
  });
});
