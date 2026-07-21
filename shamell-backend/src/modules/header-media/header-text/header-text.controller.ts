import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { UpsertHeaderTextDto } from './dto/upsert-header-text.dto';
import { HeaderTextService } from './header-text.service';

@Controller('header-text')
export class HeaderTextController {
  constructor(private readonly headerTextService: HeaderTextService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  getPublicHeaderText() {
    return this.headerTextService.getPublicHeaderText();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminHeaderText() {
    return this.headerTextService.getAdminHeaderText();
  }

  @Patch('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  upsertAdminHeaderText(@Body() dto: UpsertHeaderTextDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Provide at least one field to update header text.',
      );
    }
    return this.headerTextService.upsertAdminHeaderText(dto);
  }
}
