import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, Clock, MapPin, Tag, DollarSign, CheckCircle2, Crown } from 'lucide-react';
import { AttachedPlan, PlanStatus, UserPersona } from '../types';

interface PlanEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (plan: AttachedPlan) => void;
  planToEdit?: AttachedPlan | null;
  currentPersona: UserPersona;
  isOwner: boolean;
}

const EMOJI_OPTIONS = ['🏖️', '🥂', '🍽️', '🏕️', '🎮', '🥐', '🚗', '🎶', '☕', '🎉', '⚽', '🎨'];
const CATEGORY_OPTIONS = [
  'Main Event',
  'Day Activity',
  'Evening Afterparty',
  'Dinner & Feast',
  'Adventure & Outdoor',
  'Recovery & Debrief',
  'Social Hangout',
  'Travel & Convoy',
];

export const PlanEditorModal: React.FC<PlanEditorModalProps> = ({
  isOpen,
  onClose,
  onSavePlan,
  planToEdit,
  currentPersona,
  isOwner,
}) => {
  const isEditing = Boolean(planToEdit);

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🏖️');
  const [category, setCategory] = useState('Main Event');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [status, setStatus] = useState<PlanStatus>('active');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (planToEdit) {
      setTitle(planToEdit.title);
      setEmoji(planToEdit.emoji || '🏖️');
      setCategory(planToEdit.category || 'Main Event');
      setDescription(planToEdit.description || '');
      setDate(planToEdit.date || '');
      setTime(planToEdit.time || '');
      setLocation(planToEdit.location || '');
      setEstimatedCost(planToEdit.estimatedCost || '');
      setStatus(planToEdit.status || 'active');
      setIsPrimary(Boolean(planToEdit.isPrimary));
    } else {
      setTitle('');
      setEmoji('🏖️');
      setCategory('Main Event');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setEstimatedCost('');
      setStatus('active');
      setIsPrimary(false);
    }
  }, [planToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !isOwner) return;

    const planData: AttachedPlan = {
      id: planToEdit ? planToEdit.id : `plan-${Date.now()}`,
      title: title.trim(),
      emoji,
      category,
      deciderType: planToEdit?.deciderType || 'voting',
      description: description.trim(),
      date: date.trim() || undefined,
      time: time.trim() || undefined,
      location: location.trim() || undefined,
      estimatedCost: estimatedCost.trim() || undefined,
      status,
      isPrimary,
    };

    onSavePlan(planData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-bold shadow-xs">
              {emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-[#1A1B25]">
                  {isEditing ? 'Edit Attached Plan' : 'Add New Plan to Board'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-black">
                  <Crown className="w-2.5 h-2.5 text-amber-600" />
                  Owner Action
                </span>
              </div>
              <p className="text-xs text-[#666D80]">
                {isEditing
                  ? 'Update this plan’s details and commitments'
                  : 'Add an additional plan or track to this board'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F6F8FA] text-[#808897] hover:text-[#1A1B25] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {!isOwner && (
            <div className="p-3 bg-rose-50 rounded-2xl text-xs text-rose-800 font-semibold">
              🔒 Only the board owner has permission to manage plans. You can view this plan's details, but cannot save edits.
            </div>
          )}

          {/* Title & Emoji */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
              Plan Title & Emoji *
            </label>
            <div className="flex items-center gap-2">
              <select
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                disabled={!isOwner}
                className="px-3 py-2.5 rounded-2xl bg-[#F8F9FB] outline-none text-lg cursor-pointer disabled:opacity-50"
              >
                {EMOJI_OPTIONS.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Beach Day & Private Cabana or Sunset Afterparty"
                disabled={!isOwner}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F9FB] outline-none text-sm font-bold text-[#1A1B25] focus:bg-white disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!isOwner}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FB] outline-none text-xs font-bold text-[#1A1B25] disabled:opacity-50 cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlanStatus)}
                disabled={!isOwner}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FB] outline-none text-xs font-bold text-[#1A1B25] disabled:opacity-50 cursor-pointer"
              >
                <option value="active">Active (Planning)</option>
                <option value="confirmed">Confirmed (Locked In)</option>
                <option value="draft">Draft (Exploring)</option>
                <option value="optional">Optional Track</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Saturday, Sept 19"
                disabled={!isOwner}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8F9FB] outline-none text-xs font-semibold text-[#1A1B25] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                Time Window
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 12:00 PM - 06:00 PM"
                disabled={!isOwner}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8F9FB] outline-none text-xs font-semibold text-[#1A1B25] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Location & Estimated Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                Location / Venue
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Landmark Beach Cabana #4"
                disabled={!isOwner}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8F9FB] outline-none text-xs font-semibold text-[#1A1B25] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
                Estimated Cost / Budget
              </label>
              <input
                type="text"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="e.g. ₦8,500 / person or Free"
                disabled={!isOwner}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8F9FB] outline-none text-xs font-semibold text-[#1A1B25] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
              Description & Highlights
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this plan special? What are the key details and expectations?"
              disabled={!isOwner}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8F9FB] outline-none text-xs font-medium text-[#1A1B25] disabled:opacity-50"
            />
          </div>

          {/* Make Primary Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                disabled={!isOwner}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
              />
              <span className="text-xs font-bold text-[#1A1B25]">
                Set as Primary Plan on this board
              </span>
            </label>
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-xs font-bold text-[#353849] transition cursor-pointer"
            >
              Cancel
            </button>
            {isOwner && (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1A1B25] hover:bg-[#272835] text-white text-xs font-extrabold shadow-sm transition cursor-pointer active:scale-95"
              >
                {isEditing ? 'Save Plan Changes' : 'Add Plan to Board'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
