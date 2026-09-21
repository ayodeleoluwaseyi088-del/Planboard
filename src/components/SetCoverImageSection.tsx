import React, { useState, useRef } from 'react';
import { Move, Upload, X } from 'lucide-react';
import { ImagePosition } from '../types';
import { clamp, normalizeImagePosition, DEFAULT_IMAGE_POSITION } from '../utils/imagePosition';
import { CornerCheckBadge } from './SelectionBadge';
import { compressImageFile } from '../utils/imageCompressor';

export const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
];

interface SetCoverImageSectionProps {
  coverImage: string;
  onCoverImageChange: (url: string) => void;
  coverImagePosition: ImagePosition;
  onCoverImagePositionChange: (position: ImagePosition) => void;
}

export const SetCoverImageSection: React.FC<SetCoverImageSectionProps> = ({
  coverImage,
  onCoverImageChange,
  coverImagePosition,
  onCoverImagePositionChange,
}) => {
  const isCustomUploaded = coverImage.startsWith('data:image/') || (!COVER_PRESETS.includes(coverImage) && Boolean(coverImage));

  // Mode: 'preset' or 'upload'
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>(() =>
    isCustomUploaded ? 'upload' : 'preset'
  );

  // Stored uploaded custom image (if any)
  const [uploadedImage, setUploadedImage] = useState<string | null>(() =>
    isCustomUploaded ? coverImage : null
  );

  // Stored active preset
  const [selectedPreset, setSelectedPreset] = useState<string>(() =>
    COVER_PRESETS.includes(coverImage) ? coverImage : COVER_PRESETS[0]
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const [isRepositionDragging, setIsRepositionDragging] = useState(false);

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    rectWidth: number;
    rectHeight: number;
  }>({
    startX: 0,
    startY: 0,
    initialX: 50,
    initialY: 50,
    rectWidth: 1,
    rectHeight: 1,
  });

  const normalizedPos = normalizeImagePosition(coverImagePosition);

  // Switch to preset mode
  const handleSelectPresetTab = () => {
    setActiveTab('preset');
    onCoverImageChange(selectedPreset);
  };

  // Switch to upload mode
  const handleSelectUploadTab = () => {
    setActiveTab('upload');
    if (uploadedImage) {
      onCoverImageChange(uploadedImage);
    }
  };

  // Select a preset thumbnail
  const handleSelectPreset = (url: string) => {
    setSelectedPreset(url);
    onCoverImageChange(url);
    onCoverImagePositionChange({ ...DEFAULT_IMAGE_POSITION });
  };

  // Handle uploaded file
  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const dataUrl = await compressImageFile(file, 1400, 1000, 0.82);
      if (dataUrl) {
        setUploadedImage(dataUrl);
        onCoverImageChange(dataUrl);
        onCoverImagePositionChange({ ...DEFAULT_IMAGE_POSITION });
        setActiveTab('upload');
      }
    } catch (err) {
      console.warn('Failed to compress cover image:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Clear uploaded image (X button on State 3)
  const handleClearUploadedImage = () => {
    setUploadedImage(null);
    onCoverImageChange(selectedPreset);
    onCoverImagePositionChange({ ...DEFAULT_IMAGE_POSITION });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Dropzone drag-and-drop
  const handleDropzoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverDropzone(true);
  };

  const handleDropzoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverDropzone(false);
  };

  const handleDropzoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverDropzone(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Drag-to-reposition pointer handlers for cover banner
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const banner = bannerRef.current;
    if (!banner) return;

    const rect = banner.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: normalizedPos.x,
      initialY: normalizedPos.y,
      rectWidth: Math.max(rect.width, 100),
      rectHeight: Math.max(rect.height, 80),
    };

    setIsRepositionDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRepositionDragging) return;

    const { startX, startY, initialX, initialY, rectWidth, rectHeight } = dragStartRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Moving mouse/finger moves image opposite to reveal obscured parts
    const deltaPercentX = (deltaX / rectWidth) * 100;
    const deltaPercentY = (deltaY / rectHeight) * 100;

    const nextX = clamp(Math.round(initialX - deltaPercentX));
    const nextY = clamp(Math.round(initialY - deltaPercentY));

    onCoverImagePositionChange({
      x: nextX,
      y: nextY,
      scale: normalizedPos.scale ?? 1,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRepositionDragging) return;
    setIsRepositionDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }
  };

  // Determine which image is currently displayed in the banner
  const activeBannerImage = activeTab === 'preset' ? selectedPreset : uploadedImage;

  return (
    <div className="space-y-4 pt-1 pb-6 animate-in fade-in duration-150 font-['Nunito',sans-serif]">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header: Description on left, Preset/Upload toggle on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-[13px] text-[#808897] font-semibold leading-relaxed">
          Choose from system-provided covers or upload<br />
          your own cover from device
        </p>

        {/* Segmented Pill Toggle: Preset | Upload */}
        <div className="inline-flex items-center p-1 rounded-full bg-[#ECEFF3] self-start sm:self-auto shrink-0 select-none">
          <button
            type="button"
            onClick={handleSelectPresetTab}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] transition cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-white text-[#1A1B25] font-bold shadow-xs'
                : 'text-[#666D80] font-semibold hover:text-[#1A1B25]'
            }`}
          >
            Preset
          </button>
          <button
            type="button"
            onClick={handleSelectUploadTab}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#1A1B25] font-bold shadow-xs'
                : 'text-[#666D80] font-semibold hover:text-[#1A1B25]'
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      {/* STATE 1: Preset toggle ON (Image 1 reference) */}
      {activeTab === 'preset' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Row of 4 Preset Thumbnails */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
            {COVER_PRESETS.map((presetUrl, idx) => {
              const isSelected = selectedPreset === presetUrl;
              return (
                <button
                  key={`${presetUrl}-${idx}`}
                  type="button"
                  onClick={() => handleSelectPreset(presetUrl)}
                  className={`relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl cursor-pointer select-none transition-all p-0.5 ${
                    isSelected
                      ? 'border-2 border-[#EFA00E] shadow-2xs'
                      : 'border-2 border-transparent hover:opacity-90'
                  }`}
                >
                  <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                    <img
                      src={presetUrl}
                      alt={`Cover preset ${idx + 1}`}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>

                  {/* Top-Right Corner Golden Checkmark Badge on Selected */}
                  {isSelected && <CornerCheckBadge size="sm" />}
                </button>
              );
            })}
          </div>

          {/* Large Cover Banner Preview & Drag Repositioner */}
          <div
            ref={bannerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`relative w-full aspect-[2.4/1] sm:aspect-[2.6/1] rounded-2xl overflow-hidden bg-[#1A1B25] select-none ${
              isRepositionDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Reposition Badge: Top Left Pill */}
            <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#1A1B25] text-xs font-extrabold shadow-sm pointer-events-none select-none">
              <Move className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Drag to reposition</span>
            </div>

            {/* Repositionable Cover Image */}
            <img
              src={selectedPreset}
              alt="Preset Cover Preview"
              style={{
                objectPosition: `${normalizedPos.x}% ${normalizedPos.y}%`,
                transform: `scale(${normalizedPos.scale ?? 1})`,
              }}
              draggable={false}
              className="w-full h-full object-cover select-none pointer-events-none transition-[object-position] duration-75 ease-out will-change-[object-position]"
            />
          </div>
        </div>
      )}

      {/* STATE 2 & STATE 3: Upload Device toggle ON */}
      {activeTab === 'upload' && (
        <>
          {/* STATE 2: Empty Upload Dropzone (Image 2 reference) */}
          {!uploadedImage ? (
            <div
              onDragOver={handleDropzoneDragOver}
              onDragLeave={handleDropzoneDragLeave}
              onDrop={handleDropzoneDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-[2.4/1] sm:aspect-[2.6/1] rounded-2xl bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center transition cursor-pointer select-none ${
                isDraggingOverDropzone ? 'bg-[#ECEFF3]' : ''
              }`}
            >
              <p className="text-xs sm:text-sm font-medium text-[#808897] mb-3.5">
                Upload image from your device
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#1A1B25] text-xs sm:text-sm font-bold shadow-2xs hover:bg-[#F6F8FA] active:scale-98 transition cursor-pointer select-none"
              >
                <Upload className="w-4 h-4 stroke-[2.2]" />
                <span>Click to upload</span>
              </button>
            </div>
          ) : (
            /* STATE 3: After Image Upload (Image 3 reference) */
            <div
              ref={bannerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative w-full aspect-[2.4/1] sm:aspect-[2.6/1] rounded-2xl overflow-hidden bg-[#1A1B25] select-none ${
                isRepositionDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Reposition Badge: Top Left Pill */}
              <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#1A1B25] text-xs font-extrabold shadow-sm pointer-events-none select-none">
                <Move className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Drag to reposition</span>
              </div>

              {/* Remove Uploaded Image Button: Top Right Circular Close */}
              <button
                type="button"
                onClick={handleClearUploadedImage}
                aria-label="Remove uploaded image"
                className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-20 w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-[#1A1B25] flex items-center justify-center shadow-sm transition cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Repositionable Uploaded Image */}
              <img
                src={uploadedImage}
                alt="Uploaded Cover Preview"
                style={{
                  objectPosition: `${normalizedPos.x}% ${normalizedPos.y}%`,
                  transform: `scale(${normalizedPos.scale ?? 1})`,
                }}
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none transition-[object-position] duration-75 ease-out will-change-[object-position]"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
