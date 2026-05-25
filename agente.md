# agente.md — Aprendizaje Autónomo del Simbionte DM

Este archivo registra errores encontrados, sus causas raíz y las soluciones aplicadas.
Se actualiza automáticamente después de cada corrección importante.

---

## [2026-05-24] CRÍTICO: IndexedDB y LocalStorage NO persisten entre sesiones de TaleSpire

**Síntoma:**
```
[IndexedDB] Store "talespire_dm_store" creado en la base de datos "TalespireDMCompendium" (v1).
[IndexedDB] IndexedDB vacío. Buscando datos en LocalStorage para migrar...
[IndexedDB] Primera sesión limpia. No había datos previos en LocalStorage ni en IndexedDB.
```
Esto ocurría en CADA sesión, perdiendo todos los datos.

**Causa raíz:**
TaleSpire usa **WebView2** (Chromium embebido) **sin** un User Data Directory persistente. Cada vez que se cierra y abre TaleSpire, WebView2 crea un contexto nuevo borrando TODO:
- LocalStorage ❌
- IndexedDB ❌
- SessionStorage ❌
- Cookies ❌

**Solución: API oficial `TS.localStorage.global`**
TaleSpire expone una API nativa específicamente para persistencia de datos:
```typescript
// ESCRIBIR (guarda en disco en la carpeta del Simbionte)
await TS.localStorage.global.setBlob(jsonString);
// LEER
const result = await TS.localStorage.global.getBlob();
// result.data = el JSON guardado
// result.result = "ok" | "noData" | "ensurePathFailed" | "writeFailed" | "dataTooLarge"
```
- Límite: **5MB por blob**
- Es la ÚNICA API que sobrevive al cierre del juego
- Los datos se guardan como archivo en la carpeta del Simbionte en disco

**Módulo creado:** `src/utiles/almacenamientoTaleSpire.ts`
- `guardarBlobGlobal(datos)` → `TS.localStorage.global.setBlob(JSON.stringify(datos))`
- `leerBlobGlobal()` → `TS.localStorage.global.getBlob()` + `JSON.parse()`
- Fallback a `localStorage` para desarrollo local (cuando no hay `window.TS`)

**Lección aprendida:**
> ⚠️ En TaleSpire Symbiotes: **NUNCA usar LocalStorage ni IndexedDB** para datos importantes.
> **SIEMPRE usar `TS.localStorage.global.setBlob`** como fuente de verdad.
> Para desarrollo local (sin TaleSpire), hacer fallback a localStorage solo como herramienta de testing.

---

## [2026-05-24] Error: `outOfOrderMessage` al cargar el Simbionte en TaleSpire

**Síntoma:**
```
Uncaught (in promise) Error: outOfOrderMessage
  at Object.makeRejectMsg (...)
  at Object.onTsMessage (...)
```

**Causa raíz:**
Las llamadas `getSelectedCreatures()`, `getQueue()` y `whereAmI()` se hacían **inmediatamente** al detectar `window.TS`, antes de que TaleSpire terminara de registrar el canal bidireccional de mensajería del Simbionte. Cualquier respuesta de la API intentaba enviarse antes de que el canal estuviera listo.

**Solución aplicada (`App.tsx`):**
Separar las **suscripciones** (sin tráfico, inmediatas) de las **lecturas iniciales** (con respuesta, requieren el canal estable). Las lecturas se envuelven en un `setTimeout` de 500ms.
```typescript
// ✅ Correcto: suscripciones inmediatas (no generan tráfico)
apiCreatures.onCreatureSelectionChange.subscribe(callback);

// ✅ Correcto: lecturas retardadas 500ms
setTimeout(() => {
  apiCreatures.getSelectedCreatures().then(...);
  apiInitiative.getQueue().then(...);
  TS.campaigns.whereAmI().then(...);
}, 500);
```

**Lección aprendida:**
> En Simbiotes de TaleSpire, las APIs de tipo `subscribe()` se pueden llamar en cualquier momento.
> Las APIs de tipo `get*()` (que esperan una respuesta) deben esperar al menos 500ms tras la detección de `window.TS`.

