// components/Dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import useTradingBots from '../hooks/useTradingBot';
import MarketPrices from './MarketPrices';
import PerformanceChart from './PerformanceChart';
import BotCard from './BotCard';
import BotThoughtsTicker from './BotThoughtsTicker';
import Modal from './Modal';
import PositionsTable from './PositionsTable';
import OrderHistory from './OrderHistory';
import BotStatus from './BotStatus';
import InfoPane from './InfoPane';
import { updateState } from '../services/stateService';
// Fix: Imported SerializableBotState for correct type casting.
import { BotState, ArenaState, ModalContentType, SerializableBotState } from '../types';
import { PAPER_BOT_INITIAL_BALANCE, LIVE_BOT_INITIAL_BALANCE } from '../constants';

interface DashboardProps {
  isPaused: boolean;
  onBroadcastingChange: (isBroadcasting: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ isPaused, onBroadcastingChange }) => {
  const { bots, markets, isLoading, manualClosePosition, resetBot, toggleBotPause, forceProcessTurn, initialBalanceRef } = useTradingBots(isPaused);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<BotState | null>(null);
  const [modalContent, setModalContent] = useState<ModalContentType | null>(null);

  useEffect(() => {
    onBroadcastingChange(!isLoading && bots.length > 0);
  }, [isLoading, bots, onBroadcastingChange]);

  useEffect(() => {
    const sanitizeBotsForBroadcast = (botsToSanitize: BotState[]): SerializableBotState[] => {
        return botsToSanitize.map(({ getDecision, ...rest }) => rest);
    };

    if (bots.length > 0 && markets.length > 0) {
      updateState({ bots: sanitizeBotsForBroadcast(bots), marketData: markets });
    }
  }, [bots, markets]);

  const handleOpenModal = (bot: BotState, content: ModalContentType) => {
    setSelectedBot(bot);
    setModalContent(content);
    setIsModalOpen(true);
  };

  const renderModalContent = () => {
    if (!selectedBot || !modalContent) return null;
    switch (modalContent) {
        case 'positions': return <PositionsTable positions={selectedBot.portfolio.positions} markets={markets} mode="broadcast" onManualClose={(positionId) => manualClosePosition(selectedBot.id, positionId)} />;
        case 'history': return <OrderHistory orders={selectedBot.orders} />;
        case 'log': return <BotStatus botLogs={selectedBot.botLogs} isLoading={selectedBot.isLoading} />;
        case 'info': return <InfoPane bot={selectedBot} />;
        default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-400 mb-4"></div>
        <h2 className="text-2xl font-semibold text-white">Initializing Arena...</h2>
        <p className="text-gray-400 mt-2">Fetching last known state from the network. Please stand by.</p>
      </div>
    );
  }

  const sortedBots = [...bots].sort((a, b) => b.portfolio.totalValue - a.portfolio.totalValue);
  const liveBot = bots.find(b => b.tradingMode === 'real');
  const chartInitialBalance = liveBot ? initialBalanceRef.current.get(liveBot.id) : PAPER_BOT_INITIAL_BALANCE;

  return (
    <div className="space-y-6">
      <MarketPrices markets={markets} />
      <BotThoughtsTicker bots={bots} />
      <PerformanceChart 
        series={bots.map(b => ({ name: b.name, data: b.valueHistory }))} 
        initialBalance={chartInitialBalance}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedBots.map((bot, index) => (
          <BotCard 
            key={bot.id}
            mode="broadcast"
            bot={bot} 
            rank={index + 1} 
            initialBalance={initialBalanceRef.current.get(bot.id) ?? (bot.tradingMode === 'real' ? LIVE_BOT_INITIAL_BALANCE : PAPER_BOT_INITIAL_BALANCE)}
            onOpenModal={(content) => handleOpenModal(bot, content)}
            onReset={() => resetBot(bot.id)}
            onTogglePause={() => {}}
            onForceTurn={() => {}}
          />
        ))}
      </div>
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-1 sm:p-4">
          {renderModalContent()}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;