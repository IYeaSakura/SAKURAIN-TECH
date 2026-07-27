'use client';

/**
 * NotesPage —— brutalist dev-log timeline.
 *
 * Month/difficulty filters plus a simple chronological feed. Cards use thick borders
 * and pixel offset shadows so the page stays consistent with the rest of the
 * site.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Smile, Meh, Frown, Calendar, BarChart3, Clock, Sparkles } from 'lucide-react';
import type { NoteDifficulty } from '@/lib/content/notes';
import { Footer } from '@/components/sections/Footer';
import { useAnimationEnabled, useTranslation } from '@/hooks';
import type { Note } from '@/lib/content/notes';
import type { SiteData } from '@/types';

const DIFFICULTY_ICONS: Record<NoteDifficulty, typeof Heart> = {
  easy: Smile,
  normal: Meh,
  difficult: Frown,
};

const DIFFICULTY_COLORS: Record<NoteDifficulty, string> = {
  easy: '#22c55e',
  normal: '#f59e0b',
  difficult: '#ef4444',
};

const NOTES_PER_LOAD = 12;

interface NotesPageProps {
  /** All notes injected at build time, sorted newest first */
  notes: Note[];
  /** Descending month list used by the month filter */
  months: string[];
}

export default function NotesPage({ notes, months }: NotesPageProps) {
  const animationEnabled = useAnimationEnabled();
  const { t, tReplace } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<NoteDifficulty | null>(null);
  const [loadedCount, setLoadedCount] = useState(NOTES_PER_LOAD);
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);

  useEffect(() => {
    fetch('/data/site-data.json')
      .then((res) => res.json())
      .then((data: SiteData) => setFooterData(data.footer))
      .catch(console.error);
  }, []);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedMonth) result = result.filter((note) => note.yearMonth === selectedMonth);
    if (selectedDifficulty) result = result.filter((note) => note.difficulty === selectedDifficulty);
    return result.slice(0, loadedCount);
  }, [notes, selectedMonth, selectedDifficulty, loadedCount]);

  const difficultyCounts = useMemo(() => {
    const counts = { easy: 0, normal: 0, difficult: 0 };
    notes.forEach((note) => {
      if (note.difficulty in counts) counts[note.difficulty]++;
    });
    return counts;
  }, [notes]);

  const groupedNotes = useMemo(() => {
    const grouped: Record<string, Note[]> = {};
    filteredNotes.forEach((note) => {
      if (!grouped[note.fullDate]) grouped[note.fullDate] = [];
      grouped[note.fullDate].push(note);
    });
    return grouped;
  }, [filteredNotes]);

  const sortedDates = useMemo(
    () => Object.keys(groupedNotes).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedNotes]
  );

  const earliestNote = useMemo(() => {
    if (notes.length === 0) return null;
    return notes.reduce((earliest, current) => (current.timestamp < earliest.timestamp ? current : earliest));
  }, [notes]);

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const developmentTime = useMemo(() => {
    if (!earliestNote) return null;
    const diff = currentTime - earliestNote.timestamp;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }, [earliestNote, currentTime]);

  const stats = useMemo(
    () => [
      {
        label: t.notes.stats.duration,
        value: developmentTime
          ? `${developmentTime.days}d${developmentTime.hours}h${developmentTime.minutes}m${developmentTime.seconds}s`
          : '-',
        icon: MessageCircle,
      },
      { label: t.notes.stats.count, value: notes.length.toString(), icon: Calendar },
      { label: t.notes.stats.difficultyDistribution, value: `${difficultyCounts.easy}/${difficultyCounts.normal}/${difficultyCounts.difficult}`, icon: BarChart3 },
    ],
    [developmentTime, notes.length, difficultyCounts, t]
  );

  const loadMoreNotes = () => setLoadedCount((prev) => prev + NOTES_PER_LOAD);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-12">
        {/* Header */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 border-2 mb-4"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  {t.nav.devLog}
                </span>
              </div>

              <h1
                className="text-3xl sm:text-5xl font-bold uppercase tracking-tight mb-4"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                {t.notes.title}
              </h1>
              <p className="text-base sm:text-lg max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                {t.notes.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:w-80 shrink-0">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={animationEnabled ? { opacity: 0, x: 20 } : undefined}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3 p-3 border-2"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    boxShadow: '4px 4px 0 var(--border-subtle)',
                  }}
                >
                  <div
                    className="w-10 h-10 border-2 flex items-center justify-center"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold font-mono" style={{ color: 'var(--accent-primary)' }}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10 space-y-5"
        >
          <div>
            <h3
              className="text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              {t.notes.monthFilter}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMonth(null)}
                className="px-3 py-1.5 text-xs font-bold uppercase border-2 transition-all"
                style={{
                  background: !selectedMonth ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: !selectedMonth ? 'var(--bg-primary)' : 'var(--text-primary)',
                }}
              >
                {t.common.all}
              </button>
              {months.map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month === selectedMonth ? null : month)}
                  className="px-3 py-1.5 text-xs font-bold uppercase border-2 transition-all"
                  style={{
                    background: selectedMonth === month ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: selectedMonth === month ? 'var(--bg-primary)' : 'var(--text-primary)',
                  }}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3
              className="text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              {t.notes.difficultyFilter}
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(difficultyCounts).map(([difficulty, count]) => {
                const Icon = DIFFICULTY_ICONS[difficulty as NoteDifficulty];
                const color = DIFFICULTY_COLORS[difficulty as NoteDifficulty];
                const label = t.notes.difficulties[difficulty as NoteDifficulty];
                const isSelected = selectedDifficulty === difficulty;
                return (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(isSelected ? null : (difficulty as NoteDifficulty))}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 transition-all"
                    style={{
                      background: isSelected ? color : 'var(--bg-secondary)',
                      borderColor: isSelected ? color : 'var(--border-subtle)',
                      color: isSelected ? 'var(--bg-primary)' : 'var(--text-primary)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                    <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Feed */}
        <motion.section
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredNotes.length === 0 ? (
            <div
              className="text-center py-20 text-sm font-mono border-2"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              {t.notes.emptyHint}
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((date) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {date}
                    </span>
                    <div className="flex-1 h-0.5" style={{ background: 'var(--border-subtle)' }} />
                    <span
                      className="text-[10px] font-mono px-2 py-1 border-2"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      {tReplace(t.notes.count, { count: groupedNotes[date].length })}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {groupedNotes[date].map((note, index) => {
                      const difficulty = (note.difficulty as NoteDifficulty) in DIFFICULTY_ICONS
                        ? (note.difficulty as NoteDifficulty)
                        : 'normal';
                      const DifficultyIcon = DIFFICULTY_ICONS[difficulty];
                      const difficultyColor = DIFFICULTY_COLORS[difficulty];
                      const difficultyLabel = t.notes.difficulties[difficulty];

                      return (
                        <motion.div
                          key={note.id}
                          initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-2 p-4"
                          style={{
                            background: 'var(--bg-secondary)',
                            borderColor: 'var(--border-subtle)',
                            boxShadow: '3px 3px 0 var(--border-subtle)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className="flex items-center gap-1.5 px-2 py-0.5 border-2 text-[10px] font-bold uppercase"
                              style={{
                                background: 'var(--bg-primary)',
                                borderColor: `${difficultyColor}40`,
                                color: difficultyColor,
                              }}
                            >
                              <DifficultyIcon className="w-3 h-3" />
                              {difficultyLabel}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                              <Clock className="w-3 h-3" />
                              {note.fullTime}
                            </div>
                          </div>

                          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            {note.title}
                          </h3>

                          <div className="text-sm leading-relaxed space-y-1" style={{ color: 'var(--text-secondary)' }}>
                            {note.content.split('\n').map((line, i) =>
                              line.trim().startsWith('- ') ? (
                                <li key={i} className="ml-4 list-disc marker:text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {line.trim().substring(2)}
                                </li>
                              ) : (
                                <p key={i}>{line}</p>
                              )
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadedCount < notes.length && (
            <div className="mt-12 text-center">
              <button
                onClick={loadMoreNotes}
                className="px-8 py-3 text-xs font-bold uppercase border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  boxShadow: '4px 4px 0 var(--accent-primary)',
                }}
              >
                {t.notes.loadMore}
              </button>
            </div>
          )}
        </motion.section>
      </main>

      {footerData && <Footer data={footerData} />}
    </div>
  );
}
