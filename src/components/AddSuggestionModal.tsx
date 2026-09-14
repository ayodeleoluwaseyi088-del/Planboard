import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Sparkles, 
  Check, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { AttachedPlan, ItemPriority, UserPersona, ImagePosition, SuggestionImageItem } from '../types';
import { ImagePickerField } from './ImagePickerField';
import { DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';

interface AddSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: AttachedPlan[];
  preselectedPlanId?: string;
  currentPersona: UserPersona;
  onAddSuggestion: (suggestion: {
    planId: string;
    planTitle: string;
    planEmoji?: string;
    title: string;
    description: string;
    imageUrl: string;
    imagePosition?: ImagePosition;
    images?: SuggestionImageItem[];
    priority: ItemPriority;
  }) => void;
}

const PRESET_PHOTOS = [
  {
    category: 'Location',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    title: 'Beach Cabana',
  },
  {
    category: 'Location',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
    title: 'Rooftop Skyline Lounge',
  },
  {
    category: 'Location',
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
    title: 'Lagoon Island Shack',
  },
  {
    category: 'Music',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    title: 'Sunset DJ Console',
  },
  {
    category: 'Music',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    title: 'Acoustic & Vinyl Setup',
  },
  {
    category: 'Style & Theme',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    title: 'Linen & Pastel Look',
  },
  {
    category: 'Style & Theme',
    url: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&auto=format&fit=crop&q=80',
    title: 'Tropical Floral Prints',
  },
  {
    category: 'Food & Drinks',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    title: 'Platter & Feast Spread',
  },
];

