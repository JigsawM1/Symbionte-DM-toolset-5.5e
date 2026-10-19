# Hechicero: fases 1–6

Implementación autorizada de la clase general, sus cuatro subclases y Metamagia mediante el catálogo y el builder compartido. Se conservan los cambios locales de descripciones, los identificadores previos de las subclases y los rasgos personalizados. Las opciones de Metamagia proceden de `dicionario_herramientas/clases/metamagia/` y tienen una única definición ejecutable en `src/datos/metamagia.json`.

## Comportamiento

| Rasgo | Resultado |
| --- | --- |
| Lanzamiento de conjuros | Progresión de lanzador completo y preparados; sin contador independiente. |
| Hechicería innata | Dos usos por descanso largo; efecto de diez rondas; +1 CD y ventaja en ataques de conjuros de la clase declarada. Termina al desactivar, retirar/caducar el efecto o completar un descanso. |
| Fuente de magia | Reserva única igual al nivel de hechicero; recuperación en descanso largo y conservación del gasto al reconstruir/cargar. |
| Crear espacios | Compra de espacios de niveles 1–5 por 2/3/5/6/7 puntos; niveles mínimos de clase 2/3/5/7/9. La tienda existente distingue creación y recuperación por metadatos. |
| Convertir espacios | Selección de un espacio ordinario, adicional o de pacto. Recuperación igual a su nivel, limitada por el máximo y mostrada antes de confirmar. |
| Restauración hechicera | Elección al cerrar un descanso corto: recuperar hasta la mitad del nivel de clase, redondeada hacia abajo. Consume un uso diario al confirmar una recuperación efectiva. |
| Hechicería encarnada | Extensión que habilita la activación de Innata por dos puntos cuando se han agotado sus usos propios. Pago y activación en una única operación. |
| Mejoras y Don épico | Selectores generales existentes. |
| Metamagia y Apoteosis | Selector de diez opciones desde catálogo independiente, con 2/4/6 elecciones a niveles 2/10/17. Gasto declarado de 1 o 2 puntos. Uso gratuito explícito al nivel 20 mientras Innata está activa; límite por turno y modificaciones del conjuro manuales. |

## Capacidades generales

- Contratos opcionales en `MecanicasRasgo`: conversión de espacios con tabla de costes y niveles, recuperación opcional en descansos, activación con reserva alternativa y finalización al descansar.
- Efectos declarativos de modificación de CD y ventaja de ataque de conjuro, con filtro opcional por clase de procedencia. La ficha permite elegir la clase de lanzamiento cuando hay varios lanzadores; no utiliza el nombre de Innata para conceder beneficios.
- Constructor visual con edición de reserva, tabla, recuperación, coste alternativo y modificadores mágicos. Las mismas capacidades funcionan en rasgos personalizados.
- `espaciosConjuroAdicionales` guarda cantidades disponibles por nivel, separadas de los máximos ordinarios. Se consumen primero, persisten en la ficha y desaparecen en descanso largo. Los puntos del sistema alternativo de magia siguen siendo una reserva diferente.
- Intercambios validados sobre el estado vigente; confirmar dos veces un diálogo no duplica la operación. Escape, cierre y cancelación descartan el borrador.
- El lanzamiento central emite antes de consumir: un fallo de emisión no descuenta espacios ni inicia concentración. Un bloqueo por personaje evita envíos simultáneos desde ese consumidor.
- Compatibilidad: los duplicados informativos no sustituyen el estado de una reserva. Los campos antiguos de puntos de hechicería sirven de migración únicamente cuando falta un contador válido del rasgo y después reflejan la reserva autoritativa.

## Evidencia previa de la fase 1

- `pnpm run ci`: TypeScript, ESLint, pruebas, límites de componentes y build.
- `pnpm run test:hechicero-ui`: App completa en Chromium local a 599/433 px y alturas 760/600 px. Incluye Innata, activación alternativa, compra/conversión, persistencia, descansos y edición/ejecución del constructor.
- `src/servicios/hechiceroFase1.test.ts`: 32 casos de niveles, costes, multiclase, reservas, procedencia, CD emitida, caducidad, reconstrucción, migración y builder personalizado.
- Evidencia reproducible en `scratch/ci-hechicero-fase1.log`, `scratch/test-hechicero-fase1.log`, `scratch/ui-hechicero-fase1.log` e `scratch/informe-hechicero-ui.json`.

