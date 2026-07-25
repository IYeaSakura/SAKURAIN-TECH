/**
 * Full-screen Reader terminal application.
 *
 * Renders a text file inside the terminal. By default markdown syntax is
 * rendered; the `-r` flag shows the raw source instead. Press `q` to exit.
 */

'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface ReaderAppProps {
  content: string;
  plain: boolean;
  onExit: () => void;
}

export function ReaderApp({ content, plain, onExit }: ReaderAppProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Escape') {
        e.preventDefault();
        onExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit]);

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col p-4 font-mono text-sm"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        className="flex items-center justify-between border-b-2 pb-2 mb-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span style={{ color: 'var(--accent-primary)' }}>
          Reader — {plain ? 'raw' : 'markdown'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>Press q to exit</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto border-2 p-4"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        {plain ? (
          <pre
            className="whitespace-pre-wrap break-words"
            style={{ color: 'var(--text-secondary)' }}
          >
            {content}
          </pre>
        ) : (
          <div
            className="prose prose-sm max-w-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
