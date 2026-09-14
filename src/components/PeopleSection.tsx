import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  Shield, 
  User, 
  UserPlus, 
  Share2, 
  MoreHorizontal,
  CheckCircle2
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
  const isOwner = currentPersona.role === 'owner';
  const [editingResponsibilityFor, setEditingResponsibilityFor] = useState<string | null>(null);
  const [responsibilityText, setResponsibilityText] = useState('');

  const handleSaveResponsibility = (memberId: string) => {
    onAssignResponsibility(memberId, responsibilityText.trim());
    setEditingResponsibilityFor(null);
    setResponsibilityText('');
  };

  return (
    <section id="people-section" className="mb-8 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-600">
            <Users className="w-3.5 h-3.5" />
            <span>Participants & Permissions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
            People Planning Together ({members.length})
          </h2>
          <p className="text-xs text-[#666D80]">
            Owner, Assistants, and Members building the event
          </p>
        </div>

        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#1A1B25] transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite More Friends</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {members.map((member) => {
          const isCurrentUser = member.id === currentPersona.id;
          const isMemberOwner = member.role === 'owner';
          const isMemberAdmin = member.role === 'admin';

          return (
            <div
              key={member.id}
              className={`rounded-2xl p-4 border transition shadow-xs flex flex-col justify-between ${
                isCurrentUser
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-[#ECEFF3] hover:border-[#DFE1E6]'
              }`}
            >
              <div>
                {/* Top Info */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-[#1A1B25]">
                          {member.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isMemberOwner
                          ? 'bg-purple-100 text-purple-800'
                          : isMemberAdmin
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-[#666D80]'
                      }`}>
                        {isMemberOwner ? (
                          <>
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            Owner
                          </>
                        ) : isMemberAdmin ? (
                          <>
                            <Shield className="w-2.5 h-2.5 text-blue-600" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="w-2.5 h-2.5" />
                            Member
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Responsibility */}
                <div className="mt-2 text-xs">
                  {editingResponsibilityFor === member.id ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Managing Food & Drinks"
                        value={responsibilityText}
                        onChange={(e) => setResponsibilityText(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-[#DFE1E6] focus:outline-amber-500"
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveResponsibility(member.id)}
                          className="px-2 py-0.5 rounded-md bg-[#1A1B25] text-white text-[11px] font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingResponsibilityFor(null)}
                          className="px-2 py-0.5 rounded-md bg-gray-100 text-[#666D80] text-[11px] font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1 text-[#666D80]">
                      <span className="font-semibold truncate">
                        {member.responsibility || 'No assigned duty'}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => {
                            setEditingResponsibilityFor(member.id);
                            setResponsibilityText(member.responsibility || '');
                          }}
                          className="text-[10px] text-amber-700 hover:underline cursor-pointer shrink-0"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Role Management Controls */}
              {isOwner && !isMemberOwner && (
                <div className="mt-3 pt-2 border-t border-[#ECEFF3] flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#808897]">Role:</span>
                  {member.role === 'admin' ? (
                    <button
                      onClick={() => onUpdateMemberRole(member.id, 'member')}
                      className="text-rose-600 hover:underline cursor-pointer"
                    >
                      Demote to Member
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateMemberRole(member.id, 'admin')}
                      className="text-blue-700 hover:underline cursor-pointer"
                    >
                      Promote to Admin / Assistant
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
