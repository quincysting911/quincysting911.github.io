import { ContentSource, NewsItem, ServiceCategory } from '@/types/content';

export interface NewsFilters {
  category: ServiceCategory | 'all';
  source: ContentSource | 'all';
  /** Every selected tag must be present on the item. */
  tags: string[];
  query: string;
}

export function filterNews(items: NewsItem[], filters: NewsFilters): NewsItem[] {
  const query = filters.query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (filters.category === 'all' || item.categories.includes(filters.category)) &&
      (filters.source === 'all' || item.source === filters.source) &&
      filters.tags.every((tag) => item.tags.includes(tag)) &&
      (!query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.authors.some((author) => author.toLowerCase().includes(query)))
  );
}

/** Most frequent AWS service tags, for quick filtering. */
export function topServices(items: NewsItem[], limit: number): Array<[string, number]> {
  const counts = new Map<string, number>();
  items.forEach((item) => item.services.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
