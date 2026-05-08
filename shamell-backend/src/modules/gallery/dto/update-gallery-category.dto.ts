import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateGalleryCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).trim(),
  )
  name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isActive?: boolean;
}
