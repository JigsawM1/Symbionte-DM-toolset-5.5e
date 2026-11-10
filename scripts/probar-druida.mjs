import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";
import { htmlClerigo } from "./fixture-clerigo.mjs";

const html = htmlClerigo.replaceAll("Clérigo", "Druida").replaceAll("rasgo_cls_clerigo_", "rasgo_cls_druida_")
  .replace("window.sembrar=(nivel=20)=>", "window.sembrar=(nivel=20,circulo='')=>")
  .replace("aplicarBuildClaseAPersonaje(base,'Druida',nivel)", "aplicarBuildClaseAPersonaje(base,'Druida',nivel,circulo)");
const servidor = await createServer({
  server: { host: "127.0.0.1", port: 0 }, logLevel: "error", plugins: [{
    name: "prueba-druida",
    configureServer(s) {
      s.middlewares.use(async (req, res, next) => {
        if (req.url !== "/__druida") return next();
        try {
          res.setHeader("Content-Type", "text/html");
          res.end(await s.transformIndexHtml(req.url, html));
        } catch (error) {
          next(error);
        }
      });
    }
  }]
});
const ejecutable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p => p && existsSync(p));
assert(ejecutable, "Se requiere Chromium local.");

let navegador;
try {
  await servidor.listen();
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  const pagina = await navegador.newPage();
  pagina.setDefaultTimeout(12000);
  await pagina.setViewport({ width: 599, height: 760 });
  const errores = [];
  const mensajes = [];
  pagina.on("pageerror", error => errores.push(error.message));
  pagina.on("console", mensaje => mensajes.push(mensaje.text()));
  const pulsar = async (selector, texto) => {
    const nodo = await pagina.waitForFunction((s, t) => Array.from(document.querySelectorAll(s))
      .find(e => e.getClientRects().length && !e.disabled && (t === undefined || e.textContent.trim() === t)), {}, selector, texto)
      .catch(async error => {
        const controles = await pagina.evaluate(() => [...document.querySelectorAll('[role="dialog"],dialog[open],[class*="contenedorModalDetalle"]')]
          .flatMap(e => [...e.querySelectorAll("button")].map(b => [b.textContent.trim(), b.title, b.disabled])));
        throw new Error(`No se encontró ${texto ?? selector}. Controles: ${JSON.stringify(controles)}`, { cause: error });
      });
    await nodo.asElement().scrollIntoView();
    await nodo.asElement().click();
    await nodo.dispose();
  };
  const boton = (texto, ambito = "body") => pulsar(`${ambito} button`, texto);
  const detalle = async nombre => {
    const nodo = await pagina.waitForFunction(n => [...document.querySelectorAll("article")].find(a =>
      a.querySelector('[class*="nombreRasgo"]')?.textContent.trim().replace(/^Nv \d+: /, "") === n)
      ?.querySelector('button[title="Ver descripción completa en modal"]'), {}, nombre);
    await nodo.asElement().scrollIntoView();
    await nodo.asElement().click();
    await nodo.dispose();
  };
  const cerrar = async () => {
    const control = 'button[title="Cerrar modal"]';
    await pulsar(control);
    await pagina.waitForFunction(s => !document.querySelector(s), {}, control);
  };
  const forma = () => pagina.evaluate(() => window.rasgo("forma_salvaje").usosRestantes);
  const ruta = `http://127.0.0.1:${servidor.httpServer.address().port}/__druida`;
  await pagina.goto(ruta, { waitUntil: "domcontentloaded", timeout: 60000 });

  await detalle("Orden primigenio");
  await pulsar('button[title="Mago"]');
  await cerrar();
  await detalle("Mago");
  await pulsar('button[title="Guía"]');
  await pagina.waitForFunction(() => window.pj().trucosConocidosIds.includes("h_guia"));
  await cerrar();
  await pagina.evaluate(() => window.recargar());
  assert(await pagina.evaluate(() => window.pj().trucosConocidosIds.includes("h_guia")));
  console.log("Orden primigenio, truco y recarga de ficha");

  const ataques = () => pulsar('button[title="Acciones de Combate, Armas y Conjuros"]');
  const resumenDescanso = '[role="dialog"][aria-labelledby="titulo-resumen-descanso"]';
  const cerrarDescanso = async () => {
    await boton("Entendido", resumenDescanso);
    await pagina.waitForSelector(resumenDescanso, { hidden: true });
  };
  const rasgos = async () => {
    if (await pagina.evaluate(() => window.estado().pestañaActiva === "rasgos")) return;
    await pulsar('button[title="Más pestañas: Rasgos, Notas e Iniciativa"]');
    await boton("Rasgos");
    await pagina.waitForFunction(() => window.estado().pestañaActiva === "rasgos");
  };
  await pulsar('button[title="Gestor y Compendio de Conjuros"]');
  await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="filaContenedor"]')]
    .some(e => e.textContent.includes("Encontrar familiar")));
  assert(await pagina.evaluate(() => window.pj().conjurosSiemprePreparadosIds.includes("h_encontrar-familiar")));
  await boton("Todos");
  await boton("Filtrar");
  const buscarConjuro = 'input[placeholder="Buscar por nombre, efecto, escuela..."]';
  await pagina.waitForSelector(buscarConjuro, { visible: true });
  await pagina.type(buscarConjuro, "Proyectil mágico");
  const independiente = '[class*="filaContenedor"] button[title="Añadir como concesión independiente"]';
  await pulsar(independiente);
  await pagina.waitForFunction(() => window.pj().aprendizajesConjurosIndependientes.conjuros.includes("h_proyectil-magico")
    && window.pj().conjurosPreparadosIds.includes("h_proyectil-magico"));
  await pagina.evaluate(() => window.recargar());
  await pulsar('[class*="filaContenedor"] button[title="Quitar concesión independiente"]');
  await pagina.waitForFunction(() => !window.pj().conjurosPreparadosIds.includes("h_proyectil-magico"));
  await pagina.click(buscarConjuro, { clickCount: 3 });
  await pagina.keyboard.press("Backspace");
  console.log("Todos permite añadir, recargar y quitar un conjuro ajeno a la lista");
  await rasgos();
  await detalle("Compañero salvaje");
  assert.equal(await pagina.$('section[aria-label="Lanzamientos de Compañero salvaje"]'), null);
  await cerrar();
  assert.equal(await forma(), 4);
  console.log("Encontrar familiar aparece como conjuro normal otorgado por Compañero salvaje");

  await pulsar('button[title="Ficha y Características del Personaje"]');
  await boton("FORMA SALVAJE");
  await boton("Gestionar Formas (0/8)");
  await pagina.type('input[placeholder="Buscar bestia por nombre..."]', "Lobo");
  const lobo = await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="itemOpcionPool"]')]
    .find(e => e.querySelector("strong")?.textContent === "Lobo"));
  await lobo.asElement().click();
  await lobo.dispose();
  await boton("Guardar Reserva");
  await boton("Adoptar Forma");
  await pagina.waitForFunction(() => window.pj().formaSalvaje.formaActivaId === "m_lobo");
  for (let i = 0; i < 3; i++) {
    await boton("Volver a adoptar");
    await boton("Transformar", '[role="dialog"][aria-label="Preparar transformación"]');
    await pagina.waitForFunction(usos => window.rasgo("forma_salvaje").usosRestantes === usos, {}, 2 - i);
  }
  assert(await pagina.$eval('button:has(svg.lucide-zap)[class*="botonAdoptar"]', e => e.disabled));
  await pulsar('button[title^="Descanso Corto"]');
  await cerrarDescanso();
  assert.equal(await forma(), 1);
  console.log("Transformación, agotamiento y descanso corto");

  await rasgos();
  await detalle("Furia elemental");
  await pulsar('button[title="Lanzamiento potente"]');
  await cerrar();
  await pagina.evaluate(() => window.estado().agregarTrucoConocido(window.pj().id, "h_voluta-estelar", "Druida"));
  await pulsar('button[title="Gestor y Compendio de Conjuros"]');
  await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="filaContenedor"]')]
    .some(e => e.textContent.includes("Voluta estelar") && e.textContent.includes("360 pies")));
  await rasgos();
  await detalle("Furia elemental");
  await pulsar('button[title="Golpe primordial"]');
  await cerrar();
  await ataques();
  await pulsar('button[title^="Tirar Daño normal"]');
  await pulsar('dialog[open] button[aria-label="Golpe primordial · Frío"]');
  await pagina.waitForFunction(() => !document.querySelector('dialog[open][aria-label="Daño adicional al impactar"]'));
  assert(mensajes.some(m => /Fr[ií]o.*Mordisco/i.test(m)), "La tirada contiene un grupo de daño frío del Mordisco");
  console.log("Furia elemental en el compendio y en la tirada de daño del ataque");

  await rasgos();
  await pulsar('button[aria-label="Crear o convertir espacios con Resurgimiento salvaje"]');
  await boton("Confirmar creación", "dialog[open]");
  await pagina.waitForFunction(() => window.pj().espaciosConjuroAdicionales[1] === 1);
  assert.equal(await forma(), 0);
  await pulsar('button[aria-label="Crear o convertir espacios con Resurgimiento salvaje"]');
  await boton("Recuperar un uso", "dialog[open]");
  await pulsar('dialog[open] button[title="Espacio a convertir"]');
  await boton("Nivel 1 · adicional · 1 disponibles", "dialog[open]");
  await pulsar('dialog[open] input[type="checkbox"]');
  await boton("Confirmar conversión", "dialog[open]");
  await pagina.waitForFunction(() => window.rasgo("forma_salvaje").usosRestantes === 1);
  await pulsar('button[aria-label="Crear o convertir espacios con Archidruida"]');
  await boton("Confirmar creación", "dialog[open]");
  await pagina.waitForFunction(() => window.pj().espaciosConjuroAdicionales[2] === 1);
  await pagina.evaluate(() => window.recargar());
  assert.equal(await forma(), 0);
  await pulsar('button[title="Ficha y Características del Personaje"]');
  await pulsar('button[title^="Descanso Largo"]');
  await cerrarDescanso();
  assert.equal(await forma(), 4);
  assert.deepEqual(await pagina.evaluate(() => window.pj().espaciosConjuroAdicionales), {});
  console.log("Resurgimiento, Archidruida y persistencia de usos en Chromium");

  await pagina.evaluate(() => {
    const pj = window.pj();
    const voluta = { trucos: ["h_voluta-estelar"], conjuros: [] };
    window.estado().actualizarPersonaje(pj.id, {
      clases: [{ nombre: "Druida", nivel: 19, subclase: "" }, { nombre: "Bardo", nivel: 1, subclase: "" }],
      eleccionesConjurosClase: { Druida: voluta, Bardo: voluta }
    });
  });
  await rasgos();
  await detalle("Furia elemental");
  await pulsar('button[title="Lanzamiento potente"]');
  await cerrar();
  await ataques();
  const lanzarVoluta = await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="tarjetaPreparada"]')]
    .find(e => e.querySelector('[class*="nombreConjuro"]')?.textContent === "Voluta estelar")
    ?.querySelector('button[title="Lanzar truco a TaleSpire"]'));
  await lanzarVoluta.asElement().click();
  await lanzarVoluta.dispose();
  const clases = 'dialog[open][aria-label="Clase de lanzamiento"]';
  await pagina.waitForFunction(s => document.querySelector(`${s} button[aria-label="Druida"]`)?.textContent.includes("360 pies")
    && document.querySelector(`${s} button[aria-label="Bardo"]`)?.textContent.includes("60 pies"), {}, clases);
  await pulsar(`${clases} button[aria-label="Druida"]`);
  await pagina.waitForFunction(s => !document.querySelector(s), {}, clases);
  assert(mensajes.some(m => /TIRADA LOCAL MOCK.*VOLUTA ESTELAR/.test(m)), "La tarjeta emite Voluta estelar con la clase elegida");
  console.log("Voluta estelar comparte selector de clase y muestra su alcance por procedencia");

  const sembrar = (nivel, circulo) => pagina.evaluate((n, c) => window.sembrar(n, c), nivel, circulo);
  const modalDetalle = '[class*="contenedorModalDetalle"]';
  const alternarDetalle = activo => pulsar(`${modalDetalle} button[title^="Rasgo ${activo ? "activo" : "inactivo"}"]`);
  await sembrar(10, "Círculo de la Tierra");
  await detalle("Conjuros del Círculo de la Tierra");
  await boton("Árida", modalDetalle);
  await pagina.waitForFunction(() => window.pj().conjurosSiemprePreparadosIds.includes("h_bola-de-fuego"));
  await cerrar();
  await pulsar('button[title="Gestor y Compendio de Conjuros"]');
  await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="filaContenedor"]')]
    .some(e => e.textContent.includes("Bola de fuego")));
  await ataques();
  const lanzarBola = await pagina.waitForFunction(() => [...document.querySelectorAll('[class*="tarjetaPreparada"]')]
    .find(e => e.querySelector('[class*="nombreConjuro"]')?.textContent === "Bola de fuego")
    ?.querySelector('button[title^="Lanzar con ranura"]'));
  await lanzarBola.asElement().click();
  await lanzarBola.dispose();
  await pulsar('dialog[open] button[aria-label="Con 1 uso de Recuperación natural"]');
  await pagina.waitForFunction(() => window.pj().rasgos.find(r => r.id.endsWith("_recuperacion_natural")).usosRestantes === 0);
  assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[3] ?? 0), 0);
  await pagina.evaluate(() => window.estado().gastarEspacioConjuro(window.pj().id, 1));
  assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[1]), 1);
  await pulsar('button[title="Ficha y Características del Personaje"]');
  await pulsar('button[title^="Descanso Corto"]');
  await cerrarDescanso();
  await rasgos();
  await detalle("Recuperación natural · espacios");
  await boton("Recuperar Espacios", modalDetalle);
  await pulsar('button[aria-label="Añadir espacio nivel 1"]');
  await boton("Recuperar (1)", '[role="dialog"][aria-labelledby="titulo-tienda-recuperacion"]');
  assert.equal(await pagina.evaluate(() => window.pj().espaciosConjuroGastados[1] ?? 0), 0);
  await cerrar();
  console.log("Tierra elige variante y recupera espacios desde la tienda");

  await sembrar(14, "Círculo de la Luna");
  await pagina.evaluate(() => window.estado().establecerFormasConocidasDruida(window.pj().id, ["m_lobo"]));
  await pulsar('button[title="Ficha y Características del Personaje"]');
  await boton("FORMA SALVAJE");
  await boton("Adoptar Forma");
  await pagina.waitForFunction(() => window.pj().hpTemporal === 42);
  await ataques();
  await pulsar('button[title^="Tirar Daño normal"]');
  await pulsar('dialog[open] button[aria-label="Radiante"]');
  await pulsar('dialog[open] button[aria-label="Forma lunar · Añadir resplandor lunar"]');
  await pagina.waitForFunction(() => !document.querySelector('dialog[open][aria-label="Daño adicional al impactar"]'));
  assert(mensajes.some(m => /Radiante.*Mordisco.*2d10/i.test(m)));
  console.log("Luna transforma y añade el daño de Forma lunar desde Ataques");

  await sembrar(14, "Círculo del Mar");
  await detalle("Ira del mar");
  await alternarDetalle(false);
  await pulsar('dialog[open] button[aria-label="Seleccionar Druida"]');
  await pulsar('dialog[open] button[aria-label^="Seleccionar Aliado voluntario"]');
  await pulsar('dialog[open] button[aria-label="Confirmar activación"]');
  await pagina.waitForFunction(() => window.rasgo("forma_salvaje").usosRestantes === 1);
  await alternarDetalle(true);
  await boton("Disipar", "dialog[open]");
  await pagina.waitForFunction(() => !window.pj().rasgos.find(r => r.id.endsWith("_ira_del_mar")).activo);
  await cerrar();
  console.log("Mar activa ambos portadores por dos usos y disipa el aura");

  await sembrar(14, "Círculo de las Estrellas");
  await detalle("Mapa estelar");
  await alternarDetalle(false);
  await pagina.waitForFunction(() => window.pj().conjurosSiemprePreparadosIds.includes("h_saeta-guia"));
  await alternarDetalle(true);
  await pagina.waitForFunction(() => !window.pj().conjurosSiemprePreparadosIds.includes("h_saeta-guia"));
  await cerrar();
  await detalle("Forma estelar");
  await alternarDetalle(false);
  await pulsar('dialog[open] button[aria-label="Seleccionar Dragón"]');
  await pulsar('dialog[open] button[aria-label="Confirmar activación"]');
  await pagina.waitForFunction(() => window.pj().rasgos.find(r => r.id.endsWith("_forma_estelar")).activo);
  await cerrar();
  await pulsar('button[title="Ficha y Características del Personaje"]');
  await pulsar('button[title^="Descanso Largo"]');
  await cerrarDescanso();
  await pagina.evaluate(() => window.estado().establecerPestaña("rasgos"));
  await detalle("Presagio cósmico");
  await boton("Tirar en la tabla", modalDetalle);
  await boton("Determinar resultado", "dialog[open]");
  await boton("Resolver resultado 1", "dialog[open]");
  await pagina.waitForFunction(() => window.pj().rasgos.find(r => r.id.endsWith("_presagio_cosmico")).resultadoTabla?.idFila);
  await boton("Cerrar tabla", "dialog[open]");
  await cerrar();
  assert.deepEqual(errores, []);
  console.log("Estrellas sostiene y suelta el mapa, elige Dragón y consulta Presagio");
} finally {
  if (navegador) await navegador.close();
  await servidor.close();
}
