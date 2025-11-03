/**
 * The initial starting balance for each paper trading bot.
 */
export const PAPER_BOT_INITIAL_BALANCE = 10000;

/**
 * The definitive starting balance for each live trading bot, used for PnL % calculation.
 */
export const LIVE_BOT_INITIAL_BALANCE = 950;


/**
 * The list of cryptocurrency symbols the bots will trade.
 */
export const TRADING_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT'];

/**
 * The interval in milliseconds at which each bot makes a trading decision.
 * Set to 5 minutes to prevent overtrading and reduce API costs.
 */
export const TURN_INTERVAL_MS = 300000; // 5 minutes

/**
 * The interval in milliseconds for updating market prices and calculating portfolio PnL.
 */
export const REFRESH_INTERVAL_MS = 5000; // 5 seconds