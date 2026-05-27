import React from "react";
import { renderizarTextoConDadosInteractivos } from "../../utiles/lanzadorDados";

/**
 * Utilidad de procesamiento de texto interactivo para la ficha de D&D.
 * Escanea textos buscando fórmulas de dados y nombres de conjuros del compendio,
 * convirtiéndolos en botones de lanzamiento 3D de TaleSpire y enlaces clickables.
 */
export const procesarTextoFicha = (
  texto: string,
  etiquetaTirada: string,
  baseDatosHechizos: any[],
  alHacerClicHechizo: (hechizo: any) => void
): React.ReactNode[] => {
  // 1. Primero procesamos los dados
  const nodosConDados = renderizarTextoConDadosInteractivos(texto, etiquetaTirada);
  
  // 2. Si no hay hechizos en la DB, devolvemos directo
  if (!baseDatosHechizos || baseDatosHechizos.length === 0) return nodosConDados;

  // Ordenar hechizos por longitud de nombre de mayor a menor para evitar colisiones
  const hechizosOrdenados = [...baseDatosHechizos].sort((a, b) => b.nombre.length - a.nombre.length);

  // Procesamos cada nodo de texto
  const nodosFinales: React.ReactNode[] = [];

  nodosConDados.forEach((nodo) => {
    if (typeof nodo !== "string") {
      nodosFinales.push(nodo); // Preservamos los botones de dados ya procesados
      return;
    }

    // Procesamos el texto plano buscando hechizos
    let textosAIterar = [{ texto: nodo, id: 0 }];
    let keyCounter = 0;

    for (const hechizo of hechizosOrdenados) {
      const nombreHechizo = hechizo.nombre.toLowerCase().trim();
      if (nombreHechizo.length < 3) continue; // Ignorar nombres ridículamente cortos

      const nuevosTextos: typeof textosAIterar = [];

      for (const item of textosAIterar) {
        if (typeof item === "object" && (item as any).componente) {
          nuevosTextos.push(item);
          continue;
        }

        const textoOriginal = item.texto;
        
        // Regex segura para buscar el nombre del hechizo respetando límites lógicos
        const nombreEscapado = nombreHechizo.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regexHechizo = new RegExp(`\\b${nombreEscapado}\\b`, "i");
        const match = textoOriginal.match(regexHechizo);

        if (match && match.index !== undefined) {
          const indice = match.index;
          const antes = textoOriginal.substring(0, indice);
          const coincidenciaOriginal = textoOriginal.substring(indice, indice + nombreHechizo.length);
          const despues = textoOriginal.substring(indice + nombreHechizo.length);

          if (antes) nuevosTextos.push({ texto: antes, id: ++keyCounter });
          
          // Creamos el componente de enlace
          const enlaceReact = React.createElement(
            "span",
            {
              key: `hechizo-link-${hechizo.id}-${keyCounter}`,
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                alHacerClicHechizo(hechizo);
              },
              style: {
                color: "var(--color-borde-cian)",
                textDecoration: "underline dashed var(--color-borde-cian)",
                cursor: "pointer",
                fontWeight: "bold",
                padding: "0 4px",
                backgroundColor: "rgba(0, 245, 212, 0.06)",
                borderRadius: "3px",
                display: "inline-block",
                transition: "all 0.15s ease"
              },
              title: `Ver conjuro "${hechizo.nombre}"`
            },
            `📖 ${coincidenciaOriginal}`
          );

          nuevosTextos.push({ componente: enlaceReact } as any);

          if (despues) nuevosTextos.push({ texto: despues, id: ++keyCounter });
        } else {
          nuevosTextos.push(item);
        }
      }

      textosAIterar = nuevosTextos;
    }

    // Convertimos todo de vuelta a nodos de React
    textosAIterar.forEach((item) => {
      if ((item as any).componente) {
        nodosFinales.push((item as any).componente);
      } else {
        nodosFinales.push(item.texto);
      }
    });
  });

  return nodosFinales;
};
