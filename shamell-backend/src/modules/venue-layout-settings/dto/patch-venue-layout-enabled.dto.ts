import { IsBoolean } from 'class-validator';

export class PatchVenueLayoutEnabledDto {
  @IsBoolean()
  clientEnabled!: boolean;
}
