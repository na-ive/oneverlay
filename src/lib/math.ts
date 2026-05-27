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

/**
 * Calculates the bounding box of an element taking rotation into account.
 * This calculates the AABB (Axis-Aligned Bounding Box) for the snapping system.
 */
export function getActualBoundingBox(el: OverlayElement) {
  const cropLeft = el.cropLeft || 0;
  const cropTop = el.cropTop || 0;
  const cropRight = el.cropRight || 0;
  const cropBottom = el.cropBottom || 0;

  const w = Math.max(1, el.width - cropLeft - cropRight) * el.scaleX;
  const h = Math.max(1, el.height - cropTop - cropBottom) * el.scaleY;

  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // 4 corners of the element relative to its top-left point (0,0) after rotation
  const p1 = { x: 0, y: 0 };
  const p2 = { x: w * cos, y: w * sin };
  const p3 = { x: w * cos - h * sin, y: w * sin + h * cos };
  const p4 = { x: -h * sin, y: h * cos };

  const minX = el.x + Math.min(p1.x, p2.x, p3.x, p4.x);
  const maxX = el.x + Math.max(p1.x, p2.x, p3.x, p4.x);
  const minY = el.y + Math.min(p1.y, p2.y, p3.y, p4.y);
  const maxY = el.y + Math.max(p1.y, p2.y, p3.y, p4.y);

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
