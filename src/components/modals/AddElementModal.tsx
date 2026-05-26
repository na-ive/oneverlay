import { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore } from '../../store/sceneStore';
import { useHistoryStore } from '../../store/historyStore';
import { LuChevronDown, LuChevronRight, LuType, LuImage, LuGlobe } from 'react-icons/lu';
import type { ElementType, OverlayElement } from '../../types/elements';

const TYPE_ICONS: Record<ElementType, typeof LuType> = {
  text: LuType,
  image: LuImage,
  browser: LuGlobe,
};

export function AddElementModal() {
  const open = useEditorStore((s) => s.isAddElementOpen);
  const type = useEditorStore((s) => s.addElementType);
  const close = useEditorStore((s) => s.closeAddElementModal);
  const selectElement = useEditorStore((s) => s.selectElement);
  const openProperties = useEditorStore((s) => s.openProperties);

  const scenes = useSceneStore((s) => s.scenes);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const currentSceneElements = useMemo(() => {
    return scenes.find(s => s.id === activeSceneId)?.elements || [];
  }, [scenes, activeSceneId]);

  const addElement = useSceneStore((s) => s.addElement);
  const importElement = useSceneStore((s) => s.importElement);
  const pushHistory = useHistoryStore((s) => s.push);

  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [selectedExisting, setSelectedExisting] = useState<OverlayElement | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Record<string, boolean>>({});
  const [newName, setNewName] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (open && type) {
      setMode('new');
      setSelectedExisting(null);
      
      const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
      const count = currentSceneElements.filter(e => e.type === type).length;
      setNewName(`${typeCapitalized} ${count + 1}`);
      
      // Auto-expand all scenes that have matching elements
      const initialExpanded: Record<string, boolean> = {};
      scenes.forEach(scene => {
        initialExpanded[scene.id] = true;
      });
      setExpandedScenes(initialExpanded);
    }
  }, [open, type, scenes, currentSceneElements]);

  const matchingScenes = useMemo(() => {
    if (!type) return [];
    return scenes.map(scene => ({
      ...scene,
      matchedElements: scene.elements.filter(el => el.type === type)
    })).filter(scene => scene.matchedElements.length > 0);
  }, [scenes, type]);

  const handleSubmit = () => {
    if (!type) return;
    pushHistory();

    if (mode === 'new') {
      addElement(type, newName.trim() || undefined);
      
      setTimeout(() => {
        const updatedElements = useSceneStore.getState().scenes.find(s => s.id === activeSceneId)?.elements || [];
        const newElement = updatedElements[updatedElements.length - 1];
        if (newElement) {
          selectElement(newElement.id);
          openProperties(newElement.id);
        }
      }, 0);
    } else if (mode === 'existing' && selectedExisting) {
      importElement(selectedExisting);
      
      setTimeout(() => {
        const updatedElements = useSceneStore.getState().scenes.find(s => s.id === activeSceneId)?.elements || [];
        const newElement = updatedElements[updatedElements.length - 1];
        if (newElement) {
          selectElement(newElement.id);
          openProperties(newElement.id);
        }
      }, 0);
    }

    close();
  };

  if (!type) return null;

  const Icon = TYPE_ICONS[type];

  return (
    <Modal open={open} onClose={close} title={`Add ${type.charAt(0).toUpperCase() + type.slice(1)}`} width="480px">
      <div className="flex flex-col gap-4">
        {/* Mode Selector */}
        <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/[0.04]">
          <button
            onClick={() => setMode('new')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'new' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setMode('existing')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'existing' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Add Existing
          </button>
        </div>

        {/* New Element Name Input */}
        <div className={`transition-all overflow-hidden ${mode === 'new' ? 'opacity-100 mb-2' : 'h-0 opacity-0 mb-0 pointer-events-none'}`}>
          <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 px-1">
            Name
          </label>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-black/20 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50 focus:bg-white/[0.04] transition-all"
            placeholder={`e.g. My ${type} Source`}
          />
        </div>

        {/* Existing Elements List */}
        <div className={`flex flex-col border border-white/[0.08] rounded-xl bg-black/10 overflow-hidden ${mode === 'new' ? 'hidden' : 'flex'}`}>
          <div className="px-3 py-2 border-b border-white/[0.08] bg-white/[0.02]">
            <span className="text-xs font-medium text-text-secondary">Select source to duplicate:</span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
            {matchingScenes.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                No existing {type} elements found in any scene.
              </div>
            ) : (
              matchingScenes.map(scene => (
                <div key={scene.id} className="flex flex-col mb-1">
                  {/* Accordion Header */}
                  <div 
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-lg hover:bg-white/[0.04] text-text-secondary hover:text-text-primary transition-colors"
                    onClick={() => setExpandedScenes(prev => ({...prev, [scene.id]: !prev[scene.id]}))}
                  >
                    {expandedScenes[scene.id] ? <LuChevronDown size={14} /> : <LuChevronRight size={14} />}
                    <span className="text-xs font-semibold">{scene.name} {scene.id === activeSceneId ? '(Current)' : ''}</span>
                  </div>
                  
                  {/* Accordion Body */}
                  {expandedScenes[scene.id] && (
                    <div className="flex flex-col gap-0.5 pl-6 pr-2 py-1">
                      {scene.matchedElements.map(el => (
                        <div 
                          key={el.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
                            selectedExisting?.id === el.id 
                              ? 'bg-accent/20 text-accent border border-accent/30' 
                              : 'bg-transparent text-text-secondary hover:bg-white/[0.06] border border-transparent'
                          }`}
                          onClick={() => {
                            if (mode === 'new') setMode('existing');
                            setSelectedExisting(el);
                          }}
                        >
                          <Icon size={12} className="shrink-0" />
                          <span className="truncate">{el.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={close}
            className="px-4 py-2 rounded-xl border border-white/[0.08] bg-transparent hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mode === 'existing' && !selectedExisting}
            className="px-4 py-2 rounded-xl border border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-all cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}
