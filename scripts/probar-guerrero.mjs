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
import { OBJETOS_INICIALES } from '/src/utiles/datosIniciales.ts';
import { EsquemaObjetoInventario } from '/src/tipos/personaje.ts';
import { deshidratarPersonaje, hidratarPersonaje } from '/src/servicios/serializadorPersonaje.ts';
import { obtenerVelocidadesEfectivas } from '/src/servicios/rasgos/evaluadorMovilidadRasgos.ts';
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
window.velocidades=()=>obtenerVelocidadesEfectivas(window.pj());
window.recargarFicha=()=>usarAlmacenDM.setState({personajes:[hidratarPersonaje(deshidratarPersonaje(window.pj()))]});
window.equipar=()=>{
  const arma=OBJETOS_INICIALES.find(o=>o.nombre.toLowerCase()==='espada larga');
  if(!arma) throw new Error('Falta espada larga');
  usarAlmacenDM.setState({objetosHomebrew:OBJETOS_INICIALES});
  window.estado().actualizarPersonaje(window.pj().id,{inventario:[EsquemaObjetoInventario.parse({idInstancia:'espada-prueba',idObjeto:arma.id,nombre:arma.nombre,categoria:'armas',equipado:true})]});
};
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
  const tiradas = [];
  pagina.on("console", m => { if (m.text().includes("Preparando tirada:")) tiradas.push(m.text()); });
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
  const capturarOpciones = async (etiqueta, nombre) => {
    for (const width of [599, 433]) {
      await pagina.setViewport({width,height:760});
      const caja = await pagina.$(`section[aria-label="${etiqueta}"]`);
      await caja.evaluate(e => e.scrollIntoView({block:'start'}));
      await pagina.screenshot({path:`scratch/${nombre}-${width}.png`});
    }
    await pagina.setViewport({width:599,height:760});
  };
  const comprobarOrdenOpciones = async () => {
    assert.equal(await pagina.$eval('[data-seccion-rasgos="opciones"]', el => el.previousElementSibling?.dataset.seccionRasgos),
      "subclase", "La caja de opciones debe aparecer inmediatamente después de Subclase");
  };
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
  await pagina.waitForSelector('section[aria-label="Maniobras de combate"]');
  await comprobarOrdenOpciones();
  await pulsar("Supremacía en combate", "Lanzar");
  await esperar(() => window.rasgo("Supremacía en combate").usosRestantes === 5);
  await pagina.click('section[aria-label="Maniobras de combate"] summary');
  await capturarOpciones("Maniobras de combate", "maniobras-catalogo");
  await pagina.click('section[aria-label="Maniobras de combate"] input[type="checkbox"]');
  await esperar(() => window.rasgo("Opciones de maniobras").selectores[0].valorActual.length === 1);
  const buscarManiobra = async nombre => {
    const input = await pagina.$('input[aria-label="Buscar en Maniobras de combate"]');
    await input.click(); await pagina.keyboard.down("Control"); await pagina.keyboard.press("KeyA"); await pagina.keyboard.up("Control"); await input.type(nombre);
    await pagina.waitForFunction(n => [...document.querySelectorAll('section[aria-label="Maniobras de combate"] summary')].some(s => s.textContent.trim() === n), {}, nombre);
    await pagina.click('section[aria-label="Maniobras de combate"] summary');
  };
  await buscarManiobra("Finta");
  await pagina.click('input[aria-label="Aprender Finta"]');
  await esperar(() => Boolean(window.rasgo("Finta")));
  await pulsar("Finta", "INACTIVO");
  await esperar(() => window.rasgo("Finta").activo && window.rasgo("Supremacía en combate").usosRestantes === 4);
  await capturarOpciones("Maniobras de combate", "maniobras-ejecucion");
  await pagina.evaluate(() => { window.recargarFicha(); window.equipar(); window.ir("ataques"); });
  await pagina.waitForSelector('button[title^="Tirar Ataque con Espada Larga"]');
  assert.match(await pagina.$eval('button[title^="Tirar Ataque con Espada Larga"]', el => el.title), /Ventaja/);
  await pagina.click('button[title^="Tirar Ataque con Espada Larga"]');
  await esperar(() => window.rasgo("Finta").activo);
  assert.match(await pagina.$eval('button[title^="Tirar Daño a 1 Mano"]', el => el.title), /1d12/);
  await pagina.evaluate(() => { window.falloEmision=false; window.TS={dice:{isValidRollString:()=>true,
    makeRollDescriptors:async()=>[{name:'Prueba',roll:'1d8'}],putDiceInTray:async()=>{window.falloEmision=true;return '';}}}; });
  await pagina.click('button[title^="Tirar Daño a 1 Mano"]');
  await esperar(() => window.falloEmision && window.rasgo("Finta").activo);
  await pagina.evaluate(() => { delete window.TS; });
  await pagina.click('button[title^="Tirar Daño a 1 Mano"]');
  await esperar(() => !window.rasgo("Finta").activo);
  assert.equal(await pagina.evaluate(() => window.rasgo("Supremacía en combate").usosRestantes), 4);
  informe.casos.push("Maniobras: aprendizaje, gasto único, persistencia, ventaja y daño d12 con desactivación");
  await pagina.evaluate(() => window.ir("rasgos"));
  await pagina.waitForSelector('input[aria-label="Buscar en Maniobras de combate"]');
  await pagina.click('section[aria-label="Maniobras de combate"] > button[aria-expanded]');
  await pagina.waitForSelector('input[aria-label="Buscar en Maniobras de combate"]', { hidden: true });
  await pagina.click('section[aria-label="Maniobras de combate"] > button[aria-expanded]');
  await pagina.waitForSelector('input[aria-label="Buscar en Maniobras de combate"]');
  await buscarManiobra("Emboscada"); await pagina.click('input[aria-label="Aprender Emboscada"]');
  await esperar(() => Boolean(window.rasgo("Emboscada"))); await pulsar("Emboscada", "INACTIVO");
  await pagina.evaluate(() => window.ir("caracteristicas"));
  await pagina.waitForSelector('[title^="Prueba de Sigilo"]');
  await pagina.click('[title^="Prueba de Sigilo"]');
  await esperar(() => !window.rasgo("Emboscada").activo);
  assert.match(tiradas.at(-1), /1d20.*1d12/);
  informe.casos.push("Emboscada añade d12 a Sigilo desde la hoja y finaliza después de emitir");
  await pagina.evaluate(() => window.sembrar(18, "Guerrero Psiónico"));
  await pagina.waitForSelector('section[aria-label="Poderes psiónicos"]');
  await comprobarOrdenOpciones();
  assert.deepEqual(await pagina.$$eval('section[aria-label="Poderes psiónicos"] summary', els => els.map(el => el.textContent.trim())),
    ["Campo protector", "Golpe psiónico", "Movimiento telequinético", "Salto psiónico"],
    "Las extensiones se integran en su destino y no tienen una entrada independiente");
  assert.equal(await pagina.$$eval('section[aria-label="Poderes psiónicos"] input[type="checkbox"]', els => els.length), 0);
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
  const abrirPoder = async nombre => {
    const h = await pagina.evaluateHandle(n => [...document.querySelectorAll('section[aria-label="Poderes psiónicos"] summary')].find(s => s.textContent.trim() === n), nombre);
    const summary = h.asElement(); assert(summary, `Falta poder ${nombre}`); await summary.scrollIntoView(); await summary.click(); await h.dispose();
  };
  await abrirPoder("Campo protector"); await pulsar("Campo protector", "Lanzar");
  await esperar(() => window.rasgo("Poder psiónico").usosRestantes === 9);
  assert.match(tiradas.at(-1), /1d12\+3/);
  await abrirPoder("Movimiento telequinético"); await pulsar("Movimiento telequinético", "Gastar 1 uso");
  await esperar(() => window.rasgo("Movimiento telequinético").usosRestantes === 0);
  assert.equal(await pagina.evaluate(() => window.rasgo("Poder psiónico").usosRestantes), 9);
  await pulsar("Movimiento telequinético", "Recargar");
  await esperar(() => window.rasgo("Movimiento telequinético").usosRestantes === 1 && window.rasgo("Poder psiónico").usosRestantes === 8);
  await abrirPoder("Salto psiónico"); await pulsar("Salto psiónico", "INACTIVO");
  await esperar(() => window.velocidades().volar === 60 && window.rasgo("Salto psiónico").usosRestantes === 0);
  await capturarOpciones("Poderes psiónicos", "poderes-ejecucion");
  await pagina.evaluate(() => window.recargarFicha());
  assert.equal(await pagina.evaluate(() => window.velocidades().volar), 60);
  await pagina.evaluate(() => window.estado().avanzarRonda());
  await esperar(() => !window.rasgo("Salto psiónico").activo && !window.velocidades().volar);
  await pulsar("Salto psiónico", "Recargar");
  await esperar(() => window.rasgo("Salto psiónico").usosRestantes === 1 && window.rasgo("Poder psiónico").usosRestantes === 7);
  await abrirPoder("Golpe psiónico");
  await pulsar("Golpe psiónico", "Ver descripción completa en modal");
  await pagina.waitForSelector('button[title="Cerrar modal"]');
  assert.match(await pagina.$eval('[class*="contenedorModalDetalle"]', el => el.textContent), /Empujón telequinético/);
  await pagina.click('button[title="Cerrar modal"]');
  await pulsar("Golpe psiónico", "INACTIVO");
  await esperar(() => window.rasgo("Golpe psiónico").activo);
  await pagina.evaluate(() => { window.equipar(); window.ir("ataques"); });
  await pagina.waitForSelector('button[title^="Tirar Daño a 1 Mano"]');
  assert.match(await pagina.$eval('button[title^="Tirar Daño a 1 Mano"]', el => el.title), /\/1d12\+3/);
  await pagina.click('button[title="Tirar Daño Crítico a 1 Mano"]');
  await esperar(() => !window.rasgo("Golpe psiónico").activo);
  assert.match(tiradas.at(-1), /Fuerza.*2d12\+3/);
  informe.casos.push("Poderes: Campo, usos propios, recargas explícitas, Salto de un asalto y crítico de Fuerza separado");
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
  const activarCampo = async texto => {
    const h = await pagina.evaluateHandle(t => [...document.querySelectorAll('label')].find(l => l.textContent.trim() === t)?.querySelector('input'), texto);
    assert(h.asElement(), `Falta capacidad ${texto}`); await h.asElement().scrollIntoView(); await h.asElement().click(); await h.dispose();
  };
  await activarCampo("Desactivar tras emitir daño");
  await activarCampo("Recargar un uso gastando el recurso padre");
  const campoTiradas = await pagina.evaluateHandle(() => [...document.querySelectorAll('label')].find(l => l.textContent.includes('Desactivar tras estas tiradas'))?.querySelector('input'));
  await campoTiradas.asElement().type("iniciativa,habilidad.sigilo"); await campoTiradas.dispose();
  await pagina.click('button[title="Guardar rasgo en este personaje"]');
  await esperar(() => window.rasgo("Recurso del constructor")?.recargarUsoConPadre);
  assert.deepEqual(await pagina.evaluate(() => window.rasgo("Recurso del constructor").autoDesactivarEnTirada), ["iniciativa", "habilidad.sigilo"]);
  informe.casos.push("Rasgo nuevo del builder: tablas funcionales, guardado y reapertura");
  assert.deepEqual(informe.errores, []);
  fs.writeFileSync("scratch/informe-guerrero-ui.json", JSON.stringify(informe, null, 2));
  console.log(JSON.stringify({ casos: informe.casos.length, dimensiones: informe.dimensiones.length, errores: informe.errores.length }));
} catch (error) {
  fs.writeFileSync("scratch/informe-guerrero-ui.json", JSON.stringify({ ...informe, fallo: String(error) }, null, 2));
  throw error;
} finally { await navegador?.close(); await servidor.close(); }
