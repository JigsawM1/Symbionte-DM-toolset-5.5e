/** Simulación reproducible: motor, stores y adaptadores reales; solo la red es artificial. */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { PersonajeJugador } from '../src/tipos/personaje';
import type { CriaturaIniciativa } from '../src/almacen/usarAlmacenDM';
import type { WireMensajeSync } from '../src/tipos/sync';

type Store = typeof import('../src/almacen/usarAlmacenDM').usarAlmacenDM;
type Motor = typeof import('../src/servicios/sincronizacionSimbiote');
type Adaptador = typeof import('../src/utiles/TaleSpireAdapter').ts;
interface Cliente { id: string; store: Store; motor: Motor; adaptador: Adaptador; detener: () => void; conectado: boolean }
interface Paquete { origen: string; texto: string; datos: WireMensajeSync; hora: number }
interface Resultado { escenario: string; correcto: boolean; detalle: string; segundos: number; envios: number; entregas: number; duplicados: number; perdidos: number; rateLimited: number; purgados: number; maxCaracteres: number; maxChunk: number; advertencias: string[] }
const resultados: Resultado[] = [];
let clientes: Cliente[] = [];
let historial: Paquete[] = [];
let avisos: string[] = [];
let inicio = 0;
let nombre = '';
let comprobado = false;
let detalle = '';
let entregas = 0;
let duplicados = 0;
let perdidos = 0;
let rateLimited = 0;
let purgados = 0;
let maxCaracteres = 0;
let maxChunk = 0;
let secuencia = 0;
let conLimite = false;
let descartar: (paquete: Paquete, destino: Cliente) => boolean = () => false;
let personajes: PersonajeJugador[] = [];
let criaturas: CriaturaIniciativa[] = [];

const dm = () => clientes[0];
const jugadores = () => clientes.slice(1);
const avanzar = (ms: number) => vi.advanceTimersByTimeAsync(ms);
function resumenCola(cola: CriaturaIniciativa[]) {
  return cola.map(c => ({ id: c.id, hp: c.vidaActual, max: c.vidaMaxima, temporal: c.vidaTemporal ?? 0,
    iniciativa: c.iniciativa, condiciones: c.condiciones, efectos: (c.efectos ?? []).map(e => ({ id: e.id, nombre: e.nombre, ronda: e.expiraRonda })) }));
}
function convergen() {
  const maestro = dm().store.getState();
  return jugadores().filter(c => c.conectado).every(c => {
    const e = c.store.getState();
    return JSON.stringify(resumenCola(e.colaIniciativa)) === JSON.stringify(resumenCola(maestro.colaIniciativa))
      && e.rondaActual === maestro.rondaActual && e.indiceTurnoActivo === maestro.indiceTurnoActivo
      && e.mostrarPorcentajeVidaAJugadores === maestro.mostrarPorcentajeVidaAJugadores;
  });
}
function entregar(paquete: Paquete, destino: Cliente) {
  if (!destino.conectado) return;
  entregas++;
  destino.motor.procesarMensajeSyncEntrante({ datos: JSON.parse(paquete.texto), strCrudo: paquete.texto });
}
async function enviarNativo(origen: string, texto: string, target: string) {
  expect(target).toBe('board');
  expect(texto.length).toBeLessThanOrEqual(500);
  const paquete: Paquete = { origen, texto, datos: JSON.parse(texto), hora: Date.now() };
  secuencia++;
  if (conLimite && secuencia % 13 === 0) {
    rateLimited++;
    throw new Error('rateLimited');
  }
  historial.push(paquete);
  for (const [i, destino] of clientes.entries()) {
    if (destino.id === origen || !destino.conectado) continue;
    if (descartar(paquete, destino)) { perdidos++; continue; }
    // Latencia determinista de 60 a 260 ms, con reordenación y duplicados de eventos.
    const demora = 60 + ((secuencia * 73 + i * 41) % 201);
    setTimeout(() => entregar(paquete, destino), demora);
    if ((secuencia + i) % 9 === 0) {
      duplicados++;
      setTimeout(() => entregar(paquete, destino), demora + 15);
    }
  }
}
function concluir(correcto: boolean, explicacion: string) {
  correcto = correcto && maxCaracteres <= 380;
  comprobado = correcto;
  detalle = explicacion;
  expect(correcto, explicacion).toBe(true);
}
async function iniciarMesa() {
  for (const j of jugadores()) j.motor.solicitarEstadoInicial();
  await avanzar(10000);
  expect(convergen(), 'Los seis jugadores deben recibir los 26 combatientes iniciales').toBe(true);
}

