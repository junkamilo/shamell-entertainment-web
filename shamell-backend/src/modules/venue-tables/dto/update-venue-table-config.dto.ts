import { VenueTableSize } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateVenueTableConfigDto {
  @IsOptional()
  @IsEnum(VenueTableSize)
  size?: VenueTableSize;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  includedChairs?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  bundlePrice?: number;

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
