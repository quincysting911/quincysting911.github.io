#!/usr/bin/env node

/**
 * AWS AI News Content Fetcher
 * Fetches and aggregates content from AWS RSS feeds
 * Filters for AI/ML related services and updates
 */

const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// RSS Feed Sources
const RSS_FEEDS = {
  whatsNew: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
  mlBlog: 'https://aws.amazon.com/blogs/machine-learning/feed/',
  newsBlog: 'https://aws.amazon.com/blogs/aws/feed/',
};

// AI/ML Service Keywords for Filtering (Updated 2025-09-28)
const AI_KEYWORDS = [
  // Generative AI & Foundation Models
  'bedrock', 'foundation models', 'generative ai', 'claude', 'nova', 'anthropic',
  'amazon q', 'q developer', 'q business', 'q in connect', 'partyrock',
  'llm', 'large language model', 'agentcore', 'agent framework', 'agentic ai',
  'multi-agent', 'ai agents', 'strands agents', 'bedrock agents',

  // Foundation Model Providers & Models
  'cohere', 'ai21', 'stability ai', 'mistral', 'meta', 'llama', 'titan',
  'deepseek', 'qwen', 'claude 3', 'claude 4', 'claude 3.5', 'claude sonnet',
  'stable diffusion', 'dall-e', 'midjourney', 'amazon titan',

  // Model Types & Capabilities
  'multimodal', 'text-to-image', 'image-to-text', 'speech-to-speech',
  'video generation', 'embedding models', 'distilled models',
  'fine-tuning', 'model customization', 'rag', 'retrieval augmented',

  // ML Platform & Infrastructure
  'sagemaker', 'machine learning', 'mlops', 'autopilot', 'canvas', 'jumpstart',
  'model training', 'ml pipeline', 'sagemaker studio', 'sagemaker unified studio',
  'sagemaker lakehouse', 'sagemaker hyperpod', 'sagemaker catalog',
  'partner ai apps', 'training plans', 'feature store',

  // AI Chips & Infrastructure
  'trainium', 'inferentia', 'graviton', 'aws neuron', 'trainium3', 'trainium2',
  'trn2', 'inf2', 'ai accelerator', 'gpu instances', 'ml infrastructure',

  // Computer Vision
  'rekognition', 'computer vision', 'image analysis', 'facial recognition',
  'lookout for vision', 'panorama', 'image recognition', 'video analysis',
  'custom labels', 'content moderation', 'celebrity recognition',

  // NLP & Language
  'comprehend', 'nlp', 'natural language', 'sentiment analysis',
  'comprehend medical', 'entity extraction', 'text analysis',
  'topic modeling', 'pii detection', 'syntax analysis',

  // Translation & Conversation
  'translate', 'translation', 'lex', 'chatbot', 'conversational ai',
  'voice assistant', 'contact center ai', 'customer service ai',

  // Speech AI
  'transcribe', 'speech to text', 'polly', 'text to speech', 'voice',
  'speech recognition', 'voice synthesis', 'neural voices',
  'call analytics', 'medical transcription', 'toxic speech',

  // Document Intelligence
  'textract', 'ocr', 'document analysis', 'form extraction',
  'intelligent document processing', 'idp', 'document ai',
  'handwriting recognition', 'table extraction',

  // Search & Discovery
  'kendra', 'intelligent search', 'semantic search', 'enterprise search',
  'vector search', 's3 vectors', 'opensearch serverless', 'vector database',
  'embeddings', 'similarity search',

  // Personalization & Forecasting
  'personalize', 'recommendations', 'forecast', 'time series', 'forecasting',
  'real-time personalization', 'batch recommendations', 'user segmentation',
  'demand forecasting', 'inventory planning',

  // Specialized AI Services
  'fraud detector', 'devops guru', 'codeguru', 'codeguru reviewer', 'codeguru profiler',
  'lookout for equipment', 'lookout for metrics', 'lookout for vision',
  'monitron', 'augmented ai', 'a2i', 'healthlake', 'healthscribe',

  // Code & Development AI
  'codewhisperer', 'code generation', 'code completion', 'code review',
  'automated testing', 'bug detection', 'security scanning',

  // Preview & Beta Keywords
  'preview', 'beta', 'experimental', 'early access', 'limited preview',
  'public preview', 'private preview', 'coming soon', 'roadmap',

  // Release Status Keywords
  'generally available', 'ga', 'new launch', 'now available',
  'new feature', 'new capability', 'expansion', 'new region',

  // General AI/ML Terms
  'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'ai model', 'ml model', 'training data',
  'inference', 'model deployment', 'model optimization',
  'responsible ai', 'ai safety', 'ai governance', 'ai ethics',
];

