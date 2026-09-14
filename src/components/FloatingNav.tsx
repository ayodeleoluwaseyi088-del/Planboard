import React from 'react';
import { 
  SquaresFour, 
  ClipboardText, 
  Checks, 
  Images, 
  UsersThree 
} from '@phosphor-icons/react';
import { BoardSectionTab } from '../types';

interface FloatingNavProps {
  activeSection: BoardSectionTab;
  onChangeSection: (section: BoardSectionTab) => void;
  pendingDecisionsCount?: number;
  suggestionsCount?: number;
  openTasksCount?: number;
}

interface NavItemConfig {
  id: BoardSectionTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number | string; weight?: 'regular' | 'bold' | 'fill' | 'duotone'; className?: string }>;
  badgeCount?: number;
  description: string;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  activeSection,
  onChangeSection,
  pendingDecisionsCount = 0,
  suggestionsCount = 0,
  openTasksCount = 0,
}) => {
  const navItems: NavItemConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      shortLabel: 'Overview',
      icon: SquaresFour,
      description: 'Board overview, status & your pending actions',
    },
    {
      id: 'plan',
      label: 'The Plan',
      shortLabel: 'Plan',
      icon: ClipboardText,
      description: 'Current confirmed choices & itinerary source of truth',
    },
    {
      id: 'decisions',
      label: 'Decision & Voting',
      shortLabel: 'Decisions',
      icon: Checks,
      badgeCount: pendingDecisionsCount > 0 ? pendingDecisionsCount : undefined,
      description: 'Polls, spin wheels, blind picks & group voting',
    },
    {
      id: 'suggestions',
      label: 'Visual Suggestions',
      shortLabel: 'Suggestions',
      icon: Images,
      badgeCount: suggestionsCount > 0 ? suggestionsCount : undefined,
      description: 'Photo inspiration, venue ideas & moodboard',
    },
    {
      id: 'people_timeline',
      label: 'Responsibilities & People',
      shortLabel: 'People',
      icon: UsersThree,
      badgeCount: openTasksCount > 0 ? openTasksCount : undefined,
      description: 'Responsibilities, contributions, people & timeline',
    },
  ];

  return (
    <aside 
      aria-label="Board Section Navigation"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]"
    >
      <nav 
        className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-full bg-[#1A1B25]/95 text-white shadow-[0_14px_40px_rgba(26,27,37,0.38)] backdrop-blur-xl border border-white/10 ring-1 ring-black/20 transition-all"
        role="tablist"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              onClick={() => onChangeSection(item.id)}
              className={`relative group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none outline-none ${
                isActive
                  ? 'bg-white text-[#1A1B25] shadow-sm scale-102 font-extrabold'
                  : 'text-[#C1C7CF] hover:text-white hover:bg-white/10 active:scale-95'
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Icon 
                  size={20} 
                  weight={isActive ? 'fill' : 'bold'} 
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                {/* Badge indicator */}
                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                  <span 
                    className={`absolute -top-1.5 -right-2 px-1 min-w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center leading-none ${
                      isActive 
                        ? 'bg-amber-500 text-white shadow-xs' 
                        : 'bg-amber-400 text-[#1A1B25]'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </span>

              {/* Label - visible on tablet/desktop, and on mobile if active */}
              <span className={`transition-all duration-200 whitespace-nowrap ${
                isActive 
                  ? 'inline-block' 
                  : 'hidden md:inline-block opacity-80 group-hover:opacity-100'
              }`}>
                {item.shortLabel}
              </span>

              {/* Tooltip for desktop */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 hidden sm:block">
                <div className="bg-[#272835] text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg border border-white/10 whitespace-nowrap">
                  {item.label}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
