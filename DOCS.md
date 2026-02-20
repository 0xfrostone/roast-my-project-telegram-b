What this bot does
Roast My Project is a Telegram bot that critiques startup ideas, product concepts, and landing page positioning in a VC-style, analytical tone. It is blunt about the business but respectful to the person. Replies are intentionally compact for quick Telegram reading.

Public commands
1) /start
What it does: Explains what to submit, what the Roast Score means, and the style boundaries.
Usage: /start

2) /help
What it does: Shows examples of good submissions and explains the output sections.
Usage: /help

3) /reset
What it does: Clears the user’s stored long-term memory (conversation turns) for this chat.
Usage: /reset

How to use
Send 2–8 sentences describing your project. Helpful details include: target buyer/ICP, pricing, distribution channel, usage frequency, and any traction. You can include an optional URL.

Output format (short-form)
Each response follows this structure:
1) Verdict: Pass/Watch/Lean Yes/Yes + biggest reason
2) Roast Score: 1–10 (investor-relevant)
3) TAM snapshot: 1–2 lines using TAM/SAM/SOM logic
4) Unit economics & CAC reality check: 2–3 lines max
5) Moat & differentiation: 1–2 lines
6) GTM wedge: 1–2 lines
7) Red flags: up to 3 items
8) Next steps: 2 concrete actions

Follow-up questions
If critical info is missing that blocks TAM/CAC/moat evaluation (buyer/ICP, pricing, acquisition channel, usage frequency, traction), the bot asks at most 2 questions at the end.

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

Run instructions
1) npm install
2) Set env vars (see .env.sample)
3) npm run dev
