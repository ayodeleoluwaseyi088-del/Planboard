import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Trophy, CheckCircle2, Users, AlertCircle, RotateCw, RotateCcw } from 'lucide-react';
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

const CARD_COLORS = [
  'from-rose-500 to-red-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-amber-400 to-yellow-600',
];

function playCardFlipSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  totalEligibleMembers = 4,
  onSaveParticipantSelection,
  onReopenDecision,
  onFinalizeEarly,
  onUndoFinalize,
}) => {
  const isFinalized = plan?.status === 'confirmed' && Boolean(plan?.finalDecision);
  const effectiveTitle = planTitle || plan?.title || 'Group Decision';
  const effectiveEmoji = planEmoji || plan?.emoji || '🎴';
  const effectiveQuestion = question || plan?.spinnerQuestion || '';
  const rawOptions = options || plan?.spinnerOptions || [];

  const cleanOptions = Array.isArray(rawOptions) && rawOptions.length >= 2 
    ? rawOptions.filter((o) => typeof o === 'string' && o.trim().length > 0)
    : ['Option 1', 'Option 2'];

  // Check if current participant already made a selection in this round
  const existingParticipantSelection = currentUserId && plan?.participantSelections
    ? plan.participantSelections[currentUserId]
    : undefined;

  const [myPickResult, setMyPickResult] = useState<string | null>(
    existingParticipantSelection ? existingParticipantSelection.option : null
  );

  useEffect(() => {
    if (existingParticipantSelection) {
      setMyPickResult(existingParticipantSelection.option);
    } else {
      setMyPickResult(null);
    }
  }, [existingParticipantSelection, currentUserId, plan?.id, plan?.decisionRound]);

  const hasParticipated = Boolean(myPickResult);

  // Compute collective decision outcome
  const tally = plan 
    ? calculateCollectiveFunDecision(plan, totalEligibleMembers)
    : {
        totalEligible: totalEligibleMembers,
        completedCount: hasParticipated ? 1 : 0,
        remainingCount: Math.max(0, totalEligibleMembers - (hasParticipated ? 1 : 0)),
        isAllCompleted: totalEligibleMembers <= (hasParticipated ? 1 : 0),
        countsByOption: cleanOptions.reduce((acc, opt) => ({ ...acc, [opt]: opt === myPickResult ? 1 : 0 }), {} as Record<string, number>),
        selectionsByOption: {},
        leader: myPickResult ? { option: myPickResult, count: 1 } : null,
        winner: null,
        isTied: false,
        selectionsList: [],
        percentageCompleted: 0,
      };

  // Synchronously initialize deck
  const [shuffledIndices, setShuffledIndices] = useState<number[]>(() => 
    generateShuffledIndices(cleanOptions.length)
  );
  const [revealedSlotIdx, setRevealedSlotIdx] = useState<number | null>(null);

  // Ref lock to prevent double-clicks or rapid multi-tap race conditions
  const isPickedRef = useRef(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      isPickedRef.current = Boolean(myPickResult);
      if (!myPickResult) {
        setRevealedSlotIdx(null);
        setShuffledIndices(generateShuffledIndices(cleanOptions.length));
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, myPickResult, cleanOptions.length]);

  if (!isOpen) return null;

  // Single-click card pick: exactly 1 turn per participant
  const handlePickCard = (cardSlotIndex: number) => {
    // Guard against multiple clicks or picking after already completed
    if (hasParticipated || isPickedRef.current || revealedSlotIdx !== null) {
      return;
    }
    isPickedRef.current = true;

    // Determine option for this slot
    const chosenOptionIndex = shuffledIndices[cardSlotIndex] ?? (cardSlotIndex % cleanOptions.length);
    const winner = cleanOptions[chosenOptionIndex] || cleanOptions[0];

    // Sound & visuals
    playCardFlipSound();
    setRevealedSlotIdx(cardSlotIndex);
    setMyPickResult(winner);

    // Record participant's choice in collective engine
    onSaveParticipantSelection(winner);

    // Fanfare & celebration
    setTimeout(() => {
      playWinFanfare();
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'],
        });
      } catch {
        // Safe fallback
      }
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#ECEFF3] flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#ECEFF3] bg-[#F8F9FB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{effectiveEmoji}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">
                  Fun Decider: Blind Pick Cards
                </span>
                {plan?.isReopened && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black">
                    Round {plan.decisionRound || 2} Reopened
                  </span>
                )}
                <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black">
                  1 Pick / Participant
                </span>
              </div>
              <h3 className="text-base font-black text-[#1A1B25] leading-tight">
                {effectiveTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#808897] hover:text-[#1A1B25] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-between space-y-4">
          {/* Prompt Banner */}
          <div className="w-full text-center px-2">
            <h4 className="text-sm font-black text-[#1A1B25]">
              {effectiveQuestion || `What will blind pick reveal for ${effectiveTitle}?`}
            </h4>
            <p className="text-xs text-[#666D80] mt-0.5">
              {hasParticipated 
                ? 'Your one-time mystery card selection is recorded! View the collective group results below.'
                : '1 card per participant. Tap any face-down mystery card to draw your choice!'}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="w-full py-1">
            <div className={`grid gap-2.5 transition-all duration-300 ${
              cleanOptions.length <= 4 
                ? 'grid-cols-2 sm:grid-cols-4' 
                : cleanOptions.length <= 6 
                ? 'grid-cols-3 sm:grid-cols-3' 
                : 'grid-cols-3 sm:grid-cols-4'
            }`}>
              {cleanOptions.map((_, slotIdx) => {
                const optIdx = shuffledIndices[slotIdx] ?? slotIdx;
                const optionLabel = cleanOptions[optIdx];
                const isThisSlotRevealed = revealedSlotIdx === slotIdx || (hasParticipated && myPickResult === optionLabel);
                const isWinnerCard = isThisSlotRevealed && (myPickResult === optionLabel);
                const cardGradient = CARD_COLORS[optIdx % CARD_COLORS.length];

                return (
                  <button
                    key={slotIdx}
                    type="button"
                    onClick={() => handlePickCard(slotIdx)}
                    disabled={hasParticipated}
                    aria-label={`Mystery card ${slotIdx + 1}`}
                    className={`relative aspect-[3/4] rounded-2xl p-2.5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center select-none shadow-sm touch-manipulation ${
                      !hasParticipated 
                        ? 'bg-gradient-to-br from-[#1A1B25] to-[#272835] hover:scale-105 hover:shadow-md border border-[#353849] active:scale-95' 
                        : isWinnerCard
                        ? `bg-gradient-to-br ${cardGradient} text-white ring-4 ring-amber-400 shadow-lg scale-102`
                        : 'bg-[#F8F9FB] border border-[#ECEFF3] text-[#808897] opacity-40 pointer-events-none'
                    }`}
                  >
                    {!hasParticipated ? (
                      // Card Back
                      <div className="pointer-events-none flex flex-col items-center justify-center h-full">
                        <span className="text-2xl mb-1">🎴</span>
                        <span className="w-6 h-6 rounded-full bg-white/10 text-white/80 font-black text-xs flex items-center justify-center">
                          ?
                        </span>
                        <span className="text-[10px] font-bold text-white/60 mt-1 uppercase tracking-widest">
                          Pick
                        </span>
                      </div>
                    ) : (
                      // Card Front (Revealed)
                      <div className="pointer-events-none flex flex-col items-center justify-center h-full animate-in zoom-in-75 duration-200">
                        {isWinnerCard ? (
                          <>
                            <Trophy className="w-5 h-5 text-amber-200 mb-1 drop-shadow-xs" />
                            <span className="text-xs font-black leading-tight text-white line-clamp-3">
                              {optionLabel}
                            </span>
                            <span className="mt-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-extrabold uppercase tracking-wider text-white">
                              Your Pick ✓
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-[#666D80] line-clamp-2">
                            {optionLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Participant Completed Status Banner */}
          {hasParticipated && (
            <div className="w-full p-3 rounded-2xl bg-purple-50 border border-purple-300 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>Your Mystery Pick Recorded</span>
                  </span>
                  <p className="text-sm font-black text-purple-950 truncate">
                    {myPickResult}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold shrink-0">
                  Completed ✓
                </span>
              </div>
            </div>
          )}

          {/* Live Collective Group Tally & Results Breakdown */}
          <div className="w-full p-3.5 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1A1B25] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-700" />
                <span>Collective Group Tally</span>
              </span>
              <span className="text-[11px] font-extrabold text-[#666D80]">
                {tally.completedCount} of {tally.totalEligible} participants completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#DFE1E6] h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500 rounded-full"
                style={{ width: `${tally.percentageCompleted}%` }}
              />
            </div>

            {/* Options Breakdown with Participant Chips */}
            <div className="space-y-1.5 pt-1">
              {cleanOptions.map((opt, i) => {
                const count = tally.countsByOption[opt] || 0;
                const voters = tally.selectionsByOption[opt] || [];
                const finalizedWinner = isFinalized ? (plan?.wheelWinningOption || plan?.currentSelection) : null;
                const isWinner = isFinalized
                  ? (finalizedWinner === opt || (finalizedWinner ? finalizedWinner.includes(opt) : false))
                  : (tally.winner?.option === opt);
                const isLeader = !isWinner && tally.leader?.option === opt && count > 0;
                const isMyPick = myPickResult === opt;

                return (
                  <div 
                    key={i}
                    className={`p-2 rounded-xl border transition-all ${
                      isWinner
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                        : isLeader
                        ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300'
                        : isMyPick
                        ? 'bg-white border-purple-300'
                        : 'bg-white border-[#ECEFF3]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                        <span className="font-extrabold text-[#1A1B25] truncate">
                          {opt}
                        </span>
                        {isMyPick && (
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[9px] font-black">
                            You
                          </span>
                        )}
                        {isWinner && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-600 text-white text-[9px] font-black flex items-center gap-0.5">
                            <Trophy className="w-2.5 h-2.5" />
                            <span>Winner</span>
                          </span>
                        )}
                        {isLeader && (
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-950 text-[9px] font-black">
                            Leading
                          </span>
                        )}
                      </div>
                      <span className="font-black text-[#1A1B25] shrink-0 ml-2">
                        {count} {count === 1 ? 'selection' : 'selections'}
                      </span>
                    </div>

                    {/* Participant Names */}
                    {voters.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {voters.map((v, vIdx) => (
                          <span 
                            key={vIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#ECEFF3] text-[#353849] text-[10px] font-bold"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[8px] font-black">
                              {v.userName.charAt(0)}
                            </span>
                            <span>{v.userName}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status Conclusion Banner */}
            <div className="pt-1">
              {isFinalized ? (
                <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Decision Finalized! <strong>{plan?.finalDecision || plan?.wheelWinningOption || plan?.currentSelection}</strong> is confirmed on the Plan.
                  </span>
                </div>
              ) : tally.isAllCompleted && tally.winner ? (
                <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Collective decision completed! <strong>{tally.winner.option}</strong> won with {tally.winner.count} selections and is confirmed on the Plan.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>
                    {tally.completedCount === 0
                      ? `Awaiting participant picks (0 of ${tally.totalEligible} completed).`
                      : `In progress: ${tally.remainingCount} more participant${tally.remainingCount === 1 ? '' : 's'} needed to finalize collective decision.`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Note that Reshuffle & Pick Again is COMPLETELY REMOVED */}
          <div className="w-full space-y-2 pt-1">
            {hasParticipated ? (
              <div className="w-full p-2.5 rounded-2xl bg-[#ECEFF3] text-[#666D80] text-center text-xs font-bold">
                ✓ You have completed your one mystery card pick for this round.
              </div>
            ) : (
              <div className="w-full p-2.5 rounded-2xl bg-purple-50 text-purple-900 text-center text-xs font-bold border border-purple-200">
                Tap any mystery card above to make your selection.
              </div>
            )}

            {/* Administrative Controls: Reopen Decision (Owner / Admin only) */}
            {isOwnerOrAdmin && (
              <div className="w-full p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 text-left mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                    Admin / Owner Controls
                  </span>
                  <span className="text-[10px] font-bold text-blue-800">
                    Round {plan?.decisionRound || 1}
                  </span>
                </div>
                <p className="text-[11px] text-blue-950">
                  {isFinalized
                    ? 'This decision is currently finalized on the Plan. You can undo finalization to return to an active decision state without losing participant records.'
                    : 'A completed decision stays closed. Only the Board Owner or Admin can finalize with the leader or reopen for a new round.'}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {onReopenDecision && (
                    <button
                      type="button"
                      onClick={onReopenDecision}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                      title="Reset all participant choices and begin a new round"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Re-open Decision (Round {(plan?.decisionRound || 1) + 1})</span>
                    </button>
                  )}
                  {isFinalized ? (
                    onUndoFinalize && (
                      <button
                        type="button"
                        onClick={onUndoFinalize}
                        className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                        title="Undo finalization and return to active decision state"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo Finalization / Re-open Decision</span>
                      </button>
                    )
                  ) : (
                    onFinalizeEarly && tally.leader && (
                      <button
                        type="button"
                        onClick={() => onFinalizeEarly(tally.leader?.option)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                        title="Finalize group decision with current leading option"
                      >
                        <span>Finalize with Leader</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-bold text-[#808897] hover:text-[#1A1B25] transition cursor-pointer"
            >
              Done & Return to Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
