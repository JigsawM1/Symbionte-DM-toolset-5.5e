# 🧠 Aprendizajes y Directrices del Proyecto: Symbiote "ToolSet Es 5.5"

Este archivo sirve como bitácora de aprendizaje técnico y memoria permanente para evitar repetir fallos de configuración, despliegue o visualización en este entorno de TaleSpire.

---

## 🚀 1. Arquitectura de Despliegue y Rutas (VITAL)

*   **Doble Entorno**: 
    *   El **código fuente** (desarrollo activo) vive en:  
        `C:\Users\zamor\.gemini\antigravity\worktrees\ToolSet Es 5.5\setup-symbiote-agent-workflow`
    *   La **salida compilada** (distribución que ejecuta TaleSpire) vive en:  
        `C:\Users\zamor\AppData\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\ToolSet Es 5.5`
*   **Configuración del Destino (`build_folder_name.json`)**:
    *   Este archivo define la carpeta de salida en TaleSpire. Debe estar configurado **siempre** como:
        ```json
        {
          "buildFolder": "ToolSet Es 5.5"
        }
        ```
        *(Previamente estaba en `"my-symbiote-folder-name"`, lo que provocaba que los cambios compilados se copiaran en una carpeta errónea que TaleSpire ignoraba).*

---

## 🛠️ 2. Tolerancia a Bloqueos de Archivos en Windows (EBUSY)

*   **El Problema**: Al compilar y correr `pnpm run deploy`, el script intentaba realizar una eliminación total de la carpeta raíz de TaleSpire (`fs.rmdirSync`), lo cual fallaba sistemáticamente con un error `EBUSY` (Resource locked) si TaleSpire o el Explorador de Windows tenían abierta dicha carpeta.
*   **La Solución**: Modificar el script de despliegue (`deploy_to_ts.js`) para que no elimine el directorio raíz en sí. En su lugar, el script recorre el directorio e intenta limpiar sus archivos internos de forma segura (`fs.unlinkSync`), prosiguiendo con la copia aun si alguna carpeta de soporte menor no pudo ser borrada inmediatamente.

---

## 🎲 3. Gramática de Tiradas de Dados y Fallbacks de la API

*   **Fórmulas Multi-grupo**:
    *   Para lanzar múltiples dados a la vez y mantener sus etiquetas físicas visibles en la bandeja 3D de TaleSpire (ej. un d20 de ataque y dados de daño a la vez), el motor del juego requiere concatenar los subgrupos mediante el operador **`+`** (ej. `Ataque:1d20+5+Dano:2d6+4`).
    *   **NO usar la barra `/`** en la fórmula final enviada a `TS.dice.makeRollDescriptors` o `TS.dice.putDiceInTray`. La barra `/` debe utilizarse **exclusivamente como delimitador lógico interno** del código para procesamiento y traducción (ej. ventaja/desventaja), convirtiéndola en `+` antes de la entrega formal a la API del juego.
*   **Canal de Chat Físico y Exclamaciones**:
    *   Al recurrir al canal de chat de fallback (`window.TS.chat.send`) para tiradas 3D nativas, TaleSpire requiere estrictamente que **únicamente el inicio** del mensaje comience con el carácter exclamación `!` (ej. `!Ataque:1d20+3/Daño:1d6+1`).
    *   Cualquier exclamación intermedia en subgrupos (ej. `/!Daño`) hará que el parser de TaleSpire falle silenciosamente y no lance dados físicos. Hemos blindado `lanzarDadosPorChatTaleSpire` para sanitizar automáticamente todas las fórmulas y asegurar que contengan un único `!` al inicio.
*   **Fallo de `TS.dice.makeRollDescriptors`**:
    *   **El Problema**: En ciertas versiones de TaleSpire (o debido a variaciones en la inicialización de su Chromium embebido), la función `makeRollDescriptors` no se encuentra expuesta en `window.TS.dice`, arrojando un error `TypeError: m.makeRollDescriptors is not a function` que bloquea la tirada.
    *   **La Solución**: Implementar una función de fallback local en el Simbionte (`crearDescriptoresManualmente`) que parsee la fórmula lógica y construya directamente el array de objetos `{ name, roll }` que `putDiceInTray` requiere, eludiendo la llamada nativa rota. Esto garantiza robustez total en cualquier versión del juego.

