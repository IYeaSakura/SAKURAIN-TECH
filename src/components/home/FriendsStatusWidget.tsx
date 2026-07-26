'use client';

/**
 * FriendsStatusWidget —— shows the size and diversity of the friends list.
 *
 * Reads /data/friends.json at runtime so the numbers stay in sync with
 * the content source.
 */

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useTranslation, useAnimationEnabled, useNavigation } from '@/hooks';

interface FriendData {
  categories: { id: string; name: string }[];
  friends: { category: string }[];
}

export function FriendsStatusWidget() {
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const [data, setData] = useState<FriendData | null>(null);

  useEffect(() => {
    fetch('/data/friends.json')
      .then((res) => res.json())
      .then((json: FriendData) => setData(json))
      .catch((error) => console.error('Failed to load friends data:', error));
  }, []);

  const counts = useMemo(() => {
    if (!data) return { total: 0, categories: 0 };
    return {
      total: data.friends.length,
      categories: data.categories.length,
    };
  }, [data]);

  return (
    <motion.button
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      onClick={() => navigateTo('/friends')}
      className="w-full h-full min-h-[120px] p-5 border-2 flex flex-col text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
        <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {t.widgets.friends}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-around">
        <div className="text-center">
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {counts.total}
          </div>
          <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
            {t.widgets.friendsTotal}
          </div>
        </div>
        <div
          className="w-px h-10"
          style={{ background: 'var(--border-subtle)' }}
        />
        <div className="text-center">
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {counts.categories}
          </div>
          <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
            {t.widgets.friendsCategories}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
