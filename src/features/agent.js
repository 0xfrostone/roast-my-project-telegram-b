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

function truncateAtBoundary(text, maxChars) {
  const t = String(text || "").trim();
  if (t.length <= maxChars) return t;

  const slice = t.slice(0, maxChars);
  const idx = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"));
  if (idx > Math.floor(maxChars * 0.6)) return slice.slice(0, idx).trim() + "\n\n(Trimmed.)";

  const idx2 = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf(".\n"), slice.lastIndexOf("; "));
  if (idx2 > Math.floor(maxChars * 0.6)) return slice.slice(0, idx2 + 1).trim() + " (Trimmed.)";

  return slice.trim() + "…";
}

function hasIcpPricingChannel(text) {
  const t = String(text || "").toLowerCase();

  const icp = /\b(icp|who buys|buyer|customer|users?|teams?|clinics?|companies|smb|enterprise|mid-market|persona)\b/.test(t);
  const pricing = /\b(\$\s*\d|price|pricing|per\s*(seat|user|month|mo|yr|year)|subscription|acv|arr|mrr|take\s*rate|commission|bps|%|freemium)\b/.test(t);
  const channel = /\b(acquisition|channel|gtm|go-to-market|outbound|inbound|ads?|seo|content|partnerships?|marketplace|plg|sales-led|cold\s*email|linkedin|affiliates?|resellers?)\b/.test(t);

  return icp && pricing && channel;
}

function buildSystemPrompt({ hasUrl, userText }) {
  const botProfile = buildBotProfile();
  const alreadyHasKeyInfo = hasIcpPricingChannel(userText);

  const instructions = [
    "You are evaluating this like a VC partner. Be direct, analytical, and compact.",
    "No long intros. No generic encouragement. No repeating the pitch.",
    "If you must assume numbers (TAM, CAC, etc.), label them as assumptions and keep them plausible.",
    "Do not fabricate traction or customers.",
    "",
    "You MUST output in the exact section order A) through I) and keep each section short.",
    "Section E (Moat) must be 1–3 numbered lines formatted exactly like: 1) ...",
    "Section I (Questions) must be omitted entirely if not needed.",
    alreadyHasKeyInfo
      ? "The user already provided ICP + pricing + acquisition channel (or close). Do NOT ask questions."
      : "If critical info is missing for TAM/CAC/moat, ask at most 2 questions at the end in section I.",
  ].join("\n");

  const linkNote = hasUrl
    ? "\n\nUser included a URL. You may comment on positioning/landing-page clarity, but do not claim you browsed the page unless the user pasted content."
    : "";

  return botProfile + "\n\n" + instructions + linkNote;
}

export function registerAgent(bot) {
  bot.on("message:text", async (ctx, next) => {
    const raw = ctx.message?.text || "";
    if (raw.startsWith("/")) return next();

    const k = keyFor(ctx);

    if (inflightByKey.get(k)) {
      await ctx.reply("Working on your last one—give me a sec.");
      return;
    }

    const cap = Number.isFinite(cfg.GLOBAL_INFLIGHT_CAP) ? cfg.GLOBAL_INFLIGHT_CAP : 2;
    if (globalInflight >= Math.max(1, cap)) {
      await ctx.reply("Busy. Try again in a moment.");
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
        limit: 16,
      });

      const system = buildSystemPrompt({ hasUrl, userText });

      const messages = [
        { role: "system", content: system },
        ...history.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: clampText(m.text, 1400),
        })),
        {
          role: "user",
          content:
            (hasUrl
              ? `Pitch (includes URL: ${url}):\n${userText}`
              : `Pitch:\n${userText}`) +
            "\n\nReturn the analysis in the required A)–I) format. Keep it short.",
        },
      ];

      const timeoutMs = Number(process.env.AI_TIMEOUT_MS || cfg.AI_TIMEOUT_MS || 600000);

      const res = await aiChat(
        cfg,
        {
          messages,
          meta: {
            platform: "telegram",
            userId,
            chatId,
            feature: "vc_pitch_analysis",
            hasUrl,
          },
        },
        {
          timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 600000,
          retries: cfg.AI_MAX_RETRIES,
        }
      );

      if (!res.ok) {
        console.log("[agent] ai failed", { status: res.status, err: res.error });
        await ctx.reply("Couldn’t finish the analysis right now. Try again in a bit.");
        return;
      }

      let out = extractChatContent(res.json);
      if (!out) {
        console.log("[agent] ai missing output", { keys: Object.keys(res.json || {}) });
        await ctx.reply("I got an empty response. Try again with a bit more detail.");
        return;
      }

      const maxChars = Number(process.env.AI_SHORT_MAX_CHARS || 1200);
      out = truncateAtBoundary(out, Number.isFinite(maxChars) && maxChars > 300 ? maxChars : 1200);

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
