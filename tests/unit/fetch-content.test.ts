/**
 * @jest-environment node
 */
import {
  parseOfficialTags,
  parseListingPage,
  normalizeLink,
  isAIContent,
  categorize,
  enrich,
  mergeItems,
  isSameStory,
  toItem,
  truncate,
} from '../../scripts/fetch-content';

const STARDOG_TAGS = [
  'Advanced (300)',
  'Amazon Athena',
  'Amazon Bedrock',
  'Amazon Bedrock AgentCore',
  'Amazon OpenSearch Service',
  'Amazon Redshift',
  'Amazon Simple Storage Service (S3)',
  'AWS Lake Formation',
  'Strands Agents',
  'Technical How-to',
];

// Trimmed copy of one post block from https://aws.amazon.com/blogs/machine-learning/page/2/
const LISTING_HTML = `
<article class="blog-post" vocab="https://schema.org/" typeof="TechArticle">
  <h2 class="lb-bold blog-post-title"><a href="/blogs/machine-learning/agentic-conversational-video-intelligence-built-on-aws/" property="url" rel="bookmark"><span property="name headline">Agentic conversational video intelligence built on AWS</span></a></h2>
  <footer class="blog-post-meta">
    <span>by <span property="author" typeof="Person"><span property="name">Michael Li</span></span> and <span property="author" typeof="Person"><span property="name">Kara Yang</span></span></span>
    <span>on <time property="datePublished" datetime="2026-09-23T10:21:54-08:00">23 SEP 2026</time></span>
    <span>in <span class="blog-post-categories"><a href="#"><span property="articleSection">Amazon Bedrock</span></a>, <a href="#"><span property="articleSection">Intermediate (200)</span></a>, <a href="#"><span property="articleSection">Technical How-to</span></a></span></span>
  </footer>
  <section class="blog-post-excerpt lb-rtxt" property="description"><p>Learn how to build a conversational video intelligence solution on AWS &amp; more.</p></section>
</article>`;

const item = (overrides: Record<string, unknown>) => ({
  id: 'x',
  title: 'Untitled',
  description: '',
  link: 'https://aws.amazon.com/x/',
  pubDate: '2026-09-20T00:00:00.000Z',
  source: 'mlBlog',
  authors: [],
  tags: [],
  ...overrides,
});

describe('official AWS tags', () => {
  it('keeps blog feed categories verbatim', () => {
    expect(parseOfficialTags(STARDOG_TAGS, 'mlBlog')).toEqual(STARDOG_TAGS);
  });

  it("maps What's New product/topic keys to readable names", () => {
    const tags = parseOfficialTags(
      ['marketing:marchitecture/artificial-intelligence,general:products/amazon-sagemaker-jumpstart,general:products/aiml'],
      'whatsNew',
      'The new AgentCore Runtime is now available'
    );
    expect(tags).toEqual(['Artificial Intelligence', 'Amazon SageMaker Jumpstart', 'Amazon Bedrock AgentCore']);
  });

  it('derives services, level and canonical spellings', () => {
    const enriched = enrich(item({ tags: [...STARDOG_TAGS, 'Amazon SageMaker Jumpstart'] }));
    expect(enriched.level).toBe('Advanced (300)');
    expect(enriched.services).toContain('Strands Agents');
    expect(enriched.services).toContain('Amazon SageMaker JumpStart');
    expect(enriched.services).not.toContain('Technical How-to');
  });
});

describe('ML Blog listing page', () => {
  it('parses title, link, authors, date, tags and excerpt', () => {
    const [post] = parseListingPage(LISTING_HTML);
    expect(post).toMatchObject({
      title: 'Agentic conversational video intelligence built on AWS',
      link: 'https://aws.amazon.com/blogs/machine-learning/agentic-conversational-video-intelligence-built-on-aws/',
      authors: ['Michael Li', 'Kara Yang'],
      pubDate: '2026-09-23T18:21:54.000Z',
      tags: ['Amazon Bedrock', 'Intermediate (200)', 'Technical How-to'],
      description: 'Learn how to build a conversational video intelligence solution on AWS & more.',
    });
  });
});

