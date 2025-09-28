import { useState, useEffect } from 'react';

export default function UpdateBanner() {
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if we have news data to get the last updated time
    fetch('/data/news.json')
      .then(response => response.json())
      .then(data => {
        if (data.lastUpdated) {
          // Convert to Australia AEST timezone
          const updateTime = new Date(data.lastUpdated);
          const aestTime = new Intl.DateTimeFormat('en-AU', {
            timeZone: 'Australia/Sydney',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          }).format(updateTime);

          setLastUpdated(aestTime);

          // Check if the update was within the last 24 hours
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);

          // Show banner if updated within last 24 hours
          if (hoursSinceUpdate <= 24) {
            setShowBanner(true);
          }
        }
      })
      .catch(error => {
        console.error('Error fetching news data:', error);
      });
  }, []);

  if (!showBanner || !lastUpdated) {
    return null;
  }

  return (
    <div className="fixed top-16 w-full z-40 bg-aws-orange text-white text-center py-2 px-4 text-sm">
      <div className="max-w-8xl mx-auto flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>
          <strong>Site Updated!</strong> Latest AWS AI news refreshed at {lastUpdated}
        </span>
      </div>
      <button
        onClick={() => setShowBanner(false)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200 transition-colors"
        aria-label="Close banner"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}