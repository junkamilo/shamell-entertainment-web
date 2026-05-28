import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationEventTemplateDto } from './create-reservation-event-template.dto';

export class UpdateReservationEventTemplateDto extends PartialType(
  CreateReservationEventTemplateDto,
) {}
