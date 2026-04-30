import { IsOptional, IsUUID } from 'class-validator';

export class CreateGalleryPhotoDto {
  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsUUID()
  serviceTypeId?: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  eventTypeId?: string;
}
