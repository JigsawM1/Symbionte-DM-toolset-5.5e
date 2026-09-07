import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raizProyecto = path.resolve(__dirname, "..");

// Umbrales acordados con el usuario
const LIMITE_MAXIMO_LINEAS = 500; // Falla CI si se excede
const LIMITE_ADVERTENCIA_LINEAS = 300; // Sugerencia de refactorización

// Archivos heredados pendientes de modularización en fases posteriores de mantenimiento
const ARCHIVOS_HEREDADOS_PENDIENTES = new Set([
  "src/componentes/caracteristicas/rasgos/ConstructorRasgoDote.tsx", // Creador masivo heredado pendiente de refactorización
  "src/componentes/caracteristicas/personajes/ModalAgregarObjeto.tsx", // Modal heredado de gestión de inventario
  "src/componentes/caracteristicas/personajes/ModalEditarPersonaje.tsx", // Modal heredado de edición general
  "src/componentes/caracteristicas/personajes/TarjetaObjetoInventario.tsx", // Componente de tarjeta de objeto heredado
  "src/componentes/caracteristicas/personajes/GestorPersonajes.tsx", // Vista contenedora general de personajes
]);

// Directorios prioritarios a auditar (Modo Jugador y componentes principales)
const DIRECTORIOS_AUDITADOS = [
  path.join(raizProyecto, "src", "componentes", "caracteristicas", "personajes"),
  path.join(raizProyecto, "src", "componentes", "caracteristicas", "rasgos")
];

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
      !entrada.name.endsWith(".d.ts")
    ) {
      archivos.push(rutaCompleta);
    }
  }
  return archivos;
}

console.log("\n===============================================================================");
console.log("  AUDITORIA DE CONTROL DE TAMANO DE ARCHIVOS (CI) - MODO JUGADOR");
console.log(`  - Limite de Error: > ${LIMITE_MAXIMO_LINEAS} lineas`);
console.log(`  - Limite de Advertencia: > ${LIMITE_ADVERTENCIA_LINEAS} lineas`);
console.log("===============================================================================\n");

let archivosTotales = [];
for (const dir of DIRECTORIOS_AUDITADOS) {
  archivosTotales = archivosTotales.concat(obtenerArchivosRecursivos(dir));
}

let conteoErrores = 0;
let conteoAdvertencias = 0;
let conteoOptimos = 0;
let conteoHeredados = 0;

console.log("LINEAS | ESTADO      | ARCHIVO");
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

  if (ARCHIVOS_HEREDADOS_PENDIENTES.has(rutaRelativa)) {
    console.warn(`${lineasFormateadas} | [HEREDADO]  | ${rutaRelativa} (Pendiente refactorización futura)`);
    conteoHeredados++;
  } else if (lineas > LIMITE_MAXIMO_LINEAS) {
    console.error(`${lineasFormateadas} | [ERROR]     | ${rutaRelativa} (Excede ${LIMITE_MAXIMO_LINEAS} lineas)`);
    conteoErrores++;
  } else if (lineas > LIMITE_ADVERTENCIA_LINEAS) {
    console.warn(`${lineasFormateadas} | [AVISO]     | ${rutaRelativa} (Sugerido refactorizar < ${LIMITE_ADVERTENCIA_LINEAS})`);
    conteoAdvertencias++;
  } else {
    console.log(`${lineasFormateadas} | [CORRECTO]  | ${rutaRelativa}`);
    conteoOptimos++;
  }
}

console.log("-------------------------------------------------------------------------------");
console.log(`Resumen: ${resultados.length} archivos auditados.`);
console.log(`  - Correctos (< ${LIMITE_ADVERTENCIA_LINEAS} lineas): ${conteoOptimos}`);
console.log(`  - Advertencias (${LIMITE_ADVERTENCIA_LINEAS}-${LIMITE_MAXIMO_LINEAS} lineas): ${conteoAdvertencias}`);
console.log(`  - Heredados en backlog: ${conteoHeredados}`);
console.log(`  - Errores Críticos (> ${LIMITE_MAXIMO_LINEAS} lineas): ${conteoErrores}\n`);

if (conteoErrores > 0) {
  console.error(`[FALLO CI] Se encontraron ${conteoErrores} archivo(s) no autorizados que superan el limite de ${LIMITE_MAXIMO_LINEAS} lineas.`);
  console.error("Por favor, modulariza estos componentes en submódulos especializados antes de integrar.");
  process.exit(1);
} else {
  console.log("[EXITO CI] Todos los componentes auditados cumplen con el umbral de tamaño permitido.\n");
  process.exit(0);
}
