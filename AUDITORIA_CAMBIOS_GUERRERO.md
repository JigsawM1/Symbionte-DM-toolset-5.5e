# Inventario completo de la implementación de Guerrero

Fecha: 13 de octubre de 2026. Comparación con la base `011c31f`.

Este inventario incluye cada archivo de código, catálogo, prueba y configuración que quedó modificado después de retirar los datos de rasgos del transporte de iniciativa. El resultado mecánico, progresiones, validación y exclusiones se detallan en IMPLEMENTACION_GUERRERO.md.

## Cambio de sincronización añadido y retirado

Se añadió inicialmente `capacidadesRasgos` a los DTO de PJ y DM y `cp` al formato de red, con un esquema que incluía rasgos, nivel, clase, subclase, especie, características, overrides y lanzadores. También se añadieron su proyección, aplicación al receptor, observación de cambios y seguimiento de actores que retiraban su último rasgo. Eso amplió innecesariamente el canal de iniciativa.

Después de la corrección del usuario, se retiró completamente esa ampliación. Los cuatro archivos siguientes recuperan su comportamiento anterior a esta implementación:

- `src/tipos/sync.ts`: sin capacidades de rasgos ni campo `cp`.
- `src/almacen/slices/sliceSync.ts`: sin reconstrucción de rasgos desde los mensajes.
- `src/servicios/sincronizacionSimbiote.ts`: sin observación ni emisión de metadatos/contadores de rasgos.
- `src/servicios/sincronizacion/proyeccionEstadoCombate.ts`: DTO limitado a los datos de combate existentes.

Se eliminaron los archivos nuevos `src/tipos/capacidadesRasgosSync.ts` y `src/servicios/rasgos/sincronizarCapacidadesRasgos.ts`. Las pruebas iniciales que comprobaban aquel transporte se sustituyeron por regresiones que verifican su exclusión y la conservación de rasgos locales.

El procesamiento local de duración/condiciones en `sliceIniciativa.ts` permanece: utiliza el avance de ronda para terminar rasgos temporales de la propia ficha. No añade definiciones de rasgos a los mensajes de red.

## Archivos que conservan cambios

Total: 66 archivos de código, datos, pruebas y configuración.

