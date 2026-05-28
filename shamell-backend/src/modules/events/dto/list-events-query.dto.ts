import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { EventPublicSection } from '@prisma/client';

export class ListEventsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toUpperCase();
    return normalized.length > 0 ? normalized : undefined;
  })
  @IsEnum(EventPublicSection)
  publicSection?: EventPublicSection;
}
