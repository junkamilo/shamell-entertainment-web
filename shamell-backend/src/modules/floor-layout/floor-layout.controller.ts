import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../../common/auth/admin-jwt.guard';
import { UpsertFloorLayoutDto } from './dto/upsert-floor-layout.dto';
import { FloorLayoutService } from './floor-layout.service';

@Controller('floor-layout')
export class FloorLayoutController {
  constructor(private readonly floorLayoutService: FloorLayoutService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getPublicFloorLayout() {
    return this.floorLayoutService.getPublicFloorLayout();
  }

  @Get('admin/palette')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminPalette() {
    return this.floorLayoutService.getAdminPalette();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminFloorLayout() {
    return this.floorLayoutService.getAdminFloorLayout();
  }

  @Put('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  upsertAdminFloorLayout(@Body() dto: UpsertFloorLayoutDto) {
    return this.floorLayoutService.upsertAdminFloorLayout(dto);
  }
}
