#!/usr/bin/env node
/**
 * copy-cesium.mjs
 *
 * 将 Cesium 运行时静态资产从 node_modules 复制到 public/cesium/，
 * 避免把旧版 public/Assets（~198MB）纳入仓库。
 *
 * 复制内容（Cesium 运行必需的四个目录）：
 *   Workers/    —— Web Worker 脚本（几何/地形计算）
 *   ThirdParty/ —— Cesium 依赖的第三方运行时（如 draco、wasm）
 *   Assets/     —— 默认贴图/天空盒等
 *   Widgets/    —— Viewer 控件的 CSS 与图片
 *
 * 用法：
 *   node scripts/copy-cesium.mjs
 *
 * 说明：
 *   - public/cesium/ 已加入 .gitignore，不随仓库提交。
 *   - 代码中需保证 window.CESIUM_BASE_URL = '/cesium/'（见 src/components/earth/CesiumGlobe.tsx）。
 *   - 部署 CI 里需在 build 前执行本脚本（或把 public/cesium 作为构件缓存）。
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');
const srcBase = join(appRoot, 'node_modules', 'cesium', 'Build', 'Cesium');
const destBase = join(appRoot, 'public', 'cesium');

const DIRS = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];

if (!existsSync(srcBase)) {
  console.error(`[copy-cesium] 未找到 Cesium 构建产物: ${srcBase}`);
  console.error('[copy-cesium] 请先确认 next-app/node_modules 中已安装 cesium 包。');
  process.exit(1);
}

for (const dir of DIRS) {
  const from = join(srcBase, dir);
  const to = join(destBase, dir);
  if (!existsSync(from)) {
    console.warn(`[copy-cesium] 跳过缺失目录: ${from}`);
    continue;
  }
  // 先清后拷，保证与 node_modules 中版本严格一致
  rmSync(to, { recursive: true, force: true });
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`[copy-cesium] ${dir} -> public/cesium/${dir}`);
}

console.log('[copy-cesium] 完成。CESIUM_BASE_URL 应指向 /cesium/');
