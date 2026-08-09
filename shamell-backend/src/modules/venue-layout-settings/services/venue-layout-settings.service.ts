import { BadRequestException, Injectable } from '@nestjs/common';
import { syncVenueSeatReservationEventDates } from '../../venue-reservations/utils/sync-venue-seat-reservation-event-date.util';
import { DEFAULT_RESERVATION_TIMEZONE } from '../constants/venue-layout-settings.constants';
import { UpsertVenueLayoutSettingsDto } from '../dto/upsert-venue-layout-settings.dto';
import type { VenueLayoutSettingsRow } from '../types/venue-layout-settings.types';
import { resolveReservationWindow } from '../utils/reservation-sales-window.util';
import { VenueLayoutSettingsMediaService } from './venue-layout-settings-media.service';
import { VenueLayoutSettingsRepository } from './venue-layout-settings.repository';

@Injectable()
export class VenueLayoutSettingsService {
  constructor(
    private readonly repository: VenueLayoutSettingsRepository,
    private readonly media: VenueLayoutSettingsMediaService,
  ) {}

  async isClientEnabled(): Promise<boolean> {
    const row = await this.repository.findLatest();
    return row?.clientEnabled ?? false;
  }

  async getPublicSettings() {
    const row = await this.repository.findLatest();
    return this.mapSettings(row);
  }

  async getAdminSettings() {
    const row = await this.repository.findLatest();
    return row ? this.mapSettingsAdmin(row) : null;
  }

  async upsertAdminSettings(dto: UpsertVenueLayoutSettingsDto) {
    const existing = await this.repository.findLatest();
    const previousEventDateMs =
      existing?.reservationEventDate?.getTime() ?? null;

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
      ? await this.repository.update(existing.id, {
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
        })
      : await this.repository.create({
          clientEnabled: dto.clientEnabled ?? false,
          promoTitle: dto.promoTitle ?? null,
          promoDescription: dto.promoDescription ?? null,
          reservationEventDate: dto.reservationEventDate
            ? new Date(dto.reservationEventDate)
            : null,
          reservationOpensAt: dto.reservationOpensAt
            ? new Date(dto.reservationOpensAt)
            : null,
          reservationClosesAt: dto.reservationClosesAt
            ? new Date(dto.reservationClosesAt)
            : null,
          reservationEventLabel: dto.reservationEventLabel ?? null,
          reservationTimezone:
            dto.reservationTimezone ?? DEFAULT_RESERVATION_TIMEZONE,
        });

    const nextEventDateMs = saved.reservationEventDate?.getTime() ?? null;
    if (
      saved.reservationEventDate &&
      nextEventDateMs !== null &&
      nextEventDateMs !== previousEventDateMs
    ) {
      const venueEvent = await this.repository.findActiveVenueSeatingEvent();
      if (venueEvent) {
        await syncVenueSeatReservationEventDates(
          this.repository.asPrisma(),
          venueEvent.id,
          saved.reservationEventDate,
        );
      }
    }

    return {
      message: 'On Coming Events settings saved.',
      settings: this.mapSettingsAdmin(saved),
    };
  }

  async patchAdminEnabled(clientEnabled: boolean) {
    const existing = await this.repository.findLatest();
    const saved = existing
      ? await this.repository.update(existing.id, { clientEnabled })
      : await this.repository.create({ clientEnabled });

    return {
      message: clientEnabled
        ? 'On Coming Events is now visible on the public site.'
        : 'On Coming Events is hidden from the public site.',
      settings: this.mapSettingsAdmin(saved),
    };
  }

  async upsertAdminPromoMedia(mediaFile: Express.Multer.File) {
    this.media.ensurePromoImageFile(mediaFile);
    const existing = await this.repository.findLatest();
    const upload = await this.media.uploadImage(mediaFile);

    try {
      const saved = existing
        ? await this.repository.update(existing.id, {
            promoImageUrl: upload.secureUrl,
            promoImagePublicId: upload.publicId,
          })
        : await this.repository.create({
            promoImageUrl: upload.secureUrl,
            promoImagePublicId: upload.publicId,
          });

      if (existing?.promoImagePublicId) {
        await this.media
          .deleteImage(existing.promoImagePublicId)
          .catch(() => null);
      }

      return {
        message: 'Promo image updated.',
        settings: this.mapSettingsAdmin(saved),
      };
    } catch (error) {
      await this.media.deleteImage(upload.publicId).catch(() => null);
      throw error;
    }
  }

  async deleteAdminPromoMedia() {
    const existing = await this.repository.findLatest();
    if (!existing) {
      throw new BadRequestException('On Coming Events settings not found.');
    }
    if (!existing.promoImageUrl && !existing.promoImagePublicId) {
      throw new BadRequestException('There is no promo image to remove.');
    }

    if (existing.promoImagePublicId) {
      await this.media.deleteImage(existing.promoImagePublicId);
    }

    const saved = await this.repository.update(existing.id, {
      promoImageUrl: null,
      promoImagePublicId: null,
    });

    return {
      message: 'Promo image removed.',
      settings: this.mapSettingsAdmin(saved),
    };
  }

  private mapSettings(row: VenueLayoutSettingsRow | null) {
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
      reservationTimezone:
        row?.reservationTimezone ?? DEFAULT_RESERVATION_TIMEZONE,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  }

  private mapSettingsAdmin(row: VenueLayoutSettingsRow) {
    return {
      id: row.id,
      ...this.mapSettings(row),
      promoImagePublicId: row.promoImagePublicId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
