import React, { useState, useEffect, useMemo } from "react";
import {
  LogOut, Plus, Search, Trash2, RotateCcw,
  Stamp, Package, Tag as TagIcon, ShoppingCart, PenSquare, Wallet, Users
} from "lucide-react";

/* =====================================================================
   1) PASTE YOUR SUPABASE PROJECT DETAILS HERE (Settings → API in Supabase)
   ===================================================================== */
const SUPABASE_URL_RAW = "https://dqfaskpnssdosgnluuji.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_p7MrqZjsOf5pfZi9aygTWg_gBg-kCl_";
/* ===================================================================== */
// Normalizes the URL whether you pasted the base project URL or included /rest/v1/
const SUPABASE_URL = SUPABASE_URL_RAW.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function dbGet(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${table} failed`);
  return res.json();
}
async function dbInsert(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`INSERT ${table} failed`);
  return res.json();
}
async function dbUpdate(table, id, patch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`UPDATE ${table} failed`);
  return res.json();
}
async function dbDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: HEADERS });
  if (!res.ok) throw new Error(`DELETE ${table} failed`);
}

/* ---------- design tokens ---------- */
const C = {
  paper: "#EDE6D3", paperDark: "#E2D9C0", ink: "#1E2A35", inkSoft: "#4A5A66",
  stamp: "#A5332A", stampDark: "#7F241C", brass: "#B08A3E", sage: "#5C6E4E",
  white: "#FCFAF3", line: "#C9BC9C",
};
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function useFonts() {
  useEffect(() => {
    if (document.getElementById("sjs-fonts")) return;
    const link = document.createElement("link");
    link.id = "sjs-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Work+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}
const font = { display: "'Fraunces', serif", mono: "'IBM Plex Mono', monospace", body: "'Work Sans', sans-serif" };

function StampMark({ size = 64 }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ color: C.stamp, opacity: 0.9, transform: "rotate(-6deg)" }}>
      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path id="ctop" d="M 100,100 m -70,0 a 70,70 0 1,1 140,0" fill="none" />
      <path id="cbot" d="M 100,100 m -70,0 a 70,70 0 1,0 140,0" fill="none" />
      <text fontFamily="IBM Plex Mono, monospace" fontSize="13" letterSpacing="3" fill="currentColor">
        <textPath href="#ctop" startOffset="50%" textAnchor="middle">SHARMA JI STAMPS</textPath>
      </text>
      <text fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="4" fill="currentColor">
        <textPath href="#cbot" startOffset="50%" textAnchor="middle">RECORD BOOK</textPath>
      </text>
      <text x="100" y="94" fontFamily="Fraunces, serif" fontWeight="700" fontSize="34" fill="currentColor" textAnchor="middle">SJ</text>
    </svg>
  );
}

/* ---------- atoms ---------- */
const Label = ({ children }) => <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.inkSoft, marginBottom: 4 }}>{children}</div>;
const Field = (props) => <input {...props} style={{ width: "100%", background: C.white, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.ink, marginBottom: 12, fontFamily: font.body, outline: "none", ...props.style }} />;
const Select = ({ children, ...props }) => <select {...props} style={{ width: "100%", background: C.white, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.ink, marginBottom: 12, fontFamily: font.body }}>{children}</select>;
const Card = ({ children, style }) => <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, ...style }}>{children}</div>;
const Btn = ({ children, variant = "solid", ...props }) => {
  const styles = variant === "ghost" ? { background: "transparent", color: C.ink, border: `1.5px solid ${C.ink}` } : { background: C.stamp, color: C.white, border: "none" };
  return <button {...props} style={{ ...styles, padding: "10px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13.5, fontFamily: font.body, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, ...props.style }}>{children}</button>;
};
const Tag = ({ children, tone = "in" }) => <span style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", background: tone === "in" ? "#E4EBDD" : "#F3E0DC", color: tone === "in" ? C.sage : C.stampDark }}>{children}</span>;

/* ================= LOGIN ================= */
function Login({ users, onLogin }) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const press = (d) => {
    if (!selected) return;
    setError("");
    if (d === "back") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    const u = users.find((u) => u.id === selected);
    if (u && next.length === u.pin.length) {
      if (next === u.pin) setTimeout(() => onLogin(u), 150);
      else { setError("Wrong PIN"); setTimeout(() => setPin(""), 400); }
    }
  };
  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
      <StampMark size={110} />
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, marginTop: 12 }}>Sharma Ji Stamps</div>
      <div style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: 2, color: C.inkSoft, marginTop: 4, marginBottom: 28 }}>RUBBER STAMP RECORD BOOK</div>
      <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: C.inkSoft, marginBottom: 10 }}>SELECT USER</div>
      <div style={{ display: "flex", gap: 14, marginBottom: 26, flexWrap: "wrap", justifyContent: "center" }}>
        {users.map((u) => (
          <div key={u.id} onClick={() => { setSelected(u.id); setPin(""); setError(""); }} style={{ textAlign: "center", cursor: "pointer" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: C.paperDark, border: `2px solid ${selected === u.id ? C.stamp : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 600, color: C.brass, fontSize: 16 }}>
              {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div style={{ fontSize: 11, marginTop: 5, color: C.ink }}>{u.name.split(" ")[0]}</div>
          </div>
        ))}
      </div>
      {selected && (
        <>
          <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: C.inkSoft, marginBottom: 8 }}>ENTER PIN</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 6, minHeight: 16 }}>
            {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", border: `1.5px solid ${C.stamp}`, background: i < pin.length ? C.stamp : "transparent" }} />
            ))}
          </div>
          <div style={{ height: 18, color: C.stamp, fontFamily: font.mono, fontSize: 11, marginBottom: 6 }}>{error}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: 220 }}>
            {["1","2","3","4","5","6","7","8","9","","0","back"].map((k, i) => (
              k === "" ? <div key={i} /> :
              <button key={i} onClick={() => press(k)} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 0", fontFamily: font.mono, fontSize: 16, color: C.ink, cursor: "pointer" }}>{k === "back" ? "⌫" : k}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================= APP SHELL ================= */
const TABS_ADMIN = [
  { id: "entry", label: "Stamp Entry", icon: PenSquare },
  { id: "stock", label: "Stock", icon: Package },
  { id: "rate", label: "Rates", icon: Tag },
  { id: "rubber", label: "Rubber", icon: Stamp },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "ledger", label: "Cash", icon: Wallet },
  { id: "users", label: "Users", icon: Users },
  
];
const TABS_STAFF = [
  { id: "entry", label: "Stamp Entry", icon: PenSquare },
  { id: "stock", label: "Stock", icon: Package },
  { id: "rate", label: "Rates", icon: Tag },
  { id: "ledger", label: "Cash", icon: Wallet },
  
];

export default function SharmaJiStamps() {
  useFonts();
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("entry");

  const [users, setUsers] = useState([]);
  const [rubbers, setRubbers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [entries, setEntries] = useState([]);
  const [cashManual, setCashManual] = useState([]);

  const refreshAll = async () => {
    try {
      const [u, r, p, e, c] = await Promise.all([
        dbGet("users"), dbGet("rubbers"), dbGet("purchases"), dbGet("stamp_entries"), dbGet("cash_manual"),
      ]);
      setUsers(u); setRubbers(r); setPurchases(p); setEntries(e); setCashManual(c);
      setDbError("");
    } catch (e) {
      setDbError("Could not connect to the database. Check SUPABASE_URL / SUPABASE_KEY at the top of the file, and that the SQL schema has been run.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshAll(); }, []);

  const stockByRubber = useMemo(() => {
    const m = {};
    rubbers.forEach((r) => {
      const purchased = purchases.filter((p) => p.rubber_id === r.id).reduce((s, p) => s + Number(p.qty), 0);
      const used = entries.filter((e) => e.rubber_id === r.id).length;
      m[r.id] = { opening: r.opening_stock, purchased, used, balance: r.opening_stock + purchased - used };
    });
    return m;
  }, [rubbers, purchases, entries]);

  if (loading) return <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.mono, color: C.inkSoft }}>Connecting to database…</div>;

  if (dbError) return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Card style={{ maxWidth: 420 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: C.stamp }}>Database not connected</div>
        <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>{dbError}</div>
      </Card>
    </div>
  );

  if (!user) return <Login users={users} onLogin={setUser} />;
  const tabs = user.role === "admin" ? TABS_ADMIN : TABS_STAFF;

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink, display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.ink, color: C.white, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StampMark size={30} />
          <div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, lineHeight: 1 }}>Sharma Ji Stamps</div>
            <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1, color: "#C9BC9C", marginTop: 2 }}>{user.name.toUpperCase()} · {user.role.toUpperCase()}</div>
          </div>
        </div>
        <button onClick={() => setUser(null)} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: font.body, fontSize: 12 }}><LogOut size={16} /> Logout</button>
      </div>

      <div style={{ flex: 1, padding: "16px 16px 90px", maxWidth: 760, width: "100%", margin: "0 auto" }}>
        {tab === "entry" && <StampEntryTab rubbers={rubbers} entries={entries} refresh={refreshAll} user={user} />}
        {tab === "stock" && <StockTab rubbers={rubbers} stockByRubber={stockByRubber} />}
        {tab === "rate" && <RateTab rubbers={rubbers} refresh={refreshAll} canEdit={user.role === "admin"} />}
        {tab === "rubber" && user.role === "admin" && <RubberTab rubbers={rubbers} refresh={refreshAll} />}
        {tab === "purchase" && user.role === "admin" && <PurchaseTab rubbers={rubbers} purchases={purchases} refresh={refreshAll} />}
        {tab === "ledger" && <LedgerTab purchases={purchases} entries={entries} cashManual={cashManual} refresh={refreshAll} />}
        {tab === "users" && user.role === "admin" && <UsersTab users={users} refresh={refreshAll} currentUser={user} />}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.line}`, display: "flex", overflowX: "auto" }}>
        {tabs.map((t) => {
          const Icon = t.icon; const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: "1 0 auto", minWidth: 70, background: "none", border: "none", padding: "10px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? C.stamp : C.inkSoft }}>
              <Icon size={18} />
              <span style={{ fontSize: 10, fontFamily: font.mono, letterSpacing: 0.5 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================= STAMP ENTRY ================= */
function StampEntryTab({ rubbers, entries, refresh, user }) {
  const [date, setDate] = useState(todayISO());
  const [rubberId, setRubberId] = useState(rubbers[0]?.id || "");
  const [mobile, setMobile] = useState("");
  const [discount, setDiscount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const rubber = rubbers.find((r) => r.id === rubberId);
  const rate = rubber?.rate || 0;
  const amount = Math.max(0, rate - Number(discount || 0));
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const handlePhotoChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setPhotoFile(file);
  setPhotoPreview(URL.createObjectURL(file));
};

  const save = async () => {
    if (!rubberId || busy) return;
    setBusy(true);
    try {
      await dbInsert("stamp_entries", { id: uid(), date, rubber_id: rubberId, mobile, qty: 1, rate, discount: Number(discount || 0), amount, remarks, by_user: user.name });
      setMobile(""); setDiscount(0); setRemarks("");
      setSavedMsg(`Saved — Stock −1, Cash In ${inr(amount)}`);
      await refresh();
      setTimeout(() => setSavedMsg(""), 2500);
    } catch { setSavedMsg("Save failed — check connection"); }
    setBusy(false);
  };

  return (
    <div>
      <SectionTitle icon={PenSquare} title="Make Stamp Entry" />
      <Card>
        <Label>Date</Label>
        <Field type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Label>Select Rubber</Label>
        <Select value={rubberId} onChange={(e) => setRubberId(e.target.value)}>
          {rubbers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
        <Label>Customer Mobile No.</Label>
        <Field type="tel" placeholder="98xxxxxxxx" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Label>Qty</Label><Field value="1" disabled style={{ background: C.paperDark, color: C.inkSoft }} /></div>
          <div style={{ flex: 1 }}><Label>Rate (Auto)</Label><Field value={inr(rate)} disabled style={{ background: C.paperDark, color: C.inkSoft }} /></div>
        </div>
        <Label>Discount (₹)</Label>
        <Field type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        <Label>Amount (Auto = Rate − Discount)</Label>
        <Field value={inr(amount)} disabled style={{ background: C.paperDark, color: C.ink, fontWeight: 700 }} />
        <Label>Stamp Impression Image</Label>
        <label style={{ display: "block", border: `1px dashed ${C.brass}`, borderRadius: 8, padding: "16px", textAlign: "center", color: C.brass, fontSize: 13, marginBottom: 12, cursor: "pointer", overflow: "hidden" }}>
        {photoPreview ? (
        <img src={photoPreview} alt="Stamp impression" style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 6 }} />
          ) : (
        "📷 Tap to capture / upload impression"
        )}
        <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhotoChange} />
        </label>

        
        <Field placeholder="Any notes…" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        <Btn onClick={save} disabled={busy} style={{ width: "100%", justifyContent: "center" }}><Plus size={16} /> {busy ? "Saving…" : "Save Entry"}</Btn>
        {savedMsg && <div style={{ marginTop: 10, color: C.sage, fontFamily: font.mono, fontSize: 12, textAlign: "center" }}>{savedMsg}</div>}
      </Card>
      <Label>Recent Entries</Label>
      {entries.slice(0, 8).map((e) => {
        const r = rubbers.find((r) => r.id === e.rubber_id);
        return (
          <Card key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r?.name || "—"}</div>
              <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft, marginTop: 2 }}>{fmtDate(e.date)} · {e.mobile || "no mobile"}</div>
            </div>
            <div style={{ fontFamily: font.mono, fontWeight: 700, color: C.sage }}>+{inr(e.amount)}</div>
          </Card>
        );
      })}
      {entries.length === 0 && <EmptyNote text="No entries yet." />}
    </div>
  );
}

/* ================= STOCK ================= */
function StockTab({ rubbers, stockByRubber }) {
  return (
    <div>
      <SectionTitle icon={Package} title="Stock Report" />
      {rubbers.map((r) => {
        const s = stockByRubber[r.id]; const low = s.balance <= 15;
        return (
          <Card key={r.id}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{r.name}</div>
            <Row label="Opening" value={s.opening} />
            <Row label="Purchased" value={`+${s.purchased}`} color={C.sage} />
            <Row label="Used" value={`−${s.used}`} color={C.stamp} />
            <hr style={{ border: "none", borderTop: `1px dotted ${C.line}`, margin: "8px 0" }} />
            <Row label="Balance" value={low ? `${s.balance} ⚠` : s.balance} bold color={low ? C.stamp : C.ink} />
          </Card>
        );
      })}
    </div>
  );
}
function Row({ label, value, color, bold }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.mono, fontSize: 12.5, color: color || C.ink, fontWeight: bold ? 700 : 400, marginBottom: 3 }}><span>{label}</span><span>{value}</span></div>;
}

/* ================= RATE ================= */
function RateTab({ rubbers, refresh, canEdit }) {
  const [busyId, setBusyId] = useState(null);
  const update = async (id, rate) => {
    setBusyId(id);
    try { await dbUpdate("rubbers", id, { rate: Number(rate) || 0 }); await refresh(); } finally { setBusyId(null); }
  };
  return (
    <div>
      <SectionTitle icon={Tag} title="Rate Master" />
      {rubbers.map((r) => (
        <Card key={r.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div><Tag>Active</Tag>
          </div>
          <Label>Set Rate (₹)</Label>
          {canEdit ? (
            <Field type="number" defaultValue={r.rate} onBlur={(e) => update(r.id, e.target.value)} style={{ marginBottom: 0, opacity: busyId === r.id ? 0.5 : 1 }} />
          ) : (
            <div style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 16 }}>{inr(r.rate)}</div>
          )}
        </Card>
      ))}
      <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft, textAlign: "center", marginTop: 8 }}>ⓘ rate changes apply to new entries only · tap outside the field to save</div>
    </div>
  );
}

/* ================= RUBBER MASTER ================= */
function RubberTab({ rubbers, refresh }) {
  const [name, setName] = useState("");
  const [opening, setOpening] = useState(0);
  const [q, setQ] = useState("");
  const add = async () => {
    if (!name.trim()) return;
    await dbInsert("rubbers", { id: uid(), name: name.trim(), opening_stock: Number(opening) || 0, rate: 0 });
    setName(""); setOpening(0); await refresh();
  };
  const remove = async (id) => { await dbDelete("rubbers", id); await refresh(); };
  const filtered = rubbers.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <SectionTitle icon={Stamp} title="Rubber Master" />
      <Card>
        <Label>Rubber Name</Label>
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. Round Seal 2"' />
        <Label>Opening Stock</Label>
        <Field type="number" value={opening} onChange={(e) => setOpening(e.target.value)} />
        <Btn onClick={add} style={{ width: "100%", justifyContent: "center" }}><Plus size={16} /> Add Rubber</Btn>
      </Card>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={15} style={{ position: "absolute", left: 10, top: 12, color: C.inkSoft }} />
        <Field placeholder="Search rubber name…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 32 }} />
      </div>
      {filtered.map((r) => (
        <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.paperDark, border: `1px solid ${C.line}` }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</div>
              <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkSoft }}>Opening: {r.opening_stock}</div>
            </div>
          </div>
          <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", color: C.stamp, cursor: "pointer" }}><Trash2 size={16} /></button>
        </Card>
      ))}
    </div>
  );
}

/* ================= PURCHASE ================= */
function PurchaseTab({ rubbers, purchases, refresh }) {
  const [date, setDate] = useState(todayISO());
  const [rubberId, setRubberId] = useState(rubbers[0]?.id || "");
  const [qty, setQty] = useState(0);
  const [purchaseRate, setPurchaseRate] = useState(0);
  const [courier, setCourier] = useState(0);
  const amount = Number(qty || 0) * Number(purchaseRate || 0);
  const total = amount + Number(courier || 0);
  const save = async () => {
    if (!rubberId || !qty) return;
    await dbInsert("purchases", { id: uid(), date, rubber_id: rubberId, qty: Number(qty), purchase_rate: Number(purchaseRate), amount, courier: Number(courier || 0), total });
    setQty(0); setPurchaseRate(0); setCourier(0); await refresh();
  };
  return (
    <div>
      <SectionTitle icon={ShoppingCart} title="Purchase Entry" />
      <Card>
        <Label>Date</Label>
        <Field type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Label>Rubber Name</Label>
        <Select value={rubberId} onChange={(e) => setRubberId(e.target.value)}>{rubbers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
        <Label>Quantity</Label>
        <Field type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        <Label>Purchase Rate (₹)</Label>
        <Field type="number" value={purchaseRate} onChange={(e) => setPurchaseRate(e.target.value)} />
        <Label>Amount (Auto)</Label>
        <Field value={inr(amount)} disabled style={{ background: C.paperDark, color: C.inkSoft }} />
        <Label>Courier Charge</Label>
        <Field type="number" value={courier} onChange={(e) => setCourier(e.target.value)} />
        <Label>Total Amount (Auto)</Label>
        <Field value={inr(total)} disabled style={{ background: C.paperDark, color: C.ink, fontWeight: 700 }} />
        <Btn onClick={save} style={{ width: "100%", justifyContent: "center" }}><Plus size={16} /> Save Purchase</Btn>
      </Card>
      <Label>Recent Purchases</Label>
      {purchases.slice(0, 8).map((p) => {
        const r = rubbers.find((r) => r.id === p.rubber_id);
        return (
          <Card key={p.id} style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r?.name} · Qty {p.qty}</div>
              <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft }}>{fmtDate(p.date)}</div>
            </div>
            <div style={{ fontFamily: font.mono, fontWeight: 700, color: C.stamp }}>−{inr(p.total)}</div>
          </Card>
        );
      })}
      {purchases.length === 0 && <EmptyNote text="No purchases recorded yet." />}
    </div>
  );
}

/* ================= CASH LEDGER ================= */
function LedgerTab({ purchases, entries, cashManual, refresh }) {
  const [type, setType] = useState("in");
  const [category, setCategory] = useState("Other Receipt");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  const cashInSales = entries.reduce((s, e) => s + Number(e.amount), 0);
  const cashInManual = cashManual.filter((c) => c.type === "in").reduce((s, c) => s + Number(c.amount), 0);
  const cashOutPurchase = purchases.reduce((s, p) => s + Number(p.total), 0);
  const cashOutManual = cashManual.filter((c) => c.type === "out").reduce((s, c) => s + Number(c.amount), 0);
  const totalIn = cashInSales + cashInManual;
  const totalOut = cashOutPurchase + cashOutManual;
  const balance = totalIn - totalOut;

  const txns = [
    ...entries.map((e) => ({ id: e.id, date: e.date, label: "Stamp Sale", type: "in", amount: e.amount })),
    ...purchases.map((p) => ({ id: p.id, date: p.date, label: `Rubber Purchase${p.courier ? " + Courier" : ""}`, type: "out", amount: p.total })),
    ...cashManual.map((c) => ({ id: c.id, date: c.date, label: c.category, type: c.type, amount: c.amount })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const addManual = async () => {
    if (!amount) return;
    await dbInsert("cash_manual", { id: uid(), date: todayISO(), type, category, amount: Number(amount), note });
    setAmount(0); setNote(""); await refresh();
  };

  return (
    <div>
      <SectionTitle icon={Wallet} title="Cash Ledger" />
      <Card style={{ background: C.ink, color: C.white }}>
        <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.5, color: "#C9BC9C" }}>CURRENT CASH BALANCE</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, margin: "4px 0 8px" }}>{inr(balance)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.mono, fontSize: 11.5 }}>
          <span>In: <span style={{ color: "#9FC08A" }}>{inr(totalIn)}</span></span>
          <span>Out: <span style={{ color: "#E29B90" }}>{inr(totalOut)}</span></span>
        </div>
      </Card>
      <Card>
        <Label>Add Cash Entry</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <Btn variant={type === "in" ? "solid" : "ghost"} onClick={() => setType("in")} style={{ flex: 1, justifyContent: "center" }}>Cash In</Btn>
          <Btn variant={type === "out" ? "solid" : "ghost"} onClick={() => setType("out")} style={{ flex: 1, justifyContent: "center" }}>Cash Out</Btn>
        </div>
        <Label>Category</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>{type === "in" ? <option>Other Receipt</option> : <option>Other Expense</option>}</Select>
        <Label>Amount (₹)</Label>
        <Field type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Label>Note (optional)</Label>
        <Field value={note} onChange={(e) => setNote(e.target.value)} />
        <Btn onClick={addManual} style={{ width: "100%", justifyContent: "center" }}><Plus size={16} /> Add Entry</Btn>
      </Card>
      <Label>Transactions</Label>
      {txns.slice(0, 15).map((t) => (
        <Card key={t.id} style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
            <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft }}>{fmtDate(t.date)}</div>
          </div>
          <div style={{ fontFamily: font.mono, fontWeight: 700, color: t.type === "in" ? C.sage : C.stamp }}>{t.type === "in" ? "+" : "−"}{inr(t.amount)}</div>
        </Card>
      ))}
      {txns.length === 0 && <EmptyNote text="No transactions yet." />}
    </div>
  );
}

/* ================= USERS ================= */
function UsersTab({ users, refresh, currentUser }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("staff");
  const [resetId, setResetId] = useState(null);
  const [newPin, setNewPin] = useState("");

  const add = async () => {
    if (!name.trim() || pin.length < 4) return;
    await dbInsert("users", { id: uid(), name: name.trim(), role, pin });
    setName(""); setPin(""); await refresh();
  };
  const remove = async (id) => {
    if (id === currentUser.id) return;
    await dbDelete("users", id); await refresh();
  };
  const applyReset = async (id) => {
    if (newPin.length < 4) return;
    await dbUpdate("users", id, { pin: newPin });
    setResetId(null); setNewPin(""); await refresh();
  };

  return (
    <div>
      <SectionTitle icon={Users} title="User Management" />
      <Card>
        <Label>Name</Label>
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        <Label>Role</Label>
        <Select value={role} onChange={(e) => setRole(e.target.value)}><option value="staff">Staff</option><option value="admin">Admin</option></Select>
        <Label>PIN (4–6 digits)</Label>
        <Field value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} maxLength={6} />
        <Btn onClick={add} style={{ width: "100%", justifyContent: "center" }}><Plus size={16} /> Add User</Btn>
      </Card>
      {users.map((u) => (
        <Card key={u.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: C.paperDark, border: `1px solid ${u.role === "admin" ? C.stamp : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 600, color: C.brass, fontSize: 14 }}>
                {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div><Tag tone={u.role === "admin" ? "in" : "out"}>{u.role}</Tag></div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn variant="ghost" onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPin(""); }} style={{ padding: "6px 10px", fontSize: 11 }}><RotateCcw size={13} /> PIN</Btn>
              {u.id !== currentUser.id && <button onClick={() => remove(u.id)} style={{ background: "none", border: "none", color: C.stamp, cursor: "pointer" }}><Trash2 size={16} /></button>}
            </div>
          </div>
          {resetId === u.id && (
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <Field placeholder="New PIN" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} maxLength={6} style={{ marginBottom: 0 }} />
              <Btn onClick={() => applyReset(u.id)}>Save</Btn>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ---------- helpers ---------- */
function SectionTitle({ icon: Icon, title }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Icon size={18} color={C.stamp} /><div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 19 }}>{title}</div></div>;
}
function EmptyNote({ text }) { return <div style={{ textAlign: "center", fontFamily: font.mono, fontSize: 12, color: C.inkSoft, padding: "20px 0" }}>{text}</div>; }
