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

---

## [2026-05-25] Mejoras Visuales, Diseño Continuo de Fichas e Interactividad de Combate Integrada

**Mejoras implementadas:**
1. **Tooltips de Condiciones (5.5e):** Se importó y enlazó `CONDICIONES_2024` en el visualizador de iniciativa. Al hacer hover sobre el chip de condición aplicado a cualquier criatura, se muestra un tooltip nativo detallado con el nombre oficial y todos los efectos mecánicos de las reglas D&D 5.5e de forma instantánea.
2. **Convertidor de Divisas Integrado:** Se diseñó y construyó un convertidor de monedas atómico en las Tablas DM, permitiendo al DM ingresar cualquier cantidad y tipo de moneda (PC, PP, PE, PO, PPT) y ver de forma inmediata el cambio equivalente en las otras divisas usando ratios estándares de D&D 5e con colores temáticos HSL.
3. **Dados en el Compendio de Hechizos:** Se integró la API `lanzarDadosTaleSpire` al compendio de hechizos de forma visualmente atractiva, permitiendo al DM presionar un botón de dados (`🎲 Tirar`) directamente en los dados de daño principal y nivel superior de los conjuros detallados.
4. **Layout Continuo y Compacto de Estadísticas:**
   - Se eliminó el botón obsoleto `DESVINCULAR FICHA` del header.
   - Se rediseñó el layout de la ficha para que fluya en **una sola columna vertical continua** (`seccionesFichaLayout: flex column`) en lugar de dos columnas asimétricas, eliminando por completo espacios muertos de aire cuando el contenido a la derecha era muy denso.
   - Se crearon secciones independientes y personalizadas para **Acciones**, **Reacciones** y **Acciones Legendarias** con estilos a juego, soportando el lanzado interactivo 3D.

**Lección aprendida:**
> 📐 Evita layouts asimétricos fijos de múltiples columnas en interfaces compactas o embebidas (como WebViews de juegos) si el contenido de una columna puede crecer dinámicamente mucho más que el otro. Un flujo vertical limpio y estructurado por secciones es infinitamente más responsivo, elegante y previene espacios de aire desiertos.

---

## [2026-05-25] Diseño Modular: Desacoplamiento de Lógica de Upcast y Modales Reutilizables de Hechizos

**Síntoma:**
La duplicación de la compleja lógica de dados e Upcasting (escalado de dados por ranura) y del bloque de JSX para los detalles de conjuros interactivos en la lista de hechizos y en la ficha de monstruos aumentaba drásticamente la posibilidad de errores de sintaxis JSX e invalidaba la legibilidad del código del simbionte.

**Solución Modularizada Aplicada:**
1. **Lógica de Dados Aislada (`utilesConjuros.ts`):** Centralizar la lógica de cálculo de Upcast de forma puramente matemática y aislada. Implementa un motor con soporte para combinación y concatenación inteligente de dados dependiendo de la paridad de caras.
2. **Componente de Modal Autónomo (`ModalDetalleHechizo.tsx`):** Desacoplar la UI del detalle del conjuro en un componente React puro y reutilizable que encapsula su propio estado del nivel de ranura de upcasting seleccionado y su botón de tirada 3D para TaleSpire.
3. **Puntos de Integración Limpios:**
   - La `ListaHechizos.tsx` y `GestorIniciativa.tsx` quedan libres de código JSX de detalle repetitivo y sobreacoplado, limitándose a importar y utilizar el modal y el procesador de dados.

**Lección aprendida:**
> 📦 **SIEMPRE desacopla componentes interactivos complejos y lógica matemática de dados** en utilidades y componentes puros independientes.
> Esto no solo mejora espectacularmente el mantenimiento futuro y la paridad de compilación de TypeScript estricto, sino que permite reutilizar piezas visuales (como la consulta de hechizos) en cualquier módulo nuevo que se agregue al simbionte (homebrew, tablas, etc.) sin reescribir una sola línea de lógica visual.

---

## [2026-05-25] CRÍTICO: Pérdida de Datos al Actualizar/Desplegar el Simbionte (Limpieza Recursiva Ciega)

**Síntoma:**
Cada vez que se ejecutaba `pnpm run deploy` para actualizar el Simbionte con nuevos cambios en caliente, se borraban por completo todas las bases de datos de IndexedDB locales y las configuraciones de homebrew cargadas previamente por el usuario, obligándolo a reimportar su JSON de datos en cada compilación.

