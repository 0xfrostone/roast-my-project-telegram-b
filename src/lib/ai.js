import { safeErr } from "./safeErr.js";

function trimSlash(u) {
  u = String(u || "");
  while (u.endsWith("/")) u = u.slice(0, -1);
  return u;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { ctrl, clear: () => clearTimeout(t) };
}

function pickTimeoutMs(cfg, override) {
  const v = Number(override ?? cfg?.AI_TIMEOUT_MS ?? 600000);
  return Number.isFinite(v) && v > 0 ? v : 600000;
}

function endpoint(cfg, path) {
  const base = trimSlash(cfg?.COOKMYBOTS_AI_ENDPOINT || "");
  return base ? base + path : "";
}

function cfgOk(cfg) {
  return !!(cfg?.COOKMYBOTS_AI_ENDPOINT && cfg?.COOKMYBOTS_AI_KEY);
}

async function readJsonOrText(r) {
  const text = await r.text();
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

export async function aiChat(cfg, { messages, model = "", meta = {} } = {}, opts = {}) {
  const timeoutMs = pickTimeoutMs(cfg, opts.timeoutMs);
  const retries = Number.isFinite(opts.retries) ? Number(opts.retries) : Number(cfg?.AI_MAX_RETRIES ?? 2);

  if (!cfgOk(cfg)) {
    return {
      ok: false,
      status: 412,
      json: null,
      error: "AI_NOT_CONFIGURED",
    };
  }

  const url = endpoint(cfg, "/chat");

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { ctrl, clear } = withTimeout(timeoutMs);
    const startedAt = Date.now();

    try {
      console.log("[ai] chat start", {
        attempt,
        timeoutMs,
        hasModel: !!String(model || "").trim(),
        msgCount: Array.isArray(messages) ? messages.length : 0,
      });

      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.COOKMYBOTS_AI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: Array.isArray(messages) ? messages : [],
          model: String(model || "").trim() || undefined,
          meta: meta || undefined,
        }),
        signal: ctrl.signal,
      });

      const { text, json } = await readJsonOrText(r);

      if (!r.ok) {
        const msg = json?.error || json?.message || text || `AI_HTTP_${r.status}`;
        console.log("[ai] chat fail", {
          status: r.status,
          ms: Date.now() - startedAt,
          err: String(msg).slice(0, 300),
        });

        if (attempt < retries && (r.status === 408 || r.status === 429 || r.status >= 500)) {
          await sleep(500 * (attempt + 1));
          continue;
        }

        return { ok: false, status: r.status, json, error: String(msg) };
      }

      console.log("[ai] chat ok", { status: r.status, ms: Date.now() - startedAt });
      return { ok: true, status: r.status, json, error: null };
    } catch (e) {
      const msg = e?.name === "AbortError" ? "AI_TIMEOUT" : safeErr(e);
      console.log("[ai] chat exception", { attempt, err: String(msg).slice(0, 300) });

      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
        continue;
      }

      return { ok: false, status: e?.name === "AbortError" ? 408 : 0, json: null, error: String(msg) };
    } finally {
      clear();
    }
  }

  return { ok: false, status: 0, json: null, error: "AI_UNKNOWN" };
}

export function extractChatContent(json) {
  const content = json?.output?.content;
  if (typeof content === "string" && content.trim()) return content.trim();

  const alt = json?.result?.output_text;
  if (typeof alt === "string" && alt.trim()) return alt.trim();

  return "";
}
