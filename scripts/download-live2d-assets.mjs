/**
 * Download Live2D Cubism Core runtime and the free Haru sample model
 * so the mascot does not rely on external CDNs at runtime.
 *
 * Run with: node scripts/download-live2d-assets.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CUBISM_CORE_URL =
  'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js';
const HARU_BASE_URL =
  'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/';
const HARU_MODEL = 'haru_greeter_t03.model3.json';

async function download(url, outPath) {
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buffer);
  console.log(`  -> ${outPath.replace(ROOT, '')}`);
}

async function tryDownload(url, outPath) {
  try {
    await download(url, outPath);
  } catch (err) {
    console.warn(`  skipped: ${err.message}`);
  }
}

async function main() {
  const live2dDir = join(ROOT, 'public', 'live2d');
  const haruDir = join(live2dDir, 'haru');

  await download(CUBISM_CORE_URL, join(live2dDir, 'live2dcubismcore.min.js'));

  const modelUrl = new URL(HARU_MODEL, HARU_BASE_URL).href;
  const modelPath = join(haruDir, HARU_MODEL);
  await download(modelUrl, modelPath);

  const modelJson = JSON.parse(await (await fetch(modelUrl)).text());
  const refs = new Set();

  const pushRef = (ref) => {
    if (!ref) return;
    // Normalize relative paths like ../shizuku/sounds/xxx.mp3
    refs.add(normalize(ref).replace(/\\/g, '/'));
  };

  const fr = modelJson.FileReferences || {};
  pushRef(fr.Moc);
  pushRef(fr.Physics);
  pushRef(fr.UserData);
  pushRef(fr.DisplayInfo);
  pushRef(fr.Pose);

  (fr.Textures || []).forEach(pushRef);
  (fr.Expressions || []).forEach((e) => pushRef(e.File));

  const motions = fr.Motions || {};
  Object.values(motions).forEach((group) => {
    group.forEach((m) => {
      pushRef(m.File);
      pushRef(m.Sound);
    });
  });

  for (const ref of refs) {
    // Paths like ../shizuku/sounds/flickHead_00.mp3 need to be fetched
    // from the parent of HARU_BASE_URL.
    const url = new URL(ref, HARU_BASE_URL).href;
    const outPath = join(haruDir, ref);
    // Optional files (DisplayInfo/CDI) are sometimes missing from mirrors.
    if (ref.endsWith('.cdi3.json')) {
      await tryDownload(url, outPath);
    } else {
      await download(url, outPath);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
