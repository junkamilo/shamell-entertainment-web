import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryDeliveryUrl } from '../../common/util/cloudinary-delivery.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async createService(dto: CreateServiceDto, imageFile: Express.Multer.File) {
    if (!imageFile?.buffer) {
      throw new BadRequestException('Image or video file is required.');
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are missing.',
      );
    }

    const imageUrl = await this.uploadServiceMediaToCloudinary(imageFile);

    try {
      const serviceType = await this.prisma.serviceType.findUnique({
        where: { id: dto.serviceTypeId },
        select: { id: true, isActive: true },
      });
      if (!serviceType) {
        throw new NotFoundException('Service type not found.');
      }
      if (!serviceType.isActive) {
        throw new BadRequestException('Service type is inactive.');
      }

      const created = await this.prisma.service.create({
        data: {
          serviceTypeId: dto.serviceTypeId,
          description: dto.description,
          items: dto.items,
          ...(dto.price !== undefined && dto.price !== null
            ? { price: dto.price }
            : {}),
          imageUrl,
        },
        include: {
          serviceType: true,
        },
      });

      return {
        message: 'Service created successfully.',
        service: this.mapService(created),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('A service for this type already exists.');
      }
      throw error;
    }
  }

  async getPublicServices() {
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        serviceType: true,
      },
    });

    return services.map((service) => this.mapPublicService(service));
  }

  /** Public snippet for contact deep-link (active service + active type only). */
  async getPublicCatalogById(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, isActive: true },
      include: { serviceType: true },
    });
    if (!service || !service.serviceType.isActive) {
      throw new NotFoundException('Service not found.');
    }
    const preview = service.description
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280);
    return {
      kind: 'service' as const,
      id: service.id,
      title: service.serviceType.name.trim(),
      description: service.description,
      descriptionPreview: preview || undefined,
      items: service.items,
      imageUrl: this.publicServiceImageUrl(service.imageUrl),
      heroMediaType: this.catalogHeroMediaType(service.imageUrl),
      contactInquiryCode: service.serviceType.contactInquiryCode ?? null,
    };
  }

  /** Public details by contact inquiry code (VIP_EVENT, PRIVATE_GALA, etc). */
  async getPublicServiceByInquiryCode(code: string) {
    const inquiryCode = code.trim().toUpperCase();
    if (!inquiryCode)
      throw new BadRequestException('Inquiry code is required.');

    const service = await this.prisma.service.findFirst({
      where: {
        isActive: true,
        serviceType: {
          isActive: true,
          contactInquiryCode: inquiryCode,
        },
      },
      include: { serviceType: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!service) {
      throw new NotFoundException('Service not found for this inquiry code.');
    }

    const preview = service.description
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280);
    return {
      kind: 'service' as const,
      id: service.id,
      title: service.serviceType.name.trim(),
      description: service.description,
      descriptionPreview: preview || undefined,
      items: service.items,
      imageUrl: this.publicServiceImageUrl(service.imageUrl),
      heroMediaType: this.catalogHeroMediaType(service.imageUrl),
      contactInquiryCode: service.serviceType.contactInquiryCode ?? null,
    };
  }

  async getAdminServices() {
    const services = await this.prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        serviceType: true,
        _count: {
          select: { bookings: true, galleryPhotos: true },
        },
      },
    });

    return services.map((service) => {
      const { _count, ...rest } = service;
      return {
        ...this.mapService(rest),
        bookingCount: _count.bookings,
        galleryPhotoCount: _count.galleryPhotos,
      };
    });
  }

  async getAdminServiceById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        serviceType: true,
      },
    });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    return this.mapService(service);
  }

  async updateService(
    id: string,
    dto: UpdateServiceDto,
    imageFile?: Express.Multer.File,
  ) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });
    if (!existing) {
      throw new NotFoundException('Service not found.');
    }

    if (dto.isActive === false) {
      await this.ensureServiceCanBeDisabled(id);
    }

    let nextImageUrl: string | null | undefined = undefined;

    if (imageFile?.buffer) {
      const newImageUrl = await this.uploadServiceMediaToCloudinary(imageFile);
      try {
        if (existing.imageUrl) {
          await this.deleteImageFromCloudinaryByUrl(existing.imageUrl);
        }
      } catch {
        await this.deleteImageFromCloudinaryByUrl(newImageUrl).catch(
          () => null,
        );
        throw new InternalServerErrorException(
          'Cannot replace previous media in Cloudinary.',
        );
      }
      nextImageUrl = newImageUrl;
    } else if (dto.clearImage === true) {
      if (existing.imageUrl) {
        await this.deleteImageFromCloudinaryByUrl(existing.imageUrl).catch(
          () => null,
        );
      }
      nextImageUrl = null;
    }

    if (dto.serviceTypeId) {
      const serviceType = await this.prisma.serviceType.findUnique({
        where: { id: dto.serviceTypeId },
        select: { id: true, isActive: true },
      });
      if (!serviceType) {
        throw new NotFoundException('Service type not found.');
      }
      if (!serviceType.isActive) {
        throw new BadRequestException('Service type is inactive.');
      }
    }

    const data = {
      ...(dto.serviceTypeId ? { serviceTypeId: dto.serviceTypeId } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.items !== undefined ? { items: dto.items } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(nextImageUrl !== undefined ? { imageUrl: nextImageUrl } : {}),
    };

    try {
      const updated = await this.prisma.service.update({
        where: { id },
        data,
        include: {
          serviceType: true,
        },
      });

      return {
        message: 'Service updated successfully.',
        service: this.mapService(updated),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002' && dto.serviceTypeId) {
        throw new ConflictException('A service for this type already exists.');
      }
      throw error;
    }
  }

  async deleteService(id: string) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });
    if (!existing) {
      throw new NotFoundException('Service not found.');
    }

    await this.ensureServiceCanBeDeleted(id);

    if (existing.imageUrl) {
      await this.deleteImageFromCloudinaryByUrl(existing.imageUrl).catch(
        () => null,
      );
    }

    await this.prisma.service.delete({ where: { id } });

    return {
      message: 'Service deleted successfully.',
    };
  }

  async createServiceType(dto: CreateServiceTypeDto) {
    try {
      const created = await this.prisma.serviceType.create({
        data: {
          name: dto.name,
          contactInquiryCode: null,
        },
      });

      return {
        message: 'Service type created successfully.',
        serviceType: this.mapServiceType(created),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException(
          `Service type "${dto.name}" already exists.`,
        );
      }
      throw error;
    }
  }

  async getPublicServiceTypes() {
    const types = await this.prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return types.map((item) => this.mapServiceType(item));
  }

  async getAdminServiceTypes() {
    const types = await this.prisma.serviceType.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { services: true, galleryPhotos: true },
        },
      },
    });
    return types.map((item) => {
      const { _count, ...rest } = item;
      return {
        ...this.mapServiceType(rest),
        serviceCount: _count.services,
        galleryPhotoCount: _count.galleryPhotos,
      };
    });
  }

  async updateServiceType(id: string, dto: UpdateServiceTypeDto) {
    const existing = await this.prisma.serviceType.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Service type not found.');
    }

    if (dto.isActive === false) {
      await this.ensureServiceTypeCanBeDisabled(id);
    }

    try {
      const updated = await this.prisma.serviceType.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      return {
        message: 'Service type updated successfully.',
        serviceType: this.mapServiceType(updated),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002' && dto.name) {
        throw new ConflictException(
          `Service type "${dto.name}" already exists.`,
        );
      }
      throw error;
    }
  }

  async deleteServiceType(id: string) {
    const existing = await this.prisma.serviceType.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Service type not found.');
    }

    await this.ensureServiceTypeCanBeDeleted(id);

    await this.prisma.serviceType.delete({ where: { id } });

    return {
      message: 'Service type deleted successfully.',
    };
  }

  private async ensureServiceCanBeDisabled(serviceId: string) {
    const bookingCount = await this.prisma.booking.count({
      where: { serviceId },
    });
    if (bookingCount > 0) {
      throw new ConflictException(
        'Cannot disable this service because it has associated bookings.',
      );
    }
  }

  private async ensureServiceCanBeDeleted(serviceId: string) {
    const [bookingCount, galleryCount] = await Promise.all([
      this.prisma.booking.count({ where: { serviceId } }),
      this.prisma.galleryPhoto.count({ where: { serviceId } }),
    ]);
    if (bookingCount > 0) {
      throw new ConflictException(
        'Cannot delete this service because it has associated bookings.',
      );
    }
    if (galleryCount > 0) {
      throw new ConflictException(
        'Cannot delete this service because gallery photos are still linked to it.',
      );
    }
  }

  private publicServiceImageUrl(imageUrl: string | null): string | null {
    if (!imageUrl) return null;
    return cloudinaryDeliveryUrl(imageUrl, { width: 1200 }) ?? imageUrl;
  }

  private mapPublicService(service: {
    id: string;
    serviceType: {
      id: string;
      name: string;
      contactInquiryCode: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    description: string;
    items: string[];
    price: unknown;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const mapped = this.mapService(service);
    return {
      ...mapped,
      imageUrl: this.publicServiceImageUrl(mapped.imageUrl),
    };
  }

  private mapService(service: {
    id: string;
    serviceType: {
      id: string;
      name: string;
      contactInquiryCode: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    description: string;
    items: string[];
    price: unknown;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: service.id,
      serviceTypeId: service.serviceType.id,
      serviceTypeName: service.serviceType.name,
      contactInquiryCode: service.serviceType.contactInquiryCode,
      serviceType: this.mapServiceType(service.serviceType),
      description: service.description,
      items: service.items,
      price: service.price != null ? Number(service.price) : null,
      imageUrl: service.imageUrl,
      heroMediaType: this.catalogHeroMediaType(service.imageUrl),
      isActive: service.isActive,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  private mapServiceType(serviceType: {
    id: string;
    name: string;
    contactInquiryCode: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: serviceType.id,
      name: serviceType.name,
      contactInquiryCode: serviceType.contactInquiryCode,
      isActive: serviceType.isActive,
      createdAt: serviceType.createdAt,
      updatedAt: serviceType.updatedAt,
    };
  }

  private async ensureServiceTypeCanBeDisabled(serviceTypeId: string) {
    const associatedServices = await this.prisma.service.count({
      where: { serviceTypeId },
    });

    if (associatedServices > 0) {
      throw new ConflictException(
        'Cannot disable this service type because it is associated with existing services.',
      );
    }
  }

  private async ensureServiceTypeCanBeDeleted(serviceTypeId: string) {
    const [serviceCount, galleryCount] = await Promise.all([
      this.prisma.service.count({ where: { serviceTypeId } }),
      this.prisma.galleryPhoto.count({ where: { serviceTypeId } }),
    ]);

    if (serviceCount > 0) {
      throw new ConflictException(
        'Cannot delete this service type because it is associated with existing services.',
      );
    }
    if (galleryCount > 0) {
      throw new ConflictException(
        'Cannot delete this service type because gallery photos are still linked to it.',
      );
    }
  }

  private catalogHeroMediaType(
    imageUrl: string | null | undefined,
  ): 'IMAGE' | 'VIDEO' | undefined {
    if (!imageUrl) return undefined;
    const lower = imageUrl.trim().toLowerCase();
    if (
      lower.includes('/video/upload/') ||
      /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(lower)
    ) {
      return 'VIDEO';
    }
    return 'IMAGE';
  }

  private uploadServiceMediaToCloudinary(
    file: Express.Multer.File,
  ): Promise<string> {
    const isVideo = file.mimetype.startsWith('video/');
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shamell/services',
          resource_type: isVideo ? 'video' : 'image',
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(
              new InternalServerErrorException(
                `${isVideo ? 'Video' : 'Image'} upload failed.`,
              ),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  private async deleteImageFromCloudinaryByUrl(imageUrl: string) {
    const publicId = this.extractCloudinaryPublicIdFromUrl(imageUrl);
    if (!publicId) {
      throw new InternalServerErrorException(
        'Cannot resolve Cloudinary media identifier.',
      );
    }

    const resourceType = imageUrl.toLowerCase().includes('/video/upload/')
      ? 'video'
      : 'image';

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

  private extractCloudinaryPublicIdFromUrl(imageUrl: string): string | null {
    const uploadIndex = imageUrl.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const afterUpload = imageUrl.slice(uploadIndex + '/upload/'.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const withoutQuery = withoutVersion.split('?')[0];
    const dotIndex = withoutQuery.lastIndexOf('.');
    if (dotIndex === -1) return withoutQuery;

    return withoutQuery.slice(0, dotIndex);
  }
}
