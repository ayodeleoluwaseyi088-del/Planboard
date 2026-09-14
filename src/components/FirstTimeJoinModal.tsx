import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Calendar, 
  Vote, 
  Award, 
  Clock,
  Check,
  Layers,
  Crown,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlanBoard, DecisionItem, TaskItem } from '../types';
import { useLiveCountdown } from '../utils/dateTime';

interface FirstTimeJoinModalProps {
  isOpen: boolean;
  board: PlanBoard;
  onClose: () => void;
  onJoinAsGuest: (name: string) => void;
  onCompletedFirstAction: (decisionId: string, optionId: string) => void;
  onVolunteerTask?: (taskId: string) => void;
  onUpdateParticipantStatus?: (planId: string, optionId: string) => void;
}

export const FirstTimeJoinModal: React.FC<FirstTimeJoinModalProps> = ({
  isOpen,
  board,
  onClose,
  onJoinAsGuest,
  onCompletedFirstAction,
  onVolunteerTask,
  onUpdateParticipantStatus,
}) => {
  const [step, setStep] = useState<'welcome' | 'joined_summary' | 'first_action' | 'done'>('welcome');
  const [guestName, setGuestName] = useState('');

  // Always reset to step 1 when modal opens or board changes
  useEffect(() => {
    if (isOpen) {
      setStep('welcome');
      setGuestName('');
    }
  }, [isOpen, board.id]);

  // Extract real pending actions from the exact board
  const openDecisions = useMemo(() => {
    return (board.decisions || [])
      .filter((d) => d.status === 'open')
      .sort((a, b) => {
        if (a.priority === 'required' && b.priority !== 'required') return -1;
        if (b.priority === 'required' && a.priority !== 'required') return 1;
        return 0;
      });
  }, [board.decisions]);

  const openTasks = useMemo(() => {
    return (board.tasks || []).filter((t) => t.status === 'open' && !t.assigneeId);
  }, [board.tasks]);

  const openAttendancePlans = useMemo(() => {
    return (board.plans || []).filter(
      (p) => p.deciderType === 'participant_status' && p.statusOptions && p.statusOptions.length > 0
    );
  }, [board.plans]);

  // Selected decision & option for voting action
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Selected task for volunteer duty action
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Selected attendance plan
  const [selectedAttendancePlanId, setSelectedAttendancePlanId] = useState<string>('');
  const [selectedAttendanceOptionId, setSelectedAttendanceOptionId] = useState<string | null>(null);

  // Sync selection when board or open decisions change
  useEffect(() => {
    if (openDecisions.length > 0) {
      const firstDecision = openDecisions[0];
      setSelectedDecisionId(firstDecision.id);
      setSelectedOptionId(firstDecision.options?.[0]?.id || null);
    } else {
      setSelectedDecisionId('');
      setSelectedOptionId(null);
    }

    if (openTasks.length > 0) {
      setSelectedTaskId(openTasks[0].id);
    } else {
      setSelectedTaskId('');
    }

    if (openAttendancePlans.length > 0) {
      setSelectedAttendancePlanId(openAttendancePlans[0].id);
      setSelectedAttendanceOptionId(openAttendancePlans[0].statusOptions?.[0]?.id || null);
    } else {
      setSelectedAttendancePlanId('');
      setSelectedAttendanceOptionId(null);
    }
  }, [openDecisions, openTasks, openAttendancePlans, board.id]);

  // When changing selected decision tab, update selected option
  const activeDecision = useMemo(() => {
    return openDecisions.find((d) => d.id === selectedDecisionId) || openDecisions[0] || null;
  }, [openDecisions, selectedDecisionId]);

  const activeTask = useMemo(() => {
    return openTasks.find((t) => t.id === selectedTaskId) || openTasks[0] || null;
  }, [openTasks, selectedTaskId]);

  const activeAttendance = useMemo(() => {
    return openAttendancePlans.find((p) => p.id === selectedAttendancePlanId) || openAttendancePlans[0] || null;
  }, [openAttendancePlans, selectedAttendancePlanId]);

  // Derive schedule and countdown purely from plans
  const scheduledPlan = useMemo(() => {
    return (board.plans || []).find((p) => p.isPrimary && (p.date || p.time || p.dateTime))
      || (board.plans || []).find((p) => p.date || p.time || p.dateTime);
  }, [board.plans]);

  const activeDateTime = scheduledPlan?.dateTime || board.dateTime;
  const activeDate = scheduledPlan?.date || board.date;
  const activeTime = scheduledPlan?.time || board.time;
  const hasSpecificTime = Boolean(
    activeTime && 
    (scheduledPlan?.hasSpecificTime !== undefined ? scheduledPlan.hasSpecificTime : board.hasSpecificTime !== false)
  );
  const hasDateAndTime = Boolean(activeDate && activeTime && activeDateTime && hasSpecificTime);
  const countdown = useLiveCountdown(hasDateAndTime ? activeDateTime : undefined, true);

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = guestName.trim() || 'Friend';
    onJoinAsGuest(finalName);
    setStep('joined_summary');
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 } });
  };

  const handleFirstVote = () => {
    if (activeDecision && selectedOptionId) {
      onCompletedFirstAction(activeDecision.id, selectedOptionId);
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      setStep('done');
    }
  };

  const handleClaimDuty = () => {
    if (activeTask && onVolunteerTask) {
      onVolunteerTask(activeTask.id);
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      setStep('done');
    }
  };

  const handleFinishAndEnter = () => {
    onClose();
  };

  const membersCount = (board.members || []).length;
  const ownerName = board.ownerName || 'The Host';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#ECEFF3] animate-in zoom-in-95 duration-150 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 hover:bg-[#F6F8FA] text-[#808897] hover:text-[#1A1B25] transition cursor-pointer z-10 shadow-2xs"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: Landing / Name prompt */}
        {step === 'welcome' && (
          <div>
            <div className="relative h-36 bg-amber-500 overflow-hidden">
              {board.coverImage ? (
                <img
                  src={board.coverImage}
                  alt={board.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-4xl">
                  {board.emoji || '📋'}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-3.5 left-5 right-5 text-white">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300 mb-0.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Invited by {ownerName}</span>
                </div>
                <h3 className="text-xl font-black truncate">
                  {board.emoji} {board.title}
                </h3>
              </div>
            </div>

            <div className="p-6">
              {/* Real Board Details */}
              <div className="mb-5 space-y-2 text-xs">
                {activeDate && (
                  <div className="flex items-center gap-2 font-bold text-[#353849]">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>{activeDate} {activeTime ? `· ${activeTime}` : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 font-bold text-[#353849]">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>
                    {membersCount} {membersCount === 1 ? 'person is' : 'people are'} planning this together
                  </span>
                </div>

                {/* Member Avatars */}
                {membersCount > 0 && (
                  <div className="flex items-center -space-x-1.5 pt-1 pl-6">
                    {(board.members || []).slice(0, 6).map((m) => (
                      <img
                        key={m.id}
                        src={m.avatar}
                        alt={m.name}
                        title={m.name}
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                    {membersCount > 6 && (
                      <span className="text-[11px] font-extrabold text-[#666D80] ml-2">
                        +{membersCount - 6} more friends
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Form: What's your name? */}
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-extrabold text-[#1A1B25] mb-1.5">
                    👋 What's your name?
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name (e.g. Alex, Tobi)"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FB] border border-[#DFE1E6] text-sm font-bold text-[#1A1B25] focus:outline-amber-500 focus:bg-white"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-[#808897] mt-1">
                    No password required. You'll join your friends' real board instantly.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <span>Join the Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 2: Welcome & Real Board Summary */}
        {step === 'joined_summary' && (
          <div className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-black mb-3">
              👋
            </div>

            <h3 className="text-xl font-black text-[#1A1B25] mb-1">
              Welcome, {guestName.trim() || 'Friend'}!
            </h3>
            <p className="text-xs text-[#666D80] mb-4">
              Here's what's happening right now in <strong className="text-[#1A1B25]">{board.title}</strong>:
            </p>

            {/* Real board status list */}
            <div className="space-y-2.5 mb-6">
              <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEFF3] flex items-center gap-3 text-xs font-bold text-[#353849]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  {membersCount} {membersCount === 1 ? 'person is' : 'people are'} active on this board
                </span>
              </div>

              {openDecisions.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center gap-3 text-xs font-bold text-rose-900">
                  <Vote className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {openDecisions.length} {openDecisions.length === 1 ? 'decision needs' : 'decisions need'} group input
                  </span>
                </div>
              )}

              {openAttendancePlans.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-900">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Attendance RSVP needed: {openAttendancePlans.map((p) => p.title).join(', ')}
                  </span>
                </div>
              )}

              {openTasks.length > 0 && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-3 text-xs font-bold text-blue-900">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {openTasks.length} volunteer {openTasks.length === 1 ? 'duty is' : 'duties are'} open
                  </span>
                </div>
              )}

              {board.plans && board.plans.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEFF3] flex items-center gap-3 text-xs font-bold text-[#353849]">
                  <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">
                    {board.plans.length} plan item(s) organized ({board.plans.slice(0, 3).map((p) => p.title).join(', ')})
                  </span>
                </div>
              )}

              {hasDateAndTime && countdown.isValid && !countdown.isPast && (
                <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEFF3] flex items-center gap-3 text-xs font-bold text-[#353849]">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{countdown.label}</span>
                </div>
              )}
            </div>

            {/* Direct CTA */}
            {openDecisions.length > 0 || openAttendancePlans.length > 0 || openTasks.length > 0 ? (
              <button
                onClick={() => setStep('first_action')}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
              >
                <span>
                  {openDecisions.length > 0
                    ? `Vote on Pending Decision (${openDecisions.length})`
                    : openAttendancePlans.length > 0
                    ? `Confirm Attendance RSVP`
                    : `See Volunteer Duty (${openTasks.length})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishAndEnter}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <span>Explore The Full Board</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* STEP 3: Real Board Pending Action */}
        {step === 'first_action' && (
          <div className="p-6">
            {activeDecision ? (
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-600">
                    <Vote className="w-3.5 h-3.5" />
                    <span>
                      Pending Action: {activeDecision.category || 'VOTING'}
                    </span>
                  </div>

                  {openDecisions.length > 1 && (
                    <span className="text-[10px] font-bold text-[#808897]">
                      {openDecisions.findIndex((d) => d.id === activeDecision.id) + 1} of {openDecisions.length}
                    </span>
                  )}
                </div>

                {/* Switcher if multiple open decisions exist */}
                {openDecisions.length > 1 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3">
                    {openDecisions.map((d, idx) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setSelectedDecisionId(d.id);
                          setSelectedOptionId(d.options?.[0]?.id || null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                          selectedDecisionId === d.id
                            ? 'bg-[#1A1B25] text-white'
                            : 'bg-[#F8F9FB] border border-[#ECEFF3] text-[#666D80] hover:text-[#1A1B25]'
                        }`}
                      >
                        #{idx + 1} {d.title}
                      </button>
                    ))}
                  </div>
                )}

                <h3 className="text-lg font-black text-[#1A1B25] mb-1">
                  {activeDecision.title}
                </h3>
                <p className="text-xs text-[#666D80] mb-4">
                  {activeDecision.question || 'Your vote is needed! Pick your preference:'}
                </p>

                {/* Real decision options */}
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
                  {(activeDecision.options || []).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs font-extrabold transition cursor-pointer ${
                        selectedOptionId === opt.id
                          ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-400'
                          : 'bg-[#F8F9FB] border-[#ECEFF3] text-[#353849] hover:bg-[#ECEFF3]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{opt.emoji || '🔘'}</span>
                        <span className="truncate">{opt.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#808897]">
                          {opt.voteCount} {opt.voteCount === 1 ? 'vote' : 'votes'}
                        </span>
                        {selectedOptionId === opt.id && (
                          <Check className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleFirstVote}
                  disabled={!selectedOptionId}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] disabled:opacity-50 text-white font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <span>Submit My Vote</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            ) : activeAttendance ? (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Pending Action: RSVP / Attendance</span>
                </div>

                <h3 className="text-lg font-black text-[#1A1B25] mb-1">
                  {activeAttendance.title}
                </h3>
                <p className="text-xs text-[#666D80] mb-4">
                  {activeAttendance.statusQuestion || 'Will you be attending this plan?'}
                </p>

                {/* Status Options */}
                <div className="space-y-2 mb-6">
                  {(activeAttendance.statusOptions || []).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedAttendanceOptionId(opt.id)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs font-extrabold transition cursor-pointer ${
                        selectedAttendanceOptionId === opt.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400'
                          : 'bg-[#F8F9FB] border-[#ECEFF3] text-[#353849] hover:bg-[#ECEFF3]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{opt.emoji || '🙋'}</span>
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {selectedAttendanceOptionId === opt.id && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (activeAttendance && selectedAttendanceOptionId && onUpdateParticipantStatus) {
                      onUpdateParticipantStatus(activeAttendance.id, selectedAttendanceOptionId);
                      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
                      setStep('done');
                    }
                  }}
                  disabled={!selectedAttendanceOptionId}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <span>Confirm My Attendance</span>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : activeTask ? (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 mb-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Pending Duty: {activeTask.category || 'VOLUNTEER'}</span>
                </div>

                <h3 className="text-lg font-black text-[#1A1B25] mb-1">
                  {activeTask.title}
                </h3>
                <p className="text-xs text-[#666D80] mb-4">
                  {activeTask.description || 'This responsibility is open for volunteers!'}
                </p>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 space-y-2 mb-6">
                  <div className="font-bold flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{activeTask.deadlineText || 'Open for group volunteers'}</span>
                  </div>
                  <p className="text-blue-900 text-[11px]">
                    Step up to coordinate this part of the plan with {ownerName}.
                  </p>
                </div>

                <button
                  onClick={handleClaimDuty}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <span>I'll Take This Duty!</span>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mx-auto mb-3">
                  ✨
                </div>
                <h4 className="text-base font-black text-[#1A1B25]">
                  All decisions locked in!
                </h4>
                <p className="text-xs text-[#666D80] max-w-xs mx-auto mt-1 mb-6">
                  There are currently no pending decisions needing a vote on {board.title}.
                </p>
                <button
                  onClick={handleFinishAndEnter}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#1A1B25] text-white font-extrabold text-sm transition shadow-md"
                >
                  <span>Explore The Full Board</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Success & Enter full board */}
        {step === 'done' && (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-[#1A1B25] mb-1">
              You're in the plan! 🎉
            </h3>
            <p className="text-xs text-[#666D80] max-w-xs mx-auto mb-6">
              Your response has been counted on <strong className="text-[#1A1B25]">{board.title}</strong>. You can now explore the itinerary, see photos, and help <strong className="text-[#1A1B25]">{ownerName}</strong> finalize the rest!
            </p>

            <button
              onClick={handleFinishAndEnter}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <span>Explore The Full Board</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
