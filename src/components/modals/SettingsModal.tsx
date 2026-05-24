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
    <Modal open={isOpen} onClose={handleClose} title="Settings" width="400px">
      <div className="space-y-4">
        {/* Scene name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wide">
            Scene Name
          </label>
          <input
            type="text"
            value={sceneName}
            onChange={(e) => setSceneName(activeSceneId, e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-border bg-bg-primary text-text-primary text-xs outline-none focus:border-accent transition-colors"
            placeholder="My Overlay"
          />
        </div>

        {/* App info */}
        <div className="flex flex-col gap-1 pt-2 border-t border-border">
          <p className="text-[11px] text-text-muted">
            {APP_NAME} — Lightweight streaming overlay compositor
          </p>
          <p className="text-[11px] text-text-muted">v0.1.0 MVP</p>
        </div>

        {/* Danger zone */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-md border border-danger/30 bg-transparent hover:bg-danger/10 text-danger text-xs font-medium transition-colors cursor-pointer"
          >
            Reset Overlay
          </button>
        </div>
      </div>
    </Modal>
  );
}
