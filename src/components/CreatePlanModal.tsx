import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Sparkles, 
  Image, 
  Plus, 
  Trash2, 
  Crown,
  Vote,
  CheckSquare,
  Camera,
  Info
} from 'lucide-react';
import { AttachedPlan, PlanBoard, UserPersona, ImagePosition } from '../types';
import { AddPlanModal } from './AddPlanModal';
import { EditPlanModal } from './EditPlanModal';
import { ImagePickerField } from './ImagePickerField';
import { DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (newBoard: Partial<PlanBoard>) => void;
  currentPersona: UserPersona;
}

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&auto=format&fit=crop&q=80',
];

const EMOJI_OPTIONS = ['🎂', '🏖️', '🚀', '🏕️', '🥂', '🎉', '✈️', '🍕', '🎮', '⚽'];

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  onCreatePlan,
  currentPersona,
}) => {
  // Initial Board Details (Title, Description, Cover)
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎂');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(SAMPLE_COVERS[0]);
  const [coverImagePosition, setCoverImagePosition] = useState<ImagePosition>({ ...DEFAULT_IMAGE_POSITION });

  // Plans are completely optional additional items
  const [attachedPlans, setAttachedPlans] = useState<AttachedPlan[]>([]);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [editingDeciderPlan, setEditingDeciderPlan] = useState<AttachedPlan | null>(null);

  if (!isOpen) return null;

  const handleAddPlans = (newPlans: AttachedPlan[]) => {
    setAttachedPlans((prev) => {
      const seenIds = new Set(prev.map((p) => p.id));
      const seenTitles = new Set(prev.map((p) => p.title.trim().toLowerCase()));
      const uniqueNew = newPlans.filter(
        (p) => !seenIds.has(p.id) && !seenTitles.has(p.title.trim().toLowerCase())
      );
      return [...prev, ...uniqueNew];
    });
  };

  const handleRemovePlan = (planId: string) => {
    setAttachedPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  const handleSaveConfiguredPlan = (updatedPlan: AttachedPlan) => {
    setAttachedPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    setEditingDeciderPlan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const planWithDate = attachedPlans.find((p) => p.date || p.time || p.dateTime);

    onCreatePlan({
      title: title.trim(),
      emoji,
      description: description.trim() || 'A collaborative plan built by friends.',
      coverImage,
      coverImagePosition,
      plans: attachedPlans,
      date: planWithDate?.date,
      time: planWithDate?.time,
      dateTime: planWithDate?.dateTime,
      hasSpecificTime: planWithDate?.hasSpecificTime,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#ECEFF3] animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ECEFF3] flex items-center justify-between bg-[#F8F9FB]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-amber-500 text-white font-black">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1A1B25]">
                Start a New Plan Board
              </h3>
              <p className="text-xs text-[#666D80]">
                Enter initial board details, optionally add plans, and publish
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#808897] hover:text-[#1A1B25] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Section 1: Initial Board Details */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">
              Step 1: Initial Board Details
            </div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
              Board Title & Icon
            </label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-14 h-11 text-xl rounded-2xl border border-[#DFE1E6] bg-white text-center cursor-pointer focus:outline-amber-500"
                >
                  {EMOJI_OPTIONS.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="e.g. Birthday Celebration, Landmark Beach Hangout..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm rounded-2xl border border-[#DFE1E6] bg-white focus:outline-amber-500 font-bold"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
              Short Description / Vibe for the Group
            </label>
            <textarea
              rows={2}
              placeholder="What are we celebrating or doing? Share the energy!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500"
            />
          </div>

          {/* Cover Image */}
          <div>
            <ImagePickerField
              id="create-board-cover-picker"
              label="Cover Atmosphere"
              sublabel="Choose from system-provided covers or upload your own cover from device"
              value={coverImage}
              onChange={setCoverImage}
              position={coverImagePosition}
              onPositionChange={setCoverImagePosition}
              systemImages={SAMPLE_COVERS}
              aspectRatio="cover"
            />
          </div>

          {/* Section 2: Plans (Completely Optional) */}
          <div className="pt-3 border-t border-[#ECEFF3]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#1A1B25]">
                    Plans on this Board ({attachedPlans.length})
                  </label>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#F6F8FA] text-[#808897] border border-[#ECEFF3]">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-[#666D80] mt-0.5">
                  Optionally add subjects like Location, Drinks, or Music. If skipped, the Plans section remains empty.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddPlanOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1A1B25] hover:bg-[#272835] text-xs font-extrabold text-white transition cursor-pointer shadow-xs active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Plan</span>
              </button>
            </div>

            {/* Component 2: Selected Plans Container directly underneath the Add Plan button */}
            <div id="selected-plans-container">
              {attachedPlans.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setEditingDeciderPlan(plan)}
                      className="relative flex items-center gap-3 pl-3.5 pr-8 py-2.5 rounded-2xl bg-[#ECEFF3] hover:bg-[#DFE1E6] text-[#1A1B25] transition cursor-pointer select-none group shadow-2xs"
                      title={`Click to configure decider for ${plan.title}`}
                    >
                      <span className="text-lg">{plan.emoji}</span>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-black leading-tight text-[#1A1B25]">{plan.title}</span>
                        <span className="text-[10px] font-bold text-[#666D80] leading-tight mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>
                            {plan.deciderType === 'voting' && '🗳️ Voting'}
                            {plan.deciderType === 'fixed_info' && 'ℹ️ Fixed Info'}
                            {plan.deciderType === 'task_duty' && '🎯 Task / Duty'}
                            {plan.deciderType === 'photo_idea' && '📸 Photo / Idea'}
                            {plan.deciderType === 'participant_status' && '👥 Participant Status'}
                          </span>
                          {(plan.date || plan.time) && (
                            <span className="text-amber-700 font-extrabold flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.2 rounded-md">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{plan.date || plan.time}</span>
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Top-right X button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlan(plan.id);
                        }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[#808897] hover:text-[#1A1B25] hover:bg-[#C1C7CF] transition cursor-pointer z-10"
                        title={`Remove ${plan.title}`}
                        aria-label={`Remove ${plan.title}`}
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state: contains no plan content */
                <div className="min-h-0" />
              )}
            </div>
          </div>

          {/* Submit Action: Publish Board */}
          <div className="pt-3 border-t border-[#ECEFF3]">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white font-extrabold text-sm transition cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Publish Board</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Nested Add Plan Modal (Component 1 Panel) */}
        <AddPlanModal
          isOpen={isAddPlanOpen}
          onClose={() => setIsAddPlanOpen(false)}
          onAddPlans={handleAddPlans}
          existingPlanTitles={attachedPlans.map((p) => p.title)}
          currentPersona={currentPersona}
          members={[
            {
              id: currentPersona.id,
              name: currentPersona.name,
              avatar: currentPersona.avatar,
              role: 'owner',
            },
          ]}
        />

        {/* Nested Decider Configuration Modal */}
        {editingDeciderPlan && (
          <EditPlanModal
            isOpen={Boolean(editingDeciderPlan)}
            onClose={() => setEditingDeciderPlan(null)}
            onSavePlan={handleSaveConfiguredPlan}
            onRemovePlan={(planId) => {
              handleRemovePlan(planId);
              setEditingDeciderPlan(null);
            }}
            plan={editingDeciderPlan}
            currentPersona={currentPersona}
            members={[
              {
                id: currentPersona.id,
                name: currentPersona.name,
                avatar: currentPersona.avatar,
                role: 'owner',
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};
