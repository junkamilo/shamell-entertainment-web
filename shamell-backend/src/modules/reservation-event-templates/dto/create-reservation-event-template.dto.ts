import { ReservationEventScheduleMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ReservationEventClassSectionDto } from './reservation-event-class-section.dto';
import { ReservationEventWeekdayDto } from './reservation-event-weekday.dto';

export class CreateReservationEventTemplateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsEnum(ReservationEventScheduleMode)
  scheduleMode!: ReservationEventScheduleMode;

  @ValidateIf((o: CreateReservationEventTemplateDto) => o.scheduleMode === 'FIXED_EVENT')
  @IsString()
  salesStartDate?: string;

  @ValidateIf((o: CreateReservationEventTemplateDto) => o.scheduleMode === 'FIXED_EVENT')
  @IsString()
  salesEndDate?: string;

  @ValidateIf((o: CreateReservationEventTemplateDto) => o.scheduleMode === 'FIXED_EVENT')
  @IsString()
  eventDate?: string;

  @ValidateIf((o: CreateReservationEventTemplateDto) => o.scheduleMode === 'FIXED_EVENT')
  @IsString()
  eventStartTime?: string;

  @ValidateIf((o: CreateReservationEventTemplateDto) => o.scheduleMode === 'FIXED_EVENT')
  @IsString()
  eventEndTime?: string;

  @ValidateIf(
    (o: CreateReservationEventTemplateDto) =>
      o.scheduleMode === 'RECURRING_WEEKLY',
  )
  @IsArray()
  @ArrayMinSize(7)
  @ValidateNested({ each: true })
  @Type(() => ReservationEventWeekdayDto)
  weekdays?: ReservationEventWeekdayDto[];

  @ValidateIf(
    (o: CreateReservationEventTemplateDto) =>
      o.scheduleMode === 'RECURRING_WEEKLY',
  )
  @IsString()
  recurringStartTime?: string;

  @ValidateIf(
    (o: CreateReservationEventTemplateDto) =>
      o.scheduleMode === 'RECURRING_WEEKLY',
  )
  @IsString()
  recurringEndTime?: string;

  @ValidateIf(
    (o: CreateReservationEventTemplateDto) =>
      o.scheduleMode === 'RECURRING_WEEKLY',
  )
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationEventClassSectionDto)
  classSections?: ReservationEventClassSectionDto[];
}
