import { Injectable } from '@nestjs/common';
import { HEADER_PHOTO_SELECT } from '../constants/header-media.constants';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  HeaderCategoryRow,
  HeaderPhotoRow,
} from '../types/header-media.types';

@Injectable()
export class HeaderMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findHeaderCategoryBySlug(slug: string): Promise<HeaderCategoryRow | null> {
    return this.prisma.galleryCategory.findFirst({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
  }

  createHeaderCategory(data: {
    name: string;
    slug: string;
  }): Promise<HeaderCategoryRow> {
    return this.prisma.galleryCategory.create({
      data,
      select: { id: true, name: true, slug: true },
    });
  }

  findActivePhotosByCategory(categoryId: string): Promise<HeaderPhotoRow[]> {
    return this.prisma.galleryPhoto.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
      select: HEADER_PHOTO_SELECT,
    });
  }

  findAllPhotosByCategory(categoryId: string): Promise<HeaderPhotoRow[]> {
    return this.prisma.galleryPhoto.findMany({
      where: { categoryId },
      orderBy: { createdAt: 'desc' },
      select: HEADER_PHOTO_SELECT,
    });
  }

  findPhotoInCategory(
    photoId: string,
    categoryId: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.galleryPhoto.findFirst({
      where: { id: photoId, categoryId },
      select: { id: true },
    });
  }

  updatePhotoActive(
    photoId: string,
    isActive: boolean,
  ): Promise<HeaderPhotoRow> {
    return this.prisma.galleryPhoto.update({
      where: { id: photoId },
      data: { isActive },
      select: HEADER_PHOTO_SELECT,
    });
  }

  updatePhotoFocal(
    photoId: string,
    focal: {
      focalX: number;
      focalY: number;
      focalMobileX: number;
      focalMobileY: number;
    },
  ): Promise<HeaderPhotoRow> {
    return this.prisma.galleryPhoto.update({
      where: { id: photoId },
      data: focal,
      select: HEADER_PHOTO_SELECT,
    });
  }
}
