'use client';

import { useEffect } from 'react';

/**
 * useScrollLock —— 弹层打开时彻底锁住页面滚动。
 *
 * 只设置 body.style.overflow 在部分浏览器里拦不住滚轮（真正滚动的是
 * <html>），所以这里两头都锁，并把当前滚动位置固定住，关闭后原样还原，
 * 避免弹层关掉时页面跳到顶部。
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };

    // 有滚动条时补上等宽内边距，避免锁定时布局横向抖动
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';

    // 兜底：滚轮/触摸滚动发生在弹层之外时直接拦掉，不依赖 overflow 生效
    const blockWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      // 弹层内部自己可滚动的区域放行
      if (target?.closest('[data-scroll-lock-passthrough]')) return;
      event.preventDefault();
    };
    const blockTouchMove = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-scroll-lock-passthrough]')) return;
      event.preventDefault();
    };

    window.addEventListener('wheel', blockWheel, { passive: false });
    window.addEventListener('touchmove', blockTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', blockWheel);
      window.removeEventListener('touchmove', blockTouchMove);
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overflow = prev.bodyOverflow;
      body.style.paddingRight = prev.bodyPaddingRight;
    };
  }, [active]);
}
