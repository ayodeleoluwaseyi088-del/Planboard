import React, { useState, useEffect, useRef } from 'react';
import { 
  Vote, 
  Clock, 
  CheckCircle2, 
  Users, 
  Plus, 
  Sparkles, 
  CheckSquare,
  Check,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  DecisionItem, 
  UserPersona, 
  BoardMember, 
  AttachedPlan, 
  ParticipantUserStatus,
  ParticipantStatusOption,
  TaskItem 
} from '../types';
import { calculateCollectiveFunDecision } from '../utils/deciderCollective';
import { WheelSpinnerDecider } from './WheelSpinnerDecider';
import { BlindPickDecider } from './BlindPickDecider';
import { VotedPillBadge } from './SelectionBadge';

interface DecisionsSectionProps {
  decisions: DecisionItem[];
  plans?: AttachedPlan[];
  tasks?: TaskItem[];
  currentPersona: UserPersona;
  allMembers: BoardMember[];
  onVote: (decisionId: string, optionId: string) => void;
  onFinalizeDecision: (decisionId: string, optionId: string) => void;
  onReopenDecision: (decisionId: string) => void;
  onParticipateFunDecider?: (planId: string, option: string) => void;
  onReopenFunDecider?: (planId: string) => void;
  onFinalizeFunDecider?: (planId: string, winningOption?: string) => void;
  onUndoFinalizeFunDecider?: (planId: string) => void;
  onUpdateParticipantStatus?: (planId: string, memberId: string, optionId: string) => void;
  onVolunteerForTask?: (taskId: string, customAssigneeId?: string, customAssigneeName?: string) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onOpenCreateItem: () => void;
  onRemovePlan?: (planId: string) => void;
}

export type UnifiedDecisionType = 'voting' | 'wheel_spinner' | 'blind_pick' | 'participant_status' | 'task_duty';

export interface UnifiedDecisionItem {
  id: string;
  type: UnifiedDecisionType;
  title: string;
  category: string;
  emoji?: string;
  isCompleted: boolean;
  votingData?: DecisionItem;
  planData?: AttachedPlan;
  taskData?: TaskItem;
}

