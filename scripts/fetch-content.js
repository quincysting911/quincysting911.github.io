#!/usr/bin/env node

/**
 * AWS AI News Content Fetcher
 *
 * - Pulls AWS RSS feeds and keeps the official AWS tags each post carries
 *   (e.g. "Advanced (300)", "Amazon Bedrock AgentCore", "Technical How-to").
 * - Filters to AI/ML content, derives site categories from those tags + title.
 * - Merges with the previously saved store so history survives beyond the RSS window.
 * - Deduplicates by canonical link and by identical titles across sources.
 *
 * Usage:
 *   node scripts/fetch-content.js               # daily run
 *   node scripts/fetch-content.js --backfill    # also crawl ML Blog listing pages back to the retention cutoff
 */

const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const SCHEMA_VERSION = 2;
const RETENTION_DAYS = 120;
const DESCRIPTION_MAX = 320;
const DUPLICATE_TITLE_WINDOW_DAYS = 7;
const SAME_STORY_WINDOW_DAYS = 4;

// For matching a What's New announcement to the blog post about the same launch.
const TITLE_STOPWORDS = new Set(
  'a an the and or for of in on to with by from your you is are now new generally available availability introducing introduces announcing announces announce launch launches launched support supports adds add amazon aws using use via at as its it this that more'.split(' ')
);
// Product words are shared by many unrelated posts, so they don't count as evidence on their own.
const PRODUCT_WORDS = new Set(['ai', 'bedrock', 'agentcore', 'sagemaker', 'hyperpod', 'q', 'nova']);
// Region-specific variants (e.g. "... in the Europe (Frankfurt) Region") are separate news, not duplicates.
// Bare "Region" is not enough: "cross-Region inference" is a feature name.
const REGION_PATTERN = /\b(govcloud|china|local zones?|(?:additional|new|more) regions?)\b|\)\s+regions?\b/i;
const DATA_DIR = path.join(__dirname, '../public/data');
const STORE_PATH = path.join(DATA_DIR, 'all.json');
const META_PATH = path.join(DATA_DIR, 'meta.json');

const RSS_FEEDS = {
  whatsNew: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
  mlBlog: 'https://aws.amazon.com/blogs/machine-learning/feed/',
  newsBlog: 'https://aws.amazon.com/blogs/aws/feed/',
  bigDataBlog: 'https://aws.amazon.com/blogs/big-data/feed/',
  architectureBlog: 'https://aws.amazon.com/blogs/architecture/feed/',
  computeBlog: 'https://aws.amazon.com/blogs/compute/feed/',
  developersAndDevOps: 'https://aws.amazon.com/blogs/developer/feed/',
};

const ML_BLOG_URL = 'https://aws.amazon.com/blogs/machine-learning/';

// When the same story appears in several sources, keep the richest one (lower = preferred).
const SOURCE_PRIORITY = {
  mlBlog: 0,
  newsBlog: 1,
  bigDataBlog: 2,
  architectureBlog: 2,
  computeBlog: 2,
  developersAndDevOps: 2,
  whatsNew: 3,
};

// What's New product slugs -> official names (slugs not listed fall back to casing rules below).
const PRODUCT_NAMES = {
  'amazon-bedrock': 'Amazon Bedrock',
  'amazon-bedrock-agentcore': 'Amazon Bedrock AgentCore',
  'amazon-sagemaker': 'Amazon SageMaker',
  'amazon-sagemaker-ai': 'Amazon SageMaker AI',
  'amazon-q': 'Amazon Q',
  'amazon-q-developer': 'Amazon Q Developer',
  'amazon-q-business': 'Amazon Q Business',
  'amazon-opensearch-service': 'Amazon OpenSearch Service',
  'amazon-dynamodb': 'Amazon DynamoDB',
  'amazon-cloudwatch': 'Amazon CloudWatch',
  'amazon-eventbridge': 'Amazon EventBridge',
  'amazon-elasticache': 'Amazon ElastiCache',
  'amazon-cloudfront': 'Amazon CloudFront',
  'aws-iam': 'AWS Identity and Access Management (IAM)',
  'aws-kms': 'AWS Key Management Service',
  'aws-lambda': 'AWS Lambda',
  'aws-security-hub': 'AWS Security Hub',
};
const WORD_CASING = {
  aws: 'AWS', ec2: 'EC2', s3: 'S3', eks: 'EKS', ecs: 'ECS', ecr: 'ECR', emr: 'EMR', rds: 'RDS',
  sns: 'SNS', sqs: 'SQS', ses: 'SES', iam: 'IAM', kms: 'KMS', vpc: 'VPC', waf: 'WAF', msk: 'MSK',
  sagemaker: 'SageMaker', opensearch: 'OpenSearch', dynamodb: 'DynamoDB', cloudwatch: 'CloudWatch',
  cloudformation: 'CloudFormation', cloudtrail: 'CloudTrail', documentdb: 'DocumentDB',
  healthlake: 'HealthLake', healthscribe: 'HealthScribe', agentcore: 'AgentCore', hyperpod: 'HyperPod',
  ai: 'AI', ml: 'ML', api: 'API', iot: 'IoT', and: '&',
};
const ARCHITECTURE_TOPICS = {
  'artificial-intelligence': 'Artificial Intelligence',
  'security-identity-and-compliance': 'Security, Identity, & Compliance',
  'networking-and-content-delivery': 'Networking & Content Delivery',
};

