Roast Critic is a Telegram bot that gives brutally honest but constructive feedback on startup ideas and landing page copy. Users paste a short description (and optionally a URL) and the bot replies with a structured roast and a 1–10 score.

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
6) AI_MAX_RETRIES (optional) Retries for transient AI errors. Default 2.
7) CONCURRENCY (optional) grammY runner concurrency. Default 1.
8) GLOBAL_INFLIGHT_CAP (optional) Max simultaneous roasts in the process. Default 2.

Commands
1) /start: what to send and how scoring works
2) /help: examples of good submissions and what you’ll get back
3) /reset: clear your stored memory for this chat

Typical usage
Send 2–8 sentences about your project plus an optional link. If a link is present, Roast Critic will focus more on positioning and UX: headline, clarity, CTA, trust signals, and friction.

Notes on reliability
The bot uses long polling via @grammyjs/runner with concurrency=1, clears any webhook at boot, and retries on Telegram 409 conflicts. It includes per-user in-flight locks and a small global cap to prevent memory build-up.
