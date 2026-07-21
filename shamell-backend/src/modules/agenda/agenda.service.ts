import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminPaymentsService } from '../admin-payments/admin-payments.service';
import { ContactInboxService } from '../contact/contact-inbox.service';
import type { AgendaHubBadgesQueryDto } from './dto/agenda-hub-badges-query.dto';

@Injectable()
export class AgendaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contactInbox: ContactInboxService,
    private readonly adminPayments: AdminPaymentsService,
  ) {}

  async getHubBadges(query: AgendaHubBadgesQueryDto) {
    const [bookingsLane, guidanceLane, payments] = await Promise.all([
      this.contactInbox.countPeticionesBadge({
        lane: 'bookings',
        since: query.peticionesBookingsSince,
      }),
      this.contactInbox.countPeticionesBadge({
        lane: 'guidance',
        since: query.peticionesGuidanceSince,
      }),
      this.adminPayments.countBadgeSince(query.paymentsSince),
    ]);

    return {
      peticionesBadge: bookingsLane.count + guidanceLane.count,
      paymentHistoryBadge: payments.count,
    };
  }

  /**
   * Aggregated catalog for admin Agendar (event tab).
   * Replaces three separate HTTP calls from the frontend.
   */
  async getAgendarCatalog() {
    const [services, eventTypes, occasions] = await Promise.all([
      this.prisma.service.findMany({
        where: { isActive: true },
        select: {
          id: true,
          serviceType: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.eventType.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.occasionType.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      services: services.map((row) => ({
        id: row.id,
        serviceTypeName: row.serviceType.name,
      })),
      eventTypes,
      occasions,
    };
  }
}
