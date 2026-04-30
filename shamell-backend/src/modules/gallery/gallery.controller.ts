import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { CreateGalleryCategoryDto } from './dto/create-gallery-category.dto';
import { CreateGalleryPhotoDto } from './dto/create-gallery-photo.dto';
import { UpdateGalleryCategoryDto } from './dto/update-gallery-category.dto';
import { UpdateGalleryPhotoDto } from './dto/update-gallery-photo.dto';
import { GalleryService } from './gallery.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  getPublicCategories() {
    return this.galleryService.getPublicCategories();
  }

  @Get('photos')
  @HttpCode(HttpStatus.OK)
  getPublicPhotos(
    @Query('category') category?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.galleryService.getPublicPhotos({ category, page, limit });
  }

  @Get('admin/categories')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminCategories() {
    return this.galleryService.getAdminCategories();
  }

  @Post('admin/categories')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createCategory(@Body() dto: CreateGalleryCategoryDto) {
    return this.galleryService.createCategory(dto);
  }

  @Patch('admin/categories/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateCategory(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateGalleryCategoryDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    return this.galleryService.updateCategory(id, dto);
  }

  @Get('admin/photos')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminPhotos() {
    return this.galleryService.getAdminPhotos();
  }

  @Post('admin/photos')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  createPhoto(@Body() dto: CreateGalleryPhotoDto, @UploadedFile() imageFile?: Express.Multer.File) {
    if (!imageFile) {
      throw new BadRequestException('Image file is required.');
    }
    return this.galleryService.createPhoto(dto, imageFile);
  }

  @Patch('admin/photos/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  updatePhoto(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateGalleryPhotoDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    const hasBodyFields = Object.keys(dto).length > 0;
    if (!hasBodyFields && !imageFile) {
      throw new BadRequestException('Provide at least one field or image to update.');
    }
    return this.galleryService.updatePhoto(id, dto, imageFile);
  }

  @Delete('admin/photos/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deletePhoto(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.galleryService.deletePhoto(id);
  }
}
