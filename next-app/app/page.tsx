import Link from "next/link";

const routes = [
  { path: "/", label: "首页" },
  { path: "/blog", label: "博客" },
  { path: "/notes", label: "随记" },
  { path: "/docs", label: "文档" },
  { path: "/friends", label: "友链" },
  { path: "/friends-circle", label: "朋友圈" },
  { path: "/about", label: "关于" },
  { path: "/studio", label: "工作室" },
  { path: "/resume", label: "简历" },
  { path: "/earth-online", label: "Earth Online" },
  { path: "/algo-viz", label: "算法可视化" },
  { path: "/tools", label: "工具箱" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">SAKURAIN</h1>
      <p className="mt-4 text-gray-600">
        个人品牌站 · Next.js 15 迁移进行中。以下为规划路由占位入口：
      </p>
      <nav className="mt-8">
        <ul className="grid grid-cols-2 gap-3">
          {routes.map((r) => (
            <li key={r.path}>
              <Link
                href={r.path}
                className="block rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                <span className="font-mono text-sm text-gray-500">{r.path}</span>
                <span className="mt-1 block font-medium">{r.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
