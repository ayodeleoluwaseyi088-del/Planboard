import React from 'react';
import { Clock } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <section id="activity-feed-section" className="scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-black text-[#1A1B25] tracking-tight leading-tight">
            Recent Activity
          </h2>
          <p className="text-xs sm:text-sm text-[#808897] mt-0.5">
            Live planning logs from participants
          </p>
        </div>
      </div>

      {/* Main Activity Content */}
      {activities.length === 0 ? (
        <div className="w-full py-16 sm:py-24 flex flex-col items-center justify-center text-center select-none">
          <Clock className="w-9 h-9 text-[#272835] stroke-[2.2] mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#272835] tracking-tight leading-snug mb-2">
            No recent activity yet
          </h3>
          <p className="text-sm sm:text-base text-[#808897] font-normal tracking-normal max-w-lg leading-relaxed">
            Live planning updates and participant interactions will appear here in chronological order
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F6F8FA] shadow-[3px_4px_20px_0px_#ECEFF3] divide-y divide-[#ECEFF3]">
          {activities.map((act) => (
            <div
              key={act.id}
              className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={act.actorAvatar}
                  alt={act.actorName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="truncate">
                  <span className="text-[#1A1B25] font-bold mr-1.5">{act.actorName}</span>
                  <span className="text-[#666D80]">{act.actionText}</span>
                </div>
              </div>

              <span className="text-[11px] text-[#808897] font-semibold shrink-0">
                {act.timeAgo}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};


