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
  Sparkles,
  Upload,
  Move
} from 'lucide-react';
import { AttachedPlan, DeciderType, ItemPriority, UserPersona, BoardMember, ImagePosition } from '../types';
import { ImagePickerField } from './ImagePickerField';
import { DateTimePicker } from './DateTimePicker';
import { formatDecisionDeadline, formatOrdinalDate, formatHumanTime } from '../utils/dateTime';
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
  const [deciderType, setDeciderType] = useState<DeciderType | undefined>(plan?.deciderType);
  const [showDeciderPicker, setShowDeciderPicker] = useState(false);

  const getDeciderDisplayLabel = (type?: DeciderType) => {
    if (!type) return 'No Decider Selected';
    switch (type) {
      case 'photo_idea': return 'Idea/Photo';
      case 'voting': return 'Voting';
      case 'task_duty': return 'Task Duty';
      case 'participant_status': return 'Participant Status';
      case 'fixed_info': return 'Fixed Info';
      case 'wheel_spinner': return 'Wheel Spinner';
      case 'blind_pick': return 'Blind Pick';
      default: return 'Decider';
    }
  };

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
  const [photoList, setPhotoList] = useState<string[]>(
    plan?.imageUrl && !PRESET_PHOTOS.includes(plan.imageUrl)
      ? [plan.imageUrl, ...PRESET_PHOTOS]
      : PRESET_PHOTOS
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const bannerRef = React.useRef<HTMLDivElement | null>(null);
  const isDraggingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const startPosRef = React.useRef(50);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoList((prev) => [dataUrl, ...prev.filter((p) => p !== dataUrl)]);
        setSelectedPhoto(dataUrl);
        setPhotoPosition({ ...DEFAULT_IMAGE_POSITION });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startPosRef.current = photoPosition.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !bannerRef.current) return;
      const deltaY = moveEvent.clientY - startYRef.current;
      const height = bannerRef.current.offsetHeight || 200;
      const percentDelta = (deltaY / height) * 100;
      const newY = Math.max(0, Math.min(100, Math.round(startPosRef.current - percentDelta)));
      setPhotoPosition((prev) => ({ ...prev, y: newY }));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleBannerTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    const startY = e.touches[0].clientY;
    const startPos = photoPosition.y;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!bannerRef.current || !moveEvent.touches[0]) return;
      const deltaY = moveEvent.touches[0].clientY - startY;
      const height = bannerRef.current.offsetHeight || 200;
      const percentDelta = (deltaY / height) * 100;
      const newY = Math.max(0, Math.min(100, Math.round(startPos - percentDelta)));
      setPhotoPosition((prev) => ({ ...prev, y: newY }));
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

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
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinWinner, setSpinWinner] = useState<string | null>(null);

  const handleSpinTest = () => {
    if (isSpinning || spinnerOptions.length < 2) return;
    setIsSpinning(true);
    setSpinWinner(null);
    const extraRotations = 5 + Math.floor(Math.random() * 5);
    const randomDegree = Math.floor(Math.random() * 360);
    const newRotation = wheelRotation + extraRotations * 360 + randomDegree;
    setWheelRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const totalSlices = spinnerOptions.length;
      const sliceAngle = 360 / totalSlices;
      const normalizedDeg = (360 - (newRotation % 360)) % 360;
      const winningIdx = Math.floor(normalizedDeg / sliceAngle) % totalSlices;
      setSpinWinner(spinnerOptions[winningIdx]);
    }, 2500);
  };

  // Optional Structured Date & Time for this Plan
  const [hasDateTime, setHasDateTime] = useState(Boolean(plan?.dateTime || plan?.date || plan?.time));
  const [planDateTime, setPlanDateTime] = useState<string | undefined>(plan?.dateTime);
  const [planDate, setPlanDate] = useState(plan?.date || '');
  const [planTime, setPlanTime] = useState(plan?.time || '');
  const [hasSpecificTime, setHasSpecificTime] = useState(plan?.hasSpecificTime !== undefined ? plan.hasSpecificTime : Boolean(plan?.time));
  const [scheduleError, setScheduleError] = useState<string | null>(null);

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

    if (hasDateTime) {
      if (!planDateTime || new Date(planDateTime).getTime() <= Date.now()) {
        setScheduleError('Decision deadline cannot be in the past. Please select a future date and time.');
        return;
      }
    }
    setScheduleError(null);

    updatedPlan.dateTime = hasDateTime ? planDateTime : undefined;
    updatedPlan.deadlineIso = hasDateTime ? planDateTime : undefined;
    updatedPlan.date = hasDateTime ? (planDate.trim() || undefined) : undefined;
    updatedPlan.time = hasDateTime ? (planTime.trim() || undefined) : undefined;
    updatedPlan.hasSpecificTime = hasDateTime ? hasSpecificTime : undefined;
    if (hasDateTime && planDateTime) {
      updatedPlan.deadlineText = formatDecisionDeadline(new Date(planDateTime), deciderType);
    }

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
        <div className="shrink-0 px-6 py-4 bg-white border-b border-[#ECEFF3] sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#F6F8FA] flex items-center justify-center text-2xl shrink-0">
              {emoji}
            </div>
            <h3 className="text-xl font-bold text-[#1A1B25]">
              Edit {title || plan.title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#F0F2F5] text-[#E05252] flex items-center justify-center transition cursor-pointer"
              title="Delete Plan"
              aria-label="Delete Plan"
            >
              <Trash2 className="w-5 h-5 text-[#E05252] stroke-[1.8]" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#F0F2F5] text-[#666D80] hover:text-[#1A1B25] flex items-center justify-center transition cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert (Overlay) */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-950">
                    Remove "{plan.title}" from this Board?
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    This will delete the plan and remove its decider component from the board. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-xs font-bold text-[#1A1B25] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}

        <form id="edit-plan-form" onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 pb-8">
          {/* Plan Identity: Emoji & Title */}
          <div className="flex items-center gap-3">
            {/* Emoji Selector Card */}
            <div className="relative w-16 h-14 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] flex items-center justify-center gap-1 cursor-pointer shrink-0 transition">
              <span className="text-2xl leading-none select-none">{emoji}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#808897]" />
              <select
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-base"
                title="Select emoji"
              >
                {EMOJI_LIST.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Plan title"
              className="flex-1 h-14 px-5 rounded-2xl bg-[#F6F8FA] text-base font-bold text-[#1A1B25] placeholder:text-[#808897] outline-none border-none focus:bg-[#F0F2F5] transition"
              required
            />
          </div>

          {/* Decider Info & Change Decider Link */}
          <div>
            <h4 className="text-base font-bold text-[#1A1B25]">
              {title || plan.title} ({getDeciderDisplayLabel(deciderType)})
            </h4>
            <button
              type="button"
              onClick={() => setShowDeciderPicker(!showDeciderPicker)}
              className="text-sm font-semibold text-[#D4901A] hover:underline cursor-pointer transition block mt-1"
            >
              Change Decider
            </button>

            {showDeciderPicker && (
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-[#808897] mb-2.5">
                  Select Decider Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'photo_idea' as DeciderType, label: 'Idea/Photo', icon: Camera },
                    { type: 'voting' as DeciderType, label: 'Voting', icon: Vote },
                    { type: 'task_duty' as DeciderType, label: 'Task Duty', icon: CheckSquare },
                    { type: 'participant_status' as DeciderType, label: 'Status', icon: Users },
                    { type: 'fixed_info' as DeciderType, label: 'Fixed Info', icon: Info },
                    { type: 'wheel_spinner' as DeciderType, label: 'Wheel', icon: Sparkles },
                    { type: 'blind_pick' as DeciderType, label: 'Blind Pick', icon: Sparkles },
                  ].map((d) => {
                    const Icon = d.icon;
                    const isSelected = deciderType === d.type;
                    return (
                      <button
                        key={d.type}
                        type="button"
                        onClick={() => {
                          setDeciderType(d.type);
                          setShowDeciderPicker(false);
                        }}
                        className={`p-3 rounded-2xl text-center flex flex-col items-center gap-1.5 transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-white border-2 border-[#EAA21F] text-[#1A1B25] font-bold shadow-xs'
                            : 'bg-[#ECEFF3] border-2 border-transparent text-[#666D80] hover:bg-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[#EAA21F]' : 'text-[#666D80]'}`} />
                        <span className="text-xs font-bold">{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

              {/* Decider Content Fields */}
              {deciderType === 'voting' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-[#1A1B25] mb-2.5">
                      Question for the group
                    </label>
                    <input
                      type="text"
                      value={votingQuestion}
                      onChange={(e) => setVotingQuestion(e.target.value)}
                      placeholder="What kind of games should we play?"
                      className="w-full px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs focus:border-[#C1C7CF] transition placeholder:text-[#808897]"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-sm sm:text-base font-medium text-[#1A1B25]">
                        Voting Option
                      </label>
                      <button
                        type="button"
                        onClick={handleAddVotingOption}
                        className="font-bold text-sm sm:text-base text-[#D97706] hover:text-[#B45309] flex items-center gap-1 cursor-pointer transition"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add option
                      </button>
                    </div>

                    <div className="bg-[#F6F8FA] rounded-3xl p-4 sm:p-5 space-y-3.5">
                      {votingOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateVotingOption(i, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs focus:border-[#C1C7CF] transition placeholder:text-[#A4ABB8]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVotingOption(i)}
                            className="p-2 text-[#A4ABB8] hover:text-[#1A1B25] transition cursor-pointer shrink-0 disabled:opacity-20"
                            disabled={votingOptions.length <= 2}
                            title="Delete option"
                          >
                            <Trash2 className="w-5 h-5 stroke-[1.8]" />
                          </button>
                        </div>
                      ))}
                    </div>
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
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-[#1A1B25] mb-2.5">
                      Task instruction and scope
                    </label>
                    <input
                      type="text"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Coordinate musics or DJ to play"
                      className="w-full px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs focus:border-[#C1C7CF] transition placeholder:text-[#808897]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-[#1A1B25] mb-2.5">
                      Assigned Volunteer
                    </label>
                    <div className="bg-[#F6F8FA] rounded-3xl p-4 sm:p-5">
                      <div className="relative">
                        <select
                          value={assigneeId}
                          onChange={(e) => setAssigneeId(e.target.value)}
                          className="w-full appearance-none px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs cursor-pointer focus:border-[#C1C7CF] transition pr-12"
                        >
                          <option value="">Leave it for volunteers</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.role})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-5 h-5 text-[#808897] stroke-[2] absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {deciderType === 'photo_idea' && (
                <div className="space-y-5">
                  {/* Submission Prompt */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1B25] mb-2">
                      Submission Prompt
                    </label>
                    <input
                      type="text"
                      value={ideaDescription}
                      onChange={(e) => setIdeaDescription(e.target.value)}
                      placeholder="Submit photo and visuals for location"
                      className="w-full px-4 py-3.5 rounded-2xl bg-white border border-[#E5E7EB] text-sm font-semibold text-[#1A1B25] outline-none shadow-xs placeholder:text-[#9CA3AF] focus:border-[#1A1B25] transition"
                      required
                    />
                  </div>

                  {/* Photos Row & Click to upload */}
                  <div>
                    <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
                      {/* Click to upload button */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition select-none group"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <Upload className="w-5 h-5 text-[#1A1B25] stroke-[2.2] mb-1.5 transition-transform group-hover:-translate-y-0.5" />
                        <span className="text-xs sm:text-sm font-bold text-[#1A1B25] leading-tight">
                          Click to upload
                        </span>
                      </div>

                      {/* Uploaded thumbnails */}
                      {photoList.map((photoUrl, idx) => {
                        const isSelected = selectedPhoto === photoUrl;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedPhoto(photoUrl)}
                            className={`aspect-square rounded-2xl overflow-hidden relative cursor-pointer transition select-none ${
                              isSelected
                                ? 'border-2 border-[#EAA21F] shadow-xs'
                                : 'border-2 border-transparent hover:border-[#DFE1E6]'
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={`Photo reference ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {photoList.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const filtered = photoList.filter((_, i) => i !== idx);
                                  setPhotoList(filtered);
                                  if (selectedPhoto === photoUrl) {
                                    setSelectedPhoto(filtered[0] || PRESET_PHOTOS[0]);
                                  }
                                }}
                                className="w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center absolute top-2 right-2 transition cursor-pointer z-10 shadow-xs"
                                title="Remove photo"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Drag to reposition Wide Banner Preview */}
                    <div
                      ref={bannerRef}
                      onMouseDown={handleBannerMouseDown}
                      onTouchStart={handleBannerTouchStart}
                      className="w-full h-44 sm:h-52 rounded-2xl sm:rounded-3xl overflow-hidden relative mt-4 shadow-xs bg-[#F6F8FA] cursor-grab active:cursor-grabbing select-none border border-[#ECEFF3]"
                    >
                      <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-[#1A1B25] shadow-xs select-none z-10">
                        <Move className="w-3.5 h-3.5 text-[#1A1B25]" />
                        <span>Drag to reposition</span>
                      </div>
                      <img
                        src={selectedPhoto}
                        alt="Selected location banner"
                        className="w-full h-full object-cover pointer-events-none transition-[object-position] duration-75"
                        style={{
                          objectPosition: `50% ${photoPosition.y}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {deciderType === 'participant_status' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-[#1A1B25] mb-2.5">
                      Question for the group
                    </label>
                    <input
                      type="text"
                      value={statusQuestion}
                      onChange={(e) => setStatusQuestion(e.target.value)}
                      placeholder="Who will be attending the party"
                      className="w-full px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs focus:border-[#C1C7CF] transition placeholder:text-[#808897]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-[#1A1B25] mb-2.5">
                      Preset
                    </label>
                    <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusQuestion('Who will be attending the party');
                          setStatusOptions(['I will', 'Maybe', 'Not avaavailable']);
                        }}
                        className="px-4.5 py-2 rounded-full border border-[#ECEFF3] bg-white text-sm font-semibold text-[#555A68] hover:text-[#1A1B25] hover:border-[#C1C7CF] flex items-center gap-2 cursor-pointer transition shadow-2xs whitespace-nowrap"
                      >
                        <span>🙌</span>
                        <span>Attendance</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusQuestion('Who has made their payment?');
                          setStatusOptions(['Paid', 'Not yet']);
                        }}
                        className="px-4.5 py-2 rounded-full border border-[#ECEFF3] bg-white text-sm font-semibold text-[#555A68] hover:text-[#1A1B25] hover:border-[#C1C7CF] flex items-center gap-2 cursor-pointer transition shadow-2xs whitespace-nowrap"
                      >
                        <span>💳</span>
                        <span>Payment</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusQuestion('What is your meal RSVP?');
                          setStatusOptions(['Standard', 'Vegetarian', 'Halal']);
                        }}
                        className="px-4.5 py-2 rounded-full border border-[#ECEFF3] bg-white text-sm font-semibold text-[#555A68] hover:text-[#1A1B25] hover:border-[#C1C7CF] flex items-center gap-2 cursor-pointer transition shadow-2xs whitespace-nowrap"
                      >
                        <span>🍱</span>
                        <span>Meal RSVP</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-sm sm:text-base font-medium text-[#1A1B25]">
                        Wheel Option
                      </label>
                      <button
                        type="button"
                        onClick={handleAddStatusOption}
                        className="font-bold text-sm sm:text-base text-[#D97706] hover:text-[#B45309] flex items-center gap-1 cursor-pointer transition"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add option
                      </button>
                    </div>

                    <div className="bg-[#F6F8FA] rounded-3xl p-4 sm:p-5 space-y-3.5">
                      {statusOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="w-5 text-sm sm:text-base font-bold text-[#808897] shrink-0 text-left">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateStatusOption(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs focus:border-[#C1C7CF] transition placeholder:text-[#A4ABB8]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveStatusOption(idx)}
                            disabled={statusOptions.length <= 2}
                            className="p-2 text-[#A4ABB8] hover:text-[#1A1B25] transition cursor-pointer shrink-0 disabled:opacity-20"
                            title="Delete option"
                          >
                            <Trash2 className="w-5 h-5 stroke-[1.8]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(deciderType === 'wheel_spinner' || deciderType === 'blind_pick') && (
                <div className="space-y-4">
                  {/* Decision Question / Topic Input */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1B25] mb-2">
                      Question for the group
                    </label>
                    <input
                      type="text"
                      value={spinnerQuestion}
                      onChange={(e) => setSpinnerQuestion(e.target.value)}
                      placeholder={deciderType === 'wheel_spinner' ? 'Which game should we play first?' : 'Which activity first?'}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white border border-[#E5E7EB] text-sm font-semibold text-[#1A1B25] outline-none shadow-xs placeholder:text-[#9CA3AF] focus:border-[#1A1B25] transition"
                      required
                    />
                  </div>

                  {/* Options List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#1A1B25]">
                        Options ({spinnerOptions.length})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSpinnerOption}
                        disabled={spinnerOptions.length >= 12}
                        className="text-xs text-[#1A1B25] font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {spinnerOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs">
                          <span 
                            className="w-3.5 h-3.5 rounded-full shrink-0 ml-1.5 shadow-2xs"
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
                              className="p-0.5 rounded text-[#808897] hover:text-[#1A1B25] disabled:opacity-20 cursor-pointer"
                              title="Move up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSpinnerOption(idx, 'down')}
                              disabled={idx === spinnerOptions.length - 1}
                              className="p-0.5 rounded text-[#808897] hover:text-[#1A1B25] disabled:opacity-20 cursor-pointer"
                              title="Move down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateSpinnerOption(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-transparent outline-none font-semibold text-[#1A1B25]"
                            required
                          />

                          {spinnerOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpinnerOption(idx)}
                              className="p-1.5 mr-1 rounded-xl text-[#808897] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                              title="Delete option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="pt-1">
                    <span className="block text-[11px] font-bold text-[#808897] mb-1.5">
                      Quick Presets
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSpinnerQuestion('Which game should we play first?');
                          setSpinnerOptions(['Catan', 'Monopoly', 'Uno', 'Scrabble', 'Chess']);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] font-semibold transition cursor-pointer"
                      >
                        🎲 Board Games
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpinnerQuestion('Where should we eat?');
                          setSpinnerOptions(['KFC', 'Chicken Republic', 'Kilimanjaro', 'The Place', "Domino's"]);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] font-semibold transition cursor-pointer"
                      >
                        🍔 Dining
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpinnerQuestion('Which activity should we do next?');
                          setSpinnerOptions(['Beach Volleyball', 'Karaoke Session', 'Board Games', 'Cocktails']);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] font-semibold transition cursor-pointer"
                      >
                        🎯 Activities
                      </button>
                    </div>
                  </div>

                  {/* Interactive Wheel Spinner Preview Card */}
                  <div className="p-4 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1.5 text-center sm:text-left">
                      <span className="text-xs font-bold text-[#1A1B25] block">
                        Interactive Wheel Spinner 🎡
                      </span>
                      <p className="text-[11px] text-[#666D80] leading-relaxed max-w-xs">
                        {isSpinning 
                          ? 'Spinning the wheel...' 
                          : spinWinner 
                            ? `Selected result: "${spinWinner}"!` 
                            : `${spinnerOptions.length} balanced choices configured. Test spin below:`}
                      </p>
                      <button
                        type="button"
                        onClick={handleSpinTest}
                        disabled={isSpinning || spinnerOptions.length < 2}
                        className="mt-1 px-4 py-1.5 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50 inline-block"
                      >
                        {isSpinning ? 'Spinning...' : 'Spin Wheel'}
                      </button>
                    </div>

                    <div className="w-24 h-24 sm:w-28 sm:h-28 relative shrink-0">
                      <div 
                        className="w-full h-full transition-transform duration-[2500ms] ease-out drop-shadow-sm"
                        style={{ transform: `rotate(${wheelRotation}deg)` }}
                      >
                        <svg viewBox="-50 -50 100 100" className="w-full h-full">
                          {spinnerOptions.map((_, i) => {
                            const N = spinnerOptions.length;
                            const angle = 360 / N;
                            const a1 = (i * angle * Math.PI) / 180;
                            const a2 = ((i + 1) * angle * Math.PI) / 180;
                            const x1 = 44 * Math.sin(a1);
                            const y1 = -44 * Math.cos(a1);
                            const x2 = 44 * Math.sin(a2);
                            const y2 = -44 * Math.cos(a2);
                            const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'];
                            return (
                              <path
                                key={i}
                                d={`M 0 0 L ${x1} ${y1} A 44 44 0 0 1 ${x2} ${y2} Z`}
                                fill={colors[i % colors.length]}
                                stroke="#FFF"
                                strokeWidth="1.5"
                              />
                            );
                          })}
                          <circle r="12" fill="#1A1B25" stroke="#FFF" strokeWidth="2" />
                          <circle r="4" fill="#FFF" />
                        </svg>
                      </div>
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 drop-shadow-xs">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-[#1A1B25]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule & Time */}
              <div className="pt-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <label htmlFor="edit-toggle-plan-datetime" className="text-base font-bold text-[#1A1B25] block cursor-pointer">
                      Plan Schedule & Time
                    </label>
                    <p className="text-sm text-[#808897] mt-0.5">
                      Optional structure date and real time for countdown, tracking and schedule
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
                    <input
                      id="edit-toggle-plan-datetime"
                      type="checkbox"
                      checked={hasDateTime}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasDateTime(checked);
                        setScheduleError(null);
                        if (checked && !planDateTime) {
                          const currentNow = new Date();
                          const future = new Date(currentNow.getTime() + 2 * 60 * 60 * 1000);
                          const m = future.getMinutes();
                          const roundedM = m === 0 ? 0 : m <= 15 ? 15 : m <= 30 ? 30 : m <= 45 ? 45 : 0;
                          if (roundedM === 0 && m > 45) future.setHours(future.getHours() + 1);
                          future.setMinutes(roundedM);
                          future.setSeconds(0);
                          future.setMilliseconds(0);
                          setPlanDateTime(future.toISOString());
                          setPlanDate(formatOrdinalDate(future.getFullYear(), future.getMonth(), future.getDate()));
                          setPlanTime(formatHumanTime(future));
                          setHasSpecificTime(true);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#DFE1E6] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EAA21F]"></div>
                  </label>
                </div>

                {scheduleError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold">
                    {scheduleError}
                  </div>
                )}

                {hasDateTime && (
                  <div className="pt-1 animate-in fade-in duration-150">
                    <DateTimePicker
                      id="edit-plan-date-time-picker"
                      initialIso={planDateTime}
                      initialDate={planDate}
                      initialTime={planTime}
                      initialHasSpecificTime={hasSpecificTime}
                      deciderType={deciderType}
                      onChange={(val) => {
                        setScheduleError(null);
                        setPlanDateTime(val.iso);
                        setPlanDate(val.date);
                        setPlanTime(val.time);
                        setHasSpecificTime(val.hasSpecificTime);
                      }}
                      onClear={() => {
                        setScheduleError(null);
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
        <div className="shrink-0 sticky bottom-0 z-20 bg-[#F8F9FB] sm:bg-[#F8F9FB] border-t border-[#ECEFF3] px-6 py-5 flex items-center justify-center">
          <button
            type="submit"
            form="edit-plan-form"
            className="w-full max-w-md py-4 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-base transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Save plan changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
