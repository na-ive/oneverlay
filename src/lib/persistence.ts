import type { ProjectData } from '../types/elements';
import { STORAGE_KEY } from './constants';

export function saveProject(project: ProjectData): void {
  try {
    const json = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY, json);
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
