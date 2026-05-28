import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateClassCheckoutDto {
  @IsUUID('4')
  sessionId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName!: string;

  @IsEmail()
  @MaxLength(254)
  customerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;
}
