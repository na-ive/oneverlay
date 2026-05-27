# API DOCUMENTATION

Oneverlay operates on a lightweight REST API built with [Hono](https://hono.dev/) running on Cloudflare Workers. 
The API is divided into two primary route groups: `Project` routes (for editor state management) and `Overlay` routes (for OBS sync and public read access).

## Base URL
All API routes are prefixed with `/api`. During local development, the base URL is `http://localhost:8787/api`. In production, it is the root of your Cloudflare Worker URL.

## Authentication
Most editor routes require a `X-Secret-Key` header. This acts as both the unique identifier for a user's workspace and their authorization token.

---

## Project Routes (`/api/project`)

### POST `/init`
Initializes a brand new, empty project workspace.
- **Headers:** None
- **Body:** None
- **Response (201):**
  ```json
  {
    "projectId": "uuid-v4",
    "secretKey": "24-char-hex-string"
  }
  ```

### GET `/`
Retrieves the entire workspace state (all scenes and their overlay codes) for the authenticated user.
- **Headers:** `X-Secret-Key` (Required)
- **Response (200):**
  ```json
  {
    "projectId": "uuid-v4",
    "updatedAt": 1716768000000,
    "scenes": [
      {
        "id": "uuid-v4",
        "name": "Scene 1",
        "canvas": { "width": 1920, "height": 1080 },
        "elements": [...],
        "zOrder": 0,
        "updatedAt": 1716768000000,
        "overlayCode": "a1b2c3d4" // null if not generated
      }
    ]
  }
  ```

### POST `/scenes`
Performs a full synchronization (upsert) of all scenes. Handles creation, updating, and deletion of scenes to match the client state.
- **Headers:** `X-Secret-Key` (Required)
- **Body:**
  ```json
  {
    "scenes": [ ... ],
    "activeSceneId": "uuid-v4"
  }
  ```
- **Response (200):** `{ "ok": true }`

### PUT `/key`
Invalidates the current `X-Secret-Key` and generates a new one. This is useful if a key has been compromised. The project itself remains untouched.
- **Headers:** `X-Secret-Key` (Required)
- **Response (200):** `{ "secretKey": "new-24-char-hex-string" }`

### DELETE `/`
Permanently deletes the entire project, cascading to all scenes and overlay codes.
- **Headers:** `X-Secret-Key` (Required)
- **Response (200):** `{ "ok": true }`

---

## Overlay Routes (`/api/overlay`)

### GET `/:code`
**PUBLIC ENDPOINT.** Retrieves the live canvas and element data for a specific scene using its public 8-character overlay code. This endpoint is hit continuously by the OBS Browser Source.
- **Headers:** None
- **Params:** `code` (The 8-character alphanumeric overlay code)
- **Response (200):**
  ```json
  {
    "id": "uuid-v4",
    "name": "Scene 1",
    "canvas": { "width": 1920, "height": 1080 },
    "elements": [...],
    "updatedAt": 1716768000000
  }
  ```
*Note: This endpoint executes a background task (`c.executionCtx.waitUntil`) to log the `last_accessed_at` timestamp if the last recorded access was over 24 hours ago, ensuring active overlays are not flagged for deletion.*

### POST `/`
Generates a new public overlay code for a specific scene, overwriting any previous code.
- **Headers:** `X-Secret-Key` (Required)
- **Body:** `{ "sceneId": "uuid-v4" }`
- **Response (201):** `{ "overlayCode": "a1b2c3d4" }`

### DELETE `/:code`
Invalidates and destroys an existing overlay code, instantly breaking any active OBS browser sources relying on it.
- **Headers:** `X-Secret-Key` (Required)
- **Params:** `code` (The 8-character alphanumeric overlay code to destroy)
- **Response (200):** `{ "ok": true }`
