import React from 'react';
import { CheckCircle, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface PlanReadinessProps {
  completedCount: number;
  inProgressCount: number;
  needsAttentionCount: number;
  totalEssential: number;
  filterPriority: 'all' | 'required' | 'important' | 'optional';
  onFilterChange: (p: 'all' | 'required' | 'important' | 'optional') => void;
}

export const PlanReadiness: React.FC<PlanReadinessProps> = ({
  completedCount,
  inProgressCount,
  needsAttentionCount,
  totalEssential,
  filterPriority,
  onFilterChange,
}) => {
  const percentage = Math.min(100, Math.round((completedCount / Math.max(1, totalEssential)) * 100));

  return (
    <div className="mb-6 bg-white rounded-2xl p-4 sm:p-5 border border-[#ECEFF3] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#666D80]">
              Plan Readiness
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-extrabold">
              {percentage}%
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1A1B25]">
            {completedCount}/{totalEssential} essential things ready
          </h2>
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'required', 'important', 'optional'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => onFilterChange(priority)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition cursor-pointer shrink-0 ${
                filterPriority === priority
                  ? 'bg-[#1A1B25] text-white shadow-xs'
                  : 'bg-[#F6F8FA] text-[#666D80] hover:bg-[#ECEFF3]'
              }`}
            >
              {priority === 'all' ? 'All Items' : priority}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar with multi-segment colors */}
      <div className="w-full h-3 bg-[#ECEFF3] rounded-full overflow-hidden flex mb-3">
        <div 
          className="bg-emerald-500 h-full transition-all duration-500" 
          style={{ width: `${(completedCount / Math.max(1, totalEssential + inProgressCount + needsAttentionCount)) * 100}%` }}
          title={`${completedCount} completed`}
        />
        <div 
          className="bg-amber-400 h-full transition-all duration-500" 
          style={{ width: `${(inProgressCount / Math.max(1, totalEssential + inProgressCount + needsAttentionCount)) * 100}%` }}
          title={`${inProgressCount} in progress`}
        />
        <div 
          className="bg-rose-500 h-full transition-all duration-500" 
          style={{ width: `${(needsAttentionCount / Math.max(1, totalEssential + inProgressCount + needsAttentionCount)) * 100}%` }}
          title={`${needsAttentionCount} needs attention`}
        />
      </div>

      {/* Breakdown Badges */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-bold text-[#353849]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span className="font-extrabold text-[#1A1B25]">{completedCount}</span>
          <span className="text-[#666D80]">completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span className="font-extrabold text-[#1A1B25]">{inProgressCount}</span>
          <span className="text-[#666D80]">in progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span className="font-extrabold text-[#1A1B25]">{needsAttentionCount}</span>
          <span className="text-[#666D80]">needs attention</span>
        </div>
      </div>
    </div>
  );
};
