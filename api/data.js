import { createHmac, timingSafeEqual } from "node:crypto";

const API = process.env.SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SESSION_SECRET = process.env.SJS_SESSION_SECRET;
const COOKIE = "sjs_session";

const TABLES = new Set(["rubbers", "purchases", "stamp_entries", "cash_manual", "stamp_templates", "customer_designs"]);
function send(res, status, body) { res.status(status).setHeader("Content-Type", "application/json").json(body); }
function getCookie(req) {
  const part = (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  return part ? decodeURIComponent(part.slice(COOKIE.length + 1)) : "";
}
function sessionId(req) {
  try {
    const [payload, signature] = getCookie(req).split(".");
    if (!payload || !signature) return null;
    const expected = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    const a = Buffer.from(expected), b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return value.exp > Math.floor(Date.now() / 1000) ? value.id : null;
  } catch { return null; }
}
async function request(path, options = {}) {
  const response = await fetch(`${API}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const err = new Error(data?.message || data?.hint || "Database request failed.");
    err.status = response.status;
    throw err;
  }
  return data;
}
async function getUser(id) {
  const rows = await request(`users?select=id,name,role&id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows?.[0] || null;
}
export default async function handler(req, res) {
  if (!API || !KEY || !SESSION_SECRET) return send(res, 500, { error: "Server security configuration is incomplete." });
  const table = String(req.query.table || "");
  if (!TABLES.has(table)) return send(res, 400, { error: "Unsupported table." });

  try {
    const id = sessionId(req);
    const user = id ? await getUser(id) : null;
    const publicRubbersRead = !user && req.method === "GET" && table === "rubbers";
    if (!user && !publicRubbersRead) return send(res, 401, { error: "Please log in." });
    if (user && !["admin", "staff"].includes(user.role)) return send(res, 403, { error: "Access denied." });

    const adminOnly = ["purchases", "cash_manual"];
    if (user?.role === "staff" && adminOnly.includes(table)) {
      if (req.method !== "GET") return send(res, 403, { error: "Admin access required." });
    }
    if (user?.role === "staff" && table === "rubbers" && req.method !== "GET") return send(res, 403, { error: "Admin access required." });

    if (req.method === "GET") {
      const select = publicRubbersRead ? "id,name,size,rate,category" : "*";
      const order = req.query.order === "none" ? "" : "&order=created_at.desc";
      const rows = await request(`${table}?select=${select}${order}`);
      return send(res, 200, rows || []);
    }

    if (req.method === "POST") {
      if (table === "customer_designs" || table === "users") return send(res, 403, { error: "Use the dedicated endpoint." });
      if (user.role === "staff" && table !== "stamp_entries" && table !== "stamp_templates") return send(res, 403, { error: "Admin access required." });
      const row = { ...(req.body || {}) };
      if (table === "stamp_entries") row.by_user = user.name;
      const rows = await request(table, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
      return send(res, 201, rows || []);
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      if (table === "customer_designs" || table === "users") return send(res, 403, { error: "Use the dedicated endpoint." });
      if (user.role === "staff" && !["stamp_entries", "stamp_templates"].includes(table)) return send(res, 403, { error: "Admin access required." });
      const rowId = String(req.query.id || "");
      if (!rowId) return send(res, 400, { error: "Missing row id." });
      const path = `${table}?id=eq.${encodeURIComponent(rowId)}`;
      if (req.method === "DELETE") {
        await request(path, { method: "DELETE" });
        return send(res, 200, { ok: true });
      }
      const patch = { ...(req.body || {}) };
      if (table === "stamp_entries") delete patch.by_user;
      const rows = await request(path, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) });
      return send(res, 200, rows || []);
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return send(res, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error("Data API error:", error);
    return send(res, error.status || 500, { error: error.status === 401 ? "Please log in again." : "Database request failed." });
  }
}
