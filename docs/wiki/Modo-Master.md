# Modo Master

El modo Master se selecciona cuando `esGM` es verdadero. `src/App.tsx` muestra `GestorIniciativa` para la pestaña de iniciativa y las herramientas de campaña para las demás pestañas.

## Gestor de iniciativa

`src/componentes/caracteristicas/iniciativa/GestorIniciativa.tsx` coordina la cola de combate. El Master puede:

- Iniciar, avanzar, retroceder y reiniciar rondas y turnos.
- Importar la cola nativa mediante `actualizarColaIniciativaDesdeTaleSpire`.
- Añadir criaturas seleccionadas físicamente en TaleSpire.
- Ordenar la cola y lanzar iniciativa de monstruos.
- Modificar la iniciativa de una criatura durante el combate.
- Modificar vida actual y vida temporal.
- Aplicar y quitar condiciones y efectos con duración.
- Ejecutar salvaciones en área con CD y mitigación.
- Consultar de forma inmediata las métricas pasivas de los jugadores (Percepción Pasiva, Investigación Pasiva y Perspicacia Pasiva) mediante insignias tácticas en las tarjetas de la cola.

Al añadir o refrescar una ficha, su identidad procede de los IDs de ficha, miniatura y dueño. Los nombres A/B, sufijos numéricos y fichas homónimas se mantienen separados. Escribir el nombre completo prioriza su coincidencia exacta; si varias fichas comparten nombre, selecciona una sugerencia explícita. «EN COMBATE» corresponde a esa identidad. Una fila genérica sin vínculo sólo se adopta si identifica inequívocamente una ficha.

La ficha y la tarjeta comparten el bono completo de iniciativa (Destreza, ajuste manual y rasgos). Refrescar estadísticas mantiene el resultado tirado, el orden y el turno. Al recibir una tirada se busca primero el ID de la cola: un monstruo identificado conserva su naturaleza y plantilla aunque exista un PJ homónimo. Las colas fusionadas por versiones anteriores requieren revisión y añadir de nuevo los participantes: no se reconstruyen automáticamente. La normalización de instancias A/B y numéricas continúa disponible para plantillas de monstruos.

## Sincronización en Tiempo Real (`TS.sync`)

La ruta de red activa es Sync v4. Consulta [Sincronización del combate v4](../sincronizacion-v4.md) para la autoridad del director, campaña, tablero, propuestas, confirmaciones y recuperación de cambios pendientes. Los adaptadores históricos se conservan para leer fichas y borradores anteriores; no seleccionan destinos remotos por nombre.


## Tarjetas de criatura

`TarjetaCriaturaIniciativa.tsx` muestra nombre, iniciativa, vida, vida temporal, clase de armadura, velocidad, insignias pasivas de jugadores (Percepción, Investigación, Perspicacia), condiciones y efectos.

Cuando existe una plantilla asociada, `PanelFichaDnD.tsx` y la tarjeta pueden mostrar estadísticas, acciones rápidas y otros datos de la ficha. `VinculadorPlantilla.tsx` permite elegir la plantilla del compendio para una criatura.

Los botones de la tarjeta permiten lanzar acciones rápidas de la plantilla y eliminar la criatura de la cola.

## Condiciones y efectos

`SelectorCondiciones.tsx`, `ChipCondicion.tsx` y `procesadorCondiciones.ts` gestionan condiciones activas. El Master puede aplicar condiciones a una criatura o a un conjunto de objetivos.

Los efectos activos tienen identificador, nombre, duración y opción de concentración. `sincronizacionIniciativa.ts` filtra efectos cuyo límite de ronda ya ha expirado.

El diccionario de `src/utiles/datosIniciales.ts` incluye condiciones y efectos predefinidos de D&D 2024, entre ellos cansancio y Desangrándose.

## Buscador y encuentros

`BuscadorMonstruos.tsx` busca en la base de datos de monstruos y permite añadir resultados a la iniciativa. `MenuEncuentros.tsx` guarda el nombre, la ronda y la cola actual; después puede cargar o eliminar encuentros guardados.

La configuración del slice evita guardar un encuentro vacío o sin nombre.

