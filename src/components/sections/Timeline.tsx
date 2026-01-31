import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Rocket, Code2, TrendingUp, Brain, Globe, Sparkles, ChevronDown } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import { AmbientGlow, FloatingBubbles, TwinklingStars, ConstellationEffect } from '@/components/effects';

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  achievements?: string[];
  isFuture?: boolean;
}

interface TimelineData {
  title: string;
  subtitle: string;
  events: TimelineEvent[];
}

interface TimelineProps {
  data: TimelineData;
}

const iconMap: Record<string, typeof Rocket> = {
  Rocket, Code2, TrendingUp, Brain, Globe, Sparkles,
};

const colorMap: Record<string, string> = {
  blue: '#3498DB', green: '#27AE60', purple: '#9B59B6',
  cyan: '#1ABC9C', orange: '#E67E22', gold: '#FFD700',
};

const getIcon = (iconName: string) => iconMap[iconName] || Rocket;
const getColor = (colorName: string) => colorMap[colorName] || '#3498DB';

export const Timeline = memo(function Timeline({ data }: TimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="timeline" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Ambient glow effects */}
      <AmbientGlow position="center" color="var(--accent-primary)" size={400} opacity={0.1} />
      <AmbientGlow position="top-right" color="var(--accent-secondary)" size={350} opacity={0.08} />
      <AmbientGlow position="bottom-left" color="var(--accent-tertiary)" size={300} opacity={0.06} />
      
      {/* 浮动气泡 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <FloatingBubbles count={10} colors={['var(--accent-primary)', 'var(--accent-secondary)']} />
      </div>
      
      {/* 闪烁星星 */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <TwinklingStars count={25} color="var(--accent-primary)" />
      </div>
      
      {/* 星座连线 */}
      <div className="absolute inset-0 pointer-events-none opacity-15 hidden lg:block">
        <ConstellationEffect count={12} connectionDistance={140} color="var(--accent-secondary)" />
      </div>
      
      {/* Center Line - Desktop Only */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {/* Main line */}
        <div className="absolute top-0 left-1/2 w-px h-full -translate-x-1/2"
          style={{ 
            background: 'linear-gradient(to bottom, transparent, var(--accent-primary) 20%, var(--accent-primary) 80%, transparent)',
            boxShadow: '0 0 10px var(--accent-glow)',
          }}
        />
        {/* Animated pulse */}
        <motion.div 
          className="absolute left-1/2 w-1 h-20 -translate-x-1/2"
          style={{ 
            background: 'linear-gradient(to bottom, transparent, var(--accent-primary), transparent)',
            filter: 'blur(2px)',
          }}
          animate={{ 
            top: ['0%', '100%'],
            opacity: [0, 1, 0],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title={data.title} subtitle={data.subtitle} />

        {/* Timeline */}
        <div className="relative">
          {data.events.map((event, index) => {
            const Icon = getIcon(event.icon);
            const color = getColor(event.color);
            const isLeft = index % 2 === 0;
            const isExpanded = expandedIndex === index;

            return (
              <div key={event.year} className="relative mb-8 last:mb-0">
                {/* Desktop: Alternating Layout */}
                <div className="hidden md:block">
                  <div className="relative flex items-start min-h-[200px]">
                    {/* Left Content */}
                    <div className="w-[calc(50%-40px)]">
                      {isLeft && (
                        <motion.div
                          initial={{ opacity: 0, x: -50 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ margin: '-50px' }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="text-right"
                        >
                          <TimelineCard 
                            event={event} 
                            color={color} 
                            isExpanded={isExpanded} 
                            onToggle={() => handleToggle(index)}
                            align="right"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Center Node */}
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-20 flex flex-col items-center">
                      {/* Line to top */}
                      {index > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-8"
                          style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
                        />
                      )}
                      
                      {/* Node */}
                      <motion.div
                        className="relative w-14 h-14 flex items-center justify-center cursor-pointer"
                        onClick={() => handleToggle(index)}
                        whileHover={{ scale: 1.1 }}
                      >
                        {isExpanded && (
                          <motion.div className="absolute inset-0 rounded-full"
                            style={{ border: `2px solid ${color}` }}
                            initial={{ scale: 1, opacity: 0.8 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                        <div className="absolute inset-0 rounded-full"
                          style={{ background: `${color}20`, border: `2px solid ${color}` }}
                        />
                        <motion.div 
                          className="w-10 h-10 rounded-full flex items-center justify-center relative"
                          style={{ 
                            background: color, 
                            boxShadow: `0 0 20px ${color}80, 0 0 40px ${color}40`,
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {/* Glow ring */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              border: `2px solid ${color}`,
                            }}
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <Icon className="w-5 h-5 text-white relative z-10" />
                        </motion.div>
                      </motion.div>

                      {/* Line to bottom */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-full"
                        style={{ background: `linear-gradient(to bottom, ${color}, transparent)`, maxHeight: '60px' }}
                      />
                    </div>

                    {/* Right Content */}
                    <div className="w-[calc(50%-40px)] ml-auto">
                      {!isLeft && (
                        <motion.div
                          initial={{ opacity: 0, x: 50 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ margin: '-50px' }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <TimelineCard 
                            event={event} 
                            color={color} 
                            isExpanded={isExpanded} 
                            onToggle={() => handleToggle(index)}
                            align="left"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile: Vertical Layout */}
                <div className="md:hidden flex gap-4">
                  {/* Node & Year */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full"
                        style={{ background: `${color}20`, border: `2px solid ${color}` }}
                      />
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: color }}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <span className="mt-2 text-xs font-bold" style={{ color }}>{event.year}</span>
                    {/* Line */}
                    <div className="w-0.5 flex-1 min-h-[40px]"
                      style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }}
                    />
                  </div>

                  {/* Card */}
                  <div className="flex-1 pb-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ margin: '-50px' }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <TimelineCard 
                        event={event} 
                        color={color} 
                        isExpanded={isExpanded} 
                        onToggle={() => handleToggle(index)}
                        align="left"
                        isMobile
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ margin: '-50px' }}
          className="mt-8 text-center font-primary text-sm text-[var(--text-muted)]"
        >
          点击时间节点或卡片查看详细信息
        </motion.p>
      </div>
    </section>
  );
});

// Card Component
const TimelineCard = memo(({
  event, color, isExpanded, onToggle, align, isMobile = false,
}: {
  event: TimelineEvent; color: string; isExpanded: boolean; onToggle: () => void;
  align: 'left' | 'right'; isMobile?: boolean;
}) => {
  return (
    <motion.div
      className="relative cursor-pointer"
      onClick={onToggle}
      whileHover={{ y: -4 }}
    >
      <div className="relative p-5 rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: `2px solid ${isExpanded ? color : 'var(--border-subtle)'}`,
          boxShadow: isExpanded ? `0 20px 40px -10px ${color}40` : '0 4px 20px -5px rgba(0,0,0,0.2)',
        }}
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${align === 'right' ? '100%' : '0%'} 0%, ${color}20, transparent 70%)`,
            opacity: isExpanded ? 1 : 0.5,
          }}
        />

        {/* Year Badge - Desktop */}
        {!isMobile && (
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <Calendar className="w-3 h-3" style={{ color }} />
            <span className="font-primary text-xs font-bold" style={{ color }}>{event.year}</span>
            {event.isFuture && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">未来</span>}
          </div>
        )}

        {/* Title */}
        <h3 className="font-primary text-xl font-black mb-2 text-[var(--text-primary)]">{event.title}</h3>

        {/* Description */}
        <p className="font-primary text-sm mb-3 text-[var(--text-secondary)] leading-relaxed">{event.description}</p>

        {/* Expand Indicator */}
        <div className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
          <span>{isExpanded ? '收起' : '详情'}</span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}><ChevronDown className="w-4 h-4" /></motion.div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && event.achievements && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t" style={{ borderColor: `${color}30` }}>
                <h4 className="font-primary text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>主要成就</h4>
                <ul className="space-y-2">
                  {event.achievements.map((achievement, idx) => (
                    <motion.li key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-2"
                    >
                      <span style={{ color }}>▸</span>
                      <span className="font-primary text-sm text-[var(--text-secondary)]">{achievement}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

TimelineCard.displayName = 'TimelineCard';
