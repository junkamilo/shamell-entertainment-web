import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { softFailToNull } from '../../../common/http/utils/log-caught-error.util';
import {
  ABOUT_CLOUDINARY_FOLDER,
  ABOUT_VIDEO_UPLOAD_EAGER,
} from '../constants/about.constants';
import { videoDeliveryUrlsFromUpload } from '../utils/about-video-delivery.util';
import type {
  AboutHeroMediaType,
  AboutHeroUploadResult,
} from '../types/about.types';

@Injectable()
export class AboutMediaService {
  private readonly logger = new Logger(AboutMediaService.name);

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

  ensureHeroMediaFile(mediaFile?: Express.Multer.File) {
    if (!mediaFile?.buffer && !mediaFile?.path) {
      throw new BadRequestException('Media file is required.');
    }
    const ok =
      mediaFile.mimetype.startsWith('image/') ||
      mediaFile.mimetype.startsWith('video/');
    if (!ok) {
      throw new BadRequestException('Only image or video files are allowed.');
    }
  }

  async uploadHeroMedia(
    file: Express.Multer.File,
  ): Promise<AboutHeroUploadResult> {
    this.ensureHeroMediaFile(file);
    this.ensureCloudinaryEnv();

    const isVideo = file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';
    const mediaType: AboutHeroMediaType = isVideo ? 'VIDEO' : 'IMAGE';

    try {
      if (file.path) {
        const result = isVideo
          ? await this.uploadVideoLargeFromPath(file.path)
          : await this.uploadFileFromPath(file.path, resourceType);
        return {
          secureUrl: result.secureUrl,
          publicId: result.publicId,
          mediaType,
          videoDeliveryUrl: result.videoDeliveryUrl,
          videoPosterUrl: result.videoPosterUrl,
        };
      }

      if (!file.buffer) {
        throw new BadRequestException('Media file is required.');
      }

      const streamed = await this.uploadBufferToCloudinary(
        file.buffer,
        resourceType,
        isVideo,
      );
      return {
        secureUrl: streamed.secureUrl,
        publicId: streamed.publicId,
        mediaType,
        videoDeliveryUrl: streamed.videoDeliveryUrl,
        videoPosterUrl: streamed.videoPosterUrl,
      };
    } finally {
      if (file.path) {
        await fs
          .unlink(file.path)
          .catch(softFailToNull(this.logger, 'fs.unlink'));
      }
    }
  }

  async deleteHeroFromCloudinary(
    publicId: string,
    mediaType: AboutHeroMediaType,
  ) {
    this.ensureCloudinaryEnv();
    const resourceType = mediaType === 'VIDEO' ? 'video' : 'image';
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

  async warmAboutVideoCdn(
    videoDeliveryUrl: string,
    videoPosterUrl: string,
  ): Promise<void> {
    await Promise.allSettled([
      fetch(videoPosterUrl, { method: 'GET' }),
      fetch(videoDeliveryUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-1' },
      }),
    ]);
  }

  private async uploadFileFromPath(
    filePath: string,
    resourceType: 'image' | 'video',
  ): Promise<{
    secureUrl: string;
    publicId: string;
    videoDeliveryUrl: string | null;
    videoPosterUrl: string | null;
  }> {
    const isVideo = resourceType === 'video';
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: ABOUT_CLOUDINARY_FOLDER,
        resource_type: resourceType,
        ...(isVideo
          ? {
              eager: ABOUT_VIDEO_UPLOAD_EAGER,
              eager_async: false,
            }
          : {}),
      });
      const secureUrl =
        typeof result?.secure_url === 'string' ? result.secure_url : '';
      const publicId =
        typeof result?.public_id === 'string' ? result.public_id : '';
      if (!secureUrl || !publicId) {
        throw new InternalServerErrorException(
          this.cloudinaryUploadErrorMessage(resourceType, null),
        );
      }
      const delivery = isVideo
        ? videoDeliveryUrlsFromUpload(result)
        : { videoDeliveryUrl: null, videoPosterUrl: null };
      return {
        secureUrl,
        publicId,
        ...delivery,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(
        this.cloudinaryUploadErrorMessage(resourceType, error),
      );
    }
  }

  private async uploadVideoLargeFromPath(filePath: string): Promise<{
    secureUrl: string;
    publicId: string;
    videoDeliveryUrl: string | null;
    videoPosterUrl: string | null;
  }> {
    try {
      const result = (await cloudinary.uploader.upload_large(filePath, {
        folder: ABOUT_CLOUDINARY_FOLDER,
        resource_type: 'video',
        chunk_size: 6_000_000,
        eager: ABOUT_VIDEO_UPLOAD_EAGER,
        eager_async: false,
      })) as {
        secure_url?: string;
        public_id?: string;
        eager?: { secure_url?: string }[];
      };
      const secureUrl =
        typeof result?.secure_url === 'string' ? result.secure_url : '';
      const publicId =
        typeof result?.public_id === 'string' ? result.public_id : '';
      if (!secureUrl || !publicId) {
        throw new InternalServerErrorException(
          this.cloudinaryUploadErrorMessage('video', null),
        );
      }
      const delivery = videoDeliveryUrlsFromUpload(result);
      return {
        secureUrl,
        publicId,
        ...delivery,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(
        this.cloudinaryUploadErrorMessage('video', error),
      );
    }
  }

  private uploadBufferToCloudinary(
    buffer: Buffer,
    resourceType: 'image' | 'video',
    isVideo: boolean,
  ): Promise<{
    secureUrl: string;
    publicId: string;
    videoDeliveryUrl: string | null;
    videoPosterUrl: string | null;
  }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: ABOUT_CLOUDINARY_FOLDER,
          resource_type: resourceType,
          ...(isVideo
            ? {
                eager: ABOUT_VIDEO_UPLOAD_EAGER,
                eager_async: false,
              }
            : {}),
        },
        (error, result) => {
          if (error || !result?.secure_url || !result.public_id) {
            reject(
              new InternalServerErrorException(
                this.cloudinaryUploadErrorMessage(
                  isVideo ? 'video' : 'image',
                  error,
                ),
              ),
            );
            return;
          }
          const delivery = isVideo
            ? videoDeliveryUrlsFromUpload(result)
            : { videoDeliveryUrl: null, videoPosterUrl: null };
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            ...delivery,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }

  private cloudinaryUploadErrorMessage(
    kind: 'image' | 'video',
    error: unknown,
  ): string {
    const label = kind === 'video' ? 'Video' : 'Image';
    const detail =
      error instanceof Error
        ? error.message.trim()
        : error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message.trim()
          : '';
    if (detail) {
      return `${label} upload failed: ${detail}`;
    }
    return `${label} upload failed.`;
  }
}
