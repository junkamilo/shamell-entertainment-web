import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_HEADER_TEXT } from './header-text.constants';
import { UpsertHeaderTextDto } from './dto/upsert-header-text.dto';
import { mapAdminHeaderText, mapHeaderText } from './header-text.mapper';

@Injectable()
export class HeaderTextService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicHeaderText() {
    const latest = await this.prisma.heroHeaderContent.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!latest) {
      return mapHeaderText(null);
    }

    return mapHeaderText(latest);
  }

  async getAdminHeaderText() {
    const latest = await this.prisma.heroHeaderContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    return mapAdminHeaderText(latest);
  }

  async upsertAdminHeaderText(dto: UpsertHeaderTextDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Provide at least one field to update header text.',
      );
    }

    const existing = await this.prisma.heroHeaderContent.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const data = {
      isActive: true,
      ...(dto.headline !== undefined ? { headline: dto.headline } : {}),
      ...(dto.headlineFont !== undefined
        ? { headlineFont: dto.headlineFont }
        : {}),
      ...(dto.headlineColor !== undefined
        ? { headlineColor: dto.headlineColor }
        : {}),
      ...(dto.tagline !== undefined ? { tagline: dto.tagline } : {}),
      ...(dto.taglineFont !== undefined ? { taglineFont: dto.taglineFont } : {}),
      ...(dto.taglineColor !== undefined
        ? { taglineColor: dto.taglineColor }
        : {}),
      ...(dto.quote !== undefined ? { quote: dto.quote } : {}),
      ...(dto.quoteFont !== undefined ? { quoteFont: dto.quoteFont } : {}),
      ...(dto.quoteColor !== undefined ? { quoteColor: dto.quoteColor } : {}),
    };

    const saved = existing
      ? await this.prisma.heroHeaderContent.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.heroHeaderContent.create({
          data: {
            ...DEFAULT_HEADER_TEXT,
            ...data,
          },
        });

    const mapped = mapAdminHeaderText(saved);
    if (!mapped) {
      throw new BadRequestException('Failed to save header text.');
    }

    return mapped;
  }
}
