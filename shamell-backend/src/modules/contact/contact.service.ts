// src/modules/contact/contact.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import {
  formatInquiryDetailsSummary,
  sanitizeInquiryDetails,
  type SanitizedInquiryDetails,
} from './contact-inquiry-details';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  private async enrichInquiryDetails(details: SanitizedInquiryDetails): Promise<SanitizedInquiryDetails> {
    const out: SanitizedInquiryDetails = { ...details };
    const ids = new Set<string>();
    if (details.occasionTypeId) ids.add(details.occasionTypeId);
    details.occasionTypeIdsProject?.forEach((i) => ids.add(i));
    details.occasionTypeIdsRole?.forEach((i) => ids.add(i));
    if (ids.size > 0) {
      const rows = await this.prisma.occasionType.findMany({
        where: { id: { in: [...ids] } },
        select: { id: true, name: true },
      });
      const map = Object.fromEntries(rows.map((r) => [r.id, r.name]));
      if (details.occasionTypeId) {
        const n = map[details.occasionTypeId];
        if (n) out.occasionSingleLabel = n;
      }
      if (details.occasionTypeIdsProject?.length) {
        out.bespokeProjectLabels = details.occasionTypeIdsProject
          .map((id) => map[id])
          .filter((label): label is string => Boolean(label));
      }
      if (details.occasionTypeIdsRole?.length) {
        out.bespokeRoleLabels = details.occasionTypeIdsRole
          .map((id) => map[id])
          .filter((label): label is string => Boolean(label));
      }
    }
    if (details.eventTypeId) {
      const et = await this.prisma.eventType.findUnique({
        where: { id: details.eventTypeId },
        select: { name: true },
      });
      if (et) out.eventTypeLabel = et.name;
    }
    return out;
  }

  async create(dto: CreateContactDto) {
    const { eventDate, subject, inquiryDetails: rawInquiryDetails, message, ...rest } = dto;
    const inquiryDetails = sanitizeInquiryDetails(rawInquiryDetails);
    const enriched =
      inquiryDetails && Object.keys(inquiryDetails).length > 0
        ? await this.enrichInquiryDetails(inquiryDetails)
        : undefined;
    const summaryBlock =
      enriched && Object.keys(enriched).length > 0
        ? formatInquiryDetailsSummary(enriched, dto.serviceType)
        : '';
    const trimmedMessage = message.trim();
    const composedMessage = summaryBlock
      ? `${summaryBlock}\n\n---\n\n${trimmedMessage}`
      : trimmedMessage;

    const resolvedSubject =
      subject?.trim() ||
      `Reservation inquiry${dto.serviceType ? ` — ${dto.serviceType}` : ''}`;

    return this.prisma.contactRequest.create({
      data: {
        ...rest,
        message: composedMessage,
        subject: resolvedSubject,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        inquiryDetails:
          enriched === undefined ? undefined : (enriched as unknown as Prisma.InputJsonValue),
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