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
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  uploadAdminHeaderPhotos(@UploadedFiles() files?: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException(
        'At least one image or video file is required.',
      );
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

  @Patch('admin/photos/:id/focal')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateAdminHeaderPhotoFocalPoint(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    dto: {
      focalX?: number;
      focalY?: number;
      focalMobileX?: number;
      focalMobileY?: number;
    },
  ) {
    if (
      typeof dto.focalX !== 'number' ||
      !Number.isFinite(dto.focalX) ||
      dto.focalX < 0 ||
      dto.focalX > 100 ||
      typeof dto.focalY !== 'number' ||
      !Number.isFinite(dto.focalY) ||
      dto.focalY < 0 ||
      dto.focalY > 100 ||
      typeof dto.focalMobileX !== 'number' ||
      !Number.isFinite(dto.focalMobileX) ||
      dto.focalMobileX < 0 ||
      dto.focalMobileX > 100 ||
      typeof dto.focalMobileY !== 'number' ||
      !Number.isFinite(dto.focalMobileY) ||
      dto.focalMobileY < 0 ||
      dto.focalMobileY > 100
    ) {
      throw new BadRequestException(
        'focalX, focalY, focalMobileX and focalMobileY are required numbers between 0 and 100.',
      );
    }
    return this.headerMediaService.updateAdminHeaderPhotoFocalPoint(
      id,
      Math.round(dto.focalX),
      Math.round(dto.focalY),
      Math.round(dto.focalMobileX),
      Math.round(dto.focalMobileY),
    );
  }

  @Delete('admin/photos/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAdminHeaderPhoto(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.headerMediaService.deleteAdminHeaderPhoto(id);
  }
}
