import type { SceneData } from '../types/elements';
import { STORAGE_KEY } from './constants';

export function saveScene(scene: SceneData): void {
  try {
    const json = JSON.stringify(scene);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.warn('[Oneverlay] Failed to save scene:', e);
  }
}

export function loadScene(): SceneData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as SceneData;
  } catch (e) {
    console.warn('[Oneverlay] Failed to load scene:', e);
    return null;
  }
}

export function clearScene(): void {
  localStorage.removeItem(STORAGE_KEY);
}
