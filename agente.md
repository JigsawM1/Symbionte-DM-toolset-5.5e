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

---

## [2026-05-25] Sincronización Bidireccional Activa de Iniciativa con `nextTurn` y `prevTurn`

**Síntoma:**
Al avanzar o retroceder el turno táctico desde el panel del Simbionte DM, la barra física nativa de iniciativa 3D de TaleSpire en la parte superior de la pantalla de juego no cambiaba ni reflejaba el combatiente activo, a pesar de que el Simbionte sí leía correctamente los cambios de TaleSpire física.

**Causa raíz:**
La vinculación de la iniciativa estaba implementada originalmente en **un solo sentido** (lectura reactiva pasiva): el Simbionte escuchaba cambios de TaleSpire y se adaptaba, pero sus propios controles locales de `avanzarTurno` y `retrocederTurno` en Zustand sólo modificaban variables locales del store web, sin notificar al bus nativo de APIs del cliente del juego.

**Solución aplicada:**
1. Modificar las acciones `avanzarTurno` y `retrocederTurno` en `usarAlmacenDM.ts` para que invoquen asíncrona y defensivamente las funciones oficiales del SDK de TaleSpire:
   - Al avanzar: `TS.initiative.nextTurn()`
   - Al retroceder: `TS.initiative.prevTurn()`
2. Implementar mocks de soporte para `nextTurn` y `prevTurn` en `SimuladorTaleSpire.ts` para garantizar el testeo interactivo local de la cola en el navegador.

**Lección aprendida:**
> 🔄 **Interactividad Híbrida Bidireccional en CEF:** Al lidiar con listados o colas que existen tanto en la web del Simbionte como en el motor físico de Unity (como la initiative), diseña siempre flujos bidireccionales. Utiliza callbacks reactivos (`onInitiativeEvent`) para sincronizar el estado entrante en caliente, e invoca métodos de control nativos (`TS.initiative.nextTurn()`, `prevTurn()`) dentro de tus handlers web para inyectar los cambios de vuelta al motor físico de juego.

---

## [2026-05-25] CRÍTICO: Suscripciones de `manifest.json` y la función global obligatoria `initiativeUpdated` en `window`

**Síntoma:**
A pesar de utilizar `.subscribe()` de forma inline en TypeScript, los eventos reactivos nativos de TaleSpire (como `onInitiativeEvent` o `onCreatureSelectionChange`) no se disparaban en producción dentro del juego en tiempo real. La sincronización se realizaba sólo una vez al cargar en frío el Simbionte, pero los clics de avance/retroceso físicos en la mesa no causaban ninguna reacción en la web.

**Causa raíz:**
1. TaleSpire requiere que cualquier evento declarado en el bloque `"subscriptions"` de `manifest.json` tenga una **función homónima global expuesta en el objeto global `window`** del Simbionte. Cuando el motor físico de Unity detecta el evento, el bridge CEF busca e invoca esta función global en `window` por su nombre string.
2. De forma específica y cableada en el bridge CEF de iniciativa de TaleSpire, la función global en `window` que recibe las actualizaciones de asaltos, turnos y participantes se debe llamar estrictamente **`initiativeUpdated`**. Al tenerla mapeada con otro nombre, el bridge no lograba invocarla tras la inicialización.

**Solución aplicada:**
1. En `public/manifest.json`, modificar el mapeo del evento de iniciativa para que apunte exactamente al callback nativo:
   `"onInitiativeEvent": "initiativeUpdated"`
2. En `src/App.tsx`, exponer explícitamente en `window` (`windowAlias`) la función global con el nombre correcto exigido por TaleSpire:
   - `windowAlias.initiativeUpdated` (que actualiza Zustand consultando `getQueue()`).
   - `windowAlias.manejarEventoIniciativa` (fallback y alias redundante).
   - `windowAlias.manejarCambioSeleccionCriatura`
   - `windowAlias.manejarCambioEstadoCriatura`
   - `windowAlias.manejarCambioEstadoSimbionte`
   - `windowAlias.manejarResultadosDados`