Resultado: 149 suites y 2.141 pruebas aprobadas; 166 componentes auditados. Cinco grupos de flujos de interfaz en cuatro combinaciones de tamaño, sin errores JavaScript; incluye CD por clase, ventaja emitida y fallo simulado de emisión sin gasto. También pasan `test:brujo-ui`, `test:guerrero-ui` y `test:barbaro-ui`. Las capturas de conversión, descanso, constructor y multiclase se revisaron visualmente.

## Fase 2: Hechicería Aberrante

| Rasgo | Ejecución |
| --- | --- |
| Conjuros psiónicos | Siempre preparados y truco adicional según nivel de clase; concesión con identificadores reales y tabla de desbloqueos a niveles 5/7/9 en el mismo rasgo. |
| Habla telepática | Información conservada; comunicación y vínculo manuales. |
| Hechicería psiónica | Al pulsar Lanzar en la carta de un conjuro concedido de niveles 1–5, ofrece espacio o pago de su nivel base con Fuente de magia. No permite subir el nivel pagando puntos ni usar conjuros ajenos. La procedencia y aptitud son las de la concesión. El detalle del rasgo conserva la descripción sin duplicar controles de lanzamiento. |
| Defensas psíquicas | Resistencia psíquica en el resumen de defensas. Ventaja contra Hechizado/Asustado como recordatorio condicional, sin ventaja general en salvaciones. |
| Revelación de la carne | Elección de 1–4 alteraciones antes de pagar, un punto por opción, bloqueo durante la activación y efecto común de 100 rondas. Nado doble de caminar y vuelo igual a caminar. Retirar/caducar el efecto elimina los beneficios; desactivar no devuelve puntos. |
| Implosión deformadora | Un uso por descanso largo, tirada de 3d10, CD de Fuerza basada en Carisma y recarga de un uso por cinco puntos. Teletransporte, selección, daño de fuerza y atracción se aplican manualmente. |

Las excepciones de componentes de Hechicería psiónica se muestran como recordatorio. No se interpreta texto para decidir si un material cuesta dinero o se consume.

## Fase 3: Hechicería del Mecanismo de Relojería

| Rasgo | Ejecución |
| --- | --- |
| Conjuros de relojería | Progresión de siempre preparados corregida según las descripciones locales. Manifestaciones del orden: consulta y d6 existentes. |
| Restaurar equilibrio | Reacción con máximo `max(1, modificador de Carisma)` y descanso largo. La modificación de la tirada ajena es manual. |
| Bastión de la ley | Compra de 1–5d8, un punto por dado. Reserva propia persistente: crear reemplaza la anterior; gastar dados después emite la tirada y solo entonces consume. Descanso corto la conserva; largo la elimina. Beneficiario y reducción de daño manuales. |
| Trance del orden | Activable, un uso por descanso largo, efecto informativo de diez rondas y recarga por cinco puntos. |
| Cabalgata de relojería | Consumible informativo, un uso por descanso largo y recarga por siete puntos. |

## Fase 4: Hechicería Dracónica

| Rasgo | Ejecución |
| --- | --- |
| Resiliencia dracónica | Bono igual al nivel de hechicero mediante el mecanismo permanente existente de PG, compartido con otras mejoras: se incorpora una vez a la base y solo se aplica la diferencia al subir de nivel. Reconstruir/cargar no vuelve a sumarlo. CA sin armadura 10 + Destreza + Carisma, sin sumar fórmulas alternativas. |
| Conjuros dracónicos | Diez siempre preparados, desbloqueados en niveles 3/5/7/9 según el texto local. |
| Afinidad elemental | Elección de ácido/frío/fuego/relámpago/veneno y resistencia visible correspondiente. El bono de Carisma al daño permanece manual; no se analizan descripciones de conjuros para inferir su daño. |
| Alas de dragón | Un uso por descanso largo, vuelo de 60 pies durante 600 rondas, retirada/caducidad y recarga por tres puntos. Nuevo efecto en el catálogo compartido. |
| Compañero dragón | Invocar dragón gratis una vez por descanso largo, con aptitud Carisma. También conserva el lanzamiento por espacio. Ambos omiten únicamente materiales; componentes verbales/somáticos permanecen. Al lanzar desde cualquier tarjeta se elige duración normal con concentración o un minuto sin ella; Escape/cancelación no gasta. |

