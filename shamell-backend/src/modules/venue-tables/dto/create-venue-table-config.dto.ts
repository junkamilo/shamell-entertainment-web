import { VenueTableSize } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVenueTableConfigDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  tableName?: string;

  @IsEnum(VenueTableSize)
  size!: VenueTableSize;

  @IsInt()
  @Min(1)
  @Max(20)
  includedChairs!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  bundlePrice!: number;

  @IsOptional()
  @IsNumber()
  visualX?: number;

  @IsOptional()
  @IsNumber()
  visualY?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
