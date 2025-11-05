// types.ts

export type AppMode = 'broadcast' | 'spectator';

export type ModalContentType = 'positions' | 'history' | 'log' | 'info';

export interface Market {
  symbol: string;
  price: number;
  price24hChange: number;
}

export enum OrderType {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export interface Position {
  id: string;
  symbol: string;
  type: OrderType;
  entryPrice: number;
  size: number;
  leverage: number;
  liquidationPrice: number;
  stopLoss: number;           // REQUIRED – enforced for risk management
  takeProfit: number;         // REQUIRED – enforced for risk management
  /** IDs of the conditional STOP_MARKET / TAKE_PROFIT_MARKET orders */
  stopLossOrderId?: string;
  takeProfitOrderId?: string;
  pnl?: number;
}

export interface Portfolio {
  balance: number;
  pnl: number; // Unrealized PnL
  totalValue: number;
  positions: Position[];
}

export enum AiAction {
  LONG = 'LONG',
  SHORT = 'SHORT',
  CLOSE = 'CLOSE',
  HOLD = 'HOLD',
}

export interface AiDecision {
  action: AiAction;
  symbol?: string;
  size?: number;
  leverage?: number;
  stopLoss: number;           // REQUIRED for new positions
  takeProfit: number;         // REQUIRED for new positions
  closePositionId?: string;
  reasoning: string;
}

export interface BotLog {
  timestamp: number;
  decisions: AiDecision[];
  prompt: string;
  notes?: string[];
}

export interface Order {
  id: string;
  symbol: string;
  type: OrderType;
  size: number;
  leverage: number;
  pnl: number;
  fee: number; // The commission paid for the trade
  timestamp: number;
  entryPrice: number; // Added for win rate calculation
  exitPrice: number;
  wasStopLoss?: boolean;   // Set when closed via SL
  wasTakeProfit?: boolean; // Set when closed via TP
}

export interface ValueHistoryPoint {
  timestamp: number;
  value: number;
}

export interface BotState {
  id: string;
  name: string;
  prompt: string;
  provider: 'gemini' | 'grok';
  tradingMode: 'real' | 'paper';
  portfolio: Portfolio;
  orders: Order[];
  botLogs: BotLog[];
  valueHistory: ValueHistoryPoint[];
  isLoading: boolean;
  isPaused: boolean;
  realizedPnl: number;
  tradeCount: number;
  winRate: number;
  symbolCooldowns: Record<string, number>; // cooldown end timestamp per symbol

  /** AI decision function */
  getDecision: (portfolio: Portfolio, marketData: Market[]) => Promise<{
    prompt: string;
    decisions: AiDecision[];
  }>;

  /** ---------- NEW NON-SERIALIZABLE METHODS ---------- */
  /**
   * Cancel any existing SL/TP orders for a symbol.
   * Returns `true` if at least one order was cancelled.
   */
  cancelConditionalOrders: (symbol: string) => Promise<boolean>;

  /**
   * Close a position (market order) and automatically cancel its SL/TP.
   */
  closePosition: (positionId: string, marketPrice: number) => Promise<void>;

  /**
   * Place a new position with SL/TP and automatically cancel any prior SL/TP for the same symbol.
   */
  openPositionWithRisk: (
    decision: AiDecision,
    marketPrice: number,
    precisionMap: Map<string, SymbolPrecisionInfo>
  ) => Promise<Position>;
}

export type SerializableBotState = Omit<
  BotState,
  'getDecision' | 'cancelConditionalOrders' | 'closePosition' | 'openPositionWithRisk'
>;

export interface ArenaState {
  bots: SerializableBotState[];
  marketData: Market[];
}

/* ---------- Helper Types (used internally) ---------- */
export interface SymbolPrecisionInfo {
  quantityPrecision: number;
  pricePrecision: number;
  minQty: number;
  maxQty: number;
  stepSize: number;
}

/* ---------- Database Schema (unchanged) ---------- */
export interface Database {
  public: {
    Tables: {
      arena_state: {
        Row: {
          id: number;
          created_at: string;
          state: ArenaState | null;
        };
        Insert: {
          id?: number;
          state: ArenaState;
        };
        Update: {
          id?: number;
          state?: ArenaState;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
