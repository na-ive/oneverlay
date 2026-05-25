import { useCallback } from 'react';
import {
  LuUndo2,
  LuRedo2,
  LuSettings,
} from 'react-icons/lu';
import { IconButton } from '../ui/IconButton';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import { APP_NAME, NAVBAR_HEIGHT } from '../../lib/constants';

export function Navbar() {
  const setSettingsOpen = useEditorStore((s) => s.setSettingsOpen);
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
      className="relative flex items-center justify-between px-4 border-b border-white/[0.06] select-none shrink-0"
      style={{
        height: `${NAVBAR_HEIGHT}px`,
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      {/* Left — Title */}
      <div className="flex items-center gap-2">
        <span className="text-base font-black uppercase tracking-widest text-text-primary pl-1">
          {APP_NAME}
        </span>
      </div>

      {/* Center — Undo / Redo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-0.5">
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
