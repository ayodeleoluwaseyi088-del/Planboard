import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  CreditCard, 
  Plus, 
  Sparkles, 
  HandMetal, 
  ShieldCheck,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskItem, ContributionItem, UserPersona, BoardMember } from '../types';

interface ContributionsSectionProps {
  tasks: TaskItem[];
  contributions: ContributionItem[];
  currentPersona: UserPersona;
  allMembers: BoardMember[];
  onToggleTaskComplete: (taskId: string) => void;
  onVolunteerForTask: (taskId: string) => void;
  onTogglePaymentPaid: (contribId: string) => void;
  onOpenCreateItem: () => void;
}

export const ContributionsSection: React.FC<ContributionsSectionProps> = ({
  tasks,
  contributions,
  currentPersona,
  allMembers,
  onToggleTaskComplete,
  onVolunteerForTask,
  onTogglePaymentPaid,
  onOpenCreateItem,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'money'>('tasks');
  const contribution = contributions[0];
  const isPaid = contribution?.contributorsPaid.includes(currentPersona.id);

  const getMember = (id?: string) => allMembers.find((m) => m.id === id);

  return (
    <section id="responsibilities-section" className="mb-8 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600">
            <Award className="w-3.5 h-3.5" />
            <span>Accountability & Contributions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
            Responsibilities & Money Pool
          </h2>
          <p className="text-xs text-[#666D80]">
            Who is handling what · Progress and shared costs
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-[#ECEFF3] p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'tasks' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-[#666D80] hover:text-[#1A1B25]'
            }`}
          >
            Tasks & Volunteers ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('money')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'money' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-[#666D80] hover:text-[#1A1B25]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Money Pool</span>
          </button>
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isAssignedToCurrent = task.assigneeId === currentPersona.id;
            const assignee = getMember(task.assigneeId);
            const isOpenToVolunteer = !task.assigneeId;

            return (
              <div
                key={task.id}
                className={`rounded-2xl p-4 border transition shadow-xs flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isOpenToVolunteer
                    ? 'bg-amber-50/30 border-dashed border-amber-300'
                    : 'bg-white border-[#ECEFF3] hover:border-blue-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#808897]">
                      {task.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isCompleted 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : isOpenToVolunteer 
                        ? 'bg-amber-100 text-amber-900' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {isCompleted ? 'Completed ✓' : isOpenToVolunteer ? 'Needs Volunteer' : 'In Progress'}
                    </span>
                  </div>

                  <h3 className={`text-sm font-extrabold text-[#1A1B25] mb-1 ${isCompleted ? 'line-through text-[#666D80]' : ''}`}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-[#666D80] mb-3 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Bottom Assignee & Action */}
                <div className="pt-3 border-t border-[#ECEFF3] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {assignee ? (
                      <>
                        <img
                          src={assignee.avatar}
                          alt={assignee.name}
                          className="w-6 h-6 rounded-full object-cover border border-white shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-[#1A1B25] truncate">
                            {assignee.name} {isAssignedToCurrent && '(You)'}
                          </div>
                          <div className="text-[10px] text-[#808897] font-semibold">
                            Responsible
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-amber-700">
                        Unclaimed
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {isOpenToVolunteer ? (
                    <button
                      onClick={() => {
                        onVolunteerForTask(task.id);
                        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                    >
                      <HandMetal className="w-3.5 h-3.5" />
                      <span>I'll Handle This</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onToggleTaskComplete(task.id);
                        if (!isCompleted) {
                          confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-[#DFE1E6] hover:bg-emerald-50 text-[#353849]'
                      }`}
                    >
                      {isCompleted ? 'Done ✓' : 'Mark Done'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Money Contribution View */
        contribution && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECEFF3] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#808897]">
                  Pooled Group Expenses
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
                  {contribution.title}
                </h3>
                <p className="text-xs text-[#666D80] mt-0.5">
                  ₦8,500 per person · Covers Landmark cabana pass, grilled lunch & bus fuel
                </p>
              </div>

              {/* Amount stats */}
              <div className="bg-[#F8F9FB] px-4 py-3 rounded-2xl border border-[#ECEFF3] text-right sm:text-right">
                <div className="text-xs font-bold text-[#808897]">Total Collected</div>
                <div className="text-xl font-black text-[#1A1B25]">
                  ₦{contribution.currentAmount?.toLocaleString()} / ₦{contribution.targetAmount?.toLocaleString()}
                </div>
                <div className="text-xs font-extrabold text-emerald-700">
                  {contribution.contributorsPaid.length}/{contribution.totalContributorsNeeded} people paid (75%)
                </div>
              </div>
            </div>

            {/* Big progress bar */}
            <div className="w-full h-3 bg-[#ECEFF3] rounded-full overflow-hidden mb-6">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((contribution.currentAmount || 0) / (contribution.targetAmount || 1)) * 100}%`,
                }}
              />
            </div>

            {/* Roster of who paid vs remaining */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#353849] mb-3">
                Participant Payment Roster
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {allMembers.map((member) => {
                  const hasMemberPaid = contribution.contributorsPaid.includes(member.id);
                  const isCurrent = member.id === currentPersona.id;

                  return (
                    <div
                      key={member.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                        hasMemberPaid
                          ? 'bg-emerald-50/50 border-emerald-200 text-[#1A1B25]'
                          : 'bg-[#F8F9FB] border-[#ECEFF3] text-[#808897]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-6 h-6 rounded-full object-cover border border-white"
                        />
                        <span className="font-bold truncate">
                          {member.name} {isCurrent && '(You)'}
                        </span>
                      </div>

                      {hasMemberPaid ? (
                        <span className="text-[11px] font-black text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Paid
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User action bar */}
            <div className="pt-4 border-t border-[#ECEFF3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#666D80] font-semibold">
                Your share is <strong className="text-[#1A1B25]">₦8,500</strong>. Transfer to Seyi's pool or mark as settled.
              </div>

              <button
                onClick={() => {
                  onTogglePaymentPaid(contribution.id);
                  confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5 ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isPaid ? "You're marked as Paid ✓ (Undo)" : "I've Sent My ₦8,500"}</span>
              </button>
            </div>
          </div>
        )
      )}
    </section>
  );
};
