guardar respaldo deploy

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

// Function to safely delete build-specific files/directories without touching game cache or persistence
const deleteBuildElement = (itemPath) => {
    try {
        if (fs.existsSync(itemPath)) {
            fs.rmSync(itemPath, { recursive: true, force: true });
        }
    } catch (e) {
        // Ignore if locked by the active WebView
    }
};

// Ensure target directory exists and selectively clean old build files
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
} else {
    deleteBuildElement(path.join(targetDir, 'assets'));
    deleteBuildElement(path.join(targetDir, 'index.html'));
    deleteBuildElement(path.join(targetDir, 'manifest.json'));
}

// Copy the build directory to the target directory recursively using standard Node.js API
fs.cpSync(buildDir, targetDir, { recursive: true });

console.log(`Build copied to ${targetDir}`);
