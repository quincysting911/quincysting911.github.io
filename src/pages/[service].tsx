import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import MainLayout from '@/layouts/MainLayout';
import NewsCard from '@/components/NewsCard';
import { NewsData, ServiceCategory } from '@/types/content';
import fs from 'fs';
import path from 'path';

interface ServicePageProps {
  service: ServiceCategory;
  newsData: NewsData;
}

const SERVICE_DISPLAY_NAMES: Record<ServiceCategory, string> = {
  'generative-ai': 'Generative AI',
  'foundation-models': 'Foundation Models',
  'machine-learning': 'Machine Learning',
  'natural-language': 'Natural Language Processing',
  'ai-safety': 'AI Safety & Governance',
  'ai-services': 'AI Services',
  'industry-cases': 'Industry Use Cases & Customer Stories',
  'news': 'AI News & Updates',
  'general': 'General AI/ML',
};

const SERVICE_DESCRIPTIONS: Record<ServiceCategory, string> = {
  'generative-ai':
    'Generative AI applications, AI agents, RAG systems, and prompt engineering with Amazon Bedrock, Amazon Q, and AgentCore',
  'foundation-models':
    'Latest foundation model availability in Amazon Bedrock - Claude, Llama, Mistral, Nova, DeepSeek, Qwen, and more',
  'machine-learning':
    'Complete ML platform with Amazon SageMaker for building, training, and deploying machine learning models at scale',
  'natural-language':
    'Natural language processing, text analysis, translation, chatbots, and conversational AI capabilities',
  'ai-safety':
    'Responsible AI, guardrails, compliance, bias detection, content moderation, PII protection, and AI governance',
  'ai-services':
    'Specialized AI services including search (Kendra, OpenSearch), personalization, fraud detection, and code analysis',
  'industry-cases':
    'Real-world customer success stories, industry implementations, and business transformation case studies using AWS AI/ML services',
  'news': 'Latest AWS AI and machine learning news, updates, and announcements',
  'general': 'General AWS AI and machine learning updates and announcements',
};

export default function ServicePage({ service, newsData }: ServicePageProps) {
  const displayName = SERVICE_DISPLAY_NAMES[service];
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date(newsData.lastUpdated).toLocaleString());
  }, [newsData.lastUpdated]);
  const description = SERVICE_DESCRIPTIONS[service];

  return (
    <>
      <Head>
        <title>{displayName} - AWS AI News Hub</title>
        <meta name="description" content={description} />
      </Head>

      <MainLayout>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-aws-navy mb-4">{displayName}</h1>
            <p className="text-lg text-gray-600 max-w-3xl">{description}</p>
            <div className="mt-4 text-sm text-gray-500">
              {lastUpdated && `Last updated: ${lastUpdated} • `}
              {newsData.totalItems} updates
            </div>
          </div>

          {/* News Items */}
          <div className="space-y-6">
            {newsData.items.length > 0 ? (
              newsData.items.map((item) => <NewsCard key={item.id} item={item} />)
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500 text-lg">No updates available for this category</p>
                <p className="text-gray-400 mt-2">Check back soon for new announcements</p>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const categories: ServiceCategory[] = [
    'generative-ai',
    'foundation-models',
    'machine-learning',
    'natural-language',
    'ai-safety',
    'ai-services',
    'industry-cases',
    'news',
    'general',
  ];

  const paths = categories.map((service) => ({
    params: { service },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ServicePageProps> = async ({ params }) => {
  const service = params?.service as ServiceCategory;

  try {
    const dataPath = path.join(process.cwd(), `public/data/${service}.json`);

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
        service,
        newsData,
      },
    };
  } catch (error) {
    console.error(`Error loading data for ${service}:`, error);
    return {
      props: {
        service,
        newsData: {
          lastUpdated: '2025-09-28T00:00:00.000Z',
          totalItems: 0,
          items: [],
        },
      },
    };
  }
};