import { Injectable } from '@nestjs/common';
import { ReservationEventScheduleMode, type Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TEMPLATE_INCLUDE } from '../constants/reservation-event-templates.constants';
import type {
  TemplateWithWeekdays,
  ValidatedTemplatePayload,
  WeekdayInput,
} from '../types/reservation-event-templates.types';
import { inactiveWeekdays } from '../utils/reservation-event-template.util';
import { syncVenueSeatReservationEventDates } from '../../venue-reservations/utils/sync-venue-seat-reservation-event-date.util';

export type NormalizedClassSectionRow = {
  weekday: number;
  label: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  defaultCapacity: number;
  defaultPrice: number;
  isActive: boolean;
};

@Injectable()
export class ReservationEventTemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findManyAdmin(
    scheduleMode?: ReservationEventScheduleMode,
  ): Promise<TemplateWithWeekdays[]> {
    return this.prisma.reservationEventTemplate.findMany({
      where: scheduleMode ? { scheduleMode } : undefined,
      include: TEMPLATE_INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string): Promise<TemplateWithWeekdays | null> {
    return this.prisma.reservationEventTemplate.findUnique({
      where: { id },
      include: TEMPLATE_INCLUDE,
    });
  }

  findByName(name: string): Promise<TemplateWithWeekdays | null> {
    return this.prisma.reservationEventTemplate.findUnique({
      where: { name },
      include: TEMPLATE_INCLUDE,
    });
  }

  createWithoutClassSections(
    tx: Prisma.TransactionClient,
    data: ReturnType<
      ReservationEventTemplatesRepository['toPrismaCreateWithoutClassSections']
    >,
  ): Promise<TemplateWithWeekdays> {
    return tx.reservationEventTemplate.create({
      data,
      include: TEMPLATE_INCLUDE,
    });
  }

  findByIdInTx(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<TemplateWithWeekdays | null> {
    return tx.reservationEventTemplate.findUnique({
      where: { id },
      include: TEMPLATE_INCLUDE,
    });
  }

  async deleteWeekdays(
    tx: Prisma.TransactionClient,
    templateId: string,
  ): Promise<void> {
    await tx.reservationEventWeekday.deleteMany({
      where: { templateId },
    });
  }

  updateWithoutNestedSections(
    tx: Prisma.TransactionClient,
    id: string,
    data: ReturnType<
      ReservationEventTemplatesRepository['toPrismaUpdateWithoutNestedSections']
    >,
  ): Promise<TemplateWithWeekdays> {
    return tx.reservationEventTemplate.update({
      where: { id },
      data,
      include: TEMPLATE_INCLUDE,
    });
  }

  /** Upsert sections by (weekday, sortOrder) so IDs stay stable across admin saves. */
  async replaceClassSections(
    tx: Prisma.TransactionClient,
    templateId: string,
    sections: ValidatedTemplatePayload['classSections'],
  ): Promise<void> {
    const rows = this.normalizeClassSections(sections);
    const keys = rows.map((s) => ({
      weekday: s.weekday,
      sortOrder: s.sortOrder,
    }));

    for (const row of rows) {
      await tx.reservationEventClassSection.upsert({
        where: {
          templateId_weekday_sortOrder: {
            templateId,
            weekday: row.weekday,
            sortOrder: row.sortOrder,
          },
        },
        create: { templateId, ...row },
        update: {
          label: row.label,
          startTime: row.startTime,
          endTime: row.endTime,
          defaultCapacity: row.defaultCapacity,
          defaultPrice: row.defaultPrice,
          isActive: row.isActive,
        },
      });
    }

    if (keys.length === 0) {
      await tx.reservationEventClassSection.deleteMany({
        where: { templateId },
      });
      return;
    }

    await tx.reservationEventClassSection.deleteMany({
      where: {
        templateId,
        NOT: { OR: keys },
      },
    });
  }

  countLinkedVenueConfigs(templateId: string): Promise<number> {
    return this.prisma.upcomingVenueConfig.count({
      where: { reservationEventTemplateId: templateId },
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.prisma.reservationEventTemplate.delete({ where: { id } });
  }

  findLinkedVenueConfigsForSync(
    templateId: string,
  ): Promise<Array<{ eventId: string; reservationEventDate: Date | null }>> {
    return this.prisma.upcomingVenueConfig.findMany({
      where: { reservationEventTemplateId: templateId },
      select: { eventId: true, reservationEventDate: true },
    });
  }

  async updateVenueConfigReservationFields(
    eventId: string,
    data: {
      reservationOpensAt: Date;
      reservationClosesAt: Date;
      reservationEventDate: Date;
      reservationEventLabel: string;
      reservationTimezone: string;
    },
  ): Promise<void> {
    await this.prisma.upcomingVenueConfig.update({
      where: { eventId },
      data,
    });
  }

  async syncSeatReservationEventDates(
    eventId: string,
    reservationEventDate: Date,
  ): Promise<void> {
    await syncVenueSeatReservationEventDates(
      this.prisma,
      eventId,
      reservationEventDate,
    );
  }

  toPrismaCreateWithoutClassSections(validated: ValidatedTemplatePayload) {
    return {
      name: validated.name,
      timezone: validated.timezone,
      scheduleMode: validated.scheduleMode,
      salesStartDate: validated.salesStartDate,
      salesEndDate: validated.salesEndDate,
      eventDate: validated.eventDate,
      eventStartTime: validated.eventStartTime,
      eventEndTime: validated.eventEndTime,
      recurringEffectiveFrom: validated.recurringEffectiveFrom,
      recurringStartTime: validated.recurringStartTime,
      recurringEndTime: validated.recurringEndTime,
      startDate: validated.salesStartDate ?? validated.recurringEffectiveFrom,
      endDate: validated.salesEndDate ?? validated.recurringEffectiveFrom,
      startTime: validated.eventStartTime ?? validated.recurringStartTime,
      endTime: validated.eventEndTime ?? validated.recurringEndTime,
      weekdays: {
        create: this.normalizeWeekdays(validated.weekdays),
      },
    };
  }

  toPrismaUpdateWithoutNestedSections(validated: ValidatedTemplatePayload) {
    return {
      name: validated.name,
      timezone: validated.timezone,
      scheduleMode: validated.scheduleMode,
      salesStartDate: validated.salesStartDate,
      salesEndDate: validated.salesEndDate,
      eventDate: validated.eventDate,
      eventStartTime: validated.eventStartTime,
      eventEndTime: validated.eventEndTime,
      recurringEffectiveFrom: validated.recurringEffectiveFrom,
      recurringStartTime: validated.recurringStartTime,
      recurringEndTime: validated.recurringEndTime,
      startDate: validated.salesStartDate ?? validated.recurringEffectiveFrom,
      endDate: validated.salesEndDate ?? validated.recurringEffectiveFrom,
      startTime: validated.eventStartTime ?? validated.recurringStartTime,
      endTime: validated.eventEndTime ?? validated.recurringEndTime,
      weekdays: {
        create: this.normalizeWeekdays(validated.weekdays),
      },
    };
  }

  normalizeClassSections(
    sections: ValidatedTemplatePayload['classSections'],
  ): NormalizedClassSectionRow[] {
    return sections.map((s) => ({
      weekday: s.weekday,
      label: s.label,
      startTime: s.startTime,
      endTime: s.endTime,
      sortOrder: s.sortOrder,
      defaultCapacity: s.defaultCapacity,
      defaultPrice: s.defaultPrice,
      isActive: s.isActive,
    }));
  }

  normalizeWeekdays(weekdays: WeekdayInput[]) {
    const rows = weekdays.length === 7 ? weekdays : inactiveWeekdays();
    return rows.map((w) => ({
      weekday: w.weekday,
      isActive: w.isActive,
    }));
  }
}