## Compendio y homebrew

`Compendio.tsx` combina listados de hechizos y homebrew. `CreadorHomebrew.tsx` ofrece formularios separados para criaturas, hechizos, objetos e invocaciones PJ.

`sliceHomebrew.ts` mantiene los catálogos editables y permite usar objetos como plantilla. Los formularios pasan por las funciones de saneamiento antes de entrar en el estado.

Los formularios de criatura y hechizo utilizan los tipos de `src/tipos`; los esquemas Zod validan la forma de los datos importados y editados.

En **Homebrew → Invocaciones PJ**, confirma o cancela cada velocidad especial, ataque, rasgo, acción adicional o reacción que estés editando antes de guardar la ficha. Puedes cambiar entre General, Escalado y Ataques y rasgos mientras editas una fila. Si una plantilla antigua guarda la velocidad o los sentidos como texto, el formulario ofrece un campo de texto para conservar sus condiciones y notas. Durante el escalado se aplica la velocidad especial con el mayor nivel mínimo que alcance el conjuro.

## Tablas, pendientes y notas

`TablasDM.tsx` reúne:

- `DiccionarioCondiciones`.
- `CalculadoraViaje`.
- `CalculadoraSalto`.
- `ConversorDivisas`.
- `ConsolaCriticosPifias`: Consola de críticos y pifias d12 con 72 efectos canónicos diferenciados para ataques cuerpo a cuerpo, a distancia y mágicos, con tirada virtual, envío a TaleSpire y narrativa/mecánica separadas.
- `ReglasBasicas`.

`Pendientes.tsx` gestiona tareas de sesión con alta, finalización y borrado. `NotasDM.tsx` guarda las notas de la sesión en el estado persistible.

## Configuración

`ConfiguracionDM.tsx` permite importar y exportar la base de datos JSON, restablecer datos de fábrica y ajustar el método de vida de monstruos, el sistema de magia y la visibilidad del porcentaje de vida para jugadores.

La configuración se conserva junto con la cola, los personajes, los encuentros y los datos Homebrew en el blob global de TaleSpire.

## Flujo de una sesión

1. El Master abre o despliega el Symbiote y espera a que se cargue la campaña.
2. La conexión importa la cola de iniciativa y la selección actual de criaturas.
3. El Master vincula plantillas a las criaturas que aún no tienen datos completos.
4. Durante el combate, avanza los turnos y actualiza vida, condiciones y efectos.
5. Al terminar, guarda el encuentro o deja las notas y pendientes para la siguiente sesión.

La cola física de TaleSpire y la información adicional del Master tienen responsabilidades distintas: TaleSpire aporta el orden y las miniaturas, mientras Zustand conserva plantillas, condiciones, efectos y datos de apoyo.

## Vida y visibilidad

Las tarjetas pueden trabajar con vida actual, máxima y temporal. La configuración de campaña controla si el porcentaje de vida se muestra a los jugadores; la información detallada permanece en la vista del Master.

Los cambios de vida se reflejan en el estado local y se envían al adaptador cuando la criatura tiene un identificador válido de TaleSpire.

## Acciones en área

La selección de criaturas del tablero permite aplicar una condición, un efecto o una salvación a varios objetivos. El slice conserva los objetivos seleccionados y ejecuta la misma operación para cada criatura compatible.

Antes de aplicar una salvación en área, el Master puede indicar la característica, la CD, el tipo de daño y la mitigación. Los resultados se relacionan con la tirada emitida para cada objetivo.

## Restablecimiento

La configuración permite restablecer datos de fábrica. Esta acción debe usarse con atención porque reemplaza personajes, bases de datos y preferencias persistidas según las opciones elegidas.

Para una limpieza selectiva, es preferible borrar el encuentro, pendiente, nota o entidad Homebrew desde su propia vista.

## Compendios y teclado

Los botones «Ver detalles de…» abren las fichas de compendio con Enter o Espacio y tienen foco visible. Los detalles de conjuros usan un diálogo nativo: Escape cierra la ventana superior y devuelve el foco. Flechas e Inicio/Fin recorren las opciones de los selectores y el menú Homebrew; Escape cierra primero el desplegable.

