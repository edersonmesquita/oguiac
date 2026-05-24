'use client';

import { useState } from 'react';
import { getApiUrl } from '@/utils/api';

export default function TestPWA() {
  const [apiTest, setApiTest] = useState<string>('');
  
  const testAPI = () => {
    const url = getApiUrl('/api/categories');
    setApiTest(url);
  };

  const testPWAPrompt = () => {
    if ((window as any).showPWAInstallPrompt) {
      (window as any).showPWAInstallPrompt();
    } else {
      alert('PWA install prompt not available. The beforeinstallprompt event may not have fired yet.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PWA & API Test Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API URL Test</h2>
            <button 
              onClick={testAPI}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
            >
              Test API URL Construction
            </button>
            {apiTest && (
              <div className="mt-4">
                <p className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  {apiTest}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">PWA Install Test</h2>
            <button 
              onClick={testPWAPrompt}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Trigger PWA Install Prompt
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Note: This will only work if the PWA install prompt is available and the beforeinstallprompt event has fired.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">PWA Status</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Display Mode:</strong> {(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ? 'Standalone (PWA)' : 'Browser'}</p>
              <p><strong>Navigator Standalone:</strong> {(window.navigator as any).standalone ? 'Yes' : 'No'}</p>
              <p><strong>Service Worker:</strong> {'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 