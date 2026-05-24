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

// Function to clean a directory's contents recursively without deleting the root directory itself
const cleanDirContents = (dir) => {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
            const curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                cleanDirContents(curPath);
                try {
                    fs.rmdirSync(curPath);
                } catch (e) {
                    console.warn(`Warning: Could not remove directory ${curPath}: ${e.message}`);
                }
            } else {
                try {
                    fs.unlinkSync(curPath);
                } catch (e) {
                    console.warn(`Warning: Could not remove file ${curPath}: ${e.message}`);
                }
            }
        });
    }
};

// Ensure the target directory exists and is clean of old assets
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
} else {
    cleanDirContents(targetDir);
}

// Function to copy files recursively
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
            fs.copyFileSync(srcPath, destPath);
        }
    });
};

// Copy the build directory to the target directory
copyDir(buildDir, targetDir);

console.log(`Build copied to ${targetDir}`);
