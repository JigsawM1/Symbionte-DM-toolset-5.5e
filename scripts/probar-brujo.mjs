import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";

const html=`<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import App from '/src/App.tsx';import '/src/index.css';
import {usarAlmacenDM} from '/src/almacen/usarAlmacenDM.ts';import {PERSONAJE_POR_DEFECTO} from '/src/constantes/personajeConstantes.ts';
import {aplicarBuildClaseAPersonaje} from '/src/servicios/gestorClases.ts';
import {deshidratarPersonaje,hidratarPersonaje} from '/src/servicios/serializadorPersonaje.ts';
import {procesarResultadosDadosTaleSpire} from '/src/utiles/lanzadorDados.ts';
window.simularDados=()=>{
 window.tiradas=[];window.modoDados='ok';
 window.TS={dice:{isValidRollString:()=>true,makeRollDescriptors:async formula=>[{name:'Prueba',roll:formula}],
 putDiceInTray:async descriptores=>{window.tiradas.push(descriptores);if(window.modoDados==='fallo')throw new Error('Fallo simulado');
 if(window.modoDados==='pausa')await new Promise(r=>window.continuarDados=r);return 'tirada-'+window.tiradas.length;},
 evaluateDiceResultsGroup:async grupo=>grupo.total,sendDiceResult:async()=>{}},chat:{send:async()=>{if(window.modoDados==='fallo')throw new Error('Fallo simulado de chat');return true;}},debug:{log:()=>{}}};
};
window.resultadoDados=total=>procesarResultadosDadosTaleSpire({rollId:'tirada-'+window.tiradas.length,resultsGroups:[{total}]});
usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',cargandoDatos:false,datosInicialesCargados:false,
cargarDatosPersistidos:async()=>{},establecerEsGM:()=>{},personajes:[],idPersonajeActivo:'',colaIniciativa:[]});
window.estado=()=>usarAlmacenDM.getState();window.pj=()=>window.estado().personajes.find(p=>p.id===window.estado().idPersonajeActivo);
window.rasgo=n=>window.pj().rasgos.find(r=>r.nombre===n);
window.sembrar=(nivel,subclase='')=>{
const p=aplicarBuildClaseAPersonaje({...structuredClone(PERSONAJE_POR_DEFECTO),id:'brujo-ui',nombre:'Brujo de prueba',especie:'',clase:'Brujo',nivel,
caracteristicas:{...PERSONAJE_POR_DEFECTO.caracteristicas,carisma:16},hpActual:2,hpMaximo:100,hpMaximoBase:100,
trucosConocidosIds:['h_descarga-sobrenatural','h_toque-helado'],rasgos:[]},'Brujo',nivel,subclase);
p.espaciosPactoGastados=p.espaciosPactoMaximos;
window.estado().seleccionarPersonajeActivo(null);usarAlmacenDM.setState({personajes:[p],colaIniciativa:[],rondaActual:1,idPersonajeActivo:p.id,esGM:false,pestañaActiva:'rasgos'});
};
window.recargar=()=>{const p=hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(window.pj()))));usarAlmacenDM.setState({personajes:[p]});};
window.sembrar(Number(new URLSearchParams(location.search).get('nivel'))||20,'Patrón Celestial');createRoot(document.getElementById('root')).render(React.createElement(App));window.listo=true;
</script></body></html>`;
const servidor=await createServer({server:{host:"127.0.0.1",port:0},logLevel:"error",plugins:[{
name:"prueba-brujo",configureServer(s){s.middlewares.use(async(req,res,next)=>{if(req.url?.split("?")[0]!=="/__brujo")return next();
try{res.setHeader("Content-Type","text/html");res.end(await s.transformIndexHtml(req.url,html));}catch(e){next(e);}});}}]});
const ejecutable=[process.env.CHROME_PATH,"C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p=>p&&fs.existsSync(p));
assert(ejecutable,"Se requiere Chromium local.");
const informe={casos:[],dimensiones:[],errores:[]};let navegador;
try{
await servidor.listen();navegador=await puppeteer.launch({executablePath:ejecutable,headless:true});
const pagina=await navegador.newPage();pagina.on("pageerror",e=>informe.errores.push(e.message));await pagina.setViewport({width:599,height:760});
await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__brujo`);await pagina.waitForFunction(()=>window.listo);
const pulsar=async(nombre,patron)=>{
 const minimizar=await pagina.$('button[title="Minimizar panel"]');if(minimizar)await minimizar.click();
 const h=await pagina.evaluateHandle((n,p)=>{const tarjeta=[...document.querySelectorAll('article')].find(a=>a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /,'')===n);
 return tarjeta&&[...tarjeta.querySelectorAll('button')].find(b=>new RegExp(p).test(`${b.textContent} ${b.title}`));},nombre,patron);
 const boton=h.asElement();assert(boton,`Falta control de ${nombre}: ${patron}`);await boton.evaluate(b=>b.scrollIntoView({block:'center'}));await boton.click();await h.dispose();};
const esperar=async fn=>{
 try { await pagina.waitForFunction(fn); }
 catch(error){
  console.log('Condición incumplida:',fn.toString(),await pagina.evaluate(()=>({trucos:window.pj().trucosConocidosIds,
    libro:window.rasgo('Pacto del grimorio')&&{activo:window.rasgo('Pacto del grimorio').activo,selectores:window.rasgo('Pacto del grimorio').selectores.map(s=>({id:s.id,valor:s.valorActual}))}})));
  await pagina.screenshot({path:'scratch/brujo-ui-fallo.png'});throw error;
 }
};
await pagina.waitForSelector('article');await pulsar('Astucia mágica','Usar y recuperar espacios');
await esperar(()=>window.pj().espaciosPactoGastados===0&&window.rasgo('Astucia mágica').usosRestantes===0&&window.pj().hpTemporal===23);
await pagina.evaluate(()=>window.recargar());assert.equal(await pagina.evaluate(()=>window.rasgo('Astucia mágica').usosRestantes),0);
informe.casos.push('Astucia mejorada recupera cuatro espacios; Resiliencia concede PG; gasto persiste al recargar');
await pagina.evaluate(()=>window.sembrar(14,'Patrón Infernal'));
await pagina.evaluate(()=>{window.estado().gastarUsoRasgoPersonaje(window.pj().id,window.rasgo('Arrojar al Infierno').id);window.estado().recuperarEspaciosPacto(window.pj().id);});
await pulsar('Arrojar al Infierno','Recargar uso con');await esperar(()=>window.rasgo('Arrojar al Infierno').usosRestantes===1&&window.pj().espaciosPactoGastados===1);
informe.casos.push('Recarga de un uso con un único espacio de pacto desde la tarjeta');
await pagina.evaluate(()=>window.sembrar(9));await pagina.waitForSelector('input[aria-label="Buscar invocaciones"]');
const seleccionarTodo=async()=>{await pagina.keyboard.down('Control');await pagina.keyboard.press('A');await pagina.keyboard.up('Control');};
const buscar=async texto=>{const input=await pagina.$('input[aria-label="Buscar invocaciones"]');await input.click();await seleccionarTodo();await input.press('Backspace');await input.type(texto);};
const invocacion=async(nombre,aprender=true)=>{
 const todas=await pagina.evaluateHandle(()=>[...document.querySelectorAll('button[aria-pressed]')].find(b=>b.textContent.trim()==='Todas'));
 if(todas.asElement())await todas.asElement().click();await todas.dispose();
 await buscar(nombre);
 try { await pagina.waitForFunction(n=>[...document.querySelectorAll('details > summary')].some(s=>s.textContent.startsWith(n)),{timeout:5000},nombre); }
 catch(error){fs.writeFileSync('scratch/brujo-ui-fallo.html',await pagina.content());await pagina.screenshot({path:'scratch/brujo-ui-fallo.png'});throw error;}
 const h=await pagina.evaluateHandle(n=>[...document.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent.startsWith(n)),nombre);
 const detalle=h.asElement();assert(detalle,`Falta invocación ${nombre}`);if(!await detalle.evaluate(d=>d.open)){const s=await detalle.$('summary');await s.scrollIntoView();await s.click();}
 const boton=await detalle.evaluateHandle(d=>[...d.querySelectorAll('button')].find(b=>b.textContent.includes('Aprender invocación')));
 if(aprender){assert.equal(await boton.evaluate(b=>b.disabled),false);await boton.asElement().click();}else assert.equal(await boton.evaluate(b=>b.disabled),true);
 await h.dispose();};
await invocacion('Castigo arcano',false);await invocacion('Pacto del filo');await invocacion('Castigo arcano');
await esperar(()=>window.pj().rasgos.some(r=>r.nombre==='Castigo arcano'));
await buscar('Pacto del filo');
assert.equal(await pagina.$eval('button[title="Otra invocación requiere esta elección; retira primero sus dependientes."]',b=>b.disabled),true);
await pagina.evaluate(()=>window.recargar());assert.equal(await pagina.evaluate(()=>window.rasgo('Castigo arcano').formulaDados),'6d8');
informe.casos.push('Aprendizaje bloqueado por requisito; adquisición y retirada bloqueada del padre; recarga de elecciones');
await pagina.evaluate(()=>window.sembrar(9));await invocacion('Descarga agónica');
const mostrarAprendidas=async()=>{
 const boton=await pagina.$('button[aria-pressed][class*="botonFiltroEstado"]');assert(boton);await boton.click();
 const summaries=await pagina.$$('details > summary');for(const summary of summaries){if(!await summary.evaluate(s=>s.parentElement.open))await summary.click();}
};
const elegirDesplegable=async(titulo,etiqueta)=>{
 const gatillo=await pagina.$(`button[title="${titulo}"]`);assert(gatillo,`Falta ${titulo}`);await gatillo.scrollIntoView();await gatillo.click();
 const h=await pagina.evaluateHandle(t=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t),etiqueta);
 assert(h.asElement(),`Falta opción ${etiqueta}`);await h.asElement().click();await h.dispose();};
await elegirDesplegable('Descarga agónica: Truco elegido 1','Descarga sobrenatural');
const otra=await pagina.evaluateHandle(()=>[...document.querySelectorAll('details button')].find(b=>b.textContent.trim()==='Aprender otra'));
assert(otra.asElement());await otra.asElement().click();await elegirDesplegable('Descarga agónica: Truco elegido 2','Toque helado');
await esperar(()=>window.rasgo('Invocaciones sobrenaturales').selectores[0].valorActual.length===2);
const elecciones=await pagina.evaluate(()=>window.rasgo('Invocaciones sobrenaturales').selectores[0].valorActual);
assert.notEqual(elecciones[0],elecciones[1]);await pagina.evaluate(()=>window.recargar());
assert.deepEqual(await pagina.evaluate(()=>window.rasgo('Invocaciones sobrenaturales').selectores[0].valorActual),elecciones);
informe.casos.push('Dos instancias de una invocación conservan trucos distintos al guardar y recargar');
await pagina.evaluate(()=>window.sembrar(9));await invocacion('Pacto del filo');
await pagina.evaluate(()=>{
 const bases=window.estado().objetosHomebrew;
 const espada=bases.find(o=>o.categoria==='armas'&&o.tipoAtaque==='Cuerpo a Cuerpo');
 const arco=bases.find(o=>o.categoria==='armas'&&o.tipoAtaque==='A Distancia');
 if(!espada||!arco)throw new Error('Faltan armas en el catálogo real');
 const objeto=(base,id,nombre,esMagico=false)=>({idInstancia:id,idObjeto:base.id,nombre,categoria:'armas',cantidad:1,peso:base.peso??0,valor:0,equipado:true,esMagico});
 for(const o of [objeto(espada,'vinculo-espada','Espada de prueba'),objeto(arco,'arco-simple','Arco sin magia'),objeto(arco,'arco-magico','Arco mágico',true)])window.estado().agregarObjetoInventario(window.pj().id,o);
});
await mostrarAprendidas();
assert.equal(await pagina.$$eval('[data-seccion-rasgos="clase"] article',as=>as.some(a=>a.textContent.includes('Pacto del filo'))),false);
assert.equal(await pagina.$$eval('[data-seccion-rasgos="invocaciones"] article',as=>as.filter(a=>a.textContent.includes('Pacto del filo')).length),1);
await elegirDesplegable('Arma vinculada','Espada de prueba');
await esperar(()=>window.rasgo('Pacto del filo').vinculoArma.idInstancia==='vinculo-espada');
const vincular=await pagina.$('button[title="Arma vinculada"]');await vincular.click();
assert.equal(await pagina.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Arco sin magia')),false);
const magico=await pagina.evaluateHandle(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Arco mágico'));
assert(magico.asElement());await magico.asElement().click();await pagina.evaluate(()=>window.recargar());
assert.equal(await pagina.evaluate(()=>window.rasgo('Pacto del filo').vinculoArma.idInstancia),'arco-magico');
informe.casos.push('Vínculo con un arma concreta: descarta arco sin magia, permite arco mágico y persiste al recargar');
await pagina.evaluate(()=>window.sembrar(17));
await pagina.click('button[title="Ficha y Características del Personaje"]');
await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Conjuros y Magia')));
const magia=await pagina.evaluateHandle(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Conjuros y Magia')));
await magia.asElement().click();
await pagina.waitForSelector('[class*="tarjetaFilaArcano"]');
const filaArcano=async nivel=>{
 const h=await pagina.evaluateHandle(n=>[...document.querySelectorAll('[class*="tarjetaFilaArcano"]')].find(e=>e.textContent.includes(`ARCANO NV. ${n}`)),nivel);
 assert(h.asElement(),`No aparece arcano ${nivel}`);return h.asElement();};
for(const nivel of [6,7]){
 const fila=await filaArcano(nivel);const gatillo=await fila.$('[class*="contenedorSelectorArcano"] button');assert(gatillo);await gatillo.scrollIntoView();await gatillo.click();
 const datos=await pagina.evaluate(n=>{
  const sel=window.pj().rasgos.flatMap(r=>r.selectores??[]).find(s=>s.destinoConjuros==='arcano_mistico'&&s.nivelConjuro===n);
  const elegido=window.estado().baseDatosHechizos.find(h=>h.id===sel.opciones[0].id);
  const ajeno=window.estado().baseDatosHechizos.find(h=>h.nivel===n&&!h.clases.some(c=>c.toLowerCase()==='brujo'));
  return {id:elegido.id,nombre:elegido.nombre,ajeno:ajeno?.nombre};
 },nivel);
 assert.equal(await pagina.evaluate(n=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim().startsWith(`${n} (`)),datos.ajeno),false);
 const opcion=await pagina.evaluateHandle(n=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(`${n} (`)),datos.nombre);
 assert(opcion.asElement(),`Falta conjuro permitido ${datos.nombre}`);await opcion.asElement().click();
 await pagina.waitForFunction((n,id)=>window.pj().arcanoMisticoIds.includes(`${n}:${id}`),{},nivel,datos.id);
}
const fila6=await filaArcano(6);const lanzamiento=await fila6.$('button[class*="botonLanzarArcano"]');await lanzamiento.scrollIntoView();await lanzamiento.click();
await esperar(()=>window.pj().arcanoMisticoGastados.includes('6'));
const fila7=await filaArcano(7);assert(await fila7.$('button[class*="botonLanzarArcano"]'));
await pagina.evaluate(()=>window.recargar());assert.deepEqual(await pagina.evaluate(()=>window.pj().arcanoMisticoGastados),['6']);
assert.equal(await pagina.evaluate(()=>window.pj().espaciosPactoGastados),4);
informe.casos.push('Arcanos de niveles 6 y 7 usan su catálogo; lanzar uno conserva el otro y los espacios; gasto persiste al recargar');
await pagina.evaluate(()=>window.sembrar(9));await invocacion('Pacto del grimorio');
const buscarLibro=async nombre=>{
 const input=await pagina.$('input[placeholder="Buscar en trucos del libro de las sombras..."]');assert(input);await input.click();await seleccionarTodo();await input.press('Backspace');await input.type(nombre);
};
await buscarLibro('Descarga sobrenatural');
assert.equal(await pagina.evaluate(()=>Boolean(document.querySelector('details button[title="Descarga sobrenatural"]'))),false);
await buscarLibro('Rayo de escarcha');
try { await pagina.waitForSelector('details button[title="Rayo de escarcha"]'); }
catch(error) {
 console.log('Diagnóstico del libro', await pagina.evaluate(()=>({inputs:[...document.querySelectorAll('input')].map(e=>({placeholder:e.placeholder,value:e.value})),
  botones:[...document.querySelectorAll('details button')].map(b=>b.textContent.trim()),trucos:window.pj().trucosConocidosIds})));
 fs.writeFileSync('scratch/brujo-ui-fallo.html',await pagina.content());await pagina.screenshot({path:'scratch/brujo-ui-fallo.png'});throw error;
}
const trucoLibro=await pagina.evaluateHandle(()=>document.querySelector('details button[title="Rayo de escarcha"]'));
assert(trucoLibro.asElement());await trucoLibro.asElement().click();
await esperar(()=>window.rasgo('Pacto del grimorio').selectores[0].valorActual.includes('h_rayo-de-escarcha'));
await mostrarAprendidas();await pulsar('Pacto del grimorio','Rasgo inactivo');await esperar(()=>window.pj().trucosConocidosIds.includes('h_rayo-de-escarcha'));
await pulsar('Pacto del grimorio','Rasgo activo');await esperar(()=>!window.pj().trucosConocidosIds.includes('h_rayo-de-escarcha'));
await mostrarAprendidas();await pulsar('Pacto del grimorio','Rasgo inactivo');await pagina.evaluate(()=>window.recargar());
assert(await pagina.evaluate(()=>window.rasgo('Pacto del grimorio').activo&&window.pj().trucosConocidosIds.includes('h_rayo-de-escarcha')));
informe.casos.push('Libro: excluye trucos ya preparados, aporta el elegido mientras está activo y conserva selección y estado al recargar');
await pagina.evaluate(()=>window.sembrar(4));
assert.equal(await pagina.evaluate(()=>window.pj().rasgos.filter(r=>r.origen==='dote').length),0);
const hpAntes=await pagina.evaluate(()=>window.pj().hpMaximo);
await pulsar('Mejora de característica','Ver descripción completa');
try { await pagina.waitForSelector('input[placeholder="Buscar por nombre, requisito o efecto..."]'); }
catch(error){await pagina.screenshot({path:'scratch/brujo-contadores-fallo.png'});fs.writeFileSync('scratch/brujo-contadores-fallo.html',await pagina.content());throw error;}
const buscarDote=async texto=>{const input=await pagina.$('input[placeholder="Buscar por nombre, requisito o efecto..."]');assert(input);await input.click();await seleccionarTodo();await input.press('Backspace');await input.type(texto);};
await buscarDote('Duro');
const dote=await pagina.$('button[class*="botonSeleccionarDote"]');assert(dote);assert.equal(await dote.evaluate(b=>b.disabled),false);await dote.click();
await esperar(()=>window.rasgo('Mejora de característica').selectores[0].valorActual[0]==='dote_duro');
assert.equal(await pagina.evaluate(()=>window.pj().hpMaximo),hpAntes+8);await pagina.evaluate(()=>window.recargar());
assert.equal(await pagina.evaluate(()=>window.pj().rasgos.filter(r=>r.origen==='dote'&&r.ligadoA===window.rasgo('Mejora de característica').id).length),1);
assert.equal(await pagina.evaluate(()=>window.pj().hpMaximo),hpAntes+8);
await pagina.click('button[title="Ver catálogo completo de dotes oficiales"]');await buscarDote('Don del destino');
const epica=await pagina.$('button[class*="botonSeleccionarDote"]');assert(epica);assert.equal(await epica.evaluate(b=>b.disabled),true);
await pagina.click('button[title="Cerrar modal"]');
informe.casos.push('Mejora exige elección: Duro aplica PG y persiste sin duplicados; Don épico queda bloqueado a nivel 4');
await pagina.evaluate(()=>{window.sembrar(6,'Patrón de los Archihadas');window.simularDados();});
await pulsar('Pasos feéricos','1d10');await esperar(()=>window.rasgo('Pasos feéricos').usosRestantes===2);
await pulsar('Escapada brumosa','2d10');await esperar(()=>window.rasgo('Pasos feéricos').usosRestantes===1);
const lanzarDesdeDetalle=async(nombre,formula)=>{
 await pulsar(nombre,'Ver descripción completa');
 let boton;
 try{boton=await pagina.waitForSelector('button[class*="botonLanzarDadosModal"]',{timeout:5000});}
 catch(e){await pagina.screenshot({path:'scratch/brujo-detalle-fallo.png'});fs.writeFileSync('scratch/brujo-detalle-fallo.html',await pagina.content());console.log('Detalle ausente',nombre,await pagina.evaluate(()=>({titulo:document.querySelector('h2[class*="tituloRasgoModal"]')?.textContent,rasgos:window.pj().rasgos.filter(r=>r.nombre.includes('brumosa')||r.nombre.includes('feéricos'))})));throw e;}

 assert.match(await boton.evaluate(b=>b.textContent),new RegExp(formula));await boton.click();
 await pagina.click('button[title="Cerrar modal"]');
};
await lanzarDesdeDetalle('Pasos feéricos','1d10');await esperar(()=>window.rasgo('Pasos feéricos').usosRestantes===0);
await pagina.evaluate(()=>window.estado().recuperarUsoRasgoPersonaje(window.pj().id,window.rasgo('Pasos feéricos').id));
await lanzarDesdeDetalle('Escapada brumosa','2d10');await esperar(()=>window.rasgo('Pasos feéricos').usosRestantes===0);
assert.deepEqual(await pagina.evaluate(()=>window.tiradas.map(t=>t[0].roll.match(/\d+d\d+/)[0])),['1d10','2d10','1d10','2d10']);
assert.equal(await pagina.evaluate(()=>document.body.textContent.includes('Efecto adicional de Paso brumoso (consulta)')),false);
await pagina.evaluate(()=>window.recargar());assert.equal(await pagina.evaluate(()=>window.rasgo('Pasos feéricos').usosRestantes),0);
await pagina.evaluate(()=>{delete window.TS;});
informe.casos.push('Archihadas: 1d10 y 2d10 desde tarjeta y detalle gastan la misma reserva, persisten agotados y no muestran selector de consulta');
await pagina.evaluate(()=>window.sembrar(3,'Patrón Celestial'));
await pagina.evaluate(()=>{const aliado={...structuredClone(window.pj()),id:'aliado-ui',nombre:'Aliado de prueba',hpActual:1,hpTemporal:0,rasgos:[]};window.estado().crearPersonaje(aliado);window.estado().seleccionarPersonajeActivo('brujo-ui');});
await pagina.evaluate(()=>window.simularDados());
const abrirLuz=async()=>{await pulsar('Luz sanadora','Elegir cuántos dados');await pagina.waitForSelector('dialog[aria-label="Curación: Luz sanadora"]');};
const elegirDados=async cantidad=>{const input=await pagina.$('input[aria-label="Dados de curación"]');await input.click();await seleccionarTodo();await input.press('Backspace');await input.type(String(cantidad));await input.press('Enter');};
const botonLanzar=async()=>pagina.evaluateHandle(()=>[...document.querySelectorAll('dialog button')].find(b=>b.textContent.startsWith('Lanzar ')));
const vidaAntes=await pagina.evaluate(()=>window.estado().personajes.map(p=>[p.id,p.hpActual,p.hpTemporal]));
const hpSinCambios=async()=>assert.deepEqual(await pagina.evaluate(()=>window.estado().personajes.map(p=>[p.id,p.hpActual,p.hpTemporal])),vidaAntes);
await abrirLuz();assert.equal(await pagina.$('dialog button[title="Destinatario de la curación"]'),null);
assert.match(await pagina.$eval('dialog label',e=>e.textContent),/máximo 3/);
await elegirDados(3);let lanzar=await botonLanzar();assert(lanzar.asElement());await lanzar.asElement().click();
await esperar(()=>window.rasgo('Luz sanadora').usosRestantes===1);
assert.match(await pagina.evaluate(()=>window.tiradas[0][0].roll),/3d6/);await pagina.evaluate(()=>window.resultadoDados(12));await hpSinCambios();
await abrirLuz();assert.match(await pagina.$eval('dialog label',e=>e.textContent),/máximo 1/);
lanzar=await botonLanzar();await lanzar.asElement().click();await esperar(()=>window.rasgo('Luz sanadora').usosRestantes===0);
assert.match(await pagina.evaluate(()=>window.tiradas[1][0].roll),/1d6/);await pagina.evaluate(()=>window.resultadoDados(6));await hpSinCambios();
assert.equal(await pagina.$eval('article button[title="Elegir cuántos dados de curación gastar"]',b=>b.disabled),true);
await pagina.evaluate(()=>window.recargar());assert.equal(await pagina.evaluate(()=>window.rasgo('Luz sanadora').usosRestantes),0);
informe.casos.push('Luz sanadora: 3d6 y 1d6 exactos, límites de Carisma y reserva, agotamiento y recarga, sin cambiar PG al recibir resultados');
await pagina.evaluate(()=>{window.sembrar(3,'Patrón Celestial');window.modoDados='fallo';});
await abrirLuz();lanzar=await botonLanzar();await lanzar.asElement().click();
await pagina.waitForSelector('dialog [role="status"]');assert.equal(await pagina.evaluate(()=>window.rasgo('Luz sanadora').usosRestantes),4);
const cantidadInvalida=await pagina.$('input[aria-label="Dados de curación"]');
await cantidadInvalida.click();await seleccionarTodo();await cantidadInvalida.press('Backspace');await cantidadInvalida.type('1/0');
lanzar=await botonLanzar();await lanzar.asElement().click();
assert.equal(await pagina.evaluate(()=>window.tiradas.length),3);assert.equal(await pagina.evaluate(()=>window.rasgo('Luz sanadora').usosRestantes),4);
await elegirDados(1);
await pagina.evaluate(()=>window.modoDados='pausa');lanzar=await botonLanzar();
await lanzar.evaluate(b=>{b.click();b.click();});await esperar(()=>window.tiradas.length===4);
assert.equal(await pagina.evaluate(()=>window.rasgo('Luz sanadora').usosRestantes),4);
await pagina.evaluate(()=>window.continuarDados());await esperar(()=>window.rasgo('Luz sanadora').usosRestantes===3);
assert.equal(await pagina.evaluate(()=>window.tiradas.length),4);await pagina.evaluate(()=>{delete window.TS;});
informe.casos.push('Luz sanadora: fallo y cantidad inválida conservan reserva y diálogo recuperable; reintento y doble clic emiten una sola tirada y gastan un dado');
for(const width of [599,433])for(const height of [760,600]){
 await pagina.setViewport({width,height});await pagina.evaluate(()=>window.sembrar(10,'Patrón Celestial'));await pagina.waitForSelector('article');
 const medicion=await pagina.evaluate(()=>{const controles=[...document.querySelectorAll('main article,main button,main input')].filter(e=>e.getClientRects().length);
 return {desbordes:controles.filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>e.className)};});
 informe.dimensiones.push({width,height,...medicion});assert.deepEqual(medicion.desbordes,[]);
 const usar=await pagina.$('article button[aria-label="Usar y recuperar espacios de pacto"]');assert(usar);
 const compacto=await usar.evaluate(b=>{const r=b.getBoundingClientRect();return {texto:b.textContent,ancho:r.width,alto:r.height};});
 assert.equal(compacto.texto,'Usar');assert(compacto.ancho<110&&compacto.alto>=32);

 await pulsar('Luz sanadora','Elegir cuántos dados');await pagina.waitForSelector('dialog');
 assert(await pagina.$eval('dialog',d=>{const r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
 await pagina.screenshot({path:`scratch/brujo-curacion-${width}-${height}.png`});await pagina.keyboard.press('Escape');
 await pagina.evaluate(()=>window.sembrar(9));await invocacion('Pacto del filo');await mostrarAprendidas();
 assert.equal(await pagina.$$eval('[data-seccion-rasgos="clase"] article',as=>as.some(a=>a.textContent.includes('Pacto del filo'))),false);
 assert.equal(await pagina.$$eval('[data-seccion-rasgos="invocaciones"] article',as=>as.filter(a=>a.textContent.includes('Pacto del filo')).length),1);
 assert.deepEqual(await pagina.$$eval('[data-seccion-rasgos="invocaciones"] article',as=>as.filter(a=>{const r=a.getBoundingClientRect();return r.left<0||r.right>innerWidth;}).map(a=>a.className)),[]);
 await pagina.screenshot({path:`scratch/brujo-invocaciones-${width}-${height}.png`});
 await pagina.evaluate(()=>window.sembrar(14,'Patrón Infernal'));
 const recargar=await pagina.$('article button[aria-label="Recargar uso con un espacio de pacto"]');assert(recargar);
 assert(await recargar.evaluate(b=>{const r=b.getBoundingClientRect();return b.textContent==='Recargar'&&r.width<120&&r.height>=32;}));

}
await pagina.setViewport({width:599,height:760});
await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__brujo?nivel=9`);
await pagina.waitForFunction(()=>window.listo);await pagina.waitForSelector('article');
await invocacion('Pacto del grimorio');await buscarLibro('Rayo de escarcha');
await pagina.waitForSelector('details button[title="Rayo de escarcha"]');
const eleccionLibroContadores=await pagina.evaluateHandle(()=>document.querySelector('details button[title="Rayo de escarcha"]'));
assert(eleccionLibroContadores.asElement());await eleccionLibroContadores.asElement().click();await eleccionLibroContadores.dispose();
await mostrarAprendidas();await pulsar('Pacto del grimorio','Rasgo inactivo');
await pulsar('Contactar con el patrón','Gastar 1 uso');
await esperar(()=>window.rasgo('Contactar con el patrón').usosRestantes===0);
await pulsar('Contactar con el patrón','Recuperar 1 uso');
await esperar(()=>window.rasgo('Contactar con el patrón').usosRestantes===1);
const eleccionesLibroAntes=await pagina.evaluate(()=>window.rasgo('Pacto del grimorio').selectores.map(s=>s.valorActual));
await pagina.click('button[title="Ficha y Características del Personaje"]');
await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Conjuros y Magia')));
await pagina.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Conjuros y Magia')).click());
await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Contactar con otro plano'));
const gratisPatron=()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Gratis'
 && b.parentElement?.parentElement?.parentElement?.parentElement?.textContent.includes('Contactar con otro plano'));
const contar=await pagina.evaluate(async()=>{const {usarAlmacenDM}=await import('/src/almacen/usarAlmacenDM.ts');
 window.actualizacionesContador=0;window.dejarConteo=usarAlmacenDM.subscribe((s,p)=>{if(s.personajes!==p.personajes)window.actualizacionesContador++});return true;});
assert(contar);
const botonGratis=await pagina.evaluateHandle(gratisPatron);assert(botonGratis.asElement(),'Falta el lanzamiento gratuito del patrón');
await botonGratis.asElement().click();await botonGratis.dispose();
await esperar(()=>window.rasgo('Contactar con el patrón').usosRestantes===0);
await esperar(()=>window.actualizacionesContador===1);
assert.equal(await pagina.evaluate(gratisPatron),undefined);
assert.deepEqual(await pagina.evaluate(()=>window.rasgo('Pacto del grimorio').selectores.map(s=>s.valorActual)),eleccionesLibroAntes);
await new Promise(r=>setTimeout(r,500));assert.equal(await pagina.evaluate(()=>window.actualizacionesContador),1);
await pagina.evaluate(()=>window.dejarConteo());
await pagina.evaluate(()=>window.recargar());
assert.equal(await pagina.evaluate(()=>window.rasgo('Contactar con el patrón').usosRestantes),0);
assert.deepEqual(await pagina.evaluate(()=>window.rasgo('Pacto del grimorio').selectores.map(s=>s.valorActual)),eleccionesLibroAntes);
informe.casos.push('Contactar con el patrón: contadores +/− y Gratis agotan un único uso, sin actualizaciones en reposo; gasto y elecciones del libro sobreviven a recarga');
const minimizarDados=await pagina.$('button[title="Minimizar panel"]');
if(minimizarDados)await minimizarDados.click();
assert.deepEqual(informe.errores,[]);console.log(JSON.stringify(informe,null,2));
}finally{fs.writeFileSync('scratch/brujo-ui-resultados.json',JSON.stringify(informe,null,2));await navegador?.close();await servidor.close();}