---

## 🎨 4. Directrices de UI/UX en Overlays de TaleSpire

*   **Mínimo de Fuente y Espaciado**:
    *   Dado que el cliente web embebido de TaleSpire se renderiza en pantallas de escala variable (y a menudo reducida), el tamaño mínimo absoluto de fuente para textos informativos, botones y inputs en el Combat Tracker y la ficha detallada debe ser de **`12px`** (preferiblemente `13px` o `14px` para cabeceras y valores clave).
    *   Los paddings y gaps de las tarjetas de iniciativa deben ser generosos (`padding: 8px 12px` y `gap: 10px`) para evitar la sensación de aglomeración visual ("que no esté todo tan pegado").
*   **Rendimiento Táctico**:
    *   Mantener la regla de **0 animaciones o transiciones suaves** (`transition: none`). Los cambios deben ser inmediatos y fluidos para evitar el cuello de botella gráfico del motor de TaleSpire.

---

## 🔍 5. Auditoría Técnica — Hallazgos Permanentes (Mayo 2026)

*   **Stack Real**: Vite 5.3 + React 18.3 + Zustand 4.5 + CSS Modules (NO Next.js, NO Tailwind, NO TanStack Query).
*   **Tipado**: El proyecto tiene 100+ usos de `any` y 27+ de `as any`. Los slices de Zustand usan `(set: any, get: any)` lo cual anula la type-safety. Se debe crear un tipo `TaleSpireAPI` en `src/tipos/` para tipar `window.TS`.
*   **Rendimiento React**: 0 `React.memo`, 0 `useCallback`, 0 `React.lazy/Suspense`. Solo `ListaHechizos.tsx` usa `useMemo`. Cualquier nuevo componente DEBE considerar memoización.
*   **Componentes Monolíticos**: `FormularioCriatura.tsx` (41KB), `ListaHomebrew.tsx` (23KB) y `TarjetaCriaturaIniciativa.tsx` (19KB) necesitan descomposición en subcomponentes.
*   **Console.log**: 50+ logs de debug en producción. Se debe crear un logger centralizado con niveles (debug/info/warn/error) que se desactive en producción.
*   **ESLint**: El `.eslintrc.cjs` no usa `@typescript-eslint/parser`, por lo que reglas de TypeScript como `no-explicit-any` NO se aplican.

---

## 🛠️ 6. Fase 2 de Refactorización — Logros y Soluciones Aplicadas (Mayo 2026)

*   **Resolución de Dependencias Circulares de Zustand**:
    *   *Error potencial*: Los slices importan `EstadoDM` desde el orquestador `usarAlmacenDM.ts`, el cual a su vez importa los slices y sus creadores. Esto puede derivar en un bloqueo circular en compiladores de bundler a nivel de ejecución.
    *   *Solución*: Se usó la sintaxis estricta de importación exclusiva de tipo: `import type { EstadoDM } from '../usarAlmacenDM'`. Al ser exclusivo de tipo, el transpilador elimina la importación por completo a nivel de JavaScript en runtime, erradicando al 100% el acoplamiento circular.
*   **Declaración de Tipos de Window Global y TaleSpire API**:
    *   *Error previo*: Para evitar que TypeScript fallara indicando que la propiedad `TS` no existía dentro del objeto estandarizado `window`, se abusaba del casteo `(window as any).TS` o se usaba un alias `windowAlias`.
    *   *Solución*: Se creó una declaración global en `src/tipos/talespire.d.ts` que extiende la interfaz de `Window` y añade `TS` con la firma formal `TaleSpireAPI`. Gracias a esto, todo el código accede directamente a `window.TS` con autocompletado y validación de tipos nativa.
