import React from "react";
import estilos from "@/componentes/caracteristicas/rasgos/VistaRasgosJugador.module.css";

/**
 * Renderiza el texto de descripción de rasgos y hechizos:
 * - Todo el texto general permanece en blanco puro (--pj-texto-primario).
 * - Únicamente los fragmentos entre asteriscos (*, **, ***) se colorean en cian (--pj-texto-cian),
 *   aplicándose la negrita y/o cursiva según corresponda.
 */
export function renderizarTextoEnriquecidoDND(texto: string): React.ReactNode {
  if (!texto) return null;

  // Dividir párrafos
  const parrafos = texto.split(/\n\s*\n/);

  return parrafos.map((parrafo, pIdx) => {
    // Procesar líneas del párrafo
    const lineas = parrafo.split("\n");

    return (
      <p key={pIdx} className={estilos.parrafoModalEnriquecido}>
        {lineas.map((linea, lIdx) => {
          // Tokenizar: ***texto*** (negrita + cursiva), **texto** (negrita), *texto* (cursiva)
          const partes = linea.split(/(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*)/g);

          return (
            <React.Fragment key={lIdx}>
              {partes.map((parte, parteIdx) => {
                if (parte.startsWith("***") && parte.endsWith("***") && parte.length > 6) {
                  const contenido = parte.slice(3, -3);
                  return (
                    <strong key={parteIdx} className={estilos.subtituloRasgoModal}>
                      <em>{contenido}</em>{" "}
                    </strong>
                  );
                }
                if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4) {
                  const contenido = parte.slice(2, -2);
                  return (
                    <strong key={parteIdx} className={estilos.negritaModal}>
                      {contenido}{" "}
                    </strong>
                  );
                }
                if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 2) {
                  const contenido = parte.slice(1, -1);
                  return (
                    <em key={parteIdx} className={estilos.cursivaColoreadaModal}>
                      {contenido}
                    </em>
                  );
                }

                return <span key={parteIdx}>{parte}</span>;
              })}
              {lIdx < lineas.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </p>
    );
  });
}

/**
 * Limpia marcas de markdown simples (asteriscos de énfasis) y trunca el texto al límite especificado.
 */
export function limpiarYTruncarTextoMarkdown(texto: string = "", limite = 115): string {
  const textoLimpio = texto
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();

  if (textoLimpio.length <= limite) {
    return textoLimpio;
  }
  return `${textoLimpio.slice(0, limite)}...`;
}
