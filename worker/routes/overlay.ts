import { Hono } from 'hono';
import type { Env } from '../index';

export const overlayRoutes = new Hono<{ Bindings: Env }>();

// ── Helpers ──

function generateOverlayCode(): string {
  // 8-char alphanumeric, e.g. "a1b2c3d4"
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
}

async function getProjectByKey(db: D1Database, secretKey: string) {
  return db
    .prepare('SELECT * FROM projects WHERE secret_key = ?')
    .bind(secretKey)
    .first<{ id: string; secret_key: string }>();
}

// ── GET /api/overlay/:code ── (PUBLIC — used by OBS browser source)
overlayRoutes.get('/:code', async (c) => {
  const code = c.req.param('code');
  const db = c.env.DB;

  const codeRow = await db
    .prepare('SELECT scene_id FROM overlay_codes WHERE overlay_code = ?')
    .bind(code)
    .first<{ scene_id: string }>();

  if (!codeRow) return c.json({ error: 'Overlay not found' }, 404);

  const scene = await db
    .prepare('SELECT * FROM scenes WHERE id = ?')
    .bind(codeRow.scene_id)
    .first<{
      id: string;
      name: string;
      canvas_data: string;
      elements: string;
      updated_at: number;
    }>();

  if (!scene) return c.json({ error: 'Scene not found' }, 404);

  return c.json({
    id: scene.id,
    name: scene.name,
    canvas: JSON.parse(scene.canvas_data),
    elements: JSON.parse(scene.elements),
    updatedAt: scene.updated_at,
  });
});

// ── POST /api/overlay ── (generate or replace overlay code for a scene)
overlayRoutes.post('/', async (c) => {
  const secretKey = c.req.header('X-Secret-Key');
  if (!secretKey) return c.json({ error: 'Missing X-Secret-Key header' }, 401);

  const db = c.env.DB;
  const project = await getProjectByKey(db, secretKey);
  if (!project) return c.json({ error: 'Invalid secret key' }, 401);

  const body = await c.req.json<{ sceneId: string }>();
  if (!body.sceneId) return c.json({ error: 'Missing sceneId' }, 400);

  // Verify the scene belongs to this project
  const scene = await db
    .prepare('SELECT id FROM scenes WHERE id = ? AND project_id = ?')
    .bind(body.sceneId, project.id)
    .first<{ id: string }>();

  if (!scene) return c.json({ error: 'Scene not found or unauthorized' }, 404);

  // Delete existing code for this scene (if any) and create a new one
  await db
    .prepare('DELETE FROM overlay_codes WHERE scene_id = ?')
    .bind(body.sceneId)
    .run();

  const overlayCode = generateOverlayCode();
  const now = Date.now();

  await db
    .prepare('INSERT INTO overlay_codes (overlay_code, scene_id, created_at) VALUES (?, ?, ?)')
    .bind(overlayCode, body.sceneId, now)
    .run();

  return c.json({ overlayCode }, 201);
});

// ── DELETE /api/overlay/:code ── (invalidate an overlay code)
overlayRoutes.delete('/:code', async (c) => {
  const secretKey = c.req.header('X-Secret-Key');
  if (!secretKey) return c.json({ error: 'Missing X-Secret-Key header' }, 401);

  const db = c.env.DB;
  const project = await getProjectByKey(db, secretKey);
  if (!project) return c.json({ error: 'Invalid secret key' }, 401);

  const code = c.req.param('code');

  // Verify ownership: overlay_code → scene → project
  const codeRow = await db
    .prepare(`
      SELECT oc.overlay_code
      FROM overlay_codes oc
      JOIN scenes s ON s.id = oc.scene_id
      WHERE oc.overlay_code = ? AND s.project_id = ?
    `)
    .bind(code, project.id)
    .first<{ overlay_code: string }>();

  if (!codeRow) return c.json({ error: 'Not found or unauthorized' }, 404);

  await db
    .prepare('DELETE FROM overlay_codes WHERE overlay_code = ?')
    .bind(code)
    .run();

  return c.json({ ok: true });
});
