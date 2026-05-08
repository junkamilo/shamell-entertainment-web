import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContactRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';

const PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

export class AdminContactQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ enum: PER_PAGE_OPTIONS, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(PER_PAGE_OPTIONS)
  perPage?: number = 10;

  @ApiPropertyOptional({ enum: ContactRequestStatus })
  @IsOptional()
  @IsEnum(ContactRequestStatus)
  status?: ContactRequestStatus;
}
