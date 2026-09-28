import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Check,
  Copy,
  Layers
} from 'lucide-react';
import { AttachedPlan, PlanBoard, UserPersona } from '../types';
import { getPlanTruthFromBoard } from '../utils/planSync';
import { getImageStyle } from '../utils/imagePosition';
import { AddPlanModal } from './AddPlanModal';
import { EditPlanModal } from './EditPlanModal';

interface BoardPlansSectionProps {
  board: PlanBoard;
  currentPersona: UserPersona;
  onAddPlan: (plan: AttachedPlan) => void;
  onEditPlan: (plan: AttachedPlan) => void;
  onRemovePlan: (planId: string) => void;
  onSetPrimaryPlan?: (planId: string) => void;
  isAddPlanOpenExternally?: boolean;
  onCloseExternalAddPlan?: () => void;
}

export const BoardPlansSection: React.FC<BoardPlansSectionProps> = ({
  board,
  currentPersona,
  onAddPlan,
  onEditPlan,
  onRemovePlan,
  isAddPlanOpenExternally = false,
  onCloseExternalAddPlan,
}) => {
  const boardMember = (board.members || []).find(
    (m) =>
      m.id === currentPersona?.id ||
      (Boolean(m.name) &&
        Boolean(currentPersona?.name) &&
        m.name.toLowerCase() === currentPersona?.name.toLowerCase())
  );
  const resolvedRole = boardMember?.role || currentPersona?.role;
  const isOwner =
    resolvedRole === 'owner' ||
    currentPersona?.role === 'owner' ||
    (Boolean(board.ownerId) && currentPersona?.id === board.ownerId) ||
    (Boolean(board.ownerName) &&
      Boolean(currentPersona?.name) &&
      currentPersona.name.toLowerCase() === board.ownerName.toLowerCase());
  const isAdmin = resolvedRole === 'admin' || currentPersona?.role === 'admin';
  const canManagePlan = isOwner || isAdmin;
  const rawPlans = board.plans || [];
  const plans = useMemo(() => {
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const result: AttachedPlan[] = [];
    for (const plan of rawPlans) {
      const normTitle = plan.title.trim().toLowerCase();
      if (!seenIds.has(plan.id) && !seenTitles.has(normTitle)) {
        seenIds.add(plan.id);
        seenTitles.add(normTitle);
        result.push(plan);
      }
    }
    return result;
  }, [rawPlans]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AttachedPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<AttachedPlan | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const handleCopyWhatsApp = () => {
    if (plans.length === 0) return;
    const lines = [
      `*${board.title} — The Plan*`,
      ...(board.date ? [`📅 *Date:* ${board.date}`] : []),
      ...(board.time ? [`⏰ *Time:* ${board.time}`] : []),
      '',
      '*What Has Been Decided:*',
      ...plans.map((p, i) => {
        const truth = getPlanTruthFromBoard(p, board);
        return `${i + 1}. ${p.emoji} *${p.title}:* ${truth.value} (${truth.statusLabel})`;
      }),
      '',
      `👉 View and participate in decisions on Heartboard: https://heartboard.app/plan/${board.id}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // Helper to determine the badge text and styling matching reference image
  const getPlanBadge = (plan: AttachedPlan, truth: any) => {
    if (!plan.deciderType) {
      return null;
    }

    if (plan.deciderType === 'fixed_info') {
      return {
        label: 'Fixed Ground Rules',
        className: 'bg-[#E6FAF7] text-[#00A896]',
      };
    }
    if (plan.deciderType === 'task_duty') {
      if (plan.assigneeId) {
        return {
          label: 'Volunteer Assigned',
          className: 'bg-[#E6FAF7] text-[#00A896]',
        };
      }
      return {
        label: 'Looking for voluteer',
        className: 'bg-[#FFF6E9] text-[#D4901A]',
      };
    }
    if (plan.deciderType === 'photo_idea') {
      if (plan.imageUrl || truth.isConfirmed) {
        return {
          label: 'Selection Confirmed',
          className: 'bg-[#E6FAF7] text-[#00A896]',
        };
      }
      return {
        label: 'Open for vote',
        className: 'bg-[#FFF6E9] text-[#D4901A]',
      };
    }
    if (plan.deciderType === 'voting') {
      if (truth.isConfirmed || plan.status === 'confirmed') {
        return {
          label: 'Selection Confirmed',
          className: 'bg-[#E6FAF7] text-[#00A896]',
        };
      }
      return {
        label: 'Open for vote',
        className: 'bg-[#FFF6E9] text-[#D4901A]',
      };
    }
    if (plan.deciderType === 'wheel_spinner' || plan.deciderType === 'blind_pick') {
      if (truth.isConfirmed || plan.status === 'confirmed') {
        return {
          label: 'Selection Confirmed',
          className: 'bg-[#E6FAF7] text-[#00A896]',
        };
      }
      return {
        label: 'Open for vote',
        className: 'bg-[#FFF6E9] text-[#D4901A]',
      };
    }
    if (plan.deciderType === 'participant_status') {
      return {
        label: 'Selection Confirmed',
        className: 'bg-[#E6FAF7] text-[#00A896]',
      };
    }
    if (truth.isConfirmed) {
      return {
        label: 'Selection Confirmed',
        className: 'bg-[#E6FAF7] text-[#00A896]',
      };
    }
    return {
      label: truth.statusLabel || 'Open for vote',
      className: 'bg-[#FFF6E9] text-[#D4901A]',
    };
  };

  return (
    <section id="the-plan-section" className="mb-12 scroll-mt-20">
      {/* Top Action Pills: Copy Plan & Add Plan — only shown to Board Owner/Admin */}
      {canManagePlan && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-7 sm:mb-9">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="py-3 px-7 sm:px-8 rounded-full bg-[#ECEFF3] hover:bg-[#DFE1E6] text-[#1A1B25] font-bold text-sm sm:text-base transition cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center"
          >
            {copiedWhatsApp ? 'Copied Plan!' : 'Copy Plan'}
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="py-3 px-7 sm:px-8 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-sm sm:text-base transition cursor-pointer active:scale-95 shadow-xs flex items-center justify-center"
          >
            Add Plan
          </button>
        </div>
      )}

      {/* Lined Notepad Paper Card with Paperclip & Stacked Sheet Shadow */}
      <div className="isolate relative w-full max-w-lg mx-auto pb-10 sm:pb-12">
        {/* Layered sheet behind main component strictly matching reference image: peeks exclusively at lower-right and bottom */}
        <div 
          style={{
            transform: 'translate(0px, 15px) rotate(-1.7deg)',
            transformOrigin: 'top right',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 w-full h-full rounded-[32px] sm:rounded-[36px] bg-[#ECEFF3] z-0 pointer-events-none" 
        />

        {/* Wire Paperclip in Top Right Corner with offset sticking outside edge matching reference image */}
        <div className="absolute -top-4 right-5 sm:-top-5 sm:right-7 z-30 pointer-events-none select-none">
          <svg
            viewBox="0 0 42 78"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-20 sm:w-11 sm:h-[82px] text-[#A4ABB8] rotate-[38deg] drop-shadow-[1px_2px_4px_rgba(0,0,0,0.14)]"
          >
            <path
              d="M16 50 V26 A5 5 0 0 1 26 26 V62 A10 10 0 0 1 6 62 V18 A15 15 0 0 1 36 18 V54"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Main Notepad Paper with Ruled Lines & Max Height 560px */}
        <div
          style={{
            maxHeight: '560px',
            height: '560px',
            backgroundImage:
              'repeating-linear-gradient(to bottom, #FFFFFF 0px, #FFFFFF 31px, #F0F3F7 32px), linear-gradient(to right, transparent 52px, rgba(244, 63, 94, 0.2) 52px, rgba(244, 63, 94, 0.2) 53px, transparent 53px)',
            backgroundSize: '100% 32px, 100% 100%',
            boxShadow: 'inset 0 0 0 2px rgba(236, 239, 243, 0.53)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="relative z-10 bg-white rounded-[32px] sm:rounded-[36px] border-2 border-[#ECEFF3]/[0.53] px-6 sm:px-8 py-8 sm:py-9 overflow-hidden shadow-none flex flex-col max-h-[560px]"
        >

          {/* Notepad Header */}
          <div className="text-center mb-6 pt-1 shrink-0 select-none">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1B25] tracking-tight">
              The Plan
            </h2>
            <p className="text-xs sm:text-sm text-[#808897] font-normal mt-0.5">
              Finalized decisions for this event
            </p>
          </div>

          {/* Plans Display: Scrollable Content Area or Clean Image-Strict Empty State */}
          {plans.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center select-none py-10">
              <p className="text-base sm:text-lg text-[#808897] font-normal tracking-wide">
                No plans added yet
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 sm:space-y-7 pt-2 pr-1.5 -mr-1.5 scrollbar-thin">
              {plans.map((plan) => {
                const truth = getPlanTruthFromBoard(plan, board);
                const planImageUrl = truth.imageUrl || plan.imageUrl;
                const badge = getPlanBadge(plan, truth);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setViewingPlan(plan)}
                    className="flex items-start gap-3.5 sm:gap-4 transition cursor-pointer hover:opacity-90 active:scale-[0.99]"
                    title="Click to view plan details"
                  >
                    {/* Circle Avatar with Emoji */}
                    <div className="w-12 h-12 rounded-full bg-[#F4F6F9] flex items-center justify-center text-2xl shrink-0 shadow-2xs mt-0.5">
                      {plan.emoji || '📍'}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-[17px] font-bold text-[#1A1B25] leading-tight">
                        {plan.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#808897] font-normal mt-1 leading-relaxed">
                        {truth.subtext || truth.leadDetail || plan.description || truth.value || 'Finalized details for this topic.'}
                      </p>
                      {badge && (
                        <div className="mt-2.5">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Thumbnail Image if Available */}
                    {planImageUrl && (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 shadow-xs self-center ml-1">
                        <img
                          src={planImageUrl}
                          alt={plan.title}
                          style={getImageStyle(truth.imagePosition || plan.imagePosition)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Plan Modal — Only available to Board Owner/Admin */}
      {canManagePlan && (
        <AddPlanModal
          isOpen={isAddModalOpen || isAddPlanOpenExternally}
          onClose={() => {
            setIsAddModalOpen(false);
            if (onCloseExternalAddPlan) onCloseExternalAddPlan();
          }}
          onAddPlan={onAddPlan}
          existingPlanTitles={plans.map((p) => p.title)}
          currentPersona={currentPersona}
          members={board.members}
        />
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <EditPlanModal
          isOpen={Boolean(editingPlan)}
          onClose={() => setEditingPlan(null)}
          onSavePlan={onEditPlan}
          onRemovePlan={onRemovePlan}
          plan={editingPlan}
          currentPersona={currentPersona}
          members={board.members}
        />
      )}

      {/* Plan Selection — Popup View strictly matching attached reference image */}
      {viewingPlan && (() => {
        const truth = getPlanTruthFromBoard(viewingPlan, board);
        const planImageUrl = truth.imageUrl || viewingPlan.imageUrl;
        const badge = getPlanBadge(viewingPlan, truth);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setViewingPlan(null)}
          >
            <div
              className="bg-white w-full max-w-[390px] sm:max-w-[420px] rounded-[36px] sm:rounded-[40px] p-6 sm:p-7 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card Header: Circle Avatar with emoji, Plan Title, and Status Badge Pill */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#F6F8FA] flex items-center justify-center shrink-0 text-2xl">
                    {viewingPlan.emoji || '📍'}
                  </div>
                  <h3 className="text-xl sm:text-[22px] font-bold text-[#1A1B25] tracking-tight truncate">
                    {viewingPlan.title}
                  </h3>
                </div>

                {badge && (
                  <span className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shrink-0 whitespace-nowrap ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>

              {/* The Decided Container: Filled Gray Box */}
              <div className="p-5 sm:p-6 rounded-[28px] bg-[#F8F9FA] space-y-2">
                <p className="text-sm sm:text-base text-[#808897] font-normal leading-normal">
                  What has been decided
                </p>

                <h4 className="text-xl sm:text-[22px] font-bold text-[#1A1B25] tracking-tight leading-snug">
                  {truth.value || viewingPlan.title}
                </h4>

                <p className="text-xs sm:text-sm text-[#353849] font-normal leading-normal">
                  {truth.leadDetail || truth.subtext || (planImageUrl ? '1 deal submitted' : '0 of 4 participants selected · 1 card per person')}
                </p>

                {/* Attached Image if available */}
                {planImageUrl && (
                  <div className="mt-3.5 rounded-[22px] overflow-hidden relative w-full aspect-[16/10] sm:h-44">
                    <img
                      src={planImageUrl}
                      alt={truth.value || viewingPlan.title}
                      style={getImageStyle(truth.imagePosition || viewingPlan.imagePosition)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold">
                      Selected Visual
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Edit and Delete (Admin/Owner view only; hidden completely for regular Members) */}
              {canManagePlan && (
                <div className="flex items-center gap-3.5 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      const planToEdit = viewingPlan;
                      setViewingPlan(null);
                      setEditingPlan(planToEdit);
                    }}
                    className="flex-1 py-4 rounded-full bg-[#ECEFF3] hover:bg-[#DFE1E6] text-[#1A1B25] font-bold text-base transition cursor-pointer text-center active:scale-[0.98]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onRemovePlan(viewingPlan.id);
                      setViewingPlan(null);
                    }}
                    className="flex-1 py-4 rounded-full bg-[#FEECEC] hover:bg-[#FDD8D8] text-[#E05252] font-bold text-base transition cursor-pointer text-center active:scale-[0.98]"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </section>
  );
};
