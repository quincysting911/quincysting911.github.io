import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import MainLayout from '@/layouts/MainLayout';
import NewsCard from '@/components/NewsCard';
import ServiceFilter from '@/components/ServiceFilter';
import SearchBar from '@/components/SearchBar';
import { NewsData, NewsItem, ServiceCategory } from '@/types/content';
import fs from 'fs';
import path from 'path';

interface HomeProps {
  newsData: NewsData;
}

export default function Home({ newsData }: HomeProps) {
  const [filteredItems, setFilteredItems] = useState<NewsItem[]>(newsData.items);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date(newsData.lastUpdated).toLocaleString());
  }, [newsData.lastUpdated]);

  const handleCategoryFilter = (category: ServiceCategory | 'all') => {
    setSelectedCategory(category);
    filterItems(category, searchQuery);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterItems(selectedCategory, query);
  };

  const filterItems = (category: ServiceCategory | 'all', query: string) => {
    let items = newsData.items;

    // Filter by category
    if (category !== 'all') {
      items = items.filter((item) => item.categories.includes(category));
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery) ||
          item.services.some((service) => service.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredItems(items);
  };

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
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-aws-navy mb-4">
              AWS AI News Hub
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Your central source for the latest AWS artificial intelligence and machine learning
              service announcements, features, and updates
            </p>
            {lastUpdated && (
              <div className="mt-2 text-sm text-gray-500">
                Last updated: {lastUpdated}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Service Filter */}
          <div className="mb-8">
            <ServiceFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryFilter}
              itemCounts={newsData.items.reduce((acc, item) => {
                item.categories.forEach((cat) => {
                  acc[cat] = (acc[cat] || 0) + 1;
                });
                return acc;
              }, {} as Record<string, number>)}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-aws-orange">{newsData.totalItems}</div>
              <div className="text-sm text-gray-600">Total Updates</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-aws-orange">
                {newsData.sources?.['whats-new'] || 0}
              </div>
              <div className="text-sm text-gray-600">What&apos;s New</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-aws-orange">
                {newsData.sources?.['ml-blog'] || 0}
              </div>
              <div className="text-sm text-gray-600">ML Blog Posts</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-aws-orange">
                {newsData.sources?.['news-blog'] || 0}
              </div>
              <div className="text-sm text-gray-600">News Articles</div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-gray-600">
            Showing {filteredItems.length} of {newsData.items.length} updates
          </div>

          {/* News Items */}
          <div className="space-y-6">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => <NewsCard key={item.id} item={item} />)
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500 text-lg">No updates found matching your criteria</p>
                <p className="text-gray-400 mt-2">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const dataPath = path.join(process.cwd(), 'public/data/all.json');

    // Check if data file exists, if not create empty data
    let newsData: NewsData;
    try {
      const fileContents = await fs.promises.readFile(dataPath, 'utf-8');
      newsData = JSON.parse(fileContents);
    } catch {
      newsData = {
        lastUpdated: '2025-09-28T00:00:00.000Z',
        totalItems: 0,
        items: [],
      };
    }

    return {
      props: {
        newsData,
      },
    };
  } catch (error) {
    console.error('Error loading news data:', error);
    return {
      props: {
        newsData: {
          lastUpdated: '2025-09-28T00:00:00.000Z',
          totalItems: 0,
          items: [],
        },
      },
    };
  }
};