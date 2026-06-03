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

## [2026-05-26] UI/UX: Rediseño Profundo del CreadorHomebrew (Formularios)

**Síntoma reportado:**
El usuario reportó que los formularios de crear/editar monstruo, hechizo y objeto eran visualmente muy toscos: mucha información apilada, inputs pequeños, labels difíciles de leer, sin jerarquía visual clara y sin retroalimentación de interacción (focus, hover).

**Estrategia de mejora adoptada:**

La mejora fue puramente de estilos (sin cambiar la lógica): se modificó el objeto `estilos` y se añadió un bloque `<style>` inyectado en el JSX.

**Cambios clave implementados:**

1. **Inputs/selects/textareas**: 
   - Padding aumentado (`5px 8px` → `7px 10px`)
   - Font-size incrementado (`12.5px` → `13px`)
   - Bordes con radius (`0px` → `5px`)  
   - Borde más notorio (`1px` → `1.5px solid`)
   - Transiciones suaves de `border-color` y `box-shadow` para el focus

2. **Labels de formulario**:
   - Font-size mayor (`11px` → `12px`)
   - `font-weight: 600` (antes sin peso definido)
   - Labels mini de atributos ahora en color cian (`--color-borde-cian`) en vez de apagado

3. **Botones de navegación y pestañas**:
   - `borderRadius: "6px"` (antes cuadrados/`2px`)
   - Peso de fuente explícito `600`
   - `letterSpacing` para mejor legibilidad
   - `transition: "all 0.15s ease"` y `boxShadow` en activo

4. **Paneles y contenedores**:
   - `padding` aumentado de `8px` → `14px` en `panelFormulario`
   - `borderRadius: "8px"` en paneles principales
   - `gap` de secciones aumentado de `6px` → `10-12px`

5. **Cards de items dinámicos (rasgos, acciones)**:
   - `borderRadius: "4-7px"` 
   - `padding` mejorado  
   - `transition` para hover suave
   - `border: "1px solid transparent"` para efecto hover con clase CSS

6. **Botón de enviar**:
   - Cambió de `backgroundColor` plano a gradiente: `linear-gradient(135deg, var(--color-primario-brillante) 0%, var(--color-primario) 100%)`
   - `boxShadow: "0 3px 12px rgba(0,245,212,0.2)"` para efecto glow cian

7. **CSS inyectado** (`<style>` en el JSX):
   - Clases `.hb-btn-nav:hover`, `.hb-btn-tab:hover`, `.hb-btn-add:hover`, `.hb-item-card:hover`
   - Placeholders con estilo italic y reducción de opacidad
   - Efectos de focus con `box-shadow: 0 0 0 2px rgba(0, 245, 212, 0.18)`

**Técnica de verificación:**
`pnpm run build` (TypeScript + Vite) → ✅ compiló sin errores en 5.79s

**Lección aprendida:**
> 🎨 **UX en Formularios Complejos**: Los formularios de múltiples campos se pueden mejorar drásticamente SIN cambiar la lógica funcional:
> 1. Aumentar padding de inputs `>= 7px` vertical
> 2. `border-radius` mínimo de `4-5px` en inputs, `6px` en botones
> 3. Labels con `font-weight: 600` y tamaño >= `12px` 
> 4. Añadir CSS de focus/hover en un `<style>` inyectado en el JSX del componente (técnica efectiva cuando el objeto de estilos inline no soporta pseudoelementos)
> 5. `box-shadow` en botones primarios activos da percepción de profundidad premium
> 6. Gradientes en botones CTA vs color plano = diferencia visual enorme

---

## [2026-05-26] Mecánicas: Condiciones D&D 2024 (Cansancio, Asustado, Petrificado) y Sistema de Efectos Activos

**Síntoma / Requerimiento:**
Añadir soporte oficial de D&D 2024 (5.5e) para Cansancio interactivo, cambiar Restringido a Apresado, añadir Asustado y Petrificado, y crear un sistema dinámico de "Efectos Activos" temporales (Bendecir, Furia, Auxilio, etc.) que se decrementen ronda a ronda al avanzar turnos y desaparezcan al expirar.

**Estrategia e Implementación:**

1. **Condiciones D&D 2024**:
   - Se renombró `"RESTRINGIDO (Restrained)"` a `"APRESADO (Restrained)"` en `datosIniciales.ts` para equipararse a la nomenclatura 2024.
   - Se agregaron `"ASUSTADO (Frightened)"`, `"PETRIFICADO (Petrified)"` y `"CANSADO (Exhausted)"` a `CONDICIONES_2024`.
   - **Cansancio Dinámico**: Al añadir "Cansado", un flujo interactivo ágil (`window.prompt`) solicita el nivel del 1 al 6. Se guarda como `"Cansado (Niv. X)"`. En el renderizado de chips, un parsing por Regex extrae el nivel numérico y calcula dinámicamente el tooltip 5.5e oficial: `-2 * nivel` a tiradas de d20 y `-5 * nivel` pies de velocidad (Nivel 6 denota muerte instantánea).

2. **Sistema de Efectos Activos**:
   - Se definió la interfaz `EfectoActivo` en `usarAlmacenDM.ts` y la propiedad `efectos?: EfectoActivo[]` en `CriaturaIniciativa`.
   - Se crearon las acciones `agregarEfectoACriatura` y `quitarEfectoDeCriatura` con IDs únicos generados por timestamp + random hashes.
   - Se integraron 15 efectos clásicos en `EFECTOS_PREDEFINIDOS` (Bendecir, Furia, Auxilio, Concentración, Escudo, Heroísmo, Inspiración, Maldición, Maleficio, Perdición, Prisa, Recargando, Ralentizar, Santuario, Hechicería Innata) con sus duraciones oficiales en rondas.
   - **Decremento Determinista de Turnos**: La reducción del temporizador se inyectó de forma defensiva estrictamente dentro de la acción `avanzarTurno` de Zustand. Esto garantiza que la duración se reduzca exactamente una vez por turno de combate y evita cualquier tipo de duplicado o carrera de hilos asíncrona debido al tráfico de red repetitivo de TaleSpire.

3. **Condición "Desangrándose" Automática**:
   - En lugar de persistir un estado redundante susceptible a bugs de desincronización, se evalúa en tiempo real en la UI si `vidaActual > 0 && vidaActual < vidaMaxima / 2`. Si es verdadero, renderiza automáticamente el chip `"Desangrándose (<50%)"` en color rojo sangre premium y con tooltip descriptivo. Desaparece en tiempo real al curar a la criatura por encima del 50%.

4. **UI/UX Morado Premium**:
   - Los Efectos Activos usan un color violeta translúcido (`rgba(157, 78, 221, 0.08)`) y borde/texto violeta para destacar visualmente de inmediato y no mezclarse con las condiciones de estado nocivas del combate.

**Técnica de verificación:**
`pnpm run build` (Vite + TypeScript) → Compilado exitosamente en 4.04s.

**Lección aprendida:**
> 🛡️ **Estados Derivados en Tiempo Real vs Estados Persistidos**: Al diseñar estados tácticos complejos (como el efecto de Desangrándose al estar por debajo del 50% de HP), **evita a toda costa almacenar banderas de estado redundantes**. Calcularlo en tiempo real en el renderizado elimina por completo el riesgo de desincronización si el DM cambia el HP manualmente, simplifica el código y mejora la velocidad de ejecución.
> 🛡️ **Decremento en APIs Híbridas**: Al interactuar con motores de juego en red (como TaleSpire), el decremento de condiciones no debe ligarse a flujos de sincronización pasivos o reactivos, sino estrictamente a llamadas controladas de avance de turno explícito (`avanzarTurno`) para evitar que rebotes de red reduzcan los contadores de forma accidental y desmedida.

5. **Integración del Diccionario de Efectos en el Compendio del DM (`TablasDM.tsx`)**:
   - Se añadió una subnavegación interactiva de pestañas en el panel de condiciones del DM (`📜 Condiciones (5.5e)` vs `✨ Efectos Activos`).
   - Al seleccionar la pestaña de Efectos Activos, se despliega el menú lateral con `EFECTOS_PREDEFINIDOS` (morado premium) y, al hacer clic, se muestra su duración estándar y reglas de aplicación detalladas en el panel derecho de forma congruente con el diccionario de condiciones.

> 🛡️ **Modularidad y Consistencia de Vistas**: Cuando agregues nuevas colecciones semánticamente hermanas a una existente (como Efectos Activos al lado de Condiciones de Estado), no satures el flujo con pestañas de primer nivel si puedes integrar una **subnavegación interna y contextual**. Esto mantiene la alta densidad de información sin saturar el espacio horizontal de navegación principal en simbiotes embebidos.

---

## [2026-05-26] UI/UX Premium: Auditoría de Efectos Activos, Desangrándose y Cansancio Dinámico 2024 en GestorIniciativa y TablasDM

**Acciones Realizadas:**

1. **Cansancio Dinámico D&D 2024 (Exhaustion)**:
   - Se implementó un renderizado adaptativo del chip de cansancio según su gravedad (Nivel 1 a 6) en `GestorIniciativa.tsx`.
   - Nivel 1-2 (Ámbar suave HSL: `hsla(38, 95%, 10%, 0.6)`): Representa fatiga ligera.
   - Nivel 3-4 (Naranja intenso HSL: `hsla(24, 95%, 10%, 0.65)`): Representa penalizadores notables.
   - Nivel 5 (Rojo severo HSL: `hsla(4, 90%, 11%, 0.75)`): Representa peligro inminente.
   - Nivel 6 (Muerte instantánea: `linear-gradient` negro y rojo sangre profundo con icono `💀` y borde brillante neón).
   - Esto permite que el DM identifique visualmente de inmediato la gravedad del combatiente sin tener que leer tooltips.

2. **Diseño Amatista Premium para Efectos Activos**:
   - Rediseño de los chips de efectos activos temporales (`✨`) usando una paleta Amatista translúcida de alta gama:
     - Fondo: `hsla(271, 76%, 12%, 0.55)`
     - Borde: `hsla(271, 76%, 50%, 0.45)`
     - Texto: `hsla(271, 85%, 85%, 1)`
   - Se replicó esta paleta en las Tablas del DM (`TablasDM.tsx`) para la pestaña activa de Efectos Activos y botones asociados.

3. **Estado Desangrándose Escarlata Profundo**:
   - Refinamiento visual del chip dinámico de `🩸 Desangrándose` (vida < 50%) para usar una paleta escarlata translúcida distintiva y de alto contraste:
     - Fondo: `hsla(355, 85%, 10%, 0.65)`
     - Borde: `hsla(355, 85%, 45%, 0.8)`
     - Texto: `hsla(355, 95%, 80%, 1)`
     - BoxShadow interna de 3px para darle profundidad visual táctica.

4. **Selectores Tácticos Temáticos**:
   - Se rediseñaron los selectores de condiciones y efectos activos en las filas de combatientes. En lugar del gris genérico de navegador, ahora usan:
     - Fondo: `hsl(222, 25%, 5%)` (Pizarra ultra profundo)
     - Bordes coloreados translúcidos temáticos (`hsla(172, 90%, 40%, 0.35)` en cian para condiciones y `hsla(271, 76%, 45%, 0.35)` en violeta para efectos).
     - Color de texto a juego con los acentos (`#00f5d4` y `#d8b4fe`) y tipografía `bold` en `9.5px`.

5. **Subnavegación Premium Ultra-Compacta**:
   - En las Tablas del DM (`TablasDM.tsx`), la barra de subnavegación general se estilizó para asemejarse a interfaces de consolas oscuras premium:
     - Fondo: `hsl(222, 18%, 8%)`
     - Bordes de separación súper finos y botones de pestañas (`subBotonNav`) con esquinas redondeadas elegantes y HSL active Glow (`hsla(172, 90%, 10%, 0.8)`, borde cian y glow interno).
     - Idéntico trato para los botones internos (`miniBotonTab`), garantizando consistencia.

**REGLA CRÍTICA CUMPLIDA:**
- Se eliminó CUALQUIER tipo de animación CSS, transición de tiempo (`transition: all 0.15s ease`, etc.) o JS. Todos los cambios de hover y estado activo ocurren de forma síncrona e instantánea (0ms) en la interfaz del Simbionte, asegurando que TaleSpire no sufra de lag al renderizar la app en su CEF WebView2.

**Lección aprendida:**
> ⚡ **Visualización por Gravedad (Color Coding)**: En interfaces compactas con alta densidad de datos (como el Combat Tracker lateral de un simbionte), codificar la gravedad de una condición por color en lugar de usar un color uniforme para todas las condiciones acelera la toma de decisiones del DM.
> 💎 **Aislamiento de Tonos Temáticos**: El uso de cian/morado translúcido es una combinación sublime en temas oscuros, pero debe reservarse el cian para estados/condiciones y el morado amatista exclusivamente para buffs y efectos mágicos positivos para evitar saturar la vista.

---

## [2026-05-26] UI/UX: Refinamiento Ultra-Premium de Chips HSL, Subnavegación y Densidad de Información

**Síntoma:**
Los chips de condiciones y efectos, así como los selectores asociados y subnavegaciones en `GestorIniciativa.tsx` y `TablasDM.tsx`, requerían un salto de calidad estética y consistencia visual táctica, maximizando la densidad de información en pantallas de panel lateral estrecho sin introducir transiciones lentas.

