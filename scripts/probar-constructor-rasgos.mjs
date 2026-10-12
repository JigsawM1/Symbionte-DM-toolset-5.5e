import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createServer } from "vite";
import puppeteer from "puppeteer-core";

const ejecutable = [process.env.CHROME_PATH, process.env.CHROME_BIN,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"
].find((ruta) => ruta && existsSync(ruta));
assert(ejecutable, "Configura CHROME_PATH con un navegador Chromium para ejecutar las pruebas de interfaz.");

// La página de prueba solo existe en este servidor y usa el perfil temporal de Puppeteer.
const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body>
<div id="prueba"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConstructorRasgoDote } from '/src/componentes/caracteristicas/rasgos/ConstructorRasgoDote.tsx';
import { PERSONAJE_POR_DEFECTO } from '/src/constantes/personajeConstantes.ts';
import { tieneConjuroGratuitoActivo } from '/src/servicios/rasgos/evaluadorConjurosRasgos.ts';
const root = createRoot(document.getElementById('prueba'));
const personaje = { ...PERSONAJE_POR_DEFECTO, id:'prueba_ui', nombre:'Auditoría', nivel:4, rasgos:[] };
const inicial = { id:'rasgo_hb_prueba', nombre:'Don activo', descripcion:'', origen:'personalizado',
  fuente:'Homebrew', tipoAccion:'accion_adicional', tieneUsosLimitados:true, usosMaximos:3, usosRestantes:2,
  recuperacion:'descanso_largo', personalizado:true, activo:true, esActivable:true, notas:'',
  requiereSinMovimiento:true, dadosGuardados:[18] };
let clave = 0;
globalThis.guardados = [];
globalThis.montar = (editar = true) => {
  globalThis.guardados = [];
  root.render(React.createElement(ConstructorRasgoDote, { key:++clave, personaje,
    rasgoInicial:editar ? inicial : undefined,
    alGuardar:rasgo => globalThis.guardados.push(rasgo), alVolver:() => {} }));
};
globalThis.esGratuito = () => tieneConjuroGratuitoActivo({ ...personaje, rasgos:globalThis.guardados }, 'detectar_magia');
globalThis.montar();
</script></body></html>`;

const servidor = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error",
  plugins: [{ name: "pagina-pruebas-rasgos", configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url !== "/__pruebas-rasgos") return next();
      try { res.setHeader("Content-Type", "text/html"); res.end(await server.transformIndexHtml(req.url, html)); }
      catch (error) { next(error); }
    });
  } }]
});
let navegador;
try {
  await servidor.listen();
  const direccion = servidor.httpServer.address();
  assert(direccion && typeof direccion === "object");
  navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true });
  const pagina = await navegador.newPage();
  const errores = [];
  pagina.on("pageerror", (error) => errores.push(error.message));
  pagina.on("requestfailed", (solicitud) => errores.push(`${solicitud.url()}: ${solicitud.failure()?.errorText}`));
  await pagina.goto(`http://127.0.0.1:${direccion.port}/__pruebas-rasgos`);
  try { await pagina.waitForSelector('input[aria-label="Nombre del Rasgo o Dote"]'); }
  catch (error) { throw new Error(`No se pudo cargar el editor: ${errores.join("; ")}`, { cause: error }); }

  const pulsarTexto = async (texto) => {
    const encontrado = await pagina.evaluate((valor) => {
      const boton = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === valor);
      if (!boton) return false;
      boton.click(); return true;
    }, texto);
    assert(encontrado, `No se encontró el botón: ${texto}`);
  };
  const escribir = async (selector, valor) => {
    await pagina.click(selector);
    await pagina.keyboard.down("Control"); await pagina.keyboard.press("KeyA"); await pagina.keyboard.up("Control");
    await pagina.keyboard.press("Backspace"); await pagina.type(selector, valor);
  };
  const guardar = () => pagina.click('button[title="Guardar rasgo en este personaje"]');
  const montar = async (editar) => {
    await pagina.evaluate((valor) => globalThis.montar(valor), editar);
    await pagina.waitForFunction((valor) => document.querySelector('input[aria-label="Nombre del Rasgo o Dote"]').value === (valor ? "Don activo" : ""), {}, editar);
  };

  await escribir('input[aria-label="Nombre del Rasgo o Dote"]', "Nombre editado");
  await guardar();
  let guardados = await pagina.evaluate(() => globalThis.guardados);
  assert.equal(guardados[0].nombre, "Nombre editado");
  assert.equal(guardados[0].activo, true);
  assert.equal(guardados[0].usosRestantes, 2);
  assert.equal(guardados[0].requiereSinMovimiento, true);
  assert.deepEqual(guardados[0].dadosGuardados, [18]);

  await montar(true);
  await escribir('input[aria-label="Usos Restantes Actuales"]', "-5");
  await guardar();
  await pagina.waitForSelector('[role="alert"]');
  assert.equal(await pagina.evaluate(() => globalThis.guardados.length), 0);
  assert.equal(await pagina.$eval('input[aria-label="Usos Restantes Actuales"]', (n) => n.getAttribute("aria-invalid")), "true");
  await escribir('input[aria-label="Usos Restantes Actuales"]', "4");
  await guardar();
  assert.equal(await pagina.evaluate(() => globalThis.guardados.length), 0);

  await montar(false);
  await escribir('input[aria-label="Nombre del Rasgo o Dote"]', "Don mágico");
  await pulsarTexto("Añadir Efecto Mecánico");
  await pulsarTexto("Dados Extra de Daño");
  await pulsarTexto("Lanzamiento Gratuito de Conjuro");
  await pagina.waitForSelector('input[placeholder="ej. orden_imperiosa, detectar_magia..."]');
  await escribir('input[placeholder="ej. orden_imperiosa, detectar_magia..."]', "detectar_magia");
  await pulsarTexto("Confirmar Efecto");
  await guardar();
  assert.equal(await pagina.evaluate(() => globalThis.esGratuito()), true);

  await montar(false);
  await pulsarTexto("-- Elegir Dote Oficial --");
  await pulsarTexto("Iniciado en la Magia (Mago) (Origen)");
  await pulsarTexto("-- Elegir Dote Oficial --");
  await pulsarTexto("Alerta (Origen)");
  await guardar();
  guardados = await pagina.evaluate(() => globalThis.guardados);
  assert.equal(guardados[0].nombre, "Alerta");
  assert.deepEqual(guardados[0].selectores, []);
  assert.deepEqual(guardados[0].conjurosOtorgados, []);
  assert.deepEqual(errores, [], "La interfaz produjo errores de ejecución.");
  console.log("Interfaz de rasgos: edición, validación, conjuro gratuito y cambio de plantilla correctos.");
} finally {
  await navegador?.close();
  await servidor.close();
}
