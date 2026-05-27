import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { projectRoutes } from './routes/project';
import { overlayRoutes } from './routes/overlay';

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Allow CORS for OBS CEF browser sources and cross-origin editor access
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Secret-Key'],
}));

// ── Routes ──
app.route('/api/project', projectRoutes);
app.route('/api/overlay', overlayRoutes);

// Health check
app.get('/api/health', (c) => c.json({ ok: true }));

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 1. Clean up inactive projects (older than 90 days with no recent activity)
    const inactiveCutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    
    await env.DB.prepare(`
      DELETE FROM projects
      WHERE created_at < ? 
        AND updated_at < ?
        AND NOT EXISTS (
          SELECT 1 FROM scenes WHERE project_id = projects.id AND updated_at >= ?
        )
        AND NOT EXISTS (
          SELECT 1 FROM scenes 
          JOIN overlay_codes ON scenes.id = overlay_codes.scene_id 
          WHERE scenes.project_id = projects.id AND overlay_codes.last_accessed_at >= ?
        )
    `).bind(inactiveCutoff, inactiveCutoff, inactiveCutoff, inactiveCutoff).run();

    // 2. Anti-Spam / DoS mitigation: Clean up empty projects older than 1 hour
    const spamCutoff = Date.now() - 1 * 60 * 60 * 1000;
    
    await env.DB.prepare(`
      DELETE FROM projects
      WHERE created_at < ?
        AND NOT EXISTS (
          SELECT 1 FROM scenes WHERE project_id = projects.id
        )
    `).bind(spamCutoff).run();
  }
};
