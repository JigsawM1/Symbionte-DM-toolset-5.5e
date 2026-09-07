# Datos y compendios

## Fuentes de datos

Los datos incluidos en el repositorio viven en `src/utiles/compendios/`:

- `Equipo es.json`: equipo y objetos en español.
- `Mounstros.2024-es.json`: monstruos de la revisión 2024.
- `all.json`: compendio de hechizos.
- `venenos.json`: catálogo de venenos.
- `tabla criticos.md`: tabla textual de críticos y pifias.

`src/utiles/datosIniciales.ts` importa y transforma los datos iniciales en `MONSTRUOS_INICIALES`, `HECHIZOS_INICIALES` y `OBJETOS_INICIALES`.

Los datos iniciales se sanean antes de entrar en `sliceHomebrew.ts`, de modo que la interfaz trabaja con los modelos internos aunque el origen use nombres o estructuras diferentes.

## Constantes de reglas

`src/constantes/` contiene los catálogos que no se cargan directamente desde un JSON:

- `clasesDND55.ts`: clases, subclases, progresión, selectores y efectos mecánicos.
- `rasgosDND55.ts`: dotes y rasgos canónicos.
- `equipoConstantes.ts`: equipo y reglas auxiliares de competencia.
- `objetoConstantes.ts`: normalización y categorías de objetos.
- `subclasesConjurosConstantes.ts`: conjuros asociados a subclases.
- `competenciasConstantes.ts`: grupos de armas, armaduras, idiomas y herramientas.
- `homebrewConstantes.ts`: valores y categorías del creador Homebrew.
- `personajeConstantes.ts`: personaje inicial y valores por defecto.

`src/utiles/tablasCriticos.ts` y `src/utiles/datosIniciales.ts` proporcionan tablas, condiciones y efectos predefinidos usados por las vistas.

## Tipos y esquemas Zod

`src/tipos/index.ts` define esquemas para:

- Características, habilidades, salvaciones y condiciones.
- Monstruos, acciones, rasgos y reacciones.
- Hechizos y componentes.
- Objetos base, armas, armaduras y equipo de aventuras.

`src/tipos/personaje.ts` define `EsquemaPersonajeJugador`, clases, lanzadores, magia, monedas, inventario y contenedores.

`src/tipos/rasgos.ts` define `EsquemaRasgoPersonaje`, efectos mecánicos, selectores, tablas de escalado y dotes.

Los tipos TypeScript se infieren con `z.infer`, por lo que los esquemas son la fuente de validación y de tipado de los modelos principales.

## Saneamiento de datos

`src/almacen/sanitizacion.ts` contiene funciones específicas:

- `sanearObjetoHomebrew`.
- `sanearHechizoCD`.
- `sanearMonstruoSentidosYPasiva`.
- `sanearPersonaje`.

El saneamiento tolera campos alternativos en inglés y español, aplana valores anidados, normaliza nombres, convierte costes y pesos, y extrae información adicional de objetos.

Los monstruos pueden convertir velocidad y sentidos textuales a estructuras internas. Los hechizos normalizan su CD. Los personajes se fusionan con valores por defecto y se validan con `EsquemaPersonajeJugador.safeParse`.

## Importación

`src/almacen/importadorJSON.ts` importa bases de datos completas, mapea formatos externos y aplica los saneadores para monstruos, hechizos y objetos.

`ConfiguracionDM.tsx` expone la importación y exportación desde la interfaz. Las entidades importadas se desduplican mediante las utilidades de búsqueda tolerante y se conservan los identificadores compatibles.

## Uso en la aplicación

`sliceHomebrew.ts` mantiene las bases de datos editables. `Compendio.tsx` decide la vista según el rol; en modo jugador, el compendio de conjuros también gestiona conocidos y preparados.

`indiceMonstruos.ts` crea un índice para búsquedas rápidas. `busquedaTolerante.ts` permite coincidencias sin depender estrictamente de acentos o diferencias de formato.

Los servicios de magia, inventario, munición, clases y rasgos consumen estos modelos y no deberían duplicar la estructura de los compendios dentro de los componentes.

## Inventario de objetos

Los objetos pueden tener propiedades de arma, armadura, herramienta, equipo, consumible o tesoro. `calculadorInventario.ts` trabaja con peso, cantidad, coste, moneda, sintonización y contenedores sin depender del formato original del JSON.

El modelo admite objetos incluidos en el compendio y objetos creados desde la interfaz. Un objeto Homebrew conserva su identificador, nombre, descripción, rareza, coste, peso, propiedades y reglas de uso saneadas.

## Compendio de hechizos

`all.json` contiene nombre, clases, escuela, nivel, duración, componentes y descripción. `sanearHechizoCD` adapta esos campos al modelo de hechizo utilizado por `calculadorMagia.ts` y los componentes de la hoja.

Los conjuros de subclase no dependen únicamente del JSON: `subclasesConjurosConstantes.ts` relaciona las listas de subclase con los catálogos de clases de 2024.

## Seguridad de los datos

La validación evita colocar directamente en Zustand estructuras desconocidas provenientes de una importación. Cuando un registro no supera el esquema, el importador puede omitirlo o conservar los valores válidos según el tipo de entidad.

No se debe editar manualmente el blob global para corregir un personaje. Es preferible exportar los datos, corregir el JSON compatible y volver a importarlo desde `ConfiguracionDM`.

## Añadir una nueva fuente

Para incorporar un compendio nuevo:

1. Define o reutiliza un esquema en `src/tipos/`.
2. Añade un saneador en `src/almacen/sanitizacion.ts` si el formato difiere.
3. Integra el importador en `src/almacen/importadorJSON.ts`.
4. Expón el resultado desde el slice correspondiente.
5. Añade pruebas para registros válidos, campos ausentes y nombres alternativos.
