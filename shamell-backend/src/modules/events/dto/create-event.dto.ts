import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  eventTypeId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Transform(({ value }) => String(value).trim())
  description!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean)
      : typeof value === 'string' && value.trim().length > 0
        ? [value.trim()]
        : [],
  )
  items!: string[];
}
