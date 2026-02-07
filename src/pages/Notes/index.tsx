import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Smile, Meh, Frown } from 'lucide-react';
import { MagneticCursor, VelocityCursor, AmbientGlow, FloatingBubbles, TwinklingStars } from '@/components/effects';
import { ThemeToggle } from '@/components/atoms';
import { useTheme } from '@/hooks';

interface Note {
  id: string;
  slug: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  yearMonth: string;
  fullDate: string;
  fullTime: string;
}

interface ArchiveData {
  months: string[];
  total: number;
  generatedAt: string;
}

type Mood = 'happy' | 'neutral' | 'sad';

const moodConfig: Record<Mood, { icon: typeof Heart; color: string; label: string }> = {
  happy: { icon: Smile, color: '#22c55e', label: '开心' },
  neutral: { icon: Meh, color: '#f59e0b', label: '平静' },
  sad: { icon: Frown, color: '#ef4444', label: '难过' },
};

export default function NotesPage() {
  const navigate = useNavigate();
  const { theme, isTransitioning, toggleTheme } = useTheme();
  const [archiveData, setArchiveData] = useState<ArchiveData | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [loadedCount, setLoadedCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);

  const NOTES_PER_LOAD = 10;

  useEffect(() => {
    async function loadData() {
      try {
        const archiveResponse = await fetch('/notes/archive.json');
        if (!archiveResponse.ok) throw new Error('Failed to load archive');
        const archive = await archiveResponse.json();
        setArchiveData(archive);

        const allNotes: Note[] = [];
        const monthsToLoad = archive.months.slice(0, Math.ceil(NOTES_PER_LOAD / 10));
        
        for (const month of monthsToLoad) {
          const monthResponse = await fetch(`/notes/archives/index-${month}.json`);
          if (monthResponse.ok) {
            const monthNotes = await monthResponse.json();
            allNotes.push(...monthNotes);
          }
        }

        setNotes(allNotes);
        setLoadedMonths(new Set(monthsToLoad));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load notes:', error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const loadMoreNotes = async () => {
    if (!archiveData || loadingMore) return;

    setLoadingMore(true);
    try {
      const currentTotal = notes.length;
      const targetTotal = currentTotal + NOTES_PER_LOAD;
      const monthsToLoad = archiveData.months.slice(
        loadedMonths.size,
        Math.ceil(targetTotal / 10)
      );

      const newNotes: Note[] = [];
      for (const month of monthsToLoad) {
        const monthResponse = await fetch(`/notes/archives/index-${month}.json`);
        if (monthResponse.ok) {
          const monthNotes = await monthResponse.json();
          newNotes.push(...monthNotes);
        }
      }

      setLoadedMonths(prev => new Set([...prev, ...monthsToLoad]));
      setNotes(prev => [...prev, ...newNotes]);
      setLoadedCount(targetTotal);
    } catch (error) {
      console.error('Failed to load more notes:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredNotes = useMemo(() => {
    let result = notes;

    if (selectedMonth) {
      result = result.filter(note => note.yearMonth === selectedMonth);
    }

    if (selectedMood) {
      result = result.filter(note => note.mood === selectedMood);
    }

    return result.slice(0, loadedCount);
  }, [notes, selectedMonth, selectedMood, loadedCount]);

  const moodCounts = useMemo(() => {
    const counts = { happy: 0, neutral: 0, sad: 0 };
    notes.forEach(note => {
      if (note.mood in counts) {
        counts[note.mood as Mood]++;
      }
    });
    return counts;
  }, [notes]);

  const groupedNotes = useMemo(() => {
    const grouped: Record<string, Note[]> = {};
    filteredNotes.forEach(note => {
      const date = note.fullDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(note);
    });
    return grouped;
  }, [filteredNotes]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedNotes).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedNotes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MagneticCursor />
      <VelocityCursor />

      <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(var(--accent-primary) 1px, transparent 1px),
                linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          <AmbientGlow position="top-left" color="var(--accent-primary)" size={500} opacity={0.12} />
          <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={400} opacity={0.08} />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 70%)',
            }}
          />
        </div>

        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 mc-navbar"
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <motion.button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">返回首页</span>
              </motion.button>

              <div className="flex items-center gap-3">
                <ThemeToggle theme={theme} isTransitioning={isTransitioning} onToggle={toggleTheme} />
              </div>
            </div>
          </div>
        </motion.header>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                说说
              </span>
            </motion.div>

            <h1
              className="font-pixel text-4xl sm:text-5xl lg:text-6xl font-black mb-6"
              style={{
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              随笔记录
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg max-w-2xl mx-auto font-primary"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
            >
              记录日常想法、随笔和有趣的发现
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-3 items-center justify-center">
              <button
                onClick={() => setSelectedMonth(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !selectedMonth ? 'text-white' : ''
                }`}
                style={{
                  background: !selectedMonth ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: !selectedMonth ? 'white' : 'var(--text-primary)',
                }}
              >
                全部
              </button>

              {archiveData?.months.map(month => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month === selectedMonth ? null : month)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedMonth === month ? 'text-white' : ''
                  }`}
                  style={{
                    background: selectedMonth === month ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: selectedMonth === month ? 'white' : 'var(--text-primary)',
                  }}
                >
                  {month}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-3 items-center justify-center">
              {Object.entries(moodCounts).map(([mood, count]) => {
                const config = moodConfig[mood as Mood];
                const Icon = config.icon;
                return (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(selectedMood === mood ? null : mood as Mood)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedMood === mood ? 'text-white' : ''
                    }`}
                    style={selectedMood === mood ? {
                      background: config.color,
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                    } : {
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{config.label}</span>
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
              style={{ color: 'var(--text-muted)' }}
            >
              没有找到匹配的说说
            </motion.div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 pointer-events-none hidden md:block">
                <div className="absolute top-0 left-1/2 w-px h-full -translate-x-1/2"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, var(--accent-primary) 20%, var(--accent-primary) 80%, transparent)',
                    boxShadow: '0 0 10px var(--accent-glow)',
                  }}
                />
              </div>

              <div className="space-y-12">
                {sortedDates.map((date, dateIndex) => {
                  const dateNotes = groupedNotes[date];
                  return (
                    <div key={date} className="relative">
                      <div className="hidden md:block">
                        <div className="relative flex items-start min-h-[200px]">
                          <div className="w-[calc(50%-40px)]">
                            {dateIndex % 2 === 0 && (
                              <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ margin: '-50px' }}
                                transition={{ duration: 0.5 }}
                                className="text-right"
                              >
                                {dateNotes.map((note, noteIndex) => (
                                  <NoteCard key={note.id} note={note} index={noteIndex} align="right" />
                                ))}
                              </motion.div>
                            )}
                          </div>

                          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-20 flex flex-col items-center">
                            {dateIndex > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-8"
                                style={{ background: 'linear-gradient(to top, var(--accent-primary), transparent)' }}
                              />
                            )}

                            <div className="relative w-14 h-14 flex items-center justify-center">
                              <div className="absolute inset-0 rounded-full"
                                style={{ background: 'var(--accent-primary)20', border: '2px solid var(--accent-primary)' }}
                              />
                              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                  background: 'var(--accent-primary)',
                                  boxShadow: '0 0 20px var(--accent-primary)80',
                                }}
                              >
                                <Heart className="w-5 h-5 text-white" />
                              </div>
                            </div>

                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-full"
                              style={{ background: 'linear-gradient(rgba(to bottom, var(--accent-primary), transparent)', maxHeight: '60px' }}
                            />
                          </div>

                          <div className="w-[calc(50%-40px)] ml-auto">
                            {dateIndex % 2 === 1 && (
                              <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ margin: '-50px' }}
                                transition={{ duration: 0.5 }}
                              >
                                {dateNotes.map((note, noteIndex) => (
                                  <NoteCard key={note.id} note={note} index={noteIndex} align="left" />
                                ))}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="md:hidden flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full"
                              style={{ background: 'var(--accent-primary)20', border: '2px solid var(--accent-primary)' }}
                            />
                            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--accent-primary)' }}
                            >
                              <Heart className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <span className="mt-2 text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{date}</span>
                          <div className="w-0.5 flex-1 min-h-[40px]"
                            style={{ background: 'linear-gradient(to bottom, var(--accent-primary), transparent)' }}
                          />
                        </div>

                        <div className="flex-1 pb-6">
                          {dateNotes.map((note, noteIndex) => (
                            <NoteCard key={note.id} note={note} index={noteIndex} align="left" />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {notes.length > loadedCount && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-12 text-center"
                >
                  <button
                    onClick={loadMoreNotes}
                    disabled={loadingMore}
                    className="px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'var(--accent-primary)',
                      color: 'white',
                      boxShadow: '0 4px 20px var(--accent-glow)',
                    }}
                  >
                    {loadingMore ? '加载中...' : '加载更多'}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}

const NoteCard = ({ note, index, align }: {
  note: Note;
  index: number;
  align: 'left' | 'right';
}) => {
  const currentMoodConfig = moodConfig[note.mood as Mood] || moodConfig.neutral;
  const MoodIcon = currentMoodConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative mb-4 last:mb-0"
    >
      <div className="relative p-5 rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--border-subtle)',
          boxShadow: '0 4px 20px -5px rgba(0,0,0,0.2)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${align === 'right' ? '100%' : '0%'} 0%, ${currentMoodConfig.color}20, transparent 70%)`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MoodIcon className="w-4 h-4" style={{ color: currentMoodConfig.color }} />
              <span className="text-xs font-medium" style={{ color: currentMoodConfig.color }}>
                {currentMoodConfig.label}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {note.fullTime}
            </div>
          </div>

          <h3 className="font-primary text-lg font-bold mb-2 text-[var(--text-primary)]">
            {note.title}
          </h3>

          <p className="font-primary text-sm mb-3 text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const Footer = () => {
  return (
    <footer
      className="relative py-16 overflow-hidden"
      style={{ borderTop: '4px solid var(--border-subtle)' }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <FloatingBubbles count={8} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>

      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={20} color="var(--accent-primary)" secondaryColor="var(--accent-secondary)" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p
          className="flex items-center justify-center gap-2 font-primary"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-muted)',
          }}
        >
          © {new Date().getFullYear()} SAKURAIN 技术工作室
          <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          用代码构建未来
        </p>

        <div
          className="mt-4 flex flex-wrap flex-col md:flex-row items-center justify-center gap-4 font-primary"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ transition: 'color 0.2s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            皖ICP备2025073165号-1
          </a>
          <span>|</span>
          <a
            href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=34130202000598"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-centerx gap-1"
            style={{ transition: 'color 0.2s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <img
              src="/image/ghs.png"
              alt="公安备案图标"
              className="w-3 h-3"
            />
            皖公网安备34130202000598号
          </a>
        </div>
      </div>
    </footer>
  );
};
