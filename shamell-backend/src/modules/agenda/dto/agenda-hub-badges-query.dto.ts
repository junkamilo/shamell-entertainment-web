import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AgendaHubBadgesQueryDto {
  @ApiPropertyOptional({
    description:
      'Bookings lane inbox badge: count items created after this ms timestamp',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peticionesBookingsSince?: number;

  @ApiPropertyOptional({
    description:
      'Guidance lane inbox badge: count items created after this ms timestamp',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peticionesGuidanceSince?: number;

  @ApiPropertyOptional({
    description:
      'Private classes lane inbox badge: count items created after this ms timestamp',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peticionesPrivateClassesSince?: number;

  @ApiPropertyOptional({
    description:
      'Payment history badge: count terminal payments updated after this ms timestamp',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paymentsSince?: number;
}
