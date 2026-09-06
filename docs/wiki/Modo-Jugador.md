# Modo Jugador

El modo Jugador se muestra cuando `esGM` es falso. `src/App.tsx` cambia las pestañas a `IniciativaJugador`, `VistaAtaquesJugador`, `Compendio`, `VistaRasgosJugador`, `VistaInventarioJugador` y la hoja de personaje.

## Hoja de personaje

`src/componentes/caracteristicas/personajes/HojaPersonaje.tsx` combina:

- `CabeceraPersonaje`.
- `MetricasRapidasPersonaje`.
- `PanelVitalidadPersonaje`.
- `PanelAtributosPersonaje`.
- `PanelHabilidadesPersonaje`.
- `PanelConjurosPersonaje`.
- `PanelInventarioPersonaje`.
- `BarraTacticaPersonaje`.

Los selectores derivados calculan bono de competencia, puntuaciones efectivas, modificadores, salvaciones, habilidades, pasivas, clase de armadura, velocidad y bono de daño de Furia.

## Clases, subclases y rasgos

`src/constantes/clasesDND55.ts` contiene el catálogo de clases y subclases de D&D 5.5e 2024. `gestorClases.ts` obtiene clases, subclases y rasgos, construye builds y los aplica al personaje.

`VistaRasgosJugador.tsx` muestra rasgos de especie, clase, subclase, dotes y rasgos personalizados. `TablaProgresionRasgo.tsx` presenta tablas de progresión por nivel.

Los rasgos pueden tener usos, recuperación, activación, selectores y efectos mecánicos. `evaluadorEfectosRasgos.ts` aplica modificadores de características, defensa sin armadura, velocidad y ventajas en tiradas según los rasgos activos.

## Ataques y acciones

`VistaAtaquesJugador.tsx` presenta ataques de armas, ataques desarmados, conjuros y consumibles. `TarjetaAtaquePersonaje.tsx` construye fórmulas de ataque y daño, respeta propiedades del arma y consulta condiciones y competencia.

La acción puede consumir acción, acción adicional, reacción o una categoría especial. Las tiradas se envían a TaleSpire mediante `lanzarDadosTaleSpire`.

La ventaja y la desventaja pueden proceder de la barra táctica, de condiciones o de rasgos. Las fuentes opuestas se anulan según la lógica implementada en `lanzadorDados.ts`.

## Magia y conjuros

`PanelConjurosPersonaje.tsx` y `CompendioConjurosJugador.tsx` gestionan conjuros conocidos, preparados, disponibles y todos los conjuros del compendio.

El sistema calcula:

- Espacios de conjuro.
- Puntos de conjuro.
- Espacios de pacto.
- Bono de ataque de conjuro y CD.
- Recursos de lanzadores multiclase.
- Opciones de lanzamiento a nivel superior.
- Conjuros de subclase siempre preparados.
- Arcanos Místicos de brujo.

Un conjuro puede ocultarse de la lista visible, prepararse, desprepararse y lanzarse con el recurso correspondiente. `servicioLanzamientoConjuros.ts` valida la solicitud y prepara la fórmula antes de enviarla a la API de dados.

## Inventario y munición

`PanelInventarioPersonaje.tsx` permite añadir objetos del compendio o personalizados, cambiar cantidades, equipar, sintonizar, editar notas y mover objetos entre contenedores.

`calculadorInventario.ts` calcula capacidad, peso de objetos, peso de monedas, sintonizaciones y sobrecarga. Los contenedores incluyen mochila, bolsa de contención, montura y almacén.

`gestorMunicion.ts` relaciona armas y tipos de munición, determina compatibilidad, detecta contenedores físicos y calcula su contenido. El inventario puede desempaquetar paquetes y consumir munición desde su almacenamiento.

## Condiciones y vitalidad

`BarraTacticaPersonaje.tsx` permite aplicar y quitar condiciones, ejecutar descansos y cambiar la ventaja de las tiradas.

La hoja registra puntos de golpe actuales, máximos y temporales; dados de golpe; cansancio; inspiración; concentración; y salvaciones contra la muerte. `procesadorDescansos.ts` ejecuta descansos cortos y largos.

Las tiradas de salvación contra la muerte se envían a TaleSpire y `lanzadorDados.ts` aplica el resultado al estado: un 1 suma dos fallos, un 20 suma tres éxitos y recupera un punto de golpe, 10 a 19 suma un éxito y 2 a 9 suma un fallo.

## Iniciativa y miniatura

`IniciativaJugador.tsx` muestra la cola sincronizada y el turno del personaje. El jugador puede lanzar iniciativa desde `MetricasRapidasPersonaje.tsx`.

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
