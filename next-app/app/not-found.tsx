import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-gray-600">页面不存在或尚未迁移完成。</p>
      <Link
        href="/"
        className="mt-8 rounded-lg border border-gray-300 px-5 py-2 transition-colors hover:bg-gray-50"
      >
        返回首页
      </Link>
    </main>
  );
}
