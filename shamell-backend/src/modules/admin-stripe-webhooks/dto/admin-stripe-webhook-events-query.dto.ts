import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const ADMIN_WEBHOOK_STATUSES = [
  'RECEIVED',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
] as const;

export type AdminWebhookStatus = (typeof ADMIN_WEBHOOK_STATUSES)[number];

export class AdminStripeWebhookEventsQueryDto {
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

  @ApiPropertyOptional({
    description: 'Stripe event type, e.g. checkout.session.completed',
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ description: 'metadata.flow from checkout session' })
  @IsOptional()
  @IsString()
  metadataFlow?: string;

  @ApiPropertyOptional({ description: 'Stripe checkout session id' })
  @IsOptional()
  @IsString()
  checkoutSessionId?: string;

  @ApiPropertyOptional({ enum: ADMIN_WEBHOOK_STATUSES })
  @IsOptional()
  @IsIn([...ADMIN_WEBHOOK_STATUSES])
  status?: AdminWebhookStatus;

  @ApiPropertyOptional({ description: 'Filter by whether processedAt is set' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  processed?: boolean;

  @ApiPropertyOptional({ description: 'createdAt >= ISO date' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'createdAt <= ISO date' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
