// services/asterdexService.ts
import { PROXY_URL } from '../config';
import {
  Market,
  OrderType,
  Position,
  Portfolio,
  Order,
  AiDecision,
  SymbolPrecisionInfo,
} from '../types';
import { TRADING_SYMBOLS } from '../constants';

const API_ENDPOINT = `${PROXY_URL}/asterdex`;
const TRADE_API_ENDPOINT = `${PROXY_URL}/aster/trade`;
const EXCHANGE_INFO_ENDPOINT = `${PROXY_URL}/asterdex/exchangeInfo`;

// --- Generic API Caller ---
async function callTradeApi(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  botId: string,
  params: object = {}
) {
  if (!PROXY_URL) throw new Error('PROXY_URL is not configured.');

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
    } catch {
      throw new Error(`ASTER API Error (${endpoint}): ${response.status} - ${errorText.substring(0, 100)}`);
    }
  }
  return response.json();
}

// --- Exchange Info ---
export const getExchangeInfo = async (): Promise<Map<string, SymbolPrecisionInfo>> => {
  try {
    const response = await fetch(EXCHANGE_INFO_ENDPOINT);
    if (!response.ok) throw new Error(`Failed to fetch exchange info: ${response.statusText}`);
    const data = await response.json();
    const precisionMap = new Map<string, SymbolPrecisionInfo>();

    if (data && data.symbols) {
      for (const s of data.symbols) {
        const lotSize = (s.filters || []).find((f: any) => f.filterType === 'LOT_SIZE') || {};
        const priceFilter = (s.filters || []).find((f: any) => f.filterType === 'PRICE_FILTER') || {};

        precisionMap.set(s.symbol, {
          quantityPrecision: s.quantityPrecision,
          pricePrecision: s.pricePrecision,
          minQty: parseFloat(lotSize.minQty || '0'),
          maxQty: parseFloat(lotSize.maxQty || '0'),
          stepSize: parseFloat(lotSize.stepSize || '0'),
        });
      }
    }
    return precisionMap;
  } catch (error) {
    console.error('Failed to get exchange info:', error);
    return new Map();
  }
};

// --- Helpers ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function roundToPrecision(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

function calculateLiquidationPrice(entry: number, lev: number, type: OrderType): number {
  const buffer = 0.005; // 0.5% maintenance margin
  return type === OrderType.LONG
    ? entry * (1 - 1 / lev - buffer)
    : entry * (1 + 1 / lev + buffer);
}

