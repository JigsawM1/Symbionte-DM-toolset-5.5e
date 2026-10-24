import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import { htmlBardo as html } from './fixture-bardo.mjs';

const servidor = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error', plugins: [{
  name: 'prueba-subclases-bardo', configureServer(s) { s.middlewares.use(async (req, res, next) => {
    if (req.url !== '/__bardo_subclases') return next();
    try { res.setHeader('Content-Type', 'text/html');res.end(await s.transformIndexHtml(req.url, html)); } catch (e) { next(e); }
  }); }
}] });
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && fs.existsSync(p));
assert(executablePath, 'Se requiere Chromium local.');
fs.mkdirSync('scratch', { recursive: true });
const informe = { entorno: 'App real en Chromium local; dados locales y serializador real. Sin TaleSpire.', casos: [], errores: [] };
let navegador, pagina;
try {
  await servidor.listen();navegador = await puppeteer.launch({ executablePath, headless: true });
  pagina = await navegador.newPage();pagina.setDefaultTimeout(12000);
  pagina.on('pageerror', e => informe.errores.push(e.message));
  const esperar = fn => pagina.waitForFunction(fn);
  const pulsar = async (fn, ...args) => {
    const h = await pagina.waitForFunction(fn, {}, ...args);await h.asElement().evaluate(e => e.scrollIntoView({ block: 'center' }));await h.asElement().click();await h.dispose();
  };
  const texto = t => pulsar(t => [...document.querySelectorAll('button')].find(b => b.textContent.trim().toLocaleLowerCase().startsWith(t.toLocaleLowerCase())), t);
  const tarjeta = (n, s) => pulsar((n, s) => [...document.querySelectorAll('article')].find(a => a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /, '') === n)?.querySelector(s), n, s);
  const cerrar = () => pulsar(() => document.querySelector('button[title="Cerrar modal"]'));
  const medir = async (ancho, flujo) => {
    const medidas = await pagina.evaluate(() => ({ documento: document.documentElement.scrollWidth, dialogos: [...document.querySelectorAll('dialog[open]')].map(e => { const r = e.getBoundingClientRect();return { x: r.x, right: r.right, height: r.height }; }) }));
    assert(medidas.documento <= ancho + 1, `${flujo}: desbordamiento horizontal`);
    for (const d of medidas.dialogos) assert(d.x >= 0 && d.right <= ancho + 1 && d.height <= 761, `${flujo}: diálogo fuera de pantalla`);
    informe.casos.push({ ancho, flujo });
  };
  const sembrar = async (nivel, colegio) => { await pagina.evaluate((n, c) => window.sembrar(n, c), nivel, colegio);await esperar(() => document.querySelector('article')); };
  const dado = nombre => tarjeta(nombre, 'button[title^="Lanzar "]');
  for (const ancho of [599, 433]) {
    await pagina.setViewport({ width: ancho, height: 760 });
    await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__bardo_subclases`, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await esperar(() => typeof window.sembrar === 'function');
    await sembrar(6, 'Colegio del Conocimiento');
    await tarjeta('Competencias adicionales', 'button[title="Ver descripción completa en modal"]');
    for (const habilidad of ['Acrobacias', 'Arcanos', 'Medicina']) await texto(habilidad);
    await esperar(() => window.rasgo('Competencias adicionales').selectores[0].valorActual.length === 3);
    assert.equal(await pagina.evaluate(() => window.stats().gradosHabilidadesEfectivos.acrobacias), 'competente');
    await medir(ancho, 'Tres competencias: elección visible y efecto derivado');await cerrar();
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.rasgo('Competencias adicionales').selectores[0].valorActual.length), 3);
    await tarjeta('Descubrimientos mágicos', 'button[title="Ver descripción completa en modal"]');
    const descubrir = async nombre => {
      const input = await pagina.waitForSelector('input[placeholder="Buscar en descubrimientos mágicos..."]');
      await input.click();await pagina.keyboard.down('Control');await pagina.keyboard.press('KeyA');await pagina.keyboard.up('Control');await pagina.keyboard.press('Backspace');await input.type(nombre);
      await pulsar(n => [...document.querySelectorAll('button')].find(b => b.title === n), nombre);
    };
    await descubrir('Bola de fuego');await descubrir('Guía');
    await esperar(() => window.rasgo('Descubrimientos mágicos').selectores[0].valorActual.length === 2);
    await medir(ancho, 'Descubrimientos: dos elecciones, incluidos trucos');await cerrar();
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.rasgo('Descubrimientos mágicos').selectores[0].valorActual.length), 2);
    await tarjeta('Descubrimientos mágicos', 'button[title="Ver descripción completa en modal"]');
    await descubrir('Bola de fuego');await descubrir('Guía');await cerrar();await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.rasgo('Descubrimientos mágicos').selectores[0].valorActual.length), 0);
    assert.equal(await pagina.evaluate(() => window.pj().conjurosSiemprePreparadosIds.some(id => ['h_bola-de-fuego', 'Bola de fuego', 'h_guia', 'Guía'].includes(id))), false);
    await medir(ancho, 'Retirada de las elecciones y recarga sin concesiones residuales');

    await sembrar(14, 'Colegio del Conocimiento');
    await dado('Habilidad inigualable');await esperar(() => window.pj().intentoRasgoPendiente?.resultado !== undefined);
    const intento = await pagina.evaluate(() => window.pj().intentoRasgoPendiente);
    await medir(ancho, 'Habilidad inigualable: resultado pendiente');await pagina.keyboard.press('Escape');
    await esperar(() => !document.querySelector('dialog[open]'));await pagina.evaluate(() => window.recargar());
    await dado('Habilidad inigualable');
    assert.deepEqual(await pagina.evaluate(() => window.pj().intentoRasgoPendiente), intento);
    await texto('El intento sigue fallando');await esperar(() => !window.pj().intentoRasgoPendiente);
    assert.equal(await pagina.evaluate(() => window.rasgo('Inspiración bárdica').usosRestantes), 4);
    await dado('Habilidad inigualable');await texto('Convierte el fallo en éxito');
    await esperar(() => !window.pj().intentoRasgoPendiente);
    assert.equal(await pagina.evaluate(() => window.rasgo('Inspiración bárdica').usosRestantes), 3);
    await medir(ancho, 'Habilidad inigualable: Escape, recarga, fallo y éxito sin doble gasto');

    await sembrar(6, 'Colegio del Glamour');
    const hp = await pagina.evaluate(() => window.pj().hpTemporal);
    assert.equal(typeof hp, 'number');
    await dado('Manto de inspiración');await esperar(() => window.rasgo('Inspiración bárdica').usosRestantes === 3);
    assert.equal(await pagina.evaluate(() => window.pj().hpTemporal), hp);
    const resultadoManto = await pagina.evaluate(() => document.body.innerText.match(/Manto de inspiración: (\d+) × 2 = (\d+)/)?.slice(1).map(Number));
    assert(resultadoManto && resultadoManto[1] === resultadoManto[0] * 2, 'Debe mostrar el doble del mismo dado');
    await medir(ancho, 'Manto de inspiración: un gasto, sin PG temporales propios');
    await pagina.evaluate(() => window.ir('jugadores'));
    await texto('CONJUROS Y MAGIA');
    const lanzarOrden = () => pulsar(() => [...document.querySelectorAll('[class*="tarjeta_"]')].find(e => e.querySelector('button[class*="nombreConjuro"]')?.textContent === 'Orden imperiosa')?.querySelector('button[title^="Lanzar con ranura"]'));
    await lanzarOrden();await esperar(() => document.querySelector('dialog[open]'));await pagina.keyboard.press('Escape');
    await esperar(() => !document.querySelector('dialog[open]'));
    assert.equal(await pagina.evaluate(() => window.rasgo('Manto de majestad').usosRestantes), 1);
    await lanzarOrden();await texto('Con Manto de majestad');
    await esperar(() => window.rasgo('Manto de majestad').activo && window.pj().concentracionActiva?.idRasgoOrigen);
    await lanzarOrden();await texto('Con Manto de majestad');
    await esperar(() => !document.querySelector('dialog[open]'));
    assert.equal(await pagina.evaluate(() => window.rasgo('Manto de majestad').usosRestantes), 0);
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[1] ?? 0), 0);
    await pagina.evaluate(() => window.recargar());
    assert(await pagina.evaluate(() => window.pj().concentracionActiva?.idRasgoOrigen));
    await medir(ancho, 'Manto de majestad: carta, Escape, primer lanzamiento, repetición y concentración persistente');
    await pagina.evaluate(() => { window.estado().actualizarPersonaje(window.pj().id, { concentracionActiva: null });window.ir('rasgos'); });
    await esperar(() => !window.rasgo('Manto de majestad').activo);
    await tarjeta('Manto de majestad', 'button[title="Gastar un espacio para recuperar usos"]');
    await esperar(() => document.querySelector('dialog[open]'));await medir(ancho, 'Recarga de Manto con espacio de nivel 3');
    await texto('Gastar espacio y recuperar');await esperar(() => window.rasgo('Manto de majestad').usosRestantes === 1);
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[3]), 1);
    await pagina.evaluate(() => window.ir('jugadores'));
    await lanzarOrden();await texto('Con espacio de conjuro');
    await esperar(() => document.querySelector('dialog[open]')?.textContent.includes('Tras el lanzamiento'));
    await texto('Magia cautivadora');await esperar(() => window.rasgo('Magia cautivadora').usosRestantes === 0);
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[1]), 1);
    await pagina.evaluate(() => window.ir('rasgos'));
    await tarjeta('Magia cautivadora', 'button[title^="Recargar uso gastando"]');
    await esperar(() => window.rasgo('Magia cautivadora').usosRestantes === 1);
    assert.equal(await pagina.evaluate(() => window.rasgo('Inspiración bárdica').usosRestantes), 2);
    await medir(ancho, 'Magia cautivadora tras gastar espacio y recarga con Inspiración');

    for (const antes of [true, false]) {
      await sembrar(18, 'Colegio de la Danza');
      await pagina.evaluate(() => { const p = window.pj();window.estado().actualizarPersonaje(p.id, { rasgos: p.rasgos.map(r => r.nombre === 'Inspiración bárdica' ? { ...r, usosRestantes: 2 } : r) });window.ir('jugadores'); });
      const iniciar = () => pulsar(() => [...document.querySelectorAll('button')].find(e => e.textContent.includes('INIC')));
      await iniciar();await esperar(() => document.querySelector('dialog[open]'));await pagina.keyboard.press('Escape');
      await esperar(() => !document.querySelector('dialog[open]'));
      assert.equal(await pagina.evaluate(() => window.rasgo('Inspiración bárdica').usosRestantes), 2);
      await iniciar();await texto(`Juego de pies en tándem · Recuperar ${antes ? 'antes' : 'después'} de gastar`);
      await esperar(() => window.estado().colaIniciativa.some(c => c.iniciativa > 0));
      await pagina.waitForFunction(valor => window.rasgo('Inspiración bárdica').usosRestantes === valor, {}, antes ? 1 : 2);
      await medir(ancho, `Tándem: cancelar y recuperar ${antes ? 'antes' : 'después'} de gastar`);
    }
    await sembrar(14, 'Colegio del Glamour');
    await tarjeta('Majestad inquebrantable', 'button[title="Rasgo inactivo (clic para activar)"]');
    await esperar(() => window.rasgo('Majestad inquebrantable').activo);
    assert.equal(await pagina.evaluate(() => window.rasgo('Majestad inquebrantable').usosRestantes), 0);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.rasgo('Majestad inquebrantable').activo), true);
    await tarjeta('Majestad inquebrantable', 'button[title="Rasgo activo (clic para desactivar)"]');
    await pagina.evaluate(() => window.descansar());
    await esperar(() => window.rasgo('Majestad inquebrantable').usosRestantes === 1);
    await medir(ancho, 'Majestad inquebrantable: activar, guardar, desactivar y descansar');
    await sembrar(3, 'Colegio del Valor');await pagina.evaluate(() => window.ir('jugadores'));await texto('COMBATE Y ATRIBUTOS');
    await esperar(() => document.querySelector('button[title="Haz clic para editar competencias en Armas"]')?.textContent.includes('Marciales'));
    assert.match(await pagina.$eval('button[title="Haz clic para editar competencias en Armaduras"]', e => e.textContent), /Escudos/i);
    assert.equal(await pagina.evaluate(() => window.pj().competenciasArmasGrupos.includes('marciales')), false);
    await medir(ancho, 'Valor: competencias de equipo efectivas visibles, sin fijarlas como manuales');
    await pagina.screenshot({ path: `scratch/bardo-subclases-${ancho}.png` });
  }
  assert.deepEqual(informe.errores, []);
} catch (e) {
  informe.fallo = e.stack;
  if (pagina) { await pagina.screenshot({ path: 'scratch/bardo-subclases-fallo.png' });fs.writeFileSync('scratch/bardo-subclases-fallo.txt', await pagina.evaluate(() => document.body.innerText + '\n' + JSON.stringify([...document.querySelectorAll('input')].map(e => ({ placeholder: e.placeholder, value: e.value }))))); }
  throw e;
} finally {
  fs.writeFileSync('scratch/bardo-subclases-ui.json', JSON.stringify(informe, null, 2));
  console.log(JSON.stringify(informe, null, 2));await navegador?.close();await servidor.close();
}
