import React, { useState, useEffect } from 'react';
import { 
  X, 
  Vote, 
  CheckSquare, 
  Camera, 
  Info, 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  Sparkles 
} from 'lucide-react';
import { AttachedPlan, DeciderType, ItemPriority, UserPersona, BoardMember, ImagePosition } from '../types';
import { ImagePickerField } from './ImagePickerField';
import { DateTimePicker } from './DateTimePicker';
import { DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';
import { CornerCheckBadge } from './SelectionBadge';

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (updatedPlan: AttachedPlan) => void;
  onRemovePlan: (planId: string) => void;
  plan: AttachedPlan | null;
  currentPersona: UserPersona;
  members: BoardMember[];
}

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
];

const EMOJI_LIST = [
  '📍', '🥤', '🎵', '🍔', '🎨', '🎁', '🚗', '🎈', '🎂', '📸', 
  '🎮', '🏨', '🏖️', '🥂', '🍽️', '🏕️', '🎟️', '🍕', '🎤', '🚤'
];

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  isOpen,
  onClose,
  onSavePlan,
  onRemovePlan,
  plan,
  currentPersona,
  members,
}) => {
  const [title, setTitle] = useState(plan?.title || '');
  const [emoji, setEmoji] = useState(plan?.emoji || '📋');
  const [priority, setPriority] = useState<ItemPriority>(plan?.priority || 'required');
  const [deciderType, setDeciderType] = useState<DeciderType>(plan?.deciderType || 'voting');

  // Decider 1: Voting
  const [votingQuestion, setVotingQuestion] = useState(plan?.question || (plan ? `Vote on ${plan.title}` : ''));
  const [votingOptions, setVotingOptions] = useState<string[]>(
    plan?.options && plan.options.length > 0
      ? plan.options.map((o) => o.label)
      : ['Option 1', 'Option 2']
  );
  const [votingDeadline, setVotingDeadline] = useState(plan?.deadlineText || 'Voting closes in 2 days');

  // Decider 2: Fixed Info
  const [fixedInfoValue, setFixedInfoValue] = useState(plan?.infoValue || plan?.description || '');

  // Decider 3: Task / Duty
  const [taskDescription, setTaskDescription] = useState(plan?.taskDesc || plan?.description || '');
  const [assigneeId, setAssigneeId] = useState<string>(plan?.assigneeId || '');
  const [taskDeadline, setTaskDeadline] = useState(plan?.deadlineText || 'Open for volunteers');

  // Decider 4: Photo / Idea
  const [ideaDescription, setIdeaDescription] = useState(plan?.ideaDesc || plan?.description || '');
  const [selectedPhoto, setSelectedPhoto] = useState(plan?.imageUrl || PRESET_PHOTOS[0]);
  const [photoPosition, setPhotoPosition] = useState<ImagePosition>(plan?.imagePosition || { ...DEFAULT_IMAGE_POSITION });

  // Decider 5: Participant Status
  const [statusQuestion, setStatusQuestion] = useState(plan?.statusQuestion || (plan ? `Who will be participating in ${plan.title}?` : ''));
  const [statusOptions, setStatusOptions] = useState<string[]>(
    plan?.statusOptions && plan.statusOptions.length > 0
      ? plan.statusOptions.map((o) => o.label)
      : ['I will', 'Maybe', 'Not available']
  );

  // Deciders 6 & 7: Wheel Spinner & Blind Pick
  const [spinnerQuestion, setSpinnerQuestion] = useState(
    plan?.spinnerQuestion || (plan ? `What should we choose for ${plan.title}?` : '')
  );
  const [spinnerOptions, setSpinnerOptions] = useState<string[]>(
    plan?.spinnerOptions && plan.spinnerOptions.length >= 2
      ? plan.spinnerOptions
      : ['KFC', 'Chicken Republic', 'Kilimanjaro', 'The Place', "Domino's"]
  );

  // Optional Structured Date & Time for this Plan
  const [hasDateTime, setHasDateTime] = useState(Boolean(plan?.dateTime || plan?.date || plan?.time));
  const [planDateTime, setPlanDateTime] = useState<string | undefined>(plan?.dateTime);
  const [planDate, setPlanDate] = useState(plan?.date || '');
  const [planTime, setPlanTime] = useState(plan?.time || '');
  const [hasSpecificTime, setHasSpecificTime] = useState(plan?.hasSpecificTime !== undefined ? plan.hasSpecificTime : Boolean(plan?.time));

  // Show delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (plan && isOpen) {
      setTitle(plan.title || '');
      setEmoji(plan.emoji || '📋');
      setPriority(plan.priority || 'required');
      setDeciderType(plan.deciderType || 'voting');
      setVotingQuestion(plan.question || `Vote on ${plan.title}`);
      setVotingOptions(
        plan.options && plan.options.length > 0
          ? plan.options.map((o) => o.label)
          : ['Option 1', 'Option 2']
      );
      setVotingDeadline(plan.deadlineText || 'Voting closes in 2 days');
      setFixedInfoValue(plan.infoValue || plan.description || '');
      setTaskDescription(plan.taskDesc || plan.description || '');
      setAssigneeId(plan.assigneeId || '');
      setTaskDeadline(plan.deadlineText || 'Open for volunteers');
      setIdeaDescription(plan.ideaDesc || plan.description || '');
      setSelectedPhoto(plan.imageUrl || PRESET_PHOTOS[0]);
      setPhotoPosition(plan.imagePosition || { ...DEFAULT_IMAGE_POSITION });
      setStatusQuestion(plan.statusQuestion || `Who will be participating in ${plan.title}?`);
      setStatusOptions(
        plan.statusOptions && plan.statusOptions.length > 0
          ? plan.statusOptions.map((o) => o.label)
          : ['I will', 'Maybe', 'Not available']
      );
      setSpinnerQuestion(plan.spinnerQuestion || `What should we choose for ${plan.title}?`);
      setSpinnerOptions(
        plan.spinnerOptions && plan.spinnerOptions.length >= 2
          ? plan.spinnerOptions
          : ['KFC', 'Chicken Republic', 'Kilimanjaro', 'The Place', "Domino's"]
      );
      setHasDateTime(Boolean(plan.dateTime || plan.date || plan.time));
      setPlanDateTime(plan.dateTime);
      setPlanDate(plan.date || '');
      setPlanTime(plan.time || '');
      setHasSpecificTime(plan.hasSpecificTime !== undefined ? plan.hasSpecificTime : Boolean(plan.time));
      setShowDeleteConfirm(false);
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  // Option handlers
  const handleAddVotingOption = () => {
    setVotingOptions([...votingOptions, '']);
  };

  const handleUpdateVotingOption = (index: number, val: string) => {
    const updated = [...votingOptions];
    updated[index] = val;
    setVotingOptions(updated);
  };

  const handleRemoveVotingOption = (index: number) => {
    if (votingOptions.length <= 2) return;
    setVotingOptions(votingOptions.filter((_, i) => i !== index));
  };

  const handleAddSpinnerOption = () => {
    if (spinnerOptions.length < 12) {
      setSpinnerOptions([...spinnerOptions, `Option ${spinnerOptions.length + 1}`]);
    }
  };

  const handleUpdateSpinnerOption = (index: number, val: string) => {
    const updated = [...spinnerOptions];
    updated[index] = val;
    setSpinnerOptions(updated);
  };

  const handleRemoveSpinnerOption = (index: number) => {
    if (spinnerOptions.length <= 2) return;
    setSpinnerOptions(spinnerOptions.filter((_, i) => i !== index));
  };

  const handleMoveSpinnerOption = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const copy = [...spinnerOptions];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      setSpinnerOptions(copy);
    } else if (direction === 'down' && index < spinnerOptions.length - 1) {
      const copy = [...spinnerOptions];
      [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
      setSpinnerOptions(copy);
    }
  };

  const handleAddStatusOption = () => {
    setStatusOptions([...statusOptions, `Option ${statusOptions.length + 1}`]);
  };

  const handleUpdateStatusOption = (index: number, val: string) => {
    const updated = [...statusOptions];
    updated[index] = val;
    setStatusOptions(updated);
  };

  const handleRemoveStatusOption = (index: number) => {
    if (statusOptions.length <= 2) return;
    setStatusOptions(statusOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedPlan: AttachedPlan = {
      ...plan,
      title: title.trim(),
      emoji,
      deciderType,
      priority,
    };

    if (deciderType === 'voting') {
      const validOptions = votingOptions
        .filter((o) => o.trim().length > 0)
        .map((optLabel, idx) => {
          const existing = plan.options?.find((o) => o.label.toLowerCase() === optLabel.toLowerCase());
          return {
            id: existing ? existing.id : `opt-${Date.now()}-${idx}`,
            label: optLabel.trim(),
            emoji: existing ? existing.emoji : '🔘',
            voteCount: existing ? existing.voteCount : 0,
            voterIds: existing ? existing.voterIds : [],
          };
        });

      updatedPlan.question = votingQuestion.trim() || `Vote on ${title.trim()}`;
      updatedPlan.options = validOptions.length >= 2 ? validOptions : [
        { id: `opt-${Date.now()}-0`, label: 'Option 1', emoji: '🔘', voteCount: 0, voterIds: [] },
        { id: `opt-${Date.now()}-1`, label: 'Option 2', emoji: '🔘', voteCount: 0, voterIds: [] },
      ];
      updatedPlan.deadlineText = votingDeadline.trim() || 'Voting closes in 2 days';
      updatedPlan.description = updatedPlan.question;
    } else if (deciderType === 'fixed_info') {
      updatedPlan.infoValue = fixedInfoValue.trim() || `${title.trim()} ground rule set.`;
      updatedPlan.fixedBy = plan.fixedBy || currentPersona.name;
      updatedPlan.description = updatedPlan.infoValue;
      updatedPlan.status = 'confirmed';
    } else if (deciderType === 'task_duty') {
      const chosenAssignee = members.find((m) => m.id === assigneeId);
      updatedPlan.taskDesc = taskDescription.trim() || `Handle ${title.trim()}`;
      updatedPlan.assigneeId = assigneeId || undefined;
      updatedPlan.assigneeName = chosenAssignee ? chosenAssignee.name : undefined;
      updatedPlan.deadlineText = taskDeadline.trim() || 'Open for volunteers';
      updatedPlan.description = updatedPlan.taskDesc;
    } else if (deciderType === 'photo_idea') {
      updatedPlan.ideaDesc = ideaDescription.trim() || `Submit ideas for ${title.trim()}`;
      updatedPlan.imageUrl = selectedPhoto;
      updatedPlan.imagePosition = photoPosition;
      updatedPlan.description = updatedPlan.ideaDesc;
    } else if (deciderType === 'participant_status') {
      const validStatusOptions = statusOptions
        .filter((o) => o.trim().length > 0)
        .map((optLabel, idx) => {
          const existing = plan.statusOptions?.find((o) => o.label.toLowerCase() === optLabel.toLowerCase());
          const lower = optLabel.toLowerCase();
          const badgeEmoji = lower.includes('paid') ? '💳' :
            lower.includes('not') || lower.includes('unavail') ? '❌' :
            lower.includes('will') || lower.includes('yes') || lower.includes('attend') ? '✅' :
            lower.includes('maybe') ? '🤔' : '🔘';
          return {
            id: existing ? existing.id : `status-opt-${plan.id}-${idx}`,
            label: optLabel.trim(),
            emoji: existing?.emoji || badgeEmoji,
            color: existing?.color || (
              lower.includes('paid') || lower.includes('will') || lower.includes('yes') ? 'emerald' :
              lower.includes('maybe') ? 'amber' :
              lower.includes('not') ? 'rose' : 'indigo'
            ),
          };
        });

      updatedPlan.statusQuestion = statusQuestion.trim() || `Who will be participating in ${title.trim()}?`;
      updatedPlan.statusOptions = validStatusOptions.length >= 2 ? validStatusOptions : [
        { id: `status-opt-${plan.id}-0`, label: 'I will', emoji: '✅', color: 'emerald' },
        { id: `status-opt-${plan.id}-1`, label: 'Maybe', emoji: '🤔', color: 'amber' },
        { id: `status-opt-${plan.id}-2`, label: 'Not available', emoji: '❌', color: 'rose' },
      ];
      updatedPlan.description = updatedPlan.statusQuestion;
      updatedPlan.participantStatuses = plan.participantStatuses || {};
    } else if (deciderType === 'wheel_spinner' || deciderType === 'blind_pick') {
      const validOptions = spinnerOptions
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      const finalOptions = validOptions.length >= 2 
        ? validOptions 
        : ['Option 1', 'Option 2'];

      updatedPlan.spinnerQuestion = spinnerQuestion.trim() || `What should we choose for ${title.trim()}?`;
      updatedPlan.spinnerOptions = finalOptions;
      updatedPlan.description = updatedPlan.spinnerQuestion;
    }

    updatedPlan.dateTime = hasDateTime ? planDateTime : undefined;
    updatedPlan.date = hasDateTime ? (planDate.trim() || undefined) : undefined;
    updatedPlan.time = hasDateTime ? (planTime.trim() || undefined) : undefined;
    updatedPlan.hasSpecificTime = hasDateTime ? hasSpecificTime : undefined;

    onSavePlan(updatedPlan);
    onClose();
  };

  const handleDelete = () => {
    onRemovePlan(plan.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl md:max-w-2xl rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="shrink-0 px-6 py-4 sm:py-5 bg-[#F8F9FB] sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs">
              {emoji}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#1A1B25] tracking-tight leading-tight">
                Edit {title || plan.title}
              </h3>
              <p className="text-xs font-bold text-[#666D80] mt-0.5">
                Update decider configuration, options, and timing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#ECEFF3] hover:bg-[#DFE1E6] text-[#666D80] hover:text-[#1A1B25] flex items-center justify-center transition cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm ? (
          <div className="p-6 sm:p-8 space-y-4 my-auto">
            <div className="p-5 rounded-2xl bg-rose-50 flex items-start gap-3.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-rose-950">
                  Remove "{plan.title}" from this Board?
                </h4>
                <p className="text-xs font-bold text-rose-800 mt-1 leading-relaxed">
                  This will delete the plan and remove its decider component from the board. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-xs font-black text-[#1A1B25] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition cursor-pointer shadow-xs"
              >
                Yes, Remove Plan
              </button>
            </div>
          </div>
        ) : (
          <>
            <form id="edit-plan-form" onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 pb-8">
              {/* Plan Identity: Title & Emoji */}
              <div className="p-4 rounded-2xl bg-[#F8F9FB] space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-[#1A1B25]">
                  Plan Subject
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#666D80] mb-1">
                      Emoji
                    </label>
                    <select
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      className="w-full py-2 px-2 text-lg rounded-xl bg-white text-center font-black cursor-pointer outline-none shadow-xs"
                    >
                      {EMOJI_LIST.map((em) => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#666D80] mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white outline-none font-black text-[#1A1B25] shadow-xs"
                      required
                    />
                  </div>
                </div>

                {/* Priority */}
                <div className="pt-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                    Priority
                  </label>
                  <div className="flex items-center gap-2">
                    {(['required', 'important', 'optional'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition cursor-pointer ${
                          priority === p
                            ? 'bg-[#1A1B25] text-white'
                            : 'bg-white text-[#666D80] hover:bg-[#ECEFF3]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decider Type Switcher */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1A1B25] mb-2.5">
                  Decider Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'voting' as DeciderType, label: 'Voting', icon: Vote },
                    { type: 'wheel_spinner' as DeciderType, label: 'Wheel', icon: Sparkles },
                    { type: 'blind_pick' as DeciderType, label: 'Blind Pick', icon: Sparkles },
                    { type: 'task_duty' as DeciderType, label: 'Task Duty', icon: CheckSquare },
                    { type: 'participant_status' as DeciderType, label: 'Status', icon: Users },
                    { type: 'photo_idea' as DeciderType, label: 'Photo/Idea', icon: Camera },
                    { type: 'fixed_info' as DeciderType, label: 'Fixed Info', icon: Info },
                  ].map((d) => {
                    const Icon = d.icon;
                    const isSelected = deciderType === d.type;
                    return (
                      <button
                        key={d.type}
                        type="button"
                        onClick={() => setDeciderType(d.type)}
                        className={`relative p-3 rounded-2xl text-center flex flex-col items-center gap-1.5 transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#FFF9F0] border-2 border-[#EAA21F] text-[#1A1B25] font-black shadow-xs'
                            : 'bg-[#F6F8FA] border-2 border-transparent text-[#666D80] hover:bg-[#F0F2F5]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#EAA21F] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3] text-white" />
                          </div>
                        )}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-[#EAA21F] text-white' : 'bg-white text-[#1A1B25] shadow-xs'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold leading-tight">{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Decider Content Fields */}
              {deciderType === 'voting' && (
                <div className="space-y-3.5 p-4 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Question for the Group *
                    </label>
                    <input
                      type="text"
                      value={votingQuestion}
                      onChange={(e) => setVotingQuestion(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-black text-[#1A1B25]"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-[#666D80]">
                        Voting Options
                      </label>
                      <button
                        type="button"
                        onClick={handleAddVotingOption}
                        className="text-xs text-[#1A1B25] font-black hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>
                    </div>
                    <div className="space-y-2">
                      {votingOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs font-black text-[#808897]">
                            {i + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateVotingOption(i, e.target.value)}
                            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white font-bold text-[#1A1B25] outline-none"
                            required
                          />
                          {votingOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVotingOption(i)}
                              className="p-2 text-[#808897] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Voting Deadline / Duration
                    </label>
                    <input
                      type="text"
                      value={votingDeadline}
                      onChange={(e) => setVotingDeadline(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                    />
                  </div>
                </div>
              )}

              {deciderType === 'fixed_info' && (
                <div className="space-y-3.5 p-4 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Fixed Information Content *
                    </label>
                    <textarea
                      rows={3}
                      value={fixedInfoValue}
                      onChange={(e) => setFixedInfoValue(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                      required
                    />
                  </div>
                </div>
              )}

              {deciderType === 'task_duty' && (
                <div className="space-y-3.5 p-4 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Task Scope / Instructions *
                    </label>
                    <textarea
                      rows={2}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Assigned Volunteer
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25] cursor-pointer"
                    >
                      <option value="">Leave open for volunteers 🙋</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          Assign to {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Target Completion Time
                    </label>
                    <input
                      type="text"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                    />
                  </div>
                </div>
              )}

              {deciderType === 'photo_idea' && (
                <div className="space-y-3.5 p-4 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Prompt for Submissions *
                    </label>
                    <textarea
                      rows={2}
                      value={ideaDescription}
                      onChange={(e) => setIdeaDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                      required
                    />
                  </div>

                  <div>
                    <ImagePickerField
                      id="edit-plan-reference-photo-picker"
                      label="Reference Photo"
                      sublabel="Choose from system presets or upload from your device"
                      value={selectedPhoto}
                      onChange={setSelectedPhoto}
                      position={photoPosition}
                      onPositionChange={setPhotoPosition}
                      systemImages={PRESET_PHOTOS}
                      aspectRatio="standard"
                    />
                  </div>
                </div>
              )}

              {deciderType === 'participant_status' && (
                <div className="space-y-3.5 p-4 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Status Question or Prompt *
                    </label>
                    <input
                      type="text"
                      value={statusQuestion}
                      onChange={(e) => setStatusQuestion(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-black text-[#1A1B25]"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-[#666D80]">
                        Selectable Options (Min 2) *
                      </label>
                      <button
                        type="button"
                        onClick={handleAddStatusOption}
                        className="text-xs text-[#1A1B25] font-black hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {statusOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#808897] w-6 text-center">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateStatusOption(idx, e.target.value)}
                            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                            required
                          />
                          {statusOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStatusOption(idx)}
                              className="p-2 rounded-xl text-[#808897] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(deciderType === 'wheel_spinner' || deciderType === 'blind_pick') && (
                <div className="space-y-4 p-4 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Decision Question or Prompt *
                    </label>
                    <input
                      type="text"
                      value={spinnerQuestion}
                      onChange={(e) => setSpinnerQuestion(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-black text-[#1A1B25]"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-[#666D80]">
                        Segments / Options ({spinnerOptions.length}) *
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSpinnerOption}
                        disabled={spinnerOptions.length >= 12}
                        className="text-xs text-[#1A1B25] font-black hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {spinnerOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span 
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                            style={{
                              backgroundColor: [
                                '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
                                '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'
                              ][idx % 10]
                            }}
                          />

                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveSpinnerOption(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 rounded text-[#808897] hover:text-[#1A1B25] hover:bg-[#ECEFF3] disabled:opacity-20 cursor-pointer"
                              title="Move up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSpinnerOption(idx, 'down')}
                              disabled={idx === spinnerOptions.length - 1}
                              className="p-0.5 rounded text-[#808897] hover:text-[#1A1B25] hover:bg-[#ECEFF3] disabled:opacity-20 cursor-pointer"
                              title="Move down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateSpinnerOption(idx, e.target.value)}
                            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                            required
                          />

                          {spinnerOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpinnerOption(idx)}
                              className="p-2 rounded-xl text-[#808897] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule & Time */}
              <div className="p-4 bg-[#F8F9FB] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white text-[#1A1B25] shadow-xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <label htmlFor="edit-toggle-plan-datetime" className="text-xs font-black text-[#1A1B25] block cursor-pointer">
                        Plan Schedule & Time
                      </label>
                      <span className="text-[11px] text-[#666D80] font-bold block">
                        Add structured date & time for live countdowns
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      id="edit-toggle-plan-datetime"
                      type="checkbox"
                      checked={hasDateTime}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasDateTime(checked);
                        if (checked && !planDateTime) {
                          setPlanDateTime('2026-08-22T14:00:00');
                          setPlanDate('Saturday, August 22, 2026');
                          setPlanTime('02:00 PM');
                          setHasSpecificTime(true);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-[#DFE1E6] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A1B25]"></div>
                  </label>
                </div>

                {hasDateTime && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <DateTimePicker
                      id="edit-plan-date-time-picker"
                      initialIso={planDateTime}
                      initialDate={planDate}
                      initialTime={planTime}
                      initialHasSpecificTime={hasSpecificTime}
                      onChange={(val) => {
                        setPlanDateTime(val.iso);
                        setPlanDate(val.date);
                        setPlanTime(val.time);
                        setHasSpecificTime(val.hasSpecificTime);
                      }}
                      onClear={() => {
                        setHasDateTime(false);
                        setPlanDateTime(undefined);
                        setPlanDate('');
                        setPlanTime('');
                      }}
                    />
                  </div>
                )}
              </div>
            </form>

            {/* Fixed / Sticky Bottom CTA Footer */}
            <div className="shrink-0 sticky bottom-0 z-20 bg-[#F8F9FB] px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-3 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Plan</span>
              </button>

              <button
                type="submit"
                form="edit-plan-form"
                className="py-3 px-7 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Plan Changes</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
