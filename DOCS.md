What this bot does
Roast Critic is a Telegram bot that critiques startup ideas, product concepts, landing page copy, and business ideas. It is blunt and witty, but it never attacks the person. It keeps responses under 500 words and always uses a consistent section order.

Public commands
1) /start
What it does: Explains what to submit, the 1–10 scoring scale, and the style boundaries.
Usage: /start

2) /help
What it does: Shows examples of good submissions and explains what the bot returns.
Usage: /help

3) /reset
What it does: Clears the user’s stored long-term memory (conversation turns) for this chat.
Usage: /reset

How to use
Send 2–8 sentences describing your project. Include an optional URL. If you include a URL, the roast will explicitly critique positioning and UX elements like headline clarity, CTA effectiveness, trust signals, and friction.

Environment variables
1) TELEGRAM_BOT_TOKEN (required)
Used to connect to Telegram.

2) COOKMYBOTS_AI_ENDPOINT (required)
CookMyBots AI Gateway base URL. Example format: https://api.cookmybots.com/api/ai
Important: do not include /chat in this value.

3) COOKMYBOTS_AI_KEY (required)
CookMyBots AI Gateway key used for Authorization: Bearer.

4) MONGODB_URI (optional)
If set, the bot stores conversation turns in MongoDB in the memory_messages collection. If missing, it falls back to in-memory storage and logs a warning.

5) AI_TIMEOUT_MS (optional)
AI call timeout in milliseconds. Default is 600000.

6) AI_MAX_RETRIES (optional)
Number of transient retries for AI calls. Default is 2.

7) CONCURRENCY (optional)
Runner concurrency for Telegram updates. Default is 1.

8) GLOBAL_INFLIGHT_CAP (optional)
Global cap for simultaneous AI roasts. Default is 2.

Run instructions
1) npm install
2) Set env vars (see .env.sample)
3) npm run dev
