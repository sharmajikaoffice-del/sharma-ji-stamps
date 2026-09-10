import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LogOut, Plus, Search, Trash2, RotateCcw,
  Stamp, Package, Tag as TagIcon, ShoppingCart, PenSquare, Wallet, Users, BookOpen, Download, Maximize2,
  Wand2, ChevronLeft, ChevronRight, Circle, Image as ImageIcon, Type, CircleDot, X,
  Italic as ItalicIcon, MoveVertical, Square, Triangle, Eye, EyeOff, Printer, Inbox, Check, MoreHorizontal
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
  if (!res.ok) throw new Error("Photo upload failed");
  return `${SUPABASE_URL}/storage/v1/object/public/rubber-photos/${path}`;
}

/* ---------- design tokens ---------- */
const C = {
  // Desktop theme tuned to the blue editor shown in the reference UI.
  paper: "#F3F6FA", paperDark: "#E8EDF4", ink: "#263241", inkSoft: "#687587",
  stamp: "#3F7FE8", stampDark: "#245FC4", brass: "#3F7FE8", sage: "#3F7FE8",
  white: "#FFFFFF", line: "#D7DEE8", headerGreen: "#3F7FE8",
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
  const { shape, topText = "", bottomText = "", centerLine1 = "", centerLine2 = "", rectLine1 = "", rectLine2 = "", rectLine3 = "", inkColor = STAMP_INK_BLUE, borderStyle = "double", texture = true, logo = null, radius = 138, strokeWidth = 3, letterSpacing = 2.5, layers = [], width = STAMP_CANVAS_SIZE, height = STAMP_CANVAS_SIZE, pixelRatio = window.devicePixelRatio || 1, monochrome = false } = cfg;
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

    ctx.font = "600 12px Georgia, 'Times New Roman', serif";
    drawArcText(ctx, topText.toUpperCase(), cx, cy, textR, 0, 1, letterSpacing);
    drawArcText(ctx, bottomText.toUpperCase(), cx, cy, textR, 0, -1, letterSpacing);

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
      ctx.save();
      ctx.translate(lx, ly);
      // "Flip text" turns the text upside-down (180°) instead of mirroring each
      // letter — a mirror flip made the text backwards/unreadable.
      ctx.rotate(rot + (layer.flipX ? Math.PI : 0));
      const weight = layer.bold ? 700 : 400;
      const style = layer.fontStyle === "italic" ? "italic " : "";
      const family = layer.fontFamily || "Arial";
      const fsz = layer.fontSize ?? layer.size ?? 16;
      ctx.font = `${style}${weight} ${fsz}px ${family}`;
      const text = layer.text || "";
      if (layer.invert) {
        const m = ctx.measureText(text);
        const tw = m.width;
        const th = fsz * (layer.tall ? 1.55 : 1.15);
        const padX = fsz * 0.32, padY = fsz * 0.16;
        ctx.save();
        ctx.fillStyle = inkColor;
        const rx = -tw / 2 - padX, ry = -th / 2 - padY, rw = tw + padX * 2, rh = th + padY * 2;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, Math.min(4, rh / 2)); ctx.fill(); }
        else { ctx.fillRect(rx, ry, rw, rh); }
        ctx.restore();
        ctx.fillStyle = "#fff";
      }
      if (layer.tall) {
        ctx.save();
        ctx.scale(1, 1.35); // "Height" toggle for straight text
        ctx.fillText(text, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(text, 0, 0);
      }
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
          const h = Math.max(6, ((layer.height ?? 45) / 100) * size - inset * 2);
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

      if (style === "double" || style === "triple") {
        const ringGap = Math.max(6, sw * 2.2);
        const rings = style === "triple" ? 3 : 2;
        for (let i = 0; i < rings; i++) {
          ctx.lineWidth = i === 0 ? sw : sw * 0.6;
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
    } else if (layer.type === "image" && layer.imageObj) {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const isz = ((layer.size ?? 15) / 100) * Math.min(size, canvasHeight);
      ctx.drawImage(layer.imageObj, -isz / 2, -isz / 2, isz, isz);
      ctx.restore();
    }
  });

  // Final export pass: convert every non-transparent pixel to pure black.
  // This also removes colored logos/images and prevents the old blue/speckled PNG issue.
  if (monochrome) {
    ctx.save();
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, canvasHeight);
    ctx.restore();
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, width: 220 }}>
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
  { id: "dashboard", label: "Dashboard", icon: CircleDot },
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
  { id: "dashboard", label: "Dashboard", icon: CircleDot },
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
  const [tab, setTab] = useState("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const editOrder = (order) => { setOrderToEdit(order); setTab("create"); };

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
  const primaryTabs = tabs.filter((t) => !MORE_TAB_IDS.includes(t.id));
  const moreTabs = tabs.filter((t) => MORE_TAB_IDS.includes(t.id));
  const moreActive = moreTabs.some((t) => t.id === tab);

  const tabContent = (
    <>
      {tab === "dashboard" && <DashboardTab entries={entries} purchases={purchases} cashManual={cashManual} rubbers={rubbers} />}
      {tab === "entry" && <StampEntryTab rubbers={rubbers} entries={entries} refresh={refreshAll} user={user} />}
      {tab === "create" && <CreateStampTab rubbers={rubbers} initialOrder={orderToEdit} onOrderConsumed={() => setOrderToEdit(null)} />}
      {tab === "orders" && <OrdersTab onEditOrder={editOrder} />}
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
          <button onClick={logout} style={{ margin: 14, background: "none", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 8, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: font.body, fontSize: 12.5, padding: "9px 0" }}><LogOut size={15} /> Logout</button>
        </div>

        {/* ---- desktop content ---- */}
        <div style={{ marginLeft: SIDEBAR_W, minHeight: "100vh" }}>
          <div style={{ padding: "18px 18px 34px", width: "100%", maxWidth: 1320, margin: "0 auto" }}>
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
            <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1, color: "#DCE9FF", marginTop: 2 }}>{user.name.toUpperCase()} · {user.role.toUpperCase()}</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: font.body, fontSize: 12 }}><LogOut size={16} /> Logout</button>
      </div>

      <div style={{ flex: 1, padding: "16px 16px 90px", maxWidth: 760, width: "100%", margin: "0 auto" }}>
        {tabContent}
      </div>

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
        const rows = await dbGet("customer_rubbers");
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

function SharmaJiStamps() {
  const isCustomerRoute = typeof window !== "undefined" &&
    window.location.pathname.replace(/\/$/, "") === "/customer";
  return isCustomerRoute ? <CustomerDesigner /> : <SharmaJiStampsAdmin />;
}

export default SharmaJiStamps;

