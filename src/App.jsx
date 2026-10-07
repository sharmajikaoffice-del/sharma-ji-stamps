import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LogOut, Plus, Search, Trash2, RotateCcw,
  Stamp, Package, Tag as TagIcon, ShoppingCart, PenSquare, Wallet, Users, BookOpen, Download, Maximize2, Undo2, Redo2, Copy, ArrowUp, ArrowDown,
  Wand2, ChevronLeft, ChevronRight, Circle, Image as ImageIcon, Type, Star, X, Upload,
  Palette,
  Italic as ItalicIcon, MoveVertical, Square, Triangle, Eye, EyeOff, Printer, Inbox, Check, MoreHorizontal, Lock, Unlock, Save, Sun, Moon,
  LayoutDashboard
} from "lucide-react";

/* Preloaded symbol PNGs — ready-made icons users can drop onto a stamp
   without needing to upload their own image (star / rupee / leaf etc.). */
import symbolStar from "./assets/icons/star.png";
import symbolRupee from "./assets/icons/rupee.png";
import symbolLeaf from "./assets/icons/leaf.png";

const PRELOADED_SYMBOLS = [
  { id: "star", label: "Star", src: symbolStar },
  { id: "rupee", label: "Rupee", src: symbolRupee },
  { id: "leaf", label: "Leaf", src: symbolLeaf },
];

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
  if (!res.ok) {
    const detail = await res.text();
    console.error(`UPDATE ${table} failed:`, detail);
    throw new Error(`UPDATE ${table} failed: ${detail}`);
  }
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
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Photo upload failed${detail ? ` — ${detail}` : ""}. Check the "rubber-photos" storage bucket exists in Supabase and is public.`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/rubber-photos/${path}`;
}

/* ---------- design tokens ---------- */
const THEME_PALETTES = {
  "green-olive": {
    bg: "#F3F6EC", surface: "#FFFFFF", primary: "#3B6D11", primaryHover: "#27500A",
    accent: "#97C459", textPrimary: "#1C2413", textSecondary: "#5F5E5A", border: "#D3D1C7",
  },
  "grey-white-dark": {
    bg: "#1C1C1A", surface: "#2C2C2A", primary: "#B4B2A9", primaryHover: "#D3D1C7",
    accent: "#F1EFE8", textPrimary: "#F1EFE8", textSecondary: "#B4B2A9", border: "#444441",
  },
  "white-black-light": {
    bg: "#FFFFFF", surface: "#F7F7F5", primary: "#2C2C2A", primaryHover: "#000000",
    accent: "#888780", textPrimary: "#1A1A1A", textSecondary: "#5F5E5A", border: "#D3D1C7",
  },
  "navy-gold": {
    bg: "#F0F5FA", surface: "#FFFFFF", primary: "#042C53", primaryHover: "#0C447C",
    accent: "#EF9F27", textPrimary: "#042C53", textSecondary: "#5F5E5A", border: "#B5D4F4",
  },
  "maroon-cream": {
    bg: "#FDF6F3", surface: "#FFFFFF", primary: "#4A1B0C", primaryHover: "#712B13",
    accent: "#D85A30", textPrimary: "#3A1509", textSecondary: "#5F5E5A", border: "#F0997B",
  },
  "teal-charcoal": {
    bg: "#F2F9F6", surface: "#FFFFFF", primary: "#04342C", primaryHover: "#085041",
    accent: "#1D9E75", textPrimary: "#04342C", textSecondary: "#5F5E5A", border: "#9FE1CB",
  },
  "purple-lavender": {
    bg: "#F5F4FE", surface: "#FFFFFF", primary: "#26215C", primaryHover: "#3C3489",
    accent: "#7F77DD", textPrimary: "#26215C", textSecondary: "#5F5E5A", border: "#CECBF6",
  },
  "coral-sand": {
    bg: "#FBF6F0", surface: "#FFFFFF", primary: "#993C1D", primaryHover: "#D85A30",
    accent: "#F0997B", textPrimary: "#3A1509", textSecondary: "#5F5E5A", border: "#F5C4B3",
  },
  "soft-lilac": {
    bg: "#E3D5EF", surface: "#F1E9F8", primary: "#7D6B9E", primaryHover: "#5F4F80",
    accent: "#B9A5D3", textPrimary: "#4F3F6E", textSecondary: "#7D6D99", border: "#CDBBE0",
  },
};
const THEME_OPTIONS = [
  {id:"green-olive",label:"Green + olive"},{id:"grey-white-dark",label:"Grey + white (dark)"},
  {id:"white-black-light",label:"White + black (light)"},{id:"navy-gold",label:"Navy + gold"},
  {id:"maroon-cream",label:"Maroon + cream"},{id:"teal-charcoal",label:"Teal + charcoal"},
  {id:"purple-lavender",label:"Purple + lavender"},{id:"coral-sand",label:"Coral + sand"},
  {id:"soft-lilac",label:"Soft lilac (neumorphic)"},
];
const LIGHT_C = THEME_PALETTES["green-olive"];
const DARK_C = THEME_PALETTES["grey-white-dark"];
let C = LIGHT_C;

