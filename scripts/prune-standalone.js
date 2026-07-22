#!/usr/bin/env node
/**
 * Prune build-time-only files from the Next.js standalone output.
 *
 * EdgeOne Pages copies `.next/standalone/node_modules` into its SSR runtime
 * image. Next.js file tracing can include dev-only packages (e.g. typescript,
 * eslint, tailwindcss) on some build environments, which inflates the image and
 * may exceed the platform's disk quota. This script removes those packages and
 * other non-runtime artifacts after `next build` but before deployment packaging.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STANDALONE_NODE_MODULES = path.join(__dirname, '..', '.next', 'standalone', 'node_modules');

// Packages that are never needed at runtime by the deployed application.
// Keep this list conservative: removing a runtime dependency will crash the app.
const PACKAGES_TO_REMOVE = [
  'typescript',
  '@types',
  'eslint',
  'eslint-config-next',
  'eslint-import-resolver-node',
  'eslint-import-resolver-typescript',
  'eslint-module-utils',
  'eslint-plugin-import',
  'eslint-plugin-jsx-a11y',
  'eslint-plugin-react',
  'eslint-plugin-react-hooks',
  'postcss',
  'autoprefixer',
  'tailwindcss',
  'tailwindcss-animate',
  'edgeone',
  '@edgeone',
  '@edge-runtime',
];

// Files and directories that only exist for development/documentation.
const PATTERNS_TO_REMOVE = [
  '**/*.d.ts',
  '**/*.d.ts.map',
  '**/*.js.map',
  '**/*.mjs.map',
  '**/*.css.map',
  '**/README*',
  '**/CHANGELOG*',
  '**/HISTORY*',
  '**/LICENSE*',
  '**/test',
  '**/tests',
  '**/docs',
  '**/__tests__',
  '**/*.test.js',
  '**/*.test.ts',
  '**/*.spec.js',
  '**/*.spec.ts',
];

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function getSize(p) {
  let size = 0;
  if (!exists(p)) return size;
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(p)) {
      size += getSize(path.join(p, entry));
    }
  } else {
    size += stat.size;
  }
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function removeDirectory(p) {
  if (!exists(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function removeMatchingFiles(dir) {
  if (!exists(dir)) return 0;
  let removed = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      removed += removeMatchingFiles(fullPath);
      continue;
    }

    const shouldRemove = PATTERNS_TO_REMOVE.some((pattern) => {
      // Convert simple glob patterns to regex for matching file names.
      if (pattern.startsWith('**/')) {
        const suffix = pattern.slice(3);
        const regex = new RegExp(
          '^' +
            suffix
              .replace(/\./g, '\\.')
              .replace(/\*/g, '.*')
              .replace(/\?/g, '.') +
            '$',
          'i'
        );
        return regex.test(entry.name);
      }
      return false;
    });

    if (shouldRemove) {
      removed += fs.statSync(fullPath).size;
      fs.unlinkSync(fullPath);
    }
  }

  return removed;
}

function main() {
  if (!exists(STANDALONE_NODE_MODULES)) {
    console.log('  No standalone node_modules found, skipping prune');
    return;
  }

  const beforeSize = getSize(STANDALONE_NODE_MODULES);
  let removedBytes = 0;

  console.log('Pruning standalone node_modules...');

  for (const pkg of PACKAGES_TO_REMOVE) {
    const pkgPath = path.join(STANDALONE_NODE_MODULES, pkg);
    if (exists(pkgPath)) {
      const size = getSize(pkgPath);
      removeDirectory(pkgPath);
      removedBytes += size;
      console.log(`  - removed ${pkg}: ${formatBytes(size)}`);
    }
  }

  removedBytes += removeMatchingFiles(STANDALONE_NODE_MODULES);

  const afterSize = getSize(STANDALONE_NODE_MODULES);
  console.log(`  Before: ${formatBytes(beforeSize)}`);
  console.log(`  After:  ${formatBytes(afterSize)}`);
  console.log(`  Saved:  ${formatBytes(removedBytes)}`);
}

main();