// Same tag, different spellings across feeds (keys lowercase).
const TAG_ALIASES = {
  'amazon sagemaker jumpstart': 'Amazon SageMaker JumpStart',
  'amazon quicksight': 'Amazon Quick Sight',
  'aws govcloud us': 'AWS GovCloud (US)',
  'amazon omics': 'AWS HealthOmics',
};

// AI products AWS What's New titles mention without tagging them (blog posts tag these properly).
const TITLE_PRODUCTS = [
  [/\bamazon bedrock\b/i, 'Amazon Bedrock'],
  [/\bagentcore\b/i, 'Amazon Bedrock AgentCore'],
  [/\bamazon q\b/i, 'Amazon Q'],
  [/\bhyperpod\b/i, 'Amazon SageMaker HyperPod'],
  [/\bsagemaker unified studio\b/i, 'Amazon SageMaker Unified Studio'],
  [/\bstrands agents\b/i, 'Strands Agents'],
  [/\bamazon q developer\b/i, 'Amazon Q Developer'],
  [/\bamazon q business\b/i, 'Amazon Q Business'],
  [/\bamazon nova\b/i, 'Amazon Nova'],
  [/\bkiro\b/i, 'Kiro'],
];

// Official tags that are AWS products but don't start with "Amazon"/"AWS".
const NON_PREFIXED_SERVICES = new Set(['Strands Agents', 'Kiro']);

// Signals that a non-ML-blog item is about AI/ML. Matched with word boundaries against
// official tags and the title only (descriptions mention "AI" far too loosely).
const AI_TAG_PATTERN = /\b(artificial intelligence|machine learning|generative ai|deep learning|bedrock|agentcore|sagemaker|amazon q|amazon quick suite|strands agents|kiro|nova|rekognition|textract|comprehend|transcribe|polly|translate|lex|kendra|personalize|forecast|trainium|inferentia|neuron|healthscribe|augmented ai|fraud detector|codeguru|devops guru)\b/i;
// Bare "agents" is left out on purpose: Amazon Connect titles use it for contact-center staff.
const AI_TITLE_PATTERN = /\b(ai|genai|generative ai|artificial intelligence|machine learning|ml|llms?|ai agents?|agentic|multi-agent|foundation models?|bedrock|agentcore|sagemaker|amazon q|kiro|nova|claude|llama|mistral|deepseek|qwen|gpt|rag|mcp|inference|trainium|inferentia|neuron|rekognition|textract|comprehend|transcribe|polly|lex|kendra|personalize|chatbots?|copilot|embeddings?|vectors?)\b/i;

