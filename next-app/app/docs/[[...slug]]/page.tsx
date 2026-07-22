// optional catch-all：覆盖 /docs 及 /docs/a/b/c 任意深度（旧项目四级参数路由）
export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const path = slug?.length ? `/docs/${slug.join("/")}` : "/docs";
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-sm text-gray-500">{path}</p>
      <h1 className="mt-2 text-3xl font-bold">文档</h1>
      <p className="mt-4 text-gray-600">迁移进行中</p>
    </main>
  );
}
