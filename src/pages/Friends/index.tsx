import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  Code, Palette, Wrench, BookOpen, Monitor, ArrowLeft, ExternalLink,
  Heart, Mail, Sparkles, Globe, Star
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import {
  MagneticCursor, VelocityCursor,
  TwinklingStars, FlowingGradient, LightBeam
} from '@/components/effects';
import { ThemeToggle } from '@/components/atoms';

// Theme type definition
type Theme = 'light' | 'dark';

// Icon mapping
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Code, Palette, Wrench, BookOpen, Monitor
};

// Types
interface FriendCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Friend {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  featured: boolean;
}

interface ApplyInfo {
  title: string;
  description: string;
  requirements: string[];
  contact: string;
}

interface FriendsData {
  title: string;
  subtitle: string;
  description: string;
  applyInfo: ApplyInfo;
  categories: FriendCategory[];
  friends: Friend[];
}

// Section Title Component
const SectionTitle = memo(function SectionTitle({
  title,
  subtitle,
  description
}: {
  title: string;
  subtitle: string;
  description?: string;
}) {
  return (
    <div className="text-center mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <Heart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtitle}
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-pixel text-4xl md:text-5xl lg:text-6xl mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </motion.h1>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
});

// Friend Card Component
const FriendCard = memo(function FriendCard({
  friend,
  index
}: {
  friend: Friend;
  index: number;
}) {
  return (
    <motion.a
      href={friend.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative block p-6 rounded-xl transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px var(--shadow-color)'
      }}
    >
      {/* Featured Badge */}
      {friend.featured && (
        <div
          className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'var(--accent-primary)',
            color: 'white'
          }}
        >
          <Star className="w-3 h-3" />
          精选
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <img
            src={friend.icon}
            alt={friend.name}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              // Fallback to globe icon if favicon fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement?.classList.add('fallback-icon');
            }}
          />
          <Globe
            className="w-8 h-8 fallback-icon hidden"
            style={{ color: 'var(--accent-primary)' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3
              className="font-bold text-lg truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {friend.name}
            </h3>
            <ExternalLink
              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--accent-primary)' }}
            />
          </div>
          <p
            className="text-sm line-clamp-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {friend.description}
          </p>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, transparent 50%)',
          opacity: 0.05
        }}
      />
    </motion.a>
  );
});

// Category Section Component
const CategorySection = memo(function CategorySection({
  category,
  friends,
  index
}: {
  category: FriendCategory;
  friends: Friend[];
  index: number;
}) {
  const IconComponent = iconMap[category.icon] || Globe;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="mb-16"
    >
      {/* Category Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <IconComponent
            className="w-6 h-6"
            style={{ color: 'var(--accent-primary)' }}
          />
        </div>
        <div>
          <h2
            className="font-pixel text-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {category.name}
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {category.description}
          </p>
        </div>
      </div>

      {/* Friends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends.map((friend, friendIndex) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            index={friendIndex}
          />
        ))}
      </div>
    </motion.section>
  );
});

// Apply Section Component
const ApplySection = memo(function ApplySection({
  applyInfo
}: {
  applyInfo: ApplyInfo;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-20 p-8 md:p-12 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles
              className="w-6 h-6"
              style={{ color: 'var(--accent-primary)' }}
            />
            <h2
              className="font-pixel text-2xl"
              style={{ color: 'var(--text-primary)' }}
            >
              {applyInfo.title}
            </h2>
          </div>
          <p
            className="mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            {applyInfo.description}
          </p>
          <ul className="space-y-2">
            {applyInfo.requirements.map((req, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--accent-primary)' }}
                />
                {req}
              </li>
            ))}
          </ul>
        </div>

        <a
          href={`mailto:${applyInfo.contact}`}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105"
          style={{
            background: 'var(--accent-primary)',
            color: 'white'
          }}
        >
          <Mail className="w-5 h-5" />
          联系我们
        </a>
      </div>
    </motion.section>
  );
});

// Navigation Header Component
const NavigationHeader = memo(function NavigationHeader({
  theme,
  onThemeToggle
}: {
  theme: Theme;
  onThemeToggle: (event: React.MouseEvent<HTMLElement>) => void;
}) {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 mc-navbar"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Back Button */}
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

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/image/logo.webp"
              alt="SAKURAIN"
              className="w-8 h-8 object-contain"
            />
            <span
              className="font-pixel text-xl hidden sm:block"
              style={{ color: 'var(--text-primary)' }}
            >
              SAKURAIN
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle
            theme={theme}
            onToggle={onThemeToggle}
            isTransitioning={false}
          />
        </div>
      </div>
    </motion.header>
  );
});

// Main Friends Page Component
export default function FriendsPage() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Load friends data
  useEffect(() => {
    fetch('/data/friends.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load friends data');
        return res.json();
      })
      .then((data: FriendsData) => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Group friends by category
  const friendsByCategory = data?.categories.map(category => ({
    category,
    friends: data.friends.filter(friend => friend.category === category.id)
  })) || [];

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
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

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <p style={{ color: 'var(--text-muted)' }} className="mb-4">
            {error || '无法加载友链数据'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: 'var(--accent-primary)' }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Global Effects */}
      <MagneticCursor />
      <VelocityCursor />

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden lg:block">
        <TwinklingStars
          count={35}
          color="var(--accent-primary)"
          secondaryColor="var(--accent-secondary)"
        />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0">
        <FlowingGradient
          colors={['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-tertiary)']}
          speed={15}
          opacity={0.05}
        />
      </div>

      <LightBeam position="top" color="var(--accent-primary)" intensity={0.3} />

      {/* Navigation */}
      <NavigationHeader
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <SectionTitle
            title={data.title}
            subtitle="友情链接"
            description={data.description}
          />

          {/* Featured Friends */}
          {data.friends.some(f => f.featured) && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-8">
                <Star
                  className="w-6 h-6"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <h2
                  className="font-pixel text-2xl"
                  style={{ color: 'var(--text-primary)' }}
                >
                  精选推荐
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.friends
                  .filter(f => f.featured)
                  .map((friend, index) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      index={index}
                    />
                  ))}
              </div>
            </motion.section>
          )}

          {/* Categories */}
          {friendsByCategory.map(({ category, friends }, index) => (
            friends.length > 0 && (
              <CategorySection
                key={category.id}
                category={category}
                friends={friends}
                index={index + 2}
              />
            )
          ))}

          {/* Apply Section */}
          <ApplySection applyInfo={data.applyInfo} />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative py-8"
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} SAKURAIN 技术工作室 · 用代码构建未来
          </p>
        </div>
      </footer>

      <LightBeam position="bottom" color="var(--accent-secondary)" intensity={0.2} />
    </div>
  );
}
