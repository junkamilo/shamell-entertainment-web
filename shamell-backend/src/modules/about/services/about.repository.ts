import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AboutContentRow, AboutHeroMediaType } from '../types/about.types';

export type AboutContentCreateData = {
  title: string;
  paragraph1: string;
  coreValues: string[];
  imageUrl: string | null;
  imagePublicId: string | null;
  heroMediaType: AboutHeroMediaType;
  videoDeliveryUrl: string | null;
  videoPosterUrl: string | null;
  isActive: boolean;
};

export type AboutContentUpdateData = {
  isActive?: boolean;
  title?: string;
  paragraph1?: string;
  coreValues?: string[];
  imageUrl?: string | null;
  imagePublicId?: string | null;
  heroMediaType?: AboutHeroMediaType;
  videoDeliveryUrl?: string | null;
  videoPosterUrl?: string | null;
};

@Injectable()
export class AboutRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLatest(): Promise<AboutContentRow | null> {
    return this.prisma.aboutContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(data: AboutContentCreateData): Promise<AboutContentRow> {
    return this.prisma.aboutContent.create({ data });
  }

  update(id: string, data: AboutContentUpdateData): Promise<AboutContentRow> {
    return this.prisma.aboutContent.update({
      where: { id },
      data,
    });
  }

  clearHeroMedia(id: string): Promise<AboutContentRow> {
    return this.update(id, {
      imageUrl: null,
      imagePublicId: null,
      heroMediaType: 'IMAGE',
      videoDeliveryUrl: null,
      videoPosterUrl: null,
    });
  }
}
