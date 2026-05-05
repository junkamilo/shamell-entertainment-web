import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertAboutContentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) => (value === undefined ? undefined : String(value).trim()))
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(16000)
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).replace(/^\s+|\s+$/g, ""),
  )
  paragraph1?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean)
      : typeof value === 'string' && value.trim().length > 0
        ? value
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
  )
  coreValues?: string[];
}
