import React, { useState } from 'react';
import { 
  Plus, 
  Move, 
  X, 
  Check, 
  Timer,
  ArrowLeft
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

  // Only use explicit board-level event schedule, NOT individual decision deadlines
  const rawDate = board.date;
  const rawTime = board.time;
  const activeDateTime = board.dateTime;

  // Determine if specific time was added on the board itself
  const isTimeExplicitlySpecified = board.hasSpecificTime !== undefined 
    ? board.hasSpecificTime 
    : Boolean(rawTime);

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
      <div className="relative h-[560px] sm:h-96 md:h-[460px] w-full overflow-hidden">
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
          <div className="bg-white rounded-3xl sm:rounded-[32px] max-w-xl w-full overflow-hidden shadow-2xl border border-[#DFE1E6] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#ECEFF3]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRepositioningCover(false)}
                  className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] flex items-center justify-center text-[#353849] hover:text-[#1A1B25] transition shrink-0 cursor-pointer"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5 text-[#353849]" />
                </button>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1A1B25] leading-tight">Reposition Cover Image</h3>
                  <p className="text-xs text-[#808897] mt-0.5">Drag image to adjust framing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRepositioningCover(false)}
                className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] flex items-center justify-center text-[#808897] hover:text-[#1A1B25] transition shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Body */}
            <div className="p-5 sm:p-6 bg-white">
              <ImageFramePositioner
                imageUrl={board.coverImage}
                position={tempPosition}
                onChange={setTempPosition}
                frameHeight="aspect-[4/3] sm:aspect-[16/11] w-full max-h-[380px]"
                showControls={false}
                hideCoordinates={true}
                hideBottomHint={true}
                promptText="Drag to reposition"
                className="rounded-2xl overflow-hidden shadow-xs"
              />
            </div>

            {/* Footer */}
            <div className="p-5 sm:p-6 bg-[#F8F9FB] border-t border-[#ECEFF3]">
              <button
                type="button"
                onClick={() => {
                  if (onUpdateCoverPosition) {
                    onUpdateCoverPosition(tempPosition);
                  }
                  setIsRepositioningCover(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-full bg-[#1A1B25] hover:bg-black text-white text-sm sm:text-base font-bold shadow-xs transition active:scale-[0.99] cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save position</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