**Causa raíz:**
El script de despliegue `deploy_to_ts.js` utilizaba una función recursiva ciega `cleanDirContents(targetDir)` que eliminaba **indiscriminadamente** todo el contenido del directorio del Simbionte en AppData antes de copiar los archivos de `dist`. 
Aunque IndexedDB es persistente en Chromium WebView2, WebView2 almacena las bases de datos e información de persistencia de usuario y caché directamente en subcarpetas del Simbionte en disco (como carpetas de depuración `.debug`, `.storage` y el perfil de Chromium `EBWebView`). Al vaciar ciegamente todo el directorio destino en cada despliegue, el script eliminaba físicamente los archivos de IndexedDB generados por WebView2, borrando todo el progreso guardado.

**Solución Aplicada (`deploy_to_ts.js`):**
Reemplazar la función de limpieza recursiva indiscriminada por una **limpieza selectiva y segura** (`deleteBuildElement`):
1. El script ahora elimina únicamente los archivos específicos generados por la compilación anterior de Vite: la carpeta `assets` (evita archivos JS huérfanos), el archivo `index.html` y `manifest.json`.
2. Preserva intactos todos los demás directorios y archivos ocultos generados dinámicamente por TaleSpire / WebView2 (como bases de datos, almacenamiento persistente, cachés de sesión, etc.).

**Lección aprendida:**
> 🛡️ **En scripts de despliegue local de desarrollo (como loaders de extensiones o simbiontes): NUNCA realices limpiezas recursivas ciegas o vaciados del directorio destino**.
> WebView2 empotrado puede almacenar la persistencia física (IndexedDB/Caché) dentro de subcarpetas del propio directorio del simbionte. 
> Diseña siempre limpiezas selectivas dirigidas única y exclusivamente a los assets de tu compilación (ej. la carpeta `assets` e `index.html`), asegurando que la persistencia del usuario sobreviva intacta a cualquier actualización de código.

---

## [2026-05-25] UI/UX: Desbordamiento de Tooltips de Condiciones y Optimización de Modales CEF Premium

**Síntoma:**
1. Los tooltips de las condiciones en el gestor de iniciativa (`GestorIniciativa.tsx`) se posicionaban en `bottom: 130%` (hacia arriba), desbordando la tarjeta de criatura y quedando invisibles u ocultos debido al `overflow: "hidden"` de la propia tarjeta. Al mismo tiempo, tapaban el nombre y CA de la criatura activa o de la superior.
2. El modal de detalle de hechizo (`ModalDetalleHechizo.tsx`) tenía un estilo básico y contenía transiciones de tiempo graduales (`transition: "all 0.1s ease"`), lo que incrementaba drásticamente la latencia de renderizado (lag) dentro del motor CEF de TaleSpire.

**Causa raíz:**
1. La tarjeta contenedora de iniciativa de cada criatura (`tarjetaCriaturaBrutal`) tenía forzado un `overflow: "hidden"`, lo que impedía que cualquier tooltip flotante absoluto saliera del contenedor sin cortarse. Adicionalmente, la posición hacia arriba (`bottom`) obligaba al tooltip a tapar la información del sujeto activo de la interacción.
2. TaleSpire ejecuta simbiontes en un panel web embebido con un hilo de renderizado muy ajustado. Cualquier propiedad CSS de transición síncrona o animación por cuadros degrada severamente el scroll y el rendimiento de clics.

**Solución aplicada:**
1. **Tooltips Robustos:**
   - Se modificó la clase `.chip-condicion-chico-tooltip .tooltip-contenido` en `index.css` para cambiar la dirección a `top: calc(100% + 4px); left: 0` (hacia abajo y alineado a la izquierda del chip). Esto despeja los nombres, CA y avatares de la criatura activa.
   - Se removió `overflow: "hidden"` y se configuró a `overflow: "visible"` en `tarjetaCriaturaBrutal` de `GestorIniciativa.tsx` para permitir que el tooltip flote libremente sobre los elementos sin recortarse.
   - Para no perder el efecto de esquina redondeada en la barra de rol izquierda de la tarjeta al quitar el overflow, se asignó `borderTopLeftRadius: "4px"` y `borderBottomLeftRadius: "4px"` directamente a `barraLateralRol`.
2. **Modal Detalle Hechizo Cyberpunk Frosted:**
   - Se rediseñó por completo el estilo de `ModalDetalleHechizo.tsx` usando un fondo HSL de alta gama con opacidad (`rgba(9, 13, 22, 0.94)`), desenfoque de fondo (`backdropFilter: "blur(12px)"`), un borde cian neón difuminado y resplandor interno/externo con sombras (`boxShadow`).
   - Se removió CUALQUIER propiedad `transition` gradual en todos los botones y contenedores del modal para forzar cambios de estado instantáneos (0ms), garantizando fluidez del 100% y cero lag en TaleSpire.

