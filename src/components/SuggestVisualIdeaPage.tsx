import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronDown, 
  Upload, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { AttachedPlan, ItemPriority, UserPersona, ImagePosition, SuggestionImageItem } from '../types';
import { DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';
import { compressImageFile } from '../utils/imageCompressor';

interface SuggestVisualIdeaPageProps {
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
    priority?: ItemPriority;
    link?: string;
  }) => void;
}

const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
];

export const SuggestVisualIdeaPage: React.FC<SuggestVisualIdeaPageProps> = ({
  isOpen,
  onClose,
  plans,
  preselectedPlanId,
  currentPersona,
  onAddSuggestion,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<SuggestionImageItem[]>([]);
  const [link, setLink] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Initialize and synchronize state when page opens or preselectedPlanId changes
  useEffect(() => {
    if (isOpen) {
      if (preselectedPlanId && plans.some((p) => p.id === preselectedPlanId)) {
        setSelectedPlanId(preselectedPlanId);
      } else if (plans.length > 0) {
        setSelectedPlanId(plans[0].id);
      } else {
        setSelectedPlanId('');
      }
      setTitle('');
      setDescription('');
      setUploadedImages([]);
      setLink('');
      setErrorMessage('');
      setIsPlanDropdownOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isOpen, preselectedPlanId, plans]);

  // Close plan dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPlanDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Escape listener to exit back to main board
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPlanDropdownOpen) {
          setIsPlanDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlanDropdownOpen, onClose]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Handle local file upload (single or multiple) with client-side compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    for (const file of fileList) {
      try {
        const compressedUrl = await compressImageFile(file, 1200, 1200, 0.8);
        if (compressedUrl) {
          const newImg: SuggestionImageItem = {
            id: `img-upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: compressedUrl,
            title: file.name.replace(/\.[^/.]+$/, ''),
            position: { ...DEFAULT_IMAGE_POSITION },
          };
          setUploadedImages((prev) => [...prev, newImg]);
          setErrorMessage('');
        }
      } catch (err) {
        console.warn('Failed to process image:', err);
      }
    }

    // Reset input value to allow re-uploading the same file if needed
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Determine readiness for submission: plan selected + title entered
  const isReadyToSubmit = Boolean(selectedPlanId && title.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlanId || !selectedPlan) {
      setErrorMessage('Please select a plan target for this suggestion.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a suggestion title.');
      return;
    }

    // Determine final images from user upload (visual image and URL are separate data)
    let finalImages = [...uploadedImages];

    // Fallback if user didn't upload an image
    if (finalImages.length === 0) {
      const fallbackUrl = DEFAULT_FALLBACK_IMAGES[Math.floor(Math.random() * DEFAULT_FALLBACK_IMAGES.length)];
      finalImages = [
        {
          id: `img-default-${Date.now()}`,
          url: fallbackUrl,
          title: title.trim(),
          position: { ...DEFAULT_IMAGE_POSITION },
        },
      ];
    }

    onAddSuggestion({
      planId: selectedPlan.id,
      planTitle: selectedPlan.title,
      planEmoji: selectedPlan.emoji || '📍',
      title: title.trim(),
      description: description.trim() || `Suggested visual idea for ${selectedPlan.title}`,
      imageUrl: finalImages[0].url,
      imagePosition: finalImages[0].position || { ...DEFAULT_IMAGE_POSITION },
      images: finalImages,
      priority: 'required',
      link: link.trim() || undefined,
    });

    onClose();
  };

  return (
    <div 
      id="suggest-visual-idea-page"
      className="fixed inset-0 z-50 overflow-y-auto bg-white min-h-screen text-[#1A1B25] antialiased flex flex-col justify-start"
    >
      {/* 
        Container centered with 384px maximum left/right margin on desktop,
        responsively adapting for tablet and mobile 
      */}
      <div 
        className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16"
        style={{
          maxWidth: 'min(760px, calc(100vw - 32px))',
        }}
      >
        {/* Top Header: Title + Circular Close Button */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h1 
            id="suggest-visual-idea-heading"
            className="text-2xl sm:text-[28px] font-black text-[#1A1B25] tracking-tight leading-tight select-none"
          >
            Suggest a Visual Idea
          </h1>
          <button
            id="close-suggest-visual-idea-page-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert if needed */}
        {errorMessage && (
          <div 
            id="suggest-visual-idea-error-msg"
            className="mb-4 flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form 
          id="suggest-visual-idea-form"
          onSubmit={handleSubmit}
          className="space-y-3.5 sm:space-y-4"
        >
          {/* 1. Plan Target Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="suggest-plan-target-dropdown-btn"
              type="button"
              onClick={() => setIsPlanDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4.5 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-left transition cursor-pointer select-none"
            >
              {selectedPlan ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{selectedPlan.emoji || '📍'}</span>
                  <span className="text-sm sm:text-base font-bold text-[#1A1B25] truncate">
                    {selectedPlan.title} Tied
                  </span>
                </div>
              ) : (
                <span className="text-sm sm:text-base font-medium text-[#808897]">
                  Select plan target (Required)
                </span>
              )}
              <ChevronDown 
                className={`w-4 h-4 text-[#808897] shrink-0 transition-transform duration-200 ${
                  isPlanDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Dropdown Menu */}
            {isPlanDropdownOpen && (
              <div 
                id="suggest-plan-target-options"
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#ECEFF3] py-2 z-40 max-h-64 overflow-y-auto"
              >
                {plans.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[#808897] font-medium text-center">
                    No plans found on this board.
                  </div>
                ) : (
                  plans.map((p) => {
                    const isSelected = p.id === selectedPlanId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlanId(p.id);
                          setIsPlanDropdownOpen(false);
                          setErrorMessage('');
                        }}
                        className={`w-full px-4.5 py-3 flex items-center justify-between text-left transition cursor-pointer ${
                          isSelected ? 'bg-[#F6F8FA] text-[#1A1B25]' : 'hover:bg-[#F8F9FB] text-[#353849]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{p.emoji || '📍'}</span>
                          <span className="text-sm font-bold truncate">
                            {p.title} Tied
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#1A1B25] shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 2. Suggestion Title Input */}
          <div>
            <input
              id="suggest-visual-idea-title-input"
              type="text"
              placeholder="Suggestion Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="w-full px-4.5 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-[#F6F8FA] text-sm sm:text-base font-bold text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:bg-[#ECEFF3] transition"
            />
          </div>

          {/* 3. Description Input (Optional short description of why this idea) */}
          <div>
            <input
              id="suggest-visual-idea-desc-input"
              type="text"
              placeholder="Optional short description of why this idea (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4.5 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-[#F6F8FA] text-sm sm:text-base font-medium text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:bg-[#ECEFF3] transition"
            />
          </div>

          {/* 4. Upload Image Section */}
          <div>
            {uploadedImages.length === 0 ? (
              /* Image 1: Empty Upload State */
              <div 
                id="suggest-visual-idea-empty-upload-card"
                className="w-full bg-[#F6F8FA] rounded-2xl py-12 px-6 flex flex-col items-center justify-center gap-3.5 text-center min-h-[190px]"
              >
                <span className="text-sm sm:text-base font-medium text-[#808897]">
                  Upload image from your device
                </span>
                <button
                  id="suggest-click-to-upload-btn-empty"
                  type="button"
                  onClick={() => fileInputRef1.current?.click()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-sm font-bold text-[#1A1B25] shadow-xs hover:bg-[#ECEFF3] transition cursor-pointer select-none"
                >
                  <Upload className="w-4 h-4 text-[#1A1B25]" />
                  <span>Click to upload</span>
                </button>
                <input
                  ref={fileInputRef1}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              /* Image 2: Populated Upload State (Thumbnails + Square Click to upload button) */
              <div 
                id="suggest-visual-idea-uploaded-gallery"
                className="flex flex-wrap items-center gap-3 sm:gap-3.5"
              >
                {uploadedImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-[#F6F8FA] shrink-0 group shadow-xs border border-[#ECEFF3]"
                  >
                    <img
                      src={img.url}
                      alt={img.title || `Visual idea ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#1A1B25]/85 hover:bg-[#1A1B25] text-white flex items-center justify-center transition cursor-pointer shadow"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Additional Upload Square Card */}
                <button
                  id="suggest-click-to-upload-btn-add-more"
                  type="button"
                  onClick={() => fileInputRef2.current?.click()}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition select-none shrink-0 p-3"
                >
                  <Upload className="w-4 h-4 text-[#1A1B25]" />
                  <span className="text-xs font-bold text-[#1A1B25]">Click to upload</span>
                </button>
                <input
                  ref={fileInputRef2}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 5. Optional Clickable Web Link (Saved strictly as a clickable link, never rendered as an image) */}
          <div>
            <input
              id="suggest-visual-idea-link-input"
              type="url"
              placeholder="Optional Link (e.g., https://...)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-4.5 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-white border border-[#DFE1E6] text-sm sm:text-base text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:border-[#1A1B25] transition"
            />
          </div>

          {/* 7. Submit Suggestion Button (Disabled / Active State matching Image 1 vs Image 2) */}
          <div className="pt-2">
            <button
              id="suggest-visual-idea-submit-btn"
              type="submit"
              disabled={!isReadyToSubmit}
              className={`w-full py-4 px-6 rounded-full font-bold text-sm sm:text-base transition text-center select-none ${
                isReadyToSubmit
                  ? 'bg-[#1A1B25] hover:bg-[#272835] text-white cursor-pointer active:scale-[0.99] shadow-sm'
                  : 'bg-[#DFE1E6] text-white cursor-not-allowed'
              }`}
            >
              Submit Suggestion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
