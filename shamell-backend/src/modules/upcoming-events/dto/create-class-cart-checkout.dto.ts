import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CLASS_SESSION_CART_MAX_SESSIONS } from '../constants/upcoming-events.constants';

export class CreateClassCartCheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CLASS_SESSION_CART_MAX_SESSIONS)
  @IsUUID('4', { each: true })
  sessionIds!: string[];

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
