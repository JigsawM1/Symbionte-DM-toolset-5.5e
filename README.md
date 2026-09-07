# Symbionte DM ToolSet para D&D 5.5e

Pantalla de DM y hoja de jugador para D&D 5.5e (reglas 2024), integrada en TaleSpire como Symbiote. La aplicación detecta automáticamente si el cliente es Master o Jugador mediante `esGM` y muestra la interfaz correspondiente.

## Características principales

### Modo Master

- Gestor de iniciativa con cola, rondas, turnos y sincronización con la iniciativa nativa de TaleSpire.
- Selección de miniaturas de TaleSpire, incorporación de criaturas seleccionadas y vinculación de plantillas de monstruo.
- Tarjetas de criatura con vida, vida temporal, clase de armadura, velocidad, percepción pasiva, condiciones y efectos con duración.
- Buscador de monstruos, preparación de encuentros y guardado de encuentros para recuperarlos durante la sesión.
- Salvaciones en área con CD, mitigación y aplicación masiva de condiciones o efectos.
- Compendio de monstruos, hechizos y equipo, además de datos creados por el usuario.
- Creador Homebrew para criaturas, hechizos y objetos, con saneamiento de datos y validación mediante Zod.
- Tablas de reglas, condiciones de D&D 2024, críticos y pifias, conversión de divisas, cálculo de viajes y saltos.
- Paneles para pendientes, notas de DM, configuración de campaña y visibilidad del porcentaje de vida para jugadores.

### Modo Jugador

- Hoja de personaje con atributos, modificadores, salvaciones, habilidades, competencias, sentidos, vitalidad y recursos.
- Construcción de personajes con clases y subclases de D&D 5.5e 2024, progresión de rasgos, selectores y efectos mecánicos.
- Ataques, acciones y consumibles con fórmulas de dados 3D, además de evaluación de condiciones, ventajas y desventajas.
- Magia con conjuros conocidos, preparados, ocultos y de subclase; espacios, puntos de conjuro, espacios de pacto, lanzamiento a niveles superiores y Arcano Místico.
- Inventario con equipo, peso, monedas, sintonización, equipamiento, paquetes, contenedores y munición compatible con armas.
- Condiciones, cansancio, concentración, descansos cortos y largos, dados de golpe y salvaciones contra la muerte.
- Iniciativa del jugador y vinculación de la ficha con una miniatura de TaleSpire.
- Persistencia de los datos de campaña mediante el almacenamiento global de TaleSpire y saneamiento al cargar datos antiguos o importados.

## Stack tecnológico

- Vite 5, React 18 y TypeScript.
- Zustand 4 para el estado global dividido en slices.
- Zod 4 para esquemas y validación de datos.
- CSS Modules y hojas de estilo específicas para la vista de jugador.
- `lucide-react` para la iconografía SVG.
- Vitest para las pruebas.
- API de TaleSpire Symbiote v0.1, ejecutada en WebView2 o Chromium Embedded Framework (CEF).

## Requisitos

- Node.js compatible con Vite 5.
- `pnpm`.
- TaleSpire para probar el Symbiote dentro del juego.
- En Windows, macOS o Linux, permisos de escritura en la carpeta de Symbiotes de TaleSpire para usar `pnpm deploy`.

## Instalación y desarrollo

```bash
pnpm install
pnpm dev
```

Comandos de comprobación:

```bash
pnpm test
pnpm lint
```

`pnpm dev` inicia Vite para desarrollo local. Fuera de TaleSpire, el adaptador proporciona los fallbacks de desarrollo definidos en `src/utiles/TaleSpireAdapter.ts` y `src/utiles/lanzadorDados.ts`.

## Compilación y despliegue en TaleSpire

La carpeta de salida se define en `build_folder_name.json`:

```json
{
  "buildFolder": "ToolSet_Es_5.5"
}
```

El comando siguiente compila TypeScript, genera `dist` y copia sus archivos a la carpeta del Symbiote:

```bash
pnpm deploy
```

`deploy_to_ts.js` calcula el destino según el sistema operativo:

- Windows: `%USERPROFILE%\AppData\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\ToolSet_Es_5.5`.
- macOS: `~/Library/Application Support/com.bouncyrock.talespire/Symbiotes/ToolSet_Es_5.5`.
- Linux: la instalación de Steam de TaleSpire bajo `~/.local/share/Steam/steamapps/compatdata/720620/pfx/drive_c/users/steamuser/AppData/LocalLow/BouncyRock Entertainment/TaleSpire/Symbiotes/ToolSet_Es_5.5`.

El script limpia `assets`, `index.html` y `manifest.json` de la compilación anterior y copia `dist`. Si TaleSpire mantiene un archivo abierto, puede aparecer `EBUSY` o `EPERM`; cierra TaleSpire o recarga/cierra el Symbiote y vuelve a ejecutar el comando. El script intenta renombrar archivos bloqueados antes de abortar.

Para crear el paquete que se sube a mod.io:

```bash
pnpm build-and-zip
```

El script genera `mod-io-build/ToolSet_Es_5.5` y el archivo `ToolSet_Es_5.5.zip`.

## Estructura del proyecto

```text
src/
├── almacen/                 Estado Zustand, slices, selectores, persistencia y saneamiento
├── componentes/             Interfaz React organizada por características y layout
│   ├── caracteristicas/     Iniciativa, personajes, ataques, inventario, compendio y herramientas
│   ├── comunes/             Selectores, tooltips, diálogos, condiciones y notificaciones
│   └── layout/              Barra superior, controles y panel de dados
├── constantes/              Catálogos de clases, rasgos, equipo, objetos y homebrew
├── estilos/                 Tema visual de la hoja de jugador
├── hooks/                   Conexión, persistencia, magia, formularios y listas dinámicas
├── servicios/               Reglas, sincronización, inventario, magia, condiciones y puente TaleSpire
├── tipos/                   Tipos TypeScript y esquemas Zod, incluida la API TaleSpire
└── utiles/                  Adaptador TaleSpire, dados, almacenamiento, datos iniciales y compendios
```

## Reglas de desarrollo

- No usar emojis. Los iconos de la interfaz se implementan con SVG mediante `lucide-react`.
- No añadir transiciones ni animaciones CSS; el entorno CEF requiere cambios inmediatos.
- No usar elementos `<select>` nativos; usar `SelectorDesplegable` o `SelectorSugerencias`.
- Mantener la fuente mínima legible para el overlay, con un mínimo de 11 px según la guía visual.
- Mantener CSS aislado en CSS Modules y respetar los tokens `--pj-*` del tema de jugador.
- Usar español en identificadores, textos y documentación nueva.
- Mantener las reglas de negocio fuera de los componentes cuando exista un servicio o selector apropiado.

## Documentación

- [Wiki del proyecto](https://github.com/JigsawM1/Symbionte-DM-toolset-5.5e/wiki)
- [Wiki versionada en el repositorio](docs/wiki/)

## Créditos

Basado en la plantilla [vite-react-symbiote](https://github.com/PanoramicPanda/vite-react-symbiote) de PanoramicPanda. Autor y mantenimiento del proyecto: JigsawM1.
