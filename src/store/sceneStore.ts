import { create } from 'zustand';
import type {
  OverlayElement,
  CanvasSettings,
  SceneData,
  ElementType,
} from '../types/elements';
import { createElement, createDefaultScene } from '../lib/defaults';
import { loadScene } from '../lib/persistence';

interface SceneState extends SceneData {
  // ── Element actions ──
  addElement: (type: ElementType) => void;
  updateElement: (id: string, updates: Partial<OverlayElement>) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  toggleVisibility: (id: string) => void;
  reorderElement: (fromIndex: number, toIndex: number) => void;
  duplicateElement: (id: string) => void;

  // ── Canvas actions ──
  setCanvasSize: (width: number, height: number) => void;

  // ── Scene actions ──
  setSceneName: (name: string) => void;
  loadSceneData: (data: SceneData) => void;
  resetScene: () => void;

  // ── Snapshot for undo/redo ──
  getSnapshot: () => SceneData;
  restoreSnapshot: (snapshot: SceneData) => void;
}

const initialScene = loadScene() || createDefaultScene();

export const useSceneStore = create<SceneState>((set, get) => ({
  // ── Initial state ──
  ...initialScene,

  // ── Element actions ──
  addElement: (type: ElementType) => {
    const element = createElement(type);
    const elements = get().elements;
    element.zIndex = elements.length;
    element.name = `${element.name} ${elements.filter(e => e.type === type).length + 1}`;
    set({
      elements: [...elements, element],
      updatedAt: Date.now(),
    });
  },

  updateElement: (id: string, updates: Partial<OverlayElement>) => {
    set({
      elements: get().elements.map(el =>
        el.id === id ? { ...el, ...updates } as OverlayElement : el
      ),
      updatedAt: Date.now(),
    });
  },

  removeElement: (id: string) => {
    set({
      elements: get().elements.filter(el => el.id !== id),
      updatedAt: Date.now(),
    });
  },

  moveElement: (id: string, x: number, y: number) => {
    set({
      elements: get().elements.map(el =>
        el.id === id ? { ...el, x: Math.round(x), y: Math.round(y) } : el
      ),
      updatedAt: Date.now(),
    });
  },

  resizeElement: (id: string, width: number, height: number) => {
    set({
      elements: get().elements.map(el =>
        el.id === id
          ? { ...el, width: Math.round(width), height: Math.round(height) }
          : el
      ),
      updatedAt: Date.now(),
    });
  },

  toggleVisibility: (id: string) => {
    set({
      elements: get().elements.map(el =>
        el.id === id ? { ...el, hidden: !el.hidden } : el
      ),
      updatedAt: Date.now(),
    });
  },

  reorderElement: (fromIndex: number, toIndex: number) => {
    const elements = [...get().elements];
    const [moved] = elements.splice(fromIndex, 1);
    elements.splice(toIndex, 0, moved);
    // Re-assign zIndex based on array position
    const reindexed = elements.map((el, i) => ({ ...el, zIndex: i }));
    set({ elements: reindexed, updatedAt: Date.now() });
  },

  duplicateElement: (id: string) => {
    const original = get().elements.find(el => el.id === id);
    if (!original) return;
    const dup = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} Copy`,
      x: original.x + 20,
      y: original.y + 20,
      zIndex: get().elements.length,
    };
    set({
      elements: [...get().elements, dup],
      updatedAt: Date.now(),
    });
  },

  // ── Canvas actions ──
  setCanvasSize: (width: number, height: number) => {
    set({
      canvas: { width, height },
      updatedAt: Date.now(),
    });
  },

  // ── Scene actions ──
  setSceneName: (name: string) => {
    set({ name, updatedAt: Date.now() });
  },

  loadSceneData: (data: SceneData) => {
    set({ ...data });
  },

  resetScene: () => {
    const fresh = createDefaultScene();
    set({ ...fresh });
  },

  // ── Snapshot ──
  getSnapshot: (): SceneData => {
    const { id, name, canvas, elements, updatedAt } = get();
    return { id, name, canvas, elements, updatedAt };
  },

  restoreSnapshot: (snapshot: SceneData) => {
    set({ ...snapshot });
  },
}));
