# Modo Jugador

El modo Jugador se muestra cuando `esGM` es falso. `src/App.tsx` cambia las pestañas a `IniciativaJugador`, `VistaAtaquesJugador` (`Acciones`), `Compendio` (`Magia`), `VistaRasgosJugador`, `VistaInventarioJugador` y la hoja de personaje (`Características`).

## Hoja de personaje

`src/componentes/caracteristicas/personajes/HojaPersonaje.tsx` combina:

- `CabeceraPersonaje`.
- `BarraTacticaPersonaje`.
- `MetricasRapidasPersonaje`.
- `SentidosPasivosPersonaje`.
- `PanelVitalidadPersonaje`.
- `PanelAtributosPersonaje`.
- `PanelCompetenciasPersonaje`.
- `PanelFormaSalvaje` (subpestaña condicional cuando el personaje dispone de Forma Salvaje).

Los selectores derivados calculan bono de competencia, puntuaciones efectivas, modificadores, salvaciones, habilidades, pasivas, clase de armadura, velocidad y bono de daño de Furia.

## Clases, subclases y rasgos

`src/constantes/clasesDND55.ts` contiene el catálogo de clases y subclases de D&D 5.5e 2024. `gestorClases.ts` obtiene clases, subclases y rasgos, construye builds y los aplica al personaje.

`VistaRasgosJugador.tsx` muestra rasgos de especie, clase, subclase, dotes y rasgos personalizados. `TablaProgresionRasgo.tsx` presenta tablas de progresión por nivel.

Los rasgos pueden tener usos, recuperación, activación, selectores y efectos mecánicos. `evaluadorEfectosRasgos.ts` aplica modificadores de características, defensa sin armadura, velocidad y ventajas en tiradas según los rasgos activos.

### Respuestas predefinidas en consultas y resolución asistida

Los rasgos con consultas automáticas durante el combate o lanzamiento (`preguntarAlAtacar`, daño integrado al impactar, elección de efectos en tirada, cambio de tipo de daño en Forma Salvaje, iniciativa opcional, bono de curación, variante sin concentración, salvación de concentración y capacidad tras lanzar un conjuro) y los rasgos con modal manual `Resolver capacidad` admiten guardar respuestas predefinidas en la ficha del personaje (`respuestaPredefinida`):

- **Recordar desde el diálogo**: en las consultas emergentes puede marcarse **Recordar mi elección para este rasgo** para que las siguientes tiradas apliquen u omitan la opción sin volver a preguntar.
- **Regla de seguridad sobre usos limitados**: si activar o usar el rasgo consume recursos limitados, los flujos automáticos solo permiten recordar **Omitir siempre** / **Preguntar siempre** para evitar gastos accidentales; en el modal manual de `Resolver capacidad`, los rasgos con coste precargan las opciones elegidas para confirmar tras revisar, mientras que los rasgos sin coste permiten resolver en **1 clic** (`Resolver: <Opción>`) dejando un botón secundario para abrir el diálogo completo.
- **Píldora en tarjeta y configuración en detalle**: cuando un rasgo tiene una respuesta activa se muestra la píldora `⚡ Auto: ...` en su tarjeta (`ChipsSelectoresYDadosRasgo.tsx`), con un botón `×` para volver a **Preguntar siempre** en un clic. El panel completo de configuración por flujo se edita desde el modal de detalle del rasgo (`ConfiguracionRespuestaPredefinida.tsx`).

## Ataques y acciones

`VistaAtaquesJugador.tsx` organiza el turno mediante el flujo táctico plano *Flujo Táctico Plano + Switches de Combate*:

