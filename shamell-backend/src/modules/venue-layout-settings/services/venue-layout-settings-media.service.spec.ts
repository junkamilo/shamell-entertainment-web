import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { makePromoMulterFile } from '../__mocks__/venue-layout-settings.fixtures';
import { VenueLayoutSettingsMediaService } from './venue-layout-settings-media.service';

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

describe('VenueLayoutSettingsMediaService', () => {
  let service: VenueLayoutSettingsMediaService;
  const prevEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    service = new VenueLayoutSettingsMediaService();
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

  it('ensurePromoImageFile rejects non-images', () => {
    expect(() =>
      service.ensurePromoImageFile(
        makePromoMulterFile({ mimetype: 'application/pdf' }),
      ),
    ).toThrow(BadRequestException);
  });

  it('uploadImage streams buffer to Cloudinary', async () => {
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (_opts: unknown, cb: (err: null, result: object) => void) => {
        return {
          end: () =>
            cb(null, {
              secure_url: 'https://cdn.example/up.jpg',
              public_id: 'shamell/on-coming-events/up',
            }),
        };
      },
    );
    await expect(service.uploadImage(makePromoMulterFile())).resolves.toEqual({
      secureUrl: 'https://cdn.example/up.jpg',
      publicId: 'shamell/on-coming-events/up',
    });
  });

  it('deleteImage accepts not found', async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
      result: 'not found',
    });
    await expect(service.deleteImage('pid')).resolves.toBeUndefined();
  });
});
