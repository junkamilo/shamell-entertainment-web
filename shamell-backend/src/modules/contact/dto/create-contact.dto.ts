// src/modules/contact/dto/create-contact.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsIn,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CONTACT_INQUIRY_CODES, type ContactInquiryCode } from '../../../common/contact-inquiry-codes';

export const SERVICE_TYPES = CONTACT_INQUIRY_CODES;

export type ServiceTypeCode = ContactInquiryCode;

export class CreateContactDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+57 300 1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ example: 'Miami, FL — private residence' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @ApiPropertyOptional({ enum: SERVICE_TYPES })
  @IsOptional()
  @IsString()
  @IsIn([...SERVICE_TYPES])
  serviceType?: ServiceTypeCode;

  @ApiPropertyOptional({ example: 'Prefer live band cue at 21:30' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preferences?: string;

  @ApiPropertyOptional({ example: 'Booking inquiry — VIP Event' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional({
    description: 'Structured wizard fields (occasion, add-ons, times, etc.)',
    example: { occasionCode: 'WEDDING', experienceAddons: ['FIRE'] },
  })
  @IsOptional()
  @IsObject()
  inquiryDetails?: Record<string, unknown>;

  @ApiProperty({ example: 'I would like to book a private event...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(4000)
  message: string;
}