*   **Normalización de Tipos Booleanos del Dominio**:
    *   *Error*: Campos clave en D&D 5.5e como `concentracion` y `ritual` estaban tipados de manera ambigua (`string | boolean`). Esto causaba que los hooks y componentes tuvieran que hacer comparaciones manuales de texto contra `"Sí"`, `"Si"` o `"true"`, lanzando advertencias fatales del compilador.
    *   *Solución*: Se unificó a un tipo estricto `boolean | undefined`. Todos los componentes redujeron sus condicionales de renderizado a evaluaciones de verdad simples `{hechizo.concentracion && ...}`.
*   **Bypass de Acciones de Estado**:
    *   *Error*: Componentes y oyentes de red CEF hacían llamadas directas a `usarAlmacenDM.setState` para mutar la iniciativa de monstruos (`BarraControl.tsx`) o la información de la campaña (`usarConexionTaleSpire.ts`), rompiendo el flujo unidireccional y la persistencia de datos.
    *   *Solución*: Se crearon las acciones formales e integradas `autoLanzarIniciativaMonstruos` (en `sliceIniciativa.ts`) y `establecerDatosCampaña` (en `sliceConfiguracion.ts`), encapsulando la lógica de mutación y ordenamiento dentro del propio store y persistiendo el estado automáticamente en el blob de TaleSpire.
*   **Desactivación Absoluta de Animaciones**:
    *   *Error*: Las transiciones CSS generaban picos gráficos (reflows) de lag dentro del contenedor Chromium WebView2 integrado en TaleSpire.
    *   *Solución*: Se introdujo un reset general drástico en `src/index.css`:
        ```css
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
        }
        ```
        Esto garantiza un consumo de GPU del 0% en transiciones, resultando en respuestas tácticas inmediatas en la mesa virtual de juego.

---

## ⚔️ 7. Propiedades de Arma y Tooltips (Mayo 2026)

*   **Propiedades Oficiales del PHB 2024 (D&D 5.5e)**:
    *   Las propiedades de arma válidas son: Ammunition, Finesse, Heavy, Light, Loading, Reach, Thrown, Two-Handed, Versatile, y Special.
    *   **"Silvered/Plateada" NO es una propiedad de arma** según el PHB 2024. Es una modificación del equipo (cuesta 100 PO extra). Se eliminó de la lista de propiedades del formulario.
    *   Las **Maestrías** oficiales son: Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex. Solo se pueden usar con una feature que las desbloquee (como Weapon Mastery).
*   **Tooltips con CSS puro**:
    *   Se usa un patrón `.tooltipContenedor:hover > .tooltipFlotante { display: flex }` para mostrar tooltips al hover.
    *   Dado que el reset global de `index.css` desactiva animaciones (`animation: none !important`), los tooltips NO tendrán fade-in pero SÍ aparecerán instantáneamente, lo cual es consistente con la política de 0 animaciones del proyecto.
    *   El tooltip de maestrías se muestra DEBAJO del select (clase `.tooltipMaestria`), mientras que los de propiedades se muestran ENCIMA de la píldora.

---

## 📡 8. Actualización API TaleSpire v0.1 (Junio 2026)

*   **API campaigns**:
    *   `campaigns.whereAmI()` **no** devuelve detalles de campaña ni el rol, solo devuelve un `campaignFragment` con una ID.
    *   Para obtener el nombre se debe invocar a `campaigns.getMoreInfoAboutCurrentCampaign()`.
*   **API clients y roles**:
    *   Para saber si el usuario actual es GM se debe invocar a `clients.whoAmI()` el cual indica `isGm` y `playerRole`.
*   **API chat**:
    *   ⚠️ **CRÍTICO**: Aunque la API v0.1 documenta `chat.send(mensaje)` con un solo parámetro, la versión real de TaleSpire **REQUIERE** un segundo parámetro `"board"` para que el mensaje se muestre en el chat: `chat.send(mensaje, "board")`. Sin este segundo parámetro, el mensaje se envía pero **NO se representa visualmente** en el chat.
    *   Para enviar a targets específicos se usa `chat.multiSend(mensaje, targets[])`.
