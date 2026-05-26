import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { cloudflare } from "@cloudflare/vite-plugin";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Custom Vite plugin to save and load project JSON locally on disk
function projectStoragePlugin() {
  const filePath = path.resolve(__dirname, 'project.json');

  return {
    name: 'project-storage-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = new URL(req.url || '', 'http://localhost');
        const pathname = url.pathname;

        if (pathname === '/api/project') {
          // Add CORS headers for all /api/project requests to prevent CORS issues in OBS CEF
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            if (fs.existsSync(filePath)) {
              const data = fs.readFileSync(filePath, 'utf-8');
              res.end(data);
            } else {
              res.end(JSON.stringify({ scenes: [], activeSceneId: '', updatedAt: 0 }));
            }
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                fs.writeFileSync(filePath, body, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to write project data' }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), projectStoragePlugin(), cloudflare()],
  server: {
    watch: {
      ignored: ['**/project.json'],
    },
  },
})