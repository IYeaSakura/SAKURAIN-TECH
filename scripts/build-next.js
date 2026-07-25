import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

process.exit(result.status ?? (result.error ? 1 : 0));
