import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertAboutContentDto } from './dto/upsert-about-content.dto';
import {
  ABOUT_VIDEO_UPLOAD_EAGER,
  buildAboutHeroVideoDeliveryUrl,
  buildAboutHeroVideoPosterUrl,
  videoDeliveryUrlsFromUpload,
} from './about-video-delivery.util';

type AboutHeroMediaType = 'IMAGE' | 'VIDEO';

@Injectable()
export class AboutService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getPublicAboutContent() {
    // Same singleton row as admin (latest save); isActive is set true on every upsert.
    const latest = await this.prisma.aboutContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!latest) {
      throw new NotFoundException('About content not found.');
    }
    return this.mapPublicAboutContent(latest);
  }

  async getAdminAboutContent() {
    const latest = await this.prisma.aboutContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    return latest ? this.mapAboutContent(latest) : null;
  }

  async upsertAdminAboutContent(
    dto: UpsertAboutContentDto,
    mediaFile?: Express.Multer.File,
  ) {
    const existing = await this.prisma.aboutContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const isCreating = !existing;
    if (isCreating) {
      this.ensureRequiredForCreate(dto, mediaFile);
    }

    let newUpload: {
      secureUrl: string;
      publicId: string;
      mediaType: AboutHeroMediaType;
      videoDeliveryUrl: string | null;
      videoPosterUrl: string | null;
    } | null = null;
    if (mediaFile) {
      this.ensureHeroMediaFile(mediaFile);
      this.ensureCloudinaryEnv();
      newUpload = await this.uploadHeroMediaToCloudinary(mediaFile);
    }

    try {
      const saved = existing
        ? await this.prisma.aboutContent.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              ...(dto.title !== undefined ? { title: dto.title } : {}),
              ...(dto.paragraph1 !== undefined
                ? { paragraph1: dto.paragraph1 }
                : {}),
              ...(dto.coreValues !== undefined
                ? { coreValues: dto.coreValues }
                : {}),
              ...(newUpload
                ? {
                    imageUrl: newUpload.secureUrl,
                    imagePublicId: newUpload.publicId,
                    heroMediaType: newUpload.mediaType,
                    videoDeliveryUrl: newUpload.videoDeliveryUrl,
                    videoPosterUrl: newUpload.videoPosterUrl,
                  }
                : {}),
            },
          })
        : await this.prisma.aboutContent.create({
            data: {
              title: dto.title!,
              paragraph1: dto.paragraph1!,
              coreValues: dto.coreValues!,
              imageUrl: newUpload?.secureUrl ?? null,
              imagePublicId: newUpload?.publicId ?? null,
              heroMediaType: newUpload?.mediaType ?? 'IMAGE',
              videoDeliveryUrl: newUpload?.videoDeliveryUrl ?? null,
              videoPosterUrl: newUpload?.videoPosterUrl ?? null,
              isActive: true,
            },
          });

      if (newUpload && existing?.imagePublicId) {
        const prevType = this.normalizeHeroMediaType(existing.heroMediaType);
        await this.deleteHeroFromCloudinary(
          existing.imagePublicId,
          prevType,
        ).catch(() => null);
      }

      return {
        message: isCreating
          ? 'About content created successfully.'
          : 'About content updated successfully.',
        about: this.mapAboutContent(saved),
      };
    } catch (error) {
      if (newUpload) {
        await this.deleteHeroFromCloudinary(
          newUpload.publicId,
          newUpload.mediaType,
        ).catch(() => null);
      }
      throw error;
    }
  }

  async deleteAdminAboutHeroMedia() {
    const existing = await this.prisma.aboutContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!existing) {
      throw new NotFoundException('About content not found.');
    }
    if (!existing.imageUrl && !existing.imagePublicId) {
      throw new BadRequestException(
        'There is no hero image or video to remove.',
      );
    }

    if (existing.imagePublicId) {
      this.ensureCloudinaryEnv();
      const prevType = this.normalizeHeroMediaType(existing.heroMediaType);
      await this.deleteHeroFromCloudinary(
        existing.imagePublicId,
        prevType,
      );
    }

    const saved = await this.prisma.aboutContent.update({
      where: { id: existing.id },
      data: {
        imageUrl: null,
        imagePublicId: null,
        heroMediaType: 'IMAGE',
        videoDeliveryUrl: null,
        videoPosterUrl: null,
      },
    });

    return {
      message: 'Hero image or video removed from the site and Cloudinary.',
      about: this.mapAboutContent(saved),
    };
  }

  private ensureRequiredForCreate(
    dto: UpsertAboutContentDto,
    mediaFile?: Express.Multer.File,
  ) {
    if (!dto.title || !dto.paragraph1 || !dto.coreValues?.length) {
      throw new BadRequestException(
        'Title, paragraph1, and at least one core value are required.',
      );
    }
    if (!mediaFile) {
      throw new BadRequestException(
        'An image or video file is required to create about content.',
      );
    }
  }

  private ensureCloudinaryEnv() {
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

  private ensureHeroMediaFile(mediaFile?: Express.Multer.File) {
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

  private async uploadHeroMediaToCloudinary(
    file: Express.Multer.File,
  ): Promise<{
    secureUrl: string;
    publicId: string;
    mediaType: AboutHeroMediaType;
    videoDeliveryUrl: string | null;
    videoPosterUrl: string | null;
  }> {
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
        await fs.unlink(file.path).catch(() => null);
      }
    }
  }

  private uploadFileFromPath(
    filePath: string,
    resourceType: 'image' | 'video',
  ): Promise<{
    secureUrl: string;
    publicId: string;
    videoDeliveryUrl: string | null;
    videoPosterUrl: string | null;
  }> {
    const isVideo = resourceType === 'video';
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        {
          folder: 'shamell/about',
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
                this.cloudinaryUploadErrorMessage(resourceType, error),
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
    });
  }

  /** Chunked upload for large hero videos (no in-app size cap). */
  private uploadVideoLargeFromPath(
    filePath: string,
  ): Promise<{
    secureUrl: string;
    publicId: string;
    videoDeliveryUrl: string | null;
    videoPosterUrl: string | null;
  }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(
        filePath,
        {
          folder: 'shamell/about',
          resource_type: 'video',
          chunk_size: 6_000_000,
          eager: ABOUT_VIDEO_UPLOAD_EAGER,
          eager_async: false,
        },
        (error, result) => {
          if (error || !result?.secure_url || !result.public_id) {
            reject(
              new InternalServerErrorException(
                this.cloudinaryUploadErrorMessage('video', error),
              ),
            );
            return;
          }
          const delivery = videoDeliveryUrlsFromUpload(result);
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            ...delivery,
          });
        },
      );
    });
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
          folder: 'shamell/about',
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
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message ?? '').trim()
        : '';
    if (detail) {
      return `${label} upload failed: ${detail}`;
    }
    return `${label} upload failed.`;
  }

  private normalizeHeroMediaType(raw: string | null | undefined): AboutHeroMediaType {
    return raw === 'VIDEO' ? 'VIDEO' : 'IMAGE';
  }

  private async deleteHeroFromCloudinary(
    publicId: string,
    mediaType: AboutHeroMediaType,
  ) {
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

  private mapPublicAboutContent(content: AboutContentRow) {
    const base = this.mapAboutContent(content);
    const heroMediaType = this.normalizeHeroMediaType(content.heroMediaType);
    return {
      ...base,
      videoDeliveryUrl:
        heroMediaType === 'VIDEO'
          ? content.videoDeliveryUrl?.trim() ||
            buildAboutHeroVideoDeliveryUrl(content.imageUrl)
          : null,
      videoPosterUrl:
        heroMediaType === 'VIDEO'
          ? content.videoPosterUrl?.trim() ||
            buildAboutHeroVideoPosterUrl(content.imageUrl)
          : null,
    };
  }

  private mapAboutContent(content: AboutContentRow) {
    const heroMediaType = this.normalizeHeroMediaType(content.heroMediaType);
    return {
      id: content.id,
      title: content.title,
      paragraph1: content.paragraph1,
      coreValues: content.coreValues,
      imageUrl: content.imageUrl,
      heroMediaType,
      videoDeliveryUrl: content.videoDeliveryUrl,
      videoPosterUrl: content.videoPosterUrl,
      isActive: content.isActive,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }
}

type AboutContentRow = {
  id: string;
  title: string;
  paragraph1: string;
  coreValues: string[];
  imageUrl: string | null;
  videoDeliveryUrl?: string | null;
  videoPosterUrl?: string | null;
  heroMediaType?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