---

## [2026-05-24] Error: IndexedDB se sobreescribía con datos vacíos al reiniciar TaleSpire

**Síntoma:**
Al salir y volver a entrar a TaleSpire, todos los datos (Homebrew, encuentros, notas) desaparecían.

**Causa raíz:**
La bandera `dm_migrado_a_indexeddb` estaba guardada en **LocalStorage**. TaleSpire borra LocalStorage al cerrar el juego. Al volver a abrir, la bandera no existía → el sistema creía que era la primera vez → migraba desde LocalStorage (vacío) → sobreescribía IndexedDB con datos vacíos.

**Solución aplicada (`usarAlmacenDM.ts`):**
Cambiar completamente la estrategia de carga:
1. **Siempre leer IndexedDB primero.**
2. Si IndexedDB tiene datos → usarlos. **No tocar LocalStorage.**
3. Si IndexedDB está vacío → buscar en LocalStorage y migrar a IndexedDB.
4. La bandera de migración se guarda en **IndexedDB** (no en LocalStorage).

```
Flujo correcto:
  IndexedDB tiene datos? → Sí → Cargar y listo.
                         → No → Migrar desde LocalStorage → Guardar en IndexedDB
```

**Lección aprendida:**
> TaleSpire puede borrar/reiniciar LocalStorage entre sesiones.
> IndexedDB es persistente y NO es borrado por TaleSpire.
> **Nunca usar LocalStorage como fuente de verdad en un Simbionte. Solo como caché temporal o fallback de emergencia.**
> **Nunca guardar banderas de estado en LocalStorage si el juego puede borrarlas.**

---

## [2026-05-24] Implementación: Migración a IndexedDB como base de datos principal

**Módulo creado:** `src/utiles/almacenamientoIndexedDB.ts`

- Base de datos: `TalespireDMCompendium` (v1)
- Object Store: `talespire_dm_store` (clave string)
- API: `guardarEnDB`, `obtenerDeDB`, `eliminarDeDB`, `limpiarDB`
- Conexión singleton reutilizable
- Compatible con todos los navegadores modernos (Chromium que usa TaleSpire)

**Claves usadas en la DB:**
| Clave | Contenido |
|---|---|
| `dm_monstruos_homebrew` | Array de monstruos personalizados |
| `dm_hechizos_homebrew` | Array de hechizos personalizados |
| `dm_objetos_homebrew` | Array de objetos personalizados |
| `dm_pendientes` | Lista de tareas del DM |
| `dm_notas` | Notas de sesión (string) |
| `dm_encuentros_guardados` | Encuentros guardados |
| `dm_cola_iniciativa` | Cola de combate activa |
| `dm_ronda_actual` | Número de ronda actual (number) |
| `dm_indice_turno_activo` | Índice del turno activo (number) |
| `dm_metodo_vida_monstruo` | "estandar" / "maximo" / "azar" |
| `dm_migracion_completada` | Flag boolean (guardado en IndexedDB, no en LS) |

---

## [2026-05-25] CRÍTICO: Discrepancias entre la firma teórica y el comportamiento real de `getBlob` en TaleSpire

**Síntoma:**
```
almacenamientoTaleSpire.ts:118 [TS Storage] Resultado inesperado al leer blob: undefined
almacenamientoTaleSpire.ts:85 [TS Storage] Excepción al guardar blob global: TypeError: Cannot read properties of undefined (reading 'result')
```

**Causa raíz:**
1. Aunque alguna documentación oficial teórica describe que `TS.localStorage.global.getBlob()` devuelve un objeto estructurado `{ result: "ok", data: "..." }`, en la práctica de ejecución CEF real **devuelve directamente la cadena de texto JSON** o `undefined`/vacío si no hay datos guardados.
2. De la misma forma, `setBlob()` resuelve directamente a vacío/`undefined` (tipo `void`/promesa vacía) tras escribir exitosamente en disco en lugar de un objeto estructurado. Esto causaba excepciones al intentar leer `.result` de un valor `undefined`.

