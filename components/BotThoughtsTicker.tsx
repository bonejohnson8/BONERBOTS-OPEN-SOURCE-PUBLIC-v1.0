

import React from 'react';
import { BotState } from '../types';

interface BotThoughtsTickerProps {
  bots: BotState[];
}

const BotThoughtsTicker: React.FC<BotThoughtsTickerProps> = ({ bots }) => {
  const thoughts = bots.map(bot => {
    const latestLog = bot.botLogs[0];
    let thoughtText = "Awaiting decision...";
    if (latestLog) {
      if (latestLog.decisions.length > 0) {
        thoughtText = latestLog.decisions.map(d => `${d.action} ${d.symbol || ''}: ${d.reasoning}`).join(' | ');
      } else {
        thoughtText = "HOLDING: No profitable opportunities identified.";
      }
    }
    return { name: bot.name, thought: thoughtText, id: bot.id };
  });

  const botTextColorMap: { [key: string]: string } = {
    'Escaped Monkey': 'text-indigo-400',
    'Mastermind': 'text-red-400',
    'DEGEN LIVE': 'text-yellow-400',
    'Astrologer': 'text-purple-400',
    'Elon Musk': 'text-sky-400',
    'Ani': 'text-orange-400',
    'Mika': 'text-violet-400',
  };

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 overflow-hidden whitespace-nowrap">
      <div className="flex animate-marquee-slow py-2">
        {thoughts.concat(thoughts).map((thought, index) => (
          <div key={`${thought.id}-${index}`} className="flex items-center mx-6">
            <span className={`font-bold mr-2 ${botTextColorMap[thought.name] || 'text-gray-300'}`}>{thought.name}:</span>
            <span className="text-gray-300 text-sm">{thought.thought}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BotThoughtsTicker;