import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LogOut, Plus, Search, Trash2, RotateCcw,
  Stamp, Package, Tag as TagIcon, ShoppingCart, PenSquare, Wallet, Users, BookOpen, Download, Maximize2, Undo2, Redo2, Copy, ArrowUp, ArrowDown,
  Wand2, ChevronLeft, ChevronRight, Circle, Image as ImageIcon, Type, Star, X,
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
  "green-olive": { paper:"#F3F6EC", paperDark:"#E8EDDF", ink:"#1C2413", inkSoft:"#5F5E5A", stamp:"#3B6D11", stampDark:"#27500A", brass:"#97C459", sage:"#3B6D11", white:"#FFFFFF", line:"#D3D1C7", headerGreen:"#3B6D11" },
  "grey-white-dark": { paper:"#1C1C1A", paperDark:"#242422", ink:"#F1EFE8", inkSoft:"#B4B2A9", stamp:"#B4B2A9", stampDark:"#D3D1C7", brass:"#F1EFE8", sage:"#B4B2A9", white:"#2C2C2A", line:"#444441", headerGreen:"#2C2C2A" },
  "white-black-light": { paper:"#FFFFFF", paperDark:"#F0F0EE", ink:"#1A1A1A", inkSoft:"#5F5E5A", stamp:"#2C2C2A", stampDark:"#000000", brass:"#888780", sage:"#2C2C2A", white:"#F7F7F5", line:"#D3D1C7", headerGreen:"#2C2C2A" },
  "navy-gold": { paper:"#F0F5FA", paperDark:"#E2EDF7", ink:"#042C53", inkSoft:"#5F5E5A", stamp:"#042C53", stampDark:"#0C447C", brass:"#EF9F27", sage:"#042C53", white:"#FFFFFF", line:"#B5D4F4", headerGreen:"#042C53" },
  "maroon-cream": { paper:"#FDF6F3", paperDark:"#F8E9E3", ink:"#3A1509", inkSoft:"#5F5E5A", stamp:"#4A1B0C", stampDark:"#712B13", brass:"#D85A30", sage:"#4A1B0C", white:"#FFFFFF", line:"#F0997B", headerGreen:"#4A1B0C" },
  "teal-charcoal": { paper:"#F2F9F6", paperDark:"#E2F1EB", ink:"#04342C", inkSoft:"#5F5E5A", stamp:"#04342C", stampDark:"#085041", brass:"#1D9E75", sage:"#04342C", white:"#FFFFFF", line:"#9FE1CB", headerGreen:"#04342C" },
  "purple-lavender": { paper:"#F5F4FE", paperDark:"#ECEAFB", ink:"#26215C", inkSoft:"#5F5E5A", stamp:"#26215C", stampDark:"#3C3489", brass:"#7F77DD", sage:"#26215C", white:"#FFFFFF", line:"#CECBF6", headerGreen:"#26215C" },
  "coral-sand": { paper:"#FBF6F0", paperDark:"#F5E9DD", ink:"#3A1509", inkSoft:"#5F5E5A", stamp:"#993C1D", stampDark:"#D85A30", brass:"#F0997B", sage:"#993C1D", white:"#FFFFFF", line:"#F5C4B3", headerGreen:"#993C1D" },
};
const THEME_OPTIONS = [
  {id:"green-olive",label:"Green + olive"},{id:"grey-white-dark",label:"Grey + white (dark)"},
  {id:"white-black-light",label:"White + black (light)"},{id:"navy-gold",label:"Navy + gold"},
  {id:"maroon-cream",label:"Maroon + cream"},{id:"teal-charcoal",label:"Teal + charcoal"},
  {id:"purple-lavender",label:"Purple + lavender"},{id:"coral-sand",label:"Coral + sand"},
];
const LIGHT_C = THEME_PALETTES["green-olive"];
const DARK_C = THEME_PALETTES["grey-white-dark"];
let C = LIGHT_C;
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

const STAMP_INK_BLUE = "#3F7FE8";
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
    drawArcText(ctx, topText.toUpperCase(), cx, cy, textR, 0, 1, letterSpacing);
    ctx.font = `600 ${Number(bottomTextSize) || 12}px Georgia, 'Times New Roman', serif`;
    drawArcText(ctx, bottomText.toUpperCase(), cx, cy, textR, 0, -1, letterSpacing);

    if (logo) {
      const logoSize = 44;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(logo, cx - logoSize / 2, cy - 54 * scale, logoSize, logoSize);
      ctx.restore();
    }

    ctx.font = `700 ${Number(centerTextSize) || 16}px Georgia, 'Times New Roman', serif`;
    ctx.fillText(centerLine1.toUpperCase(), cx, logo ? cy + 4 : cy - 4);
    if (centerLine2) {
      ctx.font = `400 ${Number(centerText2Size) || 11}px Georgia, 'Times New Roman', serif`;
      ctx.fillText(centerLine2.toUpperCase(), cx, cy + (logo ? 24 : 16));
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
      drawArcText(ctx, (layer.text || "").toUpperCase(), cx, cy, layer.radius ?? 130, startAngle, direction, layer.spacing ?? 4, {
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
          ctx.rect(-w / 2, -h / 2, w, h);
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
        ctx.fillStyle = layer.fillColor || "#FFFFFF";
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
        if (frameShape === "circle" && breakValue > 0) {
          const r = Math.max(4, Math.min(size * 0.48, layer.radius ?? 100) - inset);
          const breakCount = Math.max(1, Math.round(breakValue * 5));
          const step = (Math.PI * 2) / breakCount;
          // Each break is a sharp, evenly distributed gap. The gap fraction is
          // intentionally modest so even 500 breaks remain visible as fine segments.
          const gapFraction = breakCount >= 300 ? 0.38 : breakCount >= 50 ? 0.32 : 0.28;
          const gapAngle = step * gapFraction;
          const drawAngle = step - gapAngle;
          const offset = -Math.PI / 2 + gapAngle / 2;

          for (let i = 0; i < breakCount; i++) {
            const start = offset + i * step;
            const end = start + drawAngle;
            ctx.beginPath();
            ctx.arc(0, 0, r, start, end, false);
            ctx.stroke();
          }
        } else {
          tracePath(inset);
          ctx.stroke();
        }
      };

      if (style === "scalloped" && frameShape === "circle") {
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

  useEffect(() => {
    const hydratedLayers = (Array.isArray(config?.layers) ? config.layers : []).map((layer) => ({
      ...layer,
      imageObj: layerImages[layer.id] || null,
    }));
    drawStampOnCanvas(ref.current, {
      ...config,
      layers: hydratedLayers,
      inkColor: config.inkColor || STAMP_INK_BLUE,
      logo: logoImg,
    }, size);
  }, [config, logoImg, layerImages, size]);

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
const Label = ({ children, style }) => <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.inkSoft, marginBottom: 4, ...style }}>{children}</div>;
const Field = (props) => <input {...props} style={{ width: "100%", background: C.white, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.ink, marginBottom: 12, fontFamily: font.body, outline: "none", ...props.style }} />;
const Select = ({ children, ...props }) => <select {...props} style={{ width: "100%", background: C.white, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.ink, marginBottom: 12, fontFamily: font.body }}>{children}</select>;
const Card = ({ children, style }) => <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, ...style }}>{children}</div>;
const Btn = ({ children, variant = "solid", ...props }) => {
  const styles = variant === "ghost" ? { background: "transparent", color: C.ink, border: `1.5px solid ${C.ink}` } : { background: C.headerGreen, color: C.white, border: "none" };
  return <button {...props} style={{ ...styles, padding: "10px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13.5, fontFamily: font.body, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, ...props.style }}>{children}</button>;
};
const Tag = ({ children, tone = "in" }) => <span style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", background: tone === "in" ? "#EAF2FF" : "#F3E0DC", color: tone === "in" ? C.sage : C.stampDark }}>{children}</span>;

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
const SIDEBAR_W = 210;

/* ================= APP SHELL ================= */
const TABS_ADMIN = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "entry", label: "Stamp Entry", icon: PenSquare },
  { id: "create", label: "Create Stamp", icon: Wand2 },
  { id: "orders", label: "Orders", icon: Inbox },
  { id: "register", label: "Register", icon: BookOpen },
  { id: "stock", label: "Stock", icon: Package },
  { id: "rubber", label: "Rubber", icon: Stamp },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "ledger", label: "Cash Register", icon: Wallet },
  { id: "users", label: "Users", icon: Users },
  
];
const TABS_STAFF = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "entry", label: "Stamp Entry", icon: PenSquare },
  { id: "create", label: "Create Stamp", icon: Wand2 },
  { id: "orders", label: "Orders", icon: Inbox },
  { id: "register", label: "Register", icon: BookOpen },
  { id: "stock", label: "Stock", icon: Package },
  { id: "ledger", label: "Cash Register", icon: Wallet },
  
];

// On the mobile bottom bar these tabs collapse into a single "More" button
// so the bar doesn't get crowded — the desktop sidebar still shows all tabs.
const MORE_TAB_IDS = ["stock", "rubber", "purchase", "ledger", "users"];

function SharmaJiStampsAdmin() {
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
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem("sjs_active_tab") || "dashboard"; } catch { return "dashboard"; }
  });
  useEffect(() => {
    try { localStorage.setItem("sjs_active_tab", tab); } catch {}
  }, [tab]);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("sjs_theme_id");
      if (saved && THEME_PALETTES[saved]) return saved;
      return localStorage.getItem("sjs_theme") === "dark" ? "grey-white-dark" : "green-olive";
    } catch { return "green-olive"; }
  });
  C = THEME_PALETTES[theme] || LIGHT_C;
  useEffect(() => {
    try { localStorage.setItem("sjs_theme_id", theme); localStorage.setItem("sjs_theme", theme === "grey-white-dark" ? "dark" : "light"); } catch {}
  }, [theme]);
  const toggleTheme = () => setTheme((v) => {
    const i = THEME_OPTIONS.findIndex((x) => x.id === v);
    return THEME_OPTIONS[(i + 1) % THEME_OPTIONS.length].id;
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const editOrder = (order) => { setOrderToEdit(order); setTab("create"); };
  const [editorActive, setEditorActive] = useState(false);
  // Reset if the user navigates away from Create Stamp by any other route
  // (bottom nav, back gesture) so a stale "editor open" state can't linger.
  useEffect(() => { if (tab !== "create" && editorActive) setEditorActive(false); }, [tab]);
  const [entryToFill, setEntryToFill] = useState(null);
  const billOrder = (order) => {
    setEntryToFill({
      rubberId: order.config?.rubberId || null,
      mobile: order.customer_mobile || "",
      remarks: order.customer_name ? `Order: ${order.customer_name}` : "",
    });
    setTab("entry");
  };

  // Back button / swipe-back gesture: whenever the user leaves the dashboard
  // (opens any other tab, or opens the More sheet), push one history entry so
  // the phone's back action is caught here first and just returns to the
  // dashboard, instead of exiting the app straight away.
  const wasHomeRef = useRef(true);
  useEffect(() => {
    const isHome = tab === "dashboard" && !moreOpen;
    if (wasHomeRef.current && !isHome) {
      window.history.pushState({ sjsAway: true }, "");
    }
    wasHomeRef.current = isHome;
  }, [tab, moreOpen]);
  useEffect(() => {
    const onPopState = () => {
      setMoreOpen(false);
      setTab("dashboard");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [users, setUsers] = useState([]);
  const [rubbers, setRubbers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [entries, setEntries] = useState([]);
  const [cashManual, setCashManual] = useState([]);

  // Guards against a race condition: if refreshAll() gets called again
  // before an earlier call's network requests finish (e.g. adding an entry
  // right after opening the app), the earlier, slower call could resolve
  // LAST and overwrite the screen with stale data — showing the fresh
  // numbers for a moment, then reverting to the old ones. Only the result
  // of the most recently started refresh is ever applied.
  const refreshSeqRef = useRef(0);
  const refreshAll = async () => {
    const mySeq = ++refreshSeqRef.current;
    try {
      const [u, r, p, e, c] = await Promise.all([
        dbGet("users"), dbGet("rubbers"), dbGet("purchases"), dbGet("stamp_entries"), dbGet("cash_manual"),
      ]);
      if (mySeq !== refreshSeqRef.current) return; // a newer refresh has since started — ignore this stale result
      setUsers(u); setRubbers(r); setPurchases(p); setEntries(e); setCashManual(c);
      setDbError("");
    } catch (e) {
      if (mySeq === refreshSeqRef.current) setDbError("Could not connect to the database. Check SUPABASE_URL / SUPABASE_KEY at the top of the file, and that the SQL schema has been run.");
    } finally {
      if (mySeq === refreshSeqRef.current) setLoading(false);
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
  const primaryTabs = tabs.filter((t) => !MORE_TAB_IDS.includes(t.id));
  const moreTabs = tabs.filter((t) => MORE_TAB_IDS.includes(t.id));
  const moreActive = moreTabs.some((t) => t.id === tab);

  const tabContent = (
    <>
      {tab === "dashboard" && <DashboardTab rubbers={rubbers} purchases={purchases} entries={entries} cashManual={cashManual} stockByRubber={stockByRubber} user={user} />}
      {tab === "entry" && <StampEntryTab rubbers={rubbers} entries={entries} refresh={refreshAll} user={user} initialFill={entryToFill} onFillConsumed={() => setEntryToFill(null)} />}
      {tab === "create" && <CreateStampTab rubbers={rubbers} initialOrder={orderToEdit} onOrderConsumed={() => setOrderToEdit(null)} onEditorActiveChange={setEditorActive} theme={theme} onThemeChange={setTheme} />}
      {tab === "orders" && <OrdersTab onEditOrder={editOrder} onBillOrder={billOrder} />}
      {tab === "register" && <StampRegisterTab entries={entries} rubbers={rubbers} refresh={refreshAll} />}
      {tab === "stock" && <StockTab rubbers={rubbers} stockByRubber={stockByRubber} />}
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
        <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, width: SIDEBAR_W, background: C.headerGreen, color: C.white, display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "2px 0 12px rgba(36,95,196,.12)" }}>
          <div style={{ padding: "22px 18px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
            <StampMark size={32} />
            <div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, lineHeight: 1.15 }}>Sharma Ji Stamps</div>
              <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: 1, color: "#DCE9FF", marginTop: 3 }}>{user.name.toUpperCase()} · {user.role.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {tabs.map((t) => {
              const Icon = t.icon; const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: active ? "rgba(255,255,255,0.14)" : "none", border: "none", borderRadius: 8, padding: "10px 12px", cursor: "pointer", color: active ? C.white : "#EAF2FF", fontFamily: font.body, fontSize: 13.5, textAlign: "left" }}>
                  <Icon size={17} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <button onClick={toggleTheme} style={{ margin: "0 14px 8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 8, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: font.body, fontSize: 12.5, padding: "9px 0" }}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />} {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={logout} style={{ margin: 14, background: "none", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 8, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: font.body, fontSize: 12.5, padding: "9px 0" }}><LogOut size={15} /> Logout</button>
        </div>

        {/* ---- desktop content ---- */}
        <div style={{ marginLeft: SIDEBAR_W, minHeight: "100vh" }}>
          <div style={{ padding: editorActive ? 0 : "18px 18px 34px", width: "100%", maxWidth: editorActive ? "none" : 1320, margin: editorActive ? 0 : "0 auto" }}>
            {tabContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      {!editorActive && (
        <div style={{ background: C.headerGreen, color: C.white, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StampMark size={30} />
            <div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, lineHeight: 1 }}>Sharma Ji Stamps</div>
              <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1, color: "#DCE9FF", marginTop: 2 }}>{user.name.toUpperCase()} · {user.role.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={toggleTheme} title={theme === "dark" ? "Light Mode" : "Dark Mode"} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 8, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34 }}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={logout} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: font.body, fontSize: 12 }}><LogOut size={16} /> Logout</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: editorActive ? 0 : "16px 16px 90px", maxWidth: 760, width: "100%", margin: "0 auto" }}>
        {tabContent}
      </div>

      {!editorActive && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.line}`, display: "flex", overflowX: "auto", zIndex: 20 }}>
          {primaryTabs.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setMoreOpen(false); }} style={{ flex: "1 0 auto", minWidth: 70, background: "none", border: "none", padding: "10px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? C.stamp : C.inkSoft }}>
                <Icon size={18} />
                <span style={{ fontSize: 10, fontFamily: font.mono, letterSpacing: 0.5 }}>{t.label}</span>
              </button>
            );
          })}
          {moreTabs.length > 0 && (
            <button onClick={() => setMoreOpen((v) => !v)} style={{ flex: "1 0 auto", minWidth: 70, background: "none", border: "none", padding: "10px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: moreOpen || moreActive ? C.stamp : C.inkSoft }}>
              <MoreHorizontal size={18} />
              <span style={{ fontSize: 10, fontFamily: font.mono, letterSpacing: 0.5 }}>More</span>
            </button>
          )}
        </div>
      )}

      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(38,50,65,0.35)", zIndex: 25 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, boxShadow: "0 -4px 20px rgba(38,50,65,0.18)", padding: "10px 10px 22px", zIndex: 30 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.line, margin: "2px auto 12px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {moreTabs.map((t) => {
                const Icon = t.icon; const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setMoreOpen(false); }} style={{ background: active ? "#EAF2FF" : C.paper, border: `1px solid ${active ? C.stamp : C.line}`, borderRadius: 10, padding: "14px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: active ? C.stamp : C.ink }}>
                    <Icon size={20} />
                    <span style={{ fontSize: 11, fontFamily: font.mono, letterSpacing: 0.3, textAlign: "center" }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= CUSTOMER DESIGNER ================= */
function CustomerDesigner() {
  const [rubbers, setRubbers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await dbGet("rubbers");
        if (!cancelled) setRubbers(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setError("Stamp sizes could not be loaded. The default size is still available.");
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink }}>
      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "12px 10px 70px" }}>
        <div style={{ marginBottom: 10, textAlign: "center" }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 21 }}>Sharma Ji Stamps</div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkSoft, letterSpacing: 1.2 }}>CUSTOMER STAMP DESIGNER</div>
        </div>
        {error && <div style={{ marginBottom: 8, padding: 9, background: "#FFF4E5", border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11.5, color: C.inkSoft }}>{error}</div>}
        <CreateStampTab rubbers={rubbers} customerMode />
      </div>
    </div>
  );
}

/* ================= HOME PAGE (public landing page at "/") ================= */
const SHOP_PHONE = "9899029807";
const SHOP_PHONE_DISPLAY = "98990 29807";
const SHOP_EMAIL = "sharmajikaoffice@gmail.com";
const SHOP_ADDRESS = "Dayalpur, 33 Ft Road, near Akashdeep School, North East Delhi – 110094";
const SHOP_MAPS_URL = "https://maps.app.goo.gl/V2vbYqJkxq8sJrnh9";

// Product photos live in /public/images — see the PR description for the
// exact files to drop in there. Falls back gracefully (broken-image icon
// only) if a file is missing, so this won't crash the build either way.
const PRODUCTS = [
  { img: "/images/stamp-selfink-set.jpg", title: "Self-inking stamps", text: "Ink pad built in. Press and stamp — thousands of impressions before re-inking." },
  { img: "/images/stamp-blue-flash.jpg", title: "Pre-inked flash stamps", text: "No pad, no lines — a clean, solid impression every time. Good for logos and fine detail." },
  { img: "/images/stamp-square-blue.jpg", title: "Round & square seals", text: "Company, society, school and clinic seals — name curved around the ring." },
  { img: "/images/stamp-boxed.jpg", title: "Address & GST stamps", text: "Firm name, full address, GSTIN and phone in one block." },
  { img: "/images/stamp-white-desk.jpg", title: "Signature & name stamps", text: "Send a clear photo of your signature — we trace it and cut it exactly." },
  { img: "/images/stamp-handle-red.jpg", title: "Handle stamps & ink pads", text: "The classic wood-handle stamp with a separate pad. Pads and refill ink in stock." },
];

function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink, display: "flex", flexDirection: "column" }}>
      <div style={{ background: C.headerGreen, color: C.white, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StampMark size={32} />
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18 }}>Sharma Ji Stamps</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href={`tel:+91${SHOP_PHONE}`} style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 8, color: C.white, textDecoration: "none", fontFamily: font.body, fontWeight: 600, fontSize: 13, padding: "9px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}>
            📞 {SHOP_PHONE_DISPLAY}
          </a>
          <a href="/login" style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 8, color: C.white, textDecoration: "none", fontFamily: font.body, fontWeight: 600, fontSize: 13, padding: "9px 16px" }}>
            Staff Login
          </a>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px 40px", textAlign: "center" }}>
        <StampMark size={90} />
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 34, marginTop: 18, maxWidth: 620, lineHeight: 1.2 }}>
          Custom Rubber Stamps, Made the Traditional Way
        </div>
        <div style={{ fontFamily: font.body, fontSize: 15, color: C.inkSoft, marginTop: 14, maxWidth: 520, lineHeight: 1.6 }}>
          Round, square and rectangle office stamps — company seals, address stamps, signature stamps and more. Design it online, we print and deliver.
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/customer" style={{ background: C.headerGreen, color: C.white, border: "none", borderRadius: 10, textDecoration: "none", fontFamily: font.body, fontWeight: 700, fontSize: 14.5, padding: "14px 26px", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Wand2 size={17} /> Design Your Own Stamp
          </a>
          <a href={`tel:+91${SHOP_PHONE}`} style={{ background: "transparent", color: C.headerGreen, border: `1.5px solid ${C.headerGreen}`, borderRadius: 10, textDecoration: "none", fontFamily: font.body, fontWeight: 700, fontSize: 14.5, padding: "14px 26px", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Users size={17} /> Call {SHOP_PHONE_DISPLAY}
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginTop: 56, maxWidth: 880, width: "100%" }}>
          {[
            { icon: Stamp, title: "Every Shape & Size", text: "Round, square and rectangle stamps for any business need." },
            { icon: Wand2, title: "Design Online", text: "Preview your exact stamp layout before it's made." },
            { icon: Package, title: "Quality Rubber", text: "Durable, sharp, long-lasting impressions every time." },
          ].map((f) => (
            <div key={f.title} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "22px 18px", textAlign: "left" }}>
              <f.icon size={22} color={C.headerGreen} />
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, marginTop: 12 }}>{f.title}</div>
              <div style={{ fontFamily: font.body, fontSize: 12.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.5 }}>{f.text}</div>
            </div>
          ))}
        </div>

        {/* ---- product photos ---- */}
        <div style={{ marginTop: 72, maxWidth: 1000, width: "100%", textAlign: "left" }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 24 }}>What we make</div>
          <div style={{ fontFamily: font.body, fontSize: 13.5, color: C.inkSoft, marginTop: 6, maxWidth: 560 }}>
            Bring us the text, a card, or a GST certificate — we set it and cut it. Call for a quick quote on size and price.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, marginTop: 24 }}>
            {PRODUCTS.map((p) => (
              <div key={p.title} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ aspectRatio: "4/3", background: C.paperDark, overflow: "hidden" }}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ padding: "14px 16px 18px" }}>
                  <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15 }}>{p.title}</div>
                  <div style={{ fontFamily: font.body, fontSize: 12.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.5 }}>{p.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- visit / contact ---- */}
        <div style={{ marginTop: 72, maxWidth: 640, width: "100%", background: C.white, border: `1px solid ${C.line}`, borderRadius: 14, padding: "28px 26px", textAlign: "left" }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22 }}>Visit the shop</div>
          <div style={{ fontFamily: font.body, fontSize: 13.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.6 }}>
            Walk in with your details and most stamps are ready while you wait.
          </div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Label>Address</Label>
              <div style={{ fontFamily: font.body, fontSize: 14.5 }}>{SHOP_ADDRESS}</div>
            </div>
            <div>
              <Label>Phone</Label>
              <a href={`tel:+91${SHOP_PHONE}`} style={{ fontFamily: font.body, fontSize: 14.5, color: C.headerGreen, textDecoration: "none" }}>+91 {SHOP_PHONE_DISPLAY}</a>
            </div>
            <div>
              <Label>Email</Label>
              <a href={`mailto:${SHOP_EMAIL}`} style={{ fontFamily: font.body, fontSize: 14.5, color: C.headerGreen, textDecoration: "none" }}>{SHOP_EMAIL}</a>
            </div>
          </div>
          <a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer" style={{ marginTop: 20, background: C.headerGreen, color: C.white, border: "none", borderRadius: 10, textDecoration: "none", fontFamily: font.body, fontWeight: 700, fontSize: 13.5, padding: "12px 20px", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Open in Google Maps
          </a>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "18px", fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft, borderTop: `1px solid ${C.line}` }}>
        © {new Date().getFullYear()} Sharma Ji Stamps · Dayalpur, North East Delhi · +91 {SHOP_PHONE_DISPLAY}
      </div>
    </div>
  );
}

function SharmaJiStamps() {
  const path = typeof window !== "undefined" ? window.location.pathname.replace(/\/$/, "") : "";
  if (path === "/customer") return <CustomerDesigner />;
  if (path === "") return <HomePage />; // root "/" — public landing page
  return <SharmaJiStampsAdmin />; // "/login" and everything else — staff login + app
}

export default SharmaJiStamps;

/* ================= ORDERS (customer submissions) ================= */
// Customer designs come in via the public /customer designer and land in the
// "customer_designs" Supabase table (status: new -> accepted -> printed).
// This tab is how staff accept them, open the design in the normal editor to
// tweak it, and print it — same editor, just pre-loaded with the customer's config.
function OrdersTab({ onEditOrder, onBillOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("new");

  const load = async () => {
    setLoading(true);
    try {
      const rows = await dbGet("customer_designs");
      setOrders(Array.isArray(rows) ? rows : []);
      setError("");
    } catch {
      setError("Could not load customer orders. Make sure the \"customer_designs\" table exists in Supabase (see setup notes).");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (order, status) => {
    try {
      await dbUpdate("customer_designs", order.id, { status });
      await load();
    } catch (err) {
      setError(`Could not update this order — ${err.message || "check that the Supabase update policy was run on customer_designs."}`);
    }
  };
  const remove = async (order) => {
    try {
      await dbDelete("customer_designs", order.id);
      await load();
    } catch (err) {
      setError(`Could not delete this order — ${err.message || "check the Supabase delete policy on customer_designs."}`);
    }
  };

  const shown = orders.filter((o) => filter === "all" || (o.status || "new") === filter);
  const counts = { new: 0, accepted: 0, printed: 0 };
  orders.forEach((o) => { const s = o.status || "new"; if (counts[s] !== undefined) counts[s]++; });

  return (
    <div>
      <SectionTitle icon={Inbox} title="Customer Orders" />
      {error && <div style={{ marginBottom: 10, padding: 9, background: "#FFF4E5", border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11.5, color: C.inkSoft }}>{error}</div>}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[["new", `New (${counts.new})`], ["accepted", `Accepted (${counts.accepted})`], ["printed", `Printed (${counts.printed})`], ["all", "All"]].map(([id, label]) => (
          <Btn key={id} variant={filter === id ? "solid" : "ghost"} onClick={() => setFilter(id)} style={{ padding: "6px 12px", fontSize: 12 }}>{label}</Btn>
        ))}
      </div>
      {loading && <EmptyNote text="Loading orders…" />}
      {!loading && shown.length === 0 && <EmptyNote text="No orders here." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
        {shown.map((o) => (
          <Card key={o.id} style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <TemplateThumb config={o.config || {}} size={120} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{o.customer_name}</div>
            <div style={{ fontFamily: font.mono, fontSize: 11.5, color: C.inkSoft, marginBottom: 4 }}>{o.customer_mobile}</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 6 }}>{o.design_name}</div>
            <div style={{ marginBottom: 8 }}><Tag tone={o.status === "printed" ? "in" : "out"}>{o.status || "new"}</Tag></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(o.status || "new") === "new" && (
                <Btn onClick={() => setStatus(o, "accepted")} style={{ justifyContent: "center", width: "100%", background: "#2D7A4A" }}>
                  <Check size={14} /> Accept
                </Btn>
              )}
              <Btn onClick={() => { onEditOrder(o); if ((o.status || "new") === "new") setStatus(o, "accepted"); }} style={{ justifyContent: "center", width: "100%" }}>
                <PenSquare size={14} /> Edit & Print
              </Btn>
              <div style={{ display: "flex", gap: 6 }}>
                {(o.status || "new") !== "printed" && (
                  <Btn variant="ghost" onClick={() => setStatus(o, "printed")} style={{ flex: 1, justifyContent: "center", padding: "6px 8px", fontSize: 11.5 }}>
                    <Check size={13} /> Printed
                  </Btn>
                )}
                <button onClick={() => remove(o)} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, color: C.stamp, cursor: "pointer", padding: "6px 10px" }}><Trash2 size={14} /></button>
              </div>
              {(o.status || "new") !== "new" && (
                <Btn variant="ghost" onClick={() => onBillOrder(o)} style={{ justifyContent: "center", width: "100%", padding: "6px 8px", fontSize: 11.5 }}>
                  <Wallet size={13} /> Make Bill
                </Btn>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ================= STAMP ENTRY ================= */
function StampEntryTab({ rubbers, entries, refresh, user, initialFill, onFillConsumed }) {
  // Stamp entries are always against a "Rubber" category item (the actual
  // impression stock) — Raw material and Machine items shouldn't show up
  // here, they're only relevant on the Item Master / Purchases screens.
  const rubberOnly = rubbers.filter((r) => String(r.category || "rubber").toLowerCase() === "rubber");
  const [date, setDate] = useState(todayISO());
  const [rubberId, setRubberId] = useState(rubberOnly[0]?.id || "");
  const [mobile, setMobile] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Pre-fill this entry when staff taps "Make Bill" on an accepted/printed
  // customer order — same customer, same rubber/size they ordered.
  useEffect(() => {
    if (!initialFill) return;
    if (initialFill.rubberId) setRubberId(initialFill.rubberId);
    if (initialFill.mobile) setMobile(initialFill.mobile);
    if (initialFill.remarks) setRemarks(initialFill.remarks);
    if (onFillConsumed) onFillConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFill]);

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
      await dbInsert("stamp_entries", { id: uid(), date, rubber_id: rubberId, mobile, qty: 1, rate, discount: Number(discount || 0), amount, payment_mode: paymentMode, remarks, by_user: user.name, image_url });
      setMobile(""); setDiscount(0); setPaymentMode("Cash"); setRemarks(""); setPhotoFile(null); setPhotoPreview(null);
      setSavedMsg(`Saved — Stock −1, ${paymentMode} In ${inr(amount)}`);
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
          <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtDate(e.date)} · {e.mobile || "no mobile"} · {e.payment_mode || "Cash"}</div>
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
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              {rubber?.photo_url ? (
                <img src={rubber.photo_url} alt={rubber.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.line}`, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: C.paperDark, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Package size={18} color={C.brass} />
                </div>
              )}
              <Select value={rubberId} onChange={(e) => setRubberId(e.target.value)} style={{ marginBottom: 0, flex: 1 }}>
                {rubberOnly.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </div>
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
            <Label>Payment Mode</Label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["Cash", "Bank"].map((mode) => (
                <Btn key={mode} variant={paymentMode === mode ? "solid" : "ghost"} onClick={() => setPaymentMode(mode)} style={{ flex: 1, justifyContent: "center" }}>{mode === "Cash" ? "💵 Cash" : "🏦 Bank"}</Btn>
              ))}
            </div>
            <Label>Stamp Impression Image</Label>
            <label style={{ display: "block", border: `1px dashed ${C.brass}`, borderRadius: 8, padding: "16px", textAlign: "center", color: C.brass, fontSize: 13, marginBottom: 12, cursor: "pointer", overflow: "hidden" }}>
            {photoPreview ? (
            <img src={photoPreview} alt="Stamp impression" style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 6 }} />
              ) : (
            "📷 Tap to capture / upload impression"
            )}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
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
function parseRubberSize(sizeText) {
  const raw = String(sizeText ?? "").trim().toLowerCase().replace(/,/g, ".");
  const values = raw.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (!values.length) return null;
  const widthMm = values[0];
  const heightMm = values[1] ?? values[0];
  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm <= 0 || heightMm <= 0) return null;
  return { widthMm, heightMm };
}

