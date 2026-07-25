import type { Metadata } from 'next';
import { projects } from '@/data/projects';
import { ProjectsGrid } from '@/components/projects/ProjectsGrid';

export const metadata: Metadata = {
  title: 'Projects | SAKURAIN',
  description:
    'SAKURAIN personal projects — web apps, visualization platforms and tools, with tech stack and highlights.',
};

/**
 * /projects — personal project showcase (Server Component).
 * Design language: refact.cc-inspired minimal engineering style — hairline grid,
 * mono tags and restrained color palette.
 * Data is read server-side and serialized to the client grid component so the
 * list is visible to crawlers and on first paint.
 */
export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
      <ProjectsGrid projects={projects} />
    </main>
  );
}
