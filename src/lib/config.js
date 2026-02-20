export const cfg = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",

  // Long-term memory (optional)
  MONGODB_URI: process.env.MONGODB_URI || "",

  // CookMyBots AI Gateway (required for roasting)
  // COOKMYBOTS_AI_ENDPOINT must be a BASE URL like: https://api.cookmybots.com/api/ai
  COOKMYBOTS_AI_ENDPOINT: process.env.COOKMYBOTS_AI_ENDPOINT || "",
  COOKMYBOTS_AI_KEY: process.env.COOKMYBOTS_AI_KEY || "",

  // Optional controls
  AI_TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS || 600000),
  AI_MAX_RETRIES: Number(process.env.AI_MAX_RETRIES || 2),

  // Runner / backpressure
  CONCURRENCY: Number(process.env.CONCURRENCY || 1),
  GLOBAL_INFLIGHT_CAP: Number(process.env.GLOBAL_INFLIGHT_CAP || 2)
};
