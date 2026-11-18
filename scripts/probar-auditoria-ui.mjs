import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";
import { htmlAuditoria, htmlSelectoresAuditoria } from "./fixture-auditoria-ui.mjs";

const ejecutable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && fs.existsSync(p));
assert(ejecutable, "Establece CHROME_PATH con la ruta de Chromium.");
const servidor = await createServer({ logLevel: "error", server: { host: "127.0.0.1", port: 0 }, plugins: [{
  name: "fixture-auditoria", configureServer(s) { s.middlewares.use(async (req, res, next) => {
    const html = req.url === "/__auditoria" ? htmlAuditoria : req.url === "/__selectores" ? htmlSelectoresAuditoria : null;
    if (!html) return next();
    try { res.setHeader("Content-Type", "text/html"); res.end(await s.transformIndexHtml(req.url, html)); }
    catch (error) { next(error); }
  }); }
}] });
fs.mkdirSync("scratch/auditoria-ui", { recursive: true });
const informe = { entorno: "Chromium externo; App real y fixtures aislados; no certifica CEF ni persistencia nativa", casos: [], errores: [] };
let navegador, pagina;
try {
  await servidor.listen();
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  pagina = await navegador.newPage(); pagina.setDefaultTimeout(15000);
  pagina.on("pageerror", error => informe.errores.push(error.message));
  const mensajes = [];
  pagina.on("console", mensaje => mensajes.push(mensaje.text()));
  const click = async selector => { const e = await pagina.waitForSelector(selector); await e.scrollIntoView(); await e.click(); await e.dispose(); };
  const texto = async (valor, ambito = "body") => {
    const h = await pagina.waitForFunction((v, a) => [...document.querySelectorAll(a + " button")].find(e => e.textContent.trim() === v), {}, valor, ambito);
    await h.asElement().scrollIntoView(); await h.asElement().click(); await h.dispose();
  };
  const campo = async (etiqueta, valor) => {
    const h = await pagina.waitForFunction(t => [...document.querySelectorAll("label")].find(l => l.textContent.trim() === t)?.control, {}, etiqueta);
    await h.asElement().focus(); await pagina.keyboard.down("Control"); await pagina.keyboard.press("KeyA"); await pagina.keyboard.up("Control"); await pagina.keyboard.press("Backspace"); await pagina.keyboard.type(valor); await pagina.keyboard.press("Tab"); await h.dispose();
  };
  const esperarDialogos = n => pagina.waitForFunction(total => document.querySelectorAll("dialog[open]").length === total, {}, n);
  const guardar = async (ancho, hallazgo) => { await pagina.screenshot({ path: `scratch/auditoria-ui/${hallazgo}-${ancho}.png` }); informe.casos.push({ ancho, hallazgo }); };
  for (const ancho of [599, 433]) {
    await pagina.setViewport({ width: ancho, height: 952 });
    await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__auditoria`, { waitUntil: "networkidle0", timeout: 60000 });
    const añadir = async nombre => { await click('input[placeholder="Añadir jugador..."]'); await pagina.keyboard.type(nombre); await pagina.keyboard.press("Enter"); };
    await añadir("AUDITORÍA A"); await añadir("AUDITORÍA B"); await añadir("AUDITORÍA B");
    await pagina.waitForFunction(() => window.estado().colaIniciativa.length === 2);
    assert.deepEqual(await pagina.evaluate(() => window.estado().colaIniciativa.map(c => [c.idPersonajeDuenio,c.bonificadorIniciativa])), [["auditoria-a",7],["auditoria-b",7]]);
    const desde = mensajes.length;
    await click('button[title="Lanzar dado de iniciativa en TaleSpire"]');
    await pagina.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert(mensajes.slice(desde).some(mensaje => mensaje.includes('1d20+7')), `La tirada debe recibir el bono completo de la tarjeta: ${JSON.stringify(mensajes.slice(desde))}`);
    await guardar(ancho, "H01-H02");
    await pagina.evaluate(() => window.renombrar("HOMÓNIMO", "HOMÓNIMO"));
    await añadir("HOMÓNIMO");
    await pagina.waitForSelector('input[aria-invalid="true"]');
    assert.equal(await pagina.evaluate(() => window.estado().colaIniciativa.length),0);
    await pagina.keyboard.press("ArrowDown"); await pagina.keyboard.press("Enter");
    await click('input[placeholder="Añadir jugador..."]');
    await pagina.keyboard.press("ArrowDown");
    await pagina.waitForFunction(() => document.querySelectorAll('[role="option"]').length === 2);
    assert.equal(await pagina.evaluate(() => [...document.querySelectorAll('[role="option"]')].filter(o => o.textContent.includes("EN COMBATE")).length),1);
    await pagina.keyboard.press("ArrowDown"); await pagina.keyboard.press("Enter");
    assert.equal(await pagina.evaluate(() => window.estado().colaIniciativa.length),2);
    await guardar(ancho,"H01-homonimos");
    await pagina.evaluate(() => window.renombrar("AUDITORÍA A", "AUDITORÍA B"));
    await pagina.evaluate(() => window.ir("inventario"));
    await texto("Agregar Objeto");
    await esperarDialogos(1);
    await pagina.waitForFunction(() => document.activeElement.getAttribute("role") === "combobox");
    await pagina.keyboard.press("ArrowDown"); await pagina.keyboard.press("End");
    assert(await pagina.evaluate(() => document.activeElement.getAttribute("aria-activedescendant")));
    await pagina.keyboard.press("Escape"); await esperarDialogos(1);
    assert.equal(await pagina.evaluate(() => document.activeElement.getAttribute("aria-expanded")),"false");
    await pagina.keyboard.type("AUDITORÍA BUSQUEDA PENDIENTE"); await pagina.keyboard.press("Escape");
    await click('dialog button[title="Mostrar sugerencias"]');
    assert.equal(await pagina.evaluate(() => document.querySelector('dialog input[role="combobox"]').getAttribute("aria-expanded")),"true");
    await pagina.keyboard.press("Escape"); await esperarDialogos(1);
    assert.equal(await pagina.evaluate(() => document.activeElement.getAttribute("role")),"combobox");
    assert.equal(await pagina.evaluate(() => document.activeElement.getAttribute("aria-expanded")),"false");
    assert.equal(await pagina.evaluate(() => document.activeElement.value),"AUDITORÍA BUSQUEDA PENDIENTE");
    await guardar(ancho,"R02-escape-flecha");
    await texto("Otras Posesiones", "dialog[open]");
    await campo("Nombre de la Posesión / Objeto *", "AUDITORÍA CUERDA");
    await campo("Cantidad", "3"); await campo("Peso por unidad (lb)", "2");
    await pagina.waitForFunction(() => document.querySelector("output")?.textContent.includes("6 lb"));
    assert.equal(await pagina.evaluate(() => [...document.querySelectorAll("dialog label")].every(l => Boolean(l.control))), true);
    await campo("Peso por unidad (lb)", "2/0");
    await texto("Añadir a Posesiones", "dialog[open]");
    assert.equal(await pagina.evaluate(() => window.pj().inventario.length), 0);
    assert.equal(await pagina.evaluate(() => document.querySelector('dialog input[aria-invalid="true"]')?.validity.customError), true);
    await campo("Peso por unidad (lb)", "2");
    for (let i=0; i<18; i++) { await pagina.keyboard.press("Tab"); assert.equal(await pagina.evaluate(() => Boolean(document.activeElement.closest("dialog[open]"))), true, `Tab ${i}: ${await pagina.evaluate(() => document.activeElement.outerHTML.slice(0,250))}`); }
    await guardar(ancho,"H03-H04-H06");
    await texto("Añadir a Posesiones", "dialog[open]"); await esperarDialogos(0);
    await pagina.waitForFunction(() => window.pj().inventario.length === 1);
    await pagina.evaluate(() => window.recargar());
    assert.deepEqual(await pagina.evaluate(() => window.pj().inventario.map(o => [o.cantidad,o.pesoLb])), [[3,2]]);
    await pagina.evaluate(() => window.pendiente());
    await click('button[title="Abrir Panel de Dados"]');
    const objeto = await pagina.waitForSelector('[title^="Ver descripción y detalles de AUDITORÍA CUERDA"]');
    await objeto.focus(); await pagina.keyboard.press("Enter"); await esperarDialogos(1); await objeto.dispose();
    await campo("Notas Personales", "NOTA AUDITORÍA");
    const guardarNotas = await pagina.waitForFunction(() => [...document.querySelectorAll("dialog button")].find(b => b.textContent.trim() === "Guardar Notas"));
    await guardarNotas.asElement().scrollIntoView();
    assert.equal(await guardarNotas.evaluate(b => { const r=b.getBoundingClientRect(); return [.1,.5,.9].every(x => [.2,.5,.8].every(y => b.contains(document.elementFromPoint(r.left+r.width*x,r.top+r.height*y)))); }), true);
    await guardar(ancho,"H07"); await guardarNotas.asElement().click(); await guardarNotas.dispose();
    await pagina.keyboard.press("Escape"); await esperarDialogos(0);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.pj().inventario[0].notas), "NOTA AUDITORÍA");
    await click('button[title="Minimizar panel"]');

    await pagina.evaluate(() => window.ir("rasgos"));
    const recuperacion = await pagina.waitForFunction(() => [...document.querySelectorAll("article")].find(a => a.textContent.toLowerCase().includes("recuperación arcana"))?.querySelector('button[title="Ver descripción completa en modal"]'));
    await recuperacion.asElement().scrollIntoView(); await recuperacion.asElement().click(); await esperarDialogos(1);
    await click('dialog button[title="Abrir recuperación de espacios de conjuro"]'); await esperarDialogos(2);
    await pagina.keyboard.press("Escape"); await esperarDialogos(1);
    assert.equal(await pagina.evaluate(() => document.activeElement.title), "Abrir recuperación de espacios de conjuro");
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[1]),1);
    await guardar(ancho,"H04-anidado"); await pagina.keyboard.press("Escape"); await esperarDialogos(0);
    assert.equal(await recuperacion.evaluate(b => document.activeElement === b),true); await recuperacion.dispose();

    await pagina.evaluate(() => window.ir("compendio", true));
    const detalle = await pagina.waitForSelector('button[aria-label^="Ver detalles de"]');
    await detalle.focus(); await pagina.keyboard.press("Enter"); await esperarDialogos(1);
    await pagina.keyboard.press("Escape"); await esperarDialogos(0);
    assert.equal(await detalle.evaluate(b => document.activeElement === b),true); await detalle.dispose();
    await guardar(ancho,"H05");
    const selector = await pagina.waitForSelector('main button[aria-haspopup="listbox"]');
    await selector.focus(); await pagina.keyboard.press("ArrowDown"); await pagina.keyboard.press("End");
    assert.equal(await pagina.evaluate(() => document.activeElement.getAttribute("role")),"option");
    await pagina.keyboard.press("Home"); await pagina.keyboard.press("Space");
    assert.equal(await selector.evaluate(b => b.getAttribute("aria-expanded")),"false");
    await pagina.keyboard.press("Enter"); await pagina.keyboard.press("Tab");
    assert.equal(await selector.evaluate(b => b.getAttribute("aria-expanded")),"false"); await selector.dispose();
    await guardar(ancho,"H08-selector");
    await click('button[title="Opciones de Homebrew"]');
    await pagina.waitForSelector('[role="menu"]');
    await pagina.keyboard.press("End");
    assert.equal(await pagina.evaluate(() => document.activeElement.textContent.trim()),"Listado / Editar");
    await pagina.keyboard.press("Home"); await pagina.keyboard.press("ArrowDown"); await pagina.keyboard.press("Escape");
    assert.equal(await pagina.evaluate(() => document.activeElement.getAttribute("aria-expanded")),"false");
    await guardar(ancho,"H08-menu");
    await pagina.evaluate(() => window.ir("jugadores"));
    await pagina.waitForFunction(() => [...document.querySelectorAll("main button")].some(b => b.textContent.includes("Iniciativa") && b.textContent.includes("+7")));
    await click('button[title="Configuración de la ficha"]');
    await pagina.waitForFunction(() => [...document.querySelectorAll("label")].find(l => l.textContent === "Nombre del Personaje")?.control);
    assert.equal(await pagina.evaluate(() => [...document.querySelectorAll("label")].filter(l => /Nombre del Personaje|Nombre del Jugador|Nivel Global Total|Puntos de Experiencia|Especie \/ Raza|Trasfondo|Alineamiento|URL de Imagen/.test(l.textContent)).every(l => Boolean(l.control))),true);
    await campo("Nombre del Personaje", "");
    assert.equal(await pagina.evaluate(() => [...document.querySelectorAll("label")].find(l => l.textContent === "Nombre del Personaje").control.validity.valueMissing),true);
    await guardar(ancho,"H06-identidad");
    await pagina.evaluate(() => window.ir("compendio")); await texto("Disponibles");
    const detalleJugador = await pagina.waitForSelector('main button[aria-label^="Ver detalles de"]');
    const aprendidos = await pagina.evaluate(() => JSON.stringify(window.pj().conjurosConocidos));
    await detalleJugador.focus(); await pagina.keyboard.press("Space"); await esperarDialogos(1);
    await pagina.keyboard.press("Escape"); await esperarDialogos(0);
    assert.equal(await detalleJugador.evaluate(b => document.activeElement === b),true); await detalleJugador.dispose();
    assert.equal(await pagina.evaluate(() => JSON.stringify(window.pj().conjurosConocidos)),aprendidos);
    await guardar(ancho,"H05-jugador");

    await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__selectores`, { waitUntil: "networkidle0" });
    await click('#selector'); await pagina.keyboard.press("ArrowDown");
    assert.equal(await pagina.evaluate(() => document.activeElement.textContent.trim()),"Beta");
    await pagina.evaluate(() => window.renderPadre());
    await pagina.waitForFunction(() => document.querySelector('output').textContent === '1');
    assert.equal(await pagina.evaluate(() => document.activeElement.textContent.trim()),"Beta");
    await pagina.keyboard.press("Enter");
    assert.equal(await pagina.$eval('#selector',b => b.textContent.trim()),"Beta");
    await click('#selector'); await pagina.evaluate(() => window.cambiarOpciones(['Alfa','Gamma']));
    await pagina.waitForFunction(() => document.querySelectorAll('[role="option"]').length === 2);
    assert.equal(await pagina.evaluate(() => document.activeElement.textContent.trim()),"Alfa");
    await pagina.keyboard.press("Escape");
    await guardar(ancho,"R03-foco-render");
    await click('#sugerencias'); await pagina.keyboard.type("Be"); await pagina.keyboard.press("End");
    await pagina.waitForFunction(() => document.querySelectorAll('[role="option"]').length === 1);
    assert.equal(await pagina.$eval('#sugerencias',campo => {
      const opcion = document.getElementById(campo.getAttribute('aria-activedescendant'));
      return opcion?.textContent.trim() === 'Beta' && opcion.dataset.activa === 'true';
    }),true);
    await pagina.keyboard.press("Enter");
    assert.equal(await pagina.$eval('#sugerencias',campo => campo.value),"Beta");
    await pagina.keyboard.down("Control"); await pagina.keyboard.press("KeyA"); await pagina.keyboard.up("Control");
    await pagina.keyboard.type("zzzz-no-existe");
    await pagina.waitForFunction(() => document.querySelectorAll('[role="option"]').length === 0);
    assert.equal(await pagina.$eval('#sugerencias',campo => campo.getAttribute('aria-activedescendant')),null);
    await pagina.keyboard.press("Escape");
    await guardar(ancho,"R04-filtro-activo");
    await click('#grupos');
    for (const esperado of ["Uno","Tres","Dos","Cuatro"]) {
      await pagina.keyboard.press("ArrowDown");
      assert.equal(await pagina.$eval('#grupos',campo => document.getElementById(campo.getAttribute('aria-activedescendant'))?.textContent.trim()),esperado);
    }
    await pagina.keyboard.press("Enter");
    assert.equal(await pagina.$eval('#grupos',campo => campo.value),"Cuatro");
    await guardar(ancho,"S01-orden-grupos");
  }
  assert.deepEqual(informe.errores, []);
} catch (error) {
  if (pagina) { await pagina.screenshot({ path: "scratch/auditoria-ui/fallo.png" }); fs.writeFileSync("scratch/auditoria-ui/fallo.txt", await pagina.evaluate(() => document.body.innerText)); }
  throw error;
} finally {
  fs.writeFileSync("scratch/auditoria-ui/resultado.json", JSON.stringify(informe, null, 2));
  await navegador?.close(); await servidor.close();
}
console.log(JSON.stringify(informe, null, 2));
