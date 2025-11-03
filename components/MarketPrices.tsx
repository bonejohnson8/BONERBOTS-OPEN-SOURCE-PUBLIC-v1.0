
import React from 'react';
import { Market } from '../types';

interface MarketPricesProps {
  markets: Market[];
}

const MarketPrices: React.FC<MarketPricesProps> = ({ markets }) => {
    const getChangeColor = (value: number) => {
        if (value > 0) return 'text-green-400';
        if (value < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 shadow-lg border border-gray-700 mb-8 overflow-x-hidden whitespace-nowrap">
            <div className="flex animate-marquee">
                {markets.concat(markets).map((market, index) => (
                    <div key={`${market.symbol}-${index}`} className="flex items-center space-x-4 mx-6">
                        <span className="font-semibold text-white">{market.symbol}</span>
                        <span className="text-gray-300">${market.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                        <span className={`text-sm font-medium ${getChangeColor(market.price24hChange)}`}>
                            {market.price24hChange >= 0 ? '+' : ''}{market.price24hChange.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketPrices;