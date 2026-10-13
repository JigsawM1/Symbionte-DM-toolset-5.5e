# Implementación de Guerrero desde el builder

Fecha: 13 de octubre de 2026.

Las cinco fases están implementadas en el catálogo y en las capacidades generales del constructor. Los rasgos personalizados utilizan los mismos contratos de recursos, efectos, magia y selectores. Las maniobras y poderes individuales conservan sus descripciones y todavía no tienen clasificación ni ejecución propia.

## Resultado por fase

| Fase | Resultado |
| --- | --- |
| 1. Guerrero | Estilo concede una dote con procedencia propia; Tomar aliento cura con `1d10 + nivel_guerrero`; Mente táctica gasta su reserva y tira solo d10; maestrías informativas con límites de Guerrero; Acción súbita es Especial; Desplazamiento táctico amplía la descripción del padre; Indómito gasta al activarse y termina después de emitir una salvación. |
| 2. Maestro del Combate | Una reserva escalada d8/d10/d12, caja independiente de veinte maniobras con selección persistida, Conoce a tu enemigo con recarga auxiliar y gasto del padre, Implacable d8 sin gasto con límite por turno visible. |
| 3. Campeón | Ventaja en iniciativa y Atletismo; segundo estilo independiente con rechazo de dotes no repetibles ya concedidas. Los restantes beneficios permanecen informativos. |
| 4. Caballero Arcano | Capacidad mágica declarada por el rasgo desde nivel 3: tercio de lanzador, Inteligencia, lista de Mago y modelo preparado. Carga arcana amplía Acción súbita; se retiran contadores improcedentes. El cambio de subclase conserva capacidades y aprendizajes de otras fuentes. |
| 5. Guerrero Psiónico | Reserva y caja de consulta separadas, opciones adicionales por extensión, retirada de Asustado y Hechizado mediante gasto del padre, resistencia psíquica informativa, cobertura propia de Bastión con duración y finalización por Incapacitado, Telequinesis gratuita con Inteligencia y concentración. Bastión y Telequinesis disponen de recargas auxiliares. |

Los escalados de usos, dados, selecciones y descansos siguen las tablas solicitadas. Acción súbita e Indómito mantienen una sola reserva al repetir entradas de progresión. El nivel usado en sus cálculos procede de la clase de Guerrero en multiclase.

## Contratos generales y constructor

- Se conservan categorías mecánicas, `ligadoA`, gasto del padre, herencia de dados, restauración de usos, lanzamiento gratuito y procesadores de descanso existentes.
- El constructor permite editar escalados de dados, usos, efectos, recuperación y límites de selección; también recarga parcial en descanso corto y vínculos de extensión.
- Las nuevas propiedades opcionales describen desactivación tras salvación, finalización por condiciones, retirada de condiciones, capacidad mágica, aptitud del conjuro gratuito y ausencia de componentes.
- Los selectores disponen de ubicación en tarjeta o sección independiente y modalidad de selección o consulta. Las invocaciones de Brujo mantienen su presentación y comportamiento específico.
- Resistencia e inmunidad al daño se declaran como efectos; la inmunidad a condiciones utiliza el contrato existente. El resumen de Rasgos agrupa fuentes estructuradas y evita duplicados, sin interpretar descripciones ni reducir daño.
- Las extensiones personalizadas proyectan cambios sobre su padre sin modificar la declaración guardada. El catálogo reutiliza la fusión de extensiones existente.
- Los lanzadores concedidos por rasgos guardan `idRasgoOrigen`. Actualización de identidad y aplicación de build conservan otras concesiones independientes.

Los identificadores de dependencias del catálogo son estables. Las nuevas capacidades de ejecución no añaden bifurcaciones por nombres de Guerrero, sus subclases o sus rasgos.

## Conservación y sincronización

La rehidratación restaura las reglas actuales del catálogo, conserva los metadatos completos de rasgos personalizados y utiliza el migrador heredado existente. La fusión conserva elecciones, estados y contadores; cuando el máximo anterior pertenece a una tabla de progresión declarada, conserva la cantidad gastada al cambiar de nivel. Las elecciones se limitan al nuevo máximo al bajar de nivel. Los contadores heredados arbitrarios mantienen sus usos disponibles, limitados al máximo actual.

Los rasgos y sus metadatos permanecen en la persistencia de la ficha. El sync del tracker conserva su contrato de combate anterior: no transporta definiciones, contadores ni elecciones de rasgos, ni reconstruye la configuración de ficha al recibir iniciativa. La ampliación inicial `capacidadesRasgos`/`cp` se retiró tras la corrección del usuario; también se eliminaron su esquema, funciones de proyección/aplicación y observación de cambios. El historial y el inventario por archivo están en AUDITORIA_CAMBIOS_GUERRERO.md.

## Verificaciones realizadas

CI completo ejecutado en cada fase con TypeScript, ESLint, Vitest, auditoría de líneas y build de Vite:

| Ejecución | Suites | Pruebas aprobadas |
| --- | ---: | ---: |
| Fase 1 | 130 | 1.797 |
| Fase 2 | 130 | 1.804 |
| Fase 3 | 130 | 1.806 |
| Fase 4 | 130 | 1.815 |
| Fase 5 | 131 | 1.831 |
| Cierre inicial con ampliación de sync | 133 | 1.843 |
| Cierre después de retirar rasgos del sync | 133 | 1.844 |

El cierre incluye 158 archivos auditados. El build conserva la advertencia existente de chunks superiores a 500 kB.

- `pnpm run test:guerrero-ui`: salida 0; seis flujos en la aplicación completa, dieciséis combinaciones de cuatro subclases a 599/433 px y 760/600 px de altura, sin desbordes ni errores JavaScript y con acceso al último control.
- Los flujos de aplicación comprueban autocuración, gasto y devolución compartidos, salvación de Indómito, selección de maniobras, retirada de condiciones, cobertura temporal y recarga, Telequinesis con consumo propio y concentración, y creación/guardado/reapertura de tablas en el constructor. Se utiliza teclado para edición de campos.
- `pnpm run test:rasgos-ui`: salida 0; edición, límites de campos numéricos, conjuro gratuito y sustitución de plantilla. Se actualiza su expectativa numérica al contrato vigente: decrementos y valores fuera de rango se limitan.
- `pnpm run test:sync-simulacion`: salida 0; doce escenarios existentes con seis PJ, veinte monstruos y siete clientes aislados, usando transporte artificial con pérdidas, duplicados y reintentos.
- Regresiones nuevas adicionales vigentes: persistencia y rehidratación de las cuatro subclases, exclusión de rasgos/configuración del DTO, conservación de rasgos locales ante mensajes del tracker e ignorar bloques antiguos de capacidades. Para DM y jugador, editar únicamente contadores/metadatos de rasgos no emite iniciativa. También se comprueban fallo y doble emisión de salvación, subida/bajada de nivel, recursos agotados y conservación de concesiones ajenas al cambiar de subclase o aplicar build.
- `git diff --check` del código, scripts e informe de implementación: sin errores de espacios.

Evidencias locales en `scratch/`: `ci-guerrero-fase1.log` a `ci-guerrero-fase5.log`, `ci-guerrero-final.log`, `guerrero-ui.log`, `informe-guerrero-ui.json`, `rasgos-ui-guerrero.log`, `simulacion-guerrero.log`, `retirada-rasgos-sync.log`, `ci-guerrero-sin-rasgos-sync.log` y `simulacion-guerrero-sin-rasgos.log`. El CI y la simulación posteriores a la retirada tienen salida 0. Los comandos reproducibles están en `package.json` y las regresiones de Guerrero en `src/servicios/guerreroMecanicasDND55.test.ts` y `src/servicios/rasgos/`.

## Alcance pendiente acordado

- Clasificación y automatización individual de maniobras y poderes psiónicos.
- Aliados de Bastión, ataque adicional durante Telequinesis, críticos y demás beneficios expresamente informativos.
- Validación entre clientes TaleSpire reales y comprobación en su CEF nativo. Chromium local y la simulación no certifican esa sesión.

No se realizó despliegue.
