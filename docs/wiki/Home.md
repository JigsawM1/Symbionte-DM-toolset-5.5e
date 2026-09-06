# Wiki de Symbionte DM ToolSet

Symbionte DM ToolSet es una pantalla de Master y una hoja de jugador para D&D 5.5e 2024 dentro de TaleSpire. El Symbiote consulta la API de TaleSpire, sincroniza la iniciativa y las miniaturas, envía tiradas a la bandeja 3D y guarda el estado de campaña en el almacenamiento global del juego.

## Contenido

- [Instalación y despliegue](Instalacion-y-Despliegue)
- [Arquitectura](Arquitectura)
- [Modo Master](Modo-Master)
- [Modo Jugador](Modo-Jugador)
- [Integración con TaleSpire](Integracion-TaleSpire)
- [Datos y compendios](Datos-y-Compendios)
- [Guía de estilo y contribución](Guia-de-Estilo-y-Contribucion)

## Roles

El rol se obtiene desde TaleSpire mediante `ts.clients.esGM()` y se actualiza cuando llega un evento `clientModeChanged`.

### Master

El Master dispone de `GestorIniciativa`, `TablasDM`, `Pendientes`, `Compendio`, `NotasDM`, `CreadorHomebrew` y `ConfiguracionDM`. El gestor trabaja con criaturas, plantillas, condiciones, efectos, encuentros y la cola de iniciativa.

### Jugador

El jugador dispone de `VistaJugadores`, `VistaAtaquesJugador`, `Compendio`, `VistaRasgosJugador`, `VistaInventarioJugador`, `TablasDM`, `NotasDM`, `CreadorHomebrew` y `ConfiguracionDM`. La hoja de personaje se compone de atributos, habilidades, vitalidad, magia, inventario, rasgos e iniciativa.

## Desarrollo rápido

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
```

Para compilar y copiar el resultado al directorio del juego:

```bash
pnpm deploy
```

Consulta [Instalación y despliegue](Instalacion-y-Despliegue) antes de desplegar dentro de TaleSpire.

## Alcance de la documentación

La documentación versionada describe el comportamiento implementado en `src/`, `manifest.json`, `deploy_to_ts.js` y `build_and_zip.js`. Los archivos de aprendizaje y diseño que no forman parte del árbol versionado se han usado como contexto, pero no se presentan como archivos públicos del proyecto.

## Recorrido recomendado

1. Empieza por [Instalación y despliegue](Instalacion-y-Despliegue) para preparar el entorno.
2. Lee [Arquitectura](Arquitectura) para localizar el estado y los servicios.
3. Consulta [Modo Master](Modo-Master) o [Modo Jugador](Modo-Jugador) según tu área.
4. Revisa [Integración con TaleSpire](Integracion-TaleSpire) si modificas eventos, dados o persistencia.
5. Usa [Datos y compendios](Datos-y-Compendios) para cambiar modelos o importadores.
6. Aplica la [Guía de estilo y contribución](Guia-de-Estilo-y-Contribucion) antes de enviar cambios.

## Conceptos básicos

El proyecto no sustituye la mesa de TaleSpire: añade paneles para consultar y modificar reglas durante la sesión. La API del juego sigue siendo la fuente de la cola de iniciativa, las criaturas seleccionadas, las tiradas 3D, los eventos y el almacenamiento global.

El estado local se organiza en slices para evitar que cada componente conozca los detalles de todas las funciones. Los servicios calculan reglas reutilizables y los componentes se ocupan de presentar controles y resultados.

Los datos Homebrew y los personajes se guardan en la campaña cuando la API de almacenamiento está disponible. Las importaciones pasan por saneamiento y validación antes de mostrarse.

## Alcance de las páginas

Las páginas describen nombres de archivos, componentes y funciones que existen en el repositorio. Cuando una función tiene un fallback específico, se indica la ruta real y se distingue entre una capacidad disponible y una ruta que se ejecuta automáticamente.

Los enlaces de navegación usan nombres sin extensión para poder copiarse a la Wiki de GitHub. Los enlaces a archivos del repositorio aparecen en el README o en el texto técnico cuando es útil localizar la implementación.

## Comandos principales

| Objetivo | Comando |
| --- | --- |
| Instalar dependencias | `pnpm install` |
| Servir en desarrollo | `pnpm dev` |
| Ejecutar pruebas | `pnpm test` |
| Ejecutar lint | `pnpm lint` |
| Compilar | `pnpm build` |
| Desplegar en TaleSpire | `pnpm deploy` |
| Crear paquete mod.io | `pnpm build-and-zip` |

El flujo normal es instalar, desarrollar y ejecutar las comprobaciones antes de compilar. El despliegue requiere que la carpeta de destino corresponda al nombre de `build_folder_name.json`.
