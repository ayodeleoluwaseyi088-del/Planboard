import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#666D80]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Lightweight Plan Updates</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#1A1B25]">
            Recent Activity
          </h3>
        </div>
        <span className="text-[11px] font-bold text-[#808897] bg-white px-2.5 py-1 rounded-full border border-[#ECEFF3]">
          Live planning logs
        </span>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECEFF3] shadow-xs space-y-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-center justify-between gap-3 text-xs py-1 border-b border-[#ECEFF3] last:border-b-0 last:pb-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={act.actorAvatar}
                alt={act.actorName}
                className="w-7 h-7 rounded-full object-cover border border-white shrink-0 shadow-2xs"
              />
              <div className="truncate">
                <strong className="text-[#1A1B25] font-black mr-1">{act.actorName}</strong>
                <span className="text-[#353849] font-medium">{act.actionText}</span>
              </div>
            </div>

            <span className="text-[11px] text-[#808897] font-semibold shrink-0">
              {act.timeAgo}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
