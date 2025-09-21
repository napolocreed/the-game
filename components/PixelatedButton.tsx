
import React from 'react';

interface PixelatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isIconOnly?: boolean;
}

const PixelatedButton: React.FC<PixelatedButtonProps> = ({ children, className, isIconOnly = false, ...props }) => {
  const paddingClasses = isIconOnly 
    ? 'p-3 md:px-4 md:py-2'
    : 'px-4 py-2';
  
  return (
    <button
      className={`
        ${paddingClasses}
        bg-[#6a5340] text-[#f0e9d6] 
        border-4 border-[#8a6a4f] 
        shadow-[4px_4px_0px_#1a1515]
        hover:bg-[#8a6a4f] hover:shadow-[2px_2px_0px_#1a1515]
        hover:translate-x-0.5 hover:translate-y-0.5
        active:shadow-none active:translate-x-1 active:translate-y-1
        disabled:bg-gray-700 disabled:text-gray-400 disabled:border-gray-800
        disabled:shadow-[4px_4px_0px_#111]
        disabled:cursor-not-allowed
        disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#111]
        transition-all duration-100 ease-in-out
        flex items-center justify-center
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default PixelatedButton;
