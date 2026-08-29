import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFixedEventPackageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badge?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(50)
  priceCents!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  /** HH:mm or HH:mm:ss */
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  arrivalStartTime!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  arrivalEndTime?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsArray()
  @IsUUID('4', { each: true })
  activityIds!: string[];
}

export class UpdateFixedEventPackageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badge?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  priceCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  arrivalStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  arrivalEndTime?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  activityIds?: string[];

  @IsOptional()
  isActive?: boolean;
}

export class ReorderFixedEventPackagesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}
