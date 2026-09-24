import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Vote,
  Trash2,
  Check,
  Flame,
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
  Eye,
  Image as ImageIcon,
  ExternalLink
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Keyboard shortcut listener for preview modal (Esc to close, Left/Right arrows to browse)
  useEffect(() => {
    if (!previewSug) {
      setShowDeleteConfirm(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          setPreviewSug(null);
        }
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
        s.category.toLowerCase().includes((plan.category || '').toLowerCase()) ||
        (s.planTitle && s.planTitle.toLowerCase() === plan.title.toLowerCase())
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

  // Dynamic Tabs: ONLY display tabs for Plans/Categories that currently have at least one visual suggestion attached
  const visiblePlanGroups = planGroups.filter((g) => g.suggestions.length > 0);

  // In case there are orphan suggestions that don't match any existing plan in `plans`, present them under their category
  const matchedSuggestionIds = new Set<string>();
  visiblePlanGroups.forEach((g) => {
    g.suggestions.forEach((s) => matchedSuggestionIds.add(s.id));
  });

  const unmatchedSuggestions = suggestions.filter((s) => !matchedSuggestionIds.has(s.id));
  if (unmatchedSuggestions.length > 0) {
    const extraCategoriesMap = new Map<string, SuggestionItem[]>();
    unmatchedSuggestions.forEach((s) => {
      const catKey = s.planTitle || s.category.replace(/^[^\w\s]+\s*/, '').trim() || 'General';
      const list = extraCategoriesMap.get(catKey) || [];
      list.push(s);
      extraCategoriesMap.set(catKey, list);
    });

    extraCategoriesMap.forEach((sugList, catName) => {
      const virtualPlan: AttachedPlan = {
        id: `virtual-${catName.toLowerCase().replace(/\s+/g, '-')}`,
        title: catName,
        emoji: sugList[0]?.planEmoji || '📌',
        category: catName,
        deciderType: 'photo_idea',
        status: 'active',
        priority: 'optional',
      };
      visiblePlanGroups.push({
        plan: virtualPlan,
        suggestions: sugList,
        totalLikes: sugList.reduce((acc, curr) => acc + curr.heartCount, 0),
      });
    });
  }

  // Active category tab (strictly per-plan with visual suggestions, never empty tab)
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>(() => {
    return visiblePlanGroups.length > 0 ? visiblePlanGroups[0].plan.id : '';
  });

  const prevSuggestionsLengthRef = useRef(suggestions.length);

  // Dynamic synchronization of selected category tab:
  // - If a new suggestion was added, automatically select its tab so the user sees it immediately
  // - If the current tab's suggestions were deleted (or invalid), automatically fallback to the first active tab
  // - If all suggestions were deleted across all plans, clear the selection
  useEffect(() => {
    // If a new suggestion was added, auto-select its tab
    if (suggestions.length > prevSuggestionsLengthRef.current && suggestions[0]) {
      const newestSug = suggestions[0];
      const targetGroup = visiblePlanGroups.find(
        (g) => g.plan.id === newestSug.planId || 
               g.suggestions.some((s) => s.id === newestSug.id) ||
               (newestSug.planTitle && g.plan.title.toLowerCase() === newestSug.planTitle.toLowerCase())
      );
      if (targetGroup) {
        setSelectedPlanFilter(targetGroup.plan.id);
        prevSuggestionsLengthRef.current = suggestions.length;
        return;
      }
    }
    prevSuggestionsLengthRef.current = suggestions.length;

    if (visiblePlanGroups.length > 0) {
      const isCurrentFilterValid = visiblePlanGroups.some((g) => g.plan.id === selectedPlanFilter);
      if (!isCurrentFilterValid) {
        setSelectedPlanFilter(visiblePlanGroups[0].plan.id);
      }
    } else if (selectedPlanFilter !== '') {
      setSelectedPlanFilter('');
    }
  }, [visiblePlanGroups, selectedPlanFilter, suggestions]);

  // Active plan group for the selected category tab (strictly from visiblePlanGroups)
  const activeGroup = visiblePlanGroups.find((g) => g.plan.id === selectedPlanFilter) || visiblePlanGroups[0] || null;

  return (
    <section id="suggestions-section" className="mb-8 scroll-mt-20">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-black text-[#1A1B25] tracking-tight">
            Visual Suggestions
          </h2>
          <p className="text-xs sm:text-sm text-[#808897] mt-1 font-normal">
            Browse and vote on visual inspiration by category. Ranked by popularity.
          </p>
        </div>

        <button
          type="button"
          id="main-add-visual-suggestion-btn"
          onClick={() => onOpenAddSuggestion(selectedPlanFilter || (plans.length > 0 ? plans[0].id : undefined))}
          className="w-11 h-11 shrink-0 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          title="Add visual suggestion"
          aria-label="Add visual suggestion"
        >
          <Plus className="w-5 h-5 text-white stroke-[2.2]" />
        </button>
      </div>

      {/* Plan Category Tabs (Strictly dynamic: only display tabs with >= 1 visual suggestion, never empty tabs) */}
      {visiblePlanGroups.length > 0 && (
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 mb-6 scrollbar-none">
          {visiblePlanGroups.map((group) => {
            const p = group.plan;
            const count = group.suggestions.length;
            const isSelected = selectedPlanFilter === p.id;
            return (
              <button
                key={p.id}
                id={`plan-tab-${p.id}`}
                type="button"
                onClick={() => setSelectedPlanFilter(p.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-[15px] whitespace-nowrap transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#ECEFF3] text-[#1A1B25] font-bold border border-transparent'
                    : 'bg-white border border-[#DFE1E6] text-[#666D80] font-semibold hover:bg-[#F6F8FA] hover:text-[#272835]'
                }`}
              >
                <span>{p.emoji || '📌'}</span>
                <span>{p.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-white text-[#1A1B25]' : 'bg-[#ECEFF3] text-[#666D80]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Category Visual Gallery (Clean grid with no repetitive sub-headers) */}
      {!activeGroup || activeGroup.suggestions.length === 0 ? (
        <div className="w-full py-16 sm:py-24 flex flex-col items-center justify-center text-center select-none">
          <ImageIcon className="w-9 h-9 text-[#272835] stroke-[2.2] mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#272835] tracking-tight leading-snug mb-2">
            No visual ideas yet
          </h3>
          <p className="text-sm sm:text-base text-[#808897] font-normal tracking-normal max-w-lg leading-relaxed">
            Use the add button above to add an idea to any category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeGroup.suggestions.map((item, index) => {
                    const hasHearted = item.heartedByMemberIds.includes(currentPersona.id);

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
                        className={`group/card relative rounded-2xl overflow-hidden bg-[#ECEFF3] aspect-[4/3] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
                          item.isSelectedWinner
                            ? 'ring-2 ring-emerald-500 shadow-emerald-500/10'
                            : item.isPutUpForVote
                            ? 'ring-2 ring-indigo-500 shadow-indigo-500/10'
                            : ''
                        }`}
                        title="Click to view full photos and details"
                      >
                        {/* High-Resolution Gallery Photo */}
                        <img
                          src={currentImg.url}
                          alt={currentImg.title || item.title}
                          style={getImageStyle(currentImg.position || item.imagePosition)}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                          loading="lazy"
                        />

                        {/* Soft Vignette Overlay: Subtle at rest, atmospheric on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15 opacity-75 group-hover/card:opacity-95 transition-opacity duration-300 pointer-events-none" />

                        {/* TOP FLOATING CONTROLS */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                          {/* Left Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.isSelectedWinner && (
                              <span className="pointer-events-auto px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-md flex items-center gap-1 backdrop-blur-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Selected</span>
                              </span>
                            )}
                            {item.isPutUpForVote && !item.isSelectedWinner && (
                              <span className="pointer-events-auto px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1 backdrop-blur-xs">
                                <Vote className="w-3.5 h-3.5" />
                                <span>In Voting</span>
                              </span>
                            )}
                            {isMulti && (
                              <span className="pointer-events-auto px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs">
                                <Layers className="w-3 h-3 text-amber-300" />
                                <span>{activeIdx + 1}/{imagesList.length}</span>
                              </span>
                            )}
                          </div>

                          {/* Right: Floating Heart / Like Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleHeart(item.id);
                              if (!hasHearted) {
                                confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
                              }
                            }}
                            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md cursor-pointer active:scale-90 shadow-sm ${
                              hasHearted
                                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30'
                                : 'bg-black/45 hover:bg-black/75 text-white'
                            }`}
                            title={hasHearted ? 'Liked' : 'Like this idea'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${hasHearted ? 'fill-white text-white' : 'fill-none text-white stroke-[2.5]'}`} />
                            <span>{item.heartCount}</span>
                          </button>
                        </div>

                        {/* CAROUSEL CONTROLS (Multi-image) - Progressively revealed on hover */}
                        {isMulti && (
                          <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-20">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndices((prev) => ({
                                  ...prev,
                                  [item.id]: (activeIdx - 1 + imagesList.length) % imagesList.length,
                                }));
                              }}
                              className="pointer-events-auto w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition shadow-md cursor-pointer hover:scale-110 active:scale-95"
                              title="Previous photo in group"
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
                              className="pointer-events-auto w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition shadow-md cursor-pointer hover:scale-110 active:scale-95"
                              title="Next photo in group"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Multi-photo dot pagination */}
                        {isMulti && (
                          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1 pointer-events-none z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            {imagesList.map((_, dotIdx) => (
                              <span
                                key={dotIdx}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  dotIdx === activeIdx ? 'bg-white w-3' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* BOTTOM OVERLAY - PROGRESSIVE DISCLOSURE */}
                        <div className="absolute bottom-0 inset-x-0 p-4 text-white z-10 flex flex-col justify-end">
                          {/* Resting Glance: Clean Title + Author */}
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow-sm truncate">
                              {item.title}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-white/80 mt-0.5">
                              <span className="truncate">by {item.authorName}</span>
                              <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider hidden sm:inline">
                                #{index + 1}
                              </span>
                            </div>
                            {/* Clickable text link if added */}
                            {item.link && (
                              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                <a
                                  href={item.link.startsWith('http://') || item.link.startsWith('https://') ? item.link : `https://${item.link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>View this idea →</span>
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Hover Revealed: Description preview + Quick Actions */}
                          <div className="max-h-0 opacity-0 group-hover/card:max-h-40 group-hover/card:opacity-100 transition-all duration-300 overflow-hidden">
                            {item.description && (
                              <p className="text-xs text-white/90 line-clamp-2 mt-2 font-normal leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Action Row */}
                            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/20">
                              <span className="text-[11px] font-semibold text-white/90 flex items-center gap-1">
                                <Maximize2 className="w-3 h-3" />
                                <span>Click to expand</span>
                              </span>

                              {/* Management icons for Owner / Admin */}
                              {canManage && (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {/* Reposition Photo */}
                                  {onUpdateSuggestionPosition && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRepositioningSug(item);
                                        setRepositionImageIndex(activeIdx);
                                        setTempPosition(currentImg.position || item.imagePosition || { ...DEFAULT_IMAGE_POSITION });
                                      }}
                                      className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition cursor-pointer"
                                      title="Adjust photo crop and position"
                                    >
                                      <Move className="w-3 h-3" />
                                    </button>
                                  )}

                                  {/* Toggle Put Up For Vote */}
                                  <button
                                    type="button"
                                    onClick={() => onTogglePutUpForVote(item.id)}
                                    className={`p-1.5 rounded-full transition cursor-pointer ${
                                      item.isPutUpForVote
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-black/50 hover:bg-indigo-600 text-white'
                                    }`}
                                    title={item.isPutUpForVote ? 'Remove from voting poll' : 'Put this idea up for vote'}
                                  >
                                    <Vote className="w-3 h-3" />
                                  </button>

                                  {/* Select as Plan Winner */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectAsWinner(item.id);
                                      if (!item.isSelectedWinner) {
                                        confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                      item.isSelectedWinner
                                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                    }`}
                                    title={item.isSelectedWinner ? 'Undo plan selection' : 'Use this idea as plan selection'}
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>{item.isSelectedWinner ? 'Undo' : 'Select'}</span>
                                  </button>

                                  {/* Delete Suggestion */}
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(item.id)}
                                    className="p-1.5 rounded-full bg-black/50 hover:bg-rose-600 text-white transition cursor-pointer"
                                    title="Delete idea"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* In-Card Delete Confirmation Overlay */}
                        {deletingId === item.id && (
                          <div
                            className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30 animate-in fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-8 h-8 text-rose-500 mb-2 animate-bounce" />
                            <p className="text-xs font-bold text-white mb-3">Delete this visual idea?</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteSuggestion(item.id);
                                  setDeletingId(null);
                                }}
                                className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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

      {/* Visual Suggestion — Full Image Preview Modal (Redesigned strictly to match Image 1 and Image 2) */}
      {previewSug && (() => {
        // Sync with active suggestion state from parent suggestions list
        const activeSug = suggestions.find((s) => s.id === previewSug.id) || previewSug;
        const previewImages = activeSug.images && activeSug.images.length > 0
          ? activeSug.images
          : [
              {
                id: 'img-main',
                url: activeSug.imageUrl,
                title: activeSug.title,
                position: activeSug.imagePosition,
              },
            ];
        const activeIdx = Math.min(Math.max(0, previewActiveIndex), previewImages.length - 1);
        const currentImg = previewImages[activeIdx] || previewImages[0];
        const isMulti = previewImages.length > 1;
        const hasHearted = activeSug.heartedByMemberIds.includes(currentPersona.id);
        const isAuthor = activeSug.authorId === currentPersona.id || activeSug.authorName.toLowerCase() === currentPersona.name.toLowerCase();
        const canDelete = canManage || isAuthor;

        const formattedUrl = activeSug.link
          ? activeSug.link.startsWith('http://') || activeSug.link.startsWith('https://')
            ? activeSug.link
            : `https://${activeSug.link}`
          : '';

        // Dynamic Plan Icon and Title associated strictly with the selected Plan
        const cleanTitle = (val?: string) => {
          if (!val) return '';
          return val.replace(/^[\p{Emoji}\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '').trim();
        };

        const selectedPlan =
          plans.find((p) => p.id === selectedPlanFilter) ||
          plans.find((p) => p.id === activeSug.planId) ||
          plans.find((p) => p.title.toLowerCase() === activeSug.planTitle?.toLowerCase()) ||
          plans.find((p) => p.title.toLowerCase() === cleanTitle(activeSug.category).toLowerCase()) ||
          plans[0];

        const displayPlanIcon = selectedPlan?.emoji || activeSug.planEmoji || '';
        const displayPlanTitle = selectedPlan?.title || cleanTitle(activeSug.planTitle || activeSug.category) || 'Plan';

        return (
          <>
            <div
              id="suggestion-full-image-preview-modal"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPreviewSug(null);
                }
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            >
              <div
                className="bg-white rounded-3xl max-w-md sm:max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#DFE1E6] overflow-y-auto animate-in zoom-in-95 duration-150 scrollbar-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Modal Header (Exact match to Image 1 & 2 — Sticky to Top) */}
                <div className="sticky top-0 z-30 flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-3 bg-white shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#1A1B25] tracking-tight truncate">
                        {activeSug.title}
                      </h3>
                      {activeSug.isSelectedWinner && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00BFA6] text-white shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Selected</span>
                        </span>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECEFF3] text-[#666D80] mt-1.5">
                      {displayPlanIcon && (
                        <span className="text-xs leading-none select-none">
                          {displayPlanIcon}
                        </span>
                      )}
                      <span>{displayPlanTitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pt-1">
                    {/* Delete action (Only visible if authorized to delete) */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-[#808897] hover:text-[#1A1B25] transition cursor-pointer p-0.5"
                        title="Delete this idea"
                        aria-label="Delete this idea"
                      >
                        <Trash2 className="w-5 h-5 stroke-[1.6]" />
                      </button>
                    )}

                    {/* Close action */}
                    <button
                      type="button"
                      onClick={() => setPreviewSug(null)}
                      className="text-[#808897] hover:text-[#1A1B25] transition cursor-pointer p-0.5"
                      title="Close"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 stroke-[2]" />
                    </button>
                  </div>
                </div>

                {/* 2. Modal Body */}
                <div className="px-5 sm:px-6 pb-6 space-y-4">
                  {/* Image Viewport (Sticky to Top of Modal — Content Scrolls Seamlessly Underneath) */}
                  <div className="sticky top-[72px] sm:top-[76px] z-20 -mx-5 sm:-mx-6 px-5 sm:px-6 bg-white pb-3 pt-0.5 -mt-0.5">
                    <div className="w-full h-[280px] sm:h-[320px] shrink-0 rounded-2xl sm:rounded-3xl bg-[#ECEFF3] overflow-hidden relative flex items-center justify-center select-none shadow-2xs">
                      <img
                        src={currentImg.url}
                        alt={currentImg.title || activeSug.title}
                        className="w-full h-full object-contain rounded-none"
                      />

                      {/* Carousel navigation arrows */}
                      {isMulti && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewActiveIndex((activeIdx - 1 + previewImages.length) % previewImages.length);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center transition cursor-pointer shadow active:scale-95 z-10"
                            title="Previous photo"
                            aria-label="Previous photo"
                          >
                            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewActiveIndex((activeIdx + 1) % previewImages.length);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center transition cursor-pointer shadow active:scale-95 z-10"
                            title="Next photo"
                            aria-label="Next photo"
                          >
                            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                          </button>
                        </>
                      )}

                      {/* Counter Badge in bottom-right (e.g. 1/2) */}
                      <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-[#808897]/80 backdrop-blur-xs text-white text-xs font-bold select-none z-10">
                        {activeIdx + 1}/{previewImages.length}
                      </div>
                    </div>
                  </div>

                  {/* 3. Action Buttons (Owner/Admin Only — State 1: Initial vs State 2: Actioned) */}
                  {canManage && (
                    <div className="flex items-center gap-3">
                      {/* Put for Vote button (Maintains exact default size; disabled if Selected) */}
                      <button
                        type="button"
                        disabled={activeSug.isSelectedWinner}
                        onClick={() => {
                          if (!activeSug.isSelectedWinner) {
                            onTogglePutUpForVote(activeSug.id);
                          }
                        }}
                        className={`flex-1 py-3 sm:py-3.5 px-4 rounded-full text-sm sm:text-[15px] font-bold transition flex items-center justify-center ${
                          activeSug.isSelectedWinner
                            ? 'bg-[#ECEFF3] text-[#1A1B25] opacity-50 cursor-not-allowed'
                            : activeSug.isPutUpForVote
                            ? 'bg-[#1A1B25] text-white shadow-xs cursor-pointer active:scale-98'
                            : 'bg-[#ECEFF3] hover:bg-[#DFE1E6] text-[#1A1B25] cursor-pointer active:scale-98'
                        }`}
                      >
                        {activeSug.isPutUpForVote && !activeSug.isSelectedWinner ? 'In Voting ✓' : 'Put for Vote'}
                      </button>

                      {/* Select / Undo Select button (Maintains exact default size, style, and typography) */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAsWinner(activeSug.id);
                          if (!activeSug.isSelectedWinner) {
                            confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
                          }
                        }}
                        className="flex-1 py-3 sm:py-3.5 px-4 rounded-full text-sm sm:text-[15px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 bg-[#ECEFF3] hover:bg-[#DFE1E6] text-[#1A1B25]"
                      >
                        {activeSug.isSelectedWinner ? (
                          <>
                            <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                            <span>Undo Select</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-[#0D9488] stroke-[3]" />
                            <span>Select</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Regular Member Status Indicator if selected */}
                  {!canManage && activeSug.isSelectedWinner && (
                    <div className="py-2.5 px-4 rounded-full bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-emerald-200">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                      <span>Selected Decision Choice</span>
                    </div>
                  )}

                  {/* 4. Card 1: Suggested by, Hearts & Description */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-[#ECEFF3] bg-white shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm sm:text-[15px]">
                        <span className="text-[#808897] font-normal">Suggested: </span>
                        <span className="font-bold text-[#1A1B25]">{activeSug.authorName}</span>
                      </div>

                      {/* Interactive Heart Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onToggleHeart(activeSug.id);
                          if (!hasHearted) {
                            confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
                          }
                        }}
                        className="flex items-center gap-1.5 text-sm sm:text-[15px] font-bold text-[#1A1B25] hover:text-rose-600 transition cursor-pointer select-none"
                        title="Like this idea"
                        aria-label="Like this idea"
                      >
                        <Heart
                          className={`w-5 h-5 stroke-[1.8] transition-colors ${
                            hasHearted ? 'fill-rose-500 text-rose-500' : 'text-[#1A1B25]'
                          }`}
                        />
                        <span>{activeSug.heartCount} hearts</span>
                      </button>
                    </div>

                    {activeSug.description && (
                      <p className="text-sm sm:text-[14px] text-[#808897] leading-relaxed font-normal">
                        {activeSug.description}
                      </p>
                    )}
                  </div>

                  {/* 5. Card 2: Link */}
                  {activeSug.link && (
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#ECEFF3] bg-white shadow-2xs space-y-1">
                      <div className="text-sm sm:text-[15px]">
                        <span className="text-[#808897] font-normal">Link: </span>
                        <a
                          href={formattedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#1A1B25] underline underline-offset-2 hover:text-black transition-colors cursor-pointer"
                        >
                          {activeSug.linkTitle || 'View this idea'}
                        </a>
                      </div>
                      <p className="text-sm text-[#808897] truncate">
                        {activeSug.link}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Delete Confirmation Popup Dialog */}
            {showDeleteConfirm && (
              <div
                className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <div
                  className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#DFE1E6] animate-in zoom-in-95 duration-150 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <h4 className="text-lg font-extrabold text-[#1A1B25]">
                      Delete visual suggestion?
                    </h4>
                    <p className="text-xs sm:text-sm text-[#808897] leading-normal">
                      Are you sure you want to delete &ldquo;{activeSug.title}&rdquo;? This action cannot be undone.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-2.5 px-4 rounded-full border border-[#DFE1E6] bg-white hover:bg-[#F6F8FA] text-sm font-bold text-[#666D80] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteSuggestion(activeSug.id);
                        setShowDeleteConfirm(false);
                        setPreviewSug(null);
                      }}
                      className="py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition shadow-xs cursor-pointer active:scale-98"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </section>
  );
};
