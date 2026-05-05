import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class GoogleCredentialDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  credential: string;
}