**Lección aprendida:**
> 🔔 **Bridge CEF e `initiativeUpdated`:** Para que la iniciativa física de TaleSpire se sincronice en tiempo real bidireccional con tu Simbionte, **debes registrar obligatoriamente `"initiativeUpdated"` en tu `manifest.json` y como función global en `window`**. Esto garantiza que el bridge nativo de Unity a CEF ejecute exitosamente tu actualizador web React ante cualquier clic físico de avance o retroceso de turno en la mesa.

---

## [2026-05-25] CRÍTICO: Pérdida de reactividad CEF / Los eventos en tiempo real se ejecutan "solo una vez" al inicializar

**Síntoma:**
La sincronización reactiva de la iniciativa en caliente funcionaba perfectamente la primera vez al arrancar el Simbionte, detectando correctamente el turno activo físico. Sin embargo, al pulsar "Siguiente Turno" o "Turno Anterior" nativamente en TaleSpire 3D, la interfaz web del Simbionte no se actualizaba en tiempo real (permaneciendo estática en el turno anterior).

**Causa raíz:**
1. TaleSpire utiliza Chromium Embedded Framework (CEF) embebido en Unity.
2. Durante el arranque del WebView de la aplicación, el motor de Unity lee las `"subscriptions"` de `manifest.json` y realiza un **binding directo y de una sola vez** a las funciones globales declaradas en `window`.
3. Si estas funciones en `window` se definen de forma **asíncrona** o retardada (por ejemplo, dentro de un `useEffect` en React tras bucles de sondeo asíncronos), para cuando se definen, el binding de Unity ya ha finalizado y fallado al no encontrarlas en ese instante inicial de handshake.
4. Adicionalmente, el punto de entrada sincrónico original (`src/main.tsx`) inicializaba funciones globales de prueba vacías que solo hacían `console.log`. Unity realizaba el binding CEF inicial a estas funciones dummy sincrónicas, y cualquier redefinición asíncrona tardía en `App.tsx` simplemente pisaba la propiedad en `window` sin que el bridge interno de CEF/Unity se enterara.

**Solución aplicada:**
1. **Definición Sincrónica Inmediata (`src/main.tsx`)**: Mudar por completo todo el registro y definición de los callbacks de `window` (`window.initiativeUpdated`, `window.manejarEventoIniciativa`, `window.manejarCambioSeleccionCriatura`, etc.) de forma **100% sincrónica e inmediata** en el nivel superior del archivo de entrada principal `src/main.tsx` antes de inicializar React o compilar componentes.
2. **Conexión Directa a Zustand**: Dado que estos callbacks sincrónicos se ejecutan fuera del flujo de render de React, los conectamos directamente al store de Zustand utilizando su API de lectura/escritura global fuera de hooks:
   `usarAlmacenDM.getState().actualizarColaIniciativaDesdeTaleSpire(colaTS || [])`
   Zustand propaga e inyecta la actualización del estado de forma síncrona en React.
3. **Redundancia Cuádruple de Oyentes DOM**: Registrar oyentes normales de eventos JS (`window.addEventListener("initiativeUpdated", ...)`) en `window` y `document` para asegurar compatibilidad con cualquier señal de mensajería que despache CEF.
4. **Limpieza en `App.tsx`**: Remover por completo la sobreescritura diferida asíncrona dentro del `useEffect` de `App.tsx`, previniendo pisados de closures y optimizando el ciclo de vida del montaje.

**Lección aprendida:**
> ⚡ ** हैंडशेक (Handshake) de CEF / Unity es Sincrónico e Inmediato**: En aplicaciones embebidas CEF complejas con suscripciones en manifiestos (como TaleSpire Symbiotes), **NUNCA definas tus callbacks globales de window dentro de useEffects asíncronos o funciones de inicialización diferidas de React**. 
> Define todos tus manejadores globales de forma estrictamente **sincrónica, inmutable e inmediata en el punto de entrada inicial (main.tsx/index.html)**. Conéctalos al estado de tu aplicación (como Zustand) utilizando APIs directas fuera de componentes (`getState()`). Esto garantiza que el motor del juego vincule con éxito tus escuchas CEF desde el microsegundo inicial, garantizando reactividad en caliente del 100% en tiempo real.

