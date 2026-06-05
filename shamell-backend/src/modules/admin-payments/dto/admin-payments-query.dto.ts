import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
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

export type AdminPaymentFlow = (typeof ADMIN_PAYMENT_FLOWS)[number];
export type AdminPaymentStatus = (typeof ADMIN_PAYMENT_STATUSES)[number];

export class AdminPaymentsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
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
  @ApiPropertyOptional({ description: 'Unix timestamp ms — count updates after this' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  since?: number;
}
