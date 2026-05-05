import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class VerifyAdminInviteDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  code: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
