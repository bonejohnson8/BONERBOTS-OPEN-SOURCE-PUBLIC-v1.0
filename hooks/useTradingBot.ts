// hooks/useTradingBot.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { BotState, Market, Portfolio, AiDecision, AiAction, Position, OrderType, ValueHistoryPoint, Order, BotLog, ArenaState } from '../types';
import { PAPER_BOT_INITIAL_BALANCE, LIVE_BOT_INITIAL_BALANCE, TURN_INTERVAL_MS, REFRESH_INTERVAL_MS } from '../constants';
import { getMarketData, executeTrade, getRealAccountState, placeRealOrder, setLeverage, getExchangeInfo, SymbolPrecisionInfo, getRealTradeHistory } from '../services/asterdexService';
import { getTradingDecision } from '../services/geminiService';
import { getGrokTradingDecision } from '../services/grokService';
import { DEGEN_PROMPT, ESCAPED_MONKEY_PROMPT, ASTROLOGER_PROMPT } from '../prompts';
import { supabase, isAppConfigured } from '../services/supabaseClient';
import { leverageLimits } from '../leverageLimits';

const MINIMUM_TRADE_SIZE_USD = 50;
const SYMBOL_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// Helper to create a fresh bot state
function createNewBot(id: string, name: string, prompt: string, provider: 'gemini' | 'grok', mode: 'paper' | 'real'): BotState {
    const initialBalance = mode === 'real' ? LIVE_BOT_INITIAL_BALANCE : PAPER_BOT_INITIAL_BALANCE;
    return {
        id,
        name,
        prompt,
        provider,
        tradingMode: mode,
        portfolio: {
            balance: initialBalance,
            pnl: 0,
            totalValue: initialBalance,
            positions: [],
        },
        orders: [],
        botLogs: [],
        valueHistory: [{ timestamp: Date.now(), value: initialBalance }],
        isLoading: false,
        isPaused: false,
        realizedPnl: 0,
        tradeCount: 0,
        winRate: 0,
        symbolCooldowns: {},
        getDecision: (portfolio: Portfolio, marketData: Market[]) => {
            if (provider === 'grok') {
                return getGrokTradingDecision(portfolio, marketData, prompt);
            }
            return getTradingDecision(portfolio, marketData, prompt);
        }
    };
}

// ====================================================================================
// CRITICAL CONFIGURATION: Bot Definitions
// The `id` field is the most important part of this configuration.
// It MUST EXACTLY match the prefix used for the API key secrets in your Cloudflare Worker.
// For example, `id: 'bot_degen'` requires secrets named `DEGEN_LIVE_API_KEY` and `DEGEN_LIVE_SECRET`.
// This `id` is sent with every trade request to the worker, which then selects the
// correct encrypted API keys to use for the trade.
// ====================================================================================
const botConfigs: { id: string, name: string, prompt: string, provider: 'gemini' | 'grok', mode: 'paper' | 'real' }[] = [
    { id: 'bot_degen', name: 'DEGEN LIVE', prompt: DEGEN_PROMPT, provider: 'grok', mode: 'real' },
    { id: 'bot_monkey', name: 'Escaped Monkey', prompt: ESCAPED_MONKEY_PROMPT, provider: 'gemini', mode: 'real' },
    { id: 'bot_astrologer', name: 'Astrologer', prompt: ASTROLOGER_PROMPT, provider: 'gemini', mode: 'real' },
];

