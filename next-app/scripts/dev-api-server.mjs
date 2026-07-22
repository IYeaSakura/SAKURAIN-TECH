/**
 * 本地 EdgeOne Pages Functions 模拟服务（纯本地开发兜底）
 *
 * 背景：官方 `edgeone pages dev` 的本地运行时沙箱需要 EDGEONE_PAGES_API_TOKEN
 * （腾讯云登录）才能启动，无法离线使用。本脚本以最小代价模拟 EdgeOne Pages
 * 的函数运行时约定，让 edge-functions/ 目录里的函数代码零改动跑在本地：
 *
 *   - 路由：/api/comments -> edge-functions/api/comments/index.js
 *           /api/danmaku/list -> edge-functions/api/danmaku/list.js
 *           （与 EdgeOne Pages 的目录路由约定一致，尾斜杠可选）
 *   - Handler 分发：按 HTTP 方法调用 onRequestGet/onRequestPost/...，
 *     无对应方法导出时回退到 default export（onRequest）。
 *   - KV 绑定：函数里以裸全局变量引用的 KV_SECRET / RATE_LIMIT_KV /
 *     DANMAKU_KV / COMMENTS_KV / FEED_KV，在 import 函数模块前注入到
 *     globalThis，底层是持久化到 .edgeone-local/kv-store.json 的 Map
 *     （支持 expirationTtl）。
 *   - 环境变量：从 .env.local 读取，作为 context.env 传入
 *     （函数使用 env.VITE_API_SECRET_KEY 做 HMAC 鉴权）。
 *
 * 用法：npm run dev:api   （默认端口 8788，可用 EDGE_API_PORT 覆盖）
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FUNCTIONS_DIR = path.join(ROOT, "edge-functions");
const DATA_DIR = path.join(ROOT, ".edgeone-local");
const KV_FILE = path.join(DATA_DIR, "kv-store.json");
const PORT = Number(process.env.EDGE_API_PORT || 8788);

/* ---------- .env.local 简易解析（无第三方依赖） ---------- */
function loadEnvLocal() {
  const env = {};
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
  return env;
}

const env = loadEnvLocal();

/* ---------- KV 本地模拟：Map + JSON 文件持久化 ---------- */
function createLocalKV(namespace) {
  let store = new Map();
  if (fs.existsSync(KV_FILE)) {
    try {
      const all = JSON.parse(fs.readFileSync(KV_FILE, "utf8"));
      for (const [key, entry] of Object.entries(all[namespace] || {})) {
        if (entry.expiresAt && entry.expiresAt <= Date.now()) continue;
        store.set(key, entry);
      }
    } catch {
      /* 损坏则从头开始 */
    }
  }

  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      let all = {};
      if (fs.existsSync(KV_FILE)) {
        try {
          all = JSON.parse(fs.readFileSync(KV_FILE, "utf8"));
        } catch {
          all = {};
        }
      }
      all[namespace] = Object.fromEntries(store);
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(KV_FILE, JSON.stringify(all, null, 2));
    }, 50);
  }

  return {
    async get(key, opts) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt <= Date.now()) {
        store.delete(key);
        persist();
        return null;
      }
      const type = typeof opts === "string" ? opts : opts?.type;
      if (type === "json") return JSON.parse(entry.value);
      if (type === "arrayBuffer") {
        return new TextEncoder().encode(entry.value).buffer;
      }
      return entry.value;
    },
    async put(key, value, opts) {
      const text =
        typeof value === "string" ? value : new TextDecoder().decode(value);
      const entry = { value: text, expiresAt: null };
      if (opts?.expirationTtl) {
        entry.expiresAt = Date.now() + opts.expirationTtl * 1000;
      }
      store.set(key, entry);
      persist();
    },
    async delete(key) {
      store.delete(key);
      persist();
    },
    async list(opts = {}) {
      const keys = [...store.keys()]
        .filter((k) => !opts.prefix || k.startsWith(opts.prefix))
        .sort()
        .slice(0, opts.limit || 256)
        .map((key) => ({ key }));
      return { complete: true, cursor: null, keys };
    },
  };
}

// 在 import 任何函数模块之前注入 KV 裸全局绑定
for (const name of [
  "KV_SECRET",
  "RATE_LIMIT_KV",
  "DANMAKU_KV",
  "COMMENTS_KV",
  "FEED_KV",
]) {
  if (!globalThis[name]) globalThis[name] = createLocalKV(name);
}

/* ---------- EdgeOne Pages 目录路由解析 ---------- */
function resolveFunctionFile(pathname) {
  const rel = pathname.replace(/^\/+|\/+$/g, "");
  if (!rel) return null;
  const candidates = [
    path.join(FUNCTIONS_DIR, `${rel}.js`),
    path.join(FUNCTIONS_DIR, rel, "index.js"),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return null;
}

const METHOD_HANDLERS = {
  GET: "onRequestGet",
  POST: "onRequestPost",
  PATCH: "onRequestPatch",
  PUT: "onRequestPut",
  DELETE: "onRequestDelete",
  HEAD: "onRequestHead",
  OPTIONS: "onRequestOptions",
};

// 模块缓存：同一路由只 import 一次
const moduleCache = new Map();
async function loadModule(file) {
  if (!moduleCache.has(file)) {
    moduleCache.set(file, await import(pathToFileURL(file).href));
  }
  return moduleCache.get(file);
}

/* ---------- HTTP 服务 ---------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const file = resolveFunctionFile(url.pathname);

  if (!file) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: `No function matched ${url.pathname}`,
        hint: "functions are served from next-app/edge-functions/",
      })
    );
    return;
  }

  try {
    const mod = await loadModule(file);
    const handler =
      mod[METHOD_HANDLERS[req.method]] || mod.default || mod.onRequest;
    if (typeof handler !== "function") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Method ${req.method} not allowed` }));
      return;
    }

    // 读取请求体并构造 Web API Request
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    }
    const request = new Request(url.href, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
    });

    const waitUntilTasks = [];
    const context = {
      request,
      env,
      params: {},
      waitUntil: (p) => waitUntilTasks.push(p),
      next: () => {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "no static asset fallback in dev" }));
        return new Response("not found", { status: 404 });
      },
    };

    const response = await handler(context);
    await Promise.allSettled(waitUntilTasks);

    const resHeaders = {};
    response.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });
    res.writeHead(response.status, resHeaders);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error(`[dev-api] ${req.method} ${url.pathname} failed:`, err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
});

server.listen(PORT, () => {
  console.log(`[dev-api] EdgeOne functions dev server (local fallback)`);
  console.log(`[dev-api] serving ${FUNCTIONS_DIR}`);
  console.log(`[dev-api] listening on http://localhost:${PORT}`);
  console.log(
    `[dev-api] env loaded: VITE_API_SECRET_KEY ${
      env.VITE_API_SECRET_KEY ? "(set)" : "(MISSING - check .env.local)"
    }`
  );
});
