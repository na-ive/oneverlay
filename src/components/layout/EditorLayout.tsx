import { useEffect, useCallback } from 'react';
import { Navbar } from './Navbar';
import { BottomDock } from './BottomDock';
import { CanvasEditor } from '../canvas/CanvasEditor';
import { ElementsPanel } from '../panels/ElementsPanel';
import { CanvasPanel } from '../panels/CanvasPanel';
import { ActionsPanel } from '../panels/ActionsPanel';
import { SettingsModal } from '../modals/SettingsModal';
import { PropertiesModal } from '../modals/PropertiesModal';
import { usePersistence } from '../../hooks/usePersistence';
import { useHistoryStore } from '../../store/historyStore';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore } from '../../store/sceneStore';

export function EditorLayout() {
  usePersistence();

  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const removeElement = useSceneStore((s) => s.removeElement);
  const pushHistory = useHistoryStore((s) => s.push);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      // Undo
      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo
      if (isCtrl && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (isCtrl && e.key === 'y') {
        e.preventDefault();
        redo();
      }

      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Don't delete if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          return;
        }
        e.preventDefault();
        pushHistory();
        removeElement(selectedId);
        selectElement(null);
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        selectElement(null);
      }
    },
    [undo, redo, selectedId, removeElement, selectElement, pushHistory],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Navbar />

      <CanvasEditor />

      <BottomDock
        left={<ElementsPanel />}
        center={<CanvasPanel />}
        right={<ActionsPanel />}
      />

      <SettingsModal />
      <PropertiesModal />
    </div>
  );
}
