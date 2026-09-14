import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  RotateCcw, 
  Upload, 
  Link as LinkIcon, 
  AlertCircle,
  Move,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { ImagePosition, SuggestionImageItem } from '../types';
import { ImageFramePositioner } from './ImageFramePositioner';
import { DEFAULT_IMAGE_POSITION, getImageStyle } from '../utils/imagePosition';

export interface SystemImageOption {
  url: string;
  title?: string;
}

export interface ImagePickerFieldProps {
  id?: string;
  label?: string;
  sublabel?: string;
  value: string;
  onChange: (url: string) => void;
  position?: ImagePosition;
  onPositionChange?: (position: ImagePosition) => void;
  systemImages: Array<SystemImageOption | string>;
  allowCustomUrl?: boolean;
  customUrlValue?: string;
  onCustomUrlChange?: (url: string) => void;
  aspectRatio?: 'cover' | 'standard' | 'square' | 'wide';
  previewHeight?: string;
  compact?: boolean;
  multiple?: boolean;
  selectedImages?: SuggestionImageItem[];
  onSelectedImagesChange?: (images: SuggestionImageItem[]) => void;
  activeImageIndex?: number;
  onActiveImageIndexChange?: (index: number) => void;
}

export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  id = 'image-picker',
  label,
  sublabel,
  value,
  onChange,
  position = DEFAULT_IMAGE_POSITION,
  onPositionChange,
  systemImages,
  allowCustomUrl = false,
  customUrlValue = '',
  onCustomUrlChange,
  aspectRatio = 'standard',
  previewHeight,
  compact = false,
  multiple = false,
  selectedImages,
  onSelectedImagesChange,
  activeImageIndex,
  onActiveImageIndexChange,
}) => {
  // Normalize system images to object format
  const normalizedSystemImages: SystemImageOption[] = systemImages.map((img) =>
    typeof img === 'string' ? { url: img } : img
  );

  const isSystemImage = normalizedSystemImages.some((img) => img.url === value);
  const isUploadedImage = value.startsWith('data:image/') || (!isSystemImage && !customUrlValue && value.length > 0);

  // Active mode tab: 'system' or 'upload'
  const [activeTab, setActiveTab] = useState<'system' | 'upload'>(() =>
    isUploadedImage ? 'upload' : 'system'
  );

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState(customUrlValue);
  const [localActiveIndex, setLocalActiveIndex] = useState(0);

  const activeIndex = activeImageIndex !== undefined ? activeImageIndex : localActiveIndex;
  const setActiveIndex = (idx: number) => {
    if (onActiveImageIndexChange) {
      onActiveImageIndexChange(idx);
    } else {
      setLocalActiveIndex(idx);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Read multiple files
  const handleMultipleFiles = (files: File[]) => {
    setUploadError(null);
    const validImageFiles = files.filter((f) => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      setUploadError('Please select valid image files (PNG, JPG, WEBP, or GIF).');
      return;
    }

    const oversized = validImageFiles.filter((f) => f.size > 15 * 1024 * 1024);
    if (oversized.length > 0) {
      setUploadError('Some files exceeded 15MB and were skipped.');
    }

    const eligibleFiles = validImageFiles.filter((f) => f.size <= 15 * 1024 * 1024);
    if (eligibleFiles.length === 0) return;

    setUploadedFileName(
      eligibleFiles.length === 1 ? eligibleFiles[0].name : `${eligibleFiles.length} files uploaded`
    );

    const readPromises = eligibleFiles.map(
      (file) =>
        new Promise<SuggestionImageItem>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `up-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              url: reader.result as string,
              title: file.name.replace(/\.[^/.]+$/, ''),
              position: { ...DEFAULT_IMAGE_POSITION },
            });
          };
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readPromises)
      .then((newItems) => {
        if (multiple && onSelectedImagesChange) {
          const currentList = selectedImages || [];
          const updated = [...currentList, ...newItems];
          onSelectedImagesChange(updated);
          setActiveIndex(currentList.length); // focus first new item
          if (updated.length > 0) {
            onChange(updated[0].url);
          }
        } else if (newItems.length > 0) {
          onChange(newItems[0].url);
          if (onPositionChange) {
            onPositionChange({ ...DEFAULT_IMAGE_POSITION });
          }
        }
        setActiveTab('upload');
      })
      .catch(() => {
        setUploadError('Failed to read one or more files from your device.');
      });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Toggle or select system photo
  const handleSelectSystemPhoto = (photo: SystemImageOption) => {
    if (multiple && onSelectedImagesChange) {
      const currentList = selectedImages || [];
      const existingIdx = currentList.findIndex((img) => img.url === photo.url);

      if (existingIdx >= 0) {
        // Deselect if already present
        const updated = currentList.filter((_, idx) => idx !== existingIdx);
        onSelectedImagesChange(updated);
        if (activeIndex >= updated.length) {
          setActiveIndex(Math.max(0, updated.length - 1));
        }
        if (updated.length > 0) {
          onChange(updated[0].url);
        }
      } else {
        // Add to grouped list
        const newItem: SuggestionImageItem = {
          id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: photo.url,
          title: photo.title || `System Photo ${currentList.length + 1}`,
          position: { ...DEFAULT_IMAGE_POSITION },
        };
        const updated = [...currentList, newItem];
        onSelectedImagesChange(updated);
        setActiveIndex(updated.length - 1);
        onChange(updated[0].url);
      }
    } else {
      onChange(photo.url);
      if (onCustomUrlChange) onCustomUrlChange('');
    }
  };

  // Remove an individual image from multiple list
  const handleRemoveImage = (indexToRemove: number) => {
    if (!multiple || !onSelectedImagesChange || !selectedImages) return;
    const updated = selectedImages.filter((_, idx) => idx !== indexToRemove);
    onSelectedImagesChange(updated);
    if (activeIndex >= updated.length) {
      setActiveIndex(Math.max(0, updated.length - 1));
    }
    if (updated.length > 0) {
      onChange(updated[0].url);
    }
  };

  // Add custom URL in multiple mode
  const handleAddCustomUrl = () => {
    const url = customUrlInput.trim();
    if (!url) return;

    if (multiple && onSelectedImagesChange) {
      const newItem: SuggestionImageItem = {
        id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url,
        title: 'Custom Link',
        position: { ...DEFAULT_IMAGE_POSITION },
      };
      const updated = [...(selectedImages || []), newItem];
      onSelectedImagesChange(updated);
      setActiveIndex(updated.length - 1);
      setCustomUrlInput('');
      if (onCustomUrlChange) onCustomUrlChange('');
    } else {
      onChange(url);
      if (onCustomUrlChange) onCustomUrlChange(url);
    }
  };

  // Current active image object for frame positioner
  const currentActiveImage: SuggestionImageItem | undefined = multiple && selectedImages && selectedImages.length > 0
    ? selectedImages[activeIndex] || selectedImages[0]
    : undefined;

  const activePosition = multiple
    ? (currentActiveImage?.position || position)
    : position;

  const handleActivePositionChange = (newPos: ImagePosition) => {
    if (multiple && onSelectedImagesChange && selectedImages && selectedImages.length > 0) {
      const updated = [...selectedImages];
      const targetIdx = activeIndex < updated.length ? activeIndex : 0;
      updated[targetIdx] = {
        ...updated[targetIdx],
        position: newPos,
      };
      onSelectedImagesChange(updated);
      if (targetIdx === 0 && onPositionChange) {
        onPositionChange(newPos);
      }
    } else if (onPositionChange) {
      onPositionChange(newPos);
    }
  };

  return (
    <div className="space-y-3">
      {/* Label and Option Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          {label && (
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {multiple && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black lowercase">
                  multi-select enabled
                </span>
              )}
            </label>
          )}
          {sublabel && <p className="text-[11px] text-[#808897]">{sublabel}</p>}
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-0.5 rounded-xl bg-[#ECEFF3] border border-[#DFE1E6] text-xs font-extrabold w-fit">
          <button
            type="button"
            id={`${id}-tab-system`}
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'system'
                ? 'bg-white text-[#1A1B25] shadow-xs'
                : 'text-[#666D80] hover:text-[#1A1B25]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          <button
            type="button"
            id={`${id}-tab-upload`}
            onClick={() => {
              setActiveTab('upload');
              if (!isUploadedImage && (!selectedImages || selectedImages.length === 0)) {
                triggerFileInput();
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#1A1B25] shadow-xs'
                : 'text-[#666D80] hover:text-[#1A1B25]'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-rose-500" />
            <span>Upload Device</span>
          </button>
        </div>
      </div>

      {/* Hidden Native File Input with multi-file support */}
      <input
        ref={fileInputRef}
        id={`${id}-file-input`}
        type="file"
        multiple={true}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleMultipleFiles(Array.from(e.target.files));
          }
        }}
        className="hidden"
      />

      {/* MULTIPLE IMAGES GROUPED TRAY: Shown when multiple is active */}
      {multiple && selectedImages && selectedImages.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black text-[#1A1B25]">
                Grouped Suggestion Images ({selectedImages.length} selected)
              </span>
            </div>
            <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              1 Combined Suggestion
            </span>
          </div>
          <p className="text-[11px] text-[#666D80]">
            All images selected below will belong to this single suggestion option. Click a photo to frame it or remove it.
          </p>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            {selectedImages.map((img, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={img.id || idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`relative group shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition select-none ${
                    isActive
                      ? 'border-amber-500 ring-2 ring-amber-300 shadow-xs scale-102'
                      : 'border-[#DFE1E6] hover:border-[#808897] opacity-85 hover:opacity-100'
                  }`}
                  title={`Click to position photo #${idx + 1}`}
                >
                  <img
                    src={img.url}
                    alt={img.title || `Photo ${idx + 1}`}
                    style={getImageStyle(img.position)}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 left-1 px-1 rounded bg-black/75 text-[9px] font-black text-white">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] transition cursor-pointer shadow-xs"
                    title="Remove this photo from suggestion"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[8px] font-black text-center uppercase tracking-wider py-0.5">
                      Framing
                    </span>
                  )}
                </div>
              );
            })}

            {/* Quick Upload Tile in Tray */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                triggerFileInput();
              }}
              className="shrink-0 w-20 h-16 rounded-xl border-2 border-dashed border-[#DFE1E6] hover:border-[#1A1B25] bg-white hover:bg-[#F6F8FA] flex flex-col items-center justify-center text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer"
              title="Upload more photos from your device"
            >
              <Plus className="w-4 h-4 text-amber-600 mb-0.5" />
              <span className="text-[10px] font-bold">+ Upload</span>
            </button>
          </div>
        </div>
      )}

      {/* Selection Mode 1: System-Provided Images Library */}
      {activeTab === 'system' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {normalizedSystemImages.map((photo, i) => {
              const selectedIdx = multiple && selectedImages
                ? selectedImages.findIndex((img) => img.url === photo.url)
                : -1;
              const isSelected = multiple ? selectedIdx >= 0 : value === photo.url;

              return (
                <button
                  key={photo.url || i}
                  type="button"
                  id={`${id}-preset-${i}`}
                  onClick={() => handleSelectSystemPhoto(photo)}
                  className={`group relative ${
                    aspectRatio === 'cover' ? 'h-18' : 'h-16'
                  } rounded-xl overflow-hidden border-2 transition cursor-pointer select-none ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-300'
                      : 'border-transparent hover:opacity-90 opacity-75'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title || `System Image ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {photo.title && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-1.5 text-[10px] text-white font-bold truncate">
                      {photo.title}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      {multiple ? `✓ #${selectedIdx + 1}` : '✓'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#666D80] px-1">
            <span>
              {multiple
                ? 'Tap multiple preset photos to group them together'
                : 'Select a photo above, then drag below to adjust composition'}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                triggerFileInput();
              }}
              className="text-[#1A1B25] hover:text-amber-600 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Or upload custom photos</span>
            </button>
          </div>
        </div>
      )}

      {/* Selection Mode 2: Upload from Device */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          {/* Upload Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`p-5 rounded-2xl border-2 border-dashed transition cursor-pointer text-center ${
              isDragging
                ? 'border-amber-500 bg-amber-50/50'
                : 'border-[#DFE1E6] hover:border-[#1A1B25] bg-[#F8F9FB] hover:bg-[#F6F8FA]'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-white border border-[#DFE1E6] flex items-center justify-center text-amber-600 mb-2 shadow-xs">
                <UploadCloud className="w-4 h-4" />
              </div>
              <p className="text-xs font-extrabold text-[#1A1B25]">
                {multiple ? 'Click to select multiple images from your device' : 'Click to choose an image from your device'}
              </p>
              <p className="text-[11px] text-[#666D80] mt-0.5">
                or drag and drop multiple image files here
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-white border border-[#DFE1E6] text-[10px] font-bold text-[#808897]">
                Multi-file upload supported (JPG, PNG, WEBP, GIF up to 15MB)
              </span>
            </div>
          </div>

          {uploadedFileName && (
            <div className="p-2.5 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-emerald-800 truncate">
                    {uploadedFileName}
                  </p>
                  <p className="text-[10px] text-[#666D80]">
                    Photos added to group. Adjust composition for each photo below.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  id={`${id}-upload-more-btn`}
                  onClick={triggerFileInput}
                  className="px-2.5 py-1 rounded-xl bg-[#1A1B25] hover:bg-[#272835] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  + Add More
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Optional Custom URL text input */}
      {allowCustomUrl && (
        <div className="pt-0.5 flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#808897]">
              <LinkIcon className="w-3 h-3" />
            </div>
            <input
              id={`${id}-custom-url-input`}
              type="text"
              placeholder="Or paste image URL (https://...)"
              value={customUrlInput}
              onChange={(e) => {
                setCustomUrlInput(e.target.value);
                if (!multiple && onCustomUrlChange) {
                  onCustomUrlChange(e.target.value);
                  if (e.target.value.trim()) onChange(e.target.value.trim());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomUrl();
                }
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DFE1E6] text-xs text-[#1A1B25] placeholder-[#808897] focus:outline-none focus:border-[#1A1B25] bg-white transition-colors"
            />
          </div>
          {multiple && (
            <button
              type="button"
              onClick={handleAddCustomUrl}
              disabled={!customUrlInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-[#ECEFF3] hover:bg-[#DFE1E6] disabled:opacity-50 text-xs font-bold text-[#1A1B25] transition cursor-pointer"
            >
              + Add URL
            </button>
          )}
        </div>
      )}

      {/* INTERACTIVE IMAGE FRAME & DRAG POSITIONER */}
      {(multiple ? currentActiveImage?.url : value) ? (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-black text-[#1A1B25] px-0.5">
            <span className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {multiple && selectedImages && selectedImages.length > 1
                  ? `Reposition Photo #${activeIndex + 1} of ${selectedImages.length}`
                  : 'Composition Frame Preview & Repositioning'}
              </span>
            </span>

            {multiple && selectedImages && selectedImages.length > 1 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                  disabled={activeIndex === 0}
                  className="p-1 rounded-md bg-[#ECEFF3] hover:bg-[#DFE1E6] disabled:opacity-30 text-[#1A1B25] transition cursor-pointer"
                  title="Previous photo in group"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-[#666D80] px-1">
                  {activeIndex + 1} / {selectedImages.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveIndex(Math.min(selectedImages.length - 1, activeIndex + 1))}
                  disabled={activeIndex === selectedImages.length - 1}
                  className="p-1 rounded-md bg-[#ECEFF3] hover:bg-[#DFE1E6] disabled:opacity-30 text-[#1A1B25] transition cursor-pointer"
                  title="Next photo in group"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-[#808897]">
                Preserved when saved
              </span>
            )}
          </div>

          <ImageFramePositioner
            imageUrl={multiple && currentActiveImage ? currentActiveImage.url : value}
            position={activePosition}
            onChange={handleActivePositionChange}
            aspectRatio={aspectRatio}
            frameHeight={previewHeight}
            showControls={true}
            promptText="Drag to adjust composition"
          />
        </div>
      ) : null}
    </div>
  );
};


