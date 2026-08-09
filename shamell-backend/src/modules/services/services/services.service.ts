import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceDto } from '../dto/create-service.dto';
import { CreateServiceTypeDto } from '../dto/create-service-type.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { UpdateServiceTypeDto } from '../dto/update-service-type.dto';
import {
  mapCatalogSnippet,
  mapPublicService,
  mapService,
  mapServiceType,
} from '../utils/services-mapper.util';
import { ServicesMediaService } from './services-media.service';
import { ServicesRepository } from './services.repository';

@Injectable()
export class ServicesService {
  constructor(
    private readonly repository: ServicesRepository,
    private readonly media: ServicesMediaService,
  ) {}

  async createService(dto: CreateServiceDto, imageFile: Express.Multer.File) {
    if (!imageFile?.buffer) {
      throw new BadRequestException('Image or video file is required.');
    }

    this.media.ensureCloudinaryEnv();
    const imageUrl = await this.media.uploadServiceMediaToCloudinary(imageFile);

    try {
      const serviceType = await this.repository.findServiceTypeIdActive(
        dto.serviceTypeId,
      );
      if (!serviceType) {
        throw new NotFoundException('Service type not found.');
      }
      if (!serviceType.isActive) {
        throw new BadRequestException('Service type is inactive.');
      }

      const created = await this.repository.createService({
        serviceTypeId: dto.serviceTypeId,
        description: dto.description,
        items: dto.items,
        ...(dto.price !== undefined && dto.price !== null
          ? { price: dto.price }
          : {}),
        imageUrl,
      });

      return {
        message: 'Service created successfully.',
        service: mapService(created),
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
    const services = await this.repository.findActiveServicesWithType();
    return services.map((service) => mapPublicService(service));
  }

  /** Public snippet for contact deep-link (active service + active type only). */
  async getPublicCatalogById(id: string) {
    const service = await this.repository.findActiveServiceByIdWithType(id);
    if (!service || !service.serviceType.isActive) {
      throw new NotFoundException('Service not found.');
    }
    return mapCatalogSnippet(service);
  }

  /** Public details by contact inquiry code (VIP_EVENT, PRIVATE_GALA, etc). */
  async getPublicServiceByInquiryCode(code: string) {
    const inquiryCode = code.trim().toUpperCase();
    if (!inquiryCode) {
      throw new BadRequestException('Inquiry code is required.');
    }

    const service =
      await this.repository.findActiveServiceByInquiryCode(inquiryCode);
    if (!service) {
      throw new NotFoundException('Service not found for this inquiry code.');
    }

    return mapCatalogSnippet(service);
  }

  async getAdminServices() {
    const services = await this.repository.findAllServicesWithTypeAndCounts();
    return services.map((service) => {
      const { _count, ...rest } = service;
      return {
        ...mapService(rest),
        bookingCount: _count.bookings,
        galleryPhotoCount: _count.galleryPhotos,
      };
    });
  }

  async getAdminServiceById(id: string) {
    const service = await this.repository.findServiceByIdWithType(id);
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    return mapService(service);
  }

  async updateService(
    id: string,
    dto: UpdateServiceDto,
    imageFile?: Express.Multer.File,
  ) {
    const existing = await this.repository.findServiceImageById(id);
    if (!existing) {
      throw new NotFoundException('Service not found.');
    }

    if (dto.isActive === false) {
      await this.ensureServiceCanBeDisabled(id);
    }

    let nextImageUrl: string | null | undefined = undefined;

    if (imageFile?.buffer) {
      const newImageUrl =
        await this.media.uploadServiceMediaToCloudinary(imageFile);
      try {
        if (existing.imageUrl) {
          await this.media.deleteImageFromCloudinaryByUrl(existing.imageUrl);
        }
      } catch {
        await this.media
          .deleteImageFromCloudinaryByUrl(newImageUrl)
          .catch(() => null);
        throw new InternalServerErrorException(
          'Cannot replace previous media in Cloudinary.',
        );
      }
      nextImageUrl = newImageUrl;
    } else if (dto.clearImage === true) {
      if (existing.imageUrl) {
        await this.media
          .deleteImageFromCloudinaryByUrl(existing.imageUrl)
          .catch(() => null);
      }
      nextImageUrl = null;
    }

    if (dto.serviceTypeId) {
      const serviceType = await this.repository.findServiceTypeIdActive(
        dto.serviceTypeId,
      );
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
      const updated = await this.repository.updateService(id, data);
      return {
        message: 'Service updated successfully.',
        service: mapService(updated),
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
    const existing = await this.repository.findServiceImageById(id);
    if (!existing) {
      throw new NotFoundException('Service not found.');
    }

    await this.ensureServiceCanBeDeleted(id);

    if (existing.imageUrl) {
      await this.media
        .deleteImageFromCloudinaryByUrl(existing.imageUrl)
        .catch(() => null);
    }

    await this.repository.deleteService(id);

    return {
      message: 'Service deleted successfully.',
    };
  }

  async createServiceType(dto: CreateServiceTypeDto) {
    try {
      const created = await this.repository.createServiceType(dto.name);
      return {
        message: 'Service type created successfully.',
        serviceType: mapServiceType(created),
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
    const types = await this.repository.findActiveServiceTypes();
    return types.map((item) => mapServiceType(item));
  }

  async getAdminServiceTypes() {
    const types = await this.repository.findAllServiceTypesWithCounts();
    return types.map((item) => {
      const { _count, ...rest } = item;
      return {
        ...mapServiceType(rest),
        serviceCount: _count.services,
        galleryPhotoCount: _count.galleryPhotos,
      };
    });
  }

  async updateServiceType(id: string, dto: UpdateServiceTypeDto) {
    const existing = await this.repository.findServiceTypeIdOnly(id);
    if (!existing) {
      throw new NotFoundException('Service type not found.');
    }

    if (dto.isActive === false) {
      await this.ensureServiceTypeCanBeDisabled(id);
    }

    try {
      const updated = await this.repository.updateServiceType(id, {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      });

      return {
        message: 'Service type updated successfully.',
        serviceType: mapServiceType(updated),
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
    const existing = await this.repository.findServiceTypeIdOnly(id);
    if (!existing) {
      throw new NotFoundException('Service type not found.');
    }

    await this.ensureServiceTypeCanBeDeleted(id);
    await this.repository.deleteServiceType(id);

    return {
      message: 'Service type deleted successfully.',
    };
  }

  private async ensureServiceCanBeDisabled(serviceId: string) {
    const bookingCount =
      await this.repository.countBookingsByServiceId(serviceId);
    if (bookingCount > 0) {
      throw new ConflictException(
        'Cannot disable this service because it has associated bookings.',
      );
    }
  }

  private async ensureServiceCanBeDeleted(serviceId: string) {
    const [bookingCount, galleryCount] = await Promise.all([
      this.repository.countBookingsByServiceId(serviceId),
      this.repository.countGalleryByServiceId(serviceId),
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

  private async ensureServiceTypeCanBeDisabled(serviceTypeId: string) {
    const associatedServices =
      await this.repository.countServicesByTypeId(serviceTypeId);

    if (associatedServices > 0) {
      throw new ConflictException(
        'Cannot disable this service type because it is associated with existing services.',
      );
    }
  }

  private async ensureServiceTypeCanBeDeleted(serviceTypeId: string) {
    const [serviceCount, galleryCount] = await Promise.all([
      this.repository.countServicesByTypeId(serviceTypeId),
      this.repository.countGalleryByServiceTypeId(serviceTypeId),
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
}