function rubberSizeKey(sizeText) {
  const parsed = parseRubberSize(sizeText);
  return parsed ? `${parsed.widthMm}x${parsed.heightMm}` : String(sizeText ?? "").trim().toLowerCase();
}

function CreateStampTab({ rubbers = [], customerMode = false, initialOrder = null, onOrderConsumed, onEditorActiveChange, theme = "green-olive", onThemeChange }) {
  const isDesktop = useIsDesktop();
  const canvasRef = useRef(null);
  const logoInputRef = useRef(null);
  const [view, setView] = useState(() => {
    try { return localStorage.getItem("sjs_create_view") === "editor" ? "editor" : "templates"; } catch { return "templates"; }
  }); // "templates" | "editor"
  useEffect(() => {
    try { localStorage.setItem("sjs_create_view", view); } catch {}
  }, [view]);
  const [designStartTab, setDesignStartTab] = useState("templates"); // "templates" | "recent"
  // Let the app shell know when the full-screen editor (with its own top
  // toolbar and bottom Layer/Edit/Size/Submit bar) is open, so it can hide
  // its own header and bottom nav instead of stacking on top of these.
  useEffect(() => {
    onEditorActiveChange?.(view === "editor");
    return () => onEditorActiveChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  const [pickShape, setPickShape] = useState("circle");
  const [mobileEditorPanel, setMobileEditorPanel] = useState("edit");
  // "New Stamp" first asks for a size (with a price shown per size) instead of
  // dropping straight into the 4-tab editor blind. This just controls whether
  // that size-picker overlay is showing.
  const [sizePickerOpen, setSizePickerOpen] = useState(false);

  const [shape, setShape] = useState("circle");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [centerLine1, setCenterLine1] = useState("");
  const [centerLine2, setCenterLine2] = useState("");
  const [topTextSize, setTopTextSize] = useState(12);
  const [bottomTextSize, setBottomTextSize] = useState(12);
  const [centerTextSize, setCenterTextSize] = useState(16);
  const [centerText2Size, setCenterText2Size] = useState(11);
  const [rectLine1, setRectLine1] = useState("");
  const [rectLine2, setRectLine2] = useState("");
  const [rectLine3, setRectLine3] = useState("");
  const [borderStyle, setBorderStyle] = useState("double");
  const [texture, setTexture] = useState(true);
  const [radius, setRadius] = useState(138);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [letterSpacing, setLetterSpacing] = useState(2.5);
  const [logo, setLogo] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [plateSize, setPlateSize] = useState(38);
  const [selectedRubberId, setSelectedRubberId] = useState("");
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerSubmitStatus, setCustomerSubmitStatus] = useState("");

  // Mobile UX: remember scroll direction so the editor header can hide while
  // scrolling up and reappear while scrolling down.
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  useEffect(() => {
    if (isDesktop) return;
    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = y - lastScrollYRef.current;
      if (Math.abs(delta) < 4) return;
      setMobileHeaderVisible(delta <= 0 || y < 24);
      lastScrollYRef.current = y;
    };
    lastScrollYRef.current = window.scrollY || 0;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isDesktop]);

  // Extra layers added from the toolbar (Text / Shapes / Line / Images) — each becomes its own tab.
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [layerCounter, setLayerCounter] = useState(0);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const AUTOSAVE_KEY = "sjs_stamp_draft_v2";
  const [layerFilter, setLayerFilter] = useState("All");
  // Editor history: keep layer edits reversible without storing live Image objects.
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const historyLockRef = useRef(false);
  const dragRef = useRef(null);
  const layerImageInputRef = useRef(null);
  const layerVectorInputRef = useRef(null);

  const LAYER_TYPE_NAMES = { circleText: "Text around the circle", centerText: "Text in the centre", frame: "Frame", line: "Line", image: "Image" };
  const FRAME_SHAPE_NAMES = { circle: "Circle", square: "Square", triangle: "Triangle" };
  // Text layers show their own typed content as the name (renaming the text
  // field renames the layer everywhere it's listed); other layer types keep
  // the generic "<type> #n" label since they have no text to show.
  const layerLabel = (l) => {
    if (l.type === "circleText" || l.type === "centerText") {
      const t = (l.text || "").trim();
      return `${t || LAYER_TYPE_NAMES[l.type]}${l.locked ? " 🔒" : ""}`;
    }
    const base = l.type === "frame" ? FRAME_SHAPE_NAMES[l.shape || "circle"] : LAYER_TYPE_NAMES[l.type];
    return `${base} #${l.num}${l.locked ? " 🔒" : ""}`;
  };
  const layerTypeMatchesFilter = (layer, filter) => {
    if (filter === "All") return true;
    if (filter === "Text") return layer.type === "circleText" || layer.type === "centerText";
    if (filter === "Shape") return layer.type === "frame" || layer.type === "line";
    return layer.type === "frame" || layer.type === "line" || layer.type === "image";
  };
  const rubberSizes = useMemo(() => {
    // Show EVERY rubber stamp item from Item Master.
    // Do not remove items just because two stamps have the same impression size:
    // they can have different names, photos, rates, stock, etc.
    return rubbers
      .filter((r) => String(r.category || "rubber").trim().toLowerCase() === "rubber" && r.size)
      .map((r) => {
        const parsed = parseRubberSize(r.size);
        return { ...r, parsed };
      })
      .filter((r) => r.parsed);
  }, [rubbers]);

  const selectedRubber = rubbers.find((r) => r.id === selectedRubberId) || rubberSizes[0] || null;
  const selectedDimensions = parseRubberSize(selectedRubber?.size) || { widthMm: Number(plateSize) || 38, heightMm: Number(plateSize) || 38 };
  const editorAspect = selectedDimensions.heightMm / selectedDimensions.widthMm;
  const editorWidth = STAMP_CANVAS_SIZE;
  const editorHeight = Math.max(80, Math.round(editorWidth * editorAspect));
  // Scale the visible stamp boundary according to the selected rubber size.
  // The largest configured size uses the full editor width; smaller sizes are
  // visibly smaller, while preserving the selected size's width/height ratio.
  const maxConfiguredStampWidthMm = Math.max(
    1,
    ...rubberSizes.map((r) => Number(r.parsed?.widthMm) || 0)
  );
  const selectedStampPreviewWidth = Math.max(60, Math.min(175, Math.round(
    250 * ((Number(selectedDimensions.widthMm) || 1) / maxConfiguredStampWidthMm) * 0.7
  )));
  const selectedStampPreviewHeight = Math.max(80, Math.round(
    selectedStampPreviewWidth * editorAspect
  ));

  // How tall the mobile preview area itself should be, not just the dashed
  // stamp boundary inside it — small stamps get a smaller preview panel
  // instead of a small box floating inside a big empty grid.
  const mobileCanvasAreaHeight = Math.max(170, Math.min(330, Math.round(selectedStampPreviewHeight) + 90));

  const cleanLayersForHistory = (ls) => ls.map((l) => ({ ...l, imageObj: null }));
  const pushHistory = (snapshot = layers) => {
    if (historyLockRef.current) return;
    historyRef.current = [...historyRef.current.slice(-49), cleanLayersForHistory(snapshot)];
    redoRef.current = [];
  };
  const restoreLayerSnapshot = (snapshot) => {
    historyLockRef.current = true;
    const restored = snapshot.map((l) => ({ ...l, imageObj: null }));
    restored.forEach((l) => {
      if (l.imageDataUrl) {
        const img = new Image();
        img.onload = () => setLayers((ls) => ls.map((x) => x.id === l.id ? { ...x, imageObj: img } : x));
        img.src = l.imageDataUrl;
      }
    });
    setLayers(restored);
    setActiveLayerId(restored.length ? restored[restored.length - 1].id : null);
    requestAnimationFrame(() => { historyLockRef.current = false; });
  };
  const undoLayers = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    redoRef.current.push(cleanLayersForHistory(layers));
    restoreLayerSnapshot(prev);
  };
  const redoLayers = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(cleanLayersForHistory(layers));
    restoreLayerSnapshot(next);
  };

  const addLayer = (type, opts = {}) => {
    pushHistory();
    const num = layerCounter + 1;
    const id = uid();
    let layer = { id, type, num };
    if (type === "circleText") {
      layer = { ...layer, text: "YOUR COMPANY NAME", radius: 130, spacing: 4, start: 90, fontFamily: "Arial", fontSize: 13, bold: false, flipX: false, fontStyle: "normal", tall: false, invert: false, layout: "topArc" };
    } else if (type === "centerText") {
      const isFirstAddText = layers.length === 0;
      const isLandscapeStamp = Number(selectedDimensions.widthMm) > Number(selectedDimensions.heightMm);

      // For a landscape/rectangular stamp, the very first Add Text inserts
      // the two-line starting layout requested by the user. Once any layer
      // exists (shape, image, symbol, etc.), Add Text inserts only one line.
      if (isFirstAddText && isLandscapeStamp) {
        const firstId = id;
        const secondId = uid();
        const first = {
          ...layer,
          id: firstId, num, source: "addText",
          text: "For your company name pvt ltd", size: 13, fontFamily: "Arial", fontSize: 13,
          bold: false, flipX: false, x: 50, y: 36, rotation: 0, fontStyle: "normal",
          tall: false, invert: false, layout: "center"
        };
        const second = {
          id: secondId, type: "centerText", num: num + 1, source: "addText",
          text: "Auth. Sign.", size: 13, fontFamily: "Arial", fontSize: 13,
          bold: false, flipX: false, x: 50, y: 64, rotation: 0, fontStyle: "normal",
          tall: false, invert: false, layout: "center"
        };
        setLayerCounter(num + 1);
        setLayers((ls) => [...ls, first, second]);
        setActiveLayerId(firstId);
        return;
      }

      layer = { ...layer, text: "CENTRAL TEXT", size: 16, fontFamily: "Arial", fontSize: 16, bold: false, flipX: false, x: 50, y: 50, rotation: 0, fontStyle: "normal", tall: false, invert: false, layout: "center", source: "addText" };
    } else if (type === "frame") {
      const shape = opts.shape || "circle";
      const existingCount = layers.filter((l) => l.type === "frame" && (l.shape || "circle") === shape).length;

      // Frame geometry is based on the selected stamp canvas. Rectangle/Square
      // gets a true stamp-sized box (with a small safe inset), while circle and
      // triangle stay proportional to the available canvas.
      const radius = Math.max(30, 100 - existingCount * 16);
      const dim = shape === "square"
        ? Math.max(10, 92 - existingCount * 8)
        : Math.max(10, 45 - existingCount * 7);

      layer = {
        ...layer,
        radius,
        width: dim,
        height: dim,
        strokeWidth: 4,
        lineBreak: 0,
        // A newly inserted circle is always an outline. Scalloped is still
        // available as an explicit border-style choice in the editor.
        borderStyle: "single",
        shape,
        x: 50,
        y: 50,
        rotation: 0
      };

      if (existingCount === 0) {
        // Circle: keep the traditional curved text + centre text.
        if (shape === "circle") {
          const top = {
            id: uid(), type: "circleText", num: num + 1,
            text: "YOUR COMPANY NAME", radius: radius * 0.82, spacing: 4,
            start: 90, fontFamily: "Arial", fontSize: 13, bold: true,
            flipX: false, fontStyle: "normal", tall: false, invert: false,
            layout: "topArc"
          };
          const bottom = {
            id: uid(), type: "circleText", num: num + 2,
            text: "YOUR ADDRESS", radius: radius * 0.82, spacing: 4,
            start: 90, fontFamily: "Arial", fontSize: 13, bold: true,
            flipX: true, fontStyle: "normal", tall: false, invert: false,
            layout: "bottomArc"
          };
          const center = {
            id: uid(), type: "centerText", num: num + 3,
            text: "CENTRAL TEXT", size: 16, fontFamily: "Arial", fontSize: 16,
            bold: true, flipX: false, x: 50, y: 50, rotation: 0,
            fontStyle: "normal", tall: false, invert: false, layout: "center"
          };
          setLayerCounter(num + 3);
          setLayers((ls) => [...ls, layer, top, bottom, center]);
          setActiveLayerId(center.id);
          return;
        }

        // Triangle: three editable text layers, one parallel to each edge,
        // plus a normal centre text layer.
        if (shape === "triangle") {
          const sideTexts = [
            ["YOUR COMPANY NAME", 13, 0],
            ["YOUR ADDRESS", 11, 1],
            ["AUTHORIZED SIGNATORY", 11, 2],
          ].map(([label, fontSize, side], i) => ({
            id: uid(), type: "centerText", num: num + 1 + i,
            text: label, size: fontSize, fontFamily: "Arial", fontSize,
            bold: true, flipX: false, x: 50, y: 50, rotation: 0,
            fontStyle: "normal", tall: false, invert: false,
            layout: ["rightRotated", "bottom", "leftRotated"][side], triangleFrameId: id, triangleSide: side,
            // Triangle side text keeps its own fixed geometry. Resizing the
            // triangle frame must resize only the triangle, never the text.
            triangleTextRadius: radius
          }));
          const center = {
            id: uid(), type: "centerText", num: num + 4,
            text: "CENTRAL TEXT", size: 16, fontFamily: "Arial", fontSize: 16,
            bold: true, flipX: false, x: 50, y: 50, rotation: 0,
            fontStyle: "normal", tall: false, invert: false, layout: "center"
          };
          setLayerCounter(num + 4);
          setLayers((ls) => [...ls, layer, ...sideTexts, center]);
          setActiveLayerId(center.id);
          return;
        }

        // Rectangle/Square: ONLY the box. Do not inject curved or any other
        // automatic text layers.
        setLayerCounter(num);
        setLayers((ls) => [...ls, layer]);
        setActiveLayerId(id);
        return;
      }
    } else if (type === "line") {
      layer = { ...layer, width: 55, strokeWidth: 4, curve: 0, curveAmount: 24, arcRadius: 0, x: 50, y: 50, rotation: 0 };
    } else if (type === "image") {
      layer = { ...layer, width: 15, x: 50, y: 68, rotation: 0, imageDataUrl: null, imageObj: null };
    }
    setLayerCounter(num);
    setLayers((ls) => [...ls, layer]);
    setActiveLayerId(id);
  };

  const updateLayer = (id, patch) => {
    const target = layers.find((l) => l.id === id);
    if (!target || target.locked) return;
    if (!historyLockRef.current) pushHistory();
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLayer = (id) => {
    if (layers.find((l) => l.id === id)?.locked) return;
    pushHistory();
    setLayers((ls) => {
      const next = ls.filter((l) => l.id !== id);
      if (activeLayerId === id) setActiveLayerId(next.length ? next[next.length - 1].id : null);
      return next;
    });
  };

  const duplicateLayer = (id) => {
    const source = layers.find((l) => l.id === id);
    if (!source || source.locked) return;
    pushHistory();
    // Lines on a circle/square stamp hide the Horizontal/Vertical position
    // sliders and are meant to stay centered so their curve follows the
    // frame's geometry — nudging x/y here (as we do for every other layer,
    // to visually separate the copy from the original) pulled the curve off
    // that center and made the duplicate look shifted. Skip the nudge for
    // exactly that case; everything else keeps the usual offset.
    const positionLocked =
      (source.type === "line" && Number(source.curve ?? 0) !== 0) ||
      (source.type === "frame" && (source.shape === "circle" || source.shape === "triangle"));
    const copy = {
      ...source,
      id: uid(),
      num: layerCounter + 1,
      imageObj: source.imageObj || null,
      ...(positionLocked ? {} : { x: Math.min(100, (source.x ?? 50) + 3), y: Math.min(100, (source.y ?? 50) + 3) }),
    };
    setLayerCounter((n) => n + 1);
    setLayers((ls) => [...ls, copy]);
    setActiveLayerId(copy.id);
  };

  const moveLayerOrder = (id, direction) => {
    if (layers.find((l) => l.id === id)?.locked) return;
    const index = layers.findIndex((l) => l.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= layers.length) return;
    pushHistory();
    setLayers((ls) => {
      const next = [...ls];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const alignLayer = (id, axis, value) => {
    if (!layers.some((l) => l.id === id)) return;
    pushHistory();
    setLayers((ls) => ls.map((l) => l.id === id ? { ...l, [axis]: value } : l));
  };

  const toggleLayerLock = (id) => {
    const target = layers.find((l) => l.id === id);
    if (!target) return;
    pushHistory();
    setLayers((ls) => ls.map((l) => l.id === id ? { ...l, locked: !l.locked } : l));
  };
  const snapValue = (value) => {
    if (!snapToGrid) return value;
    const step = 5;
    const snapped = Math.round(value / step) * step;
    return Math.max(0, Math.min(100, snapped));
  };
  const activeLayer = layers.find((l) => l.id === activeLayerId) || null;
  const filteredLayers = layers.filter((l) => layerTypeMatchesFilter(l, layerFilter));

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

  // Import Vector (SVG): a plain <img>/canvas drawImage() only renders an SVG
  // at its own intrinsic size — if the file has no width/height (common for
  // icons exported with only a viewBox), browsers fall back to a tiny
  // 300×150 box and the artwork comes out blank or squashed on the stamp.
  // So before turning it into an Image we read the raw markup, borrow the
  // viewBox's own dimensions when width/height are missing, and only then
  // encode it as a data URL — after that it behaves exactly like any other
  // image layer (same size/position/rotation controls, same PNG export).
  const handleLayerVectorUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeLayer) return;
    if (!/\.svg$/i.test(file.name) && file.type !== "image/svg+xml") return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let svgText = String(ev.target.result || "");
      try {
        const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
        const svgEl = doc.documentElement;
        if (svgEl && svgEl.nodeName.toLowerCase() === "svg") {
          if (!svgEl.getAttribute("width") || !svgEl.getAttribute("height")) {
            const viewBox = svgEl.getAttribute("viewBox");
            if (viewBox) {
              const parts = viewBox.trim().split(/[\s,]+/).map(Number);
              if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                svgEl.setAttribute("width", String(parts[2]));
                svgEl.setAttribute("height", String(parts[3]));
              }
            } else {
              // No viewBox and no width/height at all — assume a square icon.
              svgEl.setAttribute("width", "512");
              svgEl.setAttribute("height", "512");
            }
          }
          svgText = new XMLSerializer().serializeToString(svgEl);
        }
      } catch {
        // If parsing fails for any reason, fall back to the original markup
        // as-is rather than blocking the import.
      }
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
      const img = new Image();
      img.onload = () => updateLayer(activeLayer.id, { imageObj: img, imageDataUrl: dataUrl });
      img.onerror = () => window.alert("Couldn't read this SVG file — try exporting it again or use a PNG instead.");
      img.src = dataUrl;
    };
    reader.readAsText(file);
  };

  // Drops one of the preloaded symbol PNGs (star / rupee / leaf …) straight
  // onto the stamp as a new image layer — no file picker needed. If an
  // image layer is already selected, reuse it instead of stacking a new one.
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);
  const addPreloadedSymbol = (src, { forceNew = false } = {}) => {
    const img = new Image();
    img.onload = () => {
      // Toolbar Symbols always create a fresh image layer. They must not depend
      // on an Image layer already being selected.
      pushHistory();
      {
        const num = layerCounter + 1;
        setLayerCounter(num);
        const id = uid();
        const layer = { id, type: "image", num, size: 15, x: 50, y: 68, rotation: 0, imageDataUrl: src, imageObj: img };
        setLayers((ls) => [...ls, layer]);
        setActiveLayerId(id);
      }
    };
    img.src = src;
    setSymbolPickerOpen(false);
  };

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");
  const [downloadHistory, setDownloadHistory] = useState([]);

  const DOWNLOAD_HISTORY_KEY = "sjs_download_history_v1";

  const loadDownloadHistory = () => {
    try {
      const raw = localStorage.getItem(DOWNLOAD_HISTORY_KEY);
      const rows = raw ? JSON.parse(raw) : [];
      setDownloadHistory(Array.isArray(rows) ? rows : []);
    } catch {
      setDownloadHistory([]);
    }
  };

  useEffect(() => {
    loadDownloadHistory();
  }, []);
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

  useEffect(() => {
    if (!selectedRubberId && rubberSizes.length) {
      setSelectedRubberId(rubberSizes[0].id);
      const d = rubberSizes[0].parsed;
      setPlateSize(d.widthMm);
    }
  }, [rubberSizes, selectedRubberId]);

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
    rectLine1, rectLine2, rectLine3, topTextSize, bottomTextSize, centerTextSize, centerText2Size, inkColor: STAMP_INK_BLUE, borderStyle, texture, logoDataUrl,
    radius, strokeWidth, letterSpacing,
    rubberId: selectedRubberId, rubberSize: selectedRubber?.size || null,
    layers: layers.map(({ imageObj, ...l }) => l),
  });

  const resetDesign = (initialShape) => {
    setShape(initialShape);
    setTopText("");
    setBottomText("");
    setCenterLine1("");
    setCenterLine2("");
    setTopTextSize(12);
    setBottomTextSize(12);
    setCenterTextSize(16);
    setCenterText2Size(11);
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

  // Actually starts the blank design once a size has been chosen (or there
  // was nothing to choose from). New Stamp must always start completely
  // blank: no frames, no stars, no hidden/default drawing and no preselected layer.
  const beginNewDesign = (rubberId) => {
    if (rubberId) {
      setSelectedRubberId(rubberId);
      const r = rubbers.find((x) => x.id === rubberId);
      const dims = parseRubberSize(r?.size);
      if (dims) setPlateSize(dims.widthMm);
    }
    resetDesign(pickShape);
    setLayers([]);
    setActiveLayerId(null);
    setLayerCounter(0);
    setMobileEditorPanel("edit");
    setSizePickerOpen(false);
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch {}
    setAutoSaveStatus("");
    setView("editor");
  };

  const startNew = () => {
    // Ask for the stamp size first (each option shown with its price) instead
    // of opening the full 4-tab editor blind. If there's nothing to choose
    // from, skip straight to the editor as before.
    if (rubberSizes.length > 0) {
      setSizePickerOpen(true);
    } else {
      beginNewDesign(null);
    }
  };

  const openTemplate = (t) => {
    const config = t.config || {};
    setShape(config.shape ?? "circle");
    setSelectedRubberId(config.rubberId ?? "");
    const templateDims = parseRubberSize(config.rubberSize);
    if (templateDims) setPlateSize(templateDims.widthMm);
    setTopText(config.topText ?? "");
    setBottomText(config.bottomText ?? "");
    setCenterLine1(config.centerLine1 ?? "");
    setCenterLine2(config.centerLine2 ?? "");
    setTopTextSize(Number(config.topTextSize ?? 12));
    setBottomTextSize(Number(config.bottomTextSize ?? 12));
    setCenterTextSize(Number(config.centerTextSize ?? 16));
    setCenterText2Size(Number(config.centerText2Size ?? 11));
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
    // Do not inject extra Frame/Circle layers when opening a template. The
    // template's saved border is already represented by its config; injecting
    // frames here made a circle unexpectedly appear and could not be removed.
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
        img.onload = () => {
          setLayers((current) => current.map((item) => item.id === l.id ? { ...item, imageObj: img } : item));
        };
        img.onerror = () => console.warn("Could not load template image layer", l.id);
        img.src = l.imageDataUrl;
      }
    });

    setMobileEditorPanel("edit");
    setView("editor");
  };

  // When an admin/staff picks "Edit & Print" on a customer order (Orders tab),
  // load that order's saved config straight into the editor, same as opening
  // a template — but never as an existing template (id: null) so "Save" below
  // offers to save it as a new template instead of overwriting something.
  useEffect(() => {
    if (!initialOrder) return;
    openTemplate({ id: null, name: initialOrder.design_name || "Customer Order", config: initialOrder.config || {} });
    setCustomerName(initialOrder.customer_name || "");
    setCustomerMobile(initialOrder.customer_mobile || "");
    if (onOrderConsumed) onOrderConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrder]);

  const openHistoryDesign = (h) => {
    openTemplate({ id: null, name: h.name || "Downloaded design", config: h.config || {} });
    setEditingTemplateId(null);
    setTemplateName("");
    setSaveStatus("");
  };

  const handleSaveTemplate = async () => {
    if (saveStatus === "saving") return;
    const name = window.prompt("Enter template name", templateName.trim() || "");
    if (name === null || !name.trim()) return;
    setTemplateName(name.trim());
    setSaveStatus("saving");
    try {
      const [saved] = await dbInsert("stamp_templates", { id: uid(), name: name.trim(), config: buildConfig() });
      if (saved?.id) setEditingTemplateId(saved.id);
      setSaveStatus("saved");
      await loadTemplates();
      setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("error");
    }
  };
  const handleUpdateTemplate = async () => {
    if (!editingTemplateId || saveStatus === "saving") return;
    const name = templateName.trim();
    if (!name) return;
    setSaveStatus("saving");
    try {
      await dbUpdate("stamp_templates", editingTemplateId, { name, config: buildConfig() });
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

  // Auto-save the current editable design locally while the user works. Images are
  // stored as data URLs, so the draft can survive a page refresh without a server table.
  useEffect(() => {
    if (view !== "editor") return;
    const timer = setTimeout(() => {
      try {
        const draft = {
          shape, topText, bottomText, centerLine1, centerLine2, rectLine1, rectLine2, rectLine3,
          topTextSize, bottomTextSize, centerTextSize, centerText2Size, borderStyle, texture, radius, strokeWidth, letterSpacing, logoDataUrl,
          rubberId: selectedRubberId, rubberSize: selectedRubber?.size || null,
          layers: cleanLayersForHistory(layers), templateName,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
        setAutoSaveStatus("Auto-saved");
      } catch {
        setAutoSaveStatus("Auto-save unavailable");
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [view, shape, topText, bottomText, centerLine1, centerLine2, rectLine1, rectLine2, rectLine3, topTextSize, bottomTextSize, centerTextSize, centerText2Size, borderStyle, texture, radius, strokeWidth, letterSpacing, logoDataUrl, selectedRubberId, selectedRubber?.size, layers, templateName]);

  useEffect(() => {
    if (!isDesktop && view !== "editor") return;
    const onKeyDown = (ev) => {
      const tag = ev.target?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select" || ev.target?.isContentEditable;
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && ev.key.toLowerCase() === "z" && !ev.shiftKey) { ev.preventDefault(); undoLayers(); return; }
      if (mod && (ev.key.toLowerCase() === "y" || (ev.key.toLowerCase() === "z" && ev.shiftKey))) { ev.preventDefault(); redoLayers(); return; }
      if (typing) return;
      if (mod && ev.key.toLowerCase() === "d" && activeLayerId) { ev.preventDefault(); duplicateLayer(activeLayerId); return; }
      if ((ev.key === "Delete" || ev.key === "Backspace") && activeLayerId) { ev.preventDefault(); removeLayer(activeLayerId); return; }
      if (!activeLayer || activeLayer.locked) return;
      const amount = ev.shiftKey ? 5 : 1;
      if (ev.key === "ArrowLeft") { ev.preventDefault(); updateLayer(activeLayer.id, { x: snapValue((activeLayer.x ?? 50) - amount) }); }
      if (ev.key === "ArrowRight") { ev.preventDefault(); updateLayer(activeLayer.id, { x: snapValue((activeLayer.x ?? 50) + amount) }); }
      if (ev.key === "ArrowUp") { ev.preventDefault(); updateLayer(activeLayer.id, { y: snapValue((activeLayer.y ?? 50) - amount) }); }
      if (ev.key === "ArrowDown") { ev.preventDefault(); updateLayer(activeLayer.id, { y: snapValue((activeLayer.y ?? 50) + amount) }); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, isDesktop, activeLayer, activeLayerId, snapToGrid, layers]);

  useEffect(() => {
    drawStampOnCanvas(canvasRef.current, {
      shape, topText, bottomText, centerLine1, centerLine2,
      rectLine1, rectLine2, rectLine3, topTextSize, bottomTextSize, centerTextSize, centerText2Size, inkColor: STAMP_INK_BLUE, borderStyle, texture, logo,
      radius, strokeWidth, letterSpacing, layers,
      width: editorWidth, height: editorHeight, pixelRatio: window.devicePixelRatio || 1,
    });
  }, [shape, topText, bottomText, centerLine1, centerLine2, rectLine1, rectLine2, rectLine3, topTextSize, bottomTextSize, centerTextSize, centerText2Size, borderStyle, texture, logo, radius, strokeWidth, letterSpacing, layers]);

  // Direct canvas dragging for movable layers. Position is stored as a percentage,
  // so the interaction remains correct at every stamp size and on mobile.
  const handleCanvasPointerDown = (e) => {
    if (!canvasRef.current || !layers.length) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * STAMP_CANVAS_SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * STAMP_CANVAS_SIZE;
    const cx = STAMP_CANVAS_SIZE / 2, cy = STAMP_CANVAS_SIZE / 2;
    const hits = layers.map((l, i) => {
      if (l.hidden || l.type === "circleText") return null;
      const x = ((l.x ?? 50) / 100) * STAMP_CANVAS_SIZE;
      const y = ((l.y ?? 50) / 100) * editorHeight;
      const d = Math.hypot(px - x, py - y);
      let hit = false;
      if (l.type === "frame") {
        const r = (l.radius ?? 100);
        hit = Math.abs(Math.hypot(px - x, py - y) - r) < Math.max(28, (l.strokeWidth ?? 4) * 3 + 12);
      } else if (l.type === "line") {
        hit = d < Math.max(24, (l.strokeWidth ?? 4) * 2 + 12);
      } else {
        const sz = ((l.size ?? 15) / 100) * STAMP_CANVAS_SIZE;
        hit = d < Math.max(30, sz * .75);
      }
      return hit ? { l, i, d } : null;
    }).filter(Boolean).sort((a,b) => a.i - b.i);
    const hit = hits[hits.length - 1];
    if (!hit) return;
    setActiveLayerId(hit.l.id);
    if (hit.l.locked) return;
    pushHistory();
    dragRef.current = { id: hit.l.id, startX: e.clientX, startY: e.clientY, x: hit.l.x ?? 50, y: hit.l.y ?? 50, rect };
    canvas.setPointerCapture?.(e.pointerId);
  };
  const handleCanvasPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
    setLayers((ls) => ls.map((l) => l.id === d.id ? { ...l, x: snapValue(d.x + dx), y: snapValue(d.y + dy) } : l));
  };
  const handleCanvasPointerUp = () => { dragRef.current = null; };

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
      if (layer.hidden) return { layer, index, score }; // Hidden layers aren't clickable on the canvas.

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
        // Frames are outlines, so their clickable area is around the actual
        // outline, not at x/y=50% (which previously made preloaded frames hard to select).
        const tolerance = Math.max(18, (layer.strokeWidth ?? 4) * 2.5 + 10);
        if ((layer.shape || "circle") === "square") {
          // Rectangle outline: distance from the point to the nearest edge.
          const halfW = (((layer.width ?? 45) / 100) * STAMP_CANVAS_SIZE) / 2;
          const halfH = (((layer.height ?? 45) / 100) * STAMP_CANVAS_SIZE) / 2;
          const dx = Math.abs(px - cx) - halfW;
          const dy = Math.abs(py - cy) - halfH;
          const edgeDist = dx < 0 && dy < 0 ? Math.min(Math.abs(dx), Math.abs(dy)) : Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
          if (edgeDist <= tolerance) score = edgeDist;
        } else {
          const frameRadius = layer.radius ?? 100;
          const r = Math.hypot(px - cx, py - cy);
          if (Math.abs(r - frameRadius) <= tolerance) {
            score = Math.abs(r - frameRadius);
          }
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

  // Shared helper: renders the current stamp design to a print-accurate PNG data URL
  // at the given DPI. Used by both "Download" (600dpi, for Word/records) and
  // "Print" (300dpi, plenty for a rubber-stamp impression, keeps the print HTML light).
  const generateStampDataUrl = (dpi = 600) => {
    const { widthMm, heightMm } = selectedDimensions;
    const pxPerMm = dpi / 25.4;
    const exportWidth = Math.max(1, Math.round(widthMm * pxPerMm));
    const exportHeight = Math.max(1, Math.round(heightMm * pxPerMm));
    const exportCanvas = document.createElement("canvas");
    drawStampOnCanvas(exportCanvas, {
      shape, topText, bottomText, centerLine1, centerLine2, rectLine1, rectLine2, rectLine3,
      topTextSize, bottomTextSize, centerTextSize, centerText2Size,
      // texture:false keeps the worn-ink speckle effect (used only in the on-screen
      // preview) out of the download — that speckle is a separate thing from the
      // stray-pixel "spots" bug and must never appear in the exported PNG.
      inkColor: "#000000", borderStyle, texture: false, logo, radius, strokeWidth, letterSpacing, layers,
      width: exportWidth, height: exportHeight, pixelRatio: 1, monochrome: true,
    });
    // Selected rubber size is maintained 1:1 here — exportWidth/exportHeight are the
    // print-accurate pixel dimensions for the chosen mm size at the given dpi.
    // Keep anti-aliased edges for a smoother, sharper print/export — binarizing
    // to pure black/transparent pixels made small text and curved edges look
    // jagged, so that step is intentionally skipped.
    const exportCtx = exportCanvas.getContext("2d");
    if (exportCtx) exportCtx.imageSmoothingQuality = "high";
    return { dataUrl: exportCanvas.toDataURL("image/png"), widthMm, heightMm };
  };

  // JPG has no transparency channel — if a transparent PNG is fed straight
  // into a JPEG encoder (or into WhatsApp/a printer's own PNG→JPG converter),
  // browsers composite the missing alpha against BLACK, not white, which is
  // exactly why the stamp's background used to turn solid black on print.
  // Fix: paint a real white rectangle first, draw the stamp on top of that,
  // and only then encode as JPEG so there is no transparency left to lose.
  const generateStampJpegDataUrl = (dpi = 600, quality = 0.95) => {
    const { dataUrl: pngDataUrl, widthMm, heightMm } = generateStampDataUrl(dpi);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL("image/jpeg", quality), widthMm, heightMm });
      };
      img.src = pngDataUrl;
    });
  };


  const generateCustomerDownloadDataUrl = () => {
    const { dataUrl, widthMm, heightMm } = generateStampDataUrl(300);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const grid = Math.max(40, Math.round(canvas.width / 12));
        ctx.strokeStyle = "rgba(60,80,100,.14)";
        ctx.lineWidth = Math.max(1, Math.round(canvas.width / 900));
        for (let x = 0; x <= canvas.width; x += grid) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += grid) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        ctx.drawImage(img, 0, 0);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.textAlign = "center";
        ctx.font = `700 ${Math.max(18, Math.round(canvas.width / 22))}px Arial`;
        ctx.fillStyle = "rgba(50,70,90,.20)";
        const gapX = Math.max(260, Math.round(canvas.width / 2.4));
        const gapY = Math.max(120, Math.round(canvas.height / 4.5));
        for (let y = -canvas.height * 2; y <= canvas.height * 2; y += gapY) {
          for (let x = -canvas.width * 2; x <= canvas.width * 2; x += gapX) {
            ctx.fillText("SHARMA JI STAMPS • PREVIEW", x, y);
          }
        }
        ctx.restore();
        resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.82), widthMm, heightMm });
      };
      img.src = dataUrl;
    });
  };

  const saveDownloadToHistory = () => {
    // Keep the editable source config, not the protected preview image.
    // This makes every downloaded design reopenable just like a template.
    const entry = {
      id: uid(),
      name: `${selectedDimensions.widthMm}×${selectedDimensions.heightMm} mm`,
      config: buildConfig(),
      created_at: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem(DOWNLOAD_HISTORY_KEY);
      const current = raw ? JSON.parse(raw) : [];
      const next = [entry, ...(Array.isArray(current) ? current : [])].slice(0, 100);
      localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(next));
      setDownloadHistory(next);
    } catch {}
  };

  const handleDeleteHistory = (id, e) => {
    e?.stopPropagation?.();
    try {
      const next = downloadHistory.filter((h) => h.id !== id);
      localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(next));
      setDownloadHistory(next);
    } catch {}
  };

  const handleDownload = async () => {
    // A normal download creates an editable history item. Customer protected
    // previews stay protected and are not stored as clean downloadable files.
    if (!customerMode) saveDownloadToHistory();
    const result = customerMode
      ? await generateCustomerDownloadDataUrl()
      : await generateStampJpegDataUrl(600);
    const link = document.createElement("a");
    link.download = `stamp-${result.widthMm}x${result.heightMm}mm${customerMode ? "-preview" : ""}.jpg`;
    link.href = result.dataUrl;
    link.click();
  };

  const handleCustomerSubmit = async () => {
    const name = customerName.trim();
    const mobile = customerMobile.trim();
    if (name.length < 2) return setCustomerSubmitStatus("Please enter your name.");
    if (!/^[0-9+ ()-]{8,20}$/.test(mobile)) return setCustomerSubmitStatus("Please enter a valid mobile number.");
    setCustomerSubmitStatus("Submitting…");
    try {
      await dbInsert("customer_designs", {
        id: uid(),
        customer_name: name,
        customer_mobile: mobile,
        design_name: `Stamp ${selectedDimensions.widthMm}x${selectedDimensions.heightMm}mm`,
        config: buildConfig(),
        status: "new",
      });
      setCustomerSubmitStatus("Design submitted successfully. Sharma Ji Stamps will contact you shortly.");
    } catch (err) {
      setCustomerSubmitStatus(err.message || "Couldn't submit design.");
    }
  };

  // Opens a clean, print-accurate preview in a new tab without printing.
  const handlePreview = async () => {
    try {
      const { dataUrl, widthMm, heightMm } = await generateStampJpegDataUrl(600);
      const previewWindow = window.open("", "_blank", "width=900,height=800");
      if (!previewWindow) return;
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Stamp Preview - ${widthMm}x${heightMm}mm</title>
            <style>
              html, body { margin:0; min-height:100%; background:#f3f6fa; font-family:Arial,sans-serif; }
              body { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:24px; box-sizing:border-box; }
              img { max-width:min(90vw,900px); max-height:80vh; width:auto; height:auto; object-fit:contain; background:#fff; box-shadow:0 8px 30px rgba(0,0,0,.14); }
              .meta { color:#687587; font-size:13px; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Stamp preview" />
            <div class="meta">${widthMm} × ${heightMm} mm</div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    } catch (err) {
      console.error(err);
    }
  };

  // Prints the stamp directly (no PNG download, no Word import, no size headaches).
  // Print uses one A4/3 feeder piece at a time; no 3-up copies are generated.
  // scissors mark between each, so one sheet of butter paper yields 3 stamp
  // impressions instead of wasting a whole sheet on a single print.
  // Uses the same 600dpi source as Download — 300dpi was soft/blurry once the
  // browser scaled the image up to the printer's actual resolution.
  const handlePrint = async () => {
    const sideChoice = window.prompt("Print position choose karein:\n1 = UP SIDE (0 to 2.92 inch)\n2 = DOWN SIDE (2.92 to 5.84 inch)", "1");
    if (sideChoice === null) return;
    const printSide = sideChoice.trim().toLowerCase();
    if (!["1", "2", "up", "down"].includes(printSide)) {
      window.alert("Please 1 (UP SIDE) ya 2 (DOWN SIDE) select karein.");
      return;
    }
    const isDownSide = printSide === "2" || printSide === "down";
    const { dataUrl, widthMm, heightMm } = await generateStampJpegDataUrl(600);

    // Print into one of two 2.92-inch-high bands on a portrait A4 sheet.
    const feederWidthMm = 210;
    const feederHeightMm = 297;
    const bandHeightMm = 2.92 * 25.4;
    const topOffsetMm = isDownSide ? bandHeightMm : 0;

    const printWindow = window.open("", "_blank", "width=800,height=1000");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Stamp - ${isDownSide ? "DOWN SIDE" : "UP SIDE"} - ${widthMm}x${heightMm}mm</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              width: ${feederWidthMm}mm;
              height: ${feederHeightMm}mm;
              overflow: hidden;
            }
            .sheet {
              position: absolute;
              top: ${topOffsetMm}mm;
              left: 0;
              width: ${feederWidthMm}mm;
              height: ${bandHeightMm}mm;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            img {
              width: ${widthMm}mm;
              height: ${heightMm}mm;
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <img src="${dataUrl}" />
          </div>
          <script>
            window.onload = function () {
              setTimeout(function () { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Size + price picker shown right after tapping "New Stamp". Rendered on
  // top of whichever screen is active (templates list or the editor's own
  // "start new" toolbar button), so it's defined once and inserted in both.
  const sizePickerModal = sizePickerOpen && (
    <>
      <div
        onClick={() => setSizePickerOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(38,50,65,0.45)", zIndex: 200 }}
      />
      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "min(92vw, 440px)", maxHeight: "82vh", overflowY: "auto",
          background: C.white, borderRadius: 14, boxShadow: "0 20px 60px rgba(38,50,65,.28)",
          zIndex: 201, padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontWeight: 750, fontSize: 15.5, color: C.ink, fontFamily: font.body }}>
            Stamp size chunein
          </div>
          <button
            type="button"
            onClick={() => setSizePickerOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4, lineHeight: 0 }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: C.inkSoft, fontFamily: font.body, marginBottom: 14 }}>
          Size ke hisaab se design ka layout aur price niche dikh raha hai.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {rubberSizes.map((r) => {
            const w = r.parsed.widthMm, h = r.parsed.heightMm;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => beginNewDesign(r.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 8px 12px",
                  background: C.white, cursor: "pointer", textAlign: "center", fontFamily: font.body,
                }}
              >
                <SizeVisual r={r} active={false} large />
                <div style={{ fontWeight: 650, fontSize: 12.5, color: C.ink }}>{r.name}</div>
                <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft }}>
                  {w} × {h} mm
                </div>
                <div style={{ fontFamily: font.mono, fontWeight: 800, fontSize: 13, color: STAMP_INK_BLUE }}>
                  {inr(r.rate)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  /* ---------------- STEP 1: pick a shape / pick a saved template ---------------- */
  if (view === "templates") {
    return (
      <div>
        <SectionTitle icon={Wand2} title="Create Stamp" />
        <Card style={{ padding: 14 }}>
          <Btn onClick={startNew} style={{ width: "100%", justifyContent: "center", background: STAMP_INK_BLUE }}>
            <Plus size={16} /> {customerMode ? "Start Blank Stamp" : "New Stamp"}
          </Btn>
          {customerMode && (
            <div style={{ marginTop: 8, fontFamily: font.body, fontSize: 12, color: C.inkSoft, textAlign: "center" }}>
              Ya neeche diye gaye templates mein se koi design open karke edit karein.
            </div>
          )}
        </Card>

        {!customerMode && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 4, background: C.paperDark, border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 12 }}>
            <button type="button" onClick={() => setDesignStartTab("templates")} style={{ border: "none", borderRadius: 7, padding: "9px 8px", cursor: "pointer", background: designStartTab === "templates" ? C.white : "transparent", color: designStartTab === "templates" ? STAMP_INK_BLUE : C.inkSoft, fontFamily: font.body, fontWeight: 700, fontSize: 12.5 }}>Templates</button>
            <button type="button" onClick={() => setDesignStartTab("recent")} style={{ border: "none", borderRadius: 7, padding: "9px 8px", cursor: "pointer", background: designStartTab === "recent" ? C.white : "transparent", color: designStartTab === "recent" ? STAMP_INK_BLUE : C.inkSoft, fontFamily: font.body, fontWeight: 700, fontSize: 12.5 }}>Recent Designs{downloadHistory.length ? ` (${downloadHistory.length})` : ""}</button>
          </div>
        )}
        {(customerMode || designStartTab === "templates") && <Label>{customerMode ? "Choose a Template" : "My Templates"}</Label>}
        {designStartTab === "templates" && templatesLoading && <EmptyNote text="Loading…" />}
        {designStartTab === "templates" && templatesError && <EmptyNote text={templatesError} />}
        {designStartTab === "templates" && !templatesLoading && !templatesError && templates.length === 0 && (
          <EmptyNote text="No templates available yet." />
        )}
        {designStartTab === "templates" && templates.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(150px, 1fr))" : "repeat(2, 1fr)", gap: 10 }}>
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => openTemplate(t)}
                style={{ position: "relative", background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 8px 8px", cursor: "pointer", textAlign: "center" }}
              >
                {!customerMode && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTemplate(t.id, e)}
                    style={{ position: "absolute", top: 6, right: 6, background: C.white, border: `1px solid ${C.line}`, borderRadius: 6, color: C.stamp, cursor: "pointer", padding: 4, lineHeight: 0, zIndex: 1 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <TemplateThumb config={t.config} size={110} />
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, fontFamily: font.body, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {!customerMode && designStartTab === "recent" && (
          <>
            <Label style={{ marginTop: 4 }}>Recent Designs</Label>
            {downloadHistory.length === 0 ? (
              <EmptyNote text="Downloaded designs will appear here and stay editable." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(150px, 1fr))" : "repeat(2, 1fr)", gap: 10 }}>
                {downloadHistory.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => openHistoryDesign(h)}
                    style={{ position: "relative", background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 8px 8px", cursor: "pointer", textAlign: "center" }}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistory(h.id, e)}
                      aria-label="Delete history item"
                      style={{ position: "absolute", top: 6, right: 6, background: C.white, border: `1px solid ${C.line}`, borderRadius: 6, color: C.stamp, cursor: "pointer", padding: 4, lineHeight: 0, zIndex: 1 }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <TemplateThumb config={h.config} size={110} />
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, fontFamily: font.body, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.name}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 9.5, color: C.inkSoft, fontFamily: font.mono }}>
                      {new Date(h.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {sizePickerModal}
      </div>
    );
  }

  /* ---------------- STEP 2: edit the design ---------------- */

  // Left panel: contextual text entry only.
  // The shape picker is kept out of the layer editor so the editing area
  // stays focused on the selected object, like the reference UI.
  const textFields = (
    <>
      {activeLayer?.type === "centerText" ? (
        <>
          <Label>Text in the centre</Label>
          <Field
            placeholder="New text"
            value={activeLayer.text ?? ""}
            onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value })}
            maxLength={40}
          />
        </>
      ) : activeLayer?.type === "circleText" ? (
        <>
          <Label>Text around the circle</Label>
          <Field
            placeholder="YOUR COMPANY NAME"
            value={activeLayer.text ?? ""}
            onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value })}
            maxLength={40}
          />
        </>
      ) : activeLayer?.type === "frame" ? (
        <div style={{ padding: "8px 4px", color: C.inkSoft, fontFamily: font.mono, fontSize: 10.5, lineHeight: 1.5, textAlign: "center" }}>
          {FRAME_SHAPE_NAMES[activeLayer.shape || "circle"]} selected — edit its shape properties on the right.
        </div>
      ) : !activeLayer ? (
        <div style={{ padding: "8px 4px", color: C.inkSoft, fontFamily: font.mono, fontSize: 10.5, lineHeight: 1.5, textAlign: "center" }}>
          Select a layer above to edit it.
        </div>
      ) : shape === "circle" ? (
        <>
          <Label>Top curved text</Label>
          <Field placeholder="YOUR COMPANY NAME" value={topText} onChange={(e) => setTopText(e.target.value)} maxLength={40} />
          <SliderControl label="Top curved text size" value={topTextSize} min={6} max={30} step={1} onChange={setTopTextSize} />
          <Label>Bottom curved text</Label>
          <Field placeholder="AUTHORIZED SIGNATORY" value={bottomText} onChange={(e) => setBottomText(e.target.value)} maxLength={40} />
          <SliderControl label="Bottom curved text size" value={bottomTextSize} min={6} max={30} step={1} onChange={setBottomTextSize} />
          <Label>Center line</Label>
          <Field placeholder="APPROVED" value={centerLine1} onChange={(e) => setCenterLine1(e.target.value)} maxLength={20} />
          <SliderControl label="Center text size" value={centerTextSize} min={6} max={40} step={1} onChange={setCenterTextSize} />
          <Label>Center line (small, optional)</Label>
          <Field value={centerLine2} onChange={(e) => setCenterLine2(e.target.value)} maxLength={24} />
          <SliderControl label="Center small text size" value={centerText2Size} min={5} max={30} step={1} onChange={setCenterText2Size} />
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

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: C.ink, cursor: "pointer", marginBottom: 8 }}>
        <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
        Snap to grid (5%)
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: C.ink, cursor: "pointer" }}>
        <input type="checkbox" checked={texture} onChange={(e) => setTexture(e.target.checked)} />
        Worn ink texture
      </label>
    </>
  );

  function SizeVisual({ r, active = false, large = false }) {
    const w = Number(r?.parsed?.widthMm) || 1;
    const h = Number(r?.parsed?.heightMm) || 1;
    const maxSide = Math.max(w, h);
    const maxBox = large ? 74 : 54;
    const vw = Math.max(24, Math.round((w / maxSide) * maxBox));
    const vh = Math.max(24, Math.round((h / maxSide) * maxBox));
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: large ? 82 : 62 }}>
        <div style={{
          width: vw, height: vh, borderRadius: large ? 8 : 6,
          border: `2px solid ${active ? STAMP_INK_BLUE : C.inkSoft}`,
          background: active ? "#EAF2FF" : "#F7FAFD",
          boxShadow: active ? `0 0 0 3px rgba(39,91,156,.10)` : "inset 0 0 0 1px rgba(255,255,255,.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}>
          <span style={{ fontFamily: font.mono, fontSize: large ? 9 : 8, color: active ? STAMP_INK_BLUE : C.inkSoft, fontWeight: 700, whiteSpace: "nowrap" }}>
            {w}×{h}
          </span>
        </div>
      </div>
    );
  }

  const sizeControls = (
    <div>
      <Label>Choose stamp size</Label>
      {rubberSizes.length === 0 ? (
        <div style={{ color: C.inkSoft, fontFamily: font.mono, fontSize: 11.5, padding: "8px 0" }}>
          No rubber sizes configured.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {rubberSizes.map((r) => {
            const active = r.id === selectedRubberId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedRubberId(r.id);
                  setPlateSize(r.parsed.widthMm);
                  setSizeMenuOpen(false);
                }}
                style={{
                  border: `1.5px solid ${active ? STAMP_INK_BLUE : C.line}`,
                  background: active ? "#F3F8FF" : C.white,
                  color: active ? STAMP_INK_BLUE : C.ink,
                  borderRadius: 11, padding: "10px 7px 9px", cursor: "pointer",
                  textAlign: "center", fontFamily: font.body, minHeight: 126,
                  boxShadow: active ? "0 4px 14px rgba(39,91,156,.10)" : "none",
                }}
              >
                <SizeVisual r={r} active={active} />
                <div style={{ fontWeight: active ? 750 : 650, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                <div style={{ marginTop: 3, fontFamily: font.mono, fontSize: 10.5 }}>{r.parsed.widthMm} × {r.parsed.heightMm} mm</div>
                {r.rate != null && <div style={{ marginTop: 4, fontFamily: font.mono, fontWeight: 800, fontSize: 11.5, color: STAMP_INK_BLUE }}>{inr(r.rate)}</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const fontOptions = ["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New", "Trebuchet MS"];

  // Add Text exposes only the three requested layouts. Other shape-specific
  // text behavior continues to use its existing rendering/layouts.
  const ADD_TEXT_LAYOUTS = [
    { id: "center", label: "Center" },
    { id: "topArc", label: "Top Arc" },
    { id: "bottomArc", label: "Bottom Arc" },
  ];
  const TRIANGLE_TEXT_LAYOUTS = [
    { id: "bottom", label: "Bottom" },
    { id: "rightRotated", label: "Right rotated" },
    { id: "leftRotated", label: "Left rotated" },
  ];
  const TEXT_LAYOUTS = ADD_TEXT_LAYOUTS;
  const layoutPatch = (layoutId) => {
    switch (layoutId) {
      case "center": return { layout: "center", type: "centerText", x: 50, y: 50, rotation: 0 };
      case "topArc": return { layout: "topArc", type: "circleText", start: 90, flipX: false };
      case "bottomArc": return { layout: "bottomArc", type: "circleText", start: 90, flipX: true };
      case "bottom": return { layout: "bottom", type: "centerText", x: 50, y: 50, rotation: 0, triangleSide: 1 };
      case "rightRotated": return { layout: "rightRotated", type: "centerText", x: 50, y: 50, rotation: 0, triangleSide: 0 };
      case "leftRotated": return { layout: "leftRotated", type: "centerText", x: 50, y: 50, rotation: 0, triangleSide: 2 };
      default: return { layout: layoutId };
    }
  };
  const LayoutIcon = ({ id, active }) => {
    const stroke = active ? STAMP_INK_BLUE : C.inkSoft;
    const common = { width: 26, height: 16, viewBox: "0 0 26 16", fill: "none", stroke, strokeWidth: 1.6, strokeLinecap: "round" };
    if (id === "center") return <svg {...common}><rect x="9" y="5" width="8" height="6" rx="1" /></svg>;
    if (id === "topArc") return <svg {...common}><path d="M3 12 A 10 10 0 0 1 23 12" /></svg>;
    if (id === "bottomArc") return <svg {...common}><path d="M3 4 A 10 10 0 0 0 23 4" /></svg>;
    if (id === "bottom") return <svg {...common}><line x1="4" y1="10" x2="22" y2="10" /></svg>;
    if (id === "rightRotated") return <svg {...common}><line x1="7" y1="14" x2="19" y2="2" /></svg>;
    if (id === "leftRotated") return <svg {...common}><line x1="7" y1="2" x2="19" y2="14" /></svg>;
    return null;
  };

  // Icons for the per-frame Border Style picker (Single / Double / Triple / Dashed),
  // matching the reference editor's ring-style thumbnails.
  const FRAME_BORDER_STYLES = [
    { id: "single", label: "Single" },
    { id: "double", label: "Double" },
    { id: "scalloped", label: "Scalloped" },
    { id: "dashed", label: "Dashed" },
  ];
  const BorderStyleIcon = ({ id, active, shape }) => {
    const stroke = active ? STAMP_INK_BLUE : C.inkSoft;
    const common = { width: 22, height: 22, viewBox: "0 0 22 22", fill: "none", stroke, strokeWidth: 1.4 };
    if (shape === "triangle") {
      if (id === "single") return <svg {...common}><path d="M11 2.5 L19.5 18.5 L2.5 18.5 Z" strokeLinejoin="round" /></svg>;
      if (id === "double") return <svg {...common}><path d="M11 1.5 L20.3 19 L1.7 19 Z" strokeLinejoin="round" /><path d="M11 6 L16.8 16.7 L5.2 16.7 Z" strokeLinejoin="round" /></svg>;
      return null;
    }
    if (id === "single") return <svg {...common}><circle cx="11" cy="11" r="8" /></svg>;
    if (id === "double") return <svg {...common}><circle cx="11" cy="11" r="9" /><circle cx="11" cy="11" r="5.5" /></svg>;
    if (id === "scalloped") return <svg {...common}><path d="M11 1.5 L12.6 4 L15.3 2.8 L15.6 5.7 L18.5 5.4 L17.3 8.1 L20 9.7 L17.5 11.3 L20 12.9 L17.3 14.5 L18.5 17.2 L15.6 16.9 L15.3 19.8 L12.6 18.6 L11 21.1 L9.4 18.6 L6.7 19.8 L6.4 16.9 L3.5 17.2 L4.7 14.5 L2 12.9 L4.5 11.3 L2 9.7 L4.7 8.1 L3.5 5.4 L6.4 5.7 L6.7 2.8 L9.4 4 Z" strokeLinejoin="round" /></svg>;
    if (id === "dashed") return <svg {...common}><circle cx="11" cy="11" r="8" strokeDasharray="2.5 2.5" /></svg>;
    return null;
  };

  const textPropertyPanel = (layer) => {
    const layoutId = layer.layout || (layer.type === "circleText" ? "topArc" : "center");
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <Label>Font</Label>
            <Select value={layer.fontFamily || "Arial"} onChange={(e) => updateLayer(layer.id, { fontFamily: e.target.value })} style={{ marginBottom: 0, fontFamily: layer.fontFamily || "Arial" }}>
              {fontOptions.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div>
            <Label>Size</Label>
            <Field
              type="number"
              min={5}
              max={100}
              value={layer.fontSize ?? layer.size ?? 16}
              onChange={(e) => { const v = Number(e.target.value) || 0; updateLayer(layer.id, { fontSize: v, size: v }); }}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={() => updateLayer(layer.id, { bold: !layer.bold })} title="Bold"
            style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, background: layer.bold ? STAMP_INK_BLUE : C.white, color: layer.bold ? C.white : C.ink, fontWeight: 700, padding: "9px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            B
          </button>
          <button type="button" onClick={() => updateLayer(layer.id, { fontStyle: layer.fontStyle === "italic" ? "normal" : "italic" })} title="Italic"
            style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, background: layer.fontStyle === "italic" ? STAMP_INK_BLUE : C.white, color: layer.fontStyle === "italic" ? C.white : C.ink, padding: "9px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ItalicIcon size={15} />
          </button>
          <button type="button" onClick={() => updateLayer(layer.id, { tall: !layer.tall })} title="Text height"
            style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, background: layer.tall ? STAMP_INK_BLUE : C.white, color: layer.tall ? C.white : C.ink, padding: "9px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MoveVertical size={15} />
          </button>
        </div>

        {(
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: C.ink, cursor: "pointer", marginBottom: 16 }}>
            <input type="checkbox" checked={!!layer.invert} onChange={(e) => updateLayer(layer.id, { invert: e.target.checked })} />
            Invert (solid box behind text, like a "CERTIFIED" banner)
          </label>
        )}

        <Label>Text layout</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          {(layer.layout === "triangleSide" || ["bottom", "rightRotated", "leftRotated"].includes(layer.layout)
            ? TRIANGLE_TEXT_LAYOUTS
            : (layer.source === "addText" ? ADD_TEXT_LAYOUTS : TEXT_LAYOUTS)
          ).map((opt) => {
            const active = layoutId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateLayer(layer.id, layoutPatch(opt.id))}
                style={{
                  border: `1px solid ${active ? STAMP_INK_BLUE : C.line}`,
                  background: active ? "#EAF2FF" : C.white,
                  borderRadius: 8,
                  padding: "10px 4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: font.body,
                }}
              >
                <LayoutIcon id={opt.id} active={active} />
                <span style={{ fontSize: 10.5, color: active ? STAMP_INK_BLUE : C.inkSoft, fontWeight: active ? 700 : 500 }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const layerPanel = activeLayer && (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
      {activeLayer.type === "centerText" && activeLayer.layout !== "triangleSide" && !["bottom", "rightRotated", "leftRotated"].includes(activeLayer.layout) && (
        <>
          <Label>Quick align</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
            <button type="button" onClick={() => alignLayer(activeLayer.id, "x", 10)} style={{ padding: "7px 4px", border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, cursor: "pointer", fontSize: 10 }}>Left</button>
            <button type="button" onClick={() => alignLayer(activeLayer.id, "x", 50)} style={{ padding: "7px 4px", border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, cursor: "pointer", fontSize: 10 }}>Center</button>
            <button type="button" onClick={() => alignLayer(activeLayer.id, "x", 90)} style={{ padding: "7px 4px", border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, cursor: "pointer", fontSize: 10 }}>Right</button>
          </div>
          {activeLayer.source !== "addText" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
              <button type="button" onClick={() => alignLayer(activeLayer.id, "y", 10)} style={{ padding: "7px 4px", border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, cursor: "pointer", fontSize: 10 }}>Top</button>
              <button type="button" onClick={() => alignLayer(activeLayer.id, "y", 50)} style={{ padding: "7px 4px", border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, cursor: "pointer", fontSize: 10 }}>Middle</button>
              <button type="button" onClick={() => alignLayer(activeLayer.id, "y", 90)} style={{ padding: "7px 4px", border: `1px solid ${C.line}`, borderRadius: 7, background: C.white, cursor: "pointer", fontSize: 10 }}>Bottom</button>
            </div>
          )}
        </>
      )}
      {(activeLayer.type === "circleText" || activeLayer.type === "centerText") && (
        textPropertyPanel(activeLayer)
      )}

      {activeLayer.type === "circleText" ? (
        <>
          <SliderControl label="Radius Text" value={activeLayer.radius ?? 130} min={40} max={155} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { radius: v })} />
          <SliderControl label="Distribution" value={activeLayer.spacing ?? 4} min={0} max={20} step={0.1} onChange={(v) => updateLayer(activeLayer.id, { spacing: v })} />
          <SliderControl label="Start Point" value={activeLayer.start ?? 90} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { start: v })} />
        </>
      ) : activeLayer.type === "centerText" ? (
        <>
          <SliderControl label="Horizontal position" value={activeLayer.x ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { x: v })} />
          <SliderControl label="Vertical position" value={activeLayer.y ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { y: v })} />
          {activeLayer.layout !== "triangleSide" && !["bottom", "rightRotated", "leftRotated"].includes(activeLayer.layout) && (
            <SliderControl label="Rotation" value={activeLayer.rotation ?? 0} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { rotation: v })} />
          )}
        </>
      ) : activeLayer.type === "frame" ? (
        <>
          {activeLayer.shape === "square" ? (
            <>
              <SliderControl label="Width" value={activeLayer.width ?? 45} min={10} max={95} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { width: v })} />
              <SliderControl label="Height" value={activeLayer.height ?? 45} min={10} max={95} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { height: v })} />
            </>
          ) : (
            <SliderControl label="Radius" value={activeLayer.radius ?? 100} min={30} max={150} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { radius: v })} />
          )}
          {(activeLayer.borderStyle || "single") === "scalloped" ? (
            <SliderControl label="Wave amount" value={activeLayer.waveAmount ?? 14} min={2} max={40} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { waveAmount: v })} />
          ) : (
            <SliderControl label="Stroke width" value={activeLayer.strokeWidth ?? 4} min={1} max={25} step={0.1} onChange={(v) => updateLayer(activeLayer.id, { strokeWidth: v })} />
          )}
          {activeLayer.shape !== "circle" && activeLayer.shape !== "triangle" && (
            <>
              <SliderControl label="Horizontal position" value={activeLayer.x ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { x: v })} />
              <SliderControl label="Vertical position" value={activeLayer.y ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { y: v })} />
            </>
          )}
          {activeLayer.shape !== "triangle" && (
            <>
              <SliderControl label="Rotation" value={activeLayer.rotation ?? 0} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { rotation: v })} />
              <SliderControl label="Break" value={activeLayer.lineBreak ?? 0} min={0} max={200} step={0.1} onChange={(v) => updateLayer(activeLayer.id, { lineBreak: v })} />
            </>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: C.ink, cursor: "pointer", marginBottom: activeLayer.fill ? 8 : 16 }}>
            <input type="checkbox" checked={!!activeLayer.fill} onChange={(e) => updateLayer(activeLayer.id, { fill: e.target.checked })} />
            Fill background (blocks whatever is behind this shape)
          </label>
          {activeLayer.fill && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Label style={{ margin: 0 }}>Fill Color</Label>
              <input type="color" value={activeLayer.fillColor || "#FFFFFF"} onChange={(e) => updateLayer(activeLayer.id, { fillColor: e.target.value })}
                style={{ width: 34, height: 26, padding: 0, border: `1px solid ${C.line}`, borderRadius: 6, cursor: "pointer" }} />
            </div>
          )}
          <Label>Border Style</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 4 }}>
            {(activeLayer.shape === "triangle" ? FRAME_BORDER_STYLES.filter((o) => o.id === "single" || o.id === "double") : FRAME_BORDER_STYLES).map((opt) => {
              const active = (activeLayer.borderStyle || "single") === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateLayer(activeLayer.id, { borderStyle: opt.id })}
                  style={{
                    border: `1px solid ${active ? STAMP_INK_BLUE : C.line}`,
                    background: active ? "#EAF2FF" : C.white,
                    borderRadius: 8,
                    padding: "10px 4px 8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: font.body,
                  }}
                >
                  <BorderStyleIcon id={opt.id} active={active} shape={activeLayer.shape} />
                  <span style={{ fontSize: 10.5, color: active ? STAMP_INK_BLUE : C.inkSoft, fontWeight: active ? 700 : 500 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : activeLayer.type === "line" ? (
        <>
          <SliderControl label="Line width" value={activeLayer.width ?? 55} min={5} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { width: v })} />
          <SliderControl label="Stroke width" value={activeLayer.strokeWidth ?? 4} min={1} max={80} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { strokeWidth: v })} />
          <Label>Curve</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 10 }}>
            {[{ id: 0, label: "Straight" }, { id: -1, label: "Up Curve" }, { id: 1, label: "Down Curve" }].map((opt) => {
              const active = Number(activeLayer.curve ?? 0) === opt.id;
              return (
                <button key={opt.id} type="button" onClick={() => updateLayer(activeLayer.id, { curve: opt.id })} style={{ border: `1px solid ${active ? STAMP_INK_BLUE : C.line}`, background: active ? "#EAF2FF" : C.white, color: active ? STAMP_INK_BLUE : C.ink, borderRadius: 8, padding: "9px 4px", cursor: "pointer", fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{opt.label}</button>
              );
            })}
          </div>
          {Number(activeLayer.curve ?? 0) !== 0 && (
            <>
              <SliderControl label="Curve amount" value={activeLayer.curveAmount ?? 24} min={4} max={80} step={1} onChange={(v) => updateLayer(activeLayer.id, { curveAmount: v })} />
              {shape === "circle" && <SliderControl label="Circle arc size" value={activeLayer.arcRadius || 82} min={35} max={96} step={1} onChange={(v) => updateLayer(activeLayer.id, { arcRadius: v })} />}
            </>
          )}
          <SliderControl label="Line size" value={activeLayer.width ?? 55} min={5} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { width: v })} />
          <SliderControl label="Rotation" value={activeLayer.rotation ?? 0} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { rotation: v })} />
          {Number(activeLayer.curve ?? 0) === 0 && (
            <>
              <SliderControl label="Horizontal position" value={activeLayer.x ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { x: v })} />
              <SliderControl label="Vertical position" value={activeLayer.y ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { y: v })} />
            </>
          )}
        </>
      ) : (
        <>
          <SliderControl label="Width" value={activeLayer.width ?? activeLayer.size ?? 15} min={5} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { width: v })} />
          <SliderControl label="Horizontal position" value={activeLayer.x ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { x: v })} />
          <SliderControl label="Vertical position" value={activeLayer.y ?? 50} min={0} max={100} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { y: v })} />
          <SliderControl label="Rotation" value={activeLayer.rotation ?? 0} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { rotation: v })} />
          <Label>Ready-made Symbols</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
            {PRELOADED_SYMBOLS.map((sym) => (
              <button
                key={sym.id}
                type="button"
                onClick={() => addPreloadedSymbol(sym.src)}
                title={sym.label}
                style={{
                  border: `1px solid ${C.line}`,
                  background: C.white,
                  borderRadius: 8,
                  padding: 6,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <img src={sym.src} alt={sym.label} style={{ width: 26, height: 26, objectFit: "contain" }} />
                <span style={{ fontSize: 9, color: C.inkSoft, fontFamily: font.mono }}>{sym.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // All three desktop panels share this exact height, so Left / Center / Right
  // line up evenly — each one scrolls internally on its own if its content
  // is taller than the available space, instead of growing the column.
  // Capped with min(...) so on shorter windows the panels don't eat the
  // whole viewport and push the Plate size / Download / Save row off-screen.
  const PANEL_HEIGHT = isDesktop ? "min(600px, calc(100vh - 320px))" : "auto";

  const sidePanelStyle = {
    width: "100%",
    minWidth: 0,
    height: PANEL_HEIGHT,
    overflowY: "auto",
    borderRadius: 2,
  };

  const canvasBlock = (
    <Card
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        marginBottom: isDesktop ? 0 : 10,
        background: C.white,
        ...(isDesktop
          ? { width: "100%", minWidth: 0, height: PANEL_HEIGHT, overflow: "hidden" }
          : {
              position: "fixed",
              top: mobileHeaderVisible ? 54 : 0,
              left: 0,
              right: 0,
              zIndex: 70,
              width: "100%",
              height: mobileCanvasAreaHeight,
              minHeight: 170,
              maxHeight: 330,
              transition: "height .18s ease",
              boxShadow: "0 2px 10px rgba(38,50,65,.14)",
            }),
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          height: "100%",
          maxHeight: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          backgroundImage: `linear-gradient(#DDE3EA 1px, transparent 1px), linear-gradient(90deg, #DDE3EA 1px, transparent 1px), linear-gradient(#EEF1F5 1px, transparent 1px), linear-gradient(90deg, #EEF1F5 1px, transparent 1px)`,
          backgroundSize: "40px 40px, 40px 40px, 10px 10px, 10px 10px",
          backgroundPosition: "-1px -1px, -1px -1px, -1px -1px, -1px -1px",
          border: `1px solid ${C.line}`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, maxWidth: "94%" }}>
          <div
            style={{
              position: "relative",
              width: `${selectedStampPreviewWidth}px`,
              height: `${selectedStampPreviewHeight}px`,
              maxWidth: "94%",
              maxHeight: "82%",
              border: `2px dashed ${STAMP_INK_BLUE}`,
              borderRadius: 3,
              boxShadow: "0 0 0 4px rgba(63,127,232,.10)",
              background: "rgba(63,127,232,.035)",
              flexShrink: 0,
              transform: `scale(${previewZoom})`,
              transformOrigin: "center center",
              transition: "transform .15s ease, width .18s ease, height .18s ease",
            }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              onClick={handleCanvasClick}
              title={layers.length ? "Click an item on the stamp to edit it" : "Add an item from the toolbar to edit it"}
              style={{ width: "100%", height: "100%", display: "block", cursor: layers.length ? "pointer" : "default" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap", transform: `translateY(${Math.max(0, (previewZoom - 1) * 8)}px)` }}>
            <button type="button" onClick={() => setPreviewZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))} title="Zoom out" style={{ width: 28, height: 28, border: `1px solid ${C.line}`, borderRadius: 6, background: C.white, color: C.ink, cursor: "pointer", fontWeight: 800 }}>−</button>
            <span style={{ minWidth: 46, textAlign: "center", fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft }}>{Math.round(previewZoom * 100)}%</span>
            <button type="button" onClick={() => setPreviewZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(1))))} title="Zoom in" style={{ width: 28, height: 28, border: `1px solid ${C.line}`, borderRadius: 6, background: C.white, color: C.ink, cursor: "pointer", fontWeight: 800 }}>+</button>
            <button type="button" onClick={() => setPreviewZoom(1)} title="Reset zoom" style={{ height: 28, padding: "0 8px", border: `1px solid ${C.line}`, borderRadius: 6, background: C.white, color: STAMP_INK_BLUE, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Reset</button>
          </div>
        </div>
        {layers.length > 0 && (
          <div style={{ marginTop: 5, fontFamily: font.mono, fontSize: 9.5, color: C.inkSoft, textAlign: "center", background: "rgba(255,255,255,.8)", padding: "2px 7px", borderRadius: 10 }}>Click any item on the stamp to edit</div>
        )}
      </div>
    </Card>
  );

  const mobileCanvasSpacer = !isDesktop
    ? <div aria-hidden="true" style={{ height: mobileCanvasAreaHeight, minHeight: 170, maxHeight: 330, marginBottom: 10, transition: "height .18s ease" }} />
    : null;

  const downloadCustomerStampPreview = async () => {
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        setCustomerSubmitStatus("Stamp preview is not ready. Please try again.");
        return;
      }

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, 0);

      // Customer downloads are intentionally watermarked previews.
      ctx.save();
      ctx.translate(exportCanvas.width / 2, exportCanvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(24, Math.round(exportCanvas.width * 0.055))}px Arial`;
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#555";
      ctx.fillText("SHARMA JI STAMPS • PREVIEW", 0, 0);
      ctx.restore();

      const dataUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `stamp-preview-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setCustomerSubmitStatus("Submitted successfully. Watermarked PNG downloaded.");
    } catch (err) {
      console.error(err);
      setCustomerSubmitStatus("Submit succeeded, but preview download failed. Please try again.");
    }
  };

  const scrollToMobileEditorSection = (section) => {
    setMobileEditorPanel(section);
    const idMap = {
      layers: "mobile-stamp-layers",
      edit: "mobile-stamp-edit",
      size: "mobile-stamp-size",
      submit: "mobile-stamp-submit",
    };
    setTimeout(() => {
      document.getElementById(idMap[section])?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const toolbarPill = { padding: "8px 14px", borderRadius: 7, fontWeight: 700, fontSize: 13, fontFamily: font.body, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, border: "none" };
  const toolbarIconBtn = {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none",
    color: C.white, cursor: "pointer", fontFamily: font.body, fontSize: isDesktop ? 10.5 : 8.5, fontWeight: 600, textAlign: "center", lineHeight: 1.05, padding: isDesktop ? "2px 6px" : "2px 1px", flexShrink: 0,
  };
  const toolbarIconBox = { width: isDesktop ? 40 : 32, height: isDesktop ? 40 : 32, borderRadius: 6, border: `${isDesktop ? 2 : 1.5}px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={{ paddingTop: isDesktop ? 126 : 0, paddingBottom: !isDesktop && view === "editor" ? 76 : 0 }}>
      {isDesktop && (
        <div style={{
          position: "fixed", top: 0, left: SIDEBAR_W, right: 0, zIndex: 300,
          background: C.white, borderBottom: `1px solid ${C.line}`,
          boxShadow: "0 2px 12px rgba(38,50,65,.10)",
        }}>
          <div style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: STAMP_INK_BLUE, color: C.white, display: "grid", placeItems: "center", flexShrink: 0 }}><Stamp size={20} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: font.display, fontWeight: 750, fontSize: 18, lineHeight: 1.05, color: C.ink }}>Create Stamp</div>
                <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>Design and customize your stamp easily</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <Btn onClick={startNew} variant="ghost" style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.white }}><Plus size={16} /> New</Btn>
              <Btn onClick={handleSaveTemplate} disabled={saveStatus === "saving"} variant="ghost" style={{ border: `1px solid ${C.line}`, color: STAMP_INK_BLUE, background: C.white }}><Copy size={16} /> Save Template</Btn>
              <Btn onClick={handleUpdateTemplate} disabled={saveStatus === "saving" || !editingTemplateId} variant="ghost" style={{ border: `1px solid ${C.line}`, color: STAMP_INK_BLUE, background: C.white, opacity: editingTemplateId ? 1 : .5 }}><Save size={16} /> Update Template</Btn>
              <Btn onClick={handlePreview} variant="ghost" style={{ border: `1px solid ${C.line}`, color: STAMP_INK_BLUE, background: C.white }}><Eye size={16} /> Preview</Btn>
              <label style={{ display:"inline-flex", alignItems:"center", gap:6, border:`1px solid ${C.line}`, borderRadius:8, padding:"0 8px", height:38, background:C.white, color:C.stamp, fontSize:12.5, fontWeight:600, whiteSpace:"nowrap" }}>
                <Palette size={16} />
                <select value={theme} onChange={(e) => onThemeChange?.(e.target.value)} title="Choose theme" style={{ border:"none", outline:"none", background:"transparent", color:C.stamp, fontFamily:font.body, fontWeight:600, fontSize:12.5, cursor:"pointer" }}>
                  {THEME_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <Btn onClick={handlePrint} style={{ background: STAMP_INK_BLUE, color: C.white }}><Printer size={16} /> Print</Btn>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          background: STAMP_INK_BLUE,
          borderRadius: 4,
          position: isDesktop ? "fixed" : "relative",
          top: isDesktop ? 62 : undefined,
          left: isDesktop ? SIDEBAR_W : undefined,
          right: isDesktop ? 0 : undefined,
          zIndex: isDesktop ? 299 : undefined,
          padding: isDesktop ? "8px 14px" : "10px",
          minHeight: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: isDesktop ? "nowrap" : "wrap",
          marginBottom: 0,
          boxShadow: "0 1px 2px rgba(36,95,196,.12)",
          ...(isDesktop ? {} : {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            width: "auto",
            minHeight: 54,
            zIndex: 95,
            padding: "8px 10px",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 8,
            borderRadius: 0,
            transform: mobileHeaderVisible ? "translateY(0)" : "translateY(-100%)",
            transition: "transform .18s ease",
          }),
        }}
      >
        <button type="button" onClick={() => setView("templates")} style={{ ...toolbarPill, background: C.sage, color: C.white, ...(isDesktop ? {} : { padding: "8px", flexShrink: 0 }) }}>
          <ChevronLeft size={16} />{isDesktop && " Back"}
        </button>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button type="button" onClick={undoLayers} title="Undo" aria-label="Undo" style={toolbarIconBtn}><Undo2 size={18} /></button>
          <button type="button" onClick={redoLayers} title="Redo" aria-label="Redo" style={toolbarIconBtn}><Redo2 size={18} /></button>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: isDesktop ? 22 : 6,
          flexDirection: "row",
          flexWrap: "nowrap", justifyContent: isDesktop ? "center" : "flex-start",
          overflowX: isDesktop ? "visible" : "auto", minWidth: 0,
          flex: 1, WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", padding: isDesktop ? 0 : 0
        }}>
          <button type="button" onClick={() => addLayer("centerText")} style={toolbarIconBtn} title="Add Text">
            <span style={toolbarIconBox}><Type size={18} /></span>
            Add Text
          </button>
          <button type="button" onClick={() => addLayer("frame", { shape: "circle" })} style={toolbarIconBtn} title="Insert Circle">
            <span style={toolbarIconBox}><Circle size={18} /></span> Circle
          </button>
          <button type="button" onClick={() => addLayer("frame", { shape: "square" })} style={toolbarIconBtn} title="Insert Square">
            <span style={toolbarIconBox}><Square size={18} /></span> Square
          </button>
          <button type="button" onClick={() => addLayer("frame", { shape: "triangle" })} style={toolbarIconBtn} title="Insert Triangle">
            <span style={toolbarIconBox}><Triangle size={18} /></span> Triangle
          </button>
          <button type="button" onClick={() => addLayer("line")} style={toolbarIconBtn} title="Insert Line">
            <span style={toolbarIconBox}><span style={{ fontSize: 21, lineHeight: 1 }}>―</span></span> Line
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
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setSymbolPickerOpen((v) => !v)}
              style={toolbarIconBtn}
              title="Add Symbol"
              aria-label="Add Symbol"
            >
              <span style={toolbarIconBox}><Star size={18} /></span>
              Symbols
            </button>
            {symbolPickerOpen && (
              <div style={{
                position: "fixed", top: isDesktop ? 64 : 58, right: isDesktop ? 18 : 8, zIndex: 180,
                minWidth: 170, padding: 8, background: C.white,
                border: `1px solid ${C.line}`, borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,.14)"
              }}>
                <div style={{ fontSize: 10, fontFamily: font.mono, color: C.inkSoft, marginBottom: 7, letterSpacing: 1 }}>ADD SYMBOL</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {PRELOADED_SYMBOLS.map((sym) => (
                    <button
                      key={sym.id}
                      type="button"
                      title={sym.label}
                      onClick={() => addPreloadedSymbol(sym.src, { forceNew: true })}
                      style={{
                        border: `1px solid ${C.line}`, background: C.white, borderRadius: 7,
                        padding: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                      }}
                    >
                      <img src={sym.src} alt={sym.label} style={{ width: 28, height: 28, objectFit: "contain" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {!isDesktop && (
          <button type="button" onClick={startNew} style={{ ...toolbarPill, background: C.sage, color: C.white, padding: "8px", flexShrink: 0 }}>
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* This layer-switcher tab strip is only needed on mobile, where there's
          no separate layer list like the desktop's left "All/Text/Figure"
          panel — keeping it there would just duplicate that list. */}
      {!isDesktop && layers.length > 0 && (
        <div id="mobile-stamp-layers" style={{
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
        <div style={{ display: "grid", gridTemplateColumns: "minmax(205px, .82fr) minmax(300px, 1.45fr) minmax(170px, .62fr)", gap: 10, alignItems: "stretch", width: "100%", background: "#EEF1F5", padding: 8, border: `1px solid ${C.line}`, borderTop: "none" }}>
          <Card style={{ ...sidePanelStyle, padding: 0 }}>
            <div style={{ display: "flex", height: 38, borderBottom: `1px solid ${C.line}`, background: C.paper }}>
              {['All', 'Text', 'Figure'].map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLayerFilter(t)}
                  style={{ flex: 1, border: "none", borderRight: i < 2 ? `1px solid ${C.line}` : "none", background: layerFilter === t ? C.white : "transparent", color: C.ink, fontFamily: font.body, fontSize: 12.5, cursor: "pointer" }}
                >{t}</button>
              ))}
            </div>
            <div style={{ padding: 10 }}>
              {layers.length === 0 ? (
                <div style={{ padding: "14px 6px", color: C.inkSoft, fontFamily: font.mono, fontSize: 11, textAlign: "center" }}>
                  Add an item from the toolbar above.
                </div>
              ) : filteredLayers.length === 0 ? (
                <div style={{ padding: "14px 6px", color: C.inkSoft, fontFamily: font.mono, fontSize: 11, textAlign: "center" }}>
                  No items in this category.
                </div>
              ) : (
                filteredLayers.map((l) => {
                  const isTextLayer = l.type === "circleText" || l.type === "centerText";
                  const active = activeLayerId === l.id;
                  return (
                    <div
                      key={l.id}
                      onClick={() => setActiveLayerId(l.id)}
                      style={{
                        width: "100%",
                        background: active ? "#EAF2FF" : "transparent",
                        borderBottom: `1px solid ${C.line}`,
                        padding: "8px 2px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ fontFamily: font.mono, color: C.inkSoft, fontSize: 10.5, flexShrink: 0 }}>{l.num}#</span>
                        {isTextLayer ? (
                          <input
                            type="text"
                            value={l.text ?? ""}
                            placeholder={l.type === "circleText" ? "YOUR COMPANY NAME" : "New text"}
                            maxLength={40}
                            onFocus={() => setActiveLayerId(l.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateLayer(l.id, { text: e.target.value })}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              width: 0,
                              background: C.white,
                              border: `1px solid ${active ? STAMP_INK_BLUE : C.line}`,
                              borderRadius: 6,
                              padding: "7px 8px",
                              fontSize: 12.5,
                              color: C.ink,
                              fontFamily: font.body,
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: font.body, fontSize: 12.5, color: active ? STAMP_INK_BLUE : C.ink }}>
                            {layerLabel(l)}{l.hidden ? " (hidden)" : ""}
                          </span>
                        )}
                        <button
                          type="button"
                          title={l.hidden ? "Show layer" : "Hide layer"}
                          aria-label={l.hidden ? "Show layer" : "Hide layer"}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLayer(l.id, { hidden: !l.hidden });
                            setActiveLayerId(l.id);
                          }}
                          style={{
                            width: 28, height: 28, padding: 0, flexShrink: 0,
                            display: "grid", placeItems: "center",
                            border: `1px solid ${C.line}`, borderRadius: 6,
                            background: C.white, color: C.inkSoft, cursor: "pointer",
                          }}
                        >
                          {l.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          type="button"
                          title={l.locked ? "Unlock layer" : "Lock layer"}
                          aria-label={l.locked ? "Unlock layer" : "Lock layer"}
                          onClick={(e) => { e.stopPropagation(); toggleLayerLock(l.id); setActiveLayerId(l.id); }}
                          style={{
                            width: 28, height: 28, padding: 0, flexShrink: 0,
                            display: "grid", placeItems: "center",
                            border: `1px solid ${l.locked ? STAMP_INK_BLUE : C.line}`, borderRadius: 6,
                            background: l.locked ? "#EAF2FF" : C.white, color: l.locked ? STAMP_INK_BLUE : C.inkSoft, cursor: "pointer",
                          }}
                        >
                          {l.locked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                        <button
                          type="button"
                          title="Bring forward (on top)"
                          aria-label="Bring forward"
                          onClick={(e) => { e.stopPropagation(); moveLayerOrder(l.id, 1); }}
                          style={{
                            width: 28, height: 28, padding: 0, flexShrink: 0,
                            display: "grid", placeItems: "center",
                            border: `1px solid ${C.line}`, borderRadius: 6,
                            background: C.white, color: C.inkSoft, cursor: "pointer",
                          }}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          title="Send backward"
                          aria-label="Send backward"
                          onClick={(e) => { e.stopPropagation(); moveLayerOrder(l.id, -1); }}
                          style={{
                            width: 28, height: 28, padding: 0, flexShrink: 0,
                            display: "grid", placeItems: "center",
                            border: `1px solid ${C.line}`, borderRadius: 6,
                            background: C.white, color: C.inkSoft, cursor: "pointer",
                          }}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          title="Duplicate layer"
                          aria-label="Duplicate layer"
                          onClick={(e) => { e.stopPropagation(); duplicateLayer(l.id); }}
                          style={{
                            width: 28, height: 28, padding: 0, flexShrink: 0,
                            display: "grid", placeItems: "center",
                            border: `1px solid ${active ? STAMP_INK_BLUE : C.line}`, borderRadius: 6,
                            background: active ? "#EAF2FF" : C.white, color: active ? STAMP_INK_BLUE : C.inkSoft, cursor: "pointer",
                          }}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete layer"
                          aria-label="Delete layer"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLayer(l.id);
                          }}
                          style={{
                            width: 28, height: 28, padding: 0, flexShrink: 0,
                            display: "grid", placeItems: "center",
                            border: `1px solid ${C.line}`, borderRadius: 6,
                            background: C.white, color: C.stamp, cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {canvasBlock}
          </div>
          {mobileCanvasSpacer}
          <Card style={{ ...sidePanelStyle, padding: 12 }}>
            {activeLayer ? (
              layerPanel
            ) : (
              <>
                <div style={{ padding: 8, color: C.inkSoft, fontFamily: font.mono, fontSize: 11, marginBottom: 12 }}>
                  Select an item above or click an item on the stamp to edit.
                </div>
                {controlFields}
              </>
            )}
          </Card>
        </div>
      ) : (
        <>
          {canvasBlock}
          {mobileCanvasSpacer}
          <Card id="mobile-stamp-edit">
            {mobileEditorPanel === "layers" ? (
              <div id="mobile-stamp-layers-list">
                <Label>Layers</Label>
                {layers.length === 0 ? (
                  <div style={{ padding: "12px 0", color: C.inkSoft, fontFamily: font.mono, fontSize: 11 }}>
                    No layers yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {layers.map((l) => {
                      const isTextLayer = l.type === "circleText" || l.type === "centerText";
                      const selected = activeLayerId === l.id;
                      return (
                        <div
                          key={l.id}
                          onClick={() => setActiveLayerId(l.id)}
                          style={{
                            width: "100%",
                            border: `1px solid ${selected ? STAMP_INK_BLUE : C.line}`,
                            background: selected ? "#EAF2FF" : C.white,
                            borderRadius: 8,
                            padding: "8px 9px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ fontFamily: font.mono, color: C.inkSoft, fontSize: 10.5, flexShrink: 0 }}>{l.num}#</span>
                          {isTextLayer ? (
                            <input
                              type="text"
                              value={l.text ?? ""}
                              placeholder={l.type === "circleText" ? "YOUR COMPANY NAME" : "New text"}
                              maxLength={40}
                              onFocus={() => setActiveLayerId(l.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateLayer(l.id, { text: e.target.value })}
                              style={{
                                flex: 1, minWidth: 0, width: 0,
                                background: C.white, border: `1px solid ${selected ? STAMP_INK_BLUE : C.line}`,
                                borderRadius: 6, padding: "7px 8px", fontSize: 12.5, color: C.ink,
                                fontFamily: font.body, outline: "none",
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveLayerId(l.id)}
                              style={{
                                flex: 1, minWidth: 0, border: "none", background: "transparent",
                                color: selected ? STAMP_INK_BLUE : C.ink, cursor: "pointer", textAlign: "left",
                                fontFamily: font.body, fontWeight: selected ? 750 : 600, fontSize: 12,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}
                            >
                              {layerLabel(l)}{l.hidden ? " (hidden)" : ""}
                            </button>
                          )}
                          <button
                            type="button"
                            title={l.hidden ? "Show layer" : "Hide layer"}
                            onClick={(e) => { e.stopPropagation(); updateLayer(l.id, { hidden: !l.hidden }); setActiveLayerId(l.id); }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, color: C.inkSoft, flexShrink: 0 }}
                          >
                            {l.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            type="button"
                            title={l.locked ? "Unlock layer" : "Lock layer"}
                            onClick={(e) => { e.stopPropagation(); toggleLayerLock(l.id); setActiveLayerId(l.id); }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, color: l.locked ? STAMP_INK_BLUE : C.inkSoft, flexShrink: 0 }}
                          >
                            {l.locked ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>
                          <button
                            type="button"
                            title="Bring forward (on top)"
                            onClick={(e) => { e.stopPropagation(); moveLayerOrder(l.id, 1); }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, color: C.inkSoft, flexShrink: 0 }}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            title="Send backward"
                            onClick={(e) => { e.stopPropagation(); moveLayerOrder(l.id, -1); }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, color: C.inkSoft, flexShrink: 0 }}
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            title="Duplicate layer"
                            onClick={(e) => { e.stopPropagation(); duplicateLayer(l.id); }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, color: selected ? STAMP_INK_BLUE : C.inkSoft, flexShrink: 0 }}
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            title="Delete layer"
                            onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, color: C.stamp, flexShrink: 0 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : mobileEditorPanel === "edit" ? (
              <div id="mobile-stamp-edit-properties">
                {activeLayer ? (
                  <>
                    <Label>Edit properties</Label>
                    {textFields}
                    {layerPanel}
                  </>
                ) : (
                  <div style={{ padding: "12px 0", color: C.inkSoft, fontFamily: font.mono, fontSize: 11 }}>
                    Select a layer from Layer tab first.
                  </div>
                )}
              </div>
            ) : null}
          </Card>
        </>
      )}

      {(!isDesktop && view === "editor" && mobileEditorPanel !== "size") ? null : (
        <div style={{
          minHeight: isDesktop ? 60 : "auto",
          display: "flex", flexDirection: isDesktop ? "row" : "column",
          alignItems: isDesktop ? "center" : "stretch",
          justifyContent: "space-between",
          gap: isDesktop ? 16 : 10, padding: isDesktop ? "8px 10px" : "10px", background: C.white, border: `1px solid ${C.line}`,
          borderTop: "none", marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: font.body, fontSize: 13.5, color: C.ink, minWidth: 0, flexWrap: isDesktop ? "nowrap" : "wrap" }}>
            <span style={{ fontWeight: 600, flexShrink: 0 }}>Stamp size:</span>
            <div style={{ position: "relative", minWidth: isDesktop ? 250 : 0, flex: isDesktop ? "none" : 1 }}>
              <button
                type="button"
                onClick={() => setSizeMenuOpen((v) => !v)}
                style={{ width: "100%", minHeight: 42, padding: "6px 10px", border: `1px solid ${sizeMenuOpen ? STAMP_INK_BLUE : C.line}`, borderRadius: 8, background: C.white, color: C.ink, fontSize: 13, outline: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {selectedRubber?.photo_url ? <img src={selectedRubber.photo_url} alt="" style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 5, border: `1px solid ${C.line}`, flexShrink: 0 }} /> : <span style={{ width: 30, height: 30, borderRadius: 5, background: C.paperDark, display: "grid", placeItems: "center", flexShrink: 0 }}><Stamp size={15} color={C.inkSoft} /></span>}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedRubber ? `${selectedRubber.name} — ${selectedRubber.size}` : "Select rubber size"}</span>
                  {selectedRubber && <span style={{ fontFamily: font.mono, fontWeight: 700, color: STAMP_INK_BLUE, flexShrink: 0 }}>{inr(selectedRubber.rate)}</span>}
                </span>
                <ChevronRight size={15} style={{ transform: sizeMenuOpen ? "rotate(90deg)" : "none", flexShrink: 0 }} />
              </button>
              {sizeMenuOpen && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: "calc(100% + 4px)",
                  zIndex: 50,
                  width: isDesktop ? "min(560px, calc(100vw - 285px))" : "calc(100vw - 20px)",
                  maxWidth: isDesktop ? "560px" : "calc(100vw - 20px)",
                  background: C.white,
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  boxShadow: "0 10px 30px rgba(38,50,65,.18)",
                  maxHeight: isDesktop ? 560 : 430,
                  overflowY: "auto",
                  padding: 10,
                  display: "grid",
                  gridTemplateColumns: isDesktop ? "repeat(4, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}>
                  {rubberSizes.length === 0 ? (
                    <div style={{ padding: 12, color: C.inkSoft, fontSize: 12 }}>No rubber sizes configured. Add a Rubber item with a size and photo in Rubber.</div>
                  ) : rubberSizes.map((r) => {
                    const active = r.id === selectedRubberId;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedRubberId(r.id);
                          setPlateSize(r.parsed.widthMm);
                          setSizeMenuOpen(false);
                        }}
                        style={{
                          width: "100%",
                          minWidth: 0,
                          minHeight: isDesktop ? 150 : 126,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          gap: 6,
                          padding: "10px 8px 9px",
                          border: `1.5px solid ${active ? STAMP_INK_BLUE : C.line}`,
                          borderRadius: 9,
                          background: active ? "#EAF2FF" : C.white,
                          color: active ? STAMP_INK_BLUE : C.ink,
                          cursor: "pointer",
                          textAlign: "center",
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        {r.photo_url ? <img src={r.photo_url} alt="" style={{ width: isDesktop ? 72 : 62, height: isDesktop ? 72 : 62, objectFit: "cover", borderRadius: 7, border: `1px solid ${C.line}`, flexShrink: 0 }} /> : <span style={{ width: isDesktop ? 72 : 62, height: isDesktop ? 72 : 62, borderRadius: 7, background: C.paperDark, display: "grid", placeItems: "center", flexShrink: 0 }}><Stamp size={24} color={C.inkSoft} /></span>}
                        <span style={{ minWidth: 0, width: "100%", display: "block" }}>
                          <span style={{ display: "block", fontWeight: active ? 750 : 650, fontSize: 12, lineHeight: 1.2, whiteSpace: "normal", overflowWrap: "anywhere" }}>{r.name}</span>
                          <span style={{ display: "block", marginTop: 3, color: active ? STAMP_INK_BLUE : C.inkSoft, fontFamily: font.mono, fontSize: 9.5, lineHeight: 1.35 }}>{r.size} · {r.parsed.widthMm} × {r.parsed.heightMm} mm</span>
                        </span>
                        <span style={{ fontFamily: font.mono, fontWeight: 800, fontSize: 12.5, color: active ? STAMP_INK_BLUE : C.ink, flexShrink: 0 }}>{inr(r.rate)}</span>
                        {active && <span style={{ width: 22, height: 22, borderRadius: "50%", background: STAMP_INK_BLUE, color: C.white, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <span style={{ color: C.inkSoft, whiteSpace: "nowrap" }}>{selectedDimensions.widthMm} × {selectedDimensions.heightMm} mm</span>
            {autoSaveStatus && <span style={{ color: C.sage, fontFamily: font.mono, fontSize: 10, whiteSpace: "nowrap" }}>{autoSaveStatus}</span>}
          </div>
        </div>
      )}

      {!isDesktop && view === "editor" && mobileEditorPanel !== "size" ? null : <Card id="mobile-stamp-size">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Stamp Size</div>
        <div style={{ color: C.inkSoft, fontSize: 12, lineHeight: 1.45, marginBottom: 12 }}>
          Set the stamp width and height. Changes are applied to the selected stamp canvas.
        </div>
        {selectedRubber && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 12 }}>
            {selectedRubber.photo_url ? <img src={selectedRubber.photo_url} alt="" style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.line}`, flexShrink: 0 }} /> : <span style={{ width: 38, height: 38, borderRadius: 6, background: C.paperDark, display: "grid", placeItems: "center", flexShrink: 0 }}><Stamp size={17} color={C.inkSoft} /></span>}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 650, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedRubber.name}</div>
              <div style={{ fontFamily: font.mono, fontSize: 11, color: C.inkSoft }}>{selectedDimensions.widthMm} × {selectedDimensions.heightMm} mm</div>
            </div>
            <div style={{ fontFamily: font.mono, fontWeight: 800, fontSize: 15, color: STAMP_INK_BLUE, flexShrink: 0 }}>{inr(selectedRubber.rate)}</div>
          </div>
        )}
        {sizeControls}
      </Card>}



      {customerMode && (
        (!isDesktop && view === "editor" && mobileEditorPanel !== "submit") ? null : <Card id="mobile-stamp-customer-submit" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Submit & Download Preview</div>
          <div style={{ color: C.inkSoft, fontSize: 12, lineHeight: 1.45, marginBottom: 12 }}>
            Enter your name and mobile number. Download is a protected preview.
          </div>
          <Field placeholder="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <Field placeholder="Mobile number" inputMode="tel" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} />
          <Btn
            onClick={async () => {
              await handleCustomerSubmit();
              await downloadCustomerStampPreview();
            }}
            style={{ width: "100%", justifyContent: "center", background: STAMP_INK_BLUE }}
          >
            Submit & Download Preview
          </Btn>
          {customerSubmitStatus && <div style={{ marginTop: 9, color: C.inkSoft, fontFamily: font.mono, fontSize: 11.5 }}>{customerSubmitStatus}</div>}
        </Card>
      )}

      {!isDesktop && view === "editor" && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 100,
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          background: C.white, borderTop: `1px solid ${C.line}`,
          boxShadow: "0 -4px 18px rgba(38,50,65,.10)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          {[
            { id: "layers", label: "Layer", icon: Package },
            { id: "edit", label: "Edit", icon: PenSquare },
            { id: "size", label: "Size", icon: Maximize2 },
            { id: "submit", label: "Submit", icon: Download },
          ].map((item) => {
            const Icon = item.icon;
            const active = mobileEditorPanel === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToMobileEditorSection(item.id)}
                style={{
                  border: "none", background: active ? "#EAF2FF" : C.white,
                  color: active ? STAMP_INK_BLUE : C.inkSoft,
                  minWidth: 0, height: 58, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                  fontFamily: font.mono, fontSize: 10, fontWeight: active ? 800 : 600,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  cursor: "pointer",
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
      {sizePickerModal}
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
  const [editPaymentMode, setEditPaymentMode] = useState("Cash");
  const [editRemarks, setEditRemarks] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

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
    setEditPaymentMode(e.payment_mode || "Cash");
    setEditRemarks(e.remarks || "");
  };
  const editRubber = rubbers.find((r) => r.id === editRubberId);
  const editRate = editRubber?.rate || 0;
  const editAmount = Math.max(0, editRate - Number(editDiscount || 0));

  const saveEdit = async () => {
    if (!editRubberId || editBusy) return;
    setEditBusy(true); setErrMsg("");
    try {
      await dbUpdate("stamp_entries", editId, {
        date: editDate, rubber_id: editRubberId, mobile: editMobile,
        rate: editRate, discount: Number(editDiscount || 0), amount: editAmount, payment_mode: editPaymentMode, remarks: editRemarks,
      });
      setEditId(null);
      await refresh();
    } catch (err) {
      setErrMsg(err.message || "Save failed — check connection.");
    } finally {
      setEditBusy(false);
    }
  };
  const removeEntry = async (id) => {
    try { await dbDelete("stamp_entries", id); await refresh(); }
    catch (err) { setErrMsg(err.message || "Delete failed — check connection."); }
  };

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
        "Payment Mode": e.payment_mode || "Cash",
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
      {errMsg && <div style={{ marginBottom: 10, padding: 9, background: "#FBEAE7", border: `1px solid ${C.stamp}`, borderRadius: 8, fontSize: 11.5, color: C.stampDark }}>{errMsg}</div>}
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
                <Label>Payment Mode</Label>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {["Cash", "Bank"].map((mode) => (
                    <Btn key={mode} variant={editPaymentMode === mode ? "solid" : "ghost"} onClick={() => setEditPaymentMode(mode)} style={{ flex: 1, justifyContent: "center" }}>{mode === "Cash" ? "💵 Cash" : "🏦 Bank"}</Btn>
                  ))}
                </div>
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
                  <div style={{ display: "inline-flex", marginTop: 5, padding: "2px 7px", borderRadius: 999, background: (e.payment_mode || "Cash") === "Bank" ? "#EAF2FF" : "#EEF8F1", color: (e.payment_mode || "Cash") === "Bank" ? C.stampDark : "#2D7A4A", fontFamily: font.mono, fontSize: 10, fontWeight: 700 }}>{(e.payment_mode || "Cash") === "Bank" ? "🏦 BANK" : "💵 CASH"}</div>
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
  const rubberOnly = rubbers.filter((r) => String(r.category || "rubber").toLowerCase() === "rubber");
  return (
    <div>
      <SectionTitle icon={Package} title="Stock Report" />
      <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", overflowX: "auto", maxWidth: "100%", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "38%" }} /><col style={{ width: "16%" }} /><col style={{ width: "15%" }} /><col style={{ width: "15%" }} /><col style={{ width: "16%" }} />
          </colgroup>
          <thead><tr>
            <th style={thStyle}>Rubber / Size</th><th style={{ ...thStyle, textAlign: "right" }}>Rate (₹)</th><th style={{ ...thStyle, textAlign: "right" }}>In</th><th style={{ ...thStyle, textAlign: "right" }}>Out</th><th style={{ ...thStyle, textAlign: "right" }}>Close</th>
          </tr></thead>
          <tbody>
            {rubberOnly.map((r) => {
              const s = stockByRubber[r.id] || { opening: 0, purchased: 0, used: 0, balance: 0 };
              const low = s.balance <= 15;
              return <tr key={r.id}>
                <td style={{ ...tdStyle, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    {r.photo_url ? <img src={r.photo_url} alt={r.name} style={{ width: 34, height: 34, borderRadius: 7, objectFit: "cover", border: `1px solid ${C.line}`, flexShrink: 0 }} /> : <div style={{ width: 34, height: 34, borderRadius: 7, background: C.paperDark, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Stamp size={14} color={C.brass} /></div>}
                    <div style={{ minWidth: 0 }}><div style={{ fontFamily: font.body, fontWeight: 650, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>{r.size && <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkSoft, marginTop: 2 }}>Size: {r.size}</div>}</div>
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{inr(r.rate)}</td>
                <td style={{ ...tdStyle, textAlign: "right", color: C.sage }}>+{s.purchased}</td><td style={{ ...tdStyle, textAlign: "right", color: C.stamp }}>−{s.used}</td><td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: low ? C.stamp : C.ink }}>{low ? `${s.balance} ⚠` : s.balance}</td>
              </tr>;
            })}
          </tbody>
        </table>
        {rubberOnly.length === 0 && <EmptyNote text="No rubber items found." />}
      </div>
    </div>
  );
}
const thStyle = { padding: "8px 6px", textAlign: "left", fontFamily: font.mono, fontSize: 9.5, letterSpacing: 0.5, textTransform: "uppercase", color: C.inkSoft, background: C.paperDark, borderBottom: `1px solid ${C.line}` };
const tdStyle = { padding: "8px 6px", fontFamily: font.mono, fontSize: 11.5, color: C.ink, borderBottom: `1px solid ${C.paperDark}`, overflow: "hidden" };
function Row({ label, value, color, bold }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.mono, fontSize: 12.5, color: color || C.ink, fontWeight: bold ? 700 : 400, marginBottom: 3 }}><span>{label}</span><span>{value}</span></div>;
}


/* ================= ITEM MASTER ================= */
function RubberTab({ rubbers, refresh }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("rubber");
  const [size, setSize] = useState("");
  const [opening, setOpening] = useState(0);
  const [rate, setRate] = useState(0);
  const [q, setQ] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("rubber");
  const [editSize, setEditSize] = useState("");
  const [editOpening, setEditOpening] = useState(0);
  const [editRate, setEditRate] = useState(0);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const startEdit = (r) => {
    setEditId(r.id); setEditName(r.name); setEditCategory(r.category || "rubber");
    setEditSize(r.size || ""); setEditOpening(r.opening_stock || 0); setEditRate(r.rate || 0);
    setEditPhotoPreview(r.photo_url || null); setEditPhotoUrl(r.photo_url || null); setEditPhotoFile(null);
  };
  const handleEditPhotoChange = (e) => { const file=e.target.files[0]; if(!file)return; setEditPhotoFile(file); setEditPhotoPreview(URL.createObjectURL(file)); };
  const saveEdit = async () => {
    if (!editName.trim() || busy) return;
    setBusy(true); setErrMsg("");
    try {
      let photo_url = editPhotoUrl;
      if (editPhotoFile) photo_url = await uploadPhoto(editPhotoFile, "rubbers");
      await dbUpdate("rubbers", editId, {
        name: editName.trim(), category: editCategory, size: editCategory === "rubber" ? editSize.trim() || null : null,
        opening_stock: Number(editOpening) || 0, rate: Number(editRate) || 0, photo_url
      });
      setEditId(null); await refresh();
    } catch (err) { setErrMsg(err.message || "Save failed — check connection."); }
    finally { setBusy(false); }
  };
  const handlePhotoChange = (e) => { const file=e.target.files[0]; if(!file)return; setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); };
  const add = async () => {
    if (!name.trim() || busy) return;
    setBusy(true); setErrMsg("");
    try {
      let photo_url = null;
      if (photoFile) photo_url = await uploadPhoto(photoFile, "rubbers");
      await dbInsert("rubbers", {
        id: uid(), name: name.trim(), category, size: category === "rubber" ? size.trim() || null : null,
        opening_stock: Number(opening) || 0, rate: Number(rate) || 0, photo_url
      });
      setName(""); setCategory("rubber"); setSize(""); setOpening(0); setRate(0); setPhotoPreview(null); setPhotoFile(null); await refresh();
    } catch (err) { setErrMsg(err.message || "Save failed — check connection."); }
    finally { setBusy(false); }
  };
  const remove = async (id) => {
    try { await dbDelete("rubbers", id); await refresh(); }
    catch (err) { setErrMsg(err.message || "Delete failed — check connection."); }
  };
  const filtered = rubbers.filter((r) => `${r.name} ${r.category || "rubber"} ${r.size || ""}`.toLowerCase().includes(q.toLowerCase()));
  const catLabel = (c) => c === "machine" ? "Machine" : c === "raw" ? "Raw" : "Rubber";

  return (
    <div>
      <SectionTitle icon={Package} title="Item Master" />
      <Card>
        {errMsg && <div style={{ marginBottom: 10, padding: 9, background: "#FBEAE7", border: `1px solid ${C.stamp}`, borderRadius: 8, fontSize: 11.5, color: C.stampDark }}>{errMsg}</div>}
        <Label>Item Name</Label>
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Round Seal / Cutting Machine / Rubber Sheet" />
        <Label>Category</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="machine">Machine</option><option value="raw">Raw</option><option value="rubber">Rubber</option>
        </Select>
        {category === "rubber" && <><Label>Impression Size (mm)</Label><Field value={size} onChange={(e) => setSize(e.target.value)} placeholder='e.g. 38 × 13 mm' /></>}
        <Label>Opening Stock</Label><Field type="number" value={opening} onChange={(e) => setOpening(e.target.value)} />
        <Label>Rate (₹)</Label><Field type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Selling rate" />
        <Label>{category === "rubber" ? "Rubber Stamp Photo" : "Item Photo"}</Label>
        <label style={{ display:"block", border:`1px dashed ${C.brass}`, borderRadius:8, padding:16, textAlign:"center", color:C.brass, fontSize:13, marginBottom:12, cursor:"pointer", overflow:"hidden" }}>
          {photoPreview ? <img src={photoPreview} alt="Item" style={{ maxWidth:"100%", maxHeight:160, borderRadius:6 }} /> : "📷 Tap to capture / upload photo"}
          <input type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoChange}/>
        </label>
        <Btn onClick={add} disabled={busy} style={{width:"100%",justifyContent:"center"}}><Plus size={16}/> {busy ? "Saving…" : "Add Item"}</Btn>
      </Card>
      <div style={{position:"relative",marginBottom:10}}><Search size={15} style={{position:"absolute",left:10,top:12,color:C.inkSoft}}/><Field placeholder="Search item name, category or size…" value={q} onChange={(e)=>setQ(e.target.value)} style={{paddingLeft:32}}/></div>
      {filtered.map((r)=><Card key={r.id}>
        {editId === r.id ? <div>
          <Label>Item Name</Label><Field value={editName} onChange={(e)=>setEditName(e.target.value)}/>
          <Label>Category</Label><Select value={editCategory} onChange={(e)=>setEditCategory(e.target.value)}><option value="machine">Machine</option><option value="raw">Raw</option><option value="rubber">Rubber</option></Select>
          {editCategory === "rubber" && <><Label>Impression Size (mm)</Label><Field value={editSize} onChange={(e)=>setEditSize(e.target.value)} placeholder='e.g. 38 × 13 mm'/></>}
          <Label>Opening Stock</Label><Field type="number" value={editOpening} onChange={(e)=>setEditOpening(e.target.value)}/>
          <Label>Rate (₹)</Label><Field type="number" min="0" value={editRate} onChange={(e)=>setEditRate(e.target.value)} placeholder="Selling rate"/>
          <Label>Item Photo</Label>
          <label style={{display:"block",border:`1px dashed ${C.brass}`,borderRadius:8,padding:16,textAlign:"center",color:C.brass,fontSize:13,marginBottom:12,cursor:"pointer",overflow:"hidden"}}>{editPhotoPreview?<img src={editPhotoPreview} alt="Item" style={{maxWidth:"100%",maxHeight:160,borderRadius:6}}/>:"📷 Tap to capture / upload photo"}<input type="file" accept="image/*" style={{display:"none"}} onChange={handleEditPhotoChange}/></label>
          <div style={{display:"flex",gap:8}}><Btn onClick={saveEdit} disabled={busy} style={{flex:1,justifyContent:"center"}}>{busy?"Saving…":"Save"}</Btn><Btn variant="ghost" onClick={()=>setEditId(null)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn></div>
        </div> : <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {r.photo_url?<img src={r.photo_url} alt={r.name} style={{width:40,height:40,borderRadius:8,objectFit:"cover",border:`1px solid ${C.line}`}}/>:<div style={{width:40,height:40,borderRadius:8,background:C.paperDark,border:`1px solid ${C.line}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Package size={18} color={C.brass}/></div>}
            <div><div style={{fontWeight:600,fontSize:13.5}}>{r.name}</div><div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginTop:3}}><span style={{padding:"2px 7px",borderRadius:999,background:C.paperDark,fontFamily:font.mono,fontSize:9,fontWeight:700}}>{catLabel(r.category)}</span>{r.category === "rubber" && r.size && <span style={{fontFamily:font.mono,fontSize:10,color:C.inkSoft}}>Size: {r.size}</span>}<span style={{fontFamily:font.mono,fontSize:10,color:C.inkSoft}}>Opening: {r.opening_stock}</span><span style={{fontFamily:font.mono,fontSize:10,color:C.inkSoft}}>Rate: ₹{Number(r.rate||0).toFixed(2)}</span></div></div>
          </div><div style={{display:"flex",gap:6}}><button onClick={()=>startEdit(r)} style={{background:"none",border:"none",color:C.brass,cursor:"pointer"}}><PenSquare size={16}/></button><button onClick={()=>remove(r.id)} style={{background:"none",border:"none",color:C.stamp,cursor:"pointer"}}><Trash2 size={16}/></button></div>
        </div>}
      </Card>)}
    </div>
  );
}

/* ================= PURCHASE ================= */
function PurchaseTab({ rubbers, purchases, refresh }) {
  const [date,setDate]=useState(todayISO()); const [paymentMode,setPaymentMode]=useState("Cash");
  const [items,setItems]=useState([{rubberId:rubbers[0]?.id||"",qty:"",purchaseRate:""}]); const [busy,setBusy]=useState(false); const [errMsg,setErrMsg]=useState("");
  const [editId,setEditId]=useState(null); const [editRubberId,setEditRubberId]=useState(""); const [editQty,setEditQty]=useState(0); const [editRate,setEditRate]=useState(0); const [editDate,setEditDate]=useState(todayISO()); const [editPaymentMode,setEditPaymentMode]=useState("Cash"); const [editBusy,setEditBusy]=useState(false);
  const addRow=()=>setItems([...items,{rubberId:rubbers[0]?.id||"",qty:"",purchaseRate:""}]); const removeRow=(idx)=>setItems(items.filter((_,i)=>i!==idx)); const updateRow=(idx,patch)=>setItems(items.map((it,i)=>i===idx?{...it,...patch}:it));
  const itemsAmount=items.reduce((s,it)=>s+Number(it.qty||0)*Number(it.purchaseRate||0),0);
  const save=async()=>{const validItems=items.filter(it=>it.rubberId&&Number(it.qty)>0);if(!validItems.length||busy)return;setBusy(true);setErrMsg("");try{for(const it of validItems){const amount=Number(it.qty)*Number(it.purchaseRate||0);await dbInsert("purchases",{id:uid(),date,rubber_id:it.rubberId,qty:Number(it.qty),purchase_rate:Number(it.purchaseRate||0),amount,courier:0,total:amount,payment_mode:paymentMode});}setItems([{rubberId:rubbers[0]?.id||"",qty:"",purchaseRate:""}]);await refresh();}catch(err){setErrMsg(err.message||"Save failed — check connection.");}finally{setBusy(false);}};
  const startEdit=(p)=>{setEditId(p.id);setEditRubberId(p.rubber_id);setEditQty(p.qty);setEditRate(p.purchase_rate);setEditPaymentMode(p.payment_mode||"Cash");setEditDate(p.date);};
  const saveEdit=async()=>{if(!editRubberId||!editQty||editBusy)return;setEditBusy(true);setErrMsg("");try{const amount=Number(editQty)*Number(editRate||0);await dbUpdate("purchases",editId,{date:editDate,rubber_id:editRubberId,qty:Number(editQty),purchase_rate:Number(editRate||0),amount,courier:0,total:amount,payment_mode:editPaymentMode});setEditId(null);await refresh();}catch(err){setErrMsg(err.message||"Save failed — check connection.");}finally{setEditBusy(false);}};
  const removePurchase=async(id)=>{try{await dbDelete("purchases",id);await refresh();}catch(err){setErrMsg(err.message||"Delete failed — check connection.");}};
  const grouped=useMemo(()=>{const map=new Map();purchases.forEach(p=>{const key=p.date;if(!map.has(key))map.set(key,{date:key,items:[],total:0,modes:new Set()});const g=map.get(key);g.items.push(p);g.total+=Number(p.total??p.amount??0);g.modes.add(p.payment_mode||"Cash");});return [...map.values()].sort((a,b)=>new Date(b.date)-new Date(a.date));},[purchases]);
  const exportCSV=()=>{const rows=[...purchases].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p=>{const r=rubbers.find(r=>r.id===p.rubber_id);return{Date:fmtDate(p.date),"Payment Mode":p.payment_mode||"Cash","Category":r?.category||"rubber","Size":r?.category==="rubber"?(r?.size||""):"","Item Name":r?.name||"",Qty:p.qty,Rate:p.purchase_rate,Total:Number(p.total??p.amount??0)};});exportToCSV(`purchases-${todayISO()}.csv`,rows);};
  const catLabel=(c)=>c==="machine"?"Machine":c==="raw"?"Raw":"Rubber";
  const optionLabel=(r)=>`${r.name} · ${catLabel(r.category)}${r.category==="rubber"&&r.size?` · ${r.size}`:""}`;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingBottom:10,borderBottom:`2px solid ${C.headerGreen}`,gap:8}}><SectionTitle icon={ShoppingCart} title="Purchase Entry" bare/><Btn variant="ghost" onClick={exportCSV} style={{padding:"6px 10px",fontSize:11.5,flexShrink:0}}><Download size={13}/> Export</Btn></div>
    {errMsg && <div style={{ marginBottom: 10, padding: 9, background: "#FBEAE7", border: `1px solid ${C.stamp}`, borderRadius: 8, fontSize: 11.5, color: C.stampDark }}>{errMsg}</div>}
    <Card><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}><div><Label>Date</Label><Field type="date" value={date} onChange={e=>setDate(e.target.value)} style={{marginBottom:0}}/></div><div><Label>Payment Mode</Label><div style={{display:"flex",gap:7}}><Btn variant={paymentMode==="Cash"?"solid":"ghost"} onClick={()=>setPaymentMode("Cash")} style={{flex:1,justifyContent:"center",padding:"9px 10px"}}>💵 Cash</Btn><Btn variant={paymentMode==="Bank"?"solid":"ghost"} onClick={()=>setPaymentMode("Bank")} style={{flex:1,justifyContent:"center",padding:"9px 10px"}}>🏦 Bank</Btn></div></div></div>
      <div style={{display:"grid",gridTemplateColumns:"38px minmax(180px,1fr) 120px 140px 110px 34px",gap:8,alignItems:"center",padding:"8px 10px",background:C.paperDark,borderRadius:7,fontFamily:font.mono,fontSize:10,color:C.inkSoft,letterSpacing:.5}}><span>#</span><span>ITEM · CATEGORY · SIZE</span><span>QTY</span><span>RATE (₹)</span><span style={{textAlign:"right"}}>AMOUNT</span><span/></div>
      {items.map((it,idx)=>{const rowAmount=Number(it.qty||0)*Number(it.purchaseRate||0);return <div key={idx} style={{display:"grid",gridTemplateColumns:"38px minmax(180px,1fr) 120px 140px 110px 34px",gap:8,alignItems:"center",padding:"9px 10px",borderBottom:`1px solid ${C.line}`}}><div style={{fontFamily:font.mono,fontWeight:700,color:C.inkSoft}}>{idx+1}</div><Select value={it.rubberId} onChange={e=>updateRow(idx,{rubberId:e.target.value})} style={{marginBottom:0}}>{rubbers.map(r=><option key={r.id} value={r.id}>{optionLabel(r)}</option>)}</Select><Field type="number" min="0" value={it.qty} onChange={e=>updateRow(idx,{qty:e.target.value})} placeholder="Qty" style={{marginBottom:0}}/><Field type="number" min="0" value={it.purchaseRate} onChange={e=>updateRow(idx,{purchaseRate:e.target.value})} placeholder="Rate" style={{marginBottom:0}}/><div style={{textAlign:"right",fontFamily:font.mono,fontWeight:700}}>{inr(rowAmount)}</div>{items.length>1?<button onClick={()=>removeRow(idx)} style={{background:"none",border:"none",color:C.stamp,cursor:"pointer"}}><Trash2 size={15}/></button>:<span/>}</div>})}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,gap:10,flexWrap:"wrap"}}><Btn variant="ghost" onClick={addRow}><Plus size={15}/> Add Item</Btn><div style={{textAlign:"right"}}><div style={{fontFamily:font.mono,fontSize:10,color:C.inkSoft,letterSpacing:1}}>TOTAL</div><div style={{fontFamily:font.display,fontSize:24,fontWeight:800}}>{inr(itemsAmount)}</div></div></div><Btn onClick={save} disabled={busy} style={{width:"100%",justifyContent:"center",marginTop:12}}><Plus size={16}/> {busy?"Saving…":"Save Purchase"}</Btn>
    </Card>
    <Label>Purchase List</Label>
    {grouped.slice(0,30).map(g=>{const mode=g.modes.size===1?[...g.modes][0]:"Mixed";return <Card key={g.date}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:8}}><div><div style={{fontWeight:800,fontSize:14}}>{fmtDate(g.date)}</div><div style={{display:"inline-flex",marginTop:5,padding:"2px 8px",borderRadius:999,background:mode==="Bank"?"#EAF2FF":"#EEF8F1",color:mode==="Bank"?C.stampDark:"#2D7A4A",fontFamily:font.mono,fontSize:10,fontWeight:700}}>{mode==="Bank"?"🏦 BANK":mode==="Cash"?"💵 CASH":"CASH + BANK"}</div></div><div style={{textAlign:"right",fontFamily:font.mono,fontWeight:800,fontSize:15}}>{inr(g.total)}</div></div><div style={{borderTop:`1px solid ${C.line}`}}>{g.items.map((p,i)=>{const r=rubbers.find(r=>r.id===p.rubber_id);return editId===p.id?<div key={p.id} style={{padding:"10px 0",borderBottom:i<g.items.length-1?`1px solid ${C.line}`:"none"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><Label>Date</Label><Field type="date" value={editDate} onChange={e=>setEditDate(e.target.value)}/></div><div><Label>Payment Mode</Label><div style={{display:"flex",gap:6}}><Btn variant={editPaymentMode==="Cash"?"solid":"ghost"} onClick={()=>setEditPaymentMode("Cash")} style={{flex:1,justifyContent:"center"}}>Cash</Btn><Btn variant={editPaymentMode==="Bank"?"solid":"ghost"} onClick={()=>setEditPaymentMode("Bank")} style={{flex:1,justifyContent:"center"}}>Bank</Btn></div></div></div><Label>Item / Category / Size</Label><Select value={editRubberId} onChange={e=>setEditRubberId(e.target.value)}>{rubbers.map(rb=><option key={rb.id} value={rb.id}>{optionLabel(rb)}</option>)}</Select><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><Label>Qty</Label><Field type="number" value={editQty} onChange={e=>setEditQty(e.target.value)}/></div><div><Label>Rate (₹)</Label><Field type="number" value={editRate} onChange={e=>setEditRate(e.target.value)}/></div></div><div style={{display:"flex",gap:8}}><Btn onClick={saveEdit} disabled={editBusy} style={{flex:1,justifyContent:"center"}}>{editBusy?"Saving…":"Save"}</Btn><Btn variant="ghost" onClick={()=>setEditId(null)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn></div></div>:<div key={p.id} style={{display:"grid",gridTemplateColumns:"32px minmax(160px,1fr) 80px 100px 110px 50px",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<g.items.length-1?`1px solid ${C.line}`:"none"}}><div style={{fontFamily:font.mono,color:C.inkSoft}}>{i+1}</div><div><div style={{fontWeight:600}}>{r?.name||"Unknown Item"}</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:2}}><span style={{fontFamily:font.mono,fontSize:9,padding:"1px 6px",borderRadius:999,background:C.paperDark}}>{catLabel(r?.category)}</span>{r?.category==="rubber"&&r?.size&&<span style={{fontFamily:font.mono,fontSize:9,color:C.inkSoft}}>Size: {r.size}</span>}</div></div><div style={{fontFamily:font.mono}}>Qty {p.qty}</div><div style={{fontFamily:font.mono}}>₹{Number(p.purchase_rate||0).toFixed(2)}</div><div style={{textAlign:"right",fontFamily:font.mono,fontWeight:700}}>{inr(p.total??p.amount??0)}</div><div style={{display:"flex",gap:2,justifyContent:"flex-end"}}><button onClick={()=>startEdit(p)} style={{background:"none",border:"none",color:C.brass,cursor:"pointer"}}><PenSquare size={15}/></button><button onClick={()=>removePurchase(p.id)} style={{background:"none",border:"none",color:C.stamp,cursor:"pointer"}}><Trash2 size={15}/></button></div></div>})}</div><div style={{display:"flex",justifyContent:"flex-end",paddingTop:10,fontFamily:font.mono,fontWeight:800}}>TOTAL&nbsp;&nbsp; {inr(g.total)}</div></Card>})}
    {purchases.length===0&&<EmptyNote text="No purchases recorded yet."/>}
  </div>;
}

/* ================= CASH REGISTER ================= */
function LedgerTab({ purchases, entries, cashManual, rubbers, refresh }) {
  const [type, setType] = useState("in");
  const [category, setCategory] = useState("Other Receipt");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(todayISO());
  const [errMsg, setErrMsg] = useState("");

  const cashSales = entries.filter(e => (e.payment_mode || "Cash") === "Cash");
  const cashPurchases = purchases.filter(p => (p.payment_mode || "Cash") === "Cash");
  const inRange = (d) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  const purchaseSingleEntries = useMemo(() => {
    const map = new Map();
    cashPurchases.forEach((p) => {
      const key = p.date;
      if (!map.has(key)) map.set(key, { date: key, amount: 0, count: 0 });
      const g = map.get(key);
      g.amount += Number(p.total ?? p.amount ?? 0);
      g.count += 1;
    });
    return [...map.values()].map((g) => ({
      id: `purchase-${g.date}`,
      date: g.date,
      label: `Purchase${g.count > 1 ? ` (${g.count} items)` : ""}`,
      type: "out",
      amount: g.amount,
      payment_mode: "Cash",
    }));
  }, [cashPurchases]);
  const allTxns = [
    ...cashSales.map(e => { const r=rubbers.find(r=>r.id===e.rubber_id); return {id:`sale-${e.id}`,date:e.date,label:`${r?.name||"Unknown Item"} - Sale`,type:"in",amount:Number(e.amount||0),payment_mode:"Cash"}; }),
    ...purchaseSingleEntries,
    ...cashManual.map(c => ({id:`manual-${c.id}`,date:c.date,label:c.category,type:c.type,amount:Number(c.amount||0),payment_mode:"Cash"}))
  ].sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));

  let running=0;
  const txnsWithBalance=allTxns.map(t=>{running += t.type === "in" ? t.amount : -t.amount; return {...t,balanceAfter:running};});
  const shown=txnsWithBalance.filter(t=>inRange(t.date)).reverse();
  const currentBalance=running;
  const filteredIn=shown.reduce((s,t)=>s+(t.type==="in"?t.amount:0),0);
  const filteredOut=shown.reduce((s,t)=>s+(t.type==="out"?t.amount:0),0);

  const addManual = async () => { if(!amount) return; try { await dbInsert("cash_manual",{id:uid(),date:todayISO(),type,category,amount:Number(amount),note}); setAmount(0);setNote("");setErrMsg("");await refresh(); } catch(err) { setErrMsg(err.message || "Save failed — check connection."); } };
  const exportCSV=()=>exportToCSV(`cash-register-${todayISO()}.csv`,shown.map(t=>({Date:fmtDate(t.date),Description:t.label,Type:t.type==="in"?"Cash In":"Cash Out",Amount:t.amount,Balance:t.balanceAfter})));

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingBottom:10,borderBottom:`2px solid ${C.headerGreen}`,gap:8}}><SectionTitle icon={Wallet} title="Cash Register" bare/><Btn variant="ghost" onClick={exportCSV} style={{padding:"6px 10px",fontSize:11.5}}><Download size={13}/> Export</Btn></div>
    <Card style={{marginBottom:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"end"}}><div><Label>From Date</Label><Field type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{marginBottom:0}}/></div><div><Label>To Date</Label><Field type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{marginBottom:0}}/></div><Btn variant="ghost" onClick={()=>{setFromDate("");setToDate(todayISO())}}>Reset</Btn></div></Card>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:12}}>
      <Card style={{background:C.ink,color:C.white}}><div style={{fontFamily:font.mono,fontSize:10,letterSpacing:1.5,color:"#DCE9FF"}}>CURRENT CASH BALANCE</div><div style={{fontFamily:font.display,fontWeight:700,fontSize:28,marginTop:4}}>{inr(currentBalance)}</div></Card>
      <Card><div style={{fontFamily:font.mono,fontSize:10,letterSpacing:1.5,color:C.inkSoft}}>SELECTED CASH IN</div><div style={{fontFamily:font.display,fontWeight:800,fontSize:25,marginTop:4}}>{inr(filteredIn)}</div></Card>
      <Card><div style={{fontFamily:font.mono,fontSize:10,letterSpacing:1.5,color:C.inkSoft}}>SELECTED CASH OUT</div><div style={{fontFamily:font.display,fontWeight:800,fontSize:25,marginTop:4}}>{inr(filteredOut)}</div></Card>
    </div>
    <Card><Label>Add Cash Entry</Label>{errMsg && <div style={{ marginBottom: 10, padding: 9, background: "#FBEAE7", border: `1px solid ${C.stamp}`, borderRadius: 8, fontSize: 11.5, color: C.stampDark }}>{errMsg}</div>}<div style={{display:"flex",gap:8,marginBottom:10}}><Btn variant={type==="in"?"solid":"ghost"} onClick={()=>setType("in")} style={{flex:1,justifyContent:"center"}}>Cash In</Btn><Btn variant={type==="out"?"solid":"ghost"} onClick={()=>setType("out")} style={{flex:1,justifyContent:"center"}}>Cash Out</Btn></div><Label>Category</Label><Select value={category} onChange={e=>setCategory(e.target.value)}>{type==="in"?<option>Other Receipt</option>:<option>Other Expense</option>}</Select><Label>Amount (₹)</Label><Field type="number" value={amount} onChange={e=>setAmount(e.target.value)}/><Label>Note (optional)</Label><Field value={note} onChange={e=>setNote(e.target.value)}/><Btn onClick={addManual} style={{width:"100%",justifyContent:"center"}}><Plus size={16}/> Add Entry</Btn></Card>
    <Label>Transactions</Label>
    {(() => { const groups=[]; shown.slice(0,100).forEach(t=>{const last=groups[groups.length-1];if(last&&last.date===t.date)last.items.push(t);else groups.push({date:t.date,items:[t]});}); return groups.map(g=><div key={g.date}><div style={{fontFamily:font.mono,fontSize:10.5,fontWeight:700,color:C.brass,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 6px"}}>{fmtDate(g.date)}</div>{g.items.map(t=><Card key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><div style={{minWidth:0,overflow:"hidden"}}><div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:font.mono,fontWeight:700,color:t.type==="in"?C.sage:C.stamp}}>{t.type==="in"?"+":"−"}{inr(t.amount)}</div><div style={{fontFamily:font.mono,fontSize:10,color:C.inkSoft,marginTop:2}}>Bal: {inr(t.balanceAfter)}</div></div></Card>)}</div>); })()}
    {shown.length===0 && <EmptyNote text="No cash transactions for the selected dates."/>}
  </div>;
}

/* ================= DASHBOARD ================= */
// Smooth 14-day sales line, drawn with the same Catmull-Rom smoothPath()
// helper used elsewhere, plus a soft gradient fill under the curve.
function TrendSVG({ data, color, height = 132 }) {
  const w = 600, h = height, padL = 6, padR = 6, padT = 14, padB = 6;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (w - padL - padR) / (data.length - 1) : 0;
  const pts = data.map((d, i) => [padL + i * stepX, padT + (h - padT - padB) * (1 - d.value / max)]);
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L ${pts[pts.length - 1][0]},${h - padB} L ${pts[0][0]},${h - padB} Z` : "";
  const gid = useRef(`tcg${uid()}`).current;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.33, 0.66].map((f) => (
        <line key={f} x1={padL} x2={w - padR} y1={padT + (h - padT - padB) * f} y2={padT + (h - padT - padB) * f} stroke={C.line} strokeWidth="1" strokeDasharray="3 4" />
      ))}
      {area && <path d={area} fill={`url(#${gid})`} stroke="none" />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={color} stroke={C.white} strokeWidth="1.5" />}
    </svg>
  );
}

// Paired cash-in / cash-out bars, one group per day.
function CashFlowSVG({ data, height = 132 }) {
  const w = 600, h = height, padL = 4, padR = 4, padT = 10, padB = 20;
  const max = Math.max(1, ...data.map((d) => Math.max(d.in, d.out)));
  const groupW = (w - padL - padR) / data.length;
  const barW = Math.min(18, groupW * 0.26);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
      {[0.33, 0.66].map((f) => (
        <line key={f} x1={padL} x2={w - padR} y1={padT + (h - padT - padB) * f} y2={padT + (h - padT - padB) * f} stroke={C.line} strokeWidth="1" strokeDasharray="3 4" />
      ))}
      {data.map((d, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const hi = (h - padT - padB) * (d.in / max);
        const ho = (h - padT - padB) * (d.out / max);
        return (
          <g key={i}>
            <rect x={cx - barW - 3} y={h - padB - hi} width={barW} height={Math.max(hi, d.in > 0 ? 2 : 0)} rx={2.5} fill="#159A83" />
            <rect x={cx + 3} y={h - padB - ho} width={barW} height={Math.max(ho, d.out > 0 ? 2 : 0)} rx={2.5} fill="#E58B45" />
            <text x={cx} y={h - 6} textAnchor="middle" fontSize="9.5" fontFamily={font.mono} fill={C.inkSoft}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <Card style={{ minWidth: 0 }}>
      <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.3, color: C.inkSoft, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 24, marginTop: 5, color: accent || C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ fontFamily: font.mono, fontSize: 10.5, color: C.inkSoft, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function DashboardTab({ rubbers, purchases, entries, cashManual, stockByRubber, user }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    let cancelled = false;
    dbGet("customer_designs").then((rows) => { if (!cancelled) setOrders(Array.isArray(rows) ? rows : []); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Use local calendar dates consistently for dashboard buckets.
  const localISO = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const todayStr = localISO(new Date());
  const monthPrefix = todayStr.slice(0, 7);
  const today = new Date();
  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-IN", { month: "short" }) };
  });
  const todaySales = entries.filter((e) => e.date === todayStr).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const todayCount = entries.filter((e) => e.date === todayStr).length;
  const monthSales = entries.filter((e) => (e.date || "").startsWith(monthPrefix)).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const monthCount = entries.filter((e) => (e.date || "").startsWith(monthPrefix)).length;
  const cashBalance = useMemo(() => {
    const cashIn = entries.filter((e) => (e.payment_mode || "Cash") === "Cash").reduce((sum, e) => sum + Number(e.amount || 0), 0)
      + cashManual.filter((c) => c.type === "in").reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const cashOut = purchases.filter((p) => (p.payment_mode || "Cash") === "Cash").reduce((sum, p) => sum + Number(p.total ?? p.amount ?? 0), 0)
      + cashManual.filter((c) => c.type === "out").reduce((sum, c) => sum + Number(c.amount || 0), 0);
    return cashIn - cashOut;
  }, [entries, purchases, cashManual]);

  const rubberOnly = rubbers.filter((r) => String(r.category || "rubber").toLowerCase() === "rubber");
  const lowStock = rubberOnly.filter((r) => (stockByRubber[r.id]?.balance ?? 0) <= 15);
  const pendingOrders = orders.filter((o) => (o.status || "new") !== "printed");
  const salesTrend = useMemo(() => {
    // Show the complete sales history: from the first recorded sale through today.
    // Keep every calendar day in the range so zero-sale days remain visible on the graph.
    const validDates = entries
      .map((e) => e.date)
      .filter(Boolean)
      .sort();
    const startKey = validDates[0] || todayStr;
    const start = new Date(`${startKey}T12:00:00`);
    const end = new Date(`${todayStr}T12:00:00`);
    const days = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(localISO(d));
    }
    const totals = new Map(days.map((d) => [d, 0]));
    entries.forEach((e) => {
      if (totals.has(e.date)) totals.set(e.date, totals.get(e.date) + Number(e.amount || 0));
    });
    return days.map((date) => ({ date, value: totals.get(date) || 0 }));
  }, [entries, todayStr]);
  const monthlyComparison = monthBuckets.map((m) => ({
    ...m,
    sales: entries.filter((e) => (e.date || "").startsWith(m.key)).reduce((sum, e) => sum + Number(e.amount || 0), 0),
    purchases: purchases.filter((p) => (p.date || "").startsWith(m.key)).reduce((sum, p) => sum + Number(p.total ?? p.amount ?? 0), 0),
  }));
  const cashFlow7d = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = localISO(d);
      const cashIn = entries.filter((e) => e.date === key && (e.payment_mode || "Cash") === "Cash").reduce((sum, e) => sum + Number(e.amount || 0), 0)
        + cashManual.filter((c) => c.date === key && c.type === "in").reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const cashOut = purchases.filter((p) => p.date === key && (p.payment_mode || "Cash") === "Cash").reduce((sum, p) => sum + Number(p.total ?? p.amount ?? 0), 0)
        + cashManual.filter((c) => c.date === key && c.type === "out").reduce((sum, c) => sum + Number(c.amount || 0), 0);
      return { label: new Date(`${key}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" }), in: cashIn, out: cashOut };
    });
  }, [entries, purchases, cashManual]);
  const topRubbers = useMemo(() => {
    const counts = new Map();
    entries.forEach((e) => { if (e.rubber_id) counts.set(e.rubber_id, (counts.get(e.rubber_id) || 0) + 1); });
    return [...counts.entries()].map(([id, count]) => ({ rubber: rubbers.find((r) => r.id === id), count }))
      .filter((x) => x.rubber).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [entries, rubbers]);
  const maxTopCount = Math.max(1, ...topRubbers.map((t) => t.count));
  const recentSales = entries.slice(0, 5);
  const maxMonthly = Math.max(1, ...monthlyComparison.flatMap((m) => [m.sales, m.purchases]));
  const paymentTotals = ["Cash", "UPI", "Card", "Bank"].map((mode) => ({
    mode, amount: entries.filter((e) => (e.payment_mode || "Cash").toLowerCase() === mode.toLowerCase()).reduce((sum, e) => sum + Number(e.amount || 0), 0)
  })).filter((x) => x.amount > 0);
  const paymentTotal = paymentTotals.reduce((sum, x) => sum + x.amount, 0);

  const panel = { background: C.white, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, minWidth: 0 };
  const sectionLabel = { fontFamily: font.mono, fontSize: 10, letterSpacing: 1.15, textTransform: "uppercase", color: C.inkSoft, marginBottom: 12 };
  const miniStat = { fontFamily: font.mono, fontSize: 10, color: C.inkSoft };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "4px 2px 12px", borderBottom: `1px solid ${C.line}` }}>
        <div>
          <div style={{ fontFamily: font.display, fontSize: 25, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>Good day, {user.name.split(" ")[0]}</div>
          <div style={{ color: C.inkSoft, fontSize: 12, marginTop: 5 }}>Your business at a glance</div>
        </div>
        <div style={{ border: `1px solid ${C.line}`, background: C.white, borderRadius: 10, padding: "8px 12px", fontFamily: font.mono, fontSize: 11, color: C.inkSoft }}>{fmtDate(todayStr)}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 10 }}>
        {[
          ["Today's sales", inr(todaySales), `${todayCount} stamp${todayCount === 1 ? "" : "s"} today`, "#3F7FE8"],
          ["This month", inr(monthSales), `${monthCount} stamps sold`, "#159A83"],
          ["Cash balance", inr(cashBalance), "Net cash position", "#8B6BD6"],
          ["Low stock", String(lowStock.length), "Items at 15 pcs or below", lowStock.length ? "#D97706" : "#159A83"],
          ...(user.role === "admin" ? [["Pending orders", String(pendingOrders.length), "Waiting to be printed", "#D97706"]] : []),
        ].map(([label, value, sub, accent]) => (
          <div key={label} style={{ ...panel, padding: 14, borderTop: `3px solid ${accent}` }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 700, color: C.ink, overflowWrap: "anywhere" }}>{value}</div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 5 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 12 }}>
        <section style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
            <div><div style={sectionLabel}>Sales trend · since first sale</div><div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 700, color: C.ink }}>{inr(salesTrend.reduce((sum, d) => sum + d.value, 0))}</div></div>
            <span style={{ ...miniStat, background: C.paper, borderRadius: 8, padding: "5px 7px" }}>ALL TIME</span>
          </div>
          <div style={{ padding: "12px 0 0" }}>
            <TrendSVG data={salesTrend} color="#3F7FE8" height={145} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", ...miniStat, marginTop: 8 }}><span>{fmtDate(salesTrend[0].date)}</span><span>{fmtDate(salesTrend[salesTrend.length - 1].date)}</span></div>
        </section>

        <section style={panel}>
          <div style={{ ...sectionLabel, marginBottom: 5 }}>Monthly sales vs purchases</div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 10 }}>Six-month comparison · amounts in ₹</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {monthlyComparison.map((m) => <div key={m.key}>
              <div style={{ display: "flex", justifyContent: "space-between", ...miniStat, marginBottom: 4 }}><span>{m.label}</span><span>Sales {inr(m.sales)} · Purchases {inr(m.purchases)}</span></div>
              <div style={{ display: "grid", gap: 3 }}>
                <div style={{ height: 7, background: C.paperDark, borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${m.sales / maxMonthly * 100}%`, height: "100%", background: "#3F7FE8", borderRadius: 6 }} /></div>
                <div style={{ height: 7, background: C.paperDark, borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${m.purchases / maxMonthly * 100}%`, height: "100%", background: "#F0A44B", borderRadius: 6 }} /></div>
              </div>
            </div>)}
          </div>
          <div style={{ display: "flex", gap: 14, ...miniStat, marginTop: 12 }}><span><b style={{ color: "#3F7FE8" }}>●</b> Sales</span><span><b style={{ color: "#F0A44B" }}>●</b> Purchases</span></div>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 12 }}>
        <section style={panel}>
          <div style={sectionLabel}>Cash flow · last 7 days</div>
          <div style={{ paddingTop: 8 }}>
            <CashFlowSVG data={cashFlow7d} height={135} />
          </div>
          <div style={{ display: "flex", gap: 14, ...miniStat, marginTop: 8 }}><span><b style={{ color: "#159A83" }}>●</b> Cash in</span><span><b style={{ color: "#E58B45" }}>●</b> Cash out</span></div>
        </section>

        <section style={panel}>
          <div style={sectionLabel}>Payment mode mix · all sales</div>
          {paymentTotals.length === 0 ? <EmptyNote text="No sales recorded yet." /> : <>
            <div style={{ display: "flex", height: 14, borderRadius: 10, overflow: "hidden", background: C.paperDark, margin: "14px 0" }}>
              {paymentTotals.map((p, i) => <div key={p.mode} title={`${p.mode}: ${inr(p.amount)}`} style={{ width: `${p.amount / paymentTotal * 100}%`, background: ["#3F7FE8", "#159A83", "#8B6BD6", "#E58B45"][i % 4] }} />)}
            </div>
            {paymentTotals.map((p, i) => <div key={p.mode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.paperDark}`, fontSize: 12 }}>
              <span><b style={{ color: ["#3F7FE8", "#159A83", "#8B6BD6", "#E58B45"][i % 4] }}>●</b> {p.mode}</span><span style={{ fontFamily: font.mono, color: C.inkSoft }}>{inr(p.amount)} · {Math.round(p.amount / paymentTotal * 100)}%</span>
            </div>)}
          </>}
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 12 }}>
        <section style={panel}>
          <div style={sectionLabel}>Top selling rubbers</div>
          {topRubbers.length === 0 && <EmptyNote text="No sales yet." />}
          {topRubbers.map(({ rubber, count }) => <div key={rubber.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, marginBottom: 5 }}><span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rubber.name}</span><span style={miniStat}>{count} sold</span></div>
            <div style={{ height: 8, background: C.paperDark, borderRadius: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${count / maxTopCount * 100}%`, background: "#3F7FE8", borderRadius: 8 }} /></div>
          </div>)}
        </section>
        <section style={panel}>
          <div style={sectionLabel}>Low stock alerts</div>
          {lowStock.length === 0 && <EmptyNote text="All items are well stocked." />}
          {lowStock.slice(0, 6).map((r) => <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: `1px solid ${C.paperDark}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span><Tag tone="out">{stockByRubber[r.id]?.balance ?? 0} left</Tag>
          </div>)}
        </section>
      </div>

      <section style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}><div style={sectionLabel}>Recent sales</div><span style={miniStat}>LATEST 5</span></div>
        {recentSales.length === 0 && <EmptyNote text="No stamp entries yet." />}
        {recentSales.map((e) => {
          const rubber = rubbers.find((r) => r.id === e.rubber_id);
          return <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.paperDark}` }}>
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rubber?.name || "Unknown"}</div><div style={{ ...miniStat, marginTop: 3 }}>{fmtDate(e.date)} · {e.payment_mode || "Cash"}</div></div>
            <div style={{ fontFamily: font.mono, fontWeight: 700, color: "#159A83", flexShrink: 0 }}>+{inr(e.amount)}</div>
          </div>;
        })}
      </section>
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
  const [errMsg, setErrMsg] = useState("");

  const add = async () => {
    if (!name.trim() || pin.length < 4) return;
    try {
      await dbInsert("users", { id: uid(), name: name.trim(), role, pin });
      setName(""); setPin(""); setErrMsg(""); await refresh();
    } catch (err) { setErrMsg(err.message || "Save failed — check connection."); }
  };
  const remove = async (id) => {
    if (id === currentUser.id) return;
    try { await dbDelete("users", id); await refresh(); }
    catch (err) { setErrMsg(err.message || "Delete failed — check connection."); }
  };
  const applyReset = async (id) => {
    if (newPin.length < 4) return;
    try {
      await dbUpdate("users", id, { pin: newPin });
      setResetId(null); setNewPin(""); await refresh();
    } catch (err) { setErrMsg(err.message || "PIN reset failed — check connection."); }
  };

  return (
    <div>
      <SectionTitle icon={Users} title="User Management" />
      <Card>
        {errMsg && <div style={{ marginBottom: 10, padding: 9, background: "#FBEAE7", border: `1px solid ${C.stamp}`, borderRadius: 8, fontSize: 11.5, color: C.stampDark }}>{errMsg}</div>}
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
