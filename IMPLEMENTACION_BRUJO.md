# Implementación y verificación del Brujo PHB 2024

Fecha: 13-10-2026. Rama: brujo-revision-probablemente-scope-creep-de-nuevo. Alcance: Brujo 1–20, las cuatro subclases del PHB 2024 y las 28 invocaciones sobrenaturales del catálogo. Se continúa el commit 47befff. El cambio local de BarraSuperior.tsx se conserva y queda fuera de esta implementación; se comprobó igualdad SHA-256 con su copia previa al cambio de rama.

## Fuentes y matriz previa

No se recibió una fuente adjunta ni una lista distinta de subclases. Se contrastaron las [reglas oficiales 2024 de clases](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes), el [PHB 2024 licenciado de Archihadas](https://roll20.net/compendium/dnd5e/Subclasses%3AArchfey%20Patron?expansion=32231&iframe=true), [Celestial](https://roll20.net/compendium/dnd5e/Subclasses%3ACelestial%20Patron?expansion=32231&iframe=true), [Gran Primigenio](https://roll20.net/compendium/dnd5e/Subclasses%3AGreat%20Old%20One%20Patron?expansion=32231&iframe=true) y la [comparación oficial del Brujo 2024](https://www.dndbeyond.com/posts/1756-2024-warlock-vs-2014-warlock-whats-new). No se usaron reglas de 2014 ni material de prueba.

La matriz anterior a las ediciones está en [INVENTARIO_BRUJO_PREVIO.md](INVENTARIO_BRUJO_PREVIO.md). Las tablas siguientes completan cada fila con su resultado real. Los marcadores de adquisición se incluyen para que no queden niveles sin explicar.

## Necesidades y ampliaciones genéricas realizadas

| Carencia comprobada | Contrato mínimo | Consumidor conectado |
|---|---|---|
| Astucia tenía contador sin recuperar pacto | recuperarPactoAlUsar | sliceRecursosRasgos: gasto y recuperación atómicos; extensiones: Maestro sustituye la cantidad |
| Recarga adicional de un uso con pacto | recargarUsoConPacto | almacén y controles de tarjetas/modal; evita recargar lleno o sin espacios |
| Luz sanadora solo tiraba un dado o curaba al emisor | curacionDirigida | diálogo de dados/destinatario y metadata de curación del lanzador existente |
| Las opciones de invocación perdían estado propio y campos | MecanicasRasgo compartido, idSelectorOrigen, requiereOpcion | Zod real, hidratación, construcción de hijos, evaluadores, serialización |
| Lanza y Agónica se reconocían por nombre; opciones regalaban el truco referenciado | selectorObjetivo, modificador_alcance_conjuro, destinoConjuros: referencia | filtro común, UI, almacén, evaluación y modificación del conjuro elegido |
| Arcanos se fusionaban y duplicaban contador | destinoConjuros: arcano_mistico, nivelConjuro | reserva existente por nivel, asignación validada, vista filtrada y consumo central |
| El Libro perdía su procedencia de clase | claseConjurosOtorgados | elegibilidad del truco como Brujo y configuración de la aptitud al lanzar |
| El Pacto del filo afectaba todas las armas | vinculoArma | elección de instancia válida, cálculo de ataques y guardado del vínculo |
| PG temporales de Resiliencia sin evento | hpTemporalAlDescansar, hpTemporalAlUsarRasgo | descanso y uso de rasgo declarado; aplica solo al propio personaje |
| Retirar una aportación borraba aprendizaje independiente | aprendizajesConjurosIndependientes | aprendizaje, reconciliación y retirada de subclase/rasgo; se conserva en la ficha |
| Mejora/Don imponían una decisión nueva | requiereEleccionExplicita | catálogos de dotes, requisitos, generación tras elegir y retirada de la dote vinculada |

Los campos opcionales compartidos se conservan también al editar un rasgo con el constructor. No se añadieron ramas de ejecución por nombres de rasgos del Brujo. Las referencias entre entidades y las fuentes de catálogos son explícitas. Se conservaron los consumidores generales existentes y el contrato de combate de sincronización: los usos y elecciones de rasgos permanecen locales.

## Catálogos asociados

| Archivo | Uso y resultado |
|---|---|
| src/datos/clases/brujo.json | Clase y cuatro subclases; reservas, niveles, selectores y listas corregidos |
| src/datos/invocaciones-sobrenaturales.json | 28 opciones con requisitos ejecutables, acciones y mecánicas revisadas |
| src/utiles/compendios/all.json | Fuente real de trucos, rituales, arcanos y filtros de daño/ataque/alcance; consultado sin cambiar entradas |
| src/datos/dotes/origen.json | Lecciones de los Primeros: hidratación completa de la opción, incluidos efectos/selectores; datos conservados |
| src/datos/dotes/generales.json, epicas.json, estilo_combate.json | Elecciones de Mejora/Don: catálogos conservados y requisitos evaluados |
| Objetos iniciales y objetosHomebrew | Elegibilidad del arma real para el vínculo: cuerpo a cuerpo o mágica; catálogo conservado |

src/datos/invocaciones/invocaciones.2024-es.json corresponde a criaturas invocadas y no se editó.

## Tabla de clase

Los niveles son de Brujo; el daño base de los trucos sigue usando nivel total según su consumidor existente. Las reservas de pacto se recuperan en descanso corto o largo; Astucia no duplica esa reserva. Las categorías describen el consumidor y no garantizan que toda la regla esté automatizada.

| Rasgo | Nivel de Brujo | Categoría y justificación | Acción | Recursos y recuperación | Dados y escalados | Efectos ejecutables | Selectores | Dependencia | Estado y límite concreto |
|---|---:|---|---|---|---|---|---|---|---|
| Invocaciones sobrenaturales | 1 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | — | invocaciones_sobrenaturales_aprendidas: invocacion, hasta 1; 1→1, 2→3, 5→5, 7→6, 9→7, 12→8, 15→9, 18→10; invocaciones_brujo | — | automatizado. La selección genera rasgos efectivos con estado propio, requisitos y retirada. Las limitaciones de cada opción se detallan debajo. |
| Magia del pacto | 1 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | parcialmente automatizado. Reservas, recuperación y progresión existentes operativas. La lista se elige en el compendio. La ficha comparte una aptitud principal para aprendizajes multiclase sin procedencia de clase explícita. |
| Astucia mágica | 2 | consumible: gasto de recurso limitado | especial | 1 usos/dados; descanso_largo; recupera pacto: mitad_maximo | — | — | — | — | automatizado. El botón gasta un uso y recupera espacios en una transacción. La duración del rito se comprueba en mesa. |
| Subclase de brujo | 3 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | informativo. Marcador ocultado por el constructor; la elección de subclase se realiza en configuración. |
| Mejora de característica | 4 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | — | selector_dote_asi_brujo_nv4: dote, hasta 1; dotes_elegibles | — | parcialmente automatizado. Dote elegida, requisitos y efectos existentes ejecutados; sin dote arbitraria. La distribución de aumentos depende del consumidor de la dote seleccionada. |
| Rasgo de subclase | 6 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | informativo. Marcador de adquisición ocultado; se construyen los rasgos reales de la subclase. |
| Mejora de característica | 8 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | — | selector_dote_asi_brujo_nv8: dote, hasta 1; dotes_elegibles | — | parcialmente automatizado. Dote elegida, requisitos y efectos existentes ejecutados; sin dote arbitraria. La distribución de aumentos depende del consumidor de la dote seleccionada. |
| Contactar con el patrón | 9 | consumible: gasto de recurso limitado | especial | 1 usos/dados; descanso_largo; contactar con otro plano: descanso_largo | — | — | — | — | parcialmente automatizado. Preparación y lanzamiento gratuito con gasto propio. El contacto narrativo y la salvación automáticamente superada se resuelven en mesa. |
| Rasgo de subclase | 10 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | informativo. Marcador de adquisición ocultado; se construyen los rasgos reales de la subclase. |
| Arcano místico | 11 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | 1 lanzamiento propio por nivel; descanso largo, administrado en arcanoMisticoGastados | — | — | arcano_mistico_nivel_6: conjuro, hasta 1; conjuros6_brujo; destino arcano_mistico | — | automatizado. Selector conectado a la reserva existente por nivel; sin contador duplicado. Elección, gasto, bloqueo y recuperación separados. |
| Mejora de característica | 12 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | — | selector_dote_asi_brujo_nv12: dote, hasta 1; dotes_elegibles | — | parcialmente automatizado. Dote elegida, requisitos y efectos existentes ejecutados; sin dote arbitraria. La distribución de aumentos depende del consumidor de la dote seleccionada. |
| Arcano místico II | 13 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | 1 lanzamiento propio por nivel; descanso largo, administrado en arcanoMisticoGastados | — | — | arcano_mistico_nivel_7: conjuro, hasta 1; conjuros7_brujo; destino arcano_mistico | — | automatizado. Concesión independiente de nivel 7; no se fusiona la reserva con el arcano de nivel 6. |
| Rasgo de subclase | 14 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | informativo. Marcador de adquisición ocultado; se construyen los rasgos reales de la subclase. |
| Arcano místico III | 15 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | 1 lanzamiento propio por nivel; descanso largo, administrado en arcanoMisticoGastados | — | — | arcano_mistico_nivel_8: conjuro, hasta 1; conjuros8_brujo; destino arcano_mistico | — | automatizado. Concesión independiente de nivel 8; preserva el estado de los anteriores. |
| Mejora de característica | 16 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | — | selector_dote_asi_brujo_nv16: dote, hasta 1; dotes_elegibles | — | parcialmente automatizado. Dote elegida, requisitos y efectos existentes ejecutados; sin dote arbitraria. La distribución de aumentos depende del consumidor de la dote seleccionada. |
| Arcano místico IV | 17 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | 1 lanzamiento propio por nivel; descanso largo, administrado en arcanoMisticoGastados | — | — | arcano_mistico_nivel_9: conjuro, hasta 1; conjuros9_brujo; destino arcano_mistico | — | automatizado. Concesión independiente de nivel 9; preserva el estado de los anteriores. |
| Don épico | 19 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | — | selector_dote_don_epico_brujo_nv19: dote, hasta 1; dotes_elegibles | — | parcialmente automatizado. Elección explícita de una dote elegible; ejecución según el catálogo de la dote. Se conserva la recomendación en el texto. |
| Maestro sobrenatural | 20 | extension: fusión con el padre, sin reserva propia | pasivo | recupera pacto: maximo | — | — | — | Astucia mágica | automatizado. Sustituye la recuperación de Astucia por el máximo. No crea acción, contador ni selector adicionales. |

## Patrón de los Archihadas

| Rasgo | Nivel de Brujo | Categoría y justificación | Acción | Recursos y recuperación | Dados y escalados | Efectos ejecutables | Selectores | Dependencia | Estado y límite concreto |
|---|---:|---|---|---|---|---|---|---|---|
| Conjuros de archihada | 3 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | automatizado. Preparación automática mediante progresionConjuros a niveles 3/5/7/9 y retirada por procedencia. |
| Pasos feéricos | 3 | consumible: gasto de recurso limitado | accion_adicional | máx(1, Carisma) usos/dados; descanso_largo; Paso brumoso: descanso_largo | — | — | efecto_pasos_feericos: general, hasta 1; 2 opciones; consulta; adicionales desde 6 | — | parcialmente automatizado. Lanzamiento gratuito de Paso brumoso y reserva por Carisma. Los cuatro beneficios aparecen como consulta; blancos, desplazamiento, salvaciones y PG temporales ajenos son manuales. |
| Escapada brumosa | 6 | pasivo_permanente: concesión permanente; puede contener una acción | reaccion | — | — | — | — | Pasos feéricos | informativo. Reacción al recibir daño para lanzar Paso brumoso. Sin reserva duplicada ni gasto obligatorio de Pasos: admite lanzamiento con espacios. La aplicación no verifica el disparador de daño. |
| Defensas fascinantes | 10 | consumible: gasto de recurso limitado | reaccion | 1 usos/dados; descanso_largo; recarga 1 uso gastando 1 espacio | — | inmunidad_condicion → hechizado = inmune | — | — | parcialmente automatizado. Inmunidad al estado Hechizado en el resumen de defensas; reserva y recarga con pacto. Reducción del daño, reflejo y salvación del atacante manuales. |
| Magia embrujadora | 14 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | informativo. Paso brumoso como parte de la misma acción al lanzar Encantamiento o Ilusión con acción y espacio; falta un evento de lanzamiento que encadene ese movimiento. |

| Nivel de Brujo | Conjuros siempre preparados | Trucos concedidos |
|---:|---|---|
| 3 | Calmar emociones, Fuego feérico, Paso brumoso, Fuerza fantasmal, Dormir | — |
| 5 | Desplazamiento, Crecimiento vegetal | — |
| 7 | Dominar bestia, Invisibilidad mejorada | — |
| 9 | Dominar persona, Apariencia | — |

## Patrón Celestial

| Rasgo | Nivel de Brujo | Categoría y justificación | Acción | Recursos y recuperación | Dados y escalados | Efectos ejecutables | Selectores | Dependencia | Estado y límite concreto |
|---|---:|---|---|---|---|---|---|---|---|
| Conjuros celestiales | 3 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | automatizado. Listas de conjuros y trucos concedidos por nivel mediante progresionConjuros. |
| Luz sanadora | 3 | curacion: comportamiento de curación y gasto de dados | accion_adicional | nivel de Brujo + 1 usos/dados; descanso_largo | 1d6; 1 a máx(1, Carisma) dados por uso, limitado por la reserva; 60 pies | — | — | — | parcialmente automatizado. Gasto variable de dados y curación real al PJ local elegido; sin curar al emisor ni gastar dos veces. Visibilidad y 60 pies se confirman en mesa; no selecciona cualquier criatura del tablero. |
| Alma radiante | 6 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | resistencia_dano → Radiante = resistencia (Radiante) | — | — | parcialmente automatizado. Resistencia Radiante en defensas. El bono de Carisma a un blanco por turno de un conjuro de fuego/radiante no se añade indiscriminadamente a todas las tiradas. |
| Resiliencia celestial | 10 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | hp_temporal → propio = nivel_brujo + carisma | — | — | parcialmente automatizado. PG temporales propios al terminar descanso corto/largo y al usar Astucia. Elección de hasta cinco aliados y sus PG temporales no automatizadas. |
| Venganza abrasadora | 14 | consumible: gasto de recurso limitado | especial | 1 usos/dados; descanso_largo | 2d8+carisma | — | — | — | parcialmente automatizado. Reserva y tirada 2d8+Carisma. Disparador de salvación de muerte, levantarse, media vida, ceguera y aplicación de daño a enemigos manuales. |

| Nivel de Brujo | Conjuros siempre preparados | Trucos concedidos |
|---:|---|---|
| 3 | Auxilio, Curar heridas, Saeta guía, Restablecimiento menor | Luz, Llama sagrada |
| 5 | Luz del día, Revivir | — |
| 7 | Guardián de la fe, Muro de fuego | — |
| 9 | Restablecimiento mayor, Invocar celestial | — |

## Patrón Infernal

| Rasgo | Nivel de Brujo | Categoría y justificación | Acción | Recursos y recuperación | Dados y escalados | Efectos ejecutables | Selectores | Dependencia | Estado y límite concreto |
|---|---:|---|---|---|---|---|---|---|---|
| Conjuros infernales | 3 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | automatizado. Preparación automática por progresionConjuros; listas PHB 2024 corregidas. |
| Bendición del Oscuro | 3 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | hp_temporal → propio = max(1, carisma + nivel_brujo) | — | — | parcialmente automatizado. Botón aplica el máximo entre PG temporales vigentes y la fórmula correcta. El evento de enemigo a 0 PG, incluido el radio de 10 pies, es manual. |
| Propia suerte del Oscuro | 6 | consumible: gasto de recurso limitado | especial | máx(1, Carisma) usos/dados; descanso_largo | 1d10 | — | — | — | parcialmente automatizado. Reserva por Carisma y tirada 1d10. Elección de la prueba/salvación y límite de un uso por tirada manuales. |
| Resiliencia infernal | 10 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | Efectos de la opción elegida (sin los de opciones retiradas) | resiliencia_infernal_tipo: general, hasta 1; 12 opciones | — | parcialmente automatizado. Selector sin Fuerza, con resistencia real y retirada de la anterior. El momento permitido de cambio después de descansar no se bloquea en UI. |
| Arrojar al Infierno | 14 | consumible: gasto de recurso limitado | especial | 1 usos/dados; descanso_largo; recarga 1 uso gastando 1 espacio | 8d10 | — | — | — | parcialmente automatizado. Gasto, recarga con un espacio y tirada 8d10. Impacto, salvación, tipo de criatura, incapacitación y retorno del blanco manuales. |

| Nivel de Brujo | Conjuros siempre preparados | Trucos concedidos |
|---:|---|---|
| 3 | Manos ardientes, Orden imperiosa, Rayo abrasador, Sugestión | — |
| 5 | Bola de fuego, Apestar | — |
| 7 | Escudo de fuego, Muro de fuego | — |
| 9 | Geas, Plaga de insectos | — |

## Patrón del Gran Primigenio

| Rasgo | Nivel de Brujo | Categoría y justificación | Acción | Recursos y recuperación | Dados y escalados | Efectos ejecutables | Selectores | Dependencia | Estado y límite concreto |
|---|---:|---|---|---|---|---|---|---|---|
| Conjuros del Gran Primigenio | 3 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | automatizado. Preparación automática por nivel y retirada de sus propias aportaciones. |
| Mente despierta | 3 | pasivo_permanente: concesión permanente; puede contener una acción | accion_adicional | — | — | — | — | — | informativo. Acción adicional, duración por nivel de Brujo y alcance expresado en pies. Falta estado de vínculo con un blanco y sus condiciones de finalización. |
| Conjuros psíquicos | 3 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | informativo. Conversión opcional de daño y excepción verbal/somática para Encantamiento/Ilusión requieren contexto por lanzamiento; se conserva el material. |
| Combatiente clarividente | 6 | consumible: gasto de recurso limitado | especial | 1 usos/dados; descanso_corto; recarga 1 uso gastando 1 espacio | — | — | — | Mente despierta | parcialmente automatizado. Reserva, recuperación corta/larga y recarga con pacto. Falta vínculo, salvación y ventaja/desventaja contra un blanco concreto. |
| Maldición sobrenatural | 10 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | parcialmente automatizado. Maldición siempre preparada. La desventaja de salvaciones del blanco según característica elegida es manual. |
| Escudo de pensamientos | 10 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | resistencia_dano → Psíquico = resistencia (Psíquico) | — | — | parcialmente automatizado. Resistencia Psíquica en defensas. Protección de pensamientos y daño reflejado al agresor manuales. |
| Crear esclavo | 14 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | — | informativo. Duración y concentración opcionales, PG del acompañante y daño condicionado por Maldición no tienen un consumidor por lanzamiento invocado. |

| Nivel de Brujo | Conjuros siempre preparados | Trucos concedidos |
|---:|---|---|
| 3 | Detectar pensamientos, Susurros discordantes, Fuerza fantasmal, Risa horrible de Tasha | — |
| 5 | Clarividencia, Hambre de Hadar | — |
| 7 | Confusión, Invocar aberración | — |
| 9 | Modificar recuerdo, Telequinesis | — |

## Invocaciones sobrenaturales

La adquisición se conserva con identidades de instancia separadas. Retirar una opción elimina su hijo y sus aportaciones; reconstruir conserva el gasto y la elección. Descarga agónica, Descarga ahuyentadora, Lanza y Lecciones admiten instancias distintas con elecciones distintas. No se seleccionan opciones nuevas automáticamente.

| Rasgo | Nivel de Brujo | Categoría y justificación | Acción | Recursos y recuperación | Dados y escalados | Efectos ejecutables | Selectores | Dependencia | Estado y límite concreto |
|---|---:|---|---|---|---|---|---|---|---|
| Armadura de sombras | 1 | pasivo_permanente: concesión permanente; puede contener una acción | accion | armadura de mago: ilimitado | — | conjuro_gratuito → Armadura de mago = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Lanzamiento ilimitado sin espacio. Restricción a uno mismo y aplicación de Armadura de mago mediante el flujo normal del conjuro. |
| Mente sobrenatural | 1 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | ventaja → salvacion.constitucion.concentracion = ventaja; condición concentracion | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | automatizado. Ventaja declarada para la salvación de Constitución de concentración, sin aplicarla a salvaciones ordinarias. |
| Pacto de la cadena | 1 | pasivo_permanente: concesión permanente; puede contener una acción | accion | encontrar familiar: ilimitado | — | conjuro_gratuito → Encontrar familiar = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Lanzamiento sin espacio; tiempo excepcional de acción de magia, formas y ataque del familiar se consultan y gestionan manualmente. |
| Pacto del filo | 1 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | accion_adicional | — | — | Competencia, aptitud y daño solo de la instancia vinculada | tipo_dano_pacto_del_filo: general, hasta 1; 4 opciones | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Vínculo explícito a una instancia: competencia, Carisma y daño elegido afectan solo a esa arma. La conjuración, sustitución material, distancia y disolución por muerte son manuales. |
| Pacto del grimorio | 1 | activable: estado persistente de activación | pasivo | — | — | — | trucos_libro_sombras: conjuro, hasta 3; trucos_todas_clases; filtro {"excluirPreparados":true}; rituales_libro_sombras: conjuro, hasta 2; rituales_nivel_1; filtro {"excluirPreparados":true} | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Tres trucos y dos rituales de nivel 1, sin preselección; no permite elegir preparados actuales. Posesión del libro mediante interruptor; aptitud de Brujo al lanzar incluso en multiclase. Recreación del libro y pérdida por muerte manuales. |
| Descarga agónica | 2 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | bono_dano_conjuro → agregar_modificador_habilidad = carisma; selector truco_descarga_agonica | truco_descarga_agonica: conjuro, hasta 1; trucos_todas_clases; destino referencia; filtro {"requiereDano":true,"soloConocidos":true,"clase":"brujo"} | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | automatizado. Solo truco de Brujo conocido que causa daño; bono de Carisma limitado al elegido. Instancias repetidas con elecciones distintas. |
| Descarga ahuyentadora | 2 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | — | truco_descarga_ahuyentadora: conjuro, hasta 1; trucos_todas_clases; destino referencia; filtro {"requiereDano":true,"requiereAtaque":true,"soloConocidos":true,"clase":"brujo"} | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Selector válido de truco de Brujo con tirada de ataque; instancias distintas persistentes. Empuje de hasta 10 pies y límite de tamaño manuales. |
| Lanza sobrenatural | 2 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | modificador_alcance_conjuro → conjuro = 30*nivel_brujo; selector truco_lanza_sobrenatural | truco_lanza_sobrenatural: conjuro, hasta 1; trucos_todas_clases; destino referencia; filtro {"requiereDano":true,"alcanceMinimo":10,"soloConocidos":true,"clase":"brujo"} | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | automatizado. Alcance del truco elegido aumenta 30 × nivel de Brujo, nunca por nivel total. Solo admite daño y alcance base de al menos 10 pies. |
| Lecciones de los Primeros | 2 | selector_informativo: elección/consulta; sus aportaciones se evalúan aparte | pasivo | — | — | — | dote_lecciones_primeros: dote, hasta 1; dotes_origen | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Opciones de origen completas hidratadas y materializadas, sin duplicar efectos del padre. Repeticiones con dotes distintas; cada dote mantiene sus límites propios de automatización. |
| Máscara de los mil rostros | 2 | pasivo_permanente: concesión permanente; puede contener una acción | accion | disfrazarse: ilimitado | — | conjuro_gratuito → Disfrazarse = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | automatizado. Disponibilidad y lanzamiento gratuito ilimitado con la aptitud indicada; apariencia se gestiona con el conjuro. |
| Salto sobrenatural | 2 | pasivo_permanente: concesión permanente; puede contener una acción | accion_adicional | salto: ilimitado | — | conjuro_gratuito → Salto = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Lanzamiento gratuito ilimitado como acción adicional. Restricción a uno mismo y movimiento especial se resuelven en el flujo del conjuro/mesa. |
| Vigor infernal | 2 | pasivo_permanente: concesión permanente; puede contener una acción | accion | falsa vida: ilimitado | — | hp_temporal → propio = 12; conjuro_gratuito → Falsa vida = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Lanzamiento gratuito y botón de 12 PG temporales; nunca escala con el espacio de pacto. Lanzar desde otra vista no aplica automáticamente esos PG. |
| Visiones brumosas | 2 | pasivo_permanente: concesión permanente; puede contener una acción | accion | imagen silenciosa: ilimitado | — | conjuro_gratuito → Imagen silenciosa = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | automatizado. Lanzamiento gratuito ilimitado de Imagen silenciosa; ilusión se resuelve narrativamente. |
| Vista del diablo | 2 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | informativo. Visión normal en luz tenue y oscuridad mágica/no mágica a 120 pies: no modifica la iluminación del tablero. |
| Castigo arcano | 5 | consumible: gasto de recurso limitado | especial | 1 espacio de pacto por uso | 4d8; nv.5: 4d8, nv.7: 5d8, nv.9: 6d8 | — | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia; además pacto_del_filo | parcialmente automatizado. Tirada consume un espacio de pacto una vez. Daño escala por nivel del espacio, sin reserva adicional; impacto, una vez por turno y Derribado manuales. |
| Don de las profundidades | 5 | consumible: gasto de recurso limitado | accion | 1 usos/dados; descanso_largo; respirar bajo el agua: descanso_largo | — | conjuro_gratuito → Respirar bajo el agua = sin_espacio; movimiento_especial → velocidad.nadar = nadar | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Reserva propia del lanzamiento gratuito, recuperada en descanso largo. Nado permanece tras agotar el conjuro; respirar bajo agua se consulta/gestiona manualmente. |
| Filo sediento | 5 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia; además pacto_del_filo | informativo. Dos ataques con arma de pacto; no se presenta efecto personalizado como contador funcional de ataques por acción. |
| Inversión del amo de las cadenas | 5 | pasivo_permanente: concesión permanente; puede contener una acción | accion_adicional | — | — | — | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia; además pacto_de_la_cadena | informativo. Opciones del familiar, orden de ataque, CD, daño y resistencia del familiar requieren un consumidor de acompañantes. |
| Maestro de las formas innumerables | 5 | pasivo_permanente: concesión permanente; puede contener una acción | accion | alterar el propio aspecto: ilimitado | — | conjuro_gratuito → Alterar el propio aspecto = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | automatizado. Lanzamiento ilimitado sin espacio de Alterar el propio aspecto; efectos por el flujo normal del conjuro. |
| Mirada de las dos mentes | 5 | pasivo_permanente: concesión permanente; puede contener una acción | accion_adicional | — | — | — | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | informativo. Acción adicional de enlace/mantenimiento, sentidos y lanzamiento desde otra criatura: falta vínculo persistente y contexto espacial. |
| Paso ascendente | 5 | pasivo_permanente: concesión permanente; puede contener una acción | accion | levitar: ilimitado | — | conjuro_gratuito → Levitar = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Lanzamiento ilimitado sin espacio; restricción a uno mismo y movimiento por Levitar manuales. |
| Uno con las sombras | 5 | pasivo_permanente: concesión permanente; puede contener una acción | accion | — | — | conjuro_gratuito → Invisibilidad = sin_espacio; condición luz_tenue_u_oscuridad | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | parcialmente automatizado. Lanzamiento gratuito solo si se marca Luz tenue u Oscuridad. No se infiere iluminación física ni se inventa otro final para Invisibilidad. |
| Susurros del sepulcro | 7 | pasivo_permanente: concesión permanente; puede contener una acción | accion | hablar con los muertos: ilimitado | — | conjuro_gratuito → Hablar con los muertos = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | automatizado. Lanzamiento ilimitado sin espacio de Hablar con los muertos; respuestas narrativas manuales. |
| Devorador de vida | 9 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | 1d6 | — | tipo_dano_devorador_de_vida: general, hasta 1; 3 opciones | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia; además pacto_del_filo | informativo. Elección del tipo y tirada manual 1d6. Se retiró el bono erróneo a todas las armas cuerpo a cuerpo. Falta evento de impacto del arma vinculada, una vez por turno y gasto de dado de golpe para curación. |
| Don de los protectores | 9 | consumible: gasto de recurso limitado | especial | 1 usos/dados; descanso_largo | — | — | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia; además pacto_del_grimorio | parcialmente automatizado. Uso propio y recuperación larga; disparador especial, sin reacción inventada. Página de nombres y reducción a 1 PG del protegido manuales. |
| Visiones de reinos remotos | 9 | pasivo_permanente: concesión permanente; puede contener una acción | accion | ojo arcano: ilimitado | — | conjuro_gratuito → Ojo arcano = sin_espacio | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | automatizado. Lanzamiento ilimitado sin espacio de Ojo arcano; percepción se gestiona por el conjuro. |
| Hoja devoradora | 12 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia; además filo_sediento | informativo. Tres ataques con arma de pacto; requisitos ejecutados, pero sin contador de ataques por acción. |
| Visión bruja | 15 | pasivo_permanente: concesión permanente; puede contener una acción | pasivo | — | — | — | — | Invocaciones sobrenaturales, idSelectorOrigen y requiereOpcion de la instancia | informativo. Visión verdadera a 30 pies: información para mesa, no renderizado ni detección automática de criaturas. |

## Verificación y alcance de la evidencia

| Comprobación | Resultado | Evidencia |
|---|---|---|
| pnpm run ci | Salida 0; 135 suites, 1897 pruebas. TypeScript, ESLint, auditoría de 159 archivos sin componentes nuevos fuera del límite y build correctos | scratch/ci-brujo.log |
| brujoDeclarativo2024.test.ts | 47 regresiones dentro de CI: carga Zod y supervivencia de campos, niveles 1–20, multiclase, reservas y descanso, bloqueo y retirada de opciones, extensión, efectos, procedencia, reaplicación y guardado | src/servicios/brujoDeclarativo2024.test.ts |
| Regresiones existentes de Brujo y consumidores compartidos | Incluidas en CI; se corrigieron expectativas antiguas incompatibles con PHB 2024 y dos fixtures de Guerrero con nivel inferior al rasgo probado | suites de invocaciones, magia/subclases, mejoras, daño y recursos |
| pnpm run test:brujo-ui | Salida 0. Aplicación App real en Chromium local: 9 flujos y 4 dimensiones, sin errores JavaScript ni desbordes horizontales | scratch/brujo-ui.log, scratch/brujo-ui-resultados.json y capturas brujo-curacion-* |
| pnpm run test:rasgos-ui | Salida 0: edición, validación, conjuro gratuito y sustitución de plantilla | scratch/rasgos-ui-brujo.log |
| pnpm run test:sync-simulacion | Salida 0; 12 escenarios, 6 PJ y 20 monstruos, transporte simulado | scratch/sync-simulacion-brujo.log |
| git diff --check y conservación de BarraSuperior | Salida 0; SHA-256 idéntico al respaldo local | comprobación del árbol actual |
| TaleSpire real y CEF nativo | No verificados. No se desplegó ni se certificaron clientes entre equipos | pendiente de entorno real |

Los nueve flujos del navegador comprueban: Astucia mejorada y Resiliencia con gasto persistente; recarga con pacto; requisitos de invocación y retirada de padre bloqueada; dos instancias de Agónica; vínculo con arma concreta y elegibilidad de arco mágico; elección/gasto independiente de dos arcanos en Conjuros y Magia de la ficha; filtros y activación del Libro; elección explícita de Duro, efecto persistente sin duplicados y bloqueo de Don épico a nivel 4; curación variable de un aliado sin curar al emisor. Dimensiones: 599×760, 599×600, 433×760 y 433×600. El perfil y las fichas de estas pruebas son temporales.

La CI mantiene el aviso preexistente de chunks grandes de Vite. pnpm requiere ejecución fuera del sandbox por EPERM; todas las verificaciones listadas se realizaron con pnpm.

## Carencias concretas y su impacto

1. Falta un contexto de blanco, impacto, tipo de criatura, salvación y una vez por turno. Por ello no se aplican automáticamente Devorador de vida, el bono de Alma radiante, empujes, desventajas de Maldición, daño reflejado ni los efectos enemigos de subclase. No se inventaron efectos personalizados para simularlo.
2. El tablero no aporta distancia, visión o posesión de libro/arma a estos consumidores. Las distancias se muestran en pies; la posesión del Libro se marca manualmente y la iluminación de Uno con las sombras se indica mediante condición. Enlaces telepáticos, sentidos y disolución del arma permanecen informativos.
3. La curación dirigida alcanza los PJ disponibles en el almacén local. La elección de otras criaturas, la línea de visión y el alcance se verifican en mesa. El receptor no se envía como ampliación del protocolo de rasgos.
4. El resumen de defensas reconoce resistencias e inmunidades, pero no equivale a reducir automáticamente cualquier daño entrante. Resiliencia celestial automatiza PG propios; los de hasta cinco aliados son manuales.
5. La aptitud declarada del Libro, arcanos y lanzamientos gratuitos se aplica al emitir el conjuro. La cabecera/fichas con una aptitud mágica global y los aprendizajes multiclase sin clase de origen explícita siguen siendo una limitación del modelo; si un conjuro tiene concesiones de clases distintas no se inventa una prioridad.
6. El nuevo registro conserva aprendizajes independientes realizados por la API existente. Una ficha histórica que contenga el mismo conjuro por varias vías sin procedencia registrada no permite reconstruir retrospectivamente esa información con certeza.
7. La UI no restringe temporalmente cada cambio de elección a subir de nivel o finalizar descanso. Los requisitos y límites sí se ejecutan; el momento de sustitución se controla en mesa.
8. Concentración, efectos materiales y resolución narrativa de conjuros usan el flujo general existente. Las excepciones de subclase que requieren modificar un lanzamiento concreto permanecen informativas cuando el consumidor carece de contexto.

Estas limitaciones impiden declarar automatizadas todas las reglas del Brujo. Las tablas identifican qué parte se ejecuta y qué parte exige resolución manual.

## Archivos modificados en esta implementación

Se comparó contra el padre de 47befff para incluir el trabajo guardado y la continuación. Se excluye el cambio local ajeno de BarraSuperior.tsx.

- [.gitignore](.gitignore)
- [IMPLEMENTACION_BRUJO.md](IMPLEMENTACION_BRUJO.md)
- [INVENTARIO_BRUJO_PREVIO.md](INVENTARIO_BRUJO_PREVIO.md)
- [agente.md](agente.md)
- [package.json](package.json)
- [scripts/probar-brujo.mjs](scripts/probar-brujo.mjs)
- [src/almacen/slices/brujoDND55.test.ts](src/almacen/slices/brujoDND55.test.ts)
- [src/almacen/slices/personajes/sliceMagia.ts](src/almacen/slices/personajes/sliceMagia.ts)
- [src/almacen/slices/personajes/slicePersonajesTipos.ts](src/almacen/slices/personajes/slicePersonajesTipos.ts)
- [src/almacen/slices/personajes/sliceRecursosRasgos.ts](src/almacen/slices/personajes/sliceRecursosRasgos.ts)
- [src/almacen/slices/personajes/sliceSelectoresRasgos.ts](src/almacen/slices/personajes/sliceSelectoresRasgos.ts)
- [src/componentes/caracteristicas/personajes/SeccionArcanoMistico.tsx](src/componentes/caracteristicas/personajes/SeccionArcanoMistico.tsx)
- [src/componentes/caracteristicas/personajes/conjuros/CabeceraYRecursosMagicos.tsx](src/componentes/caracteristicas/personajes/conjuros/CabeceraYRecursosMagicos.tsx)
- [src/componentes/caracteristicas/rasgos/ControlesRecursosDeclarativos.module.css](src/componentes/caracteristicas/rasgos/ControlesRecursosDeclarativos.module.css)
- [src/componentes/caracteristicas/rasgos/ControlesRecursosDeclarativos.tsx](src/componentes/caracteristicas/rasgos/ControlesRecursosDeclarativos.tsx)
- [src/componentes/caracteristicas/rasgos/ModalDetalleRasgo.tsx](src/componentes/caracteristicas/rasgos/ModalDetalleRasgo.tsx)
- [src/componentes/caracteristicas/rasgos/SeccionSelectoresModalRasgo.tsx](src/componentes/caracteristicas/rasgos/SeccionSelectoresModalRasgo.tsx)
- [src/componentes/caracteristicas/rasgos/SelectorInvocacionesAcordeon.tsx](src/componentes/caracteristicas/rasgos/SelectorInvocacionesAcordeon.tsx)
- [src/componentes/caracteristicas/rasgos/TarjetaRasgo.tsx](src/componentes/caracteristicas/rasgos/TarjetaRasgo.tsx)
- [src/constantes/invocacionesSobrenaturales.ts](src/constantes/invocacionesSobrenaturales.ts)
- [src/datos/clases/brujo.json](src/datos/clases/brujo.json)
- [src/datos/invocaciones-sobrenaturales.json](src/datos/invocaciones-sobrenaturales.json)
- [src/hooks/usarLanzadorConjuros.ts](src/hooks/usarLanzadorConjuros.ts)
- [src/hooks/usarMagiaPersonaje.ts](src/hooks/usarMagiaPersonaje.ts)
- [src/servicios/brujoDeclarativo2024.test.ts](src/servicios/brujoDeclarativo2024.test.ts)
- [src/servicios/brujoMecanicasDND55.test.ts](src/servicios/brujoMecanicasDND55.test.ts)
- [src/servicios/calculadorAccionesCombate.ts](src/servicios/calculadorAccionesCombate.ts)
- [src/servicios/calculadorAtaquesArmas.ts](src/servicios/calculadorAtaquesArmas.ts)
- [src/servicios/calculadorDanoCombate.test.ts](src/servicios/calculadorDanoCombate.test.ts)
- [src/servicios/clases/catalogoClases.ts](src/servicios/clases/catalogoClases.ts)
- [src/servicios/clases/escaladosRasgos.ts](src/servicios/clases/escaladosRasgos.ts)
- [src/servicios/compendioRasgos.ts](src/servicios/compendioRasgos.ts)
- [src/servicios/consumidorRecursosConjuros.ts](src/servicios/consumidorRecursosConjuros.ts)
- [src/servicios/guerreroMecanicasDND55.test.ts](src/servicios/guerreroMecanicasDND55.test.ts)
- [src/servicios/hidratadorDotes.ts](src/servicios/hidratadorDotes.ts)
- [src/servicios/invocacionesBrujoMecanicas.test.ts](src/servicios/invocacionesBrujoMecanicas.test.ts)
- [src/servicios/mejoraCaracteristicaYSubclase.test.ts](src/servicios/mejoraCaracteristicaYSubclase.test.ts)
- [src/servicios/procesadorDescansos.ts](src/servicios/procesadorDescansos.ts)
- [src/servicios/rasgos/arcanosMisticosRasgos.ts](src/servicios/rasgos/arcanosMisticosRasgos.ts)
- [src/servicios/rasgos/camposConstructor.ts](src/servicios/rasgos/camposConstructor.ts)
- [src/servicios/rasgos/conjurosGratuitosRasgos.ts](src/servicios/rasgos/conjurosGratuitosRasgos.ts)
- [src/servicios/rasgos/evaluadorCombateRasgos.ts](src/servicios/rasgos/evaluadorCombateRasgos.ts)
- [src/servicios/rasgos/evaluadorConjurosRasgos.ts](src/servicios/rasgos/evaluadorConjurosRasgos.ts)
- [src/servicios/rasgos/evaluadorExpresionesRasgos.ts](src/servicios/rasgos/evaluadorExpresionesRasgos.ts)
- [src/servicios/rasgos/eventosHpTemporal.ts](src/servicios/rasgos/eventosHpTemporal.ts)
- [src/servicios/rasgos/extensionesRasgos.ts](src/servicios/rasgos/extensionesRasgos.ts)
- [src/servicios/rasgos/fusionarEstadoRasgo.ts](src/servicios/rasgos/fusionarEstadoRasgo.ts)
- [src/servicios/rasgos/normalizarMecanicasRasgos.ts](src/servicios/rasgos/normalizarMecanicasRasgos.ts)
- [src/servicios/rasgos/reconciliarConjurosRasgos.ts](src/servicios/rasgos/reconciliarConjurosRasgos.ts)
- [src/servicios/rasgos/seleccionesRasgos.ts](src/servicios/rasgos/seleccionesRasgos.ts)
- [src/servicios/rasgos/utilidadesRasgos.ts](src/servicios/rasgos/utilidadesRasgos.ts)
- [src/servicios/serializadorPersonaje.ts](src/servicios/serializadorPersonaje.ts)
- [src/servicios/servicioLanzamientoConjuros.ts](src/servicios/servicioLanzamientoConjuros.ts)
- [src/servicios/sincronizadorConjurosSubclase.ts](src/servicios/sincronizadorConjurosSubclase.ts)
- [src/servicios/subclasesMagia.test.ts](src/servicios/subclasesMagia.test.ts)
- [src/tipos/esquemasCatalogos.ts](src/tipos/esquemasCatalogos.ts)
- [src/tipos/mecanicasRasgos.ts](src/tipos/mecanicasRasgos.ts)
- [src/tipos/personaje.ts](src/tipos/personaje.ts)
- [src/tipos/rasgos.ts](src/tipos/rasgos.ts)
- [src/utiles/selectoresConjuros.ts](src/utiles/selectoresConjuros.ts)
