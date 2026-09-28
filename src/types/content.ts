/**
 * TypeScript type definitions for AWS AI News Hub
 */

export type ContentSource =
  | 'whatsNew'
  | 'mlBlog'
  | 'newsBlog'
  | 'bigDataBlog'
  | 'architectureBlog'
  | 'computeBlog'
  | 'developersAndDevOps';

export type ServiceCategory =
  | 'agentic-ai'
  | 'generative-ai'
  | 'foundation-models'
  | 'machine-learning'
  | 'ai-services'
  | 'ai-safety'
  | 'industry-cases'
  | 'general';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: ContentSource;
  authors: string[];
  /** Official AWS tags, verbatim (e.g. "Advanced (300)", "Amazon Bedrock AgentCore"). */
  tags: string[];
  /** Subset of `tags` that are AWS products. */
  services: string[];
  /** Learning level tag, e.g. "Advanced (300)"; null when the source has none. */
  level: string | null;
  categories: ServiceCategory[];
}

export interface NewsData {
  lastUpdated: string;
  totalItems: number;
  sources?: Partial<Record<ContentSource, number>>;
  items: NewsItem[];
}
