// components/Header.tsx
import React from 'react';
import type { AppMode } from '../types';

const PauseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const PlayIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const AsterLogo: React.FC = () => (
    // Increase size and maintain aspect ratio for a cleaner look
    <img src="https://static.asterdexstatic.com/cloud-futures/static/images/aster/logo.svg" alt="ASTERDEX Logo" className="h-8 w-auto" />
);


interface HeaderProps {
    isPaused: boolean;
    onTogglePause: () => void;
    mode: AppMode;
    isBroadcasting: boolean;
    onOpenSummary: () => void;
}

const Header: React.FC<HeaderProps> = ({ isPaused, onTogglePause, mode, isBroadcasting, onOpenSummary }) => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h1 className="text-3xl font-bold text-white tracking-wider flex items-center gap-2">
              <span>BONERBOTS</span>
              <span className="text-indigo-400">ARENA</span>
              <span className="text-base font-semibold text-gray-400 flex items-center gap-1.5 border-l-2 border-gray-700 pl-3 ml-1">
                on
                <span className="flex items-center">
                    <AsterLogo />
                </span>
              </span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <button
                onClick={onOpenSummary}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700/50 hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
             >
                Project Summary
            </button>
            {mode === 'broadcast' && isBroadcasting && (
              <>
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`}></div>
                    <span className={`text-sm font-medium ${isPaused ? 'text-yellow-300' : 'text-red-400'}`}>
                        {isPaused ? 'PAUSED' : 'LIVE'}
                    </span>
                </div>
                <button
                    onClick={onTogglePause}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors ${
                    isPaused
                        ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400'
                    }`}
                    aria-live="polite"
                >
                    {isPaused ? <PlayIcon /> : <PauseIcon />}
                    <span>{isPaused ? 'Resume Bots' : 'Pause Bots'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;