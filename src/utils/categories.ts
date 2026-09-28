import { ContentSource, ServiceCategory } from '@/types/content';

export interface CategoryInfo {
  id: ServiceCategory;
  label: string;
  icon: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'agentic-ai',
    label: 'Agentic AI',
    icon: '🕹️',
    description:
      'AI agents on AWS: Amazon Bedrock AgentCore, Strands Agents, Amazon Quick Suite, Kiro, MCP and multi-agent systems',
  },
  {
    id: 'generative-ai',
    label: 'Generative AI',
    icon: '🤖',
    description:
      'Generative AI applications with Amazon Bedrock and Amazon Nova: RAG, knowledge bases, prompting and multimodal workloads',
  },
  {
    id: 'foundation-models',
    label: 'Foundation Models',
    icon: '🔷',
    description:
      'New foundation models on AWS: Claude, Llama, Mistral, Nova, DeepSeek, Qwen, GPT, Gemma and more on Amazon Bedrock and SageMaker',
  },
  {
    id: 'machine-learning',
    label: 'ML Platform',
    icon: '🧠',
    description:
      'Amazon SageMaker AI, HyperPod, training, fine-tuning, inference and AI infrastructure such as Trainium and Inferentia',
  },
  {
    id: 'ai-services',
    label: 'AI Services',
    icon: '🛠️',
    description:
      'Purpose-built AI services for vision, speech, language and documents: Rekognition, Textract, Transcribe, Polly, Comprehend, Lex, Connect',
  },
  {
    id: 'ai-safety',
    label: 'Responsible AI & Security',
    icon: '🛡️',
    description: 'Guardrails, responsible AI, security, privacy and compliance for AI workloads',
  },
  {
    id: 'industry-cases',
    label: 'Customer Stories',
    icon: '🏢',
    description: 'Customer solutions and industry implementations built with AWS AI/ML services',
  },
  {
    id: 'general',
    label: 'Other',
    icon: '📰',
    description: 'Other AI/ML-related AWS updates',
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  ServiceCategory,
  CategoryInfo
>;

export const SOURCE_LABELS: Record<ContentSource, string> = {
  mlBlog: 'AWS ML Blog',
  whatsNew: "What's New",
  newsBlog: 'AWS News Blog',
  bigDataBlog: 'Big Data Blog',
  architectureBlog: 'Architecture Blog',
  computeBlog: 'Compute Blog',
  developersAndDevOps: 'Developer Blog',
};

export const LEVEL_TAGS = ['Foundational (100)', 'Intermediate (200)', 'Advanced (300)', 'Expert (400)'];
