import { EventTypeOccasionUsage } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class EventTypeOccasionAssignmentDto {
  @IsUUID()
  occasionTypeId!: string;

  @IsEnum(EventTypeOccasionUsage)
  usage!: EventTypeOccasionUsage;
}