export const AddSuggestionModal: React.FC<AddSuggestionModalProps> = ({
  isOpen,
  onClose,
  plans,
  preselectedPlanId,
  currentPersona,
  onAddSuggestion,
}) => {
  // Determine initial plan
  const getInitialPlanId = () => {
    if (preselectedPlanId && plans.some((p) => p.id === preselectedPlanId)) {
      return preselectedPlanId;
    }
    return plans.length > 0 ? plans[0].id : '';
  };

  const [selectedPlanId, setSelectedPlanId] = useState<string>(getInitialPlanId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_PHOTOS[0].url);
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ ...DEFAULT_IMAGE_POSITION });
  const [customImage, setCustomImage] = useState('');
  const [selectedImages, setSelectedImages] = useState<SuggestionImageItem[]>([
    {
      id: 'sys-default-0',
      url: PRESET_PHOTOS[0].url,
      title: PRESET_PHOTOS[0].title,
      position: { ...DEFAULT_IMAGE_POSITION },
    },
  ]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [priority, setPriority] = useState<ItemPriority>('required');
  const [errorMessage, setErrorMessage] = useState('');

  // Track previous open state so we ONLY initialize state when opening, NEVER on re-renders or clicks
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Fresh modal open: initialize state
      if (preselectedPlanId && plans.some((p) => p.id === preselectedPlanId)) {
        setSelectedPlanId(preselectedPlanId);
      } else if (plans.length > 0) {
        setSelectedPlanId(plans[0].id);
      } else {
        setSelectedPlanId('');
      }
      setTitle('');
      setDescription('');
      setImageUrl(PRESET_PHOTOS[0].url);
      setImagePosition({ ...DEFAULT_IMAGE_POSITION });
      setSelectedImages([
        {
          id: `sys-${Date.now()}`,
          url: PRESET_PHOTOS[0].url,
          title: PRESET_PHOTOS[0].title,
          position: { ...DEFAULT_IMAGE_POSITION },
        },
      ]);
      setActiveImageIndex(0);
      setCustomImage('');
      setErrorMessage('');
    } else if (isOpen && preselectedPlanId && (!selectedPlanId || !plans.some((p) => p.id === selectedPlanId))) {
      // If the preselected plan ID was updated while open
      if (plans.some((p) => p.id === preselectedPlanId)) {
        setSelectedPlanId(preselectedPlanId);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, preselectedPlanId, plans, selectedPlanId]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedPlan) {
      setErrorMessage('Please select an existing plan for this suggestion.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a title for your suggestion.');
      return;
    }

    const finalImages = selectedImages && selectedImages.length > 0
      ? selectedImages
      : [{
          id: `img-${Date.now()}`,
          url: customImage.trim() || imageUrl || PRESET_PHOTOS[0].url,
          title: title.trim(),
          position: imagePosition,
        }];

    onAddSuggestion({
      planId: selectedPlan.id,
      planTitle: selectedPlan.title,
      planEmoji: selectedPlan.emoji || '📍',
      title: title.trim(),
      description: description.trim() || `Suggested visual idea for ${selectedPlan.title}`,
      imageUrl: finalImages[0].url,
      imagePosition: finalImages[0].position || imagePosition,
      images: finalImages,
      priority,
    });

    onClose();
  };

  return (
    <div 
      id="suggest-visual-idea-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        // Only close if clicking the backdrop itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        id="suggest-visual-idea-modal"
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#ECEFF3] overflow-hidden flex flex-col max-h-[90vh] relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ECEFF3] bg-[#F8F9FB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1A1B25]">Suggest a Visual Idea</h2>
              <p className="text-xs text-[#666D80]">Lock idea to a plan for group feedback & voting</p>
            </div>
          </div>
          <button
            id="close-suggest-visual-idea-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#666D80] hover:text-[#1A1B25] hover:bg-[#ECEFF3] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form 
          id="suggest-visual-idea-form"
          onSubmit={handleSubmit} 
          className="overflow-y-auto p-6 space-y-5"
        >
          {errorMessage && (
            <div 
              id="suggest-visual-idea-error"
              className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Plan Selector (MANDATORY REQUIREMENT) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-2">
              1. Tied to Plan <span className="text-rose-500">* (Required)</span>
            </label>

            {plans.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                No plans exist on this board yet. Please add a plan first before submitting suggestions.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {plans.map((p) => {
                    const isSelected = p.id === selectedPlanId;
                    return (
                      <button
                        key={p.id}
                        id={`suggest-plan-chip-${p.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanId(p.id);
                          setErrorMessage('');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#1A1B25] text-white shadow-xs'
                            : 'bg-[#F6F8FA] border border-[#ECEFF3] text-[#353849] hover:bg-white hover:border-[#C1C7CF]'
                        }`}
                      >
                        <span>{p.emoji || '📌'}</span>
                        <span>{p.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
                      </button>
                    );
                  })}
                </div>

                {selectedPlan && (
                  <div 
                    id="suggest-target-plan-preview"
                    className="text-[11px] text-[#666D80] bg-[#F8F9FB] p-2.5 rounded-xl border border-[#ECEFF3]"
                  >
                    <span className="font-bold text-[#1A1B25]">Target Plan: </span>
                    {selectedPlan.emoji} {selectedPlan.title} — {selectedPlan.description || selectedPlan.location || 'Planning in progress'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Suggestion Title */}
          <div>
            <label 
              htmlFor="suggest-visual-idea-title"
              className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5 cursor-pointer"
            >
              2. Suggestion Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="suggest-visual-idea-title"
              name="title"
              type="text"
              required
              autoFocus
              placeholder="e.g., The Waterfront Cabana & Deck, Afrobeats Sunset DJ Set..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFE1E6] text-sm text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:border-[#1A1B25] focus:ring-1 focus:ring-[#1A1B25] bg-white transition-colors"
            />
          </div>

          {/* 3. Description (Accepts multi-line text cleanly) */}
          <div>
            <label 
              htmlFor="suggest-visual-idea-description"
              className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5 cursor-pointer"
            >
              3. Why this idea? / Details
            </label>
            <textarea
              id="suggest-visual-idea-description"
              name="description"
              rows={3}
              placeholder="e.g. Spacious private beach cabana with volleyball net, great ocean breeze, and direct parking access..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                // Ensure Enter creates new line and doesn't trigger premature form submit
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.stopPropagation();
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFE1E6] text-xs text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:border-[#1A1B25] focus:ring-1 focus:ring-[#1A1B25] bg-white resize-y min-h-[72px] transition-colors"
            />
          </div>

          {/* 4. Visual Reference / Photo (Multiple Images Supported) */}
          <div>
            <ImagePickerField
              id="suggest-visual-idea-image-picker"
              label="4. Visual References (Multiple Images Supported)"
              sublabel="Select multiple system photos or upload several files from your device to group into this single suggestion"
              value={imageUrl}
              onChange={setImageUrl}
              position={imagePosition}
              onPositionChange={setImagePosition}
              systemImages={PRESET_PHOTOS}
              allowCustomUrl={true}
              customUrlValue={customImage}
              onCustomUrlChange={setCustomImage}
              aspectRatio="standard"
              multiple={true}
              selectedImages={selectedImages}
              onSelectedImagesChange={(imgs) => {
                setSelectedImages(imgs);
                if (imgs.length > 0) {
                  setImageUrl(imgs[0].url);
                  if (imgs[0].position) {
                    setImagePosition(imgs[0].position);
                  }
                }
              }}
              activeImageIndex={activeImageIndex}
              onActiveImageIndexChange={setActiveImageIndex}
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ECEFF3]">
            <button
              id="cancel-suggest-visual-idea-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#DFE1E6] text-xs font-bold text-[#666D80] hover:bg-[#F6F8FA] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-suggest-visual-idea-btn"
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A1B25] hover:bg-[#272835] text-xs font-black text-white transition cursor-pointer shadow-xs active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Submit Suggestion {selectedImages.length > 1 ? `(${selectedImages.length} Photos)` : ''}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
