import { execSync } from 'child_process';
import { zip } from 'zip-a-folder';
import fs from 'fs';
import path from 'path';

// Read configuration
const config = JSON.parse(await fs.promises.readFile('./build_folder_name.json', 'utf-8'));
const buildFolder = config.buildFolder;
const rootBuildPath = 'mod-io-build';
const buildPath = path.join(rootBuildPath, buildFolder);
const zipFileName = `${buildFolder}.zip`;

// Delete the zip file if it exists
if (fs.existsSync(zipFileName)) {
    fs.unlinkSync(zipFileName);
    console.log(`Deleted existing zip file: ${zipFileName}`);
}

// Ensure the build path exists
if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true });
}

// Run Vite build with the specified output directory
execSync(`vite build --outDir ${buildPath}`, { stdio: 'inherit' });

// Zip the build folder
const zipBuildFolder = async () => {
    await zip(rootBuildPath, zipFileName, {
        includeBasePath: true
    });
    console.log(`Build folder zipped as ${zipFileName}`);
};

zipBuildFolder().catch(err => {
    console.error('Error zipping the build folder:', err);
});
