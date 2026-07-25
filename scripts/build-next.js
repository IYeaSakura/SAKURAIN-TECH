import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const isCI = Boolean(process.env.CI || process.env.SKIP_FRIEND_CHECK);

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
 * Align EdgeOne's opennext plugin with the custom distDir and free up /dev/shm.
 *
 * Next.js keeps internal build metadata (BUILD_ID, required-server-files.json,
 * export-detail.json) inside .next even when distDir is set to "dist". The
 * opennext plugin detects the publish directory by looking for BUILD_ID, so it
 * picks .next and then fails to copy the static export from dist. When the
 * static copy fails the deployment falls back to .next and every route returns
 * 404.
 *
 * We mirror the metadata files into dist and remove .next/BUILD_ID so the
 * plugin detects dist as the publish directory. Additionally, EdgeOne builds
 * run on a tmpfs with limited space; the .next/cache directory alone can be
 * hundreds of megabytes and is not needed for a static export, so we delete
 * the entire .next directory after mirroring to prevent "ENOSPC: no space left
 * on device" when opennext copies dist to .edgeone/assets.
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

    console.log('[build-next] Mirrored EdgeOne metadata into dist');
  }

  // Remove the internal Next.js build directory on CI to free tmpfs space for
  // the opennext static-export copy. Locally we keep it for incremental builds.
  if (isCI && fs.existsSync(dotNextDir)) {
    fs.rmSync(dotNextDir, { recursive: true, force: true });
    console.log('[build-next] Removed .next to free tmpfs space on CI');
  }
} catch (error) {
  console.error('[build-next] Failed to prepare EdgeOne publish metadata:', error);
  process.exit(1);
}

process.exit(0);
