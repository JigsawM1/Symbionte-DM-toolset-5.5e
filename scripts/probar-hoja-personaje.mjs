import assert from 'node:assert/strict';

// Extiende la misma aplicación de prueba que usa la revisión visual del jugador.
export const prepararPruebaHoja = `
window.tiradasHoja=[];
window.TS={debug:{log:async()=>{}},dice:{
 makeRollDescriptors:async formula=>[{name:'Prueba local',roll:formula.split(':').at(-1)}],
 putDiceInTray:async dados=>{window.tiradasHoja.push(dados);return 'prueba-'+window.tiradasHoja.length;}
}};
window.sembrarHoja=(cambios={},sistemaMagia='espacios')=>{
 const rasgo=EsquemaRasgoPersonaje.parse({id:'fuerza-prueba',nombre:'Prueba de atributo alternativo',descripcion:'Permite Fuerza en Intimidación',efectos:[{id:'ef-fuerza',tipo:'habilidad_con_fuerza',objetivo:'habilidades',valor:'intimidacion',activo:true}]});
 const mago={clase:'Mago',nivel:5,tipoLanzador:'completo',habilidadConjuro:'inteligencia',modeloConjuros:'preparados'};
 const estado=usarAlmacenDM.getState();
 const hechizos=estado.baseDatosHechizos.filter(h=>h.id==='h_proyectil-magico'||h.id==='h_detectar-magia');
 const personaje={...structuredClone(PERSONAJE_POR_DEFECTO),id:'prueba',nombre:'Valerius Drake',clase:'Mago',nivel:5,
 clases:[{nombre:'Mago',nivel:5,subclase:''}],esLanzador:true,clasesLanzadoras:[mago],
 especie:'Humano',trasfondo:'Soldado',caracteristicas:{fuerza:16,destreza:14,constitucion:15,inteligencia:16,sabiduria:12,carisma:8},
 hpActual:24,hpMaximo:36,hpMaximoBase:36,dadosGolpeTotal:5,dadosGolpeRestantes:3,
 espaciosConjuroMaximos:{'1':4,'2':3,'3':2},espaciosConjuroGastados:{'1':1},nivelConjuroMaximo:3,
 conjurosConocidosIds:hechizos.map(h=>h.id),conjurosPreparadosIds:hechizos.map(h=>h.id),
 personalizacionesHabilidades:{perspicacia:{nombrePersonalizado:'Leer intenciones',valorFijo:7}},
 gradosHabilidades:{...PERSONAJE_POR_DEFECTO.gradosHabilidades,atletismo:'competente',sigilo:'medio',percepcion:'pericia'},
 rasgos:[rasgo],...cambios};
 window.tiradasHoja=[];
 usarAlmacenDM.setState({esGM:false,pestañaActiva:'caracteristicas',personajes:[personaje],idPersonajeActivo:personaje.id,sistemaMagia});
 window.mostrar('caracteristicas');
};
window.estadoHoja=()=>usarAlmacenDM.getState().personajes.find(p=>p.id===usarAlmacenDM.getState().idPersonajeActivo);
window.parcheHoja=cambios=>usarAlmacenDM.setState(s=>({personajes:s.personajes.map(p=>p.id===s.idPersonajeActivo?{...p,...cambios}:p)}));
`;

