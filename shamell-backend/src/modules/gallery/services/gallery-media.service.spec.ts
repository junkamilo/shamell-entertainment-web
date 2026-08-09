import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GalleryMediaType } from '@prisma/client';
import { makeMulterFile } from '../__mocks__/gallery.fixtures';
import { GalleryMediaService } from './gallery-media.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

import { v2 as cloudinary } from 'cloudinary';

describe('GalleryMediaService', () => {
  let service: GalleryMediaService;
  const prevEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    service = new GalleryMediaService();
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

  it('ensureMediaFile rejects missing buffer', () => {
    expect(() =>
      service.ensureMediaFile({
        mimetype: 'image/jpeg',
      } as Express.Multer.File),
    ).toThrow(BadRequestException);
  });

  it('ensureMediaFile accepts jpeg and octet raster', () => {
    expect(() => service.ensureMediaFile(makeMulterFile())).not.toThrow();
    const jpegMagic = Buffer.alloc(12, 0);
    jpegMagic[0] = 0xff;
    jpegMagic[1] = 0xd8;
    jpegMagic[2] = 0xff;
    expect(() =>
      service.ensureMediaFile(
        makeMulterFile({
          mimetype: 'application/octet-stream',
          buffer: jpegMagic,
        }),
      ),
    ).not.toThrow();
  });

  it('ensureMediaFile rejects pdf', () => {
    expect(() =>
      service.ensureMediaFile(
        makeMulterFile({
          mimetype: 'application/pdf',
          buffer: Buffer.alloc(20),
        }),
      ),
    ).toThrow(BadRequestException);
  });

  it('uploadMediaToCloudinary uploads image buffers', async () => {
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: unknown, cb: (err: null, result: object) => void) => {
        const stream = {
          end: () =>
            cb(null, {
              secure_url: 'https://cdn.example/up.jpg',
              public_id: 'shamell/gallery/up',
            }),
        };
        return stream;
      },
    );

    const result = await service.uploadMediaToCloudinary({
      buffer: Buffer.from('x'),
      mimetype: 'image/jpeg',
      originalname: 'x.jpg',
    });
    expect(result.secureUrl).toBe('https://cdn.example/up.jpg');
    expect(result.mediaType).toBe(GalleryMediaType.IMAGE);
  });

  it('deleteMediaFromCloudinary accepts ok/not found', async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
      result: 'ok',
    });
    await expect(
      service.deleteMediaFromCloudinary(
        'shamell/gallery/x',
        GalleryMediaType.IMAGE,
      ),
    ).resolves.toBeUndefined();
  });

  it('deleteMediaFromCloudinary throws on failure', async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
      result: 'error',
    });
    await expect(
      service.deleteMediaFromCloudinary(
        'shamell/gallery/x',
        GalleryMediaType.IMAGE,
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
