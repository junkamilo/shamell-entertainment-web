import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GalleryMediaType } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGalleryCategoryDto } from './dto/create-gallery-category.dto';
import { CreateGalleryPhotoDto } from './dto/create-gallery-photo.dto';
import { UpdateGalleryCategoryDto } from './dto/update-gallery-category.dto';
import { UpdateGalleryPhotoDto } from './dto/update-gallery-photo.dto';

type PhotoWithCategory = {
  id: string;
  categoryId: string;
  imageUrl: string;
  imagePublicId: string;
  mediaType: GalleryMediaType;
  isActive: boolean;
  serviceId: string | null;
  serviceTypeId: string | null;
  eventId: string | null;
  eventTypeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getPublicCategories() {
    const categories = await this.prisma.galleryCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return categories.map((category) => this.mapCategory(category));
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
    const where = {
      isActive: true,
      category: {
        ...(category && category !== 'all'
          ? { slug: category, isActive: true }
          : { isActive: true }),
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.galleryPhoto.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { category: true },
      }),
      this.prisma.galleryPhoto.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapPhoto(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getAdminCategories() {
    const categories = await this.prisma.galleryCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return categories.map((category) => this.mapCategory(category));
  }

  async createCategory(dto: CreateGalleryCategoryDto) {
    const slug = await this.ensureUniqueGalleryCategorySlug(
      this.slugFromDisplayName(dto.name),
    );

    try {
      const created = await this.prisma.galleryCategory.create({
        data: {
          name: dto.name,
          slug,
        },
      });

      return {
        message: 'Gallery category created successfully.',
        category: this.mapCategory(created),
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
    const existing = await this.prisma.galleryCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Gallery category not found.');
    }

    const slug =
      dto.name !== undefined
        ? await this.ensureUniqueGalleryCategorySlug(
            this.slugFromDisplayName(dto.name),
            id,
          )
        : undefined;

    try {
      const updated = await this.prisma.galleryCategory.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name, slug } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      return {
        message: 'Gallery category updated successfully.',
        category: this.mapCategory(updated),
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
    const items = await this.prisma.galleryPhoto.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
    return items.map((item) => this.mapPhoto(item));
  }

  async createPhoto(
    dto: CreateGalleryPhotoDto,
    mediaFiles: Express.Multer.File[],
  ) {
    this.ensureCloudinaryEnv();
    mediaFiles.forEach((file) => this.ensureMediaFile(file));
    await this.ensureReferencesAreValid(dto);

    const createdPhotos: PhotoWithCategory[] = [];
    for (const file of mediaFiles) {
      const upload = await this.uploadMediaToCloudinary(file);
      try {
        const created = await this.prisma.galleryPhoto.create({
          data: {
            categoryId: dto.categoryId,
            imageUrl: upload.secureUrl,
            imagePublicId: upload.publicId,
            mediaType: upload.mediaType,
            ...(dto.serviceId ? { serviceId: dto.serviceId } : {}),
            ...(dto.serviceTypeId ? { serviceTypeId: dto.serviceTypeId } : {}),
            ...(dto.eventId ? { eventId: dto.eventId } : {}),
            ...(dto.eventTypeId ? { eventTypeId: dto.eventTypeId } : {}),
          },
          include: { category: true },
        });
        createdPhotos.push(created);
      } catch (error) {
        await this.deleteMediaFromCloudinary(
          upload.publicId,
          upload.mediaType,
        ).catch(() => null);
        throw error;
      }
    }

    return {
      message: `${createdPhotos.length} media file(s) created successfully.`,
      items: createdPhotos.map((photo) => this.mapPhoto(photo)),
    };
  }

  /** Uploads gallery rows linked to an Event (uses category slug `event-catalog` unless EVENT_CATALOG_GALLERY_CATEGORY_ID is set). */
  async createPhotosForEvent(
    eventId: string,
    mediaFiles: Express.Multer.File[],
  ) {
    let categoryId = process.env.EVENT_CATALOG_GALLERY_CATEGORY_ID?.trim();
    if (!categoryId) {
      const slug =
        process.env.EVENT_CATALOG_GALLERY_SLUG?.trim() || 'event-catalog';
      const cat = await this.prisma.galleryCategory.findFirst({
        where: { slug },
        select: { id: true },
      });
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
    const existing = await this.prisma.galleryPhoto.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) {
      throw new NotFoundException('Gallery photo not found.');
    }

    this.ensureCloudinaryEnv();
    if (imageFile) {
      this.ensureMediaFile(imageFile);
    }
    await this.ensureReferencesAreValid(dto);

    let newUpload: {
      secureUrl: string;
      publicId: string;
      mediaType: GalleryMediaType;
    } | null = null;
    if (imageFile) {
      newUpload = await this.uploadMediaToCloudinary(imageFile);
    }

    try {
      const updated = await this.prisma.galleryPhoto.update({
        where: { id },
        data: {
          ...(dto.categoryId !== undefined
            ? { categoryId: dto.categoryId }
            : {}),
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
        },
        include: { category: true },
      });

      if (newUpload) {
        await this.deleteMediaFromCloudinary(
          existing.imagePublicId,
          existing.mediaType,
        ).catch(() => null);
      }

      return {
        message: 'Gallery photo updated successfully.',
        photo: this.mapPhoto(updated),
      };
    } catch (error) {
      if (newUpload) {
        await this.deleteMediaFromCloudinary(
          newUpload.publicId,
          newUpload.mediaType,
        ).catch(() => null);
      }
      throw error;
    }
  }

  async deletePhoto(id: string) {
    const existing = await this.prisma.galleryPhoto.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) {
      throw new NotFoundException('Gallery photo not found.');
    }

    await this.deleteMediaFromCloudinary(
      existing.imagePublicId,
      existing.mediaType,
    ).catch(() => null);
    await this.prisma.galleryPhoto.delete({ where: { id } });

    return {
      message: 'Gallery media deleted successfully.',
    };
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

  private ensureMediaFile(mediaFile?: Express.Multer.File) {
    if (!mediaFile?.buffer) {
      throw new BadRequestException('Media file is required.');
    }
    const isImage = mediaFile.mimetype.startsWith('image/');
    const isVideo = mediaFile.mimetype.startsWith('video/');
    if (!isImage && !isVideo) {
      throw new BadRequestException('Only image and video files are allowed.');
    }
  }

  private async ensureReferencesAreValid(dto: {
    categoryId?: string;
    serviceId?: string;
    serviceTypeId?: string;
    eventId?: string;
    eventTypeId?: string;
  }) {
    if (dto.categoryId) {
      const category = await this.prisma.galleryCategory.findUnique({
        where: { id: dto.categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new NotFoundException('Gallery category not found.');
      }
    }

    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
        select: { id: true },
      });
      if (!service) {
        throw new NotFoundException('Service not found.');
      }
    }

    if (dto.serviceTypeId) {
      const serviceType = await this.prisma.serviceType.findUnique({
        where: { id: dto.serviceTypeId },
        select: { id: true },
      });
      if (!serviceType) {
        throw new NotFoundException('Service type not found.');
      }
    }

    if (dto.eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: dto.eventId },
        select: { id: true },
      });
      if (!event) {
        throw new NotFoundException('Event not found.');
      }
    }

    if (dto.eventTypeId) {
      const eventType = await this.prisma.eventType.findUnique({
        where: { id: dto.eventTypeId },
        select: { id: true },
      });
      if (!eventType) {
        throw new NotFoundException('Event type not found.');
      }
    }
  }

  private uploadMediaToCloudinary(file: Express.Multer.File): Promise<{
    secureUrl: string;
    publicId: string;
    mediaType: GalleryMediaType;
  }> {
    return new Promise((resolve, reject) => {
      const isVideo = file.mimetype.startsWith('video/');
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shamell/gallery',
          resource_type: isVideo ? 'video' : 'image',
        },
        (error, result) => {
          if (error || !result?.secure_url || !result.public_id) {
            reject(new InternalServerErrorException('Media upload failed.'));
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

      uploadStream.end(file.buffer);
    });
  }

  private async deleteMediaFromCloudinary(
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

  private slugFromDisplayName(name: string): string {
    const trimmed = name.trim();
    const withoutAccents = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const slug = withoutAccents
      .toLowerCase()
      .replace(/&/g, ' y ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    return slug.length >= 2 ? slug : 'categoria';
  }

  private async ensureUniqueGalleryCategorySlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    let suffix = 0;
    while (suffix < 500) {
      const candidate = suffix === 0 ? base : `${base}-${suffix}`;
      const existing = await this.prisma.galleryCategory.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
      suffix += 1;
    }
    throw new ConflictException('Could not generate a unique category slug.');
  }

  private mapCategory(category: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private mapPhoto(photo: PhotoWithCategory) {
    return {
      id: photo.id,
      categoryId: photo.categoryId,
      category: this.mapCategory(photo.category),
      imageUrl: photo.imageUrl,
      imagePublicId: photo.imagePublicId,
      mediaType: photo.mediaType,
      isActive: photo.isActive,
      serviceId: photo.serviceId,
      serviceTypeId: photo.serviceTypeId,
      eventId: photo.eventId,
      eventTypeId: photo.eventTypeId,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    };
  }
}
