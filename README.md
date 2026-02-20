Roast My Project is a Telegram bot that gives VC-style, analytical roasts of startup ideas and landing pages. Users paste a short description (and optionally a URL) and the bot replies with a compact investor-style evaluation and a 1–10 Roast Score.

Setup
1) Install dependencies: npm install
2) Create a .env file (or set env vars in your host) using .env.sample as a reference
3) Run locally: npm run dev
4) Run in production: npm start

Environment variables
1) TELEGRAM_BOT_TOKEN (required) Telegram bot token
2) COOKMYBOTS_AI_ENDPOINT (required) CookMyBots AI Gateway base URL (must NOT include /chat)
3) COOKMYBOTS_AI_KEY (required) CookMyBots AI Gateway key
4) MONGODB_URI (optional) Enables long-term memory storage in MongoDB. If missing, the bot uses an in-memory fallback.
5) AI_TIMEOUT_MS (optional) AI request timeout in ms. Default 600000.

Commands
1) /start: what to send and how scoring works
2) /help: examples of good submissions and what you’ll get back
3) /reset: clear your stored memory for this chat

Output format (short-form)
Every response follows this order:
1) Verdict: Pass/Watch/Lean Yes/Yes + biggest reason
2) Roast Score: 1–10
3) TAM snapshot (TAM/SAM/SOM framing)
4) Unit economics & CAC reality check
5) Moat & differentiation
6) GTM wedge
7) Red flags (up to 3)
8) Next steps (2 concrete actions)

Notes on reliability
The bot uses long polling via @grammyjs/runner with concurrency=1, clears any webhook at boot, and retries on Telegram 409 conflicts. It includes per-user in-flight locks and a small global cap to prevent memory build-up.
