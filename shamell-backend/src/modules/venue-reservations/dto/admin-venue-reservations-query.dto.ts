import { ApiPropertyOptional } from '@nestjs/swagger';
import { VenueSeatReservationStatus } from '@prisma/client';
import {
  VENUE_RESERVATION_PAYMENT_CHANNELS,
  type VenueReservationPaymentChannel,
} from '../venue-reservation-payment-channel.const';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

const PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

export class AdminVenueReservationsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ enum: PER_PAGE_OPTIONS, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(PER_PAGE_OPTIONS)
  perPage?: number = 10;

  @ApiPropertyOptional({ enum: VenueSeatReservationStatus })
  @IsOptional()
  @IsEnum(VenueSeatReservationStatus)
  status?: VenueSeatReservationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by floor layout item id.',
  })
  @IsOptional()
  @IsUUID()
  layoutItemId?: string;

  @ApiPropertyOptional({ enum: VENUE_RESERVATION_PAYMENT_CHANNELS })
  @IsOptional()
  @IsIn([...VENUE_RESERVATION_PAYMENT_CHANNELS])
  paymentChannel?: VenueReservationPaymentChannel;
}
