import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  OverlayElement,
  SceneData,
  ProjectData,
  ElementType,
} from '../types/elements';
import { createElement, createDefaultProject, createDefaultScene } from '../lib/defaults';
import { loadProject } from '../lib/persistence';

interface SceneStoreState extends ProjectData {
  // ── Element actions (operate on active scene) ──
  addElement: (type: ElementType) => void;
  updateElement: (id: string, updates: Partial<OverlayElement>) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, x: number, y: number) => void;
  toggleVisibility: (id: string) => void;
  reorderElement: (fromIndex: number, toIndex: number) => void;
  duplicateElement: (id: string) => void;

  // ── Canvas actions (operate on active scene) ──
  setCanvasSize: (width: number, height: number) => void;

  // ── Scene actions (operate on project) ──
  addScene: () => void;
  removeScene: (id: string) => void;
  setActiveScene: (id: string) => void;
  setSceneName: (id: string, name: string) => void;
  setOverlayCode: (id: string, code: string | null) => void;
  reorderScene: (fromIndex: number, toIndex: number) => void;

  // ── Entire project state replacement ──
  loadProjectData: (data: ProjectData) => void;
  resetProject: () => void;

  // ── Snapshot for undo/redo (applies to whole project) ──
  getSnapshot: () => ProjectData;
  restoreSnapshot: (snapshot: ProjectData) => void;
}

const initialProject = loadProject() || createDefaultProject();

/**
 * Helper to mutate the currently active scene
 */
const updateActiveScene = (
  set: any,
  updater: (scene: SceneData) => Partial<SceneData>
) => {
  set((state: SceneStoreState) => ({
    scenes: state.scenes.map((s) =>
      s.id === state.activeSceneId
        ? { ...s, ...updater(s), updatedAt: Date.now() }
        : s
    ),
    updatedAt: Date.now(),
  }));
};

export const useSceneStore = create<SceneStoreState>((set, get) => ({
  // ── Initial state ──
  ...initialProject,

  // ── Element actions ──
  addElement: (type: ElementType) => {
    updateActiveScene(set, (scene) => {
      const element = createElement(type);
      element.zIndex = scene.elements.length;
      element.name = `${element.name} ${scene.elements.filter((e) => e.type === type).length + 1}`;
      return { elements: [...scene.elements, element] };
    });
  },

  updateElement: (id: string, updates: Partial<OverlayElement>) => {
    updateActiveScene(set, (scene) => ({
      elements: scene.elements.map((el) =>
        el.id === id ? ({ ...el, ...updates } as OverlayElement) : el
      ),
    }));
  },

  removeElement: (id: string) => {
    updateActiveScene(set, (scene) => ({
      elements: scene.elements.filter((el) => el.id !== id),
    }));
  },

  moveElement: (id: string, x: number, y: number) => {
    updateActiveScene(set, (scene) => ({
      elements: scene.elements.map((el) =>
        el.id === id ? { ...el, x: Math.round(x), y: Math.round(y) } : el
      ),
    }));
  },

  toggleVisibility: (id: string) => {
    updateActiveScene(set, (scene) => ({
      elements: scene.elements.map((el) =>
        el.id === id ? { ...el, hidden: !el.hidden } : el
      ),
    }));
  },

  reorderElement: (fromIndex: number, toIndex: number) => {
    updateActiveScene(set, (scene) => {
      const elements = [...scene.elements];
      const [moved] = elements.splice(fromIndex, 1);
      elements.splice(toIndex, 0, moved);
      // Re-assign zIndex based on array position
      const reindexed = elements.map((el, i) => ({ ...el, zIndex: i }));
      return { elements: reindexed };
    });
  },

  duplicateElement: (id: string) => {
    updateActiveScene(set, (scene) => {
      const original = scene.elements.find((el) => el.id === id);
      if (!original) return {};
      const dup = {
        ...original,
        id: uuidv4(),
        name: `${original.name} Copy`,
        x: original.x + 20,
        y: original.y + 20,
        zIndex: scene.elements.length,
      };
      return { elements: [...scene.elements, dup] };
    });
  },

  // ── Canvas actions ──
  setCanvasSize: (width: number, height: number) => {
    updateActiveScene(set, () => ({
      canvas: { width, height },
    }));
  },

  // ── Scene actions (operate on project) ──
  addScene: () => {
    set((state) => {
      const nextNumber = state.scenes.length + 1;
      const newScene = createDefaultScene(`Scene ${nextNumber}`);
      return {
        scenes: [...state.scenes, newScene],
        activeSceneId: newScene.id,
        updatedAt: Date.now(),
      };
    });
  },

  removeScene: (id: string) => {
    set((state) => {
      // Don't remove if it's the last scene
      if (state.scenes.length <= 1) return state;

      const newScenes = state.scenes.filter((s) => s.id !== id);
      
      // If we are removing the active scene, switch to the first available one
      const newActiveId = 
        state.activeSceneId === id ? newScenes[0].id : state.activeSceneId;

      return {
        scenes: newScenes,
        activeSceneId: newActiveId,
        updatedAt: Date.now(),
      };
    });
  },

  setActiveScene: (id: string) => {
    set({ activeSceneId: id });
  },

  setSceneName: (id: string, name: string) => {
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === id ? { ...s, name, updatedAt: Date.now() } : s
      ),
      updatedAt: Date.now(),
    }));
  },

  setOverlayCode: (id: string, code: string | null) => {
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === id ? { ...s, overlayCode: code, updatedAt: Date.now() } : s
      ),
      updatedAt: Date.now(),
    }));
  },

  reorderScene: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const scenes = [...state.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      return { scenes, updatedAt: Date.now() };
    });
  },

  // ── Entire project state replacement ──
  loadProjectData: (data: ProjectData) => {
    set({ ...data });
  },

  resetProject: () => {
    const fresh = createDefaultProject();
    set({ ...fresh });
  },

  // ── Snapshot ──
  getSnapshot: (): ProjectData => {
    const { scenes, activeSceneId, updatedAt } = get();
    return { scenes, activeSceneId, updatedAt };
  },

  restoreSnapshot: (snapshot: ProjectData) => {
    set({ ...snapshot });
  },
}));

// ── Selectors ──
export const selectActiveScene = (state: SceneStoreState) =>
  state.scenes.find((s) => s.id === state.activeSceneId) || state.scenes[0];

export const selectElements = (state: SceneStoreState) =>
  selectActiveScene(state).elements;

export const selectCanvas = (state: SceneStoreState) =>
  selectActiveScene(state).canvas;
