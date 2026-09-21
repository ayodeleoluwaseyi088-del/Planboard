import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Check, RotateCcw, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';

import { AttachedPlan } from '../types';
import { calculateCollectiveFunDecision } from '../utils/deciderCollective';

interface BlindPickDeciderProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: AttachedPlan;
  planTitle?: string;
  planEmoji?: string;
  question?: string;
  options?: string[];
  currentWinner?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  isOwnerOrAdmin?: boolean;
  totalEligibleMembers?: number;
  onSaveParticipantSelection: (winner: string) => void;
  onReopenDecision?: () => void;
  onFinalizeEarly?: (winner?: string) => void;
  onUndoFinalize?: () => void;
}

const OPTION_DOT_COLORS = [
  '#8B5CF6', // Purple (KFC in image)
  '#3B82F6', // Blue (Chicken Republic in image)
  '#06B6D4', // Teal/Cyan (Kilimanjaro in image)
  '#F59E0B', // Amber/Yellow (The Place in image)
  '#EC4899', // Pink/Coral (Domino's in image)
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#EF4444', // Red
];

function playCardFlipSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio ignored safely if blocked
  }
}

function playWinFanfare() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + idx * 0.08;
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.32);
    });
  } catch {
    // Ignore
  }
}

function generateShuffledIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export const BlindPickDecider: React.FC<BlindPickDeciderProps> = ({
  isOpen,
  onClose,
  plan,
  planTitle,
  planEmoji,
  question,
  options,
  currentWinner,
  currentUserId = '',
  currentUserName = 'Member',
  currentUserAvatar,
  isOwnerOrAdmin = false,
  totalEligibleMembers = 20,
  onSaveParticipantSelection,
  onReopenDecision,
  onFinalizeEarly,
  onUndoFinalize,
}) => {
  const effectiveTitle = planTitle || plan?.title || 'Food';
  const effectiveEmoji = planEmoji || plan?.emoji || '🍹';
  const effectiveQuestion = question || plan?.spinnerQuestion || `What should we choose for ${effectiveTitle}?`;
  const rawOptions = options || plan?.spinnerOptions || [];

  const cleanOptions = Array.isArray(rawOptions) && rawOptions.length >= 2
    ? rawOptions.filter((o) => typeof o === 'string' && o.trim().length > 0)
    : ['KFC', 'Chicken Republic', 'Kilimanjaro', 'The Place', "Domino's"];

  // Total card slots in 3 columns: ensure at least 6 cards (3x2 grid) exactly as in design reference
  const totalSlots = Math.max(6, cleanOptions.length);

  // Check if current participant already made a selection
  const existingParticipantSelection = currentUserId && plan?.participantSelections
    ? plan.participantSelections[currentUserId]
    : undefined;

  const [myPickResult, setMyPickResult] = useState<string | null>(
    existingParticipantSelection ? existingParticipantSelection.option : null
  );

  const [isLocallyFinalized, setIsLocallyFinalized] = useState<boolean>(
    Boolean(plan?.status === 'confirmed' && plan?.finalDecision)
  );

  const [shuffledIndices, setShuffledIndices] = useState<number[]>(() =>
    generateShuffledIndices(totalSlots)
  );

  const [revealedSlotIdx, setRevealedSlotIdx] = useState<number | null>(null);
  const [isShufflingAnimation, setIsShufflingAnimation] = useState<boolean>(false);

  const isPickedRef = useRef(false);
  const prevIsOpenRef = useRef(false);

  // Synchronize when existing participant selection or plan status changes
  useEffect(() => {
    if (existingParticipantSelection) {
      setMyPickResult(existingParticipantSelection.option);
    } else {
      setMyPickResult(null);
    }
    setIsLocallyFinalized(Boolean(plan?.status === 'confirmed' && plan?.finalDecision));
  }, [existingParticipantSelection, currentUserId, plan?.id, plan?.status, plan?.finalDecision, plan?.decisionRound]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      isPickedRef.current = Boolean(myPickResult);
      if (!myPickResult) {
        setRevealedSlotIdx(null);
        setShuffledIndices(generateShuffledIndices(totalSlots));
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, myPickResult, totalSlots]);

  if (!isOpen) return null;

  const hasSelected = Boolean(myPickResult);
  const isEffectivelyFinalized = isLocallyFinalized || (plan?.status === 'confirmed' && Boolean(plan?.finalDecision));

  // Compute collective decision outcome
  const baseTally = plan
    ? calculateCollectiveFunDecision(plan, totalEligibleMembers || 20)
    : {
        totalEligible: totalEligibleMembers || 20,
        completedCount: hasSelected ? 1 : 0,
        remainingCount: Math.max(0, (totalEligibleMembers || 20) - (hasSelected ? 1 : 0)),
        isAllCompleted: false,
        countsByOption: cleanOptions.reduce(
          (acc, opt) => ({ ...acc, [opt]: opt === myPickResult ? 1 : 0 }),
          {} as Record<string, number>
        ),
        selectionsByOption: {},
        leader: myPickResult ? { option: myPickResult, count: 1 } : null,
        winner: null,
        isTied: false,
        selectionsList: [],
        percentageCompleted: 0,
      };

  // Adjust counts with local pick if not yet saved into plan.participantSelections
  const displayCounts: Record<string, number> = { ...baseTally.countsByOption };
  let displayCompletedCount = baseTally.completedCount;

  if (myPickResult && (!plan?.participantSelections || !plan.participantSelections[currentUserId])) {
    displayCounts[myPickResult] = (displayCounts[myPickResult] || 0) + 1;
    displayCompletedCount = Math.min(baseTally.totalEligible, displayCompletedCount + 1);
  }

  // Calculate highest option for leader/winner
  let highestCount = 0;
  let topOpt = cleanOptions[0];
  Object.entries(displayCounts).forEach(([opt, cnt]) => {
    if (cnt > highestCount) {
      highestCount = cnt;
      topOpt = opt;
    }
  });

  const displayTotalEligible = plan?.totalParticipantsNeeded || totalEligibleMembers || 20;

  // Determine winner option to mark in Tally
  const winnerOption = isEffectivelyFinalized
    ? (plan?.wheelWinningOption || plan?.currentSelection || myPickResult || baseTally.winner?.option || topOpt)
    : (baseTally.winner?.option || (highestCount > 0 && highestCount >= displayTotalEligible ? topOpt : null));

  // Re-shuffle action
  const handleReshuffle = () => {
    if (isEffectivelyFinalized) return;
    setIsShufflingAnimation(true);
    playCardFlipSound();
    setShuffledIndices(generateShuffledIndices(totalSlots));
    setRevealedSlotIdx(null);
    setMyPickResult(null);
    isPickedRef.current = false;
    setTimeout(() => {
      setIsShufflingAnimation(false);
    }, 280);
  };

  // Single-click card pick
  const handlePickCard = (slotIdx: number) => {
    if (isEffectivelyFinalized) return;

    isPickedRef.current = true;
    const optIdx = shuffledIndices[slotIdx] ?? (slotIdx % cleanOptions.length);
    const chosenOption = cleanOptions[optIdx % cleanOptions.length];

    playCardFlipSound();
    setRevealedSlotIdx(slotIdx);
    setMyPickResult(chosenOption);

    // Save selection to parent
    onSaveParticipantSelection(chosenOption);

    // Celebration
    setTimeout(() => {
      playWinFanfare();
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'],
        });
      } catch {
        // Safe fallback
      }
    }, 150);
  };

  // Finalise action
  const handleFinalize = () => {
    if (!hasSelected) return;
    const winningOpt = myPickResult || topOpt || cleanOptions[0];
    setIsLocallyFinalized(true);
    if (onFinalizeEarly) {
      onFinalizeEarly(winningOpt);
    }
    playWinFanfare();
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
      });
    } catch {
      // Safe fallback
    }
  };

  // Undo-finalisation action
  const handleUndoFinalize = () => {
    setIsLocallyFinalized(false);
    if (onUndoFinalize) {
      onUndoFinalize();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-[440px] sm:max-w-[460px] rounded-[32px] p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto relative scrollbar-none animate-in zoom-in-95 duration-150"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl leading-none select-none">
              {effectiveEmoji}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#1A1B25] leading-tight">
                {effectiveTitle}
              </h3>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE4E6] text-[#E11D48]">
                Blind Pick Card
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] flex items-center justify-center text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Headline & Subtitle */}
        <div className="w-full text-center mt-3">
          <h4 className="text-lg sm:text-[19px] font-extrabold text-[#1A1B25] tracking-tight">
            {effectiveQuestion}
          </h4>
          <p className="text-xs sm:text-[13px] text-[#808897] font-semibold mt-1 max-w-[280px] mx-auto leading-relaxed">
            Tap any face-down mystery card to draw your choice!
          </p>

          {/* Centered Re-shuffle Button */}
          <button
            type="button"
            onClick={handleReshuffle}
            disabled={isEffectivelyFinalized}
            className="mx-auto mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#353849] hover:text-[#1A1B25] hover:bg-[#F6F8FA] transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isShufflingAnimation ? 'animate-spin' : ''}`} />
            <span>Re-shuffle</span>
          </button>
        </div>

        {/* Mystery Cards Section */}
        <div className="w-full my-4">
          {!hasSelected ? (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {Array.from({ length: totalSlots }).map((_, slotIdx) => (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => handlePickCard(slotIdx)}
                  aria-label={`Mystery card ${slotIdx + 1}`}
                  className={`h-24 sm:h-28 rounded-[18px] bg-[#707C8E] flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 transition-all shadow-xs select-none ${
                    isShufflingAnimation ? 'scale-95 rotate-1 opacity-80' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm mb-1">
                    ?
                  </div>
                  <span className="text-xs font-bold text-white tracking-wide">
                    Pick
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* After picking, display only the selected card strictly matching the reference */
            <div className="flex items-center justify-center gap-5 my-3 select-none">
              <div className="w-[124px] h-[124px] sm:w-[134px] sm:h-[134px] rounded-[22px] bg-gradient-to-b from-[#F5A623] via-[#F37023] to-[#E04B16] flex flex-col items-center justify-center text-center p-3 shrink-0 shadow-xs animate-in zoom-in-95 duration-200">
                <Trophy className="w-9 h-9 text-white stroke-[2.2] mb-1.5 drop-shadow-xs" />
                <span className="text-lg sm:text-xl font-black text-white tracking-wide truncate max-w-full px-1">
                  {myPickResult}
                </span>
              </div>
              <span className="text-lg sm:text-xl font-semibold text-[#808897] select-none font-sans">
                Your pick
              </span>
            </div>
          )}
        </div>

        {/* Collective Group Tally Section */}
        <div className="w-full mt-2">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <span className="text-xs sm:text-[13px] font-extrabold text-[#1A1B25]">
              Collective Group Tally
            </span>
            <span className="text-xs font-bold text-[#808897]">
              {displayCompletedCount}/{displayTotalEligible} participant
            </span>
          </div>

          {/* Option List Pills */}
          <div className="space-y-2">
            {cleanOptions.map((opt, i) => {
              const isSelectedByMe = myPickResult === opt;
              const isWinner = Boolean(
                winnerOption &&
                (winnerOption === opt || winnerOption.toLowerCase().includes(opt.toLowerCase()))
              );
              const dotColor = OPTION_DOT_COLORS[i % OPTION_DOT_COLORS.length];
              const count = displayCounts[opt] || 0;

              return (
                <div
                  key={opt}
                  className={`px-4 py-2.5 sm:py-3 rounded-full flex items-center justify-between transition-all ${
                    isSelectedByMe
                      ? 'border-2 border-[#F59E0B] bg-[#FFF6E9]'
                      : 'border border-[#ECEFF3] bg-[#F8F9FB]'
                  }`}
                >
                  {/* Left: Dot + Name + (Winner Badge) */}
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="font-bold text-xs sm:text-[13px] text-[#1A1B25] truncate">
                      {opt}
                    </span>
                    {isWinner && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold inline-flex items-center gap-1 shrink-0 ml-1.5">
                        <Trophy className="w-2.5 h-2.5" />
                        <span>Winner</span>
                      </span>
                    )}
                  </div>

                  {/* Right: Selection count */}
                  <span className="text-xs font-bold text-[#808897] shrink-0">
                    {count} Selection
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Button Interaction: Only available to Board Owner/Admin */}
        {isOwnerOrAdmin && (
          <div className="w-full mt-4">
            {!hasSelected ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-6 rounded-full bg-[#DFE1E6] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-not-allowed select-none"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Finalise</span>
              </button>
            ) : isEffectivelyFinalized ? (
              <button
                type="button"
                onClick={handleUndoFinalize}
                className="w-full py-3.5 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition select-none"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Undo-finalisation</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalize}
                className="w-full py-3.5 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition select-none"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Finalise</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
