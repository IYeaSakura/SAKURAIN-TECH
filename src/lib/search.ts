/**
 * Client-side full-text search engine for the unified site index.
 *
 * Loads public/data/search-index.json and performs lightweight tokenization,
 * field-weighted scoring and result grouping. No external search library is
 * required, keeping the bundle small.
 */

export type SearchDocumentType =
  | 'post'
  | 'note'
  | 'doc'
  | 'friend'
  | 'service'
  | 'page';

export interface SearchDocument {
  id: string;
  type: SearchDocumentType;
  title: string;
  description: string;
  content: string;
  href: string;
  date: string;
  tags: string[];
  category: string;
}

export interface SearchIndex {
  generatedAt: string;
  count: number;
  documents: SearchDocument[];
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  matches: string[];
  excerpt: string;
}

const FIELD_WEIGHTS: Record<string, number> = {
  title: 10,
  description: 5,
  tags: 6,
  category: 3,
  content: 2,
};

const EXCERPT_MAX_LENGTH = 120;
const MAX_RESULTS = 20;

let cachedIndex: SearchIndex | null = null;
let cachedPromise: Promise<SearchIndex> | null = null;

/**
 * Normalize a query or document field for case-insensitive matching.
 */
function normalize(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Tokenize mixed Chinese / English / numeric text.
 * - English words and numbers are split by non-alphanumeric characters.
 * - Chinese characters are emitted one by one so substring matches work.
 */
export function tokenize(text: string): string[] {
  const normalized = normalize(text);
  const tokens: string[] = [];
  const words = normalized.split(/[^\u4e00-\u9fa5a-z0-9]+/);
  for (const word of words) {
    if (!word) continue;
    if (/^[\u4e00-\u9fa5]+$/.test(word)) {
      // Emit bigrams for Chinese to improve phrase matching quality
      for (let i = 0; i < word.length; i++) {
        tokens.push(word[i]);
        if (i < word.length - 1) {
          tokens.push(word.slice(i, i + 2));
        }
      }
    } else {
      tokens.push(word);
    }
  }
  return tokens;
}

/**
 * Fetch the search index, caching it for the session.
 */
export async function loadSearchIndex(): Promise<SearchIndex> {
  if (cachedIndex) return cachedIndex;
  if (cachedPromise) return cachedPromise;

  cachedPromise = fetch('/data/search-index.json')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load search index: ${res.status}`);
      return res.json() as Promise<SearchIndex>;
    })
    .then((index) => {
      cachedIndex = index;
      return index;
    });

  return cachedPromise;
}

/**
 * Clear the in-memory search index cache.
 */
export function clearSearchIndexCache(): void {
  cachedIndex = null;
  cachedPromise = null;
}

function scoreField(text: string, queryTokens: string[]): number {
  if (!text || queryTokens.length === 0) return 0;
  const normalized = normalize(text);
  let score = 0;
  for (const token of queryTokens) {
    if (!token) continue;
    let index = normalized.indexOf(token);
    while (index !== -1) {
      score += 1;
      index = normalized.indexOf(token, index + token.length);
    }
  }
  return score;
}

/**
 * Exact-match scoring: the full query phrase must appear as a substring.
 * Scores are weighted higher than token matches to surface exact hits first.
 */
function scoreFieldExact(text: string, query: string): number {
  if (!text || !query) return 0;
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  let score = 0;
  let index = normalizedText.indexOf(normalizedQuery);
  while (index !== -1) {
    // Extra weight for matches at the beginning of the text.
    score += index === 0 ? 3 : 2;
    index = normalizedText.indexOf(normalizedQuery, index + normalizedQuery.length);
  }
  return score;
}

function buildExcerpt(text: string, queryTokens: string[], exactQuery?: string): string {
  if (!text) return '';
  const normalized = normalize(text);

  // In exact mode, locate the full query phrase.
  if (exactQuery && normalize(exactQuery)) {
    const normalizedQuery = normalize(exactQuery);
    const idx = normalized.indexOf(normalizedQuery);
    if (idx !== -1) {
      const start = Math.max(0, idx - 30);
      const end = Math.min(text.length, start + EXCERPT_MAX_LENGTH);
      let excerpt = text.slice(start, end).trim();
      if (start > 0) excerpt = '…' + excerpt;
      if (end < text.length) excerpt = excerpt + '…';
      const regex = new RegExp(
        `(${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        'gi'
      );
      return excerpt.replace(regex, '**$1**');
    }
  }

  if (queryTokens.length === 0) {
    return text.slice(0, EXCERPT_MAX_LENGTH).trimEnd() +
      (text.length > EXCERPT_MAX_LENGTH ? '…' : '');
  }

  // Find the first match position in the normalized text
  let firstIndex = -1;
  let longestToken = '';
  for (const token of queryTokens) {
    if (!token) continue;
    const idx = normalized.indexOf(token);
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
      longestToken = token;
    }
  }

  if (firstIndex === -1) {
    return text.slice(0, EXCERPT_MAX_LENGTH).trimEnd() +
      (text.length > EXCERPT_MAX_LENGTH ? '…' : '');
  }

  const start = Math.max(0, firstIndex - 30);
  const end = Math.min(text.length, start + EXCERPT_MAX_LENGTH);
  let excerpt = text.slice(start, end).trim();
  if (start > 0) excerpt = '…' + excerpt;
  if (end < text.length) excerpt = excerpt + '…';

  // Highlight the first matched token
  if (longestToken) {
    const regex = new RegExp(
      `(${longestToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    excerpt = excerpt.replace(regex, '**$1**');
  }

  return excerpt;
}

/**
 * Search the loaded index and return ranked results.
 */
export function searchIndex(
  index: SearchIndex,
  query: string,
  options?: { limit?: number; types?: SearchDocumentType[]; matchMode?: 'fuzzy' | 'exact' }
): SearchResult[] {
  if (!query.trim() || !index?.documents?.length) return [];

  const matchMode = options?.matchMode ?? 'fuzzy';
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const limit = options?.limit ?? MAX_RESULTS;
  const allowedTypes = new Set(options?.types);

  const results: SearchResult[] = [];

  for (const doc of index.documents) {
    if (allowedTypes.size > 0 && !allowedTypes.has(doc.type)) continue;

    let score = 0;
    if (matchMode === 'exact') {
      score += scoreFieldExact(doc.title, query) * FIELD_WEIGHTS.title;
      score += scoreFieldExact(doc.description, query) * FIELD_WEIGHTS.description;
      score += scoreFieldExact(doc.content, query) * FIELD_WEIGHTS.content;
      score += scoreFieldExact(doc.tags.join(' '), query) * FIELD_WEIGHTS.tags;
      score += scoreFieldExact(doc.category, query) * FIELD_WEIGHTS.category;
    } else {
      score += scoreField(doc.title, queryTokens) * FIELD_WEIGHTS.title;
      score += scoreField(doc.description, queryTokens) * FIELD_WEIGHTS.description;
      score += scoreField(doc.content, queryTokens) * FIELD_WEIGHTS.content;
      score += scoreField(doc.tags.join(' '), queryTokens) * FIELD_WEIGHTS.tags;
      score += scoreField(doc.category, queryTokens) * FIELD_WEIGHTS.category;
    }

    if (score <= 0) continue;

    const normalizedQuery = normalize(query);
    const matchedFields = matchMode === 'exact'
      ? [
          normalize(doc.title).includes(normalizedQuery) ? 'title' : '',
          normalize(doc.description).includes(normalizedQuery) ? 'description' : '',
          normalize(doc.content).includes(normalizedQuery) ? 'content' : '',
        ].filter(Boolean)
      : [
          normalize(doc.title).includes(queryTokens[0]) ? 'title' : '',
          normalize(doc.description).includes(queryTokens[0]) ? 'description' : '',
          normalize(doc.content).includes(queryTokens[0]) ? 'content' : '',
        ].filter(Boolean);

    const excerptSource =
      matchedFields.includes('description') && doc.description
        ? doc.description
        : matchedFields.includes('content') && doc.content
          ? doc.content
          : doc.description || doc.content || doc.title;

    results.push({
      document: doc,
      score,
      matches: queryTokens,
      excerpt: buildExcerpt(excerptSource, queryTokens, matchMode === 'exact' ? query : undefined),
    });
  }

  results.sort((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title));
  return results.slice(0, limit);
}

/**
 * Group search results by document type.
 */
export function groupResultsByType(
  results: SearchResult[]
): Record<SearchDocumentType, SearchResult[]> {
  const groups: Record<SearchDocumentType, SearchResult[]> = {
    post: [],
    note: [],
    doc: [],
    friend: [],
    service: [],
    page: [],
  };

  for (const result of results) {
    groups[result.document.type].push(result);
  }

  return groups;
}
