import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GalleryService } from '../../gallery/services/gallery.service';
import {
  HEADER_MEDIA_FALLBACK_CATEGORY_NAME,
  HEADER_MEDIA_FALLBACK_CATEGORY_SLUG,
  HEADER_MEDIA_GALLERY_NAME_ENV,
  HEADER_MEDIA_GALLERY_SLUG_ENV,
} from '../constants/header-media.constants';
import type { HeaderCategoryRow } from '../types/header-media.types';
import { validateHeroImageDimensions } from '../utils/header-hero-image.util';
import {
  mapHeaderPhoto,
  mapHeaderPhotoAdmin,
} from '../utils/header-photo-mapper.util';
import { HeaderMediaRepository } from './header-media.repository';

@Injectable()
export class HeaderMediaService {
  constructor(
    private readonly repository: HeaderMediaRepository,
    private readonly galleryService: GalleryService,
  ) {}

  async getPublicHeaderPhotos() {
    const category = await this.findHeaderCategory();
    if (!category) return [];

    const rows = await this.repository.findActivePhotosByCategory(category.id);
    return rows.map((row) => mapHeaderPhoto(row));
  }

  async getAdminHeaderPhotos() {
    const category = await this.ensureHeaderCategory();
    const rows = await this.repository.findAllPhotosByCategory(category.id);
    return rows.map((row) => mapHeaderPhotoAdmin(row));
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
        validateHeroImageDimensions(file);
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
        mapHeaderPhotoAdmin({
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
    const existing = await this.repository.findPhotoInCategory(
      photoId,
      category.id,
    );
    if (!existing) {
      throw new NotFoundException('Header photo not found.');
    }

    const updated = await this.repository.updatePhotoActive(photoId, isActive);
    return {
      message: 'Header photo updated successfully.',
      item: mapHeaderPhotoAdmin(updated),
    };
  }

  async deleteAdminHeaderPhoto(photoId: string) {
    const category = await this.ensureHeaderCategory();
    const existing = await this.repository.findPhotoInCategory(
      photoId,
      category.id,
    );
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
    const existing = await this.repository.findPhotoInCategory(
      photoId,
      category.id,
    );
    if (!existing) {
      throw new NotFoundException('Header photo not found.');
    }

    const updated = await this.repository.updatePhotoFocal(photoId, {
      focalX,
      focalY,
      focalMobileX,
      focalMobileY,
    });
    return {
      message: 'Header photo focus updated successfully.',
      item: mapHeaderPhotoAdmin(updated),
    };
  }

  private async ensureHeaderCategory(): Promise<HeaderCategoryRow> {
    const slug =
      process.env[HEADER_MEDIA_GALLERY_SLUG_ENV]?.trim() ||
      HEADER_MEDIA_FALLBACK_CATEGORY_SLUG;
    const name =
      process.env[HEADER_MEDIA_GALLERY_NAME_ENV]?.trim() ||
      HEADER_MEDIA_FALLBACK_CATEGORY_NAME;

    const bySlug = await this.repository.findHeaderCategoryBySlug(slug);
    if (bySlug) return bySlug;

    return this.repository.createHeaderCategory({ name, slug });
  }

  private async findHeaderCategory(): Promise<HeaderCategoryRow | null> {
    const slug =
      process.env[HEADER_MEDIA_GALLERY_SLUG_ENV]?.trim() ||
      HEADER_MEDIA_FALLBACK_CATEGORY_SLUG;
    return this.repository.findHeaderCategoryBySlug(slug);
  }
}
