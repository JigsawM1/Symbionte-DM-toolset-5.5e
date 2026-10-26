import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";
import { htmlClerigo } from "./fixture-clerigo.mjs";

const servidor = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error", plugins: [{
  name: "prueba-clerigo", configureServer(s) { s.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__clerigo") return next();
    try { res.setHeader("Content-Type", "text/html"); res.end(await s.transformIndexHtml(req.url, htmlClerigo)); } catch (error) { next(error); }
  }); }
}] });
const ejecutable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && fs.existsSync(p));
assert(ejecutable, "Se requiere Chromium local.");
fs.mkdirSync("scratch", { recursive: true });
const informe = { entorno: "Chromium local, aplicación y serializador reales; dados locales y fallo de API simulado, sin TaleSpire", casos: [], dimensiones: [], errores: [] };
let navegador;
let pagina;
try {
  await servidor.listen();
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  pagina = await navegador.newPage(); pagina.setDefaultTimeout(20000);
  pagina.on("pageerror", error => informe.errores.push(error.message));
  const click = async selector => { const e = await pagina.waitForSelector(selector); await e.scrollIntoView(); await e.click(); };
  const boton = async (texto, ambito = "body") => {
    const h = await pagina.waitForFunction((t, a) => [...document.querySelectorAll(`${a} button`)].find(b => b.textContent.trim() === t), {}, texto, ambito);
    await h.asElement().scrollIntoView(); await h.asElement().click(); await h.dispose();
  };
  const tarjeta = async (nombre, selector) => {
    for (const aviso of await pagina.$$('[class*="toast"] button[title="Cerrar"]')) await aviso.click();
    const h = await pagina.waitForFunction((n, s) => [...document.querySelectorAll("article")].find(a => a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /, "") === n)?.querySelector(s), {}, nombre, selector);
    await h.asElement().scrollIntoView();
    await h.asElement().click(); await h.dispose();
  };
  const elegir = async (etiqueta, titulo) => {
    const h = await pagina.waitForFunction((e, t) => [...document.querySelectorAll('[class*="tarjetaSelectorModal"]')]
      .find(s => s.querySelector('[class*="tituloSelectorModal"]')?.textContent.trim() === e)?.querySelector(`button[title="${t}"]`), {}, etiqueta, titulo);
    await h.asElement().scrollIntoView(); await h.asElement().click(); await h.dispose();
  };
  const dimension = async (ancho, flujo) => {
    const medida = await pagina.evaluate(() => ({ ancho: innerWidth, documento: document.documentElement.scrollWidth,
      dialogos: [...document.querySelectorAll('dialog[open]')].map(e => { const r = e.getBoundingClientRect(); return { izquierda: r.left, derecha: r.right, alto: r.height }; }) }));
    assert(medida.documento <= ancho + 1, `Desbordamiento horizontal en ${flujo}`);
    for (const d of medida.dialogos) assert(d.izquierda >= 0 && d.derecha <= ancho + 1 && d.alto <= 760, `Diálogo fuera del viewport: ${flujo}`);
    informe.dimensiones.push({ flujo, ...medida });
  };
  const cerrarDetalle = () => click('button[title="Cerrar modal"]');
  const abrirResolucion = nombre => click(`button[aria-label="Resolver ${nombre}"]`);
  const sembrar = async nivel => {
    const id = await pagina.evaluate(n => window.sembrar(n), nivel);
    await pagina.waitForFunction(id => [...document.querySelectorAll("article[data-personaje-id]")].some(a => a.dataset.personajeId === id), {}, id);
  };
  const escribir = async (selector, texto) => {
    await click(selector); await pagina.keyboard.down("Control"); await pagina.keyboard.press("KeyA");
    await pagina.keyboard.up("Control"); await pagina.keyboard.type(texto);
  };
  const editor = etiqueta => `details:has(textarea[aria-label="${etiqueta}"])`;
  const abrirEditor = async etiqueta => {
    const ambito = editor(etiqueta);
    if (!await pagina.$eval(ambito, e => e.open)) await click(`${ambito} > summary`);
    return ambito;
  };
  for (const ancho of [599, 433]) {
    await pagina.setViewport({ width: ancho, height: 760 });
    await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__clerigo`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await tarjeta("Orden divina", 'button[title="Ver descripción completa en modal"]');
    assert.deepEqual(await pagina.evaluate(() => window.rasgo("orden_divina").selectores[0].valorActual), []);
    await elegir("Orden divina", "Taumaturgo"); await cerrarDetalle();
    await tarjeta("Orden divina: Taumaturgo", 'button[title="Ver descripción completa en modal"]');
    await elegir("Truco adicional de Clérigo (Taumaturgo)", "Guía");
    await pagina.waitForFunction(() => window.pj().trucosConocidosIds.includes("h_guia"));
    await dimension(ancho, "Orden divina y truco"); await pagina.screenshot({ path: `scratch/clerigo-taumaturgo-${ancho}.png` });
    await cerrarDetalle(); await pagina.evaluate(() => window.recargar());
    assert(await pagina.evaluate(() => window.pj().trucosConocidosIds.includes("h_guia")));
    await tarjeta("Orden divina", 'button[title="Ver descripción completa en modal"]');
    await elegir("Orden divina", "Protector"); await cerrarDetalle();
    assert.equal(await pagina.evaluate(() => window.pj().trucosConocidosIds.includes("h_guia")), false);
    informe.casos.push({ ancho, flujo: "Orden divina: elección, retirada y recarga de truco" });

    await sembrar(7);
    await abrirResolucion("Canalizar divinidad: Chispa divina");
    await click('dialog[open] button[title="Resultado del rasgo"]');
    await boton("Curar a otra criatura", 'dialog[open]');
    await dimension(ancho, "Chispa: cancelación"); await pagina.keyboard.press("Escape");
    assert.equal(await pagina.evaluate(() => window.rasgo("canalizar_divinidad").usosRestantes), 3);
    const salud = await pagina.evaluate(() => window.pj().hpActual);
    await abrirResolucion("Canalizar divinidad: Chispa divina");
    await click('dialog[open] button[title="Resultado del rasgo"]');
    await boton("Daño radiante", 'dialog[open]');
    await boton("Confirmar resolución", 'dialog[open]');
    await pagina.waitForFunction(() => window.rasgo("canalizar_divinidad").usosRestantes === 2);
    assert.equal(await pagina.evaluate(() => window.pj().hpActual), salud);
    await abrirResolucion("Canalizar divinidad: Expulsar muertos vivientes");
    await click('dialog[open] input[type="checkbox"]');
    await boton("Confirmar resolución", 'dialog[open]');
    await pagina.waitForFunction(() => window.rasgo("canalizar_divinidad").usosRestantes === 1);
    await dimension(ancho, "Resoluciones y gasto"); await pagina.screenshot({ path: `scratch/clerigo-recursos-${ancho}.png` });
    await pagina.evaluate(() => window.descansar());
    assert.equal(await pagina.evaluate(() => window.rasgo("canalizar_divinidad").usosRestantes), 2);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.rasgo("canalizar_divinidad").usosRestantes), 2);
    informe.casos.push({ ancho, flujo: "Chispa, Abrasar, Escape, gasto único, descanso y persistencia" });

    await sembrar(14);
    await tarjeta("Golpes benditos", 'button[title="Ver descripción completa en modal"]');
    await elegir("Opción de Golpes benditos", "Lanzamiento potente"); await cerrarDetalle();
    await abrirResolucion("Golpes benditos mejorados (Lanzamiento potente)");
    assert(await pagina.$eval('dialog[open] footer button:last-child', e => e.disabled));
    const checks = await pagina.$$('dialog[open] input[type="checkbox"]');
    await checks[0].click(); await checks[1].click();
    await dimension(ancho, "Vitalidad"); await pagina.screenshot({ path: `scratch/clerigo-vitalidad-${ancho}.png` });
    await boton("Confirmar resolución", 'dialog[open]');
    await pagina.waitForFunction(() => window.pj().hpTemporal === 8);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.pj().hpTemporal), 8);
    informe.casos.push({ ancho, flujo: "Vitalidad: confirmación, máximo propio y persistencia" });

    await sembrar(20);
    const seccion = 'section[aria-label="Lanzamientos de Intercesión divina"]';
    await click(`${seccion} button`);
    await boton("Deseo · Nivel 9", seccion);
    await dimension(ancho, "Intercesión: selección de Deseo");
    // Simulación explícita de un fallo nativo al pedir la espera; Deseo ya habrá consumido su uso.
    await pagina.evaluate(() => { window.TS = { dice: { isValidRollString: () => true, makeRollDescriptors: async formula => { if (formula.includes("Descansos largos necesarios")) throw new Error("Fallo de dados simulado"); return []; }, putDiceInTray: async descriptores => JSON.stringify(descriptores).includes("Descansos") ? "" : "lanzamiento-simulado" } }; });
    await boton("Lanzar · 1 uso", seccion);
    await pagina.waitForFunction(() => window.estado().notificaciones.some(n => n.mensaje.includes("Falta determinar su espera")));
    assert.equal(await pagina.evaluate(() => window.rasgo("intercesion_divina").recuperacionDiferida.estado), "pendiente");
    await pagina.evaluate(() => { delete window.TS; window.recargar(); });
    await boton("Determinar espera");
    await pagina.waitForFunction(() => window.rasgo("intercesion_divina").recuperacionDiferida?.estado === "contando");
    const espera = await pagina.evaluate(() => window.rasgo("intercesion_divina").recuperacionDiferida.restantes);
    assert(espera >= 2 && espera <= 8);
    assert.equal(await pagina.evaluate(() => window.rasgo("intercesion_divina").usosRestantes), 0);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.rasgo("intercesion_divina").recuperacionDiferida.restantes), espera);
    await dimension(ancho, "Intercesión: recuperación pendiente"); await pagina.screenshot({ path: `scratch/clerigo-intercesion-${ancho}.png` });
    for (let i = 0; i < espera; i++) await pagina.evaluate(() => window.descansar(true));
    assert.equal(await pagina.evaluate(() => window.rasgo("intercesion_divina").usosRestantes), 1);
    assert.equal(await pagina.evaluate(() => window.pj().conjurosConocidosIds.includes("h_deseo")), false);
    informe.casos.push({ ancho, flujo: "Intercesión: Deseo, coste, fallo simulado, reintento, guardado y recuperación exacta" });

    await sembrar(7);
    for (const aviso of await pagina.$$('[class*="toast"] button[title="Cerrar"]')) await aviso.click();
    await click('button[title="Crear rasgo o dote Homebrew"]');
    await pagina.waitForSelector('input[aria-label="Nombre del Rasgo o Dote"]');
    const nombre = "Capacidades JSON del constructor";
    await escribir('input[aria-label="Nombre del Rasgo o Dote"]', nombre);
    const etiquetaTabla = "Tabla aleatoria editable";
    const tabla = await abrirEditor(etiquetaTabla);
    const contenido = etiqueta => pagina.$eval(`textarea[aria-label="${etiqueta}"]`, e => e.value);
    const plantilla = { dado: 100, tiradas: 1, modo: "aleatoria", filas: [{ id: "resultado", desde: 1, hasta: 100, texto: "Efecto" }] };
    assert.deepEqual(JSON.parse(await contenido(etiquetaTabla)), plantilla);
    assert(await pagina.$eval(`${tabla} p`, e => e.textContent.includes("idRasgoTabla")));
    await boton("Aplicar configuración", tabla);
    assert.equal(await pagina.$eval(`${tabla} [role="status"]`, e => e.textContent), "Configuración aplicada.");
    for (const invalido of ["{", JSON.stringify({ dado: 1 })]) {
      await escribir(`${tabla} textarea`, invalido);
      await boton("Aplicar configuración", tabla);
      assert.notEqual(await pagina.$eval(`${tabla} [role="status"]`, e => e.textContent), "Configuración aplicada.");
    }
    const capacidades = [
      ["Resolución asistida", "resolucionAsistida", { opciones: [{ id: "consulta", etiqueta: "Consultar", tipo: "informativo" }] }],
      ["Lanzamiento con recurso: configuración completa", "lanzamientoConRecurso", { lista: "Clérigo", nivelMaximo: 5, costeFijo: 1 }]
    ];
    for (const [etiqueta, , valor] of capacidades) {
      const ambito = await abrirEditor(etiqueta);
      assert.deepEqual(JSON.parse(await contenido(etiqueta)), {});
      await escribir(`${ambito} textarea`, JSON.stringify(valor)); await boton("Aplicar configuración", ambito);
      assert.equal(await pagina.$eval(`${ambito} [role="status"]`, e => e.textContent), "Configuración aplicada.");
    }
    await dimension(ancho, "Constructor: editores y errores");
    await click('button[title="Guardar rasgo en este personaje"]');
    await pagina.waitForFunction(n => window.pj().rasgos.some(r => r.nombre === n), {}, nombre);
    const creado = await pagina.evaluate(n => window.pj().rasgos.find(r => r.nombre === n), nombre);
    // Los dos intentos inválidos no deben sustituir la última tabla aplicada.
    assert.equal(creado.tablaAleatoria.dado, plantilla.dado);
    assert.deepEqual(creado.tablaAleatoria.filas, plantilla.filas);
    for (const [, campo, valor] of capacidades) assert.deepEqual(creado[campo], valor);
    await pagina.evaluate(() => window.recargar());
    await tarjeta(nombre, 'button[title="Editar rasgo"]');
    for (const [etiqueta, campo] of [[etiquetaTabla, "tablaAleatoria"], ...capacidades]) {
      const ambito = await abrirEditor(etiqueta);
      assert.deepEqual(JSON.parse(await contenido(etiqueta)), creado[campo]);
      await boton("Retirar configuración", ambito);
      assert.equal(await pagina.$eval(`${ambito} [role="status"]`, e => e.textContent), "Configuración retirada.");
    }
    await dimension(ancho, "Constructor: reapertura y retirada");
    await click('button[title="Guardar rasgo en este personaje"]');
    await pagina.waitForFunction(n => { const r = window.pj().rasgos.find(r => r.nombre === n); return r && !r.tablaAleatoria && !r.resolucionAsistida && !r.lanzamientoConRecurso; }, {}, nombre);
    await pagina.evaluate(() => window.recargar());
    await tarjeta(nombre, 'button[title="Editar rasgo"]');
    await abrirEditor(etiquetaTabla);
    assert.deepEqual(JSON.parse(await contenido(etiquetaTabla)), plantilla);
    for (const [etiqueta] of capacidades) { await abrirEditor(etiqueta); assert.deepEqual(JSON.parse(await contenido(etiqueta)), {}); }
    await click('button[title="Volver a la lista de rasgos"]');
    informe.casos.push({ ancho, flujo: "Constructor: plantilla, JSON y Zod inválidos, tres capacidades, guardado, recarga y retirada" });
  }
  assert.deepEqual(informe.errores, []);
  console.log(JSON.stringify(informe, null, 2));
} catch (error) {
  if (pagina) { await pagina.screenshot({ path: "scratch/clerigo-ui-error.png" }); fs.writeFileSync("scratch/clerigo-ui-error.html", await pagina.content()); }
  throw error;
} finally {
  fs.writeFileSync("scratch/clerigo-ui.json", JSON.stringify(informe, null, 2));
  await navegador?.close(); await servidor.close();
}
