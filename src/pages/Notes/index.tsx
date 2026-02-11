import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Smile, Meh, Frown, Calendar, BarChart3, Sparkles } from 'lucide-react';
import { AmbientGlow, GradientText, LightBeam } from '@/components/effects';
import { Footer } from '@/components/sections/Footer';
import { useMobile } from '@/hooks';
import { clipPathRounded } from '@/utils/styles';
import type { SiteData } from '@/types';

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

const moodConfig: Record<Mood, { icon: typeof Heart; color: string; label: string; bgColor: string }> = {
  happy: { icon: Smile, color: '#22c55e', label: '开心', bgColor: 'rgba(34, 197, 94, 0.15)' },
  neutral: { icon: Meh, color: '#f59e0b', label: '平静', bgColor: 'rgba(245, 158, 11, 0.15)' },
  sad: { icon: Frown, color: '#ef4444', label: '难过', bgColor: 'rgba(239, 68, 68, 0.15)' },
};

export default function NotesPage() {
  const [archiveData, setArchiveData] = useState<ArchiveData | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const isMobile = useMobile();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [loadedCount, setLoadedCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [footerData, setFooterData] = useState<SiteData['footer'] | null>(null);

  const NOTES_PER_LOAD = 10;

  // 加载 footer 数据
  useEffect(() => {
    fetch('/data/site-data.json')
      .then(res => res.json())
      .then((data: SiteData) => {
        setFooterData(data.footer);
      })
      .catch(console.error);
  }, []);

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

  const stats = useMemo(() => [
    { label: '日志总数', value: notes.length.toString(), icon: MessageCircle, color: 'var(--accent-primary)' },
    { label: '月份数', value: archiveData?.months.length.toString() || '0', icon: Calendar, color: 'var(--accent-secondary)' },
    { label: '心情分布', value: `${moodCounts.happy}/${moodCounts.neutral}/${moodCounts.sad}`, icon: BarChart3, color: '#22c55e' },
  ], [notes.length, archiveData?.months.length, moodCounts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-2 border-t-transparent animate-spin"
            style={{
              borderColor: 'var(--accent-primary)',
              borderTopColor: 'transparent',
              clipPath: clipPathRounded(6),
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* 统一背景特效 - 蓝绿配色 */}
      <div className="fixed inset-0 pointer-events-none">
        <AmbientGlow color="var(--accent-primary)" opacity={0.15} position="top-right" />
        <AmbientGlow color="var(--accent-secondary)" opacity={0.1} position="bottom-left" />
        <AmbientGlow color="var(--accent-primary)" opacity={0.08} position="center" size={600} />

        {/* 网格背景 - 80px */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      <main className="relative z-10">
        {/* Hero 区域 - 非对称布局 */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 左侧：标题和描述 */}
              <div className="">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 mb-6"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>开发记录 · 心情分享</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-sans font-bold text-5xl lg:text-6xl mb-6"
                >
                  <GradientText animate={true}>日志</GradientText>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl mb-8 max-w-xl"
                  style={{ color: 'var(--text-muted)' }}
                >
                  自动通过Git commit记录生成开发日志，并支持通过心情筛选。
                </motion.p>
              </div>

              {/* 右侧：统计卡片 - 像素风格 */}
              <div className="">
                <div className="grid grid-cols-1 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="relative p-5 flex items-center gap-4 cursor-default"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '2px solid rgba(255, 255, 255, 0.08)',
                        clipPath: clipPathRounded(6),
                      }}
                    >
                      {/* Hover glow */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at center, var(--accent-glow), transparent 70%)' }}
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 0.5 }}
                        transition={{ duration: 0.3 }}
                      />

                      <div
                        className="w-12 h-12 flex items-center justify-center"
                        style={{
                          background: `${stat.color}20`,
                          clipPath: clipPathRounded(4),
                        }}
                      >
                        <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                      </div>
                      <div>
                        <div className="font-sans font-bold text-2xl" style={{ color: stat.color }}>
                          {stat.value}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 筛选区域 */}
        <section className="relative pb-12">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 月份筛选 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-6"
            >
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>月份筛选</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="px-4 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    background: !selectedMonth ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: !selectedMonth ? 'white' : 'var(--text-primary)',
                    clipPath: clipPathRounded(4),
                  }}
                >
                  全部
                </button>

                {archiveData?.months.map(month => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month === selectedMonth ? null : month)}
                    className="px-4 py-2 text-sm font-medium transition-all duration-200"
                    style={{
                      background: selectedMonth === month ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: selectedMonth === month ? 'white' : 'var(--text-primary)',
                      clipPath: clipPathRounded(4),
                    }}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 心情筛选 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>心情筛选</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(moodCounts).map(([mood, count]) => {
                  const config = moodConfig[mood as Mood];
                  const Icon = config.icon;
                  const isSelected = selectedMood === mood;
                  return (
                    <button
                      key={mood}
                      onClick={() => setSelectedMood(isSelected ? null : mood as Mood)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200"
                      style={{
                        background: isSelected ? config.color : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isSelected ? config.color : 'rgba(255, 255, 255, 0.1)'}`,
                        color: isSelected ? 'white' : 'var(--text-primary)',
                        clipPath: clipPathRounded(4),
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
          </div>
        </section>

        {/* 时间线内容区域 */}
        <section className="relative pb-20">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                {/* 时间线中轴线 - 蓝绿渐变 */}
                <div className="absolute inset-0 pointer-events-none hidden md:block">
                  <div
                    className="absolute top-0 left-1/2 w-px h-full -translate-x-1/2"
                    style={{
                      background: 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.5) 20%, rgba(34, 197, 94, 0.5) 80%, transparent)',
                    }}
                  />
                </div>

                <div className="space-y-16">
                  {sortedDates.map((date, dateIndex) => {
                    const dateNotes = groupedNotes[date];
                    return (
                      <div key={date} className="relative">
                        {/* 桌面端布局 */}
                        <div className="hidden md:block">
                          <div className="relative flex items-start min-h-[200px]">
                            {/* 左侧内容 */}
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

                            {/* 中间时间节点 */}
                            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-20 flex flex-col items-center">
                              {dateIndex > 0 && (
                                <div
                                  className="absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-8"
                                  style={{
                                    background: 'linear-gradient(to top, rgba(59, 130, 246, 0.5), transparent)'
                                  }}
                                />
                              )}

                              {/* 时间节点圆环 - 像素风格 */}
                              <div className="relative w-14 h-14 flex items-center justify-center">
                                <motion.div
                                  className="absolute inset-0"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(34, 197, 94, 0.2))',
                                    border: '2px solid rgba(59, 130, 246, 0.5)',
                                    clipPath: clipPathRounded(4),
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                />
                                <div
                                  className="w-10 h-10 flex items-center justify-center"
                                  style={{
                                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                    clipPath: clipPathRounded(3),
                                  }}
                                >
                                  <Heart className="w-5 h-5 text-white" />
                                </div>
                              </div>

                              <div
                                className="mt-3 px-3 py-1 text-xs font-medium whitespace-nowrap"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: 'var(--accent-secondary)',
                                  clipPath: clipPathRounded(2),
                                }}
                              >
                                {date}
                              </div>

                              <div
                                className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-full"
                                style={{
                                  background: 'linear-gradient(to bottom, rgba(34, 197, 94, 0.5), transparent)',
                                  maxHeight: '60px'
                                }}
                              />
                            </div>

                            {/* 右侧内容 */}
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

                        {/* 移动端布局 */}
                        <div className="md:hidden flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  border: '2px solid rgba(59, 130, 246, 0.5)',
                                  clipPath: clipPathRounded(3),
                                }}
                              />
                              <div
                                className="w-8 h-8 flex items-center justify-center"
                                style={{
                                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                  clipPath: clipPathRounded(2),
                                }}
                              >
                                <Heart className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div
                              className="mt-2 px-2 py-0.5 text-xs font-medium"
                              style={{ color: 'var(--accent-secondary)' }} whitespace-nowrap
                            >
                              {date}
                            </div>
                            <div
                              className="w-0.5 flex-1 min-h-[40px]"
                              style={{
                                background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.5), transparent)'
                              }}
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

                {/* 加载更多按钮 */}
                {notes.length > loadedCount && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-16 text-center"
                  >
                    <button
                      onClick={loadMoreNotes}
                      disabled={loadingMore}
                      className="px-8 py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: 'var(--accent-primary)',
                        clipPath: clipPathRounded(6),
                      }}
                    >
                      {loadingMore ? '加载中...' : '加载更多'}
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 使用共享 Footer 组件 */}
      {footerData && <Footer data={footerData} />}

      {/* 底部光剑 - 仅桌面端显示 */}
      {!isMobile && <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />}
    </div>
  );
}

const NoteCard = ({ note, index, align }: {
  note: Note;
  index: number;
  align: 'left' | 'right';
}) => {
  const currentMoodConfig = moodConfig[note.mood as Mood] || moodConfig.neutral;
  const MoodIcon = currentMoodConfig.icon;
  const [isHovered, setIsHovered] = useState(false);
  const color = currentMoodConfig.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ margin: '-50px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative mb-4 last:mb-0 group cursor-pointer"
    >
      {/* 像素风格卡片 */}
      <div
        className="relative p-5 overflow-hidden transition-all duration-300"
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: `2px solid ${isHovered ? color : 'rgba(255, 255, 255, 0.08)'}`,
          clipPath: clipPathRounded(6),
          transform: isHovered ? 'translateY(-4px)' : 'none',
        }}
      >
        {/* 四角发光效果 */}
        {isHovered && (
          <>
            <div className="absolute top-0 left-0 w-3 h-3">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-current to-transparent" style={{ color }} />
              <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-current to-transparent" style={{ color }} />
            </div>
            <div className="absolute top-0 right-0 w-3 h-3">
              <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-r from-transparent via-current to-transparent" style={{ color }} />
              <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-current to-transparent" style={{ color }} />
            </div>
          </>
        )}

        {/* 渐变光效 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${align === 'right' ? '100%' : '0%'} 0%, ${color}15, transparent 70%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0.3 }}
          transition={{ duration: 0.3 }}
        />

        {/* 扫光动画 */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}10 50%, transparent 60%)`,
          }}
          initial={{ x: '-100%' }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.8 }}
        />

        <div className="relative z-10">
          {/* 头部：心情标签和时间 */}
          <div className="flex items-center justify-between mb-3">
            <motion.div
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-2 px-2.5 py-1"
              style={{
                background: currentMoodConfig.bgColor,
                border: `1px solid ${color}30`,
                clipPath: clipPathRounded(2),
              }}
            >
              <MoodIcon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-xs font-medium" style={{ color }}>
                {currentMoodConfig.label}
              </span>
            </motion.div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {note.fullTime}
            </div>
          </div>

          {/* 标题 */}
          <h3 className="font-primary text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {note.title}
          </h3>

          {/* 内容 */}
          <p className="font-primary text-sm mb-3 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
            {note.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
