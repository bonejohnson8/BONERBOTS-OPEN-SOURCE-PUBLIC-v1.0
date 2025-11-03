// cloudflare-worker.js

// This is a simplified, single-file proxy worker to handle all API requests.
// It supports a multi-wallet system by dynamically selecting API keys based on a botId.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Creates a secure HMAC-SHA256 signature for signed ASTER API requests.
 * @param {string} data - The query string to sign.
 * @param {string} secret - The API secret key.
 * @returns {Promise<string>} The hexadecimal signature string.
 */
async function createHmacSha256Signature(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves the correct API key and secret for a given bot from environment variables.
 * @param {string} botId - The identifier for the bot (e.g., 'bot_degen').
 * @param {object} env - The worker's environment variables.
 * @returns {{apiKey: string, apiSecret: string}}
 */
function getApiKeysForBot(botId, env) {
    let apiKey, apiSecret;
    switch (botId) {
        case 'bot_degen':
            apiKey = env.DEGEN_LIVE_API_KEY;
            apiSecret = env.DEGEN_LIVE_SECRET;
            break;
        case 'bot_monkey':
            apiKey = env.ESCAPED_MONKEY_API_KEY;
            apiSecret = env.ESCAPED_MONKEY_SECRET;
            break;
        case 'bot_astrologer':
            apiKey = env.ASTROLOGER_API_KEY;
            apiSecret = env.ASTROLOGER_SECRET;
            break;
        default:
            throw new Error(`No API key configuration found for botId: ${botId}`);
    }
    if (!apiKey || !apiSecret) {
        throw new Error(`API Key or Secret is missing for botId: ${botId}. Please check worker environment variables.`);
    }
    return { apiKey, apiSecret };
}


export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    let response;

    try {
      // --- ROUTE: GEMINI AI ---
      if (path === '/gemini') {
        if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured in worker secrets');
        
        const { prompt } = await request.json();
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (!geminiResponse.ok) throw new Error(`Gemini API Error: ${await geminiResponse.text()}`);
        
        const geminiData = await geminiResponse.json();
        const decisionText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        response = new Response(JSON.stringify({ text: decisionText }), { headers: { 'Content-Type': 'application/json' } });

      // --- ROUTE: GROK AI ---
      } else if (path === '/grok') {
        if (!env.XAI_API_KEY) throw new Error('XAI_API_KEY not configured in worker secrets');

        const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.XAI_API_KEY}` },
          body: request.body, // Pass client body through directly
        });
        response = new Response(grokResponse.body, { status: grokResponse.status, headers: { 'Content-Type': 'application/json' } });

      // --- ROUTE: ASTERDEX EXCHANGE INFO (for precision rules) ---
      } else if (path === '/asterdex/exchangeInfo') {
        const exchangeInfoResponse = await fetch('https://fapi.asterdex.com/fapi/v1/exchangeInfo');
        if (!exchangeInfoResponse.ok) throw new Error(`Asterdex Exchange Info Error: ${await exchangeInfoResponse.text()}`);
        response = new Response(exchangeInfoResponse.body, { headers: { 'Content-Type': 'application/json' } });

      // --- ROUTE: ASTERDEX PUBLIC MARKET DATA ---
      } else if (path === '/asterdex') {
        // This public endpoint doesn't need bot-specific keys, but we check one for general setup.
        if (!env.DEGEN_LIVE_API_KEY) throw new Error('ASTERDEX API key not configured in worker secrets');
        
        const asterdexResponse = await fetch('https://fapi.asterdex.com/fapi/v1/ticker/24hr', {
          headers: { 'X-MBX-APIKEY': env.DEGEN_LIVE_API_KEY } // Use any valid key
        });
        if (!asterdexResponse.ok) throw new Error(`Asterdex API Error: ${asterdexResponse.statusText}`);
        response = new Response(asterdexResponse.body, { headers: { 'Content-Type': 'application/json' } });
        
      // --- ROUTE: ASTER PRIVATE TRADING API ---
      } else if (path === '/aster/trade') {
        const { method, endpoint, params, botId } = await request.json();
        if (!botId) throw new Error("Request to /aster/trade must include a 'botId'.");
        
        const { apiKey, apiSecret } = getApiKeysForBot(botId, env);
        
        const timestamp = Date.now();
        const fullParams = { ...params, timestamp };

        const queryString = new URLSearchParams(fullParams).toString();
        const signature = await createHmacSha256Signature(queryString, apiSecret);
        const finalUrl = `https://fapi.asterdex.com${endpoint}?${queryString}&signature=${signature}`;
        
        const apiResponse = await fetch(finalUrl, {
            method: method,
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        
        response = new Response(apiResponse.body, { status: apiResponse.status, headers: { 'Content-Type': 'application/json' }});

      // --- NO ROUTE MATCHED ---
      } else {
        return new Response(JSON.stringify({ error: `Route not found for path: ${path}` }), {
          status: 404,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
      
      // Add CORS headers to all successful responses before returning
      const finalResponse = new Response(response.body, response);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        finalResponse.headers.set(key, value);
      }
      return finalResponse;

    } catch (error) {
      console.error(`Worker error on path ${path}:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};