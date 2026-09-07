import React from "react";
import estilos from "./TextoEnriquecidoDND.module.css";

export interface TextoEnriquecidoDNDProps {
  texto: string;
}

export const TextoEnriquecidoDND: React.FC<TextoEnriquecidoDNDProps> = ({ texto }) => {
  if (!texto) return null;

  const parrafos = texto.split(/\n\s*\n/);

  return (
    <>
      {parrafos.map((parrafo, pIdx) => {
        const lineas = parrafo.split("\n");

        return (
          <p key={pIdx} className={estilos.parrafoModalEnriquecido}>
            {lineas.map((linea, lIdx) => {
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
      })}
    </>
  );
};
