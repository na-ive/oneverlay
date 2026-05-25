import { useMemo } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useSceneStore, selectCanvas } from '../store/sceneStore';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../lib/constants';

interface CanvasLayout {
  /** Scale factor to fit canvas into available space */
  scale: number;
  /** Offset X to center the canvas */
  offsetX: number;
  /** Offset Y to center the canvas */
  offsetY: number;
  /** Available container width */
  containerWidth: number;
  /** Available container height */
  containerHeight: number;
}

export function useCanvasZoom(
  containerWidth: number,
  containerHeight: number,
): CanvasLayout {
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const canvasWidth = useSceneStore((s) => selectCanvas(s).width);
  const canvasHeight = useSceneStore((s) => selectCanvas(s).height);

  return useMemo(() => {
    // Fit canvas into container with padding
    const padding = 40;
    const availW = containerWidth - padding * 2;
    const availH = containerHeight - padding * 2;

    const fitScale = Math.min(availW / canvasWidth, availH / canvasHeight, 1);
    const scale = fitScale * zoom;

    const scaledW = canvasWidth * scale;
    const scaledH = canvasHeight * scale;

    const offsetX = (containerWidth - scaledW) / 2 + panX;
    const offsetY = (containerHeight - scaledH) / 2 + panY;

    return { scale, offsetX, offsetY, containerWidth, containerHeight };
  }, [containerWidth, containerHeight, canvasWidth, canvasHeight, zoom, panX, panY]);
}

export function zoomIn() {
  const { zoom, setZoom } = useEditorStore.getState();
  setZoom(Math.min(zoom + ZOOM_STEP, ZOOM_MAX));
}

export function zoomOut() {
  const { zoom, setZoom } = useEditorStore.getState();
  setZoom(Math.max(zoom - ZOOM_STEP, ZOOM_MIN));
}

export function zoomReset() {
  useEditorStore.getState().setZoom(1);
  useEditorStore.getState().resetPan();
}
