import React from 'react';
import { motion } from 'motion/react';

export default function Logo({ className = "w-8 h-8", onClick }: { className?: string, onClick?: () => void }) {
  return (
    <motion.div 
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : 'pointer-events-none'}`}
    >
      <svg 
        viewBox="0 0 100 100" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full relative z-10"
      >
        <path d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C72.1 100 91.1 85.6 97.7 65.6H74.5C69.3 73 60.3 78 50 78C34.5 78 22 65.5 22 50C22 34.5 34.5 22 50 22C60.3 22 69.3 27 74.5 34.4H97.7C91.1 14.4 72.1 0 50 0ZM47 42H95V58H47C42.6 58 39 54.4 39 50C39 45.6 42.6 42 47 42Z" />
      </svg>
    </motion.div>
  );
}
