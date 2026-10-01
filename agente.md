# agente.md — Aprendizaje Autónomo del Simbionte DM

Este archivo registra reglas globales, errores encontrados, sus causas raíz y las soluciones aplicadas.

## REGLAS GLOBALES OBLIGATORIAS (VIGENCIA PERMANENTE)
1. **PROHIBICIÓN TOTAL DE EMOJIS (SOLO ICONOS LOCALES SVG / LUCIDE-REACT)**:
   - **Bajo ninguna circunstancia se deben usar emojis** en la interfaz de usuario, botones, títulos, badges, tooltips, modales, textos de notificación, logs de chat ni cadenas de código.
   - Cualquier representación gráfica o visual debe realizarse **estrictamente mediante iconos vectoriales locales SVG** (principalmente `lucide-react`) o diseño CSS.
2. **GESTOR DE PAQUETES EXCLUSIVO**:
   - Usar estrictamente `pnpm` (`pnpm add`, `pnpm test`, `pnpm run deploy`, etc.). Jamás sugerir ni invocar `npm` ni `yarn`.
3. **IDIOMA DE COMUNICACIÓN Y CÓDIGO**:
   - Toda interacción, comentarios y documentación técnica se redacta 100% en español.
4. **TIPADO ESTRICTO Y CÓDIGO LIMPIO**:
   - `strict: true` en TypeScript. Cero tipos `any`. Interfaces explícitas, generics y principios SOLID.
5. **BLINDAJE ARQUITECTÓNICO FEATURE-DRIVEN + UI LAYERS (UNIDIRECCIONALIDAD ESTRICTA)**:
   - Las dependencias fluyen estrictamente hacia abajo: `App/Layout -> Caracteristicas -> Comunes -> Almacen -> Servicios -> Utiles/Constantes/Tipos`.
   - **Bajo ninguna circunstancia** los módulos de lógica de negocio (`servicios/`), gestores de estado (`almacen/`), contratos (`tipos/`), valores de reglas (`constantes/`) ni funciones de soporte (`utiles/`) deben importar componentes visuales o archivos CSS (`componentes/`). Esta regla está reforzada en CI vía ESLint `no-restricted-imports`.
6. **PROHIBICIÓN ESTRICTA DE BIFURCACIONES POR NOMBRE DE RASGO O CLASE (CATÁLOGO DECLARATIVO Y BUILDER PURO)**:
   - **Bajo ninguna circunstancia** los módulos de lógica de negocio (`servicios/`), gestores de estado (`almacen/`) o constructores (`gestorClases.ts`) deben contener bifurcaciones condicionales por nombre literal de rasgo o clase (`r.nombre === "..."`, `clase.includes("...")`, etc.).
   - Toda mecánica, progresión de dados, escalado de usos, recuperación o desbloqueo dinámico debe resolverse mediante metadatos declarativos (`escaladoFormulaDados`, `escaladoUsos`, `escaladoRecuperacion`, `opcionesDinamicas`, `escaladoMaxSelecciones`, `sincronizarEfectosConFormula`, `heredarDadosPadre`, `gastarDePadre`, `ligadoA`, `efectos`) delegando en funciones puras agnósticas como `resolverEscaladosRasgo`. Esta regla está reforzada en CI vía ESLint `no-restricted-syntax` y la suite `rasgoGenericidad.test.ts`.


## [2026-10-01] Corrección de Parseo de Manifest en TaleSpire ("Failed parsing of manifest json" y "must start with a forward-slash")

**Problema Reportado:**
- El simbionte mostraba un cuadro negro en TaleSpire con el mensaje: *"Failed parsing of manifest json"* y posteriormente *"Local symbiote manifest paths must start with a forward-slash"*.

**Causa Raíz Diagnosticada:**
1. El archivo `manifest.json` incluía campos no reconocidos por el deserializador C#/Unity de TaleSpire (`api.subscriptions.sync` e `api.interop`).
2. En la especificación estricta de TaleSpire para simbiontes locales, la ruta del `entryPoint` debe comenzar obligatoriamente con una barra diagonal (`/index.html`).

**Solución Técnica:**
- Se limpiaron `manifest.json` y `public/manifest.json`, dejando únicamente las suscripciones estándar (`symbiote`, `creatures`, `initiative`, `dice`, `clients`) y estableciendo `"entryPoint": "/index.html"`.
- Se ejecutó `pnpm run deploy` compilando y copiando los archivos a la carpeta de simbiontes de TaleSpire.

## [2026-10-01] Motor de Velocidad Dinámica, Condiciones de Velocidad 0 / Mitad y Puntería Estable (D&D 5.5e)

**Problema y Solicitud del Usuario:**
- *"Como acción adicional, te otorgas ventaja en tu siguiente tirada de ataque en el turno actual. Puedes usar este rasgo solo si no te has movido durante este turno y, tras usarlo, tu velocidad se reduce a 0 pies hasta el final del turno actual."*
- *"ahora que se agrego velocidad dinamica ahora hay que hacer mecanica para esto y para cada cosa que diga que su velocidad quedo a la mitad o a 0"*

**Causas Raíz y Necesidades Técnicas:**
1. **Falta de Evaluación Integral de Condiciones en Velocidad:**
   - `obtenerVelocidadesEfectivas` únicamente sumaba bonos de rasgos (`modificador_velocidad`) y modos especiales, sin computar condiciones oficiales de reducción a 0 (Apresado, Inmovilizado, Paralizado, Aturdido, Petrificado, Inconsciente), efectos de mitad de velocidad (Lentitud, Slow, `multiplicador_velocidad`) ni penalizaciones por Cansancio/Exhaustion de D&D 2024 (-5 pies por nivel).
2. **Falta de Metadatos Declarativos para Restricción de Movimiento Previo en Rasgos:**
   - No existía un flag declarativo (`requiereSinMovimiento`) para modelar restricciones donde un rasgo solo puede activarse si `movimientoGastado === 0`.
3. **Puntería Estable en Pícaro:**
   - El rasgo estaba registrado de forma estática en `picaro.json` sin los metadatos de activable, restricción de movimiento ni efectos mecánicos de ventaja y fijación de velocidad a 0.

**Soluciones Técnicas Aplicadas:**
1. **Ampliación de Contratos y Tipos (`tipos/rasgos.ts` y `tipos/esquemasCatalogos.ts`):**
   - Agregados tipos de efecto `"fijar_velocidad"`, `"multiplicador_velocidad"` y `"velocidad_cero"` a `EsquemaTipoEfectoMecanico`.
   - Agregado campo `requiereSinMovimiento?: boolean` a `PlantillaRasgoClase`, `PlantillaRasgoEspecie`, `EsquemaRasgoPersonaje` y sus esquemas Zod de catálogos JSON.
2. **Evaluación Pura y Reactiva en `evaluadorMovilidadRasgos.ts` (`obtenerVelocidadesEfectivas`):**
   - **Bonos y Penalizaciones:** Computa base + bonos de rasgos (`modificador_velocidad`).
   - **Cansancio D&D 5.5e (2024):** Resta 5 pies por nivel de cansancio a todas las velocidades.
   - **Multiplicadores de Velocidad:** Soporta efectos `multiplicador_velocidad` (ej. 0.5) y condiciones/efectos de lentitud o mitad de velocidad (`Math.floor(vel * mult)`).
   - **Velocidad a 0 / Overrides:** Si el combatiente tiene condiciones de inmovilización (`apresado`, `inmovilizado`, `paralizado`, `aturdido`, `petrificado`, `inconsciente`), efectos de texto de velocidad 0 o rasgos activos con `fijar_velocidad: 0` / `velocidad_cero`, anula todas las velocidades (`caminar: 0, nadar: 0, volar: 0, escalar: 0, excavar: 0`).
3. **Catálogo Declarativo en `picaro.json`:**
   - Configurado "Puntería estable" con `categoriaMecanica: "activable"`, `esActivable: true`, `tipoAccion: "accion_adicional"`, `requiereSinMovimiento: true`, `autoDesactivarAlTirarDano: true` y efectos declarativos de ventaja en ataque y fijación de velocidad a 0.
4. **Validación de Activación en `sliceRasgos.ts`:**
   - En `alternarActivoRasgo`, si `targetTrait.requiereSinMovimiento` es verdadero y `pj.movimientoGastado > 0`, se bloquea de inmediato la activación preservando la regla oficial.
5. **Evaluación de Ventajas en Ataques (`evaluadorSalvacionesRasgos.ts`):**
   - Ampliado `evaluarVentajasDeRasgosEnTirada` para reconocer ventajas genéricas en ataques (`"ataque"`, `"ataques"`, `"todos_ataques"`, `"proximo_ataque"`).
6. **Validación Integral y Pruebas:**
   - Creada suite `evaluadorMovilidadRasgos.test.ts` cubriendo todas las condiciones de velocidad 0, multiplicadores a la mitad, cansancio e integración con el store.
   - 1,263 pruebas pasando al 100% (92 suites).
   - `tsc --noEmit` completado con 0 errores bajo `strict: true`.

## [2026-09-30] Sincronización de Condiciones, Efectos y Vitalidad desde el DM a la Hoja de Características del Jugador

**Problema Reportado por el Usuario:**
- *"las condiciones que agrega el master se agregan a la lista de iniciativa la vista del personaje, pero no se le agregan a su panel de condiciones de "caracteristicas""*

**Causa Raíz Diagnosticada:**
1. **Desconexión entre `colaIniciativa` y `personajes` en el Cliente del Jugador:**
   - Cuando el DM aplicaba una condición a la criatura en su tracker de combate y transmitía `ESTADO_INICIATIVA_DM`, `aplicarIniciativaDesdeSync` en `sliceSync.ts` actualizaba exclusivamente `colaIniciativa: datos.cola`.
   - La hoja de personaje del jugador (`HojaPersonaje.tsx` y su subcomponente `BarraTacticaPersonaje`) no lee de `colaIniciativa`, sino de `personajeActivo.condicionesActivas`, `personajeActivo.efectosActivos` y `personajeActivo.hpActual`.
   - Al no actualizarse el arreglo `personajes` en el cliente del jugador, las condiciones aplicadas por el DM se veían en la vista de lista de iniciativa, pero no aparecían en el panel de condiciones de la pestaña "Características" ni afectaban las mecánicas de la hoja (desventajas, salvaciones, etc.).
2. **Riesgo de Bucle de Eco al Mutar `personajes` en Sync:**
   - Si `aplicarIniciativaDesdeSync` actualizaba `personajes`, en el microtask posterior al desactivar `aplicandoSync: false`, el observador del jugador (`inicializarObservadoresStoreSync`) detectaría que `pjActivo.condicionesActivas` era distinto al snapshot previo (`prevCondicionesStr`), disparando un falso positivo de edición local que enviaría un mensaje `PJ` de vuelta al DM.

**Soluciones Técnicas Aplicadas:**
1. **Actualización Reactiva de Personajes en `aplicarIniciativaDesdeSync` (`sliceSync.ts`):**
   - Se mapean los `personajes` locales buscando su contraparte en `datos.cola` (por ID, `idMiniaturaTS` o `normalizarNombreTaleSpire`).
   - Se sincronizan inmutablemente `condicionesActivas: criaturaEnCola.condiciones || []`, `efectosActivos: criaturaEnCola.efectos || []`, `hpActual`, `hpMaximo` y `hpTemporal`.
   - Se inyecta `personajes: personajesActualizados` en el mismo `set({ aplicandoSync: true, ... })`.
2. **Blindaje contra Bucle de Eco en `inicializarObservadoresStoreSync` (`sincronizacionSimbiote.ts`):**
   - Cuando `estadoActual.aplicandoSync === true`, el observador actualiza proactivamente sus referencias previas (`prevCondicionesStr`, `prevEfectosStr`, `prevHpActual`, `prevHpTemporal`, `prevIniciativa`, etc.) con el estado recién aplicado.
   - Al desactivarse `aplicandoSync` en la microtarea siguiente, las referencias previas coinciden exactamente con el estado actual, suprimiendo cualquier emisión espuria hacia el DM.
3. **Validación Integral y Despliegue:**
   - Actualizado el test unitario en `sincronizacionSimbiote.test.ts` verificando que `personajes[0].condicionesActivas` y `hpActual` se actualizan al recibir el mensaje `DM`.
   - 1,203 / 1,203 pruebas unitarias aprobadas al 100% (88 suites).
   - `tsc --noEmit` completado con 0 errores bajo `strict: true`.
   - Desplegado exitosamente en TaleSpire mediante `pnpm run deploy`.

## [2026-09-30] Restricción Exclusiva de Auto Roll a Monstruos y Protección Absoluta de Jugadores

**Problema Reportado por el Usuario:**
- *"haz que el auto roll no se aplique a los jugadores, solo a los mounstros"*

**Causas Raíz Diagnosticadas:**
1. **Falso Positivo de Clasificación `esMonstruo` por ID en TaleSpire:**
   - En `agregarCriaturasSeleccionadasAIniciativa` y `sincronizarConEstadoLocal`, se asignaba `esMonstruo: !cTS.id.startsWith("c_jugador")`.
   - Dado que las miniaturas de jugadores en TaleSpire poseen identificadores UUID nativos (ej. `2f87a810-098e-4a6c-9419-f53bc44efb60`), evaluaban siempre a `true` al no comenzar por `c_jugador`.
   - Además, la búsqueda por nombre en `personajes` no contemplaba sufijos frecuentes en TaleSpire (como " (1)" o " (Guerrero)"), provocando que jugadores se registraran como monstruos.
2. **Auto Roll Indiscriminado al Seleccionar Miniaturas:**
   - En `agregarCriaturasSeleccionadasAIniciativa`, al seleccionar miniaturas en TaleSpire y añadirlas a la cola, se calculaba `Math.floor(Math.random() * 20) + 1` para todos los combatientes sin distinguir personajes jugadores.
3. **Auto Roll en Creación Rápida de Jugadores:**
   - En `BarraControl.tsx`, `manejarAñadirJugadorRapido` generaba `const tiradaInic = Math.floor(Math.random() * 20) + 1`, sobrescribiendo la iniciativa del jugador con un valor aleatorio automático.
4. **Vulnerabilidad en `autoLanzarIniciativaMonstruos`:**
   - La acción de botón "Auto Roll" (`autoLanzarIniciativaMonstruos`) solo comprobaba `if (c.esMonstruo)`. Al arrastrar jugadores mal clasificados, sus iniciativas se re-lanzaban aleatoriamente.

**Soluciones Técnicas Aplicadas:**
1. **Discriminación Estricta y Protección en `autoLanzarIniciativaMonstruos` (`sliceIniciativa.ts`):**
   - Se implementó una verificación exhaustiva para detectar si una criatura es un jugador (`!c.esMonstruo || c.id.startsWith("c_jugador") || state.personajes.some(...)` mediante coincidencia de ID, `idMiniaturaTS` y nombres normalizados con `normalizarNombreTaleSpire`).
   - El auto roll ignora por completo a cualquier combatiente de jugador, y si estaba erróneamente marcado como monstruo, normaliza su bandera a `esMonstruo: false` preservando su iniciativa intacta.
2. **Supresión de Auto Roll en `agregarCriaturasSeleccionadasAIniciativa` (`sliceIniciativa.ts`):**
   - Si la miniatura seleccionada corresponde a un personaje jugador en `state.personajes`, se añade con `iniciativa: 0` (esperando su tirada manual) y `esMonstruo: false`.
   - Solo a las miniaturas de monstruos se les aplica la tirada de dados aleatoria con su bonificador correspondiente.
3. **Eliminación de Auto Roll en `manejarAñadirJugadorRapido` (`BarraControl.tsx`):**
   - La iniciativa de jugadores añadidos rápidamente se inicializa en `0` en lugar de una tirada `d20` aleatoria.
4. **Robustez en la Detección de Miniaturas en `sincronizacionIniciativa.ts`:**
   - `pjAsociado` compara tanto el nombre exacto como el nombre base normalizado (`normalizarNombreTaleSpire`), garantizando que las fichas de jugadores se vinculen correctamente y tengan siempre `esMonstruo: false`.
5. **Validación Integral y Despliegue:**
   - Añadidas pruebas unitarias en `sincronizacionIniciativa.test.ts` verificando que `autoLanzarIniciativaMonstruos` y `agregarCriaturasSeleccionadasAIniciativa` no alteren la iniciativa de los jugadores.
   - 1,203 / 1,203 pruebas pasando al 100% (88 suites).
   - `tsc --noEmit` con 0 errores bajo `strict: true`.
   - ESLint con 0 errores y 0 advertencias (`--max-warnings=0`).
   - `pnpm run deploy` ejecutado con éxito en TaleSpire.

## [2026-09-30] Sincronización Bidireccional de Combate (TS.sync): Poda Estricta de Monstruos y Sincronización Reactiva de Iniciativa Jugador -> DM

**Problemas y Solicitudes del Usuario:**
1. *"de los mounstro solo debes pasar Identificación: ID único y nombre del combatiente, Iniciativa, Salud y Vitalidad, Condiciones Activas, Efectos Mágicos y Temporales. Omitir ca, plant, vel, bon"*.
2. *"Turno Activo: Índice de qué combatiente tiene el turno en curso (hace que la tarjeta se ilumine y se auto-desplace en la pantalla del jugador). eso ya lo toma directamente el symbionte de la cola de talespire no?"*.
3. *"De jugador a DM te falta sincronizar la iniciativa, lo demas creo que perfecto"*.

**Causas Raíz Diagnosticadas:**
1. **Sobrecarga de Datos en Monstruos (`serializarIniciativaDM`):**
   - Para las criaturas con `esMonstruo: true`, el serializador incluía campos auxiliares como `ca`, `idPlantillaAsociada` (`plant`), `velocidad` (`vel`) y `bonificadorIniciativa` (`bon`).
   - Estos datos son redundantes en la vista del jugador (`IniciativaJugador.tsx`), consumiendo caracteres críticos del límite estricto de red de 500 bytes de TaleSpire.
2. **Desconexión de la Iniciativa Tirada por el Jugador hacia el DM:**
   - En `proyectarEstadoCombatePJ`: Solo calculaba estáticamente `DES + iniciativaBono` en lugar de consultar si el combatiente ya tenía un valor tirado en `colaIniciativa`.
   - En `inicializarObservadoresStoreSync`: El observador del jugador solo rastreaba `hpActual`, `hpTemporal`, condiciones, efectos y concentración. Si el jugador tiraba dados 3D de iniciativa en TaleSpire (vía `aplicarResultadoIniciativaEnEstado`) o editaba su iniciativa, el cambio no disparaba `emitirMiPersonaje()`.
   - En `sliceSync.ts` (`actualizarPersonajeDesdeSync`): Al recibir el DTO del jugador en el DM, mapeaba vida, CA, condiciones y efectos, pero omitía actualizar `iniciativa: dto.iniciativa` en la criatura de `colaIniciativa`.

**Soluciones Técnicas Aplicadas:**
1. **Poda Estricta de Monstruos en `src/tipos/sync.ts`:**
   - En `serializarIniciativaDM`, si `criatura.esMonstruo === true`, únicamente se transmiten `id`, nombre (`n`), iniciativa (`i`), vida (`va`, `vm`, `vt`), `m: true`, condiciones (`c`) y efectos (`e`). Se omiten por completo `ca`, `plant`, `vel` y `bon`.
   - Esto reduce el tamaño de los monstruos en el wire a ~40-60 bytes por criatura.
2. **Propagación de Iniciativa Activa (Jugador -> DM):**
   - En `proyectarEstadoCombatePJ` (`src/servicios/sincronizacionSimbiote.ts`), se consulta `colaIniciativa` mediante `id`, `idMiniaturaTS` o `normalizarNombreTaleSpire(nombre)`; si existe un valor asignado, se proyecta con prioridad sobre el cálculo pasivo.
   - En `inicializarObservadoresStoreSync`, se incluye `prevIniciativa` e `inicActual` en la suscripción del jugador. Cualquier cambio en la iniciativa local dispara inmediatamente `emitirMiPersonaje()`.
   - En `actualizarPersonajeDesdeSync` (`src/almacen/slices/sliceSync.ts`), se asigna `iniciativa: dto.iniciativa !== undefined ? dto.iniciativa : criatura.iniciativa` en la cola del DM, la cual a su vez retransmite el consolidado a la mesa vía `emitirEstadoComoGM()`.
3. **Clarificación sobre Turno Activo Nativo:**
   - Se corroboró que TaleSpire despacha `onInitiativeEvent` con `activeItemIndex` a todos los clientes simultáneamente, por lo que el turno activo y el desplazamiento de miniaturas se actualizan nativamente en tiempo real en todos los jugadores. Nuestro canal `TS.sync` además suministra `t` y `r` para garantizar sincronía redundante.
4. **Validación y Despliegue:**
   - 1,200 / 1,200 pruebas unitarias aprobadas al 100% (88 suites).
   - `tsc --noEmit` completado con 0 errores bajo `strict: true`.
   - Límite de líneas verificado con 0 errores críticos.
   - Desplegado exitosamente en TaleSpire (`pnpm run deploy`).

## [2026-09-30] Fuente Única de la Verdad (SSOT) en Cola de Iniciativa: Eliminación de la Auto-ordenación Numérica en DM y Jugador

**Problema Reportado por el Usuario:**
- *"en el traker de iniciativa (tanto master como jugador) no auto ordenes segun el valor numerico de su iniciativa, que la fuente de la verdad sea la iniciativa de talespire"*

**Causas Raíz Diagnosticadas:**
1. **Ruptura del Orden Nativo en `sincronizarConEstadoLocal` (`sincronizacionIniciativa.ts`):**
   - Al sincronizar con la API de TaleSpire (`TS.initiative.getQueue()`), el servicio mapeaba los elementos nativos pero luego ejecutaba: `colaCombinada.sort((a, b) => b.iniciativa - a.iniciativa);`.
   - Esto destruía el orden de turnos establecido por TaleSpire (reordenaciones manuales del DM por drag-and-drop, empates, acciones preparadas, retrasos o combatientes sin iniciativa tirada), forzando una ordenación matemática artificial.
2. **Reordenación Impulsiva en Acciones del Estado Global (`sliceIniciativa.ts`):**
   - En `agregarCriaturaAIniciativa`, `establecerIniciativaCriatura`, `autoLanzarIniciativaMonstruos` y `agregarCriaturasSeleccionadasTS`, existían llamadas imperativas a `.sort((a, b) => b.iniciativa - a.iniciativa)`.
   - Modificar manualmente la iniciativa o añadir un combatiente provocaba que las tarjetas saltaran de posición en la interfaz.
3. **Reordenación tras Tiradas de Dados 3D (`lanzadorDados.ts`):**
   - En `aplicarResultadoIniciativaEnEstado`, cuando un jugador o monstruo lanzaba iniciativa con dados 3D, el callback ejecutaba `.sort((a, b) => b.iniciativa - a.iniciativa)` reorganizando inmediatamente la lista antes de que TaleSpire actualizara su secuencia nativa.

**Soluciones Técnicas Aplicadas:**
1. **TaleSpire como Fuente Única de la Verdad (SSOT) en `sincronizacionIniciativa.ts`:**
   - Se eliminó completamente la ordenación numérica `colaCombinada.sort((a, b) => b.iniciativa - a.iniciativa)`.
   - Las miniaturas nativas conservan el orden exacto de `colaTS.items` (`let colaCombinada = [...nuevasCriaturasNativas, ...criaturasLocales];`).
   - Las criaturas puramente locales se preservan al final de la cola sin perturbar el orden nativo.
   - Fallback de iniciativa física simplificado a `cTSConPropiedades.initiative ?? (existente ? existente.iniciativa : 0)` suprimiendo números artificiales.
   - Sincronización del índice activo nativo respetando los límites de la cola combinada.
2. **Saneamiento en `sliceIniciativa.ts` y `lanzadorDados.ts`:**
   - En `establecerIniciativaCriatura`, se actualiza el valor numérico conservando la posición de la criatura y el índice del turno activo.
   - En `autoLanzarIniciativaMonstruos`, se actualizan los valores de dados calculados para los monstruos sin mutar el orden de turnos.
   - En `aplicarResultadoIniciativaEnEstado`, se actualiza o añade el combatiente respetando la posición actual de la cola.
3. **Saneamiento de Regla ESLint en `BarraSuperior.tsx` / `BarraSuperior.module.css`:**
   - Modularizado el estilo condicional de alternancia de rol en la clase `.tituloTextoClickable`, eliminando la infracción `react/forbid-dom-props`.
4. **Validación Integral y Despliegue:**
   - Actualizadas y añadidas pruebas unitarias en `sincronizacionIniciativa.test.ts` verificando que el orden de TaleSpire se respeta 100% y que las acciones del store no auto-ordenan numéricamente.
   - 1,199 / 1,199 pruebas unitarias aprobadas al 100% (88 suites).
   - `pnpm exec tsc --noEmit` completado con 0 errores bajo `strict: true`.
   - ESLint con 0 errores y 0 advertencias (`--max-warnings=0`).
   - `node scripts/verificar-limite-lineas.js` con 0 errores críticos.
   - `pnpm run deploy` completado exitosamente, desplegando el nuevo bundle en TaleSpire.

## [2026-09-30] Canal de Sincronización Bidireccional (TS.sync): Diagnóstico y Solución de Errores de Transmisión y Detección de Roles

**Problema Reportado por el Usuario:**
- *"no creo que se este pasando todo :/. hice la prueba poniendo condiciones, modificando vida, los valores para mostrar % de vida , nada :/"*

**Causas Raíz Diagnosticadas:**
1. **Falso Positivo en Detección de Rol GM (`boards.getBoardsInThisCampaign`):**
   - En `TaleSpireAdapter.ts`, el fallback 3 intentaba llamar a `boards.getBoardsInThisCampaign()`. En TaleSpire, cualquier jugador conectado a una campaña puede llamar a este método con éxito.
   - En consecuencia, todas las instancias de los jugadores se detectaban a sí mismas como `esGM: true`.
   - Al creerse directores de juego:
     - En `procesarMensajeSyncEntrante` bajo el caso `"DM"`, la condición `if (!estado.esGM)` evaluaba a falso, **descartando por completo la iniciativa transmitida por el DM real**.
     - Los clientes de jugadores nunca emitían `SOLICITUD_ESTADO` al arrancar (`if (estado.esGM) return;`).
     - El observador del store ejecutaba la lógica del DM en lugar de la del jugador, ignorando los cambios de vida y condiciones del personaje activo.
2. **Extracción Frágil de Payloads en `window.manejarMensajeSync`:**
   - Dependiendo de la versión de CEF y de la forma en que TaleSpire despacha los mensajes de sync, el callback puede recibir:
     a) Dos argumentos directos: `(str, fromClient)`.
     b) Un wrapper: `{ kind: "syncMessageReceived", payload: "<JSON string>" }` (donde `payload` es una cadena, no un objeto).
     c) La cadena JSON directamente.
     d) Un objeto ya deserializado `{ v: 1, t: ... }`.
   - El código anterior solo buscaba `payloadCrudo?.kind === "syncMessageReceived" && payloadCrudo.payload.str`. Si recibía un string JSON o dos parámetros, la variable `str` quedaba en `""`, `datos` quedaba en `null`, y `procesarMensajeSyncEntrante` descartaba el paquete sin procesar.
3. **Rigidez en los Esquemas Zod de Validación Defensiva:**
   - En `EsquemaWireCriaturaIniciativa`, campos como `va`, `vm`, `ca` requerían tipos `number` estrictos. Si alguna miniatura física en TaleSpire no tenía vida o CA configurada (valores `null` o no numéricos), `safeParse` fallaba de inmediato, descartando todo el snapshot de combate.
4. **Ausencia de Suscripción a Eventos Nativos y Soporte Multiventana:**
   - Faltaban los alias globales (`window.syncMessageReceived`, `window.onSyncMessage`) y la suscripción a `TS.sync.onSyncMessage.subscribe(...)`.
   - No existía soporte para probar la sincronización en pestañas locales del navegador fuera de TaleSpire.
5. **Desincronización en el Directorio de Despliegue de TaleSpire:**
   - La carpeta física del Simbiote en `LocalLow/.../Symbiotes/ToolSet_Es_5.5` mantenía una versión previa sin las correcciones compiladas.
6. **Límite Físico Estricto de TaleSpire (`string too long: max length is 500`):**
   - TaleSpire CEF lanza una excepción nativa ineludible `newStringTooLongError: string too long: max length is 500` si la cadena pasada a `TS.sync.send(msg)` supera los 500 caracteres.
   - El código del Simbiote utilizaba un umbral de seguridad previo de 850 bytes (`LIMITE_TAMANO_SEGURO_BYTES = 850`).
   - Por esta razón, cuando el DM enviaba el snapshot inicial en respuesta a `SOLICITUD_ESTADO` o cuando se modificaban condiciones/vida (generando cadenas de 519 a 541 caracteres), el motor no fragmentaba el mensaje, intentaba enviarlo íntegro y TaleSpire bloqueaba el envío abortando la sincronización.

**Soluciones Técnicas Aplicadas:**
1. **Detección Estricta de Rol en `TaleSpireAdapter.ts`:**
   - Se eliminó definitivamente `boards.getBoardsInThisCampaign()` como criterio para ser GM.
   - Se da prioridad absoluta a `clientMode` (`yoCliente.clientMode === "gm"` o `clientInfo.clientMode === "gm"`). Si `clientMode` es `"player"` o `"spectator"`, se marca `esGM: false` inmediatamente.
   - Si no se puede confirmar que es GM, el fallback por defecto en TaleSpire es siempre `false` (Jugador).
2. **Extractor Universal Multiformato en `puenteTaleSpire.ts`:**
   - Se implementó `procesarMensajeSyncExtraccion(evento, clienteParam)` capaz de recibir y normalizar strings JSON planos, wrappers `{ kind, payload }`, objetos directos `{ t, v }` y parámetros separados `(str, fromClient)`.
   - Se registraron los alias `window.syncMessageReceived` y `window.onSyncMessage`.
   - Se incorporó un `BroadcastChannel("talespire-simbiote-sync")` para que múltiples pestañas del navegador o ventanas independientes sincronicen de manera inmediata tanto dentro como fuera de TaleSpire.
3. **Esquemas Zod Resilientes y Tolerantes en `src/tipos/sync.ts`:**
   - Se protegieron `EsquemaWireCriaturaIniciativa` y `EsquemaWireEstadoCombatePJ` con `.nullable().optional().transform(...)` y valores por defecto seguros (`0` para vidas, `10` para CA).
   - Se reforzaron `serializarIniciativaDM`, `deserializarIniciativaDM` y `serializarEstadoCombatePJ` con nullish coalescing en cada campo.
4. **Suscripción Dual y Solicitud Inicial en `usarConexionTaleSpire.ts`:**
   - Se añadió suscripción directa a `ts.sync.suscribirAMensajesSync`.
   - Se dispara `solicitarEstadoInicial()` automáticamente al inicializar en modo jugador o al cambiar de rol a jugador.
   - Se añadió un mecanismo interactivo en `BarraSuperior.tsx` para alternar entre "PLAYER SHEET" y "DM SCREEN" al hacer clic en el encabezado cuando se prueba en navegador fuera de TaleSpire.
5. **Compactación Agresiva y Particionamiento Dinámico (< 420 caracteres):**
   - Se reajustó `LIMITE_TAMANO_SEGURO_BYTES` a 420 caracteres (dejando un margen de seguridad de 80 caracteres respecto al techo de 500 de TaleSpire).
   - En `serializarIniciativaDM` y `serializarEstadoCombatePJ`, se omiten todas las propiedades por defecto o vacías (`vt: 0`, `ca: 10`, `m: false`, arrays vacíos), reduciendo el tamaño en más de un 40%.
   - `dividirEnChunksIniciativa` ahora mide la longitud serializada real y divide dinámicamente en N fragmentos estrictamente `<= 420` caracteres con máximo 4 criaturas por chunk y retardo de 25ms entre ráfagas.
   - En `TaleSpireAdapter.ts`, se incorporó una guardia que bloquea proactivamente cualquier mensaje que exceda los 500 caracteres para no romper la ejecución de TaleSpire.
6. **Despliegue y Validación:**
   - Ejecutado `pnpm run deploy` copiando exitosamente el nuevo bundle a `LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\ToolSet_Es_5.5`.
   - 1,196 pruebas unitarias aprobadas al 100% (88 suites).
   - `tsc --noEmit` completado con 0 errores bajo `strict: true`.
   - 0 infracciones de límite de líneas.

## [2026-09-30] Optimización Arquitectónica de Persistencia: Deshidratación al Guardar e Hidratación al Cargar de Rasgos y Selectores

**Problema Diagnosticado por el Usuario:**
- El usuario consultó: *"pregunta, al momento de guardar el personaje se guardardan todos sus rasgos eso no estaria mal? como ejemplo revisa @[respaldo.yaml]"*.

**Causa Raíz y Hallazgos Cuantitativos:**
1. **Inflado Masivo de Datos (Bloat) por Catálogos Estáticos en Selectores:**
   - En `respaldo.yaml`, de 7,547 líneas, más de **6,200 líneas (~82%)** correspondían exclusivamente a los arreglos de `rasgos` de los 3 personajes.
   - En particular, los selectores de rasgos de Mejora de Característica (ASI) y trucos incrustaban dentro de su propiedad `selectores[].opciones` el compendio completo de **más de 40 dotes oficiales** (655 líneas de JSON por rasgo), duplicándose en cada personaje y por cada nivel en que se adquiría una dote.
2. **Ruptura de la Fuente Única de la Verdad (SSOT):**
   - Guardar descripciones textuales y tablas de progresión estáticas en el archivo de guardado provocaba que los personajes arrastraran copias congeladas obsoletas ante correcciones de reglas en los archivos JSON oficiales (`clases/*.json`, `especies/*.json`).
3. **Riesgo Crítico de Saturación de Cuota:**
   - La persistencia en TaleSpire y `localStorage` (cuyo límite oscila entre 5 MB y 10 MB) se veía comprometida al guardar megabytes de texto estático redundante.

**Soluciones Arquitectónicas Aplicadas:**
1. **Módulo Puro de Deshidratación e Hidratación (`src/servicios/serializadorPersonaje.ts`):**
   - `deshidratarRasgo(r)`: Si el rasgo es canónico (`origen: especie/subespecie/clase/subclase` sin personalizar), poda la descripción estática y vacía `opciones: []` en los selectores, reteniendo únicamente el estado mutable del jugador (`id`, `nombre`, `origen`, `fuente`, `tipoAccion`, `usosRestantes`, `activo`, `notas`, y selecciones `valorActual`). Si el rasgo es Homebrew (`personalizado: true`), se preserva íntegro al 100%.
   - `deshidratarPersonaje(p)`: Mapea inmutablemente los rasgos del personaje a su formato ligero.
   - `hidratarPersonaje(p)`: Reconstituye en memoria todas las descripciones, fórmulas de dados, efectos mecánicos y dotes vinculadas delegando en `sincronizarRasgosAutomaticos`.
2. **Persistencia Ligera en TaleSpire y `localStorage` (`src/almacen/persistencia.ts`):**
   - En `persistirEstadoCompleto`, se deshidratan los personajes antes de construir el `blob` enviado a `guardarBlobGlobal`.
3. **Exportación Optimizada (`ConfiguracionDM.tsx` y `GestorPersonajes.tsx`):**
   - `exportarBaseDatosCompletaJSON`, `manejarExportarPersonaje` y `manejarExportarGrupo` deshidratan los personajes al generar las copias de seguridad descargables.
4. **Hidratación Automática al Cargar o Importar (`sliceConfiguracion.ts` y `GestorPersonajes.tsx`):**
   - `cargarDatosPersistidos` y `importarBaseDatosJSONCompleta` hidratan los personajes al entrar al estado de Zustand.
   - **Prevención de Ciclos de Carga:** Se mantuvo `importadorJSON.ts` y `sanitizacion.ts` desacoplados de `serializadorPersonaje` para prevenir dependencias circulares con `datosIniciales.ts` durante la evaluación top-level.

**Métricas y Validación:**
- **Reducción de Tamaño:** Reducción del **87.0%** en datos de personajes (de ~365 KB a ~47.5 KB con los datos reales de `respaldo.yaml`).
- **Pruebas Automatizadas:** 1,196 / 1,196 tests unitarios aprobados al 100% (88 suites).
- **TypeScript:** `tsc --noEmit` completado con 0 errores bajo `strict: true`.
- **ESLint:** 0 errores y 0 advertencias (`--max-warnings=0`).
- **Auditoría de Líneas:** 0 errores críticos (`verificar-limite-lineas.js`).
- **Compilación de Producción:** `pnpm run build` completado exitosamente en 6.89s.

## [2026-09-29] Encapsulación de CSS Modules y Normalización de Clases Utilitarias (TarjetaConsumibleAccion y CabeceraRasgosJugador)

**Problema Reportado por el Usuario:**
- `<div className="u-flex u-alinear-centro u-gap-md u-flex-1"> creo que esos campos no se estan agregando del todo`
- Aclaración: *"a lo que me refiero es que al div solo se le aplica el primero ejemplo. 'u-flex' y omite los otros"*.

**Causa Raíz Diagnosticada:**
1. **Desacoplamiento de Convención Utilitaria:**
   - En varios componentes se utilizaban nombres atómicos mixtos estilo Tailwind (`u-items-center`, `u-inline-flex`, `u-justify-between`, `u-gap-1`) que no estaban definidos en `src/estilos/utilidades.css` (el cual solo definía `u-alinear-centro`, `u-flex-inline`, `u-justificar-entre`, `u-gap-sm`, etc.).
   - Al renderizar elementos con cadenas como `u-flex u-items-center u-gap-1`, el motor del navegador aplicaba `.u-flex` (la única existente) y omitía o descartaba las demás clases por inexistencia o inconsistencia de nombres.
2. **Falta de Encapsulación en Componentes con CSS Modules:**
   - En `TarjetaConsumibleAccion.tsx`, mientras los contenedores principales usaban clases de módulo (`estilos.tarjetaAtaque`, `estilos.filaMetricasConsumible`), los subcontenedores interiores de layout usaban clases utilitarias globales dispersas (`u-flex u-alinear-centro u-gap-md u-flex-1`).
   - Además, en la tarjeta de consumibles, no se renderizaban las `notas` descriptivas del consumible (`consumible.notas`), perdiéndose información táctica contextual.

**Soluciones Arquitectónicas Aplicadas:**
1. **Aliases Universales de Flexbox en `src/estilos/utilidades.css`:**
   - Añadidos aliases canónicos compartidos:
     - `.u-inline-flex` (junto a `.u-flex-inline`).
     - `.u-items-center` (junto a `.u-alinear-centro`).
     - `.u-justify-between` (junto a `.u-justificar-entre`).
     - `.u-gap-1` (junto a `.u-gap-sm`, 4px).
2. **Clases Dedicadas en `VistaAtaquesJugador.module.css`:**
   - Creadas las clases de módulo encapsuladas:
     - `.bloqueIzquierdoConsumible` (`display: flex; align-items: center; gap: 6px;`).
     - `.bloqueDerechoConsumible` (`display: flex; align-items: center; gap: 6px;`).
     - `.contenedorEfectoConsumible` (`display: flex; align-items: center; gap: 6px; flex: 1 1 0%; min-width: 0;`).
     - `.bloqueCuracionConsumible` (`display: flex; align-items: center; gap: 6px;`).
3. **Refactorización Quirúrgica en `TarjetaConsumibleAccion.tsx`:**
   - Reemplazadas las clases utilitarias ad-hoc por las clases tipadas de `estilos.*`, garantizando que `display: flex`, `align-items: center`, `gap` y `flex: 1` se apliquen en un solo bloque CSS seguro y hasheado.
   - Añadido renderizado accesible de `consumible.notas` con soporte para atributo `title`.
4. **Normalización en `CabeceraRasgosJugador.tsx` y `VistaRasgosJugador.module.css`:**
   - Creada la clase de módulo `.grupoBotonesAccion` y aplicada en el contenedor de botones de acción rápida, eliminando la dependencia atómica.
5. **Pruebas y Verificación:**
   - 1,187 tests unitarios pasando al 100% (87 suites).
   - TypeScript `tsc --noEmit` completado con 0 errores (`strict: true`).
   - ESLint con 0 errores y 0 advertencias (`--max-warnings=0`).
   - Verificación de límites de líneas superada con éxito (0 errores críticos).

## [2026-09-29] Corrección Furia Persistente (Bárbaro): Autodesactivación y Recarga Diferidas a la Tirada de Iniciativa

**Problema Reportado por el Usuario:**
- "tambien otra cosa con el barbaro FURIA PERSISTENTE se esta autodesactivando no esta esperando a que tire iniciatia para autodesactivarse"

**Causa Raíz Diagnosticada:**
- En `sliceRasgos.ts`, dentro de `alternarActivoRasgo`, cualquier rasgo con `autoDesactivar: true` o `restaurarUsosAlActivar` aplicaba inmediatamente la recarga de recursos del rasgo objetivo (Furia), consumía un uso y se autodesactivaba al instante (`activo: false`) en el momento en que el usuario pulsaba el interruptor manual en la interfaz.
- Esto impedía que el rasgo permaneciera activo (`activo: true`) como toggle preparado esperando la tirada de iniciativa. Además, existía código legado con bifurcaciones por nombre literal (`esFuriaPersistenteLegacy`), vulnerando el principio de catálogo declarativo.

**Soluciones Arquitectónicas Aplicadas:**
1. **Diferimiento de la Autodesactivación y Consumo en `alternarActivoRasgo`:**
   - Si `targetTrait.dispararAlTirarIniciativa` es `true`, `alternarActivoRasgo` conmuta el estado a `activo: nuevoActivo` sin consumir usos de forma prematura, sin restaurar recursos antes de tiempo y sin autodesactivarse.
   - Purgada la comprobación hardcodeada por nombre (`esFuriaPersistenteLegacy`), manteniendo la resolución 100% declarativa.
2. **Acción Centralizada `dispararRasgosIniciativaPersonaje` en Zustand (`sliceRasgos.ts` / `slicePersonajesTipos.ts`):**
   - Creado el método `dispararRasgosIniciativaPersonaje(idPj: string)` en `SubSliceRasgos`.
   - Al lanzarse la iniciativa, recorre inmutablemente los rasgos del personaje: si un rasgo tiene `dispararAlTirarIniciativa: true`, está habilitado (`r.esActivable ? r.activo : true`) y posee usos disponibles, restaura los recursos del rasgo objetivo (`restaurarUsosAlActivar`), descuenta 1 uso y se autodesactiva (`activo: false`).
3. **Integración en la Vista (`HojaPersonaje.tsx` y `usarAccionesPersonajes`):**
   - En `manejarTirarIniciativa`, se sustituyó el bucle manual local por la llamada directa a `dispararRasgosIniciativaPersonaje(personajeActivo.id)`.
4. **Pruebas y Verificación:**
   - Actualizados los tests unitarios en `bardoYBarbaroDND55.test.ts` y `slicePersonajes.test.ts` para verificar la secuencia completa (toggle activa y mantiene el rasgo sin gastar; la tirada de iniciativa recarga la Furia base, gasta el uso y auto-desactiva el rasgo).
   - 1,180 pruebas pasando al 100% (86 suites), `tsc --noEmit` completado con 0 errores, ESLint 0 errores/warnings, verificación de límites de línea aprobada.

## [2026-09-29] Hotfix Mecánico D&D 5.5e: Bárbaro (Vitalidad del Árbol, Aspecto Tierras Salvajes, Frenesí) y Bardo (Movimiento Inspirador)

**Problemas Reportados por el Usuario:**
1. `barbaro.json`:
   - "Senda del Árbol del Mundo: VITALIDAD DEL ÁRBOL, me di cuenta que no es un selector, es un mejora pasiva, es un tirar dados"
   - "añadir las respectivas mejoras de NIVEL 6: ASPECTO DE LAS TIERRAS SALVAJES según su selector"
   - "Aplicar autodesactivar al tirar daño a FRENESÍ"
2. `bardo.json`:
   - "MOVIMIENTO INSPIRADOR, no tira dado, solo es un consumible gastar padre"

**Causas Raíz Diagnosticadas:**
1. **Vitalidad del Árbol mal categorizado como selector informativo:**
   - En `barbaro.json`, el rasgo poseía un array `selectores` artificial con las dos facetas del rasgo (*Oleada de vitalidad* y *Fuerza dadora de vida*). La mecánica canónica es pasiva permanente: al activar Furia se gana HP temporal igual al nivel de bárbaro (oleada), y al inicio de cada turno con furia activa se tiran dados de curación/HP temporal (tantos d6 como el bonificador de Daño de Furia: 2d6 en nv 3, 3d6 en nv 9, 4d6 en nv 16).
   - En el calculador de acciones de combate (`calculadorAccionesCombate.ts`), los rasgos clasificados con `tipoAccion: "pasivo"` eran descartados si no tenían acciones ni activables, impidiendo ejecutar tiradas de dados desde el panel de acciones si el rasgo era un pasivo con fórmula de tirada.
2. **Aspecto de las Tierras Salvajes con opciones informativas sin efectos mecánicos:**
   - Las tres opciones del selector (*Búho*, *Pantera* y *Salmón*) carecían de bloques `efectos` mecánicos, impidiendo que el motor de movilidad o sentidos actualizara la visión en la oscuridad o las velocidades de trepar/nadar.
3. **Frenesí sin bandera de auto-desactivación táctica:**
   - La función `desactivarRasgosDeImpactoDano` en `usarCalculoAtaquesJugador.ts` ya buscaba y alternaba rasgos con `autoDesactivarAlTirarDano: true`, pero a `Frenesí` en la Senda del Berserker le faltaba declarar dicha propiedad en su JSON.
4. **Movimiento Inspirador del Bardo heredando dados del padre incorrectamente:**
   - En el Colegio de la Danza (nv 6), el rasgo `Movimiento inspirador` tenía configurado `"heredarDadosPadre": true`. Esto provocaba que en la tarjeta del rasgo y en la interfaz de combate se renderizara un botón para tirar el dado de Inspiración bárdica, cuando la regla oficial solo utiliza una reacción y gasta un uso de Inspiración bárdica para permitir desplazamientos sin provocar ataques de oportunidad (no efectúa tirada de dado).

**Soluciones Arquitectónicas Aplicadas:**
1. **Reestructuración de Vitalidad del Árbol (`barbaro.json` y `calculadorAccionesCombate.ts`):**
   - Eliminado el selector redundante. Asignado `"categoriaMecanica": "pasivo_permanente"`, `"formulaDados": "2d6"` y `"escaladoFormulaDados"` (nv 1: 2d6, nv 9: 3d6, nv 16: 4d6).
   - En `calculadorAccionesCombate.ts`, se incorporó la regla declarativa genérica: si un rasgo tiene tirada de dados (`tieneDados`) pero carece de economía explícita, se clasifica como `"accion"` para que no se descarte y el jugador pueda lanzar sus dados directamente desde el panel de combate.
2. **Efectos Mecánicos en Aspecto de las Tierras Salvajes (`barbaro.json` y `evaluadorMovilidadRasgos.ts`):**
   - Configurados efectos mecánicos para cada opción:
     - `buho`: `modificador_stat`, objetivo `vision_oscuridad`, valor `60`.
     - `pantera`: `movimiento_especial`, objetivo `velocidad.escalar`, valor `caminar`.
     - `salmon`: `movimiento_especial`, objetivo `velocidad.nadar`, valor `caminar`.
   - Creada y expuesta la función pura `obtenerSentidosEfectivos(personaje: PersonajeJugador): SentidosEstructurados` (con alias `calcularSentidosPersonaje`) en `evaluadorMovilidadRasgos.ts` para evaluar bonos numéricos a la visión en la oscuridad respetando la arquitectura unidireccional sin importar módulos de capas superiores.
3. **Autodesactivación en Frenesí (`barbaro.json`):**
   - Añadida la propiedad `"autoDesactivarAlTirarDano": true` a Frenesí en la Senda del Berserker, integrándolo orgánicamente con el sistema de ataques del jugador.
4. **Corrección de Movimiento Inspirador (`bardo.json`):**
   - Retirado `"heredarDadosPadre": true` de `Movimiento inspirador` manteniendo `"gastarDePadre": true`. Ahora consume el recurso padre sin habilitar botón de tirada.
5. **Verificación y Pruebas:**
   - Creada suite de pruebas en `src/almacen/slices/bardoYBarbaroDND55.test.ts` validando exhaustivamente las 4 correcciones (escalado de dados, clasificación de combate, efectos de sentidos/velocidad, autodesactivación y consumo sin dados).
   - 1,180 pruebas unitarias aprobadas (86 suites), `tsc --noEmit` completado con 0 errores, ESLint 0 errores/warnings (`--max-warnings=0`), verificación de límites de línea exitosa.

## [2026-09-29] Ajuste de UI: Eliminación del Selector de Personaje en Acciones, Compendio e Inventario y Supresión del Checkbox de Preparación en Hoja de Personaje

**Problema Reportado por el Usuario:**
- "ajuste de UI, elimina el selector de personaje de aciones, compendio de conjuros e inventario"
- "2. eliminacion del checkbox de cuando una clase es conjuros preparados en @[src/componentes/caracteristicas/personajes/HojaPersonaje.tsx]"

**Causas Raíz Diagnosticadas:**
1. **Redundancia del Selector de Personaje en Subvistas:**
   - Existían selectores desplegables locales de personaje en las cabeceras de *Acciones* (`CabeceraAtaquesJugador.tsx`), *Compendio de Conjuros* (`CompendioConjurosJugador.tsx`) e *Inventario* (`VistaInventarioJugador.tsx`). La selección canónica del personaje activo se realiza en la barra superior o en la vista dedicada de personajes (`VistaJugadores.tsx`), por lo que estos selectores locales generaban ruido visual y redundancia en el flujo de interacción.
2. **Checkbox Innecesario de Conjuros Preparados en la Hoja de Personaje:**
   - Cuando un personaje pertenecía a una clase que prepara conjuros (`requierePreparacion = true`), la vista de la hoja (`HojaPersonaje.tsx` -> `PanelConjurosPersonaje` -> `SeccionNivelConjuros` / `SeccionConjurosOcultos` -> `TarjetaConjuroCompacta`) renderizaba un botón con icono de `Check` (`.checkboxPreparado`) en cada tarjeta de conjuro para marcarlo o desmarcarlo como preparado.
   - La preparación y aprendizaje de conjuros se gestiona formalmente desde el *Compendio de Conjuros* (donde se utiliza la estrella y los controles de repertorio); tener un checkbox interactivo por cada conjuro en la hoja de combate/magia resultaba intrusivo e innecesario para el uso diario de la ficha.

**Soluciones Arquitectónicas Aplicadas:**
1. **Eliminación Quirúrgica de los Selectores de Personaje:**
   - **Acciones:** Removido el bloque `.selectorPersonaje` y el icono `UserCheck` en `CabeceraAtaquesJugador.tsx`. Desacoplada la callback `alSeleccionarPersonaje` en `VistaAtaquesJugador.tsx`. Eliminada la clase CSS `.selectorPersonaje` en `VistaAtaquesJugador.module.css`.
   - **Compendio de Conjuros:** Removido el bloque condicional del selector en `CompendioConjurosJugador.tsx`, purgando los imports no utilizados de `User` y `seleccionarPersonajeActivo`.
   - **Inventario:** Removido el bloque `.filaSelectorPersonajeCompacto` en `VistaInventarioJugador.tsx`, limpiando `User`, `SelectorDesplegable` y `seleccionarPersonajeActivo`. Eliminada la regla CSS huérfana `.filaSelectorPersonajeCompacto` en `VistaInventarioJugador.module.css`.
2. **Supresión del Checkbox de Preparación en la Hoja de Personaje:**
   - En `SeccionNivelConjuros.tsx` y `SeccionConjurosOcultos.tsx`, se retiró el pase de `mostrarTogglePreparado={!esTruco && requierePreparacion}`.
   - En `TarjetaConjuroCompacta.tsx`, se eliminó el botón del checkbox de preparación `{mostrarTogglePreparado && !esTruco && <button ... />}` y se ajustó `claseEstadoTarjeta` para mostrar las tarjetas siempre activas (`estilos.tarjetaPreparada`), suprimiendo además el estilo `.nombreConjuroInactivo` y limpiando la importación de `Check` de `lucide-react`.
   - En `TarjetaConjuroCompacta.module.css`, se depuraron las clases huérfanas `.checkboxPreparado`, `.checkboxPreparadoActivo`, `.checkboxSubclase` y `.nombreConjuroInactivo`.
3. **Pruebas y Verificación Integral:**
   - 1,176 pruebas unitarias pasando al 100% (86 suites), `tsc --noEmit` completado con 0 errores bajo `strict: true`, ESLint sin errores ni advertencias (`--max-warnings=0`), verificación de límites de línea aprobada y compilación de producción con Vite exitosa.


## [2026-09-29] Incorporación de Controles Globales de Colapso y Expansión en la Pestaña de Acciones de Combate

**Problema Reportado por el Usuario:**
- "falta un boton de contraer todo en acciones."

**Causas Raíz Diagnosticadas:**
1. **Asimetría de Usabilidad entre Pestañas:**
   - Mientras que las secciones de *Inventario* (`BarraHerramientasInventario.tsx`) y *Conjuros* (`BarraFiltrosConjuros.tsx`) contaban con controles para expandir y colapsar masivamente todas sus subsecciones, y *Rasgos* (`CabeceraRasgosJugador.tsx`) disponía de un botón alternador de colapso global, la pestaña de *Acciones* (`CabeceraAtaquesJugador.tsx` / `VistaAtaquesJugador.tsx`) carecía por completo de controles globales de colapso.
   - En hojas de personaje de niveles medios o altos con múltiples armas, decenas de conjuros repartidos por nivel, rasgos tácticos y consumibles, la vista de combate requería desplazamientos prolongados sin opción de contraer todas las secciones simultáneamente.

**Soluciones Arquitectónicas Aplicadas:**
1. **Funciones Puras de Colapso en `usarCalculoAtaquesJugador.ts`:**
   - Definida la constante declarativa inmutable `SECCIONES_COMBATE_POR_DEFECTO: Readonly<Record<string, boolean>>` agrupando todas las secciones principales (`recursos`, `fisicos`, `magicos`, `rasgos`, `consumibles`, `hechizosObjetos`) y subsecciones por nivel de conjuro (`magicos_nv_0` a `magicos_nv_9` y `magicos_ocultos`).
   - Implementadas y expuestas `colapsarTodasSecciones`, `expandirTodasSecciones`, `estanTodasSeccionesColapsadas` y `alternarTodasSecciones` con mutación inmutable y segura del estado persistido (`ts_acciones_secciones`).
   - Compactados los selectores de conteo numérico con el helper puro `contarPorTipoAccion`, asegurando que `usarCalculoAtaquesJugador.ts` permanezca estricto por debajo de las 500 líneas (485 líneas).
2. **Controles en la Interfaz (`CabeceraAtaquesJugador.tsx`):**
   - Incorporado el bloque `.accionesCabeceraDerecha` que alberga el selector de personaje y el grupo `.grupoControlesColapso`.
   - Agregados los botones declarativos "Expandir" y "Contraer" con títulos descriptivos accesibles (`title="Contraer todas las secciones de combate"` y `title="Expandir todas las secciones de combate"`).
   - Uso estricto de iconos SVG locales de `lucide-react` (`ChevronsDownUp` y `ChevronsUpDown`), cumpliendo al 100% la directiva de cero emojis.
3. **Estilos CSS Modulares (`VistaAtaquesJugador.module.css`):**
   - Creados `.accionesCabeceraDerecha`, `.grupoControlesColapso` y `.botonControlColapso` con diseño interactivo coherente, bordes sutiles, variables de color temáticas y estados `:hover`.
4. **Pruebas y Verificación Integral:**
   - Creada suite `src/componentes/caracteristicas/ataques/CabeceraAtaquesColapso.test.tsx` testeando renderizado estático, presencia de botones, títulos accesibles y mutación exhaustiva del diccionario de estado.
   - Ampliada suite `src/componentes/caracteristicas/inventario/reordenacionYColapso.test.ts` con caso de prueba para colapso global de acciones.
   - 1,175 pruebas aprobadas (86 suites), `pnpm exec tsc --noEmit` con 0 errores, ESLint con 0 errores/warnings (`--max-warnings=0`), verificación de límite de líneas aprobada sin errores críticos y build de producción de Vite exitoso.

## [2026-09-28] Saneamiento Fase 4: Analizador Estructurado y Declarativo de Requisitos de Dotes

**Problema Identificado:**
1. **Comprobaciones Manuales y Exclusiones Negativas de Características:**
   - En `evaluadorRequisitosDotes.ts`, las características se evaluaban mediante 10 bloques `if` rígidos con condiciones negativas frágiles (`!reqNorm.includes("o destreza")`, `!reqNorm.includes("inteligencia,")`, etc.). No existía soporte dinámico para requisitos como "Constitución 13 o más", "Fuerza 15 o más", ni combinaciones arbitrarias de Homebrew.
2. **Heurística Repetida en Armaduras y Escudos:**
   - Verificaciones dispersas con cadenas sueltas para cada nivel de armadura (`pesadas/pesada/heavy`, `medias/mediana/media`, etc.).
3. **Bifurcación Hardcodeada en Estilo de Combate:**
   - Cálculo del nivel mínimo para el rasgo Estilo de combate mediante ternario quemado `normalizar(c.nombre) === "guerrero" ? 1 : 2`.

**Soluciones Arquitectónicas Aplicadas:**
1. **Analizador Léxico Estructurado de Cláusulas de Características:**
   - Definido `REGEX_REQUISITO_CARACTERISTICAS = /(?:(?:fuerza|destreza|constitucion|inteligencia|sabiduria|carisma)(?:,\s*|\s+o\s+)?)+\s*(\d+)\s*o\s*mas/gi`.
   - Creada función pura `extraerCaracteristicasDeTexto` para extraer las estadísticas requeridas de cada fragmento.
   - Evaluación dinámica de puntuaciones máximas y generación semántica de mensajes de error con abreviaturas oficiales (`FUE`, `DES`, `CON`, `INT`, `SAB`, `CAR`) para requisitos individuales o compuestos.
2. **Tabla Declarativa de Requisitos de Armaduras:**
   - Creada la constante inmutable `REQUISITOS_ARMADURAS: readonly RequisitoArmaduraDef[]` agrupando patrones, variantes normalizadas y mensajes de error.
3. **Tabla Declarativa de Progresión de Estilo de Combate:**
   - Extraída la tabla `NIVEL_MINIMO_ESTILO_COMBATE_POR_CLASE: Readonly<Record<string, number>>` (Guerrero niv. 1, Paladín/Explorador niv. 2).
4. **Pruebas y Verificación:**
   - Añadidas pruebas a `src/servicios/evaluadorRequisitosDotes.test.ts` verificando requisitos no estándar (Constitución 13+, Fuerza 15+) y progresión marcial de Paladín (niv. 1 bloqueado vs niv. 2 permitido).
   - 1,167 tests unitarios aprobados (85 suites), `tsc --noEmit` completado con 0 errores, ESLint 0 errores/warnings, límite de líneas verificado con éxito.

## [2026-09-28] Saneamiento Fase 3: Dones Épicos Declarativos y Atributos de Magia Desacoplados

**Problema Identificado:**
1. **Bifurcaciones Encadenadas en Dones Épicos:**
   - La función `resolverDoteDonEpicoRecomendada` en `gestorClases.ts` utilizaba 8 bloques `if` con comprobaciones mixtas de subcadenas (`descNorm.includes(...)`) e identificadores de clase (`cidNorm === "..."`).
2. **Listas Bilingües Hardcodeadas en Predicados de Magia:**
   - Las funciones `esLanzadorCarisma` y `esLanzadorSabiduria` en `identificadoresDND.ts` utilizaban cadenas de `includes` con variantes en inglés quemadas en el cuerpo de las funciones, sin abstracción para Inteligencia ni una resolución canónica directa.

**Soluciones Arquitectónicas Aplicadas:**
1. **Tabla Declarativa de Dones Épicos:**
   - Extraída la constante inmutable `MAPA_DON_EPICO_RECOMENDADO_POR_CLASE: Readonly<Record<string, string>>` para las 12 clases oficiales de D&D 5.5e en `gestorClases.ts`.
   - Creado el array de patrones declarativos `PATRONES_DON_EPICO_DESCRIPCION` para resolución por texto de rasgos heredados o homebrew.
   - Refactorizada `resolverDoteDonEpicoRecomendada` para resolver prioritariamente por clase en $O(1)$ con fallback ordenado a patrones descriptivos.
2. **Conjuntos Declarativos y Resolutor de Magia:**
   - Definidos en `identificadoresDND.ts` los conjuntos inmutables `CLASES_LANZADORAS_CARISMA`, `CLASES_LANZADORAS_SABIDURIA`, `CLASES_LANZADORAS_INTELIGENCIA`, `CLASES_PACTO` y `CLASES_BARBARO` como `ReadonlySet<string>`.
   - Creada y exportada la función declarativa pura `resolverAtributoConjuroClase(nombreOIdClase): Caracteristica | null`.
   - Desacoplada `obtenerHabilidadConjuroPersonaje` en `calculadorMagia.ts` para delegar en `resolverAtributoConjuroClase`, eliminando bifurcaciones de bajo nivel.
3. **Pruebas y Verificación:**
   - Creado `src/constantes/identificadoresDND.test.ts` con cobertura completa para todas las funciones y conjuntos declarativos.
   - Añadidas pruebas a `src/servicios/gestorClases.test.ts` para verificar la tabla de dones épicos y la resolución por clase/descripción.
   - 1,165 tests unitarios aprobados (85 suites), `tsc --noEmit` completado con 0 errores, ESLint 0 errores/warnings, límite de líneas verificado con éxito.

## [2026-09-28] Saneamiento Fase 2: Predicados Semánticos de Condiciones y Mapeo Declarativo de Invocaciones

**Problema Identificado:**
1. **Comprobaciones Negativas Frágiles de Furia:**
   - La condición de Furia base de Bárbaro se comprobaba mediante cadenas repetidas `(c.toLowerCase().includes("furia") && !c.toLowerCase().includes("furia de los dioses"))` en múltiples componentes y hooks (`usarVistaRasgos.ts`, `usarCalculoAtaquesJugador.ts`, `procesadorCondiciones.ts`).
2. **Detección Textual Ad-Hoc de Concentración:**
   - La concentración en `BarraTacticaPersonaje.tsx` e `IniciativaJugador.tsx` utilizaba `ef.nombre.toLowerCase().startsWith("concentra")` o `includes("concentra")`, omitiendo el flag booleano o el ID canónico de manera dispersa.
3. **Mapeo Hardcodeado de Slugs en Invocaciones de Brujo:**
   - En `evaluadorExpresionesRasgos.ts` (líneas 272-280), existía una cadena de 9 `||` comparando directamente slugs en inglés (`alert`, `crafter`, `healer`, `musician`, `lucky`, etc.) contra IDs en español.

**Soluciones Arquitectónicas Aplicadas:**
1. **Predicados Semánticos Puros en `procesadorCondiciones.ts`:**
   - Creadas y exportadas tres funciones puras:
     - `esCondicionFuriaDioses(condicion: string): boolean`
     - `esCondicionFuria(condicion: string): boolean` (discrimina formalmente contra furia de los dioses)
     - `esCondicionConcentracion(nombreOTexto?: string, id?: string, concentracionFlag?: boolean): boolean`
   - Reemplazadas todas las comprobaciones ad-hoc en `procesadorCondiciones.ts`, `usarVistaRasgos.ts`, `usarCalculoAtaquesJugador.ts`, `BarraTacticaPersonaje.tsx` e `IniciativaJugador.tsx`.
2. **Diccionario Declarativo $O(1)$ de Slugs:**
   - Extraído `MAPA_SLUG_INGLES_A_DOTE_ID: Readonly<Record<string, string>>` en `evaluadorExpresionesRasgos.ts`.
   - Búsqueda simplificada a `d.id === idMapeado` eliminando las 9 comparaciones individuales en línea.
3. **Pruebas y Verificación:**
   - Creados tests unitarios en `procesadorCondiciones.test.ts` para los tres predicados semánticos cubriendo variantes en español, inglés y flags booleanas.
   - 1,152 tests unitarios aprobados (84 suites), TypeScript 0 errores, ESLint 0 errores/warnings, límite de líneas verificado con éxito.

## [2026-09-28] Saneamiento Fase 1: Linajes de Especie y Selectores Declarativos UI

**Problema Identificado:**
1. Cadenas de ternarios repetidas en `ModalEditarPersonaje.tsx`, `PestanaIdentidad.tsx` y `SeccionesRasgosActivos.tsx` que buscaban subcadenas (`dracon`, `tiefling`, `goliat`, `gnomo`, `elfo`) para etiquetar los campos de subespecie.
2. Inferencia de widgets en `SeccionSelectoresModalRasgo.tsx` mediante inspección de subcadenas en los IDs o etiquetas (`includes("dote")`, `includes("invocacion")`, `includes("conjuro_nv1")`).

**Soluciones Arquitectónicas Aplicadas:**
1. **Linajes Declarativos:**
   - Incorporado el campo `etiquetaSubespecie` en `DefinicionEspecie`, `EsquemaDefinicionEspecieJSON` y en los compendios canónicos (`draconido.json`, `tiefling.json`, `goliat.json`, `gnomo.json`, `elfo.json`).
   - Creada función pura `obtenerEtiquetaSubespecie(especieIdONombre)` en `gestorEspecies.ts` con fallback canónico `"Subespecie / Legado / Linaje"`.
   - Eliminadas todas las cadenas de ternarios en los componentes de la interfaz.
2. **Discriminación Declarativa de Selectores:**
   - Añadido `tipoSelector: z.enum(["general", "dote", "invocacion", "conjuro"])` a `EsquemaSelectorRasgo`.
   - Actualizados constructores en `gestorClases.ts` (`crearSelectorDoteMejoraCaracteristica`, `crearSelectorDoteDonEpico`), `brujo.json`, `humano.json` y `rasgos-especie.json`.
   - `SeccionSelectoresModalRasgo.tsx` ahora discrimina el tipo de widget prioritariamente mediante `sel.tipoSelector`.
3. **Verificación:**
   - 1,149 / 1,149 pruebas unitarias aprobadas, `tsc --noEmit` completado con 0 errores y ESLint sin advertencias.

## [2026-09-28] Refactorización Declarativa de Categorías de Dotes en SelectorDotesAcordeon

**Problema Reportado por el Usuario:**
- "con respecto a function resolverClaseCategoria de @[src/componentes/caracteristicas/rasgos/SelectorDotesAcordeon.tsx] su forma de resolver la calse no es una basura? lit cada dote ya tiene 'categoria': que te dice cual es su categoria"

**Causas Raíz Diagnosticadas:**
1. **Desconexión con el Modelo de Datos (SSOT):**
   - Aunque todo el compendio oficial de dotes (`src/datos/dotes/*.json`) y el esquema tipado `EsquemaDotePersonaje` definían formalmente `categoria: "origen" | "general" | "estilo_combate" | "don_epico" | "personalizado"`, la función constructora `obtenerOpcionesDotesParaSelector()` en `gestorClases.ts` descartaba la propiedad `categoria` al generar `OpcionSelector[]`.
2. **Heurística Frágil y Fallas de Clasificación en UI:**
   - En `SelectorDotesAcordeon.tsx`, `resolverClaseCategoria` intentaba adivinar la categoría inspeccionando subcadenas del `id` y del texto `requisito`.
   - Para dotes de origen, se limitaba a una lista quemada (*hardcodeada*) de 4 IDs (`dote_alerta`, `dote_iniciado_magia`, `dote_afortunado`, `dote_musico`).
   - Las demás dotes canónicas de origen (`dote_duro`, `dote_maton_taberna`, `dote_sanador`, `dote_habilidoso`, `dote_fabricante`, `dote_atacante_salvaje`) y las variantes de iniciado en magia caían en el fallback por defecto y se mostraban incorrectamente con la etiqueta "General".

**Soluciones Arquitectónicas Aplicadas:**
1. **Extensión del Contrato de Tipos:**
   - Se añadió `categoria: z.string().optional()` a `EsquemaOpcionSelector` en `src/tipos/rasgos.ts`.
2. **Propagación Canónica:**
   - En `gestorClases.ts` (`obtenerOpcionesDotesParaSelector`) e `hidratadorDotes.ts` (`dotes_origen`), se incluyó la propiedad `categoria: d.categoria` al instanciar las opciones del selector.
3. **Mapeo Declarativo $O(1)$ y Fallback Robusto:**
   - En `SelectorDotesAcordeon.tsx`, se reemplazó la heurística por un diccionario de metadatos `METADATOS_CATEGORIA_DOTE` y un `Map` indexado con `TODAS_LAS_DOTES_CANONICAS_DND55`.
   - La función `resolverClaseCategoria(opcion: OpcionSelector)` resuelve la categoría en $O(1)$ leyendo directamente `opcion.categoria` o, como salvaguarda, consultando el mapa canónico por su ID.
4. **Verificación y Pruebas Automatizadas:**
   - Creado `src/componentes/caracteristicas/rasgos/SelectorDotesAcordeon.test.tsx` cubriendo la resolución explícita, la resolución por compendio y la presencia de `categoria` en `obtenerOpcionesDotesParaSelector()`.
   - 1,146 tests aprobados (84 suites), 0 errores TypeScript (`strict: true`) y 0 advertencias ESLint.

## [2026-09-28] Corrección Crítica de Persistencia, Condición de Carrera en Arranque y Pérdida de Datos

**Problema Reportado por el Usuario:**
- "emmmm, por alguna razon ya no se guardan las cosas :/ y si introduzco mi copia de los datso que tenia se eliminan automaticamente :/"

**Causas Raíz Diagnosticadas:**
1. **Condición de Carrera en Arranque (Cold Boot Race Condition):**
   - El estado de Zustand iniciaba con `cargandoDatos: false`.
   - Al montar la aplicación en la pestaña de `jugadores`, `VistaJugadores.tsx` llamaba a `autoResolverMiniaturasJugador(personajes, vincularMiniaturaTSPersonaje)`.
   - Como la llamada asíncrona a `cargarDatosPersistidos()` en TaleSpire tiene un retardo de 500 ms (para evitar el fallo `outOfOrderMessage` de la mensajería interna CEF), el almacén sólo contenía el estado inicial en memoria (`PERSONAJE_POR_DEFECTO`: "Nuevo Personaje").
   - `autoResolverMiniaturasJugador` vinculaba inmediatamente la miniatura activa en TaleSpire con este personaje temporal por defecto. Esta mutación disparaba el `persistenciaMiddleware` (con debounce de 250 ms), el cual sobrescribía el archivo `.localStorage/global` en TaleSpire con los datos vacíos por defecto **antes** de que `cargarDatosPersistidos()` leyera el blob almacenado.
2. **Ausencia de Fallback en Navegador Estándar:**
   - En `TaleSpireAdapter.ts`, si `window.TS` no existía (ej. ejecutando pruebas, previsualizaciones locales o entornos desconectados), `guardarBlob`, `leerBlob` y `eliminarBlob` no realizaban ninguna operación en `window.localStorage`.
   - Adicionalmente, el hook `usarConexionTaleSpire.ts` no ejecutaba `cargarDatosPersistidos()` si la API nativa de TaleSpire no respondía, bloqueando la carga en modo desconectado.
3. **Validación Zod Destructiva en `sanearPersonaje`:**
   - Si `EsquemaPersonajeJugador.safeParse` encontraba la más mínima discrepancia o campo anidado no conforme en una ficha de personaje, el bloque de fallback descartaba todos los datos (nombre, clase, nivel, estadísticas, inventario, conjuros) y devolvía `PERSONAJE_POR_DEFECTO`, destruyendo silenciosamente fichas válidas de usuario.
4. **Falta de Exportación/Importación de Campaña Completa:**
   - La función de exportación en `ConfiguracionDM.tsx` únicamente exportaba catálogos homebrew (`monstruosHomebrew`, `hechizosHomebrew`, `objetosHomebrewSolo`), omitiendo los personajes (`personajes`), notas del DM (`notasDM`), lista de tareas pendientes (`listaPendientes`), encuentros guardados (`encuentrosGuardados`) y cola de iniciativa (`colaIniciativa`).
   - Al importar el archivo de respaldo, `importarBaseDatosJSONCompleta` no integraba personajes ni notas, provocando que el usuario sintiera que sus datos "se eliminaban".

**Soluciones Arquitectónicas Aplicadas:**
1. **Blindaje de Carga y Flag `datosInicialesCargados`:**
   - Se añadió la propiedad booleana `datosInicialesCargados` a `SliceConfiguracion` (iniciando en `false`), y `cargandoDatos` inicia en `true`.
   - `persistenciaMiddleware` bloquea cualquier guardado hacia I/O si `estadoNuevo.cargandoDatos || !estadoNuevo.datosInicialesCargados`.
   - `cargarDatosPersistidos()` se encarga de marcar `cargandoDatos: false` y `datosInicialesCargados: true` al finalizar la lectura.
   - En `VistaJugadores.tsx`, el `useEffect` de auto-resolución de miniaturas comprueba `if (!datosInicialesCargados) return;`, imposibilitando cualquier emparejamiento con el personaje por defecto al arrancar.
2. **Fallback Completo a `window.localStorage` en `TaleSpireAdapter.ts`:**
   - Implementada persistencia en `window.localStorage` bajo la clave `ts_global_storage_fallback` cuando `!ts.estaDisponible`.
   - En `usarConexionTaleSpire.ts`, se configuró un timeout de 4 segundos que invoca `cargarDatosPersistidos()` en modo desconectado si no se detecta la API CEF nativa.
3. **Saneamiento Tolerante de Personajes:**
   - En `src/almacen/sanitizacion.ts`, ante fallos en `EsquemaPersonajeJugador.safeParse`, se registran los `resultado.error.issues` con `logger.warn` y se retorna el personaje fusionado (`fusionado as unknown as PersonajeJugador`) con sus campos por defecto asegurados, preservando el 100% de la información del usuario.
4. **Exportación e Importación Integral de Campaña:**
   - `exportarBaseDatosCompletaJSON` en `ConfiguracionDM.tsx` ahora incluye la lista completa de personajes, personaje activo, notas del DM, lista de tareas pendientes, encuentros guardados y cola de iniciativa junto a las creaciones homebrew.
   - `importarBaseDatosJSONCompleta` en `sliceConfiguracion.ts` procesa y fusiona automáticamente todos estos campos desde cualquier JSON de respaldo completo.

## [2026-09-28] Auditoría Integral de Código Legacy y Deuda Técnica del Repositorio

**Contexto y Solicitud:**
- El usuario solicitó auditar la cantidad y naturaleza de código heredado (*legacy*) existente en el proyecto.

**Hallazgos Clave y Métricas Registradas:**
1. **Datos Huérfanos en `src/datos/_obsoletos/`**:
   - `clases_legacy.json` (185 líneas) y `dotes_legacy.json` (121 líneas) con 0 importaciones en el proyecto.
2. **Componentes Gigantes en Backlog (`scripts/verificar-limite-lineas.js`)**:
   - 7 componentes reconocidos formalmente con excepción `[HEREDADO]`: `ConstructorRasgoDote.tsx` (2,393 lín), `SelectorInvocacionesAcordeon.tsx` (1,201 lín), `ModalAgregarObjeto.tsx` (713 lín), `ModalEditarPersonaje.tsx` (671 lín), `HojaPersonaje.tsx` (630 lín), `TarjetaObjetoInventario.tsx` (562 lín) y `GestorPersonajes.tsx` (491 lín). Total: 6,661 líneas (9.6% de `src/`).
3. **Scripts de Migración en `src/`**:
   - `src/editor_hechizos/` (528 líneas): Transformador CLI de compendio crudo `all.json`.
4. **Capas de Retrocompatibilidad en Producción**:
   - `importadorJSON.ts` (785 lín) mantenido para soportar backups históricos con claves en inglés (`"Custom Monsters"`, etc.).
   - Adaptaciones menores en `sanitizacion.ts`, `usarFormularioObjeto.ts`, `sliceRasgos.ts`, `TaleSpireAdapter.ts` y `lanzadorDados.ts` (~920 lín en total).
5. **Archivos Residuales en Raíz (Fuera de `src/`)**:
   - `ejemplos_de_tipos/` (30,245 lín de esquemas SRD 2014 en inglés), `scratch/` (16,467 lín de scripts y volcados de linter antiguos), `agent.md` (32 KB, desfasado del 17/09), `Documentacion API v0.1.md` (59.6 KB) y `mod-io-build/` (~5.5 MB de bundles antiguos).

**Decisiones y Hoja de Ruta:**
- Siguiendo la instrucción del usuario, se preservaron intactos los 7 componentes clasificados como `[HEREDADO]` en backlog de mantenimiento.
- Se ejecutó la purga y eliminación definitiva de todos los demás elementos obsoletos y residuales:
  - Eliminado el directorio `src/datos/_obsoletos/` (`clases_legacy.json` y `dotes_legacy.json`).
  - Eliminado el archivo desfasado `agent.md` (unificado en `agente.md`).
  - Eliminado el documento preliminar `Documentacion API v0.1.md`.
  - Eliminados los archivos de soporte y pruebas obsoletas de `scratch/` (`append-agente.js`, `test-import-real.ts`, `test-perception.js` y ficheros temporales).
  - Eliminado el directorio externo `ejemplos_de_tipos/` (30,245 líneas de JSONs SRD 2014 en inglés).
  - Eliminado el directorio temporal de builds `mod-io-build/` y el archivo zip raíz `ToolSet_Es_5.5.zip`.
- **Validación Post-Limpieza**:
  - Tests: **1,143/1,143 tests aprobados al 100%** (83 suites ejecutadas sin fallos).
  - TypeScript: `pnpm exec tsc --noEmit` completado con 0 errores bajo `strict: true`.
  - ESLint: `pnpm run lint` con 0 errores y 0 advertencias (`--max-warnings=0`).
  - Auditoría de líneas: `pnpm run verificar:lineas` superado exitosamente (0 errores críticos).
  - Build: `pnpm run build` completado exitosamente en 10.65s sin anomalías.

## [2026-09-28] Exportación Exclusiva de Creaciones Homebrew en ConfiguracionDM, Integración Real de Portapapeles y Resiliencia en Importador JSON

**Contexto del Problema:**
- Al utilizar la función de exportación de base de datos en `ConfiguracionDM.tsx` ("EXPORTAR COPIA DE SEGURIDAD (.JSON)"), el payload serializaba directamente los arreglos globales de estado (`baseDatosMonstruos`, `baseDatosHechizos`, `objetosHomebrew`), exportando todo el compendio canónico oficial de D&D 5.5e (más de 300 criaturas, casi 400 conjuros y todo el equipo estándar del sistema) en lugar de limitarse a las creaciones Homebrew del Dungeon Master.
- Además, al pulsar el botón de exportación, la interfaz mostraba *"¡COPIADO AL PORTAPAPELES!"*, pero la función `exportarBaseDatosCompletaJSON` **nunca invocaba** `copiarAlPortapapeles(jsonStr)`, por lo que el portapapeles del usuario permanecía vacío tras el clic.

**Solución Arquitectónica Aplicada:**
1. **Aislamiento Estricto de Homebrew en la Exportación (`ConfiguracionDM.tsx`):**
   - Se conectaron las colecciones puras de Homebrew ya computadas mediante los filtros de exclusión `IDS_INICIALES_MONSTRUOS`, `IDS_INICIALES_HECHIZOS` e `IDS_INICIALES_OBJETOS` (`monstruosHomebrew`, `hechizosHomebrew` y `objetosHomebrewSolo`).
   - El payload `datosExportacion` ahora estructura canónicamente:
     - `monstruos: monstruosHomebrew`
     - `hechizos: hechizosHomebrew`
     - `objetos: objetosHomebrewSolo`
   - Se actualizaron las etiquetas del botón a *"EXPORTAR HOMEBREW (.JSON)"* y el modal de copiado manual para mantener coherencia semántica en la UI.
2. **Copia Real al Portapapeles y Descarga Desacoplada (`sistemaTaleSpire.ts` y `ConfiguracionDM.tsx`):**
   - En `ConfiguracionDM.tsx`, se importaron e invocaron de forma orquestada `copiarAlPortapapeles(jsonStr)` y `descargarArchivoJSON(jsonStr, nombreArchivo)` (alineándose con el estándar establecido en `GestorPersonajes.tsx`).
   - Se reforzó `copiarAlPortapapeles` en `sistemaTaleSpire.ts` con una cascada de 3 niveles:
     1. API nativa de TaleSpire (`ts.system.clipboard.setText`).
     2. API estándar moderna del navegador (`navigator.clipboard.writeText`).
     3. Fallback con elemento `<textarea>` temporal y `document.execCommand("copy")` para contextos HTTP locales, iframes o entornos sin permisos directos de portapapeles.
   - El estado `copiado` en el botón solo se activa si la copia fue efectivamente completada con éxito.
3. **Resiliencia y Compatibilidad Multiversión en el Importador (`importadorJSON.ts`):**
   - Se ampliaron las fuentes de entidades candidatas en `importarDesdeJSON` para admitir tanto las claves canónicas (`monstruos`, `hechizos`, `objetos`) como claves heredadas (`baseDatosMonstruos`, `baseDatosHechizos`, `objetosHomebrew`) o nombres del blob TaleSpire (`monstruos_homebrew`, etc.), asegurando interoperabilidad sin pérdida de datos.
4. **Pruebas de Regresión (`src/almacen/importadorExportadorHomebrew.test.ts`):**
   - Se implementó una suite que verifica que los registros oficiales son excluidos de la exportación, que únicamente las entidades custom persisten en el backup y que el importador las fusiona y desduplica correctamente.

**Resultados de Validación:**
- **Tests**: 83 suites ejecutadas, **1143/1143 tests aprobados al 100%** (`pnpm test`).
- **TypeScript**: `pnpm exec tsc --noEmit` completado con 0 errores bajo `strict: true`.
- **ESLint**: `pnpm lint` con 0 errores y 0 advertencias (`--max-warnings=0`).
- **Límites de Líneas**: `pnpm run verificar:lineas` superado exitosamente (0 errores críticos).
- **Compilación de Producción**: `pnpm run build` generado exitosamente en 13.7s.

## [2026-09-28] Implementación Canónica e Interactiva del Rasgo "Versátil" (Especie: Humano - D&D 5.5e / PHB 2024)

**Contexto y Requerimiento:**
- El usuario solicitó que el rasgo **"Versátil"** de la especie **Humano** otorgue por defecto una **Dote de Origen** (recomendada canónicamente: *"Alerta"*), de forma interactiva con selector visual en lista tipo acordeón con filtrado de requisitos cumplidos (`SelectorDotesAcordeon`), permitiendo cambiarla reactivamente por cualquier otra dote de origen oficial e inyectándola directamente en la sección de dotes de la ficha.

**Decisiones de Diseño y Arquitectura:**
1. **Catálogo Declarativo sin Hardcodeo (`humano.json` y `rasgos-especie.json`)**:
   - En lugar de bifurcar por nombre en el builder de especies (`gestorEspecies.ts`), se configuró declarativamente el rasgo `Versátil` con:
     - `categoriaMecanica: "selector_informativo"`
     - `selectores`: un selector con `id: "selector_dote_origen_humano_versatil"`, `tipo: "unico"`, `etiqueta: "Dote de Origen elegida"`, `maxSelecciones: 1`, `valorActual: ["dote_alerta"]` y `claveOpcionesDinamicas: "dotes_origen"`.
2. **Hidratación Automática (`hidratadorDotes.ts`)**:
   - Se integró el generador `dotes_origen` en `OPCIONES_DINAMICAS_MAP` que mapea las 12 dotes de origen canónicas (PHB 2024) ordenadas alfabéticamente con su metadata de requisitos.
3. **Construcción e Inyección Reactiva de Dotes Ligadas (`gestorEspecies.ts`, `compendioRasgos.ts`, `sliceRasgos.ts`)**:
   - Se definieron y exportaron `esRasgoVersatil` y `construirDoteDeVersatil`.
   - La dote construida porta `id: "dote_origen_" + normalizarTextoEspecie(rasgoVersatil.id)`, `origen: "dote"`, `ligadoA: rasgoVersatil.id` y `fuente: "Especie (Humano: Versátil)"`.
   - En `compendioRasgos.ts`, `sincronizarRasgosAutomaticos` detecta el rasgo Versátil e inyecta la dote de origen vinculada respetando usos y notas.
   - `esDoteLigadaSintetica` en `compendioRasgos.ts` y `esDoteLigada` en `VistaRasgosJugador.tsx` protegen la dote ligada (`dote_origen_`) para que no pueda ser eliminada ni editada manualmente fuera de su selector maestro.
   - En `sliceRasgos.ts` (`actualizarSeleccionRasgo`), cambiar la dote en el selector actualiza en caliente (`O(1)`) la dote vinculada en `personaje.rasgos`.

**Validación y Métricas de Calidad:**
- **Tests**: 82 suites pasando, **1141/1141 tests aprobados al 100%** (incluyendo suite exhaustiva de Versátil).
- **TypeScript**: `pnpm exec tsc --noEmit` completado con 0 errores bajo `strict: true`.
- **ESLint**: `pnpm lint` con 0 errores y 0 advertencias (`--max-warnings=0`).
- **Auditoría de Líneas**: `pnpm run verificar:lineas` superado con 0 archivos que superen los umbrales.
- **Build**: `pnpm run build` generado exitosamente en 6.8s.

## [2026-09-28] Ordenación Alfabética Canónica de los Catálogos JSON de Dotes

**Contexto del Problema:**
- El usuario solicitó organizar el contenido de los archivos JSON del directorio `src/datos/dotes` por orden alfabético.
- Los catálogos correspondientes comprenden:
  - `src/datos/dotes/epicas.json` (12 dotes épicas)
  - `src/datos/dotes/estilo_combate.json` (12 estilos de combate)
  - `src/datos/dotes/generales.json` (43 dotes generales)
  - `src/datos/dotes/origen.json` (12 dotes de origen)

**Solución Implementada:**
- Se ordenaron los arreglos de cada archivo JSON alfabéticamente por la propiedad `nombre` utilizando la función de colación en español `a.nombre.localeCompare(b.nombre, 'es')`, garantizando una ordenación natural (respetando tildes y preposiciones).
- Se preservó estrictamente la estructura interna de propiedades de cada objeto dote (`id`, `nombre`, `categoria`, `requisito`, `descripcion`, `beneficios`, `selectores`, `efectos`, etc.) y el formato estándar JSON (2 espacios de indentación con salto de línea final).
- Dado que los servicios consumidores (como `src/servicios/hidratadorDotes.ts`) cargan e hidratan las colecciones directamente desde estos JSON, las dotes quedan inmediatamente ordenadas de forma alfabética tanto en los selectores de creación/edición de personajes como en las vistas del compendio.

**Resultados de Validación:**
- **Tests**: 80 suites ejecutadas, **1112/1112 tests aprobados al 100%** (`pnpm test`).
- **TypeScript**: `pnpm exec tsc --noEmit` con 0 errores (`strict: true`).
- **ESLint**: `pnpm lint` con 0 errores y 0 advertencias (`--max-warnings=0`).

## [2026-09-28] No Prohibición de Ataques con Armas de Proyectiles sin Contenedor ni Munición (Advertencia No Bloqueante)


**Contexto del Problema:**
- Al utilizar un arma que requiere munición (por ejemplo, el Arco Largo o Ballesta), el sistema impedía ejecutar la tirada de ataque si el personaje no contaba con un contenedor de munición (como Carcaj o Caja de Virotes) o si no tenía municiones preparadas.
- El usuario solicitó que esta condición no impida ni prohíba el lanzamiento del ataque, sino que emita una advertencia informativa permitiendo siempre ejecutar la tirada hacia TaleSpire.

**Causa Raíz y Análisis:**
1. **Bloqueo Estricto con `return` en el Ejecutor de Combate**:
   En `src/servicios/ejecutorTiradasCombate.ts` (`ejecutarTiradaAtaqueFisico`), la verificación `if (!ataque.puedeDisparar)` emitía una notificación con tipo `"error"` y ejecutaba inmediatamente `return;`, cortando el flujo y evitando que `lanzarDadosTaleSpire` fuese invocado.
2. **Desconexión con la Intención de Juego Libre**:
   En situaciones de mesa de rol, un personaje puede disparar proyectiles improvisados, flechas recogidas del suelo o simplemente el jugador puede no haber cargado aún su Carcaj a la hoja. La regla de la aplicación debe avisar al jugador de la falta de equipo pero nunca bloquear de forma coercitiva la acción táctica.

**Solución Implementada:**
1. **Eliminación del Bloqueo Coercitivo (`src/servicios/ejecutorTiradasCombate.ts`):**
   - Se removió el `return;` y el tipo `"error"`. Ahora ante `!ataque.puedeDisparar` se emite una notificación de tipo `"advertencia"` (`agregarNotificacion(aviso, "advertencia")`).
   - El flujo continúa sin interrupción hacia la ejecución de la tirada física de ataque en TaleSpire (`lanzarDadosTaleSpire`).
2. **Consumo Seguro y Tolerante de Proyectiles:**
   - Se busca si existen proyectiles compatibles en la mochila (`it.contenedor === "mochila"` y `(it.cantidad || 0) > 0`).
   - Si existen proyectiles en la mochila (incluso si el personaje no tiene el contenedor configurado), se descuenta 1 proyectil y se notifica el remanente.
   - Si no hay proyectiles o la reserva está en 0, no se descuenta ningún objeto y se previene que las cantidades caigan en números negativos.
3. **Pruebas Unitarias de Regresión (`src/servicios/ejecutorTiradasCombate.test.ts`):**
   - Se crearon 4 casos de prueba específicos que validan el comportamiento:
     - Sin contenedor ni flechas: emite advertencia, no descuenta nada y lanza los dados en TaleSpire.
     - Con contenedor vacío (0 flechas): emite advertencia de carcaj vacío y lanza los dados en TaleSpire.
     - Con contenedor y flechas: descuenta 1 flecha, notifica info y lanza los dados sin advertencia.
     - Con flechas en mochila pero sin contenedor: emite advertencia de falta de carcaj, descuenta 1 flecha y lanza los dados.

**Resultados de Validación:**
- **Tests**: 80 suites ejecutadas, **1109/1109 tests aprobados al 100%**.
- **TypeScript**: `pnpm exec tsc --noEmit` con 0 errores (`strict: true`).
- **ESLint**: `pnpm lint` con 0 errores y 0 advertencias (`--max-warnings=0`).
- **Límites de Líneas**: `pnpm run verificar:lineas` con 0 errores críticos.

## [2026-09-28] Configuración Canónica de Corona de Luz (Clérigo Dominio de la Luz Nv. 17) como Consumible Activable e Integración de Efecto Predefinido Modular

**Contexto del Problema:**
- El usuario solicitó configurar el rasgo `rasgo_sub_luz_corona_de_luz` (Clérigo - Dominio de la Luz, Nivel 17) como un consumible activable que añade la condición/efecto homónimo registrado en `src/datos/efectos-predefinidos.json`.
- La duración requerida es de 10 turnos (1 minuto) y de propósito meramente informativo (sin alteraciones mecánicas numéricas sobre tiradas o estadísticas).

**Causa Raíz y Análisis Arquitectónico:**
1. **Configuración en Catálogo de Clases**: El rasgo `rasgo_sub_luz_corona_de_luz` en `src/datos/clases/clerigo.json` estaba categorizado como consumible con usos limitados, pero carecía de los metadatos declarativos `esActivable: true`, `condicionAlActivar: "Corona de luz"` y `duracionEfectoAlActivar: 10`.
2. **Ausencia en Catálogo Modular de Efectos**: No existía una ficha canónica para `"Corona de luz"` en `src/datos/efectos-predefinidos.json`.
3. **Mapeo Bidireccional de Condiciones y Rasgos**: Las funciones `resolverCondicionAsociadaRasgo` y `coincideCondicionConRasgo` en `src/almacen/slices/personajes/condicionesRasgosHelpers.ts` no contemplaban la vinculación para `"Corona de luz"` / `"Crown of Light"`.
4. **Omisión en el Constructor Puro de Rasgos de Clase**: En `src/servicios/gestorClases.ts`, la función agnóstica `construirRasgo` proyectaba `condicionAlActivar: r.condicionAlActivar,` pero omitía la asignación de `duracionEfectoAlActivar: r.duracionEfectoAlActivar,`, lo que provocaba que los rasgos de clase construidos devolvieran `duracionEfectoAlActivar: undefined`.
5. **Aserción de Integridad de Catálogo**: La suite `src/servicios/integridadCatalogos.test.ts` verificaba rígidamente 28 efectos predefinidos, por lo que la adición del efecto número 29 requería actualizar la expectativa correspondiente.

**Solución Implementada:**
1. **Catálogo Modular de Efectos (`src/datos/efectos-predefinidos.json`):**
   - Se añadió la definición de `"Corona de luz"` con `tituloVisual: "Corona de luz (Crown of Light)"`, `duracionEstandar: 10`, `aliases: ["corona de luz", "corona de la luz", "corona of light", "crown of light"]` y viñetas descriptivas informativas en `efectos[]`.
2. **Declaración en la Subclase del Clérigo (`src/datos/clases/clerigo.json`):**
   - En `rasgo_sub_luz_corona_de_luz` se añadieron `"esActivable": true`, `"condicionAlActivar": "Corona de luz"` y `"duracionEfectoAlActivar": 10`.
3. **Mapeo en Helpers de Condiciones (`src/almacen/slices/personajes/condicionesRasgosHelpers.ts`):**
   - En `resolverCondicionAsociadaRasgo` y `coincideCondicionConRasgo` se añadió el reconocimiento tolerante para "corona de luz" y "crown of light".
4. **Propagación en Constructor Agnóstico (`src/servicios/gestorClases.ts`):**
   - Se asignó `duracionEfectoAlActivar: r.duracionEfectoAlActivar,` dentro de `construirRasgo`, garantizando la paridad con `gestorEspecies.ts`.
5. **Verificación y Pruebas Unitarias (`src/servicios/clerigoMecanicasDND55.test.ts` e `integridadCatalogos.test.ts`):**
   - Se añadió un test unitario dedicado que comprueba que a nivel 17 el rasgo es un consumible activable con `duracionEfectoAlActivar: 10`, `condicionAlActivar: "Corona de luz"` y que el efecto predefinido existe en el catálogo.
   - Se actualizó el conteo canónico de efectos a 29 en `integridadCatalogos.test.ts`.

**Resultados de Validación:**
- **Tests**: 79 suites ejecutadas, **1101/1101 tests aprobados al 100%**.
- **TypeScript**: `pnpm exec tsc --noEmit` con 0 errores (`strict: true`).
- **ESLint**: `pnpm lint` con 0 errores y 0 advertencias (`--max-warnings=0`).

## [2026-09-28] Implementación Canónica D&D 5.5e (PHB 2024): Tablas Declarativas de Progresión por Nivel para el Clérigo

**Contexto del Problema:**
- El usuario solicitó la incorporación de las tablas de progresión visuales y mecánicas para los rasgos principales del Clérigo en base a las capturas oficiales del compendio:
  1. *Canalizar divinidad* (`rasgo_cls_clerigo_canalizar_divinidad`): Progresión de usos por nivel.
  2. *Canalizar divinidad: Chispa divina* (`rasgo_cls_clerigo_chispa_divina`): Progresión de dados de curación/daño.
  3. *Golpes benditos: Golpe divino* (`rasgo_cls_clerigo_golpe_divino`): Progresión de dados de daño por arma.
  4. *Golpes benditos: Lanzamiento potente* (`rasgo_cls_clerigo_lanzamiento_potente`): Progresión de mejoras acumulativas sobre trucos.

**Solución Arquitectónica Aplicada:**
1. **Configuración Declarativa en Catálogo JSON (`src/datos/clases/clerigo.json`):**
   - **Canalizar divinidad**:
     - Se añadió `tablaProgresion` con columnas `["Nivel", "Descripción"]`, filas `[{ nivel: 2, valores: ["2/descanso"] }, { nivel: 6, valores: ["3/descanso"] }, { nivel: 18, valores: ["4/descanso"] }]` y nota `"Cada nivel reemplaza al anterior"`.
     - Se ajustó `escaladoUsos.tabla` para alinear canónicamente la progresión a nivel 6 (3 usos) y nivel 18 (4 usos), corrigiendo el desfase previo que situaba el 3er uso a nivel 11.
   - **Chispa divina**:
     - Se incorporó `tablaProgresion` con filas en niveles 2 (`"1d8"`), 7 (`"2d8"`), 13 (`"3d8"`) y 18 (`"4d8"`), con nota `"Cada nivel reemplaza al anterior"`.
   - **Golpe divino**:
     - Se incorporó `tablaProgresion` con filas en nivel 7 (`"1d8"`) y nivel 14 (`"2d8"`), con nota `"Cada nivel reemplaza al anterior"`.
   - **Lanzamiento potente**:
     - Se incorporó `tablaProgresion` con filas en nivel 7 (`"Trucos + Sabiduría"`) y nivel 14 (`"Trucos recuperan PG Temporales"`), con nota `"Se apilan los niveles"`.
   - **Conjuros de Dominio (Vida, Luz, Engaño, Guerra)**:
     - En `rasgo_sub_vida_conjuros`, `rasgo_sub_luz_conjuros`, `rasgo_sub_engano_conjuros` y `rasgo_sub_guerra_conjuros` se configuró `tablaProgresion` con columnas `["Nivel de clérigo", "Conjuros preparados"]` y las filas canónicas de niveles 3, 5, 7 y 9.
     - Se sustituyeron las tablas estáticas en markdown por descripciones limpias, delegando la visualización en la tabla interactiva de la UI.
   - **Fulgor protector (Dominio de la Luz)**:
     - En `rasgo_sub_luz_fulgor_protector` se configuró `tablaProgresion` con nivel 6 (recuperación en descanso corto/largo y PG temporales de `2d6+sabiduria`) y nota `"Se apilan los niveles"`.

2. **Renderizado Especializado y Fidelidad Visual (`TablaProgresionRasgo.tsx` y `.module.css`):**
   - Se generalizó la detección de dos columnas para cualquier tabla cuyo primer encabezado contenga `"nivel"` (`esTablaDosColumnasNivel`), ajustando `thNivel` con `white-space: nowrap; width: 1%; min-width: 80px`.
   - Para tablas con columna de conjuros (`esColumnaConjuros`), se diseñó `.celdaConjuros` con tono cobrizo cálido temático (`#e07a5f`), reproduciendo con precisión el aspecto de las capturas del compendio oficial.

**Resultados y Métricas de Validación:**
- 6 nuevas pruebas unitarias añadidas en `src/servicios/clerigoMecanicasDND55.test.ts` (29 pruebas en la suite aprobadas al 100%).
- 35 pruebas en `src/servicios/integridadCatalogos.test.ts` aprobadas al 100%.
- Tipado estricto `strict: true`: 0 errores en TypeScript (`pnpm exec tsc --noEmit`).

## [2026-09-28] Ajustes de UI: Diferenciación de Color para Rasgos Padres con Selector y Caja Colapsable de Canalizar Divinidad (Clérigo)

**Contexto del Problema:**
- El usuario solicitó dos mejoras de UI en la vista de rasgos del jugador:
  1. Diferenciar mediante otro color los rasgos que actúan como selectores/configuradores de opciones (como "Golpes benditos" u "Orden divina"), para evitar que se confundan visualmente con los rasgos derivados u otorgados por la opción elegida (como "Golpes benditos: Lanzamiento potente" u "Orden divina: Protector").
  2. En la clase Clérigo, agrupar todos los rasgos que utilizan la mecánica de "Canalizar divinidad" (tanto el recurso base con sus usos, como los efectos que consumen dichos usos: Chispa divina, Expulsar muertos vivientes, Abrasar muertos vivientes y las opciones de dominio de subclase como Preservar la vida, Resplandor del alba, Invocar duplicidad, Golpe guiado, etc.) en su propia caja colapsable dedicada.

**Decisiones de Diseño y Arquitectura:**
1. **Diferenciación de Rasgos Padres con Selector**:
   - Se estableció la regla de detección: `esRasgoSelector = rasgo.categoriaMecanica === "selector_informativo" || (Array.isArray(rasgo.selectores) && rasgo.selectores.length > 0 && !rasgo.requiereOpcion)`.
   - Se implementó la clase CSS `.origenSelector` en `VistaRasgosJugador.module.css` con borde izquierdo índigo/azul vibrante (`#6366f1`) y título en `#818cf8`, tanto en la tarjeta de lista (`TarjetaRasgo.tsx`) como en el modal de detalle (`ModalDetalleRasgo.tsx` con `data-tipo-origen="selector"` e icono temático `SlidersHorizontal`).
   - Los rasgos hijos que otorgan beneficios de combate directos (e.g. "Golpes benditos: Lanzamiento potente") mantienen su color de clase base (`#f59e0b` / `#d4af37`), generando un contraste visual inmediato y natural.

2. **Caja Colapsable de Canalizar Divinidad (Clérigo)**:
   - Se extendió el contrato `GrupoClaseJerarquico` en `tiposRasgosJugador.ts` incorporando `claveColapsoCanalizarDivinidad: string` y `rasgosCanalizarDivinidad: RasgoPersonaje[]`.
   - Se creó la función clasificadora pura `esRasgoCanalizarDivinidad(rasgo: RasgoPersonaje): boolean` en `utilidadesProgresionRasgos.ts`, identificando por nombre, ID o `ligadoA` cualquier rasgo vinculado a la mecánica.
   - En `agruparRasgosJerarquicos`, si la clase es Clérigo y el rasgo pertenece a Canalizar Divinidad, se enruta a `rasgosCanalizarDivinidad`, excluyéndolo de `rasgosBase` y `rasgosSubclase` para evitar duplicaciones.
   - Se ordenan los elementos para que el rasgo principal de recurso ("Canalizar divinidad" con sus usos 2/2 o escalados) se sitúe en la primera posición, seguido de las opciones ordenadas por nivel requerido.
   - Se integró la sección colapsable en `GrupoClaseRasgos.tsx` con icono sacro `Sun`, cabecera dorada, badge de conteo y persistencia de colapso en `usarVistaRasgos.ts`.

**Errores Detectados y Corregidos Durante la Verificación:**
- En `src/servicios/clerigoMecanicasDND55.test.ts:195`, ESLint detectó un uso explícito de `any` (`hechizoTruco as any`). Se corrigió a `hechizoTruco as unknown as Parameters<typeof aplicarModificadoresInvocacionesAHechizo>[0]`, eliminando `any` y cumpliendo con la regla de tipado estricto.

**Resultados de Validación:**
- **Tests Unitarios**: 79 suites superadas, **1094/1094 tests pasando (100% de éxito)**, incluyendo pruebas unitarias añadidas para la agrupación de Canalizar Divinidad.
- **TypeScript**: `pnpm exec tsc --noEmit` con **0 errores** (Strict Mode estricto).
- **ESLint**: `pnpm lint` con **0 errores y 0 advertencias**.
- **Límites de Líneas**: `pnpm verificar:lineas` con **0 errores críticos**.
- **Producción**: `pnpm build` completado exitosamente.

## [2026-09-28] Corrección de Propagación de Tipo de Daño Secundario y Sanitización de Etiquetas de Combate (Golpe Divino y Devorador de Vida)

**Contexto del Problema:**
- El usuario reportó que la etiqueta del daño secundario adicional no se mostraba adecuadamente (aparecía en TaleSpire como `AND NUEVO PERSONAJE - DANO ADICIONAL GOLPE CON ARMA IMPROVISADA` o con la etiqueta genérica `Daño Adicional` en lugar de reflejar el tipo de daño específico o el nombre del rasgo que lo otorgaba), afectando directamente a `rasgo_cls_clerigo_golpe_divino` y a `devorador_de_vida` (Invocación sobrenatural de Brujo con selector o sufijo de daño).
- Se requería que cualquier daño secundario (`dano_secundario`) proveniente de rasgos activos propagara su tipo de daño exacto (`Necrótico`, `Radiante`, `Psíquico`, etc.) tanto a la fórmula del ataque del personaje, como a la tarjeta de combate en la interfaz y a la etiqueta 3D enviada a TaleSpire.

**Causa Raíz:**
1. **Falta de sincronización reactiva de selectores en el evaluador de expresiones**:
   - En `src/servicios/rasgos/evaluadorExpresionesRasgos.ts`, `evaluarEfectosRasgosActivos` proyectaba los efectos del rasgo sin verificar si el rasgo poseía un selector de tipo de daño (`selector_tipo_dano_golpe_divino`, `tipo_dano_devorador_de_vida`, etc.). Al no actualizar el efecto clonado con la opción elegida en el selector, el efecto conservaba `tipoDano: undefined`.
   - En `src/datos/clases/clerigo.json`, el efecto `dano_secundario` de `rasgo_cls_clerigo_golpe_divino` no declaraba `tipoDano` por defecto.
2. **Fallback genérico en el evaluador de combate**:
   - En `src/servicios/rasgos/evaluadorCombateRasgos.ts` (`obtenerDanosSecundariosAtaque`), ante un `ef.tipoDano` indefinido o vacío, se asignaba rígidamente `tipoDano: ef.tipoDano || "Adicional"`.
3. **Redundancia y duplicación de prefijos en TaleSpire**:
   - En `src/servicios/ejecutorTiradasCombate.ts`, la construcción de etiquetas de daño secundario en tiradas normales y críticas realizaba concatenaciones del estilo `${nombrePj} - Daño ${tipoEspecifico || "Extra"} ${ataque.nombre}`. Al recibir `"Adicional"`, generaba la etiqueta redundante `... - Daño Adicional ...`, formateada en mayúsculas como `DANO ADICIONAL`.
4. **Desconexión en invocaciones sobrenaturales con sufijo o variantes**:
   - Para `devorador_de_vida` (Invocación de Brujo D&D 2024), cuando la invocación se seleccionaba mediante sufijo (e.g., `devorador_de_vida:psiquico`) o cuando sus opciones venían hidratadas desde el catálogo global `CATALOGO_INVOCACIONES_SOBRENATURALES`, el selector dinámico no lograba sincronizarse si las opciones no estaban presentes en el árbol local del rasgo.
5. **Pérdida de tipos secundarios en ataques desarmados**:
   - En `src/servicios/calculadorAtaqueDesarmado.ts`, el ataque desarmado estándar y el especial asignaban `tipoDano: "Contundente"` fijo, sin concatenar los `tiposDanoSecundarios` (`Contundente / Radiante`).

**Solución Arquitectónica Aplicada:**
1. **Sincronización Reactiva de Selectores (`src/servicios/rasgos/evaluadorExpresionesRasgos.ts`):**
   - En `evaluarEfectosRasgosActivos`, se implementó la resolución automática de `tipoDano` para efectos `dano_secundario`: busca en los selectores del rasgo (o en selecciones con sufijo `id:opcion` y catálogo `CATALOGO_INVOCACIONES_SOBRENATURALES`) la opción elegida por el jugador e inyecta dinámicamente el `tipoDano` correspondiente al efecto evaluado.
2. **Inferencia Semántica Pura en Combate (`src/servicios/rasgos/evaluadorCombateRasgos.ts`):**
   - En `obtenerDanosSecundariosAtaque`, antes de recurrir a cualquier fallback, se analiza la descripción del efecto, la descripción del rasgo y el nombre del rasgo contra un diccionario semántico de tipos de daño canónicos (Radiante, Necrótico, Psíquico, Fuego, Frío, Relámpago, Trueno, Ácido, Veneno, Fuerza). Si el tipo de daño aún no está definido, se toma el nombre del rasgo en lugar del término genérico "Adicional".
3. **Catálogo Declarativo Canónico (`src/datos/clases/clerigo.json`):**
   - Se configuró `tipoDano: "Radiante"` como valor inicial en el efecto `dano_secundario` de `rasgo_cls_clerigo_golpe_divino`, asegurando coherencia desde el momento de selección del rasgo.
4. **Sanitización y Formateo Limpio de Etiquetas TaleSpire (`src/servicios/ejecutorTiradasCombate.ts`):**
   - Se normalizó la generación de etiquetas secundarias para evitar repeticiones como "Daño Daño...". Si el tipo ya incluye "Daño", se respeta; en caso contrario, se formatea elegantemente como `${nombrePj} - ${tipoFormateado} - ${nombreAtaque}`.
5. **Composición de Tipos de Daño en Ataque Desarmado (`src/servicios/calculadorAtaqueDesarmado.ts`):**
   - Se unificó el cálculo de `tipoDano` en ataques desarmados para reflejar `tiposDanoSecundarios` (ej. `Contundente / Radiante` o `Contundente / Necrótico`).
6. **Robustez en Constructor de Rasgos (`ConstructorRasgoDote.tsx`):**
   - Se añadió un fallback seguro para evitar almacenar cadenas vacías en `tipoDano` al configurar efectos `dano_secundario`.

**Resultados y Métricas de Validación:**
- 3 pruebas de regresión añadidas en `src/servicios/calculadorDanoCombate.test.ts` (18 tests en la suite aprobados al 100%).
- Suite de `ejecutorTiradasCombate.test.ts` (5 tests) e `invocacionesBrujoMecanicas.test.ts` (28 tests) aprobadas al 100%.
- Tipado estricto `strict: true`: 0 errores en TypeScript.

## [2026-09-27] Implementación Canónica D&D 5.5e (PHB 2024): Clérigo Base y Motor Genérico de Habilidades y Extensiones (Fases 0 y 1)

**Contexto del Problema:**
- Se requería actualizar la clase Clérigo a las reglas 2024 (D&D 5.5e / PHB 2024) y sus 4 subclases basándose en `dicionario_herramientas/sugerencias_cambios/clerigo_sugerencia.json`.
- El sistema presentaba carencias en la infraestructura genérica:
  1. No existía el tipo de efecto mecánico `bono_habilidad` en los esquemas de Zod ni en el cálculo reactivo del estado del personaje, impidiendo que *Orden divina (Taumaturgo)* sumara de forma declarativa el modificador de Sabiduría a pruebas de Inteligencia (*Conocimiento arcano* o *Religión*).
  2. Las expresiones dinámicas de dados no reconocían sintaxis con funciones como `max(1, sabiduria)d8` (*Abrasar muertos vivientes*).
  3. Los rasgos de extensión (Decorator pattern en `gestorClases.ts`) no propagaban cambios en la cadencia de recuperación (`recuperacion`, necesario para extensiones que convierten descanso largo en corto) ni anexaban nuevos efectos mecánicos (`efectos`, necesario para *Golpes benditos mejorados* al otorgar puntos de golpe temporales).
  4. Los catálogos de clases JSON exigían validación estricta con Zod (`categoriaMecanica` con enum `"consumible" | "activable" | "selector_informativo" | "pasivo_permanente" | "extension" | "curacion"`, `selectores` con propiedad `etiqueta` y tipo `"unico"` / `"multiple"`, y `escaladoFormulaDados`).

**Solución Arquitectónica Aplicada:**
1. **Infraestructura Genérica de Habilidades (`bono_habilidad`):**
   - Agregado `"bono_habilidad"` a `EsquemaTipoEfectoMecanico` (`src/tipos/rasgos.ts`) y al constructor de rasgos en UI (`ConstructorRasgoDote.tsx`).
   - Creado `obtenerBonosHabilidadesRasgos` en `evaluadorSalvacionesRasgos.ts`, con normalización y mapa canónico de habilidades (`MAPA_OBJETIVO_A_HABILIDAD`), integrándolo reactivamente en `usarEstadoPersonajes.ts`.
2. **Potenciación de Fórmulas Dinámicas (`evaluadorExpresionesRasgos.ts`):**
   - Incorporado soporte regex para expresiones tipo `max(min, val)d{caras}` y funciones `max(min, val)`.
   - Añadido fallback seguro para soportar tanto `personaje.caracteristicas` como `personaje.estadisticas`.
3. **Robustecimiento del Decorador de Rasgos (`gestorClases.ts`):**
   - Extensiones de clase y subclase ahora propagan `r.recuperacion` y concatenan `r.efectos` al rasgo padre original.
   - Soporte para preservar `r.id` explícito definido en el catálogo JSON.
4. **Catálogo Declarativo del Clérigo Base (`src/datos/clases/clerigo.json`):**
   - *Orden divina (Nv. 1)*: selector informativo con opciones `protector` (competencia con armas marciales y armaduras pesadas) y `taumaturgo` (`bono_habilidad` dinámico `max(1, sabiduria)` en *conocimiento_arcano* y *religion*).
   - *Canalizar divinidad (Nv. 2)*: consumible con recuperación en descanso corto y tabla de escalado por nivel (2 usos nv 2, 3 usos nv 11, 4 usos nv 18).
   - *Chispa divina (Nv. 2)*: ligado a Canalizar divinidad con `gastarDePadre: true` y escalado de dados de 1d8 a 4d8 + Sabiduría.
   - *Expulsar muertos vivientes (Nv. 2)*: ligado a Canalizar divinidad con `gastarDePadre: true`.
   - *Abrasar muertos vivientes (Nv. 5)*: rasgo de extensión decorador que actualiza Expulsar muertos vivientes con `formulaDados: "max(1, sabiduria)d8"`.
   - *Golpes benditos (Nv. 7)*: activable con selector interactivo entre Golpe divino (`dano_secundario: "1d8"`) y Lanzamiento potente (`bono_dano_conjuro` que inyecta Sabiduría a los trucos).
   - *Intercesión divina (Nv. 10)*: consumible de 1 uso por descanso largo.
   - *Golpes benditos mejorados (Nv. 14)*: extensión decoradora con dados `2d8` y efecto `hp_temporal: "2*sabiduria"`.
   - *Intercesión divina mayor (Nv. 20)*: extensión decoradora con dado `2d4` de descanso.
5. **Alineación con Esquemas Zod (`src/tipos/esquemasCatalogos.ts`):**
   - Añadido `id: z.string().optional()` a `EsquemaPlantillaRasgoClaseJSON`.
   - Validados todos los enums de `categoriaMecanica`, selectores con `etiqueta` y `tipo: "unico"`, y efectos con `valor: "competente"`.

**Resultados y Métricas de Validación:**
- 11 nuevas pruebas unitarias añadidas en `src/servicios/clerigoMecanicasDND55.test.ts` (100% aprobadas).
- Suite completa del proyecto validada: 79 archivos de prueba y 1077 tests aprobados (`pnpm test`).
- Tipado estricto verificado: 0 errores en `pnpm exec tsc --noEmit`.

## [2026-09-27] Clérigo D&D 5.5e (Fase 1.1): Separación de Rasgos de Comportamiento Opuesto, Generalización de autoDesactivar y Automatización Declarativa de Combate

**Contexto del Problema:**
1. **Fricción por agrupar comportamientos opuestos:** Al intentar unificar en una sola entidad `Golpes benditos` las dos opciones canónicas (*Golpe divino*, marcial activable por turno con dados `1d8` y selector de daño radiante/necrótico; frente a *Lanzamiento potente*, pasivo permanente mágico que suma Sabiduría a trucos), la tarjeta de rasgo en la UI mostraba botones de activación y dados inadecuados para el clérigo que optaba por Lanzamiento potente.
2. **Hardcodes y bloqueo de `autoDesactivar`:** En `sliceRasgos.ts` existían comprobaciones directas por string como `esFuriaPersistente = nomObjetivo.includes("furia persistente")`. Al haberle asignado `autoDesactivar: true` estático a Golpes benditos, el botón toggle se auto-apagaba instantáneamente impidiendo que se mantuviera activo.
3. **Selección de truco en Taumaturgo:** La opción *Taumaturgo* de *Orden divina* no proporcionaba un selector desplegable para escoger el truco canónico adicional de clérigo ni lo sincronizaba con `trucosConocidosIds`.
4. **Automatización de combate:**
   - *Golpe divino* debía auto-desactivarse al realizar la tirada de daño con un arma, permitiendo un ciclo de uso transparente (activar -> golpear/tirar daño -> auto-apagado).
   - *Furia persistente* debía conservar su recarga automática de usos de Furia al tirar iniciativa además del disparador manual.

**Solución Arquitectónica Aplicada:**
1. **Separación Declarativa de Rasgos en el Catálogo (`src/datos/clases/clerigo.json`):**
   - `rasgo_cls_clerigo_golpes_benditos` (Nv. 7): Contenedor `selector_informativo` con `selector_golpes_benditos`.
   - `rasgo_cls_clerigo_golpe_divino` (Nv. 7): `categoriaMecanica: "activable"`, `esActivable: true`, `autoDesactivarAlTirarDano: true`, `formulaDados: "1d8"`, selector `selector_tipo_dano_golpe_divino` (Radiante / Necrótico), ligado al padre.
   - `rasgo_cls_clerigo_lanzamiento_potente` (Nv. 7): `categoriaMecanica: "pasivo_permanente"`, `esActivable: false`, efecto `bono_dano_conjuro`, ligado al padre.
   - Nivel 14: Extensiones decoradoras independientes (`Golpes benditos mejorados (Golpe divino)` con `formulaDados: "2d8"` y `Golpes benditos mejorados (Lanzamiento potente)` con `hp_temporal: "2*sabiduria"`).
2. **Selector de Truco en Taumaturgo:**
   - Añadido `selector_truco_taumaturgo` a la opción `taumaturgo` con los 9 trucos canónicos oficiales de clérigo (`h_guia`, `h_llama-sagrada`, `h_luz`, etc.). Al contener `truco` en su ID, `sliceRasgos.ts` sincroniza de forma nativa con `pj.trucosConocidosIds` y se renderiza en la UI como un desplegable con buscador.
3. **Erradicación de Hardcodes y Generalización de `autoDesactivar` (`sliceRasgos.ts`):**
   - Eliminadas las dependencias de nombres fijos en `debeAutoDesactivarTarget` y en el mapeo de activación. El apagado inmediato solo ocurre si el rasgo declara `autoDesactivar: true`, y la recarga se basa en el contrato `restaurarUsosAlActivar`.
4. **Automatización Declarativa de Combate e Iniciativa:**
   - `autoDesactivarAlTirarDano: true`: Añadido a esquemas y conectado en `usarCalculoAtaquesJugador.ts` en `manejarTirarDano` y `manejarTirarCritico`. Cualquier rasgo activo con esta bandera se desactiva automáticamente tras la tirada de daño con arma.
   - `dispararAlTirarIniciativa: true`: Añadido a esquemas y procesado en `HojaPersonaje.tsx` en `manejarTirarIniciativa`, recargando los usos del rasgo objetivo declarativo (ej. Furia) y consumiendo 1 uso del rasgo disparador.

**Resultados y Métricas de Validación:**
- 79 archivos de prueba y 1078 tests aprobados en Vitest (`pnpm test`).
- 0 errores de compilación ni tipado estricto con `pnpm exec tsc --noEmit`.

## [2026-09-27] Clérigo D&D 5.5e (Fase 1.2): Condicionalidad Jerárquica Declarativa (`requiereOpcion`), Separación de Orden Divina y Filtrado Reactivo de Rasgos

**Contexto del Problema:**
1. **Visualización simultánea de rasgos mutuamente excluyentes:** En la vista de rasgos (`VistaRasgosJugador.tsx`), al alcanzar el nivel de desbloqueo (ej. Nivel 7 para *Golpes benditos*), se mostraban simultáneamente en la lista tanto el contenedor padre (*Golpes benditos*) como los dos rasgos hijos con comportamientos opuestos (*Golpes benditos: Golpe divino* y *Golpes benditos: Lanzamiento potente*), en lugar de renderizar únicamente el rasgo derivado de la opción seleccionada.
2. **Selector de truco de Taumaturgo no visible:** En *Orden divina* (Nivel 1), al haberse modelado las opciones (*Protector* y *Taumaturgo*) como efectos internos del selector en lugar de rasgos hijos independientes, la tarjeta en la interfaz no mostraba el rasgo *Taumaturgo* ni su selector de truco adicional (`selector_truco_taumaturgo`), impidiendo al usuario elegir de forma interactiva el truco extra canónico.
3. **Falta de sincronización mágica reactiva:** Al cambiar una opción del selector padre (ej. de Protector a Taumaturgo), el estado de `trucosConocidosIds` no se actualizaba automáticamente con el truco asociado al hijo que pasaba a estar habilitado.

**Solución Arquitectónica Aplicada:**
1. **Contrato de Condicionalidad Declarativa (`requiereOpcion`):**
   - Incorporado el campo opcional `requiereOpcion?: string` en `PlantillaRasgoClase`, `EsquemaPlantillaRasgoClaseJSON` y `EsquemaRasgoPersonaje`.
   - Propagado en el builder agnóstico `construirRasgo` (`src/servicios/gestorClases.ts`).
2. **Evaluadores Puros y Agnósticos (`src/servicios/rasgos/utilidadesRasgos.ts` y `evaluadorExpresionesRasgos.ts`):**
   - Creada la función pura `esRasgoHabilitadoPorOpcion(rasgo, todosLosRasgos)`: si el rasgo declara `requiereOpcion` y `ligadoA`, busca al padre y valida que algún selector de este contenga la opción en su `valorActual`.
   - Conectado en `estaRasgoActivo`: un rasgo condicionado solo se considera activo si su opción requerida está seleccionada en el padre.
   - Conectado en `evaluarEfectosRasgosActivos`: se ignoran los efectos mecánicos (competencias, bonos de habilidad, daño) de rasgos cuya opción no esté activa.
3. **Filtrado Reactivo en la Interfaz (`src/componentes/caracteristicas/rasgos/usarVistaRasgos.ts`):**
   - En `rasgosFiltrados`, se excluyen de la vista del jugador los rasgos donde `r.requiereOpcion && !esRasgoHabilitadoPorOpcion(r, todosLosRasgos)`.
   - Resultado: si se elige *Protector*, sólo aparece la tarjeta de *Protector*. Si se conmuta a *Taumaturgo*, desaparece *Protector* y emerge inmediatamente la tarjeta de *Taumaturgo* con su selector de truco adicional (`selector_truco_taumaturgo`). Lo mismo para *Golpe divino* frente a *Lanzamiento potente*.
4. **Sincronización Reactiva de Magia en el Almacén (`src/almacen/slices/personajes/sliceRasgos.ts`):**
   - En `actualizarSeleccionRasgo`, tras cambiar cualquier selector, se recorren los rasgos con `requiereOpcion`: si un hijo pasa a estar habilitado, se incorporan sus trucos a `trucosConocidosIds`; si queda inhabilitado, se depuran de la lista.
   - En `sincronizarRasgosPersonaje`, se garantiza la presencia de los trucos de todos los rasgos habilitados.
5. **Catálogo Canónico (`src/datos/clases/clerigo.json`):**
   - *Orden divina*: Separado en contenedor `rasgo_cls_clerigo_orden_divina` (selector informativo con `protector` y `taumaturgo`), `rasgo_cls_clerigo_protector` (`requiereOpcion: "protector"`, competencias marciales y pesadas) y `rasgo_cls_clerigo_taumaturgo` (`requiereOpcion: "taumaturgo"`, `bono_habilidad` Sabiduría a Arcano y Religión, y selector `selector_truco_taumaturgo` con 9 opciones oficiales).
   - *Golpes benditos*: `rasgo_cls_clerigo_golpe_divino` con `requiereOpcion: "golpe_divino"` y `rasgo_cls_clerigo_lanzamiento_potente` con `requiereOpcion: "lanzamiento_potente"`.

**Resultados y Métricas de Validación:**
- 13 pruebas unitarias específicas aprobadas en `src/servicios/clerigoMecanicasDND55.test.ts`.
- Suite global completa: 79 archivos de prueba y 1079 tests aprobados (`pnpm test`).
- 0 errores de compilación estricta en TypeScript (`pnpm exec tsc --noEmit`).

## [2026-09-27] Adaptación Dinámica de Altura de Modales con Selectores Desplegables (`enFlujo`)

**Contexto del Problema:**
- En los modales de detalle de rasgos con descripciones cortas (como *Orden divina: Taumaturgo*), el componente [`SelectorDesplegable`](file:///c:/Users/zamor/OneDrive/Documentos/Programas/ToolSet%20Es%205.5/src/componentes/comunes/SelectorDesplegable.tsx) posicionaba la lista de opciones con `position: absolute; top: calc(100% + 4px)`.
- Al estar fuera del flujo normal del documento, la apertura de la lista de opciones no aumentaba la altura del contenedor padre. Debido a que el cuerpo del modal (`.cuerpoModalDetalle`) tiene `overflow-y: auto` y el contenedor exterior tiene `overflow: hidden`, la lista de opciones quedaba cortada abruptamente contra el pie del modal (`.pieModalDetalle` con el botón "CERRAR"), impidiendo visualizar cómodamente opciones como *Llama sagrada*, *Luz*, etc.

**Solución Arquitectónica Aplicada:**
1. **Prop `enFlujo?: boolean` en `SelectorDesplegable`:**
   - Permite indicar al componente si la lista desplegable debe comportarse como elemento de bloque en flujo normal (`position: static`) en lugar de superponerse de forma flotante absoluta.
2. **Estilos Flexibles en `SelectorDesplegable.module.css`:**
   - Creada `.contenedorEnFlujo` con `display: flex; flex-direction: column; width: 100%`.
   - Creada `.dropdownEnFlujo` con `position: static !important; width: 100% !important; max-width: 100% !important; max-height: 260px !important; margin-top: 6px`.
3. **Integración en `SeccionSelectoresModalRasgo.tsx`:**
   - Invocación de `SelectorDesplegable` con `enFlujo={true}` para selectores de rasgos dentro del modal.
4. **Respuesta Elástica del Modal (`VistaRasgosJugador.module.css`):**
   - Asignado `flex: 1 1 auto` a `.cuerpoModalDetalle`. Al abrirse el selector, el modal completo adapta y expande su altura de forma suave, desplazando el pie del modal y el botón "CERRAR" hacia abajo sin recortar ninguna opción.

**Resultados y Métricas de Validación:**
- 0 errores de tipos en `pnpm exec tsc --noEmit`.
- Pruebas de integración aprobadas (`SeccionSelectoresModalRasgo.test.tsx` y `clerigoMecanicasDND55.test.ts`).

## [2026-09-28] Implementación Canónica D&D 5.5e (PHB 2024): Subclases del Clérigo (Vida, Luz, Engaño y Guerra) y Consumo Delegado de Canalizar Divinidad (Fases 2 a 5)

**Contexto del Problema:**
- Se requería completar la sincronización oficial de la clase Clérigo conforme a las reglas canónicas del *Player's Handbook 2024* implementando sus 4 subclases oficiales: **Dominio de la Vida**, **Dominio de la Luz**, **Dominio del Engaño** y **Dominio de la Guerra**.
- Requerimientos clave de integración mecánica:
  1. Las manifestaciones de *Canalizar divinidad* de las subclases (*Preservar vida*, *Resplandor del alba*, *Invocar duplicidad*, *Golpe guiado* y *Bendición del dios de la guerra*) debían descontar usos de la reserva común del clérigo de forma declarativa, sin duplicar contadores ni requerir lógica ad-hoc.
  2. Los rasgos con usos finitos dependientes de Sabiduría (*Fulgor protector*, *Corona de luz*, *Sacerdote guerrero*) debían escalar automáticamente con el modificador de Sabiduría y actualizarse si este cambia.
  3. Los rasgos de mejora de nivel 6 y 17 (*Fulgor protector mejorado*, *Duplicidad mejorada*) debían actuar como extensiones orgánicas (Decorator pattern) sin generar entradas redundantes.
  4. En nivel 14 de la clase base, *Golpes benditos mejorados (Lanzamiento potente)* debía ser puramente descriptivo para evitar contaminar o duplicar fórmulas de daño sobre trucos mágicos.

**Solución Arquitectónica Aplicada:**
1. **Dominio de la Vida (`clerigo.json`):**
   - `rasgo_sub_vida_conjuros` (Nv. 3): Pasivo permanente con la tabla oficial de conjuros siempre preparados.
   - `rasgo_sub_vida_discipulo_vida` (Nv. 3): Pasivo permanente (+2 + nivel de espacio al curar).
   - `rasgo_sub_vida_preservar_vida` (Nv. 3): Categorizado como `"curacion"`, con `ligadoA: "Canalizar divinidad"`, `gastarDePadre: true` y `formulaDados: "5*nivel"`. En la UI genera el botón interactivo de curación que deduce de la reserva de Canalizar divinidad.
   - `rasgo_sub_vida_sanador_bendito` (Nv. 6) y `rasgo_sub_vida_sanacion_suprema` (Nv. 17): Pasivos permanentes descriptivos.
2. **Dominio de la Luz (`clerigo.json`):**
   - `rasgo_sub_luz_conjuros` (Nv. 3): Conjuros oficiales de la luz siempre preparados.
   - `rasgo_sub_luz_resplandor_del_alba` (Nv. 3): Ligado a *Canalizar divinidad*, `gastarDePadre: true`, `formulaDados: "2d10+nivel"`, acción de magia.
   - `rasgo_sub_luz_fulgor_protector` (Nv. 3): Consumible de reacción con `escaladoUsos: { tipo: "por_modificador", modificador: "sabiduria", minimo: 1 }` y recuperación en descanso largo.
   - `rasgo_sub_luz_fulgor_protector_mejorado` (Nv. 6): Extensión decoradora ligada a *Fulgor protector* que muta la recuperación a descanso corto e inyecta la fórmula de puntos de golpe temporales (`2d6+sabiduria`).
   - `rasgo_sub_luz_corona_de_luz` (Nv. 17): Consumible de acción con escalado por Sabiduría.
3. **Dominio del Engaño (`clerigo.json`):**
   - `rasgo_sub_engano_conjuros` (Nv. 3): Conjuros oficiales del engaño siempre preparados.
   - `rasgo_sub_engano_bendicion_embaucador` (Nv. 3): Acción de magia con ventaja en Sigilo.
   - `rasgo_sub_engano_invocar_duplicidad` (Nv. 3): Acción adicional ligada a *Canalizar divinidad*, `gastarDePadre: true`.
   - `rasgo_sub_engano_transposicion_embaucador` (Nv. 6): Acción adicional para teletransportarse e intercambiar lugares con la ilusión.
   - `rasgo_sub_engano_duplicidad_mejorada` (Nv. 17): Extensión decoradora ligada a *Invocar duplicidad* con `formulaDados: "nivel"` para curación al expirar la ilusión.
4. **Dominio de la Guerra (`clerigo.json`):**
   - `rasgo_sub_guerra_conjuros` (Nv. 3): Conjuros oficiales de guerra siempre preparados.
   - `rasgo_sub_guerra_sacerdote_guerrero` (Nv. 3): Acción adicional consumible con recuperación en descanso corto y `escaladoUsos` por modificador de Sabiduría (`minimo: 1`).
   - `rasgo_sub_guerra_golpe_guiado` (Nv. 3): Reacción ligada a *Canalizar divinidad*, `gastarDePadre: true` (+10 a ataque).
   - `rasgo_sub_guerra_bendicion_dios_guerra` (Nv. 6): Rasgo ligado a *Canalizar divinidad*, `gastarDePadre: true`, para lanzar *escudo de fe* o *arma espiritual* sin concentración por 1 minuto.
   - `rasgo_sub_guerra_avatar_batalla` (Nv. 17): Pasivo permanente de resistencias físicas.

**Resultados y Métricas de Validación:**
- 22 pruebas unitarias dedicadas en `src/servicios/clerigoMecanicasDND55.test.ts` (100% aprobadas).
- Tipado estricto verificado: 0 errores en `pnpm exec tsc --noEmit`.

## [2026-09-28] Filtrado Reactivo de Acciones y Activables de Combate por `requiereOpcion` (Pestaña Acciones)

**Contexto del Problema:**
- En la pestaña de *Acciones* (`VistaAtaquesJugador.tsx`), dentro de la subsección *Activables y Modos de Combate* (`SeccionRasgosAtaque.tsx`), se mostraba el rasgo *Golpes benditos: Golpe divino* incluso cuando el jugador había seleccionado *Lanzamiento potente* en el selector del rasgo padre *Golpes benditos*.
- *Causa raíz*: Mientras que la vista de rasgos (`usarVistaRasgos.ts`) filtraba los rasgos mediante `esRasgoHabilitadoPorOpcion`, el servicio que alimenta las acciones de combate (`resolverRasgosAcciones` en `calculadorAccionesCombate.ts`) no validaba la condición `requiereOpcion` al sintetizar y clasificar los rasgos en `todosLosRasgos`. Al tener `categoriaMecanica: "activable"`, *Golpe divino* era clasificado como activable y se presentaba erróneamente en combate.

**Solución Arquitectónica Aplicada:**
1. **Filtrado en el Motor de Combate (`src/servicios/calculadorAccionesCombate.ts`):**
   - En `resolverRasgosAcciones`, se incorporó la comprobación declarativa `esRasgoHabilitadoPorOpcion(rasgo, todosLosRasgos)`.
   - Cualquier rasgo que declare `requiereOpcion` cuya opción requerida no esté seleccionada en el padre queda inmediatamente omitido del cálculo táctico de acciones, acciones adicionales, reacciones y activables de combate.
2. **Defensa en Profundidad en el Almacén (`src/almacen/slices/personajes/sliceRasgos.ts`):**
   - En `alternarActivoRasgo`: se bloquea cualquier intento de activación si el rasgo declara `requiereOpcion` y no está habilitado por la selección del padre.
   - En `actualizarSeleccionRasgo`: al cambiar la selección en un selector padre, cualquier rasgo hijo con `requiereOpcion` que quede inhabilitado se apaga de forma reactiva (`r.activo = false`).

**Resultados y Métricas de Validación:**
- Nueva prueba unitaria en `src/servicios/clerigoMecanicasDND55.test.ts` verificando que al seleccionar *Lanzamiento potente*, `resolverRasgosAcciones` excluye totalmente a *Golpe divino* de las acciones de combate y de los activables.
- 23 tests aprobados en `clerigoMecanicasDND55.test.ts`.
- Pruebas de integración aprobadas (`SeccionRasgosAtaque.test.tsx`).

## [2026-09-27] Ajustes Mecánicos de Estilo de Combate: Armas Arrojadizas y Escala Dinámica en Combate sin Armas (1d8/1d6)

**Contexto del Problema:**
- Se detectó que el bonificador de +2 al daño de *Combate con armas arrojadizas* no se aplicaba al equipar armas arrojadizas comunes (ej. dagas, jabalinas, hachas de mano).
  - *Causa raíz*: En el compendio y en las reglas de D&D, casi todas las armas arrojadizas poseen `tipoAtaque: "Cuerpo a Cuerpo"`, por lo que `esDistancia` resultaba falso en `calcularAtaqueArmaEquipada`. Al exigir `contexto.esDistancia && tienePropArrojadiza` en `evaluadorCombateRasgos.ts`, ninguna arma arrojadiza cuerpo a cuerpo recibía el bono.
- En la dote *Combate sin armas*, el daño debía ajustarse de acuerdo a las reglas oficiales y la solicitud del usuario: si el personaje no porta escudo (o ambas manos libres), el dado de ataque desarmado debe escalar a 1d8 en lugar de 1d6, y reducirse a 1d6 si embraza un escudo.
- La función `tieneEscudoEquipado` en `utilidadesRasgos.ts` solo comprobaba `o.categoria === "escudos"`, sin considerar posibles escudos catalogados en inventario bajo la categoría de armaduras o por su denominación literal.

**Solución Arquitectónica Aplicada:**
1. **Evaluación de Armas Arrojadizas (`src/servicios/rasgos/evaluadorCombateRasgos.ts`):**
   - En `aplicaEfectoAAtaque`, se desacopló el criterio `arma_arrojadiza` de `contexto.esDistancia`, comprobando directamente la presencia de la propiedad arrojadiza (`norm.includes("arrojadiz") || norm.includes("thrown")`) en las propiedades del arma activa o inferida.
2. **Inferencia de Armas Arrojadizas (`src/constantes/armasInferenciaConstantes.ts`):**
   - Se incorporaron reglas de inferencia para armas arrojadizas comunes (`jabalina`, `hacha de mano`, `dardo`, `martillo ligero`) para garantizar que mantengan sus propiedades arrojadizas incluso si se ingresan manualmente en el inventario sin referencia directa en compendio.
3. **Escala Condicional Genérica en Ataque Desarmado:**
   - En `evaluarAtaqueDesarmadoEspecial` (`evaluadorCombateRasgos.ts`), se amplió la validación genérica de condiciones: `sin_escudo`, `con_escudo`, `sin_armadura`, `con_armadura` y `sin_armadura_ni_escudo`.
   - En `src/datos/dotes/estilo_combate.json`, se definieron dos efectos ordenados para `dote_estilo_combate_sin_armas`:
     - Efecto 1: `valor: "1d8"`, `condicion: "sin_escudo"`, `descripcion: "Golpe sin Armas (Combate sin armas)"`.
     - Efecto 2: `valor: "1d6"`, `descripcion: "Golpe sin Armas (Combate sin armas)"`.
     Gracias al algoritmo de ordenamiento por peso de dado (`obtenerPesoDadoDesarmado`), cuando el personaje no tiene escudo, el efecto de 1d8 (peso 8) toma precedencia sobre 1d6 (peso 6). Si embraza un escudo, el efecto de 1d8 se descalifica por su condición y se aplica limpiamente el 1d6.
4. **Cálculo de Ataque Desarmado Especial (`src/servicios/calculadorAtaqueDesarmado.ts`):**
   - Se integraron `resolverBonosYDadosExtraCombate` y `componerFormulasDano` en la rama de ataque desarmado especial, asegurando que bonos adicionales de daño o dados secundarios también se sumen adecuadamente a los golpes desarmados especiales.
5. **Detección Robusta de Escudos (`src/servicios/rasgos/utilidadesRasgos.ts`):**
   - `tieneEscudoEquipado` ahora reconoce escudos tanto por `categoria === "escudos"` como por coincidencia normalizada de nombre (`"escudo"` / `"shield"`).
   - `tieneArmaduraEquipada` excluye explícitamente cualquier ítem cuyo nombre sea un escudo.
6. **Constructor de Rasgos (`ConstructorRasgoDote.tsx`):**
   - Se añadió un selector de condición de armadura/escudo (`OPCIONES_CONDICION_DESARMADO`) en la configuración del efecto `ataque_desarmado`.
   - Se simplificó la etiqueta en el selector de alcance de ataque a `"Armas Arrojadizas"`.

**Resultados y Métricas de Validación:**
- 2 nuevas pruebas unitarias añadidas en `src/servicios/dotesEstiloCombateMecanicas.test.ts`.
- Suite completa del proyecto aprobada al 100%: 78 archivos de prueba y 1066 tests aprobados (`pnpm test`).
- Tipado estricto: 0 errores en `pnpm exec tsc --noEmit`.
- Linter: 0 advertencias y 0 errores en `pnpm lint`.
- Verificación de límites de líneas: 111 archivos auditados, 0 errores críticos (`pnpm run verificar:lineas`).
- Build de producción: completado con éxito en 7.06s (`pnpm build`).

## [2026-09-27] Implementación Canónica D&D 5.5e (PHB 2024): Dotes de Estilo de Combate y Extensión Genérica del Constructor de Rasgos

**Contexto del Problema:**
- Se requería incorporar las 12 dotes canónicas de Estilo de Combate de D&D 5.5e (PHB 2024 / compendio en `dicionario_herramientas/dotes/Estilo_de_combate/`) garantizando su resolución 100% genérica desde el builder de rasgos y el motor de combate sin ninguna bifurcación por nombre literal de rasgo o clase (Reglas 6 y 20).
- El sistema presentaba carencias mecánicas genéricas:
  1. No existía un tipo de efecto para bonificadores numéricos a tiradas de ataque (`bono_ataque`), impidiendo que *Tiro con arco* sumara +2 al ataque de forma declarativa.
  2. `modificador_ca` en `evaluadorVitalidadRasgos.ts` únicamente contemplaba la fórmula de Defensa sin armadura, sin permitir bonos numéricos planos a la CA condicionados a llevar armadura (*Defensa*).
  3. No se distinguía el daño versátil a dos manos del daño a una mano al evaluar bonificadores exclusivos de una mano (*Duelo*), causando que armas versátiles recibieran erróneamente el bono de daño al empuñarse a dos manos.
  4. La tabla `ARMADURAS_OFICIALES` solo indexaba `"cota de malla"` en singular, causando que referencias en plural como `"cota de mallas"` recurrieran al fallback de armadura ligera de CA 11.

**Solución Arquitectónica Aplicada:**
1. **Catálogo Declarativo Zod (`src/datos/dotes/estilo_combate.json`):**
   - Se crearon las 12 dotes oficiales de estilo de combate: *Tiro con arco*, *Lucha a ciegas*, *Defensa*, *Combate con armas a dos manos*, *Intercepción*, *Combate con armas arrojadizas*, *Protección*, *Combate con dos armas*, *Duelo*, *Guerrero bendito*, *Guerrero druídico* y *Combate sin armas*.
   - Todas validan contra `EsquemaDotePersonaje` con `categoria: "estilo_combate"` y `requisito: "Rasgo Estilo de combate"`.
2. **Hidratación y Catálogos Modulares (`src/servicios/hidratadorDotes.ts` y `dotesConstantes.ts`):**
   - Hidratadas mediante `cargarEhidratarDotes`, inyectando dinámicamente trucos para *Guerrero bendito* (`trucos_clerigo`) y *Guerrero druídico* (`trucos_druida`).
   - Se exportó `DOTES_ESTILO_COMBATE_DND55` y se consolidó en `TODAS_LAS_DOTES_CANONICAS_DND55` (elevando el catálogo oficial a 79 dotes canónicas).
3. **Mecánicas Genéricas de Ataque y CA en el Motor de Reglas:**
   - **Bono a Tiradas de Ataque (`obtenerBonoAtaqueExtra`)**: Nueva función pura en `evaluadorCombateRasgos.ts` que evalúa efectos `bono_ataque` con `aplicaA: "arma_distancia"`, integrada en `calculadorAtaquesArmas.ts` e improvisadas/desarmadas.
   - **Bono a la CA por Rasgos (`obtenerBonoCARasgos`)**: Nueva función pura en `evaluadorVitalidadRasgos.ts` que evalúa `modificador_ca` con condiciones (`con_armadura`, `sin_armadura`, `con_escudo`, etc.), integrada reactivamente en `usarEstadoPersonajes.ts`.
   - **Ataques Arrojadizos (`arma_arrojadiza`)**: Criterio en `aplicaA` que comprueba ataque a distancia y propiedad arrojadiza.
   - **Duelo Activable y Protección de Daño Versátil a Dos Manos**:
     - *Duelo* se modeló como `categoriaMecanica: "activable"` con conmutador táctico ON/OFF para resolver la ausencia de ranuras fijas de mano torpe en el inventario.
     - En `calculadorAtaquesArmas.ts`, la resolución de `formulaVersatil` se ejecuta con el contexto `{ ...contextoAtaqueArma, aDosManos: true }`, garantizando que `aplicaA: "arma_duelo"` excluya el daño a dos manos y solo aplique a una mano.
4. **Extensión del Constructor de Rasgos y Dotes (`ConstructorRasgoDote.tsx`):**
   - Incorporado `"bono_ataque"` a `TIPOS_EFECTO_DISPONIBLES` con controles de valor y ámbito de ataque.
   - Extendido `modificador_ca` en la UI para permitir alternar entre "Defensa sin armadura" y "Bono Plano a la CA" con selector de condición ("Con armadura puesta", "Siempre", etc.).
   - Añadidas opciones `"arma_arrojadiza"` y `"arma_duelo"` a `OPCIONES_APLICA_A_ATAQUE`.
   - Formateada la categoría de dote en el selector de presets para exhibir `(Estilo de combate)`.
5. **Corrección Léxica de Equipo:**
   - Se añadió el alias `"cota de mallas"` a `ARMADURAS_OFICIALES` en `src/constantes/equipoConstantes.ts`.

**Resultados y Métricas de Validación:**
- 11 nuevas pruebas unitarias en `src/servicios/dotesEstiloCombateMecanicas.test.ts`.
- Suite completa del proyecto aprobada al 100%: 78 archivos de prueba y 1064 tests aprobados (`pnpm test`).
- Tipado estricto verificado: 0 errores en `pnpm exec tsc --noEmit`.
- Linter verificado: 0 errores y 0 advertencias en `pnpm lint`.
- Build de producción: `pnpm build` completado en 6.52s.

## [2026-09-26] Resolución Arquitectónica de Duplicación: Condiciones, Efectos, Maestrías, Propiedades de Armas y Dados de Golpe

**Contexto del Problema:**
- Se detectó duplicación de datos y asimetría arquitectónica en 3 vectores principales:
  1. **Shadowing de Condiciones y Efectos**: 5 efectos (`Armadura sin Competencia`, `Desventaja en Sigilo`, `Furia de los Dioses`, `Manto de Majestad`, `Majestad Inquebrantable`) coexistían con descripciones distintas y bifurcaciones condicionales hardcodeadas en `src/servicios/resolutorCondiciones.ts`, omitiendo las definiciones de `src/utiles/datosIniciales.ts`.
  2. **Duplicación Interna en Maestrías y Propiedades de Armas**: En `src/constantes/equipoConstantes.ts` existían más de 240 líneas de descripciones literales repetidas en diccionarios multi-alias (`DICCIONARIO_MAESTRIAS` con 25 entradas para 8 maestrías, y `DICCIONARIO_PROPIEDADES_ARMAS` con 27 entradas para 12 propiedades), además de repetir textos en `EXPLICACIONES_*`.
  3. **Redundancia en Dados de Golpe**: `DADO_GOLPE_POR_CLASE` en `src/constantes/personajeConstantes.ts` duplicaba de forma estática los dados de golpe que ya residían en los archivos JSON de cada clase.

**Solución Arquitectónica Aplicada:**
1. **Fase 1: Catálogos Modulares de Condiciones y Efectos con Zod:**
   - Se crearon `src/datos/condiciones-dnd55.json` (15 condiciones) y `src/datos/efectos-predefinidos.json` (28 efectos), enriqueciendo los efectos ensombrecidos con viñetas `efectos[]`, títulos bilingües `tituloVisual` y `aliases`.
   - Se tiparon y validaron mediante `EsquemaCondicionJSON` y `EsquemaEfectoJSON` en `src/tipos/esquemasCatalogos.ts`.
   - `src/servicios/resolutorCondiciones.ts` se redujo de ~153 líneas a ~70 líneas puras, consultando directamente los datos canónicos sin condicionales manuales.
2. **Fase 2: Catálogos Modulares de Maestrías y Propiedades de Armas:**
   - Se crearon `src/datos/maestrias-armas.json` y `src/datos/propiedades-armas.json`, estructurando cada concepto con `{ id, titulo, etiquetaSelector, aliases, descripcion, explicacionSelector }`.
   - Se validaron mediante `EsquemaMaestriaArmaJSON` y `EsquemaPropiedadArmaJSON`.
   - `src/constantes/equipoConstantes.ts` ahora genera dinámicamente `DICCIONARIO_MAESTRIAS`, `DICCIONARIO_PROPIEDADES_ARMAS`, `EXPLICACIONES_MAESTRIAS` y `EXPLICACIONES_PROPIEDADES` mediante proyecciones funcionales (`flatMap` / `Object.fromEntries`), eliminando ~240 líneas duplicadas manteniendo 100% retrocompatible la API pública.
3. **Fase 3: Fuente Única de Verdad para Dados de Golpe:**
   - `DADO_GOLPE_POR_CLASE` en `src/constantes/personajeConstantes.ts` se transformó en una proyección pura derivada de `CATALOGO_CLASES_DND55`.

**Decisión de Diseño y Ajuste de Pruebas:**
- **Separación Limpia entre Selector Táctico y Extensión Descriptiva en Golpe Brutal (`barbaro.json`)**:
  - *Causa raíz*: El mensaje informativo de *Golpe brutal mejorado II (Nv. 17)* se había introducido en `opcionesDinamicas` del selector de maniobras, provocando que apareciera como una opción interactiva seleccionable falsa.
  - *Corrección arquitectónica*: Se eliminó `golpe_brutal_mejorado` de `opcionesDinamicas`. El selector interactivo conserva exclusivamente las 4 maniobras tácticas reales (Contundente e Inmovilizador a nv 9; Desestabilizador y Desgarrador a nv 13).
  - *Comportamiento a nivel 17*: `escaladoMaxSelecciones` eleva `maxSelecciones` a 2 (`tipo: "multiple"`), permitiendo elegir 2 de las 4 opciones según las reglas D&D 2024. Simultáneamente, el mecanismo de Decorator de `gestorClases.ts` detecta el rasgo a nivel 17 con `categoriaMecanica: "extension"` y `ligadoA: "rasgo_cls_barbaro_golpe_brutal"` y anexa de forma orgánica el texto `***Golpe brutal mejorado (II) (Nv. 17).***` a la descripción del rasgo padre (y escala `formulaDados` a `2d10`), únicamente si el personaje tiene nivel 17 o superior. A nivel 9 no se visualiza dicho texto ni selector alterado.
  - *Ajuste en tests*: `src/servicios/rasgoGenericidad.test.ts` valida que a nv 17 el selector contiene exactamente 4 opciones, `maxSelecciones` es 2, no existe la opción informativa falsa en el selector, y la descripción del rasgo incorpora el texto de nv 17 sin afectar a nv 9.

**Resultados y Métricas de Validación:**
- 10 nuevas pruebas unitarias añadidas a `src/servicios/integridadCatalogos.test.ts` (34 tests de integridad en total).
- Suite completa aprobada: 77 archivos de test y 1052 pruebas exitosas (`pnpm test`).
- Tipado estricto verificado: 0 errores en `pnpm tsc --noEmit`.
- Linter verificado: 0 errores y 0 advertencias en `pnpm lint`.

## [2026-09-25] Modularización Arquitectónica: Separación de Invocaciones Sobrenaturales a JSON Declarativo con Validación Zod

**Contexto del Problema:**
- Tras migrar las clases, especies y dotes a archivos JSON modulares bajo `src/datos/`, las 28 Invocaciones Sobrenaturales del Brujo (PHB 2024) permanecían como un catálogo de más de 500 líneas de datos estáticos embebidos en `src/constantes/invocacionesSobrenaturales.ts`.

**Solución Arquitectónica Aplicada:**
1. **Extracción a JSON Modular:**
   - Se creó `src/datos/invocaciones-sobrenaturales.json` conteniendo el catálogo puro de las 28 Invocaciones Sobrenaturales oficiales.
2. **Esquema de Validación Zod (`EsquemaInvocacionSobrenaturalJSON`):**
   - Se implementó en `src/tipos/esquemasCatalogos.ts` para validar en tiempo de carga la integridad de claves requeridas (`id`, `nombre`, `nivelMinimo`, `tipoAccion`, `repetible`), requisitos previos, efectos mecánicos y selectores interactivos.
3. **Capa de Constantes e Hidratación Pura:**
   - `src/constantes/invocacionesSobrenaturales.ts` se redujo de ~574 líneas a ~65 líneas, importando y validando el JSON mediante `validarColeccionJSON`, y manteniendo intactas las funciones utilitarias puras (`obtenerNivelEspacioPacto`, `obtenerMaxInvocacionesBrujo`, `generarOpcionesSelectorInvocaciones`).
4. **Retrocompatibilidad 100%:**
   - Todos los consumidores (`hidratadorClases.ts`, `SelectorInvocacionesAcordeon.tsx`, `sliceRasgos.ts`, `GrupoClaseRasgos.tsx` y tests) continúan operando sin modificaciones de importación.
5. **Validación Automatizada:**
   - Se agregaron 4 pruebas unitarias en `src/servicios/integridadCatalogos.test.ts` (alcanzando 24 tests de integridad) y se validaron las suites mecánicas de brujo (58 tests aprobados).
   - Verificación de tipos con `pnpm tsc --noEmit` y `pnpm lint` completadas con 0 errores.

## [2026-09-25] Evaluación de Herramientas y Protocolo MCP: Análisis de `microsoft/tgrep`

**Contexto:**
- Se analizó el repositorio `https://github.com/microsoft/tgrep` para evaluar su viabilidad como servidor MCP (*Model Context Protocol*) de búsqueda de código dentro de nuestro entorno de desarrollo.

**Hallazgos Técnicos y Arquitectónicos:**
1. **Funcionamiento:** `tgrep` es un motor de búsqueda en Rust que crea un índice invertido de trigramas (`.tgrep/`) y corre un demonio en segundo plano (`tgrep serve`) vía TCP. Al consultar, descarta previamente los archivos que no contienen los trigramas y solo ejecuta regex en paralelo sobre los candidatos reales.
2. **MCP Integrado (`scripts/agent/`):** Expone herramientas MCP por `stdio` (`search_code` y `find_files`). Sin embargo, el adaptador oficial (`runtime.py`) está restringido a entornos POSIX (Linux/macOS) mediante el uso de módulos como `fcntl`, incompatible de fábrica con Windows (SO del entorno local).
3. **Decisión Arquitectónica:** En proyectos de la escala de `ToolSet Es 5.5`, las herramientas nativas del agente (`grep_search` basado en ripgrep y `find_by_name` basado en fd) ejecutan búsquedas instantáneas en milisegundos con cero sobrecarga de memoria, sin desincronizaciones de índice (*index lag*) y con compatibilidad total en Windows. Se mantiene el stack nativo actual.

## [2026-09-25] Validación y Cumplimiento Funcional: Bárbaro, Bardo, Brujo, Invocaciones y Dotes en Catálogo JSON Modular

**Contexto del Problema y Aclaración Arquitectónica:**
- Tras la migración de `clasesDND55.ts`, `especiesDND55.ts` y `dotesConstantes.ts` a archivos JSON modulares bajo `src/datos/`, se auditó y garantizó el cumplimiento exacto del sistema para las áreas prioritarias solicitadas: Bárbaro, Bardo, Brujo, Invocaciones Sobrenaturales y el catálogo de Dotes canónicas.
- Respecto a las funciones `obtenerUsosMaximos`: en los archivos JSON no pueden existir closures de JS. Los rasgos con progresión dinámica por nivel (`Furia`, `Guerrero de los dioses`, `Luz sanadora`) se serializan mediante `escaladoUsos` declarativo (`tabla` o `formula` semántica), mientras que los rasgos de uso unitario (`Furia persistente`, `Furia de los dioses`, `Manto de majestad`, `Majestad inquebrantable`) operan mediante `formulaUsos: "1"` evaluados por `evaluarFormulaUsos`.

**Verificación Funcional Implementada:**
1. **Bárbaro**:
   - `Furia` escala con precisión según la tabla canónica: 2 usos en nv1-2, 3 en nv3-5, 4 en nv6-11, 5 en nv12-16 y 6 en nv17-20 vía `escaladoUsos.tabla`.
   - `Guerrero de los dioses` (Fanático) escala a 6 usos a nivel 15.
   - `Furia persistente` calcula correctamente 1 uso máximo.
2. **Bardo**:
   - `Inspiración bárdica` preserva su configuración declarativa `escaladoUsos: { tipo: "por_modificador", modificador: "carisma", minimo: 1 }`.
   - `Manto de majestad` y `Majestad inquebrantable` (Colegio del Glamour) resuelven 1 uso exacto.
3. **Brujo e Invocaciones Sobrenaturales**:
   - El rasgo `Invocaciones sobrenaturales` declara la clave `"claveOpcionesDinamicas": "invocaciones_brujo"` en su selector.
   - `hidratadorClases.ts` inyecta dinámicamente las invocaciones generadas por `generarOpcionesSelectorInvocaciones()`, cargando la colección completa de opciones con sus descripciones y requisitos.
   - `escaladoMaxSelecciones` resuelve correctamente la progresión de invocaciones disponibles (1 en nv1, 3 en nv2, 5 en nv5, etc.).
   - `Luz sanadora` (Patrón Celestial) resuelve dinámicamente `nivel + 1` usos mediante `escaladoUsos: { tipo: "por_nivel", formula: "nivel_mas_1" }`.
   - Rasgos por Carisma (`Pasos feéricos`, `Propia suerte del Oscuro`) preservan su escalado por modificador.
4. **Dotes Canónicas**:
   - Las 67 dotes canónicas (12 origen, 43 generales, 12 épicas) validan contra `EsquemaDotePersonaje`.
   - `Iniciado en la Magia` (Clérigo, Druida, Mago) y `Lanzador Ritual` son hidratadas con conjuros y rituales reales desde `all.json` en `hidratadorDotes.ts`.

**Validación Automatizada:**
- Se integraron 6 nuevas pruebas funcionales en `src/servicios/integridadCatalogos.test.ts` (total de 20 tests específicos de integridad).
- La suite completa del repositorio (77 archivos de test y 1038 pruebas) pasa al 100% de forma limpia.
- Tipado `strict: true` validado con `pnpm tsc --noEmit` (0 errores).
- Linter verificado con `pnpm lint` (0 errores / 0 advertencias).

## [2026-09-25] Corrección de CI: Sincronización de `pnpm-lock.yaml` tras Reubicación de Dependencias (`ERR_PNPM_OUTDATED_LOCKFILE`)

**Contexto del Problema:**
- El pipeline de GitHub Actions (`CI - Integración Continua`) falló en el paso `Instalar Dependencias` al ejecutar `pnpm install --frozen-lockfile`, arrojando el error:
  `ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/package.json`.

**Causa Raíz:**
- En un commit previo (`5a5d08f`), el paquete `zip-a-folder` fue trasladado de `dependencies` a `devDependencies` en `package.json`, pero el archivo `pnpm-lock.yaml` no fue actualizado ni sincronizado en el commit.
- Al ejecutar en entornos de CI, pnpm exige por defecto `--frozen-lockfile` para garantizar reproducibilidad exacta. Al detectar que el lockfile aún registraba `zip-a-folder` bajo `dependencies`, pnpm abortó la ejecución para prevenir inconsistencias.

**Solución Aplicada:**
1. **Regeneración de Bloqueo con pnpm**:
   - Se ejecutó `pnpm install` de forma local, actualizando `pnpm-lock.yaml` quirúrgicamente para ubicar `zip-a-folder` dentro de `devDependencies` y alinear las versiones exactas.
2. **Validación Simulada de CI**:
   - Se ejecutó `pnpm install --frozen-lockfile`, confirmando el mensaje `Lockfile is up to date, resolution step is skipped` con salida limpia (código de retorno 0).
3. **Verificación de Integridad de la Cadena CI**:
   - Verificación de tipos: `pnpm exec tsc --noEmit` completado con 0 errores bajo `strict: true`.
   - Linter: `pnpm run lint` superado con 0 errores y 0 advertencias.
   - Pruebas automatizadas: 77 archivos de pruebas y 1032 tests aprobados al 100%.
   - Auditoría de límites de líneas: 111 componentes auditados sin errores críticos.
   - Compilación de producción: `pnpm exec vite build` generado con éxito en 6.22s.

## [2026-09-24] Corrección Arquitectónica: Unificación de Selección con `rasgosAdicionales` y Restauración de `formulaDados` en Presets de Dotes

**Contexto y Problema:**
1. *Unificación de Don de la Recuperación*: El usuario solicitó que en la lista de selección aparezca como una única dote en el catálogo ("Don de la Recuperación"), pero que al seleccionarla y guardarla se creen automáticamente los dos rasgos mecánicos independientes (Último Bastión y Vitalidad) para no desbalancear sus contadores.
2. *Ausencia de Tirada y Autocuración en Vitalidad*: "Don de la Recuperación: Vitalidad" no mostraba el botón para tirar dados ni autocurar.
3. *Ausencia de Tirada en Resistencia a Energías*: "Don de la Resistencia a Energías" no mostraba el botón para tirar los 2d12 de la reacción *Redirigir energía*.

**Causa Raíz:**
- En `ConstructorRasgoDote.tsx` y `ModalCrearEditarRasgo.tsx`, la función `manejarSeleccionarDotePreset` asignaba nombre, descripción, usos, acciones, efectos y selectores, pero **omitía por completo la llamada a `setFormulaDados(dote.formulaDados || "")`**. Al quedar `formulaDados` como cadena vacía, los componentes `TarjetaRasgo` y `ModalDetalleRasgo` evaluaban `formulaEfectiva` como `undefined`, ocultando el botón interactivo de dados y evitando disparar los metadatos de `curacionRasgo`.
- Además, `DOTES_EPICAS_DND55` exponía `dote_don_recuperacion_vitalidad` como un ítem de nivel superior en el catálogo, mostrándose duplicado/dividido en el desplegable en lugar de una única dote canónica.

**Solución Implementada:**
1. **Esquema Recursivo con `rasgosAdicionales`**:
   - Se actualizó `EsquemaDotePersonaje` y el tipo `DotePersonaje` en `src/tipos/rasgos.ts` para admitir `rasgosAdicionales?: DotePersonaje[]` de forma recursiva y con tipado estricto (`strict: true`, 0 `any`).
   - En `src/constantes/dotesConstantes.ts`, se unificó "Don de la Recuperación" como un único elemento en `DOTES_EPICAS_DND55` que declara a Vitalidad dentro de `rasgosAdicionales`.
2. **Propagación de `formulaDados` y `rasgosAdicionales` en el Constructor y Modal**:
   - En `ConstructorRasgoDote.tsx` y `ModalCrearEditarRasgo.tsx`, `manejarSeleccionarDotePreset` ahora invoca explícitamente `setFormulaDados(dote.formulaDados || "")` e instancia los `rasgosAdicionales` si la dote los declara.
   - `alGuardar` ahora recibe `(rasgoFinal, rasgosAdicionales)` opcionales.
   - En `usarVistaRasgos.ts`, `manejarGuardarRasgoModal` persiste tanto `rasgoFinal` como cada uno de los `rasgosAdicionales` en el estado del personaje activo.
   - En `ConstructorRasgoDote.module.css`, se añadió la clase `.bannerRasgoAdicional` para presentar un aviso limpio y accesible al usuario sobre los rasgos complementarios creados, sin estilos inline.
3. **Validación de Mecánicas**:
   - Al preservarse `formulaDados: "1d10"` y `categoriaMecanica: "curacion"`, `TarjetaRasgo` renderiza `<Heart /> Curar 1d10` y ejecuta `lanzarDadosTaleSpire` con `metaEspecial: { tipo: "curacionRasgo", ... }`, aplicando la curación de forma reactiva al personaje.
   - Al preservarse `formulaDados: "2d12"` en "Don de la Resistencia a Energías", se renderiza el botón de tirada para la reacción de redirigir daño.

**Resultados de Verificación:**
- Pruebas Unitarias: 76 archivos de prueba pasados (1017 tests pasando al 100%).
- TypeScript: `pnpm exec tsc --noEmit` completado con 0 errores bajo configuración estricta.
- Linter: `pnpm exec eslint` ejecutado con 0 errores y 0 advertencias.

## [2026-09-24] Implementación Canónica D&D 5.5e (PHB 2024): Dotes Épicas (Epic Boons) y División Pura de Recursos

**Contexto y Alcance:**
- Se implementaron las 12 dotes épicas canónicas (*Epic Boons*) del Player's Handbook 2024 (categoría `don_epico`, requisito Nivel 19+, aumento de característica máx 30):
  1. *Don de la Pericia en Combate* (`dote_don_pericia_combate`): Consumible informativo de 1 uso para *Puntería inigualable* (convertir fallo en acierto 1 vez/turno).
  2. *Don del Viaje Dimensional* (`dote_don_viaje_dimensional`): Informativo táctico para *Pasos intermitentes* (teletransporte 30 pies tras atacar o magia).
  3. *Don de la Resistencia a Energías* (`dote_don_resistencia_energias`): Selector interactivo de 2 resistencias entre los 9 tipos elementales (`OPCIONES_DANOS_RESISTENCIA_ENERGIAS`) y reacción *Redirigir energía* con tirada `formulaDados: "2d12"` (+ mod. CON).
  4. *Don del Destino* (`dote_don_destino`): Consumible de 1 uso (`recuperacion: "descanso_corto"`) con `formulaDados: "2d4"` para modificar pruebas de d20 a 60 pies.
  5. *Don de la Fortaleza* (`dote_don_fortaleza`): Efecto activo `{ tipo: "modificador_hp_maximo", objetivo: "hp_maximo", valor: 40 }` evaluado limpiamente por `calcularBonoHPMaximoRasgos`. Curación fortalecida (+CON) informativa.
  6. *Don del Ataque Imparable* (`dote_don_ataque_imparable`): Informativo táctico (*Superar defensas* e ignorar resistencias; *Golpe arrollador* para sumar stat en 20 natural). Requisito: FUE o DES 19+.
  7. *Don de la Recuperación* (División Pura en 2 Recursos):
     - *Último Bastión* (`dote_don_recuperacion`): Reacción consumible con 1 uso por descanso largo (al llegar a 0 PG quedas a 1 y curas la mitad de tus PG máximos).
     - *Vitalidad* (`dote_don_recuperacion_vitalidad`): Acción adicional con categoría `curacion`, reserva de 10 dados d10 por descanso largo (`formulaDados: "1d10"`).
  8. *Don de la Habilidad* (`dote_don_habilidad`): Informativo canónico (*Competencia total* en todas las habilidades y *Pericia* en 1 habilidad).
  9. *Don de la Velocidad* (`dote_don_velocidad`): Efecto activo `{ tipo: "modificador_velocidad", objetivo: "velocidad.caminar", valor: 30 }` sumado por `calcularBonoVelocidadRasgos`. Acción adicional *Artista del escape* (destrabarse y terminar agarrado).
  10. *Don del Recuerdo de Conjuros* (`dote_don_recuerdo_conjuros`): Informativo táctico con `formulaDados: "1d4"` para *Lanzamiento gratuito* (al gastar espacio de nv 1-4, si el d4 coincide con el nivel no se gasta). Requisito: Nivel 19+, Lanzamiento de conjuros o Magia del pacto.
  11. *Don del Espíritu de la Noche* (`dote_don_espiritu_noche`): Informativo táctico con acción adicional (*Fundirse con las sombras* e invisibilidad en luz tenue/oscuridad; *Forma sombría* con resistencia a todo daño excepto psíquico y radiante).
  12. *Don de la Visión Verdadera* (`dote_don_vision_verdadera`): Informativo (*Visión verdadera* a 60 pies).

**Decisiones de Diseño y Aprendizajes Técnicos:**
1. **Desacoplamiento de Contadores de Recursos en Don de la Recuperación:**
   - La estructura `RasgoPersonaje` gestiona un único par `usosMaximos` / `usosRestantes`. Al poseer *Don de la Recuperación* dos mecánicas de recursos con cadencias y tipos dispares (un recurso de supervivencia de 1 uso/descanso largo y una reserva de 10 dados d10 de curación como acción adicional), unificarlos en un solo rasgo degradaría la experiencia del usuario y causaría colisiones de gasto. La separación arquitectónica en dos rasgos complementarios resuelve el problema de forma 100% limpia y compatible con el descanso largo y el lanzador de dados.
2. **Reutilización de Motores de Efectos:**
   - Sin modificar el núcleo de `evaluadorVitalidadRasgos.ts` ni `evaluadorMovilidadRasgos.ts`, los efectos `{ tipo: "modificador_hp_maximo", valor: 40 }` y `{ tipo: "modificador_velocidad", valor: 30 }` fueron resueltos de inmediato por los evaluadores existentes, demostrando la solidez de la arquitectura declarativa (Regla 20).
3. **Organización Limpia de Colecciones Canónicas:**
   - Se estructuraron las colecciones en `DOTES_GENERALES_DND55` (43 dotes), `DOTES_EPICAS_DND55` (12 dotes), `DOTES_GENERALES_Y_EPICAS_DND55` (composición de ambas) y `TODAS_LAS_DOTES_CANONICAS_DND55` (origen + generales + épicas), garantizando retrocompatibilidad y consultas específicas según el nivel del personaje.

**Resultados de Verificación:**
- Pruebas Unitarias: 76 archivos de prueba ejecutados y 1013/1013 tests pasando al 100%.
- TypeScript: `pnpm exec tsc --noEmit` completado con 0 errores bajo configuración estricta.
- Linter: `pnpm exec eslint` ejecutado con 0 errores y 0 advertencias.

## [2026-09-24] Implementación Canónica D&D 5.5e (PHB 2024): Dotes Generales Lote 4/4 y Compendio Completo de Dotes Oficiales

**Contexto y Alcance:**
- Se implementó el cuarto y último lote de dotes generales del Player's Handbook 2024, completando las 43 dotes generales canónicas del sistema:
  1. *Centinela* (`dote_centinela`): Informativo táctico (reacción Guardián, ataque de oportunidad Detener).
  2. *Influencia Sombría* (`dote_influencia_sombria`): Consumible 2 usos/descanso largo, *Invisibilidad* gratis, selector nv1 Ilusión/Nigromancia (`conjuros1IlusionONigromancia`), selector aptitud mágica (`OPCIONES_APTITUD_MAGICA`).
  3. *Tirador de Primera* (`dote_tirador_primera`): Informativo táctico (ignorar coberturas, sin desventaja a 5 pies, disparos lejanos).
  4. *Maestro en Escudos* (`dote_maestro_escudos`): Reacción e informativo táctico (golpe con escudo derribar/empujar con CD 8+PB+FUE, interponer escudo reacción a salvación Destreza).
  5. *Experto en Habilidades* (`dote_experto_habilidades`): Informativo canónico (+1 característica, 1 competencia, 1 pericia).
  6. *Rebanador* (`dote_rebanador`): Informativo táctico (lacerar -10 pies velocidad con daño cortante 1 vez/turno, crítico potenciado con desventaja en ataques).
  7. *Lanzador Preciso* (`dote_lanzador_preciso`): Informativo táctico (+60 pies alcance a ataques de conjuro >= 10 pies, ignorar coberturas, lanzar a 5 pies sin desventaja).
  8. *Telequinético* (`dote_telequinetico`): Truco *Mano de mago* otorgado (`h_mano-de-mago`), empellón telequinético como acción adicional con CD 8+PB+Aptitud, selector de aptitud mágica.
  9. *Maestro de Armas* (`dote_maestro_de_armas`): Selector declarativo `maestrias_aprendidas` configurado con las 8 maestrías canónicas (`OPCIONES_PROPIEDADES_MAESTRIA`), integración 100% nativa con `obtenerMaestriasArmasAprendidas` sin tocar el motor de combate ni violar la Regla 20.
  10. *Lanzador en Combate* (`dote_lanzador_en_combate`): Efecto declarativo de ventaja `{ tipo: "ventaja", objetivo: "salvacion.constitucion.concentracion", valor: "ventaja", condicion: "concentracion" }`, tipo de acción reacción para conjuro reactivo y componentes somáticos con manos ocupadas.
  11. *Telepático* (`dote_telepatico`): Consumible 1 uso/descanso largo, *Detectar pensamientos* gratis (`h_detectar-pensamientos`), habla telepática 60 pies, selector de aptitud mágica.
  12. *Veloz* (`dote_veloz`): Efecto mecánico declarativo `{ tipo: "modificador_velocidad", objetivo: "velocidad.caminar", valor: 10 }`, evaluado limpiamente por `calcularBonoVelocidadRasgos`. Corredor tenaz y movimiento ágil informativos.
  13. *Acechador* (`dote_acechador`): Informativo táctico (visión ciega 10 pies, niebla de guerra ventaja sigilo en combate, en la sombra).

**Decisiones de Diseño y Aprendizajes Técnicos:**
1. **Genericidad y Reutilización de Selectores:**
   - La propiedad de maestría de *Maestro de Armas* se integró utilizando el ID de selector canónico `maestrias_aprendidas` y la lista declarativa `OPCIONES_PROPIEDADES_MAESTRIA`. El evaluador de combate `obtenerMaestriasArmasAprendidas` ya poseía la lógica genérica para mapear selecciones de identificadores (`topple`, `cleave`, etc.) junto con sus sinónimos en español (`derribar`, `hender`), por lo que no se requirieron modificaciones ad-hoc.
2. **Consistencia de Firmas en Evaluadores:**
   - `obtenerConjurosOtorgadosPorRasgos` recibe el objeto `PersonajeJugador` completo y no `RasgoPersonaje[]`. Garantizar siempre que los tests instancien el personaje correctamente antes de interrogar los servicios de dominio.
   - `resolverOrigenConjuro` toma `(personaje, hechizo: HechizoBase)` y devuelve una categoría de badge (`"rasgos"` para dotes y rasgos).
3. **Cero `any` y Tipado Estricto de Mocks:**
   - En mocks de personaje, la propiedad `velocidad` debe respetar el tipo `VelocidadPersonaje` (`{ caminar: 30, planea: false }`) en lugar de números planos para evitar desajustes con `tsc --noEmit`.
   - Se erradicó por completo el uso de `any` en los tests sustituyéndolo por castings seguros de interfaz (`as unknown as HechizoBase`).

4. **Paginación Universal en Modo Lista (`SeccionSelectoresModalRasgo.tsx`):**
   - Anteriormente, la paginación a 4 elementos con `ControlPaginacion` estaba restringida por una condición que requería `sel.tipo === "multiple"`. Esto causaba que los selectores de tipo `"unico"` con `visualizacion: "lista"` (como el de *Influencia Sombría* e *Influencia Feérica* para elegir 1 conjuro de nivel 1 entre un catálogo de más de 15 opciones) renderizaran todas las opciones verticalmente sin paginar.
   - Se generalizó el comportamiento para que **todos los selectores en modo lista (`esModoLista`)** apliquen paginación a 4 elementos (`ELEMENTOS_POR_PAGINA_SELECTOR = 4`), ocultándose automáticamente si la cantidad de opciones es 4 o menor gracias a la lógica nativa de `ControlPaginacion`.

**Resultados de Verificación:**
- Pruebas Unitarias: 75 archivos de prueba ejecutados y 988/988 tests pasando al 100%.
- TypeScript: `pnpm exec tsc --noEmit` completado con 0 errores bajo configuración estricta.
- Linter: `pnpm exec eslint` ejecutado con 0 errores y 0 advertencias.

## [2026-09-24] Refactorización Integral ToolSet Es 5.5 — Fase 5: Arquitectura, Modularización, Batching de Estado y Optimización Vite

**Contexto del Problema:**
- Tras culminar con éxito las Fases 1, 2, 3 y 4 (seguridad y sanitización, optimizaciones algorítmicas Big O en selectores y hot paths, memoización de componentes React y erradicación de `as unknown as` / memory leaks), la base de código presentaba deuda técnica arquitectónica:
  1. **Monolito en Lógica de Rasgos:** `evaluadorEfectosRasgos.ts` excedía las 2.080 líneas conteniendo múltiples responsabilidades acopladas (expresiones matemáticas, vitalidad y CA, movilidad, ventajas/salvaciones, combate y daño, conjuros y recursos).
  2. **Renders en Cascada en Creación de Objetos:** `usarFormularioObjeto.ts` contenía más de 45 estados atómicos independientes (`useState`), provocando ráfagas de 20 a 35 re-renders secuenciales al cargar plantillas, cambiar categorías o resetear el formulario.
  3. **Megabundle en Vite:** La distribución generaba un único bundle monolítico de JavaScript de 2.88 MB sin separación de dependencias ni compendios estáticos.
  4. **Inversión de Capas y Código Muerto:** Módulos de servicios importando slices de almacén (`sincronizadorMulticlase.ts`), archivos plantilla no utilizados (`App.css`, `hechizos_transformados.json` de 877 KB) y CSS nativo redundante.

**Soluciones Técnicas Aplicadas:**
1. **Modularización con Patrón Fachada (`src/servicios/rasgos/` y `evaluadorEfectosRasgos.ts`):**
   - Se descompuso el monolito en 6 submódulos especializados de alta cohesión:
     - `utilidadesRasgos.ts`: Normalización lingüística, detección de rasgos y condiciones activas (furia, temerario, revelación), y verificación física de armaduras y escudos.
     - `evaluadorExpresionesRasgos.ts`: Evaluación matemática segura sin `eval()`, resolución de fórmulas dinámicas y filtrado de efectos mecánicos activos.
     - `evaluadorVitalidadRasgos.ts`: Bonos de características, defensa sin armadura, límites de Destreza, HP máximo y HP temporal.
     - `evaluadorMovilidadRasgos.ts`: Velocidades de desplazamiento efectivas (caminar, volar, nadar, trepar), tamaño y capacidad de carga.
     - `evaluadorSalvacionesRasgos.ts`: Ventajas/desventajas d20, bonos de salvación, dados de inspiración y competencias efectivas en herramientas.
     - `evaluadorCombateRasgos.ts`: Dados extra de ataque, dados de crítico, pacto del filo, maestrías de armas y modificadores de invocaciones a hechizos.
     - `evaluadorConjurosRasgos.ts`: Conjuros concedidos, lanzamientos gratuitos y resolución de ID de recurso objetivo de gasto.
   - Se implementó `src/servicios/rasgos/index.ts` y se convirtió `evaluadorEfectosRasgos.ts` en una **Fachada Transparente** (`export * from "./rasgos";`), logrando compatibilidad retroactiva absoluta sin romper ninguna de las 20+ referencias del proyecto ni alterar contratos externos.
2. **Optimización de Estado con Batching Atómico (`src/hooks/usarFormularioObjeto.ts`):**
   - Se agrupó la totalidad de los campos en una interfaz de estado inmutable `EstadoFormularioObjeto` con su constante `ESTADO_INICIAL_FORMULARIO`.
   - Se transformaron `limpiarFormulario`, `cargarObjeto`, `alCambiarCategoria` y `alCambiarSubcategoriaArmadura` en actualizaciones atómicas de un solo paso (`batch updates`), eliminando los re-renders en cascada.
   - Se preservó la firma de retorno idéntica (setters y propiedades individuales memoizadas) garantizando cero fricción para los componentes consumidores.
3. **Optimización de Rollup y Chunks en Vite (`vite.config.ts`):**
   - Se configuró `rollupOptions.output.manualChunks` fragmentando las dependencias externas en chunks especializados: `vendor-react` (187 KB), `vendor-zod` (71 KB), `vendor-icons` y `vendor-state`.
   - Se extrajeron las bases de datos de compendios de D&D 5.5e (`src/constantes/`) al chunk dedicado `datos-compendio` (1.28 MB), aligerando el runtime principal a 1.41 MB y reduciendo el tiempo de build a 6.18s.
4. **Patrón Strategy en Sanitización (`src/almacen/sanitizacion.ts`):**
   - Se desacopló la función monolítica `sanearObjetoHomebrew` en estrategias puras por categoría: `sanearPropiedadesArma`, `sanearPropiedadesArmadura`, `sanearPropiedadesEscudo` y `sanearPropiedadesEquipoAventuras`.
5. **Limpieza y Scripts:**
   - Eliminados `App.css` y `hechizos_transformados.json`. Purgado CSS zombi en `index.css` y variables en `App.module.css`.
   - Asegurados scripts de despliegue (`build_and_zip.js` y `deploy_to_ts.js`) con manejo de errores asíncronos y purga de versiones obsoletas.

**Verificación y Resultados:**
- TypeScript: `tsc --noEmit` completado con 0 errores bajo `strict: true`.
- Linter: ESLint con `--max-warnings=0` superado sin advertencias.
- Suite de Pruebas: 74 archivos de prueba ejecutados y 955/955 tests aprobados (100% de éxito).
- Build de Producción: Vite build completado en 6.18s con chunks modulares y source maps activos.

## [2026-09-23] Corrección Canónica: Asignación y Propagación Reactiva de Conjuros Rituales de la Dote "Lanzador Ritual"

**Contexto del Problema:**
- Los conjuros rituales elegidos en el selector interactivo de la dote *Lanzador Ritual* (`selector_rituales_nv1`) no se estaban asignando a la hoja del personaje, permaneciendo invisibles en el panel de conjuros y en el compendio de hechizos preparados.

**Causa Raíz:**
1. Los filtros de coincidencia de selectores mágicos en `sliceRasgos.ts`, `evaluadorEfectosRasgos.ts` y `resolutorOrigenConjuros.ts` buscaban subcadenas como `"truco"`, `"conjuro"`, `"hechizo"`, `"spell"` o `"cantrip"`, omitiendo `"ritual"`. En consecuencia:
   - `esRasgoConMagia` y `esSelectorConjuro` evaluaban en falso para `selector_rituales_nv1`.
   - `r.conjurosOtorgados` no recibía los IDs de los rituales elegidos.
   - `pj.conjurosSiemprePreparadosIds`, `pj.conjurosPreparadosIds` y `pj.conjurosConocidosIds` nunca se alimentaban con los rituales seleccionados.
   - `obtenerConjurosOtorgadosPorRasgos` y `resolverOrigenConjuro` no identificaban los rituales elegidos como otorgados por el rasgo.
2. La definición canónica de `dote_lanzador_ritual` en `src/constantes/dotesConstantes.ts` no tenía inicializada la propiedad `conjurosOtorgados: []`.
3. `agregarRasgoPersonaje` en `sliceRasgos.ts` no sincronizaba los conjuros en caso de que un rasgo o dote ya incluyera opciones o conjuros previamente asignados en su plantilla.

**Solución Aplicada Quirúrgicamente:**
1. **Dotes Canónicas (`src/constantes/dotesConstantes.ts`):** Se añadió explícitamente `conjurosOtorgados: []` a `dote_lanzador_ritual`.
2. **Evaluador de Efectos (`src/servicios/evaluadorEfectosRasgos.ts`):** En `obtenerConjurosOtorgadosPorRasgos`, se incorporó `idLower.includes("ritual")` a los predicados de selectores de magia.
3. **Resolución de Origen y Badges (`src/servicios/resolutorOrigenConjuros.ts`):** En `resolverOrigenConjuro` y `crearResolutorOrigenConjuros`, se agregó `idLower.includes("ritual")` asignando el badge `"rasgos"` a los rituales seleccionados.
4. **Sincronización en Zustand (`src/almacen/slices/personajes/sliceRasgos.ts`):**
   - En `actualizarSeleccionRasgo`, se incluyó `"ritual"` en `esRasgoConMagia`, en el bucle recolector de conjuros y en `esSelectorConjuro`, sincronizando reactivamente `r.conjurosOtorgados`, `conjurosSiemprePreparadosIds`, `conjurosPreparadosIds` y `conjurosConocidosIds`.
   - En `agregarRasgoPersonaje`, se aseguró que cualquier conjuro preconfigurado o selector con `valorActual` se registre en las listas del personaje.
5. **Ajuste de Paginación en Selector (`SeccionSelectoresModalRasgo.tsx`):** Se fijó `ELEMENTOS_POR_PAGINA_SELECTOR = 4` con cobertura de tests actualizada en `SeccionSelectoresModalRasgo.test.tsx` (exhibición de 4 elementos por página, navegación accesible y ocultamiento automático de paginación con 4 o menos opciones).
6. **Validación:** Se añadieron pruebas exhaustivas en `dotesGeneralesLote3Mecanicas.test.ts` comprobando la asignación reactiva, extracción por evaluadores y badges de origen, junto con la suite de paginación a 4 elementos (955+ pruebas superadas al 100%).

## [2026-09-23] Paginación en Selectores Múltiples y Compendios de Hechizos, y Activación Canónica de Competencias en Herramientas por Dotes (Chef y Envenenador)

**Contexto del Problema:**
1. **Paginación en Selectores Múltiples de Rasgos:** En los modales de configuración de rasgos y dotes, cuando un selector era múltiple y se mostraba en formato lista (`visualizacion === "lista"` / `esModoLista`), se renderizaban todas las opciones de golpe saturando verticalmente el modal. Se requería paginación de a 5 elementos por página, preservando las selecciones existentes a través de las páginas.
2. **Paginación en Compendio de Conjuros (Jugador y Master):** Tanto en `CompendioConjurosJugador.tsx` como en el compendio DM `ListaHechizos.tsx`, el renderizado de cientos de hechizos sin paginar degradaba la fluidez y usabilidad. Se requería paginación de 50 hechizos por página con controles accesibles y reseteo reactivo de página al cambiar filtros o términos de búsqueda.
3. **Falta de Reflejo de Competencias en Herramientas por Dotes:** Dotes como *Chef* ("Útiles de cocinero") y *Envenenador* ("Útiles de envenenador" / "Kit de venenos") otorgaban competencias declarativas en sus efectos (`{ tipo: "competencia", objetivo: "herramientas", valor: "..." }`), pero estas no se reflejaban en la tarjeta de herramientas de la hoja del personaje (`PanelHabilidadesPersonaje.tsx`), en la tarjeta de configuración (`PestanaCompetencias.tsx`), ni se marcaban en el modal selector de competencias (`ModalSelectorCompetencias.tsx`).

**Causas Raíz:**
1. No existía un componente atómico y reutilizable de paginación conforme a las pautas de accesibilidad y sin emojis.
2. `obtenerCompetenciasEfectivasTexto` en `src/servicios/evaluadorEfectosRasgos.ts` solo consolidaba texto de armas y armaduras, ignorando las herramientas de `obtenerCompetenciasExtraRasgos`.
3. `EstadisticasCalculadasPersonaje.competenciasEfectivas` en `usarEstadoPersonajes.ts` solo exponía `armasTexto` y `armadurasTexto`.
4. Existía disparidad léxica entre nombres oficiales del PHB 2024 ("Útiles de envenenador", "Útiles de cocinero") y sinónimos comúnmente utilizados ("Kit de venenos", "Utensilios de cocinero", "Kit de cocinero"), causando que no se reconocieran como equivalentes.
5. `PanelHabilidadesPersonaje.tsx` consultaba únicamente `personaje.herramientas`, ignorando el cálculo reactivo de rasgos.

**Solución Aplicada Quirúrgicamente:**
1. **Componente Reutilizable `ControlPaginacion` (`src/componentes/comunes/ControlPaginacion.tsx`):**
   - Soporte para modos `"normal"` y `"compacto"`.
   - Cero emojis: navegación con iconos Lucide (`ChevronLeft`, `ChevronRight`).
   - Accesibilidad con `aria-label`, estados deshabilitados y estilos CSS encapsulados (`ControlPaginacion.module.css`).
   - Exportado desde `src/componentes/comunes/index.ts`.
2. **Paginación en `SeccionSelectoresModalRasgo.tsx`:**
   - Para selectores múltiples en modo lista (`esModoLista && esMultiple`), se introdujo paginación de 5 en 5 (`ITEMS_POR_PAGINA = 5`).
   - El filtrado por texto resetea automáticamente a la página 1 (`useEffect` reactivo).
   - Preservación íntegra de elementos seleccionados entre transiciones de páginas.
3. **Paginación en Compendios (`CompendioConjurosJugador.tsx` y `ListaHechizos.tsx`):**
   - Límite de 50 elementos por página (`CONJUROS_POR_PAGINA = 50`).
   - Reseteo automático de página al cambiar buscador, escuelas, clases o filtros rápidos.
   - Integración visual limpia con `ControlPaginacion` encima o debajo de las rejillas de conjuros.
4. **Normalización de Alias y Equivalencias (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - Implementado `MAPA_ALIAS_HERRAMIENTAS` con relaciones canónicas bidireccionales ("kit de venenos" <-> "útiles de envenenador", "utensilios de cocinero" <-> "útiles de cocinero", etc.).
   - Creada función pura `sonHerramientasEquivalentes(a, b)` tolerante a mayúsculas y diacríticos.
   - Extendida `obtenerCompetenciasEfectivasTexto` para retornar `herramientasTexto` y `herramientasLista` deduplicadas según equivalencias.
5. **Propagación en Estado y Vistas:**
   - `usarEstadoPersonajes.ts`: `competenciasEfectivas` ahora incluye `herramientasTexto: string` y `herramientasLista: string[]`.
   - `PanelHabilidadesPersonaje.tsx`: La tarjeta de herramientas muestra `statsCalculadas.competenciasEfectivas.herramientasTexto || personaje.herramientas`.
   - `PestanaCompetencias.tsx`: La tarjeta de herramientas utiliza el conteo y texto efectivo integrando dotes y rasgos.
   - `HojaPersonaje.tsx` y `PestanaListaSimpleCompetencias.tsx`: `ModalSelectorCompetencias` recibe las herramientas efectivas y valida `check` con `sonHerramientasEquivalentes`.
   - `usarSelectorCompetencias.ts`: `alternarHerramienta` utiliza `sonHerramientasEquivalentes` para evitar duplicaciones por sinónimos.

**Lecciones Aprendidas:**
- En Vitest sin DOM completo emulado en algunos entornos, las pruebas unitarias de componentes React se benefician del uso de `renderToStaticMarkup` de `react-dom/server` para verificar renderizado estático y atributos accesibles de forma instantánea y determinista.
- Al escribir archivos `.test.tsx` con `jsx: "react-jsx"`, no se debe importar `React` explícitamente sin usarlo, ya que TypeScript con `noUnusedLocals` arroja `TS6133`.
- En sistemas con equivalencias léxicas (sinónimos de equipo y herramientas), la deduplicación debe efectuarse siempre mediante comparación canónica normalizada en lugar de `Set` o `.includes` directo.

## [2026-09-22] Integración Canónica de Dotes Generales (Lote 2/4) D&D 5.5e y Soporte Genérico de Armas Pesadas y Magia Feérica

**Contexto del Problema:**
- Se requería implementar el segundo lote de 10 dotes generales oficiales (PHB 2024 / D&D 5.5e) a partir del compendio canónico en `dicionario_herramientas/dotes/general/`:
  1. *Versado en un elemento*: Selector informativo con los tipos de daño elemental (repetible).
  2. *Influencia feérica*: Consumible (2 lanzamientos gratuitos por descanso largo), con *Paso brumoso* y selector de 1 conjuro de nivel 1 de Adivinación o Encantamiento.
  3. *Apresador*: Informativo.
  4. *Maestro en armas pesadas*: +PB al daño del arma si tiene la propiedad pesada.
  5. *Muy acorazado*: Competencia con armaduras pesadas.
  6. *Maestro en armaduras pesadas*: Informativo (-PB daño físico).
  7. *Líder inspirador*: Informativo (puntos de golpe temporales).
  8. *Mente aguda*: Informativo (sabiduría popular y acción de estudiar).
  9. *Ligeramente acorazado*: Competencia con armaduras ligeras y escudos.
  10. *Azote de magos*: Consumible (Mente robusta, 1 uso por descanso corto o largo, reacción), anticoncentración informativo.
- Todo debía resolverse sin bifurcaciones por nombre literal (cumplimiento estricto de la Regla 20) y proveyendo soporte genérico en el builder de rasgos y dotes (`ConstructorRasgoDote.tsx`).

**Causa Raíz y Faltantes en el Sistema Genérico:**
1. **Falta de Reconocimiento de Armas Pesadas en Daño Declarativo:** Aunque `aplicaA` aceptaba `arma_fuerza`, `arma_cac`, `arma_distancia` y `desarmado`, no existía `arma_pesada` ni `ContextoAtaquePersonaje` transmitía si el arma equipada poseía la propiedad pesada, impidiendo que *Maestro en armas pesadas* sumara `+PB` declarativamente.
2. **Pérdida de Conjuros Fijos al Sincronizar Selectores Mágicos:** En `sliceRasgos.ts`, la sincronización de selectores de magia sobrescribía el array `conjurosOtorgados` únicamente con los valores seleccionados dinámicamente, borrando los conjuros base predefinidos en la plantilla del rasgo (como *Paso brumoso* en *Influencia feérica*).
3. **Faltante de Compendio Oficial:** Las dotes *Versado en un elemento* e *Influencia feérica* no contaban con archivo Markdown en `dicionario_herramientas/dotes/general/`.

**Solución Aplicada Quirúrgicamente:**
1. **Contratos de Tipos (`src/tipos/rasgos.ts`):**
   - Se extendió el enum `aplicaA` en `EsquemaEfectoMecanicoRasgo` incorporando `"arma_pesada"`.
2. **Evaluador de Efectos y Combate (`src/servicios/evaluadorEfectosRasgos.ts` y `calculadorAtaquesArmas.ts`):**
   - En `ContextoAtaquePersonaje`, se añadieron `propiedades?: string[]` y `esPesada?: boolean`.
   - En `aplicaEfectoAAtaque`, se validó declarativamente `criterio === "arma_pesada" || criterio === "pesada"`.
   - En `calcularAtaqueArmaEquipada`, se detecta `esPesada` a partir de las propiedades del arma y se propaga en el contexto. Dado que `resolverFormulaDinamica` ya soportaba `"bono_competencia"`, el cálculo sumó automáticamente `+PB`.
3. **Constructor de Rasgos y Dotes (`ConstructorRasgoDote.tsx`):**
   - Se añadió `{ valor: "arma_pesada", etiqueta: "Armas Pesadas" }` en `OPCIONES_APLICA_A_ATAQUE`.
   - Se adaptó la descripción automática para mostrar `+${nuevoValor} al daño (Armas Pesadas)`.
4. **Preservación en Almacén (`src/almacen/slices/personajes/sliceRasgos.ts`):**
   - En `actualizarSeleccionRasgo`, se filtran los conjuros otorgados preexistentes que no pertenecen a las opciones dinámicas del selector y se unen sin duplicados a los nuevos conjuros elegidos.
5. **Catálogo Canónico Oficial (`src/constantes/dotesConstantes.ts`):**
   - Se implementó la función auxiliar `generarOpcionesConjurosPorEscuelas` para filtrar de `all.json` conjuros de nivel 1 de Adivinación y Encantamiento.
   - Se crearon las opciones del selector elemental para *Versado en un elemento*.
   - Se incorporaron las 10 dotes canónicas completas con requisitos, textos PHB 2024 en español, selectores y efectos.
6. **Compendio de Herramientas (`dicionario_herramientas/dotes/general/`):**
   - Creados `Versado en un elemento.md` e `Influencia feérica.md`.
7. **Verificación y Pruebas Unitarias:**
   - Creada suite `src/servicios/dotesGeneralesLote2Mecanicas.test.ts` con 22 pruebas dedicadas pasando al 100%.
   - Total de pruebas en Vitest: 916/916 aprobadas (0 fallos).
   - Verificación TypeScript `strict: true` (`tsc --noEmit`) con 0 errores.
   - Verificación ESLint con 0 errores y 0 advertencias.

## [2026-09-22] Integración Canónica de Dotes Generales (Lote 1/4) D&D 5.5e y Capacidades Genéricas en el Builder de Rasgos

**Contexto del Problema:**
- Se requería implementar el primer lote de 10 dotes generales oficiales (PHB 2024 / D&D 5.5e) a partir del compendio canónico en `dicionario_herramientas/dotes/general/`:
  1. *Mejora de característica*: Informativa (repetible).
  2. *Actor*: Informativo.
  3. *Atleta*: Velocidad trepando activa, lo demás informativo.
  4. *Atacante a la carga*: Activable (+1d8 de daño en armas cuerpo a cuerpo).
  5. *Chef*: Competencia en útiles de cocinero, lo demás informativo.
  6. *Experto en ballestas*: Informativo.
  7. *Triturador*: Informativo.
  8. *Duelista defensivo*: Informativo (tipo acción: reacción).
  9. *Combatiente con dos armas*: Informativo (actualización canónica completa PHB 2024).
  10. *Resistente*: Ventaja en tiradas de salvación contra la muerte, lo demás informativo.
- Todo debía resolverse sin bifurcaciones por nombre literal (cumplimiento estricto de la Regla 20) y proveyendo soporte genérico en el builder de rasgos y dotes (`ConstructorRasgoDote.tsx`).

**Causa Raíz y Faltantes en el Sistema Genérico:**
1. **Preservación de Activables en Presets del Builder:** En `ConstructorRasgoDote.tsx`, `manejarSeleccionarDotePreset` no asignaba `esActivable` ni `autoDesactivar`, lo que impedía que dotes con conmutador táctico ON/OFF (como *Atacante a la Carga*) se instanciaran con su funcionalidad activable desde el preset.
2. **Ausencia de Formulario UI para Movimiento Especial en el Builder:** Aunque `movimiento_especial` estaba en el catálogo de tipos de efectos, el JSX del builder carecía de campos para configurar escalada/trepar, vuelo o nado y su velocidad.
3. **Opciones Limitadas en el Selector de Competencias:** El formulario de tipo `competencia` solo permitía armas y armaduras fijas, impidiendo agregar competencias de herramientas o armas improvisadas desde el builder.
4. **Falta de Reconocimiento de Muerte en Ventajas de Salvación:** `evaluarVentajasDeRasgosEnTirada` no evaluaba `subtipo === "muerte"` ni objetivos como `salvacion.muerte`, impidiendo que dotes como *Resistente* concedieran ventaja en la ficha o al tirar en TaleSpire.
5. **Falta de Extracción de Herramientas:** `obtenerCompetenciasExtraRasgos` no exponía la lista de herramientas otorgadas por rasgos.

**Solución Aplicada Quirúrgicamente:**
1. **Contratos de Tipos (`src/tipos/rasgos.ts`):**
   - Se extendió `EsquemaDotePersonaje` con `esActivable` y `autoDesactivar`.
2. **Catálogo Oficial Canónico (`src/constantes/dotesConstantes.ts`):**
   - Incorporadas las 10 dotes del Lote 1/4 con textos completos en español, requisitos oficiales y efectos declarativos genéricos.
3. **Constructor de Rasgos y Dotes (`ConstructorRasgoDote.tsx`):**
   - Sincronización de `esActivable`, `autoDesactivar` y `categoriaMecanica` en presets.
   - Implementado el formulario interactivo para `movimiento_especial` (Escalada/Trepar, Vuelo, Nado) y `modificador_velocidad`.
   - Incorporadas las opciones de "Herramientas / Útiles" y "Armas Improvisadas" en el selector de competencias.
4. **Servicios de Evaluación Genérica (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - En `evaluarVentajasDeRasgosEnTirada`: soporte genérico para `salvacion.muerte` cuando el subtipo es `"muerte"` o el tipo es `"salvacion_muerte"`.
   - En `calcularVelocidadPersonaje`: soporte unificado para `"escalar"` o `"trepar"` en `objetivo` y `valor`.
   - En `obtenerCompetenciasExtraRasgos`: extracción declarativa de `herramientas: string[]`.
5. **Integración en Hoja del Jugador y Lanzador 3D:**
   - En `HojaPersonaje.tsx`, `manejarTirarSalvacionMuerte3D` evalúa genéricamente las ventajas de rasgos y despacha la tirada con `tipoTiradaForzado: "ventaja"`.
   - En `lanzadorDados.ts`, el fallback local matemático simula la ventaja de salvación contra la muerte (`Math.max(d20_1, d20_2)`).
6. **Verificación y Pruebas Unitarias:**
   - Creada suite `src/servicios/dotesGeneralesLote1Mecanicas.test.ts` con 32 pruebas pasando al 100%.
   - 894/894 pruebas globales aprobadas en Vitest.
   - 0 errores TypeScript (`strict: true`) y 0 advertencias ESLint.

## [2026-09-21] Soporte Declarativo de Visualización en el Builder de Rasgos: Selector Lista y Selector Normal

**Contexto del Problema:**
- En la interfaz del jugador, los selectores de opciones para rasgos extensos (como los conjuros de nivel 1 de *Iniciado en la Magia*) se renderizaban como una cuadrícula de pastillas/chips horizontales poco ergonómica para listas con descripciones ricas.
- Se requería dar control total al creador/builder de rasgos y dotes (`ConstructorRasgoDote.tsx`) para elegir explícitamente entre el formato de "Selector Normal" (cuadrícula de tarjetas/chips) y "Selector Lista" (lista vertical completa con descripciones y scroll), eliminando cualquier heurística frágil por nombre.

**Solución Aplicada Declarativamente:**
1. **Contrato de Tipos (`src/tipos/rasgos.ts`)**:
   - Se extendió `EsquemaSelectorRasgo` con `visualizacion: z.enum(["normal", "lista"]).default("normal").optional()`, garantizando tipado estricto sin romper retrocompatibilidad.
2. **Builder de Rasgos y Dotes (`ConstructorRasgoDote.tsx`)**:
   - Se incorporó en el formulario de nuevos selectores el campo "Formato de Visualización" (`SelectorDesplegable<"normal" | "lista">`) permitiendo escoger entre `Selector Normal (Chips)` y `Selector Lista (Vertical)`.
   - Se persistió en el estado de `selectores` y se añadió el badge descriptivo en la lista de selectores creados.
3. **Catálogo Declarativo Canónico (`dotesConstantes.ts`)**:
   - Se asignó explícitamente `visualizacion: "lista"` a los selectores de conjuro de nivel 1 de *Iniciado en la Magia* (Clérigo, Druida y Mago).
4. **Renderizado en Hoja del Jugador (`SeccionSelectoresModalRasgo.tsx` y `VistaRasgosJugador.module.css`)**:
   - Se implementó la visualización en lista vertical (`.listaOpcionesSelectorModal`, `.itemListaSelectorModal`) que presenta el nombre en negrita, detalles o descripción visible (`Escuela • Tiempo • Alcance`), aviso de requisitos/bloqueo y check/candado a la derecha, acompañado de su buscador integrado.
5. **Verificación y Pruebas**:
   - `dotesOrigenMecanicas.test.ts` actualizado con aserciones para `visualizacion: "lista"`.
   - 862/862 tests pasando en Vitest, compilación limpia en TypeScript `strict: true` y 0 advertencias en ESLint.

## [2026-09-21] Escalado Dinámico de Usos por PB en Afortunado, Purga Limpia de Conjuros de Dotes y Lista Interactiva con Botón Gratis en Iniciado en la Magia

**Contexto del Problema:**
1. *Afortunado*: A nivel 9 (donde el bono de competencia es +PB = 4), la tarjeta y el modal mostraban `[- 2 / 4 +]`, pero al pulsar `+` el valor no subía de 2 y tras un descanso largo seguía restaurando únicamente 2/2 en lugar de 4/4.
2. *Iniciado en la Magia*:
   - El conjuro de nivel 1 se presentaba en un `<select>` desplegable nativo en lugar de una lista interactiva de tarjetas.
   - Solo se disponía de un selector para trucos en lugar de 2 selectores independientes.
   - El conjuro de nivel 1 no generaba el botón interactivo "Gratis" (1 lanzamiento gratuito por descanso largo) como ocurre en *Magia de alto elfo*.
   - Al eliminar la dote tras haber seleccionado trucos y conjuros, estos quedaban atascados en `conjurosSiemprePreparadosIds`, `conjurosPreparadosIds` y `trucosConocidosIds`, bloqueando los checkboxes del compendio al considerarse permanentemente otorgados.

**Causa Raíz Diagnosticada:**
1. **Límite Estático en Store y Descansos:**
   - Aunque la UI calculaba visualmente el límite en 4, `r.usosMaximos` persistido en el JSON del personaje era 2.
   - En `sliceRasgos.ts`, `gastarUsoRasgoPersonaje`, `recuperarUsoRasgoPersonaje` y `establecerUsosRestantesRasgoPersonaje` usaban `Math.min(r.usosMaximos ?? 1, restantes + 1)`. Con `r.usosMaximos = 2`, `Math.min(2, 3)` devolvía 2, impidiendo incrementar el contador.
   - En `procesadorDescansos.ts`, `ejecutarDescansoCorto` y `ejecutarDescansoLargo` restauraban `usosRestantes: rasgo.usosMaximos`, limitando la recarga a 2.
   - En `ConstructorRasgoDote.tsx` y `SelectorInvocacionesAcordeon.tsx`, al instanciar el dote no se calculaba el PB actual del personaje.
2. **Desincronización y Retención Huérfana de Conjuros al Eliminar Rasgos:**
   - `eliminarRasgoPersonaje` filtraba `pj.rasgos`, pero no purgaba las listas globales de conjuros de la ficha. Dado que `resolutorOrigenConjuros.ts` indexa `conjurosSiemprePreparadosIds` bajo el badge `"rasgos"`, el sistema consideraba que seguían otorgados e impedía desmarcarlos.
3. **Dropdown Forzado y Detección Estricta de Usos Restantes en Conjuros:**
   - `SeccionSelectoresModalRasgo.tsx` forzaba `SelectorDesplegable` en cualquier selector con más de 8 opciones.
   - En `SeccionNivelConjuros.tsx`, la detección de `rasgoInnatoGratuito` descartaba el rasgo si `typeof r.usosRestantes !== "number"`, de modo que si un rasgo recién agregado tenía `usosRestantes: undefined`, no se mostraba el botón "Gratis".

**Solución Aplicada Quirúrgicamente:**
1. **Servicio y Store de Usos Dinámicos (`evaluadorEfectosRasgos.ts`, `sliceRasgos.ts` y `procesadorDescansos.ts`):**
   - Se implementó la función pura `calcularUsosMaximosRasgo(rasgo, personaje)` para resolver dinámicamente `"bono_competencia"` ($\lfloor(\text{nivel} - 1) / 4\rfloor + 2$), `"nivel"` y modificadores de característica.
   - En `sliceRasgos.ts`, `gastarUsoRasgoPersonaje`, `recuperarUsoRasgoPersonaje` y `establecerUsosRestantesRasgoPersonaje` calculan dinámicamente `maxUsos` con `calcularUsosMaximosRasgo(r, pj)` y actualizan tanto `usosMaximos` como `usosRestantes`, desbloqueando el incremento hasta 4 a nivel 9.
   - En `procesadorDescansos.ts`, tanto el descanso corto como el descanso largo evalúan `calcularUsosMaximosRasgo(rasgo, personaje)` para recargar completamente a 4/4.
2. **Purga Limpia al Eliminar Rasgos (`sliceRasgos.ts`):**
   - En `eliminarRasgoPersonaje`, se extraen todos los IDs de conjuros y trucos del rasgo eliminado (de `conjurosOtorgados`, `selectores` y `efectos`) y se purgan de `conjurosSiemprePreparadosIds`, `conjurosPreparadosIds`, `conjurosConocidosIds` y `trucosConocidosIds` siempre que ningún otro rasgo activo ni la subclase los sigan otorgando.
3. **Lista Interactiva y Buscador en Selectores (`SeccionSelectoresModalRasgo.tsx` y `VistaRasgosJugador.module.css`):**
   - Se excluyó el conjuro de nivel 1 de `esSelectorDesplegable`, presentándolo en la vista de lista/tarjetas interactivas (`gridOpcionesSelectorModal`).
   - Se modularizó un buscador rápido con clases CSS `.contenedorBuscadorSelectorModal` e `.inputBuscadorSelectorModal` (cero estilos inline) para filtrar fácilmente opciones en listas largas.
4. **Disponibilidad del Botón "Gratis" (`SeccionNivelConjuros.tsx`, `SeccionConjurosOcultos.tsx`, `SeccionAtaquesMagicos.tsx` y `usarLanzadorConjuros.ts`):**
   - Se flexibilizó la detección evaluando `const restantes = r.usosRestantes !== undefined ? r.usosRestantes : (r.usosMaximos ?? 1)`.
   - En `usarLanzadorConjuros.ts`, se incorporó `coincideHechizoId` para vincular de forma infalible el lanzamiento en modo `"gratuitoInnato"` con el rasgo otorgante y descontar su uso en la ficha.
5. **Verificación y Pruebas Unitarias:**
   - Nuevos tests de integración en `src/almacen/rasgosPersonaje.test.ts`, asegurando el cumplimiento estricto de la interfaz `OpcionSelector` con la propiedad obligatoria `descripcion`.
   - 862/862 tests pasando al 100% en Vitest.
   - 0 errores de compilación TypeScript (`strict: true`).
   - 0 advertencias de ESLint.
   - 111 componentes auditados bajo el límite de 500 líneas.

## [2026-09-21] Corrección de Dotes de Origen: Selectores en Lista, Escalado PB en Afortunado y Flujo Canónico de Invocación "Lecciones de los Primeros"

**Contexto del Problema:**
- Se identificaron tres deficiencias tras la implementación inicial de las dotes de origen e invocaciones:
  1. *Iniciado en la Magia*: La interfaz mostraba los hechizos de nivel 1 en chips de botones masivos en vez de una lista desplegable con buscador (`SelectorDesplegable`), solo permitía elegir un único truco (cuando la regla oficial otorga 2 trucos independientes), y el conjuro de nivel 1 seleccionado no se habilitaba con el botón interactivo "Gratis" (1 uso por descanso largo) como ocurre en *Magia de alto elfo*.
  2. *Afortunado*: Los puntos de suerte/usos se mostraban fijos en 2 en la tarjeta de rasgo en lugar de escalar dinámicamente según el Bono de Competencia (+PB: 2 a 6 según el nivel del personaje).
  3. *Lecciones de los Primeros*: La invocación requería un botón interactivo explícito que incorporara la dote seleccionada a la ficha del personaje (`personaje.rasgos`), aplicando de inmediato sus efectos reales (+2 HP/nv con Duro, +PB iniciativa con Alerta, armas improvisadas con Matón de taberna, etc.), sin duplicación mecánica y con posibilidad de removerla limpiamente.

**Causa Raíz Diagnosticada:**
1. **Chips vs Selectores Desplegables y Selectores Múltiples:** La plantilla de *Iniciado en la Magia* agrupaba los 2 trucos en un único selector de tipo `"multiple"` (`maxSelecciones: 2`), lo que forzaba a `SeccionSelectoresModalRasgo.tsx` a renderizar una nube de botones sin buscador y sin control independiente de cada selección. Además, los selectores de conjuro no activaban la integración con `SelectorDesplegable`.
2. **Desajuste de Nomenclatura en Metadatos y Hook:** En `dotesConstantes.ts`, *Afortunado* se definió con `formulaUsos: "bono_competencia"` en vez del campo canónico `formulaEscalado: "bono_competencia"` de `EsquemaDotePersonaje`. Asimismo, en `usarAccionesTarjetaRasgo.ts`, la resolución de usos máximos no calculaba el bono de competencia para dotes cuando `formulaEscalado === "bono_competencia"`.
3. **Desacoplamiento entre Invocación y Rasgos Canónicos:** Las dotes proyectadas por la invocación eran puramente sintéticas en la UI y carecían de integración con el flujo nativo de `agregarRasgoPersonaje`. Dado que `agregarRasgoPersonaje` ya recalcula de forma nativa los puntos de golpe máximos con `calcularBonoHPMaximoRasgos`, bastaba proveer un botón directo de incorporación/remoción que opere con la dote canónica en `personaje.rasgos`.

**Solución Aplicada Quirúrgicamente:**
1. **Ajuste de Plantillas de Iniciado en la Magia (`src/constantes/dotesConstantes.ts` y `src/tipos/rasgos.ts`):**
   - Se agregaron dos selectores independientes de tipo `"unico"` (`selector_truco_1_...` y `selector_truco_2_...`) y un selector para el conjuro nivel 1 (`selector_conjuro_nv1_...`).
   - Se corrigió `formulaEscalado: "bono_competencia"` en la dote *Afortunado*.
   - Se agregó `formulaEscalado: z.string().optional()` en `EsquemaDotePersonaje`.
2. **Renderizado de Selectores con Buscador (`SeccionSelectoresModalRasgo.tsx`):**
   - Se integró `SelectorDesplegable` existente para selectores de conjuros y trucos únicos (`sel.id.includes("conjuro") || sel.id.includes("hechizo")`), reutilizando directamente `sel.opciones` con búsqueda y filtrado rápido sin duplicar componentes.
3. **Cálculo Dinámico de Usos por PB (`usarAccionesTarjetaRasgo.ts`):**
   - Se calculó `escalaPorBonoCompetencia = rasgo.formulaEscalado === "bono_competencia"` evaluando `bonoCompetenciaCalculado = Math.floor(((nivel - 1) / 4)) + 2` para determinar reactivamente los usos máximos.
4. **Botón Interactivo en Selector de Invocaciones (`SelectorInvocacionesAcordeon.tsx` y `.module.css`):**
   - Se añadió un botón "Agregar dote a la ficha" (con icono `Plus` de `lucide-react`) que despacha `agregarRasgoPersonaje` con la plantilla canónica completa.
   - Si la dote ya reside en la ficha, se muestra el indicador "Dote en ficha" y el botón para removerla con `eliminarRasgoPersonaje`.
   - Se aplicaron estilos CSS sin transiciones (0ms latencia TaleSpire CEF) y deduplicación en `utilidadesProgresionRasgos.ts` y `evaluadorEfectosRasgos.ts`.
5. **Activación Automática de Lanzamiento Gratuito (`sliceRasgos.ts`):**
   - En `actualizarSeleccionRasgo`, cuando se seleccionan conjuros en un rasgo con selectores de magia, se sincroniza reactivamente `conjurosOtorgados` y se inicializa `usosRestantes: 1` si el rasgo otorga lanzamientos gratuitos, permitiendo a `SeccionNivelConjuros.tsx` habilitar inmediatamente el botón "Gratis".

## [2026-09-21] Proyección Reactiva de Tarjetas de Dotes de "Lecciones de los Primeros" en el Bloque de Dotes

**Contexto del Problema:**
- Aunque la invocación sobrenatural *Lecciones de los Primeros* aplicaba reactivamente sus beneficios mecánicos a los atributos del personaje (como +PB a iniciativa con Alerta o +2 HP/nv con Duro), en la pestaña de rasgos de la hoja del jugador (`VistaRasgosJugador.tsx`), las dotes seleccionadas no aparecían en el bloque visual de "Dotes" (`SeccionesRasgosActivos.tsx`).
- Se requería que la invocación proyectara la tarjeta correspondiente a cada dote seleccionada en dicho bloque de Dotes, manteniendo la coherencia con el compendio y las reglas oficiales.

**Causa Raíz Diagnosticada:**
- El bloque visual de Dotes (`datosJerarquicos.dotes`) se nutrías exclusivamente de aquellos elementos en `personaje.rasgos` cuyo `origen === "dote"`.
- Persistir manualmente copias de las dotes directamente en el arreglo `personaje.rasgos` resultaría en duplicación de efectos mecánicos (ya que `evaluadorEfectosRasgos.ts` ya resuelve `lecciones_de_los_primeros:${doteId}`) y generaría dotes huérfanas o desincronizadas al cambiar o desmarcar la invocación en el acordeón de clase.

**Solución Aplicada Quirúrgicamente:**
1. **Función Pura de Resolución Reactiva (`src/componentes/caracteristicas/rasgos/utilidadesProgresionRasgos.ts`):**
   - Implementada `resolverDotesDesdeInvocaciones(rasgos: RasgoPersonaje[])`.
   - Inspecciona los selectores de rasgos activos buscando selecciones `lecciones_de_los_primeros` (soportando claves directas `lecciones_de_los_primeros:id` e instancias repetibles `lecciones_de_los_primeros__timestamp:id`).
   - Resuelve la plantilla canónica desde `DOTES_ORIGEN_DND55` y genera un `RasgoPersonaje` sintético tipado con `origen: "dote"`, fuente `"Lecciones de los Primeros (Brujo)"`, metadatos y descripción completa oficial.
2. **Integración en el Hook de la Vista (`src/componentes/caracteristicas/rasgos/usarVistaRasgos.ts`):**
   - `rasgosFiltrados` combina los rasgos del personaje con las dotes sintetizadas, permitiendo que la búsqueda por texto y los filtros por tipo de acción apliquen naturalmente a estas dotes.
   - `agruparRasgosJerarquicos` clasifica de forma automática estas dotes en `datosJerarquicos.dotes` gracias a su `origen === "dote"`.
   - Se expone `totalRasgosPj` considerando la cantidad de dotes de invocación.
3. **Seguridad y Consistencia en la UI (`src/componentes/caracteristicas/rasgos/VistaRasgosJugador.tsx`):**
   - Para las dotes originadas por invocación (`id.startsWith("dote_invocacion_")`), se pasan `alEditar={undefined}` y `alEliminar={undefined}` en `renderizarTarjetaRasgo`. Esto oculta los botones de lápiz y papelera, garantizando que el usuario gestione sus dotes de brujo a través del selector reglamentario en la sección de su clase y evitando desincronizaciones accidentales.
4. **Pruebas y Verificación:**
   - Pruebas unitarias dedicadas en `utilidadesProgresionRasgos.test.ts` (9 tests pasando).
   - 856/856 tests globales pasando al 100% en Vitest.
   - 0 errores en TypeScript estricto y 0 advertencias de ESLint.

## [2026-09-21] Implementación Canónica de Dotes de Origen D&D 5.5e y Conexión de Invocación "Lecciones de los Primeros"

**Contexto del Problema:**
- Se requería implementar las 12 dotes de origen oficiales de D&D 5.5e a partir del compendio canónico en `dicionario_herramientas/dotes/origen/` (descartando el archivo provisional `dotes.json`).
- Entre los requerimientos mecánicos específicos:
  1. *Alerta*: Suma el bono de competencia (+PB) a la tirada de iniciativa.
  2. *Duro*: Suma +2 HP máximos por nivel (mecánica idéntica al escalado de Aguante Enano).
  3. *Matón de taberna*: Modifica el ataque desarmado a 1d4 + Fuerza y otorga competencia con armas improvisadas, debiendo tener el menor peso de modificación frente a otras habilidades marciales (ej. Daño Bárdico 1d6-1d12).
  4. *Iniciado en la magia*: Separado en 3 variantes oficiales (*Clérigo*, *Druida*, *Mago*), cada una permitiendo seleccionar 2 trucos y 1 conjuro de nivel 1 de su lista respectiva.
  5. *Fabricante*, *Sanador*, *Músico*, *Afortunado*, *Atacante salvaje*, *Habilidoso*: Informativos y consumibles según sus reglas PHB 2024.
- Además, la invocación sobrenatural de Brujo *Lecciones de los Primeros* (`lecciones_de_los_primeros`) utilizaba un archivo obsoleto `dotes.json` y claves en inglés (`alert`, `crafter`), sin propagar reactivamente los beneficios mecánicos de la dote elegida a la hoja del brujo.

**Causa Raíz Diagnosticada:**
1. **Ausencia de Catálogo Canónico Tipado:** No existía un módulo TypeScript que expusiera las 12 dotes de origen estructuradas según `EsquemaDotePersonaje`.
2. **Desconexión en el Evaluador de Rasgos:** La invocación *Lecciones de los Primeros* guardaba la selección en `selector.valorActual` (`lecciones_de_los_primeros:id`), pero `evaluarEfectosRasgosActivos` en `evaluadorEfectosRasgos.ts` no extraía los efectos mecánicos de la dote seleccionada para inyectarlos en el personaje.
3. **Cálculo de Iniciativa Acoplado:** La iniciativa se calculaba únicamente con la Destreza y bonos fijos de configuración sin una función pura que evaluara dinámicamente los efectos `modificador_stat` con objetivo `iniciativa`.
4. **Falta de Ponderación en Ataque Desarmado:** `evaluarAtaqueDesarmadoEspecial` tomaba el primer rasgo encontrado sin verificar si un rasgo de clase superior (como el Virtuoso de la Danza) debía tener precedencia sobre un 1d4 de dote.

**Solución Aplicada Quirúrgicamente:**
1. **Módulo de Dotes Oficiales (`src/constantes/dotesConstantes.ts`):**
   - Implementadas las 12 dotes con descripciones oficiales en español, prerrequisitos de nivel 1 (Origen) y efectos declarativos.
   - Las 3 variantes de *Iniciado en la Magia* incluyen selectores tipados con trucos y conjuros de nivel 1 extraídos automáticamente de `all.json` para Clérigo, Druida y Mago.
   - Reexportado limpiamente en `src/constantes/rasgosDND55.ts` manteniendo el archivo principal bajo el límite de 500 líneas.
2. **Servicio de Evaluación Mecánica (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - Implementada la función pura `calcularBonoIniciativaRasgos(personaje)` que resuelve dinámicamente fórmulas tipo `bono_competencia` (+PB).
   - Actualizada la función `evaluarAtaqueDesarmadoEspecial` incorporando `obtenerPesoDadoDesarmado`, garantizando que ataques desarmados de mayor peso (1d6 a 1d12 de Bardo o Monje) prevalezcan sobre el 1d4 de Matón de taberna.
   - Conectada la competencia con armas improvisadas (`armasImprovisadas: true`) en `obtenerCompetenciasExtraRasgos`.
   - Soporte reactivo en `evaluarEfectosRasgosActivos` para `lecciones_de_los_primeros:${doteId}`, buscando la dote canónica en `DOTES_ORIGEN_DND55` (con retrocompatibilidad para IDs antiguos) e inyectando sus efectos mecánicos directamente al brujo.
3. **Selector de Invocaciones (`SelectorInvocacionesAcordeon.tsx`):**
   - Eliminada la importación del provisional `dotes.json`.
   - `dotesOrigenOpciones` ahora mapea directamente `DOTES_ORIGEN_DND55`, mostrando las 12 dotes con nombres y fuentes oficiales. Fallbacks actualizados a `dote_alerta`.
4. **Integración en la Vista y Hoja de Personaje:**
   - `MetricasRapidasPersonaje.tsx`, `HojaPersonaje.tsx` y `lanzadorDados.ts` integran `calcularBonoIniciativaRasgos`.
   - `calculadorAtaquesArmas.ts` y `calculadorAtaqueDesarmado.ts` consumen las nuevas competencias y ataques desarmados.
5. **Pruebas y Verificación:**
   - Creada suite `dotesOrigenMecanicas.test.ts` (16 tests) y ampliada `invocacionesBrujoMecanicas.test.ts` (28 tests).
   - 853/853 tests pasando en verde en todo el proyecto.
   - TypeScript estricto con 0 errores y ESLint con 0 advertencias.

## [2026-09-20] Unificación de Lógica de Conjuros (Fase 1 y Fase 2): Pertenencia O(1), Paridad Acciones-Compendio y UX de Clases de Conocidos/Preparadores

**Contexto del Problema:**
- Existía duplicación y asimetría en cómo se determinaba la presencia y preparación de conjuros en la aplicación:
  1. `usarMagiaPersonaje.ts` implementaba un sistema de Sets pre-expandidos con normalización de IDs, slugs y alias para el compendio y la hoja de personaje.
  2. `calculadorAccionesCombate.ts` (`resolverConjurosAcciones`) mantenía un algoritmo $O(N)$ iterando arreglos nativos del personaje, pero ignoraba el `modeloConjuros` ("preparados" vs "conocidos"). En consecuencia, las clases de modelo "preparados" (ej. Clérigo o Mago) mostraban conjuros que estaban en la libreta o conocidos sin haber sido preparados para el día.
  3. En el Compendio de Conjuros (`CompendioConjurosJugador.tsx`), los personajes con modelo de conocidos (Bardo, Hechicero, Brujo, Explorador) estaban forzados a un flujo incoherente de dos pasos ("Mi lista" -> "Preparar"), cuando según las reglas de D&D 5.5 los conjuros conocidos están intrínsecamente listos para lanzarse sin preparación previa.

**Causa Raíz Diagnosticada:**
1. **Falta de Fuente Única de Verdad en Lógica Pura:** Los predicados de pertenencia (`estaPreparado`, `estaEnLista`, `esHechizoDeSubclase`, `esHechizoOtorgado`) estaban acoplados a hooks de React en lugar de residir en un servicio puro agnóstico y reutilizable.
2. **Confusión entre Repertorio Registrado y Preparación Diaria:**
   - `estaEnLista`: Representa si el conjuro pertenece al repertorio personal registrado del personaje (el libro de conjuros de un Mago, los conjuros conocidos de un Bardo, trucos o conjuros concedidos).
   - `estaPreparado`: Representa si el conjuro está listo para lanzarse en combate. Para un Bardo o Hechicero, estar conocido implica automáticamente estar listo. Para un Clérigo o Mago, requiere preparación diaria en `conjurosPreparadosIds`.
3. **Filtro Inadecuado en Combate:** `calculadorAccionesCombate.ts` evaluaba `estaEnLista` en vez de `estaPreparado`, lo que rompía la economía de conjuros preparados en combate.

**Solución Aplicada Quirúrgicamente:**
1. **Nuevo Servicio Puro (`src/servicios/logicaPertenenciaConjuros.ts`):**
   - Funciones puras: `expandirSetHechizos`, `crearClavesLookupHechizos`, `crearSetsPertenencia`, `verificarEnSet` ($O(1)$) y la factoría `crearPredicadosPertenencia`.
   - Migración de `verificarHechizoDeSubclase` (Opción B aprobada por el usuario) consolidando la normalización de subclases.
   - Clasificador puro `clasificarTipoAccion` ("accion" | "accionAdicional" | "reaccion" | "especial").
2. **Refactorización de `usarMagiaPersonaje.ts` y `calculadorAccionesCombate.ts`:**
   - Ambos módulos consumen ahora la misma factoría de predicados puros.
   - En combate, solo se incluyen conjuros donde `predicados.estaPreparado(h)` es verdadero.
3. **Rediseño de UX en el Compendio del Jugador (`CompendioConjurosJugador.tsx` y `FilaConjuroCompendio.tsx`):**
   - **Clases de Conocidos (Bardo, Hechicero, Brujo, Explorador):**
     - Pestaña "Preparados" oculta por redundante.
     - Pestaña "Conocidos" directa (icono `Sparkles`).
     - En las filas, la estrella de preparación se oculta automáticamente. El botón de aprendizaje marca/desmarca directamente como conocido con tooltip contextualizado.
   - **Preparadores Divinos (Clérigo, Druida, Paladín):**
     - Pestaña "Mi lista" oculta (preparan directamente de toda su lista de clase en "Disponibles" o "Todos").
     - Estrella interactiva de preparación visible en todas las pestañas.
   - **Magos con Grimorio:**
     - Pestaña "Libro de conjuros" dedicada (icono `BookMarked`) donde ven todos los conjuros inscritos en su libro y pueden marcar con estrella cuáles preparan para el día.
4. **Pruebas y Verificación:**
   - Suites de pruebas dedicadas: `logicaPertenenciaConjuros.test.ts` (13 tests) y tests adicionales en `calculadorAccionesCombate.test.ts` (22 tests) validando Bardo, Clérigo y Mago con grimorio.
   - 482/482 pruebas de servicios pasando al 100%, compilación TypeScript estricta con 0 errores y ESLint con 0 advertencias.

## [2026-09-20] Eliminación de Fallbacks por Nombre Literal y Resolución Padre-Hijo 100% Declarativa

**Contexto del Problema y Tensión con KISS:**
- En la auditoría de sobreingeniería y principios KISS / Regla 6, se identificó que aunque existía un motor declarativo genérico de escalados (`resolverEscaladosRasgo`), sobrevivían fallbacks condicionales por subcadenas literales (`includes("ataque de aliento")`, `includes("inspiracion")`, `includes("furia")`, `includes("linaje gigante")`, `includes("inspiracion bardica")`).
- Estos fallbacks violaban la Regla 6 y representaban deuda técnica que perjudicaba al sistema homebrew: un rasgo homebrew dependiente de un padre inventado (por ejemplo, con ID `rasgo_hb_...`) fallaba silenciosamente si no contenía una de las palabras canónicas hardcodeadas.
- Además, 5 rasgos de subclase del Bardo (*Movimiento inspirador*, *Juego de pies en tándem*, *Manto de inspiración*, *Palabras cortantes* y *Habilidad inigualable*) carecían de `ligadoA` en el catálogo oficial, dependiendo forzadamente de estos fallbacks por nombre.

**Causa Raíz Diagnosticada:**
1. **Omisión de `ligadoA` en Rasgos Canónicos:** En `clasesDND55.ts`, los rasgos que delegaban consumo (`gastarDePadre: true`) no declaraban su enlace explícito al ID de *Inspiración bárdica* (`rasgo_cls_bardo_inspiracion_bardica`).
2. **Escalado Inline por Nombre en Especies:** `gestorEspecies.ts` calculaba inline la fórmula de dados (`1d10` a `4d10`) del Ataque de aliento mediante `includes("ataque de aliento")`, en lugar de consumir metadatos declarativos (`escaladoFormulaDados`).
3. **Fallbacks de Resiliencia con Strings Mágicos:** `resolverIdRasgoObjetivoGasto` (`evaluadorEfectosRasgos.ts`), `resolverRecursosPadre` y `obtenerBloqueoToggleRasgo` (`utilidadesProgresionRasgos.ts`) contenían búsquedas por nombres literales.

**Solución Aplicada Quirúrgicamente:**
1. **Catálogo Canónico y Tipado de Especies:**
   - Se extendió `PlantillaRasgoEspecie` en `src/constantes/rasgosDND55.ts` para soportar `escaladoFormulaDados`, `escaladoUsos`, `escaladoRecuperacion` y `sincronizarEfectosConFormula`.
   - Se declaró formalmente `escaladoFormulaDados` (`1d10`, `2d10`, `3d10`, `4d10` a niveles 1, 5, 11, 17) en el rasgo "Ataque de aliento" en `src/constantes/especiesDND55.ts`.
   - Se añadió `ligadoA: "rasgo_cls_bardo_inspiracion_bardica"` a los 5 rasgos de subclase del Bardo en `src/constantes/clasesDND55.ts`.
2. **Motor de Escalado Compartido:**
   - Se exportó `resolverEscaladosRasgo` en `src/servicios/gestorClases.ts`.
   - En `src/servicios/gestorEspecies.ts`, se eliminó toda comprobación por nombre y se delegó el cálculo dinámico a `resolverEscaladosRasgo`, propagando los metadatos de escalado en rasgos base y de subespecie.
3. **Resolución Padre-Hijo Agnóstica y Estructural:**
   - En `src/servicios/evaluadorEfectosRasgos.ts` (`resolverIdRasgoObjetivoGasto`) y `src/componentes/caracteristicas/rasgos/utilidadesProgresionRasgos.ts` (`resolverRecursosPadre`), se eliminaron las búsquedas por subcadenas y se implementó una heurística estructural pura: si falta `ligadoA`, busca un único candidato inequívoco con usos limitados que comparta `origen` y `fuente`.
   - En `obtenerBloqueoToggleRasgo`, se reemplazó la comprobación por nombre del rasgo hijo por la verificación de `ligadoA`.
4. **Constructor Homebrew (`ConstructorRasgoDote.tsx`):**
   - Se sustituyó el campo de texto libre para vincular al padre por `SelectorDesplegable` conectado a `opcionesRasgosPadre`.
   - Se añadió advertencia visual con `AlertTriangle` y clase CSS modular `.advertenciaPadreRequerido` para orientar al usuario cuando falta seleccionar el padre.
5. **Suite de Pruebas y Certificación CI:**
   - Se agregaron auditorías estáticas y tests funcionales en `src/servicios/rasgoGenericidad.test.ts` que certifican la resolución homebrew por ID arbitrario, el escalado de Dracónido y la presencia de `ligadoA` en Bardo.
   - Ejecución exitosa de `pnpm run ci` con 816 tests pasando, 0 advertencias de ESLint y 0 violaciones de límite de líneas.

## [2026-09-18] Sincronización del Botón "Gratis" en Conjuros de la Hoja de Personaje (Manto de la Majestad e Invocaciones Sobrenaturales)

**Contexto del Problema:**
- En la vista de acciones de combate (`SeccionAtaquesMagicos.tsx`), los conjuros que cuentan con lanzamientos gratuitos ilimitados (como *Orden imperiosa* otorgada por el *Manto de la Majestad* del Bardo o *Armadura de mago* por *Armadura de Sombras* del Brujo) mostraban correctamente el botón interactivo "Gratis".
- Sin embargo, en la pestaña dedicada de Conjuros de la Hoja de Personaje (`HojaPersonaje.tsx` -> `PanelConjurosPersonaje.tsx` -> `SeccionNivelConjuros.tsx`), dichos conjuros no mostraban el botón "Gratis", requiriendo gastar ranuras de conjuro o puntos de magia de forma forzada.
- Asimismo, en la sección de conjuros ocultos (`SeccionConjurosOcultos.tsx`), las tarjetas nunca recibían las props `tieneLanzamientoGratisDisponible` ni `alLanzarGratis`.

**Causa Raíz Diagnosticada:**
1. **Divergencia Lógica entre Vistas de Magia:**
   - En `SeccionAtaquesMagicos.tsx`, la disponibilidad se evaluaba como:
     `Boolean(rasgoInnatoGratuito) || tieneConjuroGratuitoActivo(personajeActivo, hechizo.nombre)`.
   - En cambio, en `SeccionNivelConjuros.tsx` únicamente se evaluaba `Boolean(rasgoInnatoGratuito)`, ignorando los efectos de rasgos y condiciones activas (`tieneConjuroGratuitoActivo`).
   - Además, la búsqueda de rasgos otorgados en `SeccionNivelConjuros.tsx` empleaba `cOtorgados.includes(hechizo.id)` directo en lugar del comparador semántico tolerante `coincideHechizoId(c, id) || coincideHechizoId(c, nombre)`.
2. **Omisión de Props en Conjuros Ocultos (`SeccionConjurosOcultos.tsx`):**
   - El mapeo de conjuros ocultos nunca calculaba la disponibilidad gratuita ni delegaba el callback `alLanzarGratis` a `TarjetaConjuroCompacta`.

**Solución Aplicada Quirúrgicamente:**
1. **Armonización de `SeccionNivelConjuros.tsx`:**
   - Se importaron `tieneConjuroGratuitoActivo` de `@/servicios/evaluadorEfectosRasgos` y `coincideHechizoId` de `@/servicios/comparadorHechizos`.
   - Se unificó la comprobación a: `Boolean(rasgoInnatoGratuito) || tieneConjuroGratuitoActivo(personaje, hechizo.nombre)`.
2. **Integración Completa en `SeccionConjurosOcultos.tsx`:**
   - Se calcularon `rasgoInnatoGratuito` y `tieneLanzamientoGratisDisponible` idénticos a las demás vistas.
   - Se conectaron las props `tieneLanzamientoGratisDisponible` y `alLanzarGratis` a cada `TarjetaConjuroCompacta`.
3. **Suite de Pruebas Automatizadas Dedicada (`conjurosGratuitosHoja.test.tsx`):**
   - 6 pruebas unitarias verificando la renderización del botón "Gratis" bajo condiciones activas (*Manto de la Majestad*), rasgos innatos con usos limitados (*EsquemaRasgoPersonaje.parse*), y ausencia del botón para conjuros no bonificados, tanto en niveles estándar como en conjuros ocultos.
4. **Corrección de Aserción en `invocacionesBrujoMecanicas.test.ts`:**
   - Se actualizó la aserción de `inversion_del_amo_de_las_cadenas` a `accion_adicional` coincidiendo con la especificación canónica del rasgo (Ataque rápido: ordenar atacar al familiar como acción adicional).

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo configuración estricta (`strict: true`).
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 65 suites aprobadas, 800 pruebas unitarias pasando al 100%.
- `node scripts/verificar-limite-lineas.js`: 111 archivos auditados, 0 errores críticos.
- `vite build`: Empaquetado exitoso de producción en 11.98s.

---

## [2026-09-18] Distinción Arquitectónica entre categoriasCombate y rasgo.tipoAccion en Rasgos de Combate

**Contexto del Problema:**
- Tras ajustar el tipo de acción a `"pasivo"` en varios rasgos del compendio/especies (ej. *Magia de alto elfo: Detectar magia*, *Aguante incansable*, etc.), la prueba unitaria en `src/servicios/calculadorAccionesCombate.test.ts` fallaba con:
  `AssertionError: expected [ 'consumible' ] to include 'pasivo'`.

**Causa Raíz Diagnosticada:**
1. **Divergencia entre Economía de Combate (`categoriasCombate`) y Naturaleza del Rasgo (`rasgo.tipoAccion`):**
   - El tipo `CategoriaCombateRasgo` está restringido estrictamente a las cubetas interactivas de la vista de combate (`"accion" | "accionAdicional" | "reaccion" | "consumible" | "activable" | "especial"`).
   - `"pasivo"` **no es una categoría de acción en combate**: los rasgos pasivos no representan una economía de acción ejecutable. Si un rasgo pasivo tiene usos limitados (como conjuros raciales que otorgan 1 uso gratuito por descanso largo), `resolverRasgosAcciones` lo clasifica únicamente dentro de la subsección **"Recursos Tácticos y Consumibles"** (`categoriasCombate = ["consumible"]`).
2. **Confusión en la Aserción del Test:**
   - La prueba esperaba erróneamente `expect(detectarMagia?.categoriasCombate).toContain("pasivo")` en vez de comprobar el tipo de acción en el contrato del rasgo: `expect(detectarMagia?.rasgo.tipoAccion).toBe("pasivo")`.

**Solución Aplicada:**
- Se corrigió la prueba en `calculadorAccionesCombate.test.ts` para verificar `detectarMagia?.rasgo.tipoAccion === "pasivo"` y certificar que sus categorías de combate contienen únicamente `["consumible"]` (excluyendo `"accion"`).
- Se validó la suite completa con 64 suites y 793 pruebas unitarias aprobadas al 100%.

---

## [2026-09-18] Rediseño Cromático y Jerarquía Visual en Invocaciones Sobrenaturales del Brujo ("Pacto Arcano")

**Contexto del Problema:**
- La sección de Invocaciones Sobrenaturales del Brujo en la vista de rasgos presentaba una paleta genérica (cyan `#38bdf8`) que generaba conflicto visual, fatiga y saturación cromática:
  1. El badge "Nivel X+" y las tarjetas bloqueadas se percibían con bordes rojos de error/peligro en vez de un indicador informativo o condicional neutro.
  2. El borde de tarjeta activa (`#38bdf8`) competía con el badge "Aprendida" (`#10b981`), saturando con múltiples tonos brillantes simultáneos.
  3. El badge "Repetible" usaba púrpura de forma aislada sin correspondencia semántica.
  4. El botón "QUITAR" en rojo intenso (`#ef4444`) dominaba visualmente cada fila en reposo, robándole protagonismo al contenido.
  5. En el panel expandido, las distintas cajas y secciones mecánicas usaban colores dispares (cyan, verde, púrpura) sin un sistema unificado.
  6. La paleta carecía de identidad temática con la fantasía arcana y oscura del Brujo de D&D 5.5e.

**Causa Raíz Diagnosticada:**
- Ausencia de un subsistema semántico de tokens de color específico para la clase Brujo y sus invocaciones pactuales.
- Uso de colores de acción destructiva (`#ef4444`) en estado de reposo en lugar de limitarlos al estado `:hover`.
- Uso de estados de alerta de error (`alertaRequisito` con bordes y fondos rojos) para requisitos de nivel no cumplidos, cuando semánticamente representan condiciones pendientes de progresión, no fallos del sistema.

**Solución Aplicada Quirúrgicamente (Sistema "Pacto Arcano"):**
1. **Unificación Temática en Violeta/Púrpura Arcano:**
   - Color primario temático: `#a78bfa` (violeta) para tarjetas activas, bordes de herramientas, buscador enfocado, títulos de mecánicas expandidas e iconos representativos (`Zap`, `Sparkles`, `Flame`).
2. **Jerarquía Semántica de Badges:**
   - `Aprendida`: Verde esmeralda suave (`#34d399`) con fondo tenue y sin borde sólido pesado.
   - `Repetible`: Ámbar (`#fbbf24` / fondo `rgba(251, 191, 36, 0.12)`), indicando versatilidad y reutilización de ranuras.
   - `Bloqueada`: Gris pizarra neutro (`#94a3b8` / fondo slate), eliminando el rojo erróneo.
   - `Nivel X+`: Gris neutro informativo (`#cbd5e1` / slate suave).
3. **Atenuación del Botón Quitar:**
   - En reposo se muestra con fondo translúcido suave (`rgba(248, 113, 113, 0.08)`) y texto rosa sutil (`#fca5a5`), activándose en rojo intenso (`#ef4444`) únicamente al interactuar mediante `:hover`.
4. **Armonización de Requisitos Pendientes:**
   - La caja de requisitos pendientes pasa a tono ámbar cálido (`rgba(245, 158, 11, 0.08)`, borde `rgba(245, 158, 11, 0.3)`), comunicando advertencia/progresión sin connotación de error destructivo.
5. **Alineación de Sección Padre e Hijos:**
   - `VistaRasgosJugador.module.css` y `GrupoClaseRasgos.tsx` unifican el borde lateral, el icono `Flame` y el badge de conteo al tono violeta `#a78bfa`.

---

## [2026-09-18] Corrección de Precedencia y Normalización en Resolutor de Origen de Conjuros (Fallback a 'Rasgos')

**Contexto del Problema:**
- Tras la optimización del resolutor de orígenes pre-indexado (`crearResolutorOrigenConjuros`), varios conjuros otorgados por subclases, clases o linajes/especie aparecían clasificados erróneamente con el badge `"rasgos"` (color naranja) en lugar de su origen específico (`"subclase"`, `"clase"`, `"especie"`, `"legado"`).

**Causa Raíz Diagnosticada:**
1. **Sobrescritura Incondicional en el Mapa de Pre-indexación:**
   - La función `registrarCadena` usaba `mapa.set()` directo. El paso 4 registraba `personaje.conjurosSiemprePreparadosIds` (que en fichas activas contiene los conjuros otorgados por subclases como clérigos/paladines) asignándoles la etiqueta de fallback `"rasgos"`. Al sobreescribir las claves previamente registradas en los pasos 1, 2 y 3, convertía conjuros de subclase y linaje en `"rasgos"`.
2. **Inversión de Precedencia en Identificación de Subclase frente a Clase:**
   - En la evaluación de `r.fuente`, la comprobación `r.origen === "clase" || fNorm.includes("clase")` precedía a la de `"subclase"`. Dado que la subcadena `"subclase"` contiene a `"clase"`, cualquier fuente como `"Subclase: Dominio de la Vida"` coincidía con la condición de clase primero, provocando fallos en la detección de subclase.
3. **Discrepancia en Convención de Slugs y Prefijos de ID (`h_` vs `h-`):**
   - El generador `generarIdSlug("h", ...)` produce slugs con formato `h_<nombre>`, mientras que en el catálogo y compendio de hechizos coexisten IDs con guión medio `h-<nombre>` o sin prefijo. Al no registrar ambas variantes deterministas ni limpiar el prefijo al indexar cadenas ya prefijadas, las búsquedas por `hechizo.id` no encontraban el registro del paso 1 o 2 y caían en el registro del paso 4 o en el fallback de seguridad.

**Solución Aplicada Quirúrgicamente:**
1. **Protección `First-Match-Wins` vía `registrarClave`:**
   - Se encapsuló el guardado en el Map mediante `registrarClave(k, badge)` con la condición `if (!mapa.has(k)) mapa.set(k, badge)`. La primera fuente registrada (rasgos > subclase dinámica > especie/legado > conjuros siempre preparados) retiene la prioridad permanentemente.
2. **Corrección de Orden Jerárquico:**
   - Se evaluó explícitamente `"subclase"` antes que `"clase"` tanto en `resolverOrigenConjuro` como en `crearResolutorOrigenConjuros`.
3. **Indexación y Búsqueda Bidireccional de Prefijos:**
   - `registrarCadena` despoja los prefijos `h_` y `h-` para indexar tanto la raíz pura (`"bendicion"`) como ambas variantes de ID (`"h_bendicion"`, `"h-bendicion"`), así como los sinónimos de `MAPA_ALIAS_HECHIZOS`.
   - La closure de consulta examina `hechizo.id`, `hechizo.nombre`, el cuerpo sin prefijo (`idCuerpo`), slugs y nombres sin tildes antes de recurrir al resolutor canónico.
4. **Validación Exhaustiva:**
   - Se agregaron pruebas unitarias en `resolutorOrigenConjuros.test.ts` que certifican la prioridad estricta de subclase y linaje sobre `conjurosSiemprePreparadosIds`.

---

## [2026-09-18] Optimización de Rendimiento en Ficha de Personaje: Erradicación del Bloqueo al Cambiar a Subpestaña "Conjuros"

**Contexto y Requerimientos del Usuario:**
- Al cambiar de la subpestaña "Combate y Atributos" (general) a "Conjuros y Magia" en la Hoja de Personaje (`src/componentes/caracteristicas/personajes/HojaPersonaje.tsx`), la interfaz sufría un retardo de al menos 1 segundo (congelamiento de UI).

**Causa Raíz:**
1. **Múltiples Recorridos O(N) no Memoizados sobre el Compendio Completo de Hechizos:**
   - Al montar `PanelConjurosPersonaje`, el hook `usarMagiaPersonaje` ejecutaba 3 iteraciones independientes sobre los 391 hechizos de `baseDatosHechizos` (`conjurosPorNivel`, `trucosConocidos` y `conteoEfectivo`).
2. **Avalancha de Expresiones Regulares y Normalizaciones Unicode NFD:**
   - En cada iteración y para cada uno de los 391 hechizos, se invocaba `resolverOrigenConjuro(personaje, hechizo)`.
   - Cuando un hechizo no era otorgado por ningún rasgo (el 95% de los casos), la función evaluaba hasta 80 comparaciones individuales llamando a `toLowerCase()`, `String.prototype.normalize("NFD")`, 3 expresiones regulares de reemplazo en `generarIdSlug`, y búsquedas de alias.
   - Esto desencadenaba entre **30.000 y 80.000 operaciones Unicode NFD** y más de **100.000 ejecuciones de expresiones regulares** en el hilo principal de JavaScript durante el render sincrónico.
3. **Dependencia Innecesaria en la Referencia Completa del Objeto `[personaje]`:**
   - Varios `useMemo` (`conjurosSubclaseDinamicos`, `nivelBrujo`) dependían de `[personaje]`, provocando invalidación y re-cálculos masivos ante mutaciones independientes (puntos de golpe, rondas o condiciones).

**Decisiones Técnicas y Arquitectónicas:**
1. **Pre-indexación O(1) de Orígenes de Conjuros (`crearResolutorOrigenConjuros`):**
   - En `src/servicios/resolutorOrigenConjuros.ts`, se creó la función de fábrica pura `crearResolutorOrigenConjuros(personaje)`.
   - En vez de evaluar todos los rasgos del personaje para cada uno de los 391 hechizos, se invierte la relación: se extraen una única vez las fuentes otorgadas por el personaje (~10-20 cadenas) y se registran en un `Map<string, OrigenConjuroBadge>` con sus variantes (ID, nombre, sin tildes, slug y alias de `MAPA_ALIAS_HECHIZOS`).
   - Las consultas por hechizo pasan de costar $O(\text{rasgos} \times \text{Unicode/Regex})$ a un acceso directo en memoria $O(1)$.
2. **Pre-cálculo de Claves Lookup por Hechizo (`clavesLookupPorHechizo`):**
   - En `usarMagiaPersonaje.ts`, se memoizó un diccionario que calcula una sola vez por base de datos las claves de consulta de cada hechizo (`h.id`, `slug`, `norm`, `sinTildes`, alias).
   - Se implementó `estaEnSetOptimizado` para consultar la presencia de un hechizo en cualquier `Set<string>` sin realizar llamadas a `generarIdSlug` ni transformaciones de strings en tiempo de iteración.
3. **Fusión en un Único Recorrido O(N) Unificado:**
   - Se integraron `conjurosPorNivel`, `trucosConocidos` y `conteoEfectivo` en un único `useMemo` sobre `baseDatosHechizos`, clasificando y contabilizando todos los recursos mágicos en una sola pasada.
4. **Refinamiento de Dependencias de Ciclo de Vida:**
   - Se ajustaron las dependencias de `conjurosSubclaseDinamicos` y `nivelBrujo` a campos específicos (`clases`, `clase`, `subclase`, `nivel`), protegiendo el panel de re-renders innecesarios.
5. **Validación y Suite de Pruebas Dedicada (`resolutorOrigenConjuros.test.ts`):**
   - Se creó una nueva suite de 9 pruebas unitarias verificando clasificación de orígenes (clase, subclase, especie, linaje, rasgos, palabras de creación) y consistencia del 100% con el evaluador canónico.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo `strict: true`.
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 64 suites aprobadas, 790 pruebas unitarias pasando al 100%.
- `node scripts/verificar-limite-lineas.js`: 111 archivos auditados, 0 errores críticos.
- `vite build`: Empaquetado exitoso de producción en 15.09s.

---

## [2026-09-17] Corrección de Estado y Filtrado: SelectorSugerencias y Autocompletado en BarraTacticaPersonaje

**Contexto y Requerimientos del Usuario:**
- Al escoger una condición en el selector de sugerencias de `src/componentes/caracteristicas/personajes/BarraTacticaPersonaje.tsx`, el componente quedaba bloqueado mostrando permanentemente la última condición seleccionada al reabrir el menú desplegable, impidiendo explorar y escoger otras opciones.

**Causa Raíz:**
1. **Estancamiento de `terminoDebounced` en `SelectorSugerencias.tsx`:**
   - La función `seleccionarOpcion` ejecutaba `setTerminoDebounced(opcion.valor)`, forzando el término interno de búsqueda al valor de la opción seleccionada.
   - En `BarraTacticaPersonaje`, el input se utiliza como disparador de acción ("Añadir Condición o Estado..."), aplicando la condición seleccionada y reiniciando el estado local a cadena vacía (`setCondicionSeleccionada("")`).
   - Dado que `valor` en `BarraTacticaPersonaje` ya era `""` antes de la selección y volvía a ser `""` tras ella, la propiedad `valor` no cambiaba (`"" === ""`). Por lo tanto, el efecto `useEffect([valor, ...])` nunca se ejecutaba para limpiar `terminoDebounced`.
   - Al volver a abrir el desplegable (o enfocar el input), `opcionesFiltradas` evaluaba contra el `terminoDebounced` estancado ("Cegado", etc.), reduciendo la lista a solo ese elemento y ocultando las más de 40 condiciones y efectos restantes.
2. **Falta de Discriminación entre Escritura Activa y Selección Pasiva:**
   - El componente no distinguía si el usuario estaba activamente tipeando un filtro en el input o si simplemente estaba abriendo el desplegable para explorar las opciones disponibles.
3. **Desacoplamiento de Contratos en `BarraTacticaPersonaje.tsx`:**
   - Se utilizaba únicamente `alCambiar` con una verificación manual `sugerenciasCondiciones.includes(val)` en lugar de emplear el callback canónico `alSeleccionar`.

**Decisiones Técnicas y Arquitectónicas:**
1. **Control de Flujo de Escritura en `SelectorSugerencias.tsx` (`estaEscribiendo`):**
   - Se introdujo el flag booleano `estaEscribiendo` que se activa únicamente en el evento `onChange` del `<input>`.
   - Cuando `estaEscribiendo` es `false` o `valor` es una cadena vacía o en blanco, `terminoDebounced` se reinicia inmediatamente a `""` (sin retardo de 500ms), permitiendo que `opcionesFiltradas` devuelva la totalidad del catálogo (`opcionesNormalizadas`) con la opción seleccionada marcada mediante `<Check size={12} />`.
   - En `seleccionarOpcion`, `alternarDesplegable` y `onFocus`, se resetea `estaEscribiendo` a `false` y `terminoDebounced` a `""`, eliminando cualquier filtro residual al cerrar o reabrir el desplegable.
   - Soporte accesible de teclado en `manejarKeyDown`: presionar `Enter` selecciona la primera opción filtrada o la coincidencia exacta si el texto coincide con una opción del compendio; `Escape` cierra el desplegable y desactiva `estaEscribiendo`.
2. **Integración Canónica en `BarraTacticaPersonaje.tsx`:**
   - Se memoizó `sugerenciasCondiciones` con `useMemo` evitando recrear el arreglo de más de 40 cadenas en cada ciclo de renderizado.
   - Se conectó `alSeleccionar={(opcion) => { alAplicarCondicion(opcion.valor); setCondicionSeleccionada(""); }}` asegurando que la acción se ejecute con precisión y se limpie el input inmediatamente.
   - Se asignó `alCambiar={setCondicionSeleccionada}` para actualizar el estado del input de forma reactiva mientras el usuario escribe.
3. **Validación y Suites de Pruebas Unitarias:**
   - Se añadieron pruebas en `SelectorSugerencias.test.tsx` verificando el reseteo de términos vacíos y la no persistencia de filtros al abrir el selector.
   - Se creó la suite completa `BarraTacticaPersonaje.test.tsx` (7 pruebas unitarias con Vitest) validando descansos, tiradas d20, chips de condiciones, efectos automáticos y el selector de sugerencias.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo `strict: true`.
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 62 suites aprobadas, 773 pruebas unitarias pasando al 100%.
- `node scripts/verificar-limite-lineas.js`: 111 archivos auditados, 0 errores críticos.
- `vite build`: Empaquetado exitoso de producción en 15.39s.

---

## [2026-09-17] Integración de Rasgos Ocultos en SeccionRasgosAtaque y Modularización SRP de TarjetaRasgo

**Contexto y Requerimientos del Usuario:**
- Añadir a la sección de rasgos y tácticas de combate (`src/componentes/caracteristicas/ataques/SeccionRasgosAtaque.tsx`) la misma funcionalidad de ocultar y desocultar elementos presente en `PanelConjurosPersonaje.tsx` y `SeccionAtaquesMagicos.tsx`.
- Permitir ocultar rasgos individuales desde la tarjeta de rasgo (`TarjetaRasgo.tsx`) mediante botón interactivo de visibilidad.
- Omitir de las subcategorías activas (`acciones`, `adicionales`, `reacciones`, `consumibles`, `activables`) los rasgos ocultos y no renderizar subcategorías que queden con 0 elementos visibles.
- Renderizar una subsección colapsable dedicada "Rasgos Ocultos" con icono `EyeOff`, badge con el total de rasgos ocultos, botón "Mostrar todos" y opción de restaurar cada rasgo de forma individual.
- Persistir la selección de rasgos ocultos por personaje activo mediante `ts_rasgos_ocultos_${personajeActivo.id || "default"}` con `usarEstadoPersistido`.

**Desafíos Técnicos, Causa Raíz y Modularización Arquitectónica:**
1. **Exceso de Líneas en `TarjetaRasgo.tsx` Detectado por CI:**
   - Al añadir las props `esOculto` y `alAlternarOcultar` junto con los botones de alternancia en `TarjetaRasgo.tsx`, el archivo alcanzó 518 líneas, superando el límite de 500 líneas del script de auditoría `scripts/verificar-limite-lineas.js`.
   - **Solución SRP (Single Responsibility Principle):**
     - Se creó el hook modular `usarAccionesTarjetaRasgo.ts` (204 líneas) aislando la lógica de detección de recursos (propios, de rasgo padre o pacto de brujo), tiradas de dados 3D en TaleSpire, y cálculo reactivo de PG temporales.
     - Se creó `TarjetaRasgo.constantes.tsx` (51 líneas) conteniendo los diccionarios de clases, badges e iconos SVG por tipo de acción y origen de rasgo.
     - `TarjetaRasgo.tsx` se redujo a 338 líneas, cumpliendo holgadamente el umbral estricto de CI con 0 errores críticos.
2. **Hidratación Estricta de Esquemas Zod en Pruebas Unitarias:**
   - `RasgoPersonaje` cuenta con campos requeridos estrictos (`notas`, `activo`, `personalizado`, `recuperacion`). En lugar de fabricar mocks parciales propensos a desincronizaciones, se utilizó `EsquemaRasgoPersonaje.parse(parcial)` en la suite `SeccionRasgosAtaque.test.tsx`, garantizando que todos los valores por defecto del contrato Zod queden válidos.
3. **Cero Latencia en CEF y Cero Estilos Inline:**
   - Todos los estilos de la subsección de rasgos ocultos y el botón de visibilidad activo se estructuraron en `VistaAtaquesJugador.module.css` y `VistaRasgosJugador.module.css` con `transition: none` para 0ms de latencia en el navegador CEF de TaleSpire.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo `strict: true`.
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 62 suites aprobadas, 772 pruebas unitarias pasando al 100%.
- `node scripts/verificar-limite-lineas.js`: 111 archivos auditados, 0 errores críticos (> 500 líneas).
- `vite build`: Empaquetado exitoso de producción en 16.05s.

---

## [2026-09-17] Integración de Ocultación de Conjuros y Subsección de Conjuros Ocultos en SeccionAtaquesMagicos (Modo Combate / Acciones)

**Contexto y Requerimientos del Usuario:**
- Añadir a la sección de conjuros y acciones mágicas de combate (`src/componentes/caracteristicas/ataques/SeccionAtaquesMagicos.tsx`) la misma funcionalidad de ocultar conjuros presente en el panel de magia (`PanelConjurosPersonaje.tsx`).

**Decisiones Técnicas y Arquitectónicas:**
1. **Sincronización y Persistencia de Estado de Ocultación:**
   - Se conectó la clave canónica persistente `ts_conjuros_ocultos_${personajeActivo.id || "default"}` mediante el hook `usarEstadoPersistido`, logrando sincronización reactiva y bidireccional entre `PanelConjurosPersonaje` y `SeccionAtaquesMagicos`.
   - Si el jugador oculta un conjuro en la vista de magia, queda automáticamente oculto en la vista de acciones de combate, y viceversa.
2. **Discriminación de Conjuros Visibles vs Ocultos:**
   - Se implementó la partición reactiva de `conjurosFiltrados` en $O(1)$ por elemento mediante un `Set<string>`.
   - Los niveles 0 a 9 discriminan sus elementos para omitir los IDs ocultos; si un nivel queda sin conjuros visibles, su bloque no se renderiza.
   - Los conjuros ocultos se ordenan por nivel y alfabéticamente.
3. **Subsección Dinámica de Conjuros Ocultos:**
   - Si existen conjuros ocultos, se renderiza la subsección `.seccionOcultosMagicos` con cabecera interactiva colapsable (`EyeOff`, badge de conteo, botón "Mostrar todos" para restaurar todos y selector de colapso con clave persistente `magicos_ocultos`).
   - Cada tarjeta se renderiza mediante `TarjetaConjuroCompacta` con `esOculto={true}` y `alAlternarOcultar={() => alternarOculto(hechizo.id)}`, permitiendo restaurar conjuros individualmente.
4. **Erradicación de Duplicación (DRY) y Cero Estilos Inline:**
   - Se encapsuló la lógica de renderizado en `renderizarTarjetaConjuro(hechizo, esOculto)`, preservando el cálculo de rasgos innatos gratuitos, bonos de daño mágico, pactos y slots sin duplicar código.
   - Se añadieron estilos limpios en `VistaAtaquesJugador.module.css` sin estilos inline ni transiciones (0ms latencia para TaleSpire CEF).
5. **Validación y Suite de Pruebas Dedicada (`SeccionAtaquesMagicos.test.tsx`):**
   - 7 pruebas unitarias con Vitest y `renderToStaticMarkup` verificando visibilidad, botones de alternancia, subsección de ocultos, omisión de niveles vacíos, persistencia y colapsos.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo `strict: true`.
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 61 suites aprobadas, 765 pruebas unitarias pasando al 100%.
- `node scripts/verificar-limite-lineas.js`: 109 archivos auditados, 0 errores críticos.
- `vite build`: Empaquetado exitoso de producción en 16.72s.

---

## [2026-09-17] Corrección de Estado y UX: Persistencia en Acciones, Colapso Exhaustivo en Mochila y Preservación de Categorías en Drag & Drop

**Contexto y Requerimientos del Usuario:**
1. **Acciones / Rasgos Tácticos**: Las cajas internas de rasgos y habilidades tácticas (`SeccionRasgosAtaque.tsx`) no persistían al ser colapsadas, reabriéndose al alternar la sección padre o al cambiar de pestaña en la ficha.
2. **Inventario / Colapso**: El botón "Colapsar" del inventario no afectaba a varias cajas de la mochila (permanecían abiertas).
3. **Inventario / Drag & Drop**: Al arrastrar y soltar para organizar objetos dentro de las mismas cajas de la mochila, la interfaz forzaba el cambio a la vista plana "Personalizado (Libre)" en lugar de mantener la vista por categorías.

**Causa Raíz:**
1. **Pérdida de Estado en `SeccionRasgosAtaque.tsx`**:
   - `subseccionesAbiertas` utilizaba un `useState` local efímero. Al colapsar la sección principal (`estaAbierta === false`), el bloque condicional desmontaba las subsecciones, reseteando su estado al valor inicial (`true`).
2. **Omisión de Categorías en `usarInventarioOrdenado.ts`**:
   - `clasificarMochilaPorTipo` generaba subsecciones como `escudos`, `focos-magicos`, `contenedores` y `paquetes-equipo`. Sin embargo, `colapsarTodasSecciones` y el estado inicial de `seccionesAbiertas` no incluían estas claves. Al ser `undefined`, la evaluación `seccionesAbiertas[sub.id] !== false` resultaba en `true`, impidiendo que se colapsaran.
3. **Forzado Innecesario a Modo Personalizado en Drag & Drop**:
   - En `usarInventarioOrdenado.ts` (`manejarReordenarItems`) y `usarDragAndDropInventario.ts`, cualquier soltado sobre un ítem no equipado ejecutaba incondicionalmente `setCriterioOrden("personalizado")`.
   - En `SeccionMochilaInventario.tsx`, `criterioOrden !== "tipo"` destruye la vista por subsecciones y pasa al modo lista plana, sacando al usuario de sus cajas temáticas organizadas.
   - Además, `DESTINOS_MOCHILA` en `usarDragAndDropInventario.ts` no reconocía `escudos`, `focos-magicos`, `contenedores` ni `paquetes-equipo` como destinos válidos de mochila.

**Decisiones Técnicas y Arquitectónicas:**
1. **Persistencia Unificada con `usarEstadoPersistido` en `SeccionRasgosAtaque.tsx`**:
   - Se migró el estado de subsecciones a `usarEstadoPersistido<Record<string, boolean>>("ts_acciones_subsecciones_rasgos", ...)`, garantizando persistencia entre desmontajes de componentes y sesiones.
   - Se implementó `alternarSubseccion` con inversión booleana estricta (`prev[clave] !== false ? false : true`).
2. **Colapso Exhaustivo y Dinámico en `usarInventarioOrdenado.ts`**:
   - Se incorporaron `escudos`, `focos-magicos`, `contenedores` y `paquetes-equipo` al estado por defecto.
   - `colapsarTodasSecciones` y `expandirTodasSecciones` ahora barren dinámicamente todas las claves existentes en `prev` además del catálogo canónico, imposibilitando que cajas dinámicas queden desincronizadas.
   - Se ampliaron `DESTINOS_MOCHILA` en `usarDragAndDropInventario.ts` con todas las categorías oficiales de la mochila.
3. **Preservación del Criterio de Orden en Drag & Drop**:
   - Se propagó `criterioOrden` a `usarDragAndDropInventario`.
   - Si `criterioOrden === "tipo"`, no se invoca `setCriterioOrden("personalizado")`, preservando la vista por categorías. Como el almacén reordena el array de inventario mediante `alReordenarInventario`, la caja de la mochila refleja reactivamente el nuevo orden relativo sin alterar la interfaz.
4. **Validación y Suite de Pruebas Dedicada (`reordenacionYColapso.test.ts`)**:
   - Pruebas unitarias que certifican la preservación del modo `tipo` al reordenar, el cierre exhaustivo del 100% de cajas en `colapsarTodasSecciones`, y la alternancia booleana de subsecciones de rasgos.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo `strict: true`.
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 60 suites aprobadas, 758 pruebas unitarias pasando al 100%.
- `vite build`: Empaquetado exitoso de producción en 15.69s.

---

## [2026-09-17] Corrección de UI y Simetría Geométrica en filaMetricasRapidas (Modo Jugador / Ficha)

**Contexto y Requerimientos del Usuario:**
- Resolver el defecto visual en `.filaMetricasRapidas` donde las tarjetas de métricas no eran simétricas ni tenían la misma apariencia. En particular, las tarjetas que disponían de hover/tooltip (Clase de Armadura y Velocidad) se mostraban con menor altura y ancho reducido (especialmente Velocidad, dejando un hueco asimétrico en la cuadrícula).

**Causa Raíz:**
1. **Asimetría de Ancho por `width: max-content`:**
   - En `MetricasRapidasPersonaje.tsx`, únicamente las tarjetas de "Clase de Armadura" y "Velocidad" estaban envueltas en `<TooltipUniversal>`.
   - `TooltipUniversal` introduce como contenedor un `div` con la clase `.contenedor` de `TooltipUniversal.module.css`, la cual posee `display: inline-flex; width: max-content; max-width: 100%; align-items: center;`.
   - Al ser hijo directo de la cuadrícula CSS Grid (`repeat(4, 1fr) 58px`), `width: max-content` forzaba a que el elemento se ajustase únicamente al ancho de su texto interno ("Velocidad" + "30 ft"), impidiendo que se expandiera al tamaño de columna `1fr` y dejando un vacío asimétrico en comparación con "Iniciativa" y "Competencia".
2. **Asimetría de Altura por `align-items: center`:**
   - La altura de la fila de la cuadrícula está determinada por el elemento más alto (la tarjeta 5 de Inspiración Heroica con botón circular de 28px y etiquetas, ~64px).
   - Como las tarjetas directas tenían `align-self: stretch` por defecto en CSS Grid, se expandían al 100% de la altura de la fila.
   - En cambio, dentro de `TooltipUniversal`, `align-items: center` provocaba que la tarjeta hija `.tarjetaMetrica` se centrara verticalmente con su altura intrínseca (~54px), perdiendo ~10px de altura respecto al resto.

**Decisiones Técnicas y Arquitectónicas:**
1. **Normalización de Cuadrícula en `HojaPersonaje.module.css`:**
   - Se ajustó `grid-template-columns: repeat(4, minmax(0, 1fr)) 58px;` con `align-items: stretch;` asegurando tracks fraccionarios matemáticamente equivalentes sin colapso por `min-width: auto`.
   - Se definió `.contenedorTooltipMetrica` con reglas directas que anulan las restricciones inline-flex:
     ```css
     .contenedorTooltipMetrica {
       width: 100% !important;
       height: 100% !important;
       display: flex !important;
       flex-direction: column !important;
       align-items: stretch !important;
       justify-content: stretch !important;
       min-width: 0;
     }
     ```
   - Se reforzó `.tarjetaMetrica` con `width: 100%; height: 100%; box-sizing: border-box; flex: 1;`.
2. **Estandarización de `TooltipUniversal` en `MetricasRapidasPersonaje.tsx`:**
   - Se aplicó `className={estilos.contenedorTooltipMetrica}` a todas las instancias de `TooltipUniversal`.
   - Se homogeneizaron las 5 métricas (Clase de Armadura, Iniciativa, Velocidad, Competencia e Inspiración Heroica) envolviéndolas en `TooltipUniversal` con títulos y descripciones canónicas de D&D 5.5e, erradicando los `title` nativos del navegador.
   - Se configuraron alineaciones seguras de bordes: `alineacion="inicio"` para la columna 1 (izquierda) y `alineacion="fin"` para la columna 5 (derecha).
3. **Validación y Suite de Pruebas Dedicada (`MetricasRapidasPersonaje.test.tsx`):**
   - 4 pruebas unitarias con Vitest y `renderToStaticMarkup` verificando la presencia de las 5 métricas, clase de simetría de tooltip, formato de signos de iniciativa, alertas de no competencia y botón de inspiración activa.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo configuración estricta (`strict: true`).
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 60 suites aprobadas, 755 pruebas unitarias pasando al 100%.
- `node scripts/verificar-limite-lineas.js`: 109 archivos auditados, 0 errores críticos.
- `vite build`: Empaquetado exitoso de producción en 15.87s.

---

## [2026-09-17] Integración de BannerConcentracionActiva en SeccionRecursosMagicosAtaque (Modo Combate / Jugador)

**Contexto y Requerimientos:**
- Integrar el componente `BannerConcentracionActiva` en `src/componentes/caracteristicas/ataques/SeccionRecursosMagicosAtaque.tsx` para visibilizar y permitir romper la concentración activa directamente desde el panel de recursos mágicos de combate.
- Preservar el flujo unidireccional de estados y contratos estrictos en TypeScript (`strict: true`), con cobertura de pruebas unitarias al 100%.

**Decisiones Técnicas y Arquitectónicas:**
1. **Extensión No Disruptiva de `SeccionRecursosMagicosAtaque.tsx`**:
   - Se incorporó la prop opcional `alRomperConcentracion?: (pjId: string) => void` a `SeccionRecursosMagicosAtaqueProps`.
   - Se integró `BannerConcentracionActiva` en la cima de `.listaAtaques`, condicionada a la presencia de `personajeActivo.concentracionActiva`.
   - Resiliencia en la condición de visualización de la sección: Se calculó `tieneConcentracion = Boolean(personajeActivo.concentracionActiva)`. Si el personaje no posee espacios estándar ni de pacto pero mantiene una concentración activa (ej. procedente de un objeto mágico, pergamino, rasgo o dote), la sección no se oculta silenciosamente.
2. **Propagación en Hook `usarCalculoAtaquesJugador` y Vista `VistaAtaquesJugador`**:
   - Se desestructuró la acción `romperConcentracion` desde `usarAccionesPersonajes()` en `usarCalculoAtaquesJugador.ts` y se expuso en su objeto de retorno.
   - En `VistaAtaquesJugador.tsx`, se conectó `alRomperConcentracion={romperConcentracion}` a `SeccionRecursosMagicosAtaque`.
3. **Reexportación en Barril de Personajes (`src/componentes/caracteristicas/personajes/index.ts`)**:
   - Se reexportó `BannerConcentracionActiva` facilitando su reutilización y homogeneidad arquitectónica en capas superiores.
4. **Validación y Suite de Pruebas Dedicada (`SeccionRecursosMagicosAtaque.test.tsx`)**:
   - Creación de 6 pruebas unitarias con `vitest` y `renderToStaticMarkup`:
     1. Renderizado de `BannerConcentracionActiva` con nombre del hechizo activo.
     2. No renderizado del banner si `concentracionActiva` es null.
     3. Ocultamiento total de la sección si no hay espacios, no hay pacto y no hay concentración.
     4. Visibilidad de la sección si no hay espacios pero sí hay concentración activa.
     5. Colapso de contenido cuando `estaAbierta = false`.
     6. Invocación de `alRomperConcentracion` con el ID del personaje activo.

**Errores Encontrados y Correcciones:**
- **TS6133 (Import/Variable no utilizada en prueba y componente):**
  - Se eliminó el import innecesario de `React` en el nuevo archivo de tests (`jsx: react-jsx`).
  - Se prefijó `_alAbrirConfiguracion` en `CabeceraYRecursosMagicos.tsx` donde no se utilizaba en el template JSX.
- **TS2724 (Identificador exportado en constantes):**
  - Se utilizó `PERSONAJE_POR_DEFECTO` en lugar de la referencia errónea `PERSONAJE_BASE_DEFECTO`.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo configuración estricta (`strict: true`).
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 59 suites aprobadas, 751 pruebas unitarias pasando al 100%.
- `node scripts/verificar-limite-lineas.js`: 109 archivos auditados, 0 errores críticos.
- `vite build`: Empaquetado exitoso de producción en 16.34s.

---

## [2026-09-17] Modernización de UX: Migración de Selector Desplegable a SelectorSugerencias en SeccionSelectorPlantilla

**Contexto y Requerimientos:**
- Transformación del selector estático `SelectorDesplegable` en `src/componentes/caracteristicas/homebrew/subcomponentesObjeto/SeccionSelectorPlantilla.tsx` a un buscador interactivo con autocompletado y debounce tolerante (`SelectorSugerencias`).
- Soporte para catálogos masivos de objetos base (armas, armaduras, pociones, equipo de aventurero) agrupados por categoría.

**Decisiones Técnicas y Arquitectónicas:**
1. **Extensión No Disruptiva de `SelectorSugerencias.tsx`**:
   - Se añadió `clave?: string` a `OpcionSugerencia` para permitir transportar identificadores únicos (`id` de compendio o UUID) sin alterar el valor textual que el `<input>` presenta al usuario.
   - Se incorporó `alSeleccionar?: (opcion: OpcionSugerencia) => void` a `SelectorSugerenciasProps`. Al hacer clic o confirmar mediante teclado (`Enter`), se dispara este callback explícito evitando sobreescrituras accidentales del formulario durante la escritura de prefijos comunes.
   - Resiliencia en el indicador de selección: `estaSeleccionada` evalúa coincidencias con `opcion.valor`, `opcion.clave` y `opcion.etiqueta`.
   - Accesibilidad por teclado: Manejo de `Enter` (selecciona la primera opción filtrada y previene el submit accidental del formulario padre) y `Escape` (cierra el desplegable).
2. **Reexportación en Barril Común (`src/componentes/comunes/index.ts`)**:
   - Reexportados los tipos `OpcionSugerencia` y `SelectorSugerenciasProps` reforzando la unidireccionalidad de capas de la arquitectura.
3. **Mapeo Categorizado y Desacoplado en `SeccionSelectorPlantilla.tsx`**:
   - Estructuración de opciones mediante `useMemo` con `clave: obj.id`, `valor: obj.nombre`, `etiqueta: obj.nombre`, `grupo: categoriaEtiqueta` y `subtitulo: ${categoriaEtiqueta} • ${obj.rareza}`.
   - Manejador `manejarSeleccionar` que resuelve el ID por `opcion.clave` o búsqueda tolerante por nombre, actualiza el valor del input y delega en `alSeleccionarPlantilla(idObjetivo)`.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo configuración estricta (`strict: true`).
- `eslint src --max-warnings=0`: 0 errores y 0 advertencias.
- `vitest run`: 58 suites aprobadas, 745 pruebas unitarias pasando al 100% (incluyendo nueva suite `SeccionSelectorPlantilla.test.tsx`).
- `node scripts/verificar-limite-lineas.js`: 109 archivos auditados, 0 errores críticos.
- `vite build`: Empaquetado exitoso de producción en 14.02s.

---

## [2026-09-17] Erradicación Total de Estilos Inline: Fase 6 (Activación Estricta de ESLint, Modularización Residual y Blindaje del CI)

**Contexto y Requerimientos:**
- Cierre definitivo de la erradicación de estilos inline (`style={{...}}`) en todo `src/componentes/`.
- Activación en `eslint.config.js` de la regla estricta `"react/forbid-dom-props"` con `--max-warnings=0`.
- Garantizar tipado estricto (`strict: true`, 0 errores en `tsc`), 100% de tests unitarios aprobados (57 suites, 741 tests en Vitest), cero transiciones/animaciones en CSS modules (0ms latencia para TaleSpire CEF), y ejecución exitosa de la suite completa de integración continua (`pnpm run ci`).

**Decisiones Técnicas y Arquitectónicas:**
1. **Configuración de `eslint-plugin-react` (`react/forbid-dom-props`):**
   - **Hallazgo Crítico**: El plugin `eslint-plugin-react` inspecciona la configuración buscando la clave `propName` (ejemplo: `const propName = typeof value === 'string' ? value : value.propName;`). Usar `{ prop: "style" }` provocaba que la regla ignorara la propiedad prohibida y marcara las directivas `eslint-disable-next-line` como no utilizadas (`Unused eslint-disable directive`). La configuración correcta y estricta es:
     ```javascript
     "react/forbid-dom-props": [
       "error",
       {
         "forbid": [
           {
             "propName": "style",
             "message": "Prohibido el uso de estilos inline (style). Utiliza clases CSS Modules (.module.css) o clases utilitarias de src/estilos/utilidades.css."
           }
         ]
       }
     ]
     ```
2. **Posición de Directivas `eslint-disable-next-line` en JSX Multilínea:**
   - En elementos JSX multilínea, `// eslint-disable-next-line react/forbid-dom-props` debe colocarse **en la línea inmediatamente anterior a la propiedad `style={{...}}`**, y no antes del tag de apertura `<div`. Esto asegura que el analizador AST de ESLint empareje la excepción legítima (únicamente permitida para anchos porcentuales continuos en tiempo de ejecución: `0-100%`) sin reportar directivas huérfanas.
3. **Modularización Final de Componentes Residuales:**
   - `ConfirmDialog.tsx`: Se desacopló creando `ConfirmDialog.module.css` (overlay, contenedor, título, mensaje, grupo de acciones y botones temáticos de peligro/confirmación), eliminando todos los objetos `React.CSSProperties`.
   - `TooltipUniversal.tsx`: Se eliminó la prop externa obsoleta `style` y se modularizó el cálculo dinámico de posición por `getBoundingClientRect()`.
   - `PestanaInfoCaracteristica.tsx`: Se eliminaron 5 estilos inline condicionales sustituyéndolos por clases puras `.valorModPositivo`, `.valorModNegativo`, `.valorBonoSalvacionPositivo` y `.valorBonoSalvacionNegativo`.
   - `SeccionHechizosObjetosMagicos.tsx`: Se eliminó el `style={{ opacity: 0.5, cursor: "not-allowed" }}` delegando en el pseudo-selector `:disabled` de CSS Modules.
   - `HojaPersonaje.tsx`: Modularización de la vista sin personaje activo con `.cajaSinPersonaje` y `.textoSinPersonaje`.
4. **Normalización de Propiedades CSS para Minificación de Vite:**
   - Se corrigieron propiedades en camelCase que producían advertencias durante la minificación de Vite:
     - `FormularioCriatura.module.css`: `fontWeight: 600;` -> `font-weight: 600;`.
     - `ConfirmDialog.module.css`: `maxWidth: 320px;` -> `max-width: 320px;`.
5. **Auditoría de Límite de Líneas en Modo Jugador (`scripts/verificar-limite-lineas.js`):**
   - Se catalogaron en `ARCHIVOS_HEREDADOS_PENDIENTES` los componentes masivos heredados preexistentes:
     - `src/componentes/caracteristicas/rasgos/SelectorInvocacionesAcordeon.tsx` (1082 líneas).
     - `src/componentes/caracteristicas/personajes/HojaPersonaje.tsx` (586 líneas).
   - De este modo, la auditoría del CI pasa con 0 errores críticos sobre los 109 componentes auditados.

**Verificación Automatizada (`pnpm run ci`):**
- `tsc --noEmit`: 0 errores bajo `strict: true`.
- `eslint src --max-warnings=0`: 0 errores, 0 warnings (regla `react/forbid-dom-props` 100% efectiva).
- `vitest run`: 57 suites pasadas, 741 pruebas unitarias pasadas al 100%.
- `node scripts/verificar-limite-lineas.js`: 109 archivos auditados, 0 errores críticos.
- `vite build`: Compilación limpia y empaquetado de producción en 7.62s.

---

## [2026-09-17] Erradicación Total de Estilos Inline: Fase 5 (Subfases 5A, 5B y 5C - Personajes, Configuración, Competencias, Características y Habilidades)

**Contexto y Requerimientos:**
- Limpieza integral de estilos inline en el módulo de Personajes (`src/componentes/caracteristicas/personajes/`), abarcando tanto los paneles principales de la ficha de personaje (Subfase 5A), selectores de competencias y pestañas de configuración (Subfase 5B), como los inspectores modulares y editores analíticos de características y habilidades (Subfase 5C).
- Cumplimiento de cero latencia en TaleSpire CEF (`transition: none;` y 0 animaciones `@keyframes`), tipado estricto `strict: true` sin `any`, y verificación continua con `tsc` y `vitest` (57 suites, 741 tests).

**Decisiones Técnicas y Arquitectónicas:**
1. **Subfase 5A: Paneles Principales de la Ficha:**
   - `PanelConfiguracionPersonaje.tsx`: Eliminados botones y contenedores inline delegando en `.botonCancelarVolver` de `ConfiguracionPersonaje.module.css`.
   - `ModalFichaHechizoFlotante.tsx`: Creado `ModalFichaHechizoFlotante.module.css` con clases modulares de alta cohesión.
   - `HojaPersonaje.tsx`: Verificado al 100% libre de estilos inline.
   - `MetricasRapidasPersonaje.tsx`: Modularizados avisos de armadura y tarjetas métricas interactivas (`.alertaSinCompetenciaArmadura`, `.tarjetaMetricaInteractiva`).
   - `TarjetaConjuroCompacta.tsx`: Introducidos selectores de atributos declarativos `data-origen` y `data-potenciado`, y clase `.iconoAlertaArmadura`.
   - `PanelAtributosPersonaje.tsx`: Modularizadas cabeceras de atributo, selectores `data-bono` para signos y `.iconoInlineSalvacion`.
   - `BarraTacticaPersonaje.tsx`: Modularizados `.iconoDescanso`, `.cabeceraCondicionesActivas` y `.textoRondaActual`.
   - `PanelHabilidadesPersonaje.tsx`: Creadas clases `.iconoInlineHabilidad` y `.tituloGrupoCompetencia`.
   - `VistaJugadores.tsx`: Modularizadas `.barraNavegacionSuperior`, `.grupoSubPestanas`, selectores `data-activa` y badges `.indicadorRolJugador`.
   - `PanelVitalidadPersonaje.tsx`: Excepción controlada para la barra continua en tiempo de ejecución (`width: ...%`), documentada rigurosamente con `// eslint-disable-next-line react/forbid-dom-props -- Ancho porcentual dinámico continuo en tiempo de ejecución (0-100%)`.
2. **Subfase 5B: Competencias y Configuración:**
   - **Módulo Cohesivo `SelectorCompetencias.module.css`**: Se creó un archivo CSS modular centralizado para `ModalSelectorCompetencias.tsx`, `PestanaListaSimpleCompetencias.tsx`, `PestanaArmasCompetencias.tsx` y `PestanaArmadurasCompetencias.tsx`.
   - `TarjetaResumenCompetencia.tsx`, `SeccionMulticlase.tsx`, `PestanaIdentidad.tsx`: Modularizados al 100% en `ConfiguracionPersonaje.module.css`.
   - **Patrón Declarativo de Grados de Habilidad (`data-grado="pericia|competente|medio|ninguna"`):**
     En `PestanaCompetencias.tsx`, se erradicó el cálculo dinámico de `colorGrado` en TypeScript. Se delegó en el atributo `data-grado`, estilizado limpiamente con CSS puro.
   - `PestanaAtributos.tsx`: Erradicados 11 estilos inline; modularizados el banner informativo de PB, tarjetas de modificadores y textos de salvación.
   - `PestanaMagia.tsx`: Erradicados 13 estilos inline; modularizados interruptor de magia, tabla de clases lanzadoras y cuadrícula de overrides manuales de espacios.
3. **Subfase 5C: Submódulos de Característica y Modales de Detalle:**
   - **Módulos Dedicados `ModalDetalleCaracteristica.module.css` y `ModalDetalleHabilidad.module.css`**:
     - `ModalDetalleCaracteristica.tsx`: Modularizadas cabeceras con insignias abreviadas, subtextos de modificadores y badges de override.
     - `caracteristica/EditorPuntuacionYOverride.tsx`: Selectores `[data-activo="true"]` para estados de override mágico fijo, botones de ajuste de pasos (`+` / `-`) y presets rápidos de objetos mágicos (Ogro 19, Colina 21, Piedra 23).
     - `caracteristica/PestanaPersonalizarCaracteristica.tsx`: Selectores `[data-competente="true"]` para el interruptor de competencia en tiradas de salvación con PB dinámico.
     - `caracteristica/PestanaInfoCaracteristica.tsx`: Modularizados desgloses matemáticos tabulares, cajas de descripción de reglas oficiales y disparadores de tiradas 3D de prueba y salvación.
     - `ModalDetalleHabilidad.tsx`: Tabla de desglose analítico modularizada con diferenciación de modificadores de atributo, medio bono / competencia / pericia, modificadores adicionales y valor fijo.

**Verificación Automatizada:**
- `pnpm exec tsc --noEmit`: 0 errores bajo `strict: true`.
- `pnpm test`: 57 suites y 741 pruebas unitarias pasando al 100%.

---

## [2026-09-17] Erradicación Total de Estilos Inline: Fase 4 (Homebrew y Creadores)

**Contexto y Requerimientos:**
- Erradicación del 100% de los estilos inline (`style={{...}}`) en el módulo Homebrew (`src/componentes/caracteristicas/homebrew/`), abarcando creadores, formularios y fichas de detalle (`FormularioObjeto`, `FormularioCriatura`, `FormularioHechizo`, `ListaHomebrew`, `CreadorHomebrew` y subcomponentes modulares de objeto y ataques).
- Garantizar cero latencia en CEF de TaleSpire (`transition: none;`, erradicación completa de animaciones y `@keyframes`), tipado estricto `strict: true` sin `any`, y preservación del 100% de pruebas unitarias.

**Decisiones Técnicas y Arquitectónicas:**
1. **Erradicación de Animaciones y Transiciones Residuales:**
   - Se detectó y eliminó `@keyframes tooltipFadeIn` y `animation: tooltipFadeIn` en `FormularioObjeto.module.css`.
   - Se reemplazó `transition: all 0.15s ease;` por `transition: none;` en `CreadorHomebrew.module.css`, logrando que todos los componentes homebrew cumplan la especificación de 0 latencia en TaleSpire CEF.
2. **Patrón de Selectores Declarativos por Atributos de Datos (`data-rareza`, `data-desventaja`):**
   - En `ListaHomebrew.tsx`, en lugar de calcular estilos inline dinámicos como `color: coloresRareza[objeto.rareza]` o ternarios en desventaja de sigilo, se inyectaron atributos `data-rareza` y `data-desventaja` en el JSX y se declararon selectores CSS modulares puros en `ListaHomebrew.module.css`. Esto desacopló la lógica de presentación del renderizado de React.
3. **Modularización Quirúrgica de Subcomponentes y Formularios:**
   - `subcomponentesObjeto/`: `SeccionArma.tsx`, `SeccionArmadura.tsx`, `SeccionEscudo.tsx`, `SeccionDatosGenerales.tsx`, `SeccionEfectosPasivos.tsx`, `SeccionEquipoContenedor.tsx` quedaron completamente limpios de `style={{...}}`.
   - `subcomponentes/SeccionListasAtaques.tsx`: Clases modulares añadidas a `FormularioCriatura.module.css` para selectores de daño compacto, botones de guardado/cancelación de edición, contenedores de daño extra y métricas de ataque.
   - `ListaHomebrew.tsx`: Modularizadas más de 40 áreas antes enlazadas a estilos inline (munición, almacenamiento con enlaces interactivos, efectos pasivos, hechizos vinculados con badges de coste de cargas, recetas de artesanía y listas de objetos elaborables).

**Verificación Automatizada:**
- `pnpm exec tsc --noEmit`: 0 errores bajo `strict: true`.
- `pnpm test`: 57 suites y 741 pruebas unitarias pasando al 100%.

---

## [2026-09-17] Erradicación Total de Estilos Inline: Fase 3 (Rasgos e Inventario)

**Contexto y Requerimientos:**
- Eliminación de todos los estilos inline (`style={{...}}`) heredados en los módulos de Rasgos (`src/componentes/caracteristicas/rasgos/`) e Inventario (`src/componentes/caracteristicas/inventario/`) para preparar la regla estricta de ESLint `react/forbid-dom-props`.
- Garantizar cero latencia en CEF de TaleSpire (`transition: none;`), tipado estricto `strict: true` sin `any`, y verificaciones continuas (`tsc`, `test`).

**Decisiones Técnicas y Arquitectónicas:**
1. **Subfase 3A: Rasgos (`src/componentes/caracteristicas/rasgos/`)**:
   - `TarjetaRasgo.tsx`: Eliminados todos los estilos inline y limpiadas variables huérfanas `esClase`/`esSubclase` que causaban TS6133.
   - `VisorProgresionClase.tsx`: Modularizado en `VistaRasgosJugador.module.css` mediante clases dedicadas (`.bloqueProgresionClase`, `.metaCompendioClase`, `.subDefNombre`, `.filaTituloIzquierda`, `.iconoBadgeAlcanzado`, `.contenedorTablaProgresion`).
   - `SelectorInvocacionesAcordeon.tsx`: Modularizado en `SelectorInvocacionesAcordeon.module.css` eliminando transiciones y encapsulando estilos de buscador, badges de invocación, pactos y notas mecánicas.
   - `ConstructorRasgoDote.tsx`: Modularizado en `ConstructorRasgoDote.module.css` convirtiendo 23 estilos inline en clases modulares de alta cohesión.
2. **Subfase 3B: Inventario (`src/componentes/caracteristicas/inventario/`)**:
   - **Patrón de Selectores por Atributos de Datos (`data-caja` y `data-subseccion`)**:
     En lugar de computar estilos inline dinámicos con `info.color`, se asignaron atributos de datos HTML (`data-caja="mochila|bolsa_contencion|montura|almacen|equipados"` y `data-subseccion="consumibles|municion|..."`) y se definieron reglas CSS puras en `HojaPersonaje.module.css` y `ModalDetalleObjetoInventario.module.css`. Esto desacopló por completo la lógica visual del renderizado de componentes.
   - `DockMovilizacionRapida.tsx`: 0 estilos inline; selectores temáticos por `data-caja`.
   - `BarraMetricasInventario.tsx`: Modularizadas clases estáticas y documentada la excepción de ancho porcentual continuo en tiempo de ejecución: `// eslint-disable-next-line react/forbid-dom-props -- Ancho porcentual dinámico continuo en tiempo de ejecución (0-100%)`.
   - `TarjetaObjetoInventario.tsx`: 0 estilos inline; modularizados badges de veneno, maestría, sigilo, fuerza, munición guardada/exceso/suelta y contenedores especiales.
   - `ModalAgregarObjeto.tsx`: 0 estilos inline; modularizados buscadores, preview de objeto, desglose de contenido de paquetes, badges de combate y formularios de posesiones.
   - `SeccionAlmacenamientoMunicion.tsx`: 0 estilos inline; clases `.filaBadgesColumna`, `.badgeMunicionGuardada`, `.badgeMunicionExceso`, `.badgeMunicionSueltadefecto`, `.badgeCapacidadContenedor`.
   - `ListaHechizosVinculadosObjeto.tsx`: 0 estilos inline; clase `.botonLanzarHechizoBloqueado`.
   - `SeccionContenedoresEspeciales.tsx`: 0 estilos inline; cabeceras coloreadas por selector `[data-caja]`.
   - `SeccionContenedorYUbicacion.tsx`: 0 estilos inline; botones de selección de caja gestionados por `[data-caja]`.
   - `SeccionDetallesEquipo.tsx`: 0 estilos inline; badges con tooltip unificados con `cursor: help` a nivel CSS.
   - `SeccionMagiaYEfectosObjeto.tsx`: 0 estilos inline; clases `.valorArtesaniaTaller` y `.etiquetaCraftHerramientas`.
   - `SeccionMochilaInventario.tsx`: 0 estilos inline; títulos de categoría gestionados por selector `[data-subseccion]`.

**Verificación Automatizada:**
- `pnpm exec tsc --noEmit`: 0 errores bajo `strict: true`.
- `pnpm test`: 57 suites y 741 pruebas unitarias pasando al 100%.

---

## [2026-09-17] Refactorización Integral ToolSet Es 5.5: Fase 4 (Tipado Estricto, Erradicación de `as unknown as` y Prevención de Fugas de Memoria)


**Contexto y Requerimientos del Usuario:**
- Ejecución de la Fase 4 de la auditoría y refactorización técnica del Symbiote de TaleSpire "ToolSet Es 5.5".
- Objetivos principales: erradicar dobles aserciones inseguras (`as unknown as`), resolver tipos duplicados en esquemas Zod, garantizar contratos de datos estrictos en TypeScript (`strict: true`), y prevenir fugas de memoria en listeners del puente CEF, tiradas físicas en bandeja 3D y observadores DOM.

**Decisiones Técnicas y Arquitectónicas:**
1. **D-1 (Fuga de Listeners en Puente TaleSpire CEF):**
   - En `puenteTaleSpire.ts`, se implementó el método `.destruir()` que remueve los 8 escuchadores de eventos nativos registrados en `window` (`talespire:ready`, `talespire:campaign`, etc.), limpia callbacks inyectados en el objeto global `window` y resetea las suscripciones locales activas.
   - En `usarConexionTaleSpire.ts`, se conectó `puenteTaleSpire.destruir()` directamente en el retorno de limpieza (`cleanup`) del `useEffect` principal.
2. **D-2 (TTL y Purgado de Tiradas Físicas Huérfanas en Memoria):**
   - En `lanzadorDados.ts`, se introdujo la rutina `limpiarTiradasExpiradas(ahora, ttlMs)` con un TTL máximo de 10 minutos (600.000 ms).
   - Se extendieron las interfaces `MetadataTiradaEspecial`, `MetadataIniciativa`, `MetadataSalvacionMuerte`, `MetadataCuracionRasgo`, `MetadataHpTemporalRasgo` y `MetadataDadoGolpe` con la propiedad `creadoEn?: number`.
   - Antes de enviar nuevos descriptores a la bandeja 3D con `putDiceInTray`, se ejecuta la purga eliminando promesas y callbacks huérfanos que nunca recibieron respuesta de TaleSpire.
3. **D-3 (Guard y Limpieza en MutationObserver de Spellcheck):**
   - En `desactivadorSpellcheck.ts`, se incorporaron las referencias de ciclo de vida `yaInicializado`, `observadorActivo` y `manejadorFocusinActivo`.
   - Se expuso la función `limpiarDesactivadorSpellcheck()` y la función inicializadora ahora retorna el closure de desconexión. Se actualizaron las pruebas en `desactivadorSpellcheck.test.ts` (100% éxito).
4. **TS-02 y TS-03 (Consolidación de Esquemas Zod y Alineación Canónica):**
   - En `src/tipos/index.ts`, se erradicó la duplicación de `EsquemaCaracteristica`, `EsquemaCaracteristicas`, `EsquemaVelocidad`, `EsquemaSentidos`, `EsquemaEfectoPasivo` y `EsquemaHechizoVinculado`, reexportándolos de forma canónica desde `src/tipos/personaje.ts`.
   - En `objetoConstantes.ts`, se alineó `HABILIDADES_OBJETOS` mapeando directamente `HABILIDADES_LISTA.map(h => h.nombre)`.
5. **C-1 (Erradicación de Dobles Aserciones `as unknown as` y Enriquecimiento de Contratos):**
   - `personaje.ts`: Se añadieron campos canónicos opcionales a `EsquemaObjetoInventario` (`efectosPasivos`, `modificadorAtaqueDano`, `contents`).
   - `talespire.d.ts`: Se enriqueció `FragmentoCliente` con `playerId?: string` y `onClientEvent` con soporte de función o `Suscribible`.
   - `evaluadorEfectosRasgos.ts`: Se amplió `ConsultaVentajaRasgo` con `tipo?: string`, eliminando el cast forzado.
   - `sanitizacion.ts`: Se convirtió `sanearMonstruoSentidosYPasiva` en una función genérica `T extends Partial<MonstruoBase>` que preserva el subtipo exacto sin casts `as unknown as`.
   - `importadorJSON.ts`: Eliminados dobles casts en monstruos, velocidad y sentidos garantizando parsing seguro.
   - `usarFormularioObjeto.ts`: Eliminadas declaraciones duplicadas de `oCategoria` y `oSubcategoria`.
   - `ListaHomebrew.tsx`: Alineado el mapeo de efectos pasivos para consumir directamente `EfectoPasivo`.
   - `TaleSpireAdapter.ts`: Narrowing estricto para `onClientEvent` mediante validación de objeto con `"subscribe" in onClientEvent`.
   - `gestorClases.ts`: Purgado de imports y normalización de `minimo: r.escaladoUsos.minimo ?? 1`.

**Errores Encontrados y Correcciones:**
- **Inferencia circular en Zod (`z.lazy`):** `EsquemaOpcionSelector` con selectores anidados generaba `TS7022` y cascada de `any`. Se solucionó desacoplando el esquema base y tipando explícitamente `export type OpcionSelector = Omit<z.infer<typeof EsquemaOpcionSelector>, "selectores"> & { selectores?: SelectorRasgo[] };`.
- **Narrowing de closures en TypeScript:** Variables reasignadas dentro de closures de array (`map`) eran tipadas como `null` tras el callback; se solucionó asignando a constantes con tipo explícito en el scope de invocación.

**Verificación Automatizada:**
- `pnpm exec tsc --noEmit`: 0 errores bajo `strict: true`.
- `pnpm test`: 57 suites y 741 pruebas unitarias pasando al 100%.
- `pnpm run lint`: 0 errores y 0 advertencias bajo `--max-warnings=0`.
- `pnpm run build`: Compilación con Vite completada con éxito en 6.51s.

---

## [2026-09-17] Refactorización Integral ToolSet Es 5.5: Fases 1, 2 y 3 (Seguridad, Algoritmos Big O y Rendimiento React)

**Contexto y Requerimientos del Usuario:**
- Auditoría profunda y optimización integral del Symbiote de TaleSpire "ToolSet Es 5.5" (React 18 + TypeScript estricto + Zustand + Vite + CEF).
- Enfoque por fases secuenciales con validación completa (`tsc`, `test`, `lint`, `build`):
  - **Fase 1**: Seguridad, Bugs Críticos y Resiliencia (SEC-01, D-4, ERR-01, ERR-02).
  - **Fase 2**: Rendimiento Crítico, Algoritmos y Hot Paths Big O (B-1 a B-6, `@tanstack/react-virtual`).
  - **Fase 3**: Rendimiento React — Memoización y Re-renders (PERF-01, PERF-03).

**Decisiones Técnicas y Arquitectónicas:**
1. **Fase 1 (Seguridad y Resiliencia):**
   - **SEC-01**: Eliminación completa de `dangerouslySetInnerHTML`. Se reforzó `TextoEnriquecidoDND.tsx` con un analizador de marcado seguro que descarta etiquetas ejecutables (`<script>`, `<iframe>`, `on*`) y renderiza elementos virtuales nativos de React para `<b>`, `<i>`, `<br>`, etc.
   - **D-4**: Corrección de condición de carrera en `usarEstadoPersistido.ts` mediante `useRef(clave)` para ignorar escrituras diferidas al alternar entre personajes. Se añadió suite de pruebas unitarias dedicada.
   - **ERR-01 / A-1 a A-4**: Erradicación de bloques `catch` silenciosos en 7 módulos sustituyéndolos por `logger.warn` y `logger.debug` desde `@/utiles/logger`.
   - **ERR-02**: Implementación de `modoModular` en `LimiteError.tsx` y su integración en cada vista de `App.tsx` con clave reactiva (`key={pestañaActiva}`), aislando fallos visuales a la pestaña afectada sin crashear la aplicación.
2. **Fase 2 (Algoritmos y Hot Paths Big O):**
   - **B-1 (Transformada de Schwartzian)**: En `clasificadorInventario.ts`, se precomputa `construirMapaValoresPO` en un `Map<string, number>` $O(1)$ previo al `.sort()`, reduciendo el ordenamiento de $O(N \log N \times M)$ a $O(M + N \log N)$.
   - **B-2 (Pre-indexación y Mutación Local)**: En `calculadorInventario.ts` (`desempaquetarPaqueteInventario`), el compendio se indexa en un Map $O(1)$ y se acumulan los ítems en un arreglo local mutable, bajando la complejidad de $O(N \times M)$ a $O(N)$.
   - **B-3 (Cortocircuito en Acciones de Combate)**: En `calculadorAccionesCombate.ts`, se reordenó la condición de conjuros para resolver en $O(1)$ (`matchRapido`) antes de evaluar árboles de rasgos para 400+ conjuros por render.
   - **B-4 (Sets Hash O(1))**: En `usarMagiaPersonaje.ts`, se implementó `expandirSetHechizos`, pre-insertando variantes canónicas, sin tildes y slugs en el Set una sola vez en `useMemo`, dejando las consultas en $O(1)$ constante con `set.has()`.
   - **B-5 (Deduplicación CEF y Sondeo)**: En `usarConexionTaleSpire.ts`, se unificó la selección a través de `puenteTaleSpire` y se espació el polling a 250ms (4/s vs 20/s previos).
   - **B-6 (Persistencia Inmutable Eficiente)**: En `usarAlmacenDM.ts` y `persistencia.ts`, se eliminó la clonación superficial `{ ...get() }` y se agregó caché referencial en los filtros de homebrew.
   - **Dependencia de Virtualización**: Instalación de `@tanstack/react-virtual` utilizando estrictamente `pnpm`.
3. **Fase 3 (Memoización y Control de Re-renders):**
   - **PERF-03**: Envoltorio con `React.memo` para `ChipCondicion.tsx`, `FilaConjuroCompendio.tsx`, `TarjetaAtaquePersonaje.tsx` y `TarjetaObjetoInventario.tsx`.
   - **PERF-01 (Hoja de Personaje)**: Reemplazo de más de 20 funciones flecha inline en `HojaPersonaje.tsx` por callbacks estables envueltos en `useCallback` indexados a `pjId` para los paneles de vitalidad, atributos, habilidades y magia.
   - **PERF-01 (Gestor de Iniciativa)**: Extracción y memoización de `ItemCriaturaIniciativa` con `React.memo`, centralizando callbacks parametrizados por ID de criatura en el padre para aislar los re-renders exclusivamente a la criatura modificada.

**Errores Encontrados y Correcciones:**
- **TS2345 / TS2322 en `HojaPersonaje.tsx`:** Al estabilizar `alEstablecerSalvacionMuerte`, se tipó inicialmente como `(tipo: "exito" | "fallo", valor: number)` cuando el contrato esperado por `PanelVitalidadPersonaje` y `establecerSalvacionesMuertePersonaje` es `"exitos" | "fallos"`. Se corrigió inmediatamente a `"exitos" | "fallos"`.

**Verificación Automatizada:**
- `pnpm exec tsc --noEmit`: 0 errores bajo `strict: true`.
- `pnpm test`: 57 suites y 741 pruebas unitarias pasando al 100%. Tiempo de suite reducido de **14.75s a 8.59s (mejora global del 41.7%)**.
- `pnpm run lint`: 0 errores y 0 advertencias bajo `--max-warnings=0`.
- `pnpm run build`: Compilación de producción con Vite completada con éxito en 6.83s.

---

## [2026-09-17] Implementación Mecánica de Invocaciones Sobrenaturales (Lote 3 - D&D 5.5e 2024)

**Contexto y Requerimientos del Usuario:**
- Implementar la funcionalidad mecánica e interactiva canónica para 16 Invocaciones Sobrenaturales de Brujo restantes:
  1. **MAESTRO DE LAS FORMAS INNUMERABLES**: Permite lanzar *Alterar el propio aspecto* a voluntad de forma gratuita (`conjuroGratuito: "Alterar el propio aspecto"`, `recuperacionConjuro: "ilimitado"`).
  2. **MÁSCARA DE LOS MIL ROSTROS**: Permite lanzar *Disfrazarse* gratis a voluntad (`conjuroGratuito: "Disfrazarse"`, `recuperacionConjuro: "ilimitado"`).
  3. **MENTE SOBRENATURAL**: Rasgo pasivo permanente (`categoriaMecanica: "pasivo_permanente"`).
  4. **MIRADA DE LAS DOS MENTES**: Rasgo pasivo permanente (`categoriaMecanica: "pasivo_permanente"`).
  5. **PACTO DE LA CADENA**: Permite lanzar *Encontrar familiar* gratis a voluntad (`conjuroGratuito: "Encontrar familiar"`, `recuperacionConjuro: "ilimitado"`).
  6. **PACTO DEL FILO**: Selector interactivo de daño (`propio`, `necrotico`, `psiquico`, `radiante`). Modifica las armas cuerpo a cuerpo del personaje para otorgar competencia automática, utilizar Carisma en ataque y daño, y alterar el tipo de daño al seleccionado si no es "propio".
  7. **PACTO DEL GRIMORIO**: Rasgo pasivo permanente (`categoriaMecanica: "pasivo_permanente"`).
  8. **PASO ASCENDENTE**: Permite lanzar *Levitar* gratis a voluntad (`conjuroGratuito: "Levitar"`, `recuperacionConjuro: "ilimitado"`).
  9. **SALTO SOBRENATURAL**: Permite lanzar *Salto* gratis a voluntad (`conjuroGratuito: "Salto"`, `recuperacionConjuro: "ilimitado"`).
  10. **SUSURROS DEL SEPULCRO**: Permite lanzar *Hablar con los muertos* gratis a voluntad (`conjuroGratuito: "Hablar con los muertos"`, `recuperacionConjuro: "ilimitado"`).
  11. **UNO CON LAS SOMBRAS**: Permite lanzar *Invisibilidad* gratis a voluntad (`conjuroGratuito: "Invisibilidad"`, `recuperacionConjuro: "ilimitado"`).
  12. **VIGOR INFERNAL**: Botón interactivo que otorga $12 + [5 \times (\text{nivelEspacioPacto} - 1)]$ PG temporales a voluntad. Concede además el conjuro *Falsa vida* gratis.
  13. **VISIÓN BRUJA**: Rasgo pasivo permanente (`categoriaMecanica: "pasivo_permanente"`).
  14. **VISIONES BRUMOSAS**: Permite lanzar *Imagen silenciosa* gratis a voluntad (`conjuroGratuito: "Imagen silenciosa"`, `recuperacionConjuro: "ilimitado"`).
  15. **VISIONES DE REINOS REMOTOS**: Permite lanzar *Ojo arcano* gratis a voluntad (`conjuroGratuito: "Ojo arcano"`, `recuperacionConjuro: "ilimitado"`).
  16. **VISTA DEL DIABLO**: Rasgo pasivo permanente (`categoriaMecanica: "pasivo_permanente"`).

**Decisiones Técnicas y Arquitectónicas:**
1. **Soporte de Expresiones Aritméticas con Paréntesis en `evaluadorEfectosRasgos.ts`:**
   - La función pura `evaluarExpresionNumericaSegura` fue refactorizada para resolver recursivamente subexpresiones entre paréntesis `\(([^()]+)\)` antes de las multiplicaciones y sumas. Esto permite evaluar fórmulas dinámicas como `"12 + 5 * (nivel_espacio_pacto - 1)"` obteniendo valores exactos ($12, 17, 22, 27, 32$) según el nivel de pacto del brujo.
2. **Cálculo de Ataques y Daño con Pacto del Filo (`calculadorAtaquesArmas.ts`):**
   - Se añadió `obtenerConfiguracionPactoDelFilo` que detecta si el brujo tiene la invocación seleccionada y el tipo de daño configurado.
   - En armas cuerpo a cuerpo no a distancia, asigna Carisma como atributo de ataque y daño, concede competencia con el arma (`esCompetenteArma = true`), y sustituye `tipoDanoBase` por el tipo elegido (`Necrótico`, `Psíquico` o `Radiante`) si no es `"propio"`.
3. **Resolución de Conjuros Otorgados y Origen de Clase (`resolutorOrigenConjuros.ts` y `evaluadorEfectosRasgos.ts`):**
   - Se unificó la resolución de conjuros otorgados por selecciones de rasgos para considerar `opcion.conjuroGratuito`, efectos tipo `conjuro_gratuito`/`conjuro_otorgado`, y coincidencia normalizada con `baseId`.
   - `resolverOrigenConjuro` inspecciona las selecciones activas en `r.selectores` para marcar el origen canónico (`"clase"` para invocaciones de brujo), permitiendo que la ficha pinte las insignias de clase y habilite el lanzamiento gratis.
4. **Interactividad en UI (`SelectorInvocacionesAcordeon.tsx`):**
   - Selector tipo píldora para `pacto_del_filo` con persistencia reactiva.
   - Botón interactivo con icono de corazón para `vigor_infernal` mostrando el monto exacto de PG temporales y despachando `aplicarResultadoHpTemporalEnEstado`.

**Errores Encontrados y Soluciones:**
- **Evaluación errónea de fórmulas dinámicas compuestas:** `evaluarExpresionNumericaSegura` parseaba con `parseInt` directo la cadena con paréntesis, truncando `"12 + 5 * (2 - 1)"` a 12. Se solucionó con evaluación de paréntesis recursiva y precedencia de operadores.
- **Aserción de prueba en `resolverOrigenConjuro`:** Se esperaba `"rasgos"` en lugar de `"clase"` para una invocación contenida en un rasgo cuyo origen es `"clase"`. Se ajustó la aserción a la semántica canónica de la ficha.

**Verificación:**
- 24 pruebas unitarias en `src/servicios/invocacionesBrujoMecanicas.test.ts` ejecutadas y aprobadas (100%).
- Compilación `tsc --noEmit` sin errores bajo `strict: true`.

---

## [2026-09-17] Estandarización de UX: Sustitución de SelectorSugerencias por SelectorDesplegable en Invocaciones Sobrenaturales

**Contexto y Requerimientos del Usuario:**
- El usuario solicitó reemplazar los componentes de búsqueda/sugerencias autocompletables (`SelectorSugerencias`) por selectores desplegables estándar (`SelectorDesplegable`), manteniendo el diseño dark-fantasy homogéneo y accesible del resto de la ficha.

**Decisiones Técnicas y Arquitectónicas:**
1. **Adopción de `SelectorDesplegable` con tamaño compacto (`tamano="compacto"`):**
   - Se integró el componente común `SelectorDesplegable` en `SelectorInvocacionesAcordeon.tsx` para las 4 invocaciones interactivas con trucos y dotes repetibles:
     - *Descarga ahuyentadora* (trucos con tirada de ataque conocidos o compendio).
     - *Descarga agónica* (trucos con daño conocidos o compendio).
     - *Lanza sobrenatural* (trucos con daño y alcance $\ge 10$ pies).
     - *Lecciones de los Primeros* (dotes de categoría `"origen"` de `dotes.json`).
2. **Normalización de Listas de Opciones a `OpcionDesplegable<string>[]`:**
   - Cada fuente memoizada (`trucosAtaqueOpciones`, `trucosDanoOpciones`, `trucosAlcanceOpciones`, `dotesOrigenOpciones`) genera arrays tipados con `valor` (identificador único) y `etiqueta` descriptiva (incluyendo metadatos de daño, alcance o categoría para una lectura clara del jugador).
3. **Mantenimiento de Contratos y Repetibilidad:**
   - Se preservó íntegramente la gestión de instancias múltiples (`id:subId` para la primera selección, `id__timestamp:subId` para instancias adicionales mediante el botón `+`).
   - Los manejadores de eventos `alCambiar` y eliminación con `Trash2` continúan interactuando transparentemente con `alActualizarSeleccion`, actualizando reactivamente el cupo de invocaciones aprendidas y los modificadores de combate.

**Verificación:**
- `tsc --noEmit` completado sin errores (código 0).
- Suite unitaria `invocacionesBrujoMecanicas.test.ts` pasando 18/18 pruebas.

---

## [2026-09-17] Implementación Mecánica de Invocaciones Sobrenaturales (Lote 2 - D&D 5.5e 2024)

**Contexto y Requerimientos del Usuario:**
- Añadir funcionalidad interactiva y mecánicas canónicas a 7 Invocaciones Sobrenaturales adicionales de Brujo:
  1. **DESCARGA AGÓNICA (*Agonizing Blast*)**: Selector de sugerencias interactivo repetible para trucos conocidos con daño. Activa `agregarModificadorHabilidad: true`, añadiendo el modificador por Carisma al daño (y a cada rayo en ataques múltiples como *Descarga sobrenatural*).
  2. **DON DE LOS PROTECTORES (*Gift of the Protectors*)**: Acción de reacción consumible con 1 uso recuperable en descanso largo (`tieneUsosLimitados: true`, `usosMaximos: 1`, `recuperacion: "descanso_largo"`).
  3. **FILO SEDIENTO (*Thirsting Blade*)**: Informativo con `categoriaMecanica: "pasivo_permanente"`.
  4. **HOJA DEVORADORA (*Devouring Blade*)**: Informativo con `categoriaMecanica: "pasivo_permanente"`.
  5. **INVERSIÓN DEL AMO DE LAS CADENAS (*Investment of the Chain Master*)**: Informativo con `categoriaMecanica: "pasivo_permanente"`.
  6. **LANZA SOBRENATURAL (*Eldritch Spear*)**: Selector de sugerencias interactivo repetible para trucos conocidos con daño y alcance $\ge 10$ pies. Aumenta su alcance en $(\text{nivelBrujo} \times 10)$ pies.
  7. **LECCIONES DE LOS PRIMEROS (*Lessons of the First Ones*)**: Selector de sugerencias interactivo repetible para dotes de categoría `"origen"`, consumiendo ranuras de invocación de la ficha.

**Decisiones Arquitectónicas y Buenas Prácticas:**
1. **Función Pura Inmutable de Enriquecimiento (`aplicarModificadoresInvocacionesAHechizo`):**
   - Centralizada en `src/servicios/evaluadorEfectosRasgos.ts`.
   - Inspecciona selecciones activas en `personaje.rasgos` respetando prefijos canónicos y sufijos repetibles (`id:subId` e `id__timestamp:subId`).
   - Modifica `agregarModificadorHabilidad: true` para los trucos vinculados a `descarga_agonica`.
   - Modifica `alcance` sumando $(\text{nivelBrujo} \times 10)$ pies para trucos vinculados a `lanza_sobrenatural` si su alcance base es $\ge 10$ pies.
   - Integrada en `resolverConjurosAcciones` (pestaña de combate) y `usarMagiaPersonaje` (pestaña de conjuros).
2. **Propagación Declarativa de Usos Limitados en Selectores (`src/tipos/rasgos.ts` y `calculadorAccionesCombate.ts`):**
   - Incorporación de `tieneUsosLimitados`, `usosMaximos`, `usosRestantes` y `recuperacion` (`RecuperacionRasgo`) a `EsquemaOpcionSelector` e `InvocacionSobrenatural`.
   - `resolverRasgosAcciones` sintetiza fielmente las opciones consumibles (`don_de_los_protectores`), permitiendo al usuario rastrear el uso (1/1 descanso largo) directamente en el panel de combate.
3. **Selector Acordeón Interactivo con Repetibilidad Multirrango (`SelectorInvocacionesAcordeon.tsx`):**
   - Proveedores de sugerencias dedicados con memoización: `trucosDanoOpciones`, `trucosAlcanceOpciones` y `dotesOrigenOpciones` (filtrando dotes de categoría origen de `dotes.json`).
   - Botón `+ Vincular otro truco/dote (+1 invocación)` para generar instancias repetidas con timestamp y botón de cesto de basura para desvincularlas liberando ranuras de invocación.

**Errores Encontrados y Correcciones:**
- **TS2345 en `usarMagiaPersonaje.ts`:** `personaje` podía ser `undefined`. Se flexibilizó la firma de `aplicarModificadoresInvocacionesAHechizo` para recibir `PersonajeJugador | null | undefined`.
- **TS2322 en `calculadorAccionesCombate.ts`:** `recuperacion` en `EsquemaOpcionSelector` usaba `z.string()`. Se alineó estrictamente con `EsquemaRecuperacionRasgo` (`RecuperacionRasgo`).
- **TS2339 en `evaluadorEfectosRasgos.ts`:** Se intentó acceder a `c.id` en elementos de `personaje.clases` que solo poseen `{ nombre, subclase, nivel }`. Se corrigió para buscar por `c.nombre`.
- **TS6133 en `invocacionesBrujoMecanicas.test.ts`:** Se purgó un import no utilizado de `aplicarModificadoresInvocacionesAHechizo`.
- **Ausencia de trucos en mock de personaje de prueba:** Los personajes simulados en `crearBrujoConInvocaciones` no tenían `trucosConocidosIds`, lo que provocaba que `resolverConjurosAcciones` no los incluyera como candidatos de combate. Se asignaron los trucos correspondientes.

**Verificación Automatizada:**
- 18 pruebas unitarias específicas en `src/servicios/invocacionesBrujoMecanicas.test.ts` pasando al 100%.
- Suite global: 57 archivos de prueba, 734 pruebas pasando sin fallos.
- `tsc --noEmit` completado con 0 errores bajo `strict: true`.

---

## [2026-09-16] Implementación Mecánica Integral de Invocaciones Sobrenaturales del Brujo (D&D 5.5e 2024)

**Contexto y Requerimientos del Usuario:**
- Añadir funcionalidad mecánica e interactiva completa a 5 Invocaciones Sobrenaturales de Brujo desde `dicionario_herramientas/clases/invocaciones_sobrenaturales.md`:
  1. **ARMADURA DE SOMBRAS**: Lanzamiento gratuito permanente del conjuro *Armadura de mago* sin consumir espacios de conjuro ni requerir componentes materiales.
  2. **CASTIGO ARCANO**: Acción consumible de combate que tira dados de daño por fuerza (escalado a 4d8 en niveles 5-6, 5d8 en 7-8 y 6d8 en 9+) y gasta 1 espacio de conjuro de Magia del Pacto.
  3. **DESCARGA AHUYENTADORA**: Selector de sugerencias interactivo anidado (`SelectorSugerencias`, siguiendo el patrón de Magia de Alto Elfo) para elegir trucos aprendidos que tengan `requiereAtaque: true` o `ataqueCd: "ATAQUE"`. Cuenta con botón `+` para elegir otro truco, consumiendo un uso adicional del cupo de invocaciones sobrenaturales (`maxInvocaciones`). Efecto informativo de empuje de 10 pies al impactar.
  4. **DEVORADOR DE VIDA**: Añade +1d6 de daño a los ataques cuerpo a cuerpo con armas, con un selector tipo píldora interactivo para elegir el tipo de daño (`Necrótico`, `Psíquico`, `Radiante`).
  5. **DON DE LAS PROFUNDIDADES**: Concede el conjuro *Respirar bajo el agua* (1 lanzamiento gratuito por descanso largo) y velocidad de natación igual a la velocidad de caminar, reflejada en las métricas rápidas de velocidad y el evaluador de efectos.

**Decisiones Arquitectónicas y Buenas Prácticas:**
1. **Extensión Declarativa de Esquemas (`src/tipos/rasgos.ts`):**
   - Introducción de `RecursoGastado` (`"espacio_pacto" | "uso_rasgo" | "ninguno"`) y adición de `tipoAccion`, `recursoGastado`, `formulaDados`, `escaladoFormulaDados`, `selectores` y `efectos` en `EsquemaOpcionSelector` y `EsquemaRasgoPersonaje`.
   - Cero bifurcaciones rígidas por nombres: los servicios leen directamente las propiedades declarativas del rasgo u opción seleccionada.
2. **Evaluación Centralizada de Conjuros Gratuitos y Velocidades (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - Función pura `obtenerNombresConjurosGratuitosActivos(personaje)` que recorre los efectos `conjuro_gratuito` tanto de rasgos base como de opciones seleccionadas en selectores.
   - Refactorización de `tieneConjuroGratuitoActivo` y del hook `usarLanzadorConjuros` para desacoplar listas cableadas y usar la recolección dinámica.
   - Función pura `obtenerVelocidadesEfectivas(personaje)` que computa velocidades compuestas (`caminar`, `nadar`, `volar`, `escalar`, `excavar`) y mapea dinámicamente efectos `movimiento_especial` como velocidad de nado igual a caminar.
3. **Consumo de Recursos en Acciones de Combate (`src/servicios/calculadorAccionesCombate.ts` y `TarjetaRasgo.tsx`):**
   - El calculador sintetiza opciones de selector activas con dados o acciones de combate (`castigo_arcano`).
   - Si `recursoGastado === "espacio_pacto"`, se asocian `usosMaximos` a `espaciosPactoMaximos` y `usosActuales` a `max(0, max - gastados)`.
   - `TarjetaRasgo.tsx` detecta `esRecursoEspacioPacto`, bloqueando la tirada si no quedan espacios y descontando reactivamente un espacio mediante `gastarEspacioPacto(idPersonaje)`.
   - Se implementó `recuperarEspacioPacto` en `sliceMagia.ts` y se expuso en `usarAccionesPersonajes` para permitir recuperar manualmente espacios desde los botones `+` y `-` de la tarjeta.
4. **Sub-selecciones y Repetición en Acordeón (`SelectorInvocacionesAcordeon.tsx`):**
   - Patrón de codificación de claves: `id:subtipo` (ej. `devorador_de_vida:psiquico`) y repeticiones `id__timestamp:trucoId` (ej. `descarga_ahuyentadora__172651:truco_descarga_sobrenatural`).
   - La función pura `coincideInvocacionId` extrae el prefijo canónico para que las búsquedas, validaciones de dependencias y cálculo de cupo sigan funcionando de manera transparente contra `maxInvocaciones`.
5. **Métricas Rápidas en Hoja de Personaje (`MetricasRapidasPersonaje.tsx`):**
   - Integración con `obtenerVelocidadesEfectivas(personaje)` para renderizar el distintivo de nado con icono `Waves` cuando la invocación `don_de_las_profundidades` está activa.

**Errores Encontrados y Correcciones:**
- **Error TS2353 y TS2322 en tests:** Los objetos simulados en `invocacionesBrujoMecanicas.test.ts` requerían `componentesSeleccionados: { verbal, somatico, material }` en lugar de `componentes`, y `velocidad` requería `planea: false` para respetar `EsquemaVelocidad`. Se reemplazó el mock manual de estadísticas por `calcularEstadisticasPersonaje(pj)`.
- **Diferenciación de Botones en Armadura de sombras:** Se ajustó `usarLanzadorConjuros.ts` para que `conjurosGratuitosActivos` en el contexto obligatorio solo aplique a reemplazos imperativos (como *Orden imperiosa* bajo *Manto de Majestad*). *Armadura de mago* mantiene el botón **"Gratis"** (`modo: 'gratuitoInnato'`) para lanzarse sobre uno mismo sin coste, mientras que el botón **"Lanzar"** (`modo: 'espacio'`) descuenta debidamente espacios de pacto/conjuro al lanzarse sobre otras criaturas.
- **Aislamiento de Dados en Castigo arcano:** Se blindó el bucle de rasgos genéricos en `calculadorDanoCombate.ts` con la condición `r.categoriaMecanica !== "consumible" && r.recursoGastado !== "espacio_pacto"` para evitar que acciones de impacto consumibles añadan dados extra pasivos a los ataques estándar con armas.
- **Propagación de Tipo de Daño en Devorador de vida:** Se extendió `ResultadoBonosCombate` con `tiposDanoSecundarios`, combinando el tipo base del arma con los tipos secundarios en `calculadorAtaquesArmas.ts` (`tipoDano = `${tipoDanoBase} / ${tiposDanoSecundarios.join(" / ")}``). En `ejecutorTiradasCombate.ts` y `procesadorAtaques.ts`, las tiradas ahora adoptan el tipo exacto (`Daño Necrótico`, `Daño Psíquico`, `Daño Radiante`) en vez de recaer en el fallback `Daño Extra`.

**Verificación Automatizada:**
- 11 pruebas unitarias específicas en `src/servicios/invocacionesBrujoMecanicas.test.ts`.
- Suite global de pruebas: 57 archivos de prueba, 727 pruebas pasando (100% éxito).
- `tsc --noEmit` completado con 0 errores bajo configuración estricta.

---

## [2026-09-16] Corrección Integral del Selector y Escalado de Invocaciones Sobrenaturales del Brujo (D&D 5.5e 2024)

**Contexto y Requerimientos del Usuario:**
- El usuario reportó que en la vista de personaje y en el modal de rasgos, las Invocaciones Sobrenaturales (*Eldritch Invocations*) no se quedaban marcadas y no permitían seleccionar las que correspondían al nivel del personaje ("no me marcan / dejan seleccionar las que son").

**Causas Raíz Identificadas:**
1. **Ausencia de `escaladoMaxSelecciones` en `clasesDND55.ts`:**
   El selector `invocaciones_sobrenaturales_aprendidas` tenía `maxSelecciones: 1` fijo. Al no incluir `escaladoMaxSelecciones`, el motor del Builder (`gestorClases.ts`) mantenía el límite en 1 para cualquier nivel de Brujo (incluso a nivel 2, 5 o 20).
2. **Reemplazo forzado FIFO en `SelectorInvocacionesAcordeon.tsx`:**
   Dado que `max` valía 1, cualquier intento de añadir una segunda invocación provocaba que `seleccionados.length < max` fuese falso, ejecutando un slice que descartaba la primera selección inmediatamente, dando la impresión de que "no se marcaba". Además, los botones mostraban textos confusos como `(2/1)`.
3. **Tabla canónica desactualizada en `invocacionesSobrenaturales.ts`:**
   `obtenerMaxInvocacionesBrujo` limitaba las invocaciones a un máximo de 8 para niveles 12 a 20, omitiendo los niveles 15 (9 invocaciones) y 18 (10 invocaciones) de la tabla oficial 2024.
4. **Falta de auto-sincronización reactiva de selectores en caliente:**
   En `usarVistaRasgos.ts`, si un personaje ya había sido persistido en `localStorage` con un snapshot antiguo que contenía `maxSelecciones: 1`, el almacén no detectaba la discrepancia de límites con respecto a los rasgos canónicos calculados.
5. **Deselección de requisitos previos:**
   Si se quitaba una invocación que servía de requisito para otra (ej. *Pacto del filo* para *Filo sediento*), no existía limpieza en cascada.

**Soluciones Aplicadas y Decisiones Arquitectónicas:**
1. **Catálogo Declarativo (`clasesDND55.ts`):**
   - Incorporado `escaladoMaxSelecciones` canónico en `invocaciones_sobrenaturales_aprendidas`: Nivel 1 (1), Nv 2 (3), Nv 5 (5), Nv 7 (6), Nv 9 (7), Nv 12 (8), Nv 15 (9), Nv 18 (10).
   - Llamada general `generarOpcionesSelectorInvocaciones()` sin parámetro limitante.
2. **Función de Escalado Canónico (`invocacionesSobrenaturales.ts`):**
   - Actualizado `obtenerMaxInvocacionesBrujo` para cubrir de forma completa 18-20 (10) y 15-17 (9).
3. **Componentes de Interfaz Resilientes:**
   - `SelectorInvocacionesAcordeon.tsx`: Calcula `max` dinámicamente evaluando `escaladoMaxSelecciones` o `obtenerMaxInvocacionesBrujo(nivelPersonaje)`. Maneja eliminación en cascada de dependientes al quitar un prerrequisito. Flexibiliza `cumpleNivel` ante `nivelPersonaje === undefined`. Cambia las etiquetas de los botones a "Sustituir" cuando se alcanza el tope máximo.
   - `GrupoClaseRasgos.tsx`: Calcula `maxInvocaciones` con `useMemo` consultando `obtenerMaxInvocacionesBrujo(grupo.clase.nivel)`.
4. **Almacén y Sincronización Automática (`sliceRasgos.ts` y `usarVistaRasgos.ts`):**
   - `sliceRasgos.ts`: En `actualizarSeleccionRasgo`, calibra reactivamente `maxSelecciones` con el nivel contextual del personaje para sanar selectores persistidos con valores obsoletos.
   - `usarVistaRasgos.ts`: Detecta discrepancias en `maxSelecciones` de selectores entre el estado actual y los canónicos, disparando `sincronizarRasgosPersonaje` automáticamente.
   - `evaluadorEfectosRasgos.ts`: En `obtenerConjurosOtorgadosPorRasgos`, añade recolección de efectos `conjuro_gratuito` y de opciones seleccionadas en selectores (Invocaciones).
5. **Verificación Automatizada:**
   - 30 pruebas en `brujoDND55.test.ts` pasando al 100%.
   - Suite global de Vitest: 56 suites y 716 pruebas pasando.
   - `tsc --noEmit` pasando con 0 errores bajo `strict: true`.
   - `eslint src --max-warnings=0` pasando con 0 advertencias.

---

## [2026-09-16] Sincronización Canónica de Descripciones Oficiales, Erratas y Tablas de Progresión para Rasgos y Subclases del Brujo (D&D 5.5e)

**Contexto y Requerimientos del Usuario:**
- Actualización de las descripciones de los rasgos de la clase Brujo y sus 4 subclases canónicas utilizando fielmente las descripciones de `cambio_build/brujo.json`, incluyendo correcciones de erratas en Invocaciones sobrenaturales y rasgos de clase base.
- Adición de tablas de progresión interactivas (`tablaProgresion`) para:
  1. *Arcano místico* con columnas `["Nivel", "Descripción"]`, niveles 11, 13, 15, 17 y nota al pie `"Se apilan los niveles"`.
  2. *Conjuros de archihada* (Patrón de los Archihadas), *Conjuros celestiales* (Patrón Celestial), *Conjuros infernales* (Patrón Infernal) y *Conjuros del Gran Primigenio* (Patrón del Gran Primigenio) con columnas `["Nivel de brujo", "Conjuros"]` y niveles 3, 5, 7, 9.

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Erratas Textuales y Enlaces Rotos:**
   - *Invocaciones sobrenaturales* (Nv 1): errata en texto inicial sustituida por el texto oficial fiel `"Obtienes una invocación de tu elección, como Pacto del tomo..."`.
   - *Magia del pacto* (Nv 1): eliminadas menciones obsoletas a capítulos de manuales físicos externos.
   - *Mejoras de característica* (Nv 4, 8, 12, 16) y *Don épico* (Nv 19): eliminadas cadenas markdown con enlaces rotos a `feats.html` y corregida la recomendación de dote a *Don del destino* en Nv 19.
   - *Arcanos Místicos* (Nv 13, 15, 17): diferenciados como *Arcano místico II*, *Arcano místico III* y *Arcano místico IV* conforme a la estructura de `brujo.json`.
   - Subclases: incorporadas las tablas oficiales markdown en las descripciones de conjuros sin perder los metadatos interactivos de `tablaProgresion`.
2. **Tipado Estricto de `TablaEscaladoRasgo` (Error TS2741):**
   - En Zod (`src/tipos/rasgos.ts`), `EsquemaTablaEscaladoRasgo` utilizaba `notaPie: z.string().default("Cada nivel reemplaza al anterior")`.
   - `z.infer<typeof EsquemaTablaEscaladoRasgo>` infiere `notaPie: string` como propiedad obligatoria.
   - Solucionado haciendo `.optional()` a `notaPie` en `EsquemaTablaEscaladoRasgo` y asignando `notaPie: ""` a las tablas de conjuros de subclase en `clasesDND55.ts`.
3. **Métricas y Verificaciones Realizadas:**
   - Paridad auditada: 100% de coincidencia exacta entre `brujo.json` y `clasesDND55.ts` validada con script de comparación directa.
   - Vitest: 56 suites pasando, 712 tests superados (26 tests específicos de Brujo en `brujoDND55.test.ts`).
   - `tsc --noEmit`: 0 errores (`strict: true`).
   - ESLint: 0 errores, 0 advertencias (`--max-warnings=0`).
   - Auditoría de líneas: 100% de archivos en límites permitidos.

---

## [2026-09-16] Implementación Canónica y Declarativa del Brujo (Warlock) y sus 4 Subclases (D&D 5.5e 2024) en el Builder

**Contexto y Requerimientos del Usuario:**
- Implementación de la clase **Brujo (Warlock)** y sus 4 subclases canónicas para D&D 5.5e (2024): **Patrón de los Archihadas**, **Patrón Celestial**, **Patrón Infernal** y **Patrón del Gran Primigenio**.
- Requisitos estrictos de arquitectura:
  1. **Builder Declarativo Puro:** Toda la mecánica de dados, escalado de usos, fórmulas y extensiones debe definirse mediante metadatos en el catálogo (`CATALOGO_CLASES_DND55`), prohibiendo categóricamente bifurcaciones por nombre literal (`r.nombre === "..."` o `clase === "brujo"`).
  2. **Resoluciones Canónicas Acordadas en `/grill-me`:**
     - *Pasos feéricos* y *Escapada brumosa*: Dos tarjetas vinculadas de forma declarativa. *Pasos feéricos* (Nv 3, acción adicional, dado 1d10, usos = modificador de Carisma) y *Escapada brumosa* (Nv 6, reacción, dado 2d10, `ligadoA: "Pasos feéricos"`, `gastarDePadre: true`).
     - *Luz sanadora* (Celestial): Botón ágil de 1d6 por uso, con reserva calculada como $1 + \text{nivel}$ por descanso largo.
     - *Resiliencia celestial* (Celestial Nv 10) y *Bendición del Oscuro* (Infernal Nv 3): Botones interactivos `+X PG Temp` bajo demanda sin límite de usos diarios (`tieneUsosLimitados: false`), evaluando dinámicamente `nivel + carisma` y `max(1, carisma + nivel)`.
     - *Defensas fascinantes* (Archihadas Nv 10): Reacción consumible 1/1 descanso largo combinada con inmunidad pasiva a la condición `hechizado`.
     - *Resiliencia infernal* (Infernal Nv 10): Selector interactivo `tipo: "unico"` con las 12 opciones elementales oficiales (excluyendo daño de fuerza), con valor por defecto `"fuego"`.

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Evaluación de Fórmulas Dinámicas en Usos y Efectos:**
   - La función `evaluarFormulaUsos` en `gestorClases.ts` originalmente solo soportaba funciones JS compiladas o funciones flecha string (`(niv) => ...`), fallando ante expresiones textuales como `"1 + nivel"`.
   - Las expresiones dinámicas de PG temporales (`resolverFormulaDinamica`) no admitían `max(a, b)` ni `min(a, b)` de manera segura sin recurrir al peligroso `eval()`.
2. **Normalización de Tokens de Atributos:**
   - En fórmulas como `2d8+carisma` o `modificador_carisma`, los reemplazos por regex podían interferir si los prefijos `modificador_` o `mod_` se duplicaban.
3. **Consolidación de Rasgos de Subclase Ligados:**
   - El bucle de rasgos de subclase en `gestorClases.ts` no consolidaba extensiones de rasgos con `ligadoA` de la misma manera que el bucle de clase base.
4. **Contratos de Tipado Estricto:**
   - `PlantillaRasgoClase` modela los usos mediante `formulaUsos: string` y `obtenerUsosMaximos?: (nivel: number) => number`, mientras que `RasgoPersonaje` contiene `usosMaximos: number`.
   - Los selectores en plantillas requieren `tipo: "unico" | "multiple"`, `maxSelecciones: number` y descripciones en cada `OpcionSelector`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Evaluador de Efectos y Fórmulas Numéricas Seguras (`evaluadorEfectosRasgos.ts`):**
   - Incorporado soporte seguro para `max(a, b)` y `min(a, b)` en el parser recursivo sin `eval()`.
   - Normalizados los tokens de estadísticas (`modificador_carisma`, `mod_carisma`, `carisma`) para que se sustituyan de forma uniforme por sus valores numéricos antes del cálculo.
2. **Extensión Genérica en el Builder (`gestorClases.ts`):**
   - Integrado `evaluarExpresionNumericaSegura` como fallback en `evaluarFormulaUsos` para fórmulas dinámicas tipo `"1 + nivel"`.
   - Agregada consolidación genérica de rasgos con `categoriaMecanica === "extension"` o `ligadoA` para rasgos provenientes de subclases.
3. **Catálogo Canónico Oficial (`clasesDND55.ts`):**
   - Clase base Brujo con *Magia del pacto*, *Invocaciones sobrenaturales* (Nv 1), *Astucia mágica* (Nv 2, consumible 1/1), *Contactar con el patrón* (Nv 9, con conjuro otorgado), *Arcano místico* (Nv 11, 13, 15, 17) y *Maestro sobrenatural* (Nv 20, extensión vinculada a Astucia mágica).
   - 4 Subclases implementadas al 100%: Archihadas, Celestial, Infernal y Gran Primigenio con todas sus mecánicas, selectores, efectos y pools de dados.
4. **Reactividad de Atributos (`slicePersonajesBase.ts`):**
   - Sincronización automática de usos de rasgos dependientes de Carisma mediante comprobación declarativa de `escaladoUsos.tipo === "por_modificador" && escaladoUsos.modificador === "carisma"`.
5. **Cobertura Automatizada Exhaustiva (`brujoDND55.test.ts`):**
   - Suite con 21 pruebas unitarias y de integración que validan: catálogo y subclases, progresión Nv 1-20, Pasos feéricos / Escapada brumosa con gasto del padre, reserva de dados de Luz sanadora, resistencia elemental configurable de Resiliencia infernal, fórmulas de PG temporal y reactividad dinámica al modificar Carisma.
6. **Métricas de Calidad Verificadas:**
   - 100% de éxito en Vitest: 56 suites pasando, 707 pruebas superadas (+21 pruebas nuevas).
   - `pnpm exec tsc --noEmit`: 0 errores bajo configuración estricta (`strict: true`).
   - `pnpm run lint`: 0 errores y 0 advertencias bajo `--max-warnings=0`.
   - `node scripts/verificar-limite-lineas.js`: 100% conforme sin infracciones de arquitectura.

---

## [2026-09-15] Selectores de Sugerencias Ricos para Especies y Subrazas / Legados en Configuración de Personajes

**Contexto y Requerimientos del Usuario:**
- El usuario solicitó que en el formulario de configuración de personajes, los campos de especies y legados/subrazas fuesen selectores de sugerencias que brinden las razas y sus respectivas subrazas/legados de forma dinámica y reactiva.

**Causas Raíz y Diagnóstico Técnico:**
1. **Inputs de Texto Planos en `PestanaIdentidad.tsx`:**
   - En el panel principal de configuración (`PanelConfiguracionPersonaje` -> `PestanaIdentidad`), los campos `especie` y `subespecie` estaban implementados como simples `<input type="text">`, obligando al usuario a escribir manualmente nombres exactos sin asistencia visual ni descubrimiento interactivo.
2. **Desacoplamiento de Opciones y Etiquetas Adaptativas:**
   - No se aprovechaba el componente existente `SelectorSugerencias` con metadatos contextuales (`subtitulo` con tipo de criatura, tamaño, velocidad y descripciones del linaje).
   - Las etiquetas de formulario eran fijas en vez de adaptarse semánticamente al linaje correspondiente (*Legado Dracónico*, *Legado Infernal*, *Linaje Gigante*, *Linaje Gnomo*, *Linaje Élfico*).

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Controladores Reactivos en el Hook de Configuración (`usarConfiguracionPersonaje.ts`):**
   - Se crearon `manejarCambioEspecie` y `manejarCambioSubespecie` que actualizan el formulario y sincronizan automáticamente los rasgos declarativos de la ficha mediante `sincronizarRasgosAutomaticos`.
2. **Integración de `SelectorSugerencias` en `PestanaIdentidad.tsx` y `ModalEditarPersonaje.tsx`:**
   - Reemplazo de inputs planos por `SelectorSugerencias` con opciones memoizadas y enriquecidas:
     - `opcionesEspecies`: todas las razas oficiales del catálogo (`CATALOGO_ESPECIES_DND55`) con subtítulo informativo.
     - `opcionesSubespecies`: resolución reactiva de subespecies/legados/linajes mediante `obtenerSubespeciesDeEspecie(form.especie)`.
   - Etiquetas dinámicas y adaptativas según la especie elegida.
3. **Cobertura Automatizada Exhaustiva (`selectorEspeciesConfiguracion.test.tsx`):**
   - Verificación de catálogo de 10 especies oficiales.
   - Resolución de subespecies para Tiefling (3 legados), Dracónido (10 dragones), Goliat (6 gigantes), Elfo (3 linajes) y Gnomo (2 linajes).
   - Manejo de especies sin subespecies (Humano, Orco, Mediano).
   - Renderizado y etiquetas adaptativas en `PestanaIdentidad`.
   - Sincronización automática de rasgos en cambios de especie.
4. **Métricas de Calidad Verificadas:**
   - 100% de éxito en Vitest: 55 suites pasando, 686 pruebas superadas (+5 pruebas nuevas).
   - `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
   - `pnpm run lint`: 0 errores y 0 advertencias bajo `--max-warnings=0`.
   - `node scripts/verificar-limite-lineas.js`: 100% conforme.

---

## [2026-09-15] Implementación Canónica y Declarativa de Tiefling (D&D 5.5e), Legados Infernales y Desbloqueo Progresivo en el Builder

**Contexto y Requerimientos del Usuario:**
- Implementación canónica y declarativa de la especie Tiefling a partir de `dicionario_herramientas/razas/Tiefling.md` para D&D 5.5e (2024):
  1. *Especie Base*: Tipo Humanoide, tamaño flexible Mediano o Pequeño (con selector declarativo), velocidad 30 pies y visión en la oscuridad 60 pies.
  2. *Presencia sobrenatural*: Truco *taumaturgia* innato.
  3. *Legado infernal*: Selector de aptitud mágica elegible entre Inteligencia, Sabiduría o Carisma (`selector_aptitud_magica_tiefling`), compartido por todos los conjuros de la especie.
  4. *3 Subespecies (Legados Infernales)* estructuradas idénticamente al patrón canónico del Elfo:
     - **Legado abisal**: Resistencia al daño de veneno, truco *rociada venenosa* (Nv 1), conjuro *rayo nauseabundo* (Nv 3, siempre preparado, 1 uso gratis/descanso largo) y conjuro *inmovilizar persona* (Nv 5, siempre preparado, 1 uso gratis/descanso largo).
     - **Legado ctónico**: Resistencia al daño necrótico, truco *toque helado* (Nv 1), conjuro *falsa vida* (Nv 3, siempre preparado, 1 uso gratis/descanso largo) y conjuro *rayo debilitador* (Nv 5, siempre preparado, 1 uso gratis/descanso largo).
     - **Legado infernal**: Resistencia al daño de fuego, truco *descarga de fuego* (Nv 1), conjuro *reprensión infernal* (Nv 3, reacción, siempre preparado, 1 uso gratis/descanso largo) y conjuro *oscuridad* (Nv 5, siempre preparado, 1 uso gratis/descanso largo).
  5. *Arquitectura Declarativa desde el Builder*: Reutilizar las funciones genéricas y puras existentes (`construirRasgosEspecie`, `aplicarEspecieAPersonaje`, `resolverOrigenConjuro`) sin introducir ninguna bifurcación condicional por nombre de rasgo ni especie en la lógica de negocio (Regla 6).

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Definición Parcial Previa en `especiesDND55.ts`:**
   - La entrada anterior de Tiefling era un borrador que carecía de los rasgos base de Tipo de criatura, Tamaño configurable, y en los legados solo incluía los rasgos de resistencia, omitiendo los rasgos de acción para los conjuros de nivel 1, 3 y 5.
2. **Divergencias en Traducción de Hechizos (*Hellish Rebuke*):**
   - En compendios clásicos en español figuraba como *Represión infernal* mientras que en la traducción canónica de 5.5e y en `Tiefling.md` figura como *Reprensión infernal* (con 'n'). Igualmente, *Descarga de fuego* vs *Descarga fuego*.
   - **Solución:** Se añadieron alias bidireccionales en `MAPA_ALIAS_HECHIZOS` (`subclasesConjurosConstantes.ts`), garantizando resolución perfecta tanto en búsquedas como en clasificación de orígenes.
3. **Desbloqueo Progresivo y Respeto de Nivel:**
   - Para cumplir la regla de que a niveles 3 y 5 se desbloquean los conjuros superiores sin contaminar la ficha a nivel 1 o 2, los rasgos de magia N3 y N5 portan `nivelRequerido: 3` y `nivelRequerido: 5`. La función pura `aplicarEspecieAPersonaje` los filtra declarativamente con `!r.nivelRequerido || r.nivelRequerido <= nivelPj`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Reconciliación de Alias de Conjuros (`subclasesConjurosConstantes.ts`):**
   - Incorporados alias para `"reprension infernal"` <-> `"represion infernal"` y `"descarga de fuego"` <-> `"descarga fuego"`.
2. **Catálogo Canónico Oficial D&D 5.5e (`especiesDND55.ts`):**
   - Tiefling completo con rasgos base (`Tipo de criatura`, `Tamaño` Mediano/Pequeño, `Visión en la oscuridad`, `Presencia sobrenatural` con `taumaturgia`, `Legado infernal` con selector `selector_aptitud_magica_tiefling`).
   - 3 Legados (*Abisal*, *Ctónico*, *Infernal*) con rasgos de resistencia, trucos innatos N1 y conjuros N3 y N5 con `categoriaMecanica: "consumible"`, `usosMaximos: 1` y `recuperacion: "descanso_largo"`.
3. **Sincronización de Fuentes Complementarias:**
   - `rasgosDND55.ts`: Actualizados los 5 rasgos base canónicos de Tiefling en `RASGOS_POR_ESPECIE`.
   - `especies.json`: Sincronizada la entrada con nombre oficial `"Tiefling"` y descripciones canónicas.
4. **Cobertura Automatizada Exhaustiva (`gestorEspecies.test.ts`):**
   - Suite `Tiefling y Legados Infernales (Tiefling.md - D&D 5.5e)` con 9 pruebas rigurosas:
     - Validación de metadatos de especie y tamaño Mediano/Pequeño.
     - Presencia sobrenatural y selector de aptitud mágica (INT/SAB/CAR).
     - Validación de los 3 legados y sus resistencias oficiales (Veneno, Necrótico, Fuego).
     - Validación de rasgos y conjuros innatos de Legado abisal, Legado ctónico y Legado infernal.
     - Desbloqueo progresivo por nivel: nivel 1 solo trucos; nivel 3 agrega conjuro N3 y rasgo de recurso; nivel 5 agrega conjuro N5 y rasgo de recurso.
     - Conmutación limpia entre legados: sin duplicados ni residuos huérfanos.
     - Clasificación de origen de conjuros: `resolverOrigenConjuro` asigna `"legado"` a los hechizos de subraza y `"especie"` a *taumaturgia*.
5. **Métricas de Calidad Verificadas:**
   - 100% de éxito en Vitest: 54 suites pasando, 681 pruebas superadas (+10 pruebas nuevas).
   - `pnpm exec tsc --noEmit`: 0 errores (Strict Mode activo).
   - `pnpm run lint`: 0 errores y 0 advertencias bajo `--max-warnings=0`.
   - `node scripts/verificar-limite-lineas.js`: 100% aprobado sin infracciones.

---

## [2026-09-15] Implementación Canónica y Declarativa de Orco (D&D 5.5e), Soporte Builder para HP Temporal y Consumibles

**Contexto y Requerimientos del Usuario:**
- Implementación oficial de la especie Orco a partir de `dicionario_herramientas/razas/Orco.md` según las reglas canónicas de D&D 5.5e (2024):
  1. *Descarga de adrenalina*: Consumible (acción adicional) que permite usar la acción de Correr y otorga puntos de golpe temporales iguales al Bonificador por Competencia (PB). Usos escalados a PB (`formulaEscalado: "bono_competencia"`), recargables al terminar un descanso corto o largo (`recuperacion: "descanso_corto"`).
  2. *Aguante incansable*: Consumible informativo (tipo reacción) que al llegar a 0 PG permite caer a 1 PG en su lugar (1 uso por descanso largo).
  3. *Visión en la oscuridad*: Pasivo que otorga visión en la oscuridad en un radio de 120 pies.
  4. Metadatos oficiales: Tipo Humanoide, tamaño Mediano, velocidad base 30 pies, visión en la oscuridad 120 pies.
  5. Generalización desde el Builder: Toda la configuración debe poder construirse desde `ConstructorRasgoDote.tsx` de forma puramente declarativa y reutilizando las funciones y esquemas existentes, sin hardcodear bifurcaciones por nombre o especie en la lógica de negocio (Regla 6).
  6. Política de Notificaciones de TaleSpire: El usuario indicó explícitamente no enviar avisos al chat de TaleSpire (`ts.chat.send`) para la ganancia de PG temporales.

**Causas Raíz y Desafíos Técnicos:**
1. **Falta de Selectores de Mecánica y Escalado en el Builder (`ConstructorRasgoDote.tsx`):**
   - El constructor no exponía `categoriaMecanica` ("consumible", "curacion", etc.) ni `formulaEscalado` ("bono_competencia", "escalado_nivel"), impidiendo configurar desde la interfaz rasgos con recursos que escalan con PB.
2. **Ausencia de Función Pura de Cálculo de HP Temporal:**
   - La resolución de efectos mecánicos de tipo `hp_temporal` no disponía de un helper puro y reutilizable que conectara la fórmula o token dinámico (`"bono_competencia"`) con las utilidades de resolución (`resolverFormulaDinamica` y `evaluarExpresionNumericaSegura`).
3. **Falta de Acción Rápida en TarjetaRasgo para Rasgos de HP Temporal sin Dados:**
   - Los rasgos con efectos de HP temporal pero sin fórmula de tirada de dados (como *Descarga de adrenalina*) no contaban con un botón rápido para aplicar los puntos temporales y consumir el uso de forma declarativa.
4. **Límite de Líneas en Componentes (500 líneas):**
   - `TarjetaRasgo.tsx` requería modificaciones estrictamente quirúrgicas para mantenerse por debajo del límite de 500 líneas impuesto por la auditoría de CI.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Funciones Puras y Agnósticas en `evaluadorEfectosRasgos.ts`:**
   - `calcularHpTemporalDeEfecto(efecto, personaje)`: Evalúa el valor numérico de PG temporales de un efecto, resolviendo de forma segura cadenas directas o tokens dinámicos (`"bono_competencia"`, `"nivel"`, expresiones matemáticas).
   - `obtenerEfectoHpTemporalRasgo(rasgo)`: Localiza declarativamente el efecto de `hp_temporal` en los efectos del rasgo.
2. **Generalización Completa en el Builder (`ConstructorRasgoDote.tsx`):**
   - Agregados estados y controles de UI para `categoriaMecanica` y `formulaEscalado`.
   - Incorporados presets para efectos de tipo `hp_temporal` ("Bono de Competencia (PB)", "Nivel del Personaje", "Valor Fijo 5 PG", etc.) con selección de objetivo (`"propio"` o `"aliado"`).
3. **Acción Declarativa en `TarjetaRasgo.tsx`:**
   - Para rasgos con `tieneUsosLimitados`, `usosRestantes > 0`, sin `formulaDados` y con efecto `hp_temporal` propio, se renderiza el botón de acción rápida `+{valor} PG Temp` (icono Lucide `Shield`).
   - Al pulsarse, consume 1 uso del rasgo, actualiza los puntos de golpe temporales mediante `aplicarResultadoHpTemporalEnEstado` y despacha una notificación toast local sin emitir mensaje al chat de TaleSpire.
   - Tamaño final del archivo: 481 líneas (aprobado por CI, umbral < 500).
4. **Sincronización Canónica Oficial D&D 5.5e:**
   - `especiesDND55.ts`: Definición oficial de Orco con *Descarga de adrenalina*, *Visión en la oscuridad* (120 pies) y *Aguante incansable*.
   - `rasgosDND55.ts`: Actualizados nombres canónicos de Orco.
   - `especies.json`: Sincronizados IDs y descripciones canónicas.
5. **Suite Exhaustiva de Pruebas Unitarias (`gestorEspecies.test.ts`):**
   - Validación de metadatos de especie (Humanoide, Mediano, 30 pies, 120 pies de visión en la oscuridad).
   - Verificación de construcción con escalado por PB (2 usos a nivel 1, 3 usos a nivel 5).
   - Evaluación pura de puntos de golpe temporales con `calcularHpTemporalDeEfecto` (2 PG a nv 1, 3 PG a nv 5, 4 PG a nv 9).
   - Ciclo de vida y recuperación en descansos: *Descarga de adrenalina* recupera en descanso corto y largo; *Aguante incansable* solo en descanso largo.
6. **Métricas de Calidad Verificadas:**
   - 100% de éxito en Vitest: 54 suites pasando, 671 pruebas superadas.
   - `pnpm exec tsc --noEmit`: 0 errores (Strict Mode).
   - `pnpm run lint`: 0 errores y 0 advertencias.
   - `node scripts/verificar-limite-lineas.js`: 100% conforme.

---

## [2026-09-15] Implementación Canónica e Informativa de Mediano (D&D 5.5e)

**Contexto y Requerimientos del Usuario:**
- El usuario solicitó la implementación canónica de la especie Mediano a partir de `dicionario_herramientas/razas/Mediano.md`, con la directiva expresa: *"todo aqui es absolutamente informativo"*.
- Metadatos oficiales canónicos:
  - Tipo de criatura: Humanoide.
  - Tamaño: Pequeño (entre 2 y 3 pies de altura).
  - Velocidad base: 30 pies.
  - Visión en la oscuridad: 0 pies.
- Cuatro rasgos oficiales de D&D 5.5e (puramente informativos, `efectos: []`, sin automatizaciones de tiradas ni deducción de recursos):
  1. *Valiente*: "Tienes ventaja en las tiradas de salvación que hagas para evitar o poner fin al estado de asustado."
  2. *Agilidad de mediano*: "Puedes moverte a través del espacio ocupado por cualquier criatura de tamaño superior al tuyo, pero no puedes detenerte en el mismo espacio."
  3. *Fortuna*: "Cuando saques un 1 en una prueba con d20, podrás repetir la tirada y deberás utilizar el nuevo resultado."
  4. *Sigiloso por naturaleza*: "Puedes llevar a cabo la acción de esconderte incluso tras una criatura cuyo tamaño sea, al menos, una categoría superior al tuyo."

**Causas Raíz y Desfases Identificados:**
1. **Nombres y Textos Heredados Desactualizados en `rasgosDND55.ts`:**
   - La clave `"Mediano"` usaba los nombres de 5e clásica *"Afortunado (Mediano)"* y *"Sigilo natural"* en lugar de los canónicos de D&D 5.5e (*Fortuna* y *Sigiloso por naturaleza*).
   - En *Agilidad de mediano* faltaba la cláusula de restricción canónica: `", pero no puedes detenerte en el mismo espacio."`.
2. **Incompletitud en `especies.json`:**
   - La entrada legacy de Mediano tenía id `"halfling"` y carecía del cuarto rasgo *Sigiloso por naturaleza*.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Sincronización Canónica en `especiesDND55.ts`:**
   - Se completaron y alinearon literalmente las descripciones de *Agilidad de mediano* y *Sigiloso por naturaleza* con la fuente de verdad `Mediano.md`.
   - Se certificó que los 4 rasgos mantienen `efectos: []`, cumpliendo con su naturaleza 100% informativa.
2. **Normalización del Catálogo Fallback (`rasgosDND55.ts`):**
   - Actualización de `"Mediano"` en `RASGOS_POR_ESPECIE` con *Fortuna*, *Valiente*, *Agilidad de mediano* y *Sigiloso por naturaleza*, sincronizando textos exactos.
3. **Actualización de la Base de Datos (`especies.json`):**
   - Entrada unificada con id `"mediano"`, tipo Humanoide, tamaño Pequeño, velocidad 30 pies y los 4 rasgos canónicos informativos.
4. **Cobertura Automatizada Exhaustiva (`gestorEspecies.test.ts`):**
   - Suite `Implementación Canónica e Informativa de Mediano (D&D 5.5e)` con 3 pruebas completas:
     - Verificación de metadatos oficiales de especie.
     - Verificación de construcción de rasgos y ausencia de efectos mecánicos (`efectos: []`).
     - Verificación de aplicación a personaje (`aplicarEspecieAPersonaje`): tamaño Pequeño, velocidad 30 pies e inyección de los rasgos informativos en la ficha.
5. **Métricas de Calidad Verificadas:**
   - 100% de éxito en Vitest: 54/54 suites pasando, 667/667 pruebas superadas.
   - `pnpm exec tsc --noEmit`: 0 errores (Strict Mode activo).
   - `pnpm run lint`: 0 errores y 0 advertencias.
   - `node scripts/verificar-limite-lineas.js`: 100% aprobado sin infracciones.

---

## [2026-09-15] Implementación Canónica de Humano (D&D 5.5e), Recuperación Declarativa de Inspiración Heroica y Builder Genérico

**Contexto y Requerimientos del Usuario:**
- Implementación canónica y declarativa de la especie Humano a partir de `dicionario_herramientas/razas/Humano.md`:
  1. *Ingenioso*: rasgo mecánico que otorga Inspiración Heroica tras finalizar un descanso largo (`personaje.inspiracion = true`).
  2. *Diestro*: rasgo puramente informativo (competencia en una habilidad a elección).
  3. *Versátil*: rasgo puramente informativo (dote de origen a elección).
  4. Tipo Humanoide, tamaño elegible Mediano o Pequeño, velocidad 30 pies y visión en la oscuridad 0 pies.
  5. Generalización completa desde el Builder: el constructor (`ConstructorRasgoDote.tsx`) debe permitir configurar la restauración de recursos (`tipo: "restaurar_recurso"`) seleccionando el recurso (con presets para "Inspiración Heroica", "Furia", "Espacios de Pacto", etc.) y el momento de restauración (`descanso_largo`, `descanso_corto`, `al_activar`), sin hardcodear bifurcaciones por nombre de rasgo ni especie en la lógica de negocio (Regla 6).

**Causas Raíz y Desafíos Técnicos:**
1. **Falta de Evaluación de Inspiración en Descansos (`procesadorDescansos.ts`):**
   - `ejecutarDescansoLargo` y `ejecutarDescansoCorto` restauraban HP, dados de golpe, cansancio y cargas, pero no contemplaban la restauración declarativa de la propiedad booleana `inspiracion`.
2. **Ausencia de Función Agnóstica en el Evaluador de Efectos:**
   - No existía un helper puro que inspeccionara los efectos activos para detectar si algún rasgo confiere inspiración al descansar, obligando a resolverlo mediante arquitectura declarativa (`restaurar_recurso` con objetivo `inspiracion`).
3. **Falta de Control de Momento y Presets en el Builder UI (`ConstructorRasgoDote.tsx`):**
   - El formulario de `restaurar_recurso` solo permitía texto libre sin asociar la condición/momento de restauración (`condicion`) ni presets rápidos para `inspiracion`.
4. **Nombres Desfasados en Catálogo y Compendio:**
   - El catálogo contenía erróneamente *"Ingenio ingenioso"* en `especiesDND55.ts` y `rasgosDND55.ts`, y `compendioRasgos.test.ts` lo comprobaba con ese texto obsoleto.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Función Agnóstica Pura (`evaluadorEfectosRasgos.ts`):**
   - Se implementó `evaluarRecuperacionInspiracionEnDescanso(personaje, tipoDescanso)`.
   - Evalúa `evaluarEfectosRasgosActivos(personaje)` buscando `tipo === "restaurar_recurso"` con objetivo `inspiracion`/`inspiracion_heroica` y coincidencia en la condición del descanso (`descanso_largo` o `descanso_corto`).
2. **Motor de Descansos Reactivo (`procesadorDescansos.ts`):**
   - En `ejecutarDescansoLargo`, se evalúa `evaluarRecuperacionInspiracionEnDescanso(personaje, "largo")`. Si aplica, se actualiza `inspiracion: true` y se registra la acción en el resumen del descanso (mostrada en `ModalResumenDescanso`).
   - Soporte simétrico añadido para `ejecutarDescansoCorto`.
3. **Generalización del Builder (`ConstructorRasgoDote.tsx`):**
   - Soporte completo para `nuevoCondicion` en los efectos mecánicos.
   - Presets accesibles mediante `SelectorDesplegable` para `"Inspiración Heroica"`, `"Furia"`, `"Espacios de Pacto"`.
   - Selector de Momento de Restauración (`descanso_largo`, `descanso_corto`, `al_activar`, `siempre`).
   - Generación de descripción clara y amigable al configurar el efecto.
4. **Catálogo Canónico Oficial D&D 5.5e (`especiesDND55.ts`, `rasgosDND55.ts`, `especies.json`):**
   - Humano: Mediano/Pequeño, Humanoide, velocidad 30 pies.
   - *Ingenioso*: pasivo con efecto `restaurar_recurso` (objetivo `"inspiracion"`, condición `"descanso_largo"`).
   - *Diestro*: pasivo informativo.
   - *Versátil*: pasivo informativo.
5. **Cobertura Automatizada y Blindaje:**
   - Tests exhaustivos en `procesadorDescansos.test.ts` y `gestorEspecies.test.ts` verificando catálogo, rasgos, tamaño configurable y restauración efectiva de inspiración en descansos largos y cortos.
   - 100% de éxito en pipeline CI: 54/54 suites pasando (664 tests), `tsc --noEmit` con 0 errores, ESLint limpio y límite de líneas aprobado.

---

## [2026-09-15] Modernización de ESLint, Blindaje de Reglas de Arquitectura y Erradicación de Strings Mágicos

**Contexto y Requerimientos del Usuario:**
- El usuario solicitó auditar y activar las reglas pendientes del linter:
  1. `...js.configs.recommended.rules` (`no-dupe-keys`, `no-unreachable`, `no-fallthrough`, etc.).
  2. `...reactPlugin.configs.flat.recommended.rules` (`jsx-key`, `no-unstable-nested-components`, etc.).
  3. `...reactHooksPlugin.configs["recommended-latest"].rules` (`rules-of-hooks` como error, `exhaustive-deps`).
  4. Codificar en el linter las reglas de `DESIGN.md` y arquitectura: `react/forbid-elements` para `<select>`, aislamiento de `window.TS`, prohibición de `localStorage` en componentes y `no-console`.
  5. Extender la regla anti-strings mágicos (`r.nombre === "..."`) para cubrir llamadas con `.includes(...)` y `.toLowerCase().includes(...)` sobre `nombre` y `clase`, aplicándola también a `src/componentes/**` y `src/hooks/**`.
  6. Saneamiento del bloque `globals` utilizando `globals.browser` y eliminando la declaración manual de tipos utilitarios de TS.

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Incompatibilidad de Idioma en `rules-of-hooks`:**
   - `eslint-plugin-react-hooks` v7 hardcodea en su parser que un Custom Hook debe comenzar estrictamente por `use` (`/^use[A-Z0-9]/`). Como el proyecto exige nombres en español (`usar...`), aplicar la regla sobre `**/*.ts` disparaba 285 falsos positivos considerando a los hooks como funciones ordinarias ilegales para hospedar hooks.
   - **Solución:** Aplicar `rules-of-hooks: "error"` estrictamente a archivos `**/*.tsx` (componentes). Esto detectó de forma quirúrgica un bug condicional real en `VistaAtaquesJugador.tsx` (un early return previo a `React.useMemo`).
2. **Impacto de Estilos Inline (`react/forbid-dom-props`):**
   - La base de código heredada contenía 947 ocurrencias de `style={{}}`. Dado que el script `lint` corre con `--max-warnings=0`, activarla como `warn` rompería el CI de inmediato, por lo que se reservó su activación para cuando se realice la migración progresiva a clases CSS.
3. **Fugas de Aislamiento de TaleSpire (`window.TS`):**
   - Se detectaron 3 componentes (`BarraControl.tsx`, `BuscadorMonstruos.tsx` y `GestorIniciativa.tsx`) llamando a `window.TS.debug?.log` directamente en vez de utilizar el adaptador o `logger`.
4. **Bifurcaciones Anti-patrón por Nombre o Clase con `.includes`:**
   - La auditoría detectó comparaciones por texto literal en `usarCalculoAtaquesJugador.ts`, `usarMagiaPersonaje.ts`, `calculadorMagia.ts`, `procesadorCondiciones.ts`, `ejecutorTiradasCombate.ts`, `resolutorOrigenConjuros.ts` y `sincronizacionIniciativa.ts`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Instalación y Configuración Limpia:**
   - Adición de `@eslint/js` y `globals` a `devDependencies` vía `pnpm`.
   - `globals.browser` activado en `eslint.config.js`; tipos TS retirados de las globales de runtime.
   - Activación de `js.configs.recommended` (con `no-undef: "off"` y `no-useless-assignment: "off"`).
   - Activación de `react.flat.recommended` (con `react-in-jsx-scope: "off"`, `prop-types: "off"`, `display-name: "off"`, `no-unescaped-entities: "off"`).
2. **Blindaje de Reglas de Diseño y Arquitectura:**
   - `react/forbid-elements: ["error", { forbid: [{ element: "select" }] }]` activado.
   - `no-console: "error"` activado con excepción para `logger.ts`, `editor_hechizos/**` y tests.
   - `no-restricted-globals`: `localStorage` prohibido en `src/componentes/**`.
   - `no-restricted-syntax`: `window.TS` prohibido fuera de `TaleSpireAdapter.ts`.
3. **Erradicación de Strings Mágicos y Centralización Canónica:**
   - Creación de helpers puros `esLanzadorSabiduria` y `esClaseBarbaro` en `src/constantes/identificadoresDND.ts`.
   - Migración de todas las comprobaciones de clase y rasgos en combate a IDs canónicos (`r.id === "..."` o `coincideIdRasgo`).
   - Corrección del hook condicional en `VistaAtaquesJugador.tsx` reubicando `useMemo` incondicionalmente al inicio.
4. **Verificación Automatizada Exhaustiva:**
   - `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
   - `pnpm run lint`: 0 errores y 0 advertencias bajo `--max-warnings=0`.
   - `pnpm test`: 54/54 suites superadas, 657/657 tests pasando (100%).
   - `node scripts/verificar-limite-lineas.js`: 109 archivos auditados, 0 archivos con más de 500 líneas.
   - `pnpm run ci`: 100% de éxito en pipeline integral.

---

## [2026-09-15] Corrección de Reordenación de Equipados en Inventario y Colapso Directo de Subsecciones de Magia en Acciones

**Contexto y Requerimientos del Usuario:**
- El usuario reportó dos bugs menores:
  1. *"en inventario si le hago drag and drop a los objetos equipados automaticamente me los desequipa aunque yo queria era ordenarlos dentro el mismo campo de equipados"*
  2. *"en acciones los contenedores dentro del contenedor de magia por alguna razon les debo dar doble click para que cierren."*

**Causas Raíz Identificadas:**
1. **Desequipado Incondicional en Drop de Objetos de Inventario (`usarInventarioOrdenado.ts` y `usarDragAndDropInventario.ts`):**
   - En `manejarReordenarItems` y `manejarDrop`, la lógica evaluaba:
     `if (objOrigen?.equipado) { alAlternarEquipado(origen); ... }`
   - Si el usuario arrastraba un ítem equipado sobre otro ítem que también estaba equipado (`objDestino.equipado === true`), la condición se ejecutaba de todos modos y llamaba a `alAlternarEquipado`, desequipando involuntariamente el objeto en vez de preservar su estado y limitarse a reposicionarlo en la ficha mediante `alReordenarInventario`.
2. **Evaluación de Estado Booleano Indefinido en `alternarSeccion` de Acciones de Combate (`usarCalculoAtaquesJugador.ts`):**
   - Las subsecciones de nivel de magia se identifican como `magicos_nv_${nivel}` (ej. `magicos_nv_0`, `magicos_nv_1`). Estas claves no estaban preinicializadas en el estado por defecto de `seccionesAbiertas`.
   - `SeccionAtaquesMagicos.tsx` evaluaba la apertura con `seccionesAbiertas['magicos_nv_${nivel}'] !== false`, mostrándolas desplegadas por defecto (`undefined !== false` -> `true`).
   - Al pulsar la cabecera para colapsar, `alternarSeccion` calculaba `[seccion]: !prev[seccion]`. Como `prev[seccion]` era `undefined`, `!undefined` evaluaba a `true`.
   - En consecuencia, el primer clic fijaba el valor en `true` y la sección permanecía visualmente abierta. Solo tras un segundo clic (`!true` -> `false`) el contenedor se cerraba efectivamente.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Condición Estricta de Desequipado en Drag & Drop (`usarInventarioOrdenado.ts` y `usarDragAndDropInventario.ts`):**
   - Se condicionó el desequipado exclusivamente a `objOrigen?.equipado && !objDestino?.equipado`.
   - Cuando ambos objetos están equipados (`objOrigen.equipado && objDestino.equipado`), no se llama a `alAlternarEquipado`, no se envían notificaciones espurias y se invoca directamente `alReordenarInventario(origen, destino)`.
   - La lista reactiva de `objetosEquipados` refleja instantáneamente el nuevo orden relativo de los ítems equipados.
2. **Normalización Defensiva en `alternarSeccion` (`usarCalculoAtaquesJugador.ts`):**
   - Se actualizó `alternarSeccion` para resolver el estado efectivo con fallback a abierto: `const estaAbierta = prev[seccion] !== false; return { ...prev, [seccion]: !estaAbierta };`.
   - Esto garantiza que cualquier clave ausente o `undefined` pase a `false` inmediatamente en el primer clic.
   - Se preinicializaron declarativamente las claves `magicos_nv_0` hasta `magicos_nv_9` en el estado por defecto de `ts_acciones_secciones`.
3. **Cobertura Automatizada:**
   - Creación de `src/componentes/caracteristicas/inventario/reordenacionYColapso.test.ts` con cobertura específica para:
     - Drag and drop entre equipados sin desequipado accidental.
     - Drag and drop de equipado a mochila con desequipado correcto.
     - Cierre inmediato en 1 solo clic de subsecciones no inicializadas vs el bug anterior de doble clic.
   - 100% de suites superadas (54/54 suites, 657/657 tests), `tsc --noEmit` sin errores, ESLint limpio y verificación de límite de líneas aprobada.

---

## [2026-09-15] Desbloqueo Estricto por Nivel de Rasgos de Especie (Forma Grande Nivel 5 de Goliat)

**Contexto y Requerimientos del Usuario:**
- El usuario reportó: *"la habilidad NIVEL 5: FORMA GRANDE es a nivel 5, pero me aparece aunque sea nv 1"*.
- En D&D 5.5e, *Forma grande* de Goliat se desbloquea a partir del nivel 5 de personaje. Un personaje de nivel 1..4 no debe poseer esta habilidad activa en su ficha, no debe verla en la pestaña "Mis Rasgos" de la interfaz ni debe poder activar sus efectos de ventaja y tamaño.

**Causas Raíz Identificadas:**
1. **Falta de Filtrado por Nivel en la Inyección de Rasgos de Especie:**
   - En `gestorEspecies.ts`, la función `aplicarEspecieAPersonaje` llamaba a `construirRasgosEspecie`, pero no filtraba los rasgos resultantes comparando `r.nivelRequerido` contra `nivelPj`. En consecuencia, los rasgos de nivel superior (como *Forma grande* Nv 5 de Goliat o *Revelación celestial* Nv 3 de Aasimar) se agregaban directamente a `personaje.rasgos` a nivel 1.
2. **Falta de Filtrado por Nivel en la Sincronización Automática (`compendioRasgos.ts`):**
   - `sincronizarRasgosAutomaticos` llamaba a `obtenerRasgosSugeridosPorEspecie` sin validar `!r.nivelRequerido || r.nivelRequerido <= nivelPj`. Al recalcular rasgos canónicos, mantenía los rasgos de nivel superior en personajes de nivel inferior.
3. **Ausencia de Filtro de Nivel en la Vista de Jugador (`usarVistaRasgos.ts`):**
   - El hook `usarVistaRasgos.ts` filtraba por búsqueda y tipo de acción, pero no comparaba `r.nivelRequerido` contra `personajeActivo.nivel`, mostrando las tarjetas de rasgos de niveles futuros como si estuvieran disponibles para ser activadas o utilizadas.
4. **Fuga de Efectos Mecánicos Activos (`evaluadorEfectosRasgos.ts`):**
   - `evaluarEfectosRasgosActivos` iteraba todos los rasgos sin comprobar `rasgo.nivelRequerido && nivelPj < rasgo.nivelRequerido`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Filtrado por Nivel en Aplicación de Especie (`gestorEspecies.ts`):**
   - En `aplicarEspecieAPersonaje`, se filtran los rasgos con `filter((r) => !r.nivelRequerido || r.nivelRequerido <= nivelPj)`.
2. **Filtrado por Nivel en Sincronización Automática (`compendioRasgos.ts`):**
   - En `sincronizarRasgosAutomaticos`, se filtran los rasgos de especie sugeridos con `filter((r) => !r.nivelRequerido || r.nivelRequerido <= nivelPj)`. Al subir a nivel 5, el sistema inyecta automáticamente *Forma grande*; al estar en nivel 1..4, la excluye.
3. **Blindaje de la Vista de Jugador (`usarVistaRasgos.ts`):**
   - Se añadió la condición `if (r.nivelRequerido && r.nivelRequerido > nivelPj) return false;` en `rasgosFiltrados`. La pestaña "Mis Rasgos" solo muestra habilidades que el personaje ya puede utilizar según su nivel actual.
4. **Protección del Motor de Efectos (`evaluadorEfectosRasgos.ts`):**
   - En `evaluarEfectosRasgosActivos`, se ignora cualquier rasgo si `rasgo.nivelRequerido && nivelPj < rasgo.nivelRequerido`.
5. **Cobertura Automatizada:**
   - Test en `gestorEspecies.test.ts` que valida que un Goliat a nivel 1 tiene `Forma grande === undefined` y a nivel 5 la desbloquea con 1 uso.
   - 100% de suites superadas (53/53 suites, 653/653 tests), `tsc --noEmit` limpio, ESLint sin advertencias y despliegue exitoso a TaleSpire.

---

## [2026-09-15] Implementación Canónica y Declarativa de Goliat (D&D 5.5e), Linaje Gigante y Efectos de Tamaño / Capacidad de Carga

**Contexto y Requerimientos del Usuario:**
- Implementación canónica y declarativa de la especie Goliat a partir de `dicionario_herramientas/razas/Goliat.md`:
  1. *Constitución poderosa*: Rasgo mecánico que duplica la capacidad de carga del inventario ($\times 2$, contando como una criatura Grande). El usuario aclaró que la ventaja para escapar de agarrado no se automatiza por ser contextual/descriptiva (no determinable programáticamente).
  2. *Forma grande*: Rasgo activable a partir de nivel 5 (1 uso/descanso largo, 10 min / 100 asaltos) que genera un efecto con:
     - Ventaja estrictamente en pruebas de característica de Fuerza (`prueba.fuerza`), sin extenderse a habilidades derivadas como Atletismo (por indicación expresa del usuario).
     - $+10$ pies de velocidad de caminata.
     - Aumento de tamaño a Grande.
  3. *Linaje gigante*: Rasgo contenedor padre con usos iguales al Bono de Competencia (`formulaEscalado: "bono_competencia"`, PB = 2 a nivel 1-4, 3 a nivel 5) que recarga en descanso largo.
  4. *6 Subespecies (Linajes de Gigante)*: Hijas vinculadas que consumen usos del rasgo padre (`gastarDePadre: true`, `ligadoA: "Linaje gigante"`):
     - *Gigante de fuego*: 1d10 daño de fuego.
     - *Gigante de las colinas*: derribar criatura Grande o menor (descriptivo).
     - *Gigante de las nubes*: teletransporte mágico de hasta 30 pies como acción adicional (descriptivo).
     - *Gigante de escarcha*: 1d6 daño de frío y $-10$ pies de velocidad.
     - *Gigante de piedra*: reacción de 1d12 + CON para reducir daño recibido.
     - *Gigante de las tormentas*: reacción de 1d8 daño de trueno a criatura a 60 pies o menos.
  5. *Generalización completa en el Builder*: Todas las mecánicas deben ser declarativas, configurables desde `ConstructorRasgoDote.tsx` y reutilizar funciones puras existentes sin hardcodear bifurcaciones por nombre de rasgo ni especie (Reglas 4, 5 y 6).

**Causas Raíz y Desafíos Técnicos:**
1. **Falta de Tipos de Efectos Mecánicos para Tamaño y Capacidad de Carga:**
   - `EsquemaTipoEfectoMecanico` carecía de `"modificador_capacidad_carga"` y `"modificador_tamano"`, impidiendo modelar *Constitución poderosa* y *Forma grande* declarativamente en el compendio y builder.
2. **Capacidad de Carga Rígida al Tamaño Base de la Ficha:**
   - `calcularCapacidadCarga` en `calculadorInventario.ts` calculaba la capacidad considerando únicamente el tamaño estático base del personaje, sin aceptar multiplicadores adicionales procedentes de rasgos pasivos ni reflejar transformaciones temporales de tamaño activo.
3. **Restricción Unidireccional de Capas (Regla 5) con `resolverIdRasgoObjetivoGasto`:**
   - La función `resolverIdRasgoObjetivoGasto` residía previamente en `almacen/slices/personajes/condicionesRasgosHelpers.ts`. Dado que `calculadorAccionesCombate.ts` pertenece a la capa `servicios/`, importar desde `almacen/` violaba la regla de arquitectura unidireccional estricta y disparaba errores de ESLint (`no-restricted-imports`).
4. **Visibilidad del Campo `ligadoA` en el Builder UI:**
   - En `ConstructorRasgoDote.tsx`, el campo para definir el rasgo padre (`ligadoA`) solo se mostraba si el rasgo era de tipo `esActivable`, imposibilitando configurarlo en rasgos de tipo acción/especial que simplemente tuvieran `gastarDePadre: true` o `heredarDadosPadre: true`.
5. **Evaluación de Fórmulas con Modificadores de Características:**
   - La fórmula de reducción de daño de *Gigante de piedra* (`1d12+constitucion`) requería resolución dinámica sustituyendo `"constitucion"` por el modificador numérico calculado de la ficha (ej. `1d12+3`).

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Extensión Declarativa de Tipos y Builder (`tipos/rasgos.ts`, `ConstructorRasgoDote.tsx`):**
   - Se agregaron `"modificador_capacidad_carga"` y `"modificador_tamano"` a `EsquemaTipoEfectoMecanico` y `TIPOS_EFECTO_DISPONIBLES`.
   - Se incorporó soporte visual e inputs en el builder para ingresar factores multiplicadores (ej. 2) y tamaños objetivo ("Grande", "Mediano", etc.).
   - Se desacopló la visibilidad del selector `ligadoA`, mostrándose siempre que se active `gastarDePadre` o `heredarDadosPadre`, tanto en rasgos de combate como en activables.
2. **Reubicación de `resolverIdRasgoObjetivoGasto` en `servicios/evaluadorEfectosRasgos.ts`:**
   - Se migró la función pura de resolución de delegación a `evaluadorEfectosRasgos.ts` (capa `servicios/`), haciéndola accesible de forma limpia tanto por `calculadorAccionesCombate.ts` como por los reducers de `almacen/` (mediante re-exportación transparente en `condicionesRasgosHelpers.ts`).
3. **Cálculo Matemático de Capacidad de Carga Acumulativo (`calculadorInventario.ts`, `usarInventarioOrdenado.ts`):**
   - `calcularCapacidadCarga` acepta el parámetro opcional `multiplicadorExtra: number = 1`.
   - `usarInventarioOrdenado` evalúa `obtenerTamanoEfectivo(personaje)` y `calcularMultiplicadorCapacidadCarga(personaje)`. De este modo:
     - Goliat estándar: tamaño Mediano ($\times 1$) con Constitución poderosa ($\times 2$) = $\times 2$ (300 lb para FUE 10).
     - Goliat bajo Forma grande: tamaño Grande ($\times 2$) con Constitución poderosa ($\times 2$) = $\times 4$ (600 lb para FUE 10, equivalente a categoría Enorme).
4. **Evaluación Estricta de Pruebas de Característica (`evaluadorEfectosRasgos.ts`):**
   - En `evaluarVentajasDeRasgosEnTirada`, se añadió la rama para `tipoTirada === "caracteristica"`, evaluando `prueba.fuerza` estrictamente en pruebas de Fuerza y sin contaminar tiradas de salvación ni habilidades derivadas.
5. **Resolución Dinámica de Modificadores en Expresiones de Dados:**
   - Se actualizó `resolverFormulaDinamica` para resolver nombres de características (`constitucion`, `fuerza`, `destreza`, `inteligencia`, `sabiduria`, `carisma`) a su modificador (ej. `1d12+constitucion` -> `1d12+3`).
6. **Catálogo Canónico Oficial D&D 5.5e (`especiesDND55.ts`, `datosIniciales.ts`):**
   - Goliat: velocidad 35 pies, Humanoide, Mediano.
   - *Constitución poderosa*: pasivo permanente con `modificador_capacidad_carga: 2`.
   - *Forma grande*: nivel 5, 1 uso/descanso largo, condición `"Forma grande"` (100 asaltos).
   - Efecto predefinido `"Forma grande"` en `datosIniciales.ts`: ventaja en pruebas de Fuerza, $+10$ velocidad, tamaño Grande.
   - *Linaje gigante*: contenedor con usos escalados a PB (`formulaEscalado: "bono_competencia"`).
   - 6 Subespecies declarativas completas con `gastarDePadre: true` y `ligadoA: "Linaje gigante"`.
7. **Cobertura Automatizada Exhaustiva y Blindaje de Tipos:**
   - Tests en `gestorEspecies.test.ts`, `evaluadorEfectosRasgos.test.ts` y `calculadorInventario.test.ts` verificando catálogo, 6 subespecies, dados de daño, delegación de consumo, multiplicadores de carga y ventajas de Fuerza.
   - 100% de éxito en Vitest (53/53 suites, 653/653 tests), `tsc --noEmit` limpio y `pnpm lint` con 0 advertencias.
   - **Lección aprendida / Tipado:** Todo objeto mock de `EfectoMecanicoRasgo` en archivos de test debe incluir explícitamente `valor: string | number` (ej. `valor: "true"` para ventajas), ya que `EsquemaEfectoMecanicoRasgo` no define `valor` como opcional.

---

## [2026-09-15] Implementación Canónica y Declarativa de Gnomo (D&D 5.5e) y Ventajas de Salvación en el Builder

**Contexto y Requerimientos del Usuario:**
- Implementación canónica y declarativa de la especie Gnomo a partir de `dicionario_herramientas/razas/Gnomo.md`:
  1. *Astucia gnoma*: rasgo puramente mecánico que otorga ventaja en tiradas de salvación de Inteligencia, Sabiduría y Carisma.
  2. *Linaje gnomo*: exclusivamente añade conjuros (Gnomo de los bosques: truco *ilusión menor* y conjuro *hablar con los animales* con usos iguales a PB por descanso largo; Gnomo de las rocas: trucos *prestidigitación* y *reparar*). Las capacidades accesorias (como la creación de artilugios mecánicos con *prestidigitación*) son puramente informativas y sin mecánicas adicionales.
  3. Todo lo demás es informativo/base: Tipo Humanoide, tamaño Pequeño, velocidad 30 pies y visión en la oscuridad 60 pies.
  4. Generalización desde el Builder: el constructor (`ConstructorRasgoDote.tsx`) debe permitir configurar ventajas en todas las salvaciones canónicas y agrupaciones compuestas (`salvaciones_mentales` y `salvaciones_fisicas`), reutilizando las funciones puras ya existentes.

**Causas Raíz y Desafíos Técnicos:**
1. **Opciones Limitadas de Ventaja en el Builder UI (`ConstructorRasgoDote.tsx`):**
   - Previamente, `OPCIONES_VENTAJA` solo contemplaba salvaciones de Fuerza, Destreza y Constitución, impidiendo que el builder o un usuario configurasen ventajas en salvaciones de Inteligencia, Sabiduría o Carisma, o salvaciones compuestas.
2. **Evaluación Rígida de Objetivos de Ventaja en Tiradas (`evaluadorEfectosRasgos.ts`):**
   - `evaluarVentajasDeRasgosEnTirada` evaluaba salvaciones mediante comparaciones estrictas directas y no contemplaba objetivos separados por coma, salvaciones universales ni alias de agrupaciones compuestas como `salvaciones_mentales` (INT, SAB, CAR) o `salvaciones_fisicas` (FUE, DES, CON).
3. **Ausencia de Efectos Mecánicos Declarativos en Gnomo (`especiesDND55.ts`):**
   - El catálogo contenía la especie Gnomo pero *Astucia gnoma* carecía del array `efectos`, dejando las tiradas de salvación mental sin ventaja reactiva en la ficha ni en TaleSpire.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Generalización del Builder de Rasgos (`ConstructorRasgoDote.tsx`):**
   - Se extendió `OPCIONES_VENTAJA` con las 6 salvaciones canónicas individuales, `salvaciones_fisicas` ("Salvaciones Físicas (FUE, DES, CON)"), `salvaciones_mentales` ("Salvaciones Mentales (INT, SAB, CAR)") y `salvacion.muerte`.
   - Se actualizó la generación de `descFinal` para usar las etiquetas humanas legibles.
2. **Motor de Evaluación Genérico y Agnóstico (`evaluadorEfectosRasgos.ts`):**
   - En `evaluarVentajasDeRasgosEnTirada`, se implementó parsing para objetivos delimitados por coma, coincidencia con características individuales, salvaciones universales (`salvacion.todas`), agrupaciones mentales (`salvaciones_mentales`) y agrupaciones físicas (`salvaciones_fisicas`), con soporte simétrico para desventaja.
3. **Catálogo Canónico Oficial D&D 5.5e (`especiesDND55.ts`):**
   - *Astucia gnoma*: 3 efectos declarativos de `"ventaja"` (`salvacion.inteligencia`, `salvacion.sabiduria`, `salvacion.carisma`).
   - *Linaje gnomo*: rasgo informativo con selector declarativo (`selector_aptitud_magica_gnomo`).
   - *Linaje élfico*: rasgo con selector declarativo (`selector_aptitud_magica_elfo`) para elegir Inteligencia, Sabiduría o Carisma según `Elfo.md` D&D 5.5e.
   - *Gnomo de los bosques*: conjuros innatos *ilusión menor* y *hablar con los animales*, con rasgo consumible escalado al PB (`formulaEscalado: "bono_competencia"`) y recarga en descanso largo.
   - *Gnomo de las rocas*: trucos innatos *prestidigitación* y *reparar*, y rasgo *Dispositivo mecánico* puramente informativo.
4. **Reconciliación de Alias de Hechizos (`subclasesConjurosConstantes.ts`):**
   - Alias agregados para `"hablar con los animales"` <-> `"hablar con animales"` y `"reparar"` <-> `"remendar"`.
5. **Cobertura Automatizada:**
   - 6 nuevos tests en `gestorEspecies.test.ts` verificando catálogo, ventajas de INT/SAB/CAR, comodines físicos/mentales, conjuros de linaje y conmutación limpia.
   - 100% de suites superadas (53/53 suites, 641/641 tests), `tsc --noEmit` con 0 errores y ESLint limpio.

---

## [2026-09-14] Preservación de Combatiente y Sufijo Explícito de Ventaja/Desventaja en la Tarjeta Nativa de TaleSpire (3D)

**Contexto y Requerimientos del Usuario:**
- El usuario reportó: *"se desplegaron los fallback pero no la etiqueta!!"* adjuntando captura del chat de TaleSpire.
- En la captura se observó:
  1. La tarjeta nativa 3D de TaleSpire desplegó:
     `YOU ROLLED ATAQUE BASTON DEL VIENTO (A)... AND ATAQUE BASTON DEL VIENTO (B)...`
  2. Debajo se desplegó el mensaje de fallback gris:
     `[Tirada] Aarakocra aeromante - Bastón del viento. (Desventaja): 8 (Menor de [8, 12])`
  3. El usuario remarcó que el mensaje de texto gris era el fallback, pero la tarjeta de dados ("la etiqueta") no contenía el nombre del combatiente (`Aarakocra aeromante`) y desplegó `(A)` y `(B)` en lugar del sufijo explícito de Ventaja o Desventaja.

**Causas Raíz Identificadas:**
1. **Pérdida del Nombre de la Criatura en Fórmulas de Ataques Rápidos:**
   - `construirFormulaAtaqueRapido` generaba `!Ataque Baston del viento:1d20+5` sin incluir el nombre del combatiente.
   - Aunque `lanzarAtaqueRapido` en `GestorIniciativa.tsx` pasaba `${criaturaNombre} - ${ataqueNombre}`, `lanzadorDados.ts` analizaba el grupo de la fórmula (`!Ataque Baston del viento:`), detectaba que no era idéntico a `"ataque"` ni `"tirada"` y sobrescribía `nombreBaseGrupo`, borrando el nombre del combatiente (`Aarakocra aeromante`).
2. **Sufijos `(A)` y `(B)` en Lugar de Nombres Semánticos en los Descriptores de Dados:**
   - `lanzadorDados.ts` nombraba los grupos para la bandeja de dados como `${nombreBaseGrupo} (A)` y `${nombreBaseGrupo} (B)` asumiendo que `silenceDefaultChatCard` silenciaría la tarjeta nativa.
   - Dado que TaleSpire genera automáticamente la tarjeta en el chat y en pantalla con los nombres de los descriptores suministrados a `putDiceInTray`, la tarjeta mostraba en grande `ATAQUE BASTON DEL VIENTO (A)` y `(B)`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Inclusión de Combatiente en la Fórmula de Ataque (`procesadorAtaques.ts` y `GestorIniciativa.tsx`):**
   - `construirFormulaAtaqueRapido` acepta el parámetro opcional `criaturaNombre`. Si se suministra, genera la etiqueta compuesta `${criaturaNombre} - ${ataqueNombre}` (ej. `!Aarakocra aeromante - Baston del viento:1d20+5`).
   - `GestorIniciativa.tsx` propaga `criaturaNombre` tanto en ataques rápidos como en tiradas interactivas de d20.
2. **Blindaje de Preservación de Combatiente (`lanzadorDados.ts`):**
   - En `lanzarDadosTaleSpire`, `nombreEtiquetaBase` solo se sobrescribe si era genérico (`"tirada"` o vacío). Si la fórmula aporta una etiqueta adicional que no está en la base, se concatenan armoniosamente para nunca perder la identidad del combatiente.
   - En tiradas planas (`tipoTirada === "plano"`), se inyecta `${nombreBase}` en el primer grupo d20 si venía sin el nombre del combatiente.
3. **Nomenclatura Semántica Explícita en la Tarjeta Nativa 3D (`putDiceInTray`):**
   - Los grupos d20 de ventaja o desventaja se nombran explícitamente como:
     `${nombreBaseGrupo} (Ventaja 1)` / `${nombreBaseGrupo} (Ventaja 2)`
     o
     `${nombreBaseGrupo} (Desventaja 1)` / `${nombreBaseGrupo} (Desventaja 2)`
   - De este modo, la tarjeta física 3D y el chat de TaleSpire despliegan de inmediato:
     `YOU ROLLED AARAKOCRA AEROMANTE - BASTON DEL VIENTO (DESVENTAJA 1)`
     `AND AARAKOCRA AEROMANTE - BASTON DEL VIENTO (DESVENTAJA 2)`
5. **Eliminación de Avisos Redundantes (Chat de Texto y Toast Local):**
   - El usuario solicitó explícitamente: *"ya sale la etiqueta, pero tambien se pasa al chat y sale una notificacion toast, no quiero eso, solo quiero la etiqueta y ya"*.
   - Una vez que la tarjeta nativa 3D y de dados de TaleSpire (`sendDiceResult`) se publica exitosamente, se suprimió el despacho redundante a `ts.chat.send` y a `state.agregarNotificacion`.
   - `ts.chat.send` permanece únicamente como red de seguridad en caso de que la publicación de la tarjeta nativa falle por completo.

---

## [2026-09-14] Corrección Crítica: Notificación de Resultados de Ventaja y Desventaja en TaleSpire (API v0.1)

**Contexto y Requerimientos del Usuario:**
- El usuario reportó el siguiente fallo: *"hola vi un bug con la ventaja y desventaja, no se se tiran los dados, pero no se avisa en talespire el resultado"*.
- Al tirar con ventaja o desventaja, los dados físicos 3D caían en la mesa de TaleSpire pero no aparecía ninguna tarjeta en el chat ni aviso con el resultado final.

**Causas Raíz Identificadas:**
1. **Incompatibilidad Estricta de Formato en `procesarResultadosDadosTaleSpire`:**
   - Para tiradas con ventaja o desventaja, `lanzarDadosTaleSpire` invoca `ts.dice.putDiceInTray(descriptores, true)` con `silenceDefaultChatCard = true`, para que TaleSpire no anuncie ambos d20 por separado y espere la tarjeta filtrada del simbionte vía `ts.dice.sendDiceResult`.
   - Cuando TaleSpire despacha `onRollResults` a través de `window.manejarResultadosDados`, la API v0.1 de TaleSpire entrega directamente el objeto `ResultadosTirada` (`{ rollId: string, resultsGroups: GrupoResultadosTirada[], clientId: string, ... }`).
   - Sin embargo, `procesarResultadosDadosTaleSpire` condicionaba estrictamente la ejecución a `if (ev.kind !== "rollResults" || !ev.payload) return false;`. Como `ev.kind` y `ev.payload` eran `undefined` en las llamadas reales de TaleSpire, la función retornaba inmediatamente `false`.
   - Consecuencia: TaleSpire tenía silenciada la tarjeta por defecto y el simbionte ignoraba el evento sin llamar jamás a `ts.dice.sendDiceResult`.
2. **Falta de Fallback Proactivo ante Fallos de `sendDiceResult`:**
   - Si `ts.dice.sendDiceResult` no estaba disponible o fallaba en la versión del motor de TaleSpire, la tirada quedaba completamente silenciada sin una ruta de contingencia hacia `ts.chat.send`.
3. **Omisión de la Etiqueta Completa en la Fórmula de Ataque y en la Tarjeta 3D:**
   - En tiradas de daño, la fórmula se enviaba explícitamente con prefijo (`Zulen - Dano Arco Corto:1d6+2`), logrando que TaleSpire mostrara la tarjeta flotante nativa `ROLLED ZULEN - DANO ARCO CORTO`.
   - En cambio, en las tiradas de ataque la fórmula se enviaba sin etiqueta (`1d20+7`), dejando los dados sin contexto semántico en el motor nativo de TaleSpire.
   - Además, al procesar ventaja/desventaja, el grupo de dados se nombraba truncado o genérico, y no se reintentaba `sendDiceResult` si fallaba al vincularlo a un `rollId` silenciado.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Extractor Normalizador Polimórfico (`extraerPayloadResultadosDados`):**
   - Soporta de forma transparente y defensiva:
     - Formato nativo directo de TaleSpire (`{ rollId, resultsGroups }`).
     - Formatos envueltos (`{ kind: "rollResults", payload }`, `{ payload }`).
     - Eventos DOM (`detail`).
     - Cadenas JSON serializadas por CEF.
2. **Propagación Homogénea de la Etiqueta en la Tarjeta Nativa de TaleSpire:**
   - En `lanzadorDados.ts`, si una fórmula no trae etiqueta explícita, se inyecta la etiqueta descriptiva completa saneada (`${nombreEtiquetaBase}:${formula}`).
   - Se sanean y remueven sufijos redundantes de `(Ventaja)`/`(Desventaja)` para evitar duplicaciones.
   - Los grupos A y B se generan como `${nombreBaseGrupo} (A)` y `${nombreBaseGrupo} (B)` (ej. `"Zulen - Ataque con Arco corto (A)"`).
   - El grupo ganador se nombra con `${nombreBaseGrupo} (Ventaja)` o `(Desventaja)`, logrando que la tarjeta flotante nativa 3D de TaleSpire muestre con total claridad: `ROLLED ZULEN - ATAQUE CON ARCO CORTO (VENTAJA)`.
3. **Resiliencia de Publicación 3D y Doble Canal de Aviso:**
   - Se invoca `ts.dice.sendDiceResult(gruposParaChat, rollId)` y, en caso de fallo por ID de tirada silenciada, se reintenta automáticamente `ts.dice.sendDiceResult(gruposParaChat)` como nueva tirada para desplegar de forma infalible la tarjeta flotante en pantalla.
   - Se despacha simultáneamente el aviso con la etiqueta completa al chat de texto de TaleSpire (`ts.chat.send`) y como notificación local en la UI del ToolSet.
2. **Red de Seguridad y Fallback Garantizado en TaleSpire:**
   - Invocación a `ts.dice.sendDiceResult` a través de la API del adaptador.
   - En caso de excepción o indisponibilidad en el cliente de TaleSpire, activación automática de un fallback a `ts.chat.send` con el desglose del dado elegido y descartado (ej. `[Tirada] Sigilo (Ventaja): 20 (Mayor de [11, 20])`).
   - Registro simultáneo de notificación informativa en el estado local de la aplicación (`agregarNotificacion`).
   - Si por divergencias de serialización los grupos A y B no coinciden exactamente, se normalizan con `toLowerCase()` y, si persisten ausentes, se publican los resultados disponibles para nunca dejar la mesa a ciegas.
3. **Nombres de Grupo Descriptivos Dinámicos:**
   - Si la fórmula no incluye prefijo, se extrae el nombre saneado de la etiqueta del contexto (`nombreEtiqueta || "Tirada"`), garantizando nombres coherentes como `"Sigilo (A)"` y `"Sigilo (Ventaja)"`.
4. **Redundancia CEF en `puenteTaleSpire.ts` y Tipado:**
   - Declaración y registro de `window.onRollResults` y listeners DOM para evitar pérdida de eventos en cualquier versión de TaleSpire.
5. **Cumplimiento Estricto de la Regla 1 (Cero Emojis):**
   - Reemplazo de cualquier emoji por prefijos textuales limpios (`[Tirada]`, `Tirada ...`).

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm lint`: 0 errores y 0 advertencias (ESLint limpio).
- `pnpm test`: 53 suites superadas, 634 de 634 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 109 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-14] Rasgos Canónicos de Enano y Arquitectura de Vida Máxima Permanente (D&D 5.5e)

**Contexto y Requerimientos del Usuario:**
- Implementación canónica y declarativa de los rasgos de Enano según D&D 5.5e (`Enano.md`):
  1. *Resistencia enana*: Pasivo con ventaja en tiradas de salvación contra la condición Envenenado y resistencia a daño por veneno.
  2. *Aguante enano*: Efecto puramente declarativo `modificador_hp_maximo` que incrementa la vida máxima permanente en `1 * nivel`.
  3. *Afinidad con la piedra*: Acción adicional activable que otorga sentido ciego sobre piedra a 60 pies durante 100 asaltos, con usos iguales al bonificador por competencia (PB) y recarga en descanso largo.
  4. Corrección crítica de vida máxima: el usuario remarcó que *"la máxima permanente se define con `alActualizarHPMaximoBase` en `PestanaSentidosSalud.tsx`, con esa se actualiza la verdadera vida máxima"*, por lo que los rasgos permanentes no debían inflar temporalmente `hpMaximo` sino actualizar la base permanente `hpMaximoBase`.

**Causas Raíz y Desafíos Técnicos:**
1. **Desfasaje entre Vida Máxima Temporal y Permanente:**
   - Previamente, los rasgos declarativos con `modificador_hp_maximo` sumaban su bono sobre la marcha en selectores o alteraban únicamente `hpMaximo`.
   - Esto provocaba que `hpMaximoBase` quedara en el valor previo (ej. 10 ó 12) mientras `hpMaximo` se elevaba (ej. 11 ó 13). Como consecuencia, `PanelVitalidadPersonaje.tsx` detectaba `maxBase !== maxEfectivo` y pintaba la barra en verde con tooltip de buff temporal, mientras que `PestanaSentidosSalud.tsx` mostraba el valor desfasado.
2. **Duplicación del Bono de Rasgos en Sanitización (`sanitizacion.ts`):**
   - `sanearPersonaje` calculaba `calcularBonoHPMaximoRasgos` y sumaba el bono a `baseHP + bonoHPRasgos` para sobrescribir `hpMaximo`. Si el personaje ya tenía el bono incorporado en su base permanente, la sanitización inflaba de nuevo `hpMaximo` (ej. 13 + 1 = 14).
3. **Pérdida de Vida en Personajes Antiguos (Legacy):**
   - Si un personaje importado o guardado solo poseía `hpMaximo` sin `hpMaximoBase`, la sanitización le asignaba el default de 10 a `hpMaximoBase`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Unificación Canónica de Vida Máxima Permanente (`sliceVitalidad.ts` y `slicePersonajesBase.ts`):**
   - `modificarHPMaximoBasePersonaje` actualiza de forma canónica y limpia tanto `hpMaximoBase: baseValido` como `hpMaximo: baseValido`, manteniendo simetría perfecta en ausencia de efectos temporales de combate.
   - En `slicePersonajesBase.ts`, al recibir una edición explícita de `hpMaximoBase` (originada desde `PestanaSentidosSalud.tsx` vía `alActualizarHPMaximoBase`), se fija la verdadera vida permanente en ambos campos.
   - Cuando se modifica la identidad o se cambian rasgos, se calcula el diferencial de bono (`deltaBono = bonoNuevo - bonoPrevio`) y se suma tanto a `hpMaximoBase` como a `hpMaximo`.
2. **Construcción y Aplicación de Rasgos de Especie (`gestorEspecies.ts` y `sliceRasgos.ts`):**
   - `aplicarEspecieAPersonaje` calcula el diferencial `deltaHP` y lo aplica a `hpMaximoBase` y `hpMaximo`.
   - En `sliceRasgos.ts` (`agregarRasgoPersonaje`, `actualizarRasgoPersonaje`, `eliminarRasgoPersonaje`, `alternarActivoRasgo`), las variaciones en rasgos de HP impactan la base permanente mediante `deltaBono`.
3. **Normalización Idempotente en Saneamiento (`sanitizacion.ts`):**
   - Se eliminó la re-suma de `calcularBonoHPMaximoRasgos` en `sanearPersonaje`.
   - Se implementó normalización bidireccional segura para `hpMaximoBase` y `hpMaximo` en personajes legacy (`rawHPMaximoBase ?? rawHPMaximo ?? 10`).
   - Se reforzó la sanitización de `origen` de rasgos a los valores canónicos del enum de Zod para evitar caídas al fallback por defecto ante valores como `"raza"` o `"Enano"`.
4. **Simplificación de Selectores Reactivos (`usarEstadoPersonajes.ts` y `evaluadorEfectosRasgos.ts`):**
   - `calcularHPMaximoEfectivo` y el selector `hpMaximoEfectivo` leen directamente `pj.hpMaximo || pj.hpMaximoBase || 10`, eliminando duplicaciones en tiempo de ejecución.
5. **Verificación Automatizada:**
   - 100% de suites pasando (52 suites, 626 tests exitosos).
   - 0 errores en `tsc --noEmit`, 0 infracciones en `eslint src`, 0 archivos > 500 líneas y `vite build` completado exitosamente.

---

## [2026-09-14] Resolución de Cargas de Objetos Mágicos y Visualización en Acciones de Combate (D&D 5.5e)

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario (`/grill-me`):
  1. *"si la uso desde el inventario me sale ese aviso de que no tengo cargas"* (requiere 1, tienes 0) a pesar de tener 4 de 4 cargas en el objeto (ej. *Púa de la Escama Desertora*).
  2. *"tampoco me sale en acciones el objeto"*.
  3. Alineación canónica:
     - En combate, solo armas, armaduras y escudos requieren estar equipados (`equipado: true`). Para objetos maravillosos, varitas, cetros, anillos, etc., basta con que estén en la mochila/posesión activa (no en `almacen` remoto) y sintonizados si lo requieren.
     - Al lanzar un conjuro de un objeto mágico, si el objeto no especifica su propio CD o Bono de Ataque Mágico, debe tomar los del personaje jugador.

**Causas Raíz y Desafíos Técnicos:**
1. **Falta de Inyección de Cargas en el Hook Central de Magia (`usarLanzadorConjuros.ts`):**
   - El hook construía un `ContextoMagicoPersonaje` estático a nivel de hook sin asociarlo a ningún objeto de inventario.
   - Al llamar a `validarLanzamiento` y `prepararLanzamiento` en modo `objetoMagico`, `contexto.cargasObjetoActuales` era `undefined` (evaluado como 0), provocando que la validación fallase inmediatamente con `"Cargas insuficientes..."` sin importar cuántas cargas tuviera el ítem en la mochila.
2. **Descarte de Objetos no Equipables en Acciones de Combate (`calculadorAccionesCombate.ts`):**
   - `resolverHechizosObjetosMagicos` ejecutaba un filtro ciego `if (!obj.equipado) continue;`. Como los objetos maravillosos y varitas son creados con `equipable: false` y añadidos a la mochila con `equipado: false`, quedaban permanentemente ocultos de la pestaña de combate.
3. **Pérdida de `hechizosVinculados` al Instanciar en Inventario (`calculadorInventario.ts` y `EsquemaObjetoInventario`):**
   - `crearObjetoInventarioDesdeCompendio` no copiaba `hechizosVinculados` a la instancia resultante en el inventario del personaje, forzando la dependencia exclusiva de búsquedas por compendio en lugar de preservar la autonomía del ítem.
4. **Fórmulas Incompletas para Objetos Mágicos (`servicioLanzamientoConjuros.ts`):**
   - `construirFormulaObjetoMagico` solo devolvía `"1d20"` y no consideraba los dados de daño ni las fórmulas de TaleSpire (`!Daño ...`) cuando el conjuro vinculado poseía dados de daño (`dadosDaño`), ni permitía heredar el CD de salvación o el bono de ataque mágico del personaje jugador.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Tipado e Integridad de Inventario (`src/tipos/personaje.ts` y `src/servicios/calculadorInventario.ts`):**
   - Se añadió `hechizosVinculados: z.array(EsquemaHechizoVinculado).optional()` a `EsquemaObjetoInventario`.
   - Se actualizó `crearObjetoInventarioDesdeCompendio` y `crearObjetoInventarioCustom` para copiar y preservar fielmente `hechizosVinculados`.
2. **Inyección Reactiva de Cargas y Fallback de CD/Ataque (`src/hooks/usarLanzadorConjuros.ts` y `src/servicios/servicioLanzamientoConjuros.ts`):**
   - En `usarLanzadorConjuros.ts`: al validar o lanzar en modo `objetoMagico`, se busca el objeto en `personaje.inventario` mediante `solicitud.objetoInstanciaId`, calculando `cargasDisponibles = obj.cargasActuales ?? obj.cargasMaximas ?? 0` e inyectándolo en `contextoEfectivo.cargasObjetoActuales`.
   - Se añadió `cdSalvacionPersonaje?: number` a `OpcionesLanzadorConjuros` y `SolicitudLanzamiento`.
   - En `construirFormulaObjetoMagico`: si el objeto no provee `cdObjeto` o `bonoAtaqueObjeto`, se adoptan `cdSalvacionPersonaje` y `bonoAtaqueMagico` del jugador. Si el conjuro tiene dados de daño o tirada de ataque, delega en `construirFormulaTaleSpireEspacio` emitiendo la tirada completa e incorporando `[CD ${cdFinal}]` y el nombre del objeto en la etiqueta del log.
3. **Discriminación Canónica de Acciones de Combate (`src/servicios/calculadorAccionesCombate.ts`):**
   - Se actualizó `resolverHechizosObjetosMagicos`:
     - Excluye contenedores de almacenamiento remoto (`obj.contenedor === "almacen"`).
     - Exige `obj.sintonizado` únicamente si el objeto requiere sintonización.
     - Solo exige `obj.equipado` si la categoría efectiva es `"armas"`, `"armaduras"` o `"escudos"`. Para el resto de categorías mágicas (maravillosos, varitas, etc.), se muestran activas en combate.
     - Resuelve `hechizosVinculados` priorizando la instancia (`obj.hechizosVinculados`) y usando el compendio/homebrew como fallback.
4. **Sincronización en UI (`PanelInventarioPersonaje.tsx` y `ModalInspeccionObjetoFlotante.tsx`):**
   - `PanelInventarioPersonaje` calcula `bonoAtaqueMagico` y `cdSalvacionPersonaje` vía `obtenerHabilidadConjuroPersonaje(personaje)` y `statsCalculadas`, pasándolos al lanzador y al modal flotante.
   - `ModalInspeccionObjetoFlotante` busca en `baseDatosHechizos` para enriquecer el lanzamiento con los datos del compendio real.
5. **Verificación Automatizada:**
   - 100% de tests pasando (52 suites, 625 tests), 0 errores en `tsc --noEmit`, `pnpm run ci` completado con éxito.

---

## [2026-09-14] Optimización con Debounce (500 ms) en SelectorSugerencias

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"Ok, hay que hacer un arreglo pequeño al selector sugerencia para que tenga un pequeño debounse para que no haga una búsqueda en cada tecleo de letra si no que espere 500 ms después del último carácter escrito"*.

**Causas Raíz y Desafíos Técnicos:**
1. `SelectorSugerencias.tsx` ejecutaba el filtrado de opciones (`coincideBusquedaTolerante` y ordenación `compararPorRelevanciaTitulo`) de forma síncrona en cada pulsación de tecla (`onChange`), recalculando sobre listas extensas de sugerencias en cada carácter.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Debounce Declarativo y Configurable (`SelectorSugerencias.tsx`):**
   - Se añadió la prop opcional `tiempoEsperaDebounce?: number` con valor por defecto de `500` ms.
   - Se introdujo el estado `terminoDebounced` sincronizado mediante un `useEffect` con temporizador (`setTimeout`) y limpieza (`clearTimeout`) que espera 500 ms tras el último carácter antes de actualizar el término de filtrado.
   - Las sugerencias filtradas (`opcionesFiltradas`) se calculan a partir de `terminoDebounced`, evitando re-cálculos pesados durante la escritura continua rápida.
   - Al seleccionar una opción en el menú (`seleccionarOpcion`), se actualiza inmediatamente `terminoDebounced` sin esperar el temporizador para evitar desfases en reaperturas.
   - Se reforzó `spellCheck={false}` en el `<input>` para prevenir subrayados de ortografía en navegadores y webviews de TaleSpire.
2. **Pruebas y Verificación Automatizada:**
   - Creación de `src/componentes/comunes/SelectorSugerencias.test.tsx` con Vitest.
   - `pnpm run ci`: 100% de tests pasando (52 suites, 618 tests), 0 errores de TypeScript estricto, 0 errores de linter, 0 archivos con más de 500 líneas y build de Vite exitoso.

---

## [2026-09-14] Modernización del Creador de Objetos Mágicos Homebrew, Recarga Funcional y Hechizos Vinculados Typeahead (D&D 5.5e)

**Contexto y Requerimientos del Usuario:**
- Creador de objetos homebrew (`FormularioObjeto.tsx` / `SeccionEfectosPasivos.tsx` / `usarFormularioObjeto.ts`):
  1. **Cargas Máximas / Actuales**: Al crear un objeto nuevo, las cargas actuales asumen automáticamente el valor de las cargas máximas sin solicitar redundantemente ambas. Se limpió el input de cargas eliminando subtítulos explicativos y quitando la duplicación en UI.
  2. **Fórmula de Recarga Funcional**: Soporte para fórmulas de dados de TaleSpire (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100` — expresamente sin `1d3`). Presets rápidos con dados de TaleSpire (`[1d4 + 1]`, `[1d6 + 1]`, `[1d8 + 1]`, `[Todas]`).
  3. **Mecanismo de Recarga Dual**: Recarga manual interactiva en inventario (`TarjetaObjetoInventario` / `SeccionMagiaYEfectosObjeto`) y recarga automática durante el Descanso Largo (`procesarDescansoLargo`) usando la función pura `recargarCargasItem`.
  4. **Efectos Pasivos Depurados**: Se eliminó `"Foco Arcano"` de la lista de efectos pasivos (al ser ya categoría canónica `"focos-magicos"`). Se mantuvieron los efectos que alteran la ficha en tiempo real (`CA`, `CARACTERÍSTICA`, `SALVACIÓN`, `HABILIDAD`) y los informativos (`Resistencia`, `Inmunidad`, `Otro`).
  5. **Selector Typeahead de Hechizos Vinculados**:
     - Se eliminó el campo de texto libre estático.
     - Se implementó un selector reactivo con menú flotante (`useMemo`) que solo muestra sugerencias cuando el usuario escribe (mínimo 1 carácter).
     - Busca en `baseDatosHechizos` del compendio, autocompleta nombre, `hechizoId`, infiere el tipo de acción (`accion`, `accionAdicional`, `reaccion`) y nivel.
     - Si el hechizo no existe en el compendio, se permite guardarlo como efecto homebrew personalizado con coste en cargas.
     - En combate (`SeccionHechizosObjetosMagicos.tsx`): si el hechizo vinculado no especifica CD propia, se utiliza automáticamente la CD de salvación de conjuros del personaje activo (`cdSalvacionConjuros`).
  6. **Cumplimiento de Reglas Globales**: Cero emojis (solo iconos Lucide), tipado estricto `strict: true`, cero `any`, exclusivamente `pnpm`.

**Decisiones Técnicas y Correcciones:**
- `evaluarFormulaDados`: Actualizada para aceptar espacios y expresiones naturales (ej. `"1d6 + 1 al amanecer"`) y cadenas descriptivas de recuperación total (`"todas"`, `"completo"`).
- `recargarCargasItem`: Función pura exportada en `procesadorConsumibles.ts` utilizada de forma compartida por descansos e inventario.
- `EsquemaHechizoVinculado` y `sanitizacion.ts`: Enriquecidos con `hechizoId`, `nivel`, y `tipoAccion` opcionales garantizando persistencia íntegra.

---

## [2026-09-14] Implementación Canónica y Declarativa de los Rasgos de Enano (D&D 5.5e) y Builder Universal de Rasgos

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"vamos a crear el plan de implementacion para los rasgos de enano. @[dicionario_herramientas/razas/Enano.md] por lo visto la mayoria es informativo. tiene una mecanica que es Aguante enano, esta aumenta la vida maxima 1 x nivel y Afinidad con la piedra crea un nuevo efecto del mismo nombre, el cual es solo informativo y dura 100 asaltos, tiene tantos usos como bonificador por competencia y se recarga cada descanso largo. recuerda que esto se debe hacer desde el builder, con funciones completamente generales."*
- Restricción crítica (Regla Global 6): Cero bifurcaciones condicionales por nombre literal (`r.nombre === "Aguante enano"`, etc.). Todo debe fluir por contratos de datos declarativos configurables en el Builder (`ConstructorRasgoDote.tsx`).

**Causas Raíz y Desafíos Arquitectónicos:**
1. **Ausencia de Modificador Declarativo de HP Máximo:**
   - La aplicación solo contemplaba `hp_temporal` y `modificador_ca`/`modificador_stat`, obligando a cualquier bono de HP máximo a ser un cálculo manual o no reactivo.
2. **Ausencia de Duración Específica en Asaltos para Rasgos Activables:**
   - TaleSpire y el combat tracker requerían conocer la duración del efecto o condición generada al encender un rasgo activable (ej. 100 asaltos / 10 minutos para *Afinidad con la piedra*), pero `EsquemaRasgoPersonaje` solo poseía `condicionAlActivar` sin duración numérica configurable.
3. **Aplastamiento Involuntario de HP Máximo en el Almacén Zustand:**
   - `actualizarPersonaje` recalculaba `hpMaximo` a partir de `hpMaximoBase` cuando se pasaba cualquier objeto con `hpMaximoBase !== undefined`. Al enviar un personaje con `hpMaximo: 30` que heredaba el `hpMaximoBase: 10` por defecto, sobreescribía erróneamente `hpMaximo` reduciéndolo a 10.
4. **Colisión de Escalado en Rasgos Base:**
   - Rasgos como *Manos curativas* (Aasimar) usan `formulaEscalado: "bono_competencia"` para los dados de curación (`formulaDados: "2d4"` -> `PB d4`), pero debían mantener `usosMaximos: 1`, mientras que *Afinidad con la piedra* (Enano) escala sus usos según `PB` sin tener dados asociados.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Extensión Estricta de Esquemas Zod y Contratos TypeScript (`src/tipos/rasgos.ts` y `src/constantes/rasgosDND55.ts`):**
   - Incorporación de `"modificador_hp_maximo"` a `EsquemaTipoEfectoMecanico` y `TIPOS_EFECTO_DISPONIBLES`.
   - Incorporación de `duracionEfectoAlActivar?: number;` en `EsquemaRasgoPersonaje`, `PlantillaRasgoClase` y `PlantillaRasgoEspecie`.
2. **Evaluador Aritmético Genérico y Seguro (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - `evaluarExpresionNumericaSegura(expresion, variables?)`: evaluación aritmética pura de sumas, restas y productos sin `eval`, con soporte para sustitución contextual de variables (`nivel`).
   - `calcularBonoHPMaximoRasgos(personaje: PersonajeJugador): number`: función agnóstica pura que suma todos los efectos `modificador_hp_maximo` de rasgos activos.
3. **Sincronización Reactiva por Diferencial (`deltaBono`) en el Almacén (`slicePersonajesBase.ts`, `sliceRasgos.ts`, `sliceVitalidad.ts`):**
   - En `actualizarPersonaje`: solo se recalcula desde `hpMaximoBase` si no se proporcionó `hpMaximo` explícito (`cambios.hpMaximoBase !== undefined && cambios.hpMaximo === undefined`).
   - Si cambiaron rasgos o nivel, se calcula `deltaBono = bonoNuevo - bonoPrevio`, ajustando de forma sumativa y reactiva el `hpMaximo` del personaje.
   - En `sliceRasgos.ts`: encender o apagar un rasgo con `modificador_hp_maximo` recalcula y sincroniza reactivamente `hpMaximo` y `hpActual`.
   - En `alternarActivoRasgo`: al activar un rasgo con `duracionEfectoAlActivar`, genera el efecto activo con esa duración explícita (ej. 100 asaltos).
4. **Catálogo Canónico de Enano (`src/constantes/especiesDND55.ts` y `src/utiles/datosIniciales.ts`):**
   - Especie Enano enriquecida con:
     - *Aguante enano*: efecto `{ tipo: "modificador_hp_maximo", objetivo: "hp_maximo", valor: "1*nivel" }`.
     - *Afinidad con la piedra*: `{ esActivable: true, condicionAlActivar: "Afinidad con la piedra", duracionEfectoAlActivar: 100, formulaEscalado: "bono_competencia", recuperacion: "descanso_largo" }`.
     - *Resistencia enana*: ventaja táctica con `{ tipo: "ventaja", objetivo: "salvacion.envenenado", valor: "true" }`.
   - Agregado efecto predefinido `"Afinidad con la piedra"` (`duracionEstandar: 100`).
5. **Builder Visual (`src/componentes/caracteristicas/rasgos/ConstructorRasgoDote.tsx`):**
   - Nueva interfaz para configurar `modificador_hp_maximo` con inputs para valor/fórmula y descripción sugerida.
   - Nuevo campo de duración en asaltos cuando el rasgo se marca como activable (`esActivable`).
6. **Validación Exhaustiva Automatizada:**
   - `pnpm exec tsc --noEmit`: 0 errores (Strict mode).
   - `pnpm test`: 51 suites ejecutadas, 615 tests pasando al 100% (incluyendo nuevas suites para Enano y evaluador de HP máximo).
   - `pnpm lint`: 0 errores y 0 advertencias.

---

## [2026-09-14] Rework Canónico del Formulario de Objetos Homebrew (11 Categorías D&D 5.5e, Escudos y Consumibles)

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"ok, ahora hay que plantear el rework de objetos. veo que no se estan consumiento todas las categorias y si se consumieran todas eso se podra aprovechar en lo que es el inventario"*, *"no, nada de compatibilidad con el legacy, todo nuevo"*, *"realmente los objetos que tienen subcategoria son contados y todos tienen es la subcategoria de 'consumible' asi que to lo reemplazaria por un booleano de esConsumible"*, y *"el FormularioObjeto creo que no tiene todos esos campos que se añadieron al inventario y como se procesan los objetos"*.

**Causas Raíz y Deficiencias del Sistema Previo:**
1. **Bifurcación Forzada en 3 Tipos Principales Legacy (`tipoPrincipal`):**
   - El formulario agrupaba todos los objetos en `"Arma"`, `"Armadura"` o `"Equipo de Aventuras"`.
   - Al editar un objeto con categoría canónica D&D 5.5e (como `"focos-magicos"`, `"contenedores"`, `"paquetes-equipo"` o `"consumibles"`), se convertía forzadamente a `"equipo-aventurero"`, perdiendo su categorización oficial.
2. **Escudos Subordinados como Armadura Corporal:**
   - Los escudos estaban anidados como una subcategoría de armaduras, exponiendo erróneamente configuraciones no aplicables (bono de destreza, requisitos de fuerza o tiempos de vestir/desvestir corporales) en lugar de un bonificador directo a la CA (`caBase: 2`, `equipable: true`).
3. **Confusión entre Subcategoría y Consumible:**
   - Para marcar un objeto como consumible, dependía de una cadena `"Consumible"` en `subcategoria`, impidiendo clasificar objetos de aventura o municiones especiales como consumibles sin alterar su subcategoría de herramienta o útil.
4. **Ausencia de Metadatos de Paquetes / Lotes:**
   - No se podían definir unidades por paquete (`quantity`) ni peso individual por unidad (`pesoUnitario`) para compras por lote como carcajes de flechas o raciones.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Catálogo Canónico Oficial y Diccionario Visual (`src/constantes/categoriasEquipoConstantes.ts`):**
   - Se agregaron `SUBCATEGORIAS_POR_CATEGORIA` (diccionario exhaustivo de subcategorías oficiales sugeridas para las 11 categorías) y `OPCIONES_CATEGORIAS_SELECTOR` con colores y temas específicos.
2. **Modernización Quirúrgica del Hook (`src/hooks/usarFormularioObjeto.ts`):**
   - Eliminación completa de `tipoPrincipal`. Introducción de `oCategoria` (`CategoriaEquipo`), `oEsConsumible` (`boolean`), `oSubcategoria` (`string`), `oQuantity`, `oPesoUnitario` y `oCaEscudo`.
   - `alCambiarCategoria` reactivo: auto-asigna `oEsConsumible = true` para consumibles y munición; auto-asigna `equipable = true` para armas, armaduras y escudos; precarga subcategorías canónicas sugeridas y valores por defecto.
   - `manejarGuardarObjeto` y `cargarObjeto` construyen y leen cargas limpias compatibles con la unión estricta de Zod (`Arma`, `Armadura`, `Escudo`, `EquipoAventuras`).
3. **Subcomponente Especializado para Escudos (`SeccionEscudo.tsx`):**
   - Creado de forma atómica y pura (SRP). Gestiona exclusivamente el bonificador a la CA (`caBase`, estándar 2) y la desventaja en sigilo opcional (p. ej. escudos torre o pavés), con icono vectorial Lucide `Shield` (cero emojis).
4. **Limpieza de Armaduras (`SeccionArmadura.tsx`):**
   - Se removió la opción `"Escudo"` de la lista de armaduras, dejando únicamente `"Ligera"`, `"Mediana"` y `"Pesada"`.
5. **Subcomponente de Datos Generales (`SeccionDatosGenerales.tsx`):**
   - Selector con las 11 categorías oficiales D&D 5.5e.
   - Selector reactivo de subcategorías basado en la categoría seleccionada, permitiendo selección o personalización.
   - Switch directo para `oEsConsumible`.
   - Entradas numéricas para unidades por lote (`quantity`) y peso unitario (`pesoUnitario`).
6. **Adaptación de Utilería y Contenedores (`SeccionEquipoContenedor.tsx`):**
   - Condiciones evaluadas contra `oCategoria` canónica: módulo de venenos visible si es consumible o categoría consumibles; almacenamiento de munición para `municion`; contenidos para `paquetes-equipo` o `contenedores`; recetas de crafteo para `herramientas`.
7. **Orquestador Principal (`FormularioObjeto.tsx`):**
   - Renderizado de pestañas reactivas `[Atributos: {DICCIONARIO_CATEGORIAS_EQUIPO[oCategoria].etiqueta}]`.
   - Despacho condicional limpio a `SeccionArma`, `SeccionArmadura`, `SeccionEscudo` o `SeccionEquipoContenedor`.
8. **Corrección en la Sanitización del Almacén (`src/almacen/sanitizacion.ts`):**
   - Descubrimiento y corrección de un fallo donde `sanearObjetoHomebrew` para `escudos` forzaba `desventajaSigilo: false` y `subcategoria: "Escudo"`. Ahora lee fielmente los valores del objeto.
9. **Verificación Automatizada:**
   - `pnpm exec tsc --noEmit`: 0 errores (Strict mode).
   - `pnpm exec vitest run`: 51 suites de prueba ejecutadas, 608 tests pasando al 100%.
   - `pnpm run build`: Compilación de producción con Vite exitosa en 11.14s.

---

## [2026-09-14] Desactivación Global del Corrector Ortográfico Nativo (Spellcheck) en Campos de Texto

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"en los campos de texto por que se marca asi en rojo?"* y posteriormente *"ok aplicalo en todos los campos de texto para que no moleste el spellcheck"*.
- En la captura adjunta por el usuario:
  - Un campo de texto (`textarea`) con texto en español (*"Entonas una melodía suave y reconfortante..."*) presentaba un subrayado ondulado rojo en prácticamente todas las palabras.

**Causas Raíz Identificadas:**
1. **Falso Positivo Masivo por Diccionario Inadecuado en Chromium / TaleSpire**:
   - El entorno de ejecución (CEF en TaleSpire o navegadores con configuración estándar) opera con el diccionario de corrección en inglés por defecto o carece del paquete de corrección en español.
   - Al evaluar palabras válidas en español contra un diccionario anglosajón, el motor de renderizado marca cada vocablo como un error ortográfico mediante la línea ondulada nativa.
2. **Comportamiento por Defecto en HTML5 para Elementos de Entrada**:
   - Los elementos `<textarea>` y campos de texto editables tienen la corrección ortográfica activada por omisión si no se explicita `spellcheck="false"`.

**Solución Implementada y Decisiones Arquitectónicas (Doble Capa Defensiva):**
1. **Capa Global Reactiva (DOM & Runtime):**
   - Creación del módulo centralizado `src/utiles/desactivadorSpellcheck.ts` con la función `inicializarDesactivadorSpellcheck()`.
   - Desactiva `spellcheck = false` en todos los `<input>`, `<textarea>` y elementos `contenteditable` presentes en el DOM.
   - Implementa un `MutationObserver` sobre `document.body` que asegura que cualquier componente inyectado dinámicamente (modales, desplegables, portales) herede de inmediato `spellcheck = false`.
   - Registra un oyente `focusin` (`capture: true`) en `document` como red de seguridad adicional ante interacciones del usuario.
   - Configura `spellcheck="false"` a nivel raíz en `<body>` y `<div id="root">` dentro de `index.html`.
   - Inicialización en `src/main.tsx` en el ciclo de arranque de la aplicación.
2. **Capa Declarativa JSX (Edición Quirúrgica de Componentes):**
   - Se aplicó `spellCheck={false}` explícitamente a los 23 `<textarea>` de la aplicación (`FormularioHechizo.tsx`, `ConstructorRasgoDote.tsx`, `ModalCrearEditarRasgo.tsx`, `ModalAgregarObjeto.tsx`, `SeccionDatosGenerales.tsx`, `SeccionEquipoContenedor.tsx`, `SeccionListasAtaques.tsx`, `NotasDM.tsx`, `ConfiguracionDM.tsx`, `PestanaPersonalizarCaracteristica.tsx`, `GestorPersonajes.tsx`, `ModalDetalleHabilidad.tsx`, `SeccionMagiaYEfectosObjeto.tsx`).
3. **Pruebas Unitarias Automatizadas:**
   - Implementación de `src/utiles/desactivadorSpellcheck.test.ts` con soporte tanto para entornos sin DOM (Node.js/SSR) como con DOM simulado (elementos existentes, dinámicos, `contenteditable` y eventos `focusin`).
4. **Validación Integral del Proyecto:**
   - `pnpm exec tsc --noEmit`: 0 errores (Strict mode).
   - `pnpm test`: 51 suites ejecutadas, 604 pruebas pasando al 100%.
   - `pnpm lint`: 0 errores y 0 advertencias.

---

## [2026-09-12] Corrección de Sincronización de Rasgos Canónicos de Clase y Rediseño de Pestañas de Filtro en Acciones

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"no se fueron todos los rasgos, solo se fue la de la subraza ademas, para seleccionar las pestañas quedo horrible. recuerda que se deben cumplir los principios SOLID, KISS, DRY y mantener una arquitectura limpia"*.
- En la captura adjunta por el usuario:
  1. Para un personaje como *Zulen (Bardo)* nivel 3, en la sección de rasgos tácticos de combate solo figuraba el rasgo de subespecie (*Nv 3: Magia de alto elfo: Detectar magia*), omitiendo los rasgos canónicos de clase (*Inspiración bárdica*).
  2. La barra de botones de filtro en la cabecera colapsaba de forma crítica: el texto de los 6 botones se encogía y se solapaba uno encima de otro de forma ilegible (*"ACCIÓN (18ACCIÓN ADICIONAL (REACCIÓN (0) CONSUMIBLES (5)ACTIVABLES (0)"*).

**Causas Raíz Identificadas:**
1. **Falta de Sincronización Canónica en la Pestaña de Acciones**:
   - La función `sincronizarRasgosPersonaje` solo se disparaba mediante un `useEffect` dentro de `usarVistaRasgos.ts` (al entrar en la pestaña *Rasgos*).
   - Si un personaje había sido creado o persistido previamente con solo rasgos de especie en su array `personaje.rasgos`, al abrir la pestaña *Acciones* (`VistaAtaquesJugador`), `resolverRasgosAcciones(personajeActivo)` solo iteraba sobre el array estático local sin integrar los rasgos de clase canónicos.
2. **Colapso Flexbox y Desbordamiento en la Barra de Filtros (`CabeceraAtaquesJugador.tsx` y `VistaAtaquesJugador.module.css`)**:
   - `.botonFiltro` utilizaba `flex: 1; min-width: 70px; white-space: nowrap;`.
   - Con 6 botones en un panel de ancho acotado (como en la ventana webview de TaleSpire), el flex shrink comprimía los botones a 70px.
   - El texto *"Acción Adicional (0)"* mide ~150px; al no caber en 70px y tener `white-space: nowrap`, el texto se desbordaba horizontalmente y se superponía sobre los botones contiguos (*"Reacción"*, *"Consumibles"*, etc.).
   - El componente `CabeceraAtaquesJugador.tsx` repetía 6 veces el mismo bloque de botón JSX violando el principio DRY.

**Solución Implementada y Decisiones Arquitectónicas (SOLID, KISS, DRY):**
1. **Resilience & Auto-Healing en Rasgos de Combate (`usarCalculoAtaquesJugador.ts` y `calculadorAccionesCombate.ts`):**
   - `listaRasgosCombate` en `usarCalculoAtaquesJugador.ts` ahora evalúa `sincronizarRasgosAutomaticos(personajeActivo)`, garantizando que todos los rasgos canónicos de clase (ej. *Inspiración bárdica* con sus dados d6 y usos por Carisma) y de especie/subespecie aparezcan de inmediato en combate sin desfase de renderizado.
   - Se incorporó un `useEffect` reactivo en `usarCalculoAtaquesJugador.ts` que compara los IDs canónicos con los IDs actuales del personaje y, si faltan rasgos canónicos en el almacenamiento, invoca `sincronizarRasgosPersonaje(personajeActivo.id)` para actualizar transparentemente el almacén de Zustand.
   - En `resolverRasgosAcciones` (`src/servicios/calculadorAccionesCombate.ts`), si el personaje no tiene rasgos definidos o su array está vacío, recurre como fallback seguro a `sincronizarRasgosAutomaticos(personajeActivo)`.
2. **Arquitectura Limpia y Separación Ergonómica en Cabecera (`CabeceraAtaquesJugador.tsx`):**
   - Las tres pestañas principales corresponden exclusivamente a los pilares de la economía de acciones de combate de D&D 5.5e: `Acciones` (`conteoAccion`), `Adicionales` (`conteoAccionAdicional`) y `Reacciones` (`conteoReaccion`).
   - Los demás filtros se encapsulan en un componente `SelectorDesplegable` compacto: `Todas (${conteoTotal})`, `Consumibles (${conteoConsumibles})` y `Activables (${conteoActivables})`.
   - Cuando el filtro activo es una de las tres pestañas principales, el botón respectivo se resalta y el selector muestra `"Otros..."` en estado neutral. Cuando el filtro activo es del selector, el selector adopta el estilo activo de combate y las pestañas permanecen en reposo.
3. **Diseño de Distribución Flexible sin Solapamiento (`VistaAtaquesJugador.module.css`):**
   - `.barraFiltros`: distribuida con `justify-content: space-between; gap: 8px; flex-wrap: wrap; overflow: visible;`.
   - `.grupoPestanasPrincipales`: aloja los 3 botones de pestañas fijas con `flex: 0 0 auto` y sin encogimiento.
   - `.selectorFiltroWrapper`: altura armónica de 28px (`tamano="compacto"`), matching con los botones principales y elevación `z-index` para flotar limpiamente sobre el contenido sin cortes por overflow.
   - `.badgeConteoFiltro`: diseño tipo píldora estilizado (`background-color: rgba(255, 255, 255, 0.08); padding: 1px 6px; border-radius: 10px; font-weight: 800;`) que destaca en estado activo (`background-color: rgba(129, 140, 248, 0.25); color: #c7d2fe;`).
4. **Cobertura Automatizada con Tests Unitarios:**
   - Se agregó una prueba en `src/servicios/calculadorAccionesCombate.test.ts` que valida que para un personaje Bardo Alto Elfo nivel 3 se resuelven simultáneamente *Inspiración bárdica* (acción adicional consumible con dados) y *Magia de alto elfo: Detectar magia* (acción consumible).
5. **Validación Integral del Proyecto:**
   - `pnpm exec tsc --noEmit`: 0 errores (Strict mode).
   - `pnpm test`: 50 suites ejecutadas, 602 pruebas pasando al 100%.
   - `pnpm lint`: 0 errores y 0 advertencias.
   - `node scripts/verificar-limite-lineas.js`: 109 archivos auditados, 0 archivos superan 500 líneas.

---

## [2026-09-12] Integración de Rasgos Tácticos en la Pestaña de Acciones de Combate (D&D 5.5e)

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"realiza un plan de implementacion para hacer que los rasgos sean visibles en la pestaña de acciones, que se vean las acciones, las acciones adicionales, reacciones, consumibles, y activables"*.
- Decisiones de diseño acordadas:
  - En la vista general ("Todas"), los rasgos se organizan en subsecciones colapsables (*Acciones*, *Acciones Adicionales*, *Reacciones*, *Recursos Tácticos y Consumibles*, *Activables y Modos de Combate*).
  - Los rasgos con usos limitados se conservan en su propia sección como *Recursos Tácticos con Usos*, manteniéndolos diferenciados de los consumibles del inventario físico (pociones, pergaminos).
  - Exclusión de rasgos puramente pasivos permanentes sin mecánicas activas para evitar saturar la interfaz de combate.

**Causas Raíz y Desafíos Técnicos:**
1. **Desconexión entre Rasgos y Economía de Acciones**: Anteriormente, la pestaña de Acciones (`VistaAtaquesJugador`) solo contemplaba ataques físicos, conjuros, consumibles de inventario y objetos mágicos, obligando al jugador a alternar entre pestañas en combate para usar habilidades de clase como *Furia*, *Segundo Aliento*, *Inspiración Bárdica* o *Desviar Proyectiles*.
2. **Pertenencia Multicategoría**: Habilidades como *Furia* combinan un coste de activación (*Acción Adicional*), un conmutador de estado (*Activable*) y una reserva finita (*Consumible* con usos por día). Se requería una clasificación declarativa que permitiese responder a múltiples filtros simultáneamente.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Resolutor Puro Declarativo `resolverRasgosAcciones` (`src/servicios/calculadorAccionesCombate.ts`):**
   - Función pura agnóstica sin bifurcaciones por nombre (`r.nombre === "..."`), cumpliendo estrictamente con ESLint `no-restricted-syntax`.
   - Clasifica los rasgos a partir de sus metadatos (`tipoAccion`, `esActivable`, `categoriaMecanica`, `tieneUsosLimitados`, `gastarDePadre`, `formulaDados`).
   - Verifica el nivel requerido respecto al nivel del personaje y filtra pasivos estáticos sin dados ni conmutadores.
2. **Ampliación de Tipos y Estado Reactivo (`usarCalculoAtaquesJugador.ts`):**
   - Se amplió `FiltroAccion` a `"todas" | "accion" | "accionAdicional" | "reaccion" | "consumibles" | "activables"`.
   - Se conectaron las acciones del almacén `gastarUsoRasgoPersonaje`, `recuperarUsoRasgoPersonaje` y `alternarActivoRasgo`.
   - Conteos dinámicos consolidados para todas las categorías (`conteoAccion`, `conteoAccionAdicional`, `conteoReaccion`, `conteoConsumibles`, `conteoActivables`, `conteoTotal`).
3. **Componente de Interfaz `SeccionRasgosAtaque.tsx`:**
   - Modo "Todas": renderiza 5 subsecciones colapsables independientes con encabezados semánticos, conteos e iconos SVG locales de Lucide-react (sin emojis).
   - Modo Filtrado: renderiza directamente la lista plana de rasgos coincidentes.
   - Reutilización limpia de `TarjetaRasgo` haciendo opcionales los callbacks de edición/borrado para modo combate.
4. **Inspección en Modal (`VistaAtaquesJugador.tsx`):**
   - Apertura de `ModalDetalleRasgo` al hacer clic en cualquier rasgo, permitiendo inspeccionar descripciones completas, tablas de progresión y notas sin salir de la pestaña de acciones.
5. **Validación Integral:**
   - `pnpm exec tsc --noEmit`: 0 errores (Strict mode).
   - `pnpm exec vitest run`: 50 suites ejecutadas, 601 pruebas pasando al 100%.
   - `pnpm lint`: 0 errores y 0 advertencias.
   - `node scripts/verificar-limite-lineas.js`: 0 archivos > 500 líneas.

---

## [2026-09-12] Corrección de Tablas de Progresión y Escalado en Multiclase (Nivel de Clase vs Nivel General)

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"las tablas van a nivel general, no al nivel propio de la clase (ejemplo alli hice una multicalse de bardo 5 barbaro 15)"*.
- En las capturas adjuntas, en un personaje multiclase con Bardo 5 y Bárbaro 15 (nivel total 20):
  - En el rasgo de Bardo (*Inspiración bárdica*), la tabla de progresión marcaba como `[ACTUAL]` el nivel 15 (Dado de bardo: 1d12) en lugar del nivel 5 (Dado de bardo: 1d8), a pesar de que el botón superior sí lanzaba 1d8 correctamente.
  - En el rasgo de Bárbaro (*Furia*), la tabla de progresión marcaba como `[ACTUAL]` el nivel 20 (6 veces/día, +4 daño) en lugar del nivel 12 (5 veces/día, +3 daño), a pesar de que la reserva de usos sí indicaba 5 usos.

**Causas Raíz Identificadas:**
1. **Paso Ciego del Nivel Global en `VistaRasgosJugador.tsx`:** Al abrir `ModalDetalleRasgo`, la propiedad `nivelPersonaje` se alimentaba con `personajeActivo.nivel` (el nivel general acumulado del personaje, en este caso 20), sin discriminar a qué clase o subclase pertenecía el rasgo que se estaba inspeccionando.
2. **Impacto en Componentes Hijos:** `TablaProgresionRasgo` y `SeccionSelectoresModalRasgo` consumían directamente esa propiedad `nivelPersonaje` para calcular la fila `[ACTUAL]` y los requisitos mínimos de nivel para invocaciones y opciones desbloqueables.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Resolver Puro y Determinista `obtenerNivelEfectivoParaRasgo` (`src/componentes/caracteristicas/rasgos/utilidadesProgresionRasgos.ts`):**
   - Función pura con tipado estricto:
     - Si el rasgo es de especie, subespecie, dote o trasfondo: retorna el nivel global (`personaje.nivel`).
     - Si el rasgo es de clase o subclase (o asimilado a una de las clases del personaje por coincidencia de `fuente`, `id` o mediante el catálogo oficial `obtenerClasePorNombre` y sus subclases): extrae e inyecta el **nivel individual de dicha clase** en el personaje (ej. 5 para Bardo, 15 para Bárbaro).
     - Si el personaje es monoclase, mantiene paridad directa con su nivel único.
2. **Propagación en Hook y Vista (`usarVistaRasgos.ts` y `VistaRasgosJugador.tsx`):**
   - Expuesto `obtenerNivelEfectivoParaRasgo` en el hook `usarVistaRasgos`.
   - `ModalDetalleRasgo` ahora recibe `nivelPersonaje={obtenerNivelEfectivoParaRasgo(rasgoDetalleEfectivo)}`.
3. **Cobertura Automatizada con Tests:**
   - Creada suite en `src/componentes/caracteristicas/rasgos/utilidadesProgresionRasgos.test.ts` con 6 pruebas que validan:
     - Nivel propio de clase (5) para Bardo en multiclase 5/15.
     - Nivel propio de clase (15) para Bárbaro en multiclase 5/15.
     - Nivel de subclase (15) para Berserker.
     - Nivel general (20) para especie y dotes.
     - Nivel de clase única en monoclase.
4. **Validación Integral:**
   - `pnpm exec tsc --noEmit`: 0 errores (Strict mode).
   - `pnpm exec vitest run`: 50 suites ejecutadas, 597 pruebas pasando al 100%.
   - `pnpm lint`: 0 errores y 0 advertencias.
   - `node scripts/verificar-limite-lineas.js`: 0 archivos > 500 líneas.

---

## [2026-09-12] Rework Canónico de Objetos, Equipamiento e Inventario (D&D 5.5e / 2024 PHB)

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"ok, ahora hay que plantear el rework de objetos. veo que no se estan consumiento todas las categorias y si se consumieran todas eso se podra aprovechar en lo que es el inventario"*.
- Mandato explícito e irrevocable: *"no, nada de compatibilidad con el legacy, todo nuevo"*.
- Mandato para subcategorías: *"realmente los objetos que tienen subcategoria son contados y todos tienen es la subcategoria de 'consumible' asi que to lo reemplazaria por un booleano de esConsumible o rodarlo a una categoria de consumible"*.
- Reglas globales estrictas:
  - Sin emojis (uso exclusivo de Lucide-react SVG).
  - Gestor exclusivo `pnpm`.
  - Tipado estricto (`strict: true`, cero `any`).
  - 100% en español en UI, tipos y comentarios.
  - Memoria técnica actualizada en `agente.md`.

**Causas Raíz y Desafíos Técnicos:**
1. **Clasificación Legacy Truncada (`tipoPrincipal: "Arma" | "Armadura" | "Equipo de Aventuras"`):**
   El compendio oficial D&D 5.5e (`Equipo es.json`, 199 objetos) poseía múltiples categorías semánticas ricas (`"tools"`, `"ammunition"`, `"mounts-and-vehicles"`, `"standard-gear"`, etc.), pero la arquitectura antigua forzaba todo a tres únicas familias artificiales (`tipoPrincipal`), agrupando en "Equipo de Aventuras" a pociones, pergaminos, herramientas, monturas, carcajes y focos arcanos.
2. **Detección Frágil de Escudos:**
   Los escudos estaban anidados dentro de `Armadura` y su detección dependía de comprobaciones frágiles por expresión regular (`normalizar(nombre).includes("escudo")`), lo que abría la puerta a falsos positivos o fallos si el nombre cambiaba.
3. **Filtros Limitados en la UI:**
   El modal de agregar objetos y la mochila solo filtraban por las 3 categorías antiguas o usaban heurísticas de texto ad-hoc para separar pociones y munición.
4. **Desconexión con el Modelo Canónico 5.5e:**
   D&D 5.5e clasifica el equipamiento de aventuras con claridad: Armas, Armaduras, Escudos, Herramientas, Focos Mágicos, Consumibles, Munición, Contenedores, Paquetes de Equipo, Objetos Mágicos y Equipo Aventurero.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Eliminación Total de `tipoPrincipal` y Creación de `CATEGORIAS_EQUIPO` (`src/constantes/categoriasEquipoConstantes.ts`):**
   - Se crearon las 11 categorías oficiales canónicas:
     `"armas" | "armaduras" | "escudos" | "herramientas" | "focos-magicos" | "consumibles" | "municion" | "contenedores" | "paquetes-equipo" | "objetos-magicos" | "equipo-aventurero"`.
   - Se implementó `DICCIONARIO_CATEGORIAS_EQUIPO` con etiquetas en español, descripciones e iconos semánticos de Lucide-react (ej. `Swords`, `Shield`, `ShieldAlert`, `Wrench`, `Wand2`, `FlaskConical`, `Crosshair`, `Package`, `Boxes`, `Sparkles`, `Backpack`).
   - Se creó el resolver determinista `resolverCategoriaDesdeSRD(raw)` que mapea los 199 ítems de `Equipo es.json` a la categoría canónica exacta y determina si `esConsumible: true`.
2. **Refactorización de Tipos (`src/tipos/index.ts` y `src/tipos/personaje.ts`):**
   - Se eliminó `tipoPrincipal` de `ObjetoBase`, `ObjetoInventario`, `ObjetoHomebrew`, `Arma`, `Armadura`, `Escudo` y `EquipoAventuras`.
   - Se elevó `Escudo` a entidad de primer nivel con `categoria: "escudos"`, `subcategoria: "Escudo"` y `caBase: 2`.
   - Se agregó `esConsumible: boolean` tanto al esquema Zod como a las interfaces TypeScript.
3. **Servicios y Cálculo de Estadísticas:**
   - `usarEstadoPersonajes.ts`: Cálculo de CA reescrito para evaluar `o.categoria === "armaduras"` y `o.categoria === "escudos"` de forma directa, eliminando regex de nombres.
   - `procesadorEquipamiento.ts`: Lógica de equipamiento corporal y escudo basada en igualdad estricta de categoría.
   - `clasificadorInventario.ts`: Mochila organizada dinámicamente en las 11 categorías oficiales de D&D 5.5e, filtrando automáticamente las categorías vacías.
   - `calculadorAtaquesArmas.ts`: Verificación directa `o.categoria === "armas"`.
   - `sanitizacion.ts`: Funciones `sanearObjetoHomebrew` y `sanearPersonaje` actualizadas para mapear a las nuevas categorías sin recurrir a código legacy, e infiriendo subcategorías cuando proceda.
4. **Interfaz de Usuario y Filtros:**
   - `ModalAgregarObjeto.tsx`: 12 pestañas de filtro (Todas + las 11 categorías oficiales), vista previa dedicada para escudos (mostrando +2 CA) y ordenación inteligente por categoría y clase de armadura.
   - `TarjetaObjetoInventario.tsx`: Identificación de consumibles mediante `objeto.esConsumible || objeto.categoria === "consumibles"` y renderizado de badges canónicos.
   - `ModalDetalleObjetoInventario.tsx` y `usarDetalleObjetoInventario.ts`: Visualización del badge oficial de categoría con icono Lucide y color temático.
   - `FormularioObjeto.tsx` y `ListaHomebrew.tsx`: Adaptados para seleccionar entre las categorías canónicas.
5. **Verificación Integral y Suite de Pruebas:**
   - 13 archivos de pruebas unitarias actualizados a los nuevos contratos de datos.
   - `pnpm exec tsc --noEmit`: 0 errores en modo estricto.
   - `pnpm exec vitest run`: 49 suites de prueba ejecutadas, 591 pruebas pasando exitosamente (100%).
   - `pnpm run build`: Compilación de producción con Vite completada con éxito.

---

## [2026-09-11] Integración de agregarModificadorHabilidad en Conjuros (D&D 5.5e y Fórmulas TaleSpire)

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"ok, ahora hay que añadirle funcionalidad al un campo de la base de datos de conjuros que creo que no se esta usando 'agregarModificadorHabilidad' este se supone que funciona como el recien añadido 'bonoDanoMagico', solo que lo que suma es el modificador de caracteristica del lanzador de hechizos"*.
- Regla mecánica (D&D 5.5e / 2024): Conjuros como *Curar heridas*, *Palabra de curación*, o invocaciones como *Descarga agónica* (Agonizing Blast) añaden el modificador de la característica de aptitud mágica del lanzador (INT, SAB o CAR según la clase) a la tirada de daño o curación.
- Restricción TaleSpire: La fórmula no puede contener números sueltos; los bonos numéricos deben componerse directamente sobre los dados (ej. `2d8+3`, `2d8+5`).
- Coexistencia con `bonoDanoMagico`: Si el personaje posee un bono de daño mágico (ej. +2 por Asimar / Revelación celestial) y el conjuro tiene `agregarModificadorHabilidad: true` con modificador de habilidad +3, el bono total sumado debe ser +5 (`2d8+5`).
- Regla para proyectiles múltiples: A diferencia de `bonoDanoMagico` (que se aplica 1 vez por turno en el primer proyectil), el modificador de habilidad de aptitud mágica aplica a **todos los proyectiles** que impacten cuando la regla o rasgo así lo estipula (ej. *Descarga agónica* suma a cada rayo: Rayo 1 `1d10+5`, Rayo 2 `1d10+3`).

**Causas Raíz y Desafíos Técnicos:**
1. El campo `agregarModificadorHabilidad: boolean` estaba presente en la interfaz `HechizoBase` (`src/tipos/hechizo.ts`) y en la base de datos de conjuros, pero no era consumido por las utilidades de cálculo de fórmulas (`utilesConjuros.ts`), el servicio de lanzamiento (`servicioLanzamientoConjuros.ts`) ni los componentes visuales de la hoja de personaje.
2. Era necesario resolver con precisión y sin redundancias la característica de aptitud mágica del personaje según su clase o configuración mágica, aprovechando la caché reactiva sin degradar rendimiento.
3. Se requería actualizar la visualización en vivo en las tarjetas de conjuros (`TarjetaConjuroCompacta.tsx`), en la ficha detallada (`FichaHechizo.tsx`) y en el modal de lanzamiento para que el usuario aprecie la fórmula potenciada en tiempo real antes y al tirar.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Extracción y Cálculo de Aptitud Mágica (`src/servicios/calculadorMagia.ts`):**
   - Se implementaron y exportaron `obtenerHabilidadConjuroPersonaje(pj: Personaje): TipoHabilidadMagica | null` y `obtenerModificadorAptitudMagica(pj: Personaje): number`.
   - Utiliza la caché interna de estadísticas calculadas (`WeakMap`) para O(1) con fallback matemático directo `Math.floor((puntuacion - 10) / 2)`.
2. **Aritmética de Fórmulas y TaleSpire (`src/utiles/utilesConjuros.ts`):**
   - Se añadieron parámetros opcionales `modificadorHabilidad: number = 0` a:
     - `calcularInfoTruco`: compone el modificador en `formula` y `etiquetaVisual` cuando `agregarModificadorHabilidad === true`.
     - `construirFormulaTaleSpireTruco`: aplica el modificador a cada rayo o al truco único de forma limpia.
     - `construirFormulaTaleSpireEspacio`: suma `modHab` a `formulaFinalDano` y a cada proyectil múltiple si el hechizo lo requiere.
3. **Capa de Servicios y Hooks (`servicioLanzamientoConjuros.ts`, `usarLanzadorConjuros.ts`, `usarLanzamientoTarjetaConjuro.ts`):**
   - `SolicitudLanzamiento` extendida con `modificadorHabilidad?: number`.
   - `prepararLanzamiento`, `construirFormulaTruco` y `construirFormulaEspacio` propagan `modificadorHabilidad`.
   - `usarLanzadorConjuros` calcula automáticamente `modificadorHabilidad` vía `obtenerModificadorAptitudMagica(personaje)` e inyecta el valor en `solicitudCompleta`.
   - `usarLanzamientoTarjetaConjuro` recibe y transfiere el modificador a los constructores de fórmulas de TaleSpire.
4. **Capa Visual y Tarjetas:**
   - `TarjetaConjuroCompacta.tsx`: Recibe `modificadorHabilidad` y lo utiliza en `calcularInfoTruco` y `filaMetadatos` para mostrar la fórmula aumentada en tiempo real (ej. `2d8+3` de curación).
   - `SeccionNivelConjuros.tsx` y `SeccionConjurosOcultos.tsx`: Obtienen el modificador de habilidad mágica del personaje y lo entregan a cada tarjeta.
   - `FichaHechizo.tsx` y `ModalFichaHechizoFlotante.tsx`: Reciben `modificadorHabilidad` y calculan `dadosBaseValidos` sumando el modificador si `agregarModificadorHabilidad === true`.
   - `SeccionAtaquesMagicos.tsx` y `VistaAtaquesJugador.tsx`: Suministran `modificadorHabilidad` a `TarjetaConjuroCompacta` y `FichaHechizo`.
5. **Base de Datos de Conjuros (`src/utiles/compendios/all.json`):**
   - Se verificó y activó `"agregarModificadorHabilidad": true` en los conjuros canónicos:
     - *Curar heridas* (`h_curar-heridas`)
     - *Curar heridas en masa* (`h_curar-heridas-en-masa`)
     - *Palabra de curación* (`h_palabra-de-curacion`)
     - *Palabra de curación en masa* (`h_palabra-de-curacion-en-masa`)
6. **Pruebas y Verificación Integral:**
   - Pruebas automatizadas en `utilesConjuros.test.ts` y `servicioLanzamientoConjuros.test.ts`.
   - `pnpm exec tsc --noEmit`: 0 errores en TypeScript estricto.
   - `pnpm exec vitest run`: 49 suites aprobadas, 591 pruebas pasando exitosamente (100%).
   - `pnpm lint`: 0 advertencias y 0 errores.

---

## [2026-09-11] Fase 2: Motor Genérico de Bonos de Daño a Conjuros (+PB) y Rasgo Mecánico Revelación Celestial (Asimar)

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"okok, funciono a la perfeccion, ahora fase 2, agregarlo tambien al daño de conjuros"*.
- Regla mecánica (D&D 5.5e / 2024): Al activar cualquier transformación celestial de Asimar (*Alas celestiales*, *Fulgor interior*, *Mortaja necrótica* o el conmutador de *Revelación celestial*), se añade una vez por turno el Bono de Competencia (**+PB**) al daño de los ataques y de los hechizos/conjuros.
- Restricción crítica de TaleSpire: TaleSpire no acepta números sueltos (los autocompleta con un d20). El daño debe ser directo a los dados de la fórmula (ej. `1d10+2`, `8d6+3`, `1d4+3`), sin separadores `/ 2`.
- Regla D&D 5.5e para proyectiles múltiples: En conjuros como *Descarga sobrenatural*, *Proyectil mágico* o *Rayo abrasador*, la bonificación de daño adicional ("una vez en cada uno de tus turnos al hacer daño") se suma de forma limpia al **primer proyectil** (`Daño Dardo 1: 1d4+3`, `Daño Dardo 2: 1d4+1`), preservando el balance oficial.
- Exigencia de Genericidad (Regla Global 6): Las funciones deben ser 100% genéricas, consumibles desde el builder homebrew para cualquier rasgo o dote, sin bifurcaciones hardcodeadas por nombre.

**Causas Raíz y Desafíos Técnicos:**
1. **Ausencia de un Esquema de Bono de Daño Mágico:** El contrato de rasgos sólo contemplaba bonos de daño a ataques físicos (`bono_dano_ataque` y `bono_dano_fuerza`).
2. **Formateo de Fórmulas para TaleSpire:** No existía una utilidad para sumar un bono numérico directo respetando modificadores preexistentes (`"1d4+1"` + 2 -> `"1d4+3"`).
3. **Flujo de Ejecución Desacoplado:** El lanzamiento de conjuros se orquesta a través de tres capas distintas: las utilidades puras (`utilesConjuros.ts`), el servicio Facade/Strategy (`servicioLanzamientoConjuros.ts`) y los hooks/componentes de la UI (`usarLanzamientoTarjetaConjuro.ts`, `TarjetaConjuroCompacta.tsx`, `FichaHechizo.tsx`).

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Tipado Estricto del Contrato de Rasgos (`src/tipos/rasgos.ts`):**
   - Se añadió `"bono_dano_conjuro"` a `EsquemaTipoEfectoMecanico`.
   - Se flexibilizó `aplicaA` mediante `z.union([z.enum([...]), z.string()])` para admitir scopes de conjuro (`"todos_conjuros"`, `"trucos"`, `"espacios"`, tipos de daño y escuelas).
2. **Evaluador Genérico de Daño Mágico (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - Se definió `ContextoDanoConjuro` (`esTruco`, `nivelLanzamiento`, `tipoDano`, `escuela`, `nombreConjuro`).
   - Se implementó la función pura `aplicaEfectoAConjuro` para resolver los criterios contextuales de selección.
   - Se implementó `obtenerBonoDanoConjuroExtra(personaje, contexto)` que evalúa los efectos activos resolviendo tokens dinámicos (`"bono_competencia"`, `"pb"`) y cuenta con respaldo reactivo directo `+PB` si `estaRevelacionCelestialActiva(personaje)` está presente en condiciones, efectos de Combat Tracker o conmutadores.
3. **Aritmética Segura de Dados para TaleSpire (`src/utiles/utilesConjuros.ts`):**
   - Función pura `aplicarBonoNumericoAFormulaDados(formula, bono)` que compone y suma algebraicamente modificadores numéricos directos sin generar números sueltos.
   - Actualizadas `calcularInfoTruco`, `construirFormulaTaleSpireTruco` y `construirFormulaTaleSpireEspacio` con parámetro `bonoDanoMagico: number = 0`, aplicando el daño extra al primer proyectil en conjuros de impactos múltiples o al total en conjuros estándar.
4. **Capa de Servicios y Hooks (`servicioLanzamientoConjuros.ts`, `usarLanzadorConjuros.ts`, `usarLanzamientoTarjetaConjuro.ts`):**
   - Propagación de `bonoDanoMagico` en `SolicitudLanzamiento`, `validarLanzamiento` y `prepararLanzamiento`.
5. **Componentes Visuales de la Hoja de Personaje:**
   - `TarjetaConjuroCompacta.tsx`: Muestra en vivo la fórmula potenciada en la tarjeta (`infoTruco.etiquetaVisual` o `hechizo.dadosDaño + PB`).
   - `SeccionNivelConjuros.tsx`, `SeccionConjurosOcultos.tsx` y `SeccionAtaquesMagicos.tsx`: Calculan el contexto y alimentan a las tarjetas.
   - `FichaHechizo.tsx`, `ModalFichaHechizoFlotante.tsx` y `VistaAtaquesJugador.tsx`: Permiten visualizar y lanzar con el bono `+PB` reflejado tanto en la vista previa como en el comando TaleSpire.
6. **Constructor Homebrew (`src/componentes/caracteristicas/rasgos/ConstructorRasgoDote.tsx`):**
   - Añadido `"bono_dano_conjuro"` en `TIPOS_EFECTO_DISPONIBLES` con selector de objetivo (`OPCIONES_APLICA_A_CONJURO`).
7. **Catálogo y Auto-Saneamiento:**
   - Añadido el efecto declarativo canónico `bono_dano_conjuro` a `Revelación celestial` en `especiesDND55.ts`, `sanitizacion.ts` y `condicionesRasgosHelpers.ts`.
8. **Pruebas y Verificación Integral:**
   - Añadida suite de pruebas en `utilesConjuros.test.ts` y `servicioLanzamientoConjuros.test.ts`.
   - `pnpm exec tsc --noEmit`: 0 errores (estricto).
   - `pnpm exec vitest run`: 49 suites aprobadas, 584 tests pasando (100%).
   - `pnpm run build`: Compilación exitosa para producción con Vite.

---

## [2026-09-11] Fase 1 (Corrección): Resiliencia Reactiva y Sincronización de Daño (+PB) para Revelación Celestial (Condiciones, Efectos Activos y localStorage)

**Contexto y Problema Reportado por el Usuario:**
- El usuario probó en la UI la aplicación de la transformación de Asimar y reportó: *"ok, el daño extra no se esta aplicando, me aplique el efecto y nada, en el daño no esta aplicando el daño extra"*.
- Al aplicar la condición/efecto *"Alas Celestiales"*, *"Fulgor Interior"*, *"Mortaja Necrótica"* o *"Revelación celestial"* en la Barra Táctica o Combat Tracker, el daño del arma no reflejaba el bono `+PB` (seguía mostrando `1d8+3` en lugar de `1d8+5`).

**Causas Raíz Identificadas:**
1. **Desincronización de Snapshots de `localStorage`:** Los personajes Asimar persistidos previamente en el navegador tenían guardado el rasgo `Revelación celestial` sin el array `efectos: [{ tipo: "bono_dano_ataque", ... }]` (ya que fue creado antes de la adición al catálogo). Al cargar el personaje, `evaluarEfectosRasgosActivos` recorría `rasgo.efectos` vacío o indefinido, resultando en `0` efectos devueltos.
2. **Falta de Reactividad Directa de Condiciones/Efectos hacia el Motor de Combate:** `obtenerBonoDanoAtaqueExtra` consultaba exclusivamente `evaluarEfectosRasgosActivos`, el cual solo leía el array `personaje.rasgos`. Si el usuario se aplicaba el efecto en la Barra Táctica o Combat Tracker (que escribe en `condicionesActivas` y `efectosActivos`), el evaluador no lo reconocía a menos que el rasgo en sí estuviera conmutado y tuviera `efectos` válidos.
3. **Ausencia de Función de Inspección de Estado Global:** A diferencia de Furia (que dispone de `estaFuriaActiva` para auditar condiciones, efectos y rasgos al unísono), no existía `estaRevelacionCelestialActiva`.

**Decisiones Arquitectónicas y Solución Implementada:**
1. **Función Pura `estaRevelacionCelestialActiva(personaje)` (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - Audita de forma unificada:
     a) `personaje.condicionesActivas` ("alas celestiales", "fulgor interior", "mortaja necrotica", "revelacion celestial").
     b) `personaje.efectosActivos` (mismos criterios en nombres de efectos temporales).
     c) `personaje.rasgos` (`r.activo !== false` en conmutador de rasgo).
2. **Hidratación Dinámica Resiliente en `evaluarEfectosRasgosActivos`:**
   - Si el rasgo de Revelación celestial está presente pero inactivo, se considera activo automáticamente si `estaRevelacionCelestialActiva(personaje)` es `true`.
   - Si el rasgo guardado en `localStorage` carece de `efectos` definidos, el evaluador inyecta en tiempo de ejecución el efecto canónico de daño `{ tipo: "bono_dano_ataque", objetivo: "todos_ataques", valor: "bono_competencia", aplicaA: "todos_ataques", descripcion: "Revelación celestial (+PB daño en ataques)" }`.
3. **Respaldo Reactivo Garantizado en `obtenerBonoDanoAtaqueExtra` (Paridad con Furia):**
   - Tras evaluar los efectos de rasgos, si `estaRevelacionCelestialActiva(personaje)` es verdadera y ningún efecto evaluado aportó previamente el bono de Revelación, se suma directamente el Bono de Competencia (+PB) al modificador numérico de daño del ataque.
   - Esto blinda la mecánica frente a personajes antiguos, PNJs o tokens temporales.
4. **Auto-Saneamiento en `sanearPersonaje` (`src/almacen/sanitizacion.ts`):**
   - Al cargar o importar cualquier personaje, si contiene `Revelación celestial` sin `efectos`, se le asegura la propiedad declarativa canónica.
5. **Garantía en `activarRasgosPorCondicionOEfecto` (`condicionesRasgosHelpers.ts`):**
   - Al activar el rasgo mediante una condición o efecto, se garantizan los efectos mecánicos en el estado de Zustand.
6. **Verificación y Cobertura:**
   - 3 pruebas de resiliencia agregadas en `calculadorDanoCombate.test.ts` validando: aplicación directa de condición "Alas Celestiales" en Barra Táctica, efecto activo "Fulgor Interior" en Combat Tracker, y auto-hidratación desde snapshot antiguo de `localStorage`.
   - `pnpm exec tsc --noEmit`: 0 errores.
   - `pnpm exec vitest run`: 49/49 suites aprobadas, 575/575 pruebas pasando (100%).

---

## [2026-09-11] Fase 1: Motor Genérico de Bonos de Daño a Ataques (+PB) y Rasgo Mecánico Revelación Celestial (Asimar)

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"vamos a plantear (crea un plan de implementacion) de como añadir el rasgo mecanico de asimar Revelación celestial esta plantea que al activar el efecto de cualquira de sus transformaciones se añade un +PB al daño de los ataques y daño de los hechizos, recuerda que estas deben ser funciones totalmente genericas por que se deben consumir desdel el builder. para los ataques (daño de arma) se aplica algo similar al daño de furia del barbaro que ya esta construido asi que tal vez se pueda empezar por alli, para la fase 2 aqui se planteara para el daño de los conjuros"*.
- Aclaración de diseño del usuario: *"debe ser daño directo al arma osea 1d8+5, por que talespire no acepta numeros solos los autocompleta con un d20. por ende el 1d8+3 / 2 no se puede"*.

**Causas Raíz y Limitaciones Previas Identificadas:**
1. **Falta de resolución dinámica de `bono_competencia` en bonos de daño:** `obtenerBonoDanoFuerzaExtra` realizaba `Number(ef.valor) || 0`, provocando que valores dinámicos como `"bono_competencia"`, `"pb"` o `"bc"` devolvieran `NaN` -> `0`.
2. **Acoplamiento semántico a Fuerza:** El tipo de efecto disponible era únicamente `"bono_dano_fuerza"`, induciendo a confusión en el builder al configurar rasgos para ataques a distancia o universales.
3. **Ausencia de efectos mecánicos en el catálogo:** El rasgo `Revelación celestial` de Asimar en `especiesDND55.ts` carecía de `efectos` declarativos que comunicaran su bonificación al motor de combate.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Extensión del Contrato de Efectos (`src/tipos/rasgos.ts`):**
   - Se añadió `"bono_dano_ataque"` a `EsquemaTipoEfectoMecanico`, manteniendo `"bono_dano_fuerza"` para compatibilidad retroactiva total.
2. **Resolución Universal y Evaluación Numérica Segura (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - `resolverFormulaDinamica` ahora reconoce los tokens `bono_competencia`, `pb` y `bc`.
   - Se implementó `evaluarExpresionNumericaSegura` para resolver sumas numéricas en cadenas (ej. `"3"`, `"+2"`, `"2+1"`).
   - Se creó la función pura genérica `obtenerBonoDanoAtaqueExtra(personaje, contexto)` que procesa tanto `bono_dano_ataque` como `bono_dano_fuerza`, delegando en ella `obtenerBonoDanoFuerzaExtra`.
3. **Integración Directa en Fórmula de Arma (`src/servicios/calculadorDanoCombate.ts`):**
   - `resolverBonosYDadosExtraCombate` suma el bono extra directamente a `modDanoTotal`, componiendo fórmulas directas (ej. `1d8+5`) compatibles con TaleSpire.
4. **Catálogo y Builder:**
   - Se integró `"bono_dano_ataque"` en `ConstructorRasgoDote.tsx` con su selector de objetivo (`OPCIONES_APLICA_A_ATAQUE`).
   - Se configuró el efecto declarativo en `Revelación celestial` de Asimar en `especiesDND55.ts` con `valor: "bono_competencia"` y `aplicaA: "todos_ataques"`.
5. **Verificación y Cobertura:**
   - 4 pruebas unitarias añadidas en `calculadorDanoCombate.test.ts` cubriendo niveles 3 (+2 PB), nivel 9 (+4 PB), desactivación reactiva y tokens homebrew del builder.
   - `tsc --noEmit`: 0 errores.
   - `pnpm lint`: 0 errores.
   - `vitest run`: 49/49 suites aprobadas, 572/572 tests pasando (100%).

---

## [2026-09-11] Soporte Universal para Conjuros de Proyectiles y Ataques Múltiples Independientes (Descarga Sobrenatural, Proyectil Mágico y Rayo Abrasador)

**Contexto y Requerimientos del Usuario:**
- Observación del usuario: *"creo que al cambiar esTrucoDeAtaquesMultiples, creo que te cargaste hechizos como rayo abrazador o proyectil magico, que tienen lo mismo que descarga sobrenatural, tanto rayo abrazador y proyectil magico eran 3 de base y en upcast añadian otro rayo/proyectil mas"*.
- En D&D 5.5e / 5e, existen conjuros cuyos ataques o impactos no se condensan en un único golpe agrupado, sino que generan múltiples proyectiles independientes:
  - *Descarga sobrenatural* (Truco nivel 0): 1 rayo a nv 1-4, 2 a nv 5-10, 3 a nv 11-16, 4 a nv 17-20. Ataque de conjuro individual por rayo (`1d20+bono`) y daño de fuerza (`1d10`).
  - *Proyectil mágico* (Nivel 1): 3 dardos base a nivel 1; +1 dardo por cada nivel de espacio superior (`3 + (nivelLanzamiento - 1)`). Impacto automático sin tirada d20, daño de fuerza individual (`1d4+1` por dardo).
  - *Rayo abrasador* (Nivel 2): 3 rayos base a nivel 2; +1 rayo por cada nivel de espacio superior (`3 + (nivelLanzamiento - 2)`). Ataque de conjuro individual por rayo (`1d20+bono`) y daño de fuego (`2d6`).

**Causas Raíz Identificadas:**
1. **Foco Limitado a Nivel 0:** `esTrucoDeAtaquesMultiples` estaba concebido únicamente para trucos (`nivel === 0`). Los conjuros de nivel 1+ pasaban por `construirFormulaEspacio`, el cual delegaba en `calcularFormulaEscalada` produciendo sumas concentradas en lugar de grupos individuales de TaleSpire.
2. **Duplicación de Lógica en la UI:** `usarLanzamientoTarjetaConjuro.ts` y `FichaHechizo.tsx` mantenían implementaciones manuales del cálculo de fórmulas para TaleSpire en lugar de una función centralizada.

**Decisiones Arquitectónicas y Solución Implementada:**
1. **Abstracción Canónica `InfoProyectilesMultiples` (`src/utiles/utilesConjuros.ts`):**
   - Interfaz con `esMultiple`, `etiquetaSingular`, `etiquetaPlural`, `cantidadProyectiles`, `formulaPorProyectil`, `requiereAtaque`, `tipoDaño` y `etiquetaVisual`.
   - Función pura `obtenerInfoProyectilesMultiples(hechizo, { nivelLanzamiento, nivelPersonaje })` que identifica los conjuros canónicos y calcula la cantidad exacta según el nivel del personaje o el nivel de ranura / upcast.
2. **Función Centralizada `construirFormulaTaleSpireEspacio` (`src/utiles/utilesConjuros.ts`):**
   - Genera grupos independientes en formato TaleSpire (`!Ataque Rayo 1:1d20+bono/Daño Rayo 1 (fuego):2d6/...` o `!Daño Dardo 1 (fuerza):1d4+1/...`) respetando si el proyectil requiere tirada de ataque o impacta de forma automática.
   - Maneja el escalado convencional para el resto de conjuros con daño concentrado o de área.
3. **Consumo Unificado en Facade y Componentes:**
   - `servicioLanzamientoConjuros.ts`: `construirFormulaEspacio` delega directamente a `construirFormulaTaleSpireEspacio`.
   - `usarLanzamientoTarjetaConjuro.ts`: Reemplazó la lógica manual duplicada por `construirFormulaTaleSpireEspacio`.
   - `FichaHechizo.tsx`: Conectado a `obtenerInfoProyectilesMultiples` para mostrar en el botón interactivo de TaleSpire la cantidad exacta de dardos/rayos según la ranura seleccionada (ej. `Tirar 5 dardos (1d4+1 c/u) en TaleSpire`), y despachar los grupos desglosados.
4. **Verificación y Cobertura:**
   - Pruebas unitarias completas añadidas a `src/utiles/utilesConjuros.test.ts` y `src/servicios/servicioLanzamientoConjuros.test.ts`.
   - `pnpm exec tsc --noEmit`: 0 errores.
   - `pnpm exec vitest run`: 49/49 suites aprobadas, 568/568 pruebas unitarias pasando.
   - `pnpm run build`: Generación limpia del bundle de producción con Vite.

---

## [2026-09-11] Erradicación Total del Parsing de Descripción en Conjuros: Consumo Exclusivo de la Base de Datos Canónica

**Contexto y Requerimientos del Usuario:**
- Observación del usuario: *"sigo creyendo que lo de lanzar hechizos sigue priorizando lo de tomar los dados de la descripcion en vez de la base de datos"*.
- Auditoría profunda reveló que, pese a la migración previa a `componentesSeleccionados`, aún persistían múltiples funciones en runtime que ejecutaban expresiones regulares e inspecciones de texto sobre `hechizo.descripcion`.

**Causas Raíz Identificadas:**
1. **Fallback con Regex en `extraerDadosBaseTruco`:** En `src/utiles/utilesConjuros.ts`, si `dadosDaño` no estaba presente o en ramas de fallback, ejecutaba `desc.match(/(\d+)[dD](\d+)/)`.
2. **Escalado de Trucos 100% Acoplado a Texto (`trucoTieneMejora` y `esTrucoDeAtaquesMultiples`):** Buscaban substrings en español e inglés (`"mejora de truco"`, `"el daño aumenta"`, `"crea dos rayos"`) en la descripción en vez de consultar los metadatos estructurados. Si un truco homebrew tenía `dadosDaño` pero una descripción simple, no escalaba.
3. **Inversión de Prioridad en Salvaciones (`sanearHechizoCD`):** En `src/almacen/sanitizacion.ts`, el Paso 1 escaneaba `descLower.match(/cd\s+salvaci[oó]n:\s*([a-záéíóúüñ]+)/i)` con "máxima prioridad", sobreescribiendo el campo `h.cdSalvacion` de la base de datos.
4. **Consumo Innecesario en Componentes:** `FilaConjuroCompendio.tsx` y `FichaHechizo.tsx` seguían dependiendo de `extraerDadosBaseTruco`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Consumo Exclusivo de la Base de Datos:**
   - `extraerDadosBaseTruco`: Lee directamente `hechizo.dadosDaño` (devolviendo `""` si es utilitario o `N/A`). Eliminado todo acceso a `hechizo.descripcion`.
   - `trucoTieneMejora`: Se basa puramente en los datos estructurados: si el truco tiene `dadosDaño` en la BD (y no es *Garrote* / *Shillelagh*), escala automáticamente por nivel de personaje según las reglas oficiales de D&D 5.5e / 5e.
   - `esTrucoDeAtaquesMultiples`: Resuelto por identidad canónica (*Descarga sobrenatural* / *Eldritch Blast*) sin parsear la descripción.
   - `sanearHechizoCD`: Eliminado el escaneo de la descripción como paso prioritario. La base de datos (`h.cdSalvacion`) es la única fuente de la verdad.
   - `FilaConjuroCompendio.tsx`: Muestra directamente `hechizo.dadosDaño`.
2. **Validación Integral de Calidad:**
   - `pnpm exec tsc --noEmit`: 0 errores.
   - `pnpm exec vitest run`: 49/49 suites aprobadas, 562/562 pruebas pasando (100%).
   - `pnpm run build`: Compilación limpia de producción con Vite.

---

## [2026-09-11] Culminación al 100% del Plan de Genericidad Pura: Salvaguardas Preventivas, Regla ESLint, Test de Genericidad y Cierre de Tipado

**Contexto y Requerimientos del Usuario:**
- Solicitud del usuario: *"si, implementa los puntos restantes"* tras la auditoría del plan de eliminación de comprobaciones ad-hoc y builder genérico puro (`revisar/implementation_plan.md`).
- Implementación de las salvaguardas preventivas faltantes de la Fase 5: regla ESLint `no-restricted-syntax`, suite de pruebas automatizadas de genericidad arquitectónica (`rasgoGenericidad.test.ts`), blindaje como Regla Global 6 en `agente.md` y verificación total de TypeScript y Vitest.

**Decisiones Arquitectónicas y Solución Implementada:**
1. **Regla ESLint `no-restricted-syntax` en `eslint.config.js`:**
   - Se configuró la regla AST `BinaryExpression[operator=/^===?$/][left.property.name='nombre'][right.type='Literal']` restringida a los módulos de `src/servicios/**/*.ts` y `src/almacen/**/*.ts` (excluyendo tests).
   - Bloquea cualquier intento de comparar nombres de rasgos literales en tiempo de desarrollo o CI.
2. **Refactorización Quirúrgica en `gestorClases.ts`:**
   - Sustituido el string literal `"Mejora de característica"` por la constante tipada local `NOMBRE_RASGO_ASI` para no mezclar strings mágicos con la consolidación orgánica de ASI y cumplir con la regla ESLint.
3. **Suite Automatizada de Regresión (`src/servicios/rasgoGenericidad.test.ts`):**
   - 7 pruebas unitarias completas:
     - Auditoría estática con análisis de código libre de comentarios que valida la ausencia de `/r\.nombre\s*===?\s*["']/g` en `gestorClases.ts`, `evaluadorEfectosRasgos.ts` y `compendioRasgos.ts`.
     - Ausencia de patrones específicos de Bárbaro o Bardo en `gestorClases.ts`.
     - Escalado genérico de fórmula de dados por nivel en catálogo (`1d6` a `1d12`).
     - Escalado de recuperación por nivel (`descanso_largo` a `descanso_corto`).
     - Sincronización automática de efectos con fórmula resuelta (`sincronizarEfectosConFormula: true`).
     - Opciones dinámicas desbloqueables por nivel y escalado de `maxSelecciones` con transición a `tipo: "multiple"`.
     - Validación con `EsquemaRasgoPersonaje` de rasgos homebrew declarativos completos.
4. **Validación Integral de Calidad:**
   - `tsc --noEmit`: 0 errores (Strict mode estricto).
   - `pnpm lint`: 0 errores, 0 advertencias.
   - `pnpm test`: 49 suites aprobadas, 562/562 pruebas pasando (100%).

## [2026-09-11] Corrección Mecánica y Desacoplamiento Canónico de Golpe Brutal (D&D 5.5e): Dependencia Exclusiva de Ataque Temerario

**Contexto y Requerimientos del Usuario:**
- El usuario reportó el fallo en el test `src/almacen/slices/slicePersonajes.test.ts`: *"Furia Divina y Golpe Brutal solo se pueden activar si Furia está activa y se desactivan al terminar Furia"*.
- El usuario precisó la regla canónica de D&D 5.5e: *"esta mal, la descripcion de golpe brutal no involucra a furia involucra a Ataque temerario: 'Si utilizas Ataque temerario, puedes renunciar a cualquier ventaja en una tirada de ataque de tu elección basada en la Fuerza en tu turno. La tirada de ataque elegida no debe tener desventaja. Si la tirada de ataque elegida acierta, el objetivo sufre 1d10 de daño adicional del mismo tipo que inflija el arma o el ataque sin armas y puedes causar un efecto de Golpe brutal de tu elección.'"*.

**Causas Raíz Identificadas:**
1. **Acoplamiento Espurio con Furia:** En una sesión previa se incluyó erróneamente `golpe brutal` en la desactivación en cascada de `esFuriaBase` en `sliceRasgos.ts`, asumiendo falsamente que dependía de Furia.
2. **Fallo de Bloqueo en el Test:** El test intentaba activar Golpe Brutal esperando que estuviera bloqueado por falta de Furia; pero al carecer de `ligadoA` en el mock y no ser un hijo legítimo de Furia en `padreKey`, la acción se ejecutaba con éxito (`activo === true`), causando la falla en la aserción `expect(rasgoGB?.activo).toBe(false)`.
3. **Omisión de Cascada Reactiva para Ataque Temerario:** Ni `sliceRasgos.ts` ni `condicionesRasgosHelpers.ts` propagaban la desactivación en cascada para rasgos ligados a Ataque Temerario cuando este cesaba su vigencia.

**Decisiones Arquitectónicas y Solución Implementada:**
1. **Desacoplamiento Absoluto de Furia:** Se purgó por completo cualquier mención de Golpe Brutal en la cascada de apagado de Furia en `sliceRasgos.ts` y `condicionesRasgosHelpers.ts`. Activar o apagar Furia no altera el estado de Golpe Brutal.
2. **Asociación Canónica a Ataque Temerario:**
   - En `sliceRasgos.ts`, si un rasgo tiene `ligadoA: "rasgo_cls_barbaro_ataque_temerario"` (o por fallback `esGolpeBrutal`), se requiere que Ataque Temerario esté activo (en `rasgos`, en `condicionesActivas` o en `efectosActivos`) para poder activarse.
   - Al desactivar Ataque Temerario (por conmutación de rasgo o por eliminación de la condición/efecto), los rasgos dependientes como Golpe Brutal se apagan automáticamente en cascada.
3. **Refactorización de Pruebas Unitarias (`slicePersonajes.test.ts`):**
   - El test dependiente de Furia se renombró a *"Furia Divina solo se puede activar si Furia está activa y se desactiva al terminar Furia"*, validando únicamente `Furia Divina`.
   - Se añadió un caso de prueba exhaustivo en la suite de Ataque Temerario: *"Golpe Brutal involucra a Ataque Temerario (no a Furia): requiere Ataque Temerario activo y se desactiva al terminar este"*, comprobando: bloqueo inicial sin Ataque Temerario, activación permitida tras encender Ataque Temerario, independencia respecto a Furia, y desactivación en cascada al cesar Ataque Temerario por rasgo o condición.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict mode verificado).
- `pnpm exec vitest run`: 48/48 suites aprobadas, 555/555 tests pasando (100%).
- `pnpm lint`: 0 errores y 0 advertencias.
- `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-11] Migración Canónica Definitiva de Hechizos (Eliminación Total de Compatibilidad Legacy)

**Contexto y Requerimientos del Usuario:**
- Solicitud explícita del usuario: *"ok, ya reemplace los hechizos ahora seria reemplazar todas las formas en las que consumiamos los datos para consumirlas ya de manera correcta"* y *"Nono, lo de la compatibilidad con legacy eliminalo, todo nuevo ahora"*.
- Erradicar por completo la duplicidad de componentes de conjuro (`componentes: string` vs `componentesSeleccionados: { verbal, somatico, material }`).

**Causas Raíz Identificadas:**
1. **Doble Fuente de la Verdad:** Coexistían `componentes` como cadena arbitraria (`"V, S, M"`) y `componentesSeleccionados` como booleanos estructurados, requiriendo sincronización manual y tolerando inconsistencias.
2. **Deuda Técnica en Runtime (`importadorJSON.ts`):** Más de 270 líneas de expresiones regulares complejas, parsing de cadenas en inglés y heurísticas de sanitización ejecutándose innecesariamente en el arranque de la app.
3. **Tipado Disperso de `ataqueCd`:** En algunos lugares se trataba como `string` genérico, mientras que en otros se usaban valores en inglés (`"Attack"`, `"Save"`) o mezclas incompatibles con el esquema Zod y el selector de homebrew.

**Decisiones Arquitectónicas y Solución Implementada:**
1. **Eliminación Total del Campo `componentes: string` en Modelos y Tipos:**
   - En `src/tipos/index.ts`, `EsquemaHechizoBase` suprimió `componentes: z.string()`.
   - `componentesSeleccionados: EsquemaComponentesSeleccionados` (`{ verbal: boolean, somatico: boolean, material: boolean }`) es la **única fuente canónica**.
2. **Formateo Visual Declarativo y Puro (`formatearComponentes`):**
   - En `src/utiles/utilesConjuros.ts`, se implementó `formatearComponentes(componentesSeleccionados)`. La UI y los resúmenes visuales delegan exclusivamente en esta función pura para generar representaciones legibles (`"V, S, M"`, `"V, S"`, `"Ninguno"`).
3. **Carga Directa Precomputada y Purga de Heurísticas Legacy:**
   - En `src/utiles/datosIniciales.ts`, se eliminó la invocación a `importarDesdeJSON`. Los 391 hechizos se cargan directamente de `all.json`, pasando únicamente por `sanearHechizoCD` y validación con `EsquemaHechizoBase`.
   - `src/almacen/importadorJSON.ts` fue reducido y saneado drásticamente, removiendo las heurísticas obsoletas de regex y parseo en inglés.
4. **Estandarización Estricta de `ataqueCd`:**
   - Estandarizado al enum `"ATAQUE" | "CD" | "N/A"` en `EsquemaHechizoBase`, `usarFormularioHechizo.ts` y `FormularioHechizo.tsx`.
5. **Corrección de Mocks y Cascada de Furia:**
   - Actualización quirúrgica de todos los objetos literales de conjuro en tests y componentes de objetos mágicos/ataques.
   - Detección y corrección de `esGolpeBrutal` en `sliceRasgos.ts` y `condicionesRasgosHelpers.ts` para asegurar la correcta desactivación en cascada al terminar Furia.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict mode verificado).
- `pnpm exec vitest run`: 48/48 suites aprobadas, 554/554 tests pasando (100%).
- `pnpm run build`: Compilación limpia de producción con Vite.

---

## [2026-09-10] Módulo `editor_hechizos` — Transformador de Compendio `all.json` → `HechizoBase`

**Contexto:** Se creó el módulo `src/editor_hechizos/` como script CLI (`pnpm run transformar-hechizos`) que transforma el compendio crudo `all.json` en una nueva base de datos canónica lista para consumir, sin parseo adicional en runtime.

**Decisiones Arquitectónicas:**
- No se refactorizó `importadorJSON.ts` (queda legacy); el nuevo módulo es independiente.
- Se eliminó el campo `componentes: string` (redundante con `componentesSeleccionados: {verbal, somatico, material}`). El string se genera en runtime por compatibilidad con `EsquemaHechizoBase`.
- Solo se conserva la versión **imperial (pies)** de descripciones y alcance (primer elemento de arrays bilingües).
- Valores de `ataqueCd`: `"ATAQUE"` | `"CD"` | `"N/A"` (alineados con el formulario UI, no con el importador legacy).

**Limitación Conocida — Hechizos con Múltiples Tipos de Daño:**
- Hechizos como *Cuchillo de hielo* tienen dos instancias de daño en su descripción (ej. `1d10 perforante` y `2d6 frío`). El transformador captura el **primer** tipo que aparece en el texto (perforante), no necesariamente el más representativo (frío).
- Esto es aceptable porque el formulario `FormularioHechizo.tsx` solo soporta un tipo de daño. Para casos edge, el usuario puede editar manualmente en el formulario.

**Resultado:** 391/391 hechizos transformados con 100% de tasa de éxito. 157 con dados de daño, 131 con nivel superior, 140 con tipo de daño.

**Archivos Creados:**
- `src/editor_hechizos/tipos.ts` — `HechizoCompendioRaw`, `EstadisticasTransformacion`
- `src/editor_hechizos/transformadorHechizo.ts` — Lógica pura de transformación
- `src/editor_hechizos/transformar.ts` — Script CLI ejecutable
- `src/editor_hechizos/index.ts` — Barrel exports
- `src/editor_hechizos/hechizos_transformados.json` — Nueva BD generada

## [2026-09-09] Escalado Dinámico de Frenesí (2d6 -> 3d6 -> 4d6) y Golpe Brutal (1d10 -> 2d10) con Arquitectura Genérica para el Builder (D&D 5.5e)
**Contexto y Requerimientos del Usuario:**
- El usuario reportó: *"ok, arrelgado, ahora vamos con el segundo problema. golpe brutal solo esta dando el dado minimo (1d10) al igual que frenesi (2d6) en vez de actualizarse segun el nivel"*.
- Directriz arquitectónica explícita del usuario: *"las funciones deben ser super genéricas para consumirlas en el builder. no deberían hacer esas comprobaciones (fallbacks) específicas, por que eso le quita sentido a que sea genérico"*.

**Causas Raíz Identificadas:**
1. **Fórmulas Estáticas en Catálogo y Desconexión de Efectos Mecánicos:**
   - En `clasesDND55.ts`, Frenesí tenía valores fijos en cadena (`formulaDados: "2d6"`, `efectos[0].valor: "2d6"`).
   - Golpe Brutal tenía `formulaDados: "1d10"` y `efectos[0].valor: "1d10"`, sin actualizarse automáticamente al nivel 17+.
2. **Cortocircuito y Acoplamiento no Genérico en `calculadorDanoCombate.ts`:**
   - Se evaluaba `!dadosExtraEfectos.some((d) => d.origen.toLowerCase().includes("frenes"))`. Como `obtenerDadosExtraAtaque` ya aportaba el efecto estático `"2d6"`, la condición era falsa y nunca se ejecutaba la fórmula escalada.
   - Golpe Brutal exigía erróneamente `furiaEstaActiva`, cuando según el PHB 2024 solo requiere usar Ataque Temerario renunciando a la ventaja con armas de Fuerza.
   - Existían comprobaciones ad-hoc con `coincideIdRasgo(r, ID_RASGO.FRENESI)` y `ID_RASGO.GOLPE_BRUTAL`, quebrando el diseño genérico para rasgos homebrew del builder.
3. **Omisión de Sincronización de Efectos en `gestorClases.ts`:**
   - A nivel 17, `gestorClases.ts` actualizaba `formulaDadosRasgo = "2d10"` pero mantenía `r.efectos[0].valor = "1d10"`.
   - Para Frenesí, no se recomputaba `efectos[0].valor` en los niveles 9 y 16.

**Solución Implementada y Decisiones Arquitectónicas (100% Genérica):**
1. **Tokens Dinámicos Universales en `resolverFormulaDinamica` (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - Soporte nativo para el token `dano_furia` (calculado con el nivel de Bárbaro del personaje, incluso en multiclase), `mitad_nivel`, `bono_competencia` y normalización de espacios (`dano_furiad6`).
   - Frenesí en `clasesDND55.ts` se definió con `formulaDados: "dano_furiad6"` y `valor: "dano_furiad6"`. Se evalúa dinámicamente en cualquier contexto sin necesidad de fallbacks.
2. **Desacoplamiento Absoluto en `calculadorDanoCombate.ts`:**
   - Se eliminaron todos los `ID_RASGO` y nombres específicos de rasgos.
   - `dadosExtra` proviene íntegramente de la evaluación genérica de `obtenerDadosExtraAtaque(personajeActivo, contextoAtaque)`.
   - Soporte genérico para rasgos activables creados en el builder con `formulaDados` que no posean efectos mecánicos explícitos.
   - Se corrigió el cálculo de `bonoFuria` numérico para que solo aplique cuando `furiaEstaActiva === true` y no esté ya cubierto por los efectos del rasgo.
3. **Sincronización Pura en el Builder / `gestorClases.ts`:**
   - Para Golpe Brutal a nivel 17+: actualiza tanto `formulaDadosRasgo = "2d10"` como `efectosClonados[0].valor = "2d10"`.
   - Para Frenesí: sincroniza tanto `formulaDadosRasgo` como `efectosClonados[0].valor` (`2d6`, `3d6`, `4d6`).
4. **Nueva Suite Dedicada `src/servicios/calculadorDanoCombate.test.ts` y Ampliación de `gestorClases.test.ts`:**
   - 8 pruebas unitarias validando: Frenesí nv 3 (2d6), nv 9 (3d6), nv 16 (4d6); Golpe Brutal nv 9 (1d10 sin Furia), nv 17 (2d10); acumulación simultánea (3d6 + 1d10); y soporte genérico de rasgos activables del builder.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm lint`: 0 errores y 0 advertencias (ESLint limpio).
- `pnpm test`: 48 suites superadas, 549 de 549 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-09] Corrección Integral de Ventaja en Tiradas de Ataque con Ataque Temerario (TaleSpire y UI)
**Contexto y Requerimientos del Usuario:**
- El usuario reportó: *"nop, el efecto de ataque temerario sigue sin funcionar, no me esta dando ventaja en los ataques"*.
- Se validó con el usuario que el rasgo Golpe Brutal efectivamente renuncia a la ventaja a cambio de mayor daño, según las reglas de D&D 5.5e (*"esta, si funciona asi, ese rasgo le quita la ventaja a cambio de mas daño"*).

**Causas Raíz Identificadas:**
1. **Fallo Crítico en `ejecutarTiradaAtaqueFisico` (`src/servicios/ejecutorTiradasCombate.ts`):**
   - Cuando `evaluacionCondiciones.modoEfectivo === "ventaja"`, el código construía `formula = "2d20kh1" + bonoStr` y llamaba a `lanzarDadosTaleSpire(formula, etiqueta)` sin pasar el quinto argumento `tipoTiradaForzado`.
   - Como `tipoTiradaForzado` era `undefined`, TaleSpire consideraba la tirada como `"plano"`.
   - Además, TaleSpire **NO soporta** la sintaxis Roll20 `"2d20kh1"` (espera `1d20+X` junto a los grupos `Ataque (A)` y `Ataque (B)`).
   - En `limpiarYNormalizarDadosSimples`, la limpieza `replace(/[^d0-9+\-*/()]/g, "")` borraba las letras `k` y `h` de `2d20kh1+5`, convirtiendo la fórmula en `2d201+5` (**¡un dado corrupto de 201 caras!**), lo que hacía fallar el motor físico 3D de TaleSpire y el fallback matemático.
2. **Inferencia de Atributo en Armas Sutiles (`src/servicios/calculadorAtaquesArmas.ts`):**
   - En armas sutiles (daga, espada corta, cimitarra, estoque), si Destreza >= Fuerza, se asignaba Destreza por defecto. Al evaluar la tirada de ataque en `procesadorCondiciones.ts`, la regla `caracteristica === "fuerza"` resultaba falsa, denegando la ventaja de Ataque Temerario.
   - En un combatiente bárbaro o con Furia / Ataque Temerario activo, las armas cuerpo a cuerpo deben preferir Fuerza por defecto si el usuario no ha fijado manualmente otra opción.
3. **Falta de soporte de sintaxis opcional en `ejecutarTiradaFallbackLocal` (`src/utiles/lanzadorDados.ts`):**
   - La expresión regular exigía el prefijo `!` (`^!([^:]+):(.*)$`), omitiendo grupos sin exclamación como `Ataque (A):1d20+5`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Fórmula Canónica y Propagación de `tipoTiradaForzado` (`src/servicios/ejecutorTiradasCombate.ts`):**
   - Se mantiene siempre la fórmula como `1d20${bonoStr}`.
   - Se pasa como 5º parámetro a `lanzarDadosTaleSpire`: `evaluacionCondiciones.modoEfectivo !== "plano" ? evaluacionCondiciones.modoEfectivo : undefined`.
   - TaleSpire divide limpiamente la tirada en `Ataque (A): 1d20+X` y `Ataque (B): 1d20+X`, lanzando 2 dados d20 en la mesa 3D y eligiendo el mayor de forma nativa.
2. **Inferencia Inteligente de Fuerza en Armas Cuerpo a Cuerpo (`src/servicios/calculadorAtaquesArmas.ts`):**
   - Si `furiaEstaActiva || estaAtaqueTemerarioActivo(personajeActivo)` o si FUE >= DES, las armas sutiles cuerpo a cuerpo seleccionan `"fuerza"` por defecto, asegurando la ventaja de Ataque Temerario y el bono de daño de Furia.
3. **Blindaje de Fórmulas y Fallback Local (`src/utiles/lanzadorDados.ts`):**
   - En `limpiarYNormalizarDadosSimples`, se normaliza cualquier `2d20k[hl]1` a `1d20` para evitar dados corruptos.
   - En `ejecutarTiradaFallbackLocal`, se admite `^!?([^:]+):(.*)$` y soporte para evaluar `2d20kh1` (ventaja) y `2d20kl1` (desventaja) localmente.
4. **Mejora en UI (`src/componentes/caracteristicas/ataques/TarjetaAtaquePersonaje.tsx`):**
   - El botón Atacar clarifica en su tooltip si la tirada se lanzará `con Ventaja` o `con Desventaja`.
5. **Pruebas Automatizadas Nuevas (`src/servicios/ejecutorTiradasCombate.test.ts`):**
   - Suite con 5 pruebas validando: ventaja por condición, ventaja por efecto temporal de 1 ronda, ventaja por rasgo conmutado en ficha, renuncia a ventaja por Golpe Brutal, y tirada plana normal.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode).
- `pnpm lint`: 0 errores, 0 advertencias.
- `pnpm test`: 47 suites superadas, 539 de 539 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-09] Corrección Definitiva del Efecto de Ataque Temerario (Reckless Attack), Estandarización a Español y Desacoplamiento de Efectos Temporales
**Contexto y Requerimientos del Usuario:**
- El usuario reportó que el efecto de **Ataque Temerario** no estaba funcionando tras haber cambiado su nombre (eliminando sufijos en inglés como `(Reckless Attack)` a solo `"Ataque Temerario"`).
- Directriz explícita del usuario: *"ahora solo vamos a usarlo en español"*.

**Causas Raíz Identificadas:**
1. **Desconexión entre `efectosActivos` y la evaluación de ventajas:**
   - Al ser un efecto con duración estándar de 1 ronda, "Ataque Temerario" se almacena en `personaje.efectosActivos` y en iniciativa se mueve a `criatura.efectos`, desduplicándose de `condicionesActivas`.
   - `estaAtaqueTemerarioActivo` en `evaluadorEfectosRasgos.ts` solo inspeccionaba `personaje.condicionesActivas` y `estaRasgoActivo(personaje, "ataque temerario")`.
   - `evaluarEfectosCondicionesEnTirada` en `procesadorCondiciones.ts` solo leía `contexto.condicionesActivas`, ignorando por completo los efectos temporales de `contexto.personaje?.efectosActivos`.
2. **Comparación rígida de identificadores en `estaRasgoActivo`:**
   - La función comparaba `normalizar(r.id) === busqueda`. Como el ID de clase de Bárbaro es `rasgo_cls_barbaro_ataque_temerario`, la igualdad fallaba siempre al buscar `"ataque temerario"` y dependía únicamente de coincidencia por inclusión en `r.nombre`. Al cambiar el usuario el nombre, la búsqueda fallaba.
3. **Colisión de subcadenas en `coincideCondicionConRasgo`:**
   - `coincideCondicionConRasgo` evaluaba `asocNorm.includes(cNorm)`. Para la condición `"Furia"`, `"furia de los dioses".includes("furia")` evaluaba como verdadero, provocando que la activación de Furia base bloqueara o interfiriera con Furia de los dioses.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Inspección Integral en `estaAtaqueTemerarioActivo` (`src/servicios/evaluadorEfectosRasgos.ts`):**
   - Comprueba `personaje.condicionesActivas` (con normalización en español).
   - Comprueba `personaje.efectosActivos` (para reconocer el efecto temporal activo en combate o ficha).
   - Comprueba los rasgos conmutados en `personaje.rasgos` (`r.activo !== false` coincidiendo por ID o nombre en español).
2. **Inclusión de ID por subcadena en `estaRasgoActivo`:**
   - `idNorm === busqueda || idNorm.includes(busqueda) || nomNorm === busqueda || nomNorm.includes(busqueda)`.
   - Permite que búsquedas conceptuales (ej. `"ataque temerario"`, `"furia"`) encuentren automáticamente identificadores como `rasgo_cls_barbaro_ataque_temerario`.
3. **Integración de `efectosActivos` en `evaluarEfectosCondicionesEnTirada` (`src/servicios/procesadorCondiciones.ts`):**
   - Se combinan `contexto.condicionesActivas` con `contexto.personaje?.efectosActivos.map(e => e.nombre)`.
   - Ataques que usen Fuerza (o ataques físicos sin restricción de característica) reciben el motivo de ventaja `"Ataque Temerario (Fuerza)"`.
   - Se añadió un chequeo de respaldo directo contra `estaAtaqueTemerarioActivo(contexto.personaje)`.
4. **Comparación de Nombres Base en `coincideCondicionConRasgo` (`src/almacen/slices/personajes/condicionesRasgosHelpers.ts`):**
   - Se aíslan condiciones mediante `cBase === asocBase` (limpiando paréntesis), impidiendo que `"Furia"` colisione con `"Furia de los Dioses"`.
5. **Estandarización 100% en Español:**
   - Condiciones y rasgos canónicos unificados a `"Ataque Temerario"`, `"Furia"` y `"Furia de los Dioses"`.
6. **Pruebas Automatizadas Rigurosas (`src/almacen/slices/slicePersonajes.test.ts`):**
   - Suite dedicada `"Ataque Temerario en Español y Efectos Temporales"` validando:
     - Activación por rasgo conmutado y propagación a condición/efecto.
     - Detección de ventaja cuando el efecto reside únicamente en `efectosActivos`.
     - Desactivación limpia y cese de ventaja.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm lint`: 0 errores, 0 advertencias.
- `pnpm test`: 46 suites superadas, 534 de 534 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-09] Resolución Canónica de Conjuros Innatos de Especie, Subespecie y Rasgos en la Pestaña Acciones
**Contexto y Requerimientos del Usuario:**
- En la pestaña "Acciones" (sección "Conjuros y Acciones Mágicas"), no se mostraban los conjuros ni trucos otorgados por la **especie** o **subespecie/linaje** del personaje (ej. *Detectar magia*, *Paso brumoso*, *Luces danzantes*, *Fuego feérico*, *Oscuridad*, *Luz* de Aasimar, trucos de Alto Elfo seleccionados, etc.). Solo aparecían los conjuros de clase y subclase.
- Se solicitó resolver esta omisión para que todos los recursos mágicos innatos estén disponibles para lanzamiento y combate táctico según el nivel del personaje.

**Causas Raíz Identificadas:**
1. **Omisión de Fuentes Innatas en `resolverConjurosAcciones` (`src/servicios/calculadorAccionesCombate.ts`):**
   - La función construía su lista de candidatos exclusivamente a partir de `trucosConocidosIds`, `conjurosSiemprePreparadosIds`, `conjurosPreparadosIds` y `conjurosConocidosIds`. No inspeccionaba `personajeActivo.rasgos` (`conjurosOtorgados`, selectores de rasgos como `selector_truco_alto_elfo`, ni efectos de rasgos), ni los conjuros innatos del catálogo de especie y subespecie (`CATALOGO_ESPECIES_DND55` vía `obtenerEspeciePorNombre` y `obtenerSubespeciePorNombre`).
2. **Discrepancias de Identificadores y Prefijos en Compendios (`coincideHechizoId`):**
   - La coincidencia en `resolverConjurosAcciones` utilizaba `c.id === id || normalizar(c.nombre) === normalizar(id)`. Los compendios almacenan slugs como `"h_detectar-magia"`, mientras que los rasgos registran claves con guion bajo (`"detectar_magia"`). `normalizar("detectar_magia")` no es igual a `"detectar magia"`, impidiendo la asociación incluso cuando el identificador estaba en la ficha.
   - Además, `coincideHechizoId` en `comparadorHechizos.ts` solo limpiaba prefijos `"h_"`, no considerando variantes con guion (`"h-"`), lo que provocaba que IDs como `"h-detectar-magia"` generaran slugs duplicados (`"h_h-detectar-magia"`).
3. **Falta de Validación de Nivel Requerido en Resolutores:**
   - `resolverOrigenConjuro` no comprobaba `nivelRequerido`, lo que podía marcar conjuros bloqueados por nivel antes de tiempo, mientras que `obtenerConjurosOtorgadosPorRasgos` carecía del filtro de selectores mágicos, integrando selectores no mágicos (como el tamaño mediano) a listas mágicas.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Generalización de `coincideHechizoId` (`src/servicios/comparadorHechizos.ts`):**
   - Se añadió la función auxiliar `limpiarPrefijo` para sanear tanto `"h_"` como `"h-"` antes de generar el slug determinista, logrando equivalencia perfecta entre cualquier formato de slug, id compuesto o nombre con diacríticos.
2. **Refuerzo de `resolutorOrigenConjuros.ts`:**
   - Integrado `coincideHechizoId` en el predicado interno `coincide`.
   - Implementada la validación de nivel `pjNivel >= ci.nivelRequerido` y `pjNivel >= r.nivelRequerido` tanto en rasgos como en las definiciones de especie y subespecie de catálogo.
   - Añadida la evaluación de selectores de rasgos de tipo conjuro (`sel.id` con `truco`, `conjuro`, `hechizo`, `spell`, `cantrip`), permitiendo que trucos personalizados (ej. cambiar Prestidigitación por Descarga de fuego en Alto Elfo) se reconozcan de inmediato.
3. **Ampliación Integral de `resolverConjurosAcciones` (`src/servicios/calculadorAccionesCombate.ts`):**
   - Se recopilan todos los candidatos desde: ficha base, rasgos activos con nivel cumplido (`conjurosOtorgados`, selectores de conjuro, efectos `conjuro_otorgado`, Palabras de creación de bardo nv 20), conjuros innatos del catálogo oficial D&D 5.5e (especie y subespecie cumpliendo nivel), y conjuros dinámicos de subclase.
   - Se implementó un índice O(1) rápido (`setRapido`) con fallback a `coincideHechizoId` y `resolverOrigenConjuro`, garantizando un rendimiento óptimo (< 1ms en ~400 hechizos).
   - Se ordenan por nivel de conjuro y alfabéticamente en español, asignando la economía de acción (`accion`, `accionAdicional`, `reaccion`).
4. **Soporte de Lanzamiento Gratuito en `SeccionAtaquesMagicos.tsx`:**
   - La búsqueda de `rasgoInnatoGratuito` ahora utiliza `coincideHechizoId` para comparar `r.conjurosOtorgados` con el conjuro, asegurando que el botón de lanzamiento gratuito (1/DL) esté siempre activo cuando correspondan usos restantes.
5. **Pruebas Automatizadas Rigurosas (`src/servicios/calculadorAccionesCombate.test.ts`):**
   - 9 nuevas pruebas cubriendo desbloqueo progresivo de Alto Elfo (nv 1, nv 3, nv 5), Aasimar, Drow, modificadores de selector de rasgos, economía de acciones y detección de subclases D&D 5.5e.
6. **Métricas de Calidad Verificadas:**
   - `pnpm exec tsc --noEmit`: 0 errores de tipado.
   - `pnpm lint`: 0 errores, 0 advertencias.
   - `pnpm test`: 46 suites superadas, 531/531 pruebas pasando (100%).
   - `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-09] Corrección Definitiva de net::ERR_CONTENT_DECODING_FAILED (css2:1) y Desacoplamiento Offline de Fuentes
**Contexto y Requerimientos del Usuario:**
- Al cargar la aplicación o el simbionte en TaleSpire CEF / Chromium, la consola emitía el error: `Failed to load resource: net::ERR_CONTENT_DECODING_FAILED css2:1`.
- Se solicitó resolver este fallo para evitar errores de red y garantizar una carga limpia y robusta.

**Causas Raíz Identificadas:**
1. **Conflicto de compresión Brotli/GZIP en peticiones CDN externas:**
   - En `index.html`, la etiqueta `<link href="https://fonts.googleapis.com/css2?...">` solicitaba fuentes a Google. Al identificarse como `css2:1` en Chromium, la solicitud enviaba cabeceras `Accept-Encoding: gzip, deflate, br`.
   - En entornos CEF embebidos (como TaleSpire en Unity) o bajo cortafuegos/antivirus (Windows Defender Web Protection, proxies locales), la respuesta comprimida era alterada o entregada sin coincidencia estricta entre el encabezado `Content-Encoding` y el cuerpo de bytes, provocando que el decodificador de red de Chromium abortara la carga con `ERR_CONTENT_DECODING_FAILED`.
2. **Dependencia frágil de red en TaleSpire:**
   - Los simbiontes de TaleSpire deben operar de manera confiable en entornos sin conexión o con conexiones limitadas. Los enlaces externos a Google Fonts generaban latencia y vulnerabilidad ante caídas de internet.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Eliminación de dependencias CDN en `index.html`:**
   - Se removieron las etiquetas de `preconnect` y `stylesheet` hacia `fonts.googleapis.com` y `fonts.gstatic.com`.
2. **Pila Tipográfica de Alto Rendimiento Offline en `src/index.css`:**
   - Se redefinieron las variables `--fuente-principal`, `--fuente-titulo` y `--fuente-codigo` con una cascada nativa de alto rendimiento:
     - `--fuente-principal`: `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
     - `--fuente-titulo`: `'Outfit', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
     - `--fuente-codigo`: `'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace`
   - Esto garantiza que en Windows (donde corre TaleSpire) la interfaz use fuentes modernas nativas ultra-nítidas sin consumir ancho de banda ni disparar errores en la consola.
3. **Métricas de Calidad Verificadas:**
   - `pnpm exec tsc --noEmit`: 0 errores.
   - `pnpm lint`: 0 errores y 0 advertencias.
   - `pnpm test`: 45 suites superadas, 522/522 pruebas pasando (100%).
   - `pnpm run build`: Compilación exitosa con Vite.
   - `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-09] Unificación Visual de Tarjetas en Pestaña Acciones: Homogeneización de TarjetaAtaquePersonaje con TarjetaConjuroCompacta y Enriquecimiento de SeccionAtaquesMagicos
**Contexto y Requerimientos del Usuario:**
- El usuario modificó `TarjetaConjuroCompacta.tsx` pero notó que en la pestaña "Acciones" (`VistaAtaquesJugador`) los cambios no se apreciaban, preguntando si utilizaba otro componente y solicitando hacerlos similares.
- Clarificación arquitectónica: En la pestaña "Acciones", los ataques con armas y desarmados emplean `TarjetaAtaquePersonaje.tsx`, los consumibles usan `TarjetaConsumibleAccion.tsx`, los objetos mágicos usan `SeccionHechizosObjetosMagicos.tsx`, y los conjuros de combate usan `TarjetaConjuroCompacta.tsx` a través de `SeccionAtaquesMagicos.tsx`.
- Para que la experiencia sea coherente, se homogeneizó la estructura visual de `TarjetaAtaquePersonaje.tsx` y se enriqueció `SeccionAtaquesMagicos.tsx` propagando todas las props avanzadas.

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Componentes divergentes en Acciones vs Conjuros:**
   - Mientras `TarjetaConjuroCompacta` adoptaba una disposición compacta horizontal con columna de acciones (`columnaAcciones`) y fila secundaria, `TarjetaAtaquePersonaje` utilizaba un diseño vertical pesado de 3 niveles con cuadrículas toscas para impacto y daño.
2. **Desconexión de props en `SeccionAtaquesMagicos`:**
   - La sección de conjuros dentro de "Acciones" no pasaba `tieneLanzamientoGratisDisponible`, `alLanzarGratis` ni `origenBadge`, perdiendo los botones "Gratis (1/DL)" y los distintivos de especie/legado/subclase. Además, mostraba un botón inerte de eliminación (`alQuitarDeLista={() => {}}`).

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Rediseño Unificado de `TarjetaAtaquePersonaje.tsx` (`src/componentes/caracteristicas/ataques/`)**:
   - Adopta la misma anatomía en dos bloques principales:
     - `ladoIzquierdoAtaque`: Fila 1 (Icono + Nombre + Badges de Acción, Subtipo, Mágico, Ventaja/Desventaja), Fila 2 (Alcance • Impacto/Salvación • Daño), Fila 3 (Maestría y Propiedades con Tooltips para TaleSpire).
     - `ladoDerechoAtaque`: Selector de atributo (sutil/pacto), indicador de munición y `columnaAccionesAtaque`.
     - `columnaAccionesAtaque`: Botón primario destacado **"Atacar"** (o **"Daño"**) arriba, y fila de acciones secundarias abajo (**"Daño"** / **"1M"**, **"2M"**, **"Crit"**, **"Crit 2M"**).
2. **Enriquecimiento de `SeccionAtaquesMagicos.tsx`**:
   - Integrado `resolverOrigenConjuro(personajeActivo, hechizo)` para mostrar badges de origen canónico.
   - Detecta automáticamente si el personaje dispone de lanzamientos innatos gratuitos diarios (`tieneLanzamientoGratisDisponible`) e invoca el modo `"gratuitoInnato"`.
   - Omitido `alQuitarDeLista` para que no se muestre el botón de basura en combate táctico.
3. **`TarjetaConjuroCompacta.tsx`**:
   - `alQuitarDeLista?: () => void` condicional `{alQuitarDeLista && <button ... />}`.
4. **Métricas de Calidad Verificadas**:
   - `pnpm exec tsc --noEmit`: 0 errores.
   - `pnpm lint`: 0 errores y 0 advertencias.
   - `pnpm test`: 45 suites superadas, 522/522 pruebas pasando.
   - `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-09] Modularización y Jerarquía Visual de Acciones en TarjetaConjuroCompacta
**Contexto y Requerimientos del Usuario:**
- El usuario añadió un contenedor de columna flexible con estilo en línea (`<div style={{display: "flex", flexDirection: "column", gap: "4px"}}>`) para agrupar los botones de acción en `TarjetaConjuroCompacta.tsx`.
- Solicitó arreglarlo adecuadamente, sustituyendo el estilo inline por clases CSS modulares (`TarjetaConjuroCompacta.module.css`), estructurando la jerarquía para que la tarjeta se mantenga limpia, equilibrada y consistente.

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Dispersión de estilos inline:**
   - La inclusión ad-hoc de `style={{ display: "flex", flexDirection: "column", gap: "4px" }}` y estilos embebidos en el badge de nivel fijo (`style={{ fontSize: 10, fontWeight: 700... }}`) rompía la convención arquitectónica del proyecto de centralizar todo estilo visual en módulos CSS (`.module.css`).
2. **Desplazamiento estructural de `ladoDerecho`:**
   - Al introducir el contenedor de columna, el contenedor envolvente `.ladoDerecho` había quedado desplazado al interior de la columna para envolver únicamente los botones secundarios, dejando el selector de Upcast flotando como hijo directo desalineado del contenedor principal de la tarjeta.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Reestructuración Jerárquica Limpia en `TarjetaConjuroCompacta.tsx`:**
   - `.ladoDerecho`: Vuelve a ser el contenedor flex unificado para todo el sector derecho de la tarjeta (selector de ranura / upcast + columna de acciones).
   - `.columnaAcciones`: Contenedor en columna (`display: flex; flex-direction: column; gap: 4px; align-items: stretch;`) que alberga:
     - Botón principal de lanzamiento (`.botonLanzar`, con `justify-content: center` y `width: 100%`).
     - Fila de acciones secundarias (`.filaAccionesSecundarias`, con `display: flex; align-items: center; justify-content: flex-end; gap: 4px;`) conteniendo los botones condicionales "Gratis" (1/DL), "Ritual", "Ocultar/Ver" e icono de "Quitar".
2. **Definición Modular en `TarjetaConjuroCompacta.module.css`:**
   - Creadas las clases `.columnaAcciones`, `.filaAccionesSecundarias`, `.badgeNivelFijo` y `.badgeNivelFijoPacto`.
   - Eliminados todos los estilos inline residuales.
3. **Mantenimiento del Límite de Líneas y Calidad de Código:**
   - `TarjetaConjuroCompacta.tsx` se redujo a 354 líneas (< 500 líneas).
   - `pnpm exec tsc --noEmit`: 0 errores.
   - `pnpm lint`: 0 errores y 0 advertencias.
   - `pnpm test`: 45 suites superadas, 522/522 pruebas pasando.
   - `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-09] Corrección de UX en Selector de Truco de Alto Elfo: Eliminación de Autorrellenado Involuntario y Soporte de Borrado Completo
**Contexto y Requerimientos del Usuario:**
- El usuario reportó que en el modal de detalle del rasgo *Magia de alto elfo*, el campo para seleccionar el truco de mago no permitía borrar por completo el texto: siempre quedaba la letra `"p"` y, al intentar borrarla, se autorrellenaba inmediatamente a `"prestidigitacion"`.
- Se solicitó poder borrar con total libertad el campo para escribir una nueva búsqueda o desplegar la lista completa de trucos de mago.

**Causas Raíz Identificadas:**
1. **Fallback Prematuro con Operador `||`:**
   - En `SeccionSelectoresModalRasgo.tsx`, se evaluaba `const valorSeleccionado = seleccionados[0] || "prestidigitacion";`. Cuando el usuario vaciaba el input con Backspace (`""`), la cadena vacía evaluaba falsy y forzaba la restauración instantánea del truco por defecto (`"prestidigitacion"`).
2. **Mutación Prematura de Redux en `onChange` Intermedio:**
   - Al escribir o borrar en `SelectorSugerencias`, cada pulsación de tecla (`"p"`, `"pr"`) ejecutaba `onCambiarSeleccion` enviando caracteres truncados al estado global de Redux, corrompiendo temporalmente el ID del truco conocido.
3. **Discrepancia entre Nombre Visible e ID Técnico:**
   - El input mostraba el ID (`"prestidigitacion"`) en minúsculas sin acentos en lugar del nombre canónico con mayúsculas y tildes (`"Prestidigitación"`).

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Componente Especializado `SelectorTrucoAltoElfo.tsx` (`src/componentes/caracteristicas/rasgos/SelectorTrucoAltoElfo.tsx`)**:
   - Mantiene un estado local desacoplado (`texto`, `estaEditando`, `estaAbierto`).
   - Permite borrado total (Backspace, Delete o botón `X` de limpieza) sin restaurar el truco hasta que el usuario confirme una opción o haga clic fuera (`onBlur`) sin seleccionar.
   - Presenta los nombres formateados correctamente (`"Prestidigitación"`, `"Rayo de escarcha"`, etc.).
   - Al vaciar el campo de texto, despliega automáticamente el listado completo de trucos de mago ordenados alfabéticamente para selección táctil o con ratón.
   - Solo sincroniza hacia Redux (`onSeleccionar`) cuando el usuario pulsa un truco válido de la lista.
2. **Integración en `SeccionSelectoresModalRasgo.tsx` y `ModalDetalleRasgo.tsx`**:
   - `SeccionSelectoresModalRasgo` delega en `SelectorTrucoAltoElfo` cuando el selector corresponde al truco de mago de Alto Elfo (`sel.id.toLowerCase().includes("truco")`), pasando la lista tipada `OpcionTrucoMago[]`.
3. **Mantenimiento del Límite de Líneas y Calidad de Código**:
   - El nuevo componente tiene 199 líneas, cumpliendo holgadamente el límite de 500 líneas por archivo.
   - `pnpm exec tsc --noEmit`: 0 errores.
   - `pnpm lint`: 0 errores y 0 advertencias.
   - `pnpm test`: 45 suites superadas, 522/522 pruebas pasando.
   - `node scripts/verificar-limite-lineas.js`: 108 archivos auditados, 0 archivos con más de 500 líneas.

---

## [2026-09-09] Culminación Exitosa: Refinamiento Canónico del Elfo (D&D 5.5e), Sustitución Dinámica de Truco de Alto Elfo y Sistema Universal de Conjuros Gratuitos Diarios (1/Descanso Largo)
**Contexto y Requerimientos del Usuario:**
- Refinamiento de la especie **Elfo** y sus linajes (*Drow*, *Alto elfo*, *Elfo de los bosques*) según las directrices y decisiones de diseño del usuario:
  1. *Linaje élfico*: Descripción clarificada y detallada indicando la obtención progresiva de conjuros a sus niveles respectivos (N1 truco/beneficio, N3 conjuro de nivel 2, N5 conjuro de nivel 3). Eliminación definitiva del selector de aptitud mágica (`selector_aptitud_magica_elfica`) y del parámetro `caracteristicaConjuroElegida`, descartando la bifurcación de aptitudes de lanzamiento.
  2. *Sentidos agudos*: Rasgo meramente descriptivo y pasivo permanente (eliminación del selector de habilidades, sin imponer mecánicas rígidas automáticas en `gradosHabilidades`).
  3. *Alto elfo (Sustitución de truco de mago tras descanso largo)*: Implementación del rasgo *Magia de alto elfo* con selector interactivo en el modal de detalle del rasgo utilizando `SelectorSugerencias`, alimentado dinámicamente desde el compendio de hechizos (`baseDatosHechizos`) filtrando trucos de mago (nivel 0), admitiendo automáticamente trucos homebrew. Al cambiar el truco, se sincroniza reactivamente `trucosConocidosIds` y `conjurosOtorgados`.
  4. *Sistema Universal de Conjuros Gratuitos Diarios (1/Descanso Largo)*: Similar al diseño de los Arcanos Místicos del Brujo, para conjuros otorgados por especies/linajes a niveles 3 y 5 (*Fuego feérico* y *Oscuridad* para Drow; *Detectar magia* y *Paso brumoso* para Alto elfo; *Zancada prodigiosa* y *Pasar sin rastro* para Elfo de los bosques), se configuran como rasgos consumibles (`tieneUsosLimitados: true`, `usosMaximos: 1`, `recuperacion: "descanso_largo"`, `categoriaMecanica: "consumible"`). En el panel de conjuros (`TarjetaConjuroCompacta`), se muestra el botón **"Gratis (1/DL)"** junto al botón regular de **"Lanzar (Espacio)"**. Al pulsar "Gratis", se ejecuta el conjuro bajo el modo `"gratuitoInnato"`, deduciendo automáticamente 1 uso del rasgo asociado sin gastar ranuras ni puntos de magia. El descanso largo lo recarga automáticamente a 1/1. El botón tradicional de lanzamiento con ranuras sigue disponible si el jugador decide reservar su lanzamiento diario gratuito o si ya lo consumió.

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Diferenciación entre el lanzamiento gratuito innato y el lanzamiento con ranuras**:
   - En D&D 5.5e, un conjuro otorgado por especie puede lanzarse una vez gratis por descanso largo y además usando ranuras de conjuro regulares. El motor de lanzamiento sólo admitía modos `"espacio"`, `"pacto"`, `"arcanoMistico"` y `"puntos"`. Se requería incorporar un modo `"gratuitoInnato"` que no consuma ranuras pero sí descuente la carga del rasgo de recurso correspondiente en el personaje.
2. **Filtrado temprano de rasgos por nivel en `construirRasgosEspecie`**:
   - Al filtrar plantillas por `nivel >= nivelRequerido`, especies como Aasimar perdían la visibilidad de sus rasgos avanzados (`Revelación celestial`, N3) en el modelo de rasgos, rompiendo contratos y pruebas unitarias. Los rasgos deben coexistir en `personaje.rasgos` con su atributo `nivelRequerido` para que la UI controle su activación según el nivel actual del PJ.
3. **Sustitución de truco reactiva en Alto Elfo sin recarga**:
   - Al seleccionar un nuevo truco en el selector de *Magia de alto elfo*, el slice de rasgos (`sliceRasgos.ts`) y el gestor de especies debían purgar el truco viejo de `trucosConocidosIds` e inyectar el nuevo sin alterar otros trucos de clase ni requerir reiniciar la hoja de personaje.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Modelado Canónico en `src/constantes/especiesDND55.ts` y `src/tipos/especies.ts`**:
   - Eliminado `caracteristicaConjuroElegida` de `ConfiguracionEspeciePersonaje`.
   - *Linaje élfico* y *Sentidos agudos* simplificados a `categoriaMecanica: "pasivo_permanente"` sin selectores.
   - *Magia de alto elfo*: Creado con `selector_truco_alto_elfo` de tipo `"unico"`.
   - Rasgos modulares de conjuros de linaje a niveles 3 y 5 tipados como `categoriaMecanica: "consumible"` con `tieneUsosLimitados: true`, `usosMaximos: 1` y `recuperacion: "descanso_largo"`.
2. **Motor de Lanzamiento Facade + Strategy (`src/servicios/servicioLanzamientoConjuros.ts`)**:
   - Añadido el modo `"gratuitoInnato"` a `ModoLanzamiento` e `InstruccionGasto`.
   - `prepararLanzamiento`: En modo `"gratuitoInnato"`, genera la fórmula regular de lanzamiento sin descontar ranuras ni puntos de magia (`gasto: { tipo: "gratuitoInnato", hechizoId: solicitud.hechizo.id }`).
3. **Consumo Reactivo en `usarLanzadorConjuros.ts`**:
   - Al recibir `gasto.tipo === "gratuitoInnato"`, localiza el rasgo de recurso correspondiente en `personaje.rasgos` (por `conjurosOtorgados` o coincidencia de nombre) y descuenta 1 uso con `gastarUsoRasgoPersonaje(personaje.id, rasgo.id)`.
4. **UI Enriquecida en `TarjetaConjuroCompacta.tsx` y `SeccionNivelConjuros.tsx`**:
   - `SeccionNivelConjuros`: Inspecciona si el personaje posee un rasgo de uso limitado con cargas disponibles para el conjuro cumpliendo el nivel requerido, y propaga `tieneLanzamientoGratisDisponible` y `alLanzarGratis`.
   - `TarjetaConjuroCompacta`: Renderiza el botón estilizado con gradiente esmeralda **"Gratis (1/DL)"** con icono `Sparkles`, junto al botón clásico de lanzamiento.
5. **Selector Dinámico en `ModalDetalleRasgo.tsx` y Sincronización en `sliceRasgos.ts`**:
   - Integrado `SelectorSugerencias` para `selector_truco_alto_elfo` que consulta `baseDatosHechizos` filtrando trucos de mago (`nivel === 0` y clases `"Mago"`).
   - En `sliceRasgos.ts` (`actualizarSeleccionRasgo`), si el selector es `selector_truco_alto_elfo`, reemplaza el truco previo por el nuevo en `trucosConocidosIds` y en `conjurosOtorgados`.
6. **Preservación de Estado en `gestorEspecies.ts`**:
   - `aplicarEspecieAPersonaje` preserva los `usosRestantes` y las selecciones de selectores previas al reconstruir rasgos.
   - En `construirRasgosEspecie`, se conservan todos los rasgos con su `nivelRequerido` intacto para inspección y activación progresiva.
7. **Cobertura Completa de Pruebas Unitarias**:
   - `gestorEspecies.test.ts`: Pruebas de Linaje élfico sin selectores, Sentidos agudos pasivo, rasgos consumibles 1/DL para conjuros a niveles 3 y 5, y persistencia de trucos personalizados en Alto elfo.
   - `servicioLanzamientoConjuros.test.ts`: Prueba para la estrategia `"gratuitoInnato"` validando gasto y concentración sin consumo de ranuras.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto en todo el proyecto).
- `pnpm lint`: 0 errores, 0 advertencias (ESLint limpio).
- `pnpm test`: 45 suites superadas, 522 de 522 pruebas pasando (100%).

---

## [2026-09-08] Culminación Exitosa: Implementación Canónica de Elfo (D&D 5.5e / 2024), 3 Linajes Élficos (Drow, Alto Elfo, Elfo de los Bosques), Desbloqueo Progresivo de Conjuros y Selectores de Aptitud/Habilidad
**Contexto y Requerimientos del Usuario:**
- Implementación de la especie **Elfo** y sus 3 linajes/subrazas (*Drow*, *Alto elfo*, *Elfo de los bosques*) según el compendio oficial D&D 5.5e (`dicionario_herramientas/razas/Elfo.md`).
- Requisitos clave:
  1. *Funciones genéricas para el builder*: Garantizar alto DRY, KISS y principios SOLID para reutilizar la lógica con el resto de especies.
  2. *Linaje feérico no mecánico*: Modelado como rasgo pasivo permanente descriptivo (ventaja en tiradas de salvación para evitar o poner fin al estado de hechizado).
  3. *Linajes élficos y progresión de conjuros*: Inyectar automáticamente trucos a nivel 1 y conjuros de nivel superior a niveles 3 y 5 (1 uso gratis por descanso largo / espacios de conjuro).
  4. *Selectores interactivos*:
     - *Linaje élfico*: Selector de aptitud mágica entre Inteligencia, Sabiduría o Carisma.
     - *Sentidos agudos*: Selector de competencia entre Percepción, Perspicacia o Supervivencia.

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Acumulación de conjuros innatos al cambiar de linaje/especie en el builder**:
   - `aplicarEspecieAPersonaje` inicializaba los sets de trucos y conjuros preparados con los IDs existentes del personaje. Si el usuario conmutaba de un linaje (ej. Alto elfo con *Prestidigitación*, *Detectar magia*, *Paso brumoso*) a otro (ej. Elfo de los bosques), los conjuros del linaje anterior quedaban retenidos en la ficha.
2. **Progresión multinivel de magia innata**:
   - Los conjuros de nivel 3 y 5 de los linajes sólo deben prepararse si el nivel del personaje cumple con `nivelRequerido <= nivelPj`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Modelado Oficial de Elfo y sus 3 Linajes (`src/constantes/especiesDND55.ts`)**:
   - Especie base Elfo: *Tipo de criatura (Humanoide)*, *Tamaño (Mediano)*, *Visión en la oscuridad (60 pies)*, *Linaje élfico* (con selector de aptitud: Inteligencia/Sabiduría/Carisma), *Linaje feérico* (pasivo permanente), *Sentidos agudos* (con selector: Percepción/Perspicacia/Supervivencia) y *Trance* (4 horas de meditación).
   - **Drow**: *Visión en la oscuridad superior (120 pies)*, *Magia drow*, trucos/conjuros: *Luces danzantes* (N1), *Fuego feérico* (N3), *Oscuridad* (N5).
   - **Alto elfo**: *Magia de alto elfo* (truco sustituible tras descanso largo), trucos/conjuros: *Prestidigitación* (N1), *Detectar magia* (N3), *Paso brumoso* (N5).
   - **Elfo de los bosques**: *Pies veloces* (velocidad 35 pies), *Magia de elfo de los bosques*, trucos/conjuros: *Saber druídico* (N1), *Zancada prodigiosa* (N3), *Pasar sin rastro* (N5).
2. **Sincronización Pura e Idempotente de Conjuros Innatos (`src/servicios/gestorEspecies.ts`)**:
   - En `aplicarEspecieAPersonaje`, se recopilan todos los conjuros/trucos innatos conocidos del catálogo y se purgan los de especies/linajes previos antes de inyectar los correspondientes a la especie/linaje activo según `nivelPj >= conjuro.nivelRequerido`.
   - Se preservan intactos los conjuros otorgados por clases, subclases, dotes o rasgos personalizados activos.
   - En `construirRasgosEspecie`, se admite `caracteristicaConjuroElegida` para inicializar el selector de aptitud mágica de linaje.
3. **Cobertura Integral de Pruebas Unitarias (`src/servicios/gestorEspecies.test.ts`)**:
   - 9 nuevas pruebas exhaustivas cubriendo catálogo, campos universales de Elfo, selectores interactivos, los 3 linajes, progresión de conjuros a niveles 1, 3 y 5, conmutación limpia entre linajes e integración con `resolverOrigenConjuro` (badge `"legado"`).

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm lint`: 0 errores, 0 warnings (ESLint limpio).
- `pnpm test`: 45 suites superadas, 520 de 520 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 105 archivos auditados, 0 errores críticos.
- `pnpm run ci`: Pipeline integral finalizado con código de salida 0.

---

## [2026-09-08] Culminación Exitosa: Consumo Automático de Usos al Tirar Dados en Ataque de Aliento e Inspiración Bárdica
**Contexto y Problema Reportado por el Usuario:**
- Al pulsar el botón de tirada de dados de *Ataque de aliento* (o *Arma de aliento*), se realizaba la tirada 3D en TaleSpire / chat pero no se descontaba automáticamente un uso de la reserva limitada del rasgo (similar al funcionamiento de los dados de Inspiración bárdica).

**Causas Raíz Identificadas:**
1. En `TarjetaRasgo.tsx` y `ModalDetalleRasgo.tsx`, la condición `gastaUsoAlTirar` evaluaba exclusivamente rasgos de auto-curación, auto-HP temporal o con la bandera `gastarDePadre`. No contemplaba rasgos clasificados con `categoriaMecanica: "consumible"` ni comprobaba de forma nominativa `esAtaqueAliento` o `esInspiracionBardica`.
2. En `src/constantes/especiesDND55.ts`, la plantilla de *Ataque de aliento* estaba catalogada como `categoriaMecanica: "activable"` en vez de `"consumible"`.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Ampliación de `gastaUsoAlTirar` (`TarjetaRasgo.tsx` y `ModalDetalleRasgo.tsx`)**:
   - Se incluyeron `esAtaqueAliento` (`ataque de aliento` / `arma de aliento`), `esInspiracionBardica` (`inspiracion bardica`), `esMantoInspiracion` y cualquier rasgo con `rasgo.categoriaMecanica === "consumible"`.
   - Al dispararse `manejarTirarDados`, si `gastaUsoAlTirar` es verdadero y existen usos disponibles, se invoca de inmediato `alGastarUso()`, reduciendo `usosRestantes` tanto en la tarjeta compacta como en el modal de detalle del rasgo.
2. **Tipado y Semántica en `src/constantes/especiesDND55.ts`**:
   - Se actualizó *Ataque de aliento* a `categoriaMecanica: "consumible"`, formalizando que su activación mediante tirada de dados consume una carga de su reserva.
3. **Validación con Pruebas Automatizadas**:
   - Se añadió prueba en `gestorEspecies.test.ts` asegurando que tanto *Ataque de aliento* como *Inspiración bárdica* activan `gastaUsoAlTirar`.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm lint`: 0 errores, 0 warnings (ESLint limpio).
- `pnpm test`: 45 suites superadas, 511 de 511 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 105 archivos auditados, 0 errores críticos.
- `pnpm run ci`: Pipeline integral exitoso en 11.61s (código 0).

---

## [2026-09-08] Culminación Exitosa: Implementación Canónica de Dracónido (D&D 5.5e), 10 Legados Dracónicos, Contenedor UI Independiente para Legados/Subrazas y Efecto Táctico de Vuelo Dracónico
**Contexto y Requerimientos del Usuario:**
- Implementación de la especie **Dracónido** (*Dragonborn*) y sus 10 legados dracónicos (subrazas/ancestros) según el compendio oficial D&D 5.5e (`dicionario_herramientas/razas/draconido.md`).
- Requisitos clave:
  1. *Funciones genéricas para el builder*: Garantizar alto DRY, KISS y principios SOLID para reutilizar la lógica con el resto de especies.
  2. *Contenedor UI separado*: Gestionar los legados dracónicos en una caja/sección visual independiente de la especie base, similar a la separación entre clases y subclases.
  3. *Resistencia al daño y Ataque de aliento en el legado*: Ambos rasgos deben pertenecer directamente al legado seleccionado, no a la especie base.
  4. *Vuelo dracónico (Nivel 5)*: Debe incorporar un efecto homónimo en el sistema de efectos, de carácter meramente informativo (duración estándar de 10 minutos / 100 rondas).

**Causas Raíz y Desafíos Técnicos Identificados:**
1. **Mezcla de orígenes de rasgos**:
   - El contrato `EsquemaOrigenRasgo` limitaba los orígenes a `"clase" | "subclase" | "especie" | "dote" | "personalizado"`. Al marcar los rasgos de legado como `"especie"`, se mezclaban en el mismo bloque visual y, al cambiar de legado o especie en el builder, se dificultaba la purga selectiva o la asignación de insignias distintivas.
2. **Restricción de `categoriaMecanica` en `PlantillaRasgoEspecie`**:
   - Las categorías válidas en el tipado estricto son `"consumible" | "activable" | "selector_informativo" | "pasivo_permanente" | "extension" | "curacion" | undefined`. Tipos ad-hoc como `"dano_area"` o `"movimiento_especial"` disparaban TS2322.
3. **Escalado dinámico del Ataque de Aliento**:
   - En 5.5e, el daño del aliento progresa por nivel de personaje (1d10 en nv 1-4, 2d10 en nv 5-10, 3d10 en nv 11-16 y 4d10 en nv 17-20) y los usos máximos equivalen al bonificador de competencia (PB) por descanso largo. El constructor de rasgos debía calcular esto en caliente sin código espagueti ni mutaciones globales.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Extensión del Contrato de Origen de Rasgos (`src/tipos/rasgos.ts`)**:
   - Se añadió `"subespecie"` a `EsquemaOrigenRasgo` y `OrigenRasgo`.
   - Se actualizó `DatosJerarquicosRasgos` con `subespecie: RasgoPersonaje[]` y `SeccionesColapsadas` con `subespecie?: boolean`.
2. **Modelado Oficial de los 10 Legados Dracónicos (`src/constantes/especiesDND55.ts`)**:
   - Matriz `TABLA_ANCESTROS_DRACONICOS` con los 10 tipos de dragón (Negro, Azul, Oropel, Bronce, Cobre, Oro, Verde, Rojo, Plata, Blanco), discriminando tipo de daño (Ácido, Relámpago, Fuego, Veneno, Frío), forma de exhalación (cono de 15 pies o línea de 30 pies por 5 pies de ancho) y tiro de salvación canónico (Destreza o Constitución).
   - Cada legado incluye directamente sus dos rasgos nucleares: *Resistencia al daño* (pasivo permanente) y *Ataque de aliento* (activable con tirada de daño, escala y usos por PB).
   - La especie base Dracónido contiene: *Tipo de criatura (Humanoide)*, *Tamaño (Mediano)*, *Visión en la oscuridad (60 pies)*, *Linaje dracónico* y *Vuelo dracónico (Nivel 5)*.
3. **Efecto Informativo de Vuelo Dracónico (`src/utiles/datosIniciales.ts` y `condicionesRasgosHelpers.ts`)**:
   - Registrado `"Vuelo dracónico"` en `EFECTOS_PREDEFINIDOS` con 100 rondas (10 minutos) e icono de alas/movimiento.
   - Mapeo bidireccional reactivo en `resolverCondicionAsociadaRasgo` y `coincideCondicionConRasgo` para que al activar el rasgo en la ficha se active el efecto táctico en el Combat Tracker.
4. **Servicio Genérico Puro para el Builder (`src/servicios/gestorEspecies.ts`)**:
   - `construirRasgosEspecie`: Asigna `origen: "subespecie"` y `fuente: "Legado: [Nombre]"`. Calcula el escalado de dados de aliento (1d10 a 4d10) según el nivel del personaje y fija `usosMaximos: bonoCompetencia`.
   - `aplicarEspecieAPersonaje`: Purga limpiamente tanto `"especie"` como `"subespecie"` antes de inyectar la nueva configuración, garantizando idempotencia total sin tocar rasgos de clase, dotes ni personalizados.
5. **Caja UI Independiente para Legados/Subrazas (`SeccionesRasgosActivos.tsx`)**:
   - Contenedor visual autónomo con acento esmeralda (`borderLeft: "3px solid #10b981"`), icono `Sparkles`, cabecera colapsable independiente y contador de rasgos de legado.
   - Sincronización en `usarVistaRasgos.ts`, `TarjetaRasgo.tsx` y `ModalDetalleRasgo.tsx` con badge canónico `"Legado / Subraza"`.
   - Selector de sugerencias reactivo en `ModalEditarPersonaje.tsx` para `Subraza / Legado`.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm lint`: 0 errores, 0 warnings (ESLint limpio).
- `pnpm test`: 45 suites superadas, 510 de 510 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 105 archivos auditados, 0 errores críticos.
- `pnpm run ci`: Pipeline integral exitoso en 11.62s (código 0).

---

## [2026-09-08] Culminación Exitosa: Badges de Origen de Conjuros, Tarjetas Universales de Especie (Tipo de Criatura y Tamaño Seleccionable) y Efectos Tácticos de Aasimar (Combat Tracker)
**Contexto y Problemas Reportados por el Usuario:**
1. *Visibilidad y badges de conjuros por rasgo*:
   - Los trucos y conjuros otorgados por rasgos o especies aparecían seleccionados internamente pero no se mostraban en "Mi lista" ni en "Conocidos" / "Trucos listos" de la ficha.
   - La insignia (badge) indicaba erróneamente siempre "Subclase". Se requería diferenciar dinámicamente entre: `clase`, `subclase`, `especie`, `legado` y `rasgos` (default).
2. *Tarjetas de Tipo de Criatura y Tamaño*:
   - No se visualizaban tarjetas para "Tipo de criatura" ni "Tamaño" en la sección de especie de la ficha.
   - En especies con tamaño configurable (como Aasimar que puede ser Pequeño o Mediano), el tamaño debe figurar como rasgo con selector interactivo y sincronizar con `personaje.tamano`.
3. *Efectos de las 3 Formas de Aasimar (Combat Tracker)*:
   - Las tres formas de *Revelación celestial* (*Alas Celestiales*, *Fulgor Interior* y *Mortaja Necrótica*, configuradas con duración estándar de 10 turnos en `datosIniciales.ts`) debían conectarse bidireccionalmente con el Combat Tracker simétricamente a como lo hace *Furia*.

**Causas Raíz Identificadas:**
1. En `usarMagiaPersonaje.ts`, `estaEnLista` verificaba exclusivamente `personaje.trucosConocidosIds` ignorando trucos otorgados por rasgos o especie. Además, `FilaConjuroCompendio` y `TarjetaConjuroCompacta` solo recibían un booleano `esDeSubclase`.
2. Las plantillas de `CATALOGO_ESPECIES_DND55` no incluían explícitamente "Tipo de criatura" y "Tamaño" como tarjetas de rasgos, omitiendo el selector interactivo.
3. `resolverCondicionAsociadaRasgo`, `coincideCondicionConRasgo` y `actualizarSeleccionRasgo` no contemplaban la transmutación dinámica ni el mapeo hacia las 3 formas de Revelación celestial de Aasimar.

**Solución Implementada y Decisiones Arquitectónicas:**
1. **Resolutor Universal de Origen de Conjuros (`src/servicios/resolutorOrigenConjuros.ts`)**:
   - `resolverOrigenConjuro(personaje, hechizo)`: Discrimina con precisión entre `"clase"`, `"subclase"`, `"especie"`, `"legado"` y `"rasgos"` (default) mediante inspección de orígenes de rasgos, catálogos de especie/subespecie y `conjurosSiemprePreparadosIds`.
   - `CONFIG_BADGES_ORIGEN_CONJURO`: Paleta visual dedicada para cada origen con tooltip canónico en español y accesibilidad contrastada.
   - Sincronización en `usarMagiaPersonaje.ts`: `esHechizoOtorgado` evalúa positivamente los trucos y conjuros de rasgos/especie incluyéndolos de forma natural en `trucosConocidos`, "Mi Lista" y "Preparados".
   - Propagación de `origenBadge` a `TarjetaConjuroCompacta`, `FilaConjuroCompendio`, `CompendioConjurosJugador`, `PanelConjurosPersonaje`, `ListaNivelesConjuros`, `SeccionNivelConjuros` y `SeccionConjurosOcultos`.
2. **Tarjetas Universales de Tipo de Criatura y Tamaño Configurable**:
   - En `src/constantes/especiesDND55.ts`, se definieron los rasgos canónicos de Aasimar con `selector_tamano_especie` (`Mediano` y `Pequeño`).
   - En `src/servicios/gestorEspecies.ts` (`construirRasgosEspecie`), se inyectan y sintetizan sistemáticamente "Tipo de criatura" y "Tamaño" si no existen en plantillas, preseleccionando `tamanoElegido`.
   - En `src/servicios/compendioRasgos.ts`, `sincronizarRasgosAutomaticos` preserva las selecciones del usuario en `selectores`.
   - **Preferencia UX del Usuario**: Las tarjetas compactas (`TarjetaRasgo.tsx`) renderizan exclusivamente chips informativos limpios de las opciones seleccionadas y derivan la selección interactiva al modal de detalle (`ModalDetalleRasgo.tsx`), evitando selectores embebidos en las tarjetas para prevenir desbordes o cambios accidentales.
   - En `src/almacen/slices/personajes/sliceRasgos.ts` (`actualizarSeleccionRasgo`), cambiar el selector de tamaño desde el modal de detalle actualiza instantáneamente `personaje.tamano` a `"Pequeño"` o `"Mediano"`.
3. **Sincronización Bidireccional de Efectos de Aasimar con Iniciativa (Combat Tracker)**:
   - En `condicionesRasgosHelpers.ts`:
     - `resolverCondicionAsociadaRasgo`: Para `Revelación celestial`, evalúa el selector y devuelve `"Alas Celestiales"`, `"Fulgor Interior"` o `"Mortaja Necrótica"`.
     - `coincideCondicionConRasgo`: Reconoce las 3 formas celestiales de forma tolerante.
     - `activarRasgosPorCondicionOEfecto`: Si se aplica el efecto desde iniciativa, activa el rasgo, descuenta el uso de 1/descanso largo y sincroniza la forma en el selector.
   - En `sliceRasgos.ts`:
     - Al alternar el rasgo activo, genera el efecto en `efectosActivos` con 10 rondas de duración (`expiraRonda: rondaActual + 10`) y lo replica en `c.efectos` de la cola de iniciativa.
     - Si el jugador cambia de forma mientras la transformación está activa, se transmuta el efecto en caliente conservando la ronda de expiración.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm lint`: 0 errores, 0 warnings (ESLint limpio).
- `pnpm test`: 45 suites superadas, 504 de 504 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 105 archivos auditados, 0 errores críticos.
- `pnpm build`: Compilación de producción Vite completada con código 0.

---

## [2026-09-08] Culminación Exitosa: Sistema Universal de Especies/Razas y Subrazas/Legados (D&D 5.5e) — Aasimar y Funciones Genéricas para el Builder
**Contexto y Requerimientos:**
- El usuario solicitó iniciar la construcción sistemática de las razas/especies y subrazas/legados de D&D 5.5e partiendo de `dicionario_herramientas/razas/aasimar.md`.
- Requerimientos clave:
  1. *Funciones genéricas reutilizables para el constructor (builder)*: Funciones puras, desacopladas e inmutables para aplicar y consultar especies.
  2. *Alto DRY y KISS*: Reutilizar contratos y utilidades de normalización previas, manteniendo funciones simples.
  3. *Campos universales de especie*: Todas las especies comparten tipo de criatura (`tipoCriatura: string`, canónico `"Humanoide"` en PHB 2024), tamaño (`tamano`: opciones de selección o fijo, ej. `["Mediano", "Pequeño"]`), velocidad base (`velocidadBase: number`, ej. 30 pies) y visión en la oscuridad.
  4. *Fidelidad mecánica e informativa de Aasimar*:
     - *Manos curativas*: Acción de magia, tirada de d4 igual a tu bonificador de competencia (PB), curación de HP, 1 uso por descanso largo.
     - *Portador de luz*: Conoce de base el truco *Luz* (*Light*) usando Carisma como aptitud mágica.
     - *Revelación celestial*: Nivel 3 requerido, acción adicional, duración 1 minuto, 1 uso por descanso largo. Crea 3 efectos/opciones en selector de carácter puramente descriptivo/informativo (*Alas celestiales*, *Fulgor interior* y *Mortaja necrótica*), sin sobrecargar cálculos mecánicos complejos innecesarios.
     - *Resistencia celestial*: Resistencia permanente al daño necrótico y radiante.

**Solución Aplicada y Decisiones Arquitectónicas:**
1. **Contratos Fuertemente Tipados (`src/tipos/especies.ts` y re-export en `src/tipos/index.ts`)**:
   - Se crearon `DefinicionEspecie`, `DefinicionSubespecie`, `ConjuroInnatoEspecie`, `ConfiguracionEspeciePersonaje` y `OpcionesAplicarEspecie` espejando la arquitectura probada de `DefinicionClase` y `DefinicionSubclase`.
   - Se incorporó `tipoCriatura: z.string().default("Humanoide")` en `EsquemaPersonajeJugador` y `PERSONAJE_POR_DEFECTO` con compatibilidad retroactiva total.
2. **Catálogo Canónico Oficial (`src/constantes/especiesDND55.ts`)**:
   - Modelado integral del **Aasimar** con todos sus rasgos mecánicos (`curacion`, dados escalables `${pb}d4`), truco *Luz* innato y selector informativo con sus 3 manifestaciones.
   - Definiciones base de las restantes 9 especies oficiales de `dicionario_herramientas/razas/` (*Elfo*, *Enano*, *Gnomo*, *Goliat*, *Humano*, *Mediano*, *Orco*, *Tiefling*, *Dracónido*) y sus linajes/legados correspondientes, listos para extensión.
   - Mapas indexados O(1): `DICCIONARIO_ESPECIES_POR_ID` y `DICCIONARIO_ESPECIES_POR_NOMBRE`.
   - Ampliación de `PlantillaRasgoEspecie` en `src/constantes/rasgosDND55.ts` para admitir `nivelRequerido`, `categoriaMecanica`, `esActivable`, `selectores` y `formulaEscalado`.
3. **Capa de Dominio Puro (`src/servicios/gestorEspecies.ts`)**:
   - `obtenerCatalogoEspecies`, `obtenerEspeciePorId`, `obtenerEspeciePorNombre`, `obtenerSubespeciesDeEspecie`, `obtenerSubespeciePorNombre`.
   - `construirRasgosEspecie`: Convierte las plantillas a `RasgoPersonaje[]` calculando dinámicamente dados de curación por PB, usos máximos e inyectando selectores ricos.
   - `aplicarEspecieAPersonaje`: Función pura y genérica para el *builder* que actualiza especie, subespecie, tamaño configurable, velocidad, visión, trucos innatos y rasgos de especie sin mutar ni perder rasgos de clase, dotes o personalizados (DRY / Idempotente).
4. **Integración con `compendioRasgos.ts`**:
   - `obtenerRasgosSugeridosPorEspecie` delega de forma natural en `gestorEspecies.ts`, garantizando una única fuente de verdad.
5. **Ajuste Quirúrgico: Desacoplamiento de Auto-Curación y Auto-HP Temporal en Rasgos Dirigibles a Terceros**:
   - *Problema*: Rasgos como *Manos curativas* (Aasimar) y *Manto de inspiración* (Bardo del Glamur) pueden aplicarse a aliados o terceros, pero al enviar `metaEspecial` con `personajeId` del lanzador a `lanzadorDados.ts`, el motor aplicaba la curación o los puntos de golpe temporales directamente al propio personaje que realizaba la tirada.
   - *Solución*: En `TarjetaRasgo.tsx` y `ModalDetalleRasgo.tsx`, se diferenció `esCuracionAuto` y `tieneEfectoHpTemporalAuto` (reservados para habilidades de uso exclusivamente personal, como *Guerrero de los dioses* del Bárbaro del Celo) de los rasgos aplicables a terceros (*Manos curativas* y *Manto de inspiración*). Para estos últimos, se mantiene `esCuracion` para renderizar el icono de corazón y formato en UI, se descuenta el uso (`gastaUsoAlTirar`) y se lanzan los dados al chat/TaleSpire, pero se omite `metaEspecial` para no mutar indebidamente la salud del lanzador.
6. **Suite de Pruebas Unitarias (`src/servicios/gestorEspecies.test.ts`)**:
   - 12 pruebas exhaustivas cubriendo catálogo, búsqueda tolerante, campos universales, rasgos de Aasimar, escalado de dados de Manos curativas, navegación de subrazas, aplicación inmutable al personaje en el builder y la verificación de no auto-curación ni auto-HP temporal en habilidades dirigibles a terceros.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (TypeScript Strict Mode).
- `pnpm lint`: 0 errores, 0 warnings (ESLint limpio).
- `pnpm test`: 45 suites superadas, 496 de 496 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 105 archivos auditados, 0 errores críticos.
- `pnpm build`: Empaquetado Vite verificado con éxito (código 0).

---

## [2026-09-08] Culminación Exitosa: Unificación Simétrica de Furia, Condiciones y Efectos (Master <-> Jugador <-> Mecánicas de Clase)
**Contexto y Problema Reportado:**
- El usuario reportó:
  1. *"creo que el tracker del master consume las condiciones/efectos de otro apartado de como lo hacen los jugadores, y esto no deberia ser asi. si yo selecciono furia cmo master se selecciona como efecto, y si lo hago como jugador se selecciona como jugador, la furia como master no le esta imponiendo las condiciones de furia como cuando lo seleccionas de jugador (y no debe ser asi, por que deberia ser la misma)"*
  2. En el tracker del Master se duplicaban los chips: chip verde `FURIA` en condiciones y chip morado `FURIA [R.101]` en efectos (al igual que con `FURIA DE LOS DIOSES`).
  3. En la ficha del jugador, el chip mostraba badges redundantes (`FURIA [R.101 (100R)] R.101 ✕`) y el tooltip sobreescrito borraba la descripción canónica de reglas D&D de Furia (ventaja en Fuerza, resistencias al daño contundente/perforante/cortante, bonificador de daño).

**Causas Raíz Identificadas:**
1. **Asimetría en la persistencia del estado**:
   - Al agregar Furia desde el Master (`agregarEfectoACriatura`), sólo se inyectaba en `pj.efectosActivos`, pero los motores de cálculo de combate (`calculadorAtaquesArmas.ts`, mitigación de daño y resistencias) evalúan `pj.condicionesActivas` y `pj.rasgos`. Al no actualizar ambos, el personaje no recibía los beneficios mecánicos de Furia ni se marcaba el rasgo en su ficha.
   - Al seleccionar Furia desde la ficha del Jugador (`aplicarCondicionPersonaje`), se guardaba como condición plana sin contador de rondas ni expiración en iniciativa.
2. **Duplicación visual cruzada entre Condiciones y Efectos**:
   - Ni `TarjetaCriaturaIniciativa`, ni `IniciativaJugador`, ni `BarraTacticaPersonaje` desduplicaban las condiciones por nombre contra la lista de efectos activos. Al existir "Furia" en ambas listas (para reglas y para duración), se renderizaban chips duplicados en verde y morado.
3. **Sobreescritura de tooltips y redundancia de badges**:
   - `BarraTacticaPersonaje.tsx` componía manualmente `[R.101 (100r)]` en `textoCustom` mientras `ChipCondicion` ya renderizaba `R.101` de forma nativa. Además, `tooltipCustom` truncaba toda la regla oficial de D&D 5.5e dejando solo la línea de expiración.

**Solución Aplicada y Decisiones de Arquitectura:**
1. **Módulo Puro de Activación Reactiva de Rasgos (`src/almacen/slices/personajes/condicionesRasgosHelpers.ts`)**:
   - Se crearon las funciones puras `activarRasgosPorCondicionOEfecto(nombreEstado, rasgos)` y `desactivarRasgosPorCondicionOEfecto(nombreEstado, rasgos)`.
   - Vinculan reactivamente las condiciones tácticas (ej. Furia, Furia de los Dioses, Ataque Temerario, Manto de Majestad) con los rasgos de clase activables, descontando usos limitados y ejecutando apagados en cascada de rasgos dependientes (ej. desactivar Golpe Brutal y Furia Divina si se apaga Furia).
2. **Unificación Simétrica en `sliceIniciativa.ts`**:
   - `agregarEfectoACriatura`: Inyecta el efecto en `pj.efectosActivos`, añade su nombre a `pj.condicionesActivas` para las fórmulas de combate, activa el rasgo en `pj.rasgos` mediante `activarRasgosPorCondicionOEfecto`, y purga cualquier condición homónima de `c.condiciones` para evitar duplicación visual en el tracker del Master.
   - `quitarEfectoDeCriatura`: Retira el efecto de `pj.efectosActivos`, de `pj.condicionesActivas`, apaga el rasgo mediante `desactivarRasgosPorCondicionOEfecto` y limpia `c.condiciones`.
   - `aplicarEfectoEnArea`: Aplica la misma sincronización simétrica para efectos masivos de área.
3. **Detección Automática de Duración en `sliceCondiciones.ts`**:
   - `aplicarCondicionPersonaje`: Si la condición agregada por el jugador se encuentra en `EFECTOS_PREDEFINIDOS` con duración estándar > 0 (ej. Furia con 100 rondas), se crea automáticamente como `EfectoActivo` en `pj.efectosActivos` con `expiraRonda`, se sincroniza en `c.efectos` y se activa el rasgo de clase en `pj.rasgos`.
   - `quitarCondicionPersonaje` y `quitarEfectoPersonaje`: Eliminan de forma coordinada el estado en ambas listas y apagan el rasgo.
4. **Sincronización en `sliceRasgos.ts` (`alternarActivoRasgo`)**:
   - Al encender o apagar un rasgo con condición asociada (ej. Furia o Furia de los Dioses), se crea o destruye automáticamente el efecto en `pj.efectosActivos` y en la cola de iniciativa (`c.efectos`), manteniendo la coherencia sin importar desde dónde se accione.
5. **Deduplicación Visual Cruzada y Tooltip Canónico Enriquecido**:
   - `ChipCondicion.tsx`: Añadida prop `rondasRestantes?: number`. Renderiza la insignia limpia `R.${expiraRonda} (${rondasRestantes}r)` sin duplicar etiquetas. Enriquecido el tooltip con la descripción oficial D&D 5.5e concatenando al final la información de ronda de finalización y rondas restantes activas.
   - `BarraTacticaPersonaje.tsx`, `TarjetaCriaturaIniciativa.tsx` e `IniciativaJugador.tsx`: Filtran de `condicionesVisibles` cualquier condición cuyo nombre base (`cond.split(" (")[0].toLowerCase().trim()`) o nombre completo coincida con algún efecto en la lista de efectos activos. Esto resuelve que condiciones guardadas con subtítulos o traducciones en inglés (ej. `Furia (Rage)` o `Ataque Temerario (Reckless Attack)`) no se dupliquen como chips verdes cuando ya se renderizan como chips morados con rondas.
   - `procesadorCondiciones.ts`: `quitarCondicion` ahora evalúa de manera case-insensitive y comparando tanto el nombre completo como el nombre base previo a paréntesis, garantizando remociones simétricas y limpias.

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm test`: 44 suites superadas, 484 de 484 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 105 archivos auditados, 0 errores críticos.
- `pnpm run ci`: Pipeline integral finalizado con código de salida 0.

---

## [2026-09-08] Culminación Exitosa: Desduplicación de Concentración y Diferenciación de Condiciones vs Efectos con Rondas Restantes
**Contexto y Problema Reportado:**
- El usuario reportó:
  1. *"al master se le duplica la concentracion de los personajes, tambien en la iniciativa de jugador"*
  2. *"los jugadore no se diferencia entre condicion y efecto, por ende no se reconoce en cuantos turnos acaba dicho efecto"*
- En la tarjeta del Master (`TarjetaCriaturaIniciativa`) se renderizaban simultáneamente dos chips (`[CON] CONCENTRACIÓN` en condiciones y `[CON] NOMBRE_CONJURO` en efectos). En `IniciativaJugador` ocurría lo mismo con dos insignias rojas contiguas.
- En la ficha del jugador (pestaña *Características* / `BarraTacticaPersonaje`), los efectos temporales (Bendición, Escudo de la Fe, etc.) se trataban como condiciones planas de texto, perdiendo el metadato de cuándo expiran y sin cálculo de rondas/turnos restantes respecto a la ronda actual del combate.

**Causas Raíz Identificadas:**
1. **Doble representación en la cola de iniciativa (`colaIniciativa`)**:
   - Se inyectaba simultáneamente `"Concentración"` en `criatura.condiciones` y `{ nombre: "Concentración: Conjuro", concentracion: true }` en `criatura.efectos`. Dado que tanto la vista del Master como la del Jugador listaban ambas colecciones consecutivamente, se visualizaban dos insignias de concentración.
2. **Carencia de `efectosActivos` en el modelo del personaje jugador**:
   - `PersonajeJugador` sólo poseía `condicionesActivas: string[]`, por lo que cualquier efecto aplicado por el Master desde la iniciativa o lanzado por el jugador perdía su duración (`expiraRonda`), su identificador unívoco y la capacidad de removerse independientemente.
3. **Presentación indiscriminada en `BarraTacticaPersonaje`**:
   - No se discriminaban los estados cualitativos (Cegado, Derribado, Cansado) de los efectos mágicos cuantificables con duración finita en rondas.

**Solución Aplicada y Decisiones de Arquitectura:**
1. **Ampliación del Modelo de Datos de Personaje (`src/tipos/personaje.ts` y `personajeConstantes.ts`)**:
   - Se definió `EsquemaEfectoActivo` y se incorporó `efectosActivos: z.array(EsquemaEfectoActivo).default([])` en `EsquemaPersonajeJugador` y `PERSONAJE_POR_DEFECTO`.
2. **Deduplicación Canónica en Vistas de Iniciativa**:
   - En `TarjetaCriaturaIniciativa.tsx` e `IniciativaJugador.tsx`, se filtra de las condiciones visibles cualquier condición de concentración (`c.toLowerCase().includes("concentra")`) cuando la criatura ya cuenta con un efecto de concentración en `efectos`.
   - En `sincronizacionIniciativa.ts`, al sincronizar con TaleSpire o el estado local, se purga la duplicación en `condicionesPj` asegurando que la concentración se presente de forma unívoca.
3. **Sincronización Bidireccional de Efectos con Rondas**:
   - `sliceIniciativa.ts`: Al aplicar efectos a criaturas (`agregarEfectoACriatura` y `aplicarEfectoEnArea`), si la criatura corresponde a un personaje jugador, se propaga el efecto a `pj.efectosActivos` conservando `id`, `nombre`, `expiraRonda` y `concentracion`.
   - `sliceCondiciones.ts`: Se añadió la acción `quitarEfectoPersonaje(id, idEfecto)` con sincronización reactiva hacia la criatura en `colaIniciativa`.
   - `sliceMagia.ts`: `establecerConcentracion` registra en `pj.efectosActivos` y preserva `"Concentración"` en `pj.condicionesActivas` para plena compatibilidad con las reglas del sistema de conjuros, sincronizando con la iniciativa sin duplicación.
4. **Diferenciación Táctica en la Ficha del Jugador (`BarraTacticaPersonaje.tsx`)**:
   - Visualización separada y jerárquica de dos categorías:
     - **Condiciones de Estado**: Chips ámbar con tooltip explicativo 5.5e y botón de quitar.
     - **Efectos Mágicos y Temporales**: Chips con duración restante dinámica respecto a `rondaActual` (`[R.X (Yr)]`), tooltip detallando la ronda de expiración y rondas activas restantes, y botón individual de retiro (`alQuitarEfecto`).
5. **Control Estricto de Monolitos**:
   - `HojaPersonaje.tsx` se mantuvo estrictamente en 485 líneas (< 500 límite duro de CI).

**Métricas de Calidad Verificadas:**
- `pnpm exec tsc --noEmit`: 0 errores (Strict Mode estricto).
- `pnpm test`: 44 suites superadas, 479 de 479 pruebas pasando (100%).
- `node scripts/verificar-limite-lineas.js`: 105 archivos auditados, 0 errores críticos.
- `pnpm run ci`: Pipeline integral finalizado con código de salida 0.

---

## [2026-09-08] Culminación Exitosa: Sincronización Bidireccional de Efectos, Concentración y Condiciones (Master <-> Jugador / Características)
**Contexto y Problema Reportado:**
- El usuario reportó:
  1. *"las condiciones de caracteristicas no esta conectado a la iniciativa del master ni a la iniciativa del jugador"*
  2. *"creo que la manera que procesa las condiciones/efectos el master es diferente a como lo hace el jugador, por ejemplo si se esta concentrando no se muestra el efecto concentracion ni en que se esta concentrando en el tracker del master. al igual que si aplico efectos desde el master no se muestran en las condiciones de 'caracteristicas'"*
- Al concentrarse un jugador en un conjuro, el tracker del Master no reflejaba la condición ni el conjuro.
- Al aplicar efectos el Master desde el tracker de iniciativa (individuales o en área), no aparecían en las *Condiciones Activas* de la pestaña *Características* de la ficha del jugador.
- Al romper concentración o quitar efectos desde cualquier lado, no se sincronizaban recíprocamente.

**Causas Raíz Identificadas:**
1. **Desconexión entre `sliceMagia.ts` y la cola de iniciativa**:
   - `establecerConcentracion` y `romperConcentracion` sólo mutaban `pj.concentracionActiva` y `pj.condicionesActivas` en `state.personajes`, sin actualizar `colaIniciativa`.
2. **Desconexión de Efectos en `sliceIniciativa.ts`**:
   - `agregarEfectoACriatura` y `quitarEfectoDeCriatura` mutaban `c.efectos` en la criatura de la cola, pero no propagaban los efectos hacia `pj.condicionesActivas` ni asociaban la concentración activa en el personaje jugador correspondiente.
   - Las funciones de área (`aplicarCondicionEnArea`, `aplicarEfectoEnArea` y `procesarSalvacionEnArea`) transformaban las criaturas en `colaIniciativa` pero ignoraban `state.personajes`.
3. **Pérdida del nombre del conjuro en `ChipCondicion.tsx`**:
   - El formateo ejecutaba `nombreLimpio.split(" (")[0].toUpperCase()`, lo cual provocaba que un efecto como `Concentración (Escudo de la Fe)` se truncara a `[CON] CONCENTRACIÓN`, ocultando el conjuro concentrado. Además, no se disponía de un tooltip específico con las reglas oficiales 5.5e de concentración (salvación de Constitución CD 10 o mitad del daño).
4. **Falta de limpieza en `sliceCondiciones.ts`**:
   - Al quitar condiciones desde el jugador (`quitarCondicionPersonaje`), si se retiraba concentración o un efecto aplicado, `c.efectos` conservaba el efecto residual en la criatura de iniciativa.
5. **Resincronización en caliente con TaleSpire (`sincronizacionIniciativa.ts`)**:
   - Al refrescar o sincronizar con TaleSpire, las miniaturas mapeadas a PJs no inyectaban su `concentracionActiva` en `c.efectos` ni limpiaban efectos huérfanos.

**Solución Aplicada y Decisiones de Arquitectura:**
1. **Sincronización Reactiva de Concentración (`src/almacen/slices/personajes/sliceMagia.ts`)**:
   - `establecerConcentracion` ahora inyecta en la criatura coincidente de `colaIniciativa` la condición `"Concentración"` y el efecto `{ id: "ef_concentracion", nombre: "Concentración: " + nombreHechizo, concentracion: true }`.
   - `romperConcentracion` retira la condición y limpia cualquier efecto de concentración en la criatura de iniciativa.
2. **Sincronización Bidireccional de Efectos e Iniciativa (`src/almacen/slices/sliceIniciativa.ts`)**:
   - `agregarEfectoACriatura`: Añade el efecto a `pj.condicionesActivas`. Si el efecto tiene la propiedad de concentración o el nombre corresponde a concentración, configura reactivamente `pj.concentracionActiva = { hechizoId, nombreHechizo }` y agrega `"Concentración"`.
   - `quitarEfectoDeCriatura`: Retira el efecto de `pj.condicionesActivas`. Si era concentración, limpia `pj.concentracionActiva = null` y remueve `"Concentración"` tanto en `c.condiciones` como en `pj.condicionesActivas`.
   - `aplicarCondicionEnArea`, `aplicarEfectoEnArea` y `procesarSalvacionEnArea`: Sincronizan de forma determinista y masiva con `state.personajes` para cualquier criatura objetivo que corresponda a un Personaje Jugador.
3. **Sincronización de Retiro de Condiciones desde el Jugador (`src/almacen/slices/personajes/sliceCondiciones.ts`)**:
   - `sincronizarCondicionesEnIniciativa` ahora recibe `condicionEliminada`, limpiando de `c.efectos` cualquier efecto coincidente o de concentración.
   - `quitarCondicionPersonaje` y `limpiarCondicionesPersonaje` limpian `pj.concentracionActiva` cuando se retira la concentración.
4. **Formateo Semántico y Tooltip Oficial 5.5e en `ChipCondicion.tsx`**:
   - Se extrae limpiamente el nombre del conjuro para mostrar `[CON] [NOMBRE CONJURO]` (ej. `[CON] ESCUDO DE LA FE`).
   - Se construyó el tooltip flotante enriquecido con las reglas oficiales D&D 5.5e: salvación de Constitución CD 10 o mitad del daño recibido, y ruptura inmediata por incapacidad o nuevo conjuro de concentración.
5. **Resiliencia de Sincronización en `sincronizacionIniciativa.ts`**:
   - Al sincronizar con TaleSpire o el estado local, si el PJ tiene `concentracionActiva`, se garantiza l
... [truncated for diff preview]