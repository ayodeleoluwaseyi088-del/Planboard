import React, { useState } from 'react';
import { 
  Check, 
  CreditCard, 
  Search,
  CheckCircle2,
  CheckSquare,
  Plus
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
  const [searchQuery, setSearchQuery] = useState('');
  const contribution = contributions[0];
  const isPaid = contribution?.contributorsPaid.includes(currentPersona.id);

  const getMember = (id?: string) => allMembers.find((m) => m.id === id);

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const assignee = getMember(task.assigneeId);
    return (
      task.title.toLowerCase().includes(q) ||
      task.category.toLowerCase().includes(q) ||
      (assignee && assignee.name.toLowerCase().includes(q))
    );
  });

  return (
    <section id="responsibilities-section" className="scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-black text-[#1A1B25] tracking-tight leading-tight">
            Responsibilities & Money Pool
          </h2>
          <p className="text-xs sm:text-sm text-[#808897] mt-0.5">
            Who is handling what · Progress and shared costs
          </p>
        </div>

        {/* Tab switch pills matching design system */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-5 py-2 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold border border-transparent'
                : 'bg-white border border-[#DFE1E6] text-[#666D80] font-semibold hover:bg-[#F6F8FA]'
            }`}
          >
            Tasks & Volunteers ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('money')}
            className={`px-5 py-2 rounded-full text-xs transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'money'
                ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold border border-transparent'
                : 'bg-white border border-[#DFE1E6] text-[#666D80] font-semibold hover:bg-[#F6F8FA]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[#666D80]" />
            <span>Money Pool</span>
          </button>
        </div>
      </div>

      {activeTab === 'tasks' ? (
        tasks.length === 0 ? (
          <div className="w-full py-16 sm:py-24 flex flex-col items-center justify-center text-center select-none">
            <CheckSquare className="w-9 h-9 text-[#272835] stroke-[2.2] mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-[#272835] tracking-tight leading-snug mb-2">
              No tasks or duties yet
            </h3>
            <p className="text-sm sm:text-base text-[#808897] font-normal tracking-normal max-w-lg leading-relaxed">
              Create responsibilities and assign volunteers so everyone knows what they&apos;re handling
            </p>
            <button
              type="button"
              onClick={onOpenCreateItem}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-sm font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F6F8FA] shadow-[3px_4px_20px_0px_#ECEFF3]">
            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-[#808897] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks or assignees"
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-[#DFE1E6] text-xs sm:text-sm text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:border-[#808897] transition"
              />
            </div>

            {/* Tasks List */}
            <div className="divide-y divide-[#ECEFF3]">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const isAssignedToCurrent = task.assigneeId === currentPersona.id;
                const assignee = getMember(task.assigneeId);
                const isOpenToVolunteer = !task.assigneeId;

                return (
                  <div
                    key={task.id}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    {/* Left: Check status + Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          onToggleTaskComplete(task.id);
                          if (!isCompleted) {
                            confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
                          }
                        }}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition cursor-pointer ${
                          isCompleted
                            ? 'bg-[#1A1B25] border-[#1A1B25] text-white'
                            : 'border-[#C1C7CF] hover:border-[#808897] bg-white'
                        }`}
                      >
                        {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold truncate ${
                            isCompleted ? 'line-through text-[#808897]' : 'text-[#1A1B25]'
                          }`}>
                            {task.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8F9FB] border border-[#ECEFF3] text-[#666D80] shrink-0">
                            {task.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-[#808897] mt-0.5">
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span>
                                {assignee.name} {isAssignedToCurrent && '(You)'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-700 font-semibold">
                              Needs volunteer
                            </span>
                          )}
                          {task.description && (
                            <span className="hidden sm:inline text-[#808897] truncate">
                              · {task.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="shrink-0">
                      {isOpenToVolunteer ? (
                        <button
                          type="button"
                          onClick={() => {
                            onVolunteerForTask(task.id);
                            confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-300 text-amber-800 bg-white hover:bg-amber-50 text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          <span>Volunteer</span>
                        </button>
                      ) : isCompleted ? (
                        <button
                          type="button"
                          onClick={() => onToggleTaskComplete(task.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          <span>Done ✓</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleTaskComplete(task.id);
                            confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#DFE1E6] text-[#1A1B25] bg-white hover:bg-[#F8F9FB] text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="w-full py-12 flex flex-col items-center justify-center text-center select-none">
                  <Search className="w-8 h-8 text-[#272835] stroke-[2.2] mb-3" />
                  <h4 className="text-base sm:text-lg font-bold text-[#272835] tracking-tight leading-snug mb-1">
                    No tasks matching &quot;{searchQuery}&quot;
                  </h4>
                  <p className="text-xs sm:text-sm text-[#808897] font-normal max-w-sm">
                    Try searching for another task title or assignee
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* Money Contribution View */
        !contribution ? (
          <div className="w-full py-16 sm:py-24 flex flex-col items-center justify-center text-center select-none">
            <CreditCard className="w-9 h-9 text-[#272835] stroke-[2.2] mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-[#272835] tracking-tight leading-snug mb-2">
              No money pool set up
            </h3>
            <p className="text-sm sm:text-base text-[#808897] font-normal tracking-normal max-w-lg leading-relaxed">
              Create a shared expense or money pool to track collections and group contributions
            </p>
            <button
              type="button"
              onClick={onOpenCreateItem}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-sm font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Set Up Money Pool</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F6F8FA] shadow-[3px_4px_20px_0px_#ECEFF3] space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ECEFF3]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1A1B25]">
                  {contribution.title}
                </h3>
                <p className="text-xs text-[#808897] mt-0.5">
                  ₦8,500 per person · Covers cabana pass, grilled lunch & transport
                </p>
              </div>

              {/* Amount stats */}
              <div className="bg-[#F8F9FB] px-4 py-2.5 rounded-2xl border border-[#ECEFF3] text-right">
                <div className="text-xs font-semibold text-[#808897]">Total Collected</div>
                <div className="text-lg font-black text-[#1A1B25]">
                  ₦{contribution.currentAmount?.toLocaleString()} / ₦{contribution.targetAmount?.toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-[#059669]">
                  {contribution.contributorsPaid.length}/{contribution.totalContributorsNeeded} people paid
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-[#ECEFF3] rounded-full overflow-hidden">
              <div
                className="bg-[#1A1B25] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((contribution.currentAmount || 0) / (contribution.targetAmount || 1)) * 100}%`,
                }}
              />
            </div>

            {/* Roster of who paid vs remaining */}
            <div>
              <div className="text-xs font-bold text-[#666D80] uppercase tracking-wider mb-3">
                Participant Payment Roster
              </div>
              <div className="divide-y divide-[#ECEFF3]">
                {allMembers.map((member) => {
                  const hasMemberPaid = contribution.contributorsPaid.includes(member.id);
                  const isCurrent = member.id === currentPersona.id;

                  return (
                    <div
                      key={member.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[#1A1B25] truncate block">
                            {member.name} {isCurrent && '(You)'}
                          </span>
                          <span className="text-[11px] text-[#808897]">
                            ₦8,500 allocated
                          </span>
                        </div>
                      </div>

                      <div>
                        {hasMemberPaid ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#A7F3D0] text-[#059669] bg-white text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#DFE1E6] text-[#808897] bg-white text-xs font-semibold">
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User action bar */}
            <div className="pt-4 border-t border-[#ECEFF3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#666D80] font-medium">
                Your share is <strong className="text-[#1A1B25]">₦8,500</strong>. Transfer to pool or mark settled.
              </div>

              <button
                type="button"
                onClick={() => {
                  onTogglePaymentPaid(contribution.id);
                  confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
                }}
                className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5 ${
                  isPaid
                    ? 'bg-white border border-[#A7F3D0] text-[#059669]'
                    : 'bg-[#1A1B25] hover:bg-[#272835] text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isPaid ? "Marked as Paid ✓ (Undo)" : "I've Sent My ₦8,500"}</span>
              </button>
            </div>
          </div>
        )
      )}
    </section>
  );
};

