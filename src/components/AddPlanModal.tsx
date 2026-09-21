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
  Clock,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { AttachedPlan, DeciderType, ItemPriority, UserPersona, BoardMember, ImagePosition } from '../types';
import { SUGGESTED_PLANS, SuggestedPlanTemplate } from '../mockData';
import { ImagePickerField } from './ImagePickerField';
import { DateTimePicker } from './DateTimePicker';
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

const EMOJI_OPTIONS = ['📍', '🥤', '🎵', '🍔', '🚗', '🎈', '🎨', '🎁', '🎂', '📸', '🎮', '🏨', '🏖️', '🥂', '🍽️', '🏕️', '🎟️', '🍕', '🎤', '🚤'];

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
  const [customEmoji, setCustomEmoji] = useState('✨');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Step 2: Decider Type
  const [deciderType, setDeciderType] = useState<DeciderType>('voting');

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
  const [selectedPhoto, setSelectedPhoto] = useState(PRESET_PHOTOS[0]);
  const [photoPosition, setPhotoPosition] = useState<ImagePosition>({ ...DEFAULT_IMAGE_POSITION });

  // Participant Status (Check-in / Attendance / Payment)
  const [statusQuestion, setStatusQuestion] = useState('');
  const [statusOptions, setStatusOptions] = useState<string[]>(['I will', 'Maybe', 'Not available']);

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
      setCustomEmoji('✨');
      setShowCustomInput(false);
      setDeciderType('voting');
      setStatusQuestion('');
      setStatusOptions(['I will', 'Maybe', 'Not available']);
      setSpinnerQuestion('');
      setSpinnerOptions([
        'KFC',
        'Chicken Republic',
        'Kilimanjaro',
        'The Place',
        "Domino's",
      ]);
      setIsSubmitting(false);
      setSelectedPhoto(PRESET_PHOTOS[0]);
      setPhotoPosition({ ...DEFAULT_IMAGE_POSITION });
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
    setDeciderType(template.defaultDeciderType);

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
    setDeciderType('voting');

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
    setIsSubmitting(true);

    const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newPlan: AttachedPlan = {
      id: planId,
      title: title.trim(),
      emoji,
      category,
      deciderType,
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

    if (hasDateTime) {
      newPlan.dateTime = planDateTime;
      newPlan.date = planDate.trim() || undefined;
      newPlan.time = planTime.trim() || undefined;
      newPlan.hasSpecificTime = hasSpecificTime;
    }

    if (onAddPlan) {
      onAddPlan(newPlan);
    } else if (onAddPlans) {
      onAddPlans([newPlan]);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Top Header & Breadcrumb */}
        <div className="shrink-0 px-6 py-4 bg-[#F8F9FB] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#ECEFF3] text-[#666D80] hover:text-[#1A1B25] flex items-center justify-center transition cursor-pointer"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Step {step} of 3
                </span>
                <span className="text-[10px] font-extrabold text-[#808897]">
                  {step === 1 && '• Select Plan'}
                  {step === 2 && '• Choose Decider'}
                  {step === 3 && '• Configuration'}
                </span>
              </div>
              <h3 className="text-base font-black text-[#1A1B25]">
                {step === 1 && 'Add Plan'}
                {step === 2 && `Decider Type: ${title}`}
                {step === 3 && `Configure ${title}`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#ECEFF3] text-[#808897] hover:text-[#1A1B25] flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 pb-8">
          {/* ========================================================================= */}
          {/* STEP 1: Select Suggested Plan OR Customize Your Own                      */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black uppercase tracking-wider text-[#1A1B25]">
                    Suggested Plans
                  </label>
                  <span className="text-[11px] text-[#808897] font-semibold">
                    Click to select and continue
                  </span>
                </div>
                <p className="text-xs text-[#666D80] mb-3">
                  Pick a suggested category to configure its decider, or customize your own topic below.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SUGGESTED_PLANS.map((template) => {
                    const isAlreadyOnBoard = existingPlanTitles.includes(template.title);

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelectSuggestedPlan(template)}
                        className="p-3 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] transition cursor-pointer text-left flex flex-col justify-between select-none group active:scale-98"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{template.emoji}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#808897] group-hover:text-[#1A1B25] transition" />
                        </div>

                        <div>
                          <h4 className="text-xs font-black leading-tight text-[#1A1B25]">
                            {template.title}
                          </h4>
                          <p className="text-[10px] text-[#666D80] mt-0.5 line-clamp-1 leading-snug">
                            {template.category}
                          </p>
                        </div>

                        {isAlreadyOnBoard && (
                          <span className="mt-1.5 inline-block text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            On Board
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customize Your Own Section */}
              <div className="pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#1A1B25]">
                    Customize Your Own
                  </label>
                  {!showCustomInput && (
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(true)}
                      className="text-xs font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Custom Plan</span>
                    </button>
                  )}
                </div>

                {showCustomInput ? (
                  <form onSubmit={handleSelectCustomPlan} className="p-3.5 rounded-2xl bg-[#F6F8FA] space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 shrink-0">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666D80] mb-1">
                          Emoji
                        </label>
                        <select
                          value={customEmoji}
                          onChange={(e) => setCustomEmoji(e.target.value)}
                          className="w-full py-1.5 px-2 text-base rounded-xl bg-white text-center font-bold cursor-pointer outline-none"
                        >
                          {EMOJI_OPTIONS.map((em) => (
                            <option key={em} value={em}>
                              {em}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666D80] mb-1">
                          Plan Title
                        </label>
                        <input
                          type="text"
                          autoFocus
                          placeholder="e.g. Photography, Board Games, Afterparty..."
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-white font-bold text-[#1A1B25] outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomTitle('');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-[#666D80] hover:text-[#1A1B25] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!customTitle.trim()}
                        className="px-4 py-1.5 text-xs font-extrabold rounded-xl bg-[#1A1B25] text-white disabled:opacity-40 cursor-pointer flex items-center gap-1"
                      >
                        <span>Continue to Decider Type</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#666D80] hover:text-[#1A1B25] transition text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Have a specific topic in mind? Click to customize your own plan</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Decider Type Selection                                           */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-[#F6F8FA] flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <h4 className="text-xs font-black text-[#1A1B25]">{title}</h4>
                  <p className="text-[11px] text-[#666D80]">
                    Select how the group will collaborate or make decisions for this plan.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1A1B25] mb-2">
                  Choose Decider Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      type: 'voting' as DeciderType,
                      label: 'Voting',
                      icon: Vote,
                      badge: '🗳️ Group Voting',
                      color: 'text-rose-600',
                      desc: 'Members vote between multiple options to decide the winner.',
                    },
                    {
                      type: 'fixed_info' as DeciderType,
                      label: 'Fixed Info',
                      icon: Info,
                      badge: 'ℹ️ Ground Rule',
                      color: 'text-emerald-600',
                      desc: 'Lock in firm ground rules, address, or BYOB guidelines.',
                    },
                    {
                      type: 'task_duty' as DeciderType,
                      label: 'Task / Duty',
                      icon: CheckSquare,
                      badge: '🎯 Volunteer Duty',
                      color: 'text-blue-600',
                      desc: 'Assign responsibility to a specific volunteer or leave open.',
                    },
                    {
                      type: 'photo_idea' as DeciderType,
                      label: 'Photo / Idea',
                      icon: Camera,
                      badge: '📸 Visual Moodboard',
                      color: 'text-amber-600',
                      desc: 'Collect outfit inspirations, venue photos, or suggestions.',
                    },
                    {
                      type: 'participant_status' as DeciderType,
                      label: 'Participant Status',
                      icon: Users,
                      badge: '👥 Check-in & Status',
                      color: 'text-indigo-600',
                      desc: 'Track attendance, RSVP, payment, or custom status across all joined members.',
                    },
                    {
                      type: 'wheel_spinner' as DeciderType,
                      label: 'Wheel Spinner 🎡',
                      icon: Sparkles,
                      badge: '🎡 Fun Decider',
                      color: 'text-amber-800',
                      desc: 'Interactive spin-the-wheel mini-game to choose randomly between options.',
                    },
                    {
                      type: 'blind_pick' as DeciderType,
                      label: 'Blind Pick 🎴',
                      icon: Sparkles,
                      badge: '🎴 Fun Decider',
                      color: 'text-purple-600',
                      desc: 'Mystery card draw mini-game to pick a surprise option face down.',
                    },
                  ].map((d) => {
                    const Icon = d.icon;
                    const isSelected = deciderType === d.type;

                    return (
                      <button
                        key={d.type}
                        type="button"
                        onClick={() => setDeciderType(d.type)}
                        className={`relative p-3.5 rounded-2xl text-left transition cursor-pointer flex flex-col justify-between select-none ${
                          isSelected
                            ? 'bg-[#FFF9F0] text-[#1A1B25] shadow-xs'
                            : 'bg-[#F8F9FB] text-[#1A1B25] hover:bg-[#ECEFF3]'
                        }`}
                      >
                        {isSelected && <CornerCheckBadge size="sm" />}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#EFA00E]' : d.color}`} />
                            <span className="text-xs font-black">{d.label}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#666D80] leading-snug">
                          {d.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="pt-2">
                <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                  Plan Priority
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
                          : 'bg-[#F8F9FB] text-[#666D80] hover:bg-[#ECEFF3]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Required Decider Configuration                                   */}
          {/* ========================================================================= */}
          {step === 3 && (
            <form id="decider-config-form" onSubmit={handleSavePlan} className="space-y-4">
              <div className="p-3 rounded-2xl bg-[#F6F8FA] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <h4 className="text-xs font-black text-[#1A1B25]">{title}</h4>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      {deciderType === 'voting' && '🗳️ Voting Decider'}
                      {deciderType === 'fixed_info' && 'ℹ️ Fixed Information'}
                      {deciderType === 'task_duty' && '🎯 Task / Duty'}
                      {deciderType === 'photo_idea' && '📸 Photo / Idea'}
                      {deciderType === 'participant_status' && '👥 Participant Status'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-[#808897] hover:text-[#1A1B25] underline cursor-pointer"
                >
                  Change Decider
                </button>
              </div>

              {/* Decider Type 1: Voting Configuration */}
              {deciderType === 'voting' && (
                <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                      Question for the Group
                    </label>
                    <input
                      type="text"
                      value={votingQuestion}
                      onChange={(e) => setVotingQuestion(e.target.value)}
                      placeholder={`e.g. Which ${title.toLowerCase()} option do you prefer?`}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none font-bold"
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
                        className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
                            placeholder={`Option ${i + 1}`}
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-white outline-none"
                            required
                          />
                          {votingOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVotingOption(i)}
                              className="p-1 text-[#808897] hover:text-rose-600 transition cursor-pointer"
                              title="Delete option"
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
                      placeholder="e.g. Voting closes Friday 6:00 PM"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Decider Type 2: Fixed Info Configuration */}
              {deciderType === 'fixed_info' && (
                <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                      Fixed Information / Ground Rule Content
                    </label>
                    <textarea
                      rows={3}
                      value={fixedInfoValue}
                      onChange={(e) => setFixedInfoValue(e.target.value)}
                      placeholder="e.g. Everyone should bring their preferred drinks or bottle to share."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Decider Type 3: Task / Duty Configuration */}
              {deciderType === 'task_duty' && (
                <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                      Task Instructions / Scope
                    </label>
                    <textarea
                      rows={2}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder={`e.g. Coordinate and handle ${title.toLowerCase()} for the group.`}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none"
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
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none cursor-pointer"
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
                      Target Completion Time / Deadline
                    </label>
                    <input
                      type="text"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      placeholder="e.g. Complete before event day"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Decider Type 4: Photo / Idea Configuration */}
              {deciderType === 'photo_idea' && (
                <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                      Prompt for Submissions
                    </label>
                    <textarea
                      rows={2}
                      value={ideaDescription}
                      onChange={(e) => setIdeaDescription(e.target.value)}
                      placeholder={`e.g. Submit photos, ideas, or venue references for ${title.toLowerCase()}.`}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <ImagePickerField
                      id="add-plan-reference-photo-picker"
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

              {/* Decider Type 5: Participant Status Configuration */}
              {deciderType === 'participant_status' && (
                <div className="space-y-3.5 p-3.5 bg-[#F8F9FB] rounded-2xl">
                  {/* Explanatory Banner */}
                  <div className="p-3 rounded-xl bg-indigo-50/70 flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-black text-indigo-950">
                        Automatic Participant Roster
                      </p>
                      <p className="text-indigo-800 text-[11px] leading-relaxed mt-0.5">
                        This decider automatically pulls everyone who has joined this board ({members.length} member{members.length === 1 ? '' : 's'}). When members check in, they pick from your options below.
                      </p>
                    </div>
                  </div>

                  {/* Question */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                      Status Question or Prompt *
                    </label>
                    <input
                      type="text"
                      value={statusQuestion}
                      onChange={(e) => setStatusQuestion(e.target.value)}
                      placeholder="e.g. Who will be attending? or Who has made their payment?"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
                      required
                    />
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-[#808897] mb-1.5">
                      Quick Status Presets
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusQuestion('Who will be attending?');
                          setStatusOptions(['I will', 'Maybe', 'Not available']);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white text-[11px] font-bold text-[#1A1B25] hover:bg-amber-50 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>🙋 Attendance (I will / Maybe / Not available)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusQuestion('Who has made their payment?');
                          setStatusOptions(['Paid', 'Not yet']);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white text-[11px] font-bold text-[#1A1B25] hover:bg-amber-50 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>💳 Payment (Paid / Not yet)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusQuestion('What is your meal RSVP?');
                          setStatusOptions(['Standard', 'Vegetarian', 'Halal']);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white text-[11px] font-bold text-[#1A1B25] hover:bg-amber-50 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>🍽️ Meal RSVP</span>
                      </button>
                    </div>
                  </div>

                  {/* Selectable Options List */}
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
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white outline-none font-medium text-[#1A1B25]"
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
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#808897]">
                          Joined Participants Preview ({members.length})
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          Auto-synced from board
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-6 h-6 rounded-full object-cover"
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
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F8F9FB] text-[#666D80]"
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
                <div className="space-y-4 p-4 bg-[#F8F9FB] rounded-2xl">
                  {/* Explanatory Banner */}
                  <div className="p-3 rounded-xl bg-amber-50/80 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-black text-amber-950">
                        {deciderType === 'wheel_spinner' 
                          ? 'Interactive Game-Like Wheel Spinner 🎡' 
                          : 'Mystery Blind-Pick Cards 🎴'}
                      </p>
                      <p className="text-amber-900 text-[11px] leading-relaxed mt-0.5">
                        {deciderType === 'wheel_spinner'
                          ? 'Add your choices below. They automatically become colorful segments on the spinning wheel. When spun, the wheel decelerates and lands on the winner, immediately locking in the decision!'
                          : 'Add your choices below. They become face-down mystery cards. Tapping a card triggers a playful 3D flip animation to reveal the group choice!'}
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
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
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
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-white hover:bg-amber-50 text-[#353849] font-bold transition cursor-pointer"
                      >
                        🍔 Fast Food / Dining
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpinnerQuestion('Which activity should we do next?');
                          handleLoadSpinnerPreset(['Beach Volleyball', 'Board Game Tournament', 'Karaoke Session', 'Cocktail Making', 'Sunset Walk']);
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-white hover:bg-amber-50 text-[#353849] font-bold transition cursor-pointer"
                      >
                        🎯 Activities & Games
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpinnerQuestion('What party music vibe?');
                          handleLoadSpinnerPreset(['Afrobeats & Amapiano', 'Throwback 90s/2000s Hits', 'Chill House & Sunset', 'Hip-Hop & R&B']);
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-white hover:bg-amber-50 text-[#353849] font-bold transition cursor-pointer"
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
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white outline-none font-bold text-[#1A1B25]"
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
                  <div className="pt-3 flex items-center justify-between">
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
              <div className="p-3.5 bg-[#F8F9FB] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <label htmlFor="toggle-plan-datetime" className="text-xs font-black text-[#1A1B25] block cursor-pointer">
                        Plan Schedule & Time
                      </label>
                      <span className="text-[10px] text-[#666D80] font-medium block">
                        Optional structured date/time for real-time countdowns, tracking, and schedules
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      id="toggle-plan-datetime"
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
                      id="add-plan-date-time-picker"
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
          )}
        </div>

        {/* Fixed / Sticky Bottom CTA Footer */}
        <div className="shrink-0 sticky bottom-0 z-20 bg-[#F8F9FB] p-5 sm:p-6 rounded-b-3xl flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="flex items-center gap-1.5 px-4 py-3 sm:py-3.5 rounded-full bg-white hover:bg-[#ECEFF3] text-xs sm:text-sm font-bold text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 sm:py-3.5 rounded-full bg-white hover:bg-[#ECEFF3] text-xs sm:text-sm font-bold text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={handleProceedToStep3}
                className="py-3.5 sm:py-4 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-extrabold text-sm sm:text-base transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Configure Decider</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="submit"
                form="decider-config-form"
                className="py-3.5 sm:py-4 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white font-extrabold text-sm sm:text-base transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save & Add Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
