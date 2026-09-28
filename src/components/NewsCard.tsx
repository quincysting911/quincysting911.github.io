import Link from 'next/link';
import { NewsItem } from '@/types/content';
import { SOURCE_LABELS } from '@/utils/categories';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

interface NewsCardProps {
  item: NewsItem;
  /** When set, tag chips filter in place; otherwise they link to the home page filtered by that tag. */
  onTagClick?: (tag: string) => void;
  activeTags?: string[];
}

const SOURCE_COLORS: Record<string, string> = {
  mlBlog: 'bg-purple-100 text-purple-800',
  whatsNew: 'bg-blue-100 text-blue-800',
  newsBlog: 'bg-green-100 text-green-800',
};
const OTHER_SOURCE_COLOR = 'bg-gray-100 text-gray-700';

const LEVEL_COLORS: Record<string, string> = {
  'Foundational (100)': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Intermediate (200)': 'bg-sky-50 text-sky-800 border-sky-200',
  'Advanced (300)': 'bg-amber-50 text-amber-800 border-amber-300',
  'Expert (400)': 'bg-rose-50 text-rose-800 border-rose-200',
};

function TagChip({
  tag,
  className,
  active,
  onTagClick,
}: {
  tag: string;
  className: string;
  active: boolean;
  onTagClick?: (tag: string) => void;
}) {
  const classes = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
    active ? 'bg-aws-orange text-white border-aws-orange' : `${className} hover:border-aws-orange`
  }`;
  if (onTagClick) {
    return (
      <button type="button" className={classes} onClick={() => onTagClick(tag)} aria-pressed={active}>
        {tag}
      </button>
    );
  }
  return (
    <Link href={`/?tag=${encodeURIComponent(tag)}`} prefetch={false} className={classes}>
      {tag}
    </Link>
  );
}

export default function NewsCard({ item, onTagClick, activeTags = [] }: NewsCardProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }));
  }, [item.pubDate]);

  const otherTags = item.tags.filter((tag) => tag !== item.level && !item.services.includes(tag));

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_COLORS[item.source] || OTHER_SOURCE_COLOR}`}>
          {SOURCE_LABELS[item.source] || item.source}
        </span>
        {item.level && (
          <TagChip
            tag={item.level}
            className={LEVEL_COLORS[item.level] || 'bg-white text-gray-700 border-gray-300'}
            active={activeTags.includes(item.level)}
            onTagClick={onTagClick}
          />
        )}
        <time dateTime={item.pubDate} className="text-gray-500">
          {timeAgo}
        </time>
      </div>

      <h2 className="text-xl font-semibold text-aws-navy mb-1 hover:text-aws-orange transition-colors">
        <a href={item.link} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </h2>
      {item.authors.length > 0 && (
        <p className="text-sm text-gray-500 mb-2">by {item.authors.join(', ')}</p>
      )}

      <p className="text-gray-700 mb-4 line-clamp-3">{item.description}</p>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="AWS tags">
          {item.services.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              className="bg-aws-lightgray text-aws-navy border-transparent"
              active={activeTags.includes(tag)}
              onTagClick={onTagClick}
            />
          ))}
          {otherTags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              className="bg-white text-gray-600 border-gray-300"
              active={activeTags.includes(tag)}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-aws-orange hover:text-aws-navy font-medium transition-colors"
        >
          Read more
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </article>
  );
}