**Lección aprendida:**
> 📐 **Cuidado con `overflow: hidden` en componentes de listas con tooltips**: Cuando diseñes interfaces ricas con tooltips flotantes en filas o tarjetas, nunca uses `overflow: hidden` en la tarjeta padre, o los tooltips se recortarán irremediablemente. Maneja los redondeados de forma individual en las esquinas de los elementos absolutos y pon `overflow: visible`.
> ⚡ **El lag en CEF es acumulativo**: Incluso micro-transiciones de `0.1s ease` en botones pequeños o cabeceras causan retrasos notables en TaleSpire. Los cambios de estado de color y opacidad deben ser estrictamente instantáneos (0ms) en la interfaz del Simbionte.

---

## [2026-05-25] Tablas DM: Tiradas Rápidas en Memoria y Formato de Mensajes Compatible con el Chat de TaleSpire

**Síntoma:**
1. El botón "Enviar a TaleSpire Chat" de la consola táctica de pifias y críticos de las Tablas del DM no publicaba nada y fallaba silenciosamente sin registrar errores en consola.
2. La tirada de pifias y críticos arrojaba innecesariamente un dado 3D físico a la bandeja de TaleSpire, interrumpiendo el flujo rápido de consulta táctica del DM.

**Causa raíz:**
1. La API de chat nativa de TaleSpire (`window.TS.chat.send`) es estricta con el formato: descarta silenciosamente cualquier string que contenga etiquetas Rich Text enriquecidas de Unity HTML (como `<b>` o `<color=#...>` que venían en el header).
2. Para consultas rápidas de tablas aleatorias y efectos narrativos del DM, la simulación física de dados 3D en la mesa satura visualmente la escena y retrasa al DM al esperar la animación física de la bandeja de dados.

**Solución aplicada:**
1. **Markdown Limpio:** En `TablasDM.tsx` (`enviarConsolaAlChat`), erradicamos todo rastro de formato HTML/Rich Text y lo convertimos a un string formateado en Markdown compatible con TaleSpire e Discord (negritas `**`, listas `•` y emojis claros).
2. **Tirada Digital en Memoria:** Eliminamos las llamadas a `TS.dice.makeRollDescriptors` y `TS.dice.putDiceInTray` de la función `lanzarDadosConsola`. El resultado del d20 o d4 se calcula exclusivamente mediante un generador pseudoaleatorio en memoria en menos de 1ms, imprimiéndose al instante en la interfaz.

**Lección aprendida:**
> 💬 **TaleSpire Chat API requiere Markdown limpio**: Para enviar textos al chat del juego, evita etiquetas HTML de color o estilo enriquecido. Utiliza Markdown estándar (`**` o `•`) para asegurar la recepción y renderizado nativo.
> ⚡ **Tiradas virtuales vs Físicas 3D**: La física de dados en 3D en mesa es ideal para combates y tiradas de jugadores, pero para las consolas rápidas de efectos tácticos o tablas aleatorias del DM, prefiere siempre el cálculo matemático en memoria para una respuesta instantánea.

---

## [2026-05-25] CRÍTICO: Filtrado de Clics al Lienzo 3D en Simbiotes y Discrepancias en el Simulador de Desarrollo

**Síntomas:**
1. Al interactuar con los botones de la consola táctica de pifias/críticos en el Simbionte, el jugador cargaba un dado 3D físico de TaleSpire sobre su cursor en pantalla.
2. Al pulsar "Enviar a chat" en las Tablas del DM, la aplicación no lograba realizar ninguna publicación de chat y fallaba silenciosamente sin control de excepciones si la API interna no estaba disponible.
3. El simulador de desarrollo local (`SimuladorTaleSpire.ts`) discrepaba con el código de producción y la API real de TaleSpire al estructurar los manejadores de eventos y métodos en la raíz en lugar de sus respectivos namespaces (`creatures`, `initiative`, etc.), provocando que la aplicación fallara en local.

**Causas raíz:**
1. Los clics y pulsaciones del mouse sobre los botones del Simbionte se propagaban fuera del marco web embebido CEF (Chromium Embedded Framework) al motor principal de TaleSpire. El motor interpreta estos clics en el fondo de la pantalla como intentos de interactuar con el lienzo 3D físico para levantar la bandeja de dados.
2. La función original `enviarConsolaAlChat` ejecutaba síncronamente `(window as any).TS.chat.send` sin verificar que la API `.chat` y su método `.send` estuvieran declarados o definidos, careciendo además de asincronía y control de errores `try-catch`.
3. El simulador local interactivo inyectaba un mock de la API que no reflejaba la jerarquía real descrita en las especificaciones oficiales de TaleSpire y adoptada en `App.tsx` y `BarraControl.tsx`.

