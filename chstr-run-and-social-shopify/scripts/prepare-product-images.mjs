#!/usr/bin/env node
// Turns the supplier mock-ups in assets/images/ into clean storefront images in src/assets/products/.
// Most mock-ups show the FRONT on the left half and the BACK on the right half. For each one this script:
//   1. blanks the supplier labels ("Product Code - ...", "Print Size- 15cm") with white,
//   2. cuts out the front and back, trims the white margin, centres each on a square canvas,
//   3. writes <key>-front.webp / <key>-back.webp (800x800) and one <key>-og.jpg (1200x630, both views side by side).
// Re-run after changing a source image or the table below:  pnpm images:products
import { mkdirSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp from 'sharp';

const SOURCE = 'assets/images';
const OUT = 'src/assets/products';
const SIZE = 800;
const MARGIN = 0.07; // white space kept around each garment, as a share of the square

// `file`: unique ending of the source filename. `views`: 'two-up' = front left / back right; otherwise a single crop (x range as shares of the width).
// `blank`: rectangles painted white first, as shares of the image (x, y, w, h). They cover supplier labels only.
const IMAGES = [
  { key: 'tshirt-white', file: '39 (2).jpeg', views: 'two-up', blank: [[0, 0, 0.36, 0.18], [0.84, 0, 0.16, 0.1]] },
  { key: 'tshirt-black', file: '41.jpeg', views: 'two-up', blank: [[0, 0, 0.36, 0.18], [0.84, 0, 0.16, 0.1]] },
  { key: 'longsleeve-white', file: '40.jpeg', views: 'two-up', blank: [[0, 0, 0.36, 0.18], [0.84, 0, 0.16, 0.1]] },
  { key: 'crop-tank-green', file: '40 (3).jpeg', views: 'two-up', blank: [[0, 0, 0.36, 0.18], [0.84, 0, 0.16, 0.1]] },
  { key: 'hoodie-grey', file: '40 (4).jpeg', views: 'two-up', blank: [[0, 0, 0.17, 0.13], [0, 0.86, 1, 0.14], [0.84, 0, 0.16, 0.1]] },
  { key: 'hoodie-blue', file: '41 (1).jpeg', views: 'two-up', blank: [[0, 0, 0.17, 0.13], [0, 0.86, 1, 0.14], [0.84, 0, 0.16, 0.1]] },
  { key: 'cap-black', file: '39 (1).jpeg', views: { front: [0, 0.68] }, removeBlue: true, blank: [[0, 0, 0.22, 0.14]] },
  { key: 'cap-green', file: '40 (2).jpeg', views: { front: [0, 0.68] }, removeBlue: true, blank: [[0, 0, 0.22, 0.14]] },
  { key: 'half-zip-black', file: '40 (1).jpeg', views: { front: [0, 1] }, blank: [[0, 0, 0.32, 0.16]] },
];

mkdirSync(OUT, { recursive: true });
const files = readdirSync(SOURCE).filter((name) => name.toLowerCase().endsWith('.jpeg') || name.toLowerCase().endsWith('.jpg'));

/** Matches `...23.30.39 (2).jpeg` but not `...23.30.39.jpeg` for the suffix `39 (2).jpeg`: the suffix must start right after "30." */
const find = (suffix) => {
  const matches = files.filter((name) => name.endsWith(`23.30.${suffix}`));
  if (matches.length !== 1) throw new Error(`Expected exactly one source ending "${suffix}", found ${matches.length}`);
  return join(SOURCE, matches[0]);
};

/** Paints strongly blue pixels white. The cap mock-ups include a model in a blue cap whose edge touches the product crop. */
async function whiteOutBlue(buffer) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (b > r + 14 && b > g + 4 && b > 40) data[i] = data[i + 1] = data[i + 2] = 255;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toBuffer();
}

/** A white square holding the trimmed garment, centred, with margin. */
async function squareView(buffer) {
  const trimmed = await sharp(buffer).trim({ background: '#ffffff', threshold: 28 }).toBuffer({ resolveWithObject: true });
  const { width, height } = trimmed.info;
  const inner = Math.round(SIZE * (1 - MARGIN * 2));
  const scale = Math.min(inner / width, inner / height);
  const resized = await sharp(trimmed.data).resize(Math.round(width * scale), Math.round(height * scale)).toBuffer();
  // Rendered to a buffer here so later resizes act on the finished square, not on a pending composite.
  return sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: '#ffffff' } }).composite([{ input: resized, gravity: 'centre' }]).png().toBuffer();
}

for (const entry of IMAGES) {
  const path = find(entry.file);
  const meta = await sharp(path).metadata();
  const { width, height } = meta;
  // 1. blank the supplier labels
  const overlays = entry.blank.map(([x, y, w, h]) => {
    const left = Math.floor(width * x);
    const top = Math.floor(height * y);
    // Clamp so rounding can never push a patch past the image edge.
    return { input: { create: { width: Math.min(Math.round(width * w), width - left), height: Math.min(Math.round(height * h), height - top), channels: 3, background: '#ffffff' } }, left, top };
  });
  const cleaned = await sharp(path).composite(overlays).toBuffer();

  // 2. cut the views
  const ranges = entry.views === 'two-up' ? { front: [0, 0.5], back: [0.5, 1] } : entry.views;
  const written = [];
  for (const [view, [from, to]] of Object.entries(ranges)) {
    const crop = await sharp(cleaned).extract({ left: Math.round(width * from), top: 0, width: Math.round(width * (to - from)), height }).toBuffer();
    const square = await squareView(entry.removeBlue ? await whiteOutBlue(crop) : crop);
    await sharp(square).webp({ quality: 82, effort: 6 }).toFile(join(OUT, `${entry.key}-${view}.webp`));
    written.push({ view, buffer: await sharp(square).resize(630, 630).png().toBuffer() });
  }

  // 3. 1200x630 social card: both views side by side (front only when there is no back)
  const cards = written.map((view, index) => ({ input: view.buffer, left: written.length === 1 ? 285 : index * 600, top: 0 }));
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#ffffff' } }).composite(cards).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, `${entry.key}-og.jpg`));
  console.log(`${basename(path).slice(-22).padEnd(22)} -> ${entry.key} (${written.map((view) => view.view).join(' + ')})`);
}
