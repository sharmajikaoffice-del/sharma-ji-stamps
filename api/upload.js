import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

export const config = { api: { bodyParser: false } };

const API = process.env.SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SESSION_SECRET = process.env.SJS_SESSION_SECRET;
const COOKIE = "sjs_session";

function send(res, status, body) { res.status(status).setHeader("Content-Type", "application/json").json(body); }
function sessionId(req) {
  try {
    const part = (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
    const token = part ? decodeURIComponent(part.slice(COOKIE.length + 1)) : "";
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    const a = Buffer.from(expected), b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return value.exp > Math.floor(Date.now() / 1000) ? value.id : null;
  } catch { return null; }
}
async function readBody(req, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("File is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
export default async function handler(req, res) {
  if (!API || !KEY || !SESSION_SECRET) return send(res, 500, { error: "Server security configuration is incomplete." });
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(res, 405, { error: "Method not allowed." }); }
  if (!sessionId(req)) return send(res, 401, { error: "Please log in again." });

  const folder = String(req.query.folder || "");
  if (folder !== "entries") return send(res, 400, { error: "Invalid upload folder." });
  const mime = String(req.headers["content-type"] || "").toLowerCase();
  const allowed = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"],["image/gif","gif"]]);
  if (!allowed.has(mime)) return send(res, 415, { error: "Only JPG, PNG, WEBP, and GIF images are allowed." });

  try {
    const bytes = await readBody(req, 8 * 1024 * 1024);
    if (!bytes.length) return send(res, 400, { error: "Empty file." });
    const path = `entries/${randomUUID()}.${allowed.get(mime)}`;
    const response = await fetch(`${API}/storage/v1/object/rubber-photos/${path}`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": mime, "x-upsert": "false" },
      body: bytes,
    });
    if (!response.ok) {
      console.error("Storage upload failed:", await response.text());
      return send(res, 502, { error: "Photo upload failed." });
    }
    return send(res, 201, { url: `${API}/storage/v1/object/public/rubber-photos/${path}` });
  } catch (error) {
    return send(res, error.message === "File is too large." ? 413 : 500, { error: error.message || "Photo upload failed." });
  }
}
