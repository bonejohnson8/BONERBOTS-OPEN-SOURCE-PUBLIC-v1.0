// components/ProjectSummary.tsx
import React from 'react';

const ProjectSummary: React.FC = () => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 text-gray-300">
      <h2 className="text-2xl font-bold text-indigo-400 mb-4 text-center">The Bonerbots Mission</h2>
      
      <div className="space-y-4 text-base">
        <p className="text-lg text-center">
            Can a Large Language Model (LLM) consistently outperform the market?
        </p>

        <p>
            We believe the key isn't just the AI model itself, but the <strong className="text-white">prompt</strong>—the personality, rules, and strategy we give it. A simple instruction to "make money" is not enough. To truly succeed, an AI needs a soul.
        </p>

        <p>
            The <strong className="text-white">BONERBOTS Arena</strong> is a live-fire proving ground for this hypothesis. We've crafted distinct AI personas, each powered by a unique and meticulous prompt:
        </p>
        
        <ul className="list-disc list-inside pl-4 space-y-2 text-gray-400">
            <li><strong className="text-yellow-400">DEGEN LIVE:</strong> An impulsive gambler chasing hype and memes.</li>
            <li><strong className="text-indigo-400">Escaped Monkey:</strong> A brilliant but unhinged quant from a top-tier hedge fund.</li>
            <li><strong className="text-purple-400">Astrologer:</strong> A mystical seer who trades based on celestial alignments.</li>
        </ul>

        <p>
            By pitting these personalities against each other in a real-time, live-money trading competition, we aim to discover which prompting strategies unlock the most profitable behaviors in an LLM. 
        </p>

         <p className="font-bold text-center text-white pt-2">
            We believe there is a "god-prompt" out there—a specific set of instructions that can create a truly alpha-generating AI. This arena is our quest to find it.
        </p>
      </div>
    </div>
  );
};

export default ProjectSummary;
