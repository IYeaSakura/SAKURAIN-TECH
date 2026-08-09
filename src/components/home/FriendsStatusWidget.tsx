'use client';

/**
 * FriendsStatusWidget — shows the size and diversity of the friends list.
 *
 * The outer chrome is provided by WidgetFrame on the homepage.
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation, useNavigation } from '@/hooks';

interface FriendData {
  categories: { id: string; name: string }[];
  friends: { category: string }[];
}

export function FriendsStatusWidget() {
  const { t } = useTranslation();
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
    <button
      onClick={() => navigateTo('/friends')}
      className="w-full h-full min-h-[100px] p-5 flex flex-col text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
      }}
      type="button"
    >
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
    </button>
  );
}