describe('AI relevance and categories', () => {
  it('drops non-AI What\'s New launches but keeps AI-tagged ones', () => {
    expect(isAIContent(item({ source: 'whatsNew', title: 'Amazon EC2 M8i instances now available in additional regions', tags: ['Amazon EC2', 'Compute'] }))).toBe(false);
    expect(isAIContent(item({ source: 'whatsNew', title: 'Amazon Connect now enables agents to bid on shifts', tags: ['Amazon Connect'] }))).toBe(false);
    expect(isAIContent(item({ source: 'whatsNew', title: 'Kimi K3 is now available', tags: ['Artificial Intelligence', 'Amazon Bedrock'] }))).toBe(true);
  });

  it('categorizes the Stardog post as agentic and generative AI', () => {
    const categories = categorize(item({ title: 'Build a semantic layer for agentic AI on AWS with Stardog and Amazon Bedrock AgentCore', tags: STARDOG_TAGS }));
    expect(categories).toEqual(expect.arrayContaining(['agentic-ai', 'generative-ai']));
    expect(categories).not.toContain('general');
  });

  it('flags model launches and customer stories', () => {
    expect(categorize(item({ title: 'Claude Opus 5.5 is now available on AWS', tags: ['Amazon Bedrock'] }))).toContain('foundation-models');
    expect(categorize(item({ title: 'How AgentFlo built AI sales agents', tags: ['Customer Solutions'] }))).toContain('industry-cases');
    expect(categorize(item({ title: 'Something unrelated', tags: [] }))).toEqual(['general']);
  });

  it('treats "agents" as AI agents except in contact-center posts', () => {
    expect(categorize(item({ title: 'Set up your AI coding agent to build with AWS Step Functions', tags: [] }))).toContain('agentic-ai');
    expect(
      categorize(item({ title: 'Amazon Connect gives contact center agents new machine learning routing insights', tags: ['Amazon Connect'] }))
    ).not.toContain('agentic-ai');
  });
});

