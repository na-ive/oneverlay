import type { OverlayElement } from '../types/elements';

/**
 * Calculates the new top-left (x, y) coordinate so that the element appears
 * to rotate around its center point rather than its top-left point.
 */
export function rotateAroundCenter(el: OverlayElement, newRotationDeg: number) {
  const w = el.width * el.scaleX;
  const h = el.height * el.scaleY;
  
  // Convert degrees to radians
  const oldTheta = (el.rotation * Math.PI) / 180;
  const newTheta = (newRotationDeg * Math.PI) / 180;

  // 1. Find current center point
  const cx = el.x + (w / 2) * Math.cos(oldTheta) - (h / 2) * Math.sin(oldTheta);
  const cy = el.y + (w / 2) * Math.sin(oldTheta) + (h / 2) * Math.cos(oldTheta);

  // 2. Calculate new top-left to keep center the same
  const newX = cx - (w / 2) * Math.cos(newTheta) + (h / 2) * Math.sin(newTheta);
  const newY = cy - (w / 2) * Math.sin(newTheta) - (h / 2) * Math.cos(newTheta);

  return {
    x: Math.round(newX),
    y: Math.round(newY),
    rotation: newRotationDeg,
  };
}
