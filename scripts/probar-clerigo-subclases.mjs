import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";
import { htmlClerigo } from "./fixture-clerigo.mjs";

const html = htmlClerigo.replace('window.sembrar();createRoot', `
window.subrasgo=id=>window.pj().rasgos.find(r=>r.id===id);
window.sembrarDominio=(dominio,nivel=17)=>{
 const base={...structuredClone(PERSONAJE_POR_DEFECTO),nombre:'Dominio de prueba',especie:'',caracteristicas:{fuerza:10,destreza:14,constitucion:12,inteligencia:20,sabiduria:18,carisma:10}};
 const p=aplicarBuildClaseAPersonaje(base,'Clérigo',nivel,dominio);
 usarAlmacenDM.setState({personajes:[],colaIniciativa:[],notificaciones:[],rondaActual:1});
 const id=window.estado().crearPersonaje({...p,hpActual:10,hpMaximo:100,hpMaximoBase:100});
 usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',idPersonajeActivo:id});return id;
};
window.sembrarDominio('Dominio de la Vida');createRoot`);
const servidor = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error", plugins: [{
  name: "prueba-dominios", configureServer(s) { s.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__dominios") return next();
    try { res.setHeader("Content-Type", "text/html"); res.end(await s.transformIndexHtml(req.url, html)); } catch (error) { next(error); }
  }); }
}] });
const ejecutable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && fs.existsSync(p));
assert(ejecutable, "Se requiere Chromium local.");
fs.mkdirSync("scratch", { recursive: true });
const informe = { entorno: "Chromium local, aplicación y serializador reales, dados locales; sin TaleSpire", casos: [], dimensiones: [], errores: [] };
let navegador; let pagina;
try {
  await servidor.listen();
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  pagina = await navegador.newPage(); pagina.setDefaultTimeout(15000);
  pagina.on("pageerror", error => informe.errores.push(error.message));
  const limpiarAvisos = async () => { for (const aviso of await pagina.$$('[class*="toast"] button[title="Cerrar"]')) await aviso.click(); };
  const click = async selector => { await limpiarAvisos(); const e = await pagina.waitForSelector(selector); await e.scrollIntoView(); await e.click(); };
  const boton = async (texto, ambito = "body") => {
    await limpiarAvisos();
    const e = await pagina.waitForFunction((t, a) => [...document.querySelectorAll(`${a} button`)].find(b => b.textContent.trim() === t), {}, texto, ambito);
    await e.asElement().scrollIntoView(); await e.asElement().click(); await e.dispose();
  };
  const tarjeta = async (nombre, selector) => {
    await limpiarAvisos();
    const e = await pagina.waitForFunction((n, s) => [...document.querySelectorAll("article")].find(a => a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /, "") === n)?.querySelector(s), {}, nombre, selector);
    await e.asElement().scrollIntoView(); await e.asElement().click(); await e.dispose();
  };
  const dimension = async (ancho, flujo) => {
    const medida = await pagina.evaluate(() => ({ ancho: innerWidth, documento: document.documentElement.scrollWidth,
      dialogos: [...document.querySelectorAll('dialog[open]')].map(e => { const r = e.getBoundingClientRect(); return { izquierda: r.left, derecha: r.right, alto: r.height }; }) }));
    assert(medida.documento <= ancho + 1, `Desbordamiento horizontal en ${flujo}`);
    for (const d of medida.dialogos) assert(d.izquierda >= 0 && d.derecha <= ancho + 1 && d.alto <= 760, `Diálogo fuera del viewport: ${flujo}`);
    informe.dimensiones.push({ flujo, ...medida });
    await pagina.screenshot({ path: `scratch/dominios-${flujo}-${ancho}.png` });
  };
  const sembrar = async (dominio, nivel = 17) => {
    const id = await pagina.evaluate((d, n) => window.sembrarDominio(d, n), dominio, nivel);
    await pagina.waitForFunction(id => document.querySelector(`article[data-personaje-id="${id}"]`), {}, id);
  };
  const resolver = nombre => click(`button[aria-label="Resolver ${nombre}"]`);
  const check = async texto => {
    const e = await pagina.waitForFunction(t => [...document.querySelectorAll('label')].find(l => l.textContent.includes(t))?.querySelector('input[type="checkbox"]'), {}, texto);
    await e.asElement().scrollIntoView(); await e.asElement().click(); await e.dispose();
  };
  const seleccionar = async texto => { await click('dialog[open] button[title="Resultado del rasgo"]'); await boton(texto, 'dialog[open]'); };
  const escribirNumero = async (selector, numero) => {
    await click(selector); await pagina.keyboard.down("Control"); await pagina.keyboard.press("KeyA"); await pagina.keyboard.up("Control");
    await pagina.keyboard.type(String(numero)); await pagina.keyboard.press("Tab");
  };

  for (const ancho of [599, 433]) {
    await pagina.setViewport({ width: ancho, height: 760 });
    await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__dominios`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await resolver("Canalizar divinidad: Preservar vida");
    await dimension(ancho, "preservar-cancelar"); await pagina.keyboard.press("Escape");
    assert.equal(await pagina.evaluate(() => window.rasgo("canalizar_divinidad").usosRestantes), 3);
    await resolver("Canalizar divinidad: Preservar vida");
    await check("Condición de activación requerida"); await check("Aplicar a mi personaje");
    await escribirNumero('dialog[open] input[type="number"], dialog[open] input[inputmode="numeric"]', 20);
    await boton("Confirmar resolución", 'dialog[open]');
    await pagina.waitForFunction(() => window.pj().hpActual === 30);
    assert.equal(await pagina.evaluate(() => window.rasgo("canalizar_divinidad").usosRestantes), 2);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.pj().hpActual), 30);
    informe.casos.push({ ancho, flujo: "Vida: cancelación, reparto propio, coste único y recarga" });

    await sembrar("Dominio de la Vida", 6);
    await click('button[title="Acciones de Combate, Armas y Conjuros"]');
    const lanzarCurar = await pagina.waitForFunction(() => [...document.querySelectorAll('button[title="Ver descripción y ficha completa del conjuro"]')]
      .find(b => b.textContent.trim() === "Curar heridas")?.closest('[class*="_tarjeta_"]')?.querySelector('button[title^="Lanzar con ranura"]'));
    await lanzarCurar.asElement().scrollIntoView(); await lanzarCurar.asElement().click();
    await pagina.waitForSelector('[role="dialog"], dialog[open]'); await pagina.keyboard.press("Escape");
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados["1"] ?? 0), 0);
    await lanzarCurar.evaluate(b => { b.click(); b.click(); }); await lanzarCurar.dispose();
    await dimension(ancho, "curacion-conjuro"); await boton("Sí, recuperan PG en este turno");
    await pagina.waitForFunction(() => window.subrasgo("rasgo_sub_vida_sanador_bendito").resolucionesCuracionPendientes?.length === 1);
    await click('button[title="Más pestañas: Rasgos, Notas e Iniciativa"]');
    await boton("Rasgos"); await pagina.evaluate(() => window.recargar());
    await check("este lanzamiento con espacio acaba de hacer recuperar PG a otra criatura");
    await boton("Aplicar curación propia"); await pagina.waitForFunction(() => window.pj().hpActual === 13);
    assert.equal(await pagina.evaluate(() => window.subrasgo("rasgo_sub_vida_sanador_bendito").resolucionesCuracionPendientes.length), 0);
    informe.casos.push({ ancho, flujo: "Vida: lanzamiento real, bono condicionado, Sanador y recarga sin duplicación" });

    await sembrar("Dominio de la Luz", 6);
    await resolver("Fulgor protector"); await seleccionar("Desventaja y PG temporales al objetivo del ataque");
    await check("Condición de activación requerida"); await check("Aplicar a mi personaje");
    await dimension(ancho, "fulgor");
    await pagina.evaluate(() => { window.TS = { dice: { isValidRollString: () => true, makeRollDescriptors: async () => { throw new Error("Fallo de emisión simulado"); } } }; });
    await boton("Confirmar resolución", 'dialog[open]');
    await pagina.waitForFunction(() => document.body.textContent.includes("TaleSpire no confirmó el rollId para la tirada."));
    assert.equal(await pagina.evaluate(() => window.subrasgo("rasgo_sub_luz_fulgor_protector").usosRestantes), 4);
    await pagina.evaluate(() => { delete window.TS; const b = [...document.querySelectorAll('dialog[open] button')].find(b => b.textContent.trim() === "Confirmar resolución"); b.click(); b.click(); });
    await pagina.waitForFunction(() => window.pj().hpTemporal > 0);
    assert.equal(await pagina.evaluate(() => window.subrasgo("rasgo_sub_luz_fulgor_protector").usosRestantes), 3);
    await pagina.evaluate(() => window.descansar());
    assert.equal(await pagina.evaluate(() => window.subrasgo("rasgo_sub_luz_fulgor_protector").usosRestantes), 4);
    await resolver("Canalizar divinidad: Resplandor del alba"); await boton("Confirmar resolución", 'dialog[open]');
    await pagina.waitForFunction(() => window.rasgo("canalizar_divinidad").usosRestantes === 2);
    informe.casos.push({ ancho, flujo: "Luz: Fulgor opcional, fallo simulado, doble clic, PG temporales, descanso y Resplandor" });

    await sembrar("Dominio del Engaño");
    await tarjeta("Bendición del embaucador", 'button[title="Rasgo inactivo (clic para activar)"]');
    await boton("Mi personaje", 'dialog[open]'); await click('dialog[open] button[aria-label="Confirmar activación"]');
    assert.equal(await pagina.evaluate(() => window.subrasgo("rasgo_sub_engano_bendicion_embaucador").activo), true);
    await tarjeta("Bendición del embaucador", 'button[title*="renovar"]');
    await boton("Otra criatura", 'dialog[open]'); await click('dialog[open] button[aria-label="Confirmar activación"]');
    await pagina.evaluate(() => window.recargar());
    assert.deepEqual(await pagina.evaluate(() => window.subrasgo("rasgo_sub_engano_bendicion_embaucador").selectores[0].valorActual), ["externo"]);
    await tarjeta("Canalizar divinidad: Invocar duplicidad", 'button[title="Rasgo inactivo (clic para activar)"]');
    await tarjeta("Canalizar divinidad: Invocar duplicidad", 'button[title="Rasgo activo (clic para desactivar)"]');
    await pagina.evaluate(() => window.recargar());
    await check("Elige tu personaje o una criatura"); await dimension(ancho, "duplicidad");
    await boton("Aplicar curación propia"); await pagina.waitForFunction(() => window.pj().hpActual === 27);
    assert.equal(await pagina.evaluate(() => window.subrasgo("rasgo_sub_engano_invocar_duplicidad").resolucionesCuracionPendientes.length), 0);
    informe.casos.push({ ancho, flujo: "Engaño: elección, renovación, finalización y curación persistente única" });

    await sembrar("Dominio de la Guerra", 6);
    await resolver("Canalizar divinidad: Golpe guiado"); await seleccionar("Ataque de otra criatura");
    await check("Condición de activación requerida");
    await escribirNumero('dialog[open] input[type="number"], dialog[open] input[inputmode="numeric"]', 8);
    await boton("Confirmar resolución", 'dialog[open]');
    await pagina.waitForFunction(() => document.body.textContent.includes("Total corregido: 18"));
    const seccion = 'section[aria-label="Lanzamientos de Canalizar divinidad: Bendición del dios de la guerra"]';
    for (const conjuro of ["Escudo de fe · Nivel 1", "Arma espiritual · Nivel 2"]) {
      await click(`${seccion} button[title="Conjuro concedido"]`); await boton(conjuro, seccion); await boton("Lanzar · 1 uso", seccion);
    }
    await pagina.waitForFunction(() => window.subrasgo("rasgo_sub_guerra_bendicion_dios_guerra").conjurosTemporales.length === 2);
    await boton("Atacar con Arma espiritual · sin otro gasto", seccion);
    assert.equal(await pagina.evaluate(() => window.rasgo("canalizar_divinidad").usosRestantes), 0);
    await dimension(ancho, "guerra"); await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.subrasgo("rasgo_sub_guerra_bendicion_dios_guerra").conjurosTemporales.length), 2);
    await boton("Finalizar Escudo de fe", seccion);
    assert.deepEqual(await pagina.evaluate(() => window.subrasgo("rasgo_sub_guerra_bendicion_dios_guerra").conjurosTemporales.map(e => e.conjuroId)), ["h_arma-espiritual"]);
    informe.casos.push({ ancho, flujo: "Guerra: ataque corregido, conjuros simultáneos y ataque posterior sin coste" });
  }
  assert.deepEqual(informe.errores, []);
  console.log(JSON.stringify(informe, null, 2));
} catch (error) {
  if (pagina) { await pagina.screenshot({ path: "scratch/dominios-error.png" }); fs.writeFileSync("scratch/dominios-error.html", await pagina.content()); }
  throw error;
} finally {
  fs.writeFileSync("scratch/clerigo-subclases-ui.json", JSON.stringify(informe, null, 2));
  await navegador?.close(); await servidor.close();
}
