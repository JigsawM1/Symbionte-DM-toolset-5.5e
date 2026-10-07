import React from "react";
import { renderizarTextoConDadosInteractivos } from "@/utiles/lanzadorDados";
import estilos from "./TextoEnriquecidoDND.module.css";

export interface TextoEnriquecidoDNDProps {
  texto: string;
  className?: string;
  permitirTiradas?: boolean;
  etiquetaTirada?: string;
}

/**
 * Normaliza texto eliminando scripts y etiquetas peligrosas y convirtiendo
 * el marcado HTML básico de compendios (br, b, i, em, strong) a formato interpretado por React.
 */
function normalizarContenidoSeguro(texto: string): string {
  if (!texto) return "";

  // 1. Eliminar etiquetas potencialmente peligrosas y sus contenidos
  let limpio = texto.replace(/<\s*(script|style|iframe|object|embed|applet)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");

  // 2. Normalizar saltos de línea HTML a saltos de línea reales
  limpio = limpio.replace(/<\s*br\s*\/?>/gi, "\n");
  limpio = limpio.replace(/<\s*\/p\s*>/gi, "\n\n");
  limpio = limpio.replace(/<\s*p[^>]*>/gi, "");

  // 3. Normalizar etiquetas de formato estándar HTML a markdown para que el parser las procese
  limpio = limpio.replace(/<\s*(?:b|strong)[^>]*>([\s\S]*?)<\s*\/\s*(?:b|strong)\s*>/gi, "**$1**");
  limpio = limpio.replace(/<\s*(?:i|em)[^>]*>([\s\S]*?)<\s*\/\s*(?:i|em)\s*>/gi, "*$1*");

  // 4. Eliminar cualquier otra etiqueta HTML residual para evitar inyecciones
  limpio = limpio.replace(/<[^>]+>/g, "");

  return limpio;
}

export const TextoEnriquecidoDND: React.FC<TextoEnriquecidoDNDProps> = React.memo(({
  texto,
  className,
  permitirTiradas = false,
  etiquetaTirada
}) => {
  if (!texto) return null;

  const textoSeguro = normalizarContenidoSeguro(texto);
  const parrafos = textoSeguro.split(/\n\s*\n/);

  const procesarTextoNodos = (txt: string): React.ReactNode => {
    if (permitirTiradas && etiquetaTirada) {
      return renderizarTextoConDadosInteractivos(txt, etiquetaTirada);
    }
    return txt;
  };

  return (
    <>
      {parrafos.map((parrafo, pIdx) => {
        const lineas = parrafo.split("\n");

        return (
          <p key={pIdx} className={className || estilos.parrafoModalEnriquecido}>
            {lineas.map((linea, lIdx) => {
              const partes = linea.split(/(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*)/g);

              return (
                <React.Fragment key={lIdx}>
                  {partes.map((parte, parteIdx) => {
                    if (parte.startsWith("***") && parte.endsWith("***") && parte.length > 6) {
                      const contenido = parte.slice(3, -3);
                      return (
                        <strong key={parteIdx} className={estilos.subtituloRasgoModal}>
                          <em>{procesarTextoNodos(contenido)}</em>{" "}
                        </strong>
                      );
                    }
                    if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4) {
                      const contenido = parte.slice(2, -2);
                      return (
                        <strong key={parteIdx} className={estilos.negritaModal}>
                          {procesarTextoNodos(contenido)}{" "}
                        </strong>
                      );
                    }
                    if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 2) {
                      const contenido = parte.slice(1, -1);
                      return (
                        <em key={parteIdx} className={estilos.cursivaColoreadaModal}>
                          {procesarTextoNodos(contenido)}
                        </em>
                      );
                    }

                    return <span key={parteIdx}>{procesarTextoNodos(parte)}</span>;
                  })}
                  {lIdx < lineas.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </>
  );
});

TextoEnriquecidoDND.displayName = "TextoEnriquecidoDND";
