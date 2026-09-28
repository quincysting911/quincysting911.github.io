import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import MainLayout from '@/layouts/MainLayout';
import NewsList from '@/components/NewsList';
import { NewsItem, ServiceCategory } from '@/types/content';
import { CATEGORIES, CATEGORY_BY_ID } from '@/utils/categories';
import { topServices } from '@/utils/filterNews';
import { loadNews } from '@/utils/loadNews';

interface ServicePageProps {
  service: ServiceCategory;
  lastUpdated: string;
  items: NewsItem[];
}

export default function ServicePage({ service, lastUpdated, items }: ServicePageProps) {
  const { label, description } = CATEGORY_BY_ID[service];
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('');

  useEffect(() => {
    setLastUpdatedText(new Date(lastUpdated).toLocaleString());
  }, [lastUpdated]);

  return (
    <>
      <Head>
        <title>{`${label} - AWS AI News Hub`}</title>
        <meta name="description" content={description} />
      </Head>

      <MainLayout>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-aws-navy mb-4">{label}</h1>
            <p className="text-lg text-gray-600 max-w-3xl">{description}</p>
            <div className="mt-4 text-sm text-gray-500">
              {lastUpdatedText && `Last updated: ${lastUpdatedText} • `}
              {items.length} updates
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {topServices(items, 12).map(([tag, count]) => (
                <Link
                  key={tag}
                  href={`/?category=${service}&tag=${encodeURIComponent(tag)}`}
                  prefetch={false}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-aws-navy border border-gray-300 hover:border-aws-orange"
                >
                  {tag}
                  <span className="ml-1.5 text-gray-500">{count}</span>
                </Link>
              ))}
            </div>
          </div>

          <NewsList items={items} emptyMessage="No updates available for this category" />
        </div>
      </MainLayout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: CATEGORIES.map(({ id }) => ({ params: { service: id } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ServicePageProps> = async ({ params }) => {
  const service = params?.service as ServiceCategory;
  const { lastUpdated, items } = await loadNews();
  return {
    props: {
      service,
      lastUpdated,
      items: items.filter((item) => item.categories.includes(service)),
    },
  };
};
