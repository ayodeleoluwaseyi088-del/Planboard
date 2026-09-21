import React, { useState, useEffect } from 'react';
import { 
  ChevronDown,
  Search,
  Check,
  Plus
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
  const currentMember = members.find(
    (m) =>
      m.id === currentPersona?.id ||
      (Boolean(m.name) && Boolean(currentPersona?.name) && m.name.toLowerCase() === currentPersona?.name.toLowerCase())
  );
  const resolvedRole = currentMember?.role || currentPersona?.role;
  const isOwner = resolvedRole === 'owner';
  const isAdmin = resolvedRole === 'admin';
  const isAdminOrOwner = isOwner || isAdmin;
  const canManageStatus = isOwner || isAdmin;

  // Filter only participant status plans
  const statusPlans = plans.filter((p) => p.deciderType === 'participant_status');

  const [activePlanId, setActivePlanId] = useState<string>(
    statusPlans.length > 0 ? statusPlans[0].id : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptionId, setFilterOptionId] = useState<string>('all');
  const [openDropdownMemberId, setOpenDropdownMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!openDropdownMemberId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-dropdown-wrapper')) {
        setOpenDropdownMemberId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownMemberId]);

  // If active plan is no longer in statusPlans, select first one
  const selectedPlan = statusPlans.find((p) => p.id === activePlanId) || statusPlans[0];

  if (statusPlans.length === 0) {
    return null;
  }

  const options = (selectedPlan.statusOptions && selectedPlan.statusOptions.length > 0)
    ? selectedPlan.statusOptions
    : [
        { id: 'opt-attending', label: 'Attending', emoji: '✅', color: 'emerald' },
        { id: 'opt-maybe', label: 'Maybe', emoji: '🤔', color: 'amber' },
        { id: 'opt-unavailable', label: 'Not Attending', emoji: '❌', color: 'rose' },
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

  const handleSelectOption = (planId: string, memberId: string, optionId: string) => {
    onUpdateStatus(planId, memberId, optionId);
    setOpenDropdownMemberId(null);

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
          // ignore
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

  return (
    <section id="participant-status-section" className="scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
            Participant Status & Check-ins
          </h2>
          <p className="text-xs sm:text-sm text-[#808897] mt-0.5">
            Automatic roster synced from everyone who joined this board. Check in below or view the group status.
          </p>
        </div>

        {isAdminOrOwner && onOpenAddPlan && (
          <button
            type="button"
            onClick={onOpenAddPlan}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#1A1B25] transition cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-[#666D80]" />
            <span>New Status Decider</span>
          </button>
        )}
      </div>

      {/* Multiple Plans Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {statusPlans.map((p) => {
          const isActive = selectedPlan.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActivePlanId(p.id);
                setFilterOptionId('all');
                setSearchQuery('');
              }}
              className={`px-5 py-2 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold border border-transparent'
                  : 'bg-white border border-[#DFE1E6] text-[#666D80] font-semibold hover:bg-[#F6F8FA]'
              }`}
            >
              {p.title}
            </button>
          );
        })}
      </div>

      {/* Main Card Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F6F8FA] shadow-[3px_4px_20px_0px_#ECEFF3]">
        {/* Card Header: Icon + Title + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECEFF3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF9F0] border border-[#FEF3C7] flex items-center justify-center text-lg shrink-0">
              {selectedPlan.emoji || '🪅'}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1B25]">
                {selectedPlan.title}
              </h3>
              <p className="text-xs text-[#808897]">
                {selectedPlan.statusQuestion || 'Who will be attending?'}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-56 self-start sm:self-auto">
            <Search className="w-4 h-4 text-[#808897] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-[#DFE1E6] text-xs text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:border-[#808897] transition"
            />
          </div>
        </div>

        {/* Filter / Breakdown Chips Row */}
        <div className="flex items-center gap-2 flex-wrap pt-4 pb-2">
          {options.map((opt) => {
            const isSelected = filterOptionId === opt.id;
            const count = countsByOptionId[opt.id] || 0;
            const emojiText = opt.label.toLowerCase().includes('will') ? '✔' : (opt.emoji || '🔘');

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterOptionId(isSelected ? 'all' : opt.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#ECEFF3] text-[#1A1B25] border border-transparent font-extrabold shadow-2xs'
                    : 'bg-white border border-[#DFE1E6] text-[#666D80] hover:bg-[#F8F9FB]'
                }`}
              >
                <span>{emojiText} {opt.label}</span>
                <span className="px-2 py-0.2 rounded-full text-[11px] font-extrabold bg-[#F8F9FB] border border-[#ECEFF3] text-[#1A1B25]">
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setFilterOptionId(filterOptionId === 'pending' ? 'all' : 'pending')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer select-none ${
              filterOptionId === 'pending'
                ? 'bg-[#ECEFF3] text-[#1A1B25] border border-transparent font-extrabold'
                : 'bg-white border border-[#DFE1E6] text-[#666D80] hover:bg-[#F8F9FB]'
            }`}
          >
            <span>⏳ Awaiting</span>
            <span className="px-2 py-0.2 rounded-full text-[11px] font-extrabold bg-[#F8F9FB] border border-[#ECEFF3] text-[#1A1B25]">
              {Math.max(0, members.length - totalResponded)}
            </span>
          </button>
        </div>

        {/* Member Roster List */}
        <div className="divide-y divide-[#ECEFF3] mt-2">
          {filteredMembers.map((member) => {
            const status = currentStatuses[member.id];
            const isCurrentUser = member.id === currentPersona.id;
            const matchingOption = options.find((o) => o.id === status?.statusOptionId);
            const isDropdownOpen = openDropdownMemberId === member.id;
            const isMemberOwner = member.role === 'owner';
            const isMemberAdmin = member.role === 'admin';

            return (
              <div
                key={member.id}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3 status-dropdown-wrapper"
              >
                {/* Left: Avatar + Name + Role */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#1A1B25] truncate">
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    {/* Role badge below name matching reference */}
                    <div className="mt-0.5">
                      {isMemberOwner ? (
                        <span className="text-xs font-bold text-[#D97706] flex items-center gap-1">
                          👑 Owner
                        </span>
                      ) : isMemberAdmin ? (
                        <span className="text-xs font-bold text-[#2563EB]">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[#808897]">
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status Dropdown Button */}
                <div className="relative shrink-0 status-dropdown-wrapper">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdownMemberId(isDropdownOpen ? null : member.id);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition shadow-2xs cursor-pointer hover:border-[#808897] ${
                      matchingOption?.label.toLowerCase().includes('will') || matchingOption?.label.toLowerCase().includes('attend')
                        ? 'border-[#A7F3D0] text-[#059669] bg-white hover:bg-[#F0FDF4]'
                        : matchingOption?.label.toLowerCase().includes('maybe')
                        ? 'border-[#FDE68A] text-[#D97706] bg-white hover:bg-[#FFFBEB]'
                        : matchingOption?.label.toLowerCase().includes('not') || matchingOption?.label.toLowerCase().includes('decline')
                        ? 'border-[#FECACA] text-[#DC2626] bg-white hover:bg-[#FEF2F2]'
                        : 'border-[#DFE1E6] text-[#808897] bg-white hover:bg-[#F8F9FB]'
                    }`}
                  >
                    <span>
                      {matchingOption
                        ? `${matchingOption.emoji ? matchingOption.emoji : (matchingOption.label.toLowerCase().includes('will') || matchingOption.label.toLowerCase().includes('attend') ? '✔' : '🔘')} ${matchingOption.label}`
                        : 'Awaiting response'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Options Popup */}
                  {isDropdownOpen && (
                    (isCurrentUser || canManageStatus) ? (
                      <div className="absolute right-0 top-full mt-1.5 z-30 w-52 rounded-2xl bg-white border border-[#DFE1E6] shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#808897]">
                          {isCurrentUser ? 'Update your status:' : `Update ${member.name}'s status:`}
                        </div>
                        {options.map((opt) => {
                          const isSelected = status?.statusOptionId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectOption(selectedPlan.id, member.id, opt.id)}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#F8F9FB] text-[#1A1B25] font-extrabold'
                                  : 'text-[#353849] hover:bg-[#F8F9FB]'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>
                                  {opt.emoji || (opt.label.toLowerCase().includes('will') || opt.label.toLowerCase().includes('attend') ? '✔' : '🔘')}
                                </span>
                                <span>{opt.label}</span>
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#1A1B25] stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="absolute right-0 top-full mt-1.5 z-30 w-52 rounded-2xl bg-white border border-[#DFE1E6] shadow-xl p-3 text-center animate-in fade-in zoom-in-95 duration-100">
                        <div className="text-xs font-bold text-[#1A1B25] mb-1">Status Management</div>
                        <p className="text-[11px] text-[#808897] leading-relaxed">
                          Only the Board Owner, Admins, or {member.name} can update this status.
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="py-8 text-center text-xs text-[#808897]">
              No participants found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

