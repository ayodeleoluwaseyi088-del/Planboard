import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Camera,
  Vote,
  Trash2,
  Check,
  Flame,
  Clock,
  Filter,
  Layers,
  ArrowUpDown,
  RotateCcw,
  Move,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Grid as GridIcon,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SuggestionItem, UserPersona, AttachedPlan, ImagePosition } from '../types';
import { getImageStyle, DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';
import { ImageFramePositioner } from './ImageFramePositioner';

interface SuggestionsSectionProps {
  suggestions: SuggestionItem[];
  plans: AttachedPlan[];
  currentPersona: UserPersona;
  onToggleHeart: (suggestionId: string) => void;
  onSelectAsWinner: (suggestionId: string) => void;
  onTogglePutUpForVote: (suggestionId: string) => void;
  onDeleteSuggestion: (suggestionId: string) => void;
  onOpenAddSuggestion: (planId?: string) => void;
  onUpdateSuggestionPosition?: (suggestionId: string, position: ImagePosition, imageIndex?: number) => void;
}

export const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({
  suggestions,
  plans,
  currentPersona,
  onToggleHeart,
  onSelectAsWinner,
  onTogglePutUpForVote,
  onDeleteSuggestion,
  onOpenAddSuggestion,
  onUpdateSuggestionPosition,
}) => {
  // Owner and Assistant Admin can manage suggestions
  const canManage = currentPersona.role === 'owner' || currentPersona.role === 'admin';

  // Active filter by plan (or 'all')
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  
  // Sort order: 'likes' (Most liked → least liked) or 'newest'
  const [sortBy, setSortBy] = useState<'likes' | 'newest'>('likes');

  // Active image index for each card if it has multiple images
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});

  // Confirmation state for deleting a suggestion
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reposition modal state for suggestion
  const [repositioningSug, setRepositioningSug] = useState<SuggestionItem | null>(null);
  const [repositionImageIndex, setRepositionImageIndex] = useState(0);
  const [tempPosition, setTempPosition] = useState<ImagePosition>({ ...DEFAULT_IMAGE_POSITION });

  // Full image preview modal state
  const [previewSug, setPreviewSug] = useState<SuggestionItem | null>(null);
  const [previewActiveIndex, setPreviewActiveIndex] = useState<number>(0);
  const [previewViewMode, setPreviewViewMode] = useState<'focus' | 'grid'>('focus');

  // Keyboard shortcut listener for preview modal (Esc to close, Left/Right arrows to browse)
  useEffect(() => {
    if (!previewSug) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewSug(null);
      } else if (e.key === 'ArrowLeft') {
        const total = (previewSug.images && previewSug.images.length > 0) ? previewSug.images.length : 1;
        if (total > 1) {
          setPreviewActiveIndex((prev) => (prev - 1 + total) % total);
        }
      } else if (e.key === 'ArrowRight') {
        const total = (previewSug.images && previewSug.images.length > 0) ? previewSug.images.length : 1;
        if (total > 1) {
          setPreviewActiveIndex((prev) => (prev + 1) % total);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewSug]);

  // Group suggestions strictly by associated plan
  // If a suggestion has a planId, group by that. If planId is missing, fallback to category or title matching.
  const planGroups: {
    plan: AttachedPlan;
    suggestions: SuggestionItem[];
    totalLikes: number;
  }[] = plans.map((plan) => {
    const planSuggestions = suggestions.filter((s) => {
      if (s.planId) return s.planId === plan.id;
      // Fallback matching if legacy data
      return (
        s.category.toLowerCase().includes(plan.title.toLowerCase()) ||
        s.category.toLowerCase().includes((plan.category || '').toLowerCase())
      );
    });

    // Rank suggestions by likes: Most liked → least liked (or newest)
    const sorted = [...planSuggestions].sort((a, b) => {
      if (sortBy === 'likes') {
        if (b.heartCount !== a.heartCount) {
          return b.heartCount - a.heartCount;
        }
        return b.id.localeCompare(a.id);
      }
      return b.id.localeCompare(a.id);
    });

    const totalLikes = planSuggestions.reduce((acc, curr) => acc + curr.heartCount, 0);

    return {
      plan,
      suggestions: sorted,
      totalLikes,
    };
  });

  // Filter groups if a specific plan filter is active
  const displayedGroups = selectedPlanFilter === 'all'
    ? planGroups
    : planGroups.filter((g) => g.plan.id === selectedPlanFilter);

  // Total count of suggestions across all plans
  const totalSuggestionsCount = suggestions.length;

  return (
    <section id="suggestions-section" className="mb-8 scroll-mt-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-500">
            <Camera className="w-3.5 h-3.5" />
            <span>Visual Ideas • Plan Locked</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
            Visual Suggestions
          </h2>
          <p className="text-xs text-[#666D80]">
            Every suggestion belongs to a specific plan. Ranked by popularity (Most liked → least liked).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort order toggle */}
          <button
            onClick={() => setSortBy((prev) => (prev === 'likes' ? 'newest' : 'likes'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FB] border border-[#ECEFF3] text-xs font-extrabold text-[#353849] hover:bg-white transition cursor-pointer"
            title="Toggle sort order"
          >
            {sortBy === 'likes' ? (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Most Liked</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Newest</span>
              </>
            )}
          </button>

          {/* Suggest an Idea Button */}
          <button
            onClick={() => onOpenAddSuggestion()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1A1B25] hover:bg-[#272835] text-xs font-black text-white transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Suggest an Idea</span>
          </button>
        </div>
      </div>

      {/* Plan Selector Pills / Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedPlanFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
            selectedPlanFilter === 'all'
              ? 'bg-[#1A1B25] text-white shadow-xs'
              : 'bg-white border border-[#ECEFF3] text-[#353849] hover:bg-[#F6F8FA]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Plans ({totalSuggestionsCount})</span>
        </button>

        {plans.map((p) => {
          const count = suggestions.filter((s) => s.planId === p.id).length;
          const isSelected = selectedPlanFilter === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlanFilter(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-[#1A1B25] text-white shadow-xs'
                  : 'bg-white border border-[#ECEFF3] text-[#353849] hover:bg-[#F6F8FA]'
              }`}
            >
              <span>{p.emoji || '📌'}</span>
              <span>{p.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-[#ECEFF3] text-[#666D80]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Plan-Locked Groups */}
      <div className="space-y-8">
        {displayedGroups.map(({ plan, suggestions: planSuggestions, totalLikes }) => {
          // Current plan choice label
          const currentPlanSelection = plan.location || plan.infoValue || plan.finalDecision || plan.description;

          return (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border border-[#ECEFF3] p-5 shadow-xs transition-all hover:border-[#DFE1E6]"
            >
              {/* Plan Group Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#ECEFF3]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] flex items-center justify-center text-xl shrink-0 shadow-xs">
                    {plan.emoji || '📍'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-[#1A1B25]">
                        {plan.title}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F6F8FA] border border-[#DFE1E6] font-bold text-[#666D80]">
                        Plan ID: {plan.title.toLowerCase()}
                      </span>
                    </div>

                    {/* Current Selection / Value of the Plan */}
                    {currentPlanSelection && (
                      <p className="text-xs text-[#666D80] mt-0.5 flex items-center gap-1.5">
                        <span className="font-extrabold text-[#1A1B25]">Current Selection:</span>
                        <span className="truncate max-w-md bg-[#F8F9FB] px-2 py-0.5 rounded text-[#353849] font-medium border border-[#ECEFF3]">
                          {currentPlanSelection}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Plan Group Stats & Quick Suggest */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] font-bold text-[#666D80]">
                      {planSuggestions.length} {planSuggestions.length === 1 ? 'idea' : 'ideas'} • {totalLikes} {totalLikes === 1 ? 'like' : 'likes'}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenAddSuggestion(plan.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F8F9FB] border border-[#DFE1E6] hover:bg-[#ECEFF3] text-xs font-extrabold text-[#1A1B25] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-500" />
                    <span>Suggest for {plan.title}</span>
                  </button>
                </div>
              </div>

              {/* Suggestions Cards inside this Plan */}
              {planSuggestions.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-[#F8F9FB] border border-dashed border-[#DFE1E6]">
                  <p className="text-xs font-bold text-[#666D80] mb-2">
                    No visual suggestions yet for {plan.title}.
                  </p>
                  <button
                    onClick={() => onOpenAddSuggestion(plan.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-black text-[#1A1B25] transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-500" />
                    <span>Be the first to suggest an idea</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {planSuggestions.map((item, index) => {
                    const hasHearted = item.heartedByMemberIds.includes(currentPersona.id);
                    const isDeleting = deletingId === item.id;

                    const imagesList = item.images && item.images.length > 0
                      ? item.images
                      : [{ id: 'img-main', url: item.imageUrl, title: item.title, position: item.imagePosition }];
                    const activeIdx = activeImageIndices[item.id] !== undefined
                      ? Math.min(Math.max(0, activeImageIndices[item.id]), imagesList.length - 1)
                      : 0;
                    const currentImg = imagesList[activeIdx] || imagesList[0];
                    const isMulti = imagesList.length > 1;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setPreviewSug(item);
                          setPreviewActiveIndex(activeIdx);
                        }}
                        className={`rounded-2xl overflow-hidden border transition shadow-xs flex flex-col justify-between cursor-pointer group/card hover:shadow-md ${
                          item.isSelectedWinner
                            ? 'bg-emerald-50/20 border-emerald-400 ring-2 ring-emerald-500/20'
                            : item.isPutUpForVote
                            ? 'bg-indigo-50/20 border-indigo-300 ring-1 ring-indigo-500/20'
                            : 'bg-white border-[#ECEFF3] hover:border-[#DFE1E6]'
                        }`}
                        title="Click to view full photos and details"
                      >
                        <div>
                          {/* Image Card Container */}
                          <div className="relative h-44 w-full overflow-hidden bg-[#ECEFF3] group">
                            <img
                              src={currentImg.url}
                              alt={currentImg.title || item.title}
                              style={getImageStyle(currentImg.position || item.imagePosition)}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                            {/* Hover zoom pill hint */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <span className="px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transform scale-95 group-hover/card:scale-100 transition-transform">
                                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>View Full Photos</span>
                              </span>
                            </div>

                            {/* Multi-Image Carousel Controls */}
                            {isMulti && (
                              <div className="absolute inset-y-0 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndices((prev) => ({
                                      ...prev,
                                      [item.id]: (activeIdx - 1 + imagesList.length) % imagesList.length,
                                    }));
                                  }}
                                  className="pointer-events-auto w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer shadow-xs active:scale-90"
                                  title="Previous photo in suggestion group"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndices((prev) => ({
                                      ...prev,
                                      [item.id]: (activeIdx + 1) % imagesList.length,
                                    }));
                                  }}
                                  className="pointer-events-auto w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer shadow-xs active:scale-90"
                                  title="Next photo in suggestion group"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Top Badges */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
                              <div className="flex items-center gap-1.5">
                                {/* Popularity Rank Badge */}
                                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-black flex items-center gap-1">
                                  {index === 0 && sortBy === 'likes' ? (
                                    <>
                                      <Flame className="w-3 h-3 text-amber-400" />
                                      <span>#1 Top Liked</span>
                                    </>
                                  ) : (
                                    <span>#{index + 1}</span>
                                  )}
                                </span>

                                {/* Grouped Multi-Image Pill Badge */}
                                {isMulti && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                                    <Layers className="w-3 h-3" />
                                    <span>{imagesList.length} Photos</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Reposition Photo Button */}
                                {onUpdateSuggestionPosition && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRepositioningSug(item);
                                      setRepositionImageIndex(activeIdx);
                                      setTempPosition(currentImg.position || item.imagePosition || { ...DEFAULT_IMAGE_POSITION });
                                    }}
                                    className="p-1 rounded-md bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition cursor-pointer"
                                    title="Drag and adjust photo position"
                                  >
                                    <Move className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Voting Status Badge */}
                                {item.isPutUpForVote && (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                                    <Vote className="w-3 h-3" />
                                    <span>In Voting</span>
                                  </span>
                                )}

                                {/* Selected Winner Badge */}
                                {item.isSelectedWinner && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Current Selection ✓</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Bottom info on image */}
                            <div className="absolute bottom-2 left-2.5 right-2.5 text-white flex items-center justify-between z-10">
                              <span className="text-[11px] font-bold text-white/95 truncate">
                                Suggested by {item.authorName}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isMulti && (
                                  <span className="text-[10px] font-black bg-black/60 backdrop-blur-xs text-white/90 px-1.5 py-0.5 rounded">
                                    {activeIdx + 1} / {imagesList.length}
                                  </span>
                                )}
                                <span className="text-[10px] font-black text-rose-300 bg-black/60 px-1.5 py-0.5 rounded">
                                  {item.heartCount} ❤️
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Body Details */}
                          <div className="p-3.5">
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#666D80] mb-1">
                              <span>{plan.emoji} {plan.title}</span>
                            </div>
                            <h4 className="text-sm font-extrabold text-[#1A1B25] mb-1 leading-snug">
                              {item.title}
                            </h4>
                            <p className="text-xs text-[#666D80] line-clamp-2">
                              {item.description}
                            </p>

                            {/* Multi-Image Thumbnail Gallery Tray */}
                            {isMulti && (
                              <div className="mt-3 pt-2.5 border-t border-[#ECEFF3]">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-[#666D80] flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-amber-500" />
                                    <span>Grouped Visuals ({imagesList.length})</span>
                                  </span>
                                  <span className="text-[10px] font-bold text-[#808897] truncate max-w-[130px]">
                                    {currentImg.title || `Photo #${activeIdx + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                  {imagesList.map((img, i) => (
                                    <button
                                      key={img.id || i}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImageIndices((prev) => ({ ...prev, [item.id]: i }));
                                      }}
                                      className={`relative shrink-0 w-11 h-9 rounded-lg overflow-hidden border transition cursor-pointer select-none ${
                                        i === activeIdx
                                          ? 'border-amber-500 ring-2 ring-amber-400 scale-105 shadow-xs'
                                          : 'border-[#DFE1E6] opacity-70 hover:opacity-100 hover:border-[#808897]'
                                      }`}
                                      title={img.title || `Photo #${i + 1}`}
                                    >
                                      <img
                                        src={img.url}
                                        alt={img.title || `Photo #${i + 1}`}
                                        style={getImageStyle(img.position)}
                                        className="w-full h-full object-cover"
                                      />
                                      <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-black/80 text-[8px] font-black text-white">
                                        #{i + 1}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Container */}
                        <div className="p-3 bg-[#F8F9FB] border-t border-[#ECEFF3] space-y-2">
                          {/* Top Row: Heart Reaction Button + Quick Like Count */}
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleHeart(item.id);
                                if (!hasHearted) {
                                  confetti({ particleCount: 30, spread: 45, origin: { y: 0.85 } });
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                                hasHearted
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'bg-white text-[#353849] border border-[#DFE1E6] hover:bg-rose-50 hover:text-rose-600'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${hasHearted ? 'fill-white' : 'fill-none'}`} />
                              <span>{item.heartCount} {item.heartCount === 1 ? 'like' : 'likes'}</span>
                            </button>

                            {/* Owner / Assistant Admin: Delete Action */}
                            {canManage && (
                              <div>
                                {isDeleting ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSuggestion(item.id);
                                        setDeletingId(null);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black hover:bg-rose-700 transition cursor-pointer"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingId(null);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-[#ECEFF3] text-[#353849] text-[11px] font-bold hover:bg-[#DFE1E6] transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingId(item.id);
                                    }}
                                    className="p-1.5 rounded-lg text-[#808897] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    title="Delete suggestion (without affecting plan)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Owner & Assistant Admin Actions Bar */}
                          {canManage && (
                            <div className="pt-2 border-t border-[#ECEFF3] grid grid-cols-2 gap-1.5">
                              {/* 1. Put Selected Suggestions Up for Vote */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePutUpForVote(item.id);
                                }}
                                className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${
                                  item.isPutUpForVote
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : 'bg-white border border-[#DFE1E6] text-[#353849] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                                }`}
                                title={item.isPutUpForVote ? 'Click to remove from vote' : 'Put this suggestion up for voting'}
                              >
                                <Vote className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {item.isPutUpForVote ? 'In Voting Poll ✓' : 'Put Up for Vote'}
                                </span>
                              </button>

                              {/* 2. Use Suggestion to Replace Existing Selection (Does NOT lock plan) - Reversible via Undo */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectAsWinner(item.id);
                                  if (!item.isSelectedWinner) {
                                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                                  }
                                }}
                                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer active:scale-98 ${
                                  item.isSelectedWinner
                                    ? 'bg-emerald-700 hover:bg-rose-600 text-white shadow-xs'
                                    : 'bg-[#1A1B25] text-white hover:bg-emerald-600 shadow-xs'
                                }`}
                                title={
                                  item.isSelectedWinner
                                    ? "Click to undo / revert this selection and restore previous plan value"
                                    : "Set as current selection for this plan (plan remains fully editable)"
                                }
                              >
                                {item.isSelectedWinner ? (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Undo Selection</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Use Suggestion</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reposition Suggestion Image Modal */}
      {repositioningSug && (() => {
        const repImages = repositioningSug.images && repositioningSug.images.length > 0
          ? repositioningSug.images
          : [{ id: 'img-main', url: repositioningSug.imageUrl, title: repositioningSug.title, position: repositioningSug.imagePosition }];
        const currentRepImg = repImages[repositionImageIndex] || repImages[0];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DFE1E6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#ECEFF3]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Move className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1A1B25]">Reposition Suggestion Photo</h3>
                    <p className="text-xs text-[#666D80] truncate max-w-xs">{repositioningSug.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRepositioningSug(null)}
                  className="p-1.5 rounded-xl text-[#808897] hover:bg-[#F6F8FA] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {repImages.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#666D80] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Select Photo to Reposition ({repImages.length} photos)</span>
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {repImages.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => {
                          setRepositionImageIndex(idx);
                          setTempPosition(img.position || { ...DEFAULT_IMAGE_POSITION });
                        }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none shrink-0 ${
                          repositionImageIndex === idx
                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300 shadow-xs'
                            : 'border-[#DFE1E6] bg-white text-[#353849] hover:bg-[#F6F8FA]'
                        }`}
                      >
                        <img src={img.url} className="w-5 h-5 rounded object-cover" />
                        <span>Photo #{idx + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ImageFramePositioner
                imageUrl={currentRepImg.url}
                position={tempPosition}
                onChange={setTempPosition}
                aspectRatio="video"
                containerClassName="h-52 rounded-2xl overflow-hidden"
              />

              <div className="flex items-center justify-between pt-2 border-t border-[#ECEFF3]">
                <button
                  type="button"
                  onClick={() => setTempPosition({ ...DEFAULT_IMAGE_POSITION })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#666D80] hover:bg-[#F6F8FA] transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRepositioningSug(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#666D80] hover:bg-[#F6F8FA] border border-[#DFE1E6] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateSuggestionPosition && repositioningSug) {
                        onUpdateSuggestionPosition(repositioningSug.id, tempPosition, repositionImageIndex);
                      }
                      setRepositioningSug(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-[#1A1B25] hover:bg-black transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Position</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Visual Suggestion — Full Image Preview Modal */}
      {previewSug && (() => {
        const previewImages = previewSug.images && previewSug.images.length > 0
          ? previewSug.images
          : [
              {
                id: 'img-main',
                url: previewSug.imageUrl,
                title: previewSug.title,
                position: previewSug.imagePosition,
              },
            ];
        const activeIdx = Math.min(Math.max(0, previewActiveIndex), previewImages.length - 1);
        const currentImg = previewImages[activeIdx] || previewImages[0];
        const isMulti = previewImages.length > 1;

        return (
          <div
            id="suggestion-full-image-preview-modal"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setPreviewSug(null);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#DFE1E6] overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEFF3] bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#666D80] bg-[#ECEFF3] px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        {previewSug.category}
                      </span>
                      {isMulti && (
                        <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>{previewImages.length} Photos</span>
                        </span>
                      )}
                      {previewSug.isSelectedWinner && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Current Selection</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-[#1A1B25] truncate mt-0.5">
                      {previewSug.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* If multi-image, toggle between Single Focus & All Photos Grid */}
                  {isMulti && (
                    <div className="flex items-center bg-[#ECEFF3] p-0.5 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPreviewViewMode('focus')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition cursor-pointer select-none ${
                          previewViewMode === 'focus'
                            ? 'bg-white text-[#1A1B25] shadow-xs font-black'
                            : 'text-[#666D80] hover:text-[#1A1B25]'
                        }`}
                        title="Focus viewer with carousel"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Focus</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewMode('grid')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition cursor-pointer select-none ${
                          previewViewMode === 'grid'
                            ? 'bg-white text-[#1A1B25] shadow-xs font-black'
                            : 'text-[#666D80] hover:text-[#1A1B25]'
                        }`}
                        title="View all photos together side by side"
                      >
                        <GridIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">All Photos</span>
                      </button>
                    </div>
                  )}

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setPreviewSug(null)}
                    className="p-2 rounded-xl text-[#808897] hover:bg-[#F6F8FA] hover:text-[#1A1B25] transition cursor-pointer"
                    title="Close preview (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Image Viewers */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#F8F9FB]">
                {previewViewMode === 'focus' || !isMulti ? (
                  <div className="space-y-3">
                    {/* Large Main Viewport Stage */}
                    <div className="relative w-full h-[46vh] sm:h-[54vh] bg-[#1A1B25] rounded-2xl overflow-hidden flex items-center justify-center select-none shadow-inner group">
                      <img
                        src={currentImg.url}
                        alt={currentImg.title || previewSug.title}
                        className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300"
                      />

                      {/* Multi-image Prev/Next controls */}
                      {isMulti && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewActiveIndex((activeIdx - 1 + previewImages.length) % previewImages.length);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer shadow-lg active:scale-90"
                            title="Previous photo (Left Arrow)"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewActiveIndex((activeIdx + 1) % previewImages.length);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer shadow-lg active:scale-90"
                            title="Next photo (Right Arrow)"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>

                          {/* Image index counter badge */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-black">
                            Photo {activeIdx + 1} of {previewImages.length}
                          </div>
                        </>
                      )}

                      {/* Photo caption / title */}
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white pointer-events-none">
                        <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold max-w-md truncate">
                          {currentImg.title || `Photo #${activeIdx + 1}`}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white/80">
                          Full View
                        </span>
                      </div>
                    </div>

                    {/* All Photos Shown Together in Multi-Image Gallery Strip */}
                    {isMulti && (
                      <div className="bg-white p-3.5 rounded-2xl border border-[#ECEFF3] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#1A1B25] flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-amber-500" />
                            <span>All {previewImages.length} Photos in this Suggestion</span>
                          </span>
                          <span className="text-[11px] font-medium text-[#666D80]">
                            Click any photo to view in full size
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                          {previewImages.map((img, i) => (
                            <button
                              key={img.id || i}
                              type="button"
                              onClick={() => setPreviewActiveIndex(i)}
                              className={`relative rounded-xl overflow-hidden aspect-video border-2 transition cursor-pointer select-none group/thumb ${
                                i === activeIdx
                                  ? 'border-amber-500 ring-2 ring-amber-400 scale-[1.02] shadow-xs'
                                  : 'border-[#DFE1E6] opacity-75 hover:opacity-100 hover:border-[#808897]'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.title || `Photo ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-black text-white">
                                #{i + 1}
                              </span>
                              {img.title && (
                                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-bold text-white px-1 py-0.5 truncate text-left">
                                  {img.title}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Grid View: All Photos Displayed Together */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-2xl border border-[#ECEFF3]">
                      <span className="text-xs font-black text-[#1A1B25] flex items-center gap-1.5">
                        <GridIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>All {previewImages.length} Images Shown Together</span>
                      </span>
                      <span className="text-[11px] text-[#666D80] font-medium">
                        Click any image to enlarge in focus viewer
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {previewImages.map((img, i) => (
                        <div
                          key={img.id || i}
                          onClick={() => {
                            setPreviewActiveIndex(i);
                            setPreviewViewMode('focus');
                          }}
                          className="bg-white rounded-2xl overflow-hidden border border-[#ECEFF3] hover:border-[#DFE1E6] shadow-xs cursor-pointer group transition hover:shadow-md"
                        >
                          <div className="relative h-56 w-full bg-[#1A1B25] flex items-center justify-center p-1">
                            <img
                              src={img.url}
                              alt={img.title || `Photo #${i + 1}`}
                              className="max-h-full max-w-full object-contain"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-black">
                              Photo #{i + 1}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                              <span className="px-3 py-1.5 rounded-xl bg-white text-[#1A1B25] text-xs font-black shadow-lg flex items-center gap-1.5">
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Enlarge</span>
                              </span>
                            </div>
                          </div>
                          {img.title && (
                            <div className="p-3 bg-white border-t border-[#ECEFF3]">
                              <h5 className="text-xs font-bold text-[#1A1B25] truncate">
                                {img.title}
                              </h5>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestion Description & Details Box */}
                <div className="bg-white p-4 rounded-2xl border border-[#ECEFF3] space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-[#666D80]">
                      Suggested by <span className="font-black text-[#1A1B25]">{previewSug.authorName}</span>
                    </span>
                    <span className="text-xs font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                      {previewSug.heartCount} {previewSug.heartCount === 1 ? 'Heart' : 'Hearts'} ❤️
                    </span>
                  </div>
                  {previewSug.description && (
                    <p className="text-xs sm:text-sm text-[#353849] leading-relaxed">
                      {previewSug.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#ECEFF3] bg-white shrink-0">
                <span className="text-xs font-medium text-[#808897]">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-[#ECEFF3] font-mono text-[10px] text-[#353849]">Esc</kbd> or click outside to exit
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewSug(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-[#353849] bg-[#ECEFF3] hover:bg-[#DFE1E6] transition cursor-pointer select-none"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
