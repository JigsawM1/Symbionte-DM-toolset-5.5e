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
