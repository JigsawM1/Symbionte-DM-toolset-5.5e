import assert from "node:assert/strict";

// Recorre la vista de producción; solo sustituye la API externa de dados y chat.
export async function probarMagiaSalvaje(pagina, { click, texto, width, height }) {
  const vista = '[aria-label="Magia Salvaje"]';
  const tabla = 'section[aria-label="Tabla de efectos"]';
  const buscar = 'input[aria-label="Buscar efectos de magia salvaje"]';
  const resultado = 'section[aria-label="Última sobrecarga"]';
  const capturar = async nombre => {
    const cerrarToast = 'div[class*="toast"] button[title="Cerrar"]';
    while (await pagina.$(cerrarToast)) await click(cerrarToast);
    await pagina.screenshot({ path: `scratch/magia-salvaje-${nombre}-${width}x${height}.png` });
  };
  const abrirTabla = async () => {
    await pagina.evaluate(() => window.ir('rasgos'));
    const acceso = await pagina.waitForFunction(() => [...document.querySelectorAll('article')]
      .find(a => a.querySelector('[class*="nombreRasgo"]')?.textContent.includes('Tabla de Oleada'))
      ?.querySelector('button[class*="botonMagiaSalvaje"]'));
    await acceso.asElement().scrollIntoView(); await acceso.asElement().click(); await acceso.dispose();
    await pagina.waitForSelector(vista);
  };
  const validarVista = async () => {
    const problemas = await pagina.$eval(vista, raiz => {
      const fallos = [];
      const visibles = [...raiz.querySelectorAll('*')].filter(e => e.getClientRects().length);
      if (raiz.scrollWidth > raiz.clientWidth + 1) fallos.push('Desbordamiento horizontal');
      const scrolls = visibles.filter(e => ['auto', 'scroll'].includes(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 1);
      if (scrolls.length) fallos.push('Scroll vertical anidado');
      for (const e of visibles) {
        const css = getComputedStyle(e);
        if (parseFloat(css.fontSize) < 11) fallos.push(`Texto menor de 11px: ${e.tagName}`);
        if (css.transitionDuration !== '0s' || css.animationName !== 'none') fallos.push('Animación activa');
        if (e.matches('button, input, summary')) {
          const r = e.getBoundingClientRect();
          if (r.width < 32 || r.height < 32) fallos.push(`Control pequeño: ${e.textContent}`);
        }
      }
      // Compone las transparencias sobre la superficie real antes de medir el texto.
      const rgba = color => color.match(/[\d.]+/g).map(Number);
      const mezclar = (frente, fondo) => frente.slice(0, 3).map((n, i) => n * (frente[3] ?? 1) + fondo[i] * (1 - (frente[3] ?? 1)));
      const fondo = e => {
        const capas = []; for (let p = e; p; p = p.parentElement) capas.unshift(rgba(getComputedStyle(p).backgroundColor));
        return capas.reduce((acum, c) => mezclar(c, acum), [0, 0, 0]);
      };
      const luminancia = rgb => rgb.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
        .reduce((s, n, i) => s + n * [.2126, .7152, .0722][i], 0);
      for (const e of visibles.filter(e => [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()))) {
        const bg = fondo(e), css = getComputedStyle(e);
        const fg = mezclar(rgba(css.color), bg);
        const [a, b] = [luminancia(fg), luminancia(bg)].sort((a, b) => b - a);
        const ratio = (a + .05) / (b + .05);
        if (ratio < 4.5) fallos.push(`Contraste ${ratio.toFixed(2)}: ${e.textContent.slice(0, 60)}`);
      }
      return fallos;
    });
    assert.deepEqual(problemas, [], `${width}x${height}`);
  };

  await abrirTabla();
  assert.equal(await pagina.$$eval(`${tabla} article`, es => es.length), 25);
  assert.equal(await pagina.$$eval(`${tabla} details[open]`, es => es.length), 0);
  await validarVista();
  await capturar('tabla');
  await click('#sobrecarga-5 summary');
  assert.equal(await pagina.$eval('#sobrecarga-5 details', e => e.open), true);
  await validarVista();
  await pagina.screenshot({ path: `scratch/magia-salvaje-subtabla-${width}x${height}.png` });
  await pagina.keyboard.press('Enter');
  assert.equal(await pagina.$eval('#sobrecarga-5 details', e => e.open), false);
  await pagina.locator(buscar).fill('sin-coincidencias-xyz');
  await pagina.waitForSelector(`${tabla} [class*="sinCoincidencias"]`);
  assert.equal(await pagina.$eval(`${tabla} [role="status"]`, e => e.textContent), '0 de 25 efectos');
  await texto('Ir a número', vista);
  await pagina.locator('#magia-salvaje-numero').fill('101');
  await texto('Ir', vista);
  assert.equal(await pagina.$eval('#magia-salvaje-numero', e => e.validity.valid), false);
  await pagina.locator('#magia-salvaje-numero').fill('2.5');
  await texto('Ir', vista);
  assert.equal(await pagina.$eval('#magia-salvaje-numero', e => e.validity.valid), false);
  await pagina.keyboard.press('Escape');
  assert.equal(await pagina.$eval('button[aria-controls="magia-salvaje-selector-numero"]', e => document.activeElement === e), true);
  assert.equal(await pagina.$eval('button[aria-controls="magia-salvaje-selector-numero"]', e => getComputedStyle(e).outlineStyle), 'solid');
  await texto('Ir a número', vista);
  await pagina.locator('#magia-salvaje-numero').fill('100');
  await texto('Ir', vista);
  await pagina.waitForFunction(() => document.activeElement?.id === 'sobrecarga-97');
  assert.equal(await pagina.$eval(buscar, e => e.value), '');
  assert.equal(await pagina.$$eval(`${tabla} article`, es => es.length), 25);
  const destino = await pagina.$eval('#sobrecarga-97', e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  assert(destino, 'La fila consultada debe quedar visible');

  await texto('Oleada domada [1/1 usos]', vista);
  assert.equal(await pagina.$$eval(`${tabla} button:disabled`, es => es.length), 1);
  assert.equal(await pagina.$eval('#sobrecarga-97 button', e => e.disabled), true);
  await validarVista();
  await texto('Cancelar selección [1/1 usos]', vista);
  assert.equal(await pagina.evaluate(() => window.rasgo('Oleada domada').usosRestantes), 1);

  await pagina.evaluate(() => {
    window.mensajes = []; window.dadosEmitidos = []; window.totalesPrueba = [0, 6, 40, 2, 2]; window.chatCorrecto = true;
    window.TS = { dice: {
      makeRollDescriptors: async formula => formula.split('/').map(g => ({ name: g.slice(0, g.indexOf(':')) })),
      putDiceInTray: async grupos => {
        const rollId = `prueba-magia-${window.dadosEmitidos.length}`;
        window.dadosEmitidos.push(grupos);
        setTimeout(() => window.procesarDados({ rollId, resultsGroups: grupos.map(g => ({ ...g, total: window.totalesPrueba.shift() })) }), 30);
        return rollId;
      },
      evaluateDiceResultsGroup: async g => g.total
    }, chat: { send: async m => { window.mensajes.push(m); if (!window.chatCorrecto) throw new Error('Fallo de chat simulado'); } } };
  });
  await texto('Tirar con Caos Controlado (dos percentiles)', vista);
  await pagina.waitForSelector('section[aria-label="Elección de Caos Controlado"]');
  assert.equal(await pagina.$$eval('section[aria-label="Elección de Caos Controlado"] article', es => es.length), 2);
  await validarVista();
  await capturar('caos');
  await texto('Elegir opción A', vista);
  await pagina.waitForFunction(() => window.rasgo('Tabla de Oleada de magia salvaje').resultadoTabla?.enviado);
  assert.equal(await pagina.evaluate(() => window.rasgo('Tabla de Oleada de magia salvaje').resultadoTabla.tiradaD100), 6);
  assert.match(await pagina.$eval(resultado, e => e.textContent), /Flumph/);
  assert.equal(await pagina.$eval('#sobrecarga-5 details', e => e.open), false);
  assert.match(await pagina.$eval('#sobrecarga-5', e => e.textContent), /Último resultado/);
  await validarVista();
  await capturar('resultado');

  await pagina.evaluate(() => { window.chatCorrecto = false; window.totalesPrueba = [2]; });
  await texto('Oleada domada [1/1 usos]', vista);
  await texto('ELEGIR', '#sobrecarga-5');
  await pagina.waitForFunction(() => window.rasgo('Oleada domada').resultadoTabla?.estadoEnvio === 'pendiente');
  await pagina.waitForFunction(() => !document.querySelector('section[aria-label="Última sobrecarga"] button')?.disabled);
  assert.equal(await pagina.evaluate(() => window.rasgo('Oleada domada').usosRestantes), 0);
  const tiradasAntes = await pagina.evaluate(() => window.dadosEmitidos.length);
  await validarVista();
  await pagina.evaluate(() => { window.chatCorrecto = true; });
  await texto('REINTENTAR ENVÍO', resultado);
  await pagina.waitForFunction(() => window.rasgo('Oleada domada').resultadoTabla?.enviado);
  assert.equal(await pagina.evaluate(() => window.rasgo('Oleada domada').usosRestantes), 0);
  assert.equal(await pagina.evaluate(() => window.dadosEmitidos.length), tiradasAntes);
  assert.equal(await pagina.evaluate(() => window.mensajes.at(-1) === window.mensajes.at(-2)), true);
  await pagina.evaluate(() => window.recargar());
  assert.match(await pagina.$eval(resultado, e => e.textContent), /Flumph/);

  await pagina.evaluate(() => { delete window.TS; window.sembrar(3, 'Hechicería de Magia Salvaje'); });
  await abrirTabla();
  await texto('Tirar percentil (1d100 + 1d10)', vista);
  await pagina.waitForFunction(() => window.rasgo('Tabla de Oleada de magia salvaje').resultadoTabla?.estadoEnvio === 'local');
  await validarVista();
  await pagina.evaluate(() => { delete window.TS; });
}
