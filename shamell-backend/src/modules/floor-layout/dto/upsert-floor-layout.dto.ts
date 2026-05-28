import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FloorSceneZonesDto } from './floor-scene-zone.dto';
import { PlacedLayoutItemDto } from './placed-layout-item.dto';

export class UpsertFloorLayoutDto {
  @IsOptional()
  @IsInt()
  @Min(400)
  @Max(4000)
  viewBoxWidth?: number;

  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(4000)
  viewBoxHeight?: number;

  @IsOptional()
  @IsString()
  backgroundVersion?: string;

  @IsArray()
  @ArrayMaxSize(250)
  @ValidateNested({ each: true })
  @Type(() => PlacedLayoutItemDto)
  items!: PlacedLayoutItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FloorSceneZonesDto)
  sceneZones?: FloorSceneZonesDto;
}
