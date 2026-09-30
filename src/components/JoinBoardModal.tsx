import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Link as LinkIcon, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  Search
} from 'lucide-react';
import { PlanBoard } from '../types';

interface JoinBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBoards: PlanBoard[];
  allBoards?: PlanBoard[];
  onJoinBoard: (boardId: string) => void;
}

export const JoinBoardModal: React.FC<JoinBoardModalProps> = ({
  isOpen,
  onClose,
  availableBoards,
  allBoards = availableBoards,
  onJoinBoard,
}) => {
  const [boardInput, setBoardInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Filter public boards: Public boards appear in the available list, private boards do not
  const publicBoards = availableBoards.filter((b) => Boolean(b.isPublic));

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!boardInput.trim()) {
      setErrorMsg('Please enter a board link or board ID');
      return;
    }

    const input = boardInput.trim();
    let extractedId = input;

    // Handle full URL with query parameters like ?join=board-id or ?boardId=...
    if (input.includes('join=')) {
      extractedId = input.split('join=')[1].split('&')[0];
    } else if (input.includes('join/')) {
      extractedId = input.split('join/')[1].split('?')[0];
    } else if (input.includes('boardId=')) {
      extractedId = input.split('boardId=')[1].split('&')[0];
    } else if (input.includes('plan=')) {
      extractedId = input.split('plan=')[1].split('&')[0];
    }

    extractedId = decodeURIComponent(extractedId).trim();

    // Check against all boards (both private and public boards can be joined via direct link or ID)
    const searchableBoards = allBoards && allBoards.length > 0 ? allBoards : availableBoards;
    const matched = searchableBoards.find(
      (b) =>
        b.id === extractedId ||
        b.title.toLowerCase().trim() === extractedId.toLowerCase().trim() ||
        b.title.toLowerCase().includes(extractedId.toLowerCase())
    );

    if (matched) {
      onJoinBoard(matched.id);
      onClose();
    } else {
      setErrorMsg('Board not found. Please verify your shared board link.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[560px] max-h-[92vh] rounded-[32px] sm:rounded-[36px] shadow-2xl border border-[#ECEFF3] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-7 pb-4 border-b border-[#ECEFF3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔗</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight font-['Nunito']">
                Join a Plan Board
              </h2>
            </div>
            <p className="text-xs text-[#666D80] mt-1 font-['Nunito']">
              Join instantly via link without needing to create your own board.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* Link / Code Input Form */}
          <form onSubmit={handleInputSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-[#808897] font-['Nunito']">
              Paste Shared Board Link or ID
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-[#808897] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={boardInput}
                onChange={(e) => setBoardInput(e.target.value)}
                placeholder="e.g. planboard.app?join=board-seyis-birthday-2026"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#F8F9FB] text-xs sm:text-sm font-semibold text-[#1A1B25] border-none outline-none focus:bg-[#ECEFF3] transition font-['Nunito']"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 font-['Nunito']"
            >
              <span>Enter Board</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#ECEFF3] w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-[#808897] uppercase tracking-wider absolute font-['Nunito']">
              Or Explore Active Boards
            </span>
          </div>

          {/* Active Boards Showcase */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#808897] uppercase tracking-wider font-['Nunito']">
              Available Community Boards
            </div>

            {publicBoards.length > 0 ? (
              <div className="space-y-2.5">
                {publicBoards.map((b) => {
                  const membersCount = b.members?.length || 1;
                  const plansCount = b.plans?.length || 0;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onJoinBoard(b.id);
                        onClose();
                      }}
                      className="w-full p-4 rounded-2xl bg-[#F8F9FB] hover:bg-[#ECEFF3] text-left transition cursor-pointer flex items-center justify-between gap-3 group select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                          {b.emoji || '📋'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#1A1B25] truncate font-['Nunito']">
                            {b.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#666D80] mt-0.5 font-['Nunito']">
                            <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
                            <span>·</span>
                            <span>{plansCount} {plansCount === 1 ? 'plan' : 'plans'}</span>
                            {b.date && (
                              <>
                                <span>·</span>
                                <span>{b.date}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-3.5 py-1.5 rounded-full bg-white group-hover:bg-[#1A1B25] group-hover:text-white text-xs font-bold text-[#1A1B25] transition shrink-0 flex items-center gap-1 shadow-2xs font-['Nunito']">
                        <span>Join</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#F8F9FB] text-center">
                <p className="text-xs text-[#666D80] font-medium font-['Nunito']">
                  No public community boards available yet. Paste a private invite link above to join.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
