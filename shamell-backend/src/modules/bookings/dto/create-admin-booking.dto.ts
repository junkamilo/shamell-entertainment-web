import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingSource, BookingStatus } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const ADMIN_CREATE_BOOKING_SOURCES = [
  BookingSource.ADMIN_PHONE,
  BookingSource.ADMIN_FROM_CONTACT,
] as const;

export class CreateAdminBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  eventTypeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  occasionTypeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contactRequestId?: string;

  @ApiProperty({ example: '2026-08-01T19:30:00.000Z' })
  @IsDateString()
  eventDate!: string;

  @ApiProperty({ example: 'Miami Beach Convention Center' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  guestCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ enum: ADMIN_CREATE_BOOKING_SOURCES })
  @IsOptional()
  @IsIn(ADMIN_CREATE_BOOKING_SOURCES)
  source?: BookingSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  bookingDetails?: Record<string, unknown>;

  /** Registered client; omit when using guest fields. */
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((o: CreateAdminBookingDto) => !o.guestFullName && !o.guestEmail)
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateAdminBookingDto) => !o.userId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  guestFullName?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateAdminBookingDto) => !o.userId)
  @IsEmail()
  @MaxLength(120)
  guestEmail?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateAdminBookingDto) => !o.userId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  guestPhone?: string;
}
