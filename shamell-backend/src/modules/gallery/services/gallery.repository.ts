import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  GalleryCategoryRow,
  GalleryPhotoCreateData,
  GalleryPhotoUpdateData,
  GalleryPublicPhotosWhere,
  PhotoWithCategory,
} from '../types/gallery.types';

@Injectable()
export class GalleryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveCategories(): Promise<GalleryCategoryRow[]> {
    return this.prisma.galleryCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findAllCategories(): Promise<GalleryCategoryRow[]> {
    return this.prisma.galleryCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  findCategoryById(id: string): Promise<{ id: string } | null> {
    return this.prisma.galleryCategory.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findCategoryBySlug(slug: string): Promise<{ id: string } | null> {
    return this.prisma.galleryCategory.findFirst({
      where: { slug },
      select: { id: true },
    });
  }

  findCategorySlugConflict(
    slug: string,
    excludeId?: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.galleryCategory.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
  }

  createCategory(data: {
    name: string;
    slug: string;
  }): Promise<GalleryCategoryRow> {
    return this.prisma.galleryCategory.create({ data });
  }

  updateCategory(
    id: string,
    data: { name?: string; slug?: string; isActive?: boolean },
  ): Promise<GalleryCategoryRow> {
    return this.prisma.galleryCategory.update({
      where: { id },
      data,
    });
  }

  findPublicPhotos(params: {
    where: GalleryPublicPhotosWhere;
    skip: number;
    take: number;
  }): Promise<PhotoWithCategory[]> {
    return this.prisma.galleryPhoto.findMany({
      where: params.where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
      include: { category: true },
    });
  }

  countPublicPhotos(where: GalleryPublicPhotosWhere): Promise<number> {
    return this.prisma.galleryPhoto.count({ where });
  }

  findAllAdminPhotos(): Promise<PhotoWithCategory[]> {
    return this.prisma.galleryPhoto.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  findPhotoById(id: string): Promise<PhotoWithCategory | null> {
    return this.prisma.galleryPhoto.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  createPhoto(data: GalleryPhotoCreateData): Promise<PhotoWithCategory> {
    return this.prisma.galleryPhoto.create({
      data: {
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        mediaType: data.mediaType,
        ...(data.serviceId ? { serviceId: data.serviceId } : {}),
        ...(data.serviceTypeId ? { serviceTypeId: data.serviceTypeId } : {}),
        ...(data.eventId ? { eventId: data.eventId } : {}),
        ...(data.eventTypeId ? { eventTypeId: data.eventTypeId } : {}),
      },
      include: { category: true },
    });
  }

  updatePhoto(
    id: string,
    data: GalleryPhotoUpdateData,
  ): Promise<PhotoWithCategory> {
    return this.prisma.galleryPhoto.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  deletePhoto(id: string) {
    return this.prisma.galleryPhoto.delete({ where: { id } });
  }

  findServiceId(id: string): Promise<{ id: string } | null> {
    return this.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findServiceTypeId(id: string): Promise<{ id: string } | null> {
    return this.prisma.serviceType.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findEventId(id: string): Promise<{ id: string } | null> {
    return this.prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findEventTypeId(id: string): Promise<{ id: string } | null> {
    return this.prisma.eventType.findUnique({
      where: { id },
      select: { id: true },
    });
  }
}
