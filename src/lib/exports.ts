import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { WBSTask, ViewOption } from '../types';
import { PLANT_BACKGROUND, RADI_LOGO } from '../assets/plantBackground';
import {
  buildSummary,
  countStatuses,
  effectiveStatus,
  packageStats,
  formatDate,
  dayMs,
  wpHex,
  SOP_TARGET,
  PALETTE
} from './projectStats';

/* ============================================================
   Shared helpers
   ============================================================ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });
}

/** Cover-fit draw, so the render never stretches out of proportion. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const ir = img.width / img.height;
  const dr = w / h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > dr) { sh = img.height; sw = sh * dr; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / dr; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, rr);
  } else {
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   1. Progress snapshot (PNG)

   Composed by hand on a 2D canvas rather than screenshotting the DOM:
   html2canvas cannot reproduce backdrop-filter, so the frosted cards would
   come out as flat opaque boxes. Drawing the blur pass manually keeps the
   glass-over-photo look the shared dashboard uses.
   ============================================================ */

export async function exportProgressPng(tasks: WBSTask[], simulationDate: string): Promise<void> {
  const s = buildSummary(tasks, simulationDate);
  const [bg, logo] = await Promise.all([
    loadImage(PLANT_BACKGROUND).catch(() => null),
    loadImage(RADI_LOGO).catch(() => null)
  ]);

  const W = 1160;
  const margin = 30;
  const gap = 18;
  const headerH = 132;
  const heroH = 148;
  const kpiH = 96;
  const pkgRowH = 44;
  const pkgPad = 24;
  const pkgHeadH = 34;
  const pkgH = pkgPad * 2 + pkgHeadH + s.packages.length * pkgRowH;
  const footerH = 52;
  const H = headerH + gap + heroH + gap + kpiH + gap + pkgH + footerH;

  const SCALE = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  /* --- background photo + washes --- */
  if (bg) drawCover(ctx, bg, 0, 0, W, H);
  else { ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, W, H); }

  const hg = ctx.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, 'rgba(2,6,23,.90)');
  hg.addColorStop(0.55, 'rgba(15,23,42,.76)');
  hg.addColorStop(1, 'rgba(15,23,42,.46)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, headerH);

  const fg = ctx.createLinearGradient(0, headerH, 0, H);
  fg.addColorStop(0, 'rgba(2,6,23,.58)');
  fg.addColorStop(0.14, 'rgba(15,23,42,.44)');
  fg.addColorStop(0.34, 'rgba(241,245,249,.90)');
  fg.addColorStop(0.46, '#f1f5f9');
  fg.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = fg;
  ctx.fillRect(0, headerH, W, H - headerH);

  /* --- blurred copy used as the backdrop for every glass card --- */
  const sharp = document.createElement('canvas');
  sharp.width = canvas.width; sharp.height = canvas.height;
  sharp.getContext('2d')!.drawImage(canvas, 0, 0);

  const blurred = document.createElement('canvas');
  blurred.width = canvas.width; blurred.height = canvas.height;
  const bctx = blurred.getContext('2d')!;
  bctx.filter = `blur(${16 * SCALE}px)`;
  bctx.drawImage(sharp, 0, 0);
  bctx.filter = 'none';

  function glass(x: number, y: number, w: number, h: number, r: number, tint: string, stroke: string) {
    ctx.save();
    ctx.shadowColor = 'rgba(2,6,23,.30)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = 'rgba(0,0,0,0.001)';
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.drawImage(blurred, 0, 0, blurred.width, blurred.height, 0, 0, W, H);
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.save();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.restore();
  }

  function track(x: number, y: number, w: number, h: number, pct: number, base: string, from: string, to: string) {
    roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = base;
    ctx.fill();
    const clamped = Math.max(0, Math.min(100, pct));
    if (clamped <= 0) return;              // an empty track reads as 0%, a stub pill does not
    const fw = Math.max(h, (w * clamped) / 100);
    ctx.save();
    roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.clip();
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, fw, h);
    ctx.restore();
  }

  function spaced(text: string, x: number, y: number, tracking: number) {
    let cx = x;
    for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + tracking; }
  }

  function pill(text: string, x: number, y: number, accent: boolean): number {
    ctx.font = `${accent ? 700 : 600} 12px "Segoe UI",Roboto,Arial,sans-serif`;
    const padX = 11, h = 25;
    const w = ctx.measureText(text).width + padX * 2;
    ctx.save();
    roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = accent ? PALETTE.blue : 'rgba(255,255,255,.10)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = accent ? PALETTE.blueLight : 'rgba(255,255,255,.18)';
    ctx.stroke();
    ctx.fillStyle = accent ? '#ffffff' : 'rgba(255,255,255,.88)';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padX, y + h / 2 + 0.5);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    return w;
  }

  /* ================= HEADER ================= */
  ctx.textBaseline = 'alphabetic';

  // Real logo on a white pill, matching the in-app header. The asset is
  // served same-origin (public/assets), so drawing it here never taints the
  // canvas the way the old Google-Drive-hosted bitmap would have.
  const logoPillH = 46;
  const logoPillY = margin - 4;
  let titleX = margin + 148;
  if (logo) {
    const innerH = logoPillH - 16;
    const logoW = innerH * (logo.width / logo.height);
    const pillW = logoW + 36;
    roundRectPath(ctx, margin, logoPillY, pillW, logoPillH, logoPillH / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.drawImage(logo, margin + 18, logoPillY + 8, logoW, innerH);
    titleX = margin + pillW + 20;
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px "Segoe UI",Roboto,Arial,sans-serif';
    ctx.fillText('RADI', margin, margin + 20);
    ctx.fillStyle = PALETTE.blueLight;
    ctx.font = '700 9.5px "Segoe UI",Roboto,Arial,sans-serif';
    spaced('ENERGY SOLUTIONS', margin, margin + 33, 1.2);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '750 23px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText('Battery Pack Plant — Overall Progress', titleX, margin + 20);
  ctx.fillStyle = 'rgba(255,255,255,.68)';
  ctx.font = '400 12.5px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText('Radi Energy Solutions Battery Pack Plant · Master WorkPlan FY26/27', titleX, margin + 40);

  ctx.save();
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.blueLight;
  ctx.font = '700 10px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText('PROGRESS SNAPSHOT · ' + todayStamp(), W - margin, margin + 14);
  ctx.restore();

  let px = titleX;
  px += pill('Scope: FY26/27 Workplan', px, margin + 56, false) + 8;
  px += pill('SOP Target: ' + formatDate(SOP_TARGET), px, margin + 56, true) + 8;
  px += pill('As at: ' + formatDate(simulationDate), px, margin + 56, false) + 8;

  /* ================= HERO: overall progress + days to SOP ================= */
  const heroY = headerH + gap;
  const sopW = 268;
  const progW = W - margin * 2 - gap - sopW;

  glass(margin, heroY, progW, heroH, 18, 'rgba(255,255,255,0.72)', 'rgba(255,255,255,.75)');
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '750 54px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText(s.pct + '%', margin + 28, heroY + 66);
  ctx.fillStyle = '#475569';
  ctx.font = '700 11.5px "Segoe UI",Roboto,Arial,sans-serif';
  spaced('OVERALL PROGRESS', margin + 28, heroY + 88, 1.2);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 12.5px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText(`${s.counts.completed} of ${s.counts.total} activities closed`, margin + 28, heroY + 107);

  // schedule comparison, right-aligned so it can never collide with the % block
  ctx.save();
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '700 10.5px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText('PROGRAMME ELAPSED', margin + progW - 26, heroY + 34);
  ctx.fillStyle = '#334155';
  ctx.font = '750 26px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText(s.elapsedPct + '%', margin + progW - 26, heroY + 62);
  ctx.fillStyle = s.pct >= s.elapsedPct ? PALETTE.emeraldDark : PALETTE.rose;
  ctx.font = '700 11.5px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText(
    s.pct >= s.elapsedPct ? `${s.pct - s.elapsedPct} pts ahead` : `${s.elapsedPct - s.pct} pts behind`,
    margin + progW - 26, heroY + 82
  );
  ctx.restore();

  const trackX = margin + 28, trackW = progW - 56, trackY = heroY + heroH - 30;
  track(trackX, trackY, trackW, 14, s.pct, 'rgba(148,163,184,.30)', PALETTE.blue, PALETTE.blueLight);
  // elapsed-time marker
  const markX = trackX + (trackW * s.elapsedPct) / 100;
  ctx.fillStyle = 'rgba(15,23,42,.75)';
  ctx.fillRect(markX - 1.5, trackY - 4, 3, 22);

  glass(margin + progW + gap, heroY, sopW, heroH, 18, 'rgba(15,23,42,0.78)', 'rgba(255,255,255,.30)');
  const sopX = margin + progW + gap + 26;
  ctx.fillStyle = PALETTE.blueLight;
  ctx.font = '700 11px "Segoe UI",Roboto,Arial,sans-serif';
  spaced('DAYS TO SOP', sopX, heroY + 36, 1.2);
  ctx.fillStyle = '#ffffff';
  ctx.font = '750 46px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText(String(s.daysToSop), sopX, heroY + 88);
  ctx.fillStyle = 'rgba(226,232,240,.78)';
  ctx.font = '400 12.5px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText('Target ' + formatDate(SOP_TARGET), sopX, heroY + heroH - 26);

  /* ================= KPI ROW ================= */
  const kpiY = heroY + heroH + gap;
  const kpis: [string, number, string, string][] = [
    ['Completed', s.counts.completed, 'signed off', PALETTE.emerald],
    ['In Progress', s.counts.inProgress, 'inside window', PALETTE.blue],
    ['Pending', s.counts.pending, 'not started', PALETTE.slate],
    ['Overdue', s.counts.overdue, 'past deadline', PALETTE.rose]
  ];
  const kpiW = (W - margin * 2 - gap * 3) / 4;
  kpis.forEach((k, i) => {
    const x = margin + i * (kpiW + gap);
    glass(x, kpiY, kpiW, kpiH, 14, 'rgba(255,255,255,0.78)', 'rgba(255,255,255,.70)');
    ctx.fillStyle = k[3];
    ctx.beginPath();
    ctx.arc(x + kpiW - 20, kpiY + 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = '700 10px "Segoe UI",Roboto,Arial,sans-serif';
    spaced(k[0].toUpperCase(), x + 20, kpiY + 26, 1);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '750 30px "Segoe UI",Roboto,Arial,sans-serif';
    ctx.fillText(String(k[1]), x + 20, kpiY + 60);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '400 11.5px "Segoe UI",Roboto,Arial,sans-serif';
    ctx.fillText(k[2], x + 20, kpiY + 79);
  });

  /* ================= WORK PACKAGES ================= */
  const pkgY = kpiY + kpiH + gap;
  glass(margin, pkgY, W - margin * 2, pkgH, 18, 'rgba(255,255,255,0.80)', 'rgba(255,255,255,.72)');
  ctx.fillStyle = '#475569';
  ctx.font = '750 12px "Segoe UI",Roboto,Arial,sans-serif';
  spaced('PROGRESS BY WORK PACKAGE', margin + pkgPad, pkgY + pkgPad + 4, 1);

  let ry = pkgY + pkgPad + pkgHeadH + 10;
  const barX = margin + pkgPad + 14;
  const barW = W - margin * 2 - pkgPad * 2 - 14;

  s.packages.forEach(p => {
    // swatch
    ctx.fillStyle = p.color;
    roundRectPath(ctx, margin + pkgPad, ry - 9, 8, 8, 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 13px "Segoe UI",Roboto,Arial,sans-serif';
    ctx.fillText(p.wp, barX, ry, barW - 200);

    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '400 11px "Segoe UI",Roboto,Arial,sans-serif';
    ctx.fillText(
      `${p.completed}/${p.total} closed` + (p.overdue ? ` · ${p.overdue} overdue` : ''),
      W - margin - pkgPad - 52, ry
    );
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '750 13px "Segoe UI",Roboto,Arial,sans-serif';
    ctx.fillText(p.pct + '%', W - margin - pkgPad, ry);
    ctx.restore();

    track(barX, ry + 9, barW, 9, p.pct, 'rgba(148,163,184,.25)', p.color, p.color);
    ry += pkgRowH;
  });

  /* ================= FOOTER ================= */
  ctx.fillStyle = '#7c8697';
  ctx.font = '400 11.5px "Segoe UI",Roboto,Arial,sans-serif';
  ctx.fillText(
    'Radi Energy Solutions Battery Pack Plant · Master WorkPlan · generated ' + todayStamp(),
    margin, H - 22
  );

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('toBlob failed')); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `T6_Overall_Progress_${todayStamp()}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); resolve(); }, 100);
    }, 'image/png');
  });
}

/* ============================================================
   2. Action matrix + compressed Gantt (PDF, landscape A4)
   ============================================================ */

export interface PdfExportContext {
  tasks: WBSTask[];          // already filtered by the interactive controls
  allTasks: WBSTask[];       // unfiltered, for programme-level context
  simulationDate: string;
  view: ViewOption;          // the selected period
  filterSummary: string[];   // human-readable list of active filters
}

export async function exportActionMatrixPdf(cx: PdfExportContext): Promise<void> {
  const { tasks, simulationDate, view, filterSummary } = cx;
  const simMs = dayMs(simulationDate);

  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 26;
  const headerH = 62;

  const blue = hexToRgb(PALETTE.blue);
  const ink = hexToRgb(PALETTE.ink);

  /* --- one composited background reused on every page --- */
  const [bgImg, logoImg] = await Promise.all([
    loadImage(PLANT_BACKGROUND).catch(() => null),
    loadImage(RADI_LOGO).catch(() => null)
  ]);
  let bgData: string | null = null;
  if (bgImg) {
    const S = 2;
    const c = document.createElement('canvas');
    c.width = Math.round(pageW * S);
    c.height = Math.round(pageH * S);
    const g = c.getContext('2d')!;
    drawCover(g, bgImg, 0, 0, c.width, c.height);

    const hpx = headerH * S;
    const hg = g.createLinearGradient(0, 0, c.width, 0);
    hg.addColorStop(0, 'rgba(2,6,23,.93)');
    hg.addColorStop(0.55, 'rgba(15,23,42,.80)');
    hg.addColorStop(1, 'rgba(15,23,42,.52)');
    g.fillStyle = hg;
    g.fillRect(0, 0, c.width, hpx);

    // short blend into an even, light wash — the photo stays visible for the
    // rest of the page but never fights the table text for contrast
    const blend = 46 * S;
    const fg = g.createLinearGradient(0, hpx, 0, hpx + blend);
    fg.addColorStop(0, 'rgba(2,6,23,.60)');
    fg.addColorStop(1, 'rgba(241,245,249,.86)');
    g.fillStyle = fg;
    g.fillRect(0, hpx, c.width, blend);
    g.fillStyle = 'rgba(241,245,249,.86)';
    g.fillRect(0, hpx + blend, c.width, c.height - hpx - blend);

    bgData = c.toDataURL('image/jpeg', 0.86);
  }

  /* --- drawing primitives --- */
  function glassRect(
    x: number, y: number, w: number, h: number, r: number,
    fill: [number, number, number], alpha: number,
    stroke?: [number, number, number], strokeAlpha = 0.55
  ) {
    doc.saveGraphicsState();
    (doc as any).setGState(new (doc as any).GState({ opacity: alpha }));
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.roundedRect(x, y, w, h, r, r, 'F');
    doc.restoreGraphicsState();
    if (stroke) {
      doc.saveGraphicsState();
      (doc as any).setGState(new (doc as any).GState({ opacity: strokeAlpha }));
      doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
      doc.setLineWidth(0.7);
      doc.roundedRect(x, y, w, h, r, r, 'S');
      doc.restoreGraphicsState();
    }
  }

  function pill(
    text: string, x: number, y: number, size: number,
    fill: [number, number, number], alpha: number,
    textColor: [number, number, number], bold: boolean
  ): number {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const tw = doc.getTextWidth(text);
    const padX = 7, h = size + 8;
    glassRect(x, y, tw + padX * 2, h, h / 2, fill, alpha, [255, 255, 255], 0.32);
    doc.saveGraphicsState();
    (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(text, x + padX, y + h / 2 + size * 0.34);
    doc.restoreGraphicsState();
    return tw + padX * 2;
  }

  /** Shrink text until it fits, so a long title can never run into its neighbour. */
  function fitSize(text: string, maxW: number, start: number, min: number, bold: boolean): number {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    let size = start;
    doc.setFontSize(size);
    while (size > min && doc.getTextWidth(text) > maxW) { size -= 0.25; doc.setFontSize(size); }
    return size;
  }

  /** Hard-truncate with an ellipsis at the current font settings. */
  function clip(text: string, maxW: number): string {
    if (doc.getTextWidth(text) <= maxW) return text;
    let t = text;
    while (t.length > 1 && doc.getTextWidth(t + '…') > maxW) t = t.slice(0, -1);
    return t.trimEnd() + '…';
  }

  let pageKicker = 'ACTIVITY MATRIX';
  /** Set while autoTable owns the page, so its continuation pages get a card. */
  let inTableSection = false;

  function drawChrome() {
    if (bgData) doc.addImage(bgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
    else {
      doc.setFillColor(241, 245, 249); doc.rect(0, 0, pageW, pageH, 'F');
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageW, headerH, 'F');
    }

    // Real logo on a white pill, matching the in-app header. Same-origin
    // asset, so it draws straight in — no cross-origin taint to work around.
    let textX = margin + 96;
    if (logoImg) {
      const pillH = 38;
      const pillY = (headerH - pillH) / 2;
      const innerH = pillH - 14;
      const logoW = innerH * (logoImg.width / logoImg.height);
      const pillW = logoW + 26;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, pillY, pillW, pillH, pillH / 2, pillH / 2, 'F');
      doc.addImage(logoImg, 'PNG', margin + 13, pillY + 7, logoW, innerH, undefined, 'FAST');
      textX = margin + pillW + 14;
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('RADI', margin, headerH * 0.44);
      doc.setTextColor(96, 165, 250);
      doc.setFontSize(6.2);
      doc.text('E N E R G Y   S O L U T I O N S', margin, headerH * 0.44 + 9);
    }

    const titleMaxW = pageW - textX - margin - 190;

    const title = 'Battery Pack Plant Master WorkPlan';
    const ts = fitSize(title, titleMaxW, 13.5, 9, true);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(ts);
    doc.text(title, textX, headerH * 0.36);

    doc.saveGraphicsState();
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.72 }));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(255, 255, 255);
    doc.text('Radi Energy Solutions · Master WorkPlan · FY26/27', textX, headerH * 0.36 + 10);
    doc.restoreGraphicsState();

    let px = textX;
    px += pill('Period: ' + view.name, px, headerH - 22, 6.6, [255, 255, 255], 0.14, [255, 255, 255], false) + 4;
    px += pill('SOP: ' + formatDate(SOP_TARGET), px, headerH - 22, 6.6, blue, 0.95, [255, 255, 255], true) + 4;
    px += pill('As at: ' + formatDate(simulationDate), px, headerH - 22, 6.6, [255, 255, 255], 0.14, [255, 255, 255], false) + 4;
    if (filterSummary.length) {
      const f = clip('Filters: ' + filterSummary.join(' · '), pageW - px - margin - 170);
      pill(f, px, headerH - 22, 6.6, [255, 255, 255], 0.14, [255, 255, 255], false);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(147, 197, 253);
    doc.text(pageKicker, pageW - margin, headerH * 0.36, { align: 'right' });
    doc.saveGraphicsState();
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.82 }));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('Generated ' + todayStamp(), pageW - margin, headerH * 0.36 + 10, { align: 'right' });
    doc.restoreGraphicsState();

    // A table that runs past the page break gets a full-height frosted card on
    // the continuation page, so its rows never float straight on the photo.
    if (inTableSection) {
      glassRect(margin, headerH + 10, pageW - margin * 2, pageH - headerH - 10 - margin, 10,
        [255, 255, 255], 0.88, [255, 255, 255], 0.55);
    }
  }

  /**
   * Chrome is painted on page creation, never after content — drawing it from
   * autoTable's didDrawPage hook would repaint the background image over the
   * rows that had just been written.
   */
  doc.internal.events.subscribe('addPage', drawChrome);
  drawChrome(); // page 1

  /* ---------- summary strip ---------- */
  const counts = countStatuses(tasks, simMs);
  const outstanding = counts.total - counts.completed;
  const pct = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  const daysToSop = Math.round((dayMs(SOP_TARGET) - simMs) / 86400000);

  const stripY = headerH + 12;
  const stripH = 46;
  const cells: [string, string, [number, number, number]][] = [
    ['Overall progress', `${pct}%`, blue],
    ['Outstanding', String(outstanding), [71, 85, 105]],
    ['Overdue', String(counts.overdue), hexToRgb(PALETTE.rose)],
    ['In progress', String(counts.inProgress), hexToRgb(PALETTE.blue)],
    ['Pending', String(counts.pending), hexToRgb(PALETTE.slate)],
    ['Days to SOP', String(daysToSop), ink]
  ];
  const cellW = (pageW - margin * 2 - 5 * 7) / 6;
  cells.forEach((c, i) => {
    const x = margin + i * (cellW + 7);
    glassRect(x, stripY, cellW, stripH, 9, [255, 255, 255], 0.86, [255, 255, 255], 0.6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    doc.setTextColor(100, 116, 139);
    doc.text(c[0].toUpperCase(), x + 10, stripY + 15);
    doc.setFontSize(17);
    doc.setTextColor(c[2][0], c[2][1], c[2][2]);
    doc.text(c[1], x + 10, stripY + 36);
  });

  /* ---------- outstanding-activity tables ---------- */
  const overdue = tasks
    .filter(t => effectiveStatus(t, simMs) === 'OVERDUE')
    .sort((a, b) => a.endMs - b.endMs);
  const upcoming = tasks
    .filter(t => { const st = effectiveStatus(t, simMs); return st === 'IN_PROGRESS' || st === 'PENDING'; })
    .sort((a, b) => a.endMs - b.endMs);

  function sectionHeading(label: string, count: number, y: number, accent: [number, number, number]): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const text = `${label}  ·  ${count}`;
    const tw = doc.getTextWidth(text);
    const h = 20, padX = 11;
    glassRect(margin, y, tw + padX * 2, h, 10, accent, 0.92, [255, 255, 255], 0.5);
    doc.saveGraphicsState();
    (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
    doc.setTextColor(255, 255, 255);
    doc.text(text, margin + padX, y + h / 2 + 3.3);
    doc.restoreGraphicsState();
    return h;
  }

  const tableW = pageW - margin * 2;
  const colW = {
    sn: 24,
    wp: 104,
    act: 300,
    lead: 56,
    support: 112,
    dl: 60,
    days: 46
  };
  const used = Object.values(colW).reduce((a, b) => a + b, 0);
  colW.act += tableW - used - 16; // absorb the remainder so the table exactly fills the page

  function renderSection(
    label: string, rows: WBSTask[], y: number,
    accent: [number, number, number], emptyMsg: string
  ): number {
    if (y > pageH - 130) { doc.addPage(); y = headerH + 14; }
    const hh = sectionHeading(label, rows.length, y, accent);
    let ty = y + hh + 7;

    if (!rows.length) {
      glassRect(margin, ty, tableW, 26, 9, [255, 255, 255], 0.88, [255, 255, 255], 0.55);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(emptyMsg, margin + 12, ty + 17);
      return ty + 26 + 14;
    }

    inTableSection = true;
    autoTable(doc, {
      startY: ty,
      margin: { left: margin, right: margin, top: headerH + 14, bottom: margin },
      head: [['#', 'Work Package', 'Activity', 'Lead', 'Supporting Team', 'Deadline', 'Days']],
      body: rows.map((t, i) => {
        const d = Math.round((t.endMs - simMs) / 86400000);
        return [
          String(i + 1),
          t.wp,
          t.activity,
          t.lead || '—',
          t.support || 'None',
          formatDate(t.deadline),
          d < 0 ? `${-d} late` : d === 0 ? 'today' : `${d}`
        ];
      }),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.6,
        cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        textColor: [30, 41, 59],
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.4,
        cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: colW.sn, halign: 'right', textColor: [148, 163, 184] },
        1: { cellWidth: colW.wp, fontSize: 7 },
        2: { cellWidth: colW.act, fontStyle: 'bold' },
        3: { cellWidth: colW.lead },
        4: { cellWidth: colW.support, fontSize: 7, textColor: [100, 116, 139] },
        5: { cellWidth: colW.dl, halign: 'center' },
        6: { cellWidth: colW.days, halign: 'center', fontStyle: 'bold' }
      },
      // colour-code the work package cell and the urgency column
      didParseCell: (data: any) => {
        if (data.section !== 'body') return;
        const t = rows[data.row.index];
        if (data.column.index === 1) {
          const [r, g, b] = hexToRgb(wpHex(t.wp));
          data.cell.styles.textColor = [r, g, b];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 6) {
          const d = Math.round((t.endMs - simMs) / 86400000);
          data.cell.styles.textColor = d < 0
            ? hexToRgb(PALETTE.rose)
            : d <= 7 ? hexToRgb(PALETTE.amber) : [100, 116, 139];
        }
      }
    });
    inTableSection = false;

    return (doc as any).lastAutoTable.finalY + 16;
  }

  let y = stripY + stripH + 14;
  y = renderSection('OVERDUE — IMMEDIATE ACTION', overdue, y, hexToRgb(PALETTE.rose), 'No overdue activities in this selection.');
  y = renderSection('OUTSTANDING — TO BE COMPLETED', upcoming, y, hexToRgb(PALETTE.blue), 'No outstanding activities in this selection.');

  /* ============================================================
     Compressed Gantt — grouped by work package
     ============================================================ */
  const ganttTasks = [...tasks].sort((a, b) => a.startMs - b.startMs);
  if (ganttTasks.length) {
    pageKicker = 'PROGRAMME GANTT';

    const viewStart = dayMs(view.start);
    const viewEnd = dayMs(view.end) + 86399000;
    const span = viewEnd - viewStart;

    const labelW = 196;
    const chartX = margin + labelW + 6;
    const chartW = pageW - margin - chartX;
    const rowH = 11.6;      // compressed — roughly 35 activities per page
    const bandH = 15;
    const axisH = 18;
    const legendH = 14;
    const bodyTop = headerH + 12;
    const bodyBottom = pageH - margin - 20;

    /* ---- axis ticks ---- */
    interface Tick { label: string; x: number; w: number }
    const ticks: Tick[] = [];
    if (view.type === 'months') {
      const d0 = new Date(viewStart);
      let cur = new Date(d0.getFullYear(), d0.getMonth(), 1);
      while (cur.getTime() < viewEnd) {
        const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        const a = Math.max(cur.getTime(), viewStart);
        const b = Math.min(next.getTime(), viewEnd);
        ticks.push({
          label: cur.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
          x: chartX + ((a - viewStart) / span) * chartW,
          w: ((b - a) / span) * chartW
        });
        cur = next;
      }
    } else {
      const totalDays = Math.round(span / 86400000);
      const step = totalDays > 20 ? 5 : 2;
      for (let d = 1; d <= totalDays; d += step) {
        const a = viewStart + (d - 1) * 86400000;
        const b = Math.min(a + step * 86400000, viewEnd);
        ticks.push({
          label: String(d),
          x: chartX + ((a - viewStart) / span) * chartW,
          w: ((b - a) / span) * chartW
        });
      }
    }

    /* ---- flatten into a single stream, then paginate up front so every page's
       frosted card can be sized to the rows it actually holds (a card stretched
       to the full page height leaves a large blank slab on the last page) ---- */
    type Item =
      | { kind: 'band'; wp: string; items: WBSTask[]; cont: boolean }
      | { kind: 'row'; task: WBSTask; wp: string };

    const groups = new Map<string, WBSTask[]>();
    ganttTasks.forEach(t => {
      const k = t.wp || 'Unassigned';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(t);
    });

    const stream: Item[] = [];
    groups.forEach((items, wp) => {
      stream.push({ kind: 'band', wp, items, cont: false });
      items.forEach(task => stream.push({ kind: 'row', task, wp }));
    });

    const pages: Item[][] = [];
    {
      let page: Item[] = [];
      let used = axisH + 3;
      const capacity = bodyBottom - bodyTop - legendH;
      for (const item of stream) {
        const h = item.kind === 'band' ? bandH : rowH;
        // never strand a band header at the foot of a page
        const lookahead = item.kind === 'band' ? h + rowH : h;
        if (used + lookahead > capacity && page.length) {
          pages.push(page);
          page = [];
          used = axisH + 3;
          // repeat the group header on the next page when a group is split
          if (item.kind === 'row') {
            const g = groups.get(item.wp)!;
            page.push({ kind: 'band', wp: item.wp, items: g, cont: true });
            used += bandH;
          }
        }
        page.push(item);
        used += h;
      }
      if (page.length) pages.push(page);
    }

    /* ---- render ---- */
    pages.forEach((page, pageIdx) => {
      doc.addPage(); // chrome is painted by the addPage subscriber

      const contentH = page.reduce((a, it) => a + (it.kind === 'band' ? bandH : rowH), 0);
      const cardH = axisH + 3 + contentH + legendH + 8;
      const cardTop = bodyTop;

      glassRect(margin, cardTop, pageW - margin * 2, cardH, 8, [255, 255, 255], 0.90, [255, 255, 255], 0.6);

      // axis
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin + 3, cardTop, pageW - margin * 2 - 6, axisH, 4, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(148, 163, 184);
      doc.text('ACTIVITY', margin + 11, cardTop + axisH / 2 + 2.2);
      doc.setTextColor(226, 232, 240);
      ticks.forEach(t => doc.text(t.label, t.x + t.w / 2, cardTop + axisH / 2 + 2.2, { align: 'center' }));
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.3);
      ticks.forEach(t => doc.line(t.x, cardTop + 3, t.x, cardTop + axisH - 3));

      const gridTop = cardTop + axisH + 3;
      const gridBottom = gridTop + contentH;

      // gridlines behind the bars
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      ticks.forEach(t => doc.line(t.x, gridTop, t.x, gridBottom));
      doc.line(chartX + chartW, gridTop, chartX + chartW, gridBottom);

      // today marker, repeated on every page of the chart
      if (simMs >= viewStart && simMs <= viewEnd) {
        const tx = chartX + ((simMs - viewStart) / span) * chartW;
        const [rr, rg, rb] = hexToRgb(PALETTE.rose);
        doc.setDrawColor(rr, rg, rb);
        doc.setLineWidth(0.9);
        doc.line(tx, gridTop, tx, gridBottom);
      }

      let gy = gridTop;
      let rowIndex = 0;

      page.forEach(item => {
        if (item.kind === 'band') {
          const [r, g, b] = hexToRgb(wpHex(item.wp));
          doc.saveGraphicsState();
          (doc as any).setGState(new (doc as any).GState({ opacity: 0.14 }));
          doc.setFillColor(r, g, b);
          doc.rect(margin + 3, gy, pageW - margin * 2 - 6, bandH, 'F');
          doc.restoreGraphicsState();
          doc.setFillColor(r, g, b);
          doc.rect(margin + 3, gy, 3, bandH, 'F');

          const st = countStatuses(item.items, simMs);
          const gp = st.total ? Math.round((st.completed / st.total) * 100) : 0;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(r, g, b);
          doc.text(clip(item.wp.toUpperCase() + (item.cont ? ' (CONT.)' : ''), labelW - 74),
            margin + 12, gy + bandH / 2 + 2.3);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.4);
          doc.setTextColor(100, 116, 139);
          doc.text(`${st.completed}/${st.total} · ${gp}%`, margin + labelW - 4, gy + bandH / 2 + 2.2, { align: 'right' });
          gy += bandH;
          rowIndex = 0;
          return;
        }

        const t = item.task;
        if (rowIndex % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin + 3, gy, pageW - margin * 2 - 6, rowH, 'F');
        }
        rowIndex++;

        const status = effectiveStatus(t, simMs);

        // label — hard-clipped so it can never spill into the chart area
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        if (status === 'COMPLETED') doc.setTextColor(148, 163, 184);
        else doc.setTextColor(51, 65, 85);
        doc.text(clip(t.activity, labelW - 46), margin + 14, gy + rowH / 2 + 2);

        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(clip(t.lead || '—', 38), margin + labelW - 4, gy + rowH / 2 + 2, { align: 'right' });

        // bar
        let x0 = chartX + ((t.startMs - viewStart) / span) * chartW;
        let x1 = chartX + ((t.endMs - viewStart) / span) * chartW;
        x0 = Math.max(chartX, x0);
        x1 = Math.min(chartX + chartW, x1);

        if (x1 > chartX && x0 < chartX + chartW) {
          const bw = Math.max(2.2, x1 - x0);
          const barH = 6;
          const by = gy + (rowH - barH) / 2;
          const [r, g, b] = hexToRgb(wpHex(t.wp));

          if (status === 'COMPLETED') {
            doc.setFillColor(209, 250, 229);
            doc.roundedRect(x0, by, bw, barH, 1.6, 1.6, 'F');
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(0.5);
            doc.roundedRect(x0, by, bw, barH, 1.6, 1.6, 'S');
          } else if (status === 'OVERDUE') {
            const [rr, rg, rb] = hexToRgb(PALETTE.rose);
            doc.setFillColor(rr, rg, rb);
            doc.roundedRect(x0, by, bw, barH, 1.6, 1.6, 'F');
          } else {
            doc.setFillColor(r, g, b);
            doc.roundedRect(x0, by, bw, barH, 1.6, 1.6, 'F');
          }

          // deadline flag, only where there is clear space before the chart edge
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.2);
          const flag = formatDate(t.deadline).slice(0, 6);
          if (x1 + doc.getTextWidth(flag) + 4 < chartX + chartW) {
            doc.setTextColor(120, 133, 153);
            doc.text(flag, x1 + 2.5, gy + rowH / 2 + 1.8);
          }
        }

        gy += rowH;
      });

      /* legend, on every page of the chart */
      const ly = gridBottom + 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      let lx = margin + 11;
      const legend: [string, [number, number, number], boolean][] = [
        ['Completed', [16, 185, 129], true],
        ['Planned / in progress', hexToRgb(PALETTE.blue), false],
        ['Overdue', hexToRgb(PALETTE.rose), false]
      ];
      legend.forEach(([label, col, outline]) => {
        if (outline) {
          doc.setFillColor(209, 250, 229);
          doc.roundedRect(lx, ly - 4, 12, 5, 1.2, 1.2, 'F');
          doc.setDrawColor(col[0], col[1], col[2]);
          doc.setLineWidth(0.5);
          doc.roundedRect(lx, ly - 4, 12, 5, 1.2, 1.2, 'S');
        } else {
          doc.setFillColor(col[0], col[1], col[2]);
          doc.roundedRect(lx, ly - 4, 12, 5, 1.2, 1.2, 'F');
        }
        doc.setTextColor(71, 85, 105);
        doc.text(label, lx + 15, ly);
        lx += 15 + doc.getTextWidth(label) + 12;
      });
      // today swatch
      const [tr, tg, tb] = hexToRgb(PALETTE.rose);
      doc.setDrawColor(tr, tg, tb);
      doc.setLineWidth(1);
      doc.line(lx + 5, ly - 4.5, lx + 5, ly + 1);
      doc.setTextColor(71, 85, 105);
      doc.text('Today', lx + 11, ly);

      doc.setTextColor(148, 163, 184);
      doc.text(
        `${view.name} window · chart ${pageIdx + 1} of ${pages.length}`,
        pageW - margin - 11, ly, { align: 'right' }
      );
    });
  }


  /* ---------- page numbers ---------- */
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Radi Energy Solutions Battery Pack Plant · Master WorkPlan · page ${i} of ${total}`,
      pageW / 2, pageH - 12, { align: 'center' }
    );
  }

  doc.save(`T6_Action_Matrix_${todayStamp()}.pdf`);
}

/* Re-exported so App can build the filter summary without importing stats twice. */
export { packageStats };