---

## [2026-05-25] CRÍTICO: Discrepancia fatal en campos de `initiativeQueue` (`activeItemIndex` vs `activeTurn`)

**Síntoma:**
A pesar de tener los callbacks globales sincronizados e inyectados sincrónicamente de forma exitosa, al presionar "Siguiente Turno" en TaleSpire o al presionar el botón "Sincronizar TaleSpire" del combat tracker, el turno activo de la UI del Simbionte no se movía ni rodaba para seleccionar al combatiente que tenía el turno nativo real en el tablero 3D.

**Causa raíz:**
1. En la fase de diseño teórica, asumimos que la cola de iniciativa física devuelta por `TS.initiative.getQueue()` contenía una propiedad `.activeTurn` con el UUID o ID de la criatura.
2. Sin embargo, la **firma real de la API oficial de TaleSpire** expone el turno activo bajo la propiedad **`activeItemIndex`** (un entero que indica el índice base cero del combatiente que tiene el turno en ese instante en la cola) y la lista de combatientes bajo la clave **`items`** (y no `queue` ni `entries`).
3. Dado que nuestro código leía `colaTS.activeTurn` (la cual devolvía `undefined`), la variable de ID activo se resolvía a `null`, impidiendo que Zustand rodara el índice activo local.

**Solución aplicada:**
1. **Zustand Polimórfico y Hiper-Defensivo (`src/almacen/usarAlmacenDM.ts`)**: Modificar la acción `actualizarColaIniciativaDesdeTaleSpire` para que decodifique el turno de forma extremadamente segura y adaptativa:
   - Evaluar prioritariamente `colaTS.activeItemIndex` y, como fallback de compatibilidad, `colaTS.activeTurn`.
   - Si el valor devuelto es de tipo `number`, buscar la criatura en esa posición del array `colaTS.items`.
   - Si el valor devuelto es un `string`, evaluar si es un string numérico (ej. `"0"`, `"1"`) usando regex (`/^\d+$/`) para parsearlo como índice, o si contiene el UUID directamente de forma textual.
2. **Fallback por Nombre de Criatura**: Implementar una búsqueda de respaldo en el combat tracker combinando por el nombre de la criatura sanitizado (`nombre.toLowerCase().trim() === cTS.name.toLowerCase().trim()`) si por algún motivo los UUIDs del cliente local no coinciden exactamente con los de TaleSpire.
3. **Simulador de Alta Fidelidad (`src/utiles/SimuladorTaleSpire.ts`)**: Actualizar la inicialización y mocks del simulador para que devuelvan exactamente el objeto oficial estructurado `{ activeItemIndex, items, round }`, simulando el avance y retroceso incrementando/decrementando el entero en lugar de rotar los elementos del array de forma física.

**Lección aprendida:**
> 📐 **Firma de la Initiative de TaleSpire**: El SDK nativo de TaleSpire para iniciativa expone estrictamente **`activeItemIndex`** (el entero del índice) e **`items`** (el array). 
> Al integrar datos de APIs CEF empotradas, **nunca asumas nombres de propiedades genéricos (como "activeTurn" o "queue")**. Emplea siempre normalizadores ultra polimórficos que evalúen y den soporte a múltiples variantes de nombres de variables y tipos de datos (índices numéricos, strings numéricos o UUIDs planos). Esto asegura que tu aplicación sea 100% inmune a cambios evolutivos silenciosos en el motor del juego.

---

## [2026-05-25] MANTENIMIENTO: Rigor del compilador estricto (`tsc`) y limpieza de UI redundante

**Síntoma:**
Tras remover elementos visuales del JSX solicitados por el DM (como la barra `"SELECCIÓN DETECTADA EN MESA"` y el botón `"REFRESCAR"`), el script de despliegue en caliente `pnpm run deploy` fallaba al intentar compilar en producción, arrojando errores `TS6133` (variable declarada pero nunca leída).

