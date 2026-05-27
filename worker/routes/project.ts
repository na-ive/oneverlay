import { Hono } from 'hono';
import type { Env } from '../index';

export const projectRoutes = new Hono<{ Bindings: Env }>();

// ── Helpers ──

function generateId(): string {
  return crypto.randomUUID();
}

function generateSecretKey(): string {
  // 24-char hex string (12 random bytes), e.g. "a1b2c3d4e5f6a1b2c3d4e5f6"
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getProjectByKey(db: D1Database, secretKey: string) {
  return db
    .prepare('SELECT * FROM projects WHERE secret_key = ?')
    .bind(secretKey)
    .first<{ id: string; secret_key: string; created_at: number; updated_at: number }>();
}

// ── POST /api/project/init ── (no auth — creates a new workspace)
projectRoutes.post('/init', async (c) => {
  const db = c.env.DB;
  const id = generateId();
  const secretKey = generateSecretKey();
  const now = Date.now();

  await db
    .prepare('INSERT INTO projects (id, secret_key, created_at, updated_at) VALUES (?, ?, ?, ?)')
    .bind(id, secretKey, now, now)
    .run();

  return c.json({ projectId: id, secretKey }, 201);
});

// ── GET /api/project ── (returns all scenes for this project)
projectRoutes.get('/', async (c) => {
  const secretKey = c.req.header('X-Secret-Key');
  if (!secretKey) return c.json({ error: 'Missing X-Secret-Key header' }, 401);

  const db = c.env.DB;
  const project = await getProjectByKey(db, secretKey);
  if (!project) return c.json({ error: 'Invalid secret key' }, 401);

  const scenes = await db
    .prepare('SELECT * FROM scenes WHERE project_id = ? ORDER BY z_order ASC')
    .bind(project.id)
    .all<{
      id: string;
      project_id: string;
      name: string;
      canvas_data: string;
      elements: string;
      z_order: number;
      updated_at: number;
    }>();

  // Also fetch overlay codes for each scene
  const scenesWithCodes = await Promise.all(
    (scenes.results || []).map(async (scene) => {
      const codeRow = await db
        .prepare('SELECT overlay_code FROM overlay_codes WHERE scene_id = ?')
        .bind(scene.id)
        .first<{ overlay_code: string }>();

      return {
        id: scene.id,
        name: scene.name,
        canvas: JSON.parse(scene.canvas_data),
        elements: JSON.parse(scene.elements),
        zOrder: scene.z_order,
        updatedAt: scene.updated_at,
        overlayCode: codeRow?.overlay_code ?? null,
      };
    })
  );

  return c.json({
    projectId: project.id,
    scenes: scenesWithCodes,
    updatedAt: project.updated_at,
  });
});

// ── POST /api/project/scenes ── (full upsert of all scenes)
projectRoutes.post('/scenes', async (c) => {
  const secretKey = c.req.header('X-Secret-Key');
  if (!secretKey) return c.json({ error: 'Missing X-Secret-Key header' }, 401);

  const db = c.env.DB;
  const project = await getProjectByKey(db, secretKey);
  if (!project) return c.json({ error: 'Invalid secret key' }, 401);

  const body = await c.req.json<{
    scenes: Array<{
      id: string;
      name: string;
      canvas: { width: number; height: number };
      elements: unknown[];
      zOrder: number;
      updatedAt: number;
    }>;
    activeSceneId: string;
  }>();

  const now = Date.now();

  // Get current scene IDs in DB for this project (to detect deletions)
  const existingRows = await db
    .prepare('SELECT id FROM scenes WHERE project_id = ?')
    .bind(project.id)
    .all<{ id: string }>();
  const existingIds = new Set((existingRows.results || []).map((r) => r.id));
  const incomingIds = new Set(body.scenes.map((s) => s.id));

  // Delete scenes that were removed on the client
  for (const id of existingIds) {
    if (!incomingIds.has(id)) {
      await db.prepare('DELETE FROM scenes WHERE id = ?').bind(id).run();
    }
  }

  // Upsert each scene safely
  for (const scene of body.scenes) {
    if (existingIds.has(scene.id)) {
      await db
        .prepare(`
          UPDATE scenes 
          SET name = ?, canvas_data = ?, elements = ?, z_order = ?, updated_at = ? 
          WHERE id = ? AND project_id = ?
        `)
        .bind(
          scene.name,
          JSON.stringify(scene.canvas),
          JSON.stringify(scene.elements),
          scene.zOrder,
          scene.updatedAt,
          scene.id,
          project.id
        )
        .run();
    } else {
      await db
        .prepare(`
          INSERT INTO scenes (id, project_id, name, canvas_data, elements, z_order, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          scene.id,
          project.id,
          scene.name,
          JSON.stringify(scene.canvas),
          JSON.stringify(scene.elements),
          scene.zOrder,
          scene.updatedAt
        )
        .run();
    }
  }

  // Note: We no longer update projects.updated_at here.
  // projects.updated_at strictly tracks project creation and key regeneration.
  // Editor activity is tracked by MAX(scenes.updated_at) which is inherently updated
  // by the client via the ON CONFLICT DO UPDATE SET updated_at = excluded.updated_at above.

  return c.json({ ok: true });
});

// ── PUT /api/project/key ── (regenerate secret key)
projectRoutes.put('/key', async (c) => {
  const secretKey = c.req.header('X-Secret-Key');
  if (!secretKey) return c.json({ error: 'Missing X-Secret-Key header' }, 401);

  const db = c.env.DB;
  const project = await getProjectByKey(db, secretKey);
  if (!project) return c.json({ error: 'Invalid secret key' }, 401);

  const newKey = generateSecretKey();
  const now = Date.now();

  await db
    .prepare('UPDATE projects SET secret_key = ?, updated_at = ? WHERE id = ?')
    .bind(newKey, now, project.id)
    .run();

  return c.json({ secretKey: newKey });
});

// ── DELETE /api/project ── (delete entire workspace)
projectRoutes.delete('/', async (c) => {
  const secretKey = c.req.header('X-Secret-Key');
  if (!secretKey) return c.json({ error: 'Missing X-Secret-Key header' }, 401);

  const db = c.env.DB;
  const project = await getProjectByKey(db, secretKey);
  if (!project) return c.json({ error: 'Invalid secret key' }, 401);

  // ON DELETE CASCADE handles scenes + overlay_codes
  await db.prepare('DELETE FROM projects WHERE id = ?').bind(project.id).run();

  return c.json({ ok: true });
});
