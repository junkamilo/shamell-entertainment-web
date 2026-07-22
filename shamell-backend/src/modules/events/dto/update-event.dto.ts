import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  EventPublicSection,
  UpcomingClassVariant,
  UpcomingExperienceType,
} from '@prisma/client';

export class UpdateEventDto {
  @IsOptional()
  @IsUUID()
  eventTypeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) =>
    value === undefined || value === null ? undefined : String(value).trim(),
  )
  eventTypeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).trim(),
  )
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
    }
    if (typeof value === 'string' && value.trim().length > 0)
      return [value.trim()];
    return undefined;
  })
  items?: string[];

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  showOnHome?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim().toUpperCase();
  })
  @IsEnum(EventPublicSection)
  /** Ignored when equal to current; rejected by service when different (immutable after create). */
  publicSection?: EventPublicSection;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : String(value).trim().toLowerCase(),
  )
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim().toUpperCase();
  })
  @IsEnum(UpcomingExperienceType)
  experienceType?: UpcomingExperienceType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim().toUpperCase();
  })
  @IsEnum(UpcomingClassVariant)
  classVariant?: UpcomingClassVariant;
}
