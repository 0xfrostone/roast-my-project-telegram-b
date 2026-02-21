Roast My Project is a Telegram bot that gives short, VC-style analysis of startup pitches. Users paste a short description (optionally a URL) and the bot replies with a compact investor-style evaluation and a 1–10 Roast Score.

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
1) /start: what to send and how this bot behaves
2) /help: examples and output format
3) /reset: clear your stored memory for this chat

Output format
Every response follows this order:
A) Verdict
B) Roast Score (1–10)
C) TAM
D) CAC and payback
E) Moat (1–3 numbered lines)
F) GTM (single channel + wedge)
G) Biggest risk
H) Next step
I) Up to 2 questions (only if needed)

Tips for best results
Include: ICP (who buys), pricing/ACV, acquisition channel, and any traction. If those are present, the bot will not ask follow-up questions.

Notes on reliability
The bot uses long polling via @grammyjs/runner with concurrency=1, clears any webhook at boot, and retries on Telegram 409 conflicts. It includes per-user in-flight locks and a small global cap to prevent memory build-up.
