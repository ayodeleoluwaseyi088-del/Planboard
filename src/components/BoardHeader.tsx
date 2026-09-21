import React, { useState } from 'react';
import { 
  Plus, 
  Move, 
  X, 
  Check, 
  RotateCcw,
  Timer
} from 'lucide-react';
import { PlanBoard, UserPersona, ImagePosition } from '../types';
import { getImageStyle, DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';
import { useLiveCountdown } from '../utils/dateTime';
import { ImageFramePositioner } from './ImageFramePositioner';

interface BoardHeaderProps {
  board: PlanBoard;
  currentPersona: UserPersona;
  onOpenShare: () => void;
  onOpenPeople: () => void;
  onOpenCreateItem: () => void;
  onOpenAddPlan?: () => void;
  onUpdateCoverPosition?: (position: ImagePosition) => void;
  activeEvolutionDay?: 'day1' | 'day3' | 'day5';
  onSelectEvolutionDay?: (day: 'day1' | 'day3' | 'day5') => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  currentPersona,
  onOpenPeople,
  onOpenCreateItem,
  onOpenAddPlan,
  onUpdateCoverPosition,
}) => {
  const [isRepositioningCover, setIsRepositioningCover] = useState(false);
  const [tempPosition, setTempPosition] = useState<ImagePosition>(
    board.coverImagePosition || { ...DEFAULT_IMAGE_POSITION }
  );

  // Permissions: Add Plan and Cover Image Adjustment are creator/admin-only features
  // Show these controls only to the Board Creator and Admins.
  // Hide them completely from regular Members.
  const boardMember = (board.members || []).find(
    (m) => m.id === currentPersona?.id || (Boolean(m.name) && Boolean(currentPersona?.name) && m.name.toLowerCase() === currentPersona?.name.toLowerCase())
  );
  const resolvedRole = boardMember?.role || currentPersona?.role;
  const isCreatorOrAdmin = 
    resolvedRole === 'owner' || 
    resolvedRole === 'admin' ||
    (Boolean(board.ownerId) && currentPersona?.id === board.ownerId) ||
    (Boolean(board.ownerName) && Boolean(currentPersona?.name) && currentPersona?.name.toLowerCase() === board.ownerName.toLowerCase()) ||
    Boolean(board.members?.some(
      (m) => (m.id === currentPersona?.id || (Boolean(m.name) && Boolean(currentPersona?.name) && m.name.toLowerCase() === currentPersona?.name.toLowerCase())) && (m.role === 'owner' || m.role === 'admin')
    ));

  // Check if any attached plan specifies a date/time (or fallback to board's explicit plan-synced values)
  const scheduledPlan = (board.plans || []).find((p) => p.isPrimary && (p.date || p.time || p.dateTime))
    || (board.plans || []).find((p) => p.date || p.time || p.dateTime);

  const rawDate = scheduledPlan?.date || board.date;
  const rawTime = scheduledPlan?.time || board.time;
  const activeDateTime = scheduledPlan?.dateTime || board.dateTime;

  // Determine if specific time was added (no invented time if only date was selected)
  const isTimeExplicitlySpecified = scheduledPlan?.hasSpecificTime !== undefined
    ? scheduledPlan.hasSpecificTime
    : (board.hasSpecificTime !== undefined ? board.hasSpecificTime : Boolean(rawTime));

  const hasActualDate = Boolean(rawDate || activeDateTime);
  const hasActualTime = Boolean(rawTime && isTimeExplicitlySpecified);
  const hasBothDateAndTime = hasActualDate && hasActualTime;

  // Format date strictly from Plan data, without static placeholder
  const formattedDate = (() => {
    if (!hasActualDate) return null;
    if (rawDate) {
      if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
          }
        } catch {
          // ignore
        }
      }
      return rawDate;
    }
    if (activeDateTime) {
      try {
        const d = new Date(activeDateTime);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        }
      } catch {
        // ignore
      }
    }
    return null;
  })();

  // Format time strictly from Plan data; if only date exists, do NOT invent a time
  const formattedTime = (() => {
    if (!hasActualTime) return null;
    if (rawTime) {
      return rawTime;
    }
    if (activeDateTime) {
      try {
        const d = new Date(activeDateTime);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
      } catch {
        // ignore
      }
    }
    return null;
  })();

  // Resolve ISO string for live countdown when both date and time exist
  const resolvedIso = (() => {
    if (!hasBothDateAndTime) return undefined;
    if (activeDateTime) {
      const d = new Date(activeDateTime);
      if (!isNaN(d.getTime())) return activeDateTime;
    }
    if (rawDate && rawTime) {
      try {
        const d = new Date(`${rawDate} ${rawTime}`);
        if (!isNaN(d.getTime())) return d.toISOString();
      } catch {
        // ignore
      }
    }
    return undefined;
  })();

  const countdown = useLiveCountdown(resolvedIso, hasBothDateAndTime);

  return (
    <div className="relative mb-6 rounded-3xl sm:rounded-[32px] overflow-hidden bg-[#1A1B25] shadow-xs">
      {/* Cover Banner */}
      <div className="relative h-80 sm:h-96 md:h-[460px] w-full overflow-hidden">
        <img 
          src={board.coverImage} 
          alt={board.title} 
          style={getImageStyle(board.coverImagePosition)}
          className="w-full h-full object-cover select-none transition-transform duration-500"
        />
        {/* Ambient Dark Gradient for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20 pointer-events-none" />

        {/* Top Actions: + Add Plan (Left) and Cover (Right) - Shown only to Creator and Admins */}
        {isCreatorOrAdmin && (
          <div className="absolute top-4 sm:top-5 left-4 sm:left-5 right-4 sm:right-5 flex items-center justify-between z-10">
            {/* Add Plan Button */}
            <button
              type="button"
              onClick={onOpenAddPlan || onOpenCreateItem}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs sm:text-sm font-bold backdrop-blur-xs shadow-md transition cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Plan</span>
            </button>

            {/* Cover Settings Button */}
            <button
              type="button"
              onClick={() => {
                setTempPosition(board.coverImagePosition || { ...DEFAULT_IMAGE_POSITION });
                setIsRepositioningCover(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#1A1B25] text-xs sm:text-sm font-bold backdrop-blur-xs shadow-md transition cursor-pointer active:scale-95"
              title="Cover settings"
            >
              <Move className="w-3.5 h-3.5 text-[#1A1B25]" />
              <span>Cover</span>
            </button>
          </div>
        )}

        {/* Centered Bottom Hero Content */}
        <div className="absolute bottom-6 sm:bottom-8 left-4 right-4 flex flex-col items-center text-center z-10">
          {/* Emoji & Title */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl sm:text-3xl">{board.emoji || '💵'}</span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
              {board.title}
            </h1>
          </div>

          {/* Avatars + People planning together */}
          <button
            type="button"
            onClick={onOpenPeople}
            className="flex items-center justify-center gap-2 mb-1 text-white text-xs sm:text-sm font-medium hover:opacity-90 transition cursor-pointer"
            title="View participants"
          >
            <div className="flex items-center -space-x-1.5">
              {(board.members && board.members.length > 0 ? board.members.slice(0, 3) : []).map((member) => (
                <img
                  key={member.id}
                  src={member.avatar}
                  alt={member.name}
                  className="w-5 h-5 rounded-full border border-black/40 object-cover"
                />
              ))}
            </div>
            <span>{(board.members && board.members.length) || 3} people planing together</span>
          </button>

          {/* Owner */}
          <div className="text-white/80 text-xs sm:text-sm font-normal mb-2.5">
            Owner: {board.ownerName || 'Johny Brown'}
          </div>

          {/* Date & Time / Countdown section - Shown ONLY when user adds date and/or time to a Board Plan */}
          {(formattedDate || formattedTime) && (
            <div className="flex items-center justify-center flex-wrap gap-2">
              {formattedDate && (
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold">
                  {formattedDate}
                </span>
              )}
              {formattedTime && (
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold">
                  {formattedTime}
                </span>
              )}
              {hasBothDateAndTime && countdown.isValid && (
                <span 
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-xs font-semibold ${
                    countdown.isPast 
                      ? 'text-emerald-300' 
                      : countdown.isImminent 
                      ? 'text-rose-300 animate-pulse' 
                      : 'text-amber-300'
                  }`}
                  title={resolvedIso ? `Scheduled timestamp: ${resolvedIso}` : undefined}
                >
                  <Timer className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>{countdown.label}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reposition Cover Modal */}
      {isRepositioningCover && isCreatorOrAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#DFE1E6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEFF3]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Move className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1A1B25]">Reposition Cover Image</h3>
                  <p className="text-xs text-[#666D80]">Drag image to adjust framing or use zoom controls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRepositioningCover(false)}
                className="p-1.5 rounded-xl text-[#808897] hover:bg-[#F6F8FA] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ImageFramePositioner
              imageUrl={board.coverImage}
              position={tempPosition}
              onChange={setTempPosition}
              aspectRatio="banner"
              containerClassName="h-56 sm:h-64 rounded-2xl overflow-hidden"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#ECEFF3]">
              <button
                type="button"
                onClick={() => setTempPosition({ ...DEFAULT_IMAGE_POSITION })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#666D80] hover:bg-[#F6F8FA] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Center</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRepositioningCover(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#666D80] hover:bg-[#F6F8FA] border border-[#DFE1E6] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateCoverPosition) {
                      onUpdateCoverPosition(tempPosition);
                    }
                    setIsRepositioningCover(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-[#1A1B25] hover:bg-black transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Position</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
