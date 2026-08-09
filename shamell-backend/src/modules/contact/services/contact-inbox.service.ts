import { Injectable } from '@nestjs/common';
import { buildPaginationMeta } from '../../../common/pagination/pagination.util';
import { resolvePeticionesLane } from '../constants/contact.constants';
import { AdminPeticionesQueryDto } from '../dto/admin-peticiones-query.dto';
import { hydratePeticionesPage } from '../utils/peticiones-hydrate.util';
import { ContactRepository } from './contact.repository';

@Injectable()
export class ContactInboxService {
  constructor(private readonly repository: ContactRepository) {}

  async countPeticionesBadge(query: {
    since?: number;
    lane?: string;
  }): Promise<{ count: number }> {
    const lane = resolvePeticionesLane(query.lane);
    const since =
      query.since != null && Number.isFinite(query.since) && query.since > 0
        ? new Date(query.since)
        : null;

    if (lane === 'guidance') {
      return {
        count: await this.repository.countPeticionesBadgeGuidance(since),
      };
    }

    if (lane === 'private_classes') {
      return {
        count: await this.repository.countPeticionesBadgePrivateClasses(since),
      };
    }

    return {
      count: await this.repository.countPeticionesBadgeBookings(since),
    };
  }

  async findAllPeticiones(query: AdminPeticionesQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Number(query.perPage ?? 10);
    const skip = (page - 1) * perPage;
    const lane = resolvePeticionesLane(query.lane);
    const prisma = this.repository.asPrisma();

    if (lane === 'guidance') {
      const totalItems = await this.repository.countGuidanceFeed();
      if (totalItems === 0) {
        return {
          items: [],
          meta: buildPaginationMeta({ page, perPage, totalItems }),
        };
      }

      const feedRows = await this.repository.listGuidanceFeed(skip, perPage);
      return hydratePeticionesPage(prisma, feedRows, page, perPage, totalItems);
    }

    if (lane === 'private_classes') {
      const totalItems = await this.repository.countPrivateClassesFeed();
      if (totalItems === 0) {
        return {
          items: [],
          meta: buildPaginationMeta({ page, perPage, totalItems }),
        };
      }

      const feedRows = await this.repository.listPrivateClassesFeed(
        skip,
        perPage,
      );
      return hydratePeticionesPage(prisma, feedRows, page, perPage, totalItems);
    }

    const [nonConciergeOrphanTotal, bookingTotal] = await Promise.all([
      this.repository.countBookingsLaneOrphans(),
      this.repository.countBookingsLaneNonPrivate(),
    ]);
    const totalItems = bookingTotal + nonConciergeOrphanTotal;
    if (totalItems === 0) {
      return {
        items: [],
        meta: buildPaginationMeta({ page, perPage, totalItems }),
      };
    }

    const feedRows = await this.repository.listBookingsLaneFeed(skip, perPage);
    return hydratePeticionesPage(prisma, feedRows, page, perPage, totalItems);
  }
}
