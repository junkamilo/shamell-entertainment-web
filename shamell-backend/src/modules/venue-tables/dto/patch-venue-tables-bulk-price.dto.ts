import { VenueTableSize } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { VenueTableBulkDeleteScope } from './bulk-delete-venue-table-config.dto';

export class PatchVenueTablesBulkPriceDto {
  @IsEnum(VenueTableBulkDeleteScope)
  scope!: VenueTableBulkDeleteScope;

  @IsOptional()
  @IsEnum(VenueTableSize)
  size?: VenueTableSize;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  bundlePrice!: number;
}
