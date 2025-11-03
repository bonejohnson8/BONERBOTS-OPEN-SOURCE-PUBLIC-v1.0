// components/ConfigurationWarning.tsx
import React from 'react';

const ConfigurationWarning: React.FC = () => {
  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800/50 rounded-lg shadow-2xl border border-yellow-500/50 text-center">
        <div className="flex justify-center">
          <svg className="h-12 w-12 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-yellow-400">Configuration Required</h1>
        <p className="text-lg text-gray-300">
          Welcome to the BONERBOTS AI Arena! Before the simulation can begin, you need to provide some essential configuration.
        </p>
        <div className="text-left bg-gray-900/70 p-4 rounded-md border border-gray-700">
          <p className="font-semibold text-white">You must edit the <code className="bg-gray-700 text-indigo-300 px-2 py-1 rounded">config.ts</code> file in the project's root directory and provide the following:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
            <li>Your Cloudflare Worker Proxy URL</li>
            <li>Your Supabase Project URL</li>
            <li>Your Supabase Public Anon Key</li>
          </ul>
        </div>
        <p className="text-gray-400">
          These values are required to connect to the necessary APIs and the real-time data service.
        </p>
        <div>
          <a
            href="https://github.com/bonerjams/bonerbots-ai-dashboard/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Read the Setup Guide
          </a>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationWarning;
