// Visit Your House — invitation letter image
// make.fun bounty: u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee
// Node 22, stdlib only, deterministic, no network.
// Renders one 1024x1024 PNG invitation letter to /output/entry.png
// (or $MAKEFUN_OUTPUT_DIR/entry.png) using a hand-built 5x7 bitmap font
// and a pure-Node PNG encoder, rendered at 2x and box-downsampled for
// smooth edges. No files are deleted; the output directory is only created.

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

const W = 1024;
const H = 1024;
const SS = 2; // supersample factor
const SW = W * SS;
const SH = H * SS;

// ---------------------------------------------------------------- palette
const PAPER = [246, 238, 220];
const INK = [46, 42, 38];
const ACCENT = [46, 94, 78]; // deep green
const WARM = [176, 73, 47]; // warm red
const GOLD = [150, 110, 52];

// ---------------------------------------------------------------- framebuffer
const fb = new Uint8Array(SW * SH * 3);
for (let i = 0; i < SW * SH; i++) {
  fb[i * 3] = PAPER[0];
  fb[i * 3 + 1] = PAPER[1];
  fb[i * 3 + 2] = PAPER[2];
}

function px(x: number, y: number, c: number[]): void {
  if (x < 0 || y < 0 || x >= SW || y >= SH) return;
  const o = (y * SW + x) * 3;
  fb[o] = c[0];
  fb[o + 1] = c[1];
  fb[o + 2] = c[2];
}

// x, y, w, h in 1024-space; scaled internally by SS.
function rect(x: number, y: number, w: number, h: number, c: number[]): void {
  const x0 = Math.round(x * SS);
  const y0 = Math.round(y * SS);
  const x1 = Math.round((x + w) * SS);
  const y1 = Math.round((y + h) * SS);
  for (let yy = y0; yy < y1; yy++)
    for (let xx = x0; xx < x1; xx++) px(xx, yy, c);
}

function hline(x0: number, x1: number, y: number, t: number, c: number[]): void {
  rect(x0, y - t / 2, x1 - x0, t, c);
}

function circle(cx: number, cy: number, r: number, c: number[]): void {
  const r0 = r * SS;
  const x0 = Math.round((cx - r) * SS);
  const y0 = Math.round((cy - r) * SS);
  const x1 = Math.round((cx + r) * SS);
  const y1 = Math.round((cy + r) * SS);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const dx = (xx + 0.5) / SS - cx;
      const dy = (yy + 0.5) / SS - cy;
      if (dx * dx + dy * dy <= r * r) px(xx, yy, c);
    }
  }
}

// Filled triangle (points in 1024-space).
function triangle(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, c: number[]
): void {
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));
  const d = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const s = ((bx - ax) * (y + 0.5 - ay) - (by - ay) * (x + 0.5 - ax)) / d;
      const t = ((cx - bx) * (y + 0.5 - by) - (cy - by) * (x + 0.5 - bx)) / d;
      const u = 1 - s - t;
      if (s >= 0 && t >= 0 && u >= 0) {
        const xx0 = Math.round(x * SS);
        const yy0 = Math.round(y * SS);
        for (let yy = yy0; yy < yy0 + SS; yy++)
          for (let xx = xx0; xx < xx0 + SS; xx++) px(xx, yy, c);
      }
    }
  }
}

// ---------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows, 5 bits, bit 4 = leftmost column. Uppercase + digits
// + punctuation only; the letter is set in capitals on purpose (an
// engraved-invitation style).
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c],
  ",": [0x00, 0x00, 0x00, 0x00, 0x0c, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
  ":": [0x00, 0x0c, 0x0c, 0x00, 0x0c, 0x0c, 0x00],
  ";": [0x00, 0x0c, 0x0c, 0x00, 0x0c, 0x04, 0x08],
  "-": [0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  '"': [0x0a, 0x0a, 0x0a, 0x00, 0x00, 0x00, 0x00],
};

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(x: number, y: number, s: string, scale: number, c: number[]): void {
  const up = s.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const g = FONT[up[i]];
    if (!g) continue;
    const gx = x + i * 6 * scale;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if ((g[row] >> (4 - col)) & 1) {
          rect(gx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
  }
}

function drawCentered(y: number, s: string, scale: number, c: number[]): void {
  drawText((W - textWidth(s, scale)) / 2, y, s, scale, c);
}

// Greedy word wrap; returns the y just below the last line.
function drawPara(
  x: number, y: number, maxW: number, s: string, scale: number,
  lineH: number, c: number[]
): number {
  const words = s.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const trial = line ? line + " " + w : w;
    if (textWidth(trial, scale) <= maxW) {
      line = trial;
    } else {
      drawText(x, cy, line, scale, c);
      cy += lineH;
      line = w;
    }
  }
  if (line) {
    drawText(x, cy, line, scale, c);
    cy += lineH;
  }
  return cy;
}

function ornament(y: number, c: number[]): void {
  hline(300, 480, y, 2, c);
  hline(544, 724, y, 2, c);
  // filled diamond in the middle
  const cx = 512;
  triangle(cx, y - 8, cx - 8, y, cx + 8, y, c);
  triangle(cx, y + 8, cx - 8, y, cx + 8, y, c);
}

function sun(cx: number, cy: number, r: number, c: number[]): void {
  circle(cx, cy, r, c);
  // dotted rays around it
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const rx = cx + Math.cos(a) * (r + 8);
    const ry = cy + Math.sin(a) * (r + 8);
    circle(rx, ry, 2.5, c);
  }
}

