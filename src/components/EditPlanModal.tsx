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
  Clock, 
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

const EMOJI_LIST = ['📍', '🥤', '🎵', '🍔', '🎨', '🎁', '🚗', '🎈', '🎂', '📸', '🎮', '🏨', '🏖️', '🥂', '🍽️', '🏕️', '🎟️', '🍕', '🎤', '🚤'];

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

  // Fun Decider Option Handlers (Wheel Spinner & Blind Pick)
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

  const handleLoadSpinnerPreset = (optionsList: string[]) => {
    setSpinnerOptions(optionsList);
  };

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
          // Retain vote counts if matched with existing options
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#ECEFF3] animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ECEFF3] flex items-center justify-between bg-[#F8F9FB]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                Decider Configuration
              </span>
              <h3 className="text-lg font-black text-[#1A1B25]">
                {title || plan.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#808897] hover:text-[#1A1B25] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-rose-950">
                  Remove "{plan.title}" from this Board?
                </h4>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  This will delete the plan and remove its associated decider component from the board. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#1A1B25] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs"
              >
                Yes, Remove Plan
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Title & Emoji */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                  Emoji
                </label>
                <select
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full px-2 py-2 text-base rounded-xl border border-[#DFE1E6] bg-white text-center cursor-pointer font-bold"
                >
                  {EMOJI_LIST.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                  Plan Title / Subject
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500 font-bold"
                  required
                />
              </div>
            </div>

            {/* Change Decider Type */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                Decider Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { type: 'voting' as DeciderType, label: 'Voting', icon: Vote, color: 'text-rose-600' },
                  { type: 'fixed_info' as DeciderType, label: 'Fixed Info', icon: Info, color: 'text-emerald-600' },
                  { type: 'task_duty' as DeciderType, label: 'Task Duty', icon: CheckSquare, color: 'text-blue-600' },
                  { type: 'photo_idea' as DeciderType, label: 'Photo/Idea', icon: Camera, color: 'text-amber-600' },
                  { type: 'participant_status' as DeciderType, label: 'Status', icon: Users, color: 'text-indigo-600' },
                  { type: 'wheel_spinner' as DeciderType, label: 'Wheel Spinner 🎡', icon: Sparkles, color: 'text-amber-800' },
                  { type: 'blind_pick' as DeciderType, label: 'Blind Pick 🎴', icon: Sparkles, color: 'text-purple-600' },
                ].map((d) => {
                  const Icon = d.icon;
                  const isSelected = deciderType === d.type;
                  return (
                    <button
                      key={d.type}
                      type="button"
                      onClick={() => setDeciderType(d.type)}
                      className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-400 font-black'
                          : 'bg-[#F8F9FB] border-[#DFE1E6] text-[#666D80] hover:bg-[#ECEFF3]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${d.color}`} />
                      <span className="text-xs">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Decider Content Fields */}
            {deciderType === 'voting' && (
              <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Question for the Group
                  </label>
                  <input
                    type="text"
                    value={votingQuestion}
                    onChange={(e) => setVotingQuestion(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500 font-bold"
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
                      className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {votingOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateVotingOption(i, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500"
                          required
                        />
                        {votingOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVotingOption(i)}
                            className="p-1 text-[#808897] hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Voting Deadline / Time
                  </label>
                  <input
                    type="text"
                    value={votingDeadline}
                    onChange={(e) => setVotingDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500"
                  />
                </div>
              </div>
            )}

            {deciderType === 'fixed_info' && (
              <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Fixed Information Content
                  </label>
                  <textarea
                    rows={3}
                    value={fixedInfoValue}
                    onChange={(e) => setFixedInfoValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500"
                    required
                  />
                </div>
              </div>
            )}

            {deciderType === 'task_duty' && (
              <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Task Instructions / Scope
                  </label>
                  <textarea
                    rows={2}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Assigned Volunteer
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500"
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
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Target Completion Time
                  </label>
                  <input
                    type="text"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500"
                  />
                </div>
              </div>
            )}

            {deciderType === 'photo_idea' && (
              <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Prompt for Submissions
                  </label>
                  <textarea
                    rows={2}
                    value={ideaDescription}
                    onChange={(e) => setIdeaDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500"
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

            {/* Decider Type 5: Participant Status */}
            {deciderType === 'participant_status' && (
              <div className="space-y-3.5 p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-black text-indigo-950">
                      Automatic Participant Roster
                    </p>
                    <p className="text-indigo-800 text-[11px] leading-relaxed mt-0.5">
                      Automatically pulls everyone who has joined this board ({members.length} member{members.length === 1 ? '' : 's'}). Each person checks in or updates their status option directly.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Status Question or Prompt *
                  </label>
                  <input
                    type="text"
                    value={statusQuestion}
                    onChange={(e) => setStatusQuestion(e.target.value)}
                    placeholder="e.g. Who will be attending? or Who has made their payment?"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500 font-bold text-[#1A1B25]"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#666D80]">
                      Selectable Options for Each Person (Min 2) *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddStatusOption}
                      className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {statusOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#808897] w-4 text-center">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateStatusOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500 font-medium text-[#1A1B25]"
                          required
                        />
                        {statusOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStatusOption(idx)}
                            className="p-1.5 rounded-lg text-[#808897] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Roster Preview */}
                {members.length > 0 && (
                  <div className="pt-2 border-t border-[#ECEFF3]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#808897]">
                        Board Participants ({members.length})
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                        Live joined list
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#ECEFF3] text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-6 h-6 rounded-full object-cover border border-[#DFE1E6]"
                            />
                            <span className="font-extrabold text-[#1A1B25] truncate">
                              {member.name}
                            </span>
                            {member.role === 'owner' && (
                              <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded-sm bg-amber-100 text-amber-800">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {statusOptions.slice(0, 3).map((opt, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F8F9FB] text-[#666D80] border border-[#DFE1E6]"
                              >
                                {opt || `Option ${i + 1}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deciders 6 & 7: Wheel Spinner & Blind Pick Configuration */}
            {(deciderType === 'wheel_spinner' || deciderType === 'blind_pick') && (
              <div className="space-y-4 p-4 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
                {/* Explanatory Banner */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-black text-amber-950">
                      {deciderType === 'wheel_spinner' 
                        ? 'Interactive Game-Like Wheel Spinner 🎡' 
                        : 'Mystery Blind-Pick Cards 🎴'}
                    </p>
                    <p className="text-amber-900 text-[11px] leading-relaxed mt-0.5">
                      {deciderType === 'wheel_spinner'
                        ? 'Edit your choices below. They automatically become colorful segments on the spinning wheel. When spun, the wheel decelerates and lands on the winner, immediately locking in the decision!'
                        : 'Edit your choices below. They become face-down mystery cards. Tapping a card triggers a playful 3D flip animation to reveal the group choice!'}
                    </p>
                  </div>
                </div>

                {/* Question / Decider Prompt */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                    Decision Question or Prompt *
                  </label>
                  <input
                    type="text"
                    value={spinnerQuestion}
                    onChange={(e) => setSpinnerQuestion(e.target.value)}
                    placeholder={deciderType === 'wheel_spinner' ? 'e.g. Where should we eat?' : 'e.g. Which activity should we do first?'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500 font-bold text-[#1A1B25]"
                    required
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#808897] mb-1.5">
                    Quick Example Presets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSpinnerQuestion('Where should we eat?');
                        handleLoadSpinnerPreset(['KFC', 'Chicken Republic', 'Kilimanjaro', 'The Place', "Domino's"]);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-[#DFE1E6] hover:border-amber-400 text-[#353849] font-bold transition cursor-pointer"
                    >
                      🍔 Fast Food / Dining
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSpinnerQuestion('Which activity should we do next?');
                        handleLoadSpinnerPreset(['Beach Volleyball', 'Board Game Tournament', 'Karaoke Session', 'Cocktail Making', 'Sunset Walk']);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-[#DFE1E6] hover:border-amber-400 text-[#353849] font-bold transition cursor-pointer"
                    >
                      🎯 Activities & Games
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSpinnerQuestion('What party music vibe?');
                        handleLoadSpinnerPreset(['Afrobeats & Amapiano', 'Throwback 90s/2000s Hits', 'Chill House & Sunset', 'Hip-Hop & R&B']);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-[#DFE1E6] hover:border-amber-400 text-[#353849] font-bold transition cursor-pointer"
                    >
                      🎵 Music Vibes
                    </button>
                  </div>
                </div>

                {/* Options List (Add, Edit, Reorder, Remove) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#666D80]">
                      Wheel Segments / Options ({spinnerOptions.length}) *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSpinnerOption}
                      disabled={spinnerOptions.length >= 12}
                      className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {spinnerOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        {/* Segment color indicator */}
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: [
                              '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
                              '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'
                            ][idx % 10]
                          }}
                        />

                        {/* Reorder Buttons */}
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
                          placeholder={`Segment ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#DFE1E6] bg-white focus:outline-amber-500 font-bold text-[#1A1B25]"
                          required
                        />

                        {spinnerOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSpinnerOption(idx)}
                            className="p-1.5 rounded-lg text-[#808897] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                            title="Delete option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Mini Preview */}
                <div className="pt-3 border-t border-[#ECEFF3] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#808897] block">
                      Live Wheel Preview
                    </span>
                    <span className="text-xs font-bold text-[#1A1B25]">
                      {spinnerOptions.length} balanced segments ready to spin
                    </span>
                  </div>

                  {/* Mini SVG Wheel preview */}
                  <div className="w-14 h-14 relative shrink-0">
                    <svg viewBox="-50 -50 100 100" className="w-full h-full drop-shadow-xs">
                      {spinnerOptions.map((_, i) => {
                        const N = spinnerOptions.length;
                        const angle = 360 / N;
                        const a1 = (i * angle * Math.PI) / 180;
                        const a2 = ((i + 1) * angle * Math.PI) / 180;
                        const x1 = 44 * Math.sin(a1);
                        const y1 = -44 * Math.cos(a1);
                        const x2 = 44 * Math.sin(a2);
                        const y2 = -44 * Math.cos(a2);
                        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
                        return (
                          <path
                            key={i}
                            d={`M 0 0 L ${x1} ${y1} A 44 44 0 0 1 ${x2} ${y2} Z`}
                            fill={colors[i % colors.length]}
                            stroke="#FFF"
                            strokeWidth="1"
                          />
                        );
                      })}
                      <circle r="10" fill="#1A1B25" stroke="#FFF" strokeWidth="1.5" />
                      <circle r="4" fill="#F8F9FB" />
                    </svg>
                    {/* Mini top pointer */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] border-t-red-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Plan Date & Time Configuration */}
            <div className="p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="edit-toggle-plan-datetime" className="text-xs font-black text-[#1A1B25] block cursor-pointer">
                      Plan Schedule & Time
                    </label>
                    <span className="text-[10px] text-[#666D80] font-medium block">
                      Optional structured date/time for real-time countdowns, tracking, and schedules
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
                  <div className="w-9 h-5 bg-[#DFE1E6] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {hasDateTime && (
                <div className="pt-1 animate-in fade-in duration-150">
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

            {/* Priority */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                Priority
              </label>
              <div className="flex items-center gap-2">
                {(['required', 'important', 'optional'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition cursor-pointer ${
                      priority === p
                        ? 'bg-[#1A1B25] text-white shadow-xs'
                        : 'bg-[#F8F9FB] border border-[#DFE1E6] text-[#666D80] hover:bg-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#ECEFF3] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2.5 rounded-2xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Plan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#1A1B25] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Plan Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
