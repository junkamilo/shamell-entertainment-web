import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { PatchVenueLayoutEnabledDto } from './dto/patch-venue-layout-enabled.dto';
import { UpsertVenueLayoutSettingsDto } from './dto/upsert-venue-layout-settings.dto';
import { VenueLayoutSettingsService } from './venue-layout-settings.service';

@Controller(['on-coming-events', 'venue-layout'])
export class VenueLayoutSettingsController {
  constructor(
    private readonly venueLayoutSettingsService: VenueLayoutSettingsService,
  ) {}

  @Get('settings')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
  getPublicSettings() {
    return this.venueLayoutSettingsService.getPublicSettings();
  }

  @Get('settings/admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminSettings() {
    return this.venueLayoutSettingsService.getAdminSettings();
  }

  @Patch('settings/admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  patchAdminSettings(@Body() dto: UpsertVenueLayoutSettingsDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    return this.venueLayoutSettingsService.upsertAdminSettings(dto);
  }

  @Patch('settings/admin/enabled')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  patchAdminEnabled(@Body() dto: PatchVenueLayoutEnabledDto) {
    return this.venueLayoutSettingsService.patchAdminEnabled(dto.clientEnabled);
  }

  @Patch('settings/admin/media')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FileInterceptor('media', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  upsertAdminPromoMedia(@UploadedFile() mediaFile?: Express.Multer.File) {
    if (!mediaFile) {
      throw new BadRequestException('Media file is required.');
    }
    return this.venueLayoutSettingsService.upsertAdminPromoMedia(mediaFile);
  }

  @Delete('settings/admin/media')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAdminPromoMedia() {
    return this.venueLayoutSettingsService.deleteAdminPromoMedia();
  }
}
