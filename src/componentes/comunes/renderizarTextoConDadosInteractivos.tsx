import React from "react";
import { Dices } from "lucide-react";
import { lanzarDadosTaleSpire, detectarTipoDaño } from "@/utiles/lanzadorDados";
import estilos from "./TextoEnriquecidoDND.module.css";

/**
 * Escanea un texto descriptivo, identifica fórmulas de dados comunes de D&D
 * (ej: 1d20, 2d6+4, d100) y las convierte en botones interactivos en React
 * que envían tiradas físicas a TaleSpire al hacer click.
 *
 * ponytail: función helper visual pura de la capa UI.
 */
export function renderizarTextoConDadosInteractivos(
  texto: string,
  etiquetaTirada: string
): React.ReactNode[] {
  if (!texto) return [];

  const regexDadosYModificadores = /\b(?:[1-9]\d*)?d(?:4|6|8|10|12|20|100)(?:\s*[+-]\s*\d+)?\b/gi;
  const partes: React.ReactNode[] = [];
  let ultimoIndice = 0;
  let match;

  while ((match = regexDadosYModificadores.exec(texto)) !== null) {
    const indiceCoincidencia = match.index;
    const textoCoincidente = match[0];

    if (indiceCoincidencia > ultimoIndice) {
      partes.push(texto.substring(ultimoIndice, indiceCoincidencia));
    }

    partes.push(
      <strong
        key={`dado-${indiceCoincidencia}`}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();

          let formulaConEtiqueta = "";
          const matchNombreLimpio = etiquetaTirada.match(/^([^(]+)/);
          const nombreLimpio = matchNombreLimpio ? matchNombreLimpio[1].trim() : etiquetaTirada;

          const esD20 = textoCoincidente.toLowerCase().includes("d20");
          if (esD20) {
            formulaConEtiqueta = `!${nombreLimpio}:${textoCoincidente}`;
          } else {
            const tipoDañoEncontrado = detectarTipoDaño(texto, "Daño");
            const etiquetaDaño = tipoDañoEncontrado === "Daño" ? "Daño" : `Daño ${tipoDañoEncontrado}`;
            formulaConEtiqueta = `!${etiquetaDaño}:${textoCoincidente}`;
          }

          lanzarDadosTaleSpire(formulaConEtiqueta, etiquetaTirada);
        }}
        className={`${estilos.dadoInteractivoInline} dado-interactivo-inline`}
        title={`Tirar ${textoCoincidente} en TaleSpire`}
      >
        <Dices size={12} className={`${estilos.iconoDadoInline} icono-dado-inline`} />
        {textoCoincidente}
      </strong>
    );

    ultimoIndice = regexDadosYModificadores.lastIndex;
  }

  if (ultimoIndice < texto.length) {
    partes.push(texto.substring(ultimoIndice));
  }

  return partes.length > 0 ? partes : [texto];
}
