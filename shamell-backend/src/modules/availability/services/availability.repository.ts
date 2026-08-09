import { Injectable } from '@nestjs/common';
import { AvailabilityClosureKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { WeeklySlotUpsertInput } from '../types/availability.types';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWeeklySlots() {
    return this.prisma.weeklyAvailabilitySlot.findMany({
      orderBy: { weekday: 'asc' },
    });
  }

  findClosures(order: 'asc' | 'desc' = 'asc') {
    return this.prisma.availabilityClosure.findMany({
      orderBy: { createdAt: order },
    });
  }

  findWeeklySlotByWeekday(weekday: number) {
    return this.prisma.weeklyAvailabilitySlot.findUnique({
      where: { weekday },
    });
  }

  async upsertAllWeeklySlots(slots: WeeklySlotUpsertInput[]): Promise<void> {
    await this.prisma.$transaction(
      slots.map((s) =>
        this.prisma.weeklyAvailabilitySlot.upsert({
          where: { weekday: s.weekday },
          create: {
            weekday: s.weekday,
            isClosed: s.isClosed,
            startTime: s.startTime,
            endTime: s.endTime,
          },
          update: {
            isClosed: s.isClosed,
            startTime: s.startTime,
            endTime: s.endTime,
          },
        }),
      ),
    );
  }

  createClosure(data: Prisma.AvailabilityClosureCreateInput) {
    return this.prisma.availabilityClosure.create({ data });
  }

  deleteClosure(id: string) {
    return this.prisma.availabilityClosure.delete({ where: { id } });
  }

  findBlockingClosure(dateISO: string, weekday: number) {
    const dateAtNoon = new Date(`${dateISO}T12:00:00.000Z`);
    return this.prisma.availabilityClosure.findFirst({
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
  }
}
