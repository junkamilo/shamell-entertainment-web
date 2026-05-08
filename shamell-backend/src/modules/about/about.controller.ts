import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { UpsertAboutContentDto } from './dto/upsert-about-content.dto';
import { AboutService } from './about.service';

@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getPublicAboutContent() {
    return this.aboutService.getPublicAboutContent();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminAboutContent() {
    return this.aboutService.getAdminAboutContent();
  }

  @Patch('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  upsertAdminAboutContent(
    @Body() dto: UpsertAboutContentDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    const hasBodyFields = Object.keys(dto).length > 0;
    if (!hasBodyFields && !imageFile) {
      throw new BadRequestException(
        'Provide at least one field or media file (image/video) to update.',
      );
    }
    return this.aboutService.upsertAdminAboutContent(dto, imageFile);
  }
}
