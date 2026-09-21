import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Trash2,
  Crown,
  Layers,
  FolderKanban,
  UserCheck
} from 'lucide-react';
import { PlanBoard, UserPersona } from '../types';
import { getAllStoredBoards, isDummyBoard } from '../utils/boardStorage';

interface MyPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoardId: string;
  allBoards: PlanBoard[];
  onSelectBoard: (boardId: string) => void;
  onOpenCreatePlan: () => void;
  onDeleteBoard?: (boardId: string) => void;
  currentPersona: UserPersona;
}

export const MyPlansModal: React.FC<MyPlansModalProps> = ({
  isOpen,
  onClose,
  currentBoardId,
  allBoards,
  onSelectBoard,
  onOpenCreatePlan,
  onDeleteBoard,
  currentPersona,
}) => {
  const [filter, setFilter] = useState<'all' | 'created' | 'joined'>('all');
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [freshBoards, setFreshBoards] = useState<PlanBoard[]>(() => getAllStoredBoards());

  // Freshly re-sync boards from storage whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const stored = getAllStoredBoards();
      const mergedMap = new Map<string, PlanBoard>();
      stored.forEach((b) => mergedMap.set(b.id, b));
      allBoards.forEach((b) => mergedMap.set(b.id, b));
      setFreshBoards(Array.from(mergedMap.values()));
    }
  }, [isOpen, allBoards]);

  // Authenticated user identification
  const userId = currentPersona.id;
  const userName = currentPersona.name.trim().toLowerCase();

  // Filter actual boards belonging to this authenticated user
  // Strictly EXCLUDES hardcoded dummy/mock board data!
  const { createdBoards, joinedBoards, displayedBoards } = useMemo(() => {
    const created: PlanBoard[] = [];
    const joined: PlanBoard[] = [];

    for (const b of freshBoards) {
      // Exclude hardcoded dummy/mock template boards
      if (isDummyBoard(b)) {
        continue;
      }

      const isOwner =
        b.ownerId === userId ||
        (Boolean(b.ownerName) && b.ownerName.trim().toLowerCase() === userName) ||
        b.members?.some(
          (m) =>
            (m.id === userId || (Boolean(m.name) && m.name.trim().toLowerCase() === userName)) &&
            m.role === 'owner'
        );

      if (isOwner) {
        created.push(b);
      } else {
        const isMember = b.members?.some(
          (m) =>
            m.id === userId ||
            (Boolean(m.name) && m.name.trim().toLowerCase() === userName)
        );
        if (isMember) {
          joined.push(b);
        }
      }
    }

    let filtered: PlanBoard[] = [];
    if (filter === 'created') {
      filtered = created;
    } else if (filter === 'joined') {
      filtered = joined;
    } else {
      // 'all': created boards first, then joined boards
      filtered = [...created, ...joined];
    }

    return {
      createdBoards: created,
      joinedBoards: joined,
      displayedBoards: filtered,
    };
  }, [freshBoards, userId, userName, filter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#ECEFF3] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header with User Identification */}
        <div className="px-6 py-4 border-b border-[#ECEFF3] flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              📋
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-[#1A1B25]">
                  My Plans
                </h3>
                {/* Authenticated User Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-900">
                  <img
                    src={currentPersona.avatar}
                    alt={currentPersona.name}
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                  <span>{currentPersona.name}</span>
                  {currentPersona.email && (
                    <span className="text-[10px] text-amber-700 hidden sm:inline">
                      • {currentPersona.email}
                    </span>
                  )}
                  <span className="text-[9px] uppercase px-1 py-0.2 bg-amber-200 rounded font-extrabold">
                    {currentPersona.role}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#666D80] truncate mt-0.5">
                Real boards and collaborative plans belonging to your account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F6F8FA] text-[#808897] hover:text-[#1A1B25] transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Quick Stats */}
        <div className="px-6 py-3 bg-[#F8F9FB] border-b border-[#ECEFF3] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-[15px] whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                filter === 'all'
                  ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold border border-transparent'
                  : 'bg-white border border-[#DFE1E6] text-[#666D80] font-semibold hover:bg-[#F6F8FA] hover:text-[#272835]'
              }`}
            >
              <span>All Plans</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                filter === 'all' ? 'bg-[#DFE1E6] text-[#1A1B25]' : 'bg-[#ECEFF3] text-[#666D80]'
              }`}>
                {createdBoards.length + joinedBoards.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('created')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-[15px] whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                filter === 'created'
                  ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold border border-transparent'
                  : 'bg-white border border-[#DFE1E6] text-[#666D80] font-semibold hover:bg-[#F6F8FA] hover:text-[#272835]'
              }`}
            >
              <span>Created by Me</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                filter === 'created' ? 'bg-[#DFE1E6] text-[#1A1B25]' : 'bg-[#ECEFF3] text-[#666D80]'
              }`}>
                {createdBoards.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('joined')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-[15px] whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                filter === 'joined'
                  ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold border border-transparent'
                  : 'bg-white border border-[#DFE1E6] text-[#666D80] font-semibold hover:bg-[#F6F8FA] hover:text-[#272835]'
              }`}
            >
              <span>Joined</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                filter === 'joined' ? 'bg-[#DFE1E6] text-[#1A1B25]' : 'bg-[#ECEFF3] text-[#666D80]'
              }`}>
                {joinedBoards.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenCreatePlan();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-95 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Plan</span>
          </button>
        </div>

        {/* List of Real User Boards */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1">
          {displayedBoards.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#F8F9FB] rounded-2xl border border-dashed border-[#DFE1E6]">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mx-auto mb-3">
                📭
              </div>
              <h4 className="text-sm font-black text-[#1A1B25]">
                {filter === 'created'
                  ? 'No boards created by you yet'
                  : filter === 'joined'
                  ? 'No joined collaborative boards'
                  : 'No boards found for your account'}
              </h4>
              <p className="text-xs text-[#666D80] max-w-sm mx-auto mt-1 mb-4">
                {filter === 'created'
                  ? 'Start by creating your own event board to invite friends, add deciders, and organize plans together.'
                  : 'When friends invite you to their plan boards, they will show up here.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreatePlan();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1B25] hover:bg-[#272835] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Board</span>
              </button>
            </div>
          ) : (
            displayedBoards.map((b) => {
              const isCurrent = b.id === currentBoardId;
              const isOwner =
                b.ownerId === userId ||
                (Boolean(b.ownerName) && b.ownerName.trim().toLowerCase() === userName);

              const plansCount = b.plans?.length || 0;
              const membersCount = b.members?.length || 1;

              return (
                <div
                  key={b.id}
                  onClick={() => {
                    if (b.id) {
                      onSelectBoard(b.id);
                      onClose();
                    }
                  }}
                  className={`group relative p-4.5 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400 shadow-xs'
                      : 'bg-white border-[#ECEFF3] hover:border-[#DFE1E6] hover:shadow-xs'
                  }`}
                >
                  {/* Left: Emoji, Title, Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] flex items-center justify-center text-2xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {b.emoji || '📋'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black text-[#1A1B25] truncate">
                          {b.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Currently Open</span>
                          </span>
                        )}
                        {isOwner ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3 text-purple-600" />
                            <span>Creator</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>Joined Member</span>
                          </span>
                        )}
                      </div>

                      {b.description && (
                        <p className="text-xs text-[#666D80] line-clamp-1 mt-1">
                          {b.description}
                        </p>
                      )}

                      {/* Attached Plans preview tags */}
                      {b.plans && b.plans.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#808897] mr-0.5">
                            Plans:
                          </span>
                          {b.plans.slice(0, 4).map((p) => (
                            <span
                              key={p.id}
                              className="text-[10px] font-bold px-2 py-0.5 bg-[#F8F9FB] border border-[#ECEFF3] text-[#353849] rounded-md flex items-center gap-1"
                            >
                              <span>{p.emoji || '📌'}</span>
                              <span className="truncate max-w-[100px]">{p.title}</span>
                            </span>
                          ))}
                          {b.plans.length > 4 && (
                            <span className="text-[10px] font-bold text-[#808897] px-1">
                              +{b.plans.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata Row */}
                      <div className="flex items-center gap-3 text-[11px] font-bold text-[#808897] mt-2.5 flex-wrap">
                        {b.date && (
                          <>
                            <span className="flex items-center gap-1 text-[#353849]">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              <span>{b.date}</span>
                              {b.time && <span>at {b.time}</span>}
                            </span>
                            <span>•</span>
                          </>
                        )}

                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#808897]" />
                          <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
                        </span>

                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#808897]" />
                          <span>{plansCount} {plansCount === 1 ? 'plan item' : 'plan items'}</span>
                        </span>

                        {b.daysToGo !== undefined && b.daysToGo > 0 && b.date && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-black">
                              {b.daysToGo} {b.daysToGo === 1 ? 'day' : 'days'} to go
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {onDeleteBoard && isOwner && allBoards.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${b.title}"?`)) {
                            onDeleteBoard(b.id);
                          }
                        }}
                        className="p-2 rounded-xl text-[#808897] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete board"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-[#F8F9FB] group-hover:bg-[#1A1B25] text-[#353849] group-hover:text-white border border-[#DFE1E6]'
                      }`}
                    >
                      <span>{isCurrent ? 'Open' : 'Switch Board'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F8F9FB] border-t border-[#ECEFF3] flex items-center justify-between text-xs text-[#808897]">
          <span>
            {displayedBoards.length} {displayedBoards.length === 1 ? 'board' : 'boards'} available for {currentPersona.name}
          </span>
          <button
            onClick={onClose}
            className="font-bold text-[#353849] hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
