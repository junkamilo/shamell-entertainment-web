import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(dto: CreateEventDto) {
    const eventType = await this.prisma.eventType.findUnique({
      where: { id: dto.eventTypeId },
      select: { id: true, isActive: true },
    });
    if (!eventType) throw new NotFoundException('Event type not found.');
    if (!eventType.isActive) throw new BadRequestException('Event type is inactive.');

    try {
      const created = await this.prisma.event.create({
        data: {
          eventTypeId: dto.eventTypeId,
          description: dto.description,
          items: dto.items,
        },
        include: { eventType: true },
      });

      return {
        message: 'Event created successfully.',
        event: this.mapEvent(created),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('An event for this type already exists.');
      }
      throw error;
    }
  }

  async getPublicEvents() {
    const events = await this.prisma.event.findMany({
      where: { isActive: true },
      include: { eventType: true },
      orderBy: { createdAt: 'asc' },
    });
    return events.map((item) => this.mapEvent(item));
  }

  async getAdminEvents() {
    const events = await this.prisma.event.findMany({
      include: { eventType: true },
      orderBy: { createdAt: 'asc' },
    });
    return events.map((item) => this.mapEvent(item));
  }

  async getAdminEventById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { eventType: true },
    });
    if (!event) throw new NotFoundException('Event not found.');
    return this.mapEvent(event);
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Event not found.');

    if (dto.eventTypeId) {
      const eventType = await this.prisma.eventType.findUnique({
        where: { id: dto.eventTypeId },
        select: { id: true, isActive: true },
      });
      if (!eventType) throw new NotFoundException('Event type not found.');
      if (!eventType.isActive) throw new BadRequestException('Event type is inactive.');
    }

    try {
      const updated = await this.prisma.event.update({
        where: { id },
        data: {
          ...(dto.eventTypeId ? { eventTypeId: dto.eventTypeId } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.items !== undefined ? { items: dto.items } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        include: { eventType: true },
      });

      return {
        message: 'Event updated successfully.',
        event: this.mapEvent(updated),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002' && dto.eventTypeId) {
        throw new ConflictException('An event for this type already exists.');
      }
      throw error;
    }
  }

  async deleteEvent(id: string) {
    const existing = await this.prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Event not found.');

    const updated = await this.prisma.event.update({
      where: { id },
      data: { isActive: false },
      include: { eventType: true },
    });

    return {
      message: 'Event disabled successfully.',
      event: this.mapEvent(updated),
    };
  }

  async createEventType(dto: CreateEventTypeDto) {
    try {
      const created = await this.prisma.eventType.create({
        data: { name: dto.name },
      });
      return {
        message: 'Event type created successfully.',
        eventType: this.mapEventType(created),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        throw new ConflictException(`Event type "${dto.name}" already exists.`);
      }
      throw error;
    }
  }

  async getPublicEventTypes() {
    const types = await this.prisma.eventType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return types.map((item) => this.mapEventType(item));
  }

  async getAdminEventTypes() {
    const types = await this.prisma.eventType.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return types.map((item) => this.mapEventType(item));
  }

  async updateEventType(id: string, dto: UpdateEventTypeDto) {
    const existing = await this.prisma.eventType.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Event type not found.');

    if (dto.isActive === false) {
      await this.ensureEventTypeCanBeDisabled(id);
    }

    try {
      const updated = await this.prisma.eventType.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
      return {
        message: 'Event type updated successfully.',
        eventType: this.mapEventType(updated),
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002' && dto.name) {
        throw new ConflictException(`Event type "${dto.name}" already exists.`);
      }
      throw error;
    }
  }

  async deleteEventType(id: string) {
    const existing = await this.prisma.eventType.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Event type not found.');

    await this.ensureEventTypeCanBeDisabled(id);

    const updated = await this.prisma.eventType.update({
      where: { id },
      data: { isActive: false },
    });
    return {
      message: 'Event type disabled successfully.',
      eventType: this.mapEventType(updated),
    };
  }

  private async ensureEventTypeCanBeDisabled(eventTypeId: string) {
    const count = await this.prisma.event.count({ where: { eventTypeId } });
    if (count > 0) {
      throw new ConflictException(
        'Cannot disable this event type because it is associated with existing events.',
      );
    }
  }

  private mapEvent(item: {
    id: string;
    eventType: { id: string; name: string; isActive: boolean; createdAt: Date; updatedAt: Date };
    description: string;
    items: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      eventTypeId: item.eventType.id,
      eventTypeName: item.eventType.name,
      eventType: this.mapEventType(item.eventType),
      description: item.description,
      items: item.items,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapEventType(item: { id: string; name: string; isActive: boolean; createdAt: Date; updatedAt: Date }) {
    return {
      id: item.id,
      name: item.name,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
