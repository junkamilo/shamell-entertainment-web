import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ADMIN_PAYMENT_FLOWS = [
  'BOOKING_QUOTE',
  'VENUE_SEAT',
  'CLASS_SESSION',
  'CLASS_PACKAGE',
  'CLASS_DAY_BUNDLE',
  'FIXED_TICKET',
] as const;

export const ADMIN_PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'EXPIRED',
  'CANCELLED',
] as const;

/** Deepest page reachable; beyond it OFFSET overflows the DB driver. */
export const ADMIN_PAYMENTS_MAX_PAGE = 10_000;
export const ADMIN_PAYMENTS_MAX_SEARCH_LENGTH = 100;
/** Largest valid JS Date (ms since epoch). */
export const MAX_DATE_MS = 8_640_000_000_000_000;

export type AdminPaymentFlow = (typeof ADMIN_PAYMENT_FLOWS)[number];
export type AdminPaymentStatus = (typeof ADMIN_PAYMENT_STATUSES)[number];

export class AdminPaymentsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ADMIN_PAYMENTS_MAX_PAGE)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ADMIN_PAYMENT_FLOWS })
  @IsOptional()
  @IsIn([...ADMIN_PAYMENT_FLOWS])
  flow?: AdminPaymentFlow;

  @ApiPropertyOptional({ enum: ADMIN_PAYMENT_STATUSES })
  @IsOptional()
  @IsIn([...ADMIN_PAYMENT_STATUSES])
  status?: AdminPaymentStatus;

  @ApiPropertyOptional({ description: 'Search by customer name or email' })
  @IsOptional()
  @IsString()
  @MaxLength(ADMIN_PAYMENTS_MAX_SEARCH_LENGTH)
  q?: string;

  @ApiPropertyOptional({ description: 'ISO date — filter from (inclusive)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date — filter to (inclusive)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class AdminPaymentsBadgeQueryDto {
  @ApiPropertyOptional({
    description: 'Unix timestamp ms — count updates after this',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_DATE_MS)
  since?: number;
}
