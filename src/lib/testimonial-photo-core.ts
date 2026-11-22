import sharp from 'sharp';

export const PHOTO_MAX_INPUT_BYTES = 3.8 * 1024 * 1024;
export const PHOTO_MAX_EDGE = 1600;
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif']);

export class PhotoRejectedError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = 'PhotoRejectedError';
  }
}

export interface PreparedPhoto {
  data: Buffer;
  width: number;
  height: number;
}

export async function preparePhoto(input: Buffer): Promise<PreparedPhoto> {
  if (input.byteLength === 0) throw new PhotoRejectedError('The file is empty.');
  if (input.byteLength > PHOTO_MAX_INPUT_BYTES) {
    throw new PhotoRejectedError('The photo is too large. Try a smaller one.');
  }

  let format: string | undefined;
  try {
    format = (await sharp(input, { limitInputPixels: 50_000_000 }).metadata()).format;
  } catch {
    throw new PhotoRejectedError('That file is not a photo we can read.');
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) {
    throw new PhotoRejectedError('Use a JPEG, PNG or WebP photo.');
  }

  try {
    const { data, info } = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({
        width: PHOTO_MAX_EDGE,
        height: PHOTO_MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw new PhotoRejectedError('That photo could not be processed. Try a JPEG.');
  }
}
