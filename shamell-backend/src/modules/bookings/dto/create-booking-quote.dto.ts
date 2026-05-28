import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingQuotePaymentModel } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingQuoteDto {
  @ApiProperty({ enum: BookingQuotePaymentModel })
  @IsEnum(BookingQuotePaymentModel)
  paymentModel!: BookingQuotePaymentModel;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(1)
  totalAmount!: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  depositAmount?: number;

  @ApiPropertyOptional({ example: 'usd' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;
}