Alias del compendio resueltos al declarar los datos: Astilla mental → Fragmento Mental; Susurros disonantes → Susurros discordantes; Enviar → Recado; Invocar constructo → Invocar autómata; Miedo → Terror; Sabiduría popular → Conocer las leyendas. No se añaden búsquedas de texto en los consumidores.

## Fase 5: Hechicería de Magia Salvaje

| Rasgo | Ejecución |
| --- | --- |
| Oleada de magia salvaje | Botón de 1d20; elegibilidad y límite de una vez por turno manuales. |
| Tabla de Oleada | 25 filas estructuradas que cubren d100. Las subtiradas corresponden a la fila: d4/d8/d10/4d10/d6 y, cuando procede, 2d10. No se tira un d10 indiscriminadamente. Se muestra resultado y se envía al chat si TaleSpire está conectado. |
| Mareas de caos | Preparación activable de ventaja en la siguiente prueba d20. El uso se gasta tras emitir correctamente una prueba/ataque/salvación/iniciativa; daño y d20 de tablas no la consumen. Desactivar antes de tirar cancela sin gasto. Recarga tras largo o confirmación manual de conjuro válido con espacio, que también resuelve una oleada. |
| Torcer la suerte | Reacción con gasto de un punto tras emitir 1d4. Aplicar suma/resta a la tirada ajena es manual. |
| Caos controlado | Extensión del mismo rasgo de tabla: dos d100, elección de uno y subtiradas únicamente del elegido. También se aplica a la oleada de recarga de Mareas. |
| Oleada domada | Un uso por descanso largo; elección entre las 24 primeras filas y resolución de sus subtiradas. |

El último resultado resuelto queda guardado en la ficha. Si falla el chat, se puede cerrar, recargar y reintentar el mismo texto sin repetir dados ni gastar otro uso. Los efectos de la tabla y su aplicación a criaturas son manuales. El azar de las tablas es local, siguiendo el patrón de las tablas del DM; no se certifican tiradas físicas de d100.

## Fase 6: Metamagia

`src/datos/metamagia.json` contiene las diez opciones con los nombres y descripciones de la carpeta proporcionada. Conjuro Acelerado e Intensificado cuestan dos puntos; las otras ocho opciones cuestan uno. El hidratador general carga el catálogo, el selector existente materializa las opciones aprendidas y los controles compartidos ejecutan el gasto. La entrada duplicada de opciones se consolida en el selector; los documentos fuente originales permanecen en el diccionario.

Las mejoras de niveles 10/17 se fusionan en el mismo rasgo. Hechicería encarnada conserva el recordatorio de dos opciones durante Innata. Apoteosis ofrece un botón de uso gratuito al nivel 20 solo mientras Innata está activa. El jugador controla la gratuidad de una opción por turno propio, las combinaciones compatibles y la modificación/repetición real del conjuro; no se inventa un rastreador de turnos.

## Capacidades compartidas añadidas

- Contratos Zod comunes a catálogo, opciones, rasgos de personaje y builder para coste por selector, coste de recarga, reserva independiente de dados, concesiones de lanzamiento con recursos, variante sin concentración, materiales, preparación d20 y tablas.
- Campos visibles del constructor para esas capacidades; catálogos de selector cargables por clave y tabla editable como configuración validada. Se rechazan rangos incompletos o solapados. Las referencias a rasgos son por ID.
- Construcción, fusión de extensiones, evaluadores, acciones del almacén, persistencia canónica/personalizada y consumidores visibles comparten los mismos contratos. Reserva de dados y resultados pendientes persisten explícitamente.
- Las decisiones de activación se validan antes de cambiar elecciones o pagar. El coste de recarga sigue siendo uno por defecto para preservar rasgos anteriores.
- Los usos por modificador conservan el gasto al aumentar el máximo y mantienen el límite previo al reducirlo. No se amplía el transporte de combate del tracker.

