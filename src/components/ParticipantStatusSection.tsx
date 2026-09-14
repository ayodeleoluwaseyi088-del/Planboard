import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Check, 
  Clock, 
  Plus, 
  UserCheck, 
  AlertCircle, 
  Sparkles,
  ChevronDown,
  Shield,
  Search,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttachedPlan, BoardMember, UserPersona } from '../types';

interface ParticipantStatusSectionProps {
  plans: AttachedPlan[];
  members: BoardMember[];
  currentPersona: UserPersona;
  onUpdateStatus: (planId: string, memberId: string, optionId: string) => void;
  onOpenAddPlan?: () => void;
}

export const ParticipantStatusSection: React.FC<ParticipantStatusSectionProps> = ({
  plans,
  members,
  currentPersona,
  onUpdateStatus,
  onOpenAddPlan,
}) => {
  const isOwner = currentPersona.role === 'owner';
  const isAdminOrOwner = currentPersona.role === 'owner' || currentPersona.role === 'admin';

  // Filter only participant status plans
  const statusPlans = plans.filter((p) => p.deciderType === 'participant_status');

  const [activePlanId, setActivePlanId] = useState<string>(
    statusPlans.length > 0 ? statusPlans[0].id : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptionId, setFilterOptionId] = useState<string>('all');
  const [overrideMenuMemberId, setOverrideMenuMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!overrideMenuMemberId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.participant-status-dropdown-container')) {
        setOverrideMenuMemberId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [overrideMenuMemberId]);

  // If active plan is no longer in statusPlans, select first one
  const selectedPlan = statusPlans.find((p) => p.id === activePlanId) || statusPlans[0];

  if (statusPlans.length === 0) {
    return null;
  }

  const options = selectedPlan.statusOptions || [
    { id: 'opt-1', label: 'I will', emoji: '✅', color: 'emerald' },
    { id: 'opt-2', label: 'Maybe', emoji: '🤔', color: 'amber' },
    { id: 'opt-3', label: 'Not available', emoji: '❌', color: 'rose' },
  ];

  const currentStatuses = selectedPlan.participantStatuses || {};

  // Compute live breakdown counts
  const countsByOptionId: Record<string, number> = {};
  let totalResponded = 0;

  options.forEach((opt) => {
    countsByOptionId[opt.id] = 0;
  });

  members.forEach((m) => {
    const status = currentStatuses[m.id];
    if (status && status.statusOptionId) {
      countsByOptionId[status.statusOptionId] = (countsByOptionId[status.statusOptionId] || 0) + 1;
      totalResponded += 1;
    }
  });

  const myStatus = currentStatuses[currentPersona.id];

  const handleSelectOption = (planId: string, memberId: string, optionId: string) => {
    onUpdateStatus(planId, memberId, optionId);
    setOverrideMenuMemberId(null);

    // If current persona is updating their own status to an affirmative option, trigger confetti
    if (memberId === currentPersona.id) {
      const chosenOpt = options.find((o) => o.id === optionId);
      const isAffirmative = chosenOpt?.label.toLowerCase().includes('will') || 
                            chosenOpt?.label.toLowerCase().includes('paid') ||
                            chosenOpt?.label.toLowerCase().includes('yes');
      if (isAffirmative) {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch (e) {
          // ignore in sandboxes
        }
      }
    }
  };

  // Filter members by search and status
  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterOptionId === 'all') return true;
    if (filterOptionId === 'pending') {
      return !currentStatuses[m.id] || !currentStatuses[m.id]?.statusOptionId;
    }
    return currentStatuses[m.id]?.statusOptionId === filterOptionId;
  });

  const getOptionBadgeColor = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'rose':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getOptionButtonColor = (color?: string, isSelected?: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'emerald':
          return 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black';
        case 'amber':
          return 'bg-amber-500 text-white border-amber-500 shadow-xs font-black';
        case 'rose':
          return 'bg-rose-600 text-white border-rose-600 shadow-xs font-black';
        case 'indigo':
          return 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-black';
        default:
          return 'bg-[#1A1B25] text-white border-[#1A1B25] shadow-xs font-black';
      }
    }
    return 'bg-white text-[#353849] hover:bg-[#F8F9FB] border-[#DFE1E6] font-bold';
  };

  return (
    <section id="participant-status-section" className="mb-8 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700">
            <Users className="w-3.5 h-3.5" />
            <span>Participant Status Decider</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
            Participant Status & Check-ins
          </h2>
          <p className="text-xs text-[#666D80]">
            Automatic roster synced from everyone who joined this board. Check in below or view the group status.
          </p>
        </div>

        {isAdminOrOwner && onOpenAddPlan && (
          <button
            onClick={onOpenAddPlan}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#1A1B25] transition cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Status Decider</span>
          </button>
        )}
      </div>

      {/* Multiple Plans Switcher Tabs if > 1 status plans */}
      {statusPlans.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {statusPlans.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePlanId(p.id);
                setFilterOptionId('all');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                selectedPlan.id === p.id
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-white border border-[#DFE1E6] text-[#666D80] hover:bg-[#F8F9FB]'
              }`}
            >
              <span>{p.emoji}</span>
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Plan Main Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECEFF3] shadow-xs space-y-5">
        {/* Plan Header Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECEFF3]">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">
              {selectedPlan.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-[#1A1B25]">
                  {selectedPlan.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                  {selectedPlan.category || 'Status Check-in'}
                </span>
                {(selectedPlan.date || selectedPlan.time) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    📅 {selectedPlan.date} {selectedPlan.time && `at ${selectedPlan.time}`}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-indigo-950 mt-1">
                {selectedPlan.statusQuestion || 'Who will be participating?'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-xl bg-[#F8F9FB] border border-[#ECEFF3] text-xs font-black text-[#1A1B25] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalResponded} / {members.length} Responded</span>
            </span>
          </div>
        </div>

        {/* Live Summary Chips Bar & Progress */}
        <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#666D80]">
              Current Group Status
            </span>
            <span className="text-[11px] font-bold text-[#808897]">
              {Math.round((totalResponded / (members.length || 1)) * 100)}% Participation Rate
            </span>
          </div>

          {/* Option Counts Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {options.map((opt) => {
              const count = countsByOptionId[opt.id] || 0;
              const isLead = count > 0 && Math.max(...Object.values(countsByOptionId)) === count;
              return (
                <div
                  key={opt.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                    isLead
                      ? 'bg-white border-indigo-200 shadow-2xs'
                      : 'bg-white/70 border-[#ECEFF3]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base">{opt.emoji || '🔘'}</span>
                    <span className="text-xs font-bold text-[#1A1B25] truncate">
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 ml-1 shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}

            {/* Awaiting response pill */}
            <div className="p-2.5 rounded-xl border border-[#ECEFF3] bg-white/70 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className="w-4 h-4 text-[#808897]" />
                <span className="text-xs font-bold text-[#666D80] truncate">
                  Awaiting
                </span>
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-[#ECEFF3] text-[#666D80] ml-1 shrink-0">
                {Math.max(0, members.length - totalResponded)}
              </span>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="h-2 w-full bg-[#ECEFF3] rounded-full overflow-hidden flex">
            {options.map((opt) => {
              const count = countsByOptionId[opt.id] || 0;
              const pct = (count / (members.length || 1)) * 100;
              if (pct === 0) return null;
              const bg = opt.color === 'emerald' ? 'bg-emerald-500' :
                         opt.color === 'amber' ? 'bg-amber-400' :
                         opt.color === 'rose' ? 'bg-rose-500' :
                         opt.color === 'indigo' ? 'bg-indigo-600' : 'bg-slate-500';
              return (
                <div
                  key={opt.id}
                  style={{ width: `${pct}%` }}
                  className={`${bg} transition-all duration-300`}
                  title={`${opt.label}: ${count} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
        </div>

        {/* Personalized "Your Status" Check-in Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src={currentPersona.avatar}
              alt={currentPersona.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-200 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-indigo-950">
                  Your Check-in ({currentPersona.name})
                </span>
                {myStatus?.statusLabel ? (
                  <span className="text-[10px] font-black px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                    Recorded: {myStatus.statusLabel}
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.2 rounded-md bg-amber-100 text-amber-800">
                    Action Needed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-900 mt-0.5">
                {myStatus?.statusLabel
                  ? `You are currently marked as "${myStatus.statusLabel}". Tap to change anytime:`
                  : 'Tap an option to mark your response for the creator & group:'}
              </p>
            </div>
          </div>

          {/* Quick Option Selection Buttons for Current User */}
          <div className="flex items-center flex-wrap gap-1.5 shrink-0">
            {options.map((opt) => {
              const isSelected = myStatus?.statusOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(selectedPlan.id, currentPersona.id, opt.id)}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${getOptionButtonColor(
                    opt.color,
                    isSelected
                  )}`}
                >
                  <span>{opt.emoji || '🔘'}</span>
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Participant Roster Table & Search/Filter Controls */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#666D80]">
                Board Participants Roster ({filteredMembers.length})
              </span>
              {isAdminOrOwner && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Admin override active</span>
                </span>
              )}
            </div>

            {/* Filter & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter pills */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterOptionId('all')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterOptionId === 'all'
                      ? 'bg-[#1A1B25] text-white'
                      : 'bg-[#F8F9FB] text-[#666D80] hover:bg-[#ECEFF3]'
                  }`}
                >
                  All ({members.length})
                </button>
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilterOptionId(opt.id)}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      filterOptionId === opt.id
                        ? 'bg-[#1A1B25] text-white'
                        : 'bg-[#F8F9FB] text-[#666D80] hover:bg-[#ECEFF3]'
                    }`}
                  >
                    {opt.label} ({countsByOptionId[opt.id] || 0})
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFilterOptionId('pending')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterOptionId === 'pending'
                      ? 'bg-[#1A1B25] text-white'
                      : 'bg-[#F8F9FB] text-[#666D80] hover:bg-[#ECEFF3]'
                  }`}
                >
                  Awaiting ({Math.max(0, members.length - totalResponded)})
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#808897] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find participant..."
                  className="pl-7 pr-2.5 py-1 text-xs rounded-xl border border-[#DFE1E6] bg-white text-[#1A1B25] focus:outline-indigo-500 w-32 sm:w-36 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="divide-y divide-[#ECEFF3] rounded-2xl border border-[#ECEFF3] overflow-hidden bg-white">
            {filteredMembers.map((member) => {
              const status = currentStatuses[member.id];
              const isCurrentUser = member.id === currentPersona.id;
              const matchingOption = options.find((o) => o.id === status?.statusOptionId);
              const isMenuOpen = overrideMenuMemberId === member.id;

              return (
                <div
                  key={member.id}
                  className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#F8F9FB] transition"
                >
                  {/* Left: Member Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#DFE1E6] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-[#1A1B25] truncate">
                          {member.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-indigo-100 text-indigo-800">
                            You
                          </span>
                        )}
                        {member.role === 'owner' && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-amber-100 text-amber-800">
                            Host
                          </span>
                        )}
                        {member.role === 'admin' && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-800">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#808897] font-medium truncate">
                        {status?.updatedAt ? `Updated ${status.updatedAt}` : 'No response yet'}
                        {status?.updatedBy && status.updatedBy !== member.name ? ` • set by ${status.updatedBy}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status Display & Interactive Selector */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Status Badge */}
                    {matchingOption ? (
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${getOptionBadgeColor(
                          matchingOption.color
                        )}`}
                      >
                        <span>{matchingOption.emoji || '🔘'}</span>
                        <span>{matchingOption.label}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#ECEFF3] text-[#666D80] border border-[#DFE1E6] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#808897]" />
                        <span>Awaiting response</span>
                      </span>
                    )}

                    {/* Interactive Selection Trigger: If Current User OR Admin/Owner */}
                    {(isCurrentUser || isAdminOrOwner) && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOverrideMenuMemberId(isMenuOpen ? null : member.id)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold text-[#1A1B25] hover:bg-[#ECEFF3] border border-[#DFE1E6] flex items-center gap-1 transition cursor-pointer"
                          title={isCurrentUser ? 'Update your status' : `Set status for ${member.name}`}
                        >
                          <span>{isCurrentUser ? 'Change' : 'Set status'}</span>
                          <ChevronDown className="w-3 h-3 text-[#808897]" />
                        </button>

                        {/* Dropdown Menu for options */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-2xl bg-white border border-[#DFE1E6] shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#808897]">
                              {isCurrentUser ? 'Select your status:' : `Set status for ${member.name}:`}
                            </div>
                            {options.map((opt) => {
                              const isSelected = status?.statusOptionId === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleSelectOption(selectedPlan.id, member.id, opt.id)}
                                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-50 text-indigo-900 font-black'
                                      : 'text-[#353849] hover:bg-[#F8F9FB]'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span>{opt.emoji || '🔘'}</span>
                                    <span>{opt.label}</span>
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="p-6 text-center text-xs text-[#808897]">
                No participants found matching &quot;{searchQuery}&quot; or filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