describe('merge and dedupe', () => {
  const now = new Date('2026-09-28T00:00:00.000Z');

  it('collapses the same story from ML Blog and What\'s New into the blog post', () => {
    const merged = mergeItems(
      [
        item({ source: 'whatsNew', title: 'Claude Opus 5.5 is now available on AWS ', link: 'https://aws.amazon.com/about-aws/whats-new/2026/09/claude-opus-5-5-aws/', tags: ['Artificial Intelligence'], pubDate: '2026-09-22T15:00:00.000Z' }),
        item({ source: 'mlBlog', title: 'Claude Opus 5.5 is now available on AWS', link: 'https://aws.amazon.com/blogs/machine-learning/claude-opus-5-5-is-now-available-on-aws/', tags: ['Amazon Bedrock'], pubDate: '2026-09-22T17:28:01.000Z' }),
      ],
      [],
      now
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('mlBlog');
    expect(merged[0].tags).toEqual(['Amazon Bedrock', 'Artificial Intelligence']);
  });

  it('keeps stored history, prefers fresh copies, and drops expired items', () => {
    const merged = mergeItems(
      [item({ link: 'https://aws.amazon.com/a/', title: 'A (fresh)' })],
      [
        item({ link: 'https://aws.amazon.com/a/', title: 'A (stale)' }),
        item({ link: 'https://aws.amazon.com/b/', title: 'B', pubDate: '2026-08-01T00:00:00.000Z' }),
        item({ link: 'https://aws.amazon.com/old/', title: 'Old', pubDate: '2025-01-01T00:00:00.000Z' }),
      ],
      now
    );
    expect(merged.map((i: { title: string }) => i.title)).toEqual(['A (fresh)', 'B']);
  });

  it("folds a What's New announcement into the blog post about the same launch", () => {
    const post = item({ source: 'mlBlog', title: 'Introducing Kimi K3 on Amazon Bedrock', link: 'https://aws.amazon.com/blogs/machine-learning/kimi/', tags: ['Amazon Bedrock'] });
    const announcement = item({ source: 'whatsNew', title: 'Kimi K3 by Moonshot AI is now generally available on Amazon Bedrock', link: 'https://aws.amazon.com/about-aws/whats-new/kimi/', tags: ['Artificial Intelligence'] });
    const merged = mergeItems([announcement, post], [], now);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ source: 'mlBlog', tags: ['Amazon Bedrock', 'Artificial Intelligence'] });
  });

  it('keeps related-but-different announcements separate', () => {
    const blog = (title: string) => item({ source: 'mlBlog', title });
    const news = (title: string) => item({ source: 'whatsNew', title });
    expect(isSameStory(news('Claude Opus 5.5 is now available on AWS GovCloud (US)'), blog('Claude Opus 5.5 is now available on AWS'))).toBe(false);
    expect(isSameStory(news('The new AgentCore Runtime is now available in Amazon Bedrock AgentCore'), blog('Migrating multi-model AI agents to Amazon Bedrock AgentCore runtime'))).toBe(false);
    const gptNews = news('OpenAI GPT-6 Sol and GPT-6 Luna are now generally available on Amazon Bedrock');
    const gptPost = (pubDate: string) =>
      item({ source: 'mlBlog', title: 'Bring more intelligence to everyday work with GPT-6 Sol and GPT-6 Luna on Amazon Bedrock', pubDate });
    expect(isSameStory(gptNews, gptPost('2026-09-22T00:00:00.000Z'))).toBe(true);
    // A specific-region expansion is separate news; the feature name "cross-Region" is not a region variant.
    expect(isSameStory(news('OpenAI GPT-6 Sol and GPT-6 Luna now available in the Europe (Frankfurt) Region'), gptPost('2026-09-22T00:00:00.000Z'))).toBe(false);
    expect(
      isSameStory(
        news('OpenAI GPT-6 Sol and GPT-6 Luna now support cross-Region inference on Amazon Bedrock'),
        item({ source: 'mlBlog', title: 'Introducing cross-Region inference for GPT-6 Sol and GPT-6 Luna' })
      )
    ).toBe(true);
    expect(isSameStory(gptNews, gptPost('2026-09-30T00:00:00.000Z'))).toBe(false);
  });

  it('does not merge same-titled announcements weeks apart', () => {
    const merged = mergeItems(
      [
        item({ title: 'SageMaker now available in new regions', link: 'https://aws.amazon.com/1/', pubDate: '2026-09-20T00:00:00.000Z' }),
        item({ title: 'SageMaker now available in new regions', link: 'https://aws.amazon.com/2/', pubDate: '2026-08-20T00:00:00.000Z' }),
      ],
      [],
      now
    );
    expect(merged).toHaveLength(2);
  });
});

describe('helpers', () => {
  it('normalizes links so tracking params and missing slashes do not create duplicates', () => {
    expect(normalizeLink('http://AWS.amazon.com/blogs/machine-learning/post?trk=rss#top')).toBe(
      'https://aws.amazon.com/blogs/machine-learning/post/'
    );
  });

  it('truncates long descriptions on a word boundary', () => {
    const text = 'word '.repeat(100).trim();
    const result = truncate(text, 50);
    expect(result.length).toBeLessThanOrEqual(51);
    expect(result.endsWith('word…')).toBe(true);
  });

  it('skips entries with an unusable date or a non-web link instead of throwing', () => {
    const base = { title: 'T', description: 'D', source: 'mlBlog' };
    expect(toItem({ ...base, link: 'https://aws.amazon.com/p', pubDate: 'Not a date' })).toBeNull();
    expect(toItem({ ...base, link: 'javascript:alert(1)', pubDate: '2026-09-01' })).toBeNull();
    expect(normalizeLink('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('builds stable ids from the canonical link', () => {
    const a = toItem({ title: 'T', description: 'D', link: 'https://aws.amazon.com/p', pubDate: '2026-09-01', source: 'mlBlog' });
    const b = toItem({ title: 'T2', description: 'D', link: 'https://aws.amazon.com/p/?x=1', pubDate: '2026-09-01', source: 'mlBlog' });
    expect(a.id).toBe(b.id);
  });
});
