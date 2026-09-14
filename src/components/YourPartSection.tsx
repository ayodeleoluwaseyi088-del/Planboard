import React from 'react';
import { 
  Vote, 
  CheckCircle2, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Award,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserPersona, DecisionItem, TaskItem, ContributionItem } from '../types';

interface YourPartSectionProps {
  currentPersona: UserPersona;
  pendingDecisions: DecisionItem[];
  userResponsibilities: TaskItem[];
  userContribution?: ContributionItem;
  onQuickVote: (decisionId: string, optionId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onTogglePaymentPaid: (contributionId: string) => void;
  onScrollToSection: (sectionId: string) => void;
}

export const YourPartSection: React.FC<YourPartSectionProps> = ({
  currentPersona,
  pendingDecisions,
  userResponsibilities,
  userContribution,
  onQuickVote,
  onToggleTaskComplete,
  onTogglePaymentPaid,
  onScrollToSection,
}) => {
  const isPaid = userContribution?.contributorsPaid.includes(currentPersona.id);
  const incompleteTasks = userResponsibilities.filter((t) => t.status !== 'completed');
  const allCaughtUp = pendingDecisions.length === 0 && incompleteTasks.length === 0 && isPaid;

  const triggerCelebrate = () => {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#F59E0B', '#10B981', '#6366F1'],
    });
  };

  return (
    <section className="mb-8 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent rounded-3xl p-4 sm:p-6 border border-amber-200/60 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
            👋
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Personalized Focus
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
              YOUR PART
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-bold text-[#353849] border border-amber-200 shadow-xs">
          <span>{currentPersona.name}</span>
          <span className="text-[11px] text-[#808897] capitalize">({currentPersona.role})</span>
        </div>
      </div>

      {allCaughtUp ? (
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 text-center flex flex-col items-center justify-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-base font-extrabold text-[#1A1B25]">You're completely caught up! 🎉</h3>
          <p className="text-xs text-[#666D80] max-w-md mt-1 mb-3">
            All your votes are cast, your assigned duties are handled, and your contribution is recorded.
          </p>
          <button
            onClick={() => onScrollToSection('the-plan-section')}
            className="px-4 py-2 rounded-xl bg-[#1A1B25] text-white text-xs font-bold hover:bg-[#272835] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>View The Group's Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Votes Waiting */}
          <div className="bg-white rounded-2xl p-4 border border-[#ECEFF3] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-black text-[#808897] uppercase tracking-wider flex items-center gap-1">
                  <Vote className="w-3.5 h-3.5 text-rose-500" />
                  Voting
                </span>
                {pendingDecisions.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black">
                    {pendingDecisions.length} waiting
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black">
                    Done ✓
                  </span>
                )}
              </div>

              {pendingDecisions.length > 0 ? (
                <div>
                  <h3 className="text-sm font-black text-[#1A1B25] leading-tight mb-1">
                    {pendingDecisions[0].category}: {pendingDecisions[0].title}
                  </h3>
                  <p className="text-xs text-[#666D80] mb-3">
                    {pendingDecisions[0].question}
                  </p>

                  {/* Quick vote options */}
                  <div className="space-y-1.5 mb-2">
                    {pendingDecisions[0].options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onQuickVote(pendingDecisions[0].id, opt.id);
                          triggerCelebrate();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl bg-[#F8F9FB] hover:bg-amber-100 text-xs font-bold text-[#272835] transition flex items-center justify-between border border-[#ECEFF3] hover:border-amber-300 cursor-pointer group"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </span>
                        <span className="text-[11px] text-[#808897] group-hover:text-amber-800">
                          Vote
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-emerald-700 font-bold">No active polls need your vote!</p>
                </div>
              )}
            </div>

            {pendingDecisions.length > 1 && (
              <button
                onClick={() => onScrollToSection('decisions-section')}
                className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1 mt-2 cursor-pointer"
              >
                <span>+{pendingDecisions.length - 1} more decisions</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Card 2: Responsibilities */}
          <div className="bg-white rounded-2xl p-4 border border-[#ECEFF3] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-black text-[#808897] uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blue-500" />
                  Responsibility
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  incompleteTasks.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {userResponsibilities.length} assigned
                </span>
              </div>

              {userResponsibilities.length > 0 ? (
                <div className="space-y-2 mb-2">
                  {userResponsibilities.map((task) => (
                    <div 
                      key={task.id}
                      className={`p-2.5 rounded-xl border transition ${
                        task.status === 'completed'
                          ? 'bg-emerald-50/50 border-emerald-200 text-[#666D80]'
                          : 'bg-[#F8F9FB] border-[#ECEFF3] text-[#1A1B25]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-[#808897] uppercase tracking-wider">
                            {task.category}
                          </div>
                          <div className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-[#808897]' : ''}`}>
                            {task.title}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onToggleTaskComplete(task.id);
                            triggerCelebrate();
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                            task.status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-[#DFE1E6] hover:bg-emerald-50 text-[#353849]'
                          }`}
                        >
                          {task.status === 'completed' ? 'Done ✓' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-[#666D80]">You don't have assigned responsibilities yet.</p>
                  <button
                    onClick={() => onScrollToSection('responsibilities-section')}
                    className="mt-2 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    Volunteer for a task
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onScrollToSection('responsibilities-section')}
              className="text-[11px] font-bold text-[#666D80] hover:text-[#1A1B25] flex items-center gap-1 mt-2 cursor-pointer"
            >
              <span>View all volunteer tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 3: Contribution / Payment */}
          <div className="bg-white rounded-2xl p-4 border border-[#ECEFF3] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-black text-[#808897] uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  Contribution
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isPaid ? 'Paid ✓' : 'Pending'}
                </span>
              </div>

              {userContribution && (
                <div>
                  <h3 className="text-sm font-black text-[#1A1B25] leading-tight mb-1">
                    {userContribution.title}
                  </h3>
                  <p className="text-xs text-[#666D80] mb-3">
                    ₦8,500 share · Due in 2 days
                  </p>

                  <div className="bg-[#F8F9FB] rounded-xl p-3 border border-[#ECEFF3] mb-3">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-[#666D80]">Group Progress:</span>
                      <span className="text-[#1A1B25]">
                        {userContribution.contributorsPaid.length}/{userContribution.totalContributorsNeeded} paid
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#ECEFF3] rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{
                          width: `${(userContribution.contributorsPaid.length / userContribution.totalContributorsNeeded) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (userContribution) {
                        onTogglePaymentPaid(userContribution.id);
                        triggerCelebrate();
                      }
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isPaid ? 'Marked as Sent ✓ (Undo)' : "I've Sent My ₦8,500"}</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onScrollToSection('contributions-section')}
              className="text-[11px] font-bold text-[#666D80] hover:text-[#1A1B25] flex items-center gap-1 mt-2 cursor-pointer"
            >
              <span>See payment breakdown</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
