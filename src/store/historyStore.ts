import { create } from 'zustand';
import type { SceneData } from '../types/elements';
import { useSceneStore } from './sceneStore';
import { HISTORY_LIMIT } from '../lib/constants';

interface HistoryState {
  past: SceneData[];
  future: SceneData[];
  push: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  push: () => {
    const snapshot = useSceneStore.getState().getSnapshot();
    set((state) => ({
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snapshot],
      future: [],
    }));
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;

    const current = useSceneStore.getState().getSnapshot();
    const previous = past[past.length - 1];

    useSceneStore.getState().restoreSnapshot(previous);

    set((state) => ({
      past: state.past.slice(0, -1),
      future: [current, ...state.future],
    }));
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;

    const current = useSceneStore.getState().getSnapshot();
    const next = future[0];

    useSceneStore.getState().restoreSnapshot(next);

    set((state) => ({
      past: [...state.past, current],
      future: state.future.slice(1),
    }));
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
}));
