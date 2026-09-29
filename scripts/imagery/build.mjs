import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const cache = path.join(root, '.imagery-cache');
const manifest = JSON.parse(readFileSync(path.join(root, 'scripts/imagery/manifest.json'), 'utf8'));
const { width: W, height: H } = manifest.canvas;
const outDir = path.join(root, manifest.outputDir);
const mapFile = path.join(root, manifest.mapFile);
const publicBase = '/' + path.relative(path.join(root, 'public'), outDir).split(path.sep).join('/');
const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);
mkdirSync(cache, { recursive: true });
mkdirSync(outDir, { recursive: true });

const segmentBin = path.join(cache, 'segment');
if (!existsSync(segmentBin)) {
  execFileSync(
    'swiftc',
    ['-O', path.join(root, 'scripts/imagery/segment.swift'), '-o', segmentBin],
    { stdio: 'inherit' },
  );
}

const remote = {
  pexels: (id) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=4000`,
  unsplash: (id) => `https://images.unsplash.com/${id}?w=4000&q=90&fm=jpg`,
};

async function resolveSource(source) {
  const [provider, id] = source.split(':');
  if (!remote[provider]) return path.resolve(root, source);
  const file = path.join(cache, `${provider}-${id}.jpg`);
  for (let attempt = 1; !existsSync(file); attempt++) {
    try {
      const response = await fetch(remote[provider](id));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      if (attempt >= 4) throw new Error(`download failed for ${source}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
    }
  }
  return file;
}

function segment(file, mode) {
  const mask = file.replace(/\.[a-z]+$/i, `.${mode}.png`);
  const faceFile = file.replace(/\.[a-z]+$/i, `.${mode}.face.json`);
  if (!existsSync(mask) || !existsSync(faceFile)) {
    const box = execFileSync(segmentBin, [file, mask, mode], { encoding: 'utf8' }).trim();
    writeFileSync(faceFile, box);
  }
  const box = readFileSync(faceFile, 'utf8').trim();
  return { mask, face: box === 'null' ? null : JSON.parse(box) };
}

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
    if (list.length === 0) return 128;
    list.sort((a, b) => a - b);
    return list[list.length >> 1];
  });
}

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

function subjectBox(alpha, w, h) {
  let x0 = w,
    y0 = h,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] < 128) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function placement(entry, face, alpha, w, h) {
  const framing = manifest.framing[entry.framing ?? 'portrait'];
  if (framing.subject || !face) {
    const box = subjectBox(alpha, w, h);
    const scale = Math.min(
      ((framing.maxWidth ?? 0.9) * W) / box.w,
      ((framing.maxHeight ?? 0.78) * H) / box.h,
    );
    return {
      scale,
      offsetX: Math.round(W / 2 - (box.x + box.w / 2) * scale),
      offsetY: Math.round((framing.bottom ?? 0.96) * H - (box.y + box.h) * scale),
    };
  }
  const scale = ((entry.face ?? framing.face) * H) / face.h;
  return {
    scale,
    offsetX: Math.round(W / 2 - (face.x + face.w / 2) * scale),
    offsetY: Math.round((entry.faceTop ?? framing.faceTop) * H - face.y * scale),
  };
}

async function cropped(file, crop) {
  if (!crop) return file;
  const key = [crop.left, crop.top, crop.width, crop.height].join('-');
  const out = file.replace(/\.[a-z]+$/i, `.crop-${key}.jpg`);
  if (!existsSync(out)) {
    const { width, height } = await sharp(file).rotate().metadata();
    await sharp(file)
      .rotate()
      .extract({
        left: Math.round(crop.left * width),
        top: Math.round(crop.top * height),
        width: Math.round(crop.width * width),
        height: Math.round(crop.height * height),
      })
      .jpeg({ quality: 95 })
      .toFile(out);
  }
  return out;
}

async function compose(source, entry) {
  const file = await cropped(source, entry.crop);
  const mode = entry.mode ?? 'person';
  const { mask, face } = segment(file, mode);
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

  const { scale, offsetX, offsetY } = placement(entry, face, alpha, w, h);
  if (scale > 1.25) console.warn(`  ${entry.slug}: upscaled x${scale.toFixed(2)}, source is small`);
  const scaledW = Math.round(w * scale);
  const scaledH = Math.round(h * scale);
  const scaled = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .resize(scaledW, scaledH, { kernel: 'lanczos3' })
    .raw()
    .toBuffer();

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

  const webp = await sharp(canvas, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toBuffer();
  const name = `${entry.slug}-${createHash('sha1').update(webp).digest('hex').slice(0, 8)}.webp`;
  for (const old of readdirSync(outDir)) {
    if (
      old === `${entry.slug}.webp` ||
      new RegExp(`^${entry.slug}-[0-9a-f]{8}\\.webp$`).test(old)
    ) {
      unlinkSync(path.join(outDir, old));
    }
  }
  writeFileSync(path.join(outDir, name), webp);
  return { slug: entry.slug, file: path.join(outDir, name), url: `${publicBase}/${name}` };
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

const images = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, 'utf8')) : {};
for (const entry of manifest.entries) {
  if (only && !entry.slug.startsWith(only)) continue;
  const result = await compose(await resolveSource(entry.source), entry);
  images[entry.slug] = result.url;
  console.log(`built ${entry.slug} -> ${result.url}`);
}
const ordered = Object.fromEntries(
  manifest.entries
    .filter((entry) => images[entry.slug])
    .map((entry) => [entry.slug, images[entry.slug]]),
);
writeFileSync(mapFile, JSON.stringify(ordered, null, 2) + '\n');
if (process.argv.includes('--sheet')) {
  const files = Object.values(ordered).map((url) => path.join(root, 'public', url));
  console.log(await contactSheet(files.filter(existsSync), '#141312', 'contact-dark.jpg'));
  console.log(await contactSheet(files.filter(existsSync), '#f4f1ec', 'contact-light.jpg'));
}
