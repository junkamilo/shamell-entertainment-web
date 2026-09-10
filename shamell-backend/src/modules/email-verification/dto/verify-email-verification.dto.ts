import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailVerificationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  challengeId: string;

  @ApiProperty({ example: '482193' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
