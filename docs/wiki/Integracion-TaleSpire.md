# Integración con TaleSpire

## Adaptador central

`src/utiles/TaleSpireAdapter.ts` encapsula el acceso a `window.TS`. El resto de la aplicación usa `ts` en lugar de consultar directamente la API nativa.

El adaptador expone módulos para dados, chat, iniciativa, criaturas, paquetes de contenido, campaña, clientes, jugadores, almacenamiento, portapapeles y depuración.

La propiedad `estaDisponible` permite distinguir TaleSpire de un navegador local.

## Iniciativa

`ts.initiative.getQueue()` lee la cola nativa y deduplica peticiones concurrentes mediante una promesa temporal. `suscribirAEvento` escucha `initiative.onInitiativeEvent`.

El puente recibe `manejarEventoIniciativa` y `initiativeUpdated`, deserializa el payload y emite `iniciativaActualizada`. El slice transforma `activeItemIndex` y los elementos de la cola al modelo local.

## Criaturas y miniaturas

`ts.creatures.getSelectedCreatures()` obtiene la selección física del tablero. `ts.creatures.getMoreInfo()` consulta nombre, vida, estadísticas y otros datos extendidos.

`ts.creatures.getCreaturesOwnedByPlayer()` se usa para resolver miniaturas del jugador. `resolutorMiniaturasJugador.ts` empareja esas criaturas con personajes locales.

El adaptador también dispone de operaciones de paquetes de contenido para buscar objetos de tablero y crear elementos de miniatura cuando TaleSpire expone esas funciones.

## Roles y clientes

`ts.clients.esGM()` consulta `clients.whoAmI`, información ampliada del cliente, derechos del jugador o permisos de campaña. Si no se puede confirmar el rol dentro de TaleSpire, el adaptador usa el fallback de Jugador.

Fuera de TaleSpire, el fallback local devuelve Master para facilitar el desarrollo.

`suscribirACambioModoCliente` escucha `clients.onClientEvent` y reconoce `gm`, `player` y `spectator`. `usarConexionTaleSpire.ts` actualiza `esGM` en Zustand cuando cambia el modo.

## Dados 3D

`src/utiles/lanzadorDados.ts` normaliza fórmulas y elimina etiquetas incompatibles. `lanzarDadosTaleSpire`:

1. Comprueba que la fórmula contenga una expresión de dados.
2. Resuelve el tipo plano, ventaja o desventaja.
3. Duplica los grupos con d20 para ventaja o desventaja.
4. Valida la fórmula con `ts.dice.isValidRollString` cuando está disponible.
5. Genera descriptores con `ts.dice.makeRollDescriptors`.
6. Envía los dados a `ts.dice.putDiceInTray`.

Los grupos se expresan como `Nombre:1d20+5/Daño:2d6+3` en la gramática interna del proyecto. `crearDescriptoresManualmente` separa esos grupos y construye objetos `{ name, roll }` si se necesita evitar la conversión nativa.

## Fallbacks de tiradas

Si la llamada directa de dados falla, `lanzarDadosTaleSpire` utiliza `lanzarDadosPorChatTaleSpire`. TaleSpire requiere que el comando empiece por `!`; la función elimina exclamaciones previas y envía un único prefijo.

Si tampoco está disponible el chat, se ejecuta la simulación matemática local. Ese fallback permite probar acciones y recursos sin una instancia del juego.

Los resultados recibidos por `manejarResultadosDados` se correlacionan mediante `rollId`. Los registros en memoria permiten aplicar tiradas de iniciativa, salvaciones contra la muerte, ventaja, desventaja y curación de rasgos.

## Persistencia

`src/utiles/almacenamientoTaleSpire.ts` guarda el estado como JSON en un único blob global llamado `__dm_pantalla_datos__`.

`TaleSpireAdapter.localStorage` traduce el contrato interno a `window.TS.localStorage.global.setBlob`, `getBlob` y `deleteBlob`. El lector acepta tanto una cadena JSON como las envolturas estructuradas usadas por simuladores o versiones de la API.

## Suscripciones del manifiesto

`manifest.json` declara la API `0.1` y conecta:

- `symbiote.onStateChangeEvent` con `manejarCambioEstadoSimbionte`.
- `creatures.onCreatureStateChange` con `manejarCambioEstadoCriatura`.
- `creatures.onCreatureSelectionChange` con `manejarCambioSeleccionCriatura`.
- `initiative.onInitiativeEvent` con `manejarEventoIniciativa`.
- `dice.onRollResults` con `manejarResultadosDados`.
- `clients.onClientEvent` con `manejarEventoCliente`.

El manifiesto usa `entryPoint: /index.html`, capacidad `runInBackground`, destino de carga `popup` y la extensión `colorStyles`.

## Ciclo de un evento

1. TaleSpire invoca el callback global indicado en `manifest.json`.
2. `puenteTaleSpire` recibe el payload y comprueba si llega como cadena JSON.
3. El puente deserializa el valor y lo emite mediante el mapa de eventos tipado.
4. Un hook o servicio procesa el evento y actualiza Zustand.
5. Los selectores notifican a los componentes que dependen de ese dato.

Este flujo evita que una vista conozca el nombre del callback de la API. También permite que los tests y el desarrollo local trabajen sin conectar directamente un cliente real.

## Manejo de disponibilidad

Las llamadas del adaptador comprueban si una función existe antes de invocarla. Una capacidad ausente no debe bloquear el resto de la interfaz: iniciativa, dados, criaturas y almacenamiento tienen rutas de fallback independientes.

Cuando se modifica un wrapper de `TaleSpireAdapter`, conserva el resultado normalizado que esperan los servicios. Los servicios no deben leer respuestas crudas de `window.TS`.

## Fórmulas etiquetadas

Las acciones pueden enviar varios grupos en una sola tirada. Las etiquetas se separan de la expresión y se limpian antes de validar; los grupos se mantienen separados por `/` para que los resultados puedan asociarse con ataque, daño o CD.

Para ventaja y desventaja, el lanzador registra metadatos de los d20 duplicados. `manejarResultadosDados` utiliza esos metadatos para escoger el resultado que corresponde a la regla aplicada.

## Pruebas de integración

Al probar una integración, cubre al menos:

- API nativa disponible.
- Método opcional ausente.
- Respuesta serializada como JSON.
- Error de la ruta nativa y uso del chat.
- Ausencia total de `window.TS`.
- Evento de cambio de rol.
- Carga y borrado del blob global.
