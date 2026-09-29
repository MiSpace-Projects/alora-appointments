// Builds every service image from scripts/imagery/manifest.json with one identical treatment,
// so the whole menu reads as a single series (same light, face size, eye line and fade).
//
//   node scripts/imagery/build.mjs            build all
//   node scripts/imagery/build.mjs --sheet    also write a contact sheet to .imagery-cache/
//
// A manifest source is either "pexels:<id>" (downloaded once into .imagery-cache/) or a path
// to a local photo, e.g. the salon's own work. Needs macOS: the matte and face box come from
// Apple Vision via segment.swift, compiled on first run.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const cache = path.join(root, '.imagery-cache');
const manifest = JSON.parse(readFileSync(path.join(root, 'scripts/imagery/manifest.json'), 'utf8'));
const { width: W, height: H } = manifest.canvas;
const outDir = path.join(root, manifest.outputDir);
mkdirSync(cache, { recursive: true });
mkdirSync(outDir, { recursive: true });

const segmentBin = path.join(cache, 'segment');
if (!existsSync(segmentBin)) {
  execFileSync(
    'swiftc',
    ['-O', path.join(root, 'scripts/imagery/segment.swift'), '-o', segmentBin],
    {
      stdio: 'inherit',
    },
  );
}

async function resolveSource(source) {
  if (!source.startsWith('pexels:')) return path.resolve(root, source);
  const id = source.slice('pexels:'.length);
  const file = path.join(cache, `pexels-${id}.jpg`);
  if (!existsSync(file)) {
    const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=3200`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`download failed for ${source}: ${response.status}`);
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  return file;
}

function segment(file) {
  const mask = file.replace(/\.[a-z]+$/i, '.mask.png');
  const box = execFileSync(segmentBin, [file, mask], { encoding: 'utf8' }).trim();
  if (box === 'null') throw new Error(`no face found in ${file}`);
  return { mask, face: JSON.parse(box) };
}

// Median colour of the four corner patches where the matte says "background".
function backdropColour(rgb, alpha, w, h) {
  const samples = [[], [], []];
  const patch = Math.round(Math.min(w, h) * 0.06);
  for (const [x0, y0] of [
    [0, 0],
    [w - patch, 0],
    [0, h - patch],
    [w - patch, h - patch],
  ]) {
    for (let y = y0; y < y0 + patch; y++) {
      for (let x = x0; x < x0 + patch; x++) {
        const n = y * w + x;
        if (alpha[n] > 10) continue;
        for (let c = 0; c < 3; c++) samples[c].push(rgb[n * 3 + c]);
      }
    }
  }
  return samples.map((list) => {
    if (list.length === 0) return 245;
    list.sort((a, b) => a - b);
    return list[list.length >> 1];
  });
}

// Keep only the largest solid shape in the matte, dropping stray props (a chair back, a
// stand) that the person matte sometimes includes.
function keepLargest(alpha, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const sizes = [];
  const stack = [];
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1 || alpha[start] < 128) continue;
    const id = sizes.length;
    let size = 0;
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % w;
      const neighbours = [p - w, p + w, x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1];
      for (const q of neighbours) {
        if (q < 0 || q >= w * h || label[q] !== -1 || alpha[q] < 128) continue;
        label[q] = id;
        stack.push(q);
      }
    }
    sizes.push(size);
  }
  const keep = sizes.indexOf(Math.max(...sizes));
  for (let n = 0; n < w * h; n++) if (label[n] !== -1 && label[n] !== keep) alpha[n] = 0;
  return alpha;
}

async function compose(file, entry) {
  const { mask, face } = segment(file);
  const { data: rgb, info } = await sharp(file)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const alpha = keepLargest(
    await sharp(mask).resize(w, h, { fit: 'fill' }).extractChannel(0).raw().toBuffer(),
    w,
    h,
  );
  const bg = backdropColour(rgb, alpha, w, h);

  // Tighten the matte slightly, then un-mix the backdrop from semi-transparent edge pixels
  // (c = a*fg + (1-a)*bg) so hair keeps no white halo against the dark site.
  const rgba = Buffer.alloc(w * h * 4);
  for (let n = 0; n < w * h; n++) {
    const a = Math.min(
      1,
      Math.max(0, (alpha[n] / 255 - manifest.matte.floor) / manifest.matte.span),
    );
    for (let c = 0; c < 3; c++) {
      const value = rgb[n * 3 + c];
      rgba[n * 4 + c] =
        a > 0 && a < 1
          ? Math.max(0, Math.min(255, Math.round((value - (1 - a) * bg[c]) / a)))
          : value;
    }
    rgba[n * 4 + 3] = Math.round(a * 255);
  }

  const faceHeight = (entry.face ?? manifest.face) * H;
  const scale = faceHeight / face.h;
  const scaledW = Math.round(w * scale);
  const scaledH = Math.round(h * scale);
  const scaled = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .resize(scaledW, scaledH, { kernel: 'lanczos3' })
    .raw()
    .toBuffer();

  // Place the face centre on the vertical axis and the face top on a fixed line.
  const offsetX = Math.round(W / 2 - (face.x + face.w / 2) * scale);
  const offsetY = Math.round(manifest.faceTop * H - face.y * scale);

  // Fades follow where this photo actually ends, so no frame edge is ever visible: the
  // bottom fade finishes at the photo's bottom (or the canvas), and the sides dissolve
  // inward from whichever is nearer, the canvas edge or the photo edge.
  const photoBottom = Math.min(H, offsetY + scaledH);
  const fadeTo = Math.min(manifest.fade.to * H, photoBottom - 2);
  const fadeFrom = Math.min(manifest.fade.from * H, fadeTo - 0.12 * H);
  const leftEdge = Math.max(0, offsetX);
  const rightEdge = Math.min(W, offsetX + scaledW);
  const sideRamp = manifest.fade.side * W;
  const smooth = (t) => {
    const c = Math.min(1, Math.max(0, t));
    return c * c * (3 - 2 * c);
  };

  const canvas = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const sy = y - offsetY;
    if (sy < 0 || sy >= scaledH) continue;
    const vertical = smooth((fadeTo - y) / (fadeTo - fadeFrom));
    for (let x = 0; x < W; x++) {
      const sx = x - offsetX;
      if (sx < 0 || sx >= scaledW) continue;
      const side = smooth(Math.min(x - leftEdge, rightEdge - 1 - x) / sideRamp);
      const s = (sy * scaledW + sx) * 4;
      const d = (y * W + x) * 4;
      canvas[d] = scaled[s];
      canvas[d + 1] = scaled[s + 1];
      canvas[d + 2] = scaled[s + 2];
      canvas[d + 3] = Math.round(scaled[s + 3] * vertical * side);
    }
  }

  const faceBox = {
    x: Math.round(offsetX + face.x * scale),
    y: Math.round(offsetY + face.y * scale),
    w: Math.round(face.w * scale),
    h: Math.round(face.h * scale),
  };
  return { slug: entry.slug, canvas, faceBox };
}

// Mean colour of the central cheek/nose area of the face (skin, not eyes or lips' edges).
function skinMean({ canvas, faceBox }) {
  const sum = [0, 0, 0];
  let count = 0;
  const x0 = faceBox.x + faceBox.w * 0.3;
  const x1 = faceBox.x + faceBox.w * 0.7;
  const y0 = faceBox.y + faceBox.h * 0.45;
  const y1 = faceBox.y + faceBox.h * 0.62;
  for (let y = Math.round(y0); y < y1; y++) {
    for (let x = Math.round(x0); x < x1; x++) {
      const d = (y * W + x) * 4;
      if (canvas[d + 3] < 250) continue;
      for (let c = 0; c < 3; c++) sum[c] += canvas[d + c];
      count++;
    }
  }
  return sum.map((v) => v / Math.max(1, count));
}

// Nudge every image's skin tone toward the group median: same hue and exposure across the
// set. Gains are capped so a correction can never recolour a photo.
function normaliseTone(images) {
  const means = images.map(skinMean);
  const target = [0, 1, 2].map((c) => {
    const list = means.map((m) => m[c]).sort((a, b) => a - b);
    return list[list.length >> 1];
  });
  const cap = manifest.tone.maxGain;
  images.forEach((image, i) => {
    const gain = target.map((t, c) => Math.min(1 + cap, Math.max(1 - cap, t / means[i][c])));
    const { canvas } = image;
    for (let d = 0; d < canvas.length; d += 4) {
      for (let c = 0; c < 3; c++)
        canvas[d + c] = Math.min(255, Math.round(canvas[d + c] * gain[c]));
    }
    image.gain = gain;
  });
  return target;
}

async function write(image) {
  const out = path.join(outDir, `${image.slug}.webp`);
  await sharp(image.canvas, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toFile(out);
  return out;
}

async function contactSheet(files, background, name) {
  const tile = 300;
  const cols = 6;
  const tileH = Math.round((tile * H) / W);
  const rows = Math.ceil(files.length / cols);
  const layers = await Promise.all(
    files.map(async (file, i) => ({
      input: await sharp(file).resize(tile, tileH).toBuffer(),
      left: (i % cols) * tile,
      top: Math.floor(i / cols) * tileH,
    })),
  );
  const out = path.join(cache, name);
  await sharp({ create: { width: cols * tile, height: rows * tileH, channels: 3, background } })
    .composite(layers)
    .jpeg({ quality: 80 })
    .toFile(out);
  return out;
}

const images = [];
for (const entry of manifest.entries) {
  images.push(await compose(await resolveSource(entry.source), entry));
  console.log(`composed ${entry.slug}`);
}
const target = normaliseTone(images);
console.log(`skin tone target rgb ${target.map((v) => v.toFixed(0)).join(',')}`);
const built = [];
for (const image of images) {
  built.push(await write(image));
  console.log(`wrote ${image.slug} gain ${image.gain.map((g) => g.toFixed(3)).join(',')}`);
}
// Opaque family images for the home cards and family pages: the full studio frame with the
// white backdrop replaced by one shared colour (via the matte), cropped to the same face
// width. Wide-framed shots are used so no photo edge ever lands inside the image.
async function familyImage(family) {
  const { width: fw, height: fh, background, faceWidth } = manifest.familyCanvas;
  const file = await resolveSource(family.source);
  const { mask, face } = segment(file);
  const { data: rgb, info } = await sharp(file)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const alpha = keepLargest(
    await sharp(mask).resize(w, h, { fit: 'fill' }).extractChannel(0).raw().toBuffer(),
    w,
    h,
  );
  const bg = backdropColour(rgb, alpha, w, h);
  const target = [1, 3, 5].map((i) => parseInt(background.slice(i, i + 2), 16));
  const out = Buffer.alloc(w * h * 3);
  for (let n = 0; n < w * h; n++) {
    const a = Math.min(
      1,
      Math.max(0, (alpha[n] / 255 - manifest.matte.floor) / manifest.matte.span),
    );
    for (let c = 0; c < 3; c++) {
      const value = rgb[n * 3 + c];
      const fg = a > 0 && a < 1 ? Math.max(0, Math.min(255, (value - (1 - a) * bg[c]) / a)) : value;
      out[n * 3 + c] = Math.round(a * fg + (1 - a) * target[c]);
    }
  }
  const cropW = Math.min(w, Math.round(face.w / faceWidth));
  const cropH = Math.min(h, Math.round((cropW * fh) / fw));
  const left = Math.round(Math.min(w - cropW, Math.max(0, face.x + face.w / 2 - cropW / 2)));
  const top = Math.round(Math.min(h - cropH, Math.max(0, face.y + face.h * 0.5 - cropH * 0.4)));
  const path_ = path.join(outDir, `family-${family.slug}.webp`);
  await sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .extract({ left, top, width: cropW, height: cropH })
    .resize(fw, fh, { kernel: 'lanczos3' })
    .webp({ quality: 84, effort: 6 })
    .toFile(path_);
  return path_;
}

for (const family of manifest.families ?? []) {
  built.push(await familyImage(family));
  console.log(`wrote family-${family.slug}`);
}

if (process.argv.includes('--sheet')) {
  console.log(await contactSheet(built, '#141312', 'contact-dark.jpg'));
  console.log(await contactSheet(built, '#f4f1ec', 'contact-light.jpg'));
}
