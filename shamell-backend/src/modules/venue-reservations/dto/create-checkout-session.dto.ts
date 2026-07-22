import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsIn(['catalog_table', 'standalone_chair'])
  kind!: 'catalog_table' | 'standalone_chair';

  @IsUUID('4')
  layoutItemId!: string;

  @ValidateIf((o: CreateCheckoutSessionDto) => o.kind === 'catalog_table')
  @IsUUID('4')
  venueTableConfigId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName!: string;

  @IsEmail()
  @MaxLength(254)
  customerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @IsOptional()
  @IsUUID('4')
  upcomingEventId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  upcomingEventSlug?: string;

  /** Box Office form snapshot; persisted as JSON on the reservation. */
  @IsOptional()
  @IsObject()
  boxOfficeDetails?: Record<string, unknown>;
}
