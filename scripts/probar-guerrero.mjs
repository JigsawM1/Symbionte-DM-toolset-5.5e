import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";

const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react'; import { createRoot } from 'react-dom/client';
import App from '/src/App.tsx'; import '/src/index.css';
import { usarAlmacenDM } from '/src/almacen/usarAlmacenDM.ts';
import { PERSONAJE_POR_DEFECTO } from '/src/constantes/personajeConstantes.ts';
import { calcularEstadisticasPersonaje } from '/src/almacen/selectores/usarEstadoPersonajes.ts';
import { obtenerRasgosClaseYSubclase } from '/src/servicios/gestorClases.ts';
usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',cargandoDatos:false,datosInicialesCargados:false,
  cargarDatosPersistidos:async()=>{},establecerEsGM:()=>{},personajes:[],idPersonajeActivo:'',colaIniciativa:[]});
window.sembrar=(nivel,subclase='')=>{
  usarAlmacenDM.setState({personajes:[],colaIniciativa:[],rondaActual:1});
  const id=usarAlmacenDM.getState().crearPersonaje({...structuredClone(PERSONAJE_POR_DEFECTO),nombre:'Guerrero de prueba',clase:'Guerrero',subclase,nivel,
    clases:[{nombre:'Guerrero',subclase,nivel}],hpActual:2,hpMaximo:100,hpMaximoBase:100,
    caracteristicas:{...PERSONAJE_POR_DEFECTO.caracteristicas,inteligencia:16},rasgos:obtenerRasgosClaseYSubclase('Guerrero',nivel,subclase)});
  usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',idPersonajeActivo:id});return id;
};
window.pj=()=>{const s=usarAlmacenDM.getState();return s.personajes.find(p=>p.id===s.idPersonajeActivo);};
window.rasgo=n=>window.pj().rasgos.find(r=>r.nombre===n);
window.estado=()=>usarAlmacenDM.getState();
window.stats=()=>calcularEstadisticasPersonaje(window.pj());
window.ir=v=>usarAlmacenDM.setState({pestañaActiva:v});
window.sembrar(9);
createRoot(document.getElementById('root')).render(React.createElement(App));window.listo=true;
</script></body></html>`;
const servidor = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error", plugins: [{
  name: "prueba-guerrero", configureServer(s) { s.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__guerrero") return next();
    try { res.setHeader("Content-Type", "text/html"); res.end(await s.transformIndexHtml(req.url, html)); } catch (e) { next(e); }
  }); }
}] });
const ejecutable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && fs.existsSync(p));
assert(ejecutable, "Se requiere un navegador Chromium local.");
const informe = { casos: [], dimensiones: [], errores: [] };
let navegador;
try {
  await servidor.listen();
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  const pagina = await navegador.newPage();
  pagina.on("pageerror", e => informe.errores.push(e.message));
  await pagina.setViewport({ width: 599, height: 760 });
  await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__guerrero`);
  await pagina.waitForSelector('section[aria-label="Resistencias e inmunidades"]');
  const pulsar = async (nombre, patron) => {
    const h = await pagina.evaluateHandle((n, p) => {
      const tarjeta = [...document.querySelectorAll("article")].find(a => a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /, "") === n);
      return tarjeta && [...tarjeta.querySelectorAll("button")].find(b => new RegExp(p).test(`${b.textContent} ${b.title}`));
    }, nombre, patron);
    const boton = h.asElement(); assert(boton, `Falta control de ${nombre}: ${patron}`);
    await boton.scrollIntoView(); await boton.click(); await h.dispose();
  };
  const pulsarTexto = async texto => {
    const h = await pagina.evaluateHandle(t => [...document.querySelectorAll("main button")].find(b => b.textContent.trim().startsWith(t)), texto);
    const boton = h.asElement(); assert(boton, `Falta botón ${texto}`); await boton.scrollIntoView(); await boton.click(); await h.dispose();
  };
  const esperar = async condicion => pagina.waitForFunction(condicion);
  await pulsar("Tomar aliento", "curar");
  await esperar(() => window.rasgo("Tomar aliento").usosRestantes === 2 && window.pj().hpActual > 2);
  const hp = await pagina.evaluate(() => window.pj().hpActual);
  await pulsar("Mente táctica", "Lanzar");
  await esperar(() => window.rasgo("Tomar aliento").usosRestantes === 1);
  assert.equal(await pagina.evaluate(() => window.pj().hpActual), hp);
  await pulsar("Mente táctica", "Recuperar 1 uso");
  await esperar(() => window.rasgo("Tomar aliento").usosRestantes === 2);
  informe.casos.push("Autocuración, gasto compartido sin curación y devolución manual");
  await pulsar("Indómito", "INACTIVO");
  await esperar(() => window.rasgo("Indómito").activo && window.rasgo("Indómito").usosRestantes === 0);
  await pagina.evaluate(() => window.ir("caracteristicas"));
  await pagina.waitForSelector('button[title^="Tirada de Salvación"]');
  await pagina.click('button[title^="Tirada de Salvación"]');
  await esperar(() => !window.rasgo("Indómito").activo);
  informe.casos.push("Indómito se consume y desactiva tras una salvación desde la hoja");
  await pagina.evaluate(() => window.sembrar(18, "Maestro del Combate"));
  await pagina.waitForSelector('section[aria-label="Opciones de maniobras"]');
  await pulsar("Supremacía en combate", "Lanzar");
  await esperar(() => window.rasgo("Supremacía en combate").usosRestantes === 5);
  await pagina.click('section[aria-label="Opciones de maniobras"] summary');
  await pagina.click('section[aria-label="Opciones de maniobras"] input[type="checkbox"]');
  await esperar(() => window.rasgo("Opciones de maniobras").selectores[0].valorActual.length === 1);
  informe.casos.push("Supremacía d12 y selección persistida de una maniobra informativa");
  await pagina.evaluate(() => window.sembrar(18, "Guerrero Psiónico"));
  await pagina.waitForSelector('section[aria-label="Opciones de poder psiónico"]');
  assert.equal(await pagina.$$eval('section[aria-label="Opciones de poder psiónico"] input[type="checkbox"]', els => els.length), 0);
  await pagina.evaluate(() => { window.estado().aplicarCondicionPersonaje(window.pj().id, "Asustado"); window.estado().aplicarCondicionPersonaje(window.pj().id, "Hechizado"); });
  await pulsar("Mente robusta", "INACTIVO");
  await esperar(() => !window.pj().condicionesActivas.length && window.rasgo("Poder psiónico").usosRestantes === 11);
  await pulsar("Bastión de fuerza", "INACTIVO");
  await esperar(() => window.rasgo("Bastión de fuerza").activo && window.stats().salvaciones.destreza === 2);
  await pagina.evaluate(() => { for (let i = 0; i < 10; i++) window.estado().avanzarRonda(); });
  await esperar(() => !window.rasgo("Bastión de fuerza").activo);
  await pulsar("Recuperar Bastión de fuerza", "INACTIVO");
  await esperar(() => window.rasgo("Bastión de fuerza").usosRestantes === 1 && window.rasgo("Poder psiónico").usosRestantes === 10);
  informe.casos.push("Consulta de poderes, retirada de condiciones, cobertura temporal y recarga del padre");
  await pagina.evaluate(() => window.ir("caracteristicas"));
  await pagina.waitForSelector('button[title^="Tirada de Salvación"]');
  await pulsarTexto("Conjuros");
  await pagina.waitForSelector('button[title^="Lanzar gratis"]');
  await pagina.click('button[title^="Lanzar gratis"]');
  await esperar(() => window.rasgo("Maestro telequinético").usosRestantes === 0 && Boolean(window.pj().concentracionActiva));
  assert.deepEqual(await pagina.evaluate(() => window.pj().espaciosConjuroGastados), {});
  informe.casos.push("Telequinesis gratuita desde la aplicación: consumo propio y concentración");
  for (const width of [599, 433]) for (const height of [760, 600]) {
    await pagina.setViewport({ width, height });
    for (const subclase of ["Maestro del Combate", "Campeón", "Caballero Arcano", "Guerrero Psiónico"]) {
      await pagina.evaluate(sub => window.sembrar(18, sub), subclase);
      await pagina.waitForSelector('section[aria-label="Resistencias e inmunidades"]');
      const medicion = await pagina.evaluate(() => {
        const elementos = [...document.querySelectorAll('main article, main section, main button, main input')].filter(el => el.getClientRects().length);
        const desbordes = elementos.filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(el => el.className);
        const ultimo = [...document.querySelectorAll('main button:not(:disabled)')].filter(el => el.getClientRects().length).at(-1);
        ultimo?.scrollIntoView({ block: 'center' });
        const r = ultimo?.getBoundingClientRect();
        const hit = r && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { desbordes, ultimoAccesible: Boolean(r && r.top >= 0 && r.bottom <= innerHeight && ultimo.contains(hit)) };
      });
      informe.dimensiones.push({ width, height, subclase, ...medicion });
      assert.deepEqual(medicion.desbordes, [], `Desbordes en ${subclase} ${width}x${height}`);
      assert(medicion.ultimoAccesible, `Último control inaccesible en ${subclase} ${width}x${height}`);
    }
  }
  await pagina.screenshot({ path: "scratch/guerrero-psionico-433.png" });
  await pagina.setViewport({ width: 433, height: 760 });
  await pagina.click('button[title="Añadir rasgo o dote personalizado"]');
  await pagina.waitForSelector('input[aria-label="Nombre del Rasgo o Dote"]');
  await pagina.type('input[aria-label="Nombre del Rasgo o Dote"]', "Recurso del constructor");
  await pulsarTexto("Añadir escalón: Dados por nivel");
  const entrada = await pagina.$('input[aria-label="Dados por nivel: valor 1"]');
  await entrada.click(); await pagina.keyboard.down("Control"); await pagina.keyboard.press("KeyA"); await pagina.keyboard.up("Control"); await pagina.keyboard.press("Backspace"); await entrada.type("1d8");
  await pulsarTexto("Añadir escalón: Usos por nivel");
  await pagina.$eval('input[aria-label="Usos por nivel: valor 1"]', el => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el, '3'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  const usos = await pagina.evaluateHandle(() => [...document.querySelectorAll('[class*="filaToggle"]')].find(el => el.textContent.includes("¿Tiene usos limitados o cargas?"))?.querySelector('input')?.closest('label'));
  await usos.asElement().scrollIntoView(); await usos.asElement().click(); await usos.dispose();
  await pagina.click('button[title="Guardar rasgo en este personaje"]');
  await esperar(() => Boolean(window.rasgo("Recurso del constructor")));
  assert.equal(await pagina.evaluate(() => window.rasgo("Recurso del constructor").formulaDados), "1d8");
  assert.equal(await pagina.evaluate(() => window.rasgo("Recurso del constructor").usosMaximos), 3);
  await pulsar("Recurso del constructor", "Editar");
  await pagina.waitForSelector('input[aria-label="Dados por nivel: valor 1"]');
  assert.equal(await pagina.$eval('input[aria-label="Dados por nivel: valor 1"]', el => el.value), "1d8");
  informe.casos.push("Rasgo nuevo del builder: tablas funcionales, guardado y reapertura");
  assert.deepEqual(informe.errores, []);
  fs.writeFileSync("scratch/informe-guerrero-ui.json", JSON.stringify(informe, null, 2));
  console.log(JSON.stringify({ casos: informe.casos.length, dimensiones: informe.dimensiones.length, errores: informe.errores.length }));
} catch (error) {
  fs.writeFileSync("scratch/informe-guerrero-ui.json", JSON.stringify({ ...informe, fallo: String(error) }, null, 2));
  throw error;
} finally { await navegador?.close(); await servidor.close(); }
