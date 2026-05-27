# ARCHITECTURE

Oneverlay operates on a modern, serverless architecture that drastically minimizes infrastructure costs while providing sub-second latency for live broadcast operations. The stack combines a React frontend with a Cloudflare Workers backend and D1 database.

## 1. System Overview

- **Frontend (`src/`)**: A Vite + React Single Page Application (SPA). The editor provides a canvas-based WYSIWYG environment for composing overlays.
- **Backend (`worker/`)**: A Cloudflare Worker using Hono for REST API routing.
- **Database**: Cloudflare D1 (SQLite at the edge).

## 2. Stateless Authentication (The Secret Key Concept)

Oneverlay discards the traditional Username/Password paradigm in favor of anonymous, portable workspaces.

When a user opens the application for the first time:
1. The frontend asks the backend to initialize a project (`POST /api/project/init`).
2. The backend generates a standard UUID (`project_id`) and a 24-character hexadecimal `secret_key`.
3. The frontend stores this `secret_key` in the browser's `localStorage`.
4. Any subsequent mutations or syncs to the Cloud send the `X-Secret-Key` header.
5. The user can export this key (or the entire project configuration as JSON) and paste it into another browser or device to instantly resume their workspace.

If the key is compromised, the user can call `PUT /api/project/key` to invalidate the old key and generate a new one without losing their scenes.

## 3. The OBS Synchronization Engine

A critical challenge for browser-based overlay editors is that streaming software like OBS Studio runs browser sources inside isolated CEF (Chromium Embedded Framework) containers. These containers cannot access the host browser's `localStorage` or `sessionStorage`.

**How Oneverlay Solves This:**
1. **Public Overlay Codes**: When a user clicks "Generate Link", the backend assigns a random 8-character string (e.g., `o/x7b9z1q2`) to that specific scene.
2. **The Render Route**: The user pastes `http://oneverlay.domain/o/x7b9z1q2` into OBS.
3. **Short-Polling**: The React component loaded inside OBS mounts without the editor UI. It immediately begins polling `GET /api/overlay/x7b9z1q2` every 2 seconds.
4. **Data Sync**: When the user edits the scene in their primary browser, the changes are throttled and synced to D1 (Cloudflare Database). Within a maximum of 2 seconds, the OBS browser source detects the new `updatedAt` timestamp, fetches the new JSON layout, and re-renders the canvas natively.

## 4. Cloud Sync Throttling

To prevent D1 database write exhaustion when a user is actively dragging elements across the canvas, Oneverlay decouples local state from remote state.

- **Local Storage (0.5s Debounce)**: Changes are saved to `localStorage` almost instantly, ensuring crash recovery.
- **Cloud Sync (15s Throttle)**: A background timer ensures that changes are batched and sent to the Hono API a maximum of once every 15 seconds. If the user stops interacting, the final state is guaranteed to be pushed to the Cloudflare Worker.

## 5. Automated Data Lifecycle (Cron Job)

To ensure the database remains lightweight and performant without manual maintenance, Oneverlay features an automated garbage collection routine.

A Cloudflare Cron Trigger (`0 0 * * *`) executes daily to purge completely abandoned projects. 
A project is deemed safely inactive and hard-deleted only if ALL of the following are true:
- The project is older than 90 days.
- The `secret_key` has not been regenerated in the last 90 days.
- No scene within the project has been modified in the editor for the last 90 days.
- **Crucially**: No overlay code belonging to the project has been polled by an OBS browser source in the last 90 days.

*Note: The OBS read activity is tracked via a non-blocking `c.executionCtx.waitUntil` routine on the `GET /api/overlay/:code` endpoint, updating the `last_accessed_at` column seamlessly in the background.*
