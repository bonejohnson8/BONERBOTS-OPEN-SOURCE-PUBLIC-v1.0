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
  stopLoss?: number;
  takeProfit?: number;
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
  stopLoss?: number;
  takeProfit?: number;
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
  symbolCooldowns: Record<string, number>; // Maps symbol to cooldown end timestamp
  getDecision: (portfolio: Portfolio, marketData: Market[]) => Promise<{ prompt: string, decisions: AiDecision[] }>;
}

export type SerializableBotState = Omit<BotState, 'getDecision'>;

export interface ArenaState {
  bots: SerializableBotState[];
  marketData: Market[];
}

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