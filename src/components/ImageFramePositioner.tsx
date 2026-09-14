import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Move, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Grid3X3,
  Check,
  Maximize2
} from 'lucide-react';
import { ImagePosition } from '../types';
import { 
  clamp, 
  normalizeImagePosition, 
  getImageStyle, 
  getPositionLabel, 
  DEFAULT_IMAGE_POSITION 
} from '../utils/imagePosition';

export interface ImageFramePositionerProps {
  imageUrl: string;
  position?: ImagePosition;
  onChange?: (position: ImagePosition) => void;
  aspectRatio?: 'cover' | 'standard' | 'square' | 'wide';
  frameHeight?: string;
  readOnly?: boolean;
  className?: string;
  showControls?: boolean;
  showRuleOfThirds?: boolean;
  promptText?: string;
}

export const ImageFramePositioner: React.FC<ImageFramePositionerProps> = ({
  imageUrl,
  position,
  onChange,
  aspectRatio = 'standard',
  frameHeight,
  readOnly = false,
  className = '',
  showControls = true,
  promptText = 'Drag image to reposition within frame',
}) => {
  const [internalPos, setInternalPos] = useState<ImagePosition>(() =>
    normalizeImagePosition(position)
  );
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showFineTune, setShowFineTune] = useState(false);

  // Sync external position changes
  useEffect(() => {
    if (position) {
      setInternalPos(normalizeImagePosition(position));
    }
  }, [position?.x, position?.y, position?.scale]);

  const frameRef = useRef<HTMLDivElement | null>(null);
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

  const updatePosition = useCallback((newPos: ImagePosition) => {
    setInternalPos(newPos);
    onChange?.(newPos);
  }, [onChange]);

  // Pointer drag events for direct on-canvas repositioning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly) return;
    // Only respond to primary mouse click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: internalPos.x,
      initialY: internalPos.y,
      rectWidth: Math.max(rect.width, 100),
      rectHeight: Math.max(rect.height, 80),
    };

    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if browser doesn't allow pointer capture
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || readOnly) return;

    const { startX, startY, initialX, initialY, rectWidth, rectHeight } = dragStartRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Moving mouse to the right moves the image right, revealing the left part (so object-position X decreases).
    // Moving mouse to the left moves the image left, revealing the right part (so object-position X increases).
    // Sensitivity factor: dragging full width covers approximately 100% of range.
    const deltaPercentX = (deltaX / rectWidth) * 100;
    const deltaPercentY = (deltaY / rectHeight) * 100;

    const nextX = clamp(Math.round(initialX - deltaPercentX));
    const nextY = clamp(Math.round(initialY - deltaPercentY));

    const nextPos: ImagePosition = {
      x: nextX,
      y: nextY,
      scale: internalPos.scale ?? 1,
    };

    updatePosition(nextPos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }
  };

  // Directional nudge buttons (5% increments)
  const nudge = (dx: number, dy: number) => {
    const nextX = clamp(internalPos.x + dx);
    const nextY = clamp(internalPos.y + dy);
    updatePosition({ ...internalPos, x: nextX, y: nextY });
  };

  // Zoom control
  const handleZoom = (delta: number) => {
    const currentScale = internalPos.scale ?? 1;
    const nextScale = Number(Math.max(1, Math.min(2.5, currentScale + delta)).toFixed(2));
    updatePosition({ ...internalPos, scale: nextScale });
  };

  // Reset to default center
  const handleReset = () => {
    updatePosition({ ...DEFAULT_IMAGE_POSITION });
  };

  // Quick preset alignments
  const applyPreset = (x: number, y: number) => {
    updatePosition({ ...internalPos, x, y });
  };

  // Frame aspect ratio dimensions
  const getAspectRatioClasses = () => {
    if (frameHeight) return frameHeight;
    switch (aspectRatio) {
      case 'cover':
        return 'h-48 sm:h-56 w-full';
      case 'wide':
        return 'h-40 sm:h-48 w-full';
      case 'square':
        return 'h-48 sm:h-56 w-48 sm:w-56 mx-auto';
      case 'standard':
      default:
        return 'h-44 sm:h-52 w-full';
    }
  };

  const positionLabel = getPositionLabel(internalPos);
  const imageStyle = getImageStyle(internalPos);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Frame Container */}
      <div className="relative">
        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          tabIndex={readOnly ? undefined : 0}
          role={readOnly ? undefined : 'region'}
          aria-label={readOnly ? 'Positioned image' : 'Image positioning canvas. Drag to reposition.'}
          onKeyDown={(e) => {
            if (readOnly) return;
            const step = e.shiftKey ? 10 : 3;
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              nudge(0, -step);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              nudge(0, step);
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              nudge(-step, 0);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              nudge(step, 0);
            }
          }}
          className={`relative ${getAspectRatioClasses()} rounded-2xl overflow-hidden bg-[#1A1B25] border border-[#ECEFF3] shadow-xs select-none transition-shadow ${
            !readOnly
              ? isDragging
                ? 'cursor-grabbing ring-2 ring-[#1A1B25] shadow-md'
                : 'cursor-grab hover:ring-2 hover:ring-amber-500/50'
              : ''
          }`}
        >
          {/* Rendered Image (Clipped inside frame, styled with user position) */}
          <img
            src={imageUrl}
            alt="Preview composition"
            style={imageStyle}
            className="w-full h-full pointer-events-none select-none transition-[object-position] duration-75 ease-out will-change-[object-position,transform]"
            draggable={false}
          />

          {/* Rule of Thirds Visual Guide Overlay (Shown when dragging or toggled) */}
          {(isDragging || showGrid) && !readOnly && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 transition-opacity duration-200">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-white/25" />
              <div className="border-r border-white/25" />
              <div />
            </div>
          )}

          {/* Floating Instructions & Status Pill */}
          {!readOnly && (
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
              {/* Drag Prompt Badge */}
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm backdrop-blur-md transition-all ${
                  isDragging
                    ? 'bg-[#1A1B25]/90 text-white scale-95'
                    : 'bg-white/90 text-[#1A1B25] border border-white/40'
                }`}
              >
                <Move className={`w-3 h-3 ${isDragging ? 'text-amber-400 animate-spin' : 'text-[#666D80]'}`} />
                <span>{isDragging ? 'Repositioning...' : promptText}</span>
              </div>

              {/* Live Coordinates Pill */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                <span>{positionLabel}</span>
                <span className="text-white/60">({internalPos.x}%, {internalPos.y}%)</span>
                {internalPos.scale && internalPos.scale > 1 && (
                  <span className="text-amber-300 ml-0.5">• {internalPos.scale}x</span>
                )}
              </div>
            </div>
          )}

          {/* Interactive Drag Shield Indicator (Subtle bottom-right hint) */}
          {!readOnly && !isDragging && (
            <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-[10px] font-semibold text-white/90 shadow-xs">
                Drag to adjust
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Reposition Controls Bar */}
      {!readOnly && showControls && (
        <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Quick Preset Alignments */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-[#666D80] mr-1">Align:</span>
              <button
                type="button"
                onClick={() => applyPreset(50, 15)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  internalPos.y < 30 ? 'bg-[#1A1B25] text-white shadow-xs' : 'bg-white text-[#353849] hover:bg-[#ECEFF3] border border-[#DFE1E6]'
                }`}
                title="Focus Top (faces / horizon)"
              >
                Top
              </button>
              <button
                type="button"
                onClick={() => applyPreset(50, 50)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  internalPos.x === 50 && internalPos.y === 50 ? 'bg-[#1A1B25] text-white shadow-xs' : 'bg-white text-[#353849] hover:bg-[#ECEFF3] border border-[#DFE1E6]'
                }`}
                title="Center composition"
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => applyPreset(50, 85)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  internalPos.y > 70 ? 'bg-[#1A1B25] text-white shadow-xs' : 'bg-white text-[#353849] hover:bg-[#ECEFF3] border border-[#DFE1E6]'
                }`}
                title="Focus Bottom"
              >
                Bottom
              </button>
            </div>

            {/* Reset & Grid Guide Toggle */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setShowGrid((prev) => !prev)}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  showGrid
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-white text-[#666D80] hover:text-[#1A1B25] border border-[#DFE1E6]'
                }`}
                title="Toggle composition grid"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="text-[10px]">Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFineTune((prev) => !prev)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  showFineTune
                    ? 'bg-[#1A1B25] text-white border-[#1A1B25]'
                    : 'bg-white text-[#666D80] hover:text-[#1A1B25] border-[#DFE1E6]'
                }`}
              >
                Fine Tune
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#666D80] transition cursor-pointer"
                title="Reset to Center"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="text-[10px]">Reset</span>
              </button>
            </div>
          </div>

          {/* Fine Tune Drawer: Directional Nudge Arrows & Zoom Scale */}
          {showFineTune && (
            <div className="pt-2 border-t border-[#DFE1E6] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
              {/* Directional Arrows */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#666D80] mr-1">Nudge:</span>
                <button
                  type="button"
                  onClick={() => nudge(-5, 0)}
                  className="p-1.5 rounded-lg bg-white border border-[#DFE1E6] hover:bg-[#ECEFF3] text-[#1A1B25] transition cursor-pointer"
                  title="Move Left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => nudge(0, -5)}
                    className="p-1 rounded-md bg-white border border-[#DFE1E6] hover:bg-[#ECEFF3] text-[#1A1B25] transition cursor-pointer"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(0, 5)}
                    className="p-1 rounded-md bg-white border border-[#DFE1E6] hover:bg-[#ECEFF3] text-[#1A1B25] transition cursor-pointer"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => nudge(5, 0)}
                  className="p-1.5 rounded-lg bg-white border border-[#DFE1E6] hover:bg-[#ECEFF3] text-[#1A1B25] transition cursor-pointer"
                  title="Move Right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom / Crop Scale */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-[#666D80] flex items-center gap-1 shrink-0">
                  <Maximize2 className="w-3 h-3" />
                  <span>Zoom / Crop:</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleZoom(-0.1)}
                  disabled={(internalPos.scale ?? 1) <= 1}
                  className="p-1 rounded-lg bg-white border border-[#DFE1E6] hover:bg-[#ECEFF3] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-[#666D80]" />
                </button>

                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={internalPos.scale ?? 1}
                  onChange={(e) => {
                    const nextScale = Number(parseFloat(e.target.value).toFixed(2));
                    updatePosition({ ...internalPos, scale: nextScale });
                  }}
                  className="w-24 sm:w-28 accent-[#1A1B25] cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => handleZoom(0.1)}
                  disabled={(internalPos.scale ?? 1) >= 2.5}
                  className="p-1 rounded-lg bg-white border border-[#DFE1E6] hover:bg-[#ECEFF3] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#666D80]" />
                </button>

                <span className="text-[11px] font-extrabold text-[#1A1B25] w-8 text-right">
                  {internalPos.scale ?? 1}x
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
