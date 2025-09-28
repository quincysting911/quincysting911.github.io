import Head from 'next/head';
import MainLayout from '@/layouts/MainLayout';

interface UseCase {
  id: string;
  industry: string;
  company: string;
  title: string;
  description: string;
  awsServices: string[];
  benefits: string[];
  region: string;
  icon: string;
}

const industryUseCases: UseCase[] = [
  {
    id: 'healthcare-1',
    industry: 'Healthcare',
    company: 'Philips Healthcare',
    title: 'AI-Powered Medical Imaging Analysis',
    description: 'Philips uses AWS AI services to analyze medical images, helping radiologists detect diseases faster and more accurately while reducing diagnostic time by 50%.',
    awsServices: ['Amazon Rekognition', 'Amazon SageMaker', 'AWS Lambda', 'Amazon S3'],
    benefits: ['50% faster diagnosis', 'Improved accuracy', 'Reduced radiologist workload', 'Better patient outcomes'],
    region: 'Europe',
    icon: '🏥'
  },
  {
    id: 'finance-1',
    industry: 'Financial Services',
    company: 'Capital One',
    title: 'Real-time Fraud Detection',
    description: 'Capital One leverages machine learning to detect fraudulent transactions in real-time, preventing millions in losses while maintaining seamless customer experience.',
    awsServices: ['Amazon SageMaker', 'Amazon Kinesis', 'AWS Lambda', 'Amazon DynamoDB'],
    benefits: ['99.9% fraud detection accuracy', 'Real-time processing', '$50M+ fraud prevented', 'Reduced false positives'],
    region: 'North America',
    icon: '🏦'
  },
  {
    id: 'retail-1',
    industry: 'Retail & E-commerce',
    company: 'Amazon',
    title: 'Personalized Recommendations Engine',
    description: 'Amazon uses sophisticated ML algorithms to provide personalized product recommendations, driving 35% of total revenue through AI-powered suggestions.',
    awsServices: ['Amazon Personalize', 'Amazon SageMaker', 'AWS Glue', 'Amazon Redshift'],
    benefits: ['35% revenue increase', 'Enhanced customer experience', 'Improved conversion rates', 'Reduced cart abandonment'],
    region: 'Global',
    icon: '🛒'
  },
  {
    id: 'automotive-1',
    industry: 'Automotive',
    company: 'BMW Group',
    title: 'Predictive Maintenance & Quality Control',
    description: 'BMW uses AI to predict vehicle maintenance needs and ensure quality control in manufacturing, reducing downtime by 25% and improving customer satisfaction.',
    awsServices: ['Amazon SageMaker', 'AWS IoT', 'Amazon Timestream', 'Amazon QuickSight'],
    benefits: ['25% reduced downtime', 'Proactive maintenance', 'Quality improvements', 'Cost optimization'],
    region: 'Europe',
    icon: '🚗'
  },
  {
    id: 'media-1',
    industry: 'Media & Entertainment',
    company: 'Netflix',
    title: 'Content Recommendation & Video Analysis',
    description: 'Netflix uses ML to recommend content to 200M+ subscribers and automatically analyze video content for metadata extraction and quality assurance.',
    awsServices: ['Amazon Personalize', 'Amazon Rekognition Video', 'Amazon Transcribe', 'Amazon Bedrock'],
    benefits: ['80% content discovery via AI', 'Automated metadata generation', 'Enhanced user engagement', 'Global content scaling'],
    region: 'Global',
    icon: '🎬'
  },
  {
    id: 'manufacturing-1',
    industry: 'Manufacturing',
    company: 'Siemens',
    title: 'Smart Factory Optimization',
    description: 'Siemens implements AI-driven smart factory solutions using AWS to optimize production lines, reduce waste, and improve operational efficiency.',
    awsServices: ['Amazon SageMaker', 'AWS IoT Core', 'Amazon Kinesis', 'Amazon QuickSight'],
    benefits: ['30% efficiency improvement', 'Reduced waste', 'Predictive analytics', 'Real-time monitoring'],
    region: 'Europe',
    icon: '🏭'
  },
  {
    id: 'agriculture-1',
    industry: 'Agriculture',
    company: 'John Deere',
    title: 'Precision Agriculture & Crop Monitoring',
    description: 'John Deere uses computer vision and ML to enable precision agriculture, helping farmers optimize crop yields and reduce resource consumption.',
    awsServices: ['Amazon Rekognition', 'Amazon SageMaker', 'AWS IoT', 'Amazon S3'],
    benefits: ['20% yield increase', 'Reduced pesticide use', 'Optimized irrigation', 'Sustainable farming'],
    region: 'North America',
    icon: '🌾'
  },
  {
    id: 'energy-1',
    industry: 'Energy & Utilities',
    company: 'Shell',
    title: 'Predictive Maintenance for Oil Rigs',
    description: 'Shell uses AI to predict equipment failures on oil rigs and optimize energy production, preventing costly downtime and improving safety.',
    awsServices: ['Amazon SageMaker', 'AWS IoT', 'Amazon Kinesis', 'Amazon CloudWatch'],
    benefits: ['40% reduction in unplanned downtime', 'Improved safety', 'Cost savings', 'Environmental protection'],
    region: 'Global',
    icon: '⚡'
  },
  {
    id: 'logistics-1',
    industry: 'Logistics & Supply Chain',
    company: 'DHL',
    title: 'Route Optimization & Package Sorting',
    description: 'DHL uses ML algorithms to optimize delivery routes and automate package sorting, reducing delivery times and operational costs.',
    awsServices: ['Amazon SageMaker', 'Amazon Rekognition', 'AWS Lambda', 'Amazon Location Service'],
    benefits: ['25% faster deliveries', 'Reduced fuel consumption', 'Automated sorting', 'Improved customer satisfaction'],
    region: 'Global',
    icon: '📦'
  },
  {
    id: 'education-1',
    industry: 'Education',
    company: 'Pearson',
    title: 'Personalized Learning Platforms',
    description: 'Pearson creates adaptive learning experiences using AI to personalize education content and track student progress in real-time.',
    awsServices: ['Amazon Personalize', 'Amazon Comprehend', 'Amazon Polly', 'Amazon SageMaker'],
    benefits: ['Improved learning outcomes', 'Personalized content', 'Better engagement', 'Data-driven insights'],
    region: 'Global',
    icon: '📚'
  },
  {
    id: 'telecommunications-1',
    industry: 'Telecommunications',
    company: 'Verizon',
    title: 'Network Optimization & Customer Service',
    description: 'Verizon uses AI to optimize network performance, predict outages, and provide intelligent customer service through chatbots and voice assistants.',
    awsServices: ['Amazon SageMaker', 'Amazon Lex', 'Amazon Connect', 'Amazon CloudWatch'],
    benefits: ['Network reliability improvement', 'Faster issue resolution', 'Enhanced customer experience', 'Operational efficiency'],
    region: 'North America',
    icon: '📡'
  },
  {
    id: 'gaming-1',
    industry: 'Gaming',
    company: 'Epic Games',
    title: 'Game Analytics & Player Behavior',
    description: 'Epic Games leverages AI to analyze player behavior, optimize game performance, and create personalized gaming experiences across millions of users.',
    awsServices: ['Amazon SageMaker', 'Amazon Kinesis', 'AWS GameLift', 'Amazon QuickSight'],
    benefits: ['Enhanced player engagement', 'Optimized game balance', 'Reduced churn', 'Personalized experiences'],
    region: 'Global',
    icon: '🎮'
  }
];

