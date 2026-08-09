'use client';

/**
 * DailyQuoteWidget — rotates a short quote based on the day of year.
 *
 * The outer chrome is provided by WidgetFrame on the homepage.
 */

import { useMemo } from 'react';
import { useTranslation } from '@/hooks';

const QUOTES = {
  en: [
    { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
    { text: 'Code is like humor. When you have to explain it, it’s bad.', author: 'Cory House' },
    { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
    { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
    { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
    { text: 'Any sufficiently advanced technology is indistinguishable from magic.', author: 'Arthur C. Clarke' },
    { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
  ],
  zh: [
    { text: '简单是终极的复杂。', author: '列奥纳多·达·芬奇' },
    { text: '代码如幽默，解释即失败。', author: 'Cory House' },
    { text: '先解决问题，再写代码。', author: 'John Johnson' },
    { text: '让它运行，让它正确，让它快速。', author: 'Kent Beck' },
    { text: '预测未来的最好方式是创造它。', author: 'Alan Kay' },
    { text: '任何足够先进的技术都与魔法无异。', author: '阿瑟·克拉克' },
    { text: '多说无益，给我看你的代码。', author: '林纳斯·托瓦兹' },
  ],
};

export function DailyQuoteWidget() {
  const { locale } = useTranslation();

  const quote = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const list = locale === 'zh' ? QUOTES.zh : QUOTES.en;
    return list[dayOfYear % list.length];
  }, [locale]);

  return (
    <div className="p-5 h-full min-h-[120px] flex flex-col justify-between" style={{ background: 'var(--bg-secondary)' }}>
      <div>
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-primary)' }}>
          “{quote.text}”
        </p>
        <p className="text-[10px] font-mono text-right" style={{ color: 'var(--text-muted)' }}>
          — {quote.author}
        </p>
      </div>
    </div>
  );
}
