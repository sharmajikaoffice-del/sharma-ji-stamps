import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const API = process.env.SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SESSION_SECRET = process.env.SJS_SESSION_SECRET;
const PIN_PEPPER = process.env.SJS_PIN_PEPPER;
const COOKIE = "sjs_session";
const SESSION_SECONDS = 60 * 60 * 12;

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").json(body);
}
function configOk() {
  return !!(API && KEY && SESSION_SECRET && PIN_PEPPER);
}
function headers() {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
}
async function db(path, options = {}) {
  const response = await fetch(`${API}/rest/v1/${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error("Database request failed");
  return data;
}
function cookieValue(req) {
  const raw = req.headers.cookie || "";
  const part = raw.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  return part ? decodeURIComponent(part.slice(COOKIE.length + 1)) : "";
}
function sign(value) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}
function makeSession(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return payload + "." + sign(payload);
}
function readSession(req) {
  try {
    const token = cookieValue(req);
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(payload));
    const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.id || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch { return null; }
}
function setSessionCookie(res, value) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`);
}
function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}
function validPin(pin) { return typeof pin === "string" && /^\d{4,6}$/.test(pin); }
function hashPin(pin, salt) {
  return scryptSync(pin, `${salt}:${PIN_PEPPER}`, 64).toString("hex");
}
function verifyHash(pin, salt, stored) {
  try {
    const actual = Buffer.from(hashPin(pin, salt), "hex");
    const expected = Buffer.from(stored, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
async function currentUser(req) {
  const session = readSession(req);
  if (!session) return null;
  const rows = await db(`users?select=id,name,role&id=eq.${encodeURIComponent(session.id)}&limit=1`);
  const user = rows?.[0];
  if (!user || !["admin", "staff"].includes(user.role)) return null;
  return user;
}
function requireAdmin(user) { return user?.role === "admin"; }

export default async function handler(req, res) {
  if (!configOk()) return send(res, 500, { error: "Server security configuration is incomplete." });

  try {
    if (req.method === "GET") {
      const user = await currentUser(req);
      const users = await db("users?select=id,name,role&order=created_at.asc");
      return send(res, 200, { user, users: users || [] });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = req.body || {};
    if (body.action === "logout") {
      clearSessionCookie(res);
      return send(res, 200, { ok: true });
    }

    if (body.action === "login") {
      const userId = String(body.userId || "");
      const pin = String(body.pin || "");
      if (!userId || !validPin(pin)) return send(res, 400, { error: "Enter a valid 4–6 digit PIN." });

      const rows = await db(`users?select=id,name,role,pin,pin_hash,pin_salt&id=eq.${encodeURIComponent(userId)}&limit=1`);
      const record = rows?.[0];
      if (!record || !["admin", "staff"].includes(record.role)) return send(res, 401, { error: "Incorrect PIN." });

      let verified = false;
      if (record.pin_hash && record.pin_salt) {
        verified = verifyHash(pin, record.pin_salt, record.pin_hash);
      } else if (typeof record.pin === "string" && record.pin.length >= 4) {
        const a = Buffer.from(pin);
        const b = Buffer.from(record.pin);
        verified = a.length === b.length && timingSafeEqual(a, b);
        if (verified) {
          const salt = randomBytes(16).toString("hex");
          await db(`users?id=eq.${encodeURIComponent(record.id)}`, {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ pin: null, pin_salt: salt, pin_hash: hashPin(pin, salt) }),
          });
        }
      }
      if (!verified) return send(res, 401, { error: "Incorrect PIN." });

      const user = { id: record.id, name: record.name, role: record.role };
      setSessionCookie(res, makeSession(user));
      return send(res, 200, { ok: true, user });
    }

    const user = await currentUser(req);
    if (!user) return send(res, 401, { error: "Please log in again." });

    if (body.action === "create-user" || body.action === "reset-pin" || body.action === "delete-user") {
      if (!requireAdmin(user)) return send(res, 403, { error: "Admin access required." });
      if (body.action === "create-user") {
        const name = String(body.name || "").trim();
        const pin = String(body.pin || "");
        const role = body.role === "admin" ? "admin" : "staff";
        if (name.length < 2 || name.length > 80 || !validPin(pin)) return send(res, 400, { error: "Enter a name and a 4–6 digit PIN." });
        const salt = randomBytes(16).toString("hex");
        const id = randomBytes(12).toString("hex");
        await db("users", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id, name, role, pin: null, pin_salt: salt, pin_hash: hashPin(pin, salt) }) });
        return send(res, 201, { ok: true });
      }
      if (body.action === "reset-pin") {
        const targetId = String(body.userId || "");
        const pin = String(body.pin || "");
        if (!targetId || !validPin(pin)) return send(res, 400, { error: "Enter a valid 4–6 digit PIN." });
        const salt = randomBytes(16).toString("hex");
        await db(`users?id=eq.${encodeURIComponent(targetId)}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ pin: null, pin_salt: salt, pin_hash: hashPin(pin, salt) }),
        });
        return send(res, 200, { ok: true });
      }
      if (body.action === "delete-user") {
        const targetId = String(body.userId || "");
        if (!targetId || targetId === user.id) return send(res, 400, { error: "You cannot delete your own account." });
        await db(`users?id=eq.${encodeURIComponent(targetId)}`, { method: "DELETE" });
        return send(res, 200, { ok: true });
      }
    }

    return send(res, 400, { error: "Unknown action." });
  } catch (error) {
    console.error("Auth API error:", error);
    return send(res, 500, { error: "Authentication service error." });
  }
}
