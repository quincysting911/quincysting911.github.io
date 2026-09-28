import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/layouts/MainLayout';
import NewsList from '@/components/NewsList';
import ChipGroup from '@/components/ChipGroup';
import SearchBar from '@/components/SearchBar';
import { ContentSource, NewsData, ServiceCategory } from '@/types/content';
import { CATEGORIES, LEVEL_TAGS, SOURCE_LABELS } from '@/utils/categories';
import { filterNews, NewsFilters, topServices } from '@/utils/filterNews';
import { loadNews } from '@/utils/loadNews';

interface HomeProps {
  newsData: NewsData;
}

const INITIAL_FILTERS: NewsFilters = { category: 'all', source: 'all', tags: [], query: '' };
const TOP_SERVICE_COUNT = 16;

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default function Home({ newsData }: HomeProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<NewsFilters>(INITIAL_FILTERS);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { items } = newsData;

  useEffect(() => {
    setLastUpdated(new Date(newsData.lastUpdated).toLocaleString());
  }, [newsData.lastUpdated]);

  // Restore filters from the URL (?tag=...&category=...&source=...) so filtered views are shareable.
  useEffect(() => {
    if (!router.isReady) return;
    const { tag, category, source } = router.query;
    setFilters((current) => ({
      ...current,
      tags: asArray(tag),
      category: CATEGORIES.some((c) => c.id === category) ? (category as ServiceCategory) : 'all',
      source: typeof source === 'string' && source in SOURCE_LABELS ? (source as ContentSource) : 'all',
    }));
  }, [router.isReady, router.query]);

  const updateFilters = (patch: Partial<NewsFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    const query: Record<string, string | string[]> = {};
    if (next.tags.length) query.tag = next.tags;
    if (next.category !== 'all') query.category = next.category;
    if (next.source !== 'all') query.source = next.source;
    router.replace({ pathname: '/', query }, undefined, { shallow: true, scroll: false });
  };

  const toggleTag = (tag: string) =>
    updateFilters({
      tags: filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag],
    });

  const filteredItems = useMemo(() => filterNews(items, filters), [items, filters]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => item.categories.forEach((c) => (counts[c] = (counts[c] || 0) + 1)));
    return counts;
  }, [items]);

  const levelCounts = useMemo(
    () => Object.fromEntries(LEVEL_TAGS.map((level) => [level, items.filter((i) => i.level === level).length])),
    [items]
  );

  const services = useMemo(() => topServices(items, TOP_SERVICE_COUNT), [items]);
  const sources = (Object.keys(SOURCE_LABELS) as ContentSource[]).filter((s) => newsData.sources?.[s]);
  const otherBlogCount = sources
    .filter((s) => s !== 'mlBlog' && s !== 'whatsNew')
    .reduce((sum, s) => sum + (newsData.sources?.[s] || 0), 0);
  const hasFilters =
    filters.category !== 'all' || filters.source !== 'all' || filters.tags.length > 0 || filters.query !== '';

  return (
    <>
      <Head>
        <title>AWS AI News Hub - Latest AWS AI/ML Updates</title>
        <meta
          name="description"
          content="Stay up-to-date with the latest AWS AI and machine learning service announcements, features, and updates"
        />
      </Head>

      <MainLayout>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-aws-navy mb-4">AWS AI News Hub</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The latest AWS AI and machine learning launches and blog posts, tagged with AWS&apos;s own
              service and level tags
            </p>
            {lastUpdated && <div className="mt-2 text-sm text-gray-500">Last updated: {lastUpdated}</div>}
          </div>

          <div className="mb-8">
            <SearchBar onSearch={(query) => updateFilters({ query })} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Updates', value: newsData.totalItems, source: 'all' as const },
              { label: 'AWS ML Blog', value: newsData.sources?.mlBlog || 0, source: 'mlBlog' as const },
              { label: "What's New", value: newsData.sources?.whatsNew || 0, source: 'whatsNew' as const },
              { label: 'Other AWS Blogs', value: otherBlogCount, source: null },
            ].map((stat) => {
              const content = (
                <>
                  <div className="text-2xl font-bold text-aws-orange">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </>
              );
              const tileClass = 'bg-white p-4 rounded-lg shadow-sm border text-left w-full';
              return stat.source ? (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => updateFilters({ source: stat.source })}
                  aria-pressed={filters.source === stat.source}
                  className={`${tileClass} transition-colors hover:border-aws-orange ${
                    filters.source === stat.source ? 'border-aws-orange' : 'border-gray-200'
                  }`}
                >
                  {content}
                </button>
              ) : (
                <div key={stat.label} className={`${tileClass} border-gray-200`}>
                  {content}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8 space-y-5">
            <ChipGroup
              title="Category"
              chips={[
                { id: 'all', label: 'All Updates', icon: '📰', count: items.length },
                ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon, count: categoryCounts[c.id] || 0 })),
              ]}
              isActive={(id) => filters.category === id}
              onToggle={(id) => updateFilters({ category: id as ServiceCategory | 'all' })}
            />
            <ChipGroup
              title="Source"
              chips={[
                { id: 'all', label: 'All Sources' },
                ...sources.map((s) => ({ id: s, label: SOURCE_LABELS[s], count: newsData.sources?.[s] })),
              ]}
              isActive={(id) => filters.source === id}
              onToggle={(id) => updateFilters({ source: id as ContentSource | 'all' })}
            />
            <ChipGroup
              title="Level"
              chips={LEVEL_TAGS.map((level) => ({ id: level, label: level, count: levelCounts[level] }))}
              isActive={(id) => filters.tags.includes(id)}
              onToggle={toggleTag}
            />
            <ChipGroup
              title="Top AWS Services"
              chips={services.map(([service, count]) => ({ id: service, label: service, count }))}
              isActive={(id) => filters.tags.includes(id)}
              onToggle={toggleTag}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4 text-gray-600">
            <span>
              Showing {filteredItems.length} of {items.length} updates
            </span>
            {filters.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-aws-orange text-white"
                aria-label={`Remove tag filter ${tag}`}
              >
                {tag} <span className="ml-1">×</span>
              </button>
            ))}
            {hasFilters && (
              <button
                type="button"
                onClick={() => updateFilters({ ...INITIAL_FILTERS, query: filters.query })}
                className="text-sm text-aws-orange hover:text-aws-navy underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <NewsList items={filteredItems} onTagClick={toggleTag} activeTags={filters.tags} />
        </div>
      </MainLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => ({
  props: { newsData: await loadNews() },
});
