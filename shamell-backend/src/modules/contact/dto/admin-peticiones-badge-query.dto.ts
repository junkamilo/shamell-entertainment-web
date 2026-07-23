import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class AdminPeticionesBadgeQueryDto {
  @ApiPropertyOptional({
    description: 'Unix timestamp (ms); count items created after this instant',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  since?: number;

  @ApiPropertyOptional({
    enum: ['bookings', 'guidance', 'private_classes'],
    default: 'bookings',
  })
  @IsOptional()
  @IsIn(['bookings', 'guidance', 'private_classes'])
  lane?: 'bookings' | 'guidance' | 'private_classes';
}
