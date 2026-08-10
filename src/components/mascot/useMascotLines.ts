'use client';

/**
 * useMascotLines — returns context-aware dialog lines for SAKU-CHAN.
 *
 * Lines are picked based on current page path, time of day, and a small
 * random pool so repeated clicks still feel lively.
 */

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

interface LineSet {
  default: string[];
  home: string[];
  blog: string[];
  projects: string[];
  about: string[];
  friends: string[];
  music: string[];
  earth: string[];
}

const LINES: Record<'en' | 'zh', LineSet> = {
  en: {
    default: [
      'Welcome back, creator!',
      'Need a shortcut? Click the island!',
      'I can walk around this page soon~',
      'Did you know I remember where you put me?',
      'Drag me anywhere you like!',
    ],
    home: [
      'Your dashboard looks cozy today.',
      'The map says you are here.',
      'Home sweet home.',
      'Try the search widget, it is fast!',
    ],
    blog: [
      'Reading time? I will keep you company.',
      'So many words, so little time.',
      'This post looks interesting!',
    ],
    projects: [
      'Building cool stuff again?',
      'Show me your latest creation!',
      'Code, compile, repeat.',
    ],
    about: [
      'This is the story of SAKURAIN.',
      'You are curious about the author.',
      'A handsome page, if I do say so myself.',
    ],
    friends: [
      'Friends make the web warmer.',
      'Say hi to everyone!',
      'I hope all links are green today.',
    ],
    music: [
      'Music makes coding better.',
      'Tap play and I will dance.',
      'Good vibes only.',
    ],
    earth: [
      'The world is wide.',
      'Where to next?',
      'I want to travel too!',
    ],
  },
  zh: {
    default: [
      '欢迎回来，创作者！',
      '需要快捷入口？点一下灵动岛~',
      '我很快就能在页面上走来走去啦',
      '我会记住你把我放在哪里哦',
      '把我拖到任何你喜欢的地方吧！',
    ],
    home: [
      '今天的主页看起来很舒适呢',
      '地图上说，你在这里',
      '回家的感觉真好',
      '试试搜索组件，很快的！',
    ],
    blog: [
      '阅读时间？我来陪你',
      '这么多文字，时间却不够',
      '这篇文章看起来很有意思！',
    ],
    projects: [
      '又要做酷炫的东西了吗？',
      '让我看看你最新的作品！',
      '编码、构建、重复。',
    ],
    about: [
      '这是 SAKURAIN 的故事',
      '你对作者很好奇呢',
      '这个页面挺帅气的，对吧',
    ],
    friends: [
      '友链让互联网更温暖',
      '向大家打个招呼吧！',
      '希望今天所有链接都是通的',
    ],
    music: [
      '音乐让写代码更快乐',
      '点播放，我会跟着跳舞',
      '只有好氛围',
    ],
    earth: [
      '世界很大',
      '下一站去哪里？',
      '我也想去旅行！',
    ],
  },
};

function getGreeting(hour: number, locale: 'en' | 'zh'): string {
  if (locale === 'zh') {
    if (hour < 6) return '深夜了，注意休息哦';
    if (hour < 11) return '早上好，今天准备做什么？';
    if (hour < 14) return '中午好，记得吃饭~';
    if (hour < 18) return '下午好，继续保持节奏';
    return '晚上好，今天辛苦了';
  }
  if (hour < 6) return 'It is late, get some rest.';
  if (hour < 11) return 'Good morning, what are we building?';
  if (hour < 14) return 'Good afternoon, do not skip lunch!';
  if (hour < 18) return 'Good afternoon, keep the momentum.';
  return 'Good evening, you worked hard today.';
}

function resolveContext(pathname: string): keyof LineSet {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/blog')) return 'blog';
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/friends')) return 'friends';
  if (pathname.startsWith('/music')) return 'music';
  if (pathname.startsWith('/earth-online')) return 'earth';
  return 'default';
}

export function useMascotLines(locale: 'en' | 'zh') {
  const pathname = usePathname();

  return useMemo(() => {
    const hour = new Date().getHours();
    const context = resolveContext(pathname);
    const set = LINES[locale][context];
    const greeting = getGreeting(hour, locale);

    return {
      greeting,
      pool: set,
      random: () => set[Math.floor(Math.random() * set.length)],
    };
  }, [pathname, locale]);
}
