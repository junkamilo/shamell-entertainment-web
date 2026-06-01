import { IsNumber, Min } from 'class-validator';

export class PatchStandaloneChairDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}
