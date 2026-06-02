import fs from 'fs';
import path from 'path';

const allJsonPath = './prueba base/all.json';
const allJson = JSON.parse(fs.readFileSync(allJsonPath, 'utf-8'));

function testParser(h) {
  let nivelNum = Number(h.nivel);
  let desc = '';
  if (Array.isArray(h.descripcion)) {
    desc = h.descripcion[0] || '';
  } else {
    desc = h.descripcion || '';
  }

  const descClean = desc
    .replace(/(\d+)d26\s*pies[áa]s/gi, "$1d8 más")
    .replace(/(\d+)d40\s*pies[áa]s/gi, "$1d12 más")
    .replace(/(\d+)d13\s*piesenos/gi, "$1d4 menos")
    .replace(/pies[áa]s/gi, "más")
    .replace(/piesenos/gi, "menos");

  let descNivelSuperior = undefined;
  let dadosDanoNivelSuperior = undefined;

  const upcastRegex = /(?:con un espacio de conjuro de nivel superior|a niveles superiores|al lanzarse a un nivel superior|lanzado con un espacio de nivel superior).*?[\.:]\s*(.*)/i;
  const upcastMatch = descClean.match(upcastRegex);
  if (upcastMatch) {
    descNivelSuperior = upcastMatch[1].replace(/^(?:\s*<\/?[a-z0-9]+>)+/gi, '').trim();
  }

  // Extraer dados de daño base
  let dadosDano = undefined;
  let descSencilla = descClean;
  const upcastIndex = descClean.search(/(?:con un espacio de conjuro de nivel superior|a niveles superiores|al lanzarse a un nivel superior|lanzado con un espacio de nivel superior)/i);
  if (upcastIndex !== -1) {
    descSencilla = descClean.substring(0, upcastIndex);
  }
  const diceMatch = descSencilla.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/);
  if (diceMatch) {
    dadosDano = diceMatch[1].replace(/\s+/g, "");
  }

  // Extraer dados de daño de nivel superior
  if (descNivelSuperior) {
    const upcastDiceMatch = descNivelSuperior.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/);
    if (upcastDiceMatch) {
      dadosDanoNivelSuperior = upcastDiceMatch[1].replace(/\s+/g, "");
    } else if (dadosDano) {
      const descNivelSuperiorLower = descNivelSuperior.toLowerCase();
      if (
        descNivelSuperiorLower.includes("dardo adicional") ||
        descNivelSuperiorLower.includes("rayo adicional") ||
        descNivelSuperiorLower.includes("proyectil adicional") ||
        descNivelSuperiorLower.includes("flecha adicional") ||
        descNivelSuperiorLower.includes("un dardo más") ||
        descNivelSuperiorLower.includes("un rayo más") ||
        descNivelSuperiorLower.includes("un proyectil más")
      ) {
        dadosDanoNivelSuperior = dadosDano;
      } else {
        const matchBaseDice = dadosDano.match(/\d+d(\d+)/);
        if (matchBaseDice) {
          const caras = matchBaseDice[1];
          if (descNivelSuperiorLower.includes("daño") || descNivelSuperiorLower.includes("dano") || descNivelSuperiorLower.includes("aumenta")) {
            dadosDanoNivelSuperior = `1d${caras}`;
          }
        }
      }
    }
  }

  return {
    nombre: h.nombre,
    descClean,
    descNivelSuperior,
    dadosDano,
    dadosDanoNivelSuperior
  };
}

const agathys = allJson.find(h => h.nombre === 'Armadura de Agathys');
console.log('Agathys parser result:', testParser(agathys));

const fuego = allJson.find(h => h.nombre === 'Bola de fuego');
console.log('Bola de fuego parser result:', testParser(fuego));

const proyectil = allJson.find(h => h.nombre === 'Proyectil mágico');
console.log('Proyectil mágico parser result:', testParser(proyectil));
