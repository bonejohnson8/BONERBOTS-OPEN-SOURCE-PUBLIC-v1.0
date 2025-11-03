// services/asterdexService.ts
import { PROXY_URL } from '../config';
import { Market, OrderType, Position, Portfolio, Order } from '../types';
import { TRADING_SYMBOLS } from '../constants';

const API_ENDPOINT = `${PROXY_URL}/asterdex`;
const TRADE_API_ENDPOINT = `${PROXY_URL}/aster/trade`;
const EXCHANGE_INFO_ENDPOINT = `${PROXY_URL}/asterdex/exchangeInfo`;

// --- Generic API Caller for Authenticated Requests ---
async function callTradeApi(method: 'GET' | 'POST', endpoint: string, botId: string, params: object = {}) {
    if (!PROXY_URL) throw new Error("PROXY_URL is not configured.");
    
    const response = await fetch(TRADE_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, endpoint, botId, params }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(`ASTER API Error (${endpoint}): ${errorData.msg || response.statusText}`);
        } catch (e) {
            throw new Error(`ASTER API Error (${endpoint}): ${response.status} - ${errorText.substring(0, 100)}`);
        }
    }
    return response.json();
}

// --- Real Trading Functions ---

export interface SymbolPrecisionInfo {
    quantityPrecision: number;
}

export const getExchangeInfo = async (): Promise<Map<string, SymbolPrecisionInfo>> => {
    try {
        const response = await fetch(EXCHANGE_INFO_ENDPOINT);
        if (!response.ok) throw new Error(`Failed to fetch exchange info: ${response.statusText}`);
        const data = await response.json();
        const precisionMap = new Map<string, SymbolPrecisionInfo>();

        if (data && data.symbols) {
            for (const symbolInfo of data.symbols) {
                precisionMap.set(symbolInfo.symbol, {
                    quantityPrecision: symbolInfo.quantityPrecision,
                });
            }
        }
        return precisionMap;
    } catch (error) {
        console.error("Failed to get exchange info:", error);
        return new Map<string, SymbolPrecisionInfo>();
    }
};

export const getRealTradeHistory = async (botId: string): Promise<Order[]> => {
    try {
        const tradeData: any[] = await callTradeApi('GET', '/fapi/v1/userTrades', botId, { limit: 100 });
        // The API returns trades from oldest to newest, so we reverse to show newest first.
        return tradeData.reverse().map((t: any): Order => {
            const entryPrice = parseFloat(t.price);
            // This is a simplification; for accurate exit price, one would need to match trades.
            // But for history display, the realized PnL is the most crucial part.
            const exitPrice = entryPrice + (parseFloat(t.realizedPnl) / parseFloat(t.qty));

            return {
                id: t.id.toString(),
                symbol: t.symbol,
                type: t.side === 'BUY' ? OrderType.LONG : OrderType.SHORT,
                size: parseFloat(t.quoteQty),
                leverage: parseInt(t.leverage, 10) || 0, // Leverage isn't in this endpoint, default to 0
                pnl: parseFloat(t.realizedPnl),
                fee: parseFloat(t.commission),
                timestamp: t.time,
                entryPrice,
                exitPrice,
            };
        });
    } catch (error) {
        console.error(`[${botId}] Failed to get real trade history:`, error);
        return [];
    }
};


export const getRealAccountState = async (botId: string): Promise<Portfolio> => {
    try {
        const [balanceData, positionData] = await Promise.all([
            callTradeApi('GET', '/fapi/v2/balance', botId),
            callTradeApi('GET', '/fapi/v2/positionRisk', botId)
        ]);
        
        const usdtBalance = balanceData.find((b: any) => b.asset === 'USDT');
        
        const availableBalance = usdtBalance ? parseFloat(usdtBalance.availableBalance) : 0;
        
        const openPositions: Position[] = positionData
            .filter((p: any) => parseFloat(p.positionAmt) !== 0)
            .map((p: any): Position => ({
                id: p.symbol, // Use symbol as ID since there's one position per symbol
                symbol: p.symbol,
                type: parseFloat(p.positionAmt) > 0 ? OrderType.LONG : OrderType.SHORT,
                entryPrice: parseFloat(p.entryPrice),
                size: Math.abs(parseFloat(p.notional)) / parseFloat(p.leverage), // Calculate margin size
                leverage: parseFloat(p.leverage),
                liquidationPrice: parseFloat(p.liquidationPrice),
                pnl: parseFloat(p.unRealizedProfit),
        }));

        const unrealizedPnl = openPositions.reduce((acc, pos) => acc + (pos.pnl || 0), 0);
        const totalMarginUsed = openPositions.reduce((acc, pos) => acc + pos.size, 0);

        // This is the robust way to calculate total equity.
        // It's the sum of what's available, what's tied up in margin, and the current profit/loss of those positions.
        const totalValue = availableBalance + totalMarginUsed + unrealizedPnl;
        
        return {
            balance: availableBalance, // for UI: "Available Balance"
            pnl: unrealizedPnl, // for UI: "Unrealized PNL"
            totalValue: totalValue, // for UI: "Total Value" - now correctly calculated
            positions: openPositions,
        };
    } catch (error) {
        console.error(`[${botId}] Failed to get real account state:`, error);
        // Return a default empty state on failure to avoid crashing the app
        return { balance: 0, pnl: 0, totalValue: 0, positions: [] };
    }
};

export const setLeverage = async (symbol: string, leverage: number, botId: string) => {
    const cappedLeverage = Math.min(Math.max(leverage, 1), 125); // Max possible leverage is 125, but brackets are the real source of truth
    return callTradeApi('POST', '/fapi/v1/leverage', botId, { symbol, leverage: cappedLeverage });
};

export const placeRealOrder = async (params: Record<string, any>, botId: string) => {
    return callTradeApi('POST', '/fapi/v1/order', botId, params);
};


// --- Public/Simulated Functions ---

export const getMarketData = async (): Promise<Market[]> => {
  if (!PROXY_URL) {
    console.error("PROXY_URL is not configured in config.ts");
    return [];
  }
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) throw new Error(`Failed to fetch market data: ${response.statusText}`);
    const data = await response.json();
    return data
      .filter((d: any) => TRADING_SYMBOLS.includes(d.symbol))
      .map((d: any): Market => ({
        symbol: d.symbol,
        price: parseFloat(d.lastPrice),
        price24hChange: parseFloat(d.priceChangePercent),
      }));
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
};

export const executeTrade = (
  symbol: string, type: OrderType, size: number, leverage: number, entryPrice: number, stopLoss?: number, takeProfit?: number
): Position => {
  let liquidationPrice: number;
  if (type === OrderType.LONG) {
    liquidationPrice = entryPrice * (1 - (1 / leverage));
  } else {
    liquidationPrice = entryPrice * (1 + (1 / leverage));
  }
  const newPosition: Position = {
    id: `pos_${Math.random().toString(36).substring(2, 11)}`,
    symbol, type, entryPrice, size, leverage, liquidationPrice, stopLoss, takeProfit,
  };
  console.log(`[SIMULATED TRADE]`, newPosition);
  return newPosition;
};