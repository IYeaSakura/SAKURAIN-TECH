import { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Briefcase, Award, GraduationCap, Code2 } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';

interface TimelineEvent {
  id: number;
  year: string;
  title: string;
  description: string;
  type: 'work' | 'award' | 'education' | 'project';
}

interface TimelineData {
  title: string;
  subtitle: string;
  events: TimelineEvent[];
}

interface TimelineProps {
  data: TimelineData;
}

const iconMap: Record<string, typeof Briefcase> = {
  work: Briefcase,
  award: Award,
  education: GraduationCap,
  project: Code2,
};

const colorMap: Record<string, string> = {
  work: '#0E639C',
  award: '#CE9178',
  education: '#9B59B6',
  project: '#6A9955',
};

const getIcon = (type: string) => iconMap[type] || Briefcase;
const getColor = (type: string) => colorMap[type] || '#0E639C';

const TimelineItem = memo(({
  event,
  index,
  isLast,
}: {
  event: TimelineEvent;
  index: number;
  isLast: boolean;
}) => {
  const Icon = getIcon(event.type);
  const color = getColor(event.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative flex gap-6 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} md:flex-row`}
    >
      {/* Timeline Line */}
      {!isLast && (
        <div 
          className="absolute left-6 top-14 w-0.5 h-full hidden md:block"
          style={{ 
            background: 'linear-gradient(to bottom, var(--border-subtle), transparent)',
            height: 'calc(100% + 2rem)',
          }}
        />
      )}

      {/* Icon */}
      <div className="relative flex-shrink-0">
        <motion.div
          className="w-12 h-12 flex items-center justify-center"
          style={{
            background: color,
            border: '3px solid',
            borderColor: `color-mix(in srgb, ${color} 120%, white) color-mix(in srgb, ${color} 80%, black) color-mix(in srgb, ${color} 80%, black) color-mix(in srgb, ${color} 120%, white)`,
            boxShadow: `inset -2px -2px 0 color-mix(in srgb, ${color} 60%, black), inset 2px 2px 0 color-mix(in srgb, ${color} 120%, white), 0 0 15px ${color}40`,
          }}
          whileHover={{ scale: 1.1 }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 md:pb-12">
        <motion.div
          className="p-6 mc-panel"
          whileHover={{ y: -2 }}
        >
          {/* Year Badge */}
          <div 
            className="inline-flex items-center gap-2 mb-3 font-primary"
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: color,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '4px 12px',
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            <Calendar className="w-3 h-3" />
            {event.year}
          </div>

          {/* Title */}
          <h3 
            className="mb-2 font-primary"
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {event.title}
          </h3>

          {/* Description */}
          <p 
            className="font-primary"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}
          >
            {event.description}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
});

TimelineItem.displayName = 'TimelineItem';

export const Timeline = memo(function Timeline({ data }: TimelineProps) {
  return (
    <section id="timeline" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Timeline */}
        <div className="relative">
          {data.events.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              index={index}
              isLast={index === data.events.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
