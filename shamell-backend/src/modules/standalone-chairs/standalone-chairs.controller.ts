import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
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
}
