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

export default app;
