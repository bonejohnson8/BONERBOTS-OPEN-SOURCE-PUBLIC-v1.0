// components/BotCard.tsx
import React from 'react';
import { BotState, AppMode, ModalContentType } from '../types';
import { botImageMap } from '../assets';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import RefreshIcon from './icons/RefreshIcon';
import ResetIcon from './icons/ResetIcon';

interface BotCardProps {
  bot: BotState;
  rank: number;
  mode: AppMode;
  initialBalance?: number;
  onOpenModal: (content: ModalContentType) => void;
  // Admin functions - only passed in broadcast mode
  onTogglePause?: () => void;
  onForceTurn?: () => void;
  onReset?: () => void;
}

const botColorMap: { [key: string]: string } = {
    'Escaped Monkey': 'border-indigo-400',
    'Mastermind': 'border-red-400',
    'DEGEN LIVE': 'border-yellow-400',
    'Astrologer': 'border-purple-400',
    'Elon Musk': 'border-sky-400',
    'Ani': 'border-orange-400',
    'Mika': 'border-violet-400',
};

const getPnlColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
};

const BotCard: React.FC<BotCardProps> = ({ bot, rank, mode, initialBalance = 10000, onOpenModal, onTogglePause, onForceTurn, onReset }) => {
    const { portfolio, realizedPnl, winRate, tradeCount, isPaused, tradingMode } = bot;
    const { totalValue, balance, pnl: unrealizedPnl } = portfolio;
    const isLive = tradingMode === 'real';

    const totalPnl = realizedPnl + unrealizedPnl;
    const totalPnlPercent = initialBalance > 0 ? ((totalValue - initialBalance) / initialBalance) * 100 : 0;
    
    return (
        <div className={`bg-gray-800/50 rounded-xl shadow-2xl border-2 ${isPaused ? 'border-yellow-500' : (isLive ? 'border-red-500' : botColorMap[bot.name] || 'border-gray-700')} p-4 space-y-3 flex flex-col`}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                    <img src={botImageMap[bot.name]} alt={bot.name} className="w-12 h-12 rounded-full border-2 border-gray-600" />
                    <div>
                        <h2 className="text-lg font-bold text-white">{bot.name}</h2>
                        <div className="flex items-center space-x-2">
                             <p className="text-xs text-gray-400">Strategy: <span className="font-semibold">{bot.provider.toUpperCase()}</span></p>
                             {isLive && <span className="bg-red-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">LIVE TRADING</span>}
                        </div>
                    </div>
                </div>
                 <div className="text-right">
                    <p className="text-2xl font-bold text-white">#{rank}</p>
                    <p className={`text-xl font-bold ${getPnlColor(totalPnl)}`}>{totalPnlPercent.toFixed(2)}%</p>
                </div>
            </div>

             {mode === 'broadcast' && (
                <div className="flex items-center justify-center space-x-3 bg-gray-900/50 p-2 rounded-md">
                    <button onClick={onTogglePause} title={isPaused ? "Resume Bot" : "Pause Bot"} className="text-gray-400 hover:text-white transition-colors">
                        {isPaused ? <PlayIcon className="h-6 w-6 text-green-400" /> : <PauseIcon className="h-6 w-6 text-yellow-400" />}
                    </button>
                     <button onClick={onForceTurn} title="Force Turn" className="text-gray-400 hover:text-white transition-colors">
                        <RefreshIcon className="h-6 w-6" />
                    </button>
                     <button onClick={onReset} disabled={isLive} title={isLive ? "Cannot reset a live bot" : "Reset Bot"} className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <ResetIcon className="h-6 w-6 text-red-400" />
                    </button>
                </div>
            )}

            {/* Portfolio Summary */}
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700 space-y-2 text-sm">
                <div className="flex justify-between items-baseline">
                    <span className="text-gray-400">TOTAL VALUE</span>
                    <span className="font-bold text-lg text-white">${(totalValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400">AVAILABLE BALANCE</span>
                    <span className="text-white font-medium">${(balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">UNREALIZED PNL</span>
                    <span className={`font-medium ${getPnlColor(unrealizedPnl)}`}>${(unrealizedPnl ?? 0).toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400">REALIZED PNL (Fee Incl.)</span>
                    <span className={`font-medium ${getPnlColor(realizedPnl)}`}>${(realizedPnl ?? 0).toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400">WIN RATE</span>
                    <span className="text-white font-medium">{(winRate * 100).toFixed(1)}% ({tradeCount} trades)</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2 text-xs pt-2 border-t border-gray-700">
                <button onClick={() => onOpenModal('positions')} className="bg-gray-700/50 hover:bg-gray-700/80 text-gray-300 py-2 rounded-md transition-colors">Positions ({bot.portfolio.positions.length})</button>
                <button onClick={() => onOpenModal('history')} className="bg-gray-700/50 hover:bg-gray-700/80 text-gray-300 py-2 rounded-md transition-colors">History ({bot.orders.length})</button>
                <button onClick={() => onOpenModal('log')} className="bg-gray-700/50 hover:bg-gray-700/80 text-gray-300 py-2 rounded-md transition-colors">AI Log</button>
                <button onClick={() => onOpenModal('info')} className="bg-gray-700/50 hover:bg-gray-700/80 text-gray-300 py-2 rounded-md transition-colors">Info</button>
            </div>
        </div>
    );
};

export default BotCard;