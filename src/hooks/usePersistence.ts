import { useEffect, useRef } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { saveProject } from '../lib/persistence';
import { AUTO_SAVE_DELAY } from '../lib/constants';

/**
 * Auto-saves scene data to localStorage on every change,
 * debounced to avoid excessive writes.
 */
export function usePersistence() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Immediately sync the loaded state (from localStorage or defaults) to the local disk file
    saveProject(useSceneStore.getState().getSnapshot());

    const unsub = useSceneStore.subscribe((state) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        saveProject(state.getSnapshot());
      }, AUTO_SAVE_DELAY);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
