import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { bookingEligibleEventTypesWhere } from '../../events/utils/booking-inquiry-catalog.util';
import {
  eventTypeCatalogSelect,
  occasionTypeCatalogSelect,
  serviceCatalogSelect,
} from '../constants/agenda.constants';
import type { ServiceCatalogRow } from '../utils/agenda-catalog.util';
import type { AgendarCatalogNamedItem } from '../types/agenda.types';

@Injectable()
export class AgendaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveServicesForCatalog(): Promise<ServiceCatalogRow[]> {
    return this.prisma.service.findMany({
      where: { isActive: true },
      select: serviceCatalogSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  findBookingEligibleEventTypes(): Promise<AgendarCatalogNamedItem[]> {
    return this.prisma.eventType.findMany({
      where: bookingEligibleEventTypesWhere(),
      select: eventTypeCatalogSelect,
      orderBy: { name: 'asc' },
    });
  }

  findActiveOccasionsForCatalog(): Promise<AgendarCatalogNamedItem[]> {
    return this.prisma.occasionType.findMany({
      where: { isActive: true },
      select: occasionTypeCatalogSelect,
      orderBy: { name: 'asc' },
    });
  }
}
