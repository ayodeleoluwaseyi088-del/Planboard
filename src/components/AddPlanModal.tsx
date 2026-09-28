import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Vote, 
  Info, 
  CheckSquare, 
  Camera, 
  Users, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  ChevronUp, 
  ChevronDown,
  BadgeCheck,
  Upload,
  Move
} from 'lucide-react';
import { AttachedPlan, DeciderType, ItemPriority, UserPersona, BoardMember, ImagePosition } from '../types';
import { SUGGESTED_PLANS, SuggestedPlanTemplate } from '../mockData';
import { ImagePickerField } from './ImagePickerField';
import { DateTimePicker } from './DateTimePicker';
import { formatDecisionDeadline, formatOrdinalDate, formatHumanTime } from '../utils/dateTime';
import { DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';
import { CornerCheckBadge } from './SelectionBadge';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlan?: (plan: AttachedPlan) => void;
  onAddPlans?: (plans: AttachedPlan[]) => void;
  currentPersona?: UserPersona;
  members?: BoardMember[];
  existingPlanTitles?: string[];
}

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
];

const EMOJI_OPTIONS = [
  '💵', '📍', '🥤', '🎵', '🍔', '🚗', '🎈', '🎨', '🎁', '🎂', '📸', 
  '🎮', '🏨', '🏖️', '🥂', '🍽️', '🏕️', '🎟️', '🍕', '🎤', '🚤'
];

