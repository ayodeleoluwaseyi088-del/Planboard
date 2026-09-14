import React, { useState, useRef, useEffect } from 'react';
import { 
  CaretDown, 
  ShareFat, 
  User, 
  Plus, 
  FolderSimple, 
  DeviceMobile, 
  Check 
} from '@phosphor-icons/react';
import { UserPersona, PlanBoard } from '../types';

interface HeaderProps {
  currentBoard: PlanBoard;
  currentPersona: UserPersona;
  allPersonas: UserPersona[];
  allBoards?: PlanBoard[];
  onSelectBoard?: (boardId: string) => void;
  onSelectPersona: (persona: UserPersona) => void;
  onOpenMyPlans: () => void;
  onOpenCreatePlan: () => void;
  onOpenShare: () => void;
  onOpenJoinFlow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentBoard,
  currentPersona,
  allPersonas,
  allBoards = [],
  onSelectBoard,
  onSelectPersona,
  onOpenMyPlans,
  onOpenCreatePlan,
  onOpenShare,
  onOpenJoinFlow,
}) => {
  const [isBoardSwitcherOpen, setIsBoardSwitcherOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const boardSwitcherRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (boardSwitcherRef.current && !boardSwitcherRef.current.contains(target)) {
        setIsBoardSwitcherOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white px-4 sm:px-8 py-3.5 sm:py-4 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* LEFT: Board Switcher Pill matching reference */}
        <div className="relative" ref={boardSwitcherRef}>
          <button
            type="button"
            onClick={() => {
              setIsBoardSwitcherOpen((prev) => !prev);
              setIsProfileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] transition-colors text-left cursor-pointer group select-none"
            title="Switch or manage boards"
            aria-expanded={isBoardSwitcherOpen}
            aria-haspopup="true"
          >
            <span className="text-base sm:text-lg leading-none shrink-0" role="img" aria-label="Board emoji">
              {currentBoard.emoji || '📋'}
            </span>

            <span className="text-sm sm:text-[15px] font-bold text-[#1A1B25] tracking-tight truncate max-w-[150px] sm:max-w-[260px] md:max-w-[340px]">
              {currentBoard.title}
            </span>

            <CaretDown 
              weight="bold"
              size={14} 
              className={`text-[#808897] transition-transform duration-200 shrink-0 ${
                isBoardSwitcherOpen ? 'rotate-180 text-[#1A1B25]' : 'group-hover:text-[#353849]'
              }`} 
            />
          </button>

          {/* Board Switcher Dropdown */}
          {isBoardSwitcherOpen && (
            <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white border border-[#ECEFF3] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 border-b border-[#ECEFF3] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#808897] uppercase tracking-wider">
                  Switch Board
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {allBoards.length > 0 ? `${allBoards.length} Boards` : 'Active'}
                </span>
              </div>

              {/* Boards list */}
              <div className="max-h-56 overflow-y-auto py-1">
                {allBoards.length > 0 ? (
                  allBoards.map((b) => {
                    const isSelected = b.id === currentBoard.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          if (onSelectBoard && !isSelected) {
                            onSelectBoard(b.id);
                          }
                          setIsBoardSwitcherOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition cursor-pointer hover:bg-[#F6F8FA] ${
                          isSelected ? 'bg-amber-50/70 font-black text-[#1A1B25]' : 'text-[#353849]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{b.emoji || '📋'}</span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#1A1B25] text-xs">{b.title}</p>
                            <p className="text-[10px] text-[#808897] truncate">
                              {b.ownerName} · {b.members.length} members
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check size={16} weight="bold" className="text-amber-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3.5 py-2 text-xs text-[#666D80]">
                    {currentBoard.title}
                  </div>
                )}
              </div>

              {/* Bottom Actions inside Dropdown */}
              <div className="border-t border-[#ECEFF3] pt-1.5 mt-1 px-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenCreatePlan();
                    setIsBoardSwitcherOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#1A1B25] hover:bg-[#ECEFF3] transition cursor-pointer"
                >
                  <Plus size={16} weight="bold" className="text-amber-600" />
                  <span>Create New Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenMyPlans();
                    setIsBoardSwitcherOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-[#353849] hover:bg-[#F6F8FA] transition cursor-pointer"
                >
                  <FolderSimple size={16} weight="bold" className="text-[#666D80]" />
                  <span>View All Saved Plans</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Share Button & Profile Dropdown matching reference */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Share Circular Button */}
          <button
            type="button"
            onClick={onOpenShare}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] flex items-center justify-center text-[#1A1B25] transition-colors cursor-pointer active:scale-95 select-none"
            title="Share board"
            aria-label="Share board"
          >
            <ShareFat size={20} weight="regular" className="text-[#1A1B25]" />
          </button>

          {/* User Profile / Persona Circular Button */}
          <div className="relative" ref={profileDropdownRef}>
            <button 
              type="button"
              onClick={() => {
                setIsProfileMenuOpen((prev) => !prev);
                setIsBoardSwitcherOpen(false);
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] flex items-center justify-center text-[#1A1B25] transition-colors cursor-pointer active:scale-95 select-none"
              title="Profile & user switcher"
              aria-label="User profile and account switcher"
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="true"
            >
              <User size={21} weight="regular" className="text-[#1A1B25]" />
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#ECEFF3] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Active user header */}
                <div className="px-3.5 py-2.5 border-b border-[#ECEFF3] flex items-center gap-3">
                  <img 
                    src={currentPersona.avatar} 
                    alt={currentPersona.name} 
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400"
                  />
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-[#1A1B25] truncate">
                      {currentPersona.name}
                    </div>
                    <div className="text-[11px] text-[#666D80] flex items-center gap-1.5">
                      <span className="capitalize font-semibold">{currentPersona.role}</span>
                      {currentPersona.email && <span>· {currentPersona.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Persona Switcher for Testing */}
                <div className="px-3.5 pt-2 pb-1 text-[10px] font-bold text-[#808897] uppercase tracking-wider">
                  Switch Persona (Role Testing)
                </div>
                <div className="py-1">
                  {allPersonas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectPersona(p);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs hover:bg-[#F6F8FA] transition cursor-pointer ${
                        currentPersona.id === p.id ? 'bg-amber-50 font-bold text-[#1A1B25]' : 'text-[#353849]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                        <div>
                          <div className="font-semibold text-xs leading-tight">{p.name}</div>
                          <div className="text-[10px] text-[#808897] capitalize">{p.role}</div>
                        </div>
                      </div>
                      {currentPersona.id === p.id && (
                        <Check size={16} weight="bold" className="text-amber-600" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Extra Utility Actions moved here */}
                <div className="border-t border-[#ECEFF3] pt-1.5 mt-1 px-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenJoinFlow();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-amber-900 hover:bg-amber-50 font-bold transition cursor-pointer"
                  >
                    <DeviceMobile size={16} weight="bold" className="text-amber-600" />
                    <span>Test Guest Invite Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenMyPlans();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-[#353849] hover:bg-[#F6F8FA] font-bold transition cursor-pointer"
                  >
                    <FolderSimple size={16} weight="bold" className="text-[#666D80]" />
                    <span>My Saved Plans</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreatePlan();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-[#353849] hover:bg-[#F6F8FA] font-bold transition cursor-pointer"
                  >
                    <Plus size={16} weight="bold" className="text-[#666D80]" />
                    <span>Create New Plan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
