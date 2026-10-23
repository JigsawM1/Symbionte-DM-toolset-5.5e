import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";

const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react';import{createRoot}from'react-dom/client';import App from'/src/App.tsx';import'/src/index.css';
import{usarAlmacenDM}from'/src/almacen/usarAlmacenDM.ts';import{PERSONAJE_POR_DEFECTO}from'/src/constantes/personajeConstantes.ts';
import{aplicarBuildClaseAPersonaje}from'/src/servicios/gestorClases.ts';import{calcularEstadisticasPersonaje}from'/src/almacen/selectores/usarEstadoPersonajes.ts';
import{deshidratarPersonaje,hidratarPersonaje}from'/src/servicios/serializadorPersonaje.ts';
import{ejecutarDescansoCorto}from'/src/servicios/procesadorDescansos.ts';
import HECHIZOS from'/src/utiles/compendios/all.json';
usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',cargandoDatos:false,datosInicialesCargados:false,
 cargarDatosPersistidos:async()=>{},establecerEsGM:()=>{},personajes:[],idPersonajeActivo:'',colaIniciativa:[],baseDatosHechizos:HECHIZOS});
window.estado=()=>usarAlmacenDM.getState();window.pj=()=>window.estado().personajes.find(p=>p.id===window.estado().idPersonajeActivo);
window.rasgo=n=>window.pj().rasgos.find(r=>r.nombre===n);window.stats=()=>calcularEstadisticasPersonaje(window.pj());
window.ir=pestañaActiva=>usarAlmacenDM.setState({pestañaActiva});
window.recargar=()=>usarAlmacenDM.setState({personajes:[hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(window.pj()))),window.estado().baseDatosHechizos)]});
window.sembrar=(nivel=9)=>{
 usarAlmacenDM.setState({personajes:[],colaIniciativa:[],baseDatosHechizos:HECHIZOS});
 const base={...structuredClone(PERSONAJE_POR_DEFECTO),nombre:'Bardo de prueba',especie:'',
 caracteristicas:{fuerza:10,destreza:14,constitucion:12,inteligencia:10,sabiduria:12,carisma:18},
 gradosHabilidades:{...PERSONAJE_POR_DEFECTO.gradosHabilidades,interpretacion:'competente',persuasion:'competente',historia:'competente',sigilo:'competente'}};
 const id=window.estado().crearPersonaje(aplicarBuildClaseAPersonaje(base,'Bardo',nivel));
 usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',idPersonajeActivo:id});return id;
};
window.descansar=()=>window.estado().actualizarPersonaje(window.pj().id,ejecutarDescansoCorto(window.pj(),0).personajeActualizado);
window.sembrar();createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`;
const servidor = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error", plugins: [{
  name: "prueba-bardo", configureServer(s) { s.middlewares.use(async (req, res, next) => {
    if (req.url !== "/__bardo") return next();
    try { res.setHeader("Content-Type", "text/html"); res.end(await s.transformIndexHtml(req.url, html)); } catch (e) { next(e); }
  }); }
}] });
const ejecutable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && fs.existsSync(p));
assert(ejecutable, "Se requiere Chromium local.");
fs.mkdirSync("scratch", { recursive: true });
const informe = { entorno: "Chromium local con App real; emisión de dados local y guardado serializado, sin TaleSpire", casos: [], dimensiones: [], errores: [] };
let navegador;
try {
  await servidor.listen();
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  const pagina = await navegador.newPage();pagina.setDefaultTimeout(15000);
  pagina.on("pageerror", e => informe.errores.push(e.message));
  const tiradas = [];pagina.on("console", m => { if (m.text().includes("Preparando tirada:")) tiradas.push(m.text()); });
  const click = async selector => { const e = await pagina.waitForSelector(selector); await e.scrollIntoView(); await e.click(); };
  const texto = async (valor, ambito = "body") => {
    const h = await pagina.waitForFunction((v, a) => [...document.querySelectorAll(`${a} button`)].find(e => e.textContent.trim() === v), {}, valor, ambito);
    await h.asElement().scrollIntoView();await h.asElement().click();await h.dispose();
  };
  const tarjeta = async (nombre, selector) => {
    const h = await pagina.waitForFunction((n, s) => [...document.querySelectorAll("article")].find(a => a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /, "") === n)?.querySelector(s), {}, nombre, selector);
    await h.asElement().scrollIntoView();await h.asElement().click();await h.dispose();
  };
  const esperar = condicion => pagina.waitForFunction(condicion);
  const dimension = async (ancho, flujo) => {
    const medida = await pagina.evaluate(() => ({ ancho: innerWidth, documento: document.documentElement.scrollWidth,
      dialogo: (() => { const e = document.querySelector('dialog[open]');if (!e) return null;const r = e.getBoundingClientRect();return { izquierda: r.left, derecha: r.right, alto: r.height }; })() }));
    assert(medida.documento <= ancho + 1, `Desbordamiento horizontal en ${flujo}`);
    if (medida.dialogo) assert(medida.dialogo.izquierda >= 0 && medida.dialogo.derecha <= ancho + 1 && medida.dialogo.alto <= 760);
    informe.dimensiones.push({ ancho, flujo, ...medida });
  };
  for (const ancho of [599, 433]) {
    await pagina.setViewport({ width: ancho, height: 760 });
    await pagina.goto(`http://127.0.0.1:${servidor.httpServer.address().port}/__bardo`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await tarjeta("Pericia", 'button[title="Ver descripción completa en modal"]');
    const elegir = async (etiqueta, nombre) => {
      const h = await pagina.waitForFunction((e, n) => [...document.querySelectorAll('[class*="tarjetaSelectorModal"]')].find(s => s.querySelector('[class*="tituloSelectorModal"]')?.textContent === e)
        && [...[...document.querySelectorAll('[class*="tarjetaSelectorModal"]')].find(s => s.querySelector('[class*="tituloSelectorModal"]')?.textContent === e).querySelectorAll('button[class*="opcionSelectorCard"]')].find(b => b.textContent.trim() === n), {}, etiqueta, nombre);
      await h.asElement().scrollIntoView();await h.asElement().click();await h.dispose();
    };
    await elegir("Pericia de nivel 2", "Interpretación");await elegir("Pericia de nivel 2", "Persuasión");
    await elegir("Pericia de nivel 9", "Historia");await elegir("Pericia de nivel 9", "Sigilo");
    await esperar(() => window.stats().gradosHabilidadesEfectivos.historia === 'pericia');
    assert.equal(await pagina.evaluate(() => window.pj().gradosHabilidades.historia), "competente");
    await dimension(ancho, "Pericia");await pagina.screenshot({ path: `scratch/bardo-pericia-${ancho}.png` });
    await click('button[title="Cerrar modal"]');
    await pagina.evaluate(() => window.recargar());
    await esperar(() => window.rasgo('Pericia').selectores[1].valorActual.length === 2);
    informe.casos.push({ ancho, flujo: "Pericia: cuatro elecciones, efecto derivado y guardado/recarga" });

    await pagina.evaluate(() => window.sembrar(5));
    for (let i = 0; i < 4; i++) await tarjeta("Inspiración bárdica", 'button[title="Gastar 1 uso"]');
    await esperar(() => window.rasgo('Inspiración bárdica').usosRestantes === 0);
    const desde = tiradas.length;
    await tarjeta("Inspiración bárdica", 'button[title="Lanzar 1d8 a TaleSpire"]');
    assert(tiradas.slice(desde).some(t => t.includes("1d8")));
    assert.equal(await pagina.evaluate(() => window.rasgo('Inspiración bárdica').usosRestantes), 0);
    await tarjeta("Inspiración bárdica", 'button[title="Gastar un espacio para recuperar usos"]');
    await esperar(() => document.querySelector('dialog[open]'));
    await dimension(ancho, "Conversión");await pagina.screenshot({ path: `scratch/bardo-conversion-${ancho}.png` });
    await pagina.keyboard.press("Escape");await esperar(() => !document.querySelector('dialog[open]'));
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[1] ?? 0), 0);
    await tarjeta("Inspiración bárdica", 'button[title="Gastar un espacio para recuperar usos"]');
    await texto("Cancelar", "dialog[open]");
    await tarjeta("Inspiración bárdica", 'button[title="Gastar un espacio para recuperar usos"]');
    await texto("Gastar espacio y recuperar", "dialog[open]");
    await esperar(() => window.rasgo('Inspiración bárdica').usosRestantes === 1);
    assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[1]), 1);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.rasgo('Inspiración bárdica').usosRestantes), 1);
    await pagina.evaluate(() => window.descansar());
    await esperar(() => window.rasgo('Inspiración bárdica').usosRestantes === 4);
    informe.casos.push({ ancho, flujo: "Inspiración: gasto único, dado con reserva agotada, Escape/cancelación, conversión, persistencia y descanso" });

    await pagina.evaluate(() => { window.sembrar(10);window.ir('compendio'); });
    await texto("Disponibles");
    await texto("Filtrar");
    const buscador = await pagina.waitForSelector('input[placeholder*="Buscar"]');await buscador.type("Bola de fuego");
    await esperar(() => [...document.querySelectorAll('[class*="filaContenedor"]')].some(e => e.textContent.includes('Bola de fuego')));
    const fila = await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="filaContenedor"]')].find(e => e.textContent.includes('Bola de fuego'))?.querySelector('button[class*="botonCheckbox"]'));
    await fila.asElement().scrollIntoView();await fila.asElement().click();await fila.dispose();
    await esperar(() => window.pj().eleccionesConjurosClase?.Bardo.conjuros.length === 1);
    await pagina.evaluate(() => window.recargar());
    assert.equal(await pagina.evaluate(() => window.pj().eleccionesConjurosClase.Bardo.conjuros.length), 1);
    await dimension(ancho, "Secretos mágicos");
    informe.casos.push({ ancho, flujo: "Secretos: conjuro de Mago disponible, preparación en compendio y procedencia persistente como Bardo" });
    await pagina.evaluate(() => window.ir('rasgos'));await pagina.waitForSelector('article');
    await pagina.evaluate(() => {
      window.sembrar(10);const p=window.pj();window.estado().actualizarPersonaje(p.id, { clase:'Clérigo 1 / Bardo 10',nivel:11,
        clases:[{nombre:'Clérigo',nivel:1,subclase:''},{nombre:'Bardo',nivel:10,subclase:''}],
        clasesLanzadoras:[{clase:'Clérigo',nivel:1,tipoLanzador:'completo',habilidadConjuro:'sabiduria',modeloConjuros:'preparados'},...p.clasesLanzadoras] });
      window.ir('compendio');
    });
    await click('button[title="Clase que aprende el conjuro"]');await texto("Bardo");
    await texto("Disponibles");await texto("Filtrar");
    await (await pagina.waitForSelector('input[placeholder*="Buscar"]')).type("Bola de fuego");
    const multi = await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="filaContenedor"]')].find(e => e.textContent.includes('Bola de fuego'))?.querySelector('button[class*="botonCheckbox"]'));
    await multi.asElement().scrollIntoView();await multi.asElement().click();await multi.dispose();
    await esperar(() => window.pj().eleccionesConjurosClase?.Bardo.conjuros.length === 1);
    await dimension(ancho, "Procedencia multiclase");
    informe.casos.push({ ancho, flujo: "Multiclase: elección explícita de Bardo en compendio con Clérigo como primera clase" });

    await pagina.evaluate(() => window.sembrar(4));
    assert.equal(await pagina.evaluate(() => window.pj().rasgos.filter(r=>r.origen==='dote').length),0);
    await tarjeta("Mejora de característica", 'button[title="Ver descripción completa en modal"]');
    await (await pagina.waitForSelector('input[placeholder="Buscar por nombre, requisito o efecto..."]')).type("Alerta");
    const alerta = await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="tarjetaDoteCaja"]')].find(e=>e.querySelector('[class*="tituloDote"]')?.textContent.trim()==='Alerta')?.querySelector('button[class*="botonSeleccionarDote"]'));
    await alerta.asElement().scrollIntoView();await alerta.asElement().click();await alerta.dispose();
    await esperar(() => window.pj().rasgos.some(r=>r.origen==='dote'&&r.nombre==='Alerta'));
    await click('button[title="Cerrar modal"]');await pagina.evaluate(()=>window.recargar());
    await esperar(() => window.pj().rasgos.some(r=>r.origen==='dote'&&r.nombre==='Alerta'));
    await tarjeta("Mejora de característica", 'button[title="Ver descripción completa en modal"]');
    await click('button[title="Quitar elección de dote"]');
    await esperar(() => !window.pj().rasgos.some(r=>r.origen==='dote'&&r.nombre==='Alerta'));
    await click('button[title="Cerrar modal"]');
    informe.casos.push({ ancho, flujo: "Dote: elección inicialmente vacía, selección explícita y recarga" });

    await pagina.evaluate(() => {
      window.sembrar(4);const p=window.pj();const asi=p.rasgos.find(r=>r.nombre==='Mejora de característica');
      window.estado().actualizarSeleccionRasgo(p.id,asi.id,asi.selectores[0].id,['dote_iniciado_magia_clerigo']);
      const d=window.pj().rasgos.find(r=>r.nombre==='Iniciado en la Magia (Clérigo)');
      window.estado().actualizarSeleccionRasgo(p.id,d.id,d.selectores.find(s=>s.id==='selector_conjuro_nv1_iniciado_clerigo').id,['h_curar-heridas']);
    });
    await tarjeta("Mejora de característica", 'button[title="Ver descripción completa en modal"]');
    await click('button[title="Quitar elección de dote"]');
    await esperar(() => !window.pj().conjurosSiemprePreparadosIds.includes('h_curar-heridas'));
    await click('button[title="Cerrar modal"]');await pagina.evaluate(()=>window.recargar());
    assert.equal(await pagina.evaluate(()=>window.pj().conjurosPreparadosIds.includes('h_curar-heridas')),false);
    informe.casos.push({ ancho, flujo: "Retirada de dote: desaparecen sus conjuros y la retirada persiste al recargar" });

    const pulsarFila = async (nombre, control='botonCheckbox') => {
      const h=await pagina.waitForFunction((n,c)=>[...document.querySelectorAll('[class*="filaContenedor"]')].find(e=>e.textContent.includes(n))?.querySelector(`button[class*="${c}"]`),{},nombre,control);
      await h.asElement().scrollIntoView();await h.asElement().click();await h.dispose();
    };
    const buscarConjuro = async nombre => {
      await texto('Disponibles');await texto('Filtrar');await(await pagina.waitForSelector('input[placeholder*="Buscar"]')).type(nombre);
    };
    await pagina.evaluate(()=>{
      window.sembrar(1);const p=window.pj();window.estado().actualizarPersonaje(p.id,{clase:'Bardo 1 / Mago 1',nivel:2,
        clases:[{nombre:'Bardo',nivel:1,subclase:''},{nombre:'Mago',nivel:1,subclase:''}],
        clasesLanzadoras:[...p.clasesLanzadoras,{clase:'Mago',nivel:1,tipoLanzador:'completo',habilidadConjuro:'inteligencia',modeloConjuros:'grimorio'}]});
      window.estado().alternarConjuroPreparado(p.id,'h_caida-de-pluma','Bardo');window.ir('compendio');
    });
    await click('button[title="Clase que aprende el conjuro"]');await texto('Mago');
    await buscarConjuro('Caída de pluma');await pulsarFila('Caída de pluma');
    await esperar(()=>window.pj().eleccionesConjurosClase?.Mago.conjuros.includes('h_caida-de-pluma'));
    await pagina.evaluate(()=>{window.estado().aplicarBuildClasePersonaje(window.pj().id,'Mago',1);window.recargar();});
    assert.equal(await pagina.evaluate(()=>window.pj().conjurosConocidosIds.includes('h_caida-de-pluma')),true);
    informe.casos.push({ ancho, flujo: "Libro: adquisición por Mago desde la UI, retirada de Bardo y conservación del aprendizaje al recargar" });
    await pagina.evaluate(()=>window.ir('rasgos'));await pagina.waitForSelector('article');

    await pagina.evaluate(()=>{
      window.sembrar(1);const p=window.pj();window.estado().actualizarPersonaje(p.id,{clase:'Bardo 1 / Clérigo 1',nivel:2,
        clases:[{nombre:'Bardo',nivel:1,subclase:''},{nombre:'Clérigo',nivel:1,subclase:''}],
        clasesLanzadoras:[...p.clasesLanzadoras,{clase:'Clérigo',nivel:1,tipoLanzador:'completo',habilidadConjuro:'sabiduria',modeloConjuros:'preparados'}]});window.ir('compendio');
    });
    await click('button[title="Clase que aprende el conjuro"]');await texto('Bardo');
    await buscarConjuro('Curar heridas');await pulsarFila('Curar heridas');
    await esperar(()=>window.pj().eleccionesConjurosClase?.Bardo.conjuros.length===1);
    await click('button[title="Clase que aprende el conjuro"]');await texto('Clérigo');await pulsarFila('Curar heridas');
    await esperar(()=>window.pj().eleccionesConjurosClase?.['Clérigo'].conjuros.length===1);
    await click('button[title="Clase que aprende el conjuro"]');await texto('Bardo');await pulsarFila('Curar heridas');
    await esperar(()=>window.pj().eleccionesConjurosClase.Bardo.conjuros.length===0);
    assert.deepEqual(await pagina.evaluate(()=>window.pj().conjurosPreparadosIds),['h_curar-heridas']);
    await dimension(ancho,'Preparaciones por clase');
    informe.casos.push({ ancho, flujo: "Dos preparaciones adquiridas por la UI; quitar Bardo conserva la de Clérigo" });
    await pagina.evaluate(()=>window.ir('rasgos'));await pagina.waitForSelector('article');

    await pagina.evaluate(()=>{
      window.sembrar(1);window.estado().agregarHechizoHomebrew({...window.estado().baseDatosHechizos.find(h=>h.id==='h_caida-de-pluma'),nombre:'Conjuro de prueba homebrew'});window.ir('compendio');
    });
    await buscarConjuro('Conjuro de prueba homebrew');await pulsarFila('Conjuro de prueba homebrew');
    await esperar(()=>window.pj().eleccionesConjurosClase?.Bardo.conjuros.some(id=>id.startsWith('h_homebrew')));
    await pagina.evaluate(()=>window.recargar());
    assert.equal(await pagina.evaluate(()=>window.pj().conjurosPreparadosIds.some(id=>id.startsWith('h_homebrew'))),true);
    informe.casos.push({ ancho, flujo: "Homebrew: elección desde el compendio efectivo y conservación al recargar" });
    await pagina.evaluate(()=>window.ir('rasgos'));await pagina.waitForSelector('article');
  }
  assert.deepEqual(informe.errores, []);
  console.log(JSON.stringify(informe, null, 2));
} catch (e) { informe.fallo = e.stack;throw e; }
finally { fs.writeFileSync("scratch/bardo-ui-informe.json", JSON.stringify(informe, null, 2));await navegador?.close();await servidor.close(); }
