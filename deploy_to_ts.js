import fs from 'fs';
import path from 'path';
import os from 'os';

const buildDir = path.join(path.resolve(), 'dist');
const config = JSON.parse(await fs.promises.readFile('./build_folder_name.json', 'utf-8'));
const symbioteName = config.buildFolder;

let targetDir;

// Determine the correct target directory based on the OS
switch (os.platform()) {
    case 'win32':
        targetDir = path.join(process.env.APPDATA, '..', 'LocalLow', 'BouncyRock Entertainment', 'TaleSpire', 'Symbiotes', symbioteName);
        break;
    case 'darwin':
        targetDir = path.join(os.homedir(), 'Library', 'Application Support', 'com.bouncyrock.talespire', 'Symbiotes', symbioteName);
        break;
    case 'linux':
        targetDir = path.join(os.homedir(), '.local', 'share', 'Steam', 'steamapps', 'compatdata', '720620', 'pfx', 'drive_c', 'users', 'steamuser', 'AppData', 'LocalLow', 'BouncyRock Entertainment', 'TaleSpire', 'Symbiotes', symbioteName);
        break;
    default:
        console.error('Unsupported OS!');
        process.exit(1);
}

// Función para eliminar de forma segura archivos/carpetas de compilaciones previas
const deleteBuildElement = (itemPath) => {
    if (fs.existsSync(itemPath)) {
        const stat = fs.lstatSync(itemPath);
        if (stat.isDirectory()) {
            fs.readdirSync(itemPath).forEach((file) => {
                const curPath = path.join(itemPath, file);
                if (!fs.lstatSync(curPath).isDirectory()) {
                    try {
                        fs.unlinkSync(curPath);
                    } catch (error) {
                        // Si está bloqueado por TaleSpire, intentar renombrarlo temporalmente
                        try {
                            fs.renameSync(curPath, `${curPath}.old.${Date.now()}`);
                        } catch (renameErr) {
                            console.warn(`[Aviso Despliegue] Archivo bloqueado por TaleSpire (${file}): ${error instanceof Error ? error.message : String(error)}`);
                        }
                    }
                }
            });
            try {
                fs.rmdirSync(itemPath);
            } catch (error) {
                // Notificar si el directorio no pudo ser removido por contener archivos bloqueados
                console.warn(`[Aviso Despliegue] No se pudo eliminar directorio de assets anterior (${path.basename(itemPath)}): ${error instanceof Error ? error.message : String(error)}`);
            }
        } else {
            try {
                fs.unlinkSync(itemPath);
            } catch (error) {
                try {
                    fs.renameSync(itemPath, `${itemPath}.old.${Date.now()}`);
                } catch (renameErr) {
                    console.warn(`[Aviso Despliegue] Archivo bloqueado (${path.basename(itemPath)}): ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
    }
};

// Asegurar que el directorio de destino existe y limpiar compilaciones anteriores
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
} else {
    deleteBuildElement(path.join(targetDir, 'assets'));
    deleteBuildElement(path.join(targetDir, 'index.html'));
    deleteBuildElement(path.join(targetDir, 'manifest.json'));
}

// Función auxiliar para copiar archivo con estrategia de reemplazo ante bloqueos (EBUSY / EPERM)
const copiarArchivoSeguro = (srcPath, destPath, nombreArchivo) => {
    try {
        fs.copyFileSync(srcPath, destPath);
    } catch (error) {
        const err = error;
        if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
            try {
                // En Windows, renombrar un archivo abierto a menudo permite escribir un nuevo archivo con el nombre original
                const rutaTemporal = `${destPath}.old.${Date.now()}`;
                if (fs.existsSync(destPath)) {
                    fs.renameSync(destPath, rutaTemporal);
                }
                fs.copyFileSync(srcPath, destPath);
                console.log(`[Recuperado] Archivo ${nombreArchivo} reemplazado tras bloqueo de TaleSpire.`);
                return;
            } catch (retryError) {
                console.error(`\n[ERROR EBUSY] TaleSpire tiene bloqueado el archivo: ${nombreArchivo}`);
                console.error(`-> Detalle: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
                console.error(`-> Solución: Cierra TaleSpire o recarga/cierra el simbionte en el juego y vuelve a ejecutar 'pnpm run deploy'.\n`);
                throw retryError;
            }
        }
        console.error(`[Error de copia] No se pudo copiar ${nombreArchivo}: ${err instanceof Error ? err.message : String(err)}`);
        throw error;
    }
};

// Función para copiar archivos recursivamente
const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    entries.forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copiarArchivoSeguro(srcPath, destPath, entry.name);
        }
    });
};

// Copiar directorio de compilación a TaleSpire
try {
    copyDir(buildDir, targetDir);
    console.log(`Despliegue exitoso: Build copiado a ${targetDir}`);
} catch (error) {
    console.error(`Fallo en el despliegue a TaleSpire.`);
    process.exit(1);
}
