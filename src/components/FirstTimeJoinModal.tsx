import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Users, 
  Calendar, 
  Vote, 
  Award, 
  Clock,
  Check,
  Layers,
  Crown,
  UserCheck,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlanBoard } from '../types';
import { useLiveCountdown } from '../utils/dateTime';
import { BOARD_AVATARS } from '../utils/boardAvatars';

interface FirstTimeJoinModalProps {
  isOpen: boolean;
  board: PlanBoard;
  onClose: () => void;
  onJoinAsGuest: (name: string, avatar: string) => void;
  onCompletedFirstAction: (decisionId: string, optionId: string) => void;
  onVolunteerTask?: (taskId: string) => void;
  onUpdateParticipantStatus?: (planId: string, optionId: string) => void;
}

const SUGGESTED_NAMES = ['Captain', 'King', 'Chief', 'Princess', 'Star'];

export const FirstTimeJoinModal: React.FC<FirstTimeJoinModalProps> = ({
  isOpen,
  board,
  onClose,
  onJoinAsGuest,
  onCompletedFirstAction,
  onVolunteerTask,
  onUpdateParticipantStatus,
}) => {
  const [step, setStep] = useState<'welcome' | 'choose_avatar' | 'joined_summary' | 'first_action' | 'done'>('welcome');
  const [guestName, setGuestName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(BOARD_AVATARS[0]?.url || '');

  // Reset to step 1 when modal opens or board changes
  useEffect(() => {
    if (isOpen) {
      setStep('welcome');
      setGuestName('');
      setSelectedAvatar(BOARD_AVATARS[0]?.url || '');
    }
  }, [isOpen, board.id]);

  // Extract pending actions from the board
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

  const activeDecision = useMemo(() => {
    return openDecisions.find((d) => d.id === selectedDecisionId) || openDecisions[0] || null;
  }, [openDecisions, selectedDecisionId]);

  const activeTask = useMemo(() => {
    return openTasks.find((t) => t.id === selectedTaskId) || openTasks[0] || null;
  }, [openTasks, selectedTaskId]);

  const activeAttendance = useMemo(() => {
    return openAttendancePlans.find((p) => p.id === selectedAttendancePlanId) || openAttendancePlans[0] || null;
  }, [openAttendancePlans, selectedAttendancePlanId]);

  // Derive schedule and countdown from plans
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

  const handleProceedToAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setStep('choose_avatar');
  };

  const handleFinalJoin = () => {
    const finalName = guestName.trim() || 'Friend';
    const finalAvatar = selectedAvatar || BOARD_AVATARS[0]?.url;
    onJoinAsGuest(finalName, finalAvatar);
    setStep('joined_summary');
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#ECEFF3] animate-in zoom-in-95 duration-150 relative">
        
        {/* STEP 1: Welcome & Name Entry */}
        {step === 'welcome' && (
          <div className="p-6 sm:p-7">
            {/* Header: Title and Close Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight">
                  Join Plan Board
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#808897] mt-1 font-medium">
                  <Crown className="w-3.5 h-3.5 text-[#EFA00E]" />
                  <span>Invited by <strong className="text-[#1A1B25]">{ownerName}</strong></span>
                </div>
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

            {/* Board Information Card (Matches Create Board card styling) */}
            <div className="bg-[#F8F9FB] rounded-2xl p-4 sm:p-4.5 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-2xs shrink-0">
                  {board.emoji || '📋'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-[#1A1B25] leading-tight truncate">
                    {board.title}
                  </h3>
                  {board.description && (
                    <p className="text-xs text-[#808897] mt-0.5 line-clamp-1">
                      {board.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Schedule & Members info */}
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-[#666D80]">
                {activeDate && (
                  <div className="flex items-center gap-1.5 text-[#353849]">
                    <Calendar className="w-3.5 h-3.5 text-[#808897]" />
                    <span>{activeDate} {activeTime ? `· ${activeTime}` : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#808897]" />
                  <span>{membersCount} {membersCount === 1 ? 'person is' : 'people are'} planning</span>
                </div>
              </div>

              {/* Member Avatars Stack */}
              {membersCount > 0 && (
                <div className="flex items-center -space-x-1.5 pt-0.5">
                  {(board.members || []).slice(0, 6).map((m) => (
                    <img
                      key={m.id}
                      src={m.avatar}
                      alt={m.name}
                      title={m.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full border-2 border-white object-cover bg-white"
                    />
                  ))}
                  {membersCount > 6 && (
                    <span className="text-[11px] font-bold text-[#808897] ml-2">
                      +{membersCount - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Form: Name Input */}
            <form onSubmit={handleProceedToAvatar}>
              <div className="mb-2.5">
                <label className="block text-xs sm:text-[13px] font-bold text-[#808897] mb-2">
                  Board Display Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Customize name here e.g captain, starboy"
                  className="h-13 sm:h-14 px-5 rounded-2xl bg-[#F8F9FB] w-full text-sm sm:text-base text-[#1A1B25] placeholder-[#808897] font-semibold border-none outline-none focus:bg-[#ECEFF3] transition"
                  required
                  autoFocus
                />
              </div>

              {/* Suggested Name Pills (Matches Create Board BoardIdentityStep) */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {SUGGESTED_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setGuestName(name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F6F8FA] border border-[#DFE1E6] text-xs sm:text-[13px] font-semibold text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer select-none shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#808897] stroke-[2.2]" />
                    <span>{name}</span>
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                type="submit"
                disabled={!guestName.trim()}
                className={`w-full py-4 sm:py-4.5 rounded-full font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 text-center ${
                  guestName.trim()
                    ? 'bg-[#1A1B25] hover:bg-[#272835] text-white cursor-pointer shadow-sm active:scale-[0.99]'
                    : 'bg-[#DFE1E6] text-white cursor-not-allowed select-none'
                }`}
              >
                <span>Next: Choose Avatar</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Choose Avatar (Matches Create Board BoardIdentityStep) */}
        {step === 'choose_avatar' && (
          <div className="p-6 sm:p-7">
            {/* Header: Title and Close Button */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight">
                  Pick Your Board Avatar
                </h2>
                <p className="text-xs sm:text-sm text-[#808897] mt-0.5 font-normal">
                  How you'll appear to your friends on this board
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

            {/* Live Identity Preview Card */}
            <div className="bg-[#F8F9FB] rounded-2xl p-4 flex items-center gap-4 mb-5">
              <div className="relative shrink-0 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-[#EFA00E] p-1 flex items-center justify-center shadow-xs">
                <img
                  src={selectedAvatar}
                  alt={guestName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain pointer-events-none"
                />
                <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#EFA00E] text-white flex items-center justify-center shadow-xs z-10 pointer-events-none">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-[#808897] uppercase tracking-wider">
                  Your Board Identity
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-bold text-[#1A1B25] truncate">
                    {guestName.trim() || 'Friend'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECEFF3] text-[#666D80] shrink-0">
                    Member
                  </span>
                </div>
                <p className="text-xs text-[#808897] truncate mt-0.5">
                  Ready to vote and participate on {board.title}
                </p>
              </div>
            </div>

            {/* Avatar Selection Grid using BOARD_AVATARS */}
            <div className="mb-6">
              <div className="text-xs sm:text-[13px] font-bold text-[#808897] mb-2.5">
                Board Avatar
              </div>

              {/* Grid of Board Avatars */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 p-3 bg-[#F8F9FB] rounded-2xl max-h-56 overflow-y-auto">
                {BOARD_AVATARS.map((avatar) => {
                  const isSelected = selectedAvatar === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.url)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition cursor-pointer select-none ${
                        isSelected
                          ? 'bg-white border-2 border-[#EFA00E] shadow-2xs scale-105'
                          : 'bg-transparent border-2 border-transparent hover:bg-[#ECEFF3]'
                      }`}
                      title={avatar.name}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-[#EFA00E] text-white flex items-center justify-center shadow-xs z-10 pointer-events-none">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center">
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 sm:w-8 sm:h-8 object-contain pointer-events-none"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-[#666D80] mt-1 truncate max-w-full">
                        {avatar.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="px-5 py-4 rounded-full bg-white hover:bg-[#F6F8FA] border border-[#DFE1E6] text-xs sm:text-sm font-bold text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleFinalJoin}
                className="flex-1 py-4 sm:py-4.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base transition cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Join the Plan</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Joined Summary */}
        {step === 'joined_summary' && (
          <div className="p-6 sm:p-7">
            {/* Header: Title and Close Button */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight">
                  You're On The Board!
                </h2>
                <p className="text-xs sm:text-sm text-[#808897] mt-0.5 font-normal">
                  Welcome, <strong className="text-[#1A1B25]">{guestName.trim() || 'Friend'}</strong>
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

            {/* Member Profile Card */}
            <div className="bg-[#F8F9FB] rounded-2xl p-4 flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-full border-2 border-[#EFA00E] bg-white p-1 shadow-2xs shrink-0 flex items-center justify-center">
                <img
                  src={selectedAvatar}
                  alt={guestName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 object-contain pointer-events-none"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#1A1B25] truncate">
                  {guestName.trim() || 'Friend'}
                </h3>
                <p className="text-xs text-[#808897] truncate">
                  Joined as member of {board.emoji} {board.title}
                </p>
              </div>
            </div>

            {/* Active Status Items */}
            <div className="space-y-2.5 mb-6">
              <div className="p-3.5 rounded-2xl bg-[#F8F9FB] flex items-center gap-3 text-xs sm:text-[13px] font-semibold text-[#1A1B25]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  {membersCount} {membersCount === 1 ? 'person is' : 'people are'} active on this board
                </span>
              </div>

              {openDecisions.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#F8F9FB] flex items-center gap-3 text-xs sm:text-[13px] font-semibold text-[#1A1B25]">
                  <Vote className="w-4 h-4 text-[#808897] shrink-0" />
                  <span>
                    {openDecisions.length} {openDecisions.length === 1 ? 'decision needs' : 'decisions need'} group input
                  </span>
                </div>
              )}

              {openAttendancePlans.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#F8F9FB] flex items-center gap-3 text-xs sm:text-[13px] font-semibold text-[#1A1B25]">
                  <UserCheck className="w-4 h-4 text-[#808897] shrink-0" />
                  <span>
                    Attendance RSVP needed: {openAttendancePlans.map((p) => p.title).join(', ')}
                  </span>
                </div>
              )}

              {openTasks.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#F8F9FB] flex items-center gap-3 text-xs sm:text-[13px] font-semibold text-[#1A1B25]">
                  <Award className="w-4 h-4 text-[#808897] shrink-0" />
                  <span>
                    {openTasks.length} volunteer {openTasks.length === 1 ? 'duty is' : 'duties are'} open
                  </span>
                </div>
              )}

              {board.plans && board.plans.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#F8F9FB] flex items-center gap-3 text-xs sm:text-[13px] font-semibold text-[#1A1B25]">
                  <Layers className="w-4 h-4 text-[#808897] shrink-0" />
                  <span className="truncate">
                    {board.plans.length} plan item(s) organized
                  </span>
                </div>
              )}

              {hasDateAndTime && countdown.isValid && !countdown.isPast && (
                <div className="p-3.5 rounded-2xl bg-[#F8F9FB] flex items-center gap-3 text-xs sm:text-[13px] font-semibold text-[#1A1B25]">
                  <Clock className="w-4 h-4 text-[#808897] shrink-0" />
                  <span>{countdown.label}</span>
                </div>
              )}
            </div>

            {/* Direct CTA */}
            {openDecisions.length > 0 || openAttendancePlans.length > 0 || openTasks.length > 0 ? (
              <button
                type="button"
                onClick={() => setStep('first_action')}
                className="w-full py-4 sm:py-4.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base transition cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>
                  {openDecisions.length > 0
                    ? `Vote on Pending Decision (${openDecisions.length})`
                    : openAttendancePlans.length > 0
                    ? `Confirm Attendance RSVP`
                    : `See Volunteer Duty (${openTasks.length})`}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishAndEnter}
                className="w-full py-4 sm:py-4.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base transition cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Explore The Full Board</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}

        {/* STEP 4: First Action (Decision / RSVP / Duty) */}
        {step === 'first_action' && (
          <div className="p-6 sm:p-7">
            {activeDecision ? (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight">
                      Cast Your Vote
                    </h2>
                    <p className="text-xs sm:text-sm text-[#808897] mt-0.5 font-normal">
                      Help finalize {activeDecision.title}
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

                {/* Switcher if multiple open decisions exist */}
                {openDecisions.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
                    {openDecisions.map((d, idx) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDecisionId(d.id);
                          setSelectedOptionId(d.options?.[0]?.id || null);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                          selectedDecisionId === d.id
                            ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold'
                            : 'bg-white border border-[#DFE1E6] text-[#666D80] hover:text-[#1A1B25]'
                        }`}
                      >
                        #{idx + 1} {d.title}
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-xs text-[#808897] mb-3 font-medium">
                  {activeDecision.question || 'Your vote is needed! Pick your preference:'}
                </div>

                {/* Options List styled with Create Board selector design */}
                <div className="space-y-2.5 mb-6 max-h-64 overflow-y-auto pr-0.5">
                  {(activeDecision.options || []).map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`relative w-full p-3.5 sm:p-4 rounded-2xl transition cursor-pointer text-left flex items-center justify-between min-h-[52px] ${
                          isSelected
                            ? 'bg-[#FFF9F0] border-2 border-[#EFA00E]'
                            : 'bg-[#F8F9FB] border-2 border-transparent hover:border-[#DFE1E6]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg shrink-0">{opt.emoji || '🔘'}</span>
                          <span className="text-xs sm:text-[13px] font-bold text-[#1A1B25] truncate">
                            {opt.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-[#666D80]">
                            {opt.voteCount} {opt.voteCount === 1 ? 'vote' : 'votes'}
                          </span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#EFA00E] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleFirstVote}
                  disabled={!selectedOptionId}
                  className={`w-full py-4 sm:py-4.5 rounded-full font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 text-center ${
                    selectedOptionId
                      ? 'bg-[#1A1B25] hover:bg-[#272835] text-white cursor-pointer shadow-sm active:scale-[0.99]'
                      : 'bg-[#DFE1E6] text-white cursor-not-allowed select-none'
                  }`}
                >
                  <span>Submit My Vote</span>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            ) : activeAttendance ? (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight">
                      Confirm Attendance
                    </h2>
                    <p className="text-xs sm:text-sm text-[#808897] mt-0.5 font-normal">
                      {activeAttendance.title}
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

                <div className="text-xs text-[#808897] mb-3 font-medium">
                  {activeAttendance.statusQuestion || 'Will you be attending this plan?'}
                </div>

                {/* Status Options */}
                <div className="space-y-2.5 mb-6">
                  {(activeAttendance.statusOptions || []).map((opt) => {
                    const isSelected = selectedAttendanceOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedAttendanceOptionId(opt.id)}
                        className={`relative w-full p-3.5 sm:p-4 rounded-2xl transition cursor-pointer text-left flex items-center justify-between min-h-[52px] ${
                          isSelected
                            ? 'bg-[#FFF9F0] border-2 border-[#EFA00E]'
                            : 'bg-[#F8F9FB] border-2 border-transparent hover:border-[#DFE1E6]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg shrink-0">{opt.emoji || '🙋'}</span>
                          <span className="text-xs sm:text-[13px] font-bold text-[#1A1B25] truncate">
                            {opt.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#EFA00E] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeAttendance && selectedAttendanceOptionId && onUpdateParticipantStatus) {
                      onUpdateParticipantStatus(activeAttendance.id, selectedAttendanceOptionId);
                      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
                      setStep('done');
                    }
                  }}
                  disabled={!selectedAttendanceOptionId}
                  className={`w-full py-4 sm:py-4.5 rounded-full font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 text-center ${
                    selectedAttendanceOptionId
                      ? 'bg-[#1A1B25] hover:bg-[#272835] text-white cursor-pointer shadow-sm active:scale-[0.99]'
                      : 'bg-[#DFE1E6] text-white cursor-not-allowed select-none'
                  }`}
                >
                  <span>Confirm My Attendance</span>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            ) : activeTask ? (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight">
                      Volunteer for Duty
                    </h2>
                    <p className="text-xs sm:text-sm text-[#808897] mt-0.5 font-normal">
                      {activeTask.title}
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

                <p className="text-xs text-[#808897] mb-4">
                  {activeTask.description || 'This responsibility is open for volunteers!'}
                </p>

                <div className="p-4 rounded-2xl bg-[#F8F9FB] text-xs text-[#1A1B25] space-y-2 mb-6">
                  <div className="font-bold flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#808897]" />
                    <span>{activeTask.deadlineText || 'Open for group volunteers'}</span>
                  </div>
                  <p className="text-[#808897] text-xs">
                    Step up to coordinate this part of the plan with {ownerName}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClaimDuty}
                  className="w-full py-4 sm:py-4.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base transition cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>I'll Take This Duty!</span>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-[#F6F8FA] text-[#1A1B25] flex items-center justify-center mx-auto mb-3 text-2xl">
                  ✨
                </div>
                <h3 className="text-xl font-extrabold text-[#1A1B25] mb-1">
                  All decisions locked in!
                </h3>
                <p className="text-xs sm:text-sm text-[#808897] max-w-xs mx-auto mb-6">
                  There are currently no pending decisions needing a vote on {board.title}.
                </p>
                <button
                  type="button"
                  onClick={handleFinishAndEnter}
                  className="w-full py-4 sm:py-4.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base transition cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Explore The Full Board</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Success & Enter Full Board */}
        {step === 'done' && (
          <div className="p-6 sm:p-7 text-center">
            {/* Header Close Button */}
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            <div className="w-14 h-14 rounded-full bg-[#F6F8FA] text-[#1A1B25] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#1A1B25]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A1B25] tracking-tight mb-2">
              You're In The Plan! 🎉
            </h3>
            <p className="text-xs sm:text-sm text-[#808897] max-w-sm mx-auto mb-6 leading-relaxed">
              Your response has been counted on <strong className="text-[#1A1B25]">{board.title}</strong>. You can now explore the itinerary, see photos, and help <strong className="text-[#1A1B25]">{ownerName}</strong> finalize the rest!
            </p>

            <button
              type="button"
              onClick={handleFinishAndEnter}
              className="w-full py-4 sm:py-4.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base transition cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Explore The Full Board</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