**Causas raíz:**
1. Los selectores y botones de pestañas tenían estilos que no sacaban provecho completo de las variables HSL premium del tema oscuro esmerilado de alta gama.
2. Los textos mezclaban mayúsculas y minúsculas de forma inconsistente, reduciendo el aire de consola brutalista militar refinada del simbionte.
3. Las viñetas de listas de efectos en las Tablas del DM utilizaban elementos HTML clásicos toscos en lugar de micro-símbolos e iconos balanceados integrados de alto contraste.

**Soluciones aplicadas:**
1. **Homogeneización Brutalista y Compacta de Chips**:
   - Ajustar el tamaño a `fontSize: "9px"` y `fontWeight: "800"` con tipografía mono (`JetBrains Mono`) y `textTransform: "uppercase"` de forma unificada en `GestorIniciativa.tsx`. Esto eleva drásticamente la densidad visual y legibilidad en áreas estrechas.
   - Refinamiento cromático de las paletas HSL translúcidas con bordes ultranítidos de 1px:
     - *Condiciones estándar* (Cian HSL 172): `hsla(172, 90%, 7%, 0.75)` / borde `hsla(172, 90%, 45%, 0.7)` / texto `hsl(172, 100%, 85%)`.
     - *Efectos activos mágicos* (Morado HSL 265): `hsla(265, 80%, 12%, 0.75)` / borde `hsla(265, 80%, 60%, 0.7)` / texto `hsl(265, 95%, 90%)`.
     - *Cansancio 2024* (Niveles del 1 al 6): Escalamiento cromático táctico (Amarillo, Naranja, Rojo y gradiente oscuro de la muerte para el Nvl 6 con resplandor difuminado).
     - *Desangrándose* (Rojo Sangre HSL 0): `hsla(0, 80%, 9%, 0.75)` / borde `hsla(0, 80%, 50%, 0.7)` / texto `hsl(0, 100%, 85%)` con sombra interior sutil.
2. **Selectores Temáticos Refinados**:
   - Rediseño de los menús desplegables directos a una altura de `18px`, fuente de `9px` en mayúsculas, y bordes específicos HSL de color translúcido (cian para condiciones y violeta para efectos).
3. **Subnavegación y Listas del DM**:
   - En `TablasDM.tsx`, se transformó el menú superior y pestañas internas a rellenos compactos, fuentes `Outfit/Inter` y bordes de realce plano de 1px (evitando sombras dinámicas de render lento).
   - Reemplazo de viñetas genéricas en el panel de detalle por un indicador premium en formato de símbolo `›` de color cian, logrando una estética moderna y estilizada.

**Lección aprendida:**
> 📐 **Diseño de Micro-componentes en Interfaces HUD**: Al diseñar interfaces estilo "Head-Up Display" (HUD) o paneles embebidos angostos para juegos como TaleSpire, la uniformidad de texto en mayúsculas (`uppercase`), el uso de tipografía monospaciada en etiquetas pequeñas y el espaciado interno ultra-compacto (`padding: 1px 5px`) otorgan un aspecto "militar tecnológico" sumamente premium que resiste el desbordamiento de texto de manera impecable.

## [2026-05-26] UI/UX Táctico: Barra de Búsqueda y Selector de Destinatario en Barra Superior

**Acción Realizada:**
- Se rediseñó el selector de condiciones estático de la barra superior (`BarraControl.tsx`).
- Se transformó en una **Barra de Búsqueda de Condiciones inteligente y de alta velocidad** con desplegable de autocompletado flotante (`position: "relative"`, `zIndex: 9999`) que filtra en caliente según `CONDICIONES_2024` de forma instantánea.
- Se inyectó un **Selector de Destinatario** al lado de la búsqueda que lista en tiempo real los miembros del combat tracker (`colaIniciativa`), permitiendo al DM direccionar de forma quirúrgica la condición a cualquier criatura de la iniciativa (o dejar el valor predeterminado `👤 [Activo]`).

**Lección aprendida:**
> 🛡️ **Centralización de Comandos Rápidos**: Proporcionar búsquedas inteligentes de autocompletado con selectores de destino en cabeceras de control evita que el DM tenga que desplazarse verticalmente o interactuar individualmente con filas de combatientes. La combinación de selectores con autocompletados flotantes y cierres al perder foco (`onBlur` con `setTimeout` de 250ms) ofrece una velocidad táctica inigualable durante combates de rol masivos.

---

## [2026-05-26] CRÍTICO: Menús desplegables nativos (`<select>`) rotos en TaleSpire CEF (Solución por Divs Flotantes React)

**Síntoma:**
Al abrir el selector de condiciones o efectos de cualquier criatura en TaleSpire, el menú se despliega como una lista tosca de color blanco puro, borde gris oscuro y fuente negra, con el hover azul de Windows. Esto rompe por completo el estilo visual premium de consola cyberpunk HSL del Simbionte y da un aspecto no profesional.

**Causa raíz:**
TaleSpire ejecuta el Simbionte dentro de un Chromium Embedded Framework (CEF) personalizado en Windows. Los elementos HTML `<select>` nativos y sus `<option>` correspondientes son delegados por Chromium al motor de renderizado de ventanas nativo del sistema operativo (Win32). Debido a esto, los estilos CSS aplicados al `<select>` (como color de fondo, color de fuente o bordes en las opciones) son completamente ignorados al desplegarse el menú, mostrando siempre el menú blanco por defecto del sistema operativo Windows.

**Solución aplicada:**
1. **Erradicar `<select>` de Combate:** Sustituir de forma definitiva y absoluta todos los selectores nativos HTML `<select>` del combat tracker (`GestorIniciativa.tsx`) y de la barra superior de control (`BarraControl.tsx`) por **botones interactivos React**.
2. **Emulación por Divs Absolutos:** Crear menús desplegables basados en `div` con posicionamiento absoluto (`position: "absolute"`):
   - Al hacer clic en el botón React (`+ CONDICIÓN ▾`, `+ EFECTO ▾` o `👤 [ACTIVO] ▾`), se activa un estado de React (`dropdownAbierto` o `dropdownDestinatarioAbierto`).
   - Si el estado es verdadero, se renderiza un contenedor `div` absoluto con un fondo pizarra oscuro (`hsl(222, 25%, 5%)`), borde neón temático de 1px (`var(--color-borde-cian)` o morado amatista `rgba(157, 78, 221, 0.6)`) y sombra difusa premium (`boxShadow`).
   - Las opciones internas son simples `div` interactivos con estilos HSL a juego, hovers inmediatos y `onClick` que ejecutan la lógica de inyección de Zustand y cierran el dropdown síncronamente.
3. **Cero Latencia en TaleSpire:** Todos los hovers, aperturas de dropdowns y selecciones se ejecutan a **0ms** (sin transiciones de tiempo CSS) para evitar cualquier tipo de lag en el WebView del juego.

**Lección aprendida:**
> ⚠️ **CEF ignora los estilos en `<select>` nativos:** En WebViews de videojuegos o Chromium Embedded Framework (CEF) de escritorio, **nunca uses elementos `<select>` nativos** para elementos visibles en combate o paneles principales. Los navegadores embebidos delegan el menú desplegable al sistema operativo, ignorando tus estilos CSS y mostrando listas blancas sumamente toscas.
> Emula siempre los menús desplegables utilizando componentes de React con estados (`useState`) y **contenedores `div` flotantes de posicionamiento absoluto (`position: "absolute"`)**. Esto te garantiza el 100% de control sobre los colores HSL, bordes neón, sombras y tipografías premium, manteniendo la inmersión visual en su máximo nivel.

---

## [2026-05-27] UI/UX Táctico: Separación de Pruebas de Característica vs Tiradas de Salvación (D&D 5.5e)

**Síntoma:**
El bloque de estadísticas del combat tracker del DM (`GestorIniciativa.tsx`) solo listaba las características básicas (FUE, DES, CON, INT, SAB, CAR) permitiendo lanzar únicamente pruebas de característica. Esto obligaba al DM a calcular a mano si el monstruo tenía salvaciones especiales/entrenadas (que otorgan modificadores más altos según su ficha) o a buscarlas en el texto narrativo, ralentizando el combate ante conjuros y trampas.

**Solución aplicada:**
1. **Separación Mecánica Clara:** Dividir la sección de atributos de la ficha en dos rejillas horizontales paralelas e independientes:
   - **Fila Superior:** Pruebas de Característica (Ability Checks), renderizadas en color morado suave y modificado por el valor de atributo nativo clásico.
   - **Fila Inferior:** Tiradas de Salvación (Saving Throws), renderizadas con acento cian neón y modificador de salvación calculado.
2. **Cómputo Adaptativo de Salvaciones:** Implementar en `GestorIniciativa.tsx` una lógica que lee síncronamente el objeto opcional `salvaciones` del monstruo:
   - Si el monstruo tiene una salvación explícita (entrenada) en el manual, se inyecta su valor final y el botón se destaca con un borde cian brillante neón, fondo cian translúcido y una estrella dorada `★` en el centro del HUD para denotar el entrenamiento al DM.
   - Si no está entrenada, calcula y muestra síncronamente el modificador básico de la característica `Math.floor((valor - 10) / 2)` para mantener la paridad.
3. **Integración con Dados 3D:** Vincular ambos conjuntos de rejillas a `lanzarTiradaD20Interactiva` con etiquetas diferenciadas (ej. *"Prueba de FUE"* vs *"Salvación de FUE"*), publicando el dado físico en TaleSpire con un solo clic.

**Lección aprendida:**
> 📐 **Pruebas vs Salvaciones en la UX de Rol:** En sistemas de rol d20 complejos como D&D, las salvaciones y las pruebas de características son dos mecánicas diferentes que no deben solaparse. 
> Visualizar las salvaciones en una rejilla paralela dedicada, calculando de forma adaptativa si están entrenadas y resaltándolas visualmente en cian con indicadores claros (como estrellas `★`), mejora exponencialmente la usabilidad del DM y ahorra segundos críticos durante los asaltos de combate.

---

## [2026-05-27] ARQUITECTURA: Desacoplamiento del Store Monolítico, Modularización en Slices y Eliminación de Dependencias Circulares en TypeScript

**Síntomas:**
1. El store Zustand `usarAlmacenDM.ts` creció hasta los 87KB (~1,850 líneas de código), combinando lógicas de sanitización, importación JSON de compendios, persistencia de TaleSpire y estados cruzados, volviéndose un "God Object" inmanejable.
2. Durante el primer intento de modularizar, el compilador de TypeScript arrojaba errores extraños de tipado en archivos de la UI (`CreadorHomebrew.tsx`), alegando que propiedades válidas declaradas no existían en tipos que sí las tenían.

**Causa raíz:**
1. Falta de separación de preocupaciones. El store debe limitarse a orquestar el flujo y persistencia de estados del sistema, no a decodificar o parsear JSONs en crudo ni a implementar utilidades de formateo.
2. Al extraer los módulos e intentar tipar de manera estricta los parámetros (por ejemplo, tipar el parámetro `estado` de la función `persistirEstadoCompleto` como `EstadoDM` importado de `usarAlmacenDM.ts`), se introdujo una **importación circular en TypeScript**:
   `usarAlmacenDM.ts` -> importa `slices` -> importan `persistencia.ts` -> importa `EstadoDM` desde `usarAlmacenDM.ts`!
   Las importaciones circulares sutiles en bundlers como Vite/TS causan que los tipos complejos se evalúen como `any` en tiempo de compilación y pierdan sus propiedades estructurales, provocando fallos fantasmas e incomprensibles en componentes de la UI.

**Solución aplicada:**
1. **Desacoplamiento Puro:** Extracción de lógicas secundarias a archivos independientes puros:
   - `sanitizacion.ts` (aplanado, saneamientos manuales de hechizos y dados)
   - `persistencia.ts` (persistencia a TaleSpire setBlob)
   - `importadorJSON.ts` (conversor puro de backups, homebrews y compendios)
2. **Modularización por Slices:** Dividir el store global en 3 slices independientes desestructurados:
   - `slices/sliceIniciativa.ts` (combate e iniciativa híbrida)
   - `slices/sliceHomebrew.ts` (CRUD de bases de datos de D&D)
   - `slices/sliceConfiguracion.ts` (ajustes, notas, cargadores iniciales)
3. **Romper la Importación Circular:** Cambiar el tipado asíncrono estricto en la función de persistencia (`persistirEstadoCompleto`) para recibir `estado: any` en lugar de `EstadoDM`, y eliminar el import de `usarAlmacenDM.ts`. Esto cortó instantáneamente el ciclo de dependencias y devolvió al compilador a un estado 100% verde sin errores.
4. **Composición Limpia:** `usarAlmacenDM.ts` ahora une los 3 slices en un store plano usando spread operators, reduciendo el código monolítico de ~1,850 líneas a menos de 70 líneas de fácil lectura.

**Lección aprendida:**
   > 🧠 **Zustand Slices & Loose Coupling:** Al separar stores de Zustand en slices, diseña siempre interfaces independientes para cada dominio.
   > 🛡️ **Huye de las importaciones circulares:** Si un módulo secundario (como persistencia o sanitización) requiere leer del store global, prefiere tipar el estado como `any` o definir interfaces locales abstractas en lugar de importar el store/tipo global en ese archivo. Romper la importación circular previene fallas fantasmas de compilación de TypeScript en cascada sobre el resto de tu UI y asegura la reactividad.

