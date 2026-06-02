import fs from 'fs';
import path from 'path';

const file = 'c:/Users/zamor/OneDrive/Documentos/Programas/ToolSet Es 5.5/agente.md';
const content = fs.readFileSync(file, 'utf-8');

const additional = `

---

## [2026-06-02] BUGFIX: Renderizado de HTML en Descripciones e Inferencia Inteligente de Upcast de Conjuros

**Síntomas:**
1. **Visualización corrupta de descripciones:** Las etiquetas HTML como <br>, <b>, e <i> en las descripciones de los conjuros y objetos mágicos se mostraban como texto plano en lugar de interpretarse, arruinando el formato visual de la ficha.
2. **Pérdida de la sección informativa de niveles superiores:** Las etiquetas HTML huérfanas de cierre como </i></b> quedaban al principio del fragmento de texto descNivelSuperior debido a cortes incorrectos del regex del importador, lo que corrompía la estructura del DOM en el navegador.
3. **Pérdida del selector interactivo de Upcasting:** Conjuros de daño que escalan a niveles superiores agregando proyectiles/rayos/dardos de daño idénticos a los de la base (como *Proyectil mágico* o *Rayo abrasador*) no mostraban el selector interactivo de ranura superior de conjuros (Upcast roller) ni el botón para tirar dados escalados. Esto ocurría porque no hay dados explictos XdY dentro del texto de nivel superior ("crea un dardo adicional..."), lo que causaba que dadosDañoNivelSuperior se cargara como undefined.

**Causa raíz:**
1. **Renderizado de texto plano:** En FichaHechizo.tsx y ListaHomebrew.tsx, las propiedades de descripción se renderizaban mediante llaves comunes de React {hechizo.descripcion} en lugar de usar inyección HTML.
2. **Corte rígido de regex en etiquetas inline:** El regex upcastRegex cortaba tras la frase de upcast Con un espacio de conjuro de nivel superior. que estaba dentro de etiquetas inline <b><i>...</i></b>, dejando la etiqueta de cierre al inicio del texto capturado.
3. **Falta de heurísticas de inferencia de daño:** El selector de Upcasting en la UI requiere que dadosDañoNivelSuperior contenga un valor de dado no-vacío. Si no se especificaban dados del tipo XdY en la descripción del upcast, el importador no sabía que el hechizo era escalable con dados de daño y desactivaba el selector interactivo de combate.

**Solución aplicada:**
1. **Inyección segura de HTML en React:** Se reemplazó la interpolación de texto plano en FichaHechizo.tsx y ListaHomebrew.tsx por bloques dangerouslySetInnerHTML={{ __html: ... }} para descripciones de conjuros, upcasts y objetos.
2. **Sanitización de HTML huérfano:** Se inyectó una regla regex en importadorJSON.ts (.replace(/^(?:\\s*<\\/?[a-z0-9]+>)+/gi, '')) que remueve cualquier etiqueta HTML (abierta o cerrada) huérfana al inicio de la cadena descNivelSuperior tras la extracción.
3. **Inferencia de dados de Upcast por contexto de combate:** Se implementó una heurística de inferencia en el importador: si un hechizo escala a nivel superior pero no define dados explícitos, y en su descripción se mencionan frases como "dardo adicional", "rayo adicional", "proyectil adicional", etc., se asume dinámicamente que la escala es idéntica a su daño base (dadosDaño). Para otros casos de escalamiento donde se mencione la palabra "daño" o "aumenta", se infiere 1 dado del tipo base (ej. 1d6 si la base es 3d6).

**Lección aprendida:**
> 🛠️ **Inyección de HTML y Heurísticas de Enriquecimiento en Importadores:** Al diseñar importadores de compendios semiestructurados (donde la descripción contiene toda la lógica de combate mezclada con HTML y prosa), siempre es necesario:
> 1. Limpiar proactivamente cualquier fragmento HTML capturado que pueda haber quedado "roto" o con etiquetas huérfanas en los bordes del regex.
> 2. Implementar heurísticas basadas en el vocabulario oficial del juego (como "proyectil adicional" o "rayo adicional" de D&D) para inferir dinámicamente los campos estructurales requeridos por los simuladores de combate de la UI. Esto recupera funcionalidades ricas que se perderían si nos limitamos a parsear expresiones regulares rígidas.
> 3. Usar dangerouslySetInnerHTML en React cuando los datos de base de datos contienen marcas HTML embebidas legítimas para saltos de línea e inclinaciones tipográficas.
`;

fs.writeFileSync(file, content + additional, 'utf-8');
console.log('agente.md updated successfully!');
