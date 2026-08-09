import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AboutMediaService } from './about-media.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      upload_large: jest.fn(),
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

import { v2 as cloudinary } from 'cloudinary';
import { makeMulterFile } from '../__mocks__/about.fixtures';

describe('AboutMediaService', () => {
  let service: AboutMediaService;
  const prevEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    service = new AboutMediaService();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it('ensureCloudinaryEnv throws when env missing', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    expect(() => service.ensureCloudinaryEnv()).toThrow(
      InternalServerErrorException,
    );
  });

  it('ensureHeroMediaFile rejects non media mimetypes', () => {
    expect(() =>
      service.ensureHeroMediaFile(
        makeMulterFile({ mimetype: 'application/pdf' }),
      ),
    ).toThrow(BadRequestException);
  });

  it('uploadHeroMedia uploads buffer images', async () => {
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: unknown, cb: (err: null, result: object) => void) => {
        const stream = {
          end: () =>
            cb(null, {
              secure_url: 'https://cdn.example/up.jpg',
              public_id: 'shamell/about/up',
            }),
        };
        return stream;
      },
    );

    const result = await service.uploadHeroMedia(makeMulterFile());
    expect(result.secureUrl).toBe('https://cdn.example/up.jpg');
    expect(result.mediaType).toBe('IMAGE');
    expect(result.videoDeliveryUrl).toBeNull();
  });

  it('deleteHeroFromCloudinary accepts ok/not found', async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
      result: 'ok',
    });
    await expect(
      service.deleteHeroFromCloudinary('shamell/about/x', 'IMAGE'),
    ).resolves.toBeUndefined();
  });

  it('deleteHeroFromCloudinary throws on failure', async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
      result: 'error',
    });
    await expect(
      service.deleteHeroFromCloudinary('shamell/about/x', 'IMAGE'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
