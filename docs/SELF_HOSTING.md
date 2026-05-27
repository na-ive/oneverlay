# HOSTING YOUR OWN ONEVERLAY

Oneverlay is designed to be easily self-hosted on [Cloudflare Workers](https://workers.cloudflare.com/) and [Cloudflare D1](https://developers.cloudflare.com/d1/) for free. Since it relies on serverless edge functions, you don't need a traditional VPS, server, or Docker container.

Here is the step-by-step guide to deploying your own instance of Oneverlay to the edge.

## Prerequisites
- A Cloudflare account
- Node.js (v18+) installed on your computer
- npm, pnpm, or yarn

## Step 1: Install Dependencies
Clone the repository to your local machine and install all required packages:
```bash
git clone https://github.com/na-ive/oneverlay.git
cd oneverlay
npm install
```

## Step 2: Authenticate
Authenticate your local terminal with your Cloudflare account using Wrangler (the official Cloudflare CLI):
```bash
npx wrangler login
```
A browser window will open asking you to authorize Wrangler.

## Step 3: Create the Database
Oneverlay uses Cloudflare D1 (a serverless SQL database) to store user scenes, projects, and elements. Create a new database named `oneverlay-db`:
```bash
npx wrangler d1 create oneverlay-db
```
*Note the `database_id` that is printed in your terminal after this command succeeds. It will look like a UUID (e.g., `3072b708-...`).*

## Step 4: Update Configuration
Open the `wrangler.jsonc` file in the root directory. Replace the `database_id` under the `d1_databases` array with the ID you received from Step 3:
```jsonc
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "oneverlay-db",
      "database_id": "YOUR-NEW-DATABASE-ID-HERE" // Replace this string
    }
  ]
```

## Step 5: Initialize the Database Schema
Now, apply the database structure (tables for projects, scenes, and overlays) to your newly created remote database:
```bash
npx wrangler d1 execute oneverlay-db --file=worker/db/schema.sql --remote
```

## Step 6: Deploy!
Build the frontend and deploy the full-stack application (Frontend + Backend API + Database Bindings) to Cloudflare's global network:
```bash
npm run deploy
```
*Behind the scenes, this runs `tsc -b && vite build` followed by `npx wrangler deploy`.*

That is it. Cloudflare will output a public URL (e.g., `https://oneverlay.<your-username>.workers.dev`) where your own instance of Oneverlay is now live, secure, and ready to use.

## Automated Cleanup (Cron Job)
Oneverlay comes with a built-in automated cleanup system to prevent database bloating. Projects that are completely inactive for over 90 days are automatically swept from the database. 
This is handled via a Cron Trigger configured in `wrangler.jsonc` (`0 0 * * *`) and executed by the worker at midnight UTC. No manual maintenance is required.
