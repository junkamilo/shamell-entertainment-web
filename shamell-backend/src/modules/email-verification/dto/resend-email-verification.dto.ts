import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendEmailVerificationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  challengeId: string;
}
