import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { HEADER_FONTS, HEADER_HEX_COLOR_REGEX } from '../header-text.constants';

export class UpsertHeaderTextDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).trim(),
  )
  headline?: string;

  @IsOptional()
  @IsString()
  @IsIn(HEADER_FONTS)
  headlineFont?: string;

  @IsOptional()
  @IsString()
  @Matches(HEADER_HEX_COLOR_REGEX, {
    message: 'headlineColor must be a valid hex color (#RRGGBB).',
  })
  headlineColor?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).replace(/^\s+|\s+$/g, ''),
  )
  tagline?: string;

  @IsOptional()
  @IsString()
  @IsIn(HEADER_FONTS)
  taglineFont?: string;

  @IsOptional()
  @IsString()
  @Matches(HEADER_HEX_COLOR_REGEX, {
    message: 'taglineColor must be a valid hex color (#RRGGBB).',
  })
  taglineColor?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).replace(/^\s+|\s+$/g, ''),
  )
  quote?: string;

  @IsOptional()
  @IsString()
  @IsIn(HEADER_FONTS)
  quoteFont?: string;

  @IsOptional()
  @IsString()
  @Matches(HEADER_HEX_COLOR_REGEX, {
    message: 'quoteColor must be a valid hex color (#RRGGBB).',
  })
  quoteColor?: string;
}
