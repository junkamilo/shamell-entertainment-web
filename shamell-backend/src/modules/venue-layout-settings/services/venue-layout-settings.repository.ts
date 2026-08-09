import { Injectable } from '@nestjs/common';
import {
  EventPublicSection,
  Prisma,
  UpcomingExperienceType,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { VenueLayoutSettingsRow } from '../types/venue-layout-settings.types';

export type VenueLayoutSettingsCreateData = {
  clientEnabled?: boolean;
  promoTitle?: string | null;
  promoDescription?: string | null;
  promoImageUrl?: string | null;
  promoImagePublicId?: string | null;
  reservationEventDate?: Date | null;
  reservationOpensAt?: Date | null;
  reservationClosesAt?: Date | null;
  reservationEventLabel?: string | null;
  reservationTimezone?: string;
};

export type VenueLayoutSettingsUpdateData =
  Prisma.VenueLayoutClientSettingsUpdateInput;

@Injectable()
export class VenueLayoutSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  asPrisma(): PrismaService {
    return this.prisma;
  }

  findLatest(): Promise<VenueLayoutSettingsRow | null> {
    return this.prisma.venueLayoutClientSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(data: VenueLayoutSettingsCreateData): Promise<VenueLayoutSettingsRow> {
    return this.prisma.venueLayoutClientSettings.create({ data });
  }

  update(
    id: string,
    data: VenueLayoutSettingsUpdateData,
  ): Promise<VenueLayoutSettingsRow> {
    return this.prisma.venueLayoutClientSettings.update({
      where: { id },
      data,
    });
  }

  findActiveVenueSeatingEvent(): Promise<{ id: string } | null> {
    return this.prisma.event.findFirst({
      where: {
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: UpcomingExperienceType.VENUE_SEATING,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
  }
}