| Archivo | Cambio concreto |
| --- | --- |
| `.gitignore` | Permite versionar el nuevo script de comprobación de Guerrero. |
| `package.json` | Añade test:guerrero-ui; conserva pnpm y las dependencias existentes. |
| `scripts/probar-constructor-rasgos.mjs` | Actualiza las expectativas antiguas de usos numéricos al contrato actual de decremento y límites. |
| `scripts/probar-guerrero.mjs` | Añade seis recorridos en App completa y dieciséis comprobaciones dimensionales con Chromium. |
| `src/almacen/slices/helpers/mutarPersonaje.ts` | Normaliza las capacidades declarativas después de mutar una ficha. |
| `src/almacen/slices/personajes/sliceActivacionRasgos.ts` | Bloquea agotamiento, recargas innecesarias y condiciones impeditivas; retira condiciones declaradas al ejecutar. |
| `src/almacen/slices/personajes/slicePersonajesBase.ts` | Normaliza creación, actualización y aplicación de build; conserva lanzadores independientes durante cambios de identidad. |
| `src/almacen/slices/personajes/sliceRecursosRasgos.ts` | Valida la disponibilidad del recurso antes de descontar usos. |
| `src/almacen/slices/personajes/sliceSelectoresRasgos.ts` | Valida opciones, duplicados, límites y consulta; concede estilos mediante metadatos y procedencia. |
| `src/almacen/slices/sliceIniciativa.ts` | Evalúa la finalización local de rasgos por duración y condiciones al avanzar rondas, turnos y cambiar efectos. |
| `src/componentes/caracteristicas/personajes/HojaPersonaje.tsx` | Integra la finalización de rasgos después de emitir una salvación correctamente. |
| `src/componentes/caracteristicas/rasgos/ConstructorRasgoDote.module.css` | Estilos para los controles adicionales del constructor. |
| `src/componentes/caracteristicas/rasgos/ConstructorRasgoDote.tsx` | Inserta las secciones de progresión y comportamiento/magia. |
| `src/componentes/caracteristicas/rasgos/ExtrasRasgos.module.css` | Estilos adaptables para cajas independientes y resumen de defensas. |
| `src/componentes/caracteristicas/rasgos/ModalDetalleRasgo.tsx` | Reutiliza las acciones de la tarjeta en lugar de mantener otro flujo de tirada y gasto. |
| `src/componentes/caracteristicas/rasgos/ResumenDefensasRasgos.tsx` | Muestra resistencias al daño, inmunidades al daño e inmunidades a condiciones por separado. |
| `src/componentes/caracteristicas/rasgos/SeccionSelectoresModalRasgo.tsx` | Dirige los selectores generales declarados en sección a la caja correspondiente. |
| `src/componentes/caracteristicas/rasgos/SelectorDotesAcordeon.tsx` | Filtra elecciones de estilo no repetible según las concesiones existentes. |
| `src/componentes/caracteristicas/rasgos/SelectorOpcionesAcordeon.tsx` | Caja general con búsqueda, paginación de seis opciones, descripciones, selección o consulta. |
| `src/componentes/caracteristicas/rasgos/VistaRasgosJugador.tsx` | Añade las cajas independientes y el resumen de defensas a Rasgos. |
| `src/componentes/caracteristicas/rasgos/constructor/CamposDefensas.tsx` | Editor de los tipos de daño y condiciones declarados como defensas. |
| `src/componentes/caracteristicas/rasgos/constructor/EfectosConstructor.tsx` | Integra los campos de defensas en el editor de efectos. |
| `src/componentes/caracteristicas/rasgos/constructor/EscaladosConstructor.tsx` | Editor de recarga corta parcial y tablas de usos, dados, recuperación, efectos y selección. |
| `src/componentes/caracteristicas/rasgos/constructor/MecanicasConstructor.tsx` | Editor de disparadores, condiciones, coste y configuración mágica y del conjuro gratuito. |
| `src/componentes/caracteristicas/rasgos/constructor/RecursosConstructor.tsx` | Permite elegir padre al configurar una extensión, además de gasto/herencia. |
| `src/componentes/caracteristicas/rasgos/constructor/SelectoresConstructor.tsx` | Configura estilo de combate, sección independiente, consulta y edición de descripciones de opciones. |
| `src/componentes/caracteristicas/rasgos/constructor/TablaEscaladoEditor.tsx` | Control reutilizable para añadir, editar y quitar escalones de nivel/valor. |
| `src/componentes/caracteristicas/rasgos/constructor/constantesConstructor.ts` | Añade recuperación dinámica y los tipos declarativos de defensa a las opciones disponibles. |
| `src/componentes/caracteristicas/rasgos/constructor/usarEditorEfectos.ts` | Inicializa los campos de los nuevos efectos de defensa. |
| `src/componentes/caracteristicas/rasgos/usarAccionesTarjetaRasgo.ts` | Bloquea doble envío durante una tirada y descuenta el recurso tras una emisión correcta. |
| `src/componentes/caracteristicas/rasgos/usarVistaRasgos.ts` | Utiliza el bloqueo declarativo general en lugar de la dependencia visual específica de Furia. |
| `src/datos/clases/guerrero.json` | Configura las cinco fases y sus progresiones; separa maniobras/poderes y declara dependencias estables. |
| `src/datos/efectos-predefinidos.json` | Añade cobertura media como efecto de dos modificadores y duración de diez asaltos. |
| `src/hooks/usarLanzadorConjuros.ts` | Aplica aptitud y componentes declarados por la fuente del lanzamiento gratuito. |
| `src/servicios/calculadorMagia.test.ts` | Actualiza el modelo esperado del Caballero Arcano a preparados. |
| `src/servicios/calculadorMagia.ts` | Prioriza la configuración del rasgo, corrige el cálculo de tercio de lanzador único y permite aptitud explícita. |
| `src/servicios/clases/buildClase.ts` | Lee la configuración mágica del rasgo y respeta su inicio; conserva otros lanzadores al aplicar build. |
| `src/servicios/clases/constructorRasgosClase.ts` | Copia nuevos metadatos, hidrata opciones de estilos y reutiliza la fusión de extensiones extraída. |
| `src/servicios/clases/dotesClase.ts` | Comprueba si un selector puede conceder una dote de estilo sin duplicar una no repetible. |
| `src/servicios/compendioRasgos.ts` | Reconstruye estilos de selectores generales, conserva elecciones independientes y no elimina estilos ajenos sin vínculo. |
| `src/servicios/consumidorRecursosConjuros.ts` | Reconoce la fuente de conjuro gratuito declarada y consume su uso propio. |
| `src/servicios/guerreroMecanicasDND55.test.ts` | Cuarenta y dos casos de catálogo y ejecución de las cinco fases. |
| `src/servicios/integridadCatalogos.test.ts` | Actualiza el número de efectos predefinidos y comprueba cobertura media. |
| `src/servicios/rasgos/bloqueoActivacionRasgo.ts` | Resuelve motivos generales de bloqueo: recurso propio/padre, condiciones, opciones y recarga completa. |
| `src/servicios/rasgos/borradorRasgo.ts` | Carga y guarda los campos avanzados y normaliza cambios de activable/pasivo. |
| `src/servicios/rasgos/camposConstructor.ts` | Define los campos avanzados del borrador reutilizando el esquema real del rasgo. |
| `src/servicios/rasgos/conjurosGratuitosRasgos.ts` | Busca una fuente válida y aplica aptitud, CD, ataque y ausencia de componentes al lanzamiento gratuito. |
| `src/servicios/rasgos/emisionSalvacionRasgos.ts` | Evita emisiones simultáneas y desactiva solo los rasgos declarados tras éxito del emisor. |
| `src/servicios/rasgos/estadoCondicionesRasgos.ts` | Reconoce condiciones y aliases del catálogo; finaliza rasgos y retira sus estados asociados. |
| `src/servicios/rasgos/evaluadorExpresionesRasgos.ts` | Evalúa las proyecciones de extensión y los estados normalizados; admite consulta de opciones. |
| `src/servicios/rasgos/evaluadorRecursosRasgos.ts` | Resuelve recursos y dados sobre los padres proyectados con extensiones. |
| `src/servicios/rasgos/extensionesRasgos.ts` | Extrae la fusión ya existente y la aplica a extensiones personalizadas sin mutar declaraciones guardadas. |
| `src/servicios/rasgos/fusionarEstadoRasgo.ts` | Preserva rasgos personalizados y gasto durante progresión; limita elecciones y normaliza transiciones de activación. |
| `src/servicios/rasgos/guerreroPersistenciaSync.test.ts` | Cuatro casos de persistencia y dos de exclusión de rasgos/configuración del transporte del tracker. |
| `src/servicios/rasgos/magiaRasgos.ts` | Reconcilia capacidad de lanzador concedida por rasgos, con idRasgoOrigen y conservación de otras fuentes. |
| `src/servicios/rasgos/mecanicasGeneralesRasgos.test.ts` | Cinco casos de nombres personalizados, extensión, defensas y emisión única/fallida. |
| `src/servicios/rasgos/normalizarMecanicasRasgos.ts` | Resuelve tablas de rasgos personalizados y conserva gasto, elecciones, condiciones y capacidad mágica. |
| `src/servicios/rasgos/progresionGuerrero.test.ts` | Cinco casos de subida/bajada de nivel, cambio de subclase, agotamiento y conservación de fuentes ajenas. |
| `src/servicios/rasgos/resumenDefensasRasgos.ts` | Agrupa defensas declarativas activas de rasgos y especies; separa categorías y evita duplicados. |
| `src/servicios/sincronizacion/causalidadSync.test.ts` | Verifica para DM y jugador que editar solo usos/metadatos de rasgos no emite mensajes de iniciativa. |
| `src/tipos/capacidadesBase.ts` | Extrae enums comunes de características y magia para evitar dependencia circular entre esquemas. |
| `src/tipos/esquemasCatalogos.ts` | Admite los metadatos generales nuevos en el catálogo validado. |
| `src/tipos/mecanicasRasgos.ts` | Esquema opcional compartido de condiciones, salvación única, magia y aptitud/componentes de conjuro gratuito. |
| `src/tipos/personaje.ts` | Reexporta enums trasladados y añade idRasgoOrigen opcional a un lanzador concedido por rasgo. |
| `src/tipos/rasgos.ts` | Añade defensas, ubicación/modalidad/categoría de selector y capacidades opcionales compartidas. |
| `src/utiles/lanzadorDados.ts` | Devuelve éxito de emisión; detecta ausencia de rollId y conserva rasgos pendientes si fallan bandeja y chat. |

