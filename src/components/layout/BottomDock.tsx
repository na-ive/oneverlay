import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { DOCK_MIN_HEIGHT, DOCK_MAX_HEIGHT } from '../../lib/constants';

interface BottomDockProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export function BottomDock({ left, center, right }: BottomDockProps) {
  const height = useEditorStore((s) => s.bottomDockHeight);
  const setHeight = useEditorStore((s) => s.setBottomDockHeight);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = height;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [height],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      const newHeight = Math.max(
        DOCK_MIN_HEIGHT,
        Math.min(DOCK_MAX_HEIGHT, startHeight.current + delta),
      );
      setHeight(newHeight);
    },
    [setHeight],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      className="flex flex-col shrink-0 border-t border-border"
      style={{
        height: `${height}px`,
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      {/* Resize handle */}
      <div
        className="resize-handle-ns h-1 w-full hover:bg-accent/30 transition-colors shrink-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left — Elements */}
        <div className="flex-1 flex flex-col border-r border-border min-w-0">
          {left}
        </div>

        {/* Center — Canvas Settings */}
        <div className="w-64 flex flex-col border-r border-border shrink-0 overflow-hidden">
          {center}
        </div>

        {/* Right — Actions */}
        <div className="w-48 flex flex-col shrink-0 overflow-hidden">
          {right}
        </div>
      </div>
    </div>
  );
}
