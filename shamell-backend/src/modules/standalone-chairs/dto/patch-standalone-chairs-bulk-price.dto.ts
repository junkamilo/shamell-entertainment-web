import { IsNumber, Min } from 'class-validator';

export class PatchStandaloneChairsBulkPriceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}
