import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertVenueLayoutSettingsDto } from './dto/upsert-venue-layout-settings.dto';
import { resolveReservationWindow } from './reservation-sales-window.util';

@Injectable()
export class VenueLayoutSettingsService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async isClientEnabled(): Promise<boolean> {
    const row = await this.findLatestRow();
    return row?.clientEnabled ?? false;
  }

  async getPublicSettings() {
    const row = await this.findLatestRow();
    return this.mapSettings(row);
  }

  async getAdminSettings() {
    const row = await this.findLatestRow();
    return row ? this.mapSettingsAdmin(row) : null;
  }

  async upsertAdminSettings(dto: UpsertVenueLayoutSettingsDto) {
    const existing = await this.findLatestRow();

    if (
      dto.reservationOpensAt !== undefined &&
      dto.reservationClosesAt !== undefined
    ) {
      const opens = dto.reservationOpensAt
        ? new Date(dto.reservationOpensAt)
        : null;
      const closes = dto.reservationClosesAt
        ? new Date(dto.reservationClosesAt)
        : null;
      if (opens && closes && closes.getTime() <= opens.getTime()) {
        throw new BadRequestException('Sales close must be after sales open.');
      }
    }

    const saved = existing
      ? await this.prisma.venueLayoutClientSettings.update({
          where: { id: existing.id },
          data: {
            ...(dto.clientEnabled !== undefined
              ? { clientEnabled: dto.clientEnabled }
              : {}),
            ...(dto.promoTitle !== undefined
              ? { promoTitle: dto.promoTitle }
              : {}),
            ...(dto.promoDescription !== undefined
              ? { promoDescription: dto.promoDescription }
              : {}),
            ...(dto.reservationEventDate !== undefined
              ? {
                  reservationEventDate: dto.reservationEventDate
                    ? new Date(dto.reservationEventDate)
                    : null,
                }
              : {}),
            ...(dto.reservationOpensAt !== undefined
              ? {
                  reservationOpensAt: dto.reservationOpensAt
                    ? new Date(dto.reservationOpensAt)
                    : null,
                }
              : {}),
            ...(dto.reservationClosesAt !== undefined
              ? {
                  reservationClosesAt: dto.reservationClosesAt
                    ? new Date(dto.reservationClosesAt)
                    : null,
                }
              : {}),
            ...(dto.reservationEventLabel !== undefined
              ? { reservationEventLabel: dto.reservationEventLabel }
              : {}),
            ...(dto.reservationTimezone !== undefined
              ? { reservationTimezone: dto.reservationTimezone }
              : {}),
          },
        })
      : await this.prisma.venueLayoutClientSettings.create({
          data: {
            clientEnabled: dto.clientEnabled ?? false,
            promoTitle: dto.promoTitle ?? null,
            promoDescription: dto.promoDescription ?? null,
            reservationEventDate: dto.reservationOpensAt
              ? new Date(dto.reservationOpensAt)
              : dto.reservationEventDate
                ? new Date(dto.reservationEventDate)
                : null,
            reservationOpensAt: dto.reservationOpensAt
              ? new Date(dto.reservationOpensAt)
              : null,
            reservationClosesAt: dto.reservationClosesAt
              ? new Date(dto.reservationClosesAt)
              : null,
            reservationEventLabel: dto.reservationEventLabel ?? null,
            reservationTimezone: dto.reservationTimezone ?? 'America/New_York',
          },
        });

    return {
      message: 'On Coming Events settings saved.',
      settings: this.mapSettingsAdmin(saved),
    };
  }

  async patchAdminEnabled(clientEnabled: boolean) {
    const existing = await this.findLatestRow();
    const saved = existing
      ? await this.prisma.venueLayoutClientSettings.update({
          where: { id: existing.id },
          data: { clientEnabled },
        })
      : await this.prisma.venueLayoutClientSettings.create({
          data: { clientEnabled },
        });

    return {
      message: clientEnabled
        ? 'On Coming Events is now visible on the public site.'
        : 'On Coming Events is hidden from the public site.',
      settings: this.mapSettingsAdmin(saved),
    };
  }

  async upsertAdminPromoMedia(mediaFile: Express.Multer.File) {
    if (!mediaFile?.buffer) {
      throw new BadRequestException('Media file is required.');
    }
    if (!mediaFile.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }

    this.ensureCloudinaryEnv();
    const existing = await this.findLatestRow();
    const upload = await this.uploadImageToCloudinary(mediaFile);

    try {
      const saved = existing
        ? await this.prisma.venueLayoutClientSettings.update({
            where: { id: existing.id },
            data: {
              promoImageUrl: upload.secureUrl,
              promoImagePublicId: upload.publicId,
            },
          })
        : await this.prisma.venueLayoutClientSettings.create({
            data: {
              promoImageUrl: upload.secureUrl,
              promoImagePublicId: upload.publicId,
            },
          });

      if (existing?.promoImagePublicId) {
        await this.deleteImageFromCloudinary(existing.promoImagePublicId).catch(
          () => null,
        );
      }

      return {
        message: 'Promo image updated.',
        settings: this.mapSettingsAdmin(saved),
      };
    } catch (error) {
      await this.deleteImageFromCloudinary(upload.publicId).catch(() => null);
      throw error;
    }
  }

  async deleteAdminPromoMedia() {
    const existing = await this.findLatestRow();
    if (!existing) {
      throw new BadRequestException('On Coming Events settings not found.');
    }
    if (!existing.promoImageUrl && !existing.promoImagePublicId) {
      throw new BadRequestException('There is no promo image to remove.');
    }

    if (existing.promoImagePublicId) {
      this.ensureCloudinaryEnv();
      await this.deleteImageFromCloudinary(existing.promoImagePublicId);
    }

    const saved = await this.prisma.venueLayoutClientSettings.update({
      where: { id: existing.id },
      data: {
        promoImageUrl: null,
        promoImagePublicId: null,
      },
    });

    return {
      message: 'Promo image removed.',
      settings: this.mapSettingsAdmin(saved),
    };
  }

  private async findLatestRow() {
    return this.prisma.venueLayoutClientSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  private mapSettings(
    row: {
      clientEnabled: boolean;
      promoTitle: string | null;
      promoDescription: string | null;
      promoImageUrl: string | null;
      reservationEventDate: Date | null;
      reservationOpensAt: Date | null;
      reservationClosesAt: Date | null;
      reservationEventLabel: string | null;
      reservationTimezone: string;
      updatedAt: Date;
    } | null,
  ) {
    const window = resolveReservationWindow({
      reservationOpensAt: row?.reservationOpensAt ?? null,
      reservationClosesAt: row?.reservationClosesAt ?? null,
      reservationEventDate: row?.reservationEventDate ?? null,
    });

    return {
      clientEnabled: row?.clientEnabled ?? false,
      promoTitle: row?.promoTitle ?? null,
      promoDescription: row?.promoDescription ?? null,
      promoImageUrl: row?.promoImageUrl ?? null,
      reservationEventDate: row?.reservationEventDate?.toISOString() ?? null,
      reservationOpensAt: window.opensAt?.toISOString() ?? null,
      reservationClosesAt: window.closesAt?.toISOString() ?? null,
      reservationEventLabel: row?.reservationEventLabel ?? null,
      reservationTimezone: row?.reservationTimezone ?? 'America/New_York',
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  }

  private mapSettingsAdmin(row: {
    id: string;
    clientEnabled: boolean;
    promoTitle: string | null;
    promoDescription: string | null;
    promoImageUrl: string | null;
    promoImagePublicId: string | null;
    reservationEventDate: Date | null;
    reservationOpensAt: Date | null;
    reservationClosesAt: Date | null;
    reservationEventLabel: string | null;
    reservationTimezone: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      ...this.mapSettings(row),
      promoImagePublicId: row.promoImagePublicId,
      createdAt: row.createdAt.toISOString(),
    };
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

  private uploadImageToCloudinary(
    file: Express.Multer.File,
  ): Promise<{ secureUrl: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shamell/on-coming-events',
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
}
