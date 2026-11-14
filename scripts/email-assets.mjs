import { mkdirSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'public/email');
const serviceDir = path.join(outDir, 'services');
const HERO_BACKGROUND = '#0e0c0b';

mkdirSync(serviceDir, { recursive: true });

const logo = readFileSync(
  path.join(root, 'public/brand/alora-studios-logo.svg'),
  'utf8',
).replaceAll('#050505', '#EDE6DC');
await sharp(Buffer.from(logo), { density: 300 })
  .resize({ height: 156 })
  .png({ compressionLevel: 9 })
  .toFile(path.join(outDir, 'alora-logo.png'));
console.log('built public/email/alora-logo.png');

const images = JSON.parse(readFileSync(path.join(root, 'prisma/service-images.json'), 'utf8'));
const wanted = new Set(Object.keys(images).map((slug) => `${slug}.jpg`));
for (const file of readdirSync(serviceDir)) {
  if (!wanted.has(file)) unlinkSync(path.join(serviceDir, file));
}
for (const [slug, url] of Object.entries(images)) {
  const source = path.join(root, 'public', url);
  const portrait = await sharp(source).resize({ width: 440, height: 648, fit: 'cover' }).toBuffer();
  await sharp({ create: { width: 440, height: 648, channels: 3, background: HERO_BACKGROUND } })
    .composite([{ input: portrait }])
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(serviceDir, `${slug}.jpg`));
}
console.log(`built ${Object.keys(images).length} service images in public/email/services`);
