import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateServiceTypeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[A-Za-zÀ-ÿ\s&-]+$/, {
    message: 'Name must contain only letters, spaces, ampersands, or hyphens.',
  })
  @Transform(({ value }) => String(value).trim())
  name!: string;
}
