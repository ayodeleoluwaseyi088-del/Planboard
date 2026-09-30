import React from 'react';

interface SquadlinkLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export const SquadlinkLogo: React.FC<SquadlinkLogoProps> = ({
  className = "flex items-center gap-2.5",
  iconClassName = "w-7 h-7 text-[#1A1B25]",
  textClassName = "text-xl sm:text-[22px] font-black text-[#1A1B25] tracking-tight font-['Nunito']",
  showText = true,
}) => {
  return (
    <div className={className}>
      <svg 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={iconClassName}
        aria-hidden="true"
      >
        {/* Head / pin circle */}
        <circle cx="16" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
        
        {/* Upper handlebar / crossbar */}
        <path d="M10 13.5L22 11.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Left and right support struts */}
        <path d="M12.5 13.5L11 18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M19.5 12L18 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Sled / board base (rounded capsule tilted at -10deg) */}
        <rect 
          x="3.5" 
          y="18.5" 
          width="25" 
          height="5.5" 
          rx="2.75" 
          transform="rotate(-9 3.5 18.5)" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          fill="none" 
        />
      </svg>
      {showText && (
        <span className={textClassName}>
          Squadlink
        </span>
      )}
    </div>
  );
};