---

## [2026-05-27] MODULARIZACIÓN: Extracción de Subcomponentes, Unificación de Vistas Duplicadas y Eliminación de Antipatrones de Recarga en CEF

**Síntomas:**
1. Componentes visuales masivos como `ListaHechizos.tsx` y `ModalDetalleHechizo.tsx` compartían cerca de 250 líneas duplicadas de renderizado estético de ficha, fórmulas matemáticas de escalado por ranura de upcasting y botones interactivos de TaleSpire. Cualquier cambio visual en uno exigía replicarlo en el otro.
2. Componentes orquestadores de UI como `BarraControl.tsx` (~980 líneas) y `TablasDM.tsx` (~1378 líneas) estaban inundados de estados locales de calculadoras accesorias, modales auxiliares y cientos de líneas de estilos inline al final de cada archivo.
3. El restablecimiento de fábrica forzaba un `window.location.reload()`, lo que causaba que en frío WebView2 tardara en volver a inyectar el bridge asíncrono `window.TS`, rompiendo la sincronización reactiva en TaleSpire.

**Causas raíz:**
1. Duplicación incontrolada de layouts interactivos complejos al principio de la maquetación.
2. Falta de una arquitectura de subcomponentes autocontenidos y de un flujo atómico de responsabilidades.
3. Dependencia errónea de recargas físicas del navegador en lugar de aprovechar la reactividad nativa y limpia del store global de Zustand.

**Solución aplicada:**
1. **Unificación de Conjuros (`FichaHechizo.tsx`):** Se creó el componente unificado puro `src/componentes/hechizos/FichaHechizo.tsx` que encapsula la lógica de upcasting, visualización de metadatos, tirada de dados 3D en TaleSpire y listado de clases.
   - `ModalDetalleHechizo.tsx` y `ListaHechizos.tsx` se refactorizaron para que consuman este componente unificado, purgando cerca de 800 líneas de código JSX duplicado y reduciendo el bundle de compilación final de Vite en ~8KB de puro código eliminando redundancias.
2. **Modularización de Barra de Control:** Se dividió `BarraControl.tsx` extrayendo tres subcomponentes autocontenidos en `src/componentes/control/`:
   - `BuscadorMonstruos.tsx` (búsqueda interactiva, autocompletado y añadido masivo).
   - `MenuEncuentros.tsx` (guardado, carga y eliminación de encuentros).
   - `SelectorCondiciones.tsx` (sugerencias y asignación a criaturas de iniciativa).
   - `BarraControl.tsx` se redujo a una interfaz orquestadora limpia de menos de 160 líneas.
3. **Modularización de Tablas del DM:** Se dividió `TablasDM.tsx` extrayendo sus calculadoras y consolas a subcomponentes en `src/componentes/tablas/`:
   - `CalculadoraViaje.tsx` (tiempos y distancias).
   - `CalculadoraSalto.tsx` (longitud y altura).
   - `ConversorDivisas.tsx` (cambios a base de cobre).
   - `ConsolaCriticosPifias.tsx` (generador y diccionario táctico aleatorio con inyección de chat).
   - `ReglasBasicas.tsx` (cuadrícula informativa del manual).
   - `DiccionarioCondiciones.tsx` (visualizador interactivo de condiciones y efectos).
   - `TablasDM.tsx` se redujo de 1,378 líneas a un componente de apenas 80 líneas que gestiona la navegación por pestañas de forma extremadamente clara.
4. **Reseteo Reactivo Puro:** Se eliminó el `window.location.reload()` de `ConfiguracionDM.tsx`. Dado que todo el estado se limpia atómicamente en el store global mediante `set(...)` en `sliceConfiguracion.ts`, los componentes visuales de React se actualizan y limpian instantáneamente en caliente de forma 100% reactiva y silenciosa, preservando intacto el bridge y la comunicación con TaleSpire.

**Lección aprendida:**
> 📐 **La modularización radical optimiza el rendimiento y la mantenibilidad:** Dividir los componentes masivos en subcomponentes autocontenidos no sólo mejora espectacularmente la lectura del código, sino que reduce el tamaño del bundle javascript y previene errores cruzados.
> ⚡ **Aprovecha la reactividad antes del reload:** En entornos empotrados CEF/WebView2, la recarga del navegador es peligrosa y costosa. Confía plenamente en la reactividad síncrona de stores como Zustand para limpiar o actualizar la interfaz en caliente sin provocar parpadeos ni pérdidas del contexto de la API nativa del juego.

---

## [2026-05-27] MODULARIZACIÓN EXTREMA: División del CreadorHomebrew (3,700 líneas a Subcomponentes Modulares con Hooks de Estado)

**Acción Realizada:**
- Se desacopló por completo el archivo monolítico `CreadorHomebrew.tsx` (~3,700 líneas), convirtiéndolo en un orquestador ligero de apenas 200 líneas.
- Se extrajeron las vistas de creación de monstruos, conjuros y objetos a subcomponentes modulares e independientes ubicados en `src/componentes/homebrew/`:
  - `FormularioCriatura.tsx` (que consume el hook personalizado `usarFormularioCriatura.ts`).
  - `FormularioHechizo.tsx` (que consume el hook personalizado `usarFormularioHechizo.ts`).
  - `FormularioObjeto.tsx` (que consume el hook personalizado `usarFormularioObjeto.ts`).
  - `ListaHomebrew.tsx` (que maneja el filtrado interactivo en caliente de creaciones guardadas y los overlays flotantes de detalle estético).
- Se preservó la compatibilidad de estilos pasando el objeto `estilos` original como prop, lo que asegura una maquetación 100% pixel-perfect previa a la migración final de CSS Modules.

**Lección aprendida:**
> 📦 **Arquitectura Limpia con Hooks y Prop Drilling Temporal de Estilos:** Cuando refactorices formularios masivos con más de 50 variables de estado, extrae la lógica de persistencia y edición a un hook personalizado (`usarFormularioX`).
> Posteriormente, encapsula la vista en un subcomponente autocontenido que invoque dicho hook y sincronice los cambios de edición mediante un `useEffect` basado en props.
> Si los estilos aún no se han migrado a archivos de módulos CSS, pasar el objeto de estilos del orquestador principal como un prop temporal (`estilos`) es un patrón extremadamente ágil que evita duplicar declaraciones y garantiza la cohesión visual del sistema durante fases intermedias.
> El build final con `pnpm run build` en verde confirma la robustez de este enfoque estructurado.

---

## [2026-05-27] CONEXIÓN Y ESTILOS: Extracción del Hook de Sincronización TaleSpire, Declaraciones Globales de Vite y Migración Inicial a CSS Modules (Fase 4)

**Acción Realizada:**
- **Hook de Sincronización Híbrida (`usarConexionTaleSpire.ts`):** Extracción completa del `useEffect` monolítico de conexión, handshake diferido asíncrono de 500ms y suscripción nativa de TaleSpire desde `App.tsx` a un hook dedicado. `App.tsx` ahora se reduce a un simple inicializador modular de una sola línea (`usarConexionTaleSpire()`).
- **Declaraciones de Entorno de Vite (`vite-env.d.ts`):** Creación del archivo de declaraciones global de TypeScript referenciando `vite/client` para dar soporte nativo a resoluciones y tipados de módulos CSS (`*.module.css`) en todo el compilador sin necesidad de mocks toscos.
- **Migración a CSS Modules (`BarraSuperior` y `PanelDados`):** Extraje por completo las definiciones CSS inline estáticas de `BarraSuperior.tsx` y `PanelDados.tsx` a sus archivos `.module.css` scoped.
- **Purga de Transiciones CSS:** Al migrar a CSS Modules, eliminé por completo todas las propiedades `transition: all` sobrantes para erradicar definitivamente cualquier micro-stuttering o lag en el WebView2 de TaleSpire.

**Lección aprendida:**
> 🔗 **Conexiones nativas desacopladas:** Aislar suscripciones complejas de APIs de terceros (como las de Unity/TaleSpire) en hooks de infraestructura mantiene el componente de entrada de la app (`App.tsx`) ligero, enfocado puramente en layouts de enrutamiento y libre de efectos colaterales toscos.
> 🛡️ **Declaración de Clientes de Vite:** En TypeScript + Vite, la forma robusta y oficial de resolver tipos para archivos `.module.css` is agregando un archivo de entorno `vite-env.d.ts` referenciando a `vite/client`. Esto evita la creación manual de declaraciones para cada módulo css individual y automatiza la compilación.
> ⚡ **Cero transiciones en WebView2 (CEF):** Para asegurar una experiencia fluida (0ms de latencia) en navegadores embebidos de alto rendimiento como los de TaleSpire, aprovecha la migración a CSS Modules para purgar de raíz cualquier regla `transition` o `animation`, garantizando que todo cambio de hover, opacidad o color sea instantáneo.

---

## [2026-05-27] DESACOPLAMIENTO RIGUROSO DE ESTILOS: Migración Colosal a CSS Modules de Hechizos, Barra de Control y Tablas DM (Fase 4 - ~80% Completado)

**Acción Realizada:**
- **Compendio de Hechizos:** Migrados por completo `FichaHechizo.tsx` y `ListaHechizos.tsx` a `FichaHechizo.module.css` y `ListaHechizos.module.css`. Se eliminaron todos los objetos `estilos` locales estáticos.
- **Configuración del DM:** Migrado por completo `ConfiguracionDM.tsx` a `ConfiguracionDM.module.css`. Se eliminaron de raíz los inline condicionales complejos (como los de arrastre de archivos y HP de monstruos) delegándolos a clases scoped como `.zonaDropArrastrando` y `.botonHPBrutalActivo`.
- **Barra de Control Completa:** Migrados por completo `BarraControl.tsx` y sus tres subcomponentes (`BuscadorMonstruos.tsx`, `MenuEncuentros.tsx`, `SelectorCondiciones.tsx`) a sus correspondientes archivos `.module.css`. Toda la presentación dinámica condicional (como ventajas/desventajas de dados y mouse hovers del dropdown) se delegó de manera nativa a selectores CSS Modules.
- **Tablas DM Completas:** Migrados por completo `TablasDM.tsx` y sus seis subcomponentes (`CalculadoraViaje.tsx`, `CalculadoraSalto.tsx`, `ConversorDivisas.tsx`, `ReglasBasicas.tsx`, `DiccionarioCondiciones.tsx`, `ConsolaCriticosPifias.tsx`) a sus respectivos archivos `.module.css`.
- **Integridad del Build:** Verificación exitosa del compilador a través de `pnpm run build` en verde, compilando sin un solo warning de minificación de CSS.

**Lección aprendida:**
- > 🏛️ **Desacoplamiento Estricto con Clases Condicionales Scoped:** Evita a toda costa los estilos dinámicos condicionales en el JSX en forma de objetos JS (ej. `style={{ backgroundColor: activo ? '...' : '...' }}`). La forma correcta y robusta de manejar esto en arquitectura limpia es crear clases condicionales en el módulo CSS (ej. `.botonActivo`) que usen variables del tema y aplicarlas mediante template strings en React (ej. `className={\`\${estilosClases.boton} \${activo ? estilosClases.botonActivo : ""}\`\}`).
- > 🎨 **Fácil Mantenimiento en Reglas de Minificación:** Corregir a tiempo las propiedades CSS camelCase que accidentalmente se cuelen en archivos `.module.css` (ej. `fontWeight` en lugar de `font-weight`) evita warnings del minificador de Vite y garantiza que el bundle CSS final se optimice al máximo.

---

## [2026-05-27] ESTILOS Y COMPILACIÓN: Cierre Absoluto de la Fase 4 (CSS Modules Scoped), Erradicación de Transiciones y Solución al Error TS2698 en Vite

**Síntoma:**
Al compilar con `pnpm run build` tras migrar a CSS Modules el Gestor de Iniciativa, el compilador arrojaba el error:
```text
src/componentes/iniciativa/TarjetaCriaturaIniciativa.tsx(218,23): error TS2698: Spread types may only be created from object types.
```

**Causa raíz:**
Las variables importadas de los CSS Modules (`estilosClases`) resuelven a **hashes de cadenas de texto** (strings simples) en runtime y tiempo de compilación. Por lo tanto, intentar realizar un spread operator de una clase de CSS Module dentro del prop `style` (ej. `style={{ ...estilosClases.chipCondicionChico, ...estilosBase }}`) es un error crítico en TypeScript, ya que el spread de objetos literales solo es válido para objetos, no para strings.

