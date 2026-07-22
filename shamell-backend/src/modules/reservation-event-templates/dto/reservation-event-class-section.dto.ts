import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ReservationEventClassSectionDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(5)
  startTime!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(5)
  endTime!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  defaultCapacity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  defaultPrice!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
