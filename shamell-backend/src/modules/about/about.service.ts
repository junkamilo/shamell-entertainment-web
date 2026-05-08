import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertAboutContentDto } from './dto/upsert-about-content.dto';

@Injectable()
export class AboutService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getPublicAboutContent() {
    const latest = await this.prisma.aboutContent.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!latest) {
      throw new NotFoundException('About content not found.');
    }
    return this.mapAboutContent(latest);
  }

  async getAdminAboutContent() {
    const latest = await this.prisma.aboutContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    return latest ? this.mapAboutContent(latest) : null;
  }

  async upsertAdminAboutContent(
    dto: UpsertAboutContentDto,
    imageFile?: Express.Multer.File,
  ) {
    const existing = await this.prisma.aboutContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const isCreating = !existing;
    if (isCreating) {
      this.ensureRequiredForCreate(dto, imageFile);
    }

    let newImageUpload: { secureUrl: string; publicId: string } | null = null;
    if (imageFile) {
      this.ensureImageFile(imageFile);
      this.ensureCloudinaryEnv();
      newImageUpload = await this.uploadImageToCloudinary(imageFile);
    }

    try {
      const saved = existing
        ? await this.prisma.aboutContent.update({
            where: { id: existing.id },
            data: {
              ...(dto.title !== undefined ? { title: dto.title } : {}),
              ...(dto.paragraph1 !== undefined
                ? { paragraph1: dto.paragraph1 }
                : {}),
              ...(dto.coreValues !== undefined
                ? { coreValues: dto.coreValues }
                : {}),
              ...(newImageUpload
                ? {
                    imageUrl: newImageUpload.secureUrl,
                    imagePublicId: newImageUpload.publicId,
                  }
                : {}),
            },
          })
        : await this.prisma.aboutContent.create({
            data: {
              title: dto.title!,
              paragraph1: dto.paragraph1!,
              coreValues: dto.coreValues!,
              imageUrl: newImageUpload?.secureUrl ?? null,
              imagePublicId: newImageUpload?.publicId ?? null,
              isActive: true,
            },
          });

      if (newImageUpload && existing?.imagePublicId) {
        await this.deleteImageFromCloudinary(existing.imagePublicId).catch(
          () => null,
        );
      }

      return {
        message: isCreating
          ? 'About content created successfully.'
          : 'About content updated successfully.',
        about: this.mapAboutContent(saved),
      };
    } catch (error) {
      if (newImageUpload) {
        await this.deleteImageFromCloudinary(newImageUpload.publicId).catch(
          () => null,
        );
      }
      throw error;
    }
  }

  private ensureRequiredForCreate(
    dto: UpsertAboutContentDto,
    imageFile?: Express.Multer.File,
  ) {
    if (!dto.title || !dto.paragraph1 || !dto.coreValues?.length) {
      throw new BadRequestException(
        'Title, paragraph1, and at least one core value are required.',
      );
    }
    if (!imageFile) {
      throw new BadRequestException(
        'Image file is required to create about content.',
      );
    }
  }

  private ensureCloudinaryEnv() {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are missing.',
      );
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

  private uploadImageToCloudinary(
    file: Express.Multer.File,
  ): Promise<{ secureUrl: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shamell/about',
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
    const destroyResult = (await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    })) as { result?: string };
    const ok =
      destroyResult.result === 'ok' || destroyResult.result === 'not found';
    if (!ok) {
      throw new InternalServerErrorException(
        'Cloudinary image deletion failed.',
      );
    }
  }

  private mapAboutContent(content: {
    id: string;
    title: string;
    paragraph1: string;
    coreValues: string[];
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: content.id,
      title: content.title,
      paragraph1: content.paragraph1,
      coreValues: content.coreValues,
      imageUrl: content.imageUrl,
      isActive: content.isActive,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }
}
