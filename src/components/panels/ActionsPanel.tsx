import { useCallback } from 'react';
import { LuSave, LuGlobe } from 'react-icons/lu';
import { useSceneStore } from '../../store/sceneStore';
import { saveProject } from '../../lib/persistence';

export function ActionsPanel() {
  const getSnapshot = useSceneStore((s) => s.getSnapshot);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const scenes = useSceneStore((s) => s.scenes);
  const activeScene = scenes.find((s) => s.id === activeSceneId);

  const handleSave = useCallback(() => {
    saveProject(getSnapshot());
  }, [getSnapshot]);

  const handleOpenOverlay = useCallback(() => {
    if (activeScene) {
      const slug = activeScene.name
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
      window.open(`/o/${slug}`, '_blank', 'noopener,noreferrer');
    }
  }, [activeScene]);

  return (
    <div className="flex flex-col h-full bg-bg-secondary/10">
      {/* Panel header */}
      <div className="flex items-center px-4 h-[38px] border-b border-white/[0.06] shrink-0">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Actions
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between p-3.5">
        {/* Top Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md shadow-accent/15 transition-all cursor-pointer border-none"
          >
            <LuSave size={13} />
            Save Overlay
          </button>

          <button
            onClick={handleOpenOverlay}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
          >
            <LuGlobe size={13} />
            Open Overlay
          </button>
        </div>
      </div>
    </div>
  );
}