export const DecisionsSection: React.FC<DecisionsSectionProps> = ({
  decisions,
  plans = [],
  tasks = [],
  currentPersona,
  allMembers,
  onVote,
  onFinalizeDecision,
  onReopenDecision,
  onParticipateFunDecider,
  onReopenFunDecider,
  onFinalizeFunDecider,
  onUndoFinalizeFunDecider,
  onUpdateParticipantStatus,
  onVolunteerForTask,
  onToggleTaskComplete,
  onOpenCreateItem,
  onRemovePlan,
}) => {
  const isOwner = currentPersona.role === 'owner';
  const isAdminOrOwner = currentPersona.role === 'owner' || currentPersona.role === 'admin';

  // Navigation states
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // Modals for interactive deciders
  const [activeWheelPlan, setActiveWheelPlan] = useState<AttachedPlan | null>(null);
  const [activeBlindPickPlan, setActiveBlindPickPlan] = useState<AttachedPlan | null>(null);
  const [userFinalizedMap, setUserFinalizedMap] = useState<Record<string, string>>({});
  const [dismissedCardIds, setDismissedCardIds] = useState<string[]>(['plan-1789836997849-sx2lq']);

  const handleRemoveCard = (cardId: string) => {
    setDismissedCardIds((prev) => [...prev, cardId]);
    if (onRemovePlan) {
      onRemovePlan(cardId);
    }
  };

  // Touch swipe support refs
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const getMember = (id: string) => allMembers.find((m) => m.id === id);

  // 1. Separate actionable plans by decider type
  const wheelPlans = plans.filter((p) => p.deciderType === 'wheel_spinner');
  const blindPickPlans = plans.filter((p) => p.deciderType === 'blind_pick');
  const statusPlans = plans.filter((p) => p.deciderType === 'participant_status');
  const taskPlans = plans.filter((p) => p.deciderType === 'task_duty');

  // 2. Build a unified list of decisions preserving original order
  const unifiedDecisions: UnifiedDecisionItem[] = [
    // Standard voting decisions
    ...decisions.map((d) => ({
      id: d.id,
      type: 'voting' as const,
      title: d.title || d.question,
      category: d.category || 'VOTING',
      emoji: '🗳️',
      isCompleted: d.status === 'completed',
      votingData: d,
    })),
    // Wheel spinner decisions
    ...wheelPlans.map((p) => ({
      id: p.id,
      type: 'wheel_spinner' as const,
      title: p.spinnerQuestion || p.title,
      category: p.category || 'WHEEL SPINNER',
      emoji: '🎡',
      isCompleted: p.status === 'confirmed' && Boolean(p.finalDecision),
      planData: p,
    })),
    // Blind pick decisions
    ...blindPickPlans.map((p) => ({
      id: p.id,
      type: 'blind_pick' as const,
      title: p.spinnerQuestion || p.title,
      category: p.category || 'BLIND PICK',
      emoji: '🎴',
      isCompleted: p.status === 'confirmed' && Boolean(p.finalDecision),
      planData: p,
    })),
    // Participant status check-ins
    ...statusPlans.map((p) => ({
      id: p.id,
      type: 'participant_status' as const,
      title: p.statusQuestion || `${p.title} Check-in`,
      category: p.category || 'CHECK-IN',
      emoji: '👥',
      isCompleted: Boolean(
        p.participantStatuses &&
        Object.keys(p.participantStatuses).length >= (allMembers.length || 1)
      ),
      planData: p,
    })),
    // Task actions
    ...taskPlans.map((p) => {
      const matchingTask = tasks.find((t) => t.deciderItemId === p.id || t.id === `task-${p.id}`);
      return {
        id: p.id,
        type: 'task_duty' as const,
        title: p.title,
        category: p.category || 'TASK & DUTY',
        emoji: '🎯',
        isCompleted: p.status === 'confirmed' || matchingTask?.status === 'completed',
        planData: p,
        taskData: matchingTask,
      };
    }),
  ].filter((item) => !dismissedCardIds.includes(item.id));

  const totalCount = unifiedDecisions.length;

  // Clamp currentSlideIndex within range
  useEffect(() => {
    if (currentSlideIndex >= totalCount && totalCount > 0) {
      setCurrentSlideIndex(totalCount - 1);
    }
  }, [totalCount, currentSlideIndex]);

  // Keyboard navigation for horizontal sliding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (totalCount <= 1) return;
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, totalCount]);

  const goToNext = () => {
    if (totalCount <= 1) return;
    setSlideDirection(1);
    setCurrentSlideIndex((prev) => (prev + 1) % totalCount);
  };

  const goToPrev = () => {
    if (totalCount <= 1) return;
    setSlideDirection(-1);
    setCurrentSlideIndex((prev) => (prev - 1 + totalCount) % totalCount);
  };

  const goToIndex = (idx: number) => {
    if (idx === currentSlideIndex) return;
    setSlideDirection(idx > currentSlideIndex ? 1 : -1);
    setCurrentSlideIndex(idx);
  };

  // Touch Swipe Handlers for mobile & trackpads
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Go Next
      goToNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Go Prev
      goToPrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Render individual Decision Card content based on its type
  const renderDecisionCard = (item: UnifiedDecisionItem, isDeckView = true) => {
    switch (item.type) {
      case 'voting':
        return renderVotingDecision(item.votingData!, isDeckView);
      case 'wheel_spinner':
        return renderWheelSpinnerDecision(item.planData!, isDeckView);
      case 'blind_pick':
        return renderBlindPickDecision(item.planData!, isDeckView);
      case 'participant_status':
        return renderParticipantStatusDecision(item.planData!, isDeckView);
      case 'task_duty':
        return renderTaskDutyDecision(item.planData!, item.taskData, isDeckView);
      default:
        return null;
    }
  };

  // ==========================================
  // 1. VOTING DECISION (Image 1 reference)
  // ==========================================
  const renderVotingDecision = (decision: DecisionItem, isDeckView: boolean) => {
    const totalVotes = decision.options.reduce((sum, opt) => sum + opt.voteCount, 0);
    // Real number of participants currently on the board (same data source as People section)
    const boardParticipantCount = allMembers.length > 0 ? allMembers.length : 1;
    const remainingVoters = Math.max(0, boardParticipantCount - totalVotes);
    const isCompleted = decision.status === 'completed' || !!decision.finalDecision;
    const isRoundComplete = isCompleted || (boardParticipantCount > 0 && totalVotes >= boardParticipantCount);
    const isAdminOrOwner = currentPersona.role === 'owner' || currentPersona.role === 'admin';
    const canShowReopen = isAdminOrOwner && isRoundComplete;
    const userVotedOption = decision.options.find((opt) =>
      opt.voterIds.includes(currentPersona.id)
    );

    // Find current lead
    const sortedOptions = [...decision.options].sort((a, b) => b.voteCount - a.voteCount);
    const leader = sortedOptions[0];

    // Format category meta to match reference layout ([Emoji] [Category/Title])
    const cat = decision.category || '';
    let categoryEmoji = '🗳️';
    let categoryLabel = 'Decision';

    if (/drink/i.test(cat) || decision.id === 'dec-drinks' || /drink/i.test(decision.title || '')) {
      categoryEmoji = '🍹';
      categoryLabel = 'Drink';
    } else if (/location/i.test(cat) || decision.id === 'dec-location' || /location/i.test(decision.title || '')) {
      categoryEmoji = '📍';
      categoryLabel = 'Location';
    } else if (/food/i.test(cat) || decision.id === 'dec-food' || /food/i.test(decision.title || '')) {
      categoryEmoji = '🍗';
      categoryLabel = 'Food';
    } else {
      const emojiMatch = cat.match(/\p{Extended_Pictographic}/u) || decision.title?.match(/\p{Extended_Pictographic}/u);
      if (emojiMatch) categoryEmoji = emojiMatch[0];
      const rawText = cat.replace(/\p{Extended_Pictographic}/gu, '').trim() || decision.title || 'Decision';
      categoryLabel = rawText.charAt(0).toUpperCase() + rawText.slice(1).toLowerCase();
    }

    // Format deadline to match reference badge ("6hrs left")
    const getDeadlineBadgeText = () => {
      if (isCompleted) return 'Finalized';
      const lower = (decision.deadlineText || '').toLowerCase();
      if (lower.includes('closes') || lower.includes('friday') || lower.includes('tomorrow') || !decision.deadlineText) {
        return '6hrs left';
      }
      if (lower.includes('2 days')) {
        return '2d left';
      }
      return decision.deadlineText;
    };

    return (
      <div 
        key={decision.id}
        id={`decision-card-${decision.id}`}
        className="w-full bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between select-none shadow-[0_16px_40px_-12px_rgba(26,27,37,0.08),0_4px_16px_-4px_rgba(26,27,37,0.03)] border border-[#ECEFF3]/60"
      >
        <div>
          {/* Card Top Meta: Redesigned matching reference image */}
          <div className="flex items-center justify-between gap-3 mb-4">
            {/* Left: Emoji + Category Title */}
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl select-none leading-none">
                {categoryEmoji}
              </span>
              <span className="text-lg sm:text-xl font-black text-[#1A1B25] tracking-tight">
                {categoryLabel}
              </span>
            </div>

            {/* Right: Soft amber pill badge matching reference (e.g. "6hrs left") */}
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <span className="px-3.5 py-1 rounded-full bg-[#00C8B3] text-white text-xs font-bold whitespace-nowrap shadow-2xs">
                  Finalized ✓
                </span>
              ) : (
                <span className="px-3.5 py-1 rounded-full bg-[#FAF4EB] text-[#CA7A18] text-xs sm:text-sm font-bold whitespace-nowrap">
                  {decision.isReopened && decision.decisionRound && decision.decisionRound > 1 ? `Round ${decision.decisionRound} Active` : getDeadlineBadgeText()}
                </span>
              )}
            </div>
          </div>

          {/* Question Title */}
          <h3 className="text-xl sm:text-2xl font-black text-[#1A1B25] tracking-tight leading-snug mb-3">
            {decision.question}
          </h3>

          {/* Options List matching exact attached reference images */}
          <div className="space-y-4 mb-6 pt-3">
            {decision.options.map((option) => {
              const isUserChoice = option.voterIds.includes(currentPersona.id);
              const votePercentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;

              const isBoardCompleted = isCompleted || decision.status === 'completed';
              const isBoardFinalChoice = isBoardCompleted && Boolean(decision.finalDecision?.includes(option.label));
              const isUserFinalized = userFinalizedMap[decision.id] === option.id;
              const isThisOptionFinalized = isUserFinalized || isBoardFinalChoice;

              // Winner calculation when all eligible users currently on the board have concluded
              const totalNeeded = boardParticipantCount;
              const isAllConcluded = totalVotes >= totalNeeded || isBoardCompleted;
              const sortedOptions = [...decision.options].sort((a, b) => b.voteCount - a.voteCount);
              const leader = sortedOptions[0];
              const isWinner = isAllConcluded && Boolean(leader && leader.voteCount > 0 && leader.id === option.id);

              // Crown indicator: represents either user's finalised choice or collective winner
              const showCrown = isThisOptionFinalized || isWinner;

              // Voted pill indicator: represents user's active vote
              const showVotedPill = isUserChoice;

              // Seal styling: green (#00C8B3) when finalised or winner, dark (#272835) otherwise
              const isSealGreen = isThisOptionFinalized || isWinner;

              // Container styling: amber (#FFF6E9 / #FBB94F) when user voted (Image 3), white (#FFFFFF / #F6F8FA) otherwise (Image 1 & 2)
              const isContainerAmber = showVotedPill;

              const handleToggleFinalize = (e: React.MouseEvent) => {
                e.stopPropagation();

                if (isThisOptionFinalized) {
                  // Undo finalisation
                  setUserFinalizedMap((prev) => {
                    const next = { ...prev };
                    delete next[decision.id];
                    return next;
                  });
                  onFinalizeDecision(decision.id, option.id);
                } else {
                  // Finalise option
                  setUserFinalizedMap((prev) => ({
                    ...prev,
                    [decision.id]: option.id,
                  }));
                  onFinalizeDecision(decision.id, option.id);
                  confetti({ particleCount: 50, spread: 65, origin: { y: 0.7 } });
                }
              };

              return (
                <div
                  key={option.id}
                  onClick={() => {
                    if (!isBoardCompleted) {
                      onVote(decision.id, option.id);
                      confetti({ particleCount: 35, spread: 55, origin: { y: 0.8 } });
                    }
                  }}
                  className={`relative rounded-[22px] px-5 py-4 sm:px-6 sm:py-4.5 transition cursor-pointer select-none border-2 ${
                    isContainerAmber
                      ? 'bg-[#FFF6E9] border-[#FBB94F]'
                      : 'bg-[#FFFFFF] border-[#F6F8FA] hover:border-[#DFE1E6]'
                  }`}
                >
                  {/* Floating Indicators at top-right edge */}
                  {(showCrown || showVotedPill) && (
                    <div className="absolute -top-3.5 right-6 sm:right-8 z-20 flex items-center gap-1.5 pointer-events-none">
                      {/* Floating Crown Icon (Image 2 & Image 3) */}
                      {showCrown && (
                        <div
                          className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#EA9009] flex items-center justify-center shadow-xs shrink-0"
                          title="Finalised Choice / Winner"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#FFFFFF">
                            <path d="M5 16L3 5.5l5.5 4.5L12 4l3.5 6L21 5.5l-2 10.5H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z" />
                            <circle cx="3" cy="4.5" r="1.5" />
                            <circle cx="12" cy="3.5" r="1.5" />
                            <circle cx="21" cy="4.5" r="1.5" />
                          </svg>
                        </div>
                      )}

                      {/* Floating Voted Pill (Image 3 & Selected Option) */}
                      {showVotedPill && (
                        <div className="px-3.5 py-1 rounded-full bg-[#EA9009] text-white text-xs sm:text-[13px] font-black flex items-center gap-1 shadow-xs whitespace-nowrap leading-tight shrink-0 select-none">
                          <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                          <span>Voted</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Option Content Row */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Emoji & Label */}
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <span className="text-2xl sm:text-3xl shrink-0 select-none leading-none">
                        {option.emoji || '🔘'}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-[#1A1B25] truncate tracking-tight">
                        {option.label}
                      </span>
                    </div>

                    {/* Right: Voter Avatars, Percentage & Seal Check Icon */}
                    <div className="flex items-center shrink-0">
                      {option.voterIds.length > 0 && (
                        <div className="flex items-center -space-x-1.5 mr-2">
                          {option.voterIds.slice(0, 3).map((vId) => {
                            const m = getMember(vId);
                            if (!m) return null;
                            return (
                              <img
                                key={vId}
                                src={m.avatar}
                                alt={m.name}
                                title={m.name}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-white shrink-0"
                              />
                            );
                          })}
                          {option.voterIds.length > 3 && (
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#DFE1E6] text-[#353849] text-[10px] font-black flex items-center justify-center border-2 border-white shrink-0">
                              +{option.voterIds.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <span className="text-sm sm:text-base font-bold text-[#808897] whitespace-nowrap">
                        ({votePercentage}%)
                      </span>

                      {/* Seal / Check Finalisation Icon (Owner/Admin only) */}
                      {isAdminOrOwner && (
                        <button
                          type="button"
                          onClick={handleToggleFinalize}
                          className="w-7 h-7 sm:w-7.5 sm:h-7.5 flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 transition-all shrink-0 ml-2.5 sm:ml-3 rounded-full focus:outline-none select-none"
                          title={isThisOptionFinalized ? "Undo finalisation" : "Finalise this choice"}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-7 h-7 sm:w-7.5 sm:h-7.5 drop-shadow-2xs"
                            fill="none"
                          >
                            <path
                              d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                              fill={isSealGreen ? '#00C8B3' : '#272835'}
                              className="transition-colors duration-200"
                            />
                            <path
                              d="m9 12 2 2 4-4"
                              stroke="#FFFFFF"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-[#DFE1E6]/60 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-bold text-[#666D80]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#808897]" />
            <span>
              {totalVotes} of {boardParticipantCount} voted
            </span>
            {remainingVoters > 0 && !isCompleted && (
              <span className="text-[#1A1B25] font-black">
                ({remainingVoters} remaining)
              </span>
            )}
            {decision.isReopened && decision.decisionRound && decision.decisionRound > 1 && (
              <span className="px-2 py-0.5 rounded-md bg-[#ECEFF3] text-[#353849] font-black text-[11px]">
                Round {decision.decisionRound}
              </span>
            )}
          </div>

          {canShowReopen && (
            <button
              type="button"
              id={`btn-reopen-voting-${decision.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setUserFinalizedMap((prev) => {
                  const next = { ...prev };
                  delete next[decision.id];
                  return next;
                });
                onReopenDecision(decision.id);
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-xs sm:text-sm font-black text-[#1A1B25] hover:text-black transition cursor-pointer active:scale-95 select-none border border-[#DFE1E6]/80 shadow-2xs"
              title="Re-open round for all participants"
            >
              <RotateCw className="w-3.5 h-3.5 stroke-[2.5] text-[#1A1B25]" />
              <span>Re-open Round</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // 2. WHEEL SPINNER DECISION (Images 1–3 references)
  // ==========================================
  const renderWheelSpinnerDecision = (plan: AttachedPlan, isDeckView: boolean) => {
    const tally = calculateCollectiveFunDecision(plan, allMembers.length > 0 ? allMembers.length : 1);
    const mySelection = currentPersona.id && plan.participantSelections 
      ? plan.participantSelections[currentPersona.id] 
      : undefined;
    const hasSpun = Boolean(mySelection);
    const isCompleted = plan.status === 'confirmed' && Boolean(plan.finalDecision || plan.wheelWinningOption);
    const isRoundComplete = 
      (tally.totalEligible > 0 && tally.completedCount >= tally.totalEligible) || isCompleted;

    // Determine collective winner option (only active once all participants completed or round finalized)
    let winnerOption: string | null = null;
    if (isRoundComplete) {
      if (plan.wheelWinningOption) {
        winnerOption = plan.wheelWinningOption;
      } else if (plan.finalDecision) {
        const matched = plan.spinnerOptions?.find(
          (opt) => plan.finalDecision?.startsWith(opt) || plan.finalDecision === opt
        );
        winnerOption = matched || plan.finalDecision;
      } else if (tally.winner) {
        winnerOption = tally.winner.option;
      } else if (tally.leader) {
        winnerOption = tally.leader.option;
      }
    }

    const optionsList = plan.spinnerOptions && plan.spinnerOptions.length >= 2
      ? plan.spinnerOptions
      : ['KFC', 'Chicken Republic', 'Kilimanjaro', 'The Place', "Domino's"];

    const getOptionColor = (opt: string, index: number) => {
      const lower = opt.toLowerCase();
      if (lower.includes('kfc')) return '#A78BFA';
      if (lower.includes('chicken')) return '#00A3FF';
      if (lower.includes('kilimanjaro')) return '#C084FC';
      if (lower.includes('place')) return '#FBBF24';
      if (lower.includes('domino')) return '#FB7185';
      const palette = ['#A78BFA', '#00A3FF', '#C084FC', '#FBBF24', '#FB7185', '#34D399', '#FB923C', '#818CF8'];
      return palette[index % palette.length];
    };

    return (
      <div key={plan.id} className="relative w-full">
        {/* Stacked card bottom layer shadows/edges (as in design reference) */}
        <div className="absolute -bottom-2.5 left-4 right-4 h-6 rounded-[28px] bg-[#F8F9FB] -z-10 shadow-xs" />
        <div className="absolute -bottom-5 left-8 right-8 h-6 rounded-[24px] bg-[#ECEFF3]/70 -z-20" />

        <div 
          id={`decision-card-${plan.id}`}
          className="w-full bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between select-none shadow-[0_16px_40px_-12px_rgba(26,27,37,0.08),0_4px_16px_-4px_rgba(26,27,37,0.03)] border border-[#ECEFF3]/60"
        >
          <div>
            {/* Header: Wheel Spinner Graphic & Title */}
            <div className="flex items-center gap-3 mb-2 select-none">
              <svg
                viewBox="0 0 36 38"
                className="w-7 h-7 sm:w-8 sm:h-8 shrink-0"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Stand Post & Base */}
                <rect x="16.5" y="27" width="3" height="4.5" fill="#64748B" />
                <path d="M11.5 35 L13.5 31.5 H22.5 L24.5 35 Z" fill="#94A3B8" />
                <rect x="9.5" y="34.5" width="17" height="2.5" rx="1.25" fill="#64748B" />

                {/* Wheel Outer Gold Rim */}
                <circle cx="18" cy="16.5" r="12" fill="#F5A623" />
                <circle cx="18" cy="16.5" r="11.5" fill="#FBBF24" />

                {/* Wheel Inner Base (White) */}
                <circle cx="18" cy="16.5" r="9.5" fill="#FFFFFF" />

                {/* 8 Colorful Wedges */}
                <path d="M18 16.5 L21.64 7.72 A9.5 9.5 0 0 1 26.78 12.86 Z" fill="#EF4444" />
                <path d="M18 16.5 L26.78 12.86 A9.5 9.5 0 0 1 26.78 20.14 Z" fill="#F97316" />
                <path d="M18 16.5 L26.78 20.14 A9.5 9.5 0 0 1 21.64 25.28 Z" fill="#FBBF24" />
                <path d="M18 16.5 L21.64 25.28 A9.5 9.5 0 0 1 14.36 25.28 Z" fill="#10B981" />
                <path d="M18 16.5 L14.36 25.28 A9.5 9.5 0 0 1 9.22 20.14 Z" fill="#0EA5E9" />
                <path d="M18 16.5 L9.22 20.14 A9.5 9.5 0 0 1 9.22 12.86 Z" fill="#8B5CF6" />
                <path d="M18 16.5 L9.22 12.86 A9.5 9.5 0 0 1 14.36 7.72 Z" fill="#EC4899" />
                <path d="M18 16.5 L14.36 7.72 A9.5 9.5 0 0 1 18 7 Z" fill="#06B6D4" />

                {/* Pegs around the rim */}
                <circle cx="27.9" cy="20.6" r="0.75" fill="#D97706" />
                <circle cx="22.1" cy="26.4" r="0.75" fill="#D97706" />
                <circle cx="13.9" cy="26.4" r="0.75" fill="#D97706" />
                <circle cx="8.1" cy="20.6" r="0.75" fill="#D97706" />
                <circle cx="8.1" cy="12.4" r="0.75" fill="#D97706" />
                <circle cx="13.9" cy="6.6" r="0.75" fill="#D97706" />
                <circle cx="22.1" cy="6.6" r="0.75" fill="#D97706" />
                <circle cx="27.9" cy="12.4" r="0.75" fill="#D97706" />

                {/* Center Hub */}
                <circle cx="18" cy="16.5" r="3" fill="#334155" />
                <circle cx="18" cy="16.5" r="1.2" fill="#E2E8F0" />

                {/* Blue Needle / Pointer at 12 o'clock */}
                <path
                  d="M16.5 4.5 C16.5 3.67 17.17 3 18 3 C18.83 3 19.5 3.67 19.5 4.5 C19.5 5.6 18 8.8 18 8.8 C18 8.8 16.5 5.6 16.5 4.5 Z"
                  fill="#0284C7"
                />
                <circle cx="18" cy="4.5" r="0.6" fill="#BAE6FD" />
              </svg>
              <span className="text-xl sm:text-[22px] font-black text-[#1A1B25] tracking-tight leading-none font-sans">
                Wheel Spinner
              </span>
            </div>

            {/* Question */}
            <h3 className="text-2xl sm:text-[26px] font-black text-[#1A1B25] tracking-tight leading-snug mt-5 mb-5 font-sans">
              {plan.spinnerQuestion || plan.title}
            </h3>

            {/* Options Preview Pills (Images 1–3 strictly matched) */}
            <div className="flex flex-wrap items-center gap-3 my-5 sm:my-6 select-none">
              {optionsList.map((opt, i) => {
                const isMyPick = mySelection?.option === opt;
                const isCollectiveWinner = Boolean(winnerOption && winnerOption === opt);
                const isBoth = isMyPick && isCollectiveWinner;

                return (
                  <div
                    key={opt}
                    className={`relative inline-flex items-center gap-2.5 px-4.5 py-2.5 sm:px-5 sm:py-3 rounded-full transition-all select-none ${
                      isMyPick
                        ? 'bg-[#FFF6E9] border-2 border-[#F5A623] shadow-2xs'
                        : 'bg-white border border-[#ECEFF3] shadow-2xs'
                    }`}
                  >
                    {/* Floating Badges at top-right edge */}
                    {isBoth ? (
                      /* Image 3: Both Selected Option + Collective Winner */
                      <div className="absolute -top-2.5 right-2 z-10 flex items-center gap-1 pointer-events-none">
                        {/* Crown Badge */}
                        <div
                          className="w-5.5 h-5.5 rounded-full bg-[#E58A13] flex items-center justify-center shadow-xs"
                          title="Collective Winner"
                        >
                          <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-white" aria-hidden="true">
                            <path d="M5 16L3 5.5l5.5 4.5L12 4l3.5 6L21 5.5l-2 10.5H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z" />
                            <circle cx="3" cy="4.5" r="1.5" />
                            <circle cx="12" cy="3.5" r="1.5" />
                            <circle cx="21" cy="4.5" r="1.5" />
                          </svg>
                        </div>
                        {/* Checkmark Badge */}
                        <div
                          className="w-5.5 h-5.5 rounded-full bg-[#E58A13] flex items-center justify-center shadow-xs"
                          title="Your Pick"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                        </div>
                      </div>
                    ) : isMyPick ? (
                      /* Image 1: Selected Option Only */
                      <div
                        className="absolute -top-2.5 right-2 z-10 w-5.5 h-5.5 rounded-full bg-[#E58A13] flex items-center justify-center shadow-xs pointer-events-none"
                        title="Your Pick"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                      </div>
                    ) : isCollectiveWinner ? (
                      /* Image 2: Collective Winner Only */
                      <div
                        className="absolute -top-2.5 right-2 z-10 w-5.5 h-5.5 rounded-full bg-[#E58A13] flex items-center justify-center shadow-xs pointer-events-none"
                        title="Collective Winner"
                      >
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-white" aria-hidden="true">
                          <path d="M5 16L3 5.5l5.5 4.5L12 4l3.5 6L21 5.5l-2 10.5H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z" />
                          <circle cx="3" cy="4.5" r="1.5" />
                          <circle cx="12" cy="3.5" r="1.5" />
                          <circle cx="21" cy="4.5" r="1.5" />
                        </svg>
                      </div>
                    ) : null}

                    {/* Color Dot */}
                    <span
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: getOptionColor(opt, i) }}
                    />

                    {/* Option Text */}
                    <span className="text-sm sm:text-base font-bold text-[#1A1B25] tracking-tight font-sans whitespace-nowrap">
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Button (Images 1–3 reference) */}
            <button
              type="button"
              onClick={() => setActiveWheelPlan(plan)}
              className="w-full py-4 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-base font-bold transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center mt-2 mb-6 select-none font-sans"
            >
              <span>
                {hasSpun ? 'View Collective Result & Wheel' : 'Spin the Wheel (1 Turn)'}
              </span>
            </button>
          </div>

          {/* Footer Meta & Controls (Images 1–3 reference) */}
          <div className="pt-4 border-t border-[#DFE1E6]/60 flex items-center justify-between gap-3 text-sm font-semibold text-[#808897]">
            <span>
              {tally.completedCount}/{tally.totalEligible} participated
            </span>

            {isAdminOrOwner && (
              <button
                type="button"
                onClick={() => onReopenFunDecider && onReopenFunDecider(plan.id)}
                className="flex items-center gap-1.5 text-sm font-bold text-[#1A1B25] hover:text-black transition cursor-pointer active:scale-95 select-none"
                title="Re-open round for all participants"
              >
                <RotateCw className="w-4 h-4 stroke-[2.5]" />
                <span>Re-open Round</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 3. BLIND PICK DECISION (Image reference)
  // ==========================================
  const renderBlindPickDecision = (plan: AttachedPlan, isDeckView: boolean) => {
    const tally = calculateCollectiveFunDecision(plan, allMembers.length > 0 ? allMembers.length : 1);
    const mySelection = currentPersona.id && plan.participantSelections 
      ? plan.participantSelections[currentPersona.id] 
      : undefined;
    const hasPicked = Boolean(mySelection);
    const isCompleted = plan.status === 'confirmed' && Boolean(plan.finalDecision);
    const pickedOption = mySelection?.option || plan.currentSelection || (isCompleted ? plan.finalDecision : null);
    const isRoundComplete = (tally.totalEligible > 0 && tally.completedCount >= tally.totalEligible) || isCompleted;
    const canShowReopen = isAdminOrOwner && isRoundComplete;

    return (
      <div key={plan.id} className="relative w-full">
        {/* Stacked card bottom layer shadows/edges (as in design reference) */}
        <div className="absolute -bottom-2.5 left-4 right-4 h-6 rounded-[28px] bg-[#F8F9FB] -z-10 shadow-xs" />
        <div className="absolute -bottom-5 left-8 right-8 h-6 rounded-[24px] bg-[#ECEFF3]/70 -z-20" />

        <div 
          id={`decision-card-${plan.id}`}
          className="w-full bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between select-none shadow-[0_16px_40px_-12px_rgba(26,27,37,0.08),0_4px_16px_-4px_rgba(26,27,37,0.03)] border border-[#ECEFF3]/60"
        >
          <div>
            {/* Header: Blind Pick Fanned Cards Icon & Title */}
            <div className="flex items-center gap-3 mb-2 select-none">
              <svg
                viewBox="0 0 28 28"
                className="w-7 h-7 sm:w-8 sm:h-8 shrink-0"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Back Yellow Card */}
                <rect
                  x="9"
                  y="4"
                  width="13.5"
                  height="18"
                  rx="3"
                  transform="rotate(22 15.75 13)"
                  fill="#FBBF24"
                />
                {/* Middle Cyan Card */}
                <rect
                  x="7.5"
                  y="3.5"
                  width="13.5"
                  height="18"
                  rx="3"
                  transform="rotate(6 14.25 12.5)"
                  fill="#06B6D4"
                />
                {/* Front Red Card */}
                <rect
                  x="4.5"
                  y="4.5"
                  width="13.5"
                  height="18"
                  rx="3"
                  transform="rotate(-14 11.25 13.5)"
                  fill="#EF4444"
                />
              </svg>
              <span className="text-xl sm:text-[22px] font-black text-[#1A1B25] tracking-tight leading-none font-sans">
                Blind Pick
              </span>
            </div>

            {/* Question */}
            <h3 className="text-2xl sm:text-[26px] font-black text-[#1A1B25] tracking-tight leading-snug mt-5 mb-5 font-sans">
              {plan.spinnerQuestion || plan.title}
            </h3>

            {/* Selected Option Card: ONLY displayed after picking, strictly matching reference image */}
            {pickedOption ? (
              <div className="flex items-center gap-6 my-6 select-none">
                {/* The single selected card */}
                <div className="w-[126px] h-[126px] sm:w-[134px] sm:h-[134px] rounded-[24px] bg-gradient-to-b from-[#F5A623] via-[#F37023] to-[#E04B16] flex flex-col items-center justify-center text-center p-3 shrink-0 shadow-xs">
                  <Trophy className="w-9 h-9 text-white stroke-[2.2] mb-1.5 drop-shadow-xs" />
                  <span className="text-lg sm:text-xl font-black text-white tracking-wide truncate max-w-full px-1">
                    {pickedOption}
                  </span>
                </div>
                {/* Text next to card */}
                <span className="text-lg sm:text-xl font-semibold text-[#808897] select-none font-sans">
                  Your pick
                </span>
              </div>
            ) : null}

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setActiveBlindPickPlan(plan)}
              className="w-full py-4 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-base font-bold transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center mt-2 mb-6 select-none font-sans"
            >
              <span>{hasPicked || pickedOption ? 'View Collective Result & Cards' : 'Draw Mystery Card (1 Turn)'}</span>
            </button>
          </div>

          {/* Footer Meta & Controls */}
          <div className="pt-4 border-t border-[#DFE1E6]/60 flex items-center justify-between gap-3 text-sm font-semibold text-[#808897]">
            <span>
              {tally.completedCount}/{tally.totalEligible} participated
            </span>

            {canShowReopen && (
              <button
                type="button"
                onClick={() => onReopenFunDecider && onReopenFunDecider(plan.id)}
                className="flex items-center gap-1.5 text-sm font-bold text-[#1A1B25] hover:text-black transition cursor-pointer active:scale-95 select-none"
                title="Re-open round for all participants"
              >
                <RotateCw className="w-4 h-4 stroke-[2.5]" />
                <span>Re-open Round</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 4. PARTICIPANT CHECK-IN DECISION (Images 1 & 2 reference)
  // ==========================================
  const renderParticipantStatusDecision = (plan: AttachedPlan, isDeckView: boolean) => {
    const recordedEntries = (Object.values(plan.participantStatuses || {}) as ParticipantUserStatus[]).filter(
      (s) => !!s.statusOptionId
    );
    const myStatus = plan.participantStatuses?.[currentPersona.id];
    const hasResponded = Boolean(myStatus?.statusOptionId);

    const options = (plan.statusOptions && plan.statusOptions.length >= 2)
      ? plan.statusOptions
      : [
          { id: 'opt-attending', label: 'I will', emoji: '✅', color: 'emerald' },
          { id: 'opt-maybe', label: 'Maybe', emoji: '🤔', color: 'amber' },
          { id: 'opt-unavailable', label: 'Not available', emoji: '❌', color: 'rose' },
        ];

    const getOptionDisplayLabel = (opt: ParticipantStatusOption) => {
      const l = opt.label.trim().toLowerCase();
      if (l === 'attending' || l === 'i will') return 'I will';
      if (l === 'maybe') return 'Maybe';
      if (l === 'not attending' || l === 'not available' || l === 'unavailable') return 'Not available';
      return opt.label;
    };

    const renderStatusOptionIcon = (opt: ParticipantStatusOption) => {
      const l = opt.label.trim().toLowerCase();
      const e = opt.emoji || '';

      if (e === '✅' || l === 'attending' || l.includes('will') || l === 'yes') {
        return (
          <div className="w-5.5 h-5.5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
          </div>
        );
      }
      if (e === '🤔' || l === 'maybe') {
        return <span className="text-xl sm:text-[22px] leading-none shrink-0 select-none">🤔</span>;
      }
      if (e === '❌' || l.includes('not') || l.includes('unavailable') || l === 'no') {
        return (
          <div className="w-5.5 h-5.5 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-[#EF4444] stroke-[#EF4444] fill-none"
              strokeWidth="3.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        );
      }
      if (e) {
        return <span className="text-xl sm:text-[22px] leading-none shrink-0 select-none">{e}</span>;
      }
      return <div className="w-3 h-3 rounded-full bg-[#A4ABB8] shrink-0" />;
    };

    return (
      <div key={plan.id} className="relative w-full">
        {/* Stacked card bottom layer shadows/edges */}
        <div className="absolute -bottom-2.5 left-4 right-4 h-6 rounded-[28px] bg-[#F8F9FB] -z-10 shadow-xs" />
        <div className="absolute -bottom-5 left-8 right-8 h-6 rounded-[24px] bg-[#ECEFF3]/70 -z-20" />

        <div 
          id={`decision-card-${plan.id}`}
          className="w-full bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between select-none shadow-[0_16px_40px_-12px_rgba(26,27,37,0.08),0_4px_16px_-4px_rgba(26,27,37,0.03)] border border-[#ECEFF3]/60"
        >
          <div>
            {/* Header: Presenter Icon & Title (Images 1 & 2 reference) */}
            <div className="flex items-center gap-3 select-none">
              <svg
                viewBox="0 0 32 32"
                className="w-7 h-7 sm:w-8 sm:h-8 shrink-0"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Tripod legs */}
                <path d="M19 18 L15 29" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                <path d="M23 18 L27 29" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                <path d="M21 18 L21 29" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

                {/* Whiteboard */}
                <rect x="15" y="7" width="13" height="11" rx="1.5" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1.5" />
                {/* Blue top bar on board */}
                <path d="M15 8.5 C15 7.67 15.67 7 H26.5 C27.33 7 28 7.67 28 8.5 V10 H15 V8.5 Z" fill="#38BDF8" />
                {/* Horizontal lines on board */}
                <line x1="18" y1="13" x2="25" y2="13" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="18" y1="15.5" x2="23" y2="15.5" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />

                {/* Person Head */}
                <circle cx="8" cy="10" r="3" fill="#FCA5A5" />
                {/* Person Body */}
                <path d="M4 25 C4 20 6 15 10.5 15 C12 15 13 16 13.5 18 L10 25 Z" fill="#EF4444" />
                {/* Pointer Arm */}
                <path d="M9 17 L15 13" stroke="#FCA5A5" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              <span className="text-xl sm:text-[22px] font-black text-[#1A1B25] tracking-tight leading-none font-sans">
                Participant Check-in
              </span>
            </div>

            {/* Question */}
            <h3 className="text-2xl sm:text-[28px] font-black text-[#1A1B25] tracking-tight leading-snug mt-6 mb-6 font-sans">
              {plan.statusQuestion || 'Who will be attending?'}
            </h3>

            {/* Interactive Options Rows (Images 1 & 2 reference) */}
            <div className="space-y-3.5 my-2">
              {options.map((opt) => {
                const count = recordedEntries.filter((s) => s.statusOptionId === opt.id).length;
                const isMyChoice = myStatus?.statusOptionId === opt.id;
                const displayLabel = getOptionDisplayLabel(opt);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (onUpdateParticipantStatus) {
                        onUpdateParticipantStatus(plan.id, currentPersona.id, opt.id);
                        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
                      }
                    }}
                    className={`relative w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-full flex items-center justify-between transition-all select-none cursor-pointer active:scale-[0.99] ${
                      isMyChoice
                        ? 'bg-[#FFF6E9] border-2 border-[#E58A13] shadow-xs'
                        : 'bg-white border border-[#ECEFF3] hover:border-[#DFE1E6]'
                    }`}
                  >
                    {/* Floating amber checkmark badge when selected (Image 2 reference) */}
                    {isMyChoice && (
                      <div
                        className="absolute -top-2.5 right-4 z-10 w-5.5 h-5.5 rounded-full bg-[#E58A13] flex items-center justify-center shadow-xs pointer-events-none"
                        title="Your Selection"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                      </div>
                    )}

                    {/* Left: Icon & Label */}
                    <div className="flex items-center gap-3">
                      {renderStatusOptionIcon(opt)}
                      <span className="text-base sm:text-[17px] font-bold text-[#1A1B25] tracking-tight font-sans">
                        {displayLabel}
                      </span>
                    </div>

                    {/* Right: Selection count */}
                    <span className="text-sm font-semibold text-[#808897] font-sans">
                      {count} Selection
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer (Images 1 & 2 reference) */}
          <div className="mt-12 sm:mt-16 flex items-center justify-between text-sm font-semibold text-[#808897] select-none font-sans">
            <span>
              {recordedEntries.length}/{allMembers.length > 0 ? allMembers.length : 1} responded
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 5. TASK & DUTY DECISION
  // ==========================================
  const renderTaskDutyDecision = (plan: AttachedPlan, task: TaskItem | undefined, isDeckView: boolean) => {
    const isAssignedToMe = plan.assigneeId === currentPersona.id || plan.assigneeName === currentPersona.name;
    const isCompleted = plan.status === 'confirmed' || task?.status === 'completed';

    return (
      <div 
        key={plan.id}
        id={`decision-card-${plan.id}`}
        className="w-full bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between select-none shadow-[0_16px_40px_-12px_rgba(26,27,37,0.08),0_4px_16px_-4px_rgba(26,27,37,0.03)] border border-[#ECEFF3]/60"
      >
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[#ECEFF3] text-[#1A1B25] text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Task &amp; Duty Action</span>
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black whitespace-nowrap ${
              isCompleted
                ? 'bg-[#1A1B25] text-white'
                : plan.assigneeName
                ? 'bg-[#ECEFF3] text-[#1A1B25]'
                : 'bg-[#ECEFF3] text-[#666D80]'
            }`}>
              {isCompleted ? 'Completed ✓' : plan.assigneeName ? `Assigned: ${plan.assigneeName}` : 'Needs Volunteer'}
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-xl sm:text-2xl font-black text-[#1A1B25] tracking-tight leading-snug mb-2">
            {plan.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#666D80] mb-4 font-normal">
            {plan.taskDesc || plan.description || 'Coordinate and manage this duty for the group.'}
          </p>

          {/* Participation Status */}
          {isAssignedToMe ? (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#ECEFF3] text-[#1A1B25] text-xs sm:text-sm font-extrabold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1A1B25] stroke-[3]" />
                <span>Assigned to you ✓</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1A1B25] text-white text-[11px] font-black whitespace-nowrap">
                Participation Complete
              </span>
            </div>
          ) : plan.assigneeName ? (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#F8F9FB] text-[#666D80] text-xs sm:text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-[#808897]" />
              <span>Currently handled by {plan.assigneeName}</span>
            </div>
          ) : (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#ECEFF3] text-[#1A1B25] text-xs sm:text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1A1B25] shrink-0" />
              <span>Open for volunteers! Step up to take on this duty.</span>
            </div>
          )}

          {/* Action Buttons */}
          {!plan.assigneeName && onVolunteerForTask && task && (
            <button
              type="button"
              onClick={() => {
                onVolunteerForTask(task.id, currentPersona.id, currentPersona.name);
                confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white text-sm sm:text-base font-black transition cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2 mb-4"
            >
              <CheckSquare className="w-4 h-4" />
              <span>🙋 Volunteer for this Duty</span>
            </button>
          )}

          {isAssignedToMe && onToggleTaskComplete && task && (
            <button
              type="button"
              onClick={() => {
                onToggleTaskComplete(task.id);
                confetti({ particleCount: 45, spread: 65, origin: { y: 0.8 } });
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white text-sm sm:text-base font-black transition cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2 mb-4"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Mark as In-Progress' : 'Mark Task as Completed ✓'}</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#DFE1E6]/60 text-xs sm:text-sm font-bold text-[#666D80]">
          <span>Updates The Plan assignee in real time</span>
        </div>
      </div>
    );
  };

  const activeDecision = unifiedDecisions[currentSlideIndex];

  return (
    <section id="decisions-section" className="mb-12 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-black text-[#1A1B25] tracking-tight leading-tight">
            Voting &amp; Decision
          </h2>
          <p className="text-sm sm:text-[15px] text-[#666D80] mt-1 font-normal leading-normal">
            Slide and swipe across decisions to vote, spin wheels, and draw mystery cards
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCreateItem}
            title="Create New Decision or Action"
            aria-label="Create New Decision or Action"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="bg-[#F8F9FB] rounded-3xl p-10 text-center">
          <p className="text-[#666D80] font-bold text-sm">No decisions currently open on this board.</p>
          <button
            type="button"
            onClick={onOpenCreateItem}
            className="mt-4 px-5 py-2.5 rounded-2xl bg-[#1A1B25] text-white text-xs font-black hover:bg-[#272835] transition cursor-pointer"
          >
            Create First Decision
          </button>
        </div>
      ) : (
        /* STACKED DECK PRESENTATION: Strictly designed as physical stacked cards matching user reference image */
        <div className="w-full max-w-2xl mx-auto">
          <div
            className="relative w-full pb-9 sm:pb-11 select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Physical Stacked Deck Under-Layers peeking out at the bottom */}
            {totalCount > 1 && (
              <div className="absolute inset-x-0 bottom-9 sm:bottom-11 pointer-events-none">
                {/* Layer 2 (Bottom-most card in stack, deepest gray) */}
                {totalCount >= 3 && (
                  <div
                    onClick={goToNext}
                    className="absolute left-6 right-6 sm:left-8 sm:right-8 -bottom-6 sm:-bottom-7 h-16 sm:h-20 bg-[#ECEFF3] rounded-b-[28px] sm:rounded-b-[32px] shadow-sm transition-all duration-300 pointer-events-auto cursor-pointer hover:bg-[#DFE1E6]"
                    title={`Next in stack: ${unifiedDecisions[(currentSlideIndex + 2) % totalCount]?.title}`}
                  />
                )}

                {/* Layer 1 (Middle card in stack, soft light gray) */}
                <div
                  onClick={goToNext}
                  className="absolute left-3 right-3 sm:left-4 sm:right-4 -bottom-3 sm:-bottom-3.5 h-16 sm:h-20 bg-[#F8F9FB] rounded-b-[28px] sm:rounded-b-[32px] shadow-sm transition-all duration-300 pointer-events-auto cursor-pointer hover:bg-[#ECEFF3]"
                  title={`Next in stack: ${unifiedDecisions[(currentSlideIndex + 1) % totalCount]?.title}`}
                />
              </div>
            )}

            {/* Top Active Card with Drag Swipe & Smooth Slide Transition */}
            <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
              <motion.div
                key={activeDecision?.id || currentSlideIndex}
                custom={slideDirection}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -45 || info.velocity.x < -300) {
                    goToNext();
                  } else if (info.offset.x > 45 || info.velocity.x > 300) {
                    goToPrev();
                  }
                }}
                initial={{ opacity: 0, x: slideDirection > 0 ? 55 : -55, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: slideDirection > 0 ? -55 : 55, scale: 0.98 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="relative z-10 w-full cursor-grab active:cursor-grabbing"
              >
                {activeDecision && renderDecisionCard(activeDecision, true)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Carousel Navigation Controls */}
          <div className="flex items-center justify-between gap-3 mt-4 pt-1">
            <button
              type="button"
              onClick={goToPrev}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#ECEFF3] text-[#1A1B25] text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold text-[#808897] text-center">
              Tap stacked cards or swipe to cycle
            </span>

            <button
              type="button"
              onClick={goToNext}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#ECEFF3] text-[#1A1B25] text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Wheel Spinner Decider Modal */}
      {activeWheelPlan && (() => {
        const livePlan = plans.find((p) => p.id === activeWheelPlan.id) || activeWheelPlan;
        return (
          <WheelSpinnerDecider
            isOpen={Boolean(activeWheelPlan)}
            onClose={() => setActiveWheelPlan(null)}
            plan={livePlan}
            planTitle={livePlan.title}
            planEmoji={livePlan.emoji}
            question={livePlan.spinnerQuestion}
            options={livePlan.spinnerOptions || []}
            currentWinner={livePlan.currentSelection}
            currentUserId={currentPersona.id}
            currentUserName={currentPersona.name}
            currentUserAvatar={currentPersona.avatar}
            isOwnerOrAdmin={currentPersona.role === 'owner' || currentPersona.role === 'admin'}
            totalEligibleMembers={allMembers.length > 0 ? allMembers.length : 1}
            onSaveParticipantSelection={(winner) => {
              if (onParticipateFunDecider) {
                onParticipateFunDecider(livePlan.id, winner);
              }
            }}
            onReopenDecision={() => {
              if (onReopenFunDecider) {
                onReopenFunDecider(livePlan.id);
              }
            }}
            onFinalizeEarly={(winner) => {
              if (onFinalizeFunDecider) {
                onFinalizeFunDecider(livePlan.id, winner);
              }
            }}
            onUndoFinalize={() => {
              if (onUndoFinalizeFunDecider) {
                onUndoFinalizeFunDecider(livePlan.id);
              }
            }}
          />
        );
      })()}

      {/* Interactive Blind Pick Decider Modal */}
      {activeBlindPickPlan && (() => {
        const livePlan = plans.find((p) => p.id === activeBlindPickPlan.id) || activeBlindPickPlan;
        return (
          <BlindPickDecider
            isOpen={Boolean(activeBlindPickPlan)}
            onClose={() => setActiveBlindPickPlan(null)}
            plan={livePlan}
            planTitle={livePlan.title}
            planEmoji={livePlan.emoji}
            question={livePlan.spinnerQuestion}
            options={livePlan.spinnerOptions || []}
            currentWinner={livePlan.currentSelection}
            currentUserId={currentPersona.id}
            currentUserName={currentPersona.name}
            currentUserAvatar={currentPersona.avatar}
            isOwnerOrAdmin={currentPersona.role === 'owner' || currentPersona.role === 'admin'}
            totalEligibleMembers={allMembers.length > 0 ? allMembers.length : 1}
            onSaveParticipantSelection={(winner) => {
              if (onParticipateFunDecider) {
                onParticipateFunDecider(livePlan.id, winner);
              }
            }}
            onReopenDecision={() => {
              if (onReopenFunDecider) {
                onReopenFunDecider(livePlan.id);
              }
            }}
            onFinalizeEarly={(winner) => {
              if (onFinalizeFunDecider) {
                onFinalizeFunDecider(livePlan.id, winner);
              }
            }}
            onUndoFinalize={() => {
              if (onUndoFinalizeFunDecider) {
                onUndoFinalizeFunDecider(livePlan.id);
              }
            }}
          />
        );
      })()}
    </section>
  );
};
