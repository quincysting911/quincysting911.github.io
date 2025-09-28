/**
 * TypeScript type definitions for AWS AI News Hub
 */

export type ContentSource = 'whats-new' | 'ml-blog' | 'news-blog' | 'security-blog';

export type ServiceCategory =
  | 'generative-ai'
  | 'machine-learning'
  | 'computer-vision'
  | 'natural-language'
  | 'speech'
  | 'document-intelligence'
  | 'search'
  | 'personalization'
  | 'specialized'
  | 'industry-cases'
  | 'general';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: ContentSource;
  services: string[];
  categories: ServiceCategory[];
  tags: string[];
  imageUrl?: string;
}

export interface NewsData {
  lastUpdated: string;
  totalItems: number;
  sources?: {
    [key in ContentSource]?: number;
  };
  items: NewsItem[];
}

export interface CategoryData extends NewsData {
  category: ServiceCategory;
}

export interface AWSService {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ServiceCategory;
  documentationUrl: string;
  icon?: string;
  keywords: string[];
}

export interface FilterOptions {
  services?: string[];
  categories?: ServiceCategory[];
  sources?: ContentSource[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchQuery?: string;
}