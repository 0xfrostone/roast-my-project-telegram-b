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

function keyFor(ctx) {
  const userId = String(ctx.from?.id || "");
  const chatId = String(ctx.chat?.id || "");
  return userId ? `u:${userId}` : `c:${chatId}`;
}

function truncateAtParagraphBoundary(text, maxChars) {
  const t = String(text || "").trim();
  if (t.length <= maxChars) return t;

  const slice = t.slice(0, maxChars);
  const idx = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"));

  if (idx > Math.floor(maxChars * 0.6)) {
    return slice.slice(0, idx).trim() + "\n\n(Trimmed.)";
  }

  const idx2 = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf(".\n"), slice.lastIndexOf("; "));
  if (idx2 > Math.floor(maxChars * 0.6)) {
    return slice.slice(0, idx2 + 1).trim() + " (Trimmed.)";
  }

  return slice.trim() + "…";
}

function buildSystemPrompt({ hasUrl }) {
  const botProfile = buildBotProfile();

  const style = [
    "You are a VC/investor doing a fast, high-signal evaluation.",
    "Be crisp, analytical, and slightly blunt about the business. Always respectful to the person.",
    "Plain text only. No markdown.",
    "Default to short output that fits a quick Telegram read.",
    "If critical info is missing that blocks TAM/CAC/moat assessment, ask at most 2 questions at the end.",
    "Do not ask questions unless it materially changes the evaluation.",
    "",
    "You MUST follow the required output structure exactly and keep each section short.",
    "Red flags: up to 3 items max.",
    "Next steps: exactly 2 actions.",
  ].join("\n");

  const linkNote = hasUrl
    ? "\n\nUser included a URL. You may comment on positioning/landing-page clarity, but do not claim you browsed the page unless the user explicitly pasted content."
    : "";

  return botProfile + "\n\n" + style + linkNote;
}

export function registerAgent(bot) {
  bot.on("message:text", async (ctx, next) => {
    const raw = ctx.message?.text || "";
    if (raw.startsWith("/")) return next();

    const k = keyFor(ctx);

    if (inflightByKey.get(k)) {
      await ctx.reply("I’m working on your last one—give me a sec.");
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

      const system = buildSystemPrompt({ hasUrl });

      const messages = [
        { role: "system", content: system },
        ...history.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: clampText(m.text, 1600),
        })),
        {
          role: "user",
          content:
            (hasUrl
              ? `Submission (includes URL: ${url}):\n${userText}`
              : `Submission:\n${userText}`) +
            "\n\nRespond using the required short-form VC structure.",
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
            feature: "vc_roast",
            hasUrl,
          },
        },
        { timeoutMs: cfg.AI_TIMEOUT_MS, retries: cfg.AI_MAX_RETRIES }
      );

      if (!res.ok) {
        console.log("[agent] ai failed", { status: res.status, err: res.error });
        await ctx.reply("I couldn’t finish the analysis right now. Try again in a bit.");
        return;
      }

      let out = extractChatContent(res.json);
      if (!out) {
        console.log("[agent] ai missing output", { keys: Object.keys(res.json || {}) });
        await ctx.reply("I got an empty response back. Try again with a bit more detail.");
        return;
      }

      const maxChars = Number(process.env.AI_SHORT_MAX_CHARS || 1600);
      out = truncateAtParagraphBoundary(out, Number.isFinite(maxChars) && maxChars > 300 ? maxChars : 1600);

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
