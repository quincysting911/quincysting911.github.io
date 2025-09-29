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
  bigDataBlog: 'https://aws.amazon.com/blogs/big-data/feed/',
  architectureBlog: 'https://aws.amazon.com/blogs/architecture/feed/',
  computeBlog: 'https://aws.amazon.com/blogs/compute/feed/',
  developersAndDevOps: 'https://aws.amazon.com/blogs/developer/feed/',
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

  // Data Science & Analytics
  'data science', 'analytics', 'big data', 'data lake', 'data pipeline',
  'etl', 'data processing', 'data transformation', 'data mining',
  'predictive analytics', 'business intelligence', 'visualization',

  // Cloud AI/ML Infrastructure
  'gpu', 'high performance computing', 'parallel computing', 'distributed computing',
  'kubernetes', 'containers', 'docker', 'serverless computing', 'lambda',
  'api gateway', 'microservices', 'event-driven', 'streaming',

  // Modern Development Patterns
  'cicd', 'automation', 'devops', 'infrastructure as code', 'monitoring',
  'logging', 'observability', 'scalability', 'performance optimization',
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
    // Core AI Safety & Security
    'ai safety', 'ai security', 'ai governance', 'responsible ai', 'ai ethics',
    'ai regulation', 'ai compliance', 'ai oversight', 'ai accountability',
    'ai risk management', 'ai risk assessment', 'risk mitigation',

    // Guardrails & Content Safety
    'guardrails', 'bedrock guardrails', 'content filtering', 'harmful content',
    'content moderation', 'inappropriate content', 'toxicity', 'toxic content',
    'bias detection', 'fairness', 'bias mitigation', 'bias monitoring',

    // Privacy & Data Protection
    'pii redaction', 'sensitive data', 'data privacy', 'data protection',
    'redaction', 'anonymization', 'tokenization', 'data masking',
    'privacy protection', 'confidentiality', 'secure data handling',

    // AI Security & Adversarial
    'prompt injection', 'jailbreak', 'adversarial', 'security vulnerability',
    'model security', 'ai security threats', 'secure ai deployment',
    'threat modeling', 'security assessment', 'vulnerability assessment',

    // Trust & Verification
    'ai watermark', 'watermarking', 'provenance', 'authenticity',
    'model verification', 'ai auditing', 'compliance monitoring',
    'transparency', 'explainability', 'interpretability', 'model explainability',

    // Governance & Policy
    'ai policy', 'governance framework', 'regulatory compliance',
    'ethical ai', 'ai standards', 'certification', 'audit trail',
    'iam policy', 'service control policies', 'access control',
    'organizations', 'permission guardrails'
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
    // GenAI & AWS Service Implementation Stories
    'bedrock implementation', 'agentcore implementation', 'kira implementation',
    'using bedrock for', 'with amazon bedrock', 'bedrock for',
    'building with bedrock', 'deploy bedrock', 'bedrock solution',
    'agentcore for', 'using agentcore', 'agent implementation',
    'ai agents for', 'building ai agents', 'agentic workflows',

    // Healthcare Industry
    'healthcare ai', 'healthcare industry', 'medical ai', 'clinical ai',
    'patient care', 'healthcare provider', 'medical imaging',
    'healthcare organizations', 'clinical workflows', 'medical records',
    'healthcare delivery', 'healthcare solutions', 'medical diagnosis',
    'healthcare infrastructure', 'clinical decision support',

    // Financial Services Industry
    'financial services ai', 'financial industry', 'banking ai', 'fintech',
    'financial institutions', 'banks', 'investment', 'capital markets',
    'financial technology', 'payment processing', 'financial analytics',
    'risk management', 'compliance', 'financial data', 'trading',
    'wealth management', 'insurance', 'credit scoring',

    // Government & Public Sector
    'government ai', 'public sector', 'federal agency', 'state government',
    'local government', 'government agencies', 'civic technology',
    'public administration', 'government services', 'policy',
    'regulatory', 'citizen services', 'government operations',
    'defense', 'national security', 'military', 'intelligence',

    // Other Key Industries
    'retail ai', 'manufacturing ai', 'automotive ai', 'media ai',
    'education ai', 'enterprise ai', 'startup ai', 'supply chain ai',
    'logistics ai', 'real estate ai', 'energy ai', 'telecoms ai',
    'telecommunications', 'utilities', 'agriculture', 'construction',

    // GenAI Application Patterns
    'content generation', 'document processing', 'chatbot', 'virtual assistant',
    'sentiment analysis', 'text summarization', 'code generation',
    'translation', 'content personalization', 'recommendation engine',
    'fraud detection', 'risk assessment', 'predictive analytics',

    // Implementation & Deployment Indicators
    'customer story', 'case study', 'customer success', 'success story',
    'real-world', 'production deployment', 'enterprise deployment',
    'implementation guide', 'practical implementation', 'deployed solution',
    'customer spotlight', 'customer profile', 'use case',

    // Implementation Process Indicators
    'how to build', 'building a solution', 'building with',
    'we built', 'they built', 'implementation journey',
    'from poc to production', 'proof of concept to production',
    'move from experimentation to', 'scale from prototype',

    // Business Impact & Outcomes
    'business transformation', 'cost savings', 'efficiency gains',
    'improved customer experience', 'accelerated innovation',
    'digital transformation', 'automation benefits', 'roi',
    'business value', 'competitive advantage', 'market differentiation',

    // Blog Pattern Indicators (GenAI focused)
    'in this post', 'this post shows how', 'we demonstrate how',
    'walk through', 'step-by-step', 'getting started with',
    'deep dive into', 'explore how', 'learn how'
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

  // Core AWS Infrastructure (often mentioned in case studies)
  'lambda': 'AWS Lambda',
  's3': 'Amazon S3',
  'ec2': 'Amazon EC2',
  'emr': 'Amazon EMR',
  'redshift': 'Amazon Redshift',
  'opensearch': 'Amazon OpenSearch',
  'opensearch service': 'Amazon OpenSearch Service',
  'opensearch ingestion': 'Amazon OpenSearch Ingestion',
  'dynamodb': 'Amazon DynamoDB',
  'rds': 'Amazon RDS',
  'ecs': 'Amazon ECS',
  'eks': 'Amazon EKS',
  'fargate': 'AWS Fargate',
  'cloudformation': 'AWS CloudFormation',
  'iam': 'AWS IAM',
  'iam identity center': 'AWS IAM Identity Center',
  'cloudfront': 'Amazon CloudFront',
  'kinesis': 'Amazon Kinesis',
  'kafka': 'Amazon MSK',
  'msk': 'Amazon MSK',
  'glue': 'AWS Glue',
  'athena': 'Amazon Athena',
  'quicksight': 'Amazon QuickSight',
  'api gateway': 'Amazon API Gateway',
  'eventbridge': 'Amazon EventBridge',
  'step functions': 'AWS Step Functions',
  'sns': 'Amazon SNS',
  'sqs': 'Amazon SQS',
  'secrets manager': 'AWS Secrets Manager',
  'cloudwatch': 'Amazon CloudWatch',
  'grafana': 'Amazon Managed Grafana',
  'directory service': 'AWS Directory Service',
  'waf': 'AWS WAF',
  'organizations': 'AWS Organizations',
  'localstack': 'LocalStack',
  'graviton': 'AWS Graviton',
  'outposts': 'AWS Outposts',
  'transform for vmware': 'AWS Transform for VMware'
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

    // HIERARCHY 1: Source-based categorization (highest priority)
    if (source === 'newsBlog') {
      return ['news'];
    }

    // HIERARCHY 2: Specific AI/ML services (high priority, most specific)
    // Foundation Models (very specific model announcements)
    if (this.matchesCategory('foundation-models', text, title, description)) {
      return ['foundation-models'];
    }

    // AI Safety (security, guardrails, governance)
    if (this.matchesCategory('ai-safety', text, title, description)) {
      return ['ai-safety'];
    }

    // Generative AI (broad AI generation capabilities)
    if (this.matchesCategory('generative-ai', text, title, description)) {
      return ['generative-ai'];
    }

    // HIERARCHY 3: Core ML (traditional machine learning)
    if (this.matchesCategory('machine-learning', text, title, description)) {
      return ['machine-learning'];
    }

    // HIERARCHY 4: Specialized services
    if (this.matchesCategory('ai-services', text, title, description)) {
      return ['ai-services'];
    }

    if (this.matchesCategory('natural-language', text, title, description)) {
      return ['natural-language'];
    }

    // HIERARCHY 5: Implementation stories (lowest priority for specific topics)
    if (this.matchesCategory('industry-cases', text, title, description)) {
      // Special filtering for industry-cases to exclude service announcements
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
        return ['industry-cases'];
      }
    }

    // HIERARCHY 6: General fallback
    return ['general'];
  }

  /**
   * Helper method to check if content matches a specific category
   */
  matchesCategory(category, text, title, description) {
    const keywords = SERVICE_CATEGORIES[category] || [];
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
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

    // Fetch from all RSS sources
    for (const [feedName, feedUrl] of Object.entries(RSS_FEEDS)) {
      try {
        const items = await this.fetchFeed(feedUrl, feedName);
        allItems.push(...this.processFeedItems(items, feedName));
      } catch (error) {
        console.error(`✗ Failed to fetch ${feedName}:`, error.message);
        // Continue with other feeds even if one fails
      }
    }

    // Deduplicate and sort
    const uniqueItems = this.deduplicateItems(allItems);
    const sortedItems = this.sortByDate(uniqueItems);

    console.log(`\n✅ Total AI/ML items aggregated: ${sortedItems.length}\n`);

    // Generate sources count dynamically
    const sources = {};
    for (const feedName of Object.keys(RSS_FEEDS)) {
      sources[feedName] = sortedItems.filter(i => i.source === feedName).length;
    }

    return {
      lastUpdated: new Date().toISOString(),
      totalItems: sortedItems.length,
      sources,
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

    // Generate aggregated all.json file for main page
    const allData = {
      lastUpdated: content.lastUpdated,
      totalItems: content.items.length,
      sources: content.sources,
      items: content.items,
    };

    const allPath = path.join(__dirname, '../public/data/all.json');
    await fetcher.saveContent(allData, allPath);

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