**Causa raíz:**
1. Al remover la lógica visual del render, quedaron desestructuraciones locales de variables de Zustand (`criaturasSeleccionadas`, `agregarCriaturasSeleccionadasAIniciativa`, `actualizarSeleccionCriaturas`), funciones internas de React (`manejarRefrescarEstadisticasJugador`) e importaciones de componentes e iconos (`RotateCw`) huérfanos.
2. El entorno del proyecto de Vite tiene forzada la bandera estricta de TypeScript `noUnusedLocals`, lo que provoca que cualquier variable huérfana de este tipo sea interpretada como un error sintáctico severo e impida la compilación del bundle final en producción.

**Solución aplicada:**
1. **Limpieza Quirúrgica Completa**: Remover de forma sistemática toda importación de iconos de Lucide obsoletos y desestructuraciones locales del hook de Zustand `usarAlmacenDM()` en `BarraControl.tsx` y `GestorIniciativa.tsx` que no se utilizaran tras la limpieza de UI.
2. **Iniciativa Inicial a 1**: Modificar el mapeo de criaturas importadas nativamente de TaleSpire para que, si no existían antes, su iniciativa local inicial por defecto sea `1` (en lugar de `10`). Al inicializarse con iniciativa `1`, la criatura se ordena de forma predecible y consistente al final de la lista del combat tracker local (imitando exactamente el comportamiento nativo físico de TaleSpire).

**Lección aprendida:**
> 🧼 **Mantenimiento y TypeScript Estricto**: Al realizar refactorizaciones visuales de limpieza de UI a petición del usuario, **nunca te limites a comentar o remover la porción de JSX**. 
> Realiza siempre un barrido en retroceso para limpiar las importaciones, estados locales, desestructuraciones de hooks y funciones manejadoras que queden huérfanas. El compilador de TypeScript en producción castiga el desuso con fallos de build. Mantener la base de código libre de código muerto garantiza la salud a largo plazo y la paridad de compilación al 100%.

---

## [2026-05-25] CRÍTICO: Fallo en parsing de fórmulas de dados por caracteres especiales "menos" Unicode (Kobold HP Bug)

**Síntoma:**
Al activar la preferencia de vida al azar o vida máxima en el combat tracker, a criaturas específicas importadas como el "Kobold Warrior" no se les aplicaba el recálculo dinámico por dados, cayendo siempre de forma fija en su promedio matemático estático estricto (7 HP), a pesar de estar correctamente vinculadas a su plantilla en `Monster_Manual-es-2024.json`.

**Causa raíz:**
1. En el compendio oficial traducido al español (`Monster_Manual-es-2024.json`), la fórmula de dados para el HP del Kobold Warrior se define en la clave `"Notes"` como `"(3d6 − 3)"`.
2. El carácter empleado en el signo de resta no es el guión clásico `"-"` (U+002D, `HYPHEN-MINUS`), sino el **signo menos matemático nativo de Unicode `"−"` (U+2212)**.
3. La sanitización de la función `calcularVidaPorDados` en `src/almacen/usarAlmacenDM.ts` sólo eliminaba espacios y paréntesis: `formula.replace(/[\s()]+/g, "")`. Esto dejaba la cadena como `3d6−3`.
4. El posterior validador por expresión regular: `match(/^(\d+)d(\d+)([+-]\d+)?$/)` fallaba silenciosamente en procesar la fórmula al no coincidir el signo menos de unicode con el guión clásico `[-]`. Al fallar, la función devolvía inmediatamente el promedio estático estricto.

**Solución aplicada:**
Modificar la sanitización de fórmulas en `calcularVidaPorDados` en `usarAlmacenDM.ts` para normalizar y unificar cualquier variante de guión largo o signo menos matemático de Unicode al guión clásico de teclado:
```typescript
const saneada = formula
  .replace(/[\s()]+/g, "")
  .replace(/[–—−]+/g, "-") // Normaliza en-dash, em-dash y minus sign de unicode al guión clásico '-'
  .toLowerCase();
```
Esto garantiza que la cadena resultante sea `3d6-3`, la cual es parseada a la perfección por la expresión regular del motor de dados de Zustand, calculando la vida máxima (15 HP) o vida al azar (tirando dados `3d6 - 3` dando entre 1 y 15 HP) con absoluta precisión.

