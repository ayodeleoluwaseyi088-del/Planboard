import React from 'react';
import { Calendar, Clock, Flame, Check, AlertCircle } from 'lucide-react';
import { useLiveCountdown } from '../utils/dateTime';

interface PlanScheduleBadgeProps {
  dateTime?: string;
  date?: string;
  time?: string;
  hasSpecificTime?: boolean;
  showCountdown?: boolean;
  compact?: boolean;
  className?: string;
}

export const PlanScheduleBadge: React.FC<PlanScheduleBadgeProps> = ({
  dateTime,
  date,
  time,
  hasSpecificTime = true,
  showCountdown = true,
  compact = false,
  className = '',
}) => {
  const countdown = useLiveCountdown(dateTime, hasSpecificTime && Boolean(time));

  if (!dateTime && !date && !time) return null;

  const displaySchedule = date && time 
    ? `${date} · ${time}` 
    : date 
    ? date 
    : time;

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* Schedule text */}
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1A1B25] bg-[#ECEFF3] px-2 py-0.5 rounded-lg">
        <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
        <span className="truncate max-w-[200px]">{displaySchedule}</span>
      </span>

      {/* Countdown pill if dateTime exists */}
      {showCountdown && dateTime && countdown.label && (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg transition-colors ${
            countdown.status === 'started'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200/80'
              : countdown.status === 'imminent'
              ? 'bg-rose-100 text-rose-900 border border-rose-200 animate-pulse'
              : countdown.status === 'passed'
              ? 'bg-[#ECEFF3] text-[#666D80]'
              : 'bg-amber-100 text-amber-900 border border-amber-200/80'
          }`}
          title={`Underlying ISO: ${dateTime}`}
        >
          {countdown.status === 'started' ? (
            <Check className="w-2.5 h-2.5 text-emerald-700 stroke-[3]" />
          ) : countdown.status === 'imminent' ? (
            <Flame className="w-2.5 h-2.5 text-rose-600 fill-rose-500" />
          ) : (
            <Clock className="w-2.5 h-2.5 text-amber-700" />
          )}
          <span>{compact ? countdown.shortLabel : countdown.label}</span>
        </span>
      )}
    </div>
  );
};