- **Cabecera y filtros (`CabeceraAtaquesJugador.tsx`)**: presenta las 5 píldoras directas por economía de acción (`Todas`, `Acción`, `Adicional`, `Reacción` y `Consumibles`) en una fila (rejilla `3 + 2` en paneles estrechos `<= 520 px`) y muestra el banner `role="status"` ante armadura o escudo sin competencia.
- **Puente mágico (`SeccionRecursosMagicosAtaque.tsx`)**: resume en una sola fila compacta las ranuras o puntos de conjuro disponibles junto al acceso directo a la pestaña `Magia`; cuando existe concentración activa, resalta el conjuro en curso con su botón `Romper`.
- **Modos Activos · Switches de Combate (`BarraSwitchesCombate.tsx` y `clasificadorSwitchesCombate.ts`)**: promueve automáticamente a chips interactivos con estado ON/OFF (mediante `useActivacionDeclarativa`), usos restantes y botón hermano de ficha los rasgos activables simples (`esActivable`, visibles y sin selectores/asistentes complejos), además de mostrar el chip verde contextual de la Forma Salvaje activa (`obtenerBestiaFormaActiva`). Si un switch carece de tirada independiente (`formulaDados`, curación o recarga), no duplica tarjeta en el feed inferior.
- **Feed táctico plano (`DivisorSeccionAccion.tsx`)**: en vista `Todas`, separa cada bloque con un divisor horizontal ligero de una línea (`Armas y Maestría` con el toggle **`Crítico (×2 Dados)`**, `Magia de Combate` unificando conjuros fijados en `conjurosEnAcciones` ordenados por nivel más hechizos de objetos mágicos, `Forma salvaje: <bestia>` / `Rasgos de Acción` y `Consumibles y Pociones`). Al filtrar por tipo de acción o consumibles, elimina los divisores de categoría para exponer un feed plano directo (conservando el toggle de crítico y la separación de Forma Salvaje cuando aplica).
- **Cajón de rasgos ocultos (`SeccionRasgosAtaque.tsx`)**: al pie del feed se mantiene como único acordeón real el cajón `Rasgos Ocultos`, **cerrado por defecto** (`ts_acciones_ocultos_abiertos`) y acompañado del botón hermano `Mostrar todos`.
- **Tarjetas de combate**: en `TarjetaAtaquePersonaje.tsx`, los bloques **Impacto** (`1d20 + bono`) y **Daño** (`1M` / `2 Manos` en armas versátiles, caja pasiva en daño fijo, selector de atributo desacoplado en cabecera, maestría D&D 5.5e y ajuste `-1 / +1` de munición) disparan directamente las tiradas respetando propiedades, condiciones y competencia. En `SeccionHechizosObjetosMagicos.tsx`, los hechizos vinculados a objetos mágicos permiten abrir su ficha completa (`FichaHechizo`) en `<DialogoModal>`, al igual que los conjuros de combate.

La acción puede consumir acción, acción adicional, reacción o una categoría especial. Las tiradas se envían a TaleSpire mediante `lanzarDadosTaleSpire`.

La ventaja y la desventaja pueden proceder de la barra táctica, de condiciones o de rasgos. Las fuentes opuestas se anulan según la lógica implementada en `lanzadorDados.ts`.

## Magia y conjuros

La pestaña superior `Magia` (`Compendio.tsx` en modo jugador) unifica mediante dos subpestañas (`ts_magia_subpestana`) el lanzamiento y la preparación:

- **Lanzamiento y Recursos (`PanelConjurosPersonaje.tsx`)**: estadísticas mágicas (CD, ataque de conjuro, aptitud y selector rápido `Modo Tirada`), banner de concentración activa, trackers interactivos de espacios/puntos/pacto/Arcano Místico, filtros mágicos y lista completa de trucos y conjuros preparados/conocidos por nivel, cada uno con su toggle para mostrarse o quitarse de `Acciones`.
- **Compendio y Preparar (`CompendioConjurosJugador.tsx`)**: gestión de conjuros conocidos, grimorio, preparados, disponibles y catálogo completo del compendio.

El sistema calcula:

- Espacios de conjuro.
- Puntos de conjuro.
- Espacios de pacto.
- Bono de ataque de conjuro y CD.
- Recursos de lanzadores multiclase.
- Opciones de lanzamiento a nivel superior.
- Conjuros de subclase siempre preparados.
- Arcanos Místicos de brujo y Libro de conjuros para Mago.

En el caso del Mago (`modeloConjuros === "grimorio"`), el compendio adapta sus subpestañas a **"Preparados"**, **"Libro de conjuros"**, **"Disponibles"** y **"Otros"**, permitiendo preparar conjuros desde el libro mediante el icono de estrella. En las acciones de combate únicamente se listan los conjuros preparados/disponibles que el jugador haya activado explícitamente en `conjurosEnAcciones`, además de los hechizos vinculados a objetos mágicos equipados/sintonizados.

En las tarjetas de Magia y Acciones, el selector muestra el saldo de la ranura o el coste en puntos del lanzamiento normal. Si se agota Pacto y el lanzador puede usar un recurso estándar en ese nivel, la tarjeta muestra el recurso alternativo. Los espacios adicionales creados por rasgos figuran en el resumen y en los niveles disponibles de Acciones.

Un conjuro puede activarse o quitarse de `Acciones`, prepararse, desprepararse y lanzarse con el recurso correspondiente. `servicioLanzamientoConjuros.ts` valida la solicitud y prepara la fórmula antes de enviarla a la API de dados.

## Acompañantes y Sidekicks

`SeccionAcompanantesPersonaje.tsx` gestiona acompañantes, monturas, mascotas e invocaciones escalables (como *Corcel sobrenatural*, *Espíritu feérico*, *Espíritu celestial*, etc.).

El módulo incluye:

- Velocidad base, movimiento gastado, movimiento restante y acción de Carrera (Dash).
- Selector táctico de terrenos: Normal (1x), Difícil (2x) y Extremo (3x) para cálculo de consumo de pies por casilla.
- Ajuste manual rápido de movimiento (+/- 5 pies), deshacer movimiento y restablecimiento de turno.
- Vinculación de miniaturas 3D de TaleSpire y sincronización de posición en tiempo real.
- Invocaciones escalables dinámicas que recalculan CA, Puntos de Golpe, tiradas de ataque y daño según el nivel del conjuro gastado y los atributos del lanzador.

