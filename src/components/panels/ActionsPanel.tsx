import { useCallback } from 'react';
import { LuSave, LuHeart } from 'react-icons/lu';
import { useSceneStore } from '../../store/sceneStore';
import { saveScene } from '../../lib/persistence';
import { SUPPORT_URL } from '../../lib/constants';

export function ActionsPanel() {
  const getSnapshot = useSceneStore((s) => s.getSnapshot);

  const handleSave = useCallback(() => {
    saveScene(getSnapshot());
  }, [getSnapshot]);

  const handleSupport = useCallback(() => {
    window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center px-3 py-1.5 border-b border-border shrink-0">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          Actions
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-3">
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer border-none"
        >
          <LuSave size={13} />
          Save
        </button>

        <button
          onClick={handleSupport}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary text-xs font-medium transition-colors cursor-pointer"
        >
          <LuHeart size={13} />
          Support
        </button>
      </div>
    </div>
  );
}
