import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raizProyecto = path.resolve(__dirname, "..");

// Umbrales acordados del proyecto
const LIMITE_MAXIMO_LINEAS = 500; // Falla CI si un nuevo archivo no autorizado lo excede
const LIMITE_ADVERTENCIA_LINEAS = 300; // Sugerencia de refactorización

const DIRECTORIO_SRC = path.join(raizProyecto, "src");

// Baseline controlado de deuda técnica heredada (en proceso de refactorización modular)
// ponytail: lista explícita y decreciente hacia cero tolerancia.
const ARCHIVOS_EXCEPCION_HEREDADOS = new Set([
  "src/utiles/lanzadorDados.ts",
  "src/servicios/calculadorMagia.ts",
  "src/componentes/caracteristicas/homebrew/subcomponentes/SeccionListasAtaques.tsx",
  "src/servicios/personajes/calculadorEstadisticasPersonaje.ts",
  "src/hooks/usarFormularioObjeto.ts",
  "src/servicios/gestorMunicion.ts",
  "src/almacen/importadorJSON.ts",
  "src/servicios/calculadorAtaquesArmas.ts",
  "src/servicios/rasgos/evaluadorSalvacionesRasgos.ts",
  "src/hooks/usarConexionTaleSpire.ts",
  "src/servicios/rasgos/evaluadorCombateRasgos.ts",
  "src/utiles/utilesConjuros.ts",
  "src/servicios/gestorEspecies.ts",
  "src/servicios/servicioLanzamientoConjuros.ts",
  "src/servicios/sincronizacionSimbiote.ts",
  "src/componentes/caracteristicas/compendio/FichaHechizo.tsx",
  "src/servicios/rasgos/evaluadorExpresionesRasgos.ts",
  "src/servicios/sincronizacion/motorEventosSync.ts",
  "src/tipos/rasgos.ts",
  "src/tipos/sync.ts"
]);

function obtenerArchivosRecursivos(directorio) {
  let archivos = [];
  if (!fs.existsSync(directorio)) return archivos;

  const entradas = fs.readdirSync(directorio, { withFileTypes: true });
  for (const entrada of entradas) {
    const rutaCompleta = path.join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      archivos = archivos.concat(obtenerArchivosRecursivos(rutaCompleta));
    } else if (
      (entrada.name.endsWith(".tsx") || entrada.name.endsWith(".ts")) &&
      !entrada.name.endsWith(".test.ts") &&
      !entrada.name.endsWith(".test.tsx") &&
      !entrada.name.endsWith(".spec.ts") &&
      !entrada.name.endsWith(".d.ts")
    ) {
      archivos.push(rutaCompleta);
    }
  }
  return archivos;
}

console.log("\n===============================================================================");
console.log("  AUDITORIA DE CONTROL DE TAMANO DE ARCHIVOS (CI) - GLOBAL EN TODO SRC");
console.log(`  - Limite de Error: > ${LIMITE_MAXIMO_LINEAS} lineas`);
console.log(`  - Limite de Advertencia: > ${LIMITE_ADVERTENCIA_LINEAS} lineas`);
console.log(`  - Excepciones de Deuda Heredada registradas: ${ARCHIVOS_EXCEPCION_HEREDADOS.size}`);
console.log("===============================================================================\n");

const archivosTotales = obtenerArchivosRecursivos(DIRECTORIO_SRC);

let conteoErrores = 0;
let conteoDeudaHeredada = 0;
let conteoAdvertencias = 0;
let conteoOptimos = 0;

console.log("LINEAS | ESTADO          | ARCHIVO");
console.log("-------------------------------------------------------------------------------");

// Ordenar por número de líneas descendente
const resultados = archivosTotales.map((rutaArchivo) => {
  const contenido = fs.readFileSync(rutaArchivo, "utf8");
  const lineas = contenido.split("\n").length;
  const rutaRelativa = path.relative(raizProyecto, rutaArchivo).replace(/\\/g, "/");
  return { rutaRelativa, lineas };
}).sort((a, b) => b.lineas - a.lineas);

for (const { rutaRelativa, lineas } of resultados) {
  const lineasFormateadas = lineas.toString().padStart(6);

  if (lineas > LIMITE_MAXIMO_LINEAS) {
    if (ARCHIVOS_EXCEPCION_HEREDADOS.has(rutaRelativa)) {
      console.warn(`${lineasFormateadas} | [DEUDA HEREDADA] | ${rutaRelativa}`);
      conteoDeudaHeredada++;
    } else {
      console.error(`${lineasFormateadas} | [ERROR NO AUTORIZADO] | ${rutaRelativa} (Excede ${LIMITE_MAXIMO_LINEAS} lineas)`);
      conteoErrores++;
    }
  } else if (lineas > LIMITE_ADVERTENCIA_LINEAS) {
    console.warn(`${lineasFormateadas} | [AVISO]         | ${rutaRelativa} (Sugerido refactorizar < ${LIMITE_ADVERTENCIA_LINEAS})`);
    conteoAdvertencias++;
  } else {
    conteoOptimos++;
  }
}

console.log("-------------------------------------------------------------------------------");
console.log(`Resumen: ${resultados.length} archivos auditados en todo el proyecto.`);
console.log(`  - Correctos (< ${LIMITE_ADVERTENCIA_LINEAS} lineas): ${conteoOptimos}`);
console.log(`  - Advertencias (${LIMITE_ADVERTENCIA_LINEAS}-${LIMITE_MAXIMO_LINEAS} lineas): ${conteoAdvertencias}`);
console.log(`  - Deuda Heredada autorizada (> ${LIMITE_MAXIMO_LINEAS} lineas): ${conteoDeudaHeredada}`);
console.log(`  - Errores Críticos no autorizados (> ${LIMITE_MAXIMO_LINEAS} lineas): ${conteoErrores}\n`);

if (conteoErrores > 0) {
  console.error(`[FALLO CI] Se encontraron ${conteoErrores} archivo(s) no autorizados que superan el limite de ${LIMITE_MAXIMO_LINEAS} lineas.`);
  console.error("Por favor, modulariza estos componentes en submódulos especializados antes de integrar.");
  process.exit(1);
} else {
  console.log("[EXITO CI] Todos los archivos cumplen con el umbral de tamaño permitido o están catalogados en el baseline.\n");
  process.exit(0);
}
