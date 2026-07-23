import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePrivateClassBookingDto {
  @ApiProperty({ example: 'Private belly dance lesson' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  classType!: string;

  /** Calendar date YYYY-MM-DD */
  @ApiProperty({ example: '2030-08-15' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'eventDate must be YYYY-MM-DD.',
  })
  eventDate!: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'eventTimeStart must be HH:mm.',
  })
  eventTimeStart!: string;

  @ApiProperty({ example: '123 Ocean Dr, Miami Beach' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(254)
  customerEmail!: string;

  @ApiPropertyOptional({ example: '+13055551212' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiProperty({ example: 150, description: 'Price in USD' })
  @IsNumber()
  @Min(1)
  amountUsd!: number;
}
