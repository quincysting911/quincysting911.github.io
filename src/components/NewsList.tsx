import { useEffect, useState } from 'react';
import NewsCard from '@/components/NewsCard';
import { NewsItem } from '@/types/content';

interface NewsListProps {
  items: NewsItem[];
  onTagClick?: (tag: string) => void;
  activeTags?: string[];
  pageSize?: number;
  emptyMessage?: string;
}

export default function NewsList({
  items,
  onTagClick,
  activeTags,
  pageSize = 25,
  emptyMessage = 'No updates found matching your criteria',
}: NewsListProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => setVisibleCount(pageSize), [items, pageSize]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
        <p className="text-gray-400 mt-2">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.slice(0, visibleCount).map((item) => (
        <NewsCard key={item.id} item={item} onTagClick={onTagClick} activeTags={activeTags} />
      ))}
      {visibleCount < items.length && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + pageSize)}
            className="px-6 py-3 rounded-lg bg-aws-navy text-white font-medium hover:bg-aws-squid transition-colors"
          >
            Show more ({items.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
