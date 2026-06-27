import {
  cloudinaryDeliveryUrl,
  imageUrl,
  mediaDeliveryUrl,
  videoUrl,
} from './cloudinary-delivery.util';

describe('cloudinary-delivery.util', () => {
  const imgUrl = 'https://res.cloudinary.com/demo/image/upload/v123/sample.jpg';
  const vidUrl = 'https://res.cloudinary.com/demo/video/upload/v123/clip.mp4';

  describe('cloudinaryDeliveryUrl (legacy wrapper)', () => {
    it('adds transforms to cloudinary upload URLs', () => {
      const out = cloudinaryDeliveryUrl(imgUrl, { width: 800 });
      expect(out).toContain('f_auto');
      expect(out).toContain('w_800');
    });

    it('returns non-cloudinary URLs unchanged', () => {
      expect(cloudinaryDeliveryUrl('https://example.com/a.jpg')).toBe(
        'https://example.com/a.jpg',
      );
    });
  });

  describe('imageUrl presets', () => {
    it('applies the hero preset width', () => {
      expect(imageUrl(imgUrl, 'hero')).toContain('w_1920');
    });

    it('applies the heroMobile preset width', () => {
      const out = imageUrl(imgUrl, 'heroMobile');
      expect(out).toContain('f_auto');
      expect(out).toContain('w_960');
    });

    it('applies the portrait preset width', () => {
      const out = imageUrl(imgUrl, 'portrait');
      expect(out).toContain('f_auto');
      expect(out).toContain('w_540');
    });

    it('returns null for empty input', () => {
      expect(imageUrl(null, 'card')).toBeNull();
      expect(imageUrl('', 'card')).toBeNull();
    });
  });

  describe('videoUrl variants', () => {
    it('builds an h264 stream', () => {
      const out = videoUrl(vidUrl, 'stream720');
      expect(out).toContain('vc_h264');
      expect(out).toContain('w_720');
    });

    it('builds a poster jpg from a video url', () => {
      const out = videoUrl(vidUrl, 'poster720');
      expect(out).toContain('so_0');
      expect(out).toMatch(/\.jpg$/);
    });
  });

  describe('mediaDeliveryUrl', () => {
    it('uses the image preset when not a video', () => {
      expect(mediaDeliveryUrl(imgUrl, false, 'card', 'stream720')).toContain(
        'w_800',
      );
    });

    it('uses the video variant when a video', () => {
      expect(mediaDeliveryUrl(vidUrl, true, 'card', 'stream720')).toContain(
        'vc_h264',
      );
    });
  });

  describe('idempotency', () => {
    it('does not double-inject when a transform already exists', () => {
      const once = imageUrl(imgUrl, 'card')!;
      const twice = imageUrl(once, 'card')!;
      expect(twice).toBe(once);
    });
  });
});