// Service Categories (Updated 2025-09-28)
const SERVICE_CATEGORIES = {
  'generative-ai': [
    'bedrock', 'generative ai', 'amazon q', 'q developer', 'q business',
    'agentcore', 'ai agents', 'agentic ai', 'multi-agent', 'strands agents',
    'rag', 'retrieval augmented', 'prompt engineering', 'fine-tuning',
    'text generation', 'code generation', 'partyrock'
  ],
  'foundation-models': [
    // Model availability in Bedrock (very specific)
    'now available in bedrock', 'available in amazon bedrock',
    'model now available in bedrock', 'models now available in bedrock',
    'foundation model', 'foundation models',
    // Specific model names with context
    'claude 3', 'claude 4', 'claude sonnet', 'claude opus', 'claude haiku',
    'meta llama', 'llama 3', 'llama model',
    'mistral ai', 'mistral model', 'mistral large',
    'cohere command', 'cohere embed',
    'ai21 jamba', 'ai21 jurassic',
    'amazon titan', 'titan embedding', 'titan image',
    'amazon nova', 'nova pro', 'nova lite', 'nova micro',
    'deepseek-r1', 'deepseek reasoning',
    'qwen model', 'qwen2.5',
    'stability ai', 'stable diffusion',
    'anthropic claude',
    // Model-specific announcements
    'bedrock model', 'bedrock models',
    'multimodal model', 'embedding model',
    'distilled model', 'reasoning model',
    'model customization', 'custom models'
  ],
  'machine-learning': [
    'sagemaker', 'mlops', 'model training', 'ml pipeline', 'autopilot',
    'canvas', 'jumpstart', 'sagemaker studio', 'unified studio',
    'lakehouse', 'hyperpod', 'feature store', 'training plans',
    'trainium', 'inferentia', 'neuron', 'ml infrastructure'
  ],
  'natural-language': [
    'comprehend', 'lex', 'translate', 'nlp', 'sentiment analysis',
    'comprehend medical', 'entity extraction', 'topic modeling',
    'pii detection', 'chatbot', 'conversational ai'
  ],
  'ai-safety': [
    // Guardrails & Safety
    'guardrails', 'bedrock guardrails', 'responsible ai', 'ai governance',
    'ai safety', 'ai ethics', 'content filtering', 'harmful content',
    // Bias & Fairness
    'bias detection', 'fairness', 'toxicity', 'toxic content',
    'content moderation', 'inappropriate content',
    // Privacy & Security
    'pii redaction', 'sensitive data', 'data privacy', 'data protection',
    'redaction', 'anonymization', 'tokenization',
    // Explainability
    'explainability', 'interpretability', 'transparency', 'model explainability',
    // Adversarial
    'jailbreak', 'prompt injection', 'adversarial', 'security vulnerability',
    // Watermarking & Trust
    'watermarking', 'ai watermark', 'provenance', 'authenticity'
  ],
  'ai-services': [
    // Search & Knowledge
    'kendra', 'opensearch serverless', 'vector search', 'semantic search',
    'embeddings', 'vector database',
    // Personalization & Forecasting
    'personalize', 'forecast', 'recommendations', 'demand forecasting',
    // Specialized AI
    'fraud detector', 'codeguru', 'devops guru', 'lookout for',
    'monitron', 'augmented ai', 'a2i', 'healthlake', 'healthscribe',
    'codewhisperer'
  ],
  'industry-cases': [
    // Blog post narrative patterns (very common in implementation stories)
    'in this post', 'in this blog', 'in this article', 'in this solution',
    'this post explores', 'this post demonstrates', 'this post shows',
    'we explore how', 'we demonstrate how', 'we show how', 'we walk through',

    // Customer story indicators
    'customer story', 'case study', 'customer case study',
    'customer success', 'customer spotlight', 'customer profile',

    // Implementation narrative phrases
    'how we built', 'how they built', 'how to build', 'building a solution',
    'building with', 'build a', 'build an', 'build multi',
    'accelerate', 'streamline', 'automate', 'move from poc to production',
    'proof of concept to production', 'from experimentation to',

    // Real-world usage indicators
    'real-world implementation', 'production deployment', 'deployed solution',
    'in production', 'production-ready', 'practical implementation',
    'production deployments', 'enterprise deployment',

    // Industry & vertical indicators
    'for enterprises', 'enterprise solution', 'industry solution',
    'benefits administration', 'claims processing', 'rating insights',
    'property investment', 'healthcare agents', 'health care',
    'financial services', 'site reliability',

    // Partnership & collaboration patterns
    'collaborated to build', 'partnership with', 'working with',
    'together to build', 'in collaboration with',

    // Problem-solution narrative
    'faced challenges', 'solved the problem', 'overcame obstacles',
    'business challenge', 'technical challenge', 'helps you',

    // Business outcome language
    'achieved results', 'business impact', 'transformed business',
    'delivers value', 'business outcomes', 'measurable results',

    // Tutorial & guide patterns (implementation-focused)
    'guide to', 'walkthrough', 'step-by-step', 'getting started with',
    'deep dive into', 'explore the', 'dive into how'
  ]
};

