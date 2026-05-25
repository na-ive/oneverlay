import type { CanvasSettings } from '../types/elements';

// ── Resolution Presets ──

export interface ResolutionPreset {
  label: string;
  width: number;
  height: number;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: '1920×1080 (Full HD)', width: 1920, height: 1080 },
  { label: '2560×1440 (2K)', width: 2560, height: 1440 },
  { label: '3840×2160 (4K)', width: 3840, height: 2160 },
  { label: '1280×720 (HD)', width: 1280, height: 720 },
  { label: '1080×1920 (Vertical)', width: 1080, height: 1920 },
  { label: '1080×1080 (Square)', width: 1080, height: 1080 },
];

// ── Default Canvas ──

export const DEFAULT_CANVAS: CanvasSettings = {
  width: 1920,
  height: 1080,
};

// ── App ──

export const APP_NAME = 'Oneverlay';
export const STORAGE_KEY = 'oneverlay_scene_data';
export const HISTORY_LIMIT = 50;
export const AUTO_SAVE_DELAY = 500;

// ── Bottom Dock ──

export const DOCK_MIN_HEIGHT = 150;
export const DOCK_MAX_HEIGHT = 500;
export const DOCK_DEFAULT_HEIGHT = 220;

// ── Navbar ──

export const NAVBAR_HEIGHT = 42;

// ── Canvas Zoom ──

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.05;
export const ZOOM_DEFAULT = 1;

// ── Support Link ──

export const SUPPORT_URL = 'https://tako.id/naive';
