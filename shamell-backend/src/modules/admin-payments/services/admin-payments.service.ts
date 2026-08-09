import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildLimitPaginationMeta } from '../../../common/pagination/pagination.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { resolveVenueSeatDisplayLabel } from '../../venue-reservations/utils/venue-seat-display-label.util';
import { TERMINAL_STATUSES } from '../constants/admin-payments.constants';
import type {
  AdminPaymentDetailFlow,
  AdminStripePaymentDetail,
} from '../types/admin-payments-detail.types';
import type {
  AdminStripePaymentRow,
  PaymentListKey,
} from '../types/admin-payments.types';
import type {
  AdminPaymentFlow,
  AdminPaymentsQueryDto,
} from '../dto/admin-payments-query.dto';
import {
  buildVenuePaymentRow,
  mapBookingPayment,
  mapBookingPaymentDetail,
  mapClassEnrollment,
  mapClassEnrollmentDetail,
  mapClassPackageEnrollment,
  mapFixedEnrollment,
  mapFixedEnrollmentDetail,
  mapVenueReservationDetail,
  packagePaymentFlow,
  type VenueRow,
} from '../utils/admin-payments-mapper.util';
import { AdminPaymentsRepository } from './admin-payments.repository';

export { TERMINAL_STATUSES };

