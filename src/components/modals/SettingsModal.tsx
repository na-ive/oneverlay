import { useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore, selectActiveScene } from '../../store/sceneStore';
import { useHistoryStore } from '../../store/historyStore';
import { APP_NAME } from '../../lib/constants';

export function SettingsModal() {
  const isOpen = useEditorStore((s) => s.isSettingsOpen);
  const setOpen = useEditorStore((s) => s.setSettingsOpen);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const sceneName = useSceneStore((s) => selectActiveScene(s).name);
  const setSceneName = useSceneStore((s) => s.setSceneName);
  const resetProject = useSceneStore((s) => s.resetProject);
  const clearHistory = useHistoryStore((s) => s.clear);

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all elements and settings? This cannot be undone.')) {
      resetProject();
      clearHistory();
      handleClose();
    }
  }, [resetProject, clearHistory, handleClose]);

  return (
    <Modal open={isOpen} onClose={handleClose} title="Settings" width="480px">
      <div className="space-y-4">
        {/* Scene name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
            Scene Name
          </label>
          <input
            type="text"
            value={sceneName}
            onChange={(e) => setSceneName(activeSceneId, e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs outline-none focus:border-accent focus:bg-bg-primary/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
            placeholder="My Overlay"
          />
        </div>

        {/* App info */}
        <div className="flex flex-col gap-1 pt-3 border-t border-white/[0.06]">
          <p className="text-[11px] text-text-muted pl-1">
            {APP_NAME} — Lightweight streaming overlay compositor
          </p>
          <p className="text-[11px] text-text-muted pl-1">v0.1.0 MVP</p>
        </div>

        {/* Danger zone */}
        <div className="pt-3 border-t border-white/[0.06]">
          <button
            onClick={handleReset}
            className="w-full px-3 py-2.5 rounded-xl border border-danger/30 bg-danger/10 hover:bg-danger/20 text-danger text-xs font-semibold transition-all cursor-pointer"
          >
            Reset Project
          </button>
        </div>
      </div>
    </Modal>
  );
}
