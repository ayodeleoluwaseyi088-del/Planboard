import React from 'react';
import { Check } from 'lucide-react';

interface CornerCheckBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CornerCheckBadge: React.FC<CornerCheckBadgeProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = size === 'sm'
    ? '-top-2 -right-1.5 w-5 h-5'
    : size === 'lg'
    ? '-top-3 -right-3 w-7 h-7'
    : '-top-2.5 -right-2.5 w-6 h-6';

  const iconClasses = size === 'sm'
    ? 'w-3 h-3 stroke-[3]'
    : size === 'lg'
    ? 'w-4 h-4 stroke-[3]'
    : 'w-3.5 h-3.5 stroke-[3]';

  return (
    <div
      className={`absolute ${sizeClasses} rounded-full bg-[#EFA00E] text-white flex items-center justify-center shadow-xs z-30 pointer-events-none select-none transition-all duration-200 animate-in zoom-in-75 ${className}`}
      aria-hidden="true"
    >
      <Check className={iconClasses} />
    </div>
  );
};

interface VotedPillBadgeProps {
  label?: string;
  className?: string;
}

export const VotedPillBadge: React.FC<VotedPillBadgeProps> = ({
  label = 'Voted',
  className = '',
}) => {
  return (
    <div
      className={`absolute -top-3 right-4 sm:right-6 px-3 py-0.5 rounded-full bg-[#EFA00E] text-white text-xs font-bold shadow-xs flex items-center gap-1 z-30 pointer-events-none select-none whitespace-nowrap transition-all duration-200 animate-in zoom-in-75 ${className}`}
      aria-hidden="true"
    >
      <Check className="w-3.5 h-3.5 stroke-[3]" />
      <span>{label}</span>
    </div>
  );
};

interface YourPickPillBadgeProps {
  label?: string;
  className?: string;
}

export const YourPickPillBadge: React.FC<YourPickPillBadgeProps> = ({
  label = 'Your pick',
  className = '',
}) => {
  return (
    <div
      className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#EFA00E] text-white text-xs font-bold shadow-xs z-30 pointer-events-none select-none whitespace-nowrap transition-all duration-200 animate-in zoom-in-75 ${className}`}
      aria-hidden="true"
    >
      {label}
    </div>
  );
};

/**
 * Standard visual selection tokens matching the strict reference image:
 * - Golden-Orange Primary: #EFA00E
 * - Warm Off-white selected background: #FFF9F0
 * - 2px Solid Border
 * - Rounded-2xl corner radius
 */
export const SELECTION_TOKENS = {
  cardSelected: 'border-2 border-[#EFA00E] bg-[#FFF9F0] text-[#1A1B25]',
  cardUnselected: 'border-2 border-[#ECEFF3] bg-[#F8F9FB] text-[#353849] hover:border-[#C1C7CF]',
  pillSelected: 'rounded-full border-2 border-[#EFA00E] bg-[#FFF9F0] text-[#1A1B25]',
  pillUnselected: 'rounded-full border-2 border-[#ECEFF3] bg-[#F8F9FB] text-[#353849] hover:bg-[#ECEFF3]',
  gradientPickCard: 'border-2 border-[#EFA00E] bg-gradient-to-b from-[#F59E0B] to-[#EA580C] text-white',
};