// Site categories. An item may belong to several; `general` is only the fallback.
// Each rule matches official tags (joined) and/or the title.
const CATEGORY_RULES = {
  'agentic-ai': {
    tags: /\b(agentcore|strands agents|amazon quick suite|kiro|amazon q|agentic ai)\b/i,
    title: /\b(agents?|agentic|multi[- ]agent|mcp|model context protocol|a2a)\b/i,
    // In Amazon Connect posts "agents" are contact-center staff.
    titleUnless: /\b(amazon connect|contact cent(er|re))\b/i,
  },
  'generative-ai': {
    // "Amazon Bedrock AgentCore" alone is agentic, not general Bedrock content.
    tags: /\b(amazon bedrock(?! agentcore)|amazon nova|generative ai)\b/i,
    title: /\b(generative ai|genai|llms?|rag|retrieval[- ]augmented|prompts?|chatbots?|copilot|assistants?|embeddings?|multimodal|knowledge bases?|amazon q)\b/i,
  },
  'foundation-models': {
    title: /\b(claude|llama|mistral|ministral|mixtral|deepseek|qwen\d*[\w.-]*|gpt[- ]?\d[\w.-]*|gemma|nemotron|granite|cohere|command r|stability ai|stable diffusion|kimi|minimax|jamba|titan|palmyra|twelvelabs|marengo|nova (premier|pro|lite|micro|sonic|canvas|reel|\d)|open[- ]weight models?|foundation models?|frontier models?)\b|\bmodels? (?:are |is )?now (?:generally )?available\b/i,
  },
  'machine-learning': {
    tags: /\b(sagemaker|trainium|inferentia|neuron|deep learning amis?|elastic fabric adapter|amazon machine learning)\b/i,
    title: /\b(sagemaker|hyperpod|trainium|inferentia|neuron|training|fine[- ]?tun\w*|inference|reinforcement learning|gpus?|mlops|model deployment|model serving|deep learning containers|distillation)\b/i,
  },
  'ai-services': {
    tags: /\b(rekognition|textract|comprehend|transcribe|polly|translate|lex|kendra|personalize|forecast|amazon connect|healthscribe|healthlake|bedrock data automation|augmented ai|fraud detector|lookout)\b/i,
    title: /\b(rekognition|textract|comprehend|transcribe|polly|lex|kendra|personalize|speech|voice|text[- ]to[- ]speech|ocr|text extraction|document (processing|understanding)|computer vision|translation|transcription)\b/i,
  },
  'ai-safety': {
    // Not bare "governance": What's New tags every ops launch "Management & Governance".
    tags: /\b(responsible ai|guardrails|security, identity, & compliance|security|compliance|ai governance|privacy)\b/i,
    title: /\b(guardrails?|responsible ai|ai safety|security|secure|governance|compliance|privacy|pii|prompt injection|jailbreak\w*|red[- ]team\w*|hallucinations?|trustworthy)\b/i,
  },
  'industry-cases': {
    tags: /\b(customer solutions|case study|healthcare|life sciences|financial services|public sector|government|media & entertainment|retail|manufacturing|automotive|telecommunications|games|education|energy|travel|hospitality|sports|nonprofit|industries)\b/i,
    title: /\b(case study|customer story)\b|\bhow [\w&.'’-]+(?: [\w&.'’-]+){0,3} (built|builds|rebuilt|uses|used|scaled|scales|reduced|reduces|achieved|transformed|transforms|accelerated|accelerates|improved|improves|cut|saved|saves|automated|automates|modernized)\b/i,
  },
};
const CATEGORY_ORDER = Object.keys(CATEGORY_RULES);

// ---------- text helpers ----------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

