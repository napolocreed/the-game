import React from 'react';

export const QuestIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 8.5A4.5 4.5 0 0 1 16.5 13a4.5 4.5 0 0 1-4.5 4.5A4.5 4.5 0 0 1 7.5 13 4.5 4.5 0 0 1 12 8.5z" />
    <path d="M12 17.5V20" />
    <path d="M12 20h-1.5v-2.5h3V20H12z" />
    <path d="M12 8.5V6" />
    <path d="M12 6a2 2 0 1 1-2-2" />
  </svg>
);
