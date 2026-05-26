import { useEffect, useRef } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { saveProject } from '../lib/persistence';
import { AUTO_SAVE_DELAY } from '../lib/constants';
import { fetchProject, SECRET_KEY_STORAGE_KEY, type CloudScene } from '../lib/api';
import type { SceneData, ProjectData } from '../types/elements';

function cloudSceneToLocal(cloudScene: CloudScene): SceneData {
  return {
    id: cloudScene.id,
    name: cloudScene.name,
    canvas: cloudScene.canvas,
    elements: cloudScene.elements,
    updatedAt: cloudScene.updatedAt,
  };
}

/**
 * Auto-saves scene data to localStorage and Cloudflare D1 on every change,
 * debounced to avoid excessive writes. Fetches latest cloud state on mount.
 */
export function usePersistence() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsub: (() => void) | null = null;

    const initCloudSync = async () => {
      // If we have a secret key, try fetching the latest from the cloud first
      if (localStorage.getItem(SECRET_KEY_STORAGE_KEY)) {
        try {
          const cloudProject = await fetchProject();
          if (isMounted) {
            const scenes = cloudProject.scenes.map(cloudSceneToLocal);
            const currentState = useSceneStore.getState();
            
            if (scenes.length > 0) {
              const projectData: ProjectData = {
                scenes,
                activeSceneId: cloudProject.scenes[0]?.id ?? currentState.activeSceneId,
                updatedAt: cloudProject.updatedAt,
              };
              currentState.loadProjectData(projectData);
            }
          }
        } catch (err) {
          console.warn('[Oneverlay] Failed to fetch cloud project on mount:', err);
        }
      }

      // After fetching (or immediately if no key), start syncing local saves
      if (isMounted) {
        saveProject(useSceneStore.getState().getSnapshot());

        unsub = useSceneStore.subscribe((state) => {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            saveProject(state.getSnapshot());
          }, AUTO_SAVE_DELAY);
        });
      }
    };

    initCloudSync();

    return () => {
      isMounted = false;
      if (unsub) unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}

