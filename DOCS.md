What this bot does
Roast My Project is a Telegram bot that gives short, investor-style analysis of startup and project pitches. It focuses on TAM logic, CAC/payback reality, defensibility/moat, and a plausible GTM wedge. Replies are intentionally compact for fast Telegram reading.

Public commands
1) /start
What it does: Explains what to submit to get the best VC-style analysis.
Usage: /start

2) /help
What it does: Shows examples and the exact output format.
Usage: /help

3) /reset
What it does: Clears your stored long-term memory (conversation turns) for this chat.
Usage: /reset

How to use
Send 2–8 sentences describing your project. If you want the sharpest output, include:
1) ICP / buyer (who pays)
2) Pricing (or ACV)
3) Acquisition channel (how customers discover/buy)
Optional: traction and a URL.

Output format (compact VC-style)
Every response follows this exact order:
A) Verdict: 1–2 sentences
B) Roast Score: 1–10 with one-sentence justification
C) TAM: numbers/ranges when possible; if unknown, a labeled assumption-based estimate
D) CAC and payback: channel constraints + one key target metric when possible
E) Moat: 1–3 short numbered lines (1) 2) 3))
F) GTM: single most plausible channel + wedge; one sentence
G) Biggest risk: one sentence
H) Next step: one concrete action
I) Up to 2 questions: only if truly needed to unblock TAM/CAC/moat

Question-asking rule
If your message already contains ICP + pricing + acquisition channel (or close equivalents), the bot will not ask questions.
If critical info is missing, it will ask at most 2 targeted questions at the end.

Environment variables
1) TELEGRAM_BOT_TOKEN (required)
Used to connect to Telegram.

2) COOKMYBOTS_AI_ENDPOINT (required)
CookMyBots AI Gateway base URL. Example: https://api.cookmybots.com/api/ai
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
