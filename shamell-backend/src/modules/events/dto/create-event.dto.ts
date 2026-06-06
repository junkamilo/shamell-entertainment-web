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

export class CreateEventDto {
  @ValidateIf((o: CreateEventDto) => !o.eventTypeName?.trim())
  @IsUUID()
  eventTypeId?: string;

  @ValidateIf((o: CreateEventDto) => !o.eventTypeId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) =>
    value === undefined || value === null ? undefined : String(value).trim(),
  )
  eventTypeName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Transform(({ value }) => String(value).trim())
  description!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean)
      : typeof value === 'string' && value.trim().length > 0
        ? [value.trim()]
        : [],
  )
  items!: string[];

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
  showOnHome?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim().toUpperCase();
  })
  @IsEnum(EventPublicSection)
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
