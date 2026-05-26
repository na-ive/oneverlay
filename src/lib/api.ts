/**
 * Typed API client for the Oneverlay Cloudflare Worker backend.
 * Automatically reads the secret key from localStorage.
 */

import type { SceneData, ProjectData } from '../types/elements';

// ── Storage keys ──
export const PROJECT_ID_KEY = 'oneverlay_project_id';
export const SECRET_KEY_STORAGE_KEY = 'oneverlay_secret_key';

// ── Cloud scene shape (as returned by the Worker) ──
export interface CloudScene {
  id: string;
  name: string;
  canvas: { width: number; height: number };
  elements: SceneData['elements'];
  zOrder: number;
  updatedAt: number;
  overlayCode: string | null;
}

export interface CloudProject {
  projectId: string;
  scenes: CloudScene[];
  updatedAt: number;
}

export interface InitResult {
  projectId: string;
  secretKey: string;
}

// ── Helpers ──

function getSecretKey(): string | null {
  return localStorage.getItem(SECRET_KEY_STORAGE_KEY);
}

function authHeaders(): HeadersInit {
  const key = getSecretKey();
  return {
    'Content-Type': 'application/json',
    ...(key ? { 'X-Secret-Key': key } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── API Methods ──

/**
 * Creates a new Oneverlay workspace. Returns projectId + secretKey.
 * Called on first launch (no existing key in localStorage).
 */
export async function initProject(): Promise<InitResult> {
  const res = await fetch('/api/project/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<InitResult>(res);
}

/**
 * Loads the full project (all scenes) from D1 using the stored secret key.
 */
export async function fetchProject(): Promise<CloudProject> {
  const res = await fetch('/api/project', {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse<CloudProject>(res);
}

/**
 * Syncs all scenes to D1 (full upsert — handles creates, updates, and deletes).
 * @param project The current ProjectData snapshot from the scene store.
 */
export async function syncScenes(project: ProjectData): Promise<void> {
  const scenes = project.scenes.map((scene, index) => ({
    id: scene.id,
    name: scene.name,
    canvas: scene.canvas,
    elements: scene.elements,
    zOrder: index,
    updatedAt: scene.updatedAt,
  }));

  const res = await fetch('/api/project/scenes', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      scenes,
      activeSceneId: project.activeSceneId,
    }),
  });
  return handleResponse<void>(res);
}

/**
 * Validates a secret key by attempting to load the project.
 * Returns the project if valid, throws if invalid.
 */
export async function validateSecretKey(secretKey: string): Promise<CloudProject> {
  const res = await fetch('/api/project', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Secret-Key': secretKey,
    },
  });
  return handleResponse<CloudProject>(res);
}

/**
 * Regenerates the secret key. Returns the new key.
 * Caller is responsible for updating localStorage.
 */
export async function regenerateSecretKey(): Promise<string> {
  const res = await fetch('/api/project/key', {
    method: 'PUT',
    headers: authHeaders(),
  });
  const data = await handleResponse<{ secretKey: string }>(res);
  return data.secretKey;
}

/**
 * Deletes the entire workspace from D1 (all scenes + overlay codes).
 */
export async function deleteAccount(): Promise<void> {
  const res = await fetch('/api/project', {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

/**
 * Generates (or regenerates) an overlay code for a specific scene.
 * Returns the new overlay code string.
 */
export async function generateOverlayCode(sceneId: string): Promise<string> {
  const res = await fetch('/api/overlay', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ sceneId }),
  });
  const data = await handleResponse<{ overlayCode: string }>(res);
  return data.overlayCode;
}

/**
 * Deletes an overlay code (invalidates the public OBS link).
 */
export async function deleteOverlayCode(overlayCode: string): Promise<void> {
  const res = await fetch(`/api/overlay/${overlayCode}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

/**
 * Fetches a single scene by its public overlay code.
 * Used by BrowserSourceView — no auth required.
 */
export async function fetchOverlayScene(overlayCode: string): Promise<CloudScene> {
  const res = await fetch(`/api/overlay/${overlayCode}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<CloudScene>(res);
}
