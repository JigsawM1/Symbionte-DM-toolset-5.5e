import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepararMesaSyncV4, pjSyncV4, filaSyncV4 } from './fixturesSyncV4.pruebas';
import { MesaSyncV4 } from './mesaSyncV4.pruebas';
import type { MensajeSyncV4 } from '@/tipos/protocoloSync';
import { EsquemaMensajeSyncV4 } from '@/tipos/protocoloSync';
import { EsquemaRasgoPersonaje } from '@/tipos/rasgos';

describe('Consistencia v4 ante concurrencia y cambios de sesión', () => {
  let mesa: MesaSyncV4;
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('BroadcastChannel', undefined); });
  afterEach(() => { mesa.destruir(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  async function iniciar(acompanante = false) {
    const e = prepararMesaSyncV4(false, acompanante); mesa = e.mesa;
    await vi.advanceTimersByTimeAsync(5000); return e;
  }
  const avanzar = () => vi.advanceTimersByTimeAsync(5000);
  function sobreDM() {
    const anuncio = mesa.mensajes.find(m => m.origen === 'dm' && m.mensaje.t === 'DIRECCION')!.mensaje;
    return { v: 4 as const, contexto: anuncio.contexto, emisor: 'dm', sesionEmisor: anuncio.sesionEmisor };
  }
  it('combina vida y estados editados a la vez en dos clientes', async () => {
    const { dm, pj } = await iniciar(); mesa.demora = () => 300;
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    dm.store.getState().agregarCondicionACriatura('mini', 'Envenenado');
    await avanzar();
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(19);
    expect(pj.store.getState().personajes[0].condicionesActivas).toContain('Envenenado');
    expect(pj.store.getState().conexionSyncV4.conflictos).toEqual([]);
  });
  it('un confirmado propio no borra la edición siguiente que se hizo mientras viajaba', async () => {
    const { dm, pj } = await iniciar(); mesa.demora = () => 300;
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    await vi.advanceTimersByTimeAsync(150);
    pj.store.getState().establecerHPActualPersonaje('pj', 18); await avanzar();
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(18);
    expect(pj.store.getState().personajes[0].hpActual).toBe(18);
    expect(pj.store.getState().conexionSyncV4.conflictos).toEqual([]);
  });
  it('editar vida no reenvía las estadísticas antiguas de una copia de ficha del GM', async () => {
    const { dm, pj } = await iniciar();
    pj.store.setState(s => ({ personajes: s.personajes.map(p => ({ ...p, caracteristicas: { ...p.caracteristicas, destreza: 18 } })) }));
    await avanzar(); const ca = dm.store.getState().colaIniciativa[0].ca;
    expect(ca).toBeGreaterThan(10);
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 19); await avanzar();
    expect(dm.store.getState().colaIniciativa[0].ca).toBe(ca);
    expect(pj.store.getState().colaIniciativa[0].ca).toBe(ca);
  });
  it('la pérdida de RESULTADO no repite una aplicación ya acreditada por CONFIRMADO', async () => {
    const { dm, pj } = await iniciar(); let perdidos = 0;
    mesa.descartar = p => {
      const m = EsquemaMensajeSyncV4.parse(JSON.parse(p.texto));
      if (p.origen === 'dm' && p.destino === 'jugador' && m.t === 'FRAG' && m.parte === m.total
        && mesa.mensajes.at(-1)?.mensaje.t === 'RESULTADO') { perdidos++; return true; }
      return false;
    };
    const inicio = mesa.mensajes.length;
    pj.store.getState().establecerHPActualPersonaje('pj', 19); await vi.advanceTimersByTimeAsync(15000);
    expect(perdidos).toBeGreaterThan(0);
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(19);
    expect(mesa.mensajes.slice(inicio).filter(m => m.mensaje.t === 'PROPUESTA')).toHaveLength(1);
    expect(pj.motor.exportarPendientes()).toEqual({});
  });
  it('rechaza identidad ausente, un remitente ajeno al tablero y un GM que no dirige', async () => {
    const { pj } = await iniciar();
    const e = structuredClone(pj.motor.replica.base.mini); e.grupos.vitalidad.actual = 1;
    const revision = Math.max(...mesa.mensajes.map(m => 'revision' in m.mensaje ? m.mensaje.revision : 0)) + 1;
    const mensaje = { ...sobreDM(), t: 'CONFIRMADO', revision, operacion: 'falso', entidad: e };
    await pj.motor.recibir(mensaje);
    const ajeno = { id: 'ajeno', clientMode: 'gm' as const, player: { id: 'tercero', name: 'Tercero' } };
    await pj.motor.recibir({ ...mensaje, emisor: ajeno.id }, ajeno);
    mesa.miembros.push(ajeno); pj.motor.actualizarMiembros(mesa.miembros);
    await pj.motor.recibir({ ...sobreDM(), t: 'HOLA', emisor: ajeno.id, sesionEmisor: 'apertura-ajena', solicitud: 'hola-ajeno' }, ajeno);
    await pj.motor.recibir({ ...mensaje, emisor: ajeno.id, sesionEmisor: 'apertura-ajena' }, ajeno);
    expect(pj.store.getState().personajes[0].hpActual).toBe(25);
  });
  it('Furia y Derribado mantienen el estado mecánico sin repetir usos al recibir confirmados', async () => {
    const { dm, pj } = await iniciar(true);
    const furia = EsquemaRasgoPersonaje.parse({ id: 'furia', nombre: 'Furia', condicionAlActivar: 'Furia (Rage)',
      esActivable: true, activo: false, tieneUsosLimitados: true, usosMaximos: 3, usosRestantes: 3, duracionEfectoAlActivar: 10 });
    for (const c of [dm, pj]) c.store.setState(s => ({ personajes: s.personajes.map(p => ({ ...p, rasgos: [structuredClone(furia)] })) }));
    pj.store.getState().alternarActivoRasgo('pj', 'furia'); await avanzar();
    expect(pj.store.getState().personajes[0].rasgos[0]).toMatchObject({ activo: true, usosRestantes: 2 });
    dm.store.getState().agregarCondicionACriatura('mini', 'Derribado');
    dm.store.getState().agregarCondicionACriatura('mini-ac', 'Derribado'); await avanzar();
    expect(pj.store.getState().personajes[0]).toMatchObject({ multiplicadorTerreno: 2 });
    expect(pj.store.getState().personajes[0].acompanantes[0].multiplicadorTerreno).toBe(2);
    const repetido = [...mesa.mensajes].reverse().find(m => m.mensaje.t === 'CONFIRMADO')!.mensaje;
    await pj.motor.recibir(repetido, mesa.miembros[0]); await avanzar();
    expect(pj.store.getState().personajes[0].rasgos[0].usosRestantes).toBe(2);
    dm.store.getState().quitarCondicionDeCriatura('mini', 'Derribado');
    dm.store.getState().quitarCondicionDeCriatura('mini-ac', 'Derribado');
    const efecto = dm.store.getState().colaIniciativa[0].efectos!.find(e => e.nombre.startsWith('Furia'))!;
    dm.store.getState().quitarEfectoDeCriatura('mini', efecto.id); await avanzar();
    expect(pj.store.getState().personajes[0]).toMatchObject({ multiplicadorTerreno: 1 });
    expect(pj.store.getState().personajes[0].rasgos[0]).toMatchObject({ activo: false, usosRestantes: 2 });
    expect(pj.store.getState().personajes[0].acompanantes[0].multiplicadorTerreno).toBe(1);
  });
  it('la concentración de rasgo conserva su origen aunque el GM no tenga su definición', async () => {
    const { dm, pj } = await iniciar();
    pj.store.setState(s => ({ personajes: s.personajes.map(p => ({ ...p,
      concentracionActiva: { idRasgoOrigen: 'rasgo-del-duenio', nombreHechizo: 'Manifestación' },
      efectosActivos: [{ id: 'ef_concentracion', nombre: 'Concentración: Manifestación', concentracion: true }] })) }));
    await avanzar();
    expect(dm.motor.replica.base.mini.grupos.estados.concentracion).toEqual({ origen: 'rasgo', id: 'rasgo-del-duenio', nombre: 'Manifestación' });
    dm.store.getState().avanzarRonda(); await avanzar();
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 23); await avanzar();
    expect(pj.store.getState().personajes[0].concentracionActiva).toEqual({ idRasgoOrigen: 'rasgo-del-duenio', nombreHechizo: 'Manifestación' });
    const efecto = dm.store.getState().colaIniciativa[0].efectos!.find(e => e.concentracion)!;
    dm.store.getState().quitarEfectoDeCriatura('mini', efecto.id); await avanzar();
    expect(pj.store.getState().personajes[0].concentracionActiva).toBeNull();
  });
  it('aceptar lo compartido también emite una decisión que confirma el director', async () => {
    const { dm, pj } = await iniciar(); mesa.demora = () => 300;
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 10); await avanzar();
    const c = pj.store.getState().conexionSyncV4.conflictos[0];
    const inicio = mesa.mensajes.length;
    expect(pj.motor.resolver('mini', 'vitalidad', 'compartido', c.remoto.revisiones.vitalidad)).toBe(true);
    expect(pj.motor.exportarPendientes().mini).toBeDefined();
    await avanzar();
    const decision = mesa.mensajes.slice(inicio).find(m => m.mensaje.t === 'PROPUESTA');
    expect(decision?.mensaje.t === 'PROPUESTA' && decision.mensaje.resolver).toContain('vitalidad');
    expect(pj.motor.exportarPendientes().mini).toBeUndefined();
    expect(pj.store.getState().personajes[0].hpActual).toBe(10);
  });
  it('una decisión que quedó obsoleta exige una comparación nueva', async () => {
    const { dm, pj } = await iniciar(); mesa.demora = () => 300;
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 10); await avanzar();
    const anterior = pj.store.getState().conexionSyncV4.conflictos[0].remoto.revisiones.vitalidad;
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 8); await avanzar();
    expect(pj.motor.resolver('mini', 'vitalidad', 'local', anterior)).toBe(false);
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(8);
    expect(pj.store.getState().personajes[0].hpActual).toBe(19);
  });
  it('recarga conservando un conflicto y no reenvía el delta anterior', async () => {
    const { dm, pj } = await iniciar(); mesa.demora = () => 300;
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 10); await avanzar();
    pj.parar(); pj.motor.destruir(); const inicio = mesa.mensajes.length;
    const nuevo = mesa.agregar('jugador', pj.store.getState()); nuevo.motor.iniciar(); nuevo.motor.observar();
    await avanzar();
    expect(nuevo.store.getState().personajes[0].hpActual).toBe(19);
    expect(nuevo.store.getState().conexionSyncV4.conflictos[0].grupos).toContain('vitalidad');
    expect(mesa.mensajes.slice(inicio).filter(m => m.origen === 'jugador' && m.mensaje.t === 'PROPUESTA')).toEqual([]);
  });
  it('descarta una operación de una apertura retirada aunque conserve la identidad nativa', async () => {
    const { dm, pj } = await iniciar(); const base = pj.motor.replica.base.mini;
    const hola = mesa.mensajes.find(m => m.origen === 'jugador' && m.mensaje.t === 'HOLA')!.mensaje;
    const vieja: Extract<MensajeSyncV4, { t: 'PROPUESTA' }> = { ...hola, t: 'PROPUESTA', operacion: 'retirada',
      entidad: 'mini', bases: base.revisiones, cambios: { vitalidad: { actual: 1, maxima: 30, temporal: 0 } }, resolver: [] };
    pj.parar(); pj.motor.destruir();
    const nuevo = mesa.agregar('jugador', pj.store.getState()); nuevo.motor.iniciar(); nuevo.motor.observar(); await avanzar();
    await dm.motor.recibir(vieja, mesa.miembros[1]);
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(25);
  });
  it('aplica un snapshot completo y después los confirmados recibidos entre sus páginas', async () => {
    const { pj } = await iniciar(); const e = structuredClone(pj.motor.replica.base.mini);
    const revision = Math.max(...mesa.mensajes.map(m => 'revision' in m.mensaje ? m.mensaje.revision : 0)) + 10;
    e.revision = revision; e.grupos.vitalidad.actual = 17;
    const otro = { ...structuredClone(e), id: 'monstruo', fila: 'monstruo', ficha: undefined, monstruo: true };
    const lote = { ...sobreDM(), t: 'LOTE' as const, snapshot: 'captura-atomica', revision, total: 2 };
    await pj.motor.recibir({ ...lote, parte: 1, entidades: [e], meta: { orden: ['mini', 'monstruo'], activo: 'mini', ronda: 3, porcentaje: false } }, mesa.miembros[0]);
    expect(pj.store.getState().personajes[0].hpActual).toBe(25);
    const posterior = structuredClone(e); posterior.revision++; posterior.grupos.vitalidad.actual = 15;
    await pj.motor.recibir({ ...sobreDM(), t: 'CONFIRMADO', revision: revision + 1, operacion: 'posterior', entidad: posterior }, mesa.miembros[0]);
    expect(pj.store.getState().colaIniciativa).toHaveLength(1);
    await pj.motor.recibir({ ...lote, parte: 2, entidades: [otro] }, mesa.miembros[0]);
    expect(pj.store.getState().personajes[0].hpActual).toBe(15);
    expect(pj.store.getState().colaIniciativa).toHaveLength(2);
    expect(pj.store.getState().rondaActual).toBe(3);
  });
  it('un acompañante sin miniatura se autoriza por su PJ y conserva su edición confirmada', async () => {
    const e = prepararMesaSyncV4(false, true); mesa = e.mesa;
    for (const c of mesa.clientes.values()) c.store.setState(s => ({ personajes: s.personajes.map(p => ({ ...p,
      acompanantes: p.acompanantes.map(a => ({ ...a, idMiniaturaTS: null })) })),
      colaIniciativa: s.colaIniciativa.map(f => f.id === 'mini-ac' ? { ...f, id: 'ac' } : f) }));
    await avanzar();
    e.pj.store.getState().modificarVidaAcompanante('pj', 'ac', 6); await avanzar();
    expect(e.dm.motor.replica.base['mini/ac'].duenio).toBe('duenio');
    expect(e.dm.store.getState().personajes[0].acompanantes[0].vidaActual).toBe(6);
  });
  it('la baja del director genera una lápida y un mensaje atrasado no resucita al acompañante', async () => {
    const { dm, pj } = await iniciar(true);
    const vieja = structuredClone(pj.motor.replica.base['mini-ac']);
    dm.store.getState().eliminarAcompanantePersonaje('pj', 'ac'); await avanzar();
    expect(dm.motor.replica.base['mini-ac'].eliminada).toBe(true);
    pj.motor.replica.recibir(vieja);
    expect(pj.motor.replica.base['mini-ac'].eliminada).toBe(true);
    expect(pj.store.getState().personajes[0].acompanantes).toEqual([]);
  });
  it('retirar del combate conserva el acompañante en la ficha', async () => {
    const { dm, pj } = await iniciar(true);
    dm.store.setState(s => ({ colaIniciativa: s.colaIniciativa.filter(c => c.id !== 'mini-ac') })); await avanzar();
    expect(pj.store.getState().colaIniciativa).toHaveLength(1);
    expect(pj.store.getState().personajes[0].acompanantes).toHaveLength(1);
  });
  it('la baja del acompañante activo publica metadatos y conserva una secuencia sin huecos', async () => {
    const { dm, pj } = await iniciar(true);
    dm.store.setState({ indiceTurnoActivo: 1 }); await avanzar();
    const inicio = mesa.mensajes.length;
    const revision = Math.max(...mesa.mensajes.map(m => 'revision' in m.mensaje ? m.mensaje.revision : 0));
    pj.store.getState().eliminarAcompanantePersonaje('pj', 'ac'); await avanzar();
    const cambios = mesa.mensajes.slice(inicio).map(m => m.mensaje).filter(m => m.t === 'CONFIRMADO' || m.t === 'COMBATE');
    expect(cambios.map(m => m.revision).sort((a, b) => a - b)).toEqual([revision + 1, revision + 2, revision + 3]);
    expect(cambios.find(m => m.t === 'COMBATE')).toMatchObject({ meta: { orden: ['mini'], activo: 'mini', ronda: 1 } });
    expect(pj.store.getState().colaIniciativa[pj.store.getState().indiceTurnoActivo].id).toBe('mini');
  });
  it('el dueño puede revisar una baja y restaurar explícitamente su acompañante editado', async () => {
    const { dm, pj } = await iniciar(true); mesa.demora = () => 300;
    pj.store.getState().modificarVidaAcompanante('pj', 'ac', 6);
    dm.store.getState().eliminarAcompanantePersonaje('pj', 'ac'); await avanzar();
    const c = pj.store.getState().conexionSyncV4.conflictos.find(c => c.id === 'mini-ac');
    expect(c?.grupos).toContain('acompanantes');
    expect(pj.motor.resolver('mini-ac', 'acompanantes', 'local', c!.remoto.revisiones.acompanantes)).toBe(true);
    await avanzar();
    expect(dm.motor.replica.base['mini-ac'].eliminada).toBe(false);
    expect(pj.store.getState().personajes[0].acompanantes[0].vidaActual).toBe(6);
    expect(dm.store.getState().personajes[0].acompanantes[0].vidaActual).toBe(6);
  });
  it('una revisión remota que vuelve al valor inicial no reenvía automáticamente una edición incierta', async () => {
    const { dm, pj } = await iniciar();
    pj.store.getState().establecerHPActualPersonaje('pj', 19);
    pj.parar(); pj.motor.destruir();
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 20);
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 25); await avanzar();
    const nuevo = mesa.agregar('jugador', pj.store.getState()); nuevo.motor.iniciar(); nuevo.motor.observar(); await avanzar();
    expect(nuevo.store.getState().personajes[0].hpActual).toBe(19);
    expect(nuevo.store.getState().conexionSyncV4.conflictos[0].grupos).toContain('vitalidad');
    expect(dm.store.getState().colaIniciativa[0].vidaActual).toBe(25);
  });
  it('dos GM requieren acuerdo, conservan el director al incorporar otro GM y permiten relevo explícito', async () => {
    const miembros = [{ id: 'dm', clientMode: 'gm' as const, player: { id: 'master', name: 'Máster' } },
      { id: 'gm2', clientMode: 'gm' as const, player: { id: 'master2', name: 'Segundo GM' } },
      { id: 'jugador', clientMode: 'player' as const, player: { id: 'duenio', name: 'Dueño' } }];
    mesa = new MesaSyncV4(miembros, new Map([['duenio', new Set(['mini'])]]));
    const dm = mesa.agregar('dm', { esGM: true, personajes: [pjSyncV4()], colaIniciativa: [filaSyncV4()] });
    const gm2 = mesa.agregar('gm2', { esGM: true, personajes: [pjSyncV4()], colaIniciativa: [filaSyncV4()] });
    const pj = mesa.agregar('jugador', { esGM: false, personajes: [pjSyncV4()] });
    mesa.iniciar(); await avanzar(); expect(dm.motor.soyDirector).toBe(false);
    await dm.motor.votar('dm'); await gm2.motor.votar('gm2'); await avanzar();
    expect(dm.motor.soyDirector || gm2.motor.soyDirector).toBe(false);
    await gm2.motor.votar('dm'); await avanzar(); expect(dm.motor.soyDirector).toBe(true);
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 15); await avanzar();
    miembros.push({ id: 'gm3', clientMode: 'gm', player: { id: 'master3', name: 'Nuevo GM' } });
    for (const c of mesa.clientes.values()) c.motor.actualizarMiembros(miembros);
    expect(dm.motor.soyDirector).toBe(true);
    miembros.splice(miembros.findIndex(m => m.id === 'gm3'), 1);
    dm.parar(); dm.motor.destruir(); miembros.splice(miembros.findIndex(m => m.id === 'dm'), 1);
    for (const c of [gm2, pj]) c.motor.actualizarMiembros(miembros);
    await avanzar(); expect(gm2.motor.soyDirector).toBe(false);
    await gm2.motor.votar('gm2'); await avanzar();
    expect(gm2.motor.soyDirector).toBe(true);
    expect(pj.store.getState().personajes[0].hpActual).toBe(15);
    gm2.store.getState().modificarVidaCriaturaIniciativa('mini', 12); await avanzar();
    expect(pj.store.getState().personajes[0].hpActual).toBe(12);
  });
  it('un GM recién llegado tras una pérdida también debe confirmar el relevo', async () => {
    const { dm, pj } = await iniciar();
    dm.store.getState().modificarVidaCriaturaIniciativa('mini', 15); await avanzar();
    dm.parar(); dm.motor.destruir(); mesa.miembros.splice(0, 1);
    pj.motor.actualizarMiembros(mesa.miembros);
    mesa.miembros.push({ id: 'nuevo', clientMode: 'gm', player: { id: 'nuevo-master', name: 'Nuevo' } });
    pj.motor.actualizarMiembros(mesa.miembros);
    const nuevo = mesa.agregar('nuevo', { ...pj.store.getState(), esGM: true }); nuevo.motor.iniciar(); nuevo.motor.observar();
    await avanzar(); expect(nuevo.motor.soyDirector).toBe(false);
    expect(pj.store.getState().personajes[0].hpActual).toBe(15);
    await nuevo.motor.votar('nuevo'); await avanzar();
    expect(nuevo.motor.soyDirector).toBe(true);
    expect(pj.store.getState().conexionSyncV4.director).toBe('nuevo');
  });
});
