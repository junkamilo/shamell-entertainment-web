import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  EMAIL_VERIFICATION_PURPOSES,
  type EmailVerificationPurpose,
} from '../constants/email-verification.constants';

export class StartEmailVerificationDto {
  @ApiProperty({
    example: 'CONCIERGE_INQUIRY',
    enum: EMAIL_VERIFICATION_PURPOSES,
  })
  @IsString()
  @IsIn([...EMAIL_VERIFICATION_PURPOSES])
  purpose: EmailVerificationPurpose;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Google reCAPTCHA v2 response token',
    example: '03AGdBq25...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(4000)
  recaptchaToken: string;
}
