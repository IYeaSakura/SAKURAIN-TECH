import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Cross-platform wrapper for `next build` that bumps the V8 heap limit.
 *
 * EdgeOne Pages and other constrained builders may kill the build with
 * SIGKILL/exit 137 when Next.js compiles heavy dependencies (Cesium/Three.js).
 * Setting --max-old-space-size explicitly gives the build process more room
 * without relying on shell-specific env syntax.
 */
const existingOptions = process.env.NODE_OPTIONS || '';
if (!existingOptions.includes('--max-old-space-size')) {
  process.env.NODE_OPTIONS = `${existingOptions} --max-old-space-size=3072`.trim();
}

// Resolve the Next.js CLI entry directly. node_modules/.bin/next is a shell
// shim on Windows, so pointing at the package's declared bin avoids cross-platform
// spawn issues.
const nextBin = path.resolve(__dirname, '../node_modules/next/dist/bin/next');
const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? (result.error ? 1 : 0));
}

/**
 * Align EdgeOne's opennext plugin with the custom distDir.
 *
 * Next.js keeps internal build metadata (BUILD_ID, required-server-files.json,
 * export-detail.json) inside .next even when distDir is set to "dist". The
 * opennext plugin detects the publish directory by looking for BUILD_ID, so it
 * picks .next and then fails to copy the static export from dist. When the
 * static copy fails the deployment falls back to .next and every route returns
 * 404.
 *
 * To fix this we mirror the metadata files into dist and remove .next/BUILD_ID
 * so the plugin detects dist as the publish directory, reads the mirrored
 * metadata, and copies the static export successfully.
 */
const dotNextDir = path.join(rootDir, '.next');
const distDir = path.join(rootDir, 'dist');
const buildIdSource = path.join(dotNextDir, 'BUILD_ID');
const exportDetailSource = path.join(dotNextDir, 'export-detail.json');
const requiredServerFilesSource = path.join(dotNextDir, 'required-server-files.json');

try {
  const hasExport = fs.existsSync(exportDetailSource);
  const hasMetadata = fs.existsSync(buildIdSource) && fs.existsSync(requiredServerFilesSource);

  if (hasExport && hasMetadata) {
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Make dist discoverable as the publish directory.
    fs.copyFileSync(buildIdSource, path.join(distDir, 'BUILD_ID'));

    // Patch required-server-files.json so the plugin looks for export-detail.json
    // inside dist instead of .next.
    const requiredServerFiles = JSON.parse(fs.readFileSync(requiredServerFilesSource, 'utf-8'));
    requiredServerFiles.config.distDir = 'dist';
    fs.writeFileSync(
      path.join(distDir, 'required-server-files.json'),
      JSON.stringify(requiredServerFiles, null, 2)
    );

    // Patch export-detail.json so the outDirectory points to dist.
    const exportDetail = JSON.parse(fs.readFileSync(exportDetailSource, 'utf-8'));
    exportDetail.outDirectory = distDir;
    fs.writeFileSync(
      path.join(distDir, 'export-detail.json'),
      JSON.stringify(exportDetail, null, 2)
    );

    // Remove BUILD_ID from .next so detectPublishDir() falls through to dist.
    fs.unlinkSync(buildIdSource);

    console.log('[build-next] Mirrored EdgeOne metadata into dist and removed .next/BUILD_ID');
  }

  /**
   * Debug: reproduce the same cp() that opennext's copyStaticExport performs.
   * The opennext plugin is loaded from outside the project node_modules, so
   * patching its source does not work. We copy dist to a temporary directory
   * here to surface the actual error message if Node.js fs.cp fails in this
   * environment.
   */
  const edgeoneDir = path.join(rootDir, '.edgeone');
  if (fs.existsSync(distDir) && fs.existsSync(edgeoneDir)) {
    const testDest = path.join(edgeoneDir, 'assets-test');
    if (fs.existsSync(testDest)) {
      fs.rmSync(testDest, { recursive: true, force: true });
    }
    try {
      fs.cpSync(distDir, testDest, { recursive: true });
      const destStat = fs.statSync(testDest);
      console.log('[build-next] fs.cp test succeeded, dest is directory:', destStat.isDirectory());
      fs.rmSync(testDest, { recursive: true, force: true });
    } catch (cpError) {
      console.error('[build-next] fs.cp test failed:', cpError.message);
      if (cpError.stack) {
        console.error(cpError.stack);
      }
    }
  } else {
    console.log('[build-next] Skipping fs.cp test, dist or .edgeone not found');
  }
} catch (error) {
  console.error('[build-next] Failed to prepare EdgeOne publish metadata:', error);
  process.exit(1);
}

process.exit(0);
