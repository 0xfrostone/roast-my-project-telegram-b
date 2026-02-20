import { getDb } from "./db.js";
import { safeErr } from "./safeErr.js";

const COL = "memory_messages";

// In-memory fallback (bounded)
const MAX_MEM_TURNS_PER_USER = 40;
const mem = new Map(); // key: platform:userId[:chatId]

function keyOf({ platform, userId, chatId }) {
  const p = String(platform || "");
  const u = String(userId || "");
  const c = chatId ? String(chatId) : "";
  return c ? `${p}:${u}:${c}` : `${p}:${u}`;
}

function looksLikeSecret(s) {
  const t = String(s || "");
  if (!t) return false;
  if (t.length > 20000) return true;
  return (
    /api[_-]?key\s*[:=]/i.test(t) ||
    /secret\s*[:=]/i.test(t) ||
    /password\s*[:=]/i.test(t) ||
    /bearer\s+[a-z0-9\-_.=]+/i.test(t) ||
    /sk-[a-z0-9]{10,}/i.test(t) ||
    /xox[baprs]-/i.test(t) ||
    /-----BEGIN [A-Z ]+PRIVATE KEY-----/i.test(t)
  );
}

function redactSecrets(text) {
  let t = String(text || "");
  if (!t) return t;

  t = t.replace(/(authorization\s*:\s*bearer\s+)[^\s]+/gi, "$1[REDACTED]");
  t = t.replace(/(bearer\s+)[a-z0-9\-_.=]+/gi, "$1[REDACTED]");
  t = t.replace(/sk-[a-z0-9]{10,}/gi, "sk-[REDACTED]");
  t = t.replace(/(api[_-]?key\s*[:=]\s*)[^\s]+/gi, "$1[REDACTED]");
  t = t.replace(/(password\s*[:=]\s*)[^\s]+/gi, "$1[REDACTED]");
  t = t.replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]");

  return t;
}

export async function ensureMemoryIndexes(mongoUri) {
  const db = await getDb(mongoUri);
  if (!db) return;
  try {
    await db.collection(COL).createIndex({ platform: 1, userId: 1, ts: -1 });
    await db.collection(COL).createIndex({ platform: 1, userId: 1, chatId: 1, ts: -1 });
  } catch (e) {
    console.log("[db] ensureIndexes failed", { col: COL, err: safeErr(e) });
  }
}

export async function addTurn({ mongoUri, platform, userId, chatId, role, text }) {
  let safeText = String(text || "");
  if (looksLikeSecret(safeText)) safeText = redactSecrets(safeText);

  const doc = {
    platform: String(platform || "telegram"),
    userId: String(userId || ""),
    chatId: chatId ? String(chatId) : "",
    role: role === "assistant" ? "assistant" : "user",
    text: safeText.slice(0, 6000),
    ts: new Date(),
  };

  const db = await getDb(mongoUri);
  if (!db) {
    const k = keyOf(doc);
    const arr = mem.get(k) || [];
    arr.push({ role: doc.role, text: doc.text, ts: doc.ts });
    while (arr.length > MAX_MEM_TURNS_PER_USER) arr.shift();
    mem.set(k, arr);
    return;
  }

  try {
    await db.collection(COL).insertOne(doc);
  } catch (e) {
    console.log("[db] insertOne failed", { col: COL, err: safeErr(e) });
  }
}

export async function getRecentTurns({ mongoUri, platform, userId, chatId, limit = 16 }) {
  const lim = Math.max(1, Math.min(Number(limit || 16), 20));

  const db = await getDb(mongoUri);
  if (!db) {
    const k = keyOf({ platform, userId, chatId });
    const arr = mem.get(k) || [];
    return arr.slice(-lim).map((t) => ({ role: t.role, text: t.text }));
  }

  const q = { platform: String(platform || "telegram"), userId: String(userId || "") };
  if (chatId) q.chatId = String(chatId);

  try {
    const rows = await db.collection(COL).find(q).sort({ ts: -1 }).limit(lim).toArray();
    return rows.reverse().map((r) => ({ role: r.role, text: r.text }));
  } catch (e) {
    console.log("[db] find failed", { col: COL, err: safeErr(e) });
    return [];
  }
}

export async function clearUserMemory({ mongoUri, platform, userId, chatId }) {
  const db = await getDb(mongoUri);
  if (!db) {
    mem.delete(keyOf({ platform, userId, chatId }));
    mem.delete(keyOf({ platform, userId, chatId: "" }));
    return;
  }

  const q = { platform: String(platform || "telegram"), userId: String(userId || "") };
  if (chatId) q.chatId = String(chatId);

  try {
    await db.collection(COL).deleteMany(q);
  } catch (e) {
    console.log("[db] deleteMany failed", { col: COL, err: safeErr(e) });
  }
}
