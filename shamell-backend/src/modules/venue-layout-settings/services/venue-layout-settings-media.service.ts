import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { VENUE_LAYOUT_CLOUDINARY_FOLDER } from '../constants/venue-layout-settings.constants';

@Injectable()
export class VenueLayoutSettingsMediaService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  ensureCloudinaryEnv() {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are missing.',
      );
    }
  }

  ensurePromoImageFile(mediaFile?: Express.Multer.File) {
    if (!mediaFile?.buffer) {
      throw new BadRequestException('Media file is required.');
    }
    if (!mediaFile.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }
  }

  uploadImage(
    file: Express.Multer.File,
  ): Promise<{ secureUrl: string; publicId: string }> {
    this.ensurePromoImageFile(file);
    this.ensureCloudinaryEnv();
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: VENUE_LAYOUT_CLOUDINARY_FOLDER,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result?.secure_url || !result.public_id) {
            reject(new InternalServerErrorException('Image upload failed.'));
            return;
          }
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string) {
    this.ensureCloudinaryEnv();
    const destroyResult = (await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    })) as { result?: string };
    const ok =
      destroyResult.result === 'ok' || destroyResult.result === 'not found';
    if (!ok) {
      throw new InternalServerErrorException(
        'Cloudinary image deletion failed.',
      );
    }
  }
}