/* Theme switcher shown as an actual row of clickable color boxes (one per
   palette), instead of a hidden native <select>. Click the button to open a
   small popover of swatches; click a swatch to apply that theme. */
function ThemeSwatchPicker({ theme, onChange, compact, placement = "up" }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Choose theme"
        aria-label="Choose theme"
        style={{
          background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.28)", borderRadius: 8,
          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
          padding: compact ? "6px 8px" : "9px 8px", fontFamily: font.body, fontSize: compact ? 11.5 : 12.5, fontWeight: 700,
          width: compact ? undefined : "100%", justifyContent: compact ? "flex-start" : "center", boxSizing: "border-box",
        }}
      >
        <Palette size={15} />
        <span>Theme</span>
        <span style={{
          width: compact ? 14 : 16, height: compact ? 14 : 16, borderRadius: 4,
          background: THEME_PALETTES[theme]?.primary || "#3B6D11", border: "1px solid rgba(255,255,255,.5)", flexShrink: 0,
        }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 490 }} />
          <div style={{
            position: "absolute", [placement === "up" ? "bottom" : "top"]: "115%", left: 0, zIndex: 500,
            background: "#fff", border: "1px solid #D3D1C7", borderRadius: 10, padding: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.18)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, minWidth: 148,
          }}>
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                title={opt.label}
                aria-label={opt.label}
                style={{
                  width: 30, height: 30, borderRadius: 7, cursor: "pointer",
                  background: THEME_PALETTES[opt.id].primary,
                  border: theme === opt.id ? "2px solid #1C2413" : "1px solid rgba(0,0,0,.15)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
// Compact axis label, e.g. ₹1.2L / ₹8.4k / ₹350 — used on chart y-axes so
// big rupee values don't crowd the gridlines.
const fmtAxis = (n) => {
  const v = Number(n || 0);
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
};
// Smooth Catmull-Rom-through-Bezier path through a set of [x,y] points, so
// dashboard trend lines read as gentle curves instead of jagged polylines.
function smoothPath(pts) {
  if (!pts.length) return "";
  if (pts.length < 3) return `M ${pts.map((p) => `${p[0]},${p[1]}`).join(" L ")}`;
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}
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
function drawArcText(ctx, text, cx, cy, radius, startAngle, direction, letterSpacing, opts = {}) {
  // direction: 1 = clockwise (top text), -1 = counter-clockwise (bottom text, reads upright)
  if (!text) return;
  const { tall = false, invert = false, invertColor = "#000", textColor = null } = opts;
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

  // "Invert" draws a solid ink band under the arc and flips the letters to white,
  // matching the negative/reversed-type look real rubber stamps use for emphasis.
  if (invert) {
    const fontSizeMatch = /([\d.]+)px/.exec(ctx.font);
    const fs = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 14;
    const band = fs * (tall ? 1.9 : 1.5);
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = invertColor;
    ctx.lineWidth = band;
    ctx.lineCap = "butt";
    ctx.arc(0, 0, radius, -Math.PI / 2 - totalAngle / 2 - 0.02, -Math.PI / 2 + totalAngle / 2 + 0.02);
    ctx.stroke();
    ctx.restore();
  }

  ctx.rotate((-totalAngle / 2) * direction);

  chars.forEach((ch, i) => {
    const a = angles[i];
    ctx.rotate((a / 2) * direction);
    ctx.save();
    ctx.translate(0, -radius * direction);
    // No extra rotation here: the "* direction" sign on the translate above
    // already makes letters land upright — tops pointing outward for the top
    // arc, and tops pointing toward the circle's centre for the bottom arc
    // (the correct "smile" look). An extra 180° rotation on this line was
    // flipping bottom-arc text upside-down and out of order — removed.
    if (tall) ctx.scale(1, 1.35); // "Height" toggle — stretches letters vertically, classic stamp look
    if (textColor) ctx.fillStyle = textColor;
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

let STAMP_INK_BLUE = "#3F7FE8";
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
  const { shape, topText = "", bottomText = "", centerLine1 = "", centerLine2 = "", rectLine1 = "", rectLine2 = "", rectLine3 = "", topTextSize = 12, bottomTextSize = 12, centerTextSize = 16, centerText2Size = 11, inkColor = STAMP_INK_BLUE, borderStyle = "double", texture = true, logo = null, radius = 138, strokeWidth = 3, letterSpacing = 2.5, layers = [], width = STAMP_CANVAS_SIZE, height = STAMP_CANVAS_SIZE, pixelRatio = window.devicePixelRatio || 1, monochrome = false } = cfg;
  const dpr = pixelRatio;
  const size = STAMP_CANVAS_SIZE;
  const canvasHeight = Math.max(40, STAMP_CANVAS_SIZE * (height / Math.max(1, width)));
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  // Display size is controlled purely via CSS (width + aspect-ratio) on the
  // <canvas> element itself, so it never gets stretched into an oval when the
  // container is narrower than the canvas — see the JSX below.
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const geometryScale = width / STAMP_CANVAS_SIZE;
  ctx.scale(dpr * geometryScale, dpr * geometryScale);
  ctx.clearRect(0, 0, size, canvasHeight);

  // A brand-new stamp must open completely blank. Draw nothing until the user
  // adds content/layers or enters actual text/logo content.
  const hasContent = Boolean(
    layers.length || topText || bottomText || centerLine1 || centerLine2 ||
    rectLine1 || rectLine2 || rectLine3 || logo
  );
  if (!hasContent) return;

  const cx = size / 2;
  const cy = canvasHeight / 2;
  ctx.strokeStyle = inkColor;
  ctx.fillStyle = inkColor;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (shape === "circle") {
    const outerR = Math.min(radius, Math.min(size, canvasHeight) * 0.43);
    const innerR = borderStyle === "double" ? outerR - 16 : outerR;
    const textR = outerR - 25;
    const scale = outerR / 138;
    const hasFrameLayers = layers.some((l) => l.type === "frame");
    const hasAnyLayers = layers.length > 0;

    // Toolbar layers are independent objects. In particular, “Text around the circle”
    // must draw ONLY the curved text — it must never create the two default rings.
    // Rings appear only when the user adds a Circle/Frame layer. Legacy templates
    // with no layers still use their original built-in border.
    if (!hasAnyLayers) {
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

    ctx.font = `600 ${Number(topTextSize) || 12}px Georgia, 'Times New Roman', serif`;
    drawArcText(ctx, topText, cx, cy, textR, 0, 1, letterSpacing);
    ctx.font = `600 ${Number(bottomTextSize) || 12}px Georgia, 'Times New Roman', serif`;
    drawArcText(ctx, bottomText, cx, cy, textR, 0, -1, letterSpacing);

    if (logo) {
      const logoSize = 44;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(logo, cx - logoSize / 2, cy - 54 * scale, logoSize, logoSize);
      ctx.restore();
    }

    ctx.font = `700 ${Number(centerTextSize) || 16}px Georgia, 'Times New Roman', serif`;
    ctx.fillText(centerLine1, cx, logo ? cy + 4 : cy - 4);
    if (centerLine2) {
      ctx.font = `400 ${Number(centerText2Size) || 11}px Georgia, 'Times New Roman', serif`;
      ctx.fillText(centerLine2, cx, cy + (logo ? 24 : 16));
    }

  } else {
    const w = Math.min(size * 0.84, size - 24);
    const h = Math.min(canvasHeight * 0.72, canvasHeight - 24);
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
    ctx.fillText(rectLine1, cx, cursorY);
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
    ctx.fillText(rectLine3, cx, cursorY + 4);
  }

  if (texture) addInkTexture(ctx, size, canvasHeight, inkColor, 42);

  // Extra layers added from the toolbar — drawn on top, using percentage
  // positions so they scale with the canvas.
  layers.forEach((layer) => {
    if (layer.hidden) return; // Skip layers the user has hidden.
    const lx = ((layer.x ?? 50) / 100) * size;
    const ly = ((layer.y ?? 50) / 100) * canvasHeight;
    const rot = ((layer.rotation ?? 0) * Math.PI) / 180;
    ctx.fillStyle = inkColor;
    ctx.strokeStyle = inkColor;
    if (layer.type === "circleText") {
      ctx.save();
      const weight = layer.bold ? 700 : 400;
      const style = layer.fontStyle === "italic" ? "italic " : "";
      const family = layer.fontFamily || "Arial";
      const size = layer.fontSize ?? 13;
      ctx.font = `${style}${weight} ${size}px ${family}`;
      const startAngle = (((layer.start ?? 90) - 90) * Math.PI) / 180;
      // "Flip text" for curved text means: read it round the other way along the
      // arc (like the built-in top-text/bottom-text pair already does), so every
      // letter stays upright and readable — NOT a mirror image of each letter.
      const direction = layer.flipX ? -1 : 1;
      drawArcText(ctx, (layer.text || ""), cx, cy, layer.radius ?? 130, startAngle, direction, layer.spacing ?? 4, {
        tall: !!layer.tall,
        invert: !!layer.invert,
        invertColor: inkColor,
        textColor: layer.invert ? "#fff" : null,
      });
      ctx.restore();
    } else if (layer.type === "centerText") {
      // Triangle side text is constrained to the selected triangle edge.
      if (layer.layout === "triangleSide" || ["bottom", "rightRotated", "leftRotated"].includes(layer.layout)) {
        const frame = layers.find((x) => x.id === layer.triangleFrameId && x.type === "frame" && (x.shape || "circle") === "triangle");
        if (frame) {
          ctx.save();
          const frx = ((frame.x ?? 50) / 100) * size;
          const fry = ((frame.y ?? 50) / 100) * canvasHeight;
          const frot = ((frame.rotation ?? 0) * Math.PI) / 180;
          // Use the side text's original triangle radius, not the current
          // frame radius. This keeps all three texts the same size and place
          // while the triangle itself is resized independently.
          const textRadius = Number(layer.triangleTextRadius ?? frame.radius ?? 100);
          const r = Math.max(4, Math.min(size * 0.48, canvasHeight * 0.48, textRadius));
          const points = [-90, 30, 150].map((deg) => {
            const a = (deg * Math.PI) / 180 + frot;
            return { x: frx + r * Math.cos(a), y: fry + r * Math.sin(a) };
          });
          const sides = [[points[0], points[1]], [points[1], points[2]], [points[2], points[0]]];
          const layoutSide = { rightRotated: 0, bottom: 1, leftRotated: 2 };
          const sideIndex = layoutSide[layer.layout] ?? Math.max(0, Math.min(2, Number(layer.triangleSide ?? 1)));
          const [a, b] = sides[sideIndex];
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const ex = b.x - a.x, ey = b.y - a.y;
          const len = Math.max(1, Math.hypot(ex, ey));
          const txv = ex / len, tyv = ey / len;
          const nx = -tyv, ny = txv;
          let angle = Math.atan2(ey, ex);
          while (angle > Math.PI / 2) angle -= Math.PI;
          while (angle < -Math.PI / 2) angle += Math.PI;
          const horizontalOffset = ((Number(layer.x ?? 50) - 50) / 50) * len * 0.42;
          const verticalOffset = ((Number(layer.y ?? 50) - 50) / 50) * len * 0.22;
          ctx.translate(mx + txv * horizontalOffset + nx * verticalOffset, my + tyv * horizontalOffset + ny * verticalOffset);
          ctx.rotate(angle);
          const weight = layer.bold ? 700 : 400;
          const style = layer.fontStyle === "italic" ? "italic " : "";
          const family = layer.fontFamily || "Arial";
          const fsz = layer.fontSize ?? layer.size ?? 13;
          ctx.font = `${style}${weight} ${fsz}px ${family}`;
          ctx.fillStyle = inkColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(layer.text || "", 0, 0);
          ctx.restore();
        }
        return;
      }
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot + (layer.flipX ? Math.PI : 0));
      const weight = layer.bold ? 700 : 400;
      const style = layer.fontStyle === "italic" ? "italic " : "";
      const family = layer.fontFamily || "Arial";
      const fsz = layer.fontSize ?? layer.size ?? 16;
      ctx.font = `${style}${weight} ${fsz}px ${family}`;
      const text = layer.text || "";
      if (layer.invert) {
        const m = ctx.measureText(text), tw = m.width;
        const th = fsz * (layer.tall ? 1.55 : 1.15);
        const padX = fsz * 0.32, padY = fsz * 0.16;
        ctx.save(); ctx.fillStyle = inkColor;
        const rx = -tw / 2 - padX, ry = -th / 2 - padY, rw = tw + padX * 2, rh = th + padY * 2;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, Math.min(4, rh / 2)); ctx.fill(); }
        else ctx.fillRect(rx, ry, rw, rh);
        ctx.restore(); ctx.fillStyle = "#fff";
      }
      if (layer.tall) { ctx.save(); ctx.scale(1, 1.35); ctx.fillText(text, 0, 0); ctx.restore(); }
      else ctx.fillText(text, 0, 0);
      ctx.restore();
    } else if (layer.type === "frame") {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const sw = layer.strokeWidth ?? 4;
      const gap = Math.max(0, layer.lineBreak ?? 0);
      // Keep the outer edge fixed: increasing Stroke makes the border bolder
      // by growing inward only. The Break gap remains an independent value.
      const style = layer.borderStyle || "single";
      const frameShape = layer.shape || "circle";

      // Traces the frame's outline at a given inward inset, so double/triple
      // border styles can redraw the same shape as concentric rings.
      const tracePath = (inset) => {
        ctx.beginPath();
        if (frameShape === "square") {
          // Width/Height are independent percentages of the canvas, so this
          // shape can be a true rectangle, not just a square.
          const w = Math.max(6, ((layer.width ?? 45) / 100) * size - inset * 2);
          const h = Math.max(6, ((layer.height ?? 45) / 100) * canvasHeight - inset * 2);
          const corner = Math.min(
            Math.max(0, Number(layer.cornerRadius ?? 0)),
            w / 2,
            h / 2
          );
          if (corner > 0 && ctx.roundRect) {
            ctx.roundRect(-w / 2, -h / 2, w, h, corner);
          } else {
            ctx.rect(-w / 2, -h / 2, w, h);
          }
        } else if (frameShape === "triangle") {
          // Equilateral triangle inscribed in a circle of radius r.
          const r = Math.max(4, Math.min(size * 0.48, layer.radius ?? 100) - inset * 1.6);
          const pts = [-90, 30, 150].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return [r * Math.cos(rad), r * Math.sin(rad)];
          });
          ctx.moveTo(pts[0][0], pts[0][1]);
          ctx.lineTo(pts[1][0], pts[1][1]);
          ctx.lineTo(pts[2][0], pts[2][1]);
          ctx.closePath();
        } else {
          const r = Math.max(4, Math.min(size * 0.48, layer.radius ?? 100) - inset);
          ctx.arc(0, 0, r, 0, Math.PI * 2);
        }
      };

      // Optional solid fill: frame shapes normally draw as a bare outline
      // (transparent inside), so anything behind them — another layer's line,
      // the circle's ring, etc. — always shows through regardless of layer
      // order. Turning Fill on paints the shape's interior first so it can
      // actually occlude whatever sits underneath it.
      if (layer.fill) {
        ctx.save();
        tracePath(0);
        ctx.fillStyle = inkColor || STAMP_INK_BLUE || "#000000";
        ctx.fill();
        ctx.restore();
      }

      // Line Break controls the NUMBER OF BREAKS around the border.
      // 0 = continuous border. Every +1 on the slider adds 5 breaks:
      // 1 => 5 breaks, 10 => 50 breaks, 100 => 500 breaks.
      // Stroke width is independent and remains inward-only.
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
      ctx.setLineDash([]);

      const drawTraceWithBreak = (inset, breakValue) => {
        if (breakValue <= 0) {
          ctx.setLineDash([]);
          tracePath(inset);
          ctx.stroke();
          return;
        }

        const breakCount = Math.max(1, Math.round(breakValue * 5));
        const gapFraction = breakCount >= 150 ? 0.34 : breakCount >= 50 ? 0.32 : 0.28;

        if (frameShape === "circle") {
          const r = Math.max(4, Math.min(size * 0.48, layer.radius ?? 100) - inset);
          const step = (Math.PI * 2) / breakCount;
          const gapAngle = step * gapFraction;
          const drawAngle = step - gapAngle;
          const offset = -Math.PI / 2 + gapAngle / 2;

          ctx.setLineDash([]);
          for (let i = 0; i < breakCount; i++) {
            const start = offset + i * step;
            const end = start + drawAngle;
            ctx.beginPath();
            ctx.arc(0, 0, r, start, end, false);
            ctx.stroke();
          }
        } else {
          const pathScale = frameShape === "triangle"
            ? Math.max(12, Math.min(size * 2.4, (layer.radius ?? 100) * 4.5))
            : Math.max(12, (((layer.width ?? 45) / 100) * size + ((layer.height ?? 45) / 100) * canvasHeight) * 2);
          const period = Math.max(ctx.lineWidth * 2, pathScale / breakCount);
          ctx.setLineDash([period * (1 - gapFraction), period * gapFraction]);
          tracePath(inset);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      };

      if (style === "filled" && frameShape === "square") {
        // Filled rectangle is a solid box: no outline stroke and no line-break.
        ctx.save();
        tracePath(0);
        ctx.fillStyle = layer.fillColor || "#FFFFFF";
        ctx.fill();
        ctx.restore();
      } else if (style === "scalloped" && frameShape === "circle") {
        // A scalloped ring border, like a certificate seal — a thin band with
        // many small rounded bumps along its outer edge, and a plain circular
        // inner edge so the middle of the stamp stays open for other content.
        // (Earlier this filled a solid disc all the way to the centre, which
        // looked like a big blue blob instead of a border.) "Wave amount"
        // controls how deep the bumps cut in.
        const outerR = Math.max(4, Math.min(size * 0.48, layer.radius ?? 100));
        const teeth = 34; // frequent, small bumps rather than a few big points
        const amp = Math.max(1, ((layer.waveAmount ?? 14) / 100) * outerR * 0.22);
        const bandWidth = Math.max(sw, amp * 1.6);
        const innerR = Math.max(2, outerR - amp - bandWidth);
        const steps = teeth * 8;
        const outerPoint = (ang) => {
          const wobble = amp * (0.5 + 0.5 * Math.cos(teeth * ang));
          const r = outerR - wobble;
          return [r * Math.cos(ang), r * Math.sin(ang)];
        };
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const ang = (Math.PI * 2 * i) / steps - Math.PI / 2;
          const [px, py] = outerPoint(ang);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        // Cut a plain circular hole out of the middle (traced the opposite
        // direction from the outer edge) so only the ring itself is filled.
        for (let i = steps; i >= 0; i--) {
          const ang = (Math.PI * 2 * i) / steps - Math.PI / 2;
          const px = innerR * Math.cos(ang);
          const py = innerR * Math.sin(ang);
          if (i === steps) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2, innerR - Math.max(2, sw)), 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, sw * 0.4);
        ctx.stroke();
      } else if (style === "double") {
        const ringGap = Math.max(6, sw * 2.2);
        for (let i = 0; i < 2; i++) {
          // Keep the outer edge fixed. Every ring is shifted inward by half
          // its own stroke width so increasing Stroke only makes it bolder inward.
          const ringStroke = i === 0 ? sw : sw * 0.6;
          ctx.lineWidth = ringStroke;
          drawTraceWithBreak(ringStroke / 2 + i * ringGap, gap);
        }
      } else {
        // Keep the outside boundary fixed: the stroke is centered half a
        // stroke-width inside the original radius, so increasing Stroke
        // grows only toward the inside. Break remains independent.
        ctx.lineWidth = sw;
        drawTraceWithBreak(sw / 2, gap);
      }
      ctx.setLineDash([]);
      ctx.restore();
    } else if (layer.type === "line") {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const lineW = ((layer.width ?? 55) / 100) * size;
      const curve = Number(layer.curve ?? 0);
      const curveAmount = Math.max(0, Number(layer.curveAmount ?? 24));
      ctx.lineWidth = layer.strokeWidth ?? 4;
      ctx.lineCap = "butt";
      const lineBreak = Math.min(40, Math.max(0, Number(layer.lineBreak ?? 0)));
      if (lineBreak > 0) {
        // A line uses Break as GAP SIZE, not as a break-count. This keeps the
        // pattern predictable at every slider value and prevents tiny dash
        // fragments at the high end of the 0-40 range.
        const breakRatio = lineBreak / 40;
        const dashLength = Math.max(ctx.lineWidth * 1.5, lineW * 0.10);
        const gapLength = Math.max(ctx.lineWidth * 1.5, dashLength * (0.35 + breakRatio * 2.15));
        ctx.setLineDash([dashLength, gapLength]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      if (curve === 0) {
        ctx.moveTo(-lineW / 2, 0);
        ctx.lineTo(lineW / 2, 0);
      } else {
        // A curved line inside a circle follows the circle's geometry instead of
        // using an arbitrary quadratic curve. arcRadius is in the same percentage
        // scale as the circle frame radius; when absent, derive it from the stamp.
        const frameRadius = layers.find((x) => x.type === "frame" && (x.shape || "circle") === "circle")?.radius;
        const rPct = Number(layer.arcRadius ?? 0) > 0 ? Number(layer.arcRadius) : Number(frameRadius ?? 82);
        const r = Math.max(12, (rPct / 100) * (size / 2));
        const chord = Math.min(lineW, 2 * r * 0.98);
        const half = Math.asin(Math.min(0.98, chord / (2 * r)));
        const bend = Math.max(0.05, Math.min(1.25, curveAmount / 80));
        // Up Curve should bulge upward (like a rainbow ⌢) and Down Curve
        // downward (like a smile ⌣). Previously both traced the arc around
        // the same base angle (PI/2, the bottom of the circle) and only
        // differed in stroke direction, which draws the identical minor arc
        // either way — so "Up Curve" had no visible effect. Flipping the
        // base angle to -PI/2 (the top of the circle) for Up Curve fixes it.
        const baseAngle = curve < 0 ? -Math.PI / 2 : Math.PI / 2;
        ctx.arc(0, 0, r, baseAngle - half * bend, baseAngle + half * bend, false);
      }
      ctx.stroke();
      ctx.restore();
    } else if (layer.type === "image" && layer.imageObj) {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const iw = ((layer.width ?? layer.size ?? 15) / 100) * Math.min(size, canvasHeight);
      const naturalRatio = layer.imageObj.naturalHeight && layer.imageObj.naturalWidth
        ? layer.imageObj.naturalHeight / layer.imageObj.naturalWidth
        : 1;
      const ih = iw * naturalRatio;
      ctx.drawImage(layer.imageObj, -iw / 2, -ih / 2, iw, ih);
      ctx.restore();
    }
  });

  // Final export pass: turn the design into stamp-ready ink.
  // IMPORTANT: this must NOT just flip every opaque pixel to black — an inserted
  // photo/logo is usually fully opaque (a JPG, or a PNG with a white/solid
  // background), so a blanket "opaque -> black" fill turned the whole image
  // into one solid black rectangle on export/print. Instead, threshold by
  // brightness: light pixels (background of an inserted image) become fully
  // transparent (no ink), and only genuinely dark pixels (text, borders, and
  // the dark parts of an inserted logo/photo) become solid black ink.
  if (monochrome) {
    const imgData = ctx.getImageData(0, 0, size, canvasHeight);
    const d = imgData.data;
    const brightnessThreshold = 200; // 0-255; raise to keep more of a light logo as ink
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue; // already transparent, nothing to do
      const luminance = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (luminance > brightnessThreshold) {
        d[i + 3] = 0; // light pixel (e.g. white background of an inserted image) -> no ink
      } else {
        d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; // dark pixel -> solid black ink, keep its alpha
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

/* Cleans up an exported stamp canvas so the PNG is print-ready:
   - Every pixel becomes either pure black (#000, fully opaque) or fully transparent.
   - Removes the grey/blurry anti-aliased halo canvas normally leaves around curves and
     text, which is what previously showed up as stray "spots"/speckles and a soft,
     blurred look once printed.
   Must be called AFTER all drawing is finished, directly on the export canvas
   (raw pixel buffer, unaffected by any ctx.scale/transform used while drawing). */
function binarizeCanvasToBlack(canvas, alphaThreshold = 90) {
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < alphaThreshold) {
      // Faint/partial pixel (anti-aliasing fuzz or a stray fleck) — drop it entirely
      // instead of leaving it as a visible grey dot.
      data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0;
    } else {
      // Solid ink — force pure black, fully opaque, no grey/blue tint left behind.
      data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/* Slider row with prev/next step arrows — matches the "Radius / Stroke width / Line break" controls. */
function BreakSliderControl({ value = 0, onChange }) {
  const actualMax = 40;
  const sliderMax = 100;
  const actualStep = 0.1;
  const clamp = (n) => Math.min(actualMax, Math.max(0, n));
  const actual = clamp(Number(value) || 0);
  const sliderValue = Math.round((actual / actualMax) * sliderMax);
  const fmt = (n) => (Math.round(n * 10) / 10).toString();

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: font.body, fontSize: 13, color: C.ink, marginBottom: 6 }}>
        Break <span style={{ color: C.brass, fontFamily: font.mono, fontSize: 12 }}>[ {fmt(actual)} ]</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => onChange(clamp(actual - 0.5))}
          style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${C.line}`, background: C.white, color: C.inkSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}
        >
          <ChevronLeft size={14} />
        </button>
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={1}
          value={sliderValue}
          onChange={(e) => onChange(clamp((Number(e.target.value) / sliderMax) * actualMax))}
          style={{ flex: 1, accentColor: STAMP_INK_BLUE, cursor: "pointer" }}
        />
        <button
          type="button"
          onClick={() => onChange(clamp(actual + 0.5))}
          style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${C.line}`, background: C.white, color: C.inkSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

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
  const [layerImages, setLayerImages] = useState({});

  // Templates store image layers as imageDataUrl (not live Image objects).
  // Re-hydrate every saved image before drawing the thumbnail so image layers
  // are visible in Templates / Recent Designs as well as inside the editor.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next = {};
      const urls = (Array.isArray(config?.layers) ? config.layers : []).filter((l) => l?.type === "image" && l?.imageDataUrl);
      await Promise.all(urls.map((layer) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { next[layer.id] = img; resolve(); };
        img.onerror = () => resolve();
        img.src = layer.imageDataUrl;
      })));
      if (!cancelled) setLayerImages(next);
    };
    load();
    return () => { cancelled = true; };
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    if (!config?.logoDataUrl) { setLogoImg(null); return undefined; }
    const img = new Image();
    img.onload = () => { if (!cancelled) setLogoImg(img); };
    img.onerror = () => { if (!cancelled) setLogoImg(null); };
    img.src = config.logoDataUrl;
    return () => { cancelled = true; };
  }, [config?.logoDataUrl]);

  // Render thumbnails at 2x backing resolution for crisp mobile downscaling,
  // while keeping the actual display size small.
  const previewBase = STAMP_CANVAS_SIZE * 2;
  const previewDims = (() => {
    if (config?.shape === "circle" || config?.shape === "square") return { width: previewBase, height: previewBase };
    const parsed = parseRubberSize(config?.rubberSize);
    if (!parsed) return { width: previewBase, height: previewBase };
    return {
      width: previewBase,
      height: Math.max(80, previewBase * (parsed.heightMm / parsed.widthMm)),
    };
  })();
  const previewAspectRatio = `${previewDims.width} / ${previewDims.height}`;

  useEffect(() => {
    const hydratedLayers = (Array.isArray(config?.layers) ? config.layers : []).map((layer) => ({
      ...layer,
      imageObj: layerImages[layer.id] || null,
    }));
    drawStampOnCanvas(ref.current, {
      ...config,
      width: previewDims.width,
      height: previewDims.height,
      layers: hydratedLayers,
      inkColor: config.inkColor || STAMP_INK_BLUE,
      logo: logoImg,
    }, size);
  }, [config, logoImg, layerImages, size, previewDims.width, previewDims.height]);

  return (
    <canvas
      ref={ref}
      style={{
        width: size,
        maxWidth: "100%",
        height: "auto",
        aspectRatio: previewAspectRatio,
        display: "block",
      }}
    />
  );
}

function useFonts() {
  useEffect(() => {