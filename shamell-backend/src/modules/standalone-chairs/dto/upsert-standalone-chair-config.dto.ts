import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { STANDALONE_CHAIR_MAX_QUANTITY } from '../standalone-chairs.constants';

export class UpsertStandaloneChairConfigDto {
  @IsInt()
  @Min(0)
  @Max(STANDALONE_CHAIR_MAX_QUANTITY)
  availableQuantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}
