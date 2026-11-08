/** Siete stores y adaptadores reales. Sólo el backend nativo es simulado. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MesaSyncV4 } from '../src/servicios/sincronizacion/mesaSyncV4.pruebas';
import { pjSyncV4, filaSyncV4 } from '../src/servicios/sincronizacion/fixturesSyncV4.pruebas';
import type { PersonajeJugador } from '../src/tipos/personaje';
import type { CriaturaIniciativa } from '../src/almacen/usarAlmacenDM';
import { EsquemaAcompanantePersonaje } from '../src/tipos/personaje';

const uuid = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let mesa: MesaSyncV4;
let personajes: PersonajeJugador[];
const avanzar = (ms: number) => vi.advanceTimersByTimeAsync(ms);
function iguales() {
  const dm = mesa.clientes.get(uuid(1))!.store.getState();
  return [...mesa.clientes.values()].every(c => {
    const s = c.store.getState();
    const proyectar = (cola: CriaturaIniciativa[]) => cola.map(x => [x.id, x.nombre, x.iniciativa, x.ca,
      x.vidaActual, x.vidaMaxima, x.vidaTemporal, x.condiciones, x.efectos, x.pasivas]);
    return JSON.stringify(proyectar(s.colaIniciativa)) === JSON.stringify(proyectar(dm.colaIniciativa))
      && s.rondaActual === dm.rondaActual && s.indiceTurnoActivo === dm.indiceTurnoActivo;
  });
}
async function iniciar() {
  mesa.iniciar(); await avanzar(600000);
  // La primera incorporación no tiene base compartida: el dueño revisa las diferencias iniciales de iniciativa.
  for (const c of mesa.clientes.values()) for (const conflicto of c.store.getState().conexionSyncV4.conflictos) {
    for (const grupo of conflicto.grupos) c.motor.resolver(conflicto.id, grupo, 'compartido', conflicto.remoto.revisiones[grupo]);
  }
  await avanzar(600000);
  expect(iguales(), 'Los siete clientes deben completar su incorporación').toBe(true);
  expect(mesa.paquetes.every(p => p.texto.length <= 400)).toBe(true);
  expect([...mesa.clientes.values()].every(c => c.store.getState().conexionSyncV4.pendientes === 0)).toBe(true);
}
async function esperarConvergencia() {
  // Una recuperación fría envía seis capturas completas por el mismo canal de 180 ms.
  for (let espera = 0; espera < 600000 && !iguales(); espera += 5000) await avanzar(5000);
  expect(iguales(), 'La mesa debe converger dentro del presupuesto de recuperación').toBe(true);
}
describe('Simulación v4: seis PJ, veinte monstruos y un acompañante', () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.stubGlobal('BroadcastChannel', undefined);
    personajes = Array.from({ length: 6 }, (_, i) => ({ ...pjSyncV4(), id: uuid(100 + i),
      campaniaTaleSpire: { id: uuid(500), nombre: 'Campaña de simulación' },
      nombre: `Aventurero ${i + 1}`, idMiniaturaTS: uuid(200 + i) }));
    personajes[0].acompanantes = [EsquemaAcompanantePersonaje.parse({ id: uuid(400), idMiniaturaTS: uuid(401),
      nombre: 'Familiar', idPlantilla: 'familiar', vidaActual: 8, vidaMaxima: 12 })];
    const miembros = [{ id: uuid(1), clientMode: 'gm' as const, player: { id: uuid(2), name: 'Director' } },
      ...personajes.map((p, i) => ({ id: uuid(10 + i), clientMode: 'player' as const, player: { id: p.id, name: p.nombre } }))];
    mesa = new MesaSyncV4(miembros, new Map(personajes.map(p => [p.id, new Set([p.idMiniaturaTS!, ...p.acompanantes.map(a => a.idMiniaturaTS!)])])),
      { campania: uuid(500), tablero: uuid(501) });
    const cola: CriaturaIniciativa[] = personajes.map(p => ({ ...filaSyncV4(), id: p.idMiniaturaTS!, idPersonajeDuenio: p.id, nombre: p.nombre }));
    cola.push(...Array.from({ length: 20 }, (_, i) => ({ ...filaSyncV4(), id: `c_local_monstruo_${i}`,
      nombre: `Monstruo ${i + 1}`, esMonstruo: true, idPersonajeDuenio: undefined, vidaActual: 40, vidaMaxima: 40, vidaTemporal: 0 })));
    cola.push({ ...filaSyncV4(), id: uuid(401), nombre: 'Familiar', idPersonajeDuenio: personajes[0].id,
      idAcompanante: uuid(400), esAcompanante: true, vidaActual: 8, vidaMaxima: 12, vidaTemporal: 0 });
    mesa.agregar(uuid(1), { esGM: true, personajes: structuredClone(personajes), colaIniciativa: structuredClone(cola) }, true);
    for (const [i, p] of personajes.entries()) mesa.agregar(uuid(10 + i), { esGM: false, personajes: [structuredClone(p)], colaIniciativa: [] }, true);
    let secuencia = 0;
    mesa.demora = () => 60 + (++secuencia * 73 % 200);
    let entregas = 0;
    mesa.copias = () => ++entregas % 17 === 0 ? 2 : 1;
  });
  afterEach(() => { mesa.destruir(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('converge durante diez rondas y 260 turnos con daño, curación y estados', async () => {
    await iniciar(); const dm = mesa.clientes.get(uuid(1))!;
    for (let i = 0; i < 260; i++) {
      dm.store.setState({ indiceTurnoActivo: i % 27, rondaActual: 1 + Math.floor(i / 27) });
      const mon = `c_local_monstruo_${i % 20}`;
      dm.store.getState().modificarVidaCriaturaIniciativa(mon, 20 + i % 20);
      if (i % 26 === 0) {
        dm.store.getState().agregarCondicionACriatura(personajes[0].idMiniaturaTS!, 'Envenenado');
      } else if (i % 26 === 1) dm.store.getState().quitarCondicionDeCriatura(personajes[0].idMiniaturaTS!, 'Envenenado');
      await avanzar(20000);
      expect(iguales(), `Divergencia en el turno ${i}`).toBe(true);
    }
    expect(mesa.errores).toEqual([]);
  }, 120000);

  it('confirma seis ediciones simultáneas y recupera rateLimited', async () => {
    await iniciar(); let rechazos = 0;
    mesa.rechazar = () => rechazos++ < 3 ? 'rateLimited' : undefined;
    for (let i = 0; i < 6; i++) mesa.clientes.get(uuid(10 + i))!.store.getState().establecerHPActualPersonaje(personajes[i].id, 19);
    await avanzar(180000);
    expect(iguales()).toBe(true);
    expect(mesa.clientes.get(uuid(1))!.store.getState().colaIniciativa.slice(0, 6).every(c => c.vidaActual === 19)).toBe(true);
  });

  it('recupera el último confirmado perdido mediante el latido', async () => {
    await iniciar(); let descartado = false;
    mesa.descartar = p => !descartado && p.origen === uuid(1) && ['FRAG', 'F'].includes(JSON.parse(p.texto).t) ? (descartado = true) : false;
    mesa.clientes.get(uuid(1))!.store.getState().dañarCriaturaIniciativa(personajes[0].idMiniaturaTS!, 8);
    await esperarConvergencia();
    expect(descartado).toBe(true); expect(iguales()).toBe(true);
  });

  it('reconecta conservando la base y recibe cambios de combate posteriores', async () => {
    await iniciar(); const id = uuid(15); const viejo = mesa.clientes.get(id)!;
    viejo.parar(); viejo.motor.destruir();
    const dm = mesa.clientes.get(uuid(1))!;
    dm.store.setState({ rondaActual: 5, indiceTurnoActivo: 20 });
    await avanzar(30000);
    const nuevo = mesa.agregar(id, viejo.store.getState(), true); nuevo.motor.iniciar(); nuevo.motor.observar();
    await avanzar(180000);
    expect(nuevo.store.getState().rondaActual).toBe(5); expect(iguales()).toBe(true);
  });

  it('propaga altas, retiradas y vida del acompañante sin modificar al PJ', async () => {
    await iniciar(); const dm = mesa.clientes.get(uuid(1))!;
    dm.store.getState().agregarEfectoACriatura(uuid(401), 'Bendición', 3);
    dm.store.getState().dañarCriaturaIniciativa(uuid(401), 2);
    await avanzar(90000);
    const ficha = mesa.clientes.get(uuid(10))!.store.getState().personajes[0];
    expect(ficha.acompanantes[0].vidaActual).toBe(6); expect(ficha.hpActual).toBe(25);
    expect(ficha.acompanantes[0].efectos[0].nombre).toBe('Bendición');
    expect(iguales()).toBe(true);
  });
});