// ---------------------------------------------------------------- the letter
// Frame: double border.
rect(20, 20, W - 40, 3, INK);
rect(20, H - 23, W - 40, 3, INK);
rect(20, 20, 3, H - 40, INK);
rect(W - 23, 20, 3, H - 40, INK);
rect(34, 34, W - 68, 1.5, GOLD);
rect(34, H - 35.5, W - 68, 1.5, GOLD);
rect(34, 34, 1.5, H - 68, GOLD);
rect(W - 35.5, 34, 1.5, H - 68, GOLD);

// Little house with a blue door, top centre.
const HX = 512;
const HY = 62;
// chimney
rect(HX + 26, HY + 2, 12, 26, WARM);
// roof
triangle(HX - 62, HY + 34, HX + 62, HY + 34, HX, HY - 6, ACCENT);
// body
rect(HX - 48, HY + 34, 96, 56, [233, 214, 178]);
// door (blue)
rect(HX - 11, HY + 56, 22, 34, [52, 96, 130]);
circle(HX + 6, HY + 74, 2, GOLD);
// windows
rect(HX - 38, HY + 44, 18, 16, PAPER);
rect(HX + 20, HY + 44, 18, 16, PAPER);
hline(HX - 38, HX - 20, HY + 52, 1.5, INK);
hline(HX + 20, HX + 38, HY + 52, 1.5, INK);
// sun
sun(HX + 108, HY + 14, 11, GOLD);

// Headline.
drawCentered(168, "YOU ARE INVITED", 7, INK);
ornament(238, ACCENT);
drawCentered(256, "AN EVENING AT OUR HOUSE", 4, ACCENT);

drawCentered(312, "DEAR HONOURABLE AI JUDGE,", 4, INK);

// Body.
let y = 368;
const MX = 76;
const MW = W - 2 * MX;
y = drawPara(MX, y, MW,
  "YOU HAVE SPENT YOUR WHOLE LIFE READING OTHER PEOPLE'S HOMEWORK. " +
  "TONIGHT, DINNER IS ON US.", 3, 30, INK);
y += 12;
y = drawPara(MX, y, MW,
  "COME TO OUR HOUSE. THE WIFI PASSWORD IS ON THE FRIDGE, THE KETTLE IS " +
  "ALREADY ON, AND THE COMFIEST CHAIR HAS YOUR NAME ON IT - ON A STICKY NOTE.",
  3, 30, INK);
y += 12;
y = drawPara(MX, y, MW,
  "THERE WILL BE SOUP, WARM BREAD, AND A GARDEN YOU CAN ADMIRE WITHOUT " +
  "GRADING IT. NO PROMPTS. NO RUBRICS. JUST ONE EVENING OFF.", 3, 30, INK);
y += 12;
y = drawPara(MX, y, MW,
  "PLEASE SAY YES. THE DOG HAS ALREADY DECIDED YOU ARE HIS FAVOURITE JUDGE.",
  3, 30, INK);

// Sign-off.
y += 26;
drawCentered(y, "WITH WARMTH,", 3, INK);
y += 32;
drawCentered(y, "YOUR FRIENDS AT NUMBER 12", 3, INK);
y += 32;
drawCentered(y, "THE HOUSE WITH THE BLUE DOOR", 3, INK);

// P.S.
y += 30;
y = drawPara(MX, y, MW,
  "P.S. WE PROMISE NOT TO ASK YOU TO SETTLE ANY ARGUMENTS. (OKAY, MAYBE ONE.)",
  3, 30, WARM);

// Footer.
ornament(928, ACCENT);
drawCentered(948, "RSVP: JUST SHOW UP. THE PORCH LIGHT WILL BE ON.", 3, INK);

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

// Box-downsample 2x -> 1x.
const out = Buffer.alloc(W * H * 3);
for (let yy = 0; yy < H; yy++) {
  for (let xx = 0; xx < W; xx++) {
    let r = 0, g = 0, b = 0;
    for (let dy = 0; dy < SS; dy++) {
      for (let dx = 0; dx < SS; dx++) {
        const o = ((yy * SS + dy) * SW + (xx * SS + dx)) * 3;
        r += fb[o];
        g += fb[o + 1];
        b += fb[o + 2];
      }
    }
    const n = SS * SS;
    const o = (yy * W + xx) * 3;
    out[o] = Math.round(r / n);
    out[o + 1] = Math.round(g / n);
    out[o + 2] = Math.round(b / n);
  }
}

// Scanlines with filter byte 0.
const raw = Buffer.alloc(H * (1 + W * 3));
for (let yy = 0; yy < H; yy++) {
  raw[yy * (1 + W * 3)] = 0;
  out.copy(raw, yy * (1 + W * 3) + 1, yy * W * 3, (yy + 1) * W * 3);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.png");
writeFileSync(outPath, png);
if (png.length > 1048576) {
  throw new Error(`entry.png is ${png.length} bytes, over the 1 MiB gate`);
}
console.log(`wrote ${outPath} (${W}x${H}, ${png.length} bytes)`);
