import { cfg } from "../lib/config.js";
import { aiChat, extractChatContent } from "../lib/ai.js";
import { addTurn, getRecentTurns } from "../lib/memory.js";
import { buildBotProfile } from "../lib/botProfile.js";
import { safeErr } from "../lib/safeErr.js";

const inflightByKey = new Map();
let globalInflight = 0;

function clampText(s, maxChars) {
  const t = String(s || "").trim();
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars) + "…";
}

function extractUrl(text) {
  const t = String(text || "");
  const m = t.match(/https?:\/\/[^\s)\]}>,"']+/i);
  return m ? m[0] : "";
}

function wordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function keyFor(ctx) {
  const userId = String(ctx.from?.id || "");
  const chatId = String(ctx.chat?.id || "");
  return userId ? `u:${userId}` : `c:${chatId}`;
}

function buildSystemPrompt({ hasUrl }) {
  const profile = buildBotProfile();
  const extra = hasUrl
    ? "\n\nExtra instruction: The user included a URL. Make sure your critique explicitly covers UX and positioning (headline strength, messaging clarity, CTA effectiveness, trust signals, friction), even if you can't browse the page."
    : "";

  const style = [
    "Style constraints:",
    "1) Witty and blunt, but not mean.",
    "2) No insults about the user. No protected-class content.",
    "3) Keep it under 500 words total.",
    "4) Be specific and concrete in improvements.",
  ].join("\n");

  return profile + "\n\n" + style + extra;
}

export function registerAgent(bot) {
  bot.on("message:text", async (ctx, next) => {
    const raw = ctx.message?.text || "";
    if (raw.startsWith("/")) return next();

    const k = keyFor(ctx);

    if (inflightByKey.get(k)) {
      await ctx.reply("I’m still roasting your last one—give me a sec.");
      return;
    }

    const cap = Number.isFinite(cfg.GLOBAL_INFLIGHT_CAP) ? cfg.GLOBAL_INFLIGHT_CAP : 2;
    if (globalInflight >= Math.max(1, cap)) {
      await ctx.reply("Busy, try again in a moment.");
      return;
    }

    inflightByKey.set(k, true);
    globalInflight++;

    try {
      const userId = String(ctx.from?.id || "");
      const chatId = String(ctx.chat?.id || "");

      const url = extractUrl(raw);
      const hasUrl = !!url;

      const userText = clampText(raw, 6000);

      await addTurn({
        mongoUri: cfg.MONGODB_URI,
        platform: "telegram",
        userId,
        chatId,
        role: "user",
        text: userText,
      });

      const history = await getRecentTurns({
        mongoUri: cfg.MONGODB_URI,
        platform: "telegram",
        userId,
        chatId,
        limit: 18,
      });

      const botProfile = buildBotProfile();
      const system = buildSystemPrompt({ hasUrl });

      const messages = [
        { role: "system", content: system },
        { role: "system", content: "Bot Profile:\n" + botProfile },
        ...history.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: clampText(m.text, 2000),
        })),
        {
          role: "user",
          content:
            (hasUrl
              ? `Submission (includes URL: ${url}):\n${userText}`
              : `Submission:\n${userText}`) +
            "\n\nReturn the roast in the exact required section order.",
        },
      ];

      const res = await aiChat(
        cfg,
        {
          messages,
          meta: {
            platform: "telegram",
            userId,
            chatId,
            feature: "roast",
            hasUrl,
          },
        },
        { timeoutMs: cfg.AI_TIMEOUT_MS, retries: cfg.AI_MAX_RETRIES }
      );

      if (!res.ok) {
        console.log("[agent] ai failed", { status: res.status, err: res.error });
        await ctx.reply("I couldn’t finish the roast right now. Try again in a bit.");
        return;
      }

      let out = extractChatContent(res.json);
      if (!out) {
        console.log("[agent] ai missing output", { keys: Object.keys(res.json || {}) });
        await ctx.reply("I got an empty roast back. Try again with a bit more detail.");
        return;
      }

      // Enforce: under 500 words (soft clamp)
      if (wordCount(out) > 500) {
        out = out
          .split(/\s+/)
          .slice(0, 500)
          .join(" ")
          .trim();
        out = out + "\n\n(Trimmed to 500 words.)";
      }

      await addTurn({
        mongoUri: cfg.MONGODB_URI,
        platform: "telegram",
        userId,
        chatId,
        role: "assistant",
        text: out,
      });

      await ctx.reply(out);
    } catch (e) {
      console.log("[agent] handler error", { err: safeErr(e) });
      await ctx.reply("Something went wrong. Try again in a moment.");
    } finally {
      inflightByKey.delete(k);
      globalInflight = Math.max(0, globalInflight - 1);
    }
  });
}