describe('Simulación realista de sync: 6 PJ, 20 monstruos, 7 clientes aislados', () => {
  beforeEach(async contexto => {
    nombre = contexto.task.name;
    comprobado = false; detalle = 'Escenario interrumpido antes de la comprobación final';
    clientes = []; historial = []; avisos = []; secuencia = 0;
    entregas = duplicados = perdidos = rateLimited = purgados = maxCaracteres = maxChunk = 0;
    conLimite = false; descartar = () => false;
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-10-07T20:00:00Z'));
    vi.stubGlobal('BroadcastChannel', undefined);
    inicio = Date.now();
    for (let i = 0; i < 7; i++) {
      vi.resetModules();
      const { logger } = await import('../src/utiles/logger');
      vi.spyOn(logger, 'debug').mockImplementation(() => {});
      vi.spyOn(logger, 'info').mockImplementation(() => {});
      vi.spyOn(logger, 'warn').mockImplementation((...args: unknown[]) => { avisos.push(String(args[0])); });
      vi.spyOn(logger, 'error').mockImplementation((...args: unknown[]) => { avisos.push(String(args[0])); });
      const { usarAlmacenDM: store } = await import('../src/almacen/usarAlmacenDM');
      const motor = await import('../src/servicios/sincronizacionSimbiote');
      const { ts: adaptador } = await import('../src/utiles/TaleSpireAdapter');
      const { PERSONAJE_POR_DEFECTO } = await import('../src/constantes');
      if (i === 0) {
        const nombres = ['Álvaro el guerrero', 'Érika la clériga', 'Íñigo el pícaro', 'Óscar el mago', 'Úrsula la druida', 'Nicolás el bardo'];
        personajes = nombres.map((n, idx) => ({ ...structuredClone(PERSONAJE_POR_DEFECTO),
          id: `a0000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`,
          idMiniaturaTS: `b0000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`,
          nombre: n, hpActual: 60 + idx * 4, hpMaximo: 60 + idx * 4, hpTemporal: idx % 2 ? 5 : 0,
          iniciativaBono: idx, condicionesActivas: [], efectosActivos: [], acompanantes: [] }));
        criaturas = personajes.map((p, idx) => ({ id: p.idMiniaturaTS!, idPersonajeDuenio: p.id,
          nombre: p.nombre, iniciativa: 24 - idx, vidaActual: p.hpActual, vidaMaxima: p.hpMaximo,
          vidaTemporal: p.hpTemporal, ca: 10, esMonstruo: false, condiciones: [], efectos: [], bonificadorIniciativa: idx, velocidad: '30 pies' }));
        criaturas.push(...Array.from({ length: 20 }, (_, idx) => ({
          id: `c0000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`,
          nombre: `${['Trasgo', 'Orco', 'Esqueleto', 'Lobo'][idx % 4]} ${idx + 1}`,
          iniciativa: 18 - idx, vidaActual: 40 + idx * 3, vidaMaxima: 40 + idx * 3,
          vidaTemporal: 0, ca: 13 + idx % 4, esMonstruo: true, condiciones: [], efectos: [], bonificadorIniciativa: 2, velocidad: '30 pies' })));
      }
      const id = i === 0 ? 'DM' : personajes[i - 1].id;
      // Se sustituye exclusivamente la referencia a la API nativa; la cola, purga y reintentos son reales.
      Object.defineProperty(adaptador, 'tsGlobal', { configurable: true, get: () => ({ sync: { send: (texto: string, target: string) => enviarNativo(id, texto, target) } }) });
      const send = adaptador.sync.send;
      vi.spyOn(adaptador.sync, 'send').mockImplementation((texto, target) => {
        maxCaracteres = Math.max(maxCaracteres, texto.length);
        if (JSON.parse(texto).t === 'FRAG') maxChunk = Math.max(maxChunk, texto.length);
        return send(texto, target);
      });
      const purgar = adaptador.sync.purgarColaSync;
      vi.spyOn(adaptador.sync, 'purgarColaSync').mockImplementation(filtro => {
        const cantidad = purgar(filtro); purgados += cantidad; return cantidad;
      });
      store.setState({ esGM: i === 0, personajes: structuredClone(i === 0 ? personajes : [personajes[i - 1]]),
        idPersonajeActivo: i === 0 ? null : personajes[i - 1].id, colaIniciativa: i === 0 ? structuredClone(criaturas) : [],
        indiceTurnoActivo: 0, rondaActual: 1, mostrarPorcentajeVidaAJugadores: true,
        metodoVidaMonstruo: 'maximo', aplicandoSync: false, timestampsModificacionLocal: {} });
      clientes.push({ id, store, motor, adaptador, detener: motor.inicializarObservadoresStoreSync(), conectado: true });
    }
    expect(new Set(clientes.map(c => c.store)).size).toBe(7);
    expect(new Set(clientes.map(c => c.adaptador)).size).toBe(7);
  }, 60000);

  afterEach(async () => {
    resultados.push({ escenario: nombre, correcto: comprobado, detalle, segundos: (Date.now() - inicio) / 1000,
      envios: historial.length, entregas, duplicados, perdidos, rateLimited, purgados, maxCaracteres, maxChunk,
      advertencias: [...new Set(avisos)].slice(0, 12) });
    for (const c of clientes) { c.detener(); c.conectado = false; c.adaptador.sync.purgarColaSync(); }
    await avanzar(4000);
    vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  });

  afterAll(() => {
    mkdirSync('scratch', { recursive: true });
    writeFileSync('scratch/simulacion-sync-6pj-20monstruos.json', JSON.stringify({
      alcance: '7 instancias de módulos aisladas. Motor, Zustand, serialización, debounce, cola, ACK y reintentos reales. Red nativa simulada; BroadcastChannel deshabilitado. Sin tocar TaleSpire.',
      latenciaMs: [60, 260], combatientes: 26, jugadores: 6, monstruos: 20, resultados }, null, 2));
    const filas = resultados.map(r => `| ${r.escenario} | ${r.correcto ? 'Pasa' : 'Falla'} | ${r.detalle} |`).join('\n');
    const normal = resultados[0];
    const fallidos = resultados.filter(r => !r.correcto);
    const fecha = new Date().toLocaleDateString('es-VE', { timeZone: 'America/Caracas' });
    writeFileSync('scratch/informe-simulacion-sync.md', `# Simulación de sincronización: 6 PJ y 20 monstruos

Fecha de ejecución: ${fecha}.

**Resultado: ${resultados.length - fallidos.length}/${resultados.length} escenarios aprobados.**

## Alcance

Siete instancias aisladas: un DM y seis jugadores con stores, adaptadores, motores y temporizadores propios. Se ejecutan las implementaciones reales de producción. Solo la API de red es artificial; BroadcastChannel está deshabilitado. Esta simulación no modifica el tablero de TaleSpire.

La red introduce 60–260 ms de latencia, reordenación y duplicados. Los escenarios adversos añaden pérdidas y errores rateLimited. Se comprueban 10 rondas y 260 turnos, esperando 6,5 segundos después de cada cambio de turno. La prueba demuestra convergencia al terminar cada paso, no igualdad instantánea durante el tránsito, ni rendimiento gráfico de CEF, ni el transporte real de TaleSpire.

## Resultados

| Escenario | Resultado | Evidencia |
| --- | --- | --- |
${filas}

Combate normal: ${normal.segundos} segundos de reloj simulado, ${normal.envios} envíos, ${normal.entregas} entregas y ${normal.duplicados} duplicados. Máximo de ${normal.maxCaracteres} unidades UTF-16 por paquete (objetivo 380; límite nativo 500).

${fallidos.length ? 'Escenarios pendientes: ' + fallidos.map(r => r.escenario).join('; ') : 'Todos los escenarios satisfacen las comprobaciones de sincronización.'}

## Reproducción

Ejecutar desde la raíz: pnpm run test:sync-simulacion.

El proceso devuelve código 0 si todas las comprobaciones pasan, o 1 si alguna falla. El informe y los datos JSON se regeneran en scratch. La prueba se ejecuta también en CI; las regresiones unitarias están en la suite habitual.
`);
    console.log(JSON.stringify(resultados.map(({ escenario, correcto, detalle, envios, maxCaracteres }) => ({ escenario, correcto, detalle, envios, maxCaracteres })), null, 2));
  });

  it('Combate normal: 10 rondas, 260 turnos, daño, curación, condiciones y efectos', async () => {
    await iniciarMesa();
    let turnosConvergentes = 0;
    for (let paso = 0; paso < 260; paso++) {
      const indice = paso % 26;
      const ronda = Math.floor(paso / 26) + 1;
      if (indice < 6) {
        const j = jugadores()[indice];
        const pj = j.store.getState().personajes[0];
        j.store.getState().establecerHPActualPersonaje(pj.id, Math.max(1, Math.min(pj.hpMaximo, pj.hpActual + (ronda % 3 === 0 ? 8 : -3))));
        j.store.setState({ personajes: j.store.getState().personajes.map(p => ({ ...p,
          condicionesActivas: ronda % 2 ? ['envenenado'] : [],
          efectosActivos: ronda % 3 ? [{ id: `ef-${indice}`, nombre: 'Bendición', expiraRonda: ronda + 2 }] : [],
          hpTemporal: ronda % 2 ? 5 : 0 })) });
        await avanzar(1000);
      }
      const e = dm().store.getState();
      dm().store.setState({ indiceTurnoActivo: indice, rondaActual: ronda,
        mostrarPorcentajeVidaAJugadores: ronda % 2 === 1,
        colaIniciativa: e.colaIniciativa.map((c, pos) => pos === 6 + paso % 20 ? { ...c,
          vidaActual: Math.max(0, c.vidaActual - 2), condiciones: ronda % 2 ? ['derribado'] : [],
          efectos: ronda % 3 ? [{ id: `em-${pos}`, nombre: 'Marca del cazador', expiraRonda: ronda + 1 }] : [] } : c) });
      await avanzar(6500);
      if (convergen()) turnosConvergentes++;
    }
    const fichasCorrectas = jugadores().every(j => {
      const pj = j.store.getState().personajes[0];
      return dm().store.getState().personajes.find(p => p.id === pj.id)?.hpActual === pj.hpActual;
    });
    concluir(turnosConvergentes === 260 && fichasCorrectas && maxCaracteres <= 380,
      `${turnosConvergentes}/260 turnos convergentes; fichas PJ coherentes=${fichasCorrectas}; tamaño máximo=${maxCaracteres} caracteres`);
  }, 120000);

  it('Seis jugadores actualizan a la vez con rateLimited y eventos duplicados', async () => {
    await iniciarMesa(); conLimite = true;
    for (const j of jugadores()) j.store.getState().establecerHPActualPersonaje(j.id, 31);
    await avanzar(20000);
    const hpCorrecto = jugadores().every(j => j.store.getState().personajes[0].hpActual === 31)
      && dm().store.getState().personajes.every(p => p.hpActual === 31);
    concluir(convergen() && hpCorrecto && rateLimited > 0,
      `HP=31 en las seis fichas y en el DM=${hpCorrecto}; errores rateLimited recuperados=${rateLimited}; convergencia=${convergen()}`);
  });

  it('Ráfaga de 40 cambios rápidos del DM y estabilización del estado final', async () => {
    await iniciarMesa();
    for (let paso = 1; paso <= 40; paso++) {
      dm().store.setState({ indiceTurnoActivo: paso % 26, rondaActual: 1 + Math.floor(paso / 26) });
      await avanzar(500);
    }
    await avanzar(10000);
    concluir(convergen() && jugadores().every(j => j.store.getState().indiceTurnoActivo === 14),
      `Convergencia final=${convergen()}; mensajes obsoletos purgados=${purgados}`);
  });

  it('Un jugador se desconecta y vuelve después de varios cambios', async () => {
    await iniciarMesa();
    const j = jugadores()[5]; j.conectado = false;
    dm().store.setState({ rondaActual: 5, indiceTurnoActivo: 19 });
    await avanzar(9000);
    expect(j.store.getState().rondaActual).toBe(1);
    j.conectado = true; j.motor.solicitarEstadoInicial();
    await avanzar(10000);
    concluir(convergen() && j.store.getState().rondaActual === 5,
      `El jugador reconectado recibe los 26 combatientes, ronda 5 y turno 19; convergencia=${convergen()}`);
  });

  it('Pérdida de un único fragmento durante la entrada inicial del jugador', async () => {
    const j = jugadores()[0]; let descartado = false;
    descartar = (p, destino) => {
      if (!descartado && destino === j && p.datos.t === 'FRAG' && p.datos.k === 'DM' && p.datos.chunk === 2) { descartado = true; return true; }
      return false;
    };
    j.motor.solicitarEstadoInicial();
    await avanzar(20000);
    const req = historial.filter(p => p.origen === j.id && p.datos.t === 'REQ').length;
    concluir(j.store.getState().colaIniciativa.length === 26,
      `Un fragmento perdido; combatientes recibidos=${j.store.getState().colaIniciativa.length}/26; solicitudes REQ=${req} en 20 s`);
  });

  it('Una transmisión antigua completa llega después de un estado más nuevo', async () => {
    await iniciarMesa();
    const antiguos = historial.filter(p => p.origen === 'DM' && p.datos.t === 'FRAG' && p.datos.k === 'DM');
    dm().store.setState({ rondaActual: 9, indiceTurnoActivo: 23 });
    await avanzar(10000);
    expect(convergen()).toBe(true);
    const j = jugadores()[0];
    for (const p of antiguos) entregar(p, j);
    await avanzar(10);
    concluir(j.store.getState().rondaActual === 9 && j.store.getState().indiceTurnoActivo === 23,
      `Tras recibir snapshot antiguo: ronda=${j.store.getState().rondaActual} (esperada 9), turno=${j.store.getState().indiceTurnoActivo} (esperado 23)`);
  });

  it('PJ con ocho efectos activos y concentración: respeta el límite del canal', async () => {
    await iniciarMesa();
    const j = jugadores()[3];
    j.store.setState({ personajes: j.store.getState().personajes.map(p => ({ ...p, hpActual: 27,
      efectosActivos: Array.from({ length: 8 }, (_, i) => ({
        id: `d0000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
        nombre: ['Bendición', 'Escudo de fe', 'Ayuda', 'Heroísmo'][i % 4], expiraRonda: 6, concentracion: false })),
      concentracionActiva: { hechizoId: 'e0000000-0000-4000-8000-000000000001', nombreHechizo: 'Escudo de fe' } })) });
    await avanzar(20000);
    const rechazos = avisos.filter(a => a.includes('excede el límite máximo')).length;
    const pjDM = dm().store.getState().personajes[3];
    const integro = pjDM.hpActual === 27 && pjDM.efectosActivos.length === 8
      && pjDM.concentracionActiva?.nombreHechizo === 'Escudo de fe' && convergen();
    concluir(maxCaracteres <= 380 && integro,
      `Paquete máximo=${maxCaracteres} caracteres (límite 500); rechazos por tamaño=${rechazos}; HP del DM=${dm().store.getState().personajes[3].hpActual} (esperado 27)`);
  });

  it('Se pierde la primera actualización PJ y el reintento ACK la recupera', async () => {
    await iniciarMesa();
    const j = jugadores()[1]; let descartado = false;
    descartar = (p, destino) => {
      if (!descartado && p.origen === j.id && p.datos.t === 'PJ' && destino === dm()) { descartado = true; return true; }
      return false;
    };
    j.store.getState().establecerHPActualPersonaje(j.id, 29);
    await avanzar(15000);
    const intentos = historial.filter(p => p.origen === j.id && p.datos.t === 'PJ').length;
    concluir(descartado && convergen() && dm().store.getState().personajes[1].hpActual === 29,
      `Primera actualización PJ perdida; envíos PJ=${intentos}; HP recuperado=${dm().store.getState().personajes[1].hpActual}; convergencia=${convergen()}`);
  });

  it('Ausencia persistente de ACK: respeta el máximo de dos reintentos', async () => {
    await iniciarMesa();
    const j = jugadores()[2];
    descartar = (p, destino) => p.datos.t === 'ACK' && destino === j;
    j.store.getState().establecerHPActualPersonaje(j.id, 23);
    await avanzar(20000);
    const intentos = historial.filter(p => p.origen === j.id && p.datos.t === 'PJ').length;
    concluir(intentos <= 3 && dm().store.getState().personajes[2].hpActual === 23,
      `Sin ACK durante 20 s: envíos PJ=${intentos} (máximo esperado 3: original + 2 reintentos); HP del DM=${dm().store.getState().personajes[2].hpActual}`);
  });
});
