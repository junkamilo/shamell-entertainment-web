import {
  isLikelyRasterImageByMagic,
  tryNormalizeGalleryImage,
} from './gallery-image-normalize.util';

describe('gallery-image-normalize.util', () => {
  it('detects JPEG magic bytes', () => {
    const buf = Buffer.alloc(12, 0);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    buf[2] = 0xff;
    expect(isLikelyRasterImageByMagic(buf)).toBe(true);
  });

  it('detects PNG magic bytes', () => {
    const buf = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    expect(isLikelyRasterImageByMagic(buf)).toBe(true);
  });

  it('rejects short or unknown buffers', () => {
    expect(isLikelyRasterImageByMagic(Buffer.from([1, 2, 3]))).toBe(false);
    expect(isLikelyRasterImageByMagic(Buffer.alloc(12, 0x00))).toBe(false);
  });

  it('tryNormalizeGalleryImage returns null for garbage', async () => {
    await expect(
      tryNormalizeGalleryImage(Buffer.from('not-an-image')),
    ).resolves.toBeNull();
  });
});
