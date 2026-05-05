import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateOccasionTypeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[A-Za-zÀ-ÿ0-9\s&,.()'¿?¡!/-]+$/, {
    message: 'Name contains invalid characters.',
  })
  @Transform(({ value }) => (value === undefined ? undefined : String(value).trim()))
  name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isActive?: boolean;
}
