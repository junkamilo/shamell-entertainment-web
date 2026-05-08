import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { imageSize } from 'image-size';
import { PrismaService } from '../../prisma/prisma.service';
import { GalleryService } from '../gallery/gallery.service';

type HeaderPhoto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  focalX: number;
  focalY: number;
  focalMobileX: number;
  focalMobileY: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class HeaderMediaService {
  private readonly fallbackCategoryName = 'Header Principal';
  private readonly fallbackCategorySlug = 'home-header';
  private readonly minHeroImageWidth = 1200;
  private readonly minHeroImageHeight = 1200;

  constructor(
    private readonly prisma: PrismaService,
    private readonly galleryService: GalleryService,
  ) {}

  async getPublicHeaderPhotos() {
    const category = await this.findHeaderCategory();
    if (!category) return [];

    const rows = await this.prisma.galleryPhoto.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        imageUrl: true,
        imagePublicId: true,
        focalX: true,
        focalY: true,
        focalMobileX: true,
        focalMobileY: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((row) => this.mapHeaderPhoto(row));
  }

  async getAdminHeaderPhotos() {
    const category = await this.ensureHeaderCategory();
    const rows = await this.prisma.galleryPhoto.findMany({
      where: { categoryId: category.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imageUrl: true,
        imagePublicId: true,
        focalX: true,
        focalY: true,
        focalMobileX: true,
        focalMobileY: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((row) => this.mapHeaderPhoto(row));
  }

  async uploadAdminHeaderPhotos(files: Express.Multer.File[]) {
    if (!files.length) {
      throw new BadRequestException('At least one image file is required.');
    }
    const invalid = files.find((file) => !file.mimetype.startsWith('image/'));
    if (invalid) {
      throw new BadRequestException('Only image files are allowed.');
    }
    for (const file of files) {
      this.validateHeroImageDimensions(file);
    }

    const category = await this.ensureHeaderCategory();
    const created = await this.galleryService.createPhoto(
      { categoryId: category.id },
      files,
    );
    return {
      message: 'Header photos uploaded successfully.',
      items: created.items.map((item) =>
        this.mapHeaderPhoto({
          id: item.id,
          imageUrl: item.imageUrl,
          imagePublicId: item.imagePublicId,
          focalX: 50,
          focalY: 35,
          focalMobileX: 50,
          focalMobileY: 35,
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
      ),
    };
  }

  async toggleAdminHeaderPhoto(photoId: string, isActive: boolean) {
    const category = await this.ensureHeaderCategory();
    const existing = await this.prisma.galleryPhoto.findFirst({
      where: { id: photoId, categoryId: category.id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Header photo not found.');
    }

    const updated = await this.prisma.galleryPhoto.update({
      where: { id: photoId },
      data: { isActive },
      select: {
        id: true,
        imageUrl: true,
        imagePublicId: true,
        focalX: true,
        focalY: true,
        focalMobileX: true,
        focalMobileY: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      message: 'Header photo updated successfully.',
      item: this.mapHeaderPhoto(updated),
    };
  }

  async deleteAdminHeaderPhoto(photoId: string) {
    const category = await this.ensureHeaderCategory();
    const existing = await this.prisma.galleryPhoto.findFirst({
      where: { id: photoId, categoryId: category.id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Header photo not found.');
    }
    return this.galleryService.deletePhoto(photoId);
  }

  async updateAdminHeaderPhotoFocalPoint(
    photoId: string,
    focalX: number,
    focalY: number,
    focalMobileX: number,
    focalMobileY: number,
  ) {
    const category = await this.ensureHeaderCategory();
    const existing = await this.prisma.galleryPhoto.findFirst({
      where: { id: photoId, categoryId: category.id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Header photo not found.');
    }

    const updated = await this.prisma.galleryPhoto.update({
      where: { id: photoId },
      data: {
        focalX,
        focalY,
        focalMobileX,
        focalMobileY,
      },
      select: {
        id: true,
        imageUrl: true,
        imagePublicId: true,
        focalX: true,
        focalY: true,
        focalMobileX: true,
        focalMobileY: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      message: 'Header photo focus updated successfully.',
      item: this.mapHeaderPhoto(updated),
    };
  }

  private mapHeaderPhoto(photo: HeaderPhoto) {
    return {
      id: photo.id,
      imageUrl: photo.imageUrl,
      imagePublicId: photo.imagePublicId,
      focalX: photo.focalX,
      focalY: photo.focalY,
      focalMobileX: photo.focalMobileX,
      focalMobileY: photo.focalMobileY,
      isActive: photo.isActive,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    };
  }

  private validateHeroImageDimensions(file: Express.Multer.File) {
    const dimensions = imageSize(file.buffer);
    const width = dimensions.width ?? 0;
    const height = dimensions.height ?? 0;
    if (width < this.minHeroImageWidth || height < this.minHeroImageHeight) {
      throw new BadRequestException(
        `Image "${file.originalname}" is too small (${width}x${height}). Minimum recommended size is ${this.minHeroImageWidth}x${this.minHeroImageHeight}.`,
      );
    }
  }

  private async ensureHeaderCategory() {
    const slug =
      process.env.HEADER_MEDIA_GALLERY_SLUG?.trim() ||
      this.fallbackCategorySlug;
    const name =
      process.env.HEADER_MEDIA_GALLERY_NAME?.trim() ||
      this.fallbackCategoryName;

    const bySlug = await this.prisma.galleryCategory.findFirst({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (bySlug) return bySlug;

    return this.prisma.galleryCategory.create({
      data: { name, slug },
      select: { id: true, name: true, slug: true },
    });
  }

  private async findHeaderCategory() {
    const slug =
      process.env.HEADER_MEDIA_GALLERY_SLUG?.trim() ||
      this.fallbackCategorySlug;
    return this.prisma.galleryCategory.findFirst({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
  }
}
