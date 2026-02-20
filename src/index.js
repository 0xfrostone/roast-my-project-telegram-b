import "dotenv/config";

import { run } from "@grammyjs/runner";
import { GrammyError, HttpError } from "grammy";

import { cfg } from "./lib/config.js";
import { safeErr } from "./lib/safeErr.js";
import { createBot } from "./bot.js";
import { ensureMemoryIndexes } from "./lib/memory.js";

process.on("unhandledRejection", (r) => {
  console.log("[fatal] unhandledRejection", { err: safeErr(r) });
  process.exit(1);
});

process.on("uncaughtException", (e) => {
  console.log("[fatal] uncaughtException", { err: safeErr(e) });
  process.exit(1);
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function is409(err) {
  const msg = String(err?.message || "");
  return msg.includes("409") || msg.toLowerCase().includes("conflict");
}

let runner = null;
let restarting = false;

async function startPollingWithRetry(bot) {
  if (runner) return;

  const delays = [2000, 5000, 10000, 20000];
  let i = 0;

  while (true) {
    try {
      await bot.api.deleteWebhook({ drop_pending_updates: true });
      console.log("[boot] polling start", { concurrency: cfg.CONCURRENCY });

      runner = run(bot, { concurrency: cfg.CONCURRENCY });
      return;
    } catch (e) {
      const err = safeErr(e);

      if (!is409(e)) {
        console.log("[boot] polling start failed", { err });
        throw e;
      }

      const d = delays[Math.min(i, delays.length - 1)];
      console.log("[boot] 409 conflict, retrying", { inMs: d });
      i++;
      await sleep(d);
    }
  }
}

async function restartPolling(bot) {
  if (restarting) return;
  restarting = true;

  try {
    if (runner) {
      try {
        runner.abort();
      } catch {}
      runner = null;
      await sleep(1000);
    }

    await startPollingWithRetry(bot);
  } finally {
    restarting = false;
  }
}

async function boot() {
  console.log("[boot] starting", {
    TELEGRAM_BOT_TOKEN_set: !!cfg.TELEGRAM_BOT_TOKEN,
    MONGODB_URI_set: !!cfg.MONGODB_URI,
    COOKMYBOTS_AI_ENDPOINT_set: !!cfg.COOKMYBOTS_AI_ENDPOINT,
    COOKMYBOTS_AI_KEY_set: !!cfg.COOKMYBOTS_AI_KEY,
  });

  if (!cfg.TELEGRAM_BOT_TOKEN) {
    console.log("TELEGRAM_BOT_TOKEN is required. Set it and redeploy.");
    process.exit(1);
  }

  if (!cfg.MONGODB_URI) {
    console.log("[boot] warning: MONGODB_URI not set; using in-memory fallback for memory");
  } else {
    await ensureMemoryIndexes(cfg.MONGODB_URI);
  }

  const bot = await createBot(cfg.TELEGRAM_BOT_TOKEN);

  bot.catch(async (err) => {
    const e = err.error;

    if (e instanceof GrammyError) {
      console.log("[telegram] GrammyError", {
        method: e.method,
        description: e.description,
      });

      if (String(e.description || "").includes("Conflict") || is409(e)) {
        await restartPolling(bot);
      }

      return;
    }

    if (e instanceof HttpError) {
      console.log("[telegram] HttpError", { err: safeErr(e) });
      return;
    }

    console.log("[telegram] unknown error", { err: safeErr(e) });
  });

  // Ensure ctx.me is available
  try {
    await bot.init();
  } catch (e) {
    console.log("[boot] bot.init failed", { err: safeErr(e) });
  }

  try {
    await bot.api.setMyCommands([
      { command: "start", description: "What this bot does" },
      { command: "help", description: "Examples and output format" },
      { command: "reset", description: "Clear your stored memory" },
    ]);
  } catch (e) {
    console.log("[boot] setMyCommands failed", { err: safeErr(e) });
  }

  // Memory log occasionally
  setInterval(() => {
    const m = process.memoryUsage();
    console.log("[mem]", {
      rssMB: Math.round(m.rss / 1e6),
      heapUsedMB: Math.round(m.heapUsed / 1e6),
    });
  }, 60_000).unref();

  await startPollingWithRetry(bot);
}

boot().catch((e) => {
  console.log("[boot] fatal", { err: safeErr(e) });
  process.exit(1);
});