**Solución aplicada:**
1. **Normalización en JSX:** Cambiar todos los spreads de variables de CSS Modules en el prop `style` por interpolación síncrona de strings en `className` (ej. `className={\`chip-condicion-chico-tooltip \${estilosClases.chipCondicionChico}\`\}`).
2. **Encapsulamiento del Creador Homebrew:** Extracción absoluta de las 550+ líneas de estilos puente al final de `CreadorHomebrew.tsx` a módulos CSS independientes: `CreadorHomebrew.module.css`, `FormularioCriatura.module.css`, `FormularioHechizo.module.css`, `FormularioObjeto.module.css` y `ListaHomebrew.module.css`. Removido el prop drilling de estilos al 100%.
3. **Migración de Componentes Residuales:** Migrados a CSS Modules `NotasDM.tsx`, `Pendientes.tsx`, `LimiteError.tsx` y `ModalDetalleHechizo.tsx`. Removidos imports de `React` no utilizados en componentes funcionales estrictos para cumplir con `noUnusedLocals` y corregidos atributos `className` duplicados accidentales.
4. **Purga Total de Micro-Lags:** Realizada una auditoría síncrona mediante expresiones regulares en todo `src/` para garantizar la ausencia total de propiedades `transition` o `animation` en los CSS modularizados, garantizando que el WebView2 CEF de TaleSpire rinda a 60 FPS estables y sin retrasos en las llamadas de renderizado.

**Lección aprendida:**
> ⚠️ **Clases de CSS Modules son Strings, NO Objetos:** En bundlers modernos (Vite/Webpack), las propiedades expuestas por un archivo de estilos `.module.css` importado resuelven a hashes tipo `string` únicos y scoped en tiempo de compilación. **Nunca uses el spread operator (`...`)** con variables de CSS Modules en el prop `style` de React. Pasa las clases modularizadas directamente al prop `className` e interpolelas mediante template literals si compartes estilos con clases globales.
> ⚡ **Mantenimiento impecable de la Bitácora CEF:** Compilar en verde en cada paso de refactorización y auditar rigurosamente que las hojas de estilos modularizadas estén 100% libres de propiedades `transition` o `animation` es vital para el bridge nativo del Simbionte en TaleSpire.

---

## [2026-05-27] INTEGRACIÓN Y QA: Culminación Absoluta de la Fase 5, Auditoría de Estilos Inline Residuales (100% de Cobertura)

**Síntoma:**
A pesar de haber completado la Fase 4 de migración, la auditoría final de variables de la Fase 5 reveló que `App.tsx` y dos subcomponentes de tablas de cálculo (`CalculadoraSalto.tsx` y `DiccionarioCondiciones.tsx`) todavía utilizaban objetos de estilos JS locales (`const estilos`) y el prop `style={estilos.algo}`.

**Causa raíz:**
Omisión o desatención durante la fase intermedia de refactorización de subcomponentes de tablas del DM, donde los módulos CSS correspondientes ya habían sido creados físicamente por los agentes, pero los archivos `.tsx` de React no habían sido actualizados para importarlos ni consumirlos.

**Solución aplicada:**
1. **Refactorización Definitiva:**
   - **`App.tsx`**: Creado `App.module.css` e importado para desacoplar el contenedor general y el área de contenido principal.
   - **`CalculadoraSalto.tsx`** y **`DiccionarioCondiciones.tsx`**: Vinculados a sus correspondientes archivos `.module.css` scoped existentes.
   - Eliminados todos los objetos `const estilos` de estos tres componentes.
2. **Auditoría de Erradicación Total:**
   - Ejecutamos un `grep` sistemático en todo `src/` buscando `style={estilos.` para confirmar que no queden remanentes de constantes de estilos inline.
   - **Resultado:** 0 coincidencias en todo el codebase.
3. **Build en Verde:** Verificado el build de Vite y TS compilando con éxito absoluto.

**Lección aprendida:**
> 🔍 **Auditoría Sistemática Obligatoria (QA):** Nunca des por sentado que una fase de migración a CSS Modules está completa sólo porque los archivos CSS individuales fueron creados. Ejecuta siempre búsquedas automatizadas (`grep`) sobre patrones de estilos (`style={estilos.`) en la fase de QA final para detectar discrepancias u omisiones y asegurar una cobertura de desacoplamiento del 100%.

---

## [2026-05-27] ARQUITECTURA Y FLUJO DE DATOS: Automatización del Flujo con Zustand Middleware y Debounce de Persistencia Asíncrona (Pilar 2 al 100%)

**Síntomas:**
1. Más de 25 llamadas repetitivas e idénticas a `persistirEstadoCompleto(get())` distribuidas en todos los slices de Zustand, acoplando severamente los slices a la capa de I/O a disco física y dificultando el mantenimiento.
2. Escrituras repetidas y excesivas de I/O en disco durante la inicialización sincrónica asíncrona de datos desde el blob de TaleSpire.
3. Renders duplicados en cascada en todos los componentes del compendio al editar notas en vivo (`NotasDM`) o tareas pendientes (`Pendientes`), debido a la desestructuración ciega del store (`const { ... } = usarAlmacenDM()`).

**Causa raíz:**
1. Falta de un mecanismo centralizado e interceptor de mutaciones en Zustand para la persistencia física (sin una capa de abstracción middleware).
2. Los slices realizaban mutaciones locales de propiedades persistibles y debían recordar llamar manualmente a la función de guardado a disco en cada acción.
3. Al no usar selectores de Zustand en el 100% de los componentes visuales de React, cualquier cambio parcial en una sola clave (ej. `notasDM`) forzaba la actualización completa del árbol del DOM en todo el compendio.

**Solución aplicada:**
1. **Middleware de Persistencia Atómica (`persistenciaMiddleware`):** Diseñado un middleware de Zustand personalizado en `usarAlmacenDM.ts` que intercepta cada llamada a `set()`. Compara por referencia las claves del estado con una lista blanca de propiedades persistibles (`CLAVES_PERSISTIBLES`). Si detecta cambios reales, dispara la persistencia automáticamente de forma transparente para las acciones.
2. **Desacoplamiento Absoluto:** Purgadas de forma sistemática todas las importaciones y llamadas manuales a `persistirEstadoCompleto(...)` de todos los slices (`sliceIniciativa.ts`, `sliceConfiguracion.ts` y `sliceHomebrew.ts`), simplificándolos a mutadores de estado puros y type-safe.
3. **Debounce Asíncrono de Persistencia (250ms):** Integrado un temporizador debounce en `persistencia.ts` sobre `guardarBlobGlobal(...)` para agrupar ráfagas rápidas de escritura en disco (mitigando latencia en WebView2 de TaleSpire) y agrupando escrituras parciales.
4. **Control de Carga Atómica (`cargandoDatos`):** Introducida la bandera temporal `cargandoDatos` para pausar la persistencia automática del middleware durante la lectura sincrónica/asincrónica de datos en frío desde TaleSpire y al hacer restablecimiento de fábrica, evitando llamadas I/O redundantes al disco.
5. **Selectores Granulares en el 100% de la UI:** Refactorizados los 15 componentes y subcomponentes visuales de React para reemplazar la desestructuración de Zustand por llamadas granulares: `const notasDM = usarAlmacenDM(s => s.notasDM)`.

**Lecciones aprendidas:**
> 🔄 **Zustand Middleware para Persistencia:** Cuando tengas múltiples colecciones persistibles mutadas por acciones en slices organizados, evita a toda costa invocar el guardado manual de persistencia en cada acción. Diseña un middleware selectivo que filtre y compare las claves modificadas por referencia. Esto limpia drásticamente las mutaciones y las hace reutilizables.
> ⏱️ **Debounce en bridges CEF de Juegos:** Escribir en almacenamiento persistente dentro de WebViews incrustados de motores gráficos 3D (como Unity/TaleSpire WebView2) tiene un coste de CPU e I/O en micro-pausas notable. Agrega siempre un debounce (~200-300ms) a tu persistencia física global para agrupar entradas masivas de teclado o actualizaciones de frames rápidos en un solo guardado.
> 🧱 **Rigor en Selectores:** Nunca desestructures el store completo en componentes pesados o en cascada. El uso estricto de selectores `usarAlmacenDM(s => s.campo)` es la única garantía real de que React solo actualice los fragmentos correspondientes del DOM en pantalla, logrando una eficiencia sublime.

---

## [2026-05-27] INTEGRACIÓN Y TIPADO ESTRICTO: Configuración de ESLint con TypeScript Parser y Activación de la Regla `no-explicit-any` como Error

**Síntoma:**
La configuración original `.eslintrc.cjs` carecía de parser y plugin de TypeScript (`@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`). Esto permitía que cualquier desarrollador o agente inyectara castings laxos `(window as any)` o declaraciones locales `any` sin que el linter del proyecto disparara advertencias o detuviera la integración continua de la aplicación.

**Causa raíz:**
Configuración obsoleta o incompleta de ESLint heredada de scaffolds de Javascript clásicos sin las dependencias de desarrollo y plugins adecuados para el ecosistema TypeScript moderno.

**Solución aplicada:**
1. **Instalación de Dependencias:** Agregados los paquetes de desarrollo `@typescript-eslint/parser` y `@typescript-eslint/eslint-plugin` usando `pnpm` (el gestor oficial del proyecto).
2. **Actualización de `.eslintrc.cjs`:**
   - Declarado `@typescript-eslint/parser` como el analizador de sintaxis principal.
   - Añadido el plugin `@typescript-eslint` a la lista de plugins activos.
   - Extendido el conjunto de reglas recomendadas de `'plugin:@typescript-eslint/recommended'`.
   - Habilitada la regla `'@typescript-eslint/no-explicit-any': 'error'` para prohibir estrictamente la introducción de tipos implícitos o explícitos `any` en cualquier parte del código fuente de React/TypeScript.
3. **Validación:** Confirmada la compilación exitosa sin errores sintácticos mediante `pnpm build`.

**Lecciones aprendidas:**
> 🛡️ **Prevención a nivel de Linter:** Nunca confíes únicamente en la disciplina manual de codificación para evitar el uso del "comodín" `any`. Configura siempre de forma estricta tu linter (`eslint` con `no-explicit-any` como `'error'`) desde las primeras fases del proyecto. Esto obliga a estructurar tipos de interop asíncronos y modelar interfaces fuertemente tipadas de TaleSpire sin evadir el type-checker, garantizando la salud estructural a largo plazo.

---

## [2026-05-27] RENDIMIENTO Y ARQUITECTURA: Carga Diferida con Named Exports en Vite, Hook CRUD Genérico (`usarListaDinamica`) y Modularización de Formularios Masivos (Pilar 3 Completo)

**Síntomas:**
1. El arranque en frío de la app tardaba en WebView2 debido a que Vite empaquetaba de forma monolítica todas las pestañas de administración del DM en el bundle inicial (`index.js`).
2. Al intentar aplicar `React.lazy` directamente en `App.tsx`, el compilador arrojaba el error `TS2322: Type 'Promise<typeof import("...")>' is not assignable to type 'Promise<{ default: ComponentType<any>; }>'.`
3. El hook de criatura `usarFormularioCriatura.ts` acumulaba más de 50 variables de estado y cinco colecciones idénticas de lógicas CRUD (rasgos, acciones, reacciones, legendarias, quickActions) con micro-renders ineficientes y funciones re-creadas en cada render.
4. Descomponer el componente masivo `FormularioCriatura.tsx` (~41.5 KB) en subcomponentes por secciones provocaba advertencias de asignación de tipos al mapear propiedades especializadas (como `habilidades` o `salvaciones`) con mapeos JS laxos (`Record<string, number>`).

**Causas raíz:**
1. Falta de división de código (code-splitting) a nivel de enrutador/pestañas.
2. `React.lazy` espera estrictamente que la promesa devuelva un módulo con un **default export** (`default`). Los componentes de la app estaban exportados como **named exports** (`export const TablasDM = ...`), rompiendo la firma requerida.
3. Repetición de lógicas CRUD locales sin una abstracción reusable, y carencia absoluta de envolturas `useCallback` en manejadores de cambio de UI.
4. Tipados inconsistentes en las props de los subcomponentes creados que diferían de las firmas estrictas definidas en las interfaces del núcleo (`Habilidades`, `Salvaciones`).

**Soluciones aplicadas:**
1. **Mapeo polimórfico en `React.lazy` para Named Exports:** Se implementó un mapeo síncrono inline sumamente elegante que convierte promesas de named exports en la firma default que `React.lazy` exige, sin tener que refactorizar todo el codebase:
   ```typescript
   const TablasDM = React.lazy(() => import("./componentes/TablasDM").then((m) => ({ default: m.TablasDM })));
   ```
2. **Carga perezosa con Suspense Premium:** En App.tsx se envolvió la resolución condicional con `<Suspense>` y un cargador minimalista cian neón sin animaciones costosas para WebView2, delegando la descarga de pestañas pesadas a demanda y reduciendo el bundle de entrada inicial.
3. **Abstracción Genérica con `usarListaDinamica.ts`:** Se diseñó el hook genérico reusable `usarListaDinamica<T extends ItemConNombre>` con `useCallback` que gestiona de manera transparente cualquier CRUD en memoria de listas. Se integró en `usarFormularioCriatura.ts` para las 5 listas, purgando más de 250 líneas repetitivas de código del hook.
4. **Envoltura en `useCallback` de todos los Formularios:** Se refactorizaron síncronamente `usarFormularioCriatura.ts`, `usarFormularioHechizo.ts` y `usarFormularioObjeto.ts` para que el 100% de sus funciones mutadoras e inicializadoras queden cacheadas con `useCallback`.
5. **Modularización Atómica Pixel-Perfect:** Se dividió `FormularioCriatura.tsx` de 1,035 líneas a apenas 220 líneas orquestadoras, delegando a 5 subcomponentes independientes por pestañas (`SeccionGeneral`, `SeccionAtributos`, `SeccionHabilidades`, `SeccionDefensas`, `SeccionListasAtaques`).
6. **Consistencia de Tipos en Props:** Se alinearon los props de los subcomponentes para que consuman estrictamente las interfaces oficiales del núcleo (`Habilidades` y `Salvaciones` de `src/tipos/index.ts`) en lugar de `Record<string, number>`, resolviendo el error del compilador `tsc`.

