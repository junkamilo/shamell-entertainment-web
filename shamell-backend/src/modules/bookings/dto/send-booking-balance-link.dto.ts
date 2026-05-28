import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendBookingBalanceLinkDto {
  @ApiPropertyOptional({ example: 'usd' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;
}
