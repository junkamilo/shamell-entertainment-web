import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ClassPackageSectionSelectionDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsUUID('4')
  sectionId!: string;
}

export class CreateClassPackageCheckoutDto {
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  monthIso!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  /** @deprecated Ignored; month package includes all active sessions in monthIso. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassPackageSectionSelectionDto)
  sectionSelections?: ClassPackageSectionSelectionDto[];
}
