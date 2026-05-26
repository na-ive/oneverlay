import { useState, useCallback } from 'react';
import { LuSave, LuGlobe, LuCopy, LuRefreshCw, LuLoader } from 'react-icons/lu';
import { useSceneStore } from '../../store/sceneStore';
import { saveProject } from '../../lib/persistence';
import { generateOverlayCode } from '../../lib/api';

export function ActionsPanel() {
  const getSnapshot = useSceneStore((s) => s.getSnapshot);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const scenes = useSceneStore((s) => s.scenes);
  const setOverlayCode = useSceneStore((s) => s.setOverlayCode);
  const activeScene = scenes.find((s) => s.id === activeSceneId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSave = useCallback(() => {
    saveProject(getSnapshot());
  }, [getSnapshot]);

  const handleGenerateLink = useCallback(async () => {
    if (!activeSceneId) return;
    setIsGenerating(true);
    try {
      const newCode = await generateOverlayCode(activeSceneId);
      setOverlayCode(activeSceneId, newCode);
    } catch (err) {
      console.warn('[Oneverlay] Failed to generate overlay code:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [activeSceneId, setOverlayCode]);

  const handleSaveAndGenerate = useCallback(async () => {
    handleSave();
    await handleGenerateLink();
  }, [handleSave, handleGenerateLink]);

  const handleCopyLink = useCallback(async () => {
    if (!activeScene?.overlayCode) return;
    const url = `${window.location.origin}/o/${activeScene.overlayCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [activeScene?.overlayCode]);

  const handleOpenOverlay = useCallback(() => {
    if (activeScene?.overlayCode) {
      window.open(`/o/${activeScene.overlayCode}`, '_blank', 'noopener,noreferrer');
    }
  }, [activeScene?.overlayCode]);

  const hasCode = !!activeScene?.overlayCode;

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
          {!hasCode ? (
            <button
              onClick={handleSaveAndGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md shadow-accent/15 transition-all cursor-pointer border-none disabled:opacity-50"
            >
              {isGenerating ? <LuLoader size={13} className="animate-spin" /> : <LuSave size={13} />}
              {isGenerating ? 'Generating...' : 'Save & Generate'}
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md shadow-accent/15 transition-all cursor-pointer border-none"
              >
                <LuSave size={13} />
                Save Overlay
              </button>

              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
                >
                  <LuCopy size={13} />
                  {copiedLink ? 'Copied to Clipboard' : 'Copy Overlay Link'}
                </button>
                <button
                  onClick={handleGenerateLink}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                  title="Regenerate Link (invalidates old link)"
                >
                  {isGenerating ? <LuLoader size={13} className="animate-spin" /> : <LuRefreshCw size={13} />}
                  Regenerate Link
                </button>
                <button
                  onClick={handleOpenOverlay}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-surface hover:bg-white/[0.06] text-text-primary text-xs font-medium transition-all cursor-pointer"
                >
                  <LuGlobe size={13} />
                  Open Link
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
