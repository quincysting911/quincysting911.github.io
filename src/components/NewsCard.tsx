import { NewsItem } from '@/types/content';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

interface NewsCardProps {
  item: NewsItem;
}

const SOURCE_LABELS: Record<string, string> = {
  'whats-new': "What's New",
  'ml-blog': 'ML Blog',
  'news-blog': 'News Blog',
  'security-blog': 'Security Blog',
};

const SOURCE_COLORS: Record<string, string> = {
  'whats-new': 'bg-blue-100 text-blue-800',
  'ml-blog': 'bg-purple-100 text-purple-800',
  'news-blog': 'bg-green-100 text-green-800',
  'security-blog': 'bg-red-100 text-red-800',
};

export default function NewsCard({ item }: NewsCardProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }));
  }, [item.pubDate]);

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-aws-navy mb-1 hover:text-aws-orange transition-colors">
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        </h2>
        <div className="text-sm text-gray-500 mb-2">
          {timeAgo}
        </div>
        <div className="mb-1">
          <span className={`px-2 py-1 rounded text-xs font-medium ${SOURCE_COLORS[item.source]}`}>
            {SOURCE_LABELS[item.source]}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 line-clamp-3">{item.description}</p>

      {/* Services & Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {item.services.slice(0, 5).map((service) => (
          <span
            key={service}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-aws-lightgray text-aws-navy"
          >
            {service}
          </span>
        ))}
        {item.services.length > 5 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            +{item.services.length - 5} more
          </span>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-600 border border-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Read More Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-aws-orange hover:text-aws-navy font-medium transition-colors"
        >
          Read more
          <svg
            className="ml-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </a>
      </div>
    </article>
  );
}