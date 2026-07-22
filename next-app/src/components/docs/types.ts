export interface TocItem {
  level: number;
  text: string;
  id: string;
  children: TocItem[];
}

export interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

export interface HeadingAnchor {
  level: number;
  text: string;
  id: string;
}

export interface ContentSection {
  heading: HeadingAnchor | null;
  content: string;
}

export interface SeriesChapter {
  id: string;
  title: string;
  description: string;
  path: string;
  order: number;
}

export interface DocSeries {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'series';
  chapters: Chapter[];
}

export interface SingleDoc {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'doc';
  path: string;
}

export type DocItem = DocSeries | SingleDoc;

export interface DocCategory {
  id: string;
  name: string;
  icon: string;
  items: DocItem[];
}

export interface DocsConfig {
  title: string;
  description: string;
  categories: DocCategory[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  path: string;
  order: number;
}

export interface IconMap {
  [key: string]: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}
