import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { GalleryMediaType } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { GALLERY_CLOUDINARY_FOLDER } from '../constants/gallery.constants';
import type {
  GalleryCloudinaryUploadResult,
  PreparedGalleryMulterFile,
} from '../types/gallery.types';
import {
  isLikelyRasterImageByMagic,
  tryNormalizeGalleryImage,
} from '../utils/gallery-image-normalize.util';

@Injectable()
export class GalleryMediaService {
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

  ensureMediaFile(mediaFile?: Express.Multer.File) {
    if (!mediaFile?.buffer) {
      throw new BadRequestException('Media file is required.');
    }
    const mime = (mediaFile.mimetype ?? '').toLowerCase();
    const isVideo = mime.startsWith('video/');
    const isImage = mime.startsWith('image/');
    const isOctet = mime === 'application/octet-stream';
    if (isVideo || isImage) {
      return;
    }
    if (isOctet && isLikelyRasterImageByMagic(mediaFile.buffer)) {
      return;
    }
    throw new BadRequestException(
      'Only image and video files are allowed. Unrecognized type: try JPEG/PNG/WebP, or ensure the file is not corrupted.',
    );
  }

  /**
   * Normalizes raster images when possible (JPEG for Cloudinary); videos pass through unchanged.
   */
  async prepareMulterFileForCloudinary(
    file: Express.Multer.File,
  ): Promise<PreparedGalleryMulterFile> {
    const mime = (file.mimetype ?? '').toLowerCase();
    if (mime.startsWith('video/')) {
      return {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      };
    }
    const normalized = await tryNormalizeGalleryImage(file.buffer);
    if (normalized) {
      const base = file.originalname.replace(/\.[^/.]+$/, '') || 'upload';
      return {
        buffer: normalized,
        mimetype: 'image/jpeg',
        originalname: `${base}.jpg`,
      };
    }
    if (mime.startsWith('image/')) {
      return {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      };
    }
    return {
      buffer: file.buffer,
      mimetype: 'image/jpeg',
      originalname: file.originalname,
    };
  }

  uploadMediaToCloudinary(
    prepared: PreparedGalleryMulterFile,
    folder: string = GALLERY_CLOUDINARY_FOLDER,
  ): Promise<GalleryCloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const mime = (prepared.mimetype ?? '').toLowerCase();
      const isVideo = mime.startsWith('video/');
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isVideo ? 'video' : 'image',
        },
        (error, result) => {
          if (error || !result?.secure_url || !result.public_id) {
            const detail =
              error &&
              typeof (error as { message?: string }).message === 'string'
                ? (error as { message: string }).message
                : 'Unknown error';
            reject(
              new BadRequestException(
                `Media upload failed (Cloudinary): ${detail}`,
              ),
            );
            return;
          }
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            mediaType: isVideo
              ? GalleryMediaType.VIDEO
              : GalleryMediaType.IMAGE,
          });
        },
      );

      uploadStream.end(prepared.buffer);
    });
  }

  async deleteMediaFromCloudinary(
    publicId: string,
    mediaType: GalleryMediaType,
  ) {
    const destroyResult = (await cloudinary.uploader.destroy(publicId, {
      resource_type: mediaType === GalleryMediaType.VIDEO ? 'video' : 'image',
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