export const AddPlanModal: React.FC<AddPlanModalProps> = ({
  isOpen,
  onClose,
  onAddPlan,
  onAddPlans,
  currentPersona,
  members = [],
  existingPlanTitles = [],
}) => {
  // Step 1: Select Suggested Plan OR Customize Your Own
  // Step 2: Decider Type
  // Step 3: Required Decider Configuration
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Plan identity
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📍');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<ItemPriority>('required');
  const [selectedTemplate, setSelectedTemplate] = useState<SuggestedPlanTemplate | null>(null);

  // "Customize Your Own" inputs on Step 1
  const [customTitle, setCustomTitle] = useState('');
  const [customEmoji, setCustomEmoji] = useState('💵');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Step 2: Decider Type
  const [deciderType, setDeciderType] = useState<DeciderType | null>(null);

  // Step 3: Configuration Fields
  // Voting
  const [votingQuestion, setVotingQuestion] = useState('');
  const [votingOptions, setVotingOptions] = useState<string[]>(['Option 1', 'Option 2']);
  const [votingDeadline, setVotingDeadline] = useState('Voting closes in 2 days');

  // Fixed Info
  const [fixedInfoValue, setFixedInfoValue] = useState('');

  // Task / Duty
  const [taskDescription, setTaskDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [taskDeadline, setTaskDeadline] = useState('Open for volunteers');

  // Photo / Idea
  const [ideaDescription, setIdeaDescription] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
  ]);
  const [selectedPhoto, setSelectedPhoto] = useState(
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80'
  );
  const [photoPosition, setPhotoPosition] = useState<ImagePosition>({ x: 50, y: 35 });
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartPosY, setDragStartPosY] = useState(35);

  // Participant Status (Check-in / Attendance / Payment)
  const [statusQuestion, setStatusQuestion] = useState('Who will be attending the party');
  const [statusOptions, setStatusOptions] = useState<string[]>(['I will', 'Maybe', 'Not avaavailable']);

  // Fun Deciders: Wheel Spinner & Blind Pick
  const [spinnerQuestion, setSpinnerQuestion] = useState('');
  const [spinnerOptions, setSpinnerOptions] = useState<string[]>([
    'KFC',
    'Chicken Republic',
    'Kilimanjaro',
    'The Place',
    "Domino's",
  ]);

  // Optional Structured Date & Time for this Plan
  const [hasDateTime, setHasDateTime] = useState(false);
  const [planDateTime, setPlanDateTime] = useState<string | undefined>(undefined);
  const [planDate, setPlanDate] = useState('');
  const [planTime, setPlanTime] = useState('');
  const [hasSpecificTime, setHasSpecificTime] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTitle('');
      setEmoji('📍');
      setCategory('General');
      setPriority('required');
      setSelectedTemplate(null);
      setCustomTitle('');
      setCustomEmoji('💵');
      setShowCustomInput(false);
      setDeciderType(null);
      setStatusQuestion('Who will be attending the party');
      setStatusOptions(['I will', 'Maybe', 'Not avaavailable']);
      setSpinnerQuestion('What kind of games should we play?');
      setSpinnerOptions(['PS4', 'PS5', 'X Box']);
      setIsSubmitting(false);
      setUploadedPhotos([
        'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
      ]);
      setSelectedPhoto(
        'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80'
      );
      setPhotoPosition({ x: 50, y: 35 });
      setHasDateTime(false);
      setPlanDateTime(undefined);
      setPlanDate('');
      setPlanTime('');
      setHasSpecificTime(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle choosing a suggested plan template
  const handleSelectSuggestedPlan = (template: SuggestedPlanTemplate) => {
    if (existingPlanTitles.some((t) => t.toLowerCase() === template.title.toLowerCase())) {
      return;
    }

    setSelectedTemplate(template);
    setTitle(template.title);
    setEmoji(template.emoji);
    setCategory(template.category);
    setDeciderType(null);

    // Populate intelligent defaults based on template
    if (template.defaultVoting) {
      setVotingQuestion(template.defaultVoting.question);
      setVotingOptions([...template.defaultVoting.options]);
      setVotingDeadline(template.defaultVoting.deadlineText);
    } else {
      setVotingQuestion(`Which ${template.title.toLowerCase()} option do you prefer?`);
      setVotingOptions(['Option 1', 'Option 2']);
      setVotingDeadline('Voting closes in 2 days');
    }

    if (template.defaultFixedInfo) {
      setFixedInfoValue(template.defaultFixedInfo.value);
    } else {
      setFixedInfoValue(`${template.title} guidelines set.`);
    }

    if (template.defaultTaskDuty) {
      setTaskDescription(template.defaultTaskDuty.description);
      setTaskDeadline('Complete before event day');
    } else {
      setTaskDescription(`Coordinate and handle ${template.title.toLowerCase()} for the group.`);
      setTaskDeadline('Open for volunteers');
    }

    if (template.defaultPhotoIdea) {
      setIdeaDescription(template.defaultPhotoIdea.description);
      setSelectedPhoto(template.defaultPhotoIdea.imageUrl);
    } else {
      setIdeaDescription(`Submit photos, visual ideas, or references for ${template.title.toLowerCase()}.`);
      setSelectedPhoto(PRESET_PHOTOS[0]);
    }

    if (template.defaultParticipantStatus) {
      setStatusQuestion(template.defaultParticipantStatus.question);
      setStatusOptions([...template.defaultParticipantStatus.options]);
    } else {
      setStatusQuestion(`Who will be participating in ${template.title.toLowerCase()}?`);
      setStatusOptions(['I will', 'Maybe', 'Not available']);
    }

    if (template.id === 'sug-plan-datetime' || template.category === 'Schedule' || template.title.toLowerCase().includes('date')) {
      setHasDateTime(true);
      setPlanDateTime('2026-08-22T14:00:00');
      setPlanDate('Saturday, August 22, 2026');
      setPlanTime('02:00 PM');
      setHasSpecificTime(true);
    } else {
      setHasDateTime(false);
      setPlanDateTime(undefined);
      setPlanDate('');
      setPlanTime('');
      setHasSpecificTime(true);
    }

    // Advance to Step 2: Decider Type
    setStep(2);
  };

  // Handle continuing with custom plan from Step 1
  const handleSelectCustomPlan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTitle.trim()) return;

    if (existingPlanTitles.some((t) => t.toLowerCase() === customTitle.trim().toLowerCase())) {
      return;
    }

    setSelectedTemplate(null);
    setTitle(customTitle.trim());
    setEmoji(customEmoji);
    setCategory('Custom');
    setDeciderType(null);

    // Default configuration
    setVotingQuestion(`What should we do for ${customTitle.trim()}?`);
    setVotingOptions(['Option 1', 'Option 2']);
    setVotingDeadline('Voting closes in 2 days');
    setFixedInfoValue(`${customTitle.trim()} ground rules set.`);
    setTaskDescription(`Coordinate and organize ${customTitle.trim()} for the group.`);
    setTaskDeadline('Open for volunteers');
    setIdeaDescription(`Submit ideas and references for ${customTitle.trim()}.`);
    setSelectedPhoto(PRESET_PHOTOS[0]);
    setStatusQuestion(`Who will be participating in ${customTitle.trim()}?`);
    setStatusOptions(['I will', 'Maybe', 'Not available']);

    // Advance to Step 2: Decider Type
    setStep(2);
  };

  // Voting options manipulation
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

  // Participant Status options manipulation
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

  // Step 2 -> Step 3 transition
  const handleProceedToStep3 = () => {
    if (!deciderType) return;

    // Ensure default questions/values exist for chosen decider type
    if (deciderType === 'voting' && !votingQuestion.trim()) {
      setVotingQuestion(`What is your choice for ${title}?`);
    } else if (deciderType === 'fixed_info' && !fixedInfoValue.trim()) {
      setFixedInfoValue(`${title} has been decided.`);
    } else if (deciderType === 'task_duty' && !taskDescription.trim()) {
      setTaskDescription(`Handle and coordinate ${title} for the group.`);
    } else if (deciderType === 'photo_idea' && !ideaDescription.trim()) {
      setIdeaDescription(`Submit photos and ideas for ${title}.`);
    } else if (deciderType === 'participant_status' && !statusQuestion.trim()) {
      setStatusQuestion(`Who will be participating in ${title}?`);
    } else if ((deciderType === 'wheel_spinner' || deciderType === 'blind_pick') && !spinnerQuestion.trim()) {
      setSpinnerQuestion(`What should we choose for ${title}?`);
    }

    setStep(3);
  };

  // Save / Add Plan finalization
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    // Validate that schedule/deadline is in the future
    if (hasDateTime) {
      if (!planDateTime || new Date(planDateTime).getTime() <= Date.now()) {
        setScheduleError('Decision deadline cannot be in the past. Please select a future date and time.');
        return;
      }
    }
    setScheduleError(null);
    setIsSubmitting(true);

    const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newPlan: AttachedPlan = {
      id: planId,
      title: title.trim(),
      emoji,
      category,
      deciderType: deciderType || undefined,
      priority,
      status: 'active',
    };

    if (deciderType === 'voting') {
      const validOptions = votingOptions
        .filter((o) => o.trim().length > 0)
        .map((optLabel, idx) => ({
          id: `opt-${planId}-${idx}`,
          label: optLabel.trim(),
          emoji: '🔘',
          voteCount: 0,
          voterIds: [],
        }));

      newPlan.question = votingQuestion.trim() || `Vote on ${title.trim()}`;
      newPlan.options = validOptions.length >= 2 ? validOptions : [
        { id: `opt-${planId}-0`, label: 'Option 1', emoji: '🔘', voteCount: 0, voterIds: [] },
        { id: `opt-${planId}-1`, label: 'Option 2', emoji: '🔘', voteCount: 0, voterIds: [] },
      ];
      newPlan.deadlineText = votingDeadline.trim() || 'Voting closes in 2 days';
      newPlan.description = newPlan.question;
    } else if (deciderType === 'fixed_info') {
      newPlan.infoValue = fixedInfoValue.trim() || `${title.trim()} ground rule set.`;
      newPlan.fixedBy = currentPersona?.name || 'Owner';
      newPlan.description = newPlan.infoValue;
      newPlan.status = 'confirmed';
    } else if (deciderType === 'task_duty') {
      const chosenAssignee = members.find((m) => m.id === assigneeId);
      newPlan.taskDesc = taskDescription.trim() || `Handle ${title.trim()}`;
      newPlan.assigneeId = assigneeId || undefined;
      newPlan.assigneeName = chosenAssignee ? chosenAssignee.name : undefined;
      newPlan.deadlineText = taskDeadline.trim() || 'Open for volunteers';
      newPlan.description = newPlan.taskDesc;
    } else if (deciderType === 'photo_idea') {
      newPlan.ideaDesc = ideaDescription.trim() || `Submit ideas for ${title.trim()}`;
      newPlan.imageUrl = selectedPhoto;
      newPlan.imagePosition = photoPosition;
      newPlan.description = newPlan.ideaDesc;
    } else if (deciderType === 'participant_status') {
      const validStatusOptions = statusOptions
        .filter((o) => o.trim().length > 0)
        .map((optLabel, idx) => {
          const lower = optLabel.toLowerCase();
          const badgeEmoji = lower.includes('paid') ? '💳' :
            lower.includes('not') || lower.includes('unavail') ? '❌' :
            lower.includes('will') || lower.includes('yes') || lower.includes('attend') ? '✅' :
            lower.includes('maybe') ? '🤔' : '🔘';
          return {
            id: `status-opt-${planId}-${idx}`,
            label: optLabel.trim(),
            emoji: badgeEmoji,
            color: lower.includes('paid') || lower.includes('will') || lower.includes('yes') ? 'emerald' :
                   lower.includes('maybe') ? 'amber' :
                   lower.includes('not') ? 'rose' : 'indigo',
          };
        });

      newPlan.statusQuestion = statusQuestion.trim() || `Who will be participating in ${title.trim()}?`;
      newPlan.statusOptions = validStatusOptions.length >= 2 ? validStatusOptions : [
        { id: `status-opt-${planId}-0`, label: 'I will', emoji: '✅', color: 'emerald' },
        { id: `status-opt-${planId}-1`, label: 'Maybe', emoji: '🤔', color: 'amber' },
        { id: `status-opt-${planId}-2`, label: 'Not available', emoji: '❌', color: 'rose' },
      ];
      newPlan.description = newPlan.statusQuestion;
      newPlan.participantStatuses = {};
    } else if (deciderType === 'wheel_spinner' || deciderType === 'blind_pick') {
      const validOptions = spinnerOptions
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      const finalOptions = validOptions.length >= 2 
        ? validOptions 
        : ['Option 1', 'Option 2'];

      newPlan.spinnerQuestion = spinnerQuestion.trim() || `What should we choose for ${title.trim()}?`;
      newPlan.spinnerOptions = finalOptions;
      newPlan.description = newPlan.spinnerQuestion;
      newPlan.status = 'active';
    }

    if (hasDateTime && planDateTime) {
      const parsedDate = new Date(planDateTime);
      if (isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
        setScheduleError('Decision deadline cannot be in the past. Please select a future date and time.');
        return;
      }
      newPlan.dateTime = planDateTime;
      newPlan.deadlineIso = planDateTime;
      newPlan.date = planDate.trim() || undefined;
      newPlan.time = planTime.trim() || undefined;
      newPlan.hasSpecificTime = hasSpecificTime;
      newPlan.deadlineText = formatDecisionDeadline(parsedDate, deciderType || undefined);
    }

    if (onAddPlan) {
      onAddPlan(newPlan);
    } else if (onAddPlans) {
      onAddPlans([newPlan]);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl md:max-w-2xl rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="shrink-0 px-6 py-5 bg-white border-b border-[#F0F2F5] sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="w-11 h-11 rounded-full bg-[#F4F6F8] hover:bg-[#EBEEF2] text-[#525768] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                </button>
              ) : null}
              <div>
                <h3 className="text-[22px] font-bold text-[#1A1B25] tracking-tight leading-tight">
                  {step === 1 && 'Select Plan'}
                  {step === 2 && 'Select Decider'}
                  {step === 3 && 'Configure Decider'}
                </h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-[#EFF1F4] text-[#808897] text-[11px] font-bold uppercase tracking-wider">
                  STEP {step} OF 3
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-[#F4F6F8] hover:bg-[#EBEEF2] text-[#525768] hover:text-[#1A1B25] flex items-center justify-center transition cursor-pointer active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 pb-8 space-y-5">
          {/* ========================================================================= */}
          {/* STEP 1: Select Suggested Plan OR Customize Your Own                      */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-[#1A1B25]">
                    Suggested Plan Templates
                  </span>
                  <span className="text-[11px] text-[#666D80] font-bold">
                    Click card to proceed
                  </span>
                </div>
                <p className="text-xs text-[#666D80] mb-3 leading-relaxed">
                  Choose a curated plan template with pre-configured settings, or design your own custom plan below.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {SUGGESTED_PLANS.map((template) => {
                    const isAlreadyOnBoard = existingPlanTitles.some(
                      (t) => t.toLowerCase() === template.title.toLowerCase()
                    );

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelectSuggestedPlan(template)}
                        className="p-3.5 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] transition cursor-pointer text-left flex flex-col justify-between select-none group active:scale-[0.98]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-xl shadow-xs">
                            {template.emoji}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#808897] group-hover:text-[#1A1B25] group-hover:translate-x-0.5 transition" />
                        </div>

                        <div>
                          <h4 className="text-xs sm:text-sm font-black leading-tight text-[#1A1B25]">
                            {template.title}
                          </h4>
                          <p className="text-[11px] text-[#666D80] font-bold mt-0.5 line-clamp-1 leading-snug">
                            {template.category}
                          </p>
                        </div>

                        {isAlreadyOnBoard ? (
                          <span className="mt-2 inline-block text-[10px] font-black text-[#666D80] bg-[#ECEFF3] px-2 py-0.5 rounded-lg">
                            Already on board
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customize Your Own Section (Strictly designed to Image 1 and Image 2) */}
              <div className="pt-2">
                <div className="p-6 sm:p-7 rounded-3xl bg-[#F8F9FB] space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#1A1B25]">
                      Create Custom Plan
                    </h3>
                    <p className="text-sm sm:text-base text-[#808897] mt-1 font-normal">
                      Have a specific topic, game, or activity in mind?
                    </p>
                  </div>

                  {!showCustomInput ? (
                    /* Image 1: Collapsed State */
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(true)}
                      className="w-full py-4 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-base font-bold transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center mt-2"
                    >
                      Customise Topic
                    </button>
                  ) : (
                    /* Image 2: Expanded State */
                    <form onSubmit={handleSelectCustomPlan} className="space-y-4 pt-1">
                      {/* Input Row: Emoji Selector + Title Input */}
                      <div className="flex items-center gap-3">
                        {/* Emoji Picker Button */}
                        <div className="relative w-16 sm:w-20 h-14 sm:h-16 rounded-2xl bg-white border border-[#ECEFF3] flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs hover:border-[#DFE1E6] transition">
                          <span className="text-2xl leading-none select-none">{customEmoji}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-[#808897]" />
                          <select
                            value={customEmoji}
                            onChange={(e) => setCustomEmoji(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-base"
                            title="Select emoji"
                          >
                            {EMOJI_OPTIONS.map((em) => (
                              <option key={em} value={em}>
                                {em}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Title Input */}
                        <input
                          type="text"
                          autoFocus
                          placeholder="Board title"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          className="flex-1 h-14 sm:h-16 px-5 rounded-2xl bg-white border border-[#ECEFF3] text-base font-semibold text-[#1A1B25] placeholder:text-[#A4ABB8] outline-none shadow-2xs focus:border-[#C1C7CF] transition"
                        />
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-3">
                        {/* Cancel / Close Circular Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomTitle('');
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#E5E8EB] hover:bg-[#DFE1E6] text-[#1A1B25] flex items-center justify-center transition cursor-pointer shrink-0 shadow-2xs active:scale-95"
                          title="Cancel"
                        >
                          <X className="w-5 h-5 stroke-[2.2]" />
                        </button>

                        {/* Continue Button */}
                        <button
                          type="submit"
                          disabled={!customTitle.trim()}
                          className="flex-1 h-14 sm:h-16 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white text-base font-bold flex items-center justify-center transition cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Continue to Decider
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Decider Type Selection                                           */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-6 pt-1">
              {/* Selected Plan Identity Header */}
              <div className="flex items-center gap-4">
                <span className="text-5xl select-none leading-none shrink-0">{emoji || '🎮'}</span>
                <div>
                  <h4 className="text-xl font-bold text-[#1A1B25] leading-tight">
                    {title}
                  </h4>
                  <p className="text-sm text-[#808897] mt-1 font-normal leading-normal">
                    Select how the group will collaborate or make decisions for this plan.
                  </p>
                </div>
              </div>

              {/* Decider Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    type: 'voting' as DeciderType,
                    label: 'Voting',
                    emoji: '🗳️',
                    desc: 'Members votes between multiple options to decide the winer',
                  },
                  {
                    type: 'fixed_info' as DeciderType,
                    label: 'Fixed Info',
                    isBadge: true,
                    desc: 'Lock in firm ground rule, address or BYOB guidelines',
                  },
                  {
                    type: 'task_duty' as DeciderType,
                    label: 'Duty/Task',
                    emoji: '🎯',
                    desc: 'Members votes between multiple options to decide the winer',
                  },
                  {
                    type: 'photo_idea' as DeciderType,
                    label: 'Photo / Idea',
                    emoji: '🖼️',
                    desc: 'Members votes between multiple options to decide the winer',
                  },
                  {
                    type: 'participant_status' as DeciderType,
                    label: 'Participant Status',
                    emoji: '🧑‍🤝‍🧑',
                    desc: 'Members votes between multiple options to decide the winer',
                  },
                  {
                    type: 'wheel_spinner' as DeciderType,
                    label: 'Wheel Spinner',
                    emoji: '🎡',
                    desc: 'Members votes between multiple options to decide the winer',
                  },
                  {
                    type: 'blind_pick' as DeciderType,
                    label: 'Blind Pick',
                    emoji: '🎴',
                    desc: 'Members votes between multiple options to decide the winer',
                  },
                ].map((d) => {
                  const isSelected = deciderType === d.type;

                  return (
                    <button
                      key={d.type}
                      type="button"
                      onClick={() => setDeciderType(d.type)}
                      className={`relative p-5 rounded-2xl text-left transition cursor-pointer flex flex-col justify-start select-none ${
                        isSelected
                          ? 'bg-[#FFF9EE] border-2 border-[#EAA21F] shadow-xs'
                          : 'bg-[#F8F9FA] hover:bg-[#F0F2F5] border-2 border-transparent'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#EAA21F] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                        </div>
                      )}

                      <div className="flex items-center gap-2.5">
                        {d.isBadge ? (
                          <BadgeCheck className="w-6 h-6 text-white fill-[#3B82F6] shrink-0" />
                        ) : (
                          <span className="text-2xl select-none leading-none shrink-0">{d.emoji}</span>
                        )}
                        <span className="text-base font-bold text-[#1A1B25]">{d.label}</span>
                      </div>

                      <p className="text-[13px] text-[#808897] leading-relaxed mt-2.5 font-normal">
                        {d.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Required Decider Configuration                                   */}
          {/* ========================================================================= */}
          {step === 3 && (
            <form id="decider-config-form" onSubmit={handleSavePlan} className="space-y-5">
              {/* Selected Plan & Decider Summary */}
              <div className="flex items-center gap-3.5 py-1">
                <span className="text-3xl sm:text-4xl select-none leading-none shrink-0">
                  {emoji || '📍'}
                </span>
                <div className="flex flex-col">
                  <h4 className="text-lg sm:text-xl font-bold text-[#1A1B25] leading-snug">
                    {title} (
                    {deciderType === 'photo_idea' && 'Photo/Idea'}
                    {deciderType === 'voting' && 'Voting'}
                    {deciderType === 'fixed_info' && 'Fixed Info'}
                    {deciderType === 'task_duty' && 'Duty/Task'}
                    {deciderType === 'participant_status' && 'Participant Status'}
                    {deciderType === 'wheel_spinner' && 'Wheel Spinner'}
                    {deciderType === 'blind_pick' && 'Blind Pick'}
                    )
                  </h4>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm font-semibold text-[#D97706] hover:text-[#B45309] underline underline-offset-4 cursor-pointer text-left mt-0.5 transition w-fit"
                  >
                    Change Decider
                  </button>
                </div>
              </div>

              {/* Decider Type 1: Voting Configuration */}
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

              {/* Decider Type 2: Fixed Info Configuration */}
              {deciderType === 'fixed_info' && (
                <div className="space-y-3.5 p-4 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                      Fixed Information / Ground Rule Content *
                    </label>
                    <textarea
                      rows={3}
                      value={fixedInfoValue}
                      onChange={(e) => setFixedInfoValue(e.target.value)}
                      placeholder="e.g. Everyone should bring their preferred drinks or bottle to share."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Decider Type 3: Task / Duty Configuration */}
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

              {/* Decider Type 4: Photo / Idea Configuration */}
              {deciderType === 'photo_idea' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1B25] mb-2.5">
                      Submission Prompt
                    </label>
                    <input
                      type="text"
                      value={ideaDescription}
                      onChange={(e) => setIdeaDescription(e.target.value)}
                      placeholder={title ? `Submit photo and visuals for ${title.toLowerCase()}` : "Submit photo and visuals for location"}
                      className="w-full px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs focus:border-[#C1C7CF] transition placeholder:text-[#808897]"
                    />
                  </div>

                  {/* Photo Upload Thumbnails & Repositioning Preview */}
                  <div className="space-y-4">
                    {/* Top Row: Square Thumbnails */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      {/* Click to upload square */}
                      <label className="aspect-square rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition select-none group">
                        <Upload className="w-5 h-5 text-[#1A1B25] stroke-[2.2] mb-1.5 transition-transform group-hover:-translate-y-0.5" />
                        <span className="text-xs sm:text-sm font-bold text-[#1A1B25] leading-tight">
                          Click to upload
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i];
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  const url = reader.result;
                                  setUploadedPhotos((prev) => [...prev, url]);
                                  setSelectedPhoto(url);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {/* Uploaded Thumbnails */}
                      {uploadedPhotos.map((imgUrl, idx) => {
                        const isSelected = selectedPhoto === imgUrl;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedPhoto(imgUrl)}
                            className={`aspect-square rounded-2xl overflow-hidden relative cursor-pointer transition select-none ${
                              isSelected
                                ? 'border-2 border-[#EAA21F] shadow-xs'
                                : 'border-2 border-transparent hover:border-[#DFE1E6]'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Uploaded photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Circular Close / Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedPhotos((prev) => {
                                  const nextList = prev.filter((_, i) => i !== idx);
                                  if (selectedPhoto === imgUrl) {
                                    setSelectedPhoto(nextList[0] || '');
                                  }
                                  return nextList;
                                });
                              }}
                              className="w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center absolute top-2 right-2 transition cursor-pointer z-10 shadow-xs"
                              title="Remove photo"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Large Image Banner with Drag to Reposition */}
                    {selectedPhoto && (
                      <div
                        onMouseDown={(e) => {
                          setIsDraggingPhoto(true);
                          setDragStartY(e.clientY);
                          setDragStartPosY(photoPosition.y);
                        }}
                        onMouseMove={(e) => {
                          if (!isDraggingPhoto) return;
                          const delta = e.clientY - dragStartY;
                          const newY = Math.max(0, Math.min(100, dragStartPosY - delta * 0.4));
                          setPhotoPosition((prev) => ({ ...prev, y: Math.round(newY) }));
                        }}
                        onMouseUp={() => setIsDraggingPhoto(false)}
                        onMouseLeave={() => setIsDraggingPhoto(false)}
                        onTouchStart={(e) => {
                          setIsDraggingPhoto(true);
                          setDragStartY(e.touches[0].clientY);
                          setDragStartPosY(photoPosition.y);
                        }}
                        onTouchMove={(e) => {
                          if (!isDraggingPhoto) return;
                          const delta = e.touches[0].clientY - dragStartY;
                          const newY = Math.max(0, Math.min(100, dragStartPosY - delta * 0.4));
                          setPhotoPosition((prev) => ({ ...prev, y: Math.round(newY) }));
                        }}
                        onTouchEnd={() => setIsDraggingPhoto(false)}
                        className="w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden relative shadow-xs border border-[#ECEFF3] bg-[#F6F8FA] cursor-grab active:cursor-grabbing select-none group"
                      >
                        {/* Drag to Reposition Badge */}
                        <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-[#1A1B25] shadow-xs select-none z-10 pointer-events-none">
                          <Move className="w-3.5 h-3.5 text-[#1A1B25]" />
                          <span>Drag to reposition</span>
                        </div>

                        <img
                          src={selectedPhoto}
                          alt="Large preview"
                          className="w-full h-full object-cover pointer-events-none transition-[object-position] duration-75"
                          style={{
                            objectPosition: `50% ${photoPosition.y}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Decider Type 5: Participant Status Configuration */}
              {deciderType === 'participant_status' && (
                <div className="space-y-5">
                  {/* Question for the group */}
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

                  {/* Preset Row */}
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

                  {/* Options List */}
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

              {/* Deciders 6 & 7: Wheel Spinner & Blind Pick Configuration */}
              {(deciderType === 'wheel_spinner' || deciderType === 'blind_pick') && (
                <div className="space-y-5">
                  {/* Question for the group */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-[#1A1B25] mb-2.5">
                      Question for the group
                    </label>
                    <input
                      type="text"
                      value={spinnerQuestion}
                      onChange={(e) => setSpinnerQuestion(e.target.value)}
                      placeholder="What kind of games should we play?"
                      className="w-full px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs focus:border-[#C1C7CF] transition placeholder:text-[#808897]"
                      required
                    />
                  </div>

                  {/* Preset Row */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-[#1A1B25] mb-2.5">
                      Preset
                    </label>
                    <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setSpinnerQuestion('Where should we grab food?');
                          handleLoadSpinnerPreset(['KFC', 'Burger King', "Domino's Pizza"]);
                        }}
                        className="px-4.5 py-2 rounded-full border border-[#ECEFF3] bg-white text-sm font-semibold text-[#555A68] hover:text-[#1A1B25] hover:border-[#C1C7CF] flex items-center gap-2 cursor-pointer transition shadow-2xs whitespace-nowrap"
                      >
                        <span>🍱</span>
                        <span>Fast Food/Dinning</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpinnerQuestion('What kind of games should we play?');
                          handleLoadSpinnerPreset(['PS4', 'PS5', 'X Box']);
                        }}
                        className="px-4.5 py-2 rounded-full border border-[#ECEFF3] bg-white text-sm font-semibold text-[#555A68] hover:text-[#1A1B25] hover:border-[#C1C7CF] flex items-center gap-2 cursor-pointer transition shadow-2xs whitespace-nowrap"
                      >
                        <span>🎮</span>
                        <span>Activities and Games</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpinnerQuestion('What playlist or music vibe?');
                          handleLoadSpinnerPreset(['Afrobeats & Amapiano', 'Throwback Hits', 'Chill House']);
                        }}
                        className="px-4.5 py-2 rounded-full border border-[#ECEFF3] bg-white text-sm font-semibold text-[#555A68] hover:text-[#1A1B25] hover:border-[#C1C7CF] flex items-center gap-2 cursor-pointer transition shadow-2xs whitespace-nowrap"
                      >
                        <span>🎶</span>
                        <span>Music Vibe</span>
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-sm sm:text-base font-medium text-[#1A1B25]">
                        {deciderType === 'wheel_spinner' ? 'Wheel Option' : 'Blind Pick Option'}
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSpinnerOption}
                        disabled={spinnerOptions.length >= 12}
                        className="font-bold text-sm sm:text-base text-[#D97706] hover:text-[#B45309] flex items-center gap-1 cursor-pointer transition disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add option
                      </button>
                    </div>

                    <div className="bg-[#F6F8FA] rounded-3xl p-4 sm:p-5 space-y-3.5">
                      {spinnerOptions.map((opt, idx) => {
                        const WHEEL_COLORS = ['#00B5B5', '#6366F1', '#F43F5E', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#8B5CF6'];
                        const sliceColor = WHEEL_COLORS[idx % WHEEL_COLORS.length];

                        return (
                          <div key={idx} className="flex items-center gap-3">
                            {/* Color Indicator Dot */}
                            <span 
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: sliceColor }}
                            />

                            {/* Reorder Chevrons (Up/Down) */}
                            <div className="flex flex-col items-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveSpinnerOption(idx, 'up')}
                                disabled={idx === 0}
                                className="text-[#666D80] hover:text-[#1A1B25] disabled:text-[#C1C7CF] disabled:hover:text-[#C1C7CF] transition cursor-pointer disabled:cursor-default"
                                title="Move up"
                              >
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSpinnerOption(idx, 'down')}
                                disabled={idx === spinnerOptions.length - 1}
                                className="text-[#666D80] hover:text-[#1A1B25] disabled:text-[#C1C7CF] disabled:hover:text-[#C1C7CF] transition cursor-pointer disabled:cursor-default"
                                title="Move down"
                              >
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>

                            {/* White Card Input */}
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateSpinnerOption(idx, e.target.value)}
                              placeholder={`Option ${idx + 1}`}
                              className="flex-1 px-5 py-4 rounded-2xl border border-[#ECEFF3] bg-white text-sm sm:text-base font-semibold text-[#1A1B25] outline-none shadow-2xs focus:border-[#C1C7CF] transition placeholder:text-[#A4ABB8]"
                              required
                            />

                            {/* Trash Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveSpinnerOption(idx)}
                              disabled={spinnerOptions.length <= 2}
                              className="p-2 text-[#A4ABB8] hover:text-[#1A1B25] transition cursor-pointer shrink-0 disabled:opacity-20"
                              title="Delete option"
                            >
                              <Trash2 className="w-5 h-5 stroke-[1.8]" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Live Preview Row */}
                      <div className="pt-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-[#808897] block">
                            Live preview
                          </span>
                          <span className="text-sm sm:text-base font-bold text-[#1A1B25]">
                            {spinnerOptions.length} balanced choices ready
                          </span>
                        </div>

                        <div className="w-11 h-11 relative shrink-0 rounded-full overflow-hidden shadow-2xs">
                          <svg viewBox="-50 -50 100 100" className="w-full h-full">
                            {spinnerOptions.map((_, i) => {
                              const WHEEL_COLORS = ['#00B5B5', '#6366F1', '#F43F5E', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#8B5CF6'];
                              const N = spinnerOptions.length;
                              const angle = 360 / N;
                              const a1 = (i * angle * Math.PI) / 180;
                              const a2 = ((i + 1) * angle * Math.PI) / 180;
                              const x1 = 50 * Math.sin(a1);
                              const y1 = -50 * Math.cos(a1);
                              const x2 = 50 * Math.sin(a2);
                              const y2 = -50 * Math.cos(a2);
                              return (
                                <path
                                  key={i}
                                  d={`M 0 0 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                                  fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                                />
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Plan Date & Time Configuration */}
              <div className="pt-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <label htmlFor="toggle-plan-datetime" className="text-base font-bold text-[#1A1B25] block cursor-pointer">
                      Plan Schedule & Time
                    </label>
                    <p className="text-sm text-[#808897] mt-0.5">
                      Optional structure date and real time for countdown, tracking and schedule
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
                    <input
                      id="toggle-plan-datetime"
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
                      id="add-plan-date-time-picker"
                      initialIso={planDateTime}
                      initialDate={planDate}
                      initialTime={planTime}
                      initialHasSpecificTime={hasSpecificTime}
                      deciderType={deciderType || undefined}
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
          )}
        </div>

        {/* Fixed / Sticky Bottom CTA Footer */}
        <div className="shrink-0 sticky bottom-0 z-20 bg-white border-t border-[#F0F2F5] px-6 py-5">
          {step === 2 ? (
            <button
              type="button"
              disabled={!deciderType}
              onClick={handleProceedToStep3}
              className="w-full py-4 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-base text-center transition cursor-pointer active:scale-[0.99] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Configure Decider
            </button>
          ) : (
            <div className="flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-full bg-[#F5F6F8] hover:bg-[#ECEFF3] text-xs sm:text-sm font-bold text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-full bg-[#F5F6F8] hover:bg-[#ECEFF3] text-xs sm:text-sm font-bold text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
              )}

              <div className="flex items-center gap-2">
                {step === 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!title) {
                        handleSelectSuggestedPlan(SUGGESTED_PLANS[0]);
                      } else {
                        setStep(2);
                      }
                    }}
                    className="py-3 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {step === 3 && (
                  <button
                    type="submit"
                    form="decider-config-form"
                    className="py-3 px-7 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save & Add Plan</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
