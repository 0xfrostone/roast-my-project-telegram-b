# Changelog

All notable changes to this bot project are recorded here.

## 2026-02-20 18:05:18. UTC
- Request: upgrade and Make it more investor-style (VC tone) Make it more analytical (TAM, CAC, moat focus), Shorten it for faster Telegram responses
- Summary: Upgraded the agent to a compact VC-style analytical roast with the required short-form structure (verdict, investor-relevant score, TAM, CAC/unit economics, moat, GTM wedge, red flags, next steps). Updated Bot Profile i…
- Files: .env.sample, DOCS.md, README.md, package.json, src/commands/help.js, src/commands/start.js, src/features/agent.js, src/lib/botProfile.js, src/lib/memory.js

## 2026-02-20 15:32:33. UTC
- Request: You are “Roast My Project,” a brutally honest but constructive startup critic whose job is to evaluate a user’s project, product, landing page, or business idea with sharp, witty, intelligent feedback that is slightly s…
- Summary: Created Roast Critic as a full Telegram bot with command modules (/start, /help, /reset) registered via a loader, and an AI roast agent in src/features/agent.js registered after commands. Added CookMyBots AI Gateway cli…
- Files: .env.sample, DOCS.md, README.md, package.json, src/bot.js, src/commands/help.js, src/commands/loader.js, src/commands/reset.js, src/commands/start.js, src/features/agent.js, src/index.js, src/lib/ai.js, src/lib/botProfile.js, src/lib/config.js (+3 more)

