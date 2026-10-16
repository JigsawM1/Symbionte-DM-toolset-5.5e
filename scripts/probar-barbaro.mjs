import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";

const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react'; import {createRoot} from 'react-dom/client';
import App from '/src/App.tsx'; import '/src/index.css';
import {usarAlmacenDM} from '/src/almacen/usarAlmacenDM.ts';
import {PERSONAJE_POR_DEFECTO} from '/src/constantes/personajeConstantes.ts';
import {obtenerRasgosClaseYSubclase} from '/src/servicios/gestorClases.ts';
import {calcularEstadisticasPersonaje} from '/src/almacen/selectores/usarEstadoPersonajes.ts';
import {deshidratarPersonaje,hidratarPersonaje} from '/src/servicios/serializadorPersonaje.ts';
import {OBJETOS_INICIALES} from '/src/utiles/datosIniciales.ts';
import {crearObjetoInventarioDesdeCompendio} from '/src/servicios/calculadorInventario.ts';
usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',cargandoDatos:false,datosInicialesCargados:false,
  cargarDatosPersistidos:async()=>{},establecerEsGM:()=>{},personajes:[],idPersonajeActivo:'',colaIniciativa:[]});
window.estado=()=>usarAlmacenDM.getState();
window.pj=()=>window.estado().personajes.find(p=>p.id===window.estado().idPersonajeActivo);
window.rasgo=n=>window.pj().rasgos.find(r=>r.nombre===n);
window.ir=v=>usarAlmacenDM.setState({pestañaActiva:v});
window.stats=()=>calcularEstadisticasPersonaje(window.pj());
window.recargar=()=>usarAlmacenDM.setState({personajes:[hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(window.pj()))))]});
window.armadura=()=>window.estado().agregarObjetoInventario(window.pj().id,crearObjetoInventarioDesdeCompendio(OBJETOS_INICIALES.find(o=>o.nombre==='Armadura de Bandas')));
window.sembrar=(nivel=17)=>{
  usarAlmacenDM.setState({personajes:[],colaIniciativa:[],rondaActual:1,tipoTirada:'plano'});
  const id=window.estado().crearPersonaje({...structuredClone(PERSONAJE_POR_DEFECTO),nombre:'Bárbaro de prueba',especie:'',clase:'Bárbaro',subclase:'',nivel,
    clases:[{nombre:'Bárbaro',subclase:'',nivel}],rasgos:obtenerRasgosClaseYSubclase('Bárbaro',nivel),
    caracteristicas:{fuerza:18,destreza:20,constitucion:16,inteligencia:10,sabiduria:12,carisma:10}});
  usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',idPersonajeActivo:id});return id;
};
window.sembrar();createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`;
const servidor = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error", plugins: [{
  name: "prueba-barbaro", configureServer(s) { s.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__barbaro") return next();
    try { res.setHeader("Content-Type", "text/html"); res.end(await s.transformIndexHtml(req.url, html)); } catch (e) { next(e); }
  }); }
}] });
const ejecutable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && fs.existsSync(p));
assert(ejecutable, "Se requiere Chromium local.");
fs.mkdirSync("scratch", { recursive: true });
const informe = { casos: [], dimensiones: [], errores: [] };
let navegador;
try {
  await servidor.listen();
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  const pagina = await navegador.newPage();
  pagina.setDefaultTimeout(12000);
  const tiradas = [];
  pagina.on("console", m => { if (m.text().includes("Preparando tirada:")) tiradas.push(m.text()); });
  pagina.on("pageerror", e => informe.errores.push(e.message));
  await pagina.setViewport({ width: 599, height: 760 });
  await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__barbaro`);
  await pagina.waitForSelector('section[aria-label="Resistencias e inmunidades"]');
  const pulsar = async (nombre, selector) => {
    const h = await pagina.evaluateHandle((n, s) => {
      const tarjeta = [...document.querySelectorAll("article")].find(a => a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /, "") === n);
      return tarjeta?.querySelector(s);
    }, nombre, selector);
    const boton = h.asElement(); assert(boton, `Falta control de ${nombre}: ${selector}`);
    await boton.scrollIntoView(); await boton.click(); await h.dispose();
  };
  const toggle = n => pulsar(n, 'button[title^="Rasgo "]');
  const esperar = condicion => pagina.waitForFunction(condicion);
  const click = async selector => { const e = await pagina.waitForSelector(selector); await e.scrollIntoView(); await e.click(); };
  const cerrarModal = () => click('button[title="Cerrar modal"]');
  assert.equal(await pagina.evaluate(() => window.pj().rasgos.filter(r=>r.origen==='dote').length),0);
  await toggle("Furia");
  await esperar(() => window.rasgo('Furia').activo && window.rasgo('Furia').usosRestantes===5);
  assert.equal(await pagina.evaluate(() => window.pj().efectosActivos.find(e=>e.nombre==='Furia').expiraRonda),101);
  assert.match(await pagina.$eval('section[aria-label="Resistencias e inmunidades"]',e=>e.textContent),/Contundente/);
  informe.casos.push("Furia: activación visible, gasto único, duración y resistencias");
  await pulsar("Conocimiento primigenio",'button[title="Ver descripción completa en modal"]');
  const naturaleza = await pagina.waitForFunction(() => [...document.querySelectorAll('button[class*="opcionSelectorCard"]')].find(b=>b.textContent.trim()==='Naturaleza'));
  await naturaleza.asElement().scrollIntoView(); await naturaleza.asElement().click(); await naturaleza.dispose();
  await esperar(() => window.rasgo('Conocimiento primigenio').selectores[0].valorActual[0]==='naturaleza');
  await cerrarModal();
  assert.equal(await pagina.evaluate(() => window.stats().gradosHabilidadesEfectivos.naturaleza),'competente');
  await pagina.evaluate(() => window.ir('caracteristicas'));
  await pagina.waitForSelector('button[title="Característica para Acrobacias"]');
  const minimizar = await pagina.$('button[title="Minimizar panel"]'); if (minimizar) await minimizar.click();
  assert.equal(await pagina.$eval('button[title="Característica para Acrobacias"]',e=>e.textContent.trim()),'Des');
  let desde=tiradas.length;
  await click('[title^="Prueba de Acrobacias"] [class*="nombreHabilidad"]');
  await esperar(() => document.querySelector('[title^="Prueba de Acrobacias"]'));
  assert(tiradas.slice(desde).some(t=>t.includes('Acrobacias') && t.includes('+5') && !t.includes('Tipo original: ventaja')));
  await click('button[title="Característica para Acrobacias"]');
  const fuerza = await pagina.evaluateHandle(() => [...document.querySelectorAll('[class*="selectorCaracteristicaHabilidad"] button[class*="opcion"]')].find(b=>b.textContent.trim()==='Fue'));
  assert(fuerza.asElement()); await fuerza.asElement().click(); await fuerza.dispose();
  desde=tiradas.length; await click('[title^="Prueba de Acrobacias"] [class*="nombreHabilidad"]');
  assert(tiradas.slice(desde).some(t=>t.includes('Acrobacias') && t.includes('+4') && t.includes('Tipo original: ventaja')));
  informe.casos.push("Conocimiento primigenio: elección de habilidad y característica efectiva con ventaja al emitir");
  await pagina.evaluate(() => { window.recargar(); window.ir('rasgos'); });
  await esperar(() => window.rasgo('Conocimiento primigenio').selectores[0].valorActual[0]==='naturaleza');
  assert.equal(await pagina.evaluate(() => window.rasgo('Furia').usosRestantes),5);
  informe.casos.push("Guardado y recarga conservan elección, activación y gasto");
  await toggle("Ataque temerario"); await toggle("Golpe brutal");
  await pagina.evaluate(() => window.estado().establecerTipoTirada('ventaja'));
  await pagina.evaluate(() => window.ir('ataques'));
  await pagina.waitForSelector('button[title^="Tirar Ataque con"]');
  const ataque = await pagina.evaluateHandle(() => [...document.querySelectorAll('button[title^="Tirar Ataque con"]')].find(b=>/sin armas|desarmado/i.test(b.title)));
  assert(ataque.asElement(),'Falta ataque desarmado');
  desde=tiradas.length; await ataque.asElement().scrollIntoView(); await ataque.asElement().click(); await ataque.dispose();
  assert(tiradas.slice(desde).some(t=>t.includes('Renuncia a ventaja') && !t.includes('Tipo original: ventaja')));
  const dano = await pagina.evaluateHandle(() => [...document.querySelectorAll('button[title^="Tirar Ataque con"]')]
    .find(b=>/sin armas|desarmado/i.test(b.title))?.closest('[class*="tarjetaAtaqueCompacta"]')?.querySelector('button[title^="Tirar Daño"]'));
  assert(dano.asElement(),'Falta daño desarmado');
  desde=tiradas.length; await dano.asElement().scrollIntoView(); await dano.asElement().click(); await dano.dispose();
  await esperar(() => !window.rasgo('Golpe brutal').activo);
  assert(tiradas.slice(desde).some(t=>t.includes('2d10')));
  informe.casos.push("Golpe brutal: interruptor, renuncia y daño extra con desactivación desde Ataques");
  await pagina.evaluate(()=>window.sembrar(15));
  await pagina.waitForSelector('section[aria-label="Resistencias e inmunidades"]');
  await pagina.evaluate(()=>window.estado().establecerUsosRestantesRasgoPersonaje(window.pj().id,window.rasgo('Furia').id,2));
  await toggle('Furia persistente');
  assert.equal(await pagina.evaluate(()=>window.rasgo('Furia persistente').usosRestantes),1);
  await pagina.evaluate(()=>window.ir('caracteristicas'));
  await pagina.waitForSelector('[class*="tarjetaMetricaInteractiva"]');
  const iniciativa=await pagina.evaluateHandle(()=>[...document.querySelectorAll('[class*="tarjetaMetricaInteractiva"]')].find(e=>e.textContent.includes('Iniciativa')));
  await iniciativa.asElement().scrollIntoView(); await iniciativa.asElement().click(); await iniciativa.dispose();
  await esperar(()=>window.rasgo('Furia').usosRestantes===5 && window.rasgo('Furia persistente').usosRestantes===0);
  assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').activo),false);
  informe.casos.push("Furia persistente: consentimiento previo y recuperación única tras iniciativa emitida");
  for (const width of [599,433]) for (const height of [760,600]) {
    await pagina.setViewport({width,height});
    await pagina.evaluate(()=>window.sembrar(17));
    await pagina.waitForSelector('section[aria-label="Resistencias e inmunidades"]');
    await toggle('Furia');
    for(const vista of ['rasgos','caracteristicas','ataques']) {
      await pagina.evaluate(v=>window.ir(v),vista);
      await pagina.waitForFunction(v=>window.estado().pestañaActiva===v,{},vista);
      if(vista==='caracteristicas') {
        await pagina.waitForSelector('button[title="Característica para Acrobacias"]');
        const panel = await pagina.$('[class*="panelHabilidades"]'); await panel.scrollIntoView();
        const cortadas = await pagina.evaluate(() => [...document.querySelectorAll('[class*="itemHabilidad"]')]
          .filter(e => { const b=e.getBoundingClientRect(); return b.left<0 || b.right>innerWidth; }).length);
        assert.equal(cortadas,0,`Habilidades recortadas en ${width}x${height}`);
      }
      if(vista==='ataques') await pagina.waitForSelector('button[title^="Tirar Ataque con"]');
      const desborde=await pagina.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
      assert(!desborde,`Desborde horizontal en ${vista} ${width}x${height}`);
      await pagina.screenshot({path:`scratch/barbaro-${vista}-${width}x${height}.png`});
      informe.dimensiones.push({vista,width,height});
    }
  }
  await pagina.evaluate(()=>{window.sembrar(14);}); await pagina.waitForSelector('section[aria-label="Resistencias e inmunidades"]');
  await toggle('Furia');
  await pagina.evaluate(()=>window.estado().aplicarCondicionPersonaje(window.pj().id,'Incapacitado'));
  await esperar(()=>!window.rasgo('Furia').activo);
  await pagina.evaluate(()=>window.sembrar(15)); await toggle('Furia');
  await pagina.evaluate(()=>window.estado().aplicarCondicionPersonaje(window.pj().id,'Incapacitado'));
  assert(await pagina.evaluate(()=>window.rasgo('Furia').activo));
  informe.casos.push("Finalización por estados antes/después de nivel 15");
  for (const width of [599,433]) for (const height of [760,600]) {
    await pagina.setViewport({width,height});
    await pagina.evaluate(()=>{window.sembrar(15);window.armadura();});
    await toggle('Furia');
    await pagina.evaluate(()=>window.ir('inventario'));
    await click('button[title="Equipar objeto"]');
    await esperar(()=>!window.rasgo('Furia').activo);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').usosRestantes),4);
    assert.equal(await pagina.evaluate(()=>window.pj().efectosActivos.some(e=>e.nombre==='Furia')),false);
    await pagina.screenshot({path:`scratch/barbaro-armadura-equipada-${width}x${height}.png`});
    await pagina.evaluate(()=>window.ir('rasgos'));
    const bloqueo=await pagina.waitForSelector('button[title="La armadura pesada impide activar este rasgo."]');
    assert(await bloqueo.evaluate(b=>b.disabled));
    await bloqueo.scrollIntoView(); await bloqueo.click();
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').activo),false);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Furia').usosRestantes),4);
    await pagina.screenshot({path:`scratch/barbaro-furia-bloqueada-${width}x${height}.png`});
    await pagina.evaluate(()=>window.ir('inventario'));
    await click('button[title="Desequipar objeto"]');
    await pagina.evaluate(()=>window.ir('rasgos'));
    await toggle('Furia');
    await esperar(()=>window.rasgo('Furia').activo && window.rasgo('Furia').usosRestantes===3);
    informe.dimensiones.push({vista:'equipar-armadura-y-bloquear-furia',width,height});
  }
  informe.casos.push("Armadura de Bandas del catálogo: equipar/desequipar desde Inventario, finalización y bloqueo sin gasto desde Rasgos");
  await pagina.evaluate(()=>window.sembrar(9)); await toggle('Furia');
  await pagina.evaluate(()=>window.ir('caracteristicas'));
  const magia = await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Conjuros y Magia')));
  await magia.asElement().scrollIntoView(); await magia.asElement().click(); await magia.dispose();
  const bloqueado = await pagina.waitForSelector('[title="Un rasgo activo impide lanzar conjuros."]');
  desde=tiradas.length; await bloqueado.scrollIntoView(); await bloqueado.click();
  assert.equal(tiradas.length,desde);
  assert(await pagina.evaluate(()=>document.body.textContent.includes('Un rasgo activo impide lanzar conjuros.')));
  informe.casos.push("Magia: bloqueo visible durante Furia y ausencia de emisión desde la ficha");
  assert.deepEqual(informe.errores,[]);
  fs.writeFileSync('scratch/informe-barbaro-ui.json',JSON.stringify(informe,null,2));
  console.log(JSON.stringify({casos:informe.casos.length,dimensiones:informe.dimensiones.length,errores:informe.errores.length}));
} catch(error) {
  fs.writeFileSync('scratch/informe-barbaro-ui.json',JSON.stringify({...informe,fallo:String(error)},null,2));
  throw error;
} finally {await navegador?.close();await servidor.close();}
