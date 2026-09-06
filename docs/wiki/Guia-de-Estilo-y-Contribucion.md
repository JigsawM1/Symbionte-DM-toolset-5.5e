# Guía de estilo y contribución

## Principios visuales

La interfaz se ejecuta dentro del WebView2 o CEF de TaleSpire y prioriza la lectura rápida durante una sesión.

- No usar emojis en la interfaz, documentación incrustada ni mensajes nuevos.
- Usar iconos SVG de `lucide-react`.
- No usar animaciones ni transiciones CSS.
- No usar `<select>` nativos; usar `SelectorDesplegable` o `SelectorSugerencias`.
- Mantener un tamaño mínimo de fuente de 11 px y contraste alto sobre fondos oscuros.
- Mantener tarjetas y controles compactos, pero con áreas de interacción legibles.

## Paletas y tokens

La vista de jugador usa `src/estilos/temaJugador.css` y tokens con prefijo `--pj-*`. Los tokens separan fondo, paneles, tarjetas, bordes, texto, acentos, alertas, éxito y monedas.

El modo Master mantiene la paleta oscura de control táctico con acentos diferenciados para jugadores, enemigos, estados críticos, concentración, Homebrew y compendio.

No mezclar estilos de la hoja de jugador con el panel del Master sin una razón explícita. Los estilos de cada componente deben vivir en su CSS Module.

## Convenciones de código

- Escribir identificadores y textos nuevos en español.
- Mantener nombres reales de módulos y funciones al documentar enlaces al código.
- Colocar las reglas de negocio en `src/servicios/`, `src/almacen/` o `src/utiles/` según su responsabilidad.
- Usar los selectores de Zustand en lugar de leer todo el estado desde un componente.
- Reutilizar `TaleSpireAdapter` para `window.TS`.
- Validar datos externos con los esquemas Zod y los saneadores existentes.
- No introducir `any` nuevo cuando pueda usarse un tipo de `src/tipos/`.
- Respetar las interfaces de la API TaleSpire v0.1 y sus payloads.

## Estado y persistencia

Las nuevas claves de estado deben pertenecer al slice adecuado. Si deben sobrevivir a una sesión, también deben añadirse a `CLAVES_PERSISTIBLES` en `src/almacen/usarAlmacenDM.ts`.

Los cambios de estado durante la hidratación deben respetar `cargandoDatos` para no escribir datos incompletos en el blob global.

Los datos importados deben pasar por `src/almacen/sanitizacion.ts` antes de guardarse.

## Pruebas y lint

Antes de enviar cambios:

```bash
pnpm test
pnpm lint
pnpm build
```

Las pruebas usan Vitest. Los servicios puros, los saneadores, los cálculos de magia, inventario, munición, condiciones y sincronización son candidatos preferentes para pruebas unitarias.

El build ejecuta `tsc` y Vite; no se debe ignorar un error de TypeScript para completar una compilación.

## Cambios de interfaz

Comprueba ambos roles si el cambio toca navegación, estado compartido o integración con TaleSpire. La aplicación puede cambiar de `gm` a `player` mediante `clientModeChanged`.

Para dados, prueba tanto la ruta nativa como el fallback de chat o navegador cuando sea aplicable. Para persistencia, prueba carga, saneamiento y restablecimiento.

## Flujo de contribución

1. Crea una rama descriptiva desde la rama base actual.
2. Revisa el alcance y localiza el slice, servicio o componente responsable.
3. Implementa un cambio pequeño y coherente con las capas existentes.
4. Añade o actualiza pruebas Vitest cuando exista lógica verificable.
5. Ejecuta lint, pruebas y build después de la última edición.
6. Revisa el diff para eliminar archivos accidentales, emojis, estilos globales innecesarios y cambios de formato no relacionados.
7. Abre una solicitud de cambios con descripción, pruebas ejecutadas y riesgos de despliegue.

## Despliegue

No commits `dist` ni los artefactos de `mod-io-build` salvo que el flujo de distribución lo solicite expresamente. Usa `pnpm deploy` para copiar la compilación a TaleSpire y `pnpm build-and-zip` para generar el paquete de mod.io.

Si TaleSpire bloquea archivos, sigue el procedimiento de [Instalación y despliegue](Instalacion-y-Despliegue) antes de modificar el script de despliegue.

## Revisión antes de una solicitud de cambios

Comprueba que:

- El cambio tiene una responsabilidad clara y no mezcla reglas de negocio con estilos.
- Los nombres nuevos están en español y describen el comportamiento real.
- Los componentes usan los selectores existentes cuando solo necesitan una parte del estado.
- Las operaciones con TaleSpire pasan por `TaleSpireAdapter`.
- Las importaciones y entradas Homebrew se validan antes de guardarse.
- No se han añadido emojis, `<select>` nativos, transiciones o animaciones.
- Los iconos nuevos proceden de `lucide-react`.
- No se han incluido archivos generados, credenciales ni cambios fuera del alcance.

## Nombres y módulos

Usa nombres que sigan las convenciones existentes, como `usarEstadoPersonajes`, `procesadorDescansos`, `calculadorInventario` y `resolutorCondiciones`. Los hooks comienzan por `usar`, los componentes React usan PascalCase y los servicios y utilidades usan nombres descriptivos en camelCase.

Los nombres de pestaña y los identificadores de datos deben reutilizar los tipos ya definidos. No inventes una segunda representación para iniciativa, personajes, condiciones o hechizos.

## Documentación de funciones

Documenta solo contratos que ayuden a usar la función: parámetros no obvios, fallbacks de TaleSpire, efectos sobre el estado o requisitos de persistencia. No escribas comentarios que repitan el nombre de la función o describan un cambio histórico.

Cuando una integración dependa de una capacidad opcional de `window.TS`, explica el comportamiento sin TaleSpire y el fallback disponible.

## Cambios persistibles

Si una nueva propiedad forma parte de la sesión, decide primero si pertenece a iniciativa, personajes, Homebrew o configuración. Después añade su saneamiento, su selector y su clave persistible si debe sobrevivir al cierre del Symbiote.

Comprueba que los valores por defecto puedan cargar campañas antiguas sin romper `safeParse`. Los campos opcionales deben tener un comportamiento claro para la interfaz.