@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly repository: AdminPaymentsRepository,
    private readonly prisma: PrismaService,
    private readonly floorLayout: FloorLayoutService,
  ) {}

  async listPayments(query: AdminPaymentsQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const q = query.q?.trim();
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from && Number.isNaN(from.getTime())) {
      throw new BadRequestException('Invalid from date.');
    }
    if (to && Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid to date.');
    }

    const flows: AdminPaymentFlow[] = query.flow
      ? [query.flow]
      : this.repository.defaultFlows();

    const unionParts = this.repository.buildUnionParts(
      flows,
      query.status,
      q,
      from,
      to,
    );
    if (unionParts.length === 0) {
      return {
        items: [],
        meta: buildLimitPaginationMeta({ page, limit, totalItems: 0 }),
      };
    }

    const totalItems = await this.repository.countUnion(unionParts);
    if (totalItems === 0) {
      return {
        items: [],
        meta: buildLimitPaginationMeta({ page, limit, totalItems }),
      };
    }

    const pageRows = await this.repository.listKeys(unionParts, skip, limit);
    const items = await this.hydratePaymentRows(pageRows);

    return {
      items,
      meta: buildLimitPaginationMeta({ page, limit, totalItems }),
    };
  }

  async getPaymentDetail(
    flow: AdminPaymentDetailFlow,
    id: string,
  ): Promise<AdminStripePaymentDetail> {
    switch (flow) {
      case 'BOOKING_QUOTE': {
        const payment = await this.repository.findBookingPaymentById(id);
        if (!payment) {
          throw new NotFoundException('Payment not found.');
        }
        return mapBookingPaymentDetail(payment);
      }
      case 'VENUE_SEAT': {
        const reservation = await this.repository.findVenueReservationById(id);
        if (!reservation) {
          throw new NotFoundException('Payment not found.');
        }
        const seatLabel = await this.resolveVenueSeatLabelForRow(reservation);
        return mapVenueReservationDetail(reservation, seatLabel);
      }
      case 'CLASS_SESSION': {
        const enrollment = await this.repository.findClassEnrollmentById(id);
        if (!enrollment) {
          throw new NotFoundException('Payment not found.');
        }
        return mapClassEnrollmentDetail(enrollment);
      }
      case 'FIXED_TICKET': {
        const enrollment = await this.repository.findFixedEnrollmentById(id);
        if (!enrollment) {
          throw new NotFoundException('Payment not found.');
        }
        return mapFixedEnrollmentDetail(enrollment);
      }
      default:
        throw new BadRequestException('Invalid payment flow.');
    }
  }

  async countBadgeSince(sinceMs?: number): Promise<{ count: number }> {
    const since =
      sinceMs != null && Number.isFinite(sinceMs) && sinceMs > 0
        ? new Date(sinceMs)
        : null;
    if (!since) return { count: 0 };
    const count = await this.repository.countBadgeSince(since);
    return { count };
  }

  private async hydratePaymentRows(
    keys: PaymentListKey[],
  ): Promise<AdminStripePaymentRow[]> {
    if (keys.length === 0) return [];

    const byFlow = new Map<AdminPaymentFlow, string[]>();
    for (const key of keys) {
      const ids = byFlow.get(key.flow) ?? [];
      ids.push(key.id);
      byFlow.set(key.flow, ids);
    }

    const rowByKey = new Map<string, AdminStripePaymentRow>();

    const bookingIds = byFlow.get('BOOKING_QUOTE') ?? [];
    if (bookingIds.length > 0) {
      const rows = await this.repository.findBookingPaymentsByIds(bookingIds);
      for (const row of rows) {
        rowByKey.set(`BOOKING_QUOTE:${row.id}`, mapBookingPayment(row));
      }
    }

    const venueIds = byFlow.get('VENUE_SEAT') ?? [];
    if (venueIds.length > 0) {
      const rows = await this.repository.findVenueReservationsByIds(venueIds);
      for (const row of rows) {
        const seatLabel = await this.resolveVenueSeatLabelForRow(row);
        rowByKey.set(
          `VENUE_SEAT:${row.id}`,
          buildVenuePaymentRow(row, seatLabel),
        );
      }
    }

    const classIds = byFlow.get('CLASS_SESSION') ?? [];
    if (classIds.length > 0) {
      const rows = await this.repository.findClassEnrollmentsByIds(classIds);
      for (const row of rows) {
        rowByKey.set(`CLASS_SESSION:${row.id}`, mapClassEnrollment(row));
      }
    }

    const packageIds = [
      ...(byFlow.get('CLASS_PACKAGE') ?? []),
      ...(byFlow.get('CLASS_DAY_BUNDLE') ?? []),
    ];
    if (packageIds.length > 0) {
      const rows =
        await this.repository.findPackageEnrollmentsByIds(packageIds);
      for (const row of rows) {
        const flow = packagePaymentFlow(row);
        rowByKey.set(`${flow}:${row.id}`, mapClassPackageEnrollment(row, flow));
      }
    }

    const fixedIds = byFlow.get('FIXED_TICKET') ?? [];
    if (fixedIds.length > 0) {
      const rows = await this.repository.findFixedEnrollmentsByIds(fixedIds);
      for (const row of rows) {
        rowByKey.set(`FIXED_TICKET:${row.id}`, mapFixedEnrollment(row));
      }
    }

    return keys
      .map((key) => rowByKey.get(`${key.flow}:${key.id}`))
      .filter((row): row is AdminStripePaymentRow => row != null);
  }

  private async resolveVenueSeatLabelForRow(r: VenueRow): Promise<string> {
    let floorLayoutId: string | null = null;
    if (r.upcomingEventId) {
      floorLayoutId =
        (await this.repository.findFloorLayoutIdForEvent(r.upcomingEventId)) ??
        (await this.floorLayout.getActiveFloorLayoutId());
    } else {
      floorLayoutId = await this.floorLayout.getActiveFloorLayoutId();
    }

    return resolveVenueSeatDisplayLabel(this.prisma, this.floorLayout, {
      kind: r.kind,
      layoutItemId: r.layoutItemId,
      venueTableConfigId: r.venueTableConfigId,
      floorLayoutId,
      venueTableConfig:
        r.venueTableConfig && r.venueTableConfigId
          ? {
              id: r.venueTableConfigId,
              tableName: r.venueTableConfig.tableName,
              size: r.venueTableConfig.size,
            }
          : null,
    });
  }
}