function decodeEntities(text) {
  return String(text || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

function cleanText(text) {
  return decodeEntities(String(text || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function truncate(text, max = DESCRIPTION_MAX) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, '')}…`;
}

/** Canonical form of a post URL (https, lowercase host, no query/hash, trailing slash); null if not a web link. */
function normalizeLink(link) {
  try {
    const url = new URL(link, 'https://aws.amazon.com');
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.protocol = 'https:';
    url.hash = '';
    url.search = '';
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeTitle(title) {
  return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function generateId(link) {
  return `aws-news-${crypto.createHash('md5').update(link).digest('hex').substring(0, 12)}`;
}

function slugToName(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => WORD_CASING[word] || word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ---------- tags & classification ----------

/**
 * Turn raw RSS categories into official AWS tag names.
 * Blog feeds already carry display names; What's New uses "general:products/<slug>" style keys.
 * @param {string[]} rawCategories
 * @param {string} source
 * @param {string} title
 * @returns {string[]}
 */
function parseOfficialTags(rawCategories = [], source, title = '') {
  const tags = [];
  const add = (tag) => {
    if (tag && !tags.includes(tag)) tags.push(tag);
  };

  if (source !== 'whatsNew') {
    rawCategories.forEach((raw) => add(cleanText(raw)));
    return tags;
  }

  rawCategories
    .flatMap((raw) => String(raw).split(','))
    .map((raw) => raw.trim())
    .forEach((raw) => {
      const [namespace, slug] = raw.split('/');
      if (!slug) return;
      if (namespace === 'general:products' && slug !== 'aiml') add(PRODUCT_NAMES[slug] || slugToName(slug));
      if (namespace === 'marketing:marchitecture') add(ARCHITECTURE_TOPICS[slug] || slugToName(slug));
    });
  TITLE_PRODUCTS.forEach(([pattern, name]) => pattern.test(title) && add(name));
  return tags;
}

function isServiceTag(tag) {
  return /^(Amazon|AWS) /.test(tag) || NON_PREFIXED_SERVICES.has(tag);
}

function levelOf(tags) {
  return tags.find((tag) => /\(\d00\)$/.test(tag));
}

function isAIContent(item) {
  if (item.source === 'mlBlog') return true;
  return AI_TAG_PATTERN.test(item.tags.join(' | ')) || AI_TITLE_PATTERN.test(item.title);
}

function categorize(item) {
  const tagText = item.tags.join(' | ');
  const categories = CATEGORY_ORDER.filter((category) => {
    const rule = CATEGORY_RULES[category];
    const titleMatch =
      rule.title && rule.title.test(item.title) && !(rule.titleUnless && rule.titleUnless.test(`${item.title} | ${tagText}`));
    return (rule.tags && rule.tags.test(tagText)) || titleMatch;
  });
  return categories.length ? categories : ['general'];
}

/** Add derived fields (recomputed every run so rule changes apply to stored history). */
function enrich(item) {
  const tags = [...new Set(item.tags.map((tag) => TAG_ALIASES[tag.toLowerCase()] || tag))];
  const canonical = { ...item, tags };
  return {
    ...canonical,
    services: tags.filter(isServiceTag),
    level: levelOf(tags) || null,
    categories: categorize(canonical),
  };
}

/** Build a stored item; null when the entry has no usable link or date (one bad entry must not sink a feed). */
function toItem({ title, description, link, pubDate, source, authors = [], rawCategories = [] }) {
  const cleanTitle = cleanText(title);
  const canonicalLink = normalizeLink(link);
  const published = new Date(pubDate || Date.now());
  if (!cleanTitle || !canonicalLink || Number.isNaN(published.getTime())) {
    console.warn(`  skipped ${source} entry "${cleanTitle}": missing title, link or date`);
    return null;
  }
  return {
    id: generateId(canonicalLink),
    title: cleanTitle,
    description: truncate(cleanText(description)),
    link: canonicalLink,
    pubDate: published.toISOString(),
    source,
    authors,
    tags: parseOfficialTags(rawCategories, source, cleanTitle),
  };
}

// ---------- merge / dedupe ----------

/**
 * Merge fresh + stored items, drop expired ones, and collapse duplicates:
 * 1) same canonical link -> fresh copy wins;
 * 2) same title within a few days across sources -> keep the preferred source, union the tags.
 */
function mergeItems(freshItems, storedItems, now = new Date()) {
  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const byLink = new Map();
  [...storedItems, ...freshItems].forEach((item) => {
    if (new Date(item.pubDate).getTime() >= cutoff) byLink.set(item.link, item);
  });

  const windowMs = DUPLICATE_TITLE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const byTitle = new Map();
  [...byLink.values()]
    .sort((a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source])
    .forEach((item) => {
      const key = normalizeTitle(item.title);
      const twins = byTitle.get(key) || [];
      const twinIndex = twins.findIndex(
        (other) => Math.abs(new Date(other.pubDate) - new Date(item.pubDate)) <= windowMs
      );
      if (twinIndex === -1) {
        byTitle.set(key, [...twins, item]);
        return;
      }
      const twin = twins[twinIndex];
      twins[twinIndex] = { ...twin, tags: [...new Set([...twin.tags, ...item.tags])] };
    });

  return foldAnnouncementsIntoPosts([...byTitle.values()].flat()).sort(
    (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
  );
}

function titleWords(title) {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9.]+/)
      .map((word) => word.replace(/^\.+|\.+$/g, ''))
      .filter((word) => word && !TITLE_STOPWORDS.has(word))
  );
}

/**
 * AWS often announces a launch on What's New and publishes a blog post about it with a different title
 * ("Kimi K3 by Moonshot AI is now generally available on Amazon Bedrock" vs "Introducing Kimi K3 on Amazon Bedrock").
 * Same story = published within a few days, most of the announcement's distinctive words appear in the post title,
 * at least two of them aren't product names, and neither is a region-specific variant of the other.
 */
function isSameStory(announcement, post) {
  if (Math.abs(new Date(announcement.pubDate) - new Date(post.pubDate)) > SAME_STORY_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    return false;
  }
  if (REGION_PATTERN.test(announcement.title) !== REGION_PATTERN.test(post.title)) return false;
  const announcementWords = titleWords(announcement.title);
  const postWords = titleWords(post.title);
  const shared = [...announcementWords].filter((word) => postWords.has(word));
  const distinctive = shared.filter((word) => !PRODUCT_WORDS.has(word));
  return shared.length >= 3 && distinctive.length >= 2 && shared.length / announcementWords.size >= 0.6;
}

/** Drop What's New items that duplicate a blog post, keeping their tags on the post. */
function foldAnnouncementsIntoPosts(items) {
  const posts = items.filter((item) => item.source !== 'whatsNew');
  const extraTags = new Map();
  const announcements = items.filter((item) => {
    if (item.source !== 'whatsNew') return false;
    const post = posts.find((candidate) => isSameStory(item, candidate));
    if (!post) return true;
    extraTags.set(post.link, [...(extraTags.get(post.link) || []), ...item.tags]);
    return false;
  });
  return [
    ...posts.map((post) =>
      extraTags.has(post.link) ? { ...post, tags: [...new Set([...post.tags, ...extraTags.get(post.link)])] } : post
    ),
    ...announcements,
  ];
}

// ---------- fetching ----------

async function fetchFeed(parser, url, source) {
  try {
    const feed = await parser.parseURL(url);
    console.log(`✓ ${source}: ${feed.items.length} items`);
    return feed.items
      .map((entry) =>
        toItem({
          title: entry.title,
          description: entry.contentSnippet || entry.content,
          link: entry.link,
          pubDate: entry.isoDate || entry.pubDate,
          source,
          authors: entry.creator && source !== 'whatsNew' ? [cleanText(entry.creator)] : [],
          rawCategories: entry.categories || [],
        })
      )
      .filter(Boolean);
  } catch (error) {
    console.error(`✗ ${source}: ${error.message}`);
    return [];
  }
}

/** Parse one ML Blog listing page (https://aws.amazon.com/blogs/machine-learning/page/N/). */
function parseListingPage(html) {
  return html
    .split(/<article /)
    .slice(1)
    .map((block) => {
      const link = (block.match(/<h2[^>]*blog-post-title[\s\S]*?href="([^"]+)"/) || [])[1];
      const title = (block.match(/property="name headline">([\s\S]*?)<\/span>/) || [])[1];
      const pubDate = (block.match(/property="datePublished" datetime="([^"]+)"/) || [])[1];
      if (!pubDate) return null;
      return toItem({
        title,
        description: (block.match(/property="description">([\s\S]*?)<\/section>/) || [])[1],
        link,
        pubDate,
        source: 'mlBlog',
        authors: [...block.matchAll(/property="author"[^>]*>\s*<span property="name">([^<]+)</g)].map((m) => cleanText(m[1])),
        rawCategories: [...block.matchAll(/property="articleSection">([^<]+)</g)].map((m) => m[1]),
      });
    })
    .filter(Boolean);
}

async function backfillMlBlog(maxPages = 80) {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const items = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? ML_BLOG_URL : `${ML_BLOG_URL}page/${page}/`;
    const response = await fetch(url, { headers: { 'User-Agent': 'AWS-AI-News-Hub/1.0' } });
    if (!response.ok) break;
    const pageItems = parseListingPage(await response.text());
    items.push(...pageItems);
    console.log(`✓ ML Blog listing page ${page}: ${pageItems.length} posts`);
    if (!pageItems.length || pageItems.every((item) => new Date(item.pubDate).getTime() < cutoff)) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return items;
}

async function loadStore() {
  try {
    const data = JSON.parse(await fs.readFile(STORE_PATH, 'utf-8'));
    if (data.schemaVersion !== SCHEMA_VERSION) return [];
    return data.items.map(({ id, title, description, link, pubDate, source, authors, tags }) => ({
      id, title, description, link, pubDate, source, authors, tags,
    }));
  } catch {
    return [];
  }
}

async function main() {
  const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'AWS-AI-News-Hub/1.0' } });
  console.log('\n📡 Fetching AWS AI news...\n');

  const fresh = [];
  for (const [source, url] of Object.entries(RSS_FEEDS)) {
    fresh.push(...(await fetchFeed(parser, url, source)));
  }
  if (process.argv.includes('--backfill')) fresh.push(...(await backfillMlBlog()));

  const stored = await loadStore();
  const items = mergeItems(fresh.filter(isAIContent), stored.filter(isAIContent)).map(enrich);

  const sources = Object.fromEntries(Object.keys(RSS_FEEDS).map((s) => [s, items.filter((i) => i.source === s).length]));
  const lastUpdated = new Date().toISOString();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    STORE_PATH,
    JSON.stringify({ schemaVersion: SCHEMA_VERSION, lastUpdated, totalItems: items.length, sources, items }, null, 2)
  );
  await fs.writeFile(META_PATH, JSON.stringify({ lastUpdated, totalItems: items.length }, null, 2));
  console.log(`\n✅ ${items.length} AI/ML items saved (${stored.length} previously stored)\n`, sources);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Content aggregation failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
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
};
