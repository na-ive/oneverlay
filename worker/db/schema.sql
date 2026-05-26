-- ── Oneverlay D1 Schema ──
-- Run with: wrangler d1 execute oneverlay-db --file=worker/db/schema.sql

-- One workspace per user (identified by a user-facing secret_key, but keyed on immutable id)
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,       -- UUID, never changes (internal reference)
  secret_key  TEXT UNIQUE NOT NULL,   -- user-facing key, can be regenerated
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- One row per scene (one-to-many with projects)
CREATE TABLE IF NOT EXISTS scenes (
  id          TEXT PRIMARY KEY,       -- UUID matching SceneData.id on the client
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  canvas_data TEXT NOT NULL,          -- JSON: { width: number, height: number }
  elements    TEXT NOT NULL,          -- JSON: OverlayElement[]
  z_order     INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL
);

-- Overlay codes: one active code per scene at a time, publicly accessible
CREATE TABLE IF NOT EXISTS overlay_codes (
  overlay_code  TEXT PRIMARY KEY,           -- random 8-char alphanumeric token
  scene_id      TEXT NOT NULL UNIQUE REFERENCES scenes(id) ON DELETE CASCADE,
  created_at    INTEGER NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_secret_key ON projects(secret_key);
