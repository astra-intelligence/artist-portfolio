import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const opentype = require("opentype.js");

const here = path.dirname(fileURLToPath(import.meta.url));
const FONT_CANDIDATES = [
  path.join(here, "../../assets/fonts/LiberationSerif-Bold.ttf"),
  "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
];

let font = null;

function loadFont() {
  if (font) return font;
  const found = FONT_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("The watermark font is missing from this copy of the site.");
  }
  font = opentype.parse(readFileSync(found));
  return font;
}

function glyphFor(mark, character) {
  const glyph = mark.charToGlyph(character);
  if (!glyph || glyph.name === ".notdef") {
    throw new Error(`The watermark font has no letter for “${character}”.`);
  }
  return glyph;
}

function linePath(mark, text, centerX, baseline, fontSize, tracking) {
  const glyphs = Array.from(text).map((character) =>
    character === " " ? mark.charToGlyph(" ") : glyphFor(mark, character),
  );
  const scale = fontSize / mark.unitsPerEm;
  const widths = glyphs.map((glyph, index) => {
    const advance = (glyph.advanceWidth || 0) * scale;
    return advance + (index < glyphs.length - 1 ? tracking : 0);
  });
  const total = widths.reduce((sum, width) => sum + width, 0);
  let x = centerX - total / 2;
  const data = [];
  glyphs.forEach((glyph, index) => {
    if (glyph.name !== "space") data.push(glyph.getPath(x, baseline, fontSize).toPathData(2));
    x += widths[index];
  });
  return data.join(" ");
}

/*
 * One faint line of text along the bottom edge, sized to the photograph.
 * Light letters with a thin dark edge stay readable on pale and dark
 * paint alike. The 1400px cap, not the mark, keeps previews from printing.
 */
function fontSizeFor(width, height) {
  return Math.max(12, Math.round(Math.min(width, height) * 0.024));
}

export function watermarkSvg(credit, width, height) {
  const mark = loadFont();
  const fontSize = fontSizeFor(width, height);
  const baseline = height - Math.round(fontSize * 0.9);
  const line = linePath(mark, credit, width / 2, baseline, fontSize, fontSize * 0.08);
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <path d="${line}" fill="rgba(255,252,247,0.5)" stroke="rgba(24,18,14,0.35)" stroke-width="0.75" stroke-linejoin="round" paint-order="stroke"/>
</svg>`);
}

export async function applyWatermark(plain, credit) {
  const photo = await sharp(plain).metadata();
  if (!photo.width || !photo.height) {
    throw new Error("The photograph has no readable size.");
  }
  return sharp(plain)
    .composite([{ input: watermarkSvg(credit, photo.width, photo.height), blend: "over" }])
    .jpeg({ quality: 70, progressive: true })
    .toBuffer();
}

/*
 * Average pixel change in the bottom band, where the line sits. Measuring
 * the whole picture would let JPEG noise outweigh one thin line, so the
 * callers' "did the mark show" check looks only here.
 */
export async function markDifference(plain, marked) {
  const photo = await sharp(plain).metadata();
  const width = photo.width ?? 0;
  const height = photo.height ?? 0;
  const band = Math.min(height, fontSizeFor(width, height) * 3);
  const region = { left: 0, top: height - band, width, height: band };
  const a = await sharp(plain).extract(region).raw().toBuffer();
  const b = await sharp(marked).extract(region).raw().toBuffer();
  const length = Math.min(a.length, b.length);
  let total = 0;
  let count = 0;
  for (let index = 0; index < length; index += 7) {
    total += Math.abs(a[index] - b[index]);
    count += 1;
  }
  return count === 0 ? 0 : total / count;
}
