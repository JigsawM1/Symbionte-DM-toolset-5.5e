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

## Sincronización en Tiempo Real (`TS.sync`)

`sincronizacionSimbiote.ts` y `TaleSpireAdapter.ts` gestionan la sincronización bidireccional en tiempo real entre el Master y los Jugadores a través del canal de red nativo `TS.sync`:

- Protocolo compacto Wire v2 con fragmentación automática de paquetes (`DM_CHUNK` / `< 380 bytes`) para cumplir con el límite estricto de la API de TaleSpire (< 500 caracteres).
- Cola FIFO con throttling e intervalos seguros (180 ms) y retroceso exponencial ante errores `rateLimited` de TaleSpire.
- El Master ejerce la autoridad del estado de combate, mientras los Jugadores transmiten la salud, condiciones, efectos y acompañantes de su héroe activo.
- Mecanismo de confirmación de entrega (ACK) y reintentos para asegurar que no se pierdan actualizaciones en partidas con latencia.

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

`Compendio.tsx` combina listados de hechizos y homebrew. `CreadorHomebrew.tsx` ofrece formularios separados para criaturas, hechizos y objetos.

`sliceHomebrew.ts` mantiene las tres bases de datos y permite crear, editar, eliminar y usar objetos como plantilla. Los formularios pasan por las funciones de saneamiento antes de entrar en el estado.

Los formularios de criatura y hechizo utilizan los tipos de `src/tipos`; los esquemas Zod validan la forma de los datos importados y editados.

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
