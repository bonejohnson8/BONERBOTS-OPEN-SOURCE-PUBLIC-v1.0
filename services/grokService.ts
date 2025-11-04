import { Portfolio, Market, AiDecision, AiAction } from "../types";
import { PROXY_URL } from "../config";

const MODEL = 'grok-4-fast-latest';
const TEMPERATURE = 0.5;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_web",
      description: "Search web for breaking crypto news, ETF flows, macro events, or on-chain signals.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "search_x",
      description: "Search X for real-time sentiment, whale moves, or key account updates.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          usernames: { type: "array", items: { type: "string" } },
          since: { type: "string" }
        },
        required: ["query"]
      }
    }
  }
] as const;

const generateFullPrompt = (portfolio: Portfolio, marketData: Market[], basePrompt: string): string => {
  const market = marketData
    .map(m => ` - ${m.symbol}: $${m.price.toFixed(4)} (24h: ${m.price24hChange >= 0 ? '+' : ''}${m.price24hChange.toFixed(2)}%)`)
    .join('\n');

  const positions = portfolio.positions.length > 0
    ? portfolio.positions
        .map(p => ` - ID: ${p.id} | ${p.type} ${p.symbol} | Size: $${p.size} | Lev: ${p.leverage}x | Entry: $${p.entryPrice.toFixed(4)} | SL: $${p.stopLoss?.toFixed(4) ?? '—'} | TP: $${p.takeProfit?.toFixed(4) ?? '—'}`)
        .join('\n')
    : 'None';

  return basePrompt
    .replace('{{totalValue}}', `$${portfolio.totalValue.toFixed(2)}`)
    .replace('{{availableBalance}}', `$${portfolio.balance.toFixed(2)}`)
    .replace('{{unrealizedPnl}}', portfolio.pnl >= 0 ? `+$${portfolio.pnl.toFixed(2)}` : `-$${Math.abs(portfolio.pnl).toFixed(2)}`)
    .replace('{{openPositions}}', positions)
    .replace('{{marketData}}', market)
    + `\n\nPrice data from AsterDEX. Use tools only for external signals. Output **only** JSON array of decisions.`;
};

export const getGrokTradingDecision = async (
  portfolio: Portfolio,
  marketData: Market[],
  basePrompt: string
): Promise<{ prompt: string; decisions: AiDecision[] }> => {
  const prompt = generateFullPrompt(portfolio, marketData, basePrompt);

  if (!PROXY_URL) return { prompt, decisions: [] };

  const response = await fetch(`${PROXY_URL}/grok`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: TEMPERATURE,
      stream: false,
      tools: TOOLS,
      tool_choice: "auto"
    })
  });

  if (!response.ok) return { prompt, decisions: [] };

  const data = await response.json().catch(() => ({}));
  let content = data.choices?.[0]?.message?.content || '';

  const toolCalls = data.choices?.[0]?.message?.tool_calls;
  if (toolCalls?.length > 0) {
    content = await resolveToolCalls(toolCalls);
  }

  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return { prompt, decisions: [] };

  try {
    const decisions: AiDecision[] = JSON.parse(match[0]);
    return { prompt, decisions: decisions.filter(d => d.action !== AiAction.HOLD) };
  } catch {
    return { prompt, decisions: [] };
  }
};

const resolveToolCalls = async (toolCalls: any[]): Promise<string> => {
  return "Tool results injected. Now output only JSON array.";
};