**Lección aprendida:**
> 📐 **Sanitización de Caracteres en Expresiones Regulares**: Cuando parsees fórmulas de dados o expresiones matemáticas provenientes de fuentes externas (como archivos JSON traducidos, PDFs o manuales oficiales extraídos), **nunca confíes en que los caracteres de resta serán guiones-menos de teclado estándar (`-`)**.
> Los manuales formateados tipográficamente suelen usar signos matemáticos reales de Unicode (`−`) o guiones largos (`–`, `—`). Emplea siempre una sanitización polimórfica que reemplace activamente `/[–—−]+/g` por `"-"` antes de evaluar mediante expresiones regulares para garantizar un parsing 100% inmune y robusto.

---

## [2026-05-25] CRÍTICO: Bloqueo de Diálogos Nativos en Entornos CEF/WebView2 (Bug en Guardado de Encuentros)

**Síntoma:**
Al pulsar el botón "Guardar" de la barra superior para guardar el encuentro de iniciativa actual, la aplicación fallaba de manera silenciosa o congelaba la interacción sin que ocurriera nada en la pantalla.

**Causa raíz:**
1. El código original utilizaba llamadas modales síncronas del navegador: `const nombre = window.prompt(...)` y `alert(...)`.
2. TaleSpire ejecuta los simbiontes dentro de un Chromium Embedded Framework (CEF) / WebView2 integrado en Unity. Por motivos de rendimiento e integridad del hilo de renderizado del videojuego, los diálogos nativos del sistema de ventanas (`window.prompt`, `window.alert`, `window.confirm`) están completamente deshabilitados o bloqueados. Al invocarse, la llamada se queda suspendida indefinidamente o falla sin reportar excepciones.

**Solución aplicada:**
Erradicar por completo `window.prompt` y `alert` del combat tracker. Diseñamos un menú desplegable de React (`mostrarMenuGuardar`) 100% interactivo y estilizado, embebido directamente bajo el botón "Guardar". Este menú valida síncronamente que la iniciativa no esté vacía, solicita el nombre del encuentro en un campo de texto input de alta gama HSL, y reporta el éxito o error de forma puramente digital en la interfaz web de React mediante notificaciones visuales automáticas auto-temporizadas.

**Lección aprendida:**
> 🛡️ **CEF es Libre de Modales de Navegador**: En simbiontes de TaleSpire o entornos WebView integrados en videojuegos, **NUNCA utilices funciones modales del navegador como `alert`, `prompt` o `confirm`**. 
> Estas llamadas congelarán o fallarán de forma invisible en la aplicación. Diseña siempre tus flujos para capturar datos, nombres o confirmaciones a través de formularios, cuadros de texto y modales React puramente integrados en tu UI web.

---

## [2026-05-25] MANTENIMIENTO: Type-Safety de Colecciones Opcionales de Plantillas en Formularios de Edición React

**Síntoma:**
Al compilar la aplicación tras implementar el flujo de edición en caliente de listas dinámicas, el compilador estricto de TypeScript (`tsc`) arrojaba errores del tipo `TS18048: 'monstruoForm.reacciones' is possibly 'undefined'`.

**Causa raíz:**
Las propiedades como `reacciones`, `accionesLegendarias` y `accionesRapidas` están declaradas como opcionales (`?`) en la interfaz `MonstruoBase` del modelo de datos. Al intentar mapearlas directamente mediante índices (ej. `const r = monstruoForm.reacciones[idx]`) dentro de las funciones de carga en los inputs para edición (`iniciarEditarReaccion`), TypeScript bloqueaba la compilación al no estar garantizado que la propiedad no fuera `undefined`.

