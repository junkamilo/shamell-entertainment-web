// src/modules/contact/contact.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContactDto) {
    const { eventDate, subject, ...rest } = dto;
    const resolvedSubject =
      subject?.trim() ||
      `Reservation inquiry${dto.serviceType ? ` — ${dto.serviceType}` : ''}`;

    return this.prisma.contactRequest.create({
      data: {
        ...rest,
        subject: resolvedSubject,
        eventDate: eventDate ? new Date(eventDate) : undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contactRequest.findUnique({
      where: { id },
    });
    if (!contact) throw new NotFoundException('Contact request not found');
    return contact;
  }

  async markAsRead(id: string) {
    await this.findOne(id); // valida que exista
    return this.prisma.contactRequest.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contactRequest.delete({ where: { id } });
  }
}