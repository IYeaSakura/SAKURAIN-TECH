import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';
import { SectionTitle } from '@/components/atoms';

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
  type: 'pie' | 'bar' | 'line';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative p-6 mc-panel"
      whileHover={{ y: -8, scale: 1.02 }}
    >
      {/* Icon */}
      <div
        className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: color,
          boxShadow: `0 0 20px ${color}60`,
        }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <div>
        <p
          className="text-sm mb-2"
          style={{ color: 'var(--text-muted)', fontWeight: 600 }}
        >
          {stat.title}
        </p>
        <div className="flex items-baseline gap-2 mb-2">
          <motion.span
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
            className="text-4xl font-bold"
            style={{
              color,
              fontWeight: 800,
              textShadow: `2px 2px 0 ${color}40`,
            }}
          >
            {stat.value}
          </motion.span>
          <span
            className="text-xl"
            style={{ color: 'var(--text-secondary)', fontWeight: 600 }}
          >
            {stat.unit}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {stat.description}
          </span>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
            className="text-sm font-bold px-2 py-1 rounded"
            style={{
              background: `${color}20`,
              color,
            }}
          >
            {stat.trend}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

const PieChart = memo(({ chart, index }: { chart: Chart; index: number }) => {
  const total = chart.data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="p-6 mc-panel"
    >
      <h3
        className="text-xl font-bold mb-6"
        style={{
          color: 'var(--text-primary)',
          fontWeight: 800,
          letterSpacing: '0.02em',
        }}
      >
        {chart.title}
      </h3>

      <div className="flex items-center gap-8">
        {/* Pie Chart */}
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
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
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="cursor-pointer hover:opacity-80"
                  whileHover={{ scale: 1.05 }}
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {chart.data.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 + 0.3 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-4 h-4 rounded"
                style={{ background: item.color }}
              />
              <div className="flex-1">
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.label}
                </span>
                <span
                  className="text-sm ml-2"
                  style={{ color: 'var(--text-muted)' }}
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
  const maxValue = Math.max(...chart.data.map((item) => item.value));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="p-6 mc-panel"
    >
      <h3
        className="text-xl font-bold mb-6"
        style={{
          color: 'var(--text-primary)',
          fontWeight: 800,
          letterSpacing: '0.02em',
        }}
      >
        {chart.title}
      </h3>

      <div className="space-y-4">
        {chart.data.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.label}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: item.color }}
              >
                {item.value}%
              </span>
            </div>
            <div className="h-8 rounded overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(item.value / maxValue) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: idx * 0.1 + 0.2 }}
              className="h-full rounded"
              style={{ background: item.color }}
            />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

BarChart.displayName = 'BarChart';

const LineChart = memo(({ chart, index }: { chart: Chart; index: number }) => {
  const maxValue = Math.max(...chart.data.map((item) => item.value));
  const points = chart.data.map((item, idx) => {
    const x = (idx / (chart.data.length - 1)) * 100;
    const y = 100 - (item.value / maxValue) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="p-6 mc-panel"
    >
      <h3
        className="text-xl font-bold mb-6"
        style={{
          color: 'var(--text-primary)',
          fontWeight: 800,
          letterSpacing: '0.02em',
        }}
      >
        {chart.title}
      </h3>

      <div className="relative h-48">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full border-t"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          ))}
        </div>

        {/* Line Chart */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full preserve-3d">
          <motion.path
            d={`M ${points}`}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}
          />

          {/* Data Points */}
          {chart.data.map((item, idx) => {
            const x = (idx / (chart.data.length - 1)) * 100;
            const y = 100 - (item.value / maxValue) * 80;
            return (
              <motion.circle
                key={idx}
                cx={x}
                cy={y}
                r="3"
                fill="var(--accent-primary)"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 + 0.5 }}
                className="cursor-pointer hover:scale-150"
                whileHover={{ r: 5 }}
              />
            );
          })}
        </svg>

        {/* X-axis Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {chart.data.map((item, idx) => (
            <span
              key={idx}
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

LineChart.displayName = 'LineChart';

export const StatsCharts = memo(function StatsCharts({ data }: { data: StatsChartsData }) {
  return (
    <section id="stats" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, var(--accent-primary) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, var(--accent-secondary) 0%, transparent 40%)
          `,
        }}
      />

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
            if (chart.type === 'line') return <LineChart key={chart.title} chart={chart} index={index} />;
            return null;
          })}
        </div>
      </div>
    </section>
  );
});