// Service Name Mapping (Updated 2025-09-28)
const SERVICE_MAP = {
  // Core AI Services
  'bedrock': 'Amazon Bedrock',
  'agentcore': 'Amazon Bedrock AgentCore',
  'nova': 'Amazon Nova',
  'amazon q': 'Amazon Q',
  'q developer': 'Amazon Q Developer',
  'q business': 'Amazon Q Business',
  'q in connect': 'Amazon Q in Connect',

  // ML Platform
  'sagemaker': 'Amazon SageMaker',
  'canvas': 'SageMaker Canvas',
  'jumpstart': 'SageMaker JumpStart',
  'unified studio': 'SageMaker Unified Studio',
  'hyperpod': 'SageMaker HyperPod',

  // Vision & Image
  'rekognition': 'Amazon Rekognition',
  'lookout for vision': 'Amazon Lookout for Vision',
  'panorama': 'AWS Panorama',

  // Language & Text
  'comprehend': 'Amazon Comprehend',
  'comprehend medical': 'Amazon Comprehend Medical',
  'translate': 'Amazon Translate',
  'lex': 'Amazon Lex',

  // Speech
  'transcribe': 'Amazon Transcribe',
  'polly': 'Amazon Polly',

  // Document
  'textract': 'Amazon Textract',

  // Search
  'kendra': 'Amazon Kendra',
  's3 vectors': 'Amazon S3 Vectors',

  // Personalization
  'personalize': 'Amazon Personalize',
  'forecast': 'Amazon Forecast',

  // Specialized
  'codeguru': 'Amazon CodeGuru',
  'codewhisperer': 'Amazon CodeWhisperer',
  'devops guru': 'Amazon DevOps Guru',
  'fraud detector': 'Amazon Fraud Detector',
  'lookout for equipment': 'Amazon Lookout for Equipment',
  'lookout for metrics': 'Amazon Lookout for Metrics',
  'monitron': 'Amazon Monitron',
  'augmented ai': 'Amazon Augmented AI',
  'a2i': 'Amazon A2I',
  'healthlake': 'AWS HealthLake',
  'healthscribe': 'AWS HealthScribe',

  // Infrastructure
  'trainium': 'AWS Trainium',
  'trainium3': 'AWS Trainium3',
  'inferentia': 'AWS Inferentia',
  'neuron': 'AWS Neuron',
};

