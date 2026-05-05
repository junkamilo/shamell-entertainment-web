import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CONTACT_INQUIRY_CODES, type ContactInquiryCode } from '../../../common/contact-inquiry-codes';

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

  @IsOptional()
  @IsString()
  @IsIn([...CONTACT_INQUIRY_CODES])
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim();
  })
  contactInquiryCode?: ContactInquiryCode;
}
