import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

const ejecutable = [process.env.CHROME_PATH, process.env.CHROME_BIN,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(ruta => ruta && existsSync(ruta));
assert(ejecutable, 'Configura CHROME_PATH con un navegador Chromium.');

const html = `<!doctype html><html lang="es"><body><div id="prueba"></div><script type="module">
const timers = new Set();
const intervalos = new Set();
const timeoutOriginal = window.setTimeout.bind(window);
const cancelarTimeout = window.clearTimeout.bind(window);
window.setTimeout = (fn, ms, ...args) => {
  let id; id = timeoutOriginal(() => { timers.delete(id); fn(...args); }, ms);
  timers.add(id); return id;
};
window.clearTimeout = id => { timers.delete(id); cancelarTimeout(id); };
const intervaloOriginal = window.setInterval.bind(window);
const cancelarIntervalo = window.clearInterval.bind(window);
window.setInterval = (...args) => { const id = intervaloOriginal(...args); intervalos.add(id); return id; };
window.clearInterval = id => { intervalos.delete(id); cancelarIntervalo(id); };
const listeners = [];
const agregar = EventTarget.prototype.addEventListener;
const quitar = EventTarget.prototype.removeEventListener;
const captura = opciones => typeof opciones === 'boolean' ? opciones : !!opciones?.capture;
EventTarget.prototype.addEventListener = function(tipo, fn, opciones) {
  if ((this === window || this === document) && !listeners.some(r => r.target === this && r.tipo === tipo && r.fn === fn && r.capture === captura(opciones))) {
    listeners.push({ target: this, tipo, fn, capture: captura(opciones) });
  }
  return agregar.call(this, tipo, fn, opciones);
};
EventTarget.prototype.removeEventListener = function(tipo, fn, opciones) {
  const indice = listeners.findIndex(r => r.target === this && r.tipo === tipo && r.fn === fn && r.capture === captura(opciones));
  if (indice >= 0) listeners.splice(indice, 1);
  return quitar.call(this, tipo, fn, opciones);
};
let suscripciones = 0;
const fuente = { subscribe: () => { suscripciones++; let activa = true; return { unsubscribe() { if (activa) { activa = false; suscripciones--; } } }; } };
const cliente = { id: 'dm-prueba', player: { id: 'master', name: 'Master' }, clientMode: 'gm' };
window.TS = {
  clients: { whoAmI: async () => cliente, getMoreInfo: async () => [cliente], onClientEvent: fuente },
  players: { whoAmI: async () => cliente.player, getMoreInfo: async () => [{ ...cliente.player, rights: { canGm: true } }] },
  creatures: { getSelectedCreatures: async () => [], getMoreInfo: async () => [], getCreaturesOwnedByPlayer: async () => [], onCreatureStateChange: fuente, onCreatureSelectionChange: fuente },
  initiative: { getQueue: async () => ({ queue: [], currentTurn: 0 }), onInitiativeEvent: fuente },
  campaigns: { getMoreInfoAboutCurrentCampaign: async () => ({ id: 'campaña-prueba', name: 'Prueba' }) },
  localStorage: { global: { getBlob: async () => '{}', setBlob: async () => {} } },
  sync: { send: async () => {}, onSyncMessage: fuente },
  symbiote: { onStateChangeEvent: fuente },
};
const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { flushSync } = await import('react-dom');
const { NotasDM } = await import('/src/componentes/caracteristicas/notas/NotasDM.tsx');
const { usarConexionTaleSpire } = await import('/src/hooks/usarConexionTaleSpire.ts');
const { usarAlmacenDM } = await import('/src/almacen/usarAlmacenDM.ts');
const { usarLanzadorConjuros } = await import('/src/hooks/usarLanzadorConjuros.ts');
let renders = 0;
function Control() { usarLanzadorConjuros({}); renders++; return null; }
function Escenario() { usarConexionTaleSpire(); return React.createElement(NotasDM); }
const host = document.getElementById('prueba');
window.ciclo = async () => {
  const root = createRoot(host);
  flushSync(() => root.render(React.createElement(Escenario)));
  await new Promise(requestAnimationFrame);
  const textarea = host.querySelector('textarea');
  const texto = 'Nota conservada al desmontar';
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, texto);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(requestAnimationFrame);
  flushSync(() => root.unmount());
  return usarAlmacenDM.getState().notasDM === texto;
};
window.contadores = () => ({ timers: timers.size, intervalos: intervalos.size, listeners: listeners.length, suscripciones });
window.probarSuscripcion = async () => {
  const root = createRoot(host); flushSync(() => root.render(React.createElement(Control)));
  const antes = renders;
  usarAlmacenDM.getState().agregarNotificacion('Prueba de suscripción', 'info');
  await new Promise(requestAnimationFrame);
  const despues = renders; flushSync(() => root.unmount());
  return { antes, despues };
};

window.probarLlamadas = async () => {
  const { autoResolverMiniaturasJugador } = await import('/src/servicios/resolutorMiniaturasJugador.ts');
  const { PERSONAJE_POR_DEFECTO } = await import('/src/constantes/personajeConstantes.ts');
  const resultados = [];
  for (const cantidad of [1, 10, 50]) {
    const llamadas = { propias: 0, informacion: 0 }; let vinculadas = 0;
    const minis = Array.from({ length: cantidad }, (_, i) => ({ id: 'mini-' + i, name: 'Personaje ' + i, position: { x: i, y: 0, z: 0 }, boardId: 'board-prueba' }));
    window.TS.creatures.getCreaturesOwnedByPlayer = async () => { llamadas.propias++; return minis.map(m => ({ id: m.id })); };
    window.TS.creatures.getMoreInfo = async ids => { llamadas.informacion++; return minis.filter(m => ids.includes(m.id)); };
    const personajes = minis.map((m, i) => ({ ...PERSONAJE_POR_DEFECTO, id: 'pj-' + i, nombre: m.name, idMiniaturaTS: null }));
    await autoResolverMiniaturasJugador(personajes, () => { vinculadas++; });
    resultados.push({ cantidad, vinculadas, ...llamadas });
  }
  return resultados;
};
window.probarPersistencia = async () => {
  const { construirBlobPersistencia } = await import('/src/almacen/persistencia.ts');
  const { deshidratarPersonaje } = await import('/src/servicios/serializadorPersonaje.ts');
  const { PERSONAJE_POR_DEFECTO } = await import('/src/constantes/personajeConstantes.ts');
  const personajes = Array.from({ length: 6 }, (_, i) => ({ ...PERSONAJE_POR_DEFECTO, id: 'medicion-' + i,
    rasgos: Array.from({ length: 30 }, (_, r) => ({ id: 'rasgo-' + r, nombre: 'Rasgo', origen: 'clase', personalizado: false, selectores: [] })) }));
  const estado = { personajes, colaIniciativa: [], listaPendientes: [], notasDM: 'Prueba' };
  const base = construirBlobPersistencia(estado);
  const anterior = () => JSON.stringify({ ...base, personajes: personajes.map(deshidratarPersonaje) });
  const actual = () => JSON.stringify(construirBlobPersistencia(estado));
  for (let i = 0; i < 50; i++) { anterior(); actual(); }
  const medir = fn => { const inicio = performance.now(); for (let i = 0; i < 1000; i++) fn(); return performance.now() - inicio; };
  return { iteraciones: 1000, fichas: 6, rasgosPorFicha: 30, anteriorMs: medir(anterior), actualMs: medir(actual), jsonIdentico: anterior() === actual() };
};
window.listo = true;
</script></body></html>`;

const servidor = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error', plugins: [{
  name: 'prueba-ciclo-vida', configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== '/__ciclo-vida') return next();
      try { res.setHeader('Content-Type', 'text/html'); res.end(await server.transformIndexHtml(req.url, html)); }
      catch (error) { next(error); }
    });
  },
}] });
let navegador;
try {
  await servidor.listen();
  const direccion = servidor.httpServer.address(); assert(direccion && typeof direccion === 'object');
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  const pagina = await navegador.newPage();
  const errores = []; pagina.on('pageerror', error => errores.push(error.message));
  await pagina.goto(`http://127.0.0.1:${direccion.port}/__ciclo-vida`);
  await pagina.waitForFunction(() => window.listo);
  const sesion = await pagina.createCDPSession();
  const muestras = [];
  async function medir(ciclos) {
    await new Promise(resolve => setTimeout(resolve, 4200));
    await sesion.send('HeapProfiler.collectGarbage');
    const heap = await sesion.send('Runtime.getHeapUsage');
    const dom = await sesion.send('Memory.getDOMCounters');
    const contadores = await pagina.evaluate(() => window.contadores());
    muestras.push({ ciclos, heap: heap.usedSize, ...dom, ...contadores });
  }
  for (let i = 0; i < 20; i++) assert(await pagina.evaluate(() => window.ciclo()), 'Las notas deben sobrevivir al desmontaje');
  await medir(20);
  for (let bloque = 1; bloque <= 5; bloque++) {
    for (let i = 0; i < 50; i++) assert(await pagina.evaluate(() => window.ciclo()));
    await medir(20 + bloque * 50);
  }
  const renders = await pagina.evaluate(() => window.probarSuscripcion());
  assert.equal(renders.antes, renders.despues, 'Una notificación ajena no debe renderizar el lanzador');
  const base = muestras[0]; const final = muestras.at(-1);
  for (const muestra of muestras) {
    assert.equal(muestra.intervalos, base.intervalos);
    assert.equal(muestra.listeners, base.listeners);
    assert.equal(muestra.suscripciones, 0);
    assert.equal(muestra.timers, 0);
  }
  const crecimiento = final.heap - base.heap;
  assert(crecimiento < Math.max(1024 * 1024, base.heap * 0.05), 'El crecimiento de heap requiere investigar referencias retenidas');
  assert.equal(errores.length, 0, errores.join('; '));
  const llamadas = await pagina.evaluate(() => window.probarLlamadas());
  for (const resultado of llamadas) { assert.equal(resultado.propias, 1); assert.equal(resultado.informacion, 1); assert.equal(resultado.vinculadas, resultado.cantidad); }
  const persistencia = await pagina.evaluate(() => window.probarPersistencia());
  assert(persistencia.jsonIdentico);
  const informe = { entorno: 'Chromium con API TaleSpire simulada', ciclos: 270, muestras, renders, crecimientoHeap: crecimiento, llamadas, persistencia };
  mkdirSync('scratch', { recursive: true });
  writeFileSync('scratch/perfil-ciclo-vida.json', JSON.stringify(informe, null, 2));
  console.log(JSON.stringify(informe, null, 2));
} finally { await navegador?.close(); await servidor.close(); }
