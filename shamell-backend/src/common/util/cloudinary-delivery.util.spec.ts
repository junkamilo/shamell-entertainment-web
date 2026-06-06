import { cloudinaryDeliveryUrl } from './cloudinary-delivery.util';

describe('cloudinary-delivery.util', () => {
  it('adds transforms to cloudinary upload URLs', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/sample.jpg';
    const out = cloudinaryDeliveryUrl(url, { width: 800 });
    expect(out).toContain('f_auto');
    expect(out).toContain('w_800');
  });

  it('returns non-cloudinary URLs unchanged', () => {
    expect(cloudinaryDeliveryUrl('https://example.com/a.jpg')).toBe(
      'https://example.com/a.jpg',
    );
  });
});
