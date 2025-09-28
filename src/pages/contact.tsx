import { useState } from 'react';
import Head from 'next/head';
import MainLayout from '@/layouts/MainLayout';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(`[AWS AI News Hub] ${formData.subject}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n\n` +
        `Message:\n${formData.message}`
      );
      const mailtoLink = `mailto:48430273@qq.com?subject=${subject}&body=${body}`;

      // Open user's email client
      window.location.href = mailtoLink;

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us - AWS AI News Hub</title>
        <meta
          name="description"
          content="Get in touch with AWS AI News Hub. Send us your feedback, suggestions, or questions about AWS AI and ML services."
        />
      </Head>

      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-aws-navy mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have feedback, suggestions, or questions about AWS AI News Hub?
              We'd love to hear from you. Send us a message and we'll get back to you soon.
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aws-orange focus:border-transparent transition-colors"
                  placeholder="Your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aws-orange focus:border-transparent transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aws-orange focus:border-transparent transition-colors"
                  placeholder="Brief description of your inquiry"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aws-orange focus:border-transparent transition-colors resize-vertical"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-aws-orange text-white font-semibold py-3 px-6 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-aws-orange focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700 text-sm">
                    Thank you for your message! Your email client should open with the pre-filled message.
                    If it doesn't open automatically, please send your message using your preferred email application.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">
                    There was an error opening your email client. Please try again or use your preferred email application.
                  </p>
                </div>
              )}
            </form>
          </div>


          {/* Additional Information */}
          <div className="mt-12 bg-aws-lightgray rounded-lg p-6">
            <h3 className="text-lg font-semibold text-aws-navy mb-3">About AWS AI News Hub</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              AWS AI News Hub is an automated news aggregation platform that delivers the latest AWS artificial
              intelligence and machine learning updates. We aggregate content from official AWS sources including
              AWS What's New, AWS ML Blog, and AWS News Blog, featuring coverage of 35+ AWS AI services across
              9 categories with 150+ smart keywords for comprehensive content detection.
            </p>
            <p className="text-gray-700 text-sm mt-3">
              <em>Not affiliated with Amazon Web Services, Inc.</em>
            </p>
          </div>
        </div>
      </MainLayout>
    </>
  );
}