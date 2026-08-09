import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { SERVICES_CLOUDINARY_FOLDER } from '../constants/services.constants';

@Injectable()
export class ServicesMediaService {
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

  uploadServiceMediaToCloudinary(file: Express.Multer.File): Promise<string> {
    this.ensureCloudinaryEnv();
    const isVideo = file.mimetype.startsWith('video/');
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: SERVICES_CLOUDINARY_FOLDER,
          resource_type: isVideo ? 'video' : 'image',
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(
              new InternalServerErrorException(
                `${isVideo ? 'Video' : 'Image'} upload failed.`,
              ),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImageFromCloudinaryByUrl(imageUrl: string) {
    const publicId = this.extractCloudinaryPublicIdFromUrl(imageUrl);
    if (!publicId) {
      throw new InternalServerErrorException(
        'Cannot resolve Cloudinary media identifier.',
      );
    }

    const resourceType = imageUrl.toLowerCase().includes('/video/upload/')
      ? 'video'
      : 'image';

    const destroyResult = (await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })) as { result?: string };
    const ok =
      destroyResult.result === 'ok' || destroyResult.result === 'not found';
    if (!ok) {
      throw new InternalServerErrorException(
        'Cloudinary media deletion failed.',
      );
    }
  }

  extractCloudinaryPublicIdFromUrl(imageUrl: string): string | null {
    const uploadIndex = imageUrl.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const afterUpload = imageUrl.slice(uploadIndex + '/upload/'.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const withoutQuery = withoutVersion.split('?')[0];
    const dotIndex = withoutQuery.lastIndexOf('.');
    if (dotIndex === -1) return withoutQuery;

    return withoutQuery.slice(0, dotIndex);
  }
}
