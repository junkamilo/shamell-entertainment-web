import { Type } from 'class-transformer';
import { IsNumber, Max, Min, ValidateNested } from 'class-validator';

export class FloorSceneZoneDto {
  @IsNumber()
  @Min(0)
  @Max(10000)
  x!: number;

  @IsNumber()
  @Min(0)
  @Max(10000)
  z!: number;

  @IsNumber()
  @Min(-Math.PI * 2)
  @Max(Math.PI * 2)
  rotationY!: number;
}

export class FloorSceneZonesDto {
  @ValidateNested()
  @Type(() => FloorSceneZoneDto)
  stage!: FloorSceneZoneDto;

  @ValidateNested()
  @Type(() => FloorSceneZoneDto)
  carpet!: FloorSceneZoneDto;
}
