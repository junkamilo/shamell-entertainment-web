import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityClosureKind } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateClosureDto {
  @ApiProperty({ enum: AvailabilityClosureKind })
  @IsEnum(AvailabilityClosureKind)
  kind!: AvailabilityClosureKind;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @ValidateIf(
    (o: CreateClosureDto) => o.kind === AvailabilityClosureKind.SPECIFIC_DATE,
  )
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '2026-06-10' })
  @ValidateIf(
    (o: CreateClosureDto) => o.kind === AvailabilityClosureKind.DATE_RANGE,
  )
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-20' })
  @ValidateIf(
    (o: CreateClosureDto) => o.kind === AvailabilityClosureKind.DATE_RANGE,
  )
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 6 })
  @ValidateIf(
    (o: CreateClosureDto) =>
      o.kind === AvailabilityClosureKind.RECURRING_WEEKDAY,
  )
  @IsInt()
  @Min(0)
  @Max(6)
  weekday?: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
