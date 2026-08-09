import { BadRequestException, Injectable } from '@nestjs/common';
import { DEFAULT_HEADER_TEXT } from '../constants/header-media.constants';
import { UpsertHeaderTextDto } from '../dto/upsert-header-text.dto';
import {
  mapAdminHeaderText,
  mapHeaderText,
} from '../utils/header-text-mapper.util';
import { HeaderTextRepository } from './header-text.repository';

@Injectable()
export class HeaderTextService {
  constructor(private readonly repository: HeaderTextRepository) {}

  async getPublicHeaderText() {
    const latest = await this.repository.findLatestActive();

    if (!latest) {
      return mapHeaderText(null);
    }

    return mapHeaderText(latest);
  }

  async getAdminHeaderText() {
    const latest = await this.repository.findLatest();
    return mapAdminHeaderText(latest);
  }

  async upsertAdminHeaderText(dto: UpsertHeaderTextDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Provide at least one field to update header text.',
      );
    }

    const existing = await this.repository.findLatest();

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
      ...(dto.taglineFont !== undefined
        ? { taglineFont: dto.taglineFont }
        : {}),
      ...(dto.taglineColor !== undefined
        ? { taglineColor: dto.taglineColor }
        : {}),
      ...(dto.quote !== undefined ? { quote: dto.quote } : {}),
      ...(dto.quoteFont !== undefined ? { quoteFont: dto.quoteFont } : {}),
      ...(dto.quoteColor !== undefined ? { quoteColor: dto.quoteColor } : {}),
    };

    const saved = existing
      ? await this.repository.update(existing.id, data)
      : await this.repository.create({
          ...DEFAULT_HEADER_TEXT,
          ...data,
        });

    const mapped = mapAdminHeaderText(saved);
    if (!mapped) {
      throw new BadRequestException('Failed to save header text.');
    }

    return mapped;
  }
}
