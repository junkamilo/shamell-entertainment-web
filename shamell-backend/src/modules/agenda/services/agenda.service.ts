import { Injectable } from '@nestjs/common';
import { AdminPaymentsService } from '../../admin-payments/services/admin-payments.service';
import { ContactInboxService } from '../../contact/services/contact-inbox.service';
import type { AgendaHubBadgesQueryDto } from '../dto/agenda-hub-badges-query.dto';
import type {
  AgendaHubBadgesResponse,
  AgendarCatalogResponse,
} from '../types/agenda.types';
import { mapCatalogServices } from '../utils/agenda-catalog.util';
import { AgendaRepository } from './agenda.repository';

@Injectable()
export class AgendaService {
  constructor(
    private readonly repository: AgendaRepository,
    private readonly contactInbox: ContactInboxService,
    private readonly adminPayments: AdminPaymentsService,
  ) {}

  async getHubBadges(
    query: AgendaHubBadgesQueryDto,
  ): Promise<AgendaHubBadgesResponse> {
    const [bookingsLane, guidanceLane, privateClassesLane, payments] =
      await Promise.all([
        this.contactInbox.countPeticionesBadge({
          lane: 'bookings',
          since: query.peticionesBookingsSince,
        }),
        this.contactInbox.countPeticionesBadge({
          lane: 'guidance',
          since: query.peticionesGuidanceSince,
        }),
        this.contactInbox.countPeticionesBadge({
          lane: 'private_classes',
          since: query.peticionesPrivateClassesSince,
        }),
        this.adminPayments.countBadgeSince(query.paymentsSince),
      ]);

    return {
      peticionesBadge:
        bookingsLane.count + guidanceLane.count + privateClassesLane.count,
      paymentHistoryBadge: payments.count,
    };
  }

  /**
   * Aggregated catalog for admin Agendar (event tab).
   * Event types are GENERAL / booking-eligible only — ON COMING hub types are excluded.
   */
  async getAgendarCatalog(): Promise<AgendarCatalogResponse> {
    const [services, eventTypes, occasions] = await Promise.all([
      this.repository.findActiveServicesForCatalog(),
      this.repository.findBookingEligibleEventTypes(),
      this.repository.findActiveOccasionsForCatalog(),
    ]);

    return {
      services: mapCatalogServices(services),
      eventTypes,
      occasions,
    };
  }
}
