import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const node = process.execPath;

function run(script) {
  console.log(`\n[build:offline] → ${script}`);
  const result = spawnSync(node, [path.join(rootDir, 'scripts', script)], {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      // 跳过真实网络探测与搜索引擎提交，纯本地构建。
      SKIP_FRIEND_CHECK: 'true',
      SEARCH_ENGINE_SUBMIT: 'none',
    },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const script of [
  'generate-playlist.js',
  'calculate-language-stats.js',
  'sync-content-to-public.js',
  'check-friends-connectivity.js',
  'build-next.js',
]) {
  run(script);
}

console.log('\n[build:offline] Done. Skipped network probing and sitemap submission.');