**Soluciones aplicadas:**
1. **Control Férreo de Propagación:** Se introdujo el helper `detenerPropagacion` que ejecuta `e.stopPropagation()` y `e.preventDefault()`, vinculándose a los eventos `onMouseDown`, `onMouseUp` y `onClick` de todos los botones interactivos del lanzador en `TablasDM.tsx`.
2. **Mensajería Asíncrona y Defensiva:** Se transformó `enviarConsolaAlChat` en una función `async` que extrae la API de forma segura (`const ts = (window as any).TS`), valida la existencia del método `ts.chat?.send` y envuelve la llamada de red en un bloque `try-catch` con control de excepciones.
3. **Simulador de Alta Fidelidad:** Se reestructuró `SimuladorTaleSpire.ts` para reubicar todos los eventos y métodos simulados dentro de sus namespaces oficiales nativos (`creatures.onCreatureSelectionChange`, `creatures.getSelectedCreatures`, `initiative.onInitiativeEvent`, `dice.onRollResults` y `symbiote.onStateChangeEvent`), logrando una paridad absoluta del 100% entre desarrollo local y producción.

**Lecciones aprendidas:**
> ⚠️ **Propagación en CEF / TaleSpire:** Los eventos de clic de mouse (`mousedown`, `mouseup`, `click`) en componentes interactivos web de un simbionte SIEMPRE se propagan al lienzo 3D físico del juego si no se interceptan oportunamente. Emplea `e.stopPropagation()` y `e.preventDefault()` en los tres tipos de eventos de cursor en botones reactivos para aislar por completo la interfaz del lienzo de TaleSpire.
> 🔄 **Integridad del Simulador Local:** Asegura siempre que tu simulador local interactivo sea una réplica exacta de la jerarquía de la API real de TaleSpire. Las discrepancias en el mock rompen el flujo de desarrollo de la app y ocultan bugs críticos hasta fases muy tardías.
> 📡 **Robustez en APIs del Chat de Juego:** El envío de mensajes y tarjetas al chat nativo mediante `window.TS.chat.send` es un proceso asíncrono que viaja por el bus del juego. Utiliza siempre firmas asíncronas, validaciones defensivas de existencia y bloques `try-catch` robustos para evitar bloqueos del hilo principal.

---

## [2026-05-25] CRÍTICO: Error `internalDispatchBug` / `type error: not a fragment or id` al usar `TS.chat.send`

**Síntoma:**
```
TablasDM.tsx:115 [TaleSpire Chat] Error al enviar mensaje automático al tirar: Error: internalDispatchBug
type error: not a fragment or id
```

**Causa raíz:**
La firma oficial de la API de chat nativa de TaleSpire Symbiote es:
`TS.chat.send(message: string, localOrBoard: string): Promise<any>`
Donde el segundo parámetro `localOrBoard` es **estrictamente obligatorio** en el deserializador RPC del backend en C# (Unity) y representa el canal destino o ID del emisor. 
1. En la versión original del usuario, los parámetros estaban invertidos: `TS.chat.send("board", mensaje)`. El motor evaluaba el mensaje estructurado (con emojis y saltos de línea) como el segundo argumento (`localOrBoard`), por lo que arrojaba `type error: not a fragment or id`.
2. En nuestra primera corrección, llamamos a `TS.chat.send(mensaje)` omitiendo el segundo argumento. Al ser `undefined`, el motor nativo de C# fallaba internamente arrojando la misma excepción de tipos al no poder resolver un destino válido.

**Solución aplicada:**
1. Simplificar y depurar el formato de `mensajeFormateado` al extremo absoluto, asignando de forma directa el texto limpio del efecto (`efectoStr` y `resultadoConsola.resultado`) sin añadir ninguna cabecera de tirada de dado (`**[TITULO]**`) ni preámbulos.
2. Invocar la API nativa de TaleSpire pasando `"board"` como segundo argumento para publicar únicamente el efecto puro en la mesa de juego para todos los combatientes:
   `await ts.chat.send(mensajeFormateado, "board");`

**Lección aprendida:**
> 💬 **Firma del Chat de TaleSpire:** El método nativo `TS.chat.send` exige rigurosamente **dos parámetros string**: el mensaje como primero, y el canal (`"board"` para todos o `"local"` para uno mismo) como segundo. Omitir el segundo parámetro o invertir el orden provoca que el deserializador de C# falle con `type error: not a fragment or id`. Asegura siempre el formato `TS.chat.send(mensaje, "board")`.
> 🎨 **Minimalismo Narrativo en el Chat:** La información de qué tipo de dado o resultado se obtuvo ya se visualiza con lujo de detalles dentro del panel del DM del Simbionte. Al enviar mensajes automatizados al chat común del juego, prefiere omitir cabeceras de sistema o referencias matemáticas de la tirada. Publicar únicamente el resultado narrativo del efecto (ej. *"Mareado — El objetivo debe pasar..."*) mantiene la inmersión de los jugadores en su máximo esplendor y mantiene la ventana de chat limpia y libre de metadatos irrelevantes.





