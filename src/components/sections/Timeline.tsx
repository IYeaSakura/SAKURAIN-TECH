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
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative ${index % 2 === 0 ? 'md:mr-auto md:pr-12' : 'md:ml-auto md:pl-12'} w-full md:w-1/2`}
    >
      {/* Timeline Node */}
      <motion.div
        className={`absolute top-8 ${
          index % 2 === 0 ? 'md:right-0 md:translate-x-1/2' : 'md:left-0 md:-translate-x-1/2'
        } left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center z-10`}
        style={{
          background: event.isFuture ? 'transparent' : color,
          border: `3px solid ${color}`,
          boxShadow: `0 0 20px ${color}40`,
        }}
        whileHover={{ scale: 1.1 }}
      >
        {event.isFuture ? (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: color }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        ) : (
          <Icon className="w-8 h-8 text-white" />
        )}
      </motion.div>

      {/* Card */}
      <motion.div
        className={`relative p-6 mc-panel cursor-pointer ${
          index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
        }`}
        style={{
          marginTop: index % 2 === 0 ? '0' : '32px',
          marginBottom: index % 2 === 0 ? '32px' : '0',
        }}
        whileHover={{ y: -4 }}
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

        {/* Content */}
        <div className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <h3
              className="text-2xl font-bold"
              style={{
                color: 'var(--text-primary)',
                fontWeight: 800,
                letterSpacing: '0.02em',
              }}
            >
              {event.title}
            </h3>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight
                className="w-5 h-5 flex-shrink-0"
                style={{ color }}
              />
            </motion.div>
          </div>

          <p
            className="mb-4"
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
          {/* Center Line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 hidden md:block"
            style={{
              background: 'linear-gradient(to bottom, var(--accent-primary), var(--accent-secondary))',
              boxShadow: '0 0 10px var(--accent-glow)',
            }}
          />

          {/* Events */}
          <div className="space-y-0">
            {data.events.map((event, index) => (
              <TimelineCard
                key={event.year}
                event={event}
                index={index}
                isExpanded={expandedIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
