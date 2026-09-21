import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Plus, 
  ChevronDown,
  Check,
  Move
} from 'lucide-react';
import { AttachedPlan, PlanBoard, UserPersona, ImagePosition } from '../types';
import { AddPlanModal } from './AddPlanModal';
import { EditPlanModal } from './EditPlanModal';
import { BoardIdentityStep } from './BoardIdentityStep';
import { BOARD_AVATARS } from '../utils/boardAvatars';
import { DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';
import { SetCoverImageSection, COVER_PRESETS } from './SetCoverImageSection';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (newBoard: Partial<PlanBoard>) => void;
  currentPersona: UserPersona;
}

const SAMPLE_COVERS = COVER_PRESETS;

const EMOJI_OPTIONS = [
  '💵', '🎂', '🏖️', '🚀', '🏕️', '🥂', '🎉', '✈️', '🍕', '🎮', '⚽', 
  '🍹', '🌴', '🎁', '🍣', '💃', '🍿', '🎸', '🏀', '⛵', '💍', '☕',
  '🎟️', '🏎️', '🎳', '🎯', '🎨', '🎡', '🌟', '🌮'
];

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  onCreatePlan,
  currentPersona,
}) => {
  // Board Details
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('💵');
  const [description, setDescription] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Accordion open/close state
  const [openSections, setOpenSections] = useState<{
    plans: boolean;
    cover: boolean;
    profile: boolean;
  }>({
    plans: false,
    cover: false,
    profile: false,
  });

  // Section 1: Attached Plans
  const [attachedPlans, setAttachedPlans] = useState<AttachedPlan[]>([]);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [editingDeciderPlan, setEditingDeciderPlan] = useState<AttachedPlan | null>(null);

  // Section 2: Cover Image
  const [coverImage, setCoverImage] = useState(SAMPLE_COVERS[0]);
  const [coverImagePosition, setCoverImagePosition] = useState<ImagePosition>({ ...DEFAULT_IMAGE_POSITION });

  // Section 3: Board Identity (Name & Avatar)
  const [useCustomName, setUseCustomName] = useState(false);
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(
    BOARD_AVATARS[0]?.url || currentPersona.avatar
  );

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setEmoji('💵');
      setDescription('');
      setIsEmojiPickerOpen(false);
      setOpenSections({
        plans: false,
        cover: false,
        profile: false,
      });
      setCoverImage(SAMPLE_COVERS[0]);
      setCoverImagePosition({ ...DEFAULT_IMAGE_POSITION });
      setUseCustomName(false);
      setCustomDisplayName('');
      setSelectedAvatar(BOARD_AVATARS[0]?.url || currentPersona.avatar);
      setAttachedPlans([]);
      setIsAddPlanOpen(false);
      setEditingDeciderPlan(null);
    }
  }, [isOpen, currentPersona]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  // Handle ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddPlanOpen || editingDeciderPlan) return;
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isAddPlanOpen, editingDeciderPlan, onClose]);

  if (!isOpen) return null;

  const toggleSection = (section: 'plans' | 'cover' | 'profile') => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

  const handleFinalPublish = () => {
    if (!title.trim()) {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
      return;
    }

    const planWithDate = attachedPlans.find((p) => p.date || p.time || p.dateTime);
    const finalCreatorName = useCustomName && customDisplayName.trim()
      ? customDisplayName.trim()
      : currentPersona.name;

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
      creatorCustomName: finalCreatorName,
      creatorCustomAvatar: selectedAvatar,
      useCustomName: Boolean(useCustomName && customDisplayName.trim()),
      creatorCustomIdentity: {
        useCustomName: Boolean(useCustomName && customDisplayName.trim()),
        displayName: finalCreatorName,
        avatar: selectedAvatar,
      },
    });

    onClose();
  };

  const hasTitle = Boolean(title.trim());

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto min-h-screen text-[#1A1B25] font-['Nunito',sans-serif] selection:bg-[#ECEFF3]">
      {/* Centralized Container: desktop up to 384px margins, responsive for tablet & mobile */}
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 max-w-[672px] lg:max-w-[704px] 2xl:max-w-[calc(100vw-768px)] py-8 sm:py-12 md:py-16 flex flex-col">
        
        {/* Header: Title and Close Button */}
        <div className="flex items-center justify-between mb-8 sm:mb-9">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1B25] tracking-tight">
            New Plan Board
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Board Title & Emoji Row */}
        <div className="flex items-center gap-3 relative mb-3 sm:mb-4">
          {/* Emoji Badge Button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
              aria-label="Select emoji"
              className="h-13 sm:h-14 px-3.5 sm:px-4 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] flex items-center justify-center gap-1.5 cursor-pointer transition select-none shrink-0 active:scale-98"
            >
              <span className="text-xl sm:text-2xl leading-none">{emoji}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#808897] transition-transform duration-200 ${isEmojiPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Emoji Popover Grid */}
            {isEmojiPickerOpen && (
              <div className="absolute top-full mt-2 left-0 z-40 bg-white rounded-2xl shadow-xl border border-[#ECEFF3] p-3 w-72 sm:w-80 grid grid-cols-6 gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setEmoji(em);
                      setIsEmojiPickerOpen(false);
                    }}
                    className={`h-10 w-10 flex items-center justify-center text-xl rounded-xl transition cursor-pointer hover:bg-[#F6F8FA] ${
                      emoji === em ? 'bg-[#ECEFF3] scale-105' : ''
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Board Title Input */}
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Board title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-13 sm:h-14 px-5 rounded-2xl bg-[#F6F8FA] flex-1 text-sm sm:text-base text-[#1A1B25] placeholder-[#808897] font-semibold border-none outline-none focus:bg-[#ECEFF3] transition"
            autoFocus
          />
        </div>

        {/* Optional Short Description */}
        <div className="mb-6 sm:mb-8">
          <textarea
            rows={2}
            placeholder="Optional short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-5 py-3.5 sm:py-4 rounded-2xl bg-[#F6F8FA] text-sm sm:text-base text-[#1A1B25] placeholder-[#808897] font-medium border-none outline-none focus:bg-[#ECEFF3] transition resize-none leading-relaxed"
          />
        </div>

        {/* Accordion Sections: strictly match reference image */}
        <div className="divide-y divide-[#ECEFF3] border-t border-b border-[#ECEFF3] mb-8 sm:mb-10">
          
          {/* ACCORDION 1: Add Plan */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleSection('plans')}
              className="w-full py-4.5 sm:py-5 flex items-center justify-between text-left cursor-pointer group select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-[#1A1B25]">
                  Add Plan
                </span>
                {attachedPlans.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F6F8FA] text-[#666D80]">
                    {attachedPlans.length} {attachedPlans.length === 1 ? 'plan' : 'plans'}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#1A1B25] transition-transform duration-200 ${
                  openSections.plans ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Accordion 1 Expanded Content */}
            {openSections.plans && (
              <div className="pb-6 pt-1 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-[#666D80] leading-relaxed">
                    Optionally add subjects like Location, Date & Time, Drinks, or Music. You can also organize them anytime later on the board.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddPlanOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Plan</span>
                  </button>
                </div>

                {/* Attached Plans Chips / Cards */}
                {attachedPlans.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachedPlans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setEditingDeciderPlan(plan)}
                        className="relative flex items-center gap-2.5 pl-3.5 pr-8 py-2.5 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] transition cursor-pointer select-none group"
                        title={`Click to configure decider for ${plan.title}`}
                      >
                        <span className="text-base">{plan.emoji}</span>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold leading-tight text-[#1A1B25]">
                            {plan.title}
                          </span>
                          <span className="text-[10px] font-semibold text-[#666D80] leading-tight mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>
                              {plan.deciderType === 'voting' && '🗳️ Voting'}
                              {plan.deciderType === 'fixed_info' && 'ℹ️ Fixed Info'}
                              {plan.deciderType === 'task_duty' && '🎯 Task / Duty'}
                              {plan.deciderType === 'photo_idea' && '📸 Photo / Idea'}
                              {plan.deciderType === 'participant_status' && '👥 Participant Status'}
                            </span>
                            {(plan.date || plan.time) && (
                              <span className="text-[#1A1B25] font-semibold flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-md text-[10px]">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{plan.date || plan.time}</span>
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Remove Plan Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlan(plan.id);
                          }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[#808897] hover:text-[#1A1B25] hover:bg-[#DFE1E6] transition cursor-pointer"
                          aria-label={`Remove ${plan.title}`}
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#F8F9FB] text-center">
                    <p className="text-xs text-[#666D80] font-medium">
                      No plans attached yet. Click "+ Add Plan" to attach subjects now, or skip to organize them later.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 2: Set Cover Image */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleSection('cover')}
              className="w-full py-4.5 sm:py-5 flex items-center justify-between text-left cursor-pointer group select-none"
            >
              <span className="text-sm sm:text-base font-bold text-[#1A1B25]">
                Set Cover Image
              </span>
              <ChevronDown
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#1A1B25] transition-transform duration-200 ${
                  openSections.cover ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Accordion 2 Expanded Content */}
            {openSections.cover && (
              <SetCoverImageSection
                coverImage={coverImage}
                onCoverImageChange={setCoverImage}
                coverImagePosition={coverImagePosition}
                onCoverImagePositionChange={setCoverImagePosition}
              />
            )}
          </div>

          {/* ACCORDION 3: Customize your Profile */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleSection('profile')}
              className="w-full py-4.5 sm:py-5 flex items-center justify-between text-left cursor-pointer group select-none"
            >
              <span className="text-sm sm:text-base font-bold text-[#1A1B25]">
                Customize your Profile
              </span>
              <ChevronDown
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#1A1B25] transition-transform duration-200 ${
                  openSections.profile ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Accordion 3 Expanded Content */}
            {openSections.profile && (
              <div className="pb-6 pt-1 space-y-4 animate-in fade-in duration-150">
                <BoardIdentityStep
                  currentUsername={currentPersona.name}
                  currentAvatar={currentPersona.avatar}
                  useCustomName={useCustomName}
                  setUseCustomName={setUseCustomName}
                  customDisplayName={customDisplayName}
                  setCustomDisplayName={setCustomDisplayName}
                  selectedAvatar={selectedAvatar}
                  setSelectedAvatar={setSelectedAvatar}
                  boardTitle={title}
                  boardEmoji={emoji}
                  hideStepBanner={true}
                />
              </div>
            )}
          </div>

        </div>

        {/* Publish Board Primary Button */}
        <button
          type="button"
          onClick={handleFinalPublish}
          disabled={!hasTitle}
          className={`w-full py-4 sm:py-4.5 rounded-full font-bold text-sm sm:text-base transition-all flex items-center justify-center text-center ${
            hasTitle
              ? 'bg-[#1A1B25] hover:bg-[#272835] text-white cursor-pointer shadow-sm active:scale-[0.99]'
              : 'bg-[#DFE1E6] text-white cursor-not-allowed select-none'
          }`}
        >
          Publish Board
        </button>

      </div>

      {/* Nested Add Plan Modal */}
      <AddPlanModal
        isOpen={isAddPlanOpen}
        onClose={() => setIsAddPlanOpen(false)}
        onAddPlans={handleAddPlans}
        existingPlanTitles={attachedPlans.map((p) => p.title)}
        currentPersona={currentPersona}
        members={[
          {
            id: currentPersona.id,
            name: useCustomName && customDisplayName.trim() ? customDisplayName.trim() : currentPersona.name,
            avatar: selectedAvatar,
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
              name: useCustomName && customDisplayName.trim() ? customDisplayName.trim() : currentPersona.name,
              avatar: selectedAvatar,
              role: 'owner',
            },
          ]}
        />
      )}
    </div>
  );
};
