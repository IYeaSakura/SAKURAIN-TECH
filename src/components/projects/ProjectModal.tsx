'use client';

/**
 * ProjectModal — project detail modal (framer-motion AnimatePresence).
 *
 * - Backdrop bg-background/80 backdrop-blur, click to close
 * - Panel max-w-2xl border border-border/40 bg-background
 * - Entrance: scale 0.96→1 + opacity + y spring; respects prefers-reduced-motion
 * - Close on ESC; lock body scroll while open
 * - Accessibility: role="dialog" aria-modal aria-label
 * - Missing fields handled gracefully: no demo/github means no button, empty highlights hidden
 */
import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, FolderGit2, X } from 'lucide-react';
import { useTranslation } from '@/hooks';
import type { Project } from '@/data/projects';

const STATUS_LABEL: Record<Project['status'], string> = {
  active: 'ACTIVE',
  maintained: 'MAINTAINED',
  archived: 'ARCHIVED',
  wip: 'WIP',
};

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const reduceMotion = useReducedMotion();
  const { t, tReplace } = useTranslation();

  // Close on Escape key
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  // Lock body scroll while the modal is open
  useEffect(() => {
    if (!project) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [project]);

  const panelTransition = reduceMotion
    ? { duration: 0.15 }
    : { type: 'spring' as const, stiffness: 320, damping: 30 };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="project-modal-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
          onClick={onClose}
        >
          <motion.div
            key="project-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={tReplace(t.projects.modalTitle, { name: project.name })}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-border/40 bg-background p-6 sm:p-10"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }
            }
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label={t.common.close}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight pr-10">
              {project.name}
            </h2>

            {/* Mono metadata row */}
            <p className="mt-3 font-mono uppercase tracking-widest text-muted-foreground text-xs">
              {STATUS_LABEL[project.status]} · {project.period} ·{' '}
              {project.category}
            </p>

            {/* Full description (supports multiple paragraphs) */}
            <div className="mt-6 space-y-4 text-sm sm:text-base text-foreground/90 leading-relaxed">
              {project.description.split(/\n\n+/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Highlights list (mono numbering, hidden when empty) */}
            {project.highlights.length > 0 && (
              <div className="mt-8">
                <h3 className="font-mono uppercase tracking-widest text-muted-foreground text-xs border-b border-border/40 pb-2 mb-4">
                  HIGHLIGHTS
                </h3>
                <ul className="space-y-3">
                  {project.highlights.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="font-mono text-xs text-primary shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full tech stack tags */}
            {project.tech.length > 0 && (
              <div className="mt-8">
                <h3 className="font-mono uppercase tracking-widest text-muted-foreground text-xs border-b border-border/40 pb-2 mb-4">
                  STACK
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-xs text-muted-foreground border border-border/40 px-1.5 py-0.5"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom buttons (only rendered when demoUrl / githubUrl exist) */}
            {(project.demoUrl || project.githubUrl) && (
              <div className="mt-10 flex flex-wrap gap-3">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest border border-border/40 px-4 py-2.5 hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t.projects.visitDemo} ↗
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest border border-border/40 px-4 py-2.5 hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <FolderGit2 className="w-4 h-4" />
                    GitHub ↗
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
