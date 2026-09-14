import React from 'react';
import { AlertCircle, Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PlanBoard } from '../types';

interface NeedsAttentionProps {
  board: PlanBoard;
  onSelectDecision: (decisionId: string) => void;
  onSelectTask: (taskId: string) => void;
  onSelectContribution: (contribId: string) => void;
}

export const NeedsAttentionSection: React.FC<NeedsAttentionProps> = ({
  board,
  onSelectDecision,
  onSelectTask,
  onSelectContribution,
}) => {
  const drinksDecision = board.decisions.find((d) => d.category.includes('DRINKS')) || board.decisions[0];
  const transportTask = board.tasks.find((t) => t.category.includes('TRANSPORTATION')) || board.tasks[1];
  const contribution = board.contributions[0];

  const totalMembers = board.members?.length || 12;

  // Calculate vote count on drinks
  const totalVotesOnDrinks = drinksDecision
    ? drinksDecision.options.reduce((acc, curr) => acc + curr.voteCount, 0)
    : 10;
  const remainingDrinksVotes = Math.max(0, totalMembers - totalVotesOnDrinks);

  // Transportation confirmed
  const transportConfirmed = 9;
  const transportRemaining = Math.max(0, totalMembers - transportConfirmed);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h3 className="text-base sm:text-lg font-black text-[#1A1B25] tracking-tight">
            Needs Attention
          </h3>
          <span className="text-xs text-[#808897] font-semibold">
            (3 items approaching deadline)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Drinks Poll */}
        {drinksDecision && (
          <div
            onClick={() => onSelectDecision(drinksDecision.id)}
            className="bg-white rounded-2xl p-4 border border-[#ECEFF3] hover:border-amber-300 transition shadow-xs cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-black text-[#353849]">
                  🥤 Drinks
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-extrabold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Closes tomorrow
                </span>
              </div>

              <div className="text-sm font-extrabold text-[#1A1B25] mb-1 group-hover:text-amber-600 transition">
                {totalVotesOnDrinks}/{totalMembers} voted
              </div>
              <p className="text-xs font-bold text-rose-600 mb-2">
                {remainingDrinksVotes} responses needed
              </p>

              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-[#ECEFF3] rounded-full overflow-hidden mb-2">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${(totalVotesOnDrinks / totalMembers) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#ECEFF3] text-[11px] font-bold text-[#666D80] group-hover:text-[#1A1B25]">
              <span>Vote or select options</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card 2: Transportation */}
        {transportTask && (
          <div
            onClick={() => onSelectTask(transportTask.id)}
            className="bg-white rounded-2xl p-4 border border-[#ECEFF3] hover:border-blue-300 transition shadow-xs cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-black text-[#353849]">
                  🚗 Transportation
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-extrabold">
                  Coaster Bus
                </span>
              </div>

              <div className="text-sm font-extrabold text-[#1A1B25] mb-1 group-hover:text-blue-600 transition">
                {transportConfirmed}/{totalMembers} confirmed
              </div>
              <p className="text-xs font-bold text-amber-600 mb-2">
                {transportRemaining} people remaining
              </p>

              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-[#ECEFF3] rounded-full overflow-hidden mb-2">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${(transportConfirmed / totalMembers) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#ECEFF3] text-[11px] font-bold text-[#666D80] group-hover:text-[#1A1B25]">
              <span>Kunle responsible</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Card 3: Contribution Pool */}
        {contribution && (
          <div
            onClick={() => onSelectContribution(contribution.id)}
            className="bg-white rounded-2xl p-4 border border-[#ECEFF3] hover:border-emerald-300 transition shadow-xs cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-black text-[#353849]">
                  💰 Contribution
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-extrabold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Due in 2 days
                </span>
              </div>

              <div className="text-sm font-extrabold text-[#1A1B25] mb-1 group-hover:text-emerald-600 transition">
                ₦{contribution.currentAmount?.toLocaleString()} / ₦{contribution.targetAmount?.toLocaleString()}
              </div>
              <p className="text-xs font-bold text-emerald-700 mb-2">
                {contribution.contributorsPaid.length}/{contribution.totalContributorsNeeded} paid
              </p>

              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-[#ECEFF3] rounded-full overflow-hidden mb-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${((contribution.currentAmount || 0) / (contribution.targetAmount || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#ECEFF3] text-[11px] font-bold text-[#666D80] group-hover:text-[#1A1B25]">
              <span>View payer roster</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
