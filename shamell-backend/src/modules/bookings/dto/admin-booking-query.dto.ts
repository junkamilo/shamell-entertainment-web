import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingSource, BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

const PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

export class AdminBookingQueryDto {
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

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ enum: BookingSource })
  @IsOptional()
  @IsEnum(BookingSource)
  source?: BookingSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}
