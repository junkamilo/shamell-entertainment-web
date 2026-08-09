import { InternalServerErrorException } from '@nestjs/common';
import { ServicesMediaService } from './services-media.service';

describe('ServicesMediaService', () => {
  const originalEnv = { ...process.env };
  let media: ServicesMediaService;

  beforeEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    media = new ServicesMediaService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('ensureCloudinaryEnv throws when missing', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    expect(() => media.ensureCloudinaryEnv()).toThrow(
      InternalServerErrorException,
    );
  });

  it('extractCloudinaryPublicIdFromUrl parses upload path', () => {
    expect(
      media.extractCloudinaryPublicIdFromUrl(
        'https://res.cloudinary.com/demo/image/upload/v123/shamell/services/hero.jpg',
      ),
    ).toBe('shamell/services/hero');
    expect(
      media.extractCloudinaryPublicIdFromUrl('https://example.com/x'),
    ).toBeNull();
  });
});