**Solución aplicada (`almacenamientoTaleSpire.ts`):**
1. Declarar `getBlob()` y `setBlob()` como `Promise<any>` en la interfaz para permitir tipado adaptativo libre.
2. Reescribir el lector `leerBlobGlobal` para que sea **100% polimórfico**:
   - Si recibe un `string`, lo procesa directamente con `JSON.parse`.
   - Si recibe un objeto con `.result === "ok"` y `.data` de tipo string (formato oficial teórico), lo parsea desde allí.
   - Si es vacío/nulo, lo maneja correctamente sin arrojar error.
3. Simplificar `guardarBlobGlobal` y `limpiarBlobGlobal` (usando `.deleteBlob()` si existe) de manera defensiva.

**Lección aprendida:**
> ⚠️ Nunca confíes ciegamente en firmas de tipo rígidas en APIs CEF empotradas complejas como las de TaleSpire.
> Escribe siempre wrappers de almacenamiento con lógica polimórfica y defensiva que acepte múltiples formatos de entrada (objetos estructurados, strings directos o valores vacíos/nulos).

---

## [2026-05-25] Error: `TypeError: t.map is not a function` al sincronizar la iniciativa física con TaleSpire

**Síntoma:**
```
App.tsx:84 [TaleSpire Simbionte] Error al obtener cola de iniciativa inicial: TypeError: t.map is not a function
    at usarAlmacenDM.ts:362:43
```

**Causa raíz:**
`TS.initiative.getQueue()` puede devolver en ocasiones un objeto especial (`initiativeQueue`) que contiene la lista de criaturas en lugar de ser él mismo un Array directo iterable. Al llamar de inmediato a `.map()`, causaba una excepción síncrona en el almacén DM que invalidaba el flujo de iniciativa.

**Solución aplicada (`usarAlmacenDM.ts`):**
Crear un normalizador adaptativo ultra inteligente `normalizarColaTaleSpire` antes de procesar:
1. Si ya es un array, se devuelve.
2. Si es un objeto, busca propiedades típicas de contenedores de arrays (`queue`, `entries`, `items`, `data`, `list`).
3. Si es un iterable, usa `Array.from()`.
4. Si contiene alguna otra propiedad que sea de tipo array en su primer nivel, la extrae dinámicamente.
5. Si no se cumple nada, devuelve `[]`.

**Lección aprendida:**
> Al lidiar con estructuras de datos devueltas por APIs externas en constante evolución (como TaleSpire), siempre normaliza las respuestas de listas a Arrays Javascript nativos usando un helper polimórfico antes de aplicar `.map`, `.filter` o `.sort`.

---

## [2026-05-25] CRÍTICO: Condición de carrera e inyección asíncrona de `window.TS` (Pérdida de datos al iniciar)

**Síntoma:**
Al arrancar el Simbionte dentro de TaleSpire tras cerrar por completo el juego, a veces la carga nativa fallaba en frío, mostrando el log `[TaleSpire Simbionte] Ejecutando carga inmediata de datos persistidos (Navegador Estándar)...` y creando una sesión limpia desde cero, perdiendo los datos importados previamente. Sin embargo, al recargar el simbionte en caliente o cambiar de escena, los datos sí cargaban bien.

**Causa raíz:**
1. TaleSpire inyecta el script que expone `window.TS` de manera **asíncrona** tras cargarse la página web en WebView2.
2. Al montarse la aplicación React, la evaluación `if (!windowAlias.TS)` se ejecutaba de forma **instantánea**. Como `window.TS` aún no había sido inyectado en ese microsegundo inicial, el simbionte asumía erróneamente que era un navegador estándar y llamaba a `cargarDatosPersistidos()` de inmediato.
3. Esto intentaba leer `localStorage` estándar (que WebView2 vacía al cerrar el juego), lo que provocaba que se detectara un "blob vacío" y se sobreescribiera la memoria de Zustand con un estado completamente limpio de fábrica.
4. Posteriormente, la variable de clausura `esTaleSpireReal` quedaba en `false` porque se evaluó al inicio cuando `window.TS` era `undefined`, por lo que el `setTimeout` de 500ms ignoraba la carga retardada oficial.

