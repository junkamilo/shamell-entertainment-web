import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
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
      throw new BadRequestException('Image file is required.');
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new InternalServerErrorException('Cloudinary environment variables are missing.');
    }

    const imageUrl = await this.uploadImageToCloudinary(imageFile);

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

    return services.map((service) => this.mapService(service));
  }

  async getAdminServices() {
    const services = await this.prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        serviceType: true,
      },
    });

    return services.map((service) => this.mapService(service));
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

  async updateService(id: string, dto: UpdateServiceDto, imageFile?: Express.Multer.File) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });
    if (!existing) {
      throw new NotFoundException('Service not found.');
    }

    let imageUrl: string | undefined;
    if (imageFile?.buffer) {
      const newImageUrl = await this.uploadImageToCloudinary(imageFile);
      try {
        if (existing.imageUrl) {
          await this.deleteImageFromCloudinaryByUrl(existing.imageUrl);
        }
      } catch {
        await this.deleteImageFromCloudinaryByUrl(newImageUrl).catch(() => null);
        throw new InternalServerErrorException('Cannot replace previous image in Cloudinary.');
      }
      imageUrl = newImageUrl;
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
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.items !== undefined ? { items: dto.items } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(imageUrl ? { imageUrl } : {}),
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
    const existing = await this.prisma.service.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Service not found.');
    }

    const deleted = await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
      include: {
        serviceType: true,
      },
    });

    return {
      message: 'Service disabled successfully.',
      service: this.mapService(deleted),
    };
  }

  async createServiceType(dto: CreateServiceTypeDto) {
    try {
      const created = await this.prisma.serviceType.create({
        data: { name: dto.name },
      });

      return {
        message: 'Service type created successfully.',
        serviceType: this.mapServiceType(created),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException(`Service type "${dto.name}" already exists.`);
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
    });
    return types.map((item) => this.mapServiceType(item));
  }

  async updateServiceType(id: string, dto: UpdateServiceTypeDto) {
    const existing = await this.prisma.serviceType.findUnique({ where: { id }, select: { id: true } });
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
        throw new ConflictException(`Service type "${dto.name}" already exists.`);
      }
      throw error;
    }
  }

  async deleteServiceType(id: string) {
    const existing = await this.prisma.serviceType.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Service type not found.');
    }

    await this.ensureServiceTypeCanBeDisabled(id);

    const updated = await this.prisma.serviceType.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: 'Service type disabled successfully.',
      serviceType: this.mapServiceType(updated),
    };
  }

  private mapService(service: {
    id: string;
    serviceType: {
      id: string;
      name: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    description: string;
    items: string[];
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: service.id,
      serviceTypeId: service.serviceType.id,
      serviceTypeName: service.serviceType.name,
      serviceType: this.mapServiceType(service.serviceType),
      description: service.description,
      items: service.items,
      imageUrl: service.imageUrl,
      isActive: service.isActive,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  private mapServiceType(serviceType: {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: serviceType.id,
      name: serviceType.name,
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

  private uploadImageToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shamell/services',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(new InternalServerErrorException('Image upload failed.'));
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
      throw new InternalServerErrorException('Cannot resolve Cloudinary image identifier.');
    }

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    const ok = result.result === 'ok' || result.result === 'not found';
    if (!ok) {
      throw new InternalServerErrorException('Cloudinary image deletion failed.');
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
