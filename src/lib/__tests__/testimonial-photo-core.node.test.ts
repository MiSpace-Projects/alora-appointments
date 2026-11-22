import sharp from 'sharp';
import { PhotoRejectedError, preparePhoto, PHOTO_MAX_EDGE } from '@/lib/testimonial-photo-core';

async function photo(width: number, height: number, withLocation = false): Promise<Buffer> {
  const image = sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 170, b: 150 } },
  }).jpeg();
  if (withLocation) {
    image.withExif({
      IFD0: { Make: 'TestPhone', ImageDescription: 'GPS -28.2300 28.3100' },
      IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '28/1 13/1 48/1' },
    });
  }
  return image.toBuffer();
}

describe('preparePhoto', () => {
  it('shrinks large photos to the maximum edge and keeps the aspect ratio', async () => {
    const result = await preparePhoto(await photo(3200, 2400));
    expect(result.width).toBe(PHOTO_MAX_EDGE);
    expect(result.height).toBe(1200);
    expect((await sharp(result.data).metadata()).format).toBe('jpeg');
  });

  it('never enlarges small photos', async () => {
    const result = await preparePhoto(await photo(800, 600));
    expect([result.width, result.height]).toEqual([800, 600]);
  });

  it('removes camera and location metadata', async () => {
    const input = await photo(1000, 800, true);
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const result = await preparePhoto(input);
    const metadata = await sharp(result.data).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(result.data.includes(Buffer.from('TestPhone'))).toBe(false);
  });

  it('rejects files that are not photos', async () => {
    await expect(preparePhoto(Buffer.from('not an image at all'))).rejects.toBeInstanceOf(
      PhotoRejectedError,
    );
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>');
    await expect(preparePhoto(svg)).rejects.toThrow('Use a JPEG, PNG or WebP photo.');
  });

  it('rejects empty and oversized uploads', async () => {
    await expect(preparePhoto(Buffer.alloc(0))).rejects.toThrow('The file is empty.');
    await expect(preparePhoto(Buffer.alloc(4 * 1024 * 1024))).rejects.toThrow('too large');
  });
});
