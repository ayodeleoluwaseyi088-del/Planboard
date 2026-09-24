import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  UserPlus, 
  Search, 
  ChevronDown, 
  Check,
  Users
} from 'lucide-react';
import { BoardMember, UserPersona, MemberRole } from '../types';

interface PeopleSectionProps {
  members: BoardMember[];
  currentPersona: UserPersona;
  onUpdateMemberRole: (memberId: string, newRole: MemberRole) => void;
  onAssignResponsibility: (memberId: string, resp: string) => void;
  onOpenShare: () => void;
}

export const PeopleSection: React.FC<PeopleSectionProps> = ({
  members,
  currentPersona,
  onUpdateMemberRole,
  onAssignResponsibility,
  onOpenShare,
}) => {
  const currentMember = members.find(
    (m) =>
      m.id === currentPersona?.id ||
      (Boolean(m.name) && Boolean(currentPersona?.name) && m.name.toLowerCase() === currentPersona?.name.toLowerCase())
  );
  const resolvedCurrentRole = currentMember?.role || currentPersona?.role;
  const isOwner = resolvedCurrentRole === 'owner';
  const isAdmin = resolvedCurrentRole === 'admin';
  const canManageRoles = isOwner || isAdmin;

  const [searchQuery, setSearchQuery] = useState('');
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);
  const [editingResponsibilityFor, setEditingResponsibilityFor] = useState<string | null>(null);
  const [responsibilityText, setResponsibilityText] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.role-dropdown-wrapper')) {
        setOpenRoleMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveResponsibility = (memberId: string) => {
    onAssignResponsibility(memberId, responsibilityText.trim());
    setEditingResponsibilityFor(null);
    setResponsibilityText('');
  };

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(q) ||
      (member.role && member.role.toLowerCase().includes(q)) ||
      (member.responsibility && member.responsibility.toLowerCase().includes(q))
    );
  });

  return (
    <section id="people-section" className="scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-black text-[#1A1B25] tracking-tight leading-tight">
            Participants ({members.length})
          </h2>
          <p className="text-xs sm:text-sm text-[#808897] mt-0.5">
            Owner, Assistants, and Members building the event
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#1A1B25] transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#666D80]" />
          <span>Invite Friends</span>
        </button>
      </div>

      {/* Main Content */}
      {members.length === 0 ? (
        <div className="w-full py-16 sm:py-24 flex flex-col items-center justify-center text-center select-none">
          <Users className="w-9 h-9 text-[#272835] stroke-[2.2] mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#272835] tracking-tight leading-snug mb-2">
            No participants yet
          </h3>
          <p className="text-sm sm:text-base text-[#808897] font-normal tracking-normal max-w-lg leading-relaxed">
            Invite friends and collaborators so they can join the board and participate
          </p>
          <button
            type="button"
            onClick={onOpenShare}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-sm font-bold transition cursor-pointer shadow-xs active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Invite Friends</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F6F8FA] shadow-[3px_4px_20px_0px_#ECEFF3]">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-[#808897] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-[#DFE1E6] text-xs sm:text-sm text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:border-[#808897] transition"
          />
        </div>

        {/* Member List */}
        <div className="divide-y divide-[#ECEFF3]">
          {filteredMembers.map((member) => {
            const isCurrentUser = member.id === currentPersona.id;
            const isMemberOwner = member.role === 'owner';
            const isMemberAdmin = member.role === 'admin';
            const isRoleMenuOpen = openRoleMenuId === member.id;

            return (
              <div
                key={member.id}
                id={`member-${member.id}`}
                className="py-3 sm:py-3.5 flex items-center justify-between gap-3 scroll-mt-24 transition-colors"
              >
                {/* Left: Avatar & Names */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-[#1A1B25] truncate">
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>

                    {/* Responsibility / Assigned Duty */}
                    {editingResponsibilityFor === member.id ? (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input
                          type="text"
                          placeholder="e.g. Sound system & DJ"
                          value={responsibilityText}
                          onChange={(e) => setResponsibilityText(e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-[#DFE1E6] focus:outline-none focus:border-[#808897]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveResponsibility(member.id)}
                          className="px-2.5 py-1 rounded-full bg-[#1A1B25] text-white text-[11px] font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingResponsibilityFor(null)}
                          className="px-2.5 py-1 rounded-full bg-[#ECEFF3] text-[#666D80] text-[11px] font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#808897] mt-0.5">
                        <span className="truncate">
                          {member.responsibility || 'No assigned duty'}
                        </span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingResponsibilityFor(member.id);
                              setResponsibilityText(member.responsibility || '');
                            }}
                            className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer shrink-0"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Role Badge / Dropdown */}
                <div className="relative shrink-0 role-dropdown-wrapper">
                  {isMemberOwner ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#F59E0B] text-[#D97706] bg-[#FFFDF5] text-xs font-bold">
                      <Crown className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Owner</span>
                    </div>
                  ) : isMemberAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenRoleMenuId(isRoleMenuOpen ? null : member.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#DFE1E6] text-[#2563EB] bg-white text-xs font-semibold hover:bg-[#F8F9FB] hover:border-[#C1C7CF] transition cursor-pointer shadow-2xs"
                    >
                      <span>Admin</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#808897] transition-transform duration-200 ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenRoleMenuId(isRoleMenuOpen ? null : member.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#DFE1E6] text-[#666D80] bg-white text-xs font-semibold hover:bg-[#F8F9FB] hover:border-[#C1C7CF] transition cursor-pointer shadow-2xs"
                    >
                      <span>Member</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#808897] transition-transform duration-200 ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {/* Role Change Dropdown Menu */}
                  {isRoleMenuOpen && (
                    canManageRoles ? (
                      <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-white border border-[#DFE1E6] shadow-xl p-1.5 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#808897]">
                          Change Role:
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateMemberRole(member.id, 'member');
                            setOpenRoleMenuId(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                            !isMemberAdmin ? 'bg-[#F8F9FB] text-[#1A1B25] font-extrabold' : 'text-[#666D80] hover:bg-[#F8F9FB]'
                          }`}
                        >
                          <span>Member</span>
                          {!isMemberAdmin && <Check className="w-3.5 h-3.5 text-[#1A1B25] stroke-[2.5]" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateMemberRole(member.id, 'admin');
                            setOpenRoleMenuId(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                            isMemberAdmin ? 'bg-[#EFF6FF] text-[#2563EB] font-extrabold' : 'text-[#1A1B25] hover:bg-[#F8F9FB]'
                          }`}
                        >
                          <span>Admin</span>
                          {isMemberAdmin && <Check className="w-3.5 h-3.5 text-[#2563EB] stroke-[2.5]" />}
                        </button>
                      </div>
                    ) : (
                      <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-white border border-[#DFE1E6] shadow-xl p-3 z-30 text-center animate-in fade-in zoom-in-95 duration-100">
                        <div className="text-xs font-bold text-[#1A1B25] mb-1">Role Management</div>
                        <p className="text-[11px] text-[#808897] leading-relaxed">
                          Only the Board Owner and Admins have permission to manage member roles.
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center select-none">
              <Search className="w-8 h-8 text-[#272835] stroke-[2.2] mb-3" />
              <h4 className="text-base sm:text-lg font-bold text-[#272835] tracking-tight leading-snug mb-1">
                No participants matching &quot;{searchQuery}&quot;
              </h4>
              <p className="text-xs sm:text-sm text-[#808897] font-normal max-w-sm">
                Try searching for another name or duty
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </section>
  );
};

