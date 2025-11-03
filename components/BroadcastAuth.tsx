import React, { useState, FormEvent } from 'react';

export interface ApiKeys {
  geminiApiKey: string;
  xaiApiKey: string;
  asterdexApiKey: string;
}

interface BroadcastAuthProps {
  onAuthSuccess: (keys: ApiKeys) => void;
}

const BroadcastAuth: React.FC<BroadcastAuthProps> = ({ onAuthSuccess }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [xaiKey, setXaiKey] = useState('');
  const [asterdexKey, setAsterdexKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!geminiKey || !xaiKey || !asterdexKey) {
      setError('All three API keys are required to start the broadcast.');
      return;
    }
    setError('');
    onAuthSuccess({ 
        geminiApiKey: geminiKey, 
        xaiApiKey: xaiKey,
        asterdexApiKey: asterdexKey,
    });
  };

  return (
    <div className="flex items-center justify-center pt-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 rounded-lg shadow-lg border border-gray-700">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Start Broadcast</h2>
            <p className="mt-2 text-sm text-gray-400">
                Enter your API keys to begin the trading bot simulation. These keys are not stored and are only used for this session.
            </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-300 mb-1">
              Gemini API Key
            </label>
            <input
              id="gemini-key"
              name="gemini-key"
              type="password"
              required
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your Gemini API Key"
            />
          </div>
          <div>
             <label htmlFor="xai-key" className="block text-sm font-medium text-gray-300 mb-1">
              xAI (Grok) API Key
            </label>
            <input
              id="xai-key"
              name="xai-key"
              type="password"
              required
              value={xaiKey}
              onChange={(e) => setXaiKey(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your xAI Grok API Key"
            />
          </div>
          <div>
             <label htmlFor="asterdex-key" className="block text-sm font-medium text-gray-300 mb-1">
              ASTERDEX API Key
            </label>
            <input
              id="asterdex-key"
              name="asterdex-key"
              type="password"
              required
              value={asterdexKey}
              onChange={(e) => setAsterdexKey(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your ASTERDEX API Key"
            />
          </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              Start Bots
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BroadcastAuth;