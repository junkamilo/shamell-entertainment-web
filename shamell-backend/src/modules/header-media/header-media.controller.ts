import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { HeaderMediaService } from './header-media.service';

@Controller('header-media')
export class HeaderMediaController {
  constructor(private readonly headerMediaService: HeaderMediaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getPublicHeaderPhotos() {
    return this.headerMediaService.getPublicHeaderPhotos();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminHeaderPhotos() {
    return this.headerMediaService.getAdminHeaderPhotos();
  }

  @Post('admin/photos')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FilesInterceptor('images', undefined, {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
    }),
  )
  uploadAdminHeaderPhotos(@UploadedFiles() files?: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('At least one image file is required.');
    }
    return this.headerMediaService.uploadAdminHeaderPhotos(files);
  }

  @Patch('admin/photos/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  toggleAdminHeaderPhoto(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: { isActive?: boolean },
  ) {
    if (typeof dto.isActive !== 'boolean') {
      throw new BadRequestException('isActive (boolean) is required.');
    }
    return this.headerMediaService.toggleAdminHeaderPhoto(id, dto.isActive);
  }

  @Delete('admin/photos/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAdminHeaderPhoto(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.headerMediaService.deleteAdminHeaderPhoto(id);
  }
}
