import fs from 'fs';
import path from 'path';
import { importarDesdeJSON } from '../src/almacen/importadorJSON';

const monstersJsonPath = './prueba base/Mounstros.2024-es.json';
const rawData = JSON.parse(fs.readFileSync(monstersJsonPath, 'utf-8'));
const monstersJson = Array.isArray(rawData) ? rawData : (rawData.monstruos || Object.values(rawData));

const importacion = importarDesdeJSON(rawData, {
  baseDatosMonstruos: [],
  baseDatosHechizos: [],
  objetosHomebrew: []
});

const discrepancias = [];

for (const raw of monstersJson) {
  const nombreObj = raw.nombre || raw.Name || 'Desconocido';
  const importado = importacion.baseDatosMonstruos.find(m => m.nombre === nombreObj);
  
  if (!importado) {
    continue;
  }
  
  const sentidosRaw = raw.sentidos || raw.Senses || '';
  
  // Buscar con regex el número de percepción pasiva del string crudo
  const match = sentidosRaw.match(/percepci[oó]n\s+pasiva\s*(\d+)/i) 
             || sentidosRaw.match(/visi[oó]n\s+pasiva\s*(\d+)/i)
             || sentidosRaw.match(/passive\s+perception\s*(\d+)/i);
             
  const valorEsperado = match ? parseInt(match[1], 10) : null;
  const valorObtenido = importado.sentidos?.percepcionPasiva;
  
  if (valorEsperado !== null && valorEsperado !== valorObtenido) {
    discrepancias.push({
      nombre: importado.nombre,
      sentidosRaw,
      valorEsperado,
      valorObtenido
    });
  }
}

console.log(`Encontradas ${discrepancias.length} discrepancias de un total de ${monstersJson.length} monstruos.`);
if (discrepancias.length > 0) {
  console.log('Ejemplos de discrepancias (primeros 20):');
  console.log(discrepancias.slice(0, 20));
}