export async function probarHojaPersonaje(pagina, analizar, resultados) {
 const click=async selector=>{const el=await pagina.waitForSelector(selector);await el.scrollIntoView();await el.click();};
 const apartado=async nombre=>{
  const el=await pagina.waitForFunction(n=>[...document.querySelectorAll('button')].find(b=>b.textContent.toUpperCase().includes(n.toUpperCase())&&b.className.includes('botonSubPestana')),{},nombre);
  await el.asElement().scrollIntoView();await el.asElement().click();await el.dispose();
 };
 const escribir=async(selector,valor,tecla='Enter')=>{
  const el=await pagina.waitForSelector(selector);await el.scrollIntoView();await el.focus();
  await pagina.keyboard.down('Control');await pagina.keyboard.press('KeyA');await pagina.keyboard.up('Control');
  await pagina.keyboard.type(valor);await pagina.keyboard.press(tecla);
 };
 const recorrer=async vista=>{
  await pagina.evaluate(()=>document.querySelector('main[class*="areaContenido"] > .u-scroll-cef').scrollTo(0,0));
  for(let paso=0;paso<16;paso++){
   const estado=await analizar();resultados.vistas.push({vista,estado:'desplazamiento',...estado});
   const fin=await pagina.evaluate(()=>{const e=document.querySelector('main[class*="areaContenido"] > .u-scroll-cef');const antes=e.scrollTop;e.scrollTop+=innerHeight-150;return e.scrollTop===antes;});
   if(fin)return;
  }
  assert.fail('La hoja no alcanza el final en 16 desplazamientos');
 };
 for(const width of [599,433])for(const height of [760,600]){
  await pagina.setViewport({width,height});await pagina.evaluate(()=>window.sembrarHoja());await apartado('Combate y Atributos');
  await pagina.waitForSelector('[data-atributo="fuerza"]');
  const estructura=await pagina.evaluate(()=>({
   atributos:[...document.querySelectorAll('[data-atributo]')].map(e=>e.dataset.atributo),
   habilidades:document.querySelectorAll('[data-habilidad]').length,
   columnas:getComputedStyle(document.querySelector('[class*="gridAtributos"]')).gridTemplateColumns.split(' ').length,
   controles:[...document.querySelectorAll('[aria-label="Atributos y habilidades"] button,[aria-label="Atributos y habilidades"] input')].map(e=>{const r=e.getBoundingClientRect();return {ancho:r.width,alto:r.height};})
  }));
  assert.deepEqual(estructura.atributos,['fuerza','destreza','constitucion','inteligencia','sabiduria','carisma']);
  assert.equal(estructura.habilidades,18);assert.equal(estructura.columnas,width===599?2:1);
  assert(estructura.controles.every(e=>e.ancho>=32&&e.alto>=32));
  await pagina.evaluate(()=>document.querySelector('main[class*="areaContenido"] > .u-scroll-cef').scrollTo(0,0));
  await pagina.screenshot({path:`scratch/hoja-combate-${width}x${height}.png`});
  await recorrer(`hoja-combate-${width}x${height}`);
  await pagina.$eval('[aria-label="Atributos y habilidades"]',e=>e.scrollIntoView());
  await pagina.screenshot({path:`scratch/hoja-atributos-${width}x${height}.png`});

  const velocidad='button[aria-label="Abrir controles de velocidad y movimiento"]';
  for(const activacion of ['clic','Enter','Space']){
   const activar=async()=>{
    await pagina.focus(velocidad);
    if(activacion==='clic')await click(velocidad);
    else await pagina.keyboard.press(activacion);
   };
   await activar();
   await pagina.waitForSelector('[class*="popoverVelocidad"]');
   assert.equal(await pagina.$eval(velocidad,e=>e.getAttribute('aria-expanded')),'true');
   assert.equal((await pagina.$$('[class*="popoverVelocidad"]')).length,1);
   if(activacion==='clic')await pagina.screenshot({path:`scratch/hoja-movimiento-${width}x${height}.png`});
   await activar();
   await pagina.waitForSelector('[class*="popoverVelocidad"]',{hidden:true});
   assert.equal(await pagina.$eval(velocidad,e=>e.getAttribute('aria-expanded')),'false');
  }
  resultados.regresiones.push({caso:'Velocidad: una apertura y un cierre por clic, Enter y Espacio',width,height,correcto:true});

  const abrirConfiguracion=async()=>{
   await click('[aria-label="Configuración de la ficha"]');
   await pagina.waitForSelector('form input[type="text"]');
  };
  const nombreInicial=await pagina.evaluate(()=>window.estadoHoja().nombre);
  await abrirConfiguracion();
  await escribir('form input[type="text"]','Nombre descartado','Tab');
  await recorrer(`hoja-configuracion-${width}x${height}`);
  await pagina.evaluate(()=>document.querySelector('main[class*="areaContenido"] > .u-scroll-cef').scrollTo(0,0));
  await pagina.screenshot({path:`scratch/hoja-configuracion-${width}x${height}.png`});
  const cancelar=await pagina.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Cancelar y Volver'));
  await cancelar.asElement().scrollIntoView();await cancelar.asElement().click();await cancelar.dispose();
  await pagina.waitForSelector('[aria-label="Configuración de la ficha"]');
  assert.equal(await pagina.evaluate(()=>window.estadoHoja().nombre),nombreInicial);
  await abrirConfiguracion();
  await escribir('form input[type="text"]','Nombre guardado','Tab');
  await click('form button[type="submit"]');
  await pagina.waitForSelector('[aria-label="Configuración de la ficha"]');
  assert.equal(await pagina.evaluate(()=>window.estadoHoja().nombre),'Nombre guardado');
  resultados.regresiones.push({caso:'Configuración actual: abrir, cancelar sin guardar y guardar',width,height,correcto:true});

  await apartado('Conjuros y Magia');await pagina.waitForSelector('[class*="gridEstadisticas"]');
  assert.notEqual(await pagina.$('[class*="filaMetricasRapidas"]'),null);
  assert.notEqual(await pagina.$('[class*="seccionBarraTactica"]'),null);
  const columnasMagia=await pagina.$eval('[class*="gridEstadisticas"]',e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
  assert.equal(columnasMagia,width===599?4:2);
  await pagina.evaluate(()=>document.querySelector('main[class*="areaContenido"] > .u-scroll-cef').scrollTo(0,0));
  await pagina.screenshot({path:`scratch/hoja-magia-${width}x${height}.png`});
  await recorrer(`hoja-magia-${width}x${height}`);
  resultados.regresiones.push({caso:'Composición de la hoja',width,height,...estructura,columnasMagia});
 }
 await pagina.evaluate(()=>window.sembrarHoja());await apartado('Combate y Atributos');
 const fuerza='input[aria-label="Puntuación de FUE"]';
 await escribir(fuerza,'18','Escape');assert.equal(await pagina.evaluate(()=>window.estadoHoja().caracteristicas.fuerza),16);
 await escribir(fuerza,'18');await pagina.waitForFunction(()=>window.estadoHoja().caracteristicas.fuerza===18);
 await escribir(fuerza,'17','Tab');await pagina.waitForFunction(()=>window.estadoHoja().caracteristicas.fuerza===17);
 assert.equal(await pagina.evaluate(()=>window.tiradasHoja.length),0,'Editar puntuaciones no debe tirar dados');
 await click('[aria-label="Competencia en salvación de FUE"]');
 assert.equal(await pagina.evaluate(()=>window.tiradasHoja.length),0);
 await click('[data-habilidad="atletismo"] [class*="botonToggleHabilidad"]');
 assert.equal(await pagina.evaluate(()=>window.tiradasHoja.length),0);
 assert.equal(await pagina.evaluate(()=>window.estadoHoja().gradosHabilidades.atletismo),'pericia');
 for(const selector of ['[aria-label^="Tirar FUE"]','[data-atributo="fuerza"] [class*="botonTextoSalvacion"]','[data-habilidad="atletismo"] [class*="tiradaHabilidad"]']){
  const antes=await pagina.evaluate(()=>window.tiradasHoja.length);await click(selector);await pagina.waitForFunction(n=>window.tiradasHoja.length===n+1,{},antes);
 }
 const intim='[data-habilidad="intimidacion"]';
 const atributo=await pagina.$eval(intim,e=>e.closest('[data-atributo]').dataset.atributo);assert.equal(atributo,'carisma');
 await click(intim+' [class*="gatillo"]');
 const opcion=await pagina.waitForFunction(()=>[...document.querySelectorAll('button[class*="opcion"]')].find(e=>e.textContent.trim()==='Car'));
 await opcion.asElement().click();await opcion.dispose();
 assert.equal(await pagina.$eval(intim,e=>e.closest('[data-atributo]').dataset.atributo),'carisma');
 const tirosAntes=await pagina.evaluate(()=>window.tiradasHoja.length);await click(intim+' [class*="tiradaHabilidad"]');await pagina.waitForFunction(n=>window.tiradasHoja.length===n+1,{},tirosAntes);
 assert(await pagina.$eval('[data-habilidad="perspicacia"]',e=>e.textContent.includes('Leer intenciones')&&e.textContent.includes('+7')));
 await pagina.evaluate(()=>window.parcheHoja({overridesFijos:{fuerza:21}}));await pagina.waitForFunction(()=>document.querySelector('input[aria-label="Puntuación de FUE"]')?.readOnly);
 assert.equal(await pagina.$eval(fuerza,e=>e.value),'21');
 await pagina.evaluate(()=>window.sembrarHoja({id:'otro-pj',nombre:'Personaje con nombre muy largo para verificar la lectura de la identidad',caracteristicas:{fuerza:8,destreza:10,constitucion:10,inteligencia:10,sabiduria:10,carisma:10}}));
 await pagina.waitForFunction(()=>document.querySelector('input[aria-label="Puntuación de FUE"]')?.value==='8');
 resultados.regresiones.push({caso:'Atributos: edición, cancelación, tiradas, competencias, personalizaciones y cambio de personaje',correcto:true});
 await pagina.evaluate(()=>window.sembrarHoja({concentracionActiva:{hechizoId:'h_detectar-magia',nombreHechizo:'Detectar magia'}}));await apartado('Conjuros y Magia');
 await click('[class*="botonRomperConcentracion"]');await pagina.waitForFunction(()=>window.estadoHoja().concentracionActiva===null);
 await click('button[data-disponible="true"][data-pacto="false"]');await pagina.waitForFunction(()=>window.estadoHoja().espaciosConjuroGastados['1']===2);
 await click('button[data-disponible="false"][data-pacto="false"]');await pagina.waitForFunction(()=>window.estadoHoja().espaciosConjuroGastados['1']===1);
 await pagina.evaluate(()=>window.sembrarHoja({puntosConjuroMaximos:27,puntosConjuroGastados:3},'puntos'));
 await pagina.waitForSelector('[class*="contenedorTrackerPuntos"]');await escribir('input[placeholder="Cant."]','2','Tab');
 await click('[class*="botonGastarPuntos"]');await pagina.waitForFunction(()=>window.estadoHoja().puntosConjuroGastados===5);
 await escribir('input[placeholder="Cant."]','2','Tab');await click('[class*="botonRecuperarPuntos"]');await pagina.waitForFunction(()=>window.estadoHoja().puntosConjuroGastados===3);
 await pagina.evaluate(()=>window.sembrarHoja({espaciosPactoMaximos:2,espaciosPactoGastados:0,nivelEspacioPacto:3}));
 await click('button[data-disponible="true"][data-pacto="true"]');await pagina.waitForFunction(()=>window.estadoHoja().espaciosPactoGastados===1);
 await pagina.evaluate(()=>window.sembrarHoja({clases:[{nombre:'Mago',nivel:3},{nombre:'Clérigo',nivel:2}],clasesLanzadoras:[{clase:'Mago',nivel:3,tipoLanzador:'completo',habilidadConjuro:'inteligencia',modeloConjuros:'preparados'},{clase:'Clérigo',nivel:2,tipoLanzador:'completo',habilidadConjuro:'sabiduria',modeloConjuros:'preparados'}]}));
 await pagina.waitForFunction(()=>document.body.textContent.includes('Lanzar como'));
 await recorrer('hoja-magia-multiclase');
 await pagina.evaluate(()=>window.sembrarHoja({espaciosConjuroGastados:{'1':4,'2':3,'3':2},puntosConjuroMaximos:0}));
 await pagina.waitForFunction(()=>document.querySelectorAll('button[data-disponible="true"]').length===0);
 await pagina.evaluate(()=>window.sembrarHoja({inventario:[{idInstancia:'armadura-prueba',idObjeto:'armadura-prueba',nombre:'Cota de malla',categoria:'armaduras',equipado:true,pesoLb:55,caBase:16}],competenciasArmadurasGrupos:[],competenciasArmadurasLista:[]}));
 await pagina.waitForSelector('button[class*="tarjetaAtaqueMagico"]:disabled');
 await click('button[class*="tarjetaAtaqueMagico"]');
 assert.equal(await pagina.evaluate(()=>window.tiradasHoja.length),0);
 assert.equal(await pagina.evaluate(()=>window.estadoHoja().espaciosConjuroGastados['1']),1);
 await recorrer('hoja-magia-bloqueada');
 resultados.regresiones.push({caso:'Magia: concentración, espacios, puntos, pacto, multiclase, recursos agotados y bloqueo por armadura',correcto:true});
 await pagina.evaluate(()=>window.sembrarHoja({hpActual:1,cansancio:2,espaciosPactoMaximos:2,espaciosPactoGastados:2,espaciosConjuroGastados:{'1':4,'2':3,'3':2},puntosConjuroMaximos:27,puntosConjuroGastados:10}));
 await apartado('Combate y Atributos');
 await click('button[title^="Descanso Corto"]');
 await pagina.waitForSelector('[role="dialog"][aria-labelledby="titulo-resumen-descanso"]');
 assert.equal(await pagina.evaluate(()=>window.estadoHoja().espaciosPactoGastados),0);
 assert.equal(await pagina.evaluate(()=>window.estadoHoja().hpActual),1);
 await click('[aria-label="Cerrar resumen de descanso"]');
 await click('button[title^="Descanso Largo"]');
 await pagina.waitForSelector('[role="dialog"][aria-labelledby="titulo-resumen-descanso"]');
 const descansado=await pagina.evaluate(()=>window.estadoHoja());
 assert.equal(descansado.hpActual,descansado.hpMaximo);
 assert(Object.values(descansado.espaciosConjuroGastados).every(v=>v===0));
 assert.equal(descansado.puntosConjuroGastados,0);
 assert.equal(descansado.cansancio,1);
 await click('[aria-label="Cerrar resumen de descanso"]');
 resultados.regresiones.push({caso:'Descansos corto y largo mantienen la recuperación de recursos',correcto:true});
 await pagina.evaluate(()=>window.sembrarHoja());await apartado('Combate y Atributos');
}
