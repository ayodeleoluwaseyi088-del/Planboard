import React, { useState } from 'react';
import { 
  X, 
  Vote, 
  Camera, 
  CheckSquare, 
  CreditCard, 
  Info, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { ItemType, ItemPriority, UserPersona, AttachedPlan, ImagePosition } from '../types';
import { ImagePickerField } from './ImagePickerField';
import { DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: UserPersona;
  plans?: AttachedPlan[];
  onAddItem: (itemData: any) => void;
}

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
];

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  plans = [],
  onAddItem,
}) => {
  const [itemType, setItemType] = useState<ItemType>('decision');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<ItemPriority>('required');

  // Decision fields
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  // Suggestion fields
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [suggestionDesc, setSuggestionDesc] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_PHOTOS[0]);
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ ...DEFAULT_IMAGE_POSITION });

  // Task fields
  const [taskDesc, setTaskDesc] = useState('');
  const [assignToMe, setAssignToMe] = useState(false);

  // Contribution fields
  const [amount, setAmount] = useState('8500');

  // Information fields
  const [infoValue, setInfoValue] = useState('');

  if (!isOpen) return null;

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleUpdateOption = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (itemType === 'decision') {
      const validOpts = options.filter((o) => o.trim().length > 0);
      onAddItem({
        type: 'decision',
        category: category.trim() || '🗳️ VOTE',
        title: title.trim() || 'Group Vote',
        question: question.trim() || title.trim(),
        options: validOpts.map((lbl, idx) => ({
          id: `opt-${Date.now()}-${idx}`,
          label: lbl,
          emoji: '🔘',
          voteCount: 0,
          voterIds: [],
        })),
        totalVotesNeeded: 12,
        deadlineText: 'Closes in 2 days',
        priority,
        status: 'open',
        createdBy: currentPersona.id,
      });
    } else if (itemType === 'suggestion') {
      const targetPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
      onAddItem({
        type: 'suggestion',
        category: targetPlan ? `${targetPlan.emoji || '📍'} ${targetPlan.title}` : (category.trim() || '📍 SUGGESTION'),
        title: title.trim(),
        description: suggestionDesc.trim(),
        imageUrl: imageUrl.trim() || PRESET_PHOTOS[0],
        imagePosition,
        authorId: currentPersona.id,
        authorName: currentPersona.name,
        heartCount: 1,
        heartedByMemberIds: [currentPersona.id],
        isSelectedWinner: false,
        isPutUpForVote: false,
        status: 'open',
        priority,
        planId: targetPlan?.id,
        planTitle: targetPlan?.title,
        planEmoji: targetPlan?.emoji,
      });
    } else if (itemType === 'task') {
      onAddItem({
        type: 'task',
        category: category.trim() || '🎯 TASK',
        title: title.trim(),
        description: taskDesc.trim() || undefined,
        assigneeId: assignToMe ? currentPersona.id : undefined,
        assigneeName: assignToMe ? currentPersona.name : undefined,
        status: 'open',
        priority,
        deadlineText: 'Open for volunteers',
      });
    } else if (itemType === 'information') {
      onAddItem({
        type: 'information',
        category: category.trim() || 'ℹ️ INFO',
        title: title.trim(),
        value: infoValue.trim(),
        fixedBy: currentPersona.name,
        status: 'fixed',
        priority,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#ECEFF3] animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ECEFF3] flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#1A1B25]">
              Add to Plan Board
            </h3>
            <p className="text-xs text-[#666D80]">
              Decisions, visual ideas, duties, or fixed ground rules
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F6F8FA] text-[#808897] hover:text-[#1A1B25] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-2">
              Item Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'decision', label: 'Decision', icon: Vote, color: 'text-rose-600' },
                { type: 'suggestion', label: 'Idea / Photo', icon: Camera, color: 'text-rose-500' },
                { type: 'task', label: 'Task Duty', icon: CheckSquare, color: 'text-blue-600' },
                { type: 'information', label: 'Fixed Info', icon: Info, color: 'text-emerald-600' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = itemType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setItemType(item.type as ItemType)}
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-400'
                        : 'bg-[#F8F9FB] border-[#DFE1E6] text-[#353849] hover:bg-[#ECEFF3]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs font-extrabold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-1">
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                Tag / Emoji
              </label>
              <input
                type="text"
                placeholder="e.g. 🎵 MUSIC"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500 font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                Item Title
              </label>
              <input
                type="text"
                placeholder={itemType === 'decision' ? 'e.g. Lunch Catering' : 'e.g. Sound System & DJ'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500 font-bold"
                required
              />
            </div>
          </div>

          {/* Type Specific Fields */}
          {itemType === 'decision' && (
            <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                  Question for the Group
                </label>
                <input
                  type="text"
                  placeholder="e.g. What should we order for beach lunch?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
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
                    onClick={handleAddOption}
                    className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                </div>
                <div className="space-y-1.5">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => handleUpdateOption(i, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
                        required
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(i)}
                          className="p-1 text-[#808897] hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {itemType === 'suggestion' && (
            <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
              {plans.length > 0 && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                    Locked to Plan <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {plans.map((p) => {
                      const isSelected = p.id === selectedPlanId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#1A1B25] text-white shadow-xs'
                              : 'bg-white border border-[#DFE1E6] text-[#353849] hover:bg-[#F6F8FA]'
                          }`}
                        >
                          <span>{p.emoji || '📌'}</span>
                          <span>{p.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                  Why do you recommend this?
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Great sunset views, cabana space, cheap drinks..."
                  value={suggestionDesc}
                  onChange={(e) => setSuggestionDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
                />
              </div>

              <div>
                <ImagePickerField
                  id="create-item-suggestion-photo-picker"
                  label="Pick Visual Photo"
                  sublabel="Choose from system presets or upload from your device"
                  value={imageUrl}
                  onChange={setImageUrl}
                  position={imagePosition}
                  onPositionChange={setImagePosition}
                  systemImages={PRESET_PHOTOS}
                  aspectRatio="standard"
                />
              </div>
            </div>
          )}

          {itemType === 'task' && (
            <div className="space-y-3 p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                  Task Details / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="What needs to be done?"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#353849]">
                <input
                  type="checkbox"
                  checked={assignToMe}
                  onChange={(e) => setAssignToMe(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>I'll volunteer to handle this personally</span>
              </label>
            </div>
          )}

          {itemType === 'information' && (
            <div className="p-3.5 bg-[#F8F9FB] rounded-2xl border border-[#ECEFF3]">
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1">
                Fixed Information Value
              </label>
              <input
                type="text"
                placeholder="e.g. Central Park Gate 3 at 10:00 AM"
                value={infoValue}
                onChange={(e) => setInfoValue(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
                required
              />
            </div>
          )}

          {/* Priority Pill */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
              Priority in Plan Readiness
            </label>
            <div className="flex items-center gap-2">
              {(['required', 'important', 'optional'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition cursor-pointer ${
                    priority === p
                      ? 'bg-[#1A1B25] text-white'
                      : 'bg-[#F8F9FB] border border-[#DFE1E6] text-[#666D80]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-[#1A1B25] hover:bg-[#272835] text-white font-extrabold text-sm transition cursor-pointer shadow-md active:scale-98"
            >
              Add Item to Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
