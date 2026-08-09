import { Injectable } from '@nestjs/common';
import type { HeroHeaderContent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  HeaderTextCreateData,
  HeaderTextUpdateData,
} from '../types/header-media.types';

@Injectable()
export class HeaderTextRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLatestActive(): Promise<HeroHeaderContent | null> {
    return this.prisma.heroHeaderContent.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findLatest(): Promise<HeroHeaderContent | null> {
    return this.prisma.heroHeaderContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(data: HeaderTextCreateData): Promise<HeroHeaderContent> {
    return this.prisma.heroHeaderContent.create({ data });
  }

  update(id: string, data: HeaderTextUpdateData): Promise<HeroHeaderContent> {
    return this.prisma.heroHeaderContent.update({
      where: { id },
      data,
    });
  }
}
