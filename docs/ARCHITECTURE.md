# ARCHITECTURE

Oneverlay operates on a modern, serverless architecture that drastically minimizes infrastructure costs while providing sub-second latency for live broadcast operations. The stack combines a React frontend with a Cloudflare Workers backend and D1 database.

## 1. System Overview

- **Frontend (`src/`)**: A Vite + React Single Page Application (SPA). The editor provides a canvas-based WYSIWYG environment for composing overlays.
- **Backend (`worker/`)**: A Cloudflare Worker using Hono for REST API routing.
- **Database**: Cloudflare D1 (SQLite at the edge).

## 2. The Frontend Canvas Engine

Oneverlay’s visual editor is heavily optimized for performance and fluid interactions using the following stack:
- **State Management (Zustand)**: `useSceneStore` and `useEditorStore` handle complex, deeply nested canvas state without triggering unnecessary React re-renders. Zustand acts as the single source of truth for element positions, transformations, and scene data.
- **Rendering Engine (Konva & React-Konva)**: Instead of manipulating the DOM, the editor draws directly onto an HTML5 `<canvas>` using Konva.js. This guarantees 60fps dragging, scaling, and rotation of elements, ensuring that the editor feels like a native desktop application (e.g., Photoshop or Figma).
- **Styling (Tailwind CSS v4)**: The user interface panels and modals are built rapidly using the latest Tailwind CSS v4, which operates via Vite plugins for near-instant HMR and zero-config CSS variables.

## 3. Stateless Authentication (The Secret Key Concept)

Oneverlay discards the traditional Username/Password paradigm in favor of anonymous, portable workspaces.

When a user opens the application for the first time:
1. The frontend asks the backend to initialize a project (`POST /api/project/init`).
2. The backend generates a standard UUID (`project_id`) and a 24-character hexadecimal `secret_key`.
3. The frontend stores this `secret_key` in the browser's `localStorage`.
4. Any subsequent mutations or syncs to the Cloud send the `X-Secret-Key` header.
5. The user can export this key (or the entire project configuration as JSON) and paste it into another browser or device to instantly resume their workspace.

If the key is compromised, the user can call `PUT /api/project/key` to invalidate the old key and generate a new one without losing their scenes.

## 4. The OBS Synchronization Engine

A critical challenge for browser-based overlay editors is that streaming software like OBS Studio runs browser sources inside isolated CEF (Chromium Embedded Framework) containers. These containers cannot access the host browser's `localStorage` or `sessionStorage`.

**How Oneverlay Solves This:**
1. **Public Overlay Codes**: When a user clicks "Generate Link", the backend assigns a random 8-character string (e.g., `o/x7b9z1q2`) to that specific scene.
2. **The Render Route**: The user pastes `http://oneverlay.domain/o/x7b9z1q2` into OBS.
3. **One-Time Fetch**: To maintain exactly $0 in server costs and avoid hitting Cloudflare's free tier request limits, Oneverlay completely avoids short-polling. The OBS browser source fetches the JSON layout exactly once when it mounts.
4. **Manual Sync**: If a user updates their overlay in the web editor, they must manually right-click the Browser Source in OBS and select "Refresh cache of current page" to pull the new data. This is a deliberate architectural limitation to prioritize free self-hosting scalability over live auto-syncing.

## 5. Cloud Sync Throttling

To prevent D1 database write exhaustion when a user is actively dragging elements across the canvas, Oneverlay decouples local state from remote state.

- **Local Storage (0.5s Debounce)**: Changes are saved to `localStorage` almost instantly, ensuring crash recovery.
- **Cloud Sync (15s Throttle)**: A background timer ensures that changes are batched and sent to the Hono API a maximum of once every 15 seconds. If the user stops interacting, the final state is guaranteed to be pushed to the Cloudflare Worker.

## 6. Automated Data Lifecycle & Anti-Spam (Cron Job)

To ensure the database remains lightweight and performant without manual maintenance, Oneverlay features an automated garbage collection routine.

A Cloudflare Cron Trigger (`*/15 * * * *`) executes every 15 minutes to perform two vital tasks:

1. **DoS / Spam Mitigation**: Any project that is completely empty (has no scenes) and is older than 1 hour is hard-deleted. This prevents automated bots from exhausting the D1 database capacity by spamming the `/init` endpoint.
2. **Abandoned Project Purge**: A project is deemed safely inactive and hard-deleted only if ALL of the following are true:
   - The project is older than 90 days.
   - The `secret_key` has not been regenerated in the last 90 days.
   - No scene within the project has been modified in the editor for the last 90 days.
   - No overlay code belonging to the project has been polled by an OBS browser source in the last 90 days.

*Note: The OBS read activity is tracked via a non-blocking `c.executionCtx.waitUntil` routine on the `GET /api/overlay/:code` endpoint, updating the `last_accessed_at` column seamlessly in the background.*

## 7. Security Architecture

Oneverlay is designed defensively to protect users in a serverless, multi-tenant environment:
- **IDOR Prevention**: All API mutations (e.g., `POST /api/project/scenes`) strictly verify that the `project_id` mapped to the provided `X-Secret-Key` owns the target `scene_id`. Secondary protection is enforced at the database level via Foreign Key constraints.
- **XSS Protection**: While the editor allows users to input URLs for Browser Source elements, the frontend strictly validates `iframe` `src` attributes to only permit `http://` and `https://` schemas, completely neutralizing Stored XSS vectors (e.g., `javascript:alert(1)` payloads).
- **Cryptographic Obscurity**: Public overlay links use cryptographically secure 8-character codes generated via `crypto.getRandomValues()`. With over 2.8 trillion combinations and Cloudflare's edge rate-limiting, brute-forcing a user's overlay URL is computationally unfeasible.