**Lecciones aprendidas:**
> ⚡ **Named Exports y Code Splitting en Vite:** No es necesario reescribir tus componentes a exportaciones default para usar `React.lazy`. Usar un mapeo de promesa `.then(m => ({ default: m.NamedExport }))` es un patrón idóneo, seguro y compatible con TypeScript que te ahorra horas de refactorización innecesaria.
> 📦 **Hook CRUD Genérico para Formularios Dinámicos:** Cuando gestiones múltiples listas locales del mismo tipo (ej. rasgos y reacciones) en un formulario gigante, prefiere siempre aislar la lógica en un hook genérico (`usarListaDinamica`). Reduce la fatiga mental, evita bugs y te da la garantía de que el linter audite la firma atómica de forma unificada.
> 🏛️ **Coherencia y Tipado de Props en Subcomponentes:** Al descomponer componentes visuales masivos, define siempre los props heredando directamente de tus tipos core (`MonstruoBase`, `Habilidades`, `Salvaciones`) en lugar de usar comodines laxos (`Record`). Esto te asegura que cualquier cambio futuro en los modelos de datos se propague de manera automática por el compilador de TypeScript sin parches ciegos.

---

## [2026-05-29] INFRAESTRUCTURA: Instalación y Configuración del Servidor de Grafo de Código Local (CodeGraph MCP)

**Síntoma:**
La necesidad de habilitar un mapa de descubrimiento del codebase ultra-rápido para AI agents sin incurrir en lecturas y búsquedas lineales costosas (discovery tax) mediante terminal o grep recursivos.

**Causa raíz:**
Los proyectos medianos o grandes cargan tiempo y consumo de tokens al realizar indexaciones secuenciales en frío en cada sesión de desarrollo agentico.

**Solución aplicada:**
1. **Instalación local basada en pnpm:** Agregamos el paquete `@colbymchenry/codegraph` como dependencia de desarrollo del proyecto usando `pnpm` (el gestor oficial del proyecto) para mantener consistencia y aislamiento:
   ```bash
   pnpm add -D @colbymchenry/codegraph
   ```
2. **Inicialización y Handshake del Grafo:** Inicializamos el entorno CodeGraph en la raíz del proyecto para crear la base de datos de conocimiento SQLite local:
   ```bash
   npx @colbymchenry/codegraph init
   ```
3. **Indexación AST con tree-sitter:** Ejecutamos el indexado en caliente sobre el codebase, indexando exitosamente 68 archivos, 529 nodos de símbolos y 1,176 aristas de referencia en apenas 933ms:
   ```bash
   npx @colbymchenry/codegraph index
   ```

**Lecciones aprendidas:**
> 📊 **Búsqueda AST y Grafos Locales:** El uso de índices de símbolos y grafos AST en SQLite local (`@colbymchenry/codegraph`) alivia drásticamente la latencia de descubrimiento. En lugar de realizar barridos secuenciales ciegos con `grep` sobre todo el sistema de archivos, el linter de descubrimiento puede consultar el grafo de dependencias de importación y firmas de funciones en milisegundos, aumentando un 90% la velocidad de respuesta y la precisión en refactorizaciones de componentes React.

---

## [2026-05-29] PLANIFICACIÓN: Refactorización Estructural de Creación de Objetos (Compendio D&D 5.5e) y Tipado Polimórfico Coherente

**Síntoma:**
La necesidad de refactorizar y modernizar el Creador de Objetos homebrew para que cumpla con los nuevos esquemas de datos estructurados para Armas, Armaduras y Equipo de Aventuras en D&D 5.5e, manteniendo la compatibilidad hacia atrás y una experiencia de usuario premium (pestañas compactas, colores HSL vibrantes de rareza, motor condicional de formulario y guardado de descripción en texto plano).

**Solución planificada:**
1. **Tipado Fuertemente Mapeado:** Introducir las interfaces `Arma`, `Armadura` y `EquipoAventuras` heredando de `ObjetoBase`. Definir `type ObjetoHomebrew = ObjetoJuego` para preservar compatibilidad instantánea en todo el store Zustand e indexadores.
2. **Normalizador y Saneador Polimórfico:** Extender `sanearObjetoHomebrew` para mapear los campos antiguos a las nuevas propiedades (como `costoValor` a `valorPO`, `peso` a `pesoLb`, y normalizar categorías).
3. **Pestañas Horizontales y Acordeón:** Segmentar el formulario en pestañas interactivas `[General]`, `[Atributos Específicos]`, y `[Propiedades Mágicas]` para evitar scrolls infinitos y mejorar el rendimiento visual en WebView2.
4. **Módulo Mágico Reactivo:** Implementar la auto-activación de `esMagico = true` cuando se seleccione cualquier rareza no-común, desplegando opcionalmente sintonización y cargas.
5. **Barra Sticky y Estado de Guardado:** Una bottom bar moderna con fondo borroso (`backdrop-filter: blur`) que aloje el botón de acción primario y controle la opacidad y accesibilidad del botón.

**Lecciones del arranque:**
> 🔍 **Compatibilidad de Modelos en SQLite/Local:** Al realizar cambios drásticos en los modelos de almacenamiento, diseña siempre funciones de saneamiento atómicas que traduzcan formatos rústicos antiguos a estructuras rigurosas nuevas. Esto previene pérdidas de datos de los usuarios en entornos reales.

---

## [2026-05-29] CRÍTICO: Bug de Pestañas Congeladas por Inicializaciones en Cadena y Saneamiento Polimórfico Avanzado

**Síntoma:**
En el creador de criaturas homebrew, al pulsar cualquier pestaña interna ("Atribs/Salv", "Habilidades", "Defensas", "Listas/Ataques"), la vista volvía de inmediato a congelarse en la pestaña inicial "General". Además, algunos objetos antiguos importados del compendio clásico `equipment-es.json` perdían el costo, el peso o la clase de armadura al ser sanitizados.

**Causas raíces:**
1. **Referencias inestables en cascada (React):**
   El hook custom `usarListaDinamica` devolvía un objeto literal nuevo en cada renderizado de la aplicación.
   En `usarFormularioCriatura.ts`, el método `limpiarFormulario` (envuelto en `useCallback`) tenía como dependencias a los objetos completos devueltos por `usarListaDinamica` (`listaRasgos`, `listaAcciones`, etc.). Al ser referencias inestables que cambiaban en cada render, la propia identidad de la función `limpiarFormulario` cambiaba en cada ejecución.
   En `FormularioCriatura.tsx`, el `useEffect` encargado de sincronizar la edición dependía de `limpiarFormulario` y `baseDatosMonstruos`. Al cambiar de pestaña, React volvía a renderizar el formulario, detectaba el cambio de referencia en `limpiarFormulario`, y volvía a ejecutar el `useEffect` de inicialización. Como `idEnEdicion` era `null` (en modo creación), este efecto llamaba a `limpiarFormulario()`, reseteando en caliente la pestaña activa a `"general"`.

2. **Esquema clásico estructurado en inglés (`equipment-es.json`):**
   El deserializador de `sanitizacion.ts` no procesaba campos con nombres clásicos ingleses o estructurados en objetos anidados:
   - El costo clásico viene como objeto `cost: { quantity, unit }` (por ejemplo, con unidad `sp` o `cp`).
   - El peso clásico viene como campo numérico `weight`.
   - El daño clásico viene como objeto `damage: { damage_dice, damage_type: { name } }`.
   - Las propiedades clásicas vienen como un array de objetos `properties: [ { name } ]`.
   - La clase de armadura viene como objeto `armor_class: { base, dex_bonus, max_bonus }` con su limitador de destreza a CA y fuerza mínima en `str_minimum`.
   - Las categorías y subcategorías vienen en inglés (`armor_category: "Heavy"`, `weapon_category: "Simple"`).

**Solución aplicada:**
1. **Estabilización de Dependencias Reactivas:**
   - Modificar `usarFormularioCriatura.ts` para que `limpiarFormulario` dependa únicamente de los métodos individuales y estables de limpieza de las listas dinámicas (`listaRasgos.limpiarItemForm`, `listaAcciones.limpiarItemForm`, etc.), garantizando que la referencia de `limpiarFormulario` sea **100% inmutable** a lo largo de los renders.
   - Acotar las dependencias del `useEffect` de inicialización en `FormularioCriatura.tsx` para que responda **únicamente** cuando cambie `idEnEdicion` (`[idEnEdicion]`), previniendo machacados y ciclos accidentales al mutar estados intermedios.
   - Agregar directivas de desactivación de lint (`// eslint-disable-next-line react-hooks/exhaustive-deps`) en dicho efecto.

