

import React, { useRef, useEffect } from 'react';
import { BotLog, AiAction } from '../types';

interface LiveLogProps {
  botLogs: BotLog[];
  isLoading: boolean;
}

const LiveLog: React.FC<LiveLogProps> = ({ botLogs, isLoading }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [botLogs]);
  
  const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-300">Live AI Log</h2>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-300">Thinking...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-400">Active</span>
          </div>
        )}
      </div>
      
      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto space-y-4 pr-2 text-base">
        {botLogs.length === 0 && !isLoading ? (
          <div className="text-center py-10 text-gray-500">
            <p>Awaiting first trade evaluation...</p>
          </div>
        ) : (
          botLogs.map((log, logIndex) => {
            const hasDecisions = log.decisions.length > 0;
            const isLatest = logIndex === 0;
            return (
              <div key={log.timestamp} className={`bg-gray-900/70 p-4 rounded-md border border-gray-700 ${isLatest ? 'animate-pulse-bg' : ''}`}>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-indigo-400">
                        Decision Cycle
                    </h3>
                    <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                 </div>

                {log.notes && log.notes.length > 0 && (
                    <div className="mb-3 border-l-4 border-yellow-500 bg-yellow-500/10 p-3 rounded-r-md">
                        {log.notes.map((note, noteIndex) => (
                            <div key={noteIndex} className="flex items-start text-yellow-300">
                                <WarningIcon />
                                <p className="text-xs font-semibold">{note}</p>
                            </div>
                        ))}
                    </div>
                )}

                {!hasDecisions && (!log.notes || log.notes.length === 0) ? (
                     <div className="border-t border-gray-700 pt-3">
                        <p className="font-bold text-white">HOLD</p>
                        <p className="text-gray-400 mt-1">No profitable opportunities identified. Maintaining current positions.</p>
                    </div>
                ) : (
                    <div className="space-y-3 border-t border-gray-700 pt-3">
                        {log.decisions.map((decision, index) => (
                             <div key={index}>
                                <p className={`font-bold ${decision.action === AiAction.LONG ? 'text-green-400' : decision.action === AiAction.SHORT ? 'text-red-400' : 'text-white'}`}>
                                    {decision.action} {decision.symbol || `ID: ${decision.closePositionId?.slice(0, 8)}...`}
                                </p>
                                <p className="text-gray-400 mt-1">{decision.reasoning}</p>
                                {decision.size && <span className="text-sm text-gray-500">Size: ${decision.size.toLocaleString()} @ {decision.leverage}x</span>}
                            </div>
                        ))}
                    </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default LiveLog;