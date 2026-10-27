## 2026-03-08 - Optimización de `coincideBusquedaTolerante`
**Learning:** En operaciones de búsqueda y filtrado en caliente sobre grandes colecciones (listas de objetos, hechizos, monstruos), instanciar objetos `Set` o arrays intermedios por cada elemento filtrado produce overhead significativo por Garbage Collection. El uso de bitmasks para rastrear tokens encontrados (para consultas ≤ 30 tokens) y el cacheo de tokenización elimina asignaciones de memoria en bucles de filtrado.
**Action:** Usar bitmasks o iteración de índices en funciones utilitarias invocar en bucles `.filter()` masivos en lugar de instanciar data structures pesadas (`Set`/`Map`) por elemento.

## 2026-03-08 - Short-Circuit O(1) Predicates in Search Filtering
**Learning:** En callbacks de filtrado de colecciones masivas (conjuros, objetos, monstruos), evaluar primero las condiciones primitivas O(1) (nivel, escuela, concentración, componentes) antes de ejecutar algoritmos de búsqueda tolerante de texto evita la normalización de cadenas, división de tokens y búsqueda de subcadenas sobre descripciones extensas de elementos no coincidentes.
**Action:** En funciones y hooks de filtrado, posicionar siempre los predicados booleanos/enum simples antes de la llamada a `coincideBusquedaTolerante`.
