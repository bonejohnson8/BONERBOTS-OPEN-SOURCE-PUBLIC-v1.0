// components/PositionsTable.tsx
import React from 'react';
import { Position, OrderType, AppMode, Market } from '../types';
import { LongArrowIcon } from './icons/LongArrowIcon';
import { ShortArrowIcon } from './icons/ShortArrowIcon';

interface PositionsTableProps {
  positions: Position[];
  mode: AppMode;
  markets: Market[];
  onManualClose?: (positionId: string) => void;
}

const PositionsTable: React.FC<PositionsTableProps> = ({ positions, mode, markets, onManualClose }) => {
  const getPnlColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };
  
  const handleCloseClick = (positionId: string) => {
    if (onManualClose && window.confirm('Are you sure you want to manually close this position?')) {
        onManualClose(positionId);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-300 mb-4 flex-shrink-0">Open Positions</h2>
      <div className="overflow-auto flex-grow text-xs">
        {positions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No open positions.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-400 uppercase bg-gray-900/50 sticky top-0">
              <tr>
                <th scope="col" className="px-2 py-1.5">Symbol</th>
                <th scope="col" className="px-2 py-1.5">Type</th>
                <th scope="col" className="px-2 py-1.5 text-right">Size</th>
                <th scope="col" className="px-2 py-1.5 text-right">Entry</th>
                <th scope="col" className="px-2 py-1.5 text-right">Mark Price</th>
                <th scope="col" className="px-2 py-1.5 text-right">Liq. Price</th>
                <th scope="col" className="px-2 py-1.5 text-right">PnL</th>
                {mode === 'broadcast' && <th scope="col" className="px-2 py-1.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {positions.map((pos) => {
                const marketPrice = markets.find(m => m.symbol === pos.symbol)?.price;
                return (
                  <tr key={pos.id} className="hover:bg-gray-700/30">
                    <td className="px-2 py-1.5 font-medium text-white">{pos.symbol}</td>
                    <td className={`px-2 py-1.5 font-bold flex items-center gap-1 ${pos.type === OrderType.LONG ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.type === OrderType.LONG ? <LongArrowIcon /> : <ShortArrowIcon />}
                    </td>
                    <td className="px-2 py-1.5 text-right">${(pos.size ?? 0).toLocaleString()} <span className="text-gray-500">({pos.leverage}x)</span></td>
                    <td className="px-2 py-1.5 text-right">{(pos.entryPrice ?? 0).toFixed(4)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-300">{(marketPrice ?? 0).toFixed(4)}</td>
                    <td className="px-2 py-1.5 text-right text-yellow-400">{(pos.liquidationPrice ?? 0).toFixed(4)}</td>
                    <td className={`px-2 py-1.5 font-medium text-right ${getPnlColor(pos.pnl ?? 0)}`}>
                      {(pos.pnl ?? 0).toFixed(2)}
                    </td>
                    {mode === 'broadcast' && (
                      <td className="px-2 py-1.5 text-right">
                          <button 
                              onClick={() => handleCloseClick(pos.id)}
                              className="text-red-400 hover:text-red-300 font-semibold"
                          >
                              Close
                          </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PositionsTable;