import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { PatchStandaloneChairDto } from './dto/patch-standalone-chair.dto';
import { PatchStandaloneChairsBulkPriceDto } from './dto/patch-standalone-chairs-bulk-price.dto';
import { UpsertStandaloneChairConfigDto } from './dto/upsert-standalone-chair-config.dto';
import { StandaloneChairsService } from './standalone-chairs.service';

@Controller('standalone-chairs')
export class StandaloneChairsController {
  constructor(private readonly standaloneChairsService: StandaloneChairsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getPublicStandaloneChairs() {
    return this.standaloneChairsService.getPublicStandaloneChairs();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminStandaloneChairs() {
    return this.standaloneChairsService.getAdminStandaloneChairs();
  }

  @Put('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  upsertAdminStandaloneChairs(@Body() dto: UpsertStandaloneChairConfigDto) {
    return this.standaloneChairsService.upsertAdminStandaloneChairs(dto);
  }

  @Patch('admin/bulk-price')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  patchAdminStandaloneChairsBulkPrice(@Body() dto: PatchStandaloneChairsBulkPriceDto) {
    return this.standaloneChairsService.patchAdminStandaloneChairsBulkPrice(dto);
  }

  @Delete('admin/all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAllAdminStandaloneChairs() {
    return this.standaloneChairsService.deleteAllAdminStandaloneChairs();
  }

  @Patch('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  patchAdminStandaloneChair(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PatchStandaloneChairDto,
  ) {
    return this.standaloneChairsService.patchAdminStandaloneChair(id, dto);
  }

  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAdminStandaloneChair(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.standaloneChairsService.deleteAdminStandaloneChair(id);
  }
}