## Validación de las fases 2–6

- `pnpm run ci`: salida 0; **150 suites, 2.173 pruebas**, TypeScript, ESLint, auditoría de **172 archivos** y build. Permanece el aviso previo de chunks grandes.
- `src/servicios/hechiceroSubclases.test.ts`: 32 pruebas nuevas; clase/subclase/nivel, datos, costes, puntos insuficientes, reservas, descansos, recarga, PG reales al crear/subir nivel, procedencia, defensas, caducidad, selección, builder y persistencia. Se mantienen las 32 de fase 1.
- `pnpm run test:hechicero-ui`: diez grupos de flujos en 599×760, 599×600, 433×760 y 433×600, sin errores JavaScript. Incluye confirmación, Escape/cancelación, doble pulsación, reserva posterior, selección, duración de conjuro, iniciativa con Mareas, gasto/gratuidad y reintento del mismo resultado de chat. Capturas revisadas.
- Regresiones de interfaz compartidas: `test:barbaro-ui` (14 grupos/32 dimensiones), `test:brujo-ui` y `test:guerrero-ui` (9/16), sin errores JavaScript. La primera apertura de Bárbaro agotó el tiempo con otra compilación simultánea; la ejecución secuencial final pasó.
- Evidencia local: `scratch/ci-hechicero-fases.log`, `scratch/hechicero-subclases-tests.log`, `scratch/ui-hechicero-fases.log` y `scratch/informe-hechicero-ui.json`.

Las resistencias quedan declaradas y visibles mediante el resumen de defensas existente. La entrada de daño del personaje recibe una cantidad final sin tipo, por lo que su mitigación se aplica manualmente; no se presenta como reducción automática de PG.

El inspector real de TaleSpire respondió como CEF **137.0.7151.104**, pero rechazó crear una página de pruebas aislada (`Failed to create a page for context`). No se modificó la página instalada ni la partida abierta. Las pruebas funcionales anteriores corresponden a Chromium local y adaptadores simulados; **no certifican CEF, chat real ni sesión multicliente**. No se ha desplegado.

## Ajustes de interfaz solicitados

- Bastión de la ley usa controles de cantidad con botones de sumar/restar, reserva disponible y resumen de dados/coste antes de confirmar. El diálogo también mejora el gasto posterior y conserva sus bloqueos durante la emisión.
- Los conjuros psiónicos utilizan el diálogo compartido de opciones de lanzamiento, también empleado por Invocar dragón. Muestra el nivel y los puntos disponibles; deshabilita cada alternativa según su propio recurso. Cierre, Escape y Cancelar no gastan. La elección se vuelve a validar sobre la ficha vigente antes de emitir y consumir.
- Se eliminaron las nueve extensiones «Conjuros … ampliados» de Aberrante, Relojería y Dracónica. Los desbloqueos permanecen en el rasgo original mediante `escaladoConjurosOtorgados`, capacidad general editable en el builder, validada y persistida también para rasgos personalizados. No añade párrafos artificiales a las descripciones.
- Validación actual: `pnpm run ci`, salida **0**, **150 suites y 2.178 pruebas**, TypeScript, ESLint, 172 archivos auditados y build. Permanece el aviso de tamaño de chunks.
- `pnpm run test:hechicero-ui`, salida **0**, diez grupos en **599×760, 599×600, 433×760 y 433×600**, sin errores JavaScript. Incluye selección desde la carta, pago por espacio/puntos, reservas agotadas, fallo simulado de emisión sin gasto, doble pulsación y cancelación. Capturas de Bastión y lanzamiento psiónico revisadas visualmente.
- Evidencia: `scratch/ci-hechicero-ajustes-ui.log`, `scratch/ui-hechicero-ajustes.log`, `scratch/informe-hechicero-ui.json` y capturas `scratch/hechicero-bastion-*` / `scratch/hechicero-psionico-*`. El grafo local se actualizó y se regeneró sin etiquetado mediante modelo. Estos ajustes se verificaron en Chromium local; no aportan certificación adicional de CEF/TaleSpire.
