import { ServiceCategory } from '@/types/content';

interface ServiceFilterProps {
  selectedCategory: ServiceCategory | 'all';
  onCategoryChange: (category: ServiceCategory | 'all') => void;
  itemCounts: Record<string, number>;
}

const CATEGORIES: Array<{ id: ServiceCategory | 'all'; label: string; icon: string }> = [
  { id: 'all', label: 'All Updates', icon: '📰' },
  { id: 'generative-ai', label: 'Generative AI', icon: '🤖' },
  { id: 'machine-learning', label: 'Machine Learning', icon: '🧠' },
  { id: 'computer-vision', label: 'Computer Vision', icon: '👁️' },
  { id: 'natural-language', label: 'Natural Language', icon: '💬' },
  { id: 'speech', label: 'Speech AI', icon: '🎤' },
  { id: 'document-intelligence', label: 'Document Intelligence', icon: '📄' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'personalization', label: 'Personalization', icon: '🎯' },
  { id: 'specialized', label: 'Specialized', icon: '🛠️' },
];

export default function ServiceFilter({
  selectedCategory,
  onCategoryChange,
  itemCounts,
}: ServiceFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-aws-navy mb-4">Filter by Category</h3>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const count = category.id === 'all'
            ? Object.values(itemCounts).reduce((sum, count) => sum + count, 0)
            : itemCounts[category.id] || 0;

          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all
                ${
                  isSelected
                    ? 'bg-aws-orange text-white shadow-md'
                    : 'bg-aws-lightgray text-aws-navy hover:bg-gray-200'
                }
              `}
            >
              <span className="mr-2">{category.icon}</span>
              <span>{category.label}</span>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  isSelected ? 'bg-white bg-opacity-30' : 'bg-white'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}