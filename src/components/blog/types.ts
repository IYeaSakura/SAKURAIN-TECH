export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  cover: string;
  featured: boolean;
  content?: string;
  readingTime?: string;
  wordCount?: number;
}

export interface BlogIndex {
  title: string;
  description: string;
  posts: BlogPost[];
}
