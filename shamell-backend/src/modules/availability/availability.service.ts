import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AvailabilityClosureKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { parseHHMM, prismaDateToISODate, zonedWallClock } from './booking-tz';
import type { CreateClosureDto } from './dto/create-closure.dto';
import type { UpsertWeeklySlotsDto } from './dto/upsert-weekly-slots.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  bookingTimeZone(): string {
    return this.config.get<string>('BOOKING_TZ') ?? 'America/New_York';
  }

  private validateWeeklyPayload(dto: UpsertWeeklySlotsDto): void {
    const days = dto.slots.map((s) => s.weekday);
    const uniq = new Set(days);
    if (uniq.size !== 7) {
      throw new BadRequestException(
        'slots must include each weekday 0–6 exactly once.',
      );
    }
    for (const s of dto.slots) {
      if (!s.isClosed) {
        if (!s.startTime || !s.endTime) {
          throw new BadRequestException(
            `Weekday ${s.weekday}: startTime and endTime required when open.`,
          );
        }
        const a = parseHHMM(s.startTime, 'startTime');
        const b = parseHHMM(s.endTime, 'endTime');
        if (b <= a) {
          throw new BadRequestException(
            `Weekday ${s.weekday}: endTime must be after startTime.`,
          );
        }
      }
    }
  }

  async putWeeklySlots(dto: UpsertWeeklySlotsDto) {
    this.validateWeeklyPayload(dto);
    for (const s of dto.slots) {
      await this.prisma.weeklyAvailabilitySlot.upsert({
        where: { weekday: s.weekday },
        create: {
          weekday: s.weekday,
          isClosed: s.isClosed,
          startTime: s.isClosed ? null : (s.startTime ?? null),
          endTime: s.isClosed ? null : (s.endTime ?? null),
        },
        update: {
          isClosed: s.isClosed,
          startTime: s.isClosed ? null : (s.startTime ?? null),
          endTime: s.isClosed ? null : (s.endTime ?? null),
        },
      });
    }
    return this.getAdminSnapshot();
  }

  async createClosure(dto: CreateClosureDto) {
    if (dto.kind === AvailabilityClosureKind.SPECIFIC_DATE) {
      if (!dto.date) {
        throw new BadRequestException(
          'date is required for SPECIFIC_DATE closures.',
        );
      }
      const d = new Date(`${dto.date}T12:00:00.000Z`);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('Invalid date.');
      }
      return this.prisma.availabilityClosure.create({
        data: {
          kind: AvailabilityClosureKind.SPECIFIC_DATE,
          date: d,
          weekday: null,
          note: dto.note?.trim() || null,
        },
      });
    }
    if (dto.kind === AvailabilityClosureKind.DATE_RANGE) {
      if (!dto.startDate || !dto.endDate) {
        throw new BadRequestException(
          'startDate and endDate are required for DATE_RANGE closures.',
        );
      }
      const startDate = new Date(`${dto.startDate}T12:00:00.000Z`);
      const endDate = new Date(`${dto.endDate}T12:00:00.000Z`);
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        throw new BadRequestException('Invalid date range.');
      }
      if (endDate < startDate) {
        throw new BadRequestException(
          'endDate must be equal to or after startDate.',
        );
      }
      return this.prisma.availabilityClosure.create({
        data: {
          kind: AvailabilityClosureKind.DATE_RANGE,
          date: null,
          weekday: null,
          startDate,
          endDate,
          note: dto.note?.trim() || null,
        },
      });
    }
    if (dto.weekday === undefined || dto.weekday === null) {
      throw new BadRequestException(
        'weekday is required for RECURRING_WEEKDAY closures.',
      );
    }
    return this.prisma.availabilityClosure.create({
      data: {
        kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
        date: null,
        weekday: dto.weekday,
        startDate: null,
        endDate: null,
        note: dto.note?.trim() || null,
      },
    });
  }

  async removeClosure(id: string) {
    try {
      await this.prisma.availabilityClosure.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Closure not found.');
    }
    return { ok: true };
  }

  async getPublicRules() {
    const tz = this.bookingTimeZone();
    const [weekly, closures] = await Promise.all([
      this.prisma.weeklyAvailabilitySlot.findMany({
        orderBy: { weekday: 'asc' },
      }),
      this.prisma.availabilityClosure.findMany({
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return {
      timeZone: tz,
      weekly: weekly.map((w) => ({
        weekday: w.weekday,
        isClosed: w.isClosed,
        startTime: w.startTime,
        endTime: w.endTime,
      })),
      closures: closures.map((c) => ({
        kind: c.kind,
        date: c.date ? prismaDateToISODate(c.date) : null,
        weekday: c.weekday,
        startDate: c.startDate ? prismaDateToISODate(c.startDate) : null,
        endDate: c.endDate ? prismaDateToISODate(c.endDate) : null,
        note: c.note?.trim() || null,
      })),
    };
  }

  async getAdminSnapshot() {
    const tz = this.bookingTimeZone();
    const [weekly, closures] = await Promise.all([
      this.prisma.weeklyAvailabilitySlot.findMany({
        orderBy: { weekday: 'asc' },
      }),
      this.prisma.availabilityClosure.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      timeZone: tz,
      weekly: weekly.map((w) => ({
        id: w.id,
        weekday: w.weekday,
        isClosed: w.isClosed,
        startTime: w.startTime,
        endTime: w.endTime,
        updatedAt: w.updatedAt,
      })),
      closures: closures.map((c) => ({
        id: c.id,
        kind: c.kind,
        date: c.date ? prismaDateToISODate(c.date) : null,
        weekday: c.weekday,
        startDate: c.startDate ? prismaDateToISODate(c.startDate) : null,
        endDate: c.endDate ? prismaDateToISODate(c.endDate) : null,
        note: c.note,
        createdAt: c.createdAt,
      })),
    };
  }

  /** Closed by SPECIFIC_DATE, DATE_RANGE, or RECURRING_WEEKDAY. */
  private async isClosedByClosure(
    dateISO: string,
    weekday: number,
  ): Promise<boolean> {
    const dateAtNoon = new Date(`${dateISO}T12:00:00.000Z`);
    const hit = await this.prisma.availabilityClosure.findFirst({
      where: {
        OR: [
          {
            kind: AvailabilityClosureKind.SPECIFIC_DATE,
            date: dateAtNoon,
          },
          {
            kind: AvailabilityClosureKind.DATE_RANGE,
            startDate: { lte: dateAtNoon },
            endDate: { gte: dateAtNoon },
          },
          {
            kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
            weekday,
          },
        ],
      },
      select: { id: true },
    });
    return Boolean(hit);
  }

  /**
   * When no DB row exists for a weekday, the day is treated as fully open (00:00–23:59)
   * unless blocked by a closure.
   */
  async assertDateTimeAllowed(eventDate: Date): Promise<void> {
    const tz = this.bookingTimeZone();
    const { dateISO, weekday, minutesSinceMidnight } = zonedWallClock(
      eventDate,
      tz,
    );

    if (await this.isClosedByClosure(dateISO, weekday)) {
      throw new BadRequestException(
        'That date is not available for bookings (closed or out of service).',
      );
    }

    const slot = await this.prisma.weeklyAvailabilitySlot.findUnique({
      where: { weekday },
    });

    if (!slot || slot.isClosed) {
      if (!slot) return;
      throw new BadRequestException(
        'That date is not available for bookings (weekly schedule is closed).',
      );
    }

    const start = parseHHMM(slot.startTime ?? '00:00', 'startTime');
    const end = parseHHMM(slot.endTime ?? '23:59', 'endTime');
    if (minutesSinceMidnight < start || minutesSinceMidnight > end) {
      throw new BadRequestException(
        'The selected time is outside availability hours for that day.',
      );
    }
  }
}
