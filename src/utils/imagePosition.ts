import React from 'react';
import { ImagePosition } from '../types';

export const DEFAULT_IMAGE_POSITION: ImagePosition = {
  x: 50,
  y: 50,
  scale: 1,
};

/**
 * Clamps a number between min and max
 */
export function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Normalizes an ImagePosition object with safe defaults
 */
export function normalizeImagePosition(pos?: Partial<ImagePosition> | null): ImagePosition {
  if (!pos) return { ...DEFAULT_IMAGE_POSITION };
  return {
    x: typeof pos.x === 'number' && !isNaN(pos.x) ? clamp(Math.round(pos.x)) : 50,
    y: typeof pos.y === 'number' && !isNaN(pos.y) ? clamp(Math.round(pos.y)) : 50,
    scale: typeof pos.scale === 'number' && !isNaN(pos.scale) ? Math.max(1, Math.min(3, Number(pos.scale.toFixed(2)))) : 1,
  };
}

/**
 * Generates standard CSS properties for rendering an image positioned within its frame.
 * Ensures the image fits properly with object-cover, never distorts, and applies user's exact offset.
 */
export function getImageStyle(position?: ImagePosition | null): React.CSSProperties {
  const norm = normalizeImagePosition(position);
  const style: React.CSSProperties = {
    objectFit: 'cover',
    objectPosition: `${norm.x}% ${norm.y}%`,
  };

  if (norm.scale && norm.scale > 1) {
    style.transform = `scale(${norm.scale})`;
    style.transformOrigin = `${norm.x}% ${norm.y}%`;
  }

  return style;
}

/**
 * Friendly human-readable label for the current position
 */
export function getPositionLabel(pos?: ImagePosition | null): string {
  const norm = normalizeImagePosition(pos);
  const xLabel = norm.x < 35 ? 'Left' : norm.x > 65 ? 'Right' : 'Center';
  const yLabel = norm.y < 35 ? 'Top' : norm.y > 65 ? 'Bottom' : 'Center';

  if (xLabel === 'Center' && yLabel === 'Center') {
    return 'Center';
  }
  if (xLabel === 'Center') {
    return yLabel;
  }
  if (yLabel === 'Center') {
    return xLabel;
  }
  return `${yLabel} ${xLabel}`;
}
