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
  const isOwner = currentPersona.role === 'owner';
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

  return (
    <section id="the-plan-section" className="mb-8 scroll-mt-20">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-black text-[#1A1B25] tracking-tight leading-tight">
            The Plan
          </h2>
          <p className="text-sm sm:text-[15px] text-[#808897] mt-1 font-normal leading-normal">
            Finalized decisions for this event
          </p>
        </div>

        {/* Top Actions: Copy and Add Plan circular icon buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            title={copiedWhatsApp ? 'Copied to clipboard!' : 'Copy plan summary'}
            aria-label="Copy plan summary"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#272835] flex items-center justify-center transition cursor-pointer active:scale-95"
          >
            {copiedWhatsApp ? (
              <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Copy className="w-5 h-5 text-[#272835]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            title="Add Plan"
            aria-label="Add Plan"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Plans Display: Strictly Empty State matching Visual Suggestions design */}
      {plans.length === 0 ? (
        <div className="w-full py-16 sm:py-24 flex flex-col items-center justify-center text-center select-none">
          <Layers className="w-9 h-9 text-[#272835] stroke-[2.2] mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#272835] tracking-tight leading-snug mb-2">
            No plans added yet
          </h3>
          <p className="text-sm sm:text-base text-[#808897] font-normal tracking-normal max-w-lg leading-relaxed">
            {isOwner ? (
              <>Plans represent what has been decided on this board. Add a plan subject (Restaurant, Location, Transportation, etc.) to get started.</>
            ) : (
              <>The board creator hasn&apos;t added any plans to this board yet.</>
            )}
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-sm font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Plan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const truth = getPlanTruthFromBoard(plan, board);
            const planImageUrl = truth.imageUrl || plan.imageUrl;

            return (
              <div
                key={plan.id}
                style={{
                  boxShadow: '3px 4px 20px 0px #ECEFF3',
                }}
                className="bg-white rounded-[28px] p-6 border border-[#F6F8FA] flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Circle Avatar with emoji, Plan Title, and Active Choice Pill */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#F6F8FA] flex items-center justify-center shrink-0 text-2xl">
                        {plan.emoji || '📍'}
                      </div>
                      <h4 className="text-xl sm:text-[22px] font-bold text-[#1A1B25] tracking-tight truncate">
                        {plan.title}
                      </h4>
                    </div>

                    <span className="px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#FFF9EE] text-[#D9822B] text-xs sm:text-sm font-semibold shrink-0 whitespace-nowrap">
                      Active Choice
                    </span>
                  </div>

                  {/* The Decided Container: Filled Gray Box */}
                  <div className="p-5 sm:p-6 rounded-[22px] bg-[#F8F9FA]">
                    <p className="text-base text-[#808897] font-normal leading-normal">
                      What has been decided
                    </p>

                    <h3 className="text-xl sm:text-[22px] font-bold text-[#1A1B25] mt-1 tracking-tight leading-snug">
                      {truth.value || plan.title}
                    </h3>

                    <p className="text-sm sm:text-[15px] text-[#353849] font-normal mt-2.5 leading-normal">
                      {truth.leadDetail || truth.subtext || (planImageUrl ? '1 deal submitted' : '0 of 4 participants selected · 1 card per person')}
                    </p>

                    {/* Image if included (Image 1 & Image 2) */}
                    {planImageUrl && (
                      <div className="mt-3.5 rounded-[18px] overflow-hidden relative w-full aspect-[16/9] sm:h-44">
                        <img
                          src={planImageUrl}
                          alt={truth.value}
                          style={getImageStyle(truth.imagePosition || plan.imagePosition)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold">
                          Selected Visual
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner Actions: Edit & Delete text links (Owner view only - Image 1) */}
                {isOwner && (
                  <div className="flex items-center gap-4 mt-4 px-1">
                    <button
                      type="button"
                      onClick={() => setEditingPlan(plan)}
                      className="text-sm font-medium text-[#808897] hover:text-[#1A1B25] underline cursor-pointer transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePlan(plan.id)}
                      className="text-sm font-medium text-[#808897] hover:text-[#1A1B25] underline cursor-pointer transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Plan Modal */}
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
    </section>
  );
};
