import React, { useState } from 'react';
// Fix: Replaced the non-existent 'CORS_PROXY_URL' with 'PROXY_URL' to resolve the module import error.
// The proxied URL has been updated to use the correct path (`/grok`) consistent with the application's Cloudflare Worker configuration.
import { PROXY_URL } from '../config';

const PROXIED_URL = `${PROXY_URL}/grok`;
const MODEL = 'grok-3-mini-beta';

interface GrokTesterProps {
    apiKey: string;
}

const GrokTester: React.FC<GrokTesterProps> = ({ apiKey }) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!apiKey) {
        setError("API Key is not provided.");
        return;
    }
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch(PROXIED_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: "Please respond with only the word 'Hello' and nothing else." }],
          model: MODEL,
          stream: false,
          temperature: 0.1,
        })
      });

      const responseBodyText = await res.text();

      if (!res.ok) {
        throw new Error(`Grok API error (via proxy): ${res.status} - ${responseBodyText}`);
      }
      
      const responseData = JSON.parse(responseBodyText);
      const content = responseData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("API response was successful but contained no content.");
      }

      setResponse(content);

    } catch (err: any) {
      console.error("Grok tester error:", err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-2xl w-full max-w-md z-50">
      <h3 className="text-lg font-bold text-sky-400 mb-2">Grok API Proxy Tester</h3>
      <p className="text-sm text-gray-400 mb-4">Use this to test if your xAI API key is working correctly via the CORS proxy.</p>
      <button
        onClick={handleTest}
        disabled={loading || !apiKey}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {loading ? 'Testing...' : 'Run Grok API Test'}
      </button>
      <div className="mt-4 bg-gray-900 rounded p-3 h-32 overflow-y-auto">
        <pre className="text-sm whitespace-pre-wrap font-mono">
          {loading && <span className="text-yellow-400 animate-pulse">Waiting for response...</span>}
          {error && <code className="text-red-400">{`Error: ${error}`}</code>}
          {response && <code className="text-green-400">{`Success! Response:\n${response}`}</code>}
          {!loading && !error && !response && <code className="text-gray-500">{apiKey ? 'Test results will appear here.' : 'Enter API keys to enable test.'}</code>}
        </pre>
      </div>
    </div>
  );
};

export default GrokTester;