const industryCategories = [
  { name: 'All Industries', value: 'all', count: industryUseCases.length },
  { name: 'Healthcare', value: 'healthcare', count: industryUseCases.filter(uc => uc.industry === 'Healthcare').length },
  { name: 'Financial Services', value: 'financial-services', count: industryUseCases.filter(uc => uc.industry === 'Financial Services').length },
  { name: 'Retail & E-commerce', value: 'retail', count: industryUseCases.filter(uc => uc.industry === 'Retail & E-commerce').length },
  { name: 'Manufacturing', value: 'manufacturing', count: industryUseCases.filter(uc => uc.industry === 'Manufacturing').length },
  { name: 'Media & Entertainment', value: 'media', count: industryUseCases.filter(uc => uc.industry === 'Media & Entertainment').length },
  { name: 'Other', value: 'other', count: industryUseCases.filter(uc => !['Healthcare', 'Financial Services', 'Retail & E-commerce', 'Manufacturing', 'Media & Entertainment'].includes(uc.industry)).length }
];

export default function IndustryUseCases() {
  return (
    <>
      <Head>
        <title>Industry Use Cases - AWS AI News Hub</title>
        <meta
          name="description"
          content="Discover how leading companies across industries leverage AWS AI and ML services to transform their businesses and drive innovation."
        />
      </Head>

      <MainLayout>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-aws-navy mb-4">
              Industry Use Cases
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover how leading companies across industries leverage AWS AI and ML services
              to transform their businesses, drive innovation, and achieve remarkable results.
            </p>
          </div>

          {/* Industry Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-aws-navy mb-6">Browse by Industry</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {industryCategories.map((category) => (
                <div
                  key={category.value}
                  className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="text-sm font-medium text-aws-navy">{category.name}</div>
                  <div className="text-aws-orange font-bold text-lg">{category.count}</div>
                  <div className="text-xs text-gray-500">use cases</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-r from-aws-navy to-aws-squid text-white rounded-lg p-6 text-center">
              <div className="text-3xl font-bold">{industryUseCases.length}</div>
              <div className="text-sm opacity-90">Use Cases</div>
            </div>
            <div className="bg-gradient-to-r from-aws-orange to-yellow-500 text-white rounded-lg p-6 text-center">
              <div className="text-3xl font-bold">{new Set(industryUseCases.map(uc => uc.industry)).size}</div>
              <div className="text-sm opacity-90">Industries</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 text-center">
              <div className="text-3xl font-bold">{new Set(industryUseCases.flatMap(uc => uc.awsServices)).size}</div>
              <div className="text-sm opacity-90">AWS Services</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6 text-center">
              <div className="text-3xl font-bold">{new Set(industryUseCases.map(uc => uc.region)).size}</div>
              <div className="text-sm opacity-90">Global Regions</div>
            </div>
          </div>

          {/* Use Cases Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {industryUseCases.map((useCase) => (
              <div key={useCase.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{useCase.icon}</span>
                        <span className="inline-block bg-aws-orange text-white text-xs px-2 py-1 rounded-full font-medium">
                          {useCase.industry}
                        </span>
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {useCase.region}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-aws-navy">{useCase.title}</h3>
                      <p className="text-aws-orange font-semibold">{useCase.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{useCase.description}</p>
                </div>

                {/* AWS Services */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <h4 className="font-semibold text-aws-navy mb-3">AWS Services Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {useCase.awsServices.map((service) => (
                      <span
                        key={service}
                        className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div className="px-6 py-4">
                  <h4 className="font-semibold text-aws-navy mb-3">Key Benefits</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {useCase.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-aws-navy to-aws-squid rounded-lg p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Industry?</h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of companies leveraging AWS AI and ML services to drive innovation and business growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://aws.amazon.com/machine-learning/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-aws-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Explore AWS AI Services
              </a>
              <a
                href="https://aws.amazon.com/architecture/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent border border-white hover:bg-white hover:text-aws-navy text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View Architecture Patterns
              </a>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}