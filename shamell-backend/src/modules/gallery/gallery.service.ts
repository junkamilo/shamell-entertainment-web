import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 6;
    const skip = (page - 1) * limit;
    const category = params.category?.trim().toLowerCase();
    const where = {
      isActive: true,
      category: {
        ...(category && category !== 'all' ? { slug: category, isActive: true } : { isActive: true }),
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
    try {
      const created = await this.prisma.galleryCategory.create({
        data: {
          name: dto.name,
          slug: dto.slug,
        },
      });

      return {
        message: 'Gallery category created successfully.',
        category: this.mapCategory(created),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('Category name or slug already exists.');
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

    try {
      const updated = await this.prisma.galleryCategory.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
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
        throw new ConflictException('Category name or slug already exists.');
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

  async createPhoto(dto: CreateGalleryPhotoDto, imageFile: Express.Multer.File) {
    this.ensureCloudinaryEnv();
    this.ensureImageFile(imageFile);
    await this.ensureReferencesAreValid(dto);

    const upload = await this.uploadImageToCloudinary(imageFile);

    try {
      const created = await this.prisma.galleryPhoto.create({
        data: {
          categoryId: dto.categoryId,
          imageUrl: upload.secureUrl,
          imagePublicId: upload.publicId,
          ...(dto.serviceId ? { serviceId: dto.serviceId } : {}),
          ...(dto.serviceTypeId ? { serviceTypeId: dto.serviceTypeId } : {}),
          ...(dto.eventId ? { eventId: dto.eventId } : {}),
          ...(dto.eventTypeId ? { eventTypeId: dto.eventTypeId } : {}),
        },
        include: { category: true },
      });

      return {
        message: 'Gallery photo created successfully.',
        photo: this.mapPhoto(created),
      };
    } catch (error) {
      await this.deleteImageFromCloudinary(upload.publicId).catch(() => null);
      throw error;
    }
  }

  async updatePhoto(id: string, dto: UpdateGalleryPhotoDto, imageFile?: Express.Multer.File) {
    const existing = await this.prisma.galleryPhoto.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) {
      throw new NotFoundException('Gallery photo not found.');
    }

    this.ensureCloudinaryEnv();
    if (imageFile) {
      this.ensureImageFile(imageFile);
    }
    await this.ensureReferencesAreValid(dto);

    let newUpload: { secureUrl: string; publicId: string } | null = null;
    if (imageFile) {
      newUpload = await this.uploadImageToCloudinary(imageFile);
    }

    try {
      const updated = await this.prisma.galleryPhoto.update({
        where: { id },
        data: {
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.serviceId !== undefined ? { serviceId: dto.serviceId } : {}),
          ...(dto.serviceTypeId !== undefined ? { serviceTypeId: dto.serviceTypeId } : {}),
          ...(dto.eventId !== undefined ? { eventId: dto.eventId } : {}),
          ...(dto.eventTypeId !== undefined ? { eventTypeId: dto.eventTypeId } : {}),
          ...(newUpload
            ? {
                imageUrl: newUpload.secureUrl,
                imagePublicId: newUpload.publicId,
              }
            : {}),
        },
        include: { category: true },
      });

      if (newUpload) {
        await this.deleteImageFromCloudinary(existing.imagePublicId).catch(() => null);
      }

      return {
        message: 'Gallery photo updated successfully.',
        photo: this.mapPhoto(updated),
      };
    } catch (error) {
      if (newUpload) {
        await this.deleteImageFromCloudinary(newUpload.publicId).catch(() => null);
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

    const updated = await this.prisma.galleryPhoto.update({
      where: { id },
      data: { isActive: false },
      include: { category: true },
    });

    return {
      message: 'Gallery photo disabled successfully.',
      photo: this.mapPhoto(updated),
    };
  }

  private ensureCloudinaryEnv() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new InternalServerErrorException('Cloudinary environment variables are missing.');
    }
  }

  private ensureImageFile(imageFile?: Express.Multer.File) {
    if (!imageFile?.buffer) {
      throw new BadRequestException('Image file is required.');
    }
    if (!imageFile.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
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

  private uploadImageToCloudinary(file: Express.Multer.File): Promise<{ secureUrl: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shamell/gallery',
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

  private async deleteImageFromCloudinary(publicId: string) {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    const ok = result.result === 'ok' || result.result === 'not found';
    if (!ok) {
      throw new InternalServerErrorException('Cloudinary image deletion failed.');
    }
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