/* ================= ORDERS (customer submissions) ================= */
// Customer designs come in via the public /customer designer and land in the
// "customer_designs" Supabase table (status: new -> accepted -> printed).
// This tab is how staff accept them, open the design in the normal editor to
// tweak it, and print it — same editor, just pre-loaded with the customer's config.
function OrdersTab({ onEditOrder }) {
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
    await dbUpdate("customer_designs", order.id, { status });
    await load();
  };
  const remove = async (order) => {
    await dbDelete("customer_designs", order.id);
    await load();
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
            </div>
          </Card>
        ))}
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
  const [paymentMode, setPaymentMode] = useState("Cash");
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

function CreateStampTab({ rubbers = [], customerMode = false, initialOrder = null, onOrderConsumed }) {
  const isDesktop = useIsDesktop();
  const canvasRef = useRef(null);
  const logoInputRef = useRef(null);
  const [view, setView] = useState("templates"); // "templates" | "editor"
  const [pickShape, setPickShape] = useState("circle");
  const [mobileEditorPanel, setMobileEditorPanel] = useState("edit");

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

  // Extra layers added from the toolbar (Text around the circle / Text in the
  // centre / Circle / Images) — each becomes its own tab, like the reference editor.
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [layerCounter, setLayerCounter] = useState(0);
  const [layerFilter, setLayerFilter] = useState("All");
  const layerImageInputRef = useRef(null);

  const LAYER_TYPE_NAMES = { circleText: "Text around the circle", centerText: "Text in the centre", frame: "Frame", image: "Image" };
  const FRAME_SHAPE_NAMES = { circle: "Circle", square: "Square", triangle: "Triangle" };
  // Text layers show their own typed content as the name (renaming the text
  // field renames the layer everywhere it's listed); other layer types keep
  // the generic "<type> #n" label since they have no text to show.
  const layerLabel = (l) => {
    if (l.type === "circleText" || l.type === "centerText") {
      const t = (l.text || "").trim();
      return t || LAYER_TYPE_NAMES[l.type];
    }
    const base = l.type === "frame" ? FRAME_SHAPE_NAMES[l.shape || "circle"] : LAYER_TYPE_NAMES[l.type];
    return `${base} #${l.num}`;
  };
  const layerTypeMatchesFilter = (layer, filter) => {
    if (filter === "All") return true;
    if (filter === "Text") return layer.type === "circleText" || layer.type === "centerText";
    return layer.type === "frame" || layer.type === "image";
  };
  const rubberSizes = useMemo(() => {
    const seen = new Set();
    return rubbers
      .filter((r) => String(r.category || "rubber").toLowerCase() === "rubber" && r.size)
      .map((r) => {
        const parsed = parseRubberSize(r.size);
        return { ...r, parsed };
      })
      .filter((r) => r.parsed && (() => {
        const key = rubberSizeKey(r.size);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })());
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
  const selectedStampPreviewWidth = Math.max(80, Math.min(320, Math.round(
    320 * ((Number(selectedDimensions.widthMm) || 1) / maxConfiguredStampWidthMm)
  )));
  const selectedStampPreviewHeight = Math.max(80, Math.round(
    selectedStampPreviewWidth * editorAspect
  ));

  const addLayer = (type, opts = {}) => {
    const num = layerCounter + 1;
    setLayerCounter(num);
    const id = uid();
    let layer = { id, type, num };
    if (type === "circleText") {
      layer = { ...layer, text: "NEW TEXT", radius: 130, spacing: 4, start: 90, fontFamily: "Arial", fontSize: 13, bold: false, flipX: false, fontStyle: "normal", tall: false, invert: false, layout: "topArc" };
    } else if (type === "centerText") {
      layer = { ...layer, text: "New text", size: 16, fontFamily: "Arial", fontSize: 16, bold: false, flipX: false, x: 50, y: 50, rotation: 0, fontStyle: "normal", tall: false, invert: false, layout: "center" };
    } else if (type === "frame") {
      // Each newly added shape sits slightly inside the previous one of the same kind.
      const shape = opts.shape || "circle";
      const existingCount = layers.filter((l) => l.type === "frame" && (l.shape || "circle") === shape).length;
      const radius = Math.max(30, 100 - existingCount * 16);
      const dim = Math.max(10, 45 - existingCount * 7);
      layer = { ...layer, radius, width: dim, height: dim, strokeWidth: 4, lineBreak: 0, borderStyle: "single", shape };
    } else if (type === "image") {
      layer = { ...layer, size: 15, x: 50, y: 68, rotation: 0, imageDataUrl: null, imageObj: null };
    }
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
    rectLine1, rectLine2, rectLine3, inkColor: STAMP_INK_BLUE, borderStyle, texture, logoDataUrl,
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
    // New Stamp must always start completely blank: no frames, no stars,
    // no hidden/default drawing and no preselected layer.
    resetDesign(pickShape);
    setLayers([]);
    setActiveLayerId(null);
    setLayerCounter(0);
    setMobileEditorPanel("edit");
    setView("editor");
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
        img.onload = () => updateLayer(l.id, { imageObj: img });
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
      width: editorWidth, height: editorHeight, pixelRatio: window.devicePixelRatio || 1,
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
      // texture:false keeps the worn-ink speckle effect (used only in the on-screen
      // preview) out of the download — that speckle is a separate thing from the
      // stray-pixel "spots" bug and must never appear in the exported PNG.
      inkColor: "#000000", borderStyle, texture: false, logo, radius, strokeWidth, letterSpacing, layers,
      width: exportWidth, height: exportHeight, pixelRatio: 1, monochrome: true,
    });
    // Selected rubber size is maintained 1:1 here — exportWidth/exportHeight are the
    // print-accurate pixel dimensions for the chosen mm size at the given dpi.
    // Keep anti-aliased edges for a smoother, sharper print/export. The previous
    // binarization step could make small text and curved edges look jagged.
    const exportCtx = exportCanvas.getContext("2d");
    if (exportCtx) exportCtx.imageSmoothingQuality = "high";
    return { dataUrl: exportCanvas.toDataURL("image/png"), widthMm, heightMm };
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
      : generateStampDataUrl(600);
    const link = document.createElement("a");
    link.download = `stamp-${result.widthMm}x${result.heightMm}mm${customerMode ? "-preview" : ""}.png`;
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

  // Prints the stamp directly (no PNG download, no Word import, no size headaches).
  // Print uses one A4/3 feeder piece at a time; no 3-up copies are generated.
  // scissors mark between each, so one sheet of butter paper yields 3 stamp
  // impressions instead of wasting a whole sheet on a single print.
  const handlePrint = () => {
    const { dataUrl, widthMm, heightMm } = generateStampDataUrl(300);

    // The user cuts one A4 sheet into 3 equal pieces and feeds one piece at a
    // time. Each piece is 99mm x 210mm (A4/3). Choose orientation from the
    // stamp's aspect ratio so the print is not rotated unexpectedly.
    const feederWidthMm = 99;
    const feederHeightMm = 210;
    const orientation = widthMm > heightMm ? "landscape" : "portrait";

    const printWindow = window.open("", "_blank", "width=800,height=1000");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Stamp - A4/3 - ${widthMm}x${heightMm}mm</title>
          <style>
            @page {
              size: ${feederWidthMm}mm ${feederHeightMm}mm ${orientation};
              margin: 0;
            }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              width: ${orientation === "landscape" ? feederHeightMm : feederWidthMm}mm;
              height: ${orientation === "landscape" ? feederWidthMm : feederHeightMm}mm;
              overflow: hidden;
            }
            .sheet {
              width: ${orientation === "landscape" ? feederHeightMm : feederWidthMm}mm;
              height: ${orientation === "landscape" ? feederWidthMm : feederHeightMm}mm;
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

        <Label>{customerMode ? "Choose a Template" : "My Templates"}</Label>
        {templatesLoading && <EmptyNote text="Loading…" />}
        {templatesError && <EmptyNote text={templatesError} />}
        {!templatesLoading && !templatesError && templates.length === 0 && (
          <EmptyNote text="No templates available yet." />
        )}
        {templates.length > 0 && (
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

        {!customerMode && (
          <>
            <Label style={{ marginTop: 18 }}>Download History</Label>
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

  const sizeControls = (
    <div>
      <Label>Choose stamp size</Label>
      {rubberSizes.length === 0 ? (
        <div style={{ color: C.inkSoft, fontFamily: font.mono, fontSize: 11.5, padding: "8px 0" }}>
          No rubber sizes configured.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
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
                  border: `1px solid ${active ? STAMP_INK_BLUE : C.line}`,
                  background: active ? "#EAF2FF" : C.white,
                  color: active ? STAMP_INK_BLUE : C.ink,
                  borderRadius: 8,
                  padding: "9px 7px",
                  cursor: "pointer",
                  textAlign: "center",
                  fontFamily: font.body,
                }}
              >
                <div style={{ fontWeight: active ? 750 : 600, fontSize: 12 }}>{r.name}</div>
                <div style={{ marginTop: 3, fontFamily: font.mono, fontSize: 10.5 }}>
                  {r.parsed.widthMm} × {r.parsed.heightMm} mm
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const fontOptions = ["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New", "Trebuchet MS"];

  // Six text-layout presets, matching the reference editor: Center / Top Arc / Bottom Arc /
  // Top Left / Top Right / Bottom. Each preset just picks the layer type + arc angle/direction
  // (or straight position) — all reuse the existing circleText / centerText rendering.
  const TEXT_LAYOUTS = [
    { id: "center", label: "Center" },
    { id: "topArc", label: "Top Arc" },
    { id: "bottomArc", label: "Bottom Arc" },
    { id: "topLeft", label: "Top Left" },
    { id: "topRight", label: "Top Right" },
    { id: "bottom", label: "Bottom" },
  ];
  const layoutPatch = (layoutId) => {
    switch (layoutId) {
      case "center": return { layout: "center", type: "centerText", x: 50, y: 50, rotation: 0 };
      case "topArc": return { layout: "topArc", type: "circleText", start: 90, flipX: false };
      case "bottomArc": return { layout: "bottomArc", type: "circleText", start: 90, flipX: true };
      case "topLeft": return { layout: "topLeft", type: "centerText", x: 25, y: 25, rotation: 0 };
      case "topRight": return { layout: "topRight", type: "centerText", x: 75, y: 25, rotation: 0 };
      case "bottom": return { layout: "bottom", type: "centerText", x: 50, y: 82, rotation: 0 };
      default: return { layout: layoutId };
    }
  };
  const LayoutIcon = ({ id, active }) => {
    const stroke = active ? STAMP_INK_BLUE : C.inkSoft;
    const common = { width: 26, height: 16, viewBox: "0 0 26 16", fill: "none", stroke, strokeWidth: 1.6, strokeLinecap: "round" };
    if (id === "center") return <svg {...common}><rect x="9" y="5" width="8" height="6" rx="1" /></svg>;
    if (id === "topArc") return <svg {...common}><path d="M3 12 A 10 10 0 0 1 23 12" /></svg>;
    if (id === "bottomArc") return <svg {...common}><path d="M3 4 A 10 10 0 0 0 23 4" /></svg>;
    if (id === "topLeft") return <svg {...common}><path d="M6 13 L6 3 L16 3" /></svg>;
    if (id === "topRight") return <svg {...common}><path d="M20 13 L20 3 L10 3" /></svg>;
    if (id === "bottom") return <svg {...common}><line x1="4" y1="10" x2="22" y2="10" /></svg>;
    return null;
  };

  // Icons for the per-frame Border Style picker (Single / Double / Triple / Dashed),
  // matching the reference editor's ring-style thumbnails.
  const FRAME_BORDER_STYLES = [
    { id: "single", label: "Single" },
    { id: "double", label: "Double" },
    { id: "triple", label: "Triple" },
    { id: "dashed", label: "Dashed" },
  ];
  const BorderStyleIcon = ({ id, active }) => {
    const stroke = active ? STAMP_INK_BLUE : C.inkSoft;
    const common = { width: 22, height: 22, viewBox: "0 0 22 22", fill: "none", stroke, strokeWidth: 1.4 };
    if (id === "single") return <svg {...common}><circle cx="11" cy="11" r="8" /></svg>;
    if (id === "double") return <svg {...common}><circle cx="11" cy="11" r="9" /><circle cx="11" cy="11" r="5.5" /></svg>;
    if (id === "triple") return <svg {...common}><circle cx="11" cy="11" r="9.5" /><circle cx="11" cy="11" r="6.5" /><circle cx="11" cy="11" r="3.5" /></svg>;
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

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: C.ink, cursor: "pointer", marginBottom: 16 }}>
          <input type="checkbox" checked={!!layer.invert} onChange={(e) => updateLayer(layer.id, { invert: e.target.checked })} />
          Invert
        </label>

        <Label>Text layout</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          {TEXT_LAYOUTS.map((opt) => {
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
          <SliderControl label="Rotation" value={activeLayer.rotation ?? 0} min={0} max={360} step={0.5} onChange={(v) => updateLayer(activeLayer.id, { rotation: v })} />
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
          <SliderControl label="Stroke" value={activeLayer.strokeWidth ?? 4} min={1} max={25} step={0.1} onChange={(v) => updateLayer(activeLayer.id, { strokeWidth: v })} />
          <SliderControl label="Break" value={activeLayer.lineBreak ?? 0} min={0} max={200} step={0.1} onChange={(v) => updateLayer(activeLayer.id, { lineBreak: v })} />
          <Label>Border Style</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 4 }}>
            {FRAME_BORDER_STYLES.map((opt) => {
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
                  <BorderStyleIcon id={opt.id} active={active} />
                  <span style={{ fontSize: 10.5, color: active ? STAMP_INK_BLUE : C.inkSoft, fontWeight: active ? 700 : 500 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
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
              height: "42vh",
              minHeight: 210,
              maxHeight: 330,
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
        <div
          style={{
            position: "relative",
            width: `${selectedStampPreviewWidth}px`,
            height: `${selectedStampPreviewHeight}px`,
            maxWidth: "88%",
            maxHeight: "88%",
            border: `2px dashed ${STAMP_INK_BLUE}`,
            borderRadius: 3,
            boxShadow: "0 0 0 4px rgba(63,127,232,.10)",
            background: "rgba(63,127,232,.035)",
            flexShrink: 0,
            transition: "width .18s ease, height .18s ease",
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            title={layers.length ? "Click an item on the stamp to edit it" : "Add an item from the toolbar to edit it"}
            style={{ width: "100%", height: "100%", display: "block", cursor: layers.length ? "pointer" : "default" }}
          />
          <div
            style={{
              position: "absolute",
              top: -10,
              left: 10,
              padding: "2px 7px",
              borderRadius: 10,
              background: STAMP_INK_BLUE,
              color: C.white,
              fontFamily: font.mono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: .2,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {selectedDimensions.widthMm} × {selectedDimensions.heightMm} mm
          </div>
        </div>
        {layers.length > 0 && (
          <div style={{ marginTop: 5, fontFamily: font.mono, fontSize: 9.5, color: C.inkSoft, textAlign: "center", background: "rgba(255,255,255,.8)", padding: "2px 7px", borderRadius: 10 }}>Click any item on the stamp to edit</div>
        )}
      </div>
    </Card>
  );

  const mobileCanvasSpacer = !isDesktop
    ? <div aria-hidden="true" style={{ height: "42vh", minHeight: 210, maxHeight: 330, marginBottom: 10 }} />
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
      ctx.fillText("PREVIEW • GRD MOTORS", 0, 0);
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
    <div style={{ paddingBottom: !isDesktop && view === "editor" ? 76 : 0 }}>
      <div
        style={{
          background: STAMP_INK_BLUE,
          borderRadius: 4,
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
            top: 74,
            right: 8,
            width: 66,
            minHeight: "auto",
            zIndex: 90,
            padding: "7px 5px",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "flex-start",
            gap: 5,
            borderRadius: 10,
            transform: mobileHeaderVisible ? "translateX(0)" : "translateX(calc(100% + 16px))",
            transition: "transform .18s ease",
          }),
        }}
      >
        <button type="button" onClick={() => setView("templates")} style={{ ...toolbarPill, background: C.sage, color: C.white, ...(isDesktop ? {} : { width: "100%", padding: "6px 2px", justifyContent: "center", fontSize: 9.5, gap: 2 }) }}>
          <ChevronLeft size={15} /> Back
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: isDesktop ? 22 : 4,
          flexDirection: isDesktop ? "row" : "column",
          flexWrap: "nowrap", justifyContent: isDesktop ? "center" : "flex-start",
          overflowX: isDesktop ? "visible" : "hidden", minWidth: 0,
          flex: isDesktop ? 1 : "0 0 auto", WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", padding: isDesktop ? 0 : 0
        }}>
          <button type="button" onClick={() => addLayer("centerText")} style={toolbarIconBtn}>
            <span style={toolbarIconBox}><Type size={18} /></span>
            Add Text
          </button>
          <button type="button" onClick={() => addLayer("frame", { shape: "circle" })} style={toolbarIconBtn}>
            <span style={toolbarIconBox}><Circle size={18} /></span>
            Circle
          </button>
          <button type="button" onClick={() => addLayer("frame", { shape: "square" })} style={toolbarIconBtn}>
            <span style={toolbarIconBox}><Square size={18} /></span>
            Square box
          </button>
          <button type="button" onClick={() => addLayer("frame", { shape: "triangle" })} style={toolbarIconBtn}>
            <span style={toolbarIconBox}><Triangle size={18} /></span>
            Triangle
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

        <button type="button" onClick={startNew} style={{ ...toolbarPill, background: C.sage, color: C.white, ...(isDesktop ? {} : { width: "100%", padding: "6px 2px", justifyContent: "center", fontSize: 9.5, gap: 2 }) }}>
          <Plus size={15} /> New
        </button>
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
        <div style={{ display: "grid", gridTemplateColumns: "minmax(205px, .9fr) minmax(260px, 1.05fr) minmax(205px, .9fr)", gap: 10, alignItems: "stretch", width: "100%", background: "#EEF1F5", padding: 8, border: `1px solid ${C.line}`, borderTop: "none" }}>
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
          {canvasBlock}
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
              <div id="mobile-stamp-layers">
                <Label>Layers</Label>
                {layers.length === 0 ? (
                  <div style={{ padding: "12px 0", color: C.inkSoft, fontFamily: font.mono, fontSize: 11 }}>
                    No layers yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[...layers].reverse().map((layer) => {
                      const selected = activeLayer?.id === layer.id;
                      const layerName =
                        layer.type === "text" ? (layer.text || "Text") :
                        layer.type === "image" ? "Image" :
                        layer.type === "circle" ? "Circle" :
                        layer.type === "rectangle" ? "Rectangle" :
                        layer.type === "line" ? "Line" :
                        layer.type || "Layer";
                      return (
                        <div
                          key={layer.id}
                          style={{
                            width: "100%",
                            border: `1px solid ${selected ? STAMP_INK_BLUE : C.line}`,
                            background: selected ? "#EAF2FF" : C.white,
                            borderRadius: 8,
                            padding: "8px 9px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveLayerId(layer.id)}
                            style={{
                              flex: 1, minWidth: 0, border: "none", background: "transparent",
                              color: C.ink, cursor: "pointer", textAlign: "left",
                              fontFamily: font.body, fontWeight: selected ? 750 : 600, fontSize: 12,
                            }}
                          >
                            {layerName}
                          </button>
                          <button
                            type="button"
                            title={layer.visible === false ? "Show layer" : "Hide layer"}
                            onClick={() => {
                              setLayers(prev => prev.map(l =>
                                l.id === layer.id ? { ...l, visible: l.visible === false } : l
                              ));
                            }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, color: C.inkSoft }}
                          >
                            {layer.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            type="button"
                            title="Delete layer"
                            onClick={() => {
                              setLayers(prev => prev.filter(l => l.id !== layer.id));
                              if (activeLayer?.id === layer.id) setActiveLayerId(null);
                            }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 5, color: "#B42318" }}
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

      {(
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
                <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", zIndex: 50, background: C.white, border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: "0 10px 30px rgba(38,50,65,.14)", maxHeight: 280, overflowY: "auto" }}>
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
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: active ? "8px 10px 8px 8px" : "8px 10px",
                          border: "none",
                          borderBottom: `1px solid ${C.paperDark}`,
                          borderLeft: active ? `3px solid ${STAMP_INK_BLUE}` : "3px solid transparent",
                          background: active ? "#EAF2FF" : C.white,
                          color: active ? STAMP_INK_BLUE : C.ink,
                          cursor: "pointer",
                          textAlign: "left",
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        {r.photo_url ? <img src={r.photo_url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.line}`, flexShrink: 0 }} /> : <span style={{ width: 44, height: 44, borderRadius: 6, background: C.paperDark, display: "grid", placeItems: "center", flexShrink: 0 }}><Stamp size={18} color={C.inkSoft} /></span>}
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ display: "block", fontWeight: active ? 750 : 650, fontSize: 12.5 }}>{r.name}</span>
                          <span style={{ display: "block", marginTop: 2, color: active ? STAMP_INK_BLUE : C.inkSoft, fontFamily: font.mono, fontSize: 10.5 }}>{r.size} · {r.parsed.widthMm} × {r.parsed.heightMm} mm</span>
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
          </div>
          <div style={{ display: "flex", gap: 8, width: isDesktop ? "auto" : "100%" }}>
            <Btn onClick={handleDownload} style={{ background: STAMP_INK_BLUE, minWidth: isDesktop ? 184 : "auto", flex: isDesktop ? "none" : 1, justifyContent: "center", borderRadius: 8 }}>
              <Download size={16} /> {customerMode ? "Download preview" : "Download stamp"}
            </Btn>
            {!customerMode && (
              <Btn onClick={handlePrint} style={{ background: C.white, color: STAMP_INK_BLUE, border: `1.5px solid ${STAMP_INK_BLUE}`, minWidth: isDesktop ? 130 : "auto", flex: isDesktop ? "none" : 1, justifyContent: "center", borderRadius: 8 }}>
                <Printer size={16} /> Print
              </Btn>
            )}
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

      {!isDesktop && view === "editor" && mobileEditorPanel !== "submit" ? null : !customerMode && <Card id="mobile-stamp-submit">
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
      </Card>}

      {customerMode && (
        (!isDesktop && view === "editor" && mobileEditorPanel !== "submit") ? null : <Card id="mobile-stamp-submit" style={{ marginBottom: 24 }}>
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
    setEditBusy(true);
    try {
      await dbUpdate("stamp_entries", editId, {
        date: editDate, rubber_id: editRubberId, mobile: editMobile,
        rate: editRate, discount: Number(editDiscount || 0), amount: editAmount, payment_mode: editPaymentMode, remarks: editRemarks,
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
            <col style={{ width: "34%" }} /><col style={{ width: "14%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} />
          </colgroup>
          <thead><tr>
            <th style={thStyle}>Rubber / Size</th><th style={{ ...thStyle, textAlign: "right" }}>Rate (₹)</th><th style={{ ...thStyle, textAlign: "right" }}>Open</th><th style={{ ...thStyle, textAlign: "right" }}>In</th><th style={{ ...thStyle, textAlign: "right" }}>Out</th><th style={{ ...thStyle, textAlign: "right" }}>Close</th>
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
                <td style={{ ...tdStyle, textAlign: "right" }}>{s.opening}</td><td style={{ ...tdStyle, textAlign: "right", color: C.sage }}>+{s.purchased}</td><td style={{ ...tdStyle, textAlign: "right", color: C.stamp }}>−{s.used}</td><td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: low ? C.stamp : C.ink }}>{low ? `${s.balance} ⚠` : s.balance}</td>
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

  const startEdit = (r) => {
    setEditId(r.id); setEditName(r.name); setEditCategory(r.category || "rubber");
    setEditSize(r.size || ""); setEditOpening(r.opening_stock || 0); setEditRate(r.rate || 0);
    setEditPhotoPreview(r.photo_url || null); setEditPhotoUrl(r.photo_url || null); setEditPhotoFile(null);
  };
  const handleEditPhotoChange = (e) => { const file=e.target.files[0]; if(!file)return; setEditPhotoFile(file); setEditPhotoPreview(URL.createObjectURL(file)); };
  const saveEdit = async () => {
    if (!editName.trim() || busy) return;
    setBusy(true);
    try {
      let photo_url = editPhotoUrl;
      if (editPhotoFile) photo_url = await uploadPhoto(editPhotoFile, "rubbers");
      await dbUpdate("rubbers", editId, {
        name: editName.trim(), category: editCategory, size: editCategory === "rubber" ? editSize.trim() || null : null,
        opening_stock: Number(editOpening) || 0, rate: Number(editRate) || 0, photo_url
      });
      setEditId(null); await refresh();
    } finally { setBusy(false); }
  };
  const handlePhotoChange = (e) => { const file=e.target.files[0]; if(!file)return; setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); };
  const add = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      let photo_url = null;
      if (photoFile) photo_url = await uploadPhoto(photoFile, "rubbers");
      await dbInsert("rubbers", {
        id: uid(), name: name.trim(), category, size: category === "rubber" ? size.trim() || null : null,
        opening_stock: Number(opening) || 0, rate: Number(rate) || 0, photo_url
      });
      setName(""); setCategory("rubber"); setSize(""); setOpening(0); setRate(0); setPhotoPreview(null); setPhotoFile(null); await refresh();
    } finally { setBusy(false); }
  };
  const remove = async (id) => { await dbDelete("rubbers", id); await refresh(); };
  const filtered = rubbers.filter((r) => `${r.name} ${r.category || "rubber"} ${r.size || ""}`.toLowerCase().includes(q.toLowerCase()));
  const catLabel = (c) => c === "machine" ? "Machine" : c === "raw" ? "Raw" : "Rubber";

  return (
    <div>
      <SectionTitle icon={Package} title="Item Master" />
      <Card>
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
          <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhotoChange}/>
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
          <label style={{display:"block",border:`1px dashed ${C.brass}`,borderRadius:8,padding:16,textAlign:"center",color:C.brass,fontSize:13,marginBottom:12,cursor:"pointer",overflow:"hidden"}}>{editPhotoPreview?<img src={editPhotoPreview} alt="Item" style={{maxWidth:"100%",maxHeight:160,borderRadius:6}}/>:"📷 Tap to capture / upload photo"}<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleEditPhotoChange}/></label>
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
  const [items,setItems]=useState([{rubberId:rubbers[0]?.id||"",qty:"",purchaseRate:""}]); const [busy,setBusy]=useState(false);
  const [editId,setEditId]=useState(null); const [editRubberId,setEditRubberId]=useState(""); const [editQty,setEditQty]=useState(0); const [editRate,setEditRate]=useState(0); const [editDate,setEditDate]=useState(todayISO()); const [editPaymentMode,setEditPaymentMode]=useState("Cash"); const [editBusy,setEditBusy]=useState(false);
  const addRow=()=>setItems([...items,{rubberId:rubbers[0]?.id||"",qty:"",purchaseRate:""}]); const removeRow=(idx)=>setItems(items.filter((_,i)=>i!==idx)); const updateRow=(idx,patch)=>setItems(items.map((it,i)=>i===idx?{...it,...patch}:it));
  const itemsAmount=items.reduce((s,it)=>s+Number(it.qty||0)*Number(it.purchaseRate||0),0);
  const save=async()=>{const validItems=items.filter(it=>it.rubberId&&Number(it.qty)>0);if(!validItems.length||busy)return;setBusy(true);try{for(const it of validItems){const amount=Number(it.qty)*Number(it.purchaseRate||0);await dbInsert("purchases",{id:uid(),date,rubber_id:it.rubberId,qty:Number(it.qty),purchase_rate:Number(it.purchaseRate||0),amount,courier:0,total:amount,payment_mode:paymentMode});}setItems([{rubberId:rubbers[0]?.id||"",qty:"",purchaseRate:""}]);await refresh();}finally{setBusy(false);}};
  const startEdit=(p)=>{setEditId(p.id);setEditRubberId(p.rubber_id);setEditQty(p.qty);setEditRate(p.purchase_rate);setEditPaymentMode(p.payment_mode||"Cash");setEditDate(p.date);};
  const saveEdit=async()=>{if(!editRubberId||!editQty||editBusy)return;setEditBusy(true);try{const amount=Number(editQty)*Number(editRate||0);await dbUpdate("purchases",editId,{date:editDate,rubber_id:editRubberId,qty:Number(editQty),purchase_rate:Number(editRate||0),amount,courier:0,total:amount,payment_mode:editPaymentMode});setEditId(null);await refresh();}finally{setEditBusy(false);}};
  const removePurchase=async(id)=>{await dbDelete("purchases",id);await refresh();};
  const grouped=useMemo(()=>{const map=new Map();purchases.forEach(p=>{const key=p.date;if(!map.has(key))map.set(key,{date:key,items:[],total:0,modes:new Set()});const g=map.get(key);g.items.push(p);g.total+=Number(p.total??p.amount??0);g.modes.add(p.payment_mode||"Cash");});return [...map.values()].sort((a,b)=>new Date(b.date)-new Date(a.date));},[purchases]);
  const exportCSV=()=>{const rows=[...purchases].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p=>{const r=rubbers.find(r=>r.id===p.rubber_id);return{Date:fmtDate(p.date),"Payment Mode":p.payment_mode||"Cash","Category":r?.category||"rubber","Size":r?.category==="rubber"?(r?.size||""):"","Item Name":r?.name||"",Qty:p.qty,Rate:p.purchase_rate,Total:Number(p.total??p.amount??0)};});exportToCSV(`purchases-${todayISO()}.csv`,rows);};
  const catLabel=(c)=>c==="machine"?"Machine":c==="raw"?"Raw":"Rubber";
  const optionLabel=(r)=>`${r.name} · ${catLabel(r.category)}${r.category==="rubber"&&r.size?` · ${r.size}`:""}`;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingBottom:10,borderBottom:`2px solid ${C.headerGreen}`,gap:8}}><SectionTitle icon={ShoppingCart} title="Purchase Entry" bare/><Btn variant="ghost" onClick={exportCSV} style={{padding:"6px 10px",fontSize:11.5,flexShrink:0}}><Download size={13}/> Export</Btn></div>
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

/* ================= CASH LEDGER ================= */
function DashboardTab({ entries, purchases, cashManual, rubbers }) {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(todayISO());

  const inRange = (d) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  const sales = entries.filter(e => inRange(e.date));
  const buys = purchases.filter(p => inRange(p.date));
  const manual = cashManual.filter(c => inRange(c.date));
  const salesTotal = sales.reduce((s,e) => s + Number(e.amount || 0), 0);
  const purchaseTotal = buys.reduce((s,p) => s + Number(p.total ?? p.amount ?? 0), 0);
  const cashSales = sales.filter(e => (e.payment_mode || "Cash") === "Cash").reduce((s,e) => s + Number(e.amount || 0), 0);
  const bankSales = sales.filter(e => (e.payment_mode || "Cash") === "Bank").reduce((s,e) => s + Number(e.amount || 0), 0);
  const cashPurchases = buys.filter(p => (p.payment_mode || "Cash") === "Cash").reduce((s,p) => s + Number(p.total ?? p.amount ?? 0), 0);
  const bankPurchases = buys.filter(p => (p.payment_mode || "Cash") === "Bank").reduce((s,p) => s + Number(p.total ?? p.amount ?? 0), 0);
  const manualIn = manual.filter(c => c.type === "in").reduce((s,c) => s + Number(c.amount || 0), 0);
  const manualOut = manual.filter(c => c.type === "out").reduce((s,c) => s + Number(c.amount || 0), 0);
  const cashIn = cashSales + manualIn;
  const cashOut = cashPurchases + manualOut;
  const netCash = cashIn - cashOut;
  const bankNet = bankSales - bankPurchases;

  const daily = useMemo(() => {
    const map = new Map();
    [...sales.map(e => ({date:e.date, in:Number(e.amount||0), out:0})),
      ...buys.map(p => ({date:p.date, in:0, out:Number(p.total ?? p.amount ?? 0)})),
      ...manual.map(c => ({date:c.date, in:c.type === "in" ? Number(c.amount||0) : 0, out:c.type === "out" ? Number(c.amount||0) : 0}))]
      .forEach(x => { if (!map.has(x.date)) map.set(x.date,{date:x.date,in:0,out:0}); const r=map.get(x.date); r.in+=x.in; r.out+=x.out; });
    return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }, [sales, buys, manual]);

  // Month-wise qty sold & average rate, last 12 months (independent of the from/to filter above,
  // so it always shows a full trend even when a short date range is selected).
  const monthly = useMemo(() => {
    const map = new Map();
    entries.forEach(e => {
      const m = (e.date || "").slice(0, 7); // "YYYY-MM"
      if (!m) return;
      if (!map.has(m)) map.set(m, { month: m, qty: 0, rateSum: 0, count: 0 });
      const r = map.get(m);
      r.qty += Number(e.qty || 1);
      r.rateSum += Number(e.rate || 0);
      r.count += 1;
    });
    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(r => ({ month: r.month, qty: r.qty, rate: r.count ? r.rateSum / r.count : 0 }));
  }, [entries]);

  return <div>
    <SectionTitle icon={CircleDot} title="Dashboard" />
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, alignItems:"end" }}>
        <div><Label>From Date</Label><Field type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{marginBottom:0}} /></div>
        <div><Label>To Date</Label><Field type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{marginBottom:0}} /></div>
        <Btn variant="ghost" onClick={()=>{setFromDate("");setToDate("")}}>All Dates</Btn>
      </div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:12}}>
      {[
        ["STAMP SALES", salesTotal, C.stamp], ["PURCHASE", purchaseTotal, C.ink],
        ["CASH NET", netCash, C.sage], ["BANK NET", bankNet, C.stampDark]
      ].map(([label,value,bg])=><Card key={label} style={{background:bg,color:C.white}}><div style={{fontFamily:font.mono,fontSize:10,letterSpacing:1.2,color:"#DCE9FF"}}>{label}</div><div style={{fontFamily:font.display,fontWeight:800,fontSize:25,marginTop:5}}>{inr(value)}</div></Card>)}
    </div>
    <Card style={{marginBottom:12}}>
      <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>Cash Flow Trend</div>
      <div style={{fontSize:11,color:C.inkSoft,marginBottom:10}}>Daily money in vs money out for the selected period.</div>
      <LineChart data={daily} />
    </Card>
    <Card style={{marginBottom:12}}>
      <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>Monthly Sales Trend</div>
      <div style={{fontSize:11,color:C.inkSoft,marginBottom:10}}>Qty sold aur average rate, month-wise (last 12 months).</div>
      <MonthlyQtyRateChart data={monthly} />
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:12}}>
      <Card>
        <div style={{fontWeight:800,fontSize:15}}>Payment Mix</div>
        <div style={{fontSize:11,color:C.inkSoft,marginBottom:8}}>Stamp sales received through Cash and Bank.</div>
        <DonutChart cash={cashSales} bank={bankSales} />
      </Card>
      <Card>
        <div style={{fontWeight:800,fontSize:15,marginBottom:8}}>Period Summary</div>
        <div style={{display:"grid",gap:9,fontFamily:font.mono,fontSize:11.5}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Cash In</span><b>{inr(cashIn)}</b></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Cash Out</span><b>{inr(cashOut)}</b></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Bank In</span><b>{inr(bankSales)}</b></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Bank Out</span><b>{inr(bankPurchases)}</b></div>
          <div style={{borderTop:`1px solid ${C.line}`,paddingTop:9,display:"flex",justifyContent:"space-between",fontWeight:800}}><span>Net Movement</span><span>{inr(cashIn + bankSales - cashOut - bankPurchases)}</span></div>
        </div>
      </Card>
    </div>
  </div>;
}

function LineChart({ data }) {
  if (!data.length) return <EmptyNote text="No data for the selected dates." />;
  const W=900,H=280,P=38; const max=Math.max(1,...data.map(d=>Math.max(d.in,d.out))); const step=data.length===1 ? 0 : (W-P*2)/(data.length-1);
  const points=(key)=>data.map((d,i)=>`${P+i*step},${H-P-(d[key]/max)*(H-P*2)}`).join(" ");
  return <div style={{overflowX:"auto"}}><svg viewBox={`0 0 ${W} ${H}`} width="100%" height="280" role="img" aria-label="Cash flow line chart">
    {[0,.25,.5,.75,1].map(v=><line key={v} x1={P} x2={W-P} y1={H-P-v*(H-P*2)} y2={H-P-v*(H-P*2)} stroke="#D7DEE8" strokeWidth="1" />)}
    <polyline fill="none" stroke="#3F7FE8" strokeWidth="3" points={points("in")} />
    <polyline fill="none" stroke="#263241" strokeWidth="3" points={points("out")} />
    {data.map((d,i)=><g key={d.date}><circle cx={P+i*step} cy={H-P-(d.in/max)*(H-P*2)} r="3.5" fill="#3F7FE8"/><circle cx={P+i*step} cy={H-P-(d.out/max)*(H-P*2)} r="3.5" fill="#263241"/><text x={P+i*step} y={H-12} textAnchor="middle" fontSize="9" fill="#687587">{new Date(d.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</text></g>)}
    <text x={P} y={18} fontSize="10" fill="#3F7FE8">IN</text><text x={P+25} y={18} fontSize="10" fill="#263241">OUT</text>
  </svg></div>;
}

function MonthlyQtyRateChart({ data }) {
  if (!data.length) return <EmptyNote text="No sales data yet." />;
  const W = 900, H = 280, P = 42;
  const maxQty = Math.max(1, ...data.map(d => d.qty));
  const maxRate = Math.max(1, ...data.map(d => d.rate));
  const step = data.length === 1 ? 0 : (W - P * 2) / (data.length - 1);
  const yQty = (v) => H - P - (v / maxQty) * (H - P * 2);
  const yRate = (v) => H - P - (v / maxRate) * (H - P * 2);
  const qtyPoints = data.map((d, i) => `${P + i * step},${yQty(d.qty)}`).join(" ");
  const ratePoints = data.map((d, i) => `${P + i * step},${yRate(d.rate)}`).join(" ");
  const monthLabel = (m) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  };
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="280" role="img" aria-label="Monthly qty and rate line chart">
        {[0, .25, .5, .75, 1].map(v => (
          <line key={v} x1={P} x2={W - P} y1={H - P - v * (H - P * 2)} y2={H - P - v * (H - P * 2)} stroke="#D7DEE8" strokeWidth="1" />
        ))}
        <polyline fill="none" stroke={C.stamp} strokeWidth="3" points={qtyPoints} />
        <polyline fill="none" stroke={C.ink} strokeWidth="3" strokeDasharray="5 4" points={ratePoints} />
        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={P + i * step} cy={yQty(d.qty)} r="3.5" fill={C.stamp} />
            <circle cx={P + i * step} cy={yRate(d.rate)} r="3.5" fill={C.ink} />
            <text x={P + i * step} y={H - 20} textAnchor="middle" fontSize="9" fill="#687587">{monthLabel(d.month)}</text>
            <text x={P + i * step} y={H - 8} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={C.stamp}>{d.qty}</text>
          </g>
        ))}
        <text x={P} y={18} fontSize="10" fill={C.stamp}>QTY</text>
        <text x={P + 32} y={18} fontSize="10" fill={C.ink}>RATE (avg ₹)</text>
      </svg>
    </div>
  );
}

function DonutChart({ cash, bank }) {
  const total=cash+bank; if(!total) return <EmptyNote text="No sales for the selected dates." />;
  const r=62,circ=2*Math.PI*r, cashLen=(cash/total)*circ;
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:28,minHeight:190}}>
    <div style={{position:"relative",width:150,height:150}}><svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r={r} fill="none" stroke="#E8EDF4" strokeWidth="22"/><circle cx="75" cy="75" r={r} fill="none" stroke="#3F7FE8" strokeWidth="22" strokeDasharray={`${cashLen} ${circ-cashLen}`} transform="rotate(-90 75 75)" strokeLinecap="butt"/><circle cx="75" cy="75" r="38" fill={C.white}/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><b style={{fontFamily:font.display,fontSize:18}}>{inr(total)}</b><span style={{fontSize:9,color:C.inkSoft}}>SALES</span></div></div>
    <div style={{fontFamily:font.mono,fontSize:11,display:"grid",gap:10}}><div><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:C.stamp,marginRight:7}}/>Cash <b>{inr(cash)}</b></div><div><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:C.paperDark,border:`1px solid ${C.line}`,marginRight:7}}/>Bank <b>{inr(bank)}</b></div></div>
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

  const cashSales = entries.filter(e => (e.payment_mode || "Cash") === "Cash");
  const cashPurchases = purchases.filter(p => (p.payment_mode || "Cash") === "Cash");
  const inRange = (d) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  const allTxns = [
    ...cashSales.map(e => { const r=rubbers.find(r=>r.id===e.rubber_id); return {id:`sale-${e.id}`,date:e.date,label:`${r?.name||"Unknown Item"} - Sale`,type:"in",amount:Number(e.amount||0),payment_mode:"Cash"}; }),
    ...cashPurchases.map(p => { const r=rubbers.find(r=>r.id===p.rubber_id); return {id:`purchase-${p.id}`,date:p.date,label:`${r?.name||"Unknown Item"} - Purchase`,type:"out",amount:Number(p.total ?? p.amount ?? 0),payment_mode:"Cash"}; }),
    ...cashManual.map(c => ({id:`manual-${c.id}`,date:c.date,label:c.category,type:c.type,amount:Number(c.amount||0),payment_mode:"Cash"}))
  ].sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));

  let running=0;
  const txnsWithBalance=allTxns.map(t=>{running += t.type === "in" ? t.amount : -t.amount; return {...t,balanceAfter:running};});
  const shown=txnsWithBalance.filter(t=>inRange(t.date)).reverse();
  const currentBalance=running;
  const filteredIn=shown.reduce((s,t)=>s+(t.type==="in"?t.amount:0),0);
  const filteredOut=shown.reduce((s,t)=>s+(t.type==="out"?t.amount:0),0);

  const addManual = async () => { if(!amount) return; await dbInsert("cash_manual",{id:uid(),date:todayISO(),type,category,amount:Number(amount),note}); setAmount(0);setNote("");await refresh(); };
  const exportCSV=()=>exportToCSV(`cash-register-${todayISO()}.csv`,shown.map(t=>({Date:fmtDate(t.date),Description:t.label,Type:t.type==="in"?"Cash In":"Cash Out",Amount:t.amount,Balance:t.balanceAfter})));

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingBottom:10,borderBottom:`2px solid ${C.headerGreen}`,gap:8}}><SectionTitle icon={Wallet} title="Cash Register" bare/><Btn variant="ghost" onClick={exportCSV} style={{padding:"6px 10px",fontSize:11.5}}><Download size={13}/> Export</Btn></div>
    <Card style={{marginBottom:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"end"}}><div><Label>From Date</Label><Field type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{marginBottom:0}}/></div><div><Label>To Date</Label><Field type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{marginBottom:0}}/></div><Btn variant="ghost" onClick={()=>{setFromDate("");setToDate(todayISO())}}>Reset</Btn></div></Card>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:12}}>
      <Card style={{background:C.ink,color:C.white}}><div style={{fontFamily:font.mono,fontSize:10,letterSpacing:1.5,color:"#DCE9FF"}}>CURRENT CASH BALANCE</div><div style={{fontFamily:font.display,fontWeight:700,fontSize:28,marginTop:4}}>{inr(currentBalance)}</div></Card>
      <Card><div style={{fontFamily:font.mono,fontSize:10,letterSpacing:1.5,color:C.inkSoft}}>SELECTED CASH IN</div><div style={{fontFamily:font.display,fontWeight:800,fontSize:25,marginTop:4}}>{inr(filteredIn)}</div></Card>
      <Card><div style={{fontFamily:font.mono,fontSize:10,letterSpacing:1.5,color:C.inkSoft}}>SELECTED CASH OUT</div><div style={{fontFamily:font.display,fontWeight:800,fontSize:25,marginTop:4}}>{inr(filteredOut)}</div></Card>
    </div>
    <Card><Label>Add Cash Entry</Label><div style={{display:"flex",gap:8,marginBottom:10}}><Btn variant={type==="in"?"solid":"ghost"} onClick={()=>setType("in")} style={{flex:1,justifyContent:"center"}}>Cash In</Btn><Btn variant={type==="out"?"solid":"ghost"} onClick={()=>setType("out")} style={{flex:1,justifyContent:"center"}}>Cash Out</Btn></div><Label>Category</Label><Select value={category} onChange={e=>setCategory(e.target.value)}>{type==="in"?<option>Other Receipt</option>:<option>Other Expense</option>}</Select><Label>Amount (₹)</Label><Field type="number" value={amount} onChange={e=>setAmount(e.target.value)}/><Label>Note (optional)</Label><Field value={note} onChange={e=>setNote(e.target.value)}/><Btn onClick={addManual} style={{width:"100%",justifyContent:"center"}}><Plus size={16}/> Add Entry</Btn></Card>
    <Label>Transactions</Label>
    {(() => { const groups=[]; shown.slice(0,100).forEach(t=>{const last=groups[groups.length-1];if(last&&last.date===t.date)last.items.push(t);else groups.push({date:t.date,items:[t]});}); return groups.map(g=><div key={g.date}><div style={{fontFamily:font.mono,fontSize:10.5,fontWeight:700,color:C.brass,textTransform:"uppercase",letterSpacing:1,margin:"16px 0 6px"}}>{fmtDate(g.date)}</div>{g.items.map(t=><Card key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><div style={{minWidth:0,overflow:"hidden"}}><div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:font.mono,fontWeight:700,color:t.type==="in"?C.sage:C.stamp}}>{t.type==="in"?"+":"−"}{inr(t.amount)}</div><div style={{fontFamily:font.mono,fontSize:10,color:C.inkSoft,marginTop:2}}>Bal: {inr(t.balanceAfter)}</div></div></Card>)}</div>); })()}
    {shown.length===0 && <EmptyNote text="No cash transactions for the selected dates."/>}
  </div>;
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
