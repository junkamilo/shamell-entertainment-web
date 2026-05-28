import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertVenueLayoutSettingsDto {
  @IsOptional()
  @IsBoolean()
  clientEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  promoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  promoDescription?: string;

  @IsOptional()
  @IsDateString()
  reservationEventDate?: string;

  @IsOptional()
  @IsDateString()
  reservationOpensAt?: string;

  @IsOptional()
  @IsDateString()
  reservationClosesAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reservationEventLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  reservationTimezone?: string;
}
