import React from 'react';

const RefreshIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-11.667 0l3.181-3.183a8.25 8.25 0 00-11.667 0l3.181 3.183" />
    </svg>
);

export default RefreshIcon;
