import sharp from 'sharp';

const MAX_DIMENSION = 8192;

/** Detect common raster signatures (used for application/octet-stream uploads). */
export function isLikelyRasterImageByMagic(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return true;
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return true;
  }
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return true;
  return false;
}

/**
 * Try to produce a Cloudinary-friendly JPEG (resize if very large, autorotate).
 * Returns null to keep the original buffer (e.g. unsupported format or sharp failure).
 */
export async function tryNormalizeGalleryImage(
  buffer: Buffer,
): Promise<Buffer | null> {
  try {
    const meta = await sharp(buffer, { failOn: 'none' }).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const longSide = Math.max(w, h);
    let pipeline = sharp(buffer, { failOn: 'none' }).rotate();
    if (longSide > MAX_DIMENSION && longSide > 0) {
      if (w >= h) {
        pipeline = pipeline.resize({
          width: MAX_DIMENSION,
          withoutEnlargement: true,
        });
      } else {
        pipeline = pipeline.resize({
          height: MAX_DIMENSION,
          withoutEnlargement: true,
        });
      }
    }
    return await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  } catch {
    return null;
  }
}
