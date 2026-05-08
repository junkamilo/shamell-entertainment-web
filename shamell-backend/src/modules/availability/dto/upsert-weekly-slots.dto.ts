import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class WeeklySlotItemDto {
  @ApiProperty({
    minimum: 0,
    maximum: 6,
    description: '0 = Sunday … 6 = Saturday',
  })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty()
  @IsBoolean()
  isClosed!: boolean;

  @ApiPropertyOptional({ example: '09:00' })
  @ValidateIf((o: WeeklySlotItemDto) => !o.isClosed)
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:mm' })
  startTime?: string;

  @ApiPropertyOptional({ example: '21:00' })
  @ValidateIf((o: WeeklySlotItemDto) => !o.isClosed)
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:mm' })
  endTime?: string;
}

export class UpsertWeeklySlotsDto {
  @ApiProperty({
    type: [WeeklySlotItemDto],
    description: 'Exactly 7 rows, weekdays 0–6 each once',
  })
  @IsArray()
  @ArrayMinSize(7)
  @ValidateNested({ each: true })
  @Type(() => WeeklySlotItemDto)
  slots!: WeeklySlotItemDto[];
}
