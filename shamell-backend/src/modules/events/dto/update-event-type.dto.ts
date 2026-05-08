import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  CONTACT_INQUIRY_CODES,
  type ContactInquiryCode,
} from '../../../common/contact-inquiry-codes';
import { EventTypeOccasionAssignmentDto } from './event-type-occasion-assignment.dto';

export class UpdateEventTypeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[A-Za-zÀ-ÿ\s&-]+$/, {
    message: 'Name must contain only letters, spaces, ampersands, or hyphens.',
  })
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).trim(),
  )
  name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return String(value).trim();
  })
  @ValidateIf(
    (o: UpdateEventTypeDto) =>
      o.contactInquiryCode !== null && o.contactInquiryCode !== undefined,
  )
  @IsString()
  @IsIn([...CONTACT_INQUIRY_CODES])
  contactInquiryCode?: ContactInquiryCode | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventTypeOccasionAssignmentDto)
  occasions?: EventTypeOccasionAssignmentDto[];
}
