import React, { useState } from 'react';
import { 
  Vote, 
  Clock, 
  CheckCircle2, 
  Users, 
  Plus, 
  Sparkles, 
  Flame,
  CheckSquare,
  RotateCcw,
  Check,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  DecisionItem, 
  UserPersona, 
  BoardMember, 
  AttachedPlan, 
  ParticipantUserStatus,
  TaskItem 
} from '../types';
import { calculateCollectiveFunDecision } from '../utils/deciderCollective';
import { WheelSpinnerDecider } from './WheelSpinnerDecider';
import { BlindPickDecider } from './BlindPickDecider';

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
}) => {
  const isOwner = currentPersona.role === 'owner';
  const isAdminOrOwner = currentPersona.role === 'owner' || currentPersona.role === 'admin';

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeWheelPlan, setActiveWheelPlan] = useState<AttachedPlan | null>(null);
  const [activeBlindPickPlan, setActiveBlindPickPlan] = useState<AttachedPlan | null>(null);

  const getMember = (id: string) => allMembers.find((m) => m.id === id);

  // Separate actionable plans by decider type
  const wheelPlans = plans.filter((p) => p.deciderType === 'wheel_spinner');
  const blindPickPlans = plans.filter((p) => p.deciderType === 'blind_pick');
  const statusPlans = plans.filter((p) => p.deciderType === 'participant_status');
  const taskPlans = plans.filter((p) => p.deciderType === 'task_duty');

  // Voting items: combine decisions with any voting plans not already in decisions
  const votingItems = decisions;

  const totalActionsCount = 
    votingItems.length + 
    wheelPlans.length + 
    blindPickPlans.length + 
    statusPlans.length + 
    taskPlans.length;

  return (
    <section id="decisions-section" className="mb-8 scroll-mt-20">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#1A1B25] tracking-tight leading-tight">
            Voting and Decision
          </h2>
          <p className="text-sm sm:text-[15px] text-[#808897] mt-1 font-normal leading-normal">
            Vote, spin wheels, draw mystery cards
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateItem}
          title="Create New Decision or Action"
          aria-label="Create New Decision or Action"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
        </button>
      </div>

      {/* Filter Tabs */}
      {totalActionsCount > 0 && (
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 mb-6 scrollbar-none">
          {[
            { id: 'all', label: `All Actions (${totalActionsCount})` },
            ...(votingItems.length > 0 ? [{ id: 'voting', label: `🗳️ Voting (${votingItems.length})` }] : []),
            ...(wheelPlans.length > 0 ? [{ id: 'wheel_spinner', label: `🎡 Wheel Spinners (${wheelPlans.length})` }] : []),
            ...(blindPickPlans.length > 0 ? [{ id: 'blind_pick', label: `🎴 Blind Picks (${blindPickPlans.length})` }] : []),
            ...(statusPlans.length > 0 ? [{ id: 'status', label: `👥 Check-ins (${statusPlans.length})` }] : []),
            ...(taskPlans.length > 0 ? [{ id: 'task', label: `🎯 Tasks (${taskPlans.length})` }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-[15px] whitespace-nowrap transition cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold border border-transparent'
                  : 'bg-white border border-[#DFE1E6] text-[#666D80] font-semibold hover:bg-[#F6F8FA] hover:text-[#272835]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Standard Voting Decision Cards */}
        {(activeFilter === 'all' || activeFilter === 'voting') &&
          votingItems.map((decision) => {
            const totalVotes = decision.options.reduce((sum, opt) => sum + opt.voteCount, 0);
            const remainingVoters = Math.max(0, decision.totalVotesNeeded - totalVotes);
            const isCompleted = decision.status === 'completed';
            const userVotedOption = decision.options.find((opt) =>
              opt.voterIds.includes(currentPersona.id)
            );

            // Find leader
            const sortedOptions = [...decision.options].sort((a, b) => b.voteCount - a.voteCount);
            const leader = sortedOptions[0];

            return (
              <div
                key={decision.id}
                className={`rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-white border-[#ECEFF3] hover:border-amber-200'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-black tracking-wide text-[#808897] uppercase">
                      {decision.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {decision.isReopened && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black">
                          Round {decision.decisionRound || 2} Reopened
                        </span>
                      )}
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Finalized
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {decision.deadlineText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question */}
                  <h3 className="text-base font-extrabold text-[#1A1B25] mb-1">
                    {decision.question}
                  </h3>

                  {/* Gamified Social Note */}
                  {!isCompleted && decision.gamifiedNote && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
                      <span>{decision.gamifiedNote}</span>
                    </div>
                  )}

                  {/* Participant Result Status: User's vote */}
                  {userVotedOption && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />
                      <span>Your vote: {userVotedOption.emoji} {userVotedOption.label} (Participation Complete ✓)</span>
                    </div>
                  )}

                  {/* Final Decision banner if completed */}
                  {isCompleted && decision.finalDecision && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs font-extrabold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Selected Plan: {decision.finalDecision}</span>
                    </div>
                  )}

                  {/* Options List */}
                  <div className="space-y-2 mb-3">
                    {decision.options.map((option) => {
                      const isUserChoice = option.voterIds.includes(currentPersona.id);
                      const votePercentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                      const isWinning = leader && leader.id === option.id && option.voteCount > 0;

                      return (
                        <div
                          key={option.id}
                          className={`relative rounded-2xl p-3 border transition overflow-hidden ${
                            isUserChoice
                              ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-400'
                              : 'border-[#ECEFF3] bg-[#F8F9FB] hover:border-[#C1C7CF]'
                          }`}
                        >
                          {/* Fill percentage background */}
                          <div
                            className={`absolute inset-y-0 left-0 transition-all duration-500 pointer-events-none ${
                              isCompleted && decision.finalDecision?.includes(option.label)
                                ? 'bg-emerald-200/60'
                                : isUserChoice
                                ? 'bg-amber-200/50'
                                : 'bg-[#ECEFF3]/70'
                            }`}
                            style={{ width: `${votePercentage}%` }}
                          />

                          {/* Content on top */}
                          <div className="relative z-10 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{option.emoji || '🔘'}</span>
                              <span className="text-xs font-black text-[#1A1B25] truncate">
                                {option.label}
                              </span>
                              {isWinning && !isCompleted && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-extrabold">
                                  Lead
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-extrabold text-[#1A1B25]">
                                {option.voteCount}
                              </span>
                              <span className="text-[10px] text-[#808897] font-semibold">
                                ({votePercentage}%)
                              </span>

                              {/* Action Vote / Unvote Button */}
                              {!isCompleted ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onVote(decision.id, option.id);
                                    confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer active:scale-95 ${
                                    isUserChoice
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-white border border-[#DFE1E6] hover:bg-amber-100 text-[#353849]'
                                  }`}
                                >
                                  {isUserChoice ? 'Voted ✓' : 'Vote'}
                                </button>
                              ) : null}

                              {/* Owner Finalize Option button */}
                              {isOwner && !isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onFinalizeDecision(decision.id, option.id);
                                    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
                                  }}
                                  className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#1A1B25] text-white hover:bg-emerald-600 transition cursor-pointer"
                                  title="Lock this as the final plan choice"
                                >
                                  Select Final ✓
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Voter avatars */}
                          {option.voterIds.length > 0 && (
                            <div className="relative z-10 mt-2 pt-1 flex items-center gap-1 border-t border-black/5">
                              <span className="text-[10px] text-[#808897] font-semibold mr-1">Voters:</span>
                              <div className="flex items-center -space-x-1.5">
                                {option.voterIds.map((vId) => {
                                  const m = getMember(vId);
                                  if (!m) return null;
                                  return (
                                    <img
                                      key={vId}
                                      src={m.avatar}
                                      alt={m.name}
                                      title={m.name}
                                      className="w-4 h-4 rounded-full border border-white object-cover shadow-2xs"
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Meta & Owner Controls */}
                <div className="pt-3 border-t border-[#ECEFF3] flex items-center justify-between text-xs font-bold text-[#666D80]">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#808897]" />
                    <span>
                      {totalVotes}/{decision.totalVotesNeeded} voted
                    </span>
                    {remainingVoters > 0 && !isCompleted && (
                      <span className="text-amber-700 font-extrabold">
                        ({remainingVoters} remaining)
                      </span>
                    )}
                  </div>

                  {isAdminOrOwner && isCompleted && (
                    <button
                      type="button"
                      onClick={() => onReopenDecision(decision.id)}
                      className="text-[11px] font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Reopen voting round for all members"
                    >
                      <span>🔄 Re-open Decision (Round {(decision.decisionRound || 1) + 1})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        {/* 2. Wheel Spinner Decision Cards */}
        {(activeFilter === 'all' || activeFilter === 'wheel_spinner') &&
          wheelPlans.map((plan) => {
            const tally = calculateCollectiveFunDecision(plan, allMembers.length || 4);
            const mySelection = currentPersona.id && plan.participantSelections 
              ? plan.participantSelections[currentPersona.id] 
              : undefined;
            const hasSpun = Boolean(mySelection);
            const isCompleted = plan.status === 'confirmed' && Boolean(plan.finalDecision);

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-white border-[#ECEFF3] hover:border-amber-200'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-black tracking-wide text-amber-800 uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Wheel Spinner Decider</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {plan.isReopened && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black">
                          Round {plan.decisionRound || 2} Reopened
                        </span>
                      )}
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Finalized
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-600" />
                          {tally.completedCount}/{tally.totalEligible} spun
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question */}
                  <h3 className="text-base font-extrabold text-[#1A1B25] mb-1">
                    {plan.spinnerQuestion || plan.title}
                  </h3>

                  {/* Options Chips Preview */}
                  <div className="flex items-center gap-1.5 flex-wrap my-2.5">
                    {plan.spinnerOptions?.map((opt, i) => {
                      const count = tally.countsByOption[opt] || 0;
                      const isWinner = isCompleted && (plan.currentSelection === opt || plan.wheelWinningOption === opt);
                      const isLeading = !isCompleted && tally.leader?.option === opt && count > 0;
                      const isMyPick = mySelection?.option === opt;
                      const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

                      return (
                        <span
                          key={i}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                            isWinner
                              ? 'bg-emerald-100 text-emerald-950 font-black border-emerald-400 ring-1 ring-emerald-400'
                              : isLeading
                              ? 'bg-amber-100 text-amber-950 font-black border-amber-400 ring-1 ring-amber-300'
                              : isMyPick
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-white text-[#353849] border-[#DFE1E6]'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: colors[i % colors.length] }}
                          />
                          <span>{opt}</span>
                          {count > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-black/5 rounded-md font-bold">
                              {count}
                            </span>
                          )}
                          {isWinner && <span>🏆</span>}
                        </span>
                      );
                    })}
                  </div>

                  {/* Participant Result Status */}
                  {hasSpun ? (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Your spin: &quot;{mySelection?.option}&quot; (Participation Complete ✓ locked for Round {plan.decisionRound || 1})</span>
                    </div>
                  ) : (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>You haven&apos;t spun yet. Spin the wheel to contribute your 1 turn!</span>
                    </div>
                  )}

                  {/* Interactive Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setActiveWheelPlan(plan)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2 mb-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{hasSpun ? '🎡 View Collective Results & Wheel' : '🎡 Spin The Wheel (1 Turn)'}</span>
                  </button>
                </div>

                {/* Footer Controls & Owner Actions */}
                <div className="pt-3 border-t border-[#ECEFF3] flex items-center justify-between text-xs font-bold text-[#666D80]">
                  <span>
                    {tally.completedCount} of {tally.totalEligible} participants completed
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isAdminOrOwner && !isCompleted && tally.leader && (
                      <button
                        type="button"
                        onClick={() => onFinalizeFunDecider && onFinalizeFunDecider(plan.id, tally.leader?.option)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                        title="Finalize leading option as the confirmed plan"
                      >
                        Finalize Winner ✓
                      </button>
                    )}

                    {isAdminOrOwner && isCompleted && (
                      <button
                        type="button"
                        onClick={() => onReopenFunDecider && onReopenFunDecider(plan.id)}
                        className="text-[11px] font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl transition cursor-pointer active:scale-95"
                        title="Reopen round for all participants"
                      >
                        🔄 Re-open Round
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {/* 3. Blind Pick Decision Cards */}
        {(activeFilter === 'all' || activeFilter === 'blind_pick') &&
          blindPickPlans.map((plan) => {
            const tally = calculateCollectiveFunDecision(plan, allMembers.length || 4);
            const mySelection = currentPersona.id && plan.participantSelections 
              ? plan.participantSelections[currentPersona.id] 
              : undefined;
            const hasPicked = Boolean(mySelection);
            const isCompleted = plan.status === 'confirmed' && Boolean(plan.finalDecision);

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-purple-50/40 border-purple-200'
                    : 'bg-white border-[#ECEFF3] hover:border-purple-200'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-black tracking-wide text-purple-700 uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mystery Blind Pick</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {plan.isReopened && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black">
                          Round {plan.decisionRound || 2} Reopened
                        </span>
                      )}
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Finalized
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-bold flex items-center gap-1">
                          <Users className="w-3 h-3 text-purple-600" />
                          {tally.completedCount}/{tally.totalEligible} picked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question */}
                  <h3 className="text-base font-extrabold text-[#1A1B25] mb-1">
                    {plan.spinnerQuestion || plan.title}
                  </h3>

                  <p className="text-xs text-[#666D80] mb-3">
                    {plan.spinnerOptions?.length || 0} mystery choices shuffled. Draw 1 card to cast your secret selection!
                  </p>

                  {/* Participant Result Status */}
                  {hasPicked ? (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-black text-purple-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Your mystery card: &quot;{mySelection?.option}&quot; (Participation Complete ✓ locked for Round {plan.decisionRound || 1})</span>
                    </div>
                  ) : (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Draw 1 mystery card to cast your secret vote!</span>
                    </div>
                  )}

                  {/* Interactive Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setActiveBlindPickPlan(plan)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2 mb-2"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>{hasPicked ? '🎴 View Collective Results & Cards' : '🎴 Draw Mystery Card (1 Turn)'}</span>
                  </button>
                </div>

                {/* Footer Controls & Owner Actions */}
                <div className="pt-3 border-t border-[#ECEFF3] flex items-center justify-between text-xs font-bold text-[#666D80]">
                  <span>
                    {tally.completedCount} of {tally.totalEligible} participants drawn
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isAdminOrOwner && !isCompleted && tally.leader && (
                      <button
                        type="button"
                        onClick={() => onFinalizeFunDecider && onFinalizeFunDecider(plan.id, tally.leader?.option)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-purple-700 text-white hover:bg-purple-800 transition cursor-pointer"
                        title="Finalize leading option as the confirmed plan"
                      >
                        Finalize Winner ✓
                      </button>
                    )}

                    {isAdminOrOwner && isCompleted && (
                      <button
                        type="button"
                        onClick={() => onReopenFunDecider && onReopenFunDecider(plan.id)}
                        className="text-[11px] font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl transition cursor-pointer active:scale-95"
                        title="Reopen round for all participants"
                      >
                        🔄 Re-open Round
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {/* 4. Participant Status (Check-ins / Attendance) Decision Cards */}
        {(activeFilter === 'all' || activeFilter === 'status') &&
          statusPlans.map((plan) => {
            const recordedEntries = (Object.values(plan.participantStatuses || {}) as ParticipantUserStatus[]).filter(
              (s) => !!s.statusOptionId
            );
            const myStatus = plan.participantStatuses?.[currentPersona.id];
            const hasResponded = Boolean(myStatus?.statusOptionId);

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl p-5 border border-[#ECEFF3] hover:border-indigo-200 transition shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-black tracking-wide text-indigo-700 uppercase flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Participant Check-in</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-900 text-[11px] font-bold border border-indigo-100">
                      {recordedEntries.length} / {allMembers.length} responded
                    </span>
                  </div>

                  {/* Question */}
                  <h3 className="text-base font-extrabold text-[#1A1B25] mb-1">
                    {plan.statusQuestion || `${plan.title} Check-in`}
                  </h3>

                  {/* User's Current Status */}
                  {hasResponded ? (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-black text-indigo-900 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />
                      <span>Your status: &quot;{myStatus?.statusLabel}&quot; (Participation Complete ✓)</span>
                    </div>
                  ) : (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Awaiting your check-in response below</span>
                    </div>
                  )}

                  {/* Interactive Status Options Buttons */}
                  <div className="space-y-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#808897]">
                      Choose your response:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {plan.statusOptions?.map((opt) => {
                        const count = recordedEntries.filter((s) => s.statusOptionId === opt.id).length;
                        const isMyChoice = myStatus?.statusOptionId === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (onUpdateParticipantStatus) {
                                onUpdateParticipantStatus(plan.id, currentPersona.id, opt.id);
                                confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
                              }
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer active:scale-95 ${
                              isMyChoice
                                ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                                : 'bg-[#F8F9FB] hover:bg-indigo-50/70 border-[#DFE1E6] text-[#1A1B25]'
                            }`}
                          >
                            <span className="text-sm">{opt.emoji || '🔘'}</span>
                            <span>{opt.label}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                                isMyChoice ? 'bg-indigo-700 text-white' : 'bg-black/5 text-[#666D80]'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Breakdown of Member Responses */}
                  {recordedEntries.length > 0 && (
                    <div className="pt-2 border-t border-[#ECEFF3] space-y-1.5">
                      <span className="text-[10px] font-bold text-[#808897] uppercase">
                        Recent Check-ins:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {recordedEntries.slice(0, 8).map((entry) => (
                          <div
                            key={entry.userId}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F8F9FB] border border-[#ECEFF3] text-[10px] font-bold text-[#353849]"
                            title={`${entry.userName}: ${entry.statusLabel}`}
                          >
                            {entry.userAvatar && (
                              <img
                                src={entry.userAvatar}
                                alt={entry.userName}
                                className="w-3.5 h-3.5 rounded-full object-cover"
                              />
                            )}
                            <span className="truncate max-w-[60px]">{entry.userName}</span>
                            <span className="text-indigo-600 font-extrabold">({entry.statusLabel})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-[#ECEFF3] text-xs text-[#808897]">
                  <span>Selection updates The Plan in real time</span>
                </div>
              </div>
            );
          })}

        {/* 5. Tasks & Duties Action Cards */}
        {(activeFilter === 'all' || activeFilter === 'task') &&
          taskPlans.map((plan) => {
            const isAssignedToMe = plan.assigneeId === currentPersona.id || plan.assigneeName === currentPersona.name;
            const isCompleted = plan.status === 'confirmed';

            // Find matching task if available
            const matchingTask = tasks.find((t) => t.deciderItemId === plan.id || t.id === `task-${plan.id}`);

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-white border-[#ECEFF3] hover:border-blue-200'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-black tracking-wide text-blue-700 uppercase flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Task &amp; Duty Action</span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : plan.assigneeName
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isCompleted ? 'Completed ✓' : plan.assigneeName ? `Assigned: ${plan.assigneeName}` : 'Needs Volunteer'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-extrabold text-[#1A1B25] mb-1">
                    {plan.title}
                  </h3>
                  <p className="text-xs text-[#666D80] mb-3">
                    {plan.taskDesc || plan.description || 'Coordinate and manage this duty for the group.'}
                  </p>

                  {/* Participation Status */}
                  {isAssignedToMe ? (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                      <span>Assigned to you ✓ (Participation Complete)</span>
                    </div>
                  ) : plan.assigneeName ? (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-[#F8F9FB] border border-[#ECEFF3] text-xs font-bold text-[#666D80] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#808897]" />
                      <span>Currently handled by {plan.assigneeName}</span>
                    </div>
                  ) : (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Open for volunteers! Step up to handle this duty.</span>
                    </div>
                  )}

                  {/* Action Button */}
                  {!plan.assigneeName && onVolunteerForTask && matchingTask && (
                    <button
                      type="button"
                      onClick={() => {
                        onVolunteerForTask(matchingTask.id, currentPersona.id, currentPersona.name);
                        confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2 mb-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>🙋 Volunteer for this Duty</span>
                    </button>
                  )}

                  {isAssignedToMe && onToggleTaskComplete && matchingTask && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTaskComplete(matchingTask.id);
                        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
                      }}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black transition cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2 mb-2 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-[#1A1B25] text-white hover:bg-[#272835]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCompleted ? 'Mark as In-Progress' : 'Mark Task as Completed ✓'}</span>
                    </button>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-[#ECEFF3] text-xs text-[#808897]">
                  <span>Updates The Plan assignee in real time</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Wheel Spinner Interactive Modal */}
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
            totalEligibleMembers={allMembers.length || 4}
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

      {/* Blind Pick Interactive Modal */}
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
            totalEligibleMembers={allMembers.length || 4}
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
