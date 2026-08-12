import React from 'react';

export const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 8.625c-.62-.545-1.437-.875-2.325-.875-1.864 0-3.375 1.455-3.375 3.25v2c0 1.795 1.511 3.25 3.375 3.25.888 0 1.705-.33 2.325-.875M7.5 12h4.5" />
  </svg>
);
