// components/OrderHistory.tsx
import React, { useState } from 'react';
import { Order, OrderType } from '../types';
import { LongArrowIcon } from './icons/LongArrowIcon';
import { ShortArrowIcon } from './icons/ShortArrowIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface OrderHistoryProps {
  orders: Order[];
}

const ITEMS_PER_PAGE = 10;

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentOrders = orders.slice(startIndex, endIndex);

    const getPnlColor = (value: number) => {
        if (value > 0) return 'text-green-400';
        if (value < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };


  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-300 mb-4 flex-shrink-0">Trade History</h2>
      <div className="overflow-auto flex-grow text-xs">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No completed trades yet.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-400 uppercase bg-gray-900/50 sticky top-0">
              <tr>
                <th scope="col" className="px-2 py-1.5">Symbol</th>
                <th scope="col" className="px-2 py-1.5">Type</th>
                <th scope="col" className="px-2 py-1.5 text-right">Entry</th>
                <th scope="col" className="px-2 py-1.5 text-right">Size</th>
                <th scope="col" className="px-2 py-1.5 text-right">Fee</th>
                <th scope="col" className="px-2 py-1.5 text-right">PnL</th>
                <th scope="col" className="px-2 py-1.5 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/30">
                  <td className="px-2 py-1.5 font-medium text-white">{order.symbol}</td>
                  <td className={`px-2 py-1.5 font-bold flex items-center gap-1 ${order.type === OrderType.LONG ? 'text-green-400' : 'text-red-400'}`}>
                    {order.type === OrderType.LONG ? <LongArrowIcon /> : <ShortArrowIcon />}
                  </td>
                  <td className="px-2 py-1.5 text-right">{(order.entryPrice ?? 0).toFixed(4)}</td>
                  <td className="px-2 py-1.5 text-right">${(order.size ?? 0).toLocaleString()}</td>
                  <td className="px-2 py-1.5 text-right text-gray-400">${(order.fee ?? 0).toFixed(4)}</td>
                  <td className={`px-2 py-1.5 font-medium text-right ${getPnlColor(order.pnl ?? 0)}`}>
                    {(order.pnl ?? 0).toFixed(2)}
                  </td>
                   <td className="px-2 py-1.5 text-right text-gray-500">{new Date(order.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
       {totalPages > 1 && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-700 mt-2">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white">
                <ChevronLeftIcon />
            </button>
            <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} className="disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white">
                <ChevronRightIcon />
            </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
