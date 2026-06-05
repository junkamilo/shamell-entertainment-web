import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpsertVenueConfigDto {
  @IsOptional()
  @IsBoolean()
  clientEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  promoTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  promoDescription?: string | null;

  @IsOptional()
  @IsISO8601()
  reservationEventDate?: string | null;

  @IsOptional()
  @IsISO8601()
  reservationOpensAt?: string | null;

  @IsOptional()
  @IsISO8601()
  reservationClosesAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reservationEventLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  reservationTimezone?: string;

  @IsOptional()
  @IsUUID('4')
  floorLayoutId?: string | null;

  @IsOptional()
  @IsUUID('4')
  reservationEventTemplateId?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99999)
  fixedTicketCapacity?: number | null;

  /** @deprecated Full class package removed; cleared on RECURRING_WEEKLY save. */
  @IsOptional()
  @IsBoolean()
  classPackageEnabled?: boolean;

  /** @deprecated See classPackageEnabled. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  classPackagePrice?: number | null;

  /** @deprecated See classPackageEnabled. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  classPackageLabel?: string | null;
}
