# Cloudflare Worker Proxy Setup Guide

This guide will walk you through setting up a free, private, and secure proxy using Cloudflare Workers. This is **The Brain** of the operation, responsible for handling all external API calls and securely managing your secret API keys. The entire process should take about 5-10 minutes.

### Step 1: Create a Cloudflare Account

1.  Go to [dash.cloudflare.com](https://dash.cloudflare.com/).
2.  Sign up for a free account if you don't have one. You do **not** need to add a website or a credit card.

### Step 2: Create a New Worker

1.  Once logged in, look for the **"Workers & Pages"** icon in the right-hand sidebar and click it.
2.  Click the **"Create application"** button.
3.  On the next screen, select the **"Worker"** option (usually the first one) and click **"Create worker"**.
4.  You can give your worker a name (e.g., `bonerbots-proxy`) or leave the default.
5.  Click the **"Deploy"** button.

### Step 3: Add the Proxy Code

1.  After deploying, you'll be on the worker's management page. Click the **"Edit code"** button.
2.  You will see a code editor. **Delete all the existing code** in the editor.
3.  Go to the `cloudflare-worker.js` file in this project. **Copy the entire contents** of that file.
4.  **Paste the copied code** into the Cloudflare code editor.
5.  Click the blue **"Save and deploy"** button at the top right.

### Step 4: Securely Add Your API Keys

This is the most important step for security. We will add your keys as encrypted secrets for your AI providers and for **each live bot**.

#### Why Separate Keys per Bot?
This project uses a multi-wallet architecture. Each live bot has its own dedicated trading account (and thus its own API key/secret). The worker uses the `botId` sent from the frontend to dynamically select the correct keys for a trade, ensuring bots cannot access each other's funds.

---

1.  On your worker's management page, click on the **"Settings"** tab.
2.  In the left-hand menu of the settings page, click on **"Variables"**.
3.  Scroll down to the **"Environment Variable Bindings"** section.
4.  Click **"Add variable"**. We need to add the following secrets:

    *   **Variable 1: Gemini**
        *   Variable name: `GEMINI_API_KEY`
        *   Value: Paste your **Google Gemini API Key** here.
        *   Click the **"Encrypt"** button to secure it.

    *   **Variable 2: xAI (Grok)**
        *   Click **"Add variable"** again.
        *   Variable name: `XAI_API_KEY`
        *   Value: Paste your **xAI (Grok) API Key** here.
        *   Click the **"Encrypt"** button.
    
    ---
    
    *   **DEGEN LIVE Wallet Keys**
        *   Click **"Add variable"**.
        *   Variable name: `DEGEN_LIVE_API_KEY`
        *   Value: Paste the **ASTERDEX API Key** for Degen's wallet.
        *   Click **"Encrypt"**.
        *   Click **"Add variable"**.
        *   Variable name: `DEGEN_LIVE_SECRET`
        *   Value: Paste the **ASTER API Secret** for Degen's wallet.
        *   Click **"Encrypt"**.
        
    *   **Escaped Monkey Wallet Keys**
        *   Click **"Add variable"**.
        *   Variable name: `ESCAPED_MONKEY_API_KEY`
        *   Value: Paste the **ASTERDEX API Key** for Escaped Monkey's wallet.
        *   Click **"Encrypt"**.
        *   Click **"Add variable"**.
        *   Variable name: `ESCAPED_MONKEY_SECRET`
        *   Value: Paste the **ASTER API Secret** for Escaped Monkey's wallet.
        *   Click **"Encrypt"**.

    *   **Astrologer Wallet Keys**
        *   Click **"Add variable"**.
        *   Variable name: `ASTROLOGER_API_KEY`
        *   Value: Paste the **ASTERDEX API Key** for Astrologer's wallet.
        *   Click **"Encrypt"**.
        *   Click **"Add variable"**.
        *   Variable name: `ASTROLOGER_SECRET`
        *   Value: Paste the **ASTER API Secret** for Astrologer's wallet.
        *   Click **"Encrypt"**.

5.  After adding all encrypted variables, click the **"Save and deploy"** button at the bottom of the section.

### Step 5: Get Your Worker URL

1.  Go back to the main page for your worker (the "Overview" tab).
2.  In the top section, you will see your worker's URL under **"Routes"**. It will look something like `https://bonerbots-proxy.your-username.workers.dev`.
3.  **Copy this URL.** You will need it for the final step in the main `README.md` guide.

**That's it!** Your private, secure proxy is now configured for all three live trading bots, each with its own independent wallet.
