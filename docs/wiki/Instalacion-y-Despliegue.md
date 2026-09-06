# Instalación y despliegue

## Requisitos

Se necesita Node.js compatible con Vite 5 y `pnpm`. TaleSpire solo es necesario para probar el Symbiote en el juego; el desarrollo local puede ejecutar los fallbacks del adaptador.

El gestor de paquetes del repositorio es `pnpm`, como indica `pnpm-lock.yaml`.

## Instalar dependencias

```bash
pnpm install
```

No es necesario instalar dependencias con npm ni modificar el archivo de bloqueo.

## Desarrollo local

```bash
pnpm dev
```

Vite sirve la aplicación con la configuración de `vite.config.ts`, que utiliza `base: './'`, el alias `@` hacia `src` y el objetivo `es2022`.

Fuera de TaleSpire, `TaleSpireAdapter` considera la API no disponible. El rol local se comporta como Master para facilitar las pruebas de la interfaz, y `lanzadorDados.ts` ejecuta una simulación matemática cuando no existe `window.TS`.

## Comprobaciones

```bash
pnpm test
pnpm lint
```

`pnpm test` ejecuta `vitest run`. `pnpm lint` ejecuta ESLint sobre `src`.

## Compilación

```bash
pnpm build
```

El script `build` ejecuta primero TypeScript y después `vite build`. La salida queda en `dist`.

## Despliegue en TaleSpire

```bash
pnpm deploy
```

Este comando ejecuta TypeScript, compila Vite y lanza `deploy_to_ts.js`. El nombre de la carpeta se lee de `build_folder_name.json`:

```json
{
  "buildFolder": "ToolSet_Es_5.5"
}
```

El destino se calcula con `os.platform()`:

- `win32`: `%APPDATA%\..\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\ToolSet_Es_5.5`.
- `darwin`: `~/Library/Application Support/com.bouncyrock.talespire/Symbiotes/ToolSet_Es_5.5`.
- `linux`: `~/.local/share/Steam/steamapps/compatdata/720620/pfx/drive_c/users/steamuser/AppData/LocalLow/BouncyRock Entertainment/TaleSpire/Symbiotes/ToolSet_Es_5.5`.

La carpeta de destino se crea si no existe. Si ya existe, se limpian sus carpetas `assets` y sus archivos `index.html` y `manifest.json`; después se copia todo `dist`.

## Empaquetado para mod.io

```bash
pnpm build-and-zip
```

`build_and_zip.js` lee el mismo nombre de carpeta, genera `mod-io-build/ToolSet_Es_5.5`, ejecuta `vite build --outDir` y crea `ToolSet_Es_5.5.zip`.

## Resolución de problemas

### Error EBUSY o EPERM

TaleSpire o el explorador de archivos puede mantener abierto un archivo de la carpeta del Symbiote. `deploy_to_ts.js` intenta copiar de forma segura y, ante un bloqueo, renombra el archivo anterior con el sufijo `.old.<marca de tiempo>`.

Si el reintento también falla:

1. Cierra TaleSpire o recarga y cierra el Symbiote.
2. Comprueba que ningún explorador tenga abierta la carpeta de destino.
3. Ejecuta de nuevo `pnpm deploy`.

### La carpeta desplegada no es la que carga TaleSpire

Comprueba `build_folder_name.json`. El valor debe coincidir con el nombre de la carpeta que TaleSpire carga:

```json
{
  "buildFolder": "ToolSet_Es_5.5"
}
```

También comprueba la ruta calculada para tu sistema operativo. El script no usa la carpeta `mod-io-build` para el despliegue local; esa carpeta pertenece al empaquetado de mod.io.

### La tirada no llega a la bandeja 3D

`lanzadorDados.ts` valida la fórmula, intenta `ts.dice.makeRollDescriptors` y llama a `ts.dice.putDiceInTray`. Si la API directa falla, utiliza el chat con un comando que comienza por `!`. Si también falla el chat, ejecuta el fallback matemático local.

La función `crearDescriptoresManualmente` construye descriptores `{ name, roll }` cuando se necesita evitar la conversión nativa de `makeRollDescriptors`. La fórmula usa `/` como separador lógico interno de grupos y conserva `+` para los modificadores.

### El manifiesto no se carga

Comprueba que `manifest.json` esté en la raíz de `dist` después de la compilación y que `entryPoint` sea `/index.html`. El manifiesto declara la API `0.1` y las suscripciones de eventos necesarias para el puente del Symbiote.