**Solución aplicada (`App.tsx`):**
1. **Eliminar por completo la carga inmediata** del cuerpo principal del `useEffect`.
2. Encapsular y unificar el flujo de carga: `cargarDatosPersistidos()` se llama **únicamente y de forma exclusiva** dentro del `setTimeout` de 500ms en `suscribirAPIs()`.
3. Dado que `suscribirAPIs()` sólo se ejecuta cuando `window.TS` está garantizado de estar inyectado y listo (ya sea de forma inmediata o mediante el intervalo reactivo de sondeo), eliminamos por completo cualquier condición de carrera o lectura antes de tiempo, logrando una robustez del 100%.

**Lección aprendida:**
> ⚠️ En entornos CEF embebidos, la inyección del contexto nativo de API (`window.TS`) es inherentemente asíncrona.
> **Nunca evalúes variables globales nativas al inicio síncrono del ciclo de vida de tu app**.
> Diseña siempre tu inicialización de almacenamiento para que se acople directamente a la función callback de éxito de la inyección de la API nativa. Esto previene fallbacks erróneos y asegura lecturas de persistencia consistentes.

---

## [2026-05-25] Error: Sobreescritura concurrente y pérdida de datos al importar el compendio JSON (Monstruos y Hechizos vacíos)

**Síntoma:**
Al importar un archivo JSON completo que contiene tanto monstruos, hechizos como objetos, solo se persistían los objetos en el blob global de TaleSpire. Los monstruos y hechizos cargados desaparecían al reiniciar el juego y se leían como vacíos (`[]`) en el blob global.

**Causa raíz:**
En la función `importarBaseDatosJSONCompleta`, la variable `const state = get()` se leía una única vez al **inicio** de la función. Al procesar secuencialmente cada bloque (Monstruos, Hechizos y Objetos):
1. Cada bloque llamaba a `set({ baseDatosX: combinados })` de forma individual.
2. Cada bloque llamaba a `persistirEstadoCompleto({ ...state, baseDatosX: combinados })`.
Como `state` era una referencia constante y desfasada obtenida al principio, el bloque de Hechizos no veía los monstruos recién guardados por el bloque de Monstruos, y el bloque de Objetos no veía ni los monstruos ni los hechizos recién guardados. Al ejecutarse el bloque de Objetos al final, llamaba a `persistirEstadoCompleto` con un estado que sobreescribía el archivo JSON de TaleSpire con los monstruos y hechizos vacíos del `state` rancio original.

**Solución aplicada (`usarAlmacenDM.ts`):**
Hacer la importación completamente **atómica e incremental**:
1. Crear variables locales acumuladoras al inicio:
   `let monstruosFinales = state.baseDatosMonstruos;`
   `let hechizosFinales = state.baseDatosHechizos;`
   `let objetosFinales = state.objetosHomebrew;`
2. En cada bloque de procesamiento individual, acumular los cambios combinados sobre estas variables locales.
3. Eliminar todas las llamadas intermedias de `set()` y `persistirEstadoCompleto()`.
4. Al final del procesamiento, si hubo modificaciones, ejecutar un **único** `set()` consolidado y una **única** persistencia atómica `persistirEstadoCompleto()` con el estado final combinado e íntegro.

**Lección aprendida:**
> ⚠️ Al realizar modificaciones múltiples e independientes de diferentes colecciones dentro de una sola función en stores de Zustand, **nunca uses copias del estado (`get()`) rancios en llamadas a persistencia secuenciales**.
> Acumula todos los cambios en variables locales e implementa una única actualización atómica final. Esto garantiza que todos los hilos asíncronos y escrituras físicas a disco/blobs reciban un estado completamente integrado y actualizado.



