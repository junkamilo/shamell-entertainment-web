import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsUUID()
  eventTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).trim(),
  )
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
    }
    if (typeof value === 'string' && value.trim().length > 0)
      return [value.trim()];
    return undefined;
  })
  items?: string[];

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  showOnHome?: boolean;
}
