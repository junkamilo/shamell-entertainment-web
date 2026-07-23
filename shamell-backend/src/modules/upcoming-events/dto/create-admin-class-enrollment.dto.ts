import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export type AdminClassPurchaseKind = 'session' | 'day_bundle' | 'month_package';

export class CreateAdminClassEnrollmentDto {
  @IsIn(['session', 'day_bundle', 'month_package'])
  purchaseKind!: AdminClassPurchaseKind;

  @IsUUID('4')
  upcomingEventId!: string;

  @ValidateIf(
    (o: CreateAdminClassEnrollmentDto) => o.purchaseKind === 'session',
  )
  @IsUUID('4')
  sessionId?: string;

  @ValidateIf(
    (o: CreateAdminClassEnrollmentDto) => o.purchaseKind === 'day_bundle',
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  sessionIds?: string[];

  @ValidateIf(
    (o: CreateAdminClassEnrollmentDto) => o.purchaseKind === 'month_package',
  )
  @Matches(/^\d{4}-\d{2}$/)
  monthIso?: string;

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

  /** Box Office form snapshot; optional so Book Class keeps working without it. */
  @IsOptional()
  @IsObject()
  boxOfficeDetails?: Record<string, unknown>;
}
