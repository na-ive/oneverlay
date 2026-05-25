import { useCallback } from 'react';
import {
  LuUndo2,
  LuRedo2,
  LuSettings,
  LuMousePointer,
  LuHand,
  LuMinus,
  LuPlus,
  LuRotateCcw,
  LuCrosshair,
} from 'react-icons/lu';
import { IconButton } from '../ui/IconButton';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { zoomIn, zoomOut, zoomReset } from '../../hooks/useCanvasZoom';
import { APP_NAME, NAVBAR_HEIGHT } from '../../lib/constants';

export function Navbar() {
  const setSettingsOpen = useEditorStore((s) => s.setSettingsOpen);
  const zoom = useEditorStore((s) => s.zoom);
  const toolMode = useEditorStore((s) => s.toolMode);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const resetPan = useEditorStore((s) => s.resetPan);

  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const pastLength = useHistoryStore((s) => s.past.length);
  const futureLength = useHistoryStore((s) => s.future.length);

  const handleUndo = useCallback(() => undo(), [undo]);
  const handleRedo = useCallback(() => redo(), [redo]);

  const canUndo = pastLength > 0;
  const canRedo = futureLength > 0;

  return (
    <header
      className="relative z-20 flex items-center justify-between px-4 border-b border-white/[0.06] select-none shrink-0"
      style={{
        height: `${NAVBAR_HEIGHT}px`,
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      {/* Left — Title */}
      <div className="flex items-baseline gap-1">
        <span className="text-base font-black uppercase tracking-widest text-text-primary pl-1">
          {APP_NAME}
        </span>
        <span className="text-[9px] font-bold tracking-widest text-text-muted">
          BY NA-IVE
        </span>
      </div>

      {/* Center — Unified Toolbar */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3.5 bg-bg-primary/20 border border-white/[0.04] px-3.5 py-1 rounded-2xl">
        {/* Tool selector group */}
        <div className="flex items-center gap-1">
          <IconButton
            tooltip="Select Tool (V)"
            onClick={() => setToolMode('select')}
            active={toolMode === 'select'}
          >
            <LuMousePointer size={14} />
          </IconButton>
          <IconButton
            tooltip="Hand Tool (H / Hold Space)"
            onClick={() => setToolMode('hand')}
            active={toolMode === 'hand'}
          >
            <LuHand size={14} />
          </IconButton>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/[0.06]" />

        {/* Zoom controls group */}
        <div className="flex items-center gap-1">
          <IconButton tooltip="Zoom out" onClick={zoomOut}>
            <LuMinus size={13} />
          </IconButton>
          <span className="text-[11px] text-text-primary font-medium tabular-nums min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton tooltip="Zoom in" onClick={zoomIn}>
            <LuPlus size={13} />
          </IconButton>
          <IconButton tooltip="Reset zoom" onClick={zoomReset}>
            <LuRotateCcw size={12} />
          </IconButton>
          <IconButton tooltip="Recenter view" onClick={resetPan}>
            <LuCrosshair size={12} />
          </IconButton>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/[0.06]" />

        {/* History group */}
        <div className="flex items-center gap-0.5">
          <IconButton
            tooltip="Undo (Ctrl+Z)"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <LuUndo2 size={14} />
          </IconButton>
          <IconButton
            tooltip="Redo (Ctrl+Shift+Z)"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <LuRedo2 size={14} />
          </IconButton>
        </div>
      </div>

      {/* Right — Settings */}
      <div className="flex items-center gap-1">
        <IconButton
          tooltip="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <LuSettings size={14} />
        </IconButton>
      </div>
    </header>
  );
}

