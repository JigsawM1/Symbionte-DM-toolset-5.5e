import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";

const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react'; import {createRoot} from 'react-dom/client';
import App from '/src/App.tsx'; import '/src/index.css';
import {usarAlmacenDM} from '/src/almacen/usarAlmacenDM.ts';
import {HECHIZOS_INICIALES} from '/src/utiles/datosIniciales.ts';
import {PERSONAJE_POR_DEFECTO} from '/src/constantes/personajeConstantes.ts';
import {obtenerRasgosClaseYSubclase} from '/src/servicios/gestorClases.ts';
import {deshidratarPersonaje,hidratarPersonaje} from '/src/servicios/serializadorPersonaje.ts';
import {normalizarCondicionesRasgos} from '/src/servicios/rasgos/estadoCondicionesRasgos.ts';
usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',cargandoDatos:false,datosInicialesCargados:false,
 cargarDatosPersistidos:async()=>{},establecerEsGM:()=>{},personajes:[],idPersonajeActivo:'',colaIniciativa:[]});
window.estado=()=>usarAlmacenDM.getState();
window.pj=()=>window.estado().personajes.find(p=>p.id===window.estado().idPersonajeActivo);
window.rasgo=n=>window.pj().rasgos.find(r=>r.nombre===n);
window.ir=pestañaActiva=>usarAlmacenDM.setState({pestañaActiva});
window.recargar=()=>usarAlmacenDM.setState({personajes:[hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(window.pj()))))]});
window.expirar=()=>usarAlmacenDM.setState({personajes:[normalizarCondicionesRasgos(window.pj(),11)]});
window.sembrar=(nivel=9,subclase="")=>{
 usarAlmacenDM.setState({personajes:[],colaIniciativa:[],rondaActual:1,tipoTirada:'plano',notificaciones:[]});
 const id=window.estado().crearPersonaje({...structuredClone(PERSONAJE_POR_DEFECTO),nombre:'Hechicero de prueba',especie:'',clase:'Hechicero',subclase,nivel,
 clases:[{nombre:'Hechicero',subclase,nivel}],rasgos:obtenerRasgosClaseYSubclase('Hechicero',nivel,subclase),
 esLanzador:true,clasesLanzadoras:[{clase:'Hechicero',nivel,tipoLanzador:'completo',habilidadConjuro:'carisma',modeloConjuros:'preparados'}],
 espaciosConjuroMaximos:{'1':4,'2':3,'3':3,'4':3,'5':1}, caracteristicas:{fuerza:10,destreza:14,constitucion:14,inteligencia:12,sabiduria:10,carisma:18}});
 usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',idPersonajeActivo:id});return id;
};
window.configurarPruebaMagia=(actual,hechizo)=>usarAlmacenDM.setState({pestañaActiva:'caracteristicas',baseDatosHechizos:[hechizo],personajes:[{
 ...actual,nivel:10,clases:[...actual.clases,{nombre:'Mago',nivel:1,subclase:''}],
 clasesLanzadoras:[...actual.clasesLanzadoras,{clase:'Mago',nivel:1,tipoLanzador:'completo',habilidadConjuro:'inteligencia',modeloConjuros:'preparados'}],
 conjurosConocidosIds:[hechizo.id],conjurosPreparadosIds:[hechizo.id],espaciosConjuroGastados:{}}]});
