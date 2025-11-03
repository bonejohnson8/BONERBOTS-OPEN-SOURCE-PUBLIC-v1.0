import { Portfolio, Market, AiDecision, AiAction } from "../types";
import { PROXY_URL } from "../config";

const MODEL = 'grok-3-mini-beta';

const generateFullPrompt = (portfolio: Portfolio, marketData: Market[], basePrompt: string): string => {
  const formattedMarketData = marketData.map(m => ` - ${m.symbol}: $${m.price.toFixed(4)} (24h change: ${m.price24hChange.toFixed(2)}%)`).join('\n');
  const formattedPositions = portfolio.positions.length > 0
    ? portfolio.positions.map(p => ` - ID: ${p.id}, Symbol: ${p.symbol}, Type: ${p.type}, Size: $${p.size}, Leverage: ${p.leverage}x, Entry: $${p.entryPrice.toFixed(4)}, SL: $${p.stopLoss?.toFixed(4)}, TP: $${p.takeProfit?.toFixed(4)}`).join('\n')
    : 'None';

  return basePrompt
    .replace('{{totalValue}}', portfolio.totalValue.toFixed(2))
    .replace('{{availableBalance}}', portfolio.balance.toFixed(2))
    .replace('{{unrealizedPnl}}', portfolio.pnl.toFixed(2))
    .replace('{{openPositions}}', formattedPositions)
    .replace('{{marketData}}', formattedMarketData);
};


export const getGrokTradingDecision = async (portfolio: Portfolio, marketData: Market[], basePrompt: string): Promise<{ prompt: string, decisions: AiDecision[] }> => {
  const prompt = generateFullPrompt(portfolio, marketData, basePrompt);

  if (!PROXY_URL) {
    console.error("PROXY_URL is not configured in config.ts");
    return { prompt, decisions: [] };
  }
  const API_ENDPOINT = `${PROXY_URL}/grok`;

  try {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL,
            stream: false,
            temperature: 0.9,
        })
    });
    
    // Robust response handling
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Grok proxy error: Expected JSON but received ${contentType}. Status: ${response.status}. Body: ${errorText.substring(0, 200)}`);
    }
      
    const responseData = await response.json();
    const decisionText = responseData.choices?.[0]?.message?.content;
    
    if (!decisionText) {
      console.warn("Grok response was successful but contained no content.");
      return { prompt, decisions: [] };
    }

    const match = decisionText.match(/(\[[\s\S]*\])/);

    if (match && match[0]) {
      try {
        const jsonString = match[0];
        const decisions: AiDecision[] = JSON.parse(jsonString);
        const validDecisions = decisions.filter(d => d.action !== AiAction.HOLD);
        return { prompt, decisions: validDecisions };
      } catch (e) {
        console.error("Error parsing JSON from Grok, even after extraction:", e);
        console.error("Extracted string that failed to parse:", match[0]);
        console.error("Original response from Grok:", decisionText);
        return { prompt, decisions: [] };
      }
    } else {
      console.warn("No JSON array found in Grok's response.");
      console.warn("Original response from Grok:", decisionText);
      return { prompt, decisions: [] };
    }

  } catch (error) {
    console.error("Error getting trading decision from Grok via proxy:", error);
    return { prompt, decisions: [] };
  }
};