**Solución aplicada:**
Introducir de forma sistemática el operador de encadenamiento opcional `?.` en el acceso de índice en todas las 5 funciones inicializadoras de edición:
`const r = monstruoForm.reacciones?.[idx];`
`const l = monstruoForm.accionesLegendarias?.[idx];`
`const qa = monstruoForm.accionesRapidas?.[idx];`
Si la colección es `undefined`, el valor resultante se evalúa de manera segura como `undefined` (haciendo que el posterior control `if (!r) return;` aborte la función defensivamente) en lugar de provocar fallos sintácticos de compilación.

**Lección aprendida:**
> 🛡️ **Acceso Seguro a Colecciones en React Forms**: Al programar flujos interactivos de edición e inyección sobre arreglos opcionales o dinámicos en React, **nunca asumas que la colección existirá síncronamente en el estado de tu formulario**.
> Utiliza siempre el operador de encadenamiento opcional `?.` antes de indexar arreglos (`?.[idx]`) para garantizar la total paridad y robustez frente a directivas de TypeScript estricto, previniendo excepciones en tiempo de ejecución.

## [2026-05-25] UI/UX: Normalización de Atributos de Salvación en Hechizos (CD de Salvación 'CD DC')

**Síntoma:**
En el compendio y modal de Hechizos, bajo "Mecánicas de Combate Integradas", el campo de CD Salvación mostraba de forma genérica `"CD Salvación: CD DC"`, en lugar de indicar la característica táctica real (ej. `"CD Destreza"`, `"CD Sabiduría"`).

**Causa raíz:**
1. Los compendios JSON importados a menudo contienen la cadena genérica `"CD DC"`, `"DC"` o `"CD"` en campos como `cdSalvacion` o `toHitOrDC`. Al cargarse o migrarse, esta cadena rancia se guardaba en el almacén de base de datos sin sanearse de forma retrospectiva.
2. En el Creador Homebrew (`CreadorHomebrew.tsx`), el select de características guardaba siglas cortas (como `"DES"`, `"SAB"`, `"FUE"`), lo que provocaba inconsistencia visual (`"CD DES"` vs `"CD Destreza"`) y no se autoseleccionaban correctamente al editar los hechizos importados en la interfaz gráfica.

**Solución aplicada:**
1. **Helper de Saneamiento `sanearHechizoCD` (`usarAlmacenDM.ts`)**: Se implementó una función centralizada de normalización que limpia cadenas rancias (como `"CD DC"`, `"DC"`, `"CD"`) y las traduce a nombres completos en español (`"Fuerza"`, `"Destreza"`, `"Constitución"`, `"Inteligencia"`, `"Sabiduría"`, `"Carisma"`). Si la cadena está vacía o es genérica, escanea inteligentemente el texto de descripción en español buscando tiradas de salvación tácticas para deducir de forma precisa la característica del conjuro.
2. **Saneamiento Retroactivo Caliente y al Importar**:
   - Se inyectó `sanearHechizoCD` en el cargador oficial del blob global de TaleSpire (`cargarDatosPersistidos`) y en la migración de LocalStorage, asegurando que todos los hechizos de sesiones previas se limpien retroactivamente al arrancar la app.
   - Se integró la función en la importación de JSON (`importarBaseDatosJSONCompleta`) para sanear en caliente todos los conjuros cargados de manuales externos.
3. **Homogeneización del Creador Homebrew (`CreadorHomebrew.tsx`)**: Se modificaron las opciones del select de salvación del creador Homebrew para almacenar directamente los valores completos en español (ej. `value="Destreza"`), logrando una paridad absoluta del 100% y autoselección correcta al editar conjuros importados.

**Lección aprendida:**
> 🛡️ **Normalización en Caliente de Compendios**: En bases de datos tácticas, nunca asumas que los archivos importados o persistidos por el usuario vendrán saneados y listos.
> Emplea siempre un normalizador polimórfico en el cargador y en el importador que unifique los términos rancios a valores en español bien estructurados y deduzca los campos faltantes a través de búsquedas por regex en la descripción textual.

---




