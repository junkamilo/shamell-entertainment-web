import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFixedEventCheckoutDto {
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
