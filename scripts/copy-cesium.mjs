import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(PROJECT_ROOT, 'node_modules', 'cesium', 'Build', 'Cesium');
const TARGET_DIR = path.join(PROJECT_ROOT, 'public', 'cesium');

/**
 * Recursively copy a directory tree from source to target.
 */
function copyDir(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * Remove the existing Cesium asset directory so stale files do not accumulate.
 */
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Copy Cesium runtime assets required by the browser build of CesiumJS.
 * CesiumGlobe.tsx sets window.CESIUM_BASE_URL to '/cesium/' and expects
 * Workers and Assets to be served from this directory.
 */
function copyCesium() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`✘ Cesium build directory not found: ${SOURCE_DIR}`);
    console.error('   Make sure cesium is installed (npm install).');
    process.exit(1);
  }

  console.log('Copying Cesium runtime assets to public/cesium/...');
  removeDir(TARGET_DIR);
  copyDir(SOURCE_DIR, TARGET_DIR);
  console.log(`✓ Cesium assets copied to public/cesium/`);
}

copyCesium();
