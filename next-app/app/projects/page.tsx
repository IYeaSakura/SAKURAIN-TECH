import type { Metadata } from 'next';
import { projects } from '@/data/projects';
import { ProjectsGrid } from '@/components/projects/ProjectsGrid';

export const metadata: Metadata = {
  title: '项目 | SAKURAIN',
  description:
    'SAKURAIN 个人项目展示 —— Web 应用、可视化平台与工具，含技术栈与项目亮点。',
};

/**
 * /projects —— 个人项目展示页（Server Component）。
 * 设计语言：参考 refact.cc 极简工程风 —— 发丝级网格、mono 标签、克制配色。
 * 数据在服务端读取并序列化给客户端网格组件，列表内容对爬虫/首屏可见。
 */
export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
      {/* 分区头部：左侧大标题，右侧 mono 统计 */}
      <header className="flex items-end justify-between border-b border-border/40 pb-4 mb-8">
        <div>
          <p className="font-mono uppercase tracking-widest text-muted-foreground text-xs">
            /projects
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
            项目
          </h1>
        </div>
        <p className="font-mono uppercase tracking-widest text-muted-foreground text-xs">
          TOTAL: {String(projects.length).padStart(2, '0')}
        </p>
      </header>

      <ProjectsGrid projects={projects} />
    </main>
  );
}
