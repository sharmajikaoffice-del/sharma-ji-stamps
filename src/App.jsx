import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LogOut, Plus, Search, Trash2, RotateCcw,
  Stamp, Package, Tag as TagIcon, ShoppingCart, PenSquare, Wallet, Users, BookOpen, Download,
  Wand2, ChevronLeft, ChevronRight, Circle, Image as ImageIcon, Type, CircleDot, X
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

/* ---------- stamp canvas helpers ---------- */
function drawArcText(ctx, text, cx, cy, radius, startAngle, direction, letterSpacing) {
  // direction: 1 = clockwise (top text), -1 = counter-clockwise (bottom text, reads upright)
  if (!text) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(startAngle);

  const chars = text.split("");
  let angle = 0;
  const angles = chars.map((ch) => {
    const w = ctx.measureText(ch).width + letterSpacing;
    const a = w / radius;
    angle += a;
    return a;
  });
  const totalAngle = angle;

  ctx.rotate((-totalAngle / 2) * direction);

  chars.forEach((ch, i) => {
    const a = angles[i];
    ctx.rotate((a / 2) * direction);
    ctx.save();
    ctx.translate(0, -radius * direction);
    ctx.rotate(direction === 1 ? 0 : Math.PI);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    ctx.rotate((a / 2) * direction);
  });

  ctx.restore();
}

