import type { ProjectData } from '../types/elements';
import { STORAGE_KEY } from './constants';
import { syncScenes, SECRET_KEY_STORAGE_KEY } from './api';

let lastSyncTime = 0;
let pendingSyncTimer: ReturnType<typeof setTimeout> | null = null;
const CLOUD_SYNC_THROTTLE_MS = 15000;

export function saveProject(project: ProjectData, forceCloudSync = false): void {
  try {
    const json = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY, json);

    // Sync to Cloudflare D1 if secret key exists
    if (localStorage.getItem(SECRET_KEY_STORAGE_KEY)) {
      const now = Date.now();

      if (pendingSyncTimer) {
        clearTimeout(pendingSyncTimer);
        pendingSyncTimer = null;
      }

      const executeSync = () => {
        lastSyncTime = Date.now();
        syncScenes(project).catch((err) => {
          console.warn('[Oneverlay] Failed to sync project layout to cloud:', err);
        });
      };

      if (forceCloudSync || (now - lastSyncTime >= CLOUD_SYNC_THROTTLE_MS)) {
        // Execute sync immediately
        executeSync();
      } else {
        // Schedule sync for later to ensure latest changes are saved
        const delay = CLOUD_SYNC_THROTTLE_MS - (now - lastSyncTime);
        pendingSyncTimer = setTimeout(executeSync, delay);
      }
    }
  } catch (e) {
    console.warn('[Oneverlay] Failed to save project:', e);
  }
}

export function loadProject(): ProjectData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    
    const data = JSON.parse(json);
    
    // Validate that this is actually a ProjectData object (migration check)
    if (!data.scenes || !Array.isArray(data.scenes)) {
      console.warn('[Oneverlay] Old or invalid save data detected. Resetting to default project.');
      return null;
    }
    
    return data as ProjectData;
  } catch (e) {
    console.warn('[Oneverlay] Failed to load project:', e);
    return null;
  }
}

export function clearProject(): void {
  localStorage.removeItem(STORAGE_KEY);
}