## Inventario y munición

`PanelInventarioPersonaje.tsx` permite añadir objetos del compendio o personalizados, cambiar cantidades, equipar, sintonizar, editar notas y mover objetos entre contenedores.

`calculadorInventario.ts` calcula capacidad, peso de objetos, peso de monedas, sintonizaciones y sobrecarga. Los contenedores incluyen mochila (suma a la carga del personaje), bolsa de contención (0 lb efectivas sobre el personaje), montura/carreta (0 lb sobre el personaje) y almacén (0 lb sobre el personaje). Se incluye búsqueda tolerante instantánea (`busquedaTolerante.ts`) y modos de ordenación táctica (por tipo/secciones, pila LIFO, peso, nombre y valor).

`gestorMunicion.ts` relaciona armas y tipos de munición, determina compatibilidad, detecta contenedores físicos y calcula su contenido. El inventario puede desempaquetar paquetes y consumir munición desde su almacenamiento.

## Condiciones y vitalidad

`BarraTacticaPersonaje.tsx` permite aplicar y quitar condiciones, ejecutar descansos y cambiar la ventaja de las tiradas.

La hoja registra puntos de golpe actuales, máximos y temporales; dados de golpe; cansancio; inspiración; concentración; y salvaciones contra la muerte. `procesadorDescansos.ts` ejecuta descansos cortos y largos.

Las tiradas de salvación contra la muerte se envían a TaleSpire y `lanzadorDados.ts` aplica el resultado al estado: un 1 suma dos fallos, un 20 suma tres éxitos y recupera un punto de golpe, 10 a 19 suma un éxito y 2 a 9 suma un fallo.

## Iniciativa y miniatura

`IniciativaJugador.tsx` muestra la cola sincronizada y el turno del personaje. El jugador puede lanzar iniciativa desde `MetricasRapidasPersonaje.tsx`. La ficha, la tarjeta y la tirada usan Destreza + ajuste manual + los bonos declarados de los rasgos, como Alerta. El bono y el resultado tirado son valores separados.

`vincularMiniaturaTSPersonaje` guarda el identificador de la miniatura en el personaje. `resolutorMiniaturasJugador.ts` puede emparejar personajes con criaturas que pertenecen al jugador y resolver la miniatura activa.

## Recursos durante la sesión

Los cambios de recursos pasan por `slicePersonajes`, no por estados locales aislados de cada tarjeta. Esto permite que la hoja, la vista de ataques, la magia y la barra táctica vean el mismo valor.

Los recursos que pueden cambiar incluyen puntos de golpe, dados de golpe, usos de rasgos, espacios de conjuro, puntos de conjuro, espacios de pacto, puntos de hechicería, inspiración, concentración, munición y monedas.

Cuando una acción gasta un recurso, la interfaz comprueba la disponibilidad antes de ejecutar la tirada. Si la acción no puede completarse, no debe consumir el recurso.

## Progresión

La aplicación conserva nivel, experiencia y build de clase en el personaje. `aplicarBuildClaseAPersonaje` incorpora los rasgos y las opciones que corresponden al nivel seleccionado.

Los selectores derivados vuelven a calcular estadísticas cuando cambia el nivel, una característica, una competencia, un objeto equipado o una condición activa.

## Descansos

El descanso corto recupera los recursos definidos por cada rasgo y permite gastar dados de golpe. El descanso largo restablece los recursos diarios, recupera vitalidad según la implementación y actualiza condiciones que dependan del descanso.

El procesador de descansos devuelve un resultado estructurado para que la hoja pueda mostrar los cambios y la notificación correspondiente.

## Salvaciones y condiciones

Las condiciones no son solo etiquetas visuales. `procesadorCondiciones.ts` evalúa sus modificadores en ataques, habilidades, salvaciones e iniciativa, y los rasgos pueden añadir reglas adicionales.

La concentración se guarda en el personaje y se puede perder al aplicar el cambio que corresponda. Las salvaciones contra la muerte usan la misma infraestructura de dados, pero aplican sus resultados a contadores de éxitos y fallos.

## Teclado y ventanas de detalle

Los detalles de conjuros, rasgos e inventario y el alta de objetos se abren como diálogos modales. Tab y Mayús+Tab recorren sus controles; Escape cierra la ventana superior y devuelve el foco al origen. Un selector abierto consume primero Escape, también al abrirlo desde su flecha, y conserva la edición del formulario. Cancelar una recuperación, conversión o activación deja los recursos intactos.

Los compendios incluyen botones «Ver detalles de…», separados de aprender y preparar. Los selectores admiten flechas, Inicio/Fin y Enter/Espacio; Tab continúa al siguiente control. La posición de teclado se conserva al renderizarse de nuevo la vista; las sugerencias recorren el orden visual de los grupos y ajustan su opción activa al filtrarse. En los campos de sugerencias se puede seguir escribiendo espacios. El menú Homebrew comunica su expansión y permite el mismo recorrido por teclado.

