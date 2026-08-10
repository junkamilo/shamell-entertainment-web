import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GalleryMediaType } from '@prisma/client';
import { softFailToNull } from '../../../common/http/utils/log-caught-error.util';
import {
  EVENT_CATALOG_GALLERY_CATEGORY_ID_ENV,
  EVENT_CATALOG_GALLERY_SLUG_DEFAULT,
  EVENT_CATALOG_GALLERY_SLUG_ENV,
} from '../constants/gallery.constants';
import { CreateGalleryCategoryDto } from '../dto/create-gallery-category.dto';
import { CreateGalleryPhotoDto } from '../dto/create-gallery-photo.dto';
import { UpdateGalleryCategoryDto } from '../dto/update-gallery-category.dto';
import { UpdateGalleryPhotoDto } from '../dto/update-gallery-photo.dto';
import type {
  GalleryPublicPhotosWhere,
  PhotoWithCategory,
} from '../types/gallery.types';
import {
  mapGalleryCategory,
  mapGalleryPhoto,
  mapPublicGalleryPhoto,
  slugFromDisplayName,
} from '../utils/gallery-mapper.util';
import { GalleryMediaService } from './gallery-media.service';
import { GalleryRepository } from './gallery.repository';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    private readonly repository: GalleryRepository,
    private readonly media: GalleryMediaService,
  ) {}

  async getPublicCategories() {
    const categories = await this.repository.findActiveCategories();
    return categories.map((category) => mapGalleryCategory(category));
  }

  async getPublicPhotos(params: {
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 6;
    const skip = (page - 1) * limit;
    const category = params.category?.trim().toLowerCase();
    const where: GalleryPublicPhotosWhere = {
      isActive: true,
      category: {
        ...(category && category !== 'all'
          ? { slug: category, isActive: true }
          : { isActive: true }),
      },
    };

    const [items, total] = await Promise.all([
      this.repository.findPublicPhotos({ where, skip, take: limit }),
      this.repository.countPublicPhotos(where),
    ]);

    return {
      items: items.map((item) => mapPublicGalleryPhoto(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getAdminCategories() {
    const categories = await this.repository.findAllCategories();
    return categories.map((category) => mapGalleryCategory(category));
  }

  async createCategory(dto: CreateGalleryCategoryDto) {
    const slug = await this.ensureUniqueGalleryCategorySlug(
      slugFromDisplayName(dto.name),
    );

    try {
      const created = await this.repository.createCategory({
        name: dto.name,
        slug,
      });

      return {
        message: 'Gallery category created successfully.',
        category: mapGalleryCategory(created),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('Category name already exists.');
      }
      throw error;
    }
  }

  async updateCategory(id: string, dto: UpdateGalleryCategoryDto) {
    const existing = await this.repository.findCategoryById(id);
    if (!existing) {
      throw new NotFoundException('Gallery category not found.');
    }

    const slug =
      dto.name !== undefined
        ? await this.ensureUniqueGalleryCategorySlug(
            slugFromDisplayName(dto.name),
            id,
          )
        : undefined;

    try {
      const updated = await this.repository.updateCategory(id, {
        ...(dto.name !== undefined ? { name: dto.name, slug } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      });

      return {
        message: 'Gallery category updated successfully.',
        category: mapGalleryCategory(updated),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('Category name already exists.');
      }
      throw error;
    }
  }

  async getAdminPhotos() {
    const items = await this.repository.findAllAdminPhotos();
    return items.map((item) => mapGalleryPhoto(item));
  }

  async createPhoto(
    dto: CreateGalleryPhotoDto,
    mediaFiles: Express.Multer.File[],
  ) {
    this.media.ensureCloudinaryEnv();
    mediaFiles.forEach((file) => this.media.ensureMediaFile(file));
    await this.ensureReferencesAreValid(dto);

    const createdPhotos: PhotoWithCategory[] = [];
    for (const file of mediaFiles) {
      const prepared = await this.media.prepareMulterFileForCloudinary(file);
      const upload = await this.media.uploadMediaToCloudinary(prepared);
      try {
        const created = await this.repository.createPhoto({
          categoryId: dto.categoryId,
          imageUrl: upload.secureUrl,
          imagePublicId: upload.publicId,
          mediaType: upload.mediaType,
          ...(dto.serviceId ? { serviceId: dto.serviceId } : {}),
          ...(dto.serviceTypeId ? { serviceTypeId: dto.serviceTypeId } : {}),
          ...(dto.eventId ? { eventId: dto.eventId } : {}),
          ...(dto.eventTypeId ? { eventTypeId: dto.eventTypeId } : {}),
        });
        createdPhotos.push(created);
      } catch (error) {
        await this.media
          .deleteMediaFromCloudinary(upload.publicId, upload.mediaType)
          .catch(softFailToNull(this.logger, 'cdn.cleanup'));
        throw error;
      }
    }

    return {
      message: `${createdPhotos.length} media file(s) created successfully.`,
      items: createdPhotos.map((photo) => mapGalleryPhoto(photo)),
    };
  }

  /** Uploads gallery rows linked to an Event (uses category slug `event-catalog` unless EVENT_CATALOG_GALLERY_CATEGORY_ID is set). */
  async createPhotosForEvent(
    eventId: string,
    mediaFiles: Express.Multer.File[],
  ) {
    let categoryId = process.env[EVENT_CATALOG_GALLERY_CATEGORY_ID_ENV]?.trim();
    if (!categoryId) {
      const slug =
        process.env[EVENT_CATALOG_GALLERY_SLUG_ENV]?.trim() ||
        EVENT_CATALOG_GALLERY_SLUG_DEFAULT;
      const cat = await this.repository.findCategoryBySlug(slug);
      categoryId = cat?.id;
    }
    if (!categoryId) {
      throw new BadRequestException(
        'Missing gallery category for event images. Run DB migrations or create a category with slug "event-catalog", or set EVENT_CATALOG_GALLERY_CATEGORY_ID.',
      );
    }
    return this.createPhoto({ categoryId, eventId }, mediaFiles);
  }

  async updatePhoto(
    id: string,
    dto: UpdateGalleryPhotoDto,
    imageFile?: Express.Multer.File,
  ) {
    const existing = await this.repository.findPhotoById(id);
    if (!existing) {
      throw new NotFoundException('Gallery photo not found.');
    }

    this.media.ensureCloudinaryEnv();
    if (imageFile) {
      this.media.ensureMediaFile(imageFile);
    }
    await this.ensureReferencesAreValid(dto);

    let newUpload: {
      secureUrl: string;
      publicId: string;
      mediaType: GalleryMediaType;
    } | null = null;
    if (imageFile) {
      const prepared =
        await this.media.prepareMulterFileForCloudinary(imageFile);
      newUpload = await this.media.uploadMediaToCloudinary(prepared);
    }

    try {
      const updated = await this.repository.updatePhoto(id, {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.serviceId !== undefined ? { serviceId: dto.serviceId } : {}),
        ...(dto.serviceTypeId !== undefined
          ? { serviceTypeId: dto.serviceTypeId }
          : {}),
        ...(dto.eventId !== undefined ? { eventId: dto.eventId } : {}),
        ...(dto.eventTypeId !== undefined
          ? { eventTypeId: dto.eventTypeId }
          : {}),
        ...(newUpload
          ? {
              imageUrl: newUpload.secureUrl,
              imagePublicId: newUpload.publicId,
              mediaType: newUpload.mediaType,
            }
          : {}),
      });

      if (newUpload) {
        await this.media
          .deleteMediaFromCloudinary(existing.imagePublicId, existing.mediaType)
          .catch(softFailToNull(this.logger, 'cdn.cleanup'));
      }

      return {
        message: 'Gallery photo updated successfully.',
        photo: mapGalleryPhoto(updated),
      };
    } catch (error) {
      if (newUpload) {
        await this.media
          .deleteMediaFromCloudinary(newUpload.publicId, newUpload.mediaType)
          .catch(softFailToNull(this.logger, 'cdn.cleanup'));
      }
      throw error;
    }
  }

  async deletePhoto(id: string) {
    const existing = await this.repository.findPhotoById(id);
    if (!existing) {
      throw new NotFoundException('Gallery photo not found.');
    }

    await this.media
      .deleteMediaFromCloudinary(existing.imagePublicId, existing.mediaType)
      .catch(softFailToNull(this.logger, 'cdn.cleanup'));
    await this.repository.deletePhoto(id);

    return {
      message: 'Gallery media deleted successfully.',
    };
  }

  private async ensureReferencesAreValid(dto: {
    categoryId?: string;
    serviceId?: string;
    serviceTypeId?: string;
    eventId?: string;
    eventTypeId?: string;
  }) {
    if (dto.categoryId) {
      const category = await this.repository.findCategoryById(dto.categoryId);
      if (!category) {
        throw new NotFoundException('Gallery category not found.');
      }
    }

    if (dto.serviceId) {
      const service = await this.repository.findServiceId(dto.serviceId);
      if (!service) {
        throw new NotFoundException('Service not found.');
      }
    }

    if (dto.serviceTypeId) {
      const serviceType = await this.repository.findServiceTypeId(
        dto.serviceTypeId,
      );
      if (!serviceType) {
        throw new NotFoundException('Service type not found.');
      }
    }

    if (dto.eventId) {
      const event = await this.repository.findEventId(dto.eventId);
      if (!event) {
        throw new NotFoundException('Event not found.');
      }
    }

    if (dto.eventTypeId) {
      const eventType = await this.repository.findEventTypeId(dto.eventTypeId);
      if (!eventType) {
        throw new NotFoundException('Event type not found.');
      }
    }
  }

  private async ensureUniqueGalleryCategorySlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    let suffix = 0;
    while (suffix < 500) {
      const candidate = suffix === 0 ? base : `${base}-${suffix}`;
      const existing = await this.repository.findCategorySlugConflict(
        candidate,
        excludeId,
      );
      if (!existing) {
        return candidate;
      }
      suffix += 1;
    }
    throw new ConflictException('Could not generate a unique category slug.');
  }
}
