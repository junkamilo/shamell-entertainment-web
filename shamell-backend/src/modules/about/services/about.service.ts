import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { imageUrl as toDeliveryImageUrl } from '../../../common/util/cloudinary-delivery.util';
import { UpsertAboutContentDto } from '../dto/upsert-about-content.dto';
import type {
  AboutContentResponseDto,
  PublicAboutContentResponseDto,
} from '../dto/about-response.dto';
import type { AboutContentRow, AboutHeroMediaType } from '../types/about.types';
import {
  buildAboutHeroVideoDeliveryUrl,
  buildAboutHeroVideoPosterUrl,
} from '../utils/about-video-delivery.util';
import { AboutMediaService } from './about-media.service';
import { AboutRepository } from './about.repository';

@Injectable()
export class AboutService {
  constructor(
    private readonly repository: AboutRepository,
    private readonly media: AboutMediaService,
  ) {}

  async getPublicAboutContent(): Promise<PublicAboutContentResponseDto> {
    const latest = await this.repository.findLatest();
    if (!latest) {
      throw new NotFoundException('About content not found.');
    }
    return this.mapPublicAboutContent(latest);
  }

  /** Like getPublicAboutContent but returns null instead of throwing (aggregation-safe). */
  async getPublicAboutContentOrNull(): Promise<PublicAboutContentResponseDto | null> {
    const latest = await this.repository.findLatest();
    return latest ? this.mapPublicAboutContent(latest) : null;
  }

  async getAdminAboutContent(): Promise<AboutContentResponseDto | null> {
    const latest = await this.repository.findLatest();
    return latest ? this.mapAboutContent(latest) : null;
  }

  /** Admin: persist derived delivery URLs and optionally warm Cloudinary CDN. */
  async backfillVideoDeliveryUrls(options?: { warmCdn?: boolean }) {
    const latest = await this.repository.findLatest();
    if (!latest) {
      throw new NotFoundException('About content not found.');
    }
    if (this.normalizeHeroMediaType(latest.heroMediaType) !== 'VIDEO') {
      return {
        updated: false,
        reason: 'Hero media is not a video.',
        about: this.mapAboutContent(latest),
      };
    }
    const imageUrl = latest.imageUrl?.trim() ?? '';
    if (!imageUrl) {
      throw new BadRequestException('Video hero is missing imageUrl.');
    }

    const videoDeliveryUrl = buildAboutHeroVideoDeliveryUrl(imageUrl);
    const videoPosterUrl = buildAboutHeroVideoPosterUrl(imageUrl);
    if (!videoDeliveryUrl || !videoPosterUrl) {
      throw new BadRequestException(
        'Could not derive Cloudinary delivery URLs from imageUrl.',
      );
    }

    const hadDelivery = Boolean(latest.videoDeliveryUrl?.trim());
    const hadPoster = Boolean(latest.videoPosterUrl?.trim());
    const needsUpdate = !hadDelivery || !hadPoster;

    const saved = needsUpdate
      ? await this.repository.update(latest.id, {
          videoDeliveryUrl,
          videoPosterUrl,
        })
      : latest;

    if (options?.warmCdn) {
      await this.media.warmAboutVideoCdn(videoDeliveryUrl, videoPosterUrl);
    }

    return {
      updated: needsUpdate,
      warmedCdn: Boolean(options?.warmCdn),
      hadDeliveryInDb: hadDelivery,
      hadPosterInDb: hadPoster,
      videoDeliveryUrl,
      videoPosterUrl,
      about: this.mapAboutContent(saved),
    };
  }

  async upsertAdminAboutContent(
    dto: UpsertAboutContentDto,
    mediaFile?: Express.Multer.File,
  ) {
    const existing = await this.repository.findLatest();
    const isCreating = !existing;
    if (isCreating) {
      this.ensureRequiredForCreate(dto, mediaFile);
    }

    let newUpload: Awaited<
      ReturnType<AboutMediaService['uploadHeroMedia']>
    > | null = null;
    if (mediaFile) {
      newUpload = await this.media.uploadHeroMedia(mediaFile);
    }

    try {
      const saved = existing
        ? await this.repository.update(existing.id, {
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
          })
        : await this.repository.create({
            title: dto.title!,
            paragraph1: dto.paragraph1!,
            coreValues: dto.coreValues!,
            imageUrl: newUpload?.secureUrl ?? null,
            imagePublicId: newUpload?.publicId ?? null,
            heroMediaType: newUpload?.mediaType ?? 'IMAGE',
            videoDeliveryUrl: newUpload?.videoDeliveryUrl ?? null,
            videoPosterUrl: newUpload?.videoPosterUrl ?? null,
            isActive: true,
          });

      if (newUpload && existing?.imagePublicId) {
        const prevType = this.normalizeHeroMediaType(existing.heroMediaType);
        await this.media
          .deleteHeroFromCloudinary(existing.imagePublicId, prevType)
          .catch(() => null);
      }

      return {
        message: isCreating
          ? 'About content created successfully.'
          : 'About content updated successfully.',
        about: this.mapAboutContent(saved),
      };
    } catch (error) {
      if (newUpload) {
        await this.media
          .deleteHeroFromCloudinary(newUpload.publicId, newUpload.mediaType)
          .catch(() => null);
      }
      throw error;
    }
  }

  async deleteAdminAboutHeroMedia() {
    const existing = await this.repository.findLatest();
    if (!existing) {
      throw new NotFoundException('About content not found.');
    }
    if (!existing.imageUrl && !existing.imagePublicId) {
      throw new BadRequestException(
        'There is no hero image or video to remove.',
      );
    }

    if (existing.imagePublicId) {
      const prevType = this.normalizeHeroMediaType(existing.heroMediaType);
      await this.media.deleteHeroFromCloudinary(
        existing.imagePublicId,
        prevType,
      );
    }

    const saved = await this.repository.clearHeroMedia(existing.id);

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

  normalizeHeroMediaType(raw: string | null | undefined): AboutHeroMediaType {
    return raw === 'VIDEO' ? 'VIDEO' : 'IMAGE';
  }

  mapPublicAboutContent(
    content: AboutContentRow,
  ): PublicAboutContentResponseDto {
    const base = this.mapAboutContent(content);
    const heroMediaType = this.normalizeHeroMediaType(content.heroMediaType);
    return {
      ...base,
      imageUrl:
        heroMediaType === 'VIDEO'
          ? null
          : toDeliveryImageUrl(content.imageUrl, 'portrait'),
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

  mapAboutContent(content: AboutContentRow): AboutContentResponseDto {
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