function addInkTexture(ctx, w, h, color, seed) {
  // subtle worn-ink speckle so the stamp reads as pressed ink, not a flat vector
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = color;
  for (let i = 0; i < 260; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = rand() * 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const STAMP_INK_BLUE = "#2158A6";
const STAMP_CANVAS_SIZE = 320;
const STAMP_SHAPES = [
  { id: "circle", label: "Round" },
  { id: "rectangle", label: "Rectangle" },
  { id: "square", label: "Square" },
];

/* Shared stamp renderer — used by both the live editor canvas and the
   small template-picker thumbnails, so the drawing logic lives in one place. */
function drawStampOnCanvas(canvas, cfg, displaySize = STAMP_CANVAS_SIZE) {
  if (!canvas) return;
  const { shape, topText = "", bottomText = "", centerLine1 = "", centerLine2 = "", rectLine1 = "", rectLine2 = "", rectLine3 = "", inkColor = STAMP_INK_BLUE, borderStyle = "double", texture = true, logo = null, radius = 138, strokeWidth = 3, letterSpacing = 2.5, layers = [] } = cfg;
  const dpr = window.devicePixelRatio || 1;
  const size = STAMP_CANVAS_SIZE;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  // Display size is controlled purely via CSS (width + aspect-ratio) on the
  // <canvas> element itself, so it never gets stretched into an oval when the
  // container is narrower than the canvas — see the JSX below.
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  ctx.strokeStyle = inkColor;
  ctx.fillStyle = inkColor;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (shape === "circle") {
    const outerR = radius;
    const innerR = borderStyle === "double" ? outerR - 16 : outerR;
    const textR = outerR - 25;
    const scale = outerR / 138;
    const hasFrameLayers = layers.some((l) => l.type === "frame");

    // When the two circles are represented by separate Frame layers, let those
    // layers own the rings. This prevents the old built-in double border from
    // being drawn a second time and makes each ring independently editable.
    if (!hasFrameLayers) {
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.stroke();

      if (borderStyle === "double") {
        ctx.lineWidth = strokeWidth * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.stroke();
      } else if (borderStyle === "dashed") {
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = strokeWidth * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR - 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.font = "600 12px Georgia, 'Times New Roman', serif";
    drawArcText(ctx, topText.toUpperCase(), cx, cy, textR, -Math.PI / 2, 1, letterSpacing);
    drawArcText(ctx, bottomText.toUpperCase(), cx, cy, textR, Math.PI / 2, -1, letterSpacing);

    if (logo) {
      const logoSize = 44;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(logo, cx - logoSize / 2, cy - 54 * scale, logoSize, logoSize);
      ctx.restore();
    }

    ctx.font = "700 16px Georgia, 'Times New Roman', serif";
    ctx.fillText(centerLine1.toUpperCase(), cx, logo ? cy + 4 : cy - 4);
    if (centerLine2) {
      ctx.font = "400 11px Georgia, 'Times New Roman', serif";
      ctx.fillText(centerLine2.toUpperCase(), cx, cy + (logo ? 24 : 16));
    }

    ctx.font = "12px Georgia, serif";
    ctx.fillText("★", cx - 54 * scale, cy - (logo ? -4 : 4));
    ctx.fillText("★", cx + 54 * scale, cy - (logo ? -4 : 4));
  } else {
    const w = 260;
    const h = shape === "square" ? 200 : 170;
    const x = cx - w / 2;
    const y = cy - h / 2;

    ctx.lineWidth = strokeWidth;
    if (borderStyle === "dashed") ctx.setLineDash([6, 5]);
    ctx.strokeRect(x, y, w, h);
    if (borderStyle === "double") {
      ctx.lineWidth = strokeWidth * 0.5;
      ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
    }
    ctx.setLineDash([]);

    let cursorY = y + 42;
    if (logo) {
      const logoSize = 36;
      ctx.drawImage(logo, cx - logoSize / 2, cursorY - logoSize / 2, logoSize, logoSize);
      cursorY += logoSize / 2 + 20;
    }

    ctx.font = "700 16px Georgia, 'Times New Roman', serif";
    ctx.fillText(rectLine1.toUpperCase(), cx, cursorY);
    cursorY += 22;

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 22, cursorY - 9);
    ctx.lineTo(x + w - 22, cursorY - 9);
    ctx.stroke();

    ctx.font = "400 11px Georgia, 'Times New Roman', serif";
    ctx.fillText(rectLine2, cx, cursorY + 4);
    cursorY += 20;

    ctx.font = "italic 400 10px Georgia, 'Times New Roman', serif";
    ctx.fillText(rectLine3.toUpperCase(), cx, cursorY + 4);
  }

  if (texture) addInkTexture(ctx, size, size, inkColor, 42);

  // Extra layers added from the toolbar — drawn on top, using percentage
  // positions so they scale with the canvas.
  layers.forEach((layer) => {
    const lx = ((layer.x ?? 50) / 100) * size;
    const ly = ((layer.y ?? 50) / 100) * size;
    const rot = ((layer.rotation ?? 0) * Math.PI) / 180;
    ctx.fillStyle = inkColor;
    ctx.strokeStyle = inkColor;
    if (layer.type === "circleText") {
      ctx.save();
      ctx.translate(cx, cy);
      if (layer.flipX) ctx.scale(-1, 1);
      ctx.translate(-cx, -cy);
      const weight = layer.bold ? 700 : 400;
      const family = layer.fontFamily || "Arial";
      const size = layer.fontSize ?? 13;
      ctx.font = `${weight} ${size}px ${family}`;
      const startAngle = (((layer.start ?? 90) - 90) * Math.PI) / 180;
      drawArcText(ctx, (layer.text || "").toUpperCase(), cx, cy, layer.radius ?? 130, startAngle, 1, layer.spacing ?? 4);
      ctx.restore();
    } else if (layer.type === "centerText") {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const weight = layer.bold ? 700 : 400;
      const family = layer.fontFamily || "Arial";
      ctx.font = `${weight} ${layer.fontSize ?? layer.size ?? 16}px ${family}`;
      if (layer.flipX) ctx.scale(-1, 1);
      ctx.fillText(layer.text || "", 0, 0);
      ctx.restore();
    } else if (layer.type === "frame") {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const r = Math.min(size * 0.48, layer.radius ?? 100);
      const sw = layer.strokeWidth ?? 4;
      const gap = Math.max(0, layer.lineBreak ?? 0);
      ctx.lineWidth = sw;
      // Line break now affects the actual circle stroke: it creates visible
      // breaks in this Frame instead of incorrectly drawing a second dashed ring.
      if (gap > 0) {
        ctx.setLineDash([Math.max(2, gap * 1.6), Math.max(2, gap * 1.2)]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (layer.type === "image" && layer.imageObj) {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const isz = ((layer.size ?? 15) / 100) * size;
      ctx.drawImage(layer.imageObj, -isz / 2, -isz / 2, isz, isz);
      ctx.restore();
    }
  });
}

/* Slider row with prev/next step arrows — matches the "Radius / Stroke width / Line break" controls. */
function SliderControl({ label, value, min, max, step = 0.1, onChange }) {
  const fmt = (n) => (Math.round(n * 10) / 10).toString();
  const clamp = (n) => Math.min(max, Math.max(min, n));
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: font.body, fontSize: 13, color: C.ink, marginBottom: 6 }}>
        {label} <span style={{ color: C.brass, fontFamily: font.mono, fontSize: 12 }}>[ {fmt(value)} ]</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => onChange(clamp(value - step * 5))}
          style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${C.line}`, background: C.white, color: C.inkSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}
        >
          <ChevronLeft size={14} />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: STAMP_INK_BLUE, cursor: "pointer" }}
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step * 5))}
          style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${C.line}`, background: C.white, color: C.inkSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* Small outline icon used in the shape picker (Round / Rectangle / Square). */
function ShapeIcon({ shape }) {
  const base = { border: "2px solid currentColor", background: "transparent", boxSizing: "border-box" };
  if (shape === "circle") return <div style={{ ...base, width: 22, height: 22, borderRadius: "50%" }} />;
  if (shape === "square") return <div style={{ ...base, width: 20, height: 20, borderRadius: 4 }} />;
  return <div style={{ ...base, width: 28, height: 16, borderRadius: 4 }} />;
}

/* Small live-rendered preview used in the template picker grid. */
function TemplateThumb({ config, size = 140 }) {
  const ref = useRef(null);
  const [logoImg, setLogoImg] = useState(null);
  useEffect(() => {
    if (!config.logoDataUrl) { setLogoImg(null); return; }
    const img = new Image();
    img.onload = () => setLogoImg(img);
    img.src = config.logoDataUrl;
  }, [config.logoDataUrl]);
  useEffect(() => {
    drawStampOnCanvas(ref.current, { ...config, inkColor: config.inkColor || STAMP_INK_BLUE, logo: logoImg }, size);
  }, [config, logoImg, size]);
  return <canvas ref={ref} style={{ width: size, maxWidth: "100%", height: "auto", aspectRatio: "1 / 1", display: "block" }} />;
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
  // Global reset — without box-sizing:border-box, elements with width:100% plus
  // padding (Field, Select, Card, etc.) render wider than their parent, which was
  // pushing content past the right edge of the screen and getting clipped.
  useEffect(() => {
    if (document.getElementById("sjs-reset")) return;
    const style = document.createElement("style");
    style.id = "sjs-reset";
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; max-width: 100%; overflow-x: hidden; background: ${C.paper}; }
      #root { max-width: 100%; min-height: 100vh; overflow-x: hidden; background: ${C.paper}; }
    `;
    document.head.appendChild(style);
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

  // Keyboard support so desktop users can type their PIN, not just click with the mouse.
  useEffect(() => {
    const onKeyDown = (ev) => {
      if (!selected) return;
      if (ev.key >= "0" && ev.key <= "9") { press(ev.key); return; }
      if (ev.key === "Backspace") { press("back"); return; }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

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

/* ---------- responsive helper ---------- */
function useIsDesktop(breakpoint = 900) {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= breakpoint);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isDesktop;
}
const SIDEBAR_W = 236;

/* ================= APP SHELL ================= */
const TABS_ADMIN = [
  { id: "entry", label: "Stamp Entry", icon: PenSquare },
  { id: "create", label: "Create Stamp", icon: Wand2 },
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
  { id: "create", label: "Create Stamp", icon: Wand2 },
  { id: "register", label: "Register", icon: BookOpen },
  { id: "stock", label: "Stock", icon: Package },
  { id: "rate", label: "Rates", icon: TagIcon },
  { id: "ledger", label: "Cash", icon: Wallet },
  
];

export default function SharmaJiStamps() {
  useFonts();
  const isDesktop = useIsDesktop();
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("sjs_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const login = (u) => {
    setUser(u);
    try { localStorage.setItem("sjs_user", JSON.stringify(u)); } catch {}
  };
  const logout = () => {
    setUser(null);
    try { localStorage.removeItem("sjs_user"); } catch {}
  };
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

  if (!user) return <Login users={users} onLogin={login} />;
  const tabs = user.role === "admin" ? TABS_ADMIN : TABS_STAFF;

  const tabContent = (
    <>
      {tab === "entry" && <StampEntryTab rubbers={rubbers} entries={entries} refresh={refreshAll} user={user} />}
      {tab === "create" && <CreateStampTab />}
      {tab === "register" && <StampRegisterTab entries={entries} rubbers={rubbers} refresh={refreshAll} />}
      {tab === "stock" && <StockTab rubbers={rubbers} stockByRubber={stockByRubber} />}
      {tab === "rate" && <RateTab rubbers={rubbers} refresh={refreshAll} canEdit={user.role === "admin"} />}
      {tab === "rubber" && user.role === "admin" && <RubberTab rubbers={rubbers} refresh={refreshAll} />}
      {tab === "purchase" && user.role === "admin" && <PurchaseTab rubbers={rubbers} purchases={purchases} refresh={refreshAll} />}
      {tab === "ledger" && <LedgerTab purchases={purchases} entries={entries} cashManual={cashManual} rubbers={rubbers} refresh={refreshAll} />}
      {tab === "users" && user.role === "admin" && <UsersTab users={users} refresh={refreshAll} currentUser={user} />}
    </>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink, overflowX: "hidden" }}>
        {/* ---- desktop sidebar ---- */}
        <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, width: SIDEBAR_W, background: C.headerGreen, color: C.white, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: "22px 18px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
            <StampMark size={32} />
            <div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, lineHeight: 1.15 }}>Sharma Ji Stamps</div>
              <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: 1, color: "#C9BC9C", marginTop: 3 }}>{user.name.toUpperCase()} · {user.role.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {tabs.map((t) => {
              const Icon = t.icon; const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: active ? "rgba(255,255,255,0.14)" : "none", border: "none", borderRadius: 8, padding: "10px 12px", cursor: "pointer", color: active ? C.white : "#C9D6CE", fontFamily: font.body, fontSize: 13.5, textAlign: "left" }}>
                  <Icon size={17} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <button onClick={logout} style={{ margin: 14, background: "none", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 8, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: font.body, fontSize: 12.5, padding: "9px 0" }}><LogOut size={15} /> Logout</button>
        </div>

        {/* ---- desktop content ---- */}
        <div style={{ marginLeft: SIDEBAR_W, minHeight: "100vh" }}>
          <div style={{ padding: "32px 44px 48px", maxWidth: 1140, width: "100%", margin: "0 auto" }}>
            {tabContent}
          </div>
        </div>
      </div>
    );
  }

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
        <button onClick={logout} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: font.body, fontSize: 12 }}><LogOut size={16} /> Logout</button>
      </div>

      <div style={{ flex: 1, padding: "16px 16px 90px", maxWidth: 760, width: "100%", margin: "0 auto" }}>
        {tabContent}
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

  const isDesktop = useIsDesktop();

  const recentList = entries.slice(0, 8).map((e) => {
    const r = rubbers.find((r) => r.id === e.rubber_id);
    return (
      <Card key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r?.name || "—"}</div>
          <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtDate(e.date)} · {e.mobile || "no mobile"}</div>
        </div>
        <div style={{ fontFamily: font.mono, fontWeight: 700, color: C.sage, flexShrink: 0 }}>+{inr(e.amount)}</div>
      </Card>
    );
  });

  return (
    <div>
      <SectionTitle icon={PenSquare} title="Make Stamp Entry" />
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexDirection: isDesktop ? "row" : "column" }}>
        <div style={{ width: isDesktop ? 420 : "100%", flexShrink: 0 }}>
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
        </div>
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Label>Recent Entries</Label>
          {isDesktop ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>{recentList}</div>
          ) : recentList}
          {entries.length === 0 && <EmptyNote text="No entries yet." />}
        </div>
      </div>
    </div>
  );
}

/* ================= CREATE STAMP ================= */
function CreateStampTab() {
  const isDesktop = useIsDesktop();
  const canvasRef = useRef(null);
  const logoInputRef = useRef(null);
  const [view, setView] = useState("templates"); // "templates" | "editor"
  const [pickShape, setPickShape] = useState("circle");

  const [shape, setShape] = useState("circle");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [centerLine1, setCenterLine1] = useState("");
  const [centerLine2, setCenterLine2] = useState("");
  const [rectLine1, setRectLine1] = useState("");
  const [rectLine2, setRectLine2] = useState("");
  const [rectLine3, setRectLine3] = useState("");
  const [borderStyle, setBorderStyle] = useState("double");
  const [texture, setTexture] = useState(true);
  const [radius, setRadius] = useState(138);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [letterSpacing, setLetterSpacing] = useState(2.5);
  const [logo, setLogo] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  // Extra layers added from the toolbar (Text around the circle / Text in the
  // centre / Circle / Images) — each becomes its own tab, like the reference editor.
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [layerCounter, setLayerCounter] = useState(0);
  const layerImageInputRef = useRef(null);

  const LAYER_TYPE_NAMES = { circleText: "Circle txt", centerText: "Text", frame: "Frame", image: "Image" };
  const layerLabel = (l) => `${LAYER_TYPE_NAMES[l.type]} #${l.num}`;

  const addLayer = (type) => {
    const num = layerCounter + 1;
    setLayerCounter(num);
    const id = uid();
    let layer = { id, type, num };
    if (type === "circleText") layer = { ...layer, text: "NEW TEXT", radius: 130, spacing: 4, start: 90, fontFamily: "Arial", fontSize: 13, bold: false, flipX: false };
    else if (type === "centerText") layer = { ...layer, text: "New text", size: 16, fontFamily: "Arial", fontSize: 16, bold: false, flipX: false, x: 50, y: 50, rotation: 0 };
    else if (type === "frame") layer = { ...layer, radius: 100, strokeWidth: 4, lineBreak: 0, x: 50, y: 50, rotation: 0 };
    else if (type === "image") layer = { ...layer, size: 15, x: 50, y: 68, rotation: 0, imageDataUrl: null, imageObj: null };
    setLayers((ls) => [...ls, layer]);
    setActiveLayerId(id);
  };

  const updateLayer = (id, patch) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const removeLayer = (id) => {
    setLayers((ls) => {
      const next = ls.filter((l) => l.id !== id);
      if (activeLayerId === id) setActiveLayerId(next.length ? next[next.length - 1].id : null);
      return next;
    });
  };

  const activeLayer = layers.find((l) => l.id === activeLayerId) || null;

  const handleLayerImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeLayer) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => updateLayer(activeLayer.id, { imageObj: img, imageDataUrl: ev.target.result });
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "saved", "error"

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const rows = await dbGet("stamp_templates");
      setTemplates(rows);
      setTemplatesError("");
    } catch {
      setTemplatesError("Couldn't load saved templates — run the stamp_templates SQL in Supabase first.");
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => setLogo(img);
      img.src = ev.target.result;
      setLogoDataUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const buildConfig = () => ({
    shape, topText, bottomText, centerLine1, centerLine2,
    rectLine1, rectLine2, rectLine3, inkColor: STAMP_INK_BLUE, borderStyle, texture, logoDataUrl,
    radius, strokeWidth, letterSpacing,
    layers: layers.map(({ imageObj, ...l }) => l),
  });

  const resetDesign = (initialShape) => {
    setShape(initialShape);
    setTopText("");
    setBottomText("");
    setCenterLine1("");
    setCenterLine2("");
    setRectLine1("");
    setRectLine2("");
    setRectLine3("");
    setBorderStyle("double");
    setTexture(true);
    setRadius(138);
    setStrokeWidth(3);
    setLetterSpacing(2.5);
    setLogo(null);
    setLogoDataUrl(null);
    setFileName("");
    setTemplateName("");
    setEditingTemplateId(null);
    setLayers([]);
    setActiveLayerId(null);
  };

  const startNew = () => {
    resetDesign(pickShape);
    if (pickShape === "circle") {
      const firstId = uid();
      const secondId = uid();
      setLayers([
        { id: firstId, type: "frame", num: 1, radius: 138, strokeWidth: 3, lineBreak: 0, x: 50, y: 50, rotation: 0 },
        { id: secondId, type: "frame", num: 2, radius: 122, strokeWidth: 1.5, lineBreak: 0, x: 50, y: 50, rotation: 0 },
      ]);
      setActiveLayerId(firstId);
      setLayerCounter(2);
    }
    setView("editor");
  };

  const openTemplate = (t) => {
    const config = t.config || {};
    setShape(config.shape ?? "circle");
    setTopText(config.topText ?? "");
    setBottomText(config.bottomText ?? "");
    setCenterLine1(config.centerLine1 ?? "");
    setCenterLine2(config.centerLine2 ?? "");
    setRectLine1(config.rectLine1 ?? "");
    setRectLine2(config.rectLine2 ?? "");
    setRectLine3(config.rectLine3 ?? "");
    setBorderStyle(config.borderStyle ?? "double");
    setTexture(config.texture ?? true);
    setRadius(config.radius ?? 138);
    setStrokeWidth(config.strokeWidth ?? 3);
    setLetterSpacing(config.letterSpacing ?? 2.5);
    if (config.logoDataUrl) {
      const img = new Image();
      img.onload = () => setLogo(img);
      img.src = config.logoDataUrl;
      setLogoDataUrl(config.logoDataUrl);
      setFileName("saved logo");
    } else {
      setLogo(null);
      setLogoDataUrl(null);
      setFileName("");
    }
    setTemplateName(t.name);
    setEditingTemplateId(t.id);
    setSaveStatus("");

    // Normalize preloaded/saved template items so every item has a stable id + number
    // and can be selected/edited individually after the template is opened.
    const rawLayers = Array.isArray(config.layers) ? config.layers : [];
    const normalizedRaw = [...rawLayers];
    const hasFrameLayer = normalizedRaw.some((l) => l.type === "frame");
    // Legacy circle templates used borderStyle="double" instead of two Frame
    // layers. Convert those two visible rings into separate editable Frames.
    if (config.shape === "circle" && config.borderStyle === "double" && !hasFrameLayer) {
      const baseRadius = config.radius ?? 138;
      const baseStroke = config.strokeWidth ?? 3;
      normalizedRaw.push(
        { type: "frame", radius: baseRadius, strokeWidth: baseStroke, lineBreak: 0, x: 50, y: 50, rotation: 0 },
        { type: "frame", radius: Math.max(20, baseRadius - 16), strokeWidth: baseStroke * 0.5, lineBreak: 0, x: 50, y: 50, rotation: 0 }
      );
    }
    const savedLayers = normalizedRaw.map((l, index) => ({
      ...l,
      id: l.id || uid(),
      num: l.num || index + 1,
    }));
    setLayers(savedLayers);
    setActiveLayerId(savedLayers.length ? savedLayers[0].id : null);
    setLayerCounter(savedLayers.reduce((max, l) => Math.max(max, l.num || 0), 0));
    savedLayers.forEach((l) => {
      if (l.type === "image" && l.imageDataUrl) {
        const img = new Image();
        img.onload = () => updateLayer(l.id, { imageObj: img });
        img.src = l.imageDataUrl;
      }
    });

    setView("editor");
  };

  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    if (!name || saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      if (editingTemplateId) {
        await dbUpdate("stamp_templates", editingTemplateId, { name, config: buildConfig() });
      } else {
        const [saved] = await dbInsert("stamp_templates", { id: uid(), name, config: buildConfig() });
        if (saved?.id) setEditingTemplateId(saved.id);
      }
      setSaveStatus("saved");
      await loadTemplates();
      setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation();
    await dbDelete("stamp_templates", id);
    if (editingTemplateId === id) { setEditingTemplateId(null); }
    await loadTemplates();
  };

  useEffect(() => {
    drawStampOnCanvas(canvasRef.current, {
      shape, topText, bottomText, centerLine1, centerLine2,
      rectLine1, rectLine2, rectLine3, inkColor: STAMP_INK_BLUE, borderStyle, texture, logo,
      radius, strokeWidth, letterSpacing, layers,
    });
  }, [shape, topText, bottomText, centerLine1, centerLine2, rectLine1, rectLine2, rectLine3, borderStyle, texture, logo, radius, strokeWidth, letterSpacing, layers]);

  // Click any item directly on the stamp to make it the active/editable item.
  // Preloaded template layers use the same hit-testing as newly added layers.
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !layers.length) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * STAMP_CANVAS_SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * STAMP_CANVAS_SIZE;
    const cx = STAMP_CANVAS_SIZE / 2;
    const cy = STAMP_CANVAS_SIZE / 2;
    const distance = (x, y) => Math.hypot(px - x, py - y);

    const candidates = layers.map((layer, index) => {
      let score = Infinity;

      if (layer.type === "circleText") {
        const r = Math.hypot(px - cx, py - cy);
        const textRadius = layer.radius ?? 130;
        const text = layer.text || "";
        const chars = Math.max(1, text.length);
        const spacing = layer.spacing ?? 4;
        const arc = Math.max(0.16, (chars * (7 + spacing)) / textRadius);
        const start = (((layer.start ?? 90) - 90) * Math.PI) / 180;
        const pointerAngle = Math.atan2(py - cy, px - cx);
        const diff = Math.atan2(
          Math.sin(pointerAngle - start),
          Math.cos(pointerAngle - start)
        );
        // Give curved text a generous clickable arc so old/preloaded templates
        // remain editable even when their exact character positions differ.
        if (Math.abs(r - textRadius) <= 30 && Math.abs(diff) <= Math.max(arc / 2, 0.45)) {
          score = Math.abs(r - textRadius) + Math.abs(diff) * textRadius * 0.15;
        }
      } else if (layer.type === "frame") {
        // Frames are rings, so their clickable area is around the actual radius,
        // not at x/y=50% (which previously made preloaded frames hard to select).
        const frameRadius = layer.radius ?? 100;
        const r = Math.hypot(px - cx, py - cy);
        const tolerance = Math.max(18, (layer.strokeWidth ?? 4) * 2.5 + 10);
        if (Math.abs(r - frameRadius) <= tolerance) {
          score = Math.abs(r - frameRadius);
        }
      } else if (layer.type === "centerText") {
        const lx = ((layer.x ?? 50) / 100) * STAMP_CANVAS_SIZE;
        const ly = ((layer.y ?? 50) / 100) * STAMP_CANVAS_SIZE;
        const size = ((layer.fontSize ?? layer.size ?? 16) / 100) * STAMP_CANVAS_SIZE;
        const hitRadius = Math.max(28, size * 2.2);
        const d = distance(lx, ly);
        if (d <= hitRadius) score = d;
      } else if (layer.type === "image") {
        const lx = ((layer.x ?? 50) / 100) * STAMP_CANVAS_SIZE;
        const ly = ((layer.y ?? 50) / 100) * STAMP_CANVAS_SIZE;
        const size = ((layer.size ?? 15) / 100) * STAMP_CANVAS_SIZE;
        const hitRadius = Math.max(28, size * 0.8);
        const d = distance(lx, ly);
        if (d <= hitRadius) score = d;
      }

      // Later layers are drawn on top, so prefer the topmost matching layer.
      if (Number.isFinite(score)) score += (layers.length - index) * 0.001;
      return { layer, score };
    }).filter((x) => Number.isFinite(x.score)).sort((a, b) => a.score - b.score);

    if (candidates[0]) setActiveLayerId(candidates[0].layer.id);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "stamp.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ---------------- STEP 1: pick a shape / pick a saved template ---------------- */
  if (view === "templates") {
    return (
      <div>
        <SectionTitle icon={Wand2} title="Create Stamp" />
        <Card style={{ padding: 14 }}>
          <Label>Choose a shape to start</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {STAMP_SHAPES.map((s) => {
              const active = pickShape === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPickShape(s.id)}
                  style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "14px 6px", borderRadius: 10, cursor: "pointer", fontFamily: font.body,
                    background: active ? "#E9F0FB" : C.white,
                    border: `2px solid ${active ? STAMP_INK_BLUE : C.line}`,
                    color: active ? STAMP_INK_BLUE : C.ink,
                  }}
                >
                  <ShapeIcon shape={s.id} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                </button>
              );
            })}
          </div>
          <Btn onClick={startNew} style={{ width: "100%", justifyContent: "center", marginTop: 14, background: STAMP_INK_BLUE }}>
            <Plus size={16} /> New Stamp
          </Btn>
        </Card>

        <Label>My Templates</Label>
        {templatesLoading && <EmptyNote text="Loading…" />}
        {templatesError && <EmptyNote text={templatesError} />}
        {!templatesLoading && !templatesError && templates.length === 0 && (
          <EmptyNote text="No saved templates yet — pick a shape above and create your first one." />
        )}
        {templates.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(150px, 1fr))" : "repeat(2, 1fr)", gap: 10 }}>
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => openTemplate(t)}
                style={{ position: "relative", background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 8px 8px", cursor: "pointer", textAlign: "center" }}
              >
                <button
                  type="button"
                  onClick={(e) => handleDeleteTemplate(t.id, e)}
                  style={{ position: "absolute", top: 6, right: 6, background: C.white, border: `1px solid ${C.line}`, borderRadius: 6, color: C.stamp, cursor: "pointer", padding: 4, lineHeight: 0, zIndex: 1 }}
                >
                  <Trash2 size={13} />
                </button>
                <TemplateThumb config={t.config} size={110} />
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, fontFamily: font.body, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- STEP 2: edit the design ---------------- */

  // Left panel: shape picker + the text that goes on the stamp.
  const textFields = (
    <>
      <Label>Shape</Label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {STAMP_SHAPES.map((s) => (
          <Btn
            key={s.id}
            variant={shape === s.id ? "solid" : "ghost"}
            onClick={() => setShape(s.id)}
            style={{ flex: 1, justifyContent: "center", ...(shape === s.id ? { background: STAMP_INK_BLUE } : {}) }}
          >
            {s.label}
          </Btn>
        ))}
      </div>

      {shape === "circle" ? (
        <>
          <Label>Top curved text</Label>
          <Field placeholder="YOUR COMPANY NAME" value={topText} onChange={(e) => setTopText(e.target.value)} maxLength={40} />
          <Label>Bottom curved text</Label>
          <Field placeholder="AUTHORIZED SIGNATORY" value={bottomText} onChange={(e) => setBottomText(e.target.value)} maxLength={40} />
          <Label>Center line</Label>
          <Field placeholder="APPROVED" value={centerLine1} onChange={(e) => setCenterLine1(e.target.value)} maxLength={20} />
          <Label>Center line (small, optional)</Label>
          <Field value={centerLine2} onChange={(e) => setCenterLine2(e.target.value)} maxLength={24} />
        </>
      ) : (
        <>
          <Label>Line 1 (bold)</Label>
          <Field placeholder="YOUR COMPANY NAME" value={rectLine1} onChange={(e) => setRectLine1(e.target.value)} maxLength={40} />
          <Label>Line 2</Label>
          <Field placeholder="123 Business Street, City" value={rectLine2} onChange={(e) => setRectLine2(e.target.value)} maxLength={50} />
          <Label>Line 3 (italic)</Label>
          <Field placeholder="AUTHORIZED SIGNATORY" value={rectLine3} onChange={(e) => setRectLine3(e.target.value)} maxLength={40} />
        </>
      )}
    </>
  );

  // Right panel: border / sliders / logo / texture — this is the panel that
  // scrolls on its own on desktop, like the reference editor.
  const controlFields = (
    <>
      <div style={{ marginTop: 4 }}>
        {shape === "circle" && (
          <SliderControl label="Radius" value={radius} min={90} max={150} step={0.5} onChange={setRadius} />
        )}
        <SliderControl label="Stroke width" value={strokeWidth} min={0.5} max={6} step={0.1} onChange={setStrokeWidth} />
        {shape === "circle" && (
          <SliderControl label="Line break" value={letterSpacing} min={0} max={8} step={0.1} onChange={setLetterSpacing} />
        )}
      </div>

      <Label>Logo (optional)</Label>
      <label style={{ display: "block", border: `1px dashed ${C.brass}`, borderRadius: 8, padding: "14px", textAlign: "center", color: C.brass, fontSize: 13, marginBottom: 12, cursor: "pointer" }}>
        {fileName || "Tap to upload logo image"}
        <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: C.ink, cursor: "pointer" }}>
        <input type="checkbox" checked={texture} onChange={(e) => setTexture(e.target.checked)} />
        Worn ink texture
      </label>
    </>
  );

  const fontOptions = ["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New", "Trebuchet MS"];
  const textPropertyPanel = (layer) => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr .65fr", border: `1px solid ${C.line}`, background: C.white, margin: "-2px -2px 14px", borderRadius: 4, overflow: "hidden" }}>
        <select value={layer.fontFamily || "Arial"} onChange={(e) => updateLayer(layer.id, { fontFamily: e.target.value })} style={{ border: "none", borderRight: `1px solid ${C.line}`, padding: "8px 10px", fontFamily: layer.fontFamily || "Arial", fontSize: 13, background: C.white, outline: "none" }}>
          {fontOptions.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={layer.fontSize ?? layer.size ?? 16} onChange={(e) => updateLayer(layer.id, { fontSize: Number(e.target.value), size: Number(e.target.value) })} style={{ border: "none", padding: "8px 8px", fontSize: 13, background: C.white, outline: "none" }}>
          {[10,12,14,16,18,20,22,24,28,32,36,40,48,56,64].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button type="button" onClick={() => updateLayer(layer.id, { bold: !layer.bold })} style={{ border: "none", borderTop: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}`, background: layer.bold ? "#E9F0FB" : C.white, fontWeight: 700, padding: "7px 10px", cursor: "pointer" }}>B</button>
        <button type="button" onClick={() => updateLayer(layer.id, { flipX: !layer.flipX })} style={{ border: "none", borderTop: `1px solid ${C.line}`, background: layer.flipX ? "#E9F0FB" : C.white, padding: "7px 10px", cursor: "pointer", fontSize: 12 }}>⇋ Flip text</button>
      </div>
    </>
  );

  const layerPanel = activeLayer && (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Label>{layerLabel(activeLayer)}</Label>
        <button type="button" onClick={() => removeLayer(activeLayer.id)} style={{ background: "none", border: "none", color: C.stamp, cursor: "pointer" }}>
          <Trash2 size={14} />
        </button>
      </div>

      {(activeLayer.type === "circleText" || activeLayer.type === "centerText") && (
        <>
          <Label>Text</Label>
          <Field value={activeLayer.text} onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value })} maxLength={40} />
          {textPropertyPanel(activeLayer)}
        </>
      )}

      {activeLayer.type === "circleText" ? (
        <>
          <SliderControl label="Radius text" value={activeLayer.radius ?? 130} min={40} max={155} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { radius: v })} />
          <SliderControl label="Spacing" value={activeLayer.spacing ?? 4} min={0} max={20} step={0.1} onChange={(v) => updateLayer(activeLayer.id, { spacing: v })} />
          <SliderControl label="Start point" value={activeLayer.start ?? 90} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { start: v })} />
        </>
      ) : activeLayer.type === "centerText" ? (
        <>
          <SliderControl label="Horizontal position" value={activeLayer.x ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { x: v })} />
          <SliderControl label="Vertical position" value={activeLayer.y ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { y: v })} />
          <SliderControl label="Rotation" value={activeLayer.rotation ?? 0} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { rotation: v })} />
        </>
      ) : activeLayer.type === "frame" ? (
        <>
          <SliderControl label="Radius" value={activeLayer.radius ?? 100} min={30} max={150} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { radius: v })} />
          <SliderControl label="Stroke width" value={activeLayer.strokeWidth ?? 4} min={1} max={25} step={0.1} onChange={(v) => updateLayer(activeLayer.id, { strokeWidth: v })} />
          <SliderControl label="Line break" value={activeLayer.lineBreak ?? 0} min={0} max={20} step={0.1} onChange={(v) => updateLayer(activeLayer.id, { lineBreak: v })} />
          <SliderControl label="Horizontal position" value={activeLayer.x ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { x: v })} />
          <SliderControl label="Vertical position" value={activeLayer.y ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { y: v })} />
          <SliderControl label="Rotation" value={activeLayer.rotation ?? 0} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { rotation: v })} />
        </>
      ) : (
        <>
          <SliderControl label="Size" value={activeLayer.size ?? 15} min={5} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { size: v })} />
          <SliderControl label="Horizontal position" value={activeLayer.x ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { x: v })} />
          <SliderControl label="Vertical position" value={activeLayer.y ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { y: v })} />
          <SliderControl label="Rotation" value={activeLayer.rotation ?? 0} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { rotation: v })} />
          <Btn variant="ghost" onClick={() => layerImageInputRef.current?.click()} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>Upload own</Btn>
        </>
      )}
    </div>
  );

  // All three desktop panels share this exact height, so Left / Center / Right
  // line up evenly — each one scrolls internally on its own if its content
  // is taller than the available space, instead of growing the column.
  const PANEL_HEIGHT = "calc(100vh - 230px)";

  const sidePanelStyle = {
    width: "100%",
    minWidth: 0,
    height: PANEL_HEIGHT,
    overflowY: "auto",
    position: "sticky",
    top: 0,
    borderRadius: 2,
  };

  const canvasBlock = (
    <Card
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 10px",
        marginBottom: isDesktop ? 0 : 10,
        ...(isDesktop ? { width: "100%", minWidth: 0, height: PANEL_HEIGHT, overflowY: "auto", position: "sticky", top: 14 } : {}),
      }}
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          title={layers.length ? "Click an item on the stamp to edit it" : "Add an item from the toolbar to edit it"}
          style={{ width: STAMP_CANVAS_SIZE, maxWidth: "100%", height: "auto", aspectRatio: "1 / 1", cursor: layers.length ? "pointer" : "default" }}
        />
        {layers.length > 0 && (
          <div style={{ marginTop: 6, fontFamily: font.mono, fontSize: 10, color: C.inkSoft, textAlign: "center" }}>Click any item on the stamp to edit</div>
        )}
      </div>
      <Btn onClick={handleDownload} style={{ marginTop: 14, background: STAMP_INK_BLUE }}><Download size={16} /> Download PNG</Btn>
    </Card>
  );

  const toolbarPill = { padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13.5, fontFamily: font.body, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, border: "none" };
  const toolbarIconBtn = {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none",
    color: C.white, cursor: "pointer", fontFamily: font.body, fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.15, padding: "4px 6px",
  };
  const toolbarIconBox = { width: 34, height: 34, borderRadius: 9, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div>
      <div
        style={{
          background: `linear-gradient(90deg, ${STAMP_INK_BLUE}, ${C.sage})`,
          borderRadius: 4,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: isDesktop ? "nowrap" : "wrap",
          marginBottom: 14,
        }}
      >
        <button type="button" onClick={() => setView("templates")} style={{ ...toolbarPill, background: C.sage, color: C.white }}>
          <ChevronLeft size={16} /> Templates
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? 22 : 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" onClick={() => addLayer("circleText")} style={toolbarIconBtn}>
            <span style={toolbarIconBox}><CircleDot size={18} /></span>
            Text around the circle
          </button>
          <button type="button" onClick={() => addLayer("centerText")} style={toolbarIconBtn}>
            <span style={toolbarIconBox}><Type size={18} /></span>
            Text in the centre
          </button>
          <button type="button" onClick={() => addLayer("frame")} style={toolbarIconBtn}>
            <span style={toolbarIconBox}><Circle size={18} /></span>
            Circle
          </button>
          <button
            type="button"
            onClick={() => { addLayer("image"); setTimeout(() => layerImageInputRef.current?.click(), 0); }}
            style={toolbarIconBtn}
          >
            <span style={toolbarIconBox}><ImageIcon size={18} /></span>
            Images
          </button>
          <input ref={layerImageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLayerImageUpload} />
        </div>

        <button type="button" onClick={startNew} style={{ ...toolbarPill, background: C.sage, color: C.white }}>
          <Plus size={16} /> New Stamp
        </button>
      </div>

      {layers.length > 0 && (
        <div style={{
          display: "flex", alignItems: "stretch", height: 50, background: C.white,
          borderBottom: `1px solid ${C.line}`, marginBottom: 0, overflow: "hidden"
        }}>
          <button type="button" onClick={() => {
            const i = Math.max(0, layers.findIndex((l) => l.id === activeLayerId) - 1);
            if (layers[i]) setActiveLayerId(layers[i].id);
          }} style={{ width: 46, border: "none", background: C.white, color: C.inkSoft, cursor: "pointer", display: "grid", placeItems: "center" }}>
            <ChevronLeft size={25} />
          </button>
          <div style={{ display: "flex", flex: 1, overflowX: "auto", minWidth: 0 }}>
            {layers.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setActiveLayerId(l.id)}
                style={{
                  position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  minWidth: 145, padding: "0 16px", border: "none", background: C.white, cursor: "pointer",
                  fontFamily: font.body, fontSize: 13.5, whiteSpace: "nowrap",
                  color: activeLayerId === l.id ? STAMP_INK_BLUE : C.ink,
                  borderBottom: activeLayerId === l.id ? `3px solid ${STAMP_INK_BLUE}` : "3px solid transparent",
                }}
              >
                {layerLabel(l)}
                <span onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }} style={{ display: "inline-flex", color: C.inkSoft, cursor: "pointer" }}>
                  <X size={13} />
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => {
            const i = Math.min(layers.length - 1, layers.findIndex((l) => l.id === activeLayerId) + 1);
            if (layers[i]) setActiveLayerId(layers[i].id);
          }} style={{ width: 46, border: "none", background: C.white, color: C.inkSoft, cursor: "pointer", display: "grid", placeItems: "center" }}>
            <ChevronRight size={25} />
          </button>
        </div>
      )}

      {isDesktop ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, alignItems: "stretch", width: "100%" }}>
          <Card style={{ ...sidePanelStyle, padding: 0 }}>
            <div style={{ display: "flex", height: 38, borderBottom: `1px solid ${C.line}`, background: C.paper }}>
              {['All', 'Text', 'Figure'].map((t, i) => (
                <button key={t} type="button" style={{ flex: 1, border: "none", borderRight: i < 2 ? `1px solid ${C.line}` : "none", background: i === 0 ? C.white : "transparent", color: C.ink, fontFamily: font.body, fontSize: 12.5, cursor: "pointer" }}>{t}</button>
              ))}
            </div>
            <div style={{ padding: 10 }}>{textFields}</div>
          </Card>
          {canvasBlock}
          <Card style={{ ...sidePanelStyle, padding: 12 }}>
            {activeLayer ? layerPanel : <div style={{ padding: 8, color: C.inkSoft, fontFamily: font.mono, fontSize: 11 }}>Select an item above or click an item on the stamp to edit.</div>}
            {controlFields}
          </Card>
        </div>
      ) : (
        <>
          {canvasBlock}
          <Card>
            {layerPanel}
            {textFields}
            {controlFields}
          </Card>
        </>
      )}

      <Card>
        <Label>{editingTemplateId ? "Update this template" : "Save this design as a template"}</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <Field
            placeholder="Template name, e.g. Invoice Stamp"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Btn onClick={handleSaveTemplate} disabled={saveStatus === "saving"} style={{ background: STAMP_INK_BLUE }}>
            {saveStatus === "saving" ? "Saving…" : editingTemplateId ? "Update" : "Save"}
          </Btn>
        </div>
        {saveStatus === "saved" && <div style={{ marginTop: 8, color: C.sage, fontFamily: font.mono, fontSize: 12 }}>Template saved.</div>}
        {saveStatus === "error" && <div style={{ marginTop: 8, color: C.stamp, fontFamily: font.mono, fontSize: 12 }}>Couldn't save — check the table exists in Supabase.</div>}
      </Card>
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

  const isDesktop = useIsDesktop();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${C.headerGreen}`, gap: 8 }}>
        <SectionTitle icon={BookOpen} title="Stamp Sale Register" bare />
        <Btn variant="ghost" onClick={exportCSV} style={{ padding: "6px 10px", fontSize: 11.5, flexShrink: 0 }}><Download size={13} /> Export</Btn>
      </div>
      <div style={{ position: "relative", marginBottom: 10, maxWidth: isDesktop ? 420 : "none" }}>
        <Search size={15} style={{ position: "absolute", left: 10, top: 12, color: C.inkSoft }} />
        <Field placeholder="Search by rubber name, mobile, or stamp name…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 32 }} />
      </div>
      <div style={isDesktop ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 10, alignItems: "start" } : undefined}>
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
      </div>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${C.headerGreen}`, gap: 8 }}>
        <SectionTitle icon={ShoppingCart} title="Purchase Entry" bare />
        <Btn variant="ghost" onClick={exportCSV} style={{ padding: "6px 10px", fontSize: 11.5, flexShrink: 0 }}><Download size={13} /> Export</Btn>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${C.headerGreen}`, gap: 8 }}>
        <SectionTitle icon={Wallet} title="Cash Ledger" bare />
        <Btn variant="ghost" onClick={exportCSV} style={{ padding: "6px 10px", fontSize: 11.5, flexShrink: 0 }}><Download size={13} /> Export</Btn>
      </div>
      <Card style={{ background: C.ink, color: C.white }}>
        <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.5, color: "#C9BC9C" }}>CURRENT CASH BALANCE</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, margin: "4px 0 8px" }}>{inr(balance)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.mono, fontSize: 11.5, gap: 8, flexWrap: "wrap" }}>
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
        <Card key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
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
function SectionTitle({ icon: Icon, title, bare = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, ...(bare ? {} : { marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${C.headerGreen}` }) }}>
      <Icon size={18} color={C.headerGreen} />
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 19, color: C.headerGreen, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
    </div>
  );
}
function EmptyNote({ text }) { return <div style={{ textAlign: "center", fontFamily: font.mono, fontSize: 12, color: C.inkSoft, padding: "20px 0" }}>{text}</div>; }
