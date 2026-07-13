import React, { useState, useEffect, useMemo } from "react";
import {
  LogOut, Plus, Search, Trash2, RotateCcw,
  Stamp, Package, Tag as TagIcon, ShoppingCart, PenSquare, Wallet, Users, BookOpen, Download
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
async function uploadPhoto(file, folder) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${uid()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/rubber-photos/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Photo upload failed");
  return `${SUPABASE_URL}/storage/v1/object/public/rubber-photos/${path}`;
}

/* ---------- design tokens ---------- */
const C = {
  paper: "#EDE6D3", paperDark: "#E2D9C0", ink: "#1E2A35", inkSoft: "#4A5A66",
  stamp: "#A5332A", stampDark: "#7F241C", brass: "#B08A3E", sage: "#5C6E4E",
  white: "#FCFAF3", line: "#C9BC9C", headerGreen: "#034F45",
};
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
function exportToCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
    <img
      src="/logo.png"
      alt="Sharma Ji Stamps"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}

/* ---------- atoms ---------- */
const Label = ({ children }) => <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.inkSoft, marginBottom: 4 }}>{children}</div>;
const Field = (props) => <input {...props} style={{ width: "100%", background: C.white, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.ink, marginBottom: 12, fontFamily: font.body, outline: "none", ...props.style }} />;
const Select = ({ children, ...props }) => <select {...props} style={{ width: "100%", background: C.white, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.ink, marginBottom: 12, fontFamily: font.body }}>{children}</select>;
const Card = ({ children, style }) => <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, ...style }}>{children}</div>;
const Btn = ({ children, variant = "solid", ...props }) => {
  const styles = variant === "ghost" ? { background: "transparent", color: C.ink, border: `1.5px solid ${C.ink}` } : { background: C.headerGreen, color: C.white, border: "none" };
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
  { id: "register", label: "Register", icon: BookOpen },
  { id: "stock", label: "Stock", icon: Package },
  { id: "rate", label: "Rates", icon: TagIcon },
  { id: "rubber", label: "Rubber", icon: Stamp },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "ledger", label: "Cash", icon: Wallet },
  { id: "users", label: "Users", icon: Users },
  
];
const TABS_STAFF = [
  { id: "entry", label: "Stamp Entry", icon: PenSquare },
  { id: "register", label: "Register", icon: BookOpen },
  { id: "stock", label: "Stock", icon: Package },
  { id: "rate", label: "Rates", icon: TagIcon },
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
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      <div style={{ background: C.headerGreen, color: C.white, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        {tab === "register" && <StampRegisterTab entries={entries} rubbers={rubbers} refresh={refreshAll} />}
        {tab === "stock" && <StockTab rubbers={rubbers} stockByRubber={stockByRubber} />}
        {tab === "rate" && <RateTab rubbers={rubbers} refresh={refreshAll} canEdit={user.role === "admin"} />}
        {tab === "rubber" && user.role === "admin" && <RubberTab rubbers={rubbers} refresh={refreshAll} />}
        {tab === "purchase" && user.role === "admin" && <PurchaseTab rubbers={rubbers} purchases={purchases} refresh={refreshAll} />}
        {tab === "ledger" && <LedgerTab purchases={purchases} entries={entries} cashManual={cashManual} rubbers={rubbers} refresh={refreshAll} />}
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
      let image_url = null;
      if (photoFile) image_url = await uploadPhoto(photoFile, "entries");
      await dbInsert("stamp_entries", { id: uid(), date, rubber_id: rubberId, mobile, qty: 1, rate, discount: Number(discount || 0), amount, remarks, by_user: user.name, image_url });
      setMobile(""); setDiscount(0); setRemarks(""); setPhotoFile(null); setPhotoPreview(null);
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

        <Label>Stamp Name (text engraved on stamp)</Label>
        <Field placeholder="e.g. Dr. Sharma Clinic" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
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

/* ================= STAMP SALE REGISTER ================= */
function StampRegisterTab({ entries, rubbers, refresh }) {
  const [q, setQ] = useState("");
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState(todayISO());
  const [editRubberId, setEditRubberId] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editDiscount, setEditDiscount] = useState(0);
  const [editRemarks, setEditRemarks] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const chronological = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningTotal = 0;
  const withBalance = chronological.map((e) => {
    runningTotal += Number(e.amount);
    return { ...e, balanceAfter: runningTotal };
  });
  const display = [...withBalance].reverse().filter((e) => {
    if (!q.trim()) return true;
    const r = rubbers.find((r) => r.id === e.rubber_id);
    const needle = q.trim().toLowerCase();
    return (r?.name || "").toLowerCase().includes(needle) || (e.mobile || "").toLowerCase().includes(needle) || (e.remarks || "").toLowerCase().includes(needle);
  });

  const startEdit = (e) => {
    setEditId(e.id);
    setEditDate(e.date);
    setEditRubberId(e.rubber_id);
    setEditMobile(e.mobile || "");
    setEditDiscount(e.discount || 0);
    setEditRemarks(e.remarks || "");
  };
  const editRubber = rubbers.find((r) => r.id === editRubberId);
  const editRate = editRubber?.rate || 0;
  const editAmount = Math.max(0, editRate - Number(editDiscount || 0));

  const saveEdit = async () => {
    if (!editRubberId || editBusy) return;
    setEditBusy(true);
    try {
      await dbUpdate("stamp_entries", editId, {
        date: editDate, rubber_id: editRubberId, mobile: editMobile,
        rate: editRate, discount: Number(editDiscount || 0), amount: editAmount, remarks: editRemarks,
      });
      setEditId(null);
      await refresh();
    } finally {
      setEditBusy(false);
    }
  };
  const removeEntry = async (id) => { await dbDelete("stamp_entries", id); await refresh(); };

  const exportCSV = () => {
    const rows = display.map((e) => {
      const r = rubbers.find((r) => r.id === e.rubber_id);
      return {
        Date: fmtDate(e.date),
        "Rubber Name": r?.name || "",
        Mobile: e.mobile || "",
        "Stamp Name": e.remarks || "",
        Rate: e.rate,
        Discount: e.discount,
        Amount: e.amount,
        Balance: e.balanceAfter,
      };
    });
    exportToCSV(`stamp-sale-register-${todayISO()}.csv`, rows);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionTitle icon={BookOpen} title="Stamp Sale Register" />
        <Btn variant="ghost" onClick={exportCSV} style={{ padding: "6px 10px", fontSize: 11.5 }}><Download size={13} /> Export</Btn>
      </div>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={15} style={{ position: "absolute", left: 10, top: 12, color: C.inkSoft }} />
        <Field placeholder="Search by rubber name, mobile, or stamp name…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 32 }} />
      </div>
      {display.map((e) => {
        const r = rubbers.find((r) => r.id === e.rubber_id);
        return (
          <Card key={e.id}>
            {editId === e.id ? (
              <div>
                <Label>Date</Label>
                <Field type="date" value={editDate} onChange={(ev) => setEditDate(ev.target.value)} />
                <Label>Rubber</Label>
                <Select value={editRubberId} onChange={(ev) => setEditRubberId(ev.target.value)}>
                  {rubbers.map((rb) => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
                </Select>
                <Label>Customer Mobile No.</Label>
                <Field type="tel" value={editMobile} onChange={(ev) => setEditMobile(ev.target.value)} />
                <Label>Discount (₹)</Label>
                <Field type="number" value={editDiscount} onChange={(ev) => setEditDiscount(ev.target.value)} />
                <Label>Amount (Auto)</Label>
                <Field value={inr(editAmount)} disabled style={{ background: C.paperDark, color: C.ink, fontWeight: 700 }} />
                <Label>Stamp Name (text engraved on stamp)</Label>
                <Field value={editRemarks} onChange={(ev) => setEditRemarks(ev.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={saveEdit} disabled={editBusy} style={{ flex: 1, justifyContent: "center" }}>{editBusy ? "Saving…" : "Save"}</Btn>
                  <Btn variant="ghost" onClick={() => setEditId(null)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 56 }}>
                  <div style={{ fontWeight: 600, fontSize: 11.5, textAlign: "center", marginBottom: 4, lineHeight: 1.2 }}>{r?.name || "—"}</div>
                  {r?.photo_url ? (
                    <img src={r.photo_url} alt={r.name} style={{ width: 40, height: 40, borderRadius: 7, objectFit: "cover", border: `1px solid ${C.line}` }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 7, background: C.paperDark, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Stamp size={16} color={C.brass} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <div style={{ fontFamily: font.mono, fontSize: 11.5, color: C.inkSoft }}>{fmtDate(e.date)}</div>
                  <div style={{ fontFamily: font.mono, fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{e.mobile || "no mobile"}</div>
                  {e.remarks && <div style={{ fontFamily: font.body, fontSize: 12, color: C.ink, marginTop: 4, fontStyle: "italic" }}>"{e.remarks}"</div>}
                  {e.image_url ? (
                    <a href={e.image_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 6 }}>
                      <img src={e.image_url} alt="Stamp impression" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.line}` }} />
                    </a>
                  ) : (
                    <div style={{ fontFamily: font.mono, fontSize: 11, color: C.inkSoft, marginTop: 6 }}>No photo</div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: font.mono, fontWeight: 700, color: C.sage }}>+{inr(e.amount)}</div>
                  <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkSoft, marginTop: 2 }}>Bal: {inr(e.balanceAfter)}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => startEdit(e)} style={{ background: "none", border: "none", color: C.brass, cursor: "pointer" }}><PenSquare size={14} /></button>
                    <button onClick={() => removeEntry(e.id)} style={{ background: "none", border: "none", color: C.stamp, cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
      {display.length === 0 && <EmptyNote text={q ? "No matching entries." : "No entries yet."} />}
    </div>
  );
}


function StockTab({ rubbers, stockByRubber }) {
  return (
    <div>
      <SectionTitle icon={Package} title="Stock Report" />
      <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", overflowX: "auto", maxWidth: "100%", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: 340, borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Open</th>
              <th style={{ ...thStyle, textAlign: "right" }}>In</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Out</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Close</th>
            </tr>
          </thead>
          <tbody>
            {rubbers.map((r) => {
              const s = stockByRubber[r.id];
              const low = s.balance <= 15;
              return (
                <tr key={r.id}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {r.photo_url ? (
                        <img src={r.photo_url} alt={r.name} style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover", border: `1px solid ${C.line}`, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: C.paperDark, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Stamp size={12} color={C.brass} />
                        </div>
                      )}
                      <span style={{ fontFamily: font.body, fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{s.opening}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: C.sage }}>+{s.purchased}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: C.stamp }}>−{s.used}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: low ? C.stamp : C.ink }}>{low ? `${s.balance} ⚠` : s.balance}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const thStyle = { padding: "8px 6px", textAlign: "left", fontFamily: font.mono, fontSize: 9.5, letterSpacing: 0.5, textTransform: "uppercase", color: C.inkSoft, background: C.paperDark, borderBottom: `1px solid ${C.line}` };
const tdStyle = { padding: "8px 6px", fontFamily: font.mono, fontSize: 11.5, color: C.ink, borderBottom: `1px solid ${C.paperDark}`, overflow: "hidden" };
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
      <SectionTitle icon={TagIcon} title="Rate Master" />
      <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", overflowX: "auto", maxWidth: "100%", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: 260, borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "60%" }} />
            <col style={{ width: "40%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Rate (₹)</th>
            </tr>
          </thead>
          <tbody>
            {rubbers.map((r) => (
              <tr key={r.id}>
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {r.photo_url ? (
                      <img src={r.photo_url} alt={r.name} style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover", border: `1px solid ${C.line}`, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: C.paperDark, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Stamp size={12} color={C.brass} />
                      </div>
                    )}
                    <span style={{ fontFamily: font.body, fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {canEdit ? (
                    <input
                      type="number"
                      defaultValue={r.rate}
                      onBlur={(e) => update(r.id, e.target.value)}
                      style={{ width: "100%", maxWidth: 76, textAlign: "right", background: C.paperDark, border: `1px solid ${C.line}`, borderRadius: 6, padding: "6px 8px", fontFamily: font.mono, fontSize: 12.5, color: C.ink, opacity: busyId === r.id ? 0.5 : 1 }}
                    />
                  ) : (
                    <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 12.5 }}>{inr(r.rate)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft, textAlign: "center", marginTop: 8 }}>ⓘ rate changes apply to new entries only · tap outside the field to save</div>}
    </div>
  );
}

/* ================= RUBBER MASTER ================= */
function RubberTab({ rubbers, refresh }) {
  const [name, setName] = useState("");
  const [opening, setOpening] = useState(0);
  const [q, setQ] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editOpening, setEditOpening] = useState(0);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState(null);
  const [busy, setBusy] = useState(false);

  const startEdit = (r) => {
    setEditId(r.id);
    setEditName(r.name);
    setEditOpening(r.opening_stock);
    setEditPhotoPreview(r.photo_url || null);
    setEditPhotoUrl(r.photo_url || null);
    setEditPhotoFile(null);
  };
  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
  };
  const saveEdit = async () => {
    if (!editName.trim() || busy) return;
    setBusy(true);
    try {
      let photo_url = editPhotoUrl;
      if (editPhotoFile) photo_url = await uploadPhoto(editPhotoFile, "rubbers");
      await dbUpdate("rubbers", editId, { name: editName.trim(), opening_stock: Number(editOpening) || 0, photo_url });
      setEditId(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const add = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      let photo_url = null;
      if (photoFile) photo_url = await uploadPhoto(photoFile, "rubbers");
      await dbInsert("rubbers", { id: uid(), name: name.trim(), opening_stock: Number(opening) || 0, rate: 0, photo_url });
      setName(""); setOpening(0); setPhotoPreview(null); setPhotoFile(null);
      await refresh();
    } finally {
      setBusy(false);
    }
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
        <Label>Rubber Stamp Photo</Label>
        <label style={{ display: "block", border: `1px dashed ${C.brass}`, borderRadius: 8, padding: "16px", textAlign: "center", color: C.brass, fontSize: 13, marginBottom: 12, cursor: "pointer", overflow: "hidden" }}>
          {photoPreview ? (
            <img src={photoPreview} alt="Rubber stamp" style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 6 }} />
          ) : (
            "📷 Tap to capture / upload rubber stamp photo"
          )}
          <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhotoChange} />
        </label>
        <Btn onClick={add} disabled={busy} style={{ width: "100%", justifyContent: "center" }}><Plus size={16} /> {busy ? "Saving…" : "Add Rubber"}</Btn>
      </Card>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={15} style={{ position: "absolute", left: 10, top: 12, color: C.inkSoft }} />
        <Field placeholder="Search rubber name…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 32 }} />
      </div>
      {filtered.map((r) => (
        <Card key={r.id}>
          {editId === r.id ? (
            <div>
              <Label>Rubber Name</Label>
              <Field value={editName} onChange={(e) => setEditName(e.target.value)} />
              <Label>Opening Stock</Label>
              <Field type="number" value={editOpening} onChange={(e) => setEditOpening(e.target.value)} />
              <Label>Rubber Stamp Photo</Label>
              <label style={{ display: "block", border: `1px dashed ${C.brass}`, borderRadius: 8, padding: "16px", textAlign: "center", color: C.brass, fontSize: 13, marginBottom: 12, cursor: "pointer", overflow: "hidden" }}>
                {editPhotoPreview ? (
                  <img src={editPhotoPreview} alt="Rubber stamp" style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 6 }} />
                ) : (
                  "📷 Tap to capture / upload rubber stamp photo"
                )}
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleEditPhotoChange} />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={saveEdit} disabled={busy} style={{ flex: 1, justifyContent: "center" }}>{busy ? "Saving…" : "Save"}</Btn>
                <Btn variant="ghost" onClick={() => setEditId(null)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {r.photo_url ? (
                  <img src={r.photo_url} alt={r.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.line}` }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: C.paperDark, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Stamp size={18} color={C.brass} />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</div>
                  <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkSoft }}>Opening: {r.opening_stock}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => startEdit(r)} style={{ background: "none", border: "none", color: C.brass, cursor: "pointer" }}><PenSquare size={16} /></button>
                <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", color: C.stamp, cursor: "pointer" }}><Trash2 size={16} /></button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ================= PURCHASE ================= */
function PurchaseTab({ rubbers, purchases, refresh }) {
  const [date, setDate] = useState(todayISO());
  const [courier, setCourier] = useState(0);
  const [items, setItems] = useState([{ rubberId: rubbers[0]?.id || "", qty: 0, purchaseRate: 0 }]);
  const [busy, setBusy] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editRubberId, setEditRubberId] = useState("");
  const [editQty, setEditQty] = useState(0);
  const [editRate, setEditRate] = useState(0);
  const [editCourier, setEditCourier] = useState(0);
  const [editDate, setEditDate] = useState(todayISO());
  const [editBusy, setEditBusy] = useState(false);

  const addRow = () => setItems([...items, { rubberId: rubbers[0]?.id || "", qty: 0, purchaseRate: 0 }]);
  const removeRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateRow = (idx, patch) => setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const itemsAmount = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.purchaseRate || 0), 0);
  const total = itemsAmount + Number(courier || 0);

  const save = async () => {
    const validItems = items.filter((it) => it.rubberId && Number(it.qty) > 0);
    if (validItems.length === 0 || busy) return;
    setBusy(true);
    try {
      for (let i = 0; i < validItems.length; i++) {
        const it = validItems[i];
        const amount = Number(it.qty) * Number(it.purchaseRate || 0);
        const isLast = i === validItems.length - 1;
        const rowCourier = isLast ? Number(courier || 0) : 0;
        await dbInsert("purchases", {
          id: uid(), date, rubber_id: it.rubberId, qty: Number(it.qty),
          purchase_rate: Number(it.purchaseRate || 0), amount,
          courier: rowCourier, total: amount + rowCourier,
        });
      }
      setItems([{ rubberId: rubbers[0]?.id || "", qty: 0, purchaseRate: 0 }]);
      setCourier(0);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setEditRubberId(p.rubber_id);
    setEditQty(p.qty);
    setEditRate(p.purchase_rate);
    setEditCourier(p.courier || 0);
    setEditDate(p.date);
  };
  const saveEdit = async () => {
    if (!editRubberId || !editQty || editBusy) return;
    setEditBusy(true);
    try {
      const amount = Number(editQty) * Number(editRate || 0);
      await dbUpdate("purchases", editId, {
        date: editDate, rubber_id: editRubberId, qty: Number(editQty),
        purchase_rate: Number(editRate || 0), amount,
        courier: Number(editCourier || 0), total: amount + Number(editCourier || 0),
      });
      setEditId(null);
      await refresh();
    } finally {
      setEditBusy(false);
    }
  };
  const removePurchase = async (id) => { await dbDelete("purchases", id); await refresh(); };

  const purchasesChronological = [...purchases].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningSpend = 0;
  const purchasesWithBalance = purchasesChronological.map((p) => {
    runningSpend += Number(p.total);
    return { ...p, runningTotal: runningSpend };
  });
  const purchasesDisplay = [...purchasesWithBalance].reverse();

  const exportCSV = () => {
    const rows = purchasesDisplay.map((p) => {
      const r = rubbers.find((r) => r.id === p.rubber_id);
      return {
        Date: fmtDate(p.date),
        "Rubber Name": r?.name || "",
        Qty: p.qty,
        "Purchase Rate": p.purchase_rate,
        Courier: p.courier,
        Total: p.total,
        "Running Total": p.runningTotal,
      };
    });
    exportToCSV(`purchases-${todayISO()}.csv`, rows);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionTitle icon={ShoppingCart} title="Purchase Entry" />
        <Btn variant="ghost" onClick={exportCSV} style={{ padding: "6px 10px", fontSize: 11.5 }}><Download size={13} /> Export</Btn>
      </div>
      <Card>
        <Label>Date</Label>
        <Field type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        {items.map((it, idx) => {
          const rowAmount = Number(it.qty || 0) * Number(it.purchaseRate || 0);
          return (
            <div key={idx} style={{ border: `1px dashed ${C.line}`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <Label>Item {idx + 1}</Label>
                {items.length > 1 && (
                  <button onClick={() => removeRow(idx)} style={{ background: "none", border: "none", color: C.stamp, cursor: "pointer" }}><Trash2 size={14} /></button>
                )}
              </div>
              <Select value={it.rubberId} onChange={(e) => updateRow(idx, { rubberId: e.target.value })}>
                {rubbers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Label>Quantity</Label>
                  <Field type="number" value={it.qty} onChange={(e) => updateRow(idx, { qty: e.target.value })} style={{ marginBottom: 0 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Rate (₹)</Label>
                  <Field type="number" value={it.purchaseRate} onChange={(e) => updateRow(idx, { purchaseRate: e.target.value })} style={{ marginBottom: 0 }} />
                </div>
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 11.5, color: C.inkSoft, marginTop: 6, textAlign: "right" }}>Amount: {inr(rowAmount)}</div>
            </div>
          );
        })}

        <Btn variant="ghost" onClick={addRow} style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}><Plus size={16} /> Add Another Item</Btn>

        <Label>Courier Charge (₹)</Label>
        <Field type="number" value={courier} onChange={(e) => setCourier(e.target.value)} />
        <Label>Total Amount (Auto)</Label>
        <Field value={inr(total)} disabled style={{ background: C.paperDark, color: C.ink, fontWeight: 700 }} />
        <Btn onClick={save} disabled={busy} style={{ width: "100%", justifyContent: "center" }}><Plus size={16} /> {busy ? "Saving…" : "Save Purchase"}</Btn>
      </Card>
      <Label>Recent Purchases</Label>
      {purchasesDisplay.slice(0, 15).map((p) => {
        const r = rubbers.find((r) => r.id === p.rubber_id);
        return (
          <Card key={p.id}>
            {editId === p.id ? (
              <div>
                <Label>Date</Label>
                <Field type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                <Label>Rubber</Label>
                <Select value={editRubberId} onChange={(e) => setEditRubberId(e.target.value)}>
                  {rubbers.map((rb) => <option key={rb.id} value={rb.id}>{rb.name}</option>)}
                </Select>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Label>Quantity</Label>
                    <Field type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} style={{ marginBottom: 0 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label>Rate (₹)</Label>
                    <Field type="number" value={editRate} onChange={(e) => setEditRate(e.target.value)} style={{ marginBottom: 0 }} />
                  </div>
                </div>
                <Label style={{ marginTop: 12 }}>Courier (₹)</Label>
                <Field type="number" value={editCourier} onChange={(e) => setEditCourier(e.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={saveEdit} disabled={editBusy} style={{ flex: 1, justifyContent: "center" }}>{editBusy ? "Saving…" : "Save"}</Btn>
                  <Btn variant="ghost" onClick={() => setEditId(null)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r?.name} · Qty {p.qty}</div>
                  <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft }}>{fmtDate(p.date)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: font.mono, fontWeight: 700, color: C.stamp }}>−{inr(p.total)}</div>
                    <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkSoft, marginTop: 2 }}>Total: {inr(p.runningTotal)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => startEdit(p)} style={{ background: "none", border: "none", color: C.brass, cursor: "pointer" }}><PenSquare size={15} /></button>
                    <button onClick={() => removePurchase(p.id)} style={{ background: "none", border: "none", color: C.stamp, cursor: "pointer" }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
      {purchases.length === 0 && <EmptyNote text="No purchases recorded yet." />}
    </div>
  );
}

/* ================= CASH LEDGER ================= */
function LedgerTab({ purchases, entries, cashManual, rubbers, refresh }) {
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

  const txnsChronological = [
  ...entries.map((e) => {
    const r = rubbers.find((r) => r.id === e.rubber_id);
    return { id: e.id, date: e.date, label: `${r?.name || "Unknown Item"} - Sale`, type: "in", amount: e.amount };
  }),
  ...purchases.map((p) => {
    const r = rubbers.find((r) => r.id === p.rubber_id);
    return { id: p.id, date: p.date, label: `${r?.name || "Unknown Item"} - Purchase${p.courier ? " + Courier" : ""}`, type: "out", amount: p.total };
  }),
  ...cashManual.map((c) => ({ id: c.id, date: c.date, label: c.category, type: c.type, amount: c.amount })),
].sort((a, b) => new Date(a.date) - new Date(b.date));

let runningTotal = 0;
  const txnsWithBalance = txnsChronological.map((t) => {
  runningTotal += t.type === "in" ? Number(t.amount) : -Number(t.amount);
  return { ...t, balanceAfter: runningTotal };
});

  const txns = [...txnsWithBalance].reverse();

  const addManual = async () => {
    if (!amount) return;
    await dbInsert("cash_manual", { id: uid(), date: todayISO(), type, category, amount: Number(amount), note });
    setAmount(0); setNote(""); await refresh();
  };

  const exportCSV = () => {
    const rows = txns.map((t) => ({
      Date: fmtDate(t.date),
      Description: t.label,
      Type: t.type === "in" ? "Cash In" : "Cash Out",
      Amount: t.amount,
      Balance: t.balanceAfter,
    }));
    exportToCSV(`cash-ledger-${todayISO()}.csv`, rows);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionTitle icon={Wallet} title="Cash Ledger" />
        <Btn variant="ghost" onClick={exportCSV} style={{ padding: "6px 10px", fontSize: 11.5 }}><Download size={13} /> Export</Btn>
      </div>
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
{(() => {
  const shown = txns.slice(0, 30);
  const groups = [];
  shown.forEach((t) => {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  });
  return groups.map((g) => (
    <div key={g.date}>
      <div style={{ fontFamily: font.mono, fontSize: 10.5, fontWeight: 700, color: C.brass, textTransform: "uppercase", letterSpacing: 1, margin: "16px 0 6px" }}>{fmtDate(g.date)}</div>
      {g.items.map((t) => (
        <Card key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: font.mono, fontWeight: 700, color: t.type === "in" ? C.sage : C.stamp }}>{t.type === "in" ? "+" : "−"}{inr(t.amount)}</div>
            <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkSoft, marginTop: 2 }}>Bal: {inr(t.balanceAfter)}</div>
          </div>
        </Card>
      ))}
    </div>
  ));
})()}
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
