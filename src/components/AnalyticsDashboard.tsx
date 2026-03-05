import { useEffect, useState } from 'react';
import { 
  Activity, 
  Users, 
  Eye, 
  Globe, 
  Monitor, 
  Smartphone,
  TrendingUp,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface StatsData {
  date: string;
  totalVisits: number;
  uniqueVisitors: number;
  hourly: number[];
  topPages: [string, number][];
  browsers: Record<string, number>;
  os: Record<string, number>;
  countries: Record<string, number>;
}

interface RealtimeData {
  active: number;
  recent: any[];
}

const COLORS = ['#007acc', '#89d185', '#ffcc00', '#f14c4c', '#75beff'];

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<StatsData[]>([]);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRealtime();
    
    // 每30秒更新实时数据
    const interval = setInterval(fetchRealtime, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics?type=stats&days=7');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtime = async () => {
    try {
      // 同时发送追踪请求
      await fetch('/api/analytics', { method: 'POST' });
      
      const res = await fetch('/api/analytics?type=realtime');
      const data = await res.json();
      if (data.success) {
        setRealtime(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch realtime:', e);
    }
  };

  const totalVisits = stats.reduce((sum, s) => sum + s.totalVisits, 0);
  const totalVisitors = stats.reduce((sum, s) => sum + s.uniqueVisitors, 0);
  
  // 图表数据
  const chartData = stats.map(s => ({
    date: s.date.slice(5),
    visits: s.totalVisits,
    visitors: s.uniqueVisitors,
  }));

  // 合并所有天的浏览器数据
  const browserData = stats.reduce((acc, s) => {
    Object.entries(s.browsers || {}).forEach(([k, v]) => {
      acc[k] = (acc[k] || 0) + v;
    });
    return acc;
  }, {} as Record<string, number>);

  const browserChartData = Object.entries(browserData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // 合并所有天的国家数据
  const countryData = stats.reduce((acc, s) => {
    Object.entries(s.countries || {}).forEach(([k, v]) => {
      acc[k] = (acc[k] || 0) + v;
    });
    return acc;
  }, {} as Record<string, number>);

  const countryChartData = Object.entries(countryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted font-mono">加载中...⌛</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold flex items-center gap-3">
          <Activity className="text-accent" />
          网站分析仪表盘
        </h1>
        {realtime && (
          <div className="flex items-center gap-2 text-success font-mono">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            在线: {realtime.active}
          </div>
        )}
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Eye} 
          label="总访问" 
          value={totalVisits.toLocaleString()} 
          color="accent"
        />
        <StatCard 
          icon={Users} 
          label="独立访客" 
          value={totalVisitors.toLocaleString()} 
          color="success"
        />
        <StatCard 
          icon={Globe} 
          label="国家/地区" 
          value={Object.keys(countryData).length} 
          color="warning"
        />
        <StatCard 
          icon={Monitor} 
          label="浏览器类型" 
          value={Object.keys(browserData).length} 
          color="info"
        />
      </div>

      {/* 访问趋势图 */}
      <div className="brutalist-card">
        <h2 className="text-xl font-mono font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          访问趋势 (7天)
        </h2>        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-muted)"
                fontSize={12}
                fontFamily="var(--font-mono)"
              />
              <YAxis 
                stroke="var(--text-muted)"
                fontSize={12}
                fontFamily="var(--font-mono)"
              />
              <Tooltip 
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '3px solid var(--border-thick)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="visits" 
                stroke="var(--accent)" 
                strokeWidth={3}
                dot={{ fill: 'var(--accent)', strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="visitors" 
                stroke="var(--success)" 
                strokeWidth={3}
                dot={{ fill: 'var(--success)', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 浏览器分布 & 地区分布 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="brutalist-card">
          <h2 className="text-xl font-mono font-bold mb-4">浏览器分布</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={browserChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {browserChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '3px solid var(--border-thick)',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brutalist-card">
          <h2 className="text-xl font-mono font-bold mb-4">地区分布</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                />
                <YAxis 
                  stroke="var(--text-muted)"
                  fontSize={12}
                  fontFamily="var(--font-mono)"
                />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '3px solid var(--border-thick)',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <Bar dataKey="value" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 实时访问 */}
      {realtime?.recent && realtime.recent.length > 0 && (
        <div className="brutalist-card">
          <h2 className="text-xl font-mono font-bold mb-4 flex items-center gap-2">
            <Clock size={20} />
            最近访问
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {realtime.recent.map((visit, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-3 bg-bg-secondary border-2 border-border"
              >
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-text-muted" />
                  <span className="font-mono text-sm">{visit.country}</span>
                  <span className="text-text-muted text-sm">{visit.browser}</span>
                </div>
                <span className="text-text-muted text-xs font-mono">
                  {new Date(visit.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 统计卡片组件
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color: 'accent' | 'success' | 'warning' | 'info';
}) {
  const colorMap = {
    accent: 'border-accent text-accent',
    success: 'border-success text-success',
    warning: 'border-warning text-warning',
    info: 'border-info text-info',
  };

  return (
    <div className={`brutalist-card border-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-3">
        <Icon size={24} />
        <div>
          <div className="text-2xl font-mono font-bold">{value}</div>
          <div className="text-xs text-text-muted uppercase">{label}</div>
        </div>
      </div>
    </div>
  );
}
