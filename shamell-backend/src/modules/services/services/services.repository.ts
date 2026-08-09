import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ServiceCreateData,
  ServiceImageSelect,
  ServiceTypeRow,
  ServiceTypeSelectIdActive,
  ServiceTypeWithCounts,
  ServiceUpdateData,
  ServiceWithType,
  ServiceWithTypeAndCounts,
} from '../types/services.types';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveServicesWithType(): Promise<ServiceWithType[]> {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: { serviceType: true },
    });
  }

  findAllServicesWithTypeAndCounts(): Promise<ServiceWithTypeAndCounts[]> {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        serviceType: true,
        _count: {
          select: { bookings: true, galleryPhotos: true },
        },
      },
    });
  }

  findServiceByIdWithType(id: string): Promise<ServiceWithType | null> {
    return this.prisma.service.findUnique({
      where: { id },
      include: { serviceType: true },
    });
  }

  findActiveServiceByIdWithType(id: string): Promise<ServiceWithType | null> {
    return this.prisma.service.findFirst({
      where: { id, isActive: true },
      include: { serviceType: true },
    });
  }

  findActiveServiceByInquiryCode(
    inquiryCode: string,
  ): Promise<ServiceWithType | null> {
    return this.prisma.service.findFirst({
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
  }

  findServiceImageById(id: string): Promise<ServiceImageSelect | null> {
    return this.prisma.service.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });
  }

  createService(data: ServiceCreateData): Promise<ServiceWithType> {
    return this.prisma.service.create({
      data: {
        serviceTypeId: data.serviceTypeId,
        description: data.description,
        items: data.items,
        ...(data.price !== undefined && data.price !== null
          ? { price: data.price }
          : {}),
        imageUrl: data.imageUrl,
      },
      include: { serviceType: true },
    });
  }

  updateService(id: string, data: ServiceUpdateData): Promise<ServiceWithType> {
    return this.prisma.service.update({
      where: { id },
      data,
      include: { serviceType: true },
    });
  }

  async deleteService(id: string): Promise<void> {
    await this.prisma.service.delete({ where: { id } });
  }

  findServiceTypeIdActive(
    id: string,
  ): Promise<ServiceTypeSelectIdActive | null> {
    return this.prisma.serviceType.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
  }

  findServiceTypeById(id: string): Promise<ServiceTypeRow | null> {
    return this.prisma.serviceType.findUnique({ where: { id } });
  }

  findServiceTypeIdOnly(id: string): Promise<{ id: string } | null> {
    return this.prisma.serviceType.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  findActiveServiceTypes(): Promise<ServiceTypeRow[]> {
    return this.prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findAllServiceTypesWithCounts(): Promise<ServiceTypeWithCounts[]> {
    return this.prisma.serviceType.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { services: true, galleryPhotos: true },
        },
      },
    });
  }

  createServiceType(name: string): Promise<ServiceTypeRow> {
    return this.prisma.serviceType.create({
      data: {
        name,
        contactInquiryCode: null,
      },
    });
  }

  updateServiceType(
    id: string,
    data: { name?: string; isActive?: boolean },
  ): Promise<ServiceTypeRow> {
    return this.prisma.serviceType.update({
      where: { id },
      data,
    });
  }

  async deleteServiceType(id: string): Promise<void> {
    await this.prisma.serviceType.delete({ where: { id } });
  }

  countBookingsByServiceId(serviceId: string): Promise<number> {
    return this.prisma.booking.count({ where: { serviceId } });
  }

  countGalleryByServiceId(serviceId: string): Promise<number> {
    return this.prisma.galleryPhoto.count({ where: { serviceId } });
  }

  countServicesByTypeId(serviceTypeId: string): Promise<number> {
    return this.prisma.service.count({ where: { serviceTypeId } });
  }

  countGalleryByServiceTypeId(serviceTypeId: string): Promise<number> {
    return this.prisma.galleryPhoto.count({ where: { serviceTypeId } });
  }
}
