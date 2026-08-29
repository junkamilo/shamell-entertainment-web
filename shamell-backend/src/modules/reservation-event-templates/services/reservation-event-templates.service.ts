import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationEventScheduleMode } from '@prisma/client';
import type { CreateReservationEventTemplateDto } from '../dto/create-reservation-event-template.dto';
import type { UpdateReservationEventTemplateDto } from '../dto/update-reservation-event-template.dto';
import type { TemplateWithWeekdays } from '../types/reservation-event-templates.types';
import {
  deriveVenueConfigFromTemplate,
  validateTemplatePayload,
} from '../utils/reservation-event-template.util';
import { mapTemplate } from '../utils/reservation-event-template-mapper.util';
import { ReservationEventTemplatesRepository } from './reservation-event-templates.repository';

@Injectable()
export class ReservationEventTemplatesService {
  constructor(
    private readonly repository: ReservationEventTemplatesRepository,
  ) {}

  // TODO(phase-2): reservation template schedule evaluation for public sales

  async listAdmin(scheduleMode?: ReservationEventScheduleMode) {
    const rows = await this.repository.findManyAdmin(scheduleMode);
    return rows.map((row) => mapTemplate(row));
  }

  async getAdminById(id: string) {
    const row = await this.findByIdOrThrow(id);
    return mapTemplate(row);
  }

  async createAdmin(dto: CreateReservationEventTemplateDto) {
    const validated = validateTemplatePayload(dto);
    const existing = await this.repository.findByName(validated.name);
    if (existing) {
      if (existing.venueConfigs.length > 0) {
        throw new ConflictException(
          `A reservation schedule named "${validated.name}" is already linked to another event. Edit that event or choose a different name.`,
        );
      }
      return this.updateAdmin(existing.id, dto);
    }

    const created = await this.repository.runTransaction(async (tx) => {
      const row = await this.repository.createWithoutClassSections(
        tx,
        this.repository.toPrismaCreateWithoutClassSections(validated),
      );
      await this.repository.replaceClassSections(
        tx,
        row.id,
        validated.classSections,
      );
      const refreshed = await this.repository.findByIdInTx(tx, row.id);
      if (!refreshed) {
        throw new NotFoundException('Reservation event not found.');
      }
      return refreshed;
    });
    return mapTemplate(created);
  }

  async updateAdmin(id: string, dto: UpdateReservationEventTemplateDto) {
    const existing = await this.findByIdOrThrow(id);
    const merged = this.mergeDto(existing, dto);
    const validated = validateTemplatePayload({
      ...merged,
      ...(existing.scheduleMode === ReservationEventScheduleMode.FIXED_EVENT
        ? {
            existingFixedDates: {
              salesStartDate:
                existing.salesStartDate?.toISOString().slice(0, 10) ?? null,
              salesEndDate:
                existing.salesEndDate?.toISOString().slice(0, 10) ?? null,
              eventDate: existing.eventDate?.toISOString().slice(0, 10) ?? null,
            },
          }
        : {}),
    });

    const updated = await this.repository.runTransaction(async (tx) => {
      await this.repository.deleteWeekdays(tx, id);
      await this.repository.replaceClassSections(
        tx,
        id,
        validated.classSections,
      );
      return this.repository.updateWithoutNestedSections(
        tx,
        id,
        this.repository.toPrismaUpdateWithoutNestedSections(validated),
      );
    });

    await this.syncLinkedVenueConfigsFromTemplate(updated);

    return mapTemplate(updated);
  }

  async deleteAdmin(id: string) {
    await this.findByIdOrThrow(id);
    const linked = await this.repository.countLinkedVenueConfigs(id);
    if (linked > 0) {
      throw new ConflictException(
        `This reservation event is linked to ${linked} upcoming event(s). Unlink them before deleting.`,
      );
    }
    await this.repository.deleteTemplate(id);
    return { message: 'Reservation event deleted.' };
  }

  async findByIdOrThrow(id: string): Promise<TemplateWithWeekdays> {
    const row = await this.repository.findById(id);
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
      classSections: dto.classSections?.length
        ? dto.classSections
        : existing.classSections.map((s) => ({
            weekday: s.weekday,
            label: s.label,
            startTime: s.startTime,
            endTime: s.endTime,
            sortOrder: s.sortOrder,
            defaultCapacity: s.defaultCapacity,
            defaultPrice:
              s.defaultPrice != null ? Number(s.defaultPrice) : null,
            isActive: s.isActive,
          })),
    };
  }

  private async syncLinkedVenueConfigsFromTemplate(
    template: TemplateWithWeekdays,
  ): Promise<void> {
    if (template.venueConfigs.length === 0) return;

    const derived = deriveVenueConfigFromTemplate(template);
    const linked = await this.repository.findLinkedVenueConfigsForSync(
      template.id,
    );

    for (const config of linked) {
      const previousMs = config.reservationEventDate?.getTime() ?? null;
      const nextMs = derived.reservationEventDate.getTime();
      await this.repository.updateVenueConfigReservationFields(config.eventId, {
        reservationOpensAt: derived.reservationOpensAt,
        reservationClosesAt: derived.reservationClosesAt,
        reservationEventDate: derived.reservationEventDate,
        reservationEventLabel: derived.reservationEventLabel,
        reservationTimezone: derived.reservationTimezone,
      });
      if (previousMs !== nextMs) {
        await this.repository.syncSeatReservationEventDates(
          config.eventId,
          derived.reservationEventDate,
        );
      }
    }
  }
}
