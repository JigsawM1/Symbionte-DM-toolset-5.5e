# Instrucciones del proyecto

- Redactar la interacción, los comentarios y la documentación en español.
- Usar `pnpm` para las dependencias y los comandos del proyecto JavaScript.
- Conservar los cambios existentes ajenos a la tarea.

## Graphify

Graphify es una herramienta externa de desarrollo instalada con `uv`; no forma parte del simbionte ni del build de Vite. La skill local está en `.agents/skills/graphify/SKILL.md`.

- Usar el grafo como ayuda para localizar relaciones y consumidores; comprobar el código fuente antes de editar o afirmar un comportamiento.
- Para generar el índice estructural desde la raíz: `graphify extract . --code-only --timing`.
- Para consultar: `graphify query "constructorRasgosClase"`, `graphify explain "fusionarExtensionRasgo"` o `graphify path "origen" "destino"`.
- Actualizar con `graphify update .` tras cambios de código. Si falta el índice, regenerarlo con la extracción estructural.
- Regenerar el informe y la visualización local con `graphify cluster-only . --no-label`; así no se invoca un modelo para nombrar comunidades.
- En PowerShell, si la sesión todavía no tiene el PATH actualizado, invocar el ejecutable con `& "$env:USERPROFILE/.local/bin/graphify.exe"` seguido de los argumentos.
- El índice generado en `graphify-out/` es local y está excluido de Git. Respetar `.gitignore` y `.graphifyignore`.
- El índice inicial cubre código; no asumir que incluye la documentación ignorada por Git. El análisis semántico de documentos es una operación independiente que puede consumir tokens.
- El grafo no certifica la ejecución de reglas declarativas, la sincronización multicliente ni el comportamiento en CEF/TaleSpire.