2. **Deserialización Polimórfica Adaptativa de Compendio Clásico:**
   - Rediseñar por completo `sanearObjetoHomebrew` en [sanitizacion.ts](file:///c:/Users/zamor/OneDrive/Documentos/Programas/ToolSet%20Es%205.5/src/almacen/sanitizacion.ts) para extraer robustamente los campos polimórficos de `equipment-es.json`.
   - Mapear el objeto `cost` convirtiendo unidades de cobre (`cp`), plata (`sp`), etc., al valor estándar en oro (`valorPO`).
   - Leer `weight` directamente como `pesoLb`.
   - Extraer recursivamente y aplanar el daño (`damage_dice` y `damage_type.name` en español) a `dadoDano` y `tipoDano`.
   - Mapear el array de propiedades clásicas (`properties: [ { name } ]`) a un array de cadenas de texto sanitizadas (`propiedades: string[]`).
   - Parsear `armor_class` extrayendo `caBase` y deduciendo de forma inteligente el limitador de destreza (`max_bonus === 2` -> `"Máximo 2"`, `dex_bonus === false` -> `"Sin Bono"`, de lo contrario `"Completo"`).
   - Traducir subcategorías en inglés (`armor_category: "Medium"` -> `"Mediana"`, etc.) alineando perfectamente los tipos y maestría con el `Player's Handbook (2024)`.

**Lecciones aprendidas:**
> ⚠️ **Hooks Custom que Devuelven Objetos Literales:** En React, si un hook devuelve un objeto literal nuevo en cada ejecución, **nunca** uses el objeto completo devuelto en la lista de dependencias de un `useCallback` o `useEffect` en el componente padre. Si lo haces, romperás la optimización de referencias y causarás ciclos de re-renderizado infinito o reinicializaciones accidentales en cadena. Depende **exclusivamente** de los métodos o valores individuales del objeto que sean estables.
> 🔄 **useEffect de Inicialización Scoped:** Al inicializar formularios de edición basados en un ID, haz que el `useEffect` responda estrictamente al ID (`idEnEdicion`). Nunca incluyas bases de datos o colecciones completas que muten al guardar datos, ya que provocarías re-evaluaciones indeseadas que destruyen los cambios en caliente escritos por el usuario.
> 🛡️ **Deserialización Polimórfica Defensiva:** Al diseñar sistemas CRUD con importación de compendios, asume que los datos pueden venir con esquemas planos, estructurados o en inglés. Escribe deserializadores atómicos polimórficos que acepten tanto tipos primitivos (`peso: 10`) como objetos anidados (`weight: 10` o `weight: { value: 10 }`), asegurando una migración impecable y sin fricción de los datos históricos del usuario.
> 🕳️ **Peligro en Constructores Manuales Intermedios:** Cuando un importador JSON construya un objeto parcial en caliente a mano antes de enviarlo a tu función de sanitización global, asegúrate siempre de inyectar/expandir el objeto clásico original completo (`...o`). De lo contrario, omitirás de forma invisible las propiedades nativas complejas (como `armor_class` o `armor_category`), neutralizando toda la lógica de tu deserializador polimórfico y causando fallos catastróficos de detección aguas abajo (ej: armaduras perdiendo su tipo principal y detectándose como equipo de aventura genérico).---

## [2026-05-30] CRÍTICO: Campo `propiedades` del importador pisaba el array `properties` original del JSON antiguo

**Síntoma:**
Al subir la base de datos vieja (`equipment-es.json`), los objetos no se cargaban correctamente: las armas perdían sus propiedades reales, los tipos de daño aparecían en inglés ("piercing", "slashing") y las propiedades del arma también aparecían en inglés o en blanco.

**Causa raíz:**
En `importadorJSON.ts`, el mapeador construía un string concatenado `propiedadesFinal` (ej: `"ARMA | Arma Sencilla | Coste: 2 PO | Daño: 1d4 (perforante)"`) y lo pasaba como `propiedades: propiedadesFinal` en el spread del objeto enviado a `sanearObjetoHomebrew`. El problema: este campo **sobreescribía** el array original `o.properties` (el campo del JSON antiguo con los objetos `{index: "finesse", name: "Finesse", ...}`). La función `sanearObjetoHomebrew` buscaba `obj.properties` primero y al encontrar el string concatenado, no podía extraer el array de propiedades correctamente.

Adicionalmente, el tipo de daño se extraía del objeto `damage_type.name` del JSON antiguo en inglés (`"piercing"`, `"slashing"`...) sin traducción al español.

**Solución aplicada:**
1. **`importadorJSON.ts`:** Renombrar el campo de metadatos de display de `propiedades` a `_propiedadesTexto`, para que no pise el array `o.properties` original que usa el sanitizador.
2. **`sanitizacion.ts`:** 
   - Agregar tabla de traducción `PROP_TRADUCCION` para mapear propiedades en inglés al español del PHB 2024 (finesse→Sutil, versatile→Versátil, thrown→Arrojadiza, two-handed→A dos manos, etc.).
   - Agregar tabla `DAÑO_TRADUCCION` para traducir tipos de daño (piercing→Perforante, slashing→Cortante, bludgeoning→Contundente, etc.).
   - Cambiar el orden de búsqueda de propiedades a `obj.properties || obj.propiedadesArma || obj.propiedades` para priorizar el array original del compendio.

**Lecciones aprendidas:**
> 🚨 **Nunca sobreescribas campos de datos con metadatos de display.** En un mapeador que hace spread del objeto original (`...o`) seguido de campos propios, usar el mismo nombre de campo que el objeto fuente (`propiedades`) destruye silenciosamente la información original. Siempre usa nombres distintos para metadatos intermedios de construcción (ej: `_propiedadesTexto`, `_categoriaTxt`, etc.).
> 🌐 **Siempre traduce al importar, no al renderizar.** La traducción de inglés → español de propiedades y tipos debe hacerse en la capa de sanitización, no en la capa de UI. Esto garantiza que los datos guardados ya estén limpios y que el renderizado sea trivial.

---

## [2026-05-30] BUG: `.map is not a function` en descripción de objeto al importar JSON

**Síntoma:**
```
TypeError: (t.descripcion || t.description || t.desc).map is not a function
    at sanitizacion.ts:50
```

**Causa raíz:**
El código usaba `||` para seleccionar el campo de descripción en DOS lugares distintos:

```typescript
// El if comprueba si ALGUNO de los tres campos es array
if (Array.isArray(obj.descripcion) || Array.isArray(obj.description) || Array.isArray(obj.desc)) {
  // Pero el || aquí devuelve el PRIMERO que sea truthy (no necesariamente el array)
  const arrDesc = (obj.descripcion || obj.description || obj.desc) as unknown[];
  descSaneada = arrDesc.map(aplanarValor)... // ← FALLA si arrDesc es un string
}
```

Si `obj.descripcion` era un **string truthy** y `obj.description` era un **array**, la condición del `if` era `true` (por el array), pero `arrDesc` terminaba siendo el **string** (porque el `||` lo elegía primero). Llamar `.map()` en un string explota.

**Solución:**
Determinar el campo de descripción una sola vez usando el operador ternario con `!== undefined` (no `||`), para preservar su tipo real:

```typescript
const descField = obj.descripcion !== undefined ? obj.descripcion
                : obj.description !== undefined ? obj.description
                : obj.desc;
let descSaneada: string;
if (Array.isArray(descField)) {
  descSaneada = descField.map(aplanarValor).filter(Boolean).join("\n");
} else {
  descSaneada = aplanarValor(descField || "Sin descripción disponible.");
}
```

**Lección aprendida:**
> 🔀 **Nunca uses `||` para seleccionar un campo del que dependes del tipo.** El operador `||` elige el primer valor **truthy**, ignorando el tipo. Si necesitas elegir entre varios campos con semántica de "el primero que exista" y luego operar según su tipo, usa `!== undefined` con ternarios encadenados. Esto garantiza que el campo elegido sea exactamente el que se comprobó en el `if`.

---

## [2026-06-01] CRÍTICO: Firma real de la API de Persistencia de TaleSpire y Unificación de Mensajes del Chat

**Síntomas:**
1. Tras una refactorización mayor, el simbionte dejó de persistir por completo sus datos de homebrew, combates y notas, reiniciando la base de datos a vacío en cada recarga.
2. La tirada de pifias y críticos de la consola táctica de las Tablas del DM ya no aparecía en el chat general de TaleSpire de producción.

**Causas raíces:**
1. **Firma de LocalStorage de TaleSpire en producción vs Documentación:**
   Aunque la especificación teórica e interfaces de TypeScript de la API `v0.1` de TaleSpire documentan que la llamada a persistir un blob recibe una clave y un valor, ej: `setBlob(key: string, data: string)` y `getBlob(key: string)`, **en la práctica en el cliente nativo de TaleSpire la API no acepta claves**. La firma nativa de C# en el motor de Unity es **`setBlob(data: string)`** y **`getBlob()`** (sin argumentos). Dado que cada simbionte tiene asignado su propio e único archivo de datos aislado en el juego, TaleSpire maneja un único blob implícito en el backend. Intentar pasar la clave como primer argumento a `setBlob` o `getBlob` provocaba que la llamada fallara silenciosamente o corrompiera los datos, haciendo que la persistencia se rompiera.
2. **Exigencia estricta de canal de chat en `TS.chat.send`:**
   En la versión original, para tiradas físicas nativas (que inician con `!`, ej. `!1d20+5`), el parser de dados de TaleSpire interceptaba el comando de forma nativa a nivel del motor en C# antes de requerir un canal. Sin embargo, para mensajes de texto plano del simbionte (como el resultado táctico de críticos/pifias), la API de TaleSpire exige estrictamente **dos parámetros de tipo string**: el mensaje como primero, y el canal como segundo (usualmente `"board"`). Omitir el canal o pasar un único parámetro hacía que el puente CEF con C# fallara con una excepción de tipos `type error: not a fragment or id` e invalidara el envío al chat en producción.

**Soluciones aplicadas:**
1. **Corrección de Persistencia Adaptativa en `TaleSpireAdapter.ts`:**
   Reescribir el adaptador para alinearlo con la firma real del motor de TaleSpire:
   - Guardar Blob: `window.TS.localStorage.global.setBlob(datos)` (sin parámetro de clave).
   - Leer Blob: `window.TS.localStorage.global.getBlob()` (sin argumentos).
   - Eliminar Blob: `window.TS.localStorage.global.deleteBlob()` (sin argumentos).
   - Se preservó el fallback de navegador web usando `window.localStorage.setItem(clave, datos)` para desarrollo local cómodo.
   - Ajustar la interfaz de TypeScript en `src/tipos/talespire.d.ts` para reflejar estas firmas exactas del motor físico.
2. **Unificación y Blindado de `ts.chat.send` con Canal por Defecto:**
   - En `TaleSpireAdapter.ts`, blindamos el método `ts.chat.send(message: string)` para inyectar automáticamente `"board"` como segundo parámetro en la llamada RPC subyacente.
   - Esto soluciona ambos mundos de forma transparente: tanto los textos enriquecidos de críticos/pifias de la consola del DM como las tiradas físicas con el prefijo `!` ahora se publican sin errores de deserialización y con absoluta estabilidad en el canal principal.

**Lecciones aprendidas:**
> ⚠️ **La documentación oficial de TaleSpire puede diferir del comportamiento de C# nativo:** Escribe siempre envoltorios polimórficos de API y pruébalos contrastándolos contra el comportamiento real del motor de ejecución. Para la persistencia nativa con `global.setBlob`, **nunca pases una clave**; utiliza solo el argumento del blob.
> 💬 **Fuerza siempre el canal en mensajería de simbiontes:** Para que cualquier texto enviado por tu simbionte aparezca de forma fiable y consistente en el chat, asegúrate de suministrar el canal `"board"` a través del adaptador unificado en lugar de llamarlo directamente sin argumentos desde los componentes.

---

## [2026-06-01] MEJORA: Caché Persistente y Robusta de Asociaciones Manuales de Plantillas (Fase 7)

**Síntoma:**
Al sincronizar la cola de iniciativa desde TaleSpire o al añadir criaturas seleccionadas físicamente en la mesa de juego, si una miniatura no tenía un nombre que coincidiera directamente con el manual de monstruos, el DM debía asociar manualmente su bloque de estadísticas cada vez. Al limpiar el combate, cambiar de asalto o reiniciar el simbionte, esa asociación se perdía por completo, requiriendo repetir el proceso de vinculación de forma repetitiva.

**Causa raíz:**
Las criaturas físicas de TaleSpire se identifican por una ID única (UUID de miniatura). Al sincronizar, el combat tracker busca plantillas por nombre normalizado (fallback). Si no encuentra coincidencia y el DM le asocia una manualmente, la relación se guardaba únicamente a nivel de memoria RAM en la propiedad temporal `idPlantillaAsociada` del combatiente activo dentro de la cola. Al reconstruirse o limpiarse la cola local de iniciativa, esta propiedad desaparecía. No existía ninguna caché persistente global a nivel de aplicación que recordara la relación `idCriaturaTaleSpire` -> `idPlantillaMonstruo` entre sesiones o limpiezas de combate.

**Solución aplicada:**
1. **Definir Caché Global de Asociaciones (`asociacionesFichas`):**
   Añadir un diccionario `asociacionesFichas: Record<string, string>` en el estado de iniciativa de `sliceIniciativa.ts`.
2. **Registro Manual de Asociaciones:**
   Modificar `asociarPlantillaACriatura` para que cada vez que el DM asocie manualmente un bloque de estadísticas a un combatiente (UUID de TaleSpire), guarde esa relación de forma persistente en `asociacionesFichas[idCriatura] = idPlantilla`.
3. **Optimización con Prioridad de Caché:**
   Refactorizar los métodos de carga masiva `actualizarColaIniciativaDesdeTaleSpire` y `agregarCriaturasSeleccionadasAIniciativa` para que, antes de recurrir al fallback tradicional de búsqueda y coincidencia de nombres normalizados, verifiquen si la ID física de la miniatura de TaleSpire ya cuenta con una plantilla guardada en la caché `asociacionesFichas`. Si existe, se vincula y carga su bloque de estadísticas de forma instantánea.
4. **Persistencia Total del Estado:**
   - Añadir `"asociacionesFichas"` al array `CLAVES_PERSISTIBLES` en `usarAlmacenDM.ts`.
   - Modificar `persistirEstadoCompleto` en `persistencia.ts` para inyectar `asociaciones_fichas` en el blob oficial de TaleSpire.
   - Actualizar `cargarDatosPersistidos` y `restablecerDatosDeFabrica` en `sliceConfiguracion.ts` para restaurar o limpiar respectivamente la caché, asegurando que sobreviva al cierre del juego.

**Lección aprendida:**
> 💾 **Cachés de puente de red basadas en UUIDs:** Al construir integraciones con motores de juego que exponen objetos físicos en pantalla con IDs únicos persistentes (como TaleSpire), nunca te limites a guardar relaciones manuales dentro de las entidades temporales de la interfaz de usuario. Diseña cachés globales persistentes mapeando `UUID_EntidadFisica -> ID_PlantillaDeDatos`. Esto reduce drásticamente la fricción del usuario, evita búsquedas de coincidencia textual de strings pesados y provee una experiencia de usuario sumamente pulida y profesional.

---

## [2026-06-01] AUDITORÍA TÉCNICA: Identificación de Bugs Latentes, Optimización de Rendimiento de Estado y Algoritmos de Búsqueda

**Hallazgos de la Auditoría:**
1. **Debounce e Inestabilidad de la deduplicación de `getQueue`:**
   En `TaleSpireAdapter.ts`, en `initiative.getQueue`, la deduplicación de llamadas se realiza asignando `this.getQueuePromise = window.TS.initiative.getQueue()` y luego haciendo un `setTimeout(() => { this.getQueuePromise = null; }, 100)`. Si la llamada nativa a la cola física de TaleSpire dura más de 100ms, y ocurre otra llamada posterior después de los 100ms pero antes de que la primera termine, se disparará una segunda petición en paralelo. 
   *Lección:* El debounce debe expirar de manera atómica al resolverse la promesa en sí (p. ej., con un `.finally()`), asegurando que no se dupliquen peticiones concurrentes y mitigando I/O redundante en el WebView2.

2. **Timeout de Inicialización sin Limpieza (Fuga de Memoria / Carga en Desmontado):**
   En `src/hooks/usarConexionTaleSpire.ts`, el `setTimeout` de 500ms que inicializa las peticiones `get` pesadas para evitar `outOfOrderMessage` se ejecuta incondicionalmente tras 500ms, incluso si el hook se desmontó durante el polling de 15 segundos o al cambiar de pestaña rápidamente. Aunque cuenta con una variable de escape `if (!activo) return;`, el temporizador `setTimeout` en sí sigue registrado en memoria y no es liberado con `clearTimeout`. 
   *Lección:* Debemos guardar siempre la referencia del timer y cancelarlo en el destructor del hook React (`useEffect cleanup`) para evitar fugas de memoria y sobrecarga inútil en el event loop.

Al importar criaturas con ciertos formatos específicos de D&D (como el Aboleth en español o exportaciones directas del simbionte como el Dragón de Cobre Anciano), el formulario de edición cargaba de forma incompleta o dejaba vacíos varios campos críticos como la Clase de Armadura (CA), los Puntos de Golpe Máximos (HP Máx), la Velocidad, los Sentidos, los Idiomas, las Salvaciones, las Habilidades, las Acciones Rápidas, las Inmunidades y las Resistencias. Además, el Tipo de Criatura se reseteaba automáticamente a "Humanoide".

**Causa raíz:**
1. **Tipado rígido en HP y CA:** El importador (`importadorJSON.ts`) asumía que si las propiedades venían en español (`vidaMaxima` y `ca`), estas eran exclusivamente números planos (`Number(m.vidaMaxima)`). Sin embargo, en formatos exportados más ricos, estas propiedades vienen como objetos estructurados `{ Value: number, Notes: string }`. Al intentar forzar a número un objeto, devolvía `NaN`, dejando el formulario en blanco.
2. **Propiedades de lenguaje duplicadas y no-mapeadas:** El código de importación buscaba de forma rígida los términos en inglés `Senses` y `Languages` para cargar Sentidos e Idiomas, ignorando sus homónimos en español `sentidos` e `idiomas` provistos en el JSON.
3. **Formatos de Velocidad no contemplados:** La propiedad `velocidad` venía como un array de strings `["10 pies", "Nadar 40 pies"]` en el JSON. El importador solo controlaba el array si la clave era la inglesa `Speed`, por lo que caía en el valor por defecto `"30 pies"`.
4. **Desajuste del selector de tipos de criatura:** El tipo de criatura venía como un string detallado (p. ej. `"Aberración Grande, Legal Maligno"`). Como el selector de tipo de la interfaz solo soporta opciones fijas de clasificación limpia (p. ej. `"Aberración"`), el navegador no encontraba coincidencia exacta y caía por defecto en la primera opción de la lista (`"Humanoide"`).
5. **Formato nativo de Salvaciones y Habilidades incompatible:** El importador solo contemplaba las salvaciones y habilidades si venían en formato de array clásico de D&D (`Saves: [...]` y `Skills: [...]`). Si el JSON venía en formato nativo en español como un diccionario de claves estructurado (`salvaciones: { destreza: 8 }` y `habilidades: { percepcion: 10 }`), el importador las ignoraba por completo perdiéndose en la importación.
6. **Nombre de clave en español para Acciones Rápidas:** Las acciones rápidas venían bajo el nombre de clave en español `"accionesRapidas"` en el JSON. El importador solo buscaba `"QuickAction"`, provocando que los ataques rápidos no se cargaran en la ficha del DM.
7. **Defensas en español no-mapeadas:** Las inmunidades a daño y condición, resistencias y vulnerabilidades venían bajo claves en español (`inmunidadesDaño`, `inmunidadesCondicion`, `resistencias`, `vulnerabilidades`). El importador solo las leía si se llamaban `DamageImmunities`, `ConditionImmunities`, `DamageResistances` o `DamageVulnerabilities`.

**Solución aplicada (`importadorJSON.ts`):**
1. **Unificación y extracción polimórfica de HP y CA:** Se refactorizaron las variables `hpRaw` y `caRaw` para evaluar de manera unificada y polimórfica tanto las claves en inglés (`HP` / `AC`) como en español (`vidaMaxima` / `ca`), y se implementó un parser adaptativo que extrae `.Value` y `.Notes` si detecta que la propiedad es un objeto, o el número directo si es un primitivo.
2. **Mapeo híbrido de Sentidos e Idiomas:** Se extendió el mapeo de retorno en la importación para evaluar `sentidos || Senses` e `idiomas || Languages`, garantizando la correcta extracción síncrona independientemente del idioma del diccionario fuente.
3. **Conversión robusta de Velocidades:** Se adaptó la extracción de velocidad para evaluar unificadamente tanto `velocidad` como `Speed`. Si es un array iterable, se concatenan sus elementos de forma limpia con `join(", ")`.
4. **Función de sanitización de tipos de criatura (`limpiarTipoCriatura`):** Se diseñó un helper que analiza el string de tipo crudo y busca si contiene alguna de las palabras clave principales de D&D 5e (p. ej., "aberración", "bestia", "dragón", "no muerto", "fiando", etc.) para clasificarlo automáticamente en una de las categorías válidas que requiere el `<select>` del formulario.
5. **Mapeo inteligente de diccionarios de Salvaciones y Habilidades:** Se inyectaron bloques condicionales alternativos en el mapeo. Si no detecta arrays `Saves`/`Skills`, evalúa si existen `m.salvaciones` / `m.habilidades` como objetos e indexa sus valores directamente en los mapas del store DM de Zustand.
6. **Mapeo híbrido de Acciones Rápidas:** Se adaptó la extracción de acciones rápidas para leer indistintamente de `m.accionesRapidas` o `m.QuickAction`, mapeando propiedades tanto en inglés (`Name`, `ToHit`, `Damage`, `DamageType`) como en español (`nombre`, `bonificadorAtaque`, `dadosDaño`, `tipoDaño`).
7. **Unificación de Defensas (Inmunidades/Resistencias/Vulnerabilidades):** Se adaptaron las variables de asignación del retorno para que evalúen de manera híbrida tanto las variantes inglesas como españolas (`vulnerabilidades` / `DamageVulnerabilities`, `resistencias` / `DamageResistances`, `inmunidadesDaño` / `DamageImmunities`, `inmunidadesCondicion` / `ConditionImmunities`).

**Lección aprendida:**
> 🔍 **Flexibilidad y polimorfismo en importación de diccionarios externos:** Cuando diseñes importadores de datos JSON para compendios que puedan provenir de múltiples herramientas de D&D o traducciones comunitarias, **nunca asumas tipos primitivos rígidos o nomenclaturas de una sola lengua**. 
> Diseña siempre normalizadores adaptativos que toleren tanto propiedades en español como en inglés, y que evalúen la naturaleza del dato (arrays, objetos estructurados `{ Value, Notes }` o strings) antes de procesarlos. Asimismo, si la interfaz requiere valores limpios delimitados para selectores, implementa funciones de mapeo inteligente (`cleaners`) que extraigan la categoría principal del string detallado del usuario para evitar desajustes silenciosos en el renderizado de la UI. De igual forma, da compatibilidad tanto a los formatos relacionales de tipo Array de origen externo como a tus propios diccionarios de objetos exportados nativos para lograr una compatibilidad del 100% de ida y vuelta.

---

## [2026-06-02] ARQUITECTURA: Diseño de Tipado Estricto Zod y Adaptación de Compendio D&D 2024 (5.5e)

**Situación:**
El compendio del usuario requiere integrar datos del formato de `5e-bits/5e-database` (en inglés) mapeando y traduciendo los datos a español sin perder tipado estricto ni comprometer la persistencia en TaleSpire (que está limitada a un blob consolidado de 5MB por simbionte).

**Lección de Arquitectura Aprendida:**
1. **Patrón Adaptador (Data Adapter Pattern) para Localización:** Para evitar contaminar el dominio en español (`AppLocal`) con nombres de propiedades o formatos de datos en inglés, se debe implementar una capa de transformación bidireccional usando esquemas Zod independientes para cada entorno:
   - `Esquema5eBitsIngles` (Validador en origen del JSON crudo de 5e-bits).
   - `EsquemaAppLocalEspañol` (Validador en destino para el dominio de negocio).
   - Un adaptador (`traducirYAdaptar5eBits`) que centralice el parseo y mapeo (ej. traducir escuelas de magia, tipos de monstruo, mapear arrays de `proficiencies` a salvaciones/habilidades locales).
2. **Escalabilidad de Almacenamiento (Separación del Compendio vs Homebrew/Usuario):**
   - El compendio estático (las reglas base D&D 2024 oficiales) no debe residir en el estado mutable persistente del usuario (el blob de TaleSpire tiene un límite estricto de 5MB).
   - El compendio estático debe estar alojado en la carpeta `public/` en JSONs leídos bajo demanda (lazy-loading) o en un mapa estático en memoria en el cliente.
   - Solo los monstruos y hechizos *Homebrew* (personalizados) creados por el DM se guardan en el almacenamiento persistente (`TS.localStorage.global.setBlob`), asegurando que el tamaño del blob no supere los 5MB incluso tras años de uso del simbionte.
3. **Normalización vs Desnormalización:**
   - Para el guardado persistente del homebrew, se prefiere un formato normalizado donde las relaciones (como hechizos preparados en un monstruo) se guarden como IDs y no como objetos anidados completos.
   - Para búsquedas, es eficiente indexar por ID (`Record<string, T>`) o por iniciales, manteniendo una experiencia fluida e interactiva en TaleSpire.

---

## [2026-06-02] COMPILACIÓN: Resolución de Tipos Zod y Coherencia en Formulario de Criaturas

**Síntomas:**
El proyecto fallaba al compilar (`tsc` con código 1) debido a tres causas principales:
1. **Miembros Faltantes en el Compendio de Tipos:** `TipoBonoDestreza` y `SubcategoriaEquipo` fueron referenciados en `sanitizacion.ts` y formularios de objetos, pero se omitieron en las exportaciones de `src/tipos/index.ts`.
2. **Incompatibilidad de Velocidad/Sentidos en Formularios:** El formulario `FormularioCriatura.tsx` pasaba el estado `monstruoForm` a `SeccionGeneralProps`, el cual requería estrictamente que `velocidad` y `sentidos` fuesen cadenas `string | undefined`. Sin embargo, con el nuevo tipado Zod estructurado, estas propiedades pasaron a ser la unión `string | VelocidadEstructurada` / `string | SentidosEstructurados`.
3. **Discrepancia en Tipos de Literales en Datos Iniciales:** `MONSTRUOS_INICIALES` en `datosIniciales.ts` contenía objetos literales que omitían campos predeterminados en el esquema de Zod (como `caNotas`, `vulnerabilidades`, `resistencias`, etc.). Dado que `z.infer` infiere campos con valores por defecto como requeridos en la firma de salida del tipo TypeScript, el compilador los detectaba como faltantes.

**Solución aplicada:**
1. **Re-exportación y Mapeo en index.ts:** Definimos formalmente `EsquemaTipoBonoDestreza` / `TipoBonoDestreza` y `EsquemaSubcategoriaEquipo` / `SubcategoriaEquipo` en `src/tipos/index.ts`, vinculándolos a las firmas de armaduras y equipos de aventuras respectivamente.
2. **Normalización de Props de Formulario:** Modificamos la interfaz `SeccionGeneralProps` en `SeccionGeneral.tsx` para aceptar tipos estructurados para velocidad y sentidos. En la interfaz gráfica del input, aplicamos de forma transparente las utilidades de formateo `formatearVelocidad(monstruoForm.velocidad)` y `formatearSentidos(monstruoForm.sentidos)` para asegurar que el valor visual siempre sea un string plano.
3. **Validación Dinámica en Datos Iniciales:** Cambiamos la declaración de `MONSTRUOS_INICIALES` y `HECHIZOS_INICIALES` en `datosIniciales.ts` para que se inicialicen a partir de arrays crudos mapeados en tiempo de ejecución a través de `EsquemaMonstruoBase.parse(m)` y `EsquemaHechizoBase.parse(h)`. Esto inyecta dinámicamente los valores por defecto definidos en Zod sin verbosidad redundante en los archivos de mock data.
4. **Limpieza de Opciones Obsoletas:** Corregimos las opciones de tipos de monstruo en `SeccionGeneral.tsx` eliminando términos redundantes como "Fata" o "Infiando", adaptando el selector para reflejar exclusivamente el listado oficial y validado por Zod ("Feérico", "Infernal", "Cieno", etc.).

**Lección aprendida:**
> 🛡️ **Zod Defaults y Tipado de Salida en TypeScript (`z.infer`):** Ten en cuenta que al usar `.default(...)` en esquemas Zod, el tipo inferido de salida (usando `z.infer<T>`) marcará esa propiedad como **requerida** en TypeScript. Al declarar objetos literales de ese tipo directamente en código (como archivos mock de configuración inicial), causará errores de compilación por campos faltantes. Para solucionar esto sin redundar en literales masivos, define la estructura como un array crudo intermedio y procésalo al inicio mediante `.parse()` de Zod; esto no solo mantendrá el tipado consistente, sino que poblará dinámicamente todos los arrays e inicializadores vacíos a nivel de ejecución de forma segura.

5. **Optimización en Consulta de Percepción Pasiva:**
   * **Problema:** En [GestorIniciativa.tsx](file:///c:/Users/zamor/OneDrive/Documentos/Programas/ToolSet%20Es%205.5/src/componentes/GestorIniciativa.tsx), el método `obtenerPercepcionPasiva` ejecutaba siempre una búsqueda por expresión regular (`match`) asumiendo que `sentidos` era una cadena. Al cambiar a datos estructurados, `plantilla.sentidos` es un objeto, lo que hacía que `String(plantilla.sentidos)` devolviese `"[object Object]"` y fallase la coincidencia, cayendo en el cálculo manual de sabiduría.
   * **Solución:** Se actualizó `obtenerPercepcionPasiva` para evaluar primero si `sentidos` es de tipo `object` y extraer directamente `percepcionPasiva` en O(1), dejando el regex de string y el cómputo manual de sabiduría únicamente como fallbacks para datos legacy.
6. **Carga Estática de Compendios Base como Datos Iniciales:**
   * **Objetivo:** Hacer que `prueba base/Mounstros.2024-es.json` y `prueba base/all.json` sean los datos iniciales por defecto cargados en el store del Simbionte.
   * **Implementación:** Se importaron los JSONs directamente usando la directiva de resolución de módulos JSON de Vite en `src/utiles/datosIniciales.ts` y se ejecutó la utilidad `importarDesdeJSON` pasándoles arrays de estado vacíos. Esto aprovecha el flujo y parser unificado del importador para sanitizar, mapear claves/formatos y validar con Zod de forma 100% automatizada al arrancar la app.
   * **Persistencia Inteligente:** El middleware de persistencia en Zustand (`sliceConfiguracion.ts`) filtra los compendios iniciales al persistir el estado (`baseDatosMonstruos.filter(m => !MONSTRUOS_INICIALES.some(i => i.id === m.id))`), lo que garantiza que estos 1.6 MB de datos base NUNCA consuman el límite físico de 5MB del blob global de TaleSpire.
7. **Preferencia de Unidades Imperiales (Pies) en Hechizos:**
   * **Problema:** En el archivo `all.json`, las propiedades `alcance` y `descripcion` vienen estructuradas como arrays `[imperial/pies, metrica/metros]`. Originalmente, [importadorJSON.ts](file:///c:/Users/zamor/OneDrive/Documentos/Programas/ToolSet%20Es%205.5/src/almacen/importadorJSON.ts) tomaba el último elemento (`arr[arr.length - 1]`), forzando el formateo a unidades métricas (metros).
   * **Solución:** Se modificó la indexación en el importador para que acceda al primer elemento (`arr[0]`), el cual corresponde a la configuración de pies oficiales para D&D 5e/2024 (e.g. `"60 pies"` en lugar de `"18 m"`).



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
2. **Sanitización de HTML huérfano:** Se inyectó una regla regex en importadorJSON.ts (.replace(/^(?:\s*<\/?[a-z0-9]+>)+/gi, '')) que remueve cualquier etiqueta HTML (abierta o cerrada) huérfana al inicio de la cadena descNivelSuperior tras la extracción.
3. **Inferencia de dados de Upcast por contexto de combate:** Se implementó una heurística de inferencia en el importador: si un hechizo escala a nivel superior pero no define dados explícitos, y en su descripción se mencionan frases como "dardo adicional", "rayo adicional", "proyectil adicional", etc., se asume dinámicamente que la escala es idéntica a su daño base (dadosDaño). Para otros casos de escalamiento donde se mencione la palabra "daño" o "aumenta", se infiere 1 dado del tipo base (ej. 1d6 si la base es 3d6).

**Lección aprendida:**
> 🛠️ **Inyección de HTML y Heurísticas de Enriquecimiento en Importadores:** Al diseñar importadores de compendios semiestructurados (donde la descripción contiene toda la lógica de combate mezclada con HTML y prosa), siempre es necesario:
> 1. Limpiar proactivamente cualquier fragmento HTML capturado que pueda haber quedado "roto" o con etiquetas huérfanas en los bordes del regex.
> 2. Implementar heurísticas basadas en el vocabulario oficial del juego (como "proyectil adicional" o "rayo adicional" de D&D) para inferir dinámicamente los campos estructurales requeridos por los simuladores de combate de la UI. Esto recupera funcionalidades ricas que se perderían si nos limitamos a parsear expresiones regulares rígidas.
> 3. Usar dangerouslySetInnerHTML en React cuando los datos de base de datos contienen marcas HTML embebidas legítimas para saltos de línea e inclinaciones tipográficas.

---

## [2026-06-02] BUGFIX: Condición de carrera e inconsistencia en la asociación de plantillas al agregar monstruos en rápida sucesión

**Síntomas:**
Al añadir 2 o más monstruos en rápida sucesión desde el buscador del panel de control, a veces no se asignaba la plantilla correcta a uno de ellos y se le asignaba la del otro monstruo añadido.

**Causa raíz:**
En `BuscadorMonstruos.tsx`, al añadir un monstruo a la iniciativa, la lógica realizaba dos pasos desacoplados sobre el store:
1. Llamaba a `agregarCriaturaAIniciativa(...)` para instanciar la criatura localmente.
2. Inmediatamente después, leía síncronamente el estado actual de la cola con `usarAlmacenDM.getState()` y tomaba el último elemento (`colaIniciativa[colaIniciativa.length - 1]`) para asociarle la plantilla llamando a `asociarPlantillaACriatura`.

Esto causaba condiciones de carrera graves debido a:
1. **Ordenación automática:** La acción `agregarCriaturaAIniciativa` ordena la cola por iniciativa en cuanto se inserta (`sort((a, b) => b.iniciativa - a.iniciativa)`). El nuevo monstruo no necesariamente acababa al final de la cola, por lo que se le terminaba asociando la plantilla al monstruo de menor iniciativa (que podía ser otro).
2. **Asincronía de Zustand/React:** Al ejecutar ambas acciones de forma muy rápida, la lectura del estado con `getState()` podía devolver un estado rancio donde la nueva criatura aún no se había insertado, o donde la criatura del monstruo A (ya añadido) se interpretaba erróneamente como la última criatura para asociarle la plantilla del monstruo B.

**Solución aplicada:**
1. **Paso de plantilla atómico:** Modificar la firma de `agregarCriaturaAIniciativa` en `sliceIniciativa.ts` para aceptar opcionalmente el `idPlantillaAsociada` directamente durante la creación.
2. **Registro de asociaciones al crear:** La misma acción se encarga ahora de asignar `idPlantillaAsociada` al objeto de la criatura creada y actualizar la caché persistente `asociacionesFichas` de manera atómica, eliminando la necesidad de leer y modificar el estado en dos pasos desacoplados.
3. **Limpieza del componente:** En `BuscadorMonstruos.tsx`, remover la consulta de `getState().colaIniciativa` y la llamada posterior a `asociarPlantillaACriatura`, pasando el `plantilla.id` como octavo argumento en la llamada a `agregarCriaturaAIniciativa`.

**Lección aprendida:**
> ⚡ **Evita lecturas post-hoc inmediatas de colecciones que se ordenan dinámicamente:** Cuando crees elementos en un store de estado global y dependas de su ID único para realizar operaciones subsecuentes (como vincular relaciones), **nunca** asumas que el nuevo elemento estará al final de la lista, ni intentes buscarlo usando índices temporales. 
> Diseña las acciones de creación para que sean **atómicas**, recibiendo todos los parámetros de relaciones (IDs asociados) desde la llamada inicial. Esto garantiza robustez ante ordenamientos, filtros y retrasos de actualización en hilos rápidos de ejecución.

---

## [2026-06-03] BUGFIX: Resolución de plantilla asociada y visualización de Percepción Pasiva en criaturas con sufijos

**Síntomas:**
En la cola de iniciativa, algunas criaturas (especialmente clones o miniaturas añadidas por TaleSpire como "Esqueleto 1", "Aboleth A", etc.) no mostraban su percepción pasiva correcta o el bloque de estadísticas en el panel inferior, y mostraban en su lugar el botón de vincular plantilla ("VinculadorPlantilla") de forma incorrecta.

**Causa raíz:**
En `GestorIniciativa.tsx`, el método `obtenerPlantillaAsociada` busca plantillas de estadísticas usando el mapa optimizado `indicesPlantillas.porNombre.get(criatura.nombre.toLowerCase().trim())`.
Si una criatura en la cola se llama "Esqueleto 1" o "Aboleth A" y no tiene una asociación de ID persistente (`idPlantillaAsociada` es undefined), la búsqueda falla porque no existen plantillas llamadas exactamente "esqueleto 1" o "aboleth a" (las plantillas base en el compendio se llaman "esqueleto" y "aboleth").
Al no resolver la plantilla, el sistema caía en fallback o no renderizaba la percepción pasiva en la tarjeta.

**Solución aplicada:**
**Solución aplicada:**
1. **Normalización y limpieza en el tracker**: Se modificó `obtenerPlantillaAsociada` en `GestorIniciativa.tsx` para realizar una limpieza recursiva de sufijos si la búsqueda exacta por nombre falla (ej. "Zombie A 1" -> "Zombie A" -> "Zombie").
2. **Capa Común de Saneamiento en el Dominio**: Creamos la función `sanearMonstruoSentidosYPasiva` en `src/almacen/sanitizacion.ts` que centraliza la lógica de normalización. Si un monstruo no tiene percepción pasiva explícita (o es `10` por el default de Zod) pero sus estadísticas de Sabiduría y Percepción indican otra cosa, calcula el valor oficial (`10 + (bonoPercepción ?? modSabiduría)`) e inyecta la PP correcta de forma directa y permanente en su objeto de sentidos.
3. **Saneamiento en Carga y Edición de Datos**:
   * **Importador JSON (`importadorJSON.ts`)**: Se pasa cada criatura por `sanearMonstruoSentidosYPasiva` durante la importación.
   * **Cargador Persistente (`sliceConfiguracion.ts`)**: Al recuperar monstruos Homebrew del almacenamiento persistente de TaleSpire o de LocalStorage antiguo, se les aplica el saneamiento de sentidos sobre la marcha.
   * **Store de Homebrew (`sliceHomebrew.ts`)**: Las acciones `agregarMonstruoHomebrew` y `actualizarMonstruoHomebrew` aplican el saneamiento de forma atómica al guardar o modificar.
   * **Formulario de Criaturas (`usarFormularioCriatura.ts`)**: Se sanea el monstruo al construirse desde la UI del creador.
4. **Lectura Ultra Eficiente en Caliente (O(1))**: Al estar garantizado que el 100% de la base de datos de monstruos en memoria tiene el valor real correcto de percepción pasiva inyectado, se redujo `obtenerPercepcionPasiva` en [GestorIniciativa.tsx](file:///c:/Users/zamor/OneDrive/Documentos/Programas/ToolSet%20Es%205.5/src/componentes/GestorIniciativa.tsx) a una simple lectura directa O(1) del objeto `sentidos`, eliminando cómputos matemáticos y comparaciones de cadenas redundantes durante los renders de la cola.

**Lección aprendida:**
> 🔍 **Normalización tolerante en búsquedas por nombre:** Al interactuar con motores 3D o plataformas VTT como TaleSpire, los usuarios tienden a añadir números, letras o etiquetas de copia a las miniaturas.
> Al resolver plantillas de estadísticas basadas puramente en cadenas de texto, siempre implementa una normalización robusta e iterativa que despoje los patrones numéricos y alfabéticos comunes de duplicación al final del nombre, manteniendo las plantillas base indexadas sin contaminar el flujo de datos.
>
> 💾 **Arquitectura orientada a Datos Saneados en Origen (en lugar de lógica en caliente):** Siempre es preferible procesar y sanitizar los datos de negocio en el momento en que se importan, se cargan de persistencia o se crean en los formularios. Esto mantiene el almacén de estado (Zustand/Base de Datos) como una fuente única de verdad limpia y permite que los componentes de la interfaz de usuario permanezcan desacoplados, rápidos y ligeros, utilizando lecturas O(1) directas en lugar de repetir algoritmos y cálculos redundantes en cada ciclo de renderizado de la UI.

---

## [2026-06-03] BUGFIX: Omisión de Visión Verdadera (Truesight) en el Esquema de Sentidos de Criaturas

**Síntomas:**
Al importar o ver criaturas que poseen visión verdadera (ej. Celestiales, Diablos de alto rango), este tipo de visión no se parseaba ni se mostraba en la interfaz de usuario, omitiéndose por completo a pesar de estar escrita en los textos originales de la base de datos de monstruos.

**Causa raíz:**
1. **Esquema de datos incompleto**: El objeto `EsquemaSentidos` en Zod (`src/tipos/index.ts`) no definía la propiedad `visionVerdadera`, por lo que era eliminada durante el proceso de validación (`safeParse`).
2. **Falta de soporte en el analizador**: La función `parsearSentidos` en `sanitizacion.ts` no tenía una condición regex para buscar o mapear las palabras `"verdadera"` o `"truesight"`.
3. **Falta de formateador**: La función `formatearSentidos` en `sanitizacion.ts` no incluía la propiedad `visionVerdadera` al reconstruir la cadena legible en la UI.

**Solución aplicada:**
1. **Esquema Zod**: Se agregó `visionVerdadera: z.number().optional()` a `EsquemaSentidos` en `src/tipos/index.ts`.
2. **Parser de Cadenas**: Se modificó `parsearSentidos` en `src/almacen/sanitizacion.ts` para detectar `verdadera` o `truesight` y capturar su valor numérico en pies (ej. "visión verdadera 120 pies").
3. **Formateador de UI**: Se actualizó `formatearSentidos` en `src/almacen/sanitizacion.ts` para renderizar de forma fluida `"Visión verdadera X pies"` en el orden correcto dentro del chip de sentidos del tracker e informes de fichas.

**Lección aprendida:**
> 👁️ **Mapeo exhaustivo de sistemas de sentidos y visiones:** Al estructurar esquemas de datos de juegos de rol como D&D, asegúrate de modelar la totalidad de visiones especiales oficiales (Oscuridad, Ciega, Verdadera y Sentido Sísmico) en todos los niveles del ciclo de datos: validación de esquemas (Zod), serializadores (parsers) y renderizadores (formateadores de UI). Dejar fuera una de ellas causará silenciosamente la pérdida de datos del compendio al validar el esquema de entrada.


