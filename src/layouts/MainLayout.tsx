import { ReactNode, useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import UpdateBanner from '@/components/UpdateBanner';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    // Check if banner should be visible
    fetch('/data/news.json')
      .then(response => response.json())
      .then(data => {
        if (data.lastUpdated) {
          const updateTime = new Date(data.lastUpdated);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
          setBannerVisible(hoursSinceUpdate <= 24);
        }
      })
      .catch(() => setBannerVisible(false));
  }, []);

  return (
    <div className="min-h-screen bg-aws-lightgray">
      <UpdateBanner />
      <Navigation />
      <main className={bannerVisible ? 'pt-28' : 'pt-20'}>{children}</main>
      <footer className="bg-aws-navy text-white mt-16">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">AWS AI News Hub</h3>
              <p className="text-gray-300 text-sm">
                Your central source for AWS AI and machine learning updates
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://aws.amazon.com/machine-learning/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-aws-orange"
                  >
                    AWS Machine Learning
                  </a>
                </li>
                <li>
                  <a
                    href="https://aws.amazon.com/blogs/machine-learning/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-aws-orange"
                  >
                    AWS ML Blog
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.aws.amazon.com/machine-learning/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-aws-orange"
                  >
                    AWS ML Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <p className="text-gray-300 text-sm">
                Automated aggregation of AWS AI/ML announcements from official sources.
                Updated multiple times daily.
              </p>
              <p className="text-gray-400 text-xs mt-4">
                Built with Next.js • Hosted on GitHub Pages
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>
              © 2025 AWS AI News Hub. Created by <span className="text-aws-orange font-semibold">IAN QIN</span>
            </p>
            <p className="mt-2 text-xs">
              Not affiliated with Amazon Web Services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}