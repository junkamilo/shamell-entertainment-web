import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class AdminCalendarQueryDto {
  @ApiProperty({ description: 'Inclusive range start (ISO date or datetime)' })
  @IsDateString()
  from!: string;

  @ApiProperty({ description: 'Inclusive range end (ISO date or datetime)' })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional({
    description: 'When true, returns PENDING + CONFIRMED only',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  activeOnly?: boolean;
}
