import {
  buildAboutHeroVideoDeliveryUrl,
  buildAboutHeroVideoPosterUrl,
  videoDeliveryUrlsFromUpload,
} from './about-video-delivery.util';

describe('about-video-delivery.util', () => {
  const base =
    'https://res.cloudinary.com/demo/video/upload/v1/shamell/about/hero.mp4';

  it('returns null for empty delivery/poster inputs', () => {
    expect(buildAboutHeroVideoDeliveryUrl(null)).toBeNull();
    expect(buildAboutHeroVideoDeliveryUrl('')).toBeNull();
    expect(buildAboutHeroVideoPosterUrl(undefined)).toBeNull();
  });

  it('injects stream transform into Cloudinary video upload URLs', () => {
    const url = buildAboutHeroVideoDeliveryUrl(base);
    expect(url).toContain('/video/upload/');
    expect(url).toContain('q_auto:eco');
    expect(url).toContain('w_720');
  });

  it('builds poster URL and swaps extension to jpg', () => {
    const poster = buildAboutHeroVideoPosterUrl(base);
    expect(poster).toContain('so_0');
    expect(poster).toMatch(/\.jpg$/);
  });

  it('does not double-inject transforms', () => {
    const once = buildAboutHeroVideoDeliveryUrl(base)!;
    const twice = buildAboutHeroVideoDeliveryUrl(once);
    expect(twice).toBe(once);
  });

  it('prefers eager URLs from upload result', () => {
    const result = videoDeliveryUrlsFromUpload({
      secure_url: base,
      eager: [
        { secure_url: 'https://cdn.example/stream.mp4' },
        { secure_url: 'https://cdn.example/poster.jpg' },
      ],
    });
    expect(result.videoDeliveryUrl).toBe('https://cdn.example/stream.mp4');
    expect(result.videoPosterUrl).toBe('https://cdn.example/poster.jpg');
  });
});
