import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Check, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

import { AttachedPlan } from '../types';
import { calculateCollectiveFunDecision } from '../utils/deciderCollective';

interface WheelSpinnerDeciderProps {
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

function playTickSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch {
    // Safe fallback
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
    // Safe fallback
  }
}

export const WheelSpinnerDecider: React.FC<WheelSpinnerDeciderProps> = ({
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
  const effectiveTitle = planTitle || plan?.title || 'Where Should We Eat?';
  const effectiveEmoji = planEmoji || plan?.emoji || '🎡';
  const effectiveQuestion = question || plan?.spinnerQuestion || `What should we choose for ${effectiveTitle}?`;
  const rawOptions = options || plan?.spinnerOptions || [];

  const cleanOptions = Array.isArray(rawOptions) && rawOptions.length >= 2
    ? rawOptions.filter((o) => typeof o === 'string' && o.trim().length > 0)
    : ['KFC', 'Chicken Republic', 'Kilimanjaro', 'The Place', "Domino's"];

  const existingParticipantSelection = currentUserId && plan?.participantSelections
    ? plan.participantSelections[currentUserId]
    : undefined;

  const [mySpinResult, setMySpinResult] = useState<string | null>(
    existingParticipantSelection ? existingParticipantSelection.option : null
  );

  const [isLocallyFinalized, setIsLocallyFinalized] = useState<boolean>(
    Boolean(plan?.status === 'confirmed' && plan?.finalDecision)
  );

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pointerBounce, setPointerBounce] = useState(false);

  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (existingParticipantSelection) {
      setMySpinResult(existingParticipantSelection.option);
    } else {
      setMySpinResult(null);
    }
    setIsLocallyFinalized(Boolean(plan?.status === 'confirmed' && plan?.finalDecision));
  }, [existingParticipantSelection, currentUserId, plan?.id, plan?.status, plan?.finalDecision, plan?.decisionRound]);

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const hasSelected = Boolean(mySpinResult);
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
          (acc, opt) => ({ ...acc, [opt]: opt === mySpinResult ? 1 : 0 }),
          {} as Record<string, number>
        ),
        selectionsByOption: {},
        leader: mySpinResult ? { option: mySpinResult, count: 1 } : null,
        winner: null,
        isTied: false,
        selectionsList: [],
        percentageCompleted: 0,
      };

  const displayCounts: Record<string, number> = { ...baseTally.countsByOption };
  let displayCompletedCount = baseTally.completedCount;

  if (mySpinResult && (!plan?.participantSelections || !plan.participantSelections[currentUserId])) {
    displayCounts[mySpinResult] = (displayCounts[mySpinResult] || 0) + 1;
    displayCompletedCount = Math.min(baseTally.totalEligible, displayCompletedCount + 1);
  }

  let highestCount = 0;
  let topOpt = cleanOptions[0];
  Object.entries(displayCounts).forEach(([opt, cnt]) => {
    if (cnt > highestCount) {
      highestCount = cnt;
      topOpt = opt;
    }
  });

  const displayTotalEligible = plan?.totalParticipantsNeeded || totalEligibleMembers || 20;

  const winnerOption = isEffectivelyFinalized
    ? (plan?.wheelWinningOption || plan?.currentSelection || mySpinResult || baseTally.winner?.option || topOpt)
    : (baseTally.winner?.option || (highestCount > 0 && highestCount >= displayTotalEligible ? topOpt : null));

  const N = cleanOptions.length;
  const sliceAngle = 360 / N;
  const radius = 170;

  // Execute wheel spin
  const handleSpin = () => {
    if (isEffectivelyFinalized || isSpinning || cleanOptions.length < 2) return;

    setIsSpinning(true);

    const winningIdx = Math.floor(Math.random() * N);
    const winningOpt = cleanOptions[winningIdx];

    const sliceCenterAngle = (winningIdx + 0.5) * sliceAngle;
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.4);
    const targetRemainder = (360 - sliceCenterAngle - jitter + 720) % 360;

    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const currentModulo = rotation % 360;
    let diff = (targetRemainder - currentModulo + 360) % 360;
    if (diff < 90) diff += 360;

    const nextRotation = rotation + fullSpins * 360 + diff;
    setRotation(nextRotation);

    let tickDelay = 50;
    let elapsed = 0;
    const totalDuration = 4200;

    const runTicker = () => {
      playTickSound();
      setPointerBounce(true);
      setTimeout(() => setPointerBounce(false), 40);

      elapsed += tickDelay;
      const progress = elapsed / totalDuration;
      tickDelay = Math.min(380, 50 + Math.pow(progress, 3) * 330);

      if (elapsed < totalDuration - 200) {
        tickIntervalRef.current = setTimeout(runTicker, tickDelay);
      }
    };
    runTicker();

    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      setMySpinResult(winningOpt);

      playWinFanfare();
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'],
        });
      } catch {
        // Fallback
      }

      onSaveParticipantSelection(winningOpt);
    }, totalDuration);
  };

  const handleFinalize = () => {
    if (!hasSelected) return;
    const winningOpt = mySpinResult || topOpt || cleanOptions[0];
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
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EDE9FE] text-[#7C3AED]">
                Wheel Spinner
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSpinning}
            aria-label="Close modal"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] flex items-center justify-center text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer disabled:opacity-40"
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
            Spin the wheel to make your choice!
          </p>
        </div>

        {/* Wheel Spinner Section */}
        <div className="w-full my-4 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
            {/* Pointer / Flapper Indicator at 12 o'clock */}
            <div
              className={`absolute -top-1.5 left-1/2 -translate-x-1/2 z-30 transition-transform duration-75 origin-top ${
                pointerBounce ? '-rotate-12 scale-110' : 'rotate-0 scale-100'
              }`}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
            >
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[22px] border-t-[#F59E0B]" />
            </div>

            {/* SVG Wheel */}
            <svg
              viewBox={`-${radius + 14} -${radius + 14} ${(radius + 14) * 2} ${(radius + 14) * 2}`}
              className="w-full h-full drop-shadow-md cursor-pointer touch-manipulation"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4.2s cubic-bezier(0.15, 0.95, 0.25, 1)'
                  : 'none',
              }}
              onClick={handleSpin}
            >
              <circle
                r={radius + 8}
                fill="#FFFFFF"
                stroke="#ECEFF3"
                strokeWidth="4"
              />

              {cleanOptions.map((opt, i) => {
                const startAngle = (i * sliceAngle * Math.PI) / 180;
                const endAngle = ((i + 1) * sliceAngle * Math.PI) / 180;
                const x1 = radius * Math.sin(startAngle);
                const y1 = -radius * Math.cos(startAngle);
                const x2 = radius * Math.sin(endAngle);
                const y2 = -radius * Math.cos(endAngle);
                const largeArc = sliceAngle > 180 ? 1 : 0;
                const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                const textAngleDeg = (i + 0.5) * sliceAngle;
                const sliceColor = OPTION_DOT_COLORS[i % OPTION_DOT_COLORS.length];

                return (
                  <g key={`slice-${i}`}>
                    <path
                      d={pathData}
                      fill={sliceColor}
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                    <g transform={`rotate(${textAngleDeg}) translate(0, -${radius * 0.62})`}>
                      <text
                        transform="rotate(-90)"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#FFFFFF"
                        fontWeight="800"
                        fontSize={cleanOptions.length > 7 ? '10' : '11'}
                        letterSpacing="0.2px"
                        className="select-none pointer-events-none drop-shadow-xs"
                      >
                        {opt.length > 14 ? `${opt.slice(0, 13)}…` : opt}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Center Hub */}
              <circle r="34" fill="#1A1B25" stroke="#FFFFFF" strokeWidth="4" />
              <circle r="26" fill="#272835" />
              <text
                y="5"
                textAnchor="middle"
                fontSize="18"
                className="select-none pointer-events-none"
              >
                🎡
              </text>
            </svg>
          </div>

          {/* Trigger Spin button or Result banner */}
          <div className="mt-3 w-full flex justify-center">
            {isSpinning ? (
              <span className="px-4 py-1.5 rounded-full bg-[#1A1B25] text-white text-xs font-bold animate-pulse">
                Spinning the wheel...
              </span>
            ) : hasSelected ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#EA580C] text-white text-xs font-bold shadow-xs">
                <Trophy className="w-3.5 h-3.5" />
                <span>Your pick: <strong>{mySpinResult}</strong></span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSpin}
                className="px-5 py-2 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Tap to Spin</span>
              </button>
            )}
          </div>
        </div>

        {/* Collective Group Tally Section */}
        <div className="w-full mt-1">
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
              const isSelectedByMe = mySpinResult === opt;
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
