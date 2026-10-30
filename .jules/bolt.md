## 2026-03-08 - Optimización de `coincideBusquedaTolerante`
**Learning:** En operaciones de búsqueda y filtrado en caliente sobre grandes colecciones (listas de objetos, hechizos, monstruos), instanciar objetos `Set` o arrays intermedios por cada elemento filtrado produce overhead significativo por Garbage Collection. El uso de bitmasks para rastrear tokens encontrados (para consultas ≤ 30 tokens) y el cacheo de tokenización elimina asignaciones de memoria en bucles de filtrado.
**Action:** Usar bitmasks o iteración de índices en funciones utilitarias invocar en bucles `.filter()` masivos en lugar de instanciar data structures pesadas (`Set`/`Map`) por elemento.

## 2026-03-08 - Cortocircuito O(1) previo a la Búsqueda Tolerante de Texto
**Learning:** Invocar `coincideBusquedaTolerante` (normalización NFD de diacríticos, tokenización y concordancia sobre descripciones largas) al inicio de un bucle `.filter()` obliga a ejecutar operaciones de texto en cientos de elementos que son inmediatamente descartados por filtros numéricos o booleanos (nivel, escuela, concentración).
**Action:** Posicionar siempre los chequeos O(1) (enteros, booleanos, enums) antes de las llamadas a funciones de búsqueda de texto para cortocircuitar inmediatamente y evitar procesar cadenas no coincidentes.
