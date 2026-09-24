import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  CaretDown, 
  CaretRight,
  ShareFat, 
  User, 
  Plus, 
  FolderSimple, 
  DeviceMobile, 
  Check,
  MagnifyingGlass,
  Trash,
  Crown,
  LinkSimple,
  Stack,
  Users
} from '@phosphor-icons/react';
import { Pencil } from 'lucide-react';
import { UserPersona, PlanBoard } from '../types';
import { getAllStoredBoards } from '../utils/boardStorage';

interface HeaderProps {
  currentBoard: PlanBoard;
  currentPersona: UserPersona;
  boardPersona?: UserPersona;
  allPersonas: UserPersona[];
  allBoards?: PlanBoard[];
  onSelectBoard?: (boardId: string) => void;
  onSelectPersona: (persona: UserPersona) => void;
  onOpenMyPlans: () => void;
  onOpenCreatePlan: () => void;
  onOpenShare: () => void;
  onOpenJoinFlow: () => void;
  onDeleteBoard?: (boardId: string) => void;
  onOpenUserProfile?: (persona: UserPersona) => void;
  onEditBoard?: (board: PlanBoard) => void;
  onNavigateToOwnerView?: () => void;
  onNavigateToMemberView?: (memberPersona: UserPersona) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentBoard,
  currentPersona,
  boardPersona,
  allPersonas,
  allBoards = [],
  onSelectBoard,
  onSelectPersona,
  onOpenMyPlans,
  onOpenCreatePlan,
  onOpenShare,
  onOpenJoinFlow,
  onDeleteBoard,
  onOpenUserProfile,
  onEditBoard,
  onNavigateToOwnerView,
  onNavigateToMemberView,
}) => {
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [boardFilter, setBoardFilter] = useState<'all' | 'created' | 'joined'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const boardSwitcherRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close popup modal on Escape key
  useEffect(() => {
    if (!isBoardModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBoardModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBoardModalOpen]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute fresh unified boards list
  const availableBoards = useMemo(() => {
    const stored = getAllStoredBoards();
    const map = new Map<string, PlanBoard>();
    allBoards.forEach((b) => map.set(b.id, b));
    stored.forEach((b) => map.set(b.id, b));
    if (currentBoard) {
      map.set(currentBoard.id, currentBoard);
    }
    return Array.from(map.values());
  }, [allBoards, currentBoard, isBoardModalOpen]);

  // Filter boards according to selected tab and search query
  const filteredBoards = useMemo(() => {
    return availableBoards.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchDesc = b.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      const isCreator =
        b.ownerId === currentPersona.id ||
        b.ownerName?.toLowerCase() === currentPersona.name.toLowerCase() ||
        b.id === 'board-biggi-birthday' ||
        b.ownerId === 'user-seyi';

      if (boardFilter === 'created') return isCreator;
      if (boardFilter === 'joined') return !isCreator;
      return true;
    });
  }, [availableBoards, searchQuery, boardFilter, currentPersona]);

  // Real Board Participants logic for this section:
  // 1. Board Owner
  const boardOwnerPersona = useMemo<UserPersona>(() => {
    const ownerMember = (currentBoard.members || []).find(
      (m) => m.role === 'owner' || m.id === currentBoard.ownerId
    );
    if (ownerMember) {
      return {
        id: ownerMember.id,
        name: ownerMember.name,
        avatar: ownerMember.avatar,
        role: 'owner',
      };
    }
    return {
      id: currentBoard.ownerId || 'owner',
      name:
        currentBoard.creatorCustomIdentity?.displayName ||
        currentBoard.creatorCustomName ||
        currentBoard.ownerName ||
        'Board Owner',
      avatar:
        currentBoard.creatorCustomIdentity?.avatar ||
        currentBoard.creatorCustomAvatar ||
        currentBoard.ownerAvatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'owner',
    };
  }, [currentBoard]);

  // 2. Users who actually joined this specific board through its invite link
  // Strictly filter out hardcoded, dummy, random, or placeholder users
  const joinedInviteParticipants = useMemo<UserPersona[]>(() => {
    const hardcodedDummyIds = new Set([
      'user-tobi',
      'user-amaka',
      'user-kunle',
      'user-zainab',
      'user-femi',
      'user-chioma',
      'user-emeka',
      'user-sarah',
      'user-david',
      'user-alex',
      'user-jordan',
    ]);

    const result: UserPersona[] = [];
    const seenIds = new Set<string>();
    seenIds.add(boardOwnerPersona.id);

    (currentBoard.members || []).forEach((m) => {
      // Must not be the owner
      if (m.id === boardOwnerPersona.id || m.role === 'owner') return;
      // Do not show hardcoded dummy/placeholder users
      if (hardcodedDummyIds.has(m.id)) return;

      // Real users who actually joined through this board's invite link
      const isJoinedViaInvite =
        m.id.startsWith('user-guest') ||
        Boolean(m.joinedViaInvite) ||
        Boolean((m as any).isGuest);

      if (isJoinedViaInvite && !seenIds.has(m.id)) {
        seenIds.add(m.id);
        result.push({
          id: m.id,
          name: m.name,
          avatar: m.avatar,
          role: m.role || 'member',
          isGuest: true,
        });
      }
    });

    // Also include active persona if they are a joined guest on this board
    if (
      currentPersona &&
      currentPersona.id !== boardOwnerPersona.id &&
      (currentPersona.id.startsWith('user-guest') || currentPersona.isGuest) &&
      !seenIds.has(currentPersona.id)
    ) {
      result.push(currentPersona);
      seenIds.add(currentPersona.id);
    }

    return result;
  }, [currentBoard, boardOwnerPersona, currentPersona]);

  // Combined real participants on this specific board (Owner + actual joined invitees only)
  const realBoardParticipants = useMemo<UserPersona[]>(() => {
    return [boardOwnerPersona, ...joinedInviteParticipants];
  }, [boardOwnerPersona, joinedInviteParticipants]);

  return (
    <header className="sticky top-0 z-40 bg-white px-4 sm:px-8 py-3.5 sm:py-4 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* LEFT: Board Switcher Pill */}
        <div className="relative" ref={boardSwitcherRef}>
          <button
            type="button"
            onClick={() => {
              setIsBoardModalOpen(true);
              setIsProfileMenuOpen(false);
              setSearchQuery('');
              setBoardFilter('all');
            }}
            className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] transition-colors text-left cursor-pointer group select-none"
            title="Switch or manage boards"
            aria-expanded={isBoardModalOpen}
            aria-haspopup="dialog"
          >
            <span className="text-base sm:text-lg leading-none shrink-0" role="img" aria-label="Board emoji">
              {currentBoard.emoji || '💵'}
            </span>

            <span className="text-sm sm:text-[15px] font-bold text-[#1A1B25] tracking-tight truncate max-w-[150px] sm:max-w-[260px] md:max-w-[340px]">
              {currentBoard.title}
            </span>

            <CaretDown 
              weight="bold"
              size={14} 
              className={`text-[#808897] transition-transform duration-200 shrink-0 ${
                isBoardModalOpen ? 'rotate-180 text-[#1A1B25]' : 'group-hover:text-[#353849]'
              }`} 
            />
          </button>

          {/* Board Switcher Modal Popup strictly matching reference image */}
          {isBoardModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsBoardModalOpen(false)}
            >
              <div
                className="bg-white w-full max-w-[820px] sm:w-[820px] h-[640px] max-h-[calc(100vh-2rem)] rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 md:p-9 shadow-2xl relative animate-in zoom-in-95 duration-150 flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Header: Title + New Board button */}
                <div className="flex items-center justify-between gap-4 mb-6 sm:mb-7">
                  <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#1A1B25] tracking-tight font-['Nunito']">
                    My Board
                  </h2>

                  <button
                    type="button"
                    onClick={() => {
                      setIsBoardModalOpen(false);
                      onOpenCreatePlan();
                    }}
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-sm sm:text-[15px] font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus size={16} weight="bold" />
                    <span>New Board</span>
                  </button>
                </div>

                {/* Filter Tabs Pills */}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6 overflow-x-auto pb-1 scrollbar-none select-none">
                  <button
                    type="button"
                    onClick={() => setBoardFilter('all')}
                    className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                      boardFilter === 'all'
                        ? 'bg-[#ECEFF3] text-[#1A1B25]'
                        : 'bg-white border border-[#DFE1E6] text-[#666D80] hover:bg-[#F6F8FA] hover:text-[#1A1B25]'
                    }`}
                  >
                    All plans
                  </button>

                  <button
                    type="button"
                    onClick={() => setBoardFilter('created')}
                    className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                      boardFilter === 'created'
                        ? 'bg-[#ECEFF3] text-[#1A1B25]'
                        : 'bg-white border border-[#DFE1E6] text-[#666D80] hover:bg-[#F6F8FA] hover:text-[#1A1B25]'
                    }`}
                  >
                    Created by me
                  </button>

                  <button
                    type="button"
                    onClick={() => setBoardFilter('joined')}
                    className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
                      boardFilter === 'joined'
                        ? 'bg-[#ECEFF3] text-[#1A1B25]'
                        : 'bg-white border border-[#DFE1E6] text-[#666D80] hover:bg-[#F6F8FA] hover:text-[#1A1B25]'
                    }`}
                  >
                    Joined
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-5 sm:mb-6">
                  <MagnifyingGlass
                    size={18}
                    weight="bold"
                    className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[#A4ABB8] pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search board"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#F6F8FA] rounded-full py-3 sm:py-3.5 pl-11 sm:pl-12 pr-4 text-sm sm:text-base text-[#1A1B25] placeholder-[#A4ABB8] focus:outline-none focus:ring-2 focus:ring-[#1A1B25]/10 border-none transition"
                  />
                </div>

                {/* Board Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 flex-1 min-h-0 overflow-y-auto pr-1 pb-1 content-start">
                  {filteredBoards.length > 0 ? (
                    filteredBoards.map((b) => {
                      const isSelected = b.id === currentBoard.id;
                      const isOwner =
                        b.ownerId === currentPersona.id ||
                        (Boolean(b.ownerName) && Boolean(currentPersona.name) && b.ownerName.trim().toLowerCase() === currentPersona.name.trim().toLowerCase()) ||
                        Boolean(b.members?.some(
                          (m) =>
                            (m.id === currentPersona.id || (Boolean(m.name) && Boolean(currentPersona.name) && m.name.trim().toLowerCase() === currentPersona.name.trim().toLowerCase())) &&
                            m.role === 'owner'
                        ));
                      const isCreator = isOwner;
                      const isJoined = !isCreator;
                      const planItemsCount = b.plans?.length || 0;
                      const membersCount = b.members?.length || 1;

                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            if (onSelectBoard && !isSelected) {
                              onSelectBoard(b.id);
                            }
                            setIsBoardModalOpen(false);
                          }}
                          className={`rounded-[24px] p-5 sm:p-6 bg-white transition-all cursor-pointer text-left flex flex-col justify-between select-none ${
                            isSelected
                              ? 'border-2 border-[#1A1B25] shadow-xs'
                              : 'border border-[#ECEFF3] hover:border-[#DFE1E6]'
                          }`}
                        >
                          <div>
                            {/* Top row: Emoji, Title, and Action Buttons (Edit + Delete) */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl sm:text-2xl shrink-0 leading-none" role="img" aria-label="Emoji">
                                  {b.emoji || '💵'}
                                </span>
                                <h3 className="text-base sm:text-lg font-extrabold text-[#1A1B25] tracking-tight truncate">
                                  {b.title}
                                </h3>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsBoardModalOpen(false);
                                      if (onEditBoard) {
                                        onEditBoard(b);
                                      }
                                    }}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F0F2F5] hover:bg-[#ECEFF3] text-[#353849] hover:text-[#1A1B25] flex items-center justify-center transition cursor-pointer shrink-0"
                                    title="Edit board"
                                    aria-label="Edit board"
                                  >
                                    <Pencil className="w-4 h-4 stroke-[2.2]" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDeleteBoard) {
                                      onDeleteBoard(b.id);
                                    }
                                  }}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F0F2F5] hover:bg-[#FEE2E2] hover:text-rose-600 text-[#808897] flex items-center justify-center transition cursor-pointer shrink-0"
                                  title="Delete board"
                                >
                                  <Trash size={16} weight="bold" />
                                </button>
                              </div>
                            </div>

                            {/* Badges row */}
                            <div className="mt-3 sm:mt-3.5 flex items-center gap-2 flex-wrap">
                              {isSelected && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#10B981]">
                                  Active
                                </span>
                              )}

                              {isCreator && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#9333EA] flex items-center gap-1.5">
                                  <Crown size={12} weight="fill" />
                                  <span>Creator</span>
                                </span>
                              )}

                              {isJoined && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] flex items-center gap-1.5">
                                  <LinkSimple size={13} weight="bold" />
                                  <span>Joined</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stats list */}
                          <div className="mt-5 space-y-2 text-[#808897] text-sm font-semibold">
                            <div className="flex items-center gap-2.5">
                              <Stack size={16} weight="bold" className="text-[#A4ABB8] shrink-0" />
                              <span>{planItemsCount} plan items</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Users size={16} weight="bold" className="text-[#A4ABB8] shrink-0" />
                              <span>
                                {membersCount} {membersCount === 1 ? 'member' : 'members'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-10 text-center text-[#808897] text-sm font-semibold">
                      No boards found matching "{searchQuery}"
                    </div>
                  )}
                </div>
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
                setIsBoardModalOpen(false);
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] flex items-center justify-center text-[#1A1B25] transition-colors cursor-pointer active:scale-95 select-none overflow-hidden ring-2 ring-transparent hover:ring-amber-300"
              title="Profile & user switcher"
              aria-label="User profile and account switcher"
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="true"
            >
              {(boardPersona?.avatar || currentPersona.avatar) ? (
                <img 
                  src={boardPersona?.avatar || currentPersona.avatar} 
                  alt={boardPersona?.name || currentPersona.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={21} weight="regular" className="text-[#1A1B25]" />
              )}
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#ECEFF3] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Active user header - clicking navigates to the owner or member view of the board */}
                <div 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    const isOwner = (boardPersona?.role || currentPersona.role) === 'owner' || currentPersona.id === boardOwnerPersona.id;
                    if (isOwner) {
                      if (onNavigateToOwnerView) {
                        onNavigateToOwnerView();
                      } else if (onSelectPersona) {
                        onSelectPersona(boardOwnerPersona);
                      }
                    } else {
                      if (onNavigateToMemberView) {
                        onNavigateToMemberView(boardPersona || currentPersona);
                      } else if (onSelectPersona) {
                        onSelectPersona(boardPersona || currentPersona);
                      }
                    }
                  }}
                  className="px-3.5 py-2.5 border-b border-[#ECEFF3] flex items-center gap-3 cursor-pointer hover:bg-[#F6F8FA] transition group select-none rounded-t-2xl font-['Nunito']"
                  role="button"
                  tabIndex={0}
                  title="Click to view board"
                  aria-label="View Board"
                >
                  <img 
                    src={boardPersona?.avatar || currentPersona.avatar} 
                    alt={boardPersona?.name || currentPersona.name} 
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 shrink-0 group-hover:ring-amber-500 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm text-[#1A1B25] truncate flex items-center gap-1.5">
                      <span>{boardPersona?.name || currentPersona.name}</span>
                      {boardPersona?.name && boardPersona.name !== currentPersona.name && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
                          Board Name
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#666D80] flex items-center gap-1.5 truncate">
                      <span className="capitalize font-semibold">{boardPersona?.role || currentPersona.role}</span>
                      <span>· {boardOwnerPersona.id === currentPersona.id ? 'Board Owner' : 'Joined Member'}</span>
                    </div>
                    <div className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 mt-0.5">
                      <span>{boardOwnerPersona.id === currentPersona.id || (boardPersona?.role || currentPersona.role) === 'owner' ? 'Owner View · Board' : 'Member View · Board'}</span>
                      <CaretRight size={10} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Real Board Participants (Owner & Actual Joined Invitees Only) */}
                <div className="px-3.5 pt-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#808897] uppercase tracking-wider font-['Nunito']">
                    Board Participants ({realBoardParticipants.length})
                  </span>
                  <span className="text-[10px] font-semibold text-[#808897] font-['Nunito']">
                    Click to switch view
                  </span>
                </div>
                <div className="py-1 px-1.5 max-h-56 overflow-y-auto space-y-1">
                  {realBoardParticipants.map((p) => {
                    const isOwner = p.id === boardOwnerPersona.id || p.role === 'owner';
                    const isCurrent = currentPersona.id === p.id && (isOwner ? currentPersona.role === 'owner' : currentPersona.role !== 'owner');

                    return (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (isOwner) {
                            if (onNavigateToOwnerView) {
                              onNavigateToOwnerView();
                            } else if (onSelectPersona) {
                              onSelectPersona({ ...p, role: 'owner' });
                            }
                          } else {
                            if (onNavigateToMemberView) {
                              onNavigateToMemberView({ ...p, role: 'member' });
                            } else if (onSelectPersona) {
                              onSelectPersona({ ...p, role: 'member' });
                            }
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition cursor-pointer select-none font-['Nunito'] group ${
                          isCurrent
                            ? 'bg-[#ECEFF3] text-[#1A1B25] font-extrabold'
                            : 'bg-[#F8F9FB] hover:bg-[#F6F8FA] text-[#353849]'
                        }`}
                        title={isOwner ? 'Open Owner View of this board' : `Open Member View for ${p.name}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <img 
                              src={p.avatar} 
                              alt={p.name} 
                              className={`w-8 h-8 rounded-full object-cover shrink-0 ${
                                isOwner ? 'ring-2 ring-amber-400' : 'ring-1 ring-[#DFE1E6]'
                              }`} 
                            />
                            {isOwner && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1A1B25] text-amber-300 flex items-center justify-center">
                                <Crown size={10} weight="fill" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="font-extrabold text-xs leading-tight truncate flex items-center gap-1.5 text-[#1A1B25]">
                              <span>{p.name}</span>
                            </div>
                            <div className="text-[10px] text-[#666D80] flex items-center gap-1 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                                isOwner 
                                  ? 'bg-[#272835] text-white' 
                                  : 'bg-[#DFE1E6] text-[#353849]'
                              }`}>
                                {isOwner ? 'Owner View' : 'Member View'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          {isCurrent ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1A1B25] text-white">
                              <Check size={11} weight="bold" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECEFF3] text-[#1A1B25] group-hover:bg-[#1A1B25] group-hover:text-white transition">
                              <span>{isOwner ? 'Owner' : 'Member'}</span>
                              <CaretRight size={10} weight="bold" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {joinedInviteParticipants.length === 0 && (
                    <div className="px-3.5 py-2 text-[11px] text-[#808897] bg-[#F8F9FB] mx-1 my-1 rounded-xl font-['Nunito']">
                      No guests have joined yet. Share the invite link below to invite friends!
                    </div>
                  )}
                </div>

                {/* Extra Utility Actions moved here */}
                <div className="border-t border-[#ECEFF3] pt-1.5 mt-1 px-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const targetUser = boardPersona || currentPersona;
                      onOpenUserProfile?.(targetUser);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-[#353849] hover:bg-[#F6F8FA] font-bold transition cursor-pointer"
                  >
                    <User size={16} weight="bold" className="text-[#666D80]" />
                    <span>View Registered Profile</span>
                  </button>

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