window.configurarConjuro=(id='h_invocar-dragon')=>{
 const hechizo=HECHIZOS_INICIALES.find(h=>h.id===id);
 usarAlmacenDM.setState({pestañaActiva:'caracteristicas',baseDatosHechizos:[hechizo],personajes:[{...window.pj(),
 conjurosConocidosIds:[hechizo.id],conjurosPreparadosIds:[hechizo.id],espaciosConjuroGastados:{}}]});
};
window.sembrar();createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`;

const servidor = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error", plugins: [{
  name: "prueba-hechicero", configureServer(s) { s.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__hechicero") return next();
    try { res.setHeader("Content-Type", "text/html"); res.end(await s.transformIndexHtml(req.url, html)); } catch (e) { next(e); }
  }); }
}] });
const ejecutable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && fs.existsSync(p));
assert(ejecutable, "Se requiere Chromium local.");
fs.mkdirSync("scratch", { recursive: true });
const informe = { casos: [], dimensiones: [], errores: [] };
let navegador;
let pagina;
try {
  await servidor.listen();
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  pagina = await navegador.newPage(); pagina.setDefaultTimeout(15000);
  pagina.on("pageerror", e => informe.errores.push(e.message));
  await pagina.setViewport({ width: 599, height: 760 });
  await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__hechicero`);
  const click = async selector => { await pagina.locator(selector).click(); };
  const texto = async (texto, raiz = "body") => {
    const h = await pagina.waitForFunction((t, r) => [...document.querySelectorAll(`${r} button`)].find(b => b.textContent.trim() === t), {}, texto, raiz);
    await h.asElement().scrollIntoView(); await h.asElement().click(); await h.dispose();
  };
  const tarjeta = async (nombre, selector) => {
    const h = await pagina.waitForFunction((n, s) => [...document.querySelectorAll("article")].find(a => a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /, "") === n)?.querySelector(s), {}, nombre, selector);
    await h.asElement().scrollIntoView(); await h.asElement().click(); await h.dispose();
  };
  const toggle = n => tarjeta(n, 'button[title^="Rasgo "]');
  const abrir = () => texto("Crear / convertir espacios");
  const validarDimensiones = async etiqueta => {
    const rect = await pagina.$eval('dialog[open]', e => { const r = e.getBoundingClientRect(); return { x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight }; });
    assert(rect.x >= 0 && rect.y >= 0 && rect.right <= rect.width + 1 && rect.bottom <= rect.height + 1, etiqueta);
  };
  for (const width of [599, 433]) for (const height of [760, 600]) {
    await pagina.setViewport({ width, height });
    await pagina.evaluate(() => window.sembrar());
    await toggle("Hechicería innata");
    await pagina.waitForFunction(() => window.rasgo('Hechicería innata').activo);
    assert.equal(await pagina.evaluate(() => window.rasgo('Hechicería innata').usosRestantes), 1);
    await toggle("Hechicería innata"); await toggle("Hechicería innata"); await toggle("Hechicería innata");
    await toggle("Hechicería innata");
    await pagina.waitForSelector('dialog[aria-label="Activar Hechicería innata"]');
    await validarDimensiones("Activación alternativa");
    await pagina.keyboard.press("Escape");
    assert.equal(await pagina.evaluate(() => window.rasgo('Fuente de magia').usosRestantes), 9);
    await toggle("Hechicería innata");
    await texto("Cancelar", "dialog");
    assert.equal(await pagina.evaluate(() => window.rasgo('Fuente de magia').usosRestantes), 9);
    await toggle("Hechicería innata");
    await pagina.$eval('button[aria-label="Confirmar activación"]', b => { b.click(); b.click(); });
    await pagina.waitForFunction(() => window.rasgo('Fuente de magia').usosRestantes === 7);
    await pagina.evaluate(() => window.expirar());
    assert.equal(await pagina.evaluate(() => window.rasgo('Hechicería innata').activo), false);

    await abrir(); await validarDimensiones("Conversión de espacios");
    await pagina.keyboard.press("Escape");
    assert.equal(await pagina.evaluate(() => Object.values(window.pj().espaciosConjuroAdicionales).reduce((a,b)=>a+b,0)), 0);
    await abrir(); await texto("Cancelar", "dialog");
    await abrir();
    await click('dialog button[title="Nivel del espacio"]'); await texto("Nivel 3 · 5 puntos", "dialog");
    await pagina.screenshot({ path: `scratch/hechicero-crear-${width}x${height}.png` });
    await pagina.$$eval('dialog button', botones => { const b=botones.find(b=>b.textContent.trim()==='Confirmar creación');b.click();b.click(); });
    await pagina.waitForFunction(() => window.pj().espaciosConjuroAdicionales[3] === 1);
    assert.equal(await pagina.evaluate(() => window.rasgo('Fuente de magia').usosRestantes), 2);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroAdicionales[3]), 1);
    await abrir(); await texto("Convertir en puntos", "dialog");
    await click('dialog button[title="Espacio a convertir"]'); await texto("Nivel 3 · 1 adicionales", "dialog");
    await texto("Confirmar conversión", "dialog");
    await pagina.waitForFunction(() => window.rasgo('Fuente de magia').usosRestantes === 5);
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroAdicionales[3]), 0);

    await pagina.evaluate(() => window.ir('caracteristicas'));
    await click('button[title^="Descanso Corto"]');
    await pagina.waitForSelector('[aria-label="Restauración hechicera"]');
    await pagina.screenshot({ path: `scratch/hechicero-descanso-${width}x${height}.png` });
    await pagina.keyboard.press("Escape");
    assert.equal(await pagina.evaluate(() => window.rasgo('Restauración hechicera').usosRestantes), 1);
    await click('button[title^="Descanso Corto"]');
    await texto("Recuperar 4 puntos", '[role="dialog"]');
    await pagina.waitForFunction(() => window.rasgo('Fuente de magia').usosRestantes === 9);
    assert.equal(await pagina.evaluate(() => window.rasgo('Restauración hechicera').usosRestantes), 0);
    await pagina.keyboard.press("Escape");
    await click('button[title^="Descanso Corto"]');
    assert.equal(await pagina.$('[aria-label="Restauración hechicera"]'), null);
    await pagina.keyboard.press("Escape");
    await click('button[title^="Descanso Largo"]');
    await pagina.waitForFunction(() => window.rasgo('Restauración hechicera').usosRestantes === 1);
    await pagina.keyboard.press("Escape");
    await pagina.evaluate(() => window.ir('rasgos'));
    await pagina.evaluate(() => window.estado().agregarRasgoPersonaje(window.pj().id, {
      ...structuredClone(window.rasgo('Crear espacios de conjuro')), id:'hb_conversion',nombre:'Alquimia de espacios',origen:'personalizado',personalizado:true
    }));
    await tarjeta('Alquimia de espacios','button[title="Editar rasgo"]');
    await pagina.waitForFunction(() => document.body.textContent.includes('Intercambio y recuperación de recursos'));
    const campoCoste = await pagina.evaluateHandle(() => [...document.querySelectorAll('label')].find(l => l.textContent.trim() === 'Coste en puntos')?.querySelector('input'));
    assert(campoCoste.asElement(), 'El constructor expone los costes declarativos');
    await campoCoste.asElement().scrollIntoView(); await campoCoste.asElement().click();
    await pagina.keyboard.down('Control'); await pagina.keyboard.press('A'); await pagina.keyboard.up('Control');
    await pagina.keyboard.type('3'); await pagina.keyboard.press('Tab'); await campoCoste.dispose();
    await pagina.screenshot({path: `scratch/hechicero-builder-${width}x${height}.png`});
    await click('button[title="Guardar rasgo en este personaje"]');
    await pagina.waitForFunction(() => window.rasgo('Alquimia de espacios').personalizado && window.rasgo('Alquimia de espacios').conversionEspacios.tabla[0].coste === 3);
    await tarjeta('Alquimia de espacios','button[aria-label^="Crear o convertir"]'); await texto('Confirmar creación','dialog');
    await pagina.waitForFunction(() => window.rasgo('Fuente de magia').usosRestantes === 6);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.rasgo('Alquimia de espacios').conversionEspacios.tabla[0].coste),3);
    await pagina.evaluate(() => {
      window.sembrar();
      const p=window.pj();
      window.estado().alternarActivoRasgo(p.id,window.rasgo('Hechicería innata').id);
      const hechizo={id:'h_prueba_emision',nombre:'Conjuro de prueba',nivel:1,escuela:'Evocación',clases:['Hechicero','Mago'],
        ataqueCd:'ATAQUE',requiereAtaque:true,dadosDaño:'1d6',descripcion:'Conjuro para verificar recursos y procedencia.',alcance:'60 pies',tiempoLanzamiento:'Acción',
        componentesSeleccionados:{verbal:true,somatico:true,material:false}};
      window.formulas=[];window.falloEmision=true;
      window.TS={dice:{isValidRollString:()=>true,makeRollDescriptors:async roll=>{window.formulas.push(roll);return [{name:'Prueba',roll:'1d20'}];},
        putDiceInTray:async()=>{if(window.falloEmision)throw Error('Fallo de prueba');return 'tirada-prueba';}},
        chat:{send:async()=>{if(window.falloEmision)throw Error('Fallo de chat de prueba');}},debug:{log:()=>{}}};
      const actual=window.pj();
      window.configurarPruebaMagia(actual,hechizo);
    });
    const tabMagia=await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Conjuros y Magia')));
    await tabMagia.asElement().scrollIntoView();await tabMagia.asElement().click();await tabMagia.dispose();
    await pagina.waitForSelector('button[title="Clase de lanzamiento"]');
    const cdVisible = () => pagina.evaluate(() => [...document.querySelectorAll('[class*="tarjetaEstadistica"]')]
      .find(e=>e.textContent.includes('CD Salvación'))?.textContent.trim());
    assert.match(await cdVisible(),/17/);
    await click('button[title^="Lanzar con ranura de Nivel"]');
    await pagina.waitForFunction(() => window.formulas.length > 0);
    assert.equal(await pagina.evaluate(()=>window.pj().espaciosConjuroGastados[1]??0),0);
    assert.match(await pagina.evaluate(()=>window.formulas[0]),/Ventaja 2/);
    await pagina.evaluate(()=>{window.falloEmision=false;window.formulas=[];delete window.TS;});
    await click('button[title^="Lanzar con ranura de Nivel"]');
    await pagina.waitForFunction(()=>window.pj().espaciosConjuroGastados[1]===1);
    await click('button[title="Clase de lanzamiento"]');await texto('Mago');
    assert.match(await cdVisible(),/13/);
    await pagina.screenshot({path:`scratch/hechicero-multiclase-${width}x${height}.png`});

    await pagina.evaluate(() => window.sembrar(18,'Hechicería Aberrante'));
    await toggle('Revelación de la carne'); await validarDimensiones('Revelación');
    await click('button[aria-label="Seleccionar Adaptación acuática"]');
    await pagina.keyboard.press('Escape');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Fuente de magia').usosRestantes),18);
    await toggle('Revelación de la carne'); await texto('Cancelar','dialog');
    await toggle('Revelación de la carne');
    await click('button[aria-label="Seleccionar Adaptación acuática"]');
    await click('button[aria-label="Seleccionar Vuelo reluciente"]');
    await pagina.screenshot({path:`scratch/hechicero-revelacion-${width}x${height}.png`});
    await pagina.$eval('button[aria-label="Confirmar activación"]', b=>{b.click();b.click();});
    await pagina.waitForFunction(()=>window.rasgo('Fuente de magia').usosRestantes===16);
    await pagina.evaluate(()=>window.recargar());
    assert.equal(await pagina.evaluate(()=>window.rasgo('Revelación de la carne').activo),true);
    await toggle('Revelación de la carne');
    await tarjeta('Hechicería psiónica','[title="Ver detalle completo del rasgo"]');
    assert.equal(await pagina.$('[aria-label="Lanzamientos de Hechicería psiónica"]'),null);
    await texto('Cerrar');
    await pagina.evaluate(()=>window.configurarConjuro('h_brazos-de-hadar'));
    const magiaPsionica=await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Conjuros y Magia')));
    await magiaPsionica.asElement().scrollIntoView();await magiaPsionica.asElement().click();await magiaPsionica.dispose();
    const lanzarPsionico=()=>click('button[title^="Lanzar con ranura de Nivel"]');
    const esperarPsionico=()=>pagina.waitForSelector('dialog[aria-label="Lanzamiento de Brazos de Hadar"]');
    await lanzarPsionico(); await esperarPsionico(); await validarDimensiones('Lanzamiento psiónico');
    await pagina.keyboard.press('Escape');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Fuente de magia').usosRestantes),16);
    await lanzarPsionico();await esperarPsionico();await texto('Cancelar','dialog');
    assert.equal(await pagina.evaluate(()=>window.pj().espaciosConjuroGastados[1]??0),0);
    await lanzarPsionico();await esperarPsionico();
    await pagina.screenshot({path:`scratch/hechicero-psionico-${width}x${height}.png`});
    await pagina.$$eval('dialog button',bs=>{const b=bs.find(b=>b.textContent.startsWith('Con 1 punto de Fuente de magia'));b.click();b.click();});
    await pagina.waitForFunction(()=>window.rasgo('Fuente de magia').usosRestantes===15);
    assert.equal(await pagina.evaluate(()=>window.pj().espaciosConjuroGastados[1]??0),0);
    await lanzarPsionico();await esperarPsionico();
    await pagina.$$eval('dialog button',bs=>bs.find(b=>b.textContent.startsWith('Con espacio de conjuro')).click());
    await pagina.waitForFunction(()=>window.pj().espaciosConjuroGastados[1]===1);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Fuente de magia').usosRestantes),15);
    await pagina.evaluate(()=>window.estado().actualizarPersonaje(window.pj().id,{rasgos:window.pj().rasgos.map(r=>r.nombre==='Fuente de magia'?{...r,usosRestantes:0}:r)}));
    await lanzarPsionico();await esperarPsionico();
    assert.equal(await pagina.$$eval('dialog button',bs=>bs.find(b=>b.textContent.startsWith('Con 1 punto de Fuente de magia')).disabled),true);
    await pagina.keyboard.press('Escape');
    await pagina.evaluate(()=>window.estado().actualizarPersonaje(window.pj().id,{
      espaciosConjuroGastados:{'1':4},rasgos:window.pj().rasgos.map(r=>r.nombre==='Fuente de magia'?{...r,usosRestantes:2}:r)}));
    await lanzarPsionico();await esperarPsionico();
    assert.equal(await pagina.$$eval('dialog button',bs=>bs.find(b=>b.textContent.startsWith('Con espacio de conjuro')).disabled),true);
    await click('dialog button[aria-label="Con 1 punto de Fuente de magia"]');
    await pagina.waitForFunction(()=>window.rasgo('Fuente de magia').usosRestantes===1);
    assert.equal(await pagina.evaluate(()=>window.pj().espaciosConjuroGastados[1]),4);
    await pagina.evaluate(()=>{
      window.intentosPsionicos=0;
      window.TS={dice:{isValidRollString:()=>true,makeRollDescriptors:async()=>[{name:'Prueba',roll:'2d6'}],
        putDiceInTray:async()=>{throw Error('Fallo simulado');}},chat:{send:async()=>{window.intentosPsionicos++;throw Error('Fallo simulado');}},debug:{log:()=>{}}};
    });
    await lanzarPsionico();await esperarPsionico();
    await click('dialog button[aria-label="Con 1 punto de Fuente de magia"]');
    await pagina.waitForFunction(()=>window.intentosPsionicos>0);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Fuente de magia').usosRestantes),1);
    assert.equal(await pagina.evaluate(()=>window.pj().espaciosConjuroGastados[1]),4);
    await pagina.evaluate(()=>{delete window.TS;});

    await pagina.evaluate(()=>window.sembrar(18,'Hechicería del Mecanismo de Relojería'));
    assert.equal(await pagina.evaluate(()=>window.rasgo('Restaurar equilibrio').usosRestantes),4);
    await tarjeta('Restaurar equilibrio','button[title="Gastar 1 uso"]');
    await tarjeta('Restaurar equilibrio','button[title="Gastar 1 uso"]');
    await pagina.evaluate(()=>window.recargar());
    assert.equal(await pagina.evaluate(()=>window.rasgo('Restaurar equilibrio').usosRestantes),2);
    await texto('Crear salvaguarda'); await validarDimensiones('Bastión');
    await pagina.keyboard.press('Escape');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Fuente de magia').usosRestantes),18);
    await texto('Crear salvaguarda');
    await click('button[aria-label="Un dado más"]');await click('button[aria-label="Un dado más"]');
    await click('button[aria-label="Un dado menos"]');await click('button[aria-label="Un dado más"]');
    assert.equal(await pagina.$eval('input[aria-label="Dados de salvaguarda"]',e=>e.value),'3');
    await pagina.screenshot({path:`scratch/hechicero-bastion-${width}x${height}.png`});
    await pagina.$$eval('dialog button', bs=>{const b=bs.find(b=>b.textContent.includes('Confirmar salvaguarda'));b.click();b.click();});
    await pagina.waitForFunction(()=>window.rasgo('Bastión de la ley').dadosReserva===3);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Fuente de magia').usosRestantes),15);
    await texto('Gastar dados de salvaguarda');await texto('Confirmar tirada','dialog');
    await pagina.waitForFunction(()=>window.rasgo('Bastión de la ley').dadosReserva===2);
    await pagina.evaluate(()=>window.recargar());
    assert.equal(await pagina.evaluate(()=>window.rasgo('Bastión de la ley').dadosReserva),2);

    await pagina.evaluate(()=>window.sembrar(18,'Hechicería Dracónica'));
    await toggle('Alas de dragón');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Alas de dragón').usosRestantes),0);
    await toggle('Alas de dragón');
    await tarjeta('Alas de dragón','button[aria-label^="Recargar"]');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Fuente de magia').usosRestantes),15);
    await pagina.evaluate(()=>window.configurarConjuro());
    const magiaDragon=await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Conjuros y Magia')));
    await magiaDragon.asElement().scrollIntoView();await magiaDragon.asElement().click();await magiaDragon.dispose();
    await click('button[title^="Lanzar con ranura de Nivel"]');
    await pagina.waitForSelector('dialog[aria-label="Duración de Invocar dragón"]');await validarDimensiones('Duración de conjuro');
    await pagina.keyboard.press('Escape');
    assert.equal(await pagina.evaluate(()=>window.pj().espaciosConjuroGastados[5]??0),0);
    await click('button[title^="Lanzar con ranura de Nivel"]');
    await pagina.screenshot({path:`scratch/hechicero-dragon-${width}x${height}.png`});
    await texto('1 minuto sin concentración','dialog');
    await pagina.waitForFunction(()=>window.pj().espaciosConjuroGastados[5]===1);
    assert.equal(await pagina.evaluate(()=>window.pj().concentracionActualId??''),'');

    await pagina.evaluate(()=>window.sembrar(18,'Hechicería de Magia Salvaje'));
    await toggle('Mareas de caos');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Mareas de caos').usosRestantes),1);
    await toggle('Mareas de caos');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Mareas de caos').usosRestantes),1);
    await toggle('Mareas de caos');
    await pagina.evaluate(()=>window.ir('caracteristicas'));
    const iniciativa=await pagina.waitForFunction(()=>[...document.querySelectorAll('[class*="tarjetaMetricaInteractiva"]')].find(e=>e.textContent.includes('Iniciativa')));
    await iniciativa.asElement().scrollIntoView();await iniciativa.asElement().click();await iniciativa.dispose();
    await pagina.waitForFunction(()=>window.rasgo('Mareas de caos').usosRestantes===0&&!window.rasgo('Mareas de caos').activo);
    await pagina.evaluate(()=>window.ir('rasgos'));
    await texto('Tirar en la tabla'); await validarDimensiones('Tabla de oleadas');
    await texto('Determinar dos resultados','dialog');
    assert.equal(await pagina.$$eval('dialog button',bs=>bs.filter(b=>b.textContent.startsWith('Resolver resultado')).length),2);
    await pagina.screenshot({path:`scratch/hechicero-oleadas-${width}x${height}.png`});
    await texto('Resolver resultado 2','dialog');
    await pagina.waitForFunction(()=>window.rasgo('Tabla de Oleada de magia salvaje').resultadoTabla?.enviado);
    await texto('Cerrar tabla','dialog');
    await texto('Elegir efecto de oleada');await validarDimensiones('Oleada domada');
    assert.equal(await pagina.$$eval('dialog button',bs=>bs.filter(b=>b.textContent.startsWith('Resolver resultado')).length),24);
    await pagina.keyboard.press('Escape');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Oleada domada').usosRestantes),1);
    await pagina.evaluate(()=>{window.mensajes=[];window.TS={chat:{send:async m=>{window.mensajes.push(m);return false;}}};});
    await texto('Elegir efecto de oleada');await texto('Resolver resultado 1','dialog');
    await pagina.waitForFunction(()=>window.rasgo('Oleada domada').resultadoTabla?.enviado===false);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Oleada domada').usosRestantes),0);
    await pagina.evaluate(()=>{window.TS.chat.send=async m=>{window.mensajes.push(m);return true;};});
    await texto('Reintentar envío','dialog');
    await pagina.waitForFunction(()=>window.rasgo('Oleada domada').resultadoTabla?.enviado);
    assert.equal(await pagina.evaluate(()=>window.mensajes[0]===window.mensajes[1]),true);
    assert.equal(await pagina.evaluate(()=>window.rasgo('Oleada domada').usosRestantes),0);
    await texto('Cerrar tabla','dialog'); await pagina.evaluate(()=>{delete window.TS;});


    await pagina.evaluate(()=>window.sembrar(20,'Hechicería Aberrante'));
    await click('section[aria-label="Opciones de metamagia"] details summary');
    await click('input[aria-label="Aprender Conjuro Acelerado"]');
    await pagina.waitForFunction(()=>window.pj().rasgos.some(r=>r.idSelectorOrigen==='metamagia'&&r.nombre==='Conjuro Acelerado'));
    await pagina.screenshot({path:`scratch/hechicero-metamagia-${width}x${height}.png`});
    await pagina.$$eval('section[aria-label="Opciones de metamagia"] button',bs=>{const b=bs.find(b=>b.textContent.trim()==='Usar · 2 puntos');b.click();b.click();});
    await pagina.waitForFunction(()=>window.rasgo('Fuente de magia').usosRestantes===18);
    await toggle('Hechicería innata');
    await texto('Usar gratis este turno','section[aria-label="Opciones de metamagia"]');
    assert.equal(await pagina.evaluate(()=>window.rasgo('Fuente de magia').usosRestantes),18);
    await pagina.evaluate(()=>window.recargar());
    assert.equal(await pagina.evaluate(()=>window.rasgo('Metamagia').selectores[0].valorActual.length),1);
    informe.dimensiones.push({ width, height, flujos: "Clase general, cuatro subclases, builder, Metamagia, cancelación, persistencia y chat" });
  }
  informe.casos.push("Innata: gasto, activación con puntos, Escape/cancelación sin gasto y caducidad", "Creación/conversión visible con costes, persistencia y cancelación", "Descanso corto opcional, gasto diario y descanso largo", "Constructor: coste editable, guardado, ejecución y persistencia", "Conjuros: CD por clase, ventaja emitida y fallo de emisión sin gasto");
  informe.casos.push('Aberrante: selección, cancelación, gasto atómico y lanzamiento psiónico', 'Relojería: compra, gasto y persistencia de salvaguarda',
    'Dracónica: alas, recarga y variante de lanzamiento con cancelación', 'Salvaje: tabla doble, subtiradas y elección con cancelación', 'Metamagia: catálogo, aprendizaje, gasto, doble pulsación y uso gratuito');
  assert.deepEqual(informe.errores, []);
  fs.writeFileSync("scratch/informe-hechicero-ui.json", JSON.stringify(informe, null, 2));
  console.log(JSON.stringify(informe, null, 2));
} catch (error) {
  await pagina?.screenshot({ path: "scratch/hechicero-ui-fallo.png" });
  fs.writeFileSync("scratch/informe-hechicero-ui.json", JSON.stringify({ ...informe, fallo: String(error) }, null, 2));
  throw error;
} finally { await navegador?.close(); await servidor.close(); }
