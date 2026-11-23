/**
 * 友链检测的统一入口。
 *
 * 是否在构建期跑真实探测由 content/config/friends.json 的
 * builtinCheck.enabled 决定：
 *   - false：跳过（状态改由 sakurain-api 提供，页面运行时拉取）
 *   - true ：执行原有的 check-friends-connectivity.js
 *
 * 脚本本身没有删除，方便在没有 API 的环境下临时切回本地探测。
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const configPath = path.join(rootDir, 'content', 'config', 'friends.json');
const probeScript = path.join(rootDir, 'scripts', 'check-friends-connectivity.js');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.warn(`[friends] 无法读取 ${configPath}：${error.message}`);
    return null;
  }
}

const config = readConfig();
// 配置缺失时保持旧行为（继续本地探测），避免静默改变构建结果。
const builtinEnabled = config?.builtinCheck?.enabled !== false;
const api = config?.api;
const apiEndpoint =
  api?.enabled !== false && api?.baseUrl
    ? `${String(api.baseUrl).replace(/\/$/, '')}${api.statusPath || '/api/friends/status'}`
    : null;

if (process.env.SKIP_FRIEND_CHECK === 'true') {
  console.log('[friends] SKIP_FRIEND_CHECK=true，跳过连通性检测');
  process.exit(0);
}

if (!builtinEnabled) {
  console.log('[friends] 内置检测已关闭（content/config/friends.json → builtinCheck.enabled=false）');
  if (apiEndpoint) {
    console.log(`[friends] 状态由 ${apiEndpoint} 提供，页面在运行时拉取`);
  }
  process.exit(0);
}

console.log('[friends] builtinCheck.enabled=true，执行 scripts/check-friends-connectivity.js');
const result = spawnSync(process.execPath, [probeScript], {
  stdio: 'inherit',
  cwd: rootDir,
  env: process.env,
});
process.exit(result.status ?? 1);
