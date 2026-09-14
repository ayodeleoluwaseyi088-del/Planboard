import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCw, RotateCcw, Sparkles, Trophy, CheckCircle2, Users, AlertCircle } from 'lucide-react';
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

// Harmonious, distinct segment colors
const SEGMENT_COLORS = [
  '#EF4444', // Coral Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Royal Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

// Lightweight synthesized Web Audio API sounds
function playTickSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  totalEligibleMembers = 4,
  onSaveParticipantSelection,
  onReopenDecision,
  onFinalizeEarly,
  onUndoFinalize,
}) => {
  const isFinalized = plan?.status === 'confirmed' && Boolean(plan?.finalDecision);
  const effectiveTitle = planTitle || plan?.title || 'Group Decision';
  const effectiveEmoji = planEmoji || plan?.emoji || '🎡';
  const effectiveQuestion = question || plan?.spinnerQuestion || '';
  const rawOptions = options || plan?.spinnerOptions || [];

  // Clean options (at least 2 valid strings)
  const cleanOptions = Array.isArray(rawOptions) && rawOptions.length >= 2 
    ? rawOptions.filter((o) => typeof o === 'string' && o.trim().length > 0)
    : ['Option 1', 'Option 2'];

  // Check if current participant has already participated in this round
  const existingParticipantSelection = currentUserId && plan?.participantSelections
    ? plan.participantSelections[currentUserId]
    : undefined;

  // Local state for participant selection (for immediate responsive UI switch)
  const [mySpinResult, setMySpinResult] = useState<string | null>(
    existingParticipantSelection ? existingParticipantSelection.option : null
  );

  // Synchronize when plan changes or user switches
  useEffect(() => {
    if (existingParticipantSelection) {
      setMySpinResult(existingParticipantSelection.option);
    } else {
      setMySpinResult(null);
    }
  }, [existingParticipantSelection, currentUserId, plan?.id, plan?.decisionRound]);

  const hasParticipated = Boolean(mySpinResult);

  // Compute collective decision outcome
  const tally = plan 
    ? calculateCollectiveFunDecision(plan, totalEligibleMembers)
    : {
        totalEligible: totalEligibleMembers,
        completedCount: hasParticipated ? 1 : 0,
        remainingCount: Math.max(0, totalEligibleMembers - (hasParticipated ? 1 : 0)),
        isAllCompleted: totalEligibleMembers <= (hasParticipated ? 1 : 0),
        countsByOption: cleanOptions.reduce((acc, opt) => ({ ...acc, [opt]: opt === mySpinResult ? 1 : 0 }), {} as Record<string, number>),
        selectionsByOption: {},
        leader: mySpinResult ? { option: mySpinResult, count: 1 } : null,
        winner: null,
        isTied: false,
        selectionsList: [],
        percentageCompleted: 0,
      };

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [pointerBounce, setPointerBounce] = useState(false);

  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize highlight index to existing participant selection or leading choice
  useEffect(() => {
    const focusOpt = mySpinResult || tally.winner?.option || tally.leader?.option || currentWinner;
    if (focusOpt) {
      const idx = cleanOptions.findIndex((o) => o === focusOpt);
      if (idx !== -1) setHighlightIndex(idx);
    }
  }, [mySpinResult, tally.winner?.option, tally.leader?.option, currentWinner, cleanOptions.length]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const N = cleanOptions.length;
  const sliceAngle = 360 / N;
  const radius = 180;

  // Execute one-time spin for this participant
  const handleSpin = () => {
    // Rule: Once completed, the participant cannot spin again!
    if (hasParticipated || isSpinning || cleanOptions.length < 2) return;

    setIsSpinning(true);
    setHighlightIndex(null);

    // 1. Pick a random winning index
    const winningIdx = Math.floor(Math.random() * N);
    const winningOpt = cleanOptions[winningIdx];

    // 2. Compute exact target angle for pointer at 12 o'clock
    const sliceCenterAngle = (winningIdx + 0.5) * sliceAngle;
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.4);
    const targetRemainder = (360 - sliceCenterAngle - jitter + 720) % 360;

    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const currentModulo = rotation % 360;
    let diff = (targetRemainder - currentModulo + 360) % 360;
    if (diff < 90) diff += 360;

    const nextRotation = rotation + fullSpins * 360 + diff;
    setRotation(nextRotation);

    // Audio click ticker simulation
    let tickDelay = 50;
    let elapsed = 0;
    const totalDuration = 4500;

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

    // Spin completes
    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      setMySpinResult(winningOpt);
      setHighlightIndex(winningIdx);

      // Play victory fanfare and confetti
      playWinFanfare();
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'],
        });
      } catch {
        // Fallback
      }

      // Record this participant's one-time selection into the collective engine!
      onSaveParticipantSelection(winningOpt);
    }, totalDuration);
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
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Fun Decider: Wheel Spinner
                </span>
                {plan?.isReopened && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black">
                    Round {plan.decisionRound || 2} Reopened
                  </span>
                )}
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                  1 Spin / Participant
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
            disabled={isSpinning}
            className="p-1.5 rounded-full hover:bg-white text-[#808897] hover:text-[#1A1B25] transition cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-between space-y-4">
          {/* Question / Prompt Banner */}
          <div className="w-full text-center px-2">
            <h4 className="text-sm font-black text-[#1A1B25]">
              {effectiveQuestion || `Where or what should we decide for ${effectiveTitle}?`}
            </h4>
            <p className="text-xs text-[#666D80] mt-0.5">
              {isSpinning 
                ? 'The wheel is spinning your one-time selection...' 
                : hasParticipated
                ? 'You have completed your spin! View the collective group results below.'
                : 'Every participant gets 1 spin. Tap SPIN below to record your choice!'}
            </p>
          </div>

          {/* Wheel Stage Wrapper */}
          <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center select-none my-1">
            {/* Outer Drop Shadow Glow Ring */}
            <div className={`absolute inset-2 rounded-full transition-all duration-500 ${
              isSpinning 
                ? 'shadow-[0_0_35px_rgba(245,158,11,0.4)] ring-4 ring-amber-400/40' 
                : hasParticipated 
                ? 'shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-4 ring-emerald-400/40' 
                : 'shadow-xl'
            }`} />

            {/* Fixed Pointer at 12 O'Clock (Top Indicator) */}
            <div 
              className={`absolute top-[-6px] left-1/2 -translate-x-1/2 z-30 pointer-events-none drop-shadow-md transition-transform duration-75 origin-top ${
                pointerBounce ? 'scale-110 -rotate-6' : 'scale-100 rotate-0'
              }`}
            >
              <svg width="34" height="42" viewBox="0 0 34 42" className="overflow-visible">
                <polygon 
                  points="17,40 5,6 29,6" 
                  fill="#EF4444" 
                  stroke="#FFFFFF" 
                  strokeWidth="3" 
                  strokeLinejoin="round" 
                />
                <circle cx="17" cy="8" r="5" fill="#FFFFFF" stroke="#B91C1C" strokeWidth="2" />
                <circle cx="17" cy="8" r="2.5" fill="#EF4444" />
              </svg>
            </div>

            {/* Rotating SVG Wheel */}
            <svg
              viewBox="-200 -200 400 400"
              className="w-full h-full transform-gpu"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4.5s cubic-bezier(0.12, 0.85, 0.25, 1.0)' : 'none',
              }}
            >
              {cleanOptions.map((opt, i) => {
                const startAngle = i * sliceAngle;
                const endAngle = (i + 1) * sliceAngle;
                const midAngle = (i + 0.5) * sliceAngle;

                const rad1 = (startAngle * Math.PI) / 180;
                const rad2 = (endAngle * Math.PI) / 180;
                const x1 = radius * Math.sin(rad1);
                const y1 = -radius * Math.cos(rad1);
                const x2 = radius * Math.sin(rad2);
                const y2 = -radius * Math.cos(rad2);

                const isHighlight = highlightIndex === i && !isSpinning;
                const fillColor = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

                return (
                  <g key={`slice-${i}`}>
                    <path
                      d={`M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                      fill={fillColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      opacity={isHighlight ? 1 : highlightIndex !== null && !isSpinning ? 0.75 : 1}
                    />

                    <g transform={`rotate(${midAngle - 90})`}>
                      <text
                        x={radius * 0.58}
                        y="5"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        className="font-black text-[13px] tracking-wide select-none"
                        style={{
                          textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.8)',
                          fontFamily: 'Nunito, sans-serif',
                        }}
                      >
                        {opt.length > 14 ? `${opt.slice(0, 13)}…` : opt}
                      </text>
                    </g>
                  </g>
                );
              })}

              <circle
                r={radius + 4}
                fill="none"
                stroke="#1A1B25"
                strokeWidth="12"
              />

              {cleanOptions.map((_, i) => {
                const pegAngle = (i * sliceAngle * Math.PI) / 180;
                const px = (radius + 4) * Math.sin(pegAngle);
                const py = -(radius + 4) * Math.cos(pegAngle);
                return (
                  <circle
                    key={`peg-${i}`}
                    cx={px}
                    cy={py}
                    r="4"
                    fill="#F8F9FB"
                    stroke="#808897"
                    strokeWidth="1.5"
                  />
                );
              })}

              <circle r="36" fill="#1A1B25" stroke="#F8F9FB" strokeWidth="4" />
              <circle r="26" fill="#272835" />
              <text
                y="7"
                textAnchor="middle"
                fontSize="22"
                className="select-none pointer-events-none"
              >
                🎡
              </text>
            </svg>
          </div>

          {/* Participant Completed Status Banner */}
          {hasParticipated && (
            <div className="w-full p-3 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <span>Your Selection Recorded (1 Spin Used)</span>
                  </span>
                  <p className="text-sm font-black text-emerald-950 truncate">
                    {mySpinResult}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold shrink-0">
                  Completed ✓
                </span>
              </div>
            </div>
          )}

          {/* Live Collective Group Tally & Results Breakdown */}
          <div className="w-full p-3.5 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1A1B25] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span>Collective Group Tally</span>
              </span>
              <span className="text-[11px] font-extrabold text-[#666D80]">
                {tally.completedCount} of {tally.totalEligible} participants completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#DFE1E6] h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
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
                const isMyPick = mySpinResult === opt;

                return (
                  <div 
                    key={i}
                    className={`p-2 rounded-xl border transition-all ${
                      isWinner
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                        : isLeader
                        ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
                        : isMyPick
                        ? 'bg-white border-amber-300'
                        : 'bg-white border-[#ECEFF3]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} 
                        />
                        <span className="font-extrabold text-[#1A1B25] truncate">
                          {opt}
                        </span>
                        {isMyPick && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[9px] font-black">
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
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-950 text-[9px] font-black">
                            Leading
                          </span>
                        )}
                      </div>
                      <span className="font-black text-[#1A1B25] shrink-0 ml-2">
                        {count} {count === 1 ? 'selection' : 'selections'}
                      </span>
                    </div>

                    {/* Participant Names / Avatars */}
                    {voters.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {voters.map((v, vIdx) => (
                          <span 
                            key={vIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#ECEFF3] text-[#353849] text-[10px] font-bold"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black">
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
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {tally.completedCount === 0
                      ? `Awaiting participant spins (0 of ${tally.totalEligible} completed).`
                      : `In progress: ${tally.remainingCount} more participant${tally.remainingCount === 1 ? '' : 's'} needed to finalize collective decision.`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="w-full space-y-2 pt-1">
            {!hasParticipated ? (
              // SPIN THE WHEEL: Available strictly once per participant
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 ${
                  isSpinning
                    ? 'bg-[#ECEFF3] text-[#808897] cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/25'
                }`}
              >
                {isSpinning ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-amber-800" />
                    <span>Spinning The Wheel...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>SPIN THE WHEEL 🎡 (1 Turn)</span>
                  </>
                )}
              </button>
            ) : (
              // Completed state: Participant CANNOT spin again!
              <div className="w-full p-2.5 rounded-2xl bg-[#ECEFF3] text-[#666D80] text-center text-xs font-bold">
                ✓ You have used your spin for this decision round.
              </div>
            )}

            {/* Administrative Section: Re-open decision (Owner / Admin only) */}
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
              disabled={isSpinning}
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
