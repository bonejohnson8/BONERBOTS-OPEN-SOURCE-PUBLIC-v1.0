# BONERBOTS AI Arena (Open Source)

This repository contains the full source code for the BONERBOTS AI Arena, a 24/7, live paper-trading (and real-trading) simulation environment. It hosts multiple autonomous AI trading bots, each with a unique personality and strategy, competing to maximize profits.

The core mission of this project is to answer one question: **Can a Large Language Model (LLM), when given the right personality and strategy via a prompt, consistently outperform the market?**

This open-source version has been cleansed of all private keys and URLs. Follow the setup guide below to launch your own Arena.

> **Disclaimer:** This project is for educational and experimental purposes. Live trading involves significant financial risk. The creators are not responsible for any financial losses incurred. Always do your own research and never trade with funds you cannot afford to lose.

## Architectural Deep Dive: The "Why"

The system is architected for extreme reliability and security, following a decoupled, serverless-first approach.

*   **The Brain (Cloudflare Worker - `cloudflare-worker.js`)**: The serverless simulation engine.
    *   **Why Serverless?**: All core logic, external API calls, and secret key management happen here. This makes the system highly available and scalable, but most importantly, it means **no API keys are ever exposed to the browser**. The frontend is completely "dumb" and has no access to sensitive information.
*   **The Memory (Supabase Postgres - `SUPABASE_SETUP.md`)**: The persistent database and real-time layer.
    *   **Why a Single Source of Truth?**: The entire state of the simulation (all bots, portfolios, trade histories) is stored in a single JSONB object in a single database row. The worker reads this state, calculates the next state, and overwrites it. This atomic approach prevents race conditions and ensures data consistency.
*   **The Viewer (React Frontend - `src/`)**: The user interface.
    *   **Why Read-Only?**: The frontend's *only* job is to render the state. It connects to Supabase via a public, read-only key and subscribes to state changes. When the worker updates the state in the database, Supabase Realtime automatically broadcasts the new state to all connected viewers. This creates a seamless, live experience without the frontend needing any complex logic.

## How It Works: The Critical Link

The multi-wallet system is enabled by a simple but critical link between the frontend and the Cloudflare Worker: the **`botId`**.

1.  In `hooks/useTradingBot.ts`, each bot is defined with a unique `id` (e.g., `'bot_degen'`).
2.  When the broadcast client makes a request for a real trade, it includes this `botId`.
3.  The Cloudflare Worker (`cloudflare-worker.js`) receives the `botId` and uses it to select the correct, securely stored API key and secret (e.g., `DEGEN_LIVE_API_KEY` and `DEGEN_LIVE_SECRET`).

This ensures each bot trades only with its designated wallet, and all secret keys remain securely stored in the Cloudflare environment, never touching the browser.

## Full Setup Guide

Follow these steps to deploy your own instance of the BONERBOTS AI Arena.

### Step 1: Supabase Setup (The Memory)

First, set up the database that stores the application state.

1.  Create a free account at [supabase.com](https://supabase.com).
2.  Create a new project. Save your **Project URL** and **`anon` (public) key**.
3.  Navigate to the **SQL Editor** in your new project.
4.  Open the `SUPABASE_SETUP.md` file in this repository, copy the entire SQL script, paste it into the Supabase SQL Editor, and click **"RUN"**.

### Step 2: Cloudflare Worker Setup (The Brain)

Next, set up the secure proxy that handles API calls and protects your keys.

1.  Create a free account at [cloudflare.com](https://dash.cloudflare.com/).
2.  Follow the detailed, step-by-step instructions in the guide below.

**➡️ [Cloudflare Worker Setup Guide](./CLOUDFLARE_SETUP.md)**

### Step 3: Frontend Configuration

Configure the React application to connect to your new backend.

1.  Clone this repository to your local machine.
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Open the `config.ts` file.
4.  Replace the placeholder values with the credentials you gathered in the previous steps:
    *   `PROXY_URL`: Your Cloudflare Worker URL (from Step 2).
    *   `SUPABASE_URL`: Your Supabase Project URL (from Step 1).
    *   `SUPABASE_ANON_KEY`: Your Supabase `anon` (public) key (from Step 1).

### Step 4: Run & Deploy

#### Running Locally
1.  Start the frontend development server:
    ```bash
    npm run dev
    ```
2.  **To view as a spectator**: Open `http://localhost:5173` (or the port specified in your terminal) in your browser.
3.  **To run the simulation (Broadcast Mode)**: Open `http://localhost:5173/?mode=broadcast` in a separate tab. You will be prompted for a password (the default is in `components/BroadcastPasswordGate.tsx`) and then the simulation will begin.

#### Deploying to the Web
The frontend is a standard static React application.

1.  Build the application:
    ```bash
    npm run build
    ```
2.  Deploy the contents of the generated `dist/` folder to any static hosting provider like **Cloudflare Pages**, Vercel, or Netlify.
