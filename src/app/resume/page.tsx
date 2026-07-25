import type { Metadata } from 'next';
import ResumePageLoader from '@/components/resume/ResumePageLoader';

/**
 * /resume —— Server Component shell.
 * The actual content is the full-page client component migrated from the legacy
 * Vite project src/pages/Resume (Phase 1 pragmatic bootstrap).
 */
export const metadata: Metadata = {
  title: 'Resume | SAKURAIN',
  description:
    "Yuyang's resume: core strengths, tech stack, internship and project experience, education, and certifications.",
};

export default function Page() {
  return <ResumePageLoader />;
}
