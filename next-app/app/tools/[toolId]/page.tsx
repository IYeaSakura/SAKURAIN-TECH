export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-sm text-gray-500">/tools/{toolId}</p>
      <h1 className="mt-2 text-3xl font-bold">工具详情：{toolId}</h1>
      <p className="mt-4 text-gray-600">迁移进行中</p>
    </main>
  );
}
