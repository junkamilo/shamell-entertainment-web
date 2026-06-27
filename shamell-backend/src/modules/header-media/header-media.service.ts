import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GalleryMediaType } from '@prisma/client';
import { imageSize } from 'image-size';
import { PrismaService } from '../../prisma/prisma.service';
import { GalleryService } from '../gallery/gallery.service';
import {
  imageUrl as toHeroImageUrl,
  videoUrl as toVideoUrl,
} from '../../common/util/cloudinary-delivery.util';

type HeaderPhoto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  mediaType: GalleryMediaType;
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
        mediaType: true,
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
        mediaType: true,
        focalX: true,
        focalY: true,
        focalMobileX: true,
        focalMobileY: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((row) => this.mapHeaderPhotoAdmin(row));
  }

  async uploadAdminHeaderPhotos(files: Express.Multer.File[]) {
    if (!files.length) {
      throw new BadRequestException(
        'At least one image or video file is required.',
      );
    }
    const invalid = files.find(
      (file) =>
        !file.mimetype.startsWith('image/') &&
        !file.mimetype.startsWith('video/'),
    );
    if (invalid) {
      throw new BadRequestException('Only image or video files are allowed.');
    }
    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        this.validateHeroImageDimensions(file);
      }
    }

    const category = await this.ensureHeaderCategory();
    const created = await this.galleryService.createPhoto(
      { categoryId: category.id },
      files,
    );
    return {
      message: 'Header media uploaded successfully.',
      items: created.items.map((item) =>
        this.mapHeaderPhotoAdmin({
          id: item.id,
          imageUrl: item.imageUrl,
          imagePublicId: item.imagePublicId,
          mediaType: item.mediaType,
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
        mediaType: true,
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
      item: this.mapHeaderPhotoAdmin(updated),
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
        mediaType: true,
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
      item: this.mapHeaderPhotoAdmin(updated),
    };
  }

  private mapHeaderPhoto(photo: HeaderPhoto) {
    const isVideo = photo.mediaType === GalleryMediaType.VIDEO;
    // VIDEO: imageUrl is null; the hero plays `videoDeliveryUrl` and shows the
    // poster (720/480) as the LCP image. IMAGE: responsive desktop/mobile pair
    // consumed via <img srcset> on the public hero.
    return {
      id: photo.id,
      imageUrl: isVideo ? null : toHeroImageUrl(photo.imageUrl, 'hero'),
      imageUrlMobile: isVideo
        ? null
        : toHeroImageUrl(photo.imageUrl, 'heroMobile'),
      videoDeliveryUrl: isVideo
        ? toVideoUrl(photo.imageUrl, 'stream720')
        : null,
      videoPosterUrl: isVideo ? toVideoUrl(photo.imageUrl, 'poster720') : null,
      videoPosterUrlMobile: isVideo
        ? toVideoUrl(photo.imageUrl, 'poster480')
        : null,
      imagePublicId: photo.imagePublicId,
      mediaType: photo.mediaType,
      focalX: photo.focalX,
      focalY: photo.focalY,
      focalMobileX: photo.focalMobileX,
      focalMobileY: photo.focalMobileY,
      isActive: photo.isActive,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    };
  }

  // Admin mapper: reuses the public payload but restores a playable `imageUrl`
  // for VIDEO so the admin library/focus preview (which renders <video src>)
  // keeps working. The public mapper intentionally returns imageUrl: null.
  private mapHeaderPhotoAdmin(photo: HeaderPhoto) {
    const base = this.mapHeaderPhoto(photo);
    if (photo.mediaType === GalleryMediaType.VIDEO) {
      return { ...base, imageUrl: photo.imageUrl };
    }
    return base;
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
