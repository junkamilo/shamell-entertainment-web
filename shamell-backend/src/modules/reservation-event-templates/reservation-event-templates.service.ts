import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationEventScheduleMode, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReservationEventTemplateDto } from './dto/create-reservation-event-template.dto';
import type { UpdateReservationEventTemplateDto } from './dto/update-reservation-event-template.dto';
import {
  buildTemplateSummary,
  inactiveWeekdays,
  validateTemplatePayload,
  type ClassSectionInput,
  type ValidatedTemplatePayload,
  type WeekdayInput,
} from './reservation-event-template.util';
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const templateInclude = {
  weekdays: { orderBy: { weekday: 'asc' as const } },
  classSections: {
    orderBy: [{ weekday: 'asc' as const }, { sortOrder: 'asc' as const }],
  },
  venueConfigs: { select: { eventId: true } },
} satisfies Prisma.ReservationEventTemplateInclude;

type TemplateWithWeekdays = Prisma.ReservationEventTemplateGetPayload<{
  include: typeof templateInclude;
}>;

@Injectable()
export class ReservationEventTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO(phase-2): reservation template schedule evaluation for public sales

  async listAdmin(scheduleMode?: ReservationEventScheduleMode) {
    const rows = await this.prisma.reservationEventTemplate.findMany({
      where: scheduleMode ? { scheduleMode } : undefined,
      include: templateInclude,
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.mapTemplate(row));
  }

  async getAdminById(id: string) {
    const row = await this.findByIdOrThrow(id);
    return this.mapTemplate(row);
  }

  async createAdmin(dto: CreateReservationEventTemplateDto) {
    const validated = validateTemplatePayload(dto);
    const existing = await this.prisma.reservationEventTemplate.findUnique({
      where: { name: validated.name },
      include: templateInclude,
    });
    if (existing) {
      if (existing.venueConfigs.length > 0) {
        throw new ConflictException(
          `A reservation schedule named "${validated.name}" is already linked to another event. Edit that event or choose a different name.`,
        );
      }
      return this.updateAdmin(existing.id, dto);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.reservationEventTemplate.create({
        data: this.toPrismaCreateWithoutClassSections(validated),
        include: templateInclude,
      });
      await this.replaceClassSections(tx, row.id, validated.classSections);
      return tx.reservationEventTemplate.findUniqueOrThrow({
        where: { id: row.id },
        include: templateInclude,
      });
    });
    return this.mapTemplate(created);
  }

  async updateAdmin(id: string, dto: UpdateReservationEventTemplateDto) {
    const existing = await this.findByIdOrThrow(id);
    const merged = this.mergeDto(existing, dto);
    const validated = validateTemplatePayload(merged);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.reservationEventWeekday.deleteMany({
        where: { templateId: id },
      });
      await this.replaceClassSections(tx, id, validated.classSections);
      return tx.reservationEventTemplate.update({
        where: { id },
        data: this.toPrismaUpdateWithoutNestedSections(validated),
        include: templateInclude,
      });
    });
    return this.mapTemplate(updated);
  }

  async deleteAdmin(id: string) {
    await this.findByIdOrThrow(id);
    const linked = await this.prisma.upcomingVenueConfig.count({
      where: { reservationEventTemplateId: id },
    });
    if (linked > 0) {
      throw new ConflictException(
        `This reservation event is linked to ${linked} upcoming event(s). Unlink them before deleting.`,
      );
    }
    await this.prisma.reservationEventTemplate.delete({ where: { id } });
    return { message: 'Reservation event deleted.' };
  }

  async findByIdOrThrow(id: string): Promise<TemplateWithWeekdays> {
    const row = await this.prisma.reservationEventTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });
    if (!row) {
      throw new NotFoundException('Reservation event not found.');
    }
    return row;
  }

  private mergeDto(
    existing: TemplateWithWeekdays,
    dto: UpdateReservationEventTemplateDto,
  ) {
    const scheduleMode = dto.scheduleMode ?? existing.scheduleMode;
    const base = {
      name: dto.name ?? existing.name,
      timezone: dto.timezone ?? existing.timezone,
      scheduleMode,
    };

    if (scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
      return {
        ...base,
        salesStartDate:
          dto.salesStartDate ??
          existing.salesStartDate?.toISOString().slice(0, 10) ??
          '',
        salesEndDate:
          dto.salesEndDate ??
          existing.salesEndDate?.toISOString().slice(0, 10) ??
          '',
        eventDate:
          dto.eventDate ?? existing.eventDate?.toISOString().slice(0, 10) ?? '',
        eventStartTime: dto.eventStartTime ?? existing.eventStartTime ?? '',
        eventEndTime: dto.eventEndTime ?? existing.eventEndTime ?? '',
      };
    }

    return {
      ...base,
      weekdays:
        dto.weekdays ??
        existing.weekdays.map((w) => ({
          weekday: w.weekday,
          isActive: w.isActive,
        })),
      recurringStartTime:
        dto.recurringStartTime ?? existing.recurringStartTime ?? '',
      recurringEndTime: dto.recurringEndTime ?? existing.recurringEndTime ?? '',
      classSections:
        dto.classSections?.length ?
          dto.classSections
        : existing.classSections.map((s) => ({
          weekday: s.weekday,
          label: s.label,
          startTime: s.startTime,
          endTime: s.endTime,
          sortOrder: s.sortOrder,
          defaultCapacity: s.defaultCapacity,
          defaultPrice: s.defaultPrice != null ? Number(s.defaultPrice) : null,
          isActive: s.isActive,
        })),
    };
  }

  private toPrismaCreateWithoutClassSections(validated: ValidatedTemplatePayload) {
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

  private toPrismaUpdate(validated: ValidatedTemplatePayload) {
    return {
      ...this.toPrismaUpdateWithoutNestedSections(validated),
      weekdays: {
        create: this.normalizeWeekdays(validated.weekdays),
      },
      classSections: {
        create: this.normalizeClassSections(validated.classSections),
      },
    };
  }

  private toPrismaUpdateWithoutNestedSections(validated: ValidatedTemplatePayload) {
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

  /** Upsert sections by (weekday, sortOrder) so IDs stay stable across admin saves. */
  private async replaceClassSections(
    tx: Prisma.TransactionClient,
    templateId: string,
    sections: ValidatedTemplatePayload['classSections'],
  ) {
    const rows = this.normalizeClassSections(sections);
    const keys = rows.map((s) => ({ weekday: s.weekday, sortOrder: s.sortOrder }));

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
      await tx.reservationEventClassSection.deleteMany({ where: { templateId } });
      return;
    }

    await tx.reservationEventClassSection.deleteMany({
      where: {
        templateId,
        NOT: { OR: keys },
      },
    });
  }

  private normalizeClassSections(
    sections: ValidatedTemplatePayload['classSections'],
  ) {
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

  private normalizeWeekdays(weekdays: WeekdayInput[]) {
    const rows =
      weekdays.length === 7 ? weekdays : inactiveWeekdays();
    return rows.map((w) => ({
      weekday: w.weekday,
      isActive: w.isActive,
    }));
  }

  private mapTemplate(row: TemplateWithWeekdays) {
    const activeDays = row.weekdays
      .filter((w) => w.isActive)
      .map((w) => WEEKDAY_LABELS[w.weekday] ?? String(w.weekday));
    return {
      id: row.id,
      name: row.name,
      timezone: row.timezone,
      scheduleMode: row.scheduleMode,
      salesStartDate: row.salesStartDate?.toISOString().slice(0, 10) ?? null,
      salesEndDate: row.salesEndDate?.toISOString().slice(0, 10) ?? null,
      eventDate: row.eventDate?.toISOString().slice(0, 10) ?? null,
      eventStartTime: row.eventStartTime,
      eventEndTime: row.eventEndTime,
      recurringEffectiveFrom:
        row.recurringEffectiveFrom?.toISOString().slice(0, 10) ?? null,
      recurringStartTime: row.recurringStartTime,
      recurringEndTime: row.recurringEndTime,
      startDate: row.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: row.endDate?.toISOString().slice(0, 10) ?? null,
      startTime: row.startTime,
      endTime: row.endTime,
      weekdays: row.weekdays.map((w) => ({
        weekday: w.weekday,
        isActive: w.isActive,
      })),
      classSections: row.classSections.map((s) => ({
        id: s.id,
        weekday: s.weekday,
        label: s.label,
        startTime: s.startTime,
        endTime: s.endTime,
        sortOrder: s.sortOrder,
        defaultCapacity: s.defaultCapacity,
        defaultPrice: s.defaultPrice != null ? Number(s.defaultPrice) : null,
        isActive: s.isActive,
      })),
      activeDayLabels: activeDays,
      summary: buildTemplateSummary(row),
      linkedEventIds: row.venueConfigs.map((config) => config.eventId),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