const useTradingBots = (isGloballyPaused: boolean) => {
    const [bots, setBots] = useState<BotState[]>([]);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [symbolPrecisions, setSymbolPrecisions] = useState<Map<string, SymbolPrecisionInfo>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const initialBalanceRef = useRef<Map<string, number>>(new Map());


    const turnIntervalRef = useRef<number | null>(null);
    const refreshIntervalRef = useRef<number | null>(null);

    const botFunctionsRef = useRef({
        updatePortfolios: async () => {},
        runTradingTurn: async () => {}
    });

    useEffect(() => {
        const initialize = async () => {
            if (!isAppConfigured || !supabase) {
                setIsLoading(false);
                return;
            }
            const precisions = await getExchangeInfo();
            setSymbolPrecisions(precisions);
            console.log("Fetched symbol precisions:", precisions);

            const { data, error } = await supabase.from('arena_state').select('state').single();
            let initialBots: BotState[];

            if (data && data.state && (data.state as ArenaState).bots?.length > 0) {
                console.log("Resuming from saved state.");
                initialBots = (data.state as ArenaState).bots.map(savedBot => {
                    const config = botConfigs.find(c => c.id === savedBot.id)!;
                    if (!config) return null;
                    return {
                        ...savedBot,
                        tradingMode: config.mode,
                        symbolCooldowns: savedBot.symbolCooldowns || {},
                        getDecision: (portfolio: Portfolio, marketData: Market[]) => {
                            if (config.provider === 'grok') return getGrokTradingDecision(portfolio, marketData, config.prompt);
                            return getTradingDecision(portfolio, marketData, config.prompt);
                        }
                    };
                }).filter((bot): bot is BotState => bot !== null);
            } else {
                console.log("No saved state found. Starting fresh simulation.");
                if (error) console.error("Error fetching initial state:", error.message);
                initialBots = botConfigs.map(c => createNewBot(c.id, c.name, c.prompt, c.provider, c.mode));
            }

            // Perform a one-time sync for any live bot to correct its initial state and value history.
            const liveCorrectedBots = await Promise.all(initialBots.map(async (bot) => {
                if (bot.tradingMode === 'real') {
                    try {
                        console.log(`[${bot.name}] Performing initial sync with live exchange...`);
                        const realPortfolio = await getRealAccountState(bot.id);
                        const realOrders = await getRealTradeHistory(bot.id);
                        const realizedPnl = realOrders.reduce((acc, o) => acc + o.pnl, 0);

                        // FIX: Use the hardcoded initial balance for PnL calculations.
                        initialBalanceRef.current.set(bot.id, LIVE_BOT_INITIAL_BALANCE);
                        
                        // FIX: Reset the value history to start with the true current value.
                        // This prevents the chart from showing an initial drop from the default balance.
                        const correctedHistory = [{ timestamp: Date.now(), value: realPortfolio.totalValue }];

                        return {
                            ...bot,
                            portfolio: realPortfolio,
                            orders: realOrders,
                            realizedPnl: realizedPnl,
                            valueHistory: correctedHistory,
                        };
                    } catch (e) {
                        console.error(`[${bot.name}] Failed initial sync with exchange, will retry on next tick.`, e);
                        return bot;
                    }
                }
                initialBalanceRef.current.set(bot.id, PAPER_BOT_INITIAL_BALANCE);
                return bot;
            }));

            setBots(liveCorrectedBots);
            setIsLoading(false);
        };
        initialize();
    }, []);

    const getAdjustedQuantity = useCallback((symbol: string, rawQuantity: number): number => {
        const precision = symbolPrecisions.get(symbol)?.quantityPrecision ?? 3;
        const factor = Math.pow(10, precision);
        return Math.floor(rawQuantity * factor) / factor;
    }, [symbolPrecisions]);

    useEffect(() => {
        botFunctionsRef.current.updatePortfolios = async () => {
            const marketData = await getMarketData();
            if (!marketData || marketData.length === 0) return;
            setMarkets(marketData);

            const updatedBots = await Promise.all(bots.map(async (bot) => {
                let updatedPortfolio: Portfolio;
                let updatedOrders: Order[] = bot.orders;
                let updatedRealizedPnl = bot.realizedPnl;

                if (bot.tradingMode === 'real') {
                    // For real trading, ASTER is the single source of truth.
                    updatedPortfolio = await getRealAccountState(bot.id);
                    updatedOrders = await getRealTradeHistory(bot.id);
                    // Realized PnL is the sum of PnL from the official trade history.
                    updatedRealizedPnl = updatedOrders.reduce((acc, order) => acc + order.pnl, 0);

                    // Set initial balance only once to correctly calculate PnL percentage.
                    if (!initialBalanceRef.current.has(bot.id)) {
                        // FIX: Use the hardcoded initial balance for PnL calculations.
                        initialBalanceRef.current.set(bot.id, LIVE_BOT_INITIAL_BALANCE);
                    }
                } else { // Paper trading PnL update remains simulated
                    const { portfolio } = bot;
                    let unrealizedPnl = 0;
                    let totalMarginUsed = 0;
                    const updatedPositions = portfolio.positions.map(pos => {
                        const currentPrice = marketData.find(m => m.symbol === pos.symbol)?.price ?? pos.entryPrice;
                        const assetQuantity = (pos.size * pos.leverage) / pos.entryPrice;
                        const pnl = (currentPrice - pos.entryPrice) * assetQuantity * (pos.type === OrderType.LONG ? 1 : -1);
                        unrealizedPnl += pnl;
                        totalMarginUsed += pos.size;
                        return { ...pos, pnl };
                    });
                    const totalValue = portfolio.balance + totalMarginUsed + unrealizedPnl;
                    updatedPortfolio = { ...portfolio, pnl: unrealizedPnl, totalValue, positions: updatedPositions };
                }

                // The performance chart now plots the true account value over time.
                const newValueHistory: ValueHistoryPoint = { timestamp: Date.now(), value: updatedPortfolio.totalValue };
                const newHistory = [...bot.valueHistory, newValueHistory].slice(-300); // Keep history to a reasonable size
                return { ...bot, portfolio: updatedPortfolio, valueHistory: newHistory, orders: updatedOrders, realizedPnl: updatedRealizedPnl };
            }));
            setBots(updatedBots);
        };

        botFunctionsRef.current.runTradingTurn = async () => {
            for (const bot of bots) {
                if (bot.isPaused) continue;

                setBots(current => current.map(b => b.id === bot.id ? { ...b, isLoading: true } : b));
                
                const { prompt, decisions } = await bot.getDecision(bot.portfolio, markets);
                
                const notes: string[] = [];
                const validatedDecisions: { decision: AiDecision, adjustedLeverage: number }[] = [];

                decisions.forEach(decision => {
                    // Rule: Minimum trade size
                    if ((decision.action === AiAction.LONG || decision.action === AiAction.SHORT) && decision.size && decision.size < MINIMUM_TRADE_SIZE_USD) {
                        notes.push(`REJECTED ${decision.action} ${decision.symbol}: Margin $${decision.size.toFixed(2)} is below minimum of $${MINIMUM_TRADE_SIZE_USD}.`);
                        return;
                    }

                    // Rule: Symbol Cooldown
                    if ((decision.action === AiAction.LONG || decision.action === AiAction.SHORT) && decision.symbol) {
                        const cooldownEndTime = bot.symbolCooldowns[decision.symbol];
                        if (cooldownEndTime && Date.now() < cooldownEndTime) {
                            const minutesLeft = ((cooldownEndTime - Date.now()) / 60000).toFixed(1);
                            notes.push(`REJECTED ${decision.action} ${decision.symbol}: Symbol is on cooldown for ${minutesLeft} more minutes.`);
                            return;
                        }
                    }

                    // Rule: Adjust Leverage
                    let adjustedLeverage = decision.leverage || 1;
                    if ((decision.action === AiAction.LONG || decision.action === AiAction.SHORT) && decision.symbol) {
                        const maxLeverage = leverageLimits.get(decision.symbol) ?? 25;
                        if (adjustedLeverage > maxLeverage) {
                            notes.push(`NOTE: Leverage for ${decision.symbol} adjusted from ${adjustedLeverage}x to exchange max of ${maxLeverage}x.`);
                            adjustedLeverage = maxLeverage;
                        }
                    }
                    validatedDecisions.push({ decision, adjustedLeverage });
                });

                let updatedBotState: BotState = { ...bot };

                if (bot.tradingMode === 'real') {
                    for (const { decision, adjustedLeverage } of validatedDecisions) {
                        const market = markets.find(m => m.symbol === decision.symbol);
                        try {
                            if ((decision.action === AiAction.LONG || decision.action === AiAction.SHORT) && market && decision.size && decision.symbol) {
                                
                                const availableBalance = updatedBotState.portfolio.balance;
                                let tradeSize = decision.size;

                                // STAGE 1: Check if balance can even cover the minimum trade.
                                if (availableBalance < MINIMUM_TRADE_SIZE_USD) {
                                    notes.push(`REJECTED ${decision.action} ${decision.symbol}: Available balance $${availableBalance.toFixed(2)} is below the minimum trade size of $${MINIMUM_TRADE_SIZE_USD}.`);
                                    continue; // Skip this trade entirely
                                }

                                // STAGE 2: Adjust trade size if it exceeds available balance.
                                if (tradeSize > availableBalance) {
                                    notes.push(`NOTE: Trade size for ${decision.symbol} adjusted from $${tradeSize.toFixed(2)} to fit available margin of $${availableBalance.toFixed(2)}.`);
                                    tradeSize = availableBalance; // Adjust size down to what's available
                                }
                                
                                // Final check to ensure adjusted size is still valid.
                                if (tradeSize < MINIMUM_TRADE_SIZE_USD) {
                                    notes.push(`REJECTED ${decision.action} ${decision.symbol}: Adjusted trade size $${tradeSize.toFixed(2)} is below minimum of $${MINIMUM_TRADE_SIZE_USD}.`);
                                    continue;
                                }

                                // 1. Set Leverage
                                await setLeverage(decision.symbol, adjustedLeverage, bot.id);
                                
                                // 2. Open Position with MARKET order
                                const rawQuantity = (tradeSize * adjustedLeverage) / market.price;
                                const quantity = getAdjustedQuantity(decision.symbol, rawQuantity);
                                
                                if (quantity <= 0) {
                                    notes.push(`Execution Warning: Calculated quantity for ${decision.symbol} is 0.`);
                                    continue;
                                }
                                await placeRealOrder({ symbol: decision.symbol, side: decision.action === AiAction.LONG ? 'BUY' : 'SELL', type: 'MARKET', quantity }, bot.id);
                                notes.push(`SUCCESS: Opened ${decision.action} ${decision.symbol} position.`);

                                // 3. Place Stop-Loss and Take-Profit orders
                                const slTpPromises = [];
                                const orderSide = decision.action === AiAction.LONG ? 'SELL' : 'BUY';

                                if (decision.stopLoss) {
                                    slTpPromises.push(placeRealOrder({
                                        symbol: decision.symbol,
                                        side: orderSide,
                                        type: 'STOP_MARKET',
                                        stopPrice: decision.stopLoss,
                                        quantity,
                                        reduceOnly: 'true'
                                    }, bot.id));
                                }
                                if (decision.takeProfit) {
                                    slTpPromises.push(placeRealOrder({
                                        symbol: decision.symbol,
                                        side: orderSide,
                                        type: 'TAKE_PROFIT_MARKET',
                                        stopPrice: decision.takeProfit,
                                        quantity,
                                        reduceOnly: 'true'
                                    }, bot.id));
                                }
                                
                                const results = await Promise.allSettled(slTpPromises);
                                results.forEach((result, i) => {
                                    const type = i === 0 && decision.stopLoss ? 'Stop-Loss' : 'Take-Profit';
                                    if (result.status === 'fulfilled') {
                                        notes.push(`SUCCESS: ${type} order placed for ${decision.symbol}.`);
                                    } else {
                                        notes.push(`ERROR: Failed to place ${type} order for ${decision.symbol}: ${result.reason.message}`);
                                    }
                                });

                            } else if (decision.action === AiAction.CLOSE && decision.closePositionId) {
                                const posToClose = bot.portfolio.positions.find(p => p.id === decision.closePositionId);
                                if (posToClose) {
                                    const rawQuantity = Math.abs((posToClose.size * posToClose.leverage) / posToClose.entryPrice);
                                    const quantity = getAdjustedQuantity(posToClose.symbol, rawQuantity);

                                    if (quantity > 0) {
                                        await placeRealOrder({
                                            symbol: posToClose.symbol,
                                            side: posToClose.type === OrderType.LONG ? 'SELL' : 'BUY',
                                            type: 'MARKET',
                                            quantity,
                                            reduceOnly: 'true',
                                        }, bot.id);
                                        // Set cooldown after closing
                                        updatedBotState.symbolCooldowns[posToClose.symbol] = Date.now() + SYMBOL_COOLDOWN_MS;
                                        notes.push(`SUCCESS: Closed ${posToClose.symbol} position. Cooldown initiated.`);
                                    }
                                }
                            }
                        } catch (error: any) {
                            if (error.message && error.message.includes('ReduceOnly Order is rejected')) {
                                notes.push(`NOTE: Attempted to close ${decision.closePositionId}, but position no longer exists on exchange.`);
                            } else {
                                console.error(`[${bot.name}] Error executing real trade:`, decision, error);
                                notes.push(`Execution Error: ${error.message}`);
                            }
                        }
                    }
                } else { // Paper Trading Logic remains unchanged
                    // ... (existing paper trading logic)
                }

                const newLog: BotLog = { timestamp: Date.now(), decisions, prompt, notes };
                updatedBotState.botLogs = [newLog, ...updatedBotState.botLogs].slice(0, 50);
                
                setBots(current => current.map(b => b.id === bot.id ? { ...updatedBotState, isLoading: false } : b));
            }
        };
    }, [bots, markets, symbolPrecisions, getAdjustedQuantity]);

    useEffect(() => {
        if (isGloballyPaused || bots.length === 0 || isLoading) {
            if (turnIntervalRef.current) clearInterval(turnIntervalRef.current);
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            return;
        }

        botFunctionsRef.current.updatePortfolios();
        refreshIntervalRef.current = setInterval(() => botFunctionsRef.current.updatePortfolios(), REFRESH_INTERVAL_MS);
        turnIntervalRef.current = setInterval(() => botFunctionsRef.current.runTradingTurn(), TURN_INTERVAL_MS);

        return () => {
            if (turnIntervalRef.current) clearInterval(turnIntervalRef.current);
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, [isGloballyPaused, bots.length, isLoading]);

    const resetBot = (botId: string) => {
        const botToReset = bots.find(b => b.id === botId);
        if (botToReset && botToReset.tradingMode === 'real') {
            alert("Cannot reset a bot that is trading with real funds.");
            return;
        }
        if (!window.confirm("Are you sure you want to reset this bot?")) return;
        
        setBots(prev => prev.map(b => {
            if (b.id === botId) {
                const config = botConfigs.find(c => c.id === botId)!;
                initialBalanceRef.current.delete(botId);
                return createNewBot(config.id, config.name, config.prompt, config.provider, config.mode);
            }
            return b;
        }));
    };

    const manualClosePosition = async (botId: string, positionId: string) => {
        // ... (existing manual close logic)
    };

    return { bots, markets, isLoading, manualClosePosition, resetBot, toggleBotPause: () => {}, forceProcessTurn: () => {}, initialBalanceRef };
};

export default useTradingBots;
