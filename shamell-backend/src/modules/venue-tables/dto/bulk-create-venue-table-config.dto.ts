import { VenueTableSize } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  Max,
  Min,
} from 'class-validator';

export class BulkCreateVenueTableConfigDto {
  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;

  @IsEnum(VenueTableSize)
  size!: VenueTableSize;

  @IsInt()
  @Min(1)
  @Max(20)
  includedChairs!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  bundlePrice!: number;
}
