import { MongoClient } from "mongodb";
import { safeErr } from "./safeErr.js";

let _client = null;
let _db = null;
let _connecting = null;

export async function getDb(mongoUri) {
  const uri = String(mongoUri || "").trim();
  if (!uri) return null;
  if (_db) return _db;
  if (_connecting) return _connecting;

  _connecting = (async () => {
    try {
      _client = new MongoClient(uri, {
        maxPoolSize: 5,
        ignoreUndefined: true,
      });
      await _client.connect();
      _db = _client.db();
      console.log("[db] connected", { ok: true });
      return _db;
    } catch (e) {
      console.log("[db] connect failed", { err: safeErr(e) });
      _client = null;
      _db = null;
      return null;
    } finally {
      _connecting = null;
    }
  })();

  return _connecting;
}