## Documentación y evidencia adicional

- `IMPLEMENTACION_GUERRERO.md`: resultado por fase, contratos, conservación, comprobaciones y alcance pendiente; corregido para reflejar la retirada del transporte de rasgos.
- `agente.md`: nota de esta implementación y corrección; se conservan los finales de línea originales del resto del archivo.
- Este archivo: inventario completo por archivo y detalle de la ampliación retirada.
- `scratch/`: logs de CI de las cinco fases, CI final anterior, CI posterior a la retirada, pruebas focalizadas, dos simulaciones y comprobaciones de interfaz. Informe dimensional JSON y captura de Chromium.

No se añadieron dependencias ni se ejecutaron comandos de commit, push, merge o despliegue. Las pruebas de red utilizan simulación; no hubo certificación entre clientes TaleSpire reales ni en su CEF nativo.

## Cierre posterior a la retirada

- Pruebas focalizadas de ficha y sincronización: cuatro suites, 46 pruebas aprobadas.
- CI completo: salida 0, 133 suites y 1.844 pruebas aprobadas, TypeScript, lint, auditoría y build correctos.
- Simulación: salida 0, doce escenarios aprobados.
- La UI ya había superado seis flujos, dieciséis dimensiones y las regresiones del constructor; la retirada no modifica sus componentes.
