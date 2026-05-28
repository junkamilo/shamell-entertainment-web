import { VenueTableSize } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export enum VenueTableBulkDeleteScope {
  ALL = 'ALL',
  SIZE = 'SIZE',
}

export class BulkDeleteVenueTableConfigDto {
  @IsEnum(VenueTableBulkDeleteScope)
  scope!: VenueTableBulkDeleteScope;

  @IsOptional()
  @IsEnum(VenueTableSize)
  size?: VenueTableSize;
}
