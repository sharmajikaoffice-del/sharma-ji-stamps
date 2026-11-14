const API = process.env.SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").json(body);
}

// Public, read-only endpoint for the customer designer.
// Only exposes the saved template name and design config; it cannot write or
// access users, PINs, orders, purchases, or other application tables.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Method not allowed." });
  }
  if (!API || !KEY) return send(res, 500, { error: "Template service is not configured." });

  try {
    const response = await fetch(
      `${API}/rest/v1/stamp_templates?select=id,name,config&order=created_at.asc`,
      {
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      console.error("Customer templates request failed:", response.status, await response.text());
      return send(res, 502, { error: "Saved templates could not be loaded." });
    }
    const rows = await response.json();
    return send(res, 200, Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error("Customer templates API error:", error);
    return send(res, 500, { error: "Saved templates could not be loaded." });
  }
}
