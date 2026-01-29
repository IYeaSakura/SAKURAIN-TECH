import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Code2, TrendingUp, Brain, Globe, Sparkles,
  ChevronRight, CheckCircle2
} from 'lucide-react';
import { SectionTitle } from '@/components/atoms';

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  achievements: string[];
  isFuture?: boolean;
}

interface TimelineData {
  title: string;
  subtitle: string;
  events: TimelineEvent[];
}

const iconMap: Record<string, typeof Rocket> = {
  Rocket,
  Code2,
  TrendingUp,
  Brain,
  Globe,
  Sparkles,
};

const colorMap: Record<string, string> = {
  blue: '#0E639C',
  green: '#6A9955',
  purple: '#9B59B6',
  cyan: '#4EC9B0',
  orange: '#CE9178',
  gold: '#D4A017',
};

const TimelineCard = memo(({
  event,
  index,
  isExpanded,
  onToggle,
}: {
  event: TimelineEvent;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const Icon = iconMap[event.icon] || Sparkles;
  const color = colorMap[event.color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative flex-shrink-0 w-80 md:w-96"
    >
      <motion.div
        className="relative p-6 mc-panel cursor-pointer h-full"
        whileHover={{ y: -8, scale: 1.02 }}
        onClick={onToggle}
      >
        {/* Year Badge */}
        <div
          className="absolute -top-3 left-6 px-4 py-1 rounded-full font-bold text-white"
          style={{
            background: event.isFuture ? 'linear-gradient(135deg, #D4A017, #FFD700)' : color,
            boxShadow: `0 0 15px ${color}40`,
          }}
        >
          {event.year}
        </div>

        {/* Icon */}
        <div
          className="absolute -top-3 right-6 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: color,
            boxShadow: `0 0 15px ${color}40`,
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="pt-4">
          <h3
            className="text-xl font-bold mb-3"
            style={{
              color: 'var(--text-primary)',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            {event.title}
          </h3>

          <p
            className="mb-4 text-sm"
            style={{
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            {event.description}
          </p>

          {/* Achievements */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 pt-4"
                style={{ borderTop: '2px solid var(--border-subtle)' }}
              >
                <h4
                  className="text-sm font-bold mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  关键成就
                </h4>
                {event.achievements.map((achievement, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <CheckCircle2
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color }}
                    />
                    <span className="text-sm">{achievement}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand Indicator */}
          <motion.div
            className="mt-4 flex items-center justify-center gap-2 text-sm"
            style={{ color: 'var(--text-muted)' }}
            animate={{ opacity: isExpanded ? 0 : 1 }}
          >
            <span>点击查看详情</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
});

TimelineCard.displayName = 'TimelineCard';

export const Timeline = memo(function Timeline({ data }: { data: TimelineData }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="timeline" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, var(--accent-primary) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, var(--accent-secondary) 0%, transparent 50%)
          `,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Timeline Container */}
        <div className="relative">
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide">
            {data.events.map((event, index) => (
              <div key={event.year} className="snap-start">
                <TimelineCard
                  event={event}
                  index={index}
                  isExpanded={expandedIndex === index}
                  onToggle={() => handleToggle(index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
