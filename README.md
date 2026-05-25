# Oneverlay

Oneverlay is a premium, lightweight browser source overlay editor designed for live streamers. It provides a visual, drag-and-drop workspace that lets you compose, customize, and align overlay elements, then render them instantly in OBS Studio or any other streaming software with absolute transparency.

![Oneverlay Showcase](./public/landing.png)

## Core Architecture

Building overlays that sync seamlessly with OBS Studio presents a unique challenge: OBS Browser Sources run in heavily sandboxed, isolated Chromium Embedded Framework (CEF) containers. They do not share LocalStorage, cookies, or session states with your main desktop browser.

Oneverlay solves this sandboxing constraint with a dual-sync architecture:
1. **Local Disk Storage API**: During development, the editor automatically persists your layout changes to a local file (`project.json`) on your disk through a custom Vite server middleware.
2. **OBS Polling Fallback**: The overlay pages (`/o/:sceneSlug`) query this server API in real-time, bypassing the isolated browser container sandbox to reflect live editor updates within 1.5 seconds.
3. **Storage Event Listeners**: Standard browser tabs use low-overhead storage events to sync updates instantaneously when previewed on the same machine.

## Key Features

* **Visual WYSIWYG Workspace**: Add, position, resize, rotate, scale, and crop elements (text labels, static images, and embedded web pages).
* **Multi-Scene Management**: Organize different setups into scenes, accessible via human-readable URL slugs (such as `/o/scene-1`).
* **Absolute Transparency**: The overlay engine automatically eliminates page backgrounds and containers upon rendering, leaving a clean, transparent canvas perfect for overlays.
* **Sleek Dark Aesthetics**: Features a premium, space-efficient dark interface for designing, alongside a clean landing page for new users.

## Quick Start

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Running the Development Server

Start the Vite development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser to view the landing page, or go straight to the editor at `http://localhost:5173/editor`.

### Adding to OBS Studio

1. In the editor, click **Open Overlay** to get the unique link for your active scene (e.g. `http://localhost:5173/o/scene-1`).
2. Open OBS Studio, add a new **Browser** source.
3. Paste the URL into the **URL** field.
4. Set the width and height to match your scene canvas dimensions (usually `1920` x `1080`).
5. Ensure the **Local file** checkbox is unchecked so OBS queries the local development server.
6. Click **OK**.

---

## Future Goals and Roadmap

Our immediate focus is scaling Oneverlay from a local application into a robust, cloud-hosted platform:

### 1. Serverless Database Migration
Currently, layouts are saved locally to a disk file. We plan to migrate the persistence layer to a serverless backend using:
* **Hono** framework for high-performance routing.
* **Cloudflare Workers** for low-latency serverless computing.
* **Cloudflare D1 (SQL)** or **KV Storage** to store user configurations and project data permanently in the cloud.

### 2. Secret Key System and Portable Workspace
To keep the application simple to start while allowing users to move across different computers:
* **No Sign-Up Editor**: Users can open the editor and design their overlays immediately without creating an account or providing credentials.
* **Save to Generate Secret Key**: When the project is saved for the first time, a unique project secret key is generated for the user.
* **Workspace Portability**: By entering this secret key on any other PC, the editor will load and allow the user to resume working on their existing project.

### 3. Random Unique Overlay URLs with Regeneration
To prevent route collisions and ensure privacy:
* **Unique Tokens**: Instead of slugs based on scene names (which could clash with other creators' setups), overlays are served via unique random codes (e.g. `/o/:uniqueCode`).
* **Unauthenticated Access**: These overlay links remain fully public and lightweight for OBS to load with zero overhead.
* **Token Regeneration**: The owner of the secret key can regenerate a new unique overlay code at any time, instantly invalidating the old link if it gets leaked or shared.
