import { memo, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';
import { AnimatedCounter, AmbientGlow } from '@/components/effects';

interface StatItem {
  title: string;
  value: number;
  unit: string;
  color: string;
  description: string;
  trend: string;
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface Chart {
  title: string;
  type: 'pie' | 'bar' | 'radar' | 'heatmap';
  data: ChartData[];
}

interface StatsChartsData {
  title: string;
  subtitle: string;
  stats: StatItem[];
  charts: Chart[];
}

const colorMap: Record<string, string> = {
  blue: '#0E639C',
  green: '#6A9955',
  purple: '#9B59B6',
  cyan: '#4EC9B0',
  orange: '#CE9178',
  gold: '#D4A017',
};

const iconMap: Record<string, typeof TrendingUp> = {
  blue: TrendingUp,
  green: Award,
  purple: Target,
  cyan: Zap,
};

const StatCard = memo(({ stat, index }: { stat: StatItem; index: number }) => {
  const Icon = iconMap[stat.color] || TrendingUp;
  const color = colorMap[stat.color] || colorMap.blue;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: '-100px' });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const rotateX = useSpring(mouseY, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(mouseX, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -30 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
      }}
      className="relative p-6 mc-panel"
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Icon with floating animation */}
        <motion.div
          className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: color,
            boxShadow: `0 0 20px ${color}60`,
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.2, rotate: 360 }}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>

        {/* Content */}
        <div>
          <motion.p
            className="text-sm mb-2 font-primary text-label"
            style={{ color: 'var(--text-muted)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            {stat.title}
          </motion.p>
          
          <div className="flex items-baseline gap-2 mb-2">
            <AnimatedCounter
              value={stat.value}
              suffix={stat.unit}
              className="font-primary text-4xl font-extrabold"
              style={{
                color,
                textShadow: `2px 2px 0 ${color}40`,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span
              className="font-primary text-body-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {stat.description}
            </span>
            <motion.span
              initial={{ opacity: 0, x: -10, scale: 0.8 }}
              animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.1 + 0.4,
                type: 'spring',
                stiffness: 200,
              }}
              className="font-primary text-caption"
              style={{
                background: `${color}20`,
                color,
                padding: '4px 8px',
                fontWeight: 700,
              }}
              whileHover={{ scale: 1.1 }}
            >
              {stat.trend}
            </motion.span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

const PieChart = memo(({ chart, index }: { chart: Chart; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: '-100px' });
  const total = chart.data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.2,
        type: 'spring',
        stiffness: 100,
      }}
      className="p-6 mc-panel"
      whileHover={{ y: -5 }}
    >
      <h3
        className="mb-6 font-primary"
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
        }}
      >
        {chart.title}
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Pie Chart */}
        <motion.div 
          className="relative w-56 h-56 md:w-64 md:h-64"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            {chart.data.map((item, idx) => {
              const angle = (item.value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle += angle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);

              const largeArcFlag = angle > 180 ? 1 : 0;

              return (
                <motion.path
                  key={idx}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.1 + 0.3 }}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.05, opacity: 0.8 }}
                />
              );
            })}
          </svg>
        </motion.div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {chart.data.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: idx * 0.1 + 0.3 }}
              className="flex items-center gap-3"
              whileHover={{ x: 5 }}
            >
              <motion.div
                className="w-4 h-4 rounded"
                style={{ background: item.color }}
                whileHover={{ scale: 1.3, rotate: 180 }}
                transition={{ duration: 0.3 }}
              />
              <div className="flex-1">
                <span
                  className="font-primary"
                  style={{ 
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.label}
                </span>
                <span
                  className="font-primary ml-2"
                  style={{ 
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                  }}
                >
                  {item.value}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

PieChart.displayName = 'PieChart';

const BarChart = memo(({ chart, index }: { chart: Chart; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: '-100px' });
  const maxValue = Math.max(...chart.data.map((item) => item.value));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, x: 50 }}
      animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.2,
        type: 'spring',
        stiffness: 100,
      }}
      className="p-6 mc-panel"
      whileHover={{ y: -5 }}
    >
      <h3
        className="mb-6 font-primary"
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
        }}
      >
        {chart.title}
      </h3>

      <div className="space-y-5">
        {chart.data.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span
                className="font-primary"
                style={{ 
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {item.label}
              </span>
              <motion.span
                className="font-primary"
                style={{ 
                  fontSize: 'var(--text-sm)',
                  fontWeight: 800,
                  color: item.color,
                }}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: idx * 0.1 + 0.5 }}
              >
                <AnimatedCounter value={item.value} suffix="%" />
              </motion.span>
            </div>
            <div 
              className="h-10 rounded-full overflow-hidden" 
              style={{ background: 'var(--bg-secondary)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: `${(item.value / maxValue) * 100}%` } : {}}
                transition={{ duration: 1, delay: idx * 0.1 + 0.2, ease: 'easeOut' }}
                className="h-full rounded-full relative"
                style={{ background: item.color }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

BarChart.displayName = 'BarChart';

export const StatsCharts = memo(function StatsCharts({ data }: { data: StatsChartsData }) {
  return (
    <section id="stats" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, var(--accent-primary) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, var(--accent-secondary) 0%, transparent 40%)
          `,
          opacity: 0.05,
        }}
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Ambient glow effects */}
      <AmbientGlow position="top-left" color="var(--accent-primary)" size={400} opacity={0.1} />
      <AmbientGlow position="bottom-right" color="var(--accent-secondary)" size={300} opacity={0.08} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={data.title}
          subtitle={data.subtitle}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {data.stats.map((stat, index) => (
            <StatCard key={stat.title} stat={stat} index={index} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.charts.map((chart, index) => {
            if (chart.type === 'pie') return <PieChart key={chart.title} chart={chart} index={index} />;
            if (chart.type === 'bar') return <BarChart key={chart.title} chart={chart} index={index} />;
            return null;
          })}
        </div>
      </div>
    </section>
  );
});