*   **API System Clipboard**:
    *   TaleSpire expone el portapapeles oficialmente en `window.TS.system.clipboard.setText(text)` en lugar de `clipboard.copyText(text)`.
*   **API localStorage**:
    *   ⚠️ **CRÍTICO**: La firma REAL de `localStorage.global` es **SIN clave**:
        *   `setBlob(data: string)` — UN solo parámetro (el data string)
        *   `getBlob()` — SIN parámetros
        *   `deleteBlob()` — SIN parámetros
    *   **NO pasar una clave como primer argumento**. TaleSpire usa un blob único por simbionte. El paso de clave rompe la persistencia silenciosamente.
    *   La API v0.1 documentada sugiere `(key, data)` pero la implementación real NO lo soporta. **Siempre confiar en la firma probada en producción, no en la documentación teórica.**
*   **API initiative**:
    *   `nextTurn` y `prevTurn` **NO figuran documentados oficialmente** en la API v0.1, aunque están presentes en algunas versiones. Se mantienen protegidas por `typeof === "function"`.

---

## 🔄 9. Ciclo de Refactorización: Efectos, Caché y Adapter (Junio 2026)

### Sistema de Expiración por Ronda
*   **Cambio fundamental**: Los efectos ya NO decrementan duración por turno. Ahora usan `expiraRonda?: number` como entero absoluto.
*   Se calcula al agregar: `expiraRonda = rondaActual + duracionEnRondas`.
*   Expira cuando `rondaActual >= expiraRonda`.
*   **Ventaja**: Funciona independientemente del orden de iniciativa y no requiere decrementos manuales.

### Migración de Datos Persistidos
*   **Error potencial**: Al cambiar `EfectoActivo` (de `duracion: number` a `expiraRonda?: number`), los datos ya en localStorage carecen del nuevo campo.
*   **Solución adoptada**: Los efectos antiguos sin `expiraRonda` se filtran (expiran) inmediatamente en el siguiente `avanzarTurno`.
*   **Lección**: Siempre considerar la migración de datos al modificar interfaces de estado persistido.

### Caché de Plantillas con Mapas O(1)
*   `cachePlantillas.ts` pre-indexa la base de monstruos con Mapas `porId` y `porNombre` (normalizado).
*   Las búsquedas pasan de `O(N)` a `O(1)`.
*   **Priorización de ID y Fallback Temporal (Fase 3)**:
    *   Al sincronizar con TaleSpire (`actualizarColaIniciativaDesdeTaleSpire`), si la criatura ya tiene `idPlantillaAsociada`, se prioriza y **se evita por completo la búsqueda textual de plantilla**.
    *   Si no tiene `idPlantillaAsociada`, se usa la coincidencia de nombre (fallback) solo la primera vez, y se guarda la ID resultante permanentemente en la criatura para futuras actualizaciones.
    *   Esto elimina por completo las costosas búsquedas O(N) textuales repetitivas en cada ciclo de sincronización nativo.

### TaleSpireAdapter como Capa de Abstracción
*   Todos los accesos a `window.TS` centralizados en `src/utiles/TaleSpireAdapter.ts`.
*   Incluye debounce de 100ms para `initiative.getQueue()` (compartir la misma Promise evita race conditions).
*   Contiene guardas de nulidad para desarrollo local (fuera de TaleSpire).
*   **Regla**: **Nunca** acceder a `window.TS` directamente fuera del adapter.

### Errores de Build Comunes
*   **`const` vs `let`**: Declarar con `const` una variable que se reasigna después (ej.: `colaCombinada`). TypeScript lo detecta en build.
*   **Imports rotos tras renombrar tipos**: Siempre hacer `grep` global del nombre antiguo antes de confirmar la migración.
*   **Checklist Pre-Build**:
    1.  Buscar `window.TS` fuera de `TaleSpireAdapter.ts` → Debería dar 0 resultados.
    2.  Buscar tipos renombrados/eliminados con `grep`.
    3.  Verificar `const` vs `let` en variables reasignadas.
    4.  `pnpm run build` sin errores.
    5.  `node deploy_to_ts.js` exitoso.
