import { Portfolio, Market, AiDecision, AiAction } from "../types";
import { PROXY_URL } from "../config";

const generateFullPrompt = (portfolio: Portfolio, marketData: Market[], basePrompt: string): string => {
  const formattedMarketData = marketData.map(m => ` - ${m.symbol}: $${m.price.toFixed(4)} (24h change: ${m.price24hChange.toFixed(2)}%)`).join('\n');
  const formattedPositions = portfolio.positions.length > 0
    ? portfolio.positions.map(p => ` - ID: ${p.id}, Symbol: ${p.symbol}, Type: ${p.type}, Size: $${p.size}, Leverage: ${p.leverage}x, Entry: $${p.entryPrice.toFixed(4)}, SL: $${p.stopLoss?.toFixed(4)}, TP: $${p.takeProfit?.toFixed(4)}`).join('\n')
    : 'None';
  
  const currentDate = new Date().toUTCString();

  return basePrompt
    .replace('{{totalValue}}', portfolio.totalValue.toFixed(2))
    .replace('{{availableBalance}}', portfolio.balance.toFixed(2))
    .replace('{{unrealizedPnl}}', portfolio.pnl.toFixed(2))
    .replace('{{openPositions}}', formattedPositions)
    .replace('{{marketData}}', formattedMarketData)
    .replace('{{currentDate}}', currentDate);
};

export const getTradingDecision = async (portfolio: Portfolio, marketData: Market[], basePrompt: string): Promise<{ prompt: string, decisions: AiDecision[] }> => {
  const prompt = generateFullPrompt(portfolio, marketData, basePrompt);

  if (!PROXY_URL) {
    console.error("PROXY_URL is not configured in config.ts");
    return { prompt, decisions: [] };
  }
  const API_ENDPOINT = `${PROXY_URL}/gemini`;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    // Robust response handling
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Gemini proxy error: Expected JSON but received ${contentType}. Status: ${response.status}. Body: ${errorText.substring(0, 200)}`);
    }

    const responseData = await response.json();
    const decisionText = responseData.text?.trim();
    if (!decisionText) {
        return { prompt, decisions: [] };
    }

    const decisions: AiDecision[] = JSON.parse(decisionText);
    const validDecisions = decisions.filter(d => d.action !== AiAction.HOLD);
    
    return { prompt, decisions: validDecisions };

  } catch (error) {
    console.error("Error getting trading decision from Gemini via proxy:", error);
    return { prompt, decisions: [] };
  }
};