class ContentFetcher {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'AWS-AI-News-Hub/1.0',
      },
    });
  }

  /**
   * Generate unique ID for content item
   */
  generateId(title, link) {
    const hash = crypto.createHash('md5').update(title + link).digest('hex');
    return `aws-news-${hash.substring(0, 12)}`;
  }

  /**
   * Check if content is AI/ML related
   */
  isAIContent(title, description, categories = []) {
    const text = `${title} ${description} ${categories.join(' ')}`.toLowerCase();
    return AI_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Extract services mentioned in content
   */
  extractServices(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const services = [];

    Object.entries(SERVICE_MAP).forEach(([key, serviceName]) => {
      if (text.includes(key.toLowerCase())) {
        services.push(key);
      }
    });

    return services;
  }

  /**
   * Categorize content based on keywords and source
   */
  categorizeContent(title, description, source = null) {
    const text = `${title} ${description}`.toLowerCase();
    const categories = [];

    // Source-based categorization for AWS News Blog
    if (source === 'news-blog') {
      categories.push('news');
    }

    Object.entries(SERVICE_CATEGORIES).forEach(([category, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        // Special filtering for industry-cases to exclude service announcements
        if (category === 'industry-cases') {
          const serviceAnnouncementPatterns = [
            /now supports?/i,
            /now available in \d+ (additional )?regions?/i,
            /announces? (support|availability)/i,
            /increases? (the )?(maximum|performance|size)/i,
            /adds? support for/i,
            /expands? to/i,
            /available in .* regions?/i,
            /is now available/i,
            /are now available/i
          ];

          const isServiceAnnouncement = serviceAnnouncementPatterns.some(pattern =>
            pattern.test(title) || pattern.test(description.substring(0, 200))
          );

          if (!isServiceAnnouncement) {
            categories.push(category);
          }
        } else {
          categories.push(category);
        }
      }
    });

    return categories.length > 0 ? categories : ['general'];
  }

  /**
   * Extract tags from content
   */
  extractTags(title, description, services) {
    const tags = new Set();
    const text = `${title} ${description}`.toLowerCase();

    // Add service-based tags
    services.forEach(service => tags.add(service));

    // Add keyword-based tags (Updated 2025-09-28)
    const tagKeywords = [
      'launch', 'preview', 'beta', 'experimental', 'early access',
      'generally available', 'ga', 'now available', 'new feature',
      'update', 'improvement', 'enhancement', 'integration',
      'support', 'announcement', 'new region', 'expansion',
      'coming soon', 'roadmap', 'limited preview', 'public preview',
      'private preview', 'new model', 'new capability',
    ];

    tagKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.add(keyword.replace(/ /g, '-'));
      }
    });

    return Array.from(tags);
  }

  /**
   * Fetch and parse RSS feed
   */
  async fetchFeed(url, source) {
    try {
      console.log(`Fetching ${source} from ${url}...`);
      const feed = await this.parser.parseURL(url);
      console.log(`✓ Fetched ${feed.items.length} items from ${source}`);
      return feed.items;
    } catch (error) {
      console.error(`✗ Error fetching ${source}:`, error.message);
      return [];
    }
  }

  /**
   * Process feed items and filter for AI/ML content
   */
  processFeedItems(items, source) {
    const processed = [];

    items.forEach(item => {
      const title = item.title || '';
      const description = item.contentSnippet || item.content || '';
      const categories = item.categories || [];

      // Filter: Only AI/ML related content
      if (!this.isAIContent(title, description, categories)) {
        return;
      }

      const services = this.extractServices(title, description);
      const itemCategories = this.categorizeContent(title, description, source);
      const tags = this.extractTags(title, description, services);

      processed.push({
        id: this.generateId(title, item.link),
        title: title.trim(),
        description: description.trim(),
        link: item.link,
        pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
        source,
        services,
        categories: itemCategories,
        tags,
      });
    });

    console.log(`✓ Processed ${processed.length} AI/ML items from ${source}`);
    return processed;
  }

  /**
   * Remove duplicate items based on link
   */
  deduplicateItems(items) {
    const seen = new Set();
    const unique = [];

    items.forEach(item => {
      if (!seen.has(item.link)) {
        seen.add(item.link);
        unique.push(item);
      }
    });

    console.log(`✓ Removed ${items.length - unique.length} duplicates`);
    return unique;
  }

  /**
   * Sort items by publication date (newest first)
   */
  sortByDate(items) {
    return items.sort((a, b) =>
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
  }

  /**
   * Fetch all feeds and aggregate content
   */
  async fetchAllContent() {
    console.log('\n📡 Starting AWS AI news aggregation...\n');

    const allItems = [];

    // Fetch What's New
    const whatsNewItems = await this.fetchFeed(RSS_FEEDS.whatsNew, 'whats-new');
    allItems.push(...this.processFeedItems(whatsNewItems, 'whats-new'));

    // Fetch ML Blog
    const mlBlogItems = await this.fetchFeed(RSS_FEEDS.mlBlog, 'ml-blog');
    allItems.push(...this.processFeedItems(mlBlogItems, 'ml-blog'));

    // Fetch News Blog
    const newsBlogItems = await this.fetchFeed(RSS_FEEDS.newsBlog, 'news-blog');
    allItems.push(...this.processFeedItems(newsBlogItems, 'news-blog'));

    // Deduplicate and sort
    const uniqueItems = this.deduplicateItems(allItems);
    const sortedItems = this.sortByDate(uniqueItems);

    console.log(`\n✅ Total AI/ML items aggregated: ${sortedItems.length}\n`);

    return {
      lastUpdated: new Date().toISOString(),
      totalItems: sortedItems.length,
      sources: {
        'whats-new': sortedItems.filter(i => i.source === 'whats-new').length,
        'ml-blog': sortedItems.filter(i => i.source === 'ml-blog').length,
        'news-blog': sortedItems.filter(i => i.source === 'news-blog').length,
      },
      items: sortedItems,
    };
  }

  /**
   * Save content to JSON file
   */
  async saveContent(data, outputPath) {
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      console.log(`✓ Content saved to ${outputPath}`);
    } catch (error) {
      console.error(`✗ Error saving content:`, error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const fetcher = new ContentFetcher();

  try {
    // Fetch all content
    const content = await fetcher.fetchAllContent();

    // Save to public/data directory
    const outputPath = path.join(__dirname, '../public/data/news.json');
    await fetcher.saveContent(content, outputPath);

    // Generate category-specific files
    const categories = [...new Set(content.items.flatMap(item => item.categories))];

    for (const category of categories) {
      const categoryItems = content.items.filter(item =>
        item.categories.includes(category)
      );

      const categoryData = {
        lastUpdated: content.lastUpdated,
        category,
        totalItems: categoryItems.length,
        items: categoryItems,
      };

      const categoryPath = path.join(
        __dirname,
        `../public/data/${category}.json`
      );
      await fetcher.saveContent(categoryData, categoryPath);
    }

    console.log('\n🎉 Content aggregation completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Content aggregation failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { ContentFetcher };