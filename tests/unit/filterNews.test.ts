import { filterNews, topServices } from '@/utils/filterNews';
import { NewsItem } from '@/types/content';

const make = (overrides: Partial<NewsItem>): NewsItem => ({
  id: Math.random().toString(36),
  title: 'Title',
  description: '',
  link: 'https://aws.amazon.com/',
  pubDate: '2026-09-20T00:00:00.000Z',
  source: 'mlBlog',
  authors: [],
  tags: [],
  services: [],
  level: null,
  categories: ['general'],
  ...overrides,
});

const items = [
  make({ title: 'Stardog semantic layer', source: 'mlBlog', tags: ['Advanced (300)', 'Amazon Bedrock AgentCore'], services: ['Amazon Bedrock AgentCore'], categories: ['agentic-ai'], authors: ['Navin Sharma'] }),
  make({ title: 'Claude launch', source: 'whatsNew', tags: ['Amazon Bedrock'], services: ['Amazon Bedrock'], categories: ['foundation-models'] }),
  make({ title: 'HyperPod training', source: 'mlBlog', tags: ['Expert (400)', 'Amazon Bedrock AgentCore'], services: ['Amazon Bedrock AgentCore'], categories: ['machine-learning'] }),
];
const none = { category: 'all' as const, source: 'all' as const, tags: [], query: '' };

describe('filterNews', () => {
  it('requires every selected tag', () => {
    expect(filterNews(items, { ...none, tags: ['Amazon Bedrock AgentCore', 'Advanced (300)'] }).map((i) => i.title)).toEqual([
      'Stardog semantic layer',
    ]);
  });

  it('combines category, source and search (including tags and authors)', () => {
    expect(filterNews(items, { ...none, source: 'whatsNew' })).toHaveLength(1);
    expect(filterNews(items, { ...none, category: 'machine-learning' })).toHaveLength(1);
    expect(filterNews(items, { ...none, query: 'navin' })).toHaveLength(1);
    expect(filterNews(items, { ...none, query: 'agentcore' })).toHaveLength(2);
  });
});

describe('topServices', () => {
  it('ranks services by frequency', () => {
    expect(topServices(items, 1)).toEqual([['Amazon Bedrock AgentCore', 2]]);
  });
});
