// components/InfoPane.tsx
import React, { useState } from 'react';
import { BotState } from '../types';
import { walletAddresses } from '../walletAddresses';

interface InfoPaneProps {
  bot: BotState;
}

const ExternalLinkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const InfoPane: React.FC<InfoPaneProps> = ({ bot }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const walletAddress = walletAddresses.get(bot.name);

  const toggleExpansion = () => setIsExpanded(!isExpanded);

  const formattedPrompt = bot.prompt
    ? bot.prompt
        .replace(/\{\{.*?\}\}/g, (match) => `<span class="text-yellow-400">${match}</span>`)
        .replace(/\n/g, '<br />')
    : 'Prompt not available.';

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-300">AI Strategy & Data</h2>
      </div>
      
      {walletAddress && (
        <div className="mb-4">
            <h3 className="text-md font-semibold text-gray-300 mb-1">Live Wallet Address</h3>
            <a 
                href={`https://bscscan.com/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 font-mono bg-gray-900/70 p-2 rounded-md inline-flex items-center hover:bg-gray-900 transition-colors"
            >
                {walletAddress}
                <ExternalLinkIcon />
            </a>
        </div>
      )}

      <h3 className="text-md font-semibold text-gray-300 mb-2 flex-shrink-0">Base Prompt</h3>
      <div className={`overflow-y-auto flex-grow text-xs text-gray-400 font-mono pr-2 space-y-2 ${isExpanded ? '' : 'max-h-24'}`}>
        <div dangerouslySetInnerHTML={{ __html: formattedPrompt }} />
      </div>
       <div className="pt-2 border-t border-gray-700 mt-2">
            <button onClick={toggleExpansion} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
                {isExpanded ? 'Show Less' : 'Show Full Prompt...'}
            </button>
       </div>
    </div>
  );
};

export default InfoPane;
