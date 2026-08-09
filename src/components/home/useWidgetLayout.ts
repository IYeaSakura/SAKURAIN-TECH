'use client';

/**
 * useWidgetLayout — persistent order, pin and collapse state for homepage widgets.
 *
 * Layout is stored in localStorage so returning visitors keep their dashboard
 * arrangement. Defaults are kept hard-coded to keep the first paint stable.
 */

import { useCallback, useEffect, useState } from 'react';

export type WidgetId =
  | 'map'
  | 'recent-posts'
  | 'recent-devlog'
  | 'music'
  | 'calendar'
  | 'search'
  | 'daily-quote'
  | 'friends-status'
  | 'language-stats';

const LAYOUT_STORAGE_KEY = 'sakurain-home-layout';

const DEFAULT_ORDER: WidgetId[] = [
  'map',
  'recent-posts',
  'recent-devlog',
  'music',
  'calendar',
  'search',
  'daily-quote',
  'friends-status',
  'language-stats',
];

interface LayoutState {
  order: WidgetId[];
  pinned: Set<WidgetId>;
  collapsed: Set<WidgetId>;
}

function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return { order: DEFAULT_ORDER, pinned: new Set(), collapsed: new Set() };
    const parsed = JSON.parse(raw) as {
      order?: WidgetId[];
      pinned?: WidgetId[];
      collapsed?: WidgetId[];
    };
    const order = parsed.order?.length ? parsed.order : DEFAULT_ORDER;
    return {
      order,
      pinned: new Set(parsed.pinned ?? []),
      collapsed: new Set(parsed.collapsed ?? []),
    };
  } catch {
    return { order: DEFAULT_ORDER, pinned: new Set(), collapsed: new Set() };
  }
}

function saveLayout(state: LayoutState) {
  try {
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({
        order: state.order,
        pinned: Array.from(state.pinned),
        collapsed: Array.from(state.collapsed),
      })
    );
  } catch {
    // Ignore storage errors (e.g. private browsing).
  }
}

export function useWidgetLayout() {
  const [order, setOrder] = useState<WidgetId[]>(DEFAULT_ORDER);
  const [pinned, setPinned] = useState<Set<WidgetId>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<WidgetId>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const state = loadLayout();
    setOrder(state.order);
    setPinned(state.pinned);
    setCollapsed(state.collapsed);
    setHydrated(true);
  }, []);

  const persist = useCallback(
    (next: Partial<LayoutState>) => {
      const state: LayoutState = {
        order: next.order ?? order,
        pinned: next.pinned ?? pinned,
        collapsed: next.collapsed ?? collapsed,
      };
      saveLayout(state);
    },
    [order, pinned, collapsed]
  );

  const moveWidget = useCallback(
    (sourceId: string, targetId: string) => {
      const source = sourceId as WidgetId;
      const target = targetId as WidgetId;
      setOrder((prev) => {
        const sourceIndex = prev.indexOf(source);
        const targetIndex = prev.indexOf(target);
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prev;
        const next = [...prev];
        next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, source);
        persist({ order: next });
        return next;
      });
    },
    [persist]
  );

  const togglePin = useCallback(
    (id: string) => {
      const widgetId = id as WidgetId;
      setPinned((prev) => {
        const next = new Set(prev);
        if (next.has(widgetId)) next.delete(widgetId);
        else next.add(widgetId);
        persist({ pinned: next });
        return next;
      });
    },
    [persist]
  );

  const toggleCollapse = useCallback(
    (id: string) => {
      const widgetId = id as WidgetId;
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(widgetId)) next.delete(widgetId);
        else next.add(widgetId);
        persist({ collapsed: next });
        return next;
      });
    },
    [persist]
  );

  const resetLayout = useCallback(() => {
    const state: LayoutState = {
      order: DEFAULT_ORDER,
      pinned: new Set(),
      collapsed: new Set(),
    };
    setOrder(state.order);
    setPinned(state.pinned);
    setCollapsed(state.collapsed);
    saveLayout(state);
  }, []);

  return {
    order,
    pinned,
    collapsed,
    hydrated,
    moveWidget,
    togglePin,
    toggleCollapse,
    resetLayout,
  };
}