// --- Real Trading: Account & History ---
export const getRealTradeHistory = async (botId: string): Promise<Order[]> => {
  try {
    const tradeData: any[] = await callTradeApi('GET', '/fapi/v1/userTrades', botId, { limit: 100 });
    return tradeData.reverse().map((t: any): Order => {
      const entryPrice = parseFloat(t.price);
      const exitPrice = entryPrice + parseFloat(t.realizedPnl) / parseFloat(t.qty);

      return {
        id: t.id.toString(),
        symbol: t.symbol,
        type: t.side === 'BUY' ? OrderType.LONG : OrderType.SHORT,
        size: parseFloat(t.quoteQty),
        leverage: parseInt(t.leverage, 10) || 0,
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
      callTradeApi('GET', '/fapi/v2/positionRisk', botId),
    ]);

    const usdtBalance = balanceData.find((b: any) => b.asset === 'USDT');
    const availableBalance = usdtBalance ? parseFloat(usdtBalance.availableBalance) : 0;

    const openPositions: Position[] = positionData
      .filter((p: any) => parseFloat(p.positionAmt) !== 0)
      .map((p: any): Position => ({
        id: p.symbol,
        symbol: p.symbol,
        type: parseFloat(p.positionAmt) > 0 ? OrderType.LONG : OrderType.SHORT,
        entryPrice: parseFloat(p.entryPrice),
        size: Math.abs(parseFloat(p.notional)) / parseFloat(p.leverage),
        leverage: parseFloat(p.leverage),
        liquidationPrice: parseFloat(p.liquidationPrice),
        pnl: parseFloat(p.unRealizedProfit),
        stopLoss: parseFloat(p.stopLoss || 0) || undefined,
        takeProfit: parseFloat(p.takeProfit || 0) || undefined,
        stopLossOrderId: p.stopLossOrderId,
        takeProfitOrderId: p.takeProfitOrderId,
      }));

    const unrealizedPnl = openPositions.reduce((acc, pos) => acc + (pos.pnl || 0), 0);
    const totalMarginUsed = openPositions.reduce((acc, pos) => acc + pos.size, 0);
    const totalValue = availableBalance + totalMarginUsed + unrealizedPnl;

    return {
      balance: availableBalance,
      pnl: unrealizedPnl,
      totalValue,
      positions: openPositions,
    };
  } catch (error) {
    console.error(`[${botId}] Failed to get real account state:`, error);
    return { balance: 0, pnl: 0, totalValue: 0, positions: [] };
  }
};

export const setLeverage = async (symbol: string, leverage: number, botId: string) => {
  const capped = Math.min(Math.max(leverage, 1), 125);
  return callTradeApi('POST', '/fapi/v1/leverage', botId, { symbol, leverage: capped });
};

// --- SL/TP Cancellation ---
export const cancelConditionalOrder = async (
  botId: string,
  symbol: string,
  orderId?: string
): Promise<boolean> => {
  if (!orderId) return false;
  try {
    await callTradeApi('DELETE', '/fapi/v1/order', botId, { symbol, orderId });
    return true;
  } catch (error) {
    console.warn(`[${botId}] Failed to cancel order ${orderId} for ${symbol}:`, error);
    return false;
  }
};

// --- Unified Trade Execution with Full SL/TP Lifecycle ---
export const executeTrade = async (
  botId: string,
  decision: AiDecision,
  marketPrice: number,
  precisionMap: Map<string, SymbolPrecisionInfo>,
  tradingMode: 'real' | 'paper' = 'paper',
  existingPositions: Position[] = []
): Promise<Position> => {
  const { symbol, action, size, leverage = 1, stopLoss, takeProfit } = decision;
  if (!symbol || !size || !stopLoss || !takeProfit) {
    throw new Error('Missing required fields in decision');
  }

  const info = precisionMap.get(symbol) || {
    quantityPrecision: 3,
    pricePrecision: 2,
    stepSize: 0.001,
  };
  const qty = roundToPrecision(size, info.quantityPrecision);
  const sl = roundToPrecision(stopLoss, info.pricePrecision);
  const tp = roundToPrecision(takeProfit, info.pricePrecision);

  const side = action === 'LONG' ? 'BUY' : 'SELL';
  const closeSide = action === 'LONG' ? 'SELL' : 'BUY';

  // --- 1. Cancel any existing SL/TP for this symbol ---
  const existingPos = existingPositions.find(p => p.symbol === symbol);
  if (existingPos) {
    if (tradingMode === 'real') {
      await Promise.all([
        cancelConditionalOrder(botId, symbol, existingPos.stopLossOrderId),
        cancelConditionalOrder(botId, symbol, existingPos.takeProfitOrderId),
      ]);
    }
    // Remove old position
    const idx = existingPositions.indexOf(existingPos);
    if (idx > -1) existingPositions.splice(idx, 1);
  }

  if (tradingMode === 'paper') {
    return simulateTrade(symbol, action, qty, leverage, marketPrice, sl, tp);
  }

  // --- 2. REAL TRADING: Set Leverage ---
  try {
    await setLeverage(symbol, leverage, botId);
    await delay(100);
  } catch (e) {
    console.warn(`[${botId}] Leverage set failed, continuing...`, e);
  }

  // --- 3. Open Position ---
  let openOrderId: string;
  try {
    const resp = await callTradeApi('POST', '/fapi/v1/order', botId, {
      symbol,
      side,
      type: 'MARKET',
      quantity: qty,
      reduceOnly: false,
    });
    openOrderId = resp.orderId;
    await delay(100);
  } catch (error) {
    console.error(`[${botId}] Failed to open position:`, error);
    throw error;
  }

  // --- 4. Place SL (STOP_MARKET) ---
  let slOrderId: string | undefined;
  try {
    const resp = await callTradeApi('POST', '/fapi/v1/order', botId, {
      symbol,
      side: closeSide,
      type: 'STOP_MARKET',
      stopPrice: sl,
      closePosition: true,
      reduceOnly: true,
      timeInForce: 'GTE_GTC',
    });
    slOrderId = resp.orderId;
    await delay(100);
  } catch (error) {
    console.warn(`[${botId}] SL failed, continuing without:`, error);
  }

  // --- 5. Place TP (TAKE_PROFIT_MARKET) ---
  let tpOrderId: string | undefined;
  try {
    const resp = await callTradeApi('POST', '/fapi/v1/order', botId, {
      symbol,
      side: closeSide,
      type: 'TAKE_PROFIT_MARKET',
      stopPrice: tp,
      closePosition: true,
      reduceOnly: true,
      timeInForce: 'GTE_GTC',
    });
    tpOrderId = resp.orderId;
  } catch (error) {
    console.warn(`[${botId}] TP failed, continuing without:`, error);
  }

  // --- 6. Return Position with Order IDs ---
  return {
    id: `${symbol}_${Date.now()}`,
    symbol,
    type: action,
    entryPrice: marketPrice,
    size: qty,
    leverage,
    liquidationPrice: calculateLiquidationPrice(marketPrice, leverage, action),
    stopLoss: sl,
    takeProfit: tp,
    stopLossOrderId: slOrderId,
    takeProfitOrderId: tpOrderId,
    pnl: 0,
  };
};

// --- Close Position (Manual or AI) ---
export const closePosition = async (
  botId: string,
  position: Position,
  marketPrice: number,
  tradingMode: 'real' | 'paper' = 'paper'
): Promise<void> => {
  if (tradingMode === 'paper') {
    // Just remove from portfolio
    return;
  }

  const side = position.type === OrderType.LONG ? 'SELL' : 'BUY';

  try {
    // 1. Cancel SL/TP first
    await Promise.all([
      cancelConditionalOrder(botId, position.symbol, position.stopLossOrderId),
      cancelConditionalOrder(botId, position.symbol, position.takeProfitOrderId),
    ]);

    // 2. Close position
    await callTradeApi('POST', '/fapi/v1/order', botId, {
      symbol: position.symbol,
      side,
      type: 'MARKET',
      quantity: position.size,
      reduceOnly: true,
    });
  } catch (error) {
    console.error(`[${botId}] Failed to close position:`, error);
    throw error;
  }
};

// --- Paper Trade Simulation ---
function simulateTrade(
  symbol: string,
  type: OrderType,
  size: number,
  leverage: number,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): Position {
  const liquidationPrice = calculateLiquidationPrice(entryPrice, leverage, type);
  const position: Position = {
    id: `sim_${symbol}_${Date.now()}`,
    symbol,
    type,
    entryPrice,
    size,
    leverage,
    liquidationPrice,
    stopLoss,
    takeProfit,
    pnl: 0,
  };
  console.log(`[PAPER] ${type} ${symbol} @ ${entryPrice} | SL: ${stopLoss} | TP: ${takeProfit}`);
  return position;
}

// --- Market Data ---
export const getMarketData = async (): Promise<Market[]> => {
  if (!PROXY_URL) {
    console.error('PROXY_URL is not configured in config.ts');
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
    console.error('Error fetching market data:', error);
    return [];
  }
};
