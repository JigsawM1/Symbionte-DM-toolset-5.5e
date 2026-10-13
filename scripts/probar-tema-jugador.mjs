import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import { html as base } from './fixture-tema-jugador.mjs';
fs.mkdirSync('scratch',{recursive:true});
const html=base.replace('window.listo=true;',`window.listo=true;
window.actualizarPrueba=cambios=>usarAlmacenDM.setState(cambios);
window.leerPrueba=()=>{const s=usarAlmacenDM.getState();return {personaje:s.personajes[0],cola:s.colaIniciativa};};
window.probarRanuras=()=>raiz.render(React.createElement('div',{'data-tema':'jugador'},React.createElement(React.Suspense,{fallback:'Cargando'},React.createElement(React.lazy(()=>import('/src/componentes/caracteristicas/personajes/TrackerEspaciosPacto.tsx').then(m=>({default:m.TrackerEspaciosPacto}))),{espaciosPactoMaximos:2,espaciosPactoGastados:1,nivelEspacioPacto:3,alGastarEspacioPacto:()=>window.gastos=(window.gastos||0)+1,alRecuperarEspaciosPacto:()=>window.recuperaciones=(window.recuperaciones||0)+1}))));
`);
const servidor=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error',plugins:[{name:'autorrevision',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(req.url!=='/__revision')return next();try{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,html));}catch(e){next(e);}});}}]});
const ejecutable=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
assert(ejecutable,'Se requiere Chrome o Edge local para esta prueba visual.');
let navegador;
const resultados={vistas:[],regresiones:[],errores:[]};
try{
 await servidor.listen();navegador=await puppeteer.launch({executablePath:ejecutable,headless:true});
 const pagina=await navegador.newPage();pagina.on('pageerror',e=>resultados.errores.push(e.message));
 await pagina.setViewport({width:599,height:760});await pagina.goto('http://127.0.0.1:'+servidor.httpServer.address().port+'/__revision');await pagina.waitForFunction(()=>window.listo);
 const referenciaDM=await pagina.evaluate(()=>window.probarDM());
 const analizar=()=>pagina.evaluate(()=>{
  const rgb=c=>{const v=c.match(/[\d.]+/g)?.map(Number)||[0,0,0,0];return [...v.slice(0,3),v[3]??1];};
  const mezclar=(a,b)=>a.slice(0,3).map((n,i)=>n*a[3]+b[i]*(1-a[3])).concat(1);
  const luminancia=c=>c.slice(0,3).map(n=>{const v=n/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;}).reduce((a,n,i)=>a+n*[0.2126,0.7152,0.0722][i],0);
  const razon=(a,b)=>{const x=luminancia(a),y=luminancia(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const fondo=el=>{const padres=[];for(let p=el;p;p=p.parentElement)padres.push(p);let c=[7,10,16,1];for(const p of padres.reverse()){const s=getComputedStyle(p);if(s.backgroundImage!=='none')return null;c=mezclar(rgb(s.backgroundColor),c);}return c;};
  const visibles=[...document.querySelectorAll('button,input,textarea,label,span,p,h1,h2,h3,strong,em,div')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&r.top<innerHeight&&r.bottom>0&&getComputedStyle(el).visibility!=='hidden';});
  const bajos=[];
  for(const el of visibles){if(el.children.length&&el.tagName!=='INPUT'&&el.tagName!=='TEXTAREA')continue;const texto=(el.tagName==='INPUT'||el.tagName==='TEXTAREA'?el.value:el.textContent).trim();if(!texto)continue;const s=getComputedStyle(el),bg=fondo(el);if(!bg)continue;let fg=mezclar(rgb(s.color),bg);let opacidad=1;for(let p=el;p;p=p.parentElement)opacidad*=Number(getComputedStyle(p).opacity);fg=mezclar([...fg.slice(0,3),opacidad],bg);const contraste=razon(fg,bg);const grande=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700);if(contraste<(grande?3:4.5))bajos.push({texto:texto.slice(0,65),clase:el.className,contraste:+contraste.toFixed(2),color:s.color,fondo:bg.slice(0,3),opacidad});}
  return{contrasteBajo:bajos,fuentesPequenas:visibles.filter(el=>el.childNodes.length&&parseFloat(getComputedStyle(el).fontSize)<11).map(el=>({texto:el.textContent.slice(0,40),clase:el.className})),desbordes:visibles.filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1;}).map(el=>({texto:el.textContent.slice(0,40),clase:el.className}))};
 });
 for(const vista of ['caracteristicas','acciones','conjuros','rasgos','inventario','iniciativa','notas','detalle','configuracion-personaje','constructor','detalle-objeto','detalle-rasgo','homebrew']){
  await pagina.evaluate(v=>window.mostrar(v),vista);await new Promise(r=>setTimeout(r,150));
  resultados.vistas.push({vista,estado:'normal',...await analizar()});
  const botones=await pagina.$$('button');let cantidad=0;
  for(const boton of botones){if(cantidad>=12)break;const r=await boton.boundingBox();if(!r||r.y<0||r.y+r.height>760)continue;await boton.hover();const estado=await analizar();if(estado.contrasteBajo.length)resultados.vistas.push({vista,estado:'hover',boton:await boton.evaluate(el=>el.textContent||el.title),...estado});cantidad++;}
 }
 for(const vista of ['caracteristicas','acciones','conjuros','rasgos','inventario','iniciativa','notas']){
  await pagina.evaluate(v=>window.mostrar(v),vista);await new Promise(r=>setTimeout(r,150));
  const controles=await pagina.$$('main button:not(:disabled),main input,main textarea,main [class*="tarjetaCriatura"]');
  let ultimo;
  for(const control of controles)if(await control.evaluate(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'))ultimo=control;
  if(!ultimo)continue;
  await ultimo.scrollIntoView();
  const accesible=await ultimo.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;const hit=document.elementFromPoint(x,y);return{texto:(el.textContent||el.title).slice(0,50),visible:r.top>=0&&r.bottom<=innerHeight,recibeClic:!!hit&&el.contains(hit)};});
  resultados.regresiones.push({caso:'Final de la vista accesible',vista,...accesible});
 }
 await pagina.evaluate(()=>window.probarRanuras());await pagina.waitForSelector('button[data-disponible]');
 const ranuras=await pagina.$$eval('button[data-disponible]',els=>els.map(el=>{const s=getComputedStyle(el);return{disponible:el.dataset.disponible,pacto:el.dataset.pacto,radio:s.borderRadius,fondo:s.backgroundColor,ancho:el.getBoundingClientRect().width};}));
 await pagina.click('button[data-disponible="true"]');await pagina.click('button[data-disponible="false"]');
 resultados.regresiones.push({caso:'Ranuras de pacto: forma, estado y acción',ranuras,acciones:await pagina.evaluate(()=>({gastar:window.gastos,recuperar:window.recuperaciones}))});
 resultados.regresiones.push({caso:'Ranura gastada en hover',fondo:await pagina.$eval('button[data-disponible="false"]',el=>getComputedStyle(el).backgroundColor)});
 await pagina.screenshot({path:'scratch/autorrevision-ranuras.png'});
 for(const ancho of [599,433]){
  await pagina.setViewport({width:ancho,height:760});await pagina.evaluate(()=>window.mostrar('caracteristicas'));await pagina.waitForSelector('[class*="filaRecursosSalud"]');
  const recursos=await pagina.$$eval('[class*="tarjetaRecursoSalud"]',tarjetas=>tarjetas.map(t=>{const r=t.getBoundingClientRect();return {tarjeta:t.textContent.trim().slice(0,45),ancho:r.width,fueraDePantalla:r.right>innerWidth+1,controles:[...t.querySelectorAll('button,[class*="puntoCansancio"]')].map(el=>{const b=el.getBoundingClientRect();return{clase:el.className,ancho:b.width,alto:b.height,fueraDeTarjeta:b.left<r.left||b.right>r.right,boton:el.tagName==='BUTTON'};})};}));
  resultados.regresiones.push({caso:'Recursos de salud',ancho,recursos});
 }
 const cansancio=await pagina.$('[aria-label="Cansancio nivel 1"]');
 if(cansancio){
  await cansancio.scrollIntoView();await cansancio.focus();await pagina.keyboard.press('Space');await pagina.waitForFunction(()=>window.leerPrueba().personaje.cansancio===1);
  const activo=await pagina.$eval('[aria-label="Cansancio nivel 1"]',el=>el.getAttribute('aria-pressed'));
  await pagina.keyboard.press('Enter');await pagina.waitForFunction(()=>window.leerPrueba().personaje.cansancio===0);
  resultados.regresiones.push({caso:'Cansancio con teclado',activo,final:await pagina.$eval('[aria-label="Cansancio nivel 1"]',el=>el.getAttribute('aria-pressed'))});
  await pagina.screenshot({path:'scratch/autorrevision-salud-433.png'});
 }
 await pagina.evaluate(()=>{window.actualizarPrueba({mostrarPorcentajeVidaAJugadores:true});window.mostrar('iniciativa');});
 for(const hp of [90,40,10]){
  await pagina.evaluate(hp=>{const cola=window.leerPrueba().cola.map(c=>({...c,vidaActual:hp,vidaMaxima:100}));window.actualizarPrueba({colaIniciativa:cola});},hp);
  await pagina.waitForFunction(hp=>document.querySelector('[class*="saludTextoValor"]')?.textContent===hp+'%',{},hp);
  const barra=await pagina.$eval('[class*="barraVidaRelleno"]',el=>({estado:el.dataset.salud,relleno:getComputedStyle(el).backgroundColor,fondo:getComputedStyle(el.parentElement).backgroundColor}));
  const luz=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
  const x=luz(barra.relleno),y=luz(barra.fondo);resultados.regresiones.push({caso:'Contraste de la barra de vida',hp,...barra,contraste:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)});
 }
 await pagina.evaluate(()=>window.probarComunes());await pagina.waitForSelector('[class*="gatillo"]');await pagina.click('[class*="gatillo"]');
 resultados.regresiones.push({caso:'Selector abierto',...await analizar()});
 await pagina.keyboard.press('Tab');
 resultados.regresiones.push({caso:'Foco de teclado',foco:await pagina.evaluate(()=>({etiqueta:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle,color:getComputedStyle(document.activeElement).outlineColor}))});
 await pagina.screenshot({path:'scratch/autorrevision-selector.png'});
 for(const [ancho,alto] of [[599,760],[599,600],[433,760],[433,600]]){
  await pagina.setViewport({width:ancho,height:alto});await pagina.evaluate(()=>{window.mostrar('agregar-objeto');window.objetoAgregado=null;window.modalCerrado=false;});
  await pagina.waitForSelector('input[placeholder="Escribe el nombre del objeto..."]');
  const buscador=await pagina.$('input[placeholder="Escribe el nombre del objeto..."]');await buscador.focus();await pagina.keyboard.down('Control');await pagina.keyboard.press('KeyA');await pagina.keyboard.up('Control');await pagina.keyboard.press('Backspace');await pagina.keyboard.type('daga');
  assert.equal(await buscador.evaluate(el=>el.value),'daga');
  await pagina.waitForFunction(()=>document.querySelector('[class*="nombrePreviewObjeto"]')?.textContent.trim()==='Daga');
  await new Promise(r=>setTimeout(r,550));await pagina.keyboard.press('Escape');
  await pagina.$eval('[class*="contenidoFormularioAgregarObjeto"]',el=>{el.scrollTop=el.scrollHeight;});
  const estado=await pagina.$eval('button[type="submit"]',el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{visible:r.top>=0&&r.bottom<=innerHeight,recibeClic:!!hit&&el.contains(hit),habilitado:!el.disabled};});
  await pagina.screenshot({path:'scratch/objeto-daga-'+ancho+'x'+alto+'.png'});
  if(estado.visible&&estado.recibeClic){await pagina.click('button[type="submit"]');estado.objeto=await pagina.evaluate(()=>window.objetoAgregado?.nombre);estado.cierra=await pagina.evaluate(()=>window.modalCerrado);}
  resultados.regresiones.push({caso:'Añadir Daga tras escribir en el buscador',ancho,alto,...estado});
 }
 await pagina.evaluate(()=>{window.objetoAgregado=null;window.modalCerrado=false;});
 const botonPosesiones=await pagina.evaluateHandle(()=>[...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='Otras Posesiones'));
 await botonPosesiones.asElement().click();
 await pagina.waitForSelector('input[placeholder^="Ej. Carta sellada"]');await pagina.type('input[placeholder^="Ej. Carta sellada"]','Llave de prueba');
 await pagina.$eval('[class*="contenidoFormularioAgregarObjeto"]',el=>{el.scrollTop=el.scrollHeight;});
 const posesion=await pagina.$eval('button[type="submit"]',el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{visible:r.top>=0&&r.bottom<=innerHeight,recibeClic:!!hit&&el.contains(hit)};});
 if(posesion.visible&&posesion.recibeClic){await pagina.click('button[type="submit"]');posesion.objeto=await pagina.evaluate(()=>window.objetoAgregado?.nombre);posesion.cierra=await pagina.evaluate(()=>window.modalCerrado);}
 resultados.regresiones.push({caso:'Añadir otras posesiones tras desplazar el formulario',...posesion});
 await pagina.setViewport({width:599,height:760});
 assert.deepEqual(await pagina.evaluate(()=>window.probarDM()),referenciaDM,'Cambiar de vista no debe alterar el tema DM');
 resultados.clasesDM=Object.keys(referenciaDM).length;
 fs.writeFileSync('scratch/autorrevision-jugador.json',JSON.stringify(resultados,null,2));
 if(process.argv.includes('--validar')){
  assert.deepEqual(resultados.errores,[]);
  assert(resultados.vistas.every(v=>!v.contrasteBajo.length&&!v.fuentesPequenas.length&&!v.desbordes.length),'Fallo de contraste, lectura o ajuste');
  const pacto=resultados.regresiones.find(r=>r.caso.startsWith('Ranuras'));
  assert(pacto.ranuras.every(r=>r.radio==='50%'&&r.ancho>=32&&r.pacto==='true'),'Las ranuras deben ser circulares');
  assert.deepEqual(pacto.acciones,{gastar:1,recuperar:1});
  assert.equal(resultados.regresiones.find(r=>r.caso==='Ranura gastada en hover').fondo,'rgba(0, 0, 0, 0)');
  for(const r of resultados.regresiones.filter(r=>r.caso==='Recursos de salud'))assert(r.recursos.every(t=>!t.fueraDePantalla&&t.controles.every(c=>c.boton&&!c.fueraDeTarjeta&&c.ancho>=32&&c.alto>=32)));
  const teclado=resultados.regresiones.find(r=>r.caso==='Cansancio con teclado');assert.deepEqual({activo:teclado?.activo,final:teclado?.final},{activo:'true',final:'false'});
  assert(resultados.regresiones.filter(r=>r.caso==='Contraste de la barra de vida').every(r=>r.contraste>=3));
  assert(resultados.regresiones.filter(r=>r.caso==='Final de la vista accesible').every(r=>r.visible&&r.recibeClic));
  const selectorAbierto=resultados.regresiones.find(r=>r.caso==='Selector abierto');
  assert.deepEqual(selectorAbierto.contrasteBajo,[]);assert.deepEqual(selectorAbierto.fuentesPequenas,[]);assert.deepEqual(selectorAbierto.desbordes,[]);
  const foco=resultados.regresiones.find(r=>r.caso==='Foco de teclado').foco;
  assert.equal(foco.outline,'solid');assert.equal(foco.color,'rgb(129, 140, 248)');
  assert(resultados.regresiones.filter(r=>r.caso==='Añadir Daga tras escribir en el buscador').every(r=>r.visible&&r.recibeClic&&r.habilitado&&r.objeto==='Daga'&&r.cierra),'La acción de añadir Daga debe permanecer accesible');
  const posesion=resultados.regresiones.find(r=>r.caso==='Añadir otras posesiones tras desplazar el formulario');assert(posesion.visible&&posesion.recibeClic&&posesion.objeto==='Llave de prueba'&&posesion.cierra);
 }
 console.log(JSON.stringify({vistas:resultados.vistas.filter(v=>v.contrasteBajo.length||v.fuentesPequenas.length||v.desbordes.length),regresiones:resultados.regresiones,errores:resultados.errores},null,2));
}finally{await navegador?.close();await servidor.close();}
