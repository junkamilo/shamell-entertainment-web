import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  LAYOUT_SHAPE_KINDS,
  VENUE_TABLE_SIZES,
} from '../floor-layout.defaults';

export class PlacedLayoutItemDto {
  @IsString()
  @IsUUID('4')
  id!: string;

  @IsIn([...LAYOUT_SHAPE_KINDS])
  kind!: (typeof LAYOUT_SHAPE_KINDS)[number];

  @ValidateIf((o: PlacedLayoutItemDto) => o.kind === 'catalog_table')
  @IsString()
  @IsUUID('4')
  venueTableConfigId?: string;

  @ValidateIf((o: PlacedLayoutItemDto) => o.kind === 'catalog_table')
  @IsString()
  @MinLength(1)
  tableName?: string;

  @ValidateIf((o: PlacedLayoutItemDto) => o.kind === 'catalog_table')
  @IsIn([...VENUE_TABLE_SIZES])
  size?: (typeof VENUE_TABLE_SIZES)[number];

  @ValidateIf((o: PlacedLayoutItemDto) => o.kind === 'catalog_table')
  @IsInt()
  @Min(1)
  @Max(20)
  includedChairs?: number;

  @ValidateIf((o: PlacedLayoutItemDto) => o.kind === 'standalone_chair')
  @IsString()
  @IsUUID('4')
  venueStandaloneChairId?: string;

  @ValidateIf((o: PlacedLayoutItemDto) => o.kind === 'standalone_chair')
  @IsString()
  @MinLength(1)
  chairName?: string;

  @IsNumber()
  @Min(0)
  @Max(10000)
  x!: number;

  @IsNumber()
  @Min(0)
  @Max(10000)
  y!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  rotation!: number;